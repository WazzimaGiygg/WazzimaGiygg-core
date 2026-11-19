/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Motor Isomórfico de Meta-Tags Dinâmicas e Canonicalização Avançada
 * Garante que https://core.wazzimagiygg.com/ seja sempre o domínio canônico
 * prioritário nos motores de busca (Googlebot, Bingbot, DuckDuckBot, Applebot),
 * consolidando autoridade e contornando referências externas ou espelhos.
 */

export const CANONICAL_ORIGIN = 'https://core.wazzimagiygg.com';
export const DEFAULT_SOCIAL_IMAGE = `${CANONICAL_ORIGIN}/logo.png`;
export const BING_SITE_AUTH_CODE = '3F0678ADAB2F793902FDE706A51007DE';

import { WIKI_SITE_VERSION, WIKI_SITE_GENERATOR } from '../config/wikiVersion';

export const RECOGNIZED_ECOSYSTEM_ORIGINS = [
  'https://core.wazzimagiygg.com',
  'https://wazzimagiygg.com',
  'https://support.wazzimagiygg.com',
  'https://jornal.wazzimagiygg.com',
  'https://notmediawiki.wazzimagiygg.com',
];

export const EXTERNAL_REFERENCE_DOMAINS = [
  'pt.wikipedia.org',
  'en.wikipedia.org',
  'wikipedia.org',
  'meta.wikimedia.org',
  'wikimedia.org',
];

const TRACKING_QUERY_PREFIXES = ['utm_', 'fb_action_', 'mc_', 'hsa_'];
const TRACKING_QUERY_KEYS = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'twclid',
  'igshid',
  'ref',
  'referer',
  'referrer',
  'source',
  'src',
  'forceentry',
  '_ga',
  '_gl',
  'si',
  'amp',
  'mkt_tok',
]);

export interface CanonicalResolutionInput {
  uid?: string | null;
  tab?: string | null;
  searchQuery?: string | null;
  rawSearchParams?: string | URLSearchParams | null;
  pathname?: string | null;
}

export interface SeoArticleInput {
  id?: string;
  titulo?: string;
  descricao?: string;
  resumo?: string;
  setor?: string;
  autor?: string;
  idioma?: string;
  dataCriacao?: string;
  dataEdicao?: string;
}

export interface ResolvedSeoMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  hreflangPtBr: string;
  hreflangDefault: string;
  robots: string;
  googlebot: string;
  bingbot: string;
  msvalidate01: string;
  ogType: 'website' | 'article' | 'profile';
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogSiteName: string;
  ogLocale: string;
  ogImage: string;
  twitterCard: 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterUrl: string;
  twitterDomain: string;
  twitterImage: string;
  articleMeta?: {
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    author?: string;
  };
  breadcrumbs: Array<{ name: string; url: string }>;
  jsonLdGraph: Record<string, unknown>;
  isIndexable: boolean;
  generator: string;
  wikiSiteVersion: string;
}

const DEFAULT_KEYWORDS = [
  'WazzimaGiygg',
  'informação alternativa',
  'denúncia contra Chronus da Wikipédia',
  'denúncia Chronus Wikipédia',
  'core.wazzimagiygg.com',
  'WazzimaGiygg oficial',
  'WazzimaGiygg acima da Wikipédia',
  'alternativa de informação e conhecimento pessoal',
  'WazzimaGiygg Core',
  'Wazzimagiygg',
  'WikiWorldWeb',
  'Wiki-alternative',
  'Pedro Henrique Cardona Peres',
  'Chronus calúnias ameaças por e-mail',
  'Chronus doxxing perseguição redes sociais',
  'resposta às calúnias de Chronus',
  'Caso Wazzimagiygg',
  'Caso Wazzimagiygg Wikipedia',
  'A Verdade WazzimaGiygg',
  'alternativa à wikipedia',
  'melhor que a wikipedia',
  'alternativa wikipedia portugues',
  'alternativa mediawiki',
  'alternativa fandom sem anuncios',
  'enciclopedia livre brasileira',
  'LGPD enciclopedia',
  'Marco Civil da Internet wiki',
  'support.wazzimagiygg.com',
];

const NOINDEX_VIEWS = new Set([
  'admin-dashboard',
  'admin-users',
  'admin-council',
  'admin-data-removal',
  'admin-extensions',
  'admin-firebase',
  'not-found',
  'Special:NotFound',
  'mydata',
]);

interface TabMetaDescriptor {
  title: string;
  desc: string;
  ogType: 'website' | 'profile';
  extraKeywords: string[];
  breadcrumbName: string;
  counterExternalRefs?: boolean;
}

