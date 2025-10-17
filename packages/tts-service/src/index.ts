import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import pino from 'pino';
import { createClient } from '@deepgram/sdk';
import { AskPlan } from '@meetingagent/shared';

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const app = express();
const PORT = process.env.TTS_SERVICE_PORT || 3003;

app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'tts-service', timestamp: Date.now() });
});

// Generate TTS and inject into meeting
app.post('/synthesize', async (req: Request, res: Response) => {
  try {
    const { meetingId, plan } = req.body as { meetingId: string; plan: AskPlan };

    logger.info({ meetingId, plan }, 'Synthesizing speech');

    // TODO: Generate TTS using Deepgram Aura
    // TODO: Inject audio into Recall.ai media socket based on strategy

    res.status(202).json({ status: 'synthesizing', meetingId });
  } catch (error) {
    logger.error({ error }, 'Error synthesizing speech');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class TTSService {
  private deepgramApiKey: string;

  constructor() {
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY || '';
  }

  async synthesizeSpeech(text: string, _strategy: string): Promise<Buffer> {
    if (!this.deepgramApiKey) {
      throw new Error('Deepgram API key not configured');
    }

    const deepgram = createClient(this.deepgramApiKey);

    try {
      // Use Deepgram Aura TTS
      const response = await deepgram.speak.request(
        { text },
        {
          model: 'aura-asteria-en',
          encoding: 'linear16',
          sample_rate: 16000,
        }
      );

      // Get audio stream
      const stream = await response.getStream();
      if (!stream) {
        throw new Error('No audio stream received');
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      logger.info({ textLength: text.length, audioSize: chunks.length }, 'TTS generated');

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error({ error }, 'Error generating TTS');
      throw error;
    }
  }

  async injectAudio(
    meetingId: string,
    audioBuffer: Buffer,
    strategy: 'raise-hand' | 'interrupt' | 'wait-pause'
  ): Promise<void> {
    logger.info({ meetingId, strategy, audioSize: audioBuffer.length }, 'Injecting audio');

    // TODO: Implement strategy-based injection
    // - interrupt: inject immediately
    // - wait-pause: wait for VAD pause detection
    // - raise-hand: use platform raise-hand feature if available

    // TODO: Send audio to Recall.ai media socket via audio-gateway
  }
}

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'TTS Service started');
});

export default app;
