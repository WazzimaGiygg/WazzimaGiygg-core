import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Puzzle,
  Shield,
  Crown,
  Search,
  CheckCircle2,
  XCircle,
  Power,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  Code,
  Sliders,
  Layers,
  Info,
  Clock,
  BookOpen,
  Sigma,
  FileCode,
  Layout,
  AlertTriangle,
  Lock,
  Unlock,
  Activity,
  History,
  Download,
  Filter,
  Eye,
  Check,
  Zap,
  Sparkles,
  Upload,
  FileText,
  Settings,
  Play,
  Palette,
  Tag,
  Terminal,
  Wrench,
  Copy,
  ChevronRight,
  Maximize2,
  Cloud,
  CloudOff,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  ArrowUpRight,
  Database,
  HardDrive,
  Globe,
  FileDown,
  MessageSquare,
  Award,
  Wifi,
  WifiOff,
  GitBranch,
} from 'lucide-react';
import {
  getSqlDatabaseBackupConfig,
  updateSqlDatabaseBackupConfig,
  generateSqlDumpScript,
  downloadSqlBackupFile,
  SqlDatabaseBackupConfig,
} from '../extensions/sql-database-backup/config';
import {
  getFirebaseAppletImporterConfig,
  updateFirebaseAppletImporterConfig,
  fetchFirebaseAppletConfigFromRegisteredSite,
  triggerDownloadAppletConfigFile,
  applyImportedFirebaseConfig,
  FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG,
  ImportFetchResult,
  FirebaseAppletConfigImporterSettings,
} from '../extensions/firebase-applet-config-importer/config';
import ExtensionsSecurityAuditorExtension, {
  SecurityAuditReport,
} from '../extensions/extensions-security-auditor';
import {
  UserProfile,
  InstalledExtensionMeta,
  ExtensionCategory,
  ExtensionActionLog,
  CustomWikitextTagRule,
  CustomToolConfig,
  CustomThemeConfig,
  CustomEditorPluginConfig,
  CustomArticleBannerConfig,
  CustomContentFilterRule,
  CustomToolInputField,
  ExtensionSettingField,
  ExtensionConflict,
  ExtensionSyncStatus,
} from '../types';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';
import { StorageService } from '../services/storageService';
import {
  FirebaseExtensionSyncService,
  SyncStateStatus,
} from '../services/firebaseExtensionSyncService';
import { ExtensionSyncSecurityModal } from './ExtensionSyncSecurityModal';
import { ExtensionMalwareScannerModal } from './ExtensionMalwareScannerModal';
import { extensionSyncSecurityDevice } from '../services/extensionSyncSecurityDevice';
import { extensionMalwareScannerDevice } from '../services/extensionMalwareScannerDevice';
import { siteAutoUpdateService } from '../services/siteAutoUpdateService';
import {
  OnlineStatusExtension,
  OnlineStatusExtensionState,
} from '../core/extensions/OnlineStatusExtension';
import { ConnectivityStatusTooltip } from './ConnectivityStatusTooltip';

interface AdminExtensionsManagementViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser?: (username: string) => void;
  onBack?: () => void;
}

