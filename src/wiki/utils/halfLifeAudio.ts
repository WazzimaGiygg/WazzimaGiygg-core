/**
/**
 * Efeitos Sonoros do Half-Life (Black Mesa / HEV Suit) via Web Audio API
 * Sintetizador nativo sem arquivos externos:
 * - HEV Suit Beep / Chime de inicialização
 * - Contador Geiger (Radiation clicks)
 * - Health Charger / Medkit Hum
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
 * Bipe eletrônico duplo do traje HEV Mark IV / Mark V
 */
export function playHalfLifeHEVBeep(volume: number = 0.25) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Primeiro tom (alerta de sistema)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(660, now);
    osc1.frequency.setValueAtTime(880, now + 0.05);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.14);

    // Segundo tom agudo confirmatório (sistema online)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.14);
    osc2.frequency.setValueAtTime(1760, now + 0.20);

    gain2.gain.setValueAtTime(0.001, now + 0.14);
    gain2.gain.linearRampToValueAtTime(volume * 0.9, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.34);
  } catch {
    // Ignore audio failures if browser restricts autoplay
  }
}

/**
 * Ruído de estalos do Contador Geiger do Half-Life
 */
export function playHalfLifeGeiger(clicks: number = 4, volume: number = 0.2) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    for (let i = 0; i < clicks; i++) {
      const delay = i * 0.07 + Math.random() * 0.03;
      const now = ctx.currentTime + delay;

      // Burst de ruído estático simulando contagem radioativa
      const bufferSize = ctx.sampleRate * 0.015;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * (0.8 + Math.random() * 0.4), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.025);
    }
  } catch {
    // ignore
  }
}

/**
 * Som de recarga da estação de saúde (Health Station) do Half-Life
 */
export function playHalfLifeHealthStation(volume: number = 0.25) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.45);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.4);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.8, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.52);
  } catch {
    // ignore
  }
}
