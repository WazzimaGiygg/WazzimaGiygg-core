/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Governança e Sistema de Cookies alinhado à LGPD (Lei nº 13.709/2018)
 * e ao Guia Orientativo da ANPD sobre Cookies e Proteção de Dados Pessoais.
 *
 * Princípios aplicados:
 * - Consentimento livre, informado, inequívoco e granular (Art. 5º, XII e Art. 8º)
 * - Opt-in estrito: categorias não essenciais iniciam DESATIVADAS por padrão
 * - Ônus da prova do consentimento (Art. 8º, § 2º): registro local auditável com protocolo e validade (180 dias)
 * - Revogação facilitada e gratuita a qualquer momento (Art. 8º, § 5º e Art. 18, IX)
 * - Limpeza ativa de cookies não essenciais em caso de recusa ou revogação
 */

export const COOKIE_POLICY_VERSION = 'LGPD-COOKIES-2026.1';
export const CONSENT_TTL_DAYS = 180; // 6 meses (prazo recomendado pela ANPD)
export const CONSENT_STORAGE_KEY = 'wzzm_cookie_consent';
export const CONSENT_HISTORY_STORAGE_KEY = 'wzzm_cookie_consent_history';
export const WIKI_CONSENT_STORAGE_KEY = 'wikizero_cookie_consent';
export const CONSENT_COOKIE_NAME = 'wzzm_cookie_consent';
export const CONSENT_CHANGED_EVENT = 'wzzm:cookie-consent-changed';

export type CookieCategoryId = 'essential' | 'functional' | 'analytics' | 'thirdParty';
export type ConsentDecisionMethod = 'accept_all' | 'reject_non_essential' | 'custom' | 'revoked';

export interface LgpdCookieConsent {
  version: string;
  timestamp: string;
  expiresAt: string;
  protocolId: string;
  decisionMethod: ConsentDecisionMethod;
  essential: true;
  functional: boolean;
  analytics: boolean;
  /** Mantido para compatibilidade com a interface CookieConsent da WikiZero */
  advertising: boolean;
  thirdParty: boolean;
  legalBasisSummary: string;
}

export interface CookieConsentHistoryEntry {
  protocolId: string;
  timestamp: string;
  expiresAt: string;
  version: string;
  decisionMethod: ConsentDecisionMethod;
  essential: true;
  functional: boolean;
  analytics: boolean;
  thirdParty: boolean;
}

export interface CookieCategoryMeta {
  id: CookieCategoryId;
  name: string;
  required: boolean;
  legalBasis: string;
  retention: string;
  purpose: string;
  examples: string[];
}

export interface CookieInventoryItem {
  name: string;
  provider: string;
  storageType: 'Cookie HTTP (1ª parte)' | 'LocalStorage' | 'SessionStorage / Auth';
  category: CookieCategoryId;
  purpose: string;
  retention: string;
  legalBasis: string;
}

