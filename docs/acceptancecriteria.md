# Acceptance Criteria

Core E2E
- Agent can join a staging Zoom/Teams/Meet via Recall.ai and:
  - Produce live briefs at topic changes or every ≤60s, whichever comes first.
  - Accept a user-submitted question and audibly ask it in the meeting.

Quality
- p95 STT partial latency < 400ms; finals processed within 1.2s
- p95 TTS injection start < 2.0s (interrupt), < 4.0s (next-turn)
- No duplicate briefs or TTS plays (idempotency)

Security/Privacy
- Webhook signatures verified
- PII redaction configurable and effective
- No secrets in logs; keys in Secret Manager

Operability
- Deployable via CI to Cloud Run
- Dashboards for latency/error rates
- Runbooks tested
