/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Botão/Selo Flutuante de Conformidade LGPD Sempre à Mostra
 * Garante que em qualquer página ou rota o visitante tenha acesso instantâneo às regras da LGPD.
 */

import React from 'react';
import { Scale, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LgpdFloatingComplianceBadgeProps {
  onOpen: () => void;
  hasCiencia: boolean;
}

export default function LgpdFloatingComplianceBadge({
  onOpen,
  hasCiencia
}: LgpdFloatingComplianceBadgeProps) {
  return (
    <aside
      aria-label="Selo Permanente de Conformidade LGPD à Amostra"
      className="fixed bottom-3 left-3 z-40 select-none animate-fade-in"
    >
      <button
        type="button"
        onClick={onOpen}
        className="group bg-[#141414] hover:bg-stone-900 text-stone-100 border-2 border-emerald-500 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.8)] px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
        title="Regras da LGPD (Lei 13.709/18) permanentemente à mostra para ciência absoluta de cumprimento. Clique para inspecionar."
      >
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
          <Scale className="w-3 h-3 text-emerald-400 group-hover:rotate-12 transition-transform" />
        </div>

        <div className="text-left font-mono leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              Regras LGPD à Amostra
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-[9px] text-emerald-400 font-bold block">
            {hasCiencia ? "✓ Ciência Absoluta Registrada" : "Lei 13.709/18 • 100% Cumprida"}
          </span>
        </div>
      </button>
    </aside>
  );
}
