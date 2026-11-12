import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, X, Lock, Unlock, AlertCircle } from 'lucide-react';

interface ModerationLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'article' | 'collection';
  targetTitle: string;
  isCurrentlyLocked: boolean;
  currentReason?: string;
  lockedBy?: string;
  onConfirm: (reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'Prevenção contra vandalismo recorrente',
  'Disputa editorial ou guerra de edições',
  'Página institucional e conteúdo oficial verificado',
  'Proteção de tópico controverso ou de alta visibilidade',
  'Coleção histórica protegida contra novos envios',
  'Outro motivo personalizado',
];

export const ModerationLockModal: React.FC<ModerationLockModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetTitle,
  isCurrentlyLocked,
  currentReason,
  lockedBy,
  onConfirm,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const typeLabel = targetType === 'article' ? 'o artigo' : 'a coleção';
  const typeNoun = targetType === 'article' ? 'Artigo' : 'Coleção';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const finalReason =
        selectedPreset === 'Outro motivo personalizado'
          ? customReason.trim() || 'Protegido pela moderação'
          : customReason.trim()
          ? `${selectedPreset} - ${customReason.trim()}`
          : selectedPreset;

      await onConfirm(finalReason);
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar bloqueio de moderação:', err);
      setError(err?.message || 'Falha ao processar solicitação de moderação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
              isCurrentlyLocked
                ? 'bg-emerald-600'
                : 'bg-amber-600'
            }`}
          >
            {isCurrentlyLocked ? <Unlock size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <h3 className="text-base font-bold font-serif-heading text-slate-900 dark:text-white">
              {isCurrentlyLocked
                ? `Desproteger ${typeNoun}`
                : `Proteger / Bloquear ${typeNoun}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ferramenta Administrativa de Moderação da WikiWorldWeb
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Alvo da Operação:
            </span>
            <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {targetTitle}
            </div>
          </div>

          {isCurrentlyLocked ? (
            <div className="space-y-3">
              <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock size={13} />
                  <span>Este item está atualmente protegido</span>
                </div>
                {currentReason && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    <strong>Motivo atual:</strong> {currentReason}
                  </p>
                )}
                {lockedBy && (
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    Bloqueado por: {lockedBy}
                  </p>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Ao desproteger {typeLabel}, usuários comuns (com perfil de editor) voltarão a ter permissão para propor e salvar edições neste item.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="p-3 rounded bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-blue-600" />
                  <span>Efeito do Bloqueio:</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Usuários comuns e editores regulares <strong>NÃO</strong> poderão editar este {targetType === 'article' ? 'artigo' : 'coleção'}. Apenas membros da moderação e administradores terão acesso a salvar modificações.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo da Proteção / Bloqueio:
                </label>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  {PRESET_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detalhes Adicionais (opcional):
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Explique justificativa administrativa ou número do chamado de mediação..."
                  rows={2}
                  className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Lock size={13} />
                  {isSubmitting ? 'Aplicando...' : `Confirmar Proteção`}
                </button>
              </div>
            </form>
          )}

          {isCurrentlyLocked && (
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Unlock size={13} />
                {isSubmitting ? 'Removendo...' : `Confirmar Desbloqueio`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
