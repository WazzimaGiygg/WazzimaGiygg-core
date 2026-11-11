import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Crown,
  Search,
  Filter,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Edit3,
  X,
  UserX,
  Scale,
  Vote,
  LayoutGrid,
  List,
  ShieldAlert,
  ArrowUpDown,
  UserCog,
  Check,
  SlidersHorizontal,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileCode,
  MapPin,
  Globe,
  Star,
  ChevronDown,
  ChevronUp,
  Info,
  PieChart,
  BarChart3,
  TrendingUp,
  UserPlus,
  Share2,
  ImageOff,
  ShieldCheck,
  Trash2,
  UserMinus,
  Copy,
  FileText,
} from 'lucide-react';
import { UserProfile, UserRole, LgpdAccountDeletionRequest } from '../types';
import { StorageService } from '../services/storageService';

interface AdminUsersManagementViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser: (identifier: string) => void;
  onNavigateToCheckUser?: (username: string) => void;
  onNavigateToUnblockRequests?: () => void;
  onNavigateToPromotionRequests?: () => void;
  onNavigateToAdminCouncil?: () => void;
  onNavigateToContactAdmin?: () => void;
  onBack?: () => void;
  initialAdminTab?: 'users' | 'lgpd_requests';
}

type MainCategoryFilter = 'all' | 'admin' | 'moderador' | 'editor' | 'leitor' | 'outros' | 'banned';
type SortOption =
  | 'role'
  | 'name_asc'
  | 'name_desc'
  | 'reputation_desc'
  | 'reputation_asc'
  | 'barnstars_desc'
  | 'created_desc'
  | 'created_asc'
  | 'active_desc';

