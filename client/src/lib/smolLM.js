import { pipeline, env } from '@xenova/transformers';
import { reorderToISLGrammar } from './avatarAssets';

// Configure Transformers.js for browser environment
if (env) {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
}

let generatorInstance = null;
let isLoadingModel = false;
let modelReady = false;
let modelProgress = 0;
let progressListeners = [];

export function subscribeModelProgress(listener) {
  progressListeners.push(listener);
  listener({ ready: modelReady, loading: isLoadingModel, progress: modelProgress });
  return () => {
    progressListeners = progressListeners.filter(l => l !== listener);
  };
}

function notifyListeners(state) {
  progressListeners.forEach(l => l(state));
}

/**
 * Asynchronously load Xenova/SmolLM2-135M-Instruct model
 */
export async function loadSmolLMModel() {
  if (generatorInstance) return generatorInstance;
  if (isLoadingModel) return null;

  isLoadingModel = true;
  modelProgress = 5;
  notifyListeners({ ready: false, loading: true, progress: modelProgress, status: 'Initializing Transformer Runtime...' });

  try {
    console.log('[SmolLM2] Starting async load of Xenova/SmolLM2-135M-Instruct...');

    // Load lightweight 135M model with quantized weights for rapid browser execution
    const pipe = await pipeline('text-generation', 'Xenova/SmolLM2-135M-Instruct', {
      progress_callback: (info) => {
        if (info.status === 'progress' && info.progress) {
          modelProgress = Math.round(info.progress);
          notifyListeners({
            ready: false,
            loading: true,
            progress: modelProgress,
            status: `Downloading SmolLM2 weights (${modelProgress}%)...`
          });
        }
      }
    });

    generatorInstance = pipe;
    modelReady = true;
    isLoadingModel = false;
    modelProgress = 100;

    notifyListeners({
      ready: true,
      loading: false,
      progress: 100,
      status: 'SmolLM2 Offline Model Ready'
    });

    console.log('[SmolLM2] Model loaded and ready for in-browser NLP inference.');
    return generatorInstance;
  } catch (error) {
    console.warn('[SmolLM2] Transformers.js direct load notice (fallback active):', error);
    isLoadingModel = false;
    notifyListeners({
      ready: false,
      loading: false,
      progress: 0,
      status: 'Ready (Heuristic Grammar Engine Active)'
    });
    return null;
  }
}

/**
 * Intelligent sign keyword grammar reconstruction
 * Maps raw sign tokens (e.g. ['Me', 'Hungry', 'Food']) into a natural English sentence.
 */
export async function formulateGrammarSentence(keywords = []) {
  if (!keywords || keywords.length === 0) return '';

  const cleanKeywords = keywords.map(k => String(k).trim()).filter(Boolean);
  if (cleanKeywords.length === 0) return '';

  // 1. If SmolLM2 model is initialized, run local transformer inference
  if (generatorInstance) {
    try {
      const prompt = `<|im_start|>system\nYou are an assistive sign language interpreter. Convert the sign language keywords into one natural, fluent English sentence. Output ONLY the sentence without commentary.<|im_end|>\n<|im_start|>user\nSign keywords: ${cleanKeywords.join(', ')}<|im_end|>\n<|im_start|>assistant\n`;

      const result = await generatorInstance(prompt, {
        max_new_tokens: 30,
        temperature: 0.2,
        do_sample: false,
        return_full_text: false
      });

      if (result && result[0] && result[0].generated_text) {
        let sentence = result[0].generated_text.trim();
        // Clean up any stray tokens
        sentence = sentence.replace(/<\|.*?\|>/g, '').trim();
        if (sentence.length > 3) {
          return sentence;
        }
      }
    } catch (inferErr) {
      console.warn('[SmolLM2] Inference fallback to heuristic rule engine:', inferErr);
    }
  }

  // 2. High-speed intelligent heuristic grammar rules (guaranteed 0ms offline response)
  return heuristicSentenceFormulation(cleanKeywords);
}

/**
 * Extracts Indian Sign Language (ISL) keywords and glosses from an English sentence (Task 3)
 * Uses SmolLM2-135M when available, and falls back to our robust ISL grammar engine.
 */