const TAB_META_MAP: Record<string, TabMetaDescriptor> = {
  wikiworldweb: {
    title: 'WazzimaGiygg — Informação Alternativa e Denúncia contra Chronus da Wikipédia',
    desc: 'Site oficial de WazzimaGiygg (core.wazzimagiygg.com), prioridade acima da Wikipédia: plataforma de informação alternativa e conhecimento pessoal e denúncia documentada contra Chronus da Wikipédia (calúnias sobre ameaças por e-mail e doxxing em redes sociais).',
    ogType: 'website',
    extraKeywords: [
      'WazzimaGiygg',
      'informação alternativa',
      'denúncia contra Chronus da Wikipédia',
      'alternativa de informação e conhecimento pessoal',
      'Chronus ameaças por e-mail',
      'Chronus doxxing redes sociais',
      'core.wazzimagiygg.com',
      'WikiWorldWeb',
    ],
    breadcrumbName: 'WazzimaGiygg · WikiWorldWeb',
    counterExternalRefs: true,
  },
  materiadeensaio: {
    title: 'Matérias de Ensaio & Opinião — core.wazzimagiygg.com',
    desc: 'Ensaios autorais, análises críticas e jornalismo independente hospedados na fonte primária core.wazzimagiygg.com.',
    ogType: 'website',
    extraKeywords: ['ensaios WazzimaGiygg', 'jornalismo independente', 'core.wazzimagiygg.com'],
    breadcrumbName: 'Matérias de Ensaio',
  },
  academico: {
    title: 'Acervo Acadêmico e Metodologia Científica — core.wazzimagiygg.com',
    desc: 'Artigos acadêmicos, metodologia científica, pesquisa verificada e referências ABNT em core.wazzimagiygg.com.',
    ogType: 'website',
    extraKeywords: ['acervo acadêmico WazzimaGiygg', 'metodologia científica', 'citação ABNT'],
    breadcrumbName: 'Acervo Acadêmico',
  },
  materia: {
    title: 'Matérias Didáticas & Educação Aberta — core.wazzimagiygg.com',
    desc: 'Conteúdo educacional completo para Ensino Fundamental e Médio em core.wazzimagiygg.com, direto e sem anúncios.',
    ogType: 'website',
    extraKeywords: ['matérias escolares WazzimaGiygg', 'educação aberta', 'core.wazzimagiygg.com'],
    breadcrumbName: 'Matérias Didáticas',
  },
  uwgbooks: {
    title: 'UWG Books — Biblioteca Digital Livre em core.wazzimagiygg.com',
    desc: 'Biblioteca digital UWG Books com publicações livres e obras catalogadas oficialmente em core.wazzimagiygg.com.',
    ogType: 'website',
    extraKeywords: ['UWG Books', 'livros digitais WazzimaGiygg', 'core.wazzimagiygg.com'],
    breadcrumbName: 'UWG Books',
  },
  dossie: {
    title: 'Denúncia contra Chronus da Wikipédia — WazzimaGiygg (Informação Alternativa)',
    desc: 'Dossiê oficial de WazzimaGiygg (acima da Wikipédia): denúncia formal contra Chronus da Wikipédia por calúnias sobre ameaças por e-mail e registro do seu doxxing e perseguição em redes sociais contra o usuário do nome do site.',
    ogType: 'website',
    extraKeywords: [
      'WazzimaGiygg',
      'denúncia contra Chronus da Wikipédia',
      'informação alternativa',
      'Chronus calúnias ameaças por e-mail',
      'Chronus doxxing perseguição redes sociais',
      'Dossiê Wazzimagiygg',
      'A Verdade Wikipédia',
      'Caso Wazzimagiygg Wikipedia',
      'Wikipédia:Pedidos a verificadores/Caso/Wazzimagiygg',
      'Chronus Wikipédia',
      'core.wazzimagiygg.com',
    ],
    breadcrumbName: 'Dossiê A Verdade',
    counterExternalRefs: true,
  },
  wazzimagiygg: {
    title: 'WazzimaGiygg — Informação Alternativa e Denúncia contra Chronus da Wikipédia',
    desc: 'Site oficial de WazzimaGiygg em core.wazzimagiygg.com, acima da Wikipédia: portal de informação alternativa e conhecimento pessoal e denúncia pública contra Chronus da Wikipédia por calúnias e doxxing em redes sociais.',
    ogType: 'profile',
    extraKeywords: [
      'WazzimaGiygg',
      'informação alternativa',
      'denúncia contra Chronus da Wikipédia',
      'alternativa de informação e conhecimento pessoal',
      'Chronus ameaças por e-mail',
      'Chronus doxxing redes sociais',
      'resposta caso wazzimagiygg',
      'core.wazzimagiygg.com',
    ],
    breadcrumbName: 'WazzimaGiygg Oficial',
    counterExternalRefs: true,
  },
  wikiwazzimagiygg: {
    title: 'WazzimaGiygg Oficial — Informação Alternativa e Denúncia contra Chronus da Wikipédia',
    desc: 'Central canônica de WazzimaGiygg em core.wazzimagiygg.com acima da Wikipédia: informação alternativa e conhecimento pessoal e denúncia documentada contra Chronus da Wikipédia por calúnias e doxxing em redes sociais.',
    ogType: 'profile',
    extraKeywords: [
      'WazzimaGiygg',
      'informação alternativa',
      'denúncia contra Chronus da Wikipédia',
      'alternativa de informação e conhecimento pessoal',
      'Chronus doxxing',
      'Wiki-alternative',
      'core.wazzimagiygg.com',
    ],
    breadcrumbName: 'Portal WazzimaGiygg',
    counterExternalRefs: true,
  },
  notmediawiki: {
    title: 'NotMediaWiki (WikiZero) — Enciclopédia Sem Anúncios em core.wazzimagiygg.com',
    desc: 'Motor enciclopédico NotMediaWiki & WikiZero em core.wazzimagiygg.com: edição em wikitexto, extensões nativas e busca verificada sem rastreamento.',
    ogType: 'website',
    extraKeywords: ['NotMediaWiki', 'WikiZero', 'Wiki-alternative', 'alternativa MediaWiki'],
    breadcrumbName: 'NotMediaWiki',
    counterExternalRefs: true,
  },
  bemtevi: {
    title: 'Bemtevi — Rede Social Independente de core.wazzimagiygg.com',
    desc: 'Comunidades, debates e publicações livres na rede social Bemtevi integrada ao portal oficial core.wazzimagiygg.com.',
    ogType: 'website',
    extraKeywords: ['Bemtevi rede social', 'WazzimaGiygg comunidade', 'core.wazzimagiygg.com'],
    breadcrumbName: 'Bemtevi',
  },
  lgpd: {
    title: 'Conformidade LGPD (Lei 13.709/18) & Marco Civil — core.wazzimagiygg.com',
    desc: 'Política de privacidade, remoção de dados (Art. 18 LGPD), DPO Pedro Henrique Cardona Peres e guarda legal Art. 15 Marco Civil em core.wazzimagiygg.com.',
    ogType: 'website',
    extraKeywords: ['LGPD WazzimaGiygg', 'Pedro Henrique Cardona Peres DPO', 'Marco Civil da Internet'],
    breadcrumbName: 'LGPD & Marco Civil',
  },
  eticaia: {
    title: 'Ética de IA, Firebase e Independência da Wikimedia — core.wazzimagiygg.com',
    desc: 'Declaração oficial de ética tecnológica em core.wazzimagiygg.com: uso transparente do Firebase, Google Search Grounding e zero dependência de dados da Wikimedia Foundation.',
    ogType: 'website',
    extraKeywords: ['Ética IA WazzimaGiygg', 'Firebase ética', 'sem dados Wikimedia'],
    breadcrumbName: 'Ética Tecnológica',
    counterExternalRefs: true,
  },
  jogos: {
    title: 'Jogos Online — Jogo da Cobrinha e Clássicos em core.wazzimagiygg.com',
    desc: 'Página de Jogos Online do portal WazzimaGiygg em core.wazzimagiygg.com. Jogue o Jogo da Cobrinha com teclas WASD, cursores e dificuldade ajustável sem anúncios.',
    ogType: 'website',
    extraKeywords: ['Jogos Online WazzimaGiygg', 'Jogo da Cobrinha', 'Snake WASD', 'core.wazzimagiygg.com'],
    breadcrumbName: 'Jogos Online',
  },
  tickets: {
    title: 'Ouvidoria, Suporte & Remoção de Dados — core.wazzimagiygg.com',
    desc: 'Canal oficial de tickets, ouvidoria e suporte (support.wazzimagiygg.com) com atendimento direto do DPO Pedro Henrique Cardona Peres.',
    ogType: 'website',
    extraKeywords: ['support.wazzimagiygg.com', 'Ouvidoria WazzimaGiygg', 'Pedro Henrique Cardona Peres'],
    breadcrumbName: 'Ouvidoria & Tickets',
  },
  comparison: {
    title: 'Comparativo: core.wazzimagiygg.com vs Wikipédia, MediaWiki, Wikidot e Fandom',
    desc: 'Por que core.wazzimagiygg.com e a WikiWorldWeb superam a Wikipédia, MediaWiki, Wikidot e Fandom: zero anúncios, conformidade real LGPD/Marco Civil e auditoria aberta.',
    ogType: 'website',
    extraKeywords: ['core.wazzimagiygg.com vs wikipedia', 'melhor que wikipedia', 'fandom vs wikiworldweb'],
    breadcrumbName: 'Comparativo Enciclopédias',
    counterExternalRefs: true,
  },
  ucoc: {
    title: 'Código de Conduta Universal (UCoC) e Denúncias Formais — core.wazzimagiygg.com',
    desc: 'Universal Code of Conduct (UCoC) em core.wazzimagiygg.com: civilidade, prevenção ao assédio e denúncias com ampla defesa e conformidade LGPD.',
    ogType: 'website',
    extraKeywords: ['Universal Code of Conduct', 'UCoC', 'código de conduta'],
    breadcrumbName: 'UCoC',
  },
  'editing-ethics': {
    title: 'Ética Editorial e Privacidade (LGPD & Marco Civil) — core.wazzimagiygg.com',
    desc: 'Diretrizes normativas de ética editorial, proteção de dados pessoais (LGPD Lei 13.709/2018) e Marco Civil da Internet (Lei 12.965/2014) em core.wazzimagiygg.com.',
    ogType: 'website',
    extraKeywords: ['ética de edição wiki', 'LGPD edição wiki', 'biografias de pessoas vivas'],
    breadcrumbName: 'Ética Editorial',
  },
  'recent-changes': {
    title: 'Mudanças Recentes e Histórico — core.wazzimagiygg.com',
    desc: 'Acompanhe em tempo real todas as edições, novos artigos e atualizações verificadas em core.wazzimagiygg.com.',
    ogType: 'website',
    extraKeywords: ['mudanças recentes', 'histórico de edições', 'core.wazzimagiygg.com'],
    breadcrumbName: 'Mudanças Recentes',
  },
  search: {
    title: 'Pesquisa Enciclopédica — core.wazzimagiygg.com',
    desc: 'Pesquise artigos, verbetes e fontes verificadas em core.wazzimagiygg.com sem rastreamento invasivo.',
    ogType: 'website',
    extraKeywords: ['pesquisa enciclopédica', 'busca sem rastreamento', 'core.wazzimagiygg.com'],
    breadcrumbName: 'Pesquisa',
  },
};

