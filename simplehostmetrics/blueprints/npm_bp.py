from flask import Blueprint, render_template, jsonify, request, current_app, Response
from flask_security import login_required
import requests
import time
import logging

npm_bp = Blueprint('npm', __name__, url_prefix='/npm')

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
            logging.debug(f"Requesting new NPM token from {token_url}")
            token_response = requests.post(token_url, json=payload, verify=False)
            if token_response.status_code != 200:
                logging.error(f"Token retrieval failed: {token_response.text}")
                raise Exception("Token retrieval failed")
            json_data = token_response.json()
            self.token = json_data.get("token")
            expires_in = json_data.get("expires_in", 3600)
            self.token_expiry = time.time() + expires_in - 60
            if not self.token:
                logging.error("Token not found in response")
                raise Exception("Token not found in response")
            logging.debug(f"Obtained NPM token, expires in {expires_in} seconds")
        except requests.RequestException as e:
            logging.error(f"Error retrieving token: {str(e)}")
            raise e

def init_npm(app, config_data):
    """Initialize NPM configuration"""
    try:
        npm_config = config_data.get("npm", {})
        domain = npm_config.get("domain")
        identity = npm_config.get("identity")
        secret = npm_config.get("secret")
        
        if not domain:
            logging.error("NPM configuration error: missing 'domain' in config.yml")
            raise ValueError("Missing NPM domain configuration")
            
        if not identity:
            logging.error("NPM configuration error: missing 'identity' in config.yml")
            raise ValueError("Missing NPM identity configuration")
            
        if not secret:
            logging.error("NPM configuration error: missing 'secret' in config.yml")
            raise ValueError("Missing NPM secret configuration")
        
        logging.info(f"Initializing NPM configuration with domain: {domain}")
        app.config['npm_token_manager'] = NPMTokenManager(domain, identity, secret)
        app.config['npm_domain'] = domain
        app.config['npm_api_url'] = f"http://{domain}/api"
        
        # Verify token manager access
        token = app.config['npm_token_manager'].get_token()
        logging.info(f"Successfully obtained NPM token, configuration is valid")
        
        return True
    except Exception as e:
        logging.error(f"Failed to initialize NPM configuration: {str(e)}")
        # Don't raise the exception, but return False to indicate failure
        return False

@npm_bp.route('/')
@login_required
def index():
    return render_template('npm.html', npm_domain=current_app.config.get('npm_domain', ''))

