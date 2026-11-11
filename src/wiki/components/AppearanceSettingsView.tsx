import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  Monitor,
  Smartphone,
  Tv,
  Sun,
  Moon,
  Sparkles,
  Check,
  RotateCcw,
  Type,
  Eye,
  Sliders,
  Info,
  Layers,
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Terminal,
  Pickaxe,
  Gamepad2,
  Bell,
  ShieldCheck,
  Puzzle,
  Lock,
} from 'lucide-react';
import { AppTheme, DeviceMode, ViewMode } from '../types';
import { ExtensionManager } from '../core/ExtensionManager';
import { playPCSpeakerBeep, playWin95Tada } from '../utils/win95Audio';
import { playHalfLifeHEVBeep, playHalfLifeGeiger } from '../utils/halfLifeAudio';
import { playWin31StartupSound, playWin31Ding } from '../utils/win31Audio';
import { playAndroid23Chime, playAndroid23Click } from '../utils/android23Audio';

interface AppearanceSettingsViewProps {
  currentTheme: AppTheme;
  onSetTheme: (theme: AppTheme) => void;
  deviceMode: DeviceMode;
  onToggleDeviceMode: (mode: DeviceMode) => void;
  onNavigate: (view: ViewMode) => void;
}

export const AppearanceSettingsView: React.FC<AppearanceSettingsViewProps> = ({
  currentTheme,
  onSetTheme,
  deviceMode,
  onToggleDeviceMode,
  onNavigate,
}) => {
  // Reading typography preferences
  const [fontScale, setFontScale] = useState<'compact' | 'normal' | 'large' | 'huge'>(() => {
    return (localStorage.getItem('wikizero_font_scale') as any) || 'normal';
  });

  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>(() => {
    return (localStorage.getItem('wikizero_font_family') as any) || 'sans';
  });

  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [extensionNotice, setExtensionNotice] = useState<string | null>(null);

  const extensionManager = ExtensionManager.getInstance();
  const [, setExtensionUpdateTick] = useState<number>(0);

  // Monitora em tempo real se a extensão do Android 2.3 está ativa no ExtensionManager
  const [isAndroid23Active, setIsAndroid23Active] = useState<boolean>(() =>
    extensionManager.isExtensionLoaded('Android23GingerbreadTheme')
  );

  useEffect(() => {
    const unsub = extensionManager.subscribe(() => {
      setIsAndroid23Active(
        extensionManager.isExtensionLoaded('Android23GingerbreadTheme')
      );
      setExtensionUpdateTick((prev) => prev + 1);
    });
    return unsub;
  }, [extensionManager]);

  // Apply typography adjustments to document body
  useEffect(() => {
    localStorage.setItem('wikizero_font_scale', fontScale);
    localStorage.setItem('wikizero_font_family', fontFamily);

    const body = document.body;
    // Remove previous typography classes
    body.classList.remove('font-scale-compact', 'font-scale-large', 'font-scale-huge');
    body.classList.remove('font-family-serif', 'font-family-mono');

    if (fontScale === 'compact') body.classList.add('font-scale-compact');
    if (fontScale === 'large') body.classList.add('font-scale-large');
    if (fontScale === 'huge') body.classList.add('font-scale-huge');

    if (fontFamily === 'serif') body.classList.add('font-family-serif');
    if (fontFamily === 'mono') body.classList.add('font-family-mono');
  }, [fontScale, fontFamily]);

  const handleSelectTheme = (newTheme: AppTheme) => {
    if (newTheme === 'android23' && !isAndroid23Active) {
      setExtensionNotice(
        'O tema Android 2.3 Gingerbread faz parte de uma extensão e está atualmente DESATIVADA pelo Conselho de Burocratas. Apenas burocratas podem reativar a extensão no Painel de Administração.'
      );
      setTimeout(() => setExtensionNotice(null), 6000);
      return;
    }

    onSetTheme(newTheme);
    if (newTheme === 'android23') {
      playAndroid23Chime(0.28);
    } else if (newTheme === 'win1') {
      playPCSpeakerBeep(880, 0.12, 0.25);
      setTimeout(() => playPCSpeakerBeep(1174, 0.14, 0.25), 130);
    } else if (newTheme === 'win31') {
      playWin31StartupSound(0.35);
    } else if (newTheme === 'win95') {
      playWin95Tada(0.25);
    } else if (newTheme === 'halflife') {
      playHalfLifeHEVBeep(0.3);
    }
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2200);
  };

  const handleResetDefaults = () => {
    onSetTheme('light');
    setFontScale('normal');
    setFontFamily('sans');
    onToggleDeviceMode('auto');
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2200);
  };

  const themesList: {
    id: AppTheme;
    name: string;
    subtitle: string;
    description: string;
    tag: string;
    accentColor: string;
    bgPreview: string;
    badgeStyle: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'light',
      name: 'WikiWorldWeb Clássico Claro',
      subtitle: 'Padrão Wikipédia & Wikimedia',
      description: 'Design enciclopédico atemporal com fundo branco/cinza claro, contraste balanceado para longas leituras e tipografia limpa.',
      tag: 'Padrão Enciclopédico',
      accentColor: '#2563eb',
      bgPreview: 'bg-white border-slate-300 text-slate-800',
      badgeStyle: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Sun size={18} className="text-amber-500" />,
    },
    {
      id: 'dark',
      name: 'WikiWorldWeb Modo Escuro',
      subtitle: 'Alto Contraste Noturno',
      description: 'Tons grafite e ardósia profunda que reduzem a fadiga ocular em ambientes de pouca luz, com links azuis fluorescentes de alta legibilidade.',
      tag: 'Modo Noturno',
      accentColor: '#38bdf8',
      bgPreview: 'bg-[#0b0f17] border-slate-700 text-slate-100',
      badgeStyle: 'bg-slate-800 text-sky-300 border-slate-700',
      icon: <Moon size={18} className="text-blue-400" />,
    },
    {
      id: 'google',
      name: 'Google Material You Claro',
      subtitle: 'Google Design System M3',
      description: 'Bordas arredondadas suaves, paleta multicolorida do Google (azul, vermelho, amarelo e verde), cantos arredondados modernos e sombras elegantes.',
      tag: 'Material You',
      accentColor: '#4285F4',
      bgPreview: 'bg-[#f8fafd] border-blue-200 text-slate-800',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-300',
      icon: (
        <div className="flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
          <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
          <span className="w-2 h-2 rounded-full bg-[#FBBC05]" />
          <span className="w-2 h-2 rounded-full bg-[#34A853]" />
        </div>
      ),
    },
    {
      id: 'google-dark',
      name: 'Google Material You Escuro',
      subtitle: 'Google Dark Charcoal',
      description: 'Visual noturno no estilo Google Dark Mode (#202124), com cartões flutuantes elevados e acentos suaves em tons pastel.',
      tag: 'Material Dark',
      accentColor: '#8ab4f8',
      bgPreview: 'bg-[#202124] border-slate-700 text-slate-100',
      badgeStyle: 'bg-[#303134] text-blue-300 border-slate-600',
      icon: (
        <div className="flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-[#8ab4f8]" />
          <span className="w-2 h-2 rounded-full bg-[#f28b82]" />
          <span className="w-2 h-2 rounded-full bg-[#fdd663]" />
          <span className="w-2 h-2 rounded-full bg-[#81c995]" />
        </div>
      ),
    },
    {
      id: 'win1',
      name: 'Windows 1.0 (1985)',
      subtitle: 'MS-DOS Executive, Janelas Lado a Lado & Paleta EGA',
      description: 'A histórica primeira versão do Windows lançada em novembro de 1985: janelas lado a lado sem sobreposição, barra de título azul sólido (#0000aa) com caixa de menu [-], fundo teal (#008080), botões com borda preta sólida e área de ícones clássica com Reversi, Clock e MS-DOS Executive.',
      tag: 'EGA 1985 MS-DOS',
      accentColor: '#0000aa',
      bgPreview: 'bg-[#008080] border-2 border-black text-black font-mono shadow-md',
      badgeStyle: 'bg-[#0000aa] text-white font-bold border border-black',
      icon: (
        <div className="w-4 h-4 bg-[#0000aa] border border-black flex items-center justify-center text-[9px] font-mono font-bold text-white">
          W1
        </div>
      ),
    },
    {
      id: 'win31',
      name: 'Windows 3.1 (1992)',
      subtitle: 'Program Manager, Janelas 3D Chanfradas & Paleta VGA 16 Cores',
      description: 'A histórica interface gráfica do Windows 3.1 lançada pela Microsoft em abril de 1992: animação de boot completa com logotipo da bandeira voadora (flying flag) e fanfarra triunfante TADA.WAV, Program Manager (PROGMAN.EXE), fundo teal (#008080), barras de título azul marinho (#000080) com botão de controle [-] e setas [▲] [▼], botões 3D chanfrados e menus clássicos.',
      tag: 'VGA 1992 + TADA.WAV',
      accentColor: '#000080',
      bgPreview: 'bg-[#008080] border-2 border-black text-black font-sans shadow-md',
      badgeStyle: 'bg-[#000080] text-white font-bold border border-black',
      icon: (
        <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] font-bold text-[#000080]">
          3.1
        </div>
      ),
    },
    {
      id: 'win95',
      name: 'Windows 95 Retrô OS',
      subtitle: 'Nostalgia Clássica dos Anos 90 com Clippy Bot',
      description: 'Visual autêntico do clássico Windows 95, com barras de título azul marinho, bordas chanfradas 3D, barra de tarefas com botão Iniciar e o clássico Bot Assistente Clippy integrado.',
      tag: 'Clippy Bot + Anos 90',
      accentColor: '#000080',
      bgPreview: 'bg-[#c0c0c0] border-t-white border-l-white border-r-black border-b-black border-2 text-black font-sans',
      badgeStyle: 'bg-[#000080] text-white font-bold',
      icon: <Monitor size={18} className="text-teal-600" />,
    },
    {
      id: 'winxp',
      name: 'Windows XP Luna Blue (2001)',
      subtitle: 'Nostalgia Clássica do Windows XP, Luna & Bliss',
      description: 'A lendária interface do Windows XP com animação clássica de boot e som de inicialização: barras de título Luna Blue, botão vermelho de fechar, botão Iniciar verde, caixas bege e papel de parede Bliss.',
      tag: 'Boot Clássico + Luna',
      accentColor: '#0055ea',
      bgPreview: 'bg-[#ece9d8] border-[#0055ea] border-2 text-[#000000] font-sans shadow-md',
      badgeStyle: 'bg-gradient-to-r from-[#0055ea] to-[#3a84f3] text-white font-bold border border-[#003bb3]',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#f25022" d="M2 3h9v9H2z" />
          <path fill="#7fba00" d="M13 3h9v9h-9z" />
          <path fill="#00a4ef" d="M2 13h9v9H2z" />
          <path fill="#ffb900" d="M13 13h9v9h-9z" />
        </svg>
      ),
    },
    {
      id: 'win7',
      name: 'Windows 7 Aero Glass (2009)',
      subtitle: 'Aero Glass, Superbar & Transparência Cristalina',
      description: 'O aclamado visual do Windows 7 com efeitos Aero Glass translúcidos, reflexos vítreos, Superbar com Aero Peek, botão Iniciar Orb esférico e a célebre animação de inicialização com as 4 esferas de luz convergentes e chime orquestral.',
      tag: 'Aero Glass + Boot 7',
      accentColor: '#00a4ef',
      bgPreview: 'bg-gradient-to-b from-[#154c7d] to-[#2d82b2] border-[#7da2ce] border text-white font-sans shadow-md',
      badgeStyle: 'bg-gradient-to-r from-[#0080ff] to-[#00c0ff] text-white font-bold border border-white/40',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 160 160">
          <path d="M 28 34 C 44 26, 62 46, 75 40 C 75 58, 74 76, 74 88 C 60 94, 44 74, 27 82 Z" fill="#f25022" />
          <path d="M 83 39 C 97 33, 115 48, 133 42 C 132 60, 130 78, 129 90 C 114 96, 97 78, 83 87 Z" fill="#7fba00" />
          <path d="M 26 89 C 43 82, 60 100, 74 95 C 73 112, 72 130, 71 142 C 58 147, 41 129, 25 137 Z" fill="#00a4ef" />
          <path d="M 82 94 C 96 88, 114 103, 128 97 C 127 114, 125 131, 124 144 C 110 150, 94 132, 81 141 Z" fill="#ffb900" />
        </svg>
      ),
    },
    {
      id: 'win10',
      name: 'Windows 10 Pro (Fluent)',
      subtitle: 'Fluent Design, Hero Wallpaper & Boot Circular Dots',
      description: 'O consagrado visual do Windows 10 com estética Fluent Design, iluminação volumétrica Hero Wallpaper, barra de tarefas escura acrílica com Cortana, janelas minimalistas e a clássica tela de boot com o logotipo angulado azul e o spinner circular de pontos giratórios.',
      tag: 'Boot Win 10 + Fluent',
      accentColor: '#0078d7',
      bgPreview: 'bg-gradient-to-b from-[#001026] to-[#001b3a] border-[#0078d7] border-2 text-white font-sans shadow-md',
      badgeStyle: 'bg-gradient-to-r from-[#0078d7] to-[#00adef] text-white font-bold border border-[#005a9e]',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 115 119" fill="none">
          <path d="M0 16.5L45.4 10.3V56.4H0V16.5Z" fill="#00adef" />
          <path d="M50.6 9.6L114.7 0V55.7H50.6V9.6Z" fill="#00adef" />
          <path d="M0 62.4H45.4V108.5L0 102.3V62.4Z" fill="#00adef" />
          <path d="M50.6 62.4H114.7V118.1L50.6 108.5V62.4Z" fill="#00adef" />
        </svg>
      ),
    },
    {
      id: 'wikidiota',
      name: 'Wikidiota (Paródia da Wikipédia)',
      subtitle: 'Tema Nativo da Wikipédia & Wikiomite Foundation',
      description: 'Paródia bem-humorada da interface clássica e nativa (Vector/Monobook) da Wikipédia, retratando a "Wikiomite Foundation", a enciclopédia que qualquer idiota pode editar, com fontes serifadas, abas de discussão, caixas de aviso cômicas e rodapé de licenciamento.',
      tag: 'Vector Nativo + Wikiomite',
      accentColor: '#3366cc',
      bgPreview: 'bg-[#f6f6f6] border-[#a7d7f9] border text-[#202122] font-serif shadow-xs',
      badgeStyle: 'bg-[#eaecf0] text-[#0645ad] font-bold border border-[#a2a9b1]',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="#f8f9fa" stroke="#54595d" strokeWidth="6" />
          <path d="M 20 30 Q 35 25, 50 30 T 80 30" fill="none" stroke="#a2a9b1" strokeWidth="4" />
          <path d="M 10 50 Q 30 45, 50 50 T 90 50" fill="none" stroke="#a2a9b1" strokeWidth="4" />
          <text x="22" y="44" fontSize="22" fontFamily="serif" fill="#202122">W</text>
          <text x="44" y="66" fontSize="26" fontFamily="serif">🤪</text>
        </svg>
      ),
    },
    {
      id: 'genshin',
      name: 'Genshin Impact Astral',
      subtitle: 'Teyvat Celestia & Primogem',
      description: 'Inspirado na interface do RPG Genshin Impact, com fundo azul espacial profundo (#0d111d), ornamentos dourados celestiais (#d3bc8e) e acentos de Primogemas.',
      tag: 'Teyvat Astral',
      accentColor: '#d3bc8e',
      bgPreview: 'bg-[#14192b] border-[#d3bc8e]/40 text-[#f5ebd7]',
      badgeStyle: 'bg-gradient-to-r from-[#715ae0] to-[#35a5ea] text-white border-amber-300/40',
      icon: <Sparkles size={18} className="text-amber-400 animate-pulse" />,
    },
    {
      id: 'android15',
      name: 'Android 1.5 Cupcake (2009)',
      subtitle: 'Retrô Droid OS & HTC Dream',
      description: 'Estética clássica do início do sistema Android (1.5 Cupcake): barra de notificações preta, linhas verde-robô (#A4C639), botões cinza escovado e widget de busca.',
      tag: 'Cupcake 2009',
      accentColor: '#A4C639',
      bgPreview: 'bg-[#1e2023] border-[#383a3d] border-t-2 border-t-[#A4C639] text-[#e2e4e8]',
      badgeStyle: 'bg-[#A4C639]/20 text-[#A4C639] border border-[#A4C639]/50 font-bold',
      icon: (
        <svg className="w-4 h-4 fill-current text-[#A4C639]" viewBox="0 0 24 24">
          <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
      ),
    },
    {
      id: 'android23',
      name: 'Android 2.3 Gingerbread (2010)',
      subtitle: 'Nexus S, Dark AMOLED UI & Acentos Verde Néon',
      description: 'Design lendário do Android 2.3 Gingerbread provido pela extensão da enciclopédia: barra de status preta AMOLED, indicadores de sinal de rede e bateria em verde néon vibrante (#A4C639), botões táteis chanfrados e tipografia Droid Sans.',
      tag: 'Gingerbread 2.3 (Extensão)',
      accentColor: '#A4C639',
      bgPreview: 'bg-[#0c0d10] border-[#252830] border-t-2 border-t-[#A4C639] text-[#e2e8f0]',
      badgeStyle: 'bg-[#A4C639]/20 text-[#A4C639] border border-[#A4C639]/50 font-bold',
      icon: (
        <svg className="w-4 h-4 fill-current text-[#A4C639]" viewBox="0 0 24 24">
          <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
      ),
    },
    {
      id: 'stardew',
      name: 'Stardew Valley (Vale da Estrela)',
      subtitle: 'Pelican Town, Madeira & Pergaminho',
      description: 'Estética acolhedora da fazenda de Stardew Valley: caixas de diálogo em pergaminho suave, molduras em madeira rústica, relógio da fazenda e acentos dourados e rurais.',
      tag: 'Pelican Town',
      accentColor: '#d49e3d',
      bgPreview: 'bg-[#fffaf0] border-[#6b401b] border-2 text-[#3b2816]',
      badgeStyle: 'bg-[#d49e3d]/25 text-[#7a4611] border border-[#d49e3d]/70 font-bold',
      icon: <span className="text-base select-none leading-none">🍏</span>,
    },
    {
      id: 'repo',
      name: 'R.E.P.O. (Semiwork Studios)',
      subtitle: 'Terminal de Extração e Salvamento Industrial',
      description: 'Inspirado no jogo cooperativo de extração e terror sci-fi R.E.P.O. do estúdio Semiwork. Fundo industrial sombrio de carcaça espacial, faixas de perigo amarelo e preto (hazard stripes), fósforo ciano CRT, dados de telemetria e botões mecânicos táteis de salvamento de sucata.',
      tag: 'Semiwork R.E.P.O.',
      accentColor: '#f59e0b',
      bgPreview: 'bg-[#090c10] border-[#f59e0b] border-2 text-[#22d3ee] font-mono shadow-[0_0_12px_rgba(245,158,11,0.2)]',
      badgeStyle: 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/70 font-mono font-bold tracking-wider',
      icon: <AlertTriangle size={18} className="text-amber-400 animate-pulse" />,
    },
    {
      id: 'minecraft',
      name: 'Minecraft (Mojang Studios)',
      subtitle: 'Blocos, Nether, Redstone & Barra de XP',
      description: 'Estética clássica em blocos cúbicos do Minecraft: bordas chanfradas em pedra esculpida e cobblestone, barra de nível de experiência XP verde vibrante (#55ff55), corações de vida, inventário rústico e botões em pedra polida.',
      tag: 'Mojang Minecraft',
      accentColor: '#55ff55',
      bgPreview: 'bg-[#1b1815] border-[#4a423d] border-2 text-[#55ff55] font-mono shadow-[0_0_14px_rgba(85,255,85,0.25)]',
      badgeStyle: 'bg-[#10b981]/20 text-[#55ff55] border border-[#55ff55]/70 font-mono font-bold tracking-wider',
      icon: <Pickaxe size={18} className="text-[#55ff55] animate-bounce" />,
    },
    {
      id: 'roblox',
      name: 'Roblox (Roblox Corporation)',
      subtitle: 'Gaming Dark Mode, Blox Tilt & Robux Accent',
      description: 'Interface moderna inspirada no cliente e site da Roblox: fundo ultra-escuro grafite (#111216 / #191b1f), ícone de cubo inclinado Blox, acentos em vermelho carmesim e verde Robux, badges limpos e barra superior de experiência.',
      tag: 'Roblox Blox UI',
      accentColor: '#00b06f',
      bgPreview: 'bg-[#111216] border-[#393b3d] border-2 text-[#ffffff] font-sans shadow-[0_0_14px_rgba(0,176,111,0.2)]',
      badgeStyle: 'bg-[#00b06f]/20 text-[#00b06f] border border-[#00b06f]/70 font-bold tracking-wide',
      icon: <Gamepad2 size={18} className="text-[#00b06f]" />,
    },
    {
      id: 'nokia3310',
      name: 'Nokia 3310 Monocromático (2000)',
      subtitle: 'Display Gráfico LCD 84×48 & Snake II',
      description: 'Inspirado no lendário visor monocromático do clássico celular Nokia 3310: matriz de pontos LCD verde oliva (#c2d6a4), pixels pretos de alto contraste, bordas nítidas de pixel, menus invertidos e pura nostalgia de Snake II e Connecting People.',
      tag: 'Nokia 3310 LCD',
      accentColor: '#435436',
      bgPreview: 'bg-[#b7cc98] border-2 border-[#1f281b] text-[#1f281b] font-mono shadow-[2px_2px_0px_#1f281b]',
      badgeStyle: 'bg-[#1f281b] text-[#c2d6a4] font-mono font-bold tracking-wider',
      icon: <Smartphone size={18} className="text-[#1f281b]" />,
    },
    {
      id: 'halflife',
      name: 'Half-Life (Black Mesa Research Facility)',
      subtitle: 'Traje HEV Mark IV, HUD Âmbar, Complexo Lambda & Setor C',
      description: 'A lendária estética industrial e futurista de Half-Life (1998 / Valve): HUD âmbar característico (#ff9900), medidores de energia e integridade do traje HEV, linhas de perigo (hazard stripes), indicador Lambda (λ), visual de terminal de pesquisa de Black Mesa e efeitos sonoros autênticos.',
      tag: 'HEV Mark IV + Black Mesa',
      accentColor: '#ff9900',
      bgPreview: 'bg-[#141714] border-2 border-[#ff9900] text-[#ff9900] font-mono shadow-[0_0_15px_rgba(255,153,0,0.25)]',
      badgeStyle: 'bg-[#ff9900]/20 text-[#ff9900] border border-[#ff9900]/70 font-mono font-bold tracking-wider',
      icon: (
        <div className="w-5 h-5 rounded-full border-2 border-[#ff9900] flex items-center justify-center font-mono font-black text-xs text-[#ff9900] bg-[#141714]">
          λ
        </div>
      ),
    },
  ];

  // Temas visuais dinâmicos registrados por extensões instaladas
  const customExtThemes = useMemo(() => {
    return extensionManager.getActiveThemes().map((ct) => ({
      id: ct.themeId as any,
      name: ct.displayName,
      subtitle: ct.description || 'Tema fornecido por extensão',
      description: `Tema visual personalizado fornecido por extensão: paleta exclusiva com acentos em ${ct.accentColor || '#3b82f6'}, tipografia e variáveis integradas ao sistema.`,
      tag: 'Extensão Visual',
      accentColor: ct.accentColor || '#3b82f6',
      bgPreview:
        ct.baseTheme === 'dark' || ct.baseTheme === 'cyberpunk'
          ? 'bg-slate-900 border-2 border-purple-500 text-white font-sans shadow-md'
          : 'bg-white border-2 border-purple-500 text-slate-900 font-sans shadow-md',
      badgeStyle:
        'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 font-bold',
      icon: <Palette size={18} className="text-purple-500" />,
    }));
  }, [extensionManager]);

  const allThemesList = useMemo(() => [...themesList, ...customExtThemes], [themesList, customExtThemes]);

  return (
    <div className="w-full space-y-6 animate-in fade-in select-none">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <button
              onClick={() => onNavigate('hub')}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition"
            >
              <ArrowLeft size={12} />
              <span>Início</span>
            </button>
            <span>/</span>
            <button
              onClick={() => onNavigate('special-pages')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Páginas Especiais
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Special:Appearance
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Palette size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-serif-heading tracking-tight flex items-center gap-2">
                <span>Aparência e Temas Visuais</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Personalize de forma centralizada o tema visual, tipografia e modo de exibição da WikiWorldWeb.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Reset & Save Notice */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {showSavedFeedback && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
              <Check size={14} />
              <span>Preferência salva!</span>
            </div>
          )}

          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            title="Restaurar aparência e temas para as configurações originais da enciclopédia"
          >
            <RotateCcw size={13} />
            <span>Restaurar Padrões</span>
          </button>
        </div>
      </div>

      {/* 2. Theme Selection Cards Grid */}
      <div className="space-y-3">
        {extensionNotice && (
          <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <Lock size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block text-sm">Extensão Bloqueada</span>
                {extensionNotice}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('admin-extensions')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 transition shadow-xs"
            >
              <Puzzle size={13} />
              <span>Painel de Extensões</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
              Selecione o Tema da Enciclopédia
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {allThemesList.length} estilos disponíveis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allThemesList.map((t) => {
            const isSelected = currentTheme === t.id;

            return (
              <div
                key={t.id}
                id={`card-theme-${t.id}`}
                onClick={() => handleSelectTheme(t.id)}
                className={`relative rounded-xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                {/* Active Pill */}
                {isSelected && (
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <Check size={11} />
                    <span>Tema Ativo</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Theme Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                        {t.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{t.name}</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {t.subtitle}
                        </p>
                      </div>
                    </div>
                    {t.id === 'android23' && (
                      <div className="shrink-0">
                        {isAndroid23Active ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A4C639]/20 text-[#558b2f] dark:text-[#A4C639] border border-[#A4C639]/40 flex items-center gap-1">
                            <Puzzle size={10} /> Extensão Ativa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                            <Lock size={10} /> Desativada
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Micro Visual Preview Box */}
                  <div className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${t.bgPreview}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] truncate">Exemplo de Artigo</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${t.badgeStyle}`}>
                        {t.tag}
                      </span>
                    </div>
                    <div className="h-1.5 w-3/4 rounded-full bg-current opacity-30" />
                    <div className="h-1.5 w-full rounded-full bg-current opacity-20" />
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] underline font-semibold opacity-90">Wikilink</span>
                      <span className="text-[10px] opacity-70">| Ref. [1]</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                {/* Footer Action Button */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">
                    ID: {t.id}
                  </span>
                  <div className="flex items-center gap-2">
                    {t.id === 'halflife' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playHalfLifeHEVBeep(0.35);
                          }}
                          className="px-2 py-1 rounded text-[11px] font-bold border border-[#ff9900] bg-[#181b18] text-[#ff9900] hover:bg-[#ff9900] hover:text-black transition-colors flex items-center gap-1 font-mono"
                          title="Tocar Bipe do Traje HEV"
                        >
                          <span>HEV</span>
                          <span className="text-[10px]">🔊</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playHalfLifeGeiger(5, 0.25);
                          }}
                          className="px-2 py-1 rounded text-[11px] font-bold border border-[#ff9900]/60 bg-[#181b18] text-[#ffb034] hover:bg-[#ff9900] hover:text-black transition-colors flex items-center gap-1 font-mono"
                          title="Tocar Contador Geiger"
                        >
                          <span>Geiger</span>
                          <span className="text-[10px]">☢</span>
                        </button>
                      </div>
                    )}
                    {t.id === 'win1' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playPCSpeakerBeep(880, 0.12, 0.3);
                          setTimeout(() => playPCSpeakerBeep(1174, 0.15, 0.3), 130);
                        }}
                        className="px-2.5 py-1 rounded-none text-[11px] font-bold border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors flex items-center gap-1 font-mono"
                        title="Tocar Beep do PC Speaker de 1985"
                      >
                        <span>Beep 8086</span>
                        <span className="text-[10px]">🔊</span>
                      </button>
                    )}
                    {t.id === 'win31' && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTheme('win31');
                          }}
                          className="px-2.5 py-1 rounded-none text-[11px] font-bold border-t border-l border-white border-r border-b border-black bg-[#c0c0c0] text-black hover:bg-[#d4d0c8] transition flex items-center gap-1 font-sans shadow-xs"
                          title="Executar animação clássica de inicialização do Windows 3.1"
                        >
                          <span>Boot 3.1</span>
                          <span className="text-[10px]">↺</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playWin31StartupSound(0.35);
                          }}
                          className="px-2 py-1 rounded-none text-[11px] font-bold border-t border-l border-white border-r border-b border-black bg-[#c0c0c0] text-[#000080] hover:bg-[#d4d0c8] transition flex items-center gap-0.5 font-sans"
                          title="Tocar TADA.WAV clássico"
                        >
                          <span>TADA</span>
                          <span className="text-[10px]">🎺</span>
                        </button>
                      </div>
                    )}
                    {t.id === 'win95' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTheme('win95');
                        }}
                        className="px-2.5 py-1 rounded-none text-[11px] font-bold border-t border-l border-white border-r border-b border-black bg-[#c0c0c0] text-black hover:bg-[#d4d0c8] transition flex items-center gap-1 font-mono shadow-xs"
                        title="Executar animação clássica de boot e bot do Windows 95"
                      >
                        <span>Boot 95</span>
                        <span className="text-[10px]">↺</span>
                      </button>
                    )}
                    {t.id === 'winxp' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTheme('winxp');
                        }}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex items-center gap-1"
                        title="Executar animação clássica de boot do Windows XP"
                      >
                        <span>Boot XP</span>
                        <span className="text-[10px]">↺</span>
                      </button>
                    )}
                    {t.id === 'win7' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTheme('win7');
                        }}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-sky-300 dark:border-sky-700 bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition flex items-center gap-1"
                        title="Executar animação de inicialização do Windows 7"
                      >
                        <span>Boot 7</span>
                        <span className="text-[10px]">↺</span>
                      </button>
                    )}
                    {t.id === 'win10' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTheme('win10');
                        }}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-blue-400 dark:border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex items-center gap-1"
                        title="Executar animação de inicialização do Windows 10"
                      >
                        <span>Boot 10</span>
                        <span className="text-[10px]">↺</span>
                      </button>
                    )}
                    {t.id === 'android23' && isAndroid23Active && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playAndroid23Chime(0.35);
                        }}
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold border border-[#A4C639]/50 bg-[#A4C639]/15 text-[#558b2f] dark:text-[#A4C639] hover:bg-[#A4C639]/25 transition flex items-center gap-1 font-mono"
                        title="Tocar notificação clássica do Android 2.3 Gingerbread"
                      >
                        <span>Chime 2.3</span>
                        <span className="text-[10px]">🔔</span>
                      </button>
                    )}
                    {t.id === 'android23' && !isAndroid23Active && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('admin-extensions');
                        }}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition flex items-center gap-1"
                        title="Abrir painel de extensões (Apenas Burocratas)"
                      >
                        <Lock size={11} />
                        <span>Gerenciar</span>
                      </button>
                    )}
                    {t.id === 'android23' && !isAndroid23Active ? (
                      <span className="px-3 py-1 rounded-md text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed flex items-center gap-1">
                        <Lock size={12} />
                        <span>Desativada</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTheme(t.id);
                        }}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check size={12} />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <span>Ativar</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Reading Typography & Accessibility Preferences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Type size={18} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
            Tipografia & Conforto Visual de Leitura
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Font Family Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Família da Fonte dos Artigos
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFontFamily('sans')}
                className={`p-3 rounded-lg border text-left transition flex flex-col gap-1 ${
                  fontFamily === 'sans'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-sans">Sans-Serif</span>
                <span className="text-[10px] text-slate-400 font-normal">Moderna & Limpa</span>
              </button>

              <button
                onClick={() => setFontFamily('serif')}
                className={`p-3 rounded-lg border text-left transition flex flex-col gap-1 ${
                  fontFamily === 'serif'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-serif">Serifada</span>
                <span className="text-[10px] text-slate-400 font-normal">Estilo Enciclopédia</span>
              </button>

              <button
                onClick={() => setFontFamily('mono')}
                className={`p-3 rounded-lg border text-left transition flex flex-col gap-1 ${
                  fontFamily === 'mono'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-mono">Monoespaçada</span>
                <span className="text-[10px] text-slate-400 font-normal">Código & Técnica</span>
              </button>
            </div>
          </div>

          {/* Font Scale Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Tamanho do Texto (Escala)
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setFontScale('compact')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'compact'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-[11px] font-bold">85%</span>
                <span className="text-[9px] text-slate-400">Compacto</span>
              </button>

              <button
                onClick={() => setFontScale('normal')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'normal'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-bold">100%</span>
                <span className="text-[9px] text-slate-400">Padrão</span>
              </button>

              <button
                onClick={() => setFontScale('large')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'large'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-sm font-bold">115%</span>
                <span className="text-[9px] text-slate-400">Confortável</span>
              </button>

              <button
                onClick={() => setFontScale('huge')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                  fontScale === 'huge'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-base font-bold">130%</span>
                <span className="text-[9px] text-slate-400">Acessível</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Display Density & Device Mode */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
            Modo de Densidade & Dispositivo
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Você pode forçar a interface da enciclopédia a adotar a diagramação ideal para computadores, dispositivos móveis ou televisores.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <button
            onClick={() => onToggleDeviceMode('auto')}
            className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
              deviceMode === 'auto'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
              <Eye size={16} />
            </div>
            <div>
              <div className="text-xs font-bold">Automático</div>
              <div className="text-[10px] text-slate-400">Responsivo</div>
            </div>
          </button>

          <button
            onClick={() => onToggleDeviceMode('desktop')}
            className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
              deviceMode === 'desktop'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
              <Monitor size={16} />
            </div>
            <div>
              <div className="text-xs font-bold">Computador</div>
              <div className="text-[10px] text-slate-400">Menu fixo</div>
            </div>
          </button>

          <button
            onClick={() => onToggleDeviceMode('mobile')}
            className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
              deviceMode === 'mobile'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
              <Smartphone size={16} />
            </div>
            <div>
              <div className="text-xs font-bold">Versão Móvel</div>
              <div className="text-[10px] text-slate-400">Otimizado touch</div>
            </div>
          </button>

          <button
            onClick={() => {
              onToggleDeviceMode('tv');
              onNavigate('smart-tv');
            }}
            className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
              deviceMode === 'tv'
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 shrink-0">
              <Tv size={16} />
            </div>
            <div>
              <div className="text-xs font-bold">Modo Smart TV</div>
              <div className="text-[10px] text-slate-400">Interface 10-Foot</div>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Live Interactive Encyclopedia Preview Sandbox */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
              Pré-Visualização em Tempo Real
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Tema ativo: <strong className="text-blue-600 dark:text-blue-400 uppercase">{currentTheme}</strong>
          </span>
        </div>

        {/* Live Mock Article Container with current theme styling */}
        <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Enciclopédia Digital Livre
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Origem: WikiWorldWeb, a enciclopédia aberta e descentralizada.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                Artigo Destacado ✦
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Main Article Mock Body */}
            <div className="md:col-span-2 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Uma <strong>enciclopédia</strong> é uma coletânea de conhecimento humano estruturado de forma
                acessível. A WikiWorldWeb utiliza arquitetura em nuvem com sincronização direta via{' '}
                <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
                  Cloud Firestore
                </span>
                {' '}e tecnologia multilíngue instantânea.
              </p>

              <blockquote className="border-l-4 border-blue-500 pl-3 py-1 text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900/80 rounded-r">
                "O conhecimento deve ser aberto, preservado de forma perene e acessível sob qualquer plataforma ou dispositivo."
              </blockquote>

              <p>
                Esta caixa de exemplo demonstra exatamente como parágrafos, ligações internas{' '}
                <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
                  [Wikilinks]
                </span>
                , citações e tabelas se comportam com as preferências atuais de cor e fonte.
              </p>

              {/* Sample Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden mt-2">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2">Recurso</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Compatibilidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="p-2 font-medium">Temas Visuais Centralizados</td>
                      <td className="p-2 text-emerald-600 font-bold">✓ Operacional</td>
                      <td className="p-2">Todos os navegadores</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Persistência Local (LocalStorage)</td>
                      <td className="p-2 text-emerald-600 font-bold">✓ Ativo</td>
                      <td className="p-2">Desktop, Mobile, TV</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mock Infobox */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 text-xs">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-center font-bold text-slate-800 dark:text-slate-200">
                Ficha Técnica: WikiWorldWeb
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1">
                  <span className="text-slate-400">Tipo:</span>
                  <span className="font-semibold">Enciclopédia Livre</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1">
                  <span className="text-slate-400">Licença:</span>
                  <span className="font-semibold">CC BY-SA 4.0</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1">
                  <span className="text-slate-400">Temas:</span>
                  <span className="font-semibold">{themesList.length} Opções Nativas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Conformidade:</span>
                  <span className="font-semibold text-emerald-600">LGPD & Marco Civil</span>
                </div>
              </div>
            </div>

            {/* Configurar Notificações LGPD */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Notificações LGPD & Privacidade</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                Personalize quais avisos de consentimento, verificação de maioridade e portabilidade disparam notificações no sino do aplicativo.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('mydata')}
                className="w-full py-1.5 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Bell size={12} />
                <span>Configurar Notificações LGPD</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
