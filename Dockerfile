# Combined Dockerfile for Railway deployment
FROM node:18-bullseye

# Install Python and other dependencies
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all files
COPY . .

# Install Gateway dependencies
WORKDIR /app/backend/gateway
RUN npm install

# Install Agent dependencies
WORKDIR /app/backend/agent
RUN pip3 install -r requirements.txt

# Install Sandbox dependencies
# Looking at sandbox_server.py, it uses flask and request
RUN pip3 install flask requests aiohttp openai

# Build Frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Final setup
WORKDIR /app
RUN chmod +x start.sh

# Expose ports
EXPOSE 3000
EXPOSE 3001
EXPOSE 8080

CMD ["./start.sh"]