export const COOKIE_CATEGORIES: CookieCategoryMeta[] = [
  {
    id: 'essential',
    name: 'Estritamente Necessários (Essenciais)',
    required: true,
    legalBasis: 'Execução de serviços solicitados / Legítimo interesse e segurança (Art. 7º, V e IX da LGPD)',
    retention: 'Sessão até 180 dias (registro de recusa/consentimento)',
    purpose:
      'Indispensáveis para autenticação segura via Firebase Auth, proteção contra CSRF/abusos, verificação de compatibilidade forçada pelo usuário e armazenamento da sua própria escolha de consentimento de cookies.',
    examples: ['wzzm_cookie_consent', 'wzzm_force_browser_entry', 'firebase:authUser:*'],
  },
  {
    id: 'functional',
    name: 'Preferências e Experiência de Leitura (Funcionais)',
    required: false,
    legalBasis: 'Consentimento expresso do titular (Art. 7º, I da LGPD)',
    retention: 'Até 180 dias (ou até revogação)',
    purpose:
      'Memoriza preferências opcionais de leitura, histórico recente de artigos consultados na WikiZero, modo de dispositivo (desktop/mobile) e rascunhos locais opcionais.',
    examples: ['wikizero_device_mode', 'wikizero_recently_read', 'wikizero_theme_v3'],
  },
  {
    id: 'analytics',
    name: 'Métricas de Desempenho e Audiência Anonimizada',
    required: false,
    legalBasis: 'Consentimento expresso do titular (Art. 7º, I da LGPD)',
    retention: 'Até 90 dias (ou até revogação)',
    purpose:
      'Permite mensurar estatísticas agregadas de leitura de verbetes e desempenho de carregamento de páginas sem identificação individual ou perfilamento comportamental.',
    examples: ['wzzm_analytics_session', 'wikizero_editorial_metrics'],
  },
  {
    id: 'thirdParty',
    name: 'Conteúdo Incorporado e Recursos de Terceiros',
    required: false,
    legalBasis: 'Consentimento expresso do titular (Art. 7º, I da LGPD)',
    retention: 'Conforme política do provedor (máx. 180 dias)',
    purpose:
      'Habilita integrações externas opcionais (como fontes remotas, verificações auxiliares e mídia incorporada). Não utilizamos cookies de publicidade programática ou rastreamento comercial (ad-tech).',
    examples: ['wzzm_third_party_embeds', 'G_ENABLED_IDPS (quando autorizado)'],
  },
];

export const COOKIE_INVENTORY: CookieInventoryItem[] = [
  {
    name: 'wzzm_cookie_consent',
    provider: 'WazzimaGiygg (Primário)',
    storageType: 'Cookie HTTP (1ª parte)',
    category: 'essential',
    purpose: 'Registra a decisão granular de consentimento ou recusa LGPD, protocolo e prazo de expiração.',
    retention: '180 dias',
    legalBasis: 'Obrigação legal / Prestação de contas (Art. 6º, X e Art. 8º, § 2º LGPD)',
  },
  {
    name: 'firebase:authUser / __session',
    provider: 'Firebase Authentication (Google)',
    storageType: 'SessionStorage / Auth',
    category: 'essential',
    purpose: 'Mantém sessão autenticada quando o usuário opta voluntariamente por realizar login.',
    retention: 'Sessão ativa até logout',
    legalBasis: 'Execução de serviço solicitado pelo titular (Art. 7º, V LGPD)',
  },
  {
    name: 'wzzm_force_browser_entry',
    provider: 'WazzimaGiygg (Primário)',
    storageType: 'LocalStorage',
    category: 'essential',
    purpose: 'Memoriza quando o usuário força manualmente a entrada no verificador de compatibilidade de navegador.',
    retention: 'Persistente até limpeza do navegador',
    legalBasis: 'Execução de funcionalidade solicitada (Art. 7º, V LGPD)',
  },
  {
    name: 'wzzm_theme / wikizero_theme_v3',
    provider: 'WazzimaGiygg (Primário)',
    storageType: 'LocalStorage',
    category: 'functional',
    purpose: 'Guarda preferência visual de tema (claro/escuro ou temas da Wiki) escolhida pelo visitante.',
    retention: '180 dias ou até alteração',
    legalBasis: 'Consentimento (Art. 7º, I LGPD)',
  },
  {
    name: 'wikizero_recently_read / wikizero_device_mode',
    provider: 'WazzimaGiygg (Primário)',
    storageType: 'LocalStorage',
    category: 'functional',
    purpose: 'Lista local de verbetes lidos recentemente e modo de layout escolhido pelo leitor.',
    retention: '180 dias ou até revogação',
    legalBasis: 'Consentimento (Art. 7º, I LGPD)',
  },
  {
    name: 'wzzm_analytics_session',
    provider: 'WazzimaGiygg (Primário)',
    storageType: 'Cookie HTTP (1ª parte)',
    category: 'analytics',
    purpose: 'Identificador técnico efêmero e não nominal para contabilização agregada de leituras.',
    retention: '90 dias (desativado por padrão)',
    legalBasis: 'Consentimento (Art. 7º, I LGPD)',
  },
  {
    name: 'wzzm_third_party_embeds',
    provider: 'WazzimaGiygg / Provedores Externos',
    storageType: 'Cookie HTTP (1ª parte)',
    category: 'thirdParty',
    purpose: 'Autoriza carregamento de widgets externos opcionais incorporados em artigos.',
    retention: '180 dias (desativado por padrão)',
    legalBasis: 'Consentimento (Art. 7º, I LGPD)',
  },
];

