import React, { useState } from 'react';
import {
  History,
  GitCompare,
  ArrowLeft,
  RotateCcw,
  Eye,
  Calendar,
  User,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { WikiArticle, ArticleHistoryItem } from '../types';
import { parseWikitext } from '../utils/wikitextParser';
import { computeLineDiff, DiffLine } from '../utils/diffUtils';

interface ArticleHistoryViewProps {
  article: WikiArticle;
  onRestoreRevision?: (historyItem: ArticleHistoryItem) => void;
  onEditArticle?: () => void;
  onNavigateToUser?: (identifier: string) => void;
}

export const ArticleHistoryView: React.FC<ArticleHistoryViewProps> = ({
  article,
  onRestoreRevision,
  onEditArticle,
  onNavigateToUser,
}) => {
  // Normalize history list
  const rawHistory = article.historico || [];
  const historyList: ArticleHistoryItem[] =
    rawHistory.length > 0
      ? rawHistory
      : [
          {
            id: 'h-init',
            data: article.dataCriacao,
            autor: article.autor || 'Colaborador',
            autorEmail: article.autorEmail,
            resumo: 'Criação inicial do artigo',
            tamanho: article.descricao ? article.descricao.length : 0,
            deltaBytes: article.descricao ? article.descricao.length : 0,
            versao: 1,
            conteudo: article.descricao,
          },
        ];

  // Selected revisions for diff
  const [selectedOldId, setSelectedOldId] = useState<string>(
    historyList.length > 1 ? historyList[1]?.id || historyList[0]?.id : historyList[0]?.id
  );
  const [selectedNewId, setSelectedNewId] = useState<string>(historyList[0]?.id || '');

  // Active sub-views: 'list' | 'diff' | 'preview'
  const [activeSubView, setActiveSubView] = useState<'list' | 'diff' | 'preview'>('list');
  const [previewRevision, setPreviewRevision] = useState<ArticleHistoryItem | null>(null);
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>('unified');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMinor, setFilterMinor] = useState<boolean | null>(null);

  // Filtered history list
  const safeHistoryList = Array.isArray(historyList) ? historyList : [];
  const filteredHistory = safeHistoryList.filter((item) => {
    if (!item) return false;
    if (filterMinor === true && !item.isMinor) return false;
    if (filterMinor === false && item.isMinor) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (item.autor || '').toLowerCase().includes(q) ||
        (item.resumo || '').toLowerCase().includes(q) ||
        (item.data && item.data.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getRevisionContent = (item?: ArticleHistoryItem | null): string => {
    if (!item) return '';
    if (item.conteudo) return item.conteudo;
    // Fallback: If it's the current latest revision, use article.descricao
    if (item.id === historyList[0]?.id) return article.descricao;
    // Otherwise return a placeholder or excerpt
    return article.descricao;
  };

  const oldRevision = historyList.find((h) => h.id === selectedOldId) || historyList[historyList.length - 1];
  const newRevision = historyList.find((h) => h.id === selectedNewId) || historyList[0];

  const oldContent = getRevisionContent(oldRevision);
  const newContent = getRevisionContent(newRevision);
  const diffLines = computeLineDiff(oldContent, newContent);

  const handleStartDiff = (oldId: string, newId: string) => {
    setSelectedOldId(oldId);
    setSelectedNewId(newId);
    setActiveSubView('diff');
  };

  const handlePreviewRevision = (item: ArticleHistoryItem) => {
    setPreviewRevision(item);
    setActiveSubView('preview');
  };

  // Preview content rendering
  const previewText = previewRevision ? getRevisionContent(previewRevision) : '';
  const { html: previewHtml } = parseWikitext(previewText);

  return (
    <div className="space-y-4 text-xs animate-in fade-in">
      {/* History Header Banner */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                <History size={16} />
              </span>
              <h2 className="text-base font-bold font-serif-heading text-slate-900 dark:text-white">
                Histórico de Revisões: {article.titulo}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Registro cronológico completo de edições, autores e motivos de alteração salvos para este artigo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeSubView !== 'list' ? (
              <button
                onClick={() => setActiveSubView('list')}
                className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold flex items-center gap-1.5 transition"
              >
                <ArrowLeft size={13} /> Voltar ao Histórico
              </button>
            ) : (
              <button
                onClick={() => handleStartDiff(selectedOldId, selectedNewId)}
                disabled={historyList.length < 2 || selectedOldId === selectedNewId}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                <GitCompare size={13} /> Comparar Versões Selecionadas
              </button>
            )}
          </div>
        </div>

        {/* Filters and search bar (visible in list mode) */}
        {activeSubView === 'list' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por autor ou motivo da alteração..."
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterMinor(null)}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    filterMinor === null
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Todas ({historyList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMinor(false)}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    filterMinor === false
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Principais
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMinor(true)}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    filterMinor === true
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Menores [m]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. LIST VIEW: Timeline of revisions */}
      {activeSubView === 'list' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>(cur) = comparar com atual</span>
              <span>(prev) = comparar com anterior</span>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Total: {filteredHistory.length} revisões registradas
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredHistory.map((item, idx) => {
              const versionNum = item.versao || historyList.length - idx;
              const isLatest = idx === 0;
              const isOldest = idx === historyList.length - 1;
              const prevItem = historyList[idx + 1];

              const delta =
                item.deltaBytes !== undefined
                  ? item.deltaBytes
                  : prevItem
                  ? item.tamanho - prevItem.tamanho
                  : item.tamanho;

              return (
                <div
                  key={item.id || idx}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isLatest ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                  }`}
                >
                  {/* Left: Radios + Info */}
                  <div className="flex items-start gap-3 flex-1">
                    {/* Radio Selectors for Diff (Old and New) */}
                    <div className="flex items-center gap-1.5 pt-0.5 flex-shrink-0">
                      <input
                        type="radio"
                        name="oldRevisionRadio"
                        checked={selectedOldId === item.id}
                        onChange={() => setSelectedOldId(item.id)}
                        title="Selecionar como versão anterior (base da comparação)"
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <input
                        type="radio"
                        name="newRevisionRadio"
                        checked={selectedNewId === item.id}
                        onChange={() => setSelectedNewId(item.id)}
                        title="Selecionar como versão mais recente (destino da comparação)"
                        className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Revision Metadata */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          v.{versionNum}
                        </span>

                        {isLatest && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Versão Atual
                          </span>
                        )}

                        {item.isMinor && (
                          <span
                            title="Edição Menor"
                            className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          >
                            [m] menor
                          </span>
                        )}

                        <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(item.data).toLocaleString('pt-BR')}
                        </span>

                        <span className="text-slate-400">·</span>

                        {onNavigateToUser ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToUser(item.autor);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold flex items-center gap-1 hover:underline cursor-pointer transition text-left"
                            title={`Ver página de usuário de ${item.autor}`}
                          >
                            <User size={12} className="text-blue-500" />
                            <span>{item.autor}</span>
                          </button>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                            <User size={12} className="text-blue-500" />
                            {item.autor}
                          </span>
                        )}

                        <span className="text-slate-400">·</span>

                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {item.tamanho} bytes
                        </span>

                        <span
                          className={`font-mono text-[11px] font-bold px-1 py-0.2 rounded ${
                            delta > 0
                              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                              : delta < 0
                              ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
                              : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      </div>

                      {/* Motivo da Alteração / Edit Summary */}
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                        <span className="text-slate-400 font-serif">“</span>
                        <span className="italic text-[12px]">{item.resumo || 'Sem descrição'}</span>
                        <span className="text-slate-400 font-serif">”</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end md:self-center flex-shrink-0">
                    {!isLatest && (
                      <button
                        onClick={() => handleStartDiff(item.id, historyList[0].id)}
                        title="Comparar esta revisão com a versão atual do artigo"
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition text-[11px] flex items-center gap-1"
                      >
                        <GitCompare size={11} /> cur
                      </button>
                    )}

                    {prevItem && (
                      <button
                        onClick={() => handleStartDiff(prevItem.id, item.id)}
                        title="Comparar esta revisão com a versão imediatamente anterior"
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition text-[11px] flex items-center gap-1"
                      >
                        <GitCompare size={11} /> prev
                      </button>
                    )}

                    <button
                      onClick={() => handlePreviewRevision(item)}
                      title="Visualizar conteúdo desta versão"
                      className="px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-semibold transition text-[11px] flex items-center gap-1"
                    >
                      <Eye size={11} /> Ver Versão
                    </button>

                    {!isLatest && onRestoreRevision && (
                      <button
                        onClick={() => onRestoreRevision(item)}
                        title="Reverter artigo para o conteúdo desta revisão"
                        className="px-2.5 py-1 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 font-semibold transition text-[11px] flex items-center gap-1"
                      >
                        <RotateCcw size={11} /> Reverter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DIFF COMPARISON VIEW */}
      {activeSubView === 'diff' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <GitCompare size={16} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Comparação de Diferenças entre Revisões
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Linhas em <span className="text-red-600 dark:text-red-400 font-bold">vermelho (-)</span> foram removidas na versão anterior e linhas em <span className="text-emerald-600 dark:text-emerald-400 font-bold">verde (+)</span> foram adicionadas na versão mais recente.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDiffMode('unified')}
                  className={`px-2.5 py-0.5 rounded font-medium transition ${
                    diffMode === 'unified'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Unificado
                </button>
                <button
                  type="button"
                  onClick={() => setDiffMode('split')}
                  className={`px-2.5 py-0.5 rounded font-medium transition ${
                    diffMode === 'split'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Lado a Lado
                </button>
              </div>

              <button
                onClick={() => setActiveSubView('list')}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition text-xs"
              >
                Fechar Comparação
              </button>
            </div>
          </div>

          {/* Diff comparison meta cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
            {/* Old revision box */}
            <div className="p-2.5 rounded bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 space-y-1">
              <div className="flex items-center justify-between font-bold text-red-900 dark:text-red-300">
                <span>Versão Anterior (Base)</span>
                <span>v.{oldRevision?.versao || '?'}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <span>{oldRevision?.data ? new Date(oldRevision.data).toLocaleString('pt-BR') : 'Data não informada'} por</span>
                {onNavigateToUser && oldRevision?.autor ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToUser(oldRevision.autor)}
                    className="text-slate-800 dark:text-slate-200 font-bold hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                    title={`Ver página de usuário de ${oldRevision.autor}`}
                  >
                    {oldRevision.autor}
                  </button>
                ) : (
                  <strong className="text-slate-800 dark:text-slate-200">{oldRevision?.autor}</strong>
                )}
              </div>
              <div className="text-slate-700 dark:text-slate-300 italic">
                "{oldRevision?.resumo || 'Sem descrição'}"
              </div>
            </div>

            {/* New revision box */}
            <div className="p-2.5 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300">
                <span>Versão Mais Recente (Destino)</span>
                <span>v.{newRevision?.versao || '?'}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <span>{newRevision?.data ? new Date(newRevision.data).toLocaleString('pt-BR') : 'Data não informada'} por</span>
                {onNavigateToUser && newRevision?.autor ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToUser(newRevision.autor)}
                    className="text-slate-800 dark:text-slate-200 font-bold hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                    title={`Ver página de usuário de ${newRevision.autor}`}
                  >
                    {newRevision.autor}
                  </button>
                ) : (
                  <strong className="text-slate-800 dark:text-slate-200">{newRevision?.autor}</strong>
                )}
              </div>
              <div className="text-slate-700 dark:text-slate-300 italic">
                "{newRevision?.resumo || 'Sem descrição'}"
              </div>
            </div>
          </div>

          {/* Diff Content Rendering */}
          {diffMode === 'unified' ? (
            <div className="font-mono text-[11px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-300 dark:border-slate-800 overflow-x-auto max-h-[500px]">
              {diffLines.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  Nenhuma diferença de texto encontrada entre estas duas versões.
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <tbody>
                    {diffLines.map((line, idx) => {
                      const isAdded = line.type === 'added';
                      const isRemoved = line.type === 'removed';
                      return (
                        <tr
                          key={idx}
                          className={`${
                            isAdded
                              ? 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200'
                              : isRemoved
                              ? 'bg-red-100/70 dark:bg-red-950/40 text-red-950 dark:text-red-200'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <td className="w-8 px-1.5 py-0.5 text-right select-none text-slate-400 font-mono text-[10px]">
                            {line.oldLineNumber || ''}
                          </td>
                          <td className="w-8 px-1.5 py-0.5 text-right select-none text-slate-400 font-mono text-[10px] border-r border-slate-200 dark:border-slate-800">
                            {line.newLineNumber || ''}
                          </td>
                          <td className="w-6 px-1.5 py-0.5 select-none font-bold text-center">
                            {isAdded ? '+' : isRemoved ? '-' : ' '}
                          </td>
                          <td className="px-2 py-0.5 whitespace-pre-wrap break-all font-mono">
                            {line.content || ' '}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* Split / Side-by-Side Diff View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-300 dark:border-slate-800 overflow-x-auto max-h-[450px]">
                <div className="text-[10px] font-bold text-slate-500 mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
                  VERSÃO ANTERIOR (v.{oldRevision?.versao || '?'})
                </div>
                <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all">
                  {oldContent}
                </pre>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-300 dark:border-slate-800 overflow-x-auto max-h-[450px]">
                <div className="text-[10px] font-bold text-slate-500 mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
                  VERSÃO MAIS RECENTE (v.{newRevision?.versao || '?'})
                </div>
                <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all">
                  {newContent}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TIME TRAVEL HISTORICAL PREVIEW VIEW */}
      {activeSubView === 'preview' && previewRevision && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden space-y-4 p-5 sm:p-7">
          {/* Warning Banner */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
              <div>
                <strong className="block font-bold">
                  Você está visualizando a revisão v.{previewRevision.versao || '?'} de{' '}
                  {new Date(previewRevision.data).toLocaleString('pt-BR')}
                </strong>
                <span className="text-[11px] text-amber-800 dark:text-amber-300">
                  Autor:{' '}
                  {onNavigateToUser ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToUser(previewRevision.autor)}
                      className="font-bold hover:underline cursor-pointer text-amber-950 dark:text-amber-100"
                      title={`Ver página de usuário de ${previewRevision.autor}`}
                    >
                      {previewRevision.autor}
                    </button>
                  ) : (
                    <strong>{previewRevision.autor}</strong>
                  )}{' '}
                  · Motivo: <em>"{previewRevision.resumo}"</em>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onRestoreRevision && (
                <button
                  onClick={() => onRestoreRevision(previewRevision)}
                  className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1 shadow-xs transition"
                >
                  <RotateCcw size={12} /> Restaurar esta Versão
                </button>
              )}
              <button
                onClick={() => setActiveSubView('list')}
                className="px-3 py-1 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 font-semibold transition"
              >
                Voltar
              </button>
            </div>
          </div>

          {/* Rendered Historical Article Page */}
          <div
            className="wiki-rendered-content font-wiki-body text-xs"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}
    </div>
  );
};
