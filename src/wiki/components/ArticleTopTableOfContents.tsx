import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Layers,
  Hash,
  ArrowDown,
  Compass,
} from 'lucide-react';
import { TocItem } from '../utils/wikitextParser';

export interface ArticleTopTableOfContentsProps {
  toc: TocItem[];
  wordCount?: number;
  onNavigateToSection: (id: string) => void;
  activeSectionId?: string;
  className?: string;
  themeMode?: 'standard' | 'reader';
  readerTheme?: 'sepia' | 'light' | 'dark' | 'black';
}

export const ArticleTopTableOfContents: React.FC<ArticleTopTableOfContentsProps> = ({
  toc,
  wordCount = 0,
  onNavigateToSection,
  activeSectionId,
  className = '',
  themeMode = 'standard',
  readerTheme = 'sepia',
}) => {
  // Criteria for long article: at least 2 headings AND either >= 200 words or >= 3 headings
  const isLongArticle = toc.length >= 3 || (wordCount >= 200 && toc.length >= 2);

  // If there are less than 2 headings, an index is generally unnecessary
  if (toc.length < 2) {
    return null;
  }

  // Collapsed state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('wikizero_top_toc_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterLevel, setFilterLevel] = useState<'all' | 'h2-only'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wikizero_top_toc_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Heading counts
  const h1Count = useMemo(() => toc.filter((item) => item.level === 1).length, [toc]);
  const h2Count = useMemo(() => toc.filter((item) => item.level === 2).length, [toc]);
  const h3Count = useMemo(() => toc.filter((item) => item.level === 3).length, [toc]);
  const h4Count = useMemo(() => toc.filter((item) => item.level >= 4).length, [toc]);

  // Filtered items
  const filteredToc = useMemo(() => {
    let items = toc;
    if (filterLevel === 'h2-only') {
      items = items.filter((item) => item.level <= 2);
    }
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.text.toLowerCase().includes(query) ||
          item.number.toLowerCase().includes(query)
      );
    }
    return items;
  }, [toc, filterLevel, searchFilter]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    onNavigateToSection(id);
  };

  // Determine styling based on standard vs reader mode
  const isReader = themeMode === 'reader';

  // Card container styling
  let containerClasses =
    'article-top-toc my-5 rounded-xl border transition-all duration-200 not-prose ';

  if (!isReader) {
    containerClasses +=
      'bg-slate-50/90 dark:bg-slate-900/80 border-slate-300 dark:border-slate-800 shadow-xs';
  } else {
    if (readerTheme === 'sepia') {
      containerClasses += 'bg-[#f4ebd0]/70 border-[#decba4] text-[#3e2f1f]';
    } else if (readerTheme === 'black') {
      containerClasses += 'bg-zinc-950 border-zinc-800 text-zinc-100';
    } else if (readerTheme === 'dark') {
      containerClasses += 'bg-slate-900/90 border-slate-800 text-slate-100';
    } else {
      containerClasses += 'bg-slate-50 border-slate-200 text-slate-900';
    }
  }

  return (
    <nav
      aria-label="Índice de Seções do Artigo"
      className={`${containerClasses} ${className}`}
    >
      {/* Table of Contents Header Bar */}
      <div className="flex items-center justify-between p-3.5 sm:px-4 sm:py-3 border-b border-current/10 gap-2 flex-wrap select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`p-1.5 rounded-lg shrink-0 ${
              isReader
                ? 'bg-current/10'
                : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <ListOrdered size={15} />
          </span>

          <div className="flex items-baseline gap-2 truncate">
            <h2 className="text-sm font-bold tracking-tight font-serif-heading">
              Índice
            </h2>
            <span className="text-[11px] font-mono opacity-70 hidden sm:inline truncate">
              {h1Count > 0 && `${h1Count} ${h1Count === 1 ? 'título' : 'títulos'} • `}
              {h2Count} {h2Count === 1 ? 'seção' : 'seções'}
              {h3Count > 0 && ` • ${h3Count} subseções`}
              {h4Count > 0 && ` • ${h4Count} tópicos`}
            </span>
          </div>

          {isLongArticle && (
            <span
              title="Gerado automaticamente para este artigo longo com múltiplos tópicos"
              className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 hidden md:inline-flex items-center gap-1"
            >
              <span>Auto</span>
            </span>
          )}
        </div>

        {/* Controls: Search Toggle, Level Filter, Collapse Button */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          {/* Quick Search Toggle (helpful for articles with 4+ sections) */}
          {toc.length >= 4 && !isCollapsed && (
            <button
              type="button"
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchFilter('');
              }}
              title={showSearch ? 'Fechar busca' : 'Filtrar seções do índice'}
              className={`p-1 rounded-md transition cursor-pointer ${
                showSearch
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <Search size={13} />
            </button>
          )}

          {/* Level Filter: All vs H2 only (if H3 exists and not collapsed) */}
          {h3Count > 0 && !isCollapsed && (
            <button
              type="button"
              onClick={() => setFilterLevel(filterLevel === 'all' ? 'h2-only' : 'all')}
              title={
                filterLevel === 'all'
                  ? 'Mostrar apenas cabeçalhos H2 principais'
                  : 'Mostrar todos os cabeçalhos (H2 e H3)'
              }
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition border cursor-pointer hidden sm:flex items-center gap-1 ${
                filterLevel === 'h2-only'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-current/20 hover:bg-black/5 dark:hover:bg-white/10 opacity-80'
              }`}
            >
              <Layers size={11} />
              <span>{filterLevel === 'all' ? 'H2 + H3' : 'Apenas H2'}</span>
            </button>
          )}

          {/* Expand / Collapse Button [ocultar] / [mostrar] */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? 'Expandir índice do artigo' : 'Ocultar índice do artigo'}
            className="px-2 py-0.5 rounded font-mono text-[11px] font-bold hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1 opacity-80 hover:opacity-100"
          >
            <span>[{isCollapsed ? 'mostrar' : 'ocultar'}]</span>
            {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {!isCollapsed && (
        <div className="p-3 sm:p-4 space-y-3">
          {/* Quick Filter Input Bar */}
          {showSearch && (
            <div className="relative animate-in fade-in slide-in-from-top-1">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar tópicos e seções por palavra-chave..."
                className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-current/20 bg-white/70 dark:bg-black/40 focus:outline-hidden focus:ring-1 focus:ring-blue-500/50"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Table of Contents Hierarchical List */}
          <ol className="space-y-1 text-xs list-none m-0 p-0">
            {filteredToc.map((item) => {
              const isActive = activeSectionId === item.id;
              const isH1 = item.level === 1;
              const isH2 = item.level === 2;
              const isH3 = item.level === 3;
              const isH4 = item.level >= 4;

              // Indentation level
              const indentClass = isH1
                ? 'pl-1 font-bold'
                : isH2
                ? 'pl-3 sm:pl-4 font-semibold'
                : isH3
                ? 'pl-6 sm:pl-8'
                : 'pl-9 sm:pl-10';

              return (
                <li
                  key={item.id}
                  className={`group relative flex items-baseline gap-2 py-1 px-2 rounded-lg transition-colors ${indentClass} ${
                    isActive
                      ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Section Number Badge (e.g. 1, 1.1, 2, 2.1) */}
                  <span
                    className={`font-mono shrink-0 select-none text-[11px] ${
                      isH2
                        ? 'font-bold text-slate-700 dark:text-slate-300'
                        : 'text-slate-500 dark:text-slate-400 text-[10px]'
                    } ${
                      isReader
                        ? 'text-current/75'
                        : ''
                    }`}
                  >
                    {item.number}
                  </span>

                  {/* Internal Navigation Link */}
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleLinkClick(e, item.id)}
                    title={`Navegar para a seção: ${item.text}`}
                    className={`hover:underline flex-1 truncate transition-colors ${
                      isH2
                        ? 'font-semibold text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300 font-normal'
                    } ${
                      isReader
                        ? 'text-current'
                        : ''
                    }`}
                  >
                    {item.text}
                  </a>

                  {/* Active Indicator or subtle anchor icon on hover */}
                  {isActive ? (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                  ) : (
                    <span className="opacity-0 group-hover:opacity-40 transition font-mono text-[10px] shrink-0 text-current">
                      #
                    </span>
                  )}
                </li>
              );
            })}

            {filteredToc.length === 0 && (
              <li className="py-2 text-center text-xs opacity-60 italic">
                Nenhuma seção encontrada para "{searchFilter}".
              </li>
            )}
          </ol>

          {/* Footer Navigation Hints */}
          <div className="pt-2 border-t border-current/10 flex items-center justify-between text-[10px] opacity-60 font-mono">
            <span className="flex items-center gap-1">
              <Compass size={11} />
              <span>Clique em qualquer link para navegar internamente</span>
            </span>

            {toc.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigateToSection(toc[0].id)}
                className="hover:underline flex items-center gap-0.5 cursor-pointer hover:opacity-100"
              >
                <span>Ir para a 1ª seção</span>
                <ArrowDown size={10} />
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
