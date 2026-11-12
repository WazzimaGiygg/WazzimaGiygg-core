import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { playWin95StartupSound } from '../utils/win95Audio';

interface Windows95BootScreenProps {
  onComplete: () => void;
  autoPlayAudio?: boolean;
}

export const Windows95BootScreen: React.FC<Windows95BootScreenProps> = ({
  onComplete,
  autoPlayAudio = true,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('win95_boot_sound_enabled') !== 'false';
  });
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  // Play Windows 95 startup sound on mount if enabled
  useEffect(() => {
    if (soundEnabled && autoPlayAudio) {
      const timer = setTimeout(() => {
        playWin95StartupSound(0.35);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [soundEnabled, autoPlayAudio]);

  // Auto-finish after 2.9 seconds or on keypress
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFinish();
    }, 2900);

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
    localStorage.setItem('win95_boot_sound_enabled', String(next));
    if (next) {
      playWin95StartupSound(0.35);
    }
  };

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[99999] bg-[#008080] text-black select-none flex flex-col justify-between items-center px-4 py-6 font-sans transition-opacity duration-400 cursor-pointer overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #a4c8e8 0%, #6899cc 40%, #306598 75%, #008080 100%)',
      }}
      title="Clique ou pressione qualquer tecla para continuar"
    >
      {/* Top action bar: sound toggle and skip button */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#c0c0c0] hover:bg-[#d4d0c8] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black text-black font-mono text-[11px] shadow-sm cursor-pointer"
          title={soundEnabled ? 'Silenciar som de inicialização' : 'Ativar som de inicialização'}
        >
          {soundEnabled ? (
            <>
              <Volume2 size={13} className="text-[#000080]" />
              <span>Som Win95 [Ativo]</span>
            </>
          ) : (
            <>
              <VolumeX size={13} className="text-slate-600" />
              <span>Som Win95 [Mudo]</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="flex items-center gap-1 px-3 py-1 bg-[#c0c0c0] hover:bg-[#d4d0c8] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black text-black font-mono text-[11px] shadow-sm cursor-pointer"
          title="Pular inicialização do Windows 95"
        >
          <span>Pular</span>
          <span className="text-[10px] text-slate-700 font-mono">[ESC]</span>
          <X size={12} className="ml-0.5" />
        </button>
      </div>

      {/* Main Center Stage: Celestial Clouds & Classic Microsoft Windows 95 Flying Flag Logo */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-lg">
        {/* Windows 95 Flying Flag SVG with trail pixels */}
        <div className="relative mb-4 flex items-center justify-center filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]">
          <svg
            className="w-36 h-36 sm:w-44 sm:h-44"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Trail Pixel Blocks */}
            <rect x="25" y="45" width="8" height="8" fill="#000000" opacity="0.6" />
            <rect x="35" y="38" width="6" height="6" fill="#000000" opacity="0.5" />
            <rect x="30" y="70" width="8" height="8" fill="#000000" opacity="0.5" />
            <rect x="20" y="90" width="7" height="7" fill="#000000" opacity="0.4" />
            <rect x="40" y="105" width="8" height="8" fill="#000000" opacity="0.6" />
            <rect x="28" y="125" width="8" height="8" fill="#000000" opacity="0.5" />

            {/* Red Pane (Top Left) */}
            <path
              d="M 52 48 C 72 38, 92 58, 108 50 C 108 72, 107 94, 106 110 C 88 116, 68 96, 50 106 Z"
              fill="#ff0000"
              stroke="#000000"
              strokeWidth="2.5"
            />
            {/* Green Pane (Top Right) */}
            <path
              d="M 116 50 C 134 42, 154 62, 174 54 C 173 76, 171 98, 170 114 C 150 122, 130 102, 114 112 Z"
              fill="#00aa00"
              stroke="#000000"
              strokeWidth="2.5"
            />
            {/* Blue Pane (Bottom Left) */}
            <path
              d="M 48 114 C 68 104, 88 124, 104 118 C 104 138, 103 160, 102 174 C 84 180, 64 162, 46 170 Z"
              fill="#0000ff"
              stroke="#000000"
              strokeWidth="2.5"
            />
            {/* Yellow Pane (Bottom Right) */}
            <path
              d="M 112 120 C 130 112, 150 132, 168 126 C 167 146, 165 168, 164 182 C 146 190, 126 170, 110 180 Z"
              fill="#ffff00"
              stroke="#000000"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        {/* Microsoft Windows 95 Authentic Typography */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-lg sm:text-xl text-black font-serif italic tracking-wide"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              Microsoft
            </span>
            <span className="text-[10px] text-slate-800 font-sans align-top">®</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl sm:text-5xl font-black text-black tracking-tight"
              style={{ fontFamily: "'Arial Black', 'Trebuchet MS', sans-serif" }}
            >
              Windows
            </span>
            <span
              className="text-4xl sm:text-5xl font-black italic text-black tracking-tight"
              style={{ fontFamily: "'Arial Black', 'Trebuchet MS', sans-serif" }}
            >
              95
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#c0c0c0] text-black border border-black shadow-[2px_2px_0px_#000]">
              WikiZero 32-Bit Edition
            </span>
          </div>
        </div>

        {/* The Legendary Windows 95 Animated Scanning Blue Color Bar */}
        <div className="mt-10 flex flex-col items-center w-full max-w-xs">
          <div className="w-full h-4 bg-black border-2 border-[#808080] p-[2px] overflow-hidden relative shadow-[inset_1px_1px_0px_#000]">
            <div className="win95-boot-marquee h-full bg-gradient-to-r from-transparent via-[#00aaff] to-[#0000aa] rounded-none" />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs font-mono font-bold text-slate-900 bg-white/70 px-3 py-1 border border-black/40">
            <span className="w-2 h-2 bg-[#000080] animate-pulse" />
            <span>Iniciando o Windows 95...</span>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="w-full max-w-md text-center text-xs font-mono text-slate-800 space-y-1">
        <p className="text-[11px]">
          Pressione <kbd className="px-1.5 py-0.5 bg-[#c0c0c0] border border-black text-black font-bold">ESC</kbd> para pular
        </p>
        <p className="text-[10px] text-slate-700">
          Microsoft Corporation © 1981–1995. Som de Brian Eno.
        </p>
      </div>
    </div>
  );
};
