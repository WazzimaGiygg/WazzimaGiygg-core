import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Wrench,
  BookOpen,
  Plus,
  X,
  FileCheck,
  Search,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  CitationValidationResult,
  CitationIssue,
  autoFixCitationIssue,
  fixAllCitationsWithPlaceholders,
} from '../utils/citationValidator';

interface CitationValidatorPanelProps {
  validationResult: CitationValidationResult;
  onApplyFix: (newWikitext: string, successMessage: string) => void;
  currentWikitext: string;
  onOpenCitationModal?: () => void;
  onHighlightInEditor?: (issue: CitationIssue) => void;
  className?: string;
}

export const CitationValidatorPanel: React.FC<CitationValidatorPanelProps> = ({
  validationResult,
  onApplyFix,
  currentWikitext,
  onOpenCitationModal,
  onHighlightInEditor,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'errors' | 'warnings' | 'mapping'>('all');

  const {
    isValid,
    totalCitations,
    definedCitations,
    reusedInvocations,
    hasReferencesSection,
    issues,
    referencesList,
  } = validationResult;

  const errorIssues = issues.filter((i) => i.severity === 'error');
  const warningIssues = issues.filter((i) => i.severity === 'warning');
  const errorCount = errorIssues.length;
  const warningCount = warningIssues.length;

  const handleFixIssue = (issue: CitationIssue) => {
    const fixed = autoFixCitationIssue(currentWikitext, issue);
    let msg = `Inconsistência corrigida: ${issue.title}`;
    if (issue.type === 'missing_references_section') {
      msg = 'Seção "== Referências ==" adicionada automaticamente com {{reflist}}!';
    } else if (issue.type === 'undefined_named_ref') {
      msg = `Definição básica para o marcador "${issue.refName}" inserida no texto.`;
    }
    onApplyFix(fixed, msg);
  };

  const handleFixAllAutoFixable = () => {
    let updated = currentWikitext;
    const fixable = issues.filter((i) => i.autoFixAvailable);
    fixable.forEach((issue) => {
      updated = autoFixCitationIssue(updated, issue);
    });
    onApplyFix(
      updated,
      `${fixable.length} inconsistência(s) de citação corrigida(s) automaticamente!`
    );
  };

  const handleFixAllCitations = () => {
    const result = fixAllCitationsWithPlaceholders(currentWikitext);
    let msg = 'Citações cruzadas com a seção de Referências e entradas pendentes adicionadas como placeholders!';
    if (result.fixedIssuesDescriptions.length > 0) {
      msg = result.fixedIssuesDescriptions.join(' ');
    }
    onApplyFix(result.updatedWikitext, msg);
  };

  // If there are no citations and no references section yet, render a subtle helpful prompt
  if (totalCitations === 0 && !hasReferencesSection) {
    return (
      <div
        className={`px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 ${className}`}
      >
        <div className="flex items-center gap-1.5">
          <FileCheck size={13} className="text-slate-400 shrink-0" />
          <span>
            <strong>Validador de Citações:</strong> Nenhum marcador &lt;ref&gt; adicionado ainda.
          </span>
        </div>
        {onOpenCitationModal && (
          <button
            type="button"
            onClick={onOpenCitationModal}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer text-[10.5px]"
          >
            <Plus size={11} />
            <span>Inserir Primeira Citação</span>
          </button>
        )}
      </div>
    );
  }

  const filteredIssues =
    filterTab === 'errors'
      ? errorIssues
      : filterTab === 'warnings'
      ? warningIssues
      : issues;

  return (
    <div
      className={`border-b transition-colors select-none ${
        errorCount > 0
          ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
          : warningCount > 0
          ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
          : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
      } ${className}`}
    >
      {/* Top Status Banner */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {errorCount > 0 ? (
            <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
          ) : warningCount > 0 ? (
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}

          <div className="flex items-baseline gap-2 truncate text-xs">
            <span className="font-bold">
              {errorCount > 0
                ? `${errorCount} inconsistência(s) de citação encontrada(s)`
                : warningCount > 0
                ? `${warningCount} aviso(s) no sistema de referências`
                : 'Validador: Todas as citações possuem entradas correspondentes'}
            </span>

            <span className="text-[11px] opacity-75 font-mono hidden md:inline truncate">
              ({definedCitations} nota(s) definida(s)
              {reusedInvocations > 0 && ` • ${reusedInvocations} reuso(s)`}
              {hasReferencesSection ? ' • Seção Referências OK' : ' • Seção Referências AUSENTE'})
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          {/* Fix Citations Button: cross-references tags and adds missing placeholders */}
          <button
            type="button"
            onClick={handleFixAllCitations}
            title="Cruzar todas as citações com a seção de Referências e adicionar entradas pendentes como placeholders no rodapé"
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95"
          >
            <Wrench size={11} />
            <span>Fix Citations</span>
          </button>

          {/* Quick Auto-Fix Button if auto-fixable errors exist */}
          {issues.some((i) => i.autoFixAvailable) && (
            <button
              type="button"
              onClick={handleFixAllAutoFixable}
              title="Corrigir todas as inconsistências automáticas detectadas"
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95"
            >
              <Wrench size={11} />
              <span>Auto-Corrigir ({issues.filter((i) => i.autoFixAvailable).length})</span>
            </button>
          )}

          {/* Toggle Details Panel */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
          >
            <span>{isExpanded ? 'Ocultar Validação' : 'Ver Inconsistências & Mapeamento'}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded Details & Inconsistencies Panel */}
      {isExpanded && (
        <div className="p-3 sm:p-4 border-t border-current/10 space-y-3 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 animate-in slide-in-from-top-1 duration-150">
          {/* Navigation Filter Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Todas as Inconsistências</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20 dark:bg-white/20">
                {issues.length}
              </span>
            </button>

            {errorCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterTab('errors')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  filterTab === 'errors'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                }`}
              >
                <AlertCircle size={12} />
                <span>Erros Críticos</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20">
                  {errorCount}
                </span>
              </button>
            )}

            {warningCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterTab('warnings')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  filterTab === 'warnings'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                }`}
              >
                <AlertTriangle size={12} />
                <span>Avisos</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20">
                  {warningCount}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFilterTab('mapping')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ml-auto ${
                filterTab === 'mapping'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
              }`}
            >
              <BookOpen size={12} />
              <span>Mapeamento de Referências ({referencesList.length})</span>
            </button>
          </div>

          {/* Tab 1: Issues View */}
          {filterTab !== 'mapping' && (
            <div className="space-y-2">
              {filteredIssues.length === 0 ? (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <p className="text-xs">
                    Nenhuma inconsistência de citação nesta categoria. Todos os marcadores analisados estão conformes.
                  </p>
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      issue.severity === 'error'
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-100'
                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-100'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {issue.severity === 'error' ? (
                          <AlertCircle size={14} className="text-rose-600 shrink-0" />
                        ) : (
                          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                        )}
                        <strong className="font-bold text-slate-900 dark:text-white">
                          {issue.title}
                        </strong>

                        {issue.line && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold">
                            Linha {issue.line}
                          </span>
                        )}

                        {issue.refName && (
                          <code className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-mono font-bold">
                            name="{issue.refName}"
                          </code>
                        )}
                      </div>

                      <p className="text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                        {issue.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {onHighlightInEditor && issue.line && (
                        <button
                          type="button"
                          onClick={() => onHighlightInEditor(issue)}
                          title="Destacar e localizar este marcador no editor"
                          className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition"
                        >
                          <Search size={11} />
                          <span>Destacar no Editor</span>
                        </button>
                      )}

                      {issue.autoFixAvailable && (
                        <button
                          type="button"
                          onClick={() => handleFixIssue(issue)}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        >
                          <Wrench size={11} />
                          <span>Corrigir</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Reference Entries Mapping View */}
          {filterTab === 'mapping' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Mapeamento de Citações para a Seção de Referências
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    hasReferencesSection
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {hasReferencesSection ? '✓ Seção {{reflist}} presente' : '✗ Seção {{reflist}} ausente'}
                </span>
              </div>

              {referencesList.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-xs">Nenhum marcador &lt;ref&gt; definido no corpo do artigo.</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {referencesList.map((entry) => (
                    <div
                      key={entry.index}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0 text-sm">
                          [{entry.index}]
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {entry.name && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-bold">
                                name="{entry.name}"
                              </span>
                            )}
                            {entry.line && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Linha {entry.line}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug break-words">
                            {entry.content.replace(/<[^>]*>/g, '') || '(conteúdo vazio)'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10.5px]">
                        {entry.reusedCount > 0 ? (
                          <span
                            title={`Esta referência é reutilizada ${entry.reusedCount} vez(es) via <ref name="${entry.name}" />`}
                            className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold"
                          >
                            +{entry.reusedCount} reuso(s)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                            1 uso
                          </span>
                        )}
                        <span
                          className="text-emerald-600 dark:text-emerald-400 font-bold"
                          title="Entrada validada e vinculada à seção de Referências"
                        >
                          ✓
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
