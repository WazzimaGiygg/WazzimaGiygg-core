/**
 * @file PopularRecentPages.tsx
 * @description Componente de índice que lista as páginas mais recentemente editadas e criadas no WikiWorldWeb.
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Layers, ArrowRight, BookOpen, RefreshCw, User } from 'lucide-react';
import { PageService } from '../services/PageService';
import { Page } from '../types';

interface PopularRecentPagesProps {
  onNavigateToArticle: (pageIdOrTitle: string) => void;
  limitCount?: number;
  className?: string;
}

export const PopularRecentPages: React.FC<PopularRecentPagesProps> = ({
  onNavigateToArticle,
  limitCount = 6,
  className = '',
}) => {
  const [recentPages, setRecentPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentPages();
  }, []);

  const loadRecentPages = async () => {
    setLoading(true);
    try {
      const all = await PageService.getAllPages();
      // Ordena por updatedAt decrescente
      const sorted = (all || [])
        .filter((p) => p && (p.namespace === 'main' || !p.namespace))
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, limitCount);
      setRecentPages(sorted);
    } catch (err) {
      console.error('Erro ao buscar páginas recentes:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Páginas Editadas Recentemente
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Índice dinâmico com os artigos em constante atualização pela comunidade
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadRecentPages}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 transition"
          title="Atualizar lista"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Carregando índice...</div>
      ) : recentPages.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 italic">Nenhum artigo encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentPages.map((page) => (
            <div
              key={page.id}
              onClick={() => onNavigateToArticle(page.id)}
              className="p-3 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-800 rounded-lg cursor-pointer transition flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">v{page.version || 1}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(page.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {page.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {page.content.replace(/\[\[.*?\]\]/g, '').replace(/[#*='_]/g, '').trim()}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/50 dark:border-slate-700/40 text-[10px] text-slate-500">
                <span className="truncate max-w-[120px] flex items-center gap-1">
                  <User className="w-2.5 h-2.5 opacity-60" />
                  {page.authorName || 'Editor'}
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Ver <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
