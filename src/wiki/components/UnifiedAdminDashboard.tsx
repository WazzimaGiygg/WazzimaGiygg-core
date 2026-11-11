import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Crown,
  Users,
  ShieldAlert,
  Unlock,
  Scale,
  Vote,
  Search,
  Database,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  History,
  CheckCircle2,
  Lock,
  Puzzle,
} from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storageService';
import { ExtensionManager } from '../core/ExtensionManager';
import { AdminUsersManagementView } from './AdminUsersManagementView';
import { AdminCouncilView } from './AdminCouncilView';
import { AdminDataRemovalRequestsView } from './AdminDataRemovalRequestsView';
import { UnblockRequestsView } from './UnblockRequestsView';
import { AdminExtensionsManagementView } from './AdminExtensionsManagementView';

export type AdminDashboardTab = 'users' | 'council' | 'data-removal' | 'unblock-requests' | 'extensions';

export interface UnifiedAdminDashboardProps {
  currentUser: UserProfile | null;
  initialTab?: AdminDashboardTab;
  onNavigateToUser: (identifier: string) => void;
  onNavigateToCheckUser?: (username: string) => void;
  onNavigateToPromotionRequests?: () => void;
  onNavigateToArbitration?: () => void;
  onNavigateToContactAdmin?: () => void;
  onNavigateToUCoC?: () => void;
  onNavigateToFirebaseAdmin?: () => void;
  onBack?: () => void;
}

