import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  FilePlus,
  Edit,
  FolderPlus,
  BookOpen,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowRight,
  Code2,
  Calendar,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  FileText,
  Eye,
  Plus
} from 'lucide-react';
import { WikiArticle, WikiPage, RecentChangeEntry, UserProfile } from '../types';
import { StorageService } from '../services/storageService';
import { useLanguage } from '../context/LanguageContext';
import { ALL_LANGUAGES } from '../utils/languages';

interface RecentChangesProps {
  articles: WikiArticle[];
  pages: WikiPage[];
  currentUser: UserProfile | null;
  onSelectArticle: (articleId: string) => void;
  onSelectPage: (pageUid: string) => void;
  onOpenEditorForEdit: (article: WikiArticle) => void;
  onOpenNewEditor: (defaultUid?: string) => void;
  onCreatePageClick: () => void;
  onNavigateToUser?: (identifier: string) => void;
}

export const RecentChanges: React.FC<RecentChangesProps> = ({
  articles,
  pages,
  currentUser,
  onSelectArticle,
  onSelectPage,
  onOpenEditorForEdit,
  onOpenNewEditor,
  onCreatePageClick,
  onNavigateToUser,
}) => {
  const { currentLanguage, t } = useLanguage();

  const [changes, setChanges] = useState<RecentChangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all'); // all, new_article, edit_article, minor_edit, new_collection
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all'); // 24h, 7d, 30d, all
  const [selectedPageUid, setSelectedPageUid] = useState<string>('all');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [hideMinor, setHideMinor] = useState(false);
  const [hideBots, setHideBots] = useState(false);
  const [itemsLimit, setItemsLimit] = useState<number>(50);
  const [showLegend, setShowLegend] = useState(false);

  // Diff Modal State
  const [diffModalItem, setDiffModalItem] = useState<RecentChangeEntry | null>(null);

  // Load changes
  const loadRecentChanges = async () => {
    setLoading(true);
    try {
      const data = await StorageService.getRecentChanges();
      setChanges(data);
    } catch (err) {
      console.warn('Error loading recent changes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentChanges();
    const unsub = StorageService.subscribeToRecentChanges((liveChanges) => {
      if (liveChanges && liveChanges.length > 0) {
        setChanges((prev) => {
          const map = new Map<string, RecentChangeEntry>();
          liveChanges.forEach((c) => map.set(c.id, c));
          prev.forEach((c) => {
            if (!map.has(c.id)) map.set(c.id, c);
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
          );
        });
      }
    });
    return () => unsub();
  }, [articles, pages]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRecentChanges();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Filtered Changes
  const filteredChanges = useMemo(() => {
    const now = new Date().getTime();
    const safeChanges = Array.isArray(changes) ? changes : [];

    return safeChanges.filter((item) => {
      if (!item) return false;
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.articleTitle || '').toLowerCase().includes(q);
        const matchAuthor = (item.autor || '').toLowerCase().includes(q);
        const matchSummary = (item.resumo || '').toLowerCase().includes(q);
        const matchPage = (item.pageTitle || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchSummary && !matchPage) return false;
      }

      // 2. Type Filter
      if (selectedType !== 'all') {
        if (selectedType === 'new_article' && item.type !== 'new_article') return false;
        if (selectedType === 'edit_article' && item.type !== 'edit_article' && item.type !== 'minor_edit') return false;
        if (selectedType === 'minor_edit' && !item.isMinor) return false;
        if (selectedType === 'new_collection' && item.type !== 'new_collection') return false;
      }

      // 3. Time Range Filter
      if (selectedTimeRange !== 'all') {
        const itemTime = new Date(item.data).getTime();
        const diffHours = (now - itemTime) / (1000 * 60 * 60);

        if (selectedTimeRange === '24h' && diffHours > 24) return false;
        if (selectedTimeRange === '7d' && diffHours > 24 * 7) return false;
        if (selectedTimeRange === '30d' && diffHours > 24 * 30) return false;
      }

      // 4. Page/Collection Filter
      if (selectedPageUid !== 'all' && item.pageUid !== selectedPageUid) {
        return false;
      }

      // 5. Language Filter
      if (selectedLang !== 'all' && item.idioma && item.idioma.toLowerCase() !== selectedLang.toLowerCase()) {
        return false;
      }

      // 6. Minor / Bot toggles
      if (hideMinor && item.isMinor) return false;
      if (hideBots && item.isBot) return false;

      return true;
    }).slice(0, itemsLimit);
  }, [changes, searchQuery, selectedType, selectedTimeRange, selectedPageUid, selectedLang, hideMinor, hideBots, itemsLimit]);

  // Statistics
  const stats = useMemo(() => {
    const safeChangesList = Array.isArray(changes) ? changes : [];
    const total = safeChangesList.length;
    const newArticles = safeChangesList.filter((c) => c?.type === 'new_article').length;
    const uniqueAuthors = new Set(safeChangesList.map((c) => (c?.autor || '').toLowerCase())).size;
    const netBytes = safeChangesList.reduce((acc, c) => acc + (c?.deltaBytes || 0), 0);

    return {
      total,
      newArticles,
      uniqueAuthors,
      netBytes,
    };
  }, [changes]);

  // Group items by day
  const groupedChanges = useMemo(() => {
    const groups: { [key: string]: RecentChangeEntry[] } = {};
    const todayStr = new Date().toLocaleDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString();

    filteredChanges.forEach((item) => {
      const itemDate = new Date(item.data);
      const itemDateStr = itemDate.toLocaleDateString();

      let groupLabel: string;
      if (itemDateStr === todayStr) {
        groupLabel = t('recent_changes.group_today');
      } else if (itemDateStr === yesterdayStr) {
        groupLabel = t('recent_changes.group_yesterday');
      } else {
        groupLabel = itemDate.toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }

      if (!groups[groupLabel]) {
        groups[groupLabel] = [];
      }
      groups[groupLabel].push(item);
    });

    return groups;
  }, [filteredChanges, t]);

  // Find related article for an item
  const findArticle = (articleId?: string, title?: string) => {
    if (articleId) {
      const found = articles.find((a) => a.id === articleId);
      if (found) return found;
    }
    if (title) {
      return articles.find((a) => a.titulo.toLowerCase() === title.toLowerCase());
    }
    return undefined;
  };

  const formatDeltaBytes = (bytes: number) => {
    if (bytes > 0) {
      return <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[11px]">+{bytes}</span>;
    }
    if (bytes < 0) {
      return <span className="text-rose-600 dark:text-rose-400 font-bold font-mono text-[11px]">{bytes}</span>;
    }
    return <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">0</span>;
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const getLanguageFlag = (langCodeOrName?: string) => {
    if (!langCodeOrName) return '🌐';
    const found = ALL_LANGUAGES.find(
      (l) =>
        l.code.toLowerCase() === langCodeOrName.toLowerCase() ||
        l.name.toLowerCase() === langCodeOrName.toLowerCase() ||
        l.nativeName.toLowerCase() === langCodeOrName.toLowerCase()
    );
    return found ? found.flag : '🌐';
  };

  return (
    <div className="space-y-6 animate-fadeIn select-text pb-12">
      {/* 1. Breadcrumbs & Header Title */}
      <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
              <span>WikiWorldWeb</span>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                <History size={13} />
                Especial:MudançasRecentes
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>{t('recent_changes.title')}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-sans font-normal px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Feed ao vivo
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {t('recent_changes.subtitle')}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewEditor()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition shadow-xs"
            >
              <Plus size={14} />
              <span>Escrever Artigo</span>
            </button>
            <button
              onClick={onCreatePageClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              <FolderPlus size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Nova Coleção</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title={t('recent_changes.refresh')}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded border border-slate-200/70 dark:border-slate-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t('recent_changes.stat_total_edits')}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
              {stats.total}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded border border-slate-200/70 dark:border-slate-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t('recent_changes.stat_new_articles')}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
              {stats.newArticles}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded border border-slate-200/70 dark:border-slate-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {t('recent_changes.stat_active_editors')}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-indigo-700 dark:text-indigo-300 mt-0.5">
              {stats.uniqueAuthors}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded border border-slate-200/70 dark:border-slate-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t('recent_changes.stat_bytes_delta')}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
              {stats.netBytes >= 0 ? `+${(stats.netBytes / 1024).toFixed(1)} KB` : `${(stats.netBytes / 1024).toFixed(1)} KB`}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MediaWiki Filter & Control Console */}
      <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs space-y-3 transition-colors">
        {/* Row 1: Search & Quick Type Selector */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('recent_changes.filter_search_placeholder')}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Time range buttons */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono mr-1 hidden sm:inline">
              {t('recent_changes.filter_time')}
            </span>
            {(['24h', '7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                  selectedTimeRange === range
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {range === '24h' ? '24 horas' : range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : 'Todas'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Filters & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Change Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">Tipo:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">{t('recent_changes.filter_all')}</option>
              <option value="new_article">{t('recent_changes.filter_new')}</option>
              <option value="edit_article">{t('recent_changes.filter_edits')}</option>
              <option value="minor_edit">{t('recent_changes.filter_minor')}</option>
              <option value="new_collection">{t('recent_changes.filter_collections')}</option>
            </select>
          </div>

          {/* Collection Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">Coleção:</span>
            <select
              value={selectedPageUid}
              onChange={(e) => setSelectedPageUid(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden max-w-[160px] truncate"
            >
              <option value="all">{t('recent_changes.filter_collection_select')}</option>
              {pages.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.icon || '📁'} {p.titulo}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">Idioma:</span>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">{t('recent_changes.filter_language_select')}</option>
              <option value="pt">🇧🇷 Português</option>
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="it">🇮🇹 Italiano</option>
            </select>
          </div>

          {/* Checkboxes: Hide Minor / Hide Bots */}
          <div className="flex items-center gap-3 ml-auto">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hideMinor}
                onChange={(e) => setHideMinor(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{t('recent_changes.filter_hide_minor')}</span>
            </label>

            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hideBots}
                onChange={(e) => setHideBots(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{t('recent_changes.filter_hide_bots')}</span>
            </label>

            <button
              onClick={() => setShowLegend(!showLegend)}
              className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <Info size={12} />
              <span>{showLegend ? 'Ocultar legenda' : 'Ver legenda'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible MediaWiki Legend */}
        {showLegend && (
          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 animate-fadeIn">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
              <Info size={13} className="text-blue-600" />
              <span>{t('recent_changes.legend_title')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  N
                </span>
                <span>{t('recent_changes.legend_new')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  m
                </span>
                <span>{t('recent_changes.legend_minor')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  C
                </span>
                <span>Nova coleção temática criada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  +120
                </span>
                <span>{t('recent_changes.legend_bytes')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Recent Changes Feed Table */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
            <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Carregando feed de alterações...</p>
          </div>
        ) : Object.keys(groupedChanges).length === 0 ? (
          <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center space-y-3">
            <History size={32} className="text-slate-300 dark:text-slate-700 mx-auto" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('recent_changes.empty_results')}
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tente redefinir os filtros de busca ou tempo para visualizar outras alterações registradas.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedTimeRange('all');
                setSelectedPageUid('all');
                setSelectedLang('all');
                setHideMinor(false);
                setHideBots(false);
              }}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium transition"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          (Object.entries(groupedChanges) as [string, RecentChangeEntry[]][]).map(([groupTitle, items]) => (
            <div key={groupTitle} className="space-y-2">
              {/* Group Date Header */}
              <div className="flex items-center gap-2 px-1">
                <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono">
                  {groupTitle}
                </h2>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  ({items.length} {items.length === 1 ? 'alteração' : 'alterações'})
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
              </div>

              {/* Items List */}
              <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs overflow-hidden">
                {items.map((item) => {
                  const relatedArticle = findArticle(item.articleId, item.articleTitle);

                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:px-4 sm:py-3 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors text-xs space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-800 dark:text-slate-200">
                        {/* 1. Flag Type Badge */}
                        {item.type === 'new_article' && (
                          <span
                            title="Novo artigo criado"
                            className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          >
                            N
                          </span>
                        )}
                        {item.type === 'new_collection' && (
                          <span
                            title="Nova coleção criada"
                            className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          >
                            C
                          </span>
                        )}
                        {item.isMinor && (
                          <span
                            title="Edição menor"
                            className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          >
                            m
                          </span>
                        )}
                        {item.isBot && (
                          <span
                            title="Edição por Bot"
                            className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            b
                          </span>
                        )}

                        {/* 2. Action Links: (diff | hist | ver) */}
                        <span className="text-slate-400 font-mono text-[11px] inline-flex items-center gap-1">
                          <span>(</span>
                          <button
                            onClick={() => setDiffModalItem(item)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            title="Visualizar detalhes / diff desta edição"
                          >
                            {t('recent_changes.diff_btn')}
                          </button>
                          <span>|</span>
                          {relatedArticle ? (
                            <button
                              onClick={() => onSelectArticle(relatedArticle.id)}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                              title="Ver histórico e ler artigo"
                            >
                              {t('recent_changes.hist_btn')}
                            </button>
                          ) : (
                            <span className="text-slate-400">{t('recent_changes.hist_btn')}</span>
                          )}
                          <span>)</span>
                        </span>

                        {/* 3. Delta Bytes */}
                        {formatDeltaBytes(item.deltaBytes)}

                        {/* 4. Timestamp */}
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] flex items-center gap-0.5">
                          <Clock size={11} />
                          {formatTime(item.data)}
                        </span>

                        {/* 5. Language Flag */}
                        <span title={`Idioma: ${item.idioma || 'pt'}`} className="text-xs">
                          {getLanguageFlag(item.idioma)}
                        </span>

                        {/* 6. Title with link */}
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                          {item.type === 'new_collection' ? (
                            <button
                              onClick={() => onSelectPage(item.pageUid)}
                              className="text-purple-600 dark:text-purple-400 hover:underline text-left"
                            >
                              {item.articleTitle}
                            </button>
                          ) : relatedArticle ? (
                            <button
                              onClick={() => onSelectArticle(relatedArticle.id)}
                              className="text-blue-700 dark:text-blue-300 hover:underline text-left"
                            >
                              {item.articleTitle}
                            </button>
                          ) : (
                            <span>{item.articleTitle}</span>
                          )}
                        </div>

                        {/* 7. Collection Badge */}
                        {item.pageTitle && (
                          <button
                            onClick={() => onSelectPage(item.pageUid)}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          >
                            {item.pageTitle}
                          </button>
                        )}

                        {/* 8. User / Author */}
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1 ml-auto">
                          <User size={11} className="text-blue-500" />
                          {onNavigateToUser ? (
                            <button
                              type="button"
                              onClick={() => onNavigateToUser(item.autor)}
                              className="font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer transition text-left"
                              title={`Ver página de usuário de ${item.autor}`}
                            >
                              {item.autor}
                            </button>
                          ) : (
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {item.autor}
                            </span>
                          )}
                        </div>

                        {/* Quick Edit shortcut if article exists */}
                        {relatedArticle && (
                          <button
                            onClick={() => onOpenEditorForEdit(relatedArticle)}
                            title="Editar no WikitextEditor"
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded transition"
                          >
                            <Edit size={12} />
                          </button>
                        )}
                      </div>

                      {/* Summary text / Modification comment */}
                      <div className="text-slate-600 dark:text-slate-300 text-[11px] italic pl-6 flex items-baseline gap-1.5">
                        <span className="text-slate-400 dark:text-slate-500">↳</span>
                        <span>
                          {item.resumo ? `(${item.resumo})` : '— Sem sumário de edição informado'}
                        </span>
                        {item.versao && (
                          <span className="font-mono text-[10px] text-slate-400 not-italic">
                            [v.{item.versao}]
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Diff / Inspection Modal */}
      {diffModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-lg max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Inspeção de Alteração MediaWiki
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{diffModalItem.articleTitle}</span>
                  {diffModalItem.versao && (
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Versão {diffModalItem.versao}
                    </span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setDiffModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded border border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">AUTOR / EDITOR</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{diffModalItem.autor}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">DATA & HORA</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {new Date(diffModalItem.data).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">TAMANHO / DELTA</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {diffModalItem.tamanho} bytes ({diffModalItem.deltaBytes >= 0 ? `+${diffModalItem.deltaBytes}` : diffModalItem.deltaBytes})
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1 text-xs">
              <span className="font-mono font-bold text-slate-500 uppercase text-[10px]">Sumário da Edição:</span>
              <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic">
                "{diffModalItem.resumo || 'Criação ou edição de conteúdo enciclopédico.'}"
              </div>
            </div>

            {/* Article Actions */}
            {(() => {
              const related = findArticle(diffModalItem.articleId, diffModalItem.articleTitle);
              return (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  {related && (
                    <>
                      <button
                        onClick={() => {
                          onSelectArticle(related.id);
                          setDiffModalItem(null);
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition flex items-center gap-1.5"
                      >
                        <Eye size={13} />
                        <span>Visualizar Artigo</span>
                      </button>
                      <button
                        onClick={() => {
                          onOpenEditorForEdit(related);
                          setDiffModalItem(null);
                        }}
                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium transition flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
                      >
                        <Edit size={13} />
                        <span>Editar Artigo</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setDiffModalItem(null)}
                    className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium transition"
                  >
                    Fechar
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
