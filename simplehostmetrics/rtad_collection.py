import threading
import time
import logging
import rtad_manager
import os

def rtad_main():
    """
    Main RTAD thread function that sets up monitoring and processing of log files.
    This function coordinates the various RTAD components.
    """
    print("Starting RTAD main thread")
    
    try:
        # Create a log parser instance
        log_parser = rtad_manager.LogParser()
        
        # Initial parse of all log files
        log_parser.parse_log_files()
        
        # Setup file watching
        log_parser.setup_watchdog()
        
        # Start a thread to update country information
        country_info_thread = threading.Thread(
            target=rtad_manager.update_country_info_job,
            daemon=True
        )
        country_info_thread.start()
        
        # Parse btmp file (failed login attempts) every minute
        while True:
            try:
                log_parser.parse_btmp_file()
            except Exception as e:
                print(f"Error parsing btmp file: {str(e)}")
            
            # Sleep for 60 seconds before repeating
            time.sleep(60)
            
    except Exception as e:
        print(f"Error in RTAD main thread: {str(e)}")
        # Keep the thread running even if there's an error
        time.sleep(60)
        rtad_main()  # Restart the function 