import React, { useState, useMemo } from 'react';
import {
  Star,
  Award,
  Sparkles,
  Shuffle,
  Calendar,
  Clock,
  Eye,
  User,
  ArrowRight,
  BookOpen,
  Share2,
  Check,
  Layers,
  RotateCcw,
  CheckCircle2,
  Tag,
  Quote,
  TrendingUp,
  FileText,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WikiArticle, WikiPage } from '../types';
import { getCleanExcerpt } from '../utils/wikitextParser';
import { getLanguageByCode } from '../utils/languages';
import { CURATED_FEATURED_ARTICLES } from '../data/curatedArticles';

export { CURATED_FEATURED_ARTICLES };

/**
 * Calculates a quality score (0 - 100) for a given article
 */
export function calculateArticleQualityScore(article: WikiArticle): number {
  let score = 0;
  const content = article.descricao || '';
  const len = content.length;

  // Length scoring (up to 40 pts)
  if (len >= 3000) score += 40;
  else if (len >= 1500) score += 32;
  else if (len >= 800) score += 24;
  else if (len >= 300) score += 16;
  else if (len >= 100) score += 8;

  // Resumo / structured lead (up to 15 pts)
  if (article.resumo && article.resumo.trim().length > 25) {
    score += 15;
  }

  // Categories & Tags (up to 15 pts)
  if (article.categoria && article.categoria !== 'Sem Categoria') {
    score += 8;
  }
  if (article.tags && article.tags.length > 0) {
    score += Math.min(7, article.tags.length * 2);
  }

  // Views & Version maturity (up to 15 pts)
  if ((article.visualizacoes || 0) > 10) score += 5;
  if ((article.visualizacoes || 0) > 50) score += 3;
  if ((article.versao || 1) > 1) score += 7;

  // Section headings / rich formatting (up to 15 pts)
  if (content.includes('==') || content.includes('##') || /<h[2-4]/i.test(content)) {
    score += 10;
  }
  if (content.includes('[[') || content.includes('*') || content.includes('http')) {
    score += 5;
  }

  return Math.min(100, Math.max(10, score));
}

/**
 * Deterministic hash based on a date string YYYY-MM-DD
 */
function getDailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Format current date nicely in Portuguese
 */
