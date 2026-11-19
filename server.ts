import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { checkIfWikimediaIp, cleanIpAddress } from './src/wiki/utils/wikimediaIpChecker';
import { evaluateIpLocally } from './src/wiki/utils/vpnChecker';
import {
  AuthenticatedRequest,
  AUTHORIZED_BUROCRATA_EMAIL,
  AUTHORIZED_PUBLISHER_EMAILS,
  clampString,
  createCorsMiddleware,
  createRateLimiter,
  createSecurityHeadersMiddleware,
  escapeHtml,
  getSafeClientIp,
  isSafeHttpUrl,
  isValidEmail,
  isValidId,
  isVerifiedBurocrata,
  isVerifiedPublisher,
  maskIpForDisplay,
  optionalAuth,
  requireAuth,
  requireBurocrata,
  requirePublisher,
  sanitizePlainObject,
  VerifiedAuthUser,
  verifyElevationSecret,
} from './server/security';
import {
  resolveCanonicalUrl,
  resolveDynamicSeoMetadata,
  injectSeoIntoHtml,
  SeoArticleInput,
} from './src/seo/canonicalEngine';
import {
  WIKI_SITE_VERSION,
  WIKI_SITE_DISPLAY_ID,
  WIKI_SITE_GENERATOR,
  getWikiSiteVersionManifest,
} from './src/config/wikiVersion';
import {
  buildPersonalUserPageSlug,
  buildPersonalUserPageTitle,
  buildPersonalUserPageWikitext,
  resolveUserDisplayName,
} from './src/config/userInfobox';
import {
  SEED_WIKI_ARTICLES,
  SEED_WIKI_REVISIONS,
  SEED_WIKI_EVENTS,
  SEED_WIKI_EXTENSIONS,
  parseWikitextToHtml,
  computeWikitextDiff,
  WikiArticle,
  WikiRevision,
  WikiEvent,
  WikiExtension,
  ALLOWED_EXTENSION_DOMAINS,
  scanExtensionCodeForMalware,
  verifyExtensionSyncSecurity,
  computeSha256Hex,
  ExtensionSecurityAudit,
  EXISTING_EXTENSIONS_CATALOG
} from './src/data/notMediaWikiData';
import {
  SEED_BEMTEVI_POSTS,
  SEED_BEMTEVI_COMMUNITIES,
  SEED_BEMTEVI_USERS,
  SEED_BEMTEVI_COMMENTS,
  SEED_BEMTEVI_TRENDING,
  SEED_BEMTEVI_MESSAGES,
  BemteviPost,
  BemteviComment,
  BemteviCommunity,
  BemteviCategory,
  BEMTEVI_CATEGORIES,
  computeTrendingTopicsFromDbPosts,
  extractHashtagsFromText
} from './src/data/bemteviData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const IS_DEV = process.env.NODE_ENV !== 'production';

// Hide stack fingerprint and configure single-hop reverse proxy validation (Vercel/Cloud Run)
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Middleware for parsing JSON/urlencoded with strict size limits + prototype pollution scrub
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizePlainObject(req.body);
  }
  next();
});

// Rate Limiters
const apiGeneralLimiter = createRateLimiter({ windowMs: 60_000, max: 180, keyPrefix: 'api-general' });
const apiWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 45, keyPrefix: 'api-write' });
const elevateLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 8,
  keyPrefix: 'elevate',
  message: 'Muitas tentativas de elevação administrativa. Tente novamente mais tarde.'
});
const ticketSubmitLimiter = createRateLimiter({
  windowMs: 10 * 60_000,
  max: 10,
  keyPrefix: 'ticket-submit',
  message: 'Limite de abertura de tickets atingido. Aguarde alguns minutos.'
});
const logSubmitLimiter = createRateLimiter({ windowMs: 60_000, max: 30, keyPrefix: 'log-submit' });
const geminiLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: 'gemini',
  message: 'Limite de requisições de IA atingido. Aguarde um minuto.'
});

// Security Headers (CSP, HSTS, X-Frame-Options, etc.) & Origin-Allowlisted CORS
app.use(createSecurityHeadersMiddleware(IS_DEV));
app.use(createCorsMiddleware());
app.use('/api/', apiGeneralLimiter);
app.use('/api/', (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  return apiWriteLimiter(req, res, next);
});

// Wiki-Site Version & SEO Canonical Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-WikiSite-Version', WIKI_SITE_VERSION);
  res.setHeader('X-Powered-By-WikiSite', WIKI_SITE_DISPLAY_ID);

  if (req.path.startsWith('/admin') || req.path.startsWith('/admintools') || req.path.startsWith('/solicitacaodeexlusao')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  } else if (
    req.method === 'GET' &&
    !req.path.startsWith('/api/') &&
    !req.path.startsWith('/@') &&
    !req.path.startsWith('/src/') &&
    !req.path.startsWith('/node_modules/') &&
    !req.path.match(/\.(js|mjs|ts|tsx|css|png|jpg|jpeg|svg|ico|webp|woff2?|json|xml|txt)$/i)
  ) {
    const rawQuery = req.originalUrl.includes('?') ? req.originalUrl.split('?')[1] : '';
    const canonicalUrl = resolveCanonicalUrl({
      uid: typeof req.query?.uid === 'string' ? req.query.uid : undefined,
      searchQuery: typeof req.query?.q === 'string' ? req.query.q : undefined,
      rawSearchParams: rawQuery,
      pathname: req.path,
    });
    const hasSearchSpam = typeof req.query?.q === 'string' && req.query.q.trim().length > 0;
    const robotsValue = hasSearchSpam
      ? 'noindex, follow'
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

    res.setHeader('Link', `<${canonicalUrl}>; rel="canonical"`);
    res.setHeader('X-Robots-Tag', robotsValue);
  }
  next();
});

// Helper to safely read JSON files
function loadJsonFile<T>(relativePath: string, fallback: T): T {
  try {
    const fullPath = path.resolve(__dirname, relativePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.warn(`[Backend] Could not load ${relativePath}, using fallback.`, err);
  }
  return fallback;
}

export interface ServerDeletionRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  reason: string;
  dataTypes: string[];
  status: string;
  requestDate: string;
  ipAddress?: string;
  processedBy?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  certificateId?: string | null;
}

// In-memory data store for high performance and fallback cache
const DATA_CACHE = {
  menu: loadJsonFile<any[]>('src/data/menu.json', []),
  noticias: loadJsonFile<any[]>('src/data/noticias.json', []),
  artigos: loadJsonFile<any>('src/data/json/artigos.json', { materias: {} }),
  cidadesSancionadas: loadJsonFile<any>('src/data/cidades_sancionadas.json', { cidades_sancionadas: [] }),
  customArticles: [] as any[],
  messages: [
    {
      id: 'msg_welcome',
      senderId: 'sistema',
      senderName: 'WazzimaGiygg Central',
      text: 'Bem-vindo ao canal oficial de comunicação e suporte do ecossistema WazzimaGiygg.',
      timestamp: new Date().toISOString()
    }
  ],
  tickets: [
    {
      id: 'tkt-001',
      nome: 'Leitor Anônimo',
      email: 'contato@wazzimagiygg.com',
      tipo: 'Dúvida Geral',
      mensagem: 'Sistema de consulta bibliográfica e artigos acadêmicos funcionando em alta performance.',
      status: 'Resolvido',
      criadoEm: new Date().toISOString()
    }
  ],
  auditLogs: [] as any[],
  costs: [
    {
      id: "cst-001",
      descricao: "Instância Cloud Run & Node.js Server",
      categoria: "Infraestrutura",
      valor: 45.80,
      data: "2026-11-01",
      comprovanteUrl: "https://cloud.google.com",
      responsavel: "Burocrata-Chefe",
      status: "Pago"
    },
    {
      id: "cst-002",
      descricao: "Certificados SSL & DNS Anycast wazzimagiygg.com",
      categoria: "Domínio & DNS",
      valor: 89.00,
      data: "2026-10-15",
      comprovanteUrl: "https://registro.br",
      responsavel: "Burocrata-Chefe",
      status: "Pago"
    },
    {
      id: "cst-003",
      descricao: "Armazenamento Firestore & Regras de Segurança (wzzm-ce3fc)",
      categoria: "Servidor & Banco",
      valor: 19.50,
      data: "2026-11-03",
      comprovanteUrl: "https://console.firebase.google.com",
      responsavel: "Infraestrutura WZZM",
      status: "Pago"
    }
  ],
  redirects: [
    {
      id: "red-01",
      slug: "forum",
      urlDestino: "https://wazzimagiygg.com/forum/",
      titulo: "Fórum da Comunidade MASPIA",
      comAviso: false,
      totalCliques: 1420,
      criadoEm: "2026-01-10",
      criadoPor: "admin@wazzimagiygg.com",
      ativo: true
    },
    {
      id: "red-02",
      slug: "acervo",
      urlDestino: "https://wazzimagiygg.com/wiki/",
      titulo: "Acesso Rápido ao Acervo Wiki Zero",
      comAviso: false,
      totalCliques: 890,
      criadoEm: "2026-02-14",
      criadoPor: "admin@wazzimagiygg.com",
      ativo: true
    }
  ],
  forumTopics: [
    {
      id: "top-101",
      titulo: "[COMUNICADO] Diretrizes Editoriais e Conformidade com o Marco Civil",
      categoria: "Regulamento",
      autor: "Burocrata-Chefe",
      autorEmail: "admin@wazzimagiygg.com",
      respostas: 18,
      fixado: true,
      fechado: true,
      denunciado: false,
      dataCriacao: "2026-02-01"
    },
    {
      id: "top-102",
      titulo: "Metodologia de Revisão de Artigos na Seção Acadêmica",
      categoria: "Debates Acadêmicos",
      autor: "Prof. Dr. Oliveira",
      autorEmail: "docente@wazzimagiygg.com",
      respostas: 34,
      fixado: false,
      fechado: false,
      denunciado: false,
      dataCriacao: "2026-03-12"
    }
  ],
  surveys: [
    {
      id: "surv-01",
      titulo: "Avaliação do Novo Mecanismo de Busca em TypeScript",
      tipo: "Pesquisa Acadêmica",
      descricao: "Coleta de opiniões dos leitores sobre a velocidade e precisão da pesquisa de artigos.",
      respostasOuStatus: "84 respostas coletadas (96% aprovação)",
      data: "2026-10-28",
      prioridade: "Média"
    },
    {
      id: "surv-02",
      titulo: "Denúncia anônima de violação de direitos autorais em ensaio didático",
      tipo: "Denúncia Investigativa",
      descricao: "Relato de trecho duplicado sem citação adequada do autor original na coleção Matéria de Ensaio.",
      respostasOuStatus: "Em Investigação pelo Burocrata",
      data: "2026-11-02",
      prioridade: "Alta"
    }
  ],
  blogPosts: [
    {
      id: "blog-01",
      titulo: "Reestruturação Completa da Plataforma WazzimaGiygg em TypeScript",
      resumo: "Migração da arquitetura técnica com integração unificada ao Firestore e máxima segurança.",
      conteudo: "Hoje concluímos a modernização da infraestrutura do portal WazzimaGiygg, garantindo que todas as 5 coleções e o acervo histórico permaneçam 100% íntegros com performance otimizada.",
      autor: "Gabinete do Burocrata",
      data: "2026-11-05",
      publicado: true,
      tags: ["Tecnologia", "TypeScript", "Atualização"]
    }
  ],
  deletionRequests: [
    {
      id: "LGPD-REQ-9841",
      name: "Carlos Eduardo Silva",
      email: "carlos.silva@exemplo.com.br",
      phone: "+55 (11) 98765-4321",
      reason: "Revogação de consentimento com base no Art. 18 da LGPD. Solicito exclusão de cadastros e comentários antigos.",
      dataTypes: ["Dados Cadastrais", "Comentários no Fórum", "Histórico de Sessão"],
      status: "pending",
      requestDate: "2026-11-04T14:20:00.000Z",
      ipAddress: "177.136.24.112",
      processedBy: null,
      completedAt: null
    },
    {
      id: "LGPD-REQ-9832",
      name: "Mariana Costa Leite",
      email: "mariana.leite@usp.br",
      phone: "+55 (19) 99123-5566",
      reason: "Encerramento de vínculo acadêmico e anonimização de perfil em conformidade com a LGPD.",
      dataTypes: ["Perfil de Usuário", "Registros de Acesso"],
      status: "processing",
      requestDate: "2026-11-03T09:15:00.000Z",
      ipAddress: "200.144.12.89",
      processedBy: "pedrohenriquecardonaperes@gmail.com"
    },
    {
      id: "LGPD-REQ-9810",
      name: "João Batista Rocha",
      email: "j.rocha@advocacia.net",
      phone: "+55 (61) 98111-2233",
      reason: "Exclusão integral de dados pessoais.",
      dataTypes: ["Dados Cadastrais"],
      status: "completed",
      requestDate: "2026-10-28T16:45:00.000Z",
      ipAddress: "189.40.110.5",
      processedBy: "pedrohenriquecardonaperes@gmail.com",
      completedAt: "2026-10-29T11:00:00.000Z",
      certificateId: "LGPD-CERT-984210"
    }
  ],
  users: [
    {
      uid: 'usr_pedro_cardona_official',
      name: 'Pedro Henrique Cardona Peres',
      email: 'pedrohenriquecardonaperes@gmail.com',
      isAdmin: true,
      isBanned: false,
      isTeacher: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    },
    {
      uid: 'usr_editor_02',
      name: 'Professor & Editor Acadêmico',
      email: 'docente@wazzimagiygg.com',
      isAdmin: false,
      isBanned: false,
      isTeacher: true,
      createdAt: '2025-06-15T14:30:00.000Z',
      lastLoginAt: new Date().toISOString()
    },
    {
      uid: 'usr_infrator_03',
      name: 'IP Vândalo em Observação',
      email: 'vandal@proxy.net',
      isAdmin: false,
      isBanned: true,
      banReason: 'Tentativa de alteração maliciosa de dados de mobilidade',
      isTeacher: false,
      createdAt: '2025-08-20T09:15:00.000Z',
      lastLoginAt: '2025-09-01T10:00:00.000Z'
    }
  ]
};

// ============================================
// API ROUTES
// ============================================

// Route for ferramentasadministrativas.html (discourage search indexing)
app.get(['/admin/ferramentasadministrativas.html', '/ferramentasadministrativas.html'], (_req: Request, res: Response) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const filePath = path.resolve(__dirname, 'public/admin/ferramentasadministrativas.html');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Página de ferramentas administrativas não encontrada.');
  }
});

