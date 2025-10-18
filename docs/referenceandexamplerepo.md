# References and Example Repos

Recall.ai
- Docs: https://docs.recall.ai/
- Concepts: Bot joins, media WebSocket (receive+send audio), meeting lifecycle, authentication, webhooks.
- Example guides (see their docs): setting up a meeting bot, handling audio streams, injecting audio.

Deepgram
- Realtime Streaming API (STT): https://developers.deepgram.com/docs/streaming
- Deepgram SDKs and examples: https://github.com/deepgram
- Aura TTS (Text-to-Speech): https://developers.deepgram.com/docs/tts
- Redaction and features: https://developers.deepgram.com/docs/redaction

OpenAI
- Function Calling and Structured Outputs: https://platform.openai.com/docs/guides/function-calling
- Chat Completions API: https://platform.openai.com/docs/api-reference/chat
- OpenAI Cookbook (patterns and examples): https://github.com/openai/openai-cookbook

Auxiliary patterns and examples
- Streaming WS patterns in Node: ws library docs https://github.com/websockets/ws
- OpenTelemetry for Node: https://opentelemetry.io/docs/languages/js/
- Google Cloud Run (deploy containers): https://cloud.google.com/run/docs
- Postgres on Cloud SQL: https://cloud.google.com/sql/docs/postgres
- Slack Web API (if you push briefs to Slack): https://api.slack.com/web

Similar open-source integrations (for concepts)
- Deepgram + Twilio Media Streams examples (duplex streaming, latency patterns): https://github.com/deepgram-devs/twilio-media-streams
- OpenAI agent tool-calling examples (Cookbook): https://github.com/openai/openai-cookbook/tree/main/examples/Function_calling

Tip: Even if examples show Twilio instead of Recall.ai, the streaming/media patterns are analogous: duplex audio WebSockets, framing/encoding, backpressure, and low-latency handling.
