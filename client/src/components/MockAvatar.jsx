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
  CheckCircle2
} from 'lucide-react';
import { 
  AVATAR_VOCABULARY, 
  parseTextToSignGlosses, 
  preloadAvatarAssets 
} from '../lib/avatarAssets';
import { extractISLKeywords } from '../lib/smolLM';
import { MagneticButton, ShinyButton } from './ui/react-bits-micro';
import { cn } from '../lib/utils';

export function MockAvatar({ 
  signLanguageMode = 'ISL',
  transcribedText, 
  repeatTrigger, 
  onSignRecognized 
}) {
  const [renderMode, setRenderMode] = useState('dual'); // 'dual' | '3d' | 'video'
  const [activeSequence, setActiveSequence] = useState([
    { keyword: 'hello', ...AVATAR_VOCABULARY.hello }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(2400); // 2.4s per sign
  const [glossProgress, setGlossProgress] = useState(0);
  const [isNlpParsing, setIsNlpParsing] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [modelType, setModelType] = useState('Procedural Armature'); // 'Procedural Armature' | 'Verity 3D (.glb)'
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState(null);

  // Three.js Canvas & Scene References
  const mountRef = useRef(null);
  const threeStateRef = useRef(null);
  const currentSignRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastProcessedTextRef = useRef('');

  // Central bone animation dispatcher (Fixes Task 2: 3D Avatar Voice Control)
  const executeSignPose = useCallback((sign) => {
    if (!sign) return;
    currentSignRef.current = sign;

    if (!threeStateRef.current) return;

    const pose = sign.bonePose || {};
    const rShoulder = pose.rightShoulder || pose.rightArm || [0.9, -0.2, 0.5];
    const rElbow = pose.rightElbow || [0, -0.6, 0.4];
    const lShoulder = pose.leftShoulder || pose.leftArm || [-0.2, 0, 0];
    const lElbow = pose.leftElbow || [0, 0, 0];
    const headRot = pose.head || [0.1, 0, 0];

    threeStateRef.current.targetRightRot = rShoulder;
    threeStateRef.current.targetRightElbowRot = rElbow;
    threeStateRef.current.targetLeftRot = lShoulder;
    threeStateRef.current.targetLeftElbowRot = lElbow;
    threeStateRef.current.targetHeadRot = headRot;

    console.log(`[MockAvatar] 3D Animation executed for gloss "${sign.gloss || sign.keyword}":`, { rShoulder, rElbow });
  }, []);

  // Parse speech or input into ISL/ASL Gloss Sequence (Task 2)
  useEffect(() => {
    if (!transcribedText || !transcribedText.trim()) return;
    const cleanText = transcribedText.trim();

    let isMounted = true;
    setIsNlpParsing(true);

    const parseSequence = async () => {
      // 1. Instant fallback parse using ISL SOV grammar rules for zero-delay response
      const immediateGlosses = parseTextToSignGlosses(cleanText);
      if (isMounted && immediateGlosses.length > 0) {
        console.log(`[MockAvatar] Voice input received "${cleanText}", triggering 3D avatar animation:`, immediateGlosses.map(g => g.gloss));
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

  // Initialize Three.js WebGL Scene with OrbitControls and GLTF Support
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 260;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a13);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.3, 3.4);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
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
    controls.minDistance = 1.2;
    controls.maxDistance = 6.0;
    controls.target.set(0, 1.1, 0);
    controls.update();

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x6366f1, 3.0);
    keyLight.position.set(3, 5, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 2.0);
    fillLight.position.set(-3, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa855f7, 2.5, 12);
    rimLight.position.set(0, 3.5, -2);
    scene.add(rimLight);

    // Ground Grid & Glow Circle
    const grid = new THREE.GridHelper(6, 12, 0x1e1b4b, 0x0f172a);
    grid.position.y = 0;
    scene.add(grid);

    const discGeo = new THREE.CircleGeometry(1.2, 32);
    const discMat = new THREE.MeshBasicMaterial({ 
      color: 0x312e81, 
      transparent: true, 
      opacity: 0.25, 
      side: THREE.DoubleSide 
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.01;
    scene.add(disc);

    // 5. Default Procedural Humanoid Armature (Bone Rigging System from ISL Repos)
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, 0, 0);

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.27, 0.85, 16);
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

    // Cyber Visor
    const visorGeo = new THREE.BoxGeometry(0.28, 0.08, 0.2);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.5, 0.16);
    avatarGroup.add(visor);

    // Right Arm Hierarchy
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

    // Store state in ref
    const initPose = (activeSequence && activeSequence[0]) ? activeSequence[0] : AVATAR_VOCABULARY.hello;
    const initB = initPose.bonePose || {};
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
      customBones: {},
      targetRightRot: initB.rightShoulder || [0.9, -0.2, 0.5],
      targetRightElbowRot: initB.rightElbow || [0, -0.6, 0.4],
      targetLeftRot: initB.leftShoulder || [-0.2, 0, 0],
      targetLeftElbowRot: initB.leftElbow || [0, 0, 0],
      targetHeadRot: initB.head || [0.1, 0, 0]
    };
    executeSignPose(initPose);

    // 6. Try to automatically load local Verity 3D model if present in /models/verity.glb
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/verity.glb',
      (gltf) => {
        console.log('[MockAvatar] Successfully loaded Verity .glb model:', gltf);
        loadCustomGLTF(gltf, 'Verity 3D (Local)');
      },
      undefined,
      (err) => {
        // Expected if user hasn't downloaded Verity file yet; procedural armature is ready
        console.log('[MockAvatar] Default Verity model not placed yet in /models/verity.glb; using procedural armature.');
      }
    );

    // 7. Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (threeStateRef.current) {
        const { 
          controls, 
          renderer, 
          scene, 
          camera, 
          mixer,
          torso, 
          head, 
          rightShoulder, 
          rightElbow,
          leftShoulder, 
          leftElbow,
          customBones = {},
          targetRightRot = [0.9, -0.2, 0.5], 
          targetRightElbowRot = [0, -0.6, 0.4],
          targetLeftRot = [-0.2, 0, 0], 
          targetLeftElbowRot = [0, 0, 0],
          targetHeadRot = [0.1, 0, 0] 
        } = threeStateRef.current;

        // Update OrbitControls
        controls.update();

        // Update AnimationMixer if custom model has animation clips
        if (mixer) {
          mixer.update(delta);
        }

        // Apply breathing idle motion
        torso.scale.y = 1 + Math.sin(time * 2) * 0.015;
        torso.scale.x = 1 + Math.sin(time * 2) * 0.015;

        // Dynamic ISL signing cycle oscillations (Task 2)
        const activeSign = currentSignRef.current;
        const activeCycle = activeSign?.cycle;

        let rRotX = targetRightRot[0];
        let rRotY = targetRightRot[1];
        let rRotZ = targetRightRot[2];
        let rElbX = targetRightElbowRot[0];
        let rElbY = targetRightElbowRot[1];
        let rElbZ = targetRightElbowRot[2];

        let lRotX = targetLeftRot[0];
        let lRotY = targetLeftRot[1];
        let lRotZ = targetLeftRot[2];
        let lElbX = targetLeftElbowRot[0];
        let lElbY = targetLeftElbowRot[1];
        let lElbZ = targetLeftElbowRot[2];

        let hRotX = targetHeadRot[0];
        let hRotY = targetHeadRot[1];

        if (activeCycle) {
          const osc = Math.sin(time * (activeCycle.freq || 4.0)) * (activeCycle.amp || 0.25);
          if (activeCycle.joint === 'rightShoulder' || activeCycle.joint === 'both' || activeCycle.joint === 'rightArm') {
            if (activeCycle.axis === 'x') rRotX += osc;
            else if (activeCycle.axis === 'y') rRotY += osc;
            else if (activeCycle.axis === 'z') rRotZ += osc;
          }
          if (activeCycle.joint === 'leftShoulder' || activeCycle.joint === 'both' || activeCycle.joint === 'leftArm') {
            if (activeCycle.axis === 'x') lRotX += osc;
            else if (activeCycle.axis === 'y') lRotY -= osc;
            else if (activeCycle.axis === 'z') lRotZ -= osc;
          }
          if (activeCycle.joint === 'head') {
            if (activeCycle.axis === 'x') hRotX += osc;
            else if (activeCycle.axis === 'y') hRotY += osc;
          }

          if (activeCycle.secondary) {
            const secOsc = Math.sin(time * (activeCycle.secondary.freq || 4.0)) * (activeCycle.secondary.amp || 0.2);
            rElbX += secOsc;
          }
        }

        // Apply smooth interpolation towards posture + signing cycles
        rightShoulder.rotation.x = THREE.MathUtils.lerp(rightShoulder.rotation.x, rRotX, 0.12);
        rightShoulder.rotation.y = THREE.MathUtils.lerp(rightShoulder.rotation.y, rRotY, 0.12);
        rightShoulder.rotation.z = THREE.MathUtils.lerp(rightShoulder.rotation.z, rRotZ, 0.12);

        if (rightElbow) {
          rightElbow.rotation.x = THREE.MathUtils.lerp(rightElbow.rotation.x, rElbX, 0.12);
          rightElbow.rotation.y = THREE.MathUtils.lerp(rightElbow.rotation.y, rElbY, 0.12);
          rightElbow.rotation.z = THREE.MathUtils.lerp(rightElbow.rotation.z, rElbZ, 0.12);
        }

        leftShoulder.rotation.x = THREE.MathUtils.lerp(leftShoulder.rotation.x, lRotX, 0.12);
        leftShoulder.rotation.y = THREE.MathUtils.lerp(leftShoulder.rotation.y, lRotY, 0.12);
        leftShoulder.rotation.z = THREE.MathUtils.lerp(leftShoulder.rotation.z, lRotZ, 0.12);

        if (leftElbow) {
          leftElbow.rotation.x = THREE.MathUtils.lerp(leftElbow.rotation.x, lElbX, 0.12);
          leftElbow.rotation.y = THREE.MathUtils.lerp(leftElbow.rotation.y, lElbY, 0.12);
          leftElbow.rotation.z = THREE.MathUtils.lerp(leftElbow.rotation.z, lElbZ, 0.12);
        }

        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, hRotX, 0.12);
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, hRotY, 0.12);

        // If custom bones exist (e.g. from Verity model)
        if (customBones.rightArm) {
          customBones.rightArm.rotation.x = THREE.MathUtils.lerp(customBones.rightArm.rotation.x, rRotX, 0.12);
          customBones.rightArm.rotation.y = THREE.MathUtils.lerp(customBones.rightArm.rotation.y, rRotY, 0.12);
          customBones.rightArm.rotation.z = THREE.MathUtils.lerp(customBones.rightArm.rotation.z, rRotZ, 0.12);
        }
        if (customBones.rightForearm && rightElbow) {
          customBones.rightForearm.rotation.x = THREE.MathUtils.lerp(customBones.rightForearm.rotation.x, rElbX, 0.12);
        }
        if (customBones.leftArm) {
          customBones.leftArm.rotation.x = THREE.MathUtils.lerp(customBones.leftArm.rotation.x, lRotX, 0.12);
          customBones.leftArm.rotation.y = THREE.MathUtils.lerp(customBones.leftArm.rotation.y, lRotY, 0.12);
          customBones.leftArm.rotation.z = THREE.MathUtils.lerp(customBones.leftArm.rotation.z, lRotZ, 0.12);
        }
        if (customBones.leftForearm && leftElbow) {
          customBones.leftForearm.rotation.x = THREE.MathUtils.lerp(customBones.leftForearm.rotation.x, lElbX, 0.12);
        }
        if (customBones.head) {
          customBones.head.rotation.x = THREE.MathUtils.lerp(customBones.head.rotation.x, hRotX, 0.12);
          customBones.head.rotation.y = THREE.MathUtils.lerp(customBones.head.rotation.y, hRotY, 0.12);
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

  // Helper to load any custom GLTF/GLB model (e.g. Verity model https://skfb.ly/pLRPF)
  const loadCustomGLTF = (gltf, label = 'Verity 3D Model') => {
    if (!threeStateRef.current) return;
    const { scene, avatarGroup } = threeStateRef.current;

    // Hide procedural model
    avatarGroup.visible = false;

    // Remove previous custom model if any
    if (threeStateRef.current.customModel) {
      scene.remove(threeStateRef.current.customModel);
    }

    const model = gltf.scene || gltf.scenes[0];
    model.position.set(0, 0, 0);

    // Compute bounding box to scale properly
    const bbox = new THREE.Box3().setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 2.0 / maxDim;
      model.scale.set(scale, scale, scale);
    }

    // Traverse for bones and meshes
    const bones = {};
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.isBone) {
        const name = child.name.toLowerCase();
        if (name.includes('right') && (name.includes('arm') || name.includes('shoulder'))) {
          bones.rightArm = child;
        } else if (name.includes('left') && (name.includes('arm') || name.includes('shoulder'))) {
          bones.leftArm = child;
        } else if (name.includes('head') || name.includes('neck')) {
          bones.head = child;
        }
      }
    });

    scene.add(model);
    threeStateRef.current.customModel = model;
    threeStateRef.current.customBones = bones;

    // Handle GLTF animation clips if present
    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
      threeStateRef.current.mixer = mixer;
    }

    setModelType(label);
    setModelLoading(false);
    console.log(`[MockAvatar] Active model switched to: ${label}`);
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
          loadCustomGLTF(gltf, file.name.replace(/\.[^/.]+$/, ''));
        },
        (err) => {
          console.error('[MockAvatar] Error parsing GLTF:', err);
          setModelError('Failed to parse 3D file. Ensure it is a valid .glb / .gltf file.');
          setModelLoading(false);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  };

  // Reset Camera View in OrbitControls
  const handleResetCamera = () => {
    if (threeStateRef.current && threeStateRef.current.controls) {
      threeStateRef.current.camera.position.set(0, 1.3, 3.4);
      threeStateRef.current.controls.target.set(0, 1.1, 0);
      threeStateRef.current.controls.update();
    }
  };

  // Update 3D Target Pose and cache reference when currentSign changes
  useEffect(() => {
    if (currentSign) {
      executeSignPose(currentSign);
    }
  }, [currentSign, executeSignPose]);

  // Synchronized progress countdown for active sign gloss (Task 2)
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
    }, 40);

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
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 p-4 transition-all">
      
      {/* Component Header with 3D / Dual / Video Switcher */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 font-heading">
            {signLanguageMode === 'ISL' ? '3D ISL Avatar System (🇮🇳)' : '3D ASL Avatar System (🇺🇸)'}
          </span>
          {isNlpParsing ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse font-mono flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              SmolLM2 Parsing...
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
              {modelType}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher: Dual Hybrid vs 3D WebGL vs Video Clip */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setRenderMode('dual')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer",
                renderMode === 'dual'
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
              title="Dual Mode: 3D Model + Verified ISL Clip Inset"
            >
              <Layers className="h-3 w-3 text-cyan-300" />
              <span>Dual Hybrid</span>
            </button>
            <button
              onClick={() => setRenderMode('3d')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer",
                renderMode === '3d'
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Box className="h-3 w-3" />
              <span>3D Model</span>
            </button>
            <button
              onClick={() => setRenderMode('video')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer",
                renderMode === 'video'
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Video className="h-3 w-3" />
              <span>Sign Clip</span>
            </button>
          </div>

          {/* Model Upload Button for Verity .glb */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-xs flex items-center gap-1 cursor-pointer"
            title="Load Verity or custom .glb model (https://skfb.ly/pLRPF)"
          >
            <Upload className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline">Load .GLB</span>
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
        <div className="relative flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden min-h-[260px]">
          
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
              <div className="bg-slate-900/80 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg text-[10px] text-cyan-300 font-medium">
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
            <div className="absolute inset-0 z-30 bg-slate-950/80 flex flex-col items-center justify-center gap-2">
              <div className="h-8 w-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-indigo-300 font-medium">Loading 3D Model...</p>
            </div>
          )}

          {/* 3D WebGL Canvas (Active in '3d' and 'dual' modes) */}
          <div 
            ref={mountRef} 
            className={cn(
              "w-full h-full min-h-[260px] transition-opacity duration-300 flex items-center justify-center cursor-grab active:cursor-grabbing",
              renderMode !== 'video' ? 'opacity-100' : 'hidden'
            )}
          />

          {/* Dual Mode: Picture-in-Picture Floating Sign Demo Inset */}
          {renderMode === 'dual' && currentSign.videoUrl && (
            <div className="absolute bottom-16 right-2 sm:right-3 z-20 w-28 sm:w-36 md:w-40 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-indigo-500/40 p-1.5 sm:p-2 shadow-2xl flex flex-col items-center animate-fadeIn pointer-events-auto">
              <div className="flex items-center justify-between w-full pb-1 mb-1 border-b border-slate-800 text-[10px]">
                <span className="font-semibold text-cyan-300 text-[9px] sm:text-[10px]">ISL Sign Demo</span>
                <span className="text-[9px] font-mono text-emerald-400">HD GIF</span>
              </div>
              <div className="w-full h-16 sm:h-20 md:h-24 overflow-hidden rounded-xl bg-black flex items-center justify-center">
                <img
                  key={currentSign.videoUrl}
                  src={currentSign.videoUrl}
                  alt={`ISL Sign for ${currentSign.label}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[9px] text-slate-400 mt-1 truncate w-full text-center font-mono">
                [{currentSign.gloss}] {currentSign.hindi || ''}
              </div>
            </div>
          )}

          {/* Mode: Video Only Stage */}
          {renderMode === 'video' && (
            <div className="relative w-56 sm:w-64 h-56 sm:h-64 flex flex-col items-center justify-center p-3 animate-fadeIn">
              <img
                key={currentSign.videoUrl}
                src={currentSign.videoUrl || 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif'}
                alt={`ISL Sign for ${currentSign.label}`}
                className="w-full h-full object-contain rounded-2xl shadow-xl border border-cyan-500/30"
              />
              <div className="mt-2 text-xs text-cyan-300 font-semibold">
                {currentSign.handShape || 'ISL Standard Gesture'}
              </div>
            </div>
          )}

          {/* Active Gloss & Subtitle Instruction */}
          <div className="absolute bottom-2 inset-x-2 sm:inset-x-3 z-20 bg-slate-950/85 backdrop-blur-md p-1.5 sm:p-2 rounded-xl border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-white tracking-wide font-mono">
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
              
              {/* Prev */}
              <MagneticButton
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Previous Gloss"
              >
                <ChevronLeft className="h-4 w-4" />
              </MagneticButton>

              {/* Play / Pause */}
              <ShinyButton
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-indigo-600 text-white flex-1"
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
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer",
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
