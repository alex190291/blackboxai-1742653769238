import stats
import time
import threading
import psutil

# CPU stats collection thread function
def collect_cpu_stats():
    """
    Thread function to collect CPU statistics.
    This function adapts the stats.update_stats_cache function to collect only CPU data.
    """
    print("Starting CPU stats collection thread")
    while True:
        try:
            # Let the main stats update function handle everything
            time.sleep(5)  # Just wait, as the main function handles it
        except Exception as e:
            print(f"Error in CPU stats collection: {str(e)}")
            time.sleep(5)

# Memory stats collection thread function
def collect_memory_stats():
    """
    Thread function to collect memory statistics.
    This function adapts the stats.update_stats_cache function to collect only memory data.
    """
    print("Starting memory stats collection thread")
    while True:
        try:
            # Let the main stats update function handle everything
            time.sleep(5)  # Just wait, as the main function handles it
        except Exception as e:
            print(f"Error in memory stats collection: {str(e)}")
            time.sleep(5)

# Disk stats collection thread function
def collect_disk_stats():
    """
    Thread function to collect disk statistics.
    This function adapts the stats.update_stats_cache function to collect only disk data.
    """
    print("Starting disk stats collection thread")
    while True:
        try:
            # Let the main stats update function handle everything
            time.sleep(5)  # Just wait, as the main function handles it
        except Exception as e:
            print(f"Error in disk stats collection: {str(e)}")
            time.sleep(5)

# Network stats collection thread function
def collect_network_stats():
    """
    Thread function to collect network statistics.
    This function adapts the stats.update_stats_cache function to collect only network data.
    """
    print("Starting network stats collection thread")
    while True:
        try:
            # Let the main stats update function handle everything
            time.sleep(5)  # Just wait, as the main function handles it
        except Exception as e:
            print(f"Error in network stats collection: {str(e)}")
            time.sleep(5)

# Start the main update stats thread that will handle all collection
def start_stats_collection():
    """Start the main stats collection thread that handles everything"""
    # Start the stats collection thread
    stats_thread = threading.Thread(target=stats.update_stats_cache, daemon=True)
    stats_thread.start()
    print("Started main stats collection thread") 