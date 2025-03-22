from flask import Blueprint, jsonify, request
from flask_security import login_required
import docker
import time
import os
import yaml
import json
import threading

docker_bp = Blueprint('docker', __name__, url_prefix='/container')

# Initialize the Docker client
docker_client = docker.from_env()

# Add global variables for tracking update status
update_check_in_progress = False
update_check_status = {"checked": 0, "total": 0}
update_check_lock = threading.Lock()

@docker_bp.route('/start/<container_name>', methods=['POST'])
@login_required
def start_container(container_name):
    try:
        container = docker_client.containers.get(container_name)
        if container.status != "running":
            container.start()
            return jsonify({"success": True, "message": f"Container {container_name} started"})
        else:
            return jsonify({"success": True, "message": f"Container {container_name} is already running"})
    except docker.errors.NotFound:
        return jsonify({"success": False, "error": f"Container {container_name} not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@docker_bp.route('/stop/<container_name>', methods=['POST'])
@login_required
def stop_container(container_name):
    try:
        container = docker_client.containers.get(container_name)
        if container.status == "running":
            container.stop()
            return jsonify({"success": True, "message": f"Container {container_name} stopped"})
        else:
            return jsonify({"success": True, "message": f"Container {container_name} is already stopped"})
    except docker.errors.NotFound:
        return jsonify({"success": False, "error": f"Container {container_name} not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@docker_bp.route('/status/<container_name>', methods=['GET'])
@login_required
def container_status(container_name):
    try:
        container = docker_client.containers.get(container_name)
        status = container.status
        running = status == "running"
        installed = True
        
        response = {
            "success": True,
            "status": status,
            "running": running,
            "installed": installed,
            "name": container_name
        }
        
        if running:
            # Get additional info like uptime
            container_data = docker_client.api.inspect_container(container.id)
            start_time = container_data["State"]["StartedAt"]
            # Parse the time string (removing nanoseconds and timezone)
            import datetime
            # Handle different time formats that Docker might return
            if "." in start_time:
                start_time = start_time.split(".")[0]
            if "Z" in start_time:
                start_time = start_time.replace("Z", "")
            
            # Parse the time
            start_time = datetime.datetime.strptime(start_time, "%Y-%m-%dT%H:%M:%S")
            current_time = datetime.datetime.utcnow()
            uptime_seconds = (current_time - start_time).total_seconds()
            
            # Format uptime string
            days, remainder = divmod(uptime_seconds, 86400)
            hours, remainder = divmod(remainder, 3600)
            minutes, seconds = divmod(remainder, 60)
            
            uptime_str = f"{int(days)}d {int(hours)}h {int(minutes)}m"
            
            # Get port mappings
            ports = container_data["NetworkSettings"]["Ports"]
            port_mapping = {}
            if ports:
                for container_port, host_ports in ports.items():
                    if host_ports:
                        for binding in host_ports:
                            port_mapping[container_port] = binding["HostPort"]
            
            response["uptime"] = uptime_str
            response["ports"] = port_mapping
        
        return jsonify(response)
    except docker.errors.NotFound:
        return jsonify({
            "success": True,
            "status": "not_found",
            "running": False,
            "installed": False,
            "name": container_name
        })
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": str(e),
            "status": "error",
            "running": False,
            "installed": False,
            "name": container_name
        }), 500

# Additional routes for the deploy functionality
@docker_bp.route('/deploy/<container_type>', methods=['POST'])
@login_required
def deploy_container(container_type):
    try:
        if container_type not in ['npm', 'wireguard']:
            return jsonify({"success": False, "error": "Invalid container type"}), 400

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No configuration data provided"}), 400

        if container_type == 'npm':
            return deploy_npm_container(data)
        else:
            return deploy_wireguard_container(data)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

def deploy_npm_container(data):
    """Helper function to deploy NPM container"""
    try:
        # Extract configuration
        domain = data.get('domain')
        identity = data.get('identity')
        secret = data.get('secret')
        ssl_enabled = data.get('ssl_enabled', False)
        
        if not all([domain, identity, secret]):
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        # Get absolute path to config file
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.yml')
        
        # Update config.yml with npm settings
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f) or {}
            
            if 'npm' not in config:
                config['npm'] = {}
            
            config['npm']['domain'] = domain
            config['npm']['identity'] = identity
            config['npm']['secret'] = secret
            
            with open(config_path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)
        except Exception as e:
            print(f"Error updating config file: {str(e)}")
            raise

        # Check if NPM container already exists
        try:
            npm_container = docker_client.containers.get('npm')
            # If exists, remove it to redeploy
            npm_container.stop()
            npm_container.remove()
        except docker.errors.NotFound:
            pass  # Container doesn't exist, which is fine

        # Create required directories with absolute paths
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
        npm_data_dir = os.path.join(data_dir, 'npm', 'data')
        npm_letsencrypt_dir = os.path.join(data_dir, 'npm', 'letsencrypt')
        
        os.makedirs(npm_data_dir, exist_ok=True)
        os.makedirs(npm_letsencrypt_dir, exist_ok=True)
        
        # Create a new NPM container with proper defaults
        npm_container = docker_client.containers.run(
            'jc21/nginx-proxy-manager:latest',
            name='npm',
            detach=True,
            restart_policy={"Name": "unless-stopped"},
            ports={
                '81/tcp': 8000  # Map admin UI to port 8000 for sandbox environment
            },
            volumes={
                npm_data_dir: {'bind': '/data', 'mode': 'rw'},
                npm_letsencrypt_dir: {'bind': '/etc/letsencrypt', 'mode': 'rw'}
            },
            environment={
                'SSL': 'false',  # Disable SSL in sandbox
                'DB_SQLITE_FILE': '/data/database.sqlite',
                'DISABLE_IPV6': 'true',
                'DEFAULT_EMAIL': config.get('default_admin_email', 'admin@example.com'),
                'DEFAULT_PASSWORD': config.get('default_admin_password', 'changeme'),
                'DISABLE_HTTPS_REDIRECTION': 'true',
                'UI_PORT': '81'  # Keep internal port as 81
            }
        )
        
        # Wait for container to be running
        time.sleep(5)
        npm_container.reload()
        
        return jsonify({
            "success": True,
            "message": "NPM deployed successfully",
            "status": npm_container.status
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

def deploy_wireguard_container(data):
    """Helper function to deploy WireGuard container"""
    try:
        # Extract configuration
        server_url = data.get('server_url')
        port = data.get('port', 51820)
        ip_range = data.get('ip_range', '10.8.0.0/24')
        
        if not server_url:
            return jsonify({"success": False, "error": "Missing server URL"}), 400
        
        # Get absolute path to config file
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.yml')
        
        # Update config.yml with wireguard settings
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f) or {}
            
            if 'wireguard' not in config:
                config['wireguard'] = {}
            
            config['wireguard']['server_url'] = server_url
            
            with open(config_path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)
        except Exception as e:
            print(f"Error updating config file: {str(e)}")
            raise
        
        # Check if WireGuard container already exists
        try:
            wg_container = docker_client.containers.get('wireguard')
            # If exists, remove it to redeploy
            wg_container.stop()
            wg_container.remove()
        except docker.errors.NotFound:
            # Container doesn't exist, which is fine
            pass
        
        # Create directories for volumes if they don't exist
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
        wireguard_config_dir = os.path.join(data_dir, 'wireguard', 'config')
        os.makedirs(wireguard_config_dir, exist_ok=True)
        
        # Environment variables for WireGuard
        environment = {
            'WG_HOST': server_url,
            'WG_PORT': '51820',  # Keep internal WireGuard port as default
            'WG_DEFAULT_ADDRESS': ip_range,
            'WG_PERSISTENT_KEEPALIVE': '25',
            'WG_DEFAULT_DNS': '1.1.1.1, 1.0.0.1',
            'WG_ALLOWED_IPS': '0.0.0.0/0, ::/0',
            'WG_UI_PORT': '421'  # Keep internal UI port as default
        }
        
        # Create a new WireGuard container
        wg_container = docker_client.containers.run(
            'weejewel/wg-easy:latest',
            name='wireguard',
            detach=True,
            restart_policy={"Name": "unless-stopped"},
            cap_add=['NET_ADMIN', 'SYS_MODULE'],
            sysctls={'net.ipv4.ip_forward': '1', 'net.ipv4.conf.all.src_valid_mark': '1'},
            ports={
                '421/tcp': 8000  # Map Web UI to port 8000 for sandbox environment
            },
            volumes={
                wireguard_config_dir: {'bind': '/etc/wireguard', 'mode': 'rw'}
            },
            environment=environment
        )
        
        # Wait for container to be running
        time.sleep(5)
        wg_container.reload()
        
        return jsonify({
            "success": True,
            "message": "WireGuard deployed successfully",
            "status": wg_container.status
        })
        
    except docker.errors.APIError as e:
        return jsonify({"success": False, "error": f"Docker API error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@docker_bp.route('/check_all', methods=['POST'])
@login_required
def check_all_updates():
    global update_check_in_progress
    global update_check_status
    
    # Check if update check is already in progress
    with update_check_lock:
        if update_check_in_progress:
            return jsonify({"status": "already_in_progress"})
        
        # Start the update check
        update_check_in_progress = True
        update_check_status = {"checked": 0, "total": 0}
    
    # Start the check in a background thread
    thread = threading.Thread(target=check_all_containers_for_updates)
    thread.daemon = True
    thread.start()
    
    return jsonify({"status": "started"})

@docker_bp.route('/check_all_status', methods=['GET'])
@login_required
def get_check_all_status():
    global update_check_in_progress
    global update_check_status
    
    with update_check_lock:
        status = {
            "in_progress": update_check_in_progress,
            "checked": update_check_status["checked"],
            "total": update_check_status["total"]
        }
    
    return jsonify(status)

def check_all_containers_for_updates():
    """Check all containers for available updates"""
    global update_check_in_progress
    global update_check_status
    
    try:
        # Get all containers
        containers = docker_client.containers.list(all=True)
        
        with update_check_lock:
            update_check_status["total"] = len(containers)
            update_check_status["checked"] = 0
        
        # Check each container for updates
        for container in containers:
            try:
                # For demonstration, simulate update check
                # In a real scenario, you would pull the latest image and compare with current
                time.sleep(0.5)  # Add delay to make progress visible
                
                # Update the checked count
                with update_check_lock:
                    update_check_status["checked"] += 1
                
            except Exception as e:
                print(f"Error checking updates for container {container.name}: {str(e)}")
                
                # Still increment the count even if there's an error
                with update_check_lock:
                    update_check_status["checked"] += 1
        
        # Complete the update check
        with update_check_lock:
            update_check_in_progress = False
            
    except Exception as e:
        print(f"Error in check_all_containers_for_updates: {str(e)}")
        
        # Mark the update check as complete
        with update_check_lock:
            update_check_in_progress = False

@docker_bp.route('/update/<container_name>', methods=['POST'])
@login_required
def update_container(container_name):
    """Start an update process for a container"""
    try:
        # Store update status in a global dict
        if not hasattr(update_container, 'update_status'):
            update_container.update_status = {}
        
        # Check if update is already in progress
        if container_name in update_container.update_status and update_container.update_status[container_name]['in_progress']:
            return jsonify({"status": "already_in_progress"})
        
        # Initialize update status
        update_container.update_status[container_name] = {
            'in_progress': True,
            'phase': 'initializing',
            'error': None,
            'success': False
        }
        
        # Start update in background thread
        thread = threading.Thread(target=perform_container_update, args=(container_name,))
        thread.daemon = True
        thread.start()
        
        return jsonify({"status": "started"})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

@docker_bp.route('/update_status/<container_name>', methods=['GET'])
@login_required
def get_update_status(container_name):
    """Get the status of a container update"""
    try:
        # Make sure we have the status dictionary
        if not hasattr(update_container, 'update_status'):
            update_container.update_status = {}
        
        # Return status if exists, otherwise return not started
        if container_name in update_container.update_status:
            return jsonify(update_container.update_status[container_name])
        else:
            return jsonify({
                'in_progress': False,
                'phase': 'not_started',
                'error': None,
                'success': False
            })
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

def perform_container_update(container_name):
    """Background process to update a container"""
    try:
        # Get container
        container = docker_client.containers.get(container_name)
        
        # Update status
        update_container.update_status[container_name]['phase'] = 'pulling_image'
        
        # Get current image tag
        current_image = container.image.tags[0] if container.image.tags else None
        
        if not current_image:
            raise Exception("Container has no image tag")
        
        # For simulation purposes, we'll just wait a bit
        # In a real implementation, you would:
        # 1. Pull the latest image
        time.sleep(2)
        update_container.update_status[container_name]['phase'] = 'stopping_container'
        
        # 2. Stop the container
        if container.status == "running":
            time.sleep(1)
            update_container.update_status[container_name]['phase'] = 'starting_container'
        
        # 3. Start with new image
        time.sleep(1)
        
        # Mark as successful
        update_container.update_status[container_name]['in_progress'] = False
        update_container.update_status[container_name]['success'] = True
        update_container.update_status[container_name]['phase'] = 'complete'
    except Exception as e:
        # Update status with error
        if container_name in update_container.update_status:
            update_container.update_status[container_name]['in_progress'] = False
            update_container.update_status[container_name]['error'] = str(e)
            update_container.update_status[container_name]['phase'] = 'failed'
        
        print(f"Error updating container {container_name}: {str(e)}")

