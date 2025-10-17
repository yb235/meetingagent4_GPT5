# Knowledge Check (Complete before coding)

Answer these in your own words:

1) Describe the end-to-end flow from “join meeting” to “agent speaks a user’s question.”
2) What are the required fields for:
   - TranscriptSegment
   - BriefUpdate
   - AskRequest
   - AskPlan
3) When should the agent send a brief update and how is spam avoided?
4) What is the strategy difference between `polite`, `interrupt`, and `next-turn`?
5) What happens if the Deepgram WebSocket disconnects? Outline reconnection logic and backpressure handling.
6) How do we avoid leaking PII in logs and briefs?
7) What is the latency target for starting TTS injection on an `interrupt` question?

Only proceed if you can answer all confidently.