const OPTIONAL_COOKIE_NAMES: Record<Exclude<CookieCategoryId, 'essential'>, string[]> = {
  functional: ['wzzm_pref_layout', 'wikizero_pref_mode'],
  analytics: ['wzzm_analytics_session', '_ga', '_gid', '_gat'],
  thirdParty: ['wzzm_third_party_embeds'],
};

const OPTIONAL_STORAGE_KEYS: Record<Exclude<CookieCategoryId, 'essential'>, string[]> = {
  functional: ['wikizero_recently_read', 'wikizero_device_mode'],
  analytics: ['wzzm_analytics_metrics_cache', 'wikizero_editorial_metrics'],
  thirdParty: ['wzzm_third_party_embeds_cache'],
};

function generateConsentProtocolId(): string {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `LGPD-CK-${ts}-${rand}`;
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function expireCookieByName(name: string): void {
  if (typeof document === 'undefined') return;
  try {
    const trimmed = name.trim();
    if (!trimmed) return;
    const hostParts = typeof window !== 'undefined' ? window.location.hostname.split('.') : [];
    document.cookie = `${encodeURIComponent(trimmed)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    if (hostParts.length >= 2) {
      const rootDomain = '.' + hostParts.slice(-2).join('.');
      document.cookie = `${encodeURIComponent(trimmed)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${rootDomain}; SameSite=Lax`;
    }
  } catch {
    // Ignore restricted frame cookie errors
  }
}

export function writeFirstPartyCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === 'undefined') return;
  try {
    const maxAgeSeconds = Math.max(60, Math.floor(maxAgeDays * 86400));
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax${secureFlag}`;
  } catch {
    // Ignore cookie errors
  }
}

export function setOptionalCookie(
  name: string,
  value: string,
  category: Exclude<CookieCategoryId, 'essential'>,
  maxAgeDays: number = 90
): boolean {
  if (!hasCookieCategoryConsent(category)) {
    return false;
  }
  writeFirstPartyCookie(name, value, maxAgeDays);
  return true;
}

export function listActiveDocumentCookies(): { name: string; valuePreview: string }[] {
  if (typeof document === 'undefined' || !document.cookie) return [];
  return document.cookie
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const eqIdx = pair.indexOf('=');
      const rawName = eqIdx >= 0 ? pair.slice(0, eqIdx) : pair;
      const rawVal = eqIdx >= 0 ? pair.slice(eqIdx + 1) : '';
      let decodedName = rawName;
      let decodedVal = rawVal;
      try {
        decodedName = decodeURIComponent(rawName);
        decodedVal = decodeURIComponent(rawVal);
      } catch {
        // Keep raw strings
      }
      return {
        name: decodedName,
        valuePreview: decodedVal.length > 48 ? decodedVal.slice(0, 48) + '...' : decodedVal,
      };
    });
}