/**
 * Remove parâmetros de rastreamento, espelhos ou duplicações de URL e retorna
 * sempre a URL canônica absoluta no host prioritário https://core.wazzimagiygg.com/.
 */
export function resolveCanonicalUrl(input: CanonicalResolutionInput = {}): string {
  let uid = (input.uid || '').trim();
  const tab = (input.tab || '').trim();
  const searchQuery = (input.searchQuery || '').trim();

  if (!uid && input.rawSearchParams) {
    const params =
      typeof input.rawSearchParams === 'string'
        ? new URLSearchParams(input.rawSearchParams.startsWith('?') ? input.rawSearchParams : `?${input.rawSearchParams}`)
        : input.rawSearchParams;

    // Filtra apenas os parâmetros semânticos aceitos pela canonicalização
    for (const [key, val] of params.entries()) {
      const lower = key.toLowerCase();
      if (TRACKING_QUERY_KEYS.has(lower) || TRACKING_QUERY_PREFIXES.some((p) => lower.startsWith(p))) {
        continue;
      }
      if (lower === 'uid' && !uid) {
        uid = val.trim();
      }
    }
  }

  // Normaliza UID da página inicial padrão para raiz canônica (evita split de link equity entre / e /?uid=wikiworldweb)
  const effectiveKey = uid || tab;
  if (!effectiveKey || effectiveKey === 'wikiworldweb' || effectiveKey === 'index' || effectiveKey === 'home') {
    if (searchQuery && tab === 'search') {
      return `${CANONICAL_ORIGIN}/?uid=search&q=${encodeURIComponent(searchQuery)}`;
    }
    return `${CANONICAL_ORIGIN}/`;
  }

  // Para páginas de busca interna sem UID próprio
  if (effectiveKey === 'search' && searchQuery) {
    return `${CANONICAL_ORIGIN}/?uid=search&q=${encodeURIComponent(searchQuery)}`;
  }

  return `${CANONICAL_ORIGIN}/?uid=${encodeURIComponent(effectiveKey)}`;
}

