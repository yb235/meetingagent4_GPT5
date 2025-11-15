# API Reference

Base URL: `http://localhost:3000`

## Health
- `GET /health`
  - 200 `{ status, service, timestamp }`

## Meetings
- `POST /meetings/join`
  - Request: `{ meetingLink: string, botName?: string, enableAudio?: boolean, enableVideo?: boolean }`
  - Response: `200 { meetingId, botId, status, message }`
- `GET /meetings/:meetingId`
  - Response: `200 { meetingId, status }`
- `POST /meetings/:meetingId/ask`
  - Request: `{ text: string, priority: 'polite' | 'interrupt' | 'next-turn' }`
  - Response: `202 { status, meetingId }`
- `POST /meetings/:meetingId/leave`
  - Response: `200 { status, message }`

## Webhooks
- `POST /webhooks/recall`
  - Body: `RecallWebhookEvent`
  - Currently logs event; extend to verify signature and route events

---

Base URL (broadcasts): `http://localhost:3001`

## Broadcast (internal use)
- `POST /broadcast/meeting-joined` → emits `meeting:joined`
  - `{ meetingId: string, botId?: string }`
- `POST /broadcast/meeting-ended` → emits `meeting:ended`
  - `{ meetingId: string }`
- `POST /broadcast/transcript` → emits `transcript:update`
  - `TranscriptSegment`
- `POST /broadcast/brief` → emits `brief:update`
  - `{ meetingId: string, brief: { topic?: string, summary: string, actionItems?: { owner?: string, item: string }[] } }`
- `POST /broadcast/question-asked` → emits `question:asked`
  - `{ meetingId: string, question: string, strategy?: string }`
