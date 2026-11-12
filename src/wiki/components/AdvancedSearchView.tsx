import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Filter,
  ArrowRight,
  BookOpen,
  Calendar,
  Tag,
  Folder,
  Eye,
  FileText,
  Sparkles,
  PlusCircle,
  X,
  Clock,
  ArrowUpDown,
  Check,
  RotateCcw,
  List,
  LayoutGrid,
  FileQuestion,
} from 'lucide-react';
import { WikiArticle, WikiPage, UserProfile, AppTheme } from '../types';
import { getCleanExcerpt } from '../utils/wikitextParser';

interface AdvancedSearchViewProps {
  articles: WikiArticle[];
  pages: WikiPage[];
  user: UserProfile | null;
  initialQuery?: string;
  theme?: AppTheme;
  onSearchQueryChange?: (query: string) => void;
  onSelectArticle: (articleId: string) => void;
  onSelectPage: (pageUid: string) => void;
  onOpenNewEditor: (title?: string) => void;
  onNavigateHome: () => void;
  onNavigateTo404?: (query: string) => void;
}

type SearchScope = 'all' | 'title' | 'content' | 'tags';
type SortOption = 'relevance' | 'newest' | 'oldest' | 'views' | 'title' | 'size';
type TimeRangeOption = 'all' | '7d' | '30d' | '365d';

