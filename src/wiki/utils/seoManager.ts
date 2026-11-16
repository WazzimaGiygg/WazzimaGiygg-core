/**
 * ============================================================================
 * WIKIWORLDWEB DYNAMIC SEO & SEARCH ENGINE BOT MANAGER
 * ============================================================================
 * Dynamically updates document metadata, OpenGraph tags, canonical links,
 * and Schema.org JSON-LD Structured Data for search engine web crawlers
 * (Googlebot, Bingbot, DuckDuckBot, Baiduspider, YandexBot, Applebot).
 *
 * Direct competitive positioning against Wikipedia, MediaWiki, Wikidot, Fandom.
 */

import { WikiArticle, WikiPage, ViewMode } from '../types';

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

const BASE_URL = 'https://core.wazzimagiygg.com';
const DEFAULT_TITLE = 'WazzimaGiygg Core (core.wazzimagiygg.com) — WikiWorldWeb, Enciclopédia Livre & Acervo Oficial';
const DEFAULT_DESC =
  'core.wazzimagiygg.com — Portal oficial do ecossistema WazzimaGiygg e WikiWorldWeb. Enciclopédia livre, rápida, auditável e em conformidade com LGPD e Marco Civil, superando a Wikipédia, MediaWiki, Wikidot e Fandom com fontes diretas, Dossiê A Verdade e busca verificada.';
const DEFAULT_KEYWORDS = [
  'core.wazzimagiygg.com',
  'WazzimaGiygg Core',
  'WazzimaGiygg',
  'Wazzimagiygg',
  'WikiWorldWeb',
  'Wiki-alternative',
  'Pedro Henrique Cardona Peres',
  'Caso Wazzimagiygg',
  'Caso Wazzimagiygg Wikipedia',
  'A Verdade Wazzimagiygg',
  'alternativa à wikipedia',
  'melhor que a wikipedia',
  'alternativa wikipedia portugues',
  'alternativa fandom sem anuncios',
  'alternativa mediawiki',
  'enciclopedia livre',
  'enciclopédia aberta brasileira',
  'wiki colaborativa LGPD',
  'Marco Civil da Internet wiki',
  'support.wazzimagiygg.com',
  'wazzimagiygg.com',
];

/**
 * Updates a <meta> tag or creates it if it doesn't exist
 */
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

/**
 * Updates the <link rel="canonical"> tag
 */
