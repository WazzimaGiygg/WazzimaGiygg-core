import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Scale,
  Gavel,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Eye,
  EyeOff,
  User,
  UserX,
  MessageSquare,
  Search,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Send,
  ShieldAlert,
  Info,
  Sparkles,
  Filter,
  Calendar,
  Award,
  ChevronRight,
  HelpCircle,
  Hash,
  AlertOctagon,
  RefreshCw,
  FileWarning,
} from 'lucide-react';
import {
  UserProfile,
  WikiArticle,
  UcocReport,
  UcocViolationCategory,
  UcocSeverity,
  UcocReportStatus,
} from '../types';
import { StorageService } from '../services/storageService';
import { formatExternalUrl } from '../utils/linkUtils';

interface UcocViewProps {
  currentUser?: UserProfile | null;
  articles?: WikiArticle[];
  initialTab?: 'principles' | 'new-report' | 'track' | 'cases';
  initialProtocol?: string;
  onNavigateToArticle?: (articleId: string) => void;
  onNavigateToUser?: (username: string) => void;
  onNavigateToContactAdmin?: () => void;
  onNavigateToEmergencyContact?: () => void;
  onNavigateToArbitration?: () => void;
  onLoginClick?: () => void;
  onBack?: () => void;
}

export const UCOC_CATEGORY_INFO: Record<
  UcocViolationCategory,
  { label: string; badge: string; color: string; desc: string; examples: string }
> = {
  assedio_sistematico: {
    label: 'Assédio Sistemático e Perseguição Editorial (Wikihounding)',
    badge: 'ASSÉDIO EDITORIAL',
    color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    desc: 'Perseguição proposital e contínua às edições de outro usuário com intuito de intimidar, minar sua participação, provocar reações ou causar desgaste psicológico.',
    examples: 'Reverter repetidamente sem justificativa plausível, monitorar todas as contribuições para buscar pequenas falhas e depreciar publicamente.',
  },
  abuso_poder_autoridade: {
    label: 'Abuso de Poder e Autoridade Administrativa',
    badge: 'ABUSO DE AUTORIDADE',
    color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    desc: 'Uso indevido das ferramentas de administrador ou moderador para benefício pessoal, vitória em disputas de conteúdo, censura ou retaliação.',
    examples: 'Proteger páginas a favor de sua própria versão em disputa de edição, aplicar bloqueios discricionários sem respaldo comunitário ou ocultar discussões legítimas.',
  },
  discurso_odio_discriminacao: {
    label: 'Discurso de Ódio, Discriminação e Intolerância',
    badge: 'TOLERÂNCIA ZERO',
    color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/80 border-red-300 dark:border-red-700',
    desc: 'Manifestações que promovam ódio, desumanização, violência ou estigmatização com base em raça, gênero, orientação sexual, nacionalidade, deficiência ou religião.',
    examples: 'Ofensas com termos racistas, capacitistas, misóginos ou homofóbicos em artigos, sumários de edição ou páginas de discussão.',
  },
  difamacao_ataque_pessoal: {
    label: 'Difamação Deliberada e Ataques Pessoais Graves',
    badge: 'ATAQUE PESSOAL',
    color: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    desc: 'Acusações fraudulentas sem provas, insultos diretos à integridade moral do editor ou imputação mentirosa de condutas desonestas.',
    examples: 'Chamar um editor de criminoso ou fraudador em fóruns públicos sem processo prévio ou decisões do Conselho de Arbitragem.',
  },
  retaliacao_denuncia: {
    label: 'Retaliação contra Denunciante ou Testemunha',
    badge: 'PROTEÇÃO UCoC',
    color: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    desc: 'Qualquer ato persecutório, ameaça, boicote ou punição contra alguém que tenha protocolado uma denúncia de boa-fé sob o UCoC ou colaborado com investigações.',
    examples: 'Bloquear ou perseguir um usuário porque ele reportou um moderador por infração ética.',
  },
  conflito_interesse_encoberto: {
    label: 'Conflito de Interesses Não Declarado / Edição Paga Encoberta',
    badge: 'INTEGRIDADE',
    color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    desc: 'Edição de biografias ou artigos corporativos em troca de remuneração financeira ou proveito pessoal direto sem a devida declaração explícita de transparência.',
    examples: 'Agências de relações públicas manipulando neutralidade de artigos de clientes simulando consenso comunitário.',
  },
  coacao_ameaca_legal: {
    label: 'Coação, Chantagem ou Ameaça de Ação Judicial Fora do Projeto',
    badge: 'COAÇÃO EXTERNA',
    color: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    desc: 'Ameaçar outros editores com processos judiciais ou exposição pessoal na vida real para coagi-los a recuar em edições da enciclopédia.',
    examples: 'Enviar e-mails ameaçando processo penal se determinado conteúdo ou fonte verificável não for excluída.',
  },
  outro_ucoc: {
    label: 'Outras Violações Graves aos Pilares do UCoC',
    badge: 'VIOLAÇÃO GERAL',
    color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
    desc: 'Comportamentos deletérios sistemáticos que violem os princípios fundamentais de boa convivência e integridade da enciclopédia.',
    examples: 'Manipulação maliciosa de consenso comunitário com contas coordenadas ou perturbação geral.',
  },
};

