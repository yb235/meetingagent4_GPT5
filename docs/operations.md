# Operations, Deployment, and Runbooks

Environments
- dev: local docker-compose
- staging: Cloud Run + Cloud SQL (Postgres)
- prod: Cloud Run + Cloud SQL; optional Redis if needed

Config and secrets
- Use environment variables for per-service config; store secrets in Secret Manager/KMS.
- Rotate API keys regularly; least-privilege IAM.

Deploy (Cloud Run)
- Build container per service:
  - api-gateway
  - audio-gateway
  - agent-service
  - tts-service
- Configure:
  - Concurrency: start with 10–20
  - Min instances: 0–1
  - Timeouts: 300s
  - VPC connector if needed for egress
- Map HTTPS endpoints for webhooks and APIs.

Observability
- OpenTelemetry tracer/provider in each service
- Structured logs (JSON) with fields: meetingId, requestId, eventType, latencyMs
- Dashboards:
  - STT latency (partial, final)
  - Briefs rate and delivery latency
  - TTS start latency
  - Error rates by service

Alerts
- High error rate (>2% over 5 min) per service
- STT partial latency p95 > 800ms sustained
- TTS start latency p95 > 3s sustained
- Media socket disconnects > N/min

Runbooks
- Media socket flapping:
  - Check Recall.ai status, then audio-gateway logs
  - Trigger reconnect; if repeated, reduce concurrency and disable partials
- STT degraded latency:
  - Temporarily increase debounce windows; prioritize finals only
- TTS injection failure:
  - Retry with exponential backoff; if persistent, switch to fallback voice/model
- Database connection saturation:
  - Increase pool size; add caching; review N+1 in agent-service

Meeting Agent UI runbook
- UI not loading:
  - Check `docker compose ps`; ensure `frontend` is Up on 3004
  - Tail logs: `docker compose logs -f frontend`
  - Verify `VITE_API_URL` and `VITE_WS_URL` environment variables
- No transcripts in UI:
  - Confirm audio-gateway /health
  - Check Socket.IO connection in browser devtools Network → WS
  - Verify broadcasts: POST to `http://localhost:3001/broadcast/transcript`
- No briefs in UI:
  - Confirm agent-service processes tool calls
  - Check agent-service logs for `Sending brief update`
  - Verify broadcasts: POST to `http://localhost:3001/broadcast/brief`

Cost controls
- Cap concurrency on agent-service
- Throttle briefs
- Limit TTS length and sample rate where acceptable
