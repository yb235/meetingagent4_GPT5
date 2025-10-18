# Meeting Agent Frontend

React + TypeScript web UI for the Meeting Agent system.

## Features

- **Join Meetings**: Deploy AI bot to Zoom/Teams/Google Meet
- **Live Transcripts**: Real-time conversation display with speaker labels
- **AI Briefs**: Automated meeting summaries and action items
- **Ask Questions**: Submit questions for the AI to ask in the meeting
- **Speaking Strategies**: Choose how the AI should speak (polite/interrupt/next-turn)

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Socket.IO** for real-time updates
- **Phosphor Icons** for UI icons

## Development

### Local Development

```bash
cd packages/frontend
npm install
npm run dev
```

The UI will be available at http://localhost:3004

### Docker Development

```bash
# From root directory
docker compose up frontend
```

## Environment Variables

Create a `.env` file in the frontend package (or use docker-compose env):

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3001
```

## Project Structure

```
packages/frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   └── select.tsx
│   │   └── MeetingAgentDashboard.tsx  # Main dashboard
│   ├── hooks/
│   │   └── useMeetingSocket.ts    # WebSocket hook
│   ├── lib/
│   │   ├── api.ts                 # API client
│   │   └── utils.ts               # Utilities
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## API Integration

The frontend connects to:

- **API Gateway** (port 3000) - REST API for meeting control
- **Audio Gateway** (port 3001) - WebSocket for real-time transcripts and briefs

### API Endpoints Used

- `POST /meetings/join` - Join a meeting
- `POST /meetings/:id/leave` - Leave a meeting
- `POST /meetings/:id/ask` - Ask a question
- `GET /meetings/:id` - Get meeting status
- `GET /health` - Health check

### WebSocket Events

**Received:**
- `meeting:joined` - Bot joined a meeting
- `transcript:update` - New transcript segment
- `brief:update` - New AI brief
- `meeting:ended` - Meeting ended
- `question:asked` - Question was asked

## Building for Production

```bash
npm run build
```

The production build will be in `dist/` directory.

## Features Implementation Status

- [x] Join meeting interface
- [x] Live transcript display
- [x] AI brief display
- [x] Ask question with priority
- [x] WebSocket real-time updates
- [x] CORS support
- [x] Docker integration
- [ ] Authentication
- [ ] Meeting history
- [ ] Export transcripts
- [ ] Multi-meeting support
- [ ] User preferences

## Contributing

When adding new features:

1. Add new components in `src/components/`
2. Create hooks in `src/hooks/` for state management
3. Add API methods in `src/lib/api.ts`
4. Update this README with new features

