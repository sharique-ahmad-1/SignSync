import React, { useState, useEffect } from 'react';
import { AuroraBackground } from './components/ui/aurora-background';
import { Navbar } from './components/Navbar';
import { DeafView } from './components/DeafView';
import { HearingView } from './components/HearingView';
import { ConversationLog } from './components/ConversationLog';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'deaf' | 'hearing'
  const [signLanguageMode, setSignLanguageMode] = useState('ISL'); // 'ISL' | 'ASL' (Task 2)
  const [serverStatus, setServerStatus] = useState({ online: false, data: null });
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHearingSpeaking, setIsHearingSpeaking] = useState(false);
  const [lastHearingTranscript, setLastHearingTranscript] = useState('');
  const [repeatTrigger, setRepeatTrigger] = useState(0);

  // Conversation history
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'hearing',
      text: 'Welcome to SignSync Phase 5! Switch between ISL and ASL in the top navbar. Real-time gestures map to text and speech seamlessly.',
      timestamp: new Date().toISOString()
    }
  ]);

  // Periodic server health check
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

    if (!isInterim) {
      setTimeout(() => {
        setIsHearingSpeaking(false);
      }, 4000);
    }
  };

  // Handle Deaf user actions (Confirm Receipt, Repeat, Clarify, or SmolLM2 formulated speech)
  const handleDeafAction = async (actionObj) => {
    const newMsg = {
      id: `deaf-${Date.now()}`,
      sender: 'deaf',
      text: actionObj.text,
      action: actionObj.action,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);

    // If Deaf user clicks Repeat, trigger Avatar replay
    if (actionObj.action && actionObj.action.toLowerCase().includes('repeat')) {
      setRepeatTrigger(prev => prev + 1);
    }

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
    } catch (e) {
      // Backend sync deferred
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

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
    } catch (e) {
      // Backend sync deferred
    }
  };

  return (
    <AuroraBackground className="min-h-screen">
      
      {/* Top Navigation with ISL/ASL Dual Detection Switcher */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        signLanguageMode={signLanguageMode}
        setSignLanguageMode={setSignLanguageMode}
        serverStatus={serverStatus}
        mediaPipeReady={mediaPipeReady}
        isListening={isListening}
      />

      {/* Main Responsive Split-Screen Workspace */}
      <main className="flex-1 flex flex-col overflow-y-auto max-w-[1640px] w-full mx-auto p-2 sm:p-4 gap-3">
        
        {/* Top Half: Deaf User View (Webcam + MediaPipe + Dual Gesture Detection + SmolLM2) */}
        {(viewMode === 'split' || viewMode === 'deaf') && (
          <motion.div 
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl backdrop-blur-md bg-slate-950/60 transition-all duration-300 ${
              viewMode === 'deaf' ? 'flex-1 h-full' : 'flex-1 min-h-[360px]'
            }`}
          >
            <DeafView
              signLanguageMode={signLanguageMode}
              onSendAction={handleDeafAction}
              lastHearingTranscript={lastHearingTranscript}
              isHearingSpeaking={isHearingSpeaking}
              onMediaPipeStatusChange={setMediaPipeReady}
            />
          </motion.div>
        )}

        {/* Bottom Half: Hearing User View (Speech-to-Text + 3D Avatar + ISL/ASL Gloss Sequence) */}
        {(viewMode === 'split' || viewMode === 'hearing') && (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl backdrop-blur-md bg-slate-950/60 transition-all duration-300 ${
              viewMode === 'hearing' ? 'flex-1 h-full' : 'flex-1 min-h-[360px]'
            }`}
          >
            <HearingView
              signLanguageMode={signLanguageMode}
              onSpeechTranscribed={handleSpeechTranscribed}
              isListening={isListening}
              setIsListening={setIsListening}
              repeatTrigger={repeatTrigger}
              onSendMessage={handleHearingMessage}
            />
          </motion.div>
        )}

      </main>

      {/* Bottom Conversation Transcript Log */}
      <ConversationLog messages={messages} />

    </AuroraBackground>
  );
}
