import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
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
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.AUDIO_GATEWAY_PORT || 3001;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Socket.IO connection handler for frontend
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Frontend client connected');

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Frontend client disconnected');
  });
});

// Broadcast endpoints for backend services to push events to UI
app.post('/broadcast/meeting-joined', (req: Request, res: Response) => {
  try {
    const { meetingId, botId } = req.body || {};
    if (!meetingId) return res.status(400).json({ error: 'meetingId required' });
    io.emit('meeting:joined', { meetingId, botId });
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'Error broadcasting meeting joined');
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/broadcast/meeting-ended', (req: Request, res: Response) => {
  try {
    const { meetingId } = req.body || {};
    if (!meetingId) return res.status(400).json({ error: 'meetingId required' });
    io.emit('meeting:ended', { meetingId });
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'Error broadcasting meeting ended');
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/broadcast/transcript', (req: Request, res: Response) => {
  try {
    const segment: TranscriptSegment = req.body;
    if (!segment?.meetingId || !segment?.text) {
      return res.status(400).json({ error: 'invalid segment' });
    }
    io.emit('transcript:update', {
      id: segment.id,
      meetingId: segment.meetingId,
      text: segment.text,
      speaker: segment.speaker,
      isFinal: segment.isFinal,
      timestamp: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'Error broadcasting transcript');
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/broadcast/brief', (req: Request, res: Response) => {
  try {
    const { meetingId, brief } = req.body || {};
    if (!meetingId || !brief?.summary) {
      return res.status(400).json({ error: 'meetingId and brief.summary required' });
    }
    io.emit('brief:update', {
      meetingId,
      brief: {
        topic: brief.topic,
        summary: brief.summary,
        actionItems: brief.actionItems,
        timestamp: new Date().toISOString(),
      },
    });
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'Error broadcasting brief');
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/broadcast/question-asked', (req: Request, res: Response) => {
  try {
    const { meetingId, question, strategy } = req.body || {};
    if (!meetingId || !question) {
      return res.status(400).json({ error: 'meetingId and question required' });
    }
    io.emit('question:asked', { meetingId, question, strategy, timestamp: new Date().toISOString() });
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'Error broadcasting question asked');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'audio-gateway', timestamp: Date.now() });
});

// Manage one gateway instance per process (simple for now)
const gateway = new (class GatewayManager {
  private instance: AudioGateway | null = null;
  get(): AudioGateway {
    if (!this.instance) this.instance = new AudioGateway();
    return this.instance;
  }
})();

// Endpoint to connect to Recall.ai media socket
app.post('/connect-media', async (req: Request, res: Response) => {
  try {
    const { meetingId, mediaSocketUrl } = req.body;

    logger.info({ meetingId, mediaSocketUrl }, 'Connecting to media socket');

    // Connect to Recall.ai media WebSocket and initialize Deepgram streaming
    gateway.get().connectToRecallMedia(String(meetingId), String(mediaSocketUrl)).catch((error) => {
      logger.error({ error, meetingId }, 'Failed to connect to media socket');
    });

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

      // Emit to frontend via WebSocket
      io.emit('transcript:update', {
        id: segment.id,
        meetingId: segment.meetingId,
        text: segment.text,
        speaker: segment.speaker,
        isFinal: segment.isFinal,
        timestamp: new Date().toISOString(),
      });

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

httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, 'Audio Gateway started with WebSocket support');
});

export default app;
export { io };
