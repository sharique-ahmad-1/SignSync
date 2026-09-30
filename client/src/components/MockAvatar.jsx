import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
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
  Activity,
  Hand
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
 * Traverses any Rigged Hand 3D model scene and extracts standard hand & finger bones (FBX, Mixamo, GLTF)
 */
function extractHandSkeletonBones(root) {
  const bones = {
    right: { wrist: null, thumb: [], index: [], middle: [], ring: [], pinky: [] },
    left: { wrist: null, thumb: [], index: [], middle: [], ring: [], pinky: [] }
  };

  root.traverse((node) => {
    if (!node.isBone && node.type !== 'Bone' && node.type !== 'JOINT' && !node.name.toLowerCase().includes('hand') && !node.name.toLowerCase().includes('finger') && !node.name.toLowerCase().includes('thumb') && !node.name.toLowerCase().includes('index')) return;
    const name = (node.name || '').toLowerCase();

    // Right Hand vs Left Hand Bone Extraction
    const isLeft = name.includes('_l') || name.includes('.l') || name.includes('left') || name.includes('lhand');
    const isRight = !isLeft || name.includes('_r') || name.includes('.r') || name.includes('right') || name.includes('rhand');
    const target = (isLeft && !isRight) ? bones.left : bones.right;

    if (name.includes('wrist') || name.includes('righthand') || name.includes('lefthand') || name.endsWith('hand') || name.includes('hand_')) {
      if (!target.wrist) target.wrist = node;
    }
    
    if (name.includes('thumb')) {
      target.thumb.push(node);
    } else if (name.includes('index')) {
      target.index.push(node);
    } else if (name.includes('mid') || name.includes('middle')) {
      target.middle.push(node);
    } else if (name.includes('ring')) {
      target.ring.push(node);
    } else if (name.includes('pinky') || name.includes('little')) {
      target.pinky.push(node);
    }
  });

  // Sort finger bones by hierarchy/index (e.g., RightHandIndex1, RightHandIndex2, RightHandIndex3)
  const sortBones = (arr) => arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  ['right', 'left'].forEach(side => {
    sortBones(bones[side].thumb);
    sortBones(bones[side].index);
    sortBones(bones[side].middle);
    sortBones(bones[side].ring);
    sortBones(bones[side].pinky);
  });

  return bones;
}

/**
 * Builds an anatomical, fully rigged 3D Procedural Hand with 15 articulated joints per hand
 */
