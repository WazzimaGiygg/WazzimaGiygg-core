/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Configurações de Privacidade por Padrão (Privacy by Default) e
 * Conformidade com a LGPD (Lei nº 13.709/2018) e o Marco Civil da Internet
 * (Lei nº 12.965/2014 e Decreto nº 8.771/2016).
 */

import {
  getStoredCookieConsent,
  getConsentHistory,
  listActiveDocumentCookies,
} from './cookieConsent';

export const PRIVACY_SETTINGS_KEY = 'wzzm_privacy_settings';
export const PRIVACY_SETTINGS_CHANGED_EVENT = 'wzzm:privacy-settings-changed';
export const MARCO_CIVIL_LOG_RETENTION_DAYS = 180; // Art. 15 da Lei nº 12.965/2014 (6 meses)

export interface PrivacyComplianceSettings {
  /** Privacy by Default (Art. 46, § 2º LGPD): mascara e-mails em visualizações públicas */
  maskEmailInPublicViews: boolean;
  /** Marco Civil Art. 7º, VI: exibe aviso transparente antes de redirecionar para domínios externos */
  confirmExternalLinks: boolean;
  /** Respeita automaticamente o sinal Do Not Track (DNT) / Global Privacy Control (GPC) do navegador */
  respectBrowserDnt: boolean;
  /** Expurga caches opcionais locais (rascunhos, histórico de convidado, chats em cache) ao sair */
  autoPurgeLocalCacheOnLogout: boolean;
  /** Minimização estrita (Art. 6º, III LGPD): reduz metadados técnicos em logs locais */
  minimalDataCollectionMode: boolean;
  updatedAt: string;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacyComplianceSettings = {
  maskEmailInPublicViews: true,
  confirmExternalLinks: true,
  respectBrowserDnt: true,
  autoPurgeLocalCacheOnLogout: true,
  minimalDataCollectionMode: true,
  updatedAt: new Date(0).toISOString(),
};

export function isBrowserDoNotTrackActive(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    msDoNotTrack?: string;
    globalPrivacyControl?: boolean;
  };
  const win = typeof window !== 'undefined' ? (window as Window & { doNotTrack?: string }) : undefined;
  return (
    nav.doNotTrack === '1' ||
    nav.doNotTrack === 'yes' ||
    nav.msDoNotTrack === '1' ||
    win?.doNotTrack === '1' ||
    nav.globalPrivacyControl === true
  );
}

export function getPrivacySettings(): PrivacyComplianceSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(PRIVACY_SETTINGS_KEY);
    if (!raw) {
      return {
        ...DEFAULT_PRIVACY_SETTINGS,
        updatedAt: new Date().toISOString(),
      };
    }
    const parsed = JSON.parse(raw) as Partial<PrivacyComplianceSettings>;
    return {
      maskEmailInPublicViews:
        typeof parsed.maskEmailInPublicViews === 'boolean'
          ? parsed.maskEmailInPublicViews
          : DEFAULT_PRIVACY_SETTINGS.maskEmailInPublicViews,
      confirmExternalLinks:
        typeof parsed.confirmExternalLinks === 'boolean'
          ? parsed.confirmExternalLinks
          : DEFAULT_PRIVACY_SETTINGS.confirmExternalLinks,
      respectBrowserDnt:
        typeof parsed.respectBrowserDnt === 'boolean'
          ? parsed.respectBrowserDnt
          : DEFAULT_PRIVACY_SETTINGS.respectBrowserDnt,
      autoPurgeLocalCacheOnLogout:
        typeof parsed.autoPurgeLocalCacheOnLogout === 'boolean'
          ? parsed.autoPurgeLocalCacheOnLogout
          : DEFAULT_PRIVACY_SETTINGS.autoPurgeLocalCacheOnLogout,
      minimalDataCollectionMode:
        typeof parsed.minimalDataCollectionMode === 'boolean'
          ? parsed.minimalDataCollectionMode
          : DEFAULT_PRIVACY_SETTINGS.minimalDataCollectionMode,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }
}

export function savePrivacySettings(
  updates: Partial<Omit<PrivacyComplianceSettings, 'updatedAt'>>
): PrivacyComplianceSettings {
  const current = getPrivacySettings();
  const next: PrivacyComplianceSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(PRIVACY_SETTINGS_CHANGED_EVENT, { detail: next }));
    } catch {
      // Ignore storage errors
    }
  }
  return next;
}

