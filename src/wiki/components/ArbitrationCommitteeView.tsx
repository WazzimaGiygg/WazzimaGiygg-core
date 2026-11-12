import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Gavel,
  FileText,
  User,
  Users,
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  BookOpen,
  Award,
  Globe2,
  Sparkles,
  Info,
  Check,
  X,
  MessageSquare,
  Lock,
  ArrowLeft,
  ChevronDown,
  UserX,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import {
  UserProfile,
  ArbitrationCase,
  ArbitrationCaseTargetType,
  ArbitrationCaseCategory,
  ArbitrationCaseStatus,
  ArbitrationRulingRemedy,
  ArbitrationCommitteeMember,
  ArbitrationDeliberation,
  ArbitrationComment,
  ArbitrationRuling,
} from '../types';
import { StorageService } from '../services/storageService';
import { ALL_LANGUAGES, Language, getLanguageByCode } from '../utils/languages';
import { useLanguage } from '../context/LanguageContext';

interface ArbitrationCommitteeViewProps {
  user: UserProfile | null;
  onNavigateToUser?: (username: string) => void;
  onNavigateToArticle?: (title: string) => void;
  onLoginClick?: () => void;
}

export const ArbitrationCommitteeView: React.FC<ArbitrationCommitteeViewProps> = ({
  user,
  onNavigateToUser,
  onNavigateToArticle,
  onLoginClick,
}) => {
  const { currentLanguage } = useLanguage();

  // State
  const [selectedLangCode, setSelectedLangCode] = useState<string>(() => currentLanguage.code || 'pt');
  const [activeTab, setActiveTab] = useState<'cases' | 'file' | 'members' | 'statutes'>('cases');
  const [cases, setCases] = useState<ArbitrationCase[]>([]);
  const [members, setMembers] = useState<ArbitrationCommitteeMember[]>([]);
  const [selectedCase, setSelectedCase] = useState<ArbitrationCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | ArbitrationCaseTargetType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ArbitrationCaseStatus>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Form State: File New Case
  const [formTargetType, setFormTargetType] = useState<ArbitrationCaseTargetType>('administrador');
  const [formTargetUsername, setFormTargetUsername] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ArbitrationCaseCategory>('abuso_admin');
  const [formUrgency, setFormUrgency] = useState<'baixa' | 'media' | 'alta'>('media');
  const [formSummary, setFormSummary] = useState('');
  const [formEvidence, setFormEvidence] = useState('');
  const [formRequestedRemedy, setFormRequestedRemedy] = useState('');
  const [formRelatedArticles, setFormRelatedArticles] = useState('');
  const [formAgreedPact, setFormAgreedPact] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State: Deliberation / Vote by Arbitrator
  const [delibVote, setDelibVote] = useState<'sancionar' | 'absolver' | 'acolher' | 'rejeitar' | 'abster'>('sancionar');
  const [delibRemedy, setDelibRemedy] = useState<ArbitrationRulingRemedy>('advertencia_formal');
  const [delibStatement, setDelibStatement] = useState('');
  const [isSubmittingDelib, setIsSubmittingDelib] = useState(false);

  // Form State: Testimony / Comment
  const [commentContent, setCommentContent] = useState('');
  const [isTestimony, setIsTestimony] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Form State: Defense Statement
  const [defenseStatementInput, setDefenseStatementInput] = useState('');
  const [isSubmittingDefense, setIsSubmittingDefense] = useState(false);

  // Form State: Final Ruling (Conclusion)
  const [rulingRemedy, setRulingRemedy] = useState<ArbitrationRulingRemedy>('advertencia_formal');
  const [rulingSummary, setRulingSummary] = useState('');
  const [rulingDays, setRulingDays] = useState<number>(30);
  const [rulingFindings, setRulingFindings] = useState('');
  const [isSubmittingRuling, setIsSubmittingRuling] = useState(false);
  const [showRulingModal, setShowRulingModal] = useState(false);

  // Form State: Add Member
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberDisplayName, setNewMemberDisplayName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Presidente do Conselho' | 'Árbitro Titular' | 'Árbitro Suplente'>('Árbitro Titular');
  const [newMemberBio, setNewMemberBio] = useState('');

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedCases = await StorageService.getArbitrationCases(
        selectedLangCode === 'all' ? undefined : selectedLangCode
      );
      const fetchedMembers = await StorageService.getArbitrationMembers(
        selectedLangCode === 'all' ? undefined : selectedLangCode
      );
      setCases(fetchedCases);
      setMembers(fetchedMembers);

      // If selectedCase is open, refresh it
      if (selectedCase) {
        const refreshed = fetchedCases.find((c) => c.id === selectedCase.id);
        if (refreshed) {
          setSelectedCase(refreshed);
        }
      }
    } catch (err) {
      console.error('Error loading arbitration data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const lang = selectedLangCode === 'all' ? undefined : selectedLangCode;

    const unsubMembers = StorageService.subscribeToArbitrationMembers((fetchedMembers) => {
      setMembers(fetchedMembers);
    }, lang);

    const unsubCases = StorageService.subscribeToArbitrationCases((fetchedCases) => {
      setCases(fetchedCases);
      // Se tiver caso selecionado aberto, atualiza seus dados em tempo real
      setSelectedCase((prev) => {
        if (!prev) return null;
        const refreshed = fetchedCases.find((c) => c.id === prev.id);
        return refreshed || null;
      });
      setIsLoading(false);
    }, lang);

    return () => {
      unsubMembers();
      unsubCases();
    };
  }, [selectedLangCode]);

  // Is user a recognized arbitrator / admin
  const isUserStaffOrArb = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'moderador') return true;
    const userUName = (user.username || user.displayName || user.uid || '').toLowerCase();
    return members.some((m) => m.username.toLowerCase() === userUName);
  }, [user, members]);

  // Filtered Cases
  const filteredCases = useMemo(() => {
    const safeCases = Array.isArray(cases) ? cases : [];
    return safeCases.filter((c) => {
      if (!c) return false;
      // Search
      const matchesSearch =
        searchQuery === '' ||
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.caseNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.targetUsername || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.requesterUsername || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.summary || '').toLowerCase().includes(searchQuery.toLowerCase());

      // Target Type Filter
      const matchesTarget = targetTypeFilter === 'all' || c.targetType === targetTypeFilter;

      // Status Filter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchesSearch && matchesTarget && matchesStatus;
    });
  }, [cases, searchQuery, targetTypeFilter, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const safeCases = Array.isArray(cases) ? cases : [];
    const total = safeCases.length;
    const concluded = safeCases.filter((c) => c?.status === 'concluido').length;
    const inDeliberation = safeCases.filter((c) => c?.status === 'deliberacao' || c?.status === 'em_instrucao').length;
    const againstAdmins = safeCases.filter((c) => c?.targetType === 'administrador').length;
    const againstMods = safeCases.filter((c) => c?.targetType === 'moderador').length;
    const againstUsers = safeCases.filter((c) => c?.targetType === 'usuario').length;

    return { total, concluded, inDeliberation, againstAdmins, againstMods, againstUsers };
  }, [cases]);

  // Handle Submit New Case
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!user) {
      setFormError('Você precisa estar autenticado para protocolar uma representação no Conselho de Arbitragem.');
      return;
    }

    if (!formTitle.trim()) {
      setFormError('Informe um título descritivo para o processo.');
      return;
    }

    if (!formTargetUsername.trim()) {
      setFormError('Informe o nome de usuário do representado (acusado).');
      return;
    }

    if (!formSummary.trim()) {
      setFormError('Forneça um resumo detalhado dos fatos e violações ocorridas.');
      return;
    }

    if (!formEvidence.trim()) {
      setFormError('Forneça o dossiê de provas, links de histórico ou trechos contestados.');
      return;
    }

    if (!formAgreedPact) {
      setFormError('Você deve declarar a veracidade dos fatos sob as regras de boa-fé e não importação.');
      return;
    }

    setIsSubmitting(true);
    try {
      const articles = formRelatedArticles
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await StorageService.createArbitrationCase({
        langCode: selectedLangCode === 'all' ? 'pt' : selectedLangCode,
        title: formTitle.trim(),
        targetType: formTargetType,
        targetUsername: formTargetUsername.trim(),
        requesterUsername: user.username || user.displayName || user.uid,
        requesterDisplayName: user.displayName || user.username || 'Requerente',
        requesterUid: user.uid,
        requesterRole: user.role,
        category: formCategory,
        summary: formSummary.trim(),
        evidenceWikitext: formEvidence.trim(),
        requestedRemedy: formRequestedRemedy.trim() || 'Medida disciplinar cabível a critério do Conselho.',
        urgency: formUrgency,
        relatedArticleTitles: articles,
      });

      if (res.success && res.createdCase) {
        setFormSuccess(res.message);
        // Reset form
        setFormTitle('');
        setFormTargetUsername('');
        setFormSummary('');
        setFormEvidence('');
        setFormRequestedRemedy('');
        setFormRelatedArticles('');
        setFormAgreedPact(false);
        await loadData();
        setSelectedCase(res.createdCase);
        setActiveTab('cases');
      } else {
        setFormError(res.message || 'Erro ao protocolar processo.');
      }
    } catch (err) {
      setFormError('Falha de conexão ao submeter o processo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Arbitrator Deliberation / Vote
  const handleDeliberate = async () => {
    if (!selectedCase || !user) return;
    if (!delibStatement.trim()) {
      alert('Por favor, informe a fundamentação por escrito do seu voto de árbitro.');
      return;
    }

    setIsSubmittingDelib(true);
    try {
      const res = await StorageService.addArbitrationDeliberation(selectedCase.id, {
        arbitratorName: user.displayName || user.username || 'Árbitro',
        arbitratorUid: user.uid,
        vote: delibVote,
        statement: delibStatement.trim(),
        recommendedRemedy: delibRemedy,
      });

      if (res.success && res.updatedCase) {
        setSelectedCase(res.updatedCase);
        setDelibStatement('');
        await loadData();
      }
    } catch (err) {
      alert('Erro ao registrar deliberação.');
    } finally {
      setIsSubmittingDelib(false);
    }
  };

  // Handle Add Testimony / Comment
  const handleAddComment = async () => {
    if (!selectedCase || !user) return;
    if (!commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await StorageService.addArbitrationComment(selectedCase.id, {
        author: user.displayName || user.username || 'Usuário',
        authorRole: user.role,
        authorUid: user.uid,
        content: commentContent.trim(),
        isTestimony,
      });

      if (res.success && res.updatedCase) {
        setSelectedCase(res.updatedCase);
        setCommentContent('');
        await loadData();
      }
    } catch (err) {
      alert('Erro ao registrar depoimento.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle Defense Statement
  const handleSubmitDefense = async () => {
    if (!selectedCase || !user) return;
    if (!defenseStatementInput.trim()) return;

    setIsSubmittingDefense(true);
    try {
      const res = await StorageService.submitArbitrationDefense(
        selectedCase.id,
        defenseStatementInput.trim()
      );
      if (res.success && res.updatedCase) {
        setSelectedCase(res.updatedCase);
        setDefenseStatementInput('');
        await loadData();
      }
    } catch (err) {
      alert('Erro ao juntar defesa.');
    } finally {
      setIsSubmittingDefense(false);
    }
  };

  // Handle Publish Final Ruling
  const handlePublishRuling = async () => {
    if (!selectedCase || !user) return;
    if (!rulingSummary.trim()) {
      alert('Informe o resumo formal do acórdão.');
      return;
    }

    const deliberations = Array.isArray(selectedCase.deliberations) ? selectedCase.deliberations : [];
    const inFavor = deliberations.filter((d) => d && (d.vote === 'sancionar' || d.vote === 'acolher')).length;
    const against = deliberations.filter((d) => d && (d.vote === 'absolver' || d.vote === 'rejeitar')).length;
    const abstain = deliberations.filter((d) => d && d.vote === 'abster').length;

    const findings = rulingFindings
      .split('\n')
      .map((f) => f.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);

    setIsSubmittingRuling(true);
    try {
      const ruling: ArbitrationRuling = {
        remedyType: rulingRemedy,
        rulingSummary: rulingSummary.trim(),
        sanctionDurationDays: rulingDays > 0 ? rulingDays : undefined,
        votesInFavor: inFavor,
        votesAgainst: against,
        votesAbstain: abstain,
        closedByArbitrator: user.displayName || user.username || 'Árbitro',
        closedAt: new Date().toISOString(),
        formalFindings: findings.length > 0 ? findings : ['Decisão fundamentada pelo colegiado de árbitros.'],
      };

      const res = await StorageService.concludeArbitrationCase(selectedCase.id, ruling);
      if (res.success && res.updatedCase) {
        setSelectedCase(res.updatedCase);
        setShowRulingModal(false);
        await loadData();
      }
    } catch (err) {
      alert('Erro ao publicar acórdão.');
    } finally {
      setIsSubmittingRuling(false);
    }
  };

  // Helper Labels & Styles
  const getTargetBadge = (target: ArbitrationCaseTargetType) => {
    switch (target) {
      case 'administrador':
        return {
          label: 'AÇÃO DE ADMINISTRADOR',
          bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          icon: <ShieldAlert size={13} className="text-rose-600 dark:text-rose-400" />,
        };
      case 'moderador':
        return {
          label: 'AÇÃO DE MODERADOR',
          bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800',
          icon: <Shield size={13} className="text-purple-600 dark:text-purple-400" />,
        };
      case 'usuario':
      default:
        return {
          label: 'AÇÃO DE USUÁRIO',
          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          icon: <User size={13} className="text-blue-600 dark:text-blue-400" />,
        };
    }
  };

  const getStatusBadge = (status: ArbitrationCaseStatus) => {
    switch (status) {
      case 'concluido':
        return {
          label: 'Julgado / Concluído',
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          icon: <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />,
        };
      case 'deliberacao':
        return {
          label: 'Em Deliberação do Conselho',
          bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          icon: <Gavel size={13} className="text-amber-600 dark:text-amber-400" />,
        };
      case 'em_instrucao':
        return {
          label: 'Instrução & Provas',
          bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
          icon: <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />,
        };
      case 'rejeitado':
        return {
          label: 'Inadmitido / Rejeitado',
          bg: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
          icon: <X size={13} />,
        };
      case 'aberto':
      default:
        return {
          label: 'Aberto / Aguardando Triagem',
          bg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-800',
          icon: <FileText size={13} className="text-sky-600 dark:text-sky-400" />,
        };
    }
  };

  const getRemedyLabel = (remedy?: ArbitrationRulingRemedy) => {
    switch (remedy) {
      case 'absolvicao':
        return 'Absolvição e Restituição Integral';
      case 'advertencia_formal':
        return 'Advertência Formal Registrada';
      case 'ajustamento_conduta':
        return 'Termo de Ajustamento de Conduta (TAC)';
      case 'bloqueio_temporario':
        return 'Suspensão Temporária de Edição';
      case 'bloqueio_indefinido':
        return 'Banimento / Bloqueio Indefinido';
      case 'perda_direitos_moderador':
        return 'Revogação de Ferramentas de Moderador';
      case 'perda_direitos_admin':
        return 'Revogação de Privilégios de Administrador (Sysop)';
      case 'desconsiderado':
        return 'Pedido Desconsiderado';
      default:
        return 'Medida a Definir';
    }
  };

  const currentLangObj = getLanguageByCode(selectedLangCode);

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in pb-12">
      {/* Top Banner / Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-600 text-white shadow-xs">
                <Scale size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-serif-heading text-slate-900 dark:text-white">
                    Conselho de Arbitragem (ArbCom)
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                    Instância Suprema
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tribunal comunitário independente para julgar condutas, abusos e controvérsias graves envolvendo <strong>usuários</strong>, <strong>moderadores</strong> e <strong>administradores</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Language Edition Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 px-1">
              <Globe2 size={14} className="text-purple-600 dark:text-purple-400" />
              <span>Jurisdição Idiomática:</span>
            </div>
            <select
              value={selectedLangCode}
              onChange={(e) => setSelectedLangCode(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">🌍 Todos os Idiomas (Global)</option>
              {ALL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName} ({l.code}) - {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Institutional Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Total de Processos</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{metrics.total}</div>
          </div>
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 rounded border border-emerald-200 dark:border-emerald-900/40">
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Julgados / Concluídos</div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono">{metrics.concluded}</div>
          </div>
          <div className="bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded border border-amber-200 dark:border-amber-900/40">
            <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Em Deliberação</div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-300 font-mono">{metrics.inDeliberation}</div>
          </div>
          <div className="bg-rose-50/60 dark:bg-rose-950/20 p-2.5 rounded border border-rose-200 dark:border-rose-900/40">
            <div className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">Ações de Admins</div>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-300 font-mono">{metrics.againstAdmins}</div>
          </div>
          <div className="bg-purple-50/60 dark:bg-purple-950/20 p-2.5 rounded border border-purple-200 dark:border-purple-900/40">
            <div className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">Ações de Mods</div>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-300 font-mono">{metrics.againstMods}</div>
          </div>
          <div className="bg-blue-50/60 dark:bg-blue-950/20 p-2.5 rounded border border-blue-200 dark:border-blue-900/40">
            <div className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">Ações de Usuários</div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300 font-mono">{metrics.againstUsers}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-0.5">
        <button
          onClick={() => {
            setActiveTab('cases');
            setSelectedCase(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'cases'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold bg-purple-50/50 dark:bg-purple-950/30 rounded-t'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Gavel size={15} />
          <span>Processos & Julgamentos ({filteredCases.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('file');
            setSelectedCase(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'file'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold bg-purple-50/50 dark:bg-purple-950/30 rounded-t'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <PlusCircle size={15} />
          <span>Peticionar ao Conselho</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('members');
            setSelectedCase(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'members'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold bg-purple-50/50 dark:bg-purple-950/30 rounded-t'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users size={15} />
          <span>Membros do Conselho ({members.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('statutes');
            setSelectedCase(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'statutes'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold bg-purple-50/50 dark:bg-purple-950/30 rounded-t'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen size={15} />
          <span>Regimento & Estatuto</span>
        </button>
      </div>

      {/* TAB 1: CASOS & JULGAMENTOS */}
      {activeTab === 'cases' && !selectedCase && (
        <div className="space-y-4 animate-in fade-in">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por número do caso, usuário representado, solicitante ou tema..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-xs"
              />
            </div>

            {/* Target Type Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-slate-500 font-medium whitespace-nowrap">Alvo:</span>
              <button
                onClick={() => setTargetTypeFilter('all')}
                className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  targetTypeFilter === 'all'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTargetTypeFilter('administrador')}
                className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  targetTypeFilter === 'administrador'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                🛡️ Administradores
              </button>
              <button
                onClick={() => setTargetTypeFilter('moderador')}
                className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  targetTypeFilter === 'moderador'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                ⚖️ Moderadores
              </button>
              <button
                onClick={() => setTargetTypeFilter('usuario')}
                className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  targetTypeFilter === 'usuario'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100'
                }`}
              >
                👤 Usuários
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="aberto">Abertos</option>
                <option value="em_instrucao">Instrução Probatória</option>
                <option value="deliberacao">Em Deliberação</option>
                <option value="concluido">Julgados & Concluídos</option>
                <option value="rejeitado">Inadmitidos</option>
              </select>
            </div>
          </div>

          {/* Cases List */}
          {filteredCases.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Scale size={24} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Nenhum processo encontrado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Não há representações de arbitragem cadastradas com os filtros atuais para a jurisdição selecionada ({selectedLangCode.toUpperCase()}).
              </p>
              <button
                onClick={() => setActiveTab('file')}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded shadow-xs transition"
              >
                Peticionar Primeiro Caso
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCases.map((c) => {
                const targetBadge = getTargetBadge(c.targetType);
                const statusBadge = getStatusBadge(c.status);
                const lang = getLanguageByCode(c.langCode);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 rounded-lg p-4 sm:p-5 transition shadow-2xs hover:shadow-xs cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          {c.caseNumber}
                        </span>

                        <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${targetBadge.bg}`}>
                          {targetBadge.icon}
                          <span>{targetBadge.label}</span>
                        </span>

                        <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${statusBadge.bg}`}>
                          {statusBadge.icon}
                          <span>{statusBadge.label}</span>
                        </span>

                        <span className="text-[11px] text-slate-500 font-mono">
                          {lang.flag} {lang.code.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        Protocolado em: {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition font-serif-heading">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {c.summary}
                      </p>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
                        <div>
                          Representado (Acusado):{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            User:{c.targetUsername}
                          </strong>
                        </div>
                        <div>
                          Requerente:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {c.requesterDisplayName || c.requesterUsername}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {(c.deliberations?.length || 0) > 0 && (
                          <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
                            ⚖️ {c.deliberations?.length} Voto(s) de Árbitro
                          </span>
                        )}
                        <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-0.5 text-xs group-hover:translate-x-0.5 transition-transform">
                          Ver Processo Completo <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAILED CASE INSPECTOR (When a case is selected) */}
      {activeTab === 'cases' && selectedCase && (
        <div className="space-y-5 animate-in fade-in">
          {/* Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedCase(null)}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <ArrowLeft size={14} /> Voltar para a lista de processos
            </button>

            {/* Status Change Selector (For Admins/Arbitrators) */}
            {isUserStaffOrArb && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Ação do Conselho:
                </span>
                <select
                  value={selectedCase.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value as ArbitrationCaseStatus;
                    const res = await StorageService.updateArbitrationCaseStatus(selectedCase.id, newStatus, user || undefined);
                    if (res.success && res.updatedCase) {
                      setSelectedCase(res.updatedCase);
                      await loadData();
                    }
                  }}
                  className="bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 rounded px-2.5 py-1 text-xs font-bold cursor-pointer"
                >
                  <option value="aberto">Triagem / Aberto</option>
                  <option value="em_instrucao">Instrução Probatória</option>
                  <option value="deliberacao">Em Deliberação</option>
                  <option value="concluido">Concluído / Julgado</option>
                  <option value="rejeitado">Inadmitido / Arquivado</option>
                </select>

                {selectedCase.status !== 'concluido' && (
                  <button
                    onClick={() => setShowRulingModal(true)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs transition"
                  >
                    <Gavel size={13} /> Lavrar Acórdão Final
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Case Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2.5 py-1 rounded border border-purple-300 dark:border-purple-800">
                  {selectedCase.caseNumber}
                </span>

                {(() => {
                  const tb = getTargetBadge(selectedCase.targetType);
                  return (
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded border ${tb.bg}`}>
                      {tb.icon}
                      <span>{tb.label}</span>
                    </span>
                  );
                })()}

                {(() => {
                  const sb = getStatusBadge(selectedCase.status);
                  return (
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded border ${sb.bg}`}>
                      {sb.icon}
                      <span>{sb.label}</span>
                    </span>
                  );
                })()}
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Autuado em: {new Date(selectedCase.createdAt).toLocaleString()}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-serif-heading">
                {selectedCase.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Categoria de Infração: <strong className="text-slate-700 dark:text-slate-200 uppercase">{selectedCase.category.replace('_', ' ')}</strong> | Urgência: <strong className="text-purple-600 dark:text-purple-400 uppercase">{selectedCase.urgency}</strong>
              </p>
            </div>

            {/* Parties Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Representado (Acusado / Alvo da Ação):</span>
                <div className="flex items-center gap-2">
                  <User size={15} className="text-rose-500" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    User:{selectedCase.targetUsername}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold uppercase">
                    {selectedCase.targetType}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Requerente (Autor da Representação):</span>
                <div className="flex items-center gap-2">
                  <UserCheck size={15} className="text-blue-500" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedCase.requesterDisplayName || selectedCase.requesterUsername}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold uppercase">
                    {selectedCase.requesterRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Facts Summary */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Resumo dos Fatos e Alegações
              </h4>
              <div className="p-3.5 bg-white dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                {selectedCase.summary}
              </div>
            </div>

            {/* Evidence Dossier */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Dossiê de Provas & Registros de Auditoria (Evidências)
              </h4>
              <div className="p-3.5 bg-slate-950 text-emerald-300 font-mono text-xs rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedCase.evidenceWikitext}
              </div>
            </div>

            {/* Requested Remedy */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Sanção ou Medida Pleiteada pelo Requerente
              </h4>
              <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900 text-xs text-purple-950 dark:text-purple-200 font-medium">
                {selectedCase.requestedRemedy}
              </div>
            </div>

            {/* Defense Statement Section */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>4. Manifestação da Defesa (Contraditório)</span>
                {!selectedCase.defenseStatement && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                    Aguardando juntada de defesa
                  </span>
                )}
              </h4>

              {selectedCase.defenseStatement ? (
                <div className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  {selectedCase.defenseStatement}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 italic">
                    O representado (User:{selectedCase.targetUsername}) ou seus defensores podem submeter suas razões de defesa abaixo para apreciação dos árbitros:
                  </p>
                  {user ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Inserir manifestação ou alegações de defesa formal..."
                        value={defenseStatementInput}
                        onChange={(e) => setDefenseStatementInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={handleSubmitDefense}
                        disabled={isSubmittingDefense || !defenseStatementInput.trim()}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold disabled:opacity-50 transition"
                      >
                        Juntar Defesa aos Autos
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                      Autentique-se para juntar manifestação de defesa.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* FINAL RULING CARD (If Concluded) */}
          {selectedCase.finalRuling && (
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200 dark:border-emerald-900">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-base font-serif-heading">
                  <Gavel size={20} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Acórdão & Sentença Final do Conselho de Arbitragem</span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                  {selectedCase.finalRuling.votesInFavor}x{selectedCase.finalRuling.votesAgainst} Votos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <span className="text-slate-500 block mb-0.5">Medida Aplicada:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                    {getRemedyLabel(selectedCase.finalRuling.remedyType)}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <span className="text-slate-500 block mb-0.5">Duração da Sanção / TAC:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedCase.finalRuling.sanctionDurationDays
                      ? `${selectedCase.finalRuling.sanctionDurationDays} dias`
                      : 'Determinação Permanente / Sem prazo'}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <span className="text-slate-500 block mb-0.5">Relator / Presidente:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedCase.finalRuling.closedByArbitrator}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">Fundamentação e Dispositivo:</span>
                <p className="p-3 bg-white/90 dark:bg-slate-900/90 rounded border border-emerald-200 dark:border-emerald-900 leading-relaxed text-slate-800 dark:text-slate-200">
                  {selectedCase.finalRuling.rulingSummary}
                </p>
              </div>

              {selectedCase.finalRuling.formalFindings.length > 0 && (
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300">Conclusões de Fato e Direito Vinculantes:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                    {selectedCase.finalRuling.formalFindings.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* DELIBERATIONS & VOTES SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white font-serif-heading text-sm sm:text-base">
                <Scale size={18} className="text-purple-600" />
                <span>Votos e Pareceres dos Árbitros ({selectedCase.deliberations?.length || 0})</span>
              </div>
              <span className="text-xs text-slate-500">
                Quórum regimental mínimo: 2 árbitros
              </span>
            </div>

            {(selectedCase.deliberations?.length || 0) === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Nenhum voto de árbitro foi juntado até o presente momento. O caso está na fase de instrução ou aguardando deliberação da mesa.
              </p>
            ) : (
              <div className="space-y-3">
                {(selectedCase.deliberations || []).map((d) => {
                  let voteColor = 'bg-slate-100 text-slate-700';
                  if (d.vote === 'sancionar' || d.vote === 'acolher') voteColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
                  if (d.vote === 'absolver') voteColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
                  if (d.vote === 'abster') voteColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';

                  return (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            Árbitro: {d.arbitratorName}
                          </span>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${voteColor}`}>
                            Voto: {d.vote}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(d.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-2 border-l-2 border-purple-400">
                        {d.statement}
                      </p>

                      {d.recommendedRemedy && (
                        <div className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                          Medida Sugerida: <strong>{getRemedyLabel(d.recommendedRemedy)}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Arbitrator Voting Box (If user is staff/arbitrator and case is open) */}
            {isUserStaffOrArb && selectedCase.status !== 'concluido' && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-purple-50/30 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-900">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                  <Gavel size={15} />
                  <span>Registrar Voto de Árbitro / Deliberação Oficial</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Sentido do Voto:</label>
                    <select
                      value={delibVote}
                      onChange={(e) => setDelibVote(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="sancionar">Sancionar / Aplicar Medida</option>
                      <option value="acolher">Acolher Representação</option>
                      <option value="absolver">Absolver / Indeferir Sanção</option>
                      <option value="rejeitar">Rejeitar Pedido</option>
                      <option value="abster">Abster-se por Suspeição</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Medida Recomendada:</label>
                    <select
                      value={delibRemedy}
                      onChange={(e) => setDelibRemedy(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="advertencia_formal">Advertência Formal Registrada</option>
                      <option value="ajustamento_conduta">Termo de Ajustamento de Conduta (TAC)</option>
                      <option value="bloqueio_temporario">Suspensão Temporária de Edição</option>
                      <option value="perda_direitos_moderador">Revogação de Permissões de Moderador</option>
                      <option value="perda_direitos_admin">Revogação de Permissões de Administrador</option>
                      <option value="absolvicao">Absolvição Total</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                    Fundamentação Jurídico-Enciclopédica do Voto:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detalhe a análise das provas, violação dos pilares da WikiWorldWeb ou atenuantes..."
                    value={delibStatement}
                    onChange={(e) => setDelibStatement(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  onClick={handleDeliberate}
                  disabled={isSubmittingDelib || !delibStatement.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                >
                  <Gavel size={14} /> Registrar Voto nos Autos
                </button>
              </div>
            )}
          </div>

          {/* COMMUNITY TESTIMONIES & DEPOSITIONS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white font-serif-heading text-sm sm:text-base">
                <MessageSquare size={18} className="text-blue-600" />
                <span>Depoimentos e Testemunhos Comunitários ({selectedCase.comments.length})</span>
              </div>
              <span className="text-xs text-slate-500">Espaço para depoimentos sob contraditório</span>
            </div>

            {selectedCase.comments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Nenhum depoimento de terceiro registrado neste processo.
              </p>
            ) : (
              <div className="space-y-2.5">
                {selectedCase.comments.map((cm) => (
                  <div
                    key={cm.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{cm.author}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase">
                          {cm.authorRole}
                        </span>
                        {cm.isTestimony && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                            (Depoimento Testemunhal)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(cm.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {cm.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Testimony Form */}
            {user ? (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prestar Depoimento ou Informação aos Autos:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escreva seu depoimento com base em fatos e links comprováveis..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={isSubmittingComment || !commentContent.trim()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:opacity-50 transition flex items-center gap-1"
                  >
                    <Send size={13} /> Juntar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                Faça login para prestar depoimentos formais neste processo de arbitragem.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PETICIONAR AO CONSELHO (OPEN NEW CASE) */}
      {activeTab === 'file' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-5 sm:p-7 shadow-xs space-y-6 animate-in fade-in">
          <div className="space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-lg font-serif-heading">
              <Scale size={22} className="text-purple-600" />
              <span>Protocolar Nova Representação no Conselho de Arbitragem</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O ArbCom julga condutas, quebra reiterada de normas e abusos de ferramentas por <strong>usuários</strong>, <strong>moderadores</strong> e <strong>administradores</strong> após o esgotamento dos meios ordinários de diálogo.
            </p>
          </div>

          {formError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {!user ? (
            <div className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <Lock size={32} className="mx-auto text-purple-600" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Autenticação Obrigatória
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Para evitar representações anônimas ou frívolas, é necessário estar logado em sua conta da WikiWorldWeb para peticionar ao Conselho de Arbitragem.
              </p>
              {onLoginClick && (
                <button
                  onClick={onLoginClick}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold shadow-xs transition"
                >
                  Entrar na Conta
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateCase} className="space-y-5 text-xs">
              {/* Step 1: Target Type Selection */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                  1. Qual a categoria do representado (pessoa acusada)? <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setFormTargetType('administrador')}
                    className={`p-3.5 rounded-lg border-2 cursor-pointer transition flex items-start gap-2.5 ${
                      formTargetType === 'administrador'
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-900 dark:text-rose-200">Administrador (Sysop)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Abuso de ferramentas de bloqueio, proteção unilateral, supressão de páginas ou atuação em causa própria.
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormTargetType('moderador')}
                    className={`p-3.5 rounded-lg border-2 cursor-pointer transition flex items-start gap-2.5 ${
                      formTargetType === 'moderador'
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Shield size={18} className="text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-purple-900 dark:text-purple-200">Moderador</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Reversões sumárias injustificadas, fechamento precoce de debates ou sanções desproporcionais.
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormTargetType('usuario')}
                    className={`p-3.5 rounded-lg border-2 cursor-pointer transition flex items-start gap-2.5 ${
                      formTargetType === 'usuario'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <User size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-blue-900 dark:text-blue-200">Usuário / Editor</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Guerra de edição crônica, vandalismo sutil, assédio a colaboradores ou uso de contas fantoche.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Basic Case Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Título / Ementa da Representação <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Apelação por Bloqueio Injustificado em Conflito Editorial no Artigo X"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome de Usuário Representado <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NomeDoUsuarioOuAdmin"
                    value={formTargetUsername}
                    onChange={(e) => setFormTargetUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Infração
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="abuso_admin">Abuso de Ferramentas Administrativas (Sysop)</option>
                    <option value="abuso_moderador">Abuso de Prerrogativas de Moderação</option>
                    <option value="guerra_edicao_cronica">Guerra de Edição Crônica / Recusa de Consenso</option>
                    <option value="assedio_conduta">Assédio, Ataques Pessoais ou Incivilidade</option>
                    <option value="revisao_bloqueio_indevido">Revisão de Bloqueio sem Justificativa</option>
                    <option value="quebra_de_sigilo_lgpd">Quebra de Sigilo / Violação LGPD</option>
                    <option value="conflito_comunitario">Conflito Comunitário Complexo</option>
                    <option value="outro">Outra Conduta Ilícita</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nível de Urgência
                  </label>
                  <select
                    value={formUrgency}
                    onChange={(e) => setFormUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="baixa">Baixa (Revisão ordinária)</option>
                    <option value="media">Média (Disputa ativa em curso)</option>
                    <option value="alta">Alta (Dano iminente ao acervo ou bloqueio arbitrário em vigor)</option>
                  </select>
                </div>
              </div>

              {/* Step 3: Factual Narrative */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resumo dos Fatos & Cronologia <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Relate com clareza os acontecimentos, tentativas prévias de mediação na página de discussão e onde houve o desvio das regras da WikiWorldWeb..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              {/* Step 4: Evidence Dossier */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dossiê de Provas (Evidências em Wikitexto, Difs, Títulos de Artigos) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="=== Provas Anexadas ===&#10;* [[Artigo A]]: Reversão injustificada sem sumário&#10;* [[Artigo B]]: Uso de ferramenta de proteção durante disputa ativa&#10;* Registros de auditoria que comprovam os fatos alegados"
                  value={formEvidence}
                  onChange={(e) => setFormEvidence(e.target.value)}
                  className="w-full p-3 bg-slate-900 text-emerald-300 font-mono text-xs border border-slate-700 rounded focus:outline-hidden focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              {/* Step 5: Requested Remedy */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sanção ou Solução Pleiteada
                </label>
                <input
                  type="text"
                  placeholder="Ex: Anulação do bloqueio, advertência formal ao administrador e imposição de restrição de 60 dias."
                  value={formRequestedRemedy}
                  onChange={(e) => setFormRequestedRemedy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Step 6: Related Articles */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Artigos Afetados (Separados por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Metrô de São Paulo, Companhia Paulista de Estradas de Ferro"
                  value={formRelatedArticles}
                  onChange={(e) => setFormRelatedArticles(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Compliance & Good-Faith Pact */}
              <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAgreedPact}
                    onChange={(e) => setFormAgreedPact(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300 leading-snug">
                    Declaro sob a responsabilidade das regras da WikiWorldWeb que esta representação é formulada de <strong>boa-fé</strong>, contendo fatos estritamente verídicos e auditáveis, em plena conformidade com a <strong>Política de Autonomia e Não Importação da Wikipédia/Wikimedia</strong>.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formAgreedPact}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Scale size={16} />
                <span>{isSubmitting ? 'Protocolando no Conselho...' : 'Protocolar Representação Formal'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: MEMBROS DO CONSELHO (ARBITRATORS ROSTER) */}
      {activeTab === 'members' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white font-serif-heading text-base">
                <Users size={20} className="text-purple-600" />
                <span>Corpo de Árbitros da Jurisdição {selectedLangCode.toUpperCase()}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Membros eleitos pela comunidade da respectiva edição idiomática para mandatos anuais com competência de julgamento.
              </p>
            </div>

            {isUserStaffOrArb && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                <PlusCircle size={14} /> Designar Árbitro
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => {
              const lang = getLanguageByCode(m.langCode);
              return (
                <div
                  key={m.id}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4.5 shadow-2xs hover:shadow-xs transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-sm font-serif-heading border border-purple-200 dark:border-purple-800">
                        {m.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {m.displayName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          User:{m.username}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs">
                      {lang.flag} <span className="font-mono text-[10px] uppercase">{lang.code}</span>
                    </span>
                  </div>

                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {m.role}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {m.bio || 'Árbitro compromissado com a imparcialidade e a jurisprudência enciclopédica.'}
                  </p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      Casos Julgados: <strong className="text-purple-600 dark:text-purple-400">{m.casesJudged}</strong>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Mandato Ativo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: REGIMENTO & ESTATUTO (CHARTER) */}
      {activeTab === 'statutes' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in leading-relaxed text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
          <div className="pb-4 border-b border-slate-200 dark:border-slate-800 space-y-1">
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={22} className="text-purple-600" />
              <span>Regimento Interno e Estatuto Judicial do Conselho de Arbitragem</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Código normativo aprovado para assegurar a justiça, a ordem e o devido processo legal em todas as edições idiomáticas da WikiWorldWeb.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scale size={16} /> Capítulo I — Da Natureza e Jurisdição
            </h3>
            <p className="text-xs sm:text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <strong>Art. 1º.</strong> O Conselho de Arbitragem (ArbCom) é o órgão supremo e colegiado de última instância jurisdicional da WikiWorldWeb, dotado de plena autonomia para julgar atos praticados por <strong>usuários</strong>, <strong>moderadores</strong> e <strong>administradores</strong> em cada idioma suportado pela plataforma.
            </p>
            <p className="text-xs sm:text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <strong>Art. 2º.</strong> O Conselho não atua como redator de conteúdo enciclopédico ordinário, mas tão somente como garantidor do cumprimento das regras editoriais, do princípio do contraditório e do combate a abusos funcionais.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={16} /> Capítulo II — Do Julgamento de Administradores e Moderadores
            </h3>
            <p className="text-xs sm:text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <strong>Art. 3º.</strong> Administradores e moderadores estão estritamente sujeitos à fiscalização do Conselho de Arbitragem. É expressamente proibido a qualquer operador:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-xs pl-2 text-slate-700 dark:text-slate-300">
              <li>Utilizar ferramentas de bloqueio, proteção de páginas ou eliminação em disputas editoriais nas quais seja parte interessada ou autor ativo;</li>
              <li>Encerrar discussões sumariamente sem concessão do prazo regimental de defesa de 7 dias à comunidade;</li>
              <li>Tratar com descaso denúncias fundamentadas de assédio, quebra de sigilo ou violação da LGPD.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gavel size={16} /> Capítulo III — Das Sanções e Remédios Aplicáveis
            </h3>
            <p className="text-xs sm:text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <strong>Art. 4º.</strong> Concluída a instrução e a deliberação, o Conselho poderá lavrar Acórdão aplicando, de forma progressiva e proporcional:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <strong>I. Advertência Formal:</strong> Registro solene de infração nos anais do editor.
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <strong>II. Restrição Temática (Topic Ban):</strong> Proibição de editar determinado assunto por período de 30 a 180 dias.
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <strong>III. Revogação de Ferramentas:</strong> Suspensão ou perda definitiva dos direitos de Moderador ou Sysop.
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <strong>IV. Bloqueio Temporário ou Definitivo:</strong> Interdição de acesso nos termos do pacto comunitário.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LAVRAR ACÓRDÃO FINAL */}
      {showRulingModal && selectedCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base font-serif-heading">
                <Gavel size={18} className="text-emerald-600" />
                <span>Publicar Acórdão Final — {selectedCase.caseNumber}</span>
              </div>
              <button
                onClick={() => setShowRulingModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Medida Disciplinar Definitiva:
                </label>
                <select
                  value={rulingRemedy}
                  onChange={(e) => setRulingRemedy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <option value="absolvicao">Absolvição e Restituição Integral</option>
                  <option value="advertencia_formal">Advertência Formal Registrada</option>
                  <option value="ajustamento_conduta">Termo de Ajustamento de Conduta (TAC)</option>
                  <option value="bloqueio_temporario">Suspensão Temporária de Edição</option>
                  <option value="perda_direitos_moderador">Revogação de Permissões de Moderador</option>
                  <option value="perda_direitos_admin">Revogação de Permissões de Administrador</option>
                  <option value="bloqueio_indefinido">Banimento / Bloqueio Indefinido</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Duração em Dias (se aplicável):
                </label>
                <input
                  type="number"
                  min="0"
                  value={rulingDays}
                  onChange={(e) => setRulingDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resumo Executivo do Acórdão / Dispositivo:
                </label>
                <textarea
                  rows={3}
                  placeholder="O Conselho de Arbitragem, após apreciar as provas e os votos dos árbitros..."
                  value={rulingSummary}
                  onChange={(e) => setRulingSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Conclusões de Fato Vinculantes (uma por linha):
                </label>
                <textarea
                  rows={3}
                  placeholder="Administradores não devem agir em causa própria.&#10;O bloqueio do editor foi integralmente anulado."
                  value={rulingFindings}
                  onChange={(e) => setRulingFindings(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowRulingModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handlePublishRuling}
                disabled={isSubmittingRuling || !rulingSummary.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Gavel size={14} /> Publicar Acórdão e Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DESIGNAR NOVO ÁRBITRO */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base font-serif-heading">
                <Users size={18} className="text-purple-600" />
                <span>Designar Novo Árbitro ({selectedLangCode.toUpperCase()})</span>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome de Usuário (Username):
                </label>
                <input
                  type="text"
                  placeholder="Ex: NomeDoUsuario"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome de Exibição / Título:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dr. Fulano de Tal"
                  value={newMemberDisplayName}
                  onChange={(e) => setNewMemberDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Função no Conselho:
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <option value="Presidente do Conselho">Presidente do Conselho</option>
                  <option value="Árbitro Titular">Árbitro Titular</option>
                  <option value="Árbitro Suplente">Árbitro Suplente</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Biografia / Perfil de Atuação:
                </label>
                <textarea
                  rows={3}
                  placeholder="Editor experiente em mediação, conformidade jurídica..."
                  value={newMemberBio}
                  onChange={(e) => setNewMemberBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!newMemberUsername.trim() || !newMemberDisplayName.trim()) return;
                  await StorageService.addArbitrationMember({
                    langCode: selectedLangCode === 'all' ? 'pt' : selectedLangCode,
                    username: newMemberUsername.trim(),
                    displayName: newMemberDisplayName.trim(),
                    role: newMemberRole,
                    mandateStart: new Date().toISOString(),
                    mandateEnd: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
                    status: 'ativo',
                    casesJudged: 0,
                    bio: newMemberBio.trim(),
                  });
                  setShowAddMemberModal(false);
                  setNewMemberUsername('');
                  setNewMemberDisplayName('');
                  setNewMemberBio('');
                  await loadData();
                }}
                disabled={!newMemberUsername.trim() || !newMemberDisplayName.trim()}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold shadow-xs transition disabled:opacity-50"
              >
                Salvar Árbitro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
