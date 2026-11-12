import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowLeft, BookOpen, Clock, Sparkles, Folder, ChevronRight } from 'lucide-react';
import { WikiArticle, WikiPage } from '../types';
import { getCleanExcerpt } from '../utils/wikitextParser';

interface MobileSearchModalProps {
  isOpen: boolean;
  articles: WikiArticle[];
  pages: WikiPage[];
  onClose: () => void;
  onSelectArticle: (articleId: string) => void;
  onSelectPage: (pageUid: string) => void;
  onSearchQuerySubmit?: (query: string) => void;
  onOpenAdvancedSearch?: (query: string) => void;
}

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({
  isOpen,
  articles,
  pages,
  onClose,
  onSelectArticle,
  onSelectPage,
  onSearchQuerySubmit,
  onOpenAdvancedSearch,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedQuery = query.trim().toLowerCase();

  const safeArticles = articles || [];
  const safePages = pages || [];

  // Filter matching articles
  const matchedArticles = normalizedQuery
    ? safeArticles.filter(
        (a) =>
          a &&
          ((a.titulo && a.titulo.toLowerCase().includes(normalizedQuery)) ||
          (a.descricao && a.descricao.toLowerCase().includes(normalizedQuery)) ||
          (a.categoria && a.categoria.toLowerCase().includes(normalizedQuery)) ||
          (a.resumo && a.resumo.toLowerCase().includes(normalizedQuery)))
      ).slice(0, 15)
    : safeArticles.slice(0, 8); // Recent/recommended articles

  // Filter matching collections/pages
  const matchedPages = normalizedQuery
    ? safePages.filter(
        (p) =>
          p &&
          ((p.titulo && p.titulo.toLowerCase().includes(normalizedQuery)) ||
          (p.descricao && p.descricao.toLowerCase().includes(normalizedQuery)))
      ).slice(0, 5)
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (onSearchQuerySubmit && query.trim()) {
        onSearchQuerySubmit(query.trim());
        onClose();
      } else if (matchedArticles.length > 0) {
        onSelectArticle(matchedArticles[0].id);
        onClose();
      }
    }
  };

  return (
    <div
      id="mobile-search-modal"
      className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col animate-in fade-in duration-150"
    >
      {/* Mobile Search Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          id="btn-close-mobile-search"
          onClick={onClose}
          className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition active:scale-95"
          aria-label="Fechar busca"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar na WikiWorldWeb (ex: IA, Brasil, Física)..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
              aria-label="Limpar campo"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Search Results / Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {onOpenAdvancedSearch && (
          <button
            onClick={() => {
              onOpenAdvancedSearch(query);
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
              <span>Abrir Página de Busca Avançada de Artigos</span>
            </div>
            <ChevronRight size={16} />
          </button>
        )}

        {/* Pages / Topic Portals */}
        {matchedPages.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Folder size={13} className="text-purple-500" />
              <span>Portais & Tópicos ({matchedPages.length})</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {matchedPages.map((p) => (
                <button
                  key={p.uid}
                  onClick={() => {
                    onSelectPage(p.uid);
                    onClose();
                  }}
                  className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white block truncate">
                      {p.titulo}
                    </span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{p.descricao}</span>
                  </div>
                  <ChevronRight size={15} className="text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Articles List */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              {normalizedQuery ? <BookOpen size={13} className="text-blue-500" /> : <Sparkles size={13} className="text-amber-500" />}
              <span>{normalizedQuery ? `Artigos Encontrados (${matchedArticles.length})` : 'Sugestões em Destaque'}</span>
            </span>
            <span className="text-[10px] lowercase text-slate-400">{articles.length} total</span>
          </div>

          {matchedArticles.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nenhum resultado para "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Verifique a ortografia ou crie um novo artigo com este título.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matchedArticles.map((art) => (
                <button
                  key={art.id}
                  onClick={() => {
                    onSelectArticle(art.id);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition flex items-start gap-3 active:scale-[0.99]"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-serif-heading font-bold text-sm flex-shrink-0 mt-0.5">
                    {art.titulo.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {art.titulo}
                      </h4>
                      {art.categoria && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
                          {art.categoria}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {art.resumo || getCleanExcerpt(art.descricao, 120)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