export function resetPrivacySettingsToDefault(): PrivacyComplianceSettings {
  return savePrivacySettings({
    maskEmailInPublicViews: DEFAULT_PRIVACY_SETTINGS.maskEmailInPublicViews,
    confirmExternalLinks: DEFAULT_PRIVACY_SETTINGS.confirmExternalLinks,
    respectBrowserDnt: DEFAULT_PRIVACY_SETTINGS.respectBrowserDnt,
    autoPurgeLocalCacheOnLogout: DEFAULT_PRIVACY_SETTINGS.autoPurgeLocalCacheOnLogout,
    minimalDataCollectionMode: DEFAULT_PRIVACY_SETTINGS.minimalDataCollectionMode,
  });
}

export function subscribePrivacySettings(
  callback: (settings: PrivacyComplianceSettings) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<PrivacyComplianceSettings>).detail ?? getPrivacySettings();
    callback(detail);
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === PRIVACY_SETTINGS_KEY) {
      callback(getPrivacySettings());
    }
  };
  window.addEventListener(PRIVACY_SETTINGS_CHANGED_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(PRIVACY_SETTINGS_CHANGED_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

/**
 * Mascara endereço de e-mail para exibição pública em conformidade com a minimização (Art. 6º, III LGPD).
 * Ex.: "pedrohenrique@gmail.com" -> "ped***@gmail.com"
 */
export function formatPublicAuthorIdentifier(
  rawIdentifier?: string | null,
  maskEmail: boolean = true,
  fallback: string = 'Redação WZZM'
): string {
  if (!rawIdentifier || !rawIdentifier.trim()) return fallback;
  const trimmed = rawIdentifier.trim();
  if (!maskEmail) return trimmed;
  if (!trimmed.includes('@')) {
    return trimmed;
  }
  const [localPart, domain] = trimmed.split('@');
  if (!domain) return trimmed;
  const visible = localPart.slice(0, Math.min(3, localPart.length));
  return `${visible}***@${domain}`;
}

/**
 * Remove dados temporários e caches locais opcionais ao encerrar sessão (sem apagar recusa de cookies ou tema).
 */
export function purgeOptionalLocalSessionData(): string[] {
  if (typeof window === 'undefined') return [];
  const keysToClear = [
    'wzzm_guest_user',
    'wzzm_guest_expiry',
    'wzzm_chat_messages',
    'wikizero_recently_read',
    'wikizero_editorial_metrics',
    'wzzm_analytics_metrics_cache',
    'wzzm_third_party_embeds_cache',
  ];
  const cleared: string[] = [];
  for (const key of keysToClear) {
    try {
      if (window.localStorage.getItem(key) !== null) {
        window.localStorage.removeItem(key);
        cleared.push(key);
      }
    } catch {
      // Ignore storage access errors
    }
  }
  return cleared;
}

export interface TitularDataInventoryItem {
  chave: string;
  categoria: 'Identificação / Sessão' | 'Consentimento LGPD' | 'Preferência Local' | 'Ouvidoria / Auditoria';
  finalidade: string;
  baseLegal: string;
  presenteNoDispositivo: boolean;
  resumoValor: string;
}

export function inspectTitularLocalInventory(currentUser?: any): TitularDataInventoryItem[] {
  const safeGet = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const guestRaw = safeGet('wzzm_guest_user');
  const cienciaRaw = safeGet('wzzm_lgpd_ciencia_absoluta');
  const ticketsRaw = safeGet('wzzm_tickets');
  const cookieRaw = getStoredCookieConsent();
  const privacyRaw = safeGet(PRIVACY_SETTINGS_KEY);
  const themeRaw = safeGet('wzzm_theme');

  return [
    {
      chave: 'Sessão Autenticada (Firebase Auth / Convidado)',
      categoria: 'Identificação / Sessão',
      finalidade: 'Autenticação segura e atribuição de autoria editorial CC-BY-SA.',
      baseLegal: 'LGPD Art. 7º, I e V • Marco Civil Art. 15',
      presenteNoDispositivo: Boolean(currentUser || guestRaw),
      resumoValor: currentUser
        ? `UID: ${currentUser.uid || 'N/D'} (${currentUser.isGuest ? 'Convidado 24h' : 'Conta Google'})`
        : 'Nenhum titular autenticado nesta sessão (leitura anônima)',
    },
    {
      chave: 'wzzm_cookie_consent',
      categoria: 'Consentimento LGPD',
      finalidade: 'Prova de consentimento ou recusa granular de cookies (validade 180 dias).',
      baseLegal: 'LGPD Art. 8º, § 2º e Guia ANPD',
      presenteNoDispositivo: Boolean(cookieRaw),
      resumoValor: cookieRaw
        ? `Protocolo ${cookieRaw.protocolId} (${cookieRaw.decisionMethod})`
        : 'Aguardando decisão no banner (somente essenciais ativos)',
    },
    {
      chave: 'wzzm_privacy_settings',
      categoria: 'Preferência Local',
      finalidade: 'Preferências de minimização, mascaramento público e guarda de redirecionamento.',
      baseLegal: 'LGPD Art. 6º, III e Art. 46, § 2º (Privacy by Default)',
      presenteNoDispositivo: Boolean(privacyRaw),
      resumoValor: privacyRaw ? 'Configurações personalizadas salvas localmente' : 'Padrão máximo de privacidade ativo',
    },
    {
      chave: 'wzzm_lgpd_ciencia_absoluta',
      categoria: 'Consentimento LGPD',
      finalidade: 'Protocolo criptográfico de ciência das regras da LGPD à mostra.',
      baseLegal: 'LGPD Art. 6º, VI (Transparência)',
      presenteNoDispositivo: Boolean(cienciaRaw),
      resumoValor: cienciaRaw ? 'Certidão de ciência registrada neste navegador' : 'Não registrada localmente',
    },
    {
      chave: 'wzzm_tickets',
      categoria: 'Ouvidoria / Auditoria',
      finalidade: 'Histórico local de protocolos abertos na Ouvidoria & Canal LGPD.',
      baseLegal: 'LGPD Art. 18 e Marco Civil Art. 19/21',
      presenteNoDispositivo: Boolean(ticketsRaw),
      resumoValor: ticketsRaw ? `${(JSON.parse(ticketsRaw) as any[]).length} protocolo(s) salvo(s)` : 'Sem protocolos locais',
    },
    {
      chave: 'wzzm_theme',
      categoria: 'Preferência Local',
      finalidade: 'Preferência visual claro/escuro solicitada pelo leitor.',
      baseLegal: 'LGPD Art. 7º, V (Execução de preferência solicitada)',
      presenteNoDispositivo: Boolean(themeRaw),
      resumoValor: themeRaw ? `Tema: ${themeRaw}` : 'Tema padrão do sistema',
    },
  ];
}

/**
 * Gera pacote interoperável em JSON para exercício do direito de Portabilidade (Art. 18, V da LGPD).
 */
export function exportTitularPersonalDataPackage(params: {
  user?: any;
  isGuestUser?: boolean;
}): { filename: string; exportedAt: string } {
  const exportedAt = new Date().toISOString();
  const safeParse = (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const payload = {
    documento: 'Pacote de Portabilidade e Acesso aos Dados Pessoais — LGPD & Marco Civil',
    controlador: 'Portal WazzimaGiygg',
    dpoNome: 'Pedro Henrique Cardona Peres',
    encarregadoDpo: 'pedrohenriquecardonaperes@gmail.com',
    suporteOficial: 'https://support.wazzimagiygg.com/',
    legislacaoAplicavel: [
      'Lei Federal nº 13.709/2018 (LGPD - Art. 6º, IV; Art. 18, II e V)',
      'Lei Federal nº 12.965/2014 (Marco Civil da Internet - Art. 7º, Art. 10 e Art. 15)',
      'Decreto nº 8.771/2016 (Padrões de Segurança e Sigilo de Registros)',
    ],
    exportadoEm: exportedAt,
    doNotTrackDetectadoNoNavegador: isBrowserDoNotTrackActive(),
    titular: params.user
      ? {
          uid: params.user.uid || null,
          nomeExibicao: params.user.displayName || params.user.name || null,
          email: params.user.email || null,
          modoConvidado24h: Boolean(params.isGuestUser || params.user.isGuest),
        }
      : { modo: 'Visitante Anônimo (sem conta autenticada)' },
    configuracoesPrivacidade: getPrivacySettings(),
    consentimentoCookiesLgpd: getStoredCookieConsent(),
    historicoDecisoesCookies: getConsentHistory(),
    cookiesAtivosNoNavegador: listActiveDocumentCookies(),
    cienciaAbsolutaLgpd: safeParse('wzzm_lgpd_ciencia_absoluta'),
    ticketsOuvidoriaLocais: safeParse('wzzm_tickets') || [],
    politicaGuardaMarcoCivil: {
      prazoGuardaRegistrosAcessoDias: MARCO_CIVIL_LOG_RETENTION_DAYS,
      condicaoAcessoTerceiros: 'Exclusivamente mediante ordem judicial específica (Art. 15, § 3º e Art. 22 da Lei nº 12.965/2014).',
      comercializacaoDeDados: 'Proibida por cláusula institucional (zero venda ou cessão a terceiros).',
    },
  };

  const suffix = params.user?.uid ? String(params.user.uid).slice(0, 10) : 'ANONIMO';
  const filename = `Portabilidade_Dados_LGPD_WZZM_${suffix}.json`;

  if (typeof document !== 'undefined') {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return { filename, exportedAt };
}