export const AdminExtensionsManagementView: React.FC<AdminExtensionsManagementViewProps> = ({
  currentUser,
  onNavigateToUser,
  onBack,
}) => {
  const extensionManager = ExtensionManager.getInstance();

  const [extensions, setExtensions] = useState<InstalledExtensionMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'core' | 'custom'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Modais de Controle
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showHooksModal, setShowHooksModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showConflictsModal, setShowConflictsModal] = useState<boolean>(false);
  const [showSecurityLayersModal, setShowSecurityLayersModal] = useState<boolean>(false);
  const [inspectingExtension, setInspectingExtension] = useState<InstalledExtensionMeta | null>(null);
  const [editingSettingsExtension, setEditingSettingsExtension] = useState<InstalledExtensionMeta | null>(null);
  const [extensionToDelete, setExtensionToDelete] = useState<InstalledExtensionMeta | null>(null);

  // 4.1.1.1GZ.8: Extensão OnlineStatusExtension e Monitor de Conectividade com GitHub
  const onlineStatusExt = OnlineStatusExtension.getInstance();
  const [onlineStatusData, setOnlineStatusData] = useState<OnlineStatusExtensionState>(() =>
    onlineStatusExt.getState()
  );
  const [isTestingGithubConnection, setIsTestingGithubConnection] = useState<boolean>(false);
  const [manualGithubTestResult, setManualGithubTestResult] = useState<string | null>(null);

  // 3.05.3.aa: Modal e Gerenciamento de Backup Geral SQL Nativo
  const [showSqlBackupModal, setShowSqlBackupModal] = useState<boolean>(false);
  const [sqlBackupConfig, setSqlBackupConfig] = useState<SqlDatabaseBackupConfig>(() => getSqlDatabaseBackupConfig());
  const [sqlDumpPreview, setSqlDumpPreview] = useState<string | null>(null);
  const [isGeneratingSqlDump, setIsGeneratingSqlDump] = useState<boolean>(false);

  // 3.05.3.ac: Modal de Auditoria de Segurança, Atualizações e Alerta de Memória (>200 MB)
  const [showAuditorModal, setShowAuditorModal] = useState<boolean>(false);
  const [securityAuditReport, setSecurityAuditReport] = useState<SecurityAuditReport | null>(null);
  const [simulatedMemoryOffset, setSimulatedMemoryOffset] = useState<number>(0);
  const [memUsage, setMemUsage] = useState(() => {
    const auditorExt = extensionManager.getExtension('ExtensionsSecurityAuditorExtension') as ExtensionsSecurityAuditorExtension | undefined;
    return auditorExt ? auditorExt.getMemoryUsage() : { usedBytes: 74 * 1024 * 1024, usedMB: 74, limitMB: 200, isExceeded: false, formatted: '74 MB / 200 MB' };
  });

  // 3.05.3.ad: Modal de Importação e Download do JSON firebase-applet-config em Site Cadastrado
  const [showConfigImporterModal, setShowConfigImporterModal] = useState<boolean>(false);
  const [importerConfig, setImporterConfig] = useState<FirebaseAppletConfigImporterSettings>(() => getFirebaseAppletImporterConfig());
  const [importerResult, setImporterResult] = useState<ImportFetchResult | null>(null);
  const [isFetchingConfig, setIsFetchingConfig] = useState<boolean>(false);
  const [importerStatusMsg, setImporterStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedUid, setCopiedUid] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Sincronização em Nuvem Firebase (Versão 3.304)
  const [syncStatus, setSyncStatus] = useState<SyncStateStatus>(() => extensionManager.getSyncStatus());
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(() => extensionManager.getLastCloudSyncAt());
  const [cloudConflicts, setCloudConflicts] = useState<ExtensionConflict[]>(() => extensionManager.getCloudConflicts());
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [keepSyncConfirmModal, setKeepSyncConfirmModal] = useState<{
    isOpen: boolean;
    conflict?: ExtensionConflict;
    resolution?: 'keep_cloud' | 'overwrite_cloud_with_local' | 'delete_from_cloud' | 'global_sync';
    title: string;
    description: string;
  } | null>(null);

  // 3.05.9.a: Dispositivo de Segurança para Sincronia de Extensões
  const [showSyncSecurityModal, setShowSyncSecurityModal] = useState<boolean>(false);
  const [quarantineCount, setQuarantineCount] = useState<number>(() =>
    extensionSyncSecurityDevice.getQuarantinedExtensions().filter((q) => q.status === 'quarantined').length
  );

  // 3.05.9.b: Dispositivo para Verificação de Informações Maliciosas
  const [showMalwareScannerModal, setShowMalwareScannerModal] = useState<boolean>(false);

  // Upload de Arquivo (index.js / index.ts) (304.4)
  const [uploadedFileContent, setUploadedFileContent] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileMeta, setUploadedFileMeta] = useState<Partial<InstalledExtensionMeta> | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Notificações e Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [syncProgressModal, setSyncProgressModal] = useState<{ isOpen: boolean; title: string; step: string; success?: boolean } | null>(null);

  // Modos de Adição de Extensões
  const [addMode, setAddMode] = useState<'catalog' | 'visual' | 'code' | 'json' | 'upload'>('catalog');

  // Estado do Criador Visual (No-Code Builder com 7 tipos)
  const [visualType, setVisualType] = useState<'tool' | 'theme' | 'tag' | 'editor' | 'banner' | 'filter' | 'css'>('tool');
  const [visName, setVisName] = useState<string>('');
  const [visDesc, setVisDesc] = useState<string>('');
  const [visCategory, setVisCategory] = useState<ExtensionCategory>('tool');

  // 1. Tool Visual State
  const [visToolId, setVisToolId] = useState<string>('conversor-temperatura');
  const [visToolTitle, setVisToolTitle] = useState<string>('Conversor de Temperatura');
  const [visToolIcon, setVisToolIcon] = useState<string>('🌡️');
  const [visToolBadge, setVisToolBadge] = useState<string>('Física');
  const [visToolFormula, setVisToolFormula] = useState<string>('(celsius * 9/5) + 32');
  const [visToolResultLabel, setVisToolResultLabel] = useState<string>('Temperatura em Fahrenheit');
  const [visToolUnitSuffix, setVisToolUnitSuffix] = useState<string>('°F');
  const [visToolInputs, setVisToolInputs] = useState<CustomToolInputField[]>([
    { id: 'celsius', label: 'Graus Celsius (°C)', type: 'number', defaultValue: 25, placeholder: 'Ex: 25' },
  ]);
  const [visToolHtmlWidget, setVisToolHtmlWidget] = useState<string>('');

  // 2. Theme Visual State
  const [visThemeId, setVisThemeId] = useState<string>('cyberpunk-neon');
  const [visThemeName, setVisThemeName] = useState<string>('Cyberpunk Néon 2077');
  const [visThemeBase, setVisThemeBase] = useState<'light' | 'dark' | 'retro' | 'cyberpunk' | 'monochrome'>('dark');
  const [visThemeAccent, setVisThemeAccent] = useState<string>('#00ffff');
  const [visThemeBg, setVisThemeBg] = useState<string>('#0a0c14');
  const [visThemeText, setVisThemeText] = useState<string>('#e2e8f0');
  const [visThemeFont, setVisThemeFont] = useState<string>('JetBrains Mono, monospace');
  const [visThemeCss, setVisThemeCss] = useState<string>('');

  // 3. Tag Visual State
  const [visTag, setVisTag] = useState<string>('spoiler');
  const [visTagTemplate, setVisTagTemplate] = useState<string>(
    '<span class="wiki-spoiler px-2 py-0.5 rounded bg-slate-300 dark:bg-slate-700 text-transparent hover:text-inherit select-none cursor-pointer transition border border-slate-400/40" title="Clique ou passe o mouse para revelar" onclick="this.classList.toggle(\'text-transparent\')">{{content}}</span>'
  );
  const [visTagHasClosing, setVisTagHasClosing] = useState<boolean>(true);

  // 4. Editor Plugin Visual State
  const [visEditorBtnId, setVisEditorBtnId] = useState<string>('btn-quick-cite');
  const [visEditorBtnLabel, setVisEditorBtnLabel] = useState<string>('Citar Livro');
  const [visEditorBtnSnippet, setVisEditorBtnSnippet] = useState<string>(
    '<ref>{{Citar livro |autor=Sobrenome, Nome |título=Título da Obra |editora=Editora |ano=2026 |páginas=42}}</ref>'
  );
  const [visEditorBtnTooltip, setVisEditorBtnTooltip] = useState<string>('Inserir citação bibliográfica rápida');

  // 5. Banner Visual State
  const [visBannerId, setVisBannerId] = useState<string>('aviso-revisao');
  const [visBannerTitle, setVisBannerTitle] = useState<string>('Artigo Sob Revisão Acadêmica');
  const [visBannerText, setVisBannerText] = useState<string>('Este verbete está sendo avaliado por editores do corpo científico da enciclopédia.');
  const [visBannerType, setVisBannerType] = useState<'info' | 'warning' | 'alert' | 'success' | 'tip'>('info');
  const [visBannerPosition, setVisBannerPosition] = useState<'top' | 'bottom'>('top');

  // 6. Filter Visual State
  const [visFilterPattern, setVisFilterPattern] = useState<string>('\\b(ONU|OMS|UNESCO|IA|SUS)\\b');
  const [visFilterReplacement, setVisFilterReplacement] = useState<string>(
    '<abbr title="Termo Enciclopédico Catalogado" class="underline decoration-dotted font-semibold cursor-help">$1</abbr>'
  );
  const [visFilterIsRegex, setVisFilterIsRegex] = useState<boolean>(true);

  // 7. CSS Visual State
  const [visCss, setVisCss] = useState<string>(
    '/* Estilos da extensão visual */\n.wiki-highlight-custom {\n  background-color: rgba(250, 204, 21, 0.25);\n  border-bottom: 2px solid #eab308;\n}'
  );

  // Estado do Criador por Código Avançado
  const [newExtName, setNewExtName] = useState<string>('');
  const [newExtVersion, setNewExtVersion] = useState<string>('1.0.0');
  const [newExtDesc, setNewExtDesc] = useState<string>('');
  const [newExtCategory, setNewExtCategory] = useState<ExtensionCategory>('utility');
  const [newExtAuthor, setNewExtAuthor] = useState<string>('');
  const [newExtWebsite, setNewExtWebsite] = useState<string>('');
  const [newExtScript, setNewExtScript] = useState<string>(
    `// Extensão personalizada do WikiWorldWeb\nhooks.addFilter('render:wikitext', function(text, articleTitle) {\n  if (!text) return text;\n  // Exemplo: Destaca termos importantes com tooltip\n  return text.replace(/\\\\b(IMPORTANTE|ATENÇÃO)\\\\b/g, '<span class="px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-900 border border-amber-300">$1</span>');\n}, 12, extensionName);\n`
  );
  const [newExtCss, setNewExtCss] = useState<string>('');
  const [jsonManifest, setJsonManifest] = useState<string>('');

  // Sandbox Tester
  const [sandboxInput, setSandboxInput] = useState<string>('= Artigo de Teste =\nEste é um texto contendo ATENÇÃO e termos com [[link]].');
  const [sandboxResult, setSandboxResult] = useState<{ success: boolean; output: string; error?: string } | null>(null);

  // Editor de Parâmetros de Configuração
  const [settingsFormData, setSettingsFormData] = useState<Record<string, any>>({});

  // Status de Burocrata
  const userIsBureaucrat = isUserBureaucrat(currentUser);

  // Carrega e atualiza lista de extensões
  const refreshList = () => {
    const list = extensionManager.getAllInstalledExtensions();
    setExtensions(list);
    setSyncStatus(extensionManager.getSyncStatus());
    setLastCloudSyncAt(extensionManager.getLastCloudSyncAt());
    setCloudConflicts(extensionManager.getCloudConflicts());
  };

  useEffect(() => {
    refreshList();
    const unsubscribe = extensionManager.subscribe(() => {
      refreshList();
    });
    const unsubSec = extensionSyncSecurityDevice.subscribe(() => {
      setQuarantineCount(
        extensionSyncSecurityDevice.getQuarantinedExtensions().filter((q) => q.status === 'quarantined').length
      );
    });
    const unsubOnline = onlineStatusExt.subscribe((state) => {
      setOnlineStatusData(state);
    });
    return () => {
      unsubscribe();
      unsubSec();
      unsubOnline();
    };
  }, []);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // 3.05.3.ac: Monitoramento periódico de consumo de memória e alerta de 200 MB
  useEffect(() => {
    const updateMem = () => {
      const auditorExt = extensionManager.getExtension('ExtensionsSecurityAuditorExtension') as
        | ExtensionsSecurityAuditorExtension
        | undefined;
      if (auditorExt) {
        auditorExt.simulateMemorySpike(simulatedMemoryOffset);
        setMemUsage(auditorExt.getMemoryUsage());
      }
    };
    updateMem();
    const interval = setInterval(updateMem, 4000);
    return () => clearInterval(interval);
  }, [extensionManager, simulatedMemoryOffset]);

  // 3.05.3.aa: Manipuladores de Backup Geral SQL
  const handleToggleSqlGeneralBackup = (targetState: boolean) => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Somente o burocrata pode habilitar ou desabilitar o backup geral para o banco de dados SQL.',
      });
      return;
    }
    const res = updateSqlDatabaseBackupConfig({ isGeneralBackupEnabled: targetState }, currentUser);
    setSqlBackupConfig(res.config);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDownloadSqlBackup = async () => {
    setIsGeneratingSqlDump(true);
    try {
      const res = await downloadSqlBackupFile();
      setFeedback({
        type: 'success',
        message: `Arquivo ${res.filename} (${res.sizeKb} KB) gerado e descarregado com sucesso!`,
      });
      setSqlBackupConfig(getSqlDatabaseBackupConfig());
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao gerar dump SQL: ${err?.message || err}` });
    } finally {
      setIsGeneratingSqlDump(false);
    }
  };

  const handlePreviewSqlDump = async () => {
    setIsGeneratingSqlDump(true);
    try {
      const res = await generateSqlDumpScript(sqlBackupConfig);
      setSqlDumpPreview(res.sqlScript);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao gerar prévia SQL: ${err?.message || err}` });
    } finally {
      setIsGeneratingSqlDump(false);
    }
  };

  // 3.05.3.ac: Manipuladores do Auditor de Segurança e Atualizações
  const handleRunSecurityAudit = () => {
    const auditorExt = extensionManager.getExtension('ExtensionsSecurityAuditorExtension') as
      | ExtensionsSecurityAuditorExtension
      | undefined;
    if (auditorExt) {
      auditorExt.simulateMemorySpike(simulatedMemoryOffset);
      const rep = auditorExt.runFullAudit();
      setSecurityAuditReport(rep);
      setMemUsage(rep.memoryUsage);
      setFeedback({
        type: 'info',
        message: `Auditoria de segurança concluída: ${rep.totalLoaded} extensões avaliadas (Score: ${rep.overallScore}/100, Memória: ${rep.memoryUsage.usedMB} MB).`,
      });
    }
  };

  const handleTestMemorySpike = (deltaMb: number) => {
    const nextOffset = Math.max(0, simulatedMemoryOffset + deltaMb);
    setSimulatedMemoryOffset(nextOffset);
    const auditorExt = extensionManager.getExtension('ExtensionsSecurityAuditorExtension') as
      | ExtensionsSecurityAuditorExtension
      | undefined;
    if (auditorExt) {
      auditorExt.simulateMemorySpike(nextOffset);
      const mem = auditorExt.getMemoryUsage();
      setMemUsage(mem);
      if (mem.isExceeded) {
        setFeedback({
          type: 'error',
          message: `ALERTA DE MEMÓRIA: Consumo superior a 200 MB disparado (${mem.usedMB} MB)!`,
        });
      }
    }
  };

  // 3.05.3.ad: Manipuladores de Importação do firebase-applet-config em Site Cadastrado
  const handleFetchImporterConfig = async (customUrlOrUid?: string) => {
    setIsFetchingConfig(true);
    setImporterStatusMsg({ type: 'info', text: 'Consultando registro no Firebase (coleção wikizerikey)...' });
    try {
      const res = await fetchFirebaseAppletConfigFromRegisteredSite(
        customUrlOrUid || importerConfig.registeredSiteUrl || importerConfig.uid
      );
      setImporterResult(res);
      if (res.success) {
        setImporterStatusMsg({
          type: 'success',
          text: `Arquivo ${res.fileName} carregado com sucesso via UID [${res.uid}]!`,
        });
      } else {
        setImporterStatusMsg({
          type: 'error',
          text: res.error || 'Falha ao recuperar arquivo do Firebase.',
        });
      }
    } catch (err: any) {
      setImporterStatusMsg({
        type: 'error',
        text: `Erro na consulta: ${err?.message || 'Falha de conexão.'}`,
      });
    } finally {
      setIsFetchingConfig(false);
    }
  };

  const handleDownloadImporterJson = () => {
    const content = importerResult?.rawJson || importerResult?.data;
    if (!content) {
      handleFetchImporterConfig().then(() => {
        if (importerResult?.rawJson || importerResult?.data) {
          triggerDownloadAppletConfigFile(
            importerResult.rawJson || importerResult.data,
            importerConfig.fileName
          );
        }
      });
      return;
    }
    triggerDownloadAppletConfigFile(content, importerConfig.fileName);
    setImporterStatusMsg({
      type: 'success',
      text: `Download do ${importerConfig.fileName} disparado com sucesso!`,
    });
  };

  const handleApplyImporterJson = () => {
    if (!importerResult?.data) {
      setImporterStatusMsg({ type: 'error', text: 'Nenhum dado baixado disponível para aplicar.' });
      return;
    }
    const applyRes = applyImportedFirebaseConfig(importerResult.data);
    if (applyRes.success) {
      setImporterStatusMsg({ type: 'success', text: applyRes.message });
      setFeedback({ type: 'success', message: applyRes.message });
    } else {
      setImporterStatusMsg({ type: 'error', text: applyRes.message });
      setFeedback({ type: 'error', message: applyRes.message });
    }
  };

  // Alterna Ativação / Desativação de Extensão (Update 3.05 - Requisitos 3.05.3.q.2 & 3.05.3.q.3)
  const handleToggleExtension = async (ext: InstalledExtensionMeta) => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas usuários com a prerrogativa de Burocrata podem ativar ou desativar extensões.',
      });
      return;
    }

    const actionText = ext.enabled ? 'Desativando' : 'Ativando';
    setSyncProgressModal({
      isOpen: true,
      title: `${actionText} "${ext.name}"...`,
      step: 'Aguarde: Gravando alterações no Firebase Firestore e sincronizando com servidores da nuvem...',
    });
    setIsProcessing(true);

    try {
      let res: { success: boolean; message: string };
      if (ext.enabled) {
        res = await extensionManager.deactivateExtension(ext.name, currentUser);
      } else {
        res = await extensionManager.activateExtension(ext.name, currentUser);
      }

      setSyncProgressModal({
        isOpen: true,
        title: res.success ? 'Sincronizado no Firebase com Sucesso!' : 'Falha na Gravação',
        step: res.success
          ? 'Alteração confirmada e gravada no Firebase Firestore. Atualizando o Wiki-site automaticamente...'
          : res.message,
        success: res.success,
      });

      if (res.success) {
        // Aguarda confirmação visual para que o burocrata veja que as alterações foram feitas
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Guarda contexto para restaurar view após recarga limpa do Wiki-site
        try {
          sessionStorage.setItem('wikizero_last_view', 'admin-extensions');
          sessionStorage.setItem('wikizero_flash_msg', res.message);
        } catch (_) {}

        // Atualiza a página automaticamente garantindo atualização em todas as instâncias
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.message });
        refreshList();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao alterar estado: ${err?.message || 'Desconhecido'}` });
    } finally {
      setIsProcessing(false);
      setSyncProgressModal(null);
    }
  };

  // Confirmação de Remoção de Extensão
  const handleConfirmDelete = async () => {
    if (!extensionToDelete) return;
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas Burocratas possuem autorização para desinstalar extensões da Wiki.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = extensionManager.removeExtension(extensionToDelete.name, currentUser);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setExtensionToDelete(null);
        refreshList();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao remover extensão: ${err?.message || 'Desconhecido'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // 304.4 (segundo item): Sincronização em Massa de Todas as Extensões na Nuvem
  const handleSyncAllToCloud = async () => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas burocratas possuem autorização para sincronizar todas as extensões na nuvem.',
      });
      return;
    }

    setIsSyncingAll(true);
    try {
      const res = await extensionManager.syncAllToCloud(currentUser);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
      refreshList();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Falha na sincronização em nuvem: ${err?.message || 'Erro de rede ou permissão'}`,
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // 304.2 & 3.05.11: Força rechecagem de conexão e verificação em tempo real com o Firebase
  const handleForceRecheckSync = async () => {
    setIsProcessing(true);
    try {
      const verifyRes = await siteAutoUpdateService.verifyExtensionsOnFirebase('admin_recheck');
      const res = await extensionManager.forceRecheckSync();
      if (res.success || verifyRes.success) {
        setFeedback({
          type: 'success',
          message: `Verificação em tempo real no Firebase concluída (${verifyRes.latencyMs}ms): ${verifyRes.activeCount} ativas de ${verifyRes.totalExtensions} extensões catalogadas.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Não foi possível validar a sincronia em nuvem com o Firebase. Verifique sua conexão.',
        });
      }
      refreshList();
    } finally {
      setIsProcessing(false);
    }
  };

  // 304.3.1: Resolução de Conflitos e Extensões Órfãs na Nuvem
  // Regra de Governança Estrita: Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões
  const handleResolveConflict = async (
    conflict: ExtensionConflict,
    resolution: 'keep_cloud' | 'overwrite_cloud_with_local' | 'delete_from_cloud' | 'sync_new_local'
  ) => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await extensionManager.resolveConflict(conflict, resolution, currentUser);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        refreshList();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao resolver conflito: ${err?.message || 'Falha desconhecida'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Abre modal de confirmação para manter entre sincronia e nuvem
  const handleRequestKeepSyncConfirmation = (
    conflict: ExtensionConflict,
    resolution: 'keep_cloud' | 'overwrite_cloud_with_local' | 'delete_from_cloud'
  ) => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões.',
      });
      return;
    }

    const actionDesc =
      resolution === 'keep_cloud'
        ? `Você está confirmando manter a versão da nuvem da extensão '${conflict.extensionName}' preservada e sincronizada localmente no sistema.`
        : resolution === 'overwrite_cloud_with_local'
        ? `Você está confirmando sobrescrever a versão da nuvem com o arquivo local da extensão '${conflict.extensionName}' e manter a sincronização com o Firebase Firestore.`
        : `Você está confirmando a remoção definitiva da extensão '${conflict.extensionName}' da nuvem Firebase.`;

    setKeepSyncConfirmModal({
      isOpen: true,
      conflict,
      resolution,
      title: 'Confirmar em Manter entre Sincronia e Nuvem das Extensões',
      description: actionDesc,
    });
  };

  // Abre modal global de confirmação de sincronia e nuvem
  const handleOpenGlobalKeepSyncConfirmation = () => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões.',
      });
      return;
    }

    setKeepSyncConfirmModal({
      isOpen: true,
      resolution: 'global_sync',
      title: 'Confirmar em Manter entre Sincronia e Nuvem das Extensões',
      description:
        'Você está confirmando manter a sincronização completa entre todas as extensões ativas locais e a nuvem Firebase Firestore. Esta ação homologa o catálogo para toda a comunidade.',
    });
  };

  // Executa a confirmação de manter entre sincronia e nuvem com validação estrita
  const handleExecuteKeepSyncConfirmation = async () => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões.',
      });
      setKeepSyncConfirmModal(null);
      return;
    }

    if (!keepSyncConfirmModal) return;

    setIsProcessing(true);
    try {
      if (keepSyncConfirmModal.resolution === 'global_sync') {
        const res = await extensionManager.confirmKeepSyncBetweenLocalAndCloud(currentUser);
        if (res.success) {
          setFeedback({ type: 'success', message: res.message });
          refreshList();
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      } else if (keepSyncConfirmModal.conflict && keepSyncConfirmModal.resolution) {
        const res = await extensionManager.resolveConflict(
          keepSyncConfirmModal.conflict,
          keepSyncConfirmModal.resolution as any,
          currentUser
        );
        if (res.success) {
          setFeedback({ type: 'success', message: res.message });
          refreshList();
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Erro ao confirmar sincronia: ${err?.message || 'Falha de comunicação'}`,
      });
    } finally {
      setIsProcessing(false);
      setKeepSyncConfirmModal(null);
    }
  };

  // 304.4: Processamento do arquivo de extensão selecionado para Upload
  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadedFileContent(content);

      const parsed = FirebaseExtensionSyncService.getInstance().parseUploadedExtensionFile(
        content,
        file.name
      );

      if (parsed.success && parsed.meta) {
        setUploadedFileMeta(parsed.meta);
        setUploadError(null);
      } else {
        setUploadedFileMeta(null);
        setUploadError(parsed.error || 'Formato de arquivo inválido. Envie um arquivo index.js, index.ts ou .json válido.');
      }
    };
    reader.onerror = () => {
      setUploadError('Erro ao ler arquivo do computador.');
    };
    reader.readAsText(file);
  };

  // 304.4: Confirmação do Upload e Envio para a Nuvem Firebase
  const handleConfirmUploadExtension = async () => {
    if (!userIsBureaucrat) {
      setFeedback({ type: 'error', message: 'Apenas burocratas podem enviar novas extensões para a nuvem.' });
      return;
    }

    if (!uploadedFileContent || !uploadedFileName) {
      setFeedback({ type: 'error', message: 'Nenhum arquivo válido selecionado para upload.' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await extensionManager.uploadExtensionFile(
        uploadedFileContent,
        uploadedFileName,
        currentUser
      );

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setShowAddModal(false);
        setUploadedFileContent('');
        setUploadedFileName('');
        setUploadedFileMeta(null);
        refreshList();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao fazer upload da extensão: ${err?.message || 'Falha inesperada'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Instalação Direta via Catálogo Oficial
  const handleInstallFromCatalog = (catalogItem: any) => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas Burocratas podem instalar extensões do catálogo oficial.',
      });
      return;
    }

    const res = extensionManager.addExtension(
      {
        name: catalogItem.name,
        version: catalogItem.version,
        description: catalogItem.description,
        category: catalogItem.category,
        author: catalogItem.author,
        hooks: catalogItem.hooks || ['render:wikitext'],
        customScript: catalogItem.script,
        customCss: catalogItem.customCss,
        customTags: catalogItem.customTags,
        toolConfig: catalogItem.toolConfig,
        themeConfig: catalogItem.themeConfig,
        editorPluginConfig: catalogItem.editorPluginConfig,
        bannerConfig: catalogItem.bannerConfig,
        filterRules: catalogItem.filterRules,
        dependencies: catalogItem.dependencies,
        settingsSchema: catalogItem.settingsSchema,
        settings: catalogItem.defaultSettings || {},
        enabled: true,
      },
      currentUser
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowAddModal(false);
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Criação Visual No-Code
  const handleCreateVisualExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIsBureaucrat) {
      setFeedback({ type: 'error', message: 'Apenas Burocratas podem criar extensões.' });
      return;
    }

    if (!visName.trim()) {
      setFeedback({ type: 'error', message: 'O nome da extensão é obrigatório.' });
      return;
    }

    let script = '';
    let customTags: CustomWikitextTagRule[] | undefined = undefined;
    let customCss = '';
    let toolConfig: CustomToolConfig | undefined = undefined;
    let themeConfig: CustomThemeConfig | undefined = undefined;
    let editorPluginConfig: CustomEditorPluginConfig | undefined = undefined;
    let bannerConfig: CustomArticleBannerConfig | undefined = undefined;
    let filterRules: CustomContentFilterRule[] | undefined = undefined;
    let category: ExtensionCategory = visCategory;

    if (visualType === 'tool') {
      category = 'tool';
      const cleanToolId = (visToolId.trim() || visName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
      toolConfig = {
        toolId: cleanToolId,
        title: visToolTitle.trim() || visName.trim(),
        icon: visToolIcon.trim() || '🛠️',
        badge: visToolBadge.trim() || 'Ferramenta',
        inputs: visToolInputs,
        calculationFormula: visToolFormula.trim() || undefined,
        resultLabel: visToolResultLabel.trim() || 'Resultado',
        unitSuffix: visToolUnitSuffix.trim() || undefined,
        htmlWidget: visToolHtmlWidget.trim() || undefined,
      };
    } else if (visualType === 'theme') {
      category = 'theme';
      const cleanThemeId = (visThemeId.trim() || visName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
      themeConfig = {
        themeId: cleanThemeId,
        displayName: visThemeName.trim() || visName.trim(),
        baseTheme: visThemeBase,
        accentColor: visThemeAccent,
        backgroundColor: visThemeBg,
        textColor: visThemeText,
        fontFamily: visThemeFont.trim() || undefined,
        customCss: visThemeCss.trim() || undefined,
      };
    } else if (visualType === 'editor') {
      category = 'editor';
      const cleanBtnId = (visEditorBtnId.trim() || `btn-${visName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`);
      editorPluginConfig = {
        buttonId: cleanBtnId,
        label: visEditorBtnLabel.trim() || visName.trim(),
        snippetTemplate: visEditorBtnSnippet,
        tooltip: visEditorBtnTooltip.trim() || undefined,
      };
    } else if (visualType === 'banner') {
      category = 'content';
      const cleanBannerId = (visBannerId.trim() || `banner-${visName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`);
      bannerConfig = {
        bannerId: cleanBannerId,
        title: visBannerTitle.trim() || 'Aviso Editorial',
        message: visBannerText.trim(),
        type: visBannerType,
        position: visBannerPosition,
      };
    } else if (visualType === 'filter') {
      category = 'formatting';
      filterRules = [
        {
          pattern: visFilterPattern.trim(),
          replacement: visFilterReplacement,
          isRegex: visFilterIsRegex,
          description: `Regra de filtro de conteúdo para ${visName}.`,
        },
      ];
    } else if (visualType === 'tag') {
      category = 'formatting';
      customTags = [
        {
          tag: visTag.trim().toLowerCase(),
          template: visTagTemplate,
          description: `Tag customizada <${visTag}> gerada visualmente.`,
          hasClosingTag: visTagHasClosing,
        },
      ];
    } else if (visualType === 'css') {
      category = 'interface';
      customCss = visCss;
    }

    const res = extensionManager.addExtension(
      {
        name: visName.trim(),
        version: '1.0.0',
        description: visDesc.trim() || `Extensão (${category}) criada via Construtor Visual pelo burocrata.`,
        category,
        customTags,
        customCss: customCss || undefined,
        customScript: script || undefined,
        toolConfig,
        themeConfig,
        editorPluginConfig,
        bannerConfig,
        filterRules,
        enabled: true,
      },
      currentUser
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowAddModal(false);
      setVisName('');
      setVisDesc('');
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Criação Avançada com Código JavaScript
  const handleCreateCodeExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIsBureaucrat) {
      setFeedback({ type: 'error', message: 'Apenas Burocratas podem registrar extensões.' });
      return;
    }

    if (!newExtName.trim()) {
      setFeedback({ type: 'error', message: 'O nome da extensão é obrigatório.' });
      return;
    }

    const res = extensionManager.addExtension(
      {
        name: newExtName.trim(),
        version: newExtVersion.trim() || '1.0.0',
        description: newExtDesc.trim() || 'Extensão avançada criada via código pelo burocrata.',
        category: newExtCategory,
        author: newExtAuthor.trim() || currentUser?.displayName || currentUser?.username || 'Burocrata',
        website: newExtWebsite.trim() || undefined,
        customScript: newExtScript.trim() || undefined,
        customCss: newExtCss.trim() || undefined,
        enabled: true,
      },
      currentUser
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowAddModal(false);
      setNewExtName('');
      setNewExtDesc('');
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Testar Código no Sandbox
  const handleRunSandbox = () => {
    const res = extensionManager.executeSandboxTest(newExtScript, sandboxInput);
    setSandboxResult(res);
  };

  // Exportar Backup de Extensões em Arquivo JSON
  const handleExportPackage = () => {
    const pkg = extensionManager.exportAllExtensionsPackage();
    const blob = new Blob([pkg], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wikizero-extensions-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({ type: 'success', message: 'Pacote de backup de extensões baixado com sucesso!' });
  };

  // Importar Pacote JSON
  const handleImportJson = () => {
    if (!userIsBureaucrat) {
      setFeedback({ type: 'error', message: 'Apenas Burocratas podem importar pacotes de extensões.' });
      return;
    }

    const res = extensionManager.importExtensionsPackage(jsonManifest, currentUser);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowAddModal(false);
      setJsonManifest('');
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Abertura do Modal de Configurações
  const handleOpenSettings = (ext: InstalledExtensionMeta) => {
    setEditingSettingsExtension(ext);
    setSettingsFormData(ext.settings || {});
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSettingsExtension) return;

    setIsProcessing(true);
    try {
      const res = await extensionManager.saveExtensionSettingsAsync(
        editingSettingsExtension.name,
        settingsFormData,
        currentUser
      );

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setShowSettingsModal(false);
        setEditingSettingsExtension(null);
        refreshList();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao salvar configurações: ${err?.message || 'Falha inesperada'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // 4.1.1.1GZ.8: Teste manual imediato de conectividade com o GitHub
  const handleTestGithubNow = async () => {
    setIsTestingGithubConnection(true);
    setManualGithubTestResult(null);
    try {
      const res = await onlineStatusExt.checkConnectivity();
      if (res.status === 'online') {
        setManualGithubTestResult(
          `Conexão com GitHub confirmada: Estável (${res.latencyMs}ms, HTTP ${res.statusCode || 200})`
        );
      } else {
        setManualGithubTestResult(
          `Conexão com GitHub: Offline (${res.error || 'Falha de comunicação ou timeout'})`
        );
      }
    } catch (err: any) {
      setManualGithubTestResult(`Erro ao testar conectividade: ${err?.message || 'Falha na rede'}`);
    } finally {
      setIsTestingGithubConnection(false);
    }
  };

  // Inserção de Snippets no Editor de Código
  const handleInsertSnippet = (snippetCode: string) => {
    setNewExtScript((prev) => prev + '\n' + snippetCode);
  };

  // Filtros da Lista de Extensões
  const filteredExtensions = useMemo(() => {
    return extensions.filter((ext) => {
      if (selectedCategory !== 'all' && ext.category !== selectedCategory) return false;
      if (statusFilter === 'active' && !ext.enabled) return false;
      if (statusFilter === 'inactive' && ext.enabled) return false;
      if (statusFilter === 'core' && !ext.isCore) return false;
      if (statusFilter === 'custom' && ext.isCore) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = ext.name.toLowerCase().includes(q);
      const matchDesc = ext.description.toLowerCase().includes(q);
      const matchAuthor = ext.author.toLowerCase().includes(q);
      const matchHooks = ext.hooks.some((h) => h.toLowerCase().includes(q));
      return matchName || matchDesc || matchAuthor || matchHooks;
    });
  }, [extensions, searchQuery, selectedCategory, statusFilter]);

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    const total = extensions.length;
    const active = extensions.filter((e) => e.enabled).length;
    const inactive = total - active;
    const core = extensions.filter((e) => e.isCore).length;
    const custom = total - core;
    return { total, active, inactive, core, custom };
  }, [extensions]);

  // Catálogo Oficial Expandido com 16+ Extensões de Alto Valor
  const catalogExtensions = [
    {
      name: 'CalculatorToolExtension',
      version: '1.2.0',
      description: 'Calculadora interativa multiúso com modo padrão, científico (trigonometria, logaritmos, potências, raízes), constantes matemáticas e histórico persistente.',
      category: 'tool' as ExtensionCategory,
      author: 'WikiZero Tools / Equipe WikiWorldWeb',
      hooks: ['tool:calculator_available', 'tools:registered_tools'],
      script: `// Registro de ferramenta da calculadora\nhooks.addFilter('tool:calculator_available', () => true, 10, extensionName);\nhooks.addFilter('tools:registered_tools', (tools) => [...(tools || []), 'calculator'], 10, extensionName);`,
    },
    {
      name: 'WorldClockToolExtension',
      version: '1.3.0',
      description: 'Painel de Horário Certo Mundial com catalogação de fusos horários do Brasil (Brasília, Noronha, Manaus, Acre), capitais globais, UTC e conversor temporal.',
      category: 'tool' as ExtensionCategory,
      author: 'WikiZero Tools / Equipe WikiWorldWeb',
      hooks: ['tool:world_clock_available', 'tools:registered_tools'],
      script: `// Registro de ferramenta de horário mundial\nhooks.addFilter('tool:world_clock_available', () => true, 10, extensionName);\nhooks.addFilter('tools:registered_tools', (tools) => [...(tools || []), 'world-clock'], 10, extensionName);`,
    },
    {
      name: 'WeatherForecastToolExtension',
      version: '1.4.0',
      description: 'Estação meteorológica e previsão do tempo em tempo real com busca global de cidades, geolocalização, radar de chuva, índice UV, vento e previsão de 7 dias.',
      category: 'tool' as ExtensionCategory,
      author: 'WikiZero Meteorologia / Open-Meteo',
      hooks: ['tool:weather_available', 'tools:registered_tools'],
      script: `// Registro de ferramenta meteorológica\nhooks.addFilter('tool:weather_available', () => true, 10, extensionName);\nhooks.addFilter('tools:registered_tools', (tools) => [...(tools || []), 'weather'], 10, extensionName);`,
    },
    {
      name: 'GeminiAssistantToolExtension',
      version: '1.5.0',
      description: 'Assistente inteligente oficial integrado do Google AI Studio para auxílio em pesquisa enciclopédica, geração e revisão de artigos em Wikitext, síntese de conhecimento e verificação factual.',
      category: 'tool' as ExtensionCategory,
      author: 'Google AI Studio / Equipe WikiZero',
      hooks: ['tool:gemini-assistant_available', 'tools:registered_tools'],
      script: `// Registro do assistente Gemini Studio na aba de ferramentas\nhooks.addFilter('tool:gemini-assistant_available', () => true, 10, extensionName);\nhooks.addFilter('tools:registered_tools', (tools) => [...(tools || []), 'gemini-assistant'], 10, extensionName);`,
    },
    {
      name: 'SpoilerBlurTag',
      version: '1.1.0',
      description: 'Adiciona a tag <spoiler>...</spoiler> para ocultar trechos com desfoque tátil que revelam o conteúdo mediante clique ou toque do leitor.',
      category: 'formatting' as ExtensionCategory,
      author: 'Equipe de Leitura WikiZero',
      hooks: ['render:wikitext'],
      customTags: [
        {
          tag: 'spoiler',
          template: '<span class="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-transparent hover:text-inherit select-none cursor-pointer transition border border-slate-300 dark:border-slate-600" title="Clique para revelar o spoiler" onclick="this.classList.toggle(\'text-transparent\')">{{content}}</span>',
          description: 'Oculta enredos, gabaritos e segredos.',
        },
      ],
    },
    {
      name: 'MermaidDiagrams',
      version: '1.2.5',
      description: 'Suporte a diagramas de fluxo, gráficos de sequência, diagramas de classe e mapas mentais em wikitexto via marcação <diagram>...</diagram>.',
      category: 'rendering' as ExtensionCategory,
      author: 'Ciência da Computação & Modelagem',
      hooks: ['render:wikitext'],
      script: `// Renderizador simplificado de caixas de diagramas\nhooks.addFilter('render:wikitext', function(text) {\n  if (!text) return text;\n  return text.replace(/<diagram>([\\s\\S]*?)<\\/diagram>/gi, function(_m, code) {\n    return '<div class=\"p-4 my-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-700 shadow-sm overflow-x-auto\"><div class=\"text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider\">📊 Diagrama Conceitual</div><pre>' + code.trim() + '</pre></div>';\n  });\n}, 12, extensionName);`,
    },
    {
      name: 'ArticleReadingProgressBar',
      version: '1.0.3',
      description: 'Adiciona uma barra sutil de progresso de leitura no topo fixo da tela indicando a rolagem do artigo enciclopédico.',
      category: 'interface' as ExtensionCategory,
      author: 'Experiência do Usuário (UX)',
      hooks: ['render:html'],
      customCss: `/* Barra de progresso de leitura */
#wiki-reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
  z-index: 9999;
  width: 0%;
  transition: width 0.1s ease-out;
}`,
      script: `// Script da barra de rolagem\nhooks.addFilter('render:html', function(html) {\n  return '<div id=\"wiki-reading-progress\"></div>' + html;\n}, 2, extensionName);`,
    },
    {
      name: 'DynamicTableFilter',
      version: '1.0.4',
      description: 'Adiciona caixas de busca e ordenação instantânea por coluna em tabelas Wikitext ({| class="wikitable").',
      category: 'interface' as ExtensionCategory,
      author: 'Equipe de Dados WikiZero',
      hooks: ['render:wikitext', 'render:html'],
      script: `// Hook de aprimoramento de tabelas\nhooks.addFilter('render:wikitext', function(text) {\n  if (!text) return text;\n  return text.replace(/class=\"wikitable\"/g, 'class=\"wikitable sortable-table shadow-xs\"');\n}, 11, extensionName);`,
    },
    {
      name: 'AbbreviationGlossary',
      version: '1.1.0',
      description: 'Detecta siglas comuns (e.g. ONU, OMS, IA, USP, MEC, SUS) e anexa tooltips com significado por extenso automaticamente.',
      category: 'content' as ExtensionCategory,
      author: 'Linguística & Vocabulário',
      hooks: ['render:wikitext'],
      script: `// Glossário dinâmico de abreviaturas\nhooks.addFilter('render:wikitext', function(text) {\n  if (!text) return text;\n  return text.replace(/\\b(ONU|OMS|UNESCO|LGBTQIA\\+|IA|MEC|SUS)\\b/g, '<abbr title=\"Termo Enciclopédico Catalogado\" class=\"underline decoration-dotted font-semibold cursor-help\">$1</abbr>');\n}, 14, extensionName);`,
    },
    {
      name: 'OpenDyslexicTypography',
      version: '1.0.1',
      description: 'Habilita espaçamento otimizado entre letras e palavras e ponderação de peso na base dos glifos para leitores com dislexia.',
      category: 'interface' as ExtensionCategory,
      author: 'Acessibilidade & Inclusão',
      hooks: ['render:html'],
      customCss: `/* Modo de Leitura Inclusiva */
.wiki-rendered-content {
  letter-spacing: 0.035em !important;
  word-spacing: 0.12em !important;
  line-height: 1.85 !important;
}`,
      settingsSchema: [
        {
          key: 'extraSpacing',
          label: 'Espaçamento Adicional',
          type: 'boolean',
          defaultValue: true,
          description: 'Aumenta a distância entre linhas para facilitar o rastreamento visual.',
        },
      ],
    },
    {
      name: 'ScientificNotationFormatter',
      version: '1.0.2',
      description: 'Formata grandezas físicas, notação científica e expoentes do Sistema Internacional (SI) no padrão tipográfico universal.',
      category: 'rendering' as ExtensionCategory,
      author: 'Física & Metrologia',
      hooks: ['render:wikitext'],
      script: `// Formatação de grandezas físicas\nhooks.addFilter('render:wikitext', function(text) {\n  if (!text) return text;\n  return text.replace(/(\\d+)\\s*(m\\/s²|km\\/h|m²|m³|cm²)/g, '$1 <span class=\"font-mono text-xs font-semibold\">$2</span>');\n}, 15, extensionName);`,
    },
    {
      name: 'UnitConverterTool',
      version: '1.2.0',
      description: 'Conversor universal interativo para distâncias, massas, temperaturas, volumes e dados digitais com execução instantânea de fórmulas.',
      category: 'tool' as ExtensionCategory,
      author: 'WikiZero Tools / Ciências Exatas',
      hooks: ['tools:registered_tools', 'tool:unit-converter_available'],
      toolConfig: {
        toolId: 'unit-converter',
        title: 'Conversor Universal de Unidades',
        icon: '📏',
        badge: 'Conversão',
        inputs: [
          { id: 'valor', label: 'Valor a Converter', type: 'number', defaultValue: 100 },
          {
            id: 'fator',
            label: 'Escala de Conversão',
            type: 'select',
            options: [
              { label: 'Quilômetros para Milhas (km → mi)', value: 0.621371 },
              { label: 'Milhas para Quilômetros (mi → km)', value: 1.60934 },
              { label: 'Quilos para Libras (kg → lb)', value: 2.20462 },
              { label: 'Libras para Quilos (lb → kg)', value: 0.453592 },
              { label: 'Metros para Pés (m → ft)', value: 3.28084 },
              { label: 'Gigabytes para Megabytes (GB → MB)', value: 1024 },
            ],
          },
        ],
        calculationFormula: 'valor * fator',
        resultLabel: 'Valor Convertido',
      },
    },
    {
      name: 'DiceRollerTool',
      version: '1.1.0',
      description: 'Sorteador aleatório e rolador de dados poliédricos para jogos, probabilidades, estatísticas e deliberações editoriais.',
      category: 'tool' as ExtensionCategory,
      author: 'WikiZero Tools / Ludologia',
      hooks: ['tools:registered_tools', 'tool:dice-roller_available'],
      toolConfig: {
        toolId: 'dice-roller',
        title: 'Rolador de Dados & Sorteador',
        icon: '🎲',
        badge: 'Aleatório',
        inputs: [
          {
            id: 'lados',
            label: 'Faces do Dado',
            type: 'select',
            options: [
              { label: 'D6 (Dado clássico de 6 faces)', value: 6 },
              { label: 'D20 (Dado de 20 faces)', value: 20 },
              { label: 'D100 (Porcentagem 1-100)', value: 100 },
              { label: 'D12 (12 faces)', value: 12 },
              { label: 'D8 (8 faces)', value: 8 },
              { label: 'D4 (4 faces)', value: 4 },
            ],
          },
          { id: 'quantidade', label: 'Quantidade de Dados', type: 'number', defaultValue: 1 },
        ],
        calculationFormula: 'Math.floor(Math.random() * lados * quantidade) + quantidade',
        resultLabel: 'Resultado Sorteado',
      },
    },
    {
      name: 'TextDiffTool',
      version: '1.0.1',
      description: 'Calculador de delta métrico entre texto original e texto revisado com contagem de bytes e auditoria de edições.',
      category: 'tool' as ExtensionCategory,
      author: 'WikiZero Tools / Auditoria',
      hooks: ['tools:registered_tools', 'tool:text-diff_available'],
      toolConfig: {
        toolId: 'text-diff',
        title: 'Comparador de Delta de Texto',
        icon: '📝',
        badge: 'Auditoria',
        inputs: [
          { id: 'original', label: 'Tamanho do Artigo Anterior (bytes)', type: 'number', defaultValue: 2400 },
          { id: 'revisao', label: 'Tamanho da Nova Revisão (bytes)', type: 'number', defaultValue: 3100 },
        ],
        calculationFormula: 'revisao - original',
        resultLabel: 'Variação Líquida de Bytes',
        unitSuffix: 'bytes',
      },
    },
    {
      name: 'CyberpunkNeonTheme',
      version: '1.0.0',
      description: 'Tema visual de alta tecnologia com fundo ultra-escuro, contrastes néon em ciano elétrico (#00ffff), magenta e tipografia mono.',
      category: 'theme' as ExtensionCategory,
      author: 'Estúdio de Interface WikiZero',
      hooks: ['theme:registered_themes', 'theme:cyberpunk_available'],
      themeConfig: {
        themeId: 'cyberpunk',
        displayName: 'Cyberpunk Néon 2077',
        baseTheme: 'cyberpunk',
        accentColor: '#00ffff',
        backgroundColor: '#0a0b12',
        textColor: '#e0f2fe',
        fontFamily: 'JetBrains Mono, monospace',
      },
    },
    {
      name: 'SolarizedPaperTheme',
      version: '1.0.0',
      description: 'Tema de leitura acadêmica com fundo em tom pergaminho solarizado quente e acentos dourados para redução de fadiga ocular.',
      category: 'theme' as ExtensionCategory,
      author: 'Ergonomia & Leitura',
      hooks: ['theme:registered_themes', 'theme:solarized-paper_available'],
      themeConfig: {
        themeId: 'solarized-paper',
        displayName: 'Pergaminho Solarizado Acadêmico',
        baseTheme: 'light',
        accentColor: '#b58900',
        backgroundColor: '#fdf6e3',
        textColor: '#586e75',
        fontFamily: 'Merriweather, serif',
      },
    },
    {
      name: 'AmoledOledPureDarkTheme',
      version: '1.0.0',
      description: 'Preto puro 100% (#000000) projetado para economia máxima de energia em telas AMOLED e contraste absoluto.',
      category: 'theme' as ExtensionCategory,
      author: 'OLED Lab',
      hooks: ['theme:registered_themes', 'theme:amoled-dark_available'],
      themeConfig: {
        themeId: 'amoled-dark',
        displayName: 'AMOLED Ultra Black 100%',
        baseTheme: 'dark',
        accentColor: '#38bdf8',
        backgroundColor: '#000000',
        textColor: '#f8fafc',
      },
    },
    {
      name: 'AlertBoxTag',
      version: '1.1.0',
      description: 'Adiciona a tag <alert>...</alert> para criar caixas de destaque enciclopédico de avisos editoriais e advertências históricas.',
      category: 'formatting' as ExtensionCategory,
      author: 'Equipe Editorial WikiZero',
      hooks: ['render:wikitext'],
      customTags: [
        {
          tag: 'alert',
          template: '<div class="wiki-alert-box p-4 my-3 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5 shadow-2xs font-sans"><span>⚠️</span><div>{{content}}</div></div>',
          description: 'Avisos e advertências de conteúdo.',
          hasClosingTag: true,
        },
      ],
    },
    {
      name: 'AudioPlayerTag',
      version: '1.0.0',
      description: 'Adiciona a marcação <audio>...</audio> para indicar termos com pronúncia fonética e reprodução acessível.',
      category: 'rendering' as ExtensionCategory,
      author: 'Linguística & Fonética',
      hooks: ['render:wikitext'],
      customTags: [
        {
          tag: 'audio',
          template: '<div class="wiki-audio-embed inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono select-none"><span>🔊</span><span>{{content}}</span></div>',
          description: 'Pronúncia fonética e transcrições sonoras.',
          hasClosingTag: true,
        },
      ],
    },
    {
      name: 'QuickCitationButton',
      version: '1.0.0',
      description: 'Plugin para a barra do editor wikitext: adiciona botão para inserção em 1 clique de citação bibliográfica acadêmica completa.',
      category: 'editor' as ExtensionCategory,
      author: 'Pesquisa Acadêmica WikiZero',
      hooks: ['editor:toolbar_buttons'],
      editorPluginConfig: {
        buttonId: 'btn-citation-book',
        label: 'Citar Livro',
        tooltip: 'Inserir citação bibliográfica completa com autor, título e ano',
        snippetTemplate: '<ref>{{Citar livro |autor= |título= |editora= |ano=2026 |páginas= |isbn=}}</ref>',
      },
    },
    {
      name: 'TemplateInsertButton',
      version: '1.0.0',
      description: 'Plugin para a barra do editor wikitext: insere estrutura padrão de infocaixa biográfica pronta para preenchimento.',
      category: 'editor' as ExtensionCategory,
      author: 'Biografias WikiZero',
      hooks: ['editor:toolbar_buttons'],
      editorPluginConfig: {
        buttonId: 'btn-infobox-bio',
        label: 'Infobox Biografia',
        tooltip: 'Inserir esqueleto de infocaixa biográfica',
        snippetTemplate: '{{Info/Biografia\n| nome = {{subst:PAGENAME}}\n| imagem = \n| legenda = \n| nascimento_data = \n| nacionalidade = \n| ocupacao = \n}}',
      },
    },
    {
      name: 'ArticleReviewNotice',
      version: '1.0.0',
      description: 'Adiciona banner visual formal notificando que o artigo enciclopédico está sob processo de revisão por pares.',
      category: 'content' as ExtensionCategory,
      author: 'Conselho Editorial WikiZero',
      hooks: ['render:html'],
      bannerConfig: {
        bannerId: 'banner-revisao-pares',
        title: 'Verbete em Avaliação Editorial',
        message: 'Este artigo está sob escrutínio da comissão científica da enciclopédia para verificação de imparcialidade.',
        type: 'info',
        position: 'top',
      },
    },
    {
      name: 'VandalismWordFilter',
      version: '1.0.0',
      description: 'Filtro automático de moderação que sinaliza termos ofensivos e padrões frequentes de vandalismo com aviso neutro.',
      category: 'security' as ExtensionCategory,
      author: 'Segurança & Moderação',
      hooks: ['render:wikitext'],
      filterRules: [
        {
          pattern: '\\b(spam_teste|vandalismo_teste|teste_proibido)\\b',
          replacement: '<mark class="bg-rose-200 text-rose-900 font-bold px-1 rounded">[termo sob moderação]</mark>',
          isRegex: true,
        },
      ],
    },
    {
      name: 'PeriodicTableTool',
      version: '1.0.0',
      description: 'Tabela periódica interativa com informações detalhadas dos 118 elementos químicos, camadas eletrônicas e grupos periódicos.',
      category: 'tool' as ExtensionCategory,
      author: 'Química Geral / Sociedade Científica',
      hooks: ['tools:registered_tools'],
      script: `// Registra tabela periódica\nhooks.addFilter('tools:registered_tools', (tools) => [...(tools || []), 'periodic-table'], 10, extensionName);`,
    },
  ];

  const getCategoryIcon = (cat: ExtensionCategory) => {
    switch (cat) {
      case 'rendering':
        return <Sigma className="w-4 h-4 text-indigo-500" />;
      case 'formatting':
        return <FileCode className="w-4 h-4 text-purple-500" />;
      case 'content':
        return <BookOpen className="w-4 h-4 text-emerald-500" />;
      case 'utility':
        return <Sliders className="w-4 h-4 text-amber-500" />;
      case 'interface':
        return <Layout className="w-4 h-4 text-blue-500" />;
      case 'tool':
        return <Wrench className="w-4 h-4 text-cyan-500" />;
      case 'theme':
        return <Palette className="w-4 h-4 text-pink-500" />;
      case 'editor':
        return <Code className="w-4 h-4 text-blue-500" />;
      case 'widget':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'security':
      case 'moderation':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'export':
        return <Download className="w-4 h-4 text-teal-500" />;
      case 'communication':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'community':
        return <Award className="w-4 h-4 text-amber-500" />;
      default:
        return <Puzzle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryLabel = (cat: ExtensionCategory) => {
    switch (cat) {
      case 'rendering':
        return 'Renderização';
      case 'formatting':
        return 'Formatação';
      case 'content':
        return 'Conteúdo & Referências';
      case 'utility':
        return 'Utilitários & Métricas';
      case 'interface':
        return 'Interface & Telas';
      case 'tool':
        return 'Ferramenta';
      case 'theme':
        return 'Tema Visual';
      case 'editor':
        return 'Plugin do Editor';
      case 'widget':
        return 'Widget Interativo';
      case 'security':
        return 'Segurança';
      case 'moderation':
        return 'Moderação & Antivandalismo';
      case 'communication':
        return 'Comunicação & Chat';
      case 'community':
        return 'Comunidade & Engajamento';
      case 'export':
        return 'Exportação & Interoperabilidade';
      default:
        return cat;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Special:Extensions
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Governança Restrita ao Conselho de Burocratas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-900 dark:text-white flex items-center gap-2.5">
            <Puzzle className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            <span>Gerenciamento de Extensões da Wiki</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Catálogo completo de módulos, ganchos (hooks) e ferramentas da enciclopédia. Ative, desative, calibre parâmetros, crie extensões visuais (no-code) ou instale pacotes certificados.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Voltar
            </button>
          )}

          {/* 304.4: Sincronia em Massa de Todas as Extensões na Nuvem */}
          <button
            type="button"
            disabled={!userIsBureaucrat || isSyncingAll}
            onClick={handleSyncAllToCloud}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-2xs ${
              isSyncingAll
                ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 cursor-wait'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
            }`}
            title="Sincronizar em massa todas as extensões locais e customizadas para a nuvem Firebase Firestore (304.4)"
          >
            <Cloud className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-bounce text-purple-600' : 'text-blue-500'}`} />
            <span>{isSyncingAll ? 'Sincronizando...' : 'Sincronizar Nuvem'}</span>
          </button>

          {/* Confirmação de Manter entre Sincronia e Nuvem (Restrito ao Burocrata) */}
          <button
            type="button"
            disabled={!userIsBureaucrat || isProcessing}
            onClick={handleOpenGlobalKeepSyncConfirmation}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-2xs ${
              userIsBureaucrat
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer'
                : 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed opacity-60'
            }`}
            title={
              userIsBureaucrat
                ? 'Confirmar em manter entre sincronia e nuvem das extensões (Prerrogativa exclusiva do Burocrata)'
                : 'Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões'
            }
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Confirmar Manter Sincronia & Nuvem</span>
          </button>

          {/* 304.3.1: Detecção e Resolução de Conflitos e Extensões Órfãs */}
          <button
            type="button"
            onClick={() => setShowConflictsModal(true)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-2xs relative ${
              cloudConflicts.length > 0
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 hover:bg-amber-100'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Gerenciar conflitos, colisões e extensões órfãs entre arquivos locais e a nuvem Firebase (304.3.1)"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${cloudConflicts.length > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-500'}`} />
            <span>Conflitos ({cloudConflicts.length})</span>
            {cloudConflicts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5"></span>
            )}
          </button>

          {/* 304.6: Camadas de Segurança Salvas em Nuvem */}
          <button
            type="button"
            onClick={() => setShowSecurityLayersModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition shadow-2xs"
            title="Configurar camadas de segurança em nuvem (XSS, Anti-Vandalismo, Rate Limiter e Sentinela de Integridade) (304.6)"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Segurança (304.6)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPackage}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition shadow-2xs"
            title="Exportar pacote completo de backup com todas as extensões e configurações"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition shadow-2xs"
            title="Ver histórico de alterações de extensões"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Auditoria</span>
          </button>

          {/* 3.05.3.aa: Backup Geral para Banco de Dados SQL */}
          <button
            type="button"
            onClick={() => setShowSqlBackupModal(true)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-2xs ${
              sqlBackupConfig.isGeneralBackupEnabled
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Gerenciar configuração nativa em arquivo de backup geral para banco SQL (3.05.3.aa)"
          >
            <Database className={`w-3.5 h-3.5 ${sqlBackupConfig.isGeneralBackupEnabled ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span>Backup SQL {sqlBackupConfig.isGeneralBackupEnabled ? '(Ativo)' : ''}</span>
          </button>

          {/* 3.05.3.ac: Auditoria de Segurança, Atualizações e Memória */}
          <button
            type="button"
            onClick={() => setShowAuditorModal(true)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-2xs ${
              memUsage.isExceeded
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 animate-pulse'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Verificação de segurança, atualizações e consumo de memória (Alerta > 200 MB) (3.05.3.ac)"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${memUsage.isExceeded ? 'text-rose-600 animate-spin' : 'text-blue-500'}`} />
            <span>Memória: {memUsage.usedMB} MB {memUsage.isExceeded ? '⚠️ (>200MB)' : ''}</span>
          </button>

          {/* 3.05.9.a: Dispositivo de Segurança para Sincronia de Extensões */}
          <button
            type="button"
            onClick={() => setShowSyncSecurityModal(true)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              quarantineCount > 0
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 animate-pulse'
                : 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100'
            }`}
            title="Dispositivo de Segurança para Sincronia de Extensões: Hashes SHA-256, Quarentena e Rollback (3.05.9.a)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Segurança Sincronia (3.05.9.a)</span>
            {quarantineCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                {quarantineCount}
              </span>
            )}
          </button>

          {/* 3.05.9.b: Dispositivo para Verificação de Informações Maliciosas */}
          <button
            type="button"
            onClick={() => setShowMalwareScannerModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Dispositivo de Verificação de Informações Maliciosas dentro dos Arquivos das Extensões (3.05.9.b)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Antimalware (3.05.9.b)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHooksModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition shadow-2xs"
            title="Inspecionar todos os ganchos ativos"
          >
            <Code className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Ganchos ({stats.total})</span>
          </button>

          <button
            type="button"
            disabled={!userIsBureaucrat}
            onClick={() => {
              setAddMode('catalog');
              setShowAddModal(true);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm ${
              userIsBureaucrat
                ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer active:scale-98'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title={
              userIsBureaucrat
                ? 'Instalar nova extensão do catálogo ou criar personalizada'
                : 'Apenas burocratas podem adicionar extensões'
            }
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Extensão</span>
          </button>
        </div>
      </div>

      {/* 3.05.3.ac: Banner de Alerta Crítico quando a memória for maior que 200 MB */}
      {memUsage.isExceeded && (
        <div className="my-4 p-4 rounded-2xl bg-rose-600 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-700/80 rounded-xl shrink-0">
              <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm tracking-wide uppercase">
                  ⚠️ ALERTA DE SEGURANÇA: CONSUMO DE MEMÓRIA SUPERIOR A 200 MB!
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-rose-700">
                  {memUsage.usedMB} MB / 200 MB
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                O monitoramento de segurança detectou {memUsage.usedMB} MB em uso pelas extensões ativas (limite: 200 MB). Verifique atualizações e extensões pesadas carregadas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleTestMemorySpike(-60)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-rose-100 transition"
              title="Reduzir memória simulada em 60 MB"
            >
              -60 MB
            </button>
            <button
              type="button"
              onClick={() => setShowAuditorModal(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-rose-700 hover:bg-rose-50 shadow-xs transition cursor-pointer"
            >
              Auditar Extensões
            </button>
          </div>
        </div>
      )}

      {/* Feedback Alert Banner */}
      {feedback && (
        <div
          className={`my-4 p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : feedback.type === 'error' ? (
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status da Prerrogativa de Burocrata */}
      <div
        className={`my-4 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          userIsBureaucrat
            ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/80 text-purple-900 dark:text-purple-200'
            : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              userIsBureaucrat
                ? 'bg-purple-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {userIsBureaucrat ? <Crown className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-sm flex items-center gap-1.5">
              <span>{userIsBureaucrat ? 'Prerrogativa de Burocrata Ativa' : 'Modo de Leitura / Auditoria'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/60 dark:bg-black/40 border border-current font-semibold">
                {currentUser?.role || 'Visitante'}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
              {userIsBureaucrat
                ? 'Você possui autorização para ativar, desativar, configurar parâmetros, criar novas extensões e desinstalar módulos.'
                : 'Apenas burocratas e administradores gerais possuem permissão para modificar o estado de extensões da enciclopédia.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {/* 304.2: Indicador de Sincronia em Nuvem com Firebase */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs ${
              syncStatus === 'connected'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : syncStatus === 'connecting'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
            title={`Status de conexão com o Firestore. Última sincronia: ${lastCloudSyncAt || 'Pendente'}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : syncStatus === 'connecting'
                  ? 'bg-blue-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            ></span>
            <span>
              {syncStatus === 'connected'
                ? 'Firebase: Sincronizado (v3.304)'
                : syncStatus === 'connecting'
                ? 'Firebase: Conectando...'
                : 'Firebase: Offline'}
            </span>
            <button
              type="button"
              onClick={handleForceRecheckSync}
              disabled={isProcessing}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-1 p-0.5 rounded cursor-pointer"
              title="Testar conexão e sincronizar novamente com o Firebase"
            >
              <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{stats.active} ativas</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500">{stats.total} total</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 pb-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, descrição, gancho (e.g. render:wikitext)..."
            className="w-full pl-9 pr-8 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas as Categorias</option>
            <option value="tool">Ferramentas & Utilitários</option>
            <option value="rendering">Renderização & LaTeX</option>
            <option value="formatting">Formatação & Sintaxe</option>
            <option value="content">Conteúdo & Citações</option>
            <option value="utility">Utilitários & Métricas</option>
            <option value="interface">Interface & Mobile</option>
            <option value="security">Segurança & Moderação</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativas ({stats.active})</option>
            <option value="inactive">Apenas Desativadas ({stats.inactive})</option>
            <option value="core">Apenas Nativas (Core)</option>
            <option value="custom">Apenas Personalizadas</option>
          </select>

          {/* Layout Toggle */}
          <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded text-xs font-semibold ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visualização em Grade"
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`p-1.5 rounded text-xs font-semibold ${
                viewLayout === 'table'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visualização em Tabela Detalhada"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Extension Cards Grid */}
      {viewLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExtensions.map((ext) => {
            const hasSettings = ext.settingsSchema && ext.settingsSchema.length > 0;

            return (
              <div
                key={ext.name}
                className={`rounded-2xl border p-4 transition-all flex flex-col justify-between group ${
                  ext.enabled
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                }`}
              >
                <div>
                  {/* Top Bar with Category and Version */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getCategoryIcon(ext.category)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {getCategoryLabel(ext.category)}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        v{ext.version}
                      </span>
                      {ext.isCore ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Core
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Custom
                        </span>
                      )}
                      {(ext.noCloudSync || ext.syncStatus === 'local_only' || ext.name === 'SqlDatabaseBackupExtension' || ext.name === 'FirebaseAppletConfigImporterExtension') && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-0.5"
                          title="Extensão nativa local não sincronizável com a nuvem (Requisitos 3.05.3.aa & 3.05.3.ad)"
                        >
                          <HardDrive className="w-2.5 h-2.5" />
                          Local (Não-Nuvem)
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ext.name === 'OnlineStatusExtension' && (
                        <ConnectivityStatusTooltip
                          status={onlineStatusData.isOnline ? 'online' : 'offline'}
                          latencyMs={onlineStatusData.latencyMs}
                          lastCheckedAt={onlineStatusData.lastCheckedAt}
                          statusCode={onlineStatusData.statusCode}
                          error={onlineStatusData.error}
                          targetUrl={onlineStatusData.targetUrl}
                          isStable={onlineStatusExt.isStable}
                          position="top"
                        >
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-help transition-all hover:scale-105 ${
                              onlineStatusData.isOnline
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            {onlineStatusData.isOnline ? (
                              <>
                                <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
                                <span>GitHub: Estável {onlineStatusData.latencyMs !== null ? `(${onlineStatusData.latencyMs}ms)` : ''}</span>
                              </>
                            ) : (
                              <>
                                <WifiOff className="w-3 h-3 text-rose-500" />
                                <span>GitHub: Offline</span>
                              </>
                            )}
                          </span>
                        </ConnectivityStatusTooltip>
                      )}
                      {ext.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Inativa
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Extension Name & Description */}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{ext.name}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
                    {ext.description}
                  </p>

                  {/* Meta Chips: Hooks & Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ext.hooks.length} {ext.hooks.length === 1 ? 'gancho' : 'ganchos'}:
                    </span>
                    {ext.hooks.slice(0, 2).map((h) => (
                      <span
                        key={h}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        title={h}
                      >
                        {h}
                      </span>
                    ))}
                    {ext.hooks.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        +{ext.hooks.length - 2}
                      </span>
                    )}

                    {ext.customTags && ext.customTags.length > 0 && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        tag: &lt;{ext.customTags[0].tag}&gt;
                      </span>
                    )}
                    {ext.customCss && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        CSS
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Toolbar */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setInspectingExtension(ext)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Ver detalhes técnicos e código"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {hasSettings && (
                      <button
                        type="button"
                        onClick={() => handleOpenSettings(ext)}
                        className="p-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition"
                        title="Configurar opções da extensão"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}

                    {ext.name === 'SqlDatabaseBackupExtension' && (
                      <button
                        type="button"
                        onClick={() => setShowSqlBackupModal(true)}
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition"
                        title="Configuração Direta em Arquivo e Backup SQL (3.05.3.aa)"
                      >
                        <Database className="w-4 h-4" />
                      </button>
                    )}

                    {ext.name === 'ExtensionsSecurityAuditorExtension' && (
                      <button
                        type="button"
                        onClick={() => setShowAuditorModal(true)}
                        className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition"
                        title="Auditoria de Segurança, Atualizações e Memória > 200 MB (3.05.3.ac)"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}

                    {ext.name === 'FirebaseAppletConfigImporterExtension' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowConfigImporterModal(true);
                          handleFetchImporterConfig();
                        }}
                        className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition"
                        title="Importar e Baixar JSON do firebase-applet-config em Site Cadastrado (3.05.3.ad)"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                    )}

                    {!ext.isCore && (
                      <button
                        type="button"
                        disabled={!userIsBureaucrat || isProcessing}
                        onClick={() => setExtensionToDelete(ext)}
                        className={`p-1.5 rounded-lg transition ${
                          userIsBureaucrat
                            ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        }`}
                        title={
                          userIsBureaucrat
                            ? 'Desinstalar e remover extensão'
                            : 'Apenas burocratas podem desinstalar extensões'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Toggle Active Switch */}
                  <button
                    type="button"
                    disabled={!userIsBureaucrat || isProcessing}
                    onClick={() => handleToggleExtension(ext)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      ext.enabled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                    } ${!userIsBureaucrat ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-98'}`}
                    title={
                      !userIsBureaucrat
                        ? 'Apenas burocratas podem alterar'
                        : ext.enabled
                        ? 'Clique para desativar esta extensão'
                        : 'Clique para ativar esta extensão'
                    }
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{ext.enabled ? 'Ativa' : 'Ativar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-mono uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Extensão</th>
                  <th className="px-3 py-3">Categoria</th>
                  <th className="px-3 py-3">Versão</th>
                  <th className="px-3 py-3">Autor</th>
                  <th className="px-3 py-3">Ganchos</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações (Burocrata)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {filteredExtensions.map((ext) => (
                  <tr key={ext.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{ext.name}</span>
                        {ext.isCore && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                            core
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{ext.description}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {getCategoryIcon(ext.category)}
                        <span>{getCategoryLabel(ext.category)}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-purple-700 dark:text-purple-300 font-bold">
                      v{ext.version}
                    </td>
                    <td className="px-3 py-3.5 text-slate-600 dark:text-slate-400">{ext.author}</td>
                    <td className="px-3 py-3.5">
                      <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {ext.hooks.length} ganchos
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ext.name === 'OnlineStatusExtension' && (
                          <ConnectivityStatusTooltip
                            status={onlineStatusData.isOnline ? 'online' : 'offline'}
                            latencyMs={onlineStatusData.latencyMs}
                            lastCheckedAt={onlineStatusData.lastCheckedAt}
                            statusCode={onlineStatusData.statusCode}
                            error={onlineStatusData.error}
                            targetUrl={onlineStatusData.targetUrl}
                            isStable={onlineStatusExt.isStable}
                            position="top"
                          >
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-help transition-all hover:scale-105 ${
                                onlineStatusData.isOnline
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {onlineStatusData.isOnline ? (
                                <>
                                  <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
                                  <span>GitHub: Estável {onlineStatusData.latencyMs !== null ? `(${onlineStatusData.latencyMs}ms)` : ''}</span>
                                </>
                              ) : (
                                <>
                                  <WifiOff className="w-3 h-3 text-rose-500" />
                                  <span>GitHub: Offline</span>
                                </>
                              )}
                            </span>
                          </ConnectivityStatusTooltip>
                        )}
                        {ext.enabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Inativa
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectingExtension(ext)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Inspecionar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {ext.settingsSchema && (
                          <button
                            type="button"
                            onClick={() => handleOpenSettings(ext)}
                            className="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                            title="Configurações"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!userIsBureaucrat || isProcessing}
                          onClick={() => handleToggleExtension(ext)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            ext.enabled
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                          } ${!userIsBureaucrat ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {ext.enabled ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADICIONAR EXTENSÃO (CATÁLOGO, NO-CODE, CÓDIGO)   */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Adicionar Nova Extensão à Wiki
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instale pacotes certificados ou crie ferramentas, estilos e tags sem código.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-center bg-slate-50/60 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setAddMode('catalog')}
                className={`py-3 px-2 border-b-2 transition flex items-center justify-center gap-1.5 ${
                  addMode === 'catalog'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Catálogo ({catalogExtensions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('visual')}
                className={`py-3 px-2 border-b-2 transition flex items-center justify-center gap-1.5 ${
                  addMode === 'visual'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>2. No-Code</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('code')}
                className={`py-3 px-2 border-b-2 transition flex items-center justify-center gap-1.5 ${
                  addMode === 'code'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>3. Código JS</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('json')}
                className={`py-3 px-2 border-b-2 transition flex items-center justify-center gap-1.5 ${
                  addMode === 'json'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>4. JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('upload')}
                className={`py-3 px-2 border-b-2 transition flex items-center justify-center gap-1.5 ${
                  addMode === 'upload'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>5. Upload (index.js)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* TAB 1: CATÁLOGO OFICIAL */}
              {addMode === 'catalog' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 rounded-2xl text-xs text-purple-900 dark:text-purple-300 leading-relaxed">
                    Extensões validadas e otimizadas pelo ecossistema WikiZero. Instale com 1 clique para habilitar novas ferramentas, formatações e recursos de interface.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {catalogExtensions.map((item) => {
                      const alreadyInstalled = extensions.some((e) => e.name === item.name);

                      return (
                        <div
                          key={item.name}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-700 transition"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {item.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                                v{item.version}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 mb-2 block">
                              {getCategoryLabel(item.category)} • por {item.author}
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.hooks.join(', ')}
                            </span>
                            <button
                              type="button"
                              disabled={alreadyInstalled || !userIsBureaucrat}
                              onClick={() => handleInstallFromCatalog(item)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                alreadyInstalled
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer active:scale-98'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{alreadyInstalled ? 'Já Instalada' : 'Instalar'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: CONSTRUTOR NO-CODE */}
              {addMode === 'visual' && (
                <form onSubmit={handleCreateVisualExtension} className="space-y-4">
                  <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 rounded-2xl text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                    Crie novas extensões sem escrever código TypeScript. Escolha o tipo de comportamento desejado e defina os parâmetros visuais.
                  </div>

                  {/* Visual Type Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'tag', label: 'Tag Customizada', desc: '<spoiler>, <badge>, etc.' },
                      { id: 'css', label: 'Estilo / Tema CSS', desc: 'Fontes, cores e visuais' },
                      { id: 'banner', label: 'Aviso Editorial', desc: 'Banner no topo dos artigos' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setVisualType(t.id as any)}
                        className={`p-3 rounded-xl border text-left transition ${
                          visualType === t.id
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="font-bold text-xs">{t.label}</div>
                        <div className="text-[10px] text-slate-500">{t.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Nome da Extensão *
                      </label>
                      <input
                        type="text"
                        required
                        value={visName}
                        onChange={(e) => setVisName(e.target.value)}
                        placeholder="Ex: MinhaTagDestaque, TemaNoturnoNeon"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Categoria
                      </label>
                      <select
                        value={visCategory}
                        onChange={(e) => setVisCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="formatting">Formatação & Tags</option>
                        <option value="interface">Interface & CSS</option>
                        <option value="content">Conteúdo & Avisos</option>
                        <option value="utility">Utilitários</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={visDesc}
                      onChange={(e) => setVisDesc(e.target.value)}
                      placeholder="Breve descrição da função desta extensão na Wiki..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Configuração específica do tipo */}
                  {visualType === 'tag' && (
                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Nome da Tag (sem &lt;&gt;)
                        </label>
                        <input
                          type="text"
                          value={visTag}
                          onChange={(e) => setVisTag(e.target.value)}
                          placeholder="spoiler, destaque, blur, nota"
                          className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Template HTML de Substituição (use <code>{'{{content}}'}</code> e <code>{'{{attrs}}'}</code>)
                        </label>
                        <textarea
                          rows={3}
                          value={visTagTemplate}
                          onChange={(e) => setVisTagTemplate(e.target.value)}
                          className="w-full p-3 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {visualType === 'css' && (
                    <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Código CSS Customizado (aplicado isoladamente aos artigos)
                      </label>
                      <textarea
                        rows={6}
                        value={visCss}
                        onChange={(e) => setVisCss(e.target.value)}
                        className="w-full p-3 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  {visualType === 'banner' && (
                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Texto do Aviso Editorial
                        </label>
                        <input
                          type="text"
                          value={visBannerText}
                          onChange={(e) => setVisBannerText(e.target.value)}
                          placeholder="Mensagem exibida no topo dos artigos..."
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Tipo de Aviso
                        </label>
                        <div className="flex gap-2">
                          {(['info', 'warning', 'alert'] as const).map((bType) => (
                            <button
                              key={bType}
                              type="button"
                              onClick={() => setVisBannerType(bType)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                                visBannerType === bType
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {bType}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!userIsBureaucrat}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition"
                    >
                      Criar Extensão Visual
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: CÓDIGO JAVASCRIPT AVANÇADO + SANDBOX */}
              {addMode === 'code' && (
                <form onSubmit={handleCreateCodeExtension} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Nome da Extensão (PascalCase) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newExtName}
                        onChange={(e) => setNewExtName(e.target.value)}
                        placeholder="Ex: CitationAutoFixer, LaTeXEnhancer"
                        className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Categoria
                      </label>
                      <select
                        value={newExtCategory}
                        onChange={(e) => setNewExtCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="utility">Utilitário & Métricas</option>
                        <option value="formatting">Formatação & Sintaxe</option>
                        <option value="rendering">Renderização & LaTeX</option>
                        <option value="content">Conteúdo & Referências</option>
                        <option value="interface">Interface</option>
                        <option value="tool">Ferramenta</option>
                        <option value="security">Segurança</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Descrição Técnica
                    </label>
                    <input
                      type="text"
                      value={newExtDesc}
                      onChange={(e) => setNewExtDesc(e.target.value)}
                      placeholder="Explique o que a extensão executa no ciclo de renderização..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Snippets Toolbar */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-slate-500 text-[11px]">Snippets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertSnippet(
                          `hooks.addFilter('render:wikitext', function(text) {\n  return text.replace(/\\\\b(NOTA)\\\\b/g, '📢 $1');\n}, 10, extensionName);`
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 text-slate-700 dark:text-slate-300 text-[10px] font-mono"
                    >
                      + Filtro de Texto
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertSnippet(
                          `hooks.addAction('article:viewed', function(art) {\n  console.log('Artigo lido:', art);\n}, 10, extensionName);`
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 text-slate-700 dark:text-slate-300 text-[10px] font-mono"
                    >
                      + Ação de Leitura
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertSnippet(
                          `utils.injectCss('.meu-estilo { color: #8b5cf6; font-weight: bold; }');`
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 text-slate-700 dark:text-slate-300 text-[10px] font-mono"
                    >
                      + Injetar CSS
                    </button>
                  </div>

                  {/* Code Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Código do Gancho <code>onRegister(hooks, extensionName, settings, utils)</code>
                      </label>
                      <button
                        type="button"
                        onClick={handleRunSandbox}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                      >
                        <Play className="w-3 h-3" />
                        <span>Testar no Sandbox</span>
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      value={newExtScript}
                      onChange={(e) => setNewExtScript(e.target.value)}
                      className="w-full p-3 rounded-xl text-xs font-mono bg-slate-950 text-emerald-300 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Sandbox Output Preview */}
                  {sandboxResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        sandboxResult.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="font-bold uppercase text-[10px]">
                        {sandboxResult.success ? '✓ Teste no Sandbox Executado com Sucesso' : '✕ Erro de Execução no Sandbox'}
                      </div>
                      {sandboxResult.success ? (
                        <div className="bg-white dark:bg-slate-900 p-2 rounded border border-emerald-200 dark:border-emerald-900 text-[11px] whitespace-pre-wrap">
                          {sandboxResult.output}
                        </div>
                      ) : (
                        <div className="text-rose-600 dark:text-rose-400 text-xs">
                          {sandboxResult.error}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!userIsBureaucrat}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition"
                    >
                      Instalar Extensão
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: IMPORTAR / RESTAURAR JSON */}
              {addMode === 'json' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Cole o manifesto JSON ou pacote de backup para restaurar e instalar múltiplas extensões e seus respectivos parâmetros de uma só vez.
                  </div>

                  <textarea
                    rows={10}
                    value={jsonManifest}
                    onChange={(e) => setJsonManifest(e.target.value)}
                    placeholder='Cole aqui o JSON da extensão ou pacote de backup:&#10;{&#10;  "name": "CustomExtension",&#10;  "version": "1.0.0",&#10;  "category": "utility",&#10;  "description": "...",&#10;  "customScript": "..."&#10;}'
                    className="w-full p-3 rounded-xl text-xs font-mono bg-slate-950 text-slate-200 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleExportPackage}
                      className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Backup Atual</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={!userIsBureaucrat || !jsonManifest.trim()}
                        onClick={handleImportJson}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition disabled:opacity-50"
                      >
                        Importar Pacote
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: UPLOAD DE ARQUIVO VÁLIDO (index.js / index.ts) (304.4) */}
              {addMode === 'upload' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    <strong>Upload de Extensão em Nuvem (Regra 304.4):</strong> Burocratas podem fazer upload de novos arquivos válidos (<code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">index.js</code>, <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">index.ts</code> ou <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">.json</code>) para serem adicionados à nuvem Firebase Firestore e disponibilizados na enciclopédia.
                  </div>

                  {/* Dropzone / File Picker */}
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 rounded-3xl p-8 text-center bg-slate-50/50 dark:bg-slate-900/50 transition">
                    <input
                      type="file"
                      id="extension-file-upload"
                      accept=".js,.ts,.json"
                      onChange={handleFileUploadChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="extension-file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {uploadedFileName ? uploadedFileName : 'Clique para selecionar ou arraste o arquivo index.js'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Formatos aceitos: JavaScript (.js), TypeScript (.ts) ou Manifesto (.json)
                        </p>
                      </div>
                      <span className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition">
                        Selecionar Arquivo
                      </span>
                    </label>
                  </div>

                  {/* Erro de Validação */}
                  {uploadError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                      <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* Prévia da Extensão Analisada */}
                  {uploadedFileMeta && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-purple-200 dark:border-purple-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {uploadedFileMeta.name}
                          </h4>
                          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">
                            v{uploadedFileMeta.version || '1.0.0'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {uploadedFileMeta.category || 'tool'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {uploadedFileMeta.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Autor: <strong>{uploadedFileMeta.author}</strong></span>
                        <span>•</span>
                        <span>Ganchos: <strong>{uploadedFileMeta.hooks?.length || 0} detectados</strong></span>
                      </div>

                      {uploadedFileMeta.hooks && uploadedFileMeta.hooks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {uploadedFileMeta.hooks.map((h) => (
                            <span
                              key={h}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-mono"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões do Rodapé */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!userIsBureaucrat || !uploadedFileMeta || isProcessing}
                      onClick={handleConfirmUploadExtension}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{isProcessing ? 'Enviando para Nuvem...' : 'Salvar no Firebase & Instalar'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFLITOS E EXTENSÕES ÓRFÃS NA NUVEM (304.3.1)     */}
      {/* ======================================================== */}
      {showConflictsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Conflitos & Sincronia em Nuvem (Regra 304.3.1)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Resolução de extensões órfãs no Firebase e divergências com o diretório local (index.ts)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConflictsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Aviso de Governança Estrita */}
            <div className="mx-6 mt-4 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Regra de Governança Estrita:</strong> Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões.
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                userIsBureaucrat ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {userIsBureaucrat ? 'Burocrata Autorizado' : 'Modo Leitura'}
              </span>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {cloudConflicts.length === 0 ? (
                <div className="text-center py-10 px-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Nenhum Conflito Detectado!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Todas as extensões do diretório local (index.ts) e as versões persistidas no banco de dados do Firebase Firestore estão sincronizadas em perfeita harmonia.
                  </p>
                  {userIsBureaucrat ? (
                    <button
                      type="button"
                      onClick={handleOpenGlobalKeepSyncConfirmation}
                      className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar em Manter entre Sincronia e Nuvem</span>
                    </button>
                  ) : (
                    <div className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400 font-medium">
                      🔒 Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões.
                    </div>
                  )}
                </div>
              ) : (
                cloudConflicts.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 uppercase">
                          {c.type === 'orphan_cloud' ? 'Órfã em Nuvem' : 'Colisão'}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {c.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(c.detectedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {c.description}
                    </p>

                    {/* Botões de Ação para o Burocrata */}
                    <div className="pt-2 flex flex-wrap gap-2 justify-end border-t border-amber-200 dark:border-amber-900/60">
                      {c.type === 'orphan_cloud' ? (
                        <>
                          <button
                            type="button"
                            disabled={!userIsBureaucrat || isProcessing}
                            onClick={() => handleRequestKeepSyncConfirmation(c, 'keep_cloud')}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            title={userIsBureaucrat ? 'Confirmar em manter na nuvem' : 'Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmar em Manter na Nuvem</span>
                          </button>
                          <button
                            type="button"
                            disabled={!userIsBureaucrat || isProcessing}
                            onClick={() => handleRequestKeepSyncConfirmation(c, 'delete_from_cloud')}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={userIsBureaucrat ? 'Remover da nuvem' : 'Somente o burocrata pode confirmar operações de nuvem'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover por Completo da Nuvem</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={!userIsBureaucrat || isProcessing}
                            onClick={() => handleRequestKeepSyncConfirmation(c, 'keep_cloud')}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            title={userIsBureaucrat ? 'Confirmar em manter versão da nuvem' : 'Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmar em Manter Versão da Nuvem</span>
                          </button>
                          <button
                            type="button"
                            disabled={!userIsBureaucrat || isProcessing}
                            onClick={() => handleRequestKeepSyncConfirmation(c, 'overwrite_cloud_with_local')}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={userIsBureaucrat ? 'Sobrescrever nuvem com local' : 'Somente o burocrata pode confirmar operações de nuvem'}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Remover da Nuvem e Sincronizar Nova Extensão Local</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConflictsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CAMADAS DE SEGURANÇA SALVAS EM NUVEM (304.6)      */}
      {/* ======================================================== */}
      {showSecurityLayersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Camadas de Segurança em Nuvem (Regra 304.6)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Módulos de proteção salvos no Firebase Firestore, ativados ou desativados pelo burocrata
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSecurityLayersModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <strong>Camadas de Segurança Ativas (Versão 3.304):</strong> As camadas abaixo operam como filtros de integridade em tempo real na Wiki, salvos e sincronizados com o banco de dados Firebase Firestore. O burocrata pode alternar cada camada individualmente.
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {extensionManager.getSecurityLayers().map(({ meta: layer, isLoaded }) => (
                  <div
                    key={layer.name}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {layer.name}
                          </h4>
                          <span className="font-mono text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                            v{layer.version}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Firebase: wiki_extensions
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {layer.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={!userIsBureaucrat || isProcessing}
                        onClick={() => handleToggleExtension(layer)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          layer.enabled && isLoaded
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                        } ${!userIsBureaucrat ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{layer.enabled && isLoaded ? 'Proteção Ativa' : 'Desativada'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[11px] font-mono text-slate-400">
                Estados sincronizados com: wiki_extension_registry
              </span>
              <button
                type="button"
                onClick={() => setShowSecurityLayersModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CONFIGURAÇÕES E AJUSTES DE PARÂMETROS           */}
      {/* ======================================================== */}
      {showSettingsModal && editingSettingsExtension && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-2 sm:my-6 max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Ajustes de {editingSettingsExtension.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calibre os parâmetros de funcionamento em tempo real.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Fechar ajustes"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* 4.1.1.1GZ.8: Seletor Visual de Status com GitHub para OnlineStatusExtension */}
              {(editingSettingsExtension.name === 'OnlineStatusExtension' ||
                editingSettingsExtension.id === 'online-status-extension') && (
                <div className="rounded-2xl border p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 space-y-4">
                  {/* Cabeçalho do Seletor Otimizado para Mobile */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <ConnectivityStatusTooltip
                        status={onlineStatusData.isOnline ? 'online' : 'offline'}
                        latencyMs={onlineStatusData.latencyMs}
                        lastCheckedAt={onlineStatusData.lastCheckedAt}
                        statusCode={onlineStatusData.statusCode}
                        error={onlineStatusData.error}
                        targetUrl={onlineStatusData.targetUrl}
                        isStable={onlineStatusExt.isStable}
                        position="bottom"
                      >
                        <div
                          tabIndex={0}
                          role="button"
                          aria-label="Ver detalhes de conectividade com o GitHub"
                          className="p-2 rounded-lg bg-slate-900 text-white dark:bg-slate-700 cursor-help hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                        >
                          <GitBranch className="w-4 h-4" />
                        </div>
                      </ConnectivityStatusTooltip>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">
                          Monitor de Conexão com GitHub em Tempo Real
                        </h4>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-sm">
                          {onlineStatusData.targetUrl || 'https://api.github.com/repos/WazzimaGiygg/Wiki-alternative'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isTestingGithubConnection}
                      onClick={handleTestGithubNow}
                      className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 disabled:opacity-60 min-h-[44px] sm:min-h-0"
                      title="Executa um ping fetch imediato ao GitHub"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingGithubConnection ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
                      <span>{isTestingGithubConnection ? 'Testando...' : 'Testar Conexão Agora'}</span>
                    </button>
                  </div>

                  {/* Feedback do Teste Manual */}
                  {manualGithubTestResult && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in ${
                        manualGithubTestResult.includes('confirmada') || manualGithubTestResult.includes('Sucesso')
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {manualGithubTestResult.includes('confirmada') || manualGithubTestResult.includes('Sucesso') ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      )}
                      <span>{manualGithubTestResult}</span>
                    </div>
                  )}

                  {/* Seletor Visual de Status: Estável vs. Offline */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Indicador Visual de Diagnóstico da Conexão (Passe o mouse no ícone para detalhes)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Cartão Estável */}
                      <div
                        className={`relative rounded-xl p-3 border-2 transition-all flex flex-col justify-between ${
                          onlineStatusData.isOnline
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <ConnectivityStatusTooltip
                              status="online"
                              latencyMs={onlineStatusData.latencyMs}
                              lastCheckedAt={onlineStatusData.lastCheckedAt}
                              statusCode={onlineStatusData.statusCode}
                              error={onlineStatusData.error}
                              targetUrl={onlineStatusData.targetUrl}
                              isStable={onlineStatusExt.isStable}
                              position="top"
                            >
                              <div
                                tabIndex={0}
                                role="button"
                                aria-label="Ver detalhes da conexão estável com o GitHub"
                                className={`p-2 rounded-lg cursor-help transition-all duration-150 hover:scale-110 active:scale-95 ${
                                  onlineStatusData.isOnline
                                    ? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600 ring-2 ring-emerald-400/50'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                }`}
                              >
                                <Wifi className="w-4 h-4" />
                              </div>
                            </ConnectivityStatusTooltip>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  Conexão Estável
                                </span>
                                {onlineStatusData.isOnline && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                RTT / Latência baixa e estável
                              </p>
                            </div>
                          </div>
                          {onlineStatusData.isOnline && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                              Ativo
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 dark:text-slate-400">Latência:</span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            {onlineStatusData.latencyMs !== null ? `${onlineStatusData.latencyMs} ms` : 'calculando...'}
                          </span>
                        </div>
                      </div>

                      {/* Cartão Offline */}
                      <div
                        className={`relative rounded-xl p-3 border-2 transition-all flex flex-col justify-between ${
                          !onlineStatusData.isOnline
                            ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <ConnectivityStatusTooltip
                              status="offline"
                              latencyMs={onlineStatusData.latencyMs}
                              lastCheckedAt={onlineStatusData.lastCheckedAt}
                              statusCode={onlineStatusData.statusCode}
                              error={onlineStatusData.error}
                              targetUrl={onlineStatusData.targetUrl}
                              isStable={false}
                              position="top"
                            >
                              <div
                                tabIndex={0}
                                role="button"
                                aria-label="Ver detalhes de diagnóstico offline do GitHub"
                                className={`p-2 rounded-lg cursor-help transition-all duration-150 hover:scale-110 active:scale-95 ${
                                  !onlineStatusData.isOnline
                                    ? 'bg-rose-500 text-white shadow-xs hover:bg-rose-600 ring-2 ring-rose-400/50'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                }`}
                              >
                                <WifiOff className="w-4 h-4" />
                              </div>
                            </ConnectivityStatusTooltip>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  Conexão Offline
                                </span>
                                {!onlineStatusData.isOnline && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                Sem resposta ou timeout na rota
                              </p>
                            </div>
                          </div>
                          {!onlineStatusData.isOnline && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 text-white uppercase tracking-wider">
                              Offline
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-rose-200/60 dark:border-rose-800/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 dark:text-slate-400">Diagnóstico:</span>
                          <span className="font-mono text-[10px] text-rose-700 dark:text-rose-300 truncate max-w-[130px]">
                            {onlineStatusData.error || (onlineStatusData.isOnline ? 'Nenhum erro' : 'Inacessível')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seletor Rápido de Ativação / Modo da Extensão */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Modo Operacional da Verificação no GitHub
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl">
                      <button
                        type="button"
                        onClick={() =>
                          setSettingsFormData({
                            ...settingsFormData,
                            enabled: true,
                          })
                        }
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 min-h-[44px] active:scale-98 ${
                          Boolean(settingsFormData.enabled !== false)
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>Verificação Ativada (On)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSettingsFormData({
                            ...settingsFormData,
                            enabled: false,
                          })
                        }
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 min-h-[44px] active:scale-98 ${
                          Boolean(settingsFormData.enabled === false)
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5 opacity-50" />
                        <span>Verificação Pausada (Off)</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {Boolean(settingsFormData.enabled !== false)
                        ? 'O sistema consulta o site do GitHub a cada intervalo para assegurar conectividade em tempo real.'
                        : 'A verificação periódica está suspensa; o status não emitirá chamadas fetch ao GitHub em background.'}
                    </p>
                  </div>

                  {/* Telemetria e Histórico Recente Otimizado para Mobile */}
                  {onlineStatusData.history && onlineStatusData.history.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 mb-1.5 font-mono">
                        <span>Últimas medições de ping:</span>
                        <span className="text-[10px]">
                          {onlineStatusData.lastCheckedAt
                            ? `Último: ${new Date(onlineStatusData.lastCheckedAt).toLocaleTimeString()}`
                            : 'Nenhum teste recente'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1 -mx-1 px-1 touch-pan-x scrollbar-thin">
                        {onlineStatusData.history.slice(0, 8).map((ping, idx) => (
                          <div
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 flex items-center gap-1 border ${
                              ping.status === 'online'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                            title={`Status: ${ping.status} | Latência: ${ping.latencyMs}ms | ${new Date(ping.timestamp).toLocaleTimeString()}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${ping.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            ></span>
                            <span>{ping.latencyMs}ms</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {editingSettingsExtension.settingsSchema && editingSettingsExtension.settingsSchema.length > 0 ? (
                editingSettingsExtension.settingsSchema.map((field) => {
                  const currentValue =
                    settingsFormData[field.key] !== undefined
                      ? settingsFormData[field.key]
                      : field.defaultValue;

                  return (
                    <div key={field.key} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {field.label}
                        </label>
                        <span className="text-[10px] font-mono text-slate-400">{field.key}</span>
                      </div>

                      {field.type === 'boolean' ? (
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={Boolean(currentValue)}
                            onChange={(e) =>
                              setSettingsFormData({
                                ...settingsFormData,
                                [field.key]: e.target.checked,
                              })
                            }
                            className="rounded accent-purple-600 w-4 h-4 cursor-pointer"
                          />
                          <span>Ativar este recurso na extensão</span>
                        </label>
                      ) : field.type === 'select' && field.options ? (
                        <select
                          value={String(currentValue)}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              [field.key]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        >
                          {field.options.map((opt) => {
                            const val = typeof opt === 'string' ? opt : String(opt.value);
                            const label = typeof opt === 'string' ? opt : opt.label;
                            return (
                              <option key={val} value={val}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          value={currentValue}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              [field.key]: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(currentValue || '')}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              [field.key]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        />
                      )}

                      {field.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {field.description}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
                  Esta extensão não requer parâmetros adicionais configuráveis.
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[44px] sm:min-h-0 flex items-center justify-center active:scale-98"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!userIsBureaucrat}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition min-h-[44px] sm:min-h-0 flex items-center justify-center active:scale-98 disabled:opacity-50"
                >
                  Salvar Parâmetros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: AUDITORIA DE AÇÕES DE EXTENSÕES                  */}
      {/* ======================================================== */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Histórico & Auditoria de Extensões
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registro permanente de todas as ativações, desativações e instalações por burocratas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {(() => {
                const logs = StorageService.getExtensionActionLogs();
                if (logs.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Nenhum registro de alteração de extensões catalogado até o momento.
                    </div>
                  );
                }

                return logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                            log.action === 'activated'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : log.action === 'deactivated'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : log.action === 'added'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : log.action === 'configured'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {log.action}
                        </span>
                        <strong className="text-slate-900 dark:text-white font-mono">
                          {log.extensionName}
                        </strong>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">{log.details}</p>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Operador: <strong>{log.operatorUsername}</strong> ({log.operatorRole})</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: INSPEÇÃO DE GANCHOS (HOOK REGISTRY AUDIT)        */}
      {/* ======================================================== */}
      {showHooksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Inspeção do Barramento de Ganchos (HookRegistry)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Filtros e ações ativamente registrados pelas extensões no pipeline da enciclopédia.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHooksModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                {extensionManager.getHooksAudit().map((hook, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          hook.type === 'filter'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {hook.type}
                      </span>
                      <strong className="text-slate-900 dark:text-white truncate">
                        {hook.hookName}
                      </strong>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-slate-500 text-[11px]">
                      <span>Extensão: <strong>{hook.extensionName}</strong></span>
                      <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 font-bold">
                        P{hook.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: INSPEÇÃO DETALHADA DE EXTENSÃO                  */}
      {/* ======================================================== */}
      {inspectingExtension && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {inspectingExtension.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    v{inspectingExtension.version} • {getCategoryLabel(inspectingExtension.category)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingExtension(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                  Descrição
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {inspectingExtension.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-0.5">Autor</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectingExtension.author}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-0.5">Status</span>
                  <span className={`font-bold ${inspectingExtension.enabled ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {inspectingExtension.enabled ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-0.5">Tipo</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {inspectingExtension.isCore ? 'Nativa (Core)' : 'Personalizada'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-0.5">Ganchos</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectingExtension.hooks.length}</span>
                </div>
              </div>

              {inspectingExtension.customCss && (
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                    CSS Injetado no DOM
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-950 text-sky-300 font-mono text-[11px] overflow-x-auto max-h-36">
                    {inspectingExtension.customCss}
                  </pre>
                </div>
              )}

              {inspectingExtension.customScript && (
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                    Código do Gancho
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-950 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-48">
                    {inspectingExtension.customScript}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: CONFIRMAR REMOÇÃO PERMANENTE                   */}
      {/* ======================================================== */}
      {extensionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Desinstalar "{extensionToDelete.name}"?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Esta extensão personalizada será removida do sistema e seus ganchos serão permanentemente desvinculados do barramento da enciclopédia.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExtensionToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
              >
                Desinstalar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: AGUARDANDO SINCRONIZAÇÃO EM NUVEM (3.05.3.q.2)  */}
      {/* ======================================================== */}
      {syncProgressModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-blue-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              {syncProgressModal.success ? (
                <Check className="w-7 h-7 text-emerald-500 animate-in zoom-in" />
              ) : (
                <Loader2 className="w-7 h-7 animate-spin text-blue-600 dark:text-blue-400" />
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {syncProgressModal.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                {syncProgressModal.step}
              </p>
            </div>

            <div className="pt-2">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${syncProgressModal.success ? 'bg-emerald-500 w-full' : 'bg-blue-600 animate-pulse w-3/4'} transition-all duration-300`} />
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">
                Gravando na nuvem Firestore para persistir em todas as janelas e computadores...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR EM MANTER ENTRE SINCRONIA E NUVEM       */}
      {/* ======================================================== */}
      {keepSyncConfirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Confirmar em Manter entre Sincronia e Nuvem das Extensões
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                  Prerrogativa Exclusiva de Burocrata
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2.5">
              <p>
                <strong>Regra de Governança Estrita:</strong> Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {keepSyncConfirmModal.description}
              </p>
              <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-indigo-700 dark:text-indigo-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Operador Autenticado: {currentUser?.displayName || currentUser?.username || 'Burocrata'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setKeepSyncConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!userIsBureaucrat || isProcessing}
                onClick={handleExecuteKeepSyncConfirmation}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar em Manter entre Sincronia e Nuvem</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BACKUP GERAL PARA BANCO DE DADOS SQL (3.05.3.aa) */}
      {/* ======================================================== */}
      {showSqlBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Backup Geral para Banco de Dados SQL</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Nativa • Não-Sincronizável com Nuvem
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Arquivo de Configuração: <code className="text-emerald-700 dark:text-emerald-300 font-bold">src/extensions/sql-database-backup/config.ts</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSqlBackupModal(false);
                  setSqlDumpPreview(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Informativo de Governança Burocrata */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span>Regra 3.05.3.aa: Configuração Direta em Arquivo & Exclusividade do Burocrata</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Esta extensão nativa <strong>não sincroniza com o Firebase Firestore</strong>. Seus parâmetros residem diretamente no arquivo do projeto. Somente o <strong>Burocrata</strong> tem permissão para habilitar e desabilitar o backup geral para o banco de dados SQL (PostgreSQL, Cloud SQL, MySQL ou SQLite).
                </p>
              </div>

              {/* Card de Controle Principal: Habilitar / Desabilitar Backup Geral SQL */}
              <div className={`p-4 rounded-2xl border transition-all ${
                sqlBackupConfig.isGeneralBackupEnabled
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${sqlBackupConfig.isGeneralBackupEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Status do Backup Geral SQL: {sqlBackupConfig.isGeneralBackupEnabled ? 'HABILITADO' : 'DESABILITADO'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {sqlBackupConfig.isGeneralBackupEnabled
                        ? 'O backup geral automatizado para o banco SQL está ativo e autorizado pelo Burocrata.'
                        : 'O backup geral para o banco SQL está pausado/desabilitado aguardando autorização do Burocrata.'}
                    </p>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Última autorização: <span className="font-bold">{sqlBackupConfig.bureaucratAuthorization.enabledBy}</span> ({new Date(sqlBackupConfig.bureaucratAuthorization.enabledAt).toLocaleString()})
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      disabled={!userIsBureaucrat}
                      onClick={() => handleToggleSqlGeneralBackup(!sqlBackupConfig.isGeneralBackupEnabled)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2 ${
                        !userIsBureaucrat
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                          : sqlBackupConfig.isGeneralBackupEnabled
                          ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      }`}
                      title={
                        !userIsBureaucrat
                          ? 'Somente o burocrata pode habilitar ou desabilitar o backup geral para o banco de dados SQL.'
                          : sqlBackupConfig.isGeneralBackupEnabled
                          ? 'Clique para desabilitar o backup geral SQL'
                          : 'Clique para habilitar o backup geral SQL'
                      }
                    >
                      {!userIsBureaucrat ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Bloqueado (Requer Burocrata)</span>
                        </>
                      ) : sqlBackupConfig.isGeneralBackupEnabled ? (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          <span>Desabilitar Backup Geral</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Habilitar Backup Geral SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!userIsBureaucrat && (
                  <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Atenção: Somente o burocrata pode confirmar a habilitação ou desabilitação do backup geral SQL.</span>
                  </div>
                )}
              </div>

              {/* Detalhes do Destino Configurado no Arquivo */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Parâmetros Lidos Diretamente do Arquivo config.ts
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Dialeto SQL</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sqlBackupConfig.sqlDialect}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Servidor / Host</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sqlBackupConfig.databaseTarget.host}:{sqlBackupConfig.databaseTarget.port}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Banco de Dados</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sqlBackupConfig.databaseTarget.databaseName} ({sqlBackupConfig.databaseTarget.schema})</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Transações Atômicas</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sqlBackupConfig.useTransactions ? 'BEGIN / COMMIT Ativos' : 'Não'}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Imediata: Gerar / Baixar SQL */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingSqlDump}
                    onClick={handleDownloadSqlBackup}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 cursor-pointer transition disabled:opacity-60"
                  >
                    {isGeneratingSqlDump ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Gerar & Descarregar Arquivo .sql</span>
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingSqlDump}
                    onClick={handlePreviewSqlDump}
                    className="px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Visualizar Script SQL</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  {sqlBackupConfig.lastExecution?.dumpSizeKb ? `${sqlBackupConfig.lastExecution.dumpSizeKb} KB exportados` : 'Pronto para execução'}
                </div>
              </div>

              {/* Prévia do Script SQL */}
              {sqlDumpPreview && (
                <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-400">Prévia do Script SQL Gerado:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(sqlDumpPreview);
                        setFeedback({ type: 'success', message: 'Script SQL copiado para a área de transferência!' });
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar SQL</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-300 custom-scrollbar p-2 bg-slate-950/70 rounded-xl">
                    {sqlDumpPreview.slice(0, 3500)}
                    {sqlDumpPreview.length > 3500 ? '\n\n-- [... script completo truncado para prévia ...]' : ''}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUDITORIA DE SEGURANÇA, ATUALIZAÇÕES E MEMÓRIA (> 200 MB) (3.05.3.ac) */}
      {/* ========================================================================= */}
      {showAuditorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl ${memUsage.isExceeded ? 'bg-rose-600 text-white animate-bounce' : 'bg-blue-600 text-white'} shadow-xs`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Auditoria de Segurança, Atualizações & Memória</span>
                    {memUsage.isExceeded ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                        ALERTA &gt; 200 MB
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Memória Normal
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Extensão: <code className="text-blue-700 dark:text-blue-300 font-bold">ExtensionsSecurityAuditorExtension</code> (Requisito 3.05.3.ac)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditorModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* MONITOR DE MEMÓRIA & ALERTA > 200 MB */}
              <div className={`p-4 rounded-2xl border transition-all ${
                memUsage.isExceeded
                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Activity className={`w-4 h-4 ${memUsage.isExceeded ? 'text-rose-600 animate-spin' : 'text-blue-600'}`} />
                        Consumo de Memória das Extensões em Execução
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      O sistema audita o heap e alerta imediatamente quando a quantidade de memória for maior de 200 MB.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-bold font-mono ${memUsage.isExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {memUsage.usedMB} MB
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono"> / 200 MB</span>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden my-2">
                  <div
                    className={`h-full transition-all duration-300 ${
                      memUsage.isExceeded ? 'bg-rose-600 animate-pulse' : memUsage.usedMB > 150 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (memUsage.usedMB / 200) * 100)}%` }}
                  />
                </div>

                {/* Banner de Alerta Crítico */}
                {memUsage.isExceeded && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-600 text-white font-semibold flex items-center gap-2.5 text-xs animate-pulse">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>
                      ⚠️ ALERTA: Consumo de memória superior a 200 MB detectado ({memUsage.usedMB} MB)! Libere recursos ou desative extensões pesadas.
                    </span>
                  </div>
                )}

                {/* Controles para Teste de Pico de Memória */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <span className="text-slate-500 font-medium">Testar Alerta de Memória:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTestMemorySpike(60)}
                      className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-200 cursor-pointer"
                      title="Simular aumento de 60 MB para ultrapassar 200 MB e disparar o alerta"
                    >
                      +60 MB (Testar Alerta &gt; 200 MB)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestMemorySpike(-60)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 cursor-pointer"
                    >
                      -60 MB
                    </button>
                    {simulatedMemoryOffset > 0 && (
                      <button
                        type="button"
                        onClick={() => handleTestMemorySpike(-simulatedMemoryOffset)}
                        className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                      >
                        Resetar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações de Auditoria e Verificação de Atualizações */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRunSecurityAudit}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 cursor-pointer transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verificar Segurança de Todas as Extensões Carregadas</span>
                </button>

                <div className="text-[11px] text-slate-400 font-mono">
                  {extensionManager.getLoadedExtensions().length} extensões atualmente em execução
                </div>
              </div>

              {/* Tabela de Extensões Carregadas com Auditoria de Segurança e Atualizações */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Extensões Carregadas Atualmente: Auditoria & Atualizações</span>
                  {securityAuditReport && (
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      Pontuação Geral: {securityAuditReport.overallScore}/100 ({securityAuditReport.overallStatus.toUpperCase()})
                    </span>
                  )}
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                  {extensionManager.getLoadedExtensions().map((ext) => {
                    const name = ext.getName();
                    const version = ext.getVersion();
                    const auditItem = securityAuditReport?.items.find((i) => i.name === name);
                    const hasUpdates = auditItem?.hasUpdates;
                    const latest = auditItem?.latestVersion || version;

                    return (
                      <div key={name} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">{name}</span>
                            <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950 px-1.5 py-0.2 rounded">
                              v{version}
                            </span>
                            {hasUpdates ? (
                              <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded flex items-center gap-1">
                                <span>Nova v{latest} disponível</span>
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                                Atualizada
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                            {ext.getDescription?.() || 'Extensão carregada no núcleo'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Segura ({auditItem ? auditItem.securityScore : 100}%)</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3.05.3.ad: Modal de Importação do firebase-applet-config.json em Site Cadastrado */}
      {showConfigImporterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                  <FileDown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Importador de firebase-applet-config.json</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Nativa • Não Sincronizável
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Arquivo de Configuração: <code className="text-amber-700 dark:text-amber-300 font-bold">src/extensions/firebase-applet-config-importer/config.ts</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowConfigImporterModal(false);
                  setImporterStatusMsg(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Informativo de Diretriz 3.05.3.ad */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Globe className="w-4 h-4 text-amber-600" />
                  <span>Requisito 3.05.3.ad: Link Nativo por Arquivo & Não Sincronizável com a Nuvem</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Esta extensão recupera o arquivo oficial <code>firebase-applet-config.json</code> do site cadastrado.
                  O link padrão está registrado diretamente no código do arquivo da extensão (sem sincronização com o Firestore de extensões).
                  O download e a importação utilizam a mesma lógica de recuperação do Firebase (coleção <code>wikizerikey</code>).
                </p>
              </div>

              {/* Status Message Feedback */}
              {importerStatusMsg && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    importerStatusMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : importerStatusMsg.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                      : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {importerStatusMsg.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 shrink-0" />
                    )}
                    <span>{importerStatusMsg.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImporterStatusMsg(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* URL Padrão do Site Cadastrado */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Link Padrão do Site Cadastrado (Requisito 3.05.3.ad):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={importerConfig.registeredSiteUrl}
                    readOnly
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-amber-700 dark:text-amber-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(importerConfig.registeredSiteUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <a
                    href={importerConfig.registeredSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Site</span>
                  </a>
                </div>
              </div>

              {/* UID e Metadados do Firebase Remoto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">UID de Acesso</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {importerConfig.uid}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(importerConfig.uid);
                        setCopiedUid(true);
                        setTimeout(() => setCopiedUid(false), 2000);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {copiedUid ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Coleção Firestore</div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {importerConfig.collectionName}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Arquivo de Saída</div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {importerConfig.fileName}
                  </div>
                </div>
              </div>

              {/* Botões de Ação Principal */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isFetchingConfig}
                  onClick={() => handleFetchImporterConfig()}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition flex items-center gap-2 cursor-pointer"
                >
                  {isFetchingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  <span>Consultar Registro Firebase</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadImporterJson}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar firebase-applet-config.json</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyImporterJson}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Aplicar na Wiki Agora</span>
                </button>
              </div>

              {/* Pré-visualização do Arquivo JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Pré-visualização do JSON (firebase-applet-config.json):
                  </label>
                  {importerResult?.rawJson && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(importerResult.rawJson || '');
                        setCopiedJson(true);
                        setTimeout(() => setCopiedJson(false), 2000);
                      }}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedJson ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedJson ? 'Copiado' : 'Copiar Conteúdo'}</span>
                    </button>
                  )}
                </div>

                <pre className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed max-h-64 overflow-y-auto border border-slate-800 select-all">
                  {importerResult?.rawJson ||
                    JSON.stringify(
                      {
                        status: 'Aguardando consulta...',
                        registeredSiteUrl: importerConfig.registeredSiteUrl,
                        uid: importerConfig.uid,
                        collection: importerConfig.collectionName,
                        fileName: importerConfig.fileName,
                      },
                      null,
                      2
                    )}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Extensão Nativa e Não Sincronizável • Padrão 3.05.3.ad
              </span>
              <button
                type="button"
                onClick={() => setShowConfigImporterModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3.05.9.a: Dispositivo de Segurança para Sincronia de Extensões */}
      <ExtensionSyncSecurityModal
        isOpen={showSyncSecurityModal}
        onClose={() => setShowSyncSecurityModal(false)}
        currentUser={currentUser}
        onRefreshExtensions={refreshList}
      />

      {/* 3.05.9.b: Dispositivo para Verificação de Informações Maliciosas */}
      <ExtensionMalwareScannerModal
        isOpen={showMalwareScannerModal}
        onClose={() => setShowMalwareScannerModal(false)}
        currentUser={currentUser}
        onRefreshExtensions={refreshList}
      />
    </div>
  );
};
