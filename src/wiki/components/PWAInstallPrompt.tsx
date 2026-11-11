import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { downloadChromeWebStorePackage } from '../utils/chromeExtensionGenerator';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Share2, 
  CheckCircle2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  HardDrive, 
  Zap, 
  ExternalLink,
  ChevronRight,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';

interface PWAInstallPromptProps {
  buttonStyle?: 'compact' | 'full' | 'header' | 'chrome-only';
  customLabel?: string;
  initialTab?: 'chrome' | 'webstore' | 'mobile' | 'qr' | 'features';
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  buttonStyle = 'header', 
  customLabel,
  initialTab
}) => {
  const { 
    isInstallable, 
    isInstalled, 
    isAndroid, 
    isIOS, 
    isDesktop, 
    isChrome, 
    isWindows, 
    isMac, 
    isLinux, 
    install 
  } = usePWAInstall();

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'chrome' | 'webstore' | 'mobile' | 'qr' | 'features'>(
    initialTab || (isDesktop ? 'chrome' : 'mobile')
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);
  const [packageDownloaded, setPackageDownloaded] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-ul5azgclkwy3zltg3iyxlw-842441289091.us-east1.run.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(currentUrl)}`;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setShowModal(false);
        return;
      }
    }
    // If not directly triggerable via beforeinstallprompt (e.g. inside iframe or already prompted), show the comprehensive guide modal
    setShowModal(true);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadChromePackage = async () => {
    try {
      setIsGeneratingPackage(true);
      await downloadChromeWebStorePackage();
      setPackageDownloaded(true);
      setTimeout(() => setPackageDownloaded(false), 4000);
    } catch (err) {
      console.error('Erro ao gerar pacote para Google Chrome:', err);
    } finally {
      setIsGeneratingPackage(false);
    }
  };

  const osLabel = isWindows ? 'Windows' : isMac ? 'macOS' : isLinux ? 'Linux' : isAndroid ? 'Android' : isIOS ? 'iOS' : 'Computador';

  return (
    <>
      {/* Install Button Trigger */}
      {!isInstalled ? (
        buttonStyle === 'header' ? (
          <button
            id="pwa-header-install-btn"
            onClick={handleInstallClick}
            aria-label="Instalar aplicativo WikiWorldWeb no Google Chrome e computador"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Instalar WikiWorldWeb como aplicativo no Google Chrome ou Celular"
          >
            {isDesktop ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {customLabel || (isDesktop ? 'Instalar no Chrome' : 'Baixar App')}
            </span>
            <span className="sm:hidden">App</span>
          </button>
        ) : buttonStyle === 'chrome-only' ? (
          <button
            id="pwa-chrome-btn"
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs transition"
          >
            <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Google Chrome Web Store / App</span>
          </button>
        ) : buttonStyle === 'compact' ? (
          <button
            id="pwa-compact-install-btn"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md border border-blue-200 dark:border-blue-800/60 transition"
          >
            {isDesktop ? <Monitor className="w-3.5 h-3.5 text-blue-600" /> : <Smartphone className="w-3.5 h-3.5 text-blue-600" />}
            <span>{customLabel || (isDesktop ? 'Instalar no Computador' : 'Instalar no Celular')}</span>
          </button>
        ) : (
          <button
            id="pwa-full-install-btn"
            onClick={handleInstallClick}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-lg shrink-0">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-sm font-semibold truncate">App Chrome & Computador</div>
                <div className="text-xs text-blue-100 truncate">PC, Mac, Linux, Web Store e Celular</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-200 shrink-0" />
          </button>
        )
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline">App Instalado</span>
        </span>
      )}

      {/* Guide & Installation Modal */}
      {showModal && (
        <div 
          id="pwa-install-modal" 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with App Branding */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white relative">
              <button
                id="close-pwa-modal-btn"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center shrink-0">
                  <img 
                    src="/pwa-192x192.png" 
                    alt="WikiWorldWeb Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <Monitor className="w-8 h-8 text-blue-600 hidden [only-child]:block" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold tracking-tight">WikiWorldWeb no Computador</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/40 text-blue-100 border border-blue-400/30">
                      Chrome & Web Store
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100 mt-1">
                    Instale como aplicativo nativo no Google Chrome ({osLabel}) com janela dedicada, inicialização rápida e sem anúncios.
                  </p>
                </div>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="flex gap-1.5 mt-5 border-t border-white/15 pt-3 text-xs font-medium overflow-x-auto pb-0.5 no-scrollbar">
                <button
                  onClick={() => setActiveTab('chrome')}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'chrome' 
                      ? 'bg-white text-blue-900 font-semibold shadow-sm' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Computador / Chrome</span>
                </button>
                <button
                  onClick={() => setActiveTab('webstore')}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'webstore' 
                      ? 'bg-white text-blue-900 font-semibold shadow-sm' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Web Store & Pacote</span>
                </button>
                <button
                  onClick={() => setActiveTab('mobile')}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'mobile' 
                      ? 'bg-white text-blue-900 font-semibold shadow-sm' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Celular</span>
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'qr' 
                      ? 'bg-white text-blue-900 font-semibold shadow-sm' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span>QR Code</span>
                </button>
                <button
                  onClick={() => setActiveTab('features')}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'features' 
                      ? 'bg-white text-blue-900 font-semibold shadow-sm' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recursos</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-300">
              {/* TAB 1: Chrome Desktop App */}
              {activeTab === 'chrome' && (
                <div className="space-y-4">
                  {/* Direct 1-Click Install banner if supported by browser */}
                  {isInstallable ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                          Instalação Direta Disponível!
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          Seu Google Chrome suporta a instalação imediata em um clique.
                        </div>
                      </div>
                      <button
                        onClick={handleInstallClick}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Instalar no Chrome
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Aplicativo pronto para Google Chrome no <strong>{osLabel}</strong></span>
                      </div>
                      <button
                        onClick={handleInstallClick}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs transition"
                      >
                        Tentar 1-Clique
                      </button>
                    </div>
                  )}

                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Como instalar no Google Chrome do Computador (Windows / Mac / Linux):
                  </div>

                  {/* Step 1: Address Bar Omnibox */}
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                      1
                    </span>
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        Ícone de Instalar na Barra de Endereço (Omnibox)
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Olhe para o lado direito da barra de endereços do Google Chrome (onde fica a estrela de favoritos). Um ícone de <strong>monitor com seta para baixo</strong> ou <strong>"Instalar WikiWorldWeb"</strong> estará visível. Clique nele e confirme a instalação.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Chrome Menu */}
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                      2
                    </span>
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        Pelo menu de opções do Google Chrome (⋮)
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        No canto superior direito do Chrome, clique no botão de <strong>três pontinhos (⋮)</strong>, selecione <strong>"Salvar e compartilhar"</strong> e clique em <strong>"Instalar WikiWorldWeb como aplicativo..."</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Standalone Windows & Shortcuts */}
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                      3
                    </span>
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        Acesso Rápido na Área de Trabalho e Barra de Tarefas
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        O aplicativo abrirá em uma janela nativa dedicada, sem barras de ferramentas do navegador. Você poderá fixá-lo na barra de tarefas do Windows, no Dock do Mac ou acessá-lo por <code>chrome://apps</code>.
                      </p>
                    </div>
                  </div>

                  {/* Chrome Extension CTA */}
                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-indigo-900 dark:text-indigo-200 text-xs">
                        Prefere como Extensão da Chrome Web Store?
                      </div>
                      <div className="text-[11px] text-indigo-700 dark:text-indigo-300 truncate">
                        Gere e baixe o pacote homologado Manifest V3 para o Chrome.
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('webstore')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shrink-0 flex items-center gap-1 transition"
                    >
                      <span>Ver Pacote</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Chrome Web Store & Package */}
              {activeTab === 'webstore' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-xl border border-blue-200 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          Pacote para Google Chrome Web Store (.zip)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold">
                        Manifest V3
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      Criamos um gerador que compila todo o código-fonte da extensão/aplicativo Chrome com <code>manifest.json</code> oficial, ícones vetoriais em alta resolução (16px, 48px, 128px), popup de busca rápida, pesquisa por Omnibox (digitando <code>wiki</code> no Chrome) e service worker.
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={handleDownloadChromePackage}
                        disabled={isGeneratingPackage}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>
                          {isGeneratingPackage 
                            ? 'Gerando Pacote .zip...' 
                            : packageDownloaded 
                            ? '✓ Pacote Baixado!' 
                            : 'Baixar Pacote do Chrome (.zip)'}
                        </span>
                      </button>
                      <span className="text-[11px] text-slate-500">
                        {packageDownloaded ? 'Verifique a pasta Downloads' : 'Tamanho: ~25 KB'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Como carregar a extensão no Google Chrome (Computador):
                  </div>

                  <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-blue-600">1.</span>
                      <div>
                        Baixe o arquivo <strong>wikiworldweb-chrome-app-extension.zip</strong> acima e extraia-o em uma pasta no seu computador.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-blue-600">2.</span>
                      <div>
                        Abra o Google Chrome e acesse: <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">chrome://extensions</code>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-blue-600">3.</span>
                      <div>
                        No canto superior direito, ative a opção <strong>"Modo do desenvolvedor"</strong>. Em seguida, clique em <strong>"Carregar sem compactação"</strong> e selecione a pasta extraída.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-blue-600">4.</span>
                      <div>
                        Para publicar oficialmente para o mundo na <strong>Google Chrome Web Store</strong>, envie este mesmo <code>.zip</code> no <a href="https://chrome.google.com/webstore/devconsole" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1">Chrome Developer Dashboard <ExternalLink className="w-3 h-3" /></a>.
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* TAB 3: Mobile (Android & iOS) */}
              {activeTab === 'mobile' && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Instalação em Celulares e Tablets:
                  </div>

                  {/* Android Step */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>No Android (Chrome, Samsung Internet, Edge):</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Toque no menu de <strong>três pontinhos (⋮)</strong> no canto superior direito e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>. O Android criará o app nativo com ícone na sua gaveta de aplicativos.
                    </p>
                  </div>

                  {/* iOS Step */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-blue-600" />
                      <span>No iPhone / iPad (Safari):</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra inferior do Safari e escolha <strong>"Adicionar à Tela de Início"</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: QR Code */}
              {activeTab === 'qr' && (
                <div className="flex flex-col items-center text-center space-y-3 py-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                    Aponte a câmera do seu smartphone para o QR Code abaixo para abrir a WikiWorldWeb no celular:
                  </p>

                  <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code WikiWorldWeb" 
                      className="w-48 h-48 rounded-lg"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full max-w-sm mt-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={currentUrl} 
                      className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 truncate select-all focus:outline-hidden"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition cursor-pointer shrink-0"
                    >
                      {copiedLink ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: Features */}
              {activeTab === 'features' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs">
                      <Zap className="w-4 h-4" /> Janela Dedicada & Rápida
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Abre instantaneamente em janela autônoma, sem as barras e abas que poluem a tela do navegador.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
                      <HardDrive className="w-4 h-4" /> Leve e Eficiente
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Usa o motor do Chrome já instalado no computador, consumindo mínima memória RAM e espaço em disco.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs">
                      <ShieldCheck className="w-4 h-4" /> Seguro e Privado
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Zero anúncios, sem rastreadores intrusivos e criptografia HTTPS de ponta a ponta.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs">
                      <Sparkles className="w-4 h-4" /> Atalhos de Teclado
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Atalhos rápidos para pesquisa, caderno IA, previsão do tempo e editor de verbetes wikitexto.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Compatível com Google Chrome, Edge, Brave, Opera no PC, Mac e Celular
              </span>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

