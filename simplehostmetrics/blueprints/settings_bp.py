from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash
from flask_security import login_required, current_user
import yaml
import json
import time
import os
import requests
import docker
import pytz

settings_bp = Blueprint('settings', __name__, url_prefix='/settings')

# WireGuard API Settings from app.py
WG_API_URL = os.getenv('WG_API_URL', 'http://wireguard:421/api')
WG_PASSWORD = os.getenv('WG_PASSWORD', '')

# Import the NPM Token Manager from app.py for settings endpoints
class NPMTokenManager:
    def __init__(self, domain, identity, secret):
        self.domain = domain
        self.identity = identity
        self.secret = secret
        self.token = None
        self.token_expiry = 0

    def get_token(self):
        now = time.time()
        if self.token is None or now >= self.token_expiry:
            self.refresh_token()
        return self.token

    def refresh_token(self):
        token_url = f"http://{self.domain}/api/tokens"
        payload = {
            "identity": self.identity,
            "secret": self.secret
        }
        try:
            # Use the app logger in a blueprint-compatible way
            print(f"Requesting new NPM token from {token_url} with payload {payload}")
            token_response = requests.post(token_url, json=payload, verify=False)
            if token_response.status_code != 200:
                print(f"Token retrieval failed: {token_response.text}")
                raise Exception("Token retrieval failed")
            json_data = token_response.json()
            self.token = json_data.get("token")
            expires_in = json_data.get("expires_in", 3600)
            self.token_expiry = time.time() + expires_in - 60
            if not self.token:
                print("Token not found in response")
                raise Exception("Token not found in response")
            print(f"Obtained NPM token, expires in {expires_in} seconds")
        except requests.RequestException as e:
            print(f"Error retrieving token: {str(e)}")
            raise e


# Load config for NPM 
with open('config.yml', 'r') as f:
    config_data = yaml.safe_load(f)

npm_config = config_data.get("npm", {})
NPM_DOMAIN = npm_config.get("domain")
NPM_IDENTITY = npm_config.get("identity")
NPM_SECRET = npm_config.get("secret")
NPM_TOKEN_MANAGER = NPMTokenManager(NPM_DOMAIN, NPM_IDENTITY, NPM_SECRET)

# Helper function to get WireGuard session
def get_wg_session():
    session = requests.Session()
    if WG_PASSWORD:
        session.headers.update({
            'Authorization': f'Bearer {WG_PASSWORD}'
        })
    return session

@settings_bp.route('/', methods=['GET'])
@login_required
def settings():
    with open('config.yml', 'r') as f:
        config = yaml.safe_load(f)
    
    # Load relevant config sections
    npm_config = config.get('npm', {})
    wireguard_config = config.get('wireguard', {})
    log_config = config.get('logfiles', [])
    
    # Add debug flag for rendering
    debug_mode = config.get('debug', False)
    parse_all_logs = config.get('parse_all_logs', False)
    timezone = config.get('timezone', 'UTC')
    primary_color = config.get('primary_color', '#2d5a4f')
    
    # Docker container status
    docker_status = {
        'npm': {'running': False, 'installed': False, 'status': 'Not Installed'},
        'wireguard': {'running': False, 'installed': False, 'status': 'Not Installed'}
    }
    
    try:
        # Check Docker container status
        docker_client = docker.from_env()
        containers = docker_client.containers.list(all=True)
        for container in containers:
            if container.name == 'npm':
                docker_status['npm']['installed'] = True
                docker_status['npm']['running'] = container.status == 'running'
                docker_status['npm']['status'] = container.status
            elif container.name == 'wireguard':
                docker_status['wireguard']['installed'] = True
                docker_status['wireguard']['running'] = container.status == 'running'
                docker_status['wireguard']['status'] = container.status
    except Exception as e:
        print(f"Error checking Docker status: {str(e)}")
    
    try:
        # Get WireGuard status
        wg_session = get_wg_session()
        wg_status_response = wg_session.get(f"{wireguard_config.get('api_url', WG_API_URL)}/status")
        wireguard_status = wg_status_response.json() if wg_status_response.status_code == 200 else {"status": "unknown"}
        
        # Get NPM status
        token = NPM_TOKEN_MANAGER.get_token()
        npm_status_url = f"http://{npm_config.get('domain', NPM_DOMAIN)}/api/nginx/status"
        npm_status_response = requests.get(
            npm_status_url, 
            headers={"Authorization": f"Bearer {token}"},
            verify=False
        )
        npm_status = npm_status_response.json() if npm_status_response.status_code == 200 else {"status": "unknown"}
        
    except Exception as e:
        print(f"Error fetching service status: {str(e)}")
        wireguard_status = {"status": "error", "message": str(e)}
        npm_status = {"status": "error", "message": str(e)}

    return render_template(
        'settings.html',
        npm_config=npm_config,
        wireguard_config=wireguard_config,
        logfiles=log_config,
        debug_mode=debug_mode,
        parse_all_logs=parse_all_logs,
        npm_status=npm_status,
        wireguard_status=wireguard_status,
        timezone=timezone,
        primary_color=primary_color,
        docker_status=docker_status,
        all_timezones=pytz.all_timezones
    )

