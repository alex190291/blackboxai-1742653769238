from flask import Blueprint, jsonify
from flask_security import login_required
import docker

# Initialize the Docker client
docker_client = None
try:
    docker_client = docker.from_env()
except Exception as e:
    print(f"Error initializing Docker client: {str(e)}")

docker_stats_bp = Blueprint('docker_stats', __name__, url_prefix='/docker_stats')

@docker_stats_bp.route('/')
@login_required
def get_docker_stats():
    """Get stats for all Docker containers"""
    if not docker_client:
        return jsonify({"error": "Docker client not initialized"}), 500
        
    try:
        containers = docker_client.containers.list(all=True)
        container_stats = []
        
        for container in containers:
            try:
                # Get container info
                container_info = docker_client.api.inspect_container(container.id)
                status = container.status
                
                # Calculate uptime if running
                uptime = 0
                if status == "running":
                    start_time = container_info["State"].get("StartedAt", "")
                    if start_time:
                        import datetime
                        import dateutil.parser
                        
                        # Parse the start time
                        start_time_dt = dateutil.parser.parse(start_time)
                        current_time = datetime.datetime.now(datetime.timezone.utc)
                        uptime = int((current_time - start_time_dt).total_seconds())
                
                # Get image info including whether it's up to date
                up_to_date = True  # Default assumption
                
                # Add to container stats
                container_stats.append({
                    "name": container.name,
                    "id": container.id,
                    "status": status,
                    "image": container.image.tags[0] if container.image.tags else "unknown",
                    "uptime": uptime,
                    "up_to_date": up_to_date
                })
                
            except Exception as e:
                print(f"Error getting stats for container {container.name}: {str(e)}")
        
        return jsonify(container_stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500 