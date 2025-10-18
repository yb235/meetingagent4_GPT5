#!/bin/bash

echo "Testing health endpoints..."
echo ""

echo "1. Testing API Gateway (port 3000)..."
curl -s http://localhost:3000/health | jq '.' || echo "Failed"
echo ""

echo "2. Testing Audio Gateway (port 3001)..."
curl -s http://localhost:3001/health | jq '.' || echo "Failed"
echo ""

echo "3. Testing Agent Service (port 3002)..."
curl -s http://localhost:3002/health | jq '.' || echo "Failed"
echo ""

echo "4. Testing TTS Service (port 3003)..."
curl -s http://localhost:3003/health | jq '.' || echo "Failed"
echo ""

echo "All health checks complete!"
