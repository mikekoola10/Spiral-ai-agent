FROM node:18-slim

# Install Python3, pip, and necessary build tools
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Optionally, install Playwright dependencies if your Python agent uses it
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm-dev \
    libxkbcommon-dev \
    libgbm-dev \
    libasound-dev \
    libxshmfence-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install Node dependencies
COPY backend/gateway/package*.json ./
RUN npm install

# Copy the rest of the code (including Python scripts, if any)
COPY . .

# Expose port
EXPOSE 3000

# Start the Node.js gateway
CMD ["node", "server.js"]
