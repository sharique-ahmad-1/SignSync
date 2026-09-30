/**
 * Sign Language MNIST Neural Network Inference Module
 * Model trained on 27,455 sign language gestures across 24 alphabet classes.
 */

const RAW_LABELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
export const SIGN_CLASSES = RAW_LABELS.map(raw => String.fromCharCode(65 + raw));

/**
 * Perform forward inference on a normalized 28x28 grayscale image float array (784 elements)
 * @param {Float32Array|number[]} input784 - 784 normalized pixel values [0..1]
 * @param {Object} modelWeights - { W1, b1, W2, b2, W3, b3 }
 * @returns {{ letter: string, classIndex: number, confidence: number, probabilities: number[] }}
 */
export function predictSignFromPixels(input784, modelWeights) {
  const { W1, b1, W2, b2, W3, b3 } = modelWeights;

  // Layer 1: 784 -> 512
  const hidden1Dim = b1[0].length;
  const a1 = new Float32Array(hidden1Dim);
  for (let j = 0; j < hidden1Dim; j++) {
    let sum = b1[0][j];
    for (let i = 0; i < 784; i++) {
      sum += input784[i] * W1[i][j];
    }
    a1[j] = Math.max(0, sum); // ReLU
  }

  // Layer 2: 512 -> 256
  const hidden2Dim = b2[0].length;
  const a2 = new Float32Array(hidden2Dim);
  for (let j = 0; j < hidden2Dim; j++) {
    let sum = b2[0][j];
    for (let i = 0; i < hidden1Dim; i++) {
      sum += a1[i] * W2[i][j];
    }
    a2[j] = Math.max(0, sum); // ReLU
  }

  // Layer 3: 256 -> 24
  const outDim = b3[0].length;
  const logits = new Float32Array(outDim);
  let maxLogit = -Infinity;
  for (let j = 0; j < outDim; j++) {
    let sum = b3[0][j];
    for (let i = 0; i < hidden2Dim; i++) {
      sum += a2[i] * W3[i][j];
    }
    logits[j] = sum;
    if (sum > maxLogit) maxLogit = sum;
  }

  // Softmax
  let sumExp = 0;
  const probs = new Float32Array(outDim);
  for (let j = 0; j < outDim; j++) {
    probs[j] = Math.exp(logits[j] - maxLogit);
    sumExp += probs[j];
  }
  for (let j = 0; j < outDim; j++) {
    probs[j] /= sumExp;
  }

  let bestIdx = 0;
  let bestProb = probs[0];
  for (let j = 1; j < outDim; j++) {
    if (probs[j] > bestProb) {
      bestProb = probs[j];
      bestIdx = j;
    }
  }

  return {
    letter: SIGN_CLASSES[bestIdx],
    classIndex: bestIdx,
    confidence: bestProb,
    probabilities: Array.from(probs)
  };
}
