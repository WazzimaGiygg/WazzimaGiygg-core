import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
  users: [
    {
      uid: 'usr_burocrata_01',
      name: 'Burocrata-Chefe WZZM',
      email: 'admin@wazzimagiygg.com',
      isAdmin: true,
      isBanned: false,
      isTeacher: true,
      createdAt: '2025-05-01T12:00:00.000Z',
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
      { url: '/colecoes/uwgbooks', titulo: 'Coleção UWG Books', setor: 'Acervo', tipo: 'Página Pública', status: 'Ativo' }
    ]
  });
});

// Legacy route compatibility handlers for admin pages
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
