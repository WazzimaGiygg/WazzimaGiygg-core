import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  HardDrive,
  Shield,
  UploadCloud,
  Download,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Layers,
  Settings,
  DollarSign,
  Key,
  Globe,
  Lock,
  FileCode,
  Sparkles,
  Server,
  Trash2,
  Bell,
  Eye,
  Plus,
  X,
  Database,
  Activity,
} from 'lucide-react';
import {
  FirebaseConsoleConfig,
  FirebaseBackupRecord,
  FirebasePlanTier,
  UserProfile,
  WikiPage,
  WikiArticle,
} from '../types';
import {
  FirebaseConsoleSettingsService,
  DEFAULT_FIREBASE_CONSOLE_CONFIG,
} from '../services/firebaseConsoleSettingsService';
import { FirebaseUsageTelemetryCard } from './FirebaseUsageTelemetryCard';
import { firebaseConfig as baseAppletConfig } from '../../firebase';

interface FirebaseConsoleManagerProps {
  currentUser: UserProfile | null;
  pages: WikiPage[];
  articles: WikiArticle[];
  initialSubTab?: 'backup' | 'billing' | 'firestore' | 'auth' | 'storage' | 'appcheck' | 'functions' | 'logs' | 'telemetry';
}

export const FirebaseConsoleManager: React.FC<FirebaseConsoleManagerProps> = ({
  currentUser,
  pages,
  articles,
  initialSubTab = 'backup',
}) => {
  const [subTab, setSubTab] = useState<'backup' | 'billing' | 'firestore' | 'auth' | 'storage' | 'appcheck' | 'functions' | 'logs' | 'telemetry'>(initialSubTab);
  const [config, setConfig] = useState<FirebaseConsoleConfig>(DEFAULT_FIREBASE_CONSOLE_CONFIG);
  const [backupRecords, setBackupRecords] = useState<FirebaseBackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Estados de Operação de Backup
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const [backupNotes, setBackupNotes] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Estados de Restauração
  const [restoreJsonInput, setRestoreJsonInput] = useState('');
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Visualizador de Snapshot
  const [inspectedBackup, setInspectedBackup] = useState<FirebaseBackupRecord | null>(null);

  // Novo domínio para Auth
  const [newDomainInput, setNewDomainInput] = useState('');

  // Novo e-mail de alerta
  const [newAlertEmailInput, setNewAlertEmailInput] = useState('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'moderador' || currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const loadedConfig = await FirebaseConsoleSettingsService.getConfig();
      const records = await FirebaseConsoleSettingsService.getBackupHistory();
      setConfig(loadedConfig);
      setBackupRecords(records);
    } catch (e) {
      console.warn('Erro ao carregar dados do console Firebase:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig: FirebaseConsoleConfig) => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const saved = await FirebaseConsoleSettingsService.saveConfig(
        newConfig,
        currentUser?.username || currentUser?.displayName || currentUser?.email || 'Administrador'
      );
      setConfig(saved);
      setSaveFeedback('Configurações salvas e aplicadas com sucesso!');
      setTimeout(() => setSaveFeedback(null), 3500);
    } catch (err: any) {
      setSaveFeedback(`Erro ao salvar: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePlan = (plan: FirebasePlanTier) => {
    const updated = {
      ...config,
      plan,
      backupSchedule: {
        ...config.backupSchedule,
        // Ao ativar Blaze, habilita backups e PITR por padrão
        enabled: plan === 'blaze' ? true : config.backupSchedule.enabled,
        enablePitr: plan === 'blaze' ? true : false,
      },
    };
    handleSaveConfig(updated);
  };

  const handleTriggerManualBackup = async () => {
    setIsGeneratingBackup(true);
    try {
      const result = await FirebaseConsoleSettingsService.triggerInstantBackup(
        currentUser,
        config.plan,
        backupNotes || 'Snapshot manual gerado pelo painel administrativo da Wiki.'
      );

      // Baixa o arquivo JSON diretamente para o computador do administrador
      const blob = new Blob([result.jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wikiworldweb-firebase-backup-${result.record.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Atualiza lista local
      setBackupRecords([result.record, ...backupRecords]);
      setBackupNotes('');
      alert(`Backup snapshot gerado com sucesso! Protocolo: ${result.record.id} (${(result.record.sizeBytes / 1024).toFixed(1)} KB)`);
    } catch (err: any) {
      alert(`Falha ao gerar backup: ${err?.message || err}`);
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja remover este registro do histórico de backups?')) return;
    await FirebaseConsoleSettingsService.deleteBackupRecord(id);
    setBackupRecords(backupRecords.filter((b) => b.id !== id));
  };

  const handleRestoreSnapshot = async () => {
    if (!restoreJsonInput.trim()) {
      alert('Insira o conteúdo JSON do snapshot para restauração.');
      return;
    }
    if (!window.confirm('ATENÇÃO: A restauração pode mesclar ou sobrepor dados atuais das coleções. Deseja prosseguir com a importação?')) {
      return;
    }
    setIsRestoring(true);
    setRestoreFeedback(null);
    try {
      const res = await FirebaseConsoleSettingsService.restoreSnapshotData(
        restoreJsonInput,
        currentUser?.username || currentUser?.email || 'Administrador'
      );
      setRestoreFeedback(res);
      if (res.success) {
        await loadData();
      }
    } catch (err: any) {
      setRestoreFeedback({ success: false, message: `Erro fatal: ${err?.message || err}` });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddDomain = () => {
    if (!newDomainInput.trim()) return;
    const domain = newDomainInput.trim().toLowerCase();
    if (config.authSettings.authorizedDomains.includes(domain)) {
      alert('Este domínio já está na lista autorizada.');
      return;
    }
    const updated = {
      ...config,
      authSettings: {
        ...config.authSettings,
        authorizedDomains: [...config.authSettings.authorizedDomains, domain],
      },
    };
    handleSaveConfig(updated);
    setNewDomainInput('');
  };

  const handleRemoveDomain = (domain: string) => {
    const updated = {
      ...config,
      authSettings: {
        ...config.authSettings,
        authorizedDomains: config.authSettings.authorizedDomains.filter((d) => d !== domain),
      },
    };
    handleSaveConfig(updated);
  };

  const handleAddAlertEmail = () => {
    if (!newAlertEmailInput.trim()) return;
    const email = newAlertEmailInput.trim();
    if (config.billingAlertEmails.includes(email)) return;
    const updated = {
      ...config,
      billingAlertEmails: [...config.billingAlertEmails, email],
    };
    handleSaveConfig(updated);
    setNewAlertEmailInput('');
  };

  const handleRemoveAlertEmail = (email: string) => {
    const updated = {
      ...config,
      billingAlertEmails: config.billingAlertEmails.filter((e) => e !== email),
    };
    handleSaveConfig(updated);
  };

  const isBlazeActive = config.plan === 'blaze';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Plan Selector */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${isBlazeActive ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'}`}>
              {isBlazeActive ? <Flame size={26} className="animate-pulse" /> : <Zap size={26} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Console de Configurações do Firebase & Backups
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isBlazeActive
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isBlazeActive ? 'Plano Blaze (Ativo)' : 'Plano Spark (Gratuito)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isBlazeActive
                  ? 'Recursos avançados habilitados: Backups automáticos via Cloud Scheduler, PITR (7 dias), exportações contínuas GCS e limites escaláveis.'
                  : 'Plano gratuito do Google Cloud ativo. Backups automáticos e PITR em nível de infraestrutura GCP necessitam de faturamento Blaze.'}
              </p>
            </div>
          </div>

          {/* Plan Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 self-stretch sm:self-auto">
            <button
              onClick={() => handleTogglePlan('spark')}
              disabled={isSaving}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                config.plan === 'spark'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Zap size={13} />
              <span>Plano Spark</span>
            </button>
            <button
              onClick={() => handleTogglePlan('blaze')}
              disabled={isSaving}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                config.plan === 'blaze'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <Flame size={13} />
              <span>Plano Blaze (Recomendado)</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {saveFeedback && (
          <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-0.5">
        {[
          { id: 'backup', label: 'Backups Automáticos & PITR', icon: HardDrive, badge: isBlazeActive ? 'BLAZE' : 'REQUER BLAZE' },
          { id: 'telemetry', label: 'Leituras, Gravações & Memória', icon: Activity, badge: 'TELEMETRIA' },
          { id: 'billing', label: 'Plano, Cotas & Orçamento', icon: DollarSign },
          { id: 'firestore', label: 'Cloud Firestore DB', icon: Database },
          { id: 'auth', label: 'Autenticação & Domínios', icon: Lock },
          { id: 'storage', label: 'Cloud Storage & Mídia', icon: UploadCloud },
          { id: 'appcheck', label: 'App Check & Defesa', icon: Shield },
          { id: 'functions', label: 'Cloud Functions & Scheduler', icon: Server },
          { id: 'logs', label: 'Logs & Auditoria', icon: FileCode },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t flex items-center gap-1.5 transition border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold ${isBlazeActive ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* ======================================================== */}
      {/* SUBTAB 1: BACKUPS AUTOMÁTICOS & PITR (PLANO BLAZE) */}
      {/* ======================================================== */}
      {subTab === 'backup' && (
        <div className="space-y-6">
          {/* Blaze Feature Warning/Incentive if on Spark */}
          {!isBlazeActive && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/40 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    O Plano Spark (Gratuito) não suporta Backups Nativos Agendados no GCP
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    A política de infraestrutura do Google Cloud e Firebase requer que o projeto esteja no <strong>Plano Blaze (Pay-as-you-go)</strong> para executar tarefas agendadas via Cloud Scheduler, exportar periodicamente para o Google Cloud Storage e habilitar o <strong>PITR (Point-in-Time Recovery)</strong> de 7 dias. No plano Spark, você pode gerar snapshots manuais sob demanda no Wiki.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 pl-7">
                <button
                  onClick={() => handleTogglePlan('blaze')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Flame size={13} />
                  <span>Ativar Plano Blaze no Wiki Agora</span>
                </button>
              </div>
            </div>
          )}

          {/* Backup Schedule Configuration Card */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" />
                  <span>Configuração da Rotina de Backup Automático</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Defina o agendamento de exportações automáticas para o Google Cloud Storage com retenção e PITR.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {config.backupSchedule.enabled ? 'Rotina Habilitada' : 'Rotina Desativada'}
                </span>
                <input
                  type="checkbox"
                  checked={config.backupSchedule.enabled}
                  disabled={!isAdmin || (!isBlazeActive && config.backupSchedule.enabled)}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      backupSchedule: {
                        ...config.backupSchedule,
                        enabled: e.target.checked,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Frequência */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Frequência de Execução
                </label>
                <select
                  value={config.backupSchedule.frequency}
                  disabled={!isAdmin || !config.backupSchedule.enabled}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      backupSchedule: {
                        ...config.backupSchedule,
                        frequency: e.target.value as any,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="every_6h">A cada 6 horas (Alta Criticidade)</option>
                  <option value="every_12h">A cada 12 horas</option>
                  <option value="daily">Diário (Recomendado - 03:00 BRT)</option>
                  <option value="weekly">Semanal (Todo domingo)</option>
                  <option value="monthly">Mensal (Primeiro dia do mês)</option>
                </select>
                <span className="text-[10px] text-slate-400">Trigger gerenciado pelo Cloud Scheduler via cron.</span>
              </div>

              {/* Horário de Execução */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Horário de Disparo (UTC-3 / Brasília)
                </label>
                <input
                  type="time"
                  value={config.backupSchedule.timeOfDay}
                  disabled={!isAdmin || !config.backupSchedule.enabled}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      backupSchedule: {
                        ...config.backupSchedule,
                        timeOfDay: e.target.value,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400">Recomendado período de menor tráfego de edições.</span>
              </div>

              {/* Período de Retenção */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Período de Retenção no GCS
                </label>
                <select
                  value={config.backupSchedule.retentionDays}
                  disabled={!isAdmin || !config.backupSchedule.enabled}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      backupSchedule: {
                        ...config.backupSchedule,
                        retentionDays: Number(e.target.value),
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-amber-500"
                >
                  <option value={7}>7 dias</option>
                  <option value={14}>14 dias</option>
                  <option value={30}>30 dias (Padrão corporativo)</option>
                  <option value={90}>90 dias (Trimestral)</option>
                  <option value={365}>365 dias (Anual de conformidade)</option>
                </select>
                <span className="text-[10px] text-slate-400">Objetos mais antigos são descartados pelo ciclo de vida GCS.</span>
              </div>
            </div>

            {/* Bucket de Destino GCS */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Bucket de Destino no Google Cloud Storage</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                  gs://[bucket-name]
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.backupSchedule.gcsBucketUri}
                  disabled={!isAdmin || !config.backupSchedule.enabled}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      backupSchedule: {
                        ...config.backupSchedule,
                        gcsBucketUri: e.target.value,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  placeholder="gs://ai-studio-wikizeroenciclop-0a14dc90-3ab3-47bc-8306-ca5bc2953699-backups"
                  className="flex-1 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={() => handleCopy(config.backupSchedule.gcsBucketUri, 'bucketUri')}
                  className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  title="Copiar URI do Bucket"
                >
                  {copiedKey === 'bucketUri' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* PITR & Advanced Options */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <RotateCcw size={16} className="text-amber-600 dark:text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Point-in-Time Recovery (PITR - Recuperação Contínua)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Permite recuperar o estado de qualquer coleção ou documento para qualquer microssegundo nos últimos 7 dias.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.backupSchedule.enablePitr && isBlazeActive}
                    disabled={!isAdmin || !isBlazeActive}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        backupSchedule: {
                          ...config.backupSchedule,
                          enablePitr: e.target.checked,
                        },
                      };
                      handleSaveConfig(updated);
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {config.backupSchedule.enablePitr && isBlazeActive ? 'PITR Ativo' : 'PITR Inativo'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.backupSchedule.enableCompression}
                    disabled={!isAdmin}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        backupSchedule: {
                          ...config.backupSchedule,
                          enableCompression: e.target.checked,
                        },
                      };
                      handleSaveConfig(updated);
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Compressão GZIP (.json.gz / economiza até 75% de tráfego)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.backupSchedule.enableKmsEncryption}
                    disabled={!isAdmin}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        backupSchedule: {
                          ...config.backupSchedule,
                          enableKmsEncryption: e.target.checked,
                        },
                      };
                      handleSaveConfig(updated);
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Criptografia Gerenciada pelo Google (Cloud KMS / AES-256)</span>
                </label>
              </div>
            </div>

            {/* E-mail de Notificação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  E-mail para Relatório de Execução de Backup
                </label>
                <input
                  type="email"
                  value={config.backupSchedule.notificationEmail}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      backupSchedule: {
                        ...config.backupSchedule,
                        notificationEmail: e.target.value,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.backupSchedule.notificationOnSuccess}
                    disabled={!isAdmin}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        backupSchedule: {
                          ...config.backupSchedule,
                          notificationOnSuccess: e.target.checked,
                        },
                      };
                      handleSaveConfig(updated);
                    }}
                    className="w-3.5 h-3.5 rounded text-amber-600"
                  />
                  <span>Notificar no Sucesso</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.backupSchedule.notificationOnFailure}
                    disabled={!isAdmin}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        backupSchedule: {
                          ...config.backupSchedule,
                          notificationOnFailure: e.target.checked,
                        },
                      };
                      handleSaveConfig(updated);
                    }}
                    className="w-3.5 h-3.5 rounded text-amber-600"
                  />
                  <span>Alertar em caso de Falha</span>
                </label>
              </div>
            </div>
          </div>

          {/* Manual Snapshot Trigger & Restore Card */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download size={16} className="text-emerald-500" />
                  <span>Gerar Snapshot Manual Sob Demanda</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exporta imediatamente o estado atual de todas as coleções do Firestore para download de segurança.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRestoreModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <UploadCloud size={14} className="text-blue-500" />
                  <span>Restaurar de Arquivo JSON</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                value={backupNotes}
                onChange={(e) => setBackupNotes(e.target.value)}
                placeholder="Observações do backup (opcional, ex: 'Snapshot antes da migração de verão 2026')"
                className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleTriggerManualBackup}
                disabled={isGeneratingBackup || !isAdmin}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 shrink-0"
              >
                {isGeneratingBackup ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Compilando Snapshot...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Gerar Snapshot & Baixar JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Backup History Table */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar size={16} className="text-amber-500" />
                  <span>Histórico de Snapshots e Backups Registrados</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registros de execuções automáticas do Cloud Scheduler e snapshots sob demanda.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Total: <strong>{backupRecords.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    <th className="p-3">Protocolo / Hash</th>
                    <th className="p-3">Tipo & Plano</th>
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Tamanho</th>
                    <th className="p-3">Coleções</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {backupRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                        {record.id}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${record.type === 'automatic_scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : record.type === 'pitr_export' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                            {record.type === 'automatic_scheduled' ? 'AGENDADO' : record.type === 'pitr_export' ? 'PITR' : 'MANUAL'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {record.plan}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                        {new Date(record.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                        {(record.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          {Object.keys(record.collectionCounts).length} coleções
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {record.status === 'completed' ? 'Concluído' : record.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectedBackup(record)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Inspecionar Detalhes"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(record.id)}
                            disabled={!isAdmin}
                            className="p-1 rounded text-rose-400 hover:text-rose-600"
                            title="Excluir Registro"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB TELEMETRIA: LEITURAS, GRAVAÇÕES E MEMÓRIA USADA */}
      {/* ======================================================== */}
      {subTab === 'telemetry' && (
        <FirebaseUsageTelemetryCard
          articles={articles}
          pages={pages}
          currentUser={currentUser}
          onRefresh={loadData}
        />
      )}

      {/* ======================================================== */}
      {/* SUBTAB 2: PLANO, COTAS & ORÇAMENTO */}
      {/* ======================================================== */}
      {subTab === 'billing' && (
        <div className="space-y-6">
          {/* Card Dinâmico de Telemetria de Leituras, Gravações e Memória */}
          <FirebaseUsageTelemetryCard
            compact={true}
            articles={articles}
            pages={pages}
            currentUser={currentUser}
            onRefresh={loadData}
          />

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign size={16} className="text-amber-500" />
                <span>Gestão Financeira, Limites Orçamentários e Alertas</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina tetos de gastos para o projeto Firebase e cadastre notificações automáticas para prevenir cobranças surpresa.
              </p>
            </div>

            {/* Budget Cap & Alert Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Orçamento Máximo Mensal Estimado (USD)
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-mono font-bold">$</span>
                  <input
                    type="number"
                    value={config.monthlyBudgetLimitUsd}
                    disabled={!isAdmin}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        monthlyBudgetLimitUsd: Number(e.target.value),
                      };
                      handleSaveConfig(updated);
                    }}
                    className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Gatilho de alerta financeiro ao atingir 50%, 80% e 100% deste limite.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  E-mails para Alertas Financeiros
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={newAlertEmailInput}
                    onChange={(e) => setNewAlertEmailInput(e.target.value)}
                    placeholder="Adicionar e-mail para avisos de cota..."
                    className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleAddAlertEmail}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {config.billingAlertEmails.map((em) => (
                    <span
                      key={em}
                      className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1"
                    >
                      <span>{em}</span>
                      <button onClick={() => handleRemoveAlertEmail(em)} className="text-slate-400 hover:text-rose-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 3: CLOUD FIRESTORE DB */}
      {/* ======================================================== */}
      {subTab === 'firestore' && (
        <div className="space-y-6">
          {/* Card Dinâmico de Telemetria de Leituras, Gravações e Memória */}
          <FirebaseUsageTelemetryCard
            compact={true}
            articles={articles}
            pages={pages}
            currentUser={currentUser}
            onRefresh={loadData}
          />

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database size={16} className="text-amber-500" />
                <span>Configurações do Cloud Firestore</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Localização, banco padrão, persistência de cache do navegador e índices compostos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Database ID
                </label>
                <input
                  type="text"
                  value={config.firestoreSettings.databaseId}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      firestoreSettings: {
                        ...config.firestoreSettings,
                        databaseId: e.target.value,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5"
                />
                <span className="text-[10px] text-slate-400">Padrão: <code>(default)</code>. Suporta múltiplos bancos no plano Blaze.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Região Cloud do Banco
                </label>
                <input
                  type="text"
                  value={config.firestoreSettings.region}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      firestoreSettings: {
                        ...config.firestoreSettings,
                        region: e.target.value,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5"
                />
              </div>
            </div>

            {/* Cache & Offline Mode */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Persistência Offline IndexedDB & Cache
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Mantém cópia local dos artigos lidos para navegação sem conexão e resposta instantânea.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.firestoreSettings.enableOfflineCache}
                    disabled={!isAdmin}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        firestoreSettings: {
                          ...config.firestoreSettings,
                          enableOfflineCache: e.target.checked,
                        },
                      };
                      handleSaveConfig(updated);
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {config.firestoreSettings.enableOfflineCache ? 'Habilitado' : 'Desabilitado'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 4: AUTENTICAÇÃO & DOMÍNIOS */}
      {/* ======================================================== */}
      {subTab === 'auth' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock size={16} className="text-amber-500" />
                <span>Configurações do Firebase Authentication</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provedores de login, políticas de segurança de senha e lista de domínios autorizados para redirecionamento OAuth.
              </p>
            </div>

            {/* Provedores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.authSettings.allowEmailPassword}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      authSettings: {
                        ...config.authSettings,
                        allowEmailPassword: e.target.checked,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">E-mail & Senha</span>
              </label>

              <label className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.authSettings.allowGoogleAuth}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      authSettings: {
                        ...config.authSettings,
                        allowGoogleAuth: e.target.checked,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Google OAuth 2.0</span>
              </label>

              <label className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.authSettings.allowAnonymous}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      authSettings: {
                        ...config.authSettings,
                        allowAnonymous: e.target.checked,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Acesso Anônimo (Guest)</span>
              </label>
            </div>

            {/* Domínios Autorizados */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Domínios Autorizados (Authorized Domains)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Apenas requisições OAuth originadas destes domínios são aceitas pelo Firebase Auth.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  placeholder="ex: meuwiki.meudominio.com"
                  className="flex-1 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2"
                />
                <button
                  onClick={handleAddDomain}
                  className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                >
                  Adicionar Domínio
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {config.authSettings.authorizedDomains.map((dom) => (
                  <div
                    key={dom}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{dom}</span>
                    <button
                      onClick={() => handleRemoveDomain(dom)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Remover Domínio"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 5: CLOUD STORAGE & MÍDIA */}
      {/* ======================================================== */}
      {subTab === 'storage' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud size={16} className="text-amber-500" />
                <span>Cloud Storage para Mídia e Arquivos</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configurações de bucket para imagens de artigos, uploads da comunidade e políticas CORS.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Bucket Principal
                </label>
                <input
                  type="text"
                  value={config.storageSettings.bucketUri}
                  disabled
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 p-2.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tamanho Máximo de Upload por Arquivo
                </label>
                <select
                  value={config.storageSettings.maxUploadSizeBytes}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      storageSettings: {
                        ...config.storageSettings,
                        maxUploadSizeBytes: Number(e.target.value),
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5"
                >
                  <option value={2097152}>2 MB (Restrito)</option>
                  <option value={5242880}>5 MB (Padrão)</option>
                  <option value={10485760}>10 MB (Recomendado para Mídia)</option>
                  <option value={26214400}>25 MB (Documentos Grandes)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 6: APP CHECK */}
      {/* ======================================================== */}
      {subTab === 'appcheck' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={16} className="text-amber-500" />
                <span>Firebase App Check & Proteção de API</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atestação de clientes via reCAPTCHA v3 / Enterprise para impedir scripts maliciosos e raspagem não autorizada.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Provedor de Atestação
                </label>
                <select
                  value={config.appCheckSettings.provider}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      appCheckSettings: {
                        ...config.appCheckSettings,
                        provider: e.target.value as any,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5"
                >
                  <option value="recaptcha_v3">reCAPTCHA v3 (Google)</option>
                  <option value="recaptcha_enterprise">reCAPTCHA Enterprise</option>
                  <option value="debug">Debug Token (Desenvolvimento)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Modo de Imposição (Enforcement)
                </label>
                <select
                  value={config.appCheckSettings.enforcementMode}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      appCheckSettings: {
                        ...config.appCheckSettings,
                        enforcementMode: e.target.value as any,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5"
                >
                  <option value="monitoring">Monitoramento (Sem bloqueio de requisições)</option>
                  <option value="enforced">Imposto / Bloqueio Ativo (Rejeita sem token válido)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 7: CLOUD FUNCTIONS & SCHEDULER */}
      {/* ======================================================== */}
      {subTab === 'functions' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server size={16} className="text-amber-500" />
                <span>Cloud Functions & Cloud Scheduler</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gatilhos de backend serverless e rotinas automáticas do sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500">Tempo Limite (Timeout)</span>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {config.functionsSettings.defaultTimeoutSeconds}s
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500">Memória Alocada</span>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {config.functionsSettings.defaultMemoryMb} MB
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500">Ambiente de Execução</span>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {config.functionsSettings.nodeVersion}
                </p>
              </div>
            </div>

            {/* Funções do Cloud Scheduler */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Gatilhos Agendados Ativos
              </h4>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                    scheduledFirestoreBackupDaily
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cron: <code>0 3 * * *</code> • Exportação automática do Firestore para GCS
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.backupSchedule.enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                  {config.backupSchedule.enabled ? 'ATIVO' : 'PAUSADO'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 8: LOGS & AUDITORIA */}
      {/* ======================================================== */}
      {subTab === 'logs' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode size={16} className="text-amber-500" />
                <span>Cloud Logging & Monitoramento de Integridade</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Retenção de logs administrativos, telemetria de consultas e auditoria de conformidade.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nível Mínimo de Registro
                </label>
                <select
                  value={config.loggingSettings.logLevel}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      loggingSettings: {
                        ...config.loggingSettings,
                        logLevel: e.target.value as any,
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5"
                >
                  <option value="debug">DEBUG (Diagnóstico detalhado)</option>
                  <option value="info">INFO (Padrão recomendado)</option>
                  <option value="warn">WARN (Avisos e exceções)</option>
                  <option value="error">ERROR (Falhas críticas)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dias de Retenção de Logs
                </label>
                <select
                  value={config.loggingSettings.retentionDays}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      loggingSettings: {
                        ...config.loggingSettings,
                        retentionDays: Number(e.target.value),
                      },
                    };
                    handleSaveConfig(updated);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5"
                >
                  <option value={14}>14 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={60}>60 dias</option>
                  <option value={90}>90 dias</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Restauração de Arquivo JSON */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud size={16} className="text-blue-500" />
                <span>Restaurar Dados a partir de Snapshot JSON</span>
              </h3>
              <button
                onClick={() => setRestoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Cole abaixo o conteúdo integral do arquivo <code>.json</code> exportado anteriormente ou carregue o arquivo para validação e restauração.
            </p>

            <textarea
              value={restoreJsonInput}
              onChange={(e) => setRestoreJsonInput(e.target.value)}
              rows={8}
              placeholder='{ "_metadata": { ... }, "collections": { ... } }'
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />

            {restoreFeedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  restoreFeedback.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {restoreFeedback.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{restoreFeedback.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRestoreModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestoreSnapshot}
                disabled={isRestoring || !restoreJsonInput.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                {isRestoring ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                <span>Validar & Restaurar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Inspeção de Snapshot */}
      {inspectedBackup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {inspectedBackup.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectedBackup(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block text-[10px]">Data de Execução</span>
                  <span className="font-mono font-bold">{new Date(inspectedBackup.timestamp).toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block text-[10px]">Tamanho do Arquivo</span>
                  <span className="font-mono font-bold">{(inspectedBackup.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px]">SHA-256 Checksum</span>
                <span className="font-mono text-[10px] break-all">{inspectedBackup.checksumSha256}</span>
              </div>

              {inspectedBackup.gcsPath && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">Caminho GCS (Cloud Storage)</span>
                  <span className="font-mono text-[10px] break-all text-blue-600 dark:text-blue-400">
                    {inspectedBackup.gcsPath}
                  </span>
                </div>
              )}

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-1.5">
                <span className="text-slate-400 block text-[10px]">Contagem por Coleção</span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  {Object.entries(inspectedBackup.collectionCounts).map(([col, cnt]) => (
                    <div key={col} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-0.5">
                      <span>{col}:</span>
                      <strong>{cnt} docs</strong>
                    </div>
                  ))}
                </div>
              </div>

              {inspectedBackup.notes && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">Notas do Operador</span>
                  <p className="text-slate-700 dark:text-slate-300">{inspectedBackup.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedBackup(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