export function enforceCookiePreferences(consent: LgpdCookieConsent | null): void {
  if (typeof window === 'undefined') return;

  const categoriesToCheck: Exclude<CookieCategoryId, 'essential'>[] = [
    'functional',
    'analytics',
    'thirdParty',
  ];

  for (const cat of categoriesToCheck) {
    const allowed = Boolean(consent && consent[cat]);
    if (!allowed) {
      for (const cookieName of OPTIONAL_COOKIE_NAMES[cat]) {
        expireCookieByName(cookieName);
      }
      try {
        for (const storageKey of OPTIONAL_STORAGE_KEYS[cat]) {
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        // Ignore storage errors
      }
    }
  }

  // Varredura defensiva em document.cookie para remover cookies não essenciais residuais
  if (!consent || (!consent.analytics && !consent.thirdParty)) {
    const activeCookies = listActiveDocumentCookies();
    for (const c of activeCookies) {
      const lower = c.name.toLowerCase();
      if (
        lower.startsWith('_ga') ||
        lower.startsWith('_gid') ||
        lower.startsWith('_gat') ||
        (!consent?.thirdParty && lower.includes('third_party')) ||
        (!consent?.analytics && lower.includes('analytics'))
      ) {
        expireCookieByName(c.name);
      }
    }
  }
}

export function isConsentRecordValid(record: any): record is LgpdCookieConsent {
  if (!record || typeof record !== 'object') return false;
  if (record.version !== COOKIE_POLICY_VERSION) return false;
  if (!record.timestamp && !record.date) return false;
  if (record.expiresAt) {
    const expTime = new Date(record.expiresAt).getTime();
    if (isNaN(expTime) || Date.now() > expTime) {
      return false;
    }
  }
  return record.essential === true;
}

export function getStoredCookieConsent(): LgpdCookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, any>;
    if (!isConsentRecordValid(parsed)) {
      return null;
    }
    const legacyRecord = parsed as LgpdCookieConsent & { date?: string };
    return {
      version: legacyRecord.version,
      timestamp: legacyRecord.timestamp || legacyRecord.date || new Date().toISOString(),
      expiresAt: legacyRecord.expiresAt || addDaysIso(CONSENT_TTL_DAYS),
      protocolId: legacyRecord.protocolId || 'LGPD-CK-MIGRADO',
      decisionMethod: legacyRecord.decisionMethod || (legacyRecord.analytics ? 'accept_all' : 'reject_non_essential'),
      essential: true,
      functional: Boolean(parsed.functional),
      analytics: Boolean(parsed.analytics),
      advertising: Boolean(parsed.thirdParty ?? parsed.advertising),
      thirdParty: Boolean(parsed.thirdParty ?? parsed.advertising),
      legalBasisSummary:
        parsed.legalBasisSummary || 'Art. 7º, I (Consentimento) e Art. 7º, V/IX (Necessidade e Segurança) - LGPD',
    };
  } catch {
    return null;
  }
}

export function hasCookieCategoryConsent(category: CookieCategoryId): boolean {
  if (category === 'essential') return true;
  const consent = getStoredCookieConsent();
  if (!consent) return false;
  return Boolean(consent[category]);
}

export function getConsentHistory(): CookieConsentHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CONSENT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendConsentHistory(record: LgpdCookieConsent): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getConsentHistory();
    const entry: CookieConsentHistoryEntry = {
      protocolId: record.protocolId,
      timestamp: record.timestamp,
      expiresAt: record.expiresAt,
      version: record.version,
      decisionMethod: record.decisionMethod,
      essential: true,
      functional: record.functional,
      analytics: record.analytics,
      thirdParty: record.thirdParty,
    };
    const updated = [entry, ...history].slice(0, 20);
    window.localStorage.setItem(CONSENT_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

function notifyConsentChanged(consent: LgpdCookieConsent | null): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: consent }));
  } catch {
    // Ignore event dispatch issues
  }
}

