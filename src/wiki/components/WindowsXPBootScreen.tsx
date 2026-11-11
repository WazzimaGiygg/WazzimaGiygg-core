import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { playWinXPStartupSound } from '../utils/winxpAudio';

interface WindowsXPBootScreenProps {
  onComplete: () => void;
  autoPlayAudio?: boolean;
}

export const WindowsXPBootScreen: React.FC<WindowsXPBootScreenProps> = ({
  onComplete,
  autoPlayAudio = true,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('winxp_boot_sound_enabled') !== 'false';
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

  // Play audio on mount if sound is enabled
  useEffect(() => {
    if (soundEnabled && autoPlayAudio) {
      // Small timeout to allow user interaction context or immediate start
      const timer = setTimeout(() => {
        playWinXPStartupSound(0.32);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [soundEnabled, autoPlayAudio]);

  // Auto-finish after 2.8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFinish();
    }, 2850);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('winxp_boot_sound_enabled', String(next));
    if (next) {
      playWinXPStartupSound(0.35);
    }
  };

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[99999] bg-black text-white select-none flex flex-col justify-between items-center px-4 py-8 font-sans transition-opacity duration-500 cursor-pointer overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      title="Clique ou pressione qualquer tecla para pular o boot"
    >
      {/* Top action bar: sound toggle and skip button */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-slate-400">
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition text-[11px]"
          title={soundEnabled ? 'Silenciar som de boot' : 'Ativar som de boot'}
        >
          {soundEnabled ? (
            <>
              <Volume2 size={13} className="text-blue-400" />
              <span>Som XP [Ativo]</span>
            </>
          ) : (
            <>
              <VolumeX size={13} className="text-slate-500" />
              <span>Som XP [Mudo]</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded bg-black/60 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition text-[11px]"
          title="Pular animação de inicialização"
        >
          <span>Pular</span>
          <span className="text-[10px] text-slate-500 font-mono">[ESC]</span>
          <X size={12} className="ml-0.5" />
        </button>
      </div>

      {/* Main Center Stage: Classic Windows XP Boot Logo & Loading Slider */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-md">
        {/* Windows XP 4-Color Flying Flag Logo */}
        <div className="relative mb-6 flex items-center justify-center">
          <svg
            className="w-28 h-28 sm:w-32 sm:h-32 filter drop-shadow-[0_4px_12px_rgba(40,110,240,0.35)]"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top-Left: Red Flag Segment with curves */}
            <path
              d="M 28 32 C 45 25, 62 44, 76 38 C 76 56, 75 75, 75 88 C 60 93, 44 74, 27 82 Z"
              fill="url(#xp-red-grad)"
            />
            {/* Top-Right: Green Flag Segment with curves */}
            <path
              d="M 84 37 C 98 31, 116 46, 134 40 C 133 58, 131 77, 130 90 C 114 96, 97 78, 83 87 Z"
              fill="url(#xp-green-grad)"
            />
            {/* Bottom-Left: Blue Flag Segment with curves */}
            <path
              d="M 26 89 C 43 82, 60 100, 74 95 C 74 112, 73 130, 72 143 C 58 148, 41 130, 25 138 Z"
              fill="url(#xp-blue-grad)"
            />
            {/* Bottom-Right: Yellow Flag Segment with curves */}
            <path
              d="M 82 94 C 96 88, 114 103, 129 97 C 128 114, 126 132, 125 145 C 110 151, 94 133, 81 142 Z"
              fill="url(#xp-yellow-grad)"
            />

            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="xp-red-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff5238" />
                <stop offset="50%" stopColor="#eb3820" />
                <stop offset="100%" stopColor="#b51b08" />
              </linearGradient>
              <linearGradient id="xp-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8be33f" />
                <stop offset="50%" stopColor="#67bf28" />
                <stop offset="100%" stopColor="#3d820f" />
              </linearGradient>
              <linearGradient id="xp-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3aa4ff" />
                <stop offset="50%" stopColor="#0072eb" />
                <stop offset="100%" stopColor="#00439e" />
              </linearGradient>
              <linearGradient id="xp-yellow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd83d" />
                <stop offset="50%" stopColor="#ffae00" />
                <stop offset="100%" stopColor="#d97700" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Microsoft Windows XP typography */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[13px] tracking-[0.25em] text-slate-300 uppercase font-sans font-light">
              Microsoft
            </span>
            <span className="text-[9px] text-slate-400 align-super">®</span>
          </div>

          <div className="flex items-baseline gap-2 leading-none">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans drop-shadow-sm">
              Windows
            </span>
            <span
              className="text-4xl sm:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#ff7a18] via-[#f15a24] to-[#cc3b02] drop-shadow-[0_2px_4px_rgba(241,90,36,0.5)] font-sans pr-1"
              style={{ fontFamily: "'Trebuchet MS', 'Arial Black', sans-serif" }}
            >
              XP
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-slate-200 uppercase font-sans">
              Professional
            </span>
            <span className="text-[10px] text-blue-400 border border-blue-600/60 rounded px-1.5 py-0.2 bg-blue-950/40">
              WikiWorldWeb SP3
            </span>
          </div>
        </div>

        {/* The Legendary Windows XP Boot Progress Bar with 3 Moving Blue Blocks */}
        <div className="mt-12 flex flex-col items-center">
          <div className="winxp-boot-track">
            <div className="winxp-boot-blocks-container">
              <div className="winxp-boot-block" />
              <div className="winxp-boot-block" />
              <div className="winxp-boot-block" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 font-sans tracking-wide">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Iniciando o sistema operacional...</span>
          </div>
        </div>
      </div>

      {/* Footer Branding and Copyright notice */}
      <div className="w-full max-w-xl text-center text-xs text-slate-500 space-y-1">
        <p className="text-[11px] tracking-wide text-slate-400">
          Para pular a introdução, clique em qualquer ponto da tela ou pressione{' '}
          <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">
            ESC
          </kbd>
        </p>
        <p className="text-[10px] text-slate-600">
          Microsoft Corporation © 1985–2001. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
