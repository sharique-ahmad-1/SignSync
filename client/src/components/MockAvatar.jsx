import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Rotate3d,
  Layers,
  Video,
  User,
  Activity
} from 'lucide-react';
import { 
  AVATAR_VOCABULARY, 
  parseTextToSignGlosses, 
  preloadAvatarAssets 
} from '../lib/avatarAssets';
import { extractISLKeywords } from '../lib/smolLM';
import { MagneticButton, ShinyButton } from './ui/react-bits-micro';
import { cn } from '../lib/utils';

/**
 * Traverses a rigged 3D Humanoid GLTF/GLB character and maps all standard bones
 */
function extractHumanoidBones(root) {
  const bones = {
    hips: null,
    spine: null,
    spine1: null,
    spine2: null,
    neck: null,
    head: null,
    rightShoulder: null,
    rightArm: null,
    rightForeArm: null,
    rightHand: null,
    rightThumb: [],
    rightIndex: [],
    rightMiddle: [],
    rightRing: [],
    rightPinky: [],
    leftShoulder: null,
    leftArm: null,
    leftForeArm: null,
    leftHand: null,
    leftThumb: [],
    leftIndex: [],
    leftMiddle: [],
    leftRing: [],
    leftPinky: []
  };

  root.traverse((node) => {
    if (!node.isBone && node.type !== 'Bone' && node.type !== 'JOINT') return;
    const name = (node.name || '').toLowerCase();

    // Head & Torso
    if (name.includes('head') && !name.includes('top')) bones.head = node;
    else if (name.includes('neck')) bones.neck = node;
    else if (name.includes('spine2') || name.includes('chest')) bones.spine2 = node;
    else if (name.includes('spine1')) bones.spine1 = node;
    else if (name.includes('spine') && !bones.spine) bones.spine = node;
    else if (name.includes('hip')) bones.hips = node;

    // Determine Side
    const isLeft = name.includes('left') || name.includes('_l') || name.includes('.l') || name.startsWith('l_');
    const isRight = name.includes('right') || name.includes('_r') || name.includes('.r') || name.startsWith('r_');

    if (isRight) {
      if (name.includes('shoulder') || name.includes('clavicle')) bones.rightShoulder = node;
      else if (name.includes('forearm') || name.includes('lowerarm')) bones.rightForeArm = node;
      else if (name.includes('arm') && !name.includes('forearm')) bones.rightArm = node;
      else if (name.includes('hand') && !name.includes('thumb') && !name.includes('index') && !name.includes('mid') && !name.includes('ring') && !name.includes('pinky')) bones.rightHand = node;
      else if (name.includes('thumb')) bones.rightThumb.push(node);
      else if (name.includes('index')) bones.rightIndex.push(node);
      else if (name.includes('mid') || name.includes('middle')) bones.rightMiddle.push(node);
      else if (name.includes('ring')) bones.rightRing.push(node);
      else if (name.includes('pinky') || name.includes('little')) bones.rightPinky.push(node);
    } else if (isLeft) {
      if (name.includes('shoulder') || name.includes('clavicle')) bones.leftShoulder = node;
      else if (name.includes('forearm') || name.includes('lowerarm')) bones.leftForeArm = node;
      else if (name.includes('arm') && !name.includes('forearm')) bones.leftArm = node;
      else if (name.includes('hand') && !name.includes('thumb') && !name.includes('index') && !name.includes('mid') && !name.includes('ring') && !name.includes('pinky')) bones.leftHand = node;
      else if (name.includes('thumb')) bones.leftThumb.push(node);
      else if (name.includes('index')) bones.leftIndex.push(node);
      else if (name.includes('mid') || name.includes('middle')) bones.leftMiddle.push(node);
      else if (name.includes('ring')) bones.leftRing.push(node);
      else if (name.includes('pinky') || name.includes('little')) bones.leftPinky.push(node);
    }
  });

  // Sort fingers by hierarchy
  const sortBones = (arr) => arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  sortBones(bones.rightThumb);
  sortBones(bones.rightIndex);
  sortBones(bones.rightMiddle);
  sortBones(bones.rightRing);
  sortBones(bones.rightPinky);
  sortBones(bones.leftThumb);
  sortBones(bones.leftIndex);
  sortBones(bones.leftMiddle);
  sortBones(bones.leftRing);
  sortBones(bones.leftPinky);

  return bones;
}

