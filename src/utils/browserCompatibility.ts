export interface CompatibilityCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  severity: 'critical' | 'warning';
}

export interface BrowserCompatibilityReport {
  isCompatible: boolean;
  browserName: string;
  browserVersion: string;
  userAgent: string;
  reasons: string[];
  checks: CompatibilityCheckItem[];
  isSimulated?: boolean;
}

export const FORCE_BROWSER_ENTRY_STORAGE_KEY = 'wzzm_force_browser_entry';
export const SIMULATE_INCOMPATIBLE_BROWSER_KEY = 'wzzm_simulate_incompatible_browser';

let inMemoryForcedEntry = false;

interface ParsedBrowserInfo {
  name: string;
  version: string;
  major: number | null;
  isLegacyEngine: boolean;
  legacyReason?: string;
}

export function parseBrowserUserAgent(ua: string): ParsedBrowserInfo {
  if (!ua) {
    return {
      name: 'Navegador Desconhecido',
      version: 'N/D',
      major: null,
      isLegacyEngine: false,
    };
  }

  // 1. Internet Explorer
  const msieMatch = ua.match(/MSIE\s(\d+)/i);
  if (msieMatch || /Trident\//i.test(ua)) {
    const rvMatch = ua.match(/rv:(\d+)/i);
    const ver = msieMatch?.[1] || rvMatch?.[1] || '11';
    return {
      name: 'Internet Explorer',
      version: ver,
      major: parseInt(ver, 10) || 11,
      isLegacyEngine: true,
      legacyReason: 'O motor Trident (Internet Explorer) foi descontinuado e não suporta recursos modernos do Wiki-site.',
    };
  }

  // 2. Legacy Edge (EdgeHTML)
  const legacyEdgeMatch = ua.match(/\bEdge\/(\d+(?:\.\d+)?)/i);
  if (legacyEdgeMatch) {
    const major = parseInt(legacyEdgeMatch[1], 10);
    return {
      name: 'Microsoft Edge (EdgeHTML legado)',
      version: legacyEdgeMatch[1],
      major: isNaN(major) ? null : major,
      isLegacyEngine: major < 79,
      legacyReason: major < 79 ? 'Versão legada do Microsoft Edge anterior ao motor Chromium.' : undefined,
    };
  }

  // 3. Text-only / Extremely limited mobile proxy browsers
  if (/Opera Mini/i.test(ua)) {
    return {
      name: 'Opera Mini',
      version: ua.match(/Opera Mini\/([\d.]+)/i)?.[1] || 'Desconhecida',
      major: null,
      isLegacyEngine: true,
      legacyReason: 'O Opera Mini utiliza renderização proxy limitada incompatível com edição Wikitext e sessões interativas.',
    };
  }

  if (/\b(Lynx|Links|ELinks|w3m)\b/i.test(ua)) {
    return {
      name: ua.match(/\b(Lynx|Links|ELinks|w3m)\b/i)?.[1] || 'Navegador em Texto',
      version: 'Texto',
      major: null,
      isLegacyEngine: true,
      legacyReason: 'Navegador em modo texto sem suporte a JavaScript moderno e layout CSS.',
    };
  }

  // 4. Legacy Android Browser / Android < 7 WebView
  const androidMatch = ua.match(/Android\s(\d+)(?:\.(\d+))?/i);
  if (androidMatch && parseInt(androidMatch[1], 10) < 7 && !/Chrome\/(9\d|1\d\d)\./i.test(ua) && !/Firefox\/(9\d|1\d\d)\./i.test(ua)) {
    return {
      name: 'Android WebView / Browser Legado',
      version: `Android ${androidMatch[1]}`,
      major: parseInt(androidMatch[1], 10),
      isLegacyEngine: true,
      legacyReason: `Sistema Android ${androidMatch[1]} possui motor WebView desatualizado sem suporte a ES2022 e TLS moderno.`,
    };
  }

  // 5. Modern Chromium Edge
  const edgMatch = ua.match(/\bEdgA?\/(\d+(?:\.\d+)?)/i);
  if (edgMatch) {
    const major = parseInt(edgMatch[1], 10);
    return {
      name: 'Microsoft Edge',
      version: edgMatch[1],
      major,
      isLegacyEngine: major < 90,
      legacyReason: major < 90 ? `Microsoft Edge versão ${major} está muito desatualizado (mínimo recomendado: 90).` : undefined,
    };
  }

  // 6. Opera
  const oprMatch = ua.match(/\bOPR\/(\d+(?:\.\d+)?)/i);
  if (oprMatch) {
    const major = parseInt(oprMatch[1], 10);
    return {
      name: 'Opera',
      version: oprMatch[1],
      major,
      isLegacyEngine: major < 76,
      legacyReason: major < 76 ? `Opera versão ${major} está desatualizado (mínimo recomendado: 76).` : undefined,
    };
  }

  // 7. Samsung Internet
  const samsungMatch = ua.match(/\bSamsungBrowser\/(\d+(?:\.\d+)?)/i);
  if (samsungMatch) {
    const major = parseInt(samsungMatch[1], 10);
    return {
      name: 'Samsung Internet',
      version: samsungMatch[1],
      major,
      isLegacyEngine: major < 15,
      legacyReason: major < 15 ? `Samsung Internet versão ${major} está desatualizado (mínimo recomendado: 15).` : undefined,
    };
  }

  // 8. Firefox
  const ffMatch = ua.match(/\b(?:Firefox|FxiOS)\/(\d+(?:\.\d+)?)/i);
  if (ffMatch) {
    const major = parseInt(ffMatch[1], 10);
    return {
      name: 'Mozilla Firefox',
      version: ffMatch[1],
      major,
      isLegacyEngine: major < 90,
      legacyReason: major < 90 ? `Mozilla Firefox versão ${major} está desatualizado (mínimo recomendado: 90).` : undefined,
    };
  }

  // 9. Chrome / CriOS / Chromium
  const chromeMatch = ua.match(/\b(?:Chrome|CriOS)\/(\d+(?:\.\d+)?)/i);
  if (chromeMatch) {
    const major = parseInt(chromeMatch[1], 10);
    return {
      name: 'Google Chrome / Chromium',
      version: chromeMatch[1],
      major,
      isLegacyEngine: major < 90,
      legacyReason: major < 90 ? `Navegador Chromium versão ${major} está desatualizado (mínimo recomendado: 90).` : undefined,
    };
  }

  // 10. Safari
  if (/Safari/i.test(ua) && !/Chrome|Chromium/i.test(ua)) {
    const versionMatch = ua.match(/\bVersion\/(\d+(?:\.\d+)?)/i);
    if (versionMatch) {
      const major = parseInt(versionMatch[1], 10);
      return {
        name: 'Safari',
        version: versionMatch[1],
        major,
        isLegacyEngine: major < 14,
        legacyReason: major < 14 ? `Safari versão ${major} está desatualizado (mínimo recomendado: 14).` : undefined,
      };
    }
    return {
      name: 'Safari / WebKit',
      version: 'Atual',
      major: null,
      isLegacyEngine: false,
    };
  }

  return {
    name: 'Navegador Web Padrão',
    version: 'Personalizada',
    major: null,
    isLegacyEngine: false,
  };
}

