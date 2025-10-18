const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Meeting Agent API Client
export const meetingAgentAPI = {
  // Join a meeting via Recall.ai
  joinMeeting: async (meetingLink: string, options?: {
    botName?: string
    enableAudio?: boolean
    enableVideo?: boolean
  }): Promise<ApiResponse<{ meetingId: string; botId: string }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingLink,
          botName: options?.botName || 'AI Meeting Assistant',
          enableAudio: options?.enableAudio ?? true,
          enableVideo: options?.enableVideo ?? false,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.message || 'Failed to join meeting' }
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' }
    }
  },

  // Get meeting status
  getMeetingStatus: async (meetingId: string): Promise<ApiResponse<{
    meetingId: string
    status: string
    botId?: string
    participants?: number
  }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`)
      
      if (!response.ok) {
        return { success: false, error: 'Failed to get meeting status' }
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' }
    }
  },

  // Submit a question to be asked in the meeting
  askQuestion: async (meetingId: string, text: string, priority: 'polite' | 'interrupt' | 'next-turn' = 'polite'): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, priority }),
      })
      
      if (!response.ok) {
        return { success: false, error: 'Failed to submit question' }
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' }
    }
  },

  // Stop/leave a meeting
  leaveMeeting: async (meetingId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/leave`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        return { success: false, error: 'Failed to leave meeting' }
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' }
    }
  },

  // Health check
  healthCheck: async (): Promise<ApiResponse<{ status: string; services: any }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      return { success: response.ok, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}

