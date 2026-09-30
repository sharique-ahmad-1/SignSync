import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Volume2, 
  BookOpen, 
  Check, 
  Layers,
  Flame,
  Clock
} from 'lucide-react';

// Keyword vocabulary with curated animated GIFs and motion descriptions
const SIGN_DATABASE = {
  hello: {
    keyword: 'hello',
    label: 'Hello / Wave',
    description: 'Flat open hand at temple moves outward in a salute wave.',
    category: 'Greetings',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    gifUrl: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
    fallbackEmoji: '👋'
  },
  help: {
    keyword: 'help',
    label: 'Help',
    description: 'Thumbs-up fist placed on flat palm, both raised upward.',
    category: 'Urgent',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    gifUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    fallbackEmoji: '🆘'
  },
  thank: {
    keyword: 'thank',
    label: 'Thank You',
    description: 'Fingertips touch chin, then move downward and forward.',
    category: 'Courtesy',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    gifUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
    fallbackEmoji: '🙏'
  },
  thanks: {
    keyword: 'thanks',
    label: 'Thank You',
    description: 'Fingertips touch chin, then move outward toward person.',
    category: 'Courtesy',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    gifUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
    fallbackEmoji: '🙏'
  },
  yes: {
    keyword: 'yes',
    label: 'Yes / Nod',
    description: 'Closed fist bobbing up and down mimicking a head nod.',
    category: 'Responses',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
    gifUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    fallbackEmoji: '👍'
  },
  no: {
    keyword: 'no',
    label: 'No / Snap',
    description: 'Index and middle fingers snap down against thumb.',
    category: 'Responses',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    gifUrl: 'https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif',
    fallbackEmoji: '🙅'
  },
  water: {
    keyword: 'water',
    label: 'Water',
    description: 'Three middle fingers form "W" tapped twice against chin.',
    category: 'Essentials',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    gifUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    fallbackEmoji: '💧'
  },
  please: {
    keyword: 'please',
    label: 'Please',
    description: 'Flat open palm rubbed clockwise in circles on chest.',
    category: 'Courtesy',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    gifUrl: 'https://media.giphy.com/media/3o7TKVfu4rwysCasla/giphy.gif',
    fallbackEmoji: '🤲'
  },
  goodbye: {
    keyword: 'goodbye',
    label: 'Goodbye',
    description: 'Hand raised waving fingers opening and closing.',
    category: 'Greetings',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    gifUrl: 'https://media.giphy.com/media/m9eG1qVjvNINlACQQo/giphy.gif',
    fallbackEmoji: '🙋'
  },
  friend: {
    keyword: 'friend',
    label: 'Friend',
    description: 'Hooked index fingers link together, flip and link again.',
    category: 'Social',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    gifUrl: 'https://media.giphy.com/media/26FLdm964upqWP3lu/giphy.gif',
    fallbackEmoji: '🤝'
  },
  love: {
    keyword: 'love',
    label: 'I Love You',
    description: 'Thumb, index, and pinky finger extended (ASL ILY).',
    category: 'Emotion',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    gifUrl: 'https://media.giphy.com/media/3o6Zt8rGMqVwjYAlsA/giphy.gif',
    fallbackEmoji: '🤟'
  }
};

