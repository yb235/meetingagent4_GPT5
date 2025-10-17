# Step-by-Step Implementation Guide

Overview
- Implement four services with minimal coupling:
  1) api-gateway (webhooks + user APIs)
  2) audio-gateway (Recall.ai media ↔ Deepgram STT)
  3) agent-service (OpenAI reasoning + tools)
  4) tts-service (Deepgram Aura TTS ↔ Recall.ai media)

- Use a shared module for types/schemas.
- Start Postgres later; begin with in-memory state (for local dev) then add persistence.

Milestone 1: Skeleton and local development
- Create monorepo structure:
  - packages/api-gateway
  - packages/audio-gateway
  - packages/agent-service
  - packages/tts-service
  - packages/shared
  - docker-compose.yml
- Add TypeScript, ESLint, Prettier, tsconfig in each service.
- Add shared/types for TranscriptSegment, BriefUpdate, AskRequest, AskPlan.
- Acceptance:
  - All services build and start locally with `docker-compose up`.
  - Health endpoints respond.

Milestone 2: Recall.ai webhook + media socket handshake
- Implement /webhooks/recall in api-gateway:
  - Verify signatures if supported.
  - Handle events: meeting.started, media.ready (contains media socket URL), meeting.ended.
  - Publish media socket URL to audio-gateway via simple HTTP or a lightweight queue.
- Implement audio-gateway to connect to Recall.ai media socket (receive audio frames).
  - For local dev, simulate Recall.ai by reading an audio file and emitting frames.
- Acceptance:
  - On simulated meeting start, audio-gateway logs “media connected” and receives frames.

Milestone 3: Deepgram real-time STT integration
- Connect audio-gateway to Deepgram real-time WebSocket.
- Forward audio frames with correct encoding settings (e.g., linear16 PCM 16kHz; adjust based on Recall.ai format).
- Parse partial/final transcripts; emit TranscriptSegment events to agent-service (HTTP POST or WebSocket).
- Acceptance:
  - Local audio file → Deepgram → transcript events received in agent-service.
  - Latency metrics logged.

Milestone 4: Agent-service with OpenAI tools
- Implement OpenAI client and define tools per schema/tool_schemas.json.
- Maintain per-meeting rolling summary and action items.
- On transcript finals, update context and decide whether to call send_brief_update.
- Expose internal endpoint for api-gateway or notifier to receive brief updates (or integrate with Slack).
- Acceptance:
  - Given synthetic transcript snippets, agent-service produces brief updates with correct throttling and content.

Milestone 5: User “ask” flow
- Implement POST /meetings/:id/ask in api-gateway.
- agent-service refines the question via plan_live_question and posts a TTS request to tts-service with the refined text and strategy.
- Acceptance:
  - Given an AskRequest, agent produces AskPlan and invokes TTS pipeline (mock ok in this milestone).

Milestone 6: Deepgram Aura TTS + audio injection
- Implement tts-service: streaming Aura TTS to produce PCM frames.
- Send synthesized frames back into Recall.ai media socket (audio-gateway can expose a method or tts-service can connect directly).
- Implement speaking strategy: default wait-for-pause before injection; for interrupt, inject immediately.
- Acceptance:
  - End-to-end: User submits question → agent refines → TTS audio injected → audio-gateway logs injection and meeting participants hear it (in staging).

Milestone 7: Persistence and observability
- Add Postgres: meeting session metadata, brief updates, final summaries.
- Add OpenTelemetry traces across services, structured logs with meetingId/requestId.
- SLOs: STT partials latency p95, TTS start latency p95, error budgets.
- Acceptance:
  - DB migrations applied, dashboards visible, basic alerts configured.

Milestone 8: Production hardening
- Backpressure strategies: drop oldest partials, prioritize finals.
- Idempotency keys on brief updates/tts triggers.
- PII redaction toggles in STT and logging.
- Acceptance:
  - Load test with recorded meeting demonstrates stable latency and no memory leaks.
