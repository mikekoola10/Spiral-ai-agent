FROM node:18-slim

WORKDIR /app
COPY backend/gateway/package*.json ./
RUN npm install
COPY backend/gateway/ ./

EXPOSE 3000
CMD ["node", "server.js"]
