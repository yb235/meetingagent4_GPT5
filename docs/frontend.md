# Frontend Guide

The Meeting Agent UI provides controls to join meetings, ask questions, view live transcripts, and see AI-generated briefs.

## Running the UI

- Docker: UI runs at http://localhost:3004 when using `docker compose up --build`
- Local Dev:
```bash
cd packages/frontend
npm install
npm run dev
# open http://localhost:3004
```

Environment variables (via `docker-compose.yml` or `.env`):
- `VITE_API_URL` (default `http://localhost:3000`)
- `VITE_WS_URL` (default `http://localhost:3001`)

## Features

- Join Meeting: paste Zoom/Teams/Meet link, deploy AI bot
- Ask Question: text input + priority (polite/next-turn/interrupt)
- Live Transcript: real-time lines with timestamps and speakers
- AI Briefs: topic, summary, action items
- Status Indicators: service health and WebSocket connectivity

## Architecture

- React + TypeScript (Vite)
- Tailwind CSS, shadcn/ui components
- Socket.IO for realtime
- REST calls to API Gateway (port 3000)
- WebSocket to Audio Gateway (port 3001)

## Files

- `packages/frontend/src/components/MeetingAgentDashboard.tsx`: main UI
- `packages/frontend/src/hooks/useMeetingSocket.ts`: WebSocket hook
- `packages/frontend/src/lib/api.ts`: REST client

## Customization

- Update styles via `src/index.css` and `tailwind.config.js`
- Add components under `src/components/`
- Add API methods in `src/lib/api.ts`
