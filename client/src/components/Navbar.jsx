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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/90 backdrop-blur-xl px-3 sm:px-6 py-2.5 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-[2px] shadow-md shadow-indigo-500/20">
            <div className="h-full w-full bg-white rounded-[14px] flex items-center justify-center">
              <Hand className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-heading tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
                SignSync
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Phase 16 • 3D Humanoid
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Real-Time Sign Language: MediaPipe ↔ SmolLM2 NLP ↔ 3D Humanoid Avatar
            </p>
          </div>
        </div>

        {/* Live System Diagnostics Badges with Lottie & Icons */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200 text-xs">
          
          {/* Backend Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl">
            <Server className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">API:</span>
            <span className={cn("flex items-center gap-1 font-semibold", serverStatus?.online ? 'text-emerald-600' : 'text-amber-600')}>
              <span className={cn("h-1.5 w-1.5 rounded-full", serverStatus?.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')} />
              {serverStatus?.online ? 'Online' : 'Checking'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* MediaPipe Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl">
            <Hand className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Vision:</span>
            <span className={cn("font-semibold", mediaPipeReady ? 'text-cyan-700' : 'text-amber-600')}>
              {mediaPipeReady ? '21 Landmarks' : 'Loading...'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* Offline SmolLM2 Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl">
            <Cpu className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-slate-600 font-medium">SmolLM2:</span>
            <span className="text-indigo-700 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Offline NLP
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* Speech Status with Lottie */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl">
            {isListening ? (
              <LottieDisplay animationData={radarListeningLottie} className="w-4 h-4" />
            ) : (
              <Mic className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span className="text-slate-600 font-medium">Mic:</span>
            <span className={cn("font-semibold", isListening ? 'text-rose-600' : 'text-slate-500')}>
              {isListening ? 'Active' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Right Section: ISL/ASL Dual Detection Switcher + View Mode Tabs */}
        <div className="flex items-center gap-2">
          
          {/* ISL vs ASL Dual Sign Language Toggle Switch */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setSignLanguageMode && setSignLanguageMode('ISL')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                signLanguageMode === 'ISL'
                  ? "bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
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
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
              title="Switch to American Sign Language (ASL)"
            >
              <span className="text-xs">🇺🇸</span>
              <span>ASL</span>
            </button>
          </div>

          {/* Animated Tabs for View Switcher */}
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
