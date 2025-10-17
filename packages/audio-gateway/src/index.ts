import express, { Request, Response } from 'express';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import pino from 'pino';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { TranscriptSegment } from '@meetingagent/shared';

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const app = express();
const PORT = process.env.AUDIO_GATEWAY_PORT || 3001;

app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'audio-gateway', timestamp: Date.now() });
});

// Endpoint to connect to Recall.ai media socket
app.post('/connect-media', async (req: Request, res: Response) => {
  try {
    const { meetingId, mediaSocketUrl } = req.body;

    logger.info({ meetingId, mediaSocketUrl }, 'Connecting to media socket');

    // TODO: Connect to Recall.ai media WebSocket
    // TODO: Setup Deepgram streaming connection
    // For now, just acknowledge
    res.status(202).json({ status: 'connecting', meetingId });
  } catch (error) {
    logger.error({ error }, 'Error connecting to media socket');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class AudioGateway {
  private deepgramApiKey: string;
  private recallMediaWs?: WebSocket;
  private deepgramConnection?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private meetingId?: string;

  constructor() {
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY || '';
  }

  async connectToRecallMedia(meetingId: string, mediaSocketUrl: string): Promise<void> {
    this.meetingId = meetingId;

    logger.info({ meetingId, mediaSocketUrl }, 'Connecting to Recall.ai media socket');

    // Connect to Recall.ai media WebSocket
    this.recallMediaWs = new WebSocket(mediaSocketUrl);

    this.recallMediaWs.on('open', () => {
      logger.info({ meetingId }, 'Recall.ai media socket connected');
      this.setupDeepgramConnection();
    });

    this.recallMediaWs.on('message', (data: Buffer) => {
      // Forward audio frames to Deepgram
      if (this.deepgramConnection) {
        this.deepgramConnection.send(data);
      }
    });

    this.recallMediaWs.on('error', (error) => {
      logger.error({ error, meetingId }, 'Recall.ai media socket error');
    });

    this.recallMediaWs.on('close', () => {
      logger.info({ meetingId }, 'Recall.ai media socket closed');
      this.cleanup();
    });
  }

  private setupDeepgramConnection(): void {
    if (!this.deepgramApiKey) {
      logger.error('Deepgram API key not configured');
      return;
    }

    const deepgram = createClient(this.deepgramApiKey);

    this.deepgramConnection = deepgram.listen.live({
      model: 'nova-2',
      language: 'en',
      smart_format: true,
      punctuate: true,
      interim_results: true,
      encoding: 'linear16',
      sample_rate: 16000,
    });

    this.deepgramConnection.on(LiveTranscriptionEvents.Open, () => {
      logger.info({ meetingId: this.meetingId }, 'Deepgram connection opened');
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.deepgramConnection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (transcript && transcript.trim().length > 0) {
        const isFinal = data.is_final === true;
        
        const segment: TranscriptSegment = {
          id: `${this.meetingId}-${Date.now()}`,
          meetingId: this.meetingId!,
          tsStart: Date.now(), // TODO: Use proper timestamps from Deepgram
          tsEnd: Date.now(),
          speaker: data.channel?.alternatives?.[0]?.words?.[0]?.speaker?.toString(),
          text: transcript,
          isFinal,
        };

        logger.info({ segment }, isFinal ? 'Final transcript' : 'Partial transcript');

        // TODO: Forward transcript segment to agent-service
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.deepgramConnection.on(LiveTranscriptionEvents.Error, (error: any) => {
      logger.error({ error, meetingId: this.meetingId }, 'Deepgram error');
    });

    this.deepgramConnection.on(LiveTranscriptionEvents.Close, () => {
      logger.info({ meetingId: this.meetingId }, 'Deepgram connection closed');
    });
  }

  private cleanup(): void {
    if (this.deepgramConnection) {
      this.deepgramConnection.finish();
      this.deepgramConnection = undefined;
    }
    if (this.recallMediaWs) {
      this.recallMediaWs.close();
      this.recallMediaWs = undefined;
    }
  }
}

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Audio Gateway started');
});

export default app;
