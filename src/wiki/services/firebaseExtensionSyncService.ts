import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { getDbSafe, handleFirestoreError, OperationType } from './firebase';
import {
  InstalledExtensionMeta,
  ExtensionConflict,
  FirebaseExtensionRegistryDoc,
  UserProfile,
} from '../types';
import { extensionSyncSecurityDevice } from './extensionSyncSecurityDevice';
import { extensionMalwareScannerDevice } from './extensionMalwareScannerDevice';

/**
 * Constantes e Coleções do Firebase para o Módulo de Extensões (Versão 3.304)
 */
export const EXTENSION_FIREBASE_COLLECTIONS = {
  REGISTRY: 'wiki_extension_registry',
  REGISTRY_DOC: 'global_states',
  EXTENSIONS: 'wiki_extensions',
  LOGS: 'wiki_extension_logs',
};

export type SyncStateStatus = 'connected' | 'connecting' | 'offline' | 'error';

/**
 * Evento emitido quando uma alteração em tempo real é detectada no Firebase (3.05.11).
 */
export interface ExtensionRealtimeChangeEvent {
  id: string;
  type: 'state_toggled' | 'settings_modified' | 'extension_added' | 'extension_removed';
  extensionName: string;
  previousValue?: any;
  newValue?: any;
  updatedBy?: string;
  timestamp: string;
  isCritical?: boolean;
}

/**
 * Resultado da verificação manual ou automática de extensões no Firestore (3.05.11).
 */
export interface ExtensionVerificationResult {
  success: boolean;
  timestamp: string;
  reason: string;
  latencyMs: number;
  activeCount: number;
  totalExtensions: number;
  differencesDetected: number;
  changesSummary: string[];
  registryDocExists: boolean;
  message: string;
}

function cleanFirestorePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestorePayload(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = cleanFirestorePayload(value);
    }
  }
  return clean as T;
}

/**
 * Serviço de Sincronização de Extensões em Nuvem via Firebase Firestore.
 * Atende às especificações da Versão 3.304 e 3.05.11:
 * - 304.1 / 304.2: Sincronia de extensões ativadas/desativadas com Firestore em tempo real.
 * - 304.3: Mapeamento de extensões entre arquivos locais (index.ts) e banco de dados.
 * - 304.3.1: Resolução de extensões órfãs e colisões de nome/função.
 * - 304.4: Upload de novas extensões via arquivo válido (index.js/index.ts).
 * - 304.4: Sincronização em massa de todas as extensões na nuvem.
 * - 304.5: Porta de entrada para segurança da Wiki mesmo para visitantes não logados.
 * - 304.6: Suporte a camadas de segurança salvas em nuvem.
 * - 3.05.11: Verificação automática contínua se há mudanças em tempo real nas extensões no Firebase,
 *   com histórico de eventos, detecção de diferenças (diff) e emissão de eventos/toasts.
 */
export class FirebaseExtensionSyncService {
  private static instance: FirebaseExtensionSyncService;
  private registryUnsubscribe: Unsubscribe | null = null;
  private extensionsUnsubscribe: Unsubscribe | null = null;
  private currentSyncStatus: SyncStateStatus = 'connecting';
  private lastSyncedAt: string | null = null;
  private lastVerifiedAt: string | null = null;
  private listeners: Set<(status: SyncStateStatus) => void> = new Set();

  // Rastreamento para detecção de diff em tempo real (3.05.11)
  private lastKnownStates: Record<string, boolean> | null = null;
  private lastKnownSettings: Record<string, Record<string, any>> | null = null;
  private lastKnownCloudExtNames: Set<string> = new Set();
  private isInitialStatesSnapshot: boolean = true;
  private isInitialExtensionsSnapshot: boolean = true;
  private changeHistory: ExtensionRealtimeChangeEvent[] = [];
  private changeListeners: Set<(event: ExtensionRealtimeChangeEvent) => void> = new Set();

  // Callbacks salvos para religar listeners via ensureRealtimeActive()
  private onStatesUpdateCallback?: (states: Record<string, boolean>, settings?: Record<string, Record<string, any>>) => void;
  private onCloudExtensionsUpdateCallback?: (extensions: InstalledExtensionMeta[]) => void;

  private constructor() {}

  public static getInstance(): FirebaseExtensionSyncService {
    if (!FirebaseExtensionSyncService.instance) {
      FirebaseExtensionSyncService.instance = new FirebaseExtensionSyncService();
    }
    return FirebaseExtensionSyncService.instance;
  }

