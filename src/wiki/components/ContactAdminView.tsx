import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Shield,
  AlertTriangle,
  Lock,
  HelpCircle,
  Bug,
  Scale,
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  FileText,
  Trash2,
  Check,
  X,
  Mail,
  UserCheck,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Archive,
  BookOpen,
  AlertOctagon,
} from 'lucide-react';
import {
  AdminContactTicket,
  AdminTicketCategory,
  AdminTicketPriority,
  AdminTicketStatus,
  UserProfile,
  WikiArticle,
} from '../types';
import { StorageService } from '../services/storageService';

interface ContactAdminViewProps {
  currentUser?: UserProfile | null;
  onNavigateToArticle?: (articleId: string) => void;
  onNavigateToUser?: (username: string) => void;
  onNavigateToEmergencyContact?: () => void;
  onBack?: () => void;
}

const CATEGORY_CONFIG: Record<
  AdminTicketCategory,
  { label: string; icon: React.ElementType; color: string; desc: string }
> = {
  vandalismo: {
    label: 'Denúncia de Vandalismo / Spam',
    icon: AlertTriangle,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    desc: 'Edições maliciosas em massa, branqueamento de páginas ou links não autorizados.',
  },
  protecao_pagina: {
    label: 'Pedido de Proteção de Página',
    icon: Lock,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    desc: 'Solicitar semiproteção ou proteção total de verbetes sob guerra de edições.',
  },
  conflito_editorial: {
    label: 'Mediação de Conflito Editorial',
    icon: Scale,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
    desc: 'Intervenção neutra em disputas de fontes ou neutralidade (NPOV) não resolvidas na discussão.',
  },
  duvida_politicas: {
    label: 'Dúvidas sobre Políticas e Licenças',
    icon: HelpCircle,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
    desc: 'Esclarecimentos sobre direitos autorais, Creative Commons, GNU GPL e regras da enciclopédia.',
  },
  erro_tecnico: {
    label: 'Relato de Erro Técnico / Bug',
    icon: Bug,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    desc: 'Falhas na renderização de Wikitext, busca, tabelas ou incompatibilidade com navegadores.',
  },
  lgpd_privacidade: {
    label: 'Privacidade & DPO (LGPD)',
    icon: Shield,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    desc: 'Solicitações de exclusão de dados pessoais, anonimização ou direitos do titular da LGPD.',
  },
  outros: {
    label: 'Outros Assuntos Administrativos',
    icon: MessageSquare,
    color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    desc: 'Questões institucionais, sugestões estruturais ou assuntos não listados acima.',
  },
};

const PRIORITY_CONFIG: Record<
  AdminTicketPriority,
  { label: string; color: string; badge: string }