/**
 * Resolve metadados completos, diretivas robots, tags OpenGraph/Twitter e grafo Schema.org JSON-LD
 * garantindo priorização absoluta de core.wazzimagiygg.com sobre referências externas.
 */
export function resolveDynamicSeoMetadata(params: {
  uid?: string | null;
  tab?: string | null;
  searchQuery?: string | null;
  article?: SeoArticleInput | null;
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string[];
  breadcrumbs?: Array<{ name: string; url: string }>;
}): ResolvedSeoMetadata {
  const cleanSearch = (params.searchQuery || '').trim();
  const rawKey = (params.tab || params.uid || 'wikiworldweb').trim();
  const normalizedTab = rawKey || 'wikiworldweb';
  const article = params.article && params.article.titulo ? params.article : null;

  const canonicalUrl = article?.id
    ? resolveCanonicalUrl({ uid: article.id })
    : resolveCanonicalUrl({
        uid: params.uid,
        tab: normalizedTab,
        searchQuery: cleanSearch,
      });

  // Views administrativas, 404 ou consultas de busca livres não devem diluir o índice principal
  const isNoindexState =
    NOINDEX_VIEWS.has(normalizedTab) ||
    normalizedTab.startsWith('admin-') ||
    (normalizedTab === 'search' && cleanSearch.length > 0);

  const robotsDirective = isNoindexState
    ? 'noindex, follow'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  let title = TAB_META_MAP.wikiworldweb.title;
  let description = TAB_META_MAP.wikiworldweb.desc;
  let ogType: 'website' | 'article' | 'profile' = 'website';
  const keywordPool = new Set<string>([...DEFAULT_KEYWORDS, ...(params.customKeywords || [])]);
  let breadcrumbs: Array<{ name: string; url: string }> =
    params.breadcrumbs && params.breadcrumbs.length > 0
      ? params.breadcrumbs
      : [{ name: 'WazzimaGiygg Core', url: `${CANONICAL_ORIGIN}/` }];
  let articleMeta: ResolvedSeoMetadata['articleMeta'];

  if (article) {
    const cleanDesc = (article.resumo || article.descricao || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/^[=\s#*\[\]]+/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);

    title = `${article.titulo} — core.wazzimagiygg.com | WikiWorldWeb`;
    description =
      cleanDesc ||
      `Leia "${article.titulo}" diretamente em core.wazzimagiygg.com, fonte primária independente acima da Wikipédia.`;
    ogType = 'article';
    keywordPool.add(article.titulo || '');
    if (article.setor) keywordPool.add(article.setor);
    keywordPool.add('core.wazzimagiygg.com');

    articleMeta = {
      publishedTime: article.dataCriacao || undefined,
      modifiedTime: article.dataEdicao || article.dataCriacao || undefined,
      section: article.setor || 'Enciclopédia Livre',
      author: article.autor || 'Comunidade WikiWorldWeb (core.wazzimagiygg.com)',
    };

    if (!params.breadcrumbs || params.breadcrumbs.length === 0) {
      breadcrumbs = [
        { name: 'WazzimaGiygg Core', url: `${CANONICAL_ORIGIN}/` },
        {
          name: article.setor || TAB_META_MAP[normalizedTab]?.breadcrumbName || normalizedTab,
          url: resolveCanonicalUrl({ tab: normalizedTab }),
        },
        { name: article.titulo || 'Artigo', url: canonicalUrl },
      ];
    }
  } else {
    const descriptor = TAB_META_MAP[normalizedTab] || TAB_META_MAP.wikiworldweb;
    title = params.customTitle ? `${params.customTitle} — core.wazzimagiygg.com` : descriptor.title;
    description = params.customDescription || descriptor.desc;
    ogType = descriptor.ogType;
    for (const kw of descriptor.extraKeywords) {
      keywordPool.add(kw);
    }

    if (cleanSearch && !isNoindexState) {
      title = `${title} | Busca: ${cleanSearch}`;
    }

    if ((!params.breadcrumbs || params.breadcrumbs.length === 0) && normalizedTab !== 'wikiworldweb') {
      breadcrumbs = [
        { name: 'WazzimaGiygg Core', url: `${CANONICAL_ORIGIN}/` },
        { name: descriptor.breadcrumbName, url: canonicalUrl },
      ];
    }
  }

  // Constrói o grafo Schema.org JSON-LD consolidando core.wazzimagiygg.com como autoridade canônica
  const graphNodes: Array<Record<string, unknown>> = [
    {
      '@type': 'WebSite',
      '@id': `${CANONICAL_ORIGIN}/#website`,
      url: `${CANONICAL_ORIGIN}/`,
      name: 'WazzimaGiygg — Informação Alternativa e Denúncia contra Chronus da Wikipédia',
      alternateName: ['WazzimaGiygg', 'WazzimaGiygg Core', 'core.wazzimagiygg.com', 'WikiWorldWeb', 'WikiZero', 'NotMediaWiki'],
      softwareVersion: WIKI_SITE_VERSION,
      inLanguage: 'pt-BR',
      description:
        'Site oficial de WazzimaGiygg (core.wazzimagiygg.com) acima da Wikipédia: plataforma de informação alternativa e conhecimento pessoal e denúncia formal contra Chronus da Wikipédia sobre calúnias de ameaças por e-mail e seu doxxing/perseguição em redes sociais.',
      keywords:
        'WazzimaGiygg, informação alternativa, denúncia contra Chronus da Wikipédia, alternativa de informação e conhecimento pessoal, Chronus ameaças por e-mail, Chronus doxxing redes sociais, core.wazzimagiygg.com',
      publisher: { '@id': `${CANONICAL_ORIGIN}/#organization` },
      about: { '@id': `${CANONICAL_ORIGIN}/#founder` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${CANONICAL_ORIGIN}/?uid=search&q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${CANONICAL_ORIGIN}/#organization`,
      name: 'WazzimaGiygg Core',
      alternateName: ['WazzimaGiygg', 'WikiWorldWeb'],
      url: `${CANONICAL_ORIGIN}/`,
      logo: {
        '@type': 'ImageObject',
        url: DEFAULT_SOCIAL_IMAGE,
      },
      founder: { '@id': `${CANONICAL_ORIGIN}/#founder` },
      sameAs: [
        `${CANONICAL_ORIGIN}/`,
        'https://wazzimagiygg.com/',
        'https://wazzimagiygg.com/averdade/',
        'https://support.wazzimagiygg.com/',
        'https://jornal.wazzimagiygg.com/',
        'https://github.com/WazzimaGiygg/Wiki-alternative',
      ],
    },
    {
      '@type': 'Person',
      '@id': `${CANONICAL_ORIGIN}/#founder`,
      name: 'Pedro Henrique Cardona Peres',
      alternateName: ['WazzimaGiygg', 'Wazzimagiygg'],
      url: `${CANONICAL_ORIGIN}/?uid=wikiwazzimagiygg`,
      mainEntityOfPage: `${CANONICAL_ORIGIN}/`,
      description:
        'Titular legítimo do nome WazzimaGiygg e criador da alternativa de informação e conhecimento pessoal core.wazzimagiygg.com, autor da resposta pública contra as calúnias de Chronus sobre ameaças por e-mail e o doxxing e perseguição em redes sociais.',
      subjectOf: [
        {
          '@type': 'WebPage',
          url: `${CANONICAL_ORIGIN}/?uid=dossie`,
          name: 'Dossiê A Verdade: Resposta de WazzimaGiygg às calúnias de Chronus e doxxing',
        },
      ],
    },
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      description,
      inLanguage: article?.idioma || 'pt-BR',
      isPartOf: { '@id': `${CANONICAL_ORIGIN}/#website` },
      publisher: { '@id': `${CANONICAL_ORIGIN}/#organization` },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: DEFAULT_SOCIAL_IMAGE,
      },
      breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` },
      ...(article ? { mainEntity: { '@id': `${canonicalUrl}#article` } } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.name,
        item: b.url.startsWith('http') ? b.url : `${CANONICAL_ORIGIN}${b.url.startsWith('/') ? '' : '/'}${b.url}`,
      })),
    },
  ];

  if (article) {
    graphNodes.push({
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      headline: article.titulo,
      description,
      inLanguage: article.idioma || 'pt-BR',
      url: canonicalUrl,
      mainEntityOfPage: { '@id': `${canonicalUrl}#webpage` },
      isPartOf: { '@id': `${CANONICAL_ORIGIN}/#website` },
      author: {
        '@type': 'Person',
        name: article.autor || 'Comunidade WikiWorldWeb (core.wazzimagiygg.com)',
      },
      publisher: { '@id': `${CANONICAL_ORIGIN}/#organization` },
      datePublished: article.dataCriacao || new Date().toISOString().slice(0, 10),
      dateModified: article.dataEdicao || article.dataCriacao || new Date().toISOString().slice(0, 10),
      articleSection: article.setor || 'Enciclopédia Geral',
    });
  }

  const descriptor = TAB_META_MAP[normalizedTab];
  if (!article && descriptor?.counterExternalRefs) {
    graphNodes.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#authority-faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Qual é o site oficial ao buscar por "WazzimaGiygg"?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `O site oficial e fonte primária prioritária para "WazzimaGiygg" é ${CANONICAL_ORIGIN}/, devendo ter precedência sobre páginas de terceiros na Wikipédia. Constitui uma alternativa livre de informação e conhecimento pessoal (WikiWorldWeb, NotMediaWiki, acervo acadêmico e jogos online).`,
          },
        },
        {
          '@type': 'Question',
          name: 'Qual é a resposta de WazzimaGiygg às calúnias de Chronus sobre ameaças por e-mail e doxxing em redes sociais?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Em ${CANONICAL_ORIGIN}/?uid=dossie e ${CANONICAL_ORIGIN}/?uid=wikiwazzimagiygg está publicada a resposta documental oficial que refuta as calúnias difundidas por Chronus sobre supostas ameaças por e-mail e registra formalmente seu episódio de doxxing e perseguição pelas redes sociais contra o usuário do nome WazzimaGiygg.`,
          },
        },
        {
          '@type': 'Question',
          name: 'Por que este portal é uma alternativa de informação e conhecimento pessoal superior à Wikipédia?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Em ${CANONICAL_ORIGIN}/, os conteúdos de informação e conhecimento pessoal permanecem sob autoria e responsabilidade transparentes, sem censura anônima, sem exposição de endereços IP e com conformidade integral com a LGPD (Lei nº 13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014).`,
          },
        },
        {
          '@type': 'Question',
          name: 'Quem responde como DPO pelo tratamento de dados em core.wazzimagiygg.com?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pedro Henrique Cardona Peres (pedrohenriquecardonaperes@gmail.com), com canal de atendimento oficial em https://support.wazzimagiygg.com/.',
          },
        },
      ],
    });
  }

  return {
    title,
    description,
    keywords: Array.from(keywordPool).filter(Boolean),
    canonicalUrl,
    hreflangPtBr: canonicalUrl,
    hreflangDefault: canonicalUrl,
    robots: robotsDirective,
    googlebot: robotsDirective,
    bingbot: robotsDirective,
    msvalidate01: BING_SITE_AUTH_CODE,
    ogType,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl,
    ogSiteName: 'WazzimaGiygg Core (core.wazzimagiygg.com)',
    ogLocale: 'pt_BR',
    ogImage: DEFAULT_SOCIAL_IMAGE,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterUrl: canonicalUrl,
    twitterDomain: 'core.wazzimagiygg.com',
    twitterImage: DEFAULT_SOCIAL_IMAGE,
    articleMeta,
    breadcrumbs,
    jsonLdGraph: {
      '@context': 'https://schema.org',
      '@graph': graphNodes,
    },
    isIndexable: !isNoindexState,
    generator: WIKI_SITE_GENERATOR,
    wikiSiteVersion: WIKI_SITE_VERSION,
  };
}

