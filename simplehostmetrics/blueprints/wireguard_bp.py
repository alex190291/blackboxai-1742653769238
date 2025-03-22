from flask import Blueprint, render_template, jsonify, request
from flask_security import login_required
import requests
import os

wireguard_bp = Blueprint('wireguard', __name__, url_prefix='/wireguard')

# WireGuard API Settings
WG_API_URL = os.getenv('WG_API_URL', 'http://wireguard:421/api')
WG_PASSWORD = os.getenv('WG_PASSWORD', '')  # Default password or get from env

def get_wg_session():
    session = requests.Session()
    if WG_PASSWORD:
        session.headers.update({
            'Authorization': f'Bearer {WG_PASSWORD}'
        })
    return session

@wireguard_bp.route('/')
@login_required
def index():
    return render_template('wg.html')

@wireguard_bp.route('/api/clients')
@login_required
def get_clients():
    try:
        session = get_wg_session()
        response = session.get(f"{WG_API_URL}/wireguard/client")
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch clients"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@wireguard_bp.route('/api/create', methods=['POST'])
@login_required
def create_client():
    try:
        client_name = request.json.get('name')
        if not client_name:
            return jsonify({"error": "Client name is required"}), 400
        
        session = get_wg_session()
        response = session.post(f"{WG_API_URL}/wireguard/client", json={"name": client_name})
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to create client"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@wireguard_bp.route('/api/client/<client_id>', methods=['DELETE'])
@login_required
def delete_client(client_id):
    try:
        session = get_wg_session()
        response = session.delete(f"{WG_API_URL}/wireguard/client/{client_id}")
        
        if response.status_code == 200:
            return jsonify({"success": True})
        else:
            return jsonify({"error": "Failed to delete client"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@wireguard_bp.route('/api/client/<client_id>/enable', methods=['POST'])
@login_required
def toggle_client(client_id):
    try:
        enabled = request.json.get('enabled', True)
        session = get_wg_session()
        
        response = session.post(
            f"{WG_API_URL}/wireguard/client/{client_id}/enable",
            json={"enabled": enabled}
        )
        
        if response.status_code == 200:
            return jsonify({"success": True})
        else:
            return jsonify({"error": "Failed to update client status"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@wireguard_bp.route('/api/client/<client_id>/qrcode')
@login_required
def get_qrcode(client_id):
    try:
        session = get_wg_session()
        response = session.get(f"{WG_API_URL}/wireguard/client/{client_id}/qrcode")
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch QR code"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@wireguard_bp.route('/api/client/<client_id>/config')
@login_required
def get_client_config(client_id):
    try:
        session = get_wg_session()
        response = session.get(f"{WG_API_URL}/wireguard/client/{client_id}/configuration")
        
        if response.status_code == 200:
            config = response.text
            return config, 200, {'Content-Type': 'text/plain', 'Content-Disposition': f'attachment; filename=wg-{client_id}.conf'}
        else:
            return jsonify({"error": "Failed to fetch client configuration"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500 