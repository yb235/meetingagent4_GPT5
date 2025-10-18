FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/agent-service/package*.json ./packages/agent-service/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source
COPY packages/agent-service ./packages/agent-service
COPY packages/shared ./packages/shared
COPY config/tsconfig.json ./config/tsconfig.json

# Build
RUN npm run build --workspace=@meetingagent/shared
RUN npm run build --workspace=@meetingagent/agent-service

EXPOSE 3002

CMD ["node", "packages/agent-service/dist/index.js"]
