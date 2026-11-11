import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Crown,
  Users,
  Award,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  FileText,
  Scale,
  Vote,
  UserCheck,
  UserX,
  UserCog,
  Download,
  BookOpen,
  Info,
  ChevronRight,
  Check,
  X,
  Sparkles,
  SlidersHorizontal,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Gavel,
  History,
  ShieldAlert,
  Flame,
  UserCheck2,
  Terminal,
} from 'lucide-react';
import { UserProfile, UserRole, UserAuditLog, PromotionRequest } from '../types';
import { StorageService } from '../services/storageService';

interface AdminCouncilViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser: (identifier: string) => void;
  onNavigateToCheckUser?: (username: string) => void;
  onNavigateToUnblockRequests?: () => void;
  onNavigateToPromotionRequests?: () => void;
  onNavigateToUsersList?: () => void;
  onNavigateToArbitration?: () => void;
  onNavigateToUCoC?: () => void;
  onBack?: () => void;
}

type CouncilTab = 'overview' | 'bureaucrats' | 'moderators' | 'sanctions' | 'audit' | 'charter';

export const AdminCouncilView: React.FC<AdminCouncilViewProps> = ({
  currentUser,
  onNavigateToUser,
  onNavigateToCheckUser,
  onNavigateToUnblockRequests,
  onNavigateToPromotionRequests,
  onNavigateToUsersList,
  onNavigateToArbitration,
  onNavigateToUCoC,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<CouncilTab>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Flag modification modal / drawer
  const [selectedUserForFlag, setSelectedUserForFlag] = useState<UserProfile | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('moderador');
  const [flagJustification, setFlagJustification] = useState<string>('');
  const [isSubmittingFlag, setIsSubmittingFlag] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quick Sanction Modal
  const [selectedUserForBan, setSelectedUserForBan] = useState<UserProfile | null>(null);
  const [banType, setBanType] = useState<'temporario' | 'permanente' | 'advertencia'>('temporario');
  const [banDurationDays, setBanDurationDays] = useState<number>(7);
  const [banReason, setBanReason] = useState<string>('');
  const [isSubmittingBan, setIsSubmittingBan] = useState<boolean>(false);

  const isOperator =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'moderador' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const isBureaucratOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [allUsers, reqs] = await Promise.all([
        StorageService.getCommunityUsers(),
        StorageService.getPromotionRequests(),
      ]);
      setUsers(allUsers);
      setPromotionRequests(reqs);

      // Audit logs
      const rawLogs = StorageService.getUserAuditLogs();
      setAuditLogs(rawLogs);
    } catch (err) {
      console.error('[AdminCouncilView] Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const bureaucratsAndAdmins = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === 'admin' ||
        u.email === 'pedrohenriquecardonaperes@gmail.com' ||
        (u.group && u.group.toLowerCase().includes('burocrata'))
    );
  }, [users]);

  const moderators = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === 'moderador' ||
        (u.group && (u.group.toLowerCase().includes('moderador') || u.group.toLowerCase().includes('eliminador')))
    );
  }, [users]);

  const bannedUsers = useMemo(() => {
    return users.filter((u) => u.isBanned);
  }, [users]);

  const pendingPromotions = useMemo(() => {
    return promotionRequests.filter((r) => r.status === 'em_votacao');
  }, [promotionRequests]);

  // Handle Role / Flag Change
  const handleApplyRoleChange = async () => {
    if (!selectedUserForFlag) return;
    if (!flagJustification.trim()) {
      setActionFeedback({
        type: 'error',
        message: 'A fundamentação legal e comunitária é estritamente obrigatória para alteração de cargo.',
      });
      return;
    }

    setIsSubmittingFlag(true);
    try {
      await StorageService.updateUserRole(selectedUserForFlag.uid, targetRole, currentUser);

      // Log detailed bureaucrat audit
      StorageService.logUserAuditAction(
        selectedUserForFlag.uid,
        selectedUserForFlag.displayName || selectedUserForFlag.username || selectedUserForFlag.uid,
        'role_change',
        `[Conselho de Governança] Cargo modificado de "${selectedUserForFlag.role}" para "${targetRole}". Motivação: ${flagJustification.trim()}. Operador: ${currentUser?.displayName || currentUser?.email || 'Burocrata'}.`,
        currentUser
      );

      setActionFeedback({
        type: 'success',
        message: `Cargo de "${selectedUserForFlag.displayName || selectedUserForFlag.username}" atualizado com sucesso para "${targetRole}".`,
      });

      setSelectedUserForFlag(null);
      setFlagJustification('');
      await loadData();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Falha ao atualizar direitos técnicos do usuário.',
      });
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  // Handle Sanction / Ban Application
  const handleApplySanction = async () => {
    if (!selectedUserForBan) return;
    if (!banReason.trim()) {
      setActionFeedback({
        type: 'error',
        message: 'É indispensável registrar o motivo detalhado para aplicação da sanção.',
      });
      return;
    }

    setIsSubmittingBan(true);
    try {
      await StorageService.banUser(
        selectedUserForBan.uid,
        banReason.trim(),
        banType,
        banType === 'temporario' ? banDurationDays : undefined,
        currentUser
      );

      setActionFeedback({
        type: 'success',
        message: `Ação disciplinar (${banType}) aplicada com sucesso a "${selectedUserForBan.displayName || selectedUserForBan.username}".`,
      });

      setSelectedUserForBan(null);
      setBanReason('');
      await loadData();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Falha ao aplicar sanção.',
      });
    } finally {
      setIsSubmittingBan(false);
    }
  };

  // Handle Quick Unban
  const handleQuickUnban = async (user: UserProfile) => {
    if (!confirm(`Deseja revogar imediatamente o bloqueio do usuário "${user.displayName || user.username}"?`)) {
      return;
    }

    try {
      await StorageService.unbanUser(user.uid, currentUser);
      setActionFeedback({
        type: 'success',
        message: `Bloqueio revogado e direitos restaurados para "${user.displayName || user.username}".`,
      });
      await loadData();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Erro ao revogar bloqueio.',
      });
    }
  };

  // Export Transparency Report
  const handleExportTransparencyReport = () => {
    const report = {
      title: 'Relatório Oficial de Governança, Burocratas e Moderação - WikiWorldWeb',
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser?.displayName || currentUser?.email || 'Sistema',
      summary: {
        totalOperators: bureaucratsAndAdmins.length + moderators.length,
        bureaucratsAndAdminsCount: bureaucratsAndAdmins.length,
        moderatorsCount: moderators.length,
        bannedCount: bannedUsers.length,
        pendingPromotionsCount: pendingPromotions.length,
        auditLogsCount: auditLogs.length,
      },
      bureaucratsAndAdmins: bureaucratsAndAdmins.map((u) => ({
        uid: u.uid,
        name: u.displayName || u.username,
        email: u.email,
        role: u.role,
        group: u.group || 'Geral',
        reputation: u.reputationScore || 0,
        createdAt: u.createdAt,
      })),
      moderators: moderators.map((u) => ({
        uid: u.uid,
        name: u.displayName || u.username,
        email: u.email,
        role: u.role,
        group: u.group || 'Moderação',
        createdAt: u.createdAt,
      })),
      recentAuditLogs: auditLogs.slice(0, 100),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-governanca-wiki-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-xl shadow-md">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-purple-700 dark:text-purple-400">
                  Conselho Constitucional & Técnico
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                  Especial:Governança
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Gestão da Administração, Burocratas & Moderadores
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Painel centralizado de deliberação, concessão de privilégios técnicos, auditoria de abusos e garantias constitucionais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Atualizar dados do Conselho"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>

            <button
              type="button"
              onClick={handleExportTransparencyReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              Exportar Auditoria (JSON)
            </button>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
              >
                Voltar à Wiki
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Anti-Tyranny / Democratic Charter Alert Banner */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-600 text-white rounded-lg mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                Garantia de Neutralidade e Proteção contra Feudos Burocráticos
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                  Doutrina WazzimaGiygg
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Diferente de enciclopédias centralizadas tradicionais onde burocratas efêmeros exercem poder monocrático sem supervisão externa (vide o caso documental do usuário Chronus e seus aliados), o <strong>WikiZero</strong> subordina qualquer ato de moderação ou burocracia ao registro público permanente, com possibilidade de recurso transparente ao Conselho Comunitário. Nenhum burocrata é dono do saber.
              </p>
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionFeedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick KPI Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Burocratas & Sysops</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{bureaucratsAndAdmins.length}</span>
              <Crown className="w-4 h-4 text-purple-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Moderadores Ativos</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{moderators.length}</span>
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Pedidos de Promoção</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingPromotions.length}</span>
              <Vote className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Contas Bloqueadas</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{bannedUsers.length}</span>
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Auditorias Registradas</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{auditLogs.length}</span>
              <History className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total de Usuários</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{users.length}</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Hub */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Ferramentas Conectadas da Governança
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {onNavigateToUsersList && (
              <button
                type="button"
                onClick={onNavigateToUsersList}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-left transition group"
              >
                <UserCog className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Lista Geral de Usuários</span>
              </button>
            )}

            {onNavigateToPromotionRequests && (
              <button
                type="button"
                onClick={onNavigateToPromotionRequests}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-left transition group"
              >
                <Vote className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Eleições & Pedidos RfA</span>
              </button>
            )}

            {onNavigateToUnblockRequests && (
              <button
                type="button"
                onClick={onNavigateToUnblockRequests}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-left transition group"
              >
                <Unlock className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Fila de Desbloqueios</span>
              </button>
            )}

            {onNavigateToCheckUser && (
              <button
                type="button"
                onClick={() => onNavigateToCheckUser('Usuario_Suspeito')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-left transition group"
              >
                <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">CheckUser (Anti-Sock)</span>
              </button>
            )}

            {onNavigateToArbitration && (
              <button
                type="button"
                onClick={onNavigateToArbitration}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-left transition group"
              >
                <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Tribunal de Arbitragem</span>
              </button>
            )}

            {onNavigateToUCoC && (
              <button
                type="button"
                onClick={onNavigateToUCoC}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-left transition group"
              >
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Código de Conduta UCoC</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Crown className="w-4 h-4" />
            1. Visão Geral do Conselho
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bureaucrats')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'bureaucrats'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <UserCheck2 className="w-4 h-4" />
            2. Corpo de Burocratas & Sysops ({bureaucratsAndAdmins.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('moderators')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'moderators'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            3. Moderação & Patrulha ({moderators.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sanctions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'sanctions'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Gavel className="w-4 h-4" />
            4. Sanções & Bloqueios ({bannedUsers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            5. Auditoria & Atos ({auditLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('charter')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'charter'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            6. Carta Constitucional & Deontologia
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Constitutional Roles Matrix */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Hierarquia de Privilégios & Matriz de Atribuições Técnicas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Estrutura deliberativa descentralizada do WikiZero para impedir concentração despótica de poder:
                </p>

                <div className="space-y-3 pt-2">
                  {/* Burocrata */}
                  <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 flex items-start gap-3">
                    <div className="p-2 bg-purple-600 text-white rounded-lg">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                          Burocrata (Bureaucrat)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-mono">
                          Flag: bureaucrat / sysop
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Concede e revoga estatutos técnicos de Administrador, Moderador, CheckUser e Robô; homologa consultas comunitárias (RfA); supervisiona o cumprimento das garantias editoriais e a imunidade contra perseguições.
                      </p>
                    </div>
                  </div>

                  {/* Administrador / Sysop */}
                  <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 flex items-start gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                          Administrador (Sysop)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-mono">
                          Flag: admin
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Protege páginas contra guerras de edição; aplica bloqueios preventivos a vândalos e robôs não autorizados; analisa pedidos de desbloqueio; elimina e restaura páginas conforme decisões comunitárias.
                      </p>
                    </div>
                  </div>

                  {/* Moderador / Patrulhador */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          Moderador & Eliminador (Patrol & Content Review)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono">
                          Flag: moderador / rollbacker
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Reverte vandalismos em lote; emite advertências orientadoras; patrulha mudanças recentes; faz a triagem inicial de denúncias do UCoC e media diálogos editoriais nas páginas de discussão.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Action Column */}
              <div className="space-y-4">
                {/* Pending Actions Alert */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Pendências de Deliberação
                  </h4>
                  {pendingPromotions.length === 0 ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-center text-xs text-slate-500">
                      Nenhum pedido de promoção pendente de homologação.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingPromotions.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                            <span>{p.candidateUsername}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-amber-200 dark:bg-amber-900 rounded">
                              Para: {p.targetRole}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                            {p.statement}
                          </p>
                          {onNavigateToPromotionRequests && (
                            <button
                              type="button"
                              onClick={onNavigateToPromotionRequests}
                              className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 pt-1"
                            >
                              Homologar pedido no RfA <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick CheckUser Shortcut */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-sm font-bold">Investigação de Sockpuppetry</h4>
                  </div>
                  <p className="text-xs text-indigo-200 leading-relaxed">
                    Verifique cruzamento de IPs, User-Agents e padrões de edição para desarticular contas falsas de sabotagem com registro perene na auditoria.
                  </p>
                  {onNavigateToCheckUser && (
                    <button
                      type="button"
                      onClick={() => onNavigateToCheckUser('Usuario_Suspeito')}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition"
                    >
                      Abrir Terminal CheckUser <Terminal className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bureaucrats & Sysops List & Management */}
        {activeTab === 'bureaucrats' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Quadro de Burocratas & Sysops da Wiki
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Membros investidos de poderes técnicos de atribuição de estatuto e salvaguarda institucional.
                </p>
              </div>

              {isBureaucratOrAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (users.length > 0) {
                      setSelectedUserForFlag(users[0]);
                      setTargetRole('admin');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Atribuir / Alterar Estatuto
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bureaucratsAndAdmins.map((user) => (
                <div
                  key={user.uid}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-200 dark:border-purple-900/60 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
                        {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'BU'}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => onNavigateToUser(user.displayName || user.username || user.uid)}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition flex items-center gap-1"
                        >
                          {user.displayName || user.username || 'Operador'}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {user.email === 'pedrohenriquecardonaperes@gmail.com' ? '👑 Burocrata Chefe' : '🛡️ Administrador'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reputação:</span>
                      <span className="font-semibold">{user.reputationScore || 100} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Desde:</span>
                      <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Fundação'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Grupo:</span>
                      <span className="font-mono text-[10px]">{user.group || 'Conselho Constitucional'}</span>
                    </div>
                  </div>

                  {isBureaucratOrAdmin && (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForFlag(user);
                          setTargetRole(user.role);
                        }}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition text-center"
                      >
                        Gerenciar Flag
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForBan(user);
                          setBanType('advertencia');
                        }}
                        className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-300 transition"
                        title="Aplicar advertência ou suspensão"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Moderators & Patrol */}
        {activeTab === 'moderators' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Corpo Ativo de Moderadores & Patrulhadores
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Voluntários capacitados para salvaguardar a qualidade editorial e repelir abusos em tempo real.
                </p>
              </div>

              {isBureaucratOrAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (users.length > 0) {
                      setSelectedUserForFlag(users[0]);
                      setTargetRole('moderador');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Nomear Novo Moderador
                </button>
              )}
            </div>

            {moderators.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-3">
                <Shield className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum moderador isolado cadastrado</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Atualmente os administradores e burocratas acumulam as prerrogativas de moderação direta, ou você pode promover editores de confiança ao cargo de moderador.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moderators.map((mod) => (
                  <div
                    key={mod.uid}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow">
                          {mod.displayName ? mod.displayName.slice(0, 2).toUpperCase() : 'MD'}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => onNavigateToUser(mod.displayName || mod.username || mod.uid)}
                            className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1"
                          >
                            {mod.displayName || mod.username || 'Moderador'}
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{mod.email}</span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        🛡️ Moderador
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Edições Realizadas:</span>
                        <span className="font-semibold">{mod.editsCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reputação:</span>
                        <span className="font-semibold">{mod.reputationScore || 50} pts</span>
                      </div>
                    </div>

                    {isBureaucratOrAdmin && (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForFlag(mod);
                            setTargetRole('editor');
                          }}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition text-center"
                        >
                          Revogar Privilégio
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Sanctions & Blocks */}
        {activeTab === 'sanctions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  Painel de Sanções, Advertências & Bloqueios
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registro de penalidades disciplinares ativas. No WikiZero, qualquer bloqueio indevido pode ser revogado por burocratas ou pelo Tribunal de Arbitragem.
                </p>
              </div>

              {onNavigateToUnblockRequests && (
                <button
                  type="button"
                  onClick={onNavigateToUnblockRequests}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Unlock className="w-3.5 h-3.5" /> Analisar Fila de Pedidos de Desbloqueio
                </button>
              )}
            </div>

            {bannedUsers.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum usuário bloqueado no momento</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  A comunidade do WikiZero opera em plena conformidade ética e sem sanções ativas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bannedUsers.map((bUser) => (
                  <div
                    key={bUser.uid}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {bUser.displayName || bUser.username || bUser.email}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {bUser.banType === 'permanente' ? '🚫 Banimento Permanente' : '⏳ Suspensão Temporária'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <strong>Motivação:</strong> {bUser.banReason || 'Violação das normas editoriais.'}
                      </p>
                      {bUser.banExpiresAt && (
                        <div className="text-[11px] text-slate-400">
                          Expira em: {new Date(bUser.banExpiresAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickUnban(bUser)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Revogar Bloqueio (Anistia)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Audit & Governance Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Registro Público de Atos do Conselho (Audit Logs)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Todas as decisões e alterações efetuadas por burocratas e administradores são imutáveis e abertas à auditoria dos leitores.
                </p>
              </div>

              <div className="w-full sm:w-64 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por operador ou usuário..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Data / Hora</th>
                      <th className="py-3 px-4">Ação</th>
                      <th className="py-3 px-4">Operador</th>
                      <th className="py-3 px-4">Usuário Alvo</th>
                      <th className="py-3 px-4">Detalhes e Justificativa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditLogs
                      .filter(
                        (l) =>
                          !searchTerm ||
                          l.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.targetUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.details.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            {new Date(log.date).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-purple-700 dark:text-purple-400 whitespace-nowrap">
                            {log.performedBy}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {log.targetUsername}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 min-w-[280px]">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Charter & Deontology */}
        {activeTab === 'charter' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Código Deontológico e Diretrizes Éticas para Burocratas e Sysops
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Princípios indeclináveis que regem os poderes delegados pela comunidade WikiWorldWeb.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  1. Imparcialidade e Nemo Iudex In Causa Sua
                </h4>
                <p>
                  Nenhum burocrata ou administrador pode atuar como autoridade punitiva em disputas das quais seja parte diretamente interessada. Qualquer discordância editorial entre operadores deve ser submetida a um terceiro independente ou ao Conselho Aberto.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  2. Fundamentação Obrigatória de Decisões
                </h4>
                <p>
                  É estritamente vedada a aplicação de bloqueios, remoção de artigos ou alteração de estatutos sob alegações genéricas. Toda resolução deve indicar o ponto preciso do Código de Conduta ou regra violada e os fatos objetivos que sustentam a medida.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  3. Recall e Destituição Comunitária
                </h4>
                <p>
                  Diferente do modelo arcaico em que o estatuto de burocrata é vitalício e inexpugnável, qualquer operador da WikiWorldWeb pode ter seus privilégios revogados caso reincida em abuso de poder, censura ideológica ou perseguição pessoal sistemática.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  4. Primazia da Presunção de Boa-Fé
                </h4>
                <p>
                  A discordância de opiniões, críticas fundamentadas e questionamentos às decisões dos burocratas são expressões legítimas da liberdade de pesquisa científica e nunca serão tipificadas como vandalismo ou desrespeito.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Atribuição / Alteração de Flags (Burocrata) */}
      {selectedUserForFlag && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Atribuição de Direitos Técnicos (Flag)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForFlag(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Alterando os direitos de{' '}
              <strong>{selectedUserForFlag.displayName || selectedUserForFlag.username}</strong> ({selectedUserForFlag.email}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Selecione o Novo Cargo / Flag Técnica:
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-medium"
                >
                  <option value="admin">🛡️ Administrador (Sysop / Burocrata com plenos poderes)</option>
                  <option value="moderador">🛡️ Moderador & Eliminador (Patrulha de Conteúdo)</option>
                  <option value="editor">✏️ Editor Pleno (Criação e edição geral)</option>
                  <option value="leitor">📖 Leitor / Visitante Registrado</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Fundamentação / Link da Votação / Motivação Oficial (Obrigatória):
                </label>
                <textarea
                  rows={3}
                  value={flagJustification}
                  onChange={(e) => setFlagJustification(e.target.value)}
                  placeholder="Ex: Homologação de votação comunitária favorável no RfA com 88% de apoio; ou nomeação pelo Conselho Constitucional."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForFlag(null)}
                className="flex-1 py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyRoleChange}
                disabled={isSubmittingFlag}
                className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
              >
                {isSubmittingFlag ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirmar Outorga de Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Aplicação de Sanção Disciplinar */}
      {selectedUserForBan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Aplicação de Medida Disciplinar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForBan(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Aplicando sanção a <strong>{selectedUserForBan.displayName || selectedUserForBan.username}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Tipo de Medida:
                </label>
                <select
                  value={banType}
                  onChange={(e) => setBanType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-medium"
                >
                  <option value="advertencia">⚠️ Advertência Formal (Sem bloqueio de edição)</option>
                  <option value="temporario">⏳ Suspensão Temporária (Prazo determinado)</option>
                  <option value="permanente">🚫 Bloqueio Permanente (Infração grave e continuada)</option>
                </select>
              </div>

              {banType === 'temporario' && (
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Duração da Suspensão (Dias):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={banDurationDays}
                    onChange={(e) => setBanDurationDays(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Motivo e Evidências Objetivas:
                </label>
                <textarea
                  rows={3}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Descreva a conduta em desacordo com as diretrizes do WikiZero..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForBan(null)}
                className="flex-1 py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplySanction}
                disabled={isSubmittingBan}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
              >
                {isSubmittingBan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Gavel className="w-3.5 h-3.5" />}
                Aplicar Sanção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
