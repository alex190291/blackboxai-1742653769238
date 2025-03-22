#!/bin/bash

# Install required dependencies if not already installed
pip install -r requirements-test.txt

# Make sure the Chrome driver is installed
if ! command -v chromedriver &> /dev/null; then
    echo "ChromeDriver not found, installing..."
    if [ -f /etc/redhat-release ]; then
        # For Fedora/CentOS/RHEL
        dnf install -y chromedriver
    elif [ -f /etc/debian_version ]; then
        # For Ubuntu/Debian
        apt-get update && apt-get install -y chromium-chromedriver
    else
        echo "Unsupported OS, please install ChromeDriver manually"
        exit 1
    fi
fi

# Make sure the Flask app is running
if ! pgrep -f "python app.py" > /dev/null; then
    echo "Starting Flask application in the background..."
    python app.py &
    APP_PID=$!
    echo "Flask app started with PID: $APP_PID"
    # Wait for app to start
    sleep 5
    echo "Running tests..."
else
    echo "Flask app is already running."
    echo "Running tests..."
fi

# Run all tests in the tests directory
python -m unittest discover -s tests -p "test_*.py"

# Capture the exit code
TEST_EXIT_CODE=$?

# If we started the app, stop it
if [ -n "$APP_PID" ]; then
    echo "Stopping Flask application..."
    kill $APP_PID
fi

# Return the test exit code
exit $TEST_EXIT_CODE 