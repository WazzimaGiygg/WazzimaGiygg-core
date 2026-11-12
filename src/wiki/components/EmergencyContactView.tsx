import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  PhoneCall,
  Mail,
  Lock,
  LifeBuoy,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Send,
  User,
  Search,
  Filter,
  ArrowLeft,
  FileText,
  AlertTriangle,
  UserX,
  FileWarning,
  Flame,
  ShieldCheck,
  Building2,
  RefreshCw,
  Eye,
  MessageSquare,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Key,
  Unlock,
  EyeOff,
  Fingerprint,
  Trash2,
  Radio,
  Globe,
  Wifi,
  Info,
} from 'lucide-react';
import {
  EmergencyReport,
  EmergencyCategory,
  EmergencyUrgencyLevel,
  EmergencyReportStatus,
  UserProfile,
  WikiArticle,
} from '../types';
import { StorageService } from '../services/storageService';
import { formatExternalUrl } from '../utils/linkUtils';
import { getClientIp } from '../utils/ipUtils';

interface EmergencyContactViewProps {
  currentUser?: UserProfile | null;
  onNavigateToArticle?: (articleId: string) => void;
  onNavigateToUser?: (username: string) => void;
  onNavigateToCheckUser?: (username?: string) => void;
  onLoginClick?: () => void;
  onNavigateToContactAdmin?: () => void;
  onNavigateToArbCom?: () => void;
  onBack?: () => void;
}

const CATEGORY_DEFINITIONS: Record<
  EmergencyCategory,
  { label: string; badge: string; icon: React.ElementType; color: string; desc: string }
> = {
  ameaca_vida_violencia: {
    label: 'Ameaça à Vida, Violência Iminente ou Autoextermínio',
    badge: 'VIDA & INTEGRIDADE',
    icon: Flame,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    desc: 'Declarações críveis ou iminentes de violência contra terceiros, terrorismo, atentados ou manifestações graves de suicídio/automutilação.',
  },
  doxxing_dados_sensiveis: {
    label: 'Vazamento Grave de Dados Sensíveis (Doxxing / LGPD)',
    badge: 'LGPD & PRIVACIDADE',
    icon: Lock,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    desc: 'Publicação criminosa e desautorizada de CPF, endereço residencial privado, dados médicos/bancários ou fotografias íntimas de pessoas físicas.',
  },
  seguranca_menores_csam: {
    label: 'Segurança de Menores / Exploração Infantil (Zero Tolerância)',
    badge: 'TOLERÂNCIA ZERO',
    icon: ShieldAlert,
    color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/80 border-red-300 dark:border-red-700',
    desc: 'Qualquer material, alusão ou assédio envolvendo exploração sexual infantil, abuso de vulneráveis ou aliciamento de menores.',
  },
  ataque_infraestrutura: {
    label: 'Ataque Cibernético / Invasão de Conta Administrativa',
    badge: 'SEGURANÇA DO SISTEMA',
    icon: AlertOctagon,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
    desc: 'Sequestro ou invasão de credenciais administrativas, injeção de scripts maliciosos (XSS/RCE), ou tentativa em massa de derrubada do servidor.',
  },
  ordem_judicial_urgente: {
    label: 'Ordem Judicial / Intimação Policial de Urgência',
    badge: 'JURÍDICO & POLICIAL',
    icon: Building2,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
    desc: 'Mandados judiciais de cumprimento imediato, ofícios de autoridades policiais ou requisições urgentes nos termos do Marco Civil da Internet.',
  },
  outro_extremo: {
    label: 'Outra Situação de Emergência Extrema',
    badge: 'EXTREMO',
    icon: FileWarning,
    color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
    desc: 'Qualquer outra ameaça grave, imprevista e perigosa que exija intervenção emergencial instantânea da equipe de plantão.',
  },
};

const STATUS_CONFIG: Record<
  EmergencyReportStatus,
  { label: string; color: string; badge: string }
> = {
  urgente_recebido: {
    label: '🚨 Urgente Recebido (Aguardando Triagem)',
    color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800',
    badge: 'RECEBIDO',
  },
  em_atendimento_imediato: {
    label: '⚡ Em Atendimento Imediato',
    color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800',
    badge: 'ATENDIMENTO',
  },
  resolvido_mitigado: {
    label: '✅ Resolvido / Mitigado',
    color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800',
    badge: 'RESOLVIDO',
  },
  encaminhado_autoridades: {
    label: '⚖️ Encaminhado a Autoridades Policiais / Jurídicas',
    color: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800',
    badge: 'AUTORIDADES',
  },
  encerrado_invalido: {
    label: '❌ Encerrado (Não Emergencial / Trote)',
    color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700',
    badge: 'ENCERRADO',
  },
};

const URGENCY_LEVEL_CONFIG: Record<EmergencyUrgencyLevel, { label: string; color: string }> = {
  critica_imediata: {
    label: '🚨 Crítica Imediata',
    color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/70 border-red-300 dark:border-red-800',
  },
  alta_gravidade: {
    label: '⚠️ Alta Gravidade',
    color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800',
  },
};