  public getSyncStatus(): SyncStateStatus {
    return this.currentSyncStatus;
  }

  public getLastSyncedAt(): string | null {
    return this.lastSyncedAt;
  }

  public getLastVerifiedAt(): string | null {
    return this.lastVerifiedAt;
  }

  public getChangeHistory(): ExtensionRealtimeChangeEvent[] {
    return [...this.changeHistory];
  }

  public subscribeStatus(listener: (status: SyncStateStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentSyncStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeChangeEvents(listener: (event: ExtensionRealtimeChangeEvent) => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  private dispatchChangeEvent(event: ExtensionRealtimeChangeEvent): void {
    this.changeHistory.unshift(event);
    if (this.changeHistory.length > 50) {
      this.changeHistory = this.changeHistory.slice(0, 50);
    }

    this.changeListeners.forEach((l) => {
      try {
        l(event);
      } catch (err) {
        console.warn('[FirebaseExtensionSyncService] Erro no listener de mudança em tempo real:', err);
      }
    });

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('wikizero:extension-cloud-changed', {
            detail: event,
          })
        );
      } catch (_) {}
    }
  }

  private setStatus(status: SyncStateStatus): void {
    this.currentSyncStatus = status;
    this.listeners.forEach((l) => {
      try {
        l(status);
      } catch (err) {
        console.warn('[FirebaseExtensionSyncService] Erro no listener de status:', err);
      }
    });
  }

