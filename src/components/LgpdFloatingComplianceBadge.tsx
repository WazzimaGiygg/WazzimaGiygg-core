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
      aria-label="Selo Permanente de Conformidade LGPD e Marco Civil da Internet Brasileiro"
      className="fixed bottom-3 left-3 z-40 select-none animate-fade-in"
    >
      <button
        type="button"
        onClick={onOpen}
        className="group bg-white/95 dark:bg-[#1A1A18]/95 backdrop-blur-md hover:bg-white dark:hover:bg-[#242320] text-stone-800 dark:text-stone-100 border border-stone-300 dark:border-[#3E3D38] shadow-md rounded-full pl-2 pr-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:shadow-lg hover:border-emerald-500"
        title="Este site segue as normas da LGPD (Lei 13.709/18) e do Marco Civil da Internet brasileiro (Lei 12.965/14). Clique para inspecionar."
      >
        <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center shrink-0">
          <Scale className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:rotate-6 transition-transform" />
        </div>

        <div className="text-left font-mono leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              LGPD &amp; Marco Civil (BR)
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[9px] text-stone-500 dark:text-stone-400 font-normal block">
            {hasCiencia ? "Ciência Registrada • Leis 13.709 & 12.965" : "Leis 13.709/18 • 12.965/14"}
          </span>
        </div>
      </button>
    </aside>
  );
}