function formatTodayDate(date: Date): string {
  try {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Extract 2-3 key takeaways or bullet points from content
 */
function extractHighlights(article: WikiArticle): string[] {
  // If already specified in curated item
  if ((article as any).highlights && Array.isArray((article as any).highlights)) {
    return (article as any).highlights;
  }

  const content = article.descricao || '';
  const lines = content.split('\n');
  const bulletLines = lines
    .map((l) => l.trim())
    .filter((l) => l.startsWith('* ') || l.startsWith('- ') || l.startsWith('• '))
    .map((l) => l.replace(/^[\*\-\•]\s*/, '').trim())
    .filter((l) => l.length > 15 && l.length < 180);

  if (bulletLines.length >= 2) {
    return bulletLines.slice(0, 3);
  }

  // Extract section titles
  const sectionHeadings = lines
    .map((l) => l.trim())
    .filter((l) => l.startsWith('==') || l.startsWith('##'))
    .map((l) => l.replace(/^[=\#\s]+|[=\#\s]+$/g, '').trim())
    .filter((l) => l.length > 4 && l.length < 80);

  if (sectionHeadings.length >= 2) {
    return sectionHeadings.slice(0, 3).map((s) => `Tópico chave: ${s}`);
  }

  // Fallback to sentence fragments from resumo or text
  if (article.resumo) {
    const sentences = article.resumo.split('. ').filter((s) => s.length > 20);
    if (sentences.length >= 2) {
      return sentences.slice(0, 3).map((s) => s.replace(/\.$/, '') + '.');
    }
  }

  return [
    'Conteúdo aprofundado com rigor editorial e referências documentadas.',
    'Disponível sob licença livre GNU GPL v3 sem restrições ou paywalls.',
    'Aberto para melhorias colaborativas e revisões de pares da comunidade.',
  ];
}

interface WikiFeaturedArticleProps {
  articles: WikiArticle[];
  pages: WikiPage[];
  onSelectArticle: (articleId: string) => void;
  onSelectPage: (pageUid: string) => void;
  onCreateArticleClick?: (pageUid?: string) => void;
}

export const WikiFeaturedArticle: React.FC<WikiFeaturedArticleProps> = ({
  articles,
  pages,
  onSelectArticle,
  onSelectPage,
  onCreateArticleClick,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [shuffleOffset, setShuffleOffset] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Today's date representation
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const formattedDate = useMemo(() => formatTodayDate(today), [today]);

  // Determine eligible candidates
  const { candidates, isCuratedFallback } = useMemo(() => {
    const safeArticles = (articles || []).filter(
      (a) => a && a.titulo && (a.descricao || a.resumo)
    );

    // Score all user articles
    const scored = safeArticles.map((art) => ({
      article: art,
      score: calculateArticleQualityScore(art),
    }));

    // Filter high quality: threshold score >= 25, or top 50%
    const highQuality = scored
      .filter((item) => item.score >= 25)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.article);

    if (highQuality.length > 0) {
      return { candidates: highQuality, isCuratedFallback: false };
    }

    if (safeArticles.length > 0) {
      // If none reached 25, use whatever safe articles exist
      return { candidates: safeArticles, isCuratedFallback: false };
    }

    // Otherwise use curated editorial fallback pool
    return { candidates: CURATED_FEATURED_ARTICLES, isCuratedFallback: true };
  }, [articles]);

  // Compute daily deterministic index + shuffle offset
  const dailySeed = useMemo(() => getDailySeed(todayKey), [todayKey]);

  const activeIndex = useMemo(() => {
    if (candidates.length === 0) return 0;
    const baseIndex = dailySeed % candidates.length;
    return (baseIndex + shuffleOffset) % candidates.length;
  }, [candidates.length, dailySeed, shuffleOffset]);

  const featured = candidates[activeIndex] || CURATED_FEATURED_ARTICLES[0];
  const isShuffled = shuffleOffset > 0;

  // Calculate quality score and metrics
  const qualityScore = useMemo(
    () => calculateArticleQualityScore(featured),
    [featured]
  );

  const highlights = useMemo(() => extractHighlights(featured), [featured]);

  const excerpt = useMemo(() => {
    if (featured.resumo && featured.resumo.length > 40) {
      return featured.resumo;
    }
    return getCleanExcerpt(featured.descricao || '', 280);
  }, [featured]);

  // Approximate reading time in minutes
  const readingTimeMinutes = useMemo(() => {
    const wordCount = (featured.descricao || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 180));
  }, [featured.descricao]);

  // Find associated page info
  const associatedPage = useMemo(() => {
    return (pages || []).find((p) => p && p.uid === featured.pageUid);
  }, [pages, featured.pageUid]);

  const langInfo = getLanguageByCode(featured.idioma || 'pt');

  // Handle clicking the article
  const handleReadArticle = () => {
    if (isCuratedFallback && !articles?.some((a) => a.id === featured.id)) {
      // If it's a curated article not yet saved in Firestore, toggle preview expansion
      setIsExpanded(true);
      // If parent has a collection or editor, user can also explore
    } else {
      onSelectArticle(featured.id);
    }
  };

  const handleNextRandom = () => {
    setShuffleOffset((prev) => prev + 1);
  };

  const handleResetToDaily = () => {
    setShuffleOffset(0);
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href.split('#')[0];
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${featured.titulo} — Artigo em Destaque na WikiWorldWeb: ${shareUrl}`);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <section
      aria-label="Artigo em Destaque do Dia"
      className="relative overflow-hidden rounded-xl border border-amber-300/80 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-amber-950/20 shadow-sm transition-all hover:shadow-md"
    >
      {/* Decorative top gold accent band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

      <div className="p-4 sm:p-6">
        {/* Header Ribbon / Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-amber-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-white shadow-xs">
              <Star size={13} className="fill-amber-100 text-amber-100 animate-pulse" />
              <span>{isShuffled ? 'Artigo Sorteado' : 'Artigo em Destaque do Dia'}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60">
              <Award size={12} className="text-amber-600 dark:text-amber-400" />
              <span>Padrão Ouro • Score {qualityScore}/100</span>
            </span>

            {isCuratedFallback && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Seleção Editorial
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-sans">
            <div className="flex items-center gap-1 text-[11px]">
              <Calendar size={12} className="text-amber-600 dark:text-amber-400" />
              <span className="capitalize">{formattedDate}</span>
            </div>

            {/* Randomize / Daily toggle buttons */}
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={handleNextRandom}
                title="Sortear outro artigo de alta qualidade"
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-white dark:bg-slate-800 hover:bg-amber-100/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <Shuffle size={12} className="text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Sortear Outro</span>
              </button>

              {isShuffled && (
                <button
                  type="button"
                  onClick={handleResetToDaily}
                  title="Voltar ao destaque oficial do dia de hoje"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span className="hidden sm:inline">Artigo de Hoje</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Presentation Body */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Title, Excerpt, Highlights (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-3.5">
            {/* Category and Language Meta */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              {featured.categoria && (
                <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-amber-800 dark:text-amber-300">
                  <Tag size={12} />
                  <span>{featured.categoria}</span>
                </span>
              )}

              <span>•</span>

              <span className="inline-flex items-center gap-1 text-[11px]">
                <span>{langInfo.flag}</span>
                <span>{langInfo.nativeName}</span>
              </span>

              <span>•</span>

              <span className="inline-flex items-center gap-1 text-[11px]">
                <Clock size={12} />
                <span>{readingTimeMinutes} min de leitura</span>
              </span>

              <span>•</span>

              <span className="inline-flex items-center gap-1 text-[11px]">
                <Eye size={12} />
                <span>{(featured.visualizacoes || 1).toLocaleString()} leituras</span>
              </span>
            </div>

            {/* Title */}
            <h2
              onClick={handleReadArticle}
              className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif-heading text-slate-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-400 transition cursor-pointer leading-tight tracking-tight"
            >
              {featured.titulo}
            </h2>

            {/* Lead Excerpt */}
            <div className="relative">
              <Quote
                size={28}
                className="absolute -top-1 -left-1 text-amber-300/40 dark:text-amber-600/20 -z-0 pointer-events-none select-none"
              />
              <p className="relative z-10 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-justify sm:text-left">
                {excerpt}
              </p>
            </div>

            {/* Highlights bullet box */}
            {highlights && highlights.length > 0 && (
              <div className="bg-amber-100/50 dark:bg-slate-800/80 rounded-lg p-3 border border-amber-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 font-sans">
                  <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                  <span>Pontos em Destaque:</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-sans pl-1">
                  {highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2
                        size={13}
                        className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags row */}
            {featured.tags && featured.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Tópicos:
                </span>
                {featured.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-sans"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information Card & Action Buttons (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col gap-3 justify-between h-full bg-white dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-lg border border-amber-200/80 dark:border-slate-700/80 shadow-2xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Ficha do Artigo
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                  v{featured.versao || 1}.0
                </span>
              </div>

              {/* Author & Collection metadata */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <User size={13} className="text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-mono">Autor principal:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {featured.autor || 'Comunidade WikiWorldWeb'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-mono">Coleção de Origem:</span>
                    <button
                      type="button"
                      onClick={() => onSelectPage(featured.pageUid)}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate block text-left"
                    >
                      {associatedPage?.titulo || `#${featured.pageUid}`}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Índice Editorial:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      Excelente ({qualityScore}/100)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
              <button
                type="button"
                id="btn-read-featured-article"
                onClick={handleReadArticle}
                className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer active:scale-98"
              >
                <BookOpen size={14} />
                <span>Ler Artigo Completo</span>
                <ArrowRight size={13} />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSelectPage(featured.pageUid)}
                  className="py-1.5 px-2 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Layers size={12} />
                  <span>Ver Coleção</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="py-1.5 px-2 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check size={12} className="text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={12} />
                      <span>Compartilhar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle in-place preview for curated articles */}
              {isCuratedFallback && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full text-center text-[11px] text-amber-700 dark:text-amber-400 hover:underline flex items-center justify-center gap-1 pt-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={12} /> Recolher Prévia Completa
                    </>
                  ) : (
                    <>
                      <ChevronDown size={12} /> Expandir Prévia do Conteúdo
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible full preview (especially useful for curated articles) */}
        {isExpanded && (
          <div className="mt-5 pt-4 border-t border-amber-200 dark:border-slate-800 animate-in fade-in space-y-3 bg-white/60 dark:bg-slate-900/60 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={15} className="text-blue-600" />
                <span>Transcrição do Artigo Destacado</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Fechar
              </button>
            </div>
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
              {featured.descricao}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
