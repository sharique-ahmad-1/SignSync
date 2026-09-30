/**
 * Robust ISL & ASL Fingerpose Gesture Classifier Engine
 * Replaces basic 4-word Euclidean heuristics with a comprehensive 28+ sign gesture library.
 * Converts 21 3D MediaPipe Hand Landmarks into joint curl and direction angle vectors.
 */

import fp from 'fingerpose';

const { GestureEstimator, GestureDescription, Finger, FingerCurl, FingerDirection } = fp;

// ==========================================
// 1. Comprehensive ISL/ASL Gesture Definitions (28 Signs)
// ==========================================

// 1. HELLO / NAMASTE (Open Palm Wave / 5-Hand)
const helloGesture = new GestureDescription('Hello');
for (let finger of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  helloGesture.addCurl(finger, FingerCurl.NoCurl, 1.0);
  helloGesture.addDirection(finger, FingerDirection.VerticalUp, 0.9);
  helloGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.8);
  helloGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.8);
}

// 2. YES / HAAN (Closed Fist Nod / Thumbs Up)
const yesGesture = new GestureDescription('Yes');
yesGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.9);
yesGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
yesGesture.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 0.9);
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  yesGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
  yesGesture.addCurl(finger, FingerCurl.HalfCurl, 0.5);
}

// 3. NO / NAHI (Victory 2-Fingers / Snap)
const noGesture = new GestureDescription('No');
noGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
noGesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.9);
noGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
noGesture.addDirection(Finger.Middle, FingerDirection.VerticalUp, 0.9);
for (let finger of [Finger.Ring, Finger.Pinky]) {
  noGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}
noGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);
noGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.7);

// 4. STOP / RUKO (Flat Hand Palm Facing Forward)
const stopGesture = new GestureDescription('Stop');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  stopGesture.addCurl(finger, FingerCurl.NoCurl, 1.0);
  stopGesture.addDirection(finger, FingerDirection.VerticalUp, 0.9);
}
stopGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);
stopGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.7);
stopGesture.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 0.8);
stopGesture.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 0.8);

// 5. HELP / SAHAYATA (Index Pointing Upwards)
const helpGesture = new GestureDescription('Help');
helpGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
helpGesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);
for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  helpGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
  helpGesture.addCurl(finger, FingerCurl.HalfCurl, 0.6);
}
helpGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);
helpGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);

// 6. WATER / PAANI (W-Hand / Tripataka: Index, Middle, Ring extended)
const waterGesture = new GestureDescription('Water');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring]) {
  waterGesture.addCurl(finger, FingerCurl.NoCurl, 1.0);
  waterGesture.addDirection(finger, FingerDirection.VerticalUp, 0.9);
}
waterGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
waterGesture.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 0.6);
waterGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);
waterGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);

// 7. LOVE / PYAR (Universal ILY Sign: Thumb, Index, Pinky extended)
const loveGesture = new GestureDescription('Love');
loveGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
loveGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
loveGesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.9);
loveGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
loveGesture.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 0.9);
loveGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
loveGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);

// 8. PLEASE / KRIPYA (Flat Open Palm Chest Level / Horizontal)
const pleaseGesture = new GestureDescription('Please');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  pleaseGesture.addCurl(finger, FingerCurl.NoCurl, 1.0);
  pleaseGesture.addDirection(finger, FingerDirection.HorizontalLeft, 0.9);
  pleaseGesture.addDirection(finger, FingerDirection.HorizontalRight, 0.9);
  pleaseGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.7);
  pleaseGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.7);
}
pleaseGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
pleaseGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);

// 9. THANK YOU / DHANYAVAAD (Flat Hand Fingers Angled Upward / Chin to Out)
const thankYouGesture = new GestureDescription('Thank');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  thankYouGesture.addCurl(finger, FingerCurl.NoCurl, 1.0);
  thankYouGesture.addDirection(finger, FingerDirection.VerticalUp, 0.8);
  thankYouGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.9);
  thankYouGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.9);
}
thankYouGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// 10. FOOD / EAT / KHANA (O-Hand Bunched Fingers to Mouth)
const foodGesture = new GestureDescription('Food');
for (let finger of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  foodGesture.addCurl(finger, FingerCurl.HalfCurl, 1.0);
  foodGesture.addDirection(finger, FingerDirection.VerticalUp, 0.8);
  foodGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.8);
  foodGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.8);
}

