# Use a base image with both Node and Python
FROM node:18-slim

# Install Python and necessary tools
RUN apt-get update && apt-get install -y python3 python3-pip && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy gateway (Node) dependencies
COPY backend/gateway/package*.json ./
RUN npm install

# Copy gateway source
COPY backend/gateway/ ./

# Copy agent (Python) code
COPY backend/agent/ ./backend/agent/

# Install Python dependencies if any
RUN pip3 install --no-cache-dir -r backend/agent/requirements.txt || true

# Copy public folder for static files
COPY public/ ./public/

EXPOSE 3000

# Start the Node server
CMD ["node", "server.js"]
