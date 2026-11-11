/**
 * ============================================================================
 * WIKIZERO - ARQUIVO DE CONFIGURAÇÃO DO DESENVOLVEDOR / PROGRAMADOR
 * ============================================================================
 * 
 * Mantendo o banco de dados original (wzzm-ce3fc) a partir de src/firebase.ts
 */

import { firebaseConfig as baseAppletConfig } from '../../firebase';

export interface FirebaseCustomSettings {
  environmentLabel: string;
  firestoreDatabaseId: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  options: {
    enableAutoSync: boolean;
    enableOfflinePersistence: boolean;
    pingHealthCheckIntervalMs: number;
    developerNotes?: string;
    planTier?: 'spark' | 'blaze';
    autoBackupEnabled?: boolean;
    backupScheduleCron?: string;
    backupBucketUri?: string;
    enablePitr?: boolean;
  };
}

export const STORAGE_KEY_CUSTOM_FIREBASE_CONFIG = 'wikiworldweb_custom_firebase_credentials';

export function getCustomStoredConfig(): Partial<FirebaseCustomSettings['firebaseConfig']> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_FIREBASE_CONFIG);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.apiKey && parsed.projectId) {
      return parsed;
    }
  } catch {
    // ignora erros de parse
  }
  return null;
}

export function saveCustomStoredConfig(cfg: Partial<FirebaseCustomSettings['firebaseConfig']>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CUSTOM_FIREBASE_CONFIG, JSON.stringify(cfg));
}

export function clearCustomStoredConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_CUSTOM_FIREBASE_CONFIG);
}

export function isUsingCustomStoredConfig(): boolean {
  return !!getCustomStoredConfig();
}

/**
 * CONFIGURAÇÃO ATIVA DO BANCO DE DADOS E FIREBASE
 * Mantém o banco de dados original wzzm-ce3fc.
 */
export const ACTIVE_FIREBASE_CONFIG: FirebaseCustomSettings = {
  environmentLabel: "WikiWorldWeb - wzzm-ce3fc (Banco Original)",
  firestoreDatabaseId: "(default)",
  firebaseConfig: {
    apiKey: baseAppletConfig.apiKey,
    authDomain: baseAppletConfig.authDomain,
    projectId: baseAppletConfig.projectId,
    storageBucket: baseAppletConfig.storageBucket,
    messagingSenderId: baseAppletConfig.messagingSenderId,
    appId: baseAppletConfig.appId,
    measurementId: undefined,
  },
  options: {
    enableAutoSync: true,
    enableOfflinePersistence: true,
    pingHealthCheckIntervalMs: 60000,
    developerNotes: "Configuração do Firebase original preservada e ativa",
    planTier: 'blaze',
    autoBackupEnabled: true,
    backupScheduleCron: '0 3 * * *',
    backupBucketUri: `gs://${baseAppletConfig.projectId}-firestore-backups`,
    enablePitr: true,
  },
};

export function getActiveFirebaseConfig() {
  const custom = getCustomStoredConfig();
  if (custom && custom.apiKey && custom.projectId) {
    return {
      apiKey: custom.apiKey,
      authDomain: custom.authDomain || `${custom.projectId}.firebaseapp.com`,
      projectId: custom.projectId,
      storageBucket: custom.storageBucket || `${custom.projectId}.firebasestorage.app`,
      messagingSenderId: custom.messagingSenderId || '',
      appId: custom.appId || '',
      measurementId: custom.measurementId || undefined,
      firestoreDatabaseId: ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId,
      isCustom: true,
    };
  }

  return {
    ...ACTIVE_FIREBASE_CONFIG.firebaseConfig,
    firestoreDatabaseId: ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId,
    isCustom: false,
  };
}

export default ACTIVE_FIREBASE_CONFIG;
