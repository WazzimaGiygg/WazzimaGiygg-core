/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 3.05.6.d - Inserir o uso do retornar e avançar para navegar pelo UID presente no URL do site
 * Barra de Navegação por UID com controles Retornar (⬅️) e Avançar (➡️), histórico visual e integração com URL.
 * Suporta navegação entre abas por UID, artigos e perfis de usuário com suporte total aos botões nativos do navegador.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  X,
  User,
  History,
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
      if (showToast) showToast('URL com parâmetro ?uid= copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2200);
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
      aria-label="Controle de Navegação por UID (3.05.6.d)"
      className="bg-[#1C1C22] text-[#F0EFEA] border-b-2 border-[#141414] py-2 px-3 sm:px-4 text-xs font-mono shadow-sm select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Left Section: 3.05.6.d Tag & Retornar / Avançar Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start w-full md:w-auto">
          {/* Requirement Badge */}
          <span className="bg-[#D97706] text-black font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            3.05.6.d • UID URL
          </span>

          {/* Navigation Controls: Retornar & Avançar (also synced with native browser buttons) */}
          <div className="inline-flex rounded-none border border-stone-600 bg-stone-900 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]">
            {/* RETORNAR (VOLTAR) */}
            <button
              type="button"
              onClick={nav.navigateBack}
              disabled={!nav.canGoBack}
              className={`flex items-center gap-1.5 px-3 py-1 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                nav.canGoBack
                  ? 'bg-stone-800 text-amber-300 hover:bg-stone-700 active:bg-amber-400 active:text-black hover:text-white'
                  : 'bg-stone-900/60 text-stone-500 cursor-not-allowed opacity-50'
              }`}
              title={
                nav.canGoBack
                  ? 'Retornar ao UID anterior no histórico (ou use botão Voltar do navegador / Alt+⬅️)'
                  : 'Sem UID anterior no histórico para retornar'
              }
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Retornar</span>
            </button>

            {/* DIVIDER */}
            <div className="w-[1px] bg-stone-700 self-stretch" />

            {/* AVANÇAR */}
            <button
              type="button"
              onClick={nav.navigateForward}
              disabled={!nav.canGoForward}
              className={`flex items-center gap-1.5 px-3 py-1 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                nav.canGoForward
                  ? 'bg-stone-800 text-amber-300 hover:bg-stone-700 active:bg-amber-400 active:text-black hover:text-white'
                  : 'bg-stone-900/60 text-stone-500 cursor-not-allowed opacity-50'
              }`}
              title={
                nav.canGoForward
                  ? 'Avançar ao próximo UID no histórico (ou use botão Avançar do navegador / Alt+➡️)'
                  : 'Sem UID posterior no histórico para avançar'
              }
            >
              <span>Avançar</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Step indicator in history */}
          {nav.uidHistory.length > 0 && (
            <span className="text-[10px] text-stone-400 font-mono hidden lg:inline">
              Posição: <strong className="text-amber-400">{nav.historyIndex + 1}</strong> de{' '}
              <strong className="text-stone-300">{nav.uidHistory.length}</strong>
            </span>
          )}
        </div>

        {/* Center / Right Section: Active UID Display, Copy, Clear & Quick Switch */}
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end w-full md:w-auto">
          {/* Active UID Pill */}
          <div className="flex items-center gap-1.5 bg-[#101014] border border-stone-700 px-2.5 py-1 text-xs">
            <span className="text-stone-500 text-[10px] uppercase tracking-wider font-bold">
              URL ATUAL:
            </span>
            {nav.currentUid ? (
              <div className="flex items-center gap-1.5">
                {activeTabInfo ? (
                  <span className="bg-amber-400 text-black font-bold px-1.5 py-0.2 text-[9px] uppercase tracking-wider">
                    ABA: {activeTabInfo.label}
                  </span>
                ) : (
                  <span className="bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.2 text-[9px] uppercase tracking-wider border border-indigo-500/30">
                    UID
                  </span>
                )}

                <span className="bg-amber-500/10 text-amber-300 font-bold px-1.5 py-0.2 border border-amber-500/30 text-[11px] max-w-[160px] sm:max-w-[200px] truncate">
                  ?uid={nav.currentUid}
                </span>

                {/* Open Profile Button (shown only if not a tab) */}
                {!activeTabInfo && onOpenUserProfile && (
                  <button
                    type="button"
                    onClick={() => onOpenUserProfile(nav.currentUid!)}
                    className="text-stone-300 hover:text-white hover:bg-stone-700 p-0.5 rounded cursor-pointer transition-colors"
                    title="Ver perfil completo deste UID"
                  >
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                )}

                {/* Copy Link Button */}
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="text-stone-300 hover:text-white hover:bg-stone-700 p-0.5 rounded cursor-pointer transition-colors"
                  title="Copiar URL completo com ?uid="
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Clear UID Button */}
                <button
                  type="button"
                  onClick={nav.clearUid}
                  className="text-stone-400 hover:text-red-400 hover:bg-stone-800 p-0.5 rounded cursor-pointer transition-colors"
                  title="Limpar parâmetro ?uid= do URL"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-stone-500 italic text-[11px]">
                Nenhum ?uid= ativo
              </span>
            )}
          </div>

          {/* Quick Dropdown Menu for testing UIDs (Tabs, History, Database Users) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
              className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
              title="Testar navegação rápida entre abas e UIDs"
            >
              <Compass className="w-3 h-3 text-amber-400" />
              <span>Trocar UID</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isQuickMenuOpen && (
              <div className="absolute right-0 mt-1 w-80 max-h-[85vh] overflow-y-auto bg-[#16161B] border-2 border-stone-600 shadow-2xl z-50 p-3 text-left">
                <div className="flex items-center justify-between border-b border-stone-700 pb-1.5 mb-2.5">
                  <span className="font-bold text-[10px] uppercase text-stone-300 tracking-wider flex items-center gap-1.5">
                    <History className="w-3 h-3 text-amber-400" />
                    Pilha e Seleção de UID
                  </span>
                  <button
                    onClick={() => setIsQuickMenuOpen(false)}
                    className="text-stone-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Custom UID Input Form */}
                <form onSubmit={handleCustomNavigate} className="mb-3">
                  <label className="block text-[9px] text-stone-400 uppercase mb-1 font-bold">
                    Digitar UID Manualmente:
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={customInputUid}
                      onChange={(e) => setCustomInputUid(e.target.value)}
                      placeholder="Ex: dossie, chat, usr_pedro..."
                      className="w-full bg-[#101014] border border-stone-700 px-2 py-1 text-[10px] text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-amber-500 text-black font-bold px-2.5 py-1 text-[10px] uppercase hover:bg-amber-400 cursor-pointer"
                    >
                      Ir
                    </button>
                  </div>
                </form>

                {/* Portal Tabs as UIDs */}
                <div className="mb-3 border-t border-stone-800 pt-2">
                  <span className="block text-[9px] text-amber-400 uppercase mb-1.5 font-bold flex items-center gap-1">
                    <LayoutGrid className="w-3 h-3" />
                    Abas do Portal como UIDs (12 abas):
                  </span>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                    {PORTAL_TAB_METADATA.map((tab) => {
                      const isActive = activeTabId === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            nav.navigateToUid(tab.id);
                            setIsQuickMenuOpen(false);
                            if (showToast) showToast(`Navegando para aba ?uid=${tab.id}`);
                          }}
                          className={`text-left p-1 text-[9px] border font-mono truncate cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-amber-500 text-black font-bold border-amber-400'
                              : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-600 hover:text-white'
                          }`}
                          title={`Abrir ${tab.label} via ?uid=${tab.id}`}
                        >
                          <span className="block font-bold truncate">{tab.label}</span>
                          <span className="text-[8px] opacity-75 truncate block">?uid={tab.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* UID History Stack */}
                {nav.uidHistory.length > 0 && (
                  <div className="mb-3 border-t border-stone-800 pt-2">
                    <span className="block text-[9px] text-stone-400 uppercase mb-1 font-bold">
                      Histórico Recente ({nav.uidHistory.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {nav.uidHistory.map((itemUid, idx) => {
                        const isActive = idx === nav.historyIndex;
                        return (
                          <button
                            key={`${itemUid}-${idx}`}
                            type="button"
                            onClick={() => {
                              nav.jumpToIndex(idx);
                              setIsQuickMenuOpen(false);
                            }}
                            className={`px-1.5 py-0.5 text-[9px] border font-mono cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-amber-500 text-black font-bold border-amber-400'
                                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                            }`}
                            title={`Ir para posição #${idx + 1}: ${itemUid}`}
                          >
                            #{idx + 1} {itemUid.substring(0, 10)}
                            {itemUid.length > 10 ? '…' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Users from Database */}
                <div className="border-t border-stone-800 pt-2">
                  <span className="block text-[9px] text-stone-400 uppercase mb-1 font-bold">
                    Usuários Sincronizados do Banco ({availableUsers.length}):
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {availableUsers.length === 0 ? (
                      <p className="text-[10px] text-stone-500 italic py-1">
                        Carregando usuários do banco...
                      </p>
                    ) : (
                      availableUsers.map((u) => {
                        const isCurrent = nav.currentUid === u.uid;
                        return (
                          <div
                            key={u.uid}
                            onClick={() => {
                              nav.navigateToUid(u.uid);
                              setIsQuickMenuOpen(false);
                              if (showToast) showToast(`Navegando para ?uid=${u.uid}`);
                            }}
                            className={`p-1.5 border text-[10px] flex items-center justify-between cursor-pointer rounded-none transition-colors ${
                              isCurrent
                                ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                                : 'bg-[#101014] border-stone-800 hover:border-stone-600 text-stone-300'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold block truncate">
                                {u.name || 'Usuário WZZM'}
                              </span>
                              <span className="text-[9px] text-stone-500 block truncate">
                                UID: {u.uid}
                              </span>
                            </div>
                            <span className="text-[9px] bg-stone-800 text-amber-400 px-1 py-0.5 uppercase shrink-0 font-bold">
                              {isCurrent ? 'ATIVO' : 'SELECIONAR'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
