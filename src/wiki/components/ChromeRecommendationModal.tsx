import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Zap,
  Keyboard,
  Download,
  X,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { StorageService } from '../services/storageService';

interface ChromeRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChromeAppGuide?: () => void;
}

export const ChromeRecommendationModal: React.FC<ChromeRecommendationModalProps> = ({
  isOpen,
  onClose,
  onOpenChromeAppGuide,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [browserInfo, setBrowserInfo] = useState<{
    name: string;
    isPureChrome: boolean;
    isChromium: boolean;
  }>({
    name: 'Navegador Web',
    isPureChrome: false,
    isChromium: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.navigator) return;
    const ua = (window.navigator.userAgent || '').toLowerCase();
    const isOpera = /opr\/|opera\//.test(ua);
    const isEdge = /edg\//.test(ua);
    const isSamsung = /samsungbrowser/.test(ua);
    const isBrave = !!(navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function';
    const isPureChrome = (/chrome|crios/.test(ua) && !isEdge && !isOpera && !isSamsung && !isBrave);
    const isChromium = /chrome|crios|edg\/|opr\//.test(ua);
    const isFirefox = /firefox|fxios/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|android/.test(ua);

    let name = 'Navegador Web';
    if (isPureChrome) name = 'Google Chrome';
    else if (isEdge) name = 'Microsoft Edge';
    else if (isFirefox) name = 'Mozilla Firefox';
    else if (isSafari) name = 'Apple Safari';
    else if (isOpera) name = 'Opera';
    else if (isSamsung) name = 'Samsung Internet';
    else if (isBrave) name = 'Brave';

    setBrowserInfo({
      name,
      isPureChrome,
      isChromium,
    });
  }, []);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      StorageService.setChromeRecommendationNoticed();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chrome-modal-title"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Banner with Chrome Accent */}
        <div className="relative bg-gradient-to-r from-blue-600 via-emerald-600 to-amber-500 p-0.5">
          <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {/* Chrome Logo Vector */}
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-xs border border-slate-200 dark:border-slate-700 p-1">
                <svg viewBox="0 0 100 100" className="w-8 h-8" aria-hidden="true">
                  <circle cx="50" cy="50" r="46" fill="#EA4335" />
                  <path
                    d="M50 4 A46 46 0 0 1 89.8 27 L50 50 Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M89.8 27 A46 46 0 0 1 50 96 L50 50 Z"
                    fill="#34A853"
                  />
                  <path
                    d="M50 96 A46 46 0 0 1 10.2 27 L50 50 Z"
                    fill="#FBBC05"
                  />
                  <circle cx="50" cy="50" r="22" fill="#FFFFFF" />
                  <circle cx="50" cy="50" r="18" fill="#4285F4" />
                </svg>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
                  <Sparkles size={11} />
                  Recomendação de Navegador
                </span>
                <h2
                  id="chrome-modal-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
                >
                  A WikiWorldWeb dá preferência ao Google Chrome
                </h2>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Fechar recomendação"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          {/* Main Statement with direct download link */}
          <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg text-slate-800 dark:text-blue-200 space-y-2.5">
            <p className="leading-relaxed">
              Para garantir a melhor velocidade, compatibilidade de ferramentas e estabilidade de edição, a{' '}
              <span className="font-semibold text-slate-900 dark:text-white">WikiWorldWeb dá preferência e recomenda o uso do</span>{' '}
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline inline-flex items-center gap-0.5"
                title="Acessar página de download do Google Chrome"
              >
                Google Chrome
                <ExternalLink size={12} className="inline ml-0.5" />
              </a>{' '}
              ao navegar e colaborar na nossa enciclopédia livre.
            </p>

            <div className="pt-0.5 flex flex-wrap items-center gap-2">
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                id="btn-chrome-recommendation-download-page"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs transition hover:shadow cursor-pointer"
                title="Ir para a página oficial de download do Google Chrome"
              >
                <Download size={13} />
                <span>Página de Download do Google Chrome</span>
                <ExternalLink size={12} className="opacity-80" />
              </a>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                (Gratuito para PC, Mac, Linux, Android e iOS)
              </span>
            </div>
          </div>

          {/* Current Browser Detection Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Layers size={16} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Navegador detectado no momento:</div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  {browserInfo.name}
                  {browserInfo.isPureChrome ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 size={11} />
                      Navegador Recomendado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Outro Navegador
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!browserInfo.isPureChrome && (
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
              >
                <span>Baixar Chrome</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* Why Chrome benefits list */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Por que recomendamos o Google Chrome?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">
                  <Zap size={14} className="text-amber-500 flex-shrink-0" />
                  <span>Velocidade e V8</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  Carregamento ultrarrápido de artigos longos, tabelas, fórmulas matemáticas e renderização instantânea do wikitexto.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">
                  <Keyboard size={14} className="text-blue-500 flex-shrink-0" />
                  <span>Atalhos de Edição</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  Total compatibilidade com atalhos de teclado (Ctrl+S para salvar, Ctrl+H para localizar/substituir e histórico de edições).
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">
                  <Download size={14} className="text-emerald-500 flex-shrink-0" />
                  <span>App e Instalação PWA</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  Instale a Wiki no Chrome como aplicativo independente para computador ou celular, com atalho direto e sem barras.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">
                  <Sparkles size={14} className="text-purple-500 flex-shrink-0" />
                  <span>Gemini e Recursos Web</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  Suporte nativo a Web Workers, sincronização em tempo real e integração otimizada com o assistente Gemini.
                </p>
              </div>
            </div>
          </div>

          {/* Quick installation tip for Chrome users */}
          {browserInfo.isPureChrome && onOpenChromeAppGuide && (
            <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg flex items-center justify-between gap-2 text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 text-[11px]">
                💡 Dica: Você pode instalar o WikiWorldWeb como aplicativo pelo menu do Chrome (⋮) ou barra de endereços!
              </span>
              <button
                type="button"
                onClick={() => {
                  handleDismiss();
                  onOpenChromeAppGuide();
                }}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-0.5 flex-shrink-0 cursor-pointer"
              >
                <span>Ver como</span>
                <ArrowRight size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Não exibir esta recomendação novamente</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!browserInfo.isPureChrome && (
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-2xs"
              >
                <ExternalLink size={13} />
                <span>Obter Chrome</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Entendido, Continuar no Wiki</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
