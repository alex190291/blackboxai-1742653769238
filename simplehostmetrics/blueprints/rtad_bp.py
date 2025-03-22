from flask import Blueprint, render_template, jsonify, request
from flask_security import login_required
import rtad_manager
import logging

rtad_bp = Blueprint('rtad', __name__, url_prefix='/rtad')

@rtad_bp.route('/')
@login_required
def index():
    return render_template('rtad.html')

@rtad_bp.route('/api/status')
@login_required
def get_status():
    try:
        status = rtad_manager.get_status()
        return jsonify(status)
    except Exception as e:
        logging.error(f"Error getting RTAD status: {str(e)}")
        return jsonify({"error": str(e)}), 500

@rtad_bp.route('/api/start', methods=['POST'])
@login_required
def start_rtad():
    try:
        rtad_manager.start_rtad()
        return jsonify({"success": True})
    except Exception as e:
        logging.error(f"Error starting RTAD: {str(e)}")
        return jsonify({"error": str(e)}), 500

@rtad_bp.route('/api/stop', methods=['POST'])
@login_required
def stop_rtad():
    try:
        rtad_manager.stop_rtad()
        return jsonify({"success": True})
    except Exception as e:
        logging.error(f"Error stopping RTAD: {str(e)}")
        return jsonify({"error": str(e)}), 500

@rtad_bp.route('/api/restart', methods=['POST'])
@login_required
def restart_rtad():
    try:
        rtad_manager.restart_rtad()
        return jsonify({"success": True})
    except Exception as e:
        logging.error(f"Error restarting RTAD: {str(e)}")
        return jsonify({"error": str(e)}), 500

@rtad_bp.route('/api/logs')
@login_required
def get_logs():
    try:
        logs = rtad_manager.get_logs()
        return jsonify(logs)
    except Exception as e:
        logging.error(f"Error getting RTAD logs: {str(e)}")
        return jsonify({"error": str(e)}), 500

@rtad_bp.route('/api/config', methods=['GET', 'POST'])
@login_required
def handle_config():
    try:
        if request.method == 'GET':
            config = rtad_manager.get_config()
            return jsonify(config)
        else:
            new_config = request.json
            rtad_manager.update_config(new_config)
            return jsonify({"success": True})
    except Exception as e:
        logging.error(f"Error handling RTAD config: {str(e)}")
        return jsonify({"error": str(e)}), 500

@rtad_bp.route('/rtad_lastb')
@login_required
def get_lastb_data():
    """
    Return login attempt logs from the RTAD system.
    
    Query parameters:
    - last_id: Optional. If provided, only return records after this ID.
    """
    try:
        # Get login attempts from rtad_manager
        login_attempts = rtad_manager.fetch_login_attempts()
        
        # Check if we need to filter by last_id
        last_id = request.args.get('last_id')
        if last_id:
            try:
                last_id = int(last_id)
                # Filter to only include attempts with ID greater than last_id
                login_attempts = [attempt for attempt in login_attempts if attempt.get('id', 0) > last_id]
            except ValueError:
                logging.warning(f"Invalid last_id parameter: {last_id}")
        
        return jsonify(login_attempts)
    except Exception as e:
        logging.error(f"Error fetching login attempts: {str(e)}")
        return jsonify({"error": str(e)}), 500

@rtad_bp.route('/rtad_proxy')
@login_required
def get_proxy_data():
    """
    Return HTTP error logs from the RTAD system.
    
    Query parameters:
    - last_id: Optional. If provided, only return records after this ID.
    """
    try:
        # Get HTTP error logs from rtad_manager
        http_error_logs = rtad_manager.fetch_http_error_logs()
        
        # Check if we need to filter by last_id
        last_id = request.args.get('last_id')
        if last_id:
            try:
                last_id = int(last_id)
                # Filter to only include logs with ID greater than last_id
                http_error_logs = [log for log in http_error_logs if log.get('id', 0) > last_id]
            except ValueError:
                logging.warning(f"Invalid last_id parameter: {last_id}")
        
        return jsonify(http_error_logs)
    except Exception as e:
        logging.error(f"Error fetching HTTP error logs: {str(e)}")
        return jsonify({"error": str(e)}), 500

@rtad_bp.route('/api/attack_map_data')
@login_required
def get_attack_map_data():
    """
    Return geographical data for both login attempts and proxy events,
    formatted for the attack map visualization.
    """
    try:
        # Get login attempts and HTTP error logs
        login_attempts = rtad_manager.fetch_login_attempts()
        http_error_logs = rtad_manager.fetch_http_error_logs()
        
        # Combine data for the map
        map_data = []
        
        # Process login attempts
        for attempt in login_attempts:
            if 'lat' in attempt and 'lon' in attempt:
                map_data.append({
                    'type': 'login',
                    'ip_address': attempt.get('ip_address'),
                    'country': attempt.get('country'),
                    'city': attempt.get('city'),
                    'lat': attempt.get('lat'),
                    'lon': attempt.get('lon'),
                    'timestamp': attempt.get('timestamp'),
                    'user': attempt.get('user'),
                    'failure_reason': attempt.get('failure_reason')
                })
        
        # Process HTTP error logs
        for log in http_error_logs:
            if 'lat' in log and 'lon' in log:
                map_data.append({
                    'type': 'proxy',
                    'ip_address': log.get('ip_address'),
                    'country': log.get('country'),
                    'city': log.get('city'),
                    'lat': log.get('lat'),
                    'lon': log.get('lon'),
                    'timestamp': log.get('timestamp'),
                    'domain': log.get('domain'),
                    'error_code': log.get('error_code'),
                    'url': log.get('url')
                })
        
        # Sort by timestamp (newest first) and limit to 2000 entries
        map_data.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        map_data = map_data[:2000]
        
        return jsonify(map_data)
    except Exception as e:
        logging.error(f"Error fetching attack map data: {str(e)}")
        return jsonify({"error": str(e)}), 500 