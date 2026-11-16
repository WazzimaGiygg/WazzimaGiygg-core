/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Identificação Oficial de Versão do Wiki-Site (WazzimaGiygg Core)
 * Fonte única isomórfica (Frontend React/Vite + Backend Express TS + SEO/SSR).
 */

export const WIKI_SITE_PRODUCT = 'Wiki-Site' as const;
export const WIKI_SITE_VERSION = 'C1.16.C7.1' as const;
export const WIKI_SITE_SERIES = 'C1.16' as const;
export const WIKI_SITE_REVISION = 'C7.1' as const;
export const WIKI_SITE_DISPLAY_ID = `${WIKI_SITE_PRODUCT} ${WIKI_SITE_VERSION}` as const;
export const WIKI_SITE_GENERATOR = `WazzimaGiygg ${WIKI_SITE_PRODUCT} ${WIKI_SITE_VERSION}` as const;
export const WIKI_SITE_ENGINE = 'NotMediaWiki Parsoid AST • Express TS 2.0.0' as const;
export const WIKI_SITE_CANONICAL_HOST = 'core.wazzimagiygg.com' as const;
export const WIKI_SITE_CANONICAL_URL = 'https://core.wazzimagiygg.com/' as const;
export const WIKI_SITE_LICENSE = 'CC BY-SA 4.0 & GNU GPL v3.0' as const;

export const WIKI_SITE_COMPLIANCE = [
  'LGPD (Lei nº 13.709/2018)',
  'Marco Civil da Internet (Lei nº 12.965/2014)',
  'Zero-Trust ABAC & Sem Exposição de IP',
] as const;

export const WIKI_SITE_DPO = {
  name: 'Pedro Henrique Cardona Peres',
  email: 'pedrohenriquecardonaperes@gmail.com',
  supportUrl: 'https://support.wazzimagiygg.com/',
} as const;

export const WIKI_SITE_STACK = {
  frontend: 'React 19 + TypeScript + Vite + Tailwind CSS',
  backend: 'Express TS 2.0.0 + Node.js Mesh',
  parser: 'NotMediaWiki Parsoid AST',
  database: 'Google Firebase Cloud Firestore (wzzm-ce3fc)',
  aiEngine: 'Google Gemini (Search Grounding)',
} as const;

export interface WikiSiteVersionManifest {
  product: string;
  version: string;
  series: string;
  revision: string;
  displayId: string;
  generator: string;
  engine: string;
  canonicalHost: string;
  canonicalUrl: string;
  license: string;
  compliance: readonly string[];
  dpo: typeof WIKI_SITE_DPO;
  stack: typeof WIKI_SITE_STACK;
  extensionsCount?: number;
  articlesCount?: number;
  revisionsCount?: number;
  nodeVersion?: string;
  uptimeSeconds?: number;
  generatedAt: string;
}

export function getWikiSiteVersionManifest(
  overrides: Partial<
    Pick<
      WikiSiteVersionManifest,
      'extensionsCount' | 'articlesCount' | 'revisionsCount' | 'nodeVersion' | 'uptimeSeconds'
    >
  > = {}
): WikiSiteVersionManifest {
  return {
    product: WIKI_SITE_PRODUCT,
    version: WIKI_SITE_VERSION,
    series: WIKI_SITE_SERIES,
    revision: WIKI_SITE_REVISION,
    displayId: WIKI_SITE_DISPLAY_ID,
    generator: WIKI_SITE_GENERATOR,
    engine: WIKI_SITE_ENGINE,
    canonicalHost: WIKI_SITE_CANONICAL_HOST,
    canonicalUrl: WIKI_SITE_CANONICAL_URL,
    license: WIKI_SITE_LICENSE,
    compliance: WIKI_SITE_COMPLIANCE,
    dpo: WIKI_SITE_DPO,
    stack: WIKI_SITE_STACK,
    ...overrides,
    generatedAt: new Date().toISOString(),
  };
}

export function formatWikiSiteFingerprint(manifest: WikiSiteVersionManifest): string {
  const lines = [
    `${manifest.displayId} (${manifest.generator})`,
    `Série: ${manifest.series} | Revisão: ${manifest.revision}`,
    `Motor: ${manifest.engine}`,
    `Domínio Canônico: ${manifest.canonicalUrl}`,
    `Licença: ${manifest.license}`,
    `Conformidade: ${manifest.compliance.join(' • ')}`,
    `DPO: ${manifest.dpo.name} (${manifest.dpo.email}) | Suporte: ${manifest.dpo.supportUrl}`,
  ];
  if (typeof manifest.articlesCount === 'number') {
    lines.push(`Acervo: ${manifest.articlesCount} documentos`);
  }
  if (typeof manifest.extensionsCount === 'number') {
    lines.push(`Extensões ativas: ${manifest.extensionsCount}`);
  }
  if (manifest.nodeVersion) {
    lines.push(`Runtime servidor: Node ${manifest.nodeVersion}`);
  }
  lines.push(`Timestamp: ${manifest.generatedAt}`);
  return lines.join('\n');
}
