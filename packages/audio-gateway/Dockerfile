FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/audio-gateway/package*.json ./packages/audio-gateway/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source
COPY packages/audio-gateway ./packages/audio-gateway
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

# Build
RUN npm run build --workspace=@meetingagent/shared
RUN npm run build --workspace=@meetingagent/audio-gateway

EXPOSE 3001

CMD ["node", "packages/audio-gateway/dist/index.js"]