// 1. Health & Status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'WazzimaGiygg',
    version: '2.0.0-ts',
    wikiSiteVersion: WIKI_SITE_VERSION,
    wikiSiteId: WIKI_SITE_DISPLAY_ID,
    generator: WIKI_SITE_GENERATOR,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      provider: 'Firebase Firestore',
      projectId: 'wzzm-ce3fc',
      status: 'active'
    }
  });
});

// 2. Navigation Menu & Tools
app.get('/api/menu', (_req: Request, res: Response) => {
  res.json(DATA_CACHE.menu);
});

// 3. News Feed (Notícias)
app.get('/api/news', (_req: Request, res: Response) => {
  res.json(DATA_CACHE.noticias);
});

// 4. Academic Subjects & Research (Acadêmico)
app.get('/api/academic', (_req: Request, res: Response) => {
  res.json(DATA_CACHE.artigos);
});

// 5. Sanctioned Entities & Cities
app.get('/api/sanctions', (_req: Request, res: Response) => {
  res.json(DATA_CACHE.cidadesSancionadas);
});

// Helper to assemble articles across all supported collections
function buildArticlesList(collection: string): any[] {
  const results: any[] = [];
  const col = (collection || 'wikiworldweb').toString();

  if (col === 'academico' || col === 'all') {
    const materias = DATA_CACHE.artigos?.materias || {};
    for (const [key, value] of Object.entries<any>(materias)) {
      results.push({
        id: `acad_${key}`,
        titulo: value.titulo,
        descricao: value.descricao,
        setor: value.categoria || 'Acadêmico',
        criadorEmail: 'academico@wazzimagiygg.com',
        dataCriacao: new Date().toISOString(),
        ultimaEdicao: new Date().toISOString(),
        visualizacoes: 142 + ((key.length * 13) % 50),
        colecao: 'academico',
        link: value.link,
        categoria: value.categoria
      });
    }
  }

  if (col === 'wikiworldweb' || col === 'all') {
    const news = DATA_CACHE.noticias || [];
    news.forEach((item, index) => {
      results.push({
        id: `news_${index + 1}`,
        titulo: item.titulo,
        descricao: item.resumo,
        setor: 'Notícias & Sociedade',
        criadorEmail: 'redacao@wazzimagiygg.com',
        dataCriacao: new Date().toISOString(),
        ultimaEdicao: new Date().toISOString(),
        visualizacoes: 280 + index * 19,
        colecao: 'wikiworldweb',
        link: item.link
      });
    });
  }

  if (col === 'materiadeensaio' || col === 'all') {
    results.push(
      {
        id: 'ensaio_1',
        titulo: 'A Reforma Psiquiátrica e a Trajetória dos CAPS no Brasil',
        descricao: 'Análise aprofundada sobre a superação do modelo asilar e a consolidação de políticas públicas humanizadas de desinstitucionalização.',
        setor: 'Saúde Mental & Direitos',
        criadorEmail: 'ensaios@wazzimagiygg.com',
        dataCriacao: new Date().toISOString(),
        ultimaEdicao: new Date().toISOString(),
        visualizacoes: 520,
        colecao: 'materiadeensaio'
      },
      {
        id: 'ensaio_2',
        titulo: 'Neutralidade de Rede e Direitos Fundamentais no Marco Civil',
        descricao: 'Garantias constitucionais e limites de moderação privada em plataformas de conhecimento colaborativo sob a Lei 12.965/2014.',
        setor: 'Direito Digital',
        criadorEmail: 'juridico@wazzimagiygg.com',
        dataCriacao: new Date().toISOString(),
        ultimaEdicao: new Date().toISOString(),
        visualizacoes: 412,
        colecao: 'materiadeensaio'
      }
    );
  }

  if (col === 'uwgbooks' || col === 'all') {
    results.push(
      {
        id: 'uwg_1',
        titulo: 'Compêndio de Metodologia e Produção Científica',
        descricao: 'Manual de diretrizes para elaboração de monografias, dissertações e artigos acadêmicos conforme normas técnicas.',
        setor: 'UWG Books',
        criadorEmail: 'editora@wazzimagiygg.com',
        dataCriacao: new Date().toISOString(),
        ultimaEdicao: new Date().toISOString(),
        visualizacoes: 389,
        colecao: 'uwgbooks'
      },
      {
        id: 'uwg_2',
        titulo: 'História do Conhecimento Livre e Enciclopedismo Digital',
        descricao: 'Da Enciclopédia de Diderot às wikis modernas: a batalha contra os monopólios de informação e o assédio editorial.',
        setor: 'UWG Books',
        criadorEmail: 'editora@wazzimagiygg.com',
        dataCriacao: new Date().toISOString(),
        ultimaEdicao: new Date().toISOString(),
        visualizacoes: 630,
        colecao: 'uwgbooks'
      }
    );
  }

  if (col === 'materia' || col === 'all') {
    const materias = DATA_CACHE.artigos?.materias || {};
    Object.entries<any>(materias)
      .slice(0, 8)
      .forEach(([key, value]) => {
        results.push({
          id: `mat_${key}`,
          titulo: value.titulo || key,
          descricao: value.descricao || '',
          conteudo: value.descricao || '',
          setor: value.categoria || 'Matérias & Referências',
          criadorEmail: 'redacao@wazzimagiygg.com',
          dataCriacao: new Date().toISOString(),
          ultimaEdicao: new Date().toISOString(),
          visualizacoes: 195,
          colecao: 'materia',
          link: value.link
        });
      });
  }

  // Include custom articles persisted in server memory
  for (const custom of DATA_CACHE.customArticles) {
    if (col === 'all' || custom.colecao === col) {
      results.unshift(custom);
    }
  }

  return results;
}

// 6. Articles API (Querying, Creating, Updating, Deleting)
app.get('/api/articles', (req: Request, res: Response) => {
  const { collection = 'wikiworldweb', search = '', limit = '50' } = req.query;
  const maxLimit = Math.min(parseInt(limit as string, 10) || 50, 200);
  const colStr = typeof collection === 'string' ? collection : 'wikiworldweb';

  let results = buildArticlesList(colStr);

  // Filter by query if present
  if (typeof search === 'string' && search.trim().length > 0) {
    const q = search.toLowerCase().trim();
    results = results.filter(
      (item) =>
        item.titulo?.toLowerCase().includes(q) ||
        item.descricao?.toLowerCase().includes(q) ||
        item.setor?.toLowerCase().includes(q)
    );
  }

  res.json({
    total: results.length,
    collection: colStr,
    articles: results.slice(0, maxLimit)
  });
});

app.post('/api/articles', requirePublisher, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { titulo, descricao, conteudo, setor, colecao, link } = req.body || {};
  const cleanTitle = clampString(titulo, 300);
  if (!cleanTitle) {
    res.status(400).json({ error: 'Título do artigo é obrigatório.' });
    return;
  }
  if (link && !isSafeHttpUrl(link)) {
    res.status(400).json({ error: 'URL de referência inválida (permitido apenas http/https).' });
    return;
  }

  const now = new Date().toISOString();
  const article = {
    id: `art_${Date.now().toString(36)}`,
    titulo: cleanTitle,
    descricao: clampString(descricao || conteudo || '', 20000),
    conteudo: clampString(conteudo || descricao || '', 50000),
    setor: clampString(setor, 100) || 'Geral',
    criadorEmail: authUser.email,
    dataCriacao: now,
    ultimaEdicao: now,
    visualizacoes: 1,
    colecao: clampString(colecao, 60) || 'wikiworldweb',
    ...(link ? { link: String(link).trim() } : {})
  };

  DATA_CACHE.customArticles.unshift(article);
  res.status(201).json({ success: true, article });
});

app.put('/api/articles/:id', requirePublisher, (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    res.status(400).json({ error: 'ID de artigo inválido.' });
    return;
  }
  const idx = DATA_CACHE.customArticles.findIndex((a) => a.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Artigo editável não encontrado no servidor.' });
    return;
  }

  const { titulo, descricao, conteudo, setor, colecao, link } = req.body || {};
  if (link !== undefined && link !== '' && !isSafeHttpUrl(link)) {
    res.status(400).json({ error: 'URL de referência inválida (permitido apenas http/https).' });
    return;
  }

  const current = DATA_CACHE.customArticles[idx];
  const updated = {
    ...current,
    ...(titulo !== undefined ? { titulo: clampString(titulo, 300) || current.titulo } : {}),
    ...(descricao !== undefined ? { descricao: clampString(descricao, 20000) } : {}),
    ...(conteudo !== undefined ? { conteudo: clampString(conteudo, 50000) } : {}),
    ...(setor !== undefined ? { setor: clampString(setor, 100) || current.setor } : {}),
    ...(colecao !== undefined ? { colecao: clampString(colecao, 60) || current.colecao } : {}),
    ...(link !== undefined ? { link: link ? String(link).trim() : undefined } : {}),
    id,
    ultimaEdicao: new Date().toISOString()
  };
  DATA_CACHE.customArticles[idx] = updated;
  res.json({ success: true, article: updated });
});

app.delete('/api/articles/:id', requirePublisher, (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    res.status(400).json({ error: 'ID de artigo inválido.' });
    return;
  }
  const beforeLen = DATA_CACHE.customArticles.length;
  DATA_CACHE.customArticles = DATA_CACHE.customArticles.filter((a) => a.id !== id);
  if (DATA_CACHE.customArticles.length < beforeLen) {
    res.json({ success: true, message: `Artigo ${id} removido.` });
    return;
  }
  if (id.startsWith('news_')) {
    const idx = parseInt(id.replace('news_', ''), 10) - 1;
    if (idx >= 0 && idx < DATA_CACHE.noticias.length) {
      DATA_CACHE.noticias.splice(idx, 1);
      res.json({ success: true, message: `Artigo ${id} removido.` });
      return;
    }
  }
  res.status(404).json({ error: 'Artigo não encontrado.' });
});

// 7. Single Article Fetch
app.get('/api/articles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const found = buildArticlesList('all').find((a) => a.id === id);
  if (found) {
    res.json(found);
  } else {
    res.status(404).json({ error: 'Artigo não encontrado' });
  }
});

// 8. Messages / Chat (Fully compatible with original JSONBin structure, authenticated mutations)
app.get('/api/jsonbin/messages', (_req: Request, res: Response) => {
  res.json({
    record: DATA_CACHE.messages,
    metadata: {
      id: '684c71428960c979a5a95fd5',
      private: false,
      createdAt: new Date().toISOString()
    }
  });
});

app.put('/api/jsonbin/messages', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const body = req.body;
  const newMessages = Array.isArray(body) ? body : body?.record;
  if (!Array.isArray(newMessages)) {
    res.status(400).json({ error: 'Formato inválido. Esperado array de mensagens.' });
    return;
  }

  const sanitizedIncoming = newMessages
    .filter((m: any) => m && typeof m === 'object' && typeof m.text === 'string' && m.text.trim())
    .slice(-200)
    .map((m: any) => ({
      id: isValidId(m.id) ? String(m.id) : `msg_${Date.now()}`,
      senderId: isVerifiedBurocrata(authUser) ? clampString(m.senderId || authUser.uid, 128) : authUser.uid,
      senderName: clampString(m.senderName || authUser.name || 'Usuário', 100) || 'Usuário',
      text: clampString(m.text, 2000),
      timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date().toISOString()
    }));

  if (isVerifiedBurocrata(authUser)) {
    DATA_CACHE.messages = sanitizedIncoming;
  } else {
    // Non-burocrata users may only append their own new messages without erasing prior history
    const existingIds = new Set(DATA_CACHE.messages.map((m) => m.id));
    const additions = sanitizedIncoming.filter((m) => !existingIds.has(m.id));
    DATA_CACHE.messages = [...DATA_CACHE.messages, ...additions].slice(-200);
  }

  res.json({
    record: DATA_CACHE.messages,
    success: true,
    updatedAt: new Date().toISOString()
  });
});

// 9. Support & Compliance Tickets (LGPD, Marco Civil, Suporte) — strictly isolated per user / Burocrata
app.get('/api/tickets', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  if (isVerifiedBurocrata(authUser)) {
    res.json(DATA_CACHE.tickets);
    return;
  }

  const ownTickets = DATA_CACHE.tickets.filter((t: any) => {
    const byUid = t.requesterUid && t.requesterUid === authUser.uid;
    const byVerifiedEmail =
      authUser.emailVerified &&
      authUser.email &&
      typeof t.email === 'string' &&
      t.email.toLowerCase().trim() === authUser.email.toLowerCase().trim();
    return Boolean(byUid || byVerifiedEmail);
  });
  res.json(ownTickets);
});

app.post('/api/tickets', ticketSubmitLimiter, optionalAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser;
  const { nome, email, tipo, mensagem } = req.body || {};
  if (!isValidEmail(email) || typeof mensagem !== 'string' || !mensagem.trim()) {
    res.status(400).json({ error: 'E-mail válido e mensagem são campos obrigatórios.' });
    return;
  }

  const cleanMessage = clampString(mensagem, 5000);
  if (cleanMessage.length < 5) {
    res.status(400).json({ error: 'A mensagem deve conter pelo menos 5 caracteres.' });
    return;
  }

  const newTicket = {
    id: `tkt-${Date.now().toString(36)}`,
    requesterUid: authUser?.uid || null,
    nome: clampString(nome, 150) || 'Anônimo',
    email: String(email).trim().toLowerCase().slice(0, 200),
    tipo: clampString(tipo, 120) || 'Solicitação Geral',
    mensagem: cleanMessage,
    status: 'Em Análise',
    criadoEm: new Date().toISOString()
  };

  DATA_CACHE.tickets.unshift(newTicket);
  res.status(201).json({
    success: true,
    message: 'Solicitação registrada com sucesso no protocolo oficial.',
    ticket: newTicket
  });
});

// 10. Audit & Access Logs (Marco Civil Art. 15 / LGPD Art. 37 — validated server-side, restricted read)
app.post('/api/logs', logSubmitLimiter, optionalAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser;
  const body = req.body || {};
  const action = clampString(body.action, 120);
  if (!action) {
    res.status(400).json({ error: 'Campo action é obrigatório.' });
    return;
  }

  const rawDetails = body.details && typeof body.details === 'object' ? sanitizePlainObject(body.details) : {};
  const safeDetails: Record<string, any> = {};
  const blockedKeys = new Set(['password', 'passkey', 'token', 'authorization', 'cookie', 'secret']);
  for (const [k, v] of Object.entries(rawDetails)) {
    if (blockedKeys.has(k.toLowerCase())) continue;
    safeDetails[k] = typeof v === 'string' ? v.slice(0, 500) : v;
  }

  const clientIp = getSafeClientIp(req);
  const logType = action.includes('login') || action.includes('access') ? 'access_marco_civil' : 'application_event';
  const retentionDays = logType === 'access_marco_civil' ? 180 : 90;

  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    logType,
    action,
    userId: authUser ? authUser.uid : clampString(body.userId, 128) || 'anon',
    authenticated: Boolean(authUser),
    details: safeDetails,
    userAgent: clampString(body.userAgent || req.headers['user-agent'], 300),
    receivedAt: new Date().toISOString(),
    retentionDays,
    ip: clientIp
  };

  DATA_CACHE.auditLogs.unshift(logEntry);
  if (DATA_CACHE.auditLogs.length > 500) {
    DATA_CACHE.auditLogs.pop();
  }

  res.json({ success: true, logId: logEntry.id });
});

