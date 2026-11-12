/**
 * Utilitário de Som de Inicialização do Windows XP (Web Audio API)
 * Sintetizador harmônico dos 6 acordes/notas lendárias do Windows XP Startup Chime
 * Composto originalmente por Bill Brown e Brian Schmidt (2001)
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playWinXPStartupSound(masterVolume: number = 0.35) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume, now);

    // Filter to give that warm, analog, smooth 2001 sound card feel
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.Q.setValueAtTime(1.2, now);

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // The iconic 6 notes:
    // Eb3 (~155.56 Hz), Bb3 (~233.08 Hz), Eb4 (~311.13 Hz), F4 (~349.23 Hz), Bb4 (~466.16 Hz), C5 (~523.25 Hz)
    const notes = [
      { freq: 155.56, start: 0.0, dur: 3.2, gain: 0.38, type: 'sine' as OscillatorType },
      { freq: 233.08, start: 0.14, dur: 2.9, gain: 0.34, type: 'triangle' as OscillatorType },
      { freq: 311.13, start: 0.36, dur: 2.7, gain: 0.36, type: 'sine' as OscillatorType },
      { freq: 349.23, start: 0.62, dur: 2.5, gain: 0.35, type: 'triangle' as OscillatorType },
      { freq: 466.16, start: 0.90, dur: 2.4, gain: 0.40, type: 'sine' as OscillatorType },
      { freq: 523.25, start: 1.18, dur: 2.6, gain: 0.42, type: 'triangle' as OscillatorType },
      
      // Warm backing synth chord (Eb major + sus)
      { freq: 77.78,  start: 0.1, dur: 3.4, gain: 0.22, type: 'sine' as OscillatorType }, // Eb2 sub bass
      { freq: 622.25, start: 1.25, dur: 2.2, gain: 0.15, type: 'sine' as OscillatorType }, // Eb5 shimmer
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = n.type;
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      // Attack & decay envelope
      noteGain.gain.setValueAtTime(0.0001, now + n.start);
      noteGain.gain.exponentialRampToValueAtTime(n.gain, now + n.start + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(n.gain * 0.7, now + n.start + 0.6);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.1);
    });
  } catch (err) {
    console.debug('[WinXP Audio] Startup sound error or blocked by autoplay policy:', err);
  }
}
