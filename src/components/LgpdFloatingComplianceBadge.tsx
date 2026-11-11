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
        className="group bg-white/95 backdrop-blur-md hover:bg-white text-stone-800 border border-stone-200/80 shadow-md rounded-full pl-2 pr-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:shadow-lg hover:border-stone-300"
        title="Regras da LGPD (Lei 13.709/18) permanentemente à mostra para ciência absoluta de cumprimento. Clique para inspecionar."
      >
        <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
          <Scale className="w-3 h-3 text-emerald-600 group-hover:rotate-6 transition-transform" />
        </div>

        <div className="text-left font-mono leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-stone-900">
              Regras LGPD
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[9px] text-stone-500 font-normal block">
            {hasCiencia ? "Ciência Registrada" : "Lei 13.709/18"}
          </span>
        </div>
      </button>
    </aside>
  );
}