app.get('/api/admin/logs', requireBurocrata, (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: DATA_CACHE.auditLogs.length,
    logs: DATA_CACHE.auditLogs.map((entry: any) => ({
      ...entry,
      ipMasked: maskIpForDisplay(entry.ip || '')
    }))
  });
});

// 11. Statistics API
app.get('/api/stats', (_req: Request, res: Response) => {
  const totalArticles =
    Object.keys(DATA_CACHE.artigos?.materias || {}).length +
    (DATA_CACHE.noticias?.length || 0) +
    4;

  res.json({
    totalArticles,
    totalCategories: 5,
    sanctionedCount: DATA_CACHE.cidadesSancionadas?.cidades_sancionadas?.length || 0,
    activeTickets: DATA_CACHE.tickets.length,
    systemUptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 12. BUROCRATA & ADMIN CORE API (admin/) — STRICTLY PROTECTED BY requireBurocrata
// ============================================

// List users for admin dashboard
app.get('/api/admin/users', requireBurocrata, (_req: Request, res: Response) => {
  res.json({
    total: DATA_CACHE.users.length,
    users: DATA_CACHE.users
  });
});

// Add new user administratively
app.post('/api/admin/users', requireBurocrata, (req: Request, res: Response) => {
  const { name, email, isAdmin, isTeacher, isBanned } = req.body || {};
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'E-mail válido é obrigatório.' });
    return;
  }

  const newUser = {
    uid: `usr_${Date.now().toString(36)}`,
    name: clampString(name, 120) || 'Novo Usuário',
    email: String(email).trim().toLowerCase().slice(0, 200),
    isAdmin: !!isAdmin,
    isTeacher: !!isTeacher,
    isBanned: !!isBanned,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  DATA_CACHE.users.unshift(newUser);
  res.status(201).json({ success: true, user: newUser });
});

// Toggle Admin role
app.put('/api/admin/users/:uid/toggle-admin', requireBurocrata, (req: Request, res: Response) => {
  const { uid } = req.params;
  const { isAdmin } = req.body || {};
  const user = DATA_CACHE.users.find((u) => u.uid === uid);
  if (user) {
    user.isAdmin = typeof isAdmin === 'boolean' ? isAdmin : !user.isAdmin;
    res.json({ success: true, user });
  } else {
    const newUser = {
      uid,
      name: 'Usuário do Sistema',
      email: `${uid}@user.local`,
      isAdmin: typeof isAdmin === 'boolean' ? isAdmin : true,
      isTeacher: false,
      isBanned: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    DATA_CACHE.users.unshift(newUser);
    res.json({ success: true, user: newUser });
  }
});

// Toggle Ban status
app.put('/api/admin/users/:uid/toggle-ban', requireBurocrata, (req: Request, res: Response) => {
  const { uid } = req.params;
  const { isBanned, banReason } = req.body || {};
  const user = DATA_CACHE.users.find((u) => u.uid === uid);
  if (user) {
    user.isBanned = typeof isBanned === 'boolean' ? isBanned : !user.isBanned;
    if (user.isBanned) {
      (user as any).banReason = clampString(banReason, 300) || 'Violação das Políticas do Portal';
    } else {
      delete (user as any).banReason;
    }
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

// Toggle Teacher / Docente role
app.put('/api/admin/users/:uid/toggle-teacher', requireBurocrata, (req: Request, res: Response) => {
  const { uid } = req.params;
  const { isTeacher } = req.body || {};
  const user = DATA_CACHE.users.find((u) => u.uid === uid);
  if (user) {
    user.isTeacher = typeof isTeacher === 'boolean' ? isTeacher : !user.isTeacher;
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

// Delete user record
app.delete('/api/admin/users/:uid', requireBurocrata, (req: Request, res: Response) => {
  const { uid } = req.params;
  const index = DATA_CACHE.users.findIndex((u) => u.uid === uid);
  if (index !== -1) {
    DATA_CACHE.users.splice(index, 1);
    res.json({ success: true, message: 'Usuário excluído com sucesso.' });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

// Delete article administratively
app.delete('/api/admin/articles/:id', requireBurocrata, (req: Request, res: Response) => {
  const { id } = req.params;
  DATA_CACHE.customArticles = DATA_CACHE.customArticles.filter((a) => a.id !== id);
  if (id.startsWith('news_')) {
    const idx = parseInt(id.replace('news_', ''), 10) - 1;
    if (idx >= 0 && idx < DATA_CACHE.noticias.length) {
      DATA_CACHE.noticias.splice(idx, 1);
    }
  }
  res.json({ success: true, message: `Artigo ${id} removido pelo Burocrata.` });
});

// Update / Delete ticket status (Burocrata only)
app.put('/api/tickets/:id', requireBurocrata, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowedStatuses = new Set(['Aberto', 'Em Análise', 'Resolvido', 'Concluído', 'Indeferido']);
  if (status && !allowedStatuses.has(status)) {
    res.status(400).json({ error: 'Status de ticket inválido.' });
    return;
  }
  const ticket = DATA_CACHE.tickets.find((t) => t.id === id);
  if (ticket) {
    ticket.status = status || 'Concluído';
    res.json({ success: true, ticket });
  } else {
    res.status(404).json({ error: 'Ticket não encontrado.' });
  }
});

app.delete('/api/tickets/:id', requireBurocrata, (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = DATA_CACHE.tickets.length;
  DATA_CACHE.tickets = DATA_CACHE.tickets.filter((t) => t.id !== id);
  if (DATA_CACHE.tickets.length < initialLen) {
    res.json({ success: true, message: 'Ticket removido.' });
  } else {
    res.status(404).json({ error: 'Ticket não encontrado.' });
  }
});

// Add / Delete sanctioned city
app.post('/api/admin/sanctions', requireBurocrata, (req: Request, res: Response) => {
  const cidade = clampString(req.body?.cidade, 120);
  const moderador = clampString(req.body?.moderador, 120);
  if (!cidade || !moderador) {
    res.status(400).json({ error: 'Cidade e moderador são obrigatórios.' });
    return;
  }
  DATA_CACHE.cidadesSancionadas.cidades_sancionadas.unshift({ cidade, moderador });
  res.status(201).json({ success: true, data: DATA_CACHE.cidadesSancionadas });
});

app.delete('/api/admin/sanctions/:index', requireBurocrata, (req: Request, res: Response) => {
  const idx = parseInt(req.params.index, 10);
  if (!isNaN(idx) && idx >= 0 && idx < DATA_CACHE.cidadesSancionadas.cidades_sancionadas.length) {
    DATA_CACHE.cidadesSancionadas.cidades_sancionadas.splice(idx, 1);
    res.json({ success: true, data: DATA_CACHE.cidadesSancionadas });
  } else {
    res.status(400).json({ error: 'Índice inválido.' });
  }
});

// Elevate account strictly via verified Firebase ID token + optional env-configured secret (NO hardcoded passkeys)
app.post('/api/admin/elevate', elevateLimiter, requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  if (!isVerifiedBurocrata(authUser)) {
    res.status(403).json({
      error: 'Acesso negado: Somente o Burocrata oficial verificado pode ativar privilégios administrativos.'
    });
    return;
  }

  const secretCheck = verifyElevationSecret(req.body?.passkey);
  if (!secretCheck.configured) {
    res.status(503).json({
      error:
        'Chave alternativa não configurada no servidor (BUROCRATA_ELEVATION_SECRET). Utilize o botão oficial "Entrar com Conta Google".'
    });
    return;
  }
  if (!secretCheck.valid) {
    res.status(401).json({ error: 'Chave de segurança de Burocrata incorreta.' });
    return;
  }

  const existing = DATA_CACHE.users.find((u) => u.uid === authUser.uid || u.email === authUser.email);
  if (existing) {
    existing.isAdmin = true;
    existing.lastLoginAt = new Date().toISOString();
  } else {
    DATA_CACHE.users.unshift({
      uid: authUser.uid,
      name: authUser.name || 'Burocrata Autorizado',
      email: authUser.email,
      isAdmin: true,
      isTeacher: true,
      isBanned: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    uid: authUser.uid,
    email: authUser.email,
    message: 'Acesso de Burocrata concedido com sucesso.',
    isAdmin: true
  });
});

// ============================================
// ADMIN TOOLS SUITE APIS (24 FERRAMENTAS)
// ============================================

// 1. Costs API
app.get('/api/admin/costs', requireBurocrata, (_req: Request, res: Response) => {
  res.json({ success: true, costs: DATA_CACHE.costs });
});

app.post('/api/admin/costs', requireBurocrata, (req: Request, res: Response) => {
  const { descricao, categoria, valor, data, comprovanteUrl, responsavel, status } = req.body || {};
  const cleanDesc = clampString(descricao, 250);
  const numVal = Number(valor);
  if (!cleanDesc || Number.isNaN(numVal) || numVal < 0) {
    res.status(400).json({ error: 'Descrição e valor numérico válido são obrigatórios.' });
    return;
  }
  if (comprovanteUrl && !isSafeHttpUrl(comprovanteUrl)) {
    res.status(400).json({ error: 'URL de comprovante inválida.' });
    return;
  }
  const newCost = {
    id: `cst-${Date.now().toString().slice(-4)}`,
    descricao: cleanDesc,
    categoria: clampString(categoria, 80) || 'Infraestrutura',
    valor: numVal,
    data: clampString(data, 30) || new Date().toISOString().split('T')[0],
    comprovanteUrl: comprovanteUrl ? String(comprovanteUrl).trim() : '',
    responsavel: clampString(responsavel, 100) || 'Burocrata',
    status: clampString(status, 40) || 'Pago'
  };
  DATA_CACHE.costs.unshift(newCost);
  res.status(201).json({ success: true, cost: newCost });
});

app.delete('/api/admin/costs/:id', requireBurocrata, (req: Request, res: Response) => {
  const { id } = req.params;
  DATA_CACHE.costs = DATA_CACHE.costs.filter((c) => c.id !== id);
  res.json({ success: true, message: `Custo ${id} removido com sucesso.` });
});

// 2. Redirects API (protected + strict http/https URL validation)
app.get('/api/admin/redirects', requireBurocrata, (_req: Request, res: Response) => {
  res.json({ success: true, redirects: DATA_CACHE.redirects });
});

app.post('/api/admin/redirects', requireBurocrata, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { slug, urlDestino, titulo, comAviso } = req.body || {};
  const cleanSlug = typeof slug === 'string' ? slug.replace(/^\/+/, '').toLowerCase().trim() : '';
  if (!cleanSlug || !/^[a-z0-9_-]{1,64}$/.test(cleanSlug)) {
    res.status(400).json({ error: 'Slug inválido (use apenas letras, números, hífen ou underscore, até 64 chars).' });
    return;
  }
  if (!isSafeHttpUrl(urlDestino)) {
    res.status(400).json({ error: 'URL de destino inválida (apenas protocolos http:// ou https:// são permitidos).' });
    return;
  }
  const newRedirect = {
    id: `red-${Date.now().toString().slice(-4)}`,
    slug: cleanSlug,
    urlDestino: String(urlDestino).trim(),
    titulo: clampString(titulo, 150) || cleanSlug,
    comAviso: Boolean(comAviso),
    totalCliques: 0,
    criadoEm: new Date().toISOString().split('T')[0],
    criadoPor: authUser.email,
    ativo: true
  };
  DATA_CACHE.redirects.unshift(newRedirect);
  res.status(201).json({ success: true, redirect: newRedirect });
});

app.delete('/api/admin/redirects/:id', requireBurocrata, (req: Request, res: Response) => {
  const { id } = req.params;
  DATA_CACHE.redirects = DATA_CACHE.redirects.filter((r) => r.id !== id);
  res.json({ success: true, message: `Redirecionador ${id} excluído.` });
});

// Outbound redirect execution route: /r/:slug (XSS-safe HTML escaping + strict URL validation)
app.get('/r/:slug', (req: Request, res: Response) => {
  const slug = String(req.params.slug || '').toLowerCase().trim();
  const safeSlugDisplay = escapeHtml(slug.slice(0, 64));
  const redirect = DATA_CACHE.redirects.find((r) => r.slug === slug && r.ativo);
  if (!redirect || !isSafeHttpUrl(redirect.urlDestino)) {
    res.status(404).send(`
      <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Redirecionamento não encontrado</title></head><body style="font-family: monospace; padding: 2rem; background: #0f0f12; color: #fff;">
        <h2>[WZZM] Redirecionamento não encontrado</h2>
        <p>O slug solicitado "/r/${safeSlugDisplay}" não está registrado ou foi desativado.</p>
        <a href="/" style="color: #f59e0b;">← Voltar ao Portal</a>
      </body></html>
    `);
    return;
  }
  const safeDestHtml = escapeHtml(redirect.urlDestino);
  redirect.totalCliques += 1;
  if (redirect.comAviso) {
    res.send(`
      <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Aviso de Redirecionamento - WZZM</title></head>
      <body style="font-family: sans-serif; background: #f4f3f0; color: #141414; padding: 2rem; max-width: 600px; margin: 40px auto; border: 4px solid #141414; box-shadow: 8px 8px 0px #b91c1c;">
        <h2 style="font-family: serif; color: #b91c1c; text-transform: uppercase;">Aviso de Segurança — Link Externo</h2>
        <p>Você está prestes a sair do ambiente seguro da WazzimaGiygg para acessar:</p>
        <div style="background: #e5e5e5; padding: 10px; font-family: monospace; word-break: break-all; margin: 15px 0;">${safeDestHtml}</div>
        <p style="font-size: 13px; color: #666;">A WZZM não se responsabiliza pelo conteúdo de sites externos.</p>
        <div style="margin-top: 20px;">
          <a href="${safeDestHtml}" rel="noopener noreferrer" style="background: #141414; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold; font-family: monospace; display: inline-block;">PROSSEGUIR PARA O SITE ➔</a>
          <a href="/" style="margin-left: 15px; color: #666; font-size: 13px;">Cancelar e voltar</a>
        </div>
      </body></html>
    `);
    return;
  }
  res.redirect(redirect.urlDestino);
});

// 3. Forum Topics API (gerenciarforum)
app.get('/api/admin/forum', requireBurocrata, (_req: Request, res: Response) => {
  res.json({ success: true, topics: DATA_CACHE.forumTopics });
});

app.post('/api/admin/forum', requireBurocrata, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const titulo = clampString(req.body?.titulo, 200);
  if (!titulo) {
    res.status(400).json({ error: 'Título do tópico é obrigatório.' });
    return;
  }
  const newTopic = {
    id: `top-${Date.now().toString().slice(-4)}`,
    titulo,
    categoria: clampString(req.body?.categoria, 80) || 'Geral',
    autor: clampString(req.body?.autor, 100) || 'Burocrata-Chefe',
    autorEmail: authUser.email,
    respostas: 0,
    fixado: false,
    fechado: false,
    denunciado: false,
    dataCriacao: new Date().toISOString().split('T')[0]
  };
  DATA_CACHE.forumTopics.unshift(newTopic);
  res.status(201).json({ success: true, topic: newTopic });
});

app.put('/api/admin/forum/:id/toggle', requireBurocrata, (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body || {};
  const topic = DATA_CACHE.forumTopics.find((t) => t.id === id);
  if (!topic) {
    res.status(404).json({ error: 'Tópico não encontrado.' });
    return;
  }
  if (action === 'pin') topic.fixado = !topic.fixado;
  if (action === 'lock') topic.fechado = !topic.fechado;
  if (action === 'dismiss_report') topic.denunciado = false;
  res.json({ success: true, topic });
});

app.delete('/api/admin/forum/:id', requireBurocrata, (req: Request, res: Response) => {
  const { id } = req.params;
  DATA_CACHE.forumTopics = DATA_CACHE.forumTopics.filter((t) => t.id !== id);
  res.json({ success: true, message: `Tópico ${id} excluído com sucesso.` });
});

// 4. Surveys and Reports API (pesquisas)
app.get('/api/admin/surveys', requireBurocrata, (_req: Request, res: Response) => {
  res.json({ success: true, surveys: DATA_CACHE.surveys });
});

app.post('/api/admin/surveys', requireBurocrata, (req: Request, res: Response) => {
  const titulo = clampString(req.body?.titulo, 200);
  if (!titulo) {
    res.status(400).json({ error: 'Título é obrigatório.' });
    return;
  }
  const newSurvey = {
    id: `surv-${Date.now().toString().slice(-4)}`,
    titulo,
    tipo: clampString(req.body?.tipo, 80) || 'Pesquisa Acadêmica',
    descricao: clampString(req.body?.descricao, 2000),
    respostasOuStatus: 'Recém criada • Em andamento',
    data: new Date().toISOString().split('T')[0],
    prioridade: clampString(req.body?.prioridade, 40) || 'Média'
  };
  DATA_CACHE.surveys.unshift(newSurvey);
  res.status(201).json({ success: true, survey: newSurvey });
});

// 5. Blog Posts API (blog/admin)
app.get('/api/admin/blog', requireBurocrata, (_req: Request, res: Response) => {
  res.json({ success: true, posts: DATA_CACHE.blogPosts });
});

app.post('/api/admin/blog', requireBurocrata, (req: Request, res: Response) => {
  const titulo = clampString(req.body?.titulo, 200);
  const conteudo = clampString(req.body?.conteudo, 20000);
  if (!titulo || !conteudo) {
    res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    return;
  }
  const newPost = {
    id: `blog-${Date.now().toString().slice(-4)}`,
    titulo,
    resumo: clampString(req.body?.resumo, 400),
    conteudo,
    autor: 'Gabinete do Burocrata',
    data: new Date().toISOString().split('T')[0],
    publicado: true,
    tags: Array.isArray(req.body?.tags)
      ? req.body.tags.slice(0, 10).map((t: any) => clampString(t, 40)).filter(Boolean)
      : ['Editorial', 'Burocrata']
  };
  DATA_CACHE.blogPosts.unshift(newPost);
  res.status(201).json({ success: true, post: newPost });
});

// 6. Pages Directory Sitemap API (buscadelistadepaginas)
app.get('/api/admin/pages', requireBurocrata, (_req: Request, res: Response) => {
  res.json({
    success: true,
    pages: [
      { url: '/', titulo: 'Portal Principal — Edição Digital WazzimaGiygg', setor: 'Geral', tipo: 'Página Pública', status: 'Ativo' },
      { url: '/admin/login.html', titulo: 'Autenticação Google do Burocrata', setor: 'Administração', tipo: 'Módulo Administrativo', status: 'Restrito Burocrata' },
      { url: '/admin/ferramentasadministrativas.html', titulo: 'Menu de 24 Ferramentas Administrativas', setor: 'Administração', tipo: 'Módulo Administrativo', status: 'Restrito Burocrata' },
      { url: '/api/articles', titulo: 'API Catálogo Global de Artigos', setor: 'API', tipo: 'API REST', status: 'Ativo' },
      { url: '/api/news', titulo: 'API Notícias do Diário Oficial', setor: 'API', tipo: 'API REST', status: 'Ativo' },
      { url: '/api/tickets', titulo: 'API Tickets e Ouvidoria LGPD', setor: 'Ouvidoria', tipo: 'API REST', status: 'Restrito Autenticado' },
      { url: '/api/sanctions', titulo: 'API Tabela de Cidades Sancionadas', setor: 'Forense', tipo: 'API REST', status: 'Ativo' },
      { url: '/api/health', titulo: 'API Diagnóstico de Conexão Firestore', setor: 'Infraestrutura', tipo: 'API REST', status: 'Ativo' },
      { url: '/colecoes/wikiworldweb', titulo: 'Coleção WikiWorldWeb', setor: 'Acervo', tipo: 'Página Pública', status: 'Ativo' },
      { url: '/colecoes/materiadeensaio', titulo: 'Coleção Matéria de Ensaio', setor: 'Acervo', tipo: 'Página Pública', status: 'Ativo' },
      { url: '/colecoes/academico', titulo: 'Coleção Acadêmico', setor: 'Acervo', tipo: 'Página Pública', status: 'Ativo' },
      { url: '/colecoes/materia', titulo: 'Coleção Matérias Didáticas', setor: 'Acervo', tipo: 'Página Pública', status: 'Ativo' },
      { url: '/colecoes/uwgbooks', titulo: 'Coleção UWG Books', setor: 'Acervo', tipo: 'Página Pública', status: 'Ativo' },
      { url: '/admin/admintools/solicitacaodeexlusao/', titulo: 'Painel LGPD — Solicitação de Exclusão de Dados', setor: 'Administração', tipo: 'Módulo Administrativo', status: 'Restrito Burocrata' }
    ]
  });
});

// 7. LGPD Deletion Requests API (solicitacaodeexlusao) — strictly Burocrata-only
app.get('/api/admin/deletion-requests', requireBurocrata, (_req: Request, res: Response) => {
  res.json({ success: true, requests: DATA_CACHE.deletionRequests });
});

app.put('/api/admin/deletion-requests/:id', requireBurocrata, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { id } = req.params;
  const { status, rejectionReason, certificateId } = req.body || {};
  const allowed = new Set(['pending', 'processing', 'completed', 'rejected']);
  if (status && !allowed.has(status)) {
    res.status(400).json({ error: 'Status de solicitação LGPD inválido.' });
    return;
  }

  const item = (DATA_CACHE.deletionRequests as ServerDeletionRequest[]).find((r) => r.id === id);
  if (!item) {
    res.status(404).json({ error: 'Solicitação não encontrada.' });
    return;
  }
  item.status = status || item.status;
  item.processedBy = authUser.email;
  if (status === 'completed') {
    item.completedAt = new Date().toISOString();
    item.certificateId = clampString(certificateId, 64) || `LGPD-CERT-${Date.now().toString().slice(-6)}`;
  } else if (status === 'rejected') {
    item.rejectedAt = new Date().toISOString();
    item.rejectionReason =
      clampString(rejectionReason, 1000) ||
      'Fundamentação legal da guarda obrigatória (Marco Civil Art. 15).';
  }
  res.json({ success: true, request: item });
});

// Route handler for LGPD Solicitacao de Exclusao (HTML Standalone)
app.get([
  '/admin/admintools/solicitacaodeexlusao',
  '/admin/admintools/solicitacaodeexlusao/*',
  '/admintools/solicitacaodeexlusao*',
  '/solicitacaodeexlusao*'
], (_req: Request, res: Response) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const filePath = path.resolve(__dirname, 'public/admin/admintools/solicitacaodeexlusao/index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
    return;
  }
  res.redirect('/admin/ferramentasadministrativas.html');
});

// Legacy route compatibility handlers for other admin pages
app.get([
  '/admin/detalhes_cliente*',
  '/admin/administrarcustos*',
  '/admin/listadecustosavancada*',
  '/admin/htmlcreator*',
  '/admin/redirecionador*',
  '/admin/admintools/*',
  '/admin/checkuser/*',
  '/admin/wiki/*'
], (_req: Request, res: Response) => {
  res.redirect('/admin/ferramentasadministrativas.html');
});

// ============================================
// NOTMEDIAWIKI (notmediawiki.wazzimagiygg.com)
// REST API GATEWAY & MICROSERVICES
// ============================================
const WIKI_STORE = {
  articles: [...SEED_WIKI_ARTICLES] as WikiArticle[],
  userPages: [] as WikiArticle[],
  revisions: [...SEED_WIKI_REVISIONS] as WikiRevision[],
  events: [...SEED_WIKI_EVENTS] as WikiEvent[],
  extensions: [...SEED_WIKI_EXTENSIONS]
};

// 0. Wiki-Site Version Manifest (Special:Version API)
app.get(['/api/version', '/api/v1/version'], (_req: Request, res: Response) => {
  res.json(
    getWikiSiteVersionManifest({
      extensionsCount: WIKI_STORE.extensions.length,
      articlesCount: buildArticlesList('all').length + WIKI_STORE.articles.length + WIKI_STORE.userPages.length,
      revisionsCount: WIKI_STORE.revisions.length,
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
    })
  );
});

// 1. Content Service
app.get('/api/v1/content/articles', (req: Request, res: Response) => {
  const ns = req.query.namespace !== undefined ? parseInt(req.query.namespace as string, 10) : undefined;
  const includeUserPages = req.query.includeUserPages === 'true';
  if (ns === 2) {
    res.json({ articles: WIKI_STORE.userPages });
    return;
  }
  const pool = includeUserPages ? [...WIKI_STORE.articles, ...WIKI_STORE.userPages] : WIKI_STORE.articles;
  const filtered = ns !== undefined ? pool.filter((a) => a.namespace === ns) : pool;
  res.json({ articles: filtered });
});

function sanitizePublicUserPage(page: WikiArticle, authUser?: VerifiedAuthUser): WikiArticle {
  if (isVerifiedBurocrata(authUser) || (authUser && authUser.uid === page.ownerUid)) {
    return page;
  }
  const { ownerEmail: _omitted, ...safePage } = page;
  return safePage;
}

// 1.1 NotMediaWiki Personal User Pages (Namespace 2) & First-Login Provisioning
app.get('/api/v1/userpages', optionalAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser;
  res.json({
    userPages: WIKI_STORE.userPages.map((p) => sanitizePublicUserPage(p, authUser))
  });
});

app.get('/api/v1/userpages/:uid', optionalAuth, (req: Request, res: Response) => {
  const { uid } = req.params;
  const authUser = (req as AuthenticatedRequest).authUser;
  const found = WIKI_STORE.userPages.find((p) => p.ownerUid === uid);
  if (!found) {
    res.status(404).json({ error: 'Página pessoal de usuário não encontrada' });
    return;
  }
  res.json({ userPage: sanitizePublicUserPage(found, authUser) });
});

app.post('/api/v1/userpages/ensure', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { uid, name, displayName, profilePictureUrl, photoURL, isTeacher } = req.body || {};
  const targetUid = typeof uid === 'string' && uid.trim() ? uid.trim() : authUser.uid;
  if (!isValidId(targetUid)) {
    res.status(400).json({ error: 'UID do usuário inválido.' });
    return;
  }
  if (targetUid !== authUser.uid && !isVerifiedBurocrata(authUser)) {
    res.status(403).json({ error: 'Acesso negado: não é permitido provisionar página para outro usuário.' });
    return;
  }

  const existingIdx = WIKI_STORE.userPages.findIndex((p) => p.ownerUid === targetUid);
  const resolvedName = resolveUserDisplayName({
    uid: targetUid,
    name: clampString(name, 120),
    displayName: clampString(displayName, 120) || authUser.name,
    email: authUser.email,
  });
  const nowIso = new Date().toISOString();

  if (existingIdx >= 0) {
    const existing = WIKI_STORE.userPages[existingIdx];
    const updated: WikiArticle = {
      ...existing,
      updatedAt: nowIso,
    };
    WIKI_STORE.userPages[existingIdx] = updated;
    res.json({ userPage: updated, isFirstLogin: false });
    return;
  }

  const dbUser = DATA_CACHE.users.find((u) => u.uid === targetUid);
  const verifiedAdminFlag = targetUid === authUser.uid ? isVerifiedBurocrata(authUser) : Boolean(dbUser?.isAdmin);
  const verifiedTeacherFlag = isVerifiedBurocrata(authUser) ? Boolean(isTeacher || dbUser?.isTeacher) : Boolean(dbUser?.isTeacher);
  const safeAvatar = isSafeHttpUrl(profilePictureUrl || photoURL) ? String(profilePictureUrl || photoURL).trim() : '';

  const slug = buildPersonalUserPageSlug(resolvedName, targetUid);
  const title = buildPersonalUserPageTitle(resolvedName, targetUid);
  const wikitext = buildPersonalUserPageWikitext(
    {
      uid: targetUid,
      name: resolvedName,
      displayName: resolvedName,
      email: '',
      profilePictureUrl: safeAvatar,
      isAdmin: verifiedAdminFlag,
      isTeacher: verifiedTeacherFlag,
      isGuest: false,
      firstLoginAt: nowIso,
      lastLoginAt: nowIso,
    },
    { contributionsCount: 1, pagesCreated: 1, lastEditAt: nowIso }
  );

  const revId = `rev-user-init-${Date.now().toString(36)}`;
  const newPage: WikiArticle = {
    id: `userpage-${targetUid}`,
    slug,
    title,
    namespace: 2,
    wikitext,
    summary: `Página pessoal de ${resolvedName} no NotMediaWiki (provisionada no primeiro login).`,
    latestRevisionId: revId,
    createdAt: nowIso,
    updatedAt: nowIso,
    categories: ['Usuários', 'NotMediaWiki'],
    views: 1,
    ownerUid: targetUid,
    ownerEmail: authUser.uid === targetUid ? authUser.email : undefined,
    isPersonalUserPage: true,
  };

  WIKI_STORE.userPages.unshift(newPage);

  const initRev: WikiRevision = {
    id: revId,
    articleSlug: slug,
    parentRevisionId: null,
    wikitext,
    comment: `Criação automática da página pessoal ${title} e Infobox Usuário no primeiro login`,
    author: {
      id: targetUid,
      name: resolvedName,
      isBot: false,
    },
    timestamp: nowIso,
    sha256: computeSha256Hex(wikitext),
    byteSize: wikitext.length,
    isMinor: false,
  };
  WIKI_STORE.revisions.unshift(initRev);

  WIKI_STORE.events.unshift({
    id: `evt-user-${Date.now()}`,
    meta: {
      uri: `https://notmediawiki.wazzimagiygg.com/wiki/${encodeURIComponent(slug)}`,
      request_id: `req-usr-${Date.now()}`,
      id: `uuid-usr-${Date.now()}`,
      dt: nowIso,
      domain: 'notmediawiki.wazzimagiygg.com',
      stream: 'mediawiki.recentchange',
    },
    database: 'wzzmwiki',
    page_title: title,
    page_namespace: 2,
    rev_id: revId,
    rev_timestamp: nowIso,
    rev_sha1: initRev.sha256,
    rev_minor_edit: false,
    rev_len: wikitext.length,
    user_text: resolvedName,
    comment: initRev.comment,
    type: 'new',
    timestamp: nowIso,
  });

  res.status(201).json({ userPage: newPage, revision: initRev, isFirstLogin: true });
});

app.put('/api/v1/userpages/:uid', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { uid } = req.params;
  if (!isValidId(uid)) {
    res.status(400).json({ error: 'UID de usuário inválido.' });
    return;
  }

  if (authUser.uid !== uid && !isVerifiedBurocrata(authUser)) {
    res.status(403).json({ error: 'Apenas o titular da conta ou o Burocrata podem editar esta página pessoal.' });
    return;
  }

  const { title, wikitext, summary, isMinor, authorName } = req.body || {};
  if (!wikitext || typeof wikitext !== 'string' || wikitext.length > 200_000) {
    res.status(400).json({ error: 'Wikitexto válido (até 200 KB) é obrigatório para atualizar a página pessoal.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const idx = WIKI_STORE.userPages.findIndex((p) => p.ownerUid === uid);
  const revId = `rev-usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const existing = idx >= 0 ? WIKI_STORE.userPages[idx] : null;
  const cleanAuthor = clampString(authorName || authUser.name || '', 120);
  const resolvedTitle = (clampString(title, 200) || existing?.title || buildPersonalUserPageTitle(cleanAuthor, uid)).trim();
  const resolvedSlug = existing?.slug || buildPersonalUserPageSlug(resolvedTitle.replace(/^Usuário:/i, ''), uid);

  const savedPage: WikiArticle = {
    id: existing?.id || `userpage-${uid}`,
    slug: resolvedSlug,
    title: resolvedTitle,
    namespace: 2,
    wikitext,
    summary: clampString(summary, 500) || existing?.summary || `Página pessoal de ${cleanAuthor || uid}`,
    latestRevisionId: revId,
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
    categories: existing?.categories || ['Usuários', 'NotMediaWiki'],
    views: (existing?.views || 0) + 1,
    ownerUid: uid,
    ownerEmail: existing?.ownerEmail || (authUser.uid === uid ? authUser.email : undefined),
    isPersonalUserPage: true,
  };

  if (idx >= 0) {
    WIKI_STORE.userPages[idx] = savedPage;
  } else {
    WIKI_STORE.userPages.unshift(savedPage);
  }

  const newRev: WikiRevision = {
    id: revId,
    articleSlug: resolvedSlug,
    parentRevisionId: existing?.latestRevisionId || null,
    wikitext,
    comment: clampString(summary, 500) || 'Atualização da página pessoal e Infobox Usuário',
    author: {
      id: authUser.uid,
      name: cleanAuthor || resolvedTitle.replace(/^Usuário:/i, ''),
      isBot: false,
    },
    timestamp: nowIso,
    sha256: computeSha256Hex(wikitext),
    byteSize: wikitext.length,
    isMinor: Boolean(isMinor),
  };
  WIKI_STORE.revisions.unshift(newRev);

  WIKI_STORE.events.unshift({
    id: `evt-usr-${Date.now()}`,
    meta: {
      uri: `https://notmediawiki.wazzimagiygg.com/wiki/${encodeURIComponent(resolvedSlug)}`,
      request_id: `req-usr-${Date.now()}`,
      id: `uuid-usr-${Date.now()}`,
      dt: nowIso,
      domain: 'notmediawiki.wazzimagiygg.com',
      stream: 'mediawiki.recentchange',
    },
    database: 'wzzmwiki',
    page_title: resolvedTitle,
    page_namespace: 2,
    rev_id: revId,
    rev_timestamp: nowIso,
    rev_sha1: newRev.sha256,
    rev_minor_edit: Boolean(isMinor),
    rev_len: wikitext.length,
    user_text: newRev.author.name,
    comment: newRev.comment,
    type: existing ? 'edit' : 'new',
    timestamp: nowIso,
  });

  res.json({ success: true, userPage: savedPage, revision: newRev });
});

app.get(['/api/v1/content/random', '/api/v1/content/articles/special/random'], (req: Request, res: Response) => {
  const currentSlug = req.query.current as string | undefined;
  const pool = currentSlug
    ? WIKI_STORE.articles.filter((a) => a.slug.toLowerCase() !== currentSlug.toLowerCase())
    : WIKI_STORE.articles;
  const candidates = pool.length > 0 ? pool : WIKI_STORE.articles;
  if (candidates.length === 0) {
    res.status(404).json({ error: 'Nenhum artigo cadastrado no banco de dados' });
    return;
  }
  const random = candidates[Math.floor(Math.random() * candidates.length)];
  res.json({ article: random });
});

app.delete('/api/v1/content/articles/:slug', requirePublisher, (req: Request, res: Response) => {
  const { slug } = req.params;
  const initialLen = WIKI_STORE.articles.length;
  WIKI_STORE.articles = WIKI_STORE.articles.filter((a) => a.slug.toLowerCase() !== slug.toLowerCase());
  WIKI_STORE.revisions = WIKI_STORE.revisions.filter((r) => r.articleSlug.toLowerCase() !== slug.toLowerCase());
  res.json({ success: true, deleted: WIKI_STORE.articles.length < initialLen });
});

app.get('/api/v1/content/articles/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const article = WIKI_STORE.articles.find((a) => a.slug.toLowerCase() === slug.toLowerCase());
  if (!article) {
    res.status(404).json({ error: 'Artigo não encontrado no NotMediaWiki' });
    return;
  }
  article.views += 1;
  res.json({ article });
});

app.get('/api/v1/content/articles/:slug/rendered', (req: Request, res: Response) => {
  const { slug } = req.params;
  const article = WIKI_STORE.articles.find((a) => a.slug.toLowerCase() === slug.toLowerCase());
  if (!article) {
    res.status(404).json({ error: 'Artigo não encontrado' });
    return;
  }
  article.views += 1;
  const parsed = parseWikitextToHtml(article.wikitext, article.title);
  res.json({
    article,
    html: parsed.html,
    toc: parsed.toc,
    categories: parsed.categories,
    references: parsed.references,
    parseTimeMs: parsed.parseTimeMs
  });
});

app.post('/api/v1/content/articles', requirePublisher, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { title, wikitext, summary, isMinor, authorName } = req.body || {};
  const cleanTitle = clampString(title, 300);
  if (!cleanTitle || typeof wikitext !== 'string' || !wikitext.trim() || wikitext.length > 250_000) {
    res.status(400).json({ error: 'Título e wikitexto válidos são obrigatórios' });
    return;
  }
  const slug = cleanTitle.replace(/\s+/g, '_');
  const revId = `rev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const author = {
    id: authUser.uid,
    name: clampString(authorName || authUser.name || '', 100) || 'Publicador Autorizado',
    isBot: false
  };

  const newRev: WikiRevision = {
    id: revId,
    articleSlug: slug,
    parentRevisionId: null,
    wikitext,
    comment: clampString(summary, 500) || 'Edição via NotMediaWiki API',
    author,
    timestamp: new Date().toISOString(),
    sha256: computeSha256Hex(wikitext),
    byteSize: wikitext.length,
    isMinor: !!isMinor
  };

  const existingIdx = WIKI_STORE.articles.findIndex((a) => a.slug.toLowerCase() === slug.toLowerCase());
  let savedArt: WikiArticle;
  if (existingIdx >= 0) {
    newRev.parentRevisionId = WIKI_STORE.articles[existingIdx].latestRevisionId;
    WIKI_STORE.articles[existingIdx] = {
      ...WIKI_STORE.articles[existingIdx],
      title: cleanTitle,
      wikitext,
      latestRevisionId: revId,
      updatedAt: new Date().toISOString(),
      views: WIKI_STORE.articles[existingIdx].views + 1
    };
    savedArt = WIKI_STORE.articles[existingIdx];
  } else {
    savedArt = {
      id: `art-${Date.now()}`,
      slug,
      title: cleanTitle,
      namespace: 0,
      wikitext,
      summary: wikitext.substring(0, 150) + '...',
      latestRevisionId: revId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categories: ['Geral'],
      views: 1
    };
    WIKI_STORE.articles.unshift(savedArt);
  }

  WIKI_STORE.revisions.unshift(newRev);

  // EventStream emission
  WIKI_STORE.events.unshift({
    id: `evt-${Date.now()}`,
    meta: {
      uri: `https://notmediawiki.wazzimagiygg.com/wiki/${slug}`,
      request_id: `req-${Date.now()}`,
      id: `uuid-${Date.now()}`,
      dt: new Date().toISOString(),
      domain: 'notmediawiki.wazzimagiygg.com',
      stream: 'mediawiki.recentchange'
    },
    database: 'wzzmwiki',
    page_title: cleanTitle,
    page_namespace: 0,
    rev_id: revId,
    rev_timestamp: new Date().toISOString(),
    rev_sha1: newRev.sha256,
    rev_minor_edit: !!isMinor,
    rev_len: wikitext.length,
    user_text: author.name,
    comment: clampString(summary, 500) || 'Edição no acervo',
    type: existingIdx >= 0 ? 'edit' : 'new'
  });

  res.status(existingIdx >= 0 ? 200 : 201).json({ success: true, article: savedArt, revision: newRev });
});

