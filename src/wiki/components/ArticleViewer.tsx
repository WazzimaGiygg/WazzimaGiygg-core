import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Edit3,
  Share2,
  Printer,
  History,
  Download,
  Trash2,
  Volume2,
  VolumeX,
  Type,
  List,
  Eye,
  Calendar,
  User,
  Check,
  ChevronRight,
  ArrowLeft,
  X,
  FileCode,
  BookOpen,
  Copy,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Link2,
  Star,
  Tag,
  ThumbsUp,
  Folder,
  Send,
  FileDown,
  FileText,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Clock,
  ArrowUp,
  Sliders,
  Minus,
  Plus,
  AlignLeft,
  Puzzle,
} from 'lucide-react';
import {
  WikiArticle,
  WikiPage,
  UserProfile,
  ArticleHistoryItem,
  ArticleRatingData,
  ArticleActionDefinition,
  ArticleWidgetDefinition,
} from '../types';
import { parseWikitext, TocItem } from '../utils/wikitextParser';
import { buildUidPermalink } from '../utils/urlRouter';
import { formatExternalUrl } from '../utils/linkUtils';
import { ArticleHistoryView } from './ArticleHistoryView';
import { TalkPageView } from './TalkPageView';
import { WhatLinksHereView } from './WhatLinksHereView';
import { MobileArticleTOC } from './MobileArticleTOC';
import { PdfExportModal } from './PdfExportModal';
import { ModerationLockModal } from './ModerationLockModal';
import { WazzimaGiyggTimeline } from './WazzimaGiyggTimeline';
import { IrregularidadesDossierModal, DossierDocType } from './IrregularidadesDossierModal';
import { ReadingProgressBar } from './ReadingProgressBar';
import { ArticleTopTableOfContents } from './ArticleTopTableOfContents';
import { TableOfContents } from './TableOfContents';
import { ResearchEthicsBadge } from './ResearchEthicsBadge';
import { StorageService } from '../services/storageService';
import { ExtensionManager } from '../core/ExtensionManager';

interface ArticleViewerProps {
  article: WikiArticle;
  page?: WikiPage | null;
  user: UserProfile | null;
  allArticles?: WikiArticle[];
  allPages?: WikiPage[];
  onEdit: (article: WikiArticle) => void;
  onDelete: (articleId: string) => void;
  onNavigateToPage: (pageUid: string) => void;
  onNavigateToArticleByTitle: (title: string) => void;
  onNavigateToArticleById?: (articleId: string) => void;
  onNavigateToUser?: (identifier: string) => void;
  onBack: () => void;
  onRestoreRevision?: (historyItem: ArticleHistoryItem) => void;
  onArticleUpdated?: (article: WikiArticle) => void;
}