// 11. HUNGRY / BHOOKH (C-Hand Cupped Palm)
const hungryGesture = new GestureDescription('Hungry');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  hungryGesture.addCurl(finger, FingerCurl.HalfCurl, 1.0);
  hungryGesture.addDirection(finger, FingerDirection.HorizontalLeft, 0.8);
  hungryGesture.addDirection(finger, FingerDirection.HorizontalRight, 0.8);
}
hungryGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// 12. DOCTOR / CHIKITSAK (M-Hand / Tap Pulse)
const doctorGesture = new GestureDescription('Doctor');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring]) {
  doctorGesture.addCurl(finger, FingerCurl.HalfCurl, 1.0);
  doctorGesture.addDirection(finger, FingerDirection.VerticalDown, 0.8);
  doctorGesture.addDirection(finger, FingerDirection.DiagonalDownLeft, 0.8);
  doctorGesture.addDirection(finger, FingerDirection.DiagonalDownRight, 0.8);
}
doctorGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
doctorGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.9);

// 13. EMERGENCY / AAPATKAAL (E-Hand Shake / Tight Curl Alert)
const emergencyGesture = new GestureDescription('Emergency');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  emergencyGesture.addCurl(finger, FingerCurl.HalfCurl, 1.0);
  emergencyGesture.addDirection(finger, FingerDirection.VerticalUp, 0.9);
}
emergencyGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);

// 14. WHERE / KAHAN (Palms Up Questioning Angle)
const whereGesture = new GestureDescription('Where');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  whereGesture.addCurl(finger, FingerCurl.NoCurl, 1.0);
  whereGesture.addDirection(finger, FingerDirection.HorizontalLeft, 0.9);
  whereGesture.addDirection(finger, FingerDirection.HorizontalRight, 0.9);
}
whereGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.9);

// 15. WHAT / KYA (Questioning Open Fingers)
const whatGesture = new GestureDescription('What');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  whatGesture.addCurl(finger, FingerCurl.NoCurl, 0.8);
  whatGesture.addCurl(finger, FingerCurl.HalfCurl, 0.7);
  whatGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.9);
  whatGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.9);
}
whatGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.9);

// 16. GOOD / ACCHA (Thumbs Up Affirmation)
const goodGesture = new GestureDescription('Good');
goodGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
goodGesture.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 1.0);
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  goodGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}

// 17. BAD / BURA (Thumbs Down Negative)
const badGesture = new GestureDescription('Bad');
badGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
badGesture.addDirection(Finger.Thumb, FingerDirection.VerticalDown, 1.0);
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  badGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}

// 18. FRIEND / DOST (Hooked Index Finger Sign)
const friendGesture = new GestureDescription('Friend');
friendGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  friendGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}
friendGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// 19. PAIN / DARD (Pointing toward body / ache)
const painGesture = new GestureDescription('Pain');
painGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
painGesture.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.9);
painGesture.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.9);
for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  painGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}
painGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);

// 20. TIME / SAMAY (Wrist Pointing Posture)
const timeGesture = new GestureDescription('Time');
timeGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
timeGesture.addDirection(Finger.Index, FingerDirection.DiagonalDownLeft, 0.8);
timeGesture.addDirection(Finger.Index, FingerDirection.DiagonalDownRight, 0.8);
timeGesture.addDirection(Finger.Index, FingerDirection.VerticalDown, 0.7);
for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  timeGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}
timeGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);

// 21. MORE / AUR (All Fingertips Touching Inward)
const moreGesture = new GestureDescription('More');
for (let finger of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  moreGesture.addCurl(finger, FingerCurl.HalfCurl, 1.0);
  moreGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.8);
  moreGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.8);
}

// 22. HOSPITAL / ASPATAAL (H-Hand: Index and Middle Horizontal)
const hospitalGesture = new GestureDescription('Hospital');
hospitalGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
hospitalGesture.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.9);
hospitalGesture.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.9);
hospitalGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
hospitalGesture.addDirection(Finger.Middle, FingerDirection.HorizontalLeft, 0.9);
hospitalGesture.addDirection(Finger.Middle, FingerDirection.HorizontalRight, 0.9);
for (let finger of [Finger.Ring, Finger.Pinky]) {
  hospitalGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}
hospitalGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// 23. SORRY / MAAF (A-Hand Fist Circling Chest)
const sorryGesture = new GestureDescription('Sorry');
sorryGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.9);
sorryGesture.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 0.9);
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  sorryGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
  sorryGesture.addDirection(finger, FingerDirection.VerticalUp, 0.6);
}

