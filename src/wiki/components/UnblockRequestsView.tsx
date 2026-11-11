import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  FileText,
  UserX,
  Lock,
  Unlock,
  Check,
  Send,
  Plus,
  Info,
  Scale,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Eye,
  Shield,
  Layers,
  History,
  AlertCircle,
} from 'lucide-react';
import {
  UserProfile,
  UnblockRequest,
  UnblockRequestStatus,
  UnblockCategory,
  UserRole,
} from '../types';
import { StorageService } from '../services/storageService';

interface UnblockRequestsViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser?: (username: string) => void;
  onNavigateToCheckUser?: (username: string) => void;
  onBack?: () => void;
}

const CATEGORY_LABELS: Record<UnblockCategory, { label: string; icon: string; color: string }> = {
  guerra_edicao: {
    label: 'Guerra de Edições (3RR)',
    icon: '⚔️',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  vandalismo_acidental: {
    label: 'Vandalismo Acidental / Teste',
    icon: '🧪',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  },
  bloqueio_ip_compartilhado: {
    label: 'IP Compartilhado / Institucional',
    icon: '🌐',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
  },
  fantoche_falso_positivo: {
    label: 'Fantoche (Falso Positivo)',
    icon: '🎭',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  },
  revisao_lgpd_marco_civil: {
    label: 'Revisão LGPD / Marco Civil',
    icon: '⚖️',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  comportamento_inadequado: {
    label: 'Conduta / Ataques Pessoais',
    icon: '⚠️',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800',
  },
  outro: {
    label: 'Outro Motivo',
    icon: '📝',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
};

const STANDARD_RATIONALES = [
  {
    title: 'Compromisso Aceito (1ª Sanção)',
    decision: 'unblock_full' as const,
    text: 'Recurso deferido. O usuário demonstrou compreensão das regras comunitárias da WikiWorldWeb, reconheceu o equívoco e assumiu compromisso formal de conduta. Acesso plenamente restabelecido.',
  },
  {
    title: 'Falso Positivo de Filtro (LGPD Art. 20)',
    decision: 'unblock_full' as const,
    text: 'Revisão humana deferida nos termos do Art. 20 da LGPD. Constatado falso positivo gerado por disparador automatizado de filtro anti-abuso. Bloqueio revogado sem prejuízo ao histórico do titular.',
  },
  {
    title: 'Isenção de IP Coletivo / Escola',
    decision: 'unblock_full' as const,
    text: 'Recurso deferido. Concedida isenção de bloqueio de IP compartilhado (IP-Block-Exempt) para viabilizar as atividades didáticas da instituição de ensino, mantendo monitoramento preventivo.',
  },
  {
    title: 'Desbloqueio Sob Período Probatório',
    decision: 'unblock_probationary' as const,
    text: 'Recurso deferido sob regime probatório condicional. Fica autorizada a edição de artigos existentes e participação em discussões. A criação de novas páginas permanece temporariamente restrita por 30 dias.',
  },
  {
    title: 'Indeferido: Evasão Confirmada (CheckUser)',
    decision: 'rejected' as const,
    text: 'Recurso indeferido. A análise técnica via Special:CheckUser confirmou a operação de contas fantoches correlacionadas para evasão de bloqueio. Punição mantida por reincidência deliberada.',
  },
  {
    title: 'Indeferido: Ausência de Retratação',
    decision: 'rejected' as const,
    text: 'Recurso indeferido. As alegações apresentadas não refutam as infrações documentadas no histórico de edições e não foi apresentado compromisso de adequação às normas de neutralidade.',
  },
  {
    title: 'Solicitar Esclarecimentos Adicionais',
    decision: 'requested_more_info' as const,
    text: 'Favor esclarecer a coincidência de conexões na mesma faixa IP com as contas apontadas no relatório técnico antes do pronunciamento definitivo do corpo de moderadores.',
  },
];

export const UnblockRequestsView: React.FC<UnblockRequestsViewProps> = ({
  currentUser,
  onNavigateToUser,
  onNavigateToCheckUser,
  onBack,
}) => {
  const [requests, setRequests] = useState<UnblockRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Decision Form State
  const [decisionType, setDecisionType] = useState<
    'unblock_full' | 'unblock_probationary' | 'rejected' | 'requested_more_info'
  >('unblock_full');
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  // New Comment Form State
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [isInternalComment, setIsInternalComment] = useState<boolean>(true);
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);

  // Manual Appeal Modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState({
    username: '',
    email: '',
    category: 'vandalismo_acidental' as UnblockCategory,
    blockReason: '',
    appealJustification: '',
    commitmentToGuidelines: '',
    urgency: 'media' as 'alta' | 'media' | 'baixa',
    ipAddress: '',
  });

  const isModeratorOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'moderador' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await StorageService.getUnblockRequests();
      setRequests(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading unblock requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = StorageService.subscribeToUnblockRequests((data) => {
      setRequests(data);
      setSelectedId((prev) => {
        if (!prev && data.length > 0) return data[0].id;
        if (prev && !data.some((r) => r.id === prev) && data.length > 0) return data[0].id;
        return prev;
      });
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const safeRequests = requests || [];
  const selectedRequest = safeRequests.find((r) => r.id === selectedId) || safeRequests[0] || null;

  // Counters
  const totalCount = safeRequests.length;
  const pendingCount = safeRequests.filter((r) => r.status === 'pendente').length;
  const inReviewCount = safeRequests.filter((r) => r.status === 'em_analise').length;
  const approvedCount = safeRequests.filter((r) => r.status === 'aprovado').length;
  const rejectedCount = safeRequests.filter((r) => r.status === 'recusado').length;

  // Filtered List
  const filteredRequests = safeRequests.filter((req) => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && req.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchUsername = req.username.toLowerCase().includes(q);
      const matchDisplayName = req.displayName.toLowerCase().includes(q);
      const matchId = req.id.toLowerCase().includes(q);
      const matchReason = req.blockReason.toLowerCase().includes(q);
      const matchAppeal = req.appealJustification.toLowerCase().includes(q);
      if (!matchUsername && !matchDisplayName && !matchId && !matchReason && !matchAppeal) {
        return false;
      }
    }
    return true;
  });

  const handleApplyDecision = async () => {
    if (!selectedRequest || !currentUser) return;
    if (!decisionNotes.trim()) {
      setActionNotice({ text: 'Por favor, insira o parecer/fundamentação do veredito.', type: 'error' });
      return;
    }

    setIsSubmittingDecision(true);
    try {
      const mappedDecision: 'aprovado' | 'recusado' | 'em_analise' =
        decisionType === 'rejected'
          ? 'recusado'
          : decisionType === 'requested_more_info'
          ? 'em_analise'
          : 'aprovado';

      const res = await StorageService.evaluateUnblockRequest(
        selectedRequest.id,
        mappedDecision,
        decisionNotes,
        currentUser
      );

      if (res.success) {
        setActionNotice({ text: res.message, type: 'success' });
        setDecisionNotes('');
        await loadRequests();
      } else {
        setActionNotice({ text: res.message, type: 'error' });
      }
    } catch (err) {
      console.error('Error applying decision:', err);
      setActionNotice({ text: 'Falha ao processar a avaliação.', type: 'error' });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !currentUser || !newCommentText.trim()) return;

    setIsPostingComment(true);
    try {
      await StorageService.addCommentToUnblockRequest(
        selectedRequest.id,
        newCommentText,
        currentUser,
        isInternalComment
      );
      setNewCommentText('');
      await loadRequests();
      setActionNotice({ text: 'Nota adicionada com sucesso ao processo.', type: 'success' });
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleCreateManualAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.username.trim() || !manualForm.appealJustification.trim()) {
      alert('Preencha o nome de usuário e a justificativa.');
      return;
    }

    try {
      const created = await StorageService.createUnblockRequest({
        userUid: `manual-${Date.now()}`,
        username: manualForm.username.trim(),
        displayName: manualForm.username.trim(),
        email: manualForm.email.trim() || undefined,
        userRoleAtBan: 'leitor',
        blockReason: manualForm.blockReason.trim() || 'Suspensão registrada por moderação.',
        blockedBy: currentUser?.displayName || 'Administração',
        blockedAt: new Date().toISOString(),
        category: manualForm.category,
        appealJustification: manualForm.appealJustification.trim(),
        commitmentToGuidelines: manualForm.commitmentToGuidelines.trim() || 'Compromisso com as regras de edição.',
        urgency: manualForm.urgency,
        ipAddress: manualForm.ipAddress.trim() || '187.54.99.10',
      });

      setShowManualModal(false);
      setManualForm({
        username: '',
        email: '',
        category: 'vandalismo_acidental',
        blockReason: '',
        appealJustification: '',
        commitmentToGuidelines: '',
        urgency: 'media',
        ipAddress: '',
      });
      await loadRequests();
      setSelectedId(created.id);
      setActionNotice({ text: `Recurso #${created.id} registrado com sucesso na fila de avaliação.`, type: 'success' });
    } catch (err) {
      console.error('Error creating manual appeal:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-3 md:p-6 text-xs">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top Breadcrumbs & Header */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
                  title="Voltar"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  <span>Especial:Páginas Especiais</span>
                  <span>/</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">Special:UnblockRequests</span>
                </div>
                <h1 className="text-lg md:text-xl font-bold font-serif-heading text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                  <Scale className="text-purple-600 dark:text-purple-400" size={22} />
                  <span>Avaliação de Pedidos de Desbloqueio</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                    Moderação & Burocratas
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManualModal(true)}
                className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Plus size={14} />
                <span>Registrar Recurso Manual</span>
              </button>
              <button
                onClick={loadRequests}
                className="p-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                title="Atualizar lista"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Legal / Institutional Framework Banner */}
          <div className="mt-3 p-3 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 rounded-md flex items-start gap-2.5 text-[11px] text-slate-700 dark:text-slate-300">
            <Info size={16} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-purple-950 dark:text-purple-200">
                Garantia de Ampla Defesa & Revisão Humana (LGPD Art. 20 e Marco Civil):
              </span>{' '}
              Esta central permite ao corpo de moderadores e administradores examinar recursos contra suspensões,
              bloqueios de faixas de IP institucionais e sanções automatizadas. A decisão proferida gera registro
              imutável no log de auditoria da WikiWorldWeb e notificação oficial na página de discussão do usuário.
            </div>
          </div>

          {/* Metrics summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">Total de Recursos</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200">{totalCount}</span>
            </div>
            <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 block font-mono font-bold">Pendentes</span>
              <span className="text-base font-bold text-amber-800 dark:text-amber-200">{pendingCount}</span>
            </div>
            <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <span className="text-[10px] text-blue-700 dark:text-blue-300 block font-mono">Em Análise</span>
              <span className="text-base font-bold text-blue-800 dark:text-blue-200">{inReviewCount}</span>
            </div>
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-mono">Aprovados / Livres</span>
              <span className="text-base font-bold text-emerald-800 dark:text-emerald-200">{approvedCount}</span>
            </div>
            <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
              <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-mono">Indeferidos</span>
              <span className="text-base font-bold text-rose-800 dark:text-rose-200">{rejectedCount}</span>
            </div>
          </div>
        </div>

        {/* Global Action Notice */}
        {actionNotice && (
          <div
            className={`p-3 rounded-lg border flex items-center justify-between text-xs transition ${
              actionNotice.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span className="font-medium">{actionNotice.text}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-xs hover:underline font-bold px-2 py-0.5 opacity-70 hover:opacity-100"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {[
              { key: 'all', label: 'Todos', count: totalCount },
              { key: 'pendente', label: 'Pendentes', count: pendingCount, highlight: true },
              { key: 'em_analise', label: 'Em Análise', count: inReviewCount },
              { key: 'aprovado', label: 'Aprovados', count: approvedCount },
              { key: 'recusado', label: 'Indeferidos', count: rejectedCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition ${
                  statusFilter === tab.key
                    ? 'bg-purple-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.key
                      ? 'bg-purple-900 text-white'
                      : tab.highlight && tab.count > 0
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-bold'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Category & Search Input */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">Todas as Categorias</option>
              <option value="guerra_edicao">Guerra de Edições (3RR)</option>
              <option value="vandalismo_acidental">Vandalismo Acidental</option>
              <option value="bloqueio_ip_compartilhado">IP Compartilhado / Escola</option>
              <option value="fantoche_falso_positivo">Fantoche (Falso Positivo)</option>
              <option value="revisao_lgpd_marco_civil">Revisão LGPD / Marco Civil</option>
              <option value="comportamento_inadequado">Conduta / Ofensas</option>
              <option value="outro">Outro Motivo</option>
            </select>

            <div className="relative flex-1 sm:w-56">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar usuário, ID, motivo..."
                className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Main Split Layout: Request List vs Detail Review Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Tickets List */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 px-1 font-mono text-[11px]">
              <span>FILA DE RECURSOS ({filteredRequests.length})</span>
              <span>ORDENADO POR DATA</span>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
                <ShieldCheck size={36} className="mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                  Nenhum pedido de desbloqueio encontrado.
                </p>
                <p className="text-[11px] mt-1 text-slate-400">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Tente alterar os filtros de busca selecionados.'
                    : 'A fila de avaliação está em dia!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRequests.map((req) => {
                  const isSelected = selectedRequest?.id === req.id;
                  const cat = CATEGORY_LABELS[req.category] || CATEGORY_LABELS.outro;

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedId(req.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition shadow-xs ${
                        isSelected
                          ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-400 dark:border-purple-700 ring-1 ring-purple-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 font-mono flex-shrink-0">
                            {req.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{req.displayName || req.username}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-normal">
                                (@{req.username})
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              #{req.id} • {new Date(req.requestedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1">
                          {req.status === 'pendente' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                              ⏳ Pendente
                            </span>
                          )}
                          {req.status === 'em_analise' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                              🔍 Em Análise
                            </span>
                          )}
                          {req.status === 'aprovado' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              ✅ Desbloqueado
                            </span>
                          )}
                          {req.status === 'recusado' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              ❌ Indeferido
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Category & Urgency */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${cat.color}`}>
                          {cat.icon} {cat.label}
                        </span>

                        {req.urgency === 'alta' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800">
                            🔥 Urgência Alta
                          </span>
                        )}

                        {req.checkUserSummary && req.checkUserSummary.matchedAccountsCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-0.5">
                            <UserX size={9} />
                            CheckUser: {req.checkUserSummary.matchedAccountsCount} vinculados
                          </span>
                        )}
                      </div>

                      {/* Snippet */}
                      <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed italic">
                        "{req.appealJustification}"
                      </p>

                      {/* Footer Info */}
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Suspenso por: {req.blockedBy}</span>
                        {req.comments && req.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <MessageSquare size={10} />
                            {req.comments.length} notas
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Case File & Decision Dossier */}
          <div className="lg:col-span-7">
            {selectedRequest ? (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 md:p-5 shadow-xs space-y-4">
                {/* Dossier Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        PROCESSO #{selectedRequest.id}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                          CATEGORY_LABELS[selectedRequest.category]?.color || ''
                        }`}
                      >
                        {CATEGORY_LABELS[selectedRequest.category]?.icon}{' '}
                        {CATEGORY_LABELS[selectedRequest.category]?.label}
                      </span>
                    </div>

                    <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                      <span>{selectedRequest.displayName || selectedRequest.username}</span>
                      <span className="text-xs font-mono font-normal text-slate-400">
                        (@{selectedRequest.username})
                      </span>
                    </h2>
                  </div>

                  {/* Actions to jump to user profile or CheckUser */}
                  <div className="flex items-center gap-1.5">
                    {onNavigateToUser && (
                      <button
                        onClick={() => onNavigateToUser(selectedRequest.username)}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1 transition"
                      >
                        <User size={12} />
                        <span>Perfil</span>
                      </button>
                    )}
                    {onNavigateToCheckUser && (
                      <button
                        onClick={() => onNavigateToCheckUser(selectedRequest.username)}
                        className="px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <UserX size={12} />
                        <span>CheckUser</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sanction Details Card */}
                <div className="p-3 bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300">
                    <ShieldAlert size={14} />
                    <span>Dados do Bloqueio Vigente</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Aplicado por:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedRequest.blockedBy}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Data da Sanção:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(selectedRequest.blockedAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">IP Registrado:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedRequest.ipAddress || 'Não registrado'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-red-200/60 dark:border-red-900/40 text-[11px]">
                    <span className="font-bold text-red-800 dark:text-red-300 block mb-0.5">
                      Motivo Formal da Suspensão:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {selectedRequest.blockReason}
                    </p>
                  </div>
                </div>

                {/* CheckUser Risk Summary (Integration) */}
                {selectedRequest.checkUserSummary && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                      selectedRequest.checkUserSummary.riskScore >= 50
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                        : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    <UserX size={16} className="flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Diagnóstico CheckUser:</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            selectedRequest.checkUserSummary.riskScore >= 50
                              ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                              : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                          }`}
                        >
                          Risco: {selectedRequest.checkUserSummary.riskScore}%
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {selectedRequest.checkUserSummary.matchedAccountsCount > 0
                          ? `Atenção: Detectadas ${selectedRequest.checkUserSummary.matchedAccountsCount} contas adicionais compartilhando a mesma impressão de rede e IP (${selectedRequest.checkUserSummary.sameIpAsAccounts.join(
                              ', '
                            )}).`
                          : 'Nenhuma conta fantoche ou correlação suspeita detectada no mesmo bloco de rede.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* User's Appeal Arguments (Fundamentação & Compromisso) */}
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      <FileText size={14} className="text-purple-600 dark:text-purple-400" />
                      <span>1. Alegações e Fundamentação do Requerente:</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedRequest.appealJustification}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>2. Compromisso com as Diretrizes Editoriais:</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedRequest.commitmentToGuidelines}
                    </div>
                  </div>
                </div>

                {/* Historical Resolution Display if already decided */}
                {selectedRequest.resolutionDecision && (
                  <div
                    className={`p-3.5 rounded-lg border text-xs ${
                      selectedRequest.status === 'aprovado'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : selectedRequest.status === 'recusado'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <Scale size={15} />
                        Veredito Registrado: {selectedRequest.resolutionDecision.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono">
                        Por: {selectedRequest.reviewedBy} (
                        {selectedRequest.reviewedAt
                          ? new Date(selectedRequest.reviewedAt).toLocaleDateString('pt-BR')
                          : ''}
                        )
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] leading-relaxed p-2 bg-white/70 dark:bg-slate-900/70 rounded border border-slate-200/60 dark:border-slate-800/60">
                      <span className="font-bold block mb-0.5">Parecer Oficial da Moderação:</span>
                      {selectedRequest.resolutionNotes}
                    </div>
                  </div>
                )}

                {/* Moderator Discussion & Internal Notes Thread */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-purple-600 dark:text-purple-400" />
                      Notas Internas da Moderação ({selectedRequest.comments?.length || 0})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      Visível apenas para moderadores e administradores
                    </span>
                  </div>

                  {selectedRequest.comments && selectedRequest.comments.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedRequest.comments.map((comm) => (
                        <div
                          key={comm.id}
                          className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                            <span className="font-bold text-purple-700 dark:text-purple-300">
                              {comm.author} ({comm.authorRole})
                            </span>
                            <span>{new Date(comm.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{comm.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic py-1">
                      Nenhuma nota registrada pela equipe neste processo.
                    </p>
                  )}

                  {/* Add Note Form */}
                  {isModeratorOrAdmin && (
                    <form onSubmit={handleAddComment} className="flex gap-2 items-end pt-1">
                      <div className="flex-1">
                        <textarea
                          rows={2}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Adicionar nota interna ou apontamento sobre este pedido..."
                          className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-purple-500 resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isPostingComment || !newCommentText.trim()}
                        className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1 transition"
                      >
                        <Send size={13} />
                        <span>Anotar</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* MODERATOR DECISION PANEL (Painel de Avaliação e Decisão) */}
                {isModeratorOrAdmin ? (
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-purple-50/40 dark:from-slate-850 dark:to-purple-950/20 border-2 border-purple-300 dark:border-purple-800 rounded-lg space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Scale className="text-purple-600 dark:text-purple-400" size={18} />
                        <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Painel de Veredito & Decisão Disciplinar
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 font-bold bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded">
                        Ação Imediata
                      </span>
                    </div>

                    {/* Decision Option Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Option 1: Full Unblock */}
                      <button
                        type="button"
                        onClick={() => {
                          setDecisionType('unblock_full');
                          if (!decisionNotes) {
                            setDecisionNotes(STANDARD_RATIONALES[0].text);
                          }
                        }}
                        className={`p-2.5 rounded-lg border text-left transition flex items-start gap-2 ${
                          decisionType === 'unblock_full'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                        }`}
                      >
                        <Unlock size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-xs font-bold">Aprovar Desbloqueio Total</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight block mt-0.5">
                            Restaura plenas permissões editoriais e cancela a suspensão.
                          </span>
                        </div>
                      </button>

                      {/* Option 2: Probationary Unblock */}
                      <button
                        type="button"
                        onClick={() => {
                          setDecisionType('unblock_probationary');
                          if (!decisionNotes) {
                            setDecisionNotes(STANDARD_RATIONALES[3].text);
                          }
                        }}
                        className={`p-2.5 rounded-lg border text-left transition flex items-start gap-2 ${
                          decisionType === 'unblock_probationary'
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-300'
                        }`}
                      >
                        <Shield
                          size={16}
                          className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                        />
                        <div>
                          <span className="block text-xs font-bold">Desbloqueio Probatório</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight block mt-0.5">
                            Permite apenas edição simples de artigos sob supervisão.
                          </span>
                        </div>
                      </button>

                      {/* Option 3: Reject Unblock */}
                      <button
                        type="button"
                        onClick={() => {
                          setDecisionType('rejected');
                          if (!decisionNotes) {
                            setDecisionNotes(STANDARD_RATIONALES[4].text);
                          }
                        }}
                        className={`p-2.5 rounded-lg border text-left transition flex items-start gap-2 ${
                          decisionType === 'rejected'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-950 dark:text-rose-200 ring-1 ring-rose-500 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-300'
                        }`}
                      >
                        <Lock size={16} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-xs font-bold">Indeferir Pedido (Manter Bloqueio)</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight block mt-0.5">
                            Mantém a sanção ativa com parecer motivado.
                          </span>
                        </div>
                      </button>

                      {/* Option 4: Request More Info */}
                      <button
                        type="button"
                        onClick={() => {
                          setDecisionType('requested_more_info');
                          if (!decisionNotes) {
                            setDecisionNotes(STANDARD_RATIONALES[6].text);
                          }
                        }}
                        className={`p-2.5 rounded-lg border text-left transition flex items-start gap-2 ${
                          decisionType === 'requested_more_info'
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-200 ring-1 ring-blue-500 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                        }`}
                      >
                        <HelpCircle
                          size={16}
                          className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                        />
                        <div>
                          <span className="block text-xs font-bold">Requisitar Esclarecimentos</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight block mt-0.5">
                            Marca como Em Análise e envia mensagem ao titular.
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Standard Rationale Templates Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Modelos de Parecer / Fundamentação Padrão:
                      </label>
                      <select
                        onChange={(e) => {
                          const found = STANDARD_RATIONALES.find((r) => r.title === e.target.value);
                          if (found) {
                            setDecisionType(found.decision);
                            setDecisionNotes(found.text);
                          }
                        }}
                        className="w-full p-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">-- Selecione uma justificativa pré-formatada --</option>
                        {STANDARD_RATIONALES.map((rat) => (
                          <option key={rat.title} value={rat.title}>
                            [{rat.decision.toUpperCase()}] {rat.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Textarea for Decision Notes */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Parecer Técnico & Fundamentação do Veredito (Obrigatório):
                      </label>
                      <textarea
                        rows={3}
                        value={decisionNotes}
                        onChange={(e) => setDecisionNotes(e.target.value)}
                        placeholder="Escreva a fundamentação detalhada do veredito que será registrada nos logs de auditoria e enviada ao usuário..."
                        className="w-full p-2.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-purple-500 leading-relaxed font-sans"
                      />
                    </div>

                    {/* Submit Decision Button */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleApplyDecision}
                        disabled={isSubmittingDecision || !decisionNotes.trim()}
                        className={`px-4 py-2 rounded-md font-bold text-xs flex items-center gap-2 text-white transition shadow-sm ${
                          decisionType === 'unblock_full'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : decisionType === 'unblock_probationary'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : decisionType === 'rejected'
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        } disabled:opacity-50`}
                      >
                        {isSubmittingDecision ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Scale size={14} />
                        )}
                        <span>
                          {decisionType === 'unblock_full' && 'Aprovar & Desbloquear Conta Agora'}
                          {decisionType === 'unblock_probationary' && 'Conceder Desbloqueio Probatório'}
                          {decisionType === 'rejected' && 'Indeferir Recurso & Manter Suspensão'}
                          {decisionType === 'requested_more_info' && 'Solicitar Esclarecimentos'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded text-center text-slate-500 text-xs">
                    <Lock size={16} className="mx-auto mb-1 opacity-60" />
                    Você está visualizando este processo em modo somente leitura. A emissão de vereditos é restrita a
                    moderadores e administradores.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
                <FileText size={36} className="mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                  Nenhum processo selecionado.
                </p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Clique em um dos itens da fila ao lado para carregar o dossiê de recurso completo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Appeal Registration Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden text-xs">
            <div className="p-4 bg-purple-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={18} />
                <h3 className="font-bold text-sm">Registrar Recurso de Desbloqueio Manual</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-white/80 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualAppeal} className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome de Usuário (Username)*:
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.username}
                    onChange={(e) => setManualForm({ ...manualForm, username: e.target.value })}
                    placeholder="Ex: Editor_Exemplo"
                    className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail de Contato (Opcional):
                  </label>
                  <input
                    type="email"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    placeholder="usuario@exemplo.com"
                    className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria do Pedido*:
                  </label>
                  <select
                    value={manualForm.category}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, category: e.target.value as UnblockCategory })
                    }
                    className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="guerra_edicao">Guerra de Edições (3RR)</option>
                    <option value="vandalismo_acidental">Vandalismo Acidental / Teste</option>
                    <option value="bloqueio_ip_compartilhado">IP Compartilhado / Escola</option>
                    <option value="fantoche_falso_positivo">Fantoche (Falso Positivo)</option>
                    <option value="revisao_lgpd_marco_civil">Revisão LGPD / Marco Civil (Art. 20)</option>
                    <option value="comportamento_inadequado">Conduta / Ofensas</option>
                    <option value="outro">Outro Motivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Urgência:
                  </label>
                  <select
                    value={manualForm.urgency}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, urgency: e.target.value as 'alta' | 'media' | 'baixa' })
                    }
                    className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="alta">Alta (Institucional / LGPD)</option>
                    <option value="media">Média (Padrão)</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo Original do Bloqueio:
                </label>
                <input
                  type="text"
                  value={manualForm.blockReason}
                  onChange={(e) => setManualForm({ ...manualForm, blockReason: e.target.value })}
                  placeholder="Ex: Edição controversa reiterada sem discussão..."
                  className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Justificativa de Apelação (Argumentos do Titular)*:
                </label>
                <textarea
                  rows={3}
                  required
                  value={manualForm.appealJustification}
                  onChange={(e) => setManualForm({ ...manualForm, appealJustification: e.target.value })}
                  placeholder="Descreva o teor do pedido de recurso recebido por e-mail ou protocolo formal..."
                  className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Compromisso de Conduta & Garantias Apresentadas:
                </label>
                <textarea
                  rows={2}
                  value={manualForm.commitmentToGuidelines}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, commitmentToGuidelines: e.target.value })
                  }
                  placeholder="Garantias fornecidas pelo usuário para evitar reincidência..."
                  className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  Protocolar Recurso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
