# 🖐️ SignSync - Real-Time Smart Two-Way Communicator

**Accessibility Hackathon Project**  
*Empowering seamless, bidirectional communication between Deaf and Hearing users in real time with 3D ISL Avatars, Offline NLP, and Progressive Web App (PWA) mobility.*

---

## 🌟 Overview

**SignSync** is a state-of-the-art accessibility application bridging the communication barrier between Deaf/Hard-of-Hearing individuals and Hearing individuals through an interactive, AI-powered split-screen interface:
1. **Deaf User Screen (Top Half)**: Real-time webcam feed with **Google MediaPipe Hand Landmarker** (`@mediapipe/tasks-vision`) tracking 21 skeletal hand landmarks in 3D, gesture detection heuristics, **Aceternity Glowing Effect** audio flash alerts, **3D Card Effect** action triggers (**Confirm Receipt**, **Repeat**, **Clarify**), and **SmolLM2 Offline NLP** sentence formulation with one-click **Text-to-Speech**.
2. **Hearing User Screen (Bottom Half)**: Voice capture powered by the native **Web Speech API** with **Lottie Radar Pulse**, real-time text transcription animated via **Aceternity Text Generate Effect**, and an interactive **Three.js 3D Avatar Engine & Gesture Video System** (inspired by Sijosaju, SignFlow, and Sign-Kit) translating transcribed speech into Indian Sign Language (ISL) gloss sequences.

---

## 🚀 Phase 3 Upgrades: Bug Fixes, 3D Avatar Engine, Mobile PWA & Premium UI

### 1. Critical Bug Fixes
- **Backend Root Route**: Added default `GET /` route in the Express server returning a JSON status payload, eliminating the `Cannot GET /` error on port 5000.
- **Camera Permissions & Hardware Fallback**: Fixed the **Enable Camera** button with dual-tier constraint handling (1080p/720p ideal with fallback to standard video), automatic permission recovery, and retry controls.
- **Full Button Wiring & Telemetry**: Wired all action triggers (**Confirm Receipt**, **Repeat**, **Clarify**, and **Speak Aloud**) with event propagation through the 3D card hierarchy, toast banner confirmations, audio speech vocalization, and console logging.

### 2. 3D Avatar Integration & Verity Model Pipeline
- **Three.js 3D WebGL Avatar Engine**: Integrated WebGL renderer with OrbitControls (interactive mouse and touch pan/rotate/zoom), three-point studio lighting, and ground reflection grid.
- **Verity Model Loader**: Ready to load and animate the **[Verity 3D Model](https://skfb.ly/pLRPF)** (`.glb` / `.gltf`). Includes an in-app file loader and pre-configured path (`client/public/models/verity.glb`) with automatic bone traversal (`RightArm`, `LeftArm`, `Head`, `Neck`, `Spine`) and AnimationMixer support.
- **ISL Skeletal Animation**: Procedural bone rotation interpolation (`THREE.MathUtils.lerp`) driving humanoid signing gestures in real time based on active sentence glosses.

### 3. Mobile PWA & Responsive Design
- **Mobile First Layout**: Responsive flex and grid hierarchy stacking vertically on phones and tablets with fluid aspect ratios and touch-friendly controls.
- **Progressive Web App (PWA)**: Configured `vite-plugin-pwa` with Workbox offline caching (6MB asset allowance for Three.js & Transformer runtimes), standalone display mode, web manifest, vector icon, and high-res icons (192x192 and 512x512).

---

## 🛠️ Project Structure

```
SupSonic/
├── client/                                # React (Vite) + Tailwind CSS + Framer Motion
│   ├── public/
│   │   ├── models/README.md               # 3D Avatar Verity model instructions
│   │   ├── icon.svg                       # PWA vector logo
│   │   ├── pwa-192x192.png                # PWA 192px icon
│   │   ├── pwa-512x512.png                # PWA 512px icon
│   │   └── apple-touch-icon.png           # iOS touch icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── 3d-card.jsx            # Aceternity 3D Card (Event forwarding enabled)
│   │   │   │   ├── animated-tabs.jsx      # Aceternity Animated Tabs
│   │   │   │   ├── aurora-background.jsx  # Aceternity Aurora Background wrapper
│   │   │   │   ├── glowing-effect.jsx     # Aceternity Glowing Effect
│   │   │   │   ├── lottie-display.jsx     # Lottie React Animation Player
│   │   │   │   ├── react-bits-micro.jsx   # React Bits Magnetic & Shiny Buttons
│   │   │   │   └── text-generate-effect.jsx # Aceternity Text Generate Effect
│   │   │   ├── DeafView.jsx               # Webcam + MediaPipe + SmolLM2 NLP + 3D Action Cards
│   │   │   ├── HearingView.jsx            # Web Speech + Text Generate Effect + 3D Avatar
│   │   │   ├── MockAvatar.jsx             # Three.js 3D WebGL Avatar & Verity Model Loader
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
│   ├── vite.config.js                     # Vite + React + VitePWA (6MB cache limit)
│   └── package.json
├── server/                                # Node.js Express Backend
│   ├── src/
│   │   └── index.js                       # Root GET /, health check, dictionary & messages
│   └── package.json
└── README.md
```

---

## 🚦 Getting Started

### 1. Start Backend Server
```powershell
cd server
npm start
# Server online at http://localhost:5000
# Root status: http://localhost:5000/
# Health check: http://localhost:5000/api/health
```

### 2. Start Frontend Client
```powershell
cd client
npm run dev
# App available at http://localhost:5173
```

### 3. Build & PWA Preview
```powershell
cd client
npm run build
npx vite preview
```
