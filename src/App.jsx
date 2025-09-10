import React, { useState, useCallback } from 'react'
import ConversationPage from './components/ConversationPage'
import ThreeBackground from './components/ThreeBackground'

export default function App() {
  const [activeMessageType, setActiveMessageType] = useState('default')

  const handleSpeakerChange = useCallback((speaker) => {
    if (speaker === 'Teacher') setActiveMessageType('teacher')
    else if (speaker === 'Learner') setActiveMessageType('student')
    else setActiveMessageType('default')
  }, [])

  return (
    <div className="relative min-h-screen">
      <ThreeBackground messageType={activeMessageType} />
      <div className="relative z-10">
        <ConversationPage onSpeakerChange={handleSpeakerChange} />
      </div>
    </div>
  )
}