@npm_bp.route('/api/packages')
@login_required
def get_packages():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/packages",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch packages"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/package/<package_name>')
@login_required
def get_package_info(package_name):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/packages/{package_name}",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch package info"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api')
@login_required
def api_root():
    """Base API endpoint that serves as a health check"""
    try:
        # Don't try to forward to NPM API, just return a simple status OK
        return jsonify({"status": "OK"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/')
@login_required
def api_root_slash():
    """Base API endpoint with trailing slash that serves as a health check"""
    return api_root()

@npm_bp.route('/api/nginx/certificates')
@login_required
def get_certificates():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/nginx/certificates",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch certificates"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/certificates', methods=['POST'])
@login_required
def create_certificate():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        # Check if this is a DNS validation request
        is_dns_challenge = False
        if request.json and request.json.get('meta', {}).get('dns_challenge'):
            is_dns_challenge = True
            # Set a longer timeout for DNS challenges
            timeout = 10  # seconds
        else:
            timeout = 5  # default timeout
        
        # Forward the request body to NPM
        try:
            response = requests.post(
                f"{current_app.config['npm_api_url']}/nginx/certificates",
                headers=headers,
                json=request.json,
                verify=False,
                timeout=timeout
            )
            
            if response.status_code == 200 or response.status_code == 201:
                # Try to parse the response
                try:
                    response_data = response.json()
                    # Log what we get back from NPM
                    logging.debug(f"Certificate creation response from NPM: {response_data}")
                    return jsonify(response_data), response.status_code
                except Exception as json_err:
                    # If we can't parse JSON but got a success code, create our own response with an ID
                    logging.warning(f"Could not parse certificate creation response: {str(json_err)}. Raw response: {response.text}")
                    # Generate a placeholder ID for the client
                    new_id = int(time.time())
                    return jsonify({"id": new_id, "meta": {"status": "processing"}}), 201
            else:
                logging.error(f"Failed to create certificate: HTTP {response.status_code}. Response: {response.text}")
                return jsonify({"error": f"Failed to create certificate: HTTP {response.status_code}"}), response.status_code
        except requests.exceptions.Timeout:
            # Handle timeout differently for DNS challenges vs regular requests
            if is_dns_challenge:
                # For DNS challenges, timeouts are common because validation can take time
                # Return a success response with a special status indicating it's processing
                logging.info("DNS challenge certificate creation timed out, but this is expected. Returning processing status.")
                new_id = int(time.time())
                return jsonify({
                    "id": new_id,
                    "meta": {
                        "status": "processing",
                        "message": "Certificate request submitted but response timed out. Check status later."
                    }
                }), 202  # Accepted
            else:
                # For regular certificates, timeouts are unexpected
                logging.error("Certificate creation request timed out")
                return jsonify({"error": "Certificate creation request timed out"}), 504  # Gateway Timeout
    except Exception as e:
        logging.exception(f"Exception creating certificate: {str(e)}")
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/access-lists')
@login_required
def get_access_lists():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/nginx/access-lists",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch access lists"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/proxy-hosts')
@login_required
def get_proxy_hosts():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
        
        if 'npm_api_url' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_api_url is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/nginx/proxy-hosts",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch proxy hosts"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/redirection-hosts')
@login_required
def get_redirection_hosts():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/nginx/redirection-hosts",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch redirection hosts"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Redirection hosts specific endpoints
@npm_bp.route('/api/nginx/redirection-hosts/<int:host_id>', methods=['GET'])
@login_required
def get_redirection_host(host_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/nginx/redirection-hosts/{host_id}",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch redirection host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/redirection-hosts/<int:host_id>/disable', methods=['POST'])
@login_required
def disable_redirection_host(host_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.post(
            f"{current_app.config['npm_api_url']}/nginx/redirection-hosts/{host_id}/disable",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to disable redirection host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/redirection-hosts/<int:host_id>/enable', methods=['POST'])
@login_required
def enable_redirection_host(host_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.post(
            f"{current_app.config['npm_api_url']}/nginx/redirection-hosts/{host_id}/enable",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to enable redirection host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Proxy hosts
@npm_bp.route('/api/nginx/proxy-hosts/<int:proxy_id>', methods=['GET'])
@login_required
def get_proxy_host(proxy_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/nginx/proxy-hosts/{proxy_id}",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch proxy host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/proxy-hosts', methods=['POST'])
@login_required
def create_proxy_host():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.post(
            f"{current_app.config['npm_api_url']}/nginx/proxy-hosts",
            headers=headers,
            json=request.json,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to create proxy host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/proxy-hosts/<int:proxy_id>', methods=['PUT'])
@login_required
def update_proxy_host(proxy_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.put(
            f"{current_app.config['npm_api_url']}/nginx/proxy-hosts/{proxy_id}",
            headers=headers,
            json=request.json,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to update proxy host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/proxy-hosts/<int:proxy_id>', methods=['DELETE'])
@login_required
def delete_proxy_host(proxy_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.delete(
            f"{current_app.config['npm_api_url']}/nginx/proxy-hosts/{proxy_id}",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to delete proxy host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Certificates
@npm_bp.route('/api/nginx/certificates/<int:cert_id>', methods=['GET'])
@login_required
def get_certificate(cert_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/nginx/certificates/{cert_id}",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch certificate"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/certificates/<int:cert_id>', methods=['DELETE'])
@login_required
def delete_certificate(cert_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.delete(
            f"{current_app.config['npm_api_url']}/nginx/certificates/{cert_id}",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to delete certificate"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/certificates/<int:cert_id>/renew', methods=['POST'])
@login_required
def renew_certificate(cert_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.post(
            f"{current_app.config['npm_api_url']}/nginx/certificates/{cert_id}/renew",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to renew certificate"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/certificates/<int:cert_id>/download', methods=['GET'])
@login_required
def download_certificate(cert_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/nginx/certificates/{cert_id}/download",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return Response(
                response.content,
                mimetype='application/zip',
                headers={
                    'Content-Disposition': f'attachment; filename=certificate-{cert_id}.zip'
                }
            )
        else:
            return jsonify({"error": "Failed to download certificate"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/certificates/<int:cert_id>/upload', methods=['POST'])
@login_required
def upload_certificate(cert_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        # Get certificate files from request
        if 'certificate' not in request.files or 'certificate_key' not in request.files:
            return jsonify({"error": "Certificate and key files are required"}), 400
        
        # Prepare multipart/form-data request
        files = {
            'certificate': (request.files['certificate'].filename, request.files['certificate'].read()),
            'certificate_key': (request.files['certificate_key'].filename, request.files['certificate_key'].read())
        }
        
        response = requests.post(
            f"{current_app.config['npm_api_url']}/nginx/certificates/{cert_id}/upload",
            headers=headers,
            files=files,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to upload certificate"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/certificates/validate', methods=['POST'])
@login_required
def validate_certificate():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        # Get certificate files from request
        if 'certificate' not in request.files or 'certificate_key' not in request.files:
            return jsonify({"error": "Certificate and key files are required"}), 400
        
        # Prepare multipart/form-data request
        files = {
            'certificate': (request.files['certificate'].filename, request.files['certificate'].read()),
            'certificate_key': (request.files['certificate_key'].filename, request.files['certificate_key'].read())
        }
        
        response = requests.post(
            f"{current_app.config['npm_api_url']}/nginx/certificates/validate",
            headers=headers,
            files=files,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to validate certificate"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/access-lists', methods=['POST'])
@login_required
def create_access_list():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        # Forward the request body to NPM
        response = requests.post(
            f"{current_app.config['npm_api_url']}/nginx/access-lists",
            headers=headers,
            json=request.json,
            verify=False
        )
        
        if response.status_code == 200 or response.status_code == 201:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to create access list"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Access lists specific endpoints
@npm_bp.route('/api/nginx/access-lists/<int:access_list_id>', methods=['GET'])
@login_required
def get_access_list(access_list_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(
            f"{current_app.config['npm_api_url']}/nginx/access-lists/{access_list_id}",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch access list"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/access-lists/<int:access_list_id>', methods=['PUT'])
@login_required
def update_access_list(access_list_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        # Forward the request body to NPM
        response = requests.put(
            f"{current_app.config['npm_api_url']}/nginx/access-lists/{access_list_id}",
            headers=headers,
            json=request.json,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to update access list"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/access-lists/<int:access_list_id>', methods=['DELETE'])
@login_required
def delete_access_list(access_list_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.delete(
            f"{current_app.config['npm_api_url']}/nginx/access-lists/{access_list_id}",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to delete access list"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Redirection host CRUD endpoints
@npm_bp.route('/api/nginx/redirection-hosts', methods=['POST'])
@login_required
def create_redirection_host():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        # Forward the request body to NPM
        response = requests.post(
            f"{current_app.config['npm_api_url']}/nginx/redirection-hosts",
            headers=headers,
            json=request.json,
            verify=False
        )
        
        if response.status_code == 200 or response.status_code == 201:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to create redirection host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/redirection-hosts/<int:host_id>', methods=['PUT'])
@login_required
def update_redirection_host(host_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        # Forward the request body to NPM
        response = requests.put(
            f"{current_app.config['npm_api_url']}/nginx/redirection-hosts/{host_id}",
            headers=headers,
            json=request.json,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to update redirection host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/redirection-hosts/<int:host_id>', methods=['DELETE'])
@login_required
def delete_redirection_host(host_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.delete(
            f"{current_app.config['npm_api_url']}/nginx/redirection-hosts/{host_id}",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to delete redirection host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/audit-log')
@login_required
def get_audit_log():
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        if 'npm_api_url' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_api_url is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        try:
            # Try to get audit log from NPM if available
            response = requests.get(
                f"{current_app.config['npm_api_url']}/audit-log",
                headers=headers,
                verify=False,
                timeout=5
            )
            
            if response.status_code == 200:
                return jsonify(response.json())
            else:
                # If NPM doesn't support audit logs, return an empty array
                logging.warning(f"NPM audit log not available (status: {response.status_code}), returning empty list")
                return jsonify([])
                
        except requests.RequestException as e:
            logging.warning(f"Could not fetch NPM audit log (NPM may not support audit logs): {str(e)}")
            # Return empty audit log if the endpoint doesn't exist or fails
            return jsonify([])
            
    except Exception as e:
        logging.error(f"Error in get_audit_log: {str(e)}")
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/proxy-hosts/<int:proxy_id>/disable', methods=['POST'])
@login_required
def disable_proxy_host(proxy_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.post(
            f"{current_app.config['npm_api_url']}/nginx/proxy-hosts/{proxy_id}/disable",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to disable proxy host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@npm_bp.route('/api/nginx/proxy-hosts/<int:proxy_id>/enable', methods=['POST'])
@login_required
def enable_proxy_host(proxy_id):
    try:
        if 'npm_token_manager' not in current_app.config:
            return jsonify({"error": "NPM is not properly configured - npm_token_manager is missing from application config"}), 503
            
        token_manager = current_app.config['npm_token_manager']
        token = token_manager.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.post(
            f"{current_app.config['npm_api_url']}/nginx/proxy-hosts/{proxy_id}/enable",
            headers=headers,
            verify=False
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to enable proxy host"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500 