import React, { useState } from 'react';
import {
  Save,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Tag,
  User,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../types';

interface SaveReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (editSummary: string, isMinor: boolean) => Promise<void>;
  isNewArticle: boolean;
  currentTitle: string;
  previousLength: number;
  newLength: number;
  user: UserProfile | null;
}

const COMMON_REASONS = [
  '✏️ Correção ortográfica e gramatical',
  '📊 Atualização de dados e estatísticas',
  '📚 Adição de fontes e referências bibliográficas',
  '📑 Nova seção de conteúdo adicionada',
  '🧹 Reorganização estrutural e formatação',
  '🔗 Ajuste e correção de hiperligações internas',
  '🖼️ Inclusão de imagens e infoboxes',
  '🚀 Reversão / Restauração de versão anterior',
];

export const SaveReasonModal: React.FC<SaveReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isNewArticle,
  currentTitle,
  previousLength,
  newLength,
  user,
}) => {
  const [reason, setReason] = useState(isNewArticle ? 'Criação inicial do artigo' : '');
  const [isMinor, setIsMinor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const deltaBytes = newLength - previousLength;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Por favor, informe o motivo da alteração antes de publicar.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim(), isMinor);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar alteração:', err);
      setErrorMessage('Ocorreu um erro ao salvar o artigo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectQuickReason = (selected: string) => {
    // Strip emoji if desired or keep clean text
    const clean = selected.replace(/^[^\w\s]+/, '').trim();
    setReason(clean);
    setErrorMessage('');
    if (clean.toLowerCase().includes('ortográfica') || clean.toLowerCase().includes('formatação')) {
      setIsMinor(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-2xl overflow-hidden animate-in zoom-in-95 text-xs">
        {/* Header */}
        <div className="bg-[#1e293b] p-3.5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Save size={16} className="text-blue-400" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
                {isNewArticle ? 'Publicar Novo Artigo' : 'Gravar Alterações no Artigo'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Artigo: <strong className="text-slate-200">{currentTitle || 'Sem título'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Audit summary banner */}
          <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <User size={13} className="text-blue-500" />
              <span>Autor: <strong>{user?.displayName || user?.email || 'Colaborador Anônimo'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Tamanho:</span>
              <strong className="text-slate-900 dark:text-white">{newLength} bytes</strong>
              <span
                className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  deltaBytes > 0
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950'
                    : deltaBytes < 0
                    ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950'
                    : 'text-slate-500 bg-slate-200 dark:bg-slate-700'
                }`}
              >
                {deltaBytes > 0 ? `+${deltaBytes}` : deltaBytes}
              </span>
            </div>
          </div>

          {/* Mandatory Reason Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between">
              <span>
                Motivo da Alteração / Sumário da Edição <strong className="text-red-500">*</strong>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Obrigatório</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Ex: Correção de dados estatísticos da Linha 4-Amarela..."
              className={`w-full px-3 py-2 text-xs rounded bg-slate-50 dark:bg-slate-800 border ${
                errorMessage
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
              } text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 font-medium`}
            />
            {errorMessage && (
              <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-medium mt-1">
                <AlertCircle size={12} /> {errorMessage}
              </p>
            )}
          </div>

          {/* Quick Reason Suggestions / Chips */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
              <Tag size={11} /> Motivos Frequentes (clique para preencher):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REASONS.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickReason(r)}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-[10px] font-medium transition text-slate-700 dark:text-slate-300 text-left"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Minor Edit Checkbox */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isMinor}
                onChange={(e) => setIsMinor(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Marcar como edição menor <span className="text-slate-500 font-mono text-[10px]">[m]</span>
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Marque esta opção para ajustes de pontuação, formatação leve ou correção de digitação que não alteram os fatos essenciais.
                </p>
              </div>
            </label>
          </div>

          {/* Legal & Ethics Compliance Notice */}
          <div className="p-2.5 rounded bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-300">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Ao salvar, você concorda com os termos da licença CC BY-SA 4.0 e confirma que esta edição cumpre as{' '}
              <a
                href="/?uid=Special:EditingEthics"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 dark:text-emerald-300 font-semibold underline hover:text-emerald-800"
              >
                Regras de Ética de Edição (LGPD & GDPR)
              </a>
              , sem dados pessoais privados (doxxing) ou violações de direitos autorais.
            </span>
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-mono">
              Ficará registrado no histórico público
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Save size={13} />
                {isSubmitting ? 'Publicando...' : 'Confirmar e Publicar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
