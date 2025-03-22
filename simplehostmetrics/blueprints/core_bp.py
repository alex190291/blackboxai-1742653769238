from flask import Blueprint, render_template, redirect, url_for, make_response
from flask_security import login_required

core_bp = Blueprint('core', __name__)

@core_bp.route('/')
@login_required
def dashboard():
    """Default route for the dashboard"""
    return render_template('index.html',
                         cpu_usage=75,
                         memory_usage=60,
                         disk_usage=45,
                         network_upload="1.2 MB/s",
                         network_download="2.5 MB/s",
                         containers=[
                             {
                                 'name': 'nginx-proxy',
                                 'status': 'running',
                                 'cpu': 2.5,
                                 'memory': 15
                             },
                             {
                                 'name': 'wireguard',
                                 'status': 'stopped',
                                 'cpu': 0,
                                 'memory': 0
                             }
                         ])

@core_bp.route('/set_language/<language>')
def set_language(language):
    """Set the user's preferred language"""
    response = make_response(redirect(url_for('core.tailwind_dashboard')))
    response.set_cookie('locale', language, max_age=60*60*24*365)
    return response

@core_bp.route('/tailwind')
@login_required
def tailwind_dashboard():
    """Test route for Tailwind CSS version of the dashboard"""
    return render_template('index_tailwind.html',
                         cpu_usage=75,
                         memory_usage=60,
                         disk_usage=45,
                         network_upload="1.2 MB/s",
                         network_download="2.5 MB/s",
                         containers=[
                             {
                                 'name': 'nginx-proxy',
                                 'status': 'running',
                                 'cpu': 2.5,
                                 'memory': 15
                             },
                             {
                                 'name': 'wireguard',
                                 'status': 'stopped',
                                 'cpu': 0,
                                 'memory': 0
                             }
                         ])