export const AdvancedSearchView: React.FC<AdvancedSearchViewProps> = ({
  articles,
  pages,
  initialQuery = '',
  theme = 'light',
  onSearchQueryChange,
  onSelectArticle,
  onSelectPage,
  onOpenNewEditor,
  onNavigateHome,
  onNavigateTo404,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(true);
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPageUid, setSelectedPageUid] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

  // Histórico de pesquisas recentes
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wikizero_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sincroniza query inicial se alterar externamente
  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== searchTerm) {
      setSearchTerm(initialQuery);
    }
  }, [initialQuery]);

  // Salva no histórico quando busca
  const recordSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('wikizero_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('wikizero_search_history');
    } catch {}
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    recordSearch(searchTerm);
    if (onSearchQueryChange) {
      onSearchQueryChange(searchTerm);
    }
  };

  const handleTermClick = (term: string) => {
    setSearchTerm(term);
    recordSearch(term);
    if (onSearchQueryChange) {
      onSearchQueryChange(term);
    }
  };

  // Lista dinâmica de categorias e idiomas existentes nos artigos
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.categoria && a.categoria.trim()) set.add(a.categoria.trim());
      if (a.tags) {
        a.tags.forEach((t) => {
          if (t && t.trim()) set.add(t.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [articles]);

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.idioma && a.idioma.trim()) set.add(a.idioma.trim());
    });
    return Array.from(set).sort();
  }, [articles]);

  // Filtra e calcula pontuação de relevância
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const queryWords = term ? term.split(/\s+/).filter(Boolean) : [];

    const now = new Date().getTime();

    // Filtra primeiro por critérios fixos (categoria, coleção, idioma, tempo)
    const candidates = (articles || []).filter((article) => {
      if (!article) return false;
      // Categoria
      if (selectedCategory !== 'all') {
        const matchesCategory =
          article.categoria?.toLowerCase() === selectedCategory.toLowerCase() ||
          article.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase());
        if (!matchesCategory) return false;
      }

      // Coleção / Page UID
      if (selectedPageUid !== 'all' && article.pageUid !== selectedPageUid) {
        return false;
      }

      // Idioma
      if (selectedLanguage !== 'all' && article.idioma && article.idioma !== selectedLanguage) {
        return false;
      }

      // Período de tempo
      if (timeRange !== 'all') {
        const artDate = new Date(article.dataCriacao || article.dataEdicao || '').getTime();
        if (!isNaN(artDate)) {
          const diffDays = (now - artDate) / (1000 * 60 * 60 * 24);
          if (timeRange === '7d' && diffDays > 7) return false;
          if (timeRange === '30d' && diffDays > 30) return false;
          if (timeRange === '365d' && diffDays > 365) return false;
        }
      }

      // Se não há termo de busca, passa se atender aos filtros
      if (!term) return true;

      const titleLower = (article.titulo || '').toLowerCase();
      const contentLower = (article.descricao || '').toLowerCase();
      const summaryLower = (article.resumo || '').toLowerCase();
      const tagsLower = (article.tags || []).map((t) => t.toLowerCase()).join(' ');

      // Filtra de acordo com o escopo
      if (searchScope === 'title') {
        return queryWords.every((w) => titleLower.includes(w));
      }
      if (searchScope === 'content') {
        return queryWords.every((w) => contentLower.includes(w) || summaryLower.includes(w));
      }
      if (searchScope === 'tags') {
        return (
          (article.categoria && article.categoria.toLowerCase().includes(term)) ||
          tagsLower.includes(term)
        );
      }

      // 'all'
      return queryWords.every(
        (w) =>
          titleLower.includes(w) ||
          contentLower.includes(w) ||
          summaryLower.includes(w) ||
          tagsLower.includes(w) ||
          (article.categoria && article.categoria.toLowerCase().includes(w))
      );
    });

    // Calcula relevância e métricas
    const scored = candidates.map((article) => {
      let score = 0;
      const titleLower = (article.titulo || '').toLowerCase();
      const contentLower = (article.descricao || '').toLowerCase();
      const summaryLower = (article.resumo || '').toLowerCase();
      const tagsLower = (article.tags || []).map((t) => t.toLowerCase());

      if (term) {
        // Correspondência exata no título
        if (titleLower === term) score += 200;
        else if (titleLower.startsWith(term)) score += 100;
        else if (titleLower.includes(term)) score += 60;

        // Palavras no título
        queryWords.forEach((w) => {
          if (titleLower.includes(w)) score += 30;
          if (tagsLower.some((t) => t.includes(w))) score += 20;
          if (summaryLower.includes(w)) score += 15;
          if (contentLower.includes(w)) score += 5;
        });

        // Boost para artigos mais visualizados
        score += Math.min((article.visualizacoes || 0) * 0.1, 25);
      } else {
        score = article.visualizacoes || 0;
      }

      return { article, score };
    });

    // Ordenação
    scored.sort((a, b) => {
      if (sortBy === 'relevance') {
        return b.score - a.score;
      }
      if (sortBy === 'newest') {
        const dateA = new Date(a.article.dataCriacao || '').getTime() || 0;
        const dateB = new Date(b.article.dataCriacao || '').getTime() || 0;
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.article.dataCriacao || '').getTime() || 0;
        const dateB = new Date(b.article.dataCriacao || '').getTime() || 0;
        return dateA - dateB;
      }
      if (sortBy === 'views') {
        return (b.article.visualizacoes || 0) - (a.article.visualizacoes || 0);
      }
      if (sortBy === 'title') {
        return (a.article.titulo || '').localeCompare(b.article.titulo || '');
      }
      if (sortBy === 'size') {
        return (b.article.descricao?.length || 0) - (a.article.descricao?.length || 0);
      }
      return 0;
    });

    return scored.map((s) => s.article);
  }, [
    articles,
    searchTerm,
    searchScope,
    selectedCategory,
    selectedPageUid,
    selectedLanguage,
    timeRange,
    sortBy,
  ]);

  // Função auxiliar para destacar termos de pesquisa
  const renderHighlightedText = (text: string, maxLen?: number) => {
    if (!text) return '';
    let displayText = maxLen ? getCleanExcerpt(text, maxLen) : text;
    if (!searchTerm.trim()) return <span>{displayText}</span>;

    const words = searchTerm
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (words.length === 0) return <span>{displayText}</span>;

    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = displayText.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-amber-200 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 font-semibold px-0.5 rounded-xs"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const hasActiveFilters =
    searchScope !== 'all' ||
    selectedCategory !== 'all' ||
    selectedPageUid !== 'all' ||
    selectedLanguage !== 'all' ||
    timeRange !== 'all' ||
    sortBy !== 'relevance';

  const handleResetFilters = () => {
    setSearchScope('all');
    setSelectedCategory('all');
    setSelectedPageUid('all');
    setSelectedLanguage('all');
    setTimeRange('all');
    setSortBy('relevance');
  };

  const isStardew = theme === 'stardew';
  const isGenshin = theme === 'genshin';
  const isWin1 = theme === 'win1';
  const isWin95 = theme === 'win95';
  const isWinXP = theme === 'winxp';
  const isAndroid = theme === 'android15';
  const isRepo = theme === 'repo';
  const isNokia = theme === 'nokia3310';

  return (
    <div className="space-y-6">
      {/* 1. Header da Página de Busca Avançada */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isWin1
            ? 'bg-white border-2 border-black !rounded-none text-black font-mono shadow-none'
            : isWin95
            ? 'win95-window'
            : isWinXP
            ? 'winxp-window'
            : isNokia
            ? 'bg-[#b7cc98] border-2 border-[#1f281b] text-[#1f281b] !rounded-none shadow-[3px_3px_0px_#1f281b] font-mono'
            : isGenshin
            ? 'bg-[#151a2d] border-[#d3bc8e]/40 text-[#f2dfb7]'
            : isStardew
            ? 'stardew-box bg-[#fffaf0]'
            : isRepo
            ? 'repo-box bg-[#090d14] border-2 border-[#f59e0b]/60 text-slate-100 font-mono shadow-[0_0_15px_rgba(245,158,11,0.15)]'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`p-2 rounded-xl flex items-center justify-center ${
                  isWin95
                    ? 'win95-sunken bg-white text-black'
                    : isNokia
                    ? 'bg-[#1f281b] text-[#c2d6a4] !rounded-none shadow-[1px_1px_0px_#1f281b]'
                    : isGenshin
                    ? 'bg-[#212946] text-[#e0c48e]'
                    : isStardew
                    ? 'bg-[#5c3716] text-[#ffd54f]'
                    : isRepo
                    ? 'bg-[#151c28] text-[#f59e0b] border border-[#f59e0b]/50'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                }`}
              >
                <Search size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <span>Busca Avançada de Artigos</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Especial:Busca
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pesquise no acervo da enciclopédia por termos, texto integral, coleções temáticas, tags e metadados.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>{showFilters ? 'Ocultar Filtros' : 'Filtros Avançados'}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block ml-0.5" />
              )}
            </button>

            <button
              onClick={() => onOpenNewEditor(searchTerm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Novo Artigo</span>
            </button>
          </div>
        </div>

        {/* Formulário Principal de Pesquisa */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (onSearchQueryChange) onSearchQueryChange(e.target.value);
              }}
              placeholder="Digite o título do artigo, palavra-chave, tópico ou conceito..."
              className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isWin95
                  ? 'win95-sunken bg-white text-black font-mono'
                  : isGenshin
                  ? 'bg-[#101423] border-[#d3bc8e]/50 text-[#f2dfb7] placeholder:text-[#a0947d]'
                  : isStardew
                  ? 'bg-[#fffdf7] border-[#6b401b] text-[#3e2613] placeholder:text-[#8a6843]'
                  : isRepo
                  ? 'bg-[#06080e] border-2 border-[#f59e0b]/80 text-[#22d3ee] placeholder:text-[#22d3ee]/40 font-mono focus:border-[#22d3ee]'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400'
              }`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  if (onSearchQueryChange) onSearchQueryChange('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Limpar campo"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shrink-0 ${
              isWin95
                ? 'win95-button'
                : isGenshin
                ? 'genshin-gold-btn text-black'
                : isStardew
                ? 'stardew-btn'
                : isRepo
                ? 'repo-btn px-6'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            <Search size={16} />
            <span>Buscar</span>
          </button>
        </form>

        {/* Histórico Recente e Sugestões */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Sparkles size={13} className="text-amber-500" />
            Sugestões populares:
          </span>
          {['Inteligência Artificial', 'Wikipédia', 'Brasil', 'Ciência', 'História', 'Tecnologia'].map(
            (popular) => (
              <button
                key={popular}
                type="button"
                onClick={() => handleTermClick(popular)}
                className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700/60 transition cursor-pointer"
              >
                {popular}
              </button>
            )
          )}

          {recentSearches.length > 0 && (
            <div className="w-full flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Clock size={12} />
                Pesquisas recentes:
              </span>
              {recentSearches.map((hist) => (
                <button
                  key={hist}
                  type="button"
                  onClick={() => handleTermClick(hist)}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  {hist}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[10px] text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer"
              >
                Limpar histórico
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Painel de Filtros Avançados */}
      {showFilters && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isWin95
              ? 'win95-window'
              : isGenshin
              ? 'bg-[#161c32] border-[#d3bc8e]/40 text-[#f2dfb7]'
              : isStardew
              ? 'stardew-box bg-[#fef9ee]'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold tracking-tight">Parâmetros de Refinamento</h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw size={12} />
                <span>Restaurar filtros padrão</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-xs">
            {/* Escopo de Busca */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Onde pesquisar:
              </label>
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value as SearchScope)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Todo o artigo (título, texto e tags)</option>
                <option value="title">Apenas no título</option>
                <option value="content">Apenas no corpo do texto</option>
                <option value="tags">Apenas em tags e categorias</option>
              </select>
            </div>

            {/* Coleção / Namespace */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Coleção Temática:
              </label>
              <select
                value={selectedPageUid}
                onChange={(e) => setSelectedPageUid(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Todas as coleções ({pages.length})</option>
                {pages.map((p) => (
                  <option key={p.uid} value={p.uid}>
                    {p.titulo}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Categoria / Assunto:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Todas as categorias ({availableCategories.length})</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Idioma */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Idioma do Artigo:
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Todos os idiomas ({availableLanguages.length})</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Período / Data */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Data de Criação:
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Qualquer data</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="365d">Último ano</option>
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Ordenar Resultados por:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="relevance">Mais Relevantes (Relevância)</option>
                <option value="views">Mais Visualizados</option>
                <option value="newest">Mais Recentes</option>
                <option value="oldest">Mais Antigos</option>
                <option value="title">Ordem Alfabética (A-Z)</option>
                <option value="size">Tamanho do Artigo</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. Barra de Status dos Resultados & Modo de Visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            {searchResults.length} {searchResults.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
          </span>
          {searchTerm && (
            <span className="text-slate-500 dark:text-slate-400">
              para <span className="font-semibold text-blue-600 dark:text-blue-400">"{searchTerm}"</span>
            </span>
          )}
          <span className="text-slate-400 hidden md:inline">• Busca efetuada em 0.02s</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400">Exibir como:</span>
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              title="Modo Cartões"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              title="Modo Lista Enciclopédica"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Lista de Resultados */}
      {searchResults.length > 0 ? (
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((article) => {
              const page = pages.find((p) => p.uid === article.pageUid);
              return (
                <div
                  key={article.id}
                  onClick={() => onSelectArticle(article.id)}
                  className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                    isWin95
                      ? 'win95-window'
                      : isGenshin
                      ? 'bg-[#181e36] border-[#d3bc8e]/40 hover:border-[#d3bc8e] text-[#f2dfb7]'
                      : isStardew
                      ? 'stardew-box bg-[#fffdf8] hover:bg-[#fff7e6]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {page && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPage(page.uid);
                            }}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1"
                          >
                            <Folder size={10} />
                            {page.titulo}
                          </span>
                        )}
                        {article.categoria && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {article.categoria}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        {article.visualizacoes !== undefined && (
                          <span className="flex items-center gap-1" title="Visualizações">
                            <Eye size={11} />
                            {article.visualizacoes}
                          </span>
                        )}
                        <span>{(article.descricao?.length || 0).toLocaleString()} carac.</span>
                      </div>
                    </div>

                    {/* Título do Artigo com Highlight */}
                    <h3 className="font-serif-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1.5">
                      {renderHighlightedText(article.titulo)}
                    </h3>

                    {/* Trecho / Excerpt com Highlight */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-3">
                      {renderHighlightedText(article.resumo || article.descricao, 220)}
                    </p>
                  </div>

                  {/* Footer do Card */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(article.dataCriacao || '').toLocaleDateString('pt-BR')}
                      </span>
                      {article.autor && (
                        <span className="truncate max-w-[120px]">por {article.autor}</span>
                      )}
                    </div>

                    <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Ler verbete <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Modo Compacto / Enciclopédico */
          <div
            className={`rounded-xl border divide-y divide-slate-100 dark:divide-slate-800 ${
              isWin95
                ? 'win95-window'
                : isGenshin
                ? 'bg-[#181e36] border-[#d3bc8e]/40 divide-[#d3bc8e]/20'
                : isStardew
                ? 'stardew-box bg-[#fffdf8]'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            {searchResults.map((article, idx) => {
              const page = pages.find((p) => p.uid === article.pageUid);
              return (
                <div
                  key={article.id}
                  onClick={() => onSelectArticle(article.id)}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                      <h3 className="font-serif-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {renderHighlightedText(article.titulo)}
                      </h3>
                      {article.categoria && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {article.categoria}
                        </span>
                      )}
                      {page && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          [{page.titulo}]
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {renderHighlightedText(article.resumo || article.descricao, 160)}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 text-[11px] text-slate-400 gap-1">
                    <div className="flex items-center gap-2">
                      {article.visualizacoes !== undefined && (
                        <span className="flex items-center gap-1">
                          <Eye size={11} />
                          {article.visualizacoes}
                        </span>
                      )}
                      <span>{new Date(article.dataCriacao || '').toLocaleDateString('pt-BR')}</span>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 group-hover:underline">
                      Abrir <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Estado Vazio Enciclopédico */
        <div
          className={`p-10 rounded-2xl border text-center transition-all ${
            isWin95
              ? 'win95-window'
              : isGenshin
              ? 'bg-[#181e36] border-[#d3bc8e]/40 text-[#f2dfb7]'
              : isStardew
              ? 'stardew-box bg-[#fffdf8]'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Search size={28} />
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Nenhum artigo encontrado
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Não encontramos nenhum verbete que corresponda a{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              "{searchTerm || 'aos filtros selecionados'}"
            </span>
            . Você pode tentar usar palavras-chave mais gerais, verificar a ortografia ou criar o artigo agora mesmo!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {searchTerm && (
              <button
                onClick={() => onOpenNewEditor(searchTerm)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
              >
                <PlusCircle size={15} />
                <span>Criar o artigo "{searchTerm}"</span>
              </button>
            )}

            {searchTerm && onNavigateTo404 && (
              <button
                onClick={() => onNavigateTo404(searchTerm)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition cursor-pointer"
              >
                <FileQuestion size={14} />
                <span>Ver página 404 deste artigo</span>
              </button>
            )}

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Limpar todos os filtros</span>
            </button>

            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <BookOpen size={14} />
              <span>Voltar à Página Principal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
