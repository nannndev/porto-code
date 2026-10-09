// utils/audioUtils.ts

// MASTER CONTROL FOR SOUNDS
const SOUNDS_ENABLED = true;

let isMuted = false;

// Web Audio API context (created lazily on first user interaction)
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    try {
      // @ts-ignore - for older browsers
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Web Audio API not supported in this browser.');
      return null;
    }
  }
  return audioContext;
}

// ---------------------------------------------------------------------------
// Sound design
// ---------------------------------------------------------------------------
// UI sounds are synthesized with the Web Audio API (no audio files to load).
// They are built to stay out of the way:
// - soft waveforms (sine/triangle) and filtered noise "ticks" instead of raw
//   square/sawtooth waves, which sound buzzy;
// - a short attack plus exponential decay on every voice, so nothing starts
//   or ends with an audible click;
// - notes picked from one pentatonic scale, so overlapping sounds stay in tune;
// - a quiet master bus with a compressor, so bursts of sounds never clip.

interface ToneVoice {
  kind: 'tone';
  wave: 'sine' | 'triangle';
  frequency: number;
  frequencyEnd?: number; // Optional pitch glide over the decay
  gain: number;
  attack?: number; // seconds
  decay: number; // seconds
  delay?: number; // seconds after the sound starts
  overtone?: number; // Relative level of a soft octave partial, for bell-like tones
}

interface NoiseVoice {
  kind: 'noise';
  filter: BiquadFilterType;
  frequency: number;
  q?: number;
  gain: number;
  attack?: number;
  decay: number;
  delay?: number;
}

type Voice = ToneVoice | NoiseVoice;

// Notes (Hz) from a D major pentatonic scale.
const NOTE = {
  D4: 293.66, E4: 329.63, A4: 440.0, B4: 493.88,
  D5: 587.33, E5: 659.25, Fs5: 739.99, A5: 880.0, B5: 987.77,
  D6: 1174.66, E6: 1318.51, Fs6: 1479.98, A6: 1760.0,
};

const tick = (frequency: number, gain: number): NoiseVoice =>
  ({ kind: 'noise', filter: 'bandpass', frequency, q: 1.4, gain, attack: 0.001, decay: 0.022 });

const SOUNDS: Record<string, Voice[]> = {
  // Most frequent interaction: a quiet, short tap rather than a beep.
  'ui-click': [
    tick(3200, 0.22),
    { kind: 'tone', wave: 'sine', frequency: 1600, frequencyEnd: 1200, gain: 0.025, attack: 0.001, decay: 0.03 },
  ],
  'tab-select': [tick(4200, 0.22)],
  'tab-open': [
    tick(3000, 0.12),
    { kind: 'tone', wave: 'sine', frequency: NOTE.A5, frequencyEnd: NOTE.D6, gain: 0.05, decay: 0.09 },
  ],
  'tab-close': [
    tick(2400, 0.14),
    { kind: 'tone', wave: 'sine', frequency: NOTE.D6, frequencyEnd: NOTE.A5, gain: 0.04, decay: 0.08 },
  ],
  // Soft "swish" for panels and the sidebar.
  'panel-toggle': [
    { kind: 'noise', filter: 'bandpass', frequency: 1400, q: 0.8, gain: 0.09, attack: 0.012, decay: 0.08 },
    { kind: 'tone', wave: 'triangle', frequency: NOTE.D5, frequencyEnd: NOTE.E5, gain: 0.03, decay: 0.08 },
  ],
  'modal-toggle': [
    { kind: 'tone', wave: 'sine', frequency: NOTE.D5, gain: 0.05, decay: 0.12, overtone: 0.2 },
    { kind: 'tone', wave: 'sine', frequency: NOTE.A5, gain: 0.04, decay: 0.14, delay: 0.035, overtone: 0.2 },
  ],
  'command-execute': [
    tick(3600, 0.1),
    { kind: 'tone', wave: 'sine', frequency: NOTE.E5, gain: 0.045, decay: 0.09 },
    { kind: 'tone', wave: 'sine', frequency: NOTE.B5, gain: 0.04, decay: 0.12, delay: 0.045 },
  ],
  'setting-change': [
    { kind: 'tone', wave: 'sine', frequency: NOTE.A5, gain: 0.045, decay: 0.09, overtone: 0.15 },
    { kind: 'tone', wave: 'sine', frequency: NOTE.E6, gain: 0.035, decay: 0.12, delay: 0.05, overtone: 0.15 },
  ],
  'terminal-run': [
    { kind: 'tone', wave: 'triangle', frequency: NOTE.D4, frequencyEnd: NOTE.A4, gain: 0.05, attack: 0.01, decay: 0.12 },
    tick(2000, 0.08),
  ],
  // Rising arpeggio: something finished successfully.
  'terminal-complete': [
    { kind: 'tone', wave: 'sine', frequency: NOTE.D6, gain: 0.045, decay: 0.22, overtone: 0.25 },
    { kind: 'tone', wave: 'sine', frequency: NOTE.Fs6, gain: 0.04, decay: 0.24, delay: 0.07, overtone: 0.25 },
    { kind: 'tone', wave: 'sine', frequency: NOTE.A6, gain: 0.035, decay: 0.32, delay: 0.14, overtone: 0.25 },
  ],
  'chat-receive': [
    { kind: 'tone', wave: 'sine', frequency: NOTE.B5, gain: 0.05, decay: 0.14, overtone: 0.2 },
    { kind: 'tone', wave: 'sine', frequency: NOTE.E6, gain: 0.045, decay: 0.22, delay: 0.08, overtone: 0.2 },
  ],
  'notification': [
    { kind: 'tone', wave: 'sine', frequency: NOTE.A5, gain: 0.05, decay: 0.2, overtone: 0.3 },
    { kind: 'tone', wave: 'sine', frequency: NOTE.D6, gain: 0.045, decay: 0.32, delay: 0.09, overtone: 0.3 },
  ],
  // Low, rounded falling pair: noticeable but not harsh.
  'error': [
    { kind: 'tone', wave: 'triangle', frequency: NOTE.E4, gain: 0.08, attack: 0.008, decay: 0.12 },
    { kind: 'tone', wave: 'triangle', frequency: NOTE.D4 * 0.75, gain: 0.08, attack: 0.008, decay: 0.2, delay: 0.1 },
  ],
};

