from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, Response, send_file, abort, make_response, send_from_directory
from flask_babel import Babel, gettext, ngettext
import threading
import logging
import time
import yaml
import requests
import docker
import os
import secrets
import string
from urllib.parse import urljoin
import datetime
import uuid
import pytz
import re
import sys
import json
import base64
import socket
from werkzeug.middleware.proxy_fix import ProxyFix

# Keep existing imports
from flask_sqlalchemy import SQLAlchemy
from flask_security.utils import hash_password
from flask_security import Security, SQLAlchemyUserDatastore, login_required, current_user
from flask_security.signals import user_authenticated
from flask import session
from flask_wtf.csrf import CSRFProtect  # Add CSRF protection

import rtad_manager
from models import db, User, Role, CustomNetworkGraph, UserSession
import stats
import docker_manager
from custom_network import custom_network_bp
from database import initialize_database, load_history
import stats_collection  # Import the new stats_collection module
import rtad_collection   # Import the new rtad_collection module

# Flask-Assets for SCSS compilation
from flask_assets import Environment, Bundle

# Import blueprints
from blueprints.auth_bp import auth_bp, init_auth
from blueprints.wireguard_bp import wireguard_bp
from blueprints.npm_bp import npm_bp, init_npm
from blueprints.stats_bp import stats_bp
from blueprints.rtad_bp import rtad_bp

# Import the new blueprints
from blueprints.settings_bp import settings_bp
from blueprints.docker_bp import docker_bp
from blueprints.user_bp import user_bp
from blueprints.debug_bp import debug_bp
from blueprints.translations_bp import translations_bp
from blueprints.core_bp import core_bp
from blueprints.docker_stats_bp import docker_stats_bp
from blueprints.sessions_bp import sessions_bp

# Enable debug mode for session API - REMOVE IN PRODUCTION
if os.environ.get('ENABLE_DEBUG_SESSIONS', 'false').lower() == 'true':
    print("DEBUG MODE: Session API authentication will be bypassed!")
    setattr(sessions_bp, 'debug_skip_auth', True)

# Load configuration from config.yml
with open('config.yml', 'r') as f:
    config_data = yaml.safe_load(f)

# Generate secure random keys if they don't exist or are using default values
config_updated = False
if 'secret_key' not in config_data or config_data['secret_key'] == 'default-secret-key' or config_data['secret_key'] == 'S3cUr3K3y!@#123':
    # Generate a random 32-character string
    config_data['secret_key'] = ''.join(secrets.choice(string.ascii_letters + string.digits + string.punctuation) for _ in range(32))
    config_updated = True

if 'security_password_salt' not in config_data or config_data['security_password_salt'] == 'default-salt' or config_data['security_password_salt'] == 'S3cUr3S@lt!@#123':
    # Generate a random 24-character string
    config_data['security_password_salt'] = ''.join(secrets.choice(string.ascii_letters + string.digits + string.punctuation) for _ in range(24))
    config_updated = True

# Save the updated config if changes were made
if config_updated:
    with open('config.yml', 'w') as f:
        yaml.dump(config_data, f, default_flow_style=False)
    print("Generated secure random values for secret_key and security_password_salt")

app = Flask(__name__)

# Apply ProxyFix middleware for running behind a reverse proxy
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# Add HTTPS configuration
app.config['PREFERRED_URL_SCHEME'] = 'https'

# Babel configuration
app.config['BABEL_DEFAULT_LOCALE'] = 'en'
app.config['LANGUAGES'] = {
    'en': 'English',
    'de': 'Deutsch',
    'es': 'Español',
    'fr': 'Français',
    'it': 'Italiano'
}

def get_locale():
    # Try to get locale from session
    locale = request.cookies.get('locale')
    if locale and locale in app.config['LANGUAGES']:
        return locale
    # Try to get locale from browser
    return request.accept_languages.best_match(app.config['LANGUAGES'].keys())

# Initialize Babel with the app and make get_locale available to templates
babel = Babel(app, locale_selector=get_locale)
app.jinja_env.globals.update(get_locale=get_locale)