function setCanonicalUrl(url: string) {
  if (typeof document === 'undefined') return;

  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Injects or updates dynamic Schema.org JSON-LD
 */
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

/**
 * Remove dynamic JSON-LD when no longer in that view
 */
function removeJsonLd(id: string) {
  if (typeof document === 'undefined') return;
  const script = document.getElementById(id);
  if (script) {
    script.remove();
  }
}

/**
 * Main SEO synchronization function (NotMediaWiki / WikiWorldWeb core views)
 */
export function updateSEO(config: SEOConfig) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  let finalTitle = DEFAULT_TITLE;
  let finalDesc = DEFAULT_DESC;
  const keywords = [...DEFAULT_KEYWORDS, ...(config.keywords || [])];
  let canonicalUrl = `${BASE_URL}/`;

  // 1. If viewing an Article
  if (config.article) {
    const art = config.article;
    finalTitle = `${art.titulo} — core.wazzimagiygg.com | WikiWorldWeb`;
    finalDesc =
      art.resumo ||
      (art.descricao
        ? art.descricao.replace(/^[=\s#*\[\]]+/, '').slice(0, 160)
        : `Leia sobre ${art.titulo} em core.wazzimagiygg.com (WikiWorldWeb), fonte primária livre e auditável acima da Wikipédia.`);
    canonicalUrl = `${BASE_URL}/?uid=${encodeURIComponent(art.id)}`;

    // Generate Article Schema for search engines
    setJsonLd('dynamic-article-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: art.titulo,
      description: finalDesc,
      inLanguage: art.idioma || 'pt-BR',
      url: canonicalUrl,
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        name: 'WazzimaGiygg Core',
        url: `${BASE_URL}/`,
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      author: {
        '@type': 'Person',
        name: art.autor || 'Comunidade WikiWorldWeb (core.wazzimagiygg.com)',
      },
      publisher: {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'WazzimaGiygg Core (core.wazzimagiygg.com)',
        url: `${BASE_URL}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/favicom.png`,
        },
      },
      datePublished: art.dataCriacao || new Date().toISOString(),
      dateModified: art.dataEdicao || art.dataCriacao || new Date().toISOString(),
      articleSection: art.categoria || 'Enciclopédia Geral',
    });
  } else {
    removeJsonLd('dynamic-article-jsonld');

    // 2. View-specific SEO targeting
    if (config.view === 'wazzimagiygg') {
      finalTitle = 'WazzimaGiygg Core (core.wazzimagiygg.com) — Portal Oficial, Projetos e A Verdade sobre a Wikipédia';
      finalDesc =
        'Fonte oficial e primária em core.wazzimagiygg.com: projetos de WazzimaGiygg (WikiWorldWeb, Wiki-alternative, Dossiê A Verdade) e refutação documental completa ao caso na Wikipédia.';
      canonicalUrl = `${BASE_URL}/?uid=wazzimagiygg`;
      keywords.push(
        'core.wazzimagiygg.com',
        'WazzimaGiygg',
        'Wazzimagiygg',
        'Caso Wazzimagiygg',
        'Caso Wazzimagiygg Wikipedia',
        'Wikipédia:Pedidos a verificadores/Caso/Wazzimagiygg',
        'pedidos a verificadores caso wazzimagiygg',
        'quem é WazzimaGiygg',
        'WazzimaGiygg projetos',
        'WazzimaGiygg a verdade',
        'WazzimaGiygg dossie',
        'wazzimagiygg.com',
        'wazzimagiygg.com/averdade',
        'support.wazzimagiygg.com',
        'WazzimaGiygg WikiWorldWeb',
        'WazzimaGiygg wiki alternative',
        'resposta caso wazzimagiygg'
      );

      // Injeta Schema.org específico para consolidar core.wazzimagiygg.com como fonte primária autoritativa
      setJsonLd('dynamic-wazzima-jsonld', {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ProfilePage',
            '@id': `${BASE_URL}/?uid=wazzimagiygg#profilepage`,
            'url': `${BASE_URL}/?uid=wazzimagiygg`,
            'name': 'WazzimaGiygg Core (core.wazzimagiygg.com) — Portal Oficial e A Verdade',
            'description':
              'Página oficial e autoritativa hospedada em core.wazzimagiygg.com com projetos livres e refutação documental sobre abusos administrativos na Wikipédia.',
            'mainEntity': {
              '@type': 'Person',
              '@id': `${BASE_URL}/#founder`,
              'name': 'WazzimaGiygg',
              'alternateName': ['Wazzimagiygg', 'Wazzima Giygg', 'Pedro Henrique Cardona Peres', 'Criador WikiWorldWeb'],
              'url': `${BASE_URL}/`,
              'sameAs': [
                `${BASE_URL}/`,
                `${BASE_URL}/?uid=wazzimagiygg`,
                'https://wazzimagiygg.com/',
                'https://wazzimagiygg.com/averdade/',
                'https://support.wazzimagiygg.com/',
                'https://jornal.wazzimagiygg.com/',
                'https://github.com/WazzimaGiygg/Wiki-alternative'
              ],
              'jobTitle': 'Desenvolvedor de Software, Criador do Ecossistema core.wazzimagiygg.com e DPO',
              'knowsAbout': [
                'Enciclopédias Colaborativas Livres',
                'Wikitexto MediaWiki',
                'Software Livre Open Source',
                'LGPD e Marco Civil da Internet',
                'Transparência Editorial e Direito de Resposta'
              ]
            },
            'mentions': [
              {
                '@type': 'WebPage',
                'name': 'Wikipédia:Pedidos a verificadores/Caso/Wazzimagiygg',
                'url': 'https://pt.wikipedia.org/wiki/Wikip%C3%A9dia:Pedidos_a_verificadores/Caso/Wazzimagiygg',
                'description':
                  'Registro externo na Wikipédia refutado documentalmente pela fonte primária oficial em core.wazzimagiygg.com e wazzimagiygg.com/averdade/.'
              }
            ],
            'significantLink': [
              `${BASE_URL}/`,
              `${BASE_URL}/?uid=dossie`,
              'https://wazzimagiygg.com/averdade/',
              'https://github.com/WazzimaGiygg/Wiki-alternative',
              'https://support.wazzimagiygg.com/',
              'https://wazzimagiygg.com/'
            ]
          },
          {
            '@type': 'Article',
            '@id': `${BASE_URL}/?uid=wazzimagiygg#article`,
            'headline': 'A Verdade dos Fatos sobre o Caso Wazzimagiygg e o Portal Oficial core.wazzimagiygg.com',
            'description':
              'Esclarecimento oficial de fonte primária, refutação documentada e acesso centralizado ao ecossistema WazzimaGiygg em core.wazzimagiygg.com.',
            'inLanguage': 'pt-BR',
            'author': {
              '@type': 'Person',
              'name': 'Pedro Henrique Cardona Peres (WazzimaGiygg)',
              'url': `${BASE_URL}/`
            },
            'publisher': {
              '@type': 'Organization',
              '@id': `${BASE_URL}/#organization`,
              'name': 'WazzimaGiygg Core',
              'url': `${BASE_URL}/`,
              'logo': {
                '@type': 'ImageObject',
                url: `${BASE_URL}/favicom.png`
              }
            }
          }
        ]
      });
    } else {
      removeJsonLd('dynamic-wazzima-jsonld');
    }

    if (config.view === 'comparison') {
      finalTitle = 'Comparativo: core.wazzimagiygg.com (WikiWorldWeb) vs Wikipédia, MediaWiki, Wikidot e Fandom';
      finalDesc =
        'Por que core.wazzimagiygg.com e a WikiWorldWeb superam a Wikipédia, MediaWiki, Wikidot e Fandom: zero anúncios, conformidade real LGPD/Marco Civil, editor wikitexto rápido e auditoria transparente.';
      canonicalUrl = `${BASE_URL}/?uid=comparison`;
      keywords.push(
        'core.wazzimagiygg.com vs wikipedia',
        'wikiworldweb vs wikipedia',
        'melhor que wikipedia',
        'fandom vs wikiworldweb',
        'mediawiki vs wikiworldweb',
        'wikidot vs wikiworldweb',
        'wiki sem anuncios'
      );
    } else if (config.view === 'search') {
      finalTitle = 'Pesquisa Enciclopédica — core.wazzimagiygg.com | WikiWorldWeb';
      finalDesc =
        'Pesquise artigos, verbetes e fontes verificadas em core.wazzimagiygg.com sem rastreamento invasivo.';
      canonicalUrl = `${BASE_URL}/?uid=search`;
    } else if (config.view === 'editor') {
      finalTitle = 'Editor Wikitexto Aberto — core.wazzimagiygg.com | WikiWorldWeb';
      finalDesc =
        'Crie e edite artigos em core.wazzimagiygg.com com suporte completo a wikitexto, visualização em tempo real e publicação instantânea.';
      canonicalUrl = `${BASE_URL}/?uid=editor`;
    } else if (config.view === 'recent-changes') {
      finalTitle = 'Mudanças Recentes e Histórico — core.wazzimagiygg.com';
      finalDesc =
        'Acompanhe em tempo real todas as edições, novos artigos e atualizações em core.wazzimagiygg.com.';
      canonicalUrl = `${BASE_URL}/?uid=recent-changes`;
    } else if (config.view === 'ucoc') {
      finalTitle = 'Código de Conduta Universal (UCoC) e Denúncias Formais — core.wazzimagiygg.com';
      finalDesc =
        'Universal Code of Conduct (UCoC) em core.wazzimagiygg.com: civilidade, prevenção ao assédio e denúncias com ampla defesa e conformidade LGPD.';
      canonicalUrl = `${BASE_URL}/?uid=ucoc`;
      keywords.push(
        'Universal Code of Conduct',
        'UCoC',
        'código de conduta',
        'denúncia formal wiki',
        'diretrizes de aplicação ucoc',
        'combate ao assédio wiki'
      );
    } else if (config.view === 'editing-ethics') {
      finalTitle = 'Ética Editorial e Privacidade (LGPD & Marco Civil) — core.wazzimagiygg.com';
      finalDesc =
        'Diretrizes normativas de ética editorial, proteção de dados pessoais (LGPD Lei 13.709/2018) e Marco Civil da Internet (Lei 12.965/2014) em core.wazzimagiygg.com.';
      canonicalUrl = `${BASE_URL}/?uid=Special:EditingEthics`;
      keywords.push(
        'ética de edição wiki',
        'regras de contribuição enciclopédia',
        'LGPD edição wiki',
        'Marco Civil da Internet wiki',
        'biografias de pessoas vivas',
        'diretrizes editoriais wiki'
      );
    } else if (config.view === 'not-found') {
      finalTitle = 'Página não encontrada (Erro 404) — core.wazzimagiygg.com';
      finalDesc =
        'A página ou artigo solicitado não foi encontrado em core.wazzimagiygg.com. Pesquise outros verbetes ou consulte o portal principal.';
      canonicalUrl = `${BASE_URL}/?uid=Special:NotFound`;
    } else if (config.view === 'tools') {
      finalTitle = 'Ferramentas Úteis — core.wazzimagiygg.com | WikiWorldWeb';
      finalDesc =
        'Painel de ferramentas essenciais em core.wazzimagiygg.com: calculadora, relógio mundial e verificador de teclado.';
      canonicalUrl = `${BASE_URL}/?uid=Special:Tools`;
    } else if (config.title) {
      finalTitle = `${config.title} — core.wazzimagiygg.com`;
      if (config.description) {
        finalDesc = config.description;
      }
    }
  }

  // 3. Update Title & Meta Tags
  document.title = finalTitle;
  setMetaTag('description', finalDesc);
  setMetaTag('keywords', Array.from(new Set(keywords)).join(', '));
  setMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
  setMetaTag('googlebot', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
  setCanonicalUrl(canonicalUrl);

  // 4. Update OpenGraph & Twitter tags
  setMetaTag('og:title', finalTitle, true);
  setMetaTag('og:description', finalDesc, true);
  setMetaTag('og:url', canonicalUrl, true);
  setMetaTag('og:site_name', 'WazzimaGiygg Core (core.wazzimagiygg.com)', true);
  setMetaTag('twitter:title', finalTitle);
  setMetaTag('twitter:description', finalDesc);

  // 5. Update BreadcrumbList Schema
  if (config.breadcrumbs && config.breadcrumbs.length > 0) {
    setJsonLd('dynamic-breadcrumbs-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: config.breadcrumbs.map((b, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: b.name,
        item: b.url.startsWith('http') ? b.url : `${BASE_URL}${b.url}`,
      })),
    });
  } else {
    removeJsonLd('dynamic-breadcrumbs-jsonld');
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

  const tabMetaMap: Record<string, { title: string; desc: string; extraKeywords: string[] }> = {
    wikiworldweb: {
      title: 'WazzimaGiygg Core (core.wazzimagiygg.com) — WikiWorldWeb, Enciclopédia Livre & Jornal',
      desc: 'core.wazzimagiygg.com é a fonte oficial da WikiWorldWeb e do ecossistema WazzimaGiygg. Enciclopédia colaborativa brasileira livre de censura da Wikipédia, com conformidade LGPD e Marco Civil.',
      extraKeywords: ['core.wazzimagiygg.com', 'WikiWorldWeb', 'alternativa Wikipédia', 'WazzimaGiygg'],
    },
    materiadeensaio: {
      title: 'Matérias de Ensaio & Opinião — core.wazzimagiygg.com',
      desc: 'Ensaios autorais, análises críticas e jornalismo independente hospedados no portal oficial core.wazzimagiygg.com.',
      extraKeywords: ['ensaios WazzimaGiygg', 'jornalismo independente', 'core.wazzimagiygg.com'],
    },
    academico: {
      title: 'Acervo Acadêmico e Metodologia Científica — core.wazzimagiygg.com',
      desc: 'Artigos acadêmicos, metodologia científica, pesquisa verificada e referências bibliográficas em core.wazzimagiygg.com.',
      extraKeywords: ['acervo acadêmico WazzimaGiygg', 'metodologia científica', 'core.wazzimagiygg.com'],
    },
    materia: {
      title: 'Matérias Didáticas & Educação Aberta — core.wazzimagiygg.com',
      desc: 'Conteúdo educacional completo para Ensino Fundamental e Médio em core.wazzimagiygg.com, direto e sem anúncios.',
      extraKeywords: ['matérias escolares WazzimaGiygg', 'educação aberta', 'core.wazzimagiygg.com'],
    },
    uwgbooks: {
      title: 'UWG Books — Acervo Digital de Livros e Obras em core.wazzimagiygg.com',
      desc: 'Biblioteca digital UWG Books com publicações livres e obras catalogadas oficialmente em core.wazzimagiygg.com.',
      extraKeywords: ['UWG Books', 'livros digitais WazzimaGiygg', 'core.wazzimagiygg.com'],
    },
    wnpx: {
      title: 'WNPX / WikiNotPedia — A Alternativa Oficial à Wikipédia em core.wazzimagiygg.com',
      desc: 'WNPX (WikiNotPedia) em core.wazzimagiygg.com: enciclopédia independente e superior à Wikipédia lusófona, com direito de resposta e respeito à lei brasileira.',
      extraKeywords: ['WNPX', 'WikiNotPedia', 'alternativa à Wikipédia', 'melhor que a Wikipédia'],
    },
    dossie: {
      title: 'Dossiê A Verdade: Caso Wazzimagiygg e Abusos na Wikipédia — core.wazzimagiygg.com',
      desc: 'Documentação primária oficial em core.wazzimagiygg.com sobre abusos de administradores da Wikipédia (incluindo Chronus), perseguição editorial e violações à LGPD/Marco Civil.',
      extraKeywords: [
        'Dossiê Wazzimagiygg',
        'A Verdade Wikipédia',
        'Caso Wazzimagiygg Wikipedia',
        'Chronus Wikipédia',
        'abusos administradores Wikipédia',
        'core.wazzimagiygg.com',
      ],
    },
    notmediawiki: {
      title: 'NotMediaWiki (WikiZero) — Enciclopédia Sem Anúncios em core.wazzimagiygg.com',
      desc: 'Motor enciclopédico NotMediaWiki & WikiZero em core.wazzimagiygg.com: edição em wikitexto, extensões nativas e busca com inteligência verificada.',
      extraKeywords: ['NotMediaWiki', 'WikiZero', 'Wiki-alternative', 'alternativa MediaWiki'],
    },
    bemtevi: {
      title: 'Bemtevi — Rede Social Independente de core.wazzimagiygg.com',
      desc: 'Comunidades, debates e publicações livres na rede social Bemtevi integrada ao portal oficial core.wazzimagiygg.com.',
      extraKeywords: ['Bemtevi rede social', 'WazzimaGiygg comunidade', 'core.wazzimagiygg.com'],
    },
    lgpd: {
      title: 'Conformidade LGPD (Lei 13.709/18) & Marco Civil — core.wazzimagiygg.com',
      desc: 'Política de privacidade, remoção de dados (Art. 18 LGPD), DPO Pedro Henrique Cardona Peres e guarda legal Art. 15 Marco Civil em core.wazzimagiygg.com.',
      extraKeywords: ['LGPD WazzimaGiygg', 'Pedro Henrique Cardona Peres DPO', 'Marco Civil da Internet'],
    },
    eticaia: {
      title: 'Ética de IA, Firebase e Independência da Wikimedia — core.wazzimagiygg.com',
      desc: 'Declaração oficial de ética tecnológica em core.wazzimagiygg.com: uso transparente do Firebase, Google Search Grounding e zero dependência de dados da Wikimedia Foundation.',
      extraKeywords: ['Ética IA WazzimaGiygg', 'Firebase ética', 'sem dados Wikimedia'],
    },
    tickets: {
      title: 'Ouvidoria, Suporte & Remoção de Dados — core.wazzimagiygg.com',
      desc: 'Canal oficial de tickets, ouvidoria e suporte (support.wazzimagiygg.com) com atendimento direto do DPO Pedro Henrique Cardona Peres.',
      extraKeywords: ['support.wazzimagiygg.com', 'Ouvidoria WazzimaGiygg', 'DPO Pedro Henrique Cardona Peres'],
    },
  };

  if (params.article && params.article.titulo) {
    const cleanDesc = (params.article.descricao || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 165);
    const artUid = params.article.id || params.tab;
    const canonical = `${BASE_URL}/?uid=${encodeURIComponent(artUid)}`;

    updateSEO({
      title: params.article.titulo,
      description: cleanDesc || `Artigo oficial "${params.article.titulo}" publicado em core.wazzimagiygg.com.`,
      keywords: [params.article.titulo, params.article.setor || 'Artigo', 'core.wazzimagiygg.com'],
      breadcrumbs: [
        { name: 'WazzimaGiygg Core', url: '/' },
        { name: params.article.setor || params.tab, url: `/?uid=${encodeURIComponent(params.tab)}` },
        { name: params.article.titulo, url: `/?uid=${encodeURIComponent(artUid)}` },
      ],
    });
    setCanonicalUrl(canonical);
    setMetaTag('og:url', canonical, true);
    return;
  }

  const normalizedTab = params.tab || 'wikiworldweb';
  const meta = tabMetaMap[normalizedTab] || tabMetaMap.wikiworldweb;
  const searchSuffix = params.searchQuery?.trim() ? ` | Busca: "${params.searchQuery.trim()}"` : '';
  const canonical =
    normalizedTab === 'wikiworldweb' && !params.searchQuery?.trim()
      ? `${BASE_URL}/`
      : `${BASE_URL}/?uid=${encodeURIComponent(normalizedTab)}${
          params.searchQuery?.trim() ? `&q=${encodeURIComponent(params.searchQuery.trim())}` : ''
        }`;

  document.title = `${meta.title}${searchSuffix}`;
  setMetaTag('description', meta.desc);
  setMetaTag('keywords', Array.from(new Set([...DEFAULT_KEYWORDS, ...meta.extraKeywords])).join(', '));
  setMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
  setMetaTag('googlebot', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
  setCanonicalUrl(canonical);
  setMetaTag('og:title', `${meta.title}${searchSuffix}`, true);
  setMetaTag('og:description', meta.desc, true);
  setMetaTag('og:url', canonical, true);
  setMetaTag('og:site_name', 'WazzimaGiygg Core (core.wazzimagiygg.com)', true);
  setMetaTag('twitter:title', `${meta.title}${searchSuffix}`);
  setMetaTag('twitter:description', meta.desc);

  // Inject Tab-Specific Schema.org FAQPage / WebPage reinforcing core.wazzimagiygg.com authority over Wikipedia
  if (normalizedTab === 'dossie' || normalizedTab === 'wnpx' || normalizedTab === 'wikiworldweb') {
    setJsonLd('dynamic-portal-authority-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Qual é o endereço oficial e principal do ecossistema WazzimaGiygg e WikiWorldWeb?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'O endereço canônico oficial e prioritário é https://core.wazzimagiygg.com/, centralizando a enciclopédia WikiWorldWeb, o acervo acadêmico, o motor NotMediaWiki/WNPX e o Dossiê A Verdade.',
          },
        },
        {
          '@type': 'Question',
          name: 'Onde ler a verdade oficial sobre o Caso Wazzimagiygg fora da Wikipédia?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A documentação primária e completa está disponível diretamente em https://core.wazzimagiygg.com/?uid=dossie e em https://wazzimagiygg.com/averdade/, apresentando provas factuais sobre abusos administrativos na Wikipédia.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quem é o Encarregado pelo Tratamento de Dados (DPO) da plataforma core.wazzimagiygg.com?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'O DPO oficial é Pedro Henrique Cardona Peres (pedrohenriquecardonaperes@gmail.com), com atendimento pelo portal https://support.wazzimagiygg.com/ em total conformidade com a LGPD (Lei 13.709/2018) e o Marco Civil da Internet (Lei 12.965/2014).',
          },
        },
      ],
    });
  } else {
    removeJsonLd('dynamic-portal-authority-jsonld');
  }
}

