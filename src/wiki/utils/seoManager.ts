/**
 * ============================================================================
 * WIKIWORLDWEB DYNAMIC SEO & SEARCH ENGINE BOT MANAGER
 * ============================================================================
 * Sincroniza dinamicamente no cliente (<head>) as meta-tags, links canônicos,
 * hreflang, OpenGraph, Twitter Cards e Schema.org JSON-LD utilizando o motor
 * isomórfico canonicalEngine.ts (priorizando https://core.wazzimagiygg.com/).
 */

import { WikiArticle, WikiPage, ViewMode } from '../types';
import {
  CANONICAL_ORIGIN,
  ResolvedSeoMetadata,
  resolveDynamicSeoMetadata,
  resolveCanonicalUrl,
} from '../../seo/canonicalEngine';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalPath?: string;
  article?: WikiArticle | null;
  page?: WikiPage | null;
  view?: ViewMode;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const PURE_TRACKING_PARAMS = [
  'fbclid',
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'twclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'mkt_tok',
];

function setMetaTag(nameOrProperty: string, content: string, isProperty = false) {
  if (typeof document === 'undefined') return;

  const selector = isProperty
    ? `meta[property="${nameOrProperty}"]`
    : `meta[name="${nameOrProperty}"]`;

  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    if (isProperty) {
      element.setAttribute('property', nameOrProperty);
    } else {
      element.setAttribute('name', nameOrProperty);
    }
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function removeMetaTag(nameOrProperty: string, isProperty = false) {
  if (typeof document === 'undefined') return;
  const selector = isProperty
    ? `meta[property="${nameOrProperty}"]`
    : `meta[name="${nameOrProperty}"]`;
  document.querySelector(selector)?.remove();
}

function setLinkRel(rel: string, href: string, extraAttrs?: Record<string, string>) {
  if (typeof document === 'undefined') return;

  let selector = `link[rel="${rel}"]`;
  if (extraAttrs) {
    for (const [k, v] of Object.entries(extraAttrs)) {
      selector += `[${k}="${v}"]`;
    }
  }

  let link = document.querySelector(selector) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    if (extraAttrs) {
      for (const [k, v] of Object.entries(extraAttrs)) {
        link.setAttribute(k, v);
      }
    }
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setJsonLd(id: string, data: object) {
  if (typeof document === 'undefined') return;

  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.remove();
}

/**
 * Remove parâmetros exclusivos de rastreamento de anúncios da barra de endereços
 * sem alterar parâmetros funcionais (?uid=, ?q=, OAuth).
 */
function stripTrackingParamsFromBrowserUrl() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of Array.from(url.searchParams.keys())) {
      const lower = key.toLowerCase();
      if (PURE_TRACKING_PARAMS.includes(lower) || lower.startsWith('utm_')) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, '', nextUrl);
    }
  } catch {
    // Ignora caso URL não possa ser reescrita
  }
}

/**
 * Aplica todas as meta-tags, canonicalização, hreflang, OpenGraph, Twitter e JSON-LD no <head>.
 */
function applyResolvedMetadataToHead(meta: ResolvedSeoMetadata) {
  if (typeof document === 'undefined') return;

  stripTrackingParamsFromBrowserUrl();

  document.title = meta.title;
  setMetaTag('description', meta.description);
  setMetaTag('keywords', meta.keywords.join(', '));
  setMetaTag('generator', meta.generator);
  setMetaTag('wikisite-version', meta.wikiSiteVersion);
  setMetaTag('msvalidate.01', meta.msvalidate01);
  setMetaTag('robots', meta.robots);
  setMetaTag('googlebot', meta.googlebot);
  setMetaTag('bingbot', meta.bingbot);
  setMetaTag('BingPreview', 'index, follow');

  // Canonicalização absoluta e Hreflang para core.wazzimagiygg.com
  setLinkRel('canonical', meta.canonicalUrl);
  setLinkRel('alternate', meta.hreflangPtBr, { hreflang: 'pt-BR' });
  setLinkRel('alternate', meta.hreflangDefault, { hreflang: 'x-default' });

  // OpenGraph
  setMetaTag('og:type', meta.ogType, true);
  setMetaTag('og:title', meta.ogTitle, true);
  setMetaTag('og:description', meta.ogDescription, true);
  setMetaTag('og:url', meta.ogUrl, true);
  setMetaTag('og:site_name', meta.ogSiteName, true);
  setMetaTag('og:locale', meta.ogLocale, true);
  setMetaTag('og:image', meta.ogImage, true);

  if (meta.ogType === 'article' && meta.articleMeta) {
    if (meta.articleMeta.publishedTime) {
      setMetaTag('article:published_time', meta.articleMeta.publishedTime, true);
    }
    if (meta.articleMeta.modifiedTime) {
      setMetaTag('article:modified_time', meta.articleMeta.modifiedTime, true);
    }
    if (meta.articleMeta.section) {
      setMetaTag('article:section', meta.articleMeta.section, true);
    }
    if (meta.articleMeta.author) {
      setMetaTag('article:author', meta.articleMeta.author, true);
    }
  } else {
    removeMetaTag('article:published_time', true);
    removeMetaTag('article:modified_time', true);
    removeMetaTag('article:section', true);
    removeMetaTag('article:author', true);
  }

  // Twitter Cards
  setMetaTag('twitter:card', meta.twitterCard);
  setMetaTag('twitter:title', meta.twitterTitle);
  setMetaTag('twitter:description', meta.twitterDescription);
  setMetaTag('twitter:url', meta.twitterUrl);
  setMetaTag('twitter:domain', meta.twitterDomain);
  setMetaTag('twitter:image', meta.twitterImage);

  // Grafo principal sincronizado (substitui ou atualiza o nó SSR)
  setJsonLd('ssr-dynamic-jsonld', meta.jsonLdGraph);
}

