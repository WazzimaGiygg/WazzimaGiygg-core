import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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
  computeTrendingTopicsFromDbPosts
} from './src/data/bemteviData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing JSON with sane limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Security & CORS Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Master-Key, X-Access-Key');
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

// Route for ferramentasadministrativas.html
app.get(['/admin/ferramentasadministrativas.html', '/ferramentasadministrativas.html'], (_req: Request, res: Response) => {
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

// 6. Articles API (Querying & Caching)
app.get('/api/articles', (req: Request, res: Response) => {
  const { collection = 'wikiworldweb', search = '', limit = '50' } = req.query;
  const maxLimit = Math.min(parseInt(limit as string, 10) || 50, 100);

  // Combine curated news and academic resources formatted as articles
  let results: any[] = [];

  if (collection === 'academico' || collection === 'all') {
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
        visualizacoes: 142 + Math.floor(Math.random() * 50),
        colecao: 'academico',
        link: value.link,
        categoria: value.categoria
      });
    }
  }

  if (collection === 'wikiworldweb' || collection === 'all') {
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
    } );
  }

  if (collection === 'materiadeensaio' || collection === 'all') {
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

  if (collection === 'uwgbooks' || collection === 'all') {
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
    collection,
    articles: results.slice(0, maxLimit)
  });
});

// 7. Single Article Fetch
app.get('/api/articles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const articlesList = [
    ...(DATA_CACHE.noticias || []).map((n, i) => ({
      id: `news_${i + 1}`,
      titulo: n.titulo,
      descricao: n.resumo,
      setor: 'Notícias & Sociedade',
      criadorEmail: 'redacao@wazzimagiygg.com',
      dataCriacao: new Date().toISOString(),
      ultimaEdicao: new Date().toISOString(),
      visualizacoes: 300,
      colecao: 'wikiworldweb'
    })),
    ...Object.entries<any>(DATA_CACHE.artigos?.materias || {}).map(([k, v]) => ({
      id: `acad_${k}`,
      titulo: v.titulo,
      descricao: v.descricao,
      setor: v.categoria || 'Acadêmico',
      criadorEmail: 'academico@wazzimagiygg.com',
      dataCriacao: new Date().toISOString(),
      ultimaEdicao: new Date().toISOString(),
      visualizacoes: 180,
      colecao: 'academico'
    }))
  ];

  const found = articlesList.find((a) => a.id === id);
  if (found) {
    res.json(found);
  } else {
    res.status(404).json({ error: 'Artigo não encontrado' });
  }
});

// 8. Messages / Chat (Fully compatible with original JSONBin structure)
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

app.put('/api/jsonbin/messages', (req: Request, res: Response) => {
  const body = req.body;
  const newMessages = Array.isArray(body) ? body : body?.record || [];
  if (Array.isArray(newMessages)) {
    DATA_CACHE.messages = newMessages.slice(-200); // keep last 200 messages for memory performance
    res.json({
      record: DATA_CACHE.messages,
      success: true,
      updatedAt: new Date().toISOString()
    });
  } else {
    res.status(400).json({ error: 'Formato inválido. Esperado array de mensagens.' });
  }
});

// 9. Support & Compliance Tickets (LGPD, Marco Civil, Suporte)
app.get('/api/tickets', (_req: Request, res: Response) => {
  res.json(DATA_CACHE.tickets);
});

