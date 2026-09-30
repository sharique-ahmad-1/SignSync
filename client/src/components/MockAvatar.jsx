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
  Box, 
  Video, 
  Upload, 
  Rotate3d,
  Layers,
  CheckCircle2,
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

// Standard Mixamo & GLTF bone hierarchy map keys
export const STANDARD_BONES = [
  'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
  'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
  'RightHandThumb1', 'RightHandThumb2', 'RightHandThumb3',
  'RightHandIndex1', 'RightHandIndex2', 'RightHandIndex3',
  'RightHandMiddle1', 'RightHandMiddle2', 'RightHandMiddle3',
  'RightHandRing1', 'RightHandRing2', 'RightHandRing3',
  'RightHandPinky1', 'RightHandPinky2', 'RightHandPinky3',
  'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
  'LeftHandThumb1', 'LeftHandThumb2', 'LeftHandThumb3',
  'LeftHandIndex1', 'LeftHandIndex2', 'LeftHandIndex3',
  'LeftHandMiddle1', 'LeftHandMiddle2', 'LeftHandMiddle3',
  'LeftHandRing1', 'LeftHandRing2', 'LeftHandRing3',
  'LeftHandPinky1', 'LeftHandPinky2', 'LeftHandPinky3'
];

/**
 * Traverses any GLTF model scene and extracts standard bones into a mapped dictionary
 */