export const UnifiedAdminDashboard: React.FC<UnifiedAdminDashboardProps> = ({
  currentUser,
  initialTab = 'users',
  onNavigateToUser,
  onNavigateToCheckUser,
  onNavigateToPromotionRequests,
  onNavigateToArbitration,
  onNavigateToContactAdmin,
  onNavigateToUCoC,
  onNavigateToFirebaseAdmin,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>(initialTab);
  const [isRefreshingStats, setIsRefreshingStats] = useState<boolean>(false);

  // Live Stats for Tab Badges & Notification Indicators
  const [stats, setStats] = useState({
    totalUsers: 0,
    operatorsCount: 0,
    pendingLgpdCount: 0,
    pendingUnblockCount: 0,
    pendingPromotionCount: 0,
    bannedUsersCount: 0,
    activeExtensionsCount: 0,
    totalExtensionsCount: 0,
  });

  const loadSummaryStats = async () => {
    setIsRefreshingStats(true);
    try {
      const [allUsers, lgpdReqs, unblockReqs, promoReqs] = await Promise.all([
        StorageService.getCommunityUsers().catch(() => []),
        StorageService.getLgpdDeletionRequests().catch(() => []),
        StorageService.getUnblockRequests().catch(() => []),
        StorageService.getPromotionRequests().catch(() => []),
      ]);

      const operators = allUsers.filter(
        (u) =>
          u.role === 'admin' ||
          u.role === 'moderador' ||
          u.email === 'pedrohenriquecardonaperes@gmail.com' ||
          (u.group && (u.group.includes('burocrata') || u.group.includes('moderador')))
      );

      const banned = allUsers.filter((u) => u.isBanned);
      const pendingLgpd = lgpdReqs.filter((r) => r.status === 'pendente');
      const pendingUnblock = unblockReqs.filter((r) => r.status === 'em_analise');
      const pendingPromo = promoReqs.filter((r) => r.status === 'em_votacao');

      const allExts = ExtensionManager.getInstance().getAllInstalledExtensions();
      const activeExts = allExts.filter((e) => e.enabled).length;

      setStats({
        totalUsers: allUsers.length,
        operatorsCount: operators.length,
        pendingLgpdCount: pendingLgpd.length,
        pendingUnblockCount: pendingUnblock.length,
        pendingPromotionCount: pendingPromo.length,
        bannedUsersCount: banned.length,
        activeExtensionsCount: activeExts,
        totalExtensionsCount: allExts.length,
      });
    } catch (err) {
      console.error('[UnifiedAdminDashboard] Erro ao carregar métricas:', err);
    } finally {
      setIsRefreshingStats(false);
    }
  };

  useEffect(() => {
    loadSummaryStats();
  }, []);

  // Update active tab if initialTab prop changes externally
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: AdminDashboardTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSuperAdminOrChief =
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com' || currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Master Admin Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xs sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-800/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Identity & Breadcrumb */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-purple-700 dark:text-purple-300">
                    Console Central de Governança
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono border border-purple-200 dark:border-purple-800">
                    Special:AdminDashboard
                  </span>
                  {isSuperAdminOrChief && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                      Pleno Acesso Sysop
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Painel Unificado de Administração
                </h1>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              {onNavigateToCheckUser && (
                <button
                  type="button"
                  onClick={() => onNavigateToCheckUser('Usuario_Suspeito')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  title="Auditoria de Sockpuppets & IPs (Special:CheckUser)"
                >
                  <Search className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">CheckUser</span>
                </button>
              )}

              {onNavigateToPromotionRequests && (
                <button
                  type="button"
                  onClick={onNavigateToPromotionRequests}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  title="Eleições & Votações Comunitárias (RfA)"
                >
                  <Vote className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Votações RfA</span>
                  {stats.pendingPromotionCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {stats.pendingPromotionCount}
                    </span>
                  )}
                </button>
              )}

              {onNavigateToArbitration && (
                <button
                  type="button"
                  onClick={onNavigateToArbitration}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  title="Corte e Comitê de Arbitragem (ArbCom)"
                >
                  <Scale className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden sm:inline">Arbitragem</span>
                </button>
              )}

              {onNavigateToFirebaseAdmin && (
                <button
                  type="button"
                  onClick={onNavigateToFirebaseAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  title="Painel Firestore / Autenticação"
                >
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden md:inline">Firebase DB</span>
                </button>
              )}

              <button
                type="button"
                onClick={loadSummaryStats}
                disabled={isRefreshingStats}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition"
                title="Recarregar indicadores administrativos"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingStats ? 'animate-spin' : ''}`} />
              </button>

              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar à Wiki
                </button>
              )}
            </div>
          </div>

          {/* Primary Tab Navigation Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-4">
            {/* Tab 1: Users Management */}
            <button
              type="button"
              onClick={() => handleTabChange('users')}
              className={`p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                activeTab === 'users'
                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 dark:border-purple-600 ring-2 ring-purple-500/20 text-purple-900 dark:text-purple-100 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    activeTab === 'users'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-purple-600'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">1. Gestão de Usuários</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Diretório, cargos e medalhas
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                {stats.totalUsers}
              </span>
            </button>

            {/* Tab 2: Council & Bureaucrats */}
            <button
              type="button"
              onClick={() => handleTabChange('council')}
              className={`p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                activeTab === 'council'
                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 dark:border-purple-600 ring-2 ring-purple-500/20 text-purple-900 dark:text-purple-100 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    activeTab === 'council'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-purple-600'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">2. Conselho & Burocratas</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Flags, governança e ética
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                {stats.operatorsCount}
              </span>
            </button>

            {/* Tab 3: Data Removal (LGPD) */}
            <button
              type="button"
              onClick={() => handleTabChange('data-removal')}
              className={`p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                activeTab === 'data-removal'
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-500 dark:border-red-600 ring-2 ring-red-500/20 text-red-950 dark:text-red-100 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    activeTab === 'data-removal'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-red-600'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">3. Remoção LGPD</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Exclusão e anonimização
                  </div>
                </div>
              </div>
              {stats.pendingLgpdCount > 0 ? (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-red-600 text-white shrink-0 animate-pulse">
                  {stats.pendingLgpdCount} pend.
                </span>
              ) : (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 shrink-0">
                  0 pend.
                </span>
              )}
            </button>

            {/* Tab 4: Unblock Requests */}
            <button
              type="button"
              onClick={() => handleTabChange('unblock-requests')}
              className={`p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                activeTab === 'unblock-requests'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 dark:border-amber-600 ring-2 ring-amber-500/20 text-amber-950 dark:text-amber-100 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    activeTab === 'unblock-requests'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-amber-600'
                  }`}
                >
                  <Unlock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">4. Fila de Desbloqueios</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Recursos contra suspensão
                  </div>
                </div>
              </div>
              {stats.pendingUnblockCount > 0 ? (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-600 text-white shrink-0 animate-pulse">
                  {stats.pendingUnblockCount} pend.
                </span>
              ) : (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 shrink-0">
                  0 pend.
                </span>
              )}
            </button>

            {/* Tab 5: Extensions Management */}
            <button
              type="button"
              onClick={() => handleTabChange('extensions')}
              className={`p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                activeTab === 'extensions'
                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 dark:border-purple-600 ring-2 ring-purple-500/20 text-purple-900 dark:text-purple-100 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    activeTab === 'extensions'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-purple-600'
                  }`}
                >
                  <Puzzle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">5. Extensões da Wiki</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Burocratas & ganchos
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                {stats.activeExtensionsCount} ativas
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Active Tab Viewport Area */}
      <main className="w-full">
        {activeTab === 'users' && (
          <div className="animate-in fade-in duration-200">
            <AdminUsersManagementView
              currentUser={currentUser}
              onNavigateToUser={onNavigateToUser}
              onNavigateToCheckUser={onNavigateToCheckUser}
              onNavigateToUnblockRequests={() => handleTabChange('unblock-requests')}
              onNavigateToPromotionRequests={onNavigateToPromotionRequests}
              onNavigateToAdminCouncil={() => handleTabChange('council')}
              onNavigateToContactAdmin={onNavigateToContactAdmin}
              onBack={onBack}
            />
          </div>
        )}

        {activeTab === 'council' && (
          <div className="animate-in fade-in duration-200">
            <AdminCouncilView
              currentUser={currentUser}
              onNavigateToUser={onNavigateToUser}
              onNavigateToCheckUser={onNavigateToCheckUser}
              onNavigateToUnblockRequests={() => handleTabChange('unblock-requests')}
              onNavigateToPromotionRequests={onNavigateToPromotionRequests}
              onNavigateToUsersList={() => handleTabChange('users')}
              onNavigateToArbitration={onNavigateToArbitration}
              onNavigateToUCoC={onNavigateToUCoC}
              onBack={onBack}
            />
          </div>
        )}

        {activeTab === 'data-removal' && (
          <div className="animate-in fade-in duration-200">
            <AdminDataRemovalRequestsView
              currentUser={currentUser}
              onNavigateToUser={onNavigateToUser}
              onNavigateToUsersList={() => handleTabChange('users')}
              onBack={onBack}
            />
          </div>
        )}

        {activeTab === 'unblock-requests' && (
          <div className="animate-in fade-in duration-200">
            <UnblockRequestsView
              currentUser={currentUser}
              onNavigateToUser={onNavigateToUser}
              onNavigateToCheckUser={onNavigateToCheckUser}
              onBack={onBack}
            />
          </div>
        )}

        {activeTab === 'extensions' && (
          <div className="animate-in fade-in duration-200">
            <AdminExtensionsManagementView
              currentUser={currentUser}
              onNavigateToUser={onNavigateToUser}
              onBack={onBack}
            />
          </div>
        )}
      </main>
    </div>
  );
};
