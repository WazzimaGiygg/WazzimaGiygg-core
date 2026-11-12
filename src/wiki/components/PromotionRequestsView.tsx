import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Crown,
  Vote,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Check,
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Scale,
  Sparkles,
  ChevronRight,
  Info,
  RefreshCw,
  Users,
  FileText,
  Lock,
} from 'lucide-react';
import {
  UserProfile,
  PromotionRequest,
  PromotionVote,
  PromotionVoteType,
  PromotionTargetRole,
  PromotionRequestStatus,
  UserRole,
} from '../types';
import { StorageService } from '../services/storageService';

interface PromotionRequestsViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser: (identifier: string) => void;
  onNavigateToAdminCouncil?: () => void;
  onBack?: () => void;
}

export const PromotionRequestsView: React.FC<PromotionRequestsViewProps> = ({
  currentUser,
  onNavigateToUser,
  onNavigateToAdminCouncil,
  onBack,
}) => {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'em_votacao' | 'aprovada' | 'rejeitada' | 'todas'>('em_votacao');
  const [roleFilter, setRoleFilter] = useState<'all' | 'moderador' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>([]);

  // Vote form state
  const [selectedVoteType, setSelectedVoteType] = useState<PromotionVoteType>('a_favor');
  const [voteReason, setVoteReason] = useState<string>('');
  const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);
  const [voteMessage, setVoteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resolution form state (Admin / Bureaucrat)
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isResolving, setIsResolving] = useState<boolean>(false);

  // New Request Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [nominationType, setNominationType] = useState<'self' | 'other'>('self');
  const [nominatedUserUid, setNominatedUserUid] = useState<string>('');
  const [targetRole, setTargetRole] = useState<PromotionTargetRole>('moderador');
  const [statement, setStatement] = useState<string>('');
  const [contributionsSummary, setContributionsSummary] = useState<string>('');
  const [isSubmittingNew, setIsSubmittingNew] = useState<boolean>(false);
  const [newError, setNewError] = useState<string>('');

  const isAdminOrBureaucrat =
    currentUser?.role === 'admin' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqs, users] = await Promise.all([
        StorageService.getPromotionRequests(),
        StorageService.getCommunityUsers(),
      ]);
      setRequests(reqs);
      setCommunityUsers(users);

      if (reqs.length > 0) {
        if (!selectedId || !reqs.some((r) => r.id === selectedId)) {
          // Select first active request or first request
          const firstActive = reqs.find((r) => r.status === 'em_votacao');
          setSelectedId(firstActive ? firstActive.id : reqs[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading promotion requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // Carregar usuários da comunidade para dropdown de nomeação
    StorageService.getCommunityUsers()
      .then((users) => setCommunityUsers(users))
      .catch((err) => console.warn('Erro ao carregar usuários:', err));

    const unsubscribe = StorageService.subscribeToPromotionRequests((reqs) => {
      setRequests(reqs);
      setSelectedId((prev) => {
        if (!prev && reqs.length > 0) {
          const firstActive = reqs.find((r) => r.status === 'em_votacao');
          return firstActive ? firstActive.id : reqs[0].id;
        }
        if (prev && !reqs.some((r) => r.id === prev) && reqs.length > 0) {
          return reqs[0].id;
        }
        return prev;
      });
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const selectedRequest = useMemo(() => {
    return requests.find((r) => r.id === selectedId) || null;
  }, [requests, selectedId]);

  // Set existing vote if user already voted
  useEffect(() => {
    if (selectedRequest && currentUser) {
      const myUsername = (currentUser.username || '').toLowerCase();
      const myVote = selectedRequest.votes.find(
        (v) =>
          v.voterUid === currentUser.uid ||
          (myUsername && v.voterUsername && v.voterUsername.toLowerCase() === myUsername)
      );
      if (myVote) {
        setSelectedVoteType(myVote.vote);
        setVoteReason(myVote.reason);
      } else {
        setSelectedVoteType('a_favor');
        setVoteReason('');
      }
      setVoteMessage(null);
    }
  }, [selectedId, currentUser]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    const safeRequests = Array.isArray(requests) ? requests : [];
    return safeRequests.filter((r) => {
      if (!r) return false;
      // Tab filter
      if (activeTab !== 'todas' && r.status !== activeTab) return false;
      // Role filter
      if (roleFilter !== 'all' && r.targetRole !== roleFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName =
          (r.candidateDisplayName || '').toLowerCase().includes(q) ||
          (r.candidateUsername || '').toLowerCase().includes(q);
        const matchesStatement = (r.statement || '').toLowerCase().includes(q);
        const matchesNominator = (r.nominatedBy || '').toLowerCase().includes(q);
        if (!matchesName && !matchesStatement && !matchesNominator) return false;
      }
      return true;
    });
  }, [requests, activeTab, roleFilter, searchQuery]);

  // Metrics
  const safeRequestsList = Array.isArray(requests) ? requests : [];
  const activeCount = safeRequestsList.filter((r) => r && r.status === 'em_votacao').length;
  const approvedCount = safeRequestsList.filter((r) => r && r.status === 'aprovada').length;
  const totalVotesCount = safeRequestsList.reduce((acc, r) => acc + (Array.isArray(r?.votes) ? r.votes.length : 0), 0);

  // Voting metrics for selected request
  const selectedStats = useMemo(() => {
    if (!selectedRequest) return null;
    const votes = Array.isArray(selectedRequest.votes) ? selectedRequest.votes : [];
    const proVotes = votes.filter((v) => v && v.vote === 'a_favor').length;
    const contraVotes = votes.filter((v) => v && v.vote === 'contra').length;
    const neutroVotes = votes.filter((v) => v && v.vote === 'neutro').length;
    const totalVotes = votes.length;
    const maxVotes = selectedRequest.maxVotes || 10;
    
    // Approval rate excludes neutral votes from the calculation base (standard Wikipedia / WikiWorldWeb RFA formula)
    const substantiveVotes = proVotes + contraVotes;
    const approvalRate = substantiveVotes > 0 ? Math.round((proVotes / substantiveVotes) * 100) : 0;
    const isQuorumReached = totalVotes >= maxVotes;
    const isApprovedThresholdMet = approvalRate >= selectedRequest.requiredApprovalRate;

    return {
      proVotes,
      contraVotes,
      neutroVotes,
      totalVotes,
      maxVotes,
      substantiveVotes,
      approvalRate,
      isQuorumReached,
      isApprovedThresholdMet,
      remainingVotes: Math.max(0, maxVotes - totalVotes),
    };
  }, [selectedRequest]);

  // Handle vote submit
  const handleCastVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !currentUser) return;
    if (voteReason.trim().length < 8) {
      setVoteMessage({
        type: 'error',
        text: 'Por favor, forneça uma fundamentação de no mínimo 8 caracteres explicando seu voto.',
      });
      return;
    }

    setIsSubmittingVote(true);
    setVoteMessage(null);

    try {
      const res = await StorageService.castPromotionVote(
        selectedRequest.id,
        selectedVoteType,
        voteReason,
        currentUser
      );

      if (res.success && res.updatedRequest) {
        setRequests((prev) =>
          prev.map((r) => (r.id === res.updatedRequest!.id ? res.updatedRequest! : r))
        );
        setVoteMessage({ type: 'success', text: res.message });
      } else {
        setVoteMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setVoteMessage({ type: 'error', text: err?.message || 'Erro ao registrar voto.' });
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Handle Admin / Bureaucrat conclusion
  const handleConcludeElection = async (decision: 'aprovada' | 'rejeitada') => {
    if (!selectedRequest || !currentUser || !isAdminOrBureaucrat) return;

    const confirmText =
      decision === 'aprovada'
        ? `Confirmar a homologação e promoção de ${selectedRequest.candidateDisplayName} ao cargo de ${selectedRequest.targetRole.toUpperCase()}?`
        : `Confirmar o indeferimento da candidatura de ${selectedRequest.candidateDisplayName}?`;

    if (!window.confirm(confirmText)) return;

    setIsResolving(true);
    try {
      const res = await StorageService.concludePromotionRequest(
        selectedRequest.id,
        decision,
        resolutionNotes,
        currentUser
      );

      if (res.success && res.updatedRequest) {
        setRequests((prev) =>
          prev.map((r) => (r.id === res.updatedRequest!.id ? res.updatedRequest! : r))
        );
        setResolutionNotes('');
        alert(res.message);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(`Erro ao homologar: ${err?.message || err}`);
    } finally {
      setIsResolving(false);
    }
  };

  // Handle new candidature creation
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setNewError('');

    if (statement.trim().length < 20) {
      setNewError('A justificativa da candidatura deve conter ao menos 20 caracteres detalhando a motivação.');
      return;
    }
    if (contributionsSummary.trim().length < 15) {
      setNewError('O resumo de contribuições deve conter ao menos 15 caracteres.');
      return;
    }

    let candidateUser: UserProfile | undefined;
    if (nominationType === 'self') {
      candidateUser = currentUser;
    } else {
      candidateUser = communityUsers.find((u) => u.uid === nominatedUserUid);
      if (!candidateUser) {
        setNewError('Selecione um usuário válido da comunidade para indicar.');
        return;
      }
    }

    setIsSubmittingNew(true);
    try {
      const res = await StorageService.createPromotionRequest(
        {
          candidateUid: candidateUser.uid,
          candidateUsername: candidateUser.username || candidateUser.displayName || candidateUser.uid,
          candidateDisplayName: candidateUser.displayName || candidateUser.username || 'Candidato',
          candidateEmail: candidateUser.email,
          currentRole: candidateUser.role,
          targetRole,
          statement,
          contributionsSummary,
          isSelfNomination: nominationType === 'self',
          nominatedBy: currentUser.displayName || currentUser.username || 'Proponente',
          nominatedByUid: currentUser.uid,
          requiredApprovalRate: targetRole === 'admin' ? 75 : 60,
        },
        currentUser
      );

      if (res.success && res.request) {
        setRequests((prev) => [res.request!, ...prev]);
        setSelectedId(res.request.id);
        setIsModalOpen(false);
        setStatement('');
        setContributionsSummary('');
        setNominatedUserUid('');
        alert(res.message);
      } else {
        setNewError(res.message);
      }
    } catch (err: any) {
      setNewError(err?.message || 'Erro ao criar pedido de promoção.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const getRoleBadge = (role: UserRole | PromotionTargetRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Crown size={11} className="text-purple-600 dark:text-purple-400" />
            Administrador
          </span>
        );
      case 'moderador':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Shield size={11} className="text-blue-600 dark:text-blue-400" />
            Moderador
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <User size={11} />
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        );
    }
  };

  const getStatusBadge = (status: PromotionRequestStatus) => {
    switch (status) {
      case 'em_votacao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
            <Clock size={12} />
            Em Votação (Ativa)
          </span>
        );
      case 'aprovada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={12} />
            Homologada / Aprovada
          </span>
        );
      case 'rejeitada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <XCircle size={12} />
            Indeferida
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Cancelada
          </span>
        );
    }
  };

  // Quick preset reasons
  const presetReasons = [
    'Excelente histórico de patrulhamento de mudanças recentes e combate a vandalismo.',
    'Alta postura ética, equilíbrio e cordialidade nas discussões comunitárias.',
    'Compromisso exemplar com as políticas de neutralidade (NPOV) e verificabilidade.',
    'Grande prontidão em auxiliar novos colaboradores na formatação de artigos.',
    'Contra no momento: recomendo maior participação nas discussões gerais antes de assumir o cargo.',
    'Contra: recente envolvimento em reversões precipitadas sem diálogo prévio.',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
      {/* Breadcrumb / Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
            <span>Special:PromotionRequests</span>
            <span>/</span>
            <span>WikiWorldWeb:Pedidos_de_Promoção (RFA)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Vote className="text-purple-600 dark:text-purple-400" size={28} />
            <span>Pedidos de Promoção & Eleições Comunitárias</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Sufrágio transparente para concessão dos estatutos de <strong>Moderador</strong> e{' '}
            <strong>Administrador (Sysop)</strong>. Votação comunitária com teto estrito de até{' '}
            <strong>10 votos válidos</strong> e fundamentação obrigatória de cada parecer.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToAdminCouncil && (
            <button
              onClick={onNavigateToAdminCouncil}
              className="px-3 py-2 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700 text-sm font-semibold flex items-center gap-1.5 transition"
            >
              <Crown size={15} />
              <span>Conselho de Burocratas</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm flex items-center gap-2 shadow-xs transition"
          >
            <Plus size={16} />
            <span>Nova Candidatura / Solicitar</span>
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm transition"
            >
              Voltar ao Hub
            </button>
          )}
        </div>
      </div>

      {/* Community Voting Rules Accordion / Card */}
      <div className="mb-6 p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-purple-950 dark:text-purple-200">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-purple-900 dark:text-purple-100 text-sm">
              Diretrizes Oficiais de Votação (RFA - Requests for Adminship & Moderation):
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-700 dark:text-slate-300">
              <span>• <strong>Teto de Quórum:</strong> Máximo de 10 votos por eleição.</span>
              <span>• <strong>Fundamentação:</strong> Motivo do voto a favor ou contra é obrigatório.</span>
              <span>• <strong>Estatuto de Moderador:</strong> Exige ≥ 60% de aprovação substantiva.</span>
              <span>• <strong>Estatuto de Administrador:</strong> Exige ≥ 75% de aprovação substantiva.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">CANDIDATURAS ATIVAS</span>
            <span className="font-bold text-base text-purple-700 dark:text-purple-300">{activeCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">PROMOÇÕES HOMOLOGADAS</span>
            <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">{approvedCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">VOTOS COMPUTADOS</span>
            <span className="font-bold text-base text-blue-600 dark:text-blue-400">{totalVotesCount}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left List + Right Details & Vote Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filter & Candidatures List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter Bar */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('em_votacao')}
                className={`flex-1 py-1.5 rounded-md text-center transition ${
                  activeTab === 'em_votacao'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Em Votação ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('aprovada')}
                className={`flex-1 py-1.5 rounded-md text-center transition ${
                  activeTab === 'aprovada'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Aprovadas ({approvedCount})
              </button>
              <button
                onClick={() => setActiveTab('todas')}
                className={`flex-1 py-1.5 rounded-md text-center transition ${
                  activeTab === 'todas'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todas ({safeRequestsList.length})
              </button>
            </div>

            {/* Search & Role Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar candidato..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="all">Todos os Cargos</option>
                <option value="moderador">Moderador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          {/* Candidatures List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                <span>Carregando candidaturas...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                <AlertCircle size={28} className="mx-auto mb-2 text-slate-400 opacity-60" />
                <p className="text-sm font-medium">Nenhuma candidatura encontrada neste filtro.</p>
                <button
                  onClick={() => {
                    setActiveTab('todas');
                    setRoleFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = req.id === selectedId;
                const reqVotes = Array.isArray(req.votes) ? req.votes : [];
                const proCount = reqVotes.filter((v) => v && v.vote === 'a_favor').length;
                const contraCount = reqVotes.filter((v) => v && v.vote === 'contra').length;
                const neutroCount = reqVotes.filter((v) => v && v.vote === 'neutro').length;
                const voteCount = reqVotes.length;
                const maxVotes = req.maxVotes || 10;
                const substantive = proCount + contraCount;
                const approvalPct = substantive > 0 ? Math.round((proCount / substantive) * 100) : 0;

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedId(req.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition relative ${
                      isSelected
                        ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-400 dark:border-purple-600 ring-2 ring-purple-400/20 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                          {req.candidateDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {req.candidateDisplayName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              @{req.candidateUsername}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <span>De:</span>
                            {getRoleBadge(req.currentRole)}
                            <span>→ Para:</span>
                            {getRoleBadge(req.targetRole)}
                          </div>
                        </div>
                      </div>

                      <div>{getStatusBadge(req.status)}</div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 italic">
                      "{req.statement}"
                    </p>

                    {/* Voting meter */}
                    <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">
                          Quórum: <strong>{voteCount} / {maxVotes}</strong> votos
                        </span>
                        <span
                          className={`font-bold ${
                            approvalPct >= req.requiredApprovalRate
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {approvalPct}% apoio (Mín: {req.requiredApprovalRate}%)
                        </span>
                      </div>

                      {/* Visual segmented bar */}
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                        {proCount > 0 && (
                          <div
                            style={{ width: `${(proCount / maxVotes) * 100}%` }}
                            className="bg-emerald-500 h-full"
                            title={`${proCount} A Favor`}
                          />
                        )}
                        {contraCount > 0 && (
                          <div
                            style={{ width: `${(contraCount / maxVotes) * 100}%` }}
                            className="bg-rose-500 h-full"
                            title={`${contraCount} Contra`}
                          />
                        )}
                        {neutroCount > 0 && (
                          <div
                            style={{ width: `${(neutroCount / maxVotes) * 100}%` }}
                            className="bg-slate-400 h-full"
                            title={`${neutroCount} Neutro`}
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                          👍 {proCount} a favor
                        </span>
                        <span className="text-rose-700 dark:text-rose-300 font-semibold">
                          👎 {contraCount} contra
                        </span>
                        {neutroCount > 0 && (
                          <span className="text-slate-500">⚖️ {neutroCount} neutro</span>
                        )}
                        <span className="text-slate-400 font-mono">
                          {req.isSelfNomination ? 'Autocandidatura' : `Indicação por @${req.nominatedBy}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Dossier, Community Voting Hall & Admin Homologation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedRequest && selectedStats ? (
            <>
              {/* Dossier Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-serif font-bold text-xl shadow-xs">
                      {selectedRequest.candidateDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {selectedRequest.candidateDisplayName}
                        </h2>
                        <button
                          onClick={() => onNavigateToUser(selectedRequest.candidateUsername)}
                          className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 text-xs font-semibold"
                        >
                          <span>Ver Perfil</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>Cargo Atual: {getRoleBadge(selectedRequest.currentRole)}</span>
                        <span>➔</span>
                        <span>Candidatura a: {getRoleBadge(selectedRequest.targetRole)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {getStatusBadge(selectedRequest.status)}
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      Início: {new Date(selectedRequest.requestedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Nomination Manifesto / Statement */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <FileText size={14} className="text-purple-600" />
                    <span>Manifesto & Motivação da Candidatura:</span>
                  </h3>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {selectedRequest.statement}
                  </div>
                </div>

                {/* Contributions Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-600" />
                    <span>Resumo de Atividades e Histórico na WikiWorldWeb:</span>
                  </h3>
                  <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedRequest.contributionsSummary}
                  </div>
                </div>

                {/* Quorum and Score Meter Box */}
                <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-purple-900 dark:text-purple-200">
                        PROGRESSO DO SUFRÁGIO COMUNITÁRIO
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {selectedStats.totalVotes} de {selectedStats.maxVotes} votos comunitários registrados.
                        {selectedStats.remainingVotes > 0 ? (
                          <strong className="text-purple-700 dark:text-purple-300 ml-1">
                            (Restam {selectedStats.remainingVotes} votos para teto de quórum)
                          </strong>
                        ) : (
                          <strong className="text-emerald-700 dark:text-emerald-300 ml-1">
                            (Quórum máximo de 10 votos atingido!)
                          </strong>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-serif font-black text-slate-900 dark:text-white">
                        {selectedStats.approvalRate}%
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Taxa Mínima: {selectedRequest.requiredApprovalRate}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Multi-Segment Bar */}
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                    {selectedStats.proVotes > 0 && (
                      <div
                        style={{ width: `${(selectedStats.proVotes / selectedStats.maxVotes) * 100}%` }}
                        className="bg-emerald-500 h-full transition-all duration-500"
                        title={`${selectedStats.proVotes} A Favor`}
                      />
                    )}
                    {selectedStats.contraVotes > 0 && (
                      <div
                        style={{ width: `${(selectedStats.contraVotes / selectedStats.maxVotes) * 100}%` }}
                        className="bg-rose-500 h-full transition-all duration-500"
                        title={`${selectedStats.contraVotes} Contra`}
                      />
                    )}
                    {selectedStats.neutroVotes > 0 && (
                      <div
                        style={{ width: `${(selectedStats.neutroVotes / selectedStats.maxVotes) * 100}%` }}
                        className="bg-slate-400 h-full transition-all duration-500"
                        title={`${selectedStats.neutroVotes} Neutro`}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                    <div className="p-2 rounded bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800">
                      👍 {selectedStats.proVotes} A FAVOR
                    </div>
                    <div className="p-2 rounded bg-rose-100/70 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-800">
                      👎 {selectedStats.contraVotes} CONTRA
                    </div>
                    <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700">
                      ⚖️ {selectedStats.neutroVotes} NEUTRO
                    </div>
                  </div>
                </div>

                {/* Resolution Notes (If closed) */}
                {selectedRequest.status !== 'em_votacao' && selectedRequest.resolutionNotes && (
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Scale size={14} className="text-purple-600" />
                        Parecer Oficial de Homologação:
                      </span>
                      <span className="font-mono text-slate-500">
                        Fechado por {selectedRequest.closedBy} em{' '}
                        {selectedRequest.closedAt &&
                          new Date(selectedRequest.closedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                      "{selectedRequest.resolutionNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Live Registered Votes & Motives List */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={18} className="text-purple-600" />
                    <span>Votos e Fundamentações Registradas ({selectedRequest.votes.length} / 10)</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Critério: Transparência Absoluta
                  </span>
                </div>

                {selectedRequest.votes.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    Nenhum voto comunitário registrado ainda. Seja o primeiro a votar abaixo!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {selectedRequest.votes.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                          v.vote === 'a_favor'
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                            : v.vote === 'contra'
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                            <button
                              onClick={() => onNavigateToUser(v.voterUsername)}
                              className="font-bold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 hover:underline flex items-center gap-1"
                            >
                              <span>{v.voterDisplayName}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-normal">
                                (@{v.voterUsername})
                              </span>
                            </button>
                            {getRoleBadge(v.voterRole)}
                          </div>

                          <div className="flex items-center gap-2">
                            {v.vote === 'a_favor' && (
                              <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                                👍 A Favor
                              </span>
                            )}
                            {v.vote === 'contra' && (
                              <span className="px-2 py-0.5 rounded font-bold bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                                👎 Contra
                              </span>
                            )}
                            {v.vote === 'neutro' && (
                              <span className="px-2 py-0.5 rounded font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                ⚖️ Neutro
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(v.timestamp).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        {/* Motive / Rationale */}
                        <div className="pl-6 border-l-2 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 italic leading-relaxed">
                          "{v.reason}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Vote Submission Box */}
              {selectedRequest.status === 'em_votacao' && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-700 shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Vote className="text-purple-600" size={20} />
                      <span>Registrar seu Voto Comunitário</span>
                    </h3>
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-mono font-bold">
                      {selectedStats.totalVotes} / {selectedStats.maxVotes} Votos
                    </span>
                  </div>

                  {!currentUser || currentUser.isGuest ? (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-3">
                      <AlertCircle size={20} className="shrink-0 text-amber-600" />
                      <span>
                        Você precisa estar logado com uma conta registrada para votar nesta eleição comunitária.
                      </span>
                    </div>
                  ) : currentUser.isBanned ? (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-center gap-3">
                      <Lock size={20} className="shrink-0 text-rose-600" />
                      <span>Sua conta possui sanção ativa ou suspensão e não possui direito a voto.</span>
                    </div>
                  ) : selectedStats.isQuorumReached &&
                    !selectedRequest.votes.some((v) => v.voterUid === currentUser.uid) ? (
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-3">
                      <Info size={20} className="shrink-0 text-slate-500" />
                      <span>
                        Esta eleição atingiu o limite máximo estrito de 10 votos comunitários e o quórum está
                        encerrado. Aguarde a homologação pelos burocratas.
                      </span>
                    </div>
                  ) : (
                    <form onSubmit={handleCastVote} className="space-y-4">
                      {voteMessage && (
                        <div
                          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                            voteMessage.type === 'success'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300'
                          }`}
                        >
                          {voteMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                          <span>{voteMessage.text}</span>
                        </div>
                      )}

                      {/* Vote Buttons Selector */}
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedVoteType('a_favor')}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                            selectedVoteType === 'a_favor'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400/40 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <ThumbsUp size={20} />
                          <span className="text-xs">A Favor (Apoio)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedVoteType('contra')}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                            selectedVoteType === 'contra'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-400/40 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <ThumbsDown size={20} />
                          <span className="text-xs">Contra (Oposição)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedVoteType('neutro')}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                            selectedVoteType === 'neutro'
                              ? 'bg-slate-700 text-white border-slate-700 shadow-xs ring-2 ring-slate-400/40 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Scale size={20} />
                          <span className="text-xs">Neutro / Abstenção</span>
                        </button>
                      </div>

                      {/* Motive / Justification Input */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Motivo / Fundamentação do seu voto (Obrigatório):
                        </label>
                        <textarea
                          rows={3}
                          value={voteReason}
                          onChange={(e) => setVoteReason(e.target.value)}
                          placeholder={`Explique com respeito e clareza por que você é ${
                            selectedVoteType === 'a_favor'
                              ? 'A FAVOR da promoção'
                              : selectedVoteType === 'contra'
                              ? 'CONTRA a promoção'
                              : 'NEUTRO nesta candidatura'
                          } do usuário...`}
                          className="w-full p-3 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>Mínimo 8 caracteres</span>
                          <span>{voteReason.length} caracteres</span>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-500 font-medium">
                          Sugestões de justificativas rápidas:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {presetReasons.map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setVoteReason(preset)}
                              className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300 transition text-left"
                            >
                              + {preset.slice(0, 45)}...
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmittingVote || voteReason.trim().length < 8}
                          className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                        >
                          {isSubmittingVote ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Registrando Voto no Banco de Dados...</span>
                            </>
                          ) : (
                            <>
                              <Check size={16} />
                              <span>Confirmar e Registrar Voto Comunitário</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Administrative Homologation Panel (Bureaucrats & Admins) */}
              {isAdminOrBureaucrat && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-purple-800">
                    <div className="flex items-center gap-2">
                      <Crown className="text-amber-400" size={22} />
                      <div>
                        <h3 className="font-serif font-bold text-base">
                          Painel Burocrático de Homologação
                        </h3>
                        <p className="text-xs text-purple-200">
                          Exclusivo para Administradores e Mantenedores
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 rounded bg-purple-800 text-purple-200">
                      Burocrata
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="text-purple-100">
                      Ao homologar a aprovação, o sistema automaticamente atualizará o cargo de{' '}
                      <strong>{selectedRequest.candidateDisplayName}</strong> para{' '}
                      <strong className="text-amber-300 uppercase">{selectedRequest.targetRole}</strong>,
                      concederá a medalha oficial de estatuto e enviará a notificação formal de posse na
                      página de discussão do titular.
                    </p>

                    <div className="space-y-1">
                      <label className="block font-mono text-purple-200 font-bold">
                        Parecer do Burocrata / Motivação da Decisão:
                      </label>
                      <textarea
                        rows={2}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder={`Ex: Candidatura homologada com êxito após atingir quórum comunitário favorável (${selectedStats.proVotes} votos a favor).`}
                        className="w-full p-2.5 rounded-lg text-xs bg-purple-950/80 border border-purple-700 text-white placeholder-purple-400 focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => handleConcludeElection('aprovada')}
                        disabled={isResolving}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        <span>Homologar Promoção (Promover Usuário)</span>
                      </button>

                      <button
                        onClick={() => handleConcludeElection('rejeitada')}
                        disabled={isResolving}
                        className="py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        <span>Indeferir Candidatura</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
              <Vote size={36} className="mx-auto mb-3 opacity-50 text-purple-600" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                Selecione uma candidatura à esquerda
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Visualize os detalhes do candidato, acompanhe a apuração de até 10 votos e registre sua fundamentação.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Candidature Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Vote className="text-purple-600 dark:text-purple-400" size={24} />
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                  Nova Candidatura para Promoção (RFA)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {newError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-xs border border-rose-300 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{newError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              {/* Nomination Type */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Tipo de Indicação:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNominationType('self')}
                    className={`py-2 px-3 rounded-lg border text-center font-semibold transition ${
                      nominationType === 'self'
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Autocandidatura (Candidatar a mim mesmo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNominationType('other')}
                    className={`py-2 px-3 rounded-lg border text-center font-semibold transition ${
                      nominationType === 'other'
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Indicação de Terceiro (Indicar outro editor)
                  </button>
                </div>
              </div>

              {/* If nominating another user */}
              {nominationType === 'other' && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Selecione o Usuário da Comunidade:
                  </label>
                  <select
                    value={nominatedUserUid}
                    onChange={(e) => setNominatedUserUid(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Selecione um usuário --</option>
                    {(communityUsers || [])
                      .filter((u) => u && u.uid !== currentUser?.uid && !u.isBanned)
                      .map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName || u.username} (@{u.username}) - Cargo atual: {u.role}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Target Role */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Cargo Alvo Pretendido:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetRole('moderador')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                      targetRole === 'moderador'
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Shield className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <div className="font-bold">Moderador</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Proteção de páginas, reversão rápida, mediação de conflitos e alertas. Quórum: ≥60%.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetRole('admin')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                      targetRole === 'admin'
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Crown className="text-purple-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <div className="font-bold">Administrador (Sysop)</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Exclusão definitiva, retificação LGPD, auditoria de permissões e infraestrutura. Quórum: ≥75%.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Statement */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Justificativa da Candidatura & Manifesto:
                </label>
                <textarea
                  rows={4}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Apresente os motivos da candidatura, planos para a atuação com as ferramentas do cargo e compromisso com as regras da WikiWorldWeb..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Contributions Summary */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Resumo de Contribuições & Experiência:
                </label>
                <textarea
                  rows={3}
                  value={contributionsSummary}
                  onChange={(e) => setContributionsSummary(e.target.value)}
                  placeholder="Ex: Membro há 6 meses, mais de 300 edições, criação de verbetes estruturais, participação em discussões de consenso..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-xs"
                >
                  {isSubmittingNew ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Submetendo Candidatura...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Abrir Votação Comunitária</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