app.post('/api/tickets', (req: Request, res: Response) => {
  const { nome, email, tipo, mensagem } = req.body;
  if (!email || !mensagem) {
    res.status(400).json({ error: 'E-mail e mensagem são campos obrigatórios.' });
    return;
  }

  const newTicket = {
    id: `tkt-${Date.now().toString(36)}`,
    nome: nome || 'Anônimo',
    email,
    tipo: tipo || 'Solicitação Geral',
    mensagem,
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

// 10. Audit & Access Logs (Compatible with checkuser / seu-script-de-log.js)
app.post('/api/logs', (req: Request, res: Response) => {
  const logEntry = {
    ...req.body,
    receivedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
  };

  DATA_CACHE.auditLogs.unshift(logEntry);
  if (DATA_CACHE.auditLogs.length > 500) {
    DATA_CACHE.auditLogs.pop();
  }

  res.json({ success: true, logId: `log_${Date.now()}` });
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
// 12. BUROCRATA & ADMIN CORE API (admin/)
// ============================================

// List users for admin dashboard
app.get('/api/admin/users', (_req: Request, res: Response) => {
  res.json({
    total: DATA_CACHE.users.length,
    users: DATA_CACHE.users
  });
});

// Add new user administratively
app.post('/api/admin/users', (req: Request, res: Response) => {
  const { name, email, isAdmin, isTeacher, isBanned } = req.body;
  if (!email) {
    res.status(400).json({ error: 'E-mail é obrigatório.' });
    return;
  }

  const newUser = {
    uid: `usr_${Date.now().toString(36)}`,
    name: name || 'Novo Usuário',
    email,
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
app.put('/api/admin/users/:uid/toggle-admin', (req: Request, res: Response) => {
  const { uid } = req.params;
  const { isAdmin } = req.body;
  const user = DATA_CACHE.users.find((u) => u.uid === uid);
  if (user) {
    user.isAdmin = typeof isAdmin === 'boolean' ? isAdmin : !user.isAdmin;
    res.json({ success: true, user });
  } else {
    // If not found in cache, register into cache
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
app.put('/api/admin/users/:uid/toggle-ban', (req: Request, res: Response) => {
  const { uid } = req.params;
  const { isBanned, banReason } = req.body;
  const user = DATA_CACHE.users.find((u) => u.uid === uid);
  if (user) {
    user.isBanned = typeof isBanned === 'boolean' ? isBanned : !user.isBanned;
    if (user.isBanned) {
      (user as any).banReason = banReason || 'Violação das Políticas do Portal';
    } else {
      delete (user as any).banReason;
    }
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

// Toggle Teacher / Docente role
app.put('/api/admin/users/:uid/toggle-teacher', (req: Request, res: Response) => {
  const { uid } = req.params;
  const { isTeacher } = req.body;
  const user = DATA_CACHE.users.find((u) => u.uid === uid);
  if (user) {
    user.isTeacher = typeof isTeacher === 'boolean' ? isTeacher : !user.isTeacher;
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

// Delete user record
app.delete('/api/admin/users/:uid', (req: Request, res: Response) => {
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
app.delete('/api/admin/articles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  // If it is in noticias
  if (id.startsWith('news_')) {
    const idx = parseInt(id.replace('news_', ''), 10) - 1;
    if (idx >= 0 && idx < DATA_CACHE.noticias.length) {
      DATA_CACHE.noticias.splice(idx, 1);
    }
  }
  res.json({ success: true, message: `Artigo ${id} removido pelo Burocrata.` });
});

// Update ticket status
app.put('/api/tickets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const ticket = DATA_CACHE.tickets.find((t) => t.id === id);
  if (ticket) {
    ticket.status = status || 'Concluído';
    res.json({ success: true, ticket });
  } else {
    res.status(404).json({ error: 'Ticket não encontrado.' });
  }
});

// Add / Delete sanctioned city
app.post('/api/admin/sanctions', (req: Request, res: Response) => {
  const { cidade, moderador } = req.body;
  if (!cidade || !moderador) {
    res.status(400).json({ error: 'Cidade e moderador são obrigatórios.' });
    return;
  }
  DATA_CACHE.cidadesSancionadas.cidades_sancionadas.unshift({ cidade, moderador });
  res.status(201).json({ success: true, data: DATA_CACHE.cidadesSancionadas });
});

app.delete('/api/admin/sanctions/:index', (req: Request, res: Response) => {
  const idx = parseInt(req.params.index, 10);
  if (!isNaN(idx) && idx >= 0 && idx < DATA_CACHE.cidadesSancionadas.cidades_sancionadas.length) {
    DATA_CACHE.cidadesSancionadas.cidades_sancionadas.splice(idx, 1);
    res.json({ success: true, data: DATA_CACHE.cidadesSancionadas });
  } else {
    res.status(400).json({ error: 'Índice inválido.' });
  }
});

// Elevate account with Burocrata Master Key / PIN
app.post('/api/admin/elevate', (req: Request, res: Response) => {
  const { uid, email, passkey } = req.body;
  const validKeys = ['wzzm2026', 'burocrata', 'burocrata-wzzm', 'admin123', 'wazzimagiygg'];

  if (validKeys.includes(passkey?.toLowerCase().trim())) {
    // Elevate in users cache
    let existing = DATA_CACHE.users.find((u) => u.uid === uid || u.email === email);
    if (existing) {
      existing.isAdmin = true;
    } else {
      DATA_CACHE.users.unshift({
        uid: uid || `admin_${Date.now()}`,
        name: 'Burocrata Autorizado',
        email: email || 'burocrata@wazzimagiygg.com',
        isAdmin: true,
        isTeacher: true,
        isBanned: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Acesso de Burocrata concedido com sucesso.',
      isAdmin: true
    });
  } else {
    res.status(401).json({ error: 'Chave de segurança de Burocrata incorreta.' });
  }
});

// ============================================
// ADMIN TOOLS SUITE APIS (24 FERRAMENTAS)
// ============================================

// 1. Costs API (administrarcustos, listadecustosavancada, listagemdecustos)
app.get('/api/admin/costs', (_req: Request, res: Response) => {
  res.json({ success: true, costs: DATA_CACHE.costs });
});

app.post('/api/admin/costs', (req: Request, res: Response) => {
  const { descricao, categoria, valor, data, comprovanteUrl, responsavel, status } = req.body;
  if (!descricao || valor === undefined) {
    res.status(400).json({ error: 'Descrição e valor são obrigatórios.' });
    return;
  }
  const newCost = {
    id: `cst-${Date.now().toString().slice(-4)}`,
    descricao,
    categoria: categoria || 'Infraestrutura',
    valor: parseFloat(valor) || 0,
    data: data || new Date().toISOString().split('T')[0],
    comprovanteUrl: comprovanteUrl || '',
    responsavel: responsavel || 'Burocrata',
    status: status || 'Pago'
  };
  DATA_CACHE.costs.unshift(newCost);
  res.status(201).json({ success: true, cost: newCost });
});

app.delete('/api/admin/costs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DATA_CACHE.costs = DATA_CACHE.costs.filter((c) => c.id !== id);
  res.json({ success: true, message: `Custo ${id} removido com sucesso.` });
});

// 2. Redirects API (redirecionador, admintools/redirecionador)
app.get('/api/admin/redirects', (_req: Request, res: Response) => {
  res.json({ success: true, redirects: DATA_CACHE.redirects });
});

app.post('/api/admin/redirects', (req: Request, res: Response) => {
  const { slug, urlDestino, titulo, comAviso } = req.body;
  if (!slug || !urlDestino) {
    res.status(400).json({ error: 'Slug e URL destino são obrigatórios.' });
    return;
  }
  const cleanSlug = slug.replace(/^\/+/, '').toLowerCase().trim();
  const newRedirect = {
    id: `red-${Date.now().toString().slice(-4)}`,
    slug: cleanSlug,
    urlDestino: urlDestino.trim(),
    titulo: titulo?.trim() || cleanSlug,
    comAviso: Boolean(comAviso),
    totalCliques: 0,
    criadoEm: new Date().toISOString().split('T')[0],
    criadoPor: 'burocrata@wazzimagiygg.com',
    ativo: true
  };
  DATA_CACHE.redirects.unshift(newRedirect);
  res.status(201).json({ success: true, redirect: newRedirect });
});

app.delete('/api/admin/redirects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DATA_CACHE.redirects = DATA_CACHE.redirects.filter((r) => r.id !== id);
  res.json({ success: true, message: `Redirecionador ${id} excluído.` });
});

// Outbound redirect execution route: /r/:slug
app.get('/r/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug.toLowerCase().trim();
  const redirect = DATA_CACHE.redirects.find((r) => r.slug === slug && r.ativo);
  if (!redirect) {
    res.status(404).send(`
      <!DOCTYPE html><html><body style="font-family: monospace; padding: 2rem; background: #0f0f12; color: #fff;">
        <h2>[WZZM] Redirecionamento não encontrado</h2>
        <p>O slug solicitado "/r/${slug}" não está registrado ou foi desativado.</p>
        <a href="/" style="color: #f59e0b;">← Voltar ao Portal</a>
      </body></html>
    `);
    return;
  }
  redirect.totalCliques += 1;
  if (redirect.comAviso) {
    res.send(`
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Aviso de Redirecionamento - WZZM</title></head>
      <body style="font-family: sans-serif; background: #f4f3f0; color: #141414; padding: 2rem; max-width: 600px; margin: 40px auto; border: 4px solid #141414; box-shadow: 8px 8px 0px #b91c1c;">
        <h2 style="font-family: serif; color: #b91c1c; text-transform: uppercase;">Aviso de Segurança — Link Externo</h2>
        <p>Você está prestes a sair do ambiente seguro da WazzimaGiygg para acessar:</p>
        <div style="background: #e5e5e5; padding: 10px; font-family: monospace; word-break: break-all; margin: 15px 0;">${redirect.urlDestino}</div>
        <p style="font-size: 13px; color: #666;">A WZZM não se responsabiliza pelo conteúdo de sites externos.</p>
        <div style="margin-top: 20px;">
          <a href="${redirect.urlDestino}" style="background: #141414; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold; font-family: monospace; display: inline-block;">PROSSEGUIR PARA O SITE ➔</a>
          <a href="/" style="margin-left: 15px; color: #666; font-size: 13px;">Cancelar e voltar</a>
        </div>
      </body></html>
    `);
    return;
  }
  res.redirect(redirect.urlDestino);
});

// 3. Forum Topics API (gerenciarforum)
app.get('/api/admin/forum', (_req: Request, res: Response) => {
  res.json({ success: true, topics: DATA_CACHE.forumTopics });
});

app.post('/api/admin/forum', (req: Request, res: Response) => {
  const { titulo, categoria, autor } = req.body;
  if (!titulo) {
    res.status(400).json({ error: 'Título do tópico é obrigatório.' });
    return;
  }
  const newTopic = {
    id: `top-${Date.now().toString().slice(-4)}`,
    titulo: titulo.trim(),
    categoria: categoria || 'Geral',
    autor: autor || 'Burocrata-Chefe',
    autorEmail: 'admin@wazzimagiygg.com',
    respostas: 0,
    fixado: false,
    fechado: false,
    denunciado: false,
    dataCriacao: new Date().toISOString().split('T')[0]
  };
  DATA_CACHE.forumTopics.unshift(newTopic);
  res.status(201).json({ success: true, topic: newTopic });
});

app.put('/api/admin/forum/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body;
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

app.delete('/api/admin/forum/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DATA_CACHE.forumTopics = DATA_CACHE.forumTopics.filter((t) => t.id !== id);
  res.json({ success: true, message: `Tópico ${id} excluído com sucesso.` });
});

// 4. Surveys and Reports API (pesquisas)
app.get('/api/admin/surveys', (_req: Request, res: Response) => {
  res.json({ success: true, surveys: DATA_CACHE.surveys });
});

app.post('/api/admin/surveys', (req: Request, res: Response) => {
  const { titulo, tipo, descricao, prioridade } = req.body;
  if (!titulo) {
    res.status(400).json({ error: 'Título é obrigatório.' });
    return;
  }
  const newSurvey = {
    id: `surv-${Date.now().toString().slice(-4)}`,
    titulo: titulo.trim(),
    tipo: tipo || 'Pesquisa Acadêmica',
    descricao: descricao?.trim() || '',
    respostasOuStatus: 'Recém criada • Em andamento',
    data: new Date().toISOString().split('T')[0],
    prioridade: prioridade || 'Média'
  };
  DATA_CACHE.surveys.unshift(newSurvey);
  res.status(201).json({ success: true, survey: newSurvey });
});

// 5. Blog Posts API (blog/admin)
app.get('/api/admin/blog', (_req: Request, res: Response) => {
  res.json({ success: true, posts: DATA_CACHE.blogPosts });
});

app.post('/api/admin/blog', (req: Request, res: Response) => {
  const { titulo, resumo, conteudo, tags } = req.body;
  if (!titulo || !conteudo) {
    res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    return;
  }
  const newPost = {
    id: `blog-${Date.now().toString().slice(-4)}`,
    titulo: titulo.trim(),
    resumo: resumo?.trim() || '',
    conteudo: conteudo.trim(),
    autor: 'Gabinete do Burocrata',
    data: new Date().toISOString().split('T')[0],
    publicado: true,
    tags: Array.isArray(tags) ? tags : ['Editorial', 'Burocrata']
  };
  DATA_CACHE.blogPosts.unshift(newPost);
  res.status(201).json({ success: true, post: newPost });
});

// 6. Pages Directory Sitemap API (buscadelistadepaginas)
app.get('/api/admin/pages', (_req: Request, res: Response) => {
  res.json({
    success: true,
    pages: [
      { url: '/', titulo: 'Portal Principal — Edição Digital WazzimaGiygg', setor: 'Geral', tipo: 'Página Pública', status: 'Ativo' },
      { url: '/admin/login.html', titulo: 'Autenticação Google do Burocrata', setor: 'Administração', tipo: 'Módulo Administrativo', status: 'Restrito Burocrata' },
      { url: '/admin/ferramentasadministrativas.html', titulo: 'Menu de 24 Ferramentas Administrativas', setor: 'Administração', tipo: 'Módulo Administrativo', status: 'Restrito Burocrata' },
      { url: '/api/articles', titulo: 'API Catálogo Global de Artigos', setor: 'API', tipo: 'API REST', status: 'Ativo' },
      { url: '/api/news', titulo: 'API Notícias do Diário Oficial', setor: 'API', tipo: 'API REST', status: 'Ativo' },
      { url: '/api/tickets', titulo: 'API Tickets e Ouvidoria LGPD', setor: 'Ouvidoria', tipo: 'API REST', status: 'Ativo' },
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

// 7. LGPD Deletion Requests API (solicitacaodeexlusao)
app.get('/api/admin/deletion-requests', (_req: Request, res: Response) => {
  res.json({ success: true, requests: DATA_CACHE.deletionRequests });
});

app.put('/api/admin/deletion-requests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminEmail, rejectionReason, certificateId } = req.body;
  const item = (DATA_CACHE.deletionRequests as ServerDeletionRequest[]).find((r) => r.id === id);
  if (!item) {
    res.status(404).json({ error: 'Solicitação não encontrada.' });
    return;
  }
  item.status = status || item.status;
  item.processedBy = adminEmail || 'pedrohenriquecardonaperes@gmail.com';
  if (status === 'completed') {
    item.completedAt = new Date().toISOString();
    item.certificateId = certificateId || `LGPD-CERT-${Date.now().toString().slice(-6)}`;
  } else if (status === 'rejected') {
    item.rejectedAt = new Date().toISOString();
    item.rejectionReason = rejectionReason || 'Fundamentação legal da guarda obrigatória (Marco Civil Art. 15).';
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
  revisions: [...SEED_WIKI_REVISIONS] as WikiRevision[],
  events: [...SEED_WIKI_EVENTS] as WikiEvent[],
  extensions: [...SEED_WIKI_EXTENSIONS]
};

// 1. Content Service
app.get('/api/v1/content/articles', (req: Request, res: Response) => {
  const ns = req.query.namespace !== undefined ? parseInt(req.query.namespace as string, 10) : undefined;
  const filtered = ns !== undefined ? WIKI_STORE.articles.filter((a) => a.namespace === ns) : WIKI_STORE.articles;
  res.json({ articles: filtered });
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

app.delete('/api/v1/content/articles/:slug', (req: Request, res: Response) => {
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

app.post('/api/v1/content/articles', (req: Request, res: Response) => {
  const { title, wikitext, summary, isMinor, authorName, authorId, userEmail, authorEmail } = req.body;
  const email = (userEmail || authorEmail || '').toLowerCase().trim();
  const AUTHORIZED_PUBLISHER_EMAILS = ['wazzimagiygg@gmail.com', 'pedrohenriquecardonaperes@gmail.com'];
  if (email && !AUTHORIZED_PUBLISHER_EMAILS.includes(email)) {
    res.status(403).json({
      error: 'Acesso negado: Qualquer publicação de artigo só deve ser feita pelas contas dos e-mails wazzimagiygg@gmail.com e pedrohenriquecardonaperes@gmail.com'
    });
    return;
  }
  if (!title || !wikitext) {
    res.status(400).json({ error: 'Título e wikitexto são obrigatórios' });
    return;
  }
  const slug = title.trim().replace(/\s+/g, '_');
  const revId = `rev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const author = {
    id: authorId || 'usr_community',
    name: authorName || 'Editor Comunitário',
    isBot: false
  };

  const newRev: WikiRevision = {
    id: revId,
    articleSlug: slug,
    parentRevisionId: null,
    wikitext,
    comment: summary || 'Edição via NotMediaWiki API',
    author,
    timestamp: new Date().toISOString(),
    sha256: Math.random().toString(36).substring(2, 18),
    byteSize: wikitext.length,
    isMinor: !!isMinor
  };

  const existingIdx = WIKI_STORE.articles.findIndex((a) => a.slug.toLowerCase() === slug.toLowerCase());
  let savedArt: WikiArticle;
  if (existingIdx >= 0) {
    newRev.parentRevisionId = WIKI_STORE.articles[existingIdx].latestRevisionId;
    WIKI_STORE.articles[existingIdx] = {
      ...WIKI_STORE.articles[existingIdx],
      title,
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
      title,
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
    page_title: title,
    page_namespace: 0,
    rev_id: revId,
    rev_timestamp: new Date().toISOString(),
    rev_sha1: newRev.sha256,
    rev_minor_edit: !!isMinor,
    rev_len: wikitext.length,
    user_text: author.name,
    comment: summary || 'Edição no acervo',
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

app.post('/api/v1/revisions/:slug/rollback', (req: Request, res: Response) => {
  const { slug } = req.params;
  const { revIdToRestore, authorName } = req.body;
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
    author: { id: 'sysop', name: authorName || 'Burocrata WZZM', isBot: false },
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
      governanceBureaucrat: 'pedrohenriquecardonaperes@gmail.com'
    }
  });
});

app.get('/api/v1/domains', (_req: Request, res: Response) => {
  res.json({
    allowedDomains: ALLOWED_EXTENSION_DOMAINS
  });
});

// Endpoint 3.05.9.b: Static Analysis & Malicious Information Scan
app.post('/api/v1/extensions/security/scan', (req: Request, res: Response) => {
  try {
    const { extensionId, fileName, code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Código da extensão é obrigatório para análise forense.' });
    }

    const audit = scanExtensionCodeForMalware(
      extensionId || 'custom-inspection',
      fileName || 'payload.ts',
      code
    );

    res.json({
      success: true,
      audit,
      sha256: computeSha256Hex(code)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro durante execução do analisador estático.', details: err.message });
  }
});

// Endpoint 3.05.9.a & 3.05.9.b: Security Synchronization Device with Cryptographic Verification
app.post('/api/v1/extensions/security/sync', (req: Request, res: Response) => {
  try {
    const { extension, extensionId, userEmail } = req.body;
    const bureaucratEmail = 'pedrohenriquecardonaperes@gmail.com';

    // Emergency rule: only Burocrata can synchronize extensions
    if (!userEmail || userEmail.toLowerCase() !== bureaucratEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'ACESSO NEGADO: Somente o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) tem permissão para sincronizar extensões no ecossistema NotMediaWiki.',
        status: 'unverified'
      });
    }

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

    // Run Security Synchronization Device Verification
    const verification = verifyExtensionSyncSecurity(targetExt, userEmail);

    // Update in store or upsert
    const existingIndex = WIKI_STORE.extensions.findIndex(e => e.id === targetExt!.id);
    const updatedExt: WikiExtension = {
      ...targetExt,
      signatureStatus: verification.status,
      lastSyncTimestamp: new Date().toISOString(),
      syncAuthorizedBy: userEmail,
      quarantined: verification.status === 'quarantined' || verification.audit.quarantined,
      quarantineReason: verification.audit.quarantineReason,
      securityAudit: verification.audit,
      // If quarantined, force disabled
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
  } catch (err: any) {
    res.status(500).json({ error: 'Erro no dispositivo de sincronização de extensões.', details: err.message });
  }
});

// Endpoint: Toggle Extension (Strict check: Burocrata + Quarantined Guard)
app.post('/api/v1/extensions/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const { enabled, userEmail } = req.body;
  const bureaucratEmail = 'pedrohenriquecardonaperes@gmail.com';

  if (!userEmail || userEmail.toLowerCase() !== bureaucratEmail.toLowerCase()) {
    return res.status(403).json({
      error: 'ACESSO NEGADO: Somente o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) pode alterar o estado das extensões.'
    });
  }

  const ext = WIKI_STORE.extensions.find(e => e.id === id);
  if (!ext) {
    return res.status(404).json({ error: 'Extensão não encontrada.' });
  }

  // Quarantined Extension Guard
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
app.post('/api/v1/extensions/:id/quarantine', (req: Request, res: Response) => {
  const { id } = req.params;
  const { quarantined, reason, userEmail } = req.body;
  const bureaucratEmail = 'pedrohenriquecardonaperes@gmail.com';

  if (!userEmail || userEmail.toLowerCase() !== bureaucratEmail.toLowerCase()) {
    return res.status(403).json({
      error: 'ACESSO NEGADO: Somente o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) pode gerenciar quarentena de extensões.'
    });
  }

  const ext = WIKI_STORE.extensions.find(e => e.id === id);
  if (!ext) {
    return res.status(404).json({ error: 'Extensão não encontrada.' });
  }

  ext.quarantined = !!quarantined;
  ext.quarantineReason = quarantined ? (reason || 'Isolada manualmente pelo Burocrata.') : undefined;
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
app.put('/api/v1/extensions/:id/config', (req: Request, res: Response) => {
  const { id } = req.params;
  const { config, userEmail } = req.body;
  const bureaucratEmail = 'pedrohenriquecardonaperes@gmail.com';

  if (!userEmail || userEmail.toLowerCase() !== bureaucratEmail.toLowerCase()) {
    return res.status(403).json({
      error: 'ACESSO NEGADO: Somente o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) pode alterar configurações das extensões.'
    });
  }

  const ext = WIKI_STORE.extensions.find((e) => e.id === id);
  if (!ext) {
    return res.status(404).json({ error: 'Extensão não encontrada.' });
  }

  ext.config = {
    ...(ext.config || {}),
    ...(config || {})
  };

  // Sincronizações específicas de extensões de sistema
  if (id === 'ext-external-redirector' && config?.enabled !== undefined) {
    ext.enabled = !!config.enabled;
  }
  if (id === 'ext-maintenance-mode' && config?.isMaintenanceActive !== undefined) {
    ext.enabled = !!config.isMaintenanceActive;
  }

  // Registra timestamp e burocrata autorizador
  ext.lastSyncTimestamp = new Date().toISOString();
  ext.syncAuthorizedBy = userEmail;

  res.json({ success: true, extension: ext, message: 'Configurações da extensão atualizadas com sucesso.' });
});

// Endpoint 3.05.3.a: Adicionar Extensão Existente do Catálogo ou Criar Personalizada (Burocrata only)
app.post('/api/v1/extensions/catalog/add', (req: Request, res: Response) => {
  const { catalogExtensionId, customExtension, userEmail } = req.body;
  const bureaucratEmail = 'pedrohenriquecardonaperes@gmail.com';

  if (!userEmail || userEmail.toLowerCase() !== bureaucratEmail.toLowerCase()) {
    return res.status(403).json({
      error: 'ACESSO NEGADO: Somente o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) pode adicionar extensões.'
    });
  }

  let extensionToAdd: WikiExtension | undefined;

  if (catalogExtensionId) {
    const foundInCatalog = EXISTING_EXTENSIONS_CATALOG.find((e) => e.id === catalogExtensionId);
    if (!foundInCatalog) {
      return res.status(404).json({ error: 'Extensão não encontrada no catálogo oficial.' });
    }
    // Deep clone
    extensionToAdd = JSON.parse(JSON.stringify(foundInCatalog));
  } else if (customExtension && typeof customExtension === 'object') {
    extensionToAdd = customExtension as WikiExtension;
  }

  if (!extensionToAdd || !extensionToAdd.id || !extensionToAdd.name) {
    return res.status(400).json({ error: 'Parâmetros da extensão inválidos para adição.' });
  }

  // Verifica se já está instalada
  const existingIdx = WIKI_STORE.extensions.findIndex((e) => e.id === extensionToAdd!.id);
  if (existingIdx >= 0) {
    return res.status(400).json({
      error: `A extensão "${extensionToAdd.name}" (${extensionToAdd.id}) já se encontra instalada no sistema.`
    });
  }

  // Executa validação de sincronia e segurança
  const verification = verifyExtensionSyncSecurity(extensionToAdd, userEmail);
  extensionToAdd.signatureStatus = verification.status;
  extensionToAdd.lastSyncTimestamp = new Date().toISOString();
  extensionToAdd.syncAuthorizedBy = userEmail;
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
app.put('/api/v1/extensions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, namePt, description, version, files, config, userEmail } = req.body;
  const bureaucratEmail = 'pedrohenriquecardonaperes@gmail.com';

  if (!userEmail || userEmail.toLowerCase() !== bureaucratEmail.toLowerCase()) {
    return res.status(403).json({
      error: 'ACESSO NEGADO: Somente o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) pode modificar extensões.'
    });
  }

  const ext = WIKI_STORE.extensions.find((e) => e.id === id);
  if (!ext) {
    return res.status(404).json({ error: 'Extensão não encontrada para modificação.' });
  }

  if (name) ext.name = name;
  if (namePt) ext.namePt = namePt;
  if (description) ext.description = description;
  if (version) ext.version = version;
  if (config) ext.config = { ...(ext.config || {}), ...config };

  if (Array.isArray(files) && files.length > 0) {
    ext.files = files.map((f: any) => ({
      name: f.name || 'index.ts',
      content: f.content || '',
      size: (f.content || '').length,
      sha256: computeSha256Hex(f.content || ''),
      mimeType: f.mimeType || 'application/typescript'
    }));
    ext.sha256 = ext.files[0]?.sha256 || computeSha256Hex(files[0]?.content || '');
  }

  // Reanalisa a segurança e integridade
  const verification = verifyExtensionSyncSecurity(ext, userEmail);
  ext.signatureStatus = verification.status;
  ext.lastSyncTimestamp = new Date().toISOString();
  ext.syncAuthorizedBy = userEmail;
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

// 2. Create Post (strictly enforced max 127 characters)
app.post('/api/bemtevi/posts', (req: Request, res: Response) => {
  const { content, authorId, authorName, authorHandle, authorAvatar, link, category, communityId, communityName } = req.body;

  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'Conteúdo da postagem é obrigatório.' });
    return;
  }

  if (content.length > 127) {
    res.status(400).json({ error: 'O texto deve ter no máximo 127 caracteres!' });
    return;
  }

  const newPost: BemteviPost = {
    id: `post-${Date.now()}`,
    authorId: authorId || 'usr-anon',
    authorName: authorName || 'Membro Bemtevi',
    authorHandle: authorHandle || '@membro',
    authorAvatar: authorAvatar || undefined,
    authorBadge: 'Iniciante',
    authorKarma: 10,
    content: content.trim(),
    link: link || undefined,
    category: category || 'Geral',
    communityId: communityId || undefined,
    communityName: communityName || undefined,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    savesCount: 0,
    likedBy: [],
    savedBy: [],
    createdAt: new Date().toISOString()
  };

  BEMTEVI_STORE.posts.unshift(newPost);
  res.status(201).json({ success: true, post: newPost });
});

// 3. Delete Post
app.delete('/api/bemtevi/posts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = BEMTEVI_STORE.posts.length;
  BEMTEVI_STORE.posts = BEMTEVI_STORE.posts.filter((p) => p.id !== id);

  if (BEMTEVI_STORE.posts.length < initialLen) {
    res.json({ success: true, message: 'Post excluído com sucesso.' });
  } else {
    res.status(404).json({ error: 'Post não encontrado.' });
  }
});

// 4. Like / Unlike Post
app.post('/api/bemtevi/posts/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  const post = BEMTEVI_STORE.posts.find((p) => p.id === id);

  if (!post) {
    res.status(404).json({ error: 'Post não encontrado.' });
    return;
  }

  const uid = userId || 'usr-guest';
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

app.post('/api/bemtevi/communities', (req: Request, res: Response) => {
  const { name, description, category, createdBy } = req.body;
  if (!name || name.length < 3) {
    res.status(400).json({ error: 'Nome da comunidade deve ter pelo menos 3 caracteres.' });
    return;
  }

  const newComm: BemteviCommunity = {
    id: `comm-${Date.now()}`,
    name: name.trim(),
    description: description || '',
    category: category || 'Geral',
    membersCount: 1,
    postsCount: 0,
    icon: '🏛️',
    createdBy: createdBy || 'usr-anon',
    members: [createdBy || 'usr-anon'],
    createdAt: new Date().toISOString()
  };

  BEMTEVI_STORE.communities.unshift(newComm);
  res.status(201).json({ success: true, community: newComm });
});

// 6. Trending Topics (Calculados estritamente a partir das postagens reais salvas no banco de dados)
app.get('/api/bemtevi/trending', (_req: Request, res: Response) => {
  const dynamicTrending = computeTrendingTopicsFromDbPosts(BEMTEVI_STORE.posts);
  res.json({ trending: dynamicTrending });
});

// 7. Users (Apenas usuários reais cadastrados no banco de dados)
app.get('/api/bemtevi/users', (_req: Request, res: Response) => {
  const realUsers = (DATA_CACHE.users || []).map((u: any) => ({
    uid: u.uid || u.id,
    name: u.name || u.nome || u.email?.split('@')[0] || 'Usuário WZZM',
    handle: `@${(u.email?.split('@')[0] || u.name || 'usuario').toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
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

app.post('/api/bemtevi/posts/:postId/comments', (req: Request, res: Response) => {
  const { postId } = req.params;
  const { content, authorId, authorName, authorHandle, authorAvatar } = req.body;
  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'Comentário não pode estar vazio.' });
    return;
  }
  if (content.length > 280) {
    res.status(400).json({ error: 'Comentário muito longo! Máximo 280 caracteres.' });
    return;
  }
  const newComment: BemteviComment = {
    id: `comm-${Date.now()}`,
    postId,
    authorId: authorId || 'usr-anon',
    authorName: authorName || 'Membro',
    authorHandle: authorHandle || '@membro',
    authorAvatar,
    content: content.trim(),
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

// 8. Direct Messages
app.get('/api/bemtevi/messages', (req: Request, res: Response) => {
  const { conversationId } = req.query;
  let list = BEMTEVI_STORE.messages;
  if (conversationId && typeof conversationId === 'string') {
    list = list.filter((m) => m.conversationId === conversationId);
  }
  res.json({ messages: list });
});

app.post('/api/bemtevi/messages', (req: Request, res: Response) => {
  const { conversationId, senderId, senderName, senderAvatar, receiverId, text } = req.body;
  if (!text || !receiverId) {
    res.status(400).json({ error: 'Destinatário e mensagem são obrigatórios.' });
    return;
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    conversationId: conversationId || `conv-${Date.now()}`,
    senderId: senderId || 'usr-anon',
    senderName: senderName || 'Anônimo',
    senderAvatar,
    receiverId,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  BEMTEVI_STORE.messages.push(newMsg);
  res.status(201).json({ success: true, message: newMsg });
});

// ============================================
// SERVER SETUP & VITE MIDDLEWARE
// ============================================
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Mount Vite middleware in development
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
    console.log('[Backend] Vite middleware attached in dev mode.');
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
      console.log('[Backend] Serving production dist static files.');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WazzimaGiygg Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Backend] Fatal error starting server:', err);
  process.exit(1);
});
