import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Volume2, 
  Radio, 
  MessageSquare,
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { MockAvatar } from './MockAvatar.jsx';

export function HearingView({ 
  onSpeechTranscribed, 
  isListening, 
  setIsListening,
  repeatTrigger,
  onSendMessage 
}) {
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [manualText, setManualText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [copied, setCopied] = useState(false);
  const [recognitionError, setRecognitionError] = useState(null);
  
  const recognitionRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      console.warn('[Web Speech API] SpeechRecognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setRecognitionError(null);
    };

    recognition.onresult = (event) => {
      let currentInterim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          currentFinal += result[0].transcript + ' ';
        } else {
          currentInterim += result[0].transcript;
        }
      }

      if (currentFinal) {
        setTranscript(prev => {
          const updated = (prev ? prev + ' ' : '') + currentFinal.trim();
          if (onSpeechTranscribed) {
            onSpeechTranscribed(updated);
          }
          return updated;
        });
      }

      setInterimText(currentInterim);
      if (currentInterim && onSpeechTranscribed) {
        // Also inform the parent for instant visual alert
        onSpeechTranscribed(currentInterim, true);
      }
    };

    recognition.onerror = (event) => {
      console.error('[Web Speech API] Recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setRecognitionError('Microphone access blocked. Please allow mic permissions in your browser or type text manually.');
      } else if (event.error !== 'no-speech') {
        setRecognitionError(`Speech recognition notice: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if user still has listening active
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [setIsListening, onSpeechTranscribed]);

  // Toggle listening
  const toggleListening = () => {
    if (!speechSupported) {
      setRecognitionError('SpeechRecognition not supported in this browser. Please use manual input.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      setRecognitionError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Error starting speech recognition:', err);
      }
    }
  };

  // Submit text (speech or manual) to conversation
  const handleSend = (textToSend) => {
    const content = textToSend || manualText;
    if (!content.trim()) return;

    if (onSendMessage) {
      onSendMessage({
        sender: 'hearing',
        text: content.trim(),
        type: 'speech'
      });
    }

    // Set as active transcript to trigger avatar
    setTranscript(content.trim());
    if (onSpeechTranscribed) {
      onSpeechTranscribed(content.trim());
    }

    setManualText('');
  };

  const handleClear = () => {
    setTranscript('');
    setInterimText('');
    if (onSpeechTranscribed) {
      onSpeechTranscribed('');
    }
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 transition-colors">
      
      {/* Hearing User Top Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-heading">
            Hearing User View • Speech-to-Sign Engine
          </span>
        </div>

        {/* Start / Stop Listening Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg transform active:scale-95 ${
              isListening
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-rose-900/40 ring-2 ring-rose-400/50'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/40'
            }`}
          >
            {isListening ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                <MicOff className="h-4 w-4" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Start Listening</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Split between Speech Transcript Display & Mock Avatar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[300px]">
        
        {/* Left Col: Live Speech Transcription & Input (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          
          {/* Transcript Display Box */}
          <div className="flex-1 flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 p-3.5 relative overflow-hidden min-h-[160px]">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                Live Transcribed Speech
              </span>

              <div className="flex items-center gap-1">
                {transcript && (
                  <>
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                      title="Copy Transcript"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={handleClear}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      title="Clear Transcript"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Transcript text content */}
            <div className="flex-1 py-3 overflow-y-auto text-sm">
              {transcript || interimText ? (
                <div className="space-y-1">
                  <span className="text-slate-100 font-medium leading-relaxed">
                    {transcript}
                  </span>
                  {interimText && (
                    <span className="text-indigo-400 italic font-normal ml-1 animate-pulse">
                      {interimText}...
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                  <Radio className={`h-8 w-8 mb-2 ${isListening ? 'text-rose-400 animate-pulse' : 'text-slate-600'}`} />
                  <p className="text-xs">
                    {isListening 
                      ? 'Listening to speech... say "Hello", "Help", or "Thank you"' 
                      : 'Click "Start Listening" or type a message below'}
                  </p>
                </div>
              )}
            </div>

            {/* Listening Waveform Bar */}
            {isListening && (
              <div className="flex items-center justify-center gap-1 py-1.5 bg-rose-950/30 rounded-lg border border-rose-500/20">
                <div className="h-3 w-1 bg-rose-500 animate-pulse rounded-full" />
                <div className="h-5 w-1 bg-rose-400 animate-pulse rounded-full" style={{ animationDelay: '0.1s' }} />
                <div className="h-2 w-1 bg-rose-500 animate-pulse rounded-full" style={{ animationDelay: '0.2s' }} />
                <div className="h-6 w-1 bg-rose-400 animate-pulse rounded-full" style={{ animationDelay: '0.3s' }} />
                <div className="h-3 w-1 bg-rose-500 animate-pulse rounded-full" style={{ animationDelay: '0.15s' }} />
                <span className="text-[10px] text-rose-300 font-semibold ml-2">Audio Active</span>
              </div>
            )}

            {/* Error badge */}
            {recognitionError && (
              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{recognitionError}</span>
              </div>
            )}

          </div>

          {/* Manual Input Fallback & Quick Phrases */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Or type here (e.g. 'Hello, do you need help?')..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!manualText.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send</span>
            </button>
          </form>

        </div>

        {/* Right Col: Mock Avatar Sign Language Display (7 cols) */}
        <div className="lg:col-span-7">
          <MockAvatar
            transcribedText={transcript || interimText}
            repeatTrigger={repeatTrigger}
          />
        </div>

      </div>

    </div>
  );
}
