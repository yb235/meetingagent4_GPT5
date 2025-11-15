import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { RecallWebhookEvent, AskRequest } from '@meetingagent/shared';
import fetch from 'node-fetch';

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

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

app.use(bodyParser.json());
app.use(pinoHttp({ logger }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'api-gateway', timestamp: Date.now() });
});

// Recall.ai webhook endpoint
app.post('/webhooks/recall', (req: Request, res: Response) => {
  try {
    const event: RecallWebhookEvent = req.body;
    logger.info({ event }, 'Received Recall.ai webhook event');

    // TODO: Verify webhook signature
    // TODO: Process event and forward to appropriate service

    switch (event.type) {
      case 'meeting.started':
        logger.info({ meetingId: event.meetingId }, 'Meeting started');
        break;
      case 'media.ready':
        logger.info(
          { meetingId: event.meetingId, mediaSocketUrl: event.mediaSocketUrl },
          'Media socket ready'
        );
        // Notify audio-gateway with media socket URL
        try {
          fetch('http://audio-gateway:3001/connect-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              meetingId: event.meetingId,
              mediaSocketUrl: event.mediaSocketUrl,
            }),
          }).catch(() => undefined);
        } catch {
          // ignore
        }
        break;
      case 'meeting.ended':
        logger.info({ meetingId: event.meetingId }, 'Meeting ended');
        break;
      default:
        logger.warn({ eventType: event.type }, 'Unknown event type');
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ error }, 'Error processing webhook');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User API: Submit a question to be asked in the meeting
app.post('/meetings/:meetingId/ask', (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const askRequest: AskRequest = req.body;

    logger.info({ meetingId, askRequest }, 'Received ask request');

    // TODO: Validate request
    // TODO: Forward to agent-service for planning
    // Broadcast question asked to frontend (fire-and-forget)
    try {
      fetch('http://audio-gateway:3001/broadcast/question-asked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, question: askRequest.text, strategy: askRequest.priority })
      }).catch(() => undefined);
    } catch {
      // ignore broadcast errors
    }

    res.status(202).json({ status: 'accepted', meetingId });
  } catch (error) {
    logger.error({ error }, 'Error processing ask request');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User API: Get meeting status
app.get('/meetings/:meetingId', (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;

    logger.info({ meetingId }, 'Get meeting status request');

    // TODO: Query meeting session from database or in-memory store

    res.json({ meetingId, status: 'active' });
  } catch (error) {
    logger.error({ error }, 'Error getting meeting status');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User API: Join a meeting
app.post('/meetings/join', (req: Request, res: Response) => {
  try {
    const { meetingLink, botName, enableAudio, enableVideo } = req.body;

    logger.info({ meetingLink, botName }, 'Join meeting request');

    // TODO: Call Recall.ai API to create bot and join meeting
    // For now, return mock success response
    const meetingId = `meeting-${Date.now()}`;
    const botId = `bot-${Date.now()}`;

    // Broadcast meeting joined for UI
    try {
      fetch('http://audio-gateway:3001/broadcast/meeting-joined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, botId })
      }).catch(() => undefined);
    } catch {
      // ignore broadcast errors
    }

    res.status(200).json({ 
      meetingId, 
      botId,
      status: 'joining',
      message: 'Bot is joining the meeting'
    });
  } catch (error) {
    logger.error({ error }, 'Error joining meeting');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User API: Leave a meeting
app.post('/meetings/:meetingId/leave', (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;

    logger.info({ meetingId }, 'Leave meeting request');

    // TODO: Call Recall.ai API to stop bot
    
    res.status(200).json({ 
      status: 'left',
      message: 'Bot has left the meeting'
    });
  } catch (error) {
    logger.error({ error }, 'Error leaving meeting');
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'API Gateway started');
});

export default app;