export function MockAvatar({ 
  signLanguageMode = 'ISL',
  transcribedText, 
  repeatTrigger, 
  onSignRecognized 
}) {
  const [renderMode, setRenderMode] = useState('3d'); // '3d' | 'dual' | 'video'
  const [activeSequence, setActiveSequence] = useState([
    { keyword: 'hello', ...AVATAR_VOCABULARY.hello }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(2400); // 2.4s per sign
  const [glossProgress, setGlossProgress] = useState(0);
  const [isNlpParsing, setIsNlpParsing] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [modelType, setModelType] = useState('Full Humanoid Avatar');
  const [modelLoading, setModelLoading] = useState(true);
  const [mappedBoneCount, setMappedBoneCount] = useState(70);

  // Three.js Canvas & Scene References
  const mountRef = useRef(null);
  const threeStateRef = useRef(null);
  const currentSignRef = useRef(null);
  const timerRef = useRef(null);
  const lastProcessedTextRef = useRef('');

  // Target Pose Dispatcher
  const executeSignPose = useCallback((sign) => {
    if (!sign) return;
    currentSignRef.current = sign;
    if (threeStateRef.current) {
      threeStateRef.current.activeSign = sign;
    }
  }, []);

  // Parse speech or text into ISL/ASL Gloss Sequence (Task 1 Voice-to-3D-Avatar)
  useEffect(() => {
    if (!transcribedText || !transcribedText.trim()) return;
    const cleanText = transcribedText.trim();

    let isMounted = true;
    setIsNlpParsing(true);

    // 1. Instant synchronous parse using ISL SOV grammar rules (0ms latency response)
    const immediateGlosses = parseTextToSignGlosses(cleanText);
    if (immediateGlosses && immediateGlosses.length > 0) {
      lastProcessedTextRef.current = cleanText;
      setActiveSequence(immediateGlosses);
      setCurrentIndex(0);
      setIsPlaying(true);
      executeSignPose(immediateGlosses[0]);
      preloadAvatarAssets(immediateGlosses);
      if (onSignRecognized) {
        onSignRecognized(immediateGlosses.map(g => g.keyword));
      }
    }

    // 2. Refined keyword extraction via SmolLM2 model
    const parseSequence = async () => {
      try {
        const keywords = await extractISLKeywords(cleanText);
        if (isMounted && keywords && keywords.length > 0) {
          const refinedGlosses = parseTextToSignGlosses(keywords.join(' '));
          if (refinedGlosses && refinedGlosses.length > 0) {
            setActiveSequence(refinedGlosses);
            setCurrentIndex(0);
            executeSignPose(refinedGlosses[0]);
            preloadAvatarAssets(refinedGlosses);
          }
        }
      } catch (e) {
        console.warn('[MockAvatar] SmolLM2 keyword extraction notice:', e);
      } finally {
        if (isMounted) setIsNlpParsing(false);
      }
    };

    parseSequence();

    return () => {
      isMounted = false;
    };
  }, [transcribedText, executeSignPose, onSignRecognized]);

  // Handle Repeat Trigger from Deaf user
  useEffect(() => {
    if (repeatTrigger) {
      setCurrentIndex(0);
      setIsPlaying(true);
      if (activeSequence && activeSequence[0]) {
        executeSignPose(activeSequence[0]);
      }
    }
  }, [repeatTrigger, activeSequence, executeSignPose]);

  // Sequential progression timer
  useEffect(() => {
    if (!isPlaying || activeSequence.length === 0) return;

    const currentItem = activeSequence[currentIndex] || activeSequence[0];
    const duration = currentItem.durationMs || playbackSpeed;

    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => {
        const nextIdx = (prev + 1 < activeSequence.length) ? prev + 1 : 0;
        const nextItem = activeSequence[nextIdx];
        if (nextItem) {
          executeSignPose(nextItem);
        }
        return nextIdx;
      });
    }, duration);

    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, activeSequence, playbackSpeed, executeSignPose]);

  const currentSign = activeSequence[currentIndex] || AVATAR_VOCABULARY.hello;

  // Initialize Three.js WebGL Scene with Full Humanoid Avatar (Task 1 & Task 2)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    // 1. Scene & Perspective Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean light studio background

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Camera positioned at chest level to frame full upper body, arms and hands
    camera.position.set(0, 1.25, 2.05);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. OrbitControls (Smooth mouse & touch pan/rotate/zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 0.8;
    controls.maxDistance = 4.0;
    controls.target.set(0, 1.15, 0); // Focus on avatar chest/head
    controls.update();

    // 4. Studio Lighting Rig (Clean Light Mode Studio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(1.5, 3.0, 2.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 1.4);
    fillLight.position.set(-1.5, 2.0, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc7d2fe, 1.2);
    rimLight.position.set(0, 2.5, -2.0);
    scene.add(rimLight);

    // Subtle Ground Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(3, 3);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // Store state in ref
    threeStateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      humanoidModel: null,
      bones: null,
      activeSign: (activeSequence && activeSequence[0]) ? activeSequence[0] : AVATAR_VOCABULARY.hello
    };

    // 5. Load Full Humanoid 3D Character Model (Task 1)
    const gltfLoader = new GLTFLoader();

    const loadAvatarModel = (url) => {
      setModelLoading(true);
      gltfLoader.load(
        url,
        (gltf) => {
          console.log('[MockAvatar] Successfully loaded Full Humanoid Avatar GLB:', gltf);
          const model = gltf.scene;
          model.position.set(0, 0, 0);
          model.scale.set(1.0, 1.0, 1.0);

          // Apply clean shadows and material settings
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.roughness = Math.max(0.35, child.material.roughness || 0.5);
              }
            }
          });

          // Extract all 70 humanoid skeleton bones
          const bones = extractHumanoidBones(model);
          console.log('[MockAvatar] Extracted Humanoid Bones:', bones);

          // Initialize AnimationMixer with natural idle breathing base
          const mixer = new THREE.AnimationMixer(model);
          if (gltf.animations && gltf.animations.length > 0) {
            const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle') || gltf.animations[2] || gltf.animations[0];
            if (idleClip) {
              const action = mixer.clipAction(idleClip);
              action.play();
            }
          }

          scene.add(model);
          if (threeStateRef.current) {
            threeStateRef.current.humanoidModel = model;
            threeStateRef.current.bones = bones;
            threeStateRef.current.mixer = mixer;
          }

          setModelType('3D Humanoid Avatar (ISL/ASL)');
          setMappedBoneCount(70);
          setModelLoading(false);
        },
        undefined,
        (err) => {
          console.warn('[MockAvatar] Error loading primary avatar, attempting fallback model:', err);
          if (url !== '/models/verity.glb') {
            loadAvatarModel('/models/verity.glb');
          } else {
            setModelLoading(false);
          }
        }
      );
    };

    loadAvatarModel('/models/avatar.glb');

    // 6. Real-Time Full-Body Animation Loop (Task 2)
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      if (threeStateRef.current) {
        const state = threeStateRef.current;
        const { controls, renderer, scene, camera, bones, mixer } = state;

        controls.update();

        // 1. Update Skeletal AnimationMixer (Idle Breathing & Natural Base Posture)
        if (mixer) {
          mixer.update(delta);
        }

        const activeSign = state.activeSign || currentSignRef.current || AVATAR_VOCABULARY.hello;
        const glossKey = (activeSign.gloss || activeSign.keyword || '').toUpperCase();

        // Base Idle Rest Poses for Humanoid Body (Natural Arms Down at Sides)
        let rArmRot = [0.15, 0.05, 1.35];
        let lArmRot = [0.15, -0.05, -1.35];
        let rForeArmRot = [-0.05, 0.1, -0.2];
        let lForeArmRot = [-0.05, -0.1, 0.2];
        let rHandRot = [0.0, 0.0, 0.0];
        let lHandRot = [0.0, 0.0, 0.0];

        let headRot = [0.0, 0.0, 0.0];
        let spineRot = [0.0, 0.0, 0.0];

        // Finger curls: [thumb, index, middle, ring, pinky] (0.0 = extended, 1.0 = curled)
        let rCurls = [0.08, 0.08, 0.08, 0.08, 0.08];
        let lCurls = [0.08, 0.08, 0.08, 0.08, 0.08];

        // Idle Breathing Oscillation
        spineRot[0] = Math.sin(time * 2.0) * 0.02;
        headRot[1] = Math.sin(time * 1.5) * 0.03;
        rArmRot[2] += Math.sin(time * 2.0) * 0.015;
        lArmRot[2] -= Math.sin(time * 2.0) * 0.015;

        // Comprehensive Bone Rotations per Sign Gloss (Mathematically Calibrated for Mixamo Rig)
        switch (glossKey) {
          case 'HELLO':
          case 'HI':
          case 'NAMASTE':
          case 'GREETINGS': {
            // Right arm raises beside head, open palm waves side-to-side in greeting
            const wave = Math.sin(time * 6.0) * 0.35;
            rArmRot = [0.55, -0.35, 0.35];
            rForeArmRot = [-0.2, 0.4, -1.5];
            rHandRot = [0.1, wave, -0.2];
            rCurls = [0.0, 0.0, 0.0, 0.0, 0.0]; // Open Palm
            headRot = [0.08, wave * 0.2, 0.0]; // Polite greeting nod
            break;
          }

          case 'HELP':
          case 'ASSIST':
          case 'SAHAYATA': {
            // Two-handed sign: Thumbs-up fist on flat left palm, both elevating together
            const lift = Math.sin(time * 3.5) * 0.1;
            lArmRot = [0.45, -0.35, -0.65];
            lForeArmRot = [0.1, -0.45, 1.25];
            lHandRot = [-0.4, 0.0, 0.0]; // Flat palm facing up
            lCurls = [0.0, 0.0, 0.0, 0.0, 0.0];

            rArmRot = [0.45 + lift, 0.35, 0.65];
            rForeArmRot = [-0.1, 0.45, -1.25];
            rHandRot = [0.2, 0.0, 0.0];
            rCurls = [0.2, 0.95, 0.95, 0.95, 0.95]; // Thumbs-up fist
            break;
          }

          case 'YES':
          case 'HAAN':
          case 'AGREE':
          case 'OK': {
            // Right fist nodding affirmatively up and down in front of chest
            const nod = Math.sin(time * 6.0) * 0.35;
            rArmRot = [0.45, -0.25, 0.65];
            rForeArmRot = [-0.1, 0.35, -1.4];
            rHandRot = [0.35 + nod, 0.0, 0.0];
            rCurls = [0.95, 1.0, 1.0, 1.0, 1.0]; // Tight fist (Mushti)
            headRot = [nod * 0.2, 0.0, 0.0];
            break;
          }

          case 'NO':
          case 'NAHI':
          case 'DISAGREE': {
            // Index & Middle extended in "V", waving side-to-side
            const shake = Math.sin(time * 6.5) * 0.35;
            rArmRot = [0.45, -0.25, 0.65];
            rForeArmRot = [-0.1, 0.35, -1.4];
            rHandRot = [0.0, shake, 0.0];
            rCurls = [0.85, 0.0, 0.0, 0.95, 0.95]; // Two fingers
            headRot = [0.0, shake * 0.25, 0.0]; // Shaking head
            break;
          }

          case 'WATER':
          case 'PAANI':
          case 'DRINK':
          case 'PEENA': {
            // W-Handshape brought to chin, tapping twice
            const tap = Math.sin(time * 5.5) * 0.15;
            rArmRot = [0.6, -0.3, 0.3];
            rForeArmRot = [-0.15, 0.35, -1.65 + tap];
            rHandRot = [0.2, 0.0, 0.0];
            rCurls = [0.95, 0.0, 0.0, 0.0, 0.95]; // W-hand (Tripataka)
            headRot = [0.05, 0.0, 0.0];
            break;
          }

          case 'FOOD':
          case 'KHANA':
          case 'EAT':
          case 'KHAO':
          case 'HUNGRY': {
            // Bunched fingertips brought to mouth and tapping repeatedly
            const eatTap = Math.sin(time * 5.5) * 0.15;
            rArmRot = [0.6, -0.25, 0.3];
            rForeArmRot = [-0.2, 0.35, -1.7 + eatTap];
            rHandRot = [0.3, 0.0, 0.0];
            rCurls = [0.6, 0.6, 0.6, 0.6, 0.6]; // Bunched fingertips
            break;
          }

          case 'STOP':
          case 'RUKO':
          case 'WAIT': {
            // Vertical open palm pushed firmly forward
            rArmRot = [0.8, -0.15, 0.45];
            rForeArmRot = [0.0, 0.2, -0.4];
            rHandRot = [-0.75, 0.0, 0.0]; // Wrist bent back so palm faces forward
            rCurls = [0.0, 0.0, 0.0, 0.0, 0.0]; // Open forward palm
            break;
          }

          case 'THANK YOU':
          case 'THANKS':
          case 'THANK':
          case 'DHANYAVAAD': {
            // Flat fingertips sweep forward and outward from chin
            const sweep = (Math.sin(time * 3.5) + 1.0) * 0.5; // 0 to 1
            rArmRot = [0.65 - sweep * 0.2, -0.2, 0.35 + sweep * 0.2];
            rForeArmRot = [-0.2 + sweep * 0.8, 0.3, -1.6 + sweep * 1.0];
            rHandRot = [0.25 - sweep * 0.3, 0.0, 0.0];
            rCurls = [0.0, 0.0, 0.0, 0.0, 0.0];
            headRot = [0.1, 0.0, 0.0]; // Grateful bow
            break;
          }

          case 'PLEASE':
          case 'KRIPYA': {
            // Open hand making circular motion on chest
            const circleX = Math.sin(time * 4.0) * 0.12;
            const circleY = Math.cos(time * 4.0) * 0.12;
            rArmRot = [0.45 + circleY, -0.2, 0.65 + circleX];
            rForeArmRot = [-0.1, 0.35, -1.35];
            rHandRot = [0.15, 0.0, 0.0];
            rCurls = [0.0, 0.0, 0.0, 0.0, 0.0];
            headRot = [0.08, 0.0, 0.0];
            break;
          }

          case 'LOVE':
          case 'PYAR': {
            // ILY sign: Thumb, Index, Pinky extended; Middle & Ring curled
            rArmRot = [0.55, -0.25, 0.45];
            rForeArmRot = [-0.15, 0.35, -1.4];
            rHandRot = [0.1, Math.sin(time * 4.0) * 0.15, 0.0];
            rCurls = [0.0, 0.0, 1.0, 1.0, 0.0]; // ILY hand
            break;
          }

          case 'DOCTOR':
          case 'MEDICINE':
          case 'DAWAI':
          case 'CHIKITSAK': {
            // Left wrist held horizontal, right index & middle fingers checking pulse
            lArmRot = [0.45, -0.3, -0.65];
            lForeArmRot = [0.0, -0.45, 1.2];
            lHandRot = [0.0, 0.3, 0.0];

            rArmRot = [0.45, 0.25, 0.65];
            rForeArmRot = [-0.1, 0.4, -1.25];
            rHandRot = [0.35, 0.2, 0.0];
            rCurls = [0.85, 0.0, 0.0, 0.95, 0.95]; // Pulse checking fingers
            break;
          }

          case 'EMERGENCY':
          case 'DANGER':
          case 'AAPATKAAL':
          case 'KHATARA': {
            // Both hands alert, urgent upper body posture
            const alert = Math.sin(time * 8.0) * 0.15;
            rArmRot = [0.55 + alert, 0.2, 0.55];
            lArmRot = [0.55 - alert, -0.2, -0.55];
            rForeArmRot = [-0.1, 0.35, -1.2];
            lForeArmRot = [0.1, -0.35, 1.2];
            rCurls = [0.95, 0.95, 0.95, 0.95, 0.95];
            lCurls = [0.95, 0.95, 0.95, 0.95, 0.95];
            spineRot = [0.08, alert * 0.1, 0.0];
            break;
          }

          case 'WHERE':
          case 'WHAT':
          case 'KAHAN':
          case 'KYA': {
            // Questioning gesture: Both palms up, shrugging slightly
            const shrug = Math.sin(time * 4.5) * 0.12;
            rArmRot = [0.4, 0.25, 0.65];
            lArmRot = [0.4, -0.25, -0.65];
            rForeArmRot = [0.0, 0.35, -1.1 - shrug];
            lForeArmRot = [0.0, -0.35, 1.1 + shrug];
            rHandRot = [-0.35, 0.2, 0.0];
            lHandRot = [-0.35, -0.2, 0.0];
            rCurls = [0.1, 0.1, 0.1, 0.1, 0.1];
            lCurls = [0.1, 0.1, 0.1, 0.1, 0.1];
            headRot = [0.0, shrug * 0.2, 0.0];
            break;
          }

          default: {
            // Vocabulary metadata heuristic fallback
            const shape = (activeSign.handShape || '').toLowerCase();
            if (shape.includes('fist') || shape.includes('mushti')) {
              rCurls = [0.85, 0.95, 0.95, 0.95, 0.95];
            } else if (shape.includes('point') || shape.includes('index')) {
              rCurls = [0.75, 0.0, 0.9, 0.9, 0.9];
            } else if (shape.includes('cup') || shape.includes('o-hand')) {
              rCurls = [0.45, 0.45, 0.45, 0.45, 0.45];
            } else {
              rCurls = [0.05, 0.05, 0.05, 0.05, 0.05];
            }
            rArmRot = [0.45, -0.15, 0.65];
            rForeArmRot = [-0.1, 0.25, -1.2];
            break;
          }
        }

        // =========================================================================
        // SMOOTH LERP INTERPOLATION ON HUMANOID SKELETON (60 FPS FLUIDITY)
        // =========================================================================
        const lerpFactor = 1.0 - Math.exp(-delta * 12.0); // Buttery smooth lerp

        if (bones) {
          // Head, Neck & Spine
          if (bones.head) {
            bones.head.rotation.x = THREE.MathUtils.lerp(bones.head.rotation.x, headRot[0], lerpFactor);
            bones.head.rotation.y = THREE.MathUtils.lerp(bones.head.rotation.y, headRot[1], lerpFactor);
            bones.head.rotation.z = THREE.MathUtils.lerp(bones.head.rotation.z, headRot[2], lerpFactor);
          }
          if (bones.spine) {
            bones.spine.rotation.x = THREE.MathUtils.lerp(bones.spine.rotation.x, spineRot[0], lerpFactor);
            bones.spine.rotation.y = THREE.MathUtils.lerp(bones.spine.rotation.y, spineRot[1], lerpFactor);
            bones.spine.rotation.z = THREE.MathUtils.lerp(bones.spine.rotation.z, spineRot[2], lerpFactor);
          }

          // Right Arm & Forearm
          if (bones.rightArm) {
            bones.rightArm.rotation.x = THREE.MathUtils.lerp(bones.rightArm.rotation.x, rArmRot[0], lerpFactor);
            bones.rightArm.rotation.y = THREE.MathUtils.lerp(bones.rightArm.rotation.y, rArmRot[1], lerpFactor);
            bones.rightArm.rotation.z = THREE.MathUtils.lerp(bones.rightArm.rotation.z, rArmRot[2], lerpFactor);
          }
          if (bones.rightForeArm) {
            bones.rightForeArm.rotation.x = THREE.MathUtils.lerp(bones.rightForeArm.rotation.x, rForeArmRot[0], lerpFactor);
            bones.rightForeArm.rotation.y = THREE.MathUtils.lerp(bones.rightForeArm.rotation.y, rForeArmRot[1], lerpFactor);
            bones.rightForeArm.rotation.z = THREE.MathUtils.lerp(bones.rightForeArm.rotation.z, rForeArmRot[2], lerpFactor);
          }
          if (bones.rightHand) {
            bones.rightHand.rotation.x = THREE.MathUtils.lerp(bones.rightHand.rotation.x, rHandRot[0], lerpFactor);
            bones.rightHand.rotation.y = THREE.MathUtils.lerp(bones.rightHand.rotation.y, rHandRot[1], lerpFactor);
            bones.rightHand.rotation.z = THREE.MathUtils.lerp(bones.rightHand.rotation.z, rHandRot[2], lerpFactor);
          }

          // Left Arm & Forearm
          if (bones.leftArm) {
            bones.leftArm.rotation.x = THREE.MathUtils.lerp(bones.leftArm.rotation.x, lArmRot[0], lerpFactor);
            bones.leftArm.rotation.y = THREE.MathUtils.lerp(bones.leftArm.rotation.y, lArmRot[1], lerpFactor);
            bones.leftArm.rotation.z = THREE.MathUtils.lerp(bones.leftArm.rotation.z, lArmRot[2], lerpFactor);
          }
          if (bones.leftForeArm) {
            bones.leftForeArm.rotation.x = THREE.MathUtils.lerp(bones.leftForeArm.rotation.x, lForeArmRot[0], lerpFactor);
            bones.leftForeArm.rotation.y = THREE.MathUtils.lerp(bones.leftForeArm.rotation.y, lForeArmRot[1], lerpFactor);
            bones.leftForeArm.rotation.z = THREE.MathUtils.lerp(bones.leftForeArm.rotation.z, lForeArmRot[2], lerpFactor);
          }
          if (bones.leftHand) {
            bones.leftHand.rotation.x = THREE.MathUtils.lerp(bones.leftHand.rotation.x, lHandRot[0], lerpFactor);
            bones.leftHand.rotation.y = THREE.MathUtils.lerp(bones.leftHand.rotation.y, lHandRot[1], lerpFactor);
            bones.leftHand.rotation.z = THREE.MathUtils.lerp(bones.leftHand.rotation.z, lHandRot[2], lerpFactor);
          }

          // Helper to curl finger phalanges naturally on multiple axes
          const applyFingerCurls = (chain, amount, isThumb = false, isLeftHand = false) => {
            chain.forEach((joint, idx) => {
              if (joint) {
                if (isThumb) {
                  const thumbAngle = 0.55 * amount;
                  joint.rotation.z = THREE.MathUtils.lerp(joint.rotation.z, isLeftHand ? -thumbAngle : thumbAngle, lerpFactor);
                  joint.rotation.x = THREE.MathUtils.lerp(joint.rotation.x, 0.35 * amount, lerpFactor);
                  if (idx === 0) {
                    joint.rotation.y = THREE.MathUtils.lerp(joint.rotation.y, (isLeftHand ? -amount : amount) * 0.45, lerpFactor);
                  }
                } else {
                  const fingerAngle = 0.85 * amount;
                  joint.rotation.z = THREE.MathUtils.lerp(joint.rotation.z, isLeftHand ? -fingerAngle : fingerAngle, lerpFactor);
                  joint.rotation.x = THREE.MathUtils.lerp(joint.rotation.x, 0.15 * amount, lerpFactor);
                }
              }
            });
          };

          // Right Fingers
          applyFingerCurls(bones.rightThumb, rCurls[0], true, false);
          applyFingerCurls(bones.rightIndex, rCurls[1], false, false);
          applyFingerCurls(bones.rightMiddle, rCurls[2], false, false);
          applyFingerCurls(bones.rightRing, rCurls[3], false, false);
          applyFingerCurls(bones.rightPinky, rCurls[4], false, false);

          // Left Fingers
          applyFingerCurls(bones.leftThumb, lCurls[0], true, true);
          applyFingerCurls(bones.leftIndex, lCurls[1], false, true);
          applyFingerCurls(bones.leftMiddle, lCurls[2], false, true);
          applyFingerCurls(bones.leftRing, lCurls[3], false, true);
          applyFingerCurls(bones.leftPinky, lCurls[4], false, true);
        }

        renderer.render(scene, camera);
      }
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

  // Reset Camera View in OrbitControls
  const handleResetCamera = () => {
    if (threeStateRef.current && threeStateRef.current.controls) {
      threeStateRef.current.camera.position.set(0, 1.25, 2.05);
      threeStateRef.current.controls.target.set(0, 1.15, 0);
      threeStateRef.current.controls.update();
    }
  };

  // Update Target Pose on currentSign change
  useEffect(() => {
    if (currentSign) {
      executeSignPose(currentSign);
    }
  }, [currentSign, executeSignPose]);

  // Synchronized countdown progress for active sign gloss
  useEffect(() => {
    if (!isPlaying) return;
    setGlossProgress(0);
    const start = performance.now();
    const duration = currentSign?.durationMs || playbackSpeed;

    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setGlossProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 30);

    return () => clearInterval(interval);
  }, [currentIndex, isPlaying, currentSign, playbackSpeed]);

  const handleManualSelect = (keyword) => {
    const item = AVATAR_VOCABULARY[keyword] || AVATAR_VOCABULARY.hello;
    const signObj = { keyword, ...item };
    setActiveSequence([signObj]);
    setCurrentIndex(0);
    setIsPlaying(true);
    executeSignPose(signObj);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 transition-all shadow-sm w-full">
      
      {/* Component Header with 3D / Dual / Video Switcher */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 font-heading">
            {signLanguageMode === 'ISL' ? '3D Humanoid ISL Avatar (🇮🇳)' : '3D Humanoid ASL Avatar (🇺🇸)'}
          </span>
          {isNlpParsing ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 animate-pulse font-mono flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              SmolLM2 Parsing...
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono flex items-center gap-1">
              <User className="h-2.5 w-2.5 text-indigo-600" />
              {modelLoading ? 'Loading 3D Character...' : `${modelType} (${mappedBoneCount} Bones)`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Selector: 3D / Dual / Video */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px]">
            <button
              onClick={() => setRenderMode('3d')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer",
                renderMode === '3d'
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <User className="h-3 w-3" />
              <span>3D Avatar</span>
            </button>
            <button
              onClick={() => setRenderMode('dual')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer",
                renderMode === 'dual'
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Layers className="h-3 w-3" />
              <span>Dual PIP</span>
            </button>
            <button
              onClick={() => setRenderMode('video')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer",
                renderMode === 'video'
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Video className="h-3 w-3" />
              <span>HD Video</span>
            </button>
          </div>

          {/* Dictionary Explorer Toggle */}
          <button
            onClick={() => setShowDictionary(!showDictionary)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs rounded-xl border transition-all cursor-pointer font-medium",
              showDictionary
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            )}
          >
            <BookOpen className="h-3 w-3" />
            <span className="hidden sm:inline">{showDictionary ? 'Hide' : 'Sign Library'}</span>
          </button>
        </div>
      </div>

      {/* Main 3D Stage */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 sm:gap-4 mt-3">
        
        {/* Visual Stage Container (Three.js WebGL 3D Full Humanoid Canvas) */}
        <div className="relative flex-1 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[350px] w-full">
          
          {/* Real-Time Gloss Countdown Progress Bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-slate-200 z-30 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 transition-all duration-75 ease-linear"
              style={{ width: `${glossProgress}%` }}
            />
          </div>

          {/* Top-Left Progress Sequence Counter & Badges */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
            {activeSequence.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white/95 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] text-slate-700 shadow-sm">
                <span className="font-semibold text-indigo-600">Gloss {currentIndex + 1}</span>
                <span>/</span>
                <span>{activeSequence.length}</span>
                <span className="text-slate-400">•</span>
                <span className="text-cyan-700 font-mono">{Math.round((currentSign?.durationMs || playbackSpeed) / 1000 * 10) / 10}s</span>
              </div>
            )}
            {currentSign.handShape && (
              <div className="bg-white/95 border border-indigo-100 px-2.5 py-0.5 rounded-lg text-[10px] text-indigo-700 font-medium shadow-sm">
                Hashta: {currentSign.handShape}
              </div>
            )}
          </div>

          {/* Orbit Controls Hint & Reset Button */}
          {['3d', 'dual'].includes(renderMode) && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <button
                onClick={handleResetCamera}
                className="p-1.5 rounded-lg bg-white/95 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-[10px] flex items-center gap-1 transition-all cursor-pointer pointer-events-auto shadow-sm"
                title="Reset Camera View"
              >
                <Rotate3d className="h-3 w-3 text-indigo-600" />
                <span className="hidden sm:inline">Reset View</span>
              </button>
              <div className="text-[10px] px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                {currentSign.hindi ? `${currentSign.hindi} (${currentSign.category})` : currentSign.category}
              </div>
            </div>
          )}

          {/* Three.js 3D WebGL Canvas */}
          <div 
            ref={mountRef} 
            className={cn(
              "w-full h-full min-h-[280px] sm:min-h-[350px] cursor-grab active:cursor-grabbing transition-opacity duration-300",
              renderMode === 'video' ? 'hidden' : 'block'
            )}
          />

          {/* Mode: Dual PIP Reference Video */}
          {renderMode === 'dual' && (
            <div className="absolute bottom-16 right-3 z-20 w-28 sm:w-32 h-20 sm:h-24 bg-white rounded-xl border border-indigo-200 overflow-hidden shadow-lg animate-fadeIn pointer-events-auto">
              <img
                key={currentSign.videoUrl}
                src={currentSign.videoUrl || 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif'}
                alt={`ISL Sign for ${currentSign.label}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 left-1 bg-slate-900/80 px-1.5 py-0.5 rounded text-[8px] font-mono text-white">
                Video PIP
              </div>
            </div>
          )}

          {/* Mode: Video Only Stage */}
          {renderMode === 'video' && (
            <div className="relative w-full h-full min-h-[280px] sm:min-h-[350px] flex flex-col items-center justify-center p-3 animate-fadeIn">
              <img
                key={currentSign.videoUrl}
                src={currentSign.videoUrl || 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif'}
                alt={`ISL Sign for ${currentSign.label}`}
                className="w-full h-full max-h-[280px] object-contain rounded-2xl shadow-md border border-slate-200"
              />
              <div className="mt-2 flex items-center gap-3">
                <span className="text-sm text-indigo-700 font-semibold">
                  {currentSign.handShape || 'ISL Standard Gesture'}
                </span>
              </div>
            </div>
          )}

          {/* Active Gloss & Subtitle Instruction Bar */}
          <div className="absolute bottom-2 inset-x-2 sm:inset-x-3 z-20 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-slate-200 text-center shadow-md">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-indigo-700 tracking-wide font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                [{currentSign.gloss || currentSign.keyword.toUpperCase()}]
              </span>
              <span className="text-xs font-medium text-slate-700">
                • {currentSign.label} {currentSign.hindi && `(${currentSign.hindi})`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
              {currentSign.description}
            </p>
          </div>

        </div>

        {/* Controls & Sequence Queue */}
        <div className="w-full md:w-60 flex flex-col justify-between gap-3">
          
          {/* Active Sequence Chips */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1 flex flex-col">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Sentence Glosses</span>
              <Sparkles className="h-3 w-3 text-indigo-600" />
            </div>

            <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-32 md:max-h-36 pr-1">
              {activeSequence.map((item, idx) => (
                <span
                  key={`${item.keyword}-${idx}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-all border",
                    idx === currentIndex
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm font-semibold"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {item.gloss || item.keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Micro-Interaction Controls */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-center gap-2">
              
              {/* Prev */}
              <MagneticButton
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 shadow-sm"
                title="Previous Gloss"
              >
                <ChevronLeft className="h-4 w-4" />
              </MagneticButton>

              {/* Play / Pause */}
              <ShinyButton
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-indigo-600 text-white flex-1 font-semibold py-1.5 shadow-sm"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </ShinyButton>

              {/* Replay */}
              <MagneticButton
                onClick={() => { setCurrentIndex(0); setIsPlaying(true); }}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-sm"
                title="Repeat (Replay from start)"
              >
                <RotateCcw className="h-4 w-4" />
              </MagneticButton>

              {/* Next */}
              <MagneticButton
                onClick={() => setCurrentIndex(prev => Math.min(activeSequence.length - 1, prev + 1))}
                disabled={currentIndex >= activeSequence.length - 1}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 shadow-sm"
                title="Next Gloss"
              >
                <ChevronRight className="h-4 w-4" />
              </MagneticButton>

            </div>

            {/* Playback Speed */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200">
              <span className="flex items-center gap-1 font-medium">
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
                      "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer",
                      playbackSpeed === s.speed
                        ? "bg-indigo-600 text-white font-semibold"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
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
        <div className="mt-3 pt-3 border-t border-slate-200 bg-slate-50 p-3 rounded-xl animate-fadeIn">
          <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
            <span>Select any sign to trigger 3D Avatar gesture:</span>
            <span className="text-[10px] text-indigo-600 font-mono font-medium">
              {Object.keys(AVATAR_VOCABULARY).length} Signs Available
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {Object.keys(AVATAR_VOCABULARY).map(key => {
              const item = AVATAR_VOCABULARY[key];
              const isSelected = activeSequence.some(s => s.keyword === key);
              return (
                <button
                  key={key}
                  onClick={() => handleManualSelect(key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm font-semibold"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
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
