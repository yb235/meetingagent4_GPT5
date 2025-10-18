import { Toaster } from 'sonner'
import { MeetingAgentDashboard } from './components/MeetingAgentDashboard'

function App() {
  return (
    <>
      <MeetingAgentDashboard />
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App

