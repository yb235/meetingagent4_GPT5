# Architecture

Goal: A consolidated stack that minimizes vendors and custom infra while supporting:
- Cross-platform meeting join, live transcription, live briefs, and in-meeting speech injection.

Core components
1) Meeting Connector (Recall.ai)
   - Joins Zoom/Teams/Meet as a bot participant.
   - Provides a media WebSocket for bidirectional audio: receive meeting audio, send synthesized audio to inject.

2) Audio Gateway
   - Connects Recall.ai media socket to Deepgram real-time STT.
   - Emits transcript events (partials and finals) with timestamps and speaker hints.
   - Optional VAD/turn-taking heuristics for when to “speak.”

3) Agent Orchestrator
   - Maintains per-meeting session state and context.
   - Uses OpenAI to:
     - Maintain a running context (topic, key points, decisions, action items)
     - Produce brief updates on topic change or cadence (e.g., every 30–60s)
     - Refine user-submitted questions for tone/clarity/strategy (e.g., wait-for-pause vs interrupt)
   - Calls Tool Layer functions (send_brief_update, plan_live_question) and triggers TTS playback.

4) Tool Layer (JSON-tools for OpenAI)
   - send_brief_update: pushes compact summaries to the user console/Slack
   - plan_live_question: returns refined text and strategy for speaking
   - Additional tools can be added later (calendar, CRM, ticketing)

5) TTS/Voice Injector
   - Deepgram Aura TTS turns text into low-latency audio.
   - Streams the audio back into Recall.ai media socket to speak in the meeting.

6) User Console/Notifier
   - Minimal web/Slack interface to:
     - Receive live briefs, topic-change alerts, action items
     - Submit questions to be asked via agent voice with priority (polite/interrupt/next-turn)

7) Persistence/Observability
   - Postgres for durable meeting sessions, briefs, summaries.
   - Optional Redis pub/sub if needed under load for low-latency fan-out.
   - OpenTelemetry traces/metrics, structured logs with meeting/session IDs.

Data flow (high level)
1. Start: User triggers agent to join meeting → Recall.ai joins and emits media socket URL.
2. Audio in: Audio Gateway receives audio frames from Recall.ai → streams to Deepgram → gets transcript events.
3. Understanding: Agent Orchestrator ingests transcripts, updates running context, emits brief updates via tools.
4. User question: User submits text → Orchestrator refines and selects speaking strategy → TTS generates audio → Recall.ai injects voice.
5. End: Orchestrator finalizes meeting report and stores artifacts.

Latency budget (targets)
- STT partials: < 400 ms end-to-end for readability (configurable)
- Briefs: event-driven with min 30–60s throttle or on significant topic change
- TTS injection: plan + synth + inject ideally < 1.5–2.0 seconds from user submit for “interrupt” priority; longer acceptable for “next-turn”

Key contracts
- TranscriptSegment: id, meetingId, tsStart/tsEnd, speaker, text, isFinal
- BriefUpdate: concise summary and action items
- AskRequest: user-submitted question with priority
- AskPlan: refined text + strategy (raise-hand | interrupt | wait-pause)

Non-goals (initially)
- Building native Zoom/Teams/Meet bots (Recall.ai abstracts this)
- Multi-vendor speech (Deepgram handles STT+TTS)
- Complex event buses (add Redis only if needed)
