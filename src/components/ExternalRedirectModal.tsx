import React from 'react';
import {
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  X,
  Lock,
  Globe,
  Info
} from 'lucide-react';

interface ExternalRedirectModalProps {
  isOpen: boolean;
  targetUrl: string;
  redirectorConfig?: {
    enabled?: boolean;
    redirectBaseUrl?: string;
    appendUid?: boolean;
    showNoticeModal?: boolean;
    whitelistDomains?: string[];
  };
  activeUid?: string;
  onClose: () => void;
  onProceed: (finalUrl: string) => void;
}

export default function ExternalRedirectModal({
  isOpen,
  targetUrl,
  redirectorConfig,
  activeUid = 'usr_pedro_cardona_official',
  onClose,
  onProceed
}: ExternalRedirectModalProps) {
  if (!isOpen || !targetUrl) return null;

  const isRedirectorEnabled = redirectorConfig?.enabled ?? true;
  const baseUrl = redirectorConfig?.redirectBaseUrl || 'https://wazzimagiygg.com/rv/?uid=';
  const appendUid = redirectorConfig?.appendUid ?? true;

  // Build the effective outbound URL
  let computedOutboundUrl = targetUrl;
  if (isRedirectorEnabled) {
    if (appendUid) {
      computedOutboundUrl = `${baseUrl}${encodeURIComponent(activeUid)}&dest=${encodeURIComponent(targetUrl)}`;
    } else {
      computedOutboundUrl = `${baseUrl}&dest=${encodeURIComponent(targetUrl)}`;
    }
  }

  const handleContinue = () => {
    onProceed(computedOutboundUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-editorial text-base font-bold text-stone-900">
                Aviso — Link Externo
              </h3>
              <p className="text-[11px] font-mono text-stone-500">
                Extensão Redirecionador com UID (3.05.3.c)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            title="Cancelar e Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 font-mono text-xs">
          <p className="font-serif text-sm text-stone-700 leading-relaxed">
            Você está prestes a sair do portal <strong>WazzimaGiygg</strong> para acessar um endereço web externo.
          </p>

          <div className="space-y-1.5">
            <span className="font-medium text-stone-500 uppercase text-[10px]">Destino Solicitado:</span>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-800 font-mono text-[11px] break-all">
              {targetUrl}
            </div>
          </div>

          {/* Redirector Details */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-medium text-stone-700 uppercase flex items-center gap-1.5 text-[10px]">
                <Globe className="w-3.5 h-3.5 text-stone-500" /> Dispositivo Redirecionador:
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                isRedirectorEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-500'
              }`}>
                {isRedirectorEnabled ? 'Extensão Ativa' : 'Desativada'}
              </span>
            </div>

            {isRedirectorEnabled ? (
              <div className="space-y-1 text-stone-600">
                <div>
                  <span className="text-stone-500">URL Redirecionadora:</span>{' '}
                  <code className="text-stone-900 font-semibold">{baseUrl}</code>
                </div>
                <div>
                  <span className="text-stone-500">UID Ativo:</span>{' '}
                  <code className="text-stone-900 font-semibold">{activeUid}</code>
                </div>
              </div>
            ) : (
              <p className="text-stone-500 text-[10px]">
                O redirecionador está desativado nas configurações. O navegador seguirá diretamente para o endereço alvo.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-50/70 border-t border-stone-100 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-end gap-2.5 font-mono text-xs">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-200/60 font-medium cursor-pointer transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleContinue}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <span>Prosseguir</span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