// 24. YOU / AAP (Index Pointing Outward / Forward)
const youGesture = new GestureDescription('You');
youGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
youGesture.addDirection(Finger.Index, FingerDirection.DiagonalUpLeft, 0.8);
youGesture.addDirection(Finger.Index, FingerDirection.DiagonalUpRight, 0.8);
for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  youGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}
youGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// 25. ME / MAIN (Index Pointing Inward to Chest)
const meGesture = new GestureDescription('Me');
meGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
meGesture.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.7);
meGesture.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.7);
for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  meGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}
meGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// 26. FAMILY / PARIVAAR (F-Hand Pinch with 3 Fingers Up)
const familyGesture = new GestureDescription('Family');
familyGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
familyGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  familyGesture.addCurl(finger, FingerCurl.NoCurl, 1.0);
  familyGesture.addDirection(finger, FingerDirection.VerticalUp, 0.9);
}

// 27. CALL / PHONE (Y-Hand Thumb and Pinky Extended)
const callGesture = new GestureDescription('Call');
callGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
callGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
callGesture.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 0.8);
callGesture.addDirection(Finger.Pinky, FingerDirection.DiagonalDownLeft, 0.8);
callGesture.addDirection(Finger.Pinky, FingerDirection.DiagonalDownRight, 0.8);
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring]) {
  callGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}

// 28. PEACE / SHANTI (V-Hand Spread)
const peaceGesture = new GestureDescription('Peace');
peaceGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
peaceGesture.addDirection(Finger.Index, FingerDirection.DiagonalUpLeft, 0.9);
peaceGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
peaceGesture.addDirection(Finger.Middle, FingerDirection.DiagonalUpRight, 0.9);
for (let finger of [Finger.Ring, Finger.Pinky]) {
  peaceGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}
peaceGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// Assemble all gestures into estimator
export const ALL_GESTURES = [
  helloGesture,
  yesGesture,
  noGesture,
  stopGesture,
  helpGesture,
  waterGesture,
  loveGesture,
  pleaseGesture,
  thankYouGesture,
  foodGesture,
  hungryGesture,
  doctorGesture,
  emergencyGesture,
  whereGesture,
  whatGesture,
  goodGesture,
  badGesture,
  friendGesture,
  painGesture,
  timeGesture,
  moreGesture,
  hospitalGesture,
  sorryGesture,
  youGesture,
  meGesture,
  familyGesture,
  callGesture,
  peaceGesture
];

// Initialize Fingerpose Gesture Estimator instance
export const gestureEstimator = new GestureEstimator(ALL_GESTURES, {
  HALF_CURL_START_LIMIT: 55.0,
  NO_CURL_START_LIMIT: 125.0
});

// ==========================================
// 2. Comprehensive Gesture Dictionary Metadata
// ==========================================
export const GESTURE_DICTIONARY = {
  Hello: { keyword: 'Hello', label: 'Open Palm (Hello / Namaste)', hindi: 'नमस्ते', category: 'Greetings', icon: '👋' },
  Yes: { keyword: 'Yes', label: 'Fist / Thumbs Up (Yes / Haan)', hindi: 'हाँ', category: 'Responses', icon: '✊' },
  No: { keyword: 'No', label: 'Two Fingers (No / Nahi)', hindi: 'नहीं', category: 'Responses', icon: '✌️' },
  Stop: { keyword: 'Stop', label: 'Flat Hand (Stop / Ruko)', hindi: 'रुको', category: 'Urgent', icon: '✋' },
  Help: { keyword: 'Help', label: 'Pointing (Help / Sahayata)', hindi: 'सहायता', category: 'Urgent', icon: '🆘' },
  Water: { keyword: 'Water', label: 'Tripataka / W-Hand (Water / Paani)', hindi: 'पानी', category: 'Essentials', icon: '💧' },
  Love: { keyword: 'Love', label: 'ILY Hand (I Love You / Pyar)', hindi: 'प्यार', category: 'Emotion', icon: '🤟' },
  Please: { keyword: 'Please', label: 'Open Chest (Please / Kripya)', hindi: 'कृपया', category: 'Courtesy', icon: '🙏' },
  Thank: { keyword: 'Thank', label: 'Chin Out (Thank You / Dhanyavaad)', hindi: 'धन्यवाद', category: 'Courtesy', icon: '🤲' },
  Food: { keyword: 'Food', label: 'O-Hand (Food / Khana)', hindi: 'खाना', category: 'Essentials', icon: '🍽️' },
  Hungry: { keyword: 'Hungry', label: 'Cupped Hand (Hungry / Bhookh)', hindi: 'भूख', category: 'Essentials', icon: '🤤' },
  Doctor: { keyword: 'Doctor', label: 'M-Hand (Doctor / Chikitsak)', hindi: 'चिकित्सक', category: 'Medical', icon: '🩺' },
  Emergency: { keyword: 'Emergency', label: 'E-Hand (Emergency / Aapatkaal)', hindi: 'आपातकाल', category: 'Medical', icon: '🚨' },
  Where: { keyword: 'Where', label: 'Palms Up (Where / Kahan)', hindi: 'कहाँ', category: 'Questions', icon: '❓' },
  What: { keyword: 'What', label: 'Shaking Palms (What / Kya)', hindi: 'क्या', category: 'Questions', icon: '🤷' },
  Good: { keyword: 'Good', label: 'Thumbs Up (Good / Accha)', hindi: 'अच्छा', category: 'Courtesy', icon: '👍' },
  Bad: { keyword: 'Bad', label: 'Thumbs Down (Bad / Bura)', hindi: 'बुरा', category: 'Courtesy', icon: '👎' },
  Friend: { keyword: 'Friend', label: 'Hooked Index (Friend / Dost)', hindi: 'दोस्त', category: 'Social', icon: '🤝' },
  Pain: { keyword: 'Pain', label: 'Pointing Inward (Pain / Dard)', hindi: 'दर्द', category: 'Medical', icon: '🤕' },
  Time: { keyword: 'Time', label: 'Wrist Tap (Time / Samay)', hindi: 'समय', category: 'Essentials', icon: '⏰' },
  More: { keyword: 'More', label: 'Fingertips Tap (More / Aur)', hindi: 'और', category: 'Essentials', icon: '➕' },
  Hospital: { keyword: 'Hospital', label: 'H-Hand (Hospital / Aspataal)', hindi: 'अस्पताल', category: 'Medical', icon: '🏥' },
  Sorry: { keyword: 'Sorry', label: 'Chest Circle (Sorry / Maaf)', hindi: 'माफ़', category: 'Courtesy', icon: '🙇' },
  You: { keyword: 'You', label: 'Pointing Forward (You / Aap)', hindi: 'आप', category: 'Pronouns', icon: '👉' },
  Me: { keyword: 'Me', label: 'Pointing Chest (Me / Main)', hindi: 'मैं', category: 'Pronouns', icon: '👈' },
  Family: { keyword: 'Family', label: 'F-Circle (Family / Parivaar)', hindi: 'परिवार', category: 'Social', icon: '👨‍👩‍👧‍👦' },
  Call: { keyword: 'Call', label: 'Phone Hand (Call / Phone)', hindi: 'फ़ोन', category: 'Social', icon: '🤙' },
  Peace: { keyword: 'Peace', label: 'Peace Sign (Peace / Shanti)', hindi: 'शांति', category: 'Social', icon: '✌️' }
};

/**
 * Classify live MediaPipe 3D Hand Landmarks using Fingerpose estimator
 * @param {Array<{x: number, y: number, z: number}>} landmarks - MediaPipe 21 landmarks
 * @param {'ISL'|'ASL'} mode - Sign Language mode
 * @returns {{ gesture: string, keyword: string|null, score: number }}
 */
export function classifyHandLandmarks(landmarks, mode = 'ISL') {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'No Hand in Frame', keyword: null, score: 0 };
  }

  try {
    // Convert MediaPipe landmarks {x, y, z} to Fingerpose format [x, y, z] in pixel scale
    const fpLandmarks = landmarks.map(p => [
      p.x * 640,
      p.y * 480,
      (p.z || 0) * 640
    ]);

    // Estimate gestures with minimum confidence score 7.0
    const estimation = gestureEstimator.estimate(fpLandmarks, 7.0);

    if (estimation && estimation.gestures && estimation.gestures.length > 0) {
      // Find highest confidence matching gesture
      let bestMatch = estimation.gestures[0];
      for (const g of estimation.gestures) {
        if (g.score > bestMatch.score) {
          bestMatch = g;
        }
      }

      const meta = GESTURE_DICTIONARY[bestMatch.name];
      if (meta) {
        const flag = mode === 'ISL' ? '🇮🇳' : '🇺🇸';
        const displayLabel = `${mode} ${meta.label} ${meta.icon}`;
        return {
          gesture: displayLabel,
          keyword: meta.keyword,
          score: Math.round(bestMatch.score * 10) / 10
        };
      }
    }
  } catch (err) {
    console.warn('[Fingerpose] Estimation notice:', err);
  }

  // Graceful fallback if no high-confidence trained gesture matched
  return {
    gesture: `${mode} Active Gesture ✋`,
    keyword: null,
    score: 0
  };
}
