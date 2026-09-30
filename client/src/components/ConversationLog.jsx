import React, { useState } from 'react';
import { 
  MessageSquare, 
  Hand, 
  Mic, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';

export function ConversationLog({ messages = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Collapsible Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs">
          <MessageSquare className="h-4 w-4 text-indigo-600" />
          <span className="font-semibold text-slate-800">
            Real-Time Two-Way Conversation Transcript
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-mono font-medium border border-slate-200">
            {messages.length} events
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>{isExpanded ? 'Hide History' : 'Show History'}</span>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </div>

      {/* Expanded Message Feed */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto px-4 py-3 border-t border-slate-200 max-h-60 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4">
              No conversation messages yet. Speak with the microphone or click quick actions to begin!
            </p>
          ) : (
            messages.map((msg, index) => {
              const isDeaf = msg.sender === 'deaf';
              return (
                <div 
                  key={msg.id || index}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs transition-colors border ${
                    isDeaf 
                      ? 'bg-cyan-50/70 border-cyan-200 text-cyan-950' 
                      : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    isDeaf ? 'bg-cyan-100 text-cyan-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {isDeaf ? <Hand className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-bold text-[11px] tracking-wide uppercase text-slate-800">
                        {isDeaf ? 'Deaf User (Visual)' : 'Hearing User (Voice)'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
