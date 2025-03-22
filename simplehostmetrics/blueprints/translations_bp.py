from flask import Blueprint, send_from_directory
import os

translations_bp = Blueprint('translations', __name__, url_prefix='/translations')

@translations_bp.route('/<path:filename>')
def serve_translation(filename):
    """Serve translation files from the translations directory"""
    return send_from_directory(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'translations'), filename) 