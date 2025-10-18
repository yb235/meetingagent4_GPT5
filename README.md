# Meeting Agent System

A consolidated meeting agent that joins live Zoom/Teams/Google Meet meetings, provides real-time briefs, and speaks user-supplied questions into meetings.

## Architecture

This system consists of five main services:

1. **API Gateway** (port 3000) - Handles webhooks from Recall.ai and user APIs
2. **Audio Gateway** (port 3001) - Manages Recall.ai media socket and Deepgram STT
3. **Agent Service** (port 3002) - OpenAI-powered reasoning and orchestration
4. **TTS Service** (port 3003) - Deepgram Aura TTS for voice injection
5. **Frontend** (port 3004) - React web UI for meeting control and monitoring

## Technology Stack

- **Meeting Join**: Recall.ai (cross-platform Zoom/Teams/Meet)
- **Speech-to-Text**: Deepgram real-time streaming
- **Text-to-Speech**: Deepgram Aura
- **AI Reasoning**: OpenAI (GPT-4 with function calling)
- **Runtime**: Node.js (TypeScript)
- **Deployment**: Docker containers

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose v2+ (the new `docker compose` command, not `docker-compose`)
- API Keys for:
  - Recall.ai
  - Deepgram
  - OpenAI

### Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd meetingagent4_GPT5
```

2. Copy environment file and add your API keys:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Install dependencies:
```bash
npm install
```

4. Build all services:
```bash
npm run build
```

### Running with Docker Compose

Start all services including the UI:
```bash
docker compose up --build
```

This will start:
- API Gateway on http://localhost:3000
- Audio Gateway on http://localhost:3001
- Agent Service on http://localhost:3002
- TTS Service on http://localhost:3003
- **Frontend UI on http://localhost:3004** ← Open this in your browser!

**Note:** This project uses Docker Compose v2+ format. If you have an older version, you may need to use `docker-compose` (with hyphen) instead of `docker compose`.

### Running Locally (Development)

Each service can be run individually:

```bash
# Terminal 1 - API Gateway
cd packages/api-gateway
npm run dev

# Terminal 2 - Audio Gateway
cd packages/audio-gateway
npm run dev

# Terminal 3 - Agent Service
cd packages/agent-service
npm run dev

# Terminal 4 - TTS Service
cd packages/tts-service
npm run dev

# Terminal 5 - Frontend UI
cd packages/frontend
npm run dev
```

Then open http://localhost:3004 in your browser.

## API Endpoints

### API Gateway (3000)

- `GET /health` - Health check
- `POST /webhooks/recall` - Recall.ai webhook receiver
- `POST /meetings/:meetingId/ask` - Submit question to be asked in meeting
- `GET /meetings/:meetingId` - Get meeting status

### Audio Gateway (3001)

- `GET /health` - Health check
- `POST /connect-media` - Connect to Recall.ai media socket

### Agent Service (3002)

- `GET /health` - Health check
- `POST /transcripts` - Receive transcript segments
- `POST /ask` - Process ask request

### TTS Service (3003)

- `GET /health` - Health check
- `POST /synthesize` - Generate and inject speech

## Using the Web UI

1. **Start all services** with `docker compose up --build`
2. **Open the UI** at http://localhost:3004
3. **Enter a meeting link** (Zoom, Teams, or Google Meet)
4. **Click "Deploy AI Bot"** to join the meeting
5. **View live transcripts** and **AI briefs** as the meeting progresses
6. **Ask questions** by typing them and selecting a speaking strategy

## Testing Health Endpoints

```bash
# API Gateway
curl http://localhost:3000/health

# Audio Gateway
curl http://localhost:3001/health

# Agent Service
curl http://localhost:3002/health

# TTS Service
curl http://localhost:3003/health

# Frontend (browser only)
open http://localhost:3004
```

## Project Structure

```
meetingagent4_GPT5/
├── packages/
│   ├── api-gateway/       # Webhooks and user APIs
│   ├── audio-gateway/     # Media streaming and STT
│   ├── agent-service/     # OpenAI orchestration
│   ├── tts-service/       # Speech synthesis
│   └── shared/            # Common types and schemas
├── docs/                  # All documentation files
├── config/                # Configuration files (ESLint, Prettier, TypeScript)
├── scripts/               # Utility scripts
├── schema/                # JSON schemas for tools
├── docker-compose.yml     # Docker orchestration
└── README.md
```

## Documentation

All project documentation is organized in the [`docs/`](docs/) folder. Key documents include:

- **[Architecture Overview](docs/Architecture.md)** - System design and data flows
- **[Development Guide](docs/DEVELOPMENT.md)** - Development workflow and best practices
- **[Implementation Guide](docs/implementationguide.md)** - Step-by-step implementation guide
- **[Prompts Reference](docs/prompts.md)** - OpenAI system prompts and tool schemas
- **[Test Plans](docs/testplans.md)** - Testing strategy
- **[Operations Guide](docs/operations.md)** - Deployment and monitoring
- **[Security & Privacy](docs/securityprivacy.md)** - Security and compliance

See the [Documentation Index](docs/README.md) for a complete list of available documentation.

## Development

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## License

[Add license information]

## Contributing

[Add contribution guidelines]