# Set secret keys and other settings from config file
app.config['DEBUG'] = False
app.config['SECRET_KEY'] = config_data.get('secret_key', 'default-secret-key')
app.config['SECURITY_PASSWORD_SALT'] = config_data.get('security_password_salt', 'default-salt')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../stats.db'
app.config['SECURITY_PASSWORD_HASH'] = 'bcrypt'
app.config['SECURITY_PASSWORD_SINGLE_HASH'] = False
app.config['SECURITY_REGISTERABLE'] = False
app.config['SECURITY_SEND_REGISTER_EMAIL'] = False
app.config['SECURITY_RECOVERABLE'] = False
app.config['SECURITY_LOGIN_USER_TEMPLATE'] = 'login_user.html'

# Session management settings
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(days=30)
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Balance between security and usability

# CSRF Protection
csrf = CSRFProtect(app)
app.config['WTF_CSRF_ENABLED'] = True

# Exempt session API endpoints from CSRF protection
@csrf.exempt
def csrf_exempt_sessions():
    return request.path.startswith('/api/sessions') or request.path.startswith('/api/users')

# Add a before_request handler to validate sessions
@app.before_request
def check_session_validity():
    # Skip for login, logout, static files, and API endpoints
    if (request.path.startswith('/static/') or
        request.path == '/login' or
        request.path == '/logout' or
        request.path.startswith('/api/')):
        return
    
    # Only check for authenticated users
    if current_user.is_authenticated:
        # Get the session ID
        current_session_id = session.sid if hasattr(session, 'sid') else session.get('_id')
        if not current_session_id:
            current_session_id = request.cookies.get('session')
        
        if current_session_id:
            # Check if this session exists in our database
            session_exists = UserSession.query.filter(
                (UserSession.session_id == current_session_id) | 
                (UserSession.session_id.endswith(current_session_id))
            ).first()
            
            if not session_exists:
                # Session has been terminated by another user - force logout
                print(f"Debug: Session {current_session_id} not in database - forcing logout")
                from flask_security.utils import logout_user
                logout_user()
                flash('Your session has been terminated.', 'warning')
                return redirect(url_for('auth.login'))

app.config['npm'] = config_data.get('npm', {})

# Initialize Flask-Assets
assets = Environment(app)

# Ensure the static/scss directory exists
scss_dir = os.path.join(app.root_path, 'static/scss')

# Set the asset directories
assets.load_path = [scss_dir]
assets.url = app.static_url_path

""" # Define the SCSS bundle using libsass
scss_bundle = Bundle(
    'main.scss',
    depends=['**/*.scss'],
    filters='libsass',
    output='style.css'
)

try:
    assets.register('scss_all', scss_bundle)
    scss_bundle.build()
except Exception as e:
    app.logger.error(f"Error building SCSS: {str(e)}") """

# Initialize SQLAlchemy with our app
db.init_app(app)

# Create the user datastore
user_datastore = SQLAlchemyUserDatastore(db, User, Role)

# Initialize Flask-Security extension BEFORE creating default user
security = Security(app, user_datastore)

with app.app_context():
    # Create tables for User, Role, CustomNetworkGraph, etc.
    db.create_all()
    default_admin_email = config_data.get('default_admin_email', 'admin@example.com')
    default_admin_password = config_data.get('default_admin_password', 'changeme')
    if User.query.count() == 0:
        user_datastore.create_user(
            email=default_admin_email,
            password=hash_password(default_admin_password),
            first_login=True
        )
        db.session.commit()

# Register existing blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(wireguard_bp)
app.register_blueprint(npm_bp)
app.register_blueprint(stats_bp)
app.register_blueprint(rtad_bp)
app.register_blueprint(custom_network_bp)

# Register the new blueprints
app.register_blueprint(settings_bp)
app.register_blueprint(docker_bp)
app.register_blueprint(docker_stats_bp)
app.register_blueprint(user_bp)
app.register_blueprint(debug_bp)
app.register_blueprint(translations_bp)
app.register_blueprint(core_bp)
app.register_blueprint(sessions_bp)

