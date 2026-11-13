import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import {
  BrowserCompatibilityReport,
  evaluateBrowserCompatibility,
  hasForcedBrowserEntry,
  setForcedBrowserEntry,
} from '../utils/browserCompatibility';

interface BrowserCompatibilityGateProps {
  children: React.ReactNode;
}

const RECOMMENDED_BROWSERS = [
  { name: 'Google Chrome', minVersion: 'v90+', url: 'https://www.google.com/chrome/' },
  { name: 'Mozilla Firefox', minVersion: 'v90+', url: 'https://www.mozilla.org/firefox/' },
  { name: 'Microsoft Edge', minVersion: 'v90+', url: 'https://www.microsoft.com/edge' },
  { name: 'Safari', minVersion: 'v14+', url: 'https://www.apple.com/safari/' },
];

export default function BrowserCompatibilityGate({ children }: BrowserCompatibilityGateProps) {
  const [forcedEntry, setForcedEntry] = useState<boolean>(() => hasForcedBrowserEntry());
  const [report, setReport] = useState<BrowserCompatibilityReport>(() => evaluateBrowserCompatibility());
  const [rememberChoice, setRememberChoice] = useState<boolean>(true);
  const [rechecking, setRechecking] = useState<boolean>(false);

  if (forcedEntry || report.isCompatible) {
    return <>{children}</>;
  }

  const handleForceEntry = () => {
    setForcedBrowserEntry(rememberChoice);
    setForcedEntry(true);
  };

  const handleRecheck = () => {
    setRechecking(true);
    const updated = evaluateBrowserCompatibility();
    setReport(updated);
    window.setTimeout(() => setRechecking(false), 180);
  };

  const failedCriticalCount = report.checks.filter((c) => !c.passed && c.severity === 'critical').length;
  const failedWarningCount = report.checks.filter((c) => !c.passed && c.severity === 'warning').length;

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1C1917] font-sans flex flex-col">
      {/* Editorial Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-8">
          <span className="font-editorial text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0">
            WazzimaGiygg
          </span>
          <span className="text-xs text-stone-500 hidden sm:inline truncate">
            Verificação de Compatibilidade do Wiki-site
          </span>
        </div>
      </header>

      {/* Main Editorial Notice */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 sm:py-14">
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-10 space-y-8">
          {/* Headline & Status Intro */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Navegador incompatível detectado</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-stone-900 leading-tight text-balance">
              Este navegador pode não ser compatível com o Wiki-site
            </h1>

            <p className="text-base text-stone-700 leading-relaxed max-w-prose">
              O portal WazzimaGiygg e o acervo NotMediaWiki dependem de recursos modernos de navegador para exibir artigos, ferramentas editoriais, exportação em PDF e sincronização segura de conta. Identificamos limitações no ambiente atual que podem impedir o funcionamento correto da plataforma.
            </p>
          </div>

          {/* Primary Action & False-Positive Override */}
          <section
            aria-label="Opções de acesso"
            className="border-y border-stone-200 py-6 space-y-5"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                <ShieldAlert className="w-4 h-4 text-stone-700 shrink-0" aria-hidden="true" />
                <span>Acredita que isso seja um falso positivo?</span>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed max-w-prose">
                Extensões de privacidade, bloqueadores de script, navegadores personalizados ou User-Agents modificados podem acionar este aviso mesmo em navegadores compatíveis. Você pode forçar a entrada normalmente e testar o site.
              </p>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-stone-700 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={rememberChoice}
                onChange={(e) => setRememberChoice(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
              />
              <span>Lembrar minha escolha e não exibir este aviso novamente neste navegador</span>
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleForceEntry}
                className="min-h-[44px] px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white text-sm font-medium rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 cursor-pointer"
              >
                <span>Forçar entrada no site</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleRecheck}
                className="min-h-[44px] px-5 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 text-sm font-medium rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 shrink-0 ${rechecking ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Verificar novamente</span>
              </button>
            </div>
          </section>

          {/* Detected Browser & Capability Audit */}
          <section aria-label="Diagnóstico técnico do navegador" className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-editorial text-xl font-bold text-stone-900">
                Diagnóstico técnico do navegador
              </h2>
              <div className="text-xs text-stone-500 font-mono tabular-nums">
                <span>{report.browserName}</span>
                <span aria-hidden="true"> · </span>
                <span>Versão {report.browserVersion}</span>
                <span aria-hidden="true"> · </span>
                <span>
                  {failedCriticalCount} falha(s) crítica(s), {failedWarningCount} aviso(s)
                </span>
              </div>
            </div>

            <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg">
              {report.checks.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-stone-900">{item.label}</div>
                    <div className="text-xs text-stone-600">{item.detail}</div>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                      item.passed
                        ? 'text-emerald-800'
                        : item.severity === 'critical'
                          ? 'text-red-800'
                          : 'text-amber-800'
                    }`}
                  >
                    {item.passed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Compatível</span>
                      </>
                    ) : item.severity === 'critical' ? (
                      <>
                        <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Incompatível</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Limitado</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {report.userAgent && (
              <p className="text-xs font-mono text-stone-500 break-all">
                User-Agent identificado: {report.userAgent}
              </p>
            )}
          </section>

          {/* Recommended Browsers */}
          <section aria-label="Navegadores recomendados" className="space-y-3 pt-2">
            <h2 className="font-editorial text-lg font-bold text-stone-900">
              Navegadores recomendados para melhor experiência
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {RECOMMENDED_BROWSERS.map((browser) => (
                <a
                  key={browser.name}
                  href={browser.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-stone-200 hover:border-stone-400 rounded-lg flex items-center justify-between gap-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
                >
                  <div>
                    <div className="font-medium text-stone-900">{browser.name}</div>
                    <div className="text-xs text-stone-500 font-mono tabular-nums">
                      Versão mínima {browser.minVersion}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-500 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <span>WazzimaGiygg · Base de Conhecimento & Portal Editorial</span>
          <span>Verificação automática de compatibilidade de navegador</span>
        </div>
      </footer>
    </div>
  );
}
