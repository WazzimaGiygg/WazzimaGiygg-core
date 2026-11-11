/**
 * Utilitário de Som de Inicialização do Windows 10 (Web Audio API)
 * Sintetizador acústico moderno dos acordes de boot e logon do Windows 10
 * Som cristalino, moderno e de alta fidelidade sem dependências externas
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

export function playWin10StartupSound(masterVolume: number = 0.35) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master Gain com limitador suave
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume, now);

    // Filtro acústico transparente moderno (lowpass alto para brilho e clareza cristalina)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5000, now);
    filter.Q.setValueAtTime(0.6, now);

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // 1. Acorde ambiente sutil de fundo (Modern Fluent swell - Eb / Ab / Bb / Eb major shimmer)
    const ambientChords = [
      { freq: 155.56, start: 0.0, dur: 3.2, gain: 0.12, type: 'sine' as OscillatorType }, // Eb3
      { freq: 233.08, start: 0.05, dur: 3.0, gain: 0.14, type: 'triangle' as OscillatorType }, // Bb3
      { freq: 311.13, start: 0.1, dur: 2.8, gain: 0.15, type: 'sine' as OscillatorType }, // Eb4
      { freq: 415.30, start: 0.15, dur: 2.6, gain: 0.12, type: 'sine' as OscillatorType }, // Ab4
      { freq: 466.16, start: 0.2, dur: 2.5, gain: 0.10, type: 'triangle' as OscillatorType }, // Bb4
      { freq: 622.25, start: 0.25, dur: 2.4, gain: 0.09, type: 'sine' as OscillatorType }, // Eb5
    ];

    ambientChords.forEach((p) => {
      const osc = ctx.createOscillator();
      const pGain = ctx.createGain();
      osc.type = p.type;
      osc.frequency.setValueAtTime(p.freq, now + p.start);

      // Curva suave de abertura e fade-out fluida
      pGain.gain.setValueAtTime(0.0001, now + p.start);
      pGain.gain.exponentialRampToValueAtTime(p.gain, now + p.start + 0.25);
      pGain.gain.linearRampToValueAtTime(p.gain * 0.7, now + p.start + 1.2);
      pGain.gain.exponentialRampToValueAtTime(0.0001, now + p.start + p.dur);

      osc.connect(pGain);
      pGain.connect(masterGain);
      osc.start(now + p.start);
      osc.stop(now + p.start + p.dur + 0.05);
    });

    // 2. Os Chimes Cristalinos e Precisos da identidade do Windows 10
    // Seqüência ascendente moderna e elegante:
    // Eb5 -> G5 -> Bb5 -> Eb6
    const modernChimes = [
      { freq: 622.25, octave: 1244.50, start: 0.10, dur: 2.2, gain: 0.35 },
      { freq: 783.99, octave: 1567.98, start: 0.35, dur: 2.0, gain: 0.38 },
      { freq: 932.33, octave: 1864.66, start: 0.65, dur: 2.1, gain: 0.40 },
      { freq: 1244.50, octave: 2489.00, start: 0.98, dur: 2.5, gain: 0.44 },
    ];

    modernChimes.forEach((c) => {
      const oscMain = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const gainMain = ctx.createGain();
      const gainHarmonic = ctx.createGain();

      oscMain.type = 'sine';
      oscHarmonic.type = 'triangle';

      oscMain.frequency.setValueAtTime(c.freq, now + c.start);
      oscHarmonic.frequency.setValueAtTime(c.octave, now + c.start);

      const attack = 0.015;
      gainMain.gain.setValueAtTime(0.0001, now + c.start);
      gainMain.gain.linearRampToValueAtTime(c.gain, now + c.start + attack);
      gainMain.gain.exponentialRampToValueAtTime(c.gain * 0.4, now + c.start + 0.3);
      gainMain.gain.exponentialRampToValueAtTime(0.0001, now + c.start + c.dur);

      gainHarmonic.gain.setValueAtTime(0.0001, now + c.start);
      gainHarmonic.gain.linearRampToValueAtTime(c.gain * 0.3, now + c.start + attack);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.0001, now + c.start + (c.dur * 0.6));

      oscMain.connect(gainMain);
      oscHarmonic.connect(gainHarmonic);
      gainMain.connect(masterGain);
      gainHarmonic.connect(masterGain);

      oscMain.start(now + c.start);
      oscMain.stop(now + c.start + c.dur + 0.05);
      oscHarmonic.start(now + c.start);
      oscHarmonic.stop(now + c.start + (c.dur * 0.6) + 0.05);
    });
  } catch (err) {
    console.debug('[Win10 Audio] Startup sound blocked or failed:', err);
  }
}
