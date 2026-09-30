import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { DeafView } from './components/DeafView.jsx';
import { HearingView } from './components/HearingView.jsx';
import { ConversationLog } from './components/ConversationLog.jsx';
import { ConnectionStatusModal } from './components/ConnectionStatusModal.jsx';

export default function App() {
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'deaf' | 'hearing'
  const [serverStatus, setServerStatus] = useState({ online: false, data: null });
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHearingSpeaking, setIsHearingSpeaking] = useState(false);
  const [lastHearingTranscript, setLastHearingTranscript] = useState('');
  const [repeatTrigger, setRepeatTrigger] = useState(0);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // In-memory conversation messages
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'hearing',
      text: 'Welcome to SignSync! Speak or type to see the animated signs below.',
      timestamp: new Date().toISOString()
    }
  ]);

  // Check Express server health periodically
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setServerStatus({ online: true, data });
        } else {
          setServerStatus({ online: false, data: null });
        }
      } catch (err) {
        setServerStatus({ online: false, data: null });
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial messages from server if available
  useEffect(() => {
    async function loadServerMessages() {
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (e) {
        // Fallback to local state if server offline
      }
    }
    loadServerMessages();
  }, []);

  // Handle Speech Transcription updates
  const handleSpeechTranscribed = (text, isInterim = false) => {
    setLastHearingTranscript(text);
    setIsHearingSpeaking(Boolean(text && text.trim().length > 0));

    // Reset speaking flag after 3 seconds of silence
    if (!isInterim) {
      setTimeout(() => {
        setIsHearingSpeaking(false);
      }, 3500);
    }
  };

  // Handle Deaf user actions (Confirm Receipt, Repeat, Clarify)
  const handleDeafAction = async (actionObj) => {
    const newMsg = {
      id: `deaf-${Date.now()}`,
      sender: 'deaf',
      text: actionObj.text,
      action: actionObj.action,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);

    // If Deaf user clicks "Repeat Request", trigger Avatar repeat
    if (actionObj.action && actionObj.action.toLowerCase().includes('repeat')) {
      setRepeatTrigger(prev => prev + 1);
    }

    // Sync to backend if online
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
    } catch (e) {
      console.warn('Backend sync deferred:', e);
    }
  };

  // Handle Hearing user sent messages
  const handleHearingMessage = async (msgObj) => {
    const newMsg = {
      id: `hearing-${Date.now()}`,
      sender: 'hearing',
      text: msgObj.text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);

    // Sync to backend
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
    } catch (e) {
      console.warn('Backend sync deferred:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        serverStatus={serverStatus}
        mediaPipeReady={mediaPipeReady}
        isListening={isListening}
        onOpenStatusModal={() => setIsStatusModalOpen(true)}
      />

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-[1600px] w-full mx-auto p-2 sm:p-4 gap-3">
        
        {/* Top Half: Deaf User View (Webcam + MediaPipe 21 Hand Landmarks) */}
        {(viewMode === 'split' || viewMode === 'deaf') && (
          <div className={`rounded-2xl overflow-hidden border border-slate-800 shadow-xl transition-all duration-300 ${
            viewMode === 'deaf' ? 'flex-1 h-full' : 'flex-1'
          }`}>
            <DeafView
              onSendAction={handleDeafAction}
              lastHearingTranscript={lastHearingTranscript}
              isHearingSpeaking={isHearingSpeaking}
              onMediaPipeStatusChange={setMediaPipeReady}
            />
          </div>
        )}

        {/* Bottom Half: Hearing User View (Speech-to-Text & Mock Avatar System) */}
        {(viewMode === 'split' || viewMode === 'hearing') && (
          <div className={`rounded-2xl overflow-hidden border border-slate-800 shadow-xl transition-all duration-300 ${
            viewMode === 'hearing' ? 'flex-1 h-full' : 'flex-1'
          }`}>
            <HearingView
              onSpeechTranscribed={handleSpeechTranscribed}
              isListening={isListening}
              setIsListening={setIsListening}
              repeatTrigger={repeatTrigger}
              onSendMessage={handleHearingMessage}
            />
          </div>
        )}

      </main>

      {/* Bottom Conversation Transcript Log */}
      <ConversationLog messages={messages} />

      {/* Account Connection Status Modal */}
      <ConnectionStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        serverStatus={serverStatus}
      />

    </div>
  );
}
