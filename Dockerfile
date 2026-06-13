FROM node:18-slim

WORKDIR /app

# Copy package files from the gateway folder
COPY backend/gateway/package*.json ./
RUN npm install

# Copy the rest of the gateway code
COPY backend/gateway/ ./

# Also copy the public folder for static files
COPY public/ ./public/

EXPOSE 3000
CMD ["node", "server.js"]
