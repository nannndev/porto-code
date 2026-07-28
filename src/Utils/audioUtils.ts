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

// Synthetic sound definitions for all sound names used across the app.
// These use simple oscillators for reliable, lightweight UI feedback without external files.
interface SoundPreset {
  type: OscillatorType;
  frequency: number;
  duration: number;
  volume?: number;
  frequencyEnd?: number; // For frequency sweep effects
  delay?: number;
  attack?: number;
  release?: number;
  filterFrequency?: number;
}

const SYNTHETIC_SOUNDS: { [key: string]: SoundPreset | SoundPreset[] } = {
  // Soft, compact feedback inspired by native desktop UI rather than arcade beeps.
  'ui-click': { type: 'sine', frequency: 520, frequencyEnd: 440, duration: 24, volume: 0.035, attack: 3, release: 42, filterFrequency: 1400 },
  
  // Tab operations use small pitch movements to communicate direction.
  'tab-open': { type: 'sine', frequency: 390, frequencyEnd: 560, duration: 58, volume: 0.045, attack: 5, release: 55 },
  'tab-close': { type: 'sine', frequency: 510, frequencyEnd: 350, duration: 52, volume: 0.04, attack: 4, release: 52 },
  'tab-select': { type: 'triangle', frequency: 470, frequencyEnd: 510, duration: 28, volume: 0.026, attack: 3, release: 38, filterFrequency: 1200 },
  
  // Panel / sidebar toggles
  'panel-toggle': { type: 'sine', frequency: 330, frequencyEnd: 430, duration: 64, volume: 0.04, attack: 6, release: 62 },
  
  // Modals and command palette
  'modal-toggle': [
    { type: 'sine', frequency: 410, frequencyEnd: 480, duration: 72, volume: 0.035, attack: 8, release: 75 },
    { type: 'sine', frequency: 615, frequencyEnd: 720, duration: 78, volume: 0.018, delay: 12, attack: 8, release: 78 }
  ],
  
  // Terminal actions
  'terminal-run': { type: 'triangle', frequency: 240, frequencyEnd: 390, duration: 76, volume: 0.04, attack: 5, release: 65, filterFrequency: 1100 },
  'terminal-complete': [
    { type: 'sine', frequency: 440, duration: 72, volume: 0.035, attack: 6, release: 70 },
    { type: 'sine', frequency: 660, duration: 90, volume: 0.03, delay: 62, attack: 7, release: 90 }
  ],
  
  // Settings / theme changes (positive confirmation feel)
  'setting-change': { type: 'sine', frequency: 460, frequencyEnd: 600, duration: 68, volume: 0.036, attack: 7, release: 70 },
  
  // Command / run actions
  'command-execute': { type: 'triangle', frequency: 320, frequencyEnd: 480, duration: 55, volume: 0.04, attack: 4, release: 58, filterFrequency: 1300 },
  
  // Error is distinct without being startling.
  'error': [
    { type: 'triangle', frequency: 220, frequencyEnd: 175, duration: 105, volume: 0.045, attack: 8, release: 95, filterFrequency: 900 },
    { type: 'sine', frequency: 330, frequencyEnd: 260, duration: 110, volume: 0.018, delay: 16, attack: 8, release: 90 }
  ],
  
  // Chat / notification sounds (gentle)
  'chat-receive': [
    { type: 'sine', frequency: 540, duration: 74, volume: 0.03, attack: 8, release: 80 },
    { type: 'sine', frequency: 720, duration: 95, volume: 0.025, delay: 54, attack: 8, release: 95 }
  ],
  'notification': [
    { type: 'sine', frequency: 520, duration: 75, volume: 0.03, attack: 8, release: 82 },
    { type: 'sine', frequency: 780, duration: 105, volume: 0.022, delay: 62, attack: 8, release: 100 }
  ],
};

/**
 * Plays a short synthetic tone using Web Audio API.
 * Falls back silently if AudioContext is unavailable.
 */
function playSyntheticSound(preset: SoundPreset | SoundPreset[]): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if it was suspended (required by autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const playOne = (p: SoundPreset, startTimeOffset = 0) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const compressor = ctx.createDynamicsCompressor();

      osc.type = p.type;
      osc.frequency.value = p.frequency;

      // Light low-pass filter for softer UI sounds
      filter.type = 'lowpass';
      filter.frequency.value = p.filterFrequency ?? 1800;
      filter.Q.value = 0.35;

      compressor.threshold.value = -26;
      compressor.knee.value = 18;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.12;

      // Volume envelope
      const volume = p.volume ?? 0.12;
      const now = ctx.currentTime + startTimeOffset / 1000;
      const attackEnd = now + (p.attack ?? 4) / 1000;
      const sustainEnd = now + p.duration / 1000;
      const releaseEnd = sustainEnd + (p.release ?? 55) / 1000;

      // Starting at zero removes the click caused by an abrupt waveform edge.
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), attackEnd);
      gain.gain.exponentialRampToValueAtTime(Math.max(volume * 0.55, 0.0002), sustainEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);

      // Optional frequency sweep (nice for some sounds)
      if (p.frequencyEnd) {
        osc.frequency.setValueAtTime(p.frequency, now);
        osc.frequency.exponentialRampToValueAtTime(p.frequencyEnd, sustainEnd);
      }

      // Connect graph
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(compressor);
      compressor.connect(ctx.destination);

      osc.start(now);
      osc.stop(releaseEnd + 0.01);
    } catch (e) {
      // Fail silently — sound is non-critical
    }
  };

  if (Array.isArray(preset)) {
    preset.forEach(p => playOne(p, p.delay ?? 0));
  } else {
    playOne(preset);
  }
}

/**
 * Plays a sound effect by its logical name.
 * Uses synthetic Web Audio tones for reliable feedback without external assets.
 */
export function playSound(soundName: string): void {
  if (!SOUNDS_ENABLED) return;
  if (isMuted) return;

  const preset = SYNTHETIC_SOUNDS[soundName];
  if (!preset) {
    // Unknown sound name — do nothing (keeps behavior consistent with before)
    return;
  }

  playSyntheticSound(preset);
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
