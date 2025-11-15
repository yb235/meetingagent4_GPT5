import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface TranscriptSegment {
  id: string;
  meetingId: string;
  text: string;
  speaker?: string;
  timestamp: string;
  isFinal: boolean;
}

interface BriefUpdate {
  topic?: string;
  summary: string;
  actionItems?: Array<{ owner?: string; item: string }>;
  timestamp: string;
}

interface MeetingState {
  meetingId: string;
  status: 'active' | 'ended';
  botId?: string;
  participants?: number;
}

interface UseMeetingSocketProps {
  url?: string;
  autoConnect?: boolean;
}

export function useMeetingSocket({ 
  url,
  autoConnect = true 
}: UseMeetingSocketProps = {}) {
  // Derive default WS URL from window.location (works behind reverse proxy)
  const defaultUrl = (() => {
    try {
      const loc = window.location;
      const proto = loc.protocol === 'https:' ? 'wss' : 'ws';
      // socket.io client uses http(s) base; we compute from window location
      const httpProto = proto === 'wss' ? 'https' : 'http';
      return `${httpProto}://${loc.host}`;
    } catch {
      return 'http://localhost:3001';
    }
  })();
  url = url || defaultUrl;
  const [isConnected, setIsConnected] = useState(false);
  const [activeMeetings, setActiveMeetings] = useState<Record<string, MeetingState>>({});
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptSegment[]>>({});
  const [briefs, setBriefs] = useState<Record<string, BriefUpdate[]>>({});
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to meeting agent server');
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from meeting agent server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Meeting socket connection error:', error);
      setIsConnected(false);
      setConnectionError(error.message);
    });

    // Meeting joined event
    socket.on('meeting:joined', (data: { meetingId: string; botId: string }) => {
      console.log('Meeting joined:', data);
      setActiveMeetings(prev => ({
        ...prev,
        [data.meetingId]: {
          meetingId: data.meetingId,
          status: 'active',
          botId: data.botId,
        }
      }));
    });

    // Transcript updates
    socket.on('transcript:update', (segment: TranscriptSegment) => {
      console.log('Transcript update:', segment);
      setTranscripts(prev => ({
        ...prev,
        [segment.meetingId]: [...(prev[segment.meetingId] || []), segment]
      }));
    });

    // Brief updates
    socket.on('brief:update', (data: { meetingId: string; brief: BriefUpdate }) => {
      console.log('Brief update:', data);
      setBriefs(prev => ({
        ...prev,
        [data.meetingId]: [...(prev[data.meetingId] || []), data.brief]
      }));
    });

    // Meeting ended event
    socket.on('meeting:ended', (data: { meetingId: string }) => {
      console.log('Meeting ended:', data);
      setActiveMeetings(prev => {
        const updated = { ...prev };
        if (updated[data.meetingId]) {
          updated[data.meetingId].status = 'ended';
        }
        return updated;
      });
    });

    // Question asked event (confirmation)
    socket.on('question:asked', (data: { meetingId: string; question: string; strategy: string }) => {
      console.log('Question asked:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, [url, autoConnect]);

  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  const clearTranscripts = useCallback((meetingId: string) => {
    setTranscripts(prev => {
      const updated = { ...prev };
      delete updated[meetingId];
      return updated;
    });
  }, []);

  const clearBriefs = useCallback((meetingId: string) => {
    setBriefs(prev => {
      const updated = { ...prev };
      delete updated[meetingId];
      return updated;
    });
  }, []);

  return {
    isConnected,
    connectionError,
    activeMeetings,
    transcripts,
    briefs,
    connect,
    disconnect,
    clearTranscripts,
    clearBriefs,
  };
}

