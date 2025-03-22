from flask import Blueprint, render_template, jsonify
from flask_security import login_required
import stats
import psutil
import time
from datetime import datetime, timedelta

stats_bp = Blueprint('stats', __name__, url_prefix='/stats')

@stats_bp.route('/')
@login_required
def index():
    return render_template('stats.html')

@stats_bp.route('/api/system')
@login_required
def get_system_stats():
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return jsonify({
            'cpu': {
                'percent': cpu_percent,
                'cores': psutil.cpu_count(),
                'frequency': psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
            },
            'memory': {
                'total': memory.total,
                'available': memory.available,
                'percent': memory.percent,
                'used': memory.used,
                'free': memory.free
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@stats_bp.route('/api/network')
@login_required
def get_network_stats():
    try:
        net_io = psutil.net_io_counters()
        return jsonify({
            'bytes_sent': net_io.bytes_sent,
            'bytes_recv': net_io.bytes_recv,
            'packets_sent': net_io.packets_sent,
            'packets_recv': net_io.packets_recv,
            'errin': net_io.errin,
            'errout': net_io.errout,
            'dropin': net_io.dropin,
            'dropout': net_io.dropout
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@stats_bp.route('/api/history')
@login_required
def get_history():
    try:
        return jsonify({
            'cpu_history': stats.cpu_history,
            'memory_history_basic': stats.memory_history_basic,
            'disk_history_basic': stats.disk_history_basic,
            'cpu_history_24h': stats.cpu_history_24h,
            'memory_history_24h': stats.memory_history_24h,
            'disk_history': stats.disk_history,
            'network_history': stats.network_history
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@stats_bp.route('/api/processes')
@login_required
def get_processes():
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return jsonify(processes)
    except Exception as e:
        return jsonify({"error": str(e)}), 500 