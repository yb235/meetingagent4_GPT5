# Work Packages (for Copilot tasking)

WP-1: Repo bootstrap
- Create monorepo structure, TypeScript config, linting, docker-compose.
- Deliverables: buildable containers, health endpoints.

WP-2: Recall.ai webhook + media handshake
- Implement meeting lifecycle endpoints, signature verification.
- Simulated media source for local.

WP-3: Deepgram real-time STT integration
- Duplex streaming, encoding alignment, partial/final handling.

WP-4: Agent Orchestrator + tools
- Implement OpenAI function calling with `send_brief_update` and `plan_live_question`.
- Rolling summary, throttling, event detection.

WP-5: Ask flow + TTS pipeline
- User ask endpoint → planning → Aura TTS → injection path.

WP-6: Persistence + Observability
- Postgres integration, OpenTelemetry, dashboards, alerts.

WP-7: Hardening + Privacy
- Backpressure, idempotency, redaction, rate limiting, runbooks.

Each WP should result in a PR with:
- Code
- Tests
- Updated docs
- Observability hooks
- Demo script or screencast
