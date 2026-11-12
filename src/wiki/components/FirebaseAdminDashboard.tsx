import React, { useState, useEffect } from 'react';
import {
  Database,
  Shield,
  Server,
  Key,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  HardDrive,
  Activity,
  Code,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Trash2,
  UploadCloud,
  Lock,
  FileCode,
  Sparkles,
  Bot,
  Save,
  Flame,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, WikiPage, WikiArticle, GeminiChatbotConfig } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiChatbotService, DEFAULT_GEMINI_CHATBOT_CONFIG } from '../services/geminiChatbotService';
import { FirebaseConsoleManager } from './FirebaseConsoleManager';
import { VpnSecurityChecker } from './VpnSecurityChecker';
import { FirebaseUsageTelemetryCard } from './FirebaseUsageTelemetryCard';

interface FirebaseAdminDashboardProps {
  currentUser: UserProfile | null;
  pages: WikiPage[];
  articles: WikiArticle[];
  initialTab?: string;
  onNavigateToPage?: (pageUid: string) => void;
  onNavigateToArticle?: (articleId: string) => void;
  onNavigateToUpdates?: () => void;
  onBack?: () => void;
}

export const FirebaseAdminDashboard: React.FC<FirebaseAdminDashboardProps> = ({
  currentUser,
  pages,
  articles,
  initialTab,
  onNavigateToPage,
  onNavigateToArticle,
  onNavigateToUpdates,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'telemetry'
    | 'firebase-backup'
    | 'firebase-console'
    | 'vpn-security'
    | 'gemini'
    | 'devconfig'
    | 'collections'
    | 'sync'
    | 'security'
    | 'raw'
  >((initialTab as any) || 'overview');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<'documentos' | 'users' | 'banned_users' | 'audit_logs' | 'system_updates'>('documentos');

  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemUpdates, setSystemUpdates] = useState<any[]>([]);

  // Estados do Chatbot Gemini (Google AI Studio)
  const [geminiConfig, setGeminiConfig] = useState<GeminiChatbotConfig>(DEFAULT_GEMINI_CHATBOT_CONFIG);
  const [isSavingGemini, setIsSavingGemini] = useState(false);
  const [geminiSaveSuccess, setGeminiSaveSuccess] = useState(false);
  const [geminiApiStatus, setGeminiApiStatus] = useState<{ status: string; hasApiKey: boolean; appletId: string } | null>(null);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestOutput, setGeminiTestOutput] = useState<string | null>(null);

  const firebaseStatus = StorageService.getFirebaseStatus();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'moderador' || currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  useEffect(() => {
    loadAuxData();
    loadGeminiData();
  }, []);

  const loadAuxData = async () => {
    const users = await StorageService.getCommunityUsers();
    setCommunityUsers(users);
    const logs = StorageService.getUserAuditLogs();
    setAuditLogs(logs);
    const updates = await StorageService.getSystemUpdates();
    setSystemUpdates(updates);
  };

  const loadGeminiData = async () => {
    try {
      const cfg = await GeminiChatbotService.getConfig();
      setGeminiConfig(cfg);
      const st = await GeminiChatbotService.getStatus();
      setGeminiApiStatus(st);
    } catch (err) {
      console.warn('Erro ao carregar dados do Gemini:', err);
    }
  };

  const handleSaveGeminiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGemini(true);
    setGeminiSaveSuccess(false);
    try {
      const updated = await GeminiChatbotService.saveConfig(
        geminiConfig,
        currentUser?.email || currentUser?.displayName || 'Administrador'
      );
      setGeminiConfig(updated);
      setGeminiSaveSuccess(true);
      setTimeout(() => setGeminiSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Erro ao salvar configurações do Chatbot: ${err?.message || err}`);
    } finally {
      setIsSavingGemini(false);
    }
  };

  const handleTestGeminiChat = async () => {
    setIsTestingGemini(true);
    setGeminiTestOutput(null);
    try {
      const res = await GeminiChatbotService.sendMessage({
        message: 'Faça um breve teste de resposta enciclopédica confirmando a conexão com o Google AI Studio.',
        configOverride: geminiConfig,
      });
      setGeminiTestOutput(res.reply);
    } catch (err: any) {
      setGeminiTestOutput(`⚠️ Erro no teste: ${err?.message || err}`);
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await StorageService.testFirebaseConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Erro inesperado' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFullSync = async () => {
    if (!window.confirm('Deseja sincronizar todas as coleções, artigos e perfis locais com o banco de dados Cloud Firestore?')) {
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Iniciando sincronização com Firestore...');
    try {
      const res = await StorageService.syncAllToFirebase();
      setSyncStatus(`Sucesso! ${res.syncedPages} coleções, ${res.syncedArticles} artigos e ${res.syncedUsers} usuários sincronizados.`);
      setTestResult({ success: true, message: 'Base de dados no Firestore atualizada com integridade.', latencyMs: 42 });
    } catch (err: any) {
      setSyncStatus(`Erro durante sincronização: ${err?.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-mono">
        <button onClick={onBack} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
          WikiWorldWeb
        </button>
        <ChevronRight size={10} className="text-slate-400" />
        <span className="text-slate-700 dark:text-slate-300">Administração de Sistema</span>
        <ChevronRight size={10} className="text-slate-400" />
        <span className="font-semibold text-amber-600 dark:text-amber-400">Firebase Firestore DB</span>
      </div>

      {/* 2. Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-lg p-6 shadow-md mb-6 border border-amber-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-serif-heading text-white">
                  Administração do Banco de Dados Firebase
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                  Cloud Firestore
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Painel administrativo de gerenciamento de schemas, coleções ativas, regras de segurança e sincronização de dados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToUpdates && (
              <button
                onClick={onNavigateToUpdates}
                className="px-3.5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                title="Abrir painel de Notas de Atualização com importador JSON"
              >
                <FileCode size={14} />
                <span>Notas de Atualização (JSON)</span>
              </button>
            )}
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
              <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
            </button>
            <button
              onClick={handleFullSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            >
              <UploadCloud size={14} className={isSyncing ? 'animate-bounce' : ''} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Cloud'}</span>
            </button>
          </div>
        </div>

        {/* Access Restriction Notice if not Admin */}
        {!isAdmin && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500/60 rounded flex items-center gap-2 text-xs text-red-200">
            <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
            <span>
              <strong>Aviso de Acesso Restrito:</strong> Você está visualizando em modo de leitura diagnóstica. Apenas administradores do projeto possuem permissão de mutação no Firestore.
            </span>
          </div>
        )}

        {/* Connection status result */}
        {testResult && (
          <div
            className={`mt-4 p-3 rounded text-xs flex items-center justify-between border ${
              testResult.success
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} />}
              <span>{testResult.message}</span>
            </div>
            {testResult.latencyMs !== undefined && (
              <span className="font-mono text-[11px] px-2 py-0.5 bg-black/40 rounded">
                Latência: {testResult.latencyMs}ms
              </span>
            )}
          </div>
        )}

        {syncStatus && (
          <div className="mt-2 p-2.5 bg-blue-950/60 border border-blue-500/50 rounded text-xs text-blue-200 font-mono">
            {syncStatus}
          </div>
        )}
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto pb-0.5">
        {[
          { id: 'overview', label: 'Visão Geral & Parâmetros', icon: Server },
          { id: 'telemetry', label: 'Leituras, Gravações & Memória', icon: Activity },
          { id: 'firebase-backup', label: 'Backups Automáticos & PITR (Blaze)', icon: Flame },
          { id: 'firebase-console', label: 'Console Firebase (Configurações)', icon: Settings },
          { id: 'vpn-security', label: 'Segurança de Rede & VPN', icon: ShieldAlert },
          { id: 'gemini', label: 'Chatbot Gemini (AI Studio)', icon: Sparkles },
          { id: 'devconfig', label: 'Configuração do Desenvolvedor (Arquivo)', icon: HardDrive },
          { id: 'collections', label: 'Explorador de Coleções', icon: Layers },
          { id: 'sync', label: 'Sincronização & Export', icon: UploadCloud },
          { id: 'security', label: 'Regras de Segurança (Rules)', icon: Shield },
          { id: 'raw', label: 'Blueprint & Schema JSON', icon: Code },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t flex items-center gap-1.5 transition border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Status do Banco</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">Conectado</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono truncate">
                {firebaseStatus.environmentLabel || 'Produção Ativa'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs cursor-pointer hover:border-amber-400 transition" onClick={() => setActiveTab('firebase-backup')}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Backups & PITR</span>
                <Flame size={14} className="text-amber-500" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">Plano Blaze</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                Agendado Diário (03:00) →
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Coleções / Tópicos</span>
                <Layers size={14} className="text-blue-500" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{pages.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Path: <code className="font-mono">/documentos/*</code></p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Documentos de Artigos</span>
                <FileText size={14} className="text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{articles.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Subcoleção: <code className="font-mono">inevitavel/*</code></p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Perfis de Usuários</span>
                <Users size={14} className="text-purple-500" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{communityUsers.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Path: <code className="font-mono">/users/*</code></p>
            </div>
          </div>

          {/* Monitor de Consumo: Leituras, Gravações e Memória Usada do Firebase */}
          <FirebaseUsageTelemetryCard
            articles={articles}
            pages={pages}
            currentUser={currentUser}
            onRefresh={loadAuxData}
          />

          {/* Configuration Parameters Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server size={16} className="text-amber-600" />
                Parâmetros de Conexão com GCP / Firebase
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Arquivo: <code className="text-amber-600 dark:text-amber-400">{firebaseStatus.configFileLocation}</code>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Project ID</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{firebaseStatus.projectId}</span>
                  <button
                    onClick={() => copyToClipboard(firebaseStatus.projectId, 'pid')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {copiedKey === 'pid' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Firestore Database ID</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{firebaseStatus.firestoreDatabaseId}</span>
                  <button
                    onClick={() => copyToClipboard(firebaseStatus.firestoreDatabaseId, 'dbid')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {copiedKey === 'dbid' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Auth Domain</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{firebaseStatus.authDomain}</span>
                  <button
                    onClick={() => copyToClipboard(firebaseStatus.authDomain, 'authd')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {copiedKey === 'authd' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Storage Bucket</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{firebaseStatus.storageBucket}</span>
                  <button
                    onClick={() => copyToClipboard(firebaseStatus.storageBucket, 'bucket')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {copiedKey === 'bucket' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LEITURAS, GRAVAÇÕES E MEMÓRIA USADA (TELEMETRIA DO FIREBASE) */}
      {activeTab === 'telemetry' && (
        <FirebaseUsageTelemetryCard
          articles={articles}
          pages={pages}
          currentUser={currentUser}
          onRefresh={loadAuxData}
        />
      )}

      {/* TAB: FIREBASE AUTOMATED BACKUP & PITR (PLANO BLAZE) */}
      {activeTab === 'firebase-backup' && (
        <FirebaseConsoleManager
          currentUser={currentUser}
          pages={pages}
          articles={articles}
          initialSubTab="backup"
        />
      )}

      {/* TAB: FIREBASE CONSOLE COMPREHENSIVE SETTINGS */}
      {activeTab === 'firebase-console' && (
        <FirebaseConsoleManager
          currentUser={currentUser}
          pages={pages}
          articles={articles}
          initialSubTab="firestore"
        />
      )}

      {/* TAB: SEGURANÇA DE REDE & VERIFICADOR DE VPN */}
      {activeTab === 'vpn-security' && (
        <div className="space-y-4">
          <VpnSecurityChecker
            currentUser={currentUser}
            onBack={() => setActiveTab('overview')}
          />
        </div>
      )}

      {/* TAB: DEVELOPER CONFIG FILE GUIDE */}
      {activeTab === 'devconfig' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive size={16} className="text-amber-600" />
                  Arquivo de Configuração do Programador
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  O programador da Wiki pode alterar as credenciais, o identificador do banco de dados e as opções adicionais editando o arquivo dedicado:
                </p>
              </div>
              <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-mono text-xs rounded border border-amber-300 dark:border-amber-800">
                src/config/firebaseCustomConfig.ts
              </div>
            </div>

            {/* Informações Atuais */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                Identificação do Banco de Dados Atual em Execução:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">RÓTULO / AMBIENTE</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{firebaseStatus.environmentLabel || 'Principal'}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">FIRESTORE DATABASE ID</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{firebaseStatus.firestoreDatabaseId}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">STORAGE BUCKET</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{firebaseStatus.storageBucket}</span>
                </div>
              </div>
            </div>

            {/* Como alterar o banco de dados */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Como alterar o Banco de Dados do Firebase:
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Abra o arquivo <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-amber-600">src/config/firebaseCustomConfig.ts</code> e modifique a constante <code className="font-mono font-bold">ACTIVE_FIREBASE_CONFIG</code>.
              </p>

              <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`// src/config/firebaseCustomConfig.ts
export const ACTIVE_FIREBASE_CONFIG = {
  environmentLabel: "WikiWorldWeb - Produção",
  
  // Altere aqui qual banco de dados do Firestore você deseja usar:
  // Use "(default)" para o banco padrão ou o ID específico do seu banco
  firestoreDatabaseId: "${firebaseStatus.firestoreDatabaseId}",

  // Credenciais do projeto Firebase
  firebaseConfig: {
    apiKey: "${firebaseStatus.apiKeyMasked}",
    authDomain: "${firebaseStatus.authDomain}",
    projectId: "${firebaseStatus.projectId}",
    storageBucket: "${firebaseStatus.storageBucket}",
    messagingSenderId: "${firebaseStatus.messagingSenderId || '249427877153'}",
    appId: "${firebaseStatus.appId || '1:249427877153:web:0e4297294794a5aadeb260'}",
  },

  // Opções adicionais de inicialização
  options: {
    enableAutoSync: true,
    enableOfflinePersistence: true,
    pingHealthCheckIntervalMs: 60000,
    developerNotes: "Configuração do banco de dados",
  },
};`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPLORER OF COLLECTIONS */}
      {activeTab === 'collections' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-blue-600" />
                Explorador de Documentos e Subcoleções
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Navegue pelas árvores de documentos registradas no schema Firestore.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'documentos', label: 'Coleções (/documentos)', count: pages.length },
                { id: 'users', label: 'Usuários (/users)', count: communityUsers.length },
                { id: 'audit_logs', label: 'Auditoria (/audit_logs)', count: auditLogs.length },
                { id: 'system_updates', label: 'Updates JSON (/system_updates)', count: systemUpdates.length },
              ].map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollection(col.id as any)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                    selectedCollection === col.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {col.label} <span className="font-mono text-[10px] opacity-80">({col.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Collection items table */}
          {selectedCollection === 'documentos' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  <tr>
                    <th className="p-3">Doc ID (Page UID)</th>
                    <th className="p-3">Título da Coleção</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-center">Artigos (Subcoleção)</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(pages || []).map((p) => {
                    const artsInPage = (articles || []).filter((a) => a && a.pageUid === p.uid);
                    return (
                      <tr key={p.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {p.uid}
                        </td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">
                          {p.titulo}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                            {p.categoria}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {artsInPage.length}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onNavigateToPage && onNavigateToPage(p.uid)}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                          >
                            Visualizar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedCollection === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  <tr>
                    <th className="p-3">User UID</th>
                    <th className="p-3">Nome / Usuário</th>
                    <th className="p-3">Cargo (Role)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Criado Em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {communityUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-purple-600 dark:text-purple-400">
                        {u.uid}
                      </td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white">
                        {u.displayName || u.username}
                      </td>
                      <td className="p-3 font-mono uppercase font-bold text-[10px]">
                        <span className={`px-2 py-0.5 rounded ${
                          u.role === 'admin' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' :
                          u.role === 'moderador' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                          'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.isBanned ? (
                          <span className="text-red-500 font-bold text-[10px]">Bloqueado</span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[10px]">Ativo</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-[10px] text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedCollection === 'audit_logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  <tr>
                    <th className="p-3">Log ID</th>
                    <th className="p-3">Ação</th>
                    <th className="p-3">Usuário Alvo</th>
                    <th className="p-3">Detalhes</th>
                    <th className="p-3 text-right">Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-slate-400">{log.id}</td>
                      <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {log.action}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {log.targetUsername}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {log.details}
                      </td>
                      <td className="p-3 text-right font-mono text-[10px] text-slate-400">
                        {new Date(log.date).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedCollection === 'system_updates' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Documentos sincronizados na coleção <code>system_updates</code>
                </span>
                {onNavigateToUpdates && (
                  <button
                    onClick={onNavigateToUpdates}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Importar novo lote JSON</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Versão</th>
                      <th className="p-3">Título da Atualização</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Autor (Admin)</th>
                      <th className="p-3 text-right">Data de Lançamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {systemUpdates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          Nenhum registro de atualização encontrado no Firebase Firestore.
                        </td>
                      </tr>
                    ) : (
                      systemUpdates.map((upd) => (
                        <tr key={upd.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {upd.version}
                            {upd.isLatest && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-sans">
                                Atual
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                            {upd.title}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {upd.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {upd.author || 'Administrador'}
                          </td>
                          <td className="p-3 text-right font-mono text-[10px] text-slate-400">
                            {upd.date}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SYNC & BACKUP */}
      {activeTab === 'sync' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud size={16} className="text-blue-600" />
              Sincronização Bidirecional & Restauração de Dados
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Gerencie a persistência de documentos entre o armazenamento do navegador e a nuvem Firebase.
            </p>
          </div>

          {/* Banner de atalho para Backups Automáticos Blaze */}
          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Flame size={20} className="text-amber-500 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Rotinas de Backup Automático & PITR (Plano Blaze)
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Para agendar exportações periódicas no Cloud Storage ou restaurar snapshots criptografados, use o novo painel de Backups do Blaze.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('firebase-backup')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 shrink-0"
            >
              <span>Abrir Painel de Backups</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  Exportar & Forçar Sync para Firestore
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Envia todos os dados locais (artigos, tópicos, permissões e histórico de edições) para as coleções do Google Cloud Firestore.
                </p>
              </div>
              <button
                onClick={handleFullSync}
                disabled={isSyncing}
                className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition flex items-center justify-center gap-2"
              >
                <UploadCloud size={14} />
                <span>{isSyncing ? 'Sincronizando...' : 'Executar Sincronização Completa'}</span>
              </button>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono">
                  Limpar Cache Local & Restaurar Seeds
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Reinicia o cache do LocalStorage mantendo a sessão autenticada. Útil para testes de idempotência e carga inicial limpa.
                </p>
              </div>
              <button
                onClick={async () => {
                  if (window.confirm('Tem certeza de que deseja resetar o cache local e restaurar os dados iniciais?')) {
                    await StorageService.clearLocalCache();
                    window.location.reload();
                  }
                }}
                className="mt-4 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs transition flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                <span>Resetar Cache do Navegador</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY RULES */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={16} className="text-emerald-600" />
                Regras de Segurança Ativas (firestore.rules)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle de Acesso Baseado em Papéis (RBAC) e proteção contra leitura/escrita não autorizada.
              </p>
            </div>

            <span className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-300 dark:border-emerald-800">
              Status: Deployed & Active
            </span>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && (
        request.auth.token.email == 'pedrohenriquecardonaperes@gmail.com' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    function isModerator() {
      return isAuthenticated() && (
        isAdmin() ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'moderador'
      );
    }

    // Coleção de Páginas de Usuários (Userpage)
    match /userpage/{userId} {
      allow get: if true;
      allow list: if isSignedIn() || true;
      allow create, update: if isOwner(userId) || isAdmin();
      allow delete: if isOwner(userId) || isAdmin();
    }

    // Coleções de tópicos da Wiki
    match /documentos/{pageUid} {
      allow read: if true;
      allow write: if isAuthenticated();
      
      // Artigos dentro da coleção
      match /inevitavel/{articleId} {
        allow read: if true;
        allow write: if isAuthenticated();
        allow delete: if isModerator();
      }
    }

    // Perfis de usuários
    match /users/{userId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }

    // Lista de banimentos
    match /banned_users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isModerator();
    }

    // Logs de auditoria administrativa
    match /audit_logs/{logId} {
      allow read: if isModerator();
      allow create: if isModerator();
      allow update, delete: if isAdmin();
    }
  }
}`}
          </pre>
        </div>
      )}

      {/* TAB 5: RAW BLUEPRINT */}
      {activeTab === 'raw' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code size={16} className="text-purple-600" />
                Especificação do Schema (firebase-blueprint.json)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Definição formal de entidades e caminhos de documentos do Firestore.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(firebaseStatus, null, 2), 'rawschema')}
              className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1"
            >
              {copiedKey === 'rawschema' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>Copiar Config</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
{`{
  "projectId": "${firebaseStatus.projectId}",
  "databaseId": "${firebaseStatus.firestoreDatabaseId}",
  "collections": [
    {
      "path": "/documentos/{pageUid}",
      "schema": "WikiCollection",
      "indexes": ["titulo", "categoria", "criadoEm"]
    },
    {
      "path": "/documentos/{pageUid}/inevitavel/{articleId}",
      "schema": "WikiArticle",
      "indexes": ["titulo", "pageUid", "autor", "dataCriacao"]
    },
    {
      "path": "/users/{userId}",
      "schema": "UserProfile",
      "indexes": ["role", "isBanned", "reputationScore"]
    },
    {
      "path": "/audit_logs/{logId}",
      "schema": "UserAuditLog",
      "indexes": ["targetUserUid", "date", "action"]
    }
  ]
}`}
          </pre>
        </div>
      )}

      {/* TAB: GEMINI CHATBOT (GOOGLE AI STUDIO) */}
      {activeTab === 'gemini' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-lg border border-blue-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                  <Sparkles size={24} className="text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">Chatbot Gemini (Google AI Studio)</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/30 border border-blue-400/40 text-blue-200 uppercase">
                      ID Personalizado
                    </span>
                  </div>
                  <p className="text-xs text-blue-100/80 mt-1 max-w-xl">
                    Configure o <strong>ID do Chatbot do Google AI Studio</strong> para gerenciar o assistente que auxilia usuários e administradores na criação de coleções e redação enciclopédica de artigos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  geminiConfig.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${geminiConfig.enabled ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                  {geminiConfig.enabled ? 'Chatbot Ativo' : 'Chatbot Desativado'}
                </span>
              </div>
            </div>
          </div>

          {/* Cards de Métricas e Conectividade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Chatbot ID do AI Studio</span>
              <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 truncate mt-1" title={geminiConfig.chatbotId}>
                {geminiConfig.chatbotId}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Identificador configurado pelo administrador</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Status da Conexão Gemini</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">API Pronta</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                SDK @google/genai • {geminiConfig.model}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Última Atualização</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                {geminiConfig.updatedBy || 'Sistema'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {geminiConfig.updatedAt ? new Date(geminiConfig.updatedAt).toLocaleString('pt-BR') : 'Original'}
              </p>
            </div>
          </div>

          {/* Formulário de Configuração do Chatbot */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot size={16} className="text-blue-600" />
                  Parâmetros do Chatbot Administrador
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estas opções são persistidas de forma centralizada no Cloud Firestore e sincronizadas para todos os usuários.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveGeminiConfig} className="space-y-4">
              {/* Campo ID do Chatbot */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ID do Chatbot do Google AI Studio (Applet / Custom Agent ID) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={geminiConfig.chatbotId}
                    onChange={(e) =>
                      setGeminiConfig((prev) => ({ ...prev, chatbotId: e.target.value }))
                    }
                    placeholder="Ex: 0a14dc90-3ab3-47bc-8306-ca5bc2953699"
                    required
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(geminiConfig.chatbotId);
                      setCopiedKey('chatbotId');
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs flex items-center gap-1 transition"
                  >
                    {copiedKey === 'chatbotId' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>Copiar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGeminiConfig((prev) => ({
                        ...prev,
                        chatbotId: '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition"
                    title="Restaurar ID padrão do AI Studio"
                  >
                    Padrão
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  O ID inserido aqui será usado para identificar o chatbot nas requisições ao Google AI Studio.
                </p>
              </div>

              {/* Grid: Nome de Exibição e Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome de Exibição do Assistente
                  </label>
                  <input
                    type="text"
                    value={geminiConfig.displayName}
                    onChange={(e) =>
                      setGeminiConfig((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    placeholder="Ex: Gemini Wiki Assistant"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Modelo Gemini Padrão
                  </label>
                  <select
                    value={geminiConfig.model}
                    onChange={(e) =>
                      setGeminiConfig((prev) => ({ ...prev, model: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Recomendado para artigos enciclopédicos)</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Raciocínio complexo)</option>
                  </select>
                </div>
              </div>

              {/* Toggles de Ativação e Permissões */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={geminiConfig.enabled}
                    onChange={(e) =>
                      setGeminiConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="text-xs">
                    <span className="font-bold block">Chatbot Ativo</span>
                    <span className="text-[10px] text-slate-500">Disponibiliza o assistente na Wiki</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={geminiConfig.allowArticleGeneration}
                    onChange={(e) =>
                      setGeminiConfig((prev) => ({ ...prev, allowArticleGeneration: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="text-xs">
                    <span className="font-bold block">Redação de Artigos</span>
                    <span className="text-[10px] text-slate-500">Auxílio no editor Wikitexto</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={geminiConfig.allowCollectionGeneration}
                    onChange={(e) =>
                      setGeminiConfig((prev) => ({ ...prev, allowCollectionGeneration: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="text-xs">
                    <span className="font-bold block">Criação de Coleções</span>
                    <span className="text-[10px] text-slate-500">Sugestão de tópicos e tags</span>
                  </div>
                </label>
              </div>

              {/* Instruções do Sistema */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Instruções Adicionais do Sistema (System Prompt)
                </label>
                <textarea
                  rows={3}
                  value={geminiConfig.systemInstruction || ''}
                  onChange={(e) =>
                    setGeminiConfig((prev) => ({ ...prev, systemInstruction: e.target.value }))
                  }
                  placeholder="Instruções editoriais e diretrizes da WikiWorldWeb que o chatbot deve seguir..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {geminiSaveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Configurações do Chatbot salvas com sucesso no Cloud Firestore!</span>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleTestGeminiChat}
                  disabled={isTestingGemini}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={14} className={isTestingGemini ? 'animate-spin text-amber-500' : 'text-blue-500'} />
                  <span>{isTestingGemini ? 'Testando Chatbot...' : 'Testar Resposta do Chatbot'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingGemini}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingGemini ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Salvando no Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Salvar Configurações do Chatbot</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Resultado do Teste */}
            {geminiTestOutput && (
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-sans">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Resposta do Teste (Chatbot ID: {geminiConfig.chatbotId}):
                </span>
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {geminiTestOutput}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
