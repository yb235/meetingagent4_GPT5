FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/api-gateway/package*.json ./packages/api-gateway/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source
COPY packages/api-gateway ./packages/api-gateway
COPY packages/shared ./packages/shared
COPY config/tsconfig.json ./config/tsconfig.json

# Build
RUN npm run build --workspace=@meetingagent/shared
RUN npm run build --workspace=@meetingagent/api-gateway

EXPOSE 3000

CMD ["node", "packages/api-gateway/dist/index.js"]
