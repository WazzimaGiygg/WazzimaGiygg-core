import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  LogOut,
  Mail,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  HelpCircle,
  Scale,
  Shield,
  Check,
} from 'lucide-react';
import { UserProfile, UnblockCategory, UnblockRequest } from '../types';
import { StorageService } from '../services/storageService';

interface BannedOverlayProps {
  reason?: string;
  currentUser?: UserProfile | null;
  onLogout: () => void;
}

export const BannedOverlay: React.FC<BannedOverlayProps> = ({
  reason = 'Violação das diretrizes editoriais ou vandalismo na WikiWorldWeb.',
  currentUser,
  onLogout,
}) => {
  const [showAppealModal, setShowAppealModal] = useState<boolean>(false);
  const [existingRequests, setExistingRequests] = useState<UnblockRequest[]>([]);
  const [category, setCategory] = useState<UnblockCategory>('vandalismo_acidental');
  const [appealJustification, setAppealJustification] = useState<string>('');
  const [commitmentToGuidelines, setCommitmentToGuidelines] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      StorageService.getUnblockRequestsForUser(currentUser.uid || currentUser.username || '').then((res) => {
        setExistingRequests(res);
      });
    }
  }, [currentUser, submitSuccess]);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealJustification.trim()) return;

    setIsSubmitting(true);
    try {
      await StorageService.createUnblockRequest({
        userUid: currentUser?.uid || `user-${Date.now()}`,
        username: currentUser?.username || currentUser?.displayName || 'Usuario_Suspenso',
        displayName: currentUser?.displayName || currentUser?.username || 'Usuario_Suspenso',
        email: currentUser?.email,
        userRoleAtBan: currentUser?.role || 'leitor',
        blockReason: reason,
        blockedBy: 'Moderação WikiWorldWeb',
        blockedAt: new Date().toISOString(),
        category,
        appealJustification: appealJustification.trim(),
        commitmentToGuidelines:
          commitmentToGuidelines.trim() || 'Comprometo-me a seguir rigorosamente as diretrizes da WikiWorldWeb.',
        urgency: category === 'revisao_lgpd_marco_civil' ? 'alta' : 'media',
        ipAddress: '177.136.24.12',
      });

      setSubmitSuccess(true);
      setShowAppealModal(false);
      setAppealJustification('');
      setCommitmentToGuidelines('');
    } catch (err) {
      console.error('Error submitting appeal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const latestRequest = existingRequests[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-xs">
      <div className="max-w-md w-full bg-slate-900 border border-red-500/80 rounded-lg p-6 text-center text-white shadow-2xl animate-in zoom-in-95">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-500 flex items-center justify-center text-red-500 mb-3 shadow-sm">
          <ShieldAlert size={26} />
        </div>
        <h2 className="text-lg font-bold text-red-500 font-serif-heading font-mono uppercase tracking-wider">
          Conta Suspensa
        </h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          O acesso de edição da sua conta foi preventivamente suspenso na WikiWorldWeb.
        </p>

        <div className="mt-3 p-3 bg-red-950/40 border border-red-800/60 rounded text-[11px] text-red-200 text-left font-mono">
          <span className="font-bold block mb-0.5 uppercase text-red-400">Motivo Registrado:</span>
          {reason}
        </div>

        {/* Existing Appeal Ticket Status if exists */}
        {latestRequest ? (
          <div className="mt-3 p-3 bg-purple-950/40 border border-purple-800/60 rounded text-left text-[11px] space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-purple-300 flex items-center gap-1">
                <FileText size={12} /> Recurso #{latestRequest.id}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  latestRequest.status === 'pendente'
                    ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                    : latestRequest.status === 'em_analise'
                    ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                    : latestRequest.status === 'aprovado'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                    : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                }`}
              >
                {latestRequest.status.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-300 text-[10px]">
              Protocolado em: {new Date(latestRequest.requestedAt).toLocaleDateString('pt-BR')}
            </p>
            {latestRequest.resolutionNotes && (
              <div className="mt-1 pt-1 border-t border-purple-800/40 text-[10px] text-purple-200">
                <span className="font-bold">Parecer:</span> {latestRequest.resolutionNotes}
              </div>
            )}
          </div>
        ) : submitSuccess ? (
          <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded text-left text-[11px] text-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span>Sua solicitação de desbloqueio foi protocolada e aguarda avaliação dos moderadores.</span>
          </div>
        ) : null}

        {/* Appeal CTA Button */}
        {!latestRequest && (
          <div className="mt-3">
            <button
              onClick={() => setShowAppealModal(true)}
              className="w-full py-2 px-3 rounded bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm border border-purple-500"
            >
              <Scale size={14} />
              <span>Solicitar Desbloqueio / Recurso de Apelação</span>
            </button>
          </div>
        )}

        <p className="text-[11px] text-slate-400 mt-4 leading-normal">
          Conforme o Marco Civil da Internet (Art. 19/20) e LGPD, você também pode contatar o DPO oficial:
        </p>

        <a
          href="mailto:pedrohenriquecardonaperes@gmail.com"
          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1 underline font-mono"
        >
          <Mail size={12} />
          pedrohenriquecardonaperes@gmail.com
        </a>

        <div className="mt-5">
          <button
            onClick={onLogout}
            className="w-full py-2 px-4 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <LogOut size={14} />
            Desconectar da Conta
          </button>
        </div>
      </div>

      {/* Appeal Form Modal for Suspended Users */}
      {showAppealModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-purple-500 rounded-lg shadow-2xl overflow-hidden text-xs text-slate-100">
            <div className="p-4 bg-purple-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale size={18} />
                <h3 className="font-bold text-sm">Protocolar Pedido de Desbloqueio</h3>
              </div>
              <button
                onClick={() => setShowAppealModal(false)}
                className="text-white/80 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAppeal} className="p-4 space-y-3 max-h-[80vh] overflow-y-auto text-left">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Categoria da Apelação*:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as UnblockCategory)}
                  className="w-full p-2 text-xs rounded border border-slate-700 bg-slate-800 text-slate-200 focus:ring-1 focus:ring-purple-500"
                >
                  <option value="guerra_edicao">Guerra de Edições (3RR / Disputa Editorial)</option>
                  <option value="vandalismo_acidental">Vandalismo Acidental / Edição de Teste</option>
                  <option value="bloqueio_ip_compartilhado">IP Compartilhado / Rede Escolar ou Coletiva</option>
                  <option value="fantoche_falso_positivo">Falso Positivo de Conta Fantoche</option>
                  <option value="revisao_lgpd_marco_civil">Revisão Humana de Filtro (LGPD Art. 20)</option>
                  <option value="comportamento_inadequado">Conduta Inadequada (Pedido de Desculpas)</option>
                  <option value="outro">Outro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Justificativa de Apelação (Por que sua conta deve ser desbloqueada?)*:
                </label>
                <textarea
                  rows={4}
                  required
                  value={appealJustification}
                  onChange={(e) => setAppealJustification(e.target.value)}
                  placeholder="Explique o que aconteceu, por que a suspensão deve ser revista ou as medidas corretivas já adotadas..."
                  className="w-full p-2.5 text-xs rounded border border-slate-700 bg-slate-800 text-slate-200 focus:ring-1 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Compromisso com as Políticas da WikiWorldWeb*:
                </label>
                <textarea
                  rows={2}
                  required
                  value={commitmentToGuidelines}
                  onChange={(e) => setCommitmentToGuidelines(e.target.value)}
                  placeholder="Descreva o que você fará para evitar futuras sanções e garantir conformidade..."
                  className="w-full p-2.5 text-xs rounded border border-slate-700 bg-slate-800 text-slate-200 focus:ring-1 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              <div className="p-2.5 bg-purple-950/40 border border-purple-800/60 rounded text-[11px] text-purple-300 leading-relaxed flex items-start gap-2">
                <HelpCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>
                  O seu pedido será encaminhado imediatamente ao painel de moderação para análise por um administrador.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !appealJustification.trim()}
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
