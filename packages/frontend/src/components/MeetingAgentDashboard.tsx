import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { 
  Robot,
  VideoCamera,
  Stop,
  SpeakerSimpleHigh,
  Lightbulb,
  Check,
  X,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { meetingAgentAPI } from '../lib/api'
import { useMeetingSocket } from '../hooks/useMeetingSocket'

export function MeetingAgentDashboard() {
  const [meetingLink, setMeetingLink] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [questionPriority, setQuestionPriority] = useState<'polite' | 'interrupt' | 'next-turn'>('polite')
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)
  const [botStatus, setBotStatus] = useState<'idle' | 'joining' | 'active' | 'leaving'>('idle')
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  
  const { 
    isConnected, 
    activeMeetings, 
    transcripts,
    briefs,
  } = useMeetingSocket()

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const response = await meetingAgentAPI.healthCheck()
      if (response.success) {
        setConnectionStatus('connected')
        toast.success('Connected to Meeting Agent services')
      } else {
        setConnectionStatus('disconnected')
        toast.error('Cannot connect to Meeting Agent services')
      }
    }
    checkHealth()
  }, [])

  const handleJoinMeeting = async () => {
    if (!meetingLink.trim()) {
      toast.error('Please enter a meeting link')
      return
    }

    setBotStatus('joining')
    try {
      const response = await meetingAgentAPI.joinMeeting(meetingLink, {
        botName: 'AI Meeting Assistant',
        enableAudio: true,
        enableVideo: false,
      })

      if (response.success && response.data) {
        setActiveMeetingId(response.data.meetingId)
        setBotStatus('active')
        toast.success('AI bot joined the meeting successfully!')
      } else {
        throw new Error(response.error || 'Failed to join meeting')
      }
    } catch (error: any) {
      console.error('Error joining meeting:', error)
      setBotStatus('idle')
      toast.error(error.message || 'Failed to join meeting')
    }
  }

  const handleLeaveMeeting = async () => {
    if (!activeMeetingId) return

    setBotStatus('leaving')
    try {
      await meetingAgentAPI.leaveMeeting(activeMeetingId)
      setActiveMeetingId(null)
      setBotStatus('idle')
      setMeetingLink('')
      toast.success('AI bot left the meeting')
    } catch (error: any) {
      setBotStatus('active')
      toast.error('Failed to leave meeting')
    }
  }

  const handleAskQuestion = async () => {
    if (!questionText.trim()) {
      toast.error('Please enter a question')
      return
    }

    if (!activeMeetingId) {
      toast.error('No active meeting')
      return
    }

    try {
      const response = await meetingAgentAPI.askQuestion(activeMeetingId, questionText, questionPriority)
      
      if (response.success) {
        setQuestionText('')
        toast.success(`Question submitted (${questionPriority} mode)`)
      } else {
        throw new Error(response.error || 'Failed to submit question')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit question')
    }
  }

  const activeTranscripts = activeMeetingId ? (transcripts[activeMeetingId] || []) : []
  const activeBriefs = activeMeetingId ? (briefs[activeMeetingId] || []) : []

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Robot className="h-8 w-8 text-primary" />
              AI Meeting Agent
            </h1>
            <p className="text-muted-foreground mt-1">
              Join meetings, get live briefs, and ask questions via AI
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
              {connectionStatus === 'connected' ? (
                <><Check className="h-3 w-3 mr-1" /> Services Online</>
              ) : (
                <><X className="h-3 w-3 mr-1" /> Services Offline</>
              )}
            </Badge>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Meeting Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Join Meeting Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <VideoCamera className="h-6 w-6" />
                  Join Meeting
                </CardTitle>
                <CardDescription>
                  Deploy an AI bot to join your Zoom, Teams, or Google Meet call
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meeting Link</label>
                  <Input 
                    placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom link..."
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    disabled={botStatus !== 'idle'}
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  {botStatus === 'idle' ? (
                    <Button 
                      onClick={handleJoinMeeting}
                      className="gap-2"
                      disabled={!meetingLink.trim() || connectionStatus !== 'connected'}
                    >
                      <VideoCamera className="h-4 w-4" />
                      Deploy AI Bot
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleLeaveMeeting}
                      variant="destructive"
                      className="gap-2"
                      disabled={botStatus === 'leaving'}
                    >
                      <Stop className="h-4 w-4" />
                      {botStatus === 'leaving' ? 'Leaving...' : 'Leave Meeting'}
                    </Button>
                  )}
                  
                  <Badge variant={
                    botStatus === 'active' ? 'default' :
                    botStatus === 'joining' ? 'secondary' :
                    botStatus === 'leaving' ? 'destructive' : 'outline'
                  }>
                    {botStatus === 'idle' ? 'Ready' :
                     botStatus === 'joining' ? 'Joining Meeting...' :
                     botStatus === 'active' ? 'Active in Meeting' :
                     'Leaving...'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Ask Question Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SpeakerSimpleHigh className="h-5 w-5" />
                  Ask Question in Meeting
                </CardTitle>
                <CardDescription>
                  Submit a question for the AI to ask in the meeting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Question</label>
                  <Input 
                    placeholder="What should we prioritize next quarter?"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                    disabled={!activeMeetingId}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Speaking Strategy</label>
                  <Select 
                    value={questionPriority}
                    onChange={(e) => setQuestionPriority(e.target.value as any)}
                    disabled={!activeMeetingId}
                  >
                    <option value="polite">Polite (raise hand/wait for turn)</option>
                    <option value="next-turn">Next Turn (wait for pause)</option>
                    <option value="interrupt">Interrupt (speak immediately)</option>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleAskQuestion} 
                  variant="default"
                  disabled={!activeMeetingId || !questionText.trim()}
                  className="w-full"
                >
                  <SpeakerSimpleHigh className="h-4 w-4 mr-2" />
                  Ask Question
                </Button>

                {!activeMeetingId && (
                  <p className="text-xs text-muted-foreground text-center">
                    Join a meeting first to ask questions
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Live Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SpeakerSimpleHigh className="h-5 w-5" />
                  Live Transcript
                </CardTitle>
                <CardDescription>Real-time conversation from the meeting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 h-64 overflow-y-auto space-y-2">
                  {activeTranscripts.length > 0 ? (
                    activeTranscripts.slice(-50).map((t, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-muted-foreground mr-2 text-xs">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </span>
                        {t.speaker && (
                          <span className="font-medium mr-1">{t.speaker}:</span>
                        )}
                        <span className={t.isFinal ? '' : 'italic opacity-70'}>{t.text}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p className="text-sm">No transcripts yet</p>
                      <p className="text-xs">Transcripts will appear here when the bot joins a meeting</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Briefs & Info */}
          <div className="space-y-6">
            {/* Live Briefs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Live Briefs
                </CardTitle>
                <CardDescription>AI-generated meeting summaries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activeBriefs.length > 0 ? (
                    activeBriefs.map((brief, idx) => (
                      <div key={idx} className="p-3 border rounded-lg space-y-2">
                        {brief.topic && (
                          <p className="font-medium text-sm text-primary">{brief.topic}</p>
                        )}
                        <p className="text-sm">{brief.summary}</p>
                        {brief.actionItems && brief.actionItems.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Action Items:</p>
                            {brief.actionItems.map((item, i) => (
                              <div key={i} className="text-xs flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>
                                  {item.owner && <span className="font-medium">{item.owner}: </span>}
                                  {item.item}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(brief.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Lightbulb className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No briefs yet</p>
                      <p className="text-xs mt-1">
                        AI will generate summaries as the meeting progresses
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Capabilities</CardTitle>
                <CardDescription>What your AI agent can do</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Real-time transcription</span>
                  </div>
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Live meeting briefs</span>
                  </div>
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Ask questions via voice</span>
                  </div>
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Action item extraction</span>
                  </div>
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Context-aware responses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

