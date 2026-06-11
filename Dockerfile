# Multi-stage build for Spiral AI Agent
# Stage 1: Build the React frontend
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build the Node.js gateway
FROM node:18-slim AS gateway-builder
WORKDIR /app/backend/gateway
COPY backend/gateway/package*.json ./
RUN npm install

# Stage 3: Final runtime image
FROM node:18-slim
WORKDIR /app

# Install Python for the agent service
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy gateway with dependencies
COPY --from=gateway-builder /app/backend/gateway/node_modules ./backend/gateway/node_modules
COPY backend/gateway/ ./backend/gateway/

# Copy Python agent with dependencies
COPY backend/agent/requirements.txt ./backend/agent/
RUN pip install --no-cache-dir -r backend/agent/requirements.txt
COPY backend/agent/ ./backend/agent/

# Expose ports (3000 for gateway, 5000 for agent)
EXPOSE 3000 5000

# Start both services
# Gateway serves the frontend static files and proxies API calls
# Agent runs in the background
CMD ["sh", "-c", "cd backend/agent && python3 main.py & cd /app/backend/gateway && npm start"]
