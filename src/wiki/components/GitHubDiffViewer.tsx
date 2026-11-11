import React, { useState, useMemo } from 'react';
import {
  FileCode2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  SlidersHorizontal,
  FilePlus2,
  FileMinus2,
  FileDiff,
  ArrowUpRight,
  Code2,
  Eye,
  Terminal,
} from 'lucide-react';
import {
  GitHubCommitFile,
  GitHubDiffService,
  ParsedDiffLine,
  GITHUB_REPO_CONFIG,
} from '../services/githubDiffService';

interface GitHubDiffViewerProps {
  files: GitHubCommitFile[];
  commitSha?: string;
  isDetailedLoading?: boolean;
}

export const GitHubDiffViewer: React.FC<GitHubDiffViewerProps> = ({
  files,
  commitSha,
  isDetailedLoading = false,
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(() => {
    // Abre automaticamente os primeiros 3 arquivos por conveniência
    const initial: Record<string, boolean> = {};
    files.slice(0, 3).forEach((f) => {
      initial[f.filename] = true;
    });
    return initial;
  });

  const [filterQuery, setFilterQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [showOnlyChangedLines, setShowOnlyChangedLines] = useState(false);

  // Toggle individual file
  const toggleFile = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  // Expand or Collapse All
  const handleExpandAll = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    files.forEach((f) => {
      updated[f.filename] = expand;
    });
    setExpandedFiles(updated);
  };

  const handleCopyPatch = (patchText?: string, filename?: string) => {
    if (!patchText) return;
    navigator.clipboard.writeText(patchText);
    if (filename) {
      setCopiedFile(filename);
      setTimeout(() => setCopiedFile(null), 2000);
    }
  };

  // Filtered files
  const filteredFiles = useMemo(() => {
    const safeFiles = Array.isArray(files) ? files : [];
    return safeFiles.filter((f) => {
      if (!f) return false;
      const matchStatus = selectedStatus === 'all' || f.status === selectedStatus;
      const q = filterQuery.toLowerCase().trim();
      const matchQuery = !q || (f.filename || '').toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [files, filterQuery, selectedStatus]);

  const totalAdditions = useMemo(
    () => (Array.isArray(files) ? files : []).reduce((acc, f) => acc + (f?.additions || 0), 0),
    [files]
  );
  const totalDeletions = useMemo(
    () => (Array.isArray(files) ? files : []).reduce((acc, f) => acc + (f?.deletions || 0), 0),
    [files]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'added':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <FilePlus2 size={11} />
            ADICIONADO
          </span>
        );
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <FileMinus2 size={11} />
            REMOVIDO
          </span>
        );
      case 'renamed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <FileDiff size={11} />
            RENOMEADO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <FileDiff size={11} />
            MODIFICADO
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Controle de Arquivos e Estatísticas do DIFF */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Métricas Agregadas */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Code2 size={14} className="text-blue-500" />
            <span>Arquivos Alterados ({files.length}):</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[11px] border border-emerald-300 dark:border-emerald-800">
            +{totalAdditions} linhas
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-mono font-bold text-[11px] border border-rose-300 dark:border-rose-800">
            -{totalDeletions} linhas
          </span>
        </div>

        {/* Botões de Ação e Filtro */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleExpandAll(true)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition"
          >
            Expandir Todos
          </button>
          <button
            type="button"
            onClick={() => handleExpandAll(false)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition"
          >
            Recolher Todos
          </button>

          <button
            type="button"
            onClick={() => setShowOnlyChangedLines((prev) => !prev)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition flex items-center gap-1 ${
              showOnlyChangedLines
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
            }`}
            title="Ocultar linhas de contexto neutras e exibir apenas adições e deleções"
          >
            <SlidersHorizontal size={11} />
            <span>{showOnlyChangedLines ? 'Todas as Linhas' : 'Apenas Mudanças'}</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Arquivos por Nome ou Tipo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filtrar arquivos por caminho (ex: src/components, rules, .tsx)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os Status</option>
          <option value="modified">Apenas Modificados</option>
          <option value="added">Apenas Adicionados</option>
          <option value="removed">Apenas Removidos</option>
        </select>
      </div>

      {isDetailedLoading && (
        <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 font-medium animate-pulse">
          <Terminal size={14} />
          <span>Carregando patches completos de diff diretamente da API do GitHub...</span>
        </div>
      )}

      {/* Lista de Arquivos com Diffs Renderizados */}
      <div className="space-y-3">
        {filteredFiles.map((file) => {
          const isExpanded = !!expandedFiles[file.filename];
          const hasPatch = !!file.patch;
          const parsedLines: ParsedDiffLine[] = hasPatch
            ? GitHubDiffService.parseGitPatch(file.patch!)
            : [];

          const displayLines = showOnlyChangedLines
            ? parsedLines.filter((l) => l.type === 'add' || l.type === 'delete' || l.type === 'header')
            : parsedLines;

          return (
            <div
              key={file.filename}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Cabeçalho do Arquivo */}
              <div
                onClick={() => toggleFile(file.filename)}
                className="p-3 bg-slate-50/80 dark:bg-slate-850/80 flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition border-b border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  <FileCode2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                    {file.filename}
                  </span>
                  {file.previous_filename && (
                    <span className="text-[10px] text-slate-400 font-mono italic truncate">
                      (era {file.previous_filename})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Status */}
                  {getStatusBadge(file.status)}

                  {/* Contadores */}
                  <div className="flex items-center gap-1 font-mono text-[11px] font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>
                    <span className="text-slate-300 dark:text-slate-700">/</span>
                    <span className="text-rose-600 dark:text-rose-400">-{file.deletions}</span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 pl-1" onClick={(e) => e.stopPropagation()}>
                    {hasPatch && (
                      <button
                        type="button"
                        onClick={() => handleCopyPatch(file.patch, file.filename)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                        title="Copiar patch deste arquivo"
                      >
                        {copiedFile === file.filename ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}

                    {file.blob_url && (
                      <a
                        href={file.blob_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        title="Ver arquivo completo no GitHub"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Corpo do DIFF (Quando Expandido) */}
              {isExpanded && (
                <div className="overflow-x-auto bg-slate-950 font-mono text-[11px] leading-relaxed select-text">
                  {hasPatch ? (
                    <table className="w-full border-collapse">
                      <tbody>
                        {displayLines.map((line, idx) => {
                          if (line.type === 'header') {
                            return (
                              <tr
                                key={idx}
                                className="bg-slate-900/90 text-slate-400 border-y border-slate-800/80"
                              >
                                <td className="py-1 px-3 text-center text-slate-600 select-none w-10">
                                  ...
                                </td>
                                <td className="py-1 px-3 text-center text-slate-600 select-none w-10">
                                  ...
                                </td>
                                <td className="py-1 px-3 font-semibold text-sky-400/90 italic">
                                  {line.text}
                                </td>
                              </tr>
                            );
                          }

                          if (line.type === 'add') {
                            return (
                              <tr
                                key={idx}
                                className="bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-200 border-l-2 border-emerald-500 transition-colors"
                              >
                                <td className="py-0.5 px-2 text-right text-emerald-600/70 select-none w-10 text-[10px]"></td>
                                <td className="py-0.5 px-2 text-right text-emerald-400/90 select-none w-10 font-bold text-[10px]">
                                  {line.newLineNumber}
                                </td>
                                <td className="py-0.5 px-3 whitespace-pre font-mono">
                                  <span className="text-emerald-400 font-bold select-none inline-block w-3">
                                    +
                                  </span>
                                  <span>{line.text}</span>
                                </td>
                              </tr>
                            );
                          }

                          if (line.type === 'delete') {
                            return (
                              <tr
                                key={idx}
                                className="bg-rose-950/40 hover:bg-rose-950/60 text-rose-200 border-l-2 border-rose-500 transition-colors"
                              >
                                <td className="py-0.5 px-2 text-right text-rose-400/90 select-none w-10 font-bold text-[10px]">
                                  {line.oldLineNumber}
                                </td>
                                <td className="py-0.5 px-2 text-right text-rose-600/70 select-none w-10 text-[10px]"></td>
                                <td className="py-0.5 px-3 whitespace-pre font-mono">
                                  <span className="text-rose-400 font-bold select-none inline-block w-3">
                                    -
                                  </span>
                                  <span>{line.text}</span>
                                </td>
                              </tr>
                            );
                          }

                          // Context line
                          return (
                            <tr
                              key={idx}
                              className="text-slate-300 hover:bg-slate-900/60 transition-colors"
                            >
                              <td className="py-0.5 px-2 text-right text-slate-600 select-none w-10 text-[10px]">
                                {line.oldLineNumber}
                              </td>
                              <td className="py-0.5 px-2 text-right text-slate-600 select-none w-10 text-[10px]">
                                {line.newLineNumber}
                              </td>
                              <td className="py-0.5 px-3 whitespace-pre font-mono">
                                <span className="select-none inline-block w-3"> </span>
                                <span>{line.text}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-5 text-center text-slate-400 text-xs space-y-2">
                      <p>
                        O GitHub omitiu o patch direto deste arquivo (arquivo volumoso ou novo componente criado com muitas linhas).
                      </p>
                      {file.blob_url && (
                        <a
                          href={file.blob_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition text-xs"
                        >
                          <span>Examinar código completo no GitHub</span>
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredFiles.length === 0 && (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
            Nenhum arquivo encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};
