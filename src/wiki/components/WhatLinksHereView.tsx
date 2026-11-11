import React, { useState } from 'react';
import {
  Link2,
  FileText,
  Folder,
  ArrowRight,
  Filter,
  ExternalLink,
  Search,
  BookOpen,
} from 'lucide-react';
import { WikiArticle, WikiPage } from '../types';
import { StorageService } from '../services/storageService';

interface WhatLinksHereViewProps {
  currentArticle: WikiArticle;
  allArticles: WikiArticle[];
  allPages: WikiPage[];
  onNavigateToArticle: (articleId: string) => void;
  onNavigateToPage: (pageUid: string) => void;
}

export const WhatLinksHereView: React.FC<WhatLinksHereViewProps> = ({
  currentArticle,
  allArticles,
  allPages,
  onNavigateToArticle,
  onNavigateToPage,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'articles' | 'pages'>('all');

  const rawBacklinks = StorageService.getBacklinks(currentArticle.titulo, allArticles);
  const backlinks = Array.isArray(rawBacklinks) ? rawBacklinks : [];
  
  // Also check if any page collection mentions the article title in tags or description
  const safePages = Array.isArray(allPages) ? allPages : [];
  const collectionLinks = safePages.filter(
    (p) =>
      p &&
      (((p.descricao || '').toLowerCase().includes(currentArticle.titulo.toLowerCase())) ||
        p.tags?.some((t) => t && t.toLowerCase() === currentArticle.titulo.toLowerCase()))
  );

  const filteredBacklinks = backlinks.filter((b) =>
    b?.article?.titulo?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredCollections = collectionLinks.filter((c) =>
    c?.titulo?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const totalLinks = backlinks.length + collectionLinks.length;

  return (
    <div className="space-y-5 animate-in fade-in select-none">
      {/* MediaWiki Special:WhatLinksHere Notice Header */}
      <div className="p-4 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 font-serif-heading text-sm mb-1">
          <Link2 size={16} className="text-blue-600 dark:text-blue-400" />
          <span>Páginas Afluentes (What Links Here): {currentArticle.titulo}</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Esta ferramenta analisa a ontologia interna da WikiWorldWeb e lista todas as páginas, artigos e coleções que contêm referências diretas (links <code>[[{currentArticle.titulo}]]</code>) apontando para esta página.
        </p>
      </div>

      {/* Filter and Count Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Total de referências encontradas:
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold font-mono">
            {totalLinks}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrar páginas..."
              className="w-full text-xs pl-7 pr-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Todas as Entidades</option>
            <option value="articles">Apenas Artigos</option>
            <option value="pages">Apenas Coleções</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      {totalLinks === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
          <Link2 size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma página aponta para este artigo no momento
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Este artigo é atualmente uma <em>Página Órfã</em> ou independente. Você pode criar links para ele em outros artigos usando a sintaxe <code>[[{currentArticle.titulo}]]</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Articles Section */}
          {(filterType === 'all' || filterType === 'articles') && filteredBacklinks.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Artigos que contêm links internos ({filteredBacklinks.length})</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBacklinks.map(({ article, snippet }) => (
                  <div
                    key={article.id}
                    className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <button
                        onClick={() => onNavigateToArticle(article.id)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 text-left"
                      >
                        <FileText size={12} />
                        <span>{article.titulo}</span>
                      </button>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-200/60 dark:border-slate-800/60 text-[11px] leading-relaxed">
                        {snippet}
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigateToArticle(article.id)}
                      className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 hover:border-blue-300 transition flex items-center gap-1 flex-shrink-0"
                    >
                      Acessar <ArrowRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collections Section */}
          {(filterType === 'all' || filterType === 'pages') && filteredCollections.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Folder size={14} className="text-amber-600 dark:text-amber-400" />
                <span>Coleções e Tópicos Relacionados ({filteredCollections.length})</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCollections.map((col) => (
                  <div
                    key={col.uid}
                    className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3"
                  >
                    <div>
                      <button
                        onClick={() => onNavigateToPage(col.uid)}
                        className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1.5"
                      >
                        <Folder size={12} />
                        <span>{col.titulo}</span>
                      </button>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {col.descricao}
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigateToPage(col.uid)}
                      className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 flex-shrink-0"
                    >
                      Ver Coleção <ArrowRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
