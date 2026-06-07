#!/bin/bash

# Start Sandbox server
echo "Starting Sandbox server..."
python3 docker/sandbox/sandbox_server.py &

# Start Gateway server
echo "Starting Gateway server..."
cd backend/gateway && npm start &

# Serve Frontend
echo "Serving Frontend..."
cd /app/frontend/build
python3 -m http.server 3000 &

# Wait for all processes
wait -n

# Exit with status of the first process to exit
exit $?
