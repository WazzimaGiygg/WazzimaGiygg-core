/**
 * @file VersionDiff.tsx
 * @description Componente de visualização de diferenças (Diffs) entre duas revisões/versões
 * de conteúdo do WikiWorldWeb. Suporta visualização Lado a Lado (Side-by-Side) e Unificada (Inline),
 * com destaque por linha e por palavra, métricas de adição/remoção e suporte a temas claro/escuro.
 */

import React, { useState, useMemo } from 'react';
import { diffLines, diffWordsWithSpace, Change } from 'diff';
import {
  Columns,
  AlignLeft,
  PlusCircle,
  MinusCircle,
  Copy,
  Check,
  RotateCcw,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Version } from '../types';

export interface VersionDiffProps {
  oldContent: string;
  newContent: string;
  oldVersionLabel?: string;
  newVersionLabel?: string;
  oldVersion?: Version | null;
  newVersion?: Version | null;
  onRevert?: (versionNumber: number) => void;
  isReverting?: boolean;
  className?: string;
}

type ViewMode = 'split' | 'unified';

interface LineDiffItem {
  type: 'added' | 'removed' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  text: string;
}

export const VersionDiff: React.FC<VersionDiffProps> = ({
  oldContent = '',
  newContent = '',
  oldVersionLabel,
  newVersionLabel,
  oldVersion,
  newVersion,
  onRevert,
  isReverting = false,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [copied, setCopied] = useState(false);
  const [wordHighlight, setWordHighlight] = useState(true);

  // Calcula o diff usando a biblioteca 'diff'
  const { lineDiffs, splitDiffs, stats } = useMemo(() => {
    const rawLineChanges: Change[] = diffLines(oldContent, newContent);

    let addedLinesCount = 0;
    let removedLinesCount = 0;
    let unchangedLinesCount = 0;

    let oldLineCounter = 1;
    let newLineCounter = 1;

    const unifiedList: LineDiffItem[] = [];
    const leftSide: (LineDiffItem | null)[] = [];
    const rightSide: (LineDiffItem | null)[] = [];

    // Estrutura temporária para blocos de substituição
    for (const change of rawLineChanges) {
      // Divide por quebras de linha mantendo cada linha individual
      const lines = change.value.replace(/\r\n/g, '\n').split('\n');
      // Se a última for vazia devido a \n final, remove o trailing vazio desnecessário se não for linha única
      if (lines.length > 1 && lines[lines.length - 1] === '') {
        lines.pop();
      }

      for (const lineText of lines) {
        if (change.added) {
          addedLinesCount++;
          unifiedList.push({
            type: 'added',
            newLineNumber: newLineCounter,
            text: lineText,
          });
          rightSide.push({
            type: 'added',
            newLineNumber: newLineCounter,
            text: lineText,
          });
          leftSide.push(null); // Espaço vazio no lado esquerdo
          newLineCounter++;
        } else if (change.removed) {
          removedLinesCount++;
          unifiedList.push({
            type: 'removed',
            oldLineNumber: oldLineCounter,
            text: lineText,
          });
          leftSide.push({
            type: 'removed',
            oldLineNumber: oldLineCounter,
            text: lineText,
          });
          rightSide.push(null); // Espaço vazio no lado direito
          oldLineCounter++;
        } else {
          unchangedLinesCount++;
          unifiedList.push({
            type: 'unchanged',
            oldLineNumber: oldLineCounter,
            newLineNumber: newLineCounter,
            text: lineText,
          });
          leftSide.push({
            type: 'unchanged',
            oldLineNumber: oldLineCounter,
            newLineNumber: oldLineCounter,
            text: lineText,
          });
          rightSide.push({
            type: 'unchanged',
            oldLineNumber: newLineCounter,
            newLineNumber: newLineCounter,
            text: lineText,
          });
          oldLineCounter++;
          newLineCounter++;
        }
      }
    }

    // Calcula diferença em caracteres/bytes
    const oldBytes = new Blob([oldContent]).size;
    const newBytes = new Blob([newContent]).size;
    const byteDiff = newBytes - oldBytes;

    return {
      lineDiffs: unifiedList,
      splitDiffs: { left: leftSide, right: rightSide },
      stats: {
        added: addedLinesCount,
        removed: removedLinesCount,
        unchanged: unchangedLinesCount,
        byteDiff,
      },
    };
  }, [oldContent, newContent]);

  // Copia o patch/diff em texto simples
  const handleCopyDiff = () => {
    const rawLines = lineDiffs.map((l) => {
      const prefix = l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : '  ';
      return `${prefix}${l.text}`;
    });
    navigator.clipboard.writeText(rawLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Renderiza realce a nível de palavra para linhas modificadas
  const renderInlineWordDiff = (oldText: string, newText: string) => {
    if (!wordHighlight) return <span>{newText}</span>;
    const wordChanges = diffWordsWithSpace(oldText, newText);

    return (
      <span>
        {wordChanges.map((part, idx) => {
          if (part.added) {
            return (
              <span
                key={idx}
                className="bg-emerald-200 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 font-semibold px-0.5 rounded-xs"
              >
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            return (
              <span
                key={idx}
                className="bg-rose-200 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100 line-through font-semibold px-0.5 rounded-xs"
              >
                {part.value}
              </span>
            );
          }
          return <span key={idx}>{part.value}</span>;
        })}
      </span>
    );
  };

  return (
    <div
      id="version-diff-container"
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col font-sans ${className}`}
    >
      {/* Cabeçalho com estatísticas e botões de controle */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        {/* Informações das versões comparadas */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>{oldVersionLabel || (oldVersion ? `Versão #${oldVersion.versionNumber}` : 'Versão Anterior')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {newVersionLabel || (newVersion ? `Versão #${newVersion.versionNumber}` : 'Versão Atual')}
                </span>
              </div>
              {(oldVersion || newVersion) && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                  {oldVersion && (
                    <span>
                      Por {oldVersion.userName} em {new Date(oldVersion.timestamp).toLocaleDateString()}
                    </span>
                  )}
                  {newVersion && (
                    <span>
                      • Atualizado por {newVersion.userName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Badges de estatísticas (+X / -Y) */}
          <div className="flex items-center gap-2 ml-auto sm:ml-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-medium"
              title="Linhas adicionadas"
            >
              <PlusCircle className="w-3 h-3" />
              +{stats.added}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-mono font-medium"
              title="Linhas removidas"
            >
              <MinusCircle className="w-3 h-3" />
              -{stats.removed}
            </span>
            <span
              className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md border ${
                stats.byteDiff > 0
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                  : stats.byteDiff < 0
                  ? 'bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title="Diferença em bytes"
            >
              {stats.byteDiff > 0 ? `+${stats.byteDiff}B` : `${stats.byteDiff}B`}
            </span>
          </div>
        </div>

        {/* Barra de ações e opções de visualização */}
        <div className="flex items-center gap-1.5">
          {/* Alternar modo de visualização */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
            <button
              id="diff-view-split-btn"
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lado a Lado</span>
            </button>
            <button
              id="diff-view-unified-btn"
              type="button"
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'unified'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unificado</span>
            </button>
          </div>

          {/* Botão Copiar Diff */}
          <button
            id="diff-copy-btn"
            type="button"
            onClick={handleCopyDiff}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Copiar texto das alterações (patch)"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          {/* Botão de Reversão Rápida */}
          {oldVersion && onRevert && (
            <button
              id="diff-revert-btn"
              type="button"
              onClick={() => onRevert(oldVersion.versionNumber)}
              disabled={isReverting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50 shadow-xs"
              title={`Restaurar artigo para a versão #${oldVersion.versionNumber}`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReverting ? 'animate-spin' : ''}`} />
              <span>{isReverting ? 'Revertendo...' : `Reverter para #${oldVersion.versionNumber}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Comentário de edição da versão nova se existir */}
      {newVersion?.comment && (
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 italic">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 not-italic" />
          <span>Sumário da edição: &ldquo;{newVersion.comment}&rdquo;</span>
        </div>
      )}

      {/* Área principal de exibição do Diff */}
      <div className="overflow-x-auto text-[13px] font-mono leading-relaxed bg-slate-50/40 dark:bg-slate-950/40">
        {lineDiffs.length === 0 || (stats.added === 0 && stats.removed === 0) ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 italic text-sm">
            Nenhuma diferença encontrada entre os conteúdos selecionados.
          </div>
        ) : viewMode === 'unified' ? (
          /* MODO UNIFICADO (INLINE) */
          <div className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/40">
            {lineDiffs.map((line, idx) => {
              const isAdd = line.type === 'added';
              const isRem = line.type === 'removed';

              const rowBg = isAdd
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-l-4 border-emerald-500'
                : isRem
                ? 'bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-l-4 border-rose-500'
                : 'text-slate-700 dark:text-slate-300 border-l-4 border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-900/50';

              return (
                <div key={idx} className={`flex items-start px-2 py-0.5 ${rowBg}`}>
                  {/* Número da linha antiga */}
                  <span className="w-10 text-right pr-2 text-slate-400 dark:text-slate-600 select-none text-[11px] shrink-0 font-mono">
                    {line.oldLineNumber || ''}
                  </span>
                  {/* Número da linha nova */}
                  <span className="w-10 text-right pr-2 text-slate-400 dark:text-slate-600 select-none text-[11px] shrink-0 font-mono border-r border-slate-200 dark:border-slate-800">
                    {line.newLineNumber || ''}
                  </span>
                  {/* Marcador (+ / - / espaço) */}
                  <span className="w-6 text-center select-none font-bold shrink-0">
                    {isAdd ? (
                      <span className="text-emerald-600 dark:text-emerald-400">+</span>
                    ) : isRem ? (
                      <span className="text-rose-600 dark:text-rose-400">-</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-700">&nbsp;</span>
                    )}
                  </span>
                  {/* Conteúdo da linha */}
                  <div className="flex-1 overflow-x-auto whitespace-pre-wrap break-all pr-2">
                    {line.text || <br />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* MODO LADO A LADO (SPLIT) */
          <div className="min-w-full grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
            {/* Coluna Esquerda: Versão Anterior */}
            <div className="flex flex-col">
              <div className="px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-sans font-semibold text-slate-600 dark:text-slate-300">
                {oldVersionLabel || 'Versão Anterior'}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {splitDiffs.left.map((item, idx) => {
                  if (!item) {
                    // Linha em branco correspondente a uma adição do lado direito
                    return (
                      <div
                        key={`left-${idx}`}
                        className="flex items-start px-2 py-0.5 bg-slate-50/30 dark:bg-slate-900/30 border-l-4 border-transparent text-slate-300 dark:text-slate-700 select-none"
                      >
                        <span className="w-10 pr-2 text-right text-[11px] font-mono opacity-30">•</span>
                        <div className="flex-1">&nbsp;</div>
                      </div>
                    );
                  }

                  const isRem = item.type === 'removed';
                  const rowBg = isRem
                    ? 'bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-l-4 border-rose-500'
                    : 'text-slate-700 dark:text-slate-300 border-l-4 border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-900/50';

                  return (
                    <div key={`left-${idx}`} className={`flex items-start px-2 py-0.5 ${rowBg}`}>
                      <span className="w-10 text-right pr-2 text-slate-400 dark:text-slate-600 select-none text-[11px] shrink-0 font-mono border-r border-slate-200 dark:border-slate-800 mr-2">
                        {item.oldLineNumber || ''}
                      </span>
                      <div className="flex-1 overflow-x-auto whitespace-pre-wrap break-all pr-2">
                        {item.text || <br />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coluna Direita: Versão Nova */}
            <div className="flex flex-col">
              <div className="px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-sans font-semibold text-slate-600 dark:text-slate-300">
                {newVersionLabel || 'Versão Selecionada / Atual'}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {splitDiffs.right.map((item, idx) => {
                  if (!item) {
                    // Linha em branco correspondente a uma remoção do lado esquerdo
                    return (
                      <div
                        key={`right-${idx}`}
                        className="flex items-start px-2 py-0.5 bg-slate-50/30 dark:bg-slate-900/30 border-l-4 border-transparent text-slate-300 dark:text-slate-700 select-none"
                      >
                        <span className="w-10 pr-2 text-right text-[11px] font-mono opacity-30">•</span>
                        <div className="flex-1">&nbsp;</div>
                      </div>
                    );
                  }

                  const isAdd = item.type === 'added';
                  const rowBg = isAdd
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-l-4 border-emerald-500'
                    : 'text-slate-700 dark:text-slate-300 border-l-4 border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-900/50';

                  return (
                    <div key={`right-${idx}`} className={`flex items-start px-2 py-0.5 ${rowBg}`}>
                      <span className="w-10 text-right pr-2 text-slate-400 dark:text-slate-600 select-none text-[11px] shrink-0 font-mono border-r border-slate-200 dark:border-slate-800 mr-2">
                        {item.newLineNumber || ''}
                      </span>
                      <div className="flex-1 overflow-x-auto whitespace-pre-wrap break-all pr-2">
                        {item.text || <br />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé com atalhos e legendas */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
            <span>Adições / Inserções</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>
            <span>Remoções / Exclusões</span>
          </span>
        </div>
        <span className="text-[11px]">
          WikiWorldWeb Versioning Engine v1.0
        </span>
      </div>
    </div>
  );
};
