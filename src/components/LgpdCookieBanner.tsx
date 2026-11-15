/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Banner e Central de Preferências de Cookies em conformidade com a LGPD
 * (Lei nº 13.709/2018) e Guia Orientativo da ANPD:
 * - Primeira camada sem dark patterns: botões equivalentes para Aceitar, Rejeitar Não Essenciais e Personalizar
 * - Segunda camada granular: caixas não essenciais DESMARCADAS por padrão (opt-in estrito)
 * - Transparência completa: finalidade, base legal, retenção e tabela real de cookies
 * - Revogação facilitada e exportação de comprovante de consentimento (Art. 8º, § 2º e § 5º)
 */

import React, { useEffect, useState } from 'react';
import {
  Scale,
  ShieldCheck,
  Sliders,
  X,
  Check,
  Ban,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Clock,
  Lock,
} from 'lucide-react';
import {
  COOKIE_CATEGORIES,
  COOKIE_INVENTORY,
  ConsentDecisionMethod,
  LgpdCookieConsent,
  exportCookieConsentProof,
  getConsentHistory,
  listActiveDocumentCookies,
} from '../utils/cookieConsent';

export interface LgpdCookieBannerProps {
  currentConsent: LgpdCookieConsent | null;
  isPreferencesOpen: boolean;
  onOpenPreferences: () => void;
  onClosePreferences: () => void;
  onSaveConsent: (
    prefs: { functional: boolean; analytics: boolean; thirdParty: boolean },
    method: ConsentDecisionMethod
  ) => void;
  onRevokeConsent: () => void;
  onOpenLgpdRules: () => void;
  currentUserLabel?: string;
}

