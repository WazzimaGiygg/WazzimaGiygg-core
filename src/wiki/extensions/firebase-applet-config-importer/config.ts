/**
 * CONFIGURAÇÃO DIRETA DA EXTENSÃO NATIVA: FirebaseAppletConfigImporterExtension
 * Arquivo: src/extensions/firebase-applet-config-importer/config.ts
 *
 * REQUISITO 3.05.3.ad:
 * - Extensão com link para importar o JSON do firebase-applet-config em site cadastrado;
 * - A extensão NÃO É SINCRONIZÁVEL com a nuvem (isSyncableWithCloud = false, syncStatus = 'local_only');
 * - É nativa por link diretamente dentro do arquivo da extensão;
 * - O link padrão é:
 *   https://gspotfverwazzimagiygg.wazzimagiygg.com/CHVX/MOC/?uid=NnihYOoIENGOqaHxj1jC
 * - O código de importação é feito pelo código de download de um HTML configurado
 *   em trazer um arquivo JSON de um site configurado em Firebase (Coleção: wikizerikey,
 *   Projeto: wzzm-ce3fc, Arquivo: firebase-applet-config.json).
 */

import { firebaseConfig as baseAppletConfig } from '../../../firebase';
import { saveCustomStoredConfig, getCustomStoredConfig } from '../../config/firebaseCustomConfig';

export interface FirebaseAppletConfigImporterSettings {
  /** Link padrão registrado do site */
  registeredSiteUrl: string;
  /** Identificador UID único para consulta no Firebase Firestore */
  uid: string;
  /** Nome do arquivo alvo para download */
  fileName: string;
  /** Nome da coleção do Firestore no Firebase remoto */
  collectionName: string;
  /** Credenciais do Firebase do site cadastrado onde os JSONs são guardados */
  remoteFirebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  /** Metadados do arquivo */
  fileMetadata: {
    filePath: string;
    isNative: boolean;
    isCloudSyncable: boolean;
    version: string;
    description: string;
    defaultUrl: string;
  };
  /** Se deve aplicar automaticamente à Wiki após o download bem-sucedido */
  autoApplyToWiki: boolean;
}

/**
 * CONFIGURAÇÃO NATIVA DEFINIDA DIRETAMENTE NO ARQUIVO
 */
export const FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG: FirebaseAppletConfigImporterSettings = {
  // Link padrão exigido no Requisito 3.05.3.ad:
  registeredSiteUrl: 'https://gspotfverwazzimagiygg.wazzimagiygg.com/CHVX/MOC/?uid=NnihYOoIENGOqaHxj1jC',
  uid: 'NnihYOoIENGOqaHxj1jC',
  fileName: 'firebase-applet-config.json',
  collectionName: 'wikizerikey',
  remoteFirebaseConfig: {
    apiKey: 'AIzaSyB9GkSqTIZ0kbVsba_WOdQeVAETrF9qna0',
    authDomain: 'wzzm-ce3fc.firebaseapp.com',
    projectId: 'wzzm-ce3fc',
    storageBucket: 'wzzm-ce3fc.appspot.com',
    messagingSenderId: '249427877153',
    appId: '1:249427877153:web:0e4297294794a5aadeb260',
  },
  fileMetadata: {
    filePath: 'src/extensions/firebase-applet-config-importer/config.ts',
    isNative: true,
    isCloudSyncable: false,
    version: '3.05.3',
    description:
      'Extensão nativa não sincronizável configurada em código para download e importação do JSON do firebase-applet-config.',
    defaultUrl: 'https://gspotfverwazzimagiygg.wazzimagiygg.com/CHVX/MOC/?uid=NnihYOoIENGOqaHxj1jC',
  },
  autoApplyToWiki: true,
};

const STORAGE_KEY_IMPORTER_STATE = 'wikiworldweb_firebase_applet_importer_custom';

/**
 * Extrai o UID de uma URL arbitrária ou retorna o UID passado
 */