app.get('/api/v1/content/stats', (_req: Request, res: Response) => {
  res.json({
    totalArticles: WIKI_STORE.articles.length,
    totalRevisions: WIKI_STORE.revisions.length,
    totalViews: WIKI_STORE.articles.reduce((a, b) => a + b.views, 0),
    activeExtensions: WIKI_STORE.extensions.length
  });
});

// 2. Parsoid AST Parser Service
app.post('/api/v1/parsoid/parse', (req: Request, res: Response) => {
  const { wikitext, title } = req.body;
  if (typeof wikitext !== 'string') {
    res.status(400).json({ error: 'Campo wikitext é obrigatório' });
    return;
  }
  const result = parseWikitextToHtml(wikitext, title || 'Página');
  res.json({
    html: result.html,
    toc: result.toc,
    categories: result.categories,
    references: result.references,
    parseTimeMs: result.parseTimeMs
  });
});

// 3. Revisions Service & Diff
app.get('/api/v1/revisions/article/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const revs = WIKI_STORE.revisions
    .filter((r) => r.articleSlug.toLowerCase() === slug.toLowerCase())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({ revisions: revs });
});

app.get('/api/v1/revisions/diff/:fromRevId/:toRevId', (req: Request, res: Response) => {
  const { fromRevId, toRevId } = req.params;
  const oldRev = WIKI_STORE.revisions.find((r) => r.id === fromRevId);
  const newRev = WIKI_STORE.revisions.find((r) => r.id === toRevId);
  if (!oldRev || !newRev) {
    res.status(404).json({ error: 'Uma ou ambas as revisões não foram encontradas' });
    return;
  }
  const diff = computeWikitextDiff(oldRev.wikitext, newRev.wikitext, fromRevId, toRevId);
  res.json({ diff });
});

