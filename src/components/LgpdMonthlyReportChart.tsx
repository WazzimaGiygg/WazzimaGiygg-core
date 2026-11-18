/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Monthly LGPD Compliance Visual Report (Recharts)
 * Integrates `deletion_requests` and `tickets` collections inside AdminPanel.
 */

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Layers,
  ShieldAlert,
  TrendingUp,
  XCircle
} from "lucide-react";
import type { DeletionRequest } from "../firebase";

export interface TicketRecord {
  id: string;
  nome?: string;
  email?: string;
  tipo?: string;
  mensagem?: string;
  status?: string;
  criadoEm?: any;
  createdAt?: any;
}

interface LgpdMonthlyReportChartProps {
  deletionRequests: DeletionRequest[];
  tickets: TicketRecord[];
  onSelectDeletionRequest?: (req: DeletionRequest) => void;
  onShowToast?: (msg: string, isError?: boolean) => void;
  compact?: boolean;
}

type CollectionScope = "all" | "deletion_requests" | "tickets";
type RangeWindow = "6m" | "12m" | "active";
type ChartMode = "grouped" | "composed";
type NormalizedBucket = "atendidas" | "pendentes" | "rejeitadas";

interface UnifiedMonthlyItem {
  id: string;
  protocolo: string;
  titular: string;
  email: string;
  source: "deletion_requests" | "tickets";
  rawStatus: string;
  bucket: NormalizedBucket;
  date: Date;
  monthKey: string;
  tipoLabel: string;
  deletionRef?: DeletionRequest;
}

interface MonthlyDataPoint {
  monthKey: string;
  monthLabel: string;
  atendidas: number;
  pendentes: number;
  rejeitadas: number;
  total: number;
  taxaAtendimento: number;
  fromDeletionRequests: number;
  fromTickets: number;
}

const MONTH_ABBR_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez"
];

