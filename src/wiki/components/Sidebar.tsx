import React from 'react';
import {
  Home,
  Search,
  History,
  Shuffle,
  PlusCircle,
  Edit3,
  Shield,
  Heart,
  Lock,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  WifiOff,
  Sparkles,
  Globe2,
  Star,
  Users,
  Database,
  LifeBuoy,
  ExternalLink,
  Layers,
  UserX,
  Scale,
  Vote,
  MessageSquare,
  Upload,
  Image as ImageIcon,
  Gavel,
  AlertOctagon,
  ShieldAlert,
  Tv,
  Palette,
  Award,
  Sun,
  Moon,
  Monitor,
  BookOpen,
  Crown,
  Calculator,
  GraduationCap,
  Newspaper,
  Clock,
  Puzzle,
} from 'lucide-react';
import { ViewMode, DeviceMode, AppTheme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatExternalUrl } from '../utils/linkUtils';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { RecentlyReadService, RecentlyReadItem } from '../utils/recentlyReadService';

interface SidebarProps {
  currentView: ViewMode;
  isCollapsed: boolean;
  theme?: AppTheme;
  isDark?: boolean;
  deviceMode?: DeviceMode;
  onToggleCollapse: () => void;
  onNavigate: (view: ViewMode) => void;
  onRandomPage: () => void;
  onCreatePageClick: () => void;
  totalPages: number;
  totalArticles: number;
  onSetTheme?: (theme: AppTheme) => void;
  onOpenLanguagesModal?: () => void;
  onOpenSmartTVModal?: () => void;
  onOpenGeminiChatbot?: () => void;
  onOpenGeminiNotebook?: () => void;
  onOpenGeminiPremium?: () => void;
  onSelectArticle?: (articleId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  isCollapsed,
  theme = 'light',
  isDark = false,
  deviceMode = 'auto',
  onToggleCollapse,
  onNavigate,
  onRandomPage,
  onCreatePageClick,
  totalPages,
  totalArticles,
  onSetTheme,
  onOpenLanguagesModal,
  onOpenSmartTVModal,
  onOpenGeminiChatbot,
  onOpenGeminiNotebook,
  onOpenGeminiPremium,
  onSelectArticle,
}) => {
  const { currentLanguage, t } = useLanguage();

  const [recentlyRead, setRecentlyRead] = React.useState<RecentlyReadItem[]>(() =>
    RecentlyReadService.getRecentlyRead()
  );

  React.useEffect(() => {
    const handleUpdate = () => {
      setRecentlyRead(RecentlyReadService.getRecentlyRead());
    };

    window.addEventListener('wikizero_recently_read_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('wikizero_recently_read_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

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
  const isStardew = theme === 'stardew';
  const isRepo = theme === 'repo';
  const isMinecraft = theme === 'minecraft';
  const isRoblox = theme === 'roblox';
  const isNokia = theme === 'nokia3310';
  const isHalfLife = theme === 'halflife';

  const visibilityClass =
    deviceMode === 'mobile'
      ? 'hidden'
      : deviceMode === 'desktop'
      ? 'flex'
      : 'hidden md:flex';

  return (
    <aside
      id="desktop-sidebar"
      className={`relative flex-col transition-all duration-200 z-20 select-none shrink-0 sticky top-16 self-start max-h-[calc(100vh-5rem)] overflow-hidden no-print print:hidden ${
        isWin1
          ? 'bg-white border-2 border-black !rounded-none shadow-none font-mono text-black'
          : isWin31
          ? 'win31-window !border-2 !border-black !rounded-none !bg-[#c0c0c0] font-sans text-black shadow-md'
          : isWin95
          ? 'win95-window !border-2 !rounded-none !bg-[#c0c0c0]'
          : isWinXP
          ? 'winxp-window !border-2 !border-[#0055ea] !rounded-t-lg !bg-[#ece9d8] text-slate-900'
          : isWin7
          ? 'win7-window !rounded-lg !border-white/60 !bg-sky-50/80 text-slate-900'
          : isWin10
          ? 'win10-window !rounded-xs !border-[#0078d7]/50 !bg-[#141824]/95 text-white'
          : isWikidiota
          ? 'wikidiota-sidebar !bg-[#f6f6f6] !border-r !border-[#a7d7f9] !rounded-none shadow-none font-sans text-[#202122]'
          : isHalfLife
          ? 'halflife-sidebar !bg-[#131613]/98 !border-2 !border-[#ff9900]/70 !rounded-lg shadow-[0_0_20px_rgba(255,153,0,0.2)] font-mono text-amber-200'
          : isNokia
          ? 'bg-[#b4c995] border-2 border-[#1f281b] !rounded-none shadow-[3px_3px_0px_#1f281b] font-mono text-[#1f281b]'
          : isRepo
          ? 'bg-[#080c13]/95 border-2 border-[#f59e0b]/50 rounded-lg shadow-[0_0_16px_rgba(245,158,11,0.15)] font-mono'
          : isMinecraft
          ? 'bg-[#1b1815]/95 border-2 border-[#3d3630] rounded-xs shadow-[0_4px_16px_rgba(0,0,0,0.6)] font-mono text-stone-200'
          : isRoblox
          ? 'bg-[#16171b]/98 border border-[#2d3036] rounded-xl shadow-lg font-sans text-white'
          : isGenshin
          ? 'bg-[#14192b]/95 border border-[#d3bc8e]/30 rounded-xl shadow-lg backdrop-blur-md'
          : isStardew
          ? 'stardew-box bg-[#fffbf2] rounded-xl'
          : isAndroid
          ? 'bg-[#1c1d21] border border-[#303338] rounded-xl shadow-xs'
          : isGoogleTheme
          ? 'bg-[#f8fafd] dark:bg-[#202124] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs'
          : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-xl shadow-2xs'
      } ${visibilityClass} ${isCollapsed ? 'w-14' : 'w-56'}`}
    >
      {/* Sidebar Header with Title & Collapse Action */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 min-w-0">
            <img src="/logo.png" alt="WikiZero Logo" className="w-4 h-4 object-contain rounded-xs shrink-0" />
            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono truncate ${isHalfLife ? 'text-[#ff9900] flex items-center gap-1' : 'text-slate-500 dark:text-slate-400'}`}>
              {isHalfLife && <span className="text-[11px]">λ</span>}
              {isHalfLife ? 'BLACK MESA NET' : 'WikiZero'}
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className={`p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
            isCollapsed ? 'mx-auto' : ''
          }`}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-4">
        {/* Navigation Section: Principal */}
        <div>
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('hub')}
              title={t('sidebar.home')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'hub'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Home size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.home')}</span>}
            </button>

            <button
              onClick={() => onNavigate('search')}
              title="Busca Avançada de Artigos"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'search'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Search size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Busca Avançada</span>}
            </button>

            <button
              onClick={() => onNavigate('recent-changes')}
              title={t('sidebar.recent_changes')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'recent-changes'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <History size={15} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.recent_changes')}</span>}
            </button>

            <button
              onClick={onRandomPage}
              title={t('sidebar.random')}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
            >
              <Shuffle size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.random')}</span>}
            </button>

            <button
              onClick={onCreatePageClick}
              title={t('sidebar.create_collection')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'create-page'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.create_collection')}</span>}
            </button>

            <button
              onClick={() => onNavigate('editor')}
              title={t('sidebar.wikitext_editor')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'editor'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Edit3 size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.wikitext_editor')}</span>}
            </button>

            <button
              id="btn-sidebar-site-updates"
              onClick={() => onNavigate('site-updates')}
              title="Atualizações do Site & Notas de Versão"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'site-updates'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles size={15} className="text-amber-500 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Atualizações do Site</span>
                  <span className="text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold px-1 rounded-xs">
                    v3.3
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('appearance')}
              title="Aparência e Temas (Special:Appearance)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'appearance'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Palette size={15} className="text-amber-500 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Aparência & Temas</span>}
            </button>

            <button
              onClick={() => onNavigate('special-pages')}
              title="Páginas Especiais (Special:SpecialPages)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'special-pages'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Páginas Especiais</span>}
            </button>

            <button
              id="btn-sidebar-library"
              onClick={() => onNavigate('library')}
              title="Wiki dos Livros e Periódicos (Acervo Bibliográfico)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'library'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <BookOpen size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Wiki dos Livros</span>
                  <span className="text-[8px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold px-1 rounded-xs">
                    LIVROS
                  </span>
                </div>
              )}
            </button>

            <button
              id="btn-sidebar-academic"
              onClick={() => onNavigate('academic')}
              title="Wiki Universitário (Repositório Acadêmico, Google Acadêmico, Teses, Artigos e Citações)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'academic'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Wiki Universitário</span>
                  <span className="text-[8px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold px-1 rounded-xs">
                    ACADÊMICO
                  </span>
                </div>
              )}
            </button>

            <button
              id="btn-sidebar-news"
              onClick={() => onNavigate('news')}
              title="Jornal WazzimaGiygg (Notícias, Investigações e Edição Digital)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'news'
                  ? 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Newspaper size={15} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Jornal WazzimaGiygg</span>
                  <span className="text-[8px] bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-mono font-bold px-1 rounded-xs">
                    NOTÍCIAS
                  </span>
                </div>
              )}
            </button>

            <button
              id="btn-sidebar-tools"
              onClick={() => onNavigate('tools')}
              title="Ferramentas Comuns: Calculadora, Horário Certo e Verificador de Teclado (Special:Tools)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'tools'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Calculator size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Ferramentas</span>
                  <span className="text-[8px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold px-1 rounded-xs">
                    ÚTIL
                  </span>
                </div>
              )}
            </button>

            <button
              id="btn-sidebar-comparison"
              onClick={() => onNavigate('comparison')}
              title="Comparativo: WikiWorldWeb vs Wikipédia, MediaWiki e Fandom"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'comparison'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Award size={15} className="text-emerald-500 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Comparativo Wiki</span>}
            </button>

            <button
              id="btn-sidebar-wazzimagiygg"
              onClick={() => onNavigate('wazzimagiygg')}
              title="WazzimaGiygg: Portal Oficial, Projetos e Dossiê A Verdade"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'wazzimagiygg'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Shield size={15} className="text-amber-500 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">WazzimaGiygg</span>}
            </button>

            <button
              onClick={() => onNavigate('watchlist')}
              title="Páginas Vigiadas (Watchlist)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'watchlist'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Star size={15} className="text-amber-500 flex-shrink-0" fill={currentView === 'watchlist' ? 'currentColor' : 'none'} />
              {!isCollapsed && <span className="truncate">Páginas Vigiadas</span>}
            </button>
          </nav>
        </div>

        {/* Section: Recently Read (Lidos Recentemente - Últimos 5 artigos via localStorage) */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-2 mb-1.5">
            {!isCollapsed ? (
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-mono">
                <Clock size={12} className="text-blue-500 shrink-0" />
                <span>Lidos Recentemente</span>
                {recentlyRead.length > 0 && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold font-mono">
                    {recentlyRead.length}
                  </span>
                )}
              </h3>
            ) : (
              <div
                title={`Lidos Recentemente (${recentlyRead.length} artigos)`}
                className="mx-auto text-slate-400 dark:text-slate-500 p-1"
              >
                <Clock size={15} className="text-blue-500" />
              </div>
            )}

            {!isCollapsed && recentlyRead.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  RecentlyReadService.clear();
                }}
                title="Limpar histórico de artigos lidos recentemente"
                className="text-[9px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-mono transition cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {!isCollapsed ? (
            recentlyRead.length === 0 ? (
              <div className="px-2 py-1 text-[11px] text-slate-400 dark:text-slate-500 italic">
                Nenhum artigo lido ainda
              </div>
            ) : (
              <nav className="space-y-0.5" aria-label="Artigos lidos recentemente">
                {recentlyRead.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (onSelectArticle) {
                        onSelectArticle(item.id);
                      } else {
                        onNavigate('article');
                      }
                    }}
                    title={`Ler artigo: ${item.title}`}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400 transition group cursor-pointer"
                  >
                    <FileText
                      size={13}
                      className="text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors"
                    />
                    <span className="truncate flex-1 text-[11px] font-medium leading-tight">
                      {item.title}
                    </span>
                  </button>
                ))}
              </nav>
            )
          ) : (
            recentlyRead.length > 0 && (
              <div className="flex flex-col items-center gap-1 py-1">
                {recentlyRead.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (onSelectArticle) {
                        onSelectArticle(item.id);
                      } else {
                        onNavigate('article');
                      }
                    }}
                    title={`#${idx + 1} Recente: ${item.title}`}
                    className="p-1.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  >
                    <FileText size={14} className="text-slate-400 hover:text-blue-500" />
                  </button>
                ))}
              </div>
            )
          )}
        </div>

        {/* Section: Ficheiros & Mídias */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>Ficheiros & Mídias</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('upload')}
              title="Carregar Ficheiro (Special:Upload)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'upload'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Upload size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Carregar Ficheiro</span>}
            </button>

            <button
              onClick={() => onNavigate('files-list')}
              title="Galeria de Ficheiros (Special:Files)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'files-list'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <ImageIcon size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Galeria de Ficheiros</span>}
            </button>
          </nav>
        </div>

        {/* Section: Comunidade & Usuários */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>Comunidade & Usuários</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('user-page')}
              title="Página de Usuário (User:Perfil)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'user-page'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <UserCheck size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Página do Usuário</span>}
            </button>

            <button
              onClick={() => onNavigate('admin-dashboard')}
              title="Painel Unificado de Administração (Special:AdminDashboard)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'admin-dashboard' ||
                currentView === 'admin-users' ||
                currentView === 'admin-council' ||
                currentView === 'admin-data-removal' ||
                currentView === 'unblock-requests' ||
                currentView === 'admin-extensions'
                  ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/80 dark:to-indigo-950/80 text-purple-900 dark:text-purple-100 font-bold border border-purple-300 dark:border-purple-700 shadow-xs'
                  : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              <Shield size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate font-semibold">Painel Administrativo</span>
                  <span className="text-[8px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-mono font-bold px-1 rounded-xs">
                    HUB
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('admin-council')}
              title="Conselho de Burocratas & Moderadores (Special:Bureaucrats)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'admin-council'
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 font-bold border border-purple-300 dark:border-purple-700 shadow-xs'
                  : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              <Crown size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate font-semibold">Burocratas & Moderação</span>
                  <span className="text-[8px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-mono font-bold px-1 rounded-xs">
                    CONSELHO
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('admin-extensions')}
              title="Gerenciamento de Extensões da Wiki (Special:Extensions)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'admin-extensions'
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 font-bold border border-purple-300 dark:border-purple-700 shadow-xs'
                  : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              <Puzzle size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate font-semibold">Extensões da Wiki</span>
                  <span className="text-[8px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-mono font-bold px-1 rounded-xs">
                    BUROCRATAS
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('admin-users')}
              title="Diretório de Usuários (Special:ListUsers)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'admin-users'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Users size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Diretório de Usuários</span>}
            </button>

            <button
              onClick={() => onNavigate('checkuser')}
              title="Verificador de Contas (Special:CheckUser - Fantoches)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'checkuser'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <UserX size={15} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">CheckUser (Fantoches)</span>
                  <span className="text-[8px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono font-bold px-1 rounded-xs">
                    MOD
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('unblock-requests')}
              title="Avaliação de Pedidos de Desbloqueio (Special:UnblockRequests)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'unblock-requests'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Scale size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Recursos de Desbloqueio</span>
                  <span className="text-[8px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono font-bold px-1 rounded-xs">
                    ADM
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('admin-data-removal')}
              title="Pedidos de Remoção de Dados (LGPD Art. 18, VI - Exclusão de Contas)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'admin-data-removal'
                  ? 'bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert size={15} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Remoção de Dados</span>
                  <span className="text-[8px] bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-mono font-bold px-1 rounded-xs">
                    LGPD
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('promotion-requests')}
              title="Pedidos de Promoção para Moderador e Administrador (Special:PromotionRequests - RFA)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'promotion-requests'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Vote size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Pedidos de Promoção (RFA)</span>
                  <span className="text-[8px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono font-bold px-1 rounded-xs">
                    VOTAÇÃO
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('arbitration')}
              title="Conselho de Arbitragem (Special:Arbitration - Julgamento de Usuários, Moderadores e Administradores)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'arbitration'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Gavel size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate font-semibold">Conselho de Arbitragem</span>
                  <span className="text-[8px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono font-bold px-1 rounded-xs">
                    ARBCOM
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('contact-admin')}
              title="Fale com a Administração (Special:ContactAdmin - Denúncias e Suporte)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'contact-admin'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Falar com Administração</span>
                  <span className="text-[8px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold px-1 rounded-xs">
                    OFICIAL
                  </span>
                </div>
              )}
            </button>

            <button
              id="btn-sidebar-ucoc"
              onClick={() => onNavigate('ucoc')}
              title="Universal Code of Conduct - UCoC (Special:UCoC - Denúncias Formais e Conformidade)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'ucoc'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate font-semibold">Código de Conduta (UCoC)</span>
                  <span className="text-[8px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold px-1 rounded-xs">
                    FORMAL
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('emergency-contact')}
              title="Contato de Emergência em Casos Extremos (Special:EmergencyContact - Plantão e Risco Crítico)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'emergency-contact'
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800 shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/40'
              }`}
            >
              <AlertOctagon size={15} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate font-semibold text-rose-700 dark:text-rose-300">Contato de Emergência</span>
                  <span className="text-[8px] bg-red-600 text-white font-mono font-bold px-1 rounded-xs">
                    URGENTE
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('admin-firebase')}
              title="Administração do Firebase: Backups Automáticos (Blaze), Banco Firestore e Console de Configurações"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'admin-firebase'
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Database size={15} className="text-amber-500 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Firebase & Backups</span>
                  <span className="text-[8px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-mono font-bold px-1 rounded-xs">
                    BLAZE
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('vpn-checker')}
              title="Verificador de VPN e Bloqueio de IP: Auditoria em tempo real e diagnóstico de rede"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'vpn-checker'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert size={15} className="text-blue-500 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Verificador de VPN</span>
                  <span className="text-[8px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold px-1 rounded-xs">
                    IP SEC
                  </span>
                </div>
              )}
            </button>
          </nav>
        </div>

        {/* Section: Inteligência Artificial (Google Gemini AI Studio) */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <Sparkles size={11} />
                <span>IA Gemini Studio</span>
              </span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={onOpenGeminiChatbot}
              title="Abrir Chatbot Assistente Gemini"
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 cursor-pointer"
            >
              <Sparkles size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Assistente Gemini</span>}
            </button>

            <button
              onClick={onOpenGeminiNotebook}
              title="Abrir Gemini Notebook - Síntese e Inserção de Artigos"
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 cursor-pointer"
            >
              <BookOpen size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Gemini Notebook</span>}
            </button>

            <button
              onClick={onOpenGeminiPremium}
              title="Conhecer Plano Gemini Premium"
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-medium cursor-pointer"
            >
              <Crown size={15} className="text-amber-500 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Gemini Premium</span>}
            </button>
          </nav>
        </div>

        {/* Section: WikiWorldWeb Institutional & LGPD */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>{t('sidebar.legal_lgpd')}</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('security')}
              title={t('sidebar.security')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'security'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Shield size={15} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.security')}</span>}
            </button>

            <button
              onClick={() => onNavigate('donation')}
              title={t('sidebar.donations')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'donation'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Heart size={15} className="text-rose-500 dark:text-rose-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.donations')}</span>}
            </button>

            <button
              onClick={() => onNavigate('privacy')}
              title={t('sidebar.privacy')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'privacy'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Lock size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.privacy')}</span>}
            </button>

            <button
              id="btn-sidebar-editing-ethics"
              onClick={() => onNavigate('editing-ethics')}
              title="Regras de Ética de Edição e Privacidade (LGPD & GDPR)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'editing-ethics'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Scale size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Ética de Edição</span>
                  <span className="text-[8px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold px-1 rounded-xs">
                    LGPD/GDPR
                  </span>
                </div>
              )}
            </button>

            <a
              href="/Irregularidades%20da%20Wikip%C3%A9dia%20e%20Wikimedia%20Foundation.pdf"
              download="Irregularidades da Wikipédia e Wikimedia Foundation.pdf"
              title="Dossiê Oficial em PDF: Irregularidades da Wikipédia e Wikimedia Foundation (Violações da LGPD, GDPR e Marco Civil)"
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <FileText size={15} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Dossiê Violações</span>
                  <span className="text-[8px] bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-mono font-bold px-1 rounded-xs">
                    PDF
                  </span>
                </div>
              )}
            </a>

            <a
              href="/Cal%C3%BAnia%20por%20parte%20de%20Chronus%20V2.pdf"
              download="Calúnia por parte de Chronus V2.pdf"
              title="Dossiê Jurídico Oficial em PDF: Calúnia por parte de Chronus V2 (Arts. 138-140 CP, Stalking e Violações do UCOC da Wikipédia)"
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <Scale size={15} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Dossiê Chronus V2</span>
                  <span className="text-[8px] bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-mono font-bold px-1 rounded-xs">
                    47P
                  </span>
                </div>
              )}
            </a>

            <button
              onClick={() => onNavigate('terms')}
              title={t('sidebar.terms')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'terms'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileText size={15} className="text-slate-600 dark:text-slate-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.terms')}</span>}
            </button>

            <button
              onClick={() => onNavigate('mydata')}
              title={t('sidebar.my_data')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'mydata'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <UserCheck size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.my_data')}</span>}
            </button>

            <a
              href={formatExternalUrl("https://support.wazzimagiygg.com/")}
              target="_blank"
              rel="noopener noreferrer"
              title="Central de Suporte e Abertura de Tickets WazzimaGiygg: https://support.wazzimagiygg.com/"
              className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 font-semibold transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LifeBuoy size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Suporte & Tickets</span>}
              </div>
              {!isCollapsed && <ExternalLink size={11} className="text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-200 flex-shrink-0 ml-1" />}
            </a>
          </nav>
        </div>

        {/* Section: Modos */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>{t('sidebar.layouts')}</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('beta')}
              title={t('sidebar.beta_mode')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'beta'
                  ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.beta_mode')}</span>}
            </button>

            <button
              onClick={() => onNavigate('offline')}
              title={t('sidebar.offline_mode')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'offline'
                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <WifiOff size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.offline_mode')}</span>}
            </button>

            {onOpenLanguagesModal && (
              <button
                onClick={onOpenLanguagesModal}
                title={t('header.change_language')}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
              >
                <Globe2 size={15} className="text-blue-500 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate flex items-center gap-1">
                    <span>{currentLanguage.flag}</span>
                    <span>{currentLanguage.nativeName}</span>
                  </span>
                )}
              </button>
            )}

            {!isCollapsed && (
              <div className="pt-2 space-y-1.5">
                <PWAInstallPrompt buttonStyle="full" />

                <button
                  onClick={() => {
                    if (onOpenSmartTVModal) {
                      onOpenSmartTVModal();
                    } else {
                      onNavigate('smart-tv');
                    }
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                  title="Disponibilidade para Smart TVs (Samsung Tizen, LG webOS, Android TV, Fire TV)"
                >
                  <div className="flex items-center gap-2">
                    <Tv size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>App Smart TV</span>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold">
                    10-Foot
                  </span>
                </button>

                {/* Link to Dedicated Centralized Appearance Page */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => onNavigate('appearance')}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition group shadow-2xs"
                    title="Mudar temas visuais, contraste e tipografia de forma centralizada"
                  >
                    <div className="flex items-center gap-2">
                      <Palette size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
                      <span>Aparência & Temas</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold uppercase text-slate-500">
                      {theme}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* High Density Sidebar Footer Stats */}
      {!isCollapsed && (
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-1">
          <div className="flex justify-between items-center">
            <span>{t('sidebar.stats_collections')}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t('sidebar.stats_articles')}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalArticles}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 text-center">
            GNU GPL v3.0 • LGPD
          </div>
          <div
            className="pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[10px] text-blue-700 dark:text-blue-300 font-serif italic text-center leading-tight tracking-wide"
            title="Frase Principal da Wiki: 'Não, o Tempo não é o senhor do conhecimento!'"
          >
            «Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»
          </div>
        </div>
      )}
    </aside>
  );
};
