import React, { useState } from 'react';
import {
  BookOpen,
  Quote,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Wrench,
  ArrowDownCircle,
} from 'lucide-react';

export interface CitationTooltipData {
  index?: number;
  name?: string;
  tooltipText: string;
  isError?: boolean;
  errorMsg?: string;
  targetId?: string;
}

interface CitationHoverTooltipProps {
  data: CitationTooltipData | null;
  position: { x: number; y: number } | null;
  visible: boolean;
  onFixCitation?: () => void;
  onNavigateToRef?: (index?: number) => void;
  onMouseEnterTooltip?: () => void;
  onMouseLeaveTooltip?: () => void;
}

export const CitationHoverTooltip: React.FC<CitationHoverTooltipProps> = ({
  data,
  position,
  visible,
  onFixCitation,
  onNavigateToRef,
  onMouseEnterTooltip,
  onMouseLeaveTooltip,
}) => {
  const [copied, setCopied] = useState(false);

  if (!visible || !position || !data) return null;

  // Extract any URL inside the citation text
  const urlMatch = data.tooltipText.match(/https?:\/\/[^\s"'<>\)]+/i);
  const detectedUrl = urlMatch ? urlMatch[0] : null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(data.tooltipText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Viewport bounds calculation
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const tooltipWidth = 320;
  let left = position.x - tooltipWidth / 2;
  if (left < 16) left = 16;
  if (left + tooltipWidth > screenWidth - 16) {
    left = screenWidth - tooltipWidth - 16;
  }

  // Position above the hovered element, or below if too close to top
  const top = position.y < 180 ? position.y + 24 : position.y - 12;
  const placement = position.y < 180 ? 'bottom' : 'top';

  return (
    <div
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        transform: placement === 'top' ? 'translateY(-100%)' : 'none',
        width: `${tooltipWidth}px`,
        zIndex: 9999,
      }}
      onMouseEnter={onMouseEnterTooltip}
      onMouseLeave={onMouseLeaveTooltip}
      className={`rounded-xl border shadow-2xl backdrop-blur-md p-3.5 text-xs animate-in fade-in zoom-in-95 duration-150 transition-all pointer-events-auto ${
        data.isError
          ? 'bg-rose-50/95 dark:bg-slate-900/95 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20'
          : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 ring-1 ring-black/5 dark:ring-white/10'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-current/10">
        <div className="flex items-center gap-1.5 min-w-0">
          {data.isError ? (
            <AlertCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <Quote size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
          )}

          <div className="flex items-center gap-1.5 truncate">
            {data.index !== undefined && data.index > 0 && (
              <span className="font-mono font-bold text-[11px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                [{data.index}]
              </span>
            )}
            <span className="font-bold text-[11.5px] truncate">
              {data.isError ? 'Inconsistência de Citação' : 'Pré-visualização da Referência'}
            </span>
          </div>
        </div>

        {data.name && (
          <code className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 truncate max-w-[120px]">
            name="{data.name}"
          </code>
        )}
      </div>

      {/* Body: Reference content */}
      <div className="text-[11.5px] leading-relaxed opacity-95 max-h-36 overflow-y-auto pr-1 select-text break-words">
        {data.tooltipText || '(Conteúdo de citação vazio)'}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-current/10 text-[10.5px]">
        <div className="flex items-center gap-1.5">
          {detectedUrl && (
            <a
              href={detectedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              <span>Abrir Fonte</span>
              <ExternalLink size={10} />
            </a>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            title="Copiar texto da citação"
          >
            {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {data.isError && onFixCitation ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFixCitation();
              }}
              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
              title="Corrigir citação e adicionar placeholder na seção de Referências"
            >
              <Wrench size={10} />
              <span>Fix Citation</span>
            </button>
          ) : (
            onNavigateToRef && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToRef(data.index);
                }}
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                title="Rolar até a nota na seção de referências"
              >
                <span>Ver em Referências</span>
                <ArrowDownCircle size={11} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