export const UCOC_STATUS_INFO: Record<
  UcocReportStatus,
  { label: string; badgeColor: string; description: string }
> = {
  admissibilidade: {
    label: 'Protocolada / Admissibilidade Preliminar',
    badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
    description: 'A denúncia foi recebida formalmente e está sob triagem inicial de tempestividade e competência pela Ouvidoria UCoC.',
  },
  em_instrucao: {
    label: 'Em Instrução / Notificação & Contraditório',
    badgeColor: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700',
    description: 'A parte denunciada foi cientificada para apresentar sua manifestação de defesa e provas complementares.',
  },
  em_deliberacao: {
    label: 'Em Deliberação pelo Comitê UCoC',
    badgeColor: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700',
    description: 'Os membros do conselho estão avaliando o mérito das alegações para elaboração do acórdão fundamentado.',
  },
  medida_cautelar: {
    label: 'Medida Cautelar Preventiva em Vigor',
    badgeColor: 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700',
    description: 'Medidas provisórias foram aplicadas para cessar prejuízos ou coação enquanto o processo tramita.',
  },
  concluida_sancao: {
    label: 'Procedente / Concluída com Sanção',
    badgeColor: 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700',
    description: 'O Comitê UCoC julgou a denúncia procedente e determinou penalidades proporcionais à gravidade da conduta.',
  },
  concluida_arquivada: {
    label: 'Arquivada / Improcedente ou Conciliada',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700',
    description: 'O processo foi encerrado sem sanção disciplinar por ausência de prova de má-fé ou mediante conciliação entre as partes.',
  },
};

