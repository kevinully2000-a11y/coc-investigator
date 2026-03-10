import type { MoodType } from './types';

// ─── Audio Context Management ───
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeSounds = new Map<string, { nodes: AudioNode[]; stop: () => void }>();
let currentMood: MoodType = 'calm';
let isPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function getMasterGain(): GainNode {
  getAudioContext();
  return masterGain!;
}

// ─── Sound Generators ───
function createNoiseBuffer(ctx: AudioContext, duration: number = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createRain() {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, 4);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 8000;
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterGain());
  source.start();

  return {
    nodes: [source, filter, gain],
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      setTimeout(() => source.stop(), 2500);
    },
  };
}

function createDrone(freq: number, detune: number = 0) {
  const ctx = getAudioContext();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();

  osc1.type = 'sawtooth';
  osc1.frequency.value = freq;
  osc1.detune.value = detune;

  osc2.type = 'sine';
  osc2.frequency.value = freq * 0.5;
  osc2.detune.value = -detune;

  lfo.type = 'sine';
  lfo.frequency.value = 0.1 + Math.random() * 0.2;
  lfoGain.gain.value = 0.15;

  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 3);

  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(getMasterGain());

  osc1.start();
  osc2.start();
  lfo.start();

  return {
    nodes: [osc1, osc2, gain, lfo, lfoGain],
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      setTimeout(() => {
        osc1.stop();
        osc2.stop();
        lfo.stop();
      }, 2500);
    },
  };
}

function createWind() {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, 4);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 5;

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterGain());
  source.start();
  lfo.start();

  return {
    nodes: [source, filter, gain, lfo, lfoGain],
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      setTimeout(() => {
        source.stop();
        lfo.stop();
      }, 2500);
    },
  };
}

function createHeartbeat(bpm: number = 60) {
  const ctx = getAudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.2;
  master.connect(getMasterGain());

  let running = true;
  const interval = (60 / bpm) * 1000;

  const beat = () => {
    if (!running) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 40;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);

    setTimeout(() => {
      if (!running) return;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 45;
      gain2.gain.setValueAtTime(0.25, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc2.connect(gain2);
      gain2.connect(master);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.3);
    }, 120);

    setTimeout(beat, interval);
  };

  beat();

  return {
    nodes: [master],
    stop: () => { running = false; },
  };
}

function createDissonance() {
  const ctx = getAudioContext();
  const oscillators: OscillatorNode[] = [];
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 4);
  master.connect(getMasterGain());

  [55, 58.5, 82.4, 87.3, 110.5].forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = Math.random() * 20 - 10;
    osc.connect(master);
    osc.start();
    oscillators.push(osc);
  });

  return {
    nodes: [master, ...oscillators],
    stop: () => {
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
      setTimeout(() => oscillators.forEach((o) => o.stop()), 3500);
    },
  };
}

// ─── Mood Presets ───
const moodPresets: Record<MoodType, () => Map<string, { nodes: AudioNode[]; stop: () => void }>> = {
  calm: () => {
    const m = new Map();
    m.set('rain', createRain());
    m.set('drone', createDrone(65, 3));
    return m;
  },
  tense: () => {
    const m = new Map();
    m.set('wind', createWind());
    m.set('drone', createDrone(55, 8));
    m.set('rain', createRain());
    return m;
  },
  dread: () => {
    const m = new Map();
    m.set('drone', createDrone(40, 15));
    m.set('wind', createWind());
    m.set('heartbeat', createHeartbeat(70));
    return m;
  },
  panic: () => {
    const m = new Map();
    m.set('heartbeat', createHeartbeat(120));
    m.set('drone', createDrone(35, 25));
    m.set('dissonance', createDissonance());
    m.set('wind', createWind());
    return m;
  },
  otherworldly: () => {
    const m = new Map();
    m.set('dissonance', createDissonance());
    m.set('drone', createDrone(30, 30));
    return m;
  },
};

// ─── Public API ───
export function changeMood(mood: MoodType) {
  if (mood === currentMood && isPlaying) return;
  currentMood = mood;
  if (isPlaying) {
    stopAllSounds();
    activeSounds = moodPresets[mood]();
  }
}

export function startAmbient(mood?: MoodType) {
  if (mood) currentMood = mood;
  if (isPlaying) stopAllSounds();
  activeSounds = moodPresets[currentMood]();
  isPlaying = true;
}

