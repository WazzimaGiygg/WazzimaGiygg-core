import React, { useEffect, useState } from 'react';
import {
  X,
  Tag,
  Server,
  ShieldCheck,
  Database,
  Puzzle,
  Copy,
  Check,
  Download,
  Globe,
  Scale,
  Cpu,
  ExternalLink,
} from 'lucide-react';
import {
  WIKI_SITE_VERSION,
  WIKI_SITE_SERIES,
  WIKI_SITE_REVISION,
  WIKI_SITE_DISPLAY_ID,
  WIKI_SITE_ENGINE,
  WIKI_SITE_CANONICAL_URL,
  WIKI_SITE_LICENSE,
  WIKI_SITE_COMPLIANCE,
  WIKI_SITE_DPO,
  WIKI_SITE_STACK,
  WikiSiteVersionManifest,
  getWikiSiteVersionManifest,
  formatWikiSiteFingerprint,
} from '../config/wikiVersion';
import { safeApiFetch } from '../firebase';

interface WikiSiteVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  articlesCount?: number;
  extensionsCount?: number;
  revisionsCount?: number;
  extensionNames?: string[];
  showToast?: (msg: string, isError?: boolean) => void;
}

export const WikiSiteVersionModal: React.FC<WikiSiteVersionModalProps> = ({
  isOpen,
  onClose,
  articlesCount,
  extensionsCount,
  revisionsCount,
  extensionNames = [],
  showToast,
}) => {
  const [serverManifest, setServerManifest] = useState<Partial<WikiSiteVersionManifest> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      try {
        const res = await safeApiFetch('/api/version');
        if (res && res.ok && active) {
          const data = await res.json();
          setServerManifest(data);
        }
      } catch {
        // Fallback silently to client manifest
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const manifest = getWikiSiteVersionManifest({
    articlesCount: articlesCount ?? serverManifest?.articlesCount,
    extensionsCount: extensionsCount ?? serverManifest?.extensionsCount,
    revisionsCount: revisionsCount ?? serverManifest?.revisionsCount,
    nodeVersion: serverManifest?.nodeVersion,
    uptimeSeconds: serverManifest?.uptimeSeconds,
  });

  const handleCopyFingerprint = async () => {
    const text = formatWikiSiteFingerprint(manifest);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast?.(`Identificação ${WIKI_SITE_DISPLAY_ID} copiada para a área de transferência.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast?.('Não foi possível copiar automaticamente.', true);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wikisite-version-${WIKI_SITE_VERSION}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast?.(`Manifesto ${WIKI_SITE_VERSION} exportado em JSON.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wikisite-version-modal-title"
    >
      <div className="bg-[#FAF9F5] dark:bg-[#181816] text-[#141414] dark:text-[#F5F4F0] border-4 border-[#141414] dark:border-[#3E3D38] shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#141414] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-amber-500 text-[#141414] border border-amber-300 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="wikisite-version-modal-title"
                  className="font-editorial text-lg sm:text-xl font-bold tracking-tight"
                >
                  Identificação de Versão — {WIKI_SITE_DISPLAY_ID}
                </h2>
                <span className="bg-emerald-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase">
                  Special:Version
                </span>
              </div>
              <p className="text-[11px] font-mono text-stone-300 truncate">
                {WIKI_SITE_ENGINE} • {WIKI_SITE_CANONICAL_URL}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 transition-colors cursor-pointer"
            aria-label="Fechar identificação de versão"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 font-mono text-xs">
          {/* Primary Version Badge Box */}
          <div className="bg-white dark:bg-[#201F1C] border-2 border-[#141414] dark:border-[#3E3D38] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 block">
                Identificação Oficial da Plataforma
              </span>
              <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#B91C1C] dark:text-amber-400">
                  {WIKI_SITE_VERSION}
                </span>
                <span className="text-xs font-bold bg-stone-200 dark:bg-stone-800 px-2 py-0.5 border border-stone-400 dark:border-stone-600">
                  Série {WIKI_SITE_SERIES}
                </span>
                <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2 py-0.5 border border-amber-400 dark:border-amber-700">
                  Revisão {WIKI_SITE_REVISION}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyFingerprint}
                className="bg-[#141414] hover:bg-stone-800 text-white px-3 py-2 text-[11px] font-bold uppercase flex items-center gap-1.5 border border-stone-700 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Versão'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="bg-[#EBE8E1] dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-[#141414] dark:text-stone-100 px-3 py-2 text-[11px] font-bold uppercase flex items-center gap-1.5 border-2 border-[#141414] dark:border-stone-600 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Software & Runtime Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#201F1C] border-2 border-[#141414] dark:border-[#3E3D38] p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-bold uppercase text-[11px] text-stone-900 dark:text-amber-300 border-b border-stone-200 dark:border-stone-700 pb-2">
                <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Software Instalado & Stack</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-1">
                  <span className="text-stone-500 dark:text-stone-400">Wiki-Site Build:</span>
                  <span className="font-bold text-right">{WIKI_SITE_VERSION}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-1">
                  <span className="text-stone-500 dark:text-stone-400">Frontend:</span>
                  <span className="font-semibold text-right">{WIKI_SITE_STACK.frontend}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-1">
                  <span className="text-stone-500 dark:text-stone-400">Backend:</span>
                  <span className="font-semibold text-right">{WIKI_SITE_STACK.backend}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-1">
                  <span className="text-stone-500 dark:text-stone-400">Parser:</span>
                  <span className="font-semibold text-right">{WIKI_SITE_STACK.parser}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-stone-500 dark:text-stone-400">Banco de Dados:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-right">
                    {WIKI_SITE_STACK.database}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#201F1C] border-2 border-[#141414] dark:border-[#3E3D38] p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-bold uppercase text-[11px] text-stone-900 dark:text-amber-300 border-b border-stone-200 dark:border-stone-700 pb-2">
                <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Telemetria da Instância</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-1">
                  <span className="text-stone-500 dark:text-stone-400">Host Canônico:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> core.wazzimagiygg.com
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-1">
                  <span className="text-stone-500 dark:text-stone-400">Documentos no Acervo:</span>
                  <span className="font-bold">{manifest.articlesCount ?? '—'}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-1">
                  <span className="text-stone-500 dark:text-stone-400">Extensões Ativas:</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">
                    {manifest.extensionsCount ?? extensionNames.length} módulos
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-1">
                  <span className="text-stone-500 dark:text-stone-400">Runtime Servidor:</span>
                  <span className="font-semibold">
                    {manifest.nodeVersion ? `Node ${manifest.nodeVersion}` : 'Express TS (Ativo)'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-stone-500 dark:text-stone-400">Licenciamento:</span>
                  <span className="font-semibold">{WIKI_SITE_LICENSE}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Extensions Preview */}
          {extensionNames.length > 0 && (
            <div className="bg-white dark:bg-[#201F1C] border-2 border-[#141414] dark:border-[#3E3D38] p-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2 mb-3">
                <div className="flex items-center gap-2 font-bold uppercase text-[11px] text-stone-900 dark:text-amber-300">
                  <Puzzle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Extensões & Módulos Registrados ({extensionNames.length})</span>
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">Wiki-Site {WIKI_SITE_VERSION}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {extensionNames.map((extName) => (
                  <span
                    key={extName}
                    className="px-2 py-0.5 text-[10px] bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-semibold"
                  >
                    {extName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Legal & Compliance Strip */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-700/60 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold uppercase text-[11px] text-emerald-900 dark:text-emerald-300">
              <Scale className="w-4 h-4" />
              <span>Conformidade Legal, Privacidade & Encarregado (DPO)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {WIKI_SITE_COMPLIANCE.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 bg-white dark:bg-[#141414] border border-emerald-600/50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300"
                >
                  <ShieldCheck className="w-3 h-3" />
                  {item}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-emerald-950 dark:text-emerald-200 pt-1">
              DPO: <strong>{WIKI_SITE_DPO.name}</strong> ({WIKI_SITE_DPO.email}) • Suporte &amp; Remoção de Dados:{' '}
              <a
                href={WIKI_SITE_DPO.supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold inline-flex items-center gap-0.5 hover:text-emerald-700 dark:hover:text-white"
              >
                {WIKI_SITE_DPO.supportUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#EBE8E1] dark:bg-[#141414] px-5 py-3 border-t-2 border-[#141414] dark:border-[#3E3D38] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-stone-700 dark:text-stone-400">
            <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Endpoint JSON oficial: <code className="font-bold">/api/version</code></span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#141414] dark:bg-stone-200 text-white dark:text-stone-950 px-4 py-1.5 font-bold uppercase cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default WikiSiteVersionModal;