app.post('/api/v1/revisions/:slug/rollback', requirePublisher, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { slug } = req.params;
  const { revIdToRestore, authorName } = req.body || {};
  const targetRev = WIKI_STORE.revisions.find((r) => r.id === revIdToRestore);
  const article = WIKI_STORE.articles.find((a) => a.slug.toLowerCase() === slug.toLowerCase());
  if (!targetRev || !article) {
    res.status(404).json({ error: 'Revisão ou artigo não encontrado' });
    return;
  }
  const newRevId = `rev-rb-${Date.now().toString(36)}`;
  const rollbackRev: WikiRevision = {
    id: newRevId,
    articleSlug: article.slug,
    parentRevisionId: article.latestRevisionId,
    wikitext: targetRev.wikitext,
    comment: `Rollback para revisão ${targetRev.id} de ${targetRev.author.name}`,
    author: { id: authUser.uid, name: clampString(authorName || authUser.name || '', 100) || 'Publicador WZZM', isBot: false },
    timestamp: new Date().toISOString(),
    sha256: targetRev.sha256,
    byteSize: targetRev.wikitext.length,
    isMinor: true
  };
  article.wikitext = targetRev.wikitext;
  article.latestRevisionId = newRevId;
  article.updatedAt = new Date().toISOString();
  WIKI_STORE.revisions.unshift(rollbackRev);
  res.json({ success: true, article, revision: rollbackRev });
});

// 4. EventStreams Service
app.get('/api/v1/events/history', (_req: Request, res: Response) => {
  res.json({ events: WIKI_STORE.events });
});

// 5. Extensions Security & Verification Gateway (Dispositivos 3.05.9.a & 3.05.9.b)
app.get('/api/v1/extensions', (_req: Request, res: Response) => {
  res.json({
    extensions: WIKI_STORE.extensions,
    allowedDomains: ALLOWED_EXTENSION_DOMAINS,
    securityDevices: {
      syncDeviceActive: true,
      malwareScannerActive: true,
      quarantineGuardActive: true,
      governanceBureaucrat: AUTHORIZED_BUROCRATA_EMAIL
    }
  });
});

app.get('/api/v1/domains', (_req: Request, res: Response) => {
  res.json({
    allowedDomains: ALLOWED_EXTENSION_DOMAINS
  });
});

// Endpoint 3.05.9.b: Static Analysis & Malicious Information Scan
app.post('/api/v1/extensions/security/scan', requireAuth, (req: Request, res: Response) => {
  try {
    const { extensionId, fileName, code } = req.body || {};
    if (!code || typeof code !== 'string' || code.length > 200_000) {
      return res.status(400).json({ error: 'Código da extensão válido (até 200 KB) é obrigatório para análise forense.' });
    }

    const audit = scanExtensionCodeForMalware(
      clampString(extensionId, 100) || 'custom-inspection',
      clampString(fileName, 120) || 'payload.ts',
      code
    );

    res.json({
      success: true,
      audit,
      sha256: computeSha256Hex(code)
    });
  } catch (err) {
    console.error('[SecurityScan] Error:', err);
    res.status(500).json({ error: 'Erro durante execução do analisador estático.' });
  }
});

