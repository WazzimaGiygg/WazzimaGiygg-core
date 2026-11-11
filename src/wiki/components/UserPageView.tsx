import React, { useState, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  Shield,
  Award,
  MessageSquare,
  History,
  Settings,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Plus,
  Send,
  Trash2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ThumbsUp,
  Clock,
  Calendar,
  MapPin,
  Globe,
  Tag,
  Check,
  X,
  FileText,
  ChevronRight,
  Info,
  Layers,
  Search,
  Filter,
  UserCheck,
  Users,
  Vote,
  Scale,
  UserX,
  Link2,
  Copy,
  ImageOff,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  UserProfile,
  UserRole,
  UserPermissions,
  UserBarnstar,
  UserboxItem,
  UserTalkMessage,
  UserAuditLog,
  WikiArticle,
  WikiPage,
  TalkReply,
  DailyEditLimitStatus,
} from '../types';
import { parseWikitext } from '../utils/wikitextParser';
import { StorageService } from '../services/storageService';
import { buildUidPermalink } from '../utils/urlRouter';

interface UserPageViewProps {
  targetUserIdentifier: string; // uid or username
  currentUser: UserProfile | null;
  allArticles?: WikiArticle[];
  allPages?: WikiPage[];
  initialTab?: 'profile' | 'talk' | 'contributions' | 'admin';
  onNavigateToArticle: (id: string) => void;
  onNavigateToPage: (uid: string) => void;
  onNavigateToUser: (identifier: string) => void;
  onNavigateToContactAdmin?: () => void;
  onNavigateToPromotionRequests?: () => void;
  onNavigateToUnblockRequests?: () => void;
  onNavigateToCheckUser?: (username: string) => void;
  onBack?: () => void;
}

