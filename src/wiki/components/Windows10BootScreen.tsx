import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { playWin10StartupSound } from '../utils/win10Audio';

interface Windows10BootScreenProps {
  onComplete: () => void;
  autoPlayAudio?: boolean;
}

export const Windows10BootScreen: React.FC<Windows10BootScreenProps> = ({
  onComplete,
  autoPlayAudio = true,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('win10_boot_sound_enabled') !== 'false';
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
        playWin10StartupSound(0.35);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [soundEnabled, autoPlayAudio]);

  // Manage Windows 10 boot timing & skip keys
  useEffect(() => {
    const tEnd = setTimeout(() => {
      handleFinish();
    }, 3800);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(tEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('win10_boot_sound_enabled', String(next));
    if (next) {
      playWin10StartupSound(0.35);
    }
  };

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[99999] bg-black text-white select-none flex flex-col justify-between items-center px-4 py-8 font-sans transition-opacity duration-500 cursor-pointer overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      title="Clique ou pressione qualquer tecla para pular a inicialização do Windows 10"
    >
      {/* Top action bar: sound toggle and skip button */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-slate-400">
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#111] hover:bg-[#222] border border-[#333] text-slate-300 hover:text-white transition text-[11px] shadow-xs cursor-pointer"
          title={soundEnabled ? 'Silenciar som de inicialização' : 'Ativar som de inicialização'}
        >
          {soundEnabled ? (
            <>
              <Volume2 size={13} className="text-[#00adef]" />
              <span>Som Win 10 [Ativo]</span>
            </>
          ) : (
            <>
              <VolumeX size={13} className="text-slate-500" />
              <span>Som Win 10 [Mudo]</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#111] hover:bg-[#e81123] border border-[#333] hover:border-[#e81123] text-slate-300 hover:text-white transition text-[11px] shadow-xs cursor-pointer"
          title="Pular animação de inicialização do Windows 10"
        >
          <span>Pular</span>
          <span className="text-[10px] text-slate-500 hover:text-white/80 font-mono">[ESC]</span>
          <X size={12} className="ml-0.5" />
        </button>
      </div>

      {/* Main Center Stage: Official Windows 10 Angled Logo + Rotating Dots Progress Ring */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-md">
        {/* Windows 10 Official Perspective 4-pane Cyan/Blue Logo */}
        <div className="relative mb-12 sm:mb-16">
          <svg
            className="w-24 h-24 sm:w-28 sm:h-28 filter drop-shadow-[0_0_12px_rgba(0,173,239,0.35)]"
            viewBox="0 0 115 119"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top-Left Quadrant */}
            <path
              d="M0 16.5L45.4 10.3V56.4H0V16.5Z"
              fill="#00adef"
            />
            {/* Top-Right Quadrant */}
            <path
              d="M50.6 9.6L114.7 0V55.7H50.6V9.6Z"
              fill="#00adef"
            />
            {/* Bottom-Left Quadrant */}
            <path
              d="M0 62.4H45.4V108.5L0 102.3V62.4Z"
              fill="#00adef"
            />
            {/* Bottom-Right Quadrant */}
            <path
              d="M50.6 62.4H114.7V118.1L50.6 108.5V62.4Z"
              fill="#00adef"
            />
          </svg>
        </div>

        {/* Windows 10 Signature Circular Orbiting Dots Spinner (ProgressRing) */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* 5 Dots rotating in non-linear acceleration ring */}
          <div className="win10-progress-ring">
            <div className="win10-dot win10-dot-1"></div>
            <div className="win10-dot win10-dot-2"></div>
            <div className="win10-dot win10-dot-3"></div>
            <div className="win10-dot win10-dot-4"></div>
            <div className="win10-dot win10-dot-5"></div>
          </div>
        </div>

        {/* Subtitle / System Info */}
        <div className="mt-8 flex flex-col items-center text-center">
          <div
            className="text-base sm:text-lg text-slate-200 tracking-wide font-normal font-sans antialiased"
            style={{ fontFamily: "'Segoe UI', 'Segoe UI Web', -apple-system, sans-serif" }}
          >
            Iniciando o Windows 10
          </div>

          <div className="mt-2 text-[11px] text-[#00adef]/90 tracking-widest uppercase font-mono">
            WikiWorldWeb 10 Pro • 22H2
          </div>
        </div>
      </div>

      {/* Footer Copyright and instruction */}
      <div className="w-full max-w-xl text-center text-xs text-slate-500 space-y-1">
        <p className="text-[11px] tracking-wide text-slate-400">
          Pressione <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] border border-[#333] rounded-none text-slate-200 font-mono text-[10px]">ESC</kbd> ou clique em qualquer lugar para pular
        </p>
        <p className="text-[10px] text-slate-600 font-sans">
          © Microsoft Corporation. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