@settings_bp.route('/services', methods=['POST'])
@login_required
def update_services():
    try:
        data = request.get_json()
        
        with open('config.yml', 'r') as f:
            config = yaml.safe_load(f)
        
        # Update NPM config
        if 'npm' in data:
            npm_data = data['npm']
            if 'npm' not in config:
                config['npm'] = {}
            
            if 'domain' in npm_data:
                config['npm']['domain'] = npm_data['domain']
            if 'identity' in npm_data:
                config['npm']['identity'] = npm_data['identity']
            if 'secret' in npm_data:
                config['npm']['secret'] = npm_data['secret']
        
        # Update WireGuard config
        if 'wireguard' in data:
            wg_data = data['wireguard']
            if 'wireguard' not in config:
                config['wireguard'] = {}
            
            if 'api_url' in wg_data:
                config['wireguard']['api_url'] = wg_data['api_url']
        
        # Update log configuration
        if 'logfiles' in data:
            config['logfiles'] = data['logfiles']
        
        # Update parse_all_logs setting
        if 'parse_all_logs' in data:
            config['parse_all_logs'] = data['parse_all_logs']
        
        # Write updated config
        with open('config.yml', 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        
        # Create a new token manager with updated credentials
        if 'npm' in data:
            global NPM_TOKEN_MANAGER
            NPM_TOKEN_MANAGER = NPMTokenManager(
                config['npm'].get('domain'),
                config['npm'].get('identity'),
                config['npm'].get('secret')
            )
        
        return jsonify({"success": True, "message": "Settings updated successfully"})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@settings_bp.route('/preferences', methods=['POST'])
@login_required
def update_preferences():
    try:
        data = request.get_json()
        
        with open('config.yml', 'r') as f:
            config = yaml.safe_load(f)
        
        # Update debug mode
        if 'debug' in data:
            config['debug'] = data['debug']
        
        # Update timezone
        if 'timezone' in data:
            config['timezone'] = data['timezone']
        
        # Update primary color
        if 'primary_color' in data:
            config['primary_color'] = data['primary_color']
        
        # Write updated config
        with open('config.yml', 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        
        return jsonify({"success": True, "message": "Preferences updated successfully"})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@settings_bp.route('/update-credentials', methods=['POST'])
@login_required
def update_credentials():
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        email = data.get('email')
        
        # Verify current user password
        from flask_security.utils import verify_password, hash_password
        from models import db, User
        
        if not verify_password(current_password, current_user.password):
            return jsonify({"success": False, "error": "Current password is incorrect"}), 401
        
        # Update email if provided
        if email and email != current_user.email:
            # Check if email already exists
            if User.query.filter(User.id != current_user.id, User.email == email).first():
                return jsonify({"success": False, "error": "Email already in use"}), 400
            current_user.email = email
        
        # Update password if provided
        if new_password:
            current_user.password = hash_password(new_password)
            current_user.first_login = False
        
        db.session.commit()
        
        return jsonify({"success": True, "message": "Credentials updated successfully"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

# Add a new API endpoint for retrieving the default color
@settings_bp.route('/api/settings/default-color', methods=['GET'])
@login_required
def get_default_color():
    try:
        # Default color in the app
        DEFAULT_PRIMARY_COLOR = '#2d5a4f'
        
        return jsonify({
            "success": True, 
            "default_color": DEFAULT_PRIMARY_COLOR
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500 