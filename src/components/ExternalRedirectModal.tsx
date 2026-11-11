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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] border-4 border-[#141414] max-w-lg w-full shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] flex flex-col">
        {/* Header */}
        <div className="bg-[#141414] text-white p-4 flex items-center justify-between border-b-2 border-stone-800">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-editorial text-lg font-bold tracking-tight">
                Aviso de Segurança — Link Externo
              </h3>
              <p className="text-[11px] font-mono text-stone-400">
                Extensão Redirecionador com UID (3.05.3.c)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Cancelar e Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 font-mono text-xs">
          <p className="font-serif text-sm text-stone-800 leading-relaxed">
            Você está prestes a sair do ambiente do portal <strong>WazzimaGiygg</strong> para acessar um endereço web externo.
          </p>

          <div className="space-y-2">
            <span className="font-bold text-stone-700 uppercase text-[10px]">Destino Solicitado:</span>
            <div className="p-3 bg-stone-100 border-2 border-stone-300 text-stone-900 font-mono text-[11px] break-all">
              {targetUrl}
            </div>
          </div>

          {/* Redirector Details */}
          <div className="p-3 bg-amber-50/80 border-2 border-amber-500 shadow-[2px_2px_0px_0px_rgba(217,119,6,1)] space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-700" /> Dispositivo Redirecionador:
              </span>
              <span className={`px-1.5 py-0.5 font-bold text-[9px] uppercase ${
                isRedirectorEnabled ? 'bg-emerald-700 text-white' : 'bg-stone-300 text-stone-700'
              }`}>
                {isRedirectorEnabled ? 'Extensão Ativa' : 'Extensão Desativada'}
              </span>
            </div>

            {isRedirectorEnabled ? (
              <div className="space-y-1 text-stone-700">
                <div>
                  <strong>URL Redirecionadora:</strong>{' '}
                  <code className="text-amber-950 font-bold">{baseUrl}</code>
                </div>
                <div>
                  <strong>UID Ativo em Sessão:</strong>{' '}
                  <code className="text-stone-900 font-bold">{activeUid}</code>
                </div>
                <div className="text-[10px] text-stone-500 pt-1 border-t border-amber-200">
                  Rastreio seguro habilitado conforme parâmetros de governança técnica da extensão.
                </div>
              </div>
            ) : (
              <p className="text-stone-600 text-[10px]">
                O redirecionador foi desativado nas configurações da extensão. O navegador seguirá diretamente para o endereço alvo.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-100 border-t-2 border-[#141414] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold border-2 border-stone-400 cursor-pointer"
          >
            Cancelar e Permanecer
          </button>

          <button
            onClick={handleContinue}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            <span>Prosseguir para Link Externo</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
