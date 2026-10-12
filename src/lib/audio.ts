'use client';

let audioContext: AudioContext | null = null;

export function playChime() {
  if (typeof window === 'undefined') return;

  try {
    const audio = new Audio('/sounds/chime.mp3');
    audio.play().catch(() => {
      // Fallback to Web Audio API synthesis if file playback is blocked or fails
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioContext || audioContext.state === 'closed') {
          audioContext = new AudioCtx();
        }
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        const now = audioContext.currentTime;
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now); // A5

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContext.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
      } catch {
        // Audio playback not permitted or unavailable
      }
    });
  } catch {
    // Ignore error
  }
}

export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) return null;
  try {
    const sentinel = await navigator.wakeLock.request('screen');
    return sentinel;
  } catch {
    return null;
  }
}
