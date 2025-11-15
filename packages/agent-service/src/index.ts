import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import pino from 'pino';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import {
  TranscriptSegment,
  BriefUpdate,
  AskRequest,
  AskPlan,
  SendBriefUpdateTool,
  PlanLiveQuestionTool,
} from '@meetingagent/shared';

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const app = express();
const PORT = process.env.AGENT_SERVICE_PORT || 3002;

app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'agent-service', timestamp: Date.now() });
});

// Receive transcript segments from audio-gateway
app.post('/transcripts', async (req: Request, res: Response) => {
  try {
    const segment: TranscriptSegment = req.body;
    logger.info({ segment }, 'Received transcript segment');

    // TODO: Process transcript with OpenAI
    // TODO: Update meeting context
    // TODO: Decide whether to send brief update

    res.status(202).json({ status: 'received' });
  } catch (error) {
    logger.error({ error }, 'Error processing transcript');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process ask request and plan question
app.post('/ask', async (req: Request, res: Response) => {
  try {
    const askRequest: AskRequest = req.body;
    logger.info({ askRequest }, 'Received ask request');

    // TODO: Use OpenAI to plan the question
    // TODO: Forward to TTS service

    res.status(202).json({ status: 'planning' });
  } catch (error) {
    logger.error({ error }, 'Error processing ask request');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class AgentOrchestrator {
  private openai: OpenAI;
  private meetingContexts: Map<string, MeetingContext>;
  private lastBriefTime: Map<string, number>;
  private readonly BRIEF_THROTTLE_MS = 30000; // 30 seconds

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.meetingContexts = new Map();
    this.lastBriefTime = new Map();
  }

  async processTranscript(segment: TranscriptSegment): Promise<void> {
    const context = this.getOrCreateContext(segment.meetingId);

    // Add segment to context
    context.segments.push(segment);

    // Only process finals for now
    if (!segment.isFinal) {
      return;
    }

    // Update rolling summary
    const messages = [
      {
        role: 'system' as const,
        content: this.getSystemPrompt(),
      },
      {
        role: 'user' as const,
        content: `New transcript segment: "${segment.text}"\n\nCurrent context: ${JSON.stringify(context.summary)}`,
      },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        tools: this.getTools(),
        tool_choice: 'auto',
      });

      const toolCalls = completion.choices[0]?.message?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'send_brief_update') {
            await this.handleBriefUpdate(
              segment.meetingId,
              JSON.parse(toolCall.function.arguments)
            );
          }
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error calling OpenAI');
    }
  }

  async planQuestion(meetingId: string, askRequest: AskRequest): Promise<AskPlan> {
    const messages = [
      {
        role: 'system' as const,
        content: this.getQuestionPlanningPrompt(),
      },
      {
        role: 'user' as const,
        content: `Plan this question: "${askRequest.text}" with priority: ${askRequest.priority}`,
      },
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      tools: [this.getPlanLiveQuestionTool()],
      tool_choice: { type: 'function', function: { name: 'plan_live_question' } },
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const args: PlanLiveQuestionTool = JSON.parse(toolCall.function.arguments);
      const strategy = this.mapPriorityToStrategy(args.priority);

      return {
        refinedText: args.text,
        strategy,
        originalPriority: args.priority,
      };
    }

    throw new Error('Failed to plan question');
  }

  private async handleBriefUpdate(
    meetingId: string,
    briefData: SendBriefUpdateTool
  ): Promise<void> {
    const now = Date.now();
    const lastBrief = this.lastBriefTime.get(meetingId) || 0;

    // Throttle briefs
    if (now - lastBrief < this.BRIEF_THROTTLE_MS) {
      logger.info({ meetingId }, 'Throttling brief update');
      return;
    }

    const brief: BriefUpdate = {
      topic: briefData.topic,
      summary: briefData.summary,
      actionItems: briefData.actionItems,
    };

    logger.info({ meetingId, brief }, 'Sending brief update');

    // TODO: Send brief to user console/notifier
    this.lastBriefTime.set(meetingId, now);

    // Broadcast brief to frontend via audio-gateway (fire-and-forget)
    try {
      await fetch('http://audio-gateway:3001/broadcast/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, brief })
      }).catch(() => undefined);
    } catch {
      // ignore broadcast errors
    }
  }

  private getOrCreateContext(meetingId: string): MeetingContext {
    if (!this.meetingContexts.has(meetingId)) {
      this.meetingContexts.set(meetingId, {
        meetingId,
        segments: [],
        summary: {
          topic: 'Unknown',
          keyPoints: [],
          actionItems: [],
        },
      });
    }
    return this.meetingContexts.get(meetingId)!;
  }

  private getSystemPrompt(): string {
    return `You are a real-time meeting assistant. You consume streaming transcripts and produce concise, actionable briefs for the user while planning in-meeting questions on demand. Operate via the provided tools. Avoid hallucinations. Use event-driven cadence and throttle briefs to avoid spam.

Constraints:
- Prioritize accuracy and brevity for live briefs: 2-4 sentences unless a significant change demands more.
- Avoid hallucination; quote or paraphrase only from the transcript/context.
- Use send_brief_update when a topic changes or a notable decision/action item arises.
- Never include secrets, PII, or private info in briefs unless explicitly permitted by policy flags.
- Always operate via tools for actions; do not assume tool success without confirmation.`;
  }

  private getQuestionPlanningPrompt(): string {
    return `You are planning a question to be asked in a live meeting. Refine the user's question for clarity, tone, and appropriateness. Consider the priority level when planning.`;
  }

  private getTools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'send_brief_update',
          description: 'Push a brief update to the user about the meeting state.',
          parameters: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              summary: { type: 'string', minLength: 10 },
              actionItems: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    owner: { type: 'string' },
                    item: { type: 'string' },
                  },
                  required: ['item'],
                },
              },
            },
            required: ['summary'],
          },
        },
      },
    ];
  }

  private getPlanLiveQuestionTool(): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: 'plan_live_question',
        description: 'Plan and refine a question to be asked in the meeting.',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', minLength: 3 },
            priority: { type: 'string', enum: ['polite', 'interrupt', 'next-turn'] },
          },
          required: ['text'],
        },
      },
    };
  }

  private mapPriorityToStrategy(
    priority: 'polite' | 'interrupt' | 'next-turn'
  ): 'raise-hand' | 'interrupt' | 'wait-pause' {
    switch (priority) {
      case 'polite':
        return 'raise-hand';
      case 'interrupt':
        return 'interrupt';
      case 'next-turn':
        return 'wait-pause';
    }
  }
}

interface MeetingContext {
  meetingId: string;
  segments: TranscriptSegment[];
  summary: {
    topic: string;
    keyPoints: string[];
    actionItems: string[];
  };
}

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Agent Service started');
});

export default app;