# Add route to handle /static/js/generate-ui-examples.js
@app.route('/static/js/<path:filename>')
def static_js_redirect(filename):
    """Serve debug JS files directly from the debug directory"""
    if filename in ['generate-ui-examples.js', 'test-ui-generator.js']:
        return send_from_directory('debug', filename)
    # Fall back to normal static file handling for other files
    return send_from_directory(os.path.join(app.static_folder, 'js'), filename)

# Initialize the NPM token manager
try:
    logging.info("Initializing NPM configuration")
    if 'npm' in config_data:
        init_npm(app, config_data)
    else:
        logging.warning("NPM configuration not found in config.yml")
except Exception as e:
    logging.error(f"Failed to initialize NPM: {str(e)}")

# Initialize the legacy database schema and load history data
initialize_database()
history_data = {
    'cpu_history': stats.cpu_history,
    'memory_history_basic': stats.memory_history_basic,
    'disk_history_basic': stats.disk_history_basic,
    'cpu_history_24h': stats.cpu_history_24h,
    'memory_history_24h': stats.memory_history_24h,
    'disk_history': stats.disk_history,
    'network_history': stats.network_history
}
load_history(history_data)

# Set NPM domain and API URL from config_data
NPM_DOMAIN = config_data["npm"]["domain"]
NPM_API_URL = f"http://{NPM_DOMAIN}/api"
docker_client = docker.from_env()

# Create a user_authenticated signal handler to track sessions
@user_authenticated.connect_via(app)
def on_user_authenticated(sender, user, **extra):
    """Record user session when they log in"""
    print(f"Debug: User authenticated: {user.email}")
    
    # Try to get Flask's session ID 
    session_id = session.sid if hasattr(session, 'sid') else session.get('_id')
    print(f"Debug: Session ID from Flask session: {session_id}")
    
    # Try cookie as backup
    if not session_id:
        session_id = request.cookies.get('session')
        print(f"Debug: Session ID from cookies: {session_id}")
    
    if not session_id:
        print("Debug: No session ID found, skipping session creation")
        return
    
    # Get IP and user agent
    ip_address = request.remote_addr
    user_agent = request.user_agent.string if request.user_agent else None
    print(f"Debug: IP: {ip_address}, User-Agent: {user_agent}")
    
    # Check if session already exists
    existing_session = UserSession.query.filter_by(session_id=session_id).first()
    if existing_session:
        print(f"Debug: Session already exists, updating last_active time")
        # Update last active time
        existing_session.last_active = datetime.datetime.utcnow()
        db.session.commit()
        return
    
    print(f"Debug: Creating new session record with session_id: {session_id}")
    # Create new session record
    new_session = UserSession(
            user_id=user.id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            login_time=datetime.datetime.utcnow(),
            last_active=datetime.datetime.utcnow()
    )
    
    db.session.add(new_session)
    db.session.commit()
    print(f"Debug: New session created with ID: {new_session.id}")

# Start the metrics collection threads
def start_collection_threads():
    """Start the background threads for collecting metrics"""
    # Start the main stats collection thread
    stats_collection.start_stats_collection()
    
    # Start individual stat collector threads
    cpu_thread = threading.Thread(target=stats_collection.collect_cpu_stats)
    cpu_thread.daemon = True
    cpu_thread.start()
    
    mem_thread = threading.Thread(target=stats_collection.collect_memory_stats)
    mem_thread.daemon = True
    mem_thread.start()
    
    disk_thread = threading.Thread(target=stats_collection.collect_disk_stats)
    disk_thread.daemon = True
    disk_thread.start()
    
    net_thread = threading.Thread(target=stats_collection.collect_network_stats)
    net_thread.daemon = True
    net_thread.start()
    
    # Start RTAD thread if configured
    rtad_thread = threading.Thread(target=rtad_collection.rtad_main)
    rtad_thread.daemon = True
    rtad_thread.start()

# Start the collection threads when the application starts
start_collection_threads()

# Enables and disables the in-app debug tab
debug_tab=True

# Add debug_tab to the global template context
@app.context_processor
def inject_debug_tab():
    return {"debug_tab": debug_tab}

# Run the app if this file is executed directly
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
