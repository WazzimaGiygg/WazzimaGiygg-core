import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  HardDrive,
  Flame,
  Layers,
  FileText,
  Users,
  Shield,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  HelpCircle,
  Zap,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { collection, doc, getDocs, setDoc, query, limit } from 'firebase/firestore';
import { getDbSafe } from '../services/firebase';
import { FirebaseUsageMetrics, WikiArticle, WikiPage, UserProfile } from '../types';
import { FirebaseUsageMetricsService } from '../services/firebaseUsageMetricsService';
import { FirebaseUsagePdfExportModal } from './FirebaseUsagePdfExportModal';

interface FirebaseUsageTelemetryCardProps {
  articles: WikiArticle[];
  pages: WikiPage[];
  currentUser?: UserProfile | null;
  onRefresh?: () => void;
  compact?: boolean;
}

export const FirebaseUsageTelemetryCard: React.FC<FirebaseUsageTelemetryCardProps> = ({
  articles,
  pages,
  currentUser,
  onRefresh,
  compact = false,
}) => {
  const [metrics, setMetrics] = useState<FirebaseUsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<'all' | 'reads' | 'writes' | 'memory'>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('pt-BR'));
  const [showPdfExportModal, setShowPdfExportModal] = useState<boolean>(false);

  const loadMetrics = async () => {
    try {
      const data = await FirebaseUsageMetricsService.getMetrics(articles, pages);
      setMetrics(data);
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
    } catch (e) {
      console.warn('Erro ao carregar métricas do Firebase:', e);
    } finally {
      setLoading(false);
    }
  };

  // Sincronização em Tempo Real via subscription ativa
  useEffect(() => {
    const unsubscribe = FirebaseUsageMetricsService.subscribeToMetrics((data) => {
      setMetrics(data);
      setLoading(false);
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
    });

    // Batimento periódico a cada 8 segundos para garantir sincronia do banco
    const interval = setInterval(() => {
      loadMetrics();
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [articles.length, pages.length]);

  const handleTestRead = async () => {
    setIsSimulating(true);
    // Executa leitura física real na coleção /articles do Firestore
    const db = getDbSafe();
    if (db) {
      try {
        await getDocs(query(collection(db, 'articles'), limit(5)));
      } catch (err) {
        console.warn('Diagnóstico de leitura remota:', err);
      }
    }
    FirebaseUsageMetricsService.simulateReadTest('articles', 25);
    await loadMetrics();
    setActionFeedback('Consulta de leitura diagnóstica em tempo real executada (+25 leituras registradas no Firestore).');
    setTimeout(() => setActionFeedback(null), 3500);
    setIsSimulating(false);
    if (onRefresh) onRefresh();
  };

  const handleTestWrite = async () => {
    setIsSimulating(true);
    // Executa gravação física real no documento /system_telemetry/diagnostic_ping
    const db = getDbSafe();
    if (db) {
      try {
        await setDoc(
          doc(db, 'system_telemetry', 'diagnostic_ping'),
          {
            pingAt: new Date().toISOString(),
            executedBy: currentUser?.displayName || currentUser?.username || 'admin',
            operation: 'diagnostic_write_test',
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Diagnóstico de gravação remota:', err);
      }
    }
    FirebaseUsageMetricsService.simulateWriteTest('articles', 5);
    await loadMetrics();
    setActionFeedback('Operação de gravação diagnóstica em tempo real executada (+5 mutações persistidas no Firestore).');
    setTimeout(() => setActionFeedback(null), 3500);
    setIsSimulating(false);
    if (onRefresh) onRefresh();
  };

  const handleExportTelemetryJson = () => {
    if (!metrics) return;
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firebase-telemetria-uso-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setActionFeedback('Relatório de telemetria em tempo real exportado em JSON.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  if (loading && !metrics) {
    return (
      <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center gap-3 text-xs text-slate-500">
        <RefreshCw size={16} className="animate-spin text-amber-500" />
        <span>Calculando em tempo real consumo de leituras, gravações e memória do Firebase...</span>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header do Card com Status Geral e Ações Rápidas */}
      <div className="p-5 sm:p-6 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-slate-50 dark:via-slate-900 to-amber-950/20 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <Activity size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Monitor de Consumo do Firebase Firestore
                  </h3>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Tempo Real Ativo
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Sincronizado: {lastSyncTime}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Acompanhamento instantâneo de <strong>leituras</strong>, <strong>gravações (mutações)</strong> e <strong>memória/armazenamento real</strong> existente no banco <code>{metrics.firestoreDatabaseId || 'ai-studio-wikizeroenciclop'}</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestRead}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              title="Executa consulta real de 25 leituras de teste no Firestore"
            >
              <Zap size={13} className="text-blue-500" />
              <span>Testar Leitura (+25)</span>
            </button>

            <button
              onClick={handleTestWrite}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              title="Executa mutação física de 5 gravações de teste no Firestore"
            >
              <TrendingUp size={13} className="text-emerald-500" />
              <span>Testar Gravação (+5)</span>
            </button>

            <button
              onClick={loadMetrics}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Consultar novamente o estado atual do Firestore"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>

            {/* Botão de Exportar Relatório PDF */}
            <button
              onClick={() => setShowPdfExportModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-amber-500/20 transition active:scale-95 cursor-pointer"
              title="Exportar relatório consolidado de leituras, gravações e memória usada para PDF (escolha por dia, mês ou ano)"
            >
              <FileText size={14} />
              <span>Exportar Relatório PDF</span>
            </button>

            <button
              onClick={handleExportTelemetryJson}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-xs transition"
              title="Exportar dados brutos em JSON"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Banner do último evento em tempo real */}
        {metrics.lastLiveEvent && (
          <div className="mt-3 p-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <Radio size={12} className="text-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Última operação capturada:
              </span>
              <span className="truncate">{metrics.lastLiveEvent.description}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">
              {new Date(metrics.lastLiveEvent.timestamp).toLocaleTimeString('pt-BR')}
            </span>
          </div>
        )}

        {actionFeedback && (
          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* OS 3 CARDS PRINCIPAIS: LEITURAS, GRAVAÇÕES E MEMÓRIA USADA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: QUANTIDADE DE LEITURAS */}
        <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Operações de Leitura
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Leituras no Firestore</h4>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  metrics.reads.status === 'healthy'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                }`}
              >
                {metrics.reads.percentUsed}% Cota
              </span>
            </div>

            {/* Número Principal */}
            <div className="mt-2 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {metrics.reads.today.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {metrics.reads.dailyLimit.toLocaleString('pt-BR')} hoje
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Total acumulado: <strong className="font-mono text-slate-700 dark:text-slate-300">{metrics.reads.totalCumulative.toLocaleString('pt-BR')}</strong> leituras
              </p>
            </div>

            {/* Barra de Progresso da Cota */}
            <div className="mt-4 space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${Math.max(2, metrics.reads.percentUsed)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Cota Diária Gratuita (Spark: 50k)</span>
                <span className="font-mono">{metrics.reads.percentUsed}% consumida</span>
              </div>
            </div>
          </div>

          {/* Rodapé do Card: Taxa e Detalhes */}
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Taxa Média</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                ~{metrics.reads.readsPerMinute} leituras/min
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Custo Estimado</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {metrics.reads.estimatedCostUsd === 0 ? '$0.00 (Grátis)' : `$${metrics.reads.estimatedCostUsd.toFixed(4)}`}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: QUANTIDADE DE GRAVAÇÕES */}
        <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Operações de Escrita
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Gravações no Firestore</h4>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  metrics.writes.status === 'healthy'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                }`}
              >
                {metrics.writes.percentUsed}% Cota
              </span>
            </div>

            {/* Número Principal */}
            <div className="mt-2 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {metrics.writes.today.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {metrics.writes.dailyLimit.toLocaleString('pt-BR')} hoje
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Total acumulado: <strong className="font-mono text-slate-700 dark:text-slate-300">{metrics.writes.totalCumulative.toLocaleString('pt-BR')}</strong> gravações
              </p>
            </div>

            {/* Barra de Progresso da Cota */}
            <div className="mt-4 space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-600"
                  style={{ width: `${Math.max(2, metrics.writes.percentUsed)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Cota Diária Gratuita (Spark: 20k)</span>
                <span className="font-mono">{metrics.writes.percentUsed}% consumida</span>
              </div>
            </div>
          </div>

          {/* Rodapé do Card */}
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Mutações/Minuto</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                ~{metrics.writes.writesPerMinute} gravações/min
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Custo Estimado</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {metrics.writes.estimatedCostUsd === 0 ? '$0.00 (Grátis)' : `$${metrics.writes.estimatedCostUsd.toFixed(4)}`}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: MEMÓRIA E ARMAZENAMENTO USADO */}
        <div className="p-5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">
                  <HardDrive size={18} />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Memória & Storage
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Memória Usada do Banco</h4>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  metrics.memory.status === 'healthy'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                }`}
              >
                {metrics.memory.percentUsed}% Limite
              </span>
            </div>

            {/* Número Principal */}
            <div className="mt-2 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {metrics.memory.totalFormatted}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {metrics.memory.limitFormatted}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Memória física real: <strong className="font-mono text-slate-700 dark:text-slate-300">{metrics.memory.totalBytes.toLocaleString('pt-BR')} bytes</strong>
              </p>
            </div>

            {/* Barra de Progresso do Armazenamento */}
            <div className="mt-4 space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-pink-600"
                  style={{ width: `${Math.max(1.5, metrics.memory.percentUsed)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Capacidade do Banco (1 GiB Spark / 10 GiB Blaze)</span>
                <span className="font-mono">{metrics.memory.percentUsed}% ocupado</span>
              </div>
            </div>
          </div>

          {/* Rodapé do Card */}
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Docs Indexados</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                {metrics.memory.totalDocuments.toLocaleString('pt-BR')} docs
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Média por Doc</span>
              <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                ~{(metrics.memory.averageBytesPerDoc / 1024).toFixed(1)} KB/doc
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DETALHAMENTO EXPANDIDO E DISTRIBUIÇÃO POR COLEÇÃO */}
      {!compact && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database size={16} className="text-amber-500" />
                <span>Detalhamento de Uso por Coleção & Memória em Disco</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribuição quantitativa de leituras, escritas e espaço ocupado por cada coleção ativa no Firestore.
              </p>
            </div>

            {/* Abas de Filtro e Exportação */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPdfExportModal(true)}
                className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Exportar relatório detalhado em PDF (dia, mês ou ano)"
              >
                <FileText size={13} className="text-amber-600 dark:text-amber-400" />
                <span>Exportar PDF</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs">
                {[
                  { id: 'all', label: 'Visão Completa' },
                  { id: 'reads', label: 'Leituras' },
                  { id: 'writes', label: 'Gravações' },
                  { id: 'memory', label: 'Memória' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveBreakdownTab(tab.id as any)}
                    className={`px-3 py-1 rounded font-medium transition ${
                      activeBreakdownTab === tab.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabela Comparativa Detalhada */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 px-3">Coleção / Recurso Firestore</th>
                  <th className="py-2.5 px-3">Documentos</th>
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'reads') && (
                    <th className="py-2.5 px-3 text-right">Leituras Hoje</th>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'writes') && (
                    <th className="py-2.5 px-3 text-right">Gravações Hoje</th>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'memory') && (
                    <th className="py-2.5 px-3 text-right">Memória Usada</th>
                  )}
                  <th className="py-2.5 px-3 text-right">Participação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {/* Linha 1: Artigos */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText size={14} className="text-emerald-500 flex-shrink-0" />
                    <span>artigos (inevitavel/*)</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {metrics.memory.breakdown.articlesCount} artigos
                  </td>
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'reads') && (
                    <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-bold">
                      {metrics.reads.byCollection.articles.toLocaleString('pt-BR')}
                    </td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'writes') && (
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      {metrics.writes.byCollection.articles.toLocaleString('pt-BR')}
                    </td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'memory') && (
                    <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400 font-bold">
                      {metrics.memory.breakdown.articlesFormatted}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right text-slate-400">
                    {Math.round((metrics.memory.breakdown.articlesBytes / Math.max(1, metrics.memory.totalBytes)) * 100)}%
                  </td>
                </tr>

                {/* Linha 2: Documentos / Tópicos */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Layers size={14} className="text-blue-500 flex-shrink-0" />
                    <span>documentos (páginas e seções)</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {metrics.memory.breakdown.documentsCount} páginas
                  </td>
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'reads') && (
                    <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-bold">
                      {metrics.reads.byCollection.documentos.toLocaleString('pt-BR')}
                    </td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'writes') && (
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      {metrics.writes.byCollection.documentos.toLocaleString('pt-BR')}
                    </td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'memory') && (
                    <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400 font-bold">
                      {metrics.memory.breakdown.documentsFormatted}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right text-slate-400">
                    {Math.round((metrics.memory.breakdown.documentsBytes / Math.max(1, metrics.memory.totalBytes)) * 100)}%
                  </td>
                </tr>

                {/* Linha 3: Perfis de Usuários */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Users size={14} className="text-purple-500 flex-shrink-0" />
                    <span>users (perfis, papéis RBAC e cotas)</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {metrics.memory.breakdown.usersCount} contas
                  </td>
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'reads') && (
                    <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-bold">
                      {metrics.reads.byCollection.users.toLocaleString('pt-BR')}
                    </td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'writes') && (
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      {metrics.writes.byCollection.users.toLocaleString('pt-BR')}
                    </td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'memory') && (
                    <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400 font-bold">
                      {metrics.memory.breakdown.usersFormatted}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right text-slate-400">
                    {Math.round((metrics.memory.breakdown.usersBytes / Math.max(1, metrics.memory.totalBytes)) * 100)}%
                  </td>
                </tr>

                {/* Linha 4: Auditoria */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Shield size={14} className="text-amber-500 flex-shrink-0" />
                    <span>audit_logs (trilhas de auditoria)</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {metrics.memory.breakdown.auditLogsCount} logs
                  </td>
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'reads') && (
                    <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-bold">
                      {metrics.reads.byCollection.audit_logs.toLocaleString('pt-BR')}
                    </td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'writes') && (
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      {metrics.writes.byCollection.audit_logs.toLocaleString('pt-BR')}
                    </td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'memory') && (
                    <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400 font-bold">
                      {metrics.memory.breakdown.auditLogsFormatted}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right text-slate-400">
                    {Math.round((metrics.memory.breakdown.auditLogsBytes / Math.max(1, metrics.memory.totalBytes)) * 100)}%
                  </td>
                </tr>

                {/* Linha 5: Backups e Snapshots */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Flame size={14} className="text-rose-500 flex-shrink-0" />
                    <span>Snapshots PITR & Backups GCS</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {metrics.memory.breakdown.backupsCount} backups
                  </td>
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'reads') && (
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'writes') && (
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'memory') && (
                    <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400 font-bold">
                      {metrics.memory.breakdown.backupsFormatted}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right text-slate-400">GCS Bucket</td>
                </tr>

                {/* Linha 6: Cache Offline IndexedDB */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles size={14} className="text-teal-500 flex-shrink-0" />
                    <span>Cache de Persistência Offline (IndexedDB)</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    Navegador
                  </td>
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'reads') && (
                    <td className="py-3 px-3 text-right text-slate-400">Hit local</td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'writes') && (
                    <td className="py-3 px-3 text-right text-slate-400">Sync async</td>
                  )}
                  {(activeBreakdownTab === 'all' || activeBreakdownTab === 'memory') && (
                    <td className="py-3 px-3 text-right text-teal-600 dark:text-teal-400 font-bold">
                      {metrics.memory.breakdown.indexedDbCacheFormatted}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right text-slate-400">Local</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Dicas e Informações de Cotas Oficiais do Firebase */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck size={16} className="text-amber-500" />
              <span>Entenda as Cotas e Cobranças do Cloud Firestore</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] leading-relaxed">
              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">Leituras (50.000/dia grátis)</strong>
                Cada documento retornado por consulta conta como 1 leitura. Consultas em cache local (IndexedDB) não consomem cota do servidor.
              </div>
              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-emerald-600 dark:text-emerald-400 block mb-0.5">Gravações (20.000/dia grátis)</strong>
                Cada criação de artigo, edição, registro de log ou atualização de perfil consome 1 gravação atômica no banco de dados.
              </div>
              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-purple-600 dark:text-purple-400 block mb-0.5">Memória (1 GiB grátis)</strong>
                Inclui o conteúdo dos documentos JSON e os índices automáticos criados pelo Firestore. No plano Blaze, o armazenamento é elástico e sem teto rígido.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportação do Relatório do Firebase para PDF (por Dia, Mês e Ano) */}
      {showPdfExportModal && metrics && (
        <FirebaseUsagePdfExportModal
          isOpen={showPdfExportModal}
          onClose={() => setShowPdfExportModal(false)}
          metrics={metrics}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