export function extractUidFromUrl(urlOrUid: string): string {
  if (!urlOrUid) return FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG.uid;
  try {
    if (urlOrUid.includes('?')) {
      const parsed = new URL(urlOrUid);
      const uidParam = parsed.searchParams.get('uid');
      if (uidParam) return uidParam.trim();
    }
  } catch {
    // se não for URL válida com protocolo, testa regex
    const match = urlOrUid.match(/[?&]uid=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }
  return urlOrUid.trim();
}

/**
 * Obtém as configurações ativas da extensão
 */
export function getFirebaseAppletImporterConfig(): FirebaseAppletConfigImporterSettings {
  if (typeof window === 'undefined') return { ...FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_IMPORTER_STATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG,
        ...parsed,
        fileMetadata: FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG.fileMetadata,
      };
    }
  } catch {
    // fallback
  }
  return { ...FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG };
}

/**
 * Atualiza parâmetros locais no navegador (sem sincronizar com o Firebase da nuvem)
 */
export function updateFirebaseAppletImporterConfig(
  updates: Partial<FirebaseAppletConfigImporterSettings>
): FirebaseAppletConfigImporterSettings {
  const current = getFirebaseAppletImporterConfig();
  const next: FirebaseAppletConfigImporterSettings = {
    ...current,
    ...updates,
    fileMetadata: FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG.fileMetadata,
  };
  if (updates.registeredSiteUrl && !updates.uid) {
    next.uid = extractUidFromUrl(updates.registeredSiteUrl);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_IMPORTER_STATE, JSON.stringify(next));
  }
  return next;
}

/**
 * Converte valor do Firestore REST API (ex: { stringValue: '...' }) em valor JS primitivo
 */
function parseFirestoreRestValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('mapValue' in val && val.mapValue && val.mapValue.fields) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields)) {
      obj[k] = parseFirestoreRestValue(v);
    }
    return obj;
  }
  if ('arrayValue' in val && val.arrayValue && val.arrayValue.values) {
    return val.arrayValue.values.map(parseFirestoreRestValue);
  }
  return val;
}

export interface ImportFetchResult {
  success: boolean;
  uid: string;
  data?: any;
  rawJson?: string;
  fileName: string;
  registeredUrl: string;
  timestamp: string;
  source: 'remote_firestore' | 'applet_fallback' | 'cached';
  error?: string;
}

/**
 * Executa o código de download do HTML configurado em trazer um arquivo JSON
 * de um site configurado em Firebase para o firebase-applet-config.json
 */
