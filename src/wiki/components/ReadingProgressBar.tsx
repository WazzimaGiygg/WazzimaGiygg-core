import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ArrowUp,
  Volume2,
  VolumeX,
  FileText,
  Sparkles,
  TrendingUp,
  Check,
} from 'lucide-react';
import { WikiArticle } from '../types';

interface ReadingProgressBarProps {
  contentRef: React.RefObject<HTMLElement | null>;
  containerRef?: React.RefObject<HTMLElement | null>;
  article: WikiArticle;
  activeTab?: string;
  isPlayingAudio?: boolean;
  onToggleSpeech?: () => void;
  onOpenReaderMode?: () => void;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  contentRef,
  containerRef,
  article,
  activeTab = 'article',
  isPlayingAudio = false,
  onToggleSpeech,
  onOpenReaderMode,
}) => {
  const [progress, setProgress] = useState(0);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  // Compute total words and reading time estimates
  const { totalWords, totalMinutes, remainingMinutes } = useMemo(() => {
    const text = article.descricao || '';
    // Strip wikitext markup for realistic word count
    const cleanText = text
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
      .replace(/==+[^=]+==+/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\{\{[^}]*\}\}/g, '');
    const words = cleanText.trim().split(/\s+/).filter(Boolean).length;
    // Average reading speed: 200 words per minute
    const totalMins = Math.max(1, Math.ceil(words / 200));
    const remainingMins = Math.max(
      0,
      Math.ceil(totalMins * (1 - progress / 100))
    );
    return {
      totalWords: words,
      totalMinutes: totalMins,
      remainingMinutes: remainingMins,
    };
  }, [article.descricao, progress]);

  // Calculate reading progress as the user scrolls
  const calculateScrollProgress = useCallback(() => {
    // Only calculate reading progress when viewing the article tab
    if (activeTab !== 'article') {
      setProgress(0);
      setIsScrolledDown(false);
      setIsFinished(false);
      return;
    }

    const target = contentRef.current || containerRef?.current;
    if (!target) {
      setProgress(0);
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top + window.scrollY;
    const targetHeight = targetRect.height;
    const viewportHeight = window.innerHeight;
    const currentScrollY = window.scrollY;

    // Header offset to start counting when article content reaches header bottom
    const headerOffset = 80;
    const startPoint = targetTop - headerOffset;
    // End point when the bottom of article content is mostly in view
    const endPoint = targetTop + targetHeight - viewportHeight * 0.75;

    // Toggle sticky mini-bar when scrolled past top section
    setIsScrolledDown(currentScrollY > 160);

    if (endPoint <= startPoint) {
      // Content is very short and fits comfortably in viewport
      const shortProgress = currentScrollY > 40 ? 100 : 0;
      setProgress(shortProgress);
      setIsFinished(shortProgress === 100);
      return;
    }

    if (currentScrollY <= startPoint) {
      setProgress(0);
      setIsFinished(false);
    } else if (currentScrollY >= endPoint) {
      setProgress(100);
      setIsFinished(true);
    } else {
      const rawPct = ((currentScrollY - startPoint) / (endPoint - startPoint)) * 100;
      const clampedPct = Math.min(100, Math.max(0, Math.round(rawPct)));
      setProgress(clampedPct);
      setIsFinished(clampedPct >= 98);
    }
  }, [contentRef, containerRef, activeTab]);

  useEffect(() => {
    window.addEventListener('scroll', calculateScrollProgress, { passive: true });
    window.addEventListener('resize', calculateScrollProgress, { passive: true });
    // Initial calculation
    calculateScrollProgress();

    return () => {
      window.removeEventListener('scroll', calculateScrollProgress);
      window.removeEventListener('resize', calculateScrollProgress);
    };
  }, [calculateScrollProgress, article.id, article.descricao]);

  // Click on progress track to seek / jump to that relative part of the article
  const handleSeek = (ratio: number) => {
    const target = contentRef.current || containerRef?.current;
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top + window.scrollY;
    const targetHeight = targetRect.height;
    const viewportHeight = window.innerHeight;
    const headerOffset = 80;
    const startPoint = targetTop - headerOffset;
    const endPoint = targetTop + targetHeight - viewportHeight * 0.75;

    const targetY = startPoint + (endPoint - startPoint) * ratio;
    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth',
    });
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    handleSeek(ratio);
  };

  const handleTrackMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
    setHoverPosition(pct);
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {/* 1. Global Ultra-Slim Viewport Edge Progress Line (Fixed at top-0) */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none transition-opacity duration-300 select-none"
        style={{ opacity: progress > 0 ? 1 : 0 }}
      >
        <div className="w-full h-full bg-slate-200/50 dark:bg-slate-800/50">
          <div
            className={`h-full transition-all duration-150 ease-out shadow-[0_0_8px_rgba(59,130,246,0.6)] ${
              isFinished
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400'
                : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 dark:from-blue-400 dark:via-cyan-300 dark:to-emerald-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 2. Embedded Reading Progress Dashboard at the top of ArticleViewer */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-900/90 dark:via-blue-950/20 dark:to-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 shadow-xs space-y-2.5 transition-all select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Left: Progress Status & Reading Metrics */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                isFinished
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                  : progress > 0
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {isFinished ? (
                <CheckCircle2 size={16} />
              ) : (
                <BookOpen size={15} />
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Progresso de Leitura
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold transition-all ${
                  isFinished
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : progress > 0
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {progress}%
              </span>
            </div>

            {/* Reading Stats Badge */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="hidden md:inline">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} className="text-slate-400" />
                {isFinished ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Artigo concluído!
                  </span>
                ) : progress > 0 ? (
                  <span>
                    ~{remainingMinutes} min restantes{' '}
                    <span className="text-slate-400">({totalMinutes} min total)</span>
                  </span>
                ) : (
                  <span>~{totalMinutes} min de leitura</span>
                )}
              </span>

              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <FileText size={12} className="text-slate-400" />
                <span>{totalWords.toLocaleString()} palavras</span>
              </span>
            </div>
          </div>

          {/* Right: Quick Controls (Scroll to Top & Speech Audio) */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            {onOpenReaderMode && (
              <button
                type="button"
                onClick={onOpenReaderMode}
                title="Entrar no Modo de Leitura Imersivo (Sem distrações) [Atalho: R]"
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1 cursor-pointer"
              >
                <BookOpen size={12} className="text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Modo Leitura</span>
              </button>
            )}

            {onToggleSpeech && (
              <button
                type="button"
                onClick={onToggleSpeech}
                title={isPlayingAudio ? 'Parar leitura por voz' : 'Ouvir artigo por voz'}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer border ${
                  isPlayingAudio
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {isPlayingAudio ? <VolumeX size={12} /> : <Volume2 size={12} />}
                <span className="hidden sm:inline">{isPlayingAudio ? 'Parar Áudio' : 'Ouvir'}</span>
              </button>
            )}

            {progress > 5 && (
              <button
                type="button"
                onClick={handleScrollToTop}
                title="Voltar ao início do artigo"
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowUp size={12} />
                <span>Topo</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Progress Track */}
        <div className="relative">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso de leitura do artigo"
            onClick={handleTrackClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              setHoverPosition(null);
            }}
            onMouseMove={handleTrackMouseMove}
            title="Clique para saltar para este ponto do artigo"
            className="group relative h-2.5 sm:h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300/70 dark:border-slate-700 cursor-pointer overflow-hidden transition-all hover:h-3.5"
          >
            {/* Active Filled Bar */}
            <div
              className={`h-full transition-all duration-150 ease-out relative ${
                isFinished
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shadow-sm'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-sm'
              }`}
              style={{ width: `${progress}%` }}
            >
              {/* Subtle shining highlight animation */}
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Hover marker guide */}
            {isHovered && hoverPosition !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-900/60 dark:bg-white/60 pointer-events-none"
                style={{ left: `${hoverPosition}%` }}
              />
            )}
          </div>

          {/* Reading milestones (25%, 50%, 75%) */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 px-1 pt-1 select-none">
            <span>Início (0%)</span>
            <span className="hidden sm:inline">25%</span>
            <span>Metade (50%)</span>
            <span className="hidden sm:inline">75%</span>
            <span className={isFinished ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
              {isFinished ? 'Concluído (100%)' : 'Fim (100%)'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sticky Floating Mini-Bar (Appears when user scrolls down into the article) */}
      {isScrolledDown && (
        <aside
          aria-label="Barra flutuante de progresso de leitura"
          className="sticky top-14 sm:top-16 z-30 animate-in fade-in slide-in-from-top-2 duration-200 select-none"
        >
          <div className="rounded-xl bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md py-1.5 px-3 flex items-center justify-between gap-3">
            {/* Left: Article title & reading status */}
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 ${
                  isFinished
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                }`}
              >
                {isFinished ? <Check size={12} /> : <BookOpen size={12} />}
              </span>

              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-xs md:max-w-sm">
                {article.titulo}
              </span>

              <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                {progress}%
              </span>
            </div>

            {/* Middle: Slim clickable progress track */}
            <div
              onClick={handleTrackClick}
              title="Clique para navegar pelo artigo"
              className="flex-1 max-w-xs h-2 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 cursor-pointer overflow-hidden hidden sm:block"
            >
              <div
                className={`h-full transition-all duration-150 ease-out ${
                  isFinished
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                {isFinished ? 'Concluído' : `~${remainingMinutes} min`}
              </span>

              <button
                type="button"
                onClick={handleScrollToTop}
                title="Voltar ao topo do artigo"
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowUp size={11} />
                <span className="hidden xs:inline">Topo</span>
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
