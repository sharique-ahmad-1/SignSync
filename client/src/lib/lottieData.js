// Self-contained, lightweight Lottie JSON animations for offline & instant rendering

// 1. Radar Listening Pulse Animation (For Mic & Hearing User)
export const radarListeningLottie = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 120,
  h: 120,
  nm: "RadarPulse",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Ring1",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [90] }, { t: 50, s: [0] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [20, 20, 100] }, { t: 50, s: [140, 140, 100] }] }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [60, 60] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.95, 0.25, 0.4, 1] },
          w: { a: 0, k: 3 },
          o: { a: 0, k: 100 }
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "CenterDot",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [80, 80, 100] }, { t: 30, s: [110, 110, 100] }, { t: 60, s: [80, 80, 100] }] }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [22, 22] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.95, 0.25, 0.4, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
};

// 2. AI Processing Neural Wave Animation (For SmolLM2 & NLP formulation)
export const aiProcessingLottie = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 120,
  h: 120,
  nm: "AIProcessing",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "NeuralOrbit1",
      sr: 1,
      ks: {
        o: { a: 0, k: 80 },
        r: { a: 1, k: [{ t: 0, s: [0] }, { t: 60, s: [360] }] },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [70, 36] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.38, 0.4, 0.95, 1] },
          w: { a: 0, k: 2.5 },
          o: { a: 0, k: 100 }
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "NeuralOrbit2",
      sr: 1,
      ks: {
        o: { a: 0, k: 80 },
        r: { a: 1, k: [{ t: 0, s: [60] }, { t: 60, s: [420] }] },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [70, 36] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.06, 0.72, 0.83, 1] },
          w: { a: 0, k: 2.5 },
          o: { a: 0, k: 100 }
        }
      ]
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "CoreNode",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [70, 70, 100] }, { t: 30, s: [115, 115, 100] }, { t: 60, s: [70, 70, 100] }] }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [18, 18] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.45, 0.45, 0.98, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
};

// 3. MediaPipe Hand Vision Tracker Lottie
export const handTrackerLottie = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 120,
  h: 120,
  nm: "HandVision",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Reticle",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [60] }, { t: 30, s: [100] }, { t: 60, s: [60] }] },
        r: { a: 1, k: [{ t: 0, s: [0] }, { t: 60, s: [180] }] },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [56, 56] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.02, 0.71, 0.83, 1] },
          w: { a: 0, k: 2 },
          o: { a: 0, k: 100 }
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Joint1",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [80, 80, 100] }, { t: 30, s: [120, 120, 100] }, { t: 60, s: [80, 80, 100] }] }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [14, 14] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.06, 0.72, 0.51, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
};