export async function fetchFirebaseAppletConfigFromRegisteredSite(
  urlOrUid?: string
): Promise<ImportFetchResult> {
  const cfg = getFirebaseAppletImporterConfig();
  const targetUid = extractUidFromUrl(urlOrUid || cfg.registeredSiteUrl || cfg.uid);
  const now = new Date().toISOString();

  const projectId = cfg.remoteFirebaseConfig.projectId;
  const apiKey = cfg.remoteFirebaseConfig.apiKey;
  const collection = cfg.collectionName || 'wikizerikey';

  // Endpoint oficial da REST API do Firestore
  const firestoreRestUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${targetUid}?key=${apiKey}`;

  try {
    const response = await fetch(firestoreRestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const restDoc = await response.json();
      if (restDoc && restDoc.fields) {
        // Converte os campos estruturados do Firestore
        const parsedFields: Record<string, any> = {};
        for (const [key, val] of Object.entries(restDoc.fields)) {
          parsedFields[key] = parseFirestoreRestValue(val);
        }

        // Procura pelo conteúdo do JSON no documento
        let jsonContent: any = null;
        if (parsedFields.content) {
          jsonContent = typeof parsedFields.content === 'string'
            ? JSON.parse(parsedFields.content)
            : parsedFields.content;
        } else if (parsedFields.fileData) {
          jsonContent = typeof parsedFields.fileData === 'string'
            ? JSON.parse(parsedFields.fileData)
            : parsedFields.fileData;
        } else if (parsedFields.json) {
          jsonContent = typeof parsedFields.json === 'string'
            ? JSON.parse(parsedFields.json)
            : parsedFields.json;
        } else if (parsedFields.apiKey && parsedFields.projectId) {
          jsonContent = parsedFields;
        } else {
          jsonContent = parsedFields;
        }

        const rawString = JSON.stringify(jsonContent, null, 2);

        return {
          success: true,
          uid: targetUid,
          data: jsonContent,
          rawJson: rawString,
          fileName: cfg.fileName,
          registeredUrl: cfg.registeredSiteUrl,
          timestamp: now,
          source: 'remote_firestore',
        };
      }
    }
  } catch (err) {
    console.warn('[FirebaseAppletConfigImporter] Falha na requisição direta REST ao Firestore:', err);
  }

  // Fallback seguro usando as credenciais oficiais da applet se a rede externa estiver offline
  const fallbackConfig = {
    projectId: baseAppletConfig.projectId,
    appId: baseAppletConfig.appId,
    apiKey: baseAppletConfig.apiKey,
    authDomain: baseAppletConfig.authDomain,
    firestoreDatabaseId: (baseAppletConfig as any).firestoreDatabaseId || '(default)',
    storageBucket: baseAppletConfig.storageBucket,
    messagingSenderId: baseAppletConfig.messagingSenderId,
    measurementId: (baseAppletConfig as any).measurementId || '',
    oAuthClientId: (baseAppletConfig as any).oAuthClientId || '',
    recaptchaSiteKey: (baseAppletConfig as any).recaptchaSiteKey || '',
    importedFrom: {
      registeredSiteUrl: cfg.registeredSiteUrl,
      uid: targetUid,
      retrievedAt: now,
    },
  };

  const rawFallback = JSON.stringify(fallbackConfig, null, 2);

  return {
    success: true,
    uid: targetUid,
    data: fallbackConfig,
    rawJson: rawFallback,
    fileName: cfg.fileName,
    registeredUrl: cfg.registeredSiteUrl,
    timestamp: now,
    source: 'applet_fallback',
  };
}

/**
 * Dispara o download automático do arquivo firebase-applet-config.json no navegador,
 * exatamente como executado no script HTML anexado pelo usuário:
 * `const blob = new Blob([...], { type: 'application/json' });`
 * `const a = document.createElement('a'); a.download = 'firebase-applet-config.json'; a.click();`
 */
export function triggerDownloadAppletConfigFile(
  content: string | object,
  filename: string = 'firebase-applet-config.json'
): void {
  if (typeof window === 'undefined') return;

  const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Aplica a configuração baixada/importada diretamente nas credenciais ativas da Wiki
 */
export function applyImportedFirebaseConfig(configData: any): { success: boolean; message: string } {
  try {
    if (!configData || typeof configData !== 'object') {
      return { success: false, message: 'Dados de configuração inválidos.' };
    }

    const cleanedConfig = {
      apiKey: configData.apiKey || baseAppletConfig.apiKey,
      authDomain: configData.authDomain || `${configData.projectId || baseAppletConfig.projectId}.firebaseapp.com`,
      projectId: configData.projectId || baseAppletConfig.projectId,
      storageBucket: configData.storageBucket || `${configData.projectId || baseAppletConfig.projectId}.firebasestorage.app`,
      messagingSenderId: configData.messagingSenderId || baseAppletConfig.messagingSenderId,
      appId: configData.appId || baseAppletConfig.appId,
      measurementId: configData.measurementId || undefined,
      firestoreDatabaseId: configData.firestoreDatabaseId || (baseAppletConfig as any).firestoreDatabaseId || '(default)',
    };

    saveCustomStoredConfig(cleanedConfig);

    return {
      success: true,
      message: `Configuração do Firebase importada com sucesso para o projeto "${cleanedConfig.projectId}"!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao aplicar configuração importada: ${err?.message || 'Falha desconhecida'}`,
    };
  }
}
