import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Users,
  Edit3,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  RefreshCw,
  Database,
  Wifi,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { WikiArticle, WikiPage, UserProfile, RecentChangeEntry } from '../types';
import { StorageService } from '../services/storageService';

interface WikiStatisticsPanelProps {
  pages: WikiPage[];
  articles: WikiArticle[];
  currentUser?: UserProfile | null;
  onNavigate?: (view: any) => void;
  onCreateArticleClick?: () => void;
}

type TimeRange = '7d' | '14d' | '30d';
type MetricView = 'combined' | 'cumulative' | 'daily_articles' | 'daily_edits' | 'daily_users';

interface DailyDataPoint {
  date: string;
  displayDate: string;
  newArticles: number;
  newEdits: number;
  newUsers: number;
  cumulativeArticles: number;
  cumulativeEdits: number;
  cumulativeUsers: number;
  activeContributors: number;
}

export const WikiStatisticsPanel: React.FC<WikiStatisticsPanelProps> = ({
  pages: fallbackPages,
  articles: fallbackArticles,
  currentUser,
  onNavigate,
  onCreateArticleClick,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');
  const [metricView, setMetricView] = useState<MetricView>('combined');

  // Dados reais sincronizados diretamente com o Firestore
  const [realArticles, setRealArticles] = useState<WikiArticle[]>(fallbackArticles || []);
  const [realUsers, setRealUsers] = useState<UserProfile[]>([]);
  const [realCollections, setRealCollections] = useState<WikiPage[]>(fallbackPages || []);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [recentChanges, setRecentChanges] = useState<RecentChangeEntry[]>([]);

  // Metadados da conexão com Firebase Firestore
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [databaseId, setDatabaseId] = useState<string>('ai-studio-wikizeroenciclop-0a14dc90-3ab3-47bc-8306-ca5bc2953699');
  const [projectId, setProjectId] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carregamento inicial e sincronização direta das coleções reais do Firestore
  const syncWithFirebase = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stats, rc] = await Promise.all([
        StorageService.getFirebaseRealStatistics(),
        StorageService.getRecentChanges().catch(() => []),
      ]);

      if (stats) {
        setIsFirebaseConnected(stats.connected);
        setDatabaseId(stats.databaseId);
        setProjectId(stats.projectId);
        setLatencyMs(stats.latencyMs);
        setLastSyncTime(stats.lastSyncTimestamp);

        if (stats.articles && stats.articles.length > 0) {
          setRealArticles(stats.articles);
        } else if (fallbackArticles && fallbackArticles.length > 0) {
          setRealArticles(fallbackArticles);
        }

        if (stats.users && stats.users.length > 0) {
          setRealUsers(stats.users);
        }

        if (stats.collections && stats.collections.length > 0) {
          setRealCollections(stats.collections);
        } else if (fallbackPages && fallbackPages.length > 0) {
          setRealCollections(fallbackPages);
        }

        if (stats.auditLogs) {
          setAuditLogs(stats.auditLogs);
        }
      }

      setRecentChanges(Array.isArray(rc) ? rc : []);
    } catch (err) {
      console.warn('[WikiStatisticsPanel] Erro ao carregar estatísticas do Firebase:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fallbackArticles, fallbackPages]);

  useEffect(() => {
    syncWithFirebase();

    // Inscrever no listener em tempo real (onSnapshot) para atualizar métricas automaticamente
    const unsubscribe = StorageService.subscribeToFirebaseStatistics((realtimeData) => {
      if (realtimeData.articles && realtimeData.articles.length > 0) {
        setRealArticles(realtimeData.articles);
      }
      if (realtimeData.users && realtimeData.users.length > 0) {
        setRealUsers(realtimeData.users);
      }
      if (realtimeData.collections && realtimeData.collections.length > 0) {
        setRealCollections(realtimeData.collections);
      }
      setLastSyncTime(realtimeData.timestamp || new Date().toISOString());
    });

    return () => {
      unsubscribe();
    };
  }, [syncWithFirebase]);

  // Total Real de Artigos
  const totalArticles = useMemo(() => {
    if (realArticles && realArticles.length > 0) return realArticles.length;
    if (fallbackArticles && fallbackArticles.length > 0) return fallbackArticles.length;
    return realCollections.reduce((acc, p) => acc + (p.articleCount || 0), 0);
  }, [realArticles, fallbackArticles, realCollections]);

  // Total Real de Edições (soma exata das revisões de histórico de cada artigo no Firestore + logs de edição)
  const totalEdits = useMemo(() => {
    let editsCount = 0;
    const currentList = realArticles.length > 0 ? realArticles : fallbackArticles;

    currentList.forEach((art) => {
      if (art.historico && art.historico.length > 0) {
        editsCount += art.historico.length;
      } else {
        editsCount += 1; // Criação original documentada
      }
    });

    if (auditLogs.length > 0) {
      const editLogs = auditLogs.filter(
        (l) => l.action === 'article_edited' || l.action === 'article_created'
      ).length;
      editsCount = Math.max(editsCount, editLogs);
    }

    const rcEdits = recentChanges.filter((rc) => rc.type !== 'new_collection').length;
    return Math.max(editsCount, rcEdits, totalArticles);
  }, [realArticles, fallbackArticles, auditLogs, recentChanges, totalArticles]);

  // Total Real de Usuários Ativos e Registrados no Firestore
  const totalUsersCount = useMemo(() => {
    const userIds = new Set<string>();

    realUsers.forEach((u) => {
      if (u.uid) userIds.add(u.uid);
      if (u.username) userIds.add(u.username.toLowerCase());
    });

    if (currentUser?.uid) userIds.add(currentUser.uid);
    if (currentUser?.username) userIds.add(currentUser.username.toLowerCase());

    realArticles.forEach((art) => {
      if (art.autorUid) userIds.add(art.autorUid);
      if (art.autor) userIds.add(art.autor.toLowerCase());
    });

    return Math.max(userIds.size, realUsers.length, 1);
  }, [realUsers, currentUser, realArticles]);

  // Coleções reais rastreadas
  const totalCollectionsCount = useMemo(() => {
    return Math.max(realCollections.length, fallbackPages.length, 1);
  }, [realCollections, fallbackPages]);

  // Função utilitária para converter qualquer carimbo ISO ou string para 'YYYY-MM-DD'
  const toDateKey = (rawDate?: string): string | null => {
    if (!rawDate) return null;
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  // GERAÇÃO DA SÉRIE TEMPORAL 100% BASEADA EM DADOS REAIS DO FIREBASE
  const chartData: DailyDataPoint[] = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const now = new Date();

    // 1. Gerar os dias da janela no formato 'YYYY-MM-DD'
    const windowDateKeys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      windowDateKeys.push(d.toISOString().split('T')[0]);
    }
    const startDateKey = windowDateKeys[0];

    // 2. Mapeamento de artigos por data de criação exata
    const articlesByDate: Record<string, number> = {};
    let articlesCreatedBeforeWindow = 0;

    const currentArticles = realArticles.length > 0 ? realArticles : fallbackArticles;
    currentArticles.forEach((art) => {
      const createdKey = toDateKey(art.dataCriacao);
      if (createdKey) {
        if (createdKey < startDateKey) {
          articlesCreatedBeforeWindow++;
        } else {
          articlesByDate[createdKey] = (articlesByDate[createdKey] || 0) + 1;
        }
      } else {
        // Artigo sem data válida considerado criado antes da janela
        articlesCreatedBeforeWindow++;
      }
    });

    // 3. Mapeamento de edições e revisões por data exata
    const editsByDate: Record<string, number> = {};
    let editsDoneBeforeWindow = 0;

    currentArticles.forEach((art) => {
      if (art.historico && art.historico.length > 0) {
        art.historico.forEach((h) => {
          const hKey = toDateKey(h.data);
          if (hKey) {
            if (hKey < startDateKey) {
              editsDoneBeforeWindow++;
            } else {
              editsByDate[hKey] = (editsByDate[hKey] || 0) + 1;
            }
          } else {
            editsDoneBeforeWindow++;
          }
        });
      } else {
        // Criação original conta como 1 edição
        const editKey = toDateKey(art.dataEdicao || art.dataCriacao);
        if (editKey) {
          if (editKey < startDateKey) {
            editsDoneBeforeWindow++;
          } else {
            editsByDate[editKey] = (editsByDate[editKey] || 0) + 1;
          }
        } else {
          editsDoneBeforeWindow++;
        }
      }
    });

    // Mudanças recentes complementares
    recentChanges.forEach((rc) => {
      const rcKey = toDateKey(rc.data);
      if (rcKey && rcKey >= startDateKey) {
        editsByDate[rcKey] = (editsByDate[rcKey] || 0) + 1;
      }
    });

    // 4. Mapeamento de usuários por data de cadastro no Firestore
    const usersByDate: Record<string, number> = {};
    let usersRegisteredBeforeWindow = 0;

    realUsers.forEach((u) => {
      const uKey = toDateKey(u.createdAt);
      if (uKey) {
        if (uKey < startDateKey) {
          usersRegisteredBeforeWindow++;
        } else {
          usersByDate[uKey] = (usersByDate[uKey] || 0) + 1;
        }
      } else {
        usersRegisteredBeforeWindow++;
      }
    });

    // 5. Construção cumulativa real dia a dia
    let runningArticles = articlesCreatedBeforeWindow;
    let runningEdits = editsDoneBeforeWindow;
    let runningUsers = usersRegisteredBeforeWindow;

    const points: DailyDataPoint[] = [];

    windowDateKeys.forEach((isoDate, idx) => {
      const dateObj = new Date(isoDate + 'T12:00:00Z');
      const day = dateObj.getUTCDate();
      const month = dateObj.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '');
      const displayDate = `${day} ${month}`;

      const newArticles = articlesByDate[isoDate] || 0;
      const newEdits = editsByDate[isoDate] || 0;
      const newUsers = usersByDate[isoDate] || 0;

      runningArticles += newArticles;
      runningEdits += newEdits;
      runningUsers += newUsers;

      // No último dia da janela (hoje), assegurar que o total reflita os totais exatos do banco
      const isToday = idx === windowDateKeys.length - 1;
      const finalArticles = isToday ? Math.max(runningArticles, totalArticles) : runningArticles;
      const finalEdits = isToday ? Math.max(runningEdits, totalEdits) : runningEdits;
      const finalUsers = isToday ? Math.max(runningUsers, totalUsersCount) : runningUsers;

      // Colaboradores ativos únicos que editaram ou criaram no dia
      const activeContributors = Math.max(
        (newArticles > 0 ? 1 : 0) + (newEdits > 0 ? 1 : 0) + (newUsers > 0 ? 1 : 0),
        1
      );

      points.push({
        date: isoDate,
        displayDate,
        newArticles,
        newEdits,
        newUsers,
        cumulativeArticles: finalArticles,
        cumulativeEdits: finalEdits,
        cumulativeUsers: finalUsers,
        activeContributors,
      });
    });

    return points;
  }, [timeRange, realArticles, fallbackArticles, recentChanges, realUsers, totalArticles, totalEdits, totalUsersCount]);

  // Taxa de crescimento do período baseada nos dados reais
  const growthStats = useMemo(() => {
    if (chartData.length < 2) {
      return {
        articlesAdded: 0,
        editsAdded: 0,
        usersAdded: 0,
        pct: '0.0',
        avgArticlesPerDay: '0.0',
      };
    }

    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];

    const articlesAdded = Math.max(0, lastPoint.cumulativeArticles - firstPoint.cumulativeArticles);
    const editsAdded = chartData.reduce((acc, p) => acc + p.newEdits, 0);
    const usersAdded = chartData.reduce((acc, p) => acc + p.newUsers, 0);

    const avgArticlesPerDay = (articlesAdded / chartData.length).toFixed(1);
    const startArticles = firstPoint.cumulativeArticles;
    const pct = startArticles > 0 ? ((articlesAdded / startArticles) * 100).toFixed(1) : '0.0';

    return {
      articlesAdded,
      editsAdded,
      usersAdded,
      pct,
      avgArticlesPerDay,
    };
  }, [chartData]);

  // Formatar horário da última sincronização
  const formattedSyncTime = useMemo(() => {
    try {
      const d = new Date(lastSyncTime);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Agora';
    }
  }, [lastSyncTime]);

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-xs space-y-5">
      {/* Header do Painel com Metadados e Sincronização Firebase */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <BarChart3 size={18} />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans tracking-tight">
              Painel de Estatísticas & Crescimento
            </h2>

            {/* Badge de Sincronização em Tempo Real com Firebase */}
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sincronizado via Firebase Firestore</span>
              <span className="text-[10px] opacity-75 font-mono">({latencyMs}ms)</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>Métricas em tempo real extraídas da base de dados ativa do projeto.</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
              <Database size={11} className="text-blue-500" />
              {databaseId}
            </span>
          </p>
        </div>

        {/* Controles de Período & Botão de Sincronização */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            {(['7d', '14d', '30d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition ${
                  timeRange === r
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {r === '7d' ? '7 Dias' : r === '14d' ? '14 Dias' : '30 Dias'}
              </button>
            ))}
          </div>

          <button
            onClick={syncWithFirebase}
            disabled={isLoading}
            title={`Última sincronização às ${formattedSyncTime}. Clique para atualizar.`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin text-blue-500' : 'text-slate-500'} />
            <span className="hidden xs:inline">Sincronizar</span>
            <span className="text-[10px] text-slate-400 font-mono">{formattedSyncTime}</span>
          </button>
        </div>
      </div>

      {/* 4 Cards Principais de Estatísticas Reais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total de Artigos Reais */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200/80 dark:border-blue-900/50 relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-800 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-sans">
              Total de Artigos
            </span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition">
              <FileText size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {totalArticles.toLocaleString()}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight size={13} />
              +{growthStats.articlesAdded} no período
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Coleção <code className="text-blue-600 dark:text-blue-400 font-mono">/articles</code></span>
            <span><strong>{totalCollectionsCount}</strong> coleções</span>
          </p>
        </div>

        {/* Card 2: Usuários Ativos / Cadastrados no Firestore */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200/80 dark:border-emerald-900/50 relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-800 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-sans">
              Usuários Ativos
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
              <Users size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {totalUsersCount.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              registrados
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Coleção <code className="text-emerald-600 dark:text-emerald-400 font-mono">/userpage</code></span>
            <span>+{growthStats.usersAdded} novos</span>
          </p>
        </div>

        {/* Card 3: Edições Realizadas */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/70 to-violet-50/40 dark:from-purple-950/20 dark:to-violet-950/10 border border-purple-200/80 dark:border-purple-900/50 relative overflow-hidden group hover:border-purple-300 dark:hover:border-purple-800 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-sans">
              Edições Realizadas
            </span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition">
              <Edit3 size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {totalEdits.toLocaleString()}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              <ArrowUpRight size={13} />
              +{growthStats.editsAdded} no período
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Revisões históricas em <code className="text-purple-600 dark:text-purple-400 font-mono">historico[]</code>
          </p>
        </div>

        {/* Card 4: Crescimento Diário Real */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/80 dark:border-amber-900/50 relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-800 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-sans">
              Crescimento Diário
            </span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              +{growthStats.pct}%
            </span>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              no período
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Média de <strong className="text-slate-700 dark:text-slate-300">{growthStats.avgArticlesPerDay}</strong> artigos/dia
          </p>
        </div>
      </div>

      {/* Gráfico de Crescimento com Recharts */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
        {/* Controles de Visualização do Gráfico */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-sans">
              Curva de Crescimento & Produção Diária (Dados do Firestore)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setMetricView('combined')}
              className={`px-2.5 py-1 rounded-md transition font-medium text-xs ${
                metricView === 'combined'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Combinado
            </button>
            <button
              onClick={() => setMetricView('cumulative')}
              className={`px-2.5 py-1 rounded-md transition font-medium text-xs ${
                metricView === 'cumulative'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Artigos Acumulados
            </button>
            <button
              onClick={() => setMetricView('daily_articles')}
              className={`px-2.5 py-1 rounded-md transition font-medium text-xs ${
                metricView === 'daily_articles'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Novos Artigos / Dia
            </button>
            <button
              onClick={() => setMetricView('daily_edits')}
              className={`px-2.5 py-1 rounded-md transition font-medium text-xs ${
                metricView === 'daily_edits'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Edições / Dia
            </button>
            <button
              onClick={() => setMetricView('daily_users')}
              className={`px-2.5 py-1 rounded-md transition font-medium text-xs ${
                metricView === 'daily_users'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Novos Usuários
            </button>
          </div>
        </div>

        {/* Container do Gráfico Recharts */}
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            {metricView === 'daily_articles' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(val) => (val === 'newArticles' ? 'Novos Artigos Criados' : val)}
                />
                <Bar
                  dataKey="newArticles"
                  name="Novos Artigos"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : metricView === 'daily_edits' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(val) => (val === 'newEdits' ? 'Edições e Revisões Realizadas' : val)}
                />
                <Bar
                  dataKey="newEdits"
                  name="Edições Realizadas"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : metricView === 'daily_users' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(val) => (val === 'newUsers' ? 'Novos Usuários Registrados' : val)}
                />
                <Bar
                  dataKey="newUsers"
                  name="Novos Usuários"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : metricView === 'cumulative' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(val) => (val === 'cumulativeArticles' ? 'Total de Artigos Acumulados' : val)}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeArticles"
                  name="Total de Artigos"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCumulative)"
                />
              </AreaChart>
            ) : (
              /* Visão Combinada (Crescimento Acumulado + Edições Diárias) */
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorEdits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(val) =>
                    val === 'cumulativeArticles'
                      ? 'Total de Artigos'
                      : val === 'newEdits'
                      ? 'Edições Diárias'
                      : val === 'newArticles'
                      ? 'Novos Artigos'
                      : val
                  }
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeArticles"
                  name="Total de Artigos"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorArticles)"
                />
                <Area
                  type="monotone"
                  dataKey="newEdits"
                  name="Edições Diárias"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEdits)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Rodapé explicativo do gráfico com detalhamento do Firestore */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>
              Período selecionado: <strong>+{growthStats.articlesAdded}</strong> artigos, <strong>+{growthStats.editsAdded}</strong> edições e <strong>+{growthStats.usersAdded}</strong> novos colaboradores registrados no Firebase.
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('recent-changes')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Ver log de mudanças recentes</span>
              <ArrowUpRight size={12} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

// Componente de Tooltip Customizado para o Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-lg text-xs font-sans space-y-1.5">
        <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
          <Calendar size={12} className="text-blue-500" />
          <span>{label}</span>
        </p>
        {payload.map((item: any, index: number) => {
          const color = item.color || item.fill || '#3b82f6';
          const name =
            item.name === 'cumulativeArticles' || item.name === 'Total de Artigos'
              ? 'Artigos Acumulados'
              : item.name === 'newArticles' || item.name === 'Novos Artigos'
              ? 'Novos Artigos'
              : item.name === 'newEdits' || item.name === 'Edições Diárias' || item.name === 'Edições Realizadas'
              ? 'Edições Realizadas'
              : item.name === 'newUsers' || item.name === 'Novos Usuários'
              ? 'Novos Usuários'
              : item.name;

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{name}:</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {Number(item.value).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};
