/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Administrative Deletion Requests Dashboard (LGPD solicitacaodeexlusao)
 * Real-time metrics and Recharts Pie Chart visualization for open deletion tickets.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Filter,
  PieChart as PieIcon,
  Activity,
  AlertTriangle,
  UserCheck,
  Search,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import {
  DeletionRequest,
  setupDeletionRequestsListener,
  listDeletionRequests,
  AUTHORIZED_BUROCRATA_EMAIL
} from '../firebase';

interface DeletionRequestsDashboardProps {
  requests?: DeletionRequest[];
  onSelectRequest?: (req: DeletionRequest) => void;
  currentUserEmail?: string;
  className?: string;
}

// Neo-brutalist accessible color palette matching WazzimaGiygg
const PIE_COLORS = [
  '#dc2626', // Red
  '#d97706', // Amber
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#059669', // Emerald
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#be185d'  // Pink
];

export default function DeletionRequestsDashboard({
  requests: propRequests,
  onSelectRequest,
  currentUserEmail,
  className = ''
}: DeletionRequestsDashboardProps) {
  const [requestsList, setRequestsList] = useState<DeletionRequest[]>(propRequests || []);
  const [isLoading, setIsLoading] = useState<boolean>(!propRequests);
  const [statusFilter, setStatusFilter] = useState<'all_open' | 'pending' | 'processing' | 'all'>('all_open');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isRealTimeConnected, setIsRealTimeConnected] = useState<boolean>(true);

  // Bind real-time listener from Firestore
  useEffect(() => {
    if (propRequests && propRequests.length > 0) {
      setRequestsList(propRequests);
      setLastSyncTime(new Date());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = setupDeletionRequestsListener((freshRequests) => {
      setRequestsList(freshRequests);
      setLastSyncTime(new Date());
      setIsLoading(false);
      setIsRealTimeConnected(true);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [propRequests]);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      const fresh = await listDeletionRequests();
      setRequestsList(fresh);
      setLastSyncTime(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Overall Metrics
  const metrics = useMemo(() => {
    const total = requestsList.length;
    const pending = requestsList.filter(r => r.status === 'pending').length;
    const processing = requestsList.filter(r => r.status === 'processing').length;
    const completed = requestsList.filter(r => r.status === 'completed').length;
    const rejected = requestsList.filter(r => r.status === 'rejected').length;
    const openTotal = pending + processing;

    const resolutionRate = total > 0 ? Math.round(((completed + rejected) / total) * 100) : 0;

    // SLA analysis (LGPD requires response within 15 days, Art. 19)
    const now = Date.now();
    let urgentTicketsCount = 0;
    requestsList.forEach(r => {
      if (r.status === 'pending' || r.status === 'processing') {
        const reqDate = new Date(r.requestDate || r.dataSolicitacao).getTime();
        const daysElapsed = Math.floor((now - reqDate) / (1000 * 60 * 60 * 24));
        if (daysElapsed >= 10) {
          urgentTicketsCount++;
        }
      }
    });

    return {
      total,
      pending,
      processing,
      completed,
      rejected,
      openTotal,
      resolutionRate,
      urgentTicketsCount
    };
  }, [requestsList]);

  // 2. Open Requests Distribution by Type (for Recharts PieChart)
  const openRequests = useMemo(() => {
    if (statusFilter === 'pending') {
      return requestsList.filter(r => r.status === 'pending');
    }
    if (statusFilter === 'processing') {
      return requestsList.filter(r => r.status === 'processing');
    }
    if (statusFilter === 'all') {
      return requestsList;
    }
    // Default: 'all_open' (pending + processing)
    return requestsList.filter(r => r.status === 'pending' || r.status === 'processing');
  }, [requestsList, statusFilter]);

  // Normalization of Request Types (tipoDado / dataTypes)
  const pieChartData = useMemo(() => {
    const countMap = new Map<string, number>();

    openRequests.forEach(req => {
      let rawType = req.tipoDado || (Array.isArray(req.dataTypes) ? req.dataTypes.join(', ') : 'Expurgo Geral');
      // Normalize common synonyms
      let normalized = rawType.trim();
      if (!normalized) normalized = 'Expurgo Geral';
      if (/conta|login|senha|perfil/i.test(normalized)) {
        normalized = 'Contas & Credenciais';
      } else if (/coment|post|public/i.test(normalized)) {
        normalized = 'Comentários & Conteúdo';
      } else if (/histor|naveg|ip|log/i.test(normalized)) {
        normalized = 'Histórico & Logs';
      } else if (/cpf|rg|contato|telefone/i.test(normalized)) {
        normalized = 'Dados Cadastrais & CPF';
      } else if (/acervo|artigo|wiki/i.test(normalized)) {
        normalized = 'Acervo Acadêmico & Wiki';
      } else if (/geral|tudo|integral|total/i.test(normalized)) {
        normalized = 'Expurgo Integral (Total)';
      }

      countMap.set(normalized, (countMap.get(normalized) || 0) + 1);
    });

    const totalOpen = openRequests.length;
    const data = Array.from(countMap.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: totalOpen > 0 ? Math.round((value / totalOpen) * 100) : 0
    }));

    // Sort descending
    return data.sort((a, b) => b.value - a.value);
  }, [openRequests]);

  // Filtered requests list for the operational quick-view
  const filteredList = useMemo(() => {
    return openRequests.filter(req => {
      const matchSearch =
        !searchQuery ||
        req.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.protocolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.tipoDado && req.tipoDado.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        !selectedCategory ||
        (req.tipoDado && req.tipoDado.toLowerCase().includes(selectedCategory.toLowerCase()));

      return matchSearch && matchCategory;
    });
  }, [openRequests, searchQuery, selectedCategory]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Bar with Real-Time Connectivity Badge */}
      <div className="bg-[#141414] text-white p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-red-700 text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Dashboard Administrativo LGPD
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Firestore Real-Time Ativo
            </span>
          </div>
          <h2 className="font-editorial text-2xl font-bold mt-1 text-white">
            Estatísticas em Tempo Real • Tickets de Exclusão
          </h2>
          <p className="text-xs font-mono text-stone-300 mt-1">
            Visualização de métricas e distribuição volumétrica de solicitações abertas via Recharts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
            Sincronizado: {lastSyncTime.toLocaleTimeString('pt-BR')}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 bg-stone-100 hover:bg-white text-stone-900 border-2 border-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-60"
            title="Sincronizar com Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Total Abertos */}
        <div className="bg-white border-2 border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex items-center justify-between text-stone-500 font-bold text-[10px] uppercase">
            <span>Solicitações Abertas</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold mt-1 text-stone-900">{metrics.openTotal}</div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-stone-600 border-t border-stone-200 pt-1">
            <span>{metrics.pending} pendentes</span>
            <span>{metrics.processing} em análise</span>
          </div>
        </div>

        {/* Taxa de Resolução */}
        <div className="bg-white border-2 border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex items-center justify-between text-stone-500 font-bold text-[10px] uppercase">
            <span>Taxa de Resolução</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold mt-1 text-emerald-700">{metrics.resolutionRate}%</div>
          <div className="mt-1 text-[10px] text-stone-600 border-t border-stone-200 pt-1">
            {metrics.completed} concluídos • {metrics.rejected} indeferidos
          </div>
        </div>

        {/* Cumprimento Legal LGPD */}
        <div className="bg-white border-2 border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex items-center justify-between text-stone-500 font-bold text-[10px] uppercase">
            <span>Prazo Legal (Art. 19 LGPD)</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold mt-1 text-stone-900">15 dias</div>
          <div className="mt-1 text-[10px] text-stone-600 border-t border-stone-200 pt-1">
            {metrics.urgentTicketsCount > 0 ? (
              <span className="text-red-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {metrics.urgentTicketsCount} ticket(s) ≥ 10 dias
              </span>
            ) : (
              <span className="text-emerald-700 font-bold">✓ Todos dentro do prazo legal</span>
            )}
          </div>
        </div>

        {/* Total Acumulado */}
        <div className="bg-white border-2 border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex items-center justify-between text-stone-500 font-bold text-[10px] uppercase">
            <span>Volume Histórico</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-bold mt-1 text-stone-900">{metrics.total}</div>
          <div className="mt-1 text-[10px] text-stone-600 border-t border-stone-200 pt-1">
            Registros na coleção Firestore
          </div>
        </div>
      </div>

      {/* 3. Recharts Pie Chart & Type Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Recharts Pie Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white border-2 border-[#141414] p-5 shadow-[5px_5px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-stone-200 gap-2">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-red-700" />
                <h3 className="font-editorial text-lg font-bold text-stone-950">
                  Distribuição dos Tipos de Solicitações Abertas
                </h3>
              </div>

              {/* Status Filter for Pie Chart */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className="text-stone-500 font-bold mr-1">Filtro:</span>
                <button
                  onClick={() => setStatusFilter('all_open')}
                  className={`px-2 py-0.5 border ${
                    statusFilter === 'all_open'
                      ? 'bg-stone-900 text-white font-bold border-black'
                      : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                  }`}
                >
                  Abertas ({metrics.openTotal})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2 py-0.5 border ${
                    statusFilter === 'pending'
                      ? 'bg-amber-600 text-white font-bold border-amber-800'
                      : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                  }`}
                >
                  Triagem ({metrics.pending})
                </button>
                <button
                  onClick={() => setStatusFilter('processing')}
                  className={`px-2 py-0.5 border ${
                    statusFilter === 'processing'
                      ? 'bg-blue-600 text-white font-bold border-blue-800'
                      : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                  }`}
                >
                  Análise ({metrics.processing})
                </button>
              </div>
            </div>

            <p className="text-[11px] font-mono text-stone-600 mt-2">
              Visualização categórica das demandas de exclusão de dados ativos sob a Lei 13.709/2018.
            </p>

            {/* Pie Chart Canvas with Recharts */}
            <div className="h-72 w-full mt-4 flex items-center justify-center">
              {pieChartData.length === 0 ? (
                <div className="text-center font-mono text-xs text-stone-500 p-8 border border-dashed border-stone-300 w-full">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold">Nenhuma solicitação aberta no filtro selecionado.</p>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Todos os pedidos foram atendidos ou não há pendências na fila.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={((props: any) => {
                        const pct = props.percentage ?? (props.percent ? Math.round(props.percent * 100) : 0);
                        if (pct < 8) return null;
                        const RADIAN = Math.PI / 180;
                        const mid = props.midAngle ?? 0;
                        const inR = Number(props.innerRadius) || 55;
                        const outR = Number(props.outerRadius) || 95;
                        const radius = inR + (outR - inR) * 0.5;
                        const x = (Number(props.cx) || 0) + radius * Math.cos(-mid * RADIAN);
                        const y = (Number(props.cy) || 0) + radius * Math.sin(-mid * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#ffffff"
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="font-mono text-[11px] font-bold"
                          >
                            {`${pct}%`}
                          </text>
                        );
                      }) as any}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          stroke="#141414"
                          strokeWidth={2}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedCategory(selectedCategory === entry.name ? null : entry.name)}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#141414] text-white p-2.5 border-2 border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-mono text-xs">
                              <p className="font-bold text-amber-400 uppercase text-[10px]">{data.name}</p>
                              <p className="text-sm font-bold mt-0.5">
                                {data.value} {data.value === 1 ? 'solicitação' : 'solicitações'} ({data.percentage}%)
                              </p>
                              <span className="text-[9px] text-stone-400 block mt-1">
                                Clique para filtrar os chamados abaixo
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconType="rect"
                      iconSize={10}
                      wrapperStyle={{
                        paddingTop: '16px',
                        fontFamily: 'monospace',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 mt-2 flex items-center justify-between text-[11px] font-mono text-stone-500">
            <span>Fonte de dados: Firestore (`deletion_requests`)</span>
            <span className="font-bold text-stone-800">
              {openRequests.length} chamado(s) em aberto analisado(s)
            </span>
          </div>
        </div>

        {/* Right: Categorical Breakdown & SLA Urgency (5 Cols) */}
        <div className="lg:col-span-5 bg-white border-2 border-[#141414] p-5 shadow-[5px_5px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-200">
              <h3 className="font-editorial text-lg font-bold text-stone-950 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-700" />
                <span>Detalhamento Volumétrico</span>
              </h3>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-[10px] font-mono font-bold text-red-700 hover:underline"
                >
                  ✕ Limpar Filtro
                </button>
              )}
            </div>

            <p className="text-[11px] font-mono text-stone-600 mt-2">
              Contagem e proporção por tipo de expurgo de dados:
            </p>

            <div className="mt-3 space-y-2 font-mono text-xs">
              {pieChartData.map((item, idx) => {
                const color = PIE_COLORS[idx % PIE_COLORS.length];
                const isSelected = selectedCategory === item.name;

                return (
                  <div
                    key={item.name}
                    onClick={() => setSelectedCategory(isSelected ? null : item.name)}
                    className={`p-2.5 border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-black bg-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'border-stone-200 hover:border-stone-400 bg-[#FAF9F5]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 shrink-0 border border-black"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-bold text-stone-900">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{item.value}</span>
                      <span className="bg-stone-200 text-stone-700 text-[10px] px-1.5 py-0.2 font-bold">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}

              {pieChartData.length === 0 && (
                <div className="text-center py-6 text-stone-400 text-xs">
                  Nenhum dado disponível.
                </div>
              )}
            </div>
          </div>

          {/* Legal Compliance Box */}
          <div className="mt-4 p-3 bg-stone-100 border border-stone-300 font-mono text-[11px] space-y-1">
            <span className="font-bold text-stone-900 uppercase block text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Conformidade com Marco Civil & LGPD
            </span>
            <p className="text-stone-700 leading-relaxed">
              O Burocrata deve manter registro comprobatório da exclusão por 6 meses para eventuais requisições judiciais (Art. 15 Marco Civil da Internet).
            </p>
          </div>
        </div>
      </div>

      {/* 4. Live Filtered Queue Table */}
      <div className="bg-white border-2 border-[#141414] p-5 shadow-[5px_5px_0px_0px_rgba(20,20,20,1)] space-y-4 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-stone-200">
          <div>
            <h3 className="font-editorial text-lg font-bold text-stone-950 flex items-center gap-2">
              <FileText className="w-5 h-5 text-stone-800" />
              <span>Fila Operacional de Tickets ({filteredList.length})</span>
            </h3>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Chamados correspondentes ao filtro ativo no gráfico de pizza.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por protocolo, nome..."
                className="pl-8 pr-2 py-1 bg-stone-50 border border-stone-300 text-xs w-56 focus:outline-none focus:border-stone-600"
              />
            </div>
          </div>
        </div>

        {/* Table of Open Tickets */}
        <div className="overflow-x-auto border border-stone-300">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141414] text-white text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="p-2.5">Protocolo</th>
                <th className="p-2.5">Titular</th>
                <th className="p-2.5">Tipo de Dado</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Data de Entrada</th>
                <th className="p-2.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredList.map((req) => {
                const reqDate = new Date(req.requestDate || req.dataSolicitacao);
                const daysElapsed = Math.floor((Date.now() - reqDate.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysElapsed >= 10;

                return (
                  <tr
                    key={req.id}
                    className="hover:bg-amber-50/60 transition-colors cursor-pointer"
                    onClick={() => onSelectRequest && onSelectRequest(req)}
                  >
                    <td className="p-2.5 font-bold text-red-700 whitespace-nowrap">
                      {req.protocolo}
                    </td>
                    <td className="p-2.5 font-bold text-stone-900">
                      <div>{req.nomeCompleto}</div>
                      <div className="text-[10px] text-stone-500 font-normal">{req.email}</div>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 bg-stone-100 border border-stone-300 text-stone-800 text-[10px] font-bold">
                        {req.tipoDado || 'Expurgo Geral'}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                          req.status === 'pending'
                            ? 'bg-amber-100 text-amber-900 border border-amber-500'
                            : req.status === 'processing'
                            ? 'bg-blue-100 text-blue-900 border border-blue-500'
                            : req.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-500'
                            : 'bg-red-100 text-red-900 border border-red-500'
                        }`}
                      >
                        {req.status === 'pending'
                          ? 'Triagem'
                          : req.status === 'processing'
                          ? 'Em Análise'
                          : req.status === 'completed'
                          ? 'Concluído'
                          : 'Indeferido'}
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-600 whitespace-nowrap">
                      <div>{reqDate.toLocaleDateString('pt-BR')}</div>
                      <div className={`text-[10px] font-bold ${isUrgent ? 'text-red-700' : 'text-stone-500'}`}>
                        {daysElapsed === 0 ? 'Hoje' : `${daysElapsed} dia(s) atrás`}
                        {isUrgent && ' ⚠️'}
                      </div>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectRequest) onSelectRequest(req);
                        }}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white font-bold text-[10px] uppercase cursor-pointer"
                      >
                        Examinar ➔
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    Nenhum ticket encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
