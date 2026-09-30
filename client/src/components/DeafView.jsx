import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertTriangle,
  Play,
  Trash2
} from 'lucide-react';
import { GlowingEffect } from './ui/glowing-effect';
import { CardContainer, CardBody, CardItem } from './ui/3d-card';
import { LottieDisplay } from './ui/lottie-display';
import { handTrackerLottie, aiProcessingLottie } from '../lib/lottieData';
import { formulateGrammarSentence, speakFormulatedSentence, subscribeModelProgress, loadSmolLMModel } from '../lib/smolLM';
import { classifyHandLandmarks, GESTURE_DICTIONARY, matchGoldenSequence } from '../lib/gestureClassifier';
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
  signLanguageMode = 'ISL',
  onSendAction, 
  lastHearingTranscript, 
  isHearingSpeaking, 
  onMediaPipeStatusChange 
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Video & Model state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
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

  // Gesture-to-Text Auto-Commit & Visual Pop Animation States (Task 1 & Task 3)
  const [justAddedToken, setJustAddedToken] = useState(null);
  const stableHoldFramesRef = useRef(0);
  const currentHoldKeywordRef = useRef(null);
  const lastCommittedKeywordRef = useRef(null);
  const lastCommitTimeRef = useRef(0);

  // Task 1 & 2: Offline NLP (SmolLM2 / Gemini) Sentence Formulation State
  const [rawSignTokens, setRawSignTokens] = useState([]);
  const [formulatedSentence, setFormulatedSentence] = useState('');
  const [isFormulating, setIsFormulating] = useState(false);
  const [autoVocalize, setAutoVocalize] = useState(true);
  const [nlpState, setNlpState] = useState({ ready: false, loading: false, progress: 0, status: 'Initializing' });

  // Subscribe to SmolLM2 progress & trigger background load
  useEffect(() => {
    const unsub = subscribeModelProgress((state) => {
      setNlpState(state);
    });
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
          minHandDetectionConfidence: 0.75,
          minHandPresenceConfidence: 0.75,
          minTrackingConfidence: 0.75
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
            numHands: 2,
            minHandDetectionConfidence: 0.75,
            minHandPresenceConfidence: 0.75,
            minTrackingConfidence: 0.75
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

  // Robust Camera Start function (Fixes Task 1: Camera Permissions)
  const startCamera = async () => {
    setIsStartingCamera(true);
    setCameraError(null);

    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user'
          },
          audio: false
        });
      } catch (hdError) {
        console.log('[Camera] HD constraints failed, falling back to basic video constraint:', hdError);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        
        await videoRef.current.play().catch(playErr => {
          console.log('[Camera] Autoplay promise handled:', playErr);
        });

        setCameraActive(true);
        setSimulationMode(false);
        setCameraError(null);
        console.log('[Camera] Webcam started and rendering successfully!');
      }
    } catch (err) {
      console.warn('[Camera] getUserMedia failed or permission denied:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setCameraError(
        isDenied 
          ? 'Camera permission denied. Please click the camera icon in your browser address bar to allow access, or run Simulation Demo.' 
          : `Camera error: ${err.message || err.name}`
      );
      setCameraActive(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Stop Camera cleanly
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
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
    console.log('[Camera] Webcam stopped.');
  };

  // Autostart camera on mount with graceful fallback
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Sliding window buffer for temporal gesture debouncing (Task 1)
  const gestureWindowRef = useRef([]);
  const [gestureStability, setGestureStability] = useState(100);
  const rawSignTokensRef = useRef([]);

  useEffect(() => {
    rawSignTokensRef.current = rawSignTokens;
  }, [rawSignTokens]);

  // Instant human sentence builder for zero-latency UI update (Task 1 & Task 3)
  const buildImmediateSentence = (tokens) => {
    if (!tokens || tokens.length === 0) return '';

    // Phase 11: Check Golden Demo Sequences FIRST (highest priority)
    const goldenMatch = matchGoldenSequence(tokens);
    if (goldenMatch) {
      console.log(`[DeafView] 🏆 Golden Demo Sequence "${goldenMatch.name}" (${goldenMatch.sequenceId}) matched!`);
      return goldenMatch.sentence;
    }

    const last = tokens[tokens.length - 1];

    if (tokens.length === 1) {
      switch (last.toLowerCase()) {
        case 'hello': return 'Hello! Nice to meet you.';
        case 'help': return 'Can you please help me?';
        case 'yes': return 'Yes, that is correct.';
        case 'no': return 'No, thank you.';
        case 'water': return 'I need some water, please.';
        case 'stop': return 'Please stop.';
        case 'love': return 'I love you!';
        case 'food': return 'Can I please have some food?';
        case 'hungry': return 'I am feeling hungry, I need food.';
        case 'doctor': return 'I need to see a doctor immediately.';
        case 'emergency': return 'This is an emergency, please assist me!';
        case 'hospital': return 'Please take me to the hospital.';
        case 'pain': return 'I am experiencing pain.';
        case 'please': return 'Please help me.';
        case 'thank': return 'Thank you very much.';
        case 'where': return 'Where is the nearest assistance?';
        case 'what': return 'What happened?';
        case 'time': return 'What time is it right now?';
        case 'more': return 'Could I have some more, please?';
        case 'sorry': return 'I am sorry, please excuse me.';
        case 'friend': return 'You are a good friend.';
        case 'family': return 'This is my family.';
        case 'call': return 'Please make a phone call for me.';
        case 'good': return 'That is very good, thank you.';
        case 'bad': return 'That is not good.';
        case 'you': return 'Can you help?';
        case 'me': return 'I am here.';
        // Phase 10: 12 New High-Impact Signs
        case 'fire': return 'There is a fire! Please help!';
        case 'police': return 'Please call the police!';
        case 'home': return 'I want to go home.';
        case 'toilet': return 'I need to use the toilet.';
        case 'drink': return 'I need something to drink.';
        case 'medicine': return 'I need my medicine.';
        case 'need': return 'I need assistance.';
        case 'danger': return 'There is danger nearby!';
        case 'sick': return 'I am feeling sick.';
        case 'eat': return 'I need to eat something.';
        case 'school': return 'I need to go to school.';
        case 'money': return 'I need some money.';
        case 'peace': return 'Peace be with you.';
        default: return last;
      }
    }

    const lower = tokens.map(t => t.toLowerCase());
    if (lower.includes('hello') && lower.includes('help')) {
      return 'Hello, can you please help me?';
    }
    if (lower.includes('help') && lower.includes('water')) {
      return 'Please help me get some water.';
    }
    if (lower.includes('hello') && lower.includes('water')) {
      return 'Hello, I need some water please.';
    }
    if (lower.includes('yes') && lower.includes('help')) {
      return 'Yes, I need help.';
    }
    if (lower.includes('emergency') || lower.includes('doctor')) {
      return 'Urgent: I need a doctor immediately!';
    }
    if (lower.includes('hungry') && lower.includes('food')) {
      return 'I am hungry, please give me some food.';
    }
    if (lower.includes('please') && lower.includes('help')) {
      return 'Please help me right now.';
    }
    if (lower.includes('thank') && lower.includes('you')) {
      return 'Thank you very much for your assistance.';
    }
    // Phase 10: New multi-token combos
    if (lower.includes('fire') && lower.includes('help')) {
      return 'There is a fire! Please help immediately!';
    }
    if (lower.includes('police') && lower.includes('call')) {
      return 'Please call the police immediately.';
    }
    if (lower.includes('sick') && lower.includes('medicine')) {
      return 'I am sick, I need my medicine please.';
    }
    if (lower.includes('home') && lower.includes('please')) {
      return 'Please take me home.';
    }
    if (lower.includes('toilet') && lower.includes('where')) {
      return 'Where is the nearest toilet?';
    }

    return tokens.join(' ');
  };

  // Trigger auto-formulation of sign tokens into natural English sentence with Gemini/SmolLM2
  const triggerAutoFormulation = useCallback(async (tokens) => {
    if (!tokens || tokens.length === 0) {
      setFormulatedSentence('');
      return;
    }
    setIsFormulating(true);
    try {
      const sentence = await formulateGrammarSentence(tokens);
      if (sentence) {
        setFormulatedSentence(sentence);
        console.log('[DeafView] AI NLP formulated sentence:', sentence);
      }
    } catch (err) {
      console.warn('[DeafView] Auto-formulation error:', err);
    } finally {
      setIsFormulating(false);
    }
  }, []);

  // Commit detected token to UI sequence and trigger pop animation (Task 1 & 3)
  const commitDetectedToken = useCallback((token) => {
    if (!token) return;
    console.log(`[DeafView] Auto-committing detected gesture: "${token}" at ${new Date().toLocaleTimeString()}`);
    
    setJustAddedToken(token);
    setTimeout(() => setJustAddedToken(null), 1200);

    const currentTokens = rawSignTokensRef.current || [];
    // Avoid rapid duplicate if same token in last position
    if (currentTokens.length > 0 && currentTokens[currentTokens.length - 1] === token && (Date.now() - lastCommitTimeRef.current < 2000)) {
      const immediate = buildImmediateSentence(currentTokens);
      setFormulatedSentence(immediate);
      return;
    }

    const updated = [...currentTokens.slice(-4), token];
    rawSignTokensRef.current = updated;
    setRawSignTokens(updated);

    // IMMEDIATELY populate the "Speak Aloud" input box with natural English (Task 1 Fix)
    const immediateSentence = buildImmediateSentence(updated);
    setFormulatedSentence(immediateSentence);

    // Auto-vocalize via Text-to-Speech (Audio) for Hearing user (Phase 8 Task 1)
    if (autoVocalize && immediateSentence) {
      speakFormulatedSentence(immediateSentence);
    }

    // Trigger AI NLP formulation in background to refine sentence
    triggerAutoFormulation(updated);

    if (onSendAction) {
      onSendAction({
        type: 'detected_token',
        sender: 'deaf',
        keyword: token,
        sentence: immediateSentence,
        tokens: updated,
        text: `[Deaf User Signed]: "${token}"`
      });
    }
  }, [triggerAutoFormulation, onSendAction]);

  // Phase 9: Real Fingerpose ML Hand Gesture Classifier Engine
  const classifyGesture = useCallback((landmarks, mode = signLanguageMode) => {
    return classifyHandLandmarks(landmarks, mode);
  }, [signLanguageMode]);

  // Continuous prediction loop
  const predictLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. Simulation Mode Loop
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
        
        // Multi-gesture cycling for demo/simulation mode (Full ISL/ASL Vocabulary Showcase)
        const simGests = [
          { kw: 'Hello', isl: 'ISL Open Palm (Hello / Namaste) 👋', asl: 'ASL 5-Hand (Hello / Wave) 👋' },
          { kw: 'Water', isl: 'ISL Tripataka (Water / Paani) 💧', asl: 'ASL W-Hand (Water) 💧' },
          { kw: 'Food', isl: 'ISL O-Hand (Food / Khana) 🍽️', asl: 'ASL Food / Eat 🍽️' },
          { kw: 'Hungry', isl: 'ISL Cupped Hand (Hungry / Bhookh) 🤤', asl: 'ASL Hungry 🤤' },
          { kw: 'Doctor', isl: 'ISL M-Hand (Doctor / Chikitsak) 🩺', asl: 'ASL Doctor 🩺' },
          { kw: 'Emergency', isl: 'ISL E-Hand (Emergency / Aapatkaal) 🚨', asl: 'ASL Emergency 🚨' },
          { kw: 'Help', isl: 'ISL Pointing (Help / Sahayata) ☝️', asl: 'ASL 1-Hand (Help) ☝️' },
          { kw: 'Thank', isl: 'ISL Chin Forward (Thank You / Dhanyavaad) 🤲', asl: 'ASL Thank You 🤲' },
          { kw: 'Please', isl: 'ISL Open Chest (Please / Kripya) 🙏', asl: 'ASL Please 🙏' },
          { kw: 'Yes', isl: 'ISL Closed Fist (Yes / Haan) ✊', asl: 'ASL S-Hand / Thumbs Up (Yes) 👍' },
          { kw: 'No', isl: 'ISL Two-Fingers Victory (No / Nahi) ✌️', asl: 'ASL Victory / Two (No) ✌️' },
          { kw: 'Stop', isl: 'ISL Flat Hand Out (Stop / Ruko) ✋', asl: 'ASL Flat Hand (Stop) ✋' },
          { kw: 'Love', isl: 'ISL ILY Hand (I Love You / Pyar) 🤟', asl: 'ASL ILY Sign 🤟' },
          { kw: 'Where', isl: 'ISL Palms Up (Where / Kahan) ❓', asl: 'ASL Where ❓' },
          // Phase 10: New High-Impact Signs
          { kw: 'Fire', isl: 'ISL Wiggling Flames (Aang) 🔥', asl: 'ASL Alternating 5 (Fire) 🔥' },
          { kw: 'Police', isl: 'ISL Badge Tap (Pulis) 👮', asl: 'ASL C-Badge (Police) 👮' },
          { kw: 'Home', isl: 'ISL Cheek Touch (Ghar) 🏠', asl: 'ASL Kiss-Jaw (Home) 🏠' },
          { kw: 'Toilet', isl: 'ISL T-Shake (Shauchalay) 🚻', asl: 'ASL T-Shake (Toilet) 🚻' },
          { kw: 'Drink', isl: 'ISL Cup Tilt (Peena) 🥤', asl: 'ASL C-Tilt Mouth (Drink) 🥤' },
          { kw: 'Medicine', isl: 'ISL Palm Pinch (Dawai) 💊', asl: 'ASL Middle Tap Palm (Medicine) 💊' },
          { kw: 'Need', isl: 'ISL Hook Pull (Zaroorat) 🫴', asl: 'ASL X-Pull Down (Need) 🫴' },
          { kw: 'Danger', isl: 'ISL Alert Clap (Khatara) ⚠️', asl: 'ASL A-Thrust (Danger) ⚠️' },
          { kw: 'Sick', isl: 'ISL Claw Forehead (Bimaar) 🤒', asl: 'ASL 5-Forehead (Sick) 🤒' },
          { kw: 'Eat', isl: 'ISL Bunched Mouth (Khao) 🍴', asl: 'ASL Flat O-Mouth (Eat) 🍴' },
          { kw: 'School', isl: 'ISL Book Shape (Vidyalaya) 🏫', asl: 'ASL Clap Horizontal (School) 🏫' },
          { kw: 'Money', isl: 'ISL Thumb Rub (Paisa) 💰', asl: 'ASL Flat-On-Palm Tap (Money) 💰' }
        ];

        const cycleIdx = Math.floor(time / 4) % simGests.length;
        const currentSim = simGests[cycleIdx];
        const simGesture = signLanguageMode === 'ISL' ? currentSim.isl : currentSim.asl;
        setDetectedGesture(simGesture);
        setDetectedKeyword(currentSim.kw);
        setHandCount(1);
        setTrackingConfidence(99);
        setGestureStability(100);

        // Auto-commit simulated demo token when gesture changes or every 4s
        const now = Date.now();
        if (currentSim.kw !== lastCommittedKeywordRef.current && (now - lastCommitTimeRef.current > 3000)) {
          lastCommittedKeywordRef.current = currentSim.kw;
          lastCommitTimeRef.current = now;
          commitDetectedToken(currentSim.kw);
        }
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

        const rawResult = classifyGesture(results.landmarks[0], signLanguageMode);

        // Push to temporal smoothing sliding window buffer (Task 1)
        const window = gestureWindowRef.current;
        window.push(rawResult);
        if (window.length > 7) {
          window.shift();
        }

        // Count frequency of detected gestures in the window
        const gestureCounts = {};
        window.forEach(item => {
          gestureCounts[item.gesture] = (gestureCounts[item.gesture] || 0) + 1;
        });

        let dominantGesture = rawResult.gesture;
        let dominantCount = 0;
        for (const [gest, count] of Object.entries(gestureCounts)) {
          if (count > dominantCount) {
            dominantCount = count;
            dominantGesture = gest;
          }
        }

        const stabilityRatio = Math.round((dominantCount / window.length) * 100);
        setGestureStability(stabilityRatio);

        // Stabilize gesture when >= 3 out of 7 frames agree (or small window startup)
        if (dominantCount >= 3 || window.length < 3) {
          setDetectedGesture(dominantGesture);
          const matched = window.find(item => item.gesture === dominantGesture && item.keyword);
          if (matched && matched.keyword) {
            setDetectedKeyword(matched.keyword);

            // Auto-append stable gesture to token sequence (Fixes Task 1)
            if (matched.keyword === currentHoldKeywordRef.current) {
              stableHoldFramesRef.current += 1;
            } else {
              currentHoldKeywordRef.current = matched.keyword;
              stableHoldFramesRef.current = 1;
            }

            const now = Date.now();
            const timeSinceLast = now - lastCommitTimeRef.current;
            const isDifferentWord = matched.keyword !== lastCommittedKeywordRef.current;

            // Commit token after holding for 3+ frames (~80-120ms) with 2s debounce
            if (stableHoldFramesRef.current >= 3 && (isDifferentWord || timeSinceLast > 2000)) {
              console.log(`[DeafView] Triggering commitDetectedToken for "${matched.keyword}" (stable ${stableHoldFramesRef.current} frames)`);
              lastCommittedKeywordRef.current = matched.keyword;
              lastCommitTimeRef.current = now;
              stableHoldFramesRef.current = 0;
              commitDetectedToken(matched.keyword);
            }
          }
        }

        if (showCanvasOverlay) {
          results.landmarks.forEach((landmarks, index) => {
            const isRight = results.handednesses?.[index]?.[0]?.categoryName === 'Right';
            drawHandOnCanvas(ctx, landmarks, canvas.width, canvas.height, isRight ? '#06b6d4' : '#6366f1', isRight ? '#10b981' : '#ec4899');
          });
        }
      } else {
        gestureWindowRef.current = [];
        currentHoldKeywordRef.current = null;
        stableHoldFramesRef.current = 0;
        setHandCount(0);
        setDetectedGesture('No Hand in Frame');
        setTrackingConfidence(0);
        setGestureStability(0);
      }
    }

    animFrameIdRef.current = requestAnimationFrame(predictLoop);
  }, [cameraActive, simulationMode, showCanvasOverlay, signLanguageMode, classifyGesture, commitDetectedToken]);

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

  // Handle action triggers (Confirm Receipt, Repeat, Clarify) - Fixes Task 1 Button Wiring
  const handleAction = (actionName) => {
    console.log(`[SignSync DeafView] Action button triggered: "${actionName}" at ${new Date().toLocaleTimeString()}`);
    
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
    }, 3500);
  };

  // Add detected gesture to raw sign tokens via commitDetectedToken (Fixes Task 1)
  const addTokenToSequence = (token) => {
    if (!token) return;
    console.log(`[SignSync DeafView] Adding explicit token: "${token}"`);
    commitDetectedToken(token);
  };

  // Clear all tokens and formulated sentence
  const handleClearTokens = () => {
    setRawSignTokens([]);
    setFormulatedSentence('');
    lastCommittedKeywordRef.current = null;
    currentHoldKeywordRef.current = null;
    stableHoldFramesRef.current = 0;
  };

  // Run SmolLM2 / NLP grammar formulation
  const handleFormulateSentence = async () => {
    setIsFormulating(true);
    console.log('[SignSync DeafView] Formulating sentence from tokens:', rawSignTokens);
    try {
      const sentence = await formulateGrammarSentence(rawSignTokens);
      setFormulatedSentence(sentence);
      console.log('[SignSync DeafView] Formulated sentence result:', sentence);
    } finally {
      setIsFormulating(false);
    }
  };

  // Speak the formulated sentence out loud (Fixes Task 1 Speak Aloud button)
  const handleSpeakAloud = () => {
    console.log('[SignSync DeafView] Speaking sentence out loud via TTS:', formulatedSentence);
    
    speakFormulatedSentence(formulatedSentence);
    
    setLastActionSent({ 
      action: `Vocalized Aloud: "${formulatedSentence}"`, 
      time: new Date().toLocaleTimeString() 
    });

    if (onSendAction) {
      onSendAction({
        type: 'formulated_speech',
        sender: 'deaf',
        text: `[Deaf User Spoke Aloud]: "${formulatedSentence}"`
      });
    }

    setTimeout(() => {
      setLastActionSent(null);
    }, 4000);
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-950 border-b border-slate-800 transition-all duration-300">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-heading">
            Deaf User View • Hand Sign & Vision Tracker
          </span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            {signLanguageMode === 'ISL' ? '🇮🇳 ISL Mode' : '🇺🇸 ASL Mode'}
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
              "p-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer",
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
              "p-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer",
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
            disabled={isStartingCamera}
            className={cn(
              "p-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer",
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

      {/* Camera Permission / Error Warning Banner */}
      {cameraError && !cameraActive && (
        <div className="bg-amber-950/40 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={startCamera}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
            >
              Retry Camera
            </button>
            <button
              onClick={() => { setSimulationMode(true); setCameraActive(true); }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
            >
              Use Simulation Demo
            </button>
          </div>
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

          {/* Camera inactive overlay with prominent Enable Camera button */}
          {!cameraActive && !simulationMode && (
            <div className="absolute inset-0 z-20 bg-slate-900/90 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <CameraOff className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">Webcam Feed Inactive</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Click 'Enable Camera' to start tracking hand gestures in real-time, or test instantly with the Simulation Demo.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  disabled={isStartingCamera}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>{isStartingCamera ? 'Connecting...' : 'Enable Camera'}</span>
                </button>
                <button
                  onClick={() => { setSimulationMode(true); setCameraActive(true); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Run Simulation Demo</span>
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
              <span>•</span>
              <span>Stability: <strong className={gestureStability >= 70 ? "text-emerald-400" : "text-amber-400"}>{gestureStability}%</strong></span>
            </div>
          </div>

          {/* Live Action Toast Banner (Verifies button responsiveness) */}
          {lastActionSent && (
            <div className="absolute bottom-4 right-4 z-20 bg-emerald-600/95 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/60 animate-bounce">
              <CheckCircle2 className="h-4 w-4 text-white" />
              <span className="text-xs font-bold">{lastActionSent.action}</span>
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
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Tokens:</span>
              <AnimatePresence>
                {rawSignTokens.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">Perform hand signs to append tokens...</span>
                ) : (
                  rawSignTokens.map((tok, idx) => (
                    <motion.span
                      key={`${tok}-${idx}`}
                      initial={{ scale: 0.3, y: -8, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className={cn(
                        "px-2.5 py-0.5 rounded-lg border text-xs font-mono font-semibold transition-all duration-300 shadow-sm",
                        justAddedToken === tok && idx === rawSignTokens.length - 1
                          ? "bg-gradient-to-r from-cyan-500 to-indigo-500 border-cyan-300 text-white ring-2 ring-cyan-400/60 shadow-cyan-500/40 scale-105"
                          : "bg-slate-800 border-slate-700 text-cyan-300"
                      )}
                    >
                      {tok}
                    </motion.span>
                  ))
                )}
              </AnimatePresence>
              {detectedKeyword && (
                <button
                  onClick={() => addTokenToSequence(detectedKeyword)}
                  className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium cursor-pointer transition-all active:scale-95"
                >
                  + Add "{detectedKeyword}"
                </button>
              )}
              {rawSignTokens.length > 0 && (
                <button
                  onClick={handleClearTokens}
                  className="p-1 rounded-md bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-[10px] transition-all cursor-pointer"
                  title="Clear tokens"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Formulated Sentence & Speak Aloud Trigger (Task 1 & Task 3 Input box) */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <input
              type="text"
              value={formulatedSentence}
              onChange={(e) => setFormulatedSentence(e.target.value)}
              placeholder="Formulated sentence appears here..."
              className="w-full text-xs font-medium text-white bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 shadow-inner placeholder:text-slate-600 transition-all"
            />
          </div>
          
          <button
            onClick={handleFormulateSentence}
            disabled={isFormulating || rawSignTokens.length === 0}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer shrink-0"
            title="Re-run SmolLM2 / Gemini sentence reconstruction"
          >
            {isFormulating ? <LottieDisplay animationData={aiProcessingLottie} className="w-4 h-4" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isFormulating ? 'Processing...' : 'Formulate'}</span>
          </button>

          {/* Auto-TTS Toggle (Phase 8 Task 1: Sign -> Text & Audio) */}
          <button
            onClick={() => setAutoVocalize(prev => !prev)}
            className={cn(
              "px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0",
              autoVocalize
                ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-900/40"
                : "bg-slate-800/80 border-slate-700 text-slate-400"
            )}
            title="Automatically vocalize detected signs out loud for hearing users"
          >
            <Volume2 className={cn("h-3.5 w-3.5", autoVocalize && "text-emerald-400 animate-pulse")} />
            <span>Auto TTS: {autoVocalize ? 'ON' : 'OFF'}</span>
          </button>

          {/* Speak Aloud Button (Wired with TTS & Visual Toast) */}
          <button
            onClick={handleSpeakAloud}
            disabled={!formulatedSentence.trim()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
            title="Vocalize this formulated sentence to the Hearing User"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Speak Aloud</span>
          </button>
        </div>
      </div>

      {/* Action Buttons with 3D Card Effect (Wired for instant click response) */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">Deaf User 3D Action Triggers:</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            
            {/* 1. Confirm Receipt */}
            <CardContainer 
              onClick={() => handleAction('Confirm Receipt')}
              containerClassName="p-0" 
              className="p-0"
            >
              <CardBody className="p-0">
                <CardItem translateZ={25} onClick={() => handleAction('Confirm Receipt')}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction('Confirm Receipt'); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-900/40 border border-emerald-400/40 transition-all transform active:scale-95 cursor-pointer pointer-events-auto"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm Receipt</span>
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>

            {/* 2. Repeat */}
            <CardContainer 
              onClick={() => handleAction('Repeat Request')}
              containerClassName="p-0" 
              className="p-0"
            >
              <CardBody className="p-0">
                <CardItem translateZ={25} onClick={() => handleAction('Repeat Request')}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction('Repeat Request'); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-indigo-900/40 border border-indigo-400/40 transition-all transform active:scale-95 cursor-pointer pointer-events-auto"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Repeat</span>
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>

            {/* 3. Clarify */}
            <CardContainer 
              onClick={() => handleAction('Clarify Request')}
              containerClassName="p-0" 
              className="p-0"
            >
              <CardBody className="p-0">
                <CardItem translateZ={25} onClick={() => handleAction('Clarify Request')}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction('Clarify Request'); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs shadow-lg shadow-amber-900/40 border border-amber-400/40 transition-all transform active:scale-95 cursor-pointer pointer-events-auto"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Clarify</span>
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>

          </div>

          {/* Quick Sign Shortcut Badges (Expanded ISL/ASL Vocabulary - Mobile Responsive) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[11px] text-slate-500">Quick Signs:</span>
            <button 
              onClick={() => addTokenToSequence('Hello')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
            >
              + Hello 👋
            </button>
            <button 
              onClick={() => addTokenToSequence('Water')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-[11px] transition-colors cursor-pointer"
            >
              + Water 💧
            </button>
            <button 
              onClick={() => addTokenToSequence('Food')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] transition-colors cursor-pointer"
            >
              + Food 🍽️
            </button>
            <button 
              onClick={() => addTokenToSequence('Hungry')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-yellow-300 text-[11px] transition-colors cursor-pointer"
            >
              + Hungry 🤤
            </button>
            <button 
              onClick={() => addTokenToSequence('Doctor')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] transition-colors cursor-pointer"
            >
              + Doctor 🩺
            </button>
            <button 
              onClick={() => addTokenToSequence('Emergency')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-[11px] transition-colors cursor-pointer font-bold"
            >
              + Emergency 🚨
            </button>
            <button 
              onClick={() => addTokenToSequence('Help')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] transition-colors cursor-pointer"
            >
              + Help 🆘
            </button>
            <button 
              onClick={() => addTokenToSequence('Thank')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] transition-colors cursor-pointer"
            >
              + Thank 🙏
            </button>
            <button 
              onClick={() => addTokenToSequence('Please')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] transition-colors cursor-pointer"
            >
              + Please 🤲
            </button>
            <button 
              onClick={() => addTokenToSequence('Yes')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] transition-colors cursor-pointer"
            >
              + Yes ✊
            </button>
            <button 
              onClick={() => addTokenToSequence('No')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] transition-colors cursor-pointer"
            >
              + No ✌️
            </button>
            <button 
              onClick={() => addTokenToSequence('Stop')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] transition-colors cursor-pointer"
            >
              + Stop ✋
            </button>
            <button 
              onClick={() => addTokenToSequence('Where')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] transition-colors cursor-pointer"
            >
              + Where ❓
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
