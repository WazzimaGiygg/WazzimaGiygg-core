import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Edit3,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  Clock,
  Eye,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Globe2,
  Lock,
  Unlock,
} from 'lucide-react';
import { WikiPage, WikiArticle, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ALL_LANGUAGES, getLanguageByCode } from '../utils/languages';
import { getCleanExcerpt } from '../utils/wikitextParser';
import { ModerationLockModal } from './ModerationLockModal';
import { StorageService } from '../services/storageService';
import { WikiStatisticsPanel } from './WikiStatisticsPanel';
import { GoogleReaderRevenueDonation } from './GoogleReaderRevenueDonation';
import { WikiFeaturedArticle } from './WikiFeaturedArticle';

interface WikiHubProps {
  pages: WikiPage[];
  articles: WikiArticle[];
  user: UserProfile | null;
  searchQuery: string;
  onSelectPage: (pageUid: string) => void;
  onSelectArticle: (articleId: string) => void;
  onCreatePageClick: () => void;
  onCreateArticleClick: (pageUid?: string) => void;
  onOpenEditor: () => void;
  onNavigate?: (view: any) => void;
}

export const WikiHub: React.FC<WikiHubProps> = ({
  pages,
  articles,
  user,
  searchQuery,
  onSelectPage,
  onSelectArticle,
  onCreatePageClick,
  onCreateArticleClick,
  onOpenEditor,
  onNavigate,
}) => {
  const { currentLanguage, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('all');
  const [lockModalPage, setLockModalPage] = useState<WikiPage | null>(null);
  const [localPages, setLocalPages] = useState<WikiPage[]>(pages || []);

  const isModeratorOrAdmin = !!(user && (user.role === 'admin' || user.role === 'moderador'));

  React.useEffect(() => {
    setLocalPages(pages || []);
  }, [pages]);

  const handleToggleLockCollection = async (reason: string) => {
    if (!user || !lockModalPage) return;
    try {
      if (lockModalPage.isLocked) {
        const updated = await StorageService.unlockPage(lockModalPage.uid, user);
        setLocalPages((prev) => prev.map((p) => (p.uid === updated.uid ? updated : p)));
      } else {
        const updated = await StorageService.lockPage(lockModalPage.uid, user, reason);
        setLocalPages((prev) => prev.map((p) => (p.uid === updated.uid ? updated : p)));
      }
    } catch (err: any) {
      console.error('Erro ao bloquear coleção:', err);
      alert(err?.message || 'Falha ao alterar proteção da coleção.');
    }
  };

  // Extract all categories
  const safePages = localPages;
  const safeArticles = articles || [];
  const categories = ['Todas', ...Array.from(new Set(safePages.map((p) => p?.categoria).filter(Boolean)))];

  // Filter pages
  const filteredPages = useMemo(() => {
    return safePages.filter((page) => {
      if (!page) return false;
      const matchesCat = selectedCategory === 'Todas' || page.categoria === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        (page.titulo && page.titulo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (page.descricao && page.descricao.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (page.uid && page.uid.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (page.tags && page.tags.some((t) => t && t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesCat && matchesSearch;
    });
  }, [safePages, selectedCategory, searchQuery]);

  // Filter articles based on search query and language filter
  const matchingArticles = useMemo(() => {
    return safeArticles.filter((a) => {
      if (!a) return false;
      const matchesLang =
        selectedLanguageFilter === 'all' ||
        (a.idioma || 'pt').toLowerCase().startsWith(selectedLanguageFilter.toLowerCase());
      const matchesSearch =
        !searchQuery ||
        (a.titulo && a.titulo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.descricao && a.descricao.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.resumo && a.resumo.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesLang && matchesSearch;
    });
  }, [safeArticles, selectedLanguageFilter, searchQuery]);

  const totalViews = safeArticles.reduce((acc, a) => acc + (a?.visualizacoes || 0), 0);

  return (
    <div className="space-y-5 animate-in fade-in select-none font-sans">
      {/* High Density Portal Header / Welcome Banner */}
      <div className="bg-[#f8f9fa] dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4 max-w-3xl">
            <img
              src="/logo.png"
              alt="Logotipo WikiZero"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md shrink-0 hidden sm:block p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60"
            />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-xs font-mono">
                  {t('hub.welcome_badge')}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Globe2 size={12} className="text-blue-500" />
                  <span>{currentLanguage.flag} {currentLanguage.nativeName} ({currentLanguage.name})</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-900 dark:text-white tracking-tight leading-tight">
                {t('hub.welcome_title')}
              </h1>

              {/* Frase Principal da Wiki (Lema Oficial) */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-2xs">
                <span className="text-xl select-none" role="img" aria-label="Conhecimento">🏛️</span>
                <div className="flex-1 min-w-0">
                  <p className="font-serif italic font-bold text-sm sm:text-base text-blue-950 dark:text-blue-200 tracking-wide">
                    «Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans mt-0.5">
                    <strong className="text-blue-700 dark:text-blue-400 font-semibold">Frase Principal da Wiki</strong> • "Não, o Tempo não é o senhor do conhecimento!"
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {t('hub.welcome_desc')}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap lg:flex-col items-center gap-2 flex-shrink-0 w-full lg:w-auto">
            <button
              onClick={onCreatePageClick}
              className="flex-1 lg:w-48 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              {t('hub.btn_create_collection')}
            </button>
            <button
              onClick={onOpenEditor}
              className="flex-1 lg:w-48 px-3 py-1.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Edit3 size={14} />
              {t('hub.btn_editor')}
            </button>
          </div>
        </div>

        {/* Dense Statistics Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-white dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">{t('hub.stat_active_collections')}</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{pages.length}</span>
          </div>
          <div className="bg-white dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">{t('hub.stat_published_articles')}</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{articles.length}</span>
          </div>
          <div className="bg-white dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">{t('hub.stat_total_reads')}</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{(totalViews + 1420).toLocaleString()}</span>
          </div>
          <div className="bg-white dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">{t('hub.stat_license')}</span>
            <span className="text-base font-bold text-blue-600 dark:text-blue-400">GNU GPL v3</span>
          </div>
        </div>
      </div>

      {/* Componente de Artigo em Destaque do Dia (Alta Qualidade com Rotação Diária) */}
      <WikiFeaturedArticle
        articles={safeArticles}
        pages={safePages}
        onSelectArticle={onSelectArticle}
        onSelectPage={onSelectPage}
        onCreateArticleClick={onCreateArticleClick}
      />

      {/* Painel Interativo de Estatísticas com Gráfico Recharts */}
      <WikiStatisticsPanel
        pages={pages}
        articles={articles}
        currentUser={user}
        onNavigate={onNavigate}
        onCreateArticleClick={() => onCreateArticleClick()}
      />

      {/* Matching Search Articles results (if searching) */}
      {searchQuery && (
        <div className="bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{t('hub.search_results')}:</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">"{searchQuery}"</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {matchingArticles.length} {t('hub.articles_found')}
            </span>
          </div>

          {matchingArticles.length === 0 ? (
            <div className="py-4 text-center text-slate-400 text-xs">
              Nenhum artigo encontrado para o termo pesquisado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {matchingArticles.map((art) => {
                const artLang = getLanguageByCode(art.idioma || 'pt');
                return (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art.id)}
                    className="p-3 rounded border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs">{artLang.flag}</span>
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 transition truncate">
                          {art.titulo}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {art.resumo || getCleanExcerpt(art.descricao, 110)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">#{art.pageUid}</span>
                        <span>• {art.visualizacoes || 1} {t('hub.views')}</span>
                        <span className="uppercase px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {artLang.code}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 flex-shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Category & Language Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-xs">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mr-1">
            {t('hub.filter_category')}
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'Todas' ? t('hub.filter_all') : cat}
            </button>
          ))}
        </div>

        {/* Language Filter Dropdown */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-slate-400 hidden sm:inline">{t('hub.filter_language')}</span>
          <select
            value={selectedLanguageFilter}
            onChange={(e) => setSelectedLanguageFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">🌍 Todos os Idiomas</option>
            {ALL_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.nativeName} ({lang.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* High Density Collections Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
              {t('hub.collections_title')}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Coleções persistentes no banco de dados Firestore (`documentos`)
            </p>
          </div>
          <button
            onClick={onCreatePageClick}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Plus size={13} /> Nova Coleção
          </button>
        </div>

        {filteredPages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center my-4 space-y-3">
            <div className="text-3xl text-slate-400">📚</div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhuma coleção cadastrada no banco de dados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              O banco de dados Firestore está pronto para receber seus documentos e tópicos de enciclopédia.
            </p>
            <button
              onClick={onCreatePageClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus size={13} /> Criar Primeira Coleção
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPages.map((page) => {
              const pageArticles = safeArticles.filter((a) => {
                if (!a) return false;
                const matchesUid = a.pageUid === page.uid;
                const matchesLang =
                  selectedLanguageFilter === 'all' ||
                  (a.idioma || 'pt').toLowerCase().startsWith(selectedLanguageFilter.toLowerCase());
                return matchesUid && matchesLang;
              });

              return (
                <div
                  key={page.uid}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-3.5 shadow-xs hover:border-blue-500 dark:hover:border-blue-600 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-lg">{page.icon || '📄'}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                          {page.categoria}
                        </span>
                        {page.isLocked && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1"
                            title={`Coleção Protegida: ${page.lockReason || 'Apenas moderadores podem editar'}`}
                          >
                            <Lock size={10} /> Protegida
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isModeratorOrAdmin && (
                          <button
                            onClick={() => setLockModalPage(page)}
                            title={
                              page.isLocked
                                ? 'Desbloquear Coleção (Moderação)'
                                : 'Bloquear Coleção (Moderação)'
                            }
                            className={`p-1 rounded text-xs transition border ${
                              page.isLocked
                                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300 hover:text-amber-700 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {page.isLocked ? <Lock size={11} /> : <Unlock size={11} />}
                          </button>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          uid: {page.uid}
                        </span>
                      </div>
                    </div>

                    <h3
                      onClick={() => onSelectPage(page.uid)}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer font-serif-heading transition leading-snug"
                    >
                      {page.titulo}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                      {page.descricao}
                    </p>

                    {/* Subcollection articles preview list */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-mono">
                        {t('hub.articles_count')} ({pageArticles.length}):
                      </span>
                      {pageArticles.slice(0, 3).map((art) => {
                        const artLang = getLanguageByCode(art.idioma || 'pt');
                        return (
                          <div
                            key={art.id}
                            onClick={() => onSelectArticle(art.id)}
                            className="text-[11px] text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer flex items-center justify-between gap-1.5 py-0.5 truncate group"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-blue-600 text-[9px]">▪</span>
                              <span className="truncate">{art.titulo}</span>
                            </div>
                            <span className="text-[9px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-blue-500 flex-shrink-0 font-mono">
                              {artLang.flag} {artLang.code}
                            </span>
                          </div>
                        );
                      })}
                      {pageArticles.length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">
                          {t('hub.empty_collection')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      {pageArticles.length} {t('hub.articles_count')}
                    </span>
                    <div className="flex items-center gap-1">
                      {page.isLocked && !isModeratorOrAdmin ? (
                        <button
                          onClick={() =>
                            alert(
                              `🔒 Coleção Protegida pela Moderação.\n\nMotivo: ${
                                page.lockReason || 'Proteção contra alterações por usuários comuns'
                              }\nBloqueado por: ${page.lockedBy || 'Moderação'}\n\nNão é permitido criar novos artigos nesta coleção.`
                            )
                          }
                          title="Coleção bloqueada pela moderação"
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Lock size={11} className="text-amber-600" /> Protegida
                        </button>
                      ) : (
                        <button
                          onClick={() => onCreateArticleClick(page.uid)}
                          title="Adicionar artigo nesta coleção"
                          className="px-2 py-1 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                        >
                          <Plus size={11} /> Artigo
                        </button>
                      )}
                      <button
                        onClick={() => onSelectPage(page.uid)}
                        className="p-1 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition border border-blue-200 dark:border-blue-800"
                      >
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Direct Competitor Comparison Section (SEO & Value proposition) */}
      {onNavigate && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 border border-blue-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded border border-blue-400/40">
                Alternativa Aberta e Rápida
              </span>
              <h3 className="font-bold text-sm sm:text-base text-white">
                WikiWorldWeb vs Wikipédia, MediaWiki, Fandom e Wikidot
              </h3>
            </div>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Descubra por que a WikiWorldWeb é superior: <strong>100% livre de anúncios invasivos</strong> (ao contrário do Fandom),
              <strong>sem panelas burocráticas</strong> (ao contrário da Wikipédia), com <strong>arquitetura SPA ultrarrápida</strong> (superando o MediaWiki clássico)
              e <strong>11 temas visuais exclusivos</strong> (Minecraft, Roblox, REPO, Win95 e mais).
            </p>
          </div>

          <button
            id="btn-hub-open-comparison"
            onClick={() => onNavigate('comparison')}
            className="px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-2 transition shadow-xs flex-shrink-0 cursor-pointer active:scale-95"
          >
            <span>Ver Comparativo Detalhado</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* WazzimaGiygg Official Projects & Dossier Spotlight */}
      {onNavigate && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-black text-amber-100 rounded-xl p-4 sm:p-5 border border-amber-600/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded border border-amber-400/40">
                Criador & Portal Oficial
              </span>
              <h3 className="font-bold text-sm sm:text-base text-white">
                WazzimaGiygg: Projetos Oficiais e Esclarecimento sobre o Caso Wikipédia
              </h3>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Conheça o ecossistema de software livre desenvolvido por <strong>WazzimaGiygg</strong> (WikiWorldWeb, GitHub Wiki-alternative, Central de Suporte) e acerte as contas com a verdade: documentação detalhada e refutação cabal contra as perseguições administrativas e abusos de CheckUser da Wikipédia em língua portuguesa.
            </p>
          </div>

          <button
            id="btn-hub-open-wazzimagiygg"
            onClick={() => onNavigate('wazzimagiygg')}
            className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-xs flex-shrink-0 cursor-pointer active:scale-95"
          >
            <span>Conhecer Projetos & Dossiê</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* System Changelog & Updates Quick Access Banner */}
      {onNavigate && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-800/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-xs flex-shrink-0">
              <Sparkles size={20} className="text-amber-300 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Histórico de Atualizações & Registro de Melhorias
                </h3>
                <span className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-700">
                  v3.3.0 Ativa
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                Versão mobile otimizada, central de tickets 24h, conformidade LGPD e editor wikitexto.
                Acompanhe o changelog completo das melhorias inseridas no sistema.
              </p>
            </div>
          </div>

          <button
            id="btn-hub-open-updates"
            onClick={() => onNavigate('site-updates')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs flex-shrink-0 active:scale-95"
          >
            <span>Ver Notas de Versão</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Google Reader Revenue Manager Donation CTA Section */}
      <div className="pt-1">
        <GoogleReaderRevenueDonation
          variant="card"
          title="Apoie a WikiWorldWeb via Google Reader Revenue Manager"
          description="Sua doação garante a continuidade da enciclopédia livre, sem censura e sem anúncios comerciais. Clique no botão de chamada para ação para abrir o botão de doação oficial do Google."
        />
      </div>

      {/* Moderation Lock Modal for Collections */}
      {lockModalPage && (
        <ModerationLockModal
          isOpen={!!lockModalPage}
          onClose={() => setLockModalPage(null)}
          targetType="collection"
          targetTitle={lockModalPage.titulo}
          isCurrentlyLocked={!!lockModalPage.isLocked}
          currentReason={lockModalPage.lockReason}
          lockedBy={lockModalPage.lockedBy}
          onConfirm={handleToggleLockCollection}
        />
      )}
    </div>
  );
};