export function hasForcedBrowserEntry(): boolean {
  if (inMemoryForcedEntry) return true;
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('forceEntry') === '1' || params.get('forceBrowser') === '1') {
      return true;
    }
  } catch {
    // ignore URL parsing issues
  }

  try {
    if (window.sessionStorage?.getItem(FORCE_BROWSER_ENTRY_STORAGE_KEY) === 'true') {
      return true;
    }
  } catch {
    // ignore storage restriction
  }

  try {
    if (window.localStorage?.getItem(FORCE_BROWSER_ENTRY_STORAGE_KEY) === 'true') {
      return true;
    }
  } catch {
    // ignore storage restriction
  }

  return false;
}

export function setForcedBrowserEntry(rememberAcrossSessions = true): void {
  inMemoryForcedEntry = true;
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage?.setItem(FORCE_BROWSER_ENTRY_STORAGE_KEY, 'true');
  } catch {
    // ignore storage restriction
  }

  if (rememberAcrossSessions) {
    try {
      window.localStorage?.setItem(FORCE_BROWSER_ENTRY_STORAGE_KEY, 'true');
    } catch {
      // ignore storage restriction
    }
  }
}

export function clearForcedBrowserEntry(): void {
  inMemoryForcedEntry = false;
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage?.removeItem(FORCE_BROWSER_ENTRY_STORAGE_KEY);
    window.localStorage?.removeItem(FORCE_BROWSER_ENTRY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function evaluateBrowserCompatibility(): BrowserCompatibilityReport {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isCompatible: true,
      browserName: 'SSR / Node',
      browserVersion: 'N/A',
      userAgent: '',
      reasons: [],
      checks: [],
    };
  }

  const ua = navigator.userAgent || '';
  const parsed = parseBrowserUserAgent(ua);
  const reasons: string[] = [];

  // Check simulation trigger (?checkBrowser=incompatible or localStorage flag)
  let isSimulated = false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('checkBrowser') === 'incompatible' ||
      window.localStorage?.getItem(SIMULATE_INCOMPATIBLE_BROWSER_KEY) === 'true'
    ) {
      isSimulated = true;
    }
  } catch {
    // ignore
  }

  const hasPromiseAndFetch = typeof window.Promise === 'function' && typeof window.fetch === 'function';
  const hasAbortController = typeof window.AbortController === 'function';
  const hasUrlSearchParams = typeof window.URL === 'function' && typeof window.URLSearchParams === 'function';
  const hasTextEncoder = typeof window.TextEncoder === 'function';
  const hasIntl = typeof window.Intl !== 'undefined' && typeof window.Intl.DateTimeFormat === 'function';

  let hasCssGrid = false;
  let hasCssFlex = false;
  try {
    hasCssGrid = typeof window.CSS?.supports === 'function' && window.CSS.supports('display', 'grid');
    hasCssFlex = typeof window.CSS?.supports === 'function' && window.CSS.supports('display', 'flex');
  } catch {
    hasCssGrid = false;
    hasCssFlex = false;
  }

  let hasLocalStorage = false;
  try {
    const probeKey = '__wzzm_compat_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    hasLocalStorage = true;
  } catch {
    hasLocalStorage = false;
  }

  const hasObservers =
    typeof window.IntersectionObserver === 'function' && typeof window.ResizeObserver === 'function';

  const checks: CompatibilityCheckItem[] = [
    {
      id: 'engine',
      label: 'Motor de renderização e versão do navegador',
      passed: !parsed.isLegacyEngine && !isSimulated,
      detail: isSimulated
        ? 'Modo de diagnóstico ativo (?checkBrowser=incompatible) simulando navegador incompatível.'
        : parsed.legacyReason || `${parsed.name} (${parsed.version}) suporta padrões modernos da web.`,
      severity: 'critical',
    },
    {
      id: 'fetch-promise',
      label: 'APIs assíncronas modernas (Fetch, Promise, AbortController)',
      passed: hasPromiseAndFetch && hasAbortController,
      detail:
        hasPromiseAndFetch && hasAbortController
          ? 'Disponível para sincronização com acervo e Firestore.'
          : 'Ausência de Fetch API, Promises ou AbortController.',
      severity: 'critical',
    },
    {
      id: 'css-layout',
      label: 'Layout CSS moderno (Grid e Flexbox)',
      passed: hasCssGrid && hasCssFlex,
      detail:
        hasCssGrid && hasCssFlex
          ? 'Suporte completo a CSS Grid e Flexbox confirmado.'
          : 'O navegador não reportou suporte a CSS Grid ou Flexbox.',
      severity: 'critical',
    },
    {
      id: 'web-apis',
      label: 'Manipulação de URL, Unicode (TextEncoder) e Internacionalização',
      passed: hasUrlSearchParams && hasTextEncoder && hasIntl,
      detail:
        hasUrlSearchParams && hasTextEncoder && hasIntl
          ? 'URLSearchParams, TextEncoder e Intl operacionais.'
          : 'APIs padrão de URL, codificação UTF-8 ou Intl ausentes.',
      severity: 'critical',
    },
    {
      id: 'observers',
      label: 'Observadores de interface (IntersectionObserver / ResizeObserver)',
      passed: hasObservers,
      detail: hasObservers
        ? 'Suporte ativo para tabelas, citações e gráficos responsivos.'
        : 'Observadores de viewport ausentes; alguns painéis podem perder responsividade.',
      severity: 'warning',
    },
    {
      id: 'storage',
      label: 'Armazenamento local (localStorage)',
      passed: hasLocalStorage,
      detail: hasLocalStorage
        ? 'Cache local e persistência de sessão disponíveis.'
        : 'Armazenamento local bloqueado ou desativado (comum em modo estrito de privacidade).',
      severity: 'warning',
    },
  ];

  if (parsed.isLegacyEngine && parsed.legacyReason) {
    reasons.push(parsed.legacyReason);
  }
  if (isSimulated) {
    reasons.push('Verificação simulada para teste de compatibilidade e entrada forçada.');
  }
  checks.forEach((c) => {
    if (!c.passed && c.severity === 'critical' && c.id !== 'engine') {
      reasons.push(c.detail);
    }
  });

  const criticalFailures = checks.filter((c) => c.severity === 'critical' && !c.passed);

  return {
    isCompatible: criticalFailures.length === 0,
    browserName: parsed.name,
    browserVersion: parsed.version,
    userAgent: ua,
    reasons,
    checks,
    isSimulated,
  };
}
