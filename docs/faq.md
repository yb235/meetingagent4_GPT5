# FAQ

Q: Can we replace Recall.ai with Twilio?
A: Yes, for PSTN/SIP or dial-in. Media streaming patterns stay similar. This repo assumes Recall.ai for cross-platform video bots.

Q: Why Deepgram for both STT and TTS?
A: Consolidation reduces complexity and tuning overhead. Aura TTS meets low-latency needs for speaking in-meeting.

Q: Do we need Redis?
A: Not initially. Add it if transcript fan-out or latency under load requires pub/sub.

Q: How do we handle cross-talk and barge-in?
A: Use VAD/turn-taking heuristics; default to wait-for-pause except `interrupt`. Optionally integrate platform “raise hand.”

Q: How to store audio?
A: Avoid storing raw audio unless required. If needed, use object storage with short TTLs and explicit consent.
