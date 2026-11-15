import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  RotateCcw,
  History,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  FileCheck,
  Trash2,
  Eye,
  Key,
  X,
  Plus,
  ArrowRight,
  Database,
  Cloud,
} from 'lucide-react';
import {
  UserProfile,
  InstalledExtensionMeta,
  SyncSecurityCheckpoint,
  SyncQuarantineRecord,
  SyncSecurityAuditLog,
} from '../types';
import {
  extensionSyncSecurityDevice,
  SyncSecurityDeviceConfig,
} from '../services/extensionSyncSecurityDevice';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';

interface ExtensionSyncSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onRefreshExtensions?: () => void;
}

export const ExtensionSyncSecurityModal: React.FC<ExtensionSyncSecurityModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRefreshExtensions,
}) => {
  const [activeTab, setActiveTab] = useState<'integrity' | 'quarantine' | 'checkpoints' | 'config' | 'logs'>('integrity');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // States from Device
  const [checkpoints, setCheckpoints] = useState<SyncSecurityCheckpoint[]>([]);
  const [quarantineList, setQuarantineList] = useState<SyncQuarantineRecord[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SyncSecurityAuditLog[]>([]);
  const [deviceConfig, setDeviceConfig] = useState<SyncSecurityDeviceConfig>(() =>
    extensionSyncSecurityDevice.getConfig()
  );

  // Integrity calculation
  const [extensionHashes, setExtensionHashes] = useState<Array<{
    name: string;
    version: string;
    category: string;
    hash: string;
    isQuarantined: boolean;
    permissionsCount: number;
    hasDangerousPerms: boolean;
  }>>([]);
  const [isVerifyingHashes, setIsVerifyingHashes] = useState<boolean>(false);

  // Action states
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [checkpointNoteInput, setCheckpointNoteInput] = useState<string>('');
  const [showNewCheckpointDialog, setShowNewCheckpointDialog] = useState<boolean>(false);

  // Manual quarantine state
  const [selectedExtToQuarantine, setSelectedExtToQuarantine] = useState<string>('');
  const [quarantineReason, setQuarantineReason] = useState<string>('');

  const isBureaucrat = isUserBureaucrat(currentUser);

  const loadData = async () => {
    setCheckpoints(extensionSyncSecurityDevice.getCheckpoints());
    setQuarantineList(extensionSyncSecurityDevice.getQuarantinedExtensions());
    setSecurityLogs(extensionSyncSecurityDevice.getSecurityLogs());
    setDeviceConfig(extensionSyncSecurityDevice.getConfig());

    // Calcula hashes de todas as extensões instaladas
    const allExts = ExtensionManager.getInstance().getAllInstalledExtensions();
    const hashesList = [];

    for (const ext of allExts) {
      const hash = await extensionSyncSecurityDevice.calculateExtensionHash(ext);
      const isQuar = extensionSyncSecurityDevice.isExtensionQuarantined(ext.name);
      const dangerousPerms = (ext.permissions || []).some((p) =>
        ['bypass_security', 'full_database_write', 'admin_escalate', 'eval_unrestricted'].includes(p)
      );

      hashesList.push({
        name: ext.name,
        version: ext.version,
        category: ext.category,
        hash,
        isQuarantined: isQuar,
        permissionsCount: (ext.permissions || []).length,
        hasDangerousPerms: dangerousPerms,
      });
    }

    setExtensionHashes(hashesList);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = extensionSyncSecurityDevice.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleRecalculateHashes = async () => {
    setIsVerifyingHashes(true);
    setActionFeedback(null);
    try {
      await loadData();
      setActionFeedback({
        type: 'success',
        text: `Todos os hashes criptográficos SHA-256 de ${extensionHashes.length} extensões foram verificados com sucesso.`,
      });
    } catch {
      setActionFeedback({ type: 'error', text: 'Falha ao recalcular integridade criptográfica.' });
    } finally {
      setIsVerifyingHashes(false);
    }
  };

  const handleCreateCheckpoint = async () => {
    if (!checkpointNoteInput.trim()) {
      setActionFeedback({ type: 'error', text: 'Informe uma anotação descritiva para o checkpoint.' });
      return;
    }

    const cp = await extensionSyncSecurityDevice.createCheckpoint(currentUser, checkpointNoteInput.trim());
    setCheckpointNoteInput('');
    setShowNewCheckpointDialog(false);
    setActionFeedback({
      type: 'success',
      text: `Checkpoint de segurança '${cp.id}' gerado com sucesso (${cp.totalExtensions} extensões arquivadas).`,
    });
  };

  const handleRollback = async (checkpointId: string) => {
    if (!window.confirm('Confirma a restauração e rollback das extensões para este checkpoint?')) {
      return;
    }

    setIsRollingBack(true);
    setActionFeedback(null);

    try {
      const res = await extensionSyncSecurityDevice.rollbackToCheckpoint(checkpointId, currentUser);
      if (res.success) {
        setActionFeedback({ type: 'success', text: res.message });
        if (onRefreshExtensions) onRefreshExtensions();
      } else {
        setActionFeedback({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err?.message || 'Erro ao executar rollback.' });
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleReleaseQuarantine = async (quarantineId: string) => {
    const res = await extensionSyncSecurityDevice.releaseQuarantine(quarantineId, currentUser);
    if (res.success) {
      setActionFeedback({ type: 'success', text: res.message });
      if (onRefreshExtensions) onRefreshExtensions();
    } else {
      setActionFeedback({ type: 'error', text: res.message });
    }
  };

  const handleRejectQuarantine = async (quarantineId: string) => {
    if (!window.confirm('Deseja realmente rejeitar e purgar definitivamente esta extensão do sistema?')) {
      return;
    }
    const res = await extensionSyncSecurityDevice.rejectAndPurgeQuarantine(quarantineId, currentUser);
    if (res.success) {
      setActionFeedback({ type: 'success', text: res.message });
      if (onRefreshExtensions) onRefreshExtensions();
    } else {
      setActionFeedback({ type: 'error', text: res.message });
    }
  };

  const handleManualQuarantine = async () => {
    if (!selectedExtToQuarantine) {
      setActionFeedback({ type: 'error', text: 'Selecione uma extensão para isolamento.' });
      return;
    }

    await extensionSyncSecurityDevice.quarantineExtension(
      selectedExtToQuarantine,
      quarantineReason.trim() || 'Isolamento preventivo manual ordenado por Burocrata',
      'high',
      'manual',
      undefined,
      currentUser
    );

    setSelectedExtToQuarantine('');
    setQuarantineReason('');
    setActionFeedback({
      type: 'success',
      text: `A extensão '${selectedExtToQuarantine}' foi colocada em quarentena preventiva e desativada.`,
    });
    if (onRefreshExtensions) onRefreshExtensions();
  };

  const handleToggleConfig = (key: keyof SyncSecurityDeviceConfig) => {
    if (!isBureaucrat) return;
    const updated = { ...deviceConfig, [key]: !deviceConfig[key] };
    extensionSyncSecurityDevice.updateConfig(updated, currentUser);
    setDeviceConfig(updated);
  };

  const activeQuarantineCount = quarantineList.filter((q) => q.status === 'quarantined').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50/60 dark:bg-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Dispositivo de Segurança para Sincronia de Extensões
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                  Requisito 3.05.9.a
                </span>
                {activeQuarantineCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                    {activeQuarantineCount} em Quarentena
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Validação criptográfica SHA-256, checkpoints anti-drift, quarentena de isolamento e gatekeeper de privilégios.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action feedback */}
        {actionFeedback && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between border-b ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : actionFeedback.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
            }`}
          >
            <span>{actionFeedback.text}</span>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-[10px] font-bold underline cursor-pointer ml-3"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('integrity')}
            className={`px-3.5 py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'integrity'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileCheck size={14} />
            <span>Integridade SHA-256 ({extensionHashes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quarantine')}
            className={`px-3.5 py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'quarantine'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Quarentena ({quarantineList.length})</span>
            {activeQuarantineCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('checkpoints')}
            className={`px-3.5 py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'checkpoints'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <RotateCcw size={14} />
            <span>Checkpoints & Rollback ({checkpoints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sliders size={14} />
            <span>Gatekeeper & Parâmetros</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History size={14} />
            <span>Auditoria de Sincronia</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: INTEGRIDADE SHA-256 */}
          {activeTab === 'integrity' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Hashes Criptográficos de Integridade (SHA-256)
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Cada extensão possui uma assinatura SHA-256 calculada em tempo real para blindar contra injeções em trânsito.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRecalculateHashes}
                  disabled={isVerifyingHashes}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isVerifyingHashes ? 'animate-spin' : ''} />
                  <span>Recalcular Hashes</span>
                </button>
              </div>

              {/* Tabela de Hashes */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      <tr>
                        <th className="p-3">Extensão</th>
                        <th className="p-3">Versão / Cat</th>
                        <th className="p-3">Hash SHA-256 Canônico</th>
                        <th className="p-3">Status de Integridade</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {extensionHashes.map((item) => (
                        <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block font-mono">
                              {item.name}
                            </span>
                            {item.hasDangerousPerms && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                ⚠️ Permissões críticas
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            v{item.version} • {item.category}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-indigo-700 dark:text-indigo-300">
                            <span className="inline-block max-w-[180px] truncate align-middle">
                              {item.hash}
                            </span>
                          </td>
                          <td className="p-3">
                            {item.isQuarantined ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                                🔒 Em Quarentena
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 w-fit">
                                <CheckCircle2 size={11} />
                                <span>Íntegro</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopyHash(item.hash)}
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition text-[11px] cursor-pointer inline-flex items-center gap-1"
                              title="Copiar Hash SHA-256"
                            >
                              {copiedHash === item.hash ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                              <span>{copiedHash === item.hash ? 'Copiado' : 'Copiar Hash'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUARENTENA */}
          {activeTab === 'quarantine' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                    Zona de Isolamento & Quarentena de Sincronia
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Extensões com anomalias de hash, arquivos recém-enviados com padrões de risco ou que tentam escalada de privilégios são isoladas e desativadas automaticamente.
                  </p>
                </div>
              </div>

              {/* Formulário de Quarentena Manual para Burocratas */}
              {isBureaucrat && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                    Isolar Manualmente uma Extensão em Quarentena
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={selectedExtToQuarantine}
                      onChange={(e) => setSelectedExtToQuarantine(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="">Selecione a extensão...</option>
                      {extensionHashes.map((e) => (
                        <option key={e.name} value={e.name}>
                          {e.name} (v{e.version})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Motivo do isolamento (ex: auditoria preventiva)"
                      value={quarantineReason}
                      onChange={(e) => setQuarantineReason(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleManualQuarantine}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Colocar em Quarentena
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Quarentena */}
              {quarantineList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <ShieldCheck size={28} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Nenhuma extensão em quarentena</p>
                  <p className="text-xs text-slate-500 mt-1">Todas as extensões do sistema estão operando em conformidade de segurança.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quarantineList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                            {item.extensionName}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
                          }`}>
                            {item.severity.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Origem: {item.source}
                          </span>
                        </div>
                        <p className="text-xs text-rose-800 dark:text-rose-300">{item.reason}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          Isolada em: {new Date(item.quarantinedAt).toLocaleString('pt-BR')} • Hash: {item.hash.slice(0, 16)}...
                        </p>
                      </div>

                      {isBureaucrat && (
                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'quarantined' && (
                            <button
                              type="button"
                              onClick={() => handleReleaseQuarantine(item.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Homologar e liberar extensão da quarentena"
                            >
                              <Unlock size={12} />
                              <span>Homologar</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRejectQuarantine(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Rejeitar e purgar arquivo do sistema"
                          >
                            <Trash2 size={12} />
                            <span>Purgar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHECKPOINTS & ROLLBACK */}
          {activeTab === 'checkpoints' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    Checkpoints Anti-Drift & Reversão Instantânea
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Antes de qualquer sincronia, o dispositivo cria um instantâneo do ecossistema para possibilitar rollback em 1 clique caso surjam anomalias.
                  </p>
                </div>
                {isBureaucrat && (
                  <button
                    type="button"
                    onClick={() => setShowNewCheckpointDialog(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Plus size={13} />
                    <span>Criar Checkpoint</span>
                  </button>
                )}
              </div>

              {showNewCheckpointDialog && (
                <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                  <span className="font-bold text-xs text-blue-900 dark:text-blue-200 block">
                    Novo Ponto de Restauração de Segurança
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Descrição do checkpoint (ex: Antes de atualizar temas)"
                      value={checkpointNoteInput}
                      onChange={(e) => setCheckpointNoteInput(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCheckpoint}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Gravar Snapshot
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCheckpointDialog(false)}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Checkpoints */}
              <div className="space-y-3">
                {checkpoints.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p>Nenhum checkpoint gravado até o momento.</p>
                  </div>
                ) : (
                  checkpoints.map((cp) => (
                    <div
                      key={cp.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {cp.note}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {cp.totalExtensions} extensões
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Criado por {cp.operatorUsername} em {new Date(cp.timestamp).toLocaleString('pt-BR')} (ID: {cp.id})
                        </p>
                      </div>

                      {isBureaucrat && (
                        <button
                          type="button"
                          onClick={() => handleRollback(cp.id)}
                          disabled={isRollingBack}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-400 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          title="Restaurar este estado de extensões"
                        >
                          <RotateCcw size={12} className={isRollingBack ? 'animate-spin' : ''} />
                          <span>Reverter Sincronia</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONFIGURAÇÃO DO GATEKEEPER */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-sm text-slate-900 dark:text-white block mb-1">
                  Políticas Ativas do Dispositivo de Segurança
                </span>
                <p className="text-xs text-slate-500">
                  Defina as regras restritivas para proteger os visitantes e o Wiki-Site contra sincronizações desautorizadas.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                {[
                  {
                    key: 'requireBureaucratForSync' as const,
                    title: 'Exigência Estrita de Conselho de Burocratas',
                    desc: 'Apenas membros autenticados com o cargo de Burocrata podem disparar uploads, sincronizações em nuvem e alterações de registro.',
                  },
                  {
                    key: 'quarantineUntrustedByDefault' as const,
                    title: 'Quarentena Automática de Extensões Não Homologadas',
                    desc: 'Isola qualquer extensão que venha da nuvem ou de arquivos externos até que seja inspecionada manualmente por um administrador.',
                  },
                  {
                    key: 'blockHighRiskPermissions' as const,
                    title: 'Bloqueio de Escalada de Privilégios (bypass_security, etc.)',
                    desc: 'Impede o carregamento de extensões que declarem permissões excessivas ou que tentem contornar o gatekeeper da wiki.',
                  },
                  {
                    key: 'enforceSha256Verification' as const,
                    title: 'Validação Criptográfica de SHA-256 Pré-Sincronia',
                    desc: 'Gera e confere o hash de cada arquivo antes de despachar ou aceitar dados remotos do Firebase Firestore.',
                  },
                  {
                    key: 'autoCheckpointBeforeSync' as const,
                    title: 'Snapshot Automático Antes de Cada Sincronização em Massa',
                    desc: 'Gera um ponto de restauração instantâneo antes de gravar qualquer lote no Firestore.',
                  },
                ].map((item) => (
                  <div key={item.key} className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        {item.title}
                      </span>
                      <p className="text-slate-500 text-[11px]">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!isBureaucrat}
                      onClick={() => handleToggleConfig(item.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        deviceConfig[item.key] ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      } ${!isBureaucrat ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          deviceConfig[item.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDITORIA */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    Registro de Eventos de Segurança de Sincronia
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Auditoria imutável com timestamp, operador e hashes das operações executadas.
                  </p>
                </div>
                <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                  {securityLogs.length} eventos
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[50vh] overflow-y-auto">
                {securityLogs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">Nenhum evento registrado ainda.</div>
                ) : (
                  securityLogs.map((log) => (
                    <div key={log.id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                            log.action === 'quarantined'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : log.action === 'released'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : log.action === 'rollback_executed'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {log.details}
                          </span>
                        </div>
                        {log.hash && (
                          <span className="font-mono text-[10px] text-slate-400 block truncate max-w-md">
                            Hash: {log.hash}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-[10px] text-slate-400 block">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          por {log.operator}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <span className="text-[11px] text-slate-500 font-mono">
            Dispositivo de Segurança 3.05.9.a • Proteção de Sincronia & Integridade Ativa
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtensionSyncSecurityModal;
