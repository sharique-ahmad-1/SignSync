import React from 'react';
import { 
  Hand, 
  Mic, 
  Server, 
  ShieldCheck, 
  Cpu, 
  Layers,
  Sparkles
} from 'lucide-react';
import { AnimatedTabs } from './ui/animated-tabs';
import { LottieDisplay } from './ui/lottie-display';
import { aiProcessingLottie, radarListeningLottie } from '../lib/lottieData';
import { cn } from '../lib/utils';

export function Navbar({ 
  viewMode, 
  setViewMode, 
  signLanguageMode = 'ISL',
  setSignLanguageMode,
  serverStatus, 
  mediaPipeReady, 
  isListening
}) {
  const tabs = [
    {
      title: 'Split View',
      value: 'split',
      icon: <Layers className="h-3 w-3" />
    },
    {
      title: 'Deaf Focus',
      value: 'deaf',
      icon: <Hand className="h-3 w-3" />
    },
    {
      title: 'Hearing Focus',
      value: 'hearing',
      icon: <Mic className="h-3 w-3" />
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080B14]/85 backdrop-blur-xl px-3 sm:px-6 py-2.5 transition-colors shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/25">
            <div className="h-full w-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
              <Hand className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-heading tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                SignSync
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 5 • ISL & ASL
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Two-Way Communicator: MediaPipe ↔ SmolLM2 NLP ↔ 3D {signLanguageMode} Avatar
            </p>
          </div>
        </div>

        {/* Live System Diagnostics Badges with Lottie & Icons */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/70 p-1 rounded-2xl border border-slate-800 text-xs shadow-inner">
          
          {/* Backend Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl">
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-300">API:</span>
            <span className={cn("flex items-center gap-1 font-medium", serverStatus?.online ? 'text-emerald-400' : 'text-amber-400')}>
              <span className={cn("h-1.5 w-1.5 rounded-full", serverStatus?.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
              {serverStatus?.online ? 'Online' : 'Checking'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* MediaPipe Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl">
            <Hand className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-300">Vision:</span>
            <span className={cn("font-medium", mediaPipeReady ? 'text-cyan-400' : 'text-amber-400')}>
              {mediaPipeReady ? '21 Landmarks' : 'Loading...'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Offline SmolLM2 Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-slate-300">SmolLM2:</span>
            <span className="text-indigo-400 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Offline NLP
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Speech Status with Lottie */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl">
            {isListening ? (
              <LottieDisplay animationData={radarListeningLottie} className="w-4 h-4" />
            ) : (
              <Mic className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span className="text-slate-300">Mic:</span>
            <span className={cn("font-medium", isListening ? 'text-rose-400 font-bold' : 'text-slate-400')}>
              {isListening ? 'Active' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Right Section: ISL/ASL Dual Detection Switcher + View Mode Tabs */}
        <div className="flex items-center gap-2">
          
          {/* ISL vs ASL Dual Sign Language Toggle Switch (Task 2) */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs font-semibold shadow-inner">
            <button
              onClick={() => setSignLanguageMode && setSignLanguageMode('ISL')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                signLanguageMode === 'ISL'
                  ? "bg-gradient-to-r from-amber-600 to-emerald-600 text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )}
              title="Switch to Indian Sign Language (ISL)"
            >
              <span className="text-xs">🇮🇳</span>
              <span>ISL</span>
            </button>
            <button
              onClick={() => setSignLanguageMode && setSignLanguageMode('ASL')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                signLanguageMode === 'ASL'
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )}
              title="Switch to American Sign Language (ASL)"
            >
              <span className="text-xs">🇺🇸</span>
              <span>ASL</span>
            </button>
          </div>

          {/* Aceternity UI: Animated Tabs for View Switcher */}
          <AnimatedTabs
            tabs={tabs}
            activeTab={viewMode}
            onChange={setViewMode}
          />
        </div>

      </div>
    </header>
  );
}
