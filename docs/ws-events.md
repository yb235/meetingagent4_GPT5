# WebSocket Events

Frontend connects to `ws://localhost:3001/socket.io` via Socket.IO.

## Events Emitted by Server

### meeting:joined
- Payload: `{ meetingId: string, botId?: string }`
- Meaning: Bot joined the meeting and is active.

### meeting:ended
- Payload: `{ meetingId: string }`
- Meaning: Meeting has ended; clean up UI state.

### transcript:update
- Payload: `{ id: string, meetingId: string, text: string, speaker?: string, isFinal: boolean, timestamp: string }`
- Meaning: New transcript text; `isFinal=false` are interim updates.

### brief:update
- Payload: `{ meetingId: string, brief: { topic?: string, summary: string, actionItems?: { owner?: string, item: string }[], timestamp: string } }`
- Meaning: AI brief update for the meeting.

### question:asked
- Payload: `{ meetingId: string, question: string, strategy?: string, timestamp: string }`
- Meaning: A question has been queued/asked in the meeting.

## Client Connection

The frontend uses Socket.IO client with reconnects and supports both `websocket` and `polling` transports.
