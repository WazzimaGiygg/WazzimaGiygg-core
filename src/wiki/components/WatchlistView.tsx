/**
 * @file WatchlistView.tsx
 * @description Componente da página "Minha Lista de Vigilância" (Watchlist), listando páginas vigiadas e alterações recentes.
 */

import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Clock,
  History,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Layers,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { WatchlistService } from '../services/WatchlistService';
import { UserProfile, WatchedPageDetail } from '../types';

interface WatchlistViewProps {
  user: UserProfile | null;
  onNavigateToArticle: (pageIdOrTitle: string) => void;
  onNavigateToHistory: (pageIdOrTitle: string) => void;
  onNavigateToTalk?: (pageIdOrTitle: string) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  user,
  onNavigateToArticle,
  onNavigateToHistory,
  onNavigateToTalk,
}) => {
  const [watchedList, setWatchedList] = useState<WatchedPageDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNamespace, setFilterNamespace] = useState<string>('all');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadWatchlist();
  }, [user?.uid]);

  const loadWatchlist = async () => {
    if (!user?.uid) {
      setWatchedList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const items = await WatchlistService.listWatchedPages(user.uid);
      setWatchedList(items);
    } catch (err) {
      console.error('Erro ao carregar lista de vigilância:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnwatch = async (pageId: string) => {
    if (!user?.uid) return;
    await WatchlistService.removeFromWatchlist(user.uid, pageId);
    setWatchedList((prev) => (Array.isArray(prev) ? prev : []).filter((item) => item.pageId !== pageId));
    setActionSuccessMessage(`Página "${pageId}" removida da sua lista de vigilância.`);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const safeWatchedList = Array.isArray(watchedList) ? watchedList : [];
  const filteredItems = safeWatchedList.filter((item) => {
    if (!item) return false;
    const titleMatch = (item.page?.title || item.pageId || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!titleMatch) return false;

    if (filterNamespace !== 'all') {
      const ns = item.page?.namespace || item.pageId?.split(':')[0] || 'main';
      if (ns !== filterNamespace) return false;
    }
    return true;
  });

  if (!user || user.isGuest) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Lista de Vigilância Pessoal
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Você precisa estar registrado e logado no WikiWorldWeb para vigiar artigos e receber atualizações em tempo real das revisões e discussões.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="watchlist-view" className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Minha Lista de Vigilância
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o histórico de alterações e discussões dos artigos que você segue
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadWatchlist}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
            {watchedList.length} {watchedList.length === 1 ? 'artigo vigiado' : 'artigos vigiados'}
          </span>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Barra de Filtro e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar artigos vigiados..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Namespace:</span>
          <select
            value={filterNamespace}
            onChange={(e) => setFilterNamespace(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Todos os espaços</option>
            <option value="main">Artigos Principais (main)</option>
            <option value="talk">Discussões (talk)</option>
            <option value="template">Predefinições (template)</option>
            <option value="help">Ajuda (help)</option>
          </select>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-medium">Carregando páginas vigiadas e últimas revisões...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <Eye className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {searchQuery ? 'Nenhum artigo encontrado com esse filtro' : 'Sua lista de vigilância está vazia'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Tente ajustar os termos de pesquisa ou o filtro de namespace.'
              : 'Clique no botão "Vigiar" no topo de qualquer artigo para adicioná-lo à sua lista de acompanhamento.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const pageTitle = item.page?.title || item.pageId.split(':').slice(1).join(':') || item.pageId;
            const namespace = item.page?.namespace || item.pageId.split(':')[0] || 'main';
            const latestVer = item.latestVersion;
            const recentEdits = item.recentVersions || [];

            return (
              <div
                key={item.pageId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700 space-y-3"
              >
                {/* Cabeçalho do Card */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {namespace}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateToArticle(item.pageId)}
                        className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-left"
                      >
                        <span>{pageTitle}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </button>
                      {item.page?.version && (
                        <span className="text-[11px] font-mono text-slate-400">
                          v{item.page.version}
                        </span>
                      )}
                    </div>

                    {item.page?.categories && item.page.categories.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">Categorias:</span>
                        {item.page.categories.map((cat) => (
                          <span key={cat} className="hover:underline text-blue-600 dark:text-blue-400 cursor-pointer">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5">
                    {onNavigateToTalk && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTalk(item.pageId)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Ver discussão"
                      >
                        Discussão
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigateToHistory(item.pageId)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                      title="Ver histórico de revisões"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Histórico</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnwatch(item.pageId)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1 transition"
                      title="Parar de vigiar esta página"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Parar de Vigiar</span>
                    </button>
                  </div>
                </div>

                {/* Última Edição & Sumário */}
                {latestVer ? (
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Última edição por {latestVer.userName}:
                        </span>
                        <span>{new Date(latestVer.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Revisão #{latestVer.versionNumber}
                      </span>
                    </div>
                    {latestVer.comment && (
                      <p className="text-slate-700 dark:text-slate-300 italic pl-5">
                        &ldquo;{latestVer.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    Nenhuma revisão registrada recentemente na subcoleção de versões.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
