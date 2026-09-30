import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  RefreshCw, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Sliders, 
  BellRing,
  Volume2,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { GlowingEffect } from './ui/glowing-effect';
import { CardContainer, CardBody, CardItem } from './ui/3d-card';
import { LottieDisplay } from './ui/lottie-display';
import { handTrackerLottie, aiProcessingLottie } from '../lib/lottieData';
import { formulateGrammarSentence, speakFormulatedSentence, subscribeModelProgress, loadSmolLMModel } from '../lib/smolLM';
import { cn } from '../lib/utils';

const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm Base
  [5, 9], [9, 13], [13, 17]
];

export function DeafView({ 
  onSendAction, 
  lastHearingTranscript, 
  isHearingSpeaking, 
  onMediaPipeStatusChange 
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Video & Model state
  const [cameraActive, setCameraActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [showCanvasOverlay, setShowCanvasOverlay] = useState(true);
  const [mirrorCamera, setMirrorCamera] = useState(true);
  const [simulationMode, setSimulationMode] = useState(false);
  
  // Hand tracking telemetry
  const [detectedGesture, setDetectedGesture] = useState('No Hand in Frame');
  const [detectedKeyword, setDetectedKeyword] = useState(null);
  const [handCount, setHandCount] = useState(0);
  const [trackingConfidence, setTrackingConfidence] = useState(0);
  const [lastActionSent, setLastActionSent] = useState(null);

  // Task 2: Offline NLP (SmolLM2) Sentence Formulation State
  const [rawSignTokens, setRawSignTokens] = useState(['Me', 'Hungry', 'Food']);
  const [formulatedSentence, setFormulatedSentence] = useState('I am hungry and would like some food.');
  const [isFormulating, setIsFormulating] = useState(false);
  const [nlpState, setNlpState] = useState({ ready: false, loading: false, progress: 0, status: 'Initializing' });

  // Subscribe to SmolLM2 progress & trigger background load
  useEffect(() => {
    const unsub = subscribeModelProgress((state) => {
      setNlpState(state);
    });
    // Trigger non-blocking async load of SmolLM2
    loadSmolLMModel().catch(() => {});
    return () => unsub();
  }, []);

  // Initialize MediaPipe Hand Landmarker
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      try {
        setModelLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (!isMounted) return;
        landmarkerRef.current = handLandmarker;
        setModelLoading(false);
        if (onMediaPipeStatusChange) onMediaPipeStatusChange(true);
      } catch (err) {
        console.warn('[MediaPipe] GPU initialization notice, trying CPU delegate:', err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
          const handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numHands: 2
          });

          if (!isMounted) return;
          landmarkerRef.current = handLandmarker;
          setModelLoading(false);
          if (onMediaPipeStatusChange) onMediaPipeStatusChange(true);
        } catch (cpuErr) {
          console.error('[MediaPipe] Failed to initialize Hand Landmarker:', cpuErr);
          if (isMounted) {
            setModelLoading(false);
            if (onMediaPipeStatusChange) onMediaPipeStatusChange(false);
          }
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [onMediaPipeStatusChange]);

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.warn('[Camera] Fallback to simulation mode:', err);
      setSimulationMode(true);
      setCameraActive(true);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setSimulationMode(false);
    setDetectedGesture('Camera Inactive');
    setHandCount(0);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Gesture classification from 21 landmarks
  const classifyGesture = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return { gesture: 'No Hand', keyword: null };

    const wrist = landmarks[0];
    const indexTip = landmarks[8];
    const indexMcp = landmarks[5];
    const middleTip = landmarks[12];
    const middleMcp = landmarks[9];
    const ringTip = landmarks[16];
    const ringMcp = landmarks[13];
    const pinkyTip = landmarks[20];
    const pinkyMcp = landmarks[17];
    const thumbTip = landmarks[4];

    const isIndexExtended = indexTip.y < indexMcp.y;
    const isMiddleExtended = middleTip.y < middleMcp.y;
    const isRingExtended = ringTip.y < ringMcp.y;
    const isPinkyExtended = pinkyTip.y < pinkyMcp.y;
    const isThumbUp = thumbTip.y < wrist.y && thumbTip.y < indexMcp.y;

    if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      return { gesture: 'Open Palm / Waving 👋', keyword: 'Hello' };
    }
    if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return { gesture: 'Victory / Two ✌️', keyword: 'Peace' };
    }
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return { gesture: 'Pointing ☝️', keyword: 'Me' };
    }
    if (isThumbUp && !isIndexExtended && !isMiddleExtended && !isRingExtended) {
      return { gesture: 'Thumbs Up 👍 (Affirmative)', keyword: 'Yes' };
    }
    if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return { gesture: 'Closed Fist ✊ (Nod)', keyword: 'Help' };
    }
    if (isThumbUp && isIndexExtended && isPinkyExtended && !isMiddleExtended && !isRingExtended) {
      return { gesture: 'I Love You (ASL 🤟)', keyword: 'Love' };
    }

    return { gesture: 'Active Signing ✋', keyword: null };
  };

  // Continuous prediction loop
  const predictLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. Simulation Mode
    if (simulationMode || !cameraActive) {
      if (simulationMode) {
        const time = Date.now() / 600;
        const width = canvas.width = 640;
        const height = canvas.height = 360;
        ctx.clearRect(0, 0, width, height);

        const centerX = width * 0.5 + Math.sin(time) * 40;
        const centerY = height * 0.55 + Math.cos(time * 1.5) * 20;

        const fakeLandmarks = [
          { x: centerX / width, y: centerY / height },
          { x: (centerX - 40) / width, y: (centerY - 30) / height },
          { x: (centerX - 60) / width, y: (centerY - 50) / height },
          { x: (centerX - 75) / width, y: (centerY - 75) / height },
          { x: (centerX - 90 + Math.sin(time * 3) * 10) / width, y: (centerY - 100) / height },
          { x: (centerX - 25) / width, y: (centerY - 70) / height },
          { x: (centerX - 30) / width, y: (centerY - 110) / height },
          { x: (centerX - 35) / width, y: (centerY - 140) / height },
          { x: (centerX - 40 + Math.cos(time * 2) * 8) / width, y: (centerY - 170) / height },
          { x: (centerX) / width, y: (centerY - 75) / height },
          { x: (centerX) / width, y: (centerY - 120) / height },
          { x: (centerX) / width, y: (centerY - 150) / height },
          { x: (centerX + Math.sin(time * 2) * 8) / width, y: (centerY - 185) / height },
          { x: (centerX + 25) / width, y: (centerY - 70) / height },
          { x: (centerX + 28) / width, y: (centerY - 110) / height },
          { x: (centerX + 30) / width, y: (centerY - 140) / height },
          { x: (centerX + 32) / width, y: (centerY - 165) / height },
          { x: (centerX + 50) / width, y: (centerY - 60) / height },
          { x: (centerX + 55) / width, y: (centerY - 95) / height },
          { x: (centerX + 60) / width, y: (centerY - 125) / height },
          { x: (centerX + 65 + Math.sin(time * 3) * 12) / width, y: (centerY - 150) / height }
        ];

        drawHandOnCanvas(ctx, fakeLandmarks, width, height, '#06b6d4', '#10b981');
        setDetectedGesture('Waving / Open Palm (Simulated Demo)');
        setDetectedKeyword('Hello');
        setHandCount(1);
        setTrackingConfidence(99);
      }
      animFrameIdRef.current = requestAnimationFrame(predictLoop);
      return;
    }

    // 2. Real Video Stream Tracking
    if (video && video.readyState >= 2 && landmarkerRef.current) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const startTimeMs = performance.now();
      const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

      if (results && results.landmarks && results.landmarks.length > 0) {
        setHandCount(results.landmarks.length);
        const avgConfidence = results.handedness?.[0]?.[0]?.score 
          ? Math.round(results.handedness[0][0].score * 100) 
          : 95;
        setTrackingConfidence(avgConfidence);

        const { gesture, keyword } = classifyGesture(results.landmarks[0]);
        setDetectedGesture(gesture);
        if (keyword) setDetectedKeyword(keyword);

        if (showCanvasOverlay) {
          results.landmarks.forEach((landmarks, index) => {
            const isRight = results.handednesses?.[index]?.[0]?.categoryName === 'Right';
            drawHandOnCanvas(ctx, landmarks, canvas.width, canvas.height, isRight ? '#06b6d4' : '#6366f1', isRight ? '#10b981' : '#ec4899');
          });
        }
      } else {
        setHandCount(0);
        setDetectedGesture('No Hand in Frame');
        setTrackingConfidence(0);
      }
    }

    animFrameIdRef.current = requestAnimationFrame(predictLoop);
  }, [cameraActive, simulationMode, showCanvasOverlay]);

  const drawHandOnCanvas = (ctx, landmarks, width, height, boneColor, jointColor) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = boneColor;
    ctx.shadowColor = boneColor;
    ctx.shadowBlur = 10;

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    }

    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const x = p.x * width;
      const y = p.y * height;
      const isTip = [4, 8, 12, 16, 20].includes(i);
      const radius = isTip ? 6 : 4;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? '#ffffff' : jointColor;
      ctx.shadowColor = jointColor;
      ctx.shadowBlur = isTip ? 12 : 6;
      ctx.fill();
    }
  };

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(predictLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [predictLoop]);

  // Handle action triggers (Confirm Receipt, Repeat, Clarify)
  const handleAction = (actionName) => {
    setLastActionSent({ action: actionName, time: new Date().toLocaleTimeString() });
    if (onSendAction) {
      onSendAction({
        type: 'action',
        sender: 'deaf',
        action: actionName,
        text: `[Deaf User Action]: ${actionName}`
      });
    }

    setTimeout(() => {
      setLastActionSent(null);
    }, 3000);
  };

  // Add detected gesture to raw sign tokens
  const addTokenToSequence = (token) => {
    if (!token) return;
    setRawSignTokens(prev => [...prev.slice(-4), token]);
  };

  // Run SmolLM2 / NLP grammar formulation
  const handleFormulateSentence = async () => {
    setIsFormulating(true);
    try {
      const sentence = await formulateGrammarSentence(rawSignTokens);
      setFormulatedSentence(sentence);
    } finally {
      setIsFormulating(false);
    }
  };

  // Speak the formulated sentence out loud
  const handleSpeakAloud = () => {
    speakFormulatedSentence(formulatedSentence);
    if (onSendAction) {
      onSendAction({
        type: 'formulated_speech',
        sender: 'deaf',
        text: `[Deaf User Spoke]: "${formulatedSentence}"`
      });
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-950 border-b border-slate-800 transition-all duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-heading">
            Deaf User View • Hand Sign & Vision Tracker
          </span>
          {simulationMode && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Demo Simulation Active
            </span>
          )}
        </div>

        {/* Camera & Tracking Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCanvasOverlay(!showCanvasOverlay)}
            className={cn(
              "p-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all",
              showCanvasOverlay 
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            )}
            title="Toggle Landmark Canvas Overlay"
          >
            {showCanvasOverlay ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Landmarks</span>
          </button>

          <button
            onClick={() => setMirrorCamera(!mirrorCamera)}
            className={cn(
              "p-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all",
              mirrorCamera 
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            )}
            title="Toggle Mirror Camera"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mirror</span>
          </button>

          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className={cn(
              "p-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all",
              cameraActive 
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60' 
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
            )}
          >
            {cameraActive ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{cameraActive ? 'Pause' : 'Start'} Camera</span>
          </button>
        </div>
      </div>

      {/* Hearing User Voice Alert Banner */}
      {isHearingSpeaking && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-300 animate-pulse">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-emerald-400 animate-bounce" />
            <span className="font-semibold">Hearing User Speaking:</span>
            <span className="italic text-white font-medium truncate max-w-md">
              "{lastHearingTranscript || 'Listening...'}"
            </span>
          </div>
          <span className="text-[10px] bg-emerald-500/30 px-2 py-0.5 rounded text-emerald-200">
            Audio Detected
          </span>
        </div>
      )}

      {/* Aceternity UI: Glowing Effect wrapping the video container */}
      <div className="p-3 flex-1 flex flex-col justify-center">
        <GlowingEffect
          active={isHearingSpeaking}
          glowColor="rgba(16, 185, 129, 0.8)"
          secondaryColor="rgba(6, 182, 212, 0.6)"
          className="w-full flex-1 flex items-center justify-center bg-black min-h-[260px] max-h-[380px] lg:max-h-[440px]"
        >
          {/* Lottie Model Loading Overlay */}
          {modelLoading && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 flex flex-col items-center justify-center gap-3">
              <LottieDisplay animationData={handTrackerLottie} className="w-24 h-24" />
              <p className="text-sm font-medium text-cyan-200">
                Loading Google MediaPipe Hand Landmarker...
              </p>
              <p className="text-xs text-slate-400">
                Preparing 21 3D point skeletal tracking engine
              </p>
            </div>
          )}

          {/* Camera inactive overlay */}
          {!cameraActive && !simulationMode && (
            <div className="absolute inset-0 z-20 bg-slate-900/90 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <CameraOff className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">Camera Feed Paused</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Enable webcam access to track hand gestures in real-time, or test in simulation mode.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Enable Camera
                </button>
                <button
                  onClick={() => { setSimulationMode(true); setCameraActive(true); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all"
                >
                  Run Simulation Demo
                </button>
              </div>
            </div>
          )}

          {/* Video Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={cn("w-full h-full object-contain", mirrorCamera && "scale-x-[-1]")}
          />

          {/* Canvas Overlay for Hand Landmarks */}
          <canvas
            ref={canvasRef}
            className={cn("absolute inset-0 w-full h-full object-contain pointer-events-none z-10", mirrorCamera && "scale-x-[-1]")}
          />

          {/* HUD Overlay Badges */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-lg">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Detected Sign Gesture
                </div>
                <div className="text-xs font-bold text-white tracking-wide">
                  {detectedGesture}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] text-slate-300">
              <span>Hands: <strong className="text-cyan-400">{handCount}</strong></span>
              <span>•</span>
              <span>Confidence: <strong className="text-emerald-400">{trackingConfidence}%</strong></span>
            </div>
          </div>

          {/* Action notification */}
          {lastActionSent && (
            <div className="absolute bottom-4 right-4 z-20 bg-emerald-600/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400/50 animate-bounce">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold">Sent: {lastActionSent.action}</span>
            </div>
          )}
        </GlowingEffect>
      </div>

      {/* Task 2: Offline NLP (SmolLM2) Sentence Formulation Bar */}
      <div className="mx-3 mb-2 p-2.5 bg-slate-900/90 border border-indigo-500/30 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
            <Cpu className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-200">
                SmolLM2 Offline NLP Formulation:
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {nlpState.ready ? 'Model Cached' : nlpState.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[11px] text-slate-400">Tokens:</span>
              {rawSignTokens.map((tok, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300">
                  {tok}
                </span>
              ))}
              {detectedKeyword && (
                <button
                  onClick={() => addTokenToSequence(detectedKeyword)}
                  className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium"
                >
                  + Add "{detectedKeyword}"
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Formulated Sentence & Vocalize Trigger */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <div className="text-right">
            <div className="text-xs font-semibold text-white bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              "{formulatedSentence}"
            </div>
          </div>
          
          <button
            onClick={handleFormulateSentence}
            disabled={isFormulating}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 transition-all"
            title="Re-run SmolLM2 sentence reconstruction"
          >
            {isFormulating ? <LottieDisplay animationData={aiProcessingLottie} className="w-4 h-4" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span>{isFormulating ? 'Processing...' : 'Formulate'}</span>
          </button>

          <button
            onClick={handleSpeakAloud}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all transform active:scale-95"
            title="Vocalize this formulated sentence to the Hearing User"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Speak Aloud</span>
          </button>
        </div>
      </div>

      {/* Aceternity UI: 3D Card Effect wrapping Action Buttons (Confirm Receipt, Repeat, Clarify) */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">Deaf User 3D Action Triggers:</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            
            {/* 1. Confirm Receipt (3D Card) */}
            <CardContainer containerClassName="p-0" className="p-0">
              <CardBody className="p-0">
                <CardItem translateZ={25}>
                  <button
                    onClick={() => handleAction('Confirm Receipt')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-900/40 border border-emerald-400/40 transition-all transform active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm Receipt</span>
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>

            {/* 2. Repeat (3D Card) */}
            <CardContainer containerClassName="p-0" className="p-0">
              <CardBody className="p-0">
                <CardItem translateZ={25}>
                  <button
                    onClick={() => handleAction('Repeat Request')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-indigo-900/40 border border-indigo-400/40 transition-all transform active:scale-95"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Repeat</span>
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>

            {/* 3. Clarify (3D Card) */}
            <CardContainer containerClassName="p-0" className="p-0">
              <CardBody className="p-0">
                <CardItem translateZ={25}>
                  <button
                    onClick={() => handleAction('Clarify Request')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs shadow-lg shadow-amber-900/40 border border-amber-400/40 transition-all transform active:scale-95"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Clarify</span>
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>

          </div>

          {/* Quick Sign Shortcut Badges */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[11px] text-slate-500">Quick Tokens:</span>
            <button 
              onClick={() => addTokenToSequence('Hello')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
            >
              + Hello 👋
            </button>
            <button 
              onClick={() => addTokenToSequence('Water')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
            >
              + Water 💧
            </button>
            <button 
              onClick={() => addTokenToSequence('Help')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
            >
              + Help 🆘
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
