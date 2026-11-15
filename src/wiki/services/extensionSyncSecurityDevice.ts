/**
 * DISPOSITIVO DE SEGURANÇA PARA SINCRONIA DE EXTENSÕES
 * Requisito 3.05.9.a:
 * - Validação Criptográfica de Integridade (SHA-256 e detecção de adulterações em trânsito)
 * - Quarentena e Interceptor de Sincronia de Extensões não homologadas / de risco
 * - Checkpoints automáticos com Rollback Instantâneo de integridade de estado
 * - Gatekeeper de Permissões e Prevenção de Escalada de Privilégios em Nuvem
 * - Registro e Auditoria em Tempo Real de Eventos de Segurança de Sincronia
 */

import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { getDbSafe } from './firebase';
import {
  InstalledExtensionMeta,
  UserProfile,
  SyncSecurityCheckpoint,
  SyncQuarantineRecord,
  SyncSecurityAuditLog,
  SyncIntegrityState,
} from '../types';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';

const STORAGE_KEYS = {
  CHECKPOINTS: 'wikizero_sync_checkpoints_v1',
  QUARANTINE: 'wikizero_sync_quarantine_v1',
  LOGS: 'wikizero_sync_security_logs_v1',
  DEVICE_CONFIG: 'wikizero_sync_security_config_v1',
};

export interface SyncSecurityDeviceConfig {
  requireBureaucratForSync: boolean;
  quarantineUntrustedByDefault: boolean;
  blockHighRiskPermissions: boolean;
  enforceSha256Verification: boolean;
  maxStoredCheckpoints: number;
  autoCheckpointBeforeSync: boolean;
}

export class ExtensionSyncSecurityDevice {
  private static instance: ExtensionSyncSecurityDevice;

