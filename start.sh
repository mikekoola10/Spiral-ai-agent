#!/bin/bash

# Start Sandbox server
echo "Starting Sandbox server..."
python3 docker/sandbox/sandbox_server.py &

# Start Gateway server
echo "Starting Gateway server..."
cd backend/gateway && npm start &

# Serve Frontend on Render's PORT or default to 3000
echo "Serving Frontend on port ${PORT:-3000}..."
cd /app/frontend/build
python3 -m http.server ${PORT:-3000} &

# Wait for all processes
wait -n

# Exit with status of the first process to exit
exit $?
