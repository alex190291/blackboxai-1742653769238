from flask import Blueprint, render_template, redirect, url_for, flash
from flask_security import login_required, current_user
from models import db, User, Role
from flask_security.utils import hash_password
from flask_security import SQLAlchemyUserDatastore

auth_bp = Blueprint('auth', __name__)

# Create the user datastore
user_datastore = SQLAlchemyUserDatastore(db, User, Role)

def init_auth(app, config_data):
    """Initialize authentication with the Flask app"""
    # Set security configurations
    app.config['SECRET_KEY'] = config_data.get('secret_key', 'default-secret-key')
    app.config['SECURITY_PASSWORD_SALT'] = config_data.get('security_password_salt', 'default-salt')
    app.config['SECURITY_PASSWORD_HASH'] = 'bcrypt'
    app.config['SECURITY_PASSWORD_SINGLE_HASH'] = False
    app.config['SECURITY_REGISTERABLE'] = False
    app.config['SECURITY_SEND_REGISTER_EMAIL'] = False
    app.config['SECURITY_RECOVERABLE'] = False
    app.config['SECURITY_LOGIN_USER_TEMPLATE'] = 'login_user.html'

    # Create default admin user if no users exist
    with app.app_context():
        if User.query.count() == 0:
            default_admin_email = config_data.get('default_admin_email', 'admin@example.com')
            default_admin_password = config_data.get('default_admin_password', 'changeme')
            user_datastore.create_user(
                email=default_admin_email,
                password=hash_password(default_admin_password),
                first_login=True
            )
            db.session.commit()

@auth_bp.route('/login')
def login():
    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    return redirect(url_for('auth.login')) 