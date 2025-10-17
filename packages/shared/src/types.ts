/**
 * Core transcript segment from Deepgram STT
 */
export interface TranscriptSegment {
  id: string;
  meetingId: string;
  tsStart: number; // timestamp in ms
  tsEnd: number; // timestamp in ms
  speaker?: string;
  text: string;
  isFinal: boolean;
}

/**
 * Brief update sent to user
 */
export interface BriefUpdate {
  topic?: string;
  summary: string;
  actionItems?: ActionItem[];
}

export interface ActionItem {
  owner?: string;
  item: string;
}

/**
 * User-submitted question request
 */
export interface AskRequest {
  text: string;
  priority: 'polite' | 'interrupt' | 'next-turn';
}

/**
 * Planned question with strategy
 */
export interface AskPlan {
  refinedText: string;
  strategy: 'raise-hand' | 'interrupt' | 'wait-pause';
  originalPriority: 'polite' | 'interrupt' | 'next-turn';
}

/**
 * Meeting session state
 */
export interface MeetingSession {
  id: string;
  recallBotId?: string;
  mediaSocketUrl?: string;
  status: 'starting' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
}

/**
 * Recall.ai webhook events
 */
export interface RecallWebhookEvent {
  type: 'meeting.started' | 'media.ready' | 'meeting.ended';
  meetingId: string;
  botId?: string;
  mediaSocketUrl?: string;
  timestamp: number;
}

/**
 * OpenAI tool schemas
 */
export interface SendBriefUpdateTool {
  topic?: string;
  summary: string;
  actionItems?: ActionItem[];
}

export interface PlanLiveQuestionTool {
  text: string;
  priority: 'polite' | 'interrupt' | 'next-turn';
}
