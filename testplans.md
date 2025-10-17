# Test Plan

Test environments
- Local: docker-compose with simulated Recall.ai media (audio file playback)
- Staging: Recall.ai sandbox meeting, test Zoom account, no PII
- Production: real meetings with opt-in, PII controls enabled

Unit tests
- Shared types/schemas: validate JSON schemas for tools
- Audio-gateway: frame parsing, Deepgram WS client reconnects, error handling
- Agent-service: brief throttling logic, action-item extraction, question planning strategy
- tts-service: TTS chunk assembly, injection control

Integration tests (local)
- Simulated audio → Deepgram → transcript finals → agent brief → console receiver
- Ask flow: AskRequest → plan_live_question → TTS request issued (mock)

Staging E2E tests
- Recall.ai joins a Zoom test meeting (with synthetic audio source)
- Verify:
  - Partial and final transcripts flow
  - Briefs arrive every 30–60s or on topic changes
  - Ask flow produces audible speech in the meeting
  - Latency targets:
    - STT partial p95 < 400ms
    - Brief decision-to-delivery p95 < 1s (excluding push channel)
    - TTS inject start p95 < 2s on “interrupt”

Load and resilience
- 30-minute recorded meeting playback loop to stress:
  - Reconnects: Deepgram WS drops, Recall.ai media reconnects
  - Backpressure: ensure CPU/memory stable; drop partials, keep finals
  - Idempotency: no duplicate briefs or TTS plays

Security and privacy validation
- Redaction on: ensure PII is masked in logs and briefs as configured
- Secrets: verify no keys in logs; environment only via Secret Manager
- Data retention: verify deletion of artifacts after configured TTL

Acceptance criteria
- All milestones in IMPLEMENTATION_GUIDE.md pass tests in the corresponding environment
- Dashboards show target SLOs within budget under normal load
