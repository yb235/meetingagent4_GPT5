# Meeting Agent Implementation Guide (Recall.ai + Deepgram + OpenAI)

This repository contains detailed prompts and documentation for a Copilot agent to implement a consolidated, low-maintenance meeting agent that:
- Joins live Zoom/Teams/Google Meet meetings as a participant,
- Briefs a user in real time on what’s being discussed,
- Speaks user-supplied questions into the meeting via an agent voice.

Stack choices for consolidation and maintainability:
- Join/delivery: Recall.ai (single API across Zoom/Teams/Meet)
- Speech: Deepgram for both STT (real-time ASR) and TTS (Aura voices)
- Reasoning/agents: OpenAI (function calling for tool use and orchestration)
- Runtime: Node.js (TypeScript), containerized, stateless services
- Infra: Cloud Run (or AWS Fargate), Postgres (Cloud SQL), optional Redis later
- Observability: OpenTelemetry, structured logs, basic SLOs/alerts

Start here:
- Read ARCHITECTURE.md for the system overview and sequence flows
- Read PROMPTS.md to understand the Agent’s system prompts and tool schemas
- Follow IMPLEMENTATION_GUIDE.md for step-by-step build instructions
- Use REFERENCES.md to consult official docs and open-source examples
- Use TEST_PLAN.md to validate functionality
- Use OPERATIONS.md for deployment, monitoring, and runbooks
- Use SECURITY_PRIVACY.md for data handling, PII, and compliance

Quick checklist before coding:
- [ ] You understand each component and their inputs/outputs
- [ ] You can explain the end-to-end flow and latency budget
- [ ] You know where secrets and environment variables are defined
- [ ] You can list acceptance criteria for each milestone in IMPLEMENTATION_GUIDE.md
- [ ] You have reviewed the official docs linked in REFERENCES.md