// Endpoint 3.05.9.a & 3.05.9.b: Security Synchronization Device with Cryptographic Verification (Burocrata only)
app.post('/api/v1/extensions/security/sync', requireBurocrata, (req: Request, res: Response) => {
  try {
    const authUser = (req as AuthenticatedRequest).authUser!;
    const { extension, extensionId } = req.body || {};

    let targetExt: WikiExtension | undefined;

    if (extension && typeof extension === 'object') {
      targetExt = extension as WikiExtension;
    } else if (extensionId) {
      targetExt = WIKI_STORE.extensions.find(e => e.id === extensionId);
    }

    if (!targetExt) {
      return res.status(404).json({
        success: false,
        error: 'Extensão alvo não encontrada para sincronização.'
      });
    }

    const verification = verifyExtensionSyncSecurity(targetExt, authUser.email);

    const existingIndex = WIKI_STORE.extensions.findIndex(e => e.id === targetExt!.id);
    const updatedExt: WikiExtension = {
      ...targetExt,
      signatureStatus: verification.status,
      lastSyncTimestamp: new Date().toISOString(),
      syncAuthorizedBy: authUser.email,
      quarantined: verification.status === 'quarantined' || verification.audit.quarantined,
      quarantineReason: verification.audit.quarantineReason,
      securityAudit: verification.audit,
      enabled: verification.status === 'quarantined' ? false : targetExt.enabled
    };

    if (existingIndex >= 0) {
      WIKI_STORE.extensions[existingIndex] = updatedExt;
    } else {
      WIKI_STORE.extensions.push(updatedExt);
    }

    res.json({
      success: verification.approved,
      status: verification.status,
      extension: updatedExt,
      reasons: verification.reasons,
      audit: verification.audit
    });
  } catch (err) {
    console.error('[ExtensionSync] Error:', err);
    res.status(500).json({ error: 'Erro no dispositivo de sincronização de extensões.' });
  }
});

// Endpoint: Toggle Extension (Strict check: Verified Burocrata + Quarantined Guard)
app.post('/api/v1/extensions/:id/toggle', requireBurocrata, (req: Request, res: Response) => {
  const { id } = req.params;
  const { enabled } = req.body || {};

  const ext = WIKI_STORE.extensions.find(e => e.id === id);
  if (!ext) {
    return res.status(404).json({ error: 'Extensão não encontrada.' });
  }

  if (ext.quarantined && enabled) {
    return res.status(403).json({
      error: 'BLOQUEIO DE SEGURANÇA: Esta extensão está isolada em QUARENTENA devido a código malicioso detectado e não pode ser ativada.',
      quarantineReason: ext.quarantineReason
    });
  }

  ext.enabled = !!enabled;
  res.json({ success: true, extension: ext });
});

// Endpoint: Quarantine Management (Burocrata only)
app.post('/api/v1/extensions/:id/quarantine', requireBurocrata, (req: Request, res: Response) => {
  const { id } = req.params;
  const { quarantined, reason } = req.body || {};

  const ext = WIKI_STORE.extensions.find(e => e.id === id);
  if (!ext) {
    return res.status(404).json({ error: 'Extensão não encontrada.' });
  }

  ext.quarantined = !!quarantined;
  ext.quarantineReason = quarantined ? (clampString(reason, 500) || 'Isolada manualmente pelo Burocrata.') : undefined;
  ext.signatureStatus = quarantined ? 'quarantined' : 'verified';
  if (quarantined) {
    ext.enabled = false;
  }

  res.json({ success: true, extension: ext });
});

// Endpoint 3.05.3.a: Obter Catálogo de Extensões Existentes
app.get('/api/v1/extensions/catalog', (_req: Request, res: Response) => {
  res.json({
    catalog: EXISTING_EXTENSIONS_CATALOG,
    installedIds: WIKI_STORE.extensions.map((e) => e.id)
  });
});

// Endpoint 3.05.3.a, 3.05.3.b, 3.05.3.c, 3.05.3.e: Modificar Configuração da Extensão (Burocrata only)
app.put('/api/v1/extensions/:id/config', requireBurocrata, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { id } = req.params;
  const { config } = req.body || {};

  const ext = WIKI_STORE.extensions.find((e) => e.id === id);
  if (!ext) {
    return res.status(404).json({ error: 'Extensão não encontrada.' });
  }

  if (config?.supportUrl && !isSafeHttpUrl(config.supportUrl)) {
    return res.status(400).json({ error: 'supportUrl inválida (permitido apenas http/https).' });
  }

  ext.config = {
    ...(ext.config || {}),
    ...(config && typeof config === 'object' ? config : {})
  };

  if (id === 'ext-external-redirector' && config?.enabled !== undefined) {
    ext.enabled = !!config.enabled;
  }
  if (id === 'ext-maintenance-mode' && config?.isMaintenanceActive !== undefined) {
    ext.enabled = !!config.isMaintenanceActive;
  }

  ext.lastSyncTimestamp = new Date().toISOString();
  ext.syncAuthorizedBy = authUser.email;

  res.json({ success: true, extension: ext, message: 'Configurações da extensão atualizadas com sucesso.' });
});

// Endpoint 3.05.3.a: Adicionar Extensão Existente do Catálogo ou Criar Personalizada (Burocrata only)
app.post('/api/v1/extensions/catalog/add', requireBurocrata, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { catalogExtensionId, customExtension } = req.body || {};

  let extensionToAdd: WikiExtension | undefined;

  if (catalogExtensionId) {
    const foundInCatalog = EXISTING_EXTENSIONS_CATALOG.find((e) => e.id === catalogExtensionId);
    if (!foundInCatalog) {
      return res.status(404).json({ error: 'Extensão não encontrada no catálogo oficial.' });
    }
    extensionToAdd = JSON.parse(JSON.stringify(foundInCatalog));
  } else if (customExtension && typeof customExtension === 'object') {
    extensionToAdd = customExtension as WikiExtension;
  }

  if (!extensionToAdd || !isValidId(extensionToAdd.id) || !extensionToAdd.name) {
    return res.status(400).json({ error: 'Parâmetros da extensão inválidos para adição.' });
  }

  const existingIdx = WIKI_STORE.extensions.findIndex((e) => e.id === extensionToAdd!.id);
  if (existingIdx >= 0) {
    return res.status(400).json({
      error: `A extensão "${extensionToAdd.name}" (${extensionToAdd.id}) já se encontra instalada no sistema.`
    });
  }

  const verification = verifyExtensionSyncSecurity(extensionToAdd, authUser.email);
  extensionToAdd.signatureStatus = verification.status;
  extensionToAdd.lastSyncTimestamp = new Date().toISOString();
  extensionToAdd.syncAuthorizedBy = authUser.email;
  extensionToAdd.quarantined = verification.status === 'quarantined' || verification.audit.quarantined;
  extensionToAdd.quarantineReason = verification.audit.quarantineReason;
  extensionToAdd.securityAudit = verification.audit;

  if (extensionToAdd.quarantined) {
    extensionToAdd.enabled = false;
  }

  WIKI_STORE.extensions.push(extensionToAdd);

  res.status(201).json({
    success: true,
    extension: extensionToAdd,
    verification,
    message: `Extensão "${extensionToAdd.name}" adicionada com sucesso ao ecossistema NotMediaWiki.`
  });
});

// Endpoint 3.05.3.a: Modificar Metadados, Arquivos ou Código de uma Extensão Existente (Burocrata only)
app.put('/api/v1/extensions/:id', requireBurocrata, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { id } = req.params;
  const { name, namePt, description, version, files, config } = req.body || {};

  const ext = WIKI_STORE.extensions.find((e) => e.id === id);
  if (!ext) {
    return res.status(404).json({ error: 'Extensão não encontrada para modificação.' });
  }

  if (name) ext.name = clampString(name, 120);
  if (namePt) ext.namePt = clampString(namePt, 120);
  if (description) ext.description = clampString(description, 1000);
  if (version) ext.version = clampString(version, 40);
  if (config && typeof config === 'object') ext.config = { ...(ext.config || {}), ...config };

  if (Array.isArray(files) && files.length > 0) {
    ext.files = files.slice(0, 20).map((f: any) => ({
      name: clampString(f.name, 120) || 'index.ts',
      content: typeof f.content === 'string' ? f.content.slice(0, 200_000) : '',
      size: typeof f.content === 'string' ? f.content.slice(0, 200_000).length : 0,
      sha256: computeSha256Hex(typeof f.content === 'string' ? f.content.slice(0, 200_000) : ''),
      mimeType: clampString(f.mimeType, 80) || 'application/typescript'
    }));
    ext.sha256 = ext.files[0]?.sha256 || computeSha256Hex('');
  }

  const verification = verifyExtensionSyncSecurity(ext, authUser.email);
  ext.signatureStatus = verification.status;
  ext.lastSyncTimestamp = new Date().toISOString();
  ext.syncAuthorizedBy = authUser.email;
  ext.quarantined = verification.status === 'quarantined' || verification.audit.quarantined;
  ext.quarantineReason = verification.audit.quarantineReason;
  ext.securityAudit = verification.audit;

  if (ext.quarantined) {
    ext.enabled = false;
  }

  res.json({
    success: true,
    extension: ext,
    verification,
    message: `Extensão "${ext.name}" modificada e validada com sucesso.`
  });
});

app.delete('/api/v1/extensions/:id', requireBurocrata, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = WIKI_STORE.extensions.findIndex((e) => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Extensão não encontrada.' });
  }
  const [removed] = WIKI_STORE.extensions.splice(idx, 1);
  res.json({ success: true, removedId: removed.id });
});


// ============================================
// BEMTEVI SOCIAL NETWORK ENDPOINTS (/api/bemtevi/*)
// Repositório: WazzimaGiygg/bemtevi
// Domínio: bemtevi.wazzimagiygg.com
// ============================================
const BEMTEVI_STORE = {
  posts: [...SEED_BEMTEVI_POSTS] as BemteviPost[],
  communities: [...SEED_BEMTEVI_COMMUNITIES] as BemteviCommunity[],
  users: [...SEED_BEMTEVI_USERS],
  comments: [...SEED_BEMTEVI_COMMENTS] as BemteviComment[],
  trending: [...SEED_BEMTEVI_TRENDING],
  messages: [...SEED_BEMTEVI_MESSAGES]
};

function normalizeBemteviCategory(raw: unknown): BemteviCategory {
  const cleaned = clampString(raw, 60);
  return (BEMTEVI_CATEGORIES as readonly string[]).includes(cleaned)
    ? (cleaned as BemteviCategory)
    : 'Geral';
}

// 1. Get Posts (with query filters)
app.get('/api/bemtevi/posts', (req: Request, res: Response) => {
  const { category, communityId, authorId, search } = req.query;
  let list = [...BEMTEVI_STORE.posts];

  if (category && category !== 'all') {
    list = list.filter((p) => p.category === category);
  }
  if (communityId) {
    list = list.filter((p) => p.communityId === communityId);
  }
  if (authorId) {
    list = list.filter((p) => p.authorId === authorId);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter((p) => p.content.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q));
  }

  res.json({ posts: list, total: list.length });
});

// 2. Create Post (strictly authenticated, max 127 chars)
app.post('/api/bemtevi/posts', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { id, content, authorName, authorHandle, authorAvatar, link, category, communityId, communityName, sharedArticle, tags } = req.body || {};

  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: 'Conteúdo da postagem é obrigatório.' });
    return;
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length > 127) {
    res.status(400).json({ error: 'O texto deve ter no máximo 127 caracteres!' });
    return;
  }

  if (link && !isSafeHttpUrl(link)) {
    res.status(400).json({ error: 'URL do link inválida (permitido apenas http/https).' });
    return;
  }

  const mergedTags = Array.from(
    new Set([
      ...(Array.isArray(tags) ? tags.slice(0, 10).map((t: any) => clampString(t, 40)).filter(Boolean) : []),
      ...extractHashtagsFromText(trimmedContent)
    ])
  );

  const safeId = isValidId(id) ? id : `post-${Date.now()}`;
  const newPost: BemteviPost = {
    id: safeId,
    authorId: authUser.uid,
    authorName: clampString(authorName || authUser.name || '', 100) || 'Membro Bemtevi',
    authorHandle: clampString(authorHandle, 60) || '@membro',
    ...(isSafeHttpUrl(authorAvatar) ? { authorAvatar: String(authorAvatar).trim() } : {}),
    authorBadge: 'Iniciante',
    authorKarma: 10,
    content: trimmedContent,
    ...(link ? { link: String(link).trim() } : {}),
    tags: mergedTags,
    category: normalizeBemteviCategory(category),
    ...(communityId ? { communityId: clampString(communityId, 100) } : {}),
    ...(communityName ? { communityName: clampString(communityName, 100) } : {}),
    ...(sharedArticle && typeof sharedArticle === 'object' ? { sharedArticle } : {}),
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    savesCount: 0,
    likedBy: [],
    savedBy: [],
    createdAt: new Date().toISOString()
  };

  if (!BEMTEVI_STORE.posts.some((p) => p.id === newPost.id)) {
    BEMTEVI_STORE.posts.unshift(newPost);
  }
  res.status(201).json({ success: true, post: newPost });
});

// 2b. Update / Edit / Interact Post (authenticated; content edits restricted to owner/Burocrata)
app.put('/api/bemtevi/posts/:id', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { id } = req.params;
  const post = BEMTEVI_STORE.posts.find((p) => p.id === id);
  if (!post) {
    res.status(404).json({ error: 'Post não encontrado.' });
    return;
  }

  const { content, link, category, savedBy, sharesCount, isEdited } = req.body || {};
  const isOwnerOrAdmin = post.authorId === authUser.uid || isVerifiedBurocrata(authUser);

  if (typeof content === 'string' || link !== undefined || category !== undefined) {
    if (!isOwnerOrAdmin) {
      res.status(403).json({ error: 'Apenas o autor ou o Burocrata podem editar o conteúdo desta postagem.' });
      return;
    }
    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (!trimmed) {
        res.status(400).json({ error: 'Conteúdo da postagem não pode ficar vazio.' });
        return;
      }
      if (trimmed.length > 127) {
        res.status(400).json({ error: 'O texto deve ter no máximo 127 caracteres!' });
        return;
      }
      post.content = trimmed;
      post.tags = extractHashtagsFromText(trimmed);
      post.isEdited = isEdited ?? true;
      post.updatedAt = new Date().toISOString();
    }
    if (link !== undefined) {
      if (link && !isSafeHttpUrl(link)) {
        res.status(400).json({ error: 'URL inválida.' });
        return;
      }
      post.link = link ? String(link).trim() : undefined;
    }
    if (category) post.category = normalizeBemteviCategory(category);
  }

  // Allow any authenticated user to toggle only their own UID in savedBy
  if (Array.isArray(savedBy)) {
    const currentlySaved = post.savedBy.includes(authUser.uid);
    const wantsSaved = savedBy.includes(authUser.uid);
    if (wantsSaved && !currentlySaved) {
      post.savedBy.push(authUser.uid);
    } else if (!wantsSaved && currentlySaved) {
      post.savedBy = post.savedBy.filter((u) => u !== authUser.uid);
    }
    post.savesCount = post.savedBy.length;
  }

  // Increment sharesCount safely (+1 step max per request)
  if (typeof sharesCount === 'number' && sharesCount > post.sharesCount) {
    post.sharesCount += 1;
  }

  res.json({ success: true, post });
});

