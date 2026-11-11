/**
 * Utilitário de Som de Inicialização do Windows 7 (Web Audio API)
 * Sintetizador orquestral dos 4 acordes/chimes lendários do Windows 7 (Aero)
 * Composto originalmente por Robert Fripp e Steve Ball
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

export function playWin7StartupSound(masterVolume: number = 0.35) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume, now);

    // Warm high-fidelity acoustic filter (gentle lowpass for lush clarity)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3600, now);
    filter.Q.setValueAtTime(0.7, now);

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // 1. Lush ambient orchestral pad backing (B major swell)
    const padTones = [
      { freq: 123.47, start: 0.0, dur: 3.6, gain: 0.18, type: 'sine' as OscillatorType }, // B2 sub
      { freq: 185.00, start: 0.05, dur: 3.5, gain: 0.16, type: 'triangle' as OscillatorType }, // F#3
      { freq: 246.94, start: 0.1, dur: 3.4, gain: 0.15, type: 'sine' as OscillatorType }, // B3
      { freq: 311.13, start: 0.15, dur: 3.3, gain: 0.14, type: 'sine' as OscillatorType }, // D#4
      { freq: 466.16, start: 0.2, dur: 3.2, gain: 0.12, type: 'sine' as OscillatorType }, // A#4 (Maj7 shimmer)
    ];

    padTones.forEach((p) => {
      const osc = ctx.createOscillator();
      const pGain = ctx.createGain();
      osc.type = p.type;
      osc.frequency.setValueAtTime(p.freq, now + p.start);

      // Smooth orchestral swell envelope
      pGain.gain.setValueAtTime(0.0001, now + p.start);
      pGain.gain.exponentialRampToValueAtTime(p.gain, now + p.start + 0.35);
      pGain.gain.linearRampToValueAtTime(p.gain * 0.75, now + p.start + 1.8);
      pGain.gain.exponentialRampToValueAtTime(0.0001, now + p.start + p.dur);

      osc.connect(pGain);
      pGain.connect(masterGain);
      osc.start(now + p.start);
      osc.stop(now + p.start + p.dur + 0.1);
    });

    // 2. The Iconic 4 Chimes of Windows 7 (Crystalline Bell Harmonics)
    // Note 1: F#4 / F#5
    // Note 2: B4 / B5
    // Note 3: D#5 / D#6
    // Note 4: G#5 / G#6 (resolving in lush airy chord)
    const chimes = [
      { freq: 369.99, octave: 739.99, start: 0.12, dur: 2.8, gain: 0.38 },
      { freq: 493.88, octave: 987.77, start: 0.48, dur: 2.6, gain: 0.40 },
      { freq: 622.25, octave: 1244.50, start: 0.88, dur: 2.5, gain: 0.42 },
      { freq: 830.61, octave: 1661.22, start: 1.28, dur: 2.8, gain: 0.45 },
    ];

    chimes.forEach((c) => {
      // Fundamental sine bell
      const oscMain = ctx.createOscillator();
      const gainMain = ctx.createGain();
      oscMain.type = 'sine';
      oscMain.frequency.setValueAtTime(c.freq, now + c.start);

      // Glass harmonic chime
      const oscHarmonic = ctx.createOscillator();
      const gainHarmonic = ctx.createGain();
      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(c.octave, now + c.start);

      // Sharp acoustic transient and musical decay
      const attackTime = 0.02;
      gainMain.gain.setValueAtTime(0.0001, now + c.start);
      gainMain.gain.linearRampToValueAtTime(c.gain, now + c.start + attackTime);
      gainMain.gain.exponentialRampToValueAtTime(c.gain * 0.45, now + c.start + 0.35);
      gainMain.gain.exponentialRampToValueAtTime(0.0001, now + c.start + c.dur);

      gainHarmonic.gain.setValueAtTime(0.0001, now + c.start);
      gainHarmonic.gain.linearRampToValueAtTime(c.gain * 0.35, now + c.start + attackTime);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.0001, now + c.start + (c.dur * 0.6));

      oscMain.connect(gainMain);
      gainMain.connect(masterGain);
      oscHarmonic.connect(gainHarmonic);
      gainHarmonic.connect(masterGain);

      oscMain.start(now + c.start);
      oscMain.stop(now + c.start + c.dur + 0.1);
      oscHarmonic.start(now + c.start);
      oscHarmonic.stop(now + c.start + (c.dur * 0.6) + 0.1);
    });
  } catch (err) {
    console.debug('[Win7 Audio] Startup sound blocked or failed:', err);
  }
}
