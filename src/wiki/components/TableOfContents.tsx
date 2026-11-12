import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Hash,
  ArrowDown,
  Layers,
  Check,
  Compass,
  Bookmark,
  Eye,
} from 'lucide-react';
import { slugify, TocItem } from '../utils/wikitextParser';

export interface TocHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
  number?: string;
  element?: HTMLElement | null;
}

export interface TableOfContentsProps {
  /** Optional container ref to the active article or rendered content element */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Optional CSS selector if containerRef is not passed (e.g. '.wiki-rendered-content' or 'article') */
  containerSelector?: string;
  /** Active article ID to re-trigger automatic parsing when user changes article */
  articleId?: string;
  /** Active article title (optional, can be shown as root H1 if desired) */
  articleTitle?: string;
  /** Raw or parsed HTML content string as fallback parser if DOM is not yet ready */
  htmlContent?: string;
  /** Pre-existing TOC items if available */
  initialToc?: TocItem[];
  /** Callback triggered when user clicks a section to jump */
  onNavigateToSection?: (id: string) => void;
  /** Active section ID externally controlled (optional, internally detected via ScrollSpy if omitted) */
  activeSectionId?: string;
  /** Visual variant: 'sidebar' (default sticky aside), 'top' (in-article block), or 'floating' */
  variant?: 'sidebar' | 'top' | 'floating';
  /** Additional custom class names */
  className?: string;
  /** Custom heading title */
  title?: string;
  /** Whether the component can be collapsed/expanded */
  collapsible?: boolean;
  /** Initial collapsed state */
  initialCollapsed?: boolean;
  /** Whether to show a search filter input for long tables of contents */
  showSearch?: boolean;
  /** Whether to show hierarchical numbers (1, 1.1, 1.1.1) */
  showNumbering?: boolean;
  /** Whether to display reading progress percentage */
  showProgress?: boolean;
  /** Estimated word count of the active article */
  wordCount?: number;
  /** Reading theme mode */
  themeMode?: 'standard' | 'reader';
  /** Reader theme variant */
  readerTheme?: 'sepia' | 'light' | 'dark' | 'black';
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  containerRef,
  containerSelector = '.wiki-rendered-content, article',
  articleId,
  articleTitle,
  htmlContent,
  initialToc,
  onNavigateToSection,
  activeSectionId: controlledActiveId,
  variant = 'sidebar',
  className = '',
  title = 'Índice do Artigo',
  collapsible = true,
  initialCollapsed = false,
  showSearch = true,
  showNumbering = true,
  showProgress = true,
  wordCount = 0,
  themeMode = 'standard',
  readerTheme = 'sepia',
}) => {
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [internalActiveId, setInternalActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const storageKey =
        variant === 'top' ? 'wikizero_top_toc_collapsed' : 'wikizero_sidebar_toc_collapsed';
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) return saved === 'true';
    } catch {
      // fallback
    }
    return initialCollapsed;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState<'all' | 'h1-h2' | 'h1-only'>('all');
  const [scrollProgress, setScrollProgress] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const activeId = controlledActiveId || internalActiveId;

  // 1. Automatic parser: Scans active article container for H1, H2, and H3 tags
  const parseHeadingsFromDom = useCallback(() => {
    let container: HTMLElement | null = null;

    if (containerRef && containerRef.current) {
      container = containerRef.current;
    } else if (containerSelector) {
      container = document.querySelector<HTMLElement>(containerSelector);
    }

    if (!container) {
      // Try finding main article pane in document
      container =
        document.querySelector<HTMLElement>('.wiki-rendered-content') ||
        document.querySelector<HTMLElement>('article');
    }

    if (!container) {
      // Fallback: parse from htmlContent string if DOM container is not found yet
      if (htmlContent) {
        const parsedFromHtml: TocHeading[] = [];
        const counters = [0, 0, 0];
        const headingRegex =
          /<h([1-3])(?:\s+[^>]*?id=["']([^"']*)["'])?(?:\s+[^>]*?data-header-title=["']([^"']*)["'])?[^>]*>([\s\S]*?)<\/h\1>/gi;
        let match: RegExpExecArray | null;
        let index = 0;

        while ((match = headingRegex.exec(htmlContent)) !== null) {
          index++;
          const level = parseInt(match[1], 10) as 1 | 2 | 3;
          const existingId = match[2];
          const rawText = (match[3] || match[4] || '')
            .replace(/<[^>]*>/g, '')
            .trim();

          if (!rawText) continue;

          counters[level - 1]++;
          for (let l = level; l < 3; l++) {
            counters[l] = 0;
          }
          const numberStr = counters.slice(0, level).join('.');

          const id = existingId || `section-${index}-${slugify(rawText)}`;
          parsedFromHtml.push({
            id,
            text: rawText,
            level,
            number: numberStr,
            element: null,
          });
        }

        if (parsedFromHtml.length > 0) {
          setHeadings(parsedFromHtml);
          return;
        }
      }

      // Fallback: parse from initialToc if provided
      if (initialToc && initialToc.length > 0) {
        const filtered = initialToc
          .filter((item) => item.level >= 1 && item.level <= 3)
          .map((item) => ({
            id: item.id,
            text: item.text,
            level: (item.level as 1 | 2 | 3),
            number: item.number,
            element: document.getElementById(item.id),
          }));
        setHeadings(filtered);
      }
      return;
    }

    // Query strictly H1, H2, and H3 tags inside the active article container
    const headingEls = Array.from(
      container.querySelectorAll<HTMLElement>('h1, h2, h3')
    );

    if (headingEls.length === 0) {
      // Check if fallback initialToc is available
      if (initialToc && initialToc.length > 0) {
        setHeadings(
          initialToc
            .filter((i) => i.level >= 1 && i.level <= 3)
            .map((i) => ({
              id: i.id,
              text: i.text,
              level: i.level as 1 | 2 | 3,
              number: i.number,
              element: document.getElementById(i.id),
            }))
        );
      } else {
        setHeadings([]);
      }
      return;
    }

    const parsed: TocHeading[] = [];
    const counters = [0, 0, 0]; // [h1, h2, h3]

    headingEls.forEach((el, idx) => {
      const tagName = el.tagName.toUpperCase();
      let level: 1 | 2 | 3 = 1;
      if (tagName === 'H2') level = 2;
      else if (tagName === 'H3') level = 3;

      // Extract cleaned plain text
      let text = el.getAttribute('data-header-title') || el.innerText || el.textContent || '';
      // Remove any trailing footnote links like [1] or icons
      text = text.replace(/\[\d+\]/g, '').replace(/\[carece de fontes\]/gi, '').trim();

      if (!text) return;

      // Ensure the heading DOM element has a unique ID for jump-to-section navigation
      let id = el.id;
      if (!id) {
        const slug = slugify(text) || `heading-${idx + 1}`;
        id = `section-h${level}-${idx + 1}-${slug}`;
        el.id = id;
      }

      // Compute hierarchical numbering (e.g., 1, 1.1, 1.1.2)
      counters[level - 1]++;
      for (let l = level; l < 3; l++) {
        counters[l] = 0;
      }
      const numberStr = counters.slice(0, level).join('.');

      parsed.push({
        id,
        text,
        level,
        number: numberStr,
        element: el,
      });
    });

    setHeadings(parsed);
  }, [containerRef, containerSelector, htmlContent, initialToc]);

  // Trigger parsing on mount, article change, or DOM update
  useEffect(() => {
    // Initial parse
    parseHeadingsFromDom();

    // Use a short delay to account for asynchronously rendered wikitext / MathJax / tables
    const timer = setTimeout(parseHeadingsFromDom, 150);

    // Observe DOM changes in container
    let observer: MutationObserver | null = null;
    let targetEl: HTMLElement | null = null;

    if (containerRef?.current) {
      targetEl = containerRef.current;
    } else {
      targetEl =
        document.querySelector<HTMLElement>(containerSelector) ||
        document.querySelector<HTMLElement>('article');
    }

    if (targetEl && window.MutationObserver) {
      observer = new MutationObserver(() => {
        parseHeadingsFromDom();
      });
      observer.observe(targetEl, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [articleId, htmlContent, parseHeadingsFromDom, containerSelector, containerRef]);

  // 2. ScrollSpy: Automatically tracks the active H1, H2, or H3 section as user scrolls
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const headerOffset = 100; // Account for sticky top navigation bar

      // Calculate overall article reading progress
      let articleEl =
        containerRef?.current ||
        document.querySelector<HTMLElement>('.wiki-rendered-content') ||
        document.querySelector<HTMLElement>('article');

      if (articleEl) {
        const rect = articleEl.getBoundingClientRect();
        const totalHeight = rect.height - window.innerHeight;
        if (totalHeight > 0) {
          const currentProgress = Math.min(
            100,
            Math.max(0, Math.round((-rect.top / totalHeight) * 100))
          );
          setScrollProgress(currentProgress);
        }
      }

      // Find current active section heading
      let currentActiveId = '';
      for (const h of headings) {
        const el = h.element || document.getElementById(h.id);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY;
          if (scrollY >= top - headerOffset) {
            currentActiveId = h.id;
          } else {
            break;
          }
        }
      }

      if (currentActiveId && currentActiveId !== internalActiveId) {
        setInternalActiveId(currentActiveId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headings, internalActiveId, containerRef]);

  // Focus search input when toggled open
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // 3. Jump-to-Section Navigation Handler
  const handleJumpToSection = (id: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    const target = document.getElementById(id);
    if (target) {
      // Calculate scroll position with sticky header offset
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = Math.max(0, elementPosition - headerOffset);

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // Update browser URL hash cleanly without instant jump
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', `#${id}`);
      } else {
        window.location.hash = id;
      }

      // Add temporary highlight pulse effect to target heading
      target.classList.add('wiki-heading-highlight');
      setTimeout(() => {
        target.classList.remove('wiki-heading-highlight');
      }, 2200);
    }

    setInternalActiveId(id);
    onNavigateToSection?.(id);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        const storageKey =
          variant === 'top' ? 'wikizero_top_toc_collapsed' : 'wikizero_sidebar_toc_collapsed';
        localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Section counters
  const counts = useMemo(() => {
    let h1 = 0;
    let h2 = 0;
    let h3 = 0;
    headings.forEach((h) => {
      if (h.level === 1) h1++;
      else if (h.level === 2) h2++;
      else if (h.level === 3) h3++;
    });
    return { h1, h2, h3, total: headings.length };
  }, [headings]);

  // Filtered headings based on search query and level filter
  const filteredHeadings = useMemo(() => {
    let result = headings;

    if (levelFilter === 'h1-only') {
      result = result.filter((h) => h.level === 1);
    } else if (levelFilter === 'h1-h2') {
      result = result.filter((h) => h.level <= 2);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (h) =>
          h.text.toLowerCase().includes(q) ||
          (h.number && h.number.includes(q))
      );
    }

    return result;
  }, [headings, levelFilter, searchQuery]);

  // If no headings found, do not render an empty box
  if (headings.length === 0) {
    return null;
  }

  const isReader = themeMode === 'reader';

  // Base theme container styling
  let containerStyles = 'table-of-contents not-prose transition-all duration-200 ';

  if (variant === 'top') {
    containerStyles +=
      'my-5 rounded-xl border shadow-xs max-w-full overflow-hidden ';
    if (!isReader) {
      containerStyles +=
        'bg-slate-50/95 dark:bg-slate-900/90 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-100 ';
    } else {
      if (readerTheme === 'sepia') {
        containerStyles += 'bg-[#f4ebd0]/80 border-[#decba4] text-[#3e2f1f] ';
      } else if (readerTheme === 'black') {
        containerStyles += 'bg-zinc-950 border-zinc-800 text-zinc-100 ';
      } else if (readerTheme === 'dark') {
        containerStyles += 'bg-slate-900/95 border-slate-800 text-slate-100 ';
      } else {
        containerStyles += 'bg-slate-50 border-slate-200 text-slate-900 ';
      }
    }
  } else if (variant === 'floating') {
    containerStyles +=
      'rounded-xl border shadow-2xl p-4 max-w-sm w-full backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 ';
  } else {
    // Default 'sidebar' variant
    containerStyles +=
      'rounded-lg border shadow-xs bg-[#f8f9fa] dark:bg-[#0f172a] border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-3.5 ';
  }

  return (
    <nav
      aria-label="Table of Contents"
      className={`${containerStyles} ${className}`}
    >
      {/* Table of Contents Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-current/10 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`p-1.5 rounded-lg shrink-0 ${
              isReader
                ? 'bg-current/10 text-current'
                : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <ListOrdered size={14} />
          </span>

          <div className="flex items-baseline gap-2 truncate">
            <h2 className="text-xs sm:text-sm font-bold tracking-tight font-serif-heading">
              {title}
            </h2>
            <span className="text-[10px] font-mono opacity-70 truncate hidden sm:inline">
              {counts.total} {counts.total === 1 ? 'seção' : 'seções'}
            </span>
          </div>

          {/* Tag Badges for H1, H2, H3 */}
          <div className="hidden lg:flex items-center gap-1 font-mono text-[9px] opacity-75">
            {counts.h1 > 0 && (
              <span className="px-1 py-0.2 rounded bg-current/10" title={`${counts.h1} títulos principais H1`}>
                {counts.h1} H1
              </span>
            )}
            {counts.h2 > 0 && (
              <span className="px-1 py-0.2 rounded bg-current/10" title={`${counts.h2} seções H2`}>
                {counts.h2} H2
              </span>
            )}
            {counts.h3 > 0 && (
              <span className="px-1 py-0.2 rounded bg-current/10" title={`${counts.h3} subseções H3`}>
                {counts.h3} H3
              </span>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {showSearch && counts.total >= 4 && (
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isCollapsed) setIsCollapsed(false);
              }}
              title={isSearchOpen ? 'Fechar busca no sumário' : 'Buscar seção no sumário'}
              className={`p-1 rounded text-xs transition cursor-pointer ${
                isSearchOpen
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-current/10 opacity-70 hover:opacity-100'
              }`}
            >
              <Search size={13} />
            </button>
          )}

          {collapsible && (
            <button
              type="button"
              onClick={handleToggleCollapse}
              title={isCollapsed ? 'Expandir sumário' : 'Recolher sumário'}
              className="p-1 rounded hover:bg-current/10 transition cursor-pointer text-xs flex items-center gap-0.5 opacity-80 hover:opacity-100"
            >
              <span className="text-[10px] hidden sm:inline font-mono font-medium">
                {isCollapsed ? 'Mostrar' : 'Ocultar'}
              </span>
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Reading Progress Indicator Bar */}
      {showProgress && !isCollapsed && (
        <div className="mt-2 mb-2">
          <div className="flex items-center justify-between text-[9px] font-mono opacity-65 mb-0.5">
            <span>Progresso da Leitura</span>
            <span>{scrollProgress}%</span>
          </div>
          <div className="w-full h-1 bg-current/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-150 rounded-full"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Search Input Bar (when activated) */}
      {!isCollapsed && isSearchOpen && (
        <div className="mt-2 mb-2 pt-2 border-t border-current/10 flex items-center gap-1.5 animate-in fade-in duration-150">
          <div className="relative flex-1">
            <Search
              size={12}
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar seções por nome..."
              className="w-full pl-6 pr-6 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-current/20 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="text-[10px] font-mono py-1 px-1.5 rounded bg-white dark:bg-slate-900 border border-current/20 focus:outline-none"
            title="Filtrar por nível hierárquico"
          >
            <option value="all">Todos</option>
            <option value="h1-h2">H1 & H2</option>
            <option value="h1-only">H1 apenas</option>
          </select>
        </div>
      )}

      {/* Navigation Links List */}
      {!isCollapsed && (
        <div
          ref={listContainerRef}
          className={`space-y-0.5 text-xs overflow-y-auto pr-1 mt-2 ${
            variant === 'top' ? 'max-h-80 sm:max-h-96' : 'max-h-72 sm:max-h-80'
          }`}
        >
          {filteredHeadings.length === 0 ? (
            <p className="text-[11px] opacity-60 italic py-2 text-center">
              Nenhuma seção correspondente encontrada.
            </p>
          ) : (
            filteredHeadings.map((item) => {
              const isActive = activeId === item.id;

              // Indentation & typography styling based on H1, H2, or H3
              let indentClasses = 'pl-2 ';
              let fontClasses = 'text-[11px] font-normal ';
              let levelBadge = '';

              if (item.level === 1) {
                indentClasses = 'pl-2 font-bold ';
                fontClasses = 'text-xs ';
                levelBadge = 'H1';
              } else if (item.level === 2) {
                indentClasses = 'pl-5 font-medium ';
                fontClasses = 'text-[11px] ';
                levelBadge = 'H2';
              } else if (item.level === 3) {
                indentClasses = 'pl-8 font-normal opacity-90 ';
                fontClasses = 'text-[10.5px] ';
                levelBadge = 'H3';
              }

              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleJumpToSection(item.id, e)}
                  className={`group flex items-baseline justify-between gap-2 py-1 px-2 rounded-md transition-all duration-150 truncate block cursor-pointer select-none ${indentClasses} ${fontClasses} ${
                    isActive
                      ? isReader
                        ? 'bg-current/15 font-bold shadow-2xs'
                        : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border-l-2 border-blue-600 dark:border-blue-400'
                      : 'hover:bg-current/5 opacity-80 hover:opacity-100'
                  }`}
                  aria-current={isActive ? 'location' : undefined}
                >
                  <div className="flex items-baseline gap-1.5 truncate">
                    {/* Visual tree indicator for H1, H2, H3 */}
                    <span className="opacity-40 font-mono text-[10px] shrink-0">
                      {item.level === 1 ? '▪' : item.level === 2 ? '↳' : '•'}
                    </span>

                    {/* Section Numbering */}
                    {showNumbering && item.number && (
                      <span className="font-mono text-[10px] opacity-60 shrink-0">
                        {item.number}
                      </span>
                    )}

                    {/* Heading Text */}
                    <span className="truncate group-hover:underline">
                      {item.text}
                    </span>
                  </div>

                  {/* Level Tag Pill */}
                  <span
                    className={`text-[8px] font-mono px-1 py-0.2 rounded shrink-0 opacity-40 group-hover:opacity-100 transition ${
                      isActive ? 'opacity-100 font-bold' : ''
                    }`}
                  >
                    {levelBadge}
                  </span>
                </a>
              );
            })
          )}
        </div>
      )}

      {/* Quick Jump-to-Top Button */}
      {!isCollapsed && headings.length >= 5 && (
        <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-[10px] opacity-70">
          <span className="font-mono">
            {filteredHeadings.length} de {headings.length} tópicos
          </span>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1 hover:underline cursor-pointer hover:opacity-100"
          >
            <span>Voltar ao topo</span>
            <ChevronUp size={11} />
          </button>
        </div>
      )}
    </nav>
  );
};