export function subscribeCookieConsent(callback: (consent: LgpdCookieConsent | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<LgpdCookieConsent | null>).detail ?? getStoredCookieConsent();
    callback(detail);
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === CONSENT_STORAGE_KEY) {
      callback(getStoredCookieConsent());
    }
  };
  window.addEventListener(CONSENT_CHANGED_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

export function saveLgpdCookieConsent(
  prefs: {
    functional: boolean;
    analytics: boolean;
    thirdParty: boolean;
  },
  decisionMethod: ConsentDecisionMethod
): LgpdCookieConsent {
  const nowIso = new Date().toISOString();
  const expiresAt = addDaysIso(CONSENT_TTL_DAYS);
  const protocolId = generateConsentProtocolId();

  const record: LgpdCookieConsent = {
    version: COOKIE_POLICY_VERSION,
    timestamp: nowIso,
    expiresAt,
    protocolId,
    decisionMethod,
    essential: true,
    functional: Boolean(prefs.functional),
    analytics: Boolean(prefs.analytics),
    advertising: Boolean(prefs.thirdParty),
    thirdParty: Boolean(prefs.thirdParty),
    legalBasisSummary:
      prefs.functional || prefs.analytics || prefs.thirdParty
        ? 'Essenciais: Art. 7º, V/IX LGPD | Opcionais autorizados: Consentimento expresso (Art. 7º, I LGPD)'
        : 'Somente Estreitamente Necessários (Art. 7º, V/IX LGPD) — Todos os opcionais recusados',
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      window.localStorage.setItem(
        WIKI_CONSENT_STORAGE_KEY,
        JSON.stringify({
          essential: true,
          functional: record.functional,
          analytics: record.analytics,
          advertising: record.thirdParty,
          thirdParty: record.thirdParty,
          timestamp: record.timestamp,
          expiresAt: record.expiresAt,
          protocolId: record.protocolId,
          decisionMethod: record.decisionMethod,
          version: record.version,
        })
      );
    } catch {
      // Ignore storage failures
    }
  }

  // Grava cookie HTTP técnico de 1ª parte para registrar a escolha (comprovante técnico ANPD)
  const compactCookieValue = JSON.stringify({
    v: record.version,
    p: record.protocolId,
    e: 1,
    f: record.functional ? 1 : 0,
    a: record.analytics ? 1 : 0,
    t: record.thirdParty ? 1 : 0,
    exp: record.expiresAt,
  });
  writeFirstPartyCookie(CONSENT_COOKIE_NAME, compactCookieValue, CONSENT_TTL_DAYS);

  appendConsentHistory(record);
  enforceCookiePreferences(record);
  notifyConsentChanged(record);
  return record;
}

export function revokeAllNonEssentialCookies(): LgpdCookieConsent {
  return saveLgpdCookieConsent(
    {
      functional: false,
      analytics: false,
      thirdParty: false,
    },
    'revoked'
  );
}

export function resetCookieConsentPrompt(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
      window.localStorage.removeItem(WIKI_CONSENT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  expireCookieByName(CONSENT_COOKIE_NAME);
  enforceCookiePreferences(null);
  notifyConsentChanged(null);
}

export function exportCookieConsentProof(titularEmailOrUid?: string): void {
  const current = getStoredCookieConsent();
  const history = getConsentHistory();
  const activeCookies = listActiveDocumentCookies();

  const payload = {
    documento: 'Comprovante de Consentimento e Preferências de Cookies — LGPD',
    controlador: 'Portal WazzimaGiygg',
    dpoNome: 'Pedro Henrique Cardona Peres',
    dpoContato: 'pedrohenriquecardonaperes@gmail.com',
    suporteOficial: 'https://support.wazzimagiygg.com/',
    baseLegal: 'Lei nº 13.709/2018 (Art. 5º, XII; Art. 6º, VI; Art. 7º, I e V; Art. 8º, §§ 2º e 5º; Art. 18, IX)',
    orientacaoRegulatoria: 'Guia Orientativo ANPD — Cookies e Proteção de Dados Pessoais',
    titular: titularEmailOrUid || 'Visitante Anônimo (Sessão Local)',
    consentimentoAtual: current || { status: 'Sem consentimento opcional registrado (somente essenciais)' },
    cookiesAtivosNoNavegador: activeCookies,
    historicoDecisoes: history,
    geradoEm: new Date().toISOString(),
  };

  if (typeof document === 'undefined') return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Comprovante_Cookies_LGPD_${current?.protocolId || 'SESSAO'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
