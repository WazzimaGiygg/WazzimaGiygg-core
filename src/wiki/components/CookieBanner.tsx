import React, { useState } from 'react';
import { Cookie, ShieldCheck, Check, X, Settings2 } from 'lucide-react';
import { CookieConsent } from '../types';
import { formatExternalUrl } from '../utils/linkUtils';

interface CookieBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSaveCustom: (consent: Omit<CookieConsent, 'timestamp' | 'version'>) => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({
  onAcceptAll,
  onRejectAll,
  onSaveCustom,
}) => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [advertising, setAdvertising] = useState(false);

  const handleSaveCustom = () => {
    onSaveCustom({
      essential: true,
      analytics,
      advertising,
    });
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 pointer-events-none select-none font-sans">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-blue-500/40 rounded shadow-xl p-3.5 sm:p-4 pointer-events-auto backdrop-blur-md animate-in slide-in-from-bottom-5 text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="text-xl">🍪</span>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono uppercase">
                Privacidade e Cookies (LGPD)
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Utilizamos cookies estritamente necessários para autenticação segura e métricas anônimas em conformidade com a{' '}
                <a
                  href={formatExternalUrl("https://wazzimagiygg.com/LGPD")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-semibold underline"
                >
                  Lei Geral de Proteção de Dados (LGPD)
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        {isCustomizing && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-80 cursor-not-allowed">
              <input type="checkbox" checked disabled className="rounded text-blue-600" />
              <div className="text-[11px]">
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  🔒 Essenciais
                </span>
                <span className="text-slate-500 text-[10px]">
                  Autenticação e sessão
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="rounded text-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <div className="text-[11px]">
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  📊 Métricas
                </span>
                <span className="text-slate-500 text-[10px]">
                  Desempenho anônimo
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={advertising}
                onChange={(e) => setAdvertising(e.target.checked)}
                className="rounded text-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <div className="text-[11px]">
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  🎯 Preferências
                </span>
                <span className="text-slate-500 text-[10px]">
                  Modo de leitura customizado
                </span>
              </div>
            </label>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5 pt-1">
          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 border border-slate-200 dark:border-slate-700"
          >
            <Settings2 size={12} />
            {isCustomizing ? 'Ocultar' : 'Personalizar'}
          </button>

          {isCustomizing ? (
            <button
              onClick={handleSaveCustom}
              className="px-3 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition flex items-center gap-1"
            >
              <Check size={12} />
              Salvar Preferências
            </button>
          ) : (
            <>
              <button
                onClick={onRejectAll}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-1"
              >
                <X size={12} />
                Recusar Opcionais
              </button>
              <button
                onClick={onAcceptAll}
                className="px-3 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition flex items-center gap-1"
              >
                <ShieldCheck size={12} />
                Aceitar Todos
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
