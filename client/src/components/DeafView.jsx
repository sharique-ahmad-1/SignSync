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
  Maximize2,
  BellRing,
  AlertCircle
} from 'lucide-react';

// Hand landmark connections standard in MediaPipe
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

  // Component state
  const [cameraActive, setCameraActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [showCanvasOverlay, setShowCanvasOverlay] = useState(true);
  const [mirrorCamera, setMirrorCamera] = useState(true);
  const [simulationMode, setSimulationMode] = useState(false);
  
  // Hand tracking telemetry
  const [detectedGesture, setDetectedGesture] = useState('No Hand in Frame');
  const [handCount, setHandCount] = useState(0);
  const [trackingConfidence, setTrackingConfidence] = useState(0);
  const [lastActionSent, setLastActionSent] = useState(null);

  // Initialize MediaPipe Hand Landmarker
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      try {
        setModelLoading(true);
        setModelError(null);

        // Load WASM files from CDN
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        // Initialize HandLandmarker with float16 model
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
        console.log('[MediaPipe] Hand Landmarker initialized successfully');
      } catch (err) {
        console.warn('[MediaPipe] Failed to load GPU delegate, trying CPU fallback:', err);
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
            setModelError('MediaPipe model could not load directly. You can enable Simulation Mode to test landmarks.');
            setModelLoading(false);
            if (onMediaPipeStatusChange) onMediaPipeStatusChange(false);
          }
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
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
      console.warn('[Camera] Permission denied or camera unavailable:', err);
      // Fallback: offer simulation mode so user has full working experience
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

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Autostart camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Simple heuristic gesture classifier from 21 landmarks
  const classifyGesture = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return 'No Hand';

    // Tip points: Thumb: 4, Index: 8, Middle: 12, Ring: 16, Pinky: 20
    // MCP joints: Index: 5, Middle: 9, Ring: 13, Pinky: 17
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
    const thumbMcp = landmarks[2];

    const isIndexExtended = indexTip.y < indexMcp.y;
    const isMiddleExtended = middleTip.y < middleMcp.y;
    const isRingExtended = ringTip.y < ringMcp.y;
    const isPinkyExtended = pinkyTip.y < pinkyMcp.y;
    const isThumbUp = thumbTip.y < wrist.y && thumbTip.y < indexMcp.y;

    // Gesture classifications
    if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      return 'Open Palm / Waving 👋';
    }
    if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'Victory / Peace ✌️';
    }
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'Pointing ☝️';
    }
    if (isThumbUp && !isIndexExtended && !isMiddleExtended && !isRingExtended) {
      return 'Thumbs Up 👍 (Affirmative)';
    }
    if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'Closed Fist ✊ (Yes / Nod)';
    }
    if (isThumbUp && isIndexExtended && isPinkyExtended && !isMiddleExtended && !isRingExtended) {
      return 'I Love You (ASL 🤟)';
    }

    return 'Active Hand Signing ✋';
  };

  // Continuous prediction loop
  const predictLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. Simulation Mode Animation (if camera permission not granted or user tests simulation)
    if (simulationMode || !cameraActive) {
      if (simulationMode) {
        const time = Date.now() / 600;
        const width = canvas.width = 640;
        const height = canvas.height = 360;

        ctx.clearRect(0, 0, width, height);

        // Generate synthetic hand landmarks
        const centerX = width * 0.5 + Math.sin(time) * 40;
        const centerY = height * 0.55 + Math.cos(time * 1.5) * 20;

        const fakeLandmarks = [
          { x: centerX / width, y: centerY / height }, // wrist
          { x: (centerX - 40) / width, y: (centerY - 30) / height }, // thumb mcp
          { x: (centerX - 60) / width, y: (centerY - 50) / height },
          { x: (centerX - 75) / width, y: (centerY - 75) / height },
          { x: (centerX - 90 + Math.sin(time * 3) * 10) / width, y: (centerY - 100) / height }, // thumb tip
          { x: (centerX - 25) / width, y: (centerY - 70) / height }, // index mcp
          { x: (centerX - 30) / width, y: (centerY - 110) / height },
          { x: (centerX - 35) / width, y: (centerY - 140) / height },
          { x: (centerX - 40 + Math.cos(time * 2) * 8) / width, y: (centerY - 170) / height }, // index tip
          { x: (centerX) / width, y: (centerY - 75) / height }, // middle mcp
          { x: (centerX) / width, y: (centerY - 120) / height },
          { x: (centerX) / width, y: (centerY - 150) / height },
          { x: (centerX + Math.sin(time * 2) * 8) / width, y: (centerY - 185) / height }, // middle tip
          { x: (centerX + 25) / width, y: (centerY - 70) / height }, // ring mcp
          { x: (centerX + 28) / width, y: (centerY - 110) / height },
          { x: (centerX + 30) / width, y: (centerY - 140) / height },
          { x: (centerX + 32) / width, y: (centerY - 165) / height }, // ring tip
          { x: (centerX + 50) / width, y: (centerY - 60) / height }, // pinky mcp
          { x: (centerX + 55) / width, y: (centerY - 95) / height },
          { x: (centerX + 60) / width, y: (centerY - 125) / height },
          { x: (centerX + 65 + Math.sin(time * 3) * 12) / width, y: (centerY - 150) / height } // pinky tip
        ];

        drawHandOnCanvas(ctx, fakeLandmarks, width, height, '#06b6d4', '#10b981');
        setDetectedGesture('Waving / Open Palm (Simulated Demo)');
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

        // Classify gesture on primary hand
        const gesture = classifyGesture(results.landmarks[0]);
        setDetectedGesture(gesture);

        if (showCanvasOverlay) {
          results.landmarks.forEach((landmarks, index) => {
            const isRight = results.handednesses?.[index]?.[0]?.categoryName === 'Right';
            const boneColor = isRight ? '#06b6d4' : '#6366f1';
            const jointColor = isRight ? '#10b981' : '#ec4899';
            drawHandOnCanvas(ctx, landmarks, canvas.width, canvas.height, boneColor, jointColor);
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

  // Helper to draw connected landmarks with custom neon aesthetics
  const drawHandOnCanvas = (ctx, landmarks, width, height, boneColor, jointColor) => {
    // 1. Draw connections
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

    // 2. Draw joint points
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const x = p.x * width;
      const y = p.y * height;

      ctx.beginPath();
      // Emphasize fingertips
      const isTip = [4, 8, 12, 16, 20].includes(i);
      const radius = isTip ? 6 : 4;
      
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? '#ffffff' : jointColor;
      ctx.shadowColor = jointColor;
      ctx.shadowBlur = isTip ? 12 : 6;
      ctx.fill();

      // Fingertip pulse outline
      if (isTip) {
        ctx.strokeStyle = jointColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  };

  // Launch prediction loop
  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(predictLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [predictLoop]);

  // Handle action buttons (Confirm Receipt, Repeat, Clarify)
  const handleAction = (actionName, colorScheme) => {
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

  return (
    <div className={`relative flex flex-col h-full bg-slate-950 border-b border-slate-800 transition-all duration-300 ${
      isHearingSpeaking ? 'flash-active ring-2 ring-emerald-500/40' : ''
    }`}>
      
      {/* Header Bar for Deaf User View */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-heading">
            Deaf User View • Hand Sign & Vision Tracker
          </span>
          {simulationMode && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Demo Simulation Mode
            </span>
          )}
        </div>

        {/* Camera & Tracking Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCanvasOverlay(!showCanvasOverlay)}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 border transition-all ${
              showCanvasOverlay 
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
            title="Toggle Landmark Canvas Overlay"
          >
            {showCanvasOverlay ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Landmarks</span>
          </button>

          <button
            onClick={() => setMirrorCamera(!mirrorCamera)}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 border transition-all ${
              mirrorCamera 
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
            title="Toggle Mirror Camera"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mirror</span>
          </button>

          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 border transition-all ${
              cameraActive 
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60' 
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
            }`}
          >
            {cameraActive ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{cameraActive ? 'Pause' : 'Start'} Camera</span>
          </button>
        </div>
      </div>

      {/* Hearing User Voice Alert Banner (Accessible visual alert for Deaf user) */}
      {isHearingSpeaking && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-300 animate-pulse">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-emerald-400 animate-bounce" />
            <span className="font-semibold">Hearing User is speaking now:</span>
            <span className="italic text-white font-medium truncate max-w-md">
              "{lastHearingTranscript || 'Listening...'}"
            </span>
          </div>
          <span className="text-[10px] bg-emerald-500/30 px-2 py-0.5 rounded text-emerald-200">
            Audio Detected
          </span>
        </div>
      )}

      {/* Main Video & Canvas Feed Area */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[260px] max-h-[380px] lg:max-h-[440px]">
        
        {/* Model loading overlay */}
        {modelLoading && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
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

        {/* Video Element for Webcam Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-contain ${mirrorCamera ? 'scale-x-[-1]' : ''}`}
        />

        {/* Canvas Overlay for 21 Hand Landmarks */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none z-10 ${
            mirrorCamera ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* HUD Overlay Badges (Top-Left: Gesture & Confidence) */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
          {/* Active Gesture Tag */}
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

          {/* Telemetry info */}
          <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] text-slate-300">
            <span>Hands: <strong className="text-cyan-400">{handCount}</strong></span>
            <span>•</span>
            <span>Confidence: <strong className="text-emerald-400">{trackingConfidence}%</strong></span>
            <span>•</span>
            <span>Overlay: <strong className={showCanvasOverlay ? 'text-cyan-400' : 'text-slate-500'}>
              {showCanvasOverlay ? 'Active' : 'Off'}
            </strong></span>
          </div>
        </div>

        {/* Notification when an action button is clicked */}
        {lastActionSent && (
          <div className="absolute bottom-4 right-4 z-20 bg-emerald-600/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400/50 animate-bounce">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold">Sent: {lastActionSent.action}</span>
          </div>
        )}

      </div>

      {/* Accessible Action Buttons Area (As specifically requested by user) */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">Deaf User Quick Actions:</span>
          </div>

          {/* Core Action Buttons: Confirm Receipt, Repeat, Clarify */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* 1. Confirm Receipt */}
            <button
              onClick={() => handleAction('Confirm Receipt', 'emerald')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-md shadow-emerald-900/30 border border-emerald-400/30 transition-all transform active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm Receipt</span>
            </button>

            {/* 2. Repeat */}
            <button
              onClick={() => handleAction('Repeat Request', 'indigo')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs shadow-md shadow-indigo-900/30 border border-indigo-400/30 transition-all transform active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Repeat</span>
            </button>

            {/* 3. Clarify */}
            <button
              onClick={() => handleAction('Clarify Request', 'amber')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs shadow-md shadow-amber-900/30 border border-amber-400/30 transition-all transform active:scale-95"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Clarify</span>
            </button>

          </div>

          {/* Quick Sign Shortcut Badges */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[11px] text-slate-500">Quick Signs:</span>
            <button 
              onClick={() => handleAction('Sign: Hello 👋', 'cyan')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
            >
              Hello 👋
            </button>
            <button 
              onClick={() => handleAction('Sign: Thank You 🙏', 'cyan')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
            >
              Thank You 🙏
            </button>
            <button 
              onClick={() => handleAction('Sign: Yes 👍', 'cyan')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
            >
              Yes 👍
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
