import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Shuffle,
  Bell,
  CheckCheck,
  User as UserIcon,
  LogOut,
  Shield,
  Crown,
  Layers,
  Edit3,
  BookOpen,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Globe2,
  ChevronDown,
  Database,
  Menu,
  Monitor,
  Users,
  AlertTriangle,
  Radio,
  Pickaxe,
  Gamepad2,
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
  Puzzle,
} from 'lucide-react';
import { UserProfile, NotificationItem, ViewMode, DeviceMode, AppTheme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatExternalUrl } from '../utils/linkUtils';
import { StorageService } from '../services/storageService';

interface HeaderProps {
  user: UserProfile | null;
  notifications: NotificationItem[];
  currentView: ViewMode;
  searchQuery: string;
  isDark: boolean;
  theme?: AppTheme;
  deviceMode?: DeviceMode;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onRandomPage: () => void;
  onNavigate: (view: ViewMode) => void;
  onNavigateToUser?: (identifier: string) => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onToggleTheme: () => void;
  onSetTheme?: (theme: AppTheme) => void;
  onToggleDeviceMode?: (mode: DeviceMode) => void;
  onOpenMobileDrawer?: () => void;
  onOpenMobileSearch?: () => void;
  onMarkNotificationsAsRead: () => void;
  onNotificationClick: (notif: NotificationItem) => void;
  onOpenLanguagesModal?: () => void;
  onOpenSmartTVModal?: () => void;
  onRebootWin7?: () => void;
  onRebootWin10?: () => void;
  onRebootWinXP?: () => void;
  onRebootWin95?: () => void;
  onRebootWin31?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  notifications,
  currentView,
  searchQuery,
  isDark,
  theme = 'light',
  deviceMode = 'auto',
  onSearchChange,
  onSearchSubmit,
  onRandomPage,
  onNavigate,
  onNavigateToUser,
  onLoginClick,
  onLogoutClick,
  onToggleTheme,
  onSetTheme,
  onToggleDeviceMode,
  onOpenMobileDrawer,
  onOpenMobileSearch,
  onMarkNotificationsAsRead,
  onNotificationClick,
  onOpenLanguagesModal,
  onOpenSmartTVModal,
  onRebootWin7,
  onRebootWin10,
  onRebootWinXP,
  onRebootWin95,
  onRebootWin31,
}) => {
  const { currentLanguage, setLanguage, t, allLanguages } = useLanguage();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showOnlineMenu, setShowOnlineMenu] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const onlineMenuRef = useRef<HTMLDivElement>(null);

  const isGoogleTheme = theme === 'google' || theme === 'google-dark';
  const isWin1 = theme === 'win1';
  const isWin31 = theme === 'win31';
  const isWin95 = theme === 'win95';
  const isWinXP = theme === 'winxp';
  const isWin7 = theme === 'win7';
  const isWin10 = theme === 'win10';
  const isWikidiota = theme === 'wikidiota';
  const isGenshin = theme === 'genshin';
  const isAndroid = theme === 'android15';
  const isAndroid23 = theme === 'android23';
  const isStardew = theme === 'stardew';
  const isRepo = theme === 'repo';
  const isMinecraft = theme === 'minecraft';
  const isRoblox = theme === 'roblox';
  const isNokia = theme === 'nokia3310';
  const isHalfLife = theme === 'halflife';
  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  useEffect(() => {
    StorageService.getOnlineUsers().then((users) => setOnlineUsers(users));
    const unsub = StorageService.subscribeToOnlineUsers((users) => {
      setOnlineUsers(users);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (onlineMenuRef.current && !onlineMenuRef.current.contains(event.target as Node)) {
        setShowOnlineMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  const handleSearchInputClick = () => {
    if (currentView !== 'search') {
      onNavigate('search');
    }
  };

  // Quick popular languages list for instant header dropdown
  const popularLanguages = allLanguages.slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-[#ffffff] dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 transition-colors select-none no-print print:hidden w-full max-w-full overflow-x-clip">
      {/* Windows 1.0 (1985) MS-DOS Executive Window Title Bar */}
      {isWin1 && (
        <div className="bg-[#0000aa] text-white border-b-2 border-black font-mono text-xs select-none">
          {/* Titlebar with [-] System Menu and Arrow controls */}
          <div className="flex items-center justify-between px-2 py-1 bg-[#0000aa] text-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSetTheme?.('light')}
                className="w-4 h-4 bg-black text-white flex items-center justify-center font-bold text-xs border border-white leading-none hover:bg-white hover:text-black cursor-pointer"
                title="Menu do Sistema (Fechar Windows 1.0)"
              >
                -
              </button>
              <span className="font-bold tracking-wider text-xs">
                MS-DOS Executive - WikiZero [Versão 1.01 (1985)]
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="w-4 h-4 bg-black text-white flex items-center justify-center font-bold text-[10px] border border-white leading-none hover:bg-white hover:text-black cursor-pointer"
                title="Minimizar para Área de Ícones"
              >
                ▼
              </button>
              <button
                type="button"
                className="w-4 h-4 bg-black text-white flex items-center justify-center font-bold text-[10px] border border-white leading-none hover:bg-white hover:text-black cursor-pointer"
                title="Maximizar Janela"
              >
                ▲
              </button>
            </div>
          </div>

          {/* Windows 1.0 Menu Bar: File, View, Special */}
          <div className="bg-white text-black border-t-2 border-b-2 border-black px-2 py-0.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
            <div className="flex items-center gap-4">
              <span className="cursor-pointer hover:bg-black hover:text-white px-1"><u>A</u>rquivo</span>
              <span className="cursor-pointer hover:bg-black hover:text-white px-1"><u>E</u>xibir</span>
              <span className="cursor-pointer hover:bg-black hover:text-white px-1"><u>E</u>special</span>
              <span className="cursor-pointer hover:bg-black hover:text-white px-1" onClick={onRandomPage}><u>A</u>leatório</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-700">
              <span className="bg-[#0000aa] text-white px-1.5 py-0.2">A:</span>
              <span className="bg-[#0000aa] text-white px-1.5 py-0.2">B:</span>
              <span className="bg-black text-white px-1.5 py-0.2 font-black">C:</span>
              <span className="font-bold">C:\WIKIZERO\*.*</span>
            </div>
          </div>
        </div>
      )}

      {/* Windows 3.1 (1992) Program Manager Window Title Bar & Menu Bar */}
      {isWin31 && (
        <div className="bg-[#c0c0c0] border-b-2 border-black font-sans text-xs select-none">
          {/* Title Bar with [-] Control Menu, Navy Blue Header, and [▼] [▲] [✕] buttons */}
          <div className="win31-titlebar">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => onSetTheme?.('light')}
                className="win31-btn-sysmenu shrink-0"
                title="Menu de Controle do Sistema (Clique para sair do Windows 3.1)"
              />
              <span className="truncate tracking-wide">
                Gerenciador de Programas - [WikiZero Enciclopédia Multimídia 3.1]
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              {onRebootWin31 && (
                <button
                  type="button"
                  onClick={onRebootWin31}
                  className="px-1.5 h-4 bg-[#c0c0c0] text-black font-sans text-[10px] font-bold flex items-center gap-0.5 border-t border-l border-white border-r border-b border-black active:border-black leading-none cursor-pointer"
                  title="Reiniciar e rever a tela de inicialização clássica do Windows 3.1"
                >
                  <span>Boot 3.1</span>
                  <span>↺</span>
                </button>
              )}
              <button className="win31-btn-min" title="Minimizar">▼</button>
              <button className="win31-btn-max" title="Maximizar">▲</button>
              <button
                type="button"
                onClick={() => onSetTheme?.('light')}
                className="win31-btn-close hover:bg-red-700 hover:text-white"
                title="Fechar / Sair do Modo Windows 3.1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Windows 3.1 Authentic Menu Bar: Arquivo, Opções, Janela, Ajuda */}
          <div className="win31-menubar">
            <div className="flex items-center gap-3 font-bold text-[11px]">
              <span className="win31-menubar-item"><u>A</u>rquivo</span>
              <span className="win31-menubar-item"><u>O</u>pções</span>
              <span className="win31-menubar-item"><u>J</u>anela</span>
              <span className="win31-menubar-item"><u>A</u>juda</span>
              <span className="win31-menubar-item cursor-pointer text-[#000080]" onClick={onRandomPage}>
                Artigo <u>A</u>leatório
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-700 font-mono">
              <span className="px-1 bg-white border border-[#808080]">PROGMAN.EXE</span>
              <span>16-Bit VGA 640×480</span>
            </div>
          </div>
        </div>
      )}

      {/* Windows 95 Top Window Title Bar */}
      {isWin95 && (
        <div className="win95-titlebar font-mono text-xs flex items-center justify-between px-2 py-0.5 select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-3.5 h-3.5 bg-[#c0c0c0] border border-black flex items-center justify-center text-[9px] font-black text-[#000080]">
              W
            </div>
            <span className="font-bold text-white text-[11px] truncate tracking-wide">
              WikiWorldWeb 95 - Enciclopédia Multimídia de 32 bits [v3.0.1995]
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {onRebootWin95 && (
              <button
                type="button"
                onClick={onRebootWin95}
                className="px-1.5 h-3.5 bg-[#c0c0c0] text-black font-mono text-[9px] font-bold flex items-center gap-0.5 border-t border-l border-white border-r border-b border-black active:border-black leading-none cursor-pointer"
                title="Reiniciar e rever a clássica animação de boot do Windows 95"
              >
                <span>Boot 95</span>
                <span>↺</span>
              </button>
            )}
            <button className="w-4 h-3.5 bg-[#c0c0c0] text-black font-black text-[9px] flex items-center justify-center border-t border-l border-white border-r border-b border-black active:border-black leading-none" title="Minimizar">_</button>
            <button className="w-4 h-3.5 bg-[#c0c0c0] text-black font-black text-[9px] flex items-center justify-center border-t border-l border-white border-r border-b border-black active:border-black leading-none" title="Maximizar">□</button>
            <button
              onClick={() => onSetTheme?.('light')}
              className="w-4 h-3.5 bg-[#c0c0c0] text-black font-black text-[9px] flex items-center justify-center border-t border-l border-white border-r border-b border-black active:border-black leading-none hover:bg-red-600 hover:text-white"
              title="Fechar / Sair do Modo Windows 95"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Windows XP Luna Blue Top Window Title Bar */}
      {isWinXP && (
        <div className="winxp-titlebar font-sans text-xs flex items-center justify-between px-3 py-1 select-none shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 filter drop-shadow" viewBox="0 0 24 24">
                <path fill="#f25022" d="M2 3h9v9H2z" />
                <path fill="#7fba00" d="M13 3h9v9h-9z" />
                <path fill="#00a4ef" d="M2 13h9v9H2z" />
                <path fill="#ffb900" d="M13 13h9v9h-9z" />
              </svg>
            </div>
            <span className="font-bold text-white text-xs truncate tracking-wide">
              WikiWorldWeb XP Professional - Enciclopédia Multimídia [Luna Blue SP3]
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {onRebootWinXP && (
              <button
                type="button"
                onClick={onRebootWinXP}
                className="winxp-btn-min px-2 h-5 flex items-center gap-1 text-white font-sans text-[10px] font-bold"
                title="Reiniciar e rever a clássica animação de boot do Windows XP"
              >
                <span>Boot XP</span>
                <span className="text-[9px]">↺</span>
              </button>
            )}
            <button className="winxp-btn-min w-5 h-5 flex items-center justify-center text-white font-bold text-xs" title="Minimizar">_</button>
            <button className="winxp-btn-max w-5 h-5 flex items-center justify-center text-white font-bold text-[10px]" title="Maximizar">□</button>
            <button
              onClick={() => onSetTheme?.('light')}
              className="winxp-btn-close w-5 h-5 flex items-center justify-center text-white font-bold text-xs"
              title="Fechar / Sair do Modo Windows XP"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Windows 7 Aero Glass Top Window Title Bar */}
      {isWin7 && (
        <div className="win7-titlebar font-sans text-xs flex items-center justify-between px-3 py-1 select-none shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 filter drop-shadow" viewBox="0 0 160 160">
                <path d="M 28 34 C 44 26, 62 46, 75 40 C 75 58, 74 76, 74 88 C 60 94, 44 74, 27 82 Z" fill="#f25022" />
                <path d="M 83 39 C 97 33, 115 48, 133 42 C 132 60, 130 78, 129 90 C 114 96, 97 78, 83 87 Z" fill="#7fba00" />
                <path d="M 26 89 C 43 82, 60 100, 74 95 C 73 112, 72 130, 71 142 C 58 147, 41 129, 25 137 Z" fill="#00a4ef" />
                <path d="M 82 94 C 96 88, 114 103, 128 97 C 127 114, 125 131, 124 144 C 110 150, 94 132, 81 141 Z" fill="#ffb900" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900 text-xs truncate tracking-wide">
              WikiWorldWeb 7 Ultimate - Enciclopédia Multimídia [Aero Glass]
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {onRebootWin7 && (
              <button
                type="button"
                onClick={onRebootWin7}
                className="win7-button px-2 h-5 flex items-center gap-1 text-[#1e395b] font-sans text-[10px] font-semibold"
                title="Reiniciar e rever a animação de inicialização do Windows 7"
              >
                <span>Boot 7</span>
                <span className="text-[9px]">↺</span>
              </button>
            )}
            <button className="win7-btn-min flex items-center justify-center font-bold text-xs" title="Minimizar">_</button>
            <button className="win7-btn-max flex items-center justify-center font-bold text-[10px]" title="Maximizar">□</button>
            <button
              onClick={() => onSetTheme?.('light')}
              className="win7-btn-close flex items-center justify-center font-bold text-xs"
              title="Fechar / Sair do Modo Windows 7"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Windows 10 Fluent Top Window Title Bar */}
      {isWin10 && (
        <div className="win10-titlebar font-sans text-xs flex items-center justify-between px-2 select-none shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 115 119" fill="none">
                <path d="M0 16.5L45.4 10.3V56.4H0V16.5Z" fill="#00adef" />
                <path d="M50.6 9.6L114.7 0V55.7H50.6V9.6Z" fill="#00adef" />
                <path d="M0 62.4H45.4V108.5L0 102.3V62.4Z" fill="#00adef" />
                <path d="M50.6 62.4H114.7V118.1L50.6 108.5V62.4Z" fill="#00adef" />
              </svg>
            </div>
            <span className="font-medium text-slate-100 text-xs truncate tracking-wide">
              WikiWorldWeb 10 Pro - Enciclopédia Multimídia [Fluent Design]
            </span>
          </div>
          <div className="flex items-center shrink-0">
            {onRebootWin10 && (
              <button
                type="button"
                onClick={onRebootWin10}
                className="win10-button mr-2 px-2 h-6 flex items-center gap-1 text-white font-sans text-[11px]"
                title="Reiniciar e rever a animação de inicialização do Windows 10"
              >
                <span>Boot 10</span>
                <span className="text-[10px]">↺</span>
              </button>
            )}
            <button className="win10-btn-min" title="Minimizar">―</button>
            <button className="win10-btn-max" title="Maximizar">▢</button>
            <button
              onClick={() => onSetTheme?.('light')}
              className="win10-btn-close"
              title="Fechar / Sair do Modo Windows 10"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Wikidiota Vector / Wikiomite Foundation Top Utilities Bar */}
      {isWikidiota && (
        <div className="wikidiota-top-bar bg-[#f6f6f6] border-b border-[#a7d7f9] text-[#202122] text-[11px] font-sans px-3 py-1 flex items-center justify-between select-none">
          <div className="flex items-center gap-2 truncate">
            <span className="font-serif font-bold text-[#0645ad] flex items-center gap-1 shrink-0">
              <span className="text-xs">🌐</span> Wikiomite Foundation
            </span>
            <span className="text-[#72777d] hidden sm:inline">•</span>
            <span className="text-[#54595d] italic truncate hidden sm:inline">
              "Um apelo da Wikiomite: Se cada leitor doasse 2 minutos para rir, a Wikidiota continuaria livre de noção para sempre."
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-[#0645ad] shrink-0 font-sans">
            <span className="text-[#54595d] hidden md:inline">Não autenticado</span>
            <span className="hover:underline cursor-pointer hidden md:inline">Discussão deste IP</span>
            <span className="hover:underline cursor-pointer hidden sm:inline">Contribuições idiotas</span>
            <button
              onClick={() => onNavigate('donation')}
              className="text-[#0645ad] hover:underline font-semibold bg-[#eaecf0] hover:bg-[#d8dde3] px-2 py-0.5 rounded-xs border border-[#a2a9b1] text-[11px]"
              title="Apoiar a Wikiomite Foundation"
            >
              Doar à Wikiomite
            </button>
            <button
              onClick={() => onSetTheme?.('light')}
              className="text-[#ba0000] hover:underline text-[11px] font-medium"
              title="Sair do tema Wikidiota"
            >
              [✕ Sair]
            </button>
          </div>
        </div>
      )}

      {/* Android 1.5 Notification Status Bar */}
      {isAndroid && (
        <div className="android-statusbar bg-black text-[#c4c4c4] text-[10px] font-sans flex items-center justify-between px-3 py-1 select-none border-b border-[#282828]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono font-bold text-[#A4C639]">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
              </svg>
              <span>Android 1.5</span>
            </span>
            <span className="text-[#555] hidden sm:inline">|</span>
            <span className="text-[#A4C639] font-bold text-[9px] px-1.5 py-0.2 rounded bg-[#A4C639]/15 border border-[#A4C639]/40 hidden sm:inline">
              Cupcake
            </span>
            <span className="text-[#888] text-[9px] hidden md:inline">HTC Dream • T-Mobile G1</span>
          </div>

          <div className="flex items-center gap-2.5 text-[10px]">
            <span className="text-[#A4C639] font-mono font-bold text-[9px]">3G</span>
            <div className="flex items-end gap-0.5 h-2.5" title="Sinal Celular">
              <span className="w-0.5 h-1 bg-[#A4C639]" />
              <span className="w-0.5 h-1.5 bg-[#A4C639]" />
              <span className="w-0.5 h-2 bg-[#A4C639]" />
              <span className="w-0.5 h-2.5 bg-[#A4C639]" />
            </div>
            <div className="flex items-center">
              <div className="w-4 h-2 border border-[#777] rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-[#A4C639]" />
              </div>
            </div>
            <span className="font-mono text-white text-[10px] font-semibold">12:30</span>
          </div>
        </div>
      )}

      {/* Android 2.3 Gingerbread Notification Status Bar */}
      {isAndroid23 && (
        <div className="android23-statusbar bg-black text-[#c0c4cc] text-[10px] font-sans flex items-center justify-between px-3 py-1 select-none border-b border-[#1f2024]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono font-bold text-[#A4C639]">
              <svg className="w-3 h-3 fill-current text-[#A4C639]" viewBox="0 0 24 24">
                <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
              </svg>
              <span>Android 2.3</span>
            </span>
            <span className="text-[#444] hidden sm:inline">|</span>
            <span className="text-[#A4C639] font-bold text-[9px] px-1.5 py-0.2 rounded bg-[#A4C639]/15 border border-[#A4C639]/40 hidden sm:inline">
              Gingerbread
            </span>
            <span className="text-[#888] text-[9px] hidden md:inline">Samsung Nexus S • AMOLED UI</span>
          </div>

          <div className="flex items-center gap-2.5 text-[10px]">
            <span className="text-[#A4C639] font-mono font-bold text-[9px] flex items-center gap-0.5">
              <span>H</span>
              <span className="text-[7px]">▲▼</span>
            </span>
            <div className="flex items-end gap-0.5 h-2.5" title="Sinal Celular HSPA+">
              <span className="w-0.5 h-1 bg-[#A4C639]" />
              <span className="w-0.5 h-1.5 bg-[#A4C639]" />
              <span className="w-0.5 h-2 bg-[#A4C639]" />
              <span className="w-0.5 h-2.5 bg-[#A4C639]" />
            </div>
            <div className="flex items-center gap-1" title="Bateria 100%">
              <div className="w-4 h-2 border border-[#888] rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-[#A4C639]" />
              </div>
            </div>
            <span className="font-mono text-white text-[10px] font-semibold">10:04</span>
          </div>
        </div>
      )}

      {/* Google 4-Color Accent Line when Google Theme is active */}
      {isGoogleTheme && <div className="google-gradient-bar w-full" />}

      {/* Genshin Impact Celestial & 7-Elements Accent Line */}
      {isGenshin && <div className="genshin-accent-bar w-full" />}

      {/* Android 1.5 Robot Green Accent Line */}
      {isAndroid && <div className="android-accent-bar w-full" />}

      {/* Android 2.3 Bugdroid Green Accent Line */}
      {isAndroid23 && <div className="android23-accent-bar w-full" />}

      {/* Stardew Valley Prismatic & Golden Wheat Accent Line */}
      {isStardew && <div className="stardew-accent-bar w-full" />}

      {/* R.E.P.O. (Semiwork) Hazard Warning Stripes Line */}
      {isRepo && <div className="repo-hazard-bar w-full" />}

      {/* Minecraft Grass & Dirt Block Accent Bar */}
      {isMinecraft && <div className="minecraft-accent-bar w-full" />}

      {/* Roblox Accent Line */}
      {isRoblox && <div className="roblox-accent-bar w-full" />}

      {/* Half-Life HEV Mark IV HUD Status Bar & Hazard Line */}
      {isHalfLife && (
        <div className="halflife-statusbar bg-[#121512] text-[#ff9900] text-[10px] font-mono flex items-center justify-between px-3 py-1 select-none border-b border-[#ff9900]/40">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-bold flex items-center gap-1.5 text-[#ff9900] tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#ff9900] animate-pulse" />
              <span>BLACK MESA // SECTOR C</span>
            </span>
            <span className="text-[#ff9900]/40 hidden xs:inline">|</span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 bg-[#ff9900]/20 text-[#ffaa22] border border-[#ff9900]/40 font-bold hidden xs:inline">
              ANOMALOUS MATERIALS
            </span>
            <span className="text-[#33ff33] font-bold hidden md:inline text-[9px]">
              RAD HAZARD: ZERO
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 font-mono font-bold text-[10.5px]">
            <div className="flex items-center gap-1 text-[#33ff33]" title="Health">
              <span className="text-[11px] font-black">[+]</span>
              <span>HEALTH 100</span>
            </div>
            <div className="flex items-center gap-1 text-[#ff9900]" title="HEV Suit Armor Power">
              <span className="text-[11px]">⚡</span>
              <span>SUIT 100</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[#ffb034]" title="Ammo Capacity">
              <span className="text-[9px] tracking-tighter">■■■■■</span>
              <span>30 / 120</span>
            </div>
            <span className="hidden lg:inline text-[#ff9900]/70 text-[9px] uppercase">
              HEV MARK IV [OK]
            </span>
          </div>
        </div>
      )}
      {isHalfLife && <div className="halflife-hazard-bar w-full" />}

      {/* Nokia 3310 Graphic Monochrome LCD Status Bar & Accent Bar */}
      {isNokia && (
        <div className="nokia-statusbar bg-[#b4c995] text-[#1f281b] text-[10px] font-mono flex items-center justify-between px-3 py-1 select-none border-b-2 border-[#1f281b]">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5 h-3" title="Sinal Celular GSM">
              <span className="w-1 h-1 bg-[#1f281b]" />
              <span className="w-1 h-1.5 bg-[#1f281b]" />
              <span className="w-1 h-2 bg-[#1f281b]" />
              <span className="w-1 h-2.5 bg-[#1f281b]" />
            </div>
            <span className="font-bold tracking-wider text-[11px]">NOKIA 3310</span>
            <span className="text-[#1f281b]/60 hidden xs:inline">|</span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 bg-[#1f281b] text-[#c2d6a4] font-bold hidden xs:inline">
              WIKIZERO GSM
            </span>
            <span className="text-[#1f281b]/80 text-[9px] hidden sm:inline font-bold">84×48 MONO LCD</span>
          </div>

          <div className="flex items-center gap-3 font-mono font-bold text-[10px]">
            <span className="hidden sm:inline" title="SMS Inbox">✉ 0</span>
            <span className="hidden sm:inline" title="Bloqueio de Teclado">🔒</span>
            <span className="font-bold text-[#1f281b]">12:00</span>
            <div className="flex items-center gap-0.5 border border-[#1f281b] p-0.5 h-3 w-6" title="Bateria">
              <span className="w-1 h-1.5 bg-[#1f281b]" />
              <span className="w-1 h-1.5 bg-[#1f281b]" />
              <span className="w-1 h-1.5 bg-[#1f281b]" />
              <span className="w-1 h-1.5 bg-[#1f281b]" />
            </div>
          </div>
        </div>
      )}
      {isNokia && <div className="nokia-accent-bar w-full" />}

      {/* Minecraft In-Game Level XP & Survival HUD Strip */}
      {isMinecraft && (
        <div className="minecraft-notice-bar text-[11px] font-mono flex items-center justify-between px-3 py-1 select-none">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1.5 font-bold text-[#55ff55]">
              <Pickaxe size={13} className="text-[#55ff55]" />
              <span>MINECRAFT // MUNDO SOBREVIVÊNCIA</span>
            </span>
            <span className="text-[#4a423b] hidden xs:inline">|</span>
            <span className="text-[#ffaa00] text-[10px] hidden sm:inline flex items-center gap-1">
              <span>XYZ: 124, 64, -89</span>
            </span>
            <span className="text-[#4a423b] hidden md:inline">|</span>
            <span className="text-[#55ffff] text-[10px] hidden md:inline">
              BIOMA: PLANÍCIES (DIA)
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono font-bold text-slate-100">
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-red-500">
              <span>❤❤❤❤❤</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/70 px-2 py-0.5 rounded border border-[#55ff55]/50">
              <span className="text-[#55ff55] text-xs">NV 42</span>
              <div className="w-16 minecraft-xp-gauge hidden xs:block">
                <div className="minecraft-xp-gauge-fill" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roblox Gaming Top HUD Strip */}
      {isRoblox && (
        <div className="roblox-notice-bar text-[11px] font-sans flex items-center justify-between px-3 py-1 select-none">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1.5 font-bold text-[#ffffff]">
              <Gamepad2 size={13} className="text-[#00b06f]" />
              <span>ROBLOX // EXPERIÊNCIA WIKIZERO</span>
            </span>
            <span className="text-[#363940] hidden xs:inline">|</span>
            <span className="text-[#00a2ff] text-[10px] hidden sm:inline">
              SERVIDOR PÚBLICO • 60 FPS
            </span>
            <span className="text-[#363940] hidden md:inline">|</span>
            <span className="text-slate-400 text-[10px] hidden md:inline">
              LATÊNCIA: 24ms
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 font-sans font-bold text-slate-100">
            <span className="text-[#00b06f] text-[11px] flex items-center gap-1 bg-[#202227] px-2 py-0.5 rounded-md border border-[#00b06f]/40">
              <span>R$</span> 2.450
            </span>
            <span className="text-xs text-white bg-[#e2231a] px-2 py-0.5 rounded-md font-bold text-[10px]">
              JOGAR
            </span>
          </div>
        </div>
      )}

      {/* R.E.P.O. Semiwork Tactical Extraction HUD Strip */}
      {isRepo && (
        <div className="repo-notice-bar text-[11px] font-mono flex items-center justify-between px-3 py-1 select-none">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1.5 font-bold text-[#f59e0b]">
              <AlertTriangle size={13} className="text-[#f59e0b] animate-pulse" />
              <span>SEMIWORK OS // REPO CONTRATO ATIVO</span>
            </span>
            <span className="text-[#4b5563] hidden xs:inline">|</span>
            <span className="text-[#22d3ee] text-[10px] hidden sm:inline flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-ping inline-block" />
              <span>RADAR DE EXTRAÇÃO: ATIVO</span>
            </span>
            <span className="text-[#4b5563] hidden md:inline">|</span>
            <span className="text-[#ef4444] text-[10px] hidden md:inline font-bold">
              NÍVEL DE PERIGO: GRAU V (EXTREMO)
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 font-mono font-bold text-slate-100">
            <span className="text-[#f59e0b] text-[11px] flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded border border-[#f59e0b]/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
              <span>COTA:</span> $150,000 / $84,500
            </span>
            <span className="text-xs text-[#22d3ee] flex items-center gap-1">
              <span className="text-[10px] text-slate-400">VITAIS:</span> 100%
            </span>
          </div>
        </div>
      )}

      {/* Stardew Valley Farm Clock & HUD Strip */}
      {isStardew && (
        <div className="stardew-notice-bar text-[11px] font-sans flex items-center justify-between px-3 py-1 select-none">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1 font-bold text-[#ffeb99]">
              <span className="text-amber-400">🌱</span>
              <span>Primavera, Dia 28</span>
            </span>
            <span className="text-[#8c5e29] hidden xs:inline">•</span>
            <span className="text-[#fce4a6] text-[10px] hidden sm:inline flex items-center gap-1">
              <span>☀️</span> Ensolarado
            </span>
            <span className="text-[#8c5e29] hidden md:inline">•</span>
            <span className="text-[#e2be78] text-[10px] hidden md:inline">Fazenda Vale da Estrela</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 font-mono font-bold text-[#fffae0]">
            <span className="text-[#ffd54f] text-[11px] flex items-center gap-1 bg-[#251506]/60 px-2 py-0.5 rounded border border-[#b87a28]/50">
              <span>🪙</span> 45.280g
            </span>
            <span className="text-xs text-[#fed88b] flex items-center gap-1">
              <span>⏰</span> 10:40 AM
            </span>
          </div>
        </div>
      )}

      {/* High Density Top Micro Notice Bar / Win95 Menu Strip */}
      <div className={`${isWin95 ? 'bg-[#c0c0c0] text-black border-b border-[#808080]' : isHalfLife ? 'bg-[#121512] text-[#ff9900] border-b border-[#ff9900]/40' : isNokia ? 'bg-[#b4c995] text-[#1f281b] border-b-2 border-[#1f281b]' : isGenshin ? 'bg-[#121524] text-[#d3bc8e] border-b border-[#d3bc8e]/30' : isAndroid ? 'bg-[#1a1b1e] text-[#A4C639] border-b border-[#303338]' : isAndroid23 ? 'bg-[#0f1013] text-[#A4C639] border-b border-[#22242a]' : isStardew ? 'bg-[#4a2b12] text-[#fce4a6] border-b border-[#8a5522]' : isRepo ? 'bg-[#090d14] text-[#f59e0b] border-b border-[#f59e0b]/40' : isMinecraft ? 'bg-[#14110f] text-[#55ff55] border-b border-[#3a342e]' : isRoblox ? 'bg-[#16171d] text-[#00b06f] border-b border-[#292b30]' : 'bg-[#1e293b] dark:bg-[#090d16] text-slate-300 border-b border-slate-800'} text-[11px] py-1 px-2.5 sm:px-4 font-mono w-full max-w-full overflow-hidden`}>
        <div className="max-w-7xl mx-auto px-0 sm:px-2 lg:px-4 flex justify-between items-center w-full min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
            {isWin95 ? (
              <div className="flex items-center gap-2">
                <span className="bg-[#000080] text-white px-1.5 py-0.2 text-[10px] font-bold border-t border-l border-white border-r border-b border-black">
                  START 95
                </span>
                <div className="hidden sm:flex items-center gap-3 text-black text-xs font-sans">
                  <span onClick={() => onNavigate('hub')} className="cursor-pointer hover:underline"><u>A</u>rquivo</span>
                  <span onClick={() => onNavigate('editor')} className="cursor-pointer hover:underline"><u>E</u>ditar</span>
                  <span onClick={onOpenLanguagesModal} className="cursor-pointer hover:underline"><u>E</u>xibir</span>
                  <span onClick={() => onNavigate('watchlist')} className="cursor-pointer hover:underline"><u>F</u>avoritos</span>
                  <span onClick={() => onNavigate('hub')} className="cursor-pointer hover:underline">A<u>j</u>uda</span>
                </div>
              </div>
            ) : isNokia ? (
              <div className="flex items-center gap-2 font-mono">
                <span className="flex items-center gap-1 px-2 py-0.2 text-[10px] font-bold bg-[#1f281b] text-[#c2d6a4] tracking-wider font-mono">
                  <Smartphone size={10} className="text-[#c2d6a4]" />
                  NOKIA // 3310
                </span>
                <span className="text-[#1f281b] hidden xs:inline font-bold">[ MENU ]</span>
                <span className="text-[#1f281b]/60 hidden xs:inline">|</span>
                <span className="text-[#1f281b] text-[10px] hidden sm:inline font-bold">
                  CONNECTING PEOPLE // SNAKE II
                </span>
              </div>
            ) : isMinecraft ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#55ff55] text-black tracking-wider font-mono">
                <Pickaxe size={10} className="text-black" />
                MINECRAFT // MOJANG
              </span>
            ) : isRoblox ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#00b06f] text-white tracking-wide font-sans">
                <Gamepad2 size={10} className="text-white" />
                ROBLOX // BLOX
              </span>
            ) : isRepo ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#f59e0b] text-black tracking-wider font-mono">
                <AlertTriangle size={10} className="text-black" />
                R.E.P.O. // SEMIWORK TERMINAL
              </span>
            ) : isGenshin ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold genshin-primogem-badge">
                <Sparkles size={10} className="text-amber-300 animate-pulse" />
                GENSHIN IMPACT ✦ TEYVAT ARCHIVES
              </span>
            ) : isAndroid ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#A4C639] text-black">
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                </svg>
                ANDROID 1.5 CUPCAKE
              </span>
            ) : isAndroid23 ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#A4C639] text-black">
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                </svg>
                ANDROID 2.3 GINGERBREAD
              </span>
            ) : isStardew ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#c6892e] text-[#2c1605] border border-[#f5cb74]">
                <span>★</span> STARDEW VALLEY ✦ PELICAN TOWN
              </span>
            ) : isGoogleTheme ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#4285F4] text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" />
                GOOGLE THEME v3.0
              </span>
            ) : isWikidiota ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#eaecf0] text-[#202122] border border-[#a2a9b1] font-serif">
                <span>🌐</span> WIKIDIOTA • WIKIOMITE FOUNDATION
              </span>
            ) : (
              <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded-xs text-[10px] font-bold shrink-0">WIKIZERO v3.0</span>
            )}
            {!isWin95 && <span className={`${isRepo ? "text-[#22d3ee]/80" : isGenshin ? "text-[#a0947d]" : isAndroid ? "text-[#888]" : isStardew ? "text-[#fed88b]" : "text-slate-400"} hidden md:inline truncate`}>{t('header.open_encyclopedia')}</span>}
          </div>
          <div className={`flex items-center gap-2 sm:gap-4 shrink-0 ${isWin95 ? 'text-black' : isGenshin ? 'text-[#d3bc8e]' : isStardew ? 'text-[#fed88b]' : 'text-slate-400'} text-[11px]`}>
            <button
              onClick={onOpenLanguagesModal}
              className={`${isWin95 ? 'hover:underline text-black' : isGenshin ? 'hover:text-[#72e2db] text-[#d3bc8e]' : 'hover:text-blue-300 text-slate-300'} flex items-center gap-1 transition cursor-pointer`}
              title="Mudar idioma da enciclopédia"
            >
              <Globe2 size={11} className={isWin95 ? 'text-[#000080]' : isGenshin ? 'text-[#72e2db]' : 'text-blue-400'} />
              <span>{currentLanguage.flag} <span className="hidden sm:inline">{currentLanguage.nativeName}</span> ({currentLanguage.code})</span>
            </button>
            <span className={isWin95 ? 'text-[#808080]' : isGenshin ? 'text-[#d3bc8e]/40' : 'hidden sm:inline text-slate-600'}>|</span>
            <button
              type="button"
              onClick={onToggleTheme}
              className="hover:text-amber-300 text-slate-300 flex items-center gap-1 transition cursor-pointer select-none"
              title={isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
              aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {isDark ? (
                <Sun size={11} className="text-amber-400 animate-pulse" />
              ) : (
                <Moon size={11} className="text-slate-300" />
              )}
              <span className="hidden sm:inline font-sans">{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>
            </button>
            <span className={isWin95 ? 'text-[#808080]' : isGenshin ? 'text-[#d3bc8e]/40' : 'hidden sm:inline text-slate-600'}>|</span>
            <span className="hidden md:inline">GNU GPL v3.0</span>
            <span className={isWin95 ? 'text-[#808080]' : isGenshin ? 'text-[#d3bc8e]/40' : 'hidden lg:inline text-slate-600'}>|</span>
            <a
              href={formatExternalUrl("https://github.com/WazzimaGiygg/Wiki-alternative")}
              target="_blank"
              rel="noopener noreferrer"
              className={`${isWin95 ? 'hover:underline text-[#000080]' : isGenshin ? 'hover:text-[#72e2db] text-[#d3bc8e]' : 'hover:text-blue-400 text-slate-300'} hidden sm:flex items-center gap-1`}
            >
              GitHub <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* Main High Density Header Content */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-1.5 sm:gap-3 w-full min-w-0 max-w-full">
        {/* Left Side: Mobile Menu Button + Brand Logo & Title */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Hamburger Menu Trigger for Mobile Drawer */}
          <button
            id="btn-header-mobile-drawer"
            onClick={onOpenMobileDrawer}
            className="p-1.5 sm:p-2 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden active:scale-95 transition min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
            aria-label="Abrir menu de navegação"
          >
            <Menu size={19} />
          </button>

          {isWin95 ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiWorldWeb - Tema Windows 95"
            >
              <div className="w-8 h-8 bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black flex items-center justify-center shadow-xs">
                <Monitor size={18} className="text-[#000080]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg text-black tracking-tight font-sans">
                    WikiWorldWeb <span className="text-[#000080] font-black">95</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#000080] text-white px-1.5 py-0.2 border border-white">
                    WIN95
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 font-sans leading-none mt-0.5 hidden xs:block">
                  Microsoft Windows 95 Style
                </p>
              </div>
            </div>
          ) : isGenshin ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiWorldWeb - Tema Genshin Impact (Teyvat)"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2a3454] to-[#121524] border border-[#d3bc8e] flex items-center justify-center shadow-sm shadow-amber-500/20 group-hover:border-amber-300 transition">
                <Sparkles size={17} className="text-[#d3bc8e] drop-shadow-[0_0_6px_rgba(211,188,142,0.8)] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-serif font-bold text-base sm:text-lg text-[#f2dfb7] tracking-wider">
                    WikiWorldWeb <span className="text-[#72e2db] font-normal text-xs">✦ Teyvat</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-teal-500/20 text-[#e4ca95] border border-[#d3bc8e]/50 px-1.5 py-0.2 rounded-xs">
                    GENSHIN
                  </span>
                </div>
                <p className="text-[10px] text-[#cca567] font-sans leading-none mt-0.5 hidden xs:block">
                  Adventurer's Handbook & Lore
                </p>
              </div>
            </div>
          ) : isAndroid ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiWorldWeb - Tema Android 1.5 Cupcake (2009)"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25272a] border-2 border-[#A4C639] flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                <svg className="w-4 h-4 fill-current text-[#A4C639]" viewBox="0 0 24 24">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg text-white tracking-tight font-sans">
                    WikiWorldWeb <span className="text-[#A4C639] font-mono text-xs">1.5</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#A4C639]/20 text-[#A4C639] border border-[#A4C639]/50 px-1.5 py-0.2 rounded-xs">
                    Cupcake
                  </span>
                </div>
                <p className="text-[10px] text-[#A4C639]/80 font-sans leading-none mt-0.5 hidden xs:block">
                  Android 1.5 Cupcake OS (2009)
                </p>
              </div>
            </div>
          ) : isMinecraft ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiWorldWeb - Tema Minecraft (Mojang Studios)"
            >
              <div className="w-8 h-8 rounded-xs bg-[#1f1a16] border-2 border-[#55ff55] flex items-center justify-center shadow-[0_0_10px_rgba(85,255,85,0.3)] group-hover:scale-105 transition">
                <Pickaxe size={16} className="text-[#55ff55]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg text-[#f3f4f6] tracking-tight font-mono drop-shadow-[1px_1px_0px_#000]">
                    WikiWorldWeb <span className="text-[#55ff55] text-xs">Craft</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#55ff55]/20 text-[#55ff55] border border-[#55ff55]/70 px-1.5 py-0.2 rounded-xs font-mono">
                    MOJANG
                  </span>
                </div>
                <p className="text-[10px] text-[#ffaa00] font-mono leading-none mt-0.5 hidden xs:block">
                  Enciclopédia de Blocos & Redstone
                </p>
              </div>
            </div>
          ) : isRoblox ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiWorldWeb - Tema Roblox (Roblox Corporation)"
            >
              <div className="w-8 h-8 rounded-lg bg-[#191b1f] border-2 border-[#00b06f] flex items-center justify-center shadow-[0_0_10px_rgba(0,176,111,0.3)] group-hover:scale-105 transition">
                <div className="w-4 h-4 bg-white rounded-xs rotate-12 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#191b1f] rounded-xs" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-extrabold text-base sm:text-lg text-[#ffffff] tracking-tight font-sans">
                    WikiWorldWeb <span className="text-[#00b06f] text-xs">Blox</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#00b06f]/20 text-[#00b06f] border border-[#00b06f]/70 px-1.5 py-0.2 rounded-md font-sans">
                    ROBLOX
                  </span>
                </div>
                <p className="text-[10px] text-[#00a2ff] font-sans leading-none mt-0.5 hidden xs:block font-medium">
                  Roblox Metaverse Knowledge Base
                </p>
              </div>
            </div>
          ) : isHalfLife ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiWorldWeb - Tema Half-Life (Black Mesa Research Facility / HEV Suit)"
            >
              <div className="w-8 h-8 rounded-full bg-[#181c18] border-2 border-[#ff9900] flex items-center justify-center shadow-[0_0_12px_rgba(255,153,0,0.35)] group-hover:scale-105 transition font-mono font-black text-sm text-[#ff9900]">
                λ
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg text-[#ff9900] tracking-wider font-mono">
                    BLACK MESA <span className="text-xs font-black bg-[#ff9900] text-black px-1 py-0.2">λ</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#ff9900]/20 text-[#ffaa22] border border-[#ff9900]/50 px-1.5 py-0.2 font-mono">
                    HEV SUIT
                  </span>
                </div>
                <p className="text-[10px] text-[#ff9900]/80 font-mono leading-none mt-0.5 hidden xs:block font-medium">
                  Sector C Anomalous Materials • Datanet v1.0
                </p>
              </div>
            </div>
          ) : isNokia ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiWorldWeb - Tema Nokia 3310 (Display Monocromático LCD)"
            >
              <div className="w-8 h-8 rounded-none bg-[#b4c995] border-2 border-[#1f281b] flex items-center justify-center shadow-[2px_2px_0px_#1f281b] group-hover:scale-105 transition">
                <Smartphone size={16} className="text-[#1f281b]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg text-[#1f281b] tracking-tight font-mono">
                    WikiWorldWeb <span className="text-xs font-black bg-[#1f281b] text-[#c2d6a4] px-1 py-0.2">3310</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#1f281b] text-[#c2d6a4] border border-[#1f281b] px-1.5 py-0.2 font-mono">
                    NOKIA
                  </span>
                </div>
                <p className="text-[10px] text-[#1f281b]/80 font-mono leading-none mt-0.5 hidden xs:block font-bold">
                  Connecting People • 84×48 LCD
                </p>
              </div>
            </div>
          ) : isRepo ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiWorldWeb - Tema R.E.P.O. (Semiwork Studios)"
            >
              <div className="w-8 h-8 rounded bg-[#0b0e14] border-2 border-[#f59e0b] flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.35)] group-hover:scale-105 transition">
                <span className="text-[11px] font-black text-[#f59e0b] font-mono tracking-tighter">
                  REPO
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg text-[#f3f4f6] tracking-tight font-mono">
                    WikiWorldWeb <span className="text-[#f59e0b] text-xs">R.E.P.O.</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/70 px-1.5 py-0.2 rounded-xs font-mono">
                    SEMIWORK
                  </span>
                </div>
                <p className="text-[10px] text-[#22d3ee]/90 font-mono leading-none mt-0.5 hidden xs:block">
                  Semiwork Salvage & Extraction Terminal OS
                </p>
              </div>
            </div>
          ) : isStardew ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiWorldWeb - Tema Stardew Valley (Vale da Estrela)"
            >
              <div className="w-8 h-8 rounded-lg bg-[#533113] border-2 border-[#d49e3d] flex items-center justify-center shadow-md group-hover:scale-105 transition">
                <span className="text-base select-none leading-none" role="img" aria-label="Junimo">
                  🍏
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg text-[#ffefc4] tracking-tight font-sans drop-shadow-sm">
                    WikiWorldWeb <span className="text-[#ffd54f] text-xs">Valley</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#d49e3d]/20 text-[#ffe082] border border-[#d49e3d]/60 px-1.5 py-0.2 rounded-xs">
                    Stardew
                  </span>
                </div>
                <p className="text-[10px] text-[#fdd87f]/90 font-sans leading-none mt-0.5 hidden xs:block">
                  Pelican Town Archives • Vale da Estrela
                </p>
              </div>
            </div>
          ) : isGoogleTheme ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiWorldWeb - Tema Google Material"
            >
              <div className="w-8 h-8 rounded-full bg-white dark:bg-[#303134] border border-slate-200 dark:border-[#5f6368] flex items-center justify-center shadow-xs">
                <span className="font-bold text-base font-sans tracking-tight">
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335] text-xs font-black">W</span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg tracking-tight font-sans">
                    <span className="text-[#4285F4]">W</span>
                    <span className="text-[#EA4335]">a</span>
                    <span className="text-[#FBBC05]">z</span>
                    <span className="text-[#4285F4]">z</span>
                    <span className="text-[#34A853]">i</span>
                    <span className="text-[#EA4335]">m</span>
                    <span className="text-[#4285F4]">a</span>
                    <span className="text-slate-700 dark:text-slate-200"> </span>
                    <span className="text-[#4285F4]">W</span>
                    <span className="text-[#EA4335]">i</span>
                    <span className="text-[#FBBC05]">k</span>
                    <span className="text-[#34A853]">i</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 px-1.5 py-0.2 rounded-full">
                    Google
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans leading-none mt-0.5 hidden xs:block">
                  Material Design 3 & Pesquisa Google
                </p>
              </div>
            </div>
          ) : isWikidiota ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0 select-none"
              title="Wikidiota - A Enciclopédia Paródica da Wikiomite Foundation"
            >
              {/* Parody Wikipedia Jigsaw Globe Icon */}
              <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                <svg className="w-9 h-9 drop-shadow-xs" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="#f8f9fa" stroke="#54595d" strokeWidth="2.5" />
                  <path d="M 20 30 Q 35 25, 50 30 T 80 30" fill="none" stroke="#a2a9b1" strokeWidth="1.5" />
                  <path d="M 10 50 Q 30 45, 50 50 T 90 50" fill="none" stroke="#a2a9b1" strokeWidth="1.5" />
                  <path d="M 18 70 Q 35 65, 50 70 T 82 70" fill="none" stroke="#a2a9b1" strokeWidth="1.5" />
                  <path d="M 32 15 Q 30 35, 32 50 T 32 85" fill="none" stroke="#a2a9b1" strokeWidth="1.5" />
                  <path d="M 50 10 Q 52 35, 50 50 T 50 90" fill="none" stroke="#a2a9b1" strokeWidth="1.5" />
                  <path d="M 68 15 Q 70 35, 68 50 T 68 85" fill="none" stroke="#a2a9b1" strokeWidth="1.5" />
                  <text x="22" y="42" fontSize="13" fontFamily="serif" fill="#202122">W</text>
                  <text x="42" y="38" fontSize="11" fontFamily="serif" fill="#72777d">?</text>
                  <text x="60" y="42" fontSize="12" fontFamily="serif" fill="#202122">Ω</text>
                  <text x="20" y="62" fontSize="12" fontFamily="serif" fill="#202122">И</text>
                  <text x="40" y="64" fontSize="15" fontFamily="serif" fontWeight="bold">🤪</text>
                  <text x="65" y="62" fontSize="12" fontFamily="serif" fill="#202122">祖</text>
                  <path d="M 40 10 L 60 10 L 55 22 L 45 22 Z" fill="#ffffff" stroke="#a2a9b1" strokeWidth="1" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-serif font-bold text-lg sm:text-xl text-[#000000] dark:text-[#202122] tracking-normal">
                    WIKIDIOTA
                  </h1>
                  <span className="text-[9px] font-sans font-bold uppercase tracking-wider bg-[#eaecf0] text-[#54595d] border border-[#a2a9b1] px-1 py-0.2 rounded-xs">
                    Paródia
                  </span>
                </div>
                <p className="text-[10px] text-[#54595d] font-serif italic leading-none mt-0.5 hidden xs:block">
                  A enciclopédia livre de bom senso • Wikiomite Foundation
                </p>
              </div>
            </div>
          ) : (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
              title="WikiZero - Página Principal"
            >
              <img
                src="/logo.png"
                alt="Logotipo WikiZero"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded object-contain drop-shadow-xs group-hover:scale-105 transition"
              />
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-serif-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                    WikiZero
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1 py-0.2 rounded-xs">
                    Wiki
                  </span>
                </div>
                <p
                  className="text-[10.5px] text-blue-700 dark:text-blue-300 font-serif italic font-medium leading-none mt-0.5 hidden xs:block tracking-wide"
                  title="Frase Principal da Wiki: 'Não, o Tempo não é o senhor do conhecimento!'"
                >
                  «Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dense Global Search Bar (Desktop) */}
        {isWin1 ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="flex items-center gap-1.5 font-mono">
              <div
                onClick={handleSearchInputClick}
                className="flex-1 border-2 border-black bg-white flex items-center px-2 py-1 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#0000aa] mr-1.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onClick={handleSearchInputClick}
                  onFocus={handleSearchInputClick}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="EXECUTE WIKIZERO.EXE..."
                  className="w-full text-xs bg-transparent border-none outline-none text-black font-mono font-bold placeholder:text-slate-600 cursor-text uppercase"
                />
              </div>
              <button
                onClick={onSearchSubmit}
                className="border-2 border-black bg-white hover:bg-black hover:text-white px-3 py-1 font-mono font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Executar Busca no Windows 1.0"
              >
                <Search size={11} />
                <span>BUSCA</span>
              </button>
              <button
                onClick={onRandomPage}
                title="Artigo Aleatório"
                className="border-2 border-black bg-white hover:bg-black hover:text-white px-2 py-1 font-mono font-bold text-xs cursor-pointer transition-colors"
              >
                ALEATÓRIO
              </button>
            </div>
          </div>
        ) : isWin95 ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="flex items-center gap-1.5">
              <div
                onClick={handleSearchInputClick}
                className="flex-1 win95-sunken flex items-center px-2 py-1 bg-white cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#000080] mr-1.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onClick={handleSearchInputClick}
                  onFocus={handleSearchInputClick}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="C:\WIKIZERO\BUSCA_AVANCADA.EXE..."
                  className="w-full text-xs bg-transparent border-none outline-none text-black font-mono placeholder:text-slate-500 cursor-text"
                />
              </div>
              <button
                onClick={onSearchSubmit}
                className="win95-button font-bold flex items-center gap-1"
                title="Ir para a Busca Avançada"
              >
                <Search size={11} />
                {t('header.search_btn')}
              </button>
              <button
                onClick={onRandomPage}
                title="Artigo Aleatório"
                className="win95-button"
              >
                {t('header.random_page')}
              </button>
            </div>
          </div>
        ) : isWinXP ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="flex items-center gap-2">
              <div
                onClick={handleSearchInputClick}
                className="flex-1 winxp-input flex items-center px-3 py-1.5 bg-white cursor-pointer rounded shadow-inner border border-[#7f9db9]"
              >
                <Search className="w-4 h-4 text-[#0055ea] mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onClick={handleSearchInputClick}
                  onFocus={handleSearchInputClick}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Pesquisar na WikiWorldWeb XP..."
                  className="w-full text-xs bg-transparent border-none outline-none text-slate-900 font-sans placeholder:text-slate-500 cursor-text"
                />
              </div>
              <button
                onClick={onSearchSubmit}
                className="winxp-start-button font-bold flex items-center gap-1.5 px-3 py-1.5 text-xs text-white italic shadow-sm"
                title="Pesquisar na Enciclopédia XP"
              >
                <Search size={13} className="text-white not-italic" />
                <span className="not-italic">Buscar</span>
              </button>
              <button
                onClick={onRandomPage}
                title="Artigo Aleatório no Windows XP"
                className="winxp-button text-xs px-2.5 py-1"
              >
                {t('header.random_page')}
              </button>
            </div>
          </div>
        ) : isWin7 ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="flex items-center gap-2">
              <div
                onClick={handleSearchInputClick}
                className="flex-1 flex items-center px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-md shadow-inner border border-[#7da2ce] focus-within:border-[#3c7fb1] focus-within:ring-2 focus-within:ring-sky-400/40 cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#0066cc] mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onClick={handleSearchInputClick}
                  onFocus={handleSearchInputClick}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Pesquisar na WikiWorldWeb 7..."
                  className="w-full text-xs bg-transparent border-none outline-none text-slate-900 font-sans placeholder:text-slate-500 cursor-text"
                />
              </div>
              <button
                onClick={onSearchSubmit}
                className="win7-button flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#1e395b] shadow-xs"
                title="Pesquisar na Enciclopédia Windows 7"
              >
                <Search size={13} className="text-[#0066cc]" />
                <span>Buscar</span>
              </button>
              <button
                onClick={onRandomPage}
                title="Artigo Aleatório no Windows 7"
                className="win7-button text-xs px-2.5 py-1"
              >
                {t('header.random_page')}
              </button>
            </div>
          </div>
        ) : isWin10 ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="flex items-center gap-2">
              <div
                onClick={handleSearchInputClick}
                className="flex-1 flex items-center px-3 py-1.5 bg-[#121620] border border-[#2b3b55] rounded-none focus-within:border-[#0078d7] focus-within:ring-1 focus-within:ring-[#0078d7] cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#00adef] mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onClick={handleSearchInputClick}
                  onFocus={handleSearchInputClick}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Digite aqui para pesquisar na WikiWorldWeb 10..."
                  className="w-full text-xs bg-transparent border-none outline-none text-slate-100 font-sans placeholder:text-slate-500 cursor-text"
                />
              </div>
              <button
                onClick={onSearchSubmit}
                className="win10-button flex items-center gap-1.5 px-3 py-1.5 text-xs shadow-xs"
                title="Pesquisar no Windows 10"
              >
                <Search size={13} className="text-[#00adef]" />
                <span>Buscar</span>
              </button>
              <button
                onClick={onRandomPage}
                title="Artigo Aleatório no Windows 10"
                className="win10-button text-xs px-2.5 py-1"
              >
                {t('header.random_page')}
              </button>
            </div>
          </div>
        ) : isWikidiota ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="flex items-center gap-1.5">
              <div
                onClick={handleSearchInputClick}
                className="flex-1 flex items-center px-3 py-1.5 bg-white border border-[#a2a9b1] rounded-xs shadow-inner focus-within:border-[#3366cc] focus-within:ring-1 focus-within:ring-[#3366cc] cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#72777d] mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onClick={handleSearchInputClick}
                  onFocus={handleSearchInputClick}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Pesquisar na Wikidiota..."
                  className="w-full text-xs bg-transparent border-none outline-none text-[#202122] font-sans placeholder:text-[#72777d] cursor-text"
                />
              </div>
              <button
                onClick={onSearchSubmit}
                className="bg-[#f8f9fa] hover:bg-[#eaecf0] active:bg-[#c8ccd1] text-[#202122] border border-[#a2a9b1] px-3 py-1.5 rounded-xs text-xs font-sans font-medium flex items-center gap-1.5 shadow-xs transition"
                title="Pesquisar na Wikidiota (MediaWiki/Wikiomite Engine)"
              >
                <Search size={13} className="text-[#54595d]" />
                <span>Pesquisar</span>
              </button>
              <button
                onClick={onRandomPage}
                title="Artigo Aleatório da Wikidiota"
                className="bg-[#f8f9fa] hover:bg-[#eaecf0] active:bg-[#c8ccd1] text-[#0645ad] hover:underline border border-[#a2a9b1] px-2.5 py-1.5 rounded-xs text-xs font-sans font-medium transition"
              >
                Página aleatória
              </button>
            </div>
          </div>
        ) : isGenshin ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative genshin-search-box flex items-center px-3.5 py-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#d3bc8e] mr-2 shrink-0 animate-pulse" />
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Busca Avançada de Teyvat (artigos, lore, tags)..."
                className="w-full text-xs bg-transparent border-none outline-none text-[#f2dfb7] placeholder:text-[#a0947d] font-sans cursor-text"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#161a2c] border border-[#d3bc8e]/30" title="Sete Elementos de Teyvat">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#74c2a8]" title="Anemo" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fab632]" title="Geo" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#af8ec9]" title="Electro" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a5c83b]" title="Dendro" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cc2f1]" title="Hydro" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef7938]" title="Pyro" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9fd6e3]" title="Cryo" />
                </div>
                <button
                  onClick={onSearchSubmit}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-full genshin-gold-btn cursor-pointer"
                  title="Abrir Busca Avançada"
                >
                  {t('header.search_btn')}
                </button>
                <button
                  onClick={onRandomPage}
                  title="Artigo Aleatório / Oração Astral"
                  className="px-2 py-1 text-[11px] font-medium rounded-full bg-[#242c47] hover:bg-[#2f395d] text-[#e4ca95] border border-[#d3bc8e]/40 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>✦ Desejo</span>
                </button>
              </div>
            </div>
          </div>
        ) : isAndroid ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative android-search-widget flex items-center px-3 py-1.5 transition-all cursor-pointer"
            >
              <div className="mr-2 flex items-center text-[#A4C639] shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Busca Avançada WikiWorldWeb Android..."
                className="w-full text-xs bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-500 font-sans cursor-text"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="android-btn px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                  title="Abrir Busca Avançada"
                >
                  {t('header.search_btn')}
                </button>
                <button
                  onClick={onRandomPage}
                  title="Artigo Aleatório"
                  className="android-btn px-2 py-1 text-[11px] font-medium cursor-pointer"
                >
                  Aleatório
                </button>
              </div>
            </div>
          </div>
        ) : isMinecraft ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative minecraft-search-widget flex items-center px-3 py-1.5 transition-all cursor-pointer font-mono"
            >
              <div className="mr-2 flex items-center text-[#55ff55] shrink-0 text-sm" title="Minecraft Search">
                <Pickaxe size={15} className="text-[#55ff55]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="MINECRAFT // BUSCAR BLOCOS, RECEITAS E ITENS..."
                className="w-full text-xs bg-transparent border-none outline-none text-[#55ff55] placeholder:text-[#55ff55]/50 font-mono cursor-text"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="minecraft-btn px-2.5 py-1 text-[11px] cursor-pointer"
                  title="Executar Busca de Artigos"
                >
                  [ CRAFTAR ]
                </button>
                <button
                  onClick={onRandomPage}
                  title="Artigo de Bioma Aleatório"
                  className="minecraft-btn px-2 py-1 text-[11px] cursor-pointer"
                >
                  [ BIOMA ]
                </button>
              </div>
            </div>
          </div>
        ) : isRoblox ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative roblox-search-widget flex items-center px-3.5 py-1.5 transition-all cursor-pointer font-sans"
            >
              <Search className="w-4 h-4 text-[#00b06f] mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar experiências, itens e artigos no Roblox..."
                className="w-full text-xs bg-transparent border-none outline-none text-white placeholder:text-slate-400 font-sans cursor-text"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="roblox-btn-primary px-3 py-1 text-[11px] cursor-pointer"
                  title="Buscar Artigos"
                >
                  Buscar
                </button>
                <button
                  onClick={onRandomPage}
                  title="Artigo Aleatório no Roblox"
                  className="roblox-btn px-2.5 py-1 text-[11px] cursor-pointer"
                >
                  Descobrir
                </button>
              </div>
            </div>
          </div>
        ) : isRepo ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative repo-search-widget flex items-center px-3 py-1.5 transition-all cursor-pointer font-mono"
            >
              <div className="mr-2 flex items-center text-[#f59e0b] shrink-0 text-sm" title="R.E.P.O. Terminal">
                <Radio size={15} className="text-[#f59e0b] animate-pulse" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="SEMIWORK REPO // BUSCAR ARTEFATO OU SUCATA..."
                className="w-full text-xs bg-transparent border-none outline-none text-[#22d3ee] placeholder:text-[#22d3ee]/50 font-mono cursor-text"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="repo-btn px-2.5 py-1 text-[11px] cursor-pointer"
                  title="Executar Varredura e Busca Avançada"
                >
                  [ EXTRAIR ]
                </button>
                <button
                  onClick={onRandomPage}
                  title="Artefato Aleatório"
                  className="repo-btn px-2 py-1 text-[11px] cursor-pointer"
                >
                  [ SUCATA ]
                </button>
              </div>
            </div>
          </div>
        ) : isStardew ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative stardew-search-widget flex items-center px-3 py-1.5 transition-all cursor-pointer"
            >
              <div className="mr-2 flex items-center text-amber-600 shrink-0 text-sm" title="Stardew Junimo">
                🌱
              </div>
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Busca Avançada no Vale da Estrela..."
                className="w-full text-xs bg-transparent border-none outline-none text-[#3e2613] placeholder:text-[#8a6843] font-sans cursor-text"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="stardew-btn px-2.5 py-1 text-[11px] cursor-pointer"
                  title="Abrir Busca Avançada"
                >
                  {t('header.search_btn')}
                </button>
                <button
                  onClick={onRandomPage}
                  title="Artigo Aleatório (Sorte Diária)"
                  className="stardew-btn px-2 py-1 text-[11px] cursor-pointer"
                >
                  ★ Sorte
                </button>
              </div>
            </div>
          </div>
        ) : isNokia ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative nokia-search-widget flex items-center px-3 py-1.5 transition-all cursor-pointer font-mono"
            >
              <div className="mr-2 flex items-center text-[#1f281b] shrink-0 text-xs font-bold" title="Nokia 3310">
                &gt;
              </div>
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="BUSCA NOKIA 3310..."
                className="w-full text-xs bg-transparent border-none outline-none text-[#1f281b] placeholder:text-[#1f281b]/60 font-mono cursor-text font-bold"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="nokia-btn px-2.5 py-1 text-[11px] cursor-pointer"
                  title="Buscar Artigos"
                >
                  [ BUSCAR ]
                </button>
                <button
                  onClick={onRandomPage}
                  title="Artigo Aleatório (Snake II)"
                  className="nokia-btn px-2 py-1 text-[11px] cursor-pointer"
                >
                  [ SNAKE ]
                </button>
              </div>
            </div>
          </div>
        ) : isHalfLife ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative halflife-search-widget flex items-center px-3 py-1.5 transition-all cursor-pointer font-mono"
            >
              <div className="mr-2 flex items-center text-[#ff9900] shrink-0 text-xs font-bold" title="Terminal Black Mesa">
                λ&gt;
              </div>
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="CONSULTAR BANCO DE DADOS BLACK MESA [λ]..."
                className="w-full text-xs bg-transparent border-none outline-none text-[#ff9900] placeholder:text-[#ff9900]/50 font-mono cursor-text font-bold"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="halflife-btn px-2.5 py-1 text-[11px] cursor-pointer"
                  title="Executar Consulta"
                >
                  [ CONSULTAR ]
                </button>
                <button
                  onClick={onRandomPage}
                  title="Teleporte para Artigo Aleatório"
                  className="halflife-btn px-2 py-1 text-[11px] cursor-pointer"
                >
                  λ Teleporte
                </button>
              </div>
            </div>
          </div>
        ) : isGoogleTheme ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative google-search-container flex items-center px-3.5 py-1.5 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#4285F4] mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Busca Avançada de Artigos na Enciclopédia..."
                className="w-full text-xs bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 cursor-text"
              />
              <div className="flex items-center gap-1 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50" title="Cores do Google">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
                </div>
                <button
                  onClick={onSearchSubmit}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#f8f9fa] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-slate-700 dark:text-slate-200 border border-[#dadce0] dark:border-[#5f6368] transition shadow-2xs cursor-pointer"
                  title="Abrir Busca Avançada"
                >
                  {t('header.search_btn')}
                </button>
                <button
                  onClick={onRandomPage}
                  title="Estou com sorte (Artigo Aleatório)"
                  className="px-2 py-1 text-[11px] font-semibold rounded-full bg-[#f8f9fa] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#dadce0] dark:border-[#5f6368] transition shadow-2xs cursor-pointer"
                >
                  Sorte
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 max-w-lg mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative cursor-pointer"
            >
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Busca avançada de artigos (clique para abrir)..."
                className="w-full pl-8 pr-24 py-1 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 cursor-text"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                  title="Abrir Busca Avançada"
                >
                  {t('header.search_btn')}
                </button>
                <button
                  onClick={onRandomPage}
                  title={t('header.random_page')}
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <Shuffle size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* High Density Navigation Links & Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Mobile Search Button (Visible on mobile/tablet) */}
          <button
            id="btn-header-mobile-search"
            onClick={onOpenMobileSearch}
            className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition active:scale-95 min-w-[34px] min-h-[34px] flex items-center justify-center shrink-0"
            aria-label="Pesquisar artigos"
            title="Buscar"
          >
            <Search size={16} />
          </button>
          <nav className="hidden lg:flex items-center gap-1 text-xs font-medium mr-1 border-r border-slate-200 dark:border-slate-800 pr-2">
            <button
              onClick={() => onNavigate('hub')}
              className={`px-2.5 py-1 rounded text-xs transition font-semibold ${
                currentView === 'hub'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('header.nav_hub')}
            </button>
            <button
              onClick={() => onNavigate('search')}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition font-semibold ${
                currentView === 'search'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Busca Avançada de Artigos"
            >
              <Search size={13} />
              <span>Busca Avançada</span>
            </button>
            <button
              onClick={() => onNavigate('editor')}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition font-semibold ${
                currentView === 'editor'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Edit3 size={13} />
              {t('header.nav_editor')}
            </button>
          </nav>

          {/* Light / Dark Mode Toggle Button */}
          <button
            id="btn-header-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 min-w-[32px] min-h-[32px] justify-center ${
              isDark
                ? 'bg-slate-800/90 hover:bg-slate-700/90 text-amber-300 border-slate-700 ring-1 ring-amber-400/30'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title={isDark ? 'Mudar para tema claro (Light Mode)' : 'Mudar para tema escuro (Dark Mode)'}
            aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            {isDark ? (
              <Sun size={14} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon size={14} className="text-slate-600 transition-transform duration-300 hover:-rotate-12" />
            )}
            <span className="hidden xl:inline text-[11px] font-sans">
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </button>

          {/* Language Switcher Dropdown (Desktop / Tablet) */}
          <div className="relative hidden md:block" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
              title={t('header.change_language')}
            >
              <span className="text-sm">{currentLanguage.flag}</span>
              <span className="font-mono text-[11px] uppercase hidden sm:inline">{currentLanguage.code}</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 shadow-xl py-1 z-50 animate-in fade-in text-xs">
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] font-mono">
                    {t('header.change_language')}
                  </span>
                  <span className="text-[10px] text-slate-400">45+ idiomas</span>
                </div>

                <div className="max-h-56 overflow-y-auto py-1">
                  {popularLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition ${
                        currentLanguage.code === lang.code
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 uppercase">{lang.code}</span>
                    </button>
                  ))}
                </div>

                <div className="p-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <button
                    onClick={() => {
                      setShowLangMenu(false);
                      if (onOpenLanguagesModal) onOpenLanguagesModal();
                    }}
                    className="w-full text-center py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Globe2 size={13} />
                    <span>{t('header.all_languages')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Online Users Trigger & Modal/Dropdown (Desktop / Tablet) */}
          <div className="relative hidden sm:block" ref={onlineMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
              title={t('header.change_language')}
            >
              <span className="text-sm">{currentLanguage.flag}</span>
              <span className="font-mono text-[11px] uppercase hidden sm:inline">{currentLanguage.code}</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 shadow-xl py-1 z-50 animate-in fade-in text-xs">
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] font-mono">
                    {t('header.change_language')}
                  </span>
                  <span className="text-[10px] text-slate-400">45+ idiomas</span>
                </div>

                <div className="max-h-56 overflow-y-auto py-1">
                  {popularLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition ${
                        currentLanguage.code === lang.code
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 uppercase">{lang.code}</span>
                    </button>
                  ))}
                </div>

                <div className="p-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <button
                    onClick={() => {
                      setShowLangMenu(false);
                      if (onOpenLanguagesModal) onOpenLanguagesModal();
                    }}
                    className="w-full text-center py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Globe2 size={13} />
                    <span>{t('header.all_languages')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Online Users Trigger & Modal/Dropdown */}
          <div className="relative" ref={onlineMenuRef}>
            <button
              id="btn-header-online-users"
              onClick={() => setShowOnlineMenu(!showOnlineMenu)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
              title="Ver quem está logado na WikiWorldWeb"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Users size={13} className="text-slate-500 dark:text-slate-400" />
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {onlineUsers.length}
              </span>
              <span className="text-[11px] hidden md:inline font-normal text-slate-500 dark:text-slate-400">
                online
              </span>
            </button>

            {showOnlineMenu && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in text-xs">
                <div className="px-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">Usuários Conectados</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    {onlineUsers.length} ativo{onlineUsers.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                  {onlineUsers.length === 0 ? (
                    <div className="p-3 text-center text-slate-500 text-xs">
                      Nenhum outro usuário registrado ativo no momento.
                    </div>
                  ) : (
                    onlineUsers.map((u) => (
                      <div
                        key={u.uid}
                        onClick={() => {
                          setShowOnlineMenu(false);
                          if (onNavigateToUser) {
                            onNavigateToUser(u.uid);
                          } else {
                            onNavigate('user-page');
                          }
                        }}
                        className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {u.photoURL && !u.avatarRemovedByAdmin ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {(u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {u.displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              @{u.username || u.displayName?.toLowerCase().replace(/\s+/g, '')}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : u.role === 'moderador'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 mt-1 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                  <p className="leading-snug">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Regra de Contribuição:</span> Somente usuários cadastrados e logados podem editar verbetes ou abrir discussões.
                  </p>
                  {(!user || user.isGuest) && (
                    <button
                      onClick={() => {
                        setShowOnlineMenu(false);
                        onLoginClick();
                      }}
                      className="w-full py-1 px-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition text-center"
                    >
                      Fazer Login para Contribuir
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative shrink-0" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-1.5 relative rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0"
              title={t('header.notifications')}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto right-auto sm:right-0 top-14 sm:top-auto sm:mt-1.5 w-auto sm:w-84 max-w-[calc(100vw-1rem)] bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xl py-1 z-50 animate-in fade-in text-xs">
                <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-500" />
                        Notas de Versão do Sistema
                      </span>
                      {unreadCount > 0 && (
                        <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.2 rounded font-bold">
                          {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Atualizações do sistema e notas de versão oficiais
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkNotificationsAsRead}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      title={t('header.mark_all_read')}
                    >
                      <CheckCheck size={12} />
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs px-4">
                      <Sparkles size={24} className="mx-auto mb-2 opacity-30 text-amber-500" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhuma atualização recente</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Você está na versão mais recente do sistema.</p>
                    </div>
                  ) : (
                    notifications.map((notif, notifIdx) => {
                      const isLgpd =
                        notif.id?.startsWith('lgpd-') ||
                        notif.link === '#mydata' ||
                        notif.title.toLowerCase().includes('lgpd') ||
                        notif.title.toLowerCase().includes('privacidade');

                      return (
                        <div
                          key={notif.id ? `${notif.id}-${notifIdx}` : `notif-${notifIdx}`}
                          onClick={() => {
                            onNotificationClick(notif);
                            setShowNotifs(false);
                          }}
                          className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition flex items-start gap-2.5 ${
                            !notif.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          {isLgpd ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-300 dark:border-emerald-700">
                              <ShieldCheck size={11} />
                            </div>
                          ) : (
                            <div
                              className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                                notif.type === 'success'
                                  ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                                  : notif.type === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-600'
                              }`}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                                  {notif.title}
                                </h4>
                                {isLgpd && (
                                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                                    LGPD
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">
                                {notif.date}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 flex items-center justify-center gap-2 px-3">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('mydata');
                      setShowNotifs(false);
                    }}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer py-0.5"
                    title="Configurar quais alertas LGPD você recebe"
                  >
                    <ShieldCheck size={12} />
                    <span>Configurar Notificações LGPD</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Auth Area */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-xs"
              >
                {user.photoURL && !user.avatarRemovedByAdmin ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-5 h-5 rounded-xs object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-xs bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[90px] truncate">
                  {user.displayName}
                </span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-auto sm:mt-1.5 w-60 max-w-[calc(100vw-1rem)] bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xl py-1 z-50 animate-in fade-in text-xs">
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {user.displayName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                        {user.role === 'admin' ? 'Administrador' : user.role === 'editor' ? 'Editor' : 'Convidado'}
                      </span>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigate('user-page');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold"
                    >
                      <UserIcon size={13} className="text-blue-600 dark:text-blue-400" /> Minha Página de Usuário
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('admin-dashboard');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-purple-800 dark:text-purple-200 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 flex items-center gap-2 font-bold rounded-sm mb-0.5"
                    >
                      <Shield size={13} className="text-purple-600 dark:text-purple-400" /> Painel de Administração (HUB)
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('admin-users');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Layers size={13} className="text-purple-600 dark:text-purple-400" /> Diretório de Usuários
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('admin-council');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2 font-bold"
                    >
                      <Crown size={13} className="text-purple-600 dark:text-purple-400" /> Central de Burocratas & Moderação
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('admin-extensions');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2 font-medium"
                    >
                      <Puzzle size={13} className="text-purple-600 dark:text-purple-400" /> Extensões da Wiki (Burocratas)
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('admin-data-removal');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                    >
                      <ShieldAlert size={13} className="text-red-500" /> Pedidos de Remoção (LGPD)
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('admin-firebase');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                    >
                      <Database size={13} className="text-amber-500" /> Admin Firebase DB
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('vpn-checker');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                    >
                      <ShieldAlert size={13} className="text-blue-500" /> Verificador de VPN
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('mydata');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserIcon size={13} /> {t('header.my_data')}
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('security');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Shield size={13} /> {t('header.security')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onToggleTheme();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                    >
                      <div className="flex items-center gap-2">
                        {isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-slate-500" />}
                        <span>{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{isDark ? 'Claro' : 'Escuro'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onLogoutClick();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1"
                    >
                      <LogOut size={13} /> {t('header.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onLoginClick}
                className="px-2 sm:px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 shadow-xs shrink-0"
              >
                <UserIcon size={12} />
                <span>{t('header.login')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
