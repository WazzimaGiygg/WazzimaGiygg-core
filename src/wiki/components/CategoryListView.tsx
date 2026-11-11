/**
 * @file CategoryListView.tsx
 * @description Exibe a listagem de páginas e artigos categorizados sob uma categoria específica do WikiWorldWeb.
 */

import React, { useState, useEffect } from 'react';
import { Tag, BookOpen, Clock, ArrowLeft, Layers, Search, RefreshCw } from 'lucide-react';
import { PageService } from '../services/PageService';
import { Page } from '../types';

interface CategoryListViewProps {
  categoryName: string;
  onNavigateToArticle: (pageIdOrTitle: string) => void;
  onBack?: () => void;
}

export const CategoryListView: React.FC<CategoryListViewProps> = ({
  categoryName,
  onNavigateToArticle,
  onBack,
}) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    loadCategoryPages();
  }, [categoryName]);

  const loadCategoryPages = async () => {
    setLoading(true);
    try {
      const results = await PageService.getPagesByCategory(categoryName);
      setPages(results);
    } catch (err) {
      console.error('Erro ao carregar páginas da categoria:', err);
    } finally {
      setLoading(false);
    }
  };

  const safePages = Array.isArray(pages) ? pages : [];
  const filteredPages = safePages.filter((p) =>
    p?.title?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Categoria: {categoryName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Páginas e artigos classificados sob este tópico na enciclopédia
              </p>
            </div>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 self-start sm:self-auto">
          {pages.length} {pages.length === 1 ? 'página' : 'páginas'}
        </span>
      </div>

      {/* Busca rápida */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filtrar páginas nesta categoria..."
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs font-medium">Carregando artigos da categoria...</p>
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma página encontrada nesta categoria
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Você pode adicionar a categoria <code>[[Categoria:{categoryName}]]</code> ao editar qualquer artigo existente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              onClick={() => onNavigateToArticle(page.id)}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-500/50 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono font-bold uppercase text-slate-400">
                  <span>{page.namespace}</span>
                  {page.version && <span>• v{page.version}</span>}
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {page.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {page.content.replace(/\[\[.*?\]\]/g, '').replace(/[#*='_]/g, '').trim()}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(page.updatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                  Ler artigo →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