function createProceduralRiggedHand(side = 'right') {
  const isRight = side === 'right';
  const group = new THREE.Group();
  group.name = `${side}_hand_root`;

  const skinMat = new THREE.MeshStandardMaterial({
    color: isRight ? 0x6366f1 : 0x06b6d4,
    roughness: 0.35,
    metalness: 0.25,
    emissive: isRight ? 0x312e81 : 0x0e7490,
    emissiveIntensity: 0.35
  });

  const jointMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.2,
    metalness: 0.8,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.5
  });

  // Wrist & Palm base
  const palmGeo = new THREE.BoxGeometry(0.55, 0.65, 0.16);
  const palmMesh = new THREE.Mesh(palmGeo, skinMat);
  palmMesh.castShadow = true;
  palmMesh.receiveShadow = true;
  group.add(palmMesh);

  // Forearm stump
  const forearmGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.6, 16);
  const forearmMesh = new THREE.Mesh(forearmGeo, skinMat);
  forearmMesh.position.y = -0.55;
  forearmMesh.castShadow = true;
  group.add(forearmMesh);

  // Mapped bone references holder
  const bones = {
    wrist: group,
    thumb: [],
    index: [],
    middle: [],
    ring: [],
    pinky: []
  };

  // Helper to build 3-phalanx articulated finger
  const buildFinger = (fingerKey, xOffset, yOffset, length, angle = 0) => {
    const phalanxLen = length / 3;
    let parent = group;
    const chain = [];

    // Joint 1 (Knuckle)
    const j1 = new THREE.Group();
    j1.position.set(xOffset, yOffset, 0);
    j1.rotation.z = angle;
    parent.add(j1);
    chain.push(j1);

    const j1Mesh = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), jointMat);
    j1.add(j1Mesh);

    const bone1Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, phalanxLen, 12), skinMat);
    bone1Mesh.position.y = phalanxLen / 2;
    j1.add(bone1Mesh);

    // Joint 2 (Middle)
    const j2 = new THREE.Group();
    j2.position.set(0, phalanxLen, 0);
    j1.add(j2);
    chain.push(j2);

    const j2Mesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), jointMat);
    j2.add(j2Mesh);

    const bone2Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, phalanxLen * 0.85, 12), skinMat);
    bone2Mesh.position.y = (phalanxLen * 0.85) / 2;
    j2.add(bone2Mesh);

    // Joint 3 (Distal / Tip)
    const j3 = new THREE.Group();
    j3.position.set(0, phalanxLen * 0.85, 0);
    j2.add(j3);
    chain.push(j3);

    const j3Mesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), jointMat);
    j3.add(j3Mesh);

    const bone3Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, phalanxLen * 0.7, 12), skinMat);
    bone3Mesh.position.y = (phalanxLen * 0.7) / 2;
    j3.add(bone3Mesh);

    bones[fingerKey] = chain;
  };

  // Build all 5 fingers
  const dir = isRight ? 1 : -1;
  // Thumb
  buildFinger('thumb', dir * 0.28, -0.05, 0.42, dir * -0.45);
  // Index
  buildFinger('index', dir * 0.18, 0.32, 0.48, dir * -0.05);
  // Middle
  buildFinger('middle', dir * 0.06, 0.34, 0.52, 0);
  // Ring
  buildFinger('ring', dir * -0.06, 0.32, 0.46, dir * 0.05);
  // Pinky
  buildFinger('pinky', dir * -0.18, 0.28, 0.38, dir * 0.12);

  return { group, bones };
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
  const [modelType, setModelType] = useState('Rigged 3D Hands');
  const [modelLoading, setModelLoading] = useState(false);
  const [mappedBoneCount, setMappedBoneCount] = useState(30);

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

  // Parse speech or text into ISL/ASL Gloss Sequence (Task 1 Voice-to-3D-Hand Re-link)
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

  // Initialize Three.js WebGL Scene with 3D Rigged Hands (Task 1 & Task 2)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 340;

    // 1. Scene & Perspective Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a13);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 3.2);

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
    controls.maxPolarAngle = Math.PI / 2 + 0.3;
    controls.minDistance = 1.0;
    controls.maxDistance = 5.0;
    controls.target.set(0, 0, 0);
    controls.update();

    // 4. Lighting Rig (Cyberpunk Studio Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x818cf8, 3.5);
    keyLight.position.set(2, 3, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 2.5);
    fillLight.position.set(-2, 1.5, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xc084fc, 3.0, 10);
    rimLight.position.set(0, 2, -2);
    scene.add(rimLight);

    // Grid Floor
    const grid = new THREE.GridHelper(6, 12, 0x312e81, 0x0f172a);
    grid.position.y = -1.2;
    scene.add(grid);

    // 5. Instantiate Both 3D Rigged Hands (Right & Left)
    const handsRoot = new THREE.Group();
    handsRoot.position.set(0, 0, 0);

    const rightHandData = createProceduralRiggedHand('right');
    rightHandData.group.position.set(0.65, 0, 0);
    handsRoot.add(rightHandData.group);

    const leftHandData = createProceduralRiggedHand('left');
    leftHandData.group.position.set(-0.65, 0, 0);
    handsRoot.add(leftHandData.group);

    scene.add(handsRoot);

    // Store state in ref
    threeStateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      handsRoot,
      rightHand: rightHandData,
      leftHand: leftHandData,
      externalModel: null,
      activeSign: (activeSequence && activeSequence[0]) ? activeSequence[0] : AVATAR_VOCABULARY.hello
    };

    // 6. Production Model Loader for Rigged Hand.fbx / Rigged Hand.dae (Task 1)
    const loadRiggedHandFile = () => {
      const fbxLoader = new FBXLoader();
      const colladaLoader = new ColladaLoader();

      // Load Rigged Hand FBX from public models
      fbxLoader.load(
        '/models/Rigged Hand.fbx',
        (fbx) => {
          console.log('[MockAvatar] Successfully loaded Rigged Hand FBX:', fbx);
          fbx.position.set(0, -0.4, 0);
          fbx.scale.set(0.008, 0.008, 0.008);

          fbx.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          const extractedBones = extractHandSkeletonBones(fbx);
          const totalFound = (extractedBones.right.index.length + extractedBones.right.thumb.length + extractedBones.left.index.length + extractedBones.left.thumb.length);
          if (totalFound > 0) {
            console.log('[MockAvatar] Extracted Rigged Hand FBX bones:', extractedBones);
            setModelType('Rigged Hand.fbx (3D Model)');
            setMappedBoneCount(Math.max(totalFound * 3, 30));
            scene.add(fbx);
            if (threeStateRef.current) {
              threeStateRef.current.externalModel = fbx;
              threeStateRef.current.externalBones = extractedBones;
            }
          }
        },
        undefined,
        (fbxErr) => {
          console.log('[MockAvatar] Loading Rigged Hand DAE fallback:', fbxErr);
          colladaLoader.load(
            '/models/Rigged Hand.dae',
            (collada) => {
              console.log('[MockAvatar] Successfully loaded Rigged Hand DAE:', collada);
              const model = collada.scene;
              model.position.set(0, -0.4, 0);
              model.scale.set(0.08, 0.08, 0.08);

              model.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });

              const extractedBones = extractHandSkeletonBones(model);
              if (extractedBones.right.thumb.length > 0 || extractedBones.left.thumb.length > 0) {
                console.log('[MockAvatar] Extracted Rigged Hand skeleton bones:', extractedBones);
                setModelType('Rigged Hand.dae (3D Model)');
                setMappedBoneCount(30);
                scene.add(model);
                if (threeStateRef.current) {
                  threeStateRef.current.externalModel = model;
                  threeStateRef.current.externalBones = extractedBones;
                }
              }
            },
            undefined,
            (err) => {
              console.log('[MockAvatar] Running with high-performance 3D Rigged Hands Engine.');
              setModelType('3D Rigged Hands (ISL/ASL)');
            }
          );
        }
      );
    };

    loadRiggedHandFile();

    // 7. Core 3D Hands Animation Loop (Task 2: ISL/ASL Bone Rotations & Articulations)
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      if (threeStateRef.current) {
        const state = threeStateRef.current;
        const { controls, renderer, scene, camera, rightHand, leftHand, externalBones } = state;

        controls.update();

        const activeSign = state.activeSign || currentSignRef.current || AVATAR_VOCABULARY.hello;
        const glossKey = (activeSign.gloss || activeSign.keyword || '').toUpperCase();

        // Target Wrist Poses & Finger Curls (0.0 = fully extended / open palm, 1.0 = tight fist)
        let rWristPos = [0.65, 0, 0];
        let rWristRot = [0, 0, 0];
        let lWristPos = [-0.65, -0.4, -0.2];
        let lWristRot = [0, 0, 0];

        // Finger curls: [thumb, index, middle, ring, pinky]
        let rCurls = [0.05, 0.05, 0.05, 0.05, 0.05];
        let lCurls = [0.1, 0.1, 0.1, 0.1, 0.1];

        // Idle breathing oscillation on hands
        rWristPos[1] += Math.sin(time * 2.5) * 0.02;
        lWristPos[1] += Math.sin(time * 2.5 + 0.5) * 0.02;

        switch (glossKey) {
          case 'HELLO':
          case 'NAMASTE': {
            // Open flat hand waving side-to-side in respectful greeting
            const wave = Math.sin(time * 6.0) * 0.35;
            rWristPos = [0.45, 0.25, 0.2];
            rWristRot = [0.1, 0.2, wave];
            rCurls = [0.0, 0.0, 0.0, 0.0, 0.0]; // Open Palm (Pataka)
            lWristPos = [-0.65, -0.5, -0.2];
            break;
          }

          case 'HELP':
          case 'SAHAYATA': {
            // Two-handed sign: Right fist with thumb up placed on flat open left palm, lifting together
            const lift = Math.sin(time * 3.5) * 0.15;
            rWristPos = [0.1, 0.15 + lift, 0.3];
            rWristRot = [0.2, -0.2, 0.1];
            rCurls = [0.15, 0.95, 0.95, 0.95, 0.95]; // Fist with upright thumb

            lWristPos = [0.05, -0.05 + lift, 0.25];
            lWristRot = [-0.4, 0.1, 0.0]; // Flat palm facing up
            lCurls = [0.0, 0.0, 0.0, 0.0, 0.0]; // Open support palm
            break;
          }

          case 'YES':
          case 'HAAN': {
            // Closed tight fist nodding affirmatively up and down
            const nod = Math.sin(time * 6.0) * 0.35;
            rWristPos = [0.35, 0.1 + nod * 0.1, 0.2];
            rWristRot = [0.35 + nod, 0.0, 0.0];
            rCurls = [0.95, 1.0, 1.0, 1.0, 1.0]; // Tight fist (Mushti)
            lWristPos = [-0.65, -0.5, -0.2];
            break;
          }

          case 'NO':
          case 'NAHI': {
            // Index & Middle fingers extended in "V", waving side-to-side
            const shake = Math.sin(time * 6.5) * 0.35;
            rWristPos = [0.35, 0.15, 0.2];
            rWristRot = [0.0, shake, 0.0];
            rCurls = [0.85, 0.0, 0.0, 0.95, 0.95]; // Victory / Two-fingers
            lWristPos = [-0.65, -0.5, -0.2];
            break;
          }

          case 'WATER':
          case 'PAANI':
          case 'DRINK': {
            // "W" handshape (Index, Middle, Ring straight, Thumb & Pinky curled) tapping
            const tap = Math.sin(time * 5.5) * 0.15;
            rWristPos = [0.35, 0.2 + tap, 0.25];
            rWristRot = [0.2 + tap, 0.1, 0.0];
            rCurls = [0.95, 0.0, 0.0, 0.0, 0.95]; // W-Hand (Tripataka)
            lWristPos = [-0.65, -0.5, -0.2];
            break;
          }

          case 'FOOD':
          case 'KHANA':
          case 'EAT':
          case 'KHAO': {
            // Bunched fingertips (O-hand) tapping repeatedly
            const tap = Math.sin(time * 5.5) * 0.2;
            rWristPos = [0.35, 0.25 + tap, 0.25];
            rWristRot = [0.35 + tap, 0.0, 0.0];
            rCurls = [0.55, 0.55, 0.55, 0.55, 0.55]; // Bunched fingertips
            lWristPos = [-0.65, -0.5, -0.2];
            break;
          }

          case 'STOP':
          case 'RUKO': {
            // Vertical open palm pushed firmly forward
            rWristPos = [0.4, 0.15, 0.45];
            rWristRot = [-0.55, 0.0, 0.0]; // Wrist flexed back
            rCurls = [0.0, 0.0, 0.0, 0.0, 0.0]; // Open forward palm
            lWristPos = [-0.65, -0.5, -0.2];
            break;
          }

          case 'THANK YOU':
          case 'THANKS':
          case 'DHANYAVAAD': {
            // Flat fingertips sweep forward and outward in gratitude
            const sweep = (Math.sin(time * 3.5) + 1.0) * 0.5; // 0 to 1
            rWristPos = [0.35, 0.25 - sweep * 0.3, 0.3 + sweep * 0.25];
            rWristRot = [0.3 - sweep * 0.4, 0.0, 0.0];
            rCurls = [0.0, 0.0, 0.0, 0.0, 0.0];
            lWristPos = [-0.65, -0.5, -0.2];
            break;
          }

          case 'LOVE':
          case 'PYAR': {
            // ILY sign: Thumb, Index, Pinky extended; Middle & Ring curled
            rWristPos = [0.4, 0.15, 0.25];
            rWristRot = [0.1, 0.2 + Math.sin(time * 4.0) * 0.15, 0.0];
            rCurls = [0.0, 0.0, 1.0, 1.0, 0.0]; // ILY hand
            lWristPos = [-0.65, -0.5, -0.2];
            break;
          }

          case 'FIRE':
          case 'AANG': {
            // Both hands raised, flickering finger waves moving like flames
            const f1 = Math.sin(time * 7.0) * 0.2;
            const f2 = Math.cos(time * 7.0) * 0.2;
            rWristPos = [0.45, 0.2 + f1, 0.2];
            rWristRot = [0.2, 0.1, f1];
            lWristPos = [-0.45, 0.2 + f2, 0.2];
            lWristRot = [0.2, -0.1, -f2];

            rCurls = [
              (Math.sin(time * 8.0) + 1.0) * 0.25,
              (Math.sin(time * 8.0 + 1) + 1.0) * 0.35,
              (Math.sin(time * 8.0 + 2) + 1.0) * 0.35,
              (Math.sin(time * 8.0 + 3) + 1.0) * 0.35,
              (Math.sin(time * 8.0 + 4) + 1.0) * 0.35
            ];
            lCurls = [
              (Math.cos(time * 8.0) + 1.0) * 0.25,
              (Math.cos(time * 8.0 + 1) + 1.0) * 0.35,
              (Math.cos(time * 8.0 + 2) + 1.0) * 0.35,
              (Math.cos(time * 8.0 + 3) + 1.0) * 0.35,
              (Math.cos(time * 8.0 + 4) + 1.0) * 0.35
            ];
            break;
          }

          case 'DOCTOR':
          case 'MEDICINE': {
            // Right index and middle checking pulse on left wrist
            rWristPos = [-0.15, 0.05, 0.3];
            rWristRot = [0.4, 0.2, 0.1];
            rCurls = [0.8, 0.0, 0.0, 0.9, 0.9]; // Two fingers on pulse

            lWristPos = [-0.3, -0.05, 0.2];
            lWristRot = [-0.2, 0.3, 0.0];
            lCurls = [0.1, 0.1, 0.1, 0.1, 0.1];
            break;
          }

          case 'EMERGENCY':
          case 'DANGER': {
            const shake = Math.sin(time * 8.0) * 0.3;
            rWristPos = [0.4, 0.2, 0.3];
            rWristRot = [0.2, 0.0, shake];
            rCurls = [0.95, 0.95, 0.95, 0.95, 0.95];
            lWristPos = [-0.4, 0.2, 0.3];
            lWristRot = [0.2, 0.0, -shake];
            lCurls = [0.95, 0.95, 0.95, 0.95, 0.95];
            break;
          }

          case 'WHERE':
          case 'WHAT': {
            const sh = Math.sin(time * 5.0) * 0.2;
            rWristPos = [0.45, 0.1, 0.25];
            rWristRot = [-0.3, 0.1, sh];
            rCurls = [0.2, 0.2, 0.2, 0.2, 0.2];
            lWristPos = [-0.45, 0.1, 0.25];
            lWristRot = [-0.3, -0.1, -sh];
            lCurls = [0.2, 0.2, 0.2, 0.2, 0.2];
            break;
          }

          default: {
            // Dynamic pose interpolation from vocabulary metadata
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
            rWristPos = [0.5, 0.1, 0.2];
            break;
          }
        }

        // =========================================================================
        // SMOOTH LERP INTERPOLATION ON 3D RIGGED HAND BONES (60 FPS FLUIDITY)
        // =========================================================================
        const lerpFactor = 1.0 - Math.exp(-delta * 14.0); // Fast, responsive, buttery smooth lerp

        // Apply to Procedural Right Hand
        if (rightHand && rightHand.bones) {
          const { wrist, thumb, index, middle, ring, pinky } = rightHand.bones;
          if (wrist) {
            wrist.position.x = THREE.MathUtils.lerp(wrist.position.x, rWristPos[0], lerpFactor);
            wrist.position.y = THREE.MathUtils.lerp(wrist.position.y, rWristPos[1], lerpFactor);
            wrist.position.z = THREE.MathUtils.lerp(wrist.position.z, rWristPos[2], lerpFactor);

            wrist.rotation.x = THREE.MathUtils.lerp(wrist.rotation.x, rWristRot[0], lerpFactor);
            wrist.rotation.y = THREE.MathUtils.lerp(wrist.rotation.y, rWristRot[1], lerpFactor);
            wrist.rotation.z = THREE.MathUtils.lerp(wrist.rotation.z, rWristRot[2], lerpFactor);
          }

          // Articulate Right Finger Phalanges
          const applyCurls = (chain, amount, isThumb = false) => {
            chain.forEach((joint, idx) => {
              if (joint) {
                const angle = (isThumb ? 0.6 : 0.85) * amount;
                joint.rotation.x = THREE.MathUtils.lerp(joint.rotation.x, angle, lerpFactor);
                if (isThumb && idx === 0) {
                  joint.rotation.y = THREE.MathUtils.lerp(joint.rotation.y, amount * 0.4, lerpFactor);
                }
              }
            });
          };

          applyCurls(thumb, rCurls[0], true);
          applyCurls(index, rCurls[1]);
          applyCurls(middle, rCurls[2]);
          applyCurls(ring, rCurls[3]);
          applyCurls(pinky, rCurls[4]);
        }

        // Apply to Procedural Left Hand
        if (leftHand && leftHand.bones) {
          const { wrist, thumb, index, middle, ring, pinky } = leftHand.bones;
          if (wrist) {
            wrist.position.x = THREE.MathUtils.lerp(wrist.position.x, lWristPos[0], lerpFactor);
            wrist.position.y = THREE.MathUtils.lerp(wrist.position.y, lWristPos[1], lerpFactor);
            wrist.position.z = THREE.MathUtils.lerp(wrist.position.z, lWristPos[2], lerpFactor);

            wrist.rotation.x = THREE.MathUtils.lerp(wrist.rotation.x, lWristRot[0], lerpFactor);
            wrist.rotation.y = THREE.MathUtils.lerp(wrist.rotation.y, lWristRot[1], lerpFactor);
            wrist.rotation.z = THREE.MathUtils.lerp(wrist.rotation.z, lWristRot[2], lerpFactor);
          }

          // Articulate Left Finger Phalanges
          const applyLeftCurls = (chain, amount, isThumb = false) => {
            chain.forEach((joint, idx) => {
              if (joint) {
                const angle = (isThumb ? 0.6 : 0.85) * amount;
                joint.rotation.x = THREE.MathUtils.lerp(joint.rotation.x, angle, lerpFactor);
                if (isThumb && idx === 0) {
                  joint.rotation.y = THREE.MathUtils.lerp(joint.rotation.y, -amount * 0.4, lerpFactor);
                }
              }
            });
          };

          applyLeftCurls(thumb, lCurls[0], true);
          applyLeftCurls(index, lCurls[1]);
          applyLeftCurls(middle, lCurls[2]);
          applyLeftCurls(ring, lCurls[3]);
          applyLeftCurls(pinky, lCurls[4]);
        }

        // Apply directly to FBX / Mixamo Skeleton Bones (Task 1 Direct FBX Articulation)
        if (externalBones && externalBones.right) {
          const extRight = externalBones.right;
          if (extRight.wrist) {
            extRight.wrist.rotation.x = THREE.MathUtils.lerp(extRight.wrist.rotation.x, rWristRot[0], lerpFactor);
            extRight.wrist.rotation.y = THREE.MathUtils.lerp(extRight.wrist.rotation.y, rWristRot[1], lerpFactor);
            extRight.wrist.rotation.z = THREE.MathUtils.lerp(extRight.wrist.rotation.z, rWristRot[2], lerpFactor);
          }
          const applyExtCurls = (chain, amount, isThumb = false) => {
            chain.forEach((joint, idx) => {
              if (joint) {
                const angle = (isThumb ? 0.6 : 0.85) * amount;
                joint.rotation.z = THREE.MathUtils.lerp(joint.rotation.z, angle, lerpFactor);
                joint.rotation.x = THREE.MathUtils.lerp(joint.rotation.x, angle * 0.5, lerpFactor);
                if (isThumb && idx === 0) {
                  joint.rotation.y = THREE.MathUtils.lerp(joint.rotation.y, amount * 0.4, lerpFactor);
                }
              }
            });
          };
          applyExtCurls(extRight.thumb, rCurls[0], true);
          applyExtCurls(extRight.index, rCurls[1]);
          applyExtCurls(extRight.middle, rCurls[2]);
          applyExtCurls(extRight.ring, rCurls[3]);
          applyExtCurls(extRight.pinky, rCurls[4]);
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
      threeStateRef.current.camera.position.set(0, 0.2, 3.2);
      threeStateRef.current.controls.target.set(0, 0, 0);
      threeStateRef.current.controls.update();
    }
  };

  // Update Target Pose on currentSign change
  useEffect(() => {
    if (currentSign) {
      executeSignPose(currentSign);
    }
  }, [currentSign, executeSignPose]);

  // Synchronized countdown progress for active sign gloss (Task 2)
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
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 p-3 sm:p-4 transition-all shadow-xl w-full">
      
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
              <Hand className="h-2.5 w-2.5 text-indigo-400" />
              {modelType}
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
              <Hand className="h-3 w-3" />
              <span>3D Hands</span>
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

      {/* Main 3D Hands Stage */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 sm:gap-4 mt-3">
        
        {/* Visual Stage Container (Three.js WebGL 3D Hands Canvas + Dual PIP) */}
        <div className="relative flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[340px] w-full">
          
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

          {/* Three.js 3D WebGL Hands Canvas */}
          <div 
            ref={mountRef} 
            className={cn(
              "w-full h-full min-h-[280px] sm:min-h-[340px] cursor-grab active:cursor-grabbing transition-opacity duration-300",
              renderMode === 'video' ? 'hidden' : 'block'
            )}
          />

          {/* Mode: Dual PIP Reference Video */}
          {renderMode === 'dual' && (
            <div className="absolute bottom-16 right-3 z-20 w-28 sm:w-32 h-20 sm:h-24 bg-slate-900/90 rounded-xl border border-cyan-500/40 overflow-hidden shadow-2xl animate-fadeIn pointer-events-auto">
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
            <div className="relative w-full h-full min-h-[280px] sm:min-h-[340px] flex flex-col items-center justify-center p-3 animate-fadeIn">
              <img
                key={currentSign.videoUrl}
                src={currentSign.videoUrl || 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif'}
                alt={`ISL Sign for ${currentSign.label}`}
                className="w-full h-full max-h-[280px] object-contain rounded-2xl shadow-xl border-2 border-cyan-500/40"
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

        {/* Controls & Sequence Queue */}
        <div className="w-full md:w-60 flex flex-col justify-between gap-3">
          
          {/* Active Sequence Chips */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex-1 flex flex-col">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Sentence Glosses</span>
              <Sparkles className="h-3 w-3 text-indigo-400" />
            </div>

            <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-32 md:max-h-36 pr-1">
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

          {/* Micro-Interaction Controls */}
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
            <span>Select any sign to trigger 3D Hand gesture:</span>
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
