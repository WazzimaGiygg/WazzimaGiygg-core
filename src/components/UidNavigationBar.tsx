/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 3.05.6.d - Inserir o uso do retornar e avançar para navegar pelo UID presente no URL do site
 * Barra de Navegação por UID com controles Retornar (⬅️) e Avançar (➡️), simplificada e minimalista.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  X,
  User,
  Compass,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
import {
  UidNavigationState,
  PORTAL_TAB_METADATA,
  parseTabFromUid
} from '../hooks/useUidNavigation';

interface UidNavigationBarProps {
  nav: UidNavigationState;
  availableUsers?: Array<{ uid: string; name?: string; email?: string }>;
  onOpenUserProfile?: (uid: string) => void;
  showToast?: (msg: string, isError?: boolean) => void;
}

export default function UidNavigationBar({
  nav,
  availableUsers = [],
  onOpenUserProfile,
  showToast
}: UidNavigationBarProps) {
  const [copied, setCopied] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [customInputUid, setCustomInputUid] = useState('');

  const activeTabId = useMemo(() => {
    return parseTabFromUid(nav.currentUid);
  }, [nav.currentUid]);

  const activeTabInfo = useMemo(() => {
    if (!activeTabId) return null;
    return PORTAL_TAB_METADATA.find((t) => t.id === activeTabId) || null;
  }, [activeTabId]);

  const handleCopyUrl = () => {
    const ok = nav.copyShareableUrl();
    if (ok) {
      setCopied(true);
      if (showToast) showToast('Link ?uid= copiado.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCustomNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInputUid.trim()) {
      nav.navigateToUid(customInputUid.trim());
      setCustomInputUid('');
      setIsQuickMenuOpen(false);
      if (showToast) showToast(`Navegando para ?uid=${customInputUid.trim()}`);
    }
  };

  return (
    <nav
      aria-label="Controle de Navegação por UID"
      className="bg-white/85 dark:bg-[#181816]/90 backdrop-blur border-b border-stone-200 dark:border-[#2E2D2A] py-2 px-4 text-xs font-mono select-none transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Navigation History Controls: Retornar & Avançar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={nav.navigateBack}
            disabled={!nav.canGoBack}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              nav.canGoBack
                ? 'text-stone-700 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                : 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
            }`}
            title={nav.canGoBack ? 'Retornar (Alt+⬅️)' : 'Sem histórico anterior'}
            aria-label="Retornar"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>

          <button
            type="button"
            onClick={nav.navigateForward}
            disabled={!nav.canGoForward}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              nav.canGoForward
                ? 'text-stone-700 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                : 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
            }`}
            title={nav.canGoForward ? 'Avançar (Alt+➡️)' : 'Sem histórico posterior'}
            aria-label="Avançar"
          >
            <ArrowRight className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Minimal Address Bar */}
        <div className="flex-1 max-w-xl mx-auto flex items-center bg-stone-50 dark:bg-[#121210] hover:bg-stone-100/80 dark:hover:bg-[#1F1E1B] border border-stone-200 dark:border-[#34332F] rounded-lg px-3 py-1 transition-colors">
          <span className="text-stone-400 dark:text-stone-500 select-none text-[11px] mr-1.5">wazzimagiygg.com/</span>
          {nav.currentUid ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-semibold text-stone-900 dark:text-stone-100 truncate text-[11px]">
                ?uid={nav.currentUid}
              </span>
              {activeTabInfo && (
                <span className="text-[10px] text-stone-500 dark:text-stone-400 hidden sm:inline">
                  ({activeTabInfo.label})
                </span>
              )}
            </div>
          ) : (
            <span className="text-stone-400 dark:text-stone-500 italic text-[11px] flex-1">
              ?uid=inicio
            </span>
          )}

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!activeTabInfo && nav.currentUid && onOpenUserProfile && (
              <button
                type="button"
                onClick={() => onOpenUserProfile(nav.currentUid!)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded transition-colors"
                title="Ver perfil"
              >
                <User className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyUrl}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded transition-colors cursor-pointer"
              title="Copiar link"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {nav.currentUid && (
              <button
                type="button"
                onClick={nav.clearUid}
                className="text-stone-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                title="Limpar UID"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Minimalist Switcher Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
            className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-2.5 py-1 rounded-md text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Navegar UID</span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {isQuickMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1A1A18] rounded-xl border border-stone-200 dark:border-[#34332F] shadow-xl z-50 p-3 text-left">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-[#2D2C28]">
                <span className="font-semibold text-xs text-stone-800 dark:text-stone-100">Ir para UID</span>
                <button
                  onClick={() => setIsQuickMenuOpen(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleCustomNavigate} className="mb-3">
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={customInputUid}
                    onChange={(e) => setCustomInputUid(e.target.value)}
                    placeholder="Ex: dossie, chat..."
                    className="w-full bg-stone-50 dark:bg-[#121210] border border-stone-200 dark:border-[#34332F] rounded-md px-2.5 py-1 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                  <button
                    type="submit"
                    className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 font-medium px-3 py-1 text-xs rounded-md hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
                  >
                    Ir
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-stone-100 dark:border-[#2D2C28]">
                <span className="block text-[10px] text-stone-400 uppercase font-semibold mb-1.5 flex items-center gap-1">
                  <LayoutGrid className="w-3 h-3" />
                  Abas Disponíveis
                </span>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                  {PORTAL_TAB_METADATA.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        nav.navigateToUid(tab.id);
                        setIsQuickMenuOpen(false);
                      }}
                      className={`text-left px-2 py-1 text-[11px] rounded transition-colors truncate cursor-pointer ${
                        activeTabId === tab.id
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 font-medium'
                          : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
