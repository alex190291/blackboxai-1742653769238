from flask import Blueprint, render_template, send_from_directory, current_app
import os

debug_bp = Blueprint('debug', __name__, url_prefix='/debug')

@debug_bp.route('/')
def debug_page():
    """Render the debug page"""
    return render_template('debug.html')

@debug_bp.route('/js')
def debug_js():
    """Serve the debug.js file"""
    # Simplify the path resolution
    return send_from_directory('debug', 'debug.js')

@debug_bp.route('/integrator.js')
def debug_integrator_js():
    """Serve the integrator.js file"""
    return send_from_directory('debug', 'integrator.js')

# Add route for the generate-ui-examples.js file
@debug_bp.route('/generate-ui-examples.js')
def generate_ui_examples_js():
    """Serve the generate-ui-examples.js file"""
    return send_from_directory('debug', 'generate-ui-examples.js')

# Add a fallback route for static/js paths that might be requested
@debug_bp.route('/static/js/<path:filename>')
def static_js(filename):
    """Serve static JS files from the debug directory"""
    return send_from_directory('debug', filename)

# Add a route to handle /static/js/* at the app level
@debug_bp.route('/static-js/<path:filename>')
def app_static_js(filename):
    """Serve JS files from debug directory when requested from /static/js/"""
    return send_from_directory('debug', filename) 