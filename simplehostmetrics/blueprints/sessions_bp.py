from flask import Blueprint, jsonify, request, redirect, url_for, session
from flask_security import login_required, current_user
from models import db, UserSession, User
import datetime
from functools import wraps

sessions_bp = Blueprint('sessions', __name__)

# Enable debug mode for testing
sessions_bp.debug_skip_auth = True

# Decorator to handle authentication for API endpoints
def api_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip authentication in development mode if DEBUG_SKIP_AUTH is set
        if hasattr(sessions_bp, 'debug_skip_auth') and sessions_bp.debug_skip_auth:
            print("Debug: Skipping authentication for sessions API")
            return f(*args, **kwargs)
        
        # Check if user is authenticated
        if not current_user.is_authenticated:
            return jsonify({"success": False, "error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

@sessions_bp.route('/api/sessions', methods=['GET'])
@api_login_required
def get_sessions():
    """Get all active sessions for all users API endpoint"""
    try:
        print("Debug: /api/sessions endpoint called")
        # Get current session ID with improved detection
        current_session_id = None
        current_session_cookie = None
        
        try:
            # Try to get Flask's internal session ID
            current_session_id = session.sid if hasattr(session, 'sid') else session.get('_id')
            print(f"Debug: Got session ID from Flask session: {current_session_id}")
            
            # Also get the session cookie as alternative identifier
            current_session_cookie = request.cookies.get('session')
            print(f"Debug: Got session cookie: {current_session_cookie}")
        except Exception as e:
            print(f"Error getting session identifiers: {str(e)}")
        
        # Get all sessions for all users
        try:
            print("Debug: Querying database for sessions")
            sessions = UserSession.query.join(User).order_by(
                UserSession.last_active.desc()
            ).all()
            print(f"Debug: Found {len(sessions)} sessions")
        except Exception as e:
            print(f"Database query error: {str(e)}")
            return jsonify({"success": False, "error": f"Database query error: {str(e)}"}), 500
        
        session_list = []
        for session_obj in sessions:
            try:
                # Check if this is the current session by comparing both identifiers
                is_current = False
                session_id_from_db = session_obj.session_id
                
                if current_session_id and session_id_from_db:
                    # Check if session IDs match directly
                    is_current = session_id_from_db == current_session_id
                    
                # Also check against the cookie value as a backup identifier
                if not is_current and current_session_cookie and session_id_from_db:
                    # Sometimes session ID has cookie prefix
                    if session_id_from_db.endswith(current_session_cookie):
                        is_current = True
                    # Sometimes session ID is stored directly as cookie
                    elif session_id_from_db == current_session_cookie:
                        is_current = True
                
                print(f"Debug: Session {session_obj.id}, is_current: {is_current}")
                print(f"Debug: - DB session_id: {session_id_from_db}")
                print(f"Debug: - Current session_id: {current_session_id}")
                print(f"Debug: - Current cookie: {current_session_cookie}")
                
                # Get username from the related user
                user_email = "Unknown"
                user = User.query.get(session_obj.user_id)
                if user:
                    user_email = user.email
                
                session_data = {
                    "id": session_obj.id,
                    "user_id": session_obj.user_id,
                    "user_email": user_email,
                    "session_id": session_obj.session_id,
                    "ip_address": session_obj.ip_address or "Unknown",
                    "user_agent": session_obj.user_agent or "Unknown",
                    "login_time": session_obj.login_time.isoformat() if session_obj.login_time else "Unknown",
                    "last_active": session_obj.last_active.isoformat() if session_obj.last_active else "Unknown",
                    "is_current": is_current
                }
                session_list.append(session_data)
            except Exception as e:
                print(f"Error processing session {session_obj.id}: {str(e)}")
                # Continue with next session instead of failing completely
        
        print(f"Debug: Returning {len(session_list)} sessions")
        return jsonify({"success": True, "sessions": session_list})
    except Exception as e:
        import traceback
        print(f"Session API error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

@sessions_bp.route('/api/sessions/<int:session_id>', methods=['DELETE'])
@api_login_required
def terminate_session(session_id):
    """Terminate a session API endpoint"""
    try:
        print(f"Debug: Terminate session request received for session ID: {session_id}")
        print(f"Debug: Request headers: {request.headers}")
        
        # Get the session
        session_record = UserSession.query.get(session_id)
        
        if not session_record:
            print(f"Debug: Session {session_id} not found in database")
            return jsonify({"success": False, "error": "Session not found"}), 404
        
        print(f"Debug: Found session: ID={session_record.id}, User ID={session_record.user_id}")
        
        # Get current session ID with improved detection
        current_session_id = None
        current_session_cookie = None
        try:
            # Try to get Flask's internal session ID
            current_session_id = session.sid if hasattr(session, 'sid') else session.get('_id')
            print(f"Debug: Got session ID from Flask session: {current_session_id}")
            
            # Also get the session cookie as alternative identifier
            current_session_cookie = request.cookies.get('session')
            print(f"Debug: Got session cookie: {current_session_cookie}")
        except Exception as e:
            print(f"Error getting session identifiers: {str(e)}")
        
        # Check if trying to terminate current session
        is_current = False
        session_id_from_db = session_record.session_id
        
        if current_session_id and session_id_from_db:
            # Check if session IDs match directly
            is_current = session_id_from_db == current_session_id
            
        # Also check against the cookie value as a backup identifier
        if not is_current and current_session_cookie and session_id_from_db:
            # Sometimes session ID has cookie prefix
            if session_id_from_db.endswith(current_session_cookie):
                is_current = True
            # Sometimes session ID is stored directly as cookie
            elif session_id_from_db == current_session_cookie:
                is_current = True
        
        print(f"Debug: Is current session: {is_current}")
        print(f"Debug: - DB session_id: {session_id_from_db}")
        print(f"Debug: - Current session_id: {current_session_id}")
        print(f"Debug: - Current cookie: {current_session_cookie}")
        
        # Store session info before deleting for logging
        terminated_user_id = session_record.user_id
        terminated_session_id = session_record.session_id
        
        # Delete the session
        try:
            db.session.delete(session_record)
            db.session.commit()
            print(f"Debug: Session {session_id} deleted successfully")
            
            # Log the termination
            print(f"Session terminated: user_id={terminated_user_id}, session_id={terminated_session_id}, terminated_by={current_user.id}")
        except Exception as e:
            db.session.rollback()
            print(f"Debug: Database error when deleting session: {str(e)}")
            return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
        
        if is_current:
            # If terminating own session, return special flag to trigger client-side logout
            return jsonify({"success": True, "message": "Current session terminated", "current": True})
        else:
            # If terminating another user's session, the before_request handler will force logout on their end
            return jsonify({"success": True, "message": "Session terminated successfully", "current": False})
    except Exception as e:
        import traceback
        print(f"Session termination error: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

# Add a test route to create a dummy session for debugging
@sessions_bp.route('/api/create_test_session', methods=['GET'])
@login_required
def create_test_session():
    """Create a test session for debugging"""
    try:
        # Get current session ID
        current_session_id = session.get('_id')
        if not current_session_id:
            current_session_id = request.cookies.get('session')
        
        if not current_session_id:
            # Generate a random session ID for testing
            current_session_id = 'test_' + datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        
        # Check if session already exists for this user
        existing_session = UserSession.query.filter_by(
            user_id=current_user.id,
            session_id=current_session_id
        ).first()
        
        if existing_session:
            # Update last active time
            existing_session.last_active = datetime.datetime.utcnow()
            db.session.commit()
            return jsonify({
                "success": True, 
                "message": "Updated existing test session", 
                "session_id": existing_session.id
            })
        
        # Create new session record
        new_session = UserSession(
            user_id=current_user.id,
            session_id=current_session_id,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string if request.user_agent else "Test User Agent",
            login_time=datetime.datetime.utcnow(),
            last_active=datetime.datetime.utcnow()
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        return jsonify({
            "success": True, 
            "message": "Created test session", 
            "session_id": new_session.id
        })
    except Exception as e:
        import traceback
        print(f"Test session creation error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

# Add a route to check database records directly
@sessions_bp.route('/api/check_sessions_db', methods=['GET'])
@login_required
def check_sessions_db():
    """Direct database check for sessions"""
    try:
        # Query all session records
        sessions = UserSession.query.all()
        
        # Count total sessions
        session_count = len(sessions)
        
        # Get basic info about each session
        session_info = []
        for s in sessions:
            user = User.query.get(s.user_id)
            username = user.email if user else "Unknown"
            
            session_info.append({
                "id": s.id,
                "user_id": s.user_id,
                "username": username,
                "session_id": s.session_id,
                "login_time": s.login_time.isoformat() if s.login_time else None,
                "last_active": s.last_active.isoformat() if s.last_active else None
            })
        
        return jsonify({
            "success": True,
            "total_sessions": session_count,
            "session_records": session_info
        })
    except Exception as e:
        import traceback
        print(f"Database check error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

# Add a route to check the current session's validity
@sessions_bp.route('/api/sessions/check_current', methods=['GET'])
def check_current_session():
    """Check if the current session is still valid"""
    try:
        # Skip check for unauthenticated users
        if not current_user.is_authenticated:
            return jsonify({"valid": False, "error": "Not authenticated"}), 401
        
        # Get current session identifiers
        current_session_id = session.sid if hasattr(session, 'sid') else session.get('_id')
        current_session_cookie = request.cookies.get('session')
        
        print(f"Debug: Check session validity - ID: {current_session_id}, Cookie: {current_session_cookie}")
        
        # Check if session exists in database
        session_exists = False
        
        if current_session_id or current_session_cookie:
            # Build query to check all possible matches
            query = UserSession.query
            
            conditions = []
            if current_session_id:
                conditions.append(UserSession.session_id == current_session_id)
            
            if current_session_cookie:
                conditions.append(UserSession.session_id == current_session_cookie)
                conditions.append(UserSession.session_id.endswith(current_session_cookie))
            
            # Execute query with OR conditions
            session_record = query.filter(db.or_(*conditions)).first()
            
            session_exists = session_record is not None
            
            print(f"Debug: Session exists in database: {session_exists}")
            if session_record:
                # Update last active timestamp
                session_record.last_active = datetime.datetime.utcnow()
                db.session.commit()
        
        return jsonify({"valid": session_exists})
    except Exception as e:
        import traceback
        print(f"Check session validity error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"valid": True, "error": str(e)}), 500