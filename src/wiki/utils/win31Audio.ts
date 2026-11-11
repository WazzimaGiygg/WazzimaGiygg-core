/**
 * Utilitário de Sons Clássicos do Windows 3.1 (Web Audio API)
 * Sintetizador autêntico do icônico TADA.WAV (Fanfarra de Inicialização do Windows 3.1 - 1992),
 * DING.WAV, CHORD.WAV e CHIMES.WAV com o timbre característico das placas de som Sound Blaster 16 / AdLib OPL3.
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

/**
 * Clássico TADA.WAV do Windows 3.1 (1992)
 * Fanfarra triunfante em Dó Maior executada ao iniciar o Windows 3.1
 * Notas: C4 -> E4 -> G4 -> Acorde Triunfante Final C4+G4+C5+E5+G5
 */
export function playWin31StartupSound(volume: number = 0.35) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(volume, now);
    master.connect(ctx.destination);

    // Filtro analógico tipo Sound Blaster 16 / DAC de 22kHz da era 1992
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.connect(master);

    // Sequência de notas da fanfarra clássica:
    // C4, E4, G4 rápidos em arpeggio, seguidos do acorde final grandioso sustentado
    const notes = [
      // Nota 1: C4 (261.63 Hz)
      { freq: 261.63, start: 0.00, dur: 0.13, type: 'triangle' as OscillatorType, vol: 0.32 },
      { freq: 523.25, start: 0.00, dur: 0.13, type: 'sine' as OscillatorType, vol: 0.18 },

      // Nota 2: E4 (329.63 Hz)
      { freq: 329.63, start: 0.13, dur: 0.13, type: 'triangle' as OscillatorType, vol: 0.34 },
      { freq: 659.25, start: 0.13, dur: 0.13, type: 'sine' as OscillatorType, vol: 0.18 },

      // Nota 3: G4 (392.00 Hz)
      { freq: 392.00, start: 0.26, dur: 0.15, type: 'triangle' as OscillatorType, vol: 0.36 },
      { freq: 784.00, start: 0.26, dur: 0.15, type: 'sine' as OscillatorType, vol: 0.20 },

      // Acorde Final Sustentado (Tadaaaa!):
      // Dó fundamental (C4)
      { freq: 261.63, start: 0.40, dur: 1.10, type: 'sawtooth' as OscillatorType, vol: 0.24 },
      // Sol médio (G4)
      { freq: 392.00, start: 0.40, dur: 1.10, type: 'triangle' as OscillatorType, vol: 0.30 },
      // Dó oitava (C5)
      { freq: 523.25, start: 0.40, dur: 1.15, type: 'triangle' as OscillatorType, vol: 0.38 },
      // Mi brilhante (E5)
      { freq: 659.25, start: 0.41, dur: 1.15, type: 'sine' as OscillatorType, vol: 0.32 },
      // Sol topo (G5)
      { freq: 784.00, start: 0.41, dur: 1.20, type: 'sine' as OscillatorType, vol: 0.28 },
      // Dó harmônico superior (C6) para brilho de bronze
      { freq: 1046.50, start: 0.42, dur: 1.05, type: 'sine' as OscillatorType, vol: 0.18 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = n.type;
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.001, now + n.start);
      gain.gain.linearRampToValueAtTime(n.vol, now + n.start + 0.02);
      gain.gain.setValueAtTime(n.vol, now + n.start + n.dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    });
  } catch {
    // ignore
  }
}

/**
 * Windows 3.1 DING.WAV (Sino de notificação de 16 bits)
 */
export function playWin31Ding(volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(1046.5, now); // C6
    osc2.frequency.setValueAtTime(2093.0, now); // C7

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  } catch {
    // ignore
  }
}

/**
 * Windows 3.1 CHORD.WAV (Acorde de aviso do sistema)
 */
export function playWin31Chord(volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [329.63, 415.30, 493.88, 659.25]; // Acorde E maior
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(volume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    });
  } catch {
    // ignore
  }
}

/**
 * Windows 3.1 CHIMES.WAV (Sinos em cascata)
 */
export function playWin31Chimes(volume: number = 0.25) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [
      { freq: 1318.51, start: 0.00, dur: 0.4 }, // E6
      { freq: 1108.73, start: 0.09, dur: 0.4 }, // C#6
      { freq: 880.00,  start: 0.18, dur: 0.5 }, // A5
      { freq: 659.25,  start: 0.27, dur: 0.7 }, // E5
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.001, now + n.start);
      gain.gain.linearRampToValueAtTime(volume, now + n.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    });
  } catch {
    // ignore
  }
}
