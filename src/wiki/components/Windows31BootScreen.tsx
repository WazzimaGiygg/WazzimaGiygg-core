import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, X, Terminal } from 'lucide-react';
import { playWin31StartupSound } from '../utils/win31Audio';

interface Windows31BootScreenProps {
  onComplete: () => void;
  autoPlayAudio?: boolean;
}

export const Windows31BootScreen: React.FC<Windows31BootScreenProps> = ({
  onComplete,
  autoPlayAudio = true,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [bootPhase, setBootPhase] = useState<'dos' | 'splash'>('dos');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [bootStepText, setBootStepText] = useState('Iniciando MS-DOS 6.22...');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('win31_boot_sound_enabled') !== 'false';
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

  // Sound playback on entering splash screen
  useEffect(() => {
    if (bootPhase === 'splash' && soundEnabled && autoPlayAudio) {
      const timer = setTimeout(() => {
        playWin31StartupSound(0.35);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [bootPhase, soundEnabled, autoPlayAudio]);

  // Boot sequence timer: quick DOS phase then Windows 3.1 Splash Screen
  useEffect(() => {
    // Phase 1: DOS prompt for 550ms
    const dosTimer = setTimeout(() => {
      setBootPhase('splash');
    }, 550);

    // Progress bar simulation
    const p1 = setTimeout(() => {
      setLoadingProgress(25);
      setBootStepText('Carregando HIMEM.SYS & SMARTDRV...');
    }, 800);

    const p2 = setTimeout(() => {
      setLoadingProgress(60);
      setBootStepText('Carregando modo 386 avançado & drivers VxD...');
    }, 1400);

    const p3 = setTimeout(() => {
      setLoadingProgress(90);
      setBootStepText('Inicializando Gerenciador de Programas (PROGMAN.EXE)...');
    }, 2100);

    const p4 = setTimeout(() => {
      setLoadingProgress(100);
      setBootStepText('TADA.WAV executado! Bem-vindo ao Windows 3.1');
    }, 2800);

    // Auto-finish after 3.2s
    const endTimer = setTimeout(() => {
      handleFinish();
    }, 3250);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(dosTimer);
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(p4);
      clearTimeout(endTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('win31_boot_sound_enabled', String(next));
    if (next) {
      playWin31StartupSound(0.35);
    }
  };

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[99999] select-none flex flex-col justify-between items-center px-4 py-6 font-sans transition-opacity duration-400 cursor-pointer overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${bootPhase === 'dos' ? 'bg-black text-[#55ff55]' : 'bg-[#000080] text-white'}`}
      style={
        bootPhase === 'splash'
          ? {
              backgroundColor: '#000080',
              backgroundImage:
                'radial-gradient(ellipse at 50% 35%, #0000aa 0%, #000080 50%, #000055 100%)',
            }
          : undefined
      }
      title="Clique ou pressione qualquer tecla para continuar"
    >
      {/* Top action bar: sound toggle and skip button */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs z-10">
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#c0c0c0] hover:bg-[#d4d0c8] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black text-black font-mono text-[11px] shadow-sm cursor-pointer"
          title={soundEnabled ? 'Silenciar som TADA.WAV' : 'Ativar som TADA.WAV'}
        >
          {soundEnabled ? (
            <>
              <Volume2 size={13} className="text-[#000080]" />
              <span>Som TADA.WAV [Ativo]</span>
            </>
          ) : (
            <>
              <VolumeX size={13} className="text-slate-600" />
              <span>Som TADA.WAV [Mudo]</span>
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
          title="Pular inicialização do Windows 3.1"
        >
          <span>Pular</span>
          <span className="text-[10px] text-slate-700 font-mono">[ESC]</span>
          <X size={12} className="ml-0.5" />
        </button>
      </div>

      {/* PHASE 1: MS-DOS 6.22 Prompt Boot Screen */}
      {bootPhase === 'dos' && (
        <div className="my-auto w-full max-w-2xl font-mono text-xs sm:text-sm text-[#00ff00] space-y-1.5 p-4 bg-black border-2 border-[#333333] shadow-2xl">
          <div className="flex items-center gap-2 text-white border-b border-[#333333] pb-2 mb-3">
            <Terminal size={14} className="text-[#00ff00]" />
            <span className="font-bold">MS-DOS Versão 6.22 (C) 1981-1994 Microsoft Corp.</span>
          </div>
          <p className="text-white">Iniciando o sistema operacional de disco...</p>
          <p className="text-slate-400">HIMEM: Controlador de memória XMS Versão 3.09 ativo.</p>
          <p className="text-slate-400">SMARTDrive: Controlador de aceleração de disco 2048 KB instalado.</p>
          <p className="text-slate-400">COMMAND.COM carregado em memória alta.</p>
          <div className="pt-2 flex items-center gap-1 text-white font-bold text-base">
            <span className="text-[#00ff00]">C:\WINDOWS&gt;</span>
            <span className="text-white">WIN</span>
            <span className="w-2.5 h-4 bg-white animate-pulse inline-block ml-0.5" />
          </div>
        </div>
      )}

      {/* PHASE 2: Official Microsoft Windows 3.1 Splash Screen */}
      {bootPhase === 'splash' && (
        <div className="my-auto flex flex-col items-center justify-center w-full max-w-xl animate-in zoom-in-95 duration-200">
          {/* Main 3.1 Framed Box (Classic VGA 16-color box) */}
          <div className="w-full bg-[#c0c0c0] text-black border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black shadow-[4px_4px_0px_#000000] p-6 sm:p-8 flex flex-col items-center">
            {/* Top Windows 3.1 Flying Flag Logo with black pixel dust trail */}
            <div className="relative mb-5 flex items-center justify-center">
              <svg
                className="w-32 h-32 sm:w-40 sm:h-40 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Black pixel trail dots (the legendary 3.1 flying trail) */}
                <rect x="18" y="52" width="7" height="7" fill="#000000" />
                <rect x="28" y="42" width="6" height="6" fill="#000000" />
                <rect x="15" y="78" width="8" height="8" fill="#000000" />
                <rect x="32" y="72" width="7" height="7" fill="#000000" />
                <rect x="22" y="104" width="7" height="7" fill="#000000" />
                <rect x="38" y="115" width="8" height="8" fill="#000000" />
                <rect x="16" y="132" width="6" height="6" fill="#000000" />
                <rect x="30" y="145" width="7" height="7" fill="#000000" />

                {/* Pane 1: Red (Top Left) */}
                <path
                  d="M 52 46 C 72 36, 92 56, 108 48 C 108 70, 107 92, 106 108 C 88 114, 68 94, 50 104 Z"
                  fill="#ff0000"
                  stroke="#000000"
                  strokeWidth="3"
                />
                {/* Pane 2: Green (Top Right) */}
                <path
                  d="M 116 48 C 134 40, 154 60, 174 52 C 173 74, 171 96, 170 112 C 150 120, 130 100, 114 110 Z"
                  fill="#00aa00"
                  stroke="#000000"
                  strokeWidth="3"
                />
                {/* Pane 3: Blue (Bottom Left) */}
                <path
                  d="M 48 112 C 68 102, 88 122, 104 116 C 104 136, 103 158, 102 172 C 84 178, 64 160, 46 168 Z"
                  fill="#0000ff"
                  stroke="#000000"
                  strokeWidth="3"
                />
                {/* Pane 4: Yellow (Bottom Right) */}
                <path
                  d="M 112 118 C 130 110, 150 130, 168 124 C 167 144, 165 166, 164 180 C 146 188, 126 168, 110 178 Z"
                  fill="#ffff00"
                  stroke="#000000"
                  strokeWidth="3"
                />
              </svg>
            </div>

            {/* Microsoft Windows Typography (Authentic 1992 branding) */}
            <div className="text-center space-y-1">
              <div
                className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-black"
                style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}
              >
                MICROSOFT.
              </div>
              <div
                className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-black"
                style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}
              >
                WINDOWS<span className="text-base align-top ml-0.5">™</span>
              </div>
              <div className="text-sm font-sans font-bold text-slate-800 tracking-wide pt-0.5">
                Operating System, Version 3.1
              </div>
              <div className="text-[11px] font-mono text-slate-700 pt-1">
                Copyright © Microsoft Corporation 1985–1992. Todos os direitos reservados.
              </div>
            </div>

            {/* Mode Tag */}
            <div className="mt-4 px-3 py-1 bg-[#ffffff] border border-black text-black font-mono text-xs font-bold shadow-[2px_2px_0px_#808080] flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#000080]" />
              <span>Modo Protegido 386 Avançado • WikiZero Edition</span>
            </div>

            {/* 3D Sunken Progress Track with Segmented Blocks */}
            <div className="w-full max-w-sm mt-6">
              <div className="flex items-center justify-between text-[11px] font-mono text-black font-bold mb-1">
                <span className="truncate">{bootStepText}</span>
                <span>{loadingProgress}%</span>
              </div>
              <div className="w-full h-5 bg-[#ffffff] border-t-2 border-l-2 border-[#808080] border-r-2 border-b-2 border-white p-[2px] flex items-center">
                <div
                  className="h-full bg-[#000080] transition-all duration-300 ease-out flex items-center justify-end px-1"
                  style={{ width: `${Math.max(5, loadingProgress)}%` }}
                >
                  <div className="w-1.5 h-full bg-[#3b82f6] opacity-75" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="w-full max-w-md text-center text-xs font-mono text-slate-300 space-y-1 z-10">
        <p className="text-[11px]">
          Pressione <kbd className="px-1.5 py-0.5 bg-[#c0c0c0] border border-black text-black font-bold">ESC</kbd> ou clique para pular
        </p>
        <p className="text-[10px] text-slate-400">
          Microsoft Windows 3.1 (1992) • Som TADA.WAV sintetizado via Web Audio API
        </p>
      </div>
    </div>
  );
};