export const AdminUsersManagementView: React.FC<AdminUsersManagementViewProps> = ({
  currentUser,
  onNavigateToUser,
  onNavigateToCheckUser,
  onNavigateToUnblockRequests,
  onNavigateToPromotionRequests,
  onNavigateToAdminCouncil,
  onNavigateToContactAdmin,
  onBack,
  initialAdminTab = 'users',
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // General Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<MainCategoryFilter>('all');
  const [subFilterOutros, setSubFilterOutros] = useState<'all_outros' | 'editor' | 'leitor' | 'banned'>('all_outros');
  const [sortBy, setSortBy] = useState<SortOption>('role');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table' | 'stats'>('grid');

  // Advanced Search Drawer / Panel States
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advEmailQuery, setAdvEmailQuery] = useState('');
  const [advBioQuery, setAdvBioQuery] = useState('');
  const [advLocationQuery, setAdvLocationQuery] = useState('');
  const [advRoleFilter, setAdvRoleFilter] = useState<string>('all');
  const [advMinReputation, setAdvMinReputation] = useState<string>('');
  const [advMaxReputation, setAdvMaxReputation] = useState<string>('');
  const [advBarnstarFilter, setAdvBarnstarFilter] = useState<'all' | 'with_barnstars' | 'three_plus'>('all');
  const [advBanStatusFilter, setAdvBanStatusFilter] = useState<'all' | 'active_only' | 'banned_only'>('all');
  const [advDateShortcut, setAdvDateShortcut] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [advStartDate, setAdvStartDate] = useState('');
  const [advEndDate, setAdvEndDate] = useState('');
  const [advHasLgpdConsent, setAdvHasLgpdConsent] = useState(false);
  const [advCanEditOnly, setAdvCanEditOnly] = useState(false);
  const [advCanDeleteOnly, setAdvCanDeleteOnly] = useState(false);

  // Export Feedback
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Admin Rename User Modal State (LGPD / Marco Civil)
  const [targetUserForRename, setTargetUserForRename] = useState<UserProfile | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [renameJustification, setRenameJustification] = useState('Solicitação do Titular de Dados (Art. 18, III LGPD)');
  const [customJustification, setCustomJustification] = useState('');
  const [isProcessingRename, setIsProcessingRename] = useState(false);
  const [renameFeedback, setRenameFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Admin Avatar Removal Modal State (LGPD Art. 18 / Proteção de Dados - Inicial do Nome)
  const [targetUserForAvatarLGPD, setTargetUserForAvatarLGPD] = useState<UserProfile | null>(null);
  const [avatarJustification, setAvatarJustification] = useState('Proteção e minimização de dados pessoais (Art. 6º, III e Art. 18 LGPD)');
  const [customAvatarJustification, setCustomAvatarJustification] = useState('');
  const [isProcessingAvatarLGPD, setIsProcessingAvatarLGPD] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Admin Pre-Register User Modal State (Política de Bloqueio de Usuários Não Registrados)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('editor');
  const [regBio, setRegBio] = useState('');
  const [isProcessingRegister, setIsProcessingRegister] = useState(false);
  const [regFeedback, setRegFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Estados do Painel LGPD de Solicitações de Exclusão (Art. 18, VI)
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'lgpd_requests'>(initialAdminTab || 'users');
  const [lgpdRequests, setLgpdRequests] = useState<LgpdAccountDeletionRequest[]>([]);
  const [lgpdStatusFilter, setLgpdStatusFilter] = useState<'all' | 'pendente' | 'executada' | 'rejeitada' | 'cancelada'>('all');
  const [lgpdSearchQuery, setLgpdSearchQuery] = useState('');

  // Estados do Modal Administrativo de Exclusão LGPD
  const [targetUserForDeletionLGPD, setTargetUserForDeletionLGPD] = useState<UserProfile | null>(null);
  const [targetRequestForExecution, setTargetRequestForExecution] = useState<LgpdAccountDeletionRequest | null>(null);
  const [genericPseudonymPreset, setGenericPseudonymPreset] = useState('Usuário Anonimizado (LGPD)');
  const [customPseudonymInput, setCustomPseudonymInput] = useState('');
  const [deletionJustificationPreset, setDeletionJustificationPreset] = useState(
    'Atendimento à solicitação formal do titular para eliminação definitiva de dados pessoais (Art. 18, VI da LGPD - Lei nº 13.709/2018)'
  );
  const [customDeletionJustification, setCustomDeletionJustification] = useState('');
  const [isProcessingDeletion, setIsProcessingDeletion] = useState(false);
  const [deletionFeedback, setDeletionFeedback] = useState<{
    msg: string;
    type: 'success' | 'error';
    details?: any;
  } | null>(null);

  // Estados do Modal Administrativo de Rejeição de Solicitação LGPD
  const [targetRequestForRejection, setTargetRequestForRejection] = useState<LgpdAccountDeletionRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isProcessingRejection, setIsProcessingRejection] = useState(false);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const isRealAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const loadUsers = async () => {
    setIsLoading(true);
    const [communityUsers, requests] = await Promise.all([
      StorageService.getCommunityUsers(),
      StorageService.getLgpdDeletionRequests(),
    ]);
    setUsers(communityUsers);
    setLgpdRequests(requests);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const pendingLgpdCount = useMemo(() => {
    return lgpdRequests.filter((r) => r.status === 'pendente').length;
  }, [lgpdRequests]);

  const pendingRequestsMap = useMemo(() => {
    const map = new Map<string, LgpdAccountDeletionRequest>();
    lgpdRequests.forEach((req) => {
      if (req.status === 'pendente') {
        map.set(req.userUid, req);
      }
    });
    return map;
  }, [lgpdRequests]);

  // Compute Active Advanced Filters Count
  const activeAdvFiltersCount = useMemo(() => {
    let count = 0;
    if (advEmailQuery) count++;
    if (advBioQuery) count++;
    if (advLocationQuery) count++;
    if (advRoleFilter !== 'all') count++;
    if (advMinReputation !== '' || advMaxReputation !== '') count++;
    if (advBarnstarFilter !== 'all') count++;
    if (advBanStatusFilter !== 'all') count++;
    if (advDateShortcut !== 'all') count++;
    if (advStartDate || advEndDate) count++;
    if (advHasLgpdConsent) count++;
    if (advCanEditOnly) count++;
    if (advCanDeleteOnly) count++;
    return count;
  }, [
    advEmailQuery,
    advBioQuery,
    advLocationQuery,
    advRoleFilter,
    advMinReputation,
    advMaxReputation,
    advBarnstarFilter,
    advBanStatusFilter,
    advDateShortcut,
    advStartDate,
    advEndDate,
    advHasLgpdConsent,
    advCanEditOnly,
    advCanDeleteOnly,
  ]);

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedFilter('all');
    setSubFilterOutros('all_outros');
    setSortBy('role');
    setAdvEmailQuery('');
    setAdvBioQuery('');
    setAdvLocationQuery('');
    setAdvRoleFilter('all');
    setAdvMinReputation('');
    setAdvMaxReputation('');
    setAdvBarnstarFilter('all');
    setAdvBanStatusFilter('all');
    setAdvDateShortcut('all');
    setAdvStartDate('');
    setAdvEndDate('');
    setAdvHasLgpdConsent(false);
    setAdvCanEditOnly(false);
    setAdvCanDeleteOnly(false);
  };

  // Category counts
  const counts = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    const adminCount = safeUsers.filter((u) => u?.role === 'admin').length;
    const modCount = safeUsers.filter((u) => u?.role === 'moderador').length;
    const editorCount = safeUsers.filter((u) => u?.role === 'editor').length;
    const leitorCount = safeUsers.filter((u) => u?.role === 'leitor' || u?.role === 'convidado').length;
    const bannedCount = safeUsers.filter((u) => u?.isBanned).length;
    const outrosCount = safeUsers.filter((u) => u?.role !== 'admin' && u?.role !== 'moderador').length;
    const totalReputation = safeUsers.reduce((acc, u) => acc + (u?.reputationScore || 0), 0);
    const totalBarnstars = safeUsers.reduce((acc, u) => acc + (u?.barnstars?.length || 0), 0);

    return {
      total: safeUsers.length,
      admin: adminCount,
      moderador: modCount,
      outros: outrosCount,
      editor: editorCount,
      leitor: leitorCount,
      banned: bannedCount,
      avgReputation: Math.round(totalReputation / (safeUsers.length || 1)),
      totalBarnstars,
    };
  }, [users]);

  // Rename modal handlers
  const handleOpenRenameModal = (u: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetUserForRename(u);
    setNewNameInput(u.displayName || u.username || '');
    setRenameJustification('Solicitação do Titular de Dados (Art. 18, III LGPD)');
    setCustomJustification('');
    setRenameFeedback(null);
  };

  const handleExecuteRename = async () => {
    if (!targetUserForRename) return;
    const targetName = newNameInput.trim();
    if (!targetName) {
      setRenameFeedback({ msg: 'Informe o novo nome de exibição.', type: 'error' });
      return;
    }

    const justification =
      renameJustification === 'outros'
        ? customJustification.trim() || 'Retificação Cadastral em conformidade com a LGPD e Marco Civil'
        : renameJustification;

    setIsProcessingRename(true);
    const result = await StorageService.adminUpdateUserName(
      targetUserForRename.uid,
      targetName,
      justification,
      currentUser
    );
    setIsProcessingRename(false);

    if (result.success && result.user) {
      setRenameFeedback({ msg: result.message, type: 'success' });
      await loadUsers();
      setTimeout(() => {
        setTargetUserForRename(null);
        setRenameFeedback(null);
      }, 1800);
    } else {
      setRenameFeedback({ msg: result.message, type: 'error' });
    }
  };

  // Avatar LGPD Modal handlers (Remoção Administrativa - Inicial do Nome)
  const handleOpenAvatarModal = (u: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetUserForAvatarLGPD(u);
    setAvatarJustification('Proteção e minimização de dados pessoais (Art. 6º, III e Art. 18 LGPD)');
    setCustomAvatarJustification('');
    setAvatarFeedback(null);
  };

  const handleExecuteRemoveAvatar = async () => {
    if (!targetUserForAvatarLGPD) return;

    const justification =
      avatarJustification === 'outros'
        ? customAvatarJustification.trim() || 'Proteção de dados pessoais e privacidade sob a LGPD'
        : avatarJustification;

    setIsProcessingAvatarLGPD(true);
    const result = await StorageService.adminRemoveUserAvatarLGPD(
      targetUserForAvatarLGPD.uid,
      justification,
      currentUser
    );
    setIsProcessingAvatarLGPD(false);

    if (result.success && result.user) {
      setAvatarFeedback({ msg: result.message, type: 'success' });
      const sanitizedUser: UserProfile = {
        ...result.user,
        photoURL: undefined,
        avatarRemovedByAdmin: true,
      };
      delete (sanitizedUser as any).photoURL;
      setUsers((prev) =>
        prev.map((u) => (u.uid === sanitizedUser.uid ? { ...u, ...sanitizedUser } : u))
      );
      await loadUsers();
      setTimeout(() => {
        setTargetUserForAvatarLGPD(null);
        setAvatarFeedback(null);
      }, 1800);
    } else {
      setAvatarFeedback({ msg: result.message, type: 'error' });
    }
  };

  // LGPD Account Deletion Modal handlers (Art. 18, VI)
  const handleOpenDeletionModal = (targetUser: UserProfile, linkedRequest?: LgpdAccountDeletionRequest) => {
    const req = linkedRequest || pendingRequestsMap.get(targetUser.uid) || null;
    setTargetUserForDeletionLGPD(targetUser);
    setTargetRequestForExecution(req);
    setGenericPseudonymPreset(targetUser.uid);
    setCustomPseudonymInput(targetUser.uid);
    setDeletionJustificationPreset(
      req?.userReason
        ? `Atendimento à solicitação formal do titular (LGPD Art. 18, VI). Motivo informado: "${req.userReason}"`
        : 'Atendimento à solicitação formal do titular para eliminação definitiva de dados pessoais (Art. 18, VI da LGPD - Lei nº 13.709/2018). Autoria atribuída ao UID Google.'
    );
    setCustomDeletionJustification('');
    setDeletionFeedback(null);
  };

  const handleExecuteDeletion = async () => {
    if (!targetUserForDeletionLGPD) return;
    const finalPseudonym =
      genericPseudonymPreset === 'custom'
        ? customPseudonymInput.trim() || targetUserForDeletionLGPD.uid
        : targetUserForDeletionLGPD.uid;
    const finalJustification =
      deletionJustificationPreset === 'custom'
        ? customDeletionJustification.trim() || 'Eliminação definitiva de dados pessoais sob Art. 18, VI da LGPD'
        : deletionJustificationPreset;

    setIsProcessingDeletion(true);
    setDeletionFeedback(null);
    try {
      const res = await StorageService.executeAdminUserDeletionLGPD({
        targetUid: targetUserForDeletionLGPD.uid,
        requestId: targetRequestForExecution?.id,
        genericPseudonym: finalPseudonym,
        legalJustification: finalJustification,
        adminUser: currentUser,
      });

      if (res.success) {
        setDeletionFeedback({
          msg: res.message,
          type: 'success',
          details: {
            articlesUpdated: res.articlesUpdated,
            revisionsUpdated: res.revisionsUpdated,
            genericPseudonym: res.genericPseudonym,
          },
        });
        await loadUsers();
        setTimeout(() => {
          setTargetUserForDeletionLGPD(null);
          setTargetRequestForExecution(null);
          setDeletionFeedback(null);
        }, 3000);
      } else {
        setDeletionFeedback({ msg: res.message, type: 'error' });
      }
    } catch (e: any) {
      setDeletionFeedback({ msg: e.message || 'Erro ao processar exclusão.', type: 'error' });
    } finally {
      setIsProcessingDeletion(false);
    }
  };

  const handleOpenRejectionModal = (req: LgpdAccountDeletionRequest) => {
    setTargetRequestForRejection(req);
    setRejectionReasonInput('');
    setRejectionError(null);
  };

  const handleConfirmRejection = async () => {
    if (!targetRequestForRejection) return;
    if (!rejectionReasonInput.trim()) {
      setRejectionError('Por favor, informe a justificativa administrativa para a rejeição da solicitação.');
      return;
    }
    setIsProcessingRejection(true);
    setRejectionError(null);
    try {
      const res = await StorageService.rejectLgpdDeletionRequest(
        targetRequestForRejection.id,
        rejectionReasonInput,
        currentUser
      );
      if (res.success) {
        await loadUsers();
        setTargetRequestForRejection(null);
      } else {
        setRejectionError(res.message);
      }
    } catch (e: any) {
      setRejectionError(e.message || 'Erro ao rejeitar solicitação.');
    } finally {
      setIsProcessingRejection(false);
    }
  };

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const filteredLgpdRequests = useMemo(() => {
    return lgpdRequests.filter((req) => {
      if (lgpdStatusFilter !== 'all' && req.status !== lgpdStatusFilter) {
        return false;
      }
      if (lgpdSearchQuery.trim()) {
        const q = lgpdSearchQuery.toLowerCase().trim();
        const match =
          (req.originalDisplayName || '').toLowerCase().includes(q) ||
          (req.originalUsername || '').toLowerCase().includes(q) ||
          (req.originalEmail || '').toLowerCase().includes(q) ||
          (req.userUid || '').toLowerCase().includes(q) ||
          (req.id || '').toLowerCase().includes(q) ||
          (req.genericPseudonymAssigned || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [lgpdRequests, lgpdStatusFilter, lgpdSearchQuery]);

  const lgpdKpis = useMemo(() => {
    const total = lgpdRequests.length;
    const pendentes = lgpdRequests.filter((r) => r.status === 'pendente').length;
    const executadas = lgpdRequests.filter((r) => r.status === 'executada').length;
    const rejeitadas = lgpdRequests.filter((r) => r.status === 'rejeitada' || r.status === 'cancelada').length;
    return { total, pendentes, executadas, rejeitadas };
  }, [lgpdRequests]);

  // Filter and Sort Users with Full Advanced Logic
  const filteredUsers = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    const list = safeUsers.filter((u) => {
      if (!u) return false;
      // 1. Primary Text Search
      const name = (u.displayName || u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const bio = (u.bio || '').toLowerCase();
      const location = (u.location || '').toLowerCase();
      const website = (u.website || '').toLowerCase();
      const uid = (u.uid || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      if (query) {
        const matchMain =
          name.includes(query) ||
          email.includes(query) ||
          bio.includes(query) ||
          location.includes(query) ||
          website.includes(query) ||
          uid.includes(query);
        if (!matchMain) return false;
      }

      // 2. Primary Tabs Filter
      if (selectedFilter === 'admin' && u.role !== 'admin') return false;
      if (selectedFilter === 'moderador' && u.role !== 'moderador') return false;
      if (selectedFilter === 'editor' && u.role !== 'editor') return false;
      if (selectedFilter === 'leitor' && u.role !== 'leitor' && u.role !== 'convidado') return false;
      if (selectedFilter === 'banned' && !u.isBanned) return false;
      if (selectedFilter === 'outros') {
        if (subFilterOutros === 'editor' && u.role !== 'editor') return false;
        if (subFilterOutros === 'leitor' && (u.role !== 'leitor' && u.role !== 'convidado')) return false;
        if (subFilterOutros === 'banned' && !u.isBanned) return false;
        if (subFilterOutros === 'all_outros' && (u.role === 'admin' || u.role === 'moderador')) return false;
      }

      // 3. Advanced Search Specific Criteria
      if (advEmailQuery && !email.includes(advEmailQuery.toLowerCase().trim())) return false;
      if (advBioQuery && !bio.includes(advBioQuery.toLowerCase().trim())) return false;
      if (advLocationQuery && !location.includes(advLocationQuery.toLowerCase().trim())) return false;

      if (advRoleFilter !== 'all') {
        if (advRoleFilter === 'admin' && u.role !== 'admin') return false;
        if (advRoleFilter === 'moderador' && u.role !== 'moderador') return false;
        if (advRoleFilter === 'editor' && u.role !== 'editor') return false;
        if (advRoleFilter === 'leitor' && (u.role !== 'leitor' && u.role !== 'convidado')) return false;
        if (advRoleFilter === 'banned' && !u.isBanned) return false;
      }

      // Reputation range
      const rep = u.reputationScore ?? 0;
      if (advMinReputation !== '') {
        const minVal = parseFloat(advMinReputation);
        if (!isNaN(minVal) && rep < minVal) return false;
      }
      if (advMaxReputation !== '') {
        const maxVal = parseFloat(advMaxReputation);
        if (!isNaN(maxVal) && rep > maxVal) return false;
      }

      // Barnstars
      const barnstarCount = u.barnstars?.length || 0;
      if (advBarnstarFilter === 'with_barnstars' && barnstarCount === 0) return false;
      if (advBarnstarFilter === 'three_plus' && barnstarCount < 3) return false;

      // Ban status
      if (advBanStatusFilter === 'active_only' && u.isBanned) return false;
      if (advBanStatusFilter === 'banned_only' && !u.isBanned) return false;

      // Permissions check
      if (advCanEditOnly && !u.permissions?.canEdit && u.role !== 'admin') return false;
      if (advCanDeleteOnly && !u.permissions?.canDelete && u.role !== 'admin') return false;

      // LGPD Consent
      if (advHasLgpdConsent && !u.dataConsentimento && !u.ipConsentimento) return false;

      // Date Filters
      if (u.createdAt) {
        const userDate = new Date(u.createdAt).getTime();
        const now = Date.now();

        if (advDateShortcut === 'today' && now - userDate > 24 * 60 * 60 * 1000) return false;
        if (advDateShortcut === 'week' && now - userDate > 7 * 24 * 60 * 60 * 1000) return false;
        if (advDateShortcut === 'month' && now - userDate > 30 * 24 * 60 * 60 * 1000) return false;
        if (advDateShortcut === 'year' && now - userDate > 365 * 24 * 60 * 60 * 1000) return false;

        if (advStartDate) {
          const start = new Date(advStartDate).getTime();
          if (!isNaN(start) && userDate < start) return false;
        }
        if (advEndDate) {
          const end = new Date(advEndDate).getTime() + 24 * 60 * 60 * 1000;
          if (!isNaN(end) && userDate > end) return false;
        }
      }

      return true;
    });

    // 4. Sorting logic
    return list.sort((a, b) => {
      if (sortBy === 'name_asc') {
        const nameA = (a.displayName || a.username || '').toLowerCase();
        const nameB = (b.displayName || b.username || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'name_desc') {
        const nameA = (a.displayName || a.username || '').toLowerCase();
        const nameB = (b.displayName || b.username || '').toLowerCase();
        return nameB.localeCompare(nameA);
      }
      if (sortBy === 'reputation_desc') {
        return (b.reputationScore || 0) - (a.reputationScore || 0);
      }
      if (sortBy === 'reputation_asc') {
        return (a.reputationScore || 0) - (b.reputationScore || 0);
      }
      if (sortBy === 'barnstars_desc') {
        return (b.barnstars?.length || 0) - (a.barnstars?.length || 0);
      }
      if (sortBy === 'created_desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'created_asc') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'active_desc') {
        return new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime();
      }

      // Default: Role hierarchy
      const roleWeight: Record<UserRole, number> = {
        admin: 5,
        moderador: 4,
        editor: 3,
        leitor: 2,
        convidado: 1,
      };
      const weightA = a.isBanned ? -1 : roleWeight[a.role] || 0;
      const weightB = b.isBanned ? -1 : roleWeight[b.role] || 0;
      if (weightA !== weightB) return weightB - weightA;
      return (b.reputationScore || 0) - (a.reputationScore || 0);
    });
  }, [
    users,
    searchQuery,
    selectedFilter,
    subFilterOutros,
    sortBy,
    advEmailQuery,
    advBioQuery,
    advLocationQuery,
    advRoleFilter,
    advMinReputation,
    advMaxReputation,
    advBarnstarFilter,
    advBanStatusFilter,
    advDateShortcut,
    advStartDate,
    advEndDate,
    advHasLgpdConsent,
    advCanEditOnly,
    advCanDeleteOnly,
  ]);

  // Export User Directory Handlers
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredUsers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `censo-usuarios-wikizero-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportFeedback('Exportado em JSON com sucesso!');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['UID', 'Nome de Exibição', 'Nome de Usuário', 'Cargo', 'Reputação', 'Condecorações', 'Bloqueado', 'Data de Cadastro', 'Localização'];
    const rows = filteredUsers.map((u) => [
      `"${u.uid}"`,
      `"${(u.displayName || '').replace(/"/g, '""')}"`,
      `"${(u.username || '').replace(/"/g, '""')}"`,
      `"${u.role}"`,
      u.reputationScore ?? 0,
      u.barnstars?.length || 0,
      u.isBanned ? 'SIM' : 'NÃO',
      `"${u.createdAt || ''}"`,
      `"${(u.location || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `censo-usuarios-wikizero-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportFeedback('Exportado em CSV com sucesso!');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim()) {
      setRegFeedback({ msg: 'Por favor, informe o e-mail do usuário.', type: 'error' });
      return;
    }
    if (!regDisplayName.trim()) {
      setRegFeedback({ msg: 'Por favor, informe o nome do usuário.', type: 'error' });
      return;
    }

    setIsProcessingRegister(true);
    setRegFeedback(null);
    try {
      const res = await StorageService.registerNewUser(
        {
          email: regEmail.trim(),
          displayName: regDisplayName.trim(),
          username: regUsername.trim() || undefined,
          role: regRole,
          bio: regBio.trim() || undefined,
        },
        currentUser
      );

      setRegFeedback({ msg: res.message, type: 'success' });
      setRegEmail('');
      setRegDisplayName('');
      setRegUsername('');
      setRegRole('editor');
      setRegBio('');
      await loadUsers();
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegFeedback(null);
      }, 2200);
    } catch (err: any) {
      setRegFeedback({ msg: err?.message || 'Falha ao cadastrar usuário.', type: 'error' });
    } finally {
      setIsProcessingRegister(false);
    }
  };

  const getRoleBadge = (u: UserProfile) => {
    if (u.isBanned) {
      return {
        label: '🚫 Bloqueado',
        bg: 'bg-rose-100 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
      };
    }
    switch (u.role) {
      case 'admin':
        return {
          label: '🛡️ Administração',
          bg: 'bg-purple-100 dark:bg-purple-950/60',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-200 dark:border-purple-800',
        };
      case 'moderador':
        return {
          label: '⚖️ Moderação',
          bg: 'bg-blue-100 dark:bg-blue-950/60',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800',
        };
      case 'editor':
        return {
          label: '✍️ Editor',
          bg: 'bg-emerald-100 dark:bg-emerald-950/60',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
        };
      case 'leitor':
        return {
          label: '📖 Leitor',
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
        };
      default:
        return {
          label: '👤 Usuário',
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-800',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={onBack} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
            WikiWorldWeb
          </button>
          <ChevronRight size={10} className="text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300">Páginas Especiais</span>
          <ChevronRight size={10} className="text-slate-400" />
          <span className="font-semibold text-blue-600 dark:text-blue-400">Special:ListUsers</span>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
          title="Recarregar Lista do Banco"
        >
          <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          <span>{isRefreshing ? 'Atualizando...' : 'Recarregar'}</span>
        </button>
      </div>

      {/* 1.5 Mode Switcher: Diretório de Usuários vs Painel LGPD de Exclusões */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`pb-3 px-4 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeAdminTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users size={16} />
          <span>Diretório de Contas & Usuários</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('lgpd_requests')}
          className={`pb-3 px-4 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeAdminTab === 'lgpd_requests'
              ? 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert size={16} />
          <span>Solicitações de Exclusão LGPD (Art. 18, VI)</span>
          {pendingLgpdCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-red-600 text-white animate-pulse">
              {pendingLgpdCount} pendente{pendingLgpdCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {lgpdRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeAdminTab === 'users' && (
        <>
      {/* 2. Header with KPI Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400 shadow-xs">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif-heading font-bold text-slate-900 dark:text-white">
                  Busca Avançada & Lista de Usuários Cadastrados
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Diretório integral de contas registradas com busca parametrizada por cargo, reputação, medalhas, datas e conformidade LGPD.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Links & Export */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {onNavigateToAdminCouncil && (
              <button
                onClick={onNavigateToAdminCouncil}
                className="px-2.5 py-1.5 rounded bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Crown size={13} />
                <span>Special:Bureaucrats (Conselho)</span>
              </button>
            )}
            {onNavigateToCheckUser && (
              <button
                onClick={() => onNavigateToCheckUser('Usuario_Suspeito')}
                className="px-2.5 py-1.5 rounded bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold flex items-center gap-1.5 transition"
              >
                <UserX size={13} />
                <span>Special:CheckUser</span>
              </button>
            )}
            {onNavigateToPromotionRequests && (
              <button
                onClick={onNavigateToPromotionRequests}
                className="px-2.5 py-1.5 rounded bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700 font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Vote size={13} />
                <span>Special:PromotionRequests</span>
              </button>
            )}
            {onNavigateToUnblockRequests && (
              <button
                onClick={onNavigateToUnblockRequests}
                className="px-2.5 py-1.5 rounded bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold flex items-center gap-1.5 transition"
              >
                <Scale size={13} />
                <span>Special:UnblockRequests</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Stat Cards / Filter Triggers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-5">
          <button
            onClick={() => {
              setSelectedFilter('all');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'all'
                ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Geral
            </div>
            <div className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white mt-0.5">
              {counts.total}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Todos os Usuários</div>
          </button>

          <button
            onClick={() => {
              setSelectedFilter('admin');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'admin'
                ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 ring-1 ring-purple-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-purple-50 dark:hover:bg-purple-950/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Shield size={11} />
              Administração
            </div>
            <div className="text-xl font-bold font-serif-heading text-purple-900 dark:text-purple-200 mt-0.5">
              {counts.admin}
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">Burocratas & Sysops</div>
          </button>

          <button
            onClick={() => {
              setSelectedFilter('moderador');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'moderador'
                ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <UserCheck size={11} />
              Moderação
            </div>
            <div className="text-xl font-bold font-serif-heading text-blue-900 dark:text-blue-200 mt-0.5">
              {counts.moderador}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Guardiões & Revisores</div>
          </button>

          <button
            onClick={() => {
              setSelectedFilter('editor');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'editor'
                ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Edit3 size={11} />
              Editores
            </div>
            <div className="text-xl font-bold font-serif-heading text-emerald-900 dark:text-emerald-200 mt-0.5">
              {counts.editor}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Contribuidores Ativos</div>
          </button>

          <button
            onClick={() => {
              setSelectedFilter('leitor');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'leitor'
                ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-amber-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Users size={11} />
              Leitores
            </div>
            <div className="text-xl font-bold font-serif-heading text-amber-900 dark:text-amber-200 mt-0.5">
              {counts.leitor}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Membros da Comunidade</div>
          </button>

          <button
            onClick={() => {
              setSelectedFilter('banned');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'banned'
                ? 'border-rose-600 bg-rose-50/60 dark:bg-rose-950/40 ring-1 ring-rose-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <ShieldAlert size={11} />
              Bloqueados
            </div>
            <div className="text-xl font-bold font-serif-heading text-rose-900 dark:text-rose-200 mt-0.5">
              {counts.banned}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Suspensões Vandalismo</div>
          </button>
        </div>
      </div>

      {/* 3. Search Bar, Controls & Advanced Search Trigger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome de usuário, e-mail, biografia, cidade, especialidade..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Limpar termo"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Controls: Advanced Toggle, Sort, Layouts & Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Advanced Search Panel */}
            <button
              onClick={() => setShowAdvancedSearch((prev) => !prev)}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition border ${
                showAdvancedSearch || activeAdvFiltersCount > 0
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Busca Avançada</span>
              {activeAdvFiltersCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white text-blue-700 text-[10px] font-bold font-mono">
                  {activeAdvFiltersCount}
                </span>
              )}
              {showAdvancedSearch ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Sort Select */}
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
              <ArrowUpDown size={12} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="role">Cargo / Hierarquia</option>
                <option value="name_asc">Nome (A-Z)</option>
                <option value="name_desc">Nome (Z-A)</option>
                <option value="reputation_desc">Maior Reputação</option>
                <option value="reputation_asc">Menor Reputação</option>
                <option value="barnstars_desc">Mais Medalhas</option>
                <option value="created_desc">Cadastro Mais Recente</option>
                <option value="created_asc">Cadastro Mais Antigo</option>
                <option value="active_desc">Última Atividade</option>
              </select>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 p-0.5">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded transition ${
                  viewLayout === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Exibição em Cartões"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded transition ${
                  viewLayout === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Exibição em Tabela Técnica"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewLayout('stats')}
                className={`p-1.5 rounded transition ${
                  viewLayout === 'stats'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Censo & Painel de Estatísticas"
              >
                <BarChart3 size={14} />
              </button>
            </div>

            {/* Cadastrar Usuário Autorizado (Controle Estrito de Acesso) */}
            {isRealAdmin && (
              <button
                onClick={() => {
                  setShowRegisterModal(true);
                  setRegFeedback(null);
                }}
                className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Cadastrar e autorizar novo usuário (Login restrito)"
              >
                <UserPlus size={13} />
                <span className="hidden sm:inline">Cadastrar Usuário</span>
              </button>
            )}

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1 transition"
                title="Exportar dados filtrados em planilha CSV"
              >
                <FileSpreadsheet size={13} />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                title="Exportar dados filtrados em JSON"
              >
                <FileCode size={13} />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback alert for export */}
        {exportFeedback && (
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded flex items-center gap-1.5 animate-in fade-in-50">
            <CheckCircle2 size={13} />
            <span>{exportFeedback}</span>
          </div>
        )}

        {/* 4. Advanced Search Drawer / Form Panel */}
        {showAdvancedSearch && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-lg space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-blue-600" />
                Parâmetros de Busca Avançada
              </h3>
              {activeAdvFiltersCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <X size={11} /> Limpar Todos os Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Filter 1: Role / Cargo */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Cargo / Grupo:
                </label>
                <select
                  value={advRoleFilter}
                  onChange={(e) => setAdvRoleFilter(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Todos os Cargos</option>
                  <option value="admin">🛡️ Administrador (Sysop / Burocrata)</option>
                  <option value="moderador">⚖️ Moderador / Revisor</option>
                  <option value="editor">✍️ Editor Ativo</option>
                  <option value="leitor">📖 Leitor / Convidado</option>
                  <option value="banned">🚫 Bloqueado / Banido</option>
                </select>
              </div>

              {/* Filter 2: Email / Domain */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  E-mail ou Domínio:
                </label>
                <input
                  type="text"
                  value={advEmailQuery}
                  onChange={(e) => setAdvEmailQuery(e.target.value)}
                  placeholder="Ex: @gmail.com, admin..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Filter 3: Location */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Localização / Cidade:
                </label>
                <input
                  type="text"
                  value={advLocationQuery}
                  onChange={(e) => setAdvLocationQuery(e.target.value)}
                  placeholder="Ex: São Paulo, Brasil..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Filter 4: Bio / Keywords */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Biografia / Especialidade:
                </label>
                <input
                  type="text"
                  value={advBioQuery}
                  onChange={(e) => setAdvBioQuery(e.target.value)}
                  placeholder="Ex: LGPD, Ferrovias, Física..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Filter 5: Reputation Range */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Faixa de Reputação (Min - Max):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={advMinReputation}
                    onChange={(e) => setAdvMinReputation(e.target.value)}
                    placeholder="Mínimo"
                    className="w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    value={advMaxReputation}
                    onChange={(e) => setAdvMaxReputation(e.target.value)}
                    placeholder="Máximo"
                    className="w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Filter 6: Barnstars / Reconhecimentos */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Condecorações (Barnstars):
                </label>
                <select
                  value={advBarnstarFilter}
                  onChange={(e) => setAdvBarnstarFilter(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Qualquer quantidade</option>
                  <option value="with_barnstars">⭐ Ao menos 1 medalha</option>
                  <option value="three_plus">🏆 3 ou mais medalhas</option>
                </select>
              </div>

              {/* Filter 7: Account Status */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Status da Conta:
                </label>
                <select
                  value={advBanStatusFilter}
                  onChange={(e) => setAdvBanStatusFilter(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Todas as Contas</option>
                  <option value="active_only">✅ Apenas Contas Ativas (Sem Bloqueio)</option>
                  <option value="banned_only">🚫 Apenas Contas Bloqueadas</option>
                </select>
              </div>

              {/* Filter 8: Date Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Período de Cadastro:
                </label>
                <select
                  value={advDateShortcut}
                  onChange={(e) => setAdvDateShortcut(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Qualquer data</option>
                  <option value="today">Últimas 24 horas</option>
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Últimos 30 dias</option>
                  <option value="year">Último ano</option>
                  <option value="custom">Personalizado (De/Até)...</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range when selected */}
            {advDateShortcut === 'custom' && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-mono">De:</span>
                  <input
                    type="date"
                    value={advStartDate}
                    onChange={(e) => setAdvStartDate(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-mono">Até:</span>
                  <input
                    type="date"
                    value={advEndDate}
                    onChange={(e) => setAdvEndDate(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Checkbox Options: LGPD & Special Permissions */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advHasLgpdConsent}
                  onChange={(e) => setAdvHasLgpdConsent(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Com Consentimento / Auditoria LGPD Registrada</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advCanEditOnly}
                  onChange={(e) => setAdvCanEditOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Com Permissão de Edição</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advCanDeleteOnly}
                  onChange={(e) => setAdvCanDeleteOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Com Permissão de Eliminação de Artigos</span>
              </label>
            </div>
          </div>
        )}

        {/* Primary Filter Tabs: All, Admin, Mod, Outros */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos os Usuários', count: counts.total },
              { id: 'admin', label: '🛡️ Administração', count: counts.admin },
              { id: 'moderador', label: '⚖️ Moderação', count: counts.moderador },
              { id: 'outros', label: '👥 Outros', count: counts.outros },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedFilter(tab.id as MainCategoryFilter);
                  if (viewLayout === 'stats') setViewLayout('grid');
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  selectedFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    selectedFilter === tab.id
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sub-filters when "Outros" is selected */}
          {selectedFilter === 'outros' && (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/70 p-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs animate-in fade-in-50">
              <span className="text-[10px] font-mono text-slate-400 px-1">Filtrar Outros:</span>
              <button
                onClick={() => setSubFilterOutros('all_outros')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  subFilterOutros === 'all_outros'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos ({counts.outros})
              </button>
              <button
                onClick={() => setSubFilterOutros('editor')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  subFilterOutros === 'editor'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Editores ({counts.editor})
              </button>
              <button
                onClick={() => setSubFilterOutros('leitor')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  subFilterOutros === 'leitor'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Leitores ({counts.leitor})
              </button>
              <button
                onClick={() => setSubFilterOutros('banned')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  subFilterOutros === 'banned'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Bloqueados ({counts.banned})
              </button>
            </div>
          )}

          <div className="text-xs text-slate-500 font-mono">
            Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuários
          </div>
        </div>
      </div>

      {/* 5. Users Display Area */}
      {isLoading ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-mono">Carregando diretório de usuários cadastrados...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-400">
          <Users size={40} className="mx-auto mb-2 opacity-30 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 font-serif-heading">
            Nenhum usuário encontrado
          </h3>
          <p className="text-xs mt-1 max-w-md mx-auto">
            Nenhum usuário cadastrado corresponde aos critérios da busca avançada ou filtros selecionados.
          </p>
          <button
            onClick={handleClearAllFilters}
            className="mt-4 px-4 py-2 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Limpar Filtros & Ver Todos
          </button>
        </div>
      ) : viewLayout === 'stats' ? (
        /* Layout: Census Analytics & Stats */
        <div className="space-y-6 animate-in fade-in-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Governance Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <PieChart size={14} className="text-blue-600" />
                Distribuição de Governança
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-purple-600 font-bold">
                    <Shield size={12} /> Administração
                  </span>
                  <span className="font-mono font-bold">{counts.admin} ({Math.round((counts.admin / (counts.total || 1)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full" style={{ width: `${(counts.admin / (counts.total || 1)) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 text-blue-600 font-bold">
                    <UserCheck size={12} /> Moderação
                  </span>
                  <span className="font-mono font-bold">{counts.moderador} ({Math.round((counts.moderador / (counts.total || 1)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${(counts.moderador / (counts.total || 1)) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Edit3 size={12} /> Editores Ativos
                  </span>
                  <span className="font-mono font-bold">{counts.editor} ({Math.round((counts.editor / (counts.total || 1)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full" style={{ width: `${(counts.editor / (counts.total || 1)) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Users size={12} /> Leitores Registrados
                  </span>
                  <span className="font-mono font-bold">{counts.leitor} ({Math.round((counts.leitor / (counts.total || 1)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-600 h-full" style={{ width: `${(counts.leitor / (counts.total || 1)) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Box 2: Top Contributors by Reputation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Star size={14} className="text-amber-500" />
                Líderes de Reputação
              </h3>
              <div className="space-y-2">
                {[...users]
                  .sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0))
                  .slice(0, 5)
                  .map((u, i) => (
                    <div
                      key={u.uid}
                      onClick={() => onNavigateToUser(u.displayName || u.username || u.uid)}
                      className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-slate-400 w-4">{i + 1}.</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {u.displayName || u.username}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                        ⭐ {u.reputationScore ?? 0} pts
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Box 3: Top Decorated Users (Barnstars) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Award size={14} className="text-purple-600" />
                Quadro de Reconhecimento (Barnstars)
              </h3>
              <div className="space-y-2">
                {[...users]
                  .sort((a, b) => (b.barnstars?.length || 0) - (a.barnstars?.length || 0))
                  .slice(0, 5)
                  .map((u, i) => (
                    <div
                      key={u.uid}
                      onClick={() => onNavigateToUser(u.displayName || u.username || u.uid)}
                      className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-slate-400 w-4">{i + 1}.</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {u.displayName || u.username}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 shrink-0">
                        🏆 {u.barnstars?.length || 0} medalhas
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Diretrizes da Comunidade & Transparência:</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                A WikiWorldWeb promove transparência editorial com respeito integral à LGPD. Os dados exibidos referem-se à atividade pública editorial, concessão de condecorações comunitárias e controle de auditoria de cargos.
              </p>
            </div>
          </div>
        </div>
      ) : viewLayout === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const roleStyle = getRoleBadge(u);
            const userIdentifier = u.displayName || u.username || u.uid;

            return (
              <div
                key={u.uid}
                onClick={() => onNavigateToUser(userIdentifier)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-lg p-4 shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Top Avatar & Name Info */}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {u.photoURL && !u.avatarRemovedByAdmin ? (
                        <img
                          src={u.photoURL}
                          alt={u.displayName || u.username}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold font-serif text-lg shrink-0 shadow-xs">
                          {(u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      {u.avatarRemovedByAdmin && (
                        <div
                          className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white p-1 rounded-full shadow-xs border-2 border-white dark:border-slate-900"
                          title="LGPD: Imagem protegida pela administração (Inicial aplicada)"
                        >
                          <Shield size={10} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {u.displayName || u.username}
                        </h3>
                        {pendingRequestsMap.has(u.uid) && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse flex items-center gap-0.5 shrink-0"
                            title="Solicitação de exclusão pendente de homologação"
                          >
                            <Clock size={9} /> Solicitação LGPD
                          </span>
                        )}
                        {u.accountDeletedLGPD && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 flex items-center gap-0.5 shrink-0"
                            title="Conta excluída e dados eliminados sob a LGPD"
                          >
                            <UserX size={9} /> Excluída (LGPD)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                        User:{userIdentifier}
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                        >
                          {roleStyle.label}
                        </span>
                        {u.reputationScore !== undefined && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-mono font-bold border border-amber-200 dark:border-amber-800">
                            ⭐ {u.reputationScore} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio Preview */}
                  {u.bio && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-800">
                      {u.bio.replace(/[{}[\]=]/g, '').slice(0, 110)}...
                    </p>
                  )}
                </div>

                {/* Bottom Meta & Admin Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="text-amber-500 font-bold flex items-center gap-0.5" title="Condecorações (Barnstars)">
                      <Award size={11} /> {u.barnstars?.length || 0}
                    </span>
                    {u.location && (
                      <span className="truncate max-w-[110px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5" title={u.location}>
                        <MapPin size={10} /> {u.location}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isRealAdmin && (
                      <>
                        <button
                          onClick={(e) => handleOpenAvatarModal(u, e)}
                          className={`p-1 rounded transition ${
                            u.avatarRemovedByAdmin
                              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                              : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                          }`}
                          title="Alterar / Remover Imagem sob a LGPD (Inicial do Nome)"
                        >
                          <ImageOff size={13} />
                        </button>
                        <button
                          onClick={(e) => handleOpenRenameModal(u, e)}
                          className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 transition"
                          title="Retificar Nome (LGPD Art. 18, III)"
                        >
                          <UserCog size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeletionModal(u);
                          }}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition"
                          title="Excluir Conta e Anonimizar Contribuições (LGPD Art. 18, VI)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                      Ver Perfil <ChevronRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table Layout */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Usuário / Identificador</th>
                  <th className="py-3 px-4">Cargo / Categoria</th>
                  <th className="py-3 px-4">Reputação</th>
                  <th className="py-3 px-4">Barnstars</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Data de Cadastro</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredUsers.map((u) => {
                  const roleStyle = getRoleBadge(u);
                  const userIdentifier = u.displayName || u.username || u.uid;

                  return (
                    <tr
                      key={u.uid}
                      onClick={() => onNavigateToUser(userIdentifier)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            {u.photoURL && !u.avatarRemovedByAdmin ? (
                              <img
                                src={u.photoURL}
                                alt={u.displayName}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-serif text-xs">
                                {(u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            {u.avatarRemovedByAdmin && (
                              <div
                                className="absolute -top-1 -right-1 bg-emerald-600 text-white p-0.5 rounded-full shadow-xs border border-white dark:border-slate-900"
                                title="LGPD: Imagem protegida pela administração (Inicial aplicada)"
                              >
                                <Shield size={8} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                {u.displayName || u.username}
                              </span>
                              {pendingRequestsMap.has(u.uid) && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse flex items-center gap-0.5"
                                  title="Solicitação de exclusão pendente de homologação"
                                >
                                  <Clock size={9} /> Solicitação LGPD
                                </span>
                              )}
                              {u.accountDeletedLGPD && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 flex items-center gap-0.5"
                                  title="Conta excluída e dados eliminados sob a LGPD"
                                >
                                  <UserX size={9} /> Excluída (LGPD)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">User:{userIdentifier}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                        >
                          {roleStyle.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        ⭐ {u.reputationScore ?? 0} pts
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-500">
                        🏆 {u.barnstars?.length || 0}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {u.location || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isRealAdmin && (
                            <>
                              <button
                                onClick={(e) => handleOpenAvatarModal(u, e)}
                                className={`p-1.5 rounded transition ${
                                  u.avatarRemovedByAdmin
                                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                                }`}
                                title="Alterar / Remover Imagem sob a LGPD (Inicial do Nome)"
                              >
                                <ImageOff size={14} />
                              </button>
                              <button
                                onClick={(e) => handleOpenRenameModal(u, e)}
                                className="p-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 transition"
                                title="Retificar Nome (LGPD)"
                              >
                                <UserCog size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeletionModal(u);
                                }}
                                className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition"
                                title="Excluir Conta e Anonimizar Contribuições (LGPD Art. 18, VI)"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition font-semibold text-xs flex items-center gap-0.5">
                            Acessar <ChevronRight size={12} />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )}

      {/* 2.5 PAINEL ADMINISTRATIVO LGPD: SOLICITAÇÕES DE EXCLUSÃO DE CONTAS */}
      {activeAdminTab === 'lgpd_requests' && (
        <div className="space-y-6">
          {/* Header Card LGPD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 shadow-xs">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-serif-heading font-bold text-slate-900 dark:text-white">
                      Painel Administrativo LGPD: Exclusão e Anonimização
                    </h1>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Art. 18, VI LGPD
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    Atendimento formal às solicitações dos titulares de dados para eliminação definitiva de contas.
                    Ao homologar o procedimento, todos os dados pessoais do titular são expurgados, o <strong>Google UID é preservado</strong> para identificação preventiva de novas contas, e a autoria em todos os verbetes e revisões é retroativamente atribuída a um nome genérico neutro.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-red-600' : ''} />
                <span>Atualizar Fila</span>
              </button>
            </div>

            {/* Legal Framework Disclaimer Box */}
            <div className="mt-4 p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-blue-950 dark:text-blue-100">
                <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Garantias Normativas e Preservação do Google UID (Lei 13.709/2018 & Marco Civil)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                • <strong>Dados Cadastrais Eliminados:</strong> Nome real, e-mail, biografia, redes sociais, preferências de cookies e imagem de perfil são irrevogavelmente expurgados.
                <br />
                • <strong>Retenção Estrita do Google UID:</strong> O identificador único originado do Google OAuth é conservado estritamente como registro de segurança para que, caso o titular tente autenticar-se novamente, o sistema reconheça a identidade e mantenha as contribuições passadas desassociadas.
                <br />
                • <strong>Substituição de Autoria:</strong> Todo o acervo criado pelo titular (artigos, revisões de histórico e registros de edições) permanece sob a licença livre enciclopédica, atribuído ao pseudônimo institucional definido pelo Administrador.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
              <button
                onClick={() => setLgpdStatusFilter('all')}
                className={`p-3 rounded-lg border text-left transition ${
                  lgpdStatusFilter === 'all'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total de Solicitações
                </div>
                <div className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white mt-0.5">
                  {lgpdKpis.total}
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Fila Geral</div>
              </button>

              <button
                onClick={() => setLgpdStatusFilter('pendente')}
                className={`p-3 rounded-lg border text-left transition ${
                  lgpdStatusFilter === 'pendente'
                    ? 'border-red-600 bg-red-50/60 dark:bg-red-950/40 ring-1 ring-red-600'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Pendentes</span>
                  {lgpdKpis.pendentes > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </div>
                <div className="text-xl font-bold font-serif-heading text-red-600 dark:text-red-400 mt-0.5">
                  {lgpdKpis.pendentes}
                </div>
                <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">Aguardando Execução</div>
              </button>

              <button
                onClick={() => setLgpdStatusFilter('executada')}
                className={`p-3 rounded-lg border text-left transition ${
                  lgpdStatusFilter === 'executada'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Executadas
                </div>
                <div className="text-xl font-bold font-serif-heading text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {lgpdKpis.executadas}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Anonimizadas com Sucesso</div>
              </button>

              <button
                onClick={() => setLgpdStatusFilter('rejeitada')}
                className={`p-3 rounded-lg border text-left transition ${
                  lgpdStatusFilter === 'rejeitada'
                    ? 'border-slate-600 bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-600'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Rejeitadas / Canceladas
                </div>
                <div className="text-xl font-bold font-serif-heading text-slate-700 dark:text-slate-300 mt-0.5">
                  {lgpdKpis.rejeitadas}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Histórico Arquivado</div>
              </button>
            </div>
          </div>

          {/* Search & Status Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={lgpdSearchQuery}
                onChange={(e) => setLgpdSearchQuery(e.target.value)}
                placeholder="Buscar por usuário, email, Google UID ou protocolo..."
                className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto font-mono text-[11px]">
              {(['all', 'pendente', 'executada', 'rejeitada'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setLgpdStatusFilter(st)}
                  className={`px-2.5 py-1 rounded transition cursor-pointer font-bold ${
                    lgpdStatusFilter === st
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
          </div>

          {/* Requests List */}
          <div className="space-y-3">
            {filteredLgpdRequests.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center space-y-2">
                <ShieldCheck size={32} className="mx-auto text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Nenhuma solicitação encontrada
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {lgpdStatusFilter === 'pendente'
                    ? 'Todas as solicitações de exclusão sob a LGPD foram homologadas e processadas pela administração.'
                    : 'Não há registros de solicitações de exclusão de dados com os filtros atuais.'}
                </p>
              </div>
            ) : (
              filteredLgpdRequests.map((req) => {
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
                        : 'border-slate-200 dark:border-slate-800 opacity-80'
                    }`}
                  >
                    {/* Header Row: Protocol ID, Status, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${
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

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <Calendar size={12} />
                        <span>Solicitado em: {new Date(req.requestedAt).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Middle Row: User Details & UID Google */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: User identity & Google UID */}
                      <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-200 dark:border-slate-700/80">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span>Titular Solicitante:</span>
                          {matchedUser && (
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
                          Motivo Informado pelo Titular:
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900/60 p-2 rounded border border-slate-200 dark:border-slate-700 leading-relaxed">
                          "{req.userReason || 'Solicitação formal de eliminação de dados (LGPD Art. 18, VI).'}"
                        </p>
                      </div>
                    </div>

                    {/* Execution Details (if already executed) */}
                    {isExecuted && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded border border-emerald-200 dark:border-emerald-800/80 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
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
                            • Coleções atualizadas: <strong>{req.contributionsAnonymizedCount.pagesUpdated || 0}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rejection Details (if rejected) */}
                    {req.status === 'rejeitada' && req.rejectionReason && (
                      <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">
                        <span className="font-bold block text-[11px]">Justificativa Administrativa da Rejeição:</span>
                        <p className="text-[11px] mt-0.5">"{req.rejectionReason}"</p>
                        <span className="text-[10px] text-rose-700 dark:text-rose-400 font-mono block mt-1">
                          Avaliador: {req.processedByName} em {req.processedAt ? new Date(req.processedAt).toLocaleString('pt-BR') : '-'}
                        </span>
                      </div>
                    )}

                    {/* Action Bar (if Pending) */}
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
                          onClick={() => {
                            const targetU: UserProfile = matchedUser || {
                              uid: req.userUid,
                              displayName: req.originalDisplayName,
                              username: req.originalUsername,
                              email: req.originalEmail || '',
                              role: 'editor',
                              isGuest: false,
                              isBanned: false,
                              createdAt: req.requestedAt,
                            };
                            handleOpenDeletionModal(targetU, req);
                          }}
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
        </div>
      )}

      {/* 6. Admin LGPD User Rename Modal */}
      {targetUserForRename && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95 text-xs">
            <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono">
                <Scale size={16} className="text-purple-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Retificação Cadastral de Nome (LGPD Art. 18, III)
                </h3>
              </div>
              <button
                onClick={() => setTargetUserForRename(null)}
                className="text-white/70 hover:text-white p-0.5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200">
                A retificação de nome de usuário altera publicamente a assinatura de artigos, histórico de edições e páginas de discussão, mantendo o registro de auditoria LGPD.
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 font-mono">
                  Novo Nome de Exibição / Identificador:
                </label>
                <input
                  type="text"
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-bold focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 font-mono">
                  Fundamento Legal / Justificativa:
                </label>
                <select
                  value={renameJustification}
                  onChange={(e) => setRenameJustification(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                >
                  <option value="Solicitação do Titular de Dados (Art. 18, III LGPD)">
                    Solicitação do Titular de Dados (Art. 18, III LGPD)
                  </option>
                  <option value="Adequação às Diretrizes Editoriais de Nomenclatura">
                    Adequação às Diretrizes Editoriais de Nomenclatura
                  </option>
                  <option value="Remoção de Dados Sensíveis ou Pessoais Expostos">
                    Remoção de Dados Sensíveis ou Pessoais Expostos
                  </option>
                  <option value="outros">Outro Fundamento (Personalizado)...</option>
                </select>
              </div>

              {renameJustification === 'outros' && (
                <div>
                  <textarea
                    value={customJustification}
                    onChange={(e) => setCustomJustification(e.target.value)}
                    placeholder="Descreva a justificativa jurídica ou editorial..."
                    rows={2}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {renameFeedback && (
                <div
                  className={`p-2 rounded text-[11px] ${
                    renameFeedback.type === 'success'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300'
                  }`}
                >
                  {renameFeedback.msg}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setTargetUserForRename(null)}
                className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteRename}
                disabled={isProcessingRename}
                className="px-3.5 py-1 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center gap-1.5"
              >
                {isProcessingRename ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Retificar e Registrar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Admin LGPD User Avatar Removal Modal */}
      {targetUserForAvatarLGPD && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95 text-xs">
            <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Proteção de Imagem do Usuário (LGPD Art. 18)
                </h3>
              </div>
              <button
                onClick={() => setTargetUserForAvatarLGPD(null)}
                className="text-white/70 hover:text-white p-0.5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
                Em conformidade com a <strong>LGPD (Lei 13.709/2018)</strong> para proteção e minimização de dados pessoais, a remoção da foto do usuário pelo <strong>Administrador</strong> fará com que o avatar passe a exibir exclusivamente a <strong>primeira letra do nome</strong>, salvaguardando a privacidade e dados biométricos do titular.
              </div>

              {/* Status Atual & Prévia da Alteração */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {targetUserForAvatarLGPD.photoURL && !targetUserForAvatarLGPD.avatarRemovedByAdmin ? (
                      <img
                        src={targetUserForAvatarLGPD.photoURL}
                        alt="Foto Atual"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg font-serif">
                        {(targetUserForAvatarLGPD.displayName || targetUserForAvatarLGPD.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                      {targetUserForAvatarLGPD.displayName || targetUserForAvatarLGPD.username}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {targetUserForAvatarLGPD.photoURL && !targetUserForAvatarLGPD.avatarRemovedByAdmin ? 'Foto personalizada ativa' : 'Avatar com inicial ativo'}
                    </div>
                    {targetUserForAvatarLGPD.avatarRemovedByAdmin && (
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                        <Shield size={10} /> Já protegido sob LGPD
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Após Remoção</span>
                  <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg font-serif shadow-xs border-2 border-emerald-500">
                    {(targetUserForAvatarLGPD.displayName || targetUserForAvatarLGPD.username || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 font-mono">
                  Fundamento Legal / Justificativa LGPD:
                </label>
                <select
                  value={avatarJustification}
                  onChange={(e) => setAvatarJustification(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                >
                  <option value="Proteção e minimização de dados pessoais (Art. 6º, III e Art. 18 LGPD)">
                    Proteção e minimização de dados pessoais (Art. 6º, III e Art. 18 LGPD)
                  </option>
                  <option value="Solicitação do Titular para Eliminação de Foto/Imagem (Art. 18, VI LGPD)">
                    Solicitação do Titular para Eliminação de Foto/Imagem (Art. 18, VI LGPD)
                  </option>
                  <option value="Medida Protetiva Administrativa de Salvaguarda da Privacidade">
                    Medida Protetiva Administrativa de Salvaguarda da Privacidade
                  </option>
                  <option value="Prevenção contra Exposição Indevida de Menor ou Imagem Sensível">
                    Prevenção contra Exposição Indevida de Menor ou Imagem Sensível
                  </option>
                  <option value="outros">Outro Fundamento (Personalizado)...</option>
                </select>
              </div>

              {avatarJustification === 'outros' && (
                <div>
                  <textarea
                    value={customAvatarJustification}
                    onChange={(e) => setCustomAvatarJustification(e.target.value)}
                    placeholder="Descreva a justificativa LGPD para a remoção da foto..."
                    rows={2}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {avatarFeedback && (
                <div
                  className={`p-2 rounded text-[11px] ${
                    avatarFeedback.type === 'success'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300'
                  }`}
                >
                  {avatarFeedback.msg}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setTargetUserForAvatarLGPD(null)}
                className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteRemoveAvatar}
                disabled={isProcessingAvatarLGPD}
                className="px-3.5 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5"
              >
                {isProcessingAvatarLGPD ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck size={13} />
                )}
                Remover Imagem e Aplicar Inicial (LGPD)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL DE CADASTRO PRÉVIO DE USUÁRIO (RESTRIÇÃO DE REGISTRO / LOGIN) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Cadastrar e Autorizar Usuário
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Definir cargo ou permissões específicas para editores e membros.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setRegFeedback(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRegisterUser}>
              <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
                <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                  <strong>Gestão de Acesso:</strong> Usuários com Conta Google podem entrar diretamente e ter seus perfis criados. Você pode utilizar este formulário para pré-cadastrar contas com cargos privilegiados (moderador, administrador) ou credenciais comunitárias personalizadas.
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail do Usuário <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ex: usuario@gmail.com"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">
                    O usuário precisará usar este mesmo e-mail ao efetuar login com o Google.
                  </span>
                </div>

                {/* Nome de Exibição */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo ou Nome de Exibição <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="ex: Maria Silva"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Nome de Usuário / Nickname (Opcional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome de Usuário (Wiki Username / Opcional)
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="ex: MariaSilva_Wiki"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Nível de Acesso Inicial
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="editor">Editor (Pode criar, editar artigos e páginas de discussão)</option>
                    <option value="leitor">Leitor (Apenas leitura; sem permissão de edição direta)</option>
                    <option value="moderador">Moderador (Pode moderar conteúdos, reverter edições e excluir)</option>
                    <option value="admin">Administrador (Controle total da Wiki, segurança e usuários)</option>
                  </select>
                </div>

                {/* Biografia / Nota Administrativa */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Biografia / Nota de Cadastro (Opcional)
                  </label>
                  <textarea
                    value={regBio}
                    onChange={(e) => setRegBio(e.target.value)}
                    placeholder="Breve descrição sobre a autorização deste usuário..."
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                {regFeedback && (
                  <div
                    className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                      regFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {regFeedback.type === 'success' ? (
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                    )}
                    <span>{regFeedback.msg}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setRegFeedback(null);
                  }}
                  className="px-3 py-1.5 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingRegister}
                  className="px-4 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingRegister ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserPlus size={13} />
                  )}
                  Cadastrar e Autorizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Admin LGPD User Account Deletion & Anonymization Modal (Art. 18, VI) */}
      {targetUserForDeletionLGPD && (
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
                  setTargetUserForDeletionLGPD(null);
                  setTargetRequestForExecution(null);
                  setDeletionFeedback(null);
                }}
                className="text-white/70 hover:text-white p-0.5 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto">
              {/* Target User Info Card */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                  <span className="text-slate-500 font-mono text-[11px]">Nome Atual:</span>
                  <strong className="text-slate-900 dark:text-white font-sans">
                    {targetUserForDeletionLGPD.displayName || targetUserForDeletionLGPD.username}
                  </strong>
                </div>
                {targetUserForDeletionLGPD.email && (
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                    <span className="text-slate-500 font-mono text-[11px]">E-mail:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                      {targetUserForDeletionLGPD.email}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-mono text-[11px]">Google UID (Preservado):</span>
                  <code className="text-blue-600 dark:text-blue-400 font-mono text-[11px] bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded">
                    {targetUserForDeletionLGPD.uid}
                  </code>
                </div>
              </div>

              {/* Callout: Preservação Preventiva do Google UID */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-300 dark:border-amber-800/80 text-[11px] text-amber-900 dark:text-amber-200 space-y-1 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-amber-950 dark:text-amber-100 font-mono text-[11px] uppercase">
                  <AlertTriangle size={13} className="text-amber-600" />
                  <span>Preservação Estrita do Google UID para Identificação Preventiva</span>
                </div>
                <p>
                  Todos os dados cadastrais (nome, e-mail, biografia, foto e preferências) serão expurgados.
                  O <strong>Google UID</strong> continuará retido exclusivamente para que, se este titular realizar novo login ou cadastro com sua conta Google, o sistema reconheça o identificador preventivamente e mantenha o histórico de edições passadas desassociado.
                </p>
              </div>

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
                      setCustomPseudonymInput(targetUserForDeletionLGPD.uid);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono focus:ring-1 focus:ring-red-500"
                >
                  <option value={targetUserForDeletionLGPD.uid}>
                    Anonimização: Substituir Nome de Usuário pelo UID Google ({targetUserForDeletionLGPD.uid}) [Padrão LGPD]
                  </option>
                  <option value="custom">Outro Identificador Personalizado...</option>
                </select>

                {genericPseudonymPreset !== 'custom' ? (
                  <div className="mt-1.5 p-2 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-800/60 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-1.5 leading-relaxed">
                    <CheckCircle2 size={13} className="text-blue-600 mt-0.5 shrink-0" />
                    <span>
                      <strong>Anonimização Ativa:</strong> O nome cadastral de <strong>{targetUserForDeletionLGPD.displayName || targetUserForDeletionLGPD.username}</strong> será substituído estritamente pelo seu UID Google (<code>{targetUserForDeletionLGPD.uid}</code>) em todo o perfil, histórico e artigos.
                    </span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={customPseudonymInput}
                    onChange={(e) => setCustomPseudonymInput(e.target.value)}
                    placeholder={`Ex: ${targetUserForDeletionLGPD.uid}`}
                    className="mt-1.5 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono"
                  />
                )}
              </div>

              {/* Field: Justificativa Legal */}
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

              {/* Checklist de Conformidade */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] uppercase font-mono">
                  Ações que serão executadas no banco de dados:
                </span>
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <Check size={12} />
                  <span>Exclusão permanente de email, foto de perfil, biografia e dados cadastrais.</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                  <Check size={12} />
                  <span>Preservação exclusiva do Google UID ({targetUserForDeletionLGPD.uid}) para identificação.</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                  <Check size={12} />
                  <span>Substituição retroativa do nome em todos os artigos e histórico de edições.</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Check size={12} />
                  <span>Registro perene na auditoria criptográfica/imutável da administração.</span>
                </div>
              </div>

              {/* Feedback Message */}
              {deletionFeedback && (
                <div
                  className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
                    deletionFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {deletionFeedback.type === 'success' ? (
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertTriangle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">{deletionFeedback.msg}</span>
                    {deletionFeedback.details && (
                      <span className="text-[10px] font-mono block mt-1">
                        Verbetes atualizados: {deletionFeedback.details.articlesUpdated} | Revisões: {deletionFeedback.details.revisionsUpdated}
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
                  setTargetUserForDeletionLGPD(null);
                  setTargetRequestForExecution(null);
                  setDeletionFeedback(null);
                }}
                disabled={isProcessingDeletion}
                className="px-3 py-1.5 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDeletion}
                disabled={isProcessingDeletion}
                className="px-4 py-1.5 text-xs rounded bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessingDeletion ? (
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

      {/* 9. Admin Rejection Modal for LGPD Deletion Request */}
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

              {rejectionError && (
                <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-1.5">
                  <AlertTriangle size={13} className="shrink-0 text-rose-600" />
                  <span>{rejectionError}</span>
                </div>
              )}
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
