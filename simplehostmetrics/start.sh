#!/bin/bash
killall "gunicorn: master"
mkdir /usr/share/GeoIP/ -p

# Run Gunicorn with forwarded headers settings for proxy
gunicorn --workers 1 --bind 0.0.0.0:5000 --forwarded-allow-ips="*" app:app