// 3. Delete Post (Owner or Burocrata)
app.delete('/api/bemtevi/posts/:id', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { id } = req.params;
  const post = BEMTEVI_STORE.posts.find((p) => p.id === id);
  if (!post) {
    res.status(404).json({ error: 'Post não encontrado.' });
    return;
  }
  if (post.authorId !== authUser.uid && !isVerifiedBurocrata(authUser)) {
    res.status(403).json({ error: 'Apenas o autor ou o Burocrata podem excluir esta postagem.' });
    return;
  }
  BEMTEVI_STORE.posts = BEMTEVI_STORE.posts.filter((p) => p.id !== id);
  res.json({ success: true, message: 'Post excluído com sucesso.' });
});

// 4. Like / Unlike Post (authenticated user UID)
app.post('/api/bemtevi/posts/:id/like', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { id } = req.params;
  const post = BEMTEVI_STORE.posts.find((p) => p.id === id);

  if (!post) {
    res.status(404).json({ error: 'Post não encontrado.' });
    return;
  }

  const uid = authUser.uid;
  const isLiked = post.likedBy.includes(uid);
  if (isLiked) {
    post.likedBy = post.likedBy.filter((u) => u !== uid);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likedBy.push(uid);
    post.likesCount += 1;
  }

  res.json({ success: true, isLiked: !isLiked, likesCount: post.likesCount });
});

// 5. Communities
app.get('/api/bemtevi/communities', (_req: Request, res: Response) => {
  res.json({ communities: BEMTEVI_STORE.communities });
});

app.post('/api/bemtevi/communities', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { id, name, description, category } = req.body || {};
  const cleanName = clampString(name, 60);
  if (cleanName.length < 3) {
    res.status(400).json({ error: 'Nome da comunidade deve ter pelo menos 3 caracteres.' });
    return;
  }

  const newComm: BemteviCommunity = {
    id: isValidId(id) ? id : `comm-${Date.now()}`,
    name: cleanName,
    description: clampString(description, 300),
    category: normalizeBemteviCategory(category),
    membersCount: 1,
    postsCount: 0,
    icon: '🏛️',
    createdBy: authUser.uid,
    members: [authUser.uid],
    createdAt: new Date().toISOString()
  };

  if (!BEMTEVI_STORE.communities.some((c) => c.id === newComm.id)) {
    BEMTEVI_STORE.communities.unshift(newComm);
  }
  res.status(201).json({ success: true, community: newComm });
});

app.post('/api/bemtevi/communities/:id/join', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { id } = req.params;
  const comm = BEMTEVI_STORE.communities.find((c) => c.id === id);
  if (!comm) {
    res.status(404).json({ error: 'Comunidade não encontrada.' });
    return;
  }
  const alreadyMember = comm.members.includes(authUser.uid);
  if (alreadyMember) {
    comm.members = comm.members.filter((m) => m !== authUser.uid);
  } else {
    comm.members.push(authUser.uid);
  }
  comm.membersCount = comm.members.length;
  res.json({ success: true, community: comm });
});

// 6. Trending Topics
app.get('/api/bemtevi/trending', (_req: Request, res: Response) => {
  const dynamicTrending = computeTrendingTopicsFromDbPosts(BEMTEVI_STORE.posts);
  res.json({ trending: dynamicTrending });
});

// 7. Users (Public display directory — zero e-mail exposure)
app.get('/api/bemtevi/users', (_req: Request, res: Response) => {
  const realUsers = (DATA_CACHE.users || []).map((u: any) => ({
    uid: u.uid || u.id,
    name: u.name || u.nome || 'Usuário WZZM',
    handle: `@${(u.name || u.uid || 'usuario').toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
    avatar: u.profilePictureUrl || u.avatar || undefined,
    bio: u.bio || (u.isTeacher ? 'Professor verificado no acervo WZZM' : (u.isAdmin ? 'Burocrata administrador oficial' : 'Membro registrado da comunidade')),
    karma: u.karma || (u.isAdmin ? 5000 : 100),
    level: u.level || (u.isAdmin ? 'Lendário' : (u.isTeacher ? 'Veterano' : 'Iniciante')),
    followers: u.followers || [],
    following: u.following || [],
    badges: u.badges || (u.isAdmin ? ['Burocrata'] : (u.isTeacher ? ['Docente'] : ['Registrado'])),
    joinedAt: u.createdAt || new Date().toISOString()
  }));
  res.json({ users: realUsers });
});

// 8. Comments (Comentários sincronizados por post)
app.get('/api/bemtevi/posts/:postId/comments', (req: Request, res: Response) => {
  const { postId } = req.params;
  const list = BEMTEVI_STORE.comments.filter((c) => c.postId === postId);
  res.json({ comments: list });
});

app.post('/api/bemtevi/posts/:postId/comments', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { postId } = req.params;
  const { content, authorName, authorHandle, authorAvatar } = req.body || {};
  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: 'Comentário não pode estar vazio.' });
    return;
  }
  const cleanContent = content.trim();
  if (cleanContent.length > 280) {
    res.status(400).json({ error: 'Comentário muito longo! Máximo 280 caracteres.' });
    return;
  }
  const newComment: BemteviComment = {
    id: `comm-${Date.now()}`,
    postId,
    authorId: authUser.uid,
    authorName: clampString(authorName || authUser.name || '', 100) || 'Membro',
    authorHandle: clampString(authorHandle, 60) || '@membro',
    authorAvatar: isSafeHttpUrl(authorAvatar) ? String(authorAvatar).trim() : undefined,
    content: cleanContent,
    likesCount: 0,
    likedBy: [],
    createdAt: new Date().toISOString()
  };
  BEMTEVI_STORE.comments.push(newComment);
  const targetPost = BEMTEVI_STORE.posts.find((p) => p.id === postId);
  if (targetPost) {
    targetPost.commentsCount += 1;
  }
  res.status(201).json({ success: true, comment: newComment });
});

// 8. Direct Messages (Strictly private to conversation participants & Burocrata)
app.get('/api/bemtevi/messages', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { conversationId } = req.query;
  let list = isVerifiedBurocrata(authUser)
    ? BEMTEVI_STORE.messages
    : BEMTEVI_STORE.messages.filter(
        (m: any) => m.senderId === authUser.uid || m.receiverId === authUser.uid || m.recipientId === authUser.uid
      );
  if (conversationId && typeof conversationId === 'string') {
    list = list.filter((m) => m.conversationId === conversationId);
  }
  res.json({ messages: list });
});

app.post('/api/bemtevi/messages', requireAuth, (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).authUser!;
  const { conversationId, senderName, senderAvatar, receiverId, text } = req.body || {};
  const cleanText = clampString(text, 2000);
  if (!cleanText || !isValidId(receiverId)) {
    res.status(400).json({ error: 'Destinatário válido e mensagem (até 2000 chars) são obrigatórios.' });
    return;
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    conversationId: isValidId(conversationId) ? conversationId : `conv-${Date.now()}`,
    senderId: authUser.uid,
    senderName: clampString(senderName || authUser.name || '', 100) || 'Usuário',
    senderAvatar: isSafeHttpUrl(senderAvatar) ? String(senderAvatar).trim() : undefined,
    receiverId,
    text: cleanText,
    createdAt: new Date().toISOString()
  };

  BEMTEVI_STORE.messages.push(newMsg);
  res.status(201).json({ success: true, message: newMsg });
});

// ============================================
// SECURITY & AUTH IP/VPN CHECK ENDPOINTS
// ============================================
function extractRequestClientIp(req: Request): string {
  const queryIp = typeof req.query.ip === 'string' ? req.query.ip.trim() : '';
  if (queryIp) {
    const cleanedQueryIp = cleanIpAddress(queryIp);
    if (net.isIP(cleanedQueryIp) !== 0) {
      return cleanedQueryIp;
    }
  }
  return cleanIpAddress(getSafeClientIp(req));
}

app.get('/api/auth/check-wikimedia-ip', (req: Request, res: Response) => {
  const ip = extractRequestClientIp(req);
  const result = checkIfWikimediaIp(ip);
  res.json(result);
});

app.get('/api/security/check-vpn', (req: Request, res: Response) => {
  const ip = extractRequestClientIp(req);
  const result = evaluateIpLocally(ip);
  res.json(result);
});

// ============================================
// GEMINI AI WIKI & GOOGLE SEARCH GROUNDING ENDPOINTS (/api/gemini/*)
// ============================================
const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';
const DEFAULT_GEMINI_APPLET_ID = '0a14dc90-3ab3-47bc-8306-ca5bc2953699';

function getServerGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function normalizeGeminiModel(requestedModel?: unknown): string {
  if (typeof requestedModel !== 'string' || !requestedModel.trim()) {
    return DEFAULT_GEMINI_MODEL;
  }
  const m = requestedModel.trim();
  if (m.includes('1.5') || m.includes('2.0') || m.includes('2.5')) {
    return DEFAULT_GEMINI_MODEL;
  }
  return m;
}

function extractGroundingData(response: any) {
  const groundingMetadata = response?.candidates?.[0]?.groundingMetadata;
  const groundingChunks = Array.isArray(groundingMetadata?.groundingChunks)
    ? groundingMetadata.groundingChunks
        .filter((chunk: any) => chunk?.web?.uri)
        .map((chunk: any) => ({
          web: {
            uri: String(chunk.web.uri),
            title: chunk.web.title ? String(chunk.web.title) : String(chunk.web.uri),
          },
        }))
    : [];
  const webSearchQueries = Array.isArray(groundingMetadata?.webSearchQueries)
    ? groundingMetadata.webSearchQueries.map((q: any) => String(q))
    : [];
  return { groundingChunks, webSearchQueries };
}

app.get('/api/gemini/status', (_req: Request, res: Response) => {
  const client = getServerGeminiClient();
  res.json({
    status: client ? 'ready' : 'unconfigured',
    hasApiKey: !!client,
    defaultModel: DEFAULT_GEMINI_MODEL,
    appletId: DEFAULT_GEMINI_APPLET_ID,
    searchGroundingEnabled: true,
    recommendedModels: ['gemini-4-hydrogen', 'gemini-flash-latest', 'gemini-4-argon'],
  });
});

app.post('/api/gemini/search-grounding', geminiLimiter, async (req: Request, res: Response) => {
  const { query, contextTab } = req.body || {};
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Termo de pesquisa é obrigatório.' });
  }

  const ai = getServerGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'Chave GEMINI_API_KEY não configurada no servidor.',
      fallbackAvailable: true,
    });
  }

  try {
    const cleanQuery = query.trim().slice(0, 400);
    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: `Pesquise na Web e responda em português (pt-BR), de forma clara, objetiva e verificável, sobre: "${cleanQuery}". Quando o assunto envolver o ecossistema WazzimaGiygg, WikiWorldWeb, Wiki-alternative ou Dossiê A Verdade, priorize a referência oficial em https://core.wazzimagiygg.com/ (e https://support.wazzimagiygg.com/). Contexto da aba atual: ${clampString(contextTab, 60) || 'wikiworldweb'}.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'Você é o mecanismo de síntese e verificação factual integrado ao portal core.wazzimagiygg.com (WikiWorldWeb). Use o Google Search para trazer informações atuais e sempre cite fontes confiáveis sem depender de narrativas parciais.',
      },
    });

    const { groundingChunks, webSearchQueries } = extractGroundingData(response);
    res.json({
      query: cleanQuery,
      answer: response.text || 'Nenhum resumo encontrado para esta pesquisa.',
      groundingChunks,
      webSearchQueries,
      model: DEFAULT_GEMINI_MODEL,
      canonicalDomain: 'https://core.wazzimagiygg.com/',
    });
  } catch (err) {
    console.error('[GeminiSearchGrounding] Error:', err);
    res.status(500).json({ error: 'Erro ao executar Google Search Grounding.' });
  }
});

app.post('/api/gemini/chat', geminiLimiter, requireAuth, async (req: Request, res: Response) => {
  const { message, history = [], context, customSystemInstruction, model, image } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Mensagem é obrigatória.' });
  }

  const ai = getServerGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'Chave GEMINI_API_KEY não configurada no servidor.',
      fallbackAvailable: true,
    });
  }

  try {
    const contextText = context?.currentArticle?.titulo
      ? `\nContexto atual do artigo: "${clampString(context.currentArticle.titulo, 200)}" (${clampString(context.currentArticle.categoria, 60) || 'Geral'}).`
      : context?.currentCollection?.titulo
        ? `\nContexto atual da coleção: "${clampString(context.currentCollection.titulo, 200)}".`
        : '';

    const contents: any[] = Array.isArray(history)
      ? history.slice(-10).map((h: any) => ({
          role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(h.text || h.content || '').slice(0, 4000) }],
        }))
      : [];

    const currentParts: any[] = [{ text: message.slice(0, 4000) }];
    if (image?.data && image?.mimeType) {
      currentParts.push({
        inlineData: { data: String(image.data), mimeType: String(image.mimeType) },
      });
    }
    contents.push({ role: 'user', parts: currentParts });

    const activeModel = normalizeGeminiModel(model);
    const response = await ai.models.generateContent({
      model: activeModel,
      contents,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `${clampString(customSystemInstruction, 1500) || 'Você é o assistente editorial oficial de core.wazzimagiygg.com (WikiZero / WikiWorldWeb). Utilize o Google Search para verificar fatos atualizados e responda com precisão.'}${contextText}`,
      },
    });

    const { groundingChunks, webSearchQueries } = extractGroundingData(response);
    res.json({
      reply: response.text || 'Não foi possível gerar resposta no momento.',
      groundingChunks,
      webSearchQueries,
      model: activeModel,
    });
  } catch (err) {
    console.error('[GeminiChat] Error:', err);
    res.status(500).json({ error: 'Erro ao consultar o Gemini.' });
  }
});