const MASTER_VOLUME = 1.6;
const MIN_REPEAT_INTERVAL_MS = 45; // Same sound fired in a burst (e.g. key repeat) plays once.

let masterBus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
const lastPlayedAt: Record<string, number> = {};

function getMasterBus(ctx: AudioContext): GainNode {
  if (!masterBus) {
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    compressor.connect(ctx.destination);

    masterBus = ctx.createGain();
    masterBus.gain.value = MASTER_VOLUME;
    masterBus.connect(compressor);
  }
  return masterBus;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function playVoice(ctx: AudioContext, voice: Voice, startAt: number): void {
  const t0 = startAt + (voice.delay ?? 0);
  const attack = voice.attack ?? 0.004;
  const end = t0 + attack + voice.decay;

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, t0);
  envelope.gain.exponentialRampToValueAtTime(voice.gain, t0 + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  envelope.connect(getMasterBus(ctx));

  if (voice.kind === 'noise') {
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = voice.filter;
    filter.frequency.value = voice.frequency;
    filter.Q.value = voice.q ?? 1;
    source.connect(filter);
    filter.connect(envelope);
    source.start(t0, Math.random() * 0.3);
    source.stop(end + 0.02);
    return;
  }

  const partials: Array<[number, number]> = [[1, 1]];
  if (voice.overtone) partials.push([2, voice.overtone]);
  for (const [multiple, level] of partials) {
    const osc = ctx.createOscillator();
    osc.type = voice.wave;
    osc.frequency.setValueAtTime(voice.frequency * multiple, t0);
    if (voice.frequencyEnd) {
      osc.frequency.exponentialRampToValueAtTime(voice.frequencyEnd * multiple, end);
    }
    const partialGain = ctx.createGain();
    partialGain.gain.value = level;
    osc.connect(partialGain);
    partialGain.connect(envelope);
    osc.start(t0);
    osc.stop(end + 0.02);
  }
}

/**
 * Plays a synthesized UI sound. Falls back silently if Web Audio is unavailable.
 */
function playSynthSound(voices: Voice[]): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if it was suspended (required by autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const startAt = ctx.currentTime + 0.005;
    voices.forEach(voice => playVoice(ctx, voice, startAt));
  } catch (e) {
    // Fail silently — sound is non-critical
  }
}

/**
 * Plays a sound effect by its logical name.
 * Sounds are synthesized with Web Audio (see SOUNDS above); no audio files are loaded.
 */
export function playSound(soundName: string): void {
  if (!SOUNDS_ENABLED) return;
  if (isMuted) return;

  const voices = SOUNDS[soundName];
  if (!voices) {
    // Unknown sound name — do nothing (keeps behavior consistent with before)
    return;
  }

  const now = performance.now();
  if (now - (lastPlayedAt[soundName] ?? -Infinity) < MIN_REPEAT_INTERVAL_MS) return;
  lastPlayedAt[soundName] = now;

  playSynthSound(voices);
}

/**
 * Toggles the global mute state for sound effects.
 * @returns The new mute state (true if muted, false if unmuted).
 */
export function toggleMute(): boolean {
  isMuted = !isMuted;
  if (isMuted) {
    console.log("Sound effects MUTED.");
  } else {
    console.log("Sound effects UNMUTED.");
    // Play a soft confirmation when unmuting (user just clicked something, so gesture exists)
    if (SOUNDS_ENABLED) {
      // Use a very short safe sound
      setTimeout(() => playSound('ui-click'), 10);
    }
  }
  try {
    localStorage.setItem('portfolio-soundMuted', JSON.stringify(isMuted));
  } catch (e) {
    console.warn("Could not save mute status to localStorage", e);
  }
  return isMuted;
}

/**
 * Gets the current mute status.
 * Initializes mute status from localStorage if available.
 * @returns True if sounds are muted, false otherwise.
 */
export function getMuteStatus(): boolean {
  try {
    const storedMute = localStorage.getItem('portfolio-soundMuted');
    if (storedMute !== null) {
      isMuted = JSON.parse(storedMute);
    }
  } catch (e) {
    console.warn("Could not retrieve mute status from localStorage", e);
    // isMuted remains its default (false) or last set value.
  }
  return isMuted;
}

// Initialize mute status on load
isMuted = getMuteStatus();
if (SOUNDS_ENABLED && isMuted) {
    console.log("Sound effects are currently MUTED (loaded from previous session).");
} else if (!SOUNDS_ENABLED) {
    console.log("Sound effects are globally DISABLED via SOUNDS_ENABLED flag.");
}

// Warm up AudioContext on first user interaction (helps bypass autoplay policies)
if (SOUNDS_ENABLED) {
  const warmUp = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Remove listeners after first interaction
    document.removeEventListener('click', warmUp);
    document.removeEventListener('keydown', warmUp);
    document.removeEventListener('touchstart', warmUp);
  };
  document.addEventListener('click', warmUp, { once: true, passive: true });
  document.addEventListener('keydown', warmUp, { once: true, passive: true });
  document.addEventListener('touchstart', warmUp, { once: true, passive: true });
}