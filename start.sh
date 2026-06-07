#!/bin/bash
# Start Node gateway (background)
cd /app/backend/gateway
node server.js &
# Serve frontend build with simple HTTP server (or use nginx)
cd /app/frontend/build
python3 -m http.server 3000
