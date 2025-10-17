# Security and Privacy

Data classification
- Audio and transcripts: Sensitive if meetings contain PII or confidential info
- Briefs and summaries: Derived data; treat as sensitive
- Keys and secrets: Confidential

Principles
- Minimize collected data: only process what’s needed for real-time operation
- Redaction: Enable Deepgram redaction where possible for PII (emails, phone numbers)
- Logging: No raw audio; limited transcript excerpts; redact tokens
- Retention: Configurable TTL for transcripts and briefs; default short-lived

Secrets management
- Store in Cloud Secret Manager or AWS Secrets Manager
- Never log secrets; never commit to VCS

AuthN/Z
- Webhooks: Verify Recall.ai signatures
- User APIs: JWT or session auth; audit logs for “ask” actions

Compliance considerations
- Data residency: Prefer region-aligned deployments
- DSR/Deletion: Implement endpoint or job to purge meeting data on request
- Incident response: On-call rotations, escalation paths, postmortems

Threats and mitigations
- Replay of webhook events: Use nonces/timestamps and idempotency keys
- Abuse via “ask” endpoint: Rate limit per user and per meeting; moderation filters
- Prompt injection via transcripts: Constrain agent with strict tool use; avoid executing raw content; sanitize before tool calls
