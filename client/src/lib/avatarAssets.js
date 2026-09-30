/**
 * Advanced ISL / ASL Dataset & Sign Animation Engine
 * Synthesizes architecture and grammar patterns from:
 * - Sijosaju (Speech to ISL 3D Avatar Animations)
 * - SignFlow (ISL Gloss Processing & Video/Fingerspelling sequences)
 * - Sign-Kit (Humanoid Avatar Bone Rigging & Animation Cycles)
 */

export const AVATAR_VOCABULARY = {
  hello: {
    gloss: 'HELLO',
    label: 'Hello / Namaste',
    hindi: 'नमस्ते',
    category: 'Greetings',
    handShape: 'Open Palm (Pataka)',
    motionType: 'wave_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
    description: 'Right open hand touches forehead/temple, then extends outward in a respectful arc wave.',
    bonePose: {
      rightShoulder: [0.9, -0.2, 0.5],
      rightElbow: [0, -0.6, 0.4],
      leftShoulder: [-0.2, 0, 0],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'z', freq: 4, amp: 0.25 },
    islStandard: true
  },
  help: {
    gloss: 'HELP',
    label: 'Help / Sahayata',
    hindi: 'मदद / सहायता',
    category: 'Urgent',
    handShape: 'Mushti on Palm',
    motionType: 'elevate_two_hands',
    durationMs: 2800,
    videoUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    description: 'Thumbs-up fist placed on flat open left palm, both hands lifted upward together.',
    bonePose: {
      rightShoulder: [0.6, 0.2, 0.5],
      rightElbow: [0, -0.5, 0.4],
      leftShoulder: [0.6, -0.2, 0.5],
      leftElbow: [0, -0.5, -0.4],
      head: [0, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 2, amp: 0.2 },
    islStandard: true
  },
  thank: {
    gloss: 'THANK YOU',
    label: 'Thank You / Dhanyavaad',
    hindi: 'धन्यवाद',
    category: 'Courtesy',
    handShape: 'Flat Fingers to Chin',
    motionType: 'chin_touch_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
    description: 'Fingertips touch the chin and extend smoothly forward towards the person.',
    bonePose: {
      rightShoulder: [1.1, 0.05, 0.45],
      rightElbow: [0, -0.8, 0.6],
      leftShoulder: [-0.2, 0, 0],
      head: [0.15, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 3, amp: 0.35 },
    islStandard: true
  },
  thanks: {
    gloss: 'THANK YOU',
    label: 'Thank You',
    hindi: 'धन्यवाद',
    category: 'Courtesy',
    handShape: 'Flat Fingers to Chin',
    motionType: 'chin_touch_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
    description: 'Fingertips touch chin then extend forward.',
    bonePose: {
      rightShoulder: [1.1, 0.05, 0.45],
      rightElbow: [0, -0.8, 0.6],
      leftShoulder: [-0.2, 0, 0],
      head: [0.15, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 3, amp: 0.35 },
    islStandard: true
  },
  water: {
    gloss: 'WATER',
    label: 'Water / Paani',
    hindi: 'पानी',
    category: 'Essentials',
    handShape: 'W-Hand (Tripataka)',
    motionType: 'w_tap_cycle',
    durationMs: 2600,
    videoUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    description: 'Three middle fingers form "W", index finger taps twice against the chin.',
    bonePose: {
      rightShoulder: [1.2, 0.15, 0.55],
      rightElbow: [0, -0.9, 0.6],
      leftShoulder: [-0.2, 0, 0],
      head: [0, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 5, amp: 0.15 },
    islStandard: true
  },
  food: {
    gloss: 'FOOD',
    label: 'Food / Khana',
    hindi: 'खाना',
    category: 'Essentials',
    handShape: 'O-Hand to Mouth',
    motionType: 'chin_touch_cycle',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/3o7TKnLpD9wAkyOIEw/giphy.gif',
    description: 'Fingertips bunched together tapping towards mouth repeatedly.',
    bonePose: {
      rightShoulder: [1.25, 0.05, 0.5],
      rightElbow: [0, -0.85, 0.5],
      leftShoulder: [-0.2, 0, 0],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 4, amp: 0.18 },
    islStandard: true
  },
  hungry: {
    gloss: 'HUNGRY',
    label: 'Hungry / Bhookh',
    hindi: 'भूख',
    category: 'Essentials',
    handShape: 'Cupped Hand',
    motionType: 'chest_rub_cycle',
    durationMs: 2700,
    videoUrl: 'https://media.giphy.com/media/3o7TKnLpD9wAkyOIEw/giphy.gif',
    description: 'Cupped hand moves down center of chest signifying an empty stomach.',
    bonePose: {
      rightShoulder: [0.75, 0, 0.35],
      rightElbow: [0, -0.5, 0.3],
      leftShoulder: [-0.2, 0, 0],
      head: [0, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'y', freq: 3, amp: 0.2 },
    islStandard: true
  },
  yes: {
    gloss: 'YES',
    label: 'Yes / Haan',
    hindi: 'हाँ',
    category: 'Responses',
    handShape: 'Fist (Mushti)',
    motionType: 'fist_nod_cycle',
    durationMs: 2200,
    videoUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    description: 'Closed fist bobbing up and down mimicking a head nod in agreement.',
    bonePose: {
      rightShoulder: [0.65, 0.2, 0.45],
      rightElbow: [0, -0.5, 0.35],
      leftShoulder: [-0.2, 0, 0],
      head: [0.25, 0, 0]
    },
    cycle: { joint: 'head', axis: 'x', freq: 4, amp: 0.25 },
    islStandard: true
  },
  no: {
    gloss: 'NO',
    label: 'No / Nahi',
    hindi: 'नहीं',
    category: 'Responses',
    handShape: 'Finger Snap',
    motionType: 'snap_cycle',
    durationMs: 2200,
    videoUrl: 'https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif',
    description: 'Index and middle fingers snap down against thumb with head shake.',
    bonePose: {
      rightShoulder: [0.7, 0.15, 0.4],
      rightElbow: [0, -0.5, 0.3],
      leftShoulder: [-0.2, 0, 0],
      head: [0, 0.3, 0]
    },
    cycle: { joint: 'head', axis: 'y', freq: 4, amp: 0.3 },
    islStandard: true
  },
  please: {
    gloss: 'PLEASE',
    label: 'Please / Kripya',
    hindi: 'कृपया',
    category: 'Courtesy',
    handShape: 'Open Palm on Chest',
    motionType: 'chest_rub_cycle',
    durationMs: 2600,
    videoUrl: 'https://media.giphy.com/media/3o7TKVfu4rwysCasla/giphy.gif',
    description: 'Flat open palm rubbed clockwise in circular motions across the chest.',
    bonePose: {
      rightShoulder: [0.85, -0.1, 0.5],
      rightElbow: [0, -0.5, 0.4],
      leftShoulder: [-0.2, 0, 0],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'z', freq: 3, amp: 0.25 },
    islStandard: true
  },
  stop: {
    gloss: 'STOP',
    label: 'Stop / Ruko',
    hindi: 'रुको',
    category: 'Urgent',
    handShape: 'Flat Palm Forward',
    motionType: 'wave_cycle',
    durationMs: 2300,
    videoUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
    description: 'Flat hand held out firmly facing partner indicating stop or wait.',
    bonePose: {
      rightShoulder: [0.8, 0, 0.5],
      rightElbow: [0, -0.3, 0.2],
      leftShoulder: [-0.2, 0, 0],
      head: [0, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 2, amp: 0.1 },
    islStandard: true
  },
  goodbye: {
    gloss: 'GOODBYE',
    label: 'Goodbye / Alvida',
    hindi: 'अलविदा',
    category: 'Greetings',
    handShape: 'Open Hand Wave',
    motionType: 'wave_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/m9eG1qVjvNINlACQQo/giphy.gif',
    description: 'Hand raised waving fingers opening and closing towards conversation partner.',
    bonePose: {
      rightShoulder: [1.35, -0.4, 0.5],
      rightElbow: [0, -0.7, 0.3],
      leftShoulder: [-0.2, 0, 0],
      head: [0, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'z', freq: 5, amp: 0.3 },
    islStandard: true
  },
  friend: {
    gloss: 'FRIEND',
    label: 'Friend / Dost',
    hindi: 'दोस्त / मित्र',
    category: 'Social',
    handShape: 'Hooked Index Fingers',
    motionType: 'elevate_two_hands',
    durationMs: 2700,
    videoUrl: 'https://media.giphy.com/media/26FLdm964upqWP3lu/giphy.gif',
    description: 'Hooked index fingers link together, flip and link again.',
    bonePose: {
      rightShoulder: [0.65, 0.1, 0.45],
      rightElbow: [0, -0.5, 0.4],
      leftShoulder: [0.65, -0.1, 0.45],
      leftElbow: [0, -0.5, -0.4],
      head: [0.05, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'y', freq: 3, amp: 0.2 },
    islStandard: true
  },
  love: {
    gloss: 'I LOVE YOU',
    label: 'I Love You (ILY)',
    hindi: 'प्यार',
    category: 'Emotion',
    handShape: 'ILY Hand (Thumb, Index, Pinky)',
    motionType: 'wave_cycle',
    durationMs: 2600,
    videoUrl: 'https://media.giphy.com/media/3o6Zt8rGMqVwjYAlsA/giphy.gif',
    description: 'Thumb, index, and pinky extended upward together in the universal ASL/ISL ILY sign.',
    bonePose: {
      rightShoulder: [1.1, 0.15, 0.6],
      rightElbow: [0, -0.6, 0.3],
      leftShoulder: [-0.2, 0, 0],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'z', freq: 3, amp: 0.15 },
    islStandard: true
  },
  me: {
    gloss: 'ME / I',
    label: 'Me / Main',
    hindi: 'मैं',
    category: 'Pronouns',
    handShape: 'Pointing (Suchi)',
    motionType: 'point_cycle',
    durationMs: 2000,
    videoUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    description: 'Index finger pointing gently inwards toward chest.',
    bonePose: {
      rightShoulder: [0.75, -0.1, 0.4],
      rightElbow: [0, -0.6, 0.4],
      leftShoulder: [-0.2, 0, 0],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 2, amp: 0.1 },
    islStandard: true
  },
  you: {
    gloss: 'YOU',
    label: 'You / Aap',
    hindi: 'आप / तुम',
    category: 'Pronouns',
    handShape: 'Pointing Forward',
    motionType: 'point_cycle',
    durationMs: 2000,
    videoUrl: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
    description: 'Index finger extended pointing toward the person being addressed.',
    bonePose: {
      rightShoulder: [0.8, 0, 0.5],
      rightElbow: [0, -0.4, 0.2],
      leftShoulder: [-0.2, 0, 0],
      head: [0, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 2, amp: 0.15 },
    islStandard: true
  },
  time: {
    gloss: 'TIME',
    label: 'Time / Samay',
    hindi: 'समय',
    category: 'Essentials',
    handShape: 'Tap Wrist',
    motionType: 'chin_touch_cycle',
    durationMs: 2300,
    videoUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    description: 'Index finger taps repeatedly on the opposite wrist where a watch is worn.',
    bonePose: {
      rightShoulder: [0.65, 0.2, 0.4],
      rightElbow: [0, -0.6, 0.3],
      leftShoulder: [0.45, -0.2, 0.4],
      leftElbow: [0, -0.5, -0.3],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 4, amp: 0.2 },
    islStandard: true
  },
  where: {
    gloss: 'WHERE',
    label: 'Where / Kahan',
    hindi: 'कहाँ',
    category: 'Questions',
    handShape: 'Palms Up Shake',
    motionType: 'wave_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    description: 'Both palms held open facing upward, gently shaking side-to-side with questioning expression.',
    bonePose: {
      rightShoulder: [0.6, 0.3, 0.4],
      rightElbow: [0, -0.5, 0.3],
      leftShoulder: [0.6, -0.3, 0.4],
      leftElbow: [0, -0.5, -0.3],
      head: [0, 0.2, 0]
    },
    cycle: { joint: 'both', axis: 'y', freq: 4, amp: 0.25 },
    islStandard: true
  },
  name: {
    gloss: 'NAME',
    label: 'Name / Naam',
    hindi: 'नाम',
    category: 'Questions',
    handShape: 'H-Hand Crossed',
    motionType: 'chin_touch_cycle',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    description: 'Index and middle fingers of both hands extended, tapping across each other.',
    bonePose: {
      rightShoulder: [0.7, 0.2, 0.4],
      rightElbow: [0, -0.6, 0.3],
      leftShoulder: [0.7, -0.2, 0.4],
      leftElbow: [0, -0.6, -0.3],
      head: [0.05, 0, 0]
    },
    cycle: { joint: 'both', axis: 'x', freq: 4, amp: 0.15 },
    islStandard: true
  },
  what: {
    gloss: 'WHAT',
    label: 'What / Kya',
    hindi: 'क्या',
    category: 'Questions',
    handShape: 'Palms Up Shake',
    motionType: 'wave_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    description: 'Both hands held waist level palms up, shaking slightly side-to-side with questioning face.',
    bonePose: {
      rightShoulder: [0.55, 0.3, 0.4],
      rightElbow: [0, -0.5, 0.3],
      leftShoulder: [0.55, -0.3, 0.4],
      leftElbow: [0, -0.5, -0.3],
      head: [0, 0.15, 0]
    },
    cycle: { joint: 'both', axis: 'y', freq: 4, amp: 0.2 },
    islStandard: true
  },
  how: {
    gloss: 'HOW',
    label: 'How / Kaise',
    hindi: 'कैसे',
    category: 'Questions',
    handShape: 'Curved Palms Outward',
    motionType: 'wave_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    description: 'Back of curved fingers resting together then rolling upward and outward.',
    bonePose: {
      rightShoulder: [0.6, 0.25, 0.45],
      rightElbow: [0, -0.5, 0.35],
      leftShoulder: [0.6, -0.25, 0.45],
      leftElbow: [0, -0.5, -0.35],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'both', axis: 'z', freq: 3, amp: 0.25 },
    islStandard: true
  },
  good: {
    gloss: 'GOOD',
    label: 'Good / Accha',
    hindi: 'अच्छा',
    category: 'Courtesy',
    handShape: 'Thumbs Up / Chin to Hand',
    motionType: 'fist_nod_cycle',
    durationMs: 2300,
    videoUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    description: 'Fingers from chin move outward landing flat into other palm with a positive nod.',
    bonePose: {
      rightShoulder: [0.85, 0.1, 0.45],
      rightElbow: [0, -0.5, 0.35],
      leftShoulder: [0.4, -0.2, 0.4],
      leftElbow: [0, -0.4, -0.3],
      head: [0.15, 0, 0]
    },
    cycle: { joint: 'head', axis: 'x', freq: 3, amp: 0.2 },
    islStandard: true
  }
};

// Common filler words ignored in ISL syntax
const STOP_WORDS = new Set([
  'is', 'am', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'to', 'of', 'in', 'on', 'at', 'it', 'be', 'do', 'does', 'did', 'so', 'can'
]);

/**
 * Reorders English words into Indian Sign Language (ISL) SOV grammar
 * Based on Sijosaju ISL grammar parsing architecture:
 * - Subject - Object - Verb order (instead of English SVO)
 * - WH-questions placed at end of sentence (e.g. "What is your name?" -> "YOU NAME WHAT")
 * - Negatives placed at end of sentence (e.g. "I do not want water" -> "ME WATER NO")
 */
export function reorderToISLGrammar(words) {
  const filtered = words.filter(w => !STOP_WORDS.has(w));
  if (filtered.length <= 1) return filtered;

  const questions = [];
  const negatives = [];
  const regular = [];

  for (const w of filtered) {
    if (['what', 'where', 'when', 'why', 'who', 'how'].includes(w)) {
      questions.push(w);
    } else if (['not', 'no'].includes(w)) {
      negatives.push('no');
    } else {
      regular.push(w);
    }
  }

  // Combine: Regular Content Words -> Negatives -> Questions at end
  return [...regular, ...negatives, ...questions];
}

/**
 * Parses raw English text into an ordered list of ISL Sign Glosses
 */
export function parseTextToSignGlosses(rawText) {
  if (!rawText) return [];

  const sanitized = rawText
    .toLowerCase()
    .replace(/n't/g, ' not')
    .replace(/'m/g, ' me')
    .replace(/'re/g, ' are')
    .replace(/'ve/g, ' have')
    .replace(/'s/g, '')
    .replace(/\bhi\b/g, 'hello')
    .replace(/\bhey\b/g, 'hello')
    .replace(/\bi am\b/g, 'me')
    .replace(/\bi'm\b/g, 'me')
    .replace(/\bi\b/g, 'me')
    .replace(/\bmy\b/g, 'me')
    .replace(/[^\w\s]/g, ' ');

  const rawWords = sanitized.split(/\s+/).filter(Boolean);
  const orderedWords = reorderToISLGrammar(rawWords);
  const matchedGlosses = [];

  for (const word of orderedWords) {
    if (AVATAR_VOCABULARY[word]) {
      matchedGlosses.push({
        keyword: word,
        ...AVATAR_VOCABULARY[word],
        type: 'word'
      });
    } else if (word.length <= 10) {
      // Fingerspelling fallback for names and unmapped words (e.g. "Sharique")
      for (const char of word) {
        if (/[a-z0-9]/i.test(char)) {
          matchedGlosses.push({
            keyword: char.toUpperCase(),
            gloss: char.toUpperCase(),
            label: `Letter ${char.toUpperCase()}`,
            hindi: char.toUpperCase(),
            category: 'Fingerspelling',
            handShape: `Letter ${char.toUpperCase()} Posture`,
            durationMs: 1200,
            description: `ISL Fingerspelling posture for letter ${char.toUpperCase()}`,
            videoUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
            bonePose: {
              rightShoulder: [0.85, 0.05, 0.45],
              rightElbow: [0, -0.6, 0.35],
              leftShoulder: [-0.2, 0, 0],
              leftElbow: [0, 0, 0],
              head: [0.05, 0, 0]
            },
            cycle: { joint: 'rightShoulder', axis: 'x', freq: 3, amp: 0.12 },
            type: 'letter'
          });
        }
      }
    }
  }

  // If no words matched, fallback to default 'hello'
  if (matchedGlosses.length === 0) {
    matchedGlosses.push({
      keyword: 'hello',
      ...AVATAR_VOCABULARY.hello,
      type: 'word'
    });
  }

  return matchedGlosses;
}

/**
 * Preload avatar image/video assets into browser cache
 */
export async function preloadAvatarAssets(glosses) {
  const promises = glosses.map(item => {
    if (item.videoUrl) {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = item.videoUrl;
        img.onload = () => resolve({ keyword: item.keyword, status: 'loaded' });
        img.onerror = () => resolve({ keyword: item.keyword, status: 'fallback' });
      });
    }
    return Promise.resolve({ keyword: item.keyword, status: 'ready' });
  });

  return Promise.all(promises);
}
