/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Simplified LGPD Art. 18 Deletion Requests Panel inside NotMediaWiki
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  FileCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
  Scale,
  Database,
  Filter
} from 'lucide-react';
import {
  DeletionRequest,
  setupDeletionRequestsListener,
  listDeletionRequests,
  updateDeletionRequestStatus,
  AUTHORIZED_BUROCRATA_EMAIL,
  isAuthorizedBurocrata
} from '../../firebase';

interface NotMediaWikiLgpdDeletionPanelProps {
  currentUser: any;
  isBureaucrat: boolean;
  showToast: (msg: string, isError?: boolean) => void;
}

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'rejected';

const STATUS_META: Record<
  DeletionRequest['status'],
  { label: string; badgeClass: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: 'Pendente',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-500',
    Icon: Clock
  },
  processing: {
    label: 'Em Análise',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-500',
    Icon: RefreshCw
  },
  completed: {
    label: 'Concluído',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-500',
    Icon: CheckCircle2
  },
  rejected: {
    label: 'Indeferido',
    badgeClass: 'bg-red-100 text-red-900 border-red-500',
    Icon: XCircle
  }
};

export default function NotMediaWikiLgpdDeletionPanel({
  currentUser,
  isBureaucrat,
  showToast
}: NotMediaWikiLgpdDeletionPanelProps) {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dataTypeFilter, setDataTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});

  const canProcess = isBureaucrat || isAuthorizedBurocrata(currentUser?.email);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = setupDeletionRequestsListener((data) => {
      setRequests(data);
      setIsLoading(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const fresh = await listDeletionRequests();
      setRequests(fresh);
      showToast('Lista de solicitações LGPD Art. 18 sincronizada.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableDataTypes = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((req) => {
      if (Array.isArray(req.dataTypes) && req.dataTypes.length > 0) {
        req.dataTypes.forEach((dt) => {
          if (dt.trim()) set.add(dt.trim());
        });
      } else if (req.tipoDado) {
        req.tipoDado
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((dt) => set.add(dt));
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [requests]);

  const counts = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      processing: requests.filter((r) => r.status === 'processing').length,
      completed: requests.filter((r) => r.status === 'completed').length,
      rejected: requests.filter((r) => r.status === 'rejected').length
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;

      if (dataTypeFilter !== 'all') {
        const typesText = [
          ...(req.dataTypes || []),
          req.tipoDado || ''
        ]
          .join(' ')
          .toLowerCase();
        if (!typesText.includes(dataTypeFilter.toLowerCase())) return false;
      }

      if (!q) return true;
      const haystack = [
        req.protocolo,
        req.id,
        req.nomeCompleto,
        req.name,
        req.email,
        req.motivo,
        req.reason,
        req.tipoDado,
        ...(req.dataTypes || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [requests, statusFilter, dataTypeFilter, searchQuery]);

  const handleStatusChange = async (
    req: DeletionRequest,
    nextStatus: DeletionRequest['status']
  ) => {
    if (!canProcess) {
      showToast(
        `Acesso restrito ao Burocrata credenciado (${AUTHORIZED_BUROCRATA_EMAIL}).`,
        true
      );
      return;
    }

    setProcessingId(req.id);
    try {
      const notes =
        actionNotes[req.id]?.trim() ||
        req.observacoes ||
        (nextStatus === 'completed'
          ? 'Exclusão executada conforme LGPD Art. 18 via painel simplificado NotMediaWiki.'
          : nextStatus === 'rejected'
          ? 'Indeferimento fundamentado no Art. 16 da LGPD / Art. 15 do Marco Civil.'
          : 'Triagem iniciada no painel simplificado NotMediaWiki.');

      const certId =
        nextStatus === 'completed'
          ? `LGPD-CERT-${Math.floor(100000 + Math.random() * 900000)}`
          : undefined;

      await updateDeletionRequestStatus(
        req.id,
        nextStatus,
        notes,
        currentUser?.email || AUTHORIZED_BUROCRATA_EMAIL,
        certId
      );

      setConfirmCompleteId(null);
      showToast(
        nextStatus === 'completed'
          ? `✓ Protocolo ${req.protocolo} concluído! Certificado: ${certId}`
          : nextStatus === 'processing'
          ? `Protocolo ${req.protocolo} colocado em análise.`
          : `Protocolo ${req.protocolo} indeferido.`
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-[#FAF9F5] border-2 border-[#141414] p-5 shadow-[5px_5px_0px_0px_rgba(20,20,20,1)] space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="border-b-2 border-[#141414] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-red-700 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> LGPD Art. 18
            </span>
            <span className="bg-stone-900 text-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase inline-flex items-center gap-1">
              <Database className="w-3 h-3" /> Painel Simplificado NotMediaWiki
            </span>
          </div>
          <h4 className="font-editorial text-xl font-bold text-stone-950">
            Solicitações de Exclusão de Dados (Titulares &amp; DPO)
          </h4>
          <p className="text-[11px] text-stone-600 mt-0.5">
            Listagem e filtragem integrada com o painel administrativo principal e registros de{' '}
            <code className="bg-stone-200 px-1 text-stone-900">solicitacaodeexlusao</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-900 border-2 border-[#141414] font-bold uppercase text-[10px] inline-flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] cursor-pointer shrink-0 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar Lista</span>
        </button>
      </div>

      {/* Compact Metric Strip (clickable quick status filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { id: 'all' as const, label: 'Total', value: counts.total, tone: 'text-stone-950' },
          { id: 'pending' as const, label: 'Pendentes', value: counts.pending, tone: 'text-amber-700' },
          { id: 'processing' as const, label: 'Em Análise', value: counts.processing, tone: 'text-blue-700' },
          { id: 'completed' as const, label: 'Concluídos', value: counts.completed, tone: 'text-emerald-700' },
          { id: 'rejected' as const, label: 'Indeferidos', value: counts.rejected, tone: 'text-red-700' }
        ].map((card) => {
          const active = statusFilter === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setStatusFilter(card.id)}
              className={`p-2.5 text-left border-2 transition-all cursor-pointer ${
                active
                  ? 'bg-white border-[#141414] shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]'
                  : 'bg-white/70 border-stone-300 hover:border-stone-500'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                {card.label}
              </span>
              <span className={`text-xl font-bold ${card.tone}`}>{card.value}</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border-2 border-[#141414] p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por protocolo (LGPD-REQ-...), titular, e-mail ou motivo..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F5] border border-stone-400 focus:border-[#141414] focus:outline-none text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={dataTypeFilter}
              onChange={(e) => setDataTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FAF9F5] border border-stone-400 text-[11px] font-bold focus:outline-none focus:border-[#141414]"
              aria-label="Filtrar por tipo de dado"
            >
              <option value="all">Todos os Tipos de Dados</option>
              {availableDataTypes.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter !== 'all' || dataTypeFilter !== 'all' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setDataTypeFilter('all');
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-900 text-[10px] font-bold uppercase cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Simplified Requests List / Table */}
      <div className="bg-white border-2 border-[#141414] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#141414] text-white text-[10px] uppercase tracking-wider">
              <th className="p-2.5 border-r border-stone-700">Protocolo</th>
              <th className="p-2.5 border-r border-stone-700">Titular</th>
              <th className="p-2.5 border-r border-stone-700">Dados Solicitados</th>
              <th className="p-2.5 border-r border-stone-700">Data</th>
              <th className="p-2.5 border-r border-stone-700 text-center">Status</th>
              <th className="p-2.5 text-right">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {filteredRequests.map((req) => {
              const meta = STATUS_META[req.status] || STATUS_META.pending;
              const StatusIcon = meta.Icon;
              const isExpanded = expandedId === req.id;
              const reqDate = new Date(req.requestDate || req.dataSolicitacao);
              const dataTags =
                Array.isArray(req.dataTypes) && req.dataTypes.length > 0
                  ? req.dataTypes
                  : (req.tipoDado || 'Expurgo Geral').split(',').map((s) => s.trim());

              return (
                <React.Fragment key={req.id}>
                  <tr
                    className={`hover:bg-amber-50/50 transition-colors cursor-pointer ${
                      isExpanded ? 'bg-amber-50/70' : ''
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  >
                    <td className="p-2.5 font-bold text-red-700 border-r border-stone-200 whitespace-nowrap">
                      {req.protocolo || req.id}
                    </td>
                    <td className="p-2.5 border-r border-stone-200">
                      <div className="font-bold text-stone-900">{req.nomeCompleto || req.name}</div>
                      <div className="text-[10px] text-stone-500">{req.email}</div>
                    </td>
                    <td className="p-2.5 border-r border-stone-200">
                      <div className="flex flex-wrap gap-1">
                        {dataTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 text-stone-800 text-[10px] font-bold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2.5 border-r border-stone-200 text-stone-600 whitespace-nowrap">
                      {Number.isNaN(reqDate.getTime())
                        ? String(req.requestDate || '')
                        : reqDate.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-2.5 border-r border-stone-200 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-bold uppercase ${meta.badgeClass}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{meta.label}</span>
                      </span>
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : req.id);
                        }}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-700 text-white text-[10px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Ocultar' : 'Examinar'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-[#FAF9F5]">
                      <td colSpan={6} className="p-4 border-t border-stone-300 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                          <div className="p-2.5 bg-white border border-stone-300">
                            <span className="text-[10px] font-bold uppercase text-stone-500 block">
                              Contato &amp; Origem
                            </span>
                            <div className="text-stone-900 mt-1">
                              Tel: <strong>{req.phone || 'Não informado'}</strong>
                            </div>
                            <div className="text-stone-600">
                              IP registrado: <strong>{req.ipAddress || 'Não registrado'}</strong>
                            </div>
                          </div>

                          <div className="p-2.5 bg-white border border-stone-300">
                            <span className="text-[10px] font-bold uppercase text-stone-500 block">
                              Responsável / Processamento
                            </span>
                            <div className="text-stone-900 mt-1">
                              {req.processedBy || 'Aguardando triagem do DPO'}
                            </div>
                            {req.completedAt && (
                              <div className="text-emerald-700 text-[10px] font-bold mt-0.5">
                                Concluído em:{' '}
                                {new Date(req.completedAt).toLocaleString('pt-BR')}
                              </div>
                            )}
                          </div>

                          <div className="p-2.5 bg-white border border-stone-300">
                            <span className="text-[10px] font-bold uppercase text-stone-500 block">
                              Certificado Comprobatório
                            </span>
                            {req.certificadoExclusao || req.certificateId ? (
                              <div className="text-emerald-800 font-bold mt-1 flex items-center gap-1">
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>{req.certificadoExclusao || req.certificateId}</span>
                              </div>
                            ) : (
                              <div className="text-stone-500 mt-1">Ainda não emitido</div>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-white border border-stone-300">
                          <span className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                            Fundamentação / Justificativa (LGPD Art. 18):
                          </span>
                          <p className="font-serif text-xs text-stone-800 leading-relaxed">
                            {req.motivo || req.reason}
                          </p>
                        </div>

                        {canProcess ? (
                          <div className="p-3 bg-stone-100 border border-stone-400 space-y-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-stone-800">
                              <Scale className="w-3.5 h-3.5 text-red-700" />
                              <span>Despacho Rápido do Burocrata ({AUTHORIZED_BUROCRATA_EMAIL})</span>
                            </div>

                            <input
                              type="text"
                              value={actionNotes[req.id] ?? req.observacoes ?? ''}
                              onChange={(e) =>
                                setActionNotes((prev) => ({
                                  ...prev,
                                  [req.id]: e.target.value
                                }))
                              }
                              placeholder="Observações / Parecer técnico para registro..."
                              className="w-full px-2.5 py-1.5 bg-white border border-stone-400 text-xs focus:outline-none focus:border-[#141414]"
                            />

                            <div className="flex flex-wrap items-center gap-2">
                              {req.status === 'pending' && (
                                <button
                                  type="button"
                                  disabled={processingId === req.id}
                                  onClick={() => handleStatusChange(req, 'processing')}
                                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold uppercase cursor-pointer disabled:opacity-50"
                                >
                                  Iniciar Análise
                                </button>
                              )}

                              {req.status !== 'completed' && (
                                confirmCompleteId === req.id ? (
                                  <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-600 px-2 py-1">
                                    <span className="text-[10px] font-bold text-red-900">
                                      Confirmar expurgo e emitir certificado?
                                    </span>
                                    <button
                                      type="button"
                                      disabled={processingId === req.id}
                                      onClick={() => handleStatusChange(req, 'completed')}
                                      className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold uppercase cursor-pointer"
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmCompleteId(null)}
                                      className="px-2 py-0.5 bg-stone-300 hover:bg-stone-400 text-stone-900 text-[10px] font-bold uppercase cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={processingId === req.id}
                                    onClick={() => setConfirmCompleteId(req.id)}
                                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold uppercase cursor-pointer disabled:opacity-50"
                                  >
                                    ✓ Concluir &amp; Emitir Certificado
                                  </button>
                                )
                              )}

                              {req.status !== 'rejected' && req.status !== 'completed' && (
                                <button
                                  type="button"
                                  disabled={processingId === req.id}
                                  onClick={() => handleStatusChange(req, 'rejected')}
                                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-[10px] font-bold uppercase cursor-pointer disabled:opacity-50"
                                >
                                  Indeferir Pedido
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-amber-50 border border-amber-400 text-[11px] text-amber-950">
                            Modo de consulta de auditoria: o despacho executivo e emissão de certificados é exclusivo do Encarregado de Dados / Burocrata (<strong>{AUTHORIZED_BUROCRATA_EMAIL}</strong>).
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-stone-500">
                  Nenhuma solicitação LGPD encontrada com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
