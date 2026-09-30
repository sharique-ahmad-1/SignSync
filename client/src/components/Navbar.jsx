import React from 'react';
import { 
  Activity, 
  Hand, 
  Mic, 
  Server, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Info,
  Maximize2,
  Volume2
} from 'lucide-react';

export function Navbar({ 
  viewMode, 
  setViewMode, 
  serverStatus, 
  mediaPipeReady, 
  isListening, 
  onOpenStatusModal 
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Hand className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-heading tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                SignSync
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Accessibility Hackathon
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Two-Way Real-Time Smart Communicator: Deaf ↔ Hearing
            </p>
          </div>
        </div>

        {/* Live System Diagnostics Badges */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 text-xs">
          
          {/* Node Server Badge */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer hover:bg-slate-800/60"
            onClick={onOpenStatusModal}
            title="Express API Status"
          >
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-300">Backend:</span>
            <span className={`flex items-center gap-1 font-medium ${
              serverStatus.online ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                serverStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              {serverStatus.online ? 'Online' : 'Checking'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* MediaPipe Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg">
            <Hand className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-300">MediaPipe:</span>
            <span className={`flex items-center gap-1 font-medium ${
              mediaPipeReady ? 'text-cyan-400' : 'text-amber-400'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                mediaPipeReady ? 'bg-cyan-400' : 'bg-amber-400 animate-ping'
              }`} />
              {mediaPipeReady ? 'Landmarker Ready' : 'Loading Model'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Speech API Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg">
            <Mic className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-300">Speech:</span>
            <span className={`flex items-center gap-1 font-medium ${
              isListening ? 'text-rose-400 font-semibold' : 'text-slate-400'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-500'
              }`} />
              {isListening ? 'Listening Live' : 'Standby'}
            </span>
          </div>
        </div>

        {/* View Mode Switcher & Accounts Modal Button */}
        <div className="flex items-center gap-2">
          {/* Split Mode Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'split' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('deaf')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'deaf' 
                  ? 'bg-cyan-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Deaf View
            </button>
            <button
              onClick={() => setViewMode('hearing')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'hearing' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hearing View
            </button>
          </div>

          {/* Accounts & System Modal Trigger */}
          <button
            onClick={onOpenStatusModal}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors relative"
            title="Account Connections (GitHub, Render, Supabase)"
          >
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400" />
          </button>
        </div>

      </div>
    </header>
  );
}