export default function LgpdCookieBanner({
  currentConsent,
  isPreferencesOpen,
  onOpenPreferences,
  onClosePreferences,
  onSaveConsent,
  onRevokeConsent,
  onOpenLgpdRules,
  currentUserLabel,
}: LgpdCookieBannerProps) {
  // Opt-in estrito (LGPD/ANPD): nunca pré-marcar cookies não essenciais quando não há consentimento prévio
  const [functional, setFunctional] = useState<boolean>(Boolean(currentConsent?.functional));
  const [analytics, setAnalytics] = useState<boolean>(Boolean(currentConsent?.analytics));
  const [thirdParty, setThirdParty] = useState<boolean>(Boolean(currentConsent?.thirdParty));
  const [showInventory, setShowInventory] = useState<boolean>(false);

  useEffect(() => {
    setFunctional(Boolean(currentConsent?.functional));
    setAnalytics(Boolean(currentConsent?.analytics));
    setThirdParty(Boolean(currentConsent?.thirdParty));
  }, [currentConsent, isPreferencesOpen]);

  const handleAcceptAll = () => {
    onSaveConsent({ functional: true, analytics: true, thirdParty: true }, 'accept_all');
    onClosePreferences();
  };

  const handleRejectNonEssential = () => {
    onSaveConsent({ functional: false, analytics: false, thirdParty: false }, 'reject_non_essential');
    onClosePreferences();
  };

  const handleSaveCustom = () => {
    const allFalse = !functional && !analytics && !thirdParty;
    const allTrue = functional && analytics && thirdParty;
    const method: ConsentDecisionMethod = allTrue
      ? 'accept_all'
      : allFalse
      ? 'reject_non_essential'
      : 'custom';
    onSaveConsent({ functional, analytics, thirdParty }, method);
    onClosePreferences();
  };

  const getCategoryValue = (id: 'essential' | 'functional' | 'analytics' | 'thirdParty'): boolean => {
    if (id === 'essential') return true;
    if (id === 'functional') return functional;
    if (id === 'analytics') return analytics;
    return thirdParty;
  };

  const toggleCategory = (id: 'essential' | 'functional' | 'analytics' | 'thirdParty') => {
    if (id === 'essential') return;
    if (id === 'functional') setFunctional((v) => !v);
    if (id === 'analytics') setAnalytics((v) => !v);
    if (id === 'thirdParty') setThirdParty((v) => !v);
  };

  const history = isPreferencesOpen ? getConsentHistory() : [];
  const activeBrowserCookies = isPreferencesOpen ? listActiveDocumentCookies() : [];

  return (
    <>
      {/* PRIMEIRA CAMADA: Banner não bloqueante sem dark patterns */}
      {!currentConsent && !isPreferencesOpen && (
        <aside
          aria-label="Aviso de Cookies e Privacidade LGPD"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 max-w-xl bg-white dark:bg-[#1A1A18] border-2 border-[#141414] dark:border-[#3E3D38] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] p-5 z-40 text-left font-sans"
        >
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  Gestão de Cookies &amp; Privacidade (LGPD)
                </h4>
                <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                  Lei nº 13.709/2018 · ANPD
                </span>
              </div>

              <p className="text-xs font-serif text-stone-700 dark:text-stone-300 mt-1.5 leading-relaxed">
                Utilizamos cookies <strong>estritamente necessários</strong> para autenticação segura e funcionamento básico do portal (Art. 7º, V e IX). Cookies opcionais de preferências, métricas anônimas e recursos externos permanecem <strong>desativados por padrão</strong> e só são gravados com o seu consentimento explícito (Art. 7º, I). Você pode aceitar, rejeitar ou personalizar e revogar sua escolha a qualquer momento.
              </p>

              {/* Ações com equivalência visual (sem dark patterns) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 font-mono text-xs">
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="px-3 py-2 border border-[#141414] dark:border-[#57534E] bg-stone-100 dark:bg-[#242320] text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-[#2E2D29] text-[11px] font-bold uppercase cursor-pointer transition-colors"
                >
                  Rejeitar Não Essenciais
                </button>
                <button
                  type="button"
                  onClick={onOpenPreferences}
                  className="px-3 py-2 border border-[#141414] dark:border-[#57534E] bg-white dark:bg-[#1A1A18] text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#242320] text-[11px] font-bold uppercase cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Personalizar</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-3 py-2 border border-[#141414] dark:border-[#F5F4F0] bg-[#141414] dark:bg-[#F5F4F0] text-white dark:text-[#141414] hover:bg-stone-800 dark:hover:bg-white text-[11px] font-bold uppercase cursor-pointer transition-colors"
                >
                  Aceitar Todos
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <span className="text-stone-500 dark:text-stone-400">
                  Validade do registro: 180 dias · Zero publicidade comportamental
                </span>
                <button
                  type="button"
                  onClick={onOpenLgpdRules}
                  className="text-emerald-800 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  Política e Regras LGPD →
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* SEGUNDA CAMADA: Modal Granular de Preferências & Revogação LGPD */}
      {isPreferencesOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lgpd-cookie-modal-title"
        >
          <div className="max-w-3xl w-full bg-[#FAF9F5] dark:bg-[#1A1A18] border-2 border-[#141414] dark:border-[#3E3D38] shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] flex flex-col max-h-[90vh] overflow-hidden text-left">
            {/* Header */}
            <div className="bg-[#141414] text-white px-5 py-4 flex items-center justify-between gap-3 border-b border-stone-800">
              <div className="flex items-center gap-3 min-w-0">
                <Scale className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <h2 id="lgpd-cookie-modal-title" className="font-editorial text-lg font-bold leading-tight">
                    Central de Preferências de Cookies (LGPD)
                  </h2>
                  <p className="font-mono text-[11px] text-stone-300 mt-0.5 truncate">
                    Lei nº 13.709/2018 · Consentimento Granular, Base Legal e Revogação Imediata
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClosePreferences}
                className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 cursor-pointer transition-colors"
                aria-label="Fechar central de cookies"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Status atual do consentimento */}
              <div className="border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151513] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-mono text-xs font-bold uppercase text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {currentConsent
                        ? `Consentimento registrado (${currentConsent.protocolId})`
                        : 'Aguardando definição do titular (apenas essenciais ativos)'}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-stone-600 dark:text-stone-400">
                    {currentConsent
                      ? `Registrado em ${new Date(currentConsent.timestamp).toLocaleString('pt-BR')} · Expira em ${new Date(currentConsent.expiresAt).toLocaleDateString('pt-BR')}`
                      : 'Nenhum cookie opcional foi gravado. Por exigência da ANPD, opções não essenciais iniciam desmarcadas.'}
                  </p>
                </div>

                {currentConsent && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => exportCookieConsentProof(currentUserLabel)}
                      className="px-2.5 py-1.5 border border-stone-400 dark:border-stone-600 bg-stone-50 dark:bg-[#242320] text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#2E2D29] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Comprovante JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRevokeConsent}
                      className="px-2.5 py-1.5 border border-red-700 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Revogar Opcionais</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Categorias Granulares (Segunda Camada) */}
              <div className="space-y-3">
                {COOKIE_CATEGORIES.map((cat) => {
                  const checked = getCategoryValue(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151513] p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-stone-900 dark:text-stone-100 flex items-center gap-2">
                            {cat.required && <Lock className="w-3.5 h-3.5 text-stone-500" />}
                            <span>{cat.name}</span>
                          </h3>
                          <p className="text-xs font-serif text-stone-700 dark:text-stone-300 leading-relaxed">
                            {cat.purpose}
                          </p>
                        </div>

                        {cat.required ? (
                          <span className="shrink-0 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-400 px-2 py-1 border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
                            Sempre ativo
                          </span>
                        ) : (
                          <label className="shrink-0 inline-flex items-center gap-2 cursor-pointer font-mono text-[11px] font-bold text-stone-800 dark:text-stone-200 select-none">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCategory(cat.id)}
                              className="w-4 h-4 accent-[#141414] dark:accent-amber-400 cursor-pointer"
                            />
                            <span>{checked ? 'Autorizado' : 'Desativado'}</span>
                          </label>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                        <span>
                          <strong>Base legal:</strong> {cat.legalBasis}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <strong>Retenção:</strong> {cat.retention}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inventário Detalhado de Cookies & Armazenamento */}
              <div className="border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151513]">
                <button
                  type="button"
                  onClick={() => setShowInventory((v) => !v)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono font-bold uppercase text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-[#242320] cursor-pointer"
                >
                  <span>
                    Inventário Técnico de Cookies &amp; Armazenamento ({COOKIE_INVENTORY.length} registros ·{' '}
                    {activeBrowserCookies.length} cookie(s) HTTP ativo(s))
                  </span>
                  {showInventory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showInventory && (
                  <div className="border-t border-stone-200 dark:border-stone-800 p-4 space-y-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-[11px]">
                      <thead>
                        <tr className="border-b border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400">
                          <th className="py-2 pr-3 font-bold">Chave / Cookie</th>
                          <th className="py-2 pr-3 font-bold">Tipo / Provedor</th>
                          <th className="py-2 pr-3 font-bold">Finalidade</th>
                          <th className="py-2 font-bold">Retenção</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                        {COOKIE_INVENTORY.map((item) => (
                          <tr key={item.name}>
                            <td className="py-2 pr-3 font-bold align-top">{item.name}</td>
                            <td className="py-2 pr-3 align-top text-stone-600 dark:text-stone-400">
                              {item.storageType} · {item.provider}
                            </td>
                            <td className="py-2 pr-3 align-top font-sans">{item.purpose}</td>
                            <td className="py-2 align-top whitespace-nowrap">{item.retention}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {history.length > 0 && (
                      <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
                        <h4 className="font-mono text-[11px] font-bold uppercase text-stone-700 dark:text-stone-300 mb-2">
                          Histórico Local de Consentimento (Art. 8º, § 2º — Prova do Titular)
                        </h4>
                        <div className="space-y-1 font-mono text-[10px] text-stone-600 dark:text-stone-400">
                          {history.slice(0, 5).map((h) => (
                            <div key={h.protocolId} className="flex flex-wrap items-center justify-between gap-2">
                              <span>
                                <strong>{h.protocolId}</strong> · {h.decisionMethod} (F:{h.functional ? '1' : '0'} A:
                                {h.analytics ? '1' : '0'} T:{h.thirdParty ? '1' : '0'})
                              </span>
                              <span>{new Date(h.timestamp).toLocaleString('pt-BR')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="bg-stone-100 dark:bg-[#151513] border-t-2 border-[#141414] dark:border-[#3E3D38] px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={onOpenLgpdRules}
                className="text-emerald-800 dark:text-emerald-400 hover:underline font-bold cursor-pointer text-[11px]"
              >
                Abrir Regras Completas da LGPD →
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="px-3 py-2 border border-[#141414] dark:border-[#57534E] bg-white dark:bg-[#242320] text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-[#2E2D29] font-bold uppercase text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Rejeitar Não Essenciais</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-3.5 py-2 border border-[#141414] dark:border-amber-400 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold uppercase text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Preferências</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-3.5 py-2 border border-[#141414] dark:border-[#F5F4F0] bg-[#141414] dark:bg-[#F5F4F0] text-white dark:text-[#141414] hover:bg-stone-800 dark:hover:bg-white font-bold uppercase text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Aceitar Todos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
