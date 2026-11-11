import React, { useState } from 'react';
import { 
  Monitor, 
  Download, 
  Package, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  HardDrive, 
  Zap, 
  Copy, 
  Check, 
  Terminal,
  Layers,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { downloadChromeWebStorePackage } from '../utils/chromeExtensionGenerator';
import { AppTheme } from '../types';

interface ChromeAppToolProps {
  theme?: AppTheme;
}

export const ChromeAppTool: React.FC<ChromeAppToolProps> = () => {
  const { 
    isInstallable, 
    isInstalled, 
    isDesktop, 
    isChrome, 
    isWindows, 
    isMac, 
    isLinux, 
    isChromeOS, 
    install 
  } = usePWAInstall();

  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const osName = isWindows ? 'Windows' : isMac ? 'macOS' : isLinux ? 'Linux' : isChromeOS ? 'ChromeOS' : 'Computador';

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      await downloadChromeWebStorePackage();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4500);
    } catch (err) {
      console.error('Falha ao gerar pacote para Chrome Web Store:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2500);
    }
  };

  return (
    <div id="chrome-app-tool" className="space-y-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-blue-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Google Chrome & Desktop
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Manifest V3
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading tracking-tight text-white">
              Aplicativo WikiWorldWeb para Computador
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Transforme a WikiWorldWeb em um aplicativo nativo para Google Chrome, Windows, macOS, Linux ou Chromebook. Com suporte a janela autônoma, atalhos de busca rápida na barra de endereços (Omnibox) e modo offline ultra veloz.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            {isInstallable && (
              <button
                onClick={() => install()}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Monitor className="w-4 h-4" />
                <span>Instalar 1-Clique no Chrome</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Package className="w-4 h-4 text-blue-400" />
              <span>
                {isGenerating 
                  ? 'Compilando Pacote...' 
                  : downloadSuccess 
                  ? '✓ Pacote .zip Baixado!' 
                  : 'Baixar Pacote Chrome (.zip)'}
              </span>
            </button>
          </div>
        </div>

        {/* System Diagnostics Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Sistema Detectado</span>
            <span className="font-semibold text-white mt-0.5 block">{osName}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Navegador</span>
            <span className="font-semibold text-white mt-0.5 block">{isChrome ? 'Google Chrome' : 'Navegador Web'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">PWA Standalone</span>
            <span className="font-semibold text-emerald-400 mt-0.5 block">
              {isInstalled ? 'Ativo (Janela Nativa)' : 'Pronto para Instalar'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Extensão Web Store</span>
            <span className="font-semibold text-blue-300 mt-0.5 block">Manifest V3 Homologado</span>
          </div>
        </div>
      </div>

      {/* 2 Formas de Usar no Computador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opção A: Aplicativo Nativo PWA no Google Chrome */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Método 1: Aplicativo Nativo no Chrome
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ideal para uso diário como janela autônoma no {osName}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              O Google Chrome permite instalar o WikiWorldWeb diretamente na sua Área de Trabalho, Menu Iniciar ou Dock sem precisar de download de instaladores pesados:
            </p>

            <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="font-bold text-blue-600 shrink-0">1.</span>
                <span>Na barra de endereços do Chrome, clique no ícone de <strong>monitor com seta para baixo</strong> ou <strong>"Instalar WikiWorldWeb"</strong>.</span>
              </li>
              <li className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="font-bold text-blue-600 shrink-0">2.</span>
                <span>Ou clique no menu de 3 pontinhos (⋮) do Chrome &gt; <strong>Salvar e Compartilhar</strong> &gt; <strong>Instalar aplicativo</strong>.</span>
              </li>
              <li className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="font-bold text-blue-600 shrink-0">3.</span>
                <span>Confirme em <strong>"Instalar"</strong>. Um atalho dedicado será criado e o app abrirá em janela exclusiva!</span>
              </li>
            </ol>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Sem anúncios • Menos de 3MB</span>
            <button
              onClick={() => install()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Iniciar Instalação
            </button>
          </div>
        </div>

        {/* Opção B: Pacote Extensão / Chrome Web Store */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Método 2: Extensão & Chrome Web Store
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pacote Manifest V3 pronto para o Chrome ou Web Store
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Baixe o código-fonte da extensão empacotada com manifest oficial, ícones vetoriais em 16px, 48px e 128px, omnibox e popup de pesquisa:
            </p>

            <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="font-bold text-indigo-600 shrink-0">1.</span>
                <span>Clique no botão abaixo para baixar o pacote <strong>wikiworldweb-chrome-app-extension.zip</strong>.</span>
              </li>
              <li className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="font-bold text-indigo-600 shrink-0">2.</span>
                <span>Abra o Google Chrome e digite <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">chrome://extensions</code> na barra.</span>
              </li>
              <li className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="font-bold text-indigo-600 shrink-0">3.</span>
                <span>Ative o <strong>Modo do desenvolvedor</strong> no topo e clique em <strong>Carregar sem compactação</strong>.</span>
              </li>
            </ol>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Formato .ZIP padrão Chrome</span>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Gerando...' : 'Baixar Pacote .ZIP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Atalhos do Teclado e Omnibox do Chrome */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Recursos Rápidos da Extensão no Google Chrome
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🔍 Busca Direta por Omnibox</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Digite <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold text-blue-600">wiki</kbd> e pressione <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Espaço</kbd> na barra de endereços do Chrome para pesquisar instantaneamente qualquer verbete!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>⚡ Atalho de Teclado Global</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Pressione <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">Ctrl + Shift + W</kbd> (ou <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">Cmd + Shift + W</kbd> no Mac) em qualquer aba para abrir a janela rápida da WikiWorldWeb.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🛒 Google Chrome Web Store</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              O arquivo <code>manifest.json</code> e os ícones gerados estão 100% em conformidade com as diretrizes do Google Chrome Web Store Developer Console para submissão oficial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