function parseAnyDate(raw: any): Date {
  if (!raw) return new Date();
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? new Date() : raw;
  if (typeof raw?.toDate === "function") {
    const d = raw.toDate();
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  if (typeof raw === "number") {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  if (typeof raw === "string") {
    const normalized = raw.includes(" ") && !raw.includes("T") ? raw.replace(" ", "T") : raw;
    const d = new Date(normalized);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const idx = Math.max(0, Math.min(11, parseInt(mStr, 10) - 1));
  return `${MONTH_ABBR_PT[idx]}/${yStr.slice(-2)}`;
}

function normalizeStatusBucket(rawStatus?: string): NormalizedBucket {
  const s = String(rawStatus || "").toLowerCase().trim();
  if (
    s === "completed" ||
    s.includes("conclu") ||
    s.includes("resolvid") ||
    s.includes("exclu") ||
    s.includes("atendid") ||
    s.includes("finaliz")
  ) {
    return "atendidas";
  }
  if (
    s === "rejected" ||
    s.includes("indefer") ||
    s.includes("rejeit") ||
    s.includes("negad") ||
    s.includes("recusad")
  ) {
    return "rejeitadas";
  }
  return "pendentes";
}

export default function LgpdMonthlyReportChart({
  deletionRequests,
  tickets,
  onSelectDeletionRequest,
  onShowToast,
  compact = false
}: LgpdMonthlyReportChartProps) {
  const [collectionScope, setCollectionScope] = useState<CollectionScope>("all");
  const [rangeWindow, setRangeWindow] = useState<RangeWindow>("6m");
  const [chartMode, setChartMode] = useState<ChartMode>("grouped");
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  // 1. Unify existing collections (`deletion_requests` and `tickets`)
  const unifiedItems = useMemo<UnifiedMonthlyItem[]>(() => {
    const items: UnifiedMonthlyItem[] = [];

    if (collectionScope === "all" || collectionScope === "deletion_requests") {
      for (const req of deletionRequests) {
        const dt = parseAnyDate(req.requestDate || req.dataSolicitacao);
        items.push({
          id: `del_${req.id}`,
          protocolo: req.protocolo || req.id,
          titular: req.nomeCompleto || req.name || "Titular Anônimo",
          email: req.email || "",
          source: "deletion_requests",
          rawStatus: req.status,
          bucket: normalizeStatusBucket(req.status),
          date: dt,
          monthKey: toMonthKey(dt),
          tipoLabel: req.tipoDado || (req.dataTypes || []).join(", ") || "Exclusão LGPD",
          deletionRef: req
        });
      }
    }

    if (collectionScope === "all" || collectionScope === "tickets") {
      for (const tkt of tickets) {
        const dt = parseAnyDate(tkt.criadoEm || tkt.createdAt);
        items.push({
          id: `tkt_${tkt.id}`,
          protocolo: tkt.id || "TKT",
          titular: tkt.nome || "Solicitante",
          email: tkt.email || "",
          source: "tickets",
          rawStatus: tkt.status || "Aberto",
          bucket: normalizeStatusBucket(tkt.status),
          date: dt,
          monthKey: toMonthKey(dt),
          tipoLabel: tkt.tipo || "Ouvidoria & LGPD"
        });
      }
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [deletionRequests, tickets, collectionScope]);

  // 2. Build monthly time series
  const monthlySeries = useMemo<MonthlyDataPoint[]>(() => {
    const map = new Map<string, MonthlyDataPoint>();

    const ensureBucket = (key: string): MonthlyDataPoint => {
      const existing = map.get(key);
      if (existing) return existing;
      const created: MonthlyDataPoint = {
        monthKey: key,
        monthLabel: formatMonthLabel(key),
        atendidas: 0,
        pendentes: 0,
        rejeitadas: 0,
        total: 0,
        taxaAtendimento: 0,
        fromDeletionRequests: 0,
        fromTickets: 0
      };
      map.set(key, created);
      return created;
    };

    for (const item of unifiedItems) {
      const point = ensureBucket(item.monthKey);
      point[item.bucket] += 1;
      point.total += 1;
      if (item.source === "deletion_requests") {
        point.fromDeletionRequests += 1;
      } else {
        point.fromTickets += 1;
      }
    }

    // Build ordered continuous window if 6m or 12m selected
    if (rangeWindow === "6m" || rangeWindow === "12m") {
      const monthsCount = rangeWindow === "6m" ? 6 : 12;
      const now = new Date();
      let anchor = new Date(now.getFullYear(), now.getMonth(), 1);
      for (const item of unifiedItems) {
        const itemMonth = new Date(item.date.getFullYear(), item.date.getMonth(), 1);
        if (itemMonth.getTime() > anchor.getTime()) {
          anchor = itemMonth;
        }
      }

      const orderedKeys: string[] = [];
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
        const key = toMonthKey(d);
        ensureBucket(key);
        orderedKeys.push(key);
      }

      return orderedKeys.map((k) => {
        const p = map.get(k)!;
        const resolved = p.atendidas + p.rejeitadas;
        p.taxaAtendimento = p.total > 0 ? Math.round((resolved / p.total) * 100) : 0;
        return p;
      });
    }

    // 'active' -> only months containing at least one request, sorted chronologically
    return Array.from(map.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((p) => {
        const resolved = p.atendidas + p.rejeitadas;
        return {
          ...p,
          taxaAtendimento: p.total > 0 ? Math.round((resolved / p.total) * 100) : 0
        };
      });
  }, [unifiedItems, rangeWindow]);

  // 3. Totals across active series
  const totals = useMemo(() => {
    const atendidas = unifiedItems.filter((i) => i.bucket === "atendidas").length;
    const pendentes = unifiedItems.filter((i) => i.bucket === "pendentes").length;
    const rejeitadas = unifiedItems.filter((i) => i.bucket === "rejeitadas").length;
    const total = unifiedItems.length;
    const taxaAtendimento = total > 0 ? Math.round(((atendidas + rejeitadas) / total) * 100) : 0;
    return { atendidas, pendentes, rejeitadas, total, taxaAtendimento };
  }, [unifiedItems]);

  const activeMonthKey = useMemo(() => {
    if (selectedMonthKey && monthlySeries.some((m) => m.monthKey === selectedMonthKey)) {
      return selectedMonthKey;
    }
    const withData = [...monthlySeries].reverse().find((m) => m.total > 0);
    return withData?.monthKey || monthlySeries[monthlySeries.length - 1]?.monthKey || null;
  }, [selectedMonthKey, monthlySeries]);

  const selectedMonthItems = useMemo(() => {
    if (!activeMonthKey) return [];
    return unifiedItems.filter((i) => i.monthKey === activeMonthKey);
  }, [unifiedItems, activeMonthKey]);

  const handleExportCsv = () => {
    const header = "Mes,Atendidas,Pendentes,Rejeitadas,Total,Taxa_Resolucao_%";
    const rows = monthlySeries.map(
      (m) =>
        `${m.monthLabel},${m.atendidas},${m.pendentes},${m.rejeitadas},${m.total},${m.taxaAtendimento}`
    );
    const csvContent = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-mensal-lgpd-${collectionScope}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast?.("✓ Relatório mensal LGPD exportado em CSV.");
  };

  return (
    <div className="bg-white border-2 border-[#141414] p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-5 font-mono text-xs">
      {/* Header */}
      <div className="border-b-2 border-[#141414] pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-[#141414] text-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Relatório Visual Mensal (Recharts)
            </span>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase">
              LGPD Art. 18 &amp; 19 • Prestação de Contas
            </span>
          </div>
          <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#141414]">
            Estatísticas Mensais de Solicitações LGPD
          </h3>
          <p className="text-[11px] text-stone-600 mt-0.5">
            Consolidado mensal de solicitações <strong>atendidas</strong>, <strong>pendentes</strong> e <strong>rejeitadas</strong> integrando as coleções{" "}
            <code className="bg-stone-100 px-1 border border-stone-300">deletion_requests</code> e{" "}
            <code className="bg-stone-100 px-1 border border-stone-300">tickets</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3.5 py-2 bg-[#141414] hover:bg-stone-800 text-white font-bold uppercase text-[10px] tracking-wider inline-flex items-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(20,20,20,0.4)] cursor-pointer shrink-0 self-start lg:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-amber-300" />
          <span>Exportar CSV Mensal</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#FAF9F5] border-2 border-[#141414] p-3.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-stone-500">
            <span>Atendidas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{totals.atendidas}</div>
          <span className="text-[10px] text-stone-600 block mt-0.5">
            {totals.total > 0 ? Math.round((totals.atendidas / totals.total) * 100) : 0}% do total integrado
          </span>
        </div>

        <div className="bg-[#FAF9F5] border-2 border-[#141414] p-3.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-stone-500">
            <span>Pendentes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{totals.pendentes}</div>
          <span className="text-[10px] text-stone-600 block mt-0.5">
            Triagem &amp; em análise ativa
          </span>
        </div>

        <div className="bg-[#FAF9F5] border-2 border-[#141414] p-3.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-stone-500">
            <span>Rejeitadas</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-1">{totals.rejeitadas}</div>
          <span className="text-[10px] text-stone-600 block mt-0.5">
            Indeferimentos fundamentados
          </span>
        </div>

        <div className="bg-[#FAF9F5] border-2 border-[#141414] p-3.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-stone-500">
            <span>Resolução Geral</span>
            <TrendingUp className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{totals.taxaAtendimento}%</div>
          <span className="text-[10px] text-stone-600 block mt-0.5">
            {totals.total} protocolo(s) nas coleções
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-[#FAF9F5] border border-[#141414] p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Collection Scope */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase text-stone-500 mr-1 inline-flex items-center gap-1">
            <Layers className="w-3 h-3" /> Coleções:
          </span>
          {[
            { id: "all" as const, label: `Todas (${deletionRequests.length + tickets.length})` },
            { id: "deletion_requests" as const, label: `Exclusão (${deletionRequests.length})` },
            { id: "tickets" as const, label: `Ouvidoria/Tickets (${tickets.length})` }
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setCollectionScope(opt.id)}
              className={`px-2.5 py-1 border text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                collectionScope === opt.id
                  ? "bg-[#141414] text-amber-300 border-[#141414]"
                  : "bg-white text-stone-700 border-stone-300 hover:border-[#141414]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Range Window */}
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-500 mr-0.5" />
            {[
              { id: "6m" as const, label: "6 Meses" },
              { id: "12m" as const, label: "12 Meses" },
              { id: "active" as const, label: "Com Movimento" }
            ].map((rng) => (
              <button
                key={rng.id}
                type="button"
                onClick={() => setRangeWindow(rng.id)}
                className={`px-2 py-1 border text-[10px] font-bold uppercase cursor-pointer ${
                  rangeWindow === rng.id
                    ? "bg-red-700 text-white border-red-900"
                    : "bg-white text-stone-700 border-stone-300 hover:border-[#141414]"
                }`}
              >
                {rng.label}
              </button>
            ))}
          </div>

          {/* Chart Visualization Mode */}
          <div className="flex items-center gap-1 border-l border-stone-300 pl-3">
            <button
              type="button"
              onClick={() => setChartMode("grouped")}
              className={`px-2.5 py-1 border text-[10px] font-bold uppercase cursor-pointer ${
                chartMode === "grouped"
                  ? "bg-stone-900 text-white border-black"
                  : "bg-white text-stone-700 border-stone-300"
              }`}
            >
              Barras Agrupadas
            </button>
            <button
              type="button"
              onClick={() => setChartMode("composed")}
              className={`px-2.5 py-1 border text-[10px] font-bold uppercase cursor-pointer ${
                chartMode === "composed"
                  ? "bg-stone-900 text-white border-black"
                  : "bg-white text-stone-700 border-stone-300"
              }`}
            >
              Empilhado + Taxa %
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className={`${compact ? "h-64" : "h-80"} w-full border border-stone-300 bg-[#FAF9F5] p-3`}>
        {monthlySeries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-500 gap-2">
            <ShieldAlert className="w-8 h-8 text-stone-400" />
            <span>Nenhum registro mensal disponível para os filtros atuais.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === "grouped" ? (
              <BarChart
                data={monthlySeries}
                margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
                onClick={(state: any) => {
                  const clickedLabel = state?.activeLabel;
                  const match = monthlySeries.find((m) => m.monthLabel === clickedLabel);
                  if (match) setSelectedMonthKey(match.monthKey);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d6d3cd" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fill: "#141414", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}
                  axisLine={{ stroke: "#141414" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#44403c", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#141414" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(217, 119, 6, 0.1)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload as MonthlyDataPoint;
                    return (
                      <div className="bg-[#141414] text-white p-3 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-xs space-y-1">
                        <div className="font-bold text-amber-300 uppercase border-b border-stone-700 pb-1">
                          Mês: {d.monthLabel} ({d.total} total)
                        </div>
                        <div className="flex justify-between gap-4 text-emerald-400 font-bold">
                          <span>Atendidas:</span>
                          <span>{d.atendidas}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-amber-400 font-bold">
                          <span>Pendentes:</span>
                          <span>{d.pendentes}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-red-400 font-bold">
                          <span>Rejeitadas:</span>
                          <span>{d.rejeitadas}</span>
                        </div>
                        <div className="pt-1 border-t border-stone-700 text-[10px] text-stone-300">
                          Exclusão: {d.fromDeletionRequests} • Ouvidoria: {d.fromTickets} • Resolução: {d.taxaAtendimento}%
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontFamily: "monospace", fontSize: "11px", paddingTop: "8px" }}
                />
                <Bar
                  dataKey="atendidas"
                  name="Atendidas"
                  fill="#059669"
                  stroke="#141414"
                  strokeWidth={1.5}
                />
                <Bar
                  dataKey="pendentes"
                  name="Pendentes"
                  fill="#d97706"
                  stroke="#141414"
                  strokeWidth={1.5}
                />
                <Bar
                  dataKey="rejeitadas"
                  name="Rejeitadas"
                  fill="#dc2626"
                  stroke="#141414"
                  strokeWidth={1.5}
                />
              </BarChart>
            ) : (
              <ComposedChart
                data={monthlySeries}
                margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
                onClick={(state: any) => {
                  const clickedLabel = state?.activeLabel;
                  const match = monthlySeries.find((m) => m.monthLabel === clickedLabel);
                  if (match) setSelectedMonthKey(match.monthKey);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d6d3cd" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fill: "#141414", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}
                  axisLine={{ stroke: "#141414" }}
                />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{ fill: "#44403c", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#141414" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fill: "#1d4ed8", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#1d4ed8" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(217, 119, 6, 0.1)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload as MonthlyDataPoint;
                    return (
                      <div className="bg-[#141414] text-white p-3 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-xs space-y-1">
                        <div className="font-bold text-amber-300 uppercase border-b border-stone-700 pb-1">
                          Mês: {d.monthLabel} ({d.total} total)
                        </div>
                        <div className="flex justify-between gap-4 text-emerald-400 font-bold">
                          <span>Atendidas:</span>
                          <span>{d.atendidas}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-amber-400 font-bold">
                          <span>Pendentes:</span>
                          <span>{d.pendentes}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-red-400 font-bold">
                          <span>Rejeitadas:</span>
                          <span>{d.rejeitadas}</span>
                        </div>
                        <div className="pt-1 border-t border-stone-700 text-[10px] text-blue-300 font-bold">
                          Taxa de Resolução: {d.taxaAtendimento}%
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontFamily: "monospace", fontSize: "11px", paddingTop: "8px" }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="atendidas"
                  name="Atendidas"
                  stackId="lgpd"
                  fill="#059669"
                  stroke="#141414"
                  strokeWidth={1}
                />
                <Bar
                  yAxisId="left"
                  dataKey="pendentes"
                  name="Pendentes"
                  stackId="lgpd"
                  fill="#d97706"
                  stroke="#141414"
                  strokeWidth={1}
                />
                <Bar
                  yAxisId="left"
                  dataKey="rejeitadas"
                  name="Rejeitadas"
                  stackId="lgpd"
                  fill="#dc2626"
                  stroke="#141414"
                  strokeWidth={1}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="taxaAtendimento"
                  name="Resolução (%)"
                  stroke="#1d4ed8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 1.5 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Month Drill-Down Selector & Detail List */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase text-stone-700">
            Detalhamento por Mês (selecione um mês):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {monthlySeries.map((m) => (
              <button
                key={m.monthKey}
                type="button"
                onClick={() => setSelectedMonthKey(m.monthKey)}
                className={`px-2 py-1 border text-[10px] font-bold uppercase cursor-pointer ${
                  activeMonthKey === m.monthKey
                    ? "bg-[#141414] text-amber-300 border-[#141414]"
                    : "bg-stone-100 text-stone-700 border-stone-300 hover:border-[#141414]"
                }`}
              >
                {m.monthLabel} ({m.total})
              </button>
            ))}
          </div>
        </div>

        {activeMonthKey && (
          <div className="border-2 border-[#141414] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141414] text-white text-[10px] uppercase tracking-wider">
                  <th className="p-2.5 border-r border-stone-700">Protocolo</th>
                  <th className="p-2.5 border-r border-stone-700">Coleção</th>
                  <th className="p-2.5 border-r border-stone-700">Titular / Solicitante</th>
                  <th className="p-2.5 border-r border-stone-700">Categoria</th>
                  <th className="p-2.5 border-r border-stone-700 text-center">Classificação</th>
                  <th className="p-2.5 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {selectedMonthItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-stone-500">
                      Nenhuma solicitação registrada em {formatMonthLabel(activeMonthKey)}.
                    </td>
                  </tr>
                ) : (
                  selectedMonthItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => item.deletionRef && onSelectDeletionRequest?.(item.deletionRef)}
                      className={
                        item.deletionRef && onSelectDeletionRequest
                          ? "hover:bg-amber-50/70 cursor-pointer"
                          : "hover:bg-stone-50"
                      }
                    >
                      <td className="p-2.5 font-bold text-red-700 border-r border-stone-200 whitespace-nowrap">
                        {item.protocolo}
                      </td>
                      <td className="p-2.5 border-r border-stone-200 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 border text-[9px] font-bold uppercase ${
                            item.source === "deletion_requests"
                              ? "bg-red-50 text-red-900 border-red-300"
                              : "bg-blue-50 text-blue-900 border-blue-300"
                          }`}
                        >
                          {item.source}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-stone-200">
                        <div className="font-bold text-stone-900">{item.titular}</div>
                        <div className="text-[10px] text-stone-500">{item.email}</div>
                      </td>
                      <td className="p-2.5 border-r border-stone-200 text-stone-700">
                        {item.tipoLabel}
                      </td>
                      <td className="p-2.5 border-r border-stone-200 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 border text-[9px] font-bold uppercase ${
                            item.bucket === "atendidas"
                              ? "bg-emerald-100 text-emerald-900 border-emerald-500"
                              : item.bucket === "rejeitadas"
                                ? "bg-red-100 text-red-900 border-red-500"
                                : "bg-amber-100 text-amber-900 border-amber-500"
                          }`}
                        >
                          {item.bucket === "atendidas"
                            ? "Atendida"
                            : item.bucket === "rejeitadas"
                              ? "Rejeitada"
                              : "Pendente"}
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-stone-600 whitespace-nowrap">
                        {item.date.toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