export function stopAmbient() {
  stopAllSounds();
  isPlaying = false;
}

function stopAllSounds() {
  activeSounds.forEach((s) => s.stop());
  activeSounds.clear();
}

// ─── TTS via OpenAI API ───
// Cloud-based TTS: no model loading, <1s latency per sentence
let ttsReady = false;
let speechQueue: string[] = [];
let isSpeaking = false;
let speechEnabled = true;
let currentSourceNode: AudioBufferSourceNode | null = null;

// Pre-generation pipeline: fetch next audio while current plays
const readyBuffers: AudioBuffer[] = [];
let isGenerating = false;
let cancelled = false;
const BATCH_SENTENCES = 3;

export function isTTSLoaded(): boolean {
  return ttsReady;
}

export function getTTSLoadProgress(): number {
  return ttsReady ? 100 : 0;
}

/** Cloud TTS needs no model loading — just mark ready */
export async function initTTS(onProgress?: (p: number) => void): Promise<void> {
  if (ttsReady) return;
  ttsReady = true;
  onProgress?.(100);
  console.log('[TTS] Cloud TTS ready (OpenAI)');
}

/** Call the /api/tts serverless function and decode the MP3 response */
async function generateSpeechAPI(text: string, signal?: AbortSignal): Promise<AudioBuffer> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) throw new Error(`TTS API ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const ctx = getAudioContext();
  return ctx.decodeAudioData(arrayBuffer);
}

export function setSpeechEnabled(enabled: boolean) {
  speechEnabled = enabled;
  if (!enabled) {
    stopSpeech();
  }
}

// ─── Stream-to-Speech ───
// Accumulates streamed text, detects sentence boundaries, queues for TTS
let streamBuffer = '';
let spokenSentenceCount = 0; // Track how many sentences we've already queued

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*[A-Z_]+:.*?\*\*/g, '') // Remove metadata tags
    .replace(/\*\*/g, '')
    .replace(/^\d+\.\s+.+$/gm, '') // Remove numbered lists (choices)
    .replace(/\[.*?\]/g, '')
    .replace(/#+\s*/g, '')
    .replace(/\bSt\./g, 'St')
    .replace(/\bDr\./g, 'Dr')
    .replace(/\bMr\./g, 'Mr')
    .replace(/\bMrs\./g, 'Mrs')
    .replace(/\bMs\./g, 'Ms')
    .replace(/\bProf\./g, 'Prof')
    .replace(/\bVol\./g, 'Vol')
    .replace(/\bNo\./g, 'No')
    .replace(/\be\.g\./g, 'eg')
    .replace(/\bi\.e\./g, 'ie')
    .trim();
}

function extractSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.map(s => s.trim()).filter(s => s.length > 5);
}

export function feedStreamingText(delta: string) {
  if (!speechEnabled) return;
  streamBuffer += delta;

  const cleaned = cleanForSpeech(streamBuffer);
  const allSentences = extractSentences(cleaned);

  // Only queue NEW sentences we haven't spoken yet
  const newSentences = allSentences.slice(spokenSentenceCount);
  // Don't queue the very last sentence yet — it might still be incomplete
  // unless it clearly ends with punctuation and has more text after it
  const safeToQueue = newSentences.length > 1 ? newSentences.slice(0, -1) : [];

  if (safeToQueue.length > 0) {
    speechQueue.push(...safeToQueue);
    spokenSentenceCount += safeToQueue.length;
    processSpeechQueue();
  }
}

export function flushStreamingText() {
  if (!speechEnabled) { resetStreamBuffer(); return; }

  const cleaned = cleanForSpeech(streamBuffer);
  const allSentences = extractSentences(cleaned);
  const remaining = allSentences.slice(spokenSentenceCount);
  if (remaining.length > 0) {
    speechQueue.push(...remaining);
    processSpeechQueue();
  } else {
    // Maybe there's a trailing fragment without punctuation
    const lastPunctuation = cleaned.search(/[.!?][^.!?]*$/);
    const trailing = lastPunctuation >= 0
      ? cleaned.slice(lastPunctuation + 1).trim()
      : cleaned.trim();
    if (trailing.length > 5 && spokenSentenceCount === 0) {
      // No sentences were detected at all, speak the whole thing
      speechQueue.push(trailing);
      processSpeechQueue();
    }
  }

  resetStreamBuffer();
}

export function resetStreamBuffer() {
  streamBuffer = '';
  spokenSentenceCount = 0;
}

// Legacy function — still useful for one-shot TTS
export function speakText(text: string) {
  if (!speechEnabled) return;
  const cleaned = cleanForSpeech(text);
  if (!cleaned) return;
  const sentences = extractSentences(cleaned);
  if (sentences.length === 0) return;
  speechQueue.push(...sentences);
  processSpeechQueue();
}

// ─── Playback Engine ───

/** Take a batch of sentences from the queue */
function takeBatch(): string | null {
  if (speechQueue.length === 0) return null;
  const count = Math.min(BATCH_SENTENCES, speechQueue.length);
  return speechQueue.splice(0, count).join(' ');
}

/** Fire-and-forget: send text to API, handle result when it arrives */
function requestGeneration(text: string, purpose: 'preGen' | 'play') {
  if (!ttsReady) return;
  isGenerating = true;
  cancelled = false;

  generateSpeechAPI(text).then(audioBuffer => {
    isGenerating = false;
    if (cancelled || !speechEnabled) return;

    if (purpose === 'preGen') {
      readyBuffers.push(audioBuffer);
      pumpGenerationPipeline();
      if (!isSpeaking) processSpeechQueue();
    } else {
      playBuffer(audioBuffer);
    }
  }).catch(err => {
    isGenerating = false;
    if (cancelled) return;
    console.error('[TTS] API error:', err);
    // Fall back to browser speech on API failure
    if (purpose === 'play') isSpeaking = false;
    processSpeechQueueFallback();
  });
}

/** Keep the API busy generating ahead of playback */
function pumpGenerationPipeline() {
  if (isGenerating || !ttsReady || !speechEnabled) return;
  if (speechQueue.length === 0) return;
  const text = takeBatch();
  if (text) requestGeneration(text, 'preGen');
}

function playBuffer(audioBuffer: AudioBuffer) {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  const gain = ctx.createGain();
  gain.gain.value = 0.9;
  source.connect(gain);
  gain.connect(ctx.destination);

  currentSourceNode = source;
  isSpeaking = true;

  // Start generating next audio while this plays
  pumpGenerationPipeline();

  source.onended = () => {
    currentSourceNode = null;
    isSpeaking = false;
    processSpeechQueue();
  };

  source.start();
}

function processSpeechQueue() {
  if (isSpeaking || (speechQueue.length === 0 && readyBuffers.length === 0)) return;
  if (!ttsReady) {
    processSpeechQueueFallback();
    return;
  }

  // Play next pre-generated buffer immediately (no gap)
  if (readyBuffers.length > 0) {
    const buf = readyBuffers.shift()!;
    if (speechEnabled) {
      playBuffer(buf);
      return;
    }
    return;
  }

  // No pre-generated buffer — request directly
  const text = takeBatch();
  if (!text) return;
  isSpeaking = true;
  requestGeneration(text, 'play');
}

// Browser TTS fallback (used if Kokoro model hasn't loaded yet)
function processSpeechQueueFallback() {
  if (isSpeaking || speechQueue.length === 0) return;
  if (!window.speechSynthesis) return;

  isSpeaking = true;
  const text = speechQueue.shift()!;
  const utterance = new SpeechSynthesisUtterance(text);

  const voice = window.speechSynthesis.getVoices().find(
    (v) =>
      v.name.includes('Daniel') ||
      v.name.includes('Google UK English Male') ||
      v.name.includes('Male')
  );
  if (voice) utterance.voice = voice;

  utterance.rate = 0.85;
  utterance.pitch = 0.8;
  utterance.volume = 0.9;

  utterance.onend = () => {
    isSpeaking = false;
    processSpeechQueueFallback();
  };
  utterance.onerror = () => {
    isSpeaking = false;
    processSpeechQueueFallback();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  // Stop current audio playback
  if (currentSourceNode) {
    try { currentSourceNode.stop(); } catch { /* already stopped */ }
    currentSourceNode = null;
  }
  // Cancel any in-flight API requests
  cancelled = true;
  isGenerating = false;
  // Stop browser TTS fallback
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  speechQueue = [];
  readyBuffers.length = 0;
  isSpeaking = false;
  resetStreamBuffer();
}
