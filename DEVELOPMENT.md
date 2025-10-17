# Meeting Agent Development Environment

This is a template for your local .env file. Copy this to .env and fill in your API keys.

```bash
# Recall.ai
RECALL_API_KEY=your-recall-api-key-here
RECALL_WEBHOOK_SECRET=your-webhook-secret-here

# Deepgram
DEEPGRAM_API_KEY=your-deepgram-api-key-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# App Configuration
APP_BASE_URL=http://localhost:3000
LOG_LEVEL=info

# Optional - for later milestones
DATABASE_URL=postgres://user:pass@localhost:5432/meetingagent
REDIS_URL=redis://localhost:6379
```

## Getting Your API Keys

### Recall.ai
1. Sign up at https://www.recall.ai/
2. Navigate to your dashboard
3. Generate an API key
4. Set up webhook secret for security

### Deepgram
1. Sign up at https://deepgram.com/
2. Go to API Keys section
3. Create a new API key
4. Copy the key (it won't be shown again)

### OpenAI
1. Sign up at https://platform.openai.com/
2. Navigate to API Keys
3. Create a new secret key
4. Copy and save it securely

## Local Development Setup

1. Copy .env.example to .env:
   ```bash
   cp .env.example .env
   ```

2. Edit .env and add your API keys

3. Start services with Docker:
   ```bash
   docker compose up
   ```

   Or run services individually:
   ```bash
   # In separate terminals
   cd packages/api-gateway && npm run dev
   cd packages/audio-gateway && npm run dev
   cd packages/agent-service && npm run dev
   cd packages/tts-service && npm run dev
   ```

## Testing

Once services are running, test health endpoints:
```bash
./test-health.sh
```

Or manually:
```bash
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Audio Gateway
curl http://localhost:3002/health  # Agent Service
curl http://localhost:3003/health  # TTS Service
```
