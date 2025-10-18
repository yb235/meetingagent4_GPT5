FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/

# Install dependencies
RUN npm install

# Copy source
COPY packages/frontend ./packages/frontend
COPY config/tsconfig.json ./config/tsconfig.json

# Build
RUN cd packages/frontend && npm run build

# Expose port
EXPOSE 3004

# Start dev server (for development)
CMD ["npm", "run", "dev", "--workspace=@meetingagent/frontend"]

