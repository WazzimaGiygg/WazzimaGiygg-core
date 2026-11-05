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
  auditLogs: [] as any[]
};

// ============================================
// API ROUTES
// ============================================

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