export function MockAvatar({ 
  transcribedText, 
  repeatTrigger, 
  onSignRecognized 
}) {
  const [activeSequence, setActiveSequence] = useState(['hello']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(2500); // 2.5s per sign
  const [showDictionary, setShowDictionary] = useState(false);
  const [imageError, setImageError] = useState({});

  const timerRef = useRef(null);

  // Parse keywords whenever transcribed text updates
  useEffect(() => {
    if (!transcribedText) return;

    const lower = transcribedText.toLowerCase();
    const words = lower.replace(/[^\w\s]/gi, '').split(/\s+/);
    
    // Find all matching keywords in order
    const matched = [];
    words.forEach(word => {
      if (SIGN_DATABASE[word] && !matched.includes(word)) {
        matched.push(word);
      }
    });

    if (matched.length > 0) {
      setActiveSequence(matched);
      setCurrentIndex(0);
      setIsPlaying(true);
      if (onSignRecognized) {
        onSignRecognized(matched);
      }
    }
  }, [transcribedText, onSignRecognized]);

  // Handle Repeat Trigger from Deaf user
  useEffect(() => {
    if (repeatTrigger) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [repeatTrigger]);

  // Sequential animation player
  useEffect(() => {
    if (!isPlaying || activeSequence.length === 0) return;

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        if (prev + 1 < activeSequence.length) {
          return prev + 1;
        } else {
          // Loop or pause at the end
          return 0;
        }
      });
    }, playbackSpeed);

    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, activeSequence, playbackSpeed]);

  const currentKeyword = activeSequence[currentIndex] || 'hello';
  const signData = SIGN_DATABASE[currentKeyword] || SIGN_DATABASE.hello;

  const handleManualSelect = (keyword) => {
    setActiveSequence([keyword]);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 p-4 transition-all">
      
      {/* Component Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 font-heading">
            Mock Avatar Sign System
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {activeSequence.length} {activeSequence.length === 1 ? 'Sign' : 'Signs Sequence'}
          </span>
        </div>

        {/* Dictionary toggle */}
        <button
          onClick={() => setShowDictionary(!showDictionary)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all ${
            showDictionary 
              ? 'bg-indigo-600 border-indigo-500 text-white' 
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <BookOpen className="h-3 w-3" />
          <span>{showDictionary ? 'Hide Signs' : 'Sign Library'}</span>
        </button>
      </div>

      {/* Main Avatar Presentation Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 mt-3">
        
        {/* Visual Avatar / GIF Display Card */}
        <div className="relative flex-1 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-3 overflow-hidden min-h-[200px]">
          
          {/* Progress sequence badge */}
          {activeSequence.length > 1 && (
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[10px] text-slate-300">
              <span className="font-semibold text-indigo-400">Sign {currentIndex + 1}</span>
              <span>of</span>
              <span>{activeSequence.length}</span>
            </div>
          )}

          {/* Category Tag */}
          <div className={`absolute top-2.5 right-2.5 z-20 text-[10px] px-2.5 py-0.5 rounded-full border ${signData.badgeColor}`}>
            {signData.category}
          </div>

          {/* GIF or SVG Graphic */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800 p-2 shadow-inner">
            {!imageError[currentKeyword] ? (
              <img
                src={signData.gifUrl}
                alt={`ASL Sign for ${signData.label}`}
                className="w-full h-full object-contain rounded-lg shadow-md"
                onError={() => {
                  setImageError(prev => ({ ...prev, [currentKeyword]: true }));
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-3">
                <span className="text-5xl mb-2">{signData.fallbackEmoji}</span>
                <span className="text-xs font-semibold text-indigo-300 uppercase">
                  {signData.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Gesture Graphic
                </span>
              </div>
            )}

            {/* Glowing ring animation on active sign */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-xl border-2 border-indigo-500/30 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* Sign Title & Instruction */}
          <div className="text-center mt-3 max-w-sm">
            <h4 className="text-base font-bold text-white tracking-wide">
              Sign: "{signData.label}"
            </h4>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {signData.description}
            </p>
          </div>

          {/* Sequential Timeline Indicator Dots */}
          {activeSequence.length > 1 && (
            <div className="flex items-center gap-1.5 mt-3">
              {activeSequence.map((kw, idx) => (
                <button
                  key={`${kw}-${idx}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex 
                      ? 'w-6 bg-indigo-500' 
                      : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  title={kw}
                />
              ))}
            </div>
          )}

        </div>

        {/* Avatar Playback & Controls Side Panel */}
        <div className="w-full md:w-56 flex flex-col justify-between gap-3">
          
          {/* Active Sequence Chips */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Sequence Queue</span>
              <Sparkles className="h-3 w-3 text-indigo-400" />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {activeSequence.map((kw, idx) => (
                <span
                  key={`${kw}-${idx}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all border ${
                    idx === currentIndex
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Playback Bar */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-center gap-2">
              
              {/* Prev */}
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                title="Previous Sign"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Play / Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              {/* Replay */}
              <button
                onClick={() => { setCurrentIndex(0); setIsPlaying(true); }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Replay from start (Repeat)"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Next */}
              <button
                onClick={() => setCurrentIndex(prev => Math.min(activeSequence.length - 1, prev + 1))}
                disabled={currentIndex >= activeSequence.length - 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                title="Next Sign"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

            {/* Speed Selector */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Speed:
              </span>
              <div className="flex gap-1">
                {[
                  { label: '0.5x', speed: 3800 },
                  { label: '1.0x', speed: 2500 },
                  { label: '1.5x', speed: 1500 }
                ].map(s => (
                  <button
                    key={s.label}
                    onClick={() => setPlaybackSpeed(s.speed)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      playbackSpeed === s.speed 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Sign Dictionary Drawer (Instant Test Chips) */}
      {showDictionary && (
        <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-950/70 p-3 rounded-xl">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Click any keyword to preview sign avatar:</span>
            <span className="text-[10px] text-slate-500">11 Signs Available</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.keys(SIGN_DATABASE).map(key => {
              const item = SIGN_DATABASE[key];
              const isSelected = activeSequence.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => handleManualSelect(key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-400 text-white' 
                      : 'bg-slate-800/90 border-slate-700/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{item.fallbackEmoji}</span>
                  <span className="capitalize">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
