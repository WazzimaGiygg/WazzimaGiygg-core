import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  HardDrive,
  BarChart3,
  TrendingUp,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Database,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { FirebaseUsageMetrics, UserProfile } from '../types';
import {
  ReportPeriodType,
  FirebaseUsagePdfOptions,
  computePeriodMetrics,
  generateFirebaseUsagePdf,
} from '../utils/firebaseUsagePdfExport';

interface FirebaseUsagePdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: FirebaseUsageMetrics;
  currentUser?: UserProfile | null;
}

export const FirebaseUsagePdfExportModal: React.FC<FirebaseUsagePdfExportModalProps> = ({
  isOpen,
  onClose,
  metrics,
  currentUser,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  const [periodType, setPeriodType] = useState<ReportPeriodType>('day');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum);

  const [includeCollectionBreakdown, setIncludeCollectionBreakdown] = useState<boolean>(true);
  const [includeMemoryAnalysis, setIncludeMemoryAnalysis] = useState<boolean>(true);
  const [includeCostAudit, setIncludeCostAudit] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOptions: FirebaseUsagePdfOptions = {
    periodType,
    selectedDate,
    selectedMonth,
    selectedYear,
    includeCollectionBreakdown,
    includeMemoryAnalysis,
    includeCostAudit,
    generatedBy: currentUser?.displayName || currentUser?.username || 'Administrador',
  };

  const previewComputed = computePeriodMetrics(metrics, currentOptions);

  const handleExportPdf = async () => {
    setIsGenerating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await generateFirebaseUsagePdf(metrics, currentOptions);
      setSuccessMessage('Relatório em PDF gerado e baixado com sucesso!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Erro ao gerar relatório em PDF do Firebase:', err);
      setErrorMessage('Ocorreu um erro ao processar o relatório em PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportJson = () => {
    const payload = {
      tipoRelatorio: periodType,
      periodo: previewComputed.periodLabel,
      dataGeracao: new Date().toISOString(),
      geradoPor: currentOptions.generatedBy,
      bancoFirestore: {
        databaseId: metrics.firestoreDatabaseId,
        projectId: metrics.projectId,
        plano: metrics.plan,
      },
      metricasApuradas: previewComputed,
      telemetriaBruta: metrics,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firebase-telemetria-${periodType}-${selectedDate || selectedYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccessMessage('Dados brutos exportados em JSON com sucesso.');
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Exportar Relatório do Firebase para PDF</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                  Cloud Firestore
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere um relatório executivo com leituras, gravações e memória usada filtrado por período.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
            title="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* 1. SELEÇÃO DO PERÍODO: DIA, MÊS OU ANO */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar size={14} className="text-amber-500" />
              <span>1. Escolha o Período do Relatório</span>
            </label>

            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setPeriodType('day')}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                  periodType === 'day'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Por Dia (Diário)</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('month')}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                  periodType === 'month'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Por Mês (Mensal)</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('year')}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                  periodType === 'year'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Por Ano (Anual)</span>
              </button>
            </div>

            {/* Controles de Data Conforme o Período Escolhido */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
              {periodType === 'day' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Selecione o Dia de Referência:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayStr)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Selecionar Hoje ({todayStr.split('-').reverse().join('/')})
                    </button>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    O relatório contabilizará as leituras, gravações e a memória exata consumida no dia selecionado contra a cota diária de 50.000 leituras (Spark) ou 500.000 (Blaze).
                  </p>
                </div>
              )}

              {periodType === 'month' && (
                <div className="space-y-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Selecione o Mês e Ano de Referência:
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Mês:</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                      >
                        <option value={1}>Janeiro</option>
                        <option value={2}>Fevereiro</option>
                        <option value={3}>Março</option>
                        <option value={4}>Abril</option>
                        <option value={5}>Maio</option>
                        <option value={6}>Junho</option>
                        <option value={7}>Julho</option>
                        <option value={8}>Agosto</option>
                        <option value={9}>Setembro</option>
                        <option value={10}>Outubro</option>
                        <option value={11}>Novembro</option>
                        <option value={12}>Dezembro</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Ano:</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-mono"
                      >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Consolida o consumo mensal do Firestore, projetando a cota mensal (~1.500.000 leituras no Spark), mutações e custo de faturamento em USD.
                  </p>
                </div>
              )}

              {periodType === 'year' && (
                <div className="space-y-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Selecione o Ano Fiscal / Exercício:
                  </span>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                    >
                      <option value={2024}>Ano de 2024</option>
                      <option value={2025}>Ano de 2025</option>
                      <option value={2026}>Ano de 2026</option>
                      <option value={2027}>Ano de 2027</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gera o balanço anual consolidado do banco de dados, analisando crescimento cumulativo de memória em disco e consumo anual de cotas do Google Cloud.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. PRÉ-VISUALIZAÇÃO DOS DADOS APURADOS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <BarChart3 size={14} className="text-amber-500" />
                <span>2. Pré-Visualização das Métricas no Período</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">{previewComputed.periodLabel}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Leituras */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block uppercase">
                  Leituras
                </span>
                <span className="text-lg font-mono font-black text-slate-900 dark:text-white block mt-0.5">
                  {previewComputed.readsCount.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                  {previewComputed.readsPercent}% da cota
                </span>
              </div>

              {/* Gravações */}
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block uppercase">
                  Gravações
                </span>
                <span className="text-lg font-mono font-black text-slate-900 dark:text-white block mt-0.5">
                  {previewComputed.writesCount.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  {previewComputed.writesPercent}% da cota
                </span>
              </div>

              {/* Memória Usada */}
              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block uppercase">
                  Memória Usada
                </span>
                <span className="text-lg font-mono font-black text-slate-900 dark:text-white block mt-0.5">
                  {previewComputed.memoryFormatted}
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                  {previewComputed.totalDocuments} docs indexados
                </span>
              </div>
            </div>

            {/* Tabela de Distribuição no Período (Horário / Semanal / Trimestral) */}
            {previewComputed.temporalBreakdown && previewComputed.temporalBreakdown.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {periodType === 'day'
                      ? 'Distribuição Horária do Dia'
                      : periodType === 'month'
                      ? 'Evolução Semanal do Mês'
                      : 'Evolução Trimestral do Ano'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Detalhamento dinâmico</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                        <th className="py-1 px-1.5">Intervalo</th>
                        <th className="py-1 px-1.5 text-right">Leituras</th>
                        <th className="py-1 px-1.5 text-right">Gravações</th>
                        <th className="py-1 px-1.5 text-right">Memória</th>
                        <th className="py-1 px-1.5 text-right">Fração</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {previewComputed.temporalBreakdown.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
                          <td className="py-1 px-1.5 font-sans font-medium text-slate-700 dark:text-slate-300">
                            {row.periodSegment}
                          </td>
                          <td className="py-1 px-1.5 text-right text-blue-600 dark:text-blue-400 font-bold">
                            {row.reads.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-1 px-1.5 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                            {row.writes.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-1 px-1.5 text-right text-purple-600 dark:text-purple-400">
                            {row.memoryEstimate}
                          </td>
                          <td className="py-1 px-1.5 text-right text-slate-500">
                            {row.trafficShare}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 3. SEÇÕES OPCIONAIS DO RELATÓRIO */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
              3. Opções & Conteúdo do Documento PDF
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeCollectionBreakdown}
                  onChange={(e) => setIncludeCollectionBreakdown(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Tabela por Coleção</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeMemoryAnalysis}
                  onChange={(e) => setIncludeMemoryAnalysis(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Análise de Memória</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeCostAudit}
                  onChange={(e) => setIncludeCostAudit(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Auditoria de Custos</span>
              </label>
            </div>
          </div>

          {/* Mensagens de Sucesso ou Erro */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Rodapé com Ações de Download */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            disabled={isGenerating}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            title="Baixar dados em formato JSON para auditoria técnica"
          >
            <Download size={14} />
            <span>Exportar Dados (JSON)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FileText size={15} />
                  <span>Baixar Relatório em PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
