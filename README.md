# 🖐️ SignSync - Real-Time Smart Two-Way Communicator

**Accessibility Hackathon Project**  
*Empowering seamless, bidirectional communication between Deaf and Hearing users in real time.*

---

## 🌟 Overview

**SignSync** bridges the communication barrier between Deaf/Hard-of-Hearing individuals and Hearing individuals through a smart, two-way split-screen interface:
1. **Deaf User Screen (Top Half)**: Real-time webcam feed with **Google MediaPipe Hand Landmarker** (`@mediapipe/tasks-vision`) tracking 21 skeletal hand landmarks in 3D, gesture detection heuristics, and quick response triggers (**Confirm Receipt**, **Repeat**, **Clarify**).
2. **Hearing User Screen (Bottom Half)**: Voice-to-Text powered by the native **Web Speech API** (`window.SpeechRecognition`), audio soundwave visualization, and an interactive **Mock Avatar System** that translates transcribed speech keywords into animated sign language gestures in sequential playback.

---

## 🚀 Key Features Built in Phase 1

### 1. Split-Screen Accessible UI (Tailwind CSS)
- **High-contrast, modern dark mode** design with glassmorphism and accessible color accents (cyan for vision tracking, emerald for audio/confirmation, indigo for speech translation).
- **View Mode Switcher**: Toggle between 50/50 Split View, Deaf Focus Mode, or Hearing Focus Mode.
- **Accessible Visual Alerts**: When the Hearing user speaks, the Deaf user's screen emits an ambient visual vibration/glow, ensuring deaf individuals receive immediate non-auditory notification.

### 2. Google MediaPipe Hand Landmarker (`@mediapipe/tasks-vision`)
- Continuous tracking of **21 hand joints & skeletal bones** per hand rendered on a synchronized HTML5 `<canvas>` overlay.
- Dual GPU/CPU delegate fallback for maximum browser and device compatibility.
- Real-time gesture classification (Open Palm / Wave 👋, Thumbs Up 👍, Victory ✌️, Fist ✊, Pointing ☝️, I Love You 🤟).
- **Simulation Demo Mode**: If a webcam is unavailable or permission is denied during hackathon presentation, a synthetic animated hand tracking simulation is available with one click.

### 3. Native Web Speech Recognition
- Continuous, low-latency voice capture via `SpeechRecognition` / `webkitSpeechRecognition`.
- Real-time interim & final text transcript display.
- One-click copy, clear, and manual keyboard input fallback.

### 4. Mock Avatar Sign Language System
- Automatically parses spoken or typed phrases for sign language vocabulary (e.g., *hello*, *help*, *thank you*, *yes*, *no*, *water*, *please*, *goodbye*, *friend*, *love*).
- Sequentially displays animated ASL visual demonstrations, rich motion descriptions, category badges, and timeline scrubber.
- Variable playback speeds (0.5x, 1.0x, 1.5x) and one-click replay.
- Interactive **Sign Library** drawer to preview all available sign animations anytime.

### 5. Essential Accessibility Action Triggers
- **Confirm Receipt**: Instant positive acknowledgment badge sent from Deaf user to Hearing user.
- **Repeat**: Prompts the Mock Avatar and conversation system to replay the last sign sequence.
- **Clarify**: Signals the Hearing user to rephrase or slow down.
- **Two-Way Conversation Timeline**: Chronological event history tracking all spoken, signed, and action exchanges.

### 6. Node.js Express Backend
- `GET /api/health`: Health status, feature flags, and uptime metrics.
- `GET /api/dictionary`: Dynamic sign vocabulary metadata and animation links.
- `GET /api/messages` & `POST /api/messages`: Real-time conversation message store.
- `POST /api/gemini/interpret`: Multimodal Gemini 1.5 pipeline stub ready for gesture-to-text classification.

---

## 🛠️ Project Structure

```
SupSonic/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── DeafView.jsx               # Webcam + MediaPipe 21 hand landmarks & action buttons
│   │   │   ├── HearingView.jsx            # Web Speech API + live transcript + Avatar embed
│   │   │   ├── MockAvatar.jsx             # Keyword parser + sequential animated sign player
│   │   │   ├── Navbar.jsx                 # Health indicators, layout toggle, system modal
│   │   │   ├── ConversationLog.jsx        # Two-way dialogue history
│   │   │   └── ConnectionStatusModal.jsx  # GitHub, Render & Supabase status breakdown
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                      # Tailwind styling, neon glows & audio flash animations
│   ├── vite.config.js                     # Proxy configured to Express backend
│   └── package.json
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   └── index.js                       # Express API endpoints & stubs
│   ├── .env.example                       # Supabase and Gemini placeholders
│   └── package.json
├── package.json                # Root workspace scripts
└── README.md
```

---

## 🚦 Getting Started

### 1. Start Backend Server
```bash
cd server
npm start
# Server starts on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 2. Start Frontend Client
```bash
cd client
npm run dev
# App starts on http://localhost:5173
```

---

## 🔒 Connected Services & Accounts Status

| Service | Connection Status | Details |
| :--- | :--- | :--- |
| **GitHub** | ✅ **Connected & Authorized** | Connected via MCP tool (`github`) as `sharique-ahmad-1`. Full repo creation, commit, push, and PR permissions active. |
| **Render** | ✅ **Connected & Authorized** | Connected via MCP tool (`render`) to Team Workspace `tea-dasvjbnpn0mc73a9ga4g` (`sharique7463@gmail.com`). Full service creation and deployment permissions active. |
| **Supabase** | ⚡ **Architecture Ready** | Express server is structured and ready for Supabase client integration. Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `server/.env` to persist tables and auth. |
