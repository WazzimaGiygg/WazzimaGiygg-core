import React, { useState, useMemo } from 'react';
import {
  FileQuestion,
  Search,
  PlusCircle,
  ArrowLeft,
  Home,
  Shuffle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Folder,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Compass,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { WikiArticle, WikiPage, AppTheme } from '../types';

interface NotFoundViewProps {
  query: string;
  notFoundType?: 'article' | 'page' | 'file' | 'user' | 'special' | 'generic';
  articles: WikiArticle[];
  pages: WikiPage[];
  theme: AppTheme;
  onSearch: (query: string) => void;
  onOpenEditor: (title: string) => void;
  onNavigateHome: () => void;
  onRandomPage: () => void;
  onSelectArticle: (articleId: string) => void;
  onSelectPage: (pageUid: string) => void;
  onNavigateSpecialPages: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  query,
  notFoundType = 'generic',
  articles = [],
  pages = [],
  theme,
  onSearch,
  onOpenEditor,
  onNavigateHome,
  onRandomPage,
  onSelectArticle,
  onSelectPage,
  onNavigateSpecialPages,
}) => {
  const [searchInputValue, setSearchInputValue] = useState(query || '');

  const isWin1 = theme === 'win1';
  const isWin95 = theme === 'win95';
  const isWinXP = theme === 'winxp';
  const isGenshin = theme === 'genshin';
  const isAndroid = theme === 'android15';
  const isStardew = theme === 'stardew';
  const isMinecraft = theme === 'minecraft';
  const isRoblox = theme === 'roblox';
  const isNokia = theme === 'nokia3310';

  const displayQuery = query?.trim() || 'Página Solicitada';

  // Encontra artigos com nomes semelhantes ou que contenham partes da busca
  const suggestedArticles = useMemo(() => {
    if (!query || query.trim().length < 2) {
      // Se a query for vazia ou curta, retorna os artigos mais populares/recentes
      return [...articles]
        .sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0))
        .slice(0, 4);
    }

    const cleanQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const queryWords = cleanQuery.split(/[\s_\-]+/).filter((w) => w.length >= 2);

    // 1. Prioridade: Títulos que contenham a query inteira
    const exactMatches = articles.filter((a) => {
      const t = a.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return t.includes(cleanQuery);
    });

    // 2. Títulos que contenham qualquer uma das palavras pesquisadas
    const wordMatches = articles.filter((a) => {
      if (exactMatches.some((m) => m.id === a.id)) return false;
      const t = a.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return queryWords.some((word) => t.includes(word));
    });

    // 3. Conteúdo que contenha a query
    const contentMatches = articles.filter((a) => {
      if (exactMatches.some((m) => m.id === a.id) || wordMatches.some((m) => m.id === a.id)) return false;
      const desc = (a.descricao || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return desc.includes(cleanQuery);
    });

    const combined = [...exactMatches, ...wordMatches, ...contentMatches];

    if (combined.length > 0) {
      return combined.slice(0, 4);
    }

    // Fallback para artigos em alta se não houver semelhantes
    return [...articles]
      .sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0))
      .slice(0, 4);
  }, [articles, query]);

  const hasSimilarArticles = useMemo(() => {
    if (!query || query.trim().length < 2) return false;
    const cleanQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return articles.some((a) => {
      const t = a.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return t.includes(cleanQuery);
    });
  }, [articles, query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputValue.trim()) {
      onSearch(searchInputValue.trim());
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 animate-in fade-in duration-200">
      {/* Barra de Navegação / Breadcrumb Superior */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-6 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateHome}
            className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition"
          >
            <Home size={13} />
            <span>Início</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle size={13} />
            Erro 404 (Página Inexistente)
          </span>
        </div>

        <button
          onClick={onRandomPage}
          className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition font-medium"
          title="Ver um artigo aleatório existente"
        >
          <Shuffle size={13} />
          <span className="hidden sm:inline">Página Aleatória</span>
        </button>
      </div>

      {/* Card Principal de Erro 404 */}
      <div
        className={`p-6 sm:p-10 rounded-2xl border transition-all mb-8 shadow-sm ${
          isWin1
            ? 'bg-white border-2 border-black !rounded-none text-black font-mono shadow-none'
            : isWin95
            ? 'win95-window'
            : isWinXP
            ? 'winxp-window'
            : isGenshin
            ? 'bg-[#181e36] border-[#d3bc8e]/40 text-[#f2dfb7]'
            : isStardew
            ? 'stardew-box bg-[#fffdf8]'
            : isMinecraft
            ? 'bg-[#2b2b2b] border-[#4a4a4a] text-white font-mono'
            : isRoblox
            ? 'bg-[#191b1d] border-[#393b3d] text-white'
            : isNokia
            ? 'bg-[#c4cfa1] text-[#222a1b] font-mono border-4 border-[#8b956d]'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Ícone e Selo 404 */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center shadow-inner">
              <FileQuestion size={36} className="mb-0.5" />
              <span className="font-mono font-black text-sm tracking-wider">404</span>
            </div>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              Não Encontrada
            </span>
          </div>

          {/* Conteúdo Explicativo Enciclopédico */}
          <div className="flex-1 space-y-4 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono mb-2">
                <span>Página não encontrada no banco de dados</span>
                {notFoundType && notFoundType !== 'generic' && (
                  <span className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[10px]">
                    [{notFoundType}]
                  </span>
                )}
              </div>

              <h1 className="font-serif-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white leading-tight">
                A página «<span className="text-rose-600 dark:text-rose-400 break-all">{displayQuery}</span>» não existe
              </h1>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              A <strong>WikiWorldWeb</strong> não possui atualmente nenhum verbete ou registro com o título ou identificador solicitado.
              Você pode ter digitado incorretamente o endereço, o conteúdo pode ter sido movido ou excluído, ou este artigo ainda está esperando por alguém para redigi-lo.
            </p>

            {/* Grupo de Ações Primárias */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenEditor(query || '')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <PlusCircle size={17} />
                <span>Criar o artigo «{displayQuery}»</span>
              </button>

              <button
                type="button"
                onClick={() => onSearch(query || '')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Search size={17} />
                <span>Pesquisar no texto dos artigos</span>
              </button>

              <button
                type="button"
                onClick={onNavigateHome}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
              >
                <Home size={15} />
                <span>Página Principal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Formulário de Busca Integrado na Página 404 */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Tente buscar outro termo ou digite o título exato:
          </label>
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                placeholder="Digite o nome de uma página ou assunto enciclopédico..."
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Buscar</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Grid de Conteúdo: Sugestões de Artigos & Dicas de Navegação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Artigos Semelhantes ou em Destaque */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={16} className="text-blue-500" />
              {hasSimilarArticles ? (
                <span>Artigos semelhantes encontrados na enciclopédia</span>
              ) : (
                <span>Verbetes recomendados para leitura</span>
              )}
            </h2>
            <button
              onClick={() => onSearch('')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Ver todos os artigos</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestedArticles.map((art) => {
              const page = pages.find((p) => p.uid === art.pageUid);
              return (
                <div
                  key={art.id}
                  onClick={() => onSelectArticle(art.id)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer flex flex-col justify-between group shadow-2xs hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {art.categoria && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold truncate">
                          {art.categoria}
                        </span>
                      )}
                      {page && (
                        <span className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                          <Folder size={10} />
                          {page.titulo}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif-heading font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {art.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {art.resumo || (art.descricao ? art.descricao.replace(/^[=#*\s]+/gm, '') : '')}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(art.dataCriacao || '').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Ler <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna 3: Guia e Boas Práticas Enciclopédicas */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <HelpCircle size={14} className="text-amber-500" />
              <span>Dicas de Pesquisa Wiki</span>
            </h3>

            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>Verifique a ortografia:</strong> Palavras acentuadas ou com grafia alternativa podem ter redirecionamentos diferentes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>Use termos no singular:</strong> Na Wiki, a maioria dos títulos é indexada no singular (ex: <em>Ferrovia</em> em vez de <em>Ferrovias</em>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>Pesquise no texto:</strong> Use a busca avançada para encontrar o assunto citado no corpo de outros verbetes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>Seja audaz e crie a página:</strong> Toda enciclopédia cresce com a colaboração de leitores como você!</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onNavigateSpecialPages}
                className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Compass size={13} />
                <span>Ver Índice de Páginas Especiais</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
