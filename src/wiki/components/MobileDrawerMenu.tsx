import React from 'react';
import {
  X,
  Home,
  Search,
  BookOpen,
  History,
  Layers,
  Star,
  Globe2,
  Moon,
  Sun,
  Shield,
  Crown,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Heart,
  ExternalLink,
  LifeBuoy,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  Smartphone,
  Monitor,
  PlusCircle,
  Database,
  Info,
  Sparkles,
  UserX,
  Scale,
  Vote,
  MessageSquare,
  Users,
  Upload,
  Image as ImageIcon,
  Gavel,
  Tv,
  Palette,
  Check,
  Calculator,
  Puzzle,
} from 'lucide-react';
import { UserProfile, ViewMode, DeviceMode, AppTheme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatExternalUrl } from '../utils/linkUtils';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  user: UserProfile | null;
  currentView: ViewMode;
  deviceMode: DeviceMode;
  isDark: boolean;
  theme?: AppTheme;
  totalPages: number;
  totalArticles: number;
  onClose: () => void;
  onNavigate: (view: ViewMode) => void;
  onToggleTheme: () => void;
  onSetTheme?: (theme: AppTheme) => void;
  onToggleDeviceMode: (mode: DeviceMode) => void;
  onOpenLanguagesModal: () => void;
  onOpenSmartTVModal?: () => void;
  onCreatePageClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({
  isOpen,
  user,
  currentView,
  deviceMode,
  isDark,
  theme = 'light',
  totalPages,
  totalArticles,
  onClose,
  onNavigate,
  onToggleTheme,
  onSetTheme,
  onToggleDeviceMode,
  onOpenLanguagesModal,
  onOpenSmartTVModal,
  onCreatePageClick,
  onLoginClick,
  onLogoutClick,
}) => {
  const { currentLanguage, t } = useLanguage();
  const isGoogleTheme = theme === 'google' || theme === 'google-dark';

  if (!isOpen) return null;

  const handleItemClick = (view: ViewMode) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div
      id="mobile-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-start animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="mobile-drawer-content"
        className="w-[85vw] max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header with User Profile / Login */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex flex-col gap-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Logotipo WikiZero"
                className="w-7 h-7 rounded object-contain drop-shadow-xs bg-white/10"
              />
              <div>
                <span className="font-serif-heading font-bold text-base tracking-tight block leading-tight">WikiZero</span>
                <span className="text-[10px] text-blue-100 font-serif italic block leading-tight" title="Frase Principal da Wiki">
                  «Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Card */}
          {user ? (
            <div className="flex items-center justify-between bg-black/20 p-2.5 rounded-xl border border-white/10 mt-1">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL && !user.avatarRemovedByAdmin ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-white/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center border border-white/40">
                    {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-white truncate">{user.displayName}</p>
                  <p className="text-[10px] text-blue-200 capitalize">{user.role || 'Membro'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onLogoutClick();
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-red-200 hover:text-white transition"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onLoginClick();
                onClose();
              }}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-blue-700 rounded-lg text-xs font-bold shadow transition flex items-center justify-center gap-2"
            >
              <UserIcon size={14} />
              <span>Entrar / Cadastrar-se</span>
            </button>
          )}
        </div>

        {/* Quick Mode Switches (Mobile vs Desktop & Theme & Language) */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          {/* Device View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-lg">
            <button
              onClick={() => onToggleDeviceMode('mobile')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
                deviceMode === 'mobile' || deviceMode === 'auto'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Exibir layout otimizado para dispositivos móveis"
            >
              <Smartphone size={12} />
              <span>Móvel</span>
            </button>
            <button
              onClick={() => onToggleDeviceMode('desktop')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
                deviceMode === 'desktop'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Exibir versão completa de computador"
            >
              <Monitor size={12} />
              <span>Desktop</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Modal Trigger */}
            <button
              onClick={() => {
                onOpenLanguagesModal();
                onClose();
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1 text-xs"
              title="Alterar Idioma"
            >
              <span>{currentLanguage.flag}</span>
              <span className="text-[10px] font-mono uppercase font-bold">{currentLanguage.code}</span>
            </button>

            {/* Quick Google Theme Toggle */}
            <button
              id="btn-drawer-quick-google-theme"
              onClick={() => {
                if (isGoogleTheme) {
                  onSetTheme?.(isDark ? 'dark' : 'light');
                } else {
                  onSetTheme?.(isDark ? 'google-dark' : 'google');
                }
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 ${
                isGoogleTheme
                  ? 'bg-blue-50 dark:bg-blue-950/70 border-[#4285F4] text-blue-700 dark:text-blue-300 ring-1 ring-[#4285F4]/30'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={isGoogleTheme ? 'Desativar Tema Google' : 'Ativar Tema Google Material'}
            >
              <div className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
              </div>
            </button>

            {/* Quick Genshin Toggle */}
            <button
              id="btn-drawer-quick-genshin-theme"
              onClick={() => {
                if (theme === 'genshin') {
                  onSetTheme?.('light');
                } else {
                  onSetTheme?.('genshin');
                }
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 ${
                theme === 'genshin'
                  ? 'bg-gradient-to-r from-[#715ae0] to-[#35a5ea] text-white border-amber-300/60 ring-1 ring-amber-300/40'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={theme === 'genshin' ? 'Desativar Tema Genshin' : 'Ativar Tema Genshin Impact'}
            >
              <Sparkles size={14} className={theme === 'genshin' ? 'text-amber-300 animate-pulse' : 'text-amber-500'} />
            </button>

            {/* Quick R.E.P.O. Semiwork Toggle */}
            <button
              id="btn-drawer-quick-repo-theme"
              onClick={() => {
                if (theme === 'repo') {
                  onSetTheme?.('light');
                } else {
                  onSetTheme?.('repo');
                }
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 font-mono text-[10px] font-bold ${
                theme === 'repo'
                  ? 'bg-[#090c10] border-[#f59e0b] text-[#f59e0b] ring-1 ring-[#f59e0b]/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={theme === 'repo' ? 'Desativar Tema R.E.P.O.' : 'Ativar Tema R.E.P.O. Semiwork'}
            >
              <AlertTriangle size={13} className={theme === 'repo' ? 'text-amber-400 animate-pulse' : 'text-amber-500'} />
              <span className="hidden xs:inline">REPO</span>
            </button>

            {/* Quick Half-Life Toggle */}
            <button
              id="btn-drawer-quick-halflife-theme"
              onClick={() => {
                if (theme === 'halflife') {
                  onSetTheme?.('light');
                } else {
                  onSetTheme?.('halflife');
                }
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 font-mono text-[10px] font-bold ${
                theme === 'halflife'
                  ? 'bg-[#181b18] border-[#ff9900] text-[#ff9900] ring-1 ring-[#ff9900]/60 shadow-[0_0_8px_rgba(255,153,0,0.3)]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={theme === 'halflife' ? 'Desativar Tema Half-Life' : 'Ativar Tema Half-Life (Black Mesa)'}
            >
              <span className="w-3.5 h-3.5 rounded-full border border-[#ff9900] text-[#ff9900] flex items-center justify-center text-[9px] font-black">λ</span>
              <span className="hidden xs:inline">H-Life</span>
            </button>

            {/* Quick Nokia 3310 Toggle */}
            <button
              id="btn-drawer-quick-nokia-theme"
              onClick={() => {
                if (theme === 'nokia3310') {
                  onSetTheme?.('light');
                } else {
                  onSetTheme?.('nokia3310');
                }
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 font-mono text-[10px] font-bold ${
                theme === 'nokia3310'
                  ? 'bg-[#b4c995] border-[#1f281b] text-[#1f281b] ring-1 ring-[#1f281b]/50 shadow-[1px_1px_0px_#1f281b]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={theme === 'nokia3310' ? 'Desativar Tema Nokia 3310' : 'Ativar Tema Nokia 3310 LCD'}
            >
              <Smartphone size={13} className={theme === 'nokia3310' ? 'text-[#1f281b]' : 'text-slate-600 dark:text-slate-400'} />
              <span className="hidden xs:inline">3310</span>
            </button>

            {/* Quick Windows 1.0 Toggle */}
            <button
              id="btn-drawer-quick-win1-theme"
              onClick={() => {
                if (theme === 'win1') {
                  onSetTheme?.('light');
                } else {
                  onSetTheme?.('win1');
                }
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 font-mono text-[10px] font-bold ${
                theme === 'win1'
                  ? 'bg-[#0000aa] border-black text-white ring-1 ring-black shadow-[1px_1px_0px_#000]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={theme === 'win1' ? 'Desativar Tema Windows 1.0' : 'Ativar Tema Windows 1.0 (1985)'}
            >
              <span className="w-3.5 h-3.5 bg-[#0000aa] text-white border border-black flex items-center justify-center text-[8px] font-mono font-bold">1</span>
              <span className="hidden xs:inline">W1.0</span>
            </button>

            {/* Quick Windows XP Toggle */}
            <button
              id="btn-drawer-quick-winxp-theme"
              onClick={() => {
                if (theme === 'winxp') {
                  onSetTheme?.('light');
                } else {
                  onSetTheme?.('winxp');
                }
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 font-sans text-[10px] font-bold ${
                theme === 'winxp'
                  ? 'bg-[#0055ea] border-[#003bb3] text-white ring-1 ring-[#0055ea]/50 shadow-[0_0_8px_rgba(0,85,234,0.4)]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={theme === 'winxp' ? 'Desativar Tema Windows XP' : 'Ativar Tema Windows XP Luna'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#f25022" d="M2 3h9v9H2z" />
                <path fill="#7fba00" d="M13 3h9v9h-9z" />
                <path fill="#00a4ef" d="M2 13h9v9H2z" />
                <path fill="#ffb900" d="M13 13h9v9h-9z" />
              </svg>
              <span className="hidden xs:inline">XP</span>
            </button>

            {/* Quick Windows 7 Toggle */}
            <button
              id="btn-drawer-quick-win7-theme"
              onClick={() => {
                if (theme === 'win7') {
                  onSetTheme?.('light');
                } else {
                  onSetTheme?.('win7');
                }
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 font-sans text-[10px] font-bold ${
                theme === 'win7'
                  ? 'bg-[#154c7d] border-[#7da2ce] text-white ring-1 ring-sky-400/50 shadow-[0_0_8px_rgba(0,164,239,0.5)]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={theme === 'win7' ? 'Desativar Tema Windows 7' : 'Ativar Tema Windows 7 Aero'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 160 160">
                <path d="M 28 34 C 44 26, 62 46, 75 40 C 75 58, 74 76, 74 88 C 60 94, 44 74, 27 82 Z" fill="#f25022" />
                <path d="M 83 39 C 97 33, 115 48, 133 42 C 132 60, 130 78, 129 90 C 114 96, 97 78, 83 87 Z" fill="#7fba00" />
                <path d="M 26 89 C 43 82, 60 100, 74 95 C 73 112, 72 130, 71 142 C 58 147, 41 129, 25 137 Z" fill="#00a4ef" />
                <path d="M 82 94 C 96 88, 114 103, 128 97 C 127 114, 125 131, 124 144 C 110 150, 94 132, 81 141 Z" fill="#ffb900" />
              </svg>
              <span className="hidden xs:inline">7</span>
            </button>

            {/* Quick Windows 10 Toggle */}
            <button
              id="btn-drawer-quick-win10-theme"
              onClick={() => {
                if (theme === 'win10') {
                  onSetTheme?.('light');
                } else {
                  onSetTheme?.('win10');
                }
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 font-sans text-[10px] font-bold ${
                theme === 'win10'
                  ? 'bg-[#0078d7] border-[#00adef] text-white ring-1 ring-sky-400/50 shadow-[0_0_8px_rgba(0,120,215,0.6)]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={theme === 'win10' ? 'Desativar Tema Windows 10' : 'Ativar Tema Windows 10 Fluent'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 115 119" fill="none">
                <path d="M0 16.5L45.4 10.3V56.4H0V16.5Z" fill="#00adef" />
                <path d="M50.6 9.6L114.7 0V55.7H50.6V9.6Z" fill="#00adef" />
                <path d="M0 62.4H45.4V108.5L0 102.3V62.4Z" fill="#00adef" />
                <path d="M50.6 62.4H114.7V118.1L50.6 108.5V62.4Z" fill="#00adef" />
              </svg>
              <span className="hidden xs:inline">10</span>
            </button>

            {/* Quick Wikidiota Toggle */}
            <button
              id="btn-drawer-quick-wikidiota-theme"
              onClick={() => {
                if (theme === 'wikidiota') {
                  onSetTheme?.('light');
                } else {
                  onSetTheme?.('wikidiota');
                }
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 font-serif text-[10px] font-bold ${
                theme === 'wikidiota'
                  ? 'bg-[#f8f9fa] border-[#3366cc] text-[#0645ad] ring-1 ring-[#3366cc]/40 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={theme === 'wikidiota' ? 'Desativar Tema Wikidiota' : 'Ativar Tema Wikidiota (Paródia Wikipédia)'}
            >
              <span className="text-xs">🌐</span>
              <span className="hidden xs:inline">Wikiomite</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title={isDark ? 'Tema Claro' : 'Tema Escuro'}
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Dedicated Centralized Appearance Page Button */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => handleItemClick('appearance')}
              className="w-full flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Palette size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    Aparência e Temas
                  </div>
                  <div className="text-[10px] text-slate-400">
                    6 temas, tipografia & contraste
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase">
                {theme}
              </span>
            </button>
          </div>

          {/* Android PWA App Quick Action */}
          <div className="pb-1 space-y-1.5">
            <PWAInstallPrompt buttonStyle="full" />

            <button
              onClick={() => {
                onClose();
                if (onOpenSmartTVModal) {
                  onOpenSmartTVModal();
                } else {
                  onNavigate('smart-tv');
                }
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 hover:scale-[1.01] transition shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Tv size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>Aplicativo Smart TV</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold">
                10-Foot
              </span>
            </button>
          </div>

          {/* Main Wiki Navigation */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-2">
              Navegação Principal
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => handleItemClick('hub')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  currentView === 'hub'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Home size={16} className="text-blue-600" />
                <span>Página Principal (Hub)</span>
              </button>

              <button
                onClick={() => handleItemClick('search')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  currentView === 'search'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Search size={16} className="text-blue-600" />
                <span>Busca Avançada de Artigos</span>
              </button>

              <button
                onClick={() => handleItemClick('site-updates')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'site-updates'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Atualizações & Melhorias</span>
                </div>
                <span className="text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded-xs font-mono font-bold">
                  v3.3
                </span>
              </button>

              <button
                onClick={() => handleItemClick('recent-changes')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  currentView === 'recent-changes'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <History size={16} className="text-cyan-600" />
                <span>{t('sidebar.recent_changes')}</span>
              </button>

              <button
                onClick={() => handleItemClick('special-pages')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  currentView === 'special-pages'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Layers size={16} className="text-purple-600" />
                <span>Páginas Especiais</span>
              </button>

              <button
                id="btn-drawer-tools"
                onClick={() => handleItemClick('tools')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'tools'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calculator size={16} className="text-indigo-600" />
                  <span>Ferramentas de Uso Comum</span>
                </div>
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1 py-0.2 rounded-xs font-mono font-bold">
                  ÚTIL
                </span>
              </button>

              <button
                onClick={() => handleItemClick('appearance')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'appearance'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Palette size={16} className="text-amber-500" />
                  <span>Aparência e Temas</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                  {theme}
                </span>
              </button>

              <button
                onClick={() => handleItemClick('upload')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'upload'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Upload size={16} className="text-blue-600" />
                  <span>Carregar Ficheiro (Upload)</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  NOVO
                </span>
              </button>

              <button
                onClick={() => handleItemClick('files-list')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  currentView === 'files-list'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <ImageIcon size={16} className="text-indigo-600" />
                <span>Galeria de Ficheiros</span>
              </button>

              <button
                onClick={() => handleItemClick('admin-dashboard')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'admin-dashboard' ||
                  currentView === 'admin-users' ||
                  currentView === 'admin-council' ||
                  currentView === 'admin-data-removal' ||
                  currentView === 'unblock-requests' ||
                  currentView === 'admin-extensions'
                    ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/80 dark:to-indigo-950/80 text-purple-900 dark:text-purple-100 font-bold'
                    : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Painel de Administração (HUB)</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                  ADMIN
                </span>
              </button>

              <button
                onClick={() => handleItemClick('admin-council')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'admin-council'
                    ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 font-bold'
                    : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Crown size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Central de Burocratas & Moderação</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                  CONSELHO
                </span>
              </button>

              <button
                onClick={() => handleItemClick('admin-extensions')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'admin-extensions'
                    ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 font-bold'
                    : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Puzzle size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Extensões da Wiki (Burocratas)</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                  EXTS
                </span>
              </button>

              <button
                onClick={() => handleItemClick('admin-users')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'admin-users'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Lista de Usuários Cadastrados</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  LISTA
                </span>
              </button>

              <button
                onClick={() => handleItemClick('promotion-requests')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'promotion-requests'
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Vote size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Pedidos de Promoção (RFA)</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  VOTO
                </span>
              </button>

              <button
                onClick={() => handleItemClick('arbitration')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'arbitration'
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Gavel size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Conselho de Arbitragem</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  ARBCOM
                </span>
              </button>

              <button
                onClick={() => handleItemClick('contact-admin')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'contact-admin'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Falar com a Administração</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  SUPORTE
                </span>
              </button>

              <button
                id="btn-drawer-ucoc"
                onClick={() => handleItemClick('ucoc')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'ucoc'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Código de Conduta (UCoC)</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  FORMAL
                </span>
              </button>

              <button
                onClick={() => handleItemClick('watchlist')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  currentView === 'watchlist'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Star size={16} className="text-amber-500" />
                <span>Artigos Vigiados</span>
              </button>

              <button
                onClick={() => {
                  onCreatePageClick();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <PlusCircle size={16} className="text-emerald-600" />
                <span>Novo Portal / Tópico</span>
              </button>
            </div>
          </div>

          {/* WazzimaGiygg Support & External Highlights */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-2">
              Suporte & Destaques
            </span>
            <div className="space-y-1">
              <a
                href={formatExternalUrl("https://support.wazzimagiygg.com/")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 transition"
              >
                <div className="flex items-center gap-2">
                  <LifeBuoy size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Suporte & Tickets WazzimaGiygg</span>
                </div>
                <ExternalLink size={12} />
              </a>

              <a
                href={formatExternalUrl("https://wazzimagiygg.com/averdade/")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-100 transition"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                  <span>Dossiê A Verdade</span>
                </div>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* User Account / Admin Area (if logged) */}
          {user && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-2">
                Painel do Usuário
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => handleItemClick('user-page')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                >
                  <UserIcon size={16} className="text-blue-600" />
                  <span>Minha Página de Usuário</span>
                </button>

                <button
                  onClick={() => handleItemClick('admin-users')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                >
                  <Layers size={16} className="text-purple-600" />
                  <span>Diretório de Usuários</span>
                </button>

                {(user.role === 'admin' || user.role === 'moderador' || user.email === 'pedrohenriquecardonaperes@gmail.com') && (
                  <>
                    <button
                      onClick={() => handleItemClick('checkuser')}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserX size={16} className="text-rose-600 dark:text-rose-400" />
                        <span>CheckUser (Fantoches)</span>
                      </div>
                      <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                        MOD
                      </span>
                    </button>

                    <button
                      onClick={() => handleItemClick('unblock-requests')}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Scale size={16} className="text-purple-600 dark:text-purple-400" />
                        <span>Recursos de Desbloqueio</span>
                      </div>
                      <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                        ADM
                      </span>
                    </button>

                    <button
                      onClick={() => handleItemClick('admin-data-removal')}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert size={16} className="text-red-600 dark:text-red-400" />
                        <span>Pedidos de Remoção (LGPD)</span>
                      </div>
                      <span className="text-[9px] font-bold font-mono px-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                        LGPD
                      </span>
                    </button>
                  </>
                )}

                {user.role === 'admin' && (
                  <button
                    onClick={() => handleItemClick('admin-firebase')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                  >
                    <Database size={16} className="text-amber-500" />
                    <span>Admin Firebase Firestore</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Legal & Compliance */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-2">
              Legal & Conformidade
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => handleItemClick('privacy')}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>LGPD & Marco Civil</span>
              </button>

              <button
                onClick={() => handleItemClick('editing-ethics')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Scale size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Ética de Edição (LGPD/GDPR)</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  REGRAS
                </span>
              </button>

              <button
                onClick={() => handleItemClick('mydata')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Shield size={16} className="text-emerald-500" />
                  <span>Painel do Titular de Dados</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  DIREITOS
                </span>
              </button>

              <button
                onClick={() => handleItemClick('terms')}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <FileText size={16} />
                <span>Termos de Uso</span>
              </button>

              <button
                onClick={() => handleItemClick('donation')}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <Heart size={16} className="text-rose-500" />
                <span>Apoiar a WikiWorldWeb</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer with Wiki Stats */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300">WikiWorldWeb v3.0</span>
            <p className="text-[10px] text-slate-400">{totalArticles} artigos • {totalPages} portais</p>
          </div>
          <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">
            Minerva Mobile
          </span>
        </div>
      </div>
    </div>
  );
};