export const ArticleViewer: React.FC<ArticleViewerProps> = ({
  article,
  page,
  user,
  allArticles = [],
  allPages = [],
  onEdit,
  onDelete,
  onNavigateToPage,
  onNavigateToArticleByTitle,
  onNavigateToArticleById,
  onNavigateToUser,
  onBack,
  onRestoreRevision,
  onArticleUpdated,
}) => {
  const [fontSize, setFontSize] = useState<number>(15);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'article' | 'talk' | 'source' | 'history' | 'what-links-here' | 'info' | 'timeline'
  >('article');
  const [sourceCopied, setSourceCopied] = useState(false);
  const [isWatched, setIsWatched] = useState(() => StorageService.isWatched(article.id));
  const [ratingData, setRatingData] = useState<ArticleRatingData>(() =>
    StorageService.getArticleRating(article.id)
  );
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierInitialDoc, setDossierInitialDoc] = useState<DossierDocType>('chronus');
  const [dossierInitialTab, setDossierInitialTab] = useState<'text' | 'pdf' | 'table'>('text');
  const [localArticle, setLocalArticle] = useState<WikiArticle>(article);

  // Ganchos e Extensões Dinâmicas (Ações de Artigo e Widgets)
  const [extensionActions, setExtensionActions] = useState<ArticleActionDefinition[]>(() =>
    ExtensionManager.getInstance().getRegisteredArticleActions(article)
  );
  const [extensionWidgets, setExtensionWidgets] = useState<ArticleWidgetDefinition[]>(() =>
    ExtensionManager.getInstance().getRegisteredArticleWidgets(article)
  );

  useEffect(() => {
    const unsub = ExtensionManager.getInstance().subscribe(() => {
      setExtensionActions(ExtensionManager.getInstance().getRegisteredArticleActions(localArticle));
      setExtensionWidgets(ExtensionManager.getInstance().getRegisteredArticleWidgets(localArticle));
    });
    return () => unsub();
  }, [localArticle]);

  const isWazzimaGiyggArticle =
    localArticle.id === 'curated-wazzimagiygg-biography' ||
    /wazzimagiygg/i.test(localArticle.titulo) ||
    /wazzimagiygg/i.test(localArticle.id);

  const isModeratorOrAdmin = !!(user && (user.role === 'admin' || user.role === 'moderador'));
  const isArticleLocked = !!localArticle.isLocked;
  const isPageLocked = !!page?.isLocked;

  const contentRef = useRef<HTMLDivElement>(null);
  const articleRootRef = useRef<HTMLDivElement>(null);
  const articlePaneRef = useRef<HTMLElement>(null);

  // Modo de Leitura Imersivo (Distraction-free Reader Mode)
  const [isReaderMode, setIsReaderMode] = useState<boolean>(() => {
    return localStorage.getItem('wikizero_reader_mode') === 'true';
  });
  const [readerFontFamily, setReaderFontFamily] = useState<'serif' | 'sans' | 'mono'>(() => {
    return (localStorage.getItem('wikizero_reader_font') as 'serif' | 'sans' | 'mono') || 'serif';
  });
  const [readerFontSize, setReaderFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('wikizero_reader_size');
    return saved ? parseInt(saved, 10) : 18;
  });
  const [readerTheme, setReaderTheme] = useState<'sepia' | 'light' | 'dark' | 'black'>(() => {
    return (localStorage.getItem('wikizero_reader_theme') as any) || 'sepia';
  });
  const [readerWidth, setReaderWidth] = useState<'narrow' | 'medium' | 'wide'>(() => {
    return (localStorage.getItem('wikizero_reader_width') as any) || 'medium';
  });
  const [showReaderToc, setShowReaderToc] = useState<boolean>(false);
  const [showReaderSettings, setShowReaderSettings] = useState<boolean>(false);
  const [readerProgress, setReaderProgress] = useState<number>(0);
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(undefined);

  const readerScrollRef = useRef<HTMLDivElement>(null);
  const readerContentRef = useRef<HTMLDivElement>(null);

  const handleToggleReaderMode = (val?: boolean) => {
    setIsReaderMode((prev) => {
      const next = typeof val === 'boolean' ? val : !prev;
      localStorage.setItem('wikizero_reader_mode', String(next));
      return next;
    });
  };

  const handleSetReaderTheme = (theme: 'sepia' | 'light' | 'dark' | 'black') => {
    setReaderTheme(theme);
    localStorage.setItem('wikizero_reader_theme', theme);
  };

  const handleSetReaderFontFamily = (font: 'serif' | 'sans' | 'mono') => {
    setReaderFontFamily(font);
    localStorage.setItem('wikizero_reader_font', font);
  };

  const handleSetReaderFontSize = (deltaOrVal: number, isDelta = false) => {
    setReaderFontSize((prev) => {
      const next = isDelta ? Math.min(26, Math.max(14, prev + deltaOrVal)) : deltaOrVal;
      localStorage.setItem('wikizero_reader_size', String(next));
      return next;
    });
  };

  const handleSetReaderWidth = (w: 'narrow' | 'medium' | 'wide') => {
    setReaderWidth(w);
    localStorage.setItem('wikizero_reader_width', w);
  };

  const handleReaderScroll = () => {
    const el = readerScrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) {
      setReaderProgress(100);
      return;
    }
    const current = Math.min(100, Math.max(0, Math.round((el.scrollTop / max) * 100)));
    setReaderProgress(current);
  };

  // Keyboard shortcut listener: Esc para sair do Modo Leitura, 'r' para alternar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Escape' && isReaderMode) {
        handleToggleReaderMode(false);
      } else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleToggleReaderMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReaderMode]);

  // Intercept wiki links inside reader mode
  useEffect(() => {
    const el = readerContentRef.current;
    if (!el || !isReaderMode) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-wiki-target]');
      if (target) {
        e.preventDefault();
        const wikiTarget = target.getAttribute('data-wiki-target');
        if (wikiTarget) {
          onNavigateToArticleByTitle(wikiTarget);
        }
      }
    };

    el.addEventListener('click', handleLinkClick);
    return () => el.removeEventListener('click', handleLinkClick);
  }, [onNavigateToArticleByTitle, isReaderMode]);

  // Sync article when prop changes
  useEffect(() => {
    setLocalArticle(article);
  }, [article]);

  // Parse wikitext (with callouts, refs, categories, infoboxes)
  const { html, toc, references, categories } = useMemo(
    () => parseWikitext(localArticle.descricao),
    [localArticle.descricao]
  );

  // Calculate reading time estimate based on article text length
  const { readingTimeMinutes, wordCount, characterCount } = useMemo(() => {
    const rawContent = localArticle.descricao || '';
    // Strip wikitext templates, links, headers, markup to get accurate textual word count
    const cleanText = rawContent
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
      .replace(/==+[^=]+==+/g, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\{\{[^}]*\}\}/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/['*#_~`]/g, ' ');
    const words = cleanText.trim().split(/\s+/).filter(Boolean).length;
    const chars = rawContent.length;
    // Calculate minutes based on words (standard 200 wpm) or length fallback (approx 1000 chars/min)
    const minutes = Math.max(1, Math.ceil(words > 0 ? words / 200 : chars / 1000));
    return {
      readingTimeMinutes: minutes,
      wordCount: words,
      characterCount: chars,
    };
  }, [localArticle.descricao]);

  const handleToggleLockArticle = async (reason: string) => {
    if (!user) return;
    try {
      if (isArticleLocked) {
        const updated = await StorageService.unlockArticle(localArticle.id, user);
        setLocalArticle(updated);
        onArticleUpdated?.(updated);
      } else {
        const updated = await StorageService.lockArticle(localArticle.id, user, reason);
        setLocalArticle(updated);
        onArticleUpdated?.(updated);
      }
    } catch (err: any) {
      console.error('Erro ao modificar bloqueio de moderação:', err);
      alert(err?.message || 'Falha ao alterar status de proteção do artigo.');
    }
  };

  // Sync watched status on article change
  useEffect(() => {
    setIsWatched(StorageService.isWatched(article.id));
    setRatingData(StorageService.getArticleRating(article.id));
    setHasRated(false);
  }, [article.id]);

  // ScrollSpy to track active heading as user scrolls
  useEffect(() => {
    if (!toc || toc.length === 0) return;

    const headingElements = toc
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headingElements.length === 0) return;

    const handleScrollSpy = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      let currentActive: string | undefined = undefined;
      for (const el of headingElements) {
        const top = el.getBoundingClientRect().top + scrollY;
        if (scrollY >= top - 130) {
          currentActive = el.id;
        } else {
          break;
        }
      }
      if (currentActive) {
        setActiveSectionId(currentActive);
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    handleScrollSpy();

    return () => {
      window.removeEventListener('scroll', handleScrollSpy);
    };
  }, [toc, html]);

  // Handle direct hash navigation
  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      if (targetId) {
        setTimeout(() => {
          scrollToSection(targetId);
        }, 400);
      }
    }
  }, [article.id]);

  // Intercept internal wiki links
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-wiki-target]');
      if (target) {
        e.preventDefault();
        const wikiTarget = target.getAttribute('data-wiki-target');
        if (wikiTarget) {
          onNavigateToArticleByTitle(wikiTarget);
        }
        return;
      }

      // Safeguard for any external link click
      const anchor = (e.target as HTMLElement).closest('a');
      if (anchor && !anchor.hasAttribute('data-wiki-target')) {
        const href = anchor.getAttribute('href');
        if (href && /^https?:\/\//i.test(href)) {
          const redirectUrl = formatExternalUrl(href);
          anchor.setAttribute('href', redirectUrl);
          anchor.setAttribute('target', '_blank');
          anchor.setAttribute('rel', 'noopener noreferrer');
        }
      }
    };

    el.addEventListener('click', handleLinkClick);
    return () => el.removeEventListener('click', handleLinkClick);
  }, [article.descricao, onNavigateToArticleByTitle]);

  // Handle Speech Reader
  const toggleSpeech = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!window.speechSynthesis) {
      alert('Seu navegador não suporta sintetizador de voz nativo.');
      return;
    }

    window.speechSynthesis.cancel();
    // Strip wikitext symbols for clean speech
    const cleanText = `${article.titulo}. ${article.descricao.replace(/[\=\*\[\]\#\{\}\|]/g, ' ')}`;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = article.idioma === 'Português' ? 'pt-BR' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [article.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyUid = () => {
    const permalink = buildUidPermalink(article.id);
    navigator.clipboard.writeText(permalink);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySource = () => {
    navigator.clipboard.writeText(article.descricao);
    setSourceCopied(true);
    setTimeout(() => setSourceCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([`# ${article.titulo}\n\n${article.descricao}`], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.titulo.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(article, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.titulo.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleWatchlist = () => {
    const watched = StorageService.toggleWatchlist(article);
    setIsWatched(watched);
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.submitRating(article.id, selectedRating, ratingComment, user);
    setRatingData(updated);
    setHasRated(true);
    setRatingComment('');
  };

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      const headerOffset = 90;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      });
      setActiveSectionId(id);
      target.classList.remove('heading-target-highlight');
      void target.offsetWidth;
      target.classList.add('heading-target-highlight');
      setTimeout(() => {
        target.classList.remove('heading-target-highlight');
      }, 2500);
      try {
        window.history.replaceState(null, '', `#${id}`);
      } catch {
        // ignore iframe restrictions if any
      }
    }
  };

  const historyCount = article.historico?.length || 1;
  const talkThreads = StorageService.getTalkThreads(article.id);
  const backlinks = StorageService.getBacklinks(article.titulo, allArticles);

  // All extracted or explicitly assigned categories
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    if (article.categoria) set.add(article.categoria);
    categories.forEach((c) => set.add(c));
    return Array.from(set);
  }, [article.categoria, categories]);

  const handleRestore = (item: ArticleHistoryItem) => {
    if (onRestoreRevision) {
      onRestoreRevision(item);
    } else {
      const restoredArticle: WikiArticle = {
        ...article,
        descricao: item.conteudo || article.descricao,
      };
      onEdit(restoredArticle);
    }
  };

  // Render Immersive Reader Mode when active
  if (isReaderMode) {
    return (
      <div
        ref={readerScrollRef}
        onScroll={handleReaderScroll}
        className={`fixed inset-0 z-50 overflow-y-auto selection:bg-amber-200 selection:text-amber-950 transition-colors duration-200 animate-in fade-in ${
          readerTheme === 'sepia'
            ? 'theme-reader-sepia'
            : readerTheme === 'light'
            ? 'theme-reader-light'
            : readerTheme === 'dark'
            ? 'theme-reader-dark'
            : 'theme-reader-black'
        }`}
      >
        {/* Top Slim Scroll Progress Line */}
        <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-black/10 dark:bg-white/10 no-print pointer-events-none">
          <div
            className={`h-full transition-all duration-150 ease-out ${
              readerTheme === 'sepia'
                ? 'bg-[#8c531b]'
                : readerTheme === 'dark' || readerTheme === 'black'
                ? 'bg-blue-500'
                : 'bg-blue-600'
            }`}
            style={{ width: `${readerProgress}%` }}
          />
        </div>

        {/* Minimalist Sticky Reader Toolbar */}
        <header className="sticky top-0 z-40 backdrop-blur-md border-b px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-3 shadow-2xs no-print transition-colors border-current/15 select-none bg-inherit/90">
          {/* Left Controls: Exit Button & Article Title / Reading Progress */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              onClick={() => handleToggleReaderMode(false)}
              className="px-2.5 py-1.5 rounded-lg border border-current/25 hover:border-current/40 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition shadow-2xs shrink-0"
              title="Sair do Modo de Leitura [Pressione Esc]"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Sair do Modo Leitura</span>
              <kbd className="hidden md:inline px-1.5 py-0.2 rounded text-[10px] opacity-70 border border-current/30 font-mono">
                ESC
              </kbd>
            </button>

            <div className="hidden md:flex items-center gap-2 min-w-0 text-xs truncate">
              <span className="font-bold truncate max-w-xs">{localArticle.titulo}</span>
              <span className="opacity-30">•</span>
              <span className="opacity-80 font-mono text-[11px] shrink-0">{readerProgress}% lido</span>
              <span className="opacity-30">•</span>
              <span className="opacity-80 text-[11px] shrink-0">~{readingTimeMinutes} min de leitura</span>
            </div>
          </div>

          {/* Right Controls: Readability Settings & Quick Tools */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Font Family Picker */}
            <div className="flex items-center bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-current/20 text-xs font-medium">
              <button
                onClick={() => handleSetReaderFontFamily('serif')}
                title="Fonte Serifada (Merriweather / Georgia) - Tradicional para livros e conforto prolongado"
                className={`px-2 py-1 rounded text-[11px] font-serif transition cursor-pointer ${
                  readerFontFamily === 'serif'
                    ? 'bg-black/10 dark:bg-white/20 font-bold shadow-2xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Serif
              </button>
              <button
                onClick={() => handleSetReaderFontFamily('sans')}
                title="Fonte Sem Serifa (Inter / Sans) - Limpa e moderna"
                className={`px-2 py-1 rounded text-[11px] font-sans transition cursor-pointer ${
                  readerFontFamily === 'sans'
                    ? 'bg-black/10 dark:bg-white/20 font-bold shadow-2xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Sans
              </button>
              <button
                onClick={() => handleSetReaderFontFamily('mono')}
                title="Fonte Monospaçada (Consolas / Código)"
                className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer hidden sm:block ${
                  readerFontFamily === 'mono'
                    ? 'bg-black/10 dark:bg-white/20 font-bold shadow-2xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Mono
              </button>
            </div>

            {/* Font Size Adjuster */}
            <div className="flex items-center bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-current/20 text-xs">
              <button
                onClick={() => handleSetReaderFontSize(-2, true)}
                title="Diminuir tamanho da fonte"
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition cursor-pointer"
              >
                <Minus size={13} />
              </button>
              <span className="px-1.5 font-mono text-[11px] font-bold min-w-[28px] text-center">
                {readerFontSize}
              </span>
              <button
                onClick={() => handleSetReaderFontSize(2, true)}
                title="Aumentar tamanho da fonte"
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition cursor-pointer"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Reading Width Controls */}
            <div className="hidden lg:flex items-center bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-current/20 text-xs">
              <button
                onClick={() => handleSetReaderWidth('narrow')}
                title="Coluna Estreita (680px) - Foco concentrado"
                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  readerWidth === 'narrow' ? 'bg-black/10 dark:bg-white/20' : 'opacity-70 hover:opacity-100'
                }`}
              >
                680
              </button>
              <button
                onClick={() => handleSetReaderWidth('medium')}
                title="Coluna Média Equilibrada (800px) - Padrão editorial"
                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  readerWidth === 'medium' ? 'bg-black/10 dark:bg-white/20' : 'opacity-70 hover:opacity-100'
                }`}
              >
                800
              </button>
              <button
                onClick={() => handleSetReaderWidth('wide')}
                title="Coluna Larga (960px) - Leitura expandida"
                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  readerWidth === 'wide' ? 'bg-black/10 dark:bg-white/20' : 'opacity-70 hover:opacity-100'
                }`}
              >
                960
              </button>
            </div>

            {/* Reading Themes (Sepia, Light, Dark, OLED Black) */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-current/20">
              <button
                onClick={() => handleSetReaderTheme('sepia')}
                title="Tema Sépia / Livro (Tons quentes de papel, reduz cansaço visual)"
                className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                  readerTheme === 'sepia' ? 'ring-2 ring-[#8c531b] scale-110' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: '#fbf0d9', borderColor: '#c4a572' }}
              />
              <button
                onClick={() => handleSetReaderTheme('light')}
                title="Tema Claro (Branco clássico)"
                className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                  readerTheme === 'light' ? 'ring-2 ring-blue-600 scale-110' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
              />
              <button
                onClick={() => handleSetReaderTheme('dark')}
                title="Tema Escuro (Grafite suave para baixa luminosidade)"
                className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                  readerTheme === 'dark' ? 'ring-2 ring-blue-400 scale-110' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: '#181b20', borderColor: '#334155' }}
              />
              <button
                onClick={() => handleSetReaderTheme('black')}
                title="Tema OLED Preto Puro (Contraste máximo, economia de energia)"
                className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                  readerTheme === 'black' ? 'ring-2 ring-blue-400 scale-110' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: '#000000', borderColor: '#27272a' }}
              />
            </div>

            {/* Table of Contents Popover Toggle */}
            {toc.length > 0 && (
              <button
                onClick={() => setShowReaderToc(!showReaderToc)}
                title="Ver Índice do Artigo"
                className={`p-1.5 rounded-lg border border-current/25 hover:border-current/40 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${
                  showReaderToc ? 'bg-black/10 dark:bg-white/20' : ''
                }`}
              >
                <List size={15} />
              </button>
            )}

            {/* Speech Audio Reader */}
            <button
              onClick={toggleSpeech}
              title={isPlayingAudio ? 'Parar leitura por voz' : 'Ouvir artigo por voz'}
              className={`p-1.5 rounded-lg border border-current/25 hover:border-current/40 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${
                isPlayingAudio ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : ''
              }`}
            >
              {isPlayingAudio ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* Clean Print / PDF Export */}
            <button
              onClick={handlePrint}
              title="Imprimir ou Salvar PDF (Aplica folha de estilos limpa dedicada)"
              className="p-1.5 rounded-lg border border-current/25 hover:border-current/40 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer hidden sm:block"
            >
              <Printer size={15} />
            </button>
          </div>
        </header>

        {/* Floating TableOfContents Popover in Reader Mode */}
        {showReaderToc && (
          <div className="fixed top-14 right-4 sm:right-6 z-40 w-80 max-h-[75vh] overflow-y-auto rounded-xl border border-current/20 shadow-2xl p-3 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 no-print bg-inherit">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-current/15">
              <h3 className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                <List size={13} />
                <span>Índice do Artigo</span>
              </h3>
              <button
                onClick={() => setShowReaderToc(false)}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
            <TableOfContents
              containerRef={readerContentRef}
              containerSelector=".wiki-rendered-content"
              articleId={localArticle.id}
              articleTitle={localArticle.titulo}
              htmlContent={html}
              initialToc={toc}
              onNavigateToSection={(id) => {
                scrollToSection(id);
                setShowReaderToc(false);
              }}
              activeSectionId={activeSectionId}
              variant="sidebar"
              collapsible={false}
              showProgress={false}
              themeMode="reader"
              readerTheme={readerTheme}
            />
          </div>
        )}

        {/* Central Article Canvas */}
        <main
          className={`mx-auto px-5 sm:px-10 py-10 sm:py-16 transition-all duration-150 ${
            readerWidth === 'narrow'
              ? 'max-w-2xl'
              : readerWidth === 'wide'
              ? 'max-w-4xl'
              : 'max-w-3xl'
          }`}
        >
          {/* Article Title & Metadata Banner */}
          <header className="mb-10 pb-6 border-b border-current/15 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-3 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-current/25 bg-black/5 dark:bg-white/5">
                {localArticle.categoria || 'Geral'}
              </span>
              <span className="text-xs opacity-75 font-mono">
                ~{readingTimeMinutes} min de leitura • {wordCount.toLocaleString()} palavras
              </span>
            </div>

            <h1
              className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight ${
                readerFontFamily === 'serif'
                  ? 'font-serif'
                  : readerFontFamily === 'mono'
                  ? 'font-mono'
                  : 'font-sans'
              }`}
            >
              {localArticle.titulo}
            </h1>

            <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs opacity-70 flex-wrap">
              <span>Por <strong>{localArticle.autor || 'Comunidade WikiWorldWeb'}</strong></span>
              <span>•</span>
              <span>Atualizado em {new Date(localArticle.dataEdicao || localArticle.dataCriacao).toLocaleDateString('pt-BR')}</span>
              <span>•</span>
              <span className="font-mono">Versão {localArticle.versao || 1}.0</span>
            </div>
          </header>

          {/* Gerador de Índice Automático no Topo do Modo de Leitura */}
          <ArticleTopTableOfContents
            toc={toc}
            wordCount={wordCount}
            onNavigateToSection={(id) => {
              const target = document.getElementById(id);
              if (target && readerScrollRef.current) {
                const headerOffset = 70;
                const containerTop = readerScrollRef.current.getBoundingClientRect().top;
                const targetTop = target.getBoundingClientRect().top;
                const scrollPos = readerScrollRef.current.scrollTop + (targetTop - containerTop) - headerOffset;
                readerScrollRef.current.scrollTo({
                  top: Math.max(0, scrollPos),
                  behavior: 'smooth',
                });
                setActiveSectionId(id);
                target.classList.remove('heading-target-highlight');
                void target.offsetWidth;
                target.classList.add('heading-target-highlight');
                setTimeout(() => {
                  target.classList.remove('heading-target-highlight');
                }, 2500);
              } else {
                scrollToSection(id);
              }
            }}
            activeSectionId={activeSectionId}
            themeMode="reader"
            readerTheme={readerTheme}
          />

          {/* Cleaned Immersive Wikitext Rendered Content */}
          <div
            ref={readerContentRef}
            style={{
              fontSize: `${readerFontSize}px`,
              lineHeight: 1.82,
            }}
            className={`reader-mode-content wiki-rendered-content ${
              readerFontFamily === 'serif'
                ? 'font-serif font-reader-serif'
                : readerFontFamily === 'mono'
                ? 'font-mono font-reader-mono'
                : 'font-sans font-reader-sans'
            }`}
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* End-of-article Navigation & Licensing Footer */}
          <footer className="mt-16 pt-8 border-t border-current/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-70">
            <div>
              <p className="font-bold">WikiWorldWeb — Enciclopédia Livre e Aberta</p>
              <p className="text-[11px]">
                Conteúdo sob licença Creative Commons Atribuição-CompartilhaIgual (CC-BY-SA 4.0).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  readerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg border border-current/25 hover:border-current/40 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 transition cursor-pointer text-xs font-semibold"
              >
                <ArrowUp size={13} />
                <span>Voltar ao topo</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleReaderMode(false)}
                className="px-3.5 py-1.5 rounded-lg border border-current/30 hover:border-current/50 bg-black/5 dark:bg-white/10 font-bold transition cursor-pointer text-xs"
              >
                <span>Sair do Modo Leitura</span>
              </button>
            </div>
          </footer>
        </main>

        {/* Modals if opened while in Reader Mode */}
        {showPdfModal && (
          <PdfExportModal
            article={localArticle}
            pageName={page?.titulo || 'WikiWorldWeb'}
            articleContentRef={readerContentRef}
            isOpen={showPdfModal}
            onClose={() => setShowPdfModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={articleRootRef} className="w-full max-w-full min-w-0 space-y-4 animate-in fade-in select-none overflow-x-clip">
      {/* Reading Progress Bar (Visual tracking of how far the user has scrolled through the article) */}
      <div className="no-print print:hidden">
        <ReadingProgressBar
          contentRef={contentRef}
          containerRef={articlePaneRef}
          article={localArticle}
          activeTab={activeTab}
          isPlayingAudio={isPlayingAudio}
          onToggleSpeech={toggleSpeech}
          onOpenReaderMode={() => handleToggleReaderMode(true)}
        />
      </div>

      {/* High Density Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-slate-200 dark:border-slate-800 pb-2 no-print print:hidden article-top-toolbar min-w-0 max-w-full">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 flex-wrap">
            <button
              onClick={onBack}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-semibold"
            >
              <ArrowLeft size={13} /> Principal
            </button>
            <ChevronRight size={11} className="text-slate-300 dark:text-slate-600" />
            {page && (
              <>
                <button
                  onClick={() => onNavigateToPage(page.uid)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  {page.titulo}
                </button>
                <ChevronRight size={11} className="text-slate-300 dark:text-slate-600" />
              </>
            )}
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
              {article.titulo}
            </span>
          </div>

          {/* Reading Time Estimate Label at the Top of ArticleViewer */}
          <div
            title={`Tempo estimado de leitura: ~${readingTimeMinutes} min (${wordCount.toLocaleString()} palavras, ${characterCount.toLocaleString()} caracteres)`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/90 dark:bg-blue-950/70 border border-blue-200/90 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-mono text-[11px] font-semibold shadow-2xs"
          >
            <Clock size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>~{readingTimeMinutes} min de leitura</span>
            <span className="text-[10px] text-blue-500/80 dark:text-blue-400/70 hidden sm:inline">
              ({wordCount.toLocaleString()} palavras)
            </span>
          </div>
        </div>

        {/* High Density Toolbar Controls */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* UID Permalink Button */}
          <button
            onClick={handleCopyUid}
            title={`Copiar Link Permanente UID (?uid=${article.id})`}
            className="px-2 py-1 rounded border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex items-center gap-1 font-mono text-[11px] font-bold shadow-xs"
          >
            <Link2 size={12} className="text-blue-500" />
            <span className="hidden sm:inline">UID:</span>
            <span>{article.id}</span>
            {copiedUid ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="text-slate-400" />}
          </button>

          {/* Watchlist Star Toggle */}
          <button
            onClick={handleToggleWatchlist}
            title={isWatched ? 'Remover da Lista de Páginas Vigiadas' : 'Adicionar à Lista de Páginas Vigiadas (Watchlist)'}
            className={`p-1.5 rounded border transition flex items-center gap-1 text-xs font-semibold ${
              isWatched
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star size={13} fill={isWatched ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">{isWatched ? 'Vigiando' : 'Vigiar'}</span>
          </button>

          {/* Edit or Lock Indicator Button */}
          {isArticleLocked && !isModeratorOrAdmin ? (
            <button
              onClick={() =>
                alert(
                  `🔒 Artigo Protegido pela Moderação.\n\nMotivo: ${
                    localArticle.lockReason || 'Proteção contra edições de usuários comuns'
                  }\nProtegido por: ${localArticle.lockedBy || 'Moderação'}\n\nApenas moderadores e administradores têm permissão para editar este verbete.`
                )
              }
              title={`Artigo Bloqueado pela Moderação: ${localArticle.lockReason || 'Edição restrita'}`}
              className="px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-semibold text-xs transition flex items-center gap-1 shadow-xs cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900"
            >
              <Lock size={12} className="text-amber-600 dark:text-amber-400" />
              <span>Bloqueado</span>
            </button>
          ) : (
            <button
              onClick={() => onEdit(localArticle)}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1 shadow-xs"
            >
              <Edit3 size={12} />
              Editar
            </button>
          )}

          {/* Botão de Moderação: Proteger / Desproteger Artigo */}
          {isModeratorOrAdmin && (
            <button
              onClick={() => setShowLockModal(true)}
              title={
                isArticleLocked
                  ? 'Remover proteção do artigo (permitir edições de usuários comuns)'
                  : 'Proteger artigo contra edições de usuários comuns'
              }
              className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1 border shadow-xs ${
                isArticleLocked
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {isArticleLocked ? <Lock size={12} /> : <Unlock size={12} />}
              <span className="hidden sm:inline">
                {isArticleLocked ? 'Protegido' : 'Proteger'}
              </span>
            </button>
          )}

          <button
            onClick={toggleSpeech}
            title={isPlayingAudio ? 'Parar leitura por voz' : 'Ouvir artigo por voz'}
            className={`p-1.5 rounded border border-slate-200 dark:border-slate-700 transition ${
              isPlayingAudio
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isPlayingAudio ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          {/* Reader Mode Button */}
          <button
            onClick={() => handleToggleReaderMode(true)}
            title="Ativar Modo de Leitura Imersivo (Sem distrações, texto centralizado e alta legibilidade) [Atalho: R]"
            className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <BookOpen size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Modo Leitura</span>
          </button>

          <button
            onClick={() => setShowPdfModal(true)}
            title="Exportar Artigo para Documento PDF"
            className="px-2 py-1 rounded border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition flex items-center gap-1 font-semibold text-xs shadow-xs"
          >
            <FileDown size={13} className="text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>

          {/* Ações Dinâmicas Injetadas por Extensões */}
          {extensionActions.map((act) => (
            <button
              key={act.id}
              onClick={() => {
                try {
                  act.onClick({
                    article: localArticle,
                    user,
                    triggerSpeech: toggleSpeech,
                    openReaderMode: () => handleToggleReaderMode(true),
                    notify: (msg) => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(msg);
                      }
                    },
                  });
                } catch (err) {
                  console.error(`Erro ao disparar ação '${act.id}':`, err);
                }
              }}
              title={act.tooltip || act.label}
              className="px-2.5 py-1 rounded border border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition flex items-center gap-1 font-semibold text-xs shadow-2xs cursor-pointer"
            >
              <Puzzle size={13} className="text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">{act.label}</span>
              {act.badge && (
                <span className="text-[9px] font-bold px-1 rounded bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100">
                  {act.badge}
                </span>
              )}
            </button>
          ))}

          <button
            onClick={handleShare}
            title="Copiar link do artigo"
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
          </button>

          <button
            onClick={handlePrint}
            title="Imprimir artigo"
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden sm:block"
          >
            <Printer size={13} />
          </button>

          <button
            onClick={handleExportMarkdown}
            title="Exportar Markdown"
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden sm:block"
          >
            <Download size={13} />
          </button>

          {user && (
            <button
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir o artigo "${article.titulo}"?`)) {
                  onDelete(article.id);
                }
              }}
              title="Excluir artigo"
              className="p-1.5 rounded border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* MediaWiki / Fandom High-Density Tab Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto no-print print:hidden article-tabs-nav">
        <button
          onClick={() => setActiveTab('article')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'article'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen size={13} /> Artigo
        </button>

        <button
          onClick={() => setActiveTab('talk')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'talk'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare size={13} />
          <span>Discussão</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {talkThreads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('source')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1 whitespace-nowrap ${
            activeTab === 'source'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCode size={13} /> Ver Código-Fonte
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History size={13} />
          <span>Histórico</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {historyCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('what-links-here')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'what-links-here'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Link2 size={13} />
          <span>Páginas Afluentes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {backlinks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`px-3 py-1.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Informações da Página
        </button>

        {isWazzimaGiyggArticle && (
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 font-bold'
                : 'border-transparent text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 bg-amber-500/10'
            }`}
          >
            <Calendar size={13} className="text-amber-500" />
            <span>Linha do Tempo (Dossiê A Verdade)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold font-mono">
              9 Marcos
            </span>
          </button>
        )}
      </div>

      {/* Tab: Talk Page */}
      {activeTab === 'talk' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 shadow-xs">
          <TalkPageView
            article={article}
            user={user}
            onNavigateToArticle={onNavigateToArticleById}
          />
        </div>
      )}

      {/* Tab: What Links Here */}
      {activeTab === 'what-links-here' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 shadow-xs">
          <WhatLinksHereView
            currentArticle={article}
            allArticles={allArticles}
            allPages={allPages}
            onNavigateToArticle={(id) => onNavigateToArticleById?.(id)}
            onNavigateToPage={onNavigateToPage}
          />
        </div>
      )}

      {/* Tab: History View */}
      {activeTab === 'history' && (
        <ArticleHistoryView
          article={article}
          onRestoreRevision={handleRestore}
          onEditArticle={() => onEdit(article)}
          onNavigateToUser={onNavigateToUser}
        />
      )}

      {/* Tab: Source Code View */}
      {activeTab === 'source' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileCode size={14} className="text-blue-600" />
              Código-fonte em sintaxe Wikitext / MediaWiki / Fandom
            </h3>
            <button
              onClick={handleCopySource}
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-slate-700"
            >
              {sourceCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              {sourceCopied ? 'Copiado!' : 'Copiar Wikitext'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
            {article.descricao}
          </pre>
        </div>
      )}

      {/* Tab: Info */}
      {activeTab === 'info' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
            <span>Metadados e Informações Técnicas</span>
            <span className="font-mono text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              ?uid={article.id}
            </span>
          </h3>

          {/* UID & Navigation Deep Links Card */}
          <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-850 bg-blue-50/40 dark:bg-blue-950/30 space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
              <Link2 size={14} className="text-blue-600" />
              <span>Navegação & Links Permanentes (UID)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Você pode acessar diretamente este artigo a qualquer momento digitando <code>?uid=</code> na barra de endereços do navegador:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">UID Primário (ID)</span>
                  <code className="font-bold text-blue-600 dark:text-blue-400">?uid={article.id}</code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(buildUidPermalink(article.id));
                    setCopiedUid(true);
                    setTimeout(() => setCopiedUid(false), 2000);
                  }}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                  title="Copiar link"
                >
                  <Copy size={12} />
                </button>
              </div>

              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">UID Semântico (Título)</span>
                  <code className="font-bold text-slate-700 dark:text-slate-300">?uid={article.titulo.replace(/\s+/g, '_')}</code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(buildUidPermalink(article.titulo.replace(/\s+/g, '_')));
                    setCopiedUid(true);
                    setTimeout(() => setCopiedUid(false), 2000);
                  }}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                  title="Copiar link"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Título do Artigo</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{article.titulo}</span>
            </div>
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Coleção / Page UID</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{article.pageUid}</span>
            </div>
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Data de Criação</span>
              <span className="text-slate-800 dark:text-slate-200">
                {new Date(article.dataCriacao).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Última Edição</span>
              <span className="text-slate-800 dark:text-slate-200">
                {new Date(article.dataEdicao || article.dataCriacao).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Tamanho do Wikitext</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{article.descricao.length} bytes</span>
            </div>
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Tempo Estimado de Leitura</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                ~{readingTimeMinutes} min ({wordCount.toLocaleString()} palavras)
              </span>
            </div>
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Licença de Publicação</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">GNU General Public License v3.0</span>
            </div>
          </div>

          {/* Export Article Box */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Exportação Editorial</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Baixe este artigo em formato PDF para leitura offline, impressão ou arquivamento.</span>
            </div>
            <button
              onClick={() => setShowPdfModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs shrink-0"
            >
              <FileDown size={13} />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Timeline (Dossiê A Verdade) */}
      {activeTab === 'timeline' && isWazzimaGiyggArticle && (
        <div className="space-y-4">
          <WazzimaGiyggTimeline
            onOpenDossier={(doc, tab) => {
              setDossierInitialDoc(doc || 'chronus');
              setDossierInitialTab(tab || 'text');
              setShowDossierModal(true);
            }}
          />
        </div>
      )}

      {/* Main Tab: Article View */}
      {activeTab === 'article' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
          {/* Article Content Pane (3 columns) */}
          <article ref={articlePaneRef} className="lg:col-span-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-4 sm:p-7 shadow-xs space-y-6 min-w-0 max-w-full overflow-x-clip">
            {/* Dedicated Print & PDF Export Document Header */}
            <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900 text-black not-prose">
              <div className="flex items-center justify-between text-[11px] text-slate-700 mb-1.5 font-mono">
                <span className="font-bold tracking-wider uppercase text-slate-900 text-xs">
                  WikiWorldWeb • A Enciclopédia Livre e Aberta
                </span>
                <span>https://wikiworldweb.org/?uid={localArticle.id}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Categoria: {localArticle.categoria || 'Geral'} • Versão {localArticle.versao || 1}.0 • {wordCount.toLocaleString()} palavras</span>
                <span>Data de Impressão: {new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            {/* Wikipedia-style Moderation Protection Banner */}
            {isArticleLocked && (
              <div className="p-3 sm:p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-200 text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100">
                    <span className="p-1 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                      <Lock size={14} />
                    </span>
                    <span>Artigo Protegido pela Moderação</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                    Apenas Moderadores & Admins
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                  Este verbete foi temporária ou permanentemente bloqueado para impedir edições de usuários comuns ou não autorizados.
                </p>
                {localArticle.lockReason && (
                  <div className="text-[11px] bg-white/70 dark:bg-slate-900/60 p-2 rounded border border-amber-200 dark:border-amber-800/80 text-slate-800 dark:text-slate-200">
                    <strong>Motivo da Proteção:</strong> {localArticle.lockReason}
                  </div>
                )}
                {localArticle.lockedBy && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Protegido por <strong>{localArticle.lockedBy}</strong>
                    {localArticle.lockedAt && ` em ${new Date(localArticle.lockedAt).toLocaleDateString('pt-BR')}`}
                  </div>
                )}
              </div>
            )}

            {/* Collection Protection Banner */}
            {isPageLocked && (
              <div className="p-2.5 sm:p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock size={13} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <span>
                    A coleção <strong>{page?.titulo}</strong> está protegida pela moderação.
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-mono">
                  Coleção Bloqueada
                </span>
              </div>
            )}

            {/* Article Header */}
            <header className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {localArticle.categoria || 'Geral'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Versão {localArticle.versao || 1}.0
                </span>
                {isArticleLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-700">
                    <Lock size={10} /> Protegido
                  </span>
                )}
                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                  <Star size={10} fill="currentColor" /> {ratingData.averageScore.toFixed(1)}/5 ({ratingData.totalVotes} votos)
                </div>
                <div
                  title={`Tempo estimado de leitura: ~${readingTimeMinutes} min (${wordCount.toLocaleString()} palavras baseadas no tamanho do texto)`}
                  className="flex items-center gap-1 text-[10px] text-blue-700 dark:text-blue-300 font-mono font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 shadow-2xs"
                >
                  <Clock size={10} className="text-blue-600 dark:text-blue-400" />
                  <span>~{readingTimeMinutes} min de leitura</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-normal font-serif-heading text-slate-900 dark:text-white leading-tight">
                {localArticle.titulo}
              </h1>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <div className="flex items-center gap-1">
                  <User size={11} />
                  <span>
                    Autor:{' '}
                    {onNavigateToUser && article.autor ? (
                      <button
                        onClick={() => onNavigateToUser(article.autor || '')}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                      >
                        {article.autor}
                      </button>
                    ) : (
                      <strong className="text-slate-700 dark:text-slate-300">
                        {article.autor || 'Anônimo'}
                      </strong>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={11} />
                  <span>
                    Atualizado:{' '}
                    {new Date(article.dataEdicao || article.dataCriacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={11} />
                  <span>{article.visualizacoes || 1} visualizações</span>
                </div>
                <div
                  title={`Tempo de leitura estimado a ~200 palavras por minuto (${wordCount.toLocaleString()} palavras)`}
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold"
                >
                  <Clock size={11} />
                  <span>~{readingTimeMinutes} min de leitura</span>
                </div>
              </div>

              {/* Reading font adjuster */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 no-print print:hidden article-font-adjuster">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Type size={11} /> TAMANHO:
                </span>
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {[14, 15, 17, 19].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFontSize(s)}
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition ${
                        fontSize === s
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {s === 14 ? 'A-' : s === 15 ? 'A' : s === 17 ? 'A+' : 'A++'}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            {/* Comitê de Ética em Pesquisa com Seres Humanos (CEP / CONEP) */}
            {article.comiteEtica && article.comiteEtica.statusEtica !== 'nao_se_aplica' && (
              <div className="not-prose my-3">
                <ResearchEthicsBadge info={article.comiteEtica} variant="card" />
              </div>
            )}

            {/* WazzimaGiygg Dossier Timeline Spotlight Banner */}
            {isWazzimaGiyggArticle && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-indigo-900/15 border-2 border-amber-400/80 dark:border-amber-600/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 not-prose no-print print:hidden">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold font-mono text-[10px] uppercase">
                      Componente Especial Interativo
                    </span>
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      Linha do Tempo dos Fatos & Dossiê "A Verdade"
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Acompanhe cronologicamente todos os 9 marcos dos fatos, perseguições de Chronus, crimes contra a honra, quebra da LGPD e a criação da WikiWorldWeb.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Calendar size={14} />
                    <span>Ver Linha do Tempo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDossierInitialDoc('chronus');
                      setDossierInitialTab('text');
                      setShowDossierModal(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Scale size={13} className="text-rose-600" />
                    <span>Dossiê 47 Págs</span>
                  </button>
                </div>
              </div>
            )}

            {/* Gerador de Índice Automático (Table of Contents) no Topo do Artigo */}
            <TableOfContents
              containerRef={contentRef}
              containerSelector=".wiki-rendered-content"
              articleId={localArticle.id}
              articleTitle={localArticle.titulo}
              htmlContent={html}
              initialToc={toc}
              onNavigateToSection={scrollToSection}
              activeSectionId={activeSectionId}
              variant="top"
              wordCount={wordCount}
            />

            {/* Rendered HTML Content */}
            <div
              ref={contentRef}
              style={{ fontSize: `${fontSize}px` }}
              className="wiki-rendered-content font-wiki-body"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Embedded Visual Timeline inside Article */}
            {isWazzimaGiyggArticle && (
              <div className="pt-6 border-t-2 border-amber-300/60 dark:border-amber-700/60 space-y-4 not-prose">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold">
                      <Scale size={18} />
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                        Linha do Tempo Visual: Fatos Cronológicos e Eventos do Dossiê "A Verdade"
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Navegue interativamente pelos 9 marcos factuais catalogados na biografia e nos dossiês oficiais de WazzimaGiygg.
                      </p>
                    </div>
                  </div>
                </div>

                <WazzimaGiyggTimeline
                  onOpenDossier={(doc, tab) => {
                    setDossierInitialDoc(doc || 'chronus');
                    setDossierInitialTab(tab || 'text');
                    setShowDossierModal(true);
                  }}
                />
              </div>
            )}

            {/* Wikidot / Fandom Categories Footer Bar */}
            {allCategories.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2 flex-wrap not-prose">
                <div className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  <Folder size={13} className="text-amber-500" />
                  <span>Categorias:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {allCategories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium text-[11px]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fandom-Style Community Rating & Feedback Box */}
            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 not-prose no-print print:hidden article-rating-container">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" fill="currentColor" />
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 font-serif-heading">
                    Avaliação Comunitária do Artigo
                  </h4>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Média: <strong>{ratingData.averageScore.toFixed(1)}</strong> / 5.0 ({ratingData.totalVotes} votos)
                </div>
              </div>

              {!hasRated ? (
                <form onSubmit={handleSubmitRating} className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Sua nota:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSelectedRating(star)}
                          className="p-1 text-slate-300 hover:text-amber-400 transition"
                        >
                          <Star
                            size={18}
                            className={star <= selectedRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Deixe um comentário sobre a qualidade ou precisão do artigo..."
                      className="flex-1 text-xs px-3 py-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                    >
                      <Send size={11} /> Avaliar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <Check size={14} /> Obrigado pelo seu feedback! Sua avaliação ajuda a aprimorar a qualidade enciclopédica.
                </div>
              )}

              {/* Recent Community Comments */}
              {ratingData.feedbacks && ratingData.feedbacks.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
                    Comentários Recentes de Leitores:
                  </span>
                  {ratingData.feedbacks.slice(0, 3).map((fb, idx) => (
                    <div key={idx} className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded text-slate-700 dark:text-slate-300 flex items-start justify-between gap-2">
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">{fb.autor}:</strong> “{fb.comentario}”
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500 flex-shrink-0 text-[10px]">
                        ★ {fb.nota}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Widgets Dinâmicos Injetados por Extensões Ativas */}
            {extensionWidgets.length > 0 && (
              <div className="space-y-4 no-print print:hidden">
                {extensionWidgets.map((wdg) => (
                  <div
                    key={wdg.id}
                    className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-slate-900/40 shadow-xs"
                  >
                    {wdg.title && (
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-2.5 pb-2 border-b border-purple-100 dark:border-purple-900/30">
                        <Puzzle size={13} className="text-purple-600 dark:text-purple-400" />
                        <span>{wdg.title}</span>
                      </div>
                    )}
                    {wdg.render && wdg.render(localArticle, user)}
                    {wdg.component && <wdg.component article={localArticle} user={user} />}
                  </div>
                ))}
              </div>
            )}

            {/* Article Footer */}
            <footer className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono no-print print:hidden article-interactive-footer">
              <div>
                Doc ID: <code className="font-mono text-slate-600 dark:text-slate-300">{article.id}</code> (Coleção: <code className="font-mono text-slate-600 dark:text-slate-300">{article.pageUid}</code>)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(article)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Editar este artigo
                </button>
                <span>•</span>
                <button
                  onClick={() => setActiveTab('talk')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Discussão ({talkThreads.length})
                </button>
                <span>•</span>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Histórico ({historyCount})
                </button>
                <span>•</span>
                <button
                  onClick={handleExportJson}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  JSON Raw
                </button>
              </div>
            </footer>

            {/* Dedicated Print & PDF Export Document Footer */}
            <div className="hidden print:block mt-8 pt-4 border-t border-slate-400 text-[10px] text-slate-600 font-sans not-prose">
              <p className="font-semibold text-slate-800">
                WikiWorldWeb — Enciclopédia Livre, Rápida e Sem Anúncios.
              </p>
              <p className="mt-0.5">
                Conteúdo disponibilizado sob licença Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC-BY-SA 4.0).
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5 font-mono">
                Identificador Permanente (UID): {localArticle.id} • Coleção: {localArticle.pageUid}
              </p>
            </div>
          </article>

          {/* Table of Contents & Sidebar info (1 column) */}
          <aside className="space-y-4 sticky top-16 no-print print:hidden article-tools-sidebar">
            {/* Automatic Table of Contents Component (parses h1, h2, h3 in active article and provides jump navigation) */}
            <TableOfContents
              containerRef={contentRef}
              containerSelector=".wiki-rendered-content"
              articleId={localArticle.id}
              articleTitle={localArticle.titulo}
              htmlContent={html}
              initialToc={toc}
              onNavigateToSection={scrollToSection}
              activeSectionId={activeSectionId}
              variant="sidebar"
              wordCount={wordCount}
            />

            {/* Quick Special Links Navigation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-3 text-xs space-y-2">
              <h4 className="font-bold text-[11px] uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>🛠 Ferramentas</span>
              </h4>
              <ul className="space-y-1 text-[11px]">
                <li>
                  <button
                    onClick={() => setActiveTab('what-links-here')}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-full text-left"
                  >
                    <Link2 size={11} /> Páginas Afluentes ({backlinks.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('talk')}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-full text-left"
                  >
                    <MessageSquare size={11} /> Página de Discussão ({talkThreads.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('source')}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-full text-left"
                  >
                    <FileCode size={11} /> Ver Código-Fonte
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('info')}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-full text-left"
                  >
                    <Sparkles size={11} /> Metadados da Página
                  </button>
                </li>
                <li className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleToggleReaderMode(true)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 w-full text-left font-semibold"
                  >
                    <BookOpen size={11} /> Modo de Leitura Imersivo
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowPdfModal(true)}
                    className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 w-full text-left font-semibold"
                  >
                    <FileDown size={11} /> Exportar como PDF
                  </button>
                </li>
              </ul>
            </div>

            {/* Quick Encyclopedia Box */}
            <div className="bg-[#fffdf0] dark:bg-[#1a1708] border border-[#eaddc5] dark:border-[#52441a] rounded p-3 text-xs text-[#855e00] dark:text-[#e0c46b] space-y-2">
              <h4 className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                <span>📖</span> Licença & Uso
              </h4>
              <p className="leading-snug text-[11px]">
                Artigo disponível sob a <strong>GNU General Public License v3.0</strong>. Conteúdo enciclopédico livre.
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* Floating Bottom TOC and Reader Controls on Mobile */}
      {activeTab === 'article' && (
        <MobileArticleTOC
          toc={toc}
          fontSize={fontSize}
          isPlayingAudio={isPlayingAudio}
          isWatched={isWatched}
          onFontSizeChange={setFontSize}
          onToggleSpeech={toggleSpeech}
          onToggleWatch={handleToggleWatchlist}
          onShare={handleShare}
        />
      )}

      {/* PDF Export Modal */}
      {showPdfModal && (
        <PdfExportModal
          article={localArticle}
          pageName={page?.titulo || 'WikiWorldWeb'}
          articleContentRef={contentRef}
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
        />
      )}

      {/* Moderation Lock Modal */}
      {showLockModal && (
        <ModerationLockModal
          isOpen={showLockModal}
          onClose={() => setShowLockModal(false)}
          targetType="article"
          targetTitle={localArticle.titulo}
          isCurrentlyLocked={isArticleLocked}
          currentReason={localArticle.lockReason}
          lockedBy={localArticle.lockedBy}
          onConfirm={handleToggleLockArticle}
        />
      )}

      {/* Irregularidades & Chronus Dossier Modal */}
      {showDossierModal && (
        <IrregularidadesDossierModal
          isOpen={showDossierModal}
          onClose={() => setShowDossierModal(false)}
          initialDocument={dossierInitialDoc}
          initialTab={dossierInitialTab}
        />
      )}
    </div>
  );
};