  /**
   * Higieniza o identificador da extensão para ser usado como Document ID no Firestore.
   */
  public sanitizeDocId(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 100);
  }

  /**
   * Gera um hash simples de integridade e segurança para o estado das extensões (304.5).
   */
  private generateSecurityHash(states: Record<string, boolean>): string {
    const keys = Object.keys(states).sort();
    let str = '';
    for (const k of keys) {
      str += `${k}:${states[k]};`;
    }
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `sec304-${Math.abs(hash).toString(16)}`;
  }

  /**
   * 304.2 & 304.5 & 3.05.11: Inicia a escuta em tempo real no Firestore com detecção
   * contínua de diferenças entre clientes e disparo de eventos informativos.
   */
  public startRealtimeSync(
    onStatesUpdate: (states: Record<string, boolean>, settings?: Record<string, Record<string, any>>) => void,
    onCloudExtensionsUpdate: (extensions: InstalledExtensionMeta[]) => void
  ): void {
    this.onStatesUpdateCallback = onStatesUpdate;
    this.onCloudExtensionsUpdateCallback = onCloudExtensionsUpdate;

    const db = getDbSafe();
    if (!db) {
      this.setStatus('offline');
      return;
    }

    // 1. Escuta e Busca Imediata do Registro Global de Estados (global_states)
    try {
      const regDocRef = doc(
        db,
        EXTENSION_FIREBASE_COLLECTIONS.REGISTRY,
        EXTENSION_FIREBASE_COLLECTIONS.REGISTRY_DOC
      );

      // 3.05.3.q.3: Busca inicial imediata com getDoc para carregar estados em novas janelas/computadores
      getDoc(regDocRef)
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data() as FirebaseExtensionRegistryDoc;
            if (data && data.states && typeof data.states === 'object') {
              this.lastSyncedAt = data.updatedAt || new Date().toISOString();
              this.lastVerifiedAt = this.lastSyncedAt;
              this.lastKnownStates = { ...data.states };
              if (data.settings) {
                this.lastKnownSettings = JSON.parse(JSON.stringify(data.settings));
              }
              this.setStatus('connected');
              onStatesUpdate(data.states, data.settings);
            }
          }
        })
        .catch((e) => {
          console.warn('[FirebaseExtensionSyncService] Aviso na busca inicial getDoc de estados:', e);
        });

      this.registryUnsubscribe = onSnapshot(
        regDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as FirebaseExtensionRegistryDoc;
            if (data && data.states && typeof data.states === 'object') {
              const previousStates = this.lastKnownStates;
              const incomingStates = data.states;
              const incomingSettings = data.settings;
              const previousSettings = this.lastKnownSettings;

              this.lastSyncedAt = data.updatedAt || new Date().toISOString();
              this.lastVerifiedAt = this.lastSyncedAt;
              this.setStatus('connected');

              // 3.05.11: Detecção de diferenças em tempo real (diffing)
              if (!this.isInitialStatesSnapshot && previousStates) {
                for (const [extName, isEnabled] of Object.entries(incomingStates)) {
                  if (previousStates[extName] !== undefined && previousStates[extName] !== isEnabled) {
                    const isCritical =
                      extName.toLowerCase().includes('security') ||
                      extName.toLowerCase().includes('theme') ||
                      extName.toLowerCase().includes('guard');
                    this.dispatchChangeEvent({
                      id: `change-${Date.now()}-${extName}`,
                      type: 'state_toggled',
                      extensionName: extName,
                      previousValue: previousStates[extName],
                      newValue: isEnabled,
                      updatedBy: data.updatedBy || 'Burocrata',
                      timestamp: data.updatedAt || new Date().toISOString(),
                      isCritical,
                    });
                  }
                }

                // Verifica mudanças em settings
                if (incomingSettings && previousSettings) {
                  for (const [extName, conf] of Object.entries(incomingSettings)) {
                    if (JSON.stringify(previousSettings[extName]) !== JSON.stringify(conf)) {
                      this.dispatchChangeEvent({
                        id: `setting-${Date.now()}-${extName}`,
                        type: 'settings_modified',
                        extensionName: extName,
                        previousValue: previousSettings[extName],
                        newValue: conf,
                        updatedBy: data.updatedBy || 'Burocrata',
                        timestamp: data.updatedAt || new Date().toISOString(),
                      });
                    }
                  }
                }
              }

              this.isInitialStatesSnapshot = false;
              this.lastKnownStates = { ...incomingStates };
              if (incomingSettings) {
                this.lastKnownSettings = JSON.parse(JSON.stringify(incomingSettings));
              }

              onStatesUpdate(data.states, data.settings);
            }
          } else {
            this.setStatus('connected');
          }
        },
        (error) => {
          console.warn('[FirebaseExtensionSyncService] Falha na escuta do registro de extensões:', error);
          this.setStatus('offline');
        }
      );
    } catch (e) {
      console.warn('[FirebaseExtensionSyncService] Erro ao conectar ao registro de extensões:', e);
      this.setStatus('offline');
    }

    // 2. Escuta da Coleção de Extensões em Nuvem (wiki_extensions)
    try {
      const colRef = collection(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS);
      this.extensionsUnsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const cloudExts: InstalledExtensionMeta[] = [];
          const currentNames = new Set<string>();

          snapshot.forEach((docSnap) => {
            const item = docSnap.data() as InstalledExtensionMeta;
            if (item && item.name) {
              cloudExts.push({
                ...item,
                syncStatus: 'synced',
              });
              currentNames.add(item.name);
            }
          });

          // 3.05.11: Detecção de extensões adicionadas/removidas na nuvem
          if (!this.isInitialExtensionsSnapshot && this.lastKnownCloudExtNames.size > 0) {
            for (const name of currentNames) {
              if (!this.lastKnownCloudExtNames.has(name)) {
                this.dispatchChangeEvent({
                  id: `add-${Date.now()}-${name}`,
                  type: 'extension_added',
                  extensionName: name,
                  timestamp: new Date().toISOString(),
                });
              }
            }
            for (const name of this.lastKnownCloudExtNames) {
              if (!currentNames.has(name)) {
                this.dispatchChangeEvent({
                  id: `rem-${Date.now()}-${name}`,
                  type: 'extension_removed',
                  extensionName: name,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }

          this.isInitialExtensionsSnapshot = false;
          this.lastKnownCloudExtNames = currentNames;
          this.setStatus('connected');
          this.lastSyncedAt = new Date().toISOString();
          this.lastVerifiedAt = this.lastSyncedAt;
          onCloudExtensionsUpdate(cloudExts);
        },
        (error) => {
          console.warn('[FirebaseExtensionSyncService] Falha na escuta das extensões em nuvem:', error);
          this.setStatus('offline');
        }
      );
    } catch (e) {
      console.warn('[FirebaseExtensionSyncService] Erro ao conectar à coleção wiki_extensions:', e);
      this.setStatus('offline');
    }
  }

  /**
   * 3.05.11: Garante que os ouvintes em tempo real estejam ativos.
   */
  public ensureRealtimeActive(): void {
    if (!this.registryUnsubscribe || !this.extensionsUnsubscribe) {
      if (this.onStatesUpdateCallback && this.onCloudExtensionsUpdateCallback) {
        this.startRealtimeSync(this.onStatesUpdateCallback, this.onCloudExtensionsUpdateCallback);
      }
    }
  }

  /**
   * 3.05.11: Realiza uma verificação pontual e rigorosa em tempo real no Firebase Firestore.
   * Consulta diretamente o documento global_states e a coleção wiki_extensions medindo latência.
   */
  public async verifyExtensionsRealtime(reason: string = 'manual'): Promise<ExtensionVerificationResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    const db = getDbSafe();

    if (!db) {
      return {
        success: false,
        timestamp,
        reason,
        latencyMs: 0,
        activeCount: 0,
        totalExtensions: 0,
        differencesDetected: 0,
        changesSummary: [],
        registryDocExists: false,
        message: 'Banco de dados do Firebase Firestore indisponível no cliente.',
      };
    }

    try {
      const regDocRef = doc(
        db,
        EXTENSION_FIREBASE_COLLECTIONS.REGISTRY,
        EXTENSION_FIREBASE_COLLECTIONS.REGISTRY_DOC
      );
      const colRef = collection(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS);

      // Consulta simultânea para minimizar latência
      const [regSnap, colSnap] = await Promise.all([
        getDoc(regDocRef),
        getDocs(colRef),
      ]);

      const latencyMs = Math.round(performance.now() - startTime);
      this.lastVerifiedAt = timestamp;
      this.setStatus('connected');

      let activeCount = 0;
      let totalExtensions = 0;
      const changesSummary: string[] = [];
      let differencesDetected = 0;

      if (regSnap.exists()) {
        const data = regSnap.data() as FirebaseExtensionRegistryDoc;
        if (data.states) {
          activeCount = Object.values(data.states).filter(Boolean).length;
          totalExtensions = Object.keys(data.states).length;

          // Compara com os estados conhecidos
          if (this.lastKnownStates) {
            for (const [name, isEnabled] of Object.entries(data.states)) {
              if (this.lastKnownStates[name] !== isEnabled) {
                differencesDetected++;
                changesSummary.push(`'${name}': ${this.lastKnownStates[name] ? 'Ativa' : 'Inativa'} -> ${isEnabled ? 'Ativa' : 'Inativa'}`);
              }
            }
          }
        }
      }

      const cloudDocsCount = colSnap.size;
      const message = regSnap.exists()
        ? `Verificação em tempo real concluída (${latencyMs}ms). ${activeCount} ativas de ${totalExtensions} cadastradas no Firestore (${cloudDocsCount} documentos na nuvem).`
        : `Registro global ainda não inicializado no Firestore (${cloudDocsCount} documentos individuais encontrados).`;

      return {
        success: true,
        timestamp,
        reason,
        latencyMs,
        activeCount,
        totalExtensions: Math.max(totalExtensions, cloudDocsCount),
        differencesDetected,
        changesSummary,
        registryDocExists: regSnap.exists(),
        message,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      console.warn('[FirebaseExtensionSyncService] Falha na verificação de extensões no Firestore:', err);
      return {
        success: false,
        timestamp,
        reason,
        latencyMs,
        activeCount: 0,
        totalExtensions: 0,
        differencesDetected: 0,
        changesSummary: [],
        registryDocExists: false,
        message: `Falha na verificação com o Firebase: ${err?.message || 'Erro de rede ou permissão'}`,
      };
    }
  }

  /**
   * Encerra as conexões em tempo real.
   */
  public stopRealtimeSync(): void {
    if (this.registryUnsubscribe) {
      this.registryUnsubscribe();
      this.registryUnsubscribe = null;
    }
    if (this.extensionsUnsubscribe) {
      this.extensionsUnsubscribe();
      this.extensionsUnsubscribe = null;
    }
  }

  /**
   * 304.1 & 304.3 & 3.05.3.q.3: Persiste o estado global de ativação/desativação e configurações no Firestore.
   */
  public async syncStatesToCloud(
    states: Record<string, boolean>,
    user: UserProfile | null,
    settings?: Record<string, Record<string, any>>
  ): Promise<{ success: boolean; message: string }> {
    const db = getDbSafe();
    if (!db) {
      return {
        success: false,
        message: 'Banco de dados do Firebase indisponível. Operação mantida em cache local.',
      };
    }

    const path = `${EXTENSION_FIREBASE_COLLECTIONS.REGISTRY}/${EXTENSION_FIREBASE_COLLECTIONS.REGISTRY_DOC}`;
    try {
      const activeCount = Object.values(states).filter(Boolean).length;
      const totalCount = Object.keys(states).length;
      const rawPayload: FirebaseExtensionRegistryDoc = {
        id: EXTENSION_FIREBASE_COLLECTIONS.REGISTRY_DOC,
        states,
        version: '3.05',
        updatedAt: new Date().toISOString(),
        updatedBy: user?.displayName || user?.username || user?.email || 'Burocrata Administrador',
        securityHash: this.generateSecurityHash(states),
        activeCount,
        totalExtensions: totalCount,
      };

      if (settings && Object.keys(settings).length > 0) {
        rawPayload.settings = settings;
      }

      const payload = cleanFirestorePayload(rawPayload);

      const docRef = doc(db, EXTENSION_FIREBASE_COLLECTIONS.REGISTRY, EXTENSION_FIREBASE_COLLECTIONS.REGISTRY_DOC);
      await setDoc(docRef, payload, { merge: true });

      // 3.05.3.q.3: Garante que cada extensão tenha seu estado gravado individualmente na coleção wiki_extensions
      // para que outras janelas e computadores vejam a alteração imediatamente
      const writePromises = Object.entries(states).map(async ([name, isEnabled]) => {
        try {
          const extDocId = this.sanitizeDocId(name);
          const extDocRef = doc(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS, extDocId);
          const extSettings = settings ? settings[name] : undefined;
          const individualData = cleanFirestorePayload({
            name,
            enabled: isEnabled,
            ...(extSettings ? { settings: extSettings } : {}),
            updatedAt: payload.updatedAt,
            updatedBy: payload.updatedBy,
          });
          await setDoc(extDocRef, individualData, { merge: true });
        } catch (e) {
          console.warn(`[FirebaseExtensionSyncService] Falha ao sincronizar documento individual '${name}':`, e);
        }
      });
      await Promise.allSettled(writePromises);

      this.lastSyncedAt = payload.updatedAt;
      this.setStatus('connected');

      return {
        success: true,
        message: `Estados sincronizados com o Firebase com sucesso (${activeCount} ativas de ${totalCount} catalogadas).`,
      };
    } catch (error: any) {
      console.error('[FirebaseExtensionSyncService] Erro ao sincronizar estados no Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, path);
      return {
        success: false,
        message: `Erro ao sincronizar estados com a nuvem: ${error?.message || 'Falha de permissão ou rede'}`,
      };
    }
  }

  /**
   * 304.4 (segundo item): Sincroniza em lote TODAS as extensões locais para a nuvem Firebase.
   */
  public async syncAllExtensionsToCloud(
    extensions: InstalledExtensionMeta[],
    states: Record<string, boolean>,
    user: UserProfile | null
  ): Promise<{ success: boolean; totalSynced: number; message: string }> {
    const db = getDbSafe();
    if (!db) {
      return {
        success: false,
        totalSynced: 0,
        message: 'Firebase Firestore indisponível para sincronia em nuvem.',
      };
    }

    try {
      // Requisito 3.05.9.a: Dispositivo de Segurança para Sincronia de Extensões
      const gateCheck = await extensionSyncSecurityDevice.validatePreSyncGatekeeper(extensions, user);
      if (!gateCheck.allowed) {
        return {
          success: false,
          totalSynced: 0,
          message: `Dispositivo de Segurança (3.05.9.a): Sincronização em nuvem bloqueada. ${gateCheck.errors.join(' ')}`,
        };
      }

      // Snapshot automático de segurança (Rollback Shield)
      if (extensionSyncSecurityDevice.getConfig().autoCheckpointBeforeSync) {
        await extensionSyncSecurityDevice.createCheckpoint(user, 'Snapshot automático pré-sincronia em lote com Firebase');
      }

      let count = 0;
      const syncedAt = new Date().toISOString();
      const operatorName = user?.displayName || user?.username || user?.email || 'Burocrata Administrador';

      for (const ext of extensions) {
        // Requisitos 3.05.3.aa & 3.05.3.ad: Ignora extensões não sincronizáveis com a nuvem (nativas locais)
        if (
          ext.noCloudSync ||
          ext.syncStatus === 'local_only' ||
          ext.name === 'SqlDatabaseBackupExtension' ||
          ext.name === 'FirebaseAppletConfigImporterExtension' ||
          extensionSyncSecurityDevice.isExtensionQuarantined(ext.name)
        ) {
          continue;
        }

        const docId = this.sanitizeDocId(ext.name);
        const docRef = doc(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS, docId);

        // Prepara os metadados sem propriedades undefined
        const cleanExt: InstalledExtensionMeta = {
          ...ext,
          enabled: states[ext.name] ?? ext.enabled ?? true,
          syncedAt,
          syncedBy: operatorName,
          syncStatus: 'synced',
        };

        // Remove chaves indefinidas para conformidade estrita com o Firestore
        const serialized = JSON.parse(JSON.stringify(cleanExt));
        await setDoc(docRef, serialized, { merge: true });
        count++;
      }

      // Atualiza também o registro global de estados
      await this.syncStatesToCloud(states, user);

      extensionSyncSecurityDevice.logSecurityEvent(
        'hash_check',
        operatorName,
        `Sincronização em lote aprovada pelo dispositivo de segurança: ${count} extensões salvas na nuvem.`
      );

      return {
        success: true,
        totalSynced: count,
        message: `Sincronização concluída com sucesso: ${count} extensões salvas em nuvem no Firebase!`,
      };
    } catch (err: any) {
      console.error('[FirebaseExtensionSyncService] Erro ao sincronizar todas as extensões:', err);
      return {
        success: false,
        totalSynced: 0,
        message: `Falha na sincronização em nuvem: ${err?.message || 'Erro de rede ou permissão'}`,
      };
    }
  }

  /**
   * Salva ou atualiza uma única extensão na nuvem Firebase.
   */
  public async saveExtensionToCloud(
    extension: InstalledExtensionMeta,
    user: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    if (extensionSyncSecurityDevice.isExtensionQuarantined(extension.name)) {
      return {
        success: false,
        message: `Dispositivo de Segurança (3.05.9.a): A extensão '${extension.name}' está em quarentena de segurança e teve sua sincronização impedida.`,
      };
    }

    if (
      extension.noCloudSync ||
      extension.syncStatus === 'local_only' ||
      extension.name === 'SqlDatabaseBackupExtension' ||
      extension.name === 'FirebaseAppletConfigImporterExtension'
    ) {
      return {
        success: false,
        message: `A extensão '${extension.name}' é nativa e não sincronizável com a nuvem (Requisitos 3.05.3.aa & 3.05.3.ad).`,
      };
    }

    const db = getDbSafe();
    if (!db) {
      return { success: false, message: 'Banco de dados do Firebase offline.' };
    }

    const docId = this.sanitizeDocId(extension.name);
    const path = `${EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS}/${docId}`;

    try {
      const docRef = doc(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS, docId);
      const payload: InstalledExtensionMeta = {
        ...extension,
        syncedAt: new Date().toISOString(),
        syncedBy: user?.displayName || user?.username || user?.email || 'Burocrata',
        syncStatus: 'synced',
      };

      const serialized = JSON.parse(JSON.stringify(payload));
      await setDoc(docRef, serialized, { merge: true });

      return {
        success: true,
        message: `Extensão '${extension.name}' salva com sucesso no Firebase!`,
      };
    } catch (err: any) {
      console.error('[FirebaseExtensionSyncService] Erro ao salvar extensão no Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
      return {
        success: false,
        message: `Erro ao salvar extensão na nuvem: ${err?.message || 'Falha de permissão.'}`,
      };
    }
  }

  /**
   * 304.3.1: Remove uma extensão por completo da nuvem Firebase.
   */
  public async deleteExtensionFromCloud(
    extensionName: string,
    user: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    const db = getDbSafe();
    if (!db) {
      return { success: false, message: 'Banco de dados do Firebase offline.' };
    }

    const docId = this.sanitizeDocId(extensionName);
    const path = `${EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS}/${docId}`;

    try {
      const docRef = doc(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS, docId);
      await deleteDoc(docRef);

      return {
        success: true,
        message: `Extensão '${extensionName}' removida por completo da nuvem Firebase.`,
      };
    } catch (err: any) {
      console.error('[FirebaseExtensionSyncService] Erro ao deletar extensão no Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, path);
      return {
        success: false,
        message: `Falha ao remover extensão da nuvem: ${err?.message || 'Erro de permissão.'}`,
      };
    }
  }

  /**
   * 304.3.1: Detecta colisões e divergências entre as extensões locais e as extensões na nuvem.
   */
  public detectConflicts(
    localExtensions: InstalledExtensionMeta[],
    cloudExtensions: InstalledExtensionMeta[]
  ): ExtensionConflict[] {
    const conflicts: ExtensionConflict[] = [];

    // Mapeamento por nome normalizado
    const localMap = new Map<string, InstalledExtensionMeta>();
    for (const l of localExtensions) {
      localMap.set(l.name.toLowerCase().trim(), l);
    }

    const cloudMap = new Map<string, InstalledExtensionMeta>();
    for (const c of cloudExtensions) {
      cloudMap.set(c.name.toLowerCase().trim(), c);
    }

    // 1. Verifica extensões em nuvem que não existem mais localmente (Órfãs em Nuvem)
    for (const [key, cloudExt] of cloudMap.entries()) {
      const localExt = localMap.get(key);
      if (!localExt) {
        conflicts.push({
          id: `conflict-orphan-${cloudExt.name}`,
          extensionName: cloudExt.name,
          type: 'orphan_cloud',
          title: `Extensão em Nuvem Sem Arquivo Local`,
          description: `A extensão '${cloudExt.name}' (v${cloudExt.version}) existe no banco de dados do Firebase, mas não possui arquivo correspondente no diretório local do sistema.`,
          cloudVersion: cloudExt.version,
          cloudMeta: cloudExt,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Verifica extensões com o mesmo nome ou funções colidentes
    for (const localExt of localExtensions) {
      if (
        localExt.noCloudSync ||
        localExt.syncStatus === 'local_only' ||
        localExt.name === 'SqlDatabaseBackupExtension' ||
        localExt.name === 'FirebaseAppletConfigImporterExtension'
      ) {
        continue;
      }
      const cloudExt = cloudMap.get(localExt.name.toLowerCase().trim());
      if (cloudExt) {
        // Colisão de versão ou código
        const isDifferentVersion = localExt.version !== cloudExt.version;
        const hasCustomDifferences =
          (localExt.customScript || '') !== (cloudExt.customScript || '') ||
          (localExt.customCss || '') !== (cloudExt.customCss || '');

        if (isDifferentVersion || hasCustomDifferences) {
          conflicts.push({
            id: `conflict-col-${localExt.name}`,
            extensionName: localExt.name,
            type: 'collision_name',
            title: `Colisão de Versão / Código`,
            description: `A extensão '${localExt.name}' possui divergência entre o arquivo local (v${localExt.version}) e a versão armazenada no Firebase (v${cloudExt.version}).`,
            localVersion: localExt.version,
            cloudVersion: cloudExt.version,
            localMeta: localExt,
            cloudMeta: cloudExt,
            detectedAt: new Date().toISOString(),
          });
        }
      }

      // Verifica colisão de ID de ferramenta se houver toolConfig
      if (localExt.toolConfig?.toolId) {
        for (const cloudExt of cloudExtensions) {
          if (
            cloudExt.name.toLowerCase() !== localExt.name.toLowerCase() &&
            cloudExt.toolConfig?.toolId === localExt.toolConfig.toolId
          ) {
            conflicts.push({
              id: `conflict-tool-${localExt.name}-${cloudExt.name}`,
              extensionName: localExt.name,
              type: 'collision_function',
              title: `Colisão de Função / Ferramenta (${localExt.toolConfig.toolId})`,
              description: `A ferramenta de ID '${localExt.toolConfig.toolId}' da extensão '${localExt.name}' colide com a mesma funcionalidade registrada por '${cloudExt.name}' na nuvem.`,
              localMeta: localExt,
              cloudMeta: cloudExt,
              detectedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * 304.4: Analisa o conteúdo de um arquivo de extensão enviado pelo burocrata (index.js, index.ts ou .json)
   * e extrai os metadados necessários para salvamento na nuvem.
   */
  public parseUploadedExtensionFile(
    fileContent: string,
    fileName: string
  ): {
    success: boolean;
    meta?: Partial<InstalledExtensionMeta>;
    error?: string;
  } {
    if (!fileContent || !fileContent.trim()) {
      return { success: false, error: 'O arquivo enviado está vazio.' };
    }

    const trimmed = fileContent.trim();

    // 1. Formato JSON (Manifesto Direto)
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (!parsed.name) {
          return { success: false, error: 'O manifesto JSON deve conter pelo menos a propriedade "name".' };
        }
        return {
          success: true,
          meta: {
            id: parsed.id || `ext-${this.sanitizeDocId(parsed.name).toLowerCase()}`,
            name: parsed.name,
            version: parsed.version || '1.0.0',
            description: parsed.description || 'Extensão carregada via arquivo JSON pelo burocrata.',
            author: parsed.author || 'Burocrata Administrador',
            category: parsed.category || 'tool',
            enabled: parsed.enabled !== false,
            isCore: false,
            hooks: parsed.hooks || ['render:wikitext'],
            customScript: parsed.customScript || parsed.script || '',
            customCss: parsed.customCss || '',
            customTags: parsed.customTags,
            toolConfig: parsed.toolConfig,
            themeConfig: parsed.themeConfig,
            editorPluginConfig: parsed.editorPluginConfig,
            bannerConfig: parsed.bannerConfig,
            filterRules: parsed.filterRules,
            dependencies: parsed.dependencies,
            settingsSchema: parsed.settingsSchema,
            settings: parsed.settings || {},
            originFile: fileName,
            uploadedFile: fileName,
          },
        };
      } catch (err: any) {
        return { success: false, error: `Erro ao analisar JSON: ${err?.message}` };
      }
    }

    // 2. Formato JavaScript / TypeScript (index.js / index.ts)
    try {
      let extName = '';
      let extVersion = '1.0.0';
      let extDesc = '';
      let extAuthor = 'Burocrata Administrador';
      let extCategory: any = 'tool';
      const hooksList: string[] = [];

      // Extrai nome da classe ou método getName()
      const classMatch = fileContent.match(/class\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        extName = classMatch[1];
      }

      const getNameMatch = fileContent.match(/getName\s*\(\s*\)[^{]*\{[\s\S]*?return\s+['"`]([^'"`]+)['"`]/);
      if (getNameMatch) {
        extName = getNameMatch[1];
      }

      // Extrai getVersion()
      const getVersionMatch = fileContent.match(/getVersion\s*\(\s*\)[^{]*\{[\s\S]*?return\s+['"`]([^'"`]+)['"`]/);
      if (getVersionMatch) {
        extVersion = getVersionMatch[1];
      }

      // Extrai getDescription()
      const getDescMatch = fileContent.match(/getDescription\s*\(\s*\)[^{]*\{[\s\S]*?return\s+['"`]([^'"`]+)['"`]/);
      if (getDescMatch) {
        extDesc = getDescMatch[1];
      }

      // Extrai getAuthor()
      const getAuthorMatch = fileContent.match(/getAuthor\s*\(\s*\)[^{]*\{[\s\S]*?return\s+['"`]([^'"`]+)['"`]/);
      if (getAuthorMatch) {
        extAuthor = getAuthorMatch[1];
      }

      // Extrai getCategory()
      const getCategoryMatch = fileContent.match(/getCategory\s*\(\s*\)[^{]*\{[\s\S]*?return\s+['"`]([^'"`]+)['"`]/);
      if (getCategoryMatch) {
        extCategory = getCategoryMatch[1];
      }

      // Procura hooks registrados no onRegister
      const hookMatches = fileContent.matchAll(/hooks\.(addFilter|addAction)\s*\(\s*['"`]([^'"`]+)['"`]/g);
      for (const m of hookMatches) {
        if (m[2] && !hooksList.includes(m[2])) {
          hooksList.push(m[2]);
        }
      }

      // Se não encontrou o nome pela sintaxe da classe, usa o nome do arquivo
      if (!extName) {
        extName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
      }

      if (!extDesc) {
        extDesc = `Extensão carregada via arquivo '${fileName}' pelo burocrata.`;
      }

      return {
        success: true,
        meta: {
          id: `ext-${this.sanitizeDocId(extName).toLowerCase()}`,
          name: extName,
          version: extVersion,
          description: extDesc,
          author: extAuthor,
          category: extCategory,
          enabled: true,
          isCore: false,
          hooks: hooksList.length > 0 ? hooksList : ['render:wikitext'],
          customScript: fileContent,
          originFile: fileName,
          uploadedFile: fileName,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Erro ao analisar arquivo JS/TS: ${err?.message || 'Sintaxe inválida'}`,
      };
    }
  }
}