export const UcocView: React.FC<UcocViewProps> = ({
  currentUser,
  articles = [],
  initialTab = 'principles',
  initialProtocol = '',
  onNavigateToArticle,
  onNavigateToUser,
  onNavigateToContactAdmin,
  onNavigateToEmergencyContact,
  onNavigateToArbitration,
  onLoginClick,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'principles' | 'new-report' | 'track' | 'cases'>(initialTab);
  const [reports, setReports] = useState<UcocReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Formulário de Nova Denúncia
  const [category, setCategory] = useState<UcocViolationCategory>('assedio_sistematico');
  const [severity, setSeverity] = useState<UcocSeverity>('moderada');
  const [title, setTitle] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [involvedUrls, setInvolvedUrls] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [isConfidential, setIsConfidential] = useState(true);
  const [requiresProtectiveMeasures, setRequiresProtectiveMeasures] = useState(false);
  const [acceptedGoodFaith, setAcceptedGoodFaith] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<UcocReport | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Consulta por Protocolo
  const [searchProtocolInput, setSearchProtocolInput] = useState(initialProtocol);
  const [activeSearchedReport, setActiveSearchedReport] = useState<UcocReport | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState<string | null>(null);

  // Resposta de Defesa
  const [defenseText, setDefenseText] = useState('');
  const [submittingDefense, setSubmittingDefense] = useState(false);
  const [defenseSuccess, setDefenseSuccess] = useState(false);

  // Gestão Administrativa do Processo
  const [adminStatusUpdate, setAdminStatusUpdate] = useState<UcocReportStatus>('em_instrucao');
  const [adminResolutionText, setAdminResolutionText] = useState('');
  const [adminSanctionsText, setAdminSanctionsText] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isUpdatingProcess, setIsUpdatingProcess] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderador' || currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  // Carrega e assina relatórios
  useEffect(() => {
    setLoadingReports(true);
    const unsubscribe = StorageService.subscribeToUcocReports((list) => {
      setReports(list);
      setLoadingReports(false);
    }, currentUser);

    return () => unsubscribe();
  }, [currentUser]);

  // Se tiver initialProtocol, busca automaticamente
  useEffect(() => {
    if (initialProtocol) {
      handleSearchProtocol(initialProtocol);
    }
  }, [initialProtocol]);

  const handleSearchProtocol = async (prot?: string) => {
    const target = (prot || searchProtocolInput).trim();
    if (!target) return;
    setTrackingLoading(true);
    setTrackingError(null);
    try {
      const rep = await StorageService.getUcocReportByProtocol(target);
      if (rep) {
        setActiveSearchedReport(rep);
        setAdminStatusUpdate(rep.status);
        setAdminResolutionText(rep.committeeResolution || '');
        setAdminSanctionsText(rep.appliedSanctions || '');
      } else {
        setActiveSearchedReport(null);
        setTrackingError(`Nenhum processo foi localizado com o protocolo "${target}". Verifique a digitação ou certifique-se de que a denúncia foi protocolada com sucesso.`);
      }
    } catch {
      setTrackingError('Falha ao consultar protocolo no servidor.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCopyProtocol = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedProtocol(num);
    setTimeout(() => setCopiedProtocol(null), 2000);
  };

  const handleSubmitNewReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedGoodFaith) {
      setSubmitError('Você deve aceitar os termos de responsabilidade e boa-fé comunitária.');
      return;
    }
    if (!title.trim() || !targetUsername.trim() || !description.trim() || !evidenceText.trim()) {
      setSubmitError('Por favor, preencha todos os campos obrigatórios (Título, Usuário Denunciado, Descrição dos Fatos e Evidências).');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const parsedUrls = involvedUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      const created = await StorageService.createUcocReport({
        category,
        severity,
        title,
        description,
        targetUsername,
        involvedUrlsOrArticles: parsedUrls,
        evidenceText,
        reporterName: currentUser?.displayName || currentUser?.username || 'Usuário Anônimo',
        reporterEmail: currentUser?.email,
        reporterUid: currentUser?.uid,
        reporterRole: currentUser?.role,
        isAnonymousOrConfidential: isConfidential,
        requiresProtectiveMeasures,
      });

      setSubmitSuccess(created);
      setActiveSearchedReport(created);
      setTitle('');
      setTargetUsername('');
      setInvolvedUrls('');
      setDescription('');
      setEvidenceText('');
      setAcceptedGoodFaith(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Falha ao protocolar denúncia.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDefense = async () => {
    if (!activeSearchedReport || !defenseText.trim() || !currentUser) return;
    setSubmittingDefense(true);
    try {
      const updated = await StorageService.submitUcocDefense(
        activeSearchedReport.id,
        defenseText,
        currentUser
      );
      if (updated) {
        setActiveSearchedReport(updated);
        setDefenseSuccess(true);
        setDefenseText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDefense(false);
    }
  };

  const handleUpdateProcessAdmin = async () => {
    if (!activeSearchedReport || !currentUser || !isStaff) return;
    setIsUpdatingProcess(true);
    try {
      const updated = await StorageService.updateUcocReport(
        activeSearchedReport.id,
        {
          status: adminStatusUpdate,
          committeeResolution: adminResolutionText.trim() || undefined,
          appliedSanctions: adminSanctionsText.trim() || undefined,
          assignedInvestigatorUid: currentUser.uid,
          assignedInvestigatorName: currentUser.displayName || currentUser.username || 'Administrador',
        },
        currentUser,
        adminNote.trim() || `Atualização de status do processo para "${UCOC_STATUS_INFO[adminStatusUpdate].label}".`
      );
      if (updated) {
        setActiveSearchedReport(updated);
        setAdminNote('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingProcess(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSearchedReport || !commentInput.trim() || !currentUser) return;
    setSubmittingComment(true);
    try {
      const updated = await StorageService.addUcocReportComment(
        activeSearchedReport.id,
        {
          text: commentInput,
          authorName: currentUser.displayName || currentUser.username || 'Usuário',
          authorRole: currentUser.role,
          authorUid: currentUser.uid,
          isOfficialStatement: isStaff,
          isInternalNote: isStaff && isInternalComment,
        },
        currentUser
      );
      if (updated) {
        setActiveSearchedReport(updated);
        setCommentInput('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 font-sans space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center gap-1"
              title="Voltar à página anterior"
            >
              <ArrowLeft size={14} />
              <span className="font-semibold">Voltar</span>
            </button>
          )}
          <span>/</span>
          <span>Políticas & Governança</span>
          <span>/</span>
          <span className="text-purple-600 dark:text-purple-400 font-bold font-mono">Special:UCoC</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {onNavigateToArbitration && (
            <button
              onClick={onNavigateToArbitration}
              className="px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 hover:bg-purple-100 font-medium transition flex items-center gap-1.5"
            >
              <Gavel size={13} />
              <span>Conselho de Arbitragem (ArbCom)</span>
            </button>
          )}
          {onNavigateToEmergencyContact && (
            <button
              onClick={onNavigateToEmergencyContact}
              className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 font-medium transition flex items-center gap-1.5"
            >
              <AlertOctagon size={13} />
              <span>Casos Extremos (Plantão)</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50 via-white to-slate-50 dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 text-xs font-bold tracking-wide font-mono">
              <Shield size={14} className="text-purple-600 dark:text-purple-400" />
              <span>CÓDIGO UNIVERSAL DE CONDUTA (UCoC)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Universal Code of Conduct
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O Código Universal de Conduta (UCoC) estabelece o padrão ético inegociável de comportamento comunitário na WikiWorldWeb. Fornece salvaguardas rigorosas contra assédio, abuso de poder administrativo, discriminação e perseguição editorial, garantindo um canal formal para abertura e instrução de denúncias com devido processo legal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('new-report')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <FileWarning size={16} />
              <span>Protocolar Denúncia Formal</span>
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <Search size={15} />
              <span>Consultar por Protocolo</span>
            </button>
          </div>
        </div>

        {/* 4 Pillars Mini-Badges */}
        <div className="mt-6 pt-4 border-t border-purple-100 dark:border-purple-900/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
            <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Award size={14} className="text-purple-600" />
              <span>1. Respeito Mútuo</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Civilidade estrita e foco no conteúdo enciclopédico.</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
            <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-600" />
              <span>2. Livre de Assédio</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tolerância zero a wikihounding, stalking e ameaças.</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
            <div className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
              <UserX size={14} className="text-rose-600" />
              <span>3. Não Discriminação</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Vedação expressa a discurso de ódio e preconceitos.</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
            <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Scale size={14} className="text-blue-600" />
              <span>4. Governança Justa</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Responsabilidade de administradores e não retaliação.</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('principles')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'principles'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={15} />
          <span>Texto & Diretrizes do UCoC</span>
        </button>

        <button
          onClick={() => setActiveTab('new-report')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'new-report'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileWarning size={15} />
          <span>Protocolar Denúncia Formal</span>
        </button>

        <button
          onClick={() => setActiveTab('track')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'track'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Search size={15} />
          <span>Consultar Protocolo</span>
          {activeSearchedReport && (
            <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900 text-[10px] font-mono">
              {activeSearchedReport.protocolNumber}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'cases'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Scale size={15} />
          <span>{isStaff ? 'Painel de Processos (Staff)' : 'Meus Processos'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
            {reports.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PRINCIPLES & FULL CODE */}
      {activeTab === 'principles' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-950 dark:text-blue-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Info size={16} className="text-blue-600 dark:text-blue-400" />
              <span>Finalidade e Aplicação do Universal Code of Conduct</span>
            </div>
            <p className="leading-relaxed">
              O UCoC é vinculativo para todos os participantes da WikiWorldWeb, incluindo leitores anônimos, editores cadastrados, moderadores e administradores com direitos avançados. Nenhum costume local de projetos, estatuto ou privilégio administrativo pode se sobrepor às diretrizes do UCoC.
            </p>
          </div>

          {/* Categorias de Infração */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert size={18} className="text-purple-600" />
              <span>Infrações Formais Passíveis de Denúncia UCoC</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(UCOC_CATEGORY_INFO) as UcocViolationCategory[]).map((catKey) => {
                const info = UCOC_CATEGORY_INFO[catKey];
                return (
                  <div
                    key={catKey}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700 transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${info.color}`}>
                        {info.badge}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {info.label}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {info.desc}
                    </p>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-300">Exemplos concretos: </strong>
                      {info.examples}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Procedimento e Garantias Processuais */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Gavel size={16} className="text-purple-600" />
              <span>Rito Processual e Garantias Fundamentais</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock size={13} className="text-purple-600" />
                  <span>Sigilo & Proteção</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Denunciantes podem requerer sigilo estrito de sua identidade. Retaliações configuram falta gravíssima com bloqueio imediato.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Scale size={13} className="text-blue-600" />
                  <span>Ampla Defesa</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Nenhuma sanção definitiva é aplicada sem concessão de prazo para contraditório e apresentação de contraprovas da parte requerida.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Decisão Fundamentada</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Todos os pareceres emitidos pelo Comitê UCoC são registrados com base nas regras escritas e precedentes da enciclopédia.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NEW FORMAL REPORT */}
      {activeTab === 'new-report' && (
        <div className="space-y-6">
          {submitSuccess ? (
            <div className="p-6 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-600 text-white">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">
                    Denúncia Formal Protocolada com Sucesso!
                  </h3>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    Seu processo foi registrado com segurança e distribuído para a Ouvidoria e Comitê do UCoC.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-slate-500">Número Oficial de Protocolo:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-purple-700 dark:text-purple-300">
                      {submitSuccess.protocolNumber}
                    </span>
                    <button
                      onClick={() => handleCopyProtocol(submitSuccess.protocolNumber)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition flex items-center gap-1 text-[11px]"
                      title="Copiar Protocolo"
                    >
                      {copiedProtocol === submitSuccess.protocolNumber ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Guarde este número de protocolo. Ele permite consultar o andamento e receber notificações de despachos na aba &quot;Consultar Protocolo&quot;.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('track');
                    handleSearchProtocol(submitSuccess.protocolNumber);
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition text-xs flex items-center gap-1.5"
                >
                  <Search size={14} />
                  <span>Acessar Autos do Processo</span>
                </button>
                <button
                  onClick={() => setSubmitSuccess(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition text-xs"
                >
                  Protocolar Outra Denúncia
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitNewReport} className="space-y-6">
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/70 bg-purple-50/50 dark:bg-purple-950/30 text-xs space-y-1.5">
                <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <FileWarning size={15} className="text-purple-600" />
                  <span>Instruções para Abertura de Denúncia Formal UCoC</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Utilize este canal para formalizar infrações graves e sistemáticas às regras de convivência. Denúncias formais exigem fundamentação com provas verificáveis (links de diff, capturas ou texto de discussão). Denúncias reiteradas de má-fé ou com intuito difamatório configuram falta disciplinar.
                </p>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Categoria */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tipo de Violação UCoC *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as UcocViolationCategory)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    {(Object.keys(UCOC_CATEGORY_INFO) as UcocViolationCategory[]).map((catKey) => (
                      <option key={catKey} value={catKey}>
                        {UCOC_CATEGORY_INFO[catKey].label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severidade */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Nível de Gravidade / Urgência *
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as UcocSeverity)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    <option value="baixa">Baixa (Incidente isolado sem dano grave à comunidade)</option>
                    <option value="moderada">Moderada (Conduta hostil repetida em discussões)</option>
                    <option value="grave">Grave (Assédio contínuo, perseguição editorial ou discriminação)</option>
                    <option value="critica">Crítica (Abuso de autoridade em massa ou risco iminente)</option>
                  </select>
                </div>
              </div>

              {/* Informações dos Envolvidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <UserX size={14} className="text-rose-600" />
                    <span>Usuário(s) Denunciado(s) *</span>
                  </label>
                  <input
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="Ex: NomeDoUsuario ou @Usuario"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Indique o nome exato da conta na enciclopédia.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Título Resumido da Denúncia *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Wikihounding e reversões persecutórias nos artigos de Ferrovias"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Links e Páginas Envolvidas */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Artigos, Discussões ou URLs Envolvidas (uma por linha)
                </label>
                <textarea
                  value={involvedUrls}
                  onChange={(e) => setInvolvedUrls(e.target.value)}
                  rows={2}
                  placeholder="Ex: art-1 ou https://wikiworldweb.com/?uid=art-1&#10;Ex: User:NomeDoUsuario/talk"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              {/* Descrição dos Fatos */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Descrição Circunstanciada dos Fatos *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Descreva cronologicamente o que ocorreu, quando começou, as tentativas prévias de diálogo e por que a conduta viola o Código Universal de Conduta..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden leading-relaxed"
                  required
                />
              </div>

              {/* Provas e Evidências */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Evidências, Citações Textuais & Diffs de Edição *</span>
                  <span className="text-[10px] text-slate-500 font-normal">Suporta wikitexto e citações</span>
                </label>
                <textarea
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  rows={4}
                  placeholder="Cole aqui transcrições literais de mensagens em discussão, sumários de edição ofensivos, links de diffs e registros de histórico comprobatórios..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Opções de Proteção e Medidas Cautelares */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock size={14} className="text-purple-600" />
                  <span>Garantias de Proteção e Medidas Cautelares</span>
                </h4>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfidential}
                    onChange={(e) => setIsConfidential(e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Requerer Sigilo e Confidencialidade da Identidade do Notificante (Recomendado)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Seu nome e e-mail serão conhecidos estritamente pelos membros do Comitê UCoC para instrução probatória e jamais serão divulgados publicamente ou para a parte denunciada.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresProtectiveMeasures}
                    onChange={(e) => setRequiresProtectiveMeasures(e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Requerer Medida Cautelar de Urgência (Afastamento Preventivo de Contato)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Solicita que a administração imponha imediatamente uma ordem de não-interação (no-contact order) ou suspensão cautelar enquanto a apuração transcorre.
                    </p>
                  </div>
                </label>
              </div>

              {/* Termo de Boa-Fé */}
              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedGoodFaith}
                    onChange={(e) => setAcceptedGoodFaith(e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                    required
                  />
                  <span className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    <strong>Declaração de Boa-Fé e Compromisso com a Verdade:</strong> Declaro formalmente que os fatos relatados nesta denúncia são verídicos de acordo com o meu conhecimento, e que não estou movido por má-fé, revanchismo ou mera disputa editorial legítima. Estou ciente de que a utilização fraudulenta do canal de denúncias constitui violação ao próprio Código Universal de Conduta.
                  </span>
                </label>
              </div>

              {/* Botão de Envio */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  {currentUser ? (
                    <span>Logado como: <strong>{currentUser.username || currentUser.displayName}</strong></span>
                  ) : (
                    <span>Você está enviando como usuário visitante não autenticado.</span>
                  )}
                </span>

                <button
                  type="submit"
                  disabled={submitting || !acceptedGoodFaith}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Protocolando no Sistema...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Protocolar Denúncia Oficial</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: TRACK REPORT BY PROTOCOL */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          {/* Protocol Search Bar */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search size={15} className="text-purple-600" />
              <span>Acompanhamento e Defesa de Processo UCoC</span>
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Hash size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchProtocolInput}
                  onChange={(e) => setSearchProtocolInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchProtocol()}
                  placeholder="Digite o número de protocolo (ex: UCOC-2026-8492)"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
              <button
                onClick={() => handleSearchProtocol()}
                disabled={trackingLoading || !searchProtocolInput.trim()}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
              >
                {trackingLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Consultar</span>
              </button>
            </div>
            {trackingError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {trackingError}
              </div>
            )}
          </div>

          {/* Report Details View */}
          {activeSearchedReport && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 font-mono font-bold text-xs">
                      {activeSearchedReport.protocolNumber}
                    </span>
                    <button
                      onClick={() => handleCopyProtocol(activeSearchedReport.protocolNumber)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      title="Copiar Protocolo"
                    >
                      {copiedProtocol === activeSearchedReport.protocolNumber ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${UCOC_CATEGORY_INFO[activeSearchedReport.category]?.color || ''}`}>
                      {UCOC_CATEGORY_INFO[activeSearchedReport.category]?.badge || activeSearchedReport.category}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${UCOC_STATUS_INFO[activeSearchedReport.status]?.badgeColor}`}>
                    {UCOC_STATUS_INFO[activeSearchedReport.status]?.label}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeSearchedReport.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {new Date(activeSearchedReport.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      Parte Denunciada: <strong>@{activeSearchedReport.targetUsername}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Notificante: <strong>{activeSearchedReport.reporterName}</strong>
                    </span>
                    {activeSearchedReport.isAnonymousOrConfidential && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono text-[10px]">
                        <Lock size={10} />
                        Sigilo Ativo
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Descritivo */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Fase Atual do Processo: </strong>
                  {UCOC_STATUS_INFO[activeSearchedReport.status]?.description}
                </div>

                {/* Descrição e Evidências */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                      Descrição Circunstanciada
                    </h4>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                      {activeSearchedReport.description}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                      Provas & Evidências Juntadas
                    </h4>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                      {activeSearchedReport.evidenceText}
                    </div>
                  </div>
                </div>

                {/* URLs e Artigos Envolvidos */}
                {activeSearchedReport.involvedUrlsOrArticles && activeSearchedReport.involvedUrlsOrArticles.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Artigos e Links Vinculados:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeSearchedReport.involvedUrlsOrArticles.map((u, i) => (
                        <a
                          key={i}
                          href={formatExternalUrl(u)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:underline font-mono text-[11px] flex items-center gap-1 border border-blue-200 dark:border-blue-900"
                        >
                          <span>{u}</span>
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seção de Defesa Formal / Contraditório */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale size={16} className="text-blue-600" />
                    <span>Manifestação de Defesa da Parte Denunciada (Contraditório)</span>
                  </h3>
                  {activeSearchedReport.defenseSubmittedAt && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-mono text-[10px]">
                      Defesa Juntada em {new Date(activeSearchedReport.defenseSubmittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {activeSearchedReport.defenseStatement ? (
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {activeSearchedReport.defenseStatement}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                    <p>
                      A parte denunciada ainda não juntou manifestação de defesa formal aos autos.
                    </p>
                    {currentUser && currentUser.username?.toLowerCase() === activeSearchedReport.targetUsername.toLowerCase() ? (
                      <div className="space-y-3 pt-2">
                        <span className="font-bold text-xs text-purple-900 dark:text-purple-300">
                          Você foi identificado como a parte denunciada neste processo. Apresente seus esclarecimentos:
                        </span>
                        <textarea
                          value={defenseText}
                          onChange={(e) => setDefenseText(e.target.value)}
                          rows={4}
                          placeholder="Apresente aqui suas alegações de defesa, contextualização das edições, evidências contrárias ou pedido de conciliação..."
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                        />
                        <button
                          onClick={handleSubmitDefense}
                          disabled={submittingDefense || !defenseText.trim()}
                          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                        >
                          {submittingDefense ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                          <span>Juntar Defesa aos Autos</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Se você for o usuário <strong>@{activeSearchedReport.targetUsername}</strong>, faça login com sua conta para anexar sua resposta formal.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Parecer do Comitê UCoC & Sanções Aplicadas (se houver) */}
              {(activeSearchedReport.committeeResolution || activeSearchedReport.appliedSanctions) && (
                <div className="p-5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                  <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
                    <Gavel size={16} className="text-purple-600" />
                    <span>Deliberação Oficial e Sanções do Comitê UCoC</span>
                  </h3>
                  {activeSearchedReport.committeeResolution && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Parecer Fundamentado:</span>
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {activeSearchedReport.committeeResolution}
                      </div>
                    </div>
                  )}
                  {activeSearchedReport.appliedSanctions && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Sanções & Medidas Determinadas:</span>
                      <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-950 dark:text-rose-200 font-semibold leading-relaxed">
                        {activeSearchedReport.appliedSanctions}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Seção Administrativa de Gestão do Processo (Somente Moderadores / Administradores) */}
              {isStaff && (
                <div className="p-5 rounded-xl border-2 border-purple-400 dark:border-purple-700 bg-purple-50/30 dark:bg-slate-900 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Gavel size={16} className="text-purple-600" />
                      <span className="font-bold text-xs text-purple-950 dark:text-purple-200 uppercase font-mono">
                        Painel de Decisão do Comitê UCoC / Ouvidoria
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-600 text-white font-mono font-bold">
                      STAFF EXCLUSIVO
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Alterar Status do Processo
                      </label>
                      <select
                        value={adminStatusUpdate}
                        onChange={(e) => setAdminStatusUpdate(e.target.value as UcocReportStatus)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {(Object.keys(UCOC_STATUS_INFO) as UcocReportStatus[]).map((stKey) => (
                          <option key={stKey} value={stKey}>
                            {UCOC_STATUS_INFO[stKey].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Nota no Registro de Ações (Action Log)
                      </label>
                      <input
                        type="text"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Ex: Notificado o usuário via página de discussão com prazo de 72h."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Resolução / Parecer do Comitê UCoC
                    </label>
                    <textarea
                      value={adminResolutionText}
                      onChange={(e) => setAdminResolutionText(e.target.value)}
                      rows={3}
                      placeholder="Redija o parecer fundamentado da decisão do Comitê..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Sanções / Medidas Aplicadas (se procedente)
                    </label>
                    <input
                      type="text"
                      value={adminSanctionsText}
                      onChange={(e) => setAdminSanctionsText(e.target.value)}
                      placeholder="Ex: Advertência formal por Wikihounding + Restrição de edição em Ferrovias por 30 dias."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleUpdateProcessAdmin}
                      disabled={isUpdatingProcess}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                    >
                      {isUpdatingProcess ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      <span>Salvar Despacho e Atualizar Processo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Histórico de Ações (Action Logs) */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Clock size={14} className="text-purple-600" />
                  <span>Histórico de Tramitação e Despachos ({activeSearchedReport.actionLogs?.length || 0})</span>
                </h3>
                <div className="space-y-2">
                  {activeSearchedReport.actionLogs?.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                        <span>
                          {new Date(log.timestamp).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{log.note}</p>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                        Despachado por: {log.adminName} {log.adminRole ? `(${log.adminRole})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mensagens e Manifestações Instrutórias */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-blue-600" />
                  <span>Manifestações e Esclarecimentos nos Autos ({activeSearchedReport.comments?.length || 0})</span>
                </h3>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {activeSearchedReport.comments && activeSearchedReport.comments.length > 0 ? (
                    activeSearchedReport.comments.map((comm) => (
                      <div
                        key={comm.id}
                        className={`p-3 rounded-lg border text-xs space-y-1 ${
                          comm.isInternalNote
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                            : comm.isOfficialStatement
                            ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{comm.authorName}</span>
                            {comm.authorRole && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-[9px] font-mono">
                                {comm.authorRole}
                              </span>
                            )}
                            {comm.isInternalNote && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-600 text-white text-[9px] font-mono">
                                NOTA INTERNA STAFF
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(comm.timestamp).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {comm.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 py-2">
                      Nenhuma manifestação instrutória anexada até o momento.
                    </p>
                  )}
                </div>

                {/* Formulário de Manifestação */}
                {currentUser ? (
                  <form onSubmit={handleAddComment} className="pt-2 space-y-2">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      rows={2}
                      placeholder="Adicionar manifestação formal aos autos do processo..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      required
                    />
                    <div className="flex items-center justify-between">
                      {isStaff ? (
                        <label className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternalComment}
                            onChange={(e) => setIsInternalComment(e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span>Nota interna (visível somente para administradores)</span>
                        </label>
                      ) : (
                        <div />
                      )}

                      <button
                        type="submit"
                        disabled={submittingComment || !commentInput.trim()}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1"
                      >
                        {submittingComment ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                        <span>Anexar aos Autos</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 flex items-center justify-between">
                    <span>Faça login para adicionar esclarecimentos neste processo.</span>
                    {onLoginClick && (
                      <button
                        onClick={onLoginClick}
                        className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                      >
                        Entrar na conta
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CASES LIST (USER / STAFF DASHBOARD) */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-purple-600" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isStaff ? 'Quadro Geral de Processos UCoC em Tramitação' : 'Denúncias Vinculadas à Sua Conta'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Total de registros: <strong>{reports.length}</strong>
            </span>
          </div>

          {loadingReports ? (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-purple-600" />
              <span>Carregando dados processuais...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <Shield size={32} className="mx-auto text-slate-400" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nenhum processo UCoC encontrado
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isStaff
                  ? 'Nenhuma denúncia formal registrada sob o Código Universal de Conduta até o momento.'
                  : 'Sua conta não possui denúncias ativas registradas como denunciante ou denunciado.'}
              </p>
              <button
                onClick={() => setActiveTab('new-report')}
                className="mt-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                Protocolar Denúncia
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700 transition space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-700 dark:text-purple-300 text-xs">
                        {rep.protocolNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${UCOC_CATEGORY_INFO[rep.category]?.color}`}>
                        {UCOC_CATEGORY_INFO[rep.category]?.badge || rep.category}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${UCOC_STATUS_INFO[rep.status]?.badgeColor}`}>
                      {UCOC_STATUS_INFO[rep.status]?.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {rep.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                      {rep.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>Denunciado: <strong>@{rep.targetUsername}</strong></span>
                      <span>•</span>
                      <span>Notificante: <strong>{rep.reporterName}</strong></span>
                      <span>•</span>
                      <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveSearchedReport(rep);
                        setSearchProtocolInput(rep.protocolNumber);
                        setActiveTab('track');
                      }}
                      className="px-3 py-1 rounded bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold transition flex items-center gap-1"
                    >
                      <span>Visualizar Autos</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
