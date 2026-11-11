import React, { useState } from 'react';
import { Heart, ArrowRight, X, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface GoogleReaderRevenueDonationProps {
  className?: string;
  variant?: 'card' | 'inline' | 'banner';
  title?: string;
  description?: string;
}

export const GoogleReaderRevenueDonation: React.FC<GoogleReaderRevenueDonationProps> = ({
  className = '',
  variant = 'card',
  title = 'Apoie com o Google Reader Revenue Manager',
  description = 'Contribua com o desenvolvimento da enciclopédia livre através da infraestrutura oficial de contribuições do Google.',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleOpenCTA = () => {
    setIsRevealed(true);

    // Se o SDK do Subscribe with Google / Reader Revenue Manager já estiver inicializado, tentar disparar o fluxo
    try {
      const swg = (window as unknown as { SWG?: { showContributionPrompt?: () => void; getOffers?: () => void } }).SWG;
      if (swg && typeof swg.showContributionPrompt === 'function') {
        swg.showContributionPrompt();
      }
    } catch {
      // Ignora caso a publicação ainda não esteja configurada no Google Publisher Center
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealed(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {!isRevealed ? (
        /* Estado 1: Botão de Chamada para Ação (CTA) */
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpenCTA}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenCTA();
            }
          }}
          className={`group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 ${
            variant === 'banner'
              ? 'p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-md hover:shadow-lg border border-blue-500/30'
              : 'p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md hover:shadow-xl border border-blue-400/40 hover:-translate-y-0.5'
          }`}
          title="Clique para abrir o botão de doação oficial do Google"
        >
          {/* Efeito de brilho de fundo */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl group-hover:scale-125 transition-transform" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-inner group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 text-rose-300 fill-rose-300" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base tracking-tight leading-tight">
                    {title}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-blue-100 border border-white/20 flex items-center gap-1">
                    <Sparkles size={10} />
                    <span>CTA Doação</span>
                  </span>
                </div>
                <p className="text-xs text-blue-100/90 leading-relaxed max-w-xl">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className="px-3.5 py-2 rounded-lg bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 group-hover:shadow-md">
                <span>Fazer Doação</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Estado 2: Painel Revelado com a tag oficial de doação */
        <div className="relative p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-600 shadow-xl animate-in fade-in zoom-in-95 duration-200 space-y-4">
          {/* Cabeçalho do Painel */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                G
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Google Reader Revenue Manager
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Oficial Google
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Subscribe with Google (SwG) • Doações e Contribuições Seguras
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Fechar painel de doação"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mensagem explicativa */}
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p>
              Clique no botão abaixo para concluir sua contribuição voluntária para a <strong>WikiWorldWeb</strong>. O pagamento é processado diretamente pelo Google com segurança e transparência.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 size={13} />
                Sem taxas abusivas
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <ShieldCheck size={13} />
                Proteção de dados Google
              </span>
            </div>
          </div>

          {/* Área Principal de Renderização da Tag swg-standard-button="contribution" */}
          <div className="pt-2 pb-1 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700/80">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Botão Oficial de Contribuição:
              </span>

              {/* Tag oficial exigida com atributo swg-standard-button="contribution" */}
              <div className="flex items-center gap-2">
                <button
                  {...{ 'swg-standard-button': 'contribution' }}
                  id="swg-contribution-standard-button"
                  type="button"
                  className="swg-standard-button-btn inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] text-white font-medium text-sm shadow-md hover:shadow-lg transition-all cursor-pointer border border-[#174ea6]"
                  title="Contribuir via Google Reader Revenue Manager"
                >
                  <svg className="w-4 h-4 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span>Doar com Google</span>
                </button>

                {/* Tag div complementar de autodescoberta do SwG */}
                <div {...{ 'swg-standard-button': 'contribution' }} className="hidden" />
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-400 font-mono hidden sm:block">
              <span className="block text-slate-500 font-bold uppercase tracking-wider">Atributo Integrado</span>
              <code>swg-standard-button="contribution"</code>
            </div>
          </div>

          {/* Rodapé informativo */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <span>Para fechar a qualquer momento, clique no botão fechar ou recolher.</span>
            <button
              type="button"
              onClick={handleClose}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Recolher CTA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
