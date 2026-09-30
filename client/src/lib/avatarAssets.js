/**
 * Avatar & Gesture Asset Engine
 * Synthesizes architecture patterns from:
 * - Sijosaju (Speech to ISL 3D Avatar Animations)
 * - SignFlow (ISL Gloss Processing & Video/Fingerspelling sequences)
 * - Sign-Kit (Three.js WebGL humanoid avatar rigging & bone animation)
 */

export const AVATAR_VOCABULARY = {
  hello: {
    gloss: 'HELLO',
    label: 'Hello / Namaste',
    category: 'Greeting',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
    description: 'Right hand open, palm facing forward, moves outward from forehead/temple in an arc.',
    bonePose: { rightArm: [0.8, -0.2, 0.4], leftArm: [-0.2, 0, 0], head: [0.1, 0, 0] },
    islStandard: true
  },
  help: {
    gloss: 'HELP',
    label: 'Help',
    category: 'Urgent',
    durationMs: 2800,
    videoUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    description: 'Thumbs-up fist placed on open left palm, both hands elevated together.',
    bonePose: { rightArm: [0.5, 0.2, 0.6], leftArm: [0.5, -0.2, 0.6], head: [0, 0, 0] },
    islStandard: true
  },
  thank: {
    gloss: 'THANK YOU',
    label: 'Thank You / Dhanyavaad',
    category: 'Courtesy',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
    description: 'Fingers touch chin and extend outward towards the conversation partner.',
    bonePose: { rightArm: [0.9, 0, 0.5], leftArm: [-0.2, 0, 0], head: [0.2, 0, 0] },
    islStandard: true
  },
  thanks: {
    gloss: 'THANK YOU',
    label: 'Thank You',
    category: 'Courtesy',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
    description: 'Fingertips touch chin then extend forward.',
    bonePose: { rightArm: [0.9, 0, 0.5], leftArm: [-0.2, 0, 0], head: [0.2, 0, 0] },
    islStandard: true
  },
  water: {
    gloss: 'WATER',
    label: 'Water / Paani',
    category: 'Essentials',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    description: 'Three middle fingers form "W", index finger taps twice lightly on the chin.',
    bonePose: { rightArm: [1.1, 0.1, 0.7], leftArm: [-0.2, 0, 0], head: [0, 0, 0] },
    islStandard: true
  },
  food: {
    gloss: 'FOOD',
    label: 'Food / Khana',
    category: 'Essentials',
    durationMs: 2300,
    videoUrl: 'https://media.giphy.com/media/3o7TKnLpD9wAkyOIEw/giphy.gif',
    description: 'Fingertips gathered together tapping towards mouth repeatedly.',
    bonePose: { rightArm: [1.2, 0, 0.6], leftArm: [-0.2, 0, 0], head: [0.1, 0, 0] },
    islStandard: true
  },
  hungry: {
    gloss: 'HUNGRY',
    label: 'Hungry / Bhookh',
    category: 'Essentials',
    durationMs: 2600,
    videoUrl: 'https://media.giphy.com/media/3o7TKnLpD9wAkyOIEw/giphy.gif',
    description: 'Cupped hand moving down the center of chest indicating an empty stomach.',
    bonePose: { rightArm: [0.7, 0, 0.3], leftArm: [-0.2, 0, 0], head: [0, 0, 0] },
    islStandard: true
  },
  yes: {
    gloss: 'YES',
    label: 'Yes / Haan',
    category: 'Responses',
    durationMs: 2000,
    videoUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    description: 'Closed fist bobbing up and down simulating a head nod.',
    bonePose: { rightArm: [0.6, 0.3, 0.4], leftArm: [-0.2, 0, 0], head: [0.3, 0, 0] },
    islStandard: true
  },
  no: {
    gloss: 'NO',
    label: 'No / Nahi',
    category: 'Responses',
    durationMs: 2000,
    videoUrl: 'https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif',
    description: 'Index and middle fingers snap down onto thumb repeatedly.',
    bonePose: { rightArm: [0.6, 0.2, 0.3], leftArm: [-0.2, 0, 0], head: [-0.2, 0.3, 0] },
    islStandard: true
  },
  please: {
    gloss: 'PLEASE',
    label: 'Please / Kripya',
    category: 'Courtesy',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/3o7TKVfu4rwysCasla/giphy.gif',
    description: 'Flat open palm rubbed clockwise in circular motion across the chest.',
    bonePose: { rightArm: [0.8, -0.1, 0.5], leftArm: [-0.2, 0, 0], head: [0.1, 0, 0] },
    islStandard: true
  },
  goodbye: {
    gloss: 'GOODBYE',
    label: 'Goodbye / Alvida',
    category: 'Greeting',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/m9eG1qVjvNINlACQQo/giphy.gif',
    description: 'Open hand held high, fingers opening and closing waving toward person.',
    bonePose: { rightArm: [1.3, -0.4, 0.5], leftArm: [-0.2, 0, 0], head: [0, 0, 0] },
    islStandard: true
  },
  friend: {
    gloss: 'FRIEND',
    label: 'Friend / Dost',
    category: 'Social',
    durationMs: 2700,
    videoUrl: 'https://media.giphy.com/media/26FLdm964upqWP3lu/giphy.gif',
    description: 'Hooked index fingers link together, flip, and link once more.',
    bonePose: { rightArm: [0.6, 0.1, 0.4], leftArm: [0.6, -0.1, 0.4], head: [0, 0, 0] },
    islStandard: true
  },
  love: {
    gloss: 'I LOVE YOU',
    label: 'I Love You (ILY)',
    category: 'Emotion',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/3o6Zt8rGMqVwjYAlsA/giphy.gif',
    description: 'Thumb, index finger, and pinky extended upward together in the universal ILY sign.',
    bonePose: { rightArm: [1.0, 0.2, 0.6], leftArm: [-0.2, 0, 0], head: [0.1, 0, 0] },
    islStandard: true
  },
  me: {
    gloss: 'ME / I',
    label: 'Me / Main',
    category: 'Pronouns',
    durationMs: 1800,
    videoUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    description: 'Index finger pointing gently inwards toward own chest.',
    bonePose: { rightArm: [0.7, -0.1, 0.4], leftArm: [-0.2, 0, 0], head: [0.1, 0, 0] },
    islStandard: true
  }
};

// Common English words to ignore when extracting ISL glosses (SVR / SOV grammar)
const STOP_WORDS = new Set([
  'is', 'am', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'to', 'of', 'in', 'on', 'at'
]);

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
    .replace(/[^\w\s]/g, ' ');

  const words = sanitized.split(/\s+/).filter(Boolean);
  const matchedGlosses = [];

  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;

    if (AVATAR_VOCABULARY[word]) {
      matchedGlosses.push({
        keyword: word,
        ...AVATAR_VOCABULARY[word],
        type: 'word'
      });
    } else if (word.length <= 4) {
      // Fingerspelling fallback for short unknown words (as in SignFlow)
      for (const char of word) {
        matchedGlosses.push({
          keyword: char.toUpperCase(),
          gloss: char.toUpperCase(),
          label: `Letter ${char.toUpperCase()}`,
          category: 'Fingerspelling',
          durationMs: 1200,
          description: `ISL Fingerspelling hand posture for letter ${char.toUpperCase()}`,
          type: 'letter'
        });
      }
    }
  }

  return matchedGlosses;
}

/**
 * Utility to fetch or preload asset resources
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
