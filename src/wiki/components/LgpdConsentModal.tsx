import React, { useState, useMemo } from 'react';
import {
  Shield,
  X,
  Check,
  AlertTriangle,
  Scale,
  Calendar,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  UserCheck,
} from 'lucide-react';
import { StorageService } from '../services/storageService';

interface LgpdConsentModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAccept: (birthdate: string) => void;
  onDecline: () => void;
  isAlreadyAccepted?: boolean;
}

export const LgpdConsentModal: React.FC<LgpdConsentModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  isAlreadyAccepted = false,
}) => {
  const existingAgeInfo = useMemo(() => StorageService.getUserAgeInfo(), [isOpen]);
  const [consentChecked, setConsentChecked] = useState(isAlreadyAccepted);
  const [ageDeclarationChecked, setAgeDeclarationChecked] = useState(isAlreadyAccepted);
  const [birthdate, setBirthdate] = useState(existingAgeInfo.birthdate || '');
  const [isDeclinedView, setIsDeclinedView] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate age based on birthdate - must be defined before any early returns to satisfy React Hook rules
  const calculatedAge = useMemo(() => {
    if (!birthdate) return null;
    return StorageService.calculateAge(birthdate);
  }, [birthdate]);

  // Validation: birthdate must be present and age must be strictly > 14
  const isAgeValid = calculatedAge !== null && calculatedAge > 14;
  const isUnderAge = calculatedAge !== null && calculatedAge <= 14;
  const canAccept = consentChecked && ageDeclarationChecked && isAgeValid;

  if (!isOpen) return null;

  const handleAcceptClick = () => {
    if (!birthdate) {
      setErrorMessage('Por favor, informe sua data de nascimento para verificação obrigatória de idade.');
      return;
    }

    if (!isAgeValid) {
      setErrorMessage(
        `Acesso não permitido: Você informou ${calculatedAge ?? 0} anos. A idade deve ser estritamente maior que 14 anos para acessar a WikiWorldWeb.`
      );
      return;
    }

    if (!consentChecked || !ageDeclarationChecked) {
      setErrorMessage('É obrigatório marcar as declarações de consentimento LGPD e confirmação de idade.');
      return;
    }

    const result = StorageService.saveLgpdTermsAccepted(birthdate);
    if (!result.success) {
      setErrorMessage(result.message || 'Erro ao validar idade.');
      return;
    }

    setErrorMessage(null);
    onAccept(birthdate);
  };

  const handleDeclineClick = () => {
    setIsDeclinedView(true);
    onDecline();
  };

  const handleResetToForm = () => {
    setIsDeclinedView(false);
    setErrorMessage(null);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lgpd-modal-title"
    >
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden my-4 animate-in zoom-in-95 text-xs">
        {/* Header */}
        <div className="bg-[#1e293b] p-3 sm:p-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5 font-mono">
            <div className="p-1.5 bg-blue-600/30 border border-blue-400/40 rounded">
              <Scale size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 id="lgpd-modal-title" className="font-bold text-xs sm:text-sm uppercase tracking-wider">
                Verificação de Idade & Termos LGPD
              </h2>
              <p className="text-[10px] text-slate-400 font-sans">
                Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - Art. 14)
              </p>
            </div>
          </div>
          {isAlreadyAccepted && onClose && (
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded hover:bg-slate-800 transition"
              aria-label="Fechar modal"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        {isDeclinedView ? (
          <div className="p-6 text-center space-y-4 text-slate-700 dark:text-slate-300">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Lock size={28} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                Acesso Restrito ao Conteúdo
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Para navegar, consultar artigos e participar da <strong>WikiWorldWeb</strong>, é obrigatório definir sua data de nascimento comprovando idade <strong>maior que 14 anos</strong> e concordar com as políticas de privacidade da LGPD.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-[11px] text-amber-900 dark:text-amber-300 text-left">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertOctagon size={14} className="text-amber-600 flex-shrink-0" />
                <span>Base Legal de Proteção a Menores (Art. 14 da LGPD):</span>
              </div>
              <p>
                O tratamento de dados pessoais de crianças e adolescentes exige consentimento específico e mecanismos estritos de verificação de faixa etária. O acesso à enciclopédia permanece bloqueado enquanto os requisitos não forem atendidos.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleResetToForm}
                className="px-4 py-2 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition"
              >
                <RotateCcw size={14} />
                Informar Data & Tentar Novamente
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 max-h-[65vh] overflow-y-auto space-y-3.5 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
            {/* Aviso de Idade Obrigatória */}
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-3.5">
              <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                <Shield size={14} className="text-blue-600 dark:text-blue-400" />
                Controle de Faixa Etária e Governança de Dados
              </h3>
              <p className="text-[11px] text-blue-800 dark:text-blue-300">
                A WikiWorldWeb adota padrões rigorosos de conformidade digital. O acesso à plataforma é permitido <strong>exclusivamente para usuários com idade maior que 14 anos</strong>.
              </p>
            </div>

            {/* Error Feedback Message */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-[11px] flex items-start gap-2 animate-shake">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Atenção: </span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Informações de Tratamento */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white font-mono text-[11px] uppercase">
                Dados Coletados & Bases Legais (Art. 7º & Art. 14):
              </h4>
              <ul className="space-y-1 pl-4 list-disc text-slate-600 dark:text-slate-400 text-[11px]">
                <li><strong>Idade e Data de Nascimento:</strong> verificação da faixa etária legal (&gt; 14 anos).</li>
                <li><strong>Identificação e Atribuição:</strong> registro público de autoria e histórico de revisões.</li>
                <li><strong>Direitos do Titular (Art. 18):</strong> portabilidade, retificação e anonimização disponíveis na Central "Meus Dados".</li>
              </ul>
            </div>

            {/* Verificação Rigorosa de Idade */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1.5 font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-blue-600" />
                    Data de Nascimento (Obrigatória - Maior que 14 anos)
                  </span>
                  {calculatedAge !== null && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        isAgeValid
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {calculatedAge} anos
                    </span>
                  )}
                </label>

                <input
                  type="date"
                  value={birthdate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setBirthdate(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  required
                />

                {/* Age Feedback Banner */}
                {isUnderAge && (
                  <div className="mt-2 p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertTriangle size={15} className="flex-shrink-0" />
                    <span>
                      Idade não permitida ({calculatedAge} anos). A WikiWorldWeb exige idade <strong>maior que 14 anos</strong> para ingressar no site.
                    </span>
                  </div>
                )}

                {isAgeValid && (
                  <div className="mt-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="flex-shrink-0" />
                    <span>
                      Idade validada com sucesso ({calculatedAge} anos). Você atende aos critérios de acesso.
                    </span>
                  </div>
                )}

                {!birthdate && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    * Digite ou selecione sua data de nascimento para desbloquear o acesso.
                  </p>
                )}
              </div>

              {/* Term Checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => {
                      setConsentChecked(e.target.checked);
                      setErrorMessage(null);
                    }}
                    className="mt-0.5 rounded text-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    Declaro que li e concordo expressamente com o tratamento dos dados estritamente necessários nos termos da <strong>LGPD (Lei nº 13.709/2018)</strong> e <strong>Marco Civil da Internet</strong>.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ageDeclarationChecked}
                    onChange={(e) => {
                      setAgeDeclarationChecked(e.target.checked);
                      setErrorMessage(null);
                    }}
                    className="mt-0.5 rounded text-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    Confirmo formalmente que possuo <strong>idade superior a 14 anos</strong> e que a data de nascimento informada é verídica.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!isDeclinedView && (
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDeclineClick}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
            >
              Recusar e Sair
            </button>

            <button
              type="button"
              onClick={handleAcceptClick}
              disabled={!canAccept}
              className={`px-4 py-1.5 text-xs font-semibold rounded transition flex items-center gap-1.5 shadow-sm ${
                canAccept
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check size={14} />
              Confirmar Idade & Entrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
