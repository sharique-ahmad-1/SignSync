# 🖐️ SignSync - Real-Time Smart Two-Way Communicator

**Accessibility Hackathon Project**  
*Empowering seamless, bidirectional communication between Deaf and Hearing users in real time with Offline AI & 3D ISL Avatars.*

---

## 🌟 Overview

**SignSync** is a state-of-the-art accessibility application bridging the communication barrier between Deaf/Hard-of-Hearing individuals and Hearing individuals through an interactive, AI-powered split-screen interface:
1. **Deaf User Screen (Top Half)**: Real-time webcam feed with **Google MediaPipe Hand Landmarker** (`@mediapipe/tasks-vision`) tracking 21 skeletal hand landmarks in 3D, gesture detection heuristics, **Aceternity Glowing Effect** audio flash alerts, **3D Card Effect** action triggers (**Confirm Receipt**, **Repeat**, **Clarify**), and **SmolLM2 Offline NLP** sentence formulation with one-click **Text-to-Speech**.
2. **Hearing User Screen (Bottom Half)**: Voice capture powered by the native **Web Speech API** with **Lottie Radar Pulse**, real-time text transcription animated via **Aceternity Text Generate Effect**, and an interactive **3D Avatar Engine & Gesture Video System** (inspired by Sijosaju, SignFlow, and Sign-Kit) translating transcribed speech into Indian Sign Language (ISL) gloss sequences.

---

## 🚀 Phase 2 Upgrades: UI/UX Polish, Offline AI, & 3D Avatar

### 1. Premium UI/UX (Aceternity UI & Animations)
- **Aurora Background**: Ambient dynamic aurora gradient waves (`[background-image:var(--dark-gradient),var(--aurora)]`) wrapping the entire application layout.
- **Glowing Effect**: Dynamic glowing radiant border & aura around the Deaf user's video container that reacts when the Hearing user speaks (replacing basic CSS borders).
- **3D Card Effect**: Interactive perspective tilt (`perspective: 1000px`, `rotateX`, `rotateY`, `translateZ`) wrapping the core action buttons (**Confirm Receipt**, **Repeat**, and **Clarify**).
- **Text Generate Effect**: Staggered word-by-word blur-to-focus animation for real-time speech transcription.
- **Animated Tabs**: Smooth spring-animated pill indicator (`layoutId="activeTabPill"`) for layout modes (**Split View**, **Deaf Focus**, **Hearing Focus**).
- **React Bits Micro-Interactions**: Physics-based `MagneticButton` and `ShinyButton` controls with spring cursor attraction on the Avatar player.
- **Lottie Animations**: Embedded lightweight Lottie JSON animations for radar listening pulses, AI neural processing, and vision hand tracking.

### 2. Offline NLP Integration (SmolLM2 via Transformers.js)
- Integrated `@xenova/transformers` running **Xenova/SmolLM2-135M-Instruct** directly in the browser via WebAssembly / WebGPU.
- **Smart Sentence Reconstruction**: Raw sign tokens detected from MediaPipe gestures or user signs (e.g., `['Me', 'Hungry', 'Food']`) are formulated into natural, fluent English sentences (e.g., *"I am hungry and would like some food."*).
- **Vocalize Aloud**: Direct integration with the native SpeechSynthesis API (`window.speechSynthesis`) allowing the Deaf user to speak the formulated sentence aloud to the Hearing user.
- **Non-blocking Asynchronous Loading**: Model weights load in the background with live Lottie processing telemetry and instant heuristic grammar fallback.

### 3. ISL 3D Avatar & Gesture Engine (Insights from Top Repositories)
Architectural patterns synthesized from:
- **[Sijosaju/Speech-to-ISL](https://github.com/Sijosaju/Speech-to-Indian-Sign-Language-using-3D-Avatar-Animations)**: English-to-ISL grammar extraction and GLTF 3D animation mapping.
- **[Leander-bai/SignFlow](https://github.com/Leander-bai/SignFlow)**: ISL Gloss conversion, fingerspelling fallback for unknown words, and video sequence orchestration.
- **[spectre900/Sign-Kit](https://github.com/spectre900/Sign-Kit-An-Avatar-based-ISL-Toolkit)**: Three.js WebGL humanoid avatar bone rigging and continuous gesture animation.

**Dual-Mode Avatar System**:
- **Mode 1: 3D WebGL Avatar**: Three.js WebGL canvas rendering a 3D character with animated bone postures (torso, neck, head, shoulders, elbows, hands) interpolated via real-time lerp/slerp loops.
- **Mode 2: HD Gesture Clips**: High-definition animated visual gesture sequences with category tagging and fingerspelling fallback.
- **Asset Utility (`avatarAssets.js`)**: Dynamic gloss parsing, vocabulary dictionary, and asset preloader.

---

## 🛠️ Project Structure

```
SupSonic/
├── client/                                # React (Vite) + Tailwind CSS + Framer Motion
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── aurora-background.jsx  # Aceternity Aurora Background
│   │   │   │   ├── glowing-effect.jsx     # Aceternity Glowing Effect
│   │   │   │   ├── 3d-card.jsx            # Aceternity 3D Card Effect
│   │   │   │   ├── text-generate-effect.jsx # Aceternity Text Generate Effect
│   │   │   │   ├── animated-tabs.jsx      # Aceternity Animated Tabs
│   │   │   │   ├── react-bits-micro.jsx   # React Bits Magnetic & Shiny Buttons
│   │   │   │   └── lottie-display.jsx     # Lottie React Animation Player
│   │   │   ├── DeafView.jsx               # Webcam + MediaPipe + SmolLM2 NLP + 3D Action Cards
│   │   │   ├── HearingView.jsx            # Web Speech + Text Generate Effect + 3D Avatar
│   │   │   ├── MockAvatar.jsx             # Three.js 3D WebGL Avatar & HD Gesture Sequence
│   │   │   ├── Navbar.jsx                 # Animated Tabs, Lottie status badges & modal trigger
│   │   │   ├── ConversationLog.jsx        # Two-way dialogue history
│   │   │   └── ConnectionStatusModal.jsx  # GitHub, Render, Supabase & API status
│   │   ├── lib/
│   │   │   ├── utils.js                   # cn helper (clsx + tailwind-merge)
│   │   │   ├── lottieData.js              # Radar, AI Processing & Vision Lottie JSONs
│   │   │   ├── smolLM.js                  # Transformers.js SmolLM2-135M offline NLP loader
│   │   │   └── avatarAssets.js            # ISL gloss parsing, bone poses & dictionary
│   │   ├── App.jsx                        # Aurora wrapper & bidirectional event bus
│   │   └── index.css                      # Tailwind, Aurora & Glowing Effect styles
│   ├── tailwind.config.js                 # Aurora keyframes & color tokens
│   └── package.json
├── server/                                # Node.js Express Backend
│   ├── src/
│   │   └── index.js                       # Express API endpoints & stubs
│   └── package.json
└── README.md
```

---

## 🚦 Running the Application

### 1. Backend Server
```powershell
cd server
npm start
# API available at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 2. Frontend Application
```powershell
cd client
npm run dev
# App available at http://localhost:5173
```
