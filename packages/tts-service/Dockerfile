FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/tts-service/package*.json ./packages/tts-service/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source
COPY packages/tts-service ./packages/tts-service
COPY packages/shared ./packages/shared
COPY config/tsconfig.json ./config/tsconfig.json

# Build
RUN npm run build --workspace=@meetingagent/shared
RUN npm run build --workspace=@meetingagent/tts-service

EXPOSE 3003

CMD ["node", "packages/tts-service/dist/index.js"]
