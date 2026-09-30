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
  serverStatus, 
  mediaPipeReady, 
  isListening, 
  onOpenStatusModal 
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080B14]/85 backdrop-blur-xl px-4 lg:px-8 py-2.5 transition-colors shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
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
                Phase 2 • AI & 3D
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Two-Way Communicator: MediaPipe ↔ SmolLM2 NLP ↔ 3D ISL Avatar
            </p>
          </div>
        </div>

        {/* Live System Diagnostics Badges with Lottie & Icons */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/70 p-1 rounded-2xl border border-slate-800 text-xs shadow-inner">
          
          {/* Backend Status */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-colors cursor-pointer hover:bg-slate-800/60"
            onClick={onOpenStatusModal}
            title="Express API Status"
          >
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-300">API:</span>
            <span className={cn("flex items-center gap-1 font-medium", serverStatus.online ? 'text-emerald-400' : 'text-amber-400')}>
              <span className={cn("h-1.5 w-1.5 rounded-full", serverStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
              {serverStatus.online ? 'Online' : 'Checking'}
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

        {/* Aceternity UI: Animated Tabs for View Switcher */}
        <div className="flex items-center gap-2">
          <AnimatedTabs
            tabs={tabs}
            activeTab={viewMode}
            onChange={setViewMode}
          />

          {/* Account Modal Button */}
          <button
            onClick={onOpenStatusModal}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-md relative"
            title="Connected Accounts (GitHub, Render, Supabase)"
          >
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400" />
          </button>
        </div>

      </div>
    </header>
  );
}