export async function extractISLKeywords(sentence) {
  if (!sentence || !sentence.trim()) return [];

  // 1. If SmolLM2 model is initialized in browser
  if (generatorInstance) {
    try {
      const prompt = `<|im_start|>system\nYou are an assistive Indian Sign Language (ISL) translator. Extract the sign keywords from the sentence in ISL order (Subject-Object-Verb). Output ONLY comma-separated uppercase keywords like: HELLO, WATER, HELP.<|im_end|>\n<|im_start|>user\nSentence: "${sentence}"<|im_end|>\n<|im_start|>assistant\n`;

      const result = await generatorInstance(prompt, {
        max_new_tokens: 25,
        temperature: 0.1,
        do_sample: false,
        return_full_text: false
      });

      if (result && result[0] && result[0].generated_text) {
        let text = result[0].generated_text.trim();
        text = text.replace(/<\|.*?\|>/g, '').trim();
        const extracted = text
          .split(/[,;\n]+/)
          .map(k => k.trim().toLowerCase())
          .filter(Boolean);
        if (extracted.length > 0) {
          console.log('[SmolLM2] Extracted ISL keywords:', extracted);
          return extracted;
        }
      }
    } catch (err) {
      console.warn('[SmolLM2] Keyword extraction notice (using grammar engine):', err);
    }
  }

  // 2. High-speed heuristic ISL grammar re-ordering and stop word elimination
  const sanitized = sentence
    .toLowerCase()
    .replace(/n't/g, ' not')
    .replace(/'m/g, ' me')
    .replace(/'re/g, ' are')
    .replace(/'ve/g, ' have')
    .replace(/[^\w\s]/g, ' ');

  const words = sanitized.split(/\s+/).filter(Boolean);
  return reorderToISLGrammar(words);
}

/**
 * Heuristic grammatical structure builder (Subject-Verb-Object restoration)
 */
function heuristicSentenceFormulation(tokens) {
  const lowerTokens = tokens.map(t => t.toLowerCase());

  // Rule sets for common ISL/ASL patterns
  const tokenSet = new Set(lowerTokens);

  if (tokenSet.has('me') && tokenSet.has('hungry') && tokenSet.has('food')) {
    return 'I am hungry and would like some food.';
  }
  if (tokenSet.has('me') && tokenSet.has('hungry')) {
    return 'I am feeling hungry.';
  }
  if (tokenSet.has('need') && tokenSet.has('water')) {
    return 'I need some drinking water, please.';
  }
  if (tokenSet.has('help') && tokenSet.has('me')) {
    return 'Can you please help me?';
  }
  if (tokenSet.has('where') && tokenSet.has('bathroom') || tokenSet.has('washroom')) {
    return 'Where is the nearest restroom?';
  }
  if (tokenSet.has('hello') && tokenSet.has('friend')) {
    return 'Hello my friend, nice to see you!';
  }
  if (tokenSet.has('thank') || tokenSet.has('thanks')) {
    return 'Thank you very much for your help!';
  }
  if (tokenSet.has('how') && tokenSet.has('you')) {
    return 'How are you doing today?';
  }
  if (tokenSet.has('yes') && tokenSet.has('understand')) {
    return 'Yes, I understand clearly.';
  }
  if (tokenSet.has('no') && tokenSet.has('understand')) {
    return 'I did not understand, could you please repeat?';
  }

  // General token reconstructor
  let subject = 'I';
  let verb = '';
  let objects = [];

  tokens.forEach(tok => {
    const l = tok.toLowerCase();
    if (['me', 'i', 'my'].includes(l)) {
      subject = 'I';
    } else if (['you', 'your'].includes(l)) {
      subject = 'You';
    } else if (['want', 'need', 'like', 'see', 'feel', 'have'].includes(l)) {
      verb = l;
    } else {
      objects.push(tok);
    }
  });

  if (!verb) {
    verb = 'am communicating about';
  }

  const objPhrase = objects.join(' ');
  const raw = `${subject} ${verb} ${objPhrase}`.trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1) + '.';
}

/**
 * Speak the formulated sentence out loud using SpeechSynthesis
 */
export function speakFormulatedSentence(sentence) {
  if (!sentence || typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel(); // Stop prior audio
  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  window.speechSynthesis.speak(utterance);
}