export const UserPageView: React.FC<UserPageViewProps> = ({
  targetUserIdentifier,
  currentUser,
  allArticles = [],
  allPages = [],
  initialTab = 'profile',
  onNavigateToArticle,
  onNavigateToPage,
  onNavigateToUser,
  onNavigateToContactAdmin,
  onNavigateToPromotionRequests,
  onNavigateToUnblockRequests,
  onNavigateToCheckUser,
  onBack,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'talk' | 'contributions' | 'admin'>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUid, setCopiedUid] = useState(false);

  // Profile Edit State
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [bioSaveSuccess, setBioSaveSuccess] = useState(false);

  // User Talk State
  const [talkMessages, setTalkMessages] = useState<UserTalkMessage[]>([]);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newTopicType, setNewTopicType] = useState<UserTalkMessage['tipo']>('geral');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [talkFilter, setTalkFilter] = useState<string>('todos');

  // Barnstar Modal State
  const [showBarnstarModal, setShowBarnstarModal] = useState(false);
  const [barnstarTitle, setBarnstarTitle] = useState('⭐ Estrela do Editor Incansável');
  const [barnstarDescription, setBarnstarDescription] = useState('Pelo trabalho diligente na melhoria e verificação dos verbetes da WikiWorldWeb.');
  const [barnstarIcon, setBarnstarIcon] = useState('⭐');
  const [barnstarSuccess, setBarnstarSuccess] = useState(false);

  // Contributions State
  const [contributions, setContributions] = useState<
    {
      type: 'create' | 'edit';
      articleId: string;
      articleTitle: string;
      pageUid: string;
      date: string;
      summary: string;
      deltaBytes?: number;
      isMinor?: boolean;
    }[]
  >([]);

  // Admin Controls State
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('editor');
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState<'permanente' | 'temporario' | 'advertencia'>('temporario');
  const [banDurationDays, setBanDurationDays] = useState<number>(7);
  const [adminWarningText, setAdminWarningText] = useState('');
  const [adminFeedback, setAdminFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Granular permissions state
  const [perms, setPerms] = useState<UserPermissions>({
    canEdit: true,
    canCreate: true,
    canTalk: true,
    canDelete: false,
    canGrantBarnstars: false,
  });

  // Somente administradores e moderadores possuem permissão para conceder condecorações/medalhas
  const canGrantBarnstars = Boolean(
    currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderador')
  );

  // Admin Rename User (LGPD / Marco Civil) State
  const [newDisplayName, setNewDisplayName] = useState('');
  const [renameJustification, setRenameJustification] = useState('Solicitação do Titular de Dados (Art. 18, III LGPD)');
  const [customJustification, setCustomJustification] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Admin Avatar Removal (LGPD Art. 18 - Inicial do Nome) State
  const [avatarJustification, setAvatarJustification] = useState('Proteção e minimização de dados pessoais (Art. 6º, III e Art. 18 LGPD)');
  const [customAvatarJustification, setCustomAvatarJustification] = useState('');
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);

  const [dailyLimitStatus, setDailyLimitStatus] = useState<DailyEditLimitStatus | null>(null);

  const isAdminOrMod =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'moderador' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const isRealAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const isOwner =
    currentUser &&
    userProfile &&
    (currentUser.uid === userProfile.uid ||
      currentUser.email === userProfile.email ||
      currentUser.displayName === userProfile.displayName);

  // Load User Data
  const loadUserData = async () => {
    setIsLoading(true);
    const profile = await StorageService.getUserProfile(targetUserIdentifier);
    if (profile) {
      setUserProfile(profile);
      setBioText(profile.bio || `= ${profile.displayName || profile.username} =\nEditor da enciclopédia WikiWorldWeb.`);
      setSelectedRole(profile.role);
      if (profile.permissions) {
        setPerms(profile.permissions);
      } else {
        setPerms({
          canEdit: !profile.isBanned,
          canCreate: !profile.isBanned && profile.role !== 'leitor',
          canTalk: !profile.isBanned,
          canDelete: profile.role === 'admin' || profile.role === 'moderador',
          canGrantBarnstars: !profile.isBanned && profile.role !== 'convidado',
        });
      }

      // Load Talk Messages
      const msgs = await StorageService.fetchUserTalkMessages(profile.uid);
      setTalkMessages(msgs);

      // Load Audit Logs
      const logs = StorageService.getUserAuditLogs(profile.uid);
      setAuditLogs(logs);

      // Load Contributions
      const contribs = await StorageService.getUserContributions(
        profile.displayName || profile.username || profile.uid,
        profile.uid
      );
      setContributions(contribs);

      // Load Daily Edit Limit Status
      try {
        const limitStatus = await StorageService.getDailyEditLimitStatus(profile);
        setDailyLimitStatus(limitStatus);
      } catch (err) {
        console.warn('Erro ao verificar status de edições diárias:', err);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUserData();
  }, [targetUserIdentifier]);

  // Real-time synchronization for user talk messages
  useEffect(() => {
    if (!userProfile?.uid) return;
    const unsubscribe = StorageService.subscribeToUserTalkMessages(userProfile.uid, (remoteMsgs) => {
      if (remoteMsgs && remoteMsgs.length > 0) {
        setTalkMessages(remoteMsgs);
      }
    });
    return () => unsubscribe();
  }, [userProfile?.uid]);

  // Sincronização em tempo real de remoção de foto sob LGPD
  useEffect(() => {
    const handleAvatarUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<UserProfile>;
      const updatedUser = customEvt.detail;
      if (updatedUser && userProfile && (updatedUser.uid === userProfile.uid || updatedUser.email === userProfile.email)) {
        const copy: UserProfile = {
          ...userProfile,
          ...updatedUser,
          photoURL: undefined,
          avatarRemovedByAdmin: true,
        };
        delete (copy as any).photoURL;
        setUserProfile(copy);
      }
    };
    window.addEventListener('wikizero:user-avatar-updated', handleAvatarUpdated);
    return () => {
      window.removeEventListener('wikizero:user-avatar-updated', handleAvatarUpdated);
    };
  }, [userProfile?.uid, userProfile?.email]);

  // Sync active tab whenever initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Wikitext Render for Bio
  const parsedBio = useMemo(() => {
    if (!userProfile?.bio) return { html: '', toc: [], references: [], categories: [] };
    return parseWikitext(userProfile.bio);
  }, [userProfile?.bio]);

  // Handle Bio Save
  const handleSaveBio = async () => {
    if (!userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      bio: bioText,
    };
    await StorageService.saveCommunityUser(updated);
    setUserProfile(updated);
    setIsEditingBio(false);
    setBioSaveSuccess(true);
    setTimeout(() => setBioSaveSuccess(false), 3000);
  };

  // Handle Add Talk Topic
  const handleAddTalkTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicContent.trim() || !userProfile) return;

    if (!currentUser || currentUser.isGuest) {
      alert('Somente usuários cadastrados e logados podem enviar mensagens de discussão.');
      return;
    }
    if (currentUser.isBanned) {
      alert('Sua conta está suspensa. Usuários bloqueados não podem enviar mensagens de discussão.');
      return;
    }

    try {
      const newMsg = await StorageService.addUserTalkMessage(
        userProfile.uid,
        userProfile.displayName || userProfile.username || userProfile.uid,
        {
          titulo: newTopicTitle,
          conteudo: newTopicContent,
          tipo: newTopicType,
        },
        currentUser
      );

      setTalkMessages((prev) => [newMsg, ...(Array.isArray(prev) ? prev : []).filter((m) => m && m.id !== newMsg.id)]);
      setNewTopicTitle('');
      setNewTopicContent('');
      setShowNewTopicModal(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar mensagem.');
    }
  };

  // Handle Add Reply to Talk Thread
  const handleAddReply = async (messageId: string) => {
    const text = replyTexts[messageId];
    if (!text || !text.trim()) return;

    if (!currentUser || currentUser.isGuest) {
      alert('Somente usuários cadastrados e logados podem responder em discussões.');
      return;
    }
    if (currentUser.isBanned) {
      alert('Sua conta está suspensa. Usuários bloqueados não podem responder mensagens.');
      return;
    }

    try {
      const reply = await StorageService.addUserTalkReply(messageId, text, currentUser);
      if (reply) {
        setTalkMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: 'em_discussao',
                  respostas: [...msg.respostas, reply],
                }
              : msg
          )
        );
        setReplyTexts((prev) => ({ ...prev, [messageId]: '' }));
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao responder mensagem.');
    }
  };

  // Handle Talk Status Change
  const handleUpdateTalkStatus = async (messageId: string, status: UserTalkMessage['status']) => {
    const success = await StorageService.updateUserTalkStatus(messageId, status);
    if (success) {
      setTalkMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status } : m))
      );
    }
  };

  // Handle Award Barnstar
  const handleAwardBarnstar = async () => {
    if (!userProfile) return;
    if (!canGrantBarnstars) {
      alert('Apenas administradores e moderadores possuem autorização para conceder medalhas na WikiWorldWeb.');
      return;
    }
    const updated = await StorageService.awardBarnstar(
      userProfile.uid,
      {
        title: barnstarTitle,
        description: barnstarDescription,
        icon: barnstarIcon,
        awardedBy: currentUser?.displayName || 'Comunidade WikiWorldWeb',
      },
      currentUser
    );

    if (updated) {
      setUserProfile(updated);
      setBarnstarSuccess(true);
      setTimeout(() => {
        setBarnstarSuccess(false);
        setShowBarnstarModal(false);
      }, 2000);
      // Reload talk messages to show the barnstar topic
      setTalkMessages(StorageService.getUserTalkMessages(userProfile.uid));
    }
  };

  // Handle Admin Change Role
  const handleChangeRole = async () => {
    if (!userProfile) return;
    const updated = await StorageService.updateUserRole(userProfile.uid, selectedRole, currentUser);
    if (updated) {
      setUserProfile(updated);
      setAuditLogs(StorageService.getUserAuditLogs(userProfile.uid));
      setAdminFeedback({ msg: `Cargo alterado para "${selectedRole}" com sucesso.`, type: 'success' });
      setTimeout(() => setAdminFeedback(null), 4000);
    }
  };

  // Handle Admin Ban User
  const handleBanUser = async () => {
    if (!userProfile || !banReason.trim()) {
      setAdminFeedback({ msg: 'Por favor, informe a justificativa do bloqueio.', type: 'error' });
      return;
    }
    const updated = await StorageService.banUser(
      userProfile.uid,
      banReason,
      banType,
      banType === 'temporario' ? banDurationDays : undefined,
      currentUser
    );
    if (updated) {
      setUserProfile(updated);
      setAuditLogs(StorageService.getUserAuditLogs(userProfile.uid));
      setTalkMessages(StorageService.getUserTalkMessages(userProfile.uid));
      setAdminFeedback({ msg: `Ação de bloqueio/advertência aplicada.`, type: 'success' });
      setBanReason('');
      setTimeout(() => setAdminFeedback(null), 4000);
    }
  };

  // Handle Admin Unban User
  const handleUnbanUser = async () => {
    if (!userProfile) return;
    const updated = await StorageService.unbanUser(userProfile.uid, currentUser);
    if (updated) {
      setUserProfile(updated);
      setAuditLogs(StorageService.getUserAuditLogs(userProfile.uid));
      setAdminFeedback({ msg: 'Bloqueio revogado com sucesso.', type: 'success' });
      setTimeout(() => setAdminFeedback(null), 4000);
    }
  };

  // Handle Admin Update Permissions
  const handleSavePermissions = async () => {
    if (!userProfile) return;
    const updated = await StorageService.updateUserPermissions(userProfile.uid, perms, currentUser);
    if (updated) {
      setUserProfile(updated);
      setAuditLogs(StorageService.getUserAuditLogs(userProfile.uid));
      setAdminFeedback({ msg: 'Permissões atualizadas com sucesso.', type: 'success' });
      setTimeout(() => setAdminFeedback(null), 4000);
    }
  };

  // Handle Admin Reset Bio
  const handleResetBio = async () => {
    if (!userProfile) return;
    if (!confirm('Deseja realmente resetar o conteúdo da biografia deste usuário?')) return;
    const updated = await StorageService.resetUserBio(userProfile.uid, currentUser);
    if (updated) {
      setUserProfile(updated);
      setBioText(updated.bio || '');
      setAuditLogs(StorageService.getUserAuditLogs(userProfile.uid));
      setAdminFeedback({ msg: 'Biografia do usuário resetada com sucesso.', type: 'success' });
      setTimeout(() => setAdminFeedback(null), 4000);
    }
  };

  // Handle Admin Rename User (LGPD / Marco Civil)
  const handleAdminRenameUser = async () => {
    if (!userProfile) return;
    const targetName = newDisplayName.trim();
    if (!targetName) {
      setAdminFeedback({ msg: 'Por favor, informe o novo nome de exibição do usuário.', type: 'error' });
      return;
    }

    if (targetName.length < 3 || targetName.length > 50) {
      setAdminFeedback({ msg: 'O novo nome deve conter entre 3 e 50 caracteres.', type: 'error' });
      return;
    }

    const justification = renameJustification === 'outros'
      ? (customJustification.trim() || 'Retificação Cadastral em conformidade com a LGPD e Marco Civil')
      : renameJustification;

    setIsRenaming(true);
    const result = await StorageService.adminUpdateUserName(
      userProfile.uid,
      targetName,
      justification,
      currentUser
    );
    setIsRenaming(false);

    if (result.success && result.user) {
      setUserProfile(result.user);
      setAuditLogs(StorageService.getUserAuditLogs(userProfile.uid));
      setTalkMessages(StorageService.getUserTalkMessages(userProfile.uid));
      setAdminFeedback({ msg: result.message, type: 'success' });
      setNewDisplayName('');
      setCustomJustification('');
      setTimeout(() => setAdminFeedback(null), 5000);
    } else {
      setAdminFeedback({ msg: result.message, type: 'error' });
      setTimeout(() => setAdminFeedback(null), 5000);
    }
  };

  // Handle Admin Remove Avatar (LGPD Art. 18 / Proteção de Dados - Inicial do Nome)
  const handleAdminRemoveAvatarLGPD = async () => {
    if (!userProfile) return;
    if (!isRealAdmin) {
      setAdminFeedback({ msg: 'Acesso negado: Apenas Administradores podem remover a foto de usuários sob a LGPD.', type: 'error' });
      return;
    }

    const justification = avatarJustification === 'outros'
      ? (customAvatarJustification.trim() || 'Proteção e minimização de dados pessoais sob a LGPD')
      : avatarJustification;

    setIsProcessingAvatar(true);
    const result = await StorageService.adminRemoveUserAvatarLGPD(
      userProfile.uid,
      justification,
      currentUser
    );
    setIsProcessingAvatar(false);

    if (result.success && result.user) {
      const sanitized: UserProfile = {
        ...result.user,
        photoURL: undefined,
        avatarRemovedByAdmin: true,
      };
      delete (sanitized as any).photoURL;
      setUserProfile(sanitized);
      setAuditLogs(StorageService.getUserAuditLogs(userProfile.uid));
      setTalkMessages(StorageService.getUserTalkMessages(userProfile.uid));
      setAdminFeedback({ msg: result.message, type: 'success' });
      setCustomAvatarJustification('');
      setTimeout(() => setAdminFeedback(null), 5000);
    } else {
      setAdminFeedback({ msg: result.message, type: 'error' });
      setTimeout(() => setAdminFeedback(null), 5000);
    }
  };

  // Filtered Talk Messages
  const filteredTalkMessages = useMemo(() => {
    const safeTalkMessages = Array.isArray(talkMessages) ? talkMessages : [];
    if (talkFilter === 'todos') return safeTalkMessages;
    if (talkFilter === 'aviso') return safeTalkMessages.filter((m) => m?.tipo === 'aviso_admin');
    if (talkFilter === 'barnstar') return safeTalkMessages.filter((m) => m?.tipo === 'barnstar');
    if (talkFilter === 'duvida') return safeTalkMessages.filter((m) => m?.tipo === 'duvida');
    if (talkFilter === 'aberto') return safeTalkMessages.filter((m) => m && (m.status === 'aberto' || m.status === 'em_discussao'));
    return safeTalkMessages;
  }, [talkMessages, talkFilter]);

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-mono">Carregando página de usuário...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4 text-2xl font-serif">
          ?
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Página de Usuário Não Encontrada
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
          O usuário <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-blue-600 dark:text-blue-400">{targetUserIdentifier}</code> ainda não possui registro ativo ou página criada na WikiWorldWeb.
        </p>
        <button
          onClick={onBack || (() => window.history.back())}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
        >
          Voltar para a Enciclopédia
        </button>
      </div>
    );
  }

  const roleConfig: Record<UserRole, { label: string; bg: string; text: string; border: string; icon: any }> = {
    admin: {
      label: 'Administrador / Burocrata',
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-800',
      icon: Shield,
    },
    moderador: {
      label: 'Moderador da Comunidade',
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-800',
      icon: Shield,
    },
    editor: {
      label: 'Editor Verificado',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-800',
      icon: Edit3,
    },
    leitor: {
      label: 'Leitor & Colaborador',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-700',
      icon: UserIcon,
    },
    convidado: {
      label: 'Convidado / IP',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800',
      icon: UserIcon,
    },
  };

  const currentRoleStyle = roleConfig[userProfile.role] || roleConfig.leitor;
  const RoleIcon = currentRoleStyle.icon;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 font-sans">
      {/* 1. Micro Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-mono">
        <button
          onClick={onBack}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1"
        >
          <span>WikiWorldWeb</span>
        </button>
        <ChevronRight size={10} className="text-slate-400" />
        <span className="text-slate-700 dark:text-slate-300">Espaço Nominal: Usuário</span>
        <ChevronRight size={10} className="text-slate-400" />
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          User:{userProfile.displayName || userProfile.username}
        </span>
      </div>

      {/* 2. Banner do Usuário / Card de Cabeçalho */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs mb-6 relative overflow-hidden">
        {/* Top Accent Strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            userProfile.isBanned
              ? 'bg-red-600'
              : userProfile.role === 'admin'
              ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600'
              : userProfile.role === 'moderador'
              ? 'bg-blue-600'
              : userProfile.role === 'editor'
              ? 'bg-emerald-600'
              : 'bg-slate-400'
          }`}
        />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
          {/* Avatar & Identificação Principal */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative flex-shrink-0">
              {userProfile.photoURL && !userProfile.avatarRemovedByAdmin ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-serif text-2xl sm:text-3xl font-bold shadow-xs border-2 border-white/20">
                  {(userProfile.displayName || userProfile.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online / Status Indicator Badge */}
              <div
                className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white dark:border-slate-900 ${
                  userProfile.isBanned
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
                title={userProfile.isBanned ? 'Conta Suspensa' : 'Usuário Ativo'}
              >
                {userProfile.isBanned ? <Lock size={10} /> : <Check size={10} />}
              </div>

              {/* LGPD Image Protection Badge */}
              {userProfile.avatarRemovedByAdmin && (
                <div
                  className="absolute -top-1.5 -left-1.5 p-1 rounded-full bg-emerald-600 text-white border-2 border-white dark:border-slate-900 shadow-xs"
                  title="LGPD: Imagem alterada pela Administração para salvaguarda de dados pessoais (Inicial do nome aplicada)"
                >
                  <ShieldCheck size={11} />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif-heading font-bold text-slate-900 dark:text-white tracking-tight">
                  {userProfile.displayName || userProfile.username}
                </h1>
                {/* Role Badge */}
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}
                >
                  <RoleIcon size={11} />
                  {userProfile.isBanned ? 'Conta Bloqueada' : currentRoleStyle.label}
                </span>

                {/* LGPD Tag if Avatar Protected */}
                {userProfile.avatarRemovedByAdmin && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
                    title={`Foto de perfil protegida pela Administração sob a LGPD em ${userProfile.avatarRemovedAt ? new Date(userProfile.avatarRemovedAt).toLocaleDateString('pt-BR') : ''}. Motivo: ${userProfile.avatarRemovedReason || 'Proteção de dados'}`}
                  >
                    <ShieldCheck size={11} className="text-emerald-600 dark:text-emerald-400" />
                    <span>LGPD: Foto Protegida (Inicial)</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  User:{userProfile.displayName || userProfile.username}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700" title={`Identificador Único Google/Sistema: ${userProfile.uid}`}>
                  <span className="font-semibold text-slate-400">UID:</span>
                  <span className="font-mono max-w-[170px] truncate">{userProfile.uid}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> Desde {new Date(userProfile.createdAt || '2026-01-15').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                </span>
                {userProfile.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {userProfile.location}
                    </span>
                  </>
                )}
              </div>

              {/* Status de Bloqueio (se houver) */}
              {userProfile.isBanned && (
                <div className="mt-2.5 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>
                    <strong>Conta Suspensa:</strong> {userProfile.banReason || 'Infração às diretrizes editoriais.'}
                    {userProfile.banExpiresAt && ` (Expira em: ${new Date(userProfile.banExpiresAt).toLocaleDateString('pt-BR')})`}
                  </span>
                </div>
              )}

              {/* Status de Exclusão LGPD (se houver) */}
              {userProfile.accountDeletedLGPD && (
                <div className="mt-2.5 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <ShieldAlert size={15} className="text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-[11px] leading-relaxed">
                    <strong>Conta Excluída & Anonimizada (LGPD Art. 18, VI):</strong> Os dados pessoais foram eliminados definitivamente e a autoria das contribuições foi associada ao UID Google do titular (<code>{userProfile.uid}</code>).
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas Rápidas & Ações Principais */}
          <div className="flex flex-wrap md:flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 min-w-[70px]">
                <div className="text-sm sm:text-base font-bold font-mono text-blue-600 dark:text-blue-400">
                  {userProfile.reputationScore || 100}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Reputação</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 min-w-[70px]">
                <div className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {contributions.length}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Edições</div>
              </div>
              <div
                className="bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 min-w-[70px]"
                title={
                  dailyLimitStatus?.isExempt
                    ? 'Moderadores e Administradores possuem permissão para edições ilimitadas.'
                    : `Cota diária de 5 edições para o papel de editor. ${dailyLimitStatus ? dailyLimitStatus.count : 0}/5 edições realizadas hoje. Renovado à meia-noite.`
                }
              >
                <div className={`text-sm sm:text-base font-bold font-mono ${
                  dailyLimitStatus?.isExempt
                    ? 'text-purple-600 dark:text-purple-400'
                    : (dailyLimitStatus && !dailyLimitStatus.allowed)
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {dailyLimitStatus?.isExempt ? '∞' : `${dailyLimitStatus ? dailyLimitStatus.count : 0}/5`}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {dailyLimitStatus?.isExempt ? 'Cota Mod/Adm' : 'Cota Diária'}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 min-w-[70px]">
                <div className="text-sm sm:text-base font-bold font-mono text-amber-500">
                  {userProfile.barnstars?.length || 0}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Medalhas</div>
              </div>
            </div>

            {/* Ações de Interação Rápida */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
              {/* UID Google/Sistema Permalink Button */}
              <button
                onClick={() => {
                  const permalink = buildUidPermalink(`User:${userProfile.uid}`);
                  navigator.clipboard.writeText(permalink);
                  setCopiedUid(true);
                  setTimeout(() => setCopiedUid(false), 2000);
                }}
                title={`Copiar Link Permanente Seguro UID (?uid=User:${userProfile.uid})`}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition font-mono"
              >
                <Link2 size={13} className="text-blue-500" />
                <span className="hidden sm:inline">UID:</span>
                <span className="max-w-[130px] truncate" title={userProfile.uid}>User:{userProfile.uid}</span>
                {copiedUid ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="text-slate-400" />}
              </button>

              <button
                onClick={() => {
                  setActiveTab('talk');
                  setShowNewTopicModal(true);
                }}
                className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <MessageSquare size={13} />
                <span>Mensagem na Discussão</span>
              </button>

              <button
                onClick={() => setShowBarnstarModal(true)}
                className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                title="Conceder Medalha Wiki / Barnstar"
              >
                <Award size={13} className="text-amber-500" />
                <span className="hidden sm:inline">Conceder Barnstar</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition border ${
                  activeTab === 'admin'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                }`}
                title="Opções Administrativas e Governança"
              >
                <Shield size={13} className={activeTab === 'admin' ? 'text-white' : 'text-purple-600 dark:text-purple-400'} />
                <span>Opções Administrativas</span>
              </button>

              {(isOwner || isAdminOrMod) && (
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsEditingBio(!isEditingBio);
                  }}
                  className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition border ${
                    isEditingBio
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Edit3 size={13} />
                  <span>{isEditingBio ? 'Cancelar Edição' : 'Editar Perfil'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navegação por Abas no Padrão MediaWiki / Fandom */}
      <div className="border-b border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
            }`}
          >
            <UserIcon size={14} />
            <span>Página do Usuário</span>
            <span className="text-[10px] font-mono text-slate-400">User</span>
          </button>

          <button
            onClick={() => setActiveTab('talk')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 relative ${
              activeTab === 'talk'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
            }`}
          >
            <MessageSquare size={14} />
            <span>Discussão</span>
            <span className="text-[10px] font-mono text-slate-400">User_talk</span>
            {talkMessages.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {talkMessages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('contributions')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'contributions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
            }`}
          >
            <History size={14} />
            <span>Contribuições</span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {contributions.length}
            </span>
          </button>

          {/* Aba de Opções Administrativas */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'admin'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/20'
                : 'border-transparent text-purple-700 dark:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30'
            }`}
          >
            <Shield size={14} className="text-purple-500" />
            <span>Opções Administrativas</span>
            <span className="bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[9px] px-1.5 py-0.2 rounded uppercase font-mono font-bold">
              {isAdminOrMod ? 'Admin' : 'Governança'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Feedback Alert */}
      {bioSaveSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded text-xs flex items-center gap-2">
          <CheckCircle2 size={15} />
          <span>Página de usuário atualizada com sucesso!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: PÁGINA DO USUÁRIO (USER PAGE) */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal: Conteúdo Wikitext do Perfil */}
          <div className="lg:col-span-2 space-y-6">
            {isEditingBio ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Edit3 size={13} className="text-blue-600" />
                    <span>Editor Wikitext da Página de Usuário</span>
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Suporta predefinições, formatação e tabelas
                  </div>
                </div>

                {/* Quick Wikitext Syntax Insertion Bar */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setBioText((prev) => prev + "'''Texto em Negrito''' ")}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-bold hover:bg-slate-100"
                    title="Negrito"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => setBioText((prev) => prev + "''Texto em Itálico'' ")}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded italic hover:bg-slate-100"
                    title="Itálico"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => setBioText((prev) => prev + "\n== Nova Seção ==\n")}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-mono hover:bg-slate-100"
                    title="Título de Seção"
                  >
                    == H2 ==
                  </button>
                  <button
                    type="button"
                    onClick={() => setBioText((prev) => prev + "\n{{Destaque|Mensagem de destaque do perfil}}\n")}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[11px] font-mono hover:bg-slate-100"
                  >
                    {"{{Destaque}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBioText((prev) => prev + "\n{{Userbox|🚇|Entusiasta de Transporte}}\n")}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[11px] font-mono hover:bg-slate-100"
                  >
                    {"{{Userbox}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBioText((prev) => prev + "\n* Item da lista de projetos\n* Outro item\n")}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[11px] font-mono hover:bg-slate-100"
                  >
                    * Lista
                  </button>
                </div>

                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  rows={14}
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 leading-relaxed"
                  placeholder="Insira a descrição da sua página de usuário em formato Wikitext..."
                />

                <div className="flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditingBio(false)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveBio}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <Check size={13} />
                      <span>Salvar Página de Usuário</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs">
                {/* Micro Toolbar */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                      Biografia & Conteúdo Oficial
                    </h2>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Última atualização: {new Date(userProfile.lastActive || userProfile.createdAt || '2026-08-28').toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* Rendered Wikitext Body */}
                <div
                  className="wiki-rendered-content font-wiki-body text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parsedBio.html }}
                />
              </div>
            )}

            {/* Seção de Rastreabilidade & Alterações em Tempo Real */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    <History size={15} className="text-blue-600 dark:text-blue-400" />
                    <span>Rastreio & Histórico de Alterações</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {contributions.length} {contributions.length === 1 ? 'registro' : 'registros'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const permalink = buildUidPermalink(`User:${userProfile.uid}`);
                      navigator.clipboard.writeText(permalink);
                      setCopiedUid(true);
                      setTimeout(() => setCopiedUid(false), 2000);
                    }}
                    className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title={`Copiar link permanente UID Google/Sistema (?uid=User:${userProfile.uid})`}
                  >
                    <Link2 size={12} />
                    <span>{copiedUid ? 'Copiado!' : 'Link Público UID'}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Qualquer alteração de rastreio, criação de verbete ou revisão feita por este usuário é inserida e disponibilizada publicamente nesta página. Qualquer pessoa com o link pode visualizar este histórico.
              </p>

              {contributions.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                  <FileText size={24} className="mx-auto mb-1.5 opacity-40 text-slate-400" />
                  <p>Nenhuma alteração registrada até o momento.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Assim que o usuário editar ou criar verbetes, as ações de rastreio aparecerão aqui automaticamente.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contributions.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-800 transition flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded font-mono mt-0.5 ${
                          item.type === 'create'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                        }`}>
                          {item.type === 'create' ? 'Novo' : 'Edição'}
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => onNavigateToArticle(item.articleId)}
                            className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 text-left transition cursor-pointer"
                          >
                            {item.articleTitle}
                          </button>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {item.summary}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 font-mono text-[11px]">
                        <div className="text-slate-400">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </div>
                        {item.deltaBytes !== undefined && (
                          <span
                            className={`text-[10px] font-bold ${
                              item.deltaBytes > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : item.deltaBytes < 0
                                ? 'text-red-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.deltaBytes > 0 ? `+${item.deltaBytes}` : item.deltaBytes} bytes
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {contributions.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('contributions')}
                      className="w-full py-2 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900/40 transition flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                    >
                      <History size={13} />
                      <span>Ver todas as {contributions.length} alterações na aba de histórico</span>
                      <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Lateral: Userboxes & Condecorações (Barnstars) */}
          <div className="space-y-6">
            {/* 1. Galeria de Condecorações (Barnstars) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5 mb-3">
                <div className="flex items-center gap-1.5">
                  <Award size={15} className="text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Medalhas & Barnstars
                  </h3>
                </div>
                {canGrantBarnstars ? (
                  <button
                    onClick={() => setShowBarnstarModal(true)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus size={11} /> Conceder
                  </button>
                ) : (
                  <span
                    className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1"
                    title="Somente administradores e moderadores podem conceder medalhas."
                  >
                    <Shield size={11} className="text-slate-400" /> Admins & Mods
                  </span>
                )}
              </div>

              {!userProfile.barnstars || userProfile.barnstars.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  <Award size={28} className="mx-auto mb-2 opacity-30 text-amber-500" />
                  <p>Este usuário ainda não recebeu condecorações.</p>
                  {canGrantBarnstars ? (
                    <button
                      onClick={() => setShowBarnstarModal(true)}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Conceder uma medalha oficial
                    </button>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">
                      (As condecorações são atribuídas exclusivamente por administradores e moderadores.)
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {userProfile.barnstars.map((bs) => (
                    <div
                      key={bs.id}
                      className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="text-xl flex-shrink-0 p-1 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800 shadow-xs">
                          {bs.icon || '⭐'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                            {bs.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                            "{bs.description}"
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>De: <strong>{bs.awardedBy}</strong></span>
                            <span>{new Date(bs.awardedAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Caixas de Usuário (Userboxes) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2.5 mb-3">
                <Layers size={15} className="text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  Caixas de Usuário (Userboxes)
                </h3>
              </div>

              {!userProfile.userboxes || userProfile.userboxes.length === 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center border border-blue-200 dark:border-blue-800 rounded bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden text-xs">
                    <div className="w-9 h-9 bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                      WZ
                    </div>
                    <div className="px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300">
                      Este usuário contribui para o projeto <strong>WikiWorldWeb</strong>.
                    </div>
                  </div>
                  <div className="flex items-center border border-emerald-200 dark:border-emerald-800 rounded bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden text-xs">
                    <div className="w-9 h-9 bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                      🇧🇷
                    </div>
                    <div className="px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300">
                      Este usuário é falante nativo de <strong>Português</strong>.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {userProfile.userboxes.map((ub) => (
                    <div
                      key={ub.id}
                      className={`flex items-center border rounded overflow-hidden text-xs ${ub.bgClass || 'bg-slate-50 dark:bg-slate-800'} ${ub.borderClass || 'border-slate-200 dark:border-slate-700'}`}
                    >
                      <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-base">
                        {ub.icon || '📌'}
                      </div>
                      <div className="px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300">
                        {ub.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Metadados do Sistema & Permissões */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg p-4 text-xs font-mono">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-2">
                Informações da Conta
              </h4>
              <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Identificador UID:</span>
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{userProfile.uid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nível de Acesso:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold uppercase">{userProfile.role}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advertências:</span>
                  <span className={userProfile.warningCount ? 'text-amber-500 font-bold' : 'text-slate-400'}>
                    {userProfile.warningCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Edição Livre:</span>
                  <span className={perms.canEdit ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                    {perms.canEdit ? 'Ativa' : 'Revogada'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: DISCUSSÃO DA PÁGINA DO USUÁRIO (USER TALK PAGE) */}
      {/* ========================================================================= */}
      {activeTab === 'talk' && (
        <div className="space-y-6">
          {/* Header da Discussão */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                <h2 className="text-base sm:text-lg font-serif-heading font-bold text-slate-900 dark:text-white">
                  Discussão de Usuário: {userProfile.displayName || userProfile.username}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Espaço público para envio de mensagens, avisos editoriais, dúvidas, felicitações e notificações da comunidade.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewTopicModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus size={13} />
                <span>Novo Tópico na Discussão</span>
              </button>
            </div>
          </div>

          {/* Filtros da Discussão */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mr-1">
              Filtrar tópicos:
            </span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'aberto', label: 'Em Aberto' },
              { id: 'aviso', label: '⚠️ Avisos Oficiais' },
              { id: 'barnstar', label: '⭐ Condecorações' },
              { id: 'duvida', label: '❓ Dúvidas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTalkFilter(tab.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  talkFilter === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Lista de Tópicos de Discussão */}
          {filteredTalkMessages.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-10 text-center text-slate-400">
              <MessageSquare size={36} className="mx-auto mb-3 opacity-30 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nenhuma mensagem nesta página de discussão
              </h3>
              <p className="text-xs max-w-md mx-auto mb-4">
                Use este espaço para iniciar uma conversa, deixar um recado ou cumprimentar o usuário.
              </p>
              <button
                onClick={() => setShowNewTopicModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={13} />
                <span>Adicionar Primeiro Tópico</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTalkMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`bg-white dark:bg-slate-900 border rounded-lg overflow-hidden shadow-xs ${
                    msg.tipo === 'aviso_admin'
                      ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/10'
                      : msg.tipo === 'barnstar'
                      ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Top Header do Tópico */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {msg.tipo === 'aviso_admin' && (
                        <span className="p-1 rounded bg-red-100 dark:bg-red-950/60 text-red-600 border border-red-200 dark:border-red-800">
                          <AlertTriangle size={13} />
                        </span>
                      )}
                      {msg.tipo === 'barnstar' && (
                        <span className="p-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800">
                          <Award size={13} />
                        </span>
                      )}
                      <h3 className="text-sm font-serif-heading font-bold text-slate-900 dark:text-white">
                        {msg.titulo}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${
                          msg.status === 'resolvido'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                            : msg.status === 'em_discussao'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300'
                        }`}
                      >
                        {msg.status}
                      </span>

                      {/* Botão de Marcar como Resolvido */}
                      {msg.status !== 'resolvido' && (
                        <button
                          onClick={() => handleUpdateTalkStatus(msg.id, 'resolvido')}
                          className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-[10px] rounded font-semibold text-slate-600 dark:text-slate-300"
                          title="Marcar como resolvido"
                        >
                          Concluir
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Corpo da Mensagem Original */}
                  <div className="p-4 sm:p-5">
                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {msg.conteudo}
                    </div>

                    {/* Assinatura do Autor */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span>Postado por:</span>
                        <button
                          onClick={() => onNavigateToUser(msg.senderName)}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {msg.senderName}
                        </button>
                        {msg.senderRole && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-600 dark:text-slate-400">
                            {msg.senderRole}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>{new Date(msg.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    {/* Respostas Encadeadas (Thread Replies) */}
                    {msg.respostas && msg.respostas.length > 0 && (
                      <div className="mt-4 pl-3 sm:pl-5 border-l-2 border-blue-200 dark:border-blue-900/60 space-y-3">
                        {msg.respostas.map((rep) => (
                          <div
                            key={rep.id}
                            className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700/60 text-xs"
                          >
                            <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                              {rep.conteudo}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => onNavigateToUser(rep.autor)}
                                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {rep.autor}
                                </button>
                                {rep.autorRole && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                                    {rep.autorRole}
                                  </span>
                                )}
                              </div>
                              <span>{new Date(rep.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulário de Resposta Rápida */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <input
                        type="text"
                        value={replyTexts[msg.id] || ''}
                        onChange={(e) => setReplyTexts({ ...replyTexts, [msg.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddReply(msg.id);
                        }}
                        placeholder="Escreva uma resposta para este tópico..."
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        onClick={() => handleAddReply(msg.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                      >
                        <Send size={11} />
                        <span>Responder</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: CONTRIBUIÇÕES DO USUÁRIO */}
      {/* ========================================================================= */}
      {activeTab === 'contributions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h2 className="text-base font-serif-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History size={16} className="text-blue-600" />
                <span>Histórico de Contribuições do Usuário</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                Registros de criação de verbetes e edições no acervo enciclopédico
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
              Total: {contributions.length} edições
            </span>
          </div>

          {contributions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <FileText size={32} className="mx-auto mb-2 opacity-30 text-slate-500" />
              <p>Nenhuma contribuição pública registrada com este nome de autor ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {contributions.map((item, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded transition">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1">
                      {item.type === 'create' ? (
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold uppercase rounded font-mono">
                          Novo
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase rounded font-mono">
                          Edição
                        </span>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => onNavigateToArticle(item.articleId)}
                        className="font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 text-left"
                      >
                        {item.articleTitle}
                      </button>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 font-mono text-[11px]">
                    <div className="text-slate-400">
                      {new Date(item.date).toLocaleDateString('pt-BR')}
                    </div>
                    {item.deltaBytes !== undefined && (
                      <span
                        className={`text-[10px] font-bold ${
                          item.deltaBytes > 0
                            ? 'text-emerald-600'
                            : item.deltaBytes < 0
                            ? 'text-red-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.deltaBytes > 0 ? `+${item.deltaBytes}` : item.deltaBytes} bytes
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: OPÇÕES ADMINISTRATIVAS (ADMIN CONTROLS & GOVERNANÇA) */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {isAdminOrMod ? (
            <>
              {/* Top Admin Warning Header */}
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg p-5 flex items-start gap-3">
                <Shield size={22} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-bold text-purple-900 dark:text-purple-200 font-mono uppercase tracking-wider">
                    Painel de Moderação e Governança Comunitária
                  </h2>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1 leading-relaxed">
                    Você possui permissões administrativas para gerenciar cargos, aplicar advertências, revogar privilégios ou suspender o acesso do usuário <strong>{userProfile.displayName || userProfile.username}</strong> em conformidade com as políticas da enciclopédia e LGPD.
                  </p>
                </div>
              </div>

              {/* Feedback Message */}
              {adminFeedback && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    adminFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                  }`}
                >
                  {adminFeedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{adminFeedback.msg}</span>
                </div>
              )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 0. Retificação Cadastral de Nome (LGPD / Marco Civil - Exclusivo Administrador) */}
            <div className="bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800/80 rounded-lg p-5 shadow-xs md:col-span-2">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200 font-mono flex items-center gap-2">
                  <UserCheck size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Retificação Cadastral de Nome (LGPD Art. 18 & Marco Civil)</span>
                </h3>
                <span className="text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-700">
                  Exclusivo para Administrador
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                Em estrita conformidade com a <strong>LGPD (Lei 13.709/2018, Art. 18, III — retificação de dados pessoais)</strong> e o <strong>Marco Civil da Internet (Lei 12.965/2014, Art. 15 — rastreabilidade e integridade de registros)</strong>, a alteração e retificação do nome de usuário só pode ser processada pelo <strong>Administrador do Sistema</strong>. Esta medida garante a cadeia de custódia, previne falsidade ideológica e preserva o histórico de autoria dos verbetes.
              </p>

              {isRealAdmin ? (
                <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome Atual do Titular:
                      </label>
                      <input
                        type="text"
                        disabled
                        value={userProfile.displayName || userProfile.username || userProfile.uid}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 font-mono font-bold cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Novo Nome de Exibição / Identificador:
                      </label>
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="Ex: Maria Silva ou RedatorTecnico_BR"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        De 3 a 50 caracteres alfanuméricos.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fundamento Legal / Motivação da Retificação:
                    </label>
                    <select
                      value={renameJustification}
                      onChange={(e) => setRenameJustification(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                    >
                      <option value="Solicitação do Titular de Dados (Art. 18, III LGPD)">
                        Solicitação do Titular de Dados (Art. 18, III LGPD - Retificação Cadastral)
                      </option>
                      <option value="Retificação de Prenome / Nome Social (Lei 14.382/2022)">
                        Retificação de Prenome / Nome Social (Lei 14.382/2022)
                      </option>
                      <option value="Correção de Erro Material ou Grafia Inexata">
                        Correção de Erro Material ou Grafia Inexata
                      </option>
                      <option value="Proteção de Identidade e Privacidade do Titular">
                        Proteção de Identidade e Privacidade do Titular
                      </option>
                      <option value="Decisão Administrativa ou Judicial">
                        Cumprimento de Decisão Administrativa ou Judicial
                      </option>
                      <option value="outros">Outra Motivação Específica (Descrever abaixo)</option>
                    </select>
                  </div>

                  {renameJustification === 'outros' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Descreva o motivo legal detalhado:
                      </label>
                      <input
                        type="text"
                        value={customJustification}
                        onChange={(e) => setCustomJustification(e.target.value)}
                        placeholder="Ex: Protocolo de atendimento DPO #84920 referente a retificação de documento."
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Será gerado um registro imutável no <strong>Log de Auditoria</strong> e uma notificação na página de Discussão do usuário.
                    </div>
                    <button
                      id="btn-admin-apply-rename"
                      onClick={handleAdminRenameUser}
                      disabled={isRenaming || !newDisplayName.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded text-xs font-bold shadow-xs transition flex items-center gap-1.5 active:scale-95"
                    >
                      {isRenaming ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processando Retificação...</span>
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} />
                          <span>Efetuar Retificação de Nome (LGPD)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    Seu nível de acesso atual é <strong>Moderador</strong>. Por exigência legal da LGPD e Marco Civil da Internet, a retificação de nomes cadastrais só pode ser homologada por um <strong>Administrador do Sistema</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* 0.1 Proteção e Remoção de Imagem de Usuário (LGPD Art. 18 & Art. 16 - Exclusivo Administrador) */}
            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800/80 rounded-lg p-5 shadow-xs md:col-span-2">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 font-mono flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Proteção e Remoção de Imagem de Usuário (LGPD Art. 18 & Art. 16)</span>
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                  Exclusivo para Administrador
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                Segundo a <strong>LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018)</strong>, para proteção de dados do usuário e resguardo de privacidade, a Administração pode remover a imagem do usuário. <strong>A alteração fará com que o avatar passe a exibir a primeira letra do nome do usuário</strong> (somente se o administrador fizer a remoção).
              </p>

              {isRealAdmin ? (
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-4 space-y-4">
                  {/* Status Atual e Prévia */}
                  <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {userProfile.photoURL && !userProfile.avatarRemovedByAdmin ? (
                          <img
                            src={userProfile.photoURL}
                            alt="Foto Atual"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-serif text-xl font-bold">
                            {(userProfile.displayName || userProfile.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        {userProfile.avatarRemovedByAdmin && (
                          <div
                            className="absolute -top-1 -right-1 p-0.5 bg-emerald-600 text-white rounded-full border border-white dark:border-slate-900 shadow-xs"
                            title="Imagem protegida pela Administração"
                          >
                            <ShieldCheck size={9} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {userProfile.photoURL && !userProfile.avatarRemovedByAdmin ? 'Foto personalizada cadastrada' : 'Avatar com inicial do nome ativo'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {userProfile.avatarRemovedByAdmin ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                              <ShieldCheck size={12} />
                              Protegido sob LGPD por {userProfile.avatarRemovedBy || 'Administrador'} em {userProfile.avatarRemovedAt ? new Date(userProfile.avatarRemovedAt).toLocaleDateString('pt-BR') : ''}
                            </span>
                          ) : (
                            'Nenhuma remoção administrativa de imagem aplicada no momento'
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Padrão LGPD com Inicial:</span>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs border-2 border-emerald-500">
                        {(userProfile.displayName || userProfile.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fundamento Legal / Motivação da Remoção LGPD:
                    </label>
                    <select
                      value={avatarJustification}
                      onChange={(e) => setAvatarJustification(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
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
                      <option value="outros">Outra Motivação Específica (Descrever abaixo)</option>
                    </select>
                  </div>

                  {avatarJustification === 'outros' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Descreva a justificativa jurídica ou técnica:
                      </label>
                      <input
                        type="text"
                        value={customAvatarJustification}
                        onChange={(e) => setCustomAvatarJustification(e.target.value)}
                        placeholder="Ex: Exclusão de foto pessoal conforme protocolo DPO #44810."
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      A remoção registrará um evento no <strong>Log de Auditoria</strong> e notificará o usuário em sua Discussão.
                    </div>
                    <button
                      id="btn-admin-apply-remove-avatar"
                      onClick={handleAdminRemoveAvatarLGPD}
                      disabled={isProcessingAvatar}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-bold shadow-xs transition flex items-center gap-1.5 active:scale-95"
                    >
                      {isProcessingAvatar ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processando Remoção...</span>
                        </>
                      ) : (
                        <>
                          <ImageOff size={14} />
                          <span>Remover Foto e Aplicar Inicial (LGPD)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    Seu nível de acesso atual é <strong>Moderador</strong>. Por exigência da LGPD, a remoção e alteração administrativa de imagens de perfil só pode ser realizada pelo <strong>Administrador do Sistema</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* 1. Alteração de Cargo e Nível de Acesso */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono mb-3 flex items-center gap-2">
                <Shield size={14} className="text-purple-600" />
                <span>Cargo Comunitário</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Selecione o novo papel institucional atribuído a esta conta:
              </p>

              <div className="space-y-2 mb-4">
                {(['admin', 'moderador', 'editor', 'leitor', 'convidado'] as UserRole[]).map((r) => (
                  <label
                    key={r}
                    className={`flex items-center justify-between p-2.5 rounded border cursor-pointer text-xs transition ${
                      selectedRole === r
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="userRole"
                        value={r}
                        checked={selectedRole === r}
                        onChange={() => setSelectedRole(r)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="capitalize">{roleConfig[r]?.label || r}</span>
                    </div>
                    {userProfile.role === r && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                        Atual
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <button
                onClick={handleChangeRole}
                disabled={selectedRole === userProfile.role}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Check size={13} />
                <span>Aplicar Novo Cargo</span>
              </button>
            </div>

            {/* 2. Gestão de Bloqueio & Suspensão */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono mb-3 flex items-center gap-2">
                <Lock size={14} className="text-red-600" />
                <span>Bloqueio & Suspensão</span>
              </h3>

              {userProfile.isBanned ? (
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded text-xs text-red-800 dark:text-red-300">
                    <p className="font-bold mb-1">Esta conta está atualmente BLOQUEADA.</p>
                    <p>Motivo: {userProfile.banReason}</p>
                    {userProfile.banExpiresAt && (
                      <p className="mt-1 text-[11px]">Expiração: {new Date(userProfile.banExpiresAt).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                  <button
                    onClick={handleUnbanUser}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Unlock size={13} />
                    <span>Desbloquear e Restaurar Acesso</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Ação Punitiva:
                    </label>
                    <select
                      value={banType}
                      onChange={(e) => setBanType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                    >
                      <option value="temporario">Suspensão Temporária</option>
                      <option value="permanente">Bloqueio Permanente (Ban)</option>
                      <option value="advertencia">Advertência Formal (Sem Bloqueio)</option>
                    </select>
                  </div>

                  {banType === 'temporario' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Duração do Bloqueio:
                      </label>
                      <select
                        value={banDurationDays}
                        onChange={(e) => setBanDurationDays(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                      >
                        <option value={1}>24 horas</option>
                        <option value={3}>3 dias</option>
                        <option value={7}>7 dias</option>
                        <option value={15}>15 dias</option>
                        <option value={30}>30 dias</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Motivo / Justificativa Pública:
                    </label>
                    <input
                      type="text"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Ex: Inclusão reiterada de spam comercial / vandalismo."
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <button
                    onClick={handleBanUser}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle size={13} />
                    <span>Aplicar Penalidade Administrativa</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Permissões Granulares */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono mb-3 flex items-center gap-2">
                <Settings size={14} className="text-blue-600" />
                <span>Permissões Granulares</span>
              </h3>
              <div className="space-y-2.5 mb-4 text-xs">
                <label className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-800 dark:text-slate-200">Permitir Edição de Artigos</span>
                  <input
                    type="checkbox"
                    checked={perms.canEdit}
                    onChange={(e) => setPerms({ ...perms, canEdit: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-800 dark:text-slate-200">Permitir Criação de Coleções</span>
                  <input
                    type="checkbox"
                    checked={perms.canCreate}
                    onChange={(e) => setPerms({ ...perms, canCreate: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-800 dark:text-slate-200">Permitir Postar em Discussões</span>
                  <input
                    type="checkbox"
                    checked={perms.canTalk}
                    onChange={(e) => setPerms({ ...perms, canTalk: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-800 dark:text-slate-200">Permitir Concessão de Barnstars</span>
                  <input
                    type="checkbox"
                    checked={perms.canGrantBarnstars}
                    onChange={(e) => setPerms({ ...perms, canGrantBarnstars: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              <button
                onClick={handleSavePermissions}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition"
              >
                Salvar Permissões
              </button>
            </div>

            {/* 4. Ações de Limpeza Rápida */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono mb-3 flex items-center gap-2">
                <RotateCcw size={14} className="text-amber-500" />
                <span>Ações Rápidas de Moderação</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Ferramentas para limpeza emergencial de perfis vandalizados:
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleResetBio}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold transition text-left px-3 flex items-center justify-between"
                >
                  <span>Resetar Biografia do Usuário (Spam)</span>
                  <RotateCcw size={13} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>
            </>
          ) : (
            /* Painel Público de Governança & Transparência da Conta */
            <div className="space-y-6">
              {/* Header de Governança */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-300 flex-shrink-0">
                    <Shield size={26} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-serif-heading font-bold text-slate-900 dark:text-white">
                        Governança Comunitária & Transparência
                      </h2>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        Público
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Esta aba consolida os registros de integridade, status comunitário e histórico de auditoria da conta de <strong>{userProfile.displayName || userProfile.username}</strong>. Ações diretas de alteração de cargo, bloqueio e retificação LGPD exigem credenciais de Administrador ou Moderador.
                    </p>
                  </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Cargo Institucional</div>
                    <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5 capitalize">
                      {roleConfig[userProfile.role]?.label || userProfile.role}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Status de Acesso</div>
                    <div className="text-sm font-bold mt-0.5">
                      {userProfile.isBanned ? (
                        <span className="text-red-600 dark:text-red-400">🚫 Bloqueado</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">✓ Regular</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Reputação & Medalhas</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                      <span>{userProfile.reputationScore || 100} pts</span>
                      <span className="text-amber-500 font-mono text-xs">({userProfile.barnstars?.length || 0} ⭐)</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Advertências</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {userProfile.warningCount || 0} registradas
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações Oficiais da Comunidade */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono mb-3 flex items-center gap-2">
                  <Users size={14} className="text-blue-600" />
                  <span>Canais de Contato & Recursos Administrativos</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {onNavigateToContactAdmin && (
                    <button
                      onClick={onNavigateToContactAdmin}
                      className="p-4 rounded-lg bg-blue-50/50 hover:bg-blue-100/70 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/70 text-left transition group"
                    >
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
                        <MessageSquare size={15} />
                        <span>Falar com a Administração</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Reportar vandalismo, solicitar suporte ou falar com os moderadores em Special:ContactAdmin.
                      </p>
                    </button>
                  )}

                  {onNavigateToPromotionRequests && (
                    <button
                      onClick={onNavigateToPromotionRequests}
                      className="p-4 rounded-lg bg-purple-50/50 hover:bg-purple-100/70 dark:bg-purple-950/30 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/70 text-left transition group"
                    >
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                        <Vote size={15} />
                        <span>Pedidos de Promoção (RFA)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Solicite elevação de cargo comunitário para Editor Verificado ou Moderador.
                      </p>
                    </button>
                  )}

                  {onNavigateToUnblockRequests && userProfile.isBanned && (
                    <button
                      onClick={onNavigateToUnblockRequests}
                      className="p-4 rounded-lg bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/70 text-left transition group"
                    >
                      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                        <Scale size={15} />
                        <span>Pedidos de Desbloqueio</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Acompanhe ou protocole pedidos formais de revisão de suspensões.
                      </p>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('talk')}
                    className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition group"
                  >
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                      <MessageSquare size={15} className="text-slate-500" />
                      <span>Discussão do Usuário</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      Deixe uma mensagem pública na página de discussão deste usuário.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Log de Auditoria do Usuário */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono mb-3 flex items-center gap-2">
              <FileText size={14} className="text-slate-600" />
              <span>Log de Auditoria e Histórico Administrativo</span>
            </h3>

            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-mono">
                Nenhum registro de ação administrativa para este usuário.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                    <div>
                      <span className="font-bold text-blue-600 dark:text-blue-400">[{log.action}]</span>{' '}
                      <span className="text-slate-800 dark:text-slate-200">{log.details}</span>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 flex-shrink-0">
                      <div>Por: {log.performedBy}</div>
                      <div>{new Date(log.date).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONCEDER CONDECORAÇÃO (BARNSTAR) - EXCLUSIVO ADMINS E MODS */}
      {/* ========================================================================= */}
      {showBarnstarModal && canGrantBarnstars && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-amber-500" />
                <h3 className="text-base font-serif-heading font-bold text-slate-900 dark:text-white">
                  Conceder Barnstar a {userProfile.displayName || userProfile.username}
                </h3>
              </div>
              <button
                onClick={() => setShowBarnstarModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {barnstarSuccess ? (
              <div className="py-8 text-center">
                <Award size={48} className="mx-auto mb-3 text-amber-500 animate-bounce" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Condecoração Concedida com Sucesso!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  A medalha foi adicionada à página do usuário e +50 pontos de reputação foram concedidos.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selecione a Medalha:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: '⭐', title: 'Estrela do Editor Incansável', desc: 'Por edições minuciosas e correção contínua de verbetes.' },
                      { icon: '🚇', title: 'Estrela de Ouro do Metropolitano', desc: 'Por contribuições notáveis sobre transporte e mobilidade.' },
                      { icon: '🛡️', title: 'Guardião da Verificabilidade', desc: 'Por defender a neutralidade e fontes confiáveis.' },
                      { icon: '🌟', title: 'Medalha do Pioneiro WikiWorldWeb', desc: 'Por colaborar desde os primórdios do projeto.' },
                    ].map((b, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setBarnstarIcon(b.icon);
                          setBarnstarTitle(b.icon + ' ' + b.title);
                          setBarnstarDescription(b.desc);
                        }}
                        className={`p-2 rounded border text-left text-xs transition ${
                          barnstarIcon === b.icon
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 font-bold text-amber-900 dark:text-amber-200'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-base mb-0.5">{b.icon}</div>
                        <div className="truncate font-semibold">{b.title}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Título da Condecoração:
                  </label>
                  <input
                    type="text"
                    value={barnstarTitle}
                    onChange={(e) => setBarnstarTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mensagem / Justificativa do Elogio:
                  </label>
                  <textarea
                    value={barnstarDescription}
                    onChange={(e) => setBarnstarDescription(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                    placeholder="Escreva uma mensagem de agradecimento pelo trabalho deste editor..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBarnstarModal(false)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAwardBarnstar}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Award size={13} />
                    <span>Formalizar e Conceder Medalha</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO TÓPICO NA DISCUSSÃO DO USUÁRIO */}
      {/* ========================================================================= */}
      {showNewTopicModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                <h3 className="text-base font-serif-heading font-bold text-slate-900 dark:text-white">
                  Novo Tópico na Discussão de {userProfile.displayName || userProfile.username}
                </h3>
              </div>
              <button
                onClick={() => setShowNewTopicModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTalkTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Mensagem:
                </label>
                <select
                  value={newTopicType}
                  onChange={(e) => setNewTopicType(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                >
                  <option value="geral">💬 Mensagem Geral / Colaboração</option>
                  <option value="duvida">❓ Dúvida sobre Edição / Referências</option>
                  <option value="boas_vindas">👋 Boas-Vindas à Comunidade</option>
                  {isAdminOrMod && <option value="aviso_admin">⚠️ Aviso Administrativo Formal</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Assunto:
                </label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="Ex: Proposta de melhoria no artigo sobre ferrovias..."
                  required
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Conteúdo da Mensagem:
                </label>
                <textarea
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  rows={6}
                  required
                  placeholder="Escreva seu recado com clareza. Você pode usar formatação Wikitext."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Send size={12} />
                  <span>Publicar no Espaço User_talk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
