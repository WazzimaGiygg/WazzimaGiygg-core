import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  ExternalLink,
  Clock,
  Calendar,
  FileText,
  Filter,
  Network,
  Activity,
  Layers,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  UserX,
  UserCheck,
  Ban,
  MessageSquare,
  Download,
  Plus,
  RefreshCw,
  Eye,
  AlertOctagon,
  ArrowRight,
  Laptop,
  Globe,
  Info,
  Check,
  Trash2,
  X,
} from 'lucide-react';
import {
  UserProfile,
  SockpuppetCase,
  CheckUserLogEntry,
  CheckUserAccountDetails,
} from '../types';
import { StorageService } from '../services/storageService';

interface CheckUserViewProps {
  currentUser: UserProfile | null;
  initialTarget?: string;
  onNavigateToUser: (identifier: string, tab?: 'profile' | 'talk' | 'contributions' | 'admin') => void;
  onNavigateToArticle?: (id: string) => void;
  onBack?: () => void;
}

export const CheckUserView: React.FC<CheckUserViewProps> = ({
  currentUser,
  initialTarget = '',
  onNavigateToUser,
  onNavigateToArticle,
  onBack,
}) => {
  // Access control check (Moderators and Admins only)
  const isAuthorized =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'moderador' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const [activeTab, setActiveTab] = useState<'investigate' | 'cases' | 'logs' | 'policy'>('investigate');

  // Investigation Form State
  const [targetInput, setTargetInput] = useState<string>(initialTarget || 'Usuario_Suspeito');
  const [targetType, setTargetType] = useState<'username' | 'ip' | 'cidr'>('username');
  const [reasonPreset, setReasonPreset] = useState<string>('Suspeita de Evasão de Bloqueio e Criação de Contas Fantoches');
  const [customReason, setCustomReason] = useState<string>('');
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);

  // Investigation Results State
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [matchedAccounts, setMatchedAccounts] = useState<CheckUserAccountDetails[]>([]);
  const [relatedIps, setRelatedIps] = useState<string[]>([]);
  const [correlationScore, setCorrelationScore] = useState<number>(0);
  const [detectedSockpuppets, setDetectedSockpuppets] = useState<string[]>([]);
  const [evidenceNotes, setEvidenceNotes] = useState<string[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Cases & Logs State
  const [cases, setCases] = useState<SockpuppetCase[]>([]);
  const [logs, setLogs] = useState<CheckUserLogEntry[]>([]);
  const [caseFilterStatus, setCaseFilterStatus] = useState<string>('all');
  const [caseSearchQuery, setCaseSearchQuery] = useState<string>('');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [selectedCaseForModal, setSelectedCaseForModal] = useState<SockpuppetCase | null>(null);

  // New Case Modal State
  const [showNewCaseModal, setShowNewCaseModal] = useState<boolean>(false);
  const [newCaseTitle, setNewCaseTitle] = useState<string>('');
  const [newCaseMaster, setNewCaseMaster] = useState<string>('');
  const [newCaseSuspects, setNewCaseSuspects] = useState<string>('');
  const [newCaseEvidence, setNewCaseEvidence] = useState<string>('');

  // Flag Sockpuppet Modal State
  const [flagTargetUser, setFlagTargetUser] = useState<CheckUserAccountDetails | null>(null);
  const [flagMasterUsername, setFlagMasterUsername] = useState<string>('');

  const loadData = async () => {
    const [c, l] = await Promise.all([
      StorageService.getSockpuppetCases(),
      StorageService.getCheckUserLogs(),
    ]);
    setCases(c);
    setLogs(l);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle investigation run
  const handleRunInvestigation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetInput.trim()) {
      setFeedbackMessage({ text: 'Informe um nome de usuário, IP ou sub-rede para investigar.', type: 'error' });
      return;
    }

    const finalReason = reasonPreset === 'outros'
      ? (customReason.trim() || 'Investigação CheckUser com base no Art. 15 do Marco Civil da Internet')
      : reasonPreset;

    if (!finalReason.trim()) {
      setFeedbackMessage({ text: 'A justificativa de consulta CheckUser é obrigatória por lei e diretrizes.', type: 'error' });
      return;
    }

    setIsInvestigating(true);
    setFeedbackMessage(null);

    try {
      const activeUser: UserProfile = currentUser || {
        uid: 'user-admin-default',
        username: 'Administrador',
        displayName: 'Administrador',
        email: 'admin@wikizero.org',
        role: 'admin',
        isGuest: false,
        isBanned: false,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      const result = await StorageService.performCheckUserInvestigation(
        targetInput.trim(),
        targetType,
        finalReason,
        activeUser
      );

      setMatchedAccounts(result.matchedAccounts);
      setRelatedIps(result.relatedIps);
      setCorrelationScore(result.correlationScore);
      setDetectedSockpuppets(result.detectedSockpuppets);
      setEvidenceNotes(result.evidenceNotes);
      setHasSearched(true);

      // Refresh logs
      const updatedLogs = await StorageService.getCheckUserLogs();
      setLogs(updatedLogs);

      setFeedbackMessage({
        text: `Investigação concluída. ${result.matchedAccounts.length} conta(s) analisada(s). Log de auditoria gerado com sucesso.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      setFeedbackMessage({ text: 'Erro ao executar a consulta CheckUser.', type: 'error' });
    } finally {
      setIsInvestigating(false);
    }
  };

  // Flag account as sockpuppet
  const handleConfirmFlagSockpuppet = async () => {
    if (!flagTargetUser) return;
    const master = flagMasterUsername.trim() || targetInput.trim() || 'ContaMestre';

    await StorageService.flagAccountAsSockpuppet(flagTargetUser.uid, master, currentUser!);
    setFlagTargetUser(null);
    setFeedbackMessage({
      text: `A conta "${flagTargetUser.username}" foi marcada formalmente como fantoche (Sockpuppet) de "${master}" e bloqueada.`,
      type: 'success',
    });

    // Re-run search to refresh state
    handleRunInvestigation();
  };

  // Unflag account
  const handleUnflagSockpuppet = async (account: CheckUserAccountDetails) => {
    if (!confirm(`Deseja remover a marcação de fantoche e desbanir a conta "${account.username}"?`)) return;
    await StorageService.unflagAccountAsSockpuppet(account.uid, currentUser!);
    setFeedbackMessage({
      text: `Marcação de fantoche removida da conta "${account.username}".`,
      type: 'info',
    });
    handleRunInvestigation();
  };

  // Bulk ban all detected sockpuppets
  const handleBulkBanSockpuppets = async () => {
    const targetsToBan = (Array.isArray(matchedAccounts) ? matchedAccounts : [])
      .filter((a) => a && a.username !== targetInput && !a.isBanned)
      .map((a) => a.uid);

    if (targetsToBan.length === 0) {
      setFeedbackMessage({ text: 'Todas as contas secundárias identificadas já se encontram bloqueadas.', type: 'info' });
      return;
    }

    if (!confirm(`Confirma o bloqueio em massa de ${targetsToBan.length} conta(s) fantoche associadas a "${targetInput}"?`)) {
      return;
    }

    const count = await StorageService.bulkBanSockpuppets(
      targetsToBan,
      targetInput.trim(),
      `Bloqueio em massa de rede de fantoches associadas a ${targetInput}`,
      currentUser!
    );

    setFeedbackMessage({
      text: `${count} conta(s) fantoche foram bloqueadas em massa com sucesso.`,
      type: 'success',
    });
    handleRunInvestigation();
  };

  // Save new SPI Case
  const handleCreateNewCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim() || !newCaseMaster.trim()) {
      alert('Informe o título do caso e a conta mestre investigada.');
      return;
    }

    const caseNum = `SPI-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(cases.length + 1).padStart(2, '0')}`;
    const suspects = newCaseSuspects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newCase: SockpuppetCase = {
      id: 'case-' + Date.now(),
      caseNumber: caseNum,
      title: newCaseTitle.trim(),
      masterAccount: newCaseMaster.trim(),
      suspectedAccounts: suspects,
      status: 'aberto',
      evidenceSummary: newCaseEvidence.trim() || 'Abertura de dossiê de averiguação para coleta de evidências de rede e comportamento.',
      openedBy: currentUser?.displayName || currentUser?.username || 'Moderador',
      openedAt: new Date().toISOString(),
      similarityScore: 80,
      technicalMatches: {
        ipMatch: true,
        userAgentMatch: true,
        temporalMatch: false,
        stylisticMatch: true,
      },
    };

    await StorageService.saveSockpuppetCase(newCase);
    setShowNewCaseModal(false);
    setNewCaseTitle('');
    setNewCaseMaster('');
    setNewCaseSuspects('');
    setNewCaseEvidence('');
    loadData();
    setFeedbackMessage({ text: `Dossiê #${caseNum} criado com sucesso.`, type: 'success' });
  };

  // Export Investigation Dossier as JSON
  const handleExportDossier = () => {
    const data = {
      tipoRelatorio: 'Dossiê Técnico CheckUser - Investigação de Contas Múltiplas (Sockpuppets)',
      geradoEm: new Date().toISOString(),
      responsavel: currentUser?.displayName || currentUser?.username || 'Moderador',
      responsavelRole: currentUser?.role || 'admin',
      alvoInvestigado: targetInput,
      tipoConsulta: targetType,
      justificativaLegal: reasonPreset === 'outros' ? customReason : reasonPreset,
      indiceCorrelacaoRede: `${correlationScore}%`,
      contasRelacionadas: matchedAccounts,
      enderecosIpIdentificados: relatedIps,
      evidenciasColetadas: evidenceNotes,
      baseLegal: 'Lei nº 12.965/2014 (Marco Civil da Internet, Art. 15) & Lei nº 13.709/2018 (LGPD, Art. 7º, II e IX)',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CheckUser-Dossie-${targetInput.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Cases & Logs
  const filteredCases = useMemo(() => {
    const safeCases = Array.isArray(cases) ? cases : [];
    return safeCases.filter((c) => {
      if (!c) return false;
      const matchStatus = caseFilterStatus === 'all' || c.status === caseFilterStatus;
      const matchSearch =
        !caseSearchQuery.trim() ||
        (c.title || '').toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
        (c.caseNumber || '').toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
        (c.masterAccount || '').toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
        (Array.isArray(c.suspectedAccounts) && c.suspectedAccounts.some((s) => (s || '').toLowerCase().includes(caseSearchQuery.toLowerCase())));
      return matchStatus && matchSearch;
    });
  }, [cases, caseFilterStatus, caseSearchQuery]);

  const filteredLogs = useMemo(() => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    return safeLogs.filter((l) => {
      if (!l) return false;
      if (!logSearchQuery.trim()) return true;
      const clean = logSearchQuery.toLowerCase();
      return (
        (l.target || '').toLowerCase().includes(clean) ||
        (l.performedBy || '').toLowerCase().includes(clean) ||
        (l.reason || '').toLowerCase().includes(clean) ||
        (l.targetType || '').toLowerCase().includes(clean)
      );
    });
  }, [logs, logSearchQuery]);

  // If user is not authorized, render Wikipedia-style Restricted Access Gatekeeper
  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-xl p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <AlertOctagon size={28} />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                  Acesso Restrito • Special:CheckUser
                </span>
                <span className="text-xs text-slate-500 font-mono">Art. 15 Marco Civil / LGPD</span>
              </div>
              <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100">
                Verificador de Contas & Investigação de Fantoches (CheckUser)
              </h1>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                A ferramenta <strong>CheckUser</strong> é de uso estritamente restrito aos membros eleitos do corpo de
                <strong> Moderadores</strong> e <strong>Administradores</strong> da WikiWorldWeb.
              </p>
              
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Shield size={14} className="text-amber-600 dark:text-amber-400" />
                  Salvaguardas de Privacidade e Proteção de Dados:
                </div>
                <p>
                  Para assegurar o direito à privacidade dos colaboradores e a estrita observância da <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong> e do <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>, informações técnicas como endereços IP, sub-redes e impressões digitais de dispositivos (User-Agent) não são públicas e só podem ser consultadas mediante justa causa documentada para prevenção a abusos, fraudes e vandalismo.
                </p>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-700 transition flex items-center gap-1.5"
                  >
                    ← Voltar ao Início
                  </button>
                )}
                <button
                  onClick={() => onNavigateToUser('WazzimaGiygg', 'talk')}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium rounded-lg hover:bg-blue-100 transition flex items-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  Solicitar Verificação à Moderação (Dossiê SPI)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
              <span>Páginas Especiais</span>
              <span>/</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">Special:CheckUser</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                Moderadores & Burocratas
              </span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="text-purple-600 dark:text-purple-400" size={24} />
              Verificador de Contas (CheckUser & Detecção de Sockpuppets)
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Ferramenta oficial de investigação técnica e correlação de contas múltiplas (bonecos de meia / sockpuppets),
              evasão de bloqueios e auditoria de registros de conexão conforme o Marco Civil da Internet (Lei 12.965/2014).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewCaseModal(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus size={14} />
              Novo Dossiê SPI
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition"
              >
                Voltar
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-6 -mb-5 gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('investigate')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'investigate'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Search size={14} />
            <span>Investigação & Consulta</span>
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'cases'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>Casos & Dossiês SPI ({cases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'logs'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>Registro de Consultas / Logs ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('policy')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'policy'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Info size={14} />
            <span>Diretrizes & Marco Civil</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between shadow-xs transition ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : feedbackMessage.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' && <CheckCircle2 size={16} />}
            {feedbackMessage.type === 'error' && <AlertTriangle size={16} />}
            {feedbackMessage.type === 'info' && <Info size={16} />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {/* TAB 1: INVESTIGATION ENGINE */}
      {activeTab === 'investigate' && (
        <div className="space-y-6">
          {/* Investigation Search Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
              <Search size={16} className="text-purple-600 dark:text-purple-400" />
              Parâmetros da Consulta de Verificação CheckUser
            </h2>

            <form onSubmit={handleRunInvestigation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Target Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Alvo da Consulta:
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="username">Nome de Usuário (Conta / Alvo)</option>
                    <option value="ip">Endereço IP Exato (IPv4)</option>
                    <option value="cidr">Faixa de IP / Sub-rede (CIDR /24)</option>
                  </select>
                </div>

                {/* Target Input */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {targetType === 'username' ? 'Nome do Usuário Investigado:' : targetType === 'ip' ? 'Endereço IP (ex: 177.136.24.12):' : 'Faixa de Sub-rede (ex: 177.136.24.0/24):'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      placeholder={
                        targetType === 'username'
                          ? 'Ex: Usuario_Suspeito ou EditorSP'
                          : targetType === 'ip'
                          ? 'Ex: 177.136.24.12'
                          : 'Ex: 177.136.24.0/24'
                      }
                      className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Justification Reason (Mandatory under Wikipedia & LGPD/Marco Civil rules) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <span>Justificativa Obrigatória da Consulta (Registrada em Auditoria Imutável):</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">Art. 15 Marco Civil / SPI</span>
                </div>

                <select
                  value={reasonPreset}
                  onChange={(e) => setReasonPreset(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Suspeita de Evasão de Bloqueio e Criação de Contas Fantoches">
                    Suspeita de Evasão de Bloqueio e Criação de Contas Fantoches (Sockpuppets)
                  </option>
                  <option value="Guerra de Edição Coordenada e Vandalismo Cruzado">
                    Guerra de Edição Coordenada e Vandalismo Cruzado
                  </option>
                  <option value="Manipulação Ilícita de Consenso Editorial ou Votações">
                    Manipulação Ilícita de Consenso Editorial ou Votações
                  </option>
                  <option value="Disseminação Automatizada de Links Promocionais / Spam Comercial">
                    Disseminação Automatizada de Links Promocionais / Spam Comercial
                  </option>
                  <option value="Investigação Prévia referente a Dossiê Comunitário SPI">
                    Investigação Prévia referente a Dossiê Comunitário SPI
                  </option>
                  <option value="outros">Outra Justificativa Específica (digitar abaixo)...</option>
                </select>

                {reasonPreset === 'outros' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Descreva a razão técnica e editorial para a realização desta consulta CheckUser..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                )}
              </div>

              {/* Action Buttons & Preset Quick Links */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Exemplos rápidos:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('username');
                      setTargetInput('Usuario_Suspeito');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950 font-mono text-[11px]"
                  >
                    Usuario_Suspeito
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('username');
                      setTargetInput('Vandalo_Metro_Alt');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950 font-mono text-[11px]"
                  >
                    Vandalo_Metro_Alt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('cidr');
                      setTargetInput('177.136.24.0/24');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950 font-mono text-[11px]"
                  >
                    177.136.24.0/24
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isInvestigating}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2"
                >
                  {isInvestigating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Analisando Padrões & Redes...
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      Executar Consulta CheckUser
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Investigation Results */}
          {hasSearched && (
            <div className="space-y-6">
              {/* Correlation & Summary Banner */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Activity size={18} className="text-purple-600 dark:text-purple-400" />
                        Resultado da Análise Heurística de Redes & Conexões
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {matchedAccounts.length} conta(s) correlacionada(s)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Alvo consultado: <strong className="font-mono text-purple-700 dark:text-purple-300">{targetInput}</strong> ({targetType})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportDossier}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg font-medium transition flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      Exportar Dossiê (JSON)
                    </button>
                    {detectedSockpuppets.length > 0 && (
                      <button
                        onClick={handleBulkBanSockpuppets}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Ban size={14} />
                        Bloqueio em Massa de Fantoches
                      </button>
                    )}
                  </div>
                </div>

                {/* Score & Technical Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  {/* Probability Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-between">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Probabilidade de Sockpuppet:
                    </div>
                    <div className="my-2">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-3xl font-extrabold font-mono ${
                            correlationScore >= 80
                              ? 'text-red-600 dark:text-red-400'
                              : correlationScore >= 50
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {correlationScore}%
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {correlationScore >= 80 ? 'Confirmado / Crítico' : correlationScore >= 50 ? 'Suspeito' : 'Baixa Correlação'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            correlationScore >= 80 ? 'bg-red-500' : correlationScore >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${correlationScore}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Baseado em blocos IP, ASN e User-Agent.
                    </div>
                  </div>

                  {/* Matched IPs */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                      <Globe size={14} className="text-blue-500" />
                      IPs Únicos Identificados ({relatedIps.length}):
                    </div>
                    <div className="space-y-1 mt-2 max-h-24 overflow-y-auto">
                      {relatedIps.length > 0 ? (
                        relatedIps.map((ip) => (
                          <div key={ip} className="text-xs font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                            {ip}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">Nenhum IP compartilhado</span>
                      )}
                    </div>
                  </div>

                  {/* Evidence Notes */}
                  <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                      <FileText size={14} className="text-purple-500" />
                      Parecer & Evidências Técnicas Coletadas:
                    </div>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc pl-4 mt-2">
                      {evidenceNotes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Matched Accounts List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users size={16} className="text-purple-600 dark:text-purple-400" />
                  Contas Encontradas no Grafo de Conexão ({matchedAccounts.length})
                </h3>

                {matchedAccounts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500">
                    Nenhuma conta coincidente foi encontrada para os critérios informados.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matchedAccounts.map((account) => {
                      const isTargetAccount = account.username.toLowerCase() === targetInput.toLowerCase();
                      const hasSockpuppetFlag = account.isSockpuppet || (account as any).bio?.includes('{{Fantoche');

                      return (
                        <div
                          key={account.uid}
                          className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-xs transition ${
                            isTargetAccount
                              ? 'border-purple-300 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-950/10'
                              : hasSockpuppetFlag
                              ? 'border-red-200 dark:border-red-900/60 bg-red-50/10 dark:bg-red-950/10'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            {/* User Main Details */}
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                  {account.displayName || account.username}
                                </span>
                                <span className="text-xs font-mono text-slate-500">(@{account.username})</span>

                                {isTargetAccount && (
                                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                                    Alvo Principal da Consulta
                                  </span>
                                )}

                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono uppercase font-bold">
                                  Cargo: {account.role}
                                </span>

                                {account.isBanned && (
                                  <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-bold flex items-center gap-1">
                                    <Lock size={10} />
                                    Bloqueado
                                  </span>
                                )}

                                {hasSockpuppetFlag && (
                                  <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold flex items-center gap-1">
                                    <UserX size={10} />
                                    Fantoche Confirmado (Sockpuppet)
                                  </span>
                                )}
                              </div>

                              {account.sockpuppetOf && (
                                <div className="text-xs text-red-700 dark:text-red-300 font-medium">
                                  Identificado formalmente como boneco de meia de: <strong>@{account.sockpuppetOf}</strong>
                                </div>
                              )}

                              {/* Technical Details: IPs, ISP & User-Agents */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Globe size={13} className="text-blue-500" />
                                    Endereços IP & Provedores Registrados:
                                  </div>
                                  {account.ipAddresses.map((ip, i) => (
                                    <div key={i} className="font-mono text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                                      <div className="font-bold text-purple-700 dark:text-purple-300">{ip.ip}</div>
                                      <div className="text-[10px] text-slate-500">{ip.isp} • {ip.location}</div>
                                    </div>
                                  ))}
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Laptop size={13} className="text-emerald-500" />
                                    Impressão Digital do Dispositivo (User-Agent):
                                  </div>
                                  {account.userAgents.map((ua, i) => (
                                    <div key={i} className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                                      <div className="font-semibold">{ua.browser} • {ua.os}</div>
                                      <div className="text-[10px] text-slate-500 font-mono truncate" title={ua.raw}>{ua.raw}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Recent Edits in Articles */}
                              {account.editedArticles && account.editedArticles.length > 0 && (
                                <div className="text-xs pt-1">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">Edições Recentes nos Artigos: </span>
                                  {account.editedArticles.map((ed, i) => (
                                    <span key={i} className="inline-block mr-2 text-blue-600 dark:text-blue-400 font-medium">
                                      [[{ed.articleTitle}]] ({new Date(ed.timestamp).toLocaleDateString('pt-BR')})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Moderation Actions for this Account */}
                            <div className="flex flex-row lg:flex-col gap-2 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 lg:pl-4">
                              <button
                                onClick={() => onNavigateToUser(account.username, 'profile')}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium transition flex items-center gap-1.5"
                              >
                                <ExternalLink size={12} />
                                Ver Perfil
                              </button>

                              <button
                                onClick={() => onNavigateToUser(account.username, 'talk')}
                                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-xs font-medium hover:bg-blue-100 transition flex items-center gap-1.5"
                              >
                                <MessageSquare size={12} />
                                Discussão
                              </button>

                              {!hasSockpuppetFlag ? (
                                <button
                                  onClick={() => {
                                    setFlagTargetUser(account);
                                    setFlagMasterUsername(targetInput !== account.username ? targetInput : '');
                                  }}
                                  className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5"
                                >
                                  <UserX size={12} />
                                  Marcar Fantoche
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnflagSockpuppet(account)}
                                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-xs font-medium hover:bg-emerald-100 transition flex items-center gap-1.5"
                                >
                                  <UserCheck size={12} />
                                  Inocentar / Desmarcar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CASES / DOSSIERS SPI */}
      {activeTab === 'cases' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers size={18} className="text-purple-600 dark:text-purple-400" />
                  Dossiês de Investigação de Fantoches (SPI - Sockpuppet Investigations)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Processos comunitários de averiguação com registro de evidências e sanções editoriais.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={caseSearchQuery}
                  onChange={(e) => setCaseSearchQuery(e.target.value)}
                  placeholder="Buscar casos por conta ou número..."
                  className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />

                <select
                  value={caseFilterStatus}
                  onChange={(e) => setCaseFilterStatus(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="all">Todos os Status</option>
                  <option value="aberto">Abertos</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="confirmado">Confirmados & Sancionados</option>
                  <option value="arquivado_inocente">Arquivados (Inocentes)</option>
                </select>
              </div>
            </div>

            {/* Cases List */}
            <div className="space-y-3">
              {filteredCases.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                  Nenhum dossiê de investigação encontrado com os filtros atuais.
                </div>
              ) : (
                filteredCases.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {c.caseNumber}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.title}</h4>
                      </div>

                      <div>
                        {c.status === 'confirmado' && (
                          <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[11px]">
                            Confirmado & Sancionado
                          </span>
                        )}
                        {c.status === 'em_analise' && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                            Em Análise Técnica
                          </span>
                        )}
                        {c.status === 'aberto' && (
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                            Aberto / Em Coleta
                          </span>
                        )}
                        {c.status === 'arquivado_inocente' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                            Arquivado (Inocente)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Conta Mestre Alvo: </span>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono">@{c.masterAccount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Contas Suspeitas ({c.suspectedAccounts.length}): </span>
                        <span className="font-mono text-purple-700 dark:text-purple-300">
                          {c.suspectedAccounts.join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Aberto por: </span>
                        <span>{c.openedBy} ({new Date(c.openedAt).toLocaleDateString('pt-BR')})</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                      <strong>Resumo de Evidências:</strong> {c.evidenceSummary}
                    </p>

                    {c.conclusions && (
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <strong>Parecer Final:</strong> {c.conclusions}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Índice de Similaridade:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{c.similarityScore}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTargetType('username');
                            setTargetInput(c.masterAccount);
                            setActiveTab('investigate');
                            handleRunInvestigation();
                          }}
                          className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded hover:bg-purple-100 transition flex items-center gap-1 font-semibold"
                        >
                          <Search size={12} />
                          Verificar no CheckUser
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHECKUSER AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText size={18} className="text-purple-600 dark:text-purple-400" />
                  Registro de Consultas CheckUser (Logs de Auditoria Imutáveis)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Conforme a política de transparência da Wikimedia e LGPD, cada consulta realizada é gravada para auditoria da moderação.
                </p>
              </div>

              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Filtrar logs por alvo ou moderador..."
                className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Moderador</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Alvo Consultado</th>
                    <th className="p-3">Justificativa Oficial</th>
                    <th className="p-3 text-right">Resultados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{log.performedBy}</span>
                        <span className="text-[10px] text-slate-500 font-mono ml-1">({log.performedByRole})</span>
                      </td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                          {log.targetType}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300">
                        {log.target}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 max-w-md">
                        {log.reason}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {log.resultsFound}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: POLICIES & MARCO CIVIL */}
      {activeTab === 'policy' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6 text-xs text-slate-700 dark:text-slate-300">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="text-purple-600 dark:text-purple-400" size={20} />
              Diretrizes de Verificação de Contas (CheckUser Policy) & Marco Civil
            </h2>
            <p className="text-slate-500 mt-1">
              Normas obrigatórias de governança editorial, preservação de sigilo e conformidade jurídica.
            </p>
          </div>

          <div className="space-y-4 leading-relaxed">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">1. Princípio da Justa Causa & Proporcionalidade</h3>
            <p>
              O Verificador de Contas (CheckUser) <strong>não deve ser utilizado como instrumento de vigilância rotineira ou perseguição ideológica</strong>. Cada consulta exige justa causa demonstrável de infração às políticas da WikiWorldWeb, tais como:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Evasão de Bloqueio Editorial:</strong> Quando um usuário sancionado cria novas contas para burlar a decisão da comunidade.</li>
              <li><strong>Falsificação de Consenso (Sockpuppetry):</strong> Utilização de múltiplas identidades para simular apoio a uma versão em guerras de edição ou páginas de discussão.</li>
              <li><strong>Vandalismo e Ataques Cruzados:</strong> Inserção massiva de difamações ou spam promocional.</li>
            </ul>

            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">2. Conformidade com o Marco Civil da Internet (Lei nº 12.965/2014)</h3>
            <p>
              Em observância ao <strong>Art. 15 da Lei Federal nº 12.965/2014</strong>, a WikiWorldWeb mantém a guarda de registros de acesso a aplicações de internet sob estrito sigilo e ambiente controlado, com fins exclusivos de apuração de condutas ilícitas ou requisição judicial.
            </p>

            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">3. Conformidade com a LGPD (Lei nº 13.709/2018)</h3>
            <p>
              O tratamento de dados técnicos de conexão apoia-se nas bases legais do <strong>Artigo 7º, Incisos II (Cumprimento de Obrigação Legal) e IX (Legítimo Interesse e Segurança da Informação)</strong> da LGPD. Endereços IP e impressões digitais não são exibidos a usuários comuns ou visitantes.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: NEW SPI CASE */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus size={18} className="text-purple-600" />
                Abrir Novo Dossiê de Investigação (SPI)
              </h3>
              <button onClick={() => setShowNewCaseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewCase} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Título do Dossiê / Caso:</label>
                <input
                  type="text"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="Ex: Suspeita de Guerra de Edição em Transporte Urbano"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Conta Mestre (Principal):</label>
                <input
                  type="text"
                  value={newCaseMaster}
                  onChange={(e) => setNewCaseMaster(e.target.value)}
                  placeholder="Ex: Usuario_Suspeito"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Contas Suspeitas (separadas por vírgula):</label>
                <input
                  type="text"
                  value={newCaseSuspects}
                  onChange={(e) => setNewCaseSuspects(e.target.value)}
                  placeholder="Ex: Vandalo_Metro_Alt, ContaFantoche_99"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Resumo das Evidências / Padrão Observado:</label>
                <textarea
                  rows={3}
                  value={newCaseEvidence}
                  onChange={(e) => setNewCaseEvidence(e.target.value)}
                  placeholder="Descreva as coincidências de horários, artigos editados e motivos do pedido..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewCaseModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700"
                >
                  Criar Dossiê SPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FLAG AS SOCKPUPPET */}
      {flagTargetUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <UserX size={18} />
                Marcar Conta como Fantoche (Sockpuppet)
              </h3>
              <button onClick={() => setFlagTargetUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-3">
              <p>
                Você está prestes a classificar a conta <strong>@{flagTargetUser.username}</strong> formalmente como um
                fantoche (sockpuppet).
              </p>

              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-[11px] space-y-1">
                <div className="font-bold">Efeitos automáticos desta ação:</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Bloqueio permanente aplicado à conta.</li>
                  <li>Inserção da predefinição <code>{'{{Fantoche|ContaMestre}}'}</code> na biografia do usuário.</li>
                  <li>Envio de notificação oficial com aviso de bloqueio na página de discussão.</li>
                  <li>Gravação de log imutável de auditoria administrativa.</li>
                </ul>
              </div>

              <div>
                <label className="block font-semibold mb-1">Conta Mestre Associada:</label>
                <input
                  type="text"
                  value={flagMasterUsername}
                  onChange={(e) => setFlagMasterUsername(e.target.value)}
                  placeholder="Nome de usuário da conta principal (ex: Usuario_Suspeito)"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFlagTargetUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmFlagSockpuppet}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700"
              >
                Confirmar Marcação & Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