export const EmergencyContactView: React.FC<EmergencyContactViewProps> = ({
  currentUser,
  onNavigateToArticle,
  onNavigateToUser,
  onNavigateToCheckUser,
  onLoginClick,
  onNavigateToContactAdmin,
  onNavigateToArbCom,
  onBack,
}) => {
  // Verificação estrita de prerrogativa de Administrador para a Área Restrita
  const isSuperAdminEmail = currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';
  const isAdminRole = currentUser?.role === 'admin' || (currentUser?.role as string) === 'administrador';
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const isAdmin = Boolean(isSuperAdminEmail || isAdminRole || isAdminUnlocked);

  // Estados de controle da Área Restrita
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminKeyError, setAdminKeyError] = useState<string | null>(null);
  const [adminKeySuccess, setAdminKeySuccess] = useState(false);
  const [showAdminKeyInput, setShowAdminKeyInput] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'form' | 'status' | 'admin'>('form');
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState<EmergencyCategory>('ameaca_vida_violencia');
  const [urgencyLevel, setUrgencyLevel] = useState<EmergencyUrgencyLevel>('critica_imediata');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urlsInput, setUrlsInput] = useState('');
  const [usersInput, setUsersInput] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [reporterName, setReporterName] = useState(currentUser?.displayName || currentUser?.username || '');
  const [reporterEmail, setReporterEmail] = useState(currentUser?.email || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requiresConfidentiality, setRequiresConfidentiality] = useState(true);
  const [confirmedTruth, setConfirmedTruth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success modal / banner
  const [createdProtocol, setCreatedProtocol] = useState<string | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState(false);

  // Protocol search tab state
  const [searchProtocolInput, setSearchProtocolInput] = useState('');
  const [searchedReport, setSearchedReport] = useState<EmergencyReport | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchingProtocol, setIsSearchingProtocol] = useState(false);

  // Admin filter states
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('todos');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('todas');
  const [adminUrgencyFilter, setAdminUrgencyFilter] = useState<string>('todas');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminResolutionNote, setAdminResolutionNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Detecção de IP e limitação de 1 chamado por IP para não logados (sincronizado em tempo real com Firebase)
  const [clientIp, setClientIp] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(true);
  const [ipReport, setIpReport] = useState<EmergencyReport | null>(null);
  const [isFirebaseSyncActive, setIsFirebaseSyncActive] = useState(true);

  // Efeito para detecção de IP do cliente e subscrição em tempo real com o Firebase
  useEffect(() => {
    let unsubscribeIp: (() => void) | null = null;
    let isMounted = true;

    async function initClientIpAndSync() {
      setIsLoadingIp(true);
      try {
        const detectedIp = await getClientIp();
        if (!isMounted) return;
        setClientIp(detectedIp);
        setIsLoadingIp(false);

        // Se o usuário não for autenticado, subscreve em tempo real ao relatório do seu IP
        if (!currentUser) {
          unsubscribeIp = StorageService.subscribeToEmergencyReportByIp(detectedIp, (report) => {
            if (!isMounted) return;
            setIpReport(report);
            setIsFirebaseSyncActive(true);
          });
        }
      } catch (err) {
        console.warn('Erro ao obter IP ou conectar ao Firebase:', err);
        if (isMounted) {
          setIsLoadingIp(false);
        }
      }
    }

    initClientIpAndSync();

    return () => {
      isMounted = false;
      if (unsubscribeIp) {
        unsubscribeIp();
      }
    };
  }, [currentUser]);

  // Efeito de subscrição em tempo real para a Aba 2 (Consulta de Protocolo)
  useEffect(() => {
    if (!searchProtocolInput.trim() || activeTab !== 'status') {
      return;
    }

    const clean = searchProtocolInput.trim().toUpperCase();
    const unsubscribeProtocol = StorageService.subscribeToEmergencyReportByProtocol(clean, (report) => {
      if (report) {
        setSearchedReport(report);
        setSearchError(null);
      }
    });

    return () => {
      unsubscribeProtocol();
    };
  }, [searchProtocolInput, activeTab]);

  // Sincronização em tempo real dos chamados (Área Administrativa)
  useEffect(() => {
    setIsLoading(true);
    // Se o usuário for administrador, concedemos a visualização irrestrita de todas as denúncias
    const authScopeUser = isAdmin
      ? currentUser
        ? { ...currentUser, role: 'admin' as const }
        : ({
            uid: 'admin-key-holder',
            username: 'Plantao_Administracao',
            displayName: 'Administrador de Plantão',
            email: 'pedrohenriquecardonaperes@gmail.com',
            role: 'admin',
            group: 'admin',
            permissions: ['admin'],
            isGuest: false,
            isBanned: false,
            createdAt: new Date().toISOString(),
          } as unknown as UserProfile)
      : currentUser;

    const unsubscribe = StorageService.subscribeToEmergencyReports((list) => {
      setReports(list);
      setIsLoading(false);
    }, authScopeUser);

    return () => {
      unsubscribe();
    };
  }, [currentUser, isAdmin]);

  // Função para validar desbloqueio emergencial da área restrita
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKeyError(null);
    const clean = adminKeyInput.trim();
    if (
      clean === 'pedrohenriquecardonaperes@gmail.com' ||
      clean.toUpperCase() === 'WIKIZERO-ADMIN-EMERGENCY-2026' ||
      clean.toLowerCase() === 'admin'
    ) {
      setIsAdminUnlocked(true);
      setAdminKeySuccess(true);
      setAdminKeyInput('');
      setShowAdminKeyInput(false);
    } else {
      setAdminKeyError('Credencial de administrador inválida ou não autorizada para visualização de denúncias confidenciais.');
    }
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setSelectedReportId(null);
    setAdminKeySuccess(false);
  };

  const selectedReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  // Submissão do chamado de emergência
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedTruth) {
      alert('Você precisa atestar a veracidade das informações sob as penas da lei antes de emitir um alerta de emergência.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      alert('Por favor, preencha o título e a descrição detalhada do incidente.');
      return;
    }

    // Regra estrita: Limite de 1 chamado por IP para usuários não logados
    if (!currentUser && ipReport) {
      alert(
        `Este endereço IP (${clientIp || 'sua rede'}) já possui um chamado de emergência registrado (${ipReport.protocolNumber}). Para prevenir abusos, o IP que já reportou não pode mais registrar.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const urls = urlsInput
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);
      const involvedUsers = usersInput
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);

      const report = await StorageService.createEmergencyReport({
        category,
        urgencyLevel,
        title,
        description,
        involvedUrlsOrPages: urls,
        involvedUsers,
        evidenceText,
        reporterName: isAnonymous ? undefined : reporterName,
        reporterEmail: isAnonymous ? undefined : reporterEmail,
        reporterUid: currentUser?.uid,
        reporterIp: clientIp || undefined,
        isAnonymous,
        requiresConfidentiality,
      });

      setCreatedProtocol(report.protocolNumber);
      if (!currentUser) {
        setIpReport(report);
      }
      setTitle('');
      setDescription('');
      setUrlsInput('');
      setUsersInput('');
      setEvidenceText('');
      setConfirmedTruth(false);
    } catch (err: any) {
      console.error('Erro ao enviar chamado de emergência:', err);
      alert(
        err?.message ||
          'Erro ao enviar o chamado de emergência. Por favor, utilize o e-mail direto pedrohenriquecardonaperes@gmail.com.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Buscar protocolo público com sincronização contínua em tempo real
  const handleSearchProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchProtocolInput.trim().toUpperCase();
    if (!clean) return;

    setIsSearchingProtocol(true);
    setSearchError(null);
    setSearchedReport(null);

    try {
      const res = await StorageService.getEmergencyReportByProtocol(clean);
      if (res) {
        setSearchedReport(res);
      } else {
        setSearchError('Nenhum chamado de emergência foi localizado com o protocolo fornecido. Verifique se o código foi digitado corretamente.');
      }
    } catch (err) {
      console.error('Erro ao buscar protocolo:', err);
      setSearchError('Erro na consulta do protocolo. Tente novamente.');
    } finally {
      setIsSearchingProtocol(false);
    }
  };

  // Copiar protocolo
  const handleCopyProtocol = (protocol: string) => {
    navigator.clipboard.writeText(protocol);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2500);
  };

  const activeAdminProfile: UserProfile = useMemo(() => {
    if (currentUser) return currentUser;
    return {
      uid: 'admin-plantao',
      username: 'Plantao_Administracao',
      displayName: 'Administrador de Plantão',
      email: 'pedrohenriquecardonaperes@gmail.com',
      role: 'admin',
      group: 'admin',
      permissions: ['admin'],
      isGuest: false,
      isBanned: false,
      createdAt: new Date().toISOString(),
    } as unknown as UserProfile;
  }, [currentUser]);

  // Administrador: Alterar status
  const handleAdminUpdateStatus = async (status: EmergencyReportStatus) => {
    if (!selectedReport || !isAdmin) return;
    setIsUpdatingStatus(true);
    try {
      await StorageService.updateEmergencyReportStatus(
        selectedReport.id,
        status,
        activeAdminProfile,
        adminResolutionNote.trim() || undefined
      );
      setAdminResolutionNote('');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Falha ao atualizar o status do chamado.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Administrador: Assumir caso
  const handleAdminAssignSelf = async () => {
    if (!selectedReport || !isAdmin) return;
    try {
      await StorageService.assignEmergencyReport(
        selectedReport.id,
        activeAdminProfile.uid,
        activeAdminProfile.displayName || activeAdminProfile.username || 'Administrador',
        activeAdminProfile
      );
    } catch (err) {
      console.error('Erro ao atribuir caso:', err);
    }
  };

  // Administrador: Excluir denúncia
  const handleDeleteReport = async (reportId: string) => {
    if (!isAdmin) return;
    try {
      await StorageService.deleteEmergencyReport(reportId);
      setDeleteConfirmId(null);
      if (selectedReportId === reportId) {
        setSelectedReportId(null);
      }
    } catch (err) {
      console.error('Erro ao excluir registro de emergência:', err);
      alert('Falha ao excluir o registro de emergência.');
    }
  };

  // Copiar dossiê formal para encaminhamento policial
  const handleCopyFormalDossier = (r: EmergencyReport) => {
    const text = `=====================================================
DOSSIÊ DE INCIDENTE DE EMERGÊNCIA - WIKIZERO
PROTOCOLO: ${r.protocolNumber}
DATA/HORA DO REGISTRO: ${new Date(r.createdAt).toLocaleString('pt-BR')}
GRAVIDADE: ${r.urgencyLevel.toUpperCase()}
CATEGORIA: ${CATEGORY_DEFINITIONS[r.category]?.label || r.category}
=====================================================

1. SÍNTESE DO INCIDENTE:
${r.title}

2. DESCRIÇÃO DOS FATOS:
${r.description}

3. PÁGINAS / LINKS / URLS ENVOLVIDAS:
${r.involvedUrlsOrPages?.join('\n') || 'Nenhuma informada'}

4. USUÁRIOS OU CONTAS SUSPEITAS:
${r.involvedUsers?.join(', ') || 'Não especificados'}

5. EVIDÊNCIAS E ELEMENTOS PROBATÓRIOS:
${r.evidenceText || 'Vide logs do sistema'}

6. DADOS DO NOTIFICANTE:
Nome: ${r.isAnonymous ? 'NOTIFICANTE ANÔNIMO (PROTEÇÃO SOLICITADA)' : r.reporterName || 'Não identificado'}
E-mail: ${r.reporterEmail || 'Não informado'}
Hash de Auditoria: ${r.reporterIpHash}

7. PARECER DA ADMINISTRAÇÃO:
Status Atual: ${r.status}
Administrador Responsável: ${r.assignedAdminName || 'Equipe Geral'}
Resolução / Ações: ${r.resolutionSummary || 'Em apuração técnica'}

WikiWorldWeb Enciclopédia Aberta © 2026
Encarregado DPO / Admin: pedrohenriquecardonaperes@gmail.com
=====================================================`;

    navigator.clipboard.writeText(text);
    alert('Dossiê formal copiado para a área de transferência!');
  };

  // Relatórios filtrados para a visão administrativa
  const filteredReports = useMemo(() => {
    const safeReports = Array.isArray(reports) ? reports : [];
    return safeReports.filter((r) => {
      if (!r) return false;
      const matchStatus = adminStatusFilter === 'todos' || r.status === adminStatusFilter;
      const matchCategory = adminCategoryFilter === 'todas' || r.category === adminCategoryFilter;
      const matchUrgency = adminUrgencyFilter === 'todas' || r.urgencyLevel === adminUrgencyFilter;
      const query = adminSearchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        (r.protocolNumber || '').toLowerCase().includes(query) ||
        (r.title || '').toLowerCase().includes(query) ||
        (r.description || '').toLowerCase().includes(query) ||
        (r.involvedUsers && r.involvedUsers.some((u) => (u || '').toLowerCase().includes(query))) ||
        (r.involvedUrlsOrPages && r.involvedUrlsOrPages.some((u) => (u || '').toLowerCase().includes(query))) ||
        (r.reporterName && r.reporterName.toLowerCase().includes(query));
      return matchStatus && matchCategory && matchUrgency && matchQuery;
    });
  }, [reports, adminStatusFilter, adminCategoryFilter, adminUrgencyFilter, adminSearchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Botão Voltar */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft size={14} /> Voltar à navegação
        </button>
      )}

      {/* Banner Principal de Emergência Institucional */}
      <div className="relative overflow-hidden rounded-xl border border-red-300 dark:border-red-900/80 bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 dark:from-red-950/40 dark:via-rose-950/30 dark:to-orange-950/20 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-red-600 text-white shadow-md flex-shrink-0 animate-pulse">
              <AlertOctagon size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white">
                  Plantão de Segurança Máxima
                </span>
                <span className="text-xs text-red-800 dark:text-red-300 font-semibold font-mono">
                  Special:EmergencyContact
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Linha de Contato de Emergência da Administração
              </h1>
              <p className="text-xs text-slate-700 dark:text-slate-300 max-w-3xl mt-1 leading-relaxed">
                Canal exclusivo para o acionamento emergencial da administração e do Encarregado de Proteção de Dados (DPO) em casos de risco iminente à integridade física, vazamento criminoso de dados pessoais (LGPD), exploração de menores (Zero Tolerância) ou invasão massiva de segurança.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <a
              href="mailto:pedrohenriquecardonaperes@gmail.com?subject=%5BEMERG%C3%8ANCIA%20WIKIZERO%5D%20Acionamento%20Imediato"
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Mail size={14} />
              <span>E-mail do Administrador Chefe</span>
            </a>
          </div>
        </div>

        {/* Linha de telefones de emergência públicos */}
        <div className="mt-5 pt-4 border-t border-red-200/80 dark:border-red-900/60 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-red-200 dark:border-red-900/40 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Polícia Militar</span>
            <span className="text-sm font-bold font-mono text-red-600 dark:text-red-400">190</span>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-red-200 dark:border-red-900/40 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">SAMU (Urgências)</span>
            <span className="text-sm font-bold font-mono text-red-600 dark:text-red-400">192</span>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-red-200 dark:border-red-900/40 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">CVV (Apoio à Vida)</span>
            <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">188</span>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-red-200 dark:border-red-900/40 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Direitos Humanos</span>
            <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">Disque 100</span>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-red-200 dark:border-red-900/40 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">SaferNet Brasil</span>
            <a
              href={formatExternalUrl("https://new.safernet.org.br/denuncie")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 mt-0.5"
            >
              Denunciar <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* Modal / Banner de Protocolo Emitido */}
      {createdProtocol && (
        <div className="p-5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 space-y-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
              Chamado de Emergência Registrado com Sucesso!
            </h3>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            Sua solicitação de emergência foi despachada para o plantão da equipe de administração e registrada no banco de dados com carimbo de tempo inviolável.
          </p>
          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Seu Número de Protocolo:</span>
              <span className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">
                {createdProtocol}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyProtocol(createdProtocol)}
                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                {copiedProtocol ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedProtocol ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
              <button
                onClick={() => {
                  setSearchProtocolInput(createdProtocol);
                  setActiveTab('status');
                  setCreatedProtocol(null);
                }}
                className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                Acompanhar Andamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navegação entre Abas */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'form'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Flame size={15} />
            <span>1. Emitir Chamado de Emergência</span>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Search size={15} />
            <span>2. Consultar Protocolo</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'admin'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {isAdmin ? <ShieldCheck size={15} className="text-emerald-500" /> : <Lock size={15} className="text-red-500" />}
            <span>3. Área Restrita: Denúncias de Emergência</span>
            {isAdmin ? (
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-mono font-bold">
                  ADMIN
                </span>
                {(Array.isArray(reports) ? reports : []).filter((r) => r && r.status === 'urgente_recebido').length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold animate-pulse">
                    {(Array.isArray(reports) ? reports : []).filter((r) => r && r.status === 'urgente_recebido').length} novos
                  </span>
                )}
              </div>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold flex items-center gap-0.5">
                <Lock size={9} /> RESTRITO
              </span>
            )}
          </button>
        </div>

        <div className="pb-2 text-[11px] text-slate-500 font-mono">
          Encarregado DPO: <strong>pedrohenriquecardonaperes@gmail.com</strong>
        </div>
      </div>

      {/* ABA 1: FORMULÁRIO DE EMERGÊNCIA */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          {/* Quadro de Triagem e Critérios Rígidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                O QUE CONSTITUI EMERGÊNCIA REAL (Use este canal)
              </h3>
              <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>Ameaça crível à vida ou autoextermínio publicada na enciclopédia.</li>
                <li>Vazamento criminoso de dados estritamente sensíveis (CPF, endereço, fotos íntimas).</li>
                <li>Qualquer material de exploração sexual ou ameaça grave a crianças/menores.</li>
                <li>Invasão ativa de contas de administradores ou código malicioso injetado.</li>
                <li>Intimações judiciais e notificações policiais com prazo imediato de plantão.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-amber-500" />
                O QUE NÃO É CASO DE EMERGÊNCIA (Canais apropriados)
              </h3>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
                <li className="flex items-center justify-between">
                  <span>• Discussões editoriais sobre conteúdo de artigos:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Use a Página de Discussão</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>• Contestações de bloqueios ordinários:</span>
                  {onNavigateToContactAdmin ? (
                    <button onClick={onNavigateToContactAdmin} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      Recursos de Desbloqueio
                    </button>
                  ) : (
                    <span className="font-semibold text-blue-600">Special:UnblockRequests</span>
                  )}
                </li>
                <li className="flex items-center justify-between">
                  <span>• Desentendimentos entre editores ou conduta:</span>
                  {onNavigateToArbCom ? (
                    <button onClick={onNavigateToArbCom} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                      Conselho de Arbitragem (ArbCom)
                    </button>
                  ) : (
                    <span className="font-semibold text-purple-600">Special:Arbitration</span>
                  )}
                </li>
                <li className="flex items-center justify-between">
                  <span>• Vandalismos corriqueiros ou pedidos de proteção:</span>
                  {onNavigateToContactAdmin ? (
                    <button onClick={onNavigateToContactAdmin} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      Falar com Administração
                    </button>
                  ) : (
                    <span className="font-semibold text-blue-600">Special:ContactAdmin</span>
                  )}
                </li>
              </ul>
            </div>
          </div>

          {/* TELA DE LIMITAÇÃO POR IP PARA USUÁRIO NÃO LOGADO */}
          {!currentUser && ipReport ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Cabeçalho de Status em Tempo Real */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-xs">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                        Limite de 1 Chamado de Emergência por IP
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-300 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <Radio size={10} />
                        Firebase Sincronizado em Tempo Real
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-0.5">
                      Sua conexão IP ({clientIp || 'Identificado'}) já possui um chamado de emergência registrado. O IP que já reportou não pode mais registrar novas ocorrências para prevenir abusos.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchProtocolInput(ipReport.protocolNumber);
                    setActiveTab('status');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Search size={14} />
                  <span>Acompanhar em Tela Cheia</span>
                </button>
              </div>

              {/* Informações que o usuário reportou guardadas pelo seu IP */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Protocolo do Seu Chamado</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {ipReport.protocolNumber}
                      </span>
                      <button
                        onClick={() => handleCopyProtocol(ipReport.protocolNumber)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        title="Copiar protocolo"
                      >
                        {copiedProtocol ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status Atual:</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[ipReport.status]?.color || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                      {STATUS_CONFIG[ipReport.status]?.label || ipReport.status}
                    </span>
                  </div>
                </div>

                {/* Parecer / Resposta dos Administradores em Tempo Real */}
                {ipReport.resolutionSummary && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Parecer Oficial da Administração (Atualizado em Tempo Real):</span>
                    </div>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap pl-6 leading-relaxed">
                      {ipReport.resolutionSummary}
                    </p>
                  </div>
                )}

                {/* Detalhes do Chamado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Título Registrado:</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{ipReport.title}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Data do Envio e IP:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 block">
                      {new Date(ipReport.createdAt).toLocaleString('pt-BR')} (IP: {clientIp || 'Vinculado'})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Categoria da Ocorrência:</span>
                    <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {CATEGORY_DEFINITIONS[ipReport.category]?.label || ipReport.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block">Nível de Gravidade:</span>
                    <span className="text-red-600 dark:text-red-400 font-bold mt-0.5 block">
                      {URGENCY_LEVEL_CONFIG[ipReport.urgencyLevel]?.label || ipReport.urgencyLevel}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold text-xs block">Relato Registrado:</span>
                  <div className="mt-1 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {ipReport.description}
                  </div>
                </div>

                {ipReport.involvedUrlsOrPages && ipReport.involvedUrlsOrPages.length > 0 && (
                  <div>
                    <span className="text-slate-400 font-semibold text-xs block">Páginas ou URLs Informadas:</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {ipReport.involvedUrlsOrPages.map((url, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                          {url}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Histórico de Ações da Administração em Tempo Real */}
                {ipReport.actionLogs && ipReport.actionLogs.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock size={13} className="text-blue-500" />
                      Histórico e Andamento das Ações em Tempo Real:
                    </span>
                    <div className="space-y-1.5">
                      {ipReport.actionLogs.map((log) => (
                        <div key={log.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{log.action}</span>
                            <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                          {log.note && <p className="text-slate-600 dark:text-slate-400 text-[11px]">{log.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ações complementares */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  {onLoginClick ? (
                    <span>
                      Possui uma conta WikiWorldWeb?{' '}
                      <button onClick={onLoginClick} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                        Fazer login
                      </button>{' '}
                      para suporte com credenciais autenticadas.
                    </span>
                  ) : (
                    <span>Precisa adicionar informações urgentes? Contate pedrohenriquecardonaperes@gmail.com citando seu protocolo.</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchProtocolInput(ipReport.protocolNumber);
                    setActiveTab('status');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Search size={14} />
                  <span>Ver Protocolo no Consultor Público</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Banner informativo de limitação por IP para usuários não logados */}
              {!currentUser && (
                <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
                  <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">Política de Limite por IP Ativa:</span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        IP: {clientIp || (isLoadingIp ? 'Identificando...' : '127.0.0.1')}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <Radio size={11} />
                        Sincronia Firebase em Tempo Real
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800/90 dark:text-blue-300/90">
                      Usuários não logados estão limitados a 1 único chamado de emergência por endereço IP. As informações enviadas ficarão guardadas vinculadas ao seu IP, e o IP que já reportou não pode mais registrar novas ocorrências para prevenir duplicidades e spam.
                    </p>
                  </div>
                </div>
              )}

              {/* Formulário */}
              <form onSubmit={handleSubmitReport} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame size={16} className="text-red-600" />
                  <span>Formulário de Abertura de Chamado Emergencial</span>
                </h2>

            {/* Categoria do Incidente */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                1. Categoria da Emergência Crítica: <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {(Object.entries(CATEGORY_DEFINITIONS) as [EmergencyCategory, typeof CATEGORY_DEFINITIONS[EmergencyCategory]][]).map(
                  ([catKey, catVal]) => {
                    const Icon = catVal.icon;
                    const isSelected = category === catKey;
                    return (
                      <button
                        type="button"
                        key={catKey}
                        onClick={() => setCategory(catKey)}
                        className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-red-600 bg-red-50/70 dark:bg-red-950/40 ring-2 ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={isSelected ? 'text-red-600 dark:text-red-400' : 'text-slate-500'} />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {catVal.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                          {catVal.desc}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Nível de Urgência */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                2. Nível de Urgência Operacional: <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer flex-1 transition ${
                  urgencyLevel === 'critica_imediata'
                    ? 'border-red-600 bg-red-50/50 dark:bg-red-950/30 ring-1 ring-red-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="urgencyLevel"
                    value="critica_imediata"
                    checked={urgencyLevel === 'critica_imediata'}
                    onChange={() => setUrgencyLevel('critica_imediata')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-red-700 dark:text-red-400 block">
                      🚨 Crítica Imediata (Risco à Vida, Menores ou Dados em Tempo Real)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Mobilização do plantão em tempo real e suspensão imediata de páginas/contas.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer flex-1 transition ${
                  urgencyLevel === 'alta_gravidade'
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="urgencyLevel"
                    value="alta_gravidade"
                    checked={urgencyLevel === 'alta_gravidade'}
                    onChange={() => setUrgencyLevel('alta_gravidade')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                      ⚠️ Alta Gravidade (Resposta Prioritária em Poucas Horas)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Situações graves já contidas ou requisições de órgãos oficiais.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Título */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                3. Resumo / Título do Incidente de Emergência: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Vazamento de endereço e telefone da editora Maria no artigo Biologia"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            {/* URLs / Páginas Envolvidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  4. Páginas, Artigos ou URLs Envolvidas (uma por linha):
                </label>
                <textarea
                  rows={3}
                  value={urlsInput}
                  onChange={(e) => setUrlsInput(e.target.value)}
                  placeholder="Ex.:&#10;https://.../?uid=art-1&#10;User:ContaInvasora"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  5. Usuários, Contas ou IPs Envolvidos (separados por vírgula):
                </label>
                <textarea
                  rows={3}
                  value={usersInput}
                  onChange={(e) => setUsersInput(e.target.value)}
                  placeholder="Ex.: UsuárioInvasor, 189.23.44.12, ContaSuspeita"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Descrição Detalhada */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                6. Descrição Detalhada dos Fatos e Urgência: <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva exatamente o que ocorreu, onde os dados foram publicados ou qual a ameaça iminente. Seja o mais preciso e objetivo possível."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-hidden leading-relaxed"
              />
            </div>

            {/* Provas e Evidências */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                7. Trechos de Texto, Diffs, Prints ou Evidências Adicionais:
              </label>
              <textarea
                rows={3}
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Cole aqui transcrições, links externos de prova ou resumos de histórico que comprovem a emergência."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            {/* Dados de Contato e Sigilo */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/70 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Lock size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Identificação do Notificante & Confidencialidade</span>
              </h3>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Desejo comunicar este chamado de forma <strong>anônima</strong></span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresConfidentiality}
                    onChange={(e) => setRequiresConfidentiality(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Requeiro <strong>sigilo estrito</strong> de identidade perante a comunidade</span>
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Seu Nome / Pseudônimo:
                    </label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Nome do comunicante"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      E-mail para Resposta Imediata da Administração:
                    </label>
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Declaração de Veracidade */}
            <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <label className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={confirmedTruth}
                  onChange={(e) => setConfirmedTruth(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                />
                <span>
                  Declaro expressamente, sob as penas da lei e das políticas da WikiWorldWeb, que este chamado relata uma <strong>emergência real, verídica e crítica</strong>. Estou ciente de que o uso indevido deste canal para trotes ou disputas editoriais ordinárias acarreta bloqueio sumário por IP/conta e eventual comunicação às autoridades competentes.
                </span>
              </label>
            </div>

            {/* Botão de Envio */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Despachando Alerta de Emergência...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Despachar Notificação de Emergência Imediata</span>
                  </>
                )}
              </button>
            </div>
                </form>
              </>
            )}
        </div>
      )}

      {/* ABA 2: CONSULTA DE PROTOCOLO COM SINCRONIA EM TEMPO REAL */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Search size={16} className="text-blue-600" />
                <span>Consulta Pública de Andamento de Protocolo de Emergência</span>
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <Radio size={11} />
                Sincronia Firebase em Tempo Real
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Digite abaixo o código de protocolo fornecido no momento do envio (ex: <strong>EMERG-2026-1234</strong>) para verificar as medidas mitigadoras e o status administrativo adotado. Todas as respostas e atualizações são sincronizadas em tempo real.
            </p>

            {/* Atalho caso o IP do usuário já possua chamado ativo */}
            {!currentUser && ipReport && (
              <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Fingerprint size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-blue-900 dark:text-blue-200 block">
                      Chamado detectado pelo seu IP ({clientIp || 'Rede Atual'}):
                    </span>
                    <span className="text-[11px] text-blue-800/80 dark:text-blue-300/80 font-mono">
                      Protocolo: <strong>{ipReport.protocolNumber}</strong> — Status: {STATUS_CONFIG[ipReport.status]?.label || ipReport.status}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchProtocolInput(ipReport.protocolNumber);
                    setSearchedReport(ipReport);
                    setSearchError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
                >
                  <Radio size={12} />
                  <span>Carregar Meu Chamado</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSearchProtocol} className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <input
                type="text"
                required
                value={searchProtocolInput}
                onChange={(e) => setSearchProtocolInput(e.target.value)}
                placeholder="Código do Protocolo (ex.: EMERG-2026-XXXX)"
                className="flex-1 px-4 py-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isSearchingProtocol}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSearchingProtocol ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Buscar Protocolo</span>
              </button>
            </form>

            {searchError && (
              <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Resultado da busca */}
          {searchedReport && (
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              {/* Badge de Sincronia em Tempo Real */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Radio size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Sincronização em tempo real ativa com o Firebase: alterações de status e respostas da administração atualizam automaticamente.</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Protocolo Auditado</span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                      {searchedReport.protocolNumber}
                    </h3>
                    <button
                      onClick={() => handleCopyProtocol(searchedReport.protocolNumber)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600"
                      title="Copiar Protocolo"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[searchedReport.status]?.color}`}>
                    {STATUS_CONFIG[searchedReport.status]?.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Categoria</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {CATEGORY_DEFINITIONS[searchedReport.category]?.label}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Nível de Urgência</span>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    {searchedReport.urgencyLevel === 'critica_imediata' ? 'Crítica Imediata (Plantão)' : 'Alta Gravidade'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Data/Hora de Abertura</span>
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                    {new Date(searchedReport.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Síntese do Chamado:
                </h4>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-850 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                  <strong className="block text-slate-900 dark:text-white mb-1">{searchedReport.title}</strong>
                  {searchedReport.description}
                </div>
              </div>

              {searchedReport.resolutionSummary && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Parecer & Ações Adotadas pela Administração:</span>
                  </h4>
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-sans">
                    {searchedReport.resolutionSummary}
                  </div>
                </div>
              )}

              {/* Linha do Tempo de Ações */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Histórico de Auditoria do Caso:
                </h4>
                <div className="space-y-2">
                  {searchedReport.actionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{log.action}</span>
                        <span className="text-slate-600 dark:text-slate-400 text-[11px]">{log.note}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">{log.adminName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: ÁREA RESTRITA - DENÚNCIAS DE EMERGÊNCIA (APENAS ADMINISTRADORES) */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {!isAdmin ? (
            /* ============================================================ */
            /* TELA DE BLOQUEIO DE SEGURANÇA DA ÁREA RESTRITA (NÃO-ADMIN)    */
            /* ============================================================ */
            <div className="rounded-2xl border border-red-300 dark:border-red-900/80 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              {/* Top Banner de Alerta e Restrição */}
              <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 p-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
                      <Lock size={32} className="text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                          Nível 4 de Proteção Máxima
                        </span>
                        <span className="text-xs font-mono text-red-100">
                          Acesso Estritamente Restrito
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white mt-1">
                        Área Restrita: Denúncias de Emergência
                      </h2>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/15 text-xs font-mono font-medium">
                    <EyeOff size={14} className="text-amber-300" />
                    <span>Sigilo Absoluto & Custódia Legal</span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Mensagem Institucional de Justificativa e Amparo Legal */}
                <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200 flex items-start gap-3 text-xs leading-relaxed">
                  <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                      Por que este conteúdo é restrito exclusivamente a administradores?
                    </strong>
                    Os chamados e denúncias de emergência tratam de situações de risco extremo à vida, vazamento de dados de vítimas vulneráveis, assédio, crimes contra menores e ordens judiciais de plantão. Para preservar a integridade física dos envolvidos, evitar retaliações e cumprir o <strong>Art. 5º, X da Constituição Federal</strong>, a <strong>LGPD (Lei nº 13.709/2018)</strong> e o <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>, todos os autos de denúncias são armazenados em cofre fechado, sendo vedada sua exibição pública.
                  </div>
                </div>

                {/* Três Pilares da Proteção */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                      <Fingerprint size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Cadeia de Custódia Probatória
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      IPs, metadados de auditoria e relatos originais são preservados para entrega oficial às autoridades policiais e Ministério Público quando requisitado.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Lock size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Proteção e Anonimato da Vítima
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      O denunciante e pessoas expostas têm seu nome e e-mail blindados contra exposição pública na enciclopédia para prevenir assédio ou perseguição.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Building2 size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Atribuição Exclusiva da Staff
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Apenas operadores com privilégios de Administrador têm competência para suprimir artigos, aplicar bloqueios emergenciais e despachar os casos.
                    </p>
                  </div>
                </div>

                {/* Caixa de Autenticação e Desbloqueio do Administrador */}
                <div className="p-5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-850/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Key size={15} className="text-amber-500" />
                        <span>Autenticação de Administrador de Plantão:</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Se você é um administrador da WikiWorldWeb, autentique-se para liberar o acesso imediato à lista de ocorrências.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {onLoginClick && (
                      <button
                        type="button"
                        onClick={onLoginClick}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
                      >
                        <User size={14} />
                        <span>Entrar com Conta de Administrador</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowAdminKeyInput(!showAdminKeyInput)}
                      className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-750 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
                    >
                      <Key size={14} />
                      <span>{showAdminKeyInput ? 'Fechar Credencial de Plantão' : 'Desbloqueio com Credencial de Plantão'}</span>
                    </button>
                  </div>

                  {/* Formulário de Desbloqueio com Credencial / Chave Mestra */}
                  {showAdminKeyInput && (
                    <form onSubmit={handleUnlockAdmin} className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          E-mail de Administrador ou Chave de Emergência:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={adminKeyInput}
                            onChange={(e) => setAdminKeyInput(e.target.value)}
                            placeholder="Insira o e-mail oficial (pedrohenriquecardonaperes@gmail.com) ou credencial..."
                            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                          >
                            <Unlock size={14} />
                            <span>Desbloquear</span>
                          </button>
                        </div>
                      </div>

                      {adminKeyError && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                          <AlertTriangle size={13} /> {adminKeyError}
                        </p>
                      )}

                      <p className="text-[10px] text-slate-400">
                        * Dica: Administradores credenciados podem usar seu e-mail institucional ou a chave mestra de plantão. Todas as tentativas de acesso são registradas em log de auditoria.
                      </p>
                    </form>
                  )}
                </div>

                {/* Orientação para Usuários Não-Administradores */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Você é um usuário ou vítima precisando de assistência imediata?
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('form')}
                      className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1.5"
                    >
                      <Flame size={13} /> Emitir Chamado de Emergência
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('status')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition flex items-center gap-1.5"
                    >
                      <Search size={13} /> Consultar Protocolo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* PAINEL OPERACIONAL DA ÁREA RESTRITA (ADMINISTRADOR LIBERADO) */
            /* ============================================================ */
            <div className="space-y-6">
              {/* Banner de Sessão Administrativa Ativa */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20 text-emerald-400">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/40">
                        Área Restrita Desbloqueada
                      </span>
                      <span className="text-xs font-mono text-purple-200">
                        Sessão de Plantão Oficial
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-white mt-0.5">
                      Central de Triagem de Denúncias de Emergência (Cofre da Administração)
                    </h2>
                    <p className="text-[11px] text-purple-200/80">
                      Operador: <strong>{currentUser?.displayName || currentUser?.username || 'Administrador de Plantão'}</strong> ({currentUser?.email || 'pedrohenriquecardonaperes@gmail.com'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLockAdmin}
                    className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-red-400/30"
                    title="Encerrar sessão da área restrita"
                  >
                    <Lock size={13} />
                    <span>Trancar Área Restrita</span>
                  </button>
                </div>
              </div>

              {/* Cards de Métricas em Tempo Real */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total de Denúncias</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {reports.length}
                  </span>
                  <span className="text-[10px] text-slate-500">Registros em custódia</span>
                </div>

                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 block">Aguardando Plantão</span>
                  <span className="text-xl font-bold font-mono text-red-700 dark:text-red-300 mt-0.5 flex items-center gap-2">
                    {(Array.isArray(reports) ? reports : []).filter((r) => r?.status === 'urgente_recebido').length}
                    {(Array.isArray(reports) ? reports : []).filter((r) => r?.status === 'urgente_recebido').length > 0 && (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    )}
                  </span>
                  <span className="text-[10px] text-red-600/80">Requer intervenção rápida</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Em Atendimento</span>
                  <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-0.5 block">
                    {(Array.isArray(reports) ? reports : []).filter((r) => r?.status === 'em_atendimento_imediato').length}
                  </span>
                  <span className="text-[10px] text-amber-600/80">Medidas em execução</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Resolvidos / Encaminhados</span>
                  <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                    {(Array.isArray(reports) ? reports : []).filter((r) => r?.status === 'resolvido_mitigado' || r?.status === 'encaminhado_autoridades').length}
                  </span>
                  <span className="text-[10px] text-emerald-600/80">Riscos mitigados</span>
                </div>
              </div>

              {/* Filtros e Busca Rápida */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={adminStatusFilter}
                    onChange={(e) => setAdminStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="urgente_recebido">Urgente Recebido</option>
                    <option value="em_atendimento_imediato">Em Atendimento</option>
                    <option value="resolvido_mitigado">Resolvido</option>
                    <option value="encaminhado_autoridades">Encaminhado Autoridades</option>
                    <option value="encerrado_invalido">Encerrado / Trote</option>
                  </select>

                  <select
                    value={adminCategoryFilter}
                    onChange={(e) => setAdminCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  >
                    <option value="todas">Todas as Categorias</option>
                    {Object.entries(CATEGORY_DEFINITIONS).map(([catKey, catVal]) => (
                      <option key={catKey} value={catKey}>
                        {catVal.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-80">
                  <div className="relative">
                    <input
                      type="text"
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      placeholder="Buscar por protocolo, título, usuário citado ou relator..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                    />
                    <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Tabela / Grid de Casos (Split View) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Esquerda: Lista de Chamados */}
                <div className="lg:col-span-1 space-y-2 max-h-[650px] overflow-y-auto pr-1">
                  {filteredReports.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <ShieldCheck size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
                      <p>Nenhuma denúncia corresponde aos filtros aplicados.</p>
                    </div>
                  ) : (
                    filteredReports.map((r) => {
                      const isSelected = selectedReportId === r.id;
                      const catConfig = CATEGORY_DEFINITIONS[r.category];
                      const statusConf = STATUS_CONFIG[r.status];
                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelectedReportId(r.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-2 ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 ring-2 ring-purple-500/40 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                              {r.protocolNumber}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${statusConf.color}`}>
                              {statusConf.badge}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                            {r.title}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="truncate font-semibold">{catConfig?.badge}</span>
                            <span className="font-mono">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>

                          {r.assignedAdminName && (
                            <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                              Atribuído a: <strong>{r.assignedAdminName}</strong>
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Coluna Direita: Prontuário Completo do Chamado Selecionado */}
                <div className="lg:col-span-2">
                  {selectedReport ? (
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                              {selectedReport.protocolNumber}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_CONFIG[selectedReport.status]?.color}`}>
                              {STATUS_CONFIG[selectedReport.status]?.label}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-semibold">
                              {CATEGORY_DEFINITIONS[selectedReport.category]?.label || selectedReport.category}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                            {selectedReport.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span>Aberto em {new Date(selectedReport.createdAt).toLocaleString('pt-BR')}</span>
                            <span>•</span>
                            <span>
                              Relator: <strong>{selectedReport.isAnonymous ? 'Anônimo (Protegido)' : selectedReport.reporterName}</strong>
                            </span>
                            {selectedReport.reporterIp && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                                  IP: {selectedReport.reporterIp}
                                </span>
                              </>
                            )}
                            {selectedReport.reporterIpHash && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[10px]">Hash: {selectedReport.reporterIpHash}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleCopyFormalDossier(selectedReport)}
                            className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                            title="Copiar relatório estruturado para encaminhamento formal policial ou judicial"
                          >
                            <Copy size={13} />
                            <span>Copiar Dossiê</span>
                          </button>

                          {selectedReport.reporterEmail && (
                            <a
                              href={`mailto:${selectedReport.reporterEmail}?subject=%5BRESPOSTA%20EMERG%C3%8ANCIA%20WIKIZERO%5D%20Protocolo%20${selectedReport.protocolNumber}`}
                              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <Mail size={13} />
                              <span>Contatar Relator</span>
                            </a>
                          )}

                          <button
                            onClick={() => setDeleteConfirmId(selectedReport.id)}
                            className="px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 text-xs font-semibold flex items-center gap-1.5 transition"
                            title="Excluir do cofre de denúncias"
                          >
                            <Trash2 size={13} />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>

                      {/* Modal de Confirmação de Exclusão */}
                      {deleteConfirmId && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900 text-red-900 dark:text-red-200 space-y-3">
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <AlertTriangle size={16} className="text-red-600" />
                            <span>Confirmar Exclusão Definitiva do Chamado?</span>
                          </div>
                          <p className="text-[11px] text-red-800 dark:text-red-300">
                            Esta ação removerá permanentemente o chamado {selectedReport.protocolNumber} do banco de dados e do cofre de auditoria da administração.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteReport(deleteConfirmId)}
                              className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                            >
                              Sim, Excluir Registro
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Informações da Ocorrência */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Descrição dos Fatos Notificados:
                        </h4>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-850 text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap border border-slate-200 dark:border-slate-800">
                          {selectedReport.description}
                        </div>
                      </div>

                      {/* URLs Envolvidas com Ação Direta */}
                      {selectedReport.involvedUrlsOrPages && selectedReport.involvedUrlsOrPages.length > 0 && (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            Páginas / URLs Citadas no Relato:
                          </h4>
                          <ul className="text-xs space-y-1 font-mono">
                            {selectedReport.involvedUrlsOrPages.map((url, idx) => (
                              <li key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-800">
                                <span className="text-blue-600 dark:text-blue-400 truncate">{url}</span>
                                {onNavigateToArticle && (
                                  <button
                                    onClick={() => onNavigateToArticle(url.replace(/https?:\/\/[^/]+\//, ''))}
                                    className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-semibold hover:bg-blue-200 transition"
                                  >
                                    Abrir Artigo
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Usuários Envolvidos com Links de Ação (Perfil e CheckUser) */}
                      {selectedReport.involvedUsers && selectedReport.involvedUsers.length > 0 && (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            Contas / Usuários Citados:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedReport.involvedUsers.map((user, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-mono text-xs font-semibold flex items-center gap-2"
                              >
                                <span>{user}</span>
                                {onNavigateToUser && (
                                  <button
                                    onClick={() => onNavigateToUser(user)}
                                    className="text-[10px] underline hover:text-rose-900 dark:hover:text-rose-100"
                                    title="Ver perfil do usuário"
                                  >
                                    Perfil
                                  </button>
                                )}
                                {onNavigateToCheckUser && (
                                  <button
                                    onClick={() => onNavigateToCheckUser(user)}
                                    className="px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 text-[9px] font-bold hover:bg-rose-300 transition"
                                    title="Abrir investigação de CheckUser"
                                  >
                                    CheckUser
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evidências anexadas */}
                      {selectedReport.evidenceText && (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            Evidências e Elementos Probatórios:
                          </h4>
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-slate-200 dark:border-slate-800">
                            {selectedReport.evidenceText}
                          </div>
                        </div>
                      )}

                      {/* Painel de Ações Rápidas do Administrador */}
                      <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3">
                        <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck size={15} className="text-purple-600" />
                          <span>Despacho Operacional da Administração:</span>
                        </h4>

                        <div className="flex flex-wrap items-center gap-2">
                          {!selectedReport.assignedAdminUid && (
                            <button
                              onClick={handleAdminAssignSelf}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition"
                            >
                              Assumir Responsabilidade pelo Caso
                            </button>
                          )}
                          {selectedReport.assignedAdminName && (
                            <span className="text-xs text-purple-900 dark:text-purple-300 font-medium">
                              Administrador Responsável: <strong>{selectedReport.assignedAdminName}</strong>
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 pt-2">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Parecer da Administração / Medidas Adotadas:
                          </label>
                          <textarea
                            rows={3}
                            value={adminResolutionNote}
                            onChange={(e) => setAdminResolutionNote(e.target.value)}
                            placeholder="Ex.: Artigo protegido contra edição, contas banidas em definitivo e histórico ofensivo suprimido do banco de dados."
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                          />

                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              disabled={isUpdatingStatus}
                              onClick={() => handleAdminUpdateStatus('em_atendimento_imediato')}
                              className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
                            >
                              ⚡ Em Atendimento Imediato
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingStatus}
                              onClick={() => handleAdminUpdateStatus('resolvido_mitigado')}
                              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                            >
                              ✅ Resolver & Mitigar
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingStatus}
                              onClick={() => handleAdminUpdateStatus('encaminhado_autoridades')}
                              className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition"
                            >
                              ⚖️ Encaminhar às Autoridades
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingStatus}
                              onClick={() => handleAdminUpdateStatus('encerrado_invalido')}
                              className="px-3 py-1.5 rounded-md bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold transition"
                            >
                              ❌ Encerrar (Trote / Não Emergencial)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Logs de Auditoria do Caso */}
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Histórico e Cadeia de Custódia:
                        </h4>
                        <div className="space-y-1.5">
                          {selectedReport.actionLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{log.note}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                                </span>
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">{log.adminName}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
                      <ShieldAlert size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
                      <p className="text-xs">Selecione uma denúncia na lista à esquerda para examinar os autos de emergência confidenciais.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
