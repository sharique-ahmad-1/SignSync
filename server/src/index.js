const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root endpoint for status & welcome (Fixes Cannot GET /)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: 'SignSync Accessibility Server',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      dictionary: '/api/dictionary',
      messages: '/api/messages',
      geminiInterpret: '/api/gemini/interpret'
    },
    message: 'Welcome to SignSync API. Real-time two-way smart communicator between Deaf and Hearing users.'
  });
});

// In-memory conversation history store (ready to sync with Supabase)
let conversations = [
  {
    id: 'msg-1',
    sender: 'hearing',
    text: 'Hello! Can you see the avatar signs?',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    recognizedKeywords: ['hello']
  },
  {
    id: 'msg-2',
    sender: 'deaf',
    text: 'Confirm Receipt',
    type: 'action',
    timestamp: new Date(Date.now() - 30000).toISOString()
  }
];

// Rich Sign Language dictionary for Mock Avatar System
const SIGN_DICTIONARY = {
  hello: {
    keyword: 'hello',
    label: 'Hello / Wave',
    description: 'Open hand near temple moves outwards in a gentle salute wave.',
    category: 'Greetings',
    animationType: 'wave',
    svgType: 'hand-wave',
    color: '#3B82F6',
    gifUrl: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif'
  },
  help: {
    keyword: 'help',
    label: 'Help',
    description: 'Closed fist with thumb up resting on flat palm of the other hand, lifted upward together.',
    category: 'Urgent',
    animationType: 'lift',
    svgType: 'hand-help',
    color: '#EF4444',
    gifUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif'
  },
  thank: {
    keyword: 'thank',
    label: 'Thank You',
    description: 'Fingertips of flat hand touch chin and move forward and slightly downward towards the person.',
    category: 'Courtesy',
    animationType: 'chin-forward',
    svgType: 'hand-thank',
    color: '#10B981',
    gifUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif'
  },
  thanks: {
    keyword: 'thanks',
    label: 'Thank You',
    description: 'Fingertips of flat hand touch chin and move forward towards person.',
    category: 'Courtesy',
    animationType: 'chin-forward',
    svgType: 'hand-thank',
    color: '#10B981',
    gifUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif'
  },
  yes: {
    keyword: 'yes',
    label: 'Yes / Affirmative',
    description: 'Fist nods up and down like a head nodding in agreement.',
    category: 'Responses',
    animationType: 'nod',
    svgType: 'fist-nod',
    color: '#22C55E',
    gifUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif'
  },
  no: {
    keyword: 'no',
    label: 'No / Negative',
    description: 'Index and middle fingers snap down onto the thumb repeatedly.',
    category: 'Responses',
    animationType: 'snap',
    svgType: 'finger-snap',
    color: '#F97316',
    gifUrl: 'https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif'
  },
  water: {
    keyword: 'water',
    label: 'Water',
    description: 'Index, middle, and ring fingers form a "W" touching the index finger against the chin twice.',
    category: 'Essentials',
    animationType: 'w-tap',
    svgType: 'w-hand',
    color: '#06B6D4',
    gifUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif'
  },
  please: {
    keyword: 'please',
    label: 'Please',
    description: 'Flat open palm rubbed clockwise in circles on the center of the chest.',
    category: 'Courtesy',
    animationType: 'chest-circle',
    svgType: 'palm-chest',
    color: '#8B5CF6',
    gifUrl: 'https://media.giphy.com/media/3o7TKVfu4rwysCasla/giphy.gif'
  },
  goodbye: {
    keyword: 'goodbye',
    label: 'Goodbye',
    description: 'Open hand opens and closes fingers waving toward the person.',
    category: 'Greetings',
    animationType: 'open-close-wave',
    svgType: 'hand-wave',
    color: '#EC4899',
    gifUrl: 'https://media.giphy.com/media/m9eG1qVjvNINlACQQo/giphy.gif'
  },
  friend: {
    keyword: 'friend',
    label: 'Friend',
    description: 'Interlocking hooked index fingers alternating positions.',
    category: 'Social',
    animationType: 'interlock',
    svgType: 'finger-hook',
    color: '#F59E0B',
    gifUrl: 'https://media.giphy.com/media/26FLdm964upqWP3lu/giphy.gif'
  },
  love: {
    keyword: 'love',
    label: 'I Love You',
    description: 'Thumb, index finger, and pinky finger extended (ASL ILY sign).',
    category: 'Emotion',
    animationType: 'ily-sign',
    svgType: 'ily-hand',
    color: '#F43F5E',
    gifUrl: 'https://media.giphy.com/media/3o6Zt8rGMqVwjYAlsA/giphy.gif'
  }
};

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SignSync Accessibility API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    features: {
      mediaPipeTracking: 'Active on Client',
      webSpeechAPI: 'Active on Client',
      mockAvatarSystem: 'Loaded',
      supabaseReady: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      geminiReady: Boolean(process.env.GEMINI_API_KEY)
    }
  });
});

// 2. Avatar dictionary endpoint
app.get('/api/dictionary', (req, res) => {
  res.json({
    count: Object.keys(SIGN_DICTIONARY).length,
    dictionary: SIGN_DICTIONARY
  });
});

// 3. Conversation messages endpoint (Get recent and post new)
app.get('/api/messages', (req, res) => {
  res.json({ messages: conversations });
});

app.post('/api/messages', (req, res) => {
  const { sender, text, type, recognizedKeywords } = req.body;
  if (!text && !type) {
    return res.status(400).json({ error: 'Text or action type is required' });
  }

  const newMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sender: sender || 'hearing',
    text: text || '',
    type: type || 'chat',
    recognizedKeywords: recognizedKeywords || [],
    timestamp: new Date().toISOString()
  };

  conversations.push(newMessage);
  // Keep last 50 messages
  if (conversations.length > 50) {
    conversations = conversations.slice(-50);
  }

  res.status(201).json({ success: true, message: newMessage });
});

// 4. Gemini ASL / Gesture classification pipeline stub
app.post('/api/gemini/interpret', async (req, res) => {
  const { landmarks, imageBase64, userPrompt } = req.body;

  // Stub response ready to connect to Google Gemini 1.5 Flash / Pro Multimodal API
  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      simulated: true,
      interpretedSign: 'Wave / Hello detected from landmark geometry',
      confidence: 0.94,
      note: 'To enable live Gemini inference, provide GEMINI_API_KEY in server/.env'
    });
  }

  // Future real Gemini call implementation
  res.json({
    interpretedSign: 'Recognized Sign',
    confidence: 0.98
  });
});

app.listen(PORT, () => {
  console.log(`[SignSync Server] Running on http://localhost:${PORT}`);
  console.log(`[SignSync Server] Health check available at http://localhost:${PORT}/api/health`);
});