> = {
  baixa: {
    label: 'Baixa',
    color: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  normal: {
    label: 'Normal',
    color: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  alta: {
    label: 'Alta',
    color: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold',
  },
  urgente: {
    label: 'Urgente',
    color: 'text-rose-600 dark:text-rose-400 animate-pulse',
    badge: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-bold animate-pulse',
  },
};

const STATUS_CONFIG: Record<
  AdminTicketStatus,
  { label: string; icon: React.ElementType; badge: string }
> = {
  aberto: {
    label: 'Aberto',
    icon: Clock,
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
  },
  em_analise: {
    label: 'Em Análise',
    icon: RefreshCw,
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  },
  respondido: {
    label: 'Respondido pela Admin',
    icon: MessageSquare,
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700 font-bold',
  },
  resolvido: {
    label: 'Resolvido / Concluído',
    icon: CheckCircle2,
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold',
  },
  arquivado: {
    label: 'Arquivado',
    icon: Archive,
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  },
};

export const ContactAdminView: React.FC<ContactAdminViewProps> = ({
  currentUser,
  onNavigateToArticle,
  onNavigateToUser,
  onNavigateToEmergencyContact,
  onBack,
}) => {
  const [tickets, setTickets] = useState<AdminContactTicket[]>([]);
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [myTicketsOnly, setMyTicketsOnly] = useState(false);

  // Form State
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState<AdminTicketCategory>('vandalismo');
  const [formPriority, setFormPriority] = useState<AdminTicketPriority>('normal');
  const [formDescription, setFormDescription] = useState('');
  const [formArticleTitle, setFormArticleTitle] = useState('');
  const [formEvidence, setFormEvidence] = useState('');
  const [formGuestName, setFormGuestName] = useState('');
  const [formGuestEmail, setFormGuestEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Message Reply State
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Admin Resolution State
  const [resolutionStatus, setResolutionStatus] = useState<AdminTicketStatus>('resolvido');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isStaff =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'moderador' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ticketList, articleList] = await Promise.all([
        StorageService.getAdminTickets(),
        StorageService.getArticles(),
      ]);
      setTickets(ticketList);
      setArticles(articleList);

      if (ticketList.length > 0 && !selectedTicketId) {
        setSelectedTicketId(ticketList[0].id);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // Carregar artigos para vínculo nos chamados
    StorageService.getArticles()
      .then((articleList) => setArticles(articleList))
      .catch((err) => console.warn('Erro ao carregar artigos:', err));

    const unsubscribe = StorageService.subscribeToAdminTickets((ticketList) => {
      setTickets(ticketList);
      setSelectedTicketId((prev) => {
        if (!prev && ticketList.length > 0) return ticketList[0].id;
        if (prev && !ticketList.some((t) => t.id === prev) && ticketList.length > 0) return ticketList[0].id;
        return prev;
      });
      setIsLoading(false);
    }, currentUser);

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const safeTickets = Array.isArray(tickets) ? tickets : [];

  const selectedTicket = useMemo(() => {
    return safeTickets.find((t) => t && t.id === selectedTicketId) || null;
  }, [safeTickets, selectedTicketId]);

  const filteredTickets = useMemo(() => {
    return safeTickets.filter((t) => {
      if (!t) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = (t.subject || '').toLowerCase().includes(q);
        const matchesAuthor = (t.userDisplayName || '').toLowerCase().includes(q) || (t.userUsername || '').toLowerCase().includes(q);
        const matchesArticle = (t.relatedArticleTitle || '').toLowerCase().includes(q);
        const matchesId = (t.id || '').toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        if (!matchesSubject && !matchesAuthor && !matchesArticle && !matchesId && !matchesDesc) {
          return false;
        }
      }

      // Status
      if (statusFilter === 'active') {
        if (t.status === 'resolvido' || t.status === 'arquivado') return false;
      } else if (statusFilter === 'resolved') {
        if (t.status !== 'resolvido' && t.status !== 'arquivado') return false;
      }

      // Category
      if (categoryFilter !== 'all') {
        if (t.category !== categoryFilter) return false;
      }

      // My tickets
      if (myTicketsOnly && currentUser) {
        if (t.userUid !== currentUser.uid && t.userUsername !== currentUser.username) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter, myTicketsOnly, currentUser]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) {
      setFeedback({ type: 'error', message: 'Preencha o assunto e a descrição do chamado.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const evidenceLinks = formEvidence
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const relatedArticle = articles.find(
      (a) => a.titulo.toLowerCase() === formArticleTitle.trim().toLowerCase()
    );

    const res = await StorageService.createAdminTicket(
      {
        subject: formSubject,
        category: formCategory,
        priority: formPriority,
        description: formDescription,
        relatedArticleTitle: formArticleTitle.trim() || undefined,
        relatedArticleId: relatedArticle ? relatedArticle.id : undefined,
        evidenceLinks,
        guestName: formGuestName,
        guestEmail: formGuestEmail,
      },
      currentUser
    );

    setIsSubmitting(false);

    if (res.success && res.ticket) {
      setFeedback({ type: 'success', message: res.message });
      setTickets((prev) => [res.ticket!, ...prev]);
      setSelectedTicketId(res.ticket.id);
      setIsCreatingTicket(false);
      // Reset form
      setFormSubject('');
      setFormDescription('');
      setFormArticleTitle('');
      setFormEvidence('');
      setFormGuestName('');
      setFormGuestEmail('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    const senderProfile: UserProfile = currentUser || {
      uid: `guest-reply-${Date.now().toString(36)}`,
      username: 'Visitante',
      displayName: 'Visitante da WikiWorldWeb',
      email: 'visitante@wikizero.org',
      role: 'convidado',
      isGuest: true,
      isBanned: false,
      reputationScore: 0,
      warningCount: 0,
      createdAt: new Date().toISOString(),
      permissions: { canEdit: false, canCreate: false, canTalk: true, canDelete: false, canGrantBarnstars: false },
    };

    setIsSendingReply(true);
    setFeedback(null);

    const res = await StorageService.addAdminTicketMessage(
      selectedTicket.id,
      replyMessage,
      senderProfile
    );

    setIsSendingReply(false);

    if (res.success && res.updatedTicket) {
      setReplyMessage('');
      setTickets((prev) =>
        prev.map((t) => (t.id === res.updatedTicket!.id ? res.updatedTicket! : t))
      );
      setFeedback({ type: 'success', message: 'Mensagem enviada com sucesso!' });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !currentUser || !isStaff) return;

    setIsUpdatingStatus(true);
    setFeedback(null);

    const res = await StorageService.updateAdminTicketStatus(
      selectedTicket.id,
      resolutionStatus,
      resolutionNotes,
      currentUser
    );

    setIsUpdatingStatus(false);

    if (res.success && res.updatedTicket) {
      setTickets((prev) =>
        prev.map((t) => (t.id === res.updatedTicket!.id ? res.updatedTicket! : t))
      );
      setFeedback({ type: 'success', message: res.message });
      setResolutionNotes('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!currentUser || !isStaff) return;
    if (!window.confirm('Tem certeza de que deseja excluir permanentemente este chamado?')) return;

    const ok = await StorageService.deleteAdminTicket(ticketId, currentUser);
    if (ok) {
      const remaining = safeTickets.filter((t) => t && t.id !== ticketId);
      setTickets(remaining);
      setSelectedTicketId(remaining.length > 0 ? remaining[0].id : null);
      setFeedback({ type: 'success', message: 'Chamado excluído com sucesso.' });
    }
  };

  const activeCount = safeTickets.filter((t) => t && (t.status === 'aberto' || t.status === 'em_analise')).length;
  const resolvedCount = safeTickets.filter((t) => t && t.status === 'resolvido').length;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 transition-colors">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              title="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <span className="font-semibold text-slate-800 dark:text-slate-200">WikiWorldWeb</span>
          <ChevronRight size={14} />
          <span className="text-slate-600 dark:text-slate-400">Administração</span>
          <ChevronRight size={14} />
          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">Special:ContactAdmin</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm flex items-center gap-1.5 shadow-xs"
            title="Atualizar chamados"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={() => setIsCreatingTicket(!isCreatingTicket)}
            className={`px-3.5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition shadow-xs ${
              isCreatingTicket
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isCreatingTicket ? <X size={16} /> : <Plus size={16} />}
            <span>{isCreatingTicket ? 'Cancelar' : 'Abrir Novo Chamado'}</span>
          </button>
        </div>
      </div>

      {/* Alerta Prioritário: Contato de Emergência em Casos Extremos */}
      <div className="mb-6 p-4 rounded-xl border border-rose-300 dark:border-rose-900/80 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-600 text-white flex-shrink-0 mt-0.5">
            <AlertOctagon size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-red-600 text-white">
                Caso Extremo?
              </span>
              <h3 className="text-xs font-bold text-red-900 dark:text-red-200">
                Risco à vida, vazamento criminoso de dados (Doxxing), menores ou ordem judicial
              </h3>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">
              Este formulário regular é triado em até 24h. Em casos de risco iminente, utilize o <strong>Canal de Emergência de Plantão</strong> para atendimento prioritário imediato.
            </p>
          </div>
        </div>

        {onNavigateToEmergencyContact ? (
          <button
            onClick={onNavigateToEmergencyContact}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <AlertOctagon size={13} />
            <span>Acessar Linha de Emergência</span>
          </button>
        ) : (
          <a
            href="mailto:pedrohenriquecardonaperes@gmail.com?subject=%5BEMERG%C3%8ANCIA%20EXTREMA%20WIKIZERO%5D"
            className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <AlertOctagon size={13} />
            <span>Plantão de Emergência</span>
          </a>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-6 sm:p-8 mb-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <Shield size={220} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={12} />
              Canal Oficial da Moderação e Sysops
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Tempo Médio: &lt; 24h
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif mb-2.5 text-white">
            Fale com a Administração
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-4">
            Espaço centralizado para reportar <strong>vandalismo</strong>, solicitar <strong>proteção de páginas</strong>, 
            esclarecer <strong>dúvidas de licenciamento</strong>, reportar <strong>falhas técnicas</strong> ou exercer 
            seus direitos de privacidade conforme a <strong>LGPD</strong>.
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <UserCheck size={14} className="text-blue-300" />
              <span>DPO Oficial: <strong className="text-white">WazzimaGiygg</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail size={14} className="text-blue-300" />
              <span>E-mail: <strong className="text-white font-mono">pedrohenriquecardonaperes@gmail.com</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Scale size={14} className="text-emerald-300" />
              <span>Licença Base: <strong className="text-white">GNU GPL v3.0 & CC-BY-SA</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Total de Chamados
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {tickets.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock size={13} />
            Em Aberto / Análise
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {activeCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle2 size={13} />
            Resolvidos
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {resolvedCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Shield size={13} />
            Plantão Técnico
          </div>
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
            Sysops & DPO Ativos
          </div>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl mb-6 flex items-start gap-3 border shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">{feedback.message}</div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Form Section: Open New Ticket */}
      {isCreatingTicket && (
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/30 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Plus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Formulário de Abertura de Chamado para a Administração
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preencha os dados com o máximo de detalhes para agilizar o atendimento da equipe.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreatingTicket(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-5">
            {/* Category Select Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                1. Categoria da Solicitação *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {(Object.keys(CATEGORY_CONFIG) as AdminTicketCategory[]).map((catKey) => {
                  const conf = CATEGORY_CONFIG[catKey];
                  const Icon = conf.icon;
                  const isSelected = formCategory === catKey;
                  return (
                    <button
                      type="button"
                      key={catKey}
                      onClick={() => setFormCategory(catKey)}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${conf.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold ${isSelected ? 'text-blue-900 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'}`}>
                          {conf.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                          {conf.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject and Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Assunto Objetivo *
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Ex: Denúncia de Vandalismo Recorrente no Artigo Linha 1-Azul"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  3. Nível de Prioridade
                </label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as AdminTicketPriority)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="baixa">Baixa (Dúvida pontual)</option>
                  <option value="normal">Normal (Solicitação padrão)</option>
                  <option value="alta">Alta (Vandalismo / Proteção urgente)</option>
                  <option value="urgente">Urgente (Vazamento de dados / Ataque massivo)</option>
                </select>
              </div>
            </div>

            {/* Related Article (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Artigo ou Página Relacionada (Opcional)
              </label>
              <input
                type="text"
                value={formArticleTitle}
                onChange={(e) => setFormArticleTitle(e.target.value)}
                placeholder="Ex: Linha 1 do Metrô de São Paulo ou Special:RecentChanges"
                list="article-suggestions"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <datalist id="article-suggestions">
                {articles.map((art) => (
                  <option key={art.id} value={art.titulo} />
                ))}
              </datalist>
            </div>

            {/* Description / Statement */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                4. Detalhamento dos Fatos e Motivação *
              </label>
              <textarea
                rows={5}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreva detalhadamente o ocorrido, citando edições, usuários envolvidos, justificativas ou a política da WikiWorldWeb aplicável..."
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-y"
              />
            </div>

            {/* Evidence Links */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Links e Evidências (Um por linha - Opcional)
              </label>
              <textarea
                rows={2}
                value={formEvidence}
                onChange={(e) => setFormEvidence(e.target.value)}
                placeholder="https://wikizero.org/wiki/Artigo?diff=123&#10;https://creativecommons.org/licenses/by-sa/4.0/"
                className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* User Identification info if guest */}
            {(!currentUser || currentUser.isGuest) && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User size={14} />
                  Identificação do Solicitante (Você está navegando como visitante)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={formGuestName}
                      onChange={(e) => setFormGuestName(e.target.value)}
                      placeholder="Seu Nome ou Pseudônimo"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={formGuestEmail}
                      onChange={(e) => setFormGuestEmail(e.target.value)}
                      placeholder="Seu E-mail para contato (Opcional)"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingTicket(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-xs transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                <span>{isSubmitting ? 'Enviando Chamado...' : 'Enviar Chamado à Administração'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Split Layout: Ticket List & Ticket Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filter & Ticket List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <div className="relative mb-3">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por assunto, autor, verbete..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Todos ({tickets.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    statusFilter === 'active'
                      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Abertos ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('resolved')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    statusFilter === 'resolved'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Resolvidos ({resolvedCount})
                </button>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-[11px] py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="all">Todas as Categorias</option>
                {Object.keys(CATEGORY_CONFIG).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_CONFIG[c as AdminTicketCategory].label}
                  </option>
                ))}
              </select>

              {currentUser && !currentUser.isGuest && (
                <button
                  onClick={() => setMyTicketsOnly(!myTicketsOnly)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                    myTicketsOnly
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-400 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Meus Chamados
                </button>
              )}
            </div>
          </div>

          {/* Ticket List Items */}
          <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum chamado encontrado
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Altere os filtros de busca ou abra um novo chamado para a administração.
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicketId;
                const catConf = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.outros;
                const statConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.aberto;
                const prioConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.normal;
                const CatIcon = catConf.icon;
                const StatIcon = statConf.icon;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${statConf.badge}`}>
                          <StatIcon size={10} />
                          {statConf.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${prioConf.badge}`}>
                          {prioConf.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        #{ticket.id.slice(-5)}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1">
                      {ticket.subject}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                      {ticket.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <CatIcon size={12} className="text-blue-500" />
                        <span className="truncate max-w-[130px] font-medium">{catConf.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[100px]">{ticket.userDisplayName}</span>
                        <span className="flex items-center gap-0.5 font-bold font-mono">
                          <MessageSquare size={11} />
                          {ticket.messages.length}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Ticket Conversation & Resolution Panel (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
              {/* Ticket Header */}
              <div className="pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Protocolo: #{selectedTicket.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold border flex items-center gap-1 ${
                        STATUS_CONFIG[selectedTicket.status].badge
                      }`}
                    >
                      {React.createElement(STATUS_CONFIG[selectedTicket.status].icon, { size: 12 })}
                      {STATUS_CONFIG[selectedTicket.status].label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs border ${
                        PRIORITY_CONFIG[selectedTicket.priority].badge
                      }`}
                    >
                      Prioridade: {PRIORITY_CONFIG[selectedTicket.priority].label}
                    </span>
                  </div>

                  {isStaff && (
                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                      title="Excluir Chamado (Admin)"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  {selectedTicket.subject}
                </h2>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    <span>
                      Aberto por:{' '}
                      <button
                        onClick={() => onNavigateToUser && onNavigateToUser(selectedTicket.userUsername)}
                        className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 underline decoration-dotted"
                      >
                        {selectedTicket.userDisplayName}
                      </button>{' '}
                      <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {selectedTicket.userRole}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock size={13} className="text-slate-400" />
                    <span>{new Date(selectedTicket.createdAt).toLocaleString('pt-BR')}</span>
                  </div>

                  {selectedTicket.assignedAdmin && (
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                      <Shield size={13} />
                      <span>Atribuído a: {selectedTicket.assignedAdmin}</span>
                    </div>
                  )}
                </div>

                {/* Related Article Box */}
                {selectedTicket.relatedArticleTitle && (
                  <div className="mt-3 p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                      <BookOpen size={14} className="text-blue-600" />
                      <span>
                        Verbete Relacionado: <strong>{selectedTicket.relatedArticleTitle}</strong>
                      </span>
                    </div>
                    {selectedTicket.relatedArticleId && onNavigateToArticle && (
                      <button
                        onClick={() => onNavigateToArticle(selectedTicket.relatedArticleId!)}
                        className="text-blue-700 dark:text-blue-300 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Ver Artigo</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Resolution Summary Banner if resolved */}
              {selectedTicket.resolutionSummary && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">
                    <CheckCircle2 size={15} />
                    Parecer Oficial de Conclusão da Administração
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    {selectedTicket.resolutionSummary}
                  </p>
                  {selectedTicket.closedAt && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
                      Concluído em: {new Date(selectedTicket.closedAt).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              )}

              {/* Conversation Messages Thread */}
              <div className="space-y-4 mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  Histórico de Mensagens & Pareceres ({selectedTicket.messages.length})
                </div>

                <div className="space-y-3.5">
                  {selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`p-4 rounded-xl border text-sm transition ${
                        msg.isStaff
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80 ring-1 ring-blue-400/20'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {msg.senderName}
                          </span>
                          {msg.isStaff ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white flex items-center gap-1">
                              <Shield size={10} />
                              Staff / Administração
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {msg.senderRole}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(msg.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Links Box if present */}
              {selectedTicket.evidenceLinks && selectedTicket.evidenceLinks.length > 0 && (
                <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <ExternalLink size={13} />
                    Evidências e Links Citados:
                  </div>
                  <ul className="space-y-1">
                    {selectedTicket.evidenceLinks.map((link, lIdx) => (
                      <li key={lIdx}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reply Box */}
              <form onSubmit={handleSendMessage} className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Enviar Resposta / Informação Adicional
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Escreva sua mensagem para dar andamento ou responder a este chamado..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-y"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyMessage.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                  >
                    {isSendingReply ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Enviar Resposta</span>
                  </button>
                </div>
              </form>

              {/* Admin Bureaucratic Management Section (Staff Only) */}
              {isStaff && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-blue-300 dark:border-blue-800/80">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 mb-3">
                    <Shield size={14} />
                    Painel de Gestão Administrativa do Chamado
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Alterar Status
                      </label>
                      <select
                        value={resolutionStatus}
                        onChange={(e) => setResolutionStatus(e.target.value as AdminTicketStatus)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="aberto">Aberto</option>
                        <option value="em_analise">Em Análise</option>
                        <option value="respondido">Respondido</option>
                        <option value="resolvido">Resolvido / Concluído</option>
                        <option value="arquivado">Arquivado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Atribuir a Mim ({currentUser?.displayName || currentUser?.username})
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!currentUser) return;
                          await StorageService.assignAdminTicket(
                            selectedTicket.id,
                            currentUser.uid,
                            currentUser.displayName || currentUser.username || 'Admin',
                            currentUser
                          );
                          loadData();
                        }}
                        className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-center transition"
                      >
                        Assumir Chamado
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Parecer / Resumo da Resolução (Obrigatório ao Concluir)
                    </label>
                    <textarea
                      rows={2}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Ex: Medida tomada: semiproteção aplicada por 7 dias e IP bloqueado no firewall."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
                  >
                    {isUpdatingStatus ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                    <span>Salvar Alteração de Status & Parecer</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 shadow-xs">
              <Shield size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                Selecione um chamado ao lado para visualizar a conversa e os detalhes
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ou clique no botão superior para abrir um novo chamado.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Administration FAQ & Help Guidelines */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-blue-600" />
          Diretrizes de Atendimento e FAQ da Administração
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-500" />
              O que enviar para a Administração?
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Casos graves de vandalismo sistemático, solicitações de semiproteção para evitar guerras de edições, 
              violações de direitos autorais (DMCA) e solicitações diretas do titular da LGPD.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-blue-500" />
              O que resolver nas Discussões?
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Dúvidas sobre o conteúdo de verbetes, debates sobre fontes bibliográficas e sugestões de redação devem ser 
              tratados primariamente na <strong>Página de Discussão</strong> do próprio artigo antes da intervenção administrativa.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Shield size={14} className="text-emerald-500" />
              Proteção de Dados & Sigilo
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Todas as comunicações envolvendo dados sensíveis ou solicitações formais ao Encarregado (DPO) são processadas 
              com sigilo e retenção estritamente necessária segundo a legislação vigente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
