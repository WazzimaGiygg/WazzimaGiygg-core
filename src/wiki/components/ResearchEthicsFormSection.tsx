import React, { useState } from 'react';
import {
  ShieldCheck,
  HelpCircle,
  FileCheck,
  Clock,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import {
  ResearchEthicsCommitteeInfo,
  EthicsApprovalStatus,
  CNS_RESOLUTIONS,
} from '../types/ethics';

interface ResearchEthicsFormSectionProps {
  value?: ResearchEthicsCommitteeInfo;
  onChange: (val: ResearchEthicsCommitteeInfo) => void;
  contextTitle?: string; // ex: "Artigo", "Trabalho Acadêmico", "Livro"
  className?: string;
  defaultExpanded?: boolean;
}

export const ResearchEthicsFormSection: React.FC<ResearchEthicsFormSectionProps> = ({
  value,
  onChange,
  contextTitle = 'Publicação',
  className = '',
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showHelper, setShowHelper] = useState(false);

  const current: ResearchEthicsCommitteeInfo = value || {
    envolveSeresHumanos: false,
    statusEtica: 'nao_se_aplica',
    nomeComite: '',
    numeroParecer: '',
    numeroCaae: '',
    instituicaoProponente: '',
    dataAprovacao: '',
    temTcle: true,
    resolucaoRegulamentadora: 'Resolução CNS nº 466/2012',
    justificativaOuObservacoes: '',
  };

  const updateField = <K extends keyof ResearchEthicsCommitteeInfo>(
    field: K,
    val: ResearchEthicsCommitteeInfo[K]
  ) => {
    const updated: ResearchEthicsCommitteeInfo = {
      ...current,
      [field]: val,
    };

    // Ajustes automáticos inteligentes
    if (field === 'envolveSeresHumanos') {
      if (val === true && updated.statusEtica === 'nao_se_aplica') {
        updated.statusEtica = 'aprovado';
      } else if (val === false) {
        updated.statusEtica = 'nao_se_aplica';
      }
    } else if (field === 'statusEtica') {
      if (val === 'nao_se_aplica') {
        updated.envolveSeresHumanos = false;
      } else {
        updated.envolveSeresHumanos = true;
      }
    }

    onChange(updated);
  };

  const CEP_EXEMPLOS = [
    'CEP/USP - Universidade de São Paulo',
    'CEP/Unicamp - Universidade Estadual de Campinas',
    'CEP/Fiocruz - Fundação Oswaldo Cruz',
    'CEP/UNIFESP - Universidade Federal de São Paulo',
    'CEP/UFRJ - Universidade Federal do Rio de Janeiro',
    'CONEP - Comissão Nacional de Ética em Pesquisa',
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs transition-all overflow-hidden ${className}`}
    >
      {/* Header do Bloco do Comitê de Ética */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-slate-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Comitê de Ética em Pesquisa com Seres Humanos
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                  CEP / CONEP / Plataforma Brasil
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Conformidade bioética e regulatória para {contextTitle.toLowerCase()}s envolvendo voluntários, entrevistas ou dados humanos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setShowHelper(!showHelper)}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1 font-semibold transition px-2 py-1 rounded-lg hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50 cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>Orientações Éticas</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {isExpanded ? 'Recolher' : 'Expandir'}
            </button>
          </div>
        </div>
      </div>

      {/* Caixa de Orientação e Ajuda rápida */}
      {showHelper && (
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Quando é obrigatória a aprovação pelo CEP / CONEP?
              </p>
              <p className="mt-1 leading-relaxed">
                Toda pesquisa científica envolvendo direta ou indiretamente seres humanos (participantes, questionários com identificação, entrevistas orais, intervenções clínicas, prontuários ou amostras biológicas) deve ser submetida e aprovada via <strong>Plataforma Brasil</strong> conforme a <strong>Resolução CNS nº 466/2012</strong> (saúde e biomédicas) ou <strong>Resolução CNS nº 510/2016</strong> (ciências humanas e sociais).
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  • <strong>CAAE:</strong> Certificado de 16 dígitos emitido na Plataforma Brasil (ex: 12345621.8.0000.5404).
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  • <strong>TCLE:</strong> Termo de Consentimento Livre e Esclarecido indispensável para voluntários.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulário Principal */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* Pergunta Chave: Envolve Seres Humanos? */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Esta publicação / trabalho envolveu pesquisa com seres humanos?</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Marque "Sim" se utilizou dados de participantes, entrevistas, pesquisas de campo, ensaios clínicos ou questionários.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => updateField('envolveSeresHumanos', true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  current.envolveSeresHumanos
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 size={13} />
                <span>Sim, envolve</span>
              </button>
              <button
                type="button"
                onClick={() => updateField('envolveSeresHumanos', false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  !current.envolveSeresHumanos
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Não se aplica</span>
              </button>
            </div>
          </div>

          {current.envolveSeresHumanos && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
              {/* Status do Comitê de Ética */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Situação Ética Perante o CEP / CONEP <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'aprovado' as EthicsApprovalStatus,
                      label: 'Aprovado pelo CEP/CONEP',
                      desc: 'Possui Parecer Consubstanciado Favorável',
                      icon: ShieldCheck,
                      color: 'emerald',
                    },
                    {
                      id: 'dispensado' as EthicsApprovalStatus,
                      label: 'Isento / Dispensado',
                      desc: 'Conforme Res. CNS nº 510/2016',
                      icon: FileCheck,
                      color: 'sky',
                    },
                    {
                      id: 'em_tramitacao' as EthicsApprovalStatus,
                      label: 'Em Tramitação',
                      desc: 'Protocolado na Plataforma Brasil',
                      icon: Clock,
                      color: 'amber',
                    },
                  ].map((st) => {
                    const isSelected = current.statusEtica === st.id;
                    const Icon = st.icon;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => updateField('statusEtica', st.id)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={16} className={isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                          <span className="text-xs font-bold">{st.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{st.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campos do CEP: Nome do Comitê e Instituição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Comitê de Ética em Pesquisa (CEP)
                  </label>
                  <input
                    type="text"
                    value={current.nomeComite || ''}
                    onChange={(e) => updateField('nomeComite', e.target.value)}
                    placeholder="Ex: CEP/FMUSP ou CEP da Universidade de São Paulo"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {CEP_EXEMPLOS.slice(0, 3).map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => updateField('nomeComite', ex)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition"
                      >
                        + {ex.split(' - ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Instituição Proponente / Vinculada
                  </label>
                  <input
                    type="text"
                    value={current.instituicaoProponente || ''}
                    onChange={(e) => updateField('instituicaoProponente', e.target.value)}
                    placeholder="Ex: Universidade de São Paulo (USP), UNICAMP, etc."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* CAAE, Número do Parecer e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Número do CAAE (Plataforma Brasil)
                  </label>
                  <input
                    type="text"
                    value={current.numeroCaae || ''}
                    onChange={(e) => updateField('numeroCaae', e.target.value)}
                    placeholder="Ex: 54321021.4.0000.5404"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Certificado de 16 dígitos
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Número do Parecer Consubstanciado
                  </label>
                  <input
                    type="text"
                    value={current.numeroParecer || ''}
                    onChange={(e) => updateField('numeroParecer', e.target.value)}
                    placeholder="Ex: 5.842.119 ou Parecer nº 123/2024"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Aprovação do Parecer
                  </label>
                  <input
                    type="date"
                    value={current.dataAprovacao || ''}
                    onChange={(e) => updateField('dataAprovacao', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Resolução Regulamentadora & TCLE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resolução Regulamentadora (CNS)
                  </label>
                  <select
                    value={current.resolucaoRegulamentadora || 'Resolução CNS nº 466/2012'}
                    onChange={(e) => updateField('resolucaoRegulamentadora', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {CNS_RESOLUTIONS.map((res) => (
                      <option key={res.id} value={res.label}>
                        {res.label}
                      </option>
                    ))}
                    <option value="Diretrizes Internacionais (Declaração de Helsinque / CIOMS / Belmont Report)">
                      Diretrizes Internacionais (Helsinque / CIOMS)
                    </option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="relative flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer w-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <input
                      type="checkbox"
                      checked={!!current.temTcle}
                      onChange={(e) => updateField('temTcle', e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Termo de Consentimento (TCLE / TALE)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Declaro que o consentimento livre e esclarecido dos participantes foi colhido ou que a dispensa foi formalmente concedida pelo CEP.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Justificativa / Medidas de Proteção */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Medidas de Proteção aos Voluntários e Anonimização
                </label>
                <textarea
                  rows={2}
                  value={current.justificativaOuObservacoes || ''}
                  onChange={(e) => updateField('justificativaOuObservacoes', e.target.value)}
                  placeholder="Ex: Todos os dados foram anonimizados conforme LGPD; não há riscos físicos ou morais aos participantes; o sigilo foi integralmente preservado."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
