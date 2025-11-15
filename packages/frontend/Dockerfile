FROM node:20-alpine AS build

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

FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy built assets
COPY --from=build /app/packages/frontend/dist .

# Nginx config to proxy API and WS
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

