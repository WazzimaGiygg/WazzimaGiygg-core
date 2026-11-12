import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2,
  FileText,
  UserX,
  Lock,
  Check,
  X,
  Scale,
  Sparkles,
  Info,
  ChevronRight,
  Download,
  Copy,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileCode,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, LgpdAccountDeletionRequest } from '../types';
import { StorageService } from '../services/storageService';

interface AdminDataRemovalRequestsViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser?: (username: string) => void;
  onNavigateToUsersList?: () => void;
  onBack?: () => void;
}

type StatusFilter = 'all' | 'pendente' | 'executada' | 'rejeitada' | 'cancelada';
type SortOption = 'date_desc' | 'date_asc' | 'name_asc';

export const AdminDataRemovalRequestsView: React.FC<AdminDataRemovalRequestsViewProps> = ({
  currentUser,
  onNavigateToUser,
  onNavigateToUsersList,
  onBack,
}) => {
  const [requests, setRequests] = useState<LgpdAccountDeletionRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Execution Modal state
  const [targetRequestForExecution, setTargetRequestForExecution] = useState<LgpdAccountDeletionRequest | null>(null);
  const [genericPseudonymPreset, setGenericPseudonymPreset] = useState('Usuário Anonimizado (LGPD)');
  const [customPseudonymInput, setCustomPseudonymInput] = useState('');
  const [deletionJustificationPreset, setDeletionJustificationPreset] = useState(
    'Atendimento à solicitação formal do titular para eliminação definitiva de dados pessoais (Art. 18, VI da LGPD - Lei nº 13.709/2018)'
  );
  const [customDeletionJustification, setCustomDeletionJustification] = useState('');
  const [isProcessingExecution, setIsProcessingExecution] = useState(false);
  const [executionFeedback, setExecutionFeedback] = useState<{
    msg: string;
    type: 'success' | 'error';
    details?: {
      articlesUpdated: number;
      revisionsUpdated: number;
      genericPseudonym: string;
    };
  } | null>(null);

  // Rejection Modal state
  const [targetRequestForRejection, setTargetRequestForRejection] = useState<LgpdAccountDeletionRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isProcessingRejection, setIsProcessingRejection] = useState(false);

  const isRealAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const loadData = async () => {
    setIsLoading(true);
    const [fetchedRequests, fetchedUsers] = await Promise.all([
      StorageService.getLgpdDeletionRequests(),
      StorageService.getCommunityUsers(),
    ]);
    setRequests(fetchedRequests);
    setUsers(fetchedUsers);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = requests.length;
    const pendentes = requests.filter((r) => r.status === 'pendente').length;
    const executadas = requests.filter((r) => r.status === 'executada').length;
    const rejeitadas = requests.filter((r) => r.status === 'rejeitada' || r.status === 'cancelada').length;
    return { total, pendentes, executadas, rejeitadas };
  }, [requests]);

  // Filtered & Sorted Requests
  const filteredRequests = useMemo(() => {
    return requests
      .filter((req) => {
        if (statusFilter !== 'all' && req.status !== statusFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = (req.originalDisplayName || '').toLowerCase().includes(q);
          const matchesUsername = (req.originalUsername || '').toLowerCase().includes(q);
          const matchesEmail = (req.originalEmail || '').toLowerCase().includes(q);
          const matchesUid = (req.userUid || '').toLowerCase().includes(q);
          const matchesId = (req.id || '').toLowerCase().includes(q);
          const matchesReason = (req.userReason || '').toLowerCase().includes(q);
          return matchesName || matchesUsername || matchesEmail || matchesUid || matchesId || matchesReason;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
        }
        if (sortBy === 'name_asc') {
          return (a.originalDisplayName || '').localeCompare(b.originalDisplayName || '');
        }
        return 0;
      });
  }, [requests, statusFilter, searchQuery, sortBy]);

  // Handlers for Execution Modal
  const handleOpenExecutionModal = (req: LgpdAccountDeletionRequest) => {
    setTargetRequestForExecution(req);
    setGenericPseudonymPreset(req.userUid);
    setCustomPseudonymInput(req.userUid);
    setDeletionJustificationPreset(
      'Atendimento à solicitação formal do titular para eliminação definitiva de dados pessoais (Art. 18, VI da LGPD - Lei nº 13.709/2018). Autoria atribuída ao UID Google.'
    );
    setCustomDeletionJustification('');
    setExecutionFeedback(null);
  };

  const handleExecuteDeletion = async () => {
    if (!targetRequestForExecution) return;
    const finalPseudonym =
      genericPseudonymPreset === 'custom'
        ? customPseudonymInput.trim() || targetRequestForExecution.userUid
        : targetRequestForExecution.userUid;
    const finalJustification =
      deletionJustificationPreset === 'custom'
        ? customDeletionJustification.trim() || 'Eliminação definitiva de dados pessoais sob Art. 18, VI da LGPD'
        : deletionJustificationPreset;

    setIsProcessingExecution(true);
    setExecutionFeedback(null);

    try {
      const res = await StorageService.executeAdminUserDeletionLGPD({
        targetUid: targetRequestForExecution.userUid,
        requestId: targetRequestForExecution.id,
        genericPseudonym: finalPseudonym,
        legalJustification: finalJustification,
        adminUser: currentUser,
      });

      if (res.success) {
        setExecutionFeedback({
          msg: res.message,
          type: 'success',
          details: {
            articlesUpdated: res.articlesUpdated,
            revisionsUpdated: res.revisionsUpdated,
            genericPseudonym: res.genericPseudonym,
          },
        });
        await loadData();
        setTimeout(() => {
          setTargetRequestForExecution(null);
        }, 1500);
      } else {
        setExecutionFeedback({
          msg: res.message || 'Erro ao processar exclusão e anonimização.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setExecutionFeedback({
        msg: `Falha na execução: ${err?.message || 'Erro desconhecido'}`,
        type: 'error',
      });
    } finally {
      setIsProcessingExecution(false);
    }
  };

  // Handlers for Rejection Modal
  const handleOpenRejectionModal = (req: LgpdAccountDeletionRequest) => {
    setTargetRequestForRejection(req);
    setRejectionReasonInput('');
  };

  const handleConfirmRejection = async () => {
    if (!targetRequestForRejection) return;
    setIsProcessingRejection(true);

    try {
      const res = await StorageService.rejectLgpdDeletionRequest(
        targetRequestForRejection.id,
        rejectionReasonInput.trim() ||
          'Solicitação arquivada pela administração com base nas diretrizes de governança da comunidade.',
        currentUser
      );

      if (res.success) {
        await loadData();
        setTargetRequestForRejection(null);
      }
    } catch (err) {
      console.error('Erro ao rejeitar solicitação:', err);
    } finally {
      setIsProcessingRejection(false);
    }
  };

  // Export functions (JSON / CSV for DPO audit)
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(requests, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wikizero_pedidos_remocao_dados_lgpd_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportFeedback('Relatório exportado em JSON com sucesso!');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  const handleExportCsv = () => {
    const headers = ['ID_Protocolo', 'Status', 'Data_Solicitacao', 'Nome_Original', 'Email_Original', 'Google_UID', 'Motivo_Usuario', 'Pseudonimo_Atribuido', 'Processado_Por', 'Data_Processamento'];
    const rows = requests.map((r) => [
      `"${r.id}"`,
      `"${r.status}"`,
      `"${r.requestedAt}"`,
      `"${(r.originalDisplayName || '').replace(/"/g, '""')}"`,
      `"${(r.originalEmail || '').replace(/"/g, '""')}"`,
      `"${r.userUid}"`,
      `"${(r.userReason || '').replace(/"/g, '""')}"`,
      `"${(r.genericPseudonymAssigned || '').replace(/"/g, '""')}"`,
      `"${(r.processedByName || '').replace(/"/g, '""')}"`,
      `"${r.processedAt || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `wikizero_pedidos_remocao_dados_lgpd_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportFeedback('Relatório exportado em CSV com sucesso!');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center gap-1 font-semibold"
            >
              <ArrowLeft size={14} />
              <span>Voltar</span>
            </button>
          )}
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>Especial:PedidosRemocaoDados</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">LGPD Art. 18, VI</span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToUsersList && (
            <button
              onClick={onNavigateToUsersList}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <Layers size={12} className="text-purple-600 dark:text-purple-400" />
              <span>Diretório de Usuários</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
          >
            <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-red-600' : ''} />
            <span>{isRefreshing ? 'Atualizando...' : 'Recarregar'}</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif-heading font-bold text-slate-900 dark:text-white">
                  Painel de Pedidos de Remoção de Dados
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  LGPD Art. 18, VI
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Marco Civil
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Fila de governança e homologação de solicitações dos titulares de dados para exclusão de conta,
                eliminação perene de informações cadastrais e substituição retroativa da autoria de contribuições
                por um nome genérico neutro.
              </p>
            </div>
          </div>

          {/* Export Dropdown / Actions */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={handleExportJson}
              title="Exportar dados em formato JSON"
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <FileCode size={13} className="text-blue-600" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleExportCsv}
              title="Exportar planilha CSV para relatório DPO"
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <FileSpreadsheet size={13} className="text-emerald-600" />
              <span>CSV (DPO)</span>
            </button>
          </div>
        </div>

        {/* Legal & Technical Framework Guidance Box */}
        <div className="mt-4 p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-blue-950 dark:text-blue-100">
            <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Garantias Jurídicas, Preservação do Google UID & Anonimização (Lei nº 13.709/2018)</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            • <strong>Expurgo dos Dados Cadastrais:</strong> E-mail, nome real, foto de perfil, biografia e metadados de sessão são irrevogavelmente removidos do banco.
            <br />
            • <strong>Retenção Estrita do Google UID:</strong> O UID Google originado na autenticação OAuth é mantido exclusivamente como registro criptográfico de segurança. Caso a pessoa retorne e faça novo login com o Google, o sistema reconhece a identidade, inicia uma conta limpa e impede a re-vinculação às contribuições passadas.
            <br />
            • <strong>Pseudonimização Institucional:</strong> Os verbetes e o histórico de edições do titular permanecem íntegros no patrimônio livre da enciclopédia sob a assinatura neutra definida pelo Administrador (ex: <em>"Usuário Anonimizado (LGPD)"</em>).
          </p>
        </div>

        {/* Export Feedback notification */}
        {exportFeedback && (
          <div className="mt-3 p-2 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
        )}

        {/* Interactive KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-lg border text-left transition cursor-pointer ${
              statusFilter === 'all'
                ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total de Pedidos
            </div>
            <div className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white mt-0.5">
              {kpis.total}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Todos os Registros</div>
          </button>

          <button
            onClick={() => setStatusFilter('pendente')}
            className={`p-3 rounded-lg border text-left transition cursor-pointer ${
              statusFilter === 'pendente'
                ? 'border-red-600 bg-red-50/70 dark:bg-red-950/50 ring-1 ring-red-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Pendentes</span>
              {kpis.pendentes > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
            </div>
            <div className="text-xl font-bold font-serif-heading text-red-600 dark:text-red-400 mt-0.5">
              {kpis.pendentes}
            </div>
            <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">Aguardando Avaliação</div>
          </button>

          <button
            onClick={() => setStatusFilter('executada')}
            className={`p-3 rounded-lg border text-left transition cursor-pointer ${
              statusFilter === 'executada'
                ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 ring-1 ring-emerald-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Executadas
            </div>
            <div className="text-xl font-bold font-serif-heading text-emerald-600 dark:text-emerald-400 mt-0.5">
              {kpis.executadas}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Anonimizadas com Êxito</div>
          </button>

          <button
            onClick={() => setStatusFilter('rejeitada')}
            className={`p-3 rounded-lg border text-left transition cursor-pointer ${
              statusFilter === 'rejeitada'
                ? 'border-slate-600 bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rejeitadas / Canceladas
            </div>
            <div className="text-xl font-bold font-serif-heading text-slate-700 dark:text-slate-300 mt-0.5">
              {kpis.rejeitadas}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Histórico Arquivado</div>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por titular, e-mail, Google UID ou protocolo..."
            className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-red-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            {(['all', 'pendente', 'executada', 'rejeitada'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded transition cursor-pointer font-bold ${
                  statusFilter === st
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st === 'all'
                  ? 'Todas'
                  : st === 'pendente'
                  ? 'Pendentes'
                  : st === 'executada'
                  ? 'Executadas'
                  : 'Rejeitadas'}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs outline-none"
          >
            <option value="date_desc">Mais Recentes</option>
            <option value="date_asc">Mais Antigas</option>
            <option value="name_asc">Nome do Titular (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
            <RefreshCw size={24} className="animate-spin text-red-600 mx-auto mb-2" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Carregando pedidos de remoção de dados...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-10 text-center space-y-2">
            <ShieldCheck size={36} className="mx-auto text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Nenhuma solicitação de remoção encontrada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {statusFilter === 'pendente'
                ? 'Todas as solicitações de exclusão sob a LGPD foram processadas e homologadas pela administração.'
                : 'Não há registros com os termos de busca e filtros selecionados.'}
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const matchedUser = users.find((u) => u.uid === req.userUid);
            const isPending = req.status === 'pendente';
            const isExecuted = req.status === 'executada';

            return (
              <div
                key={req.id}
                className={`bg-white dark:bg-slate-900 border rounded-lg p-4 sm:p-5 shadow-xs transition space-y-3.5 ${
                  isPending
                    ? 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-400/30'
                    : isExecuted
                    ? 'border-emerald-200 dark:border-emerald-800/60'
                    : 'border-slate-200 dark:border-slate-800 opacity-85'
                }`}
              >
                {/* Header Row: Protocol ID, Status, Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${
                        isPending
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                          : isExecuted
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isPending
                        ? '⏳ Pendente de Execução'
                        : isExecuted
                        ? '✓ Executada & Anonimizada'
                        : `✕ ${req.status === 'cancelada' ? 'Cancelada pelo Titular' : 'Rejeitada'}`}
                    </span>

                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Protocolo: <strong className="text-slate-800 dark:text-slate-200">{req.id}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <Calendar size={12} />
                    <span>Solicitado em: {new Date(req.requestedAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                {/* Details Grid: User Identity & Reason */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: User Identity Info */}
                  <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-200 dark:border-slate-700/80">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>Titular Solicitante:</span>
                      {matchedUser && onNavigateToUser && (
                        <button
                          onClick={() => onNavigateToUser(matchedUser.displayName || matchedUser.username || matchedUser.uid)}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Ver Perfil <ExternalLink size={10} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Nome Cadastral:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-sans">
                        {req.originalDisplayName}
                      </span>
                    </div>

                    {req.originalEmail && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">E-mail:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono truncate max-w-[200px]">
                          {req.originalEmail}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Google UID (Preservado):</span>
                      <div className="flex items-center gap-1 font-mono">
                        <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded text-[10px] truncate max-w-[160px]">
                          {req.userUid}
                        </code>
                        <button
                          onClick={() => handleCopyUid(req.userUid)}
                          className="text-slate-400 hover:text-blue-600 transition"
                          title="Copiar Google UID"
                        >
                          {copiedUid === req.userUid ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Justification & Reason */}
                  <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-200 dark:border-slate-700/80">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Motivo / Declaração Informada pelo Titular:
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900/60 p-2.5 rounded border border-slate-200 dark:border-slate-700 leading-relaxed">
                      "{req.userReason || 'Solicitação formal de eliminação de dados (LGPD Art. 18, VI).'}"
                    </p>
                  </div>
                </div>

                {/* Execution Details (if executed) */}
                {isExecuted && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded border border-emerald-200 dark:border-emerald-800/80 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 font-mono text-[11px]">
                      <CheckCircle2 size={14} />
                      <span>Procedimento de Exclusão Concluído com Sucesso</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-sans text-[11px]">
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-mono">
                          Pseudônimo Atribuído:
                        </span>
                        <strong className="text-slate-900 dark:text-white">
                          {req.genericPseudonymAssigned || 'Usuário Anonimizado (LGPD)'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-mono">
                          Homologado Por:
                        </span>
                        <span>{req.processedByName || 'Administrador'}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-mono">
                          Data da Execução:
                        </span>
                        <span>{req.processedAt ? new Date(req.processedAt).toLocaleString('pt-BR') : '-'}</span>
                      </div>
                    </div>

                    {req.contributionsAnonymizedCount && (
                      <div className="pt-1 text-[10px] text-emerald-800 dark:text-emerald-300 border-t border-emerald-200 dark:border-emerald-800/60">
                        • Verbetes criados anonimizados: <strong>{req.contributionsAnonymizedCount.articlesCreated}</strong> | 
                        • Revisões de histórico atualizadas: <strong>{req.contributionsAnonymizedCount.revisionsUpdated}</strong> | 
                        • Registros de edições recentes: <strong>{req.contributionsAnonymizedCount.recentChangesUpdated || 0}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Details (if rejected) */}
                {req.status === 'rejeitada' && req.rejectionReason && (
                  <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">
                    <span className="font-bold block text-[11px]">Justificativa da Rejeição:</span>
                    <p className="text-[11px] mt-0.5">"{req.rejectionReason}"</p>
                    <span className="text-[10px] text-rose-700 dark:text-rose-400 font-mono block mt-1">
                      Avaliador: {req.processedByName} em {req.processedAt ? new Date(req.processedAt).toLocaleString('pt-BR') : '-'}
                    </span>
                  </div>
                )}

                {/* Admin Actions Bar (for Pending requests) */}
                {isPending && isRealAdmin && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenRejectionModal(req)}
                      className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                    >
                      <X size={13} />
                      <span>Rejeitar Solicitação</span>
                    </button>

                    <button
                      onClick={() => handleOpenExecutionModal(req)}
                      className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      <span>Executar Anonimização (Substituir Nome pelo UID Google)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Execution Modal */}
      {targetRequestForExecution && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 text-xs flex flex-col max-h-[90vh]">
            <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono">
                <ShieldAlert size={18} className="text-red-400" />
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider">
                    Executar Exclusão Definitiva de Conta (LGPD Art. 18, VI)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Eliminação de Dados Pessoais & Substituição por Identificador Genérico
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTargetRequestForExecution(null);
                  setExecutionFeedback(null);
                }}
                className="text-white/70 hover:text-white p-0.5 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto">
              {/* User summary card */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                  <span className="text-slate-500 font-mono text-[11px]">Titular:</span>
                  <strong className="text-slate-900 dark:text-white font-sans">
                    {targetRequestForExecution.originalDisplayName}
                  </strong>
                </div>
                {targetRequestForExecution.originalEmail && (
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                    <span className="text-slate-500 font-mono text-[11px]">E-mail:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                      {targetRequestForExecution.originalEmail}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-mono text-[11px]">Google UID (Preservado):</span>
                  <code className="text-blue-600 dark:text-blue-400 font-mono text-[11px] bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded">
                    {targetRequestForExecution.userUid}
                  </code>
                </div>
              </div>

              {/* Callout: Preservação Preventiva */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-300 dark:border-amber-800/80 text-[11px] text-amber-900 dark:text-amber-200 space-y-1 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-amber-950 dark:text-amber-100 font-mono text-[11px] uppercase">
                  <AlertTriangle size={13} className="text-amber-600" />
                  <span>Preservação Estrita do Google UID para Identificação Preventiva</span>
                </div>
                <p>
                  Todos os dados pessoais do titular serão expurgados. O <strong>Google UID</strong> continuará retido exclusivamente para que, caso esta conta Google tente novo login ou cadastro no futuro, o sistema identifique preventivamente e mantenha o acervo passado anonimizado e desassociado.
                </p>
              </div>

              {/* Pseudônimo / UID Google */}
              {/* Opção de Anonimização / Substituição pelo UID Google */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Opção de Anonimização (LGPD Art. 18, VI):
                </label>
                <select
                  value={genericPseudonymPreset}
                  onChange={(e) => {
                    setGenericPseudonymPreset(e.target.value);
                    if (e.target.value === 'custom' && !customPseudonymInput) {
                      setCustomPseudonymInput(targetRequestForExecution.userUid);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono focus:ring-1 focus:ring-red-500"
                >
                  <option value={targetRequestForExecution.userUid}>
                    Anonimização: Substituir Nome de Usuário pelo UID Google ({targetRequestForExecution.userUid}) [Padrão LGPD]
                  </option>
                  <option value="custom">Outro Identificador Personalizado...</option>
                </select>

                {genericPseudonymPreset !== 'custom' ? (
                  <div className="mt-1.5 p-2 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-800/60 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-1.5 leading-relaxed">
                    <CheckCircle2 size={13} className="text-blue-600 mt-0.5 shrink-0" />
                    <span>
                      <strong>Anonimização Ativa:</strong> O nome cadastral de <strong>{targetRequestForExecution.originalDisplayName}</strong> será substituído estritamente pelo seu UID Google (<code>{targetRequestForExecution.userUid}</code>) em todo o perfil, histórico e artigos.
                    </span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={customPseudonymInput}
                    onChange={(e) => setCustomPseudonymInput(e.target.value)}
                    placeholder={`Ex: ${targetRequestForExecution.userUid}`}
                    className="mt-1.5 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono"
                  />
                )}
              </div>

              {/* Justificativa Legal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fundamento Legal / Justificativa Administrativa:
                </label>
                <select
                  value={deletionJustificationPreset}
                  onChange={(e) => setDeletionJustificationPreset(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                >
                  <option value="Atendimento à solicitação formal do titular para eliminação definitiva de dados pessoais (Art. 18, VI da LGPD - Lei nº 13.709/2018)">
                    Atendimento à solicitação do titular (Art. 18, VI LGPD)
                  </option>
                  <option value="Minimização e eliminação definitiva de dados pessoais sob diretriz de privacidade (Art. 6º, III e Art. 18 LGPD)">
                    Minimização e eliminação de dados (Art. 6º, III e Art. 18 LGPD)
                  </option>
                  <option value="Requisição formal atendida pelo Encarregado de Proteção de Dados (DPO / Marco Civil)">
                    Requisição formal atendida pelo DPO
                  </option>
                  <option value="custom">Outra Justificativa (Personalizada)...</option>
                </select>

                {deletionJustificationPreset === 'custom' && (
                  <textarea
                    value={customDeletionJustification}
                    onChange={(e) => setCustomDeletionJustification(e.target.value)}
                    placeholder="Descreva o fundamento administrativo ou número do protocolo DPO..."
                    rows={2}
                    className="mt-1.5 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                  />
                )}
              </div>

              {/* Checklist */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] uppercase font-mono">
                  Ações que serão executadas:
                </span>
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <Check size={12} />
                  <span>Eliminação de nome, e-mail, biografia e foto de perfil.</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                  <Check size={12} />
                  <span>Preservação exclusiva do Google UID ({targetRequestForExecution.userUid}).</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                  <Check size={12} />
                  <span>Substituição retroativa do nome em todos os artigos e histórico de edições.</span>
                </div>
              </div>

              {/* Execution Feedback */}
              {executionFeedback && (
                <div
                  className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
                    executionFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {executionFeedback.type === 'success' ? (
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertTriangle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">{executionFeedback.msg}</span>
                    {executionFeedback.details && (
                      <span className="text-[10px] font-mono block mt-1">
                        Verbetes atualizados: {executionFeedback.details.articlesUpdated} | Revisões atualizadas: {executionFeedback.details.revisionsUpdated}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetRequestForExecution(null);
                  setExecutionFeedback(null);
                }}
                disabled={isProcessingExecution}
                className="px-3 py-1.5 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDeletion}
                disabled={isProcessingExecution}
                className="px-4 py-1.5 text-xs rounded bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessingExecution ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                <span>Confirmar e Executar Exclusão Definitiva</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {targetRequestForRejection && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95 text-xs">
            <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono">
                <X size={16} className="text-rose-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Rejeitar Solicitação de Exclusão LGPD
                </h3>
              </div>
              <button
                onClick={() => setTargetRequestForRejection(null)}
                className="text-white/70 hover:text-white p-0.5 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Informe o fundamento jurídico ou administrativo para a rejeição da solicitação protocolada por{' '}
                <strong className="text-slate-900 dark:text-white">{targetRequestForRejection.originalDisplayName}</strong>{' '}
                (Protocolo: {targetRequestForRejection.id}).
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Justificativa Administrativa da Rejeição:
                </label>
                <textarea
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Ex: Requerimento duplicado, conta em litígio de governança ou ausência de comprovação de titularidade..."
                  rows={3}
                  className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTargetRequestForRejection(null)}
                className="px-3 py-1.5 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={isProcessingRejection}
                className="px-4 py-1.5 text-xs rounded bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessingRejection ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <X size={13} />
                )}
                <span>Confirmar Rejeição</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
