import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { playWin7StartupSound } from '../utils/win7Audio';

interface Windows7BootScreenProps {
  onComplete: () => void;
  autoPlayAudio?: boolean;
}

export const Windows7BootScreen: React.FC<Windows7BootScreenProps> = ({
  onComplete,
  autoPlayAudio = true,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'orbs' | 'merging' | 'logo' | 'pulse'>('orbs');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('win7_boot_sound_enabled') !== 'false';
  });
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  // Play startup sound
  useEffect(() => {
    if (soundEnabled && autoPlayAudio) {
      const timer = setTimeout(() => {
        playWin7StartupSound(0.35);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [soundEnabled, autoPlayAudio]);

  // Manage Windows 7 boot phases
  useEffect(() => {
    const t1 = setTimeout(() => setAnimationPhase('merging'), 900);
    const t2 = setTimeout(() => setAnimationPhase('logo'), 1500);
    const t3 = setTimeout(() => setAnimationPhase('pulse'), 2100);
    const tEnd = setTimeout(() => {
      handleFinish();
    }, 3600);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('win7_boot_sound_enabled', String(next));
    if (next) {
      playWin7StartupSound(0.35);
    }
  };

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[99999] bg-black text-white select-none flex flex-col justify-between items-center px-4 py-8 font-sans transition-opacity duration-500 cursor-pointer overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      title="Clique ou pressione qualquer tecla para pular a inicialização do Windows 7"
    >
      {/* Top action bar: sound toggle and skip button */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-slate-400">
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/70 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition text-[11px] shadow-xs"
          title={soundEnabled ? 'Silenciar som de inicialização' : 'Ativar som de inicialização'}
        >
          {soundEnabled ? (
            <>
              <Volume2 size={13} className="text-sky-400" />
              <span>Som Win 7 [Ativo]</span>
            </>
          ) : (
            <>
              <VolumeX size={13} className="text-slate-500" />
              <span>Som Win 7 [Mudo]</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded bg-black/70 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition text-[11px] shadow-xs"
          title="Pular animação de inicialização do Windows 7"
        >
          <span>Pular</span>
          <span className="text-[10px] text-slate-500 font-mono">[ESC]</span>
          <X size={12} className="ml-0.5" />
        </button>
      </div>

      {/* Main Center Stage: Windows 7 4 Glowing Orbs converging into the Windows Flag */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-md">
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Subtle central radial light glow behind the logo */}
          <div
            className={`absolute inset-0 rounded-full bg-radial from-blue-500/25 via-sky-400/10 to-transparent blur-2xl transition-opacity duration-1000 ${
              animationPhase === 'orbs' ? 'opacity-30' : 'opacity-100'
            }`}
          />

          {/* Phase 1: The 4 Swirling / Converging Glowing Light Orbs */}
          {animationPhase === 'orbs' && (
            <div className="relative w-28 h-28 flex items-center justify-center animate-spin-slow">
              {/* Red Orb (Top-Left) */}
              <div className="absolute w-4 h-4 rounded-full bg-[#f25022] shadow-[0_0_16px_#f25022,0_0_30px_#f25022] animate-win7-orb-red" />
              {/* Green Orb (Top-Right) */}
              <div className="absolute w-4 h-4 rounded-full bg-[#7fba00] shadow-[0_0_16px_#7fba00,0_0_30px_#7fba00] animate-win7-orb-green" />
              {/* Blue Orb (Bottom-Left) */}
              <div className="absolute w-4 h-4 rounded-full bg-[#00a4ef] shadow-[0_0_16px_#00a4ef,0_0_30px_#00a4ef] animate-win7-orb-blue" />
              {/* Yellow Orb (Bottom-Right) */}
              <div className="absolute w-4 h-4 rounded-full bg-[#ffb900] shadow-[0_0_16px_#ffb900,0_0_30px_#ffb900] animate-win7-orb-yellow" />
            </div>
          )}

          {/* Phase 2 & 3: The 4 Orbs merge into the Glowing Windows 7 Flag */}
          {animationPhase !== 'orbs' && (
            <div
              className={`relative flex items-center justify-center transition-all duration-700 ${
                animationPhase === 'merging'
                  ? 'scale-90 opacity-90'
                  : 'scale-100 opacity-100 animate-win7-logo-pulse'
              }`}
            >
              <svg
                className="w-32 h-32 sm:w-36 sm:h-36 filter drop-shadow-[0_0_24px_rgba(40,160,255,0.6)]"
                viewBox="0 0 160 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Windows 7 curved wavy flag segments */}
                {/* Red Quadrant (Top-Left) */}
                <path
                  d="M 28 34 C 44 26, 62 46, 75 40 C 75 58, 74 76, 74 88 C 60 94, 44 74, 27 82 Z"
                  fill="url(#win7-red-grad)"
                  className="filter drop-shadow-[0_0_8px_rgba(242,80,34,0.7)]"
                />
                {/* Green Quadrant (Top-Right) */}
                <path
                  d="M 83 39 C 97 33, 115 48, 133 42 C 132 60, 130 78, 129 90 C 114 96, 97 78, 83 87 Z"
                  fill="url(#win7-green-grad)"
                  className="filter drop-shadow-[0_0_8px_rgba(127,186,0,0.7)]"
                />
                {/* Blue Quadrant (Bottom-Left) */}
                <path
                  d="M 26 89 C 43 82, 60 100, 74 95 C 73 112, 72 130, 71 142 C 58 147, 41 129, 25 137 Z"
                  fill="url(#win7-blue-grad)"
                  className="filter drop-shadow-[0_0_8px_rgba(0,164,239,0.7)]"
                />
                {/* Yellow Quadrant (Bottom-Right) */}
                <path
                  d="M 82 94 C 96 88, 114 103, 128 97 C 127 114, 125 131, 124 144 C 110 150, 94 132, 81 141 Z"
                  fill="url(#win7-yellow-grad)"
                  className="filter drop-shadow-[0_0_8px_rgba(255,185,0,0.7)]"
                />

                {/* Windows 7 Aero Glass Gradients */}
                <defs>
                  <linearGradient id="win7-red-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff7b63" />
                    <stop offset="40%" stopColor="#f25022" />
                    <stop offset="100%" stopColor="#b31e00" />
                  </linearGradient>
                  <linearGradient id="win7-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9ee31b" />
                    <stop offset="40%" stopColor="#7fba00" />
                    <stop offset="100%" stopColor="#4f7500" />
                  </linearGradient>
                  <linearGradient id="win7-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5cd3ff" />
                    <stop offset="40%" stopColor="#00a4ef" />
                    <stop offset="100%" stopColor="#0062a8" />
                  </linearGradient>
                  <linearGradient id="win7-yellow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffe169" />
                    <stop offset="40%" stopColor="#ffb900" />
                    <stop offset="100%" stopColor="#c77b00" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>

        {/* Windows 7 Typography: "Iniciando o Windows" / "Starting Windows" */}
        <div className="mt-8 flex flex-col items-center text-center">
          <div
            className="text-lg sm:text-xl text-slate-200 tracking-[0.14em] font-normal font-sans antialiased animate-fade-in"
            style={{ fontFamily: "'Segoe UI', 'Segoe UI Web', -apple-system, sans-serif" }}
          >
            Iniciando o Windows
          </div>

          <div className="mt-2 text-[11px] text-sky-400/80 tracking-widest uppercase font-mono">
            WikiWorldWeb 7 Ultimate
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="w-full max-w-xl text-center text-xs text-slate-600 space-y-1">
        <p className="text-[11px] tracking-wide text-slate-400">
          Pressione <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[10px]">ESC</kbd> ou clique para continuar
        </p>
        <p className="text-[10px] text-slate-600 font-sans">
          © Microsoft Corporation. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
