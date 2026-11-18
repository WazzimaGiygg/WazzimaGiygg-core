/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Monitor,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'mobile' | 'footer';
  showToast?: (msg: string, isError?: boolean) => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  showToast,
}) => {
  const { isInstallable, isInstalled, isIOS, isMobile, isEmbeddedIframe, platform, install } =
    usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState<'desktop' | 'android' | 'ios'>(() => {
    if (isIOS) return 'ios';
    if (platform === 'android' || isMobile) return 'android';
    return 'desktop';
  });
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Suppress install prompt when already running in installed standalone mode
  if (isInstalled) {
    return null;
  }

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        showToast?.('✓ Aplicativo instalado com sucesso no dispositivo!');
        return;
      }
    }
    setGuideTab(isIOS ? 'ios' : platform === 'android' || isMobile ? 'android' : 'desktop');
    setShowGuideModal(true);
  };

  const handleCopyAppUrl = async () => {
    try {
      const targetUrl = window.location.origin;
      await navigator.clipboard.writeText(targetUrl);
      setCopiedUrl(true);
      showToast?.('Link oficial do aplicativo copiado!');
      window.setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      showToast?.('Não foi possível copiar o endereço automaticamente.', true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap shrink-0 border transition-colors cursor-pointer bg-amber-400 hover:bg-amber-300 text-[#141414] border-amber-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          title="Instalar aplicativo para Computador (Windows/Mac/Linux) e Celular (Android/iOS)"
        >
          {isMobile ? (
            <Smartphone className="w-3 h-3 shrink-0" />
          ) : (
            <Monitor className="w-3 h-3 shrink-0" />
          )}
          <span>{isInstallable ? 'Instalar App' : 'App PC & Celular'}</span>
        </button>
      )}

      {variant === 'mobile' && (
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>App</span>
        </button>
      )}

      {variant === 'footer' && (
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3 h-3 text-amber-300" />
          <span>Instalar App (PC &amp; Celular)</span>
        </button>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wzzm-pwa-modal-title"
        >
          <div className="w-full max-w-lg bg-[#FAF9F5] dark:bg-[#181816] text-[#141414] dark:text-stone-100 border-4 border-[#141414] dark:border-[#3E3D38] shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] overflow-hidden text-left">
            {/* Modal Header */}
            <div className="bg-[#141414] text-white px-5 py-4 flex items-center justify-between border-b-2 border-black">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="Ícone do App WazzimaGiygg"
                  className="w-9 h-9 border border-stone-600 object-cover shrink-0"
                />
                <div>
                  <h3
                    id="wzzm-pwa-modal-title"
                    className="font-editorial text-lg font-bold leading-tight text-white"
                  >
                    App WazzimaGiygg — Computador &amp; Celular
                  </h3>
                  <p className="text-[11px] font-mono text-amber-300">
                    Modo Offline • Tela Dedicada • Notificações Push
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
                aria-label="Fechar guia de instalação"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Native 1-Click Install CTA when browser exposes beforeinstallprompt */}
              {isInstallable && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs font-serif text-emerald-950 dark:text-emerald-100">
                    <strong>Instalação direta disponível!</strong> Seu navegador já está pronto para instalar o aplicativo no dispositivo.
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await install();
                      if (ok) {
                        setShowGuideModal(false);
                        showToast?.('✓ Aplicativo instalado com sucesso!');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Instalar Agora</span>
                  </button>
                </div>
              )}

              {/* Embedded Preview Warning */}
              {isEmbeddedIframe && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/35 border border-amber-600 text-xs font-serif text-amber-950 dark:text-amber-100 flex flex-col gap-2">
                  <p>
                    <strong>Nota da pré-visualização:</strong> Dentro de janelas incorporadas, navegadores bloqueiam o botão automático de instalação. Copie o link e abra diretamente em uma aba do Chrome, Edge ou Safari para concluir a instalação.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyAppUrl}
                    className="self-start px-3 py-1.5 bg-[#141414] text-amber-300 font-mono text-[11px] font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Link Copiado' : 'Copiar Link do App'}</span>
                  </button>
                </div>
              )}

              {/* Device Selector Tabs */}
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] font-bold uppercase">
                <button
                  type="button"
                  onClick={() => setGuideTab('desktop')}
                  className={`py-2 px-2 border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    guideTab === 'desktop'
                      ? 'bg-[#141414] dark:bg-stone-100 text-white dark:text-stone-950 border-[#141414]'
                      : 'bg-white dark:bg-[#242320] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-[#3E3D38]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Computador</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuideTab('android')}
                  className={`py-2 px-2 border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    guideTab === 'android'
                      ? 'bg-[#141414] dark:bg-stone-100 text-white dark:text-stone-950 border-[#141414]'
                      : 'bg-white dark:bg-[#242320] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-[#3E3D38]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuideTab('ios')}
                  className={`py-2 px-2 border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    guideTab === 'ios'
                      ? 'bg-[#141414] dark:bg-stone-100 text-white dark:text-stone-950 border-[#141414]'
                      : 'bg-white dark:bg-[#242320] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-[#3E3D38]'
                  }`}
                >
                  <Share className="w-3.5 h-3.5" />
                  <span>iPhone / iPad</span>
                </button>
              </div>

              {/* Platform Instructions */}
              {guideTab === 'desktop' && (
                <div className="p-4 bg-white dark:bg-[#121210] border border-stone-300 dark:border-[#3E3D38] space-y-2.5 text-xs font-serif">
                  <p className="font-mono font-bold text-[11px] uppercase text-[#B91C1C] dark:text-amber-400">
                    Windows, macOS ou Linux (Chrome, Edge, Brave)
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-stone-800 dark:text-stone-200 leading-relaxed">
                    <li>
                      Clique no ícone de <strong>Instalar aplicativo (monitor com seta)</strong> no canto direito da barra de endereço do navegador.
                    </li>
                    <li>
                      Ou abra o menu <strong>⋮ / ⋯</strong> → <strong>Salvar e compartilhar / Aplicativos</strong> → <strong>Instalar WazzimaGiygg</strong>.
                    </li>
                    <li>
                      No Safari (macOS Sonoma+), clique em <strong>Arquivo → Adicionar ao Dock</strong>.
                    </li>
                  </ol>
                </div>
              )}

              {guideTab === 'android' && (
                <div className="p-4 bg-white dark:bg-[#121210] border border-stone-300 dark:border-[#3E3D38] space-y-2.5 text-xs font-serif">
                  <p className="font-mono font-bold text-[11px] uppercase text-emerald-800 dark:text-emerald-400">
                    Celular &amp; Tablet Android (Chrome / Edge / Samsung Internet)
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-stone-800 dark:text-stone-200 leading-relaxed">
                    <li>
                      Toque no menu <strong>⋮</strong> no canto superior direito do navegador.
                    </li>
                    <li>
                      Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
                    </li>
                    <li>
                      Confirme em <strong>Instalar</strong> para criar o ícone nativo com abertura em tela cheia.
                    </li>
                  </ol>
                </div>
              )}

              {guideTab === 'ios' && (
                <div className="p-4 bg-white dark:bg-[#121210] border border-stone-300 dark:border-[#3E3D38] space-y-2.5 text-xs font-serif">
                  <p className="font-mono font-bold text-[11px] uppercase text-sky-800 dark:text-sky-400">
                    iPhone &amp; iPad (Safari iOS / iPadOS)
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-stone-800 dark:text-stone-200 leading-relaxed">
                    <li>
                      Abra o portal no navegador <strong>Safari</strong>.
                    </li>
                    <li>
                      Toque no botão <strong>Compartilhar</strong> (quadrado com seta para cima) na barra do Safari.
                    </li>
                    <li>
                      Role as opções e toque em <strong>Adicionar à Tela de Início</strong> → <strong>Adicionar</strong>.
                    </li>
                  </ol>
                </div>
              )}

              {/* App Capabilities Summary */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-stone-700 dark:text-stone-300">
                <div className="p-2.5 bg-stone-100 dark:bg-[#242320] border border-stone-300 dark:border-[#3E3D38] flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span>Leitura offline com cache local</span>
                </div>
                <div className="p-2.5 bg-stone-100 dark:bg-[#242320] border border-stone-300 dark:border-[#3E3D38] flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>Janela própria sem barra de URL</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-[#EBE8E1] dark:bg-[#22211E] border-t-2 border-[#141414] dark:border-[#3E3D38] flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="paper-button px-4 py-2 text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
