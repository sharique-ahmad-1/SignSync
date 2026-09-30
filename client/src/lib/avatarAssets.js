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
  },
  doctor: {
    gloss: 'DOCTOR',
    label: 'Doctor / Chikitsak',
    hindi: 'चिकित्सक / डॉक्टर',
    category: 'Medical',
    handShape: 'M-Hand Tap Wrist',
    motionType: 'pulse_tap_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    description: 'Bent fingertips tap three times against the inner wrist checking pulse.',
    bonePose: {
      rightShoulder: [0.85, 0.2, 0.45],
      rightElbow: [0, -0.7, 0.4],
      leftShoulder: [0.5, -0.2, 0.3],
      leftElbow: [0, -0.5, -0.3],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 4, amp: 0.15 },
    islStandard: true
  },
  emergency: {
    gloss: 'EMERGENCY',
    label: 'Emergency / Aapatkaal',
    hindi: 'आपातकाल',
    category: 'Medical',
    handShape: 'E-Hand Rapid Shake',
    motionType: 'wave_cycle',
    durationMs: 2600,
    videoUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    description: 'E-hand shape shaken rapidly side-to-side with urgency indicator.',
    bonePose: {
      rightShoulder: [1.15, 0.1, 0.55],
      rightElbow: [0, -0.6, 0.4],
      leftShoulder: [-0.2, 0, 0],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'z', freq: 6, amp: 0.3 },
    islStandard: true
  },
  hospital: {
    gloss: 'HOSPITAL',
    label: 'Hospital / Aspataal',
    hindi: 'अस्पताल',
    category: 'Medical',
    handShape: 'H-Hand Cross on Shoulder',
    motionType: 'cross_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
    description: 'Index and middle fingers draw a medical cross on the upper left arm/shoulder.',
    bonePose: {
      rightShoulder: [0.75, -0.25, 0.4],
      rightElbow: [0, -0.65, 0.35],
      leftShoulder: [0.3, -0.1, 0.2],
      head: [0.05, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'y', freq: 3, amp: 0.2 },
    islStandard: true
  },
  pain: {
    gloss: 'PAIN',
    label: 'Pain / Hurt / Dard',
    hindi: 'दर्द',
    category: 'Medical',
    handShape: 'Twisting Index Fingers',
    motionType: 'point_cycle',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/3o7TKnLpD9wAkyOIEw/giphy.gif',
    description: 'Both index fingers point toward each other and twist back and forth at pain area.',
    bonePose: {
      rightShoulder: [0.7, 0.15, 0.4],
      rightElbow: [0, -0.6, 0.3],
      leftShoulder: [0.7, -0.15, 0.4],
      leftElbow: [0, -0.6, -0.3],
      head: [0.15, 0, 0]
    },
    cycle: { joint: 'both', axis: 'z', freq: 4, amp: 0.2 },
    islStandard: true
  },
  more: {
    gloss: 'MORE',
    label: 'More / Aur',
    hindi: 'और',
    category: 'Essentials',
    handShape: 'Fingertips Tapping',
    motionType: 'chin_touch_cycle',
    durationMs: 2300,
    videoUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    description: 'Fingertips of both flattened O-hands tap together repeatedly in front of chest.',
    bonePose: {
      rightShoulder: [0.65, 0.2, 0.35],
      rightElbow: [0, -0.5, 0.3],
      leftShoulder: [0.65, -0.2, 0.35],
      leftElbow: [0, -0.5, -0.3],
      head: [0, 0, 0]
    },
    cycle: { joint: 'both', axis: 'x', freq: 4, amp: 0.15 },
    islStandard: true
  },
  sorry: {
    gloss: 'SORRY',
    label: 'Sorry / Maaf',
    hindi: 'माफ़ करना',
    category: 'Courtesy',
    handShape: 'A-Fist Circling Chest',
    motionType: 'chest_rub_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/3o7TKVfu4rwysCasla/giphy.gif',
    description: 'Closed fist with thumb upright rubs in circular motions on center of chest.',
    bonePose: {
      rightShoulder: [0.8, -0.05, 0.45],
      rightElbow: [0, -0.6, 0.35],
      leftShoulder: [-0.2, 0, 0],
      head: [0.2, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'z', freq: 3, amp: 0.25 },
    islStandard: true
  },
  bad: {
    gloss: 'BAD',
    label: 'Bad / Bura',
    hindi: 'बुरा / खराब',
    category: 'Courtesy',
    handShape: 'Thumbs Down / Palm Down',
    motionType: 'fist_nod_cycle',
    durationMs: 2200,
    videoUrl: 'https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif',
    description: 'Hand from chin moves down and flips palm/thumb facing downward with negative nod.',
    bonePose: {
      rightShoulder: [0.55, 0.1, 0.35],
      rightElbow: [0, -0.3, 0.2],
      leftShoulder: [-0.2, 0, 0],
      head: [0, 0.25, 0]
    },
    cycle: { joint: 'head', axis: 'y', freq: 3, amp: 0.2 },
    islStandard: true
  },
  call: {
    gloss: 'CALL',
    label: 'Call / Phone',
    hindi: 'फ़ोन / कॉल',
    category: 'Social',
    handShape: 'Y-Hand to Ear',
    motionType: 'chin_touch_cycle',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
    description: 'Thumb at ear and pinky at mouth forming a telephone receiver.',
    bonePose: {
      rightShoulder: [1.2, 0.3, 0.6],
      rightElbow: [0, -0.85, 0.5],
      leftShoulder: [-0.2, 0, 0],
      head: [0.1, 0.2, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 2, amp: 0.1 },
    islStandard: true
  },
  family: {
    gloss: 'FAMILY',
    label: 'Family / Parivaar',
    hindi: 'परिवार',
    category: 'Social',
    handShape: 'F-Hands Circle',
    motionType: 'elevate_two_hands',
    durationMs: 2700,
    videoUrl: 'https://media.giphy.com/media/26FLdm964upqWP3lu/giphy.gif',
    description: 'Both hands in F-shape touch index and thumb, sweep in horizontal circle touching pinkies.',
    bonePose: {
      rightShoulder: [0.75, 0.2, 0.45],
      rightElbow: [0, -0.55, 0.35],
      leftShoulder: [0.75, -0.2, 0.45],
      leftElbow: [0, -0.55, -0.35],
      head: [0, 0, 0]
    },
    cycle: { joint: 'both', axis: 'y', freq: 3, amp: 0.2 },
    islStandard: true
  },

  // ==========================================
  // PHASE 10: 12 New High-Impact Avatar Vocabulary
  // ==========================================

  fire: {
    gloss: 'FIRE',
    label: 'Fire / Aang',
    hindi: 'आग',
    category: 'Emergency',
    handShape: 'Wiggling Fingers Upward',
    motionType: 'wave_cycle',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    description: 'Both hands with fingers spread, wiggling upward to mimic rising flames.',
    bonePose: {
      rightShoulder: [1.0, 0.1, 0.55],
      rightElbow: [0, -0.5, 0.4],
      leftShoulder: [1.0, -0.1, 0.55],
      leftElbow: [0, -0.5, -0.4],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'both', axis: 'y', freq: 6, amp: 0.3 },
    islStandard: true
  },
  police: {
    gloss: 'POLICE',
    label: 'Police / Pulis',
    hindi: 'पुलिस',
    category: 'Emergency',
    handShape: 'C-Hand Badge Tap',
    motionType: 'chest_rub_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
    description: 'C-shape hand taps twice on the upper left chest area mimicking a police badge.',
    bonePose: {
      rightShoulder: [0.7, -0.3, 0.4],
      rightElbow: [0, -0.6, 0.35],
      leftShoulder: [0.3, -0.1, 0.2],
      head: [0.05, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 3, amp: 0.15 },
    islStandard: true
  },
  home: {
    gloss: 'HOME',
    label: 'Home / Ghar',
    hindi: 'घर',
    category: 'Places',
    handShape: 'Flat O-Cheek-Jaw',
    motionType: 'chin_touch_cycle',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
    description: 'Fingertips bunched touch the cheek, then move down to the jawline.',
    bonePose: {
      rightShoulder: [1.1, 0.1, 0.5],
      rightElbow: [0, -0.8, 0.5],
      leftShoulder: [-0.2, 0, 0],
      head: [0.1, 0.1, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'y', freq: 2, amp: 0.15 },
    islStandard: true
  },
  toilet: {
    gloss: 'TOILET',
    label: 'Toilet / Shauchalay',
    hindi: 'शौचालय',
    category: 'Essentials',
    handShape: 'T-Hand Shake',
    motionType: 'wave_cycle',
    durationMs: 2300,
    videoUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    description: 'Thumb placed between index and middle finger (T-shape), shaken side to side.',
    bonePose: {
      rightShoulder: [0.75, 0.15, 0.45],
      rightElbow: [0, -0.5, 0.3],
      leftShoulder: [-0.2, 0, 0],
      head: [0, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'z', freq: 4, amp: 0.2 },
    islStandard: true
  },
  drink: {
    gloss: 'DRINK',
    label: 'Drink / Peena',
    hindi: 'पीना',
    category: 'Essentials',
    handShape: 'C-Tilt to Mouth',
    motionType: 'chin_touch_cycle',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    description: 'C-shaped hand tilted toward mouth as if drinking from a cup.',
    bonePose: {
      rightShoulder: [1.15, 0.1, 0.55],
      rightElbow: [0, -0.85, 0.5],
      leftShoulder: [-0.2, 0, 0],
      head: [0.15, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 3, amp: 0.2 },
    islStandard: true
  },
  medicine: {
    gloss: 'MEDICINE',
    label: 'Medicine / Dawai',
    hindi: 'दवाई',
    category: 'Medical',
    handShape: 'Middle Finger Tap Palm',
    motionType: 'pulse_tap_cycle',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/3o7TKnLpD9wAkyOIEw/giphy.gif',
    description: 'Middle finger of dominant hand taps repeatedly on the open palm of non-dominant hand.',
    bonePose: {
      rightShoulder: [0.8, 0.2, 0.4],
      rightElbow: [0, -0.65, 0.35],
      leftShoulder: [0.5, -0.15, 0.35],
      leftElbow: [0, -0.45, -0.3],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 4, amp: 0.15 },
    islStandard: true
  },
  need: {
    gloss: 'NEED',
    label: 'Need / Zaroorat',
    hindi: 'ज़रूरत',
    category: 'Essentials',
    handShape: 'X-Hand Pull Down',
    motionType: 'fist_nod_cycle',
    durationMs: 2200,
    videoUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    description: 'Bent index finger (X-hand) pulled downward in a hooking motion.',
    bonePose: {
      rightShoulder: [0.7, 0.1, 0.4],
      rightElbow: [0, -0.5, 0.3],
      leftShoulder: [-0.2, 0, 0],
      head: [0.15, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 3, amp: 0.2 },
    islStandard: true
  },
  danger: {
    gloss: 'DANGER',
    label: 'Danger / Khatara',
    hindi: 'ख़तरा',
    category: 'Emergency',
    handShape: 'A-Hand Thrust',
    motionType: 'wave_cycle',
    durationMs: 2300,
    videoUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    description: 'Closed fist thrust forward alternating both hands in warning motion.',
    bonePose: {
      rightShoulder: [0.9, 0.1, 0.5],
      rightElbow: [0, -0.4, 0.3],
      leftShoulder: [0.9, -0.1, 0.5],
      leftElbow: [0, -0.4, -0.3],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'both', axis: 'x', freq: 5, amp: 0.25 },
    islStandard: true
  },
  sick: {
    gloss: 'SICK',
    label: 'Sick / Bimaar',
    hindi: 'बीमार',
    category: 'Medical',
    handShape: '5-Claw Forehead',
    motionType: 'chin_touch_cycle',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/3o7TKnLpD9wAkyOIEw/giphy.gif',
    description: 'Open 5-hand with fingers slightly curled placed on forehead, other hand on stomach.',
    bonePose: {
      rightShoulder: [1.2, 0.1, 0.6],
      rightElbow: [0, -0.9, 0.5],
      leftShoulder: [0.5, -0.1, 0.3],
      leftElbow: [0, -0.4, -0.2],
      head: [0.2, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 2, amp: 0.1 },
    islStandard: true
  },
  eat: {
    gloss: 'EAT',
    label: 'Eat / Khao',
    hindi: 'खाओ',
    category: 'Essentials',
    handShape: 'Flat O to Mouth',
    motionType: 'chin_touch_cycle',
    durationMs: 2400,
    videoUrl: 'https://media.giphy.com/media/3o7TKnLpD9wAkyOIEw/giphy.gif',
    description: 'Flattened O-hand moves repeatedly toward the mouth.',
    bonePose: {
      rightShoulder: [1.2, 0.05, 0.5],
      rightElbow: [0, -0.85, 0.5],
      leftShoulder: [-0.2, 0, 0],
      head: [0.1, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 4, amp: 0.18 },
    islStandard: true
  },
  school: {
    gloss: 'SCHOOL',
    label: 'School / Vidyalaya',
    hindi: 'विद्यालय',
    category: 'Places',
    handShape: 'Clap Horizontal',
    motionType: 'elevate_two_hands',
    durationMs: 2500,
    videoUrl: 'https://media.giphy.com/media/26FLdm964upqWP3lu/giphy.gif',
    description: 'Dominant hand claps down on non-dominant flat palm twice.',
    bonePose: {
      rightShoulder: [0.8, 0.2, 0.5],
      rightElbow: [0, -0.5, 0.35],
      leftShoulder: [0.5, -0.2, 0.4],
      leftElbow: [0, -0.4, -0.3],
      head: [0.05, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'y', freq: 4, amp: 0.2 },
    islStandard: true
  },
  money: {
    gloss: 'MONEY',
    label: 'Money / Paisa',
    hindi: 'पैसा',
    category: 'Essentials',
    handShape: 'Flat Hand Palm Tap',
    motionType: 'chin_touch_cycle',
    durationMs: 2300,
    videoUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    description: 'Back of flat O-hand taps the open palm of non-dominant hand twice.',
    bonePose: {
      rightShoulder: [0.7, 0.15, 0.4],
      rightElbow: [0, -0.55, 0.35],
      leftShoulder: [0.5, -0.15, 0.35],
      leftElbow: [0, -0.45, -0.3],
      head: [0, 0, 0]
    },
    cycle: { joint: 'rightShoulder', axis: 'x', freq: 4, amp: 0.15 },
    islStandard: true
  }
};

// Common filler words ignored in ISL syntax (Phase 12: Massively expanded to prevent fingerspelling)
const STOP_WORDS = new Set([
  'is', 'am', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'to', 'of', 'in', 'on', 'at', 
  'it', 'be', 'do', 'does', 'did', 'so', 'can', 'will', 'would', 'could', 'should', 'shall',
  'has', 'have', 'had', 'been', 'being', 'for', 'with', 'from', 'by', 'or', 'but', 'nor',
  'not', 'if', 'then', 'than', 'that', 'this', 'these', 'those', 'there', 'their', 'them',
  'they', 'we', 'us', 'our', 'he', 'she', 'his', 'her', 'its', 'who', 'whom', 'whose',
  'which', 'about', 'into', 'out', 'up', 'down', 'over', 'under', 'after', 'before',
  'just', 'very', 'really', 'also', 'some', 'any', 'many', 'much', 'most', 'few',
  'all', 'each', 'every', 'both', 'either', 'neither', 'here', 'now', 'well',
  'like', 'get', 'got', 'go', 'going', 'went', 'come', 'came', 'let', 'make',
  'made', 'take', 'took', 'give', 'gave', 'say', 'said', 'tell', 'told',
  'know', 'knew', 'think', 'thought', 'see', 'saw', 'look', 'looked',
  'im', 'youre', 'hes', 'shes', 'its', 'were', 'theyre',
  'dont', 'doesnt', 'didnt', 'cant', 'wont', 'shouldnt', 'couldnt', 'wouldnt',
  'able', 'might', 'may', 'must', 'still', 'while', 'too', 'only', 'own',
  'same', 'other', 'another', 'such', 'even', 'back', 'way', 'long', 'right',
  'because', 'through', 'between', 'around', 'during', 'without', 'again'
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

  // Synonym and stem normalization mapping for robust word-level resolution
  const SYNONYM_MAP = {
    hi: 'hello',
    namaste: 'hello',
    greetings: 'hello',
    bye: 'hello',
    goodbye: 'hello',
    assist: 'help',
    assistance: 'help',
    sahayata: 'help',
    yeah: 'yes',
    yep: 'yes',
    haan: 'yes',
    correct: 'yes',
    sure: 'yes',
    nope: 'no',
    nah: 'no',
    nahi: 'no',
    drink: 'drink',
    water: 'water',
    paani: 'water',
    thirsty: 'water',
    food: 'food',
    eat: 'eat',
    eating: 'eat',
    khana: 'food',
    khao: 'eat',
    meal: 'food',
    dinner: 'food',
    lunch: 'food',
    breakfast: 'food',
    hungry: 'hungry',
    bhookh: 'hungry',
    starving: 'hungry',
    thanks: 'thank',
    dhanyavaad: 'thank',
    appreciate: 'thank',
    grateful: 'thank',
    kripya: 'please',
    kindly: 'please',
    doc: 'doctor',
    physician: 'doctor',
    chikitsak: 'doctor',
    medical: 'doctor',
    urgent: 'emergency',
    aapatkaal: 'emergency',
    clinic: 'hospital',
    aspataal: 'hospital',
    meds: 'medicine',
    pills: 'medicine',
    dawai: 'medicine',
    hurt: 'pain',
    hurts: 'pain',
    ache: 'pain',
    aching: 'pain',
    dard: 'pain',
    cop: 'police',
    cops: 'police',
    pulis: 'police',
    flames: 'fire',
    aag: 'fire',
    aang: 'fire',
    house: 'home',
    ghar: 'home',
    restroom: 'toilet',
    washroom: 'toilet',
    bathroom: 'toilet',
    shauchalay: 'toilet',
    want: 'need',
    require: 'need',
    zaroorat: 'need',
    ill: 'sick',
    unwell: 'sick',
    fever: 'sick',
    bimaar: 'sick',
    college: 'school',
    class: 'school',
    vidyalaya: 'school',
    cash: 'money',
    pay: 'money',
    rupees: 'money',
    dollars: 'money',
    paisa: 'money',
    halt: 'stop',
    ruko: 'stop',
    pyar: 'love',
    care: 'love',
    dost: 'friend',
    buddy: 'friend',
    parents: 'family',
    mother: 'family',
    father: 'family',
    parivaar: 'family',
    phone: 'call',
    ring: 'call',
    clock: 'time',
    hour: 'time',
    samay: 'time',
    kahan: 'where',
    kya: 'what',
    great: 'good',
    accha: 'good',
    fine: 'good',
    bura: 'bad',
    terrible: 'bad',
    aur: 'more',
    apologize: 'sorry',
    maaf: 'sorry',
    aap: 'you',
    tum: 'you',
    main: 'me',
    myself: 'me',
    shanti: 'peace'
  };

  for (const word of orderedWords) {
    const canonical = SYNONYM_MAP[word] || word;
    if (AVATAR_VOCABULARY[canonical]) {
      matchedGlosses.push({
        keyword: canonical,
        ...AVATAR_VOCABULARY[canonical],
        type: 'word'
      });
    }
  }

  // If no words matched, fallback to default full word 'hello'
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
