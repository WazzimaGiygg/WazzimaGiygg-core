import React, { useState } from 'react';
import { 
  Tv, 
  X, 
  Sparkles, 
  ExternalLink, 
  QrCode, 
  Check, 
  Play, 
  Monitor, 
  Cast, 
  Layers, 
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface SmartTVInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchTVMode: () => void;
}

export const SmartTVInstallModal: React.FC<SmartTVInstallModalProps> = ({
  isOpen,
  onClose,
  onLaunchTVMode,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'samsung' | 'lg' | 'androidtv' | 'firetv'>('geral');
  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : 'https://wikizero.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(currentUrl)}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                WikiWorldWeb para Smart TV
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Experiência 10-Foot para Samsung Tizen, LG webOS, Android TV e Fire TV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Launch Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white">
                Interface 10-Foot Nativa
              </span>
              <h4 className="text-lg font-black">Iniciar Modo Smart TV Imediatamente</h4>
              <p className="text-xs text-blue-100 max-w-md">
                Transforma a tela em modo de televisão com controle remoto, fontes ampliadas para sofá e narração em áudio.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onLaunchTVMode();
              }}
              className="px-5 py-3 rounded-xl bg-white text-blue-900 font-bold text-sm hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 text-blue-600" />
              <span>Ativar Modo Smart TV</span>
            </button>
          </div>

          {/* TV Brands Selector */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'geral'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Conexão via QR Code
            </button>
            <button
              onClick={() => setActiveTab('samsung')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'samsung'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Samsung (Tizen)
            </button>
            <button
              onClick={() => setActiveTab('lg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'lg'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              LG (webOS)
            </button>
            <button
              onClick={() => setActiveTab('androidtv')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'androidtv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Android TV / Google TV
            </button>
            <button
              onClick={() => setActiveTab('firetv')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'firetv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Amazon Fire TV Stick
            </button>
          </div>

          {/* Tab 1: QR Code */}
          {activeTab === 'geral' && (
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="p-2 bg-white rounded-2xl shadow-md shrink-0">
                <img src={qrCodeUrl} alt="QR Code da Enciclopédia" className="w-36 h-36" />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  <Cast className="w-4 h-4 text-blue-500" />
                  <span>Transmitir ou Abrir no Navegador da TV</span>
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Aponte a câmera do celular para abrir o link e compartilhe via AirPlay ou Chromecast, ou digite o link abaixo no navegador da sua TV:
                </p>
                <div className="font-mono text-xs bg-slate-200 dark:bg-slate-900 px-3 py-2 rounded-xl text-blue-600 dark:text-blue-400 select-all break-all">
                  {currentUrl}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Samsung Tizen */}
          {activeTab === 'samsung' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">Passo a passo para Smart TV Samsung:</h5>
              <ol className="space-y-2 list-decimal list-inside leading-relaxed">
                <li>Abra o aplicativo <strong>Samsung Internet</strong> na barra de início da TV.</li>
                <li>Digite o endereço da WikiWorldWeb e pressione <strong>Concluir</strong>.</li>
                <li>Clique no botão <strong>"Modo Smart TV"</strong> para tela cheia adaptada ao controle remoto.</li>
                <li>Pressione o botão de <strong>Opções (três pontos) &gt; Adicionar aos Favoritos da Barra Inicial</strong>.</li>
              </ol>
            </div>
          )}

          {/* Tab 3: LG webOS */}
          {activeTab === 'lg' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">Passo a passo para Smart TV LG (webOS):</h5>
              <ol className="space-y-2 list-decimal list-inside leading-relaxed">
                <li>No controle Magic Remote, aperte o botão <strong>Home</strong> e selecione o <strong>Navegador Web</strong>.</li>
                <li>Acesse o link da WikiWorldWeb e clique no botão <strong>"Modo Smart TV"</strong>.</li>
                <li>No canto superior direito, clique na <strong>Estrela de Favoritos</strong> e fixe na barra rápida do webOS.</li>
              </ol>
            </div>
          )}

          {/* Tab 4: Android TV / Google TV */}
          {activeTab === 'androidtv' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">Passo a passo para Android TV / Google TV:</h5>
              <ol className="space-y-2 list-decimal list-inside leading-relaxed">
                <li>Abra o navegador (ex: JioPages, Chrome, TV Bro ou Puffin TV).</li>
                <li>Ao carregar a página da WikiWorldWeb, selecione <strong>"Instalar App PWA"</strong> ou abra o menu do navegador.</li>
                <li>O aplicativo será adicionado diretamente à tela principal de apps da TV (Leanback Launcher).</li>
              </ol>
            </div>
          )}

          {/* Tab 5: Amazon Fire TV */}
          {activeTab === 'firetv' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">Passo a passo para Fire TV Stick:</h5>
              <ol className="space-y-2 list-decimal list-inside leading-relaxed">
                <li>Abra o navegador <strong>Silk Browser</strong> no seu Fire TV.</li>
                <li>Acesse o endereço da enciclopédia e ative o <strong>Modo Smart TV</strong>.</li>
                <li>Pressione o botão <strong>Menu (três listras)</strong> do controle remoto do Fire TV e selecione <strong>"Fixar nos Favoritos da Home"</strong>.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Tv className="w-4 h-4 text-blue-500" />
            <span>Suporta 4K, 1080p e proporção 16:9</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