function extractSkeletonBones(root) {
  const bones = {};
  root.traverse((node) => {
    if (!node.isBone) return;
    const rawName = node.name || '';
    const cleanName = rawName
      .replace(/^(mixamorig[:_]?|bip01[:_]?|ValveBiped[:_]?|armature[:_]?)/i, '')
      .replace(/[^a-zA-Z0-9]/g, '');
    const lower = cleanName.toLowerCase();

    // Body & Head
    if (lower === 'head') bones.Head = node;
    else if (lower === 'neck') bones.Neck = node;
    else if (lower === 'spine2' || lower === 'chest') bones.Spine2 = node;
    else if (lower === 'spine1') bones.Spine1 = node;
    else if (lower === 'spine' || lower === 'spine0') bones.Spine = node;
    else if (lower === 'hips' || lower === 'pelvis') bones.Hips = node;

    // Right Arm & Hand
    else if (lower === 'rightshoulder' || lower === 'rshoulder') bones.RightShoulder = node;
    else if (lower === 'rightarm' || lower === 'rightupperarm' || lower === 'rarm') bones.RightArm = node;
    else if (lower === 'rightforearm' || lower === 'rightlowerarm' || lower === 'rforearm') bones.RightForeArm = node;
    else if (lower === 'righthand' || lower === 'rhand') bones.RightHand = node;

    // Right Fingers
    else if (lower === 'righthandthumb1' || lower === 'rthumb1') bones.RightHandThumb1 = node;
    else if (lower === 'righthandthumb2' || lower === 'rthumb2') bones.RightHandThumb2 = node;
    else if (lower === 'righthandthumb3' || lower === 'rthumb3') bones.RightHandThumb3 = node;
    else if (lower === 'righthandindex1' || lower === 'rindex1') bones.RightHandIndex1 = node;
    else if (lower === 'righthandindex2' || lower === 'rindex2') bones.RightHandIndex2 = node;
    else if (lower === 'righthandindex3' || lower === 'rindex3') bones.RightHandIndex3 = node;
    else if (lower === 'righthandmiddle1' || lower === 'rmiddle1') bones.RightHandMiddle1 = node;
    else if (lower === 'righthandmiddle2' || lower === 'rmiddle2') bones.RightHandMiddle2 = node;
    else if (lower === 'righthandmiddle3' || lower === 'rmiddle3') bones.RightHandMiddle3 = node;
    else if (lower === 'righthandring1' || lower === 'rring1') bones.RightHandRing1 = node;
    else if (lower === 'righthandring2' || lower === 'rring2') bones.RightHandRing2 = node;
    else if (lower === 'righthandring3' || lower === 'rring3') bones.RightHandRing3 = node;
    else if (lower === 'righthandpinky1' || lower === 'rpinky1') bones.RightHandPinky1 = node;
    else if (lower === 'righthandpinky2' || lower === 'rpinky2') bones.RightHandPinky2 = node;
    else if (lower === 'righthandpinky3' || lower === 'rpinky3') bones.RightHandPinky3 = node;

    // Left Arm & Hand
    else if (lower === 'leftshoulder' || lower === 'lshoulder') bones.LeftShoulder = node;
    else if (lower === 'leftarm' || lower === 'leftupperarm' || lower === 'larm') bones.LeftArm = node;
    else if (lower === 'leftforearm' || lower === 'leftlowerarm' || lower === 'lforearm') bones.LeftForeArm = node;
    else if (lower === 'lefthand' || lower === 'lhand') bones.LeftHand = node;

    // Left Fingers
    else if (lower === 'lefthandthumb1' || lower === 'lthumb1') bones.LeftHandThumb1 = node;
    else if (lower === 'lefthandthumb2' || lower === 'lthumb2') bones.LeftHandThumb2 = node;
    else if (lower === 'lefthandthumb3' || lower === 'lthumb3') bones.LeftHandThumb3 = node;
    else if (lower === 'lefthandindex1' || lower === 'lindex1') bones.LeftHandIndex1 = node;
    else if (lower === 'lefthandindex2' || lower === 'lindex2') bones.LeftHandIndex2 = node;
    else if (lower === 'lefthandindex3' || lower === 'lindex3') bones.LeftHandIndex3 = node;
    else if (lower === 'lefthandmiddle1' || lower === 'lmiddle1') bones.LeftHandMiddle1 = node;
    else if (lower === 'lefthandmiddle2' || lower === 'lmiddle2') bones.LeftHandMiddle2 = node;
    else if (lower === 'lefthandmiddle3' || lower === 'lmiddle3') bones.LeftHandMiddle3 = node;
    else if (lower === 'lefthandring1' || lower === 'lring1') bones.LeftHandRing1 = node;
    else if (lower === 'lefthandring2' || lower === 'lring2') bones.LeftHandRing2 = node;
    else if (lower === 'lefthandring3' || lower === 'lring3') bones.LeftHandRing3 = node;
    else if (lower === 'lefthandpinky1' || lower === 'lpinky1') bones.LeftHandPinky1 = node;
    else if (lower === 'lefthandpinky2' || lower === 'lpinky2') bones.LeftHandPinky2 = node;
    else if (lower === 'lefthandpinky3' || lower === 'lpinky3') bones.LeftHandPinky3 = node;
  });
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
  const [modelType, setModelType] = useState('3D Rigged Avatar (.glb)');
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [mappedBoneCount, setMappedBoneCount] = useState(0);

  // Three.js Canvas & Scene References
  const mountRef = useRef(null);
  const threeStateRef = useRef(null);
  const currentSignRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastProcessedTextRef = useRef('');

  // Target Pose Dispatcher
  const executeSignPose = useCallback((sign) => {
    if (!sign) return;
    currentSignRef.current = sign;
    if (threeStateRef.current) {
      threeStateRef.current.activeSign = sign;
    }
  }, []);

  // Parse speech or input into ISL/ASL Gloss Sequence (Task 3)
  useEffect(() => {
    if (!transcribedText || !transcribedText.trim()) return;
    const cleanText = transcribedText.trim();
    if (cleanText === lastProcessedTextRef.current) return;

    let isMounted = true;
    setIsNlpParsing(true);

    const parseSequence = async () => {
      // 1. Instant fallback parse using ISL SOV grammar rules for zero-delay response
      const immediateGlosses = parseTextToSignGlosses(cleanText);
      if (isMounted && immediateGlosses.length > 0) {
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

      // 2. Refined keyword extraction via SmolLM2-135M model
      try {
        const keywords = await extractISLKeywords(cleanText);
        if (isMounted && keywords && keywords.length > 0) {
          const refinedGlosses = parseTextToSignGlosses(keywords.join(' '));
          if (refinedGlosses.length > 0) {
            setActiveSequence(refinedGlosses);
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

  // Initialize Three.js WebGL Scene with Rigging and OrbitControls
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 340;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a13);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.35, 1.85); // Focused on upper body & signing space

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

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 1.0;
    controls.maxDistance = 4.5;
    controls.target.set(0, 1.25, 0);
    controls.update();

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x818cf8, 3.2);
    keyLight.position.set(2.5, 4, 2.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    fillLight.position.set(-2.5, 2, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xc084fc, 2.8, 8);
    rimLight.position.set(0, 3, -1.8);
    scene.add(rimLight);

    // Cyber Ground Grid & Spotlight Disc
    const grid = new THREE.GridHelper(5, 10, 0x312e81, 0x0f172a);
    grid.position.y = 0;
    scene.add(grid);

    const discGeo = new THREE.CircleGeometry(0.9, 32);
    const discMat = new THREE.MeshBasicMaterial({ 
      color: 0x4f46e5, 
      transparent: true, 
      opacity: 0.25, 
      side: THREE.DoubleSide 
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.01;
    scene.add(disc);

    // 5. Procedural Humanoid Fallback Armature
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, 0, 0);

    const torsoGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.75, 16);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.3,
      metalness: 0.4
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.9;
    avatarGroup.add(torso);

    const headGeo = new THREE.SphereGeometry(0.2, 24, 24);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xe0e7ff,
      roughness: 0.4
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.45;
    avatarGroup.add(head);

    const visorGeo = new THREE.BoxGeometry(0.24, 0.07, 0.16);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.47, 0.14);
    avatarGroup.add(visor);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.3 });
    const handMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });

    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.35, 1.2, 0);
    const rightUpperArmGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.38, 12);
    const rightUpperArm = new THREE.Mesh(rightUpperArmGeo, armMat);
    rightUpperArm.position.y = -0.19;
    rightShoulder.add(rightUpperArm);

    const rightElbow = new THREE.Group();
    rightElbow.position.set(0, -0.38, 0);
    const rightForearmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.35, 12);
    const rightForearm = new THREE.Mesh(rightForearmGeo, armMat);
    rightForearm.position.y = -0.175;
    rightElbow.add(rightForearm);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), handMat);
    rightHand.position.y = -0.38;
    rightElbow.add(rightHand);
    rightShoulder.add(rightElbow);
    avatarGroup.add(rightShoulder);

    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.35, 1.2, 0);
    const leftUpperArm = new THREE.Mesh(rightUpperArmGeo, armMat);
    leftUpperArm.position.y = -0.19;
    leftShoulder.add(leftUpperArm);

    const leftElbow = new THREE.Group();
    leftElbow.position.set(0, -0.38, 0);
    const leftForearm = new THREE.Mesh(rightForearmGeo, armMat);
    leftForearm.position.y = -0.175;
    leftElbow.add(leftForearm);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), handMat);
    leftHand.position.y = -0.38;
    leftElbow.add(leftHand);
    leftShoulder.add(leftElbow);
    avatarGroup.add(leftShoulder);

    scene.add(avatarGroup);

    // Three.js State Holder
    threeStateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      avatarGroup,
      customModel: null,
      mixer: null,
      torso,
      head,
      rightShoulder,
      rightElbow,
      leftShoulder,
      leftElbow,
      rightHand,
      leftHand,
      bones: {},
      activeSign: (activeSequence && activeSequence[0]) ? activeSequence[0] : AVATAR_VOCABULARY.hello
    };

    // 6. Automatic Pre-generated 3D Character Loader (Task 1)
    const loadPreGeneratedModel = () => {
      setModelLoading(true);
      setModelError(null);
      const loader = new GLTFLoader();

      const tryLoadPath = (url, fallbackUrl = null) => {
        loader.load(
          url,
          (gltf) => {
            console.log(`[MockAvatar] Successfully loaded 3D GLB model from ${url}:`, gltf);
            applyGLTFToScene(gltf, 'Rigged Mixamo Avatar (.glb)');
          },
          undefined,
          (err) => {
            console.warn(`[MockAvatar] Notice loading ${url}:`, err);
            if (fallbackUrl) {
              tryLoadPath(fallbackUrl, null);
            } else {
              setModelLoading(false);
              setModelType('Procedural Rigged Armature');
            }
          }
        );
      };

      tryLoadPath('/models/avatar.glb', '/models/verity.glb');
    };

    loadPreGeneratedModel();

    // 7. Core Render and Animation Loop (Task 2)
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      if (threeStateRef.current) {
        const state = threeStateRef.current;
        const { controls, renderer, scene, camera, mixer, bones, torso, head, rightShoulder, rightElbow, leftShoulder, leftElbow, rightHand, leftHand, avatarGroup } = state;

        controls.update();

        if (mixer) {
          mixer.update(delta);
        }

        const activeSign = state.activeSign || currentSignRef.current || AVATAR_VOCABULARY.hello;
        const glossKey = (activeSign.gloss || activeSign.keyword || '').toUpperCase();

        // =========================================================================
        // TARGET ROTATION & SIGNING CYCLE COMPILATION (Tasks 1 & 2)
        // Computes target Euler rotations for Mixamo bones & Procedural joints
        // =========================================================================
        
        // Neutral Rest Pose
        let rArm = [0.1, 0.15, 1.25];
        let rFore = [0.0, 0.3, 0.0];
        let rWrist = [0.0, 0.0, 0.0];
        let lArm = [0.1, -0.15, -1.25];
        let lFore = [0.0, -0.3, 0.0];
        let lWrist = [0.0, 0.0, 0.0];
        let headRot = [0.0, 0.0, 0.0];
        let spineRot = [Math.sin(time * 2.0) * 0.015, 0.0, 0.0]; // Breathing

        // Finger curls: 0.0 = fully extended (flat palm), 1.0 = tight fist
        let rThumbCurl = 0.1;
        let rIndexCurl = 0.1;
        let rMiddleCurl = 0.1;
        let rRingCurl = 0.1;
        let rPinkyCurl = 0.1;

        let lThumbCurl = 0.1;
        let lIndexCurl = 0.1;
        let lMiddleCurl = 0.1;
        let lRingCurl = 0.1;
        let lPinkyCurl = 0.1;

        // Procedural Armature Euler equivalents
        let procRShoulder = [0.2, 0, 0.2];
        let procRElbow = [0, -0.2, 0];
        let procLShoulder = [-0.2, 0, -0.2];
        let procLElbow = [0, 0, 0];
        let procHead = [0.05, 0, 0];

        switch (glossKey) {
          case 'HELLO':
          case 'NAMASTE': {
            // Right hand raised to temple waving outward
            rArm = [0.45, 0.5, 0.2];
            rFore = [0.2, 1.3, -0.4];
            rWrist = [0.1, 0.2 + Math.sin(time * 5.5) * 0.35, Math.sin(time * 5.5) * 0.25];
            headRot = [0.08 + Math.sin(time * 2) * 0.04, 0.0, 0.0];

            // Fingers fully extended (Pataka / Open palm wave)
            rThumbCurl = 0.0;
            rIndexCurl = 0.0;
            rMiddleCurl = 0.0;
            rRingCurl = 0.0;
            rPinkyCurl = 0.0;

            procRShoulder = [1.1 + Math.sin(time * 5.5) * 0.35, -0.2, 0.5 + Math.sin(time * 5.5) * 0.3];
            procRElbow = [0, -0.6, 0.4];
            procHead = [0.1, 0, 0];
            break;
          }

          case 'HELP':
          case 'SAHAYATA': {
            // Both hands in front of chest. Right fist on left flat palm, lifting upward
            const lift = Math.sin(time * 3.5) * 0.15;
            rArm = [0.65 + lift, 0.3, 0.7];
            rFore = [0.3, 1.45, -0.5];
            rWrist = [0.1, 0.2, 0.0];

            lArm = [0.65 + lift, -0.3, -0.7];
            lFore = [-0.3, -1.45, 0.5];
            lWrist = [-0.1, -0.2, 0.0];

            headRot = [0.15 + lift * 0.5, 0.0, 0.0];

            // Right hand: Closed fist with thumb up
            rThumbCurl = 0.15;
            rIndexCurl = 0.95;
            rMiddleCurl = 0.95;
            rRingCurl = 0.95;
            rPinkyCurl = 0.95;

            // Left hand: Open flat palm support
            lThumbCurl = 0.0;
            lIndexCurl = 0.0;
            lMiddleCurl = 0.0;
            lRingCurl = 0.0;
            lPinkyCurl = 0.0;

            procRShoulder = [0.6 + lift, 0, 0.5];
            procRElbow = [0, -0.5, 0.4];
            procLShoulder = [0.6 + lift, 0, -0.5];
            procLElbow = [0, -0.5, -0.4];
            break;
          }

          case 'YES':
          case 'HAAN': {
            // Right hand in front forming a tight fist, nodding affirmatively
            const nod = Math.sin(time * 5.5) * 0.3;
            rArm = [0.55, 0.2, 0.7];
            rFore = [0.2, 1.5, -0.3];
            rWrist = [0.35 + nod, 0.0, 0.0];
            headRot = [0.2 + nod * 0.7, 0.0, 0.0];

            // Tight closed fist (Mushti)
            rThumbCurl = 0.9;
            rIndexCurl = 1.0;
            rMiddleCurl = 1.0;
            rRingCurl = 1.0;
            rPinkyCurl = 1.0;

            procRShoulder = [0.65, 0, 0.45];
            procRElbow = [-0.5 + nod * 0.5, 0, 0];
            procHead = [0.2 + nod * 0.6, 0, 0];
            break;
          }

          case 'NO':
          case 'NAHI': {
            // Hand in front, shaking side to side, head shaking "no"
            const shake = Math.sin(time * 6.0) * 0.35;
            rArm = [0.6, 0.1, 0.6];
            rFore = [0.1, 1.4, -0.2];
            rWrist = [0.0, shake, 0.0];
            headRot = [0.0, shake * 0.9, 0.0];

            // Index & middle extended, others curled
            rThumbCurl = 0.8;
            rIndexCurl = 0.0;
            rMiddleCurl = 0.0;
            rRingCurl = 0.9;
            rPinkyCurl = 0.9;

            procRShoulder = [0.7, shake * 0.4, 0.4];
            procHead = [0, shake, 0];
            break;
          }

          case 'WATER':
          case 'PAANI':
          case 'DRINK': {
            // W-handshape (Index, Middle, Ring extended) tapping chin/mouth
            const tap = Math.sin(time * 5.5) * 0.18;
            rArm = [0.72, 0.3, 0.5];
            rFore = [0.4, 1.7 + tap, -0.6];
            rWrist = [0.25 + tap, 0.0, 0.0];
            headRot = [0.05, 0.0, 0.0];

            // W-Shape: Index, Middle, Ring straight, Thumb & Pinky curled
            rThumbCurl = 0.9;
            rIndexCurl = 0.0;
            rMiddleCurl = 0.0;
            rRingCurl = 0.0;
            rPinkyCurl = 0.9;

            procRShoulder = [1.2, 0, 0.55];
            procRElbow = [-0.9 + tap, 0, 0.6];
            break;
          }

          case 'FOOD':
          case 'KHANA':
          case 'EAT':
          case 'KHAO': {
            // Bunched fingertips tapping towards mouth
            const tap = Math.sin(time * 5.0) * 0.22;
            rArm = [0.75, 0.35, 0.55];
            rFore = [0.5, 1.8 + tap, -0.7];
            rWrist = [0.3 + tap, 0.0, 0.0];
            headRot = [0.12, 0.0, 0.0];

            // Bunched fingertips (O-hand shape)
            rThumbCurl = 0.55;
            rIndexCurl = 0.55;
            rMiddleCurl = 0.55;
            rRingCurl = 0.55;
            rPinkyCurl = 0.55;

            procRShoulder = [1.25, 0, 0.5];
            procRElbow = [-0.85 + tap, 0, 0.5];
            break;
          }

          case 'THANK YOU':
          case 'THANKS':
          case 'DHANYAVAAD': {
            // Chin touch extending forward towards viewer
            const sweep = (Math.sin(time * 3.5) + 1.0) * 0.5; // 0 to 1
            rArm = [0.65 - sweep * 0.2, 0.25, 0.55];
            rFore = [0.3, 1.7 - sweep * 0.6, -0.4];
            rWrist = [0.2 - sweep * 0.3, 0.0, 0.0];
            headRot = [0.12, 0.0, 0.0];

            rThumbCurl = 0.0;
            rIndexCurl = 0.0;
            rMiddleCurl = 0.0;
            rRingCurl = 0.0;
            rPinkyCurl = 0.0;

            procRShoulder = [1.1 - sweep * 0.3, 0, 0.45];
            procRElbow = [-0.8 + sweep * 0.4, 0, 0.6];
            break;
          }

          case 'STOP':
          case 'RUKO': {
            // Firm extended right arm with vertical open palm
            rArm = [0.85, 0.1, 0.5];
            rFore = [0.1, 1.1, -0.2];
            rWrist = [-0.45, 0.0, 0.0]; // Wrist flexed back
            headRot = [0.05, 0.0, 0.0];

            rThumbCurl = 0.0;
            rIndexCurl = 0.0;
            rMiddleCurl = 0.0;
            rRingCurl = 0.0;
            rPinkyCurl = 0.0;

            procRShoulder = [0.8, 0, 0.5];
            procRElbow = [-0.3, 0, 0];
            break;
          }

          case 'FIRE':
          case 'AANG': {
            // Both hands raised, flickering finger waves
            const fWave1 = Math.sin(time * 7.0) * 0.2;
            const fWave2 = Math.cos(time * 7.0) * 0.2;
            rArm = [0.8 + fWave1, 0.2, 0.4];
            rFore = [0.2, 1.3, -0.3];
            lArm = [0.8 + fWave2, -0.2, -0.4];
            lFore = [-0.2, -1.3, 0.3];

            rIndexCurl = (Math.sin(time * 8.0) + 1.0) * 0.3;
            rMiddleCurl = (Math.sin(time * 8.0 + 1) + 1.0) * 0.3;
            rRingCurl = (Math.sin(time * 8.0 + 2) + 1.0) * 0.3;
            rPinkyCurl = (Math.sin(time * 8.0 + 3) + 1.0) * 0.3;

            lIndexCurl = (Math.cos(time * 8.0) + 1.0) * 0.3;
            lMiddleCurl = (Math.cos(time * 8.0 + 1) + 1.0) * 0.3;
            lRingCurl = (Math.cos(time * 8.0 + 2) + 1.0) * 0.3;
            lPinkyCurl = (Math.cos(time * 8.0 + 3) + 1.0) * 0.3;

            procRShoulder = [1.0 + fWave1, 0, 0.55];
            procLShoulder = [1.0 + fWave2, 0, -0.55];
            break;
          }

          default: {
            // Dynamic fallback for all vocabulary signs using their bonePose & cycle definitions
            const pose = activeSign.bonePose || {};
            const cycle = activeSign.cycle;

            let osc = 0;
            if (cycle) {
              osc = Math.sin(time * (cycle.freq || 4.0)) * (cycle.amp || 0.2);
            }

            if (pose.rightShoulder || pose.rightArm) {
              rArm = [0.65 + osc, 0.25, 0.6];
              rFore = [0.3, 1.45 + osc, -0.4];
              procRShoulder = [pose.rightShoulder?.[0] || 0.8, pose.rightShoulder?.[1] || 0, pose.rightShoulder?.[2] || 0.4];
            }
            if (pose.leftShoulder || pose.leftArm) {
              lArm = [0.65 + osc, -0.25, -0.6];
              lFore = [-0.3, -1.45 - osc, 0.4];
              procLShoulder = [pose.leftShoulder?.[0] || -0.2, pose.leftShoulder?.[1] || 0, pose.leftShoulder?.[2] || 0];
            }

            // Finger curl fallback based on handshape
            const shape = (activeSign.handShape || '').toLowerCase();
            if (shape.includes('fist') || shape.includes('mushti')) {
              rThumbCurl = 0.8;
              rIndexCurl = 0.95;
              rMiddleCurl = 0.95;
              rRingCurl = 0.95;
              rPinkyCurl = 0.95;
            } else if (shape.includes('point') || shape.includes('index')) {
              rIndexCurl = 0.0;
              rThumbCurl = 0.7;
              rMiddleCurl = 0.85;
              rRingCurl = 0.85;
              rPinkyCurl = 0.85;
            } else if (shape.includes('cup') || shape.includes('o-hand')) {
              rThumbCurl = 0.4;
              rIndexCurl = 0.4;
              rMiddleCurl = 0.4;
              rRingCurl = 0.4;
              rPinkyCurl = 0.4;
            } else {
              rThumbCurl = 0.05;
              rIndexCurl = 0.05;
              rMiddleCurl = 0.05;
              rRingCurl = 0.05;
              rPinkyCurl = 0.05;
            }
            break;
          }
        }

        // =========================================================================
        // SMOOTH LERP INTERPOLATION (Frame-Rate Independent)
        // =========================================================================
        const lerpFactor = 1.0 - Math.exp(-delta * 12.0); // Smooth responsive lerp (~0.18 per frame at 60fps)

        // 1. Rigged SkinnedMesh Bones (Mixamo Hierarchy)
        if (bones && Object.keys(bones).length > 0) {
          // Spine & Head
          if (bones.Spine) {
            bones.Spine.rotation.x = THREE.MathUtils.lerp(bones.Spine.rotation.x, spineRot[0], lerpFactor);
          }
          if (bones.Head) {
            bones.Head.rotation.x = THREE.MathUtils.lerp(bones.Head.rotation.x, headRot[0], lerpFactor);
            bones.Head.rotation.y = THREE.MathUtils.lerp(bones.Head.rotation.y, headRot[1], lerpFactor);
            bones.Head.rotation.z = THREE.MathUtils.lerp(bones.Head.rotation.z, headRot[2], lerpFactor);
          }

          // Right Arm
          if (bones.RightArm) {
            bones.RightArm.rotation.x = THREE.MathUtils.lerp(bones.RightArm.rotation.x, rArm[0], lerpFactor);
            bones.RightArm.rotation.y = THREE.MathUtils.lerp(bones.RightArm.rotation.y, rArm[1], lerpFactor);
            bones.RightArm.rotation.z = THREE.MathUtils.lerp(bones.RightArm.rotation.z, rArm[2], lerpFactor);
          }
          if (bones.RightForeArm) {
            bones.RightForeArm.rotation.x = THREE.MathUtils.lerp(bones.RightForeArm.rotation.x, rFore[0], lerpFactor);
            bones.RightForeArm.rotation.y = THREE.MathUtils.lerp(bones.RightForeArm.rotation.y, rFore[1], lerpFactor);
            bones.RightForeArm.rotation.z = THREE.MathUtils.lerp(bones.RightForeArm.rotation.z, rFore[2], lerpFactor);
          }
          if (bones.RightHand) {
            bones.RightHand.rotation.x = THREE.MathUtils.lerp(bones.RightHand.rotation.x, rWrist[0], lerpFactor);
            bones.RightHand.rotation.y = THREE.MathUtils.lerp(bones.RightHand.rotation.y, rWrist[1], lerpFactor);
            bones.RightHand.rotation.z = THREE.MathUtils.lerp(bones.RightHand.rotation.z, rWrist[2], lerpFactor);
          }

          // Right Fingers (Thumb, Index, Middle, Ring, Pinky 1-3)
          const applyFingerCurl = (bonePrefix, curlAmount, isThumb = false) => {
            const rotVal = isThumb ? (curlAmount * 0.5) : (curlAmount * 0.85);
            for (let i = 1; i <= 3; i++) {
              const b = bones[`${bonePrefix}${i}`];
              if (b) {
                if (isThumb) {
                  b.rotation.y = THREE.MathUtils.lerp(b.rotation.y, rotVal, lerpFactor);
                  b.rotation.z = THREE.MathUtils.lerp(b.rotation.z, rotVal * 0.7, lerpFactor);
                } else {
                  b.rotation.z = THREE.MathUtils.lerp(b.rotation.z, rotVal, lerpFactor);
                }
              }
            }
          };

          applyFingerCurl('RightHandThumb', rThumbCurl, true);
          applyFingerCurl('RightHandIndex', rIndexCurl);
          applyFingerCurl('RightHandMiddle', rMiddleCurl);
          applyFingerCurl('RightHandRing', rRingCurl);
          applyFingerCurl('RightHandPinky', rPinkyCurl);

          // Left Arm
          if (bones.LeftArm) {
            bones.LeftArm.rotation.x = THREE.MathUtils.lerp(bones.LeftArm.rotation.x, lArm[0], lerpFactor);
            bones.LeftArm.rotation.y = THREE.MathUtils.lerp(bones.LeftArm.rotation.y, lArm[1], lerpFactor);
            bones.LeftArm.rotation.z = THREE.MathUtils.lerp(bones.LeftArm.rotation.z, lArm[2], lerpFactor);
          }
          if (bones.LeftForeArm) {
            bones.LeftForeArm.rotation.x = THREE.MathUtils.lerp(bones.LeftForeArm.rotation.x, lFore[0], lerpFactor);
            bones.LeftForeArm.rotation.y = THREE.MathUtils.lerp(bones.LeftForeArm.rotation.y, lFore[1], lerpFactor);
            bones.LeftForeArm.rotation.z = THREE.MathUtils.lerp(bones.LeftForeArm.rotation.z, lFore[2], lerpFactor);
          }
          if (bones.LeftHand) {
            bones.LeftHand.rotation.x = THREE.MathUtils.lerp(bones.LeftHand.rotation.x, lWrist[0], lerpFactor);
            bones.LeftHand.rotation.y = THREE.MathUtils.lerp(bones.LeftHand.rotation.y, lWrist[1], lerpFactor);
            bones.LeftHand.rotation.z = THREE.MathUtils.lerp(bones.LeftHand.rotation.z, lWrist[2], lerpFactor);
          }

          // Left Fingers
          const applyLeftFingerCurl = (bonePrefix, curlAmount, isThumb = false) => {
            const rotVal = isThumb ? (-curlAmount * 0.5) : (-curlAmount * 0.85);
            for (let i = 1; i <= 3; i++) {
              const b = bones[`${bonePrefix}${i}`];
              if (b) {
                if (isThumb) {
                  b.rotation.y = THREE.MathUtils.lerp(b.rotation.y, rotVal, lerpFactor);
                  b.rotation.z = THREE.MathUtils.lerp(b.rotation.z, rotVal * 0.7, lerpFactor);
                } else {
                  b.rotation.z = THREE.MathUtils.lerp(b.rotation.z, rotVal, lerpFactor);
                }
              }
            }
          };

          applyLeftFingerCurl('LeftHandThumb', lThumbCurl, true);
          applyLeftFingerCurl('LeftHandIndex', lIndexCurl);
          applyLeftFingerCurl('LeftHandMiddle', lMiddleCurl);
          applyLeftFingerCurl('LeftHandRing', lRingCurl);
          applyLeftFingerCurl('LeftHandPinky', lPinkyCurl);
        }

        // 2. Procedural Rig Synchronizer
        if (avatarGroup && avatarGroup.visible) {
          torso.scale.y = 1 + Math.sin(time * 2.0) * 0.015;
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, procHead[0], lerpFactor);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, procHead[1], lerpFactor);

          rightShoulder.rotation.x = THREE.MathUtils.lerp(rightShoulder.rotation.x, procRShoulder[0], lerpFactor);
          rightShoulder.rotation.y = THREE.MathUtils.lerp(rightShoulder.rotation.y, procRShoulder[1], lerpFactor);
          rightShoulder.rotation.z = THREE.MathUtils.lerp(rightShoulder.rotation.z, procRShoulder[2], lerpFactor);

          rightElbow.rotation.x = THREE.MathUtils.lerp(rightElbow.rotation.x, procRElbow[0], lerpFactor);
          rightElbow.rotation.y = THREE.MathUtils.lerp(rightElbow.rotation.y, procRElbow[1], lerpFactor);
          rightElbow.rotation.z = THREE.MathUtils.lerp(rightElbow.rotation.z, procRElbow[2], lerpFactor);

          leftShoulder.rotation.x = THREE.MathUtils.lerp(leftShoulder.rotation.x, procLShoulder[0], lerpFactor);
          leftShoulder.rotation.y = THREE.MathUtils.lerp(leftShoulder.rotation.y, procLShoulder[1], lerpFactor);
          leftShoulder.rotation.z = THREE.MathUtils.lerp(leftShoulder.rotation.z, procLShoulder[2], lerpFactor);

          leftElbow.rotation.x = THREE.MathUtils.lerp(leftElbow.rotation.x, procLElbow[0], lerpFactor);

          if (rightHand && rightHand.material) {
            const pulse = 0.5 + Math.sin(time * 4.0) * 0.3;
            rightHand.material.emissive = rightHand.material.emissive || new THREE.Color();
            rightHand.material.emissive.setHex(0x38bdf8);
            rightHand.material.emissiveIntensity = pulse;
          }
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

  // Helper to attach any loaded GLTF/GLB character to scene & map its bones (Task 1)
  const applyGLTFToScene = (gltf, label = '3D Avatar Model') => {
    if (!threeStateRef.current) return;
    const { scene, avatarGroup } = threeStateRef.current;

    // Hide procedural model
    avatarGroup.visible = false;

    // Remove previous custom model
    if (threeStateRef.current.customModel) {
      scene.remove(threeStateRef.current.customModel);
    }

    const model = gltf.scene || gltf.scenes[0];
    model.position.set(0, 0, 0);

    // Compute bounding box and normalize scale to fit frame perfectly
    const bbox = new THREE.Box3().setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 1.9 / maxDim;
      model.scale.set(scale, scale, scale);
    }

    // Traverse skeleton and extract mapped Mixamo bone dictionary
    const bones = extractSkeletonBones(model);
    const boneCount = Object.keys(bones).length;
    console.log(`[MockAvatar] Rigged ${boneCount} standard bones in ${label}:`, Object.keys(bones));

    // Enable shadows and enhance materials
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.roughness = Math.min(child.material.roughness || 0.5, 0.4);
        }
      }
    });

    scene.add(model);
    threeStateRef.current.customModel = model;
    threeStateRef.current.bones = bones;

    // Handle animations if present in GLB
    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      threeStateRef.current.mixer = mixer;
    }

    setModelType(label);
    setMappedBoneCount(boneCount);
    setModelLoading(false);
  };

  // Handle manual .glb / .gltf file upload from user
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setModelLoading(true);
    setModelError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      const loader = new GLTFLoader();
      loader.parse(
        contents,
        '',
        (gltf) => {
          applyGLTFToScene(gltf, file.name.replace(/\.[^/.]+$/, ''));
        },
        (err) => {
          console.error('[MockAvatar] Error parsing GLTF:', err);
          setModelError('Failed to parse 3D file. Ensure it is a valid .glb / .gltf model.');
          setModelLoading(false);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  };

  // Reset Camera View in OrbitControls
  const handleResetCamera = () => {
    if (threeStateRef.current && threeStateRef.current.controls) {
      threeStateRef.current.camera.position.set(0, 1.35, 1.85);
      threeStateRef.current.controls.target.set(0, 1.25, 0);
      threeStateRef.current.controls.update();
    }
  };

  // Update Target Pose on currentSign change
  useEffect(() => {
    if (currentSign) {
      executeSignPose(currentSign);
    }
  }, [currentSign, executeSignPose]);

  // Synchronized countdown progress for active sign gloss (Task 3)
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
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 p-4 transition-all shadow-xl">
      
      {/* Component Header with 3D / Dual / Video Switcher */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 font-heading">
            {signLanguageMode === 'ISL' ? '3D ISL Avatar System (🇮🇳)' : '3D ASL Avatar System (🇺🇸)'}
          </span>
          {isNlpParsing ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse font-mono flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              SmolLM2 Parsing...
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono flex items-center gap-1">
              <Activity className="h-2.5 w-2.5 text-indigo-400" />
              {mappedBoneCount > 0 ? `${mappedBoneCount} Bones Rigged` : modelType}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Selector: 3D / Dual / Video */}
          <div className="flex bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setRenderMode('3d')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer",
                renderMode === '3d'
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Box className="h-3 w-3" />
              <span>3D Avatar</span>
            </button>
            <button
              onClick={() => setRenderMode('dual')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer",
                renderMode === 'dual'
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
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
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Video className="h-3 w-3" />
              <span>HD Video</span>
            </button>
          </div>

          {/* Model Upload Button for custom .glb */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-xs flex items-center gap-1 cursor-pointer"
            title="Load custom rigged .glb avatar model"
          >
            <Upload className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline">Custom .GLB</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Dictionary Explorer Toggle */}
          <button
            onClick={() => setShowDictionary(!showDictionary)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs rounded-xl border transition-all cursor-pointer",
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

      {/* Main Avatar Stage */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 mt-3">
        
        {/* Visual Stage Container (Three.js WebGL 3D Canvas + Dual PIP) */}
        <div className="relative flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden min-h-[340px]">
          
          {/* Real-Time Gloss Countdown Progress Bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-slate-800/80 z-30 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-75 ease-linear"
              style={{ width: `${glossProgress}%` }}
            />
          </div>

          {/* Top-Left Progress Sequence Counter & Badges */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
            {activeSequence.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] text-slate-300 shadow-lg">
                <span className="font-semibold text-indigo-400">Gloss {currentIndex + 1}</span>
                <span>/</span>
                <span>{activeSequence.length}</span>
                <span className="text-slate-500">•</span>
                <span className="text-cyan-300 font-mono">{Math.round((currentSign?.durationMs || playbackSpeed) / 1000 * 10) / 10}s</span>
              </div>
            )}
            {currentSign.handShape && (
              <div className="bg-slate-900/80 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg text-[10px] text-cyan-300 font-medium shadow-md">
                Hashta: {currentSign.handShape}
              </div>
            )}
          </div>

          {/* Orbit Controls Hint & Reset Button */}
          {['3d', 'dual'].includes(renderMode) && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <button
                onClick={handleResetCamera}
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 text-[10px] flex items-center gap-1 transition-all cursor-pointer pointer-events-auto"
                title="Reset Camera View"
              >
                <Rotate3d className="h-3 w-3 text-cyan-400" />
                <span className="hidden sm:inline">Reset View</span>
              </button>
              <div className="text-[10px] px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                {currentSign.hindi ? `${currentSign.hindi} (${currentSign.category})` : currentSign.category}
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {modelLoading && (
            <div className="absolute inset-0 z-30 bg-slate-950/80 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
              <div className="h-8 w-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-indigo-300 font-medium">Rigging 3D Avatar Bones...</p>
            </div>
          )}

          {/* Three.js 3D WebGL Canvas Container */}
          <div 
            ref={mountRef} 
            className={cn(
              "w-full h-full min-h-[340px] cursor-grab active:cursor-grabbing transition-opacity duration-300",
              renderMode === 'video' ? 'hidden' : 'block'
            )}
          />

          {/* Mode: Dual PIP Reference Video */}
          {renderMode === 'dual' && (
            <div className="absolute bottom-16 right-3 z-20 w-32 h-24 bg-slate-900/90 rounded-xl border border-cyan-500/40 overflow-hidden shadow-2xl animate-fadeIn pointer-events-auto">
              <img
                key={currentSign.videoUrl}
                src={currentSign.videoUrl || 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif'}
                alt={`ISL Sign for ${currentSign.label}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 left-1 bg-slate-950/80 px-1.5 py-0.5 rounded text-[8px] font-mono text-cyan-300">
                Video PIP
              </div>
            </div>
          )}

          {/* Mode: Video Only Stage */}
          {renderMode === 'video' && (
            <div className="relative w-full h-full min-h-[340px] flex flex-col items-center justify-center p-3 animate-fadeIn">
              <img
                key={currentSign.videoUrl}
                src={currentSign.videoUrl || 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif'}
                alt={`ISL Sign for ${currentSign.label}`}
                className="w-full h-full max-h-[300px] object-contain rounded-2xl shadow-xl border-2 border-cyan-500/40"
              />
              <div className="mt-2 flex items-center gap-3">
                <span className="text-sm text-cyan-300 font-semibold">
                  {currentSign.handShape || 'ISL Standard Gesture'}
                </span>
              </div>
            </div>
          )}

          {/* Active Gloss & Subtitle Instruction Bar */}
          <div className="absolute bottom-2 inset-x-2 sm:inset-x-3 z-20 bg-slate-950/85 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-center shadow-lg">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-white tracking-wide font-mono bg-indigo-600/30 px-2 py-0.5 rounded-md border border-indigo-500/40">
                [{currentSign.gloss || currentSign.keyword.toUpperCase()}]
              </span>
              <span className="text-xs text-indigo-300">
                • {currentSign.label} {currentSign.hindi && `(${currentSign.hindi})`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              {currentSign.description}
            </p>
          </div>

        </div>

        {/* Controls & Sequence Queue (React Bits Micro-Interactions) */}
        <div className="w-full md:w-60 flex flex-col justify-between gap-3">
          
          {/* Active Sequence Chips */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex-1 flex flex-col">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Sentence Glosses</span>
              <Sparkles className="h-3 w-3 text-indigo-400" />
            </div>

            <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-36 pr-1">
              {activeSequence.map((item, idx) => (
                <span
                  key={`${item.keyword}-${idx}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-all border",
                    idx === currentIndex
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30"
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
              
              {/* Prev */}
              <MagneticButton
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                title="Previous Gloss"
              >
                <ChevronLeft className="h-4 w-4" />
              </MagneticButton>

              {/* Play / Pause */}
              <ShinyButton
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-indigo-600 text-white flex-1 font-medium py-1.5"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </ShinyButton>

              {/* Replay */}
              <MagneticButton
                onClick={() => { setCurrentIndex(0); setIsPlaying(true); }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Repeat (Replay from start)"
              >
                <RotateCcw className="h-4 w-4" />
              </MagneticButton>

              {/* Next */}
              <MagneticButton
                onClick={() => setCurrentIndex(prev => Math.min(activeSequence.length - 1, prev + 1))}
                disabled={currentIndex >= activeSequence.length - 1}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
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
                      "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer",
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
            <span>Select any sign to trigger 3D Avatar posture:</span>
            <span className="text-[10px] text-indigo-400 font-mono">
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
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30"
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