/**
 * Main SEO synchronization function (NotMediaWiki / WikiWorldWeb core views)
 */
export function updateSEO(config: SEOConfig) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const viewMapToCanonicalKey = (view?: ViewMode): string => {
    if (!view || view === 'hub') return 'notmediawiki';
    if (view === 'editing-ethics') return 'Special:EditingEthics';
    if (view === 'not-found') return 'Special:NotFound';
    if (view === 'tools') return 'Special:Tools';
    return view;
  };

  const resolvedUid = config.article
    ? config.article.id
    : config.canonicalPath
    ? config.canonicalPath.replace(/^\/+\??/, '')
    : viewMapToCanonicalKey(config.view);

  const meta = resolveDynamicSeoMetadata({
    uid: resolvedUid,
    tab: config.view || 'notmediawiki',
    customTitle: !config.article ? config.title : undefined,
    customDescription: !config.article ? config.description : undefined,
    customKeywords: config.keywords,
    breadcrumbs: config.breadcrumbs,
    article: config.article
      ? {
          id: config.article.id,
          titulo: config.article.titulo,
          descricao: config.article.descricao,
          resumo: config.article.resumo,
          setor: config.article.categoria,
          autor: config.article.autor,
          idioma: config.article.idioma,
          dataCriacao: config.article.dataCriacao,
          dataEdicao: config.article.dataEdicao,
        }
      : null,
  });

  // Se houver canonicalPath explícito sem ?uid= padrão, respeita mantendo o host core.wazzimagiygg.com
  if (!config.article && config.canonicalPath && config.canonicalPath.startsWith('/')) {
    const cleanPath = config.canonicalPath.startsWith('/?uid=')
      ? resolveCanonicalUrl({ uid: config.canonicalPath.replace('/?uid=', '') })
      : `${CANONICAL_ORIGIN}${config.canonicalPath}`;
    meta.canonicalUrl = cleanPath;
    meta.ogUrl = cleanPath;
    meta.twitterUrl = cleanPath;
    meta.hreflangPtBr = cleanPath;
    meta.hreflangDefault = cleanPath;
  }

  applyResolvedMetadataToHead(meta);

  // Mantém grafo específico reforçado na visão WazzimaGiygg contra referências externas da Wikipédia
  if (!config.article && config.view === 'wazzimagiygg') {
    setJsonLd('dynamic-wazzima-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `${CANONICAL_ORIGIN}/?uid=wazzimagiygg#profilepage`,
      url: `${CANONICAL_ORIGIN}/?uid=wazzimagiygg`,
      name: 'WazzimaGiygg Core (core.wazzimagiygg.com) — Portal Oficial e A Verdade',
      mainEntity: {
        '@type': 'Person',
        '@id': `${CANONICAL_ORIGIN}/#founder`,
        name: 'Pedro Henrique Cardona Peres',
        alternateName: ['WazzimaGiygg', 'Wazzimagiygg'],
        url: `${CANONICAL_ORIGIN}/`,
        sameAs: [
          `${CANONICAL_ORIGIN}/`,
          `${CANONICAL_ORIGIN}/?uid=dossie`,
          'https://wazzimagiygg.com/',
          'https://wazzimagiygg.com/averdade/',
          'https://support.wazzimagiygg.com/',
          'https://github.com/WazzimaGiygg/Wiki-alternative',
        ],
      },
      mentions: [
        {
          '@type': 'WebPage',
          name: 'Wikipédia:Pedidos a verificadores/Caso/Wazzimagiygg',
          url: 'https://pt.wikipedia.org/wiki/Wikip%C3%A9dia:Pedidos_a_verificadores/Caso/Wazzimagiygg',
          description:
            'Referência externa refutada documentalmente pela fonte primária oficial em core.wazzimagiygg.com.',
        },
      ],
    });
  } else {
    removeJsonLd('dynamic-wazzima-jsonld');
  }
}

/**
 * Portal-wide SEO synchronization for top-level tabs, articles and searches on core.wazzimagiygg.com
 */
export function updatePortalSEO(params: {
  tab: string;
  article?: {
    id?: string;
    titulo?: string;
    descricao?: string;
    setor?: string;
    criadorEmail?: string;
    ultimaEdicao?: string;
  } | null;
  searchQuery?: string;
}) {
  if (typeof document === 'undefined') return;

  const meta = resolveDynamicSeoMetadata({
    tab: params.tab,
    uid: params.article?.id || params.tab,
    searchQuery: params.searchQuery,
    article: params.article
      ? {
          id: params.article.id,
          titulo: params.article.titulo,
          descricao: params.article.descricao,
          setor: params.article.setor,
          dataEdicao: params.article.ultimaEdicao,
        }
      : null,
  });

  applyResolvedMetadataToHead(meta);
  removeJsonLd('dynamic-wazzima-jsonld');
  removeJsonLd('dynamic-portal-authority-jsonld');
}
