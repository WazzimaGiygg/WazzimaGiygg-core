/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Bloco / Aba de Contra-Propaganda Institucional contra a Wikipédia:
 * Investigação Jurídico-Regulatória sobre LGPD e Marco Civil (WMF & Wikipédia Lusófona).
 */

import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Scale,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  AuditRiskLevel,
  WIKIPEDIA_VS_WIKISITE_COUNTER_MATRIX,
  WMF_INVESTIGATION_SOURCES,
  WMF_LGPD_AUDIT_FINDINGS,
  WMF_LGPD_INVESTIGATION_META,
  WMF_LGPD_PDF_URL,
} from '../data/wmfLgpdInvestigationData';

interface WmfLgpdCounterPropagandaViewProps {
  showToast?: (msg: string, isError?: boolean) => void;
  onOpenLgpdPanel?: () => void;
  onOpenTicketForm?: (tipo?: string) => void;
}

export default function WmfLgpdCounterPropagandaView({
  showToast,
  onOpenLgpdPanel,
  onOpenTicketForm,
}: WmfLgpdCounterPropagandaViewProps) {
  const [riskFilter, setRiskFilter] = useState<'TODOS' | AuditRiskLevel>('TODOS');
  const [copiedCitation, setCopiedCitation] = useState(false);

  const filteredFindings =
    riskFilter === 'TODOS'
      ? WMF_LGPD_AUDIT_FINDINGS
      : WMF_LGPD_AUDIT_FINDINGS.filter((item) => item.risco === riskFilter);

  const handleCopyAbntCitation = async () => {
    const citation = `WAZZIMAGIYGG AUDITORIA. Investigação LGPD e Marco Civil — Wikimedia Foundation (WMF) e Wikipédia (41 p.). Disponível em: <${WMF_LGPD_PDF_URL}>.`;
    try {
      await navigator.clipboard.writeText(citation);
      setCopiedCitation(true);
      showToast?.('Citação ABNT da Investigação LGPD & Marco Civil copiada!');
      setTimeout(() => setCopiedCitation(false), 2400);
    } catch {
      showToast?.('Não foi possível copiar automaticamente.', true);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* 1. CABEÇALHO EDITORIAL DE CONTRA-PROPAGANDA */}
      <div className="bg-[#141414] text-white border-2 border-black p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(185,28,28,1)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#B91C1C] text-white font-mono font-bold text-[10px] uppercase px-2 py-0.5 tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> CONTRA-PROPAGANDA DOCUMENTAL • AUDITORIA 41 PÁGINAS
            </span>
            <span className="bg-amber-400 text-[#141414] font-mono font-bold text-[10px] uppercase px-2 py-0.5">
              LGPD + MARCO CIVIL + ANPD
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAbntCitation}
              className="bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-600 px-2.5 py-1 font-mono text-[11px] font-bold uppercase flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCitation ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{copiedCitation ? 'Citação Copiada!' : 'Copiar Citação'}</span>
            </button>

            <a
              href={WMF_LGPD_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-700 hover:bg-red-600 text-white border border-red-400 px-3 py-1 font-mono text-[11px] font-bold uppercase flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Abrir PDF Completo (41p)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-white leading-tight">
            Por que a Wikipédia Viola a LGPD e o Marco Civil da Internet — e Por que o Wiki-Site WazzimaGiygg é a Alternativa Segura
          </h3>
          <p className="text-xs sm:text-sm font-serif text-stone-200 mt-2 leading-relaxed">
            {WMF_LGPD_INVESTIGATION_META.conclusaoCentral}
          </p>
        </div>

        {/* Resumo Estatístico da Auditoria */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
          <div className="bg-red-950/70 border border-red-600 p-3">
            <span className="text-[10px] uppercase text-red-200 block">AUD-01 • Passivo de IPs</span>
            <strong className="text-base text-white">RISCO CRÍTICO</strong>
            <span className="block text-[10px] text-red-200/90 mt-0.5">+20 anos expostos a scraping</span>
          </div>
          <div className="bg-amber-950/60 border border-amber-500 p-3">
            <span className="text-[10px] uppercase text-amber-200 block">Art. 15 Marco Civil</span>
            <strong className="text-base text-white">90d vs 180d</strong>
            <span className="block text-[10px] text-amber-200/90 mt-0.5">Expurgo antes do prazo legal</span>
          </div>
          <div className="bg-stone-900 border border-stone-600 p-3">
            <span className="text-[10px] uppercase text-stone-300 block">AUD-02 • Art. 41 LGPD</span>
            <strong className="text-base text-amber-300">SEM DPO NO BR</strong>
            <span className="block text-[10px] text-stone-300 mt-0.5">Centralização na Califórnia</span>
          </div>
          <div className="bg-emerald-950/70 border border-emerald-500 p-3">
            <span className="text-[10px] uppercase text-emerald-200 block">Wiki-Site NotMediaWiki</span>
            <strong className="text-base text-emerald-300">100% CONFORME</strong>
            <span className="block text-[10px] text-emerald-200/90 mt-0.5">IPs sigilosos & Art. 18 real</span>
          </div>
        </div>
      </div>

      {/* 2. QUADRO COMPARATIVO DE CONTRA-PROPAGANDA */}
      <div className="bg-white border-2 border-[#141414] shadow-[5px_5px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
        <div className="bg-[#EBE8E1] border-b-2 border-[#141414] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-mono font-bold text-sm uppercase tracking-wider text-stone-950 flex items-center gap-2">
              <Scale className="w-4 h-4 text-red-700" />
              <span>Comparativo Jurídico-Técnico: Wikipédia (WMF) vs. Wiki-Site WazzimaGiygg</span>
            </h4>
            <p className="text-[11px] font-mono text-stone-600 mt-0.5">
              Fatos auditados no documento oficial contra a propaganda de "neutralidade e privacidade" da Wikipédia.
            </p>
          </div>
          <a
            href={WMF_LGPD_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono font-bold text-red-800 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Fonte: Investigação LGPD e Marco Civil (.pdf)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141414] text-white font-mono uppercase text-[10px] tracking-wider">
                <th className="p-3 border-r border-stone-700 w-1/4">Eixo Auditado &amp; Lei</th>
                <th className="p-3 border-r border-stone-700 w-[37.5%] bg-red-950 text-red-200">
                  Wikipédia / Wikimedia Foundation (Não-Conformidade)
                </th>
                <th className="p-3 w-[37.5%] bg-emerald-950 text-emerald-200">
                  Wiki-Site WazzimaGiygg &amp; NotMediaWiki (Conformidade BR)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300 font-serif">
              {WIKIPEDIA_VS_WIKISITE_COUNTER_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-3 border-r border-stone-200 align-top">
                    <div className="font-mono font-bold text-stone-950 text-xs">{row.criterio}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] bg-stone-100 border border-stone-300 px-1.5 py-0.5 text-stone-700">
                        {row.baseLegal}
                      </span>
                      <span
                        className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 ${
                          row.statusWmf === 'CRÍTICO'
                            ? 'bg-red-700 text-white'
                            : row.statusWmf === 'IRREGULAR'
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-800 text-amber-300'
                        }`}
                      >
                        WMF: {row.statusWmf}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 border-r border-stone-200 align-top bg-red-50/40 text-stone-800 leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      <XCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                      <span>{row.wikipediaWmf}</span>
                    </div>
                  </td>
                  <td className="p-3 align-top bg-emerald-50/40 text-stone-900 leading-relaxed font-medium">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{row.wikiSiteWzzm}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MATRIZ DETALHADA DAS 7 FRENTES DE IRREGULARIDADE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#141414] pb-3">
          <div>
            <h4 className="font-editorial text-xl sm:text-2xl font-bold text-stone-950">
              Achados da Auditoria Regulatória (AUD-01 a AUD-05)
            </h4>
            <p className="text-xs font-mono text-stone-600">
              Detalhamento técnico-jurídico extraído do relatório de 41 páginas sobre a Wikipédia Lusófona e a WMF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold uppercase">
            {(['TODOS', 'CRÍTICO', 'ALTO', 'MÉDIO a ALTO'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setRiskFilter(level)}
                className={`px-2.5 py-1.5 border cursor-pointer transition-colors ${
                  riskFilter === level
                    ? 'bg-[#141414] text-amber-300 border-black'
                    : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredFindings.map((finding, index) => (
            <div
              key={finding.id}
              className="bg-white border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-stone-200 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                    <span className="bg-[#141414] text-amber-300 font-bold px-2 py-0.5 uppercase">
                      {finding.codigoMatriz}
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 uppercase border flex items-center gap-1 ${
                        finding.risco === 'CRÍTICO'
                          ? 'bg-red-700 text-white border-red-900'
                          : finding.risco === 'ALTO'
                          ? 'bg-red-100 text-red-900 border-red-400'
                          : 'bg-amber-100 text-amber-900 border-amber-400'
                      }`}
                    >
                      {finding.risco === 'CRÍTICO' ? (
                        <AlertOctagon className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      Risco {finding.risco}
                    </span>
                  </div>
                  <h5 className="font-editorial text-lg font-bold text-stone-950">
                    {index + 1}. {finding.titulo}
                  </h5>
                </div>

                <div className="flex flex-wrap gap-1 sm:max-w-xs sm:justify-end">
                  {finding.baseLegal.map((norma, nIdx) => (
                    <span
                      key={nIdx}
                      className="text-[10px] font-mono bg-stone-100 border border-stone-300 text-stone-800 px-1.5 py-0.5"
                    >
                      {norma}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-xs font-serif text-stone-800 leading-relaxed">
                <p>
                  <strong className="font-mono uppercase text-[11px] text-stone-950">Fato &amp; Irregularidade: </strong>
                  {finding.fatoIrregularidade}
                </p>

                <ul className="bg-stone-50 border-l-4 border-stone-700 p-3 space-y-1 list-disc list-inside text-stone-700">
                  {finding.detalhesTecnicos.map((detalhe, dIdx) => (
                    <li key={dIdx}>{detalhe}</li>
                  ))}
                </ul>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-red-50 border border-red-300 p-3">
                    <span className="font-mono font-bold text-[10px] uppercase text-red-900 block mb-1">
                      Impacto &amp; Risco Regulatório (WMF)
                    </span>
                    <p className="text-xs text-red-950 leading-relaxed">{finding.riscoRegulatorio}</p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-400 p-3">
                    <span className="font-mono font-bold text-[10px] uppercase text-emerald-900 block mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Resposta no Wiki-Site WazzimaGiygg
                    </span>
                    <p className="text-xs text-emerald-950 leading-relaxed">{finding.respostaWikiSite}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. FONTES PRIMÁRIAS & AÇÕES NO WIKI-SITE */}
      <div className="bg-[#FAF9F5] border-2 border-[#141414] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-300 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-800" />
            <h4 className="font-mono font-bold text-xs uppercase text-stone-950">
              Fontes Oficiais e Documentos Auditados no Relatório
            </h4>
          </div>
          <a
            href={WMF_LGPD_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono font-bold text-blue-800 hover:underline flex items-center gap-1"
          >
            <span>Baixar / Ler PDF Original Completo</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {WMF_INVESTIGATION_SOURCES.map((grupo, gIdx) => (
            <div key={gIdx} className="bg-white border border-stone-300 p-3.5 space-y-2">
              <h5 className="font-mono font-bold text-[11px] uppercase text-stone-900 border-b border-stone-200 pb-1">
                {grupo.grupo}
              </h5>
              <ul className="space-y-1 text-stone-700 font-serif list-disc list-inside">
                {grupo.itens.map((item, iIdx) => (
                  <li key={iIdx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-300 font-mono text-xs">
          <span className="text-stone-700 text-[11px]">
            Quer exercer seus direitos LGPD reais (sem a ilusão do <em>Vanishing</em> da Wikipédia)?
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {onOpenLgpdPanel && (
              <button
                type="button"
                onClick={onOpenLgpdPanel}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 font-bold uppercase text-[11px] border border-black cursor-pointer"
              >
                Abrir Painel LGPD Art. 18 (NotMediaWiki)
              </button>
            )}
            {onOpenTicketForm && (
              <button
                type="button"
                onClick={() => onOpenTicketForm('Direito de Esquecimento (LGPD)')}
                className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 font-bold uppercase text-[11px] border border-black cursor-pointer"
              >
                Protocolar na Ouvidoria BR
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