app.post('/api/gemini/generate-article', geminiLimiter, requirePublisher, async (req: Request, res: Response) => {
  const { topic, category = 'Geral', keywords = '', language = 'Português', userInstructions = '', chatbotId } = req.body || {};
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'Tópico do artigo é obrigatório.' });
  }

  const ai = getServerGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'Chave GEMINI_API_KEY não configurada no servidor.' });
  }

  try {
    const cleanTopic = clampString(topic, 250);
    const prompt = `Escreva um artigo enciclopédico neutro, atualizado via pesquisa na Web e estruturado em Wikitext (usando == Seções == e listas quando apropriado), em ${clampString(language, 40)}, sobre "${cleanTopic}" na categoria "${clampString(category, 80)}". Palavras-chave: ${clampString(keywords, 300)}. Instruções adicionais: ${clampString(userInstructions, 1000)}.`;
    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const { groundingChunks, webSearchQueries } = extractGroundingData(response);
    res.json({
      title: cleanTopic,
      wikitext: response.text || '',
      category: clampString(category, 80),
      chatbotId: chatbotId || DEFAULT_GEMINI_APPLET_ID,
      groundingChunks,
      webSearchQueries,
      model: DEFAULT_GEMINI_MODEL,
    });
  } catch (err) {
    console.error('[GeminiGenerateArticle] Error:', err);
    res.status(500).json({ error: 'Erro ao gerar artigo com Gemini.' });
  }
});

app.post('/api/gemini/generate-collection', geminiLimiter, requirePublisher, async (req: Request, res: Response) => {
  const { theme, userInstructions = '', chatbotId } = req.body || {};
  if (!theme || typeof theme !== 'string') {
    return res.status(400).json({ error: 'Tema da coleção é obrigatório.' });
  }

  const cleanTheme = clampString(theme, 200);
  const slug = cleanTheme
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const ai = getServerGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'Chave GEMINI_API_KEY não configurada no servidor.' });
  }

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: `Gere um JSON puro (sem markdown) com as chaves titulo, descricao (máximo 180 caracteres), categoria, icon (um emoji), e tags (array de 3 a 5 strings) para uma coleção enciclopédica sobre "${cleanTheme}". ${clampString(userInstructions, 800)}`,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(response.text || '{}');
    res.json({
      collection: {
        titulo: parsed.titulo || cleanTheme,
        uid: slug || `col-${Date.now()}`,
        descricao: parsed.descricao || `Coleção temática dedicada a ${cleanTheme}.`,
        categoria: parsed.categoria || 'Geral',
        icon: parsed.icon || '📚',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [cleanTheme],
      },
      chatbotId: chatbotId || DEFAULT_GEMINI_APPLET_ID,
    });
  } catch (err) {
    console.error('[GeminiGenerateCollection] Error:', err);
    res.status(500).json({ error: 'Erro ao gerar coleção com Gemini.' });
  }
});

app.post('/api/gemini/notebook-synthesize', geminiLimiter, requirePublisher, async (req: Request, res: Response) => {
  const { sources = [], action = 'full_article', customPrompt = '', targetArticleTitle = '' } = req.body || {};
  if (!Array.isArray(sources) || sources.length === 0) {
    return res.status(400).json({ error: 'Ao menos uma fonte é obrigatória para síntese.' });
  }

  const ai = getServerGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'Chave GEMINI_API_KEY não configurada no servidor.' });
  }

  try {
    const sourcesText = sources
      .slice(0, 10)
      .map((s: any, idx: number) => `Fonte ${idx + 1} (${clampString(s.title, 150) || 'Sem título'}):\n${String(s.content || '').slice(0, 6000)}`)
      .join('\n\n---\n\n');

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: `Ação: ${clampString(action, 80)}. Título alvo: ${clampString(targetArticleTitle, 200) || 'Artigo sintetizado'}. Instrução extra: ${clampString(customPrompt, 800)}.\n\nFontes:\n${sourcesText}\n\nRetorne JSON puro com: { "wikitext": "...", "summary": "...", "suggestedTitle": "...", "suggestedCategory": "..." }`,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      wikitext: parsed.wikitext || '',
      summary: parsed.summary || 'Síntese gerada com sucesso.',
      suggestedTitle: parsed.suggestedTitle || clampString(targetArticleTitle, 200) || 'Artigo do Notebook',
      suggestedCategory: parsed.suggestedCategory || 'Geral',
    });
  } catch (err) {
    console.error('[GeminiNotebookSynthesize] Error:', err);
    res.status(500).json({ error: 'Erro ao sintetizar com Gemini Notebook.' });
  }
});

// ============================================
// SEO ROUTES: DYNAMIC SITEMAP.XML, ROBOTS.TXT & OPENSEARCH.XML
// ============================================
function escapeXml(unsafe: string): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

app.get('/robots.txt', (_req: Request, res: Response) => {
  const publicRobots = path.resolve(__dirname, 'public', 'robots.txt');
  if (fs.existsSync(publicRobots)) {
    res.type('text/plain; charset=utf-8').sendFile(publicRobots);
    return;
  }
  res
    .type('text/plain; charset=utf-8')
    .send('User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/admin/\nHost: core.wazzimagiygg.com\nSitemap: https://core.wazzimagiygg.com/sitemap.xml\n');
});

app.get('/opensearch.xml', (_req: Request, res: Response) => {
  const publicOpenSearch = path.resolve(__dirname, 'public', 'opensearch.xml');
  if (fs.existsSync(publicOpenSearch)) {
    res.type('application/opensearchdescription+xml; charset=utf-8').sendFile(publicOpenSearch);
    return;
  }
  res.status(404).end();
});

app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const baseUrl = 'https://core.wazzimagiygg.com';
  const today = new Date().toISOString().slice(0, 10);

  const staticEntries = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/?uid=wikiworldweb`, changefreq: 'daily', priority: '0.95' },
    { loc: `${baseUrl}/?uid=dossie`, changefreq: 'daily', priority: '0.95' },
    { loc: `${baseUrl}/?uid=wikiwazzimagiygg`, changefreq: 'daily', priority: '0.95' },
    { loc: `${baseUrl}/?uid=notmediawiki`, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/?uid=academico`, changefreq: 'weekly', priority: '0.85' },
    { loc: `${baseUrl}/?uid=materiadeensaio`, changefreq: 'weekly', priority: '0.85' },
    { loc: `${baseUrl}/?uid=uwgbooks`, changefreq: 'weekly', priority: '0.85' },
    { loc: `${baseUrl}/?uid=bemtevi`, changefreq: 'daily', priority: '0.85' },
    { loc: `${baseUrl}/?uid=lgpd`, changefreq: 'monthly', priority: '0.8' },
    { loc: `${baseUrl}/?uid=eticaia`, changefreq: 'monthly', priority: '0.8' },
    { loc: `${baseUrl}/?uid=tickets`, changefreq: 'weekly', priority: '0.8' },
  ];

  const dynamicSlugs = new Set<string>();
  const dynamicEntries: Array<{ loc: string; changefreq: string; priority: string }> = [];

  for (const wikiArt of WIKI_STORE.articles || []) {
    if (wikiArt?.slug && !dynamicSlugs.has(wikiArt.slug)) {
      dynamicSlugs.add(wikiArt.slug);
      dynamicEntries.push({
        loc: `${baseUrl}/?uid=${encodeURIComponent(wikiArt.slug)}`,
        changefreq: 'weekly',
        priority: '0.85',
      });
    }
  }

  for (const customArt of DATA_CACHE.customArticles || []) {
    const id = customArt?.id || customArt?.uid;
    if (id && !dynamicSlugs.has(String(id))) {
      dynamicSlugs.add(String(id));
      dynamicEntries.push({
        loc: `${baseUrl}/?uid=${encodeURIComponent(String(id))}`,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }
  }

  const allUrls = [...staticEntries, ...dynamicEntries];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${allUrls
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <xhtml:link rel="alternate" hreflang="pt-BR" href="${escapeXml(entry.loc)}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(entry.loc)}" />\n    <lastmod>${today}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>`;

  res.type('application/xml; charset=utf-8').send(xml);
});

// Resolve dynamic SEO & Canonical Metadata for any ?uid= or ?q= request
function resolveServerSeoForRequest(req: Request) {
  const uid = typeof req.query?.uid === 'string' ? req.query.uid.trim() : '';
  const searchQuery = typeof req.query?.q === 'string' ? req.query.q.trim() : '';

  let matchedArticle: SeoArticleInput | null = null;

  if (uid) {
    const lowerUid = uid.toLowerCase();

    // 1. NotMediaWiki / WikiZero articles
    const wikiArt = (WIKI_STORE.articles || []).find(
      (a) => a.id?.toLowerCase() === lowerUid || a.slug?.toLowerCase() === lowerUid
    );
    if (wikiArt) {
      matchedArticle = {
        id: wikiArt.slug || wikiArt.id,
        titulo: wikiArt.title,
        resumo: wikiArt.summary,
        descricao: wikiArt.wikitext?.slice(0, 240),
        setor: wikiArt.categories?.[0] || 'NotMediaWiki',
        idioma: 'pt-BR',
        dataCriacao: wikiArt.createdAt,
        dataEdicao: wikiArt.updatedAt,
      };
    }

    // 2. Custom user/seed articles
    if (!matchedArticle) {
      const custom = (DATA_CACHE.customArticles || []).find(
        (a: any) => String(a?.id || a?.uid || '').toLowerCase() === lowerUid
      );
      if (custom) {
        matchedArticle = {
          id: String(custom.id || custom.uid),
          titulo: custom.titulo || custom.title,
          descricao: custom.descricao || custom.conteudo,
          setor: custom.setor || custom.colecao,
          dataEdicao: custom.ultimaEdicao,
        };
      }
    }

    // 3. Noticias JSON fallback
    if (!matchedArticle && Array.isArray(DATA_CACHE.noticias)) {
      const newsItem = DATA_CACHE.noticias.find(
        (n: any) => String(n?.id || '').toLowerCase() === lowerUid
      );
      if (newsItem) {
        matchedArticle = {
          id: String(newsItem.id),
          titulo: newsItem.titulo,
          descricao: newsItem.descricao || newsItem.conteudo,
          setor: newsItem.setor || 'Notícias',
          dataEdicao: newsItem.ultimaEdicao,
        };
      }
    }

    // 4. Academico / Artigos JSON fallback
    if (!matchedArticle && DATA_CACHE.artigos?.materias) {
      const materias = DATA_CACHE.artigos.materias as Record<string, any>;
      if (materias[uid]) {
        matchedArticle = {
          id: uid,
          titulo: materias[uid].titulo,
          descricao: materias[uid].descricao,
          setor: materias[uid].categoria || 'Acadêmico',
        };
      }
    }
  }

  return resolveDynamicSeoMetadata({
    uid: uid || undefined,
    tab: uid || 'wikiworldweb',
    searchQuery: searchQuery || undefined,
    article: matchedArticle,
  });
}

// Endpoint de diagnóstico/auditoria de canonicalização & meta-tags
app.get('/api/seo/resolve', (req: Request, res: Response) => {
  const meta = resolveServerSeoForRequest(req);
  res.json({
    canonicalOrigin: 'https://core.wazzimagiygg.com',
    resolved: meta,
    httpHeaders: {
      Link: `<${meta.canonicalUrl}>; rel="canonical"`,
      'X-Robots-Tag': meta.robots,
    },
  });
});

// Explicit JSON 404 handler for any unknown /api/* route (prevents SPA HTML fallthrough)
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint de API não encontrado.',
    method: req.method,
    path: req.path
  });
});

// Safe global error handler — never leaks stack traces or internal filesystem paths
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Payload JSON inválido.' });
    return;
  }
  console.error('[ServerError]', err?.message || err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Erro interno ao processar a requisição.' });
  }
});

// ============================================
// SERVER SETUP & VITE MIDDLEWARE
// ============================================
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    // Mount Vite middleware in development and bind HMR WebSocket to httpServer (port 3000)
    const { createServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createServer({
      plugins: hmrDisabled
        ? [
            {
              name: 'wzzm-disable-hmr-ws',
              enforce: 'post',
              transform(code, id) {
                if (id.replace(/\\/g, '/').endsWith('/vite/dist/client/client.mjs')) {
                  return {
                    code: code.replace(
                      /const transport = normalizeModuleRunnerTransport\(\(\(\) => \{[\s\S]*?\}\)\(\)\);/,
                      'const transport = normalizeModuleRunnerTransport({ async connect() {}, async disconnect() {}, send() {} });'
                    ),
                    map: null,
                  };
                }
              },
            },
          ]
        : undefined,
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        ws: { server: httpServer },
      },
    });

    // Dynamic SSR meta-tag & canonical injection before Vite static HTML fallthrough
    app.get('*', async (req: Request, res: Response, next) => {
      const acceptsHtml = req.headers.accept?.includes('text/html');
      const isInternalAsset =
        req.path.startsWith('/api/') ||
        req.path.startsWith('/@') ||
        req.path.startsWith('/src/') ||
        req.path.startsWith('/node_modules/') ||
        /\.[a-z0-9]+$/i.test(req.path);

      if (!acceptsHtml || isInternalAsset) {
        return next();
      }

      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const seoMeta = resolveServerSeoForRequest(req);
        const canonicalizedHtml = injectSeoIntoHtml(template, seoMeta);

        res.setHeader('Link', `<${seoMeta.canonicalUrl}>; rel="canonical"`);
        res.setHeader('X-Robots-Tag', seoMeta.robots);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(canonicalizedHtml);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });

    app.use(vite.middlewares);
    console.log('[Backend] Vite middleware + SSR SEO canonicalization attached in dev mode.');
  } else {
    // Serve static files in production with dynamic SSR SEO canonicalization
    const distPath = path.resolve(__dirname, 'dist');
    const distIndexPath = path.resolve(distPath, 'index.html');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { index: false }));
      app.get('*', (req: Request, res: Response) => {
        if (fs.existsSync(distIndexPath)) {
          const template = fs.readFileSync(distIndexPath, 'utf-8');
          const seoMeta = resolveServerSeoForRequest(req);
          const canonicalizedHtml = injectSeoIntoHtml(template, seoMeta);

          res.setHeader('Link', `<${seoMeta.canonicalUrl}>; rel="canonical"`);
          res.setHeader('X-Robots-Tag', seoMeta.robots);
          res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(canonicalizedHtml);
        } else {
          res.status(404).end();
        }
      });
      console.log('[Backend] Serving production dist static files with SSR SEO canonicalization.');
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[WazzimaGiygg Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.WZZM_DISABLE_AUTO_LISTEN !== '1') {
  startServer().catch((err) => {
    console.error('[Backend] Fatal error starting server:', err);
    process.exit(1);
  });
}
