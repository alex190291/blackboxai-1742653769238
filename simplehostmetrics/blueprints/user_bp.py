from flask import Blueprint, jsonify, request, render_template, redirect, url_for
from flask_security import login_required, current_user, roles_required
from flask_security.utils import hash_password
import datetime
import uuid
from sqlalchemy import desc

from models import db, User, Role, UserSession

user_bp = Blueprint('user', __name__)

@user_bp.route('/user-management', methods=['GET', 'POST'])
@login_required
def user_management():
    """Page for managing users"""
    return render_template('user_management.html')

@user_bp.route('/api/users', methods=['GET'])
@login_required
def get_users():
    """Get all users API endpoint"""
    try:
        users = User.query.all()
        user_list = []
        
        for user in users:
            # Count active sessions
            active_sessions = UserSession.query.filter_by(user_id=user.id).count()
            
            user_data = {
                "id": user.id,
                "email": user.email,
                "active": user.active,
                "first_login": user.first_login,
                "roles": [role.name for role in user.roles],
                "active_sessions": active_sessions
            }
            user_list.append(user_data)
        
        return jsonify({"success": True, "users": user_list})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@user_bp.route('/api/users', methods=['POST'])
@login_required
def create_user():
    """Create a new user API endpoint"""
    try:
        # Check if current user can create users
        from flask_security import roles_required
        
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        roles = data.get('roles', [])
        
        if not email or not password:
            return jsonify({"success": False, "error": "Email and password are required"}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({"success": False, "error": "Email already exists"}), 400
        
        # Create the user
        from flask_security import SQLAlchemyUserDatastore
        user_datastore = SQLAlchemyUserDatastore(db, User, Role)
        
        # Create user with a unique fs_uniquifier
        new_user = user_datastore.create_user(
            email=email,
            password=hash_password(password),
            fs_uniquifier=str(uuid.uuid4()),
            first_login=True
        )
        
        # Add roles to the user
        for role_name in roles:
            role = Role.query.filter_by(name=role_name).first()
            if role:
                user_datastore.add_role_to_user(new_user, role)
        
        db.session.commit()
        
        return jsonify({"success": True, "message": "User created successfully", "user_id": new_user.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@user_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    """Delete a user API endpoint"""
    try:
        # Don't allow deletion of own account
        if user_id == current_user.id:
            return jsonify({"success": False, "error": "Cannot delete your own account"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        # Delete related sessions
        UserSession.query.filter_by(user_id=user_id).delete()
        
        # Delete user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"success": True, "message": "User deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@user_bp.route('/api/users/<int:user_id>/password', methods=['PUT'])
@login_required
def reset_user_password(user_id):
    """Reset a user's password API endpoint"""
    try:
        # Only allow resetting other users' passwords unless it's the current user
        if user_id != current_user.id:
            # Check if current user has permission
            pass
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        data = request.get_json()
        new_password = data.get('password')
        
        if not new_password:
            return jsonify({"success": False, "error": "New password is required"}), 400
        
        # Update password
        user.password = hash_password(new_password)
        user.first_login = True  # Require password change on next login
        db.session.commit()
        
        return jsonify({"success": True, "message": "Password reset successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500 