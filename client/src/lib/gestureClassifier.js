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

// ==========================================
// PHASE 10: Massive Vocabulary Injection (12 New High-Impact Signs)
// ==========================================

// 29. FIRE / AANG (Wiggling Fingers Upward)
const fireGesture = new GestureDescription('Fire');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  fireGesture.addCurl(finger, FingerCurl.HalfCurl, 0.9);
  fireGesture.addCurl(finger, FingerCurl.NoCurl, 0.7);
  fireGesture.addDirection(finger, FingerDirection.VerticalUp, 1.0);
  fireGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.7);
  fireGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.7);
}
fireGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
fireGesture.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 0.8);

// 30. POLICE / PULIS (C-Hand Badge Tap on Chest)
const policeGesture = new GestureDescription('Police');
policeGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
policeGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
policeGesture.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.8);
policeGesture.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.8);
for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  policeGesture.addCurl(finger, FingerCurl.HalfCurl, 1.0);
  policeGesture.addDirection(finger, FingerDirection.HorizontalLeft, 0.7);
  policeGesture.addDirection(finger, FingerDirection.HorizontalRight, 0.7);
}

// 31. HOME / GHAR (Flat Hand Touching Cheek then Jaw)
const homeGesture = new GestureDescription('Home');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  homeGesture.addCurl(finger, FingerCurl.HalfCurl, 1.0);
  homeGesture.addCurl(finger, FingerCurl.FullCurl, 0.7);
  homeGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.9);
  homeGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.9);
}
homeGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
homeGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.7);

// 32. TOILET / SHAUCHALAY (T-Hand Shake)
const toiletGesture = new GestureDescription('Toilet');
toiletGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
toiletGesture.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 0.9);
toiletGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 0.8);
toiletGesture.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.9);
toiletGesture.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.9);
for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  toiletGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}

// 33. DRINK / PEENA (C-Hand Tilt to Mouth)
const drinkGesture = new GestureDescription('Drink');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  drinkGesture.addCurl(finger, FingerCurl.HalfCurl, 1.0);
  drinkGesture.addDirection(finger, FingerDirection.VerticalUp, 0.8);
  drinkGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.7);
  drinkGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.7);
}
drinkGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.9);
drinkGesture.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 0.8);

// 34. MEDICINE / DAWAI (Pinch Fingers Palm Tap)
const medicineGesture = new GestureDescription('Medicine');
medicineGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
medicineGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 0.9);
medicineGesture.addCurl(Finger.Middle, FingerCurl.HalfCurl, 1.0);
medicineGesture.addDirection(Finger.Middle, FingerDirection.VerticalDown, 0.8);
medicineGesture.addDirection(Finger.Middle, FingerDirection.DiagonalDownLeft, 0.7);
medicineGesture.addDirection(Finger.Middle, FingerDirection.DiagonalDownRight, 0.7);
for (let finger of [Finger.Ring, Finger.Pinky]) {
  medicineGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}

// 35. NEED / ZAROORAT (Bent Index Pulling Down)
const needGesture = new GestureDescription('Need');
needGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
needGesture.addDirection(Finger.Index, FingerDirection.VerticalDown, 0.9);
needGesture.addDirection(Finger.Index, FingerDirection.DiagonalDownLeft, 0.7);
needGesture.addDirection(Finger.Index, FingerDirection.DiagonalDownRight, 0.7);
for (let finger of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  needGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}
needGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);

// 36. DANGER / KHATARA (Rapid Two-Hand Clap Posture)
const dangerGesture = new GestureDescription('Danger');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  dangerGesture.addCurl(finger, FingerCurl.NoCurl, 1.0);
  dangerGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 1.0);
  dangerGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 1.0);
}
dangerGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);

// 37. SICK / BIMAAR (Claw Hand on Forehead)
const sickGesture = new GestureDescription('Sick');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  sickGesture.addCurl(finger, FingerCurl.HalfCurl, 1.0);
  sickGesture.addDirection(finger, FingerDirection.DiagonalDownLeft, 0.8);
  sickGesture.addDirection(finger, FingerDirection.DiagonalDownRight, 0.8);
}
sickGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.9);
sickGesture.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 0.8);
sickGesture.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 0.8);

// 38. EAT / KHAO (Bunched Fingers to Mouth Repeatedly)
const eatGesture = new GestureDescription('Eat');
for (let finger of [Finger.Thumb, Finger.Index, Finger.Middle]) {
  eatGesture.addCurl(finger, FingerCurl.HalfCurl, 1.0);
  eatGesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.8);
  eatGesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.8);
}
eatGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
eatGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

// 39. SCHOOL / VIDYALAYA (Open Book Hand Shape)
const schoolGesture = new GestureDescription('School');
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  schoolGesture.addCurl(finger, FingerCurl.NoCurl, 1.0);
  schoolGesture.addDirection(finger, FingerDirection.HorizontalLeft, 0.7);
  schoolGesture.addDirection(finger, FingerDirection.HorizontalRight, 0.7);
  schoolGesture.addDirection(finger, FingerDirection.VerticalUp, 0.6);
}
schoolGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
schoolGesture.addDirection(Finger.Thumb, FingerDirection.DiagonalUpLeft, 0.8);
schoolGesture.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 0.8);

// 40. MONEY / PAISA (Rubbing Thumb and Fingers Together)
const moneyGesture = new GestureDescription('Money');
moneyGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
moneyGesture.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 0.8);
moneyGesture.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 0.8);
moneyGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
moneyGesture.addCurl(Finger.Middle, FingerCurl.HalfCurl, 1.0);
for (let finger of [Finger.Ring, Finger.Pinky]) {
  moneyGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}

// ==========================================
// Assemble ALL 40 gestures into estimator
// ==========================================
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
  peaceGesture,
  // Phase 10: 12 New High-Impact Signs
  fireGesture,
  policeGesture,
  homeGesture,
  toiletGesture,
  drinkGesture,
  medicineGesture,
  needGesture,
  dangerGesture,
  sickGesture,
  eatGesture,
  schoolGesture,
  moneyGesture
];

// Initialize Fingerpose Gesture Estimator instance
export const gestureEstimator = new GestureEstimator(ALL_GESTURES, {
  HALF_CURL_START_LIMIT: 55.0,
  NO_CURL_START_LIMIT: 125.0
});

// ==========================================
// 2. Comprehensive Gesture Dictionary Metadata (40 Signs with ISL/ASL Dual Labels)
// ==========================================

// ISL-specific and ASL-specific label overrides for dual-mode display
const ISL_LABELS = {
  Hello: 'Open Palm (Namaste) 🇮🇳', Yes: 'Mushti Nod (Haan) 🇮🇳', No: 'Finger Snap (Nahi) 🇮🇳',
  Stop: 'Pataka Forward (Ruko) 🇮🇳', Help: 'Suchi Point (Sahayata) 🇮🇳', Water: 'Tripataka (Paani) 🇮🇳',
  Fire: 'Wiggling Flames (Aang) 🇮🇳', Police: 'Badge Tap (Pulis) 🇮🇳', Home: 'Cheek Touch (Ghar) 🇮🇳',
  Toilet: 'T-Shake (Shauchalay) 🇮🇳', Drink: 'Cup Tilt (Peena) 🇮🇳', Medicine: 'Palm Pinch (Dawai) 🇮🇳',
  Need: 'Hook Pull (Zaroorat) 🇮🇳', Danger: 'Alert Clap (Khatara) 🇮🇳', Sick: 'Claw Forehead (Bimaar) 🇮🇳',
  Eat: 'Bunched Mouth (Khao) 🇮🇳', School: 'Book Shape (Vidyalaya) 🇮🇳', Money: 'Thumb Rub (Paisa) 🇮🇳'
};
const ASL_LABELS = {
  Hello: 'Forehead Salute (Hello) 🇺🇸', Yes: 'S-Hand Nod (Yes) 🇺🇸', No: 'Two-Finger Snap (No) 🇺🇸',
  Stop: 'B-Hand Strike (Stop) 🇺🇸', Help: 'A-On-Palm Lift (Help) 🇺🇸', Water: 'W-Chin Tap (Water) 🇺🇸',
  Fire: 'Alternating 5 (Fire) 🇺🇸', Police: 'C-Hand Badge (Police) 🇺🇸', Home: 'Kiss-Jaw (Home) 🇺🇸',
  Toilet: 'T-Shake (Toilet) 🇺🇸', Drink: 'C-Tilt Mouth (Drink) 🇺🇸', Medicine: 'Middle Tap Palm (Medicine) 🇺🇸',
  Need: 'X-Pull Down (Need) 🇺🇸', Danger: 'A-Thrust (Danger) 🇺🇸', Sick: '5-Forehead (Sick) 🇺🇸',
  Eat: 'Flat O-Mouth (Eat) 🇺🇸', School: 'Clap Horizontal (School) 🇺🇸', Money: 'Flat-On-Palm Tap (Money) 🇺🇸'
};

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
  Peace: { keyword: 'Peace', label: 'Peace Sign (Peace / Shanti)', hindi: 'शांति', category: 'Social', icon: '✌️' },
  // Phase 10: 12 New High-Impact Signs
  Fire: { keyword: 'Fire', label: 'Wiggling Flames (Fire / Aang)', hindi: 'आग', category: 'Emergency', icon: '🔥' },
  Police: { keyword: 'Police', label: 'Badge Tap (Police / Pulis)', hindi: 'पुलिस', category: 'Emergency', icon: '👮' },
  Home: { keyword: 'Home', label: 'Cheek-Jaw Touch (Home / Ghar)', hindi: 'घर', category: 'Places', icon: '🏠' },
  Toilet: { keyword: 'Toilet', label: 'T-Shake (Toilet / Shauchalay)', hindi: 'शौचालय', category: 'Essentials', icon: '🚻' },
  Drink: { keyword: 'Drink', label: 'Cup Tilt (Drink / Peena)', hindi: 'पीना', category: 'Essentials', icon: '🥤' },
  Medicine: { keyword: 'Medicine', label: 'Palm Pinch (Medicine / Dawai)', hindi: 'दवाई', category: 'Medical', icon: '💊' },
  Need: { keyword: 'Need', label: 'Hook Pull (Need / Zaroorat)', hindi: 'ज़रूरत', category: 'Essentials', icon: '🫴' },
  Danger: { keyword: 'Danger', label: 'Alert Clap (Danger / Khatara)', hindi: 'ख़तरा', category: 'Emergency', icon: '⚠️' },
  Sick: { keyword: 'Sick', label: 'Claw Forehead (Sick / Bimaar)', hindi: 'बीमार', category: 'Medical', icon: '🤒' },
  Eat: { keyword: 'Eat', label: 'Bunched Mouth (Eat / Khao)', hindi: 'खाओ', category: 'Essentials', icon: '🍴' },
  School: { keyword: 'School', label: 'Book Shape (School / Vidyalaya)', hindi: 'विद्यालय', category: 'Places', icon: '🏫' },
  Money: { keyword: 'Money', label: 'Thumb Rub (Money / Paisa)', hindi: 'पैसा', category: 'Essentials', icon: '💰' }
};

// ==========================================
// 3. PHASE 11: Golden Demo Sequence Engine
// ==========================================

/**
 * Golden Demo Sequence Matcher
 * Matches specific token sequences to hardcoded "perfect" sentences for live demo.
 * Returns null if no golden path matches (so NLP fallback continues).
 */
export const GOLDEN_DEMO_SEQUENCES = [
  {
    id: 'A',
    name: 'Greeting + Help',
    triggers: ['Hello', 'Help'],
    alsoMatch: [
      ['Help', 'Hello'], 
      ['Hello', 'Me', 'Help'], 
      ['Hello', 'Need', 'Help'], 
      ['Hello', 'Please', 'Help'],
      ['Me', 'Help', 'Hello']
    ],
    sentence: 'Hello, I need help immediately.',
    priority: 10
  },
  {
    id: 'B',
    name: 'Water Request',
    triggers: ['Water', 'Where'],
    alsoMatch: [
      ['Where', 'Water'], 
      ['Water', 'Drink', 'Where'], 
      ['Drink', 'Where'], 
      ['Where', 'Drink', 'Water'],
      ['Water', 'Need', 'Where']
    ],
    sentence: 'Where is the drinking water?',
    priority: 10
  },
  {
    id: 'C',
    name: 'Doctor Request',
    triggers: ['Emergency', 'Doctor'],
    alsoMatch: [
      ['Doctor', 'Emergency'], 
      ['Please', 'Doctor'], 
      ['Doctor', 'Please'], 
      ['Help', 'Doctor'], 
      ['Emergency', 'Please'],
      ['Doctor', 'Need'],
      ['Doctor', 'Help']
    ],
    sentence: 'Please call a doctor.',
    priority: 10
  },
  {
    id: 'D',
    name: 'Emergency Fire',
    triggers: ['Fire', 'Help'],
    alsoMatch: [['Fire', 'Emergency'], ['Fire', 'Danger'], ['Fire', 'Call', 'Help']],
    sentence: 'There is a fire! Please help immediately!',
    priority: 9
  },
  {
    id: 'E',
    name: 'Police Request',
    triggers: ['Police', 'Call'],
    alsoMatch: [['Call', 'Police'], ['Help', 'Police'], ['Please', 'Police']],
    sentence: 'Please call the police immediately.',
    priority: 9
  },
  {
    id: 'F',
    name: 'Medicine Request',
    triggers: ['Medicine', 'Need'],
    alsoMatch: [['Need', 'Medicine'], ['Sick', 'Medicine'], ['Pain', 'Medicine']],
    sentence: 'I need my medicine, please.',
    priority: 8
  },
  {
    id: 'G',
    name: 'Toilet Request',
    triggers: ['Toilet', 'Where'],
    alsoMatch: [['Where', 'Toilet'], ['Need', 'Toilet']],
    sentence: 'Where is the nearest toilet?',
    priority: 8
  },
  {
    id: 'H',
    name: 'Hungry + Food',
    triggers: ['Hungry', 'Food'],
    alsoMatch: [['Food', 'Hungry'], ['Eat', 'Hungry'], ['Hungry', 'Eat']],
    sentence: 'I am hungry, please give me some food.',
    priority: 7
  },
  {
    id: 'I',
    name: 'Home Request',
    triggers: ['Home', 'Please'],
    alsoMatch: [['Please', 'Home'], ['Home', 'Need'], ['Want', 'Home']],
    sentence: 'Please take me home.',
    priority: 7
  }
];

/**
 * Match a token array against the golden demo sequences.
 * @param {string[]} tokens - Array of detected keywords
 * @returns {{ sentence: string, sequenceId: string, name: string } | null}
 */
export function matchGoldenSequence(tokens) {
  if (!tokens || tokens.length < 2) return null;

  const tokenSet = new Set(tokens.map(t => t.toLowerCase()));

  let bestMatch = null;
  let bestPriority = -1;

  for (const seq of GOLDEN_DEMO_SEQUENCES) {
    // Check primary trigger
    const primaryMatch = seq.triggers.every(t => tokenSet.has(t.toLowerCase()));
    if (primaryMatch && seq.priority > bestPriority) {
      bestMatch = seq;
      bestPriority = seq.priority;
      continue;
    }
    // Check alternative trigger patterns
    for (const alt of seq.alsoMatch) {
      const altMatch = alt.every(t => tokenSet.has(t.toLowerCase()));
      if (altMatch && seq.priority > bestPriority) {
        bestMatch = seq;
        bestPriority = seq.priority;
        break;
      }
    }
  }

  if (bestMatch) {
    return {
      sentence: bestMatch.sentence,
      sequenceId: bestMatch.id,
      name: bestMatch.name
    };
  }
  return null;
}

/**
 * Classify live MediaPipe 3D Hand Landmarks using Fingerpose estimator
 * Supports ISL/ASL dual-mode with mode-specific display labels.
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

    // Estimate gestures with minimum confidence score 6.5 (lowered from 7.0 for expanded vocab)
    const estimation = gestureEstimator.estimate(fpLandmarks, 6.5);

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
        // ISL/ASL dual-mode label resolution
        const modeLabels = mode === 'ISL' ? ISL_LABELS : ASL_LABELS;
        const modeLabel = modeLabels[bestMatch.name] || `${meta.label} ${meta.icon}`;
        const displayLabel = `${mode} ${modeLabel}`;
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