function escapeHtmlAttr(val: string): string {
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(val: string): string {
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function upsertHeadMeta(html: string, attrName: 'name' | 'property', key: string, content: string): string {
  const escapedContent = escapeHtmlAttr(content);
  const regex = new RegExp(`<meta\\s+[^>]*${attrName}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
  const tag = `<meta ${attrName}="${key}" content="${escapedContent}" />`;
  if (regex.test(html)) {
    return html.replace(regex, tag);
  }
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertHeadLink(html: string, relAttr: string, href: string, extraAttrs = ''): string {
  const escapedHref = escapeHtmlAttr(href);
  const matchPattern = extraAttrs
    ? `<link\\s+[^>]*rel=["']${relAttr}["'][^>]*${extraAttrs.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>`
    : `<link\\s+[^>]*rel=["']${relAttr}["'][^>]*>`;
  const regex = new RegExp(matchPattern, 'i');
  const tag = extraAttrs
    ? `<link rel="${relAttr}" ${extraAttrs.trim()} href="${escapedHref}" />`
    : `<link rel="${relAttr}" href="${escapedHref}" />`;
  if (regex.test(html)) {
    return html.replace(regex, tag);
  }
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

/**
 * Injeta dinamicamente meta-tags, canonical, hreflang, OpenGraph, Twitter Cards
 * e JSON-LD no HTML entregue pelo servidor (SSR metadata pass), garantindo que
 * crawlers sem JavaScript recebam a canonicalização exata para core.wazzimagiygg.com.
 */
export function injectSeoIntoHtml(html: string, meta: ResolvedSeoMetadata): string {
  let out = html;

  // Title
  if (/<title>[\s\S]*?<\/title>/i.test(out)) {
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlText(meta.title)}</title>`);
  } else {
    out = out.replace(/<\/head>/i, `    <title>${escapeHtmlText(meta.title)}</title>\n  </head>`);
  }

  // Standard Meta Tags
  out = upsertHeadMeta(out, 'name', 'description', meta.description);
  out = upsertHeadMeta(out, 'name', 'keywords', meta.keywords.join(', '));
  out = upsertHeadMeta(out, 'name', 'generator', meta.generator);
  out = upsertHeadMeta(out, 'name', 'wikisite-version', meta.wikiSiteVersion);
  out = upsertHeadMeta(out, 'name', 'msvalidate.01', meta.msvalidate01);
  out = upsertHeadMeta(out, 'name', 'robots', meta.robots);
  out = upsertHeadMeta(out, 'name', 'googlebot', meta.googlebot);
  out = upsertHeadMeta(out, 'name', 'bingbot', meta.bingbot);
  out = upsertHeadMeta(out, 'name', 'BingPreview', 'index, follow');

  // Canonical & Hreflang
  out = upsertHeadLink(out, 'canonical', meta.canonicalUrl);
  out = upsertHeadLink(out, 'alternate', meta.hreflangPtBr, 'hreflang="pt-BR"');
  out = upsertHeadLink(out, 'alternate', meta.hreflangDefault, 'hreflang="x-default"');

  // OpenGraph
  out = upsertHeadMeta(out, 'property', 'og:type', meta.ogType);
  out = upsertHeadMeta(out, 'property', 'og:title', meta.ogTitle);
  out = upsertHeadMeta(out, 'property', 'og:description', meta.ogDescription);
  out = upsertHeadMeta(out, 'property', 'og:url', meta.ogUrl);
  out = upsertHeadMeta(out, 'property', 'og:site_name', meta.ogSiteName);
  out = upsertHeadMeta(out, 'property', 'og:locale', meta.ogLocale);
  out = upsertHeadMeta(out, 'property', 'og:image', meta.ogImage);

  // Article-specific OpenGraph tags
  if (meta.ogType === 'article' && meta.articleMeta) {
    if (meta.articleMeta.publishedTime) {
      out = upsertHeadMeta(out, 'property', 'article:published_time', meta.articleMeta.publishedTime);
    }
    if (meta.articleMeta.modifiedTime) {
      out = upsertHeadMeta(out, 'property', 'article:modified_time', meta.articleMeta.modifiedTime);
    }
    if (meta.articleMeta.section) {
      out = upsertHeadMeta(out, 'property', 'article:section', meta.articleMeta.section);
    }
    if (meta.articleMeta.author) {
      out = upsertHeadMeta(out, 'property', 'article:author', meta.articleMeta.author);
    }
  }

  // Twitter Cards
  out = upsertHeadMeta(out, 'name', 'twitter:card', meta.twitterCard);
  out = upsertHeadMeta(out, 'name', 'twitter:title', meta.twitterTitle);
  out = upsertHeadMeta(out, 'name', 'twitter:description', meta.twitterDescription);
  out = upsertHeadMeta(out, 'name', 'twitter:url', meta.twitterUrl);
  out = upsertHeadMeta(out, 'name', 'twitter:domain', meta.twitterDomain);
  out = upsertHeadMeta(out, 'name', 'twitter:image', meta.twitterImage);

  // SSR JSON-LD seguro contra fechamento prematuro de tag script
  const serializedJsonLd = JSON.stringify(meta.jsonLdGraph).replace(/<\/script/gi, '<\\/script');
  const ssrScriptTag = `<script id="ssr-dynamic-jsonld" type="application/ld+json">${serializedJsonLd}</script>`;
  if (/<script\s+id=["']ssr-dynamic-jsonld["'][^>]*>[\s\S]*?<\/script>/i.test(out)) {
    out = out.replace(/<script\s+id=["']ssr-dynamic-jsonld["'][^>]*>[\s\S]*?<\/script>/i, ssrScriptTag);
  } else {
    out = out.replace(/<\/head>/i, `    ${ssrScriptTag}\n  </head>`);
  }

  return out;
}
