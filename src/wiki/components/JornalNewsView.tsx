import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper,
  Search,
  Calendar,
  User,
  Eye,
  ExternalLink,
  RefreshCw,
  Share2,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Bookmark,
  ArrowLeft,
  Clock,
  Sparkles,
  Info,
  X,
  FileText,
  Tag,
} from 'lucide-react';
import { JornalArticle, JornalCategory } from '../types/news';
import { jornalService } from '../services/jornalService';
import { updateSEO } from '../utils/seoManager';

interface JornalNewsViewProps {
  onNavigateBack: () => void;
  onNavigateToArticle?: (title: string) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  todos: 'Todas as Notícias',
  politica: 'Política',
  economia: 'Economia',
  internacional: 'Internacional',
  tecnologia: 'Tecnologia',
  justiça: 'Justiça',
  justica: 'Justiça',
  esporte: 'Esporte',
  opiniao: 'Opinião',
  cultura: 'Cultura',
  educacao: 'Educação',
  'redes-sociais': 'Redes Sociais',
  investigacao: 'Investigação',
  geral: 'Geral',
};

const CATEGORY_COLORS: Record<string, string> = {
  politica: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  economia: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  internacional: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  tecnologia: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  justiça: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  justica: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  esporte: 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  opiniao: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  cultura: 'bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
  educacao: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'redes-sociais': 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  investigacao: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  geral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export const JornalNewsView: React.FC<JornalNewsViewProps> = ({
  onNavigateBack,
  onNavigateToArticle,
}) => {
  const [articles, setArticles] = useState<JornalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recentes' | 'antigos' | 'populares'>('recentes');
  const [selectedArticle, setSelectedArticle] = useState<JornalArticle | null>(null);
  const [copiedCitation, setCopiedCitation] = useState(false);

  useEffect(() => {
    updateSEO({
      view: 'news',
      title: 'Jornal WazzimaGiygg - Notícias e Investigações em Tempo Real',
      description:
        'Acesse a edição digital do Jornal WazzimaGiygg integrada ao WikiWorldWeb. Notícias independentes sobre política, economia, tecnologia, investigações e geopolítica.',
      breadcrumbs: [
        { name: 'Início', url: '/?uid=hub' },
        { name: 'Páginas Especiais', url: '/?uid=special-pages' },
        { name: 'Jornal WazzimaGiygg (Notícias)', url: '/?uid=news' },
      ],
    });

    loadArticles();
  }, []);

  const loadArticles = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await jornalService.getArticles(force);
      setArticles(data);
    } catch (err) {
      console.error('Erro ao carregar notícias:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredArticles = useMemo(() => {
    return jornalService.filterArticles(articles, selectedCategory, searchQuery, sortBy);
  }, [articles, selectedCategory, searchQuery, sortBy]);

  // Lead / Featured article
  const leadArticle = useMemo(() => {
    if (filteredArticles.length === 0) return null;
    const featured = filteredArticles.find((a) => a.destaque && a.imagemUrl);
    return featured || filteredArticles[0];
  }, [filteredArticles]);

  const secondaryArticles = useMemo(() => {
    if (!leadArticle) return filteredArticles;
    return filteredArticles.filter((a) => a.id !== leadArticle.id);
  }, [filteredArticles, leadArticle]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.categoria) set.add(a.categoria.toLowerCase());
    });
    return ['todos', ...Array.from(set)];
  }, [articles]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const calculateReadTime = (text: string) => {
    const words = text.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min de leitura`;
  };

  const handleCopyCitation = (article: JornalArticle) => {
    const citation = `{{Citar jornal |titulo=${article.titulo} |autor=${article.autorNome} |data=${formatDate(article.dataPublicacao)} |url=https://jornal.wazzimagiygg.com/ |publicado=Jornal WazzimaGiygg |acessodata=${new Date().toLocaleDateString('pt-BR')}}}`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans space-y-8">
      {/* Newspaper Classical Header */}
      <header className="border-b-4 border-slate-900 dark:border-slate-100 pb-5 space-y-4">
        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition"
            >
              <ArrowLeft size={13} />
              <span>Voltar à Enciclopédia</span>
            </button>
            <span className="hidden sm:inline font-mono">
              EDIÇÃO DIGITAL • REPOSITÓRIO OFICIAL
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="hidden md:inline">Santa Fé do Sul - SP • Brasil</span>
          </div>
        </div>

        {/* Masthead Banner */}
        <div className="text-center space-y-2 py-4">
          <div className="flex items-center justify-center gap-3">
            <Newspaper size={34} className="text-blue-700 dark:text-blue-400" />
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight font-serif text-slate-900 dark:text-slate-100 uppercase">
              Jornal WazzimaGiygg
            </h1>
          </div>
          <p className="text-sm sm:text-base italic font-serif text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            &ldquo;O Jornal Inevitável! Notícias, investigações e análises com independência, transparência e sem censura.&rdquo;
          </p>

          {/* Source Repository Link & Read-Only Badge */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            <a
              href="https://jornal.wazzimagiygg.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition font-medium"
            >
              <ExternalLink size={12} />
              <span>Portal Oficial: jornal.wazzimagiygg.com</span>
            </a>
            <a
              href="https://github.com/WazzimaGiygg/Jornal-WazzimaGiygg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition font-medium"
            >
              <ExternalLink size={12} />
              <span>Repositório: GitHub WazzimaGiygg/Jornal-WazzimaGiygg</span>
            </a>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
              <ShieldCheck size={12} />
              <span>Modo Leitura Wiki (Banco Preservado)</span>
            </span>
          </div>
        </div>

        {/* Read-Only Notice Box */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Info size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Página Especial de Leitura:</strong> Esta página espelha o conteúdo do Jornal WazzimaGiygg diretamente na interface da enciclopédia. Conforme solicitado, esta área opera exclusivamente em <em>modo de visualização e consulta</em>, mantendo a integridade estrita da base de dados do repositório original.
            </span>
          </div>
          <button
            onClick={() => loadArticles(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-100/50 text-xs font-semibold shrink-0 transition"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar Feed'}</span>
          </button>
        </div>
      </header>

      {/* Category Pills & Filters */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => {
              const label = CATEGORY_NAMES[cat] || cat.toUpperCase();
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer capitalize ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="recentes">Mais Recentes</option>
              <option value="antigos">Mais Antigos</option>
              <option value="populares">Mais Visualizadas</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar notícias, investigações, nomes, tópicos ou palavras-chave..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </section>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Sincronizando feed de notícias do Jornal WazzimaGiygg...
          </p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <Newspaper size={36} className="text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Nenhuma notícia encontrada
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Nenhum artigo corresponde à categoria ou busca selecionada. Tente limpar os filtros.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('todos');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
          >
            Ver Todas as Notícias
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Main Lead / Manchete Principal (if no specific search query) */}
          {leadArticle && !searchQuery && selectedCategory === 'todos' && (
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl group">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
                {leadArticle.imagemUrl && (
                  <div className="lg:col-span-6 overflow-hidden rounded-2xl max-h-[360px] bg-slate-800 border border-slate-700">
                    <img
                      src={leadArticle.imagemUrl}
                      alt={leadArticle.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className={`${leadArticle.imagemUrl ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4`}>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-600 text-white">
                      MANCHETE PRINCIPAL
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {CATEGORY_NAMES[leadArticle.categoria] || leadArticle.categoria}
                    </span>
                  </div>

                  <h2
                    onClick={() => setSelectedArticle(leadArticle)}
                    className="text-2xl sm:text-4xl font-extrabold font-serif leading-tight text-white hover:text-blue-300 cursor-pointer transition"
                  >
                    {leadArticle.titulo}
                  </h2>

                  {leadArticle.subtitulo && (
                    <p className="text-sm sm:text-base text-slate-300 font-medium line-clamp-2">
                      {leadArticle.subtitulo}
                    </p>
                  )}

                  <p className="text-xs sm:text-sm text-slate-400 line-clamp-3">
                    {leadArticle.resumo ||
                      leadArticle.conteudo.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...'}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 font-medium text-slate-300">
                        <User size={13} className="text-blue-400" />
                        {leadArticle.autorNome}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {formatDate(leadArticle.dataPublicacao)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {calculateReadTime(leadArticle.conteudo)}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedArticle(leadArticle)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <span>Ler Matéria Completa</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Grid of Articles */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <span>
                  {selectedCategory === 'todos'
                    ? 'Últimas Matérias & Reportagens'
                    : `Matérias em ${CATEGORY_NAMES[selectedCategory] || selectedCategory}`}
                </span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {secondaryArticles.length} {secondaryArticles.length === 1 ? 'notícia' : 'notícias'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {secondaryArticles.map((article) => {
                const catColor =
                  CATEGORY_COLORS[article.categoria] ||
                  'bg-slate-100 text-slate-700 border-slate-200';
                return (
                  <article
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group"
                  >
                    {/* Optional Thumbnail */}
                    {article.imagemUrl ? (
                      <div className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                        <img
                          src={article.imagemUrl}
                          alt={article.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${catColor}`}
                          >
                            {CATEGORY_NAMES[article.categoria] || article.categoria}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 px-5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${catColor}`}
                        >
                          {CATEGORY_NAMES[article.categoria] || article.categoria}
                        </span>
                      </div>
                    )}

                    {/* Content body */}
                    <div className="p-5 flex-1 space-y-2.5">
                      <h3 className="font-serif font-bold text-base sm:text-lg leading-snug text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {article.titulo}
                      </h3>

                      {article.subtitulo && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">
                          {article.subtitulo}
                        </p>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {article.resumo ||
                          article.conteudo.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-slate-400" />
                        <span className="truncate max-w-[110px]">{article.autorNome}</span>
                      </div>
                      <div className="flex items-center gap-3 font-medium">
                        <span>{formatDate(article.dataPublicacao)}</span>
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                          Ler <ChevronRight size={11} />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Full Article Reader Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    CATEGORY_COLORS[selectedArticle.categoria] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {CATEGORY_NAMES[selectedArticle.categoria] || selectedArticle.categoria}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {formatDate(selectedArticle.dataPublicacao)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCitation(selectedArticle)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Copiar citação para artigo Wiki"
                >
                  {copiedCitation ? (
                    <>
                      <Check size={13} className="text-emerald-500" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Citar no Wiki</span>
                    </>
                  )}
                </button>

                <a
                  href="https://jornal.wazzimagiygg.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ExternalLink size={13} />
                  <span className="hidden sm:inline">Ver no Jornal</span>
                </a>

                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Fechar leitura"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Article Content Reader */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-6">
              <header className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-6">
                <h1 className="text-2xl sm:text-4xl font-black font-serif text-slate-900 dark:text-slate-100 leading-tight">
                  {selectedArticle.titulo}
                </h1>

                {selectedArticle.subtitulo && (
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium italic">
                    {selectedArticle.subtitulo}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
                  <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <User size={14} className="text-blue-600" />
                    Por {selectedArticle.autorNome}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(selectedArticle.dataPublicacao)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {calculateReadTime(selectedArticle.conteudo)}
                  </span>
                  {selectedArticle.visualizacoes !== undefined && (
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {selectedArticle.visualizacoes} visualizações
                    </span>
                  )}
                </div>
              </header>

              {/* Cover Photo */}
              {selectedArticle.imagemUrl && (
                <div className="space-y-2">
                  <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-[440px]">
                    <img
                      src={selectedArticle.imagemUrl}
                      alt={selectedArticle.titulo}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic text-center">
                    Foto: Divulgação / Jornal WazzimaGiygg
                  </p>
                </div>
              )}

              {/* Lead Summary Callout if available */}
              {selectedArticle.resumo && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-l-4 border-blue-600 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedArticle.resumo}
                </div>
              )}

              {/* Rich Body */}
              <div
                className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: selectedArticle.conteudo }}
              />

              {/* Bottom Actions & Wiki Integration */}
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>Citar esta notícia em um artigo da WikiWorldWeb</span>
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      Você pode usar as informações apuradas nesta reportagem como fonte verificável para verbetes enciclopédicos.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyCitation(selectedArticle)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Copy size={13} />
                      <span>Copiar Predefinição</span>
                    </button>
                    {onNavigateToArticle && (
                      <button
                        onClick={() => {
                          setSelectedArticle(null);
                          onNavigateToArticle(selectedArticle.titulo);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 font-bold transition"
                      >
                        Criar/Buscar Artigo
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    Fechar Notícia
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
