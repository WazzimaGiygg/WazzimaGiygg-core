import React, { useState } from 'react';
import { Cookie, ShieldCheck, Check, X, Settings2, Lock } from 'lucide-react';
import { CookieConsent } from '../types';
import { formatExternalUrl } from '../utils/linkUtils';
import { CONSENT_TTL_DAYS } from '../../utils/cookieConsent';

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
  // LGPD / ANPD: Opt-in estrito — categorias não essenciais iniciam DESMARCADAS
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);

  const handleSaveCustom = () => {
    onSaveCustom({
      essential: true,
      functional,
      analytics,
      advertising: thirdParty,
      thirdParty,
      decisionMethod: 'custom',
    });
  };

  return (
    <div
      role="dialog"
      aria-label="Preferências de Cookies e Privacidade (LGPD)"
      className="fixed bottom-0 inset-x-0 z-50 p-3 pointer-events-none select-none font-sans"
    >
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-blue-500/40 rounded shadow-xl p-3.5 sm:p-4 pointer-events-auto backdrop-blur-md animate-in slide-in-from-bottom-5 text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
              <Cookie size={16} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono uppercase">
                Privacidade e Cookies (LGPD / ANPD)
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Utilizamos cookies <strong>estritamente necessários</strong> para autenticação, segurança e registro da sua escolha (Art. 7º, V/IX da LGPD).
                Cookies opcionais de experiência, métricas e recursos de terceiros ficam <strong>desativados por padrão</strong> e só operam com seu consentimento explícito (Art. 7º, I), válido por {CONSENT_TTL_DAYS} dias.{' '}
                <a
                  href={formatExternalUrl("https://wazzimagiygg.com/LGPD")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-semibold underline"
                >
                  Política LGPD
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* Customization Panel (2ª Camada ANPD) */}
        {isCustomizing && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <label className="flex items-start gap-2 p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-85 cursor-not-allowed">
              <input type="checkbox" checked disabled className="mt-0.5 rounded text-blue-600" />
              <div className="text-[11px]">
                <span className="font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                  <Lock size={11} className="text-emerald-600" />
                  Essenciais (Sempre ativo)
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-0.5">
                  Sessão, segurança e prova de consentimento. Base: Art. 7º, V/IX.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2 p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition">
              <input
                type="checkbox"
                checked={functional}
                onChange={(e) => setFunctional(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <div className="text-[11px]">
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  Funcionais e Leitura
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-0.5">
                  Modo de tela e leituras recentes. Base: Consentimento (Art. 7º, I).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2 p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <div className="text-[11px]">
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  Métricas Anonimizadas
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-0.5">
                  Estatísticas agregadas sem perfilamento. Base: Art. 7º, I.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2 p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition">
              <input
                type="checkbox"
                checked={thirdParty}
                onChange={(e) => setThirdParty(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <div className="text-[11px]">
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  Recursos de Terceiros
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-0.5">
                  Incorporações externas opcionais (sem anúncios). Base: Art. 7º, I.
                </span>
              </div>
            </label>
          </div>
        )}

        {/* Buttons — Sem dark patterns (mesmo peso visual entre rejeitar e aceitar) */}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 border border-slate-300 dark:border-slate-600"
          >
            <Settings2 size={12} />
            {isCustomizing ? 'Ocultar Opções' : 'Personalizar'}
          </button>

          <button
            type="button"
            onClick={onRejectAll}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-1 border border-slate-300 dark:border-slate-600"
          >
            <X size={12} />
            Rejeitar Não Essenciais
          </button>

          {isCustomizing ? (
            <button
              type="button"
              onClick={handleSaveCustom}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition flex items-center gap-1 border border-blue-700"
            >
              <Check size={12} />
              Salvar Preferências
            </button>
          ) : (
            <button
              type="button"
              onClick={onAcceptAll}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition flex items-center gap-1 border border-blue-700"
            >
              <ShieldCheck size={12} />
              Aceitar Todos
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

