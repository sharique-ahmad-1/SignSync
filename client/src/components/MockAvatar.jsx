import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Clock, 
  Box, 
  Video, 
  Info,
  Maximize2
} from 'lucide-react';
import { 
  AVATAR_VOCABULARY, 
  parseTextToSignGlosses, 
  preloadAvatarAssets 
} from '../lib/avatarAssets';
import { MagneticButton, ShinyButton } from './ui/react-bits-micro';
import { cn } from '../lib/utils';

export function MockAvatar({ 
  transcribedText, 
  repeatTrigger, 
  onSignRecognized 
}) {
  const [renderMode, setRenderMode] = useState('3d'); // '3d' | 'video'
  const [activeSequence, setActiveSequence] = useState([
    { keyword: 'hello', ...AVATAR_VOCABULARY.hello }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(2400); // 2.4s per sign
  const [showDictionary, setShowDictionary] = useState(false);

  // 3D Canvas References
  const mountRef = useRef(null);
  const threeStateRef = useRef(null);
  const timerRef = useRef(null);

  // Parse speech into ISL/ASL Gloss Sequence whenever transcribed text updates
  useEffect(() => {
    if (!transcribedText || !transcribedText.trim()) return;

    const glosses = parseTextToSignGlosses(transcribedText);
    if (glosses.length > 0) {
      setActiveSequence(glosses);
      setCurrentIndex(0);
      setIsPlaying(true);
      preloadAvatarAssets(glosses);
      if (onSignRecognized) {
        onSignRecognized(glosses.map(g => g.keyword));
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

  // Sequential progression timer
  useEffect(() => {
    if (!isPlaying || activeSequence.length === 0) return;

    const currentItem = activeSequence[currentIndex] || activeSequence[0];
    const duration = currentItem.durationMs || playbackSpeed;

    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => {
        if (prev + 1 < activeSequence.length) {
          return prev + 1;
        } else {
          return 0; // loop sequence
        }
      });
    }, duration);

    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, activeSequence, playbackSpeed]);

  const currentSign = activeSequence[currentIndex] || AVATAR_VOCABULARY.hello;

  // Initialize Three.js WebGL 3D Avatar Rig
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 260;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x6366f1, 2.5);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa855f7, 2, 10);
    rimLight.position.set(0, 3, -2);
    scene.add(rimLight);

    // Build Stylized 3D Avatar Humanoid Mesh
    const avatarGroup = new THREE.Group();

    // Torso / Body
    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.85, 16);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.3,
      metalness: 0.4
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.85;
    avatarGroup.add(torso);

    // Neck & Head
    const headGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xe0e7ff,
      roughness: 0.4
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.48;
    avatarGroup.add(head);

    // Stylized Face / Visor (Futuristic look)
    const visorGeo = new THREE.BoxGeometry(0.28, 0.08, 0.2);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
      roughness: 0.1
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.5, 0.16);
    avatarGroup.add(visor);

    // Right Arm Hierarchy (Upper arm -> Forearm -> Hand)
    const armMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.3 });
    const handMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });

    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.42, 1.2, 0);

    const rightUpperArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 12);
    const rightUpperArm = new THREE.Mesh(rightUpperArmGeo, armMat);
    rightUpperArm.position.y = -0.22;
    rightShoulder.add(rightUpperArm);

    const rightElbow = new THREE.Group();
    rightElbow.position.set(0, -0.45, 0);
    const rightForearmGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.42, 12);
    const rightForearm = new THREE.Mesh(rightForearmGeo, armMat);
    rightForearm.position.y = -0.21;
    rightElbow.add(rightForearm);

    const rightHandGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const rightHand = new THREE.Mesh(rightHandGeo, handMat);
    rightHand.position.y = -0.44;
    rightElbow.add(rightHand);
    rightShoulder.add(rightElbow);
    avatarGroup.add(rightShoulder);

    // Left Arm Hierarchy
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.42, 1.2, 0);

    const leftUpperArm = new THREE.Mesh(rightUpperArmGeo, armMat);
    leftUpperArm.position.y = -0.22;
    leftShoulder.add(leftUpperArm);

    const leftElbow = new THREE.Group();
    leftElbow.position.set(0, -0.45, 0);
    const leftForearm = new THREE.Mesh(rightForearmGeo, armMat);
    leftForearm.position.y = -0.21;
    leftElbow.add(leftForearm);

    const leftHand = new THREE.Mesh(rightHandGeo, handMat);
    leftHand.position.y = -0.44;
    leftElbow.add(leftHand);
    leftShoulder.add(leftElbow);
    avatarGroup.add(leftShoulder);

    scene.add(avatarGroup);

    threeStateRef.current = {
      scene,
      camera,
      renderer,
      avatarGroup,
      head,
      rightShoulder,
      rightElbow,
      leftShoulder,
      leftElbow,
      targetRightRot: [0, 0, 0],
      targetLeftRot: [0, 0, 0],
      targetHeadRot: [0, 0, 0]
    };

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (threeStateRef.current) {
        const { rightShoulder, leftShoulder, head, targetRightRot, targetLeftRot, targetHeadRot } = threeStateRef.current;

        // Subtle idle breathing motion
        torso.scale.y = 1 + Math.sin(time * 2) * 0.015;
        torso.scale.x = 1 + Math.sin(time * 2) * 0.015;

        // Smooth bone pose interpolation towards active sign target
        rightShoulder.rotation.x = THREE.MathUtils.lerp(rightShoulder.rotation.x, targetRightRot[0] + Math.sin(time * 3) * 0.05, 0.08);
        rightShoulder.rotation.y = THREE.MathUtils.lerp(rightShoulder.rotation.y, targetRightRot[1], 0.08);
        rightShoulder.rotation.z = THREE.MathUtils.lerp(rightShoulder.rotation.z, targetRightRot[2], 0.08);

        leftShoulder.rotation.x = THREE.MathUtils.lerp(leftShoulder.rotation.x, targetLeftRot[0], 0.08);
        leftShoulder.rotation.y = THREE.MathUtils.lerp(leftShoulder.rotation.y, targetLeftRot[1], 0.08);
        leftShoulder.rotation.z = THREE.MathUtils.lerp(leftShoulder.rotation.z, targetLeftRot[2], 0.08);

        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetHeadRot[0], 0.08);
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetHeadRot[1] + Math.sin(time) * 0.03, 0.08);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !threeStateRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      threeStateRef.current.camera.aspect = newW / newH;
      threeStateRef.current.camera.updateProjectionMatrix();
      threeStateRef.current.renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, []);

  // Update 3D Avatar Target Pose when currentSign changes
  useEffect(() => {
    if (!threeStateRef.current || !currentSign) return;

    const pose = currentSign.bonePose || {
      rightArm: [0.8, -0.2, 0.4],
      leftArm: [-0.2, 0, 0],
      head: [0.1, 0, 0]
    };

    threeStateRef.current.targetRightRot = pose.rightArm || [0, 0, 0];
    threeStateRef.current.targetLeftRot = pose.leftArm || [0, 0, 0];
    threeStateRef.current.targetHeadRot = pose.head || [0, 0, 0];
  }, [currentSign]);

  const handleManualSelect = (keyword) => {
    const item = AVATAR_VOCABULARY[keyword] || AVATAR_VOCABULARY.hello;
    setActiveSequence([{ keyword, ...item }]);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 p-4 transition-all">
      
      {/* Component Header with 3D / Video Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 font-heading">
            ISL / ASL Avatar Translation System
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
            {activeSequence.length} {activeSequence.length === 1 ? 'Gloss' : 'Glosses'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Render Mode Switcher: 3D WebGL vs Video Clip */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setRenderMode('3d')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all",
                renderMode === '3d'
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Box className="h-3 w-3" />
              <span>3D WebGL</span>
            </button>
            <button
              onClick={() => setRenderMode('video')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all",
                renderMode === 'video'
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Video className="h-3 w-3" />
              <span>Gesture Clip</span>
            </button>
          </div>

          {/* Dictionary Explorer Toggle */}
          <button
            onClick={() => setShowDictionary(!showDictionary)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs rounded-xl border transition-all",
              showDictionary
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            )}
          >
            <BookOpen className="h-3 w-3" />
            <span className="hidden sm:inline">{showDictionary ? 'Hide' : 'Library'}</span>
          </button>
        </div>
      </div>

      {/* Main Avatar Display Stage */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 mt-3">
        
        {/* Visual Stage Container (3D Canvas or HD Video) */}
        <div className="relative flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden min-h-[220px]">
          
          {/* Progress Sequence Counter */}
          {activeSequence.length > 1 && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] text-slate-300 shadow-lg">
              <span className="font-semibold text-indigo-400">Gloss {currentIndex + 1}</span>
              <span>/</span>
              <span>{activeSequence.length}</span>
            </div>
          )}

          {/* Category Tag */}
          <div className="absolute top-3 right-3 z-20 text-[10px] px-2.5 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
            {currentSign.category || 'ISL Gesture'}
          </div>

          {/* Mode 1: 3D WebGL Canvas */}
          <div 
            ref={mountRef} 
            className={cn(
              "w-full h-full min-h-[220px] transition-opacity duration-300 flex items-center justify-center",
              renderMode === '3d' ? 'opacity-100' : 'hidden'
            )}
          />

          {/* Mode 2: HD Gesture Clip */}
          {renderMode === 'video' && (
            <div className="relative w-48 h-48 flex items-center justify-center p-2">
              <img
                src={currentSign.videoUrl || 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif'}
                alt={`ISL Sign for ${currentSign.label}`}
                className="w-full h-full object-contain rounded-xl shadow-md"
              />
            </div>
          )}

          {/* Active Gloss & Subtitle Instruction */}
          <div className="absolute bottom-2 inset-x-3 z-20 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                [{currentSign.gloss || currentSign.keyword.toUpperCase()}]
              </span>
              <span className="text-xs text-indigo-300">
                • {currentSign.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              {currentSign.description}
            </p>
          </div>

        </div>

        {/* Controls & Sequence Queue (React Bits Micro-Interactions) */}
        <div className="w-full md:w-56 flex flex-col justify-between gap-3">
          
          {/* Active Sequence Chips */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Sentence Glosses</span>
              <Sparkles className="h-3 w-3 text-indigo-400" />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {activeSequence.map((item, idx) => (
                <span
                  key={`${item.keyword}-${idx}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-all border",
                    idx === currentIndex
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-sm"
                      : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  {item.gloss || item.keyword}
                </span>
              ))}
            </div>
          </div>

          {/* React Bits Micro-Interaction Controls */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-center gap-2">
              
              {/* Prev (Magnetic) */}
              <MagneticButton
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Previous Gloss"
              >
                <ChevronLeft className="h-4 w-4" />
              </MagneticButton>

              {/* Play / Pause (Shiny Button) */}
              <ShinyButton
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-indigo-600 text-white flex-1"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </ShinyButton>

              {/* Replay / Repeat (Magnetic) */}
              <MagneticButton
                onClick={() => { setCurrentIndex(0); setIsPlaying(true); }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Repeat (Replay from start)"
              >
                <RotateCcw className="h-4 w-4" />
              </MagneticButton>

              {/* Next (Magnetic) */}
              <MagneticButton
                onClick={() => setCurrentIndex(prev => Math.min(activeSequence.length - 1, prev + 1))}
                disabled={currentIndex >= activeSequence.length - 1}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Next Gloss"
              >
                <ChevronRight className="h-4 w-4" />
              </MagneticButton>

            </div>

            {/* Playback Speed */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Speed:
              </span>
              <div className="flex gap-1">
                {[
                  { label: '0.7x', speed: 3200 },
                  { label: '1.0x', speed: 2400 },
                  { label: '1.4x', speed: 1700 }
                ].map(s => (
                  <button
                    key={s.label}
                    onClick={() => setPlaybackSpeed(s.speed)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
                      playbackSpeed === s.speed
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ISL Vocabulary Library Drawer */}
      {showDictionary && (
        <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-950/80 p-3 rounded-xl animate-fadeIn">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Select any ISL vocabulary sign to trigger 3D Avatar posture:</span>
            <span className="text-[10px] text-indigo-400 font-mono">14 Signs Available</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {Object.keys(AVATAR_VOCABULARY).map(key => {
              const item = AVATAR_VOCABULARY[key];
              const isSelected = activeSequence.some(s => s.keyword === key);
              return (
                <button
                  key={key}
                  onClick={() => handleManualSelect(key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                    isSelected
                      ? "bg-indigo-600 border-indigo-400 text-white"
                      : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <span className="font-mono text-[10px] mr-1 opacity-70">[{item.gloss}]</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
