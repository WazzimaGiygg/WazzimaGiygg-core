import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Clock,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  Building2,
  FileText,
  UserCheck,
  AlertCircle,
  Scale,
} from 'lucide-react';
import { ResearchEthicsCommitteeInfo } from '../types/ethics';

interface ResearchEthicsBadgeProps {
  info?: ResearchEthicsCommitteeInfo | null;
  variant?: 'badge' | 'card' | 'seal' | 'banner';
  className?: string;
  showExplanation?: boolean;
}

export const ResearchEthicsBadge: React.FC<ResearchEthicsBadgeProps> = ({
  info,
  variant = 'badge',
  className = '',
  showExplanation = false,
}) => {
  const [copiedCaae, setCopiedCaae] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  if (!info || (!info.envolveSeresHumanos && info.statusEtica === 'nao_se_aplica')) {
    return null;
  }

  const handleCopyCaae = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!info.numeroCaae) return;
    navigator.clipboard.writeText(info.numeroCaae);
    setCopiedCaae(true);
    setTimeout(() => setCopiedCaae(false), 2000);
  };

  const getStatusConfig = () => {
    switch (info.statusEtica) {
      case 'aprovado':
        return {
          label: 'Aprovado pelo Comitê de Ética (CEP/CONEP)',
          shortLabel: 'Aprovado CEP/CONEP',
          bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          sealColor: 'emerald',
          icon: ShieldCheck,
          description: 'Projeto apreciado e aprovado com parecer consubstanciado favorável por Comitê de Ética em Pesquisa com Seres Humanos.',
        };
      case 'dispensado':
        return {
          label: 'Dispensado de Avaliação Ética (Resolução CNS nº 510/2016)',
          shortLabel: 'Isento / Dispensado de CEP',
          bgClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700/60',
          badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-800',
          sealColor: 'sky',
          icon: FileCheck,
          description: 'Isento ou dispensado de apreciação ética com base na regulamentação do Conselho Nacional de Saúde (dados de domínio público ou sem identificação).',
        };
      case 'em_tramitacao':
        return {
          label: 'Em Tramitação na Plataforma Brasil',
          shortLabel: 'Em Análise no CEP',
          bgClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          sealColor: 'amber',
          icon: Clock,
          description: 'Protocolado e em processo de análise ética colegiada junto ao Comitê de Ética em Pesquisa.',
        };
      default:
        return {
          label: 'Não se aplica (Sem participantes humanos)',
          shortLabel: 'Sem participantes humanos',
          bgClass: 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          sealColor: 'slate',
          icon: HelpCircle,
          description: 'Trabalho de natureza teórica, conceitual, bibliográfica ou documental que não envolve seres humanos.',
        };
    }
  };

  const status = getStatusConfig();
  const IconComponent = status.icon;

  // 1. Compact Badge (utilizado em listas, cabeçalhos compactos e cards)
  if (variant === 'badge') {
    return (
      <span
        onClick={() => setShowDetailsModal(true)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer hover:opacity-90 transition shadow-2xs ${status.badgeClass} ${className}`}
        title={`${status.label}${info.numeroCaae ? ` • CAAE: ${info.numeroCaae}` : ''} - Clique para ver detalhes éticos`}
      >
        <IconComponent size={12} className="shrink-0" />
        <span className="truncate max-w-[200px]">{status.shortLabel}</span>
        {info.numeroCaae && (
          <span className="font-mono text-[9px] opacity-75 hidden sm:inline">
            CAAE {info.numeroCaae.slice(0, 8)}...
          </span>
        )}
      </span>
    );
  }

  // 2. Banner ou Selo Institucional (utilizado no topo de artigos e teses)
  return (
    <>
      <div
        className={`rounded-xl border p-4 sm:p-4.5 my-3 shadow-xs transition ${status.bgClass} ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/70 dark:bg-black/30 shadow-2xs shrink-0 mt-0.5">
              <IconComponent size={20} className="shrink-0 text-current" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-current/10 text-current border border-current/20">
                  Comitê de Ética em Pesquisa (CEP / CONEP)
                </span>
                <span className="text-xs font-bold text-current flex items-center gap-1">
                  <CheckCircle2 size={12} /> {status.label}
                </span>
              </div>

              <p className="text-xs opacity-90 leading-relaxed">
                {info.nomeComite ? (
                  <span>
                    Apreciação institucional:{' '}
                    <strong>{info.nomeComite}</strong>
                    {info.instituicaoProponente ? ` (${info.instituicaoProponente})` : ''}.
                  </span>
                ) : (
                  <span>{status.description}</span>
                )}
              </p>

              {/* Informações Regulamentares e Metadados do CEP */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1.5 text-[11px] font-mono opacity-90">
                {info.numeroCaae && (
                  <div className="flex items-center gap-1">
                    <span className="opacity-70">CAAE:</span>
                    <strong className="tracking-wide">{info.numeroCaae}</strong>
                    <button
                      type="button"
                      onClick={handleCopyCaae}
                      title="Copiar CAAE da Plataforma Brasil"
                      className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition cursor-pointer"
                    >
                      {copiedCaae ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                )}

                {info.numeroParecer && (
                  <div className="flex items-center gap-1">
                    <span className="opacity-70">Parecer:</span>
                    <strong>{info.numeroParecer}</strong>
                  </div>
                )}

                {info.dataAprovacao && (
                  <div className="flex items-center gap-1">
                    <span className="opacity-70">Aprovação:</span>
                    <span>{info.dataAprovacao}</span>
                  </div>
                )}

                {info.temTcle !== undefined && (
                  <div className="flex items-center gap-1 font-sans">
                    <UserCheck size={12} className="shrink-0 text-current" />
                    <span>
                      {info.temTcle ? 'TCLE Obtido dos Participantes' : 'Dispensa Justificada de TCLE'}
                    </span>
                  </div>
                )}

                {info.resolucaoRegulamentadora && (
                  <div className="flex items-center gap-1 font-sans text-[10px] opacity-80">
                    <Scale size={11} className="shrink-0" />
                    <span>{info.resolucaoRegulamentadora}</span>
                  </div>
                )}
              </div>

              {info.justificativaOuObservacoes && (
                <p className="text-[11px] italic opacity-80 pt-1 border-t border-current/15 mt-2">
                  " {info.justificativaOuObservacoes} "
                </p>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-current/15">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/60 dark:bg-black/40 text-current border border-current/20">
              {info.envolveSeresHumanos ? 'Pesquisa com Seres Humanos' : 'Estudo Teórico / Documental'}
            </span>

            <a
              href="https://plataformabrasil.saude.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-current/80 hover:text-current underline inline-flex items-center gap-1"
            >
              <span>Plataforma Brasil</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* Modal detalhado de conformidade com ética em pesquisa */}
      {showDetailsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Comitê de Ética em Pesquisa (CEP / CONEP)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Apreciação ética e salvaguarda de voluntários humanos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Situação Ética:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{status.label}</span>
                </div>
                {info.nomeComite && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Comitê Institucional:</span>
                    <span className="font-bold text-right">{info.nomeComite}</span>
                  </div>
                )}
                {info.numeroCaae && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">CAAE (Plataforma Brasil):</span>
                    <span className="font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {info.numeroCaae}
                    </span>
                  </div>
                )}
                {info.numeroParecer && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Parecer Consubstanciado:</span>
                    <span className="font-mono font-bold">{info.numeroParecer}</span>
                  </div>
                )}
                {info.dataAprovacao && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Data de Aprovação:</span>
                    <span>{info.dataAprovacao}</span>
                  </div>
                )}
                {info.temTcle !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Consentimento (TCLE/TALE):</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {info.temTcle ? 'Sim, obtido conforme regulamentação' : 'Dispensa formal devidamente concedida'}
                    </span>
                  </div>
                )}
                {info.resolucaoRegulamentadora && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Normativa CNS:</span>
                    <span>{info.resolucaoRegulamentadora}</span>
                  </div>
                )}
              </div>

              {info.justificativaOuObservacoes && (
                <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                  <p className="font-bold text-blue-900 dark:text-blue-300 mb-1">
                    Garantias de Proteção e Sigilo:
                  </p>
                  <p className="italic text-slate-700 dark:text-slate-300">
                    {info.justificativaOuObservacoes}
                  </p>
                </div>
              )}

              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <strong>Nota Bioética:</strong> O Sistema CEP/CONEP (Conselho Nacional de Saúde / Ministério da Saúde do Brasil) e as diretrizes internacionais (Declaração de Helsinque) asseguram a dignidade, sigilo, autonomia e proteção aos participantes voluntários em investigações científicas.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
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