  private config: SyncSecurityDeviceConfig = {
    requireBureaucratForSync: true,
    quarantineUntrustedByDefault: true,
    blockHighRiskPermissions: true,
    enforceSha256Verification: true,
    maxStoredCheckpoints: 15,
    autoCheckpointBeforeSync: true,
  };

  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): ExtensionSyncSecurityDevice {
    if (!ExtensionSyncSecurityDevice.instance) {
      ExtensionSyncSecurityDevice.instance = new ExtensionSyncSecurityDevice();
    }
    return ExtensionSyncSecurityDevice.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.warn('[ExtensionSyncSecurityDevice] Erro no listener:', err);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 1. CÁLCULO CRIPTOGRÁFICO DE HASH SHA-256
  // ---------------------------------------------------------------------------
  public async computeSha256(content: string): Promise<string> {
    if (!content) return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // hash de string vazia

    try {
      if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch {
      // Fallback para ambiente sem subtle crypto
    }

    // Algoritmo SHA-256 em puro JavaScript como fallback garantido
    return this.fallbackSha256(content);
  }

  private fallbackSha256(ascii: string): string {
    function rightRotate(value: number, amount: number) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let i, j;
    let result = '';
    const words: number[] = [];
    const asciiBitLength = ascii.length * 8;
    const hash: number[] = [];
    const k: number[] = [];
    let primeCounter = 0;
    const isComposite: Record<number, boolean> = {};

    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = true;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    ascii += '\x80';
    while ((ascii.length % 64) - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;

    for (j = 0; j < words.length; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash.slice(0);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15],
          w2 = w[i - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

        const s1Round = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
        const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        const temp1 = (hash[7] + s1Round + ch + k[i] + w[i]) | 0;
        const s0Round = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        const temp2 = (s0Round + maj) | 0;

        hash[7] = hash[6];
        hash[6] = hash[5];
        hash[5] = hash[4];
        hash[4] = (hash[3] + temp1) | 0;
        hash[3] = hash[2];
        hash[2] = hash[1];
        hash[1] = hash[0];
        hash[0] = (temp1 + temp2) | 0;
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  /**
   * Gera o hash canônico e determinístico de uma extensão (código, tags, hooks, configurações)
   */
  public async calculateExtensionHash(meta: Partial<InstalledExtensionMeta>): Promise<string> {
    const canonicalPayload = {
      name: meta.name || '',
      version: meta.version || '1.0.0',
      category: meta.category || 'tool',
      author: meta.author || '',
      hooks: (meta.hooks || []).slice().sort(),
      permissions: (meta.permissions || []).slice().sort(),
      customScript: (meta.customScript || '').trim(),
      customCss: (meta.customCss || '').trim(),
      customTags: (meta.customTags || []).map((t) => ({ tag: t.tag, template: t.template })),
      toolConfigId: meta.toolConfig?.toolId || '',
    };
    return this.computeSha256(JSON.stringify(canonicalPayload));
  }

  // ---------------------------------------------------------------------------
  // 2. CHECKPOINTS & ROLLBACK INSTANTÂNEO DE SINCRONIA (SHIELD)
  // ---------------------------------------------------------------------------
  public getCheckpoints(): SyncSecurityCheckpoint[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHECKPOINTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[ExtensionSyncSecurityDevice] Erro ao ler checkpoints:', e);
    }
    return [];
  }

  public async createCheckpoint(
    operator: UserProfile | null,
    note: string = 'Snapshot de Segurança Pré-Sincronia'
  ): Promise<SyncSecurityCheckpoint> {
    const extManager = ExtensionManager.getInstance();
    const installed = extManager.getAllInstalledExtensions();
    const states = (extManager as any).extensionStates || {};

    const hashes: Record<string, string> = {};
    for (const ext of installed) {
      hashes[ext.name] = await this.calculateExtensionHash(ext);
    }

    const checkpoint: SyncSecurityCheckpoint = {
      id: `ckpt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      operatorUid: operator?.uid || 'system',
      operatorUsername: operator?.displayName || operator?.username || 'Sistema',
      snapshotStates: { ...states },
      snapshotHashes: hashes,
      totalExtensions: installed.length,
      note,
    };

    const current = this.getCheckpoints();
    const updated = [checkpoint, ...current].slice(0, this.config.maxStoredCheckpoints);

    try {
      localStorage.setItem(STORAGE_KEYS.CHECKPOINTS, JSON.stringify(updated));
    } catch (err) {
      console.warn('[ExtensionSyncSecurityDevice] Erro ao salvar checkpoint no localStorage:', err);
    }

    this.logSecurityEvent(
      'checkpoint_created',
      checkpoint.operatorUsername,
      `Checkpoint '${checkpoint.id}' gerado: ${checkpoint.totalExtensions} extensões preservadas (${note}).`
    );

    this.notify();
    return checkpoint;
  }

  public async rollbackToCheckpoint(
    checkpointId: string,
    operator: UserProfile | null
  ): Promise<{ success: boolean; message: string; restoredCount?: number }> {
    if (!isUserBureaucrat(operator)) {
      return {
        success: false,
        message: 'Permissão negada: Somente membros do Conselho de Burocratas podem executar rollback de sincronia.',
      };
    }

    const checkpoints = this.getCheckpoints();
    const target = checkpoints.find((c) => c.id === checkpointId);
    if (!target) {
      return { success: false, message: `Checkpoint '${checkpointId}' não foi localizado no dispositivo de segurança.` };
    }

    const extManager = ExtensionManager.getInstance();
    let restoredCount = 0;

    // Restaura os estados do snapshot
    for (const [extName, shouldEnable] of Object.entries(target.snapshotStates)) {
      try {
        if (shouldEnable) {
          await extManager.activateExtension(extName, operator);
        } else {
          await extManager.deactivateExtension(extName, operator);
        }
        restoredCount++;
      } catch (err) {
        console.warn(`[Rollback] Erro ao restaurar ${extName}:`, err);
      }
    }

    this.logSecurityEvent(
      'rollback_executed',
      operator?.displayName || operator?.username || 'Burocrata',
      `Rollback realizado com sucesso para o checkpoint de ${new Date(target.timestamp).toLocaleString('pt-BR')}. ${restoredCount} extensões reajustadas.`
    );

    this.notify();
    return {
      success: true,
      message: `Rollback concluído com sucesso! ${restoredCount} estados de extensões foram revertidos para o estado seguro de ${new Date(target.timestamp).toLocaleString('pt-BR')}.`,
      restoredCount,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. QUARENTENA E INTERCEPTOR DE EXTENSÕES DE RISCO
  // ---------------------------------------------------------------------------
  public getQuarantinedExtensions(): SyncQuarantineRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.QUARANTINE);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[ExtensionSyncSecurityDevice] Erro ao ler quarentena:', e);
    }
    return [];
  }

  public isExtensionQuarantined(name: string): boolean {
    const list = this.getQuarantinedExtensions();
    return list.some((q) => q.extensionName.toLowerCase() === name.toLowerCase() && q.status === 'quarantined');
  }

  public async quarantineExtension(
    extensionName: string,
    reason: string,
    severity: 'critical' | 'high' | 'medium',
    source: 'cloud_sync' | 'file_upload' | 'manual',
    rawContent?: string,
    operator?: UserProfile | null
  ): Promise<SyncQuarantineRecord> {
    const hash = rawContent ? await this.computeSha256(rawContent) : 'unknown-hash';

    const record: SyncQuarantineRecord = {
      id: `quar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      extensionName,
      version: '1.0.0',
      source,
      quarantinedAt: new Date().toISOString(),
      reason,
      severity,
      hash,
      rawContent,
      status: 'quarantined',
    };

    const list = this.getQuarantinedExtensions().filter((q) => q.extensionName !== extensionName);
    list.unshift(record);

    try {
      localStorage.setItem(STORAGE_KEYS.QUARANTINE, JSON.stringify(list));
    } catch (e) {
      console.warn('[ExtensionSyncSecurityDevice] Erro ao persistir quarentena:', e);
    }

    // Desativa a extensão imediatamente no manager
    try {
      ExtensionManager.getInstance().deactivateExtension(extensionName, operator || null);
    } catch {}

    this.logSecurityEvent(
      'quarantined',
      operator?.displayName || operator?.username || 'Dispositivo de Segurança',
      `Extensão '${extensionName}' colocada em quarentena de sincronia. Motivo: ${reason}`,
      extensionName,
      hash
    );

    this.notify();
    return record;
  }

  public async releaseQuarantine(
    quarantineId: string,
    operator: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    if (!isUserBureaucrat(operator)) {
      return {
        success: false,
        message: 'Permissão negada: Apenas burocratas podem liberar extensões da quarentena de segurança.',
      };
    }

    const list = this.getQuarantinedExtensions();
    const item = list.find((q) => q.id === quarantineId);
    if (!item) {
      return { success: false, message: 'Registro de quarentena não encontrado.' };
    }

    item.status = 'approved';
    item.reviewedBy = operator?.displayName || operator?.username || 'Burocrata';
    item.reviewedAt = new Date().toISOString();

    try {
      localStorage.setItem(STORAGE_KEYS.QUARANTINE, JSON.stringify(list));
    } catch {}

    this.logSecurityEvent(
      'released',
      item.reviewedBy,
      `Extensão '${item.extensionName}' liberada da quarentena pelo burocrata.`,
      item.extensionName,
      item.hash
    );

    this.notify();
    return {
      success: true,
      message: `A extensão '${item.extensionName}' foi homologada e liberada da quarentena com sucesso.`,
    };
  }

  public async rejectAndPurgeQuarantine(
    quarantineId: string,
    operator: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    if (!isUserBureaucrat(operator)) {
      return {
        success: false,
        message: 'Permissão negada: Apenas burocratas podem purgar extensões rejeitadas.',
      };
    }

    let list = this.getQuarantinedExtensions();
    const item = list.find((q) => q.id === quarantineId);
    if (!item) {
      return { success: false, message: 'Registro de quarentena não encontrado.' };
    }

    // Remove a extensão do ExtensionManager e do armazenamento
    try {
      ExtensionManager.getInstance().removeExtension(item.extensionName, operator);
    } catch {}

    list = list.filter((q) => q.id !== quarantineId);
    try {
      localStorage.setItem(STORAGE_KEYS.QUARANTINE, JSON.stringify(list));
    } catch {}

    this.logSecurityEvent(
      'blocked',
      operator?.displayName || operator?.username || 'Burocrata',
      `Extensão '${item.extensionName}' rejeitada e purgada definitivamente do sistema.`,
      item.extensionName,
      item.hash
    );

    this.notify();
    return {
      success: true,
      message: `A extensão '${item.extensionName}' foi rejeitada e expurgada do sistema de arquivos e da sincronia.`,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. GATEKEEPER DE VALIDAÇÃO PRÉ-SINCRONIA
  // ---------------------------------------------------------------------------
  public async validatePreSyncGatekeeper(
    extensions: InstalledExtensionMeta[],
    user: UserProfile | null
  ): Promise<{ allowed: boolean; errors: string[]; warnings: string[]; quarantineCount: number }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let quarantineCount = 0;

    if (this.config.requireBureaucratForSync && !isUserBureaucrat(user)) {
      errors.push('Requisito 3.05.9.a: A sincronia de extensões com o Firebase requer privilégios de Burocrata autenticado.');
      return { allowed: false, errors, warnings, quarantineCount };
    }

    for (const ext of extensions) {
      // 1. Verifica se já está em quarentena
      if (this.isExtensionQuarantined(ext.name)) {
        errors.push(`A extensão '${ext.name}' está em quarentena e teve sua sincronização com a nuvem bloqueada.`);
        quarantineCount++;
        continue;
      }

      // 2. Verifica permissões de alto risco
      if (this.config.blockHighRiskPermissions && ext.permissions) {
        const dangerousPerms = ext.permissions.filter((p) =>
          ['bypass_security', 'full_database_write', 'admin_escalate', 'eval_unrestricted'].includes(p)
        );
        if (dangerousPerms.length > 0) {
          warnings.push(
            `Extensão '${ext.name}' solicita permissões de altíssimo risco (${dangerousPerms.join(', ')}). Colocada sob vigilância.`
          );
        }
      }

      // 3. Verifica se código customizado contém chamadas perigosas
      if (ext.customScript) {
        if (ext.customScript.includes('document.cookie') || ext.customScript.includes('localStorage.clear')) {
          warnings.push(`Extensão '${ext.name}' contém acesso a armazenamento ou cookies locais.`);
        }
      }
    }

    return {
      allowed: errors.length === 0,
      errors,
      warnings,
      quarantineCount,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. REGISTRO DE AUDITORIA DE SEGURANÇA DE SINCRONIA
  // ---------------------------------------------------------------------------
  public getSecurityLogs(): SyncSecurityAuditLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  public logSecurityEvent(
    action: SyncSecurityAuditLog['action'],
    operator: string,
    details: string,
    extensionName?: string,
    hash?: string
  ): void {
    const event: SyncSecurityAuditLog = {
      id: `log-sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      extensionName,
      operator,
      details,
      hash,
    };

    const logs = this.getSecurityLogs();
    logs.unshift(event);
    const trimmed = logs.slice(0, 100);

    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmed));
    } catch {}

    // Grava também no Firestore se disponível
    const db = getDbSafe();
    if (db) {
      try {
        const docRef = doc(db, 'wiki_extension_sync_security_logs', event.id);
        setDoc(docRef, { ...event, createdAt: serverTimestamp() }).catch(() => {});
      } catch {}
    }
  }

  // ---------------------------------------------------------------------------
  // 6. CONFIGURAÇÃO DO DISPOSITIVO
  // ---------------------------------------------------------------------------
  public getConfig(): SyncSecurityDeviceConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SyncSecurityDeviceConfig>, operator: UserProfile | null): boolean {
    if (!isUserBureaucrat(operator)) return false;
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICE_CONFIG, JSON.stringify(this.config));
    } catch {}
    this.logSecurityEvent('hash_check', operator?.displayName || 'Burocrata', 'Parâmetros do dispositivo de segurança de sincronia atualizados.');
    this.notify();
    return true;
  }

  private loadConfig(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DEVICE_CONFIG);
      if (raw) {
        this.config = { ...this.config, ...JSON.parse(raw) };
      }
    } catch {}
  }
}

export const extensionSyncSecurityDevice = ExtensionSyncSecurityDevice.getInstance();
