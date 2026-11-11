import React from 'react';
import { AlertTriangle, X, ArrowLeft, Trash2, Save } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  isNewArticle: boolean;
  articleTitle?: string;
  onStay: () => void;
  onDiscardAndLeave: () => void;
  onSave?: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  isNewArticle,
  articleTitle,
  onStay,
  onDiscardAndLeave,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-modal-title"
      >
        {/* Header */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 id="unsaved-modal-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Alterações não salvas serão perdidas
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5 font-medium">
                {isNewArticle ? 'Novo artigo em elaboração' : 'Edição com modificações não salvas'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStay}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition cursor-pointer"
            title="Continuar editando"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {isNewArticle ? (
            <p>
              Você está criando um <strong className="text-slate-900 dark:text-white font-semibold">novo artigo</strong>
              {articleTitle ? ` ("${articleTitle}")` : ''}. Se você sair agora sem salvar,{' '}
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                todas as alterações e o conteúdo redigido serão perdidos
              </span>{' '}
              e o novo verbete não será publicado na enciclopédia.
            </p>
          ) : (
            <p>
              Você realizou alterações no artigo{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                "{articleTitle || 'em edição'}"
              </strong>
              . Se você sair agora sem salvar,{' '}
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                suas modificações recentes serão totalmente descartadas
              </span>{' '}
              e a versão anterior do artigo será mantida.
            </p>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="font-mono text-xs">💡</span>
            <span>
              Dica: Você pode pressionar <kbd className="font-mono font-semibold px-1 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200">Ctrl+S</kbd> para salvar e publicar suas alterações.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDiscardAndLeave}
            className="w-full sm:w-auto px-3 py-1.5 rounded text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Descartar e Sair</span>
          </button>

          <button
            type="button"
            onClick={onStay}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ArrowLeft size={13} />
            <span>Continuar Editando</span>
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save size={13} />
              <span>Salvar Artigo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
