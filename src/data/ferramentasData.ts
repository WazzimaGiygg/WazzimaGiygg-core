/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Model definitions for the 24 Administrative Tools

export interface CostItem {
  id: string;
  descricao: string;
  categoria: "Infraestrutura" | "Domínio & DNS" | "Segurança & SSL" | "Licenciamento" | "Servidor & Banco";
  valor: number;
  data: string;
  comprovanteUrl?: string;
  responsavel: string;
  status: "Pago" | "Pendente" | "Agendado";
}

export interface RedirectLink {
  id: string;
  slug: string;
  urlDestino: string;
  titulo: string;
  comAviso: boolean;
  totalCliques: number;
  criadoEm: string;
  criadoPor: string;
  ativo: boolean;
}

export interface ForumTopic {
  id: string;
  titulo: string;
  categoria: string;
  autor: string;
  autorEmail: string;
  respostas: number;
  fixado: boolean;
  fechado: boolean;
  denunciado: boolean;
  dataCriacao: string;
}

export interface SurveyItem {
  id: string;
  titulo: string;
  tipo: "Pesquisa Acadêmica" | "Denúncia Investigativa" | "Enquete Pública";
  descricao: string;
  respostasOuStatus: string;
  data: string;
  prioridade: "Baixa" | "Média" | "Alta" | "Urgente";
}

export interface AdminBlogPost {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  autor: string;
  data: string;
  publicado: boolean;
  tags: string[];
}

export interface InternalPageMeta {
  url: string;
  titulo: string;
  setor: string;
  tipo: "Página Pública" | "Módulo Administrativo" | "API REST" | "Documento";
  status: "Ativo" | "Homologado" | "Restrito Burocrata";
}

// Initial Data Sets
export const INITIAL_COSTS: CostItem[] = [
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
  },
  {
    id: "cst-004",
    descricao: "Firewall WAF & Proteção Anti-DDoS",
    categoria: "Segurança & SSL",
    valor: 60.00,
    data: "2026-11-05",
    comprovanteUrl: "",
    responsavel: "Auditoria Forense",
    status: "Agendado"
  }
];

export const INITIAL_REDIRECTS: RedirectLink[] = [
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
  },
  {
    id: "red-03",
    slug: "parceiro-externo",
    urlDestino: "https://exemplo-pesquisa.org/estudo2026",
    titulo: "Link Externo para Estudo Colaborativo",
    comAviso: true,
    totalCliques: 215,
    criadoEm: "2026-03-01",
    criadoPor: "burocrata@wazzimagiygg.com",
    ativo: true
  }
];

export const INITIAL_FORUM_TOPICS: ForumTopic[] = [
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
  },
  {
    id: "top-103",
    titulo: "Spam identificado na subcoleção de transportes metropolitanos",
    categoria: "Moderação & Denúncias",
    autor: "Leitor Vigilante",
    autorEmail: "vigilante@wzzm.org",
    respostas: 6,
    fixado: false,
    fechado: false,
    denunciado: true,
    dataCriacao: "2026-11-04"
  }
];

export const INITIAL_SURVEYS: SurveyItem[] = [
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
  },
  {
    id: "surv-03",
    titulo: "Consulta Pública sobre inclusão de subcoleção de Arqueologia Digital",
    tipo: "Enquete Pública",
    descricao: "Votação aberta para a comunidade aprovar nova seção temática.",
    respostasOuStatus: "312 votos (88% favoráveis)",
    data: "2026-11-04",
    prioridade: "Baixa"
  }
];

export const INITIAL_BLOG_POSTS: AdminBlogPost[] = [
  {
    id: "blog-01",
    titulo: "Reestruturação Completa da Plataforma WazzimaGiygg em TypeScript",
    resumo: "Migração da arquitetura técnica com integração unificada ao Firestore e máxima segurança.",
    conteudo: "Hoje concluímos a modernização da infraestrutura do portal WazzimaGiygg, garantindo que todas as 5 coleções e o acervo histórico permaneçam 100% íntegros com performance otimizada.",
    autor: "Gabinete do Burocrata",
    data: "2026-11-05",
    publicado: true,
    tags: ["Tecnologia", "TypeScript", "Atualização", "Burocrata"]
  },
  {
    id: "blog-02",
    titulo: "Novo Protocolo de Atendimento LGPD e Ouvidoria Digital",
    resumo: "Implementação de fluxo ágil para exercício de direitos do titular de dados.",
    conteudo: "Em estrita observância à LGPD e ao Marco Civil da Internet, a Ouvidoria WZZM passa a emitir recibos digitais instantâneos de protocolo para solicitações de exclusão de dados.",
    autor: "Departamento Jurídico WZZM",
    data: "2026-10-30",
    publicado: true,
    tags: ["LGPD", "Privacidade", "Direito Digital"]
  }
];

export const SITE_PAGES_DIRECTORY: InternalPageMeta[] = [
  { url: "/", titulo: "Portal Principal — Edição Digital WazzimaGiygg", setor: "Geral", tipo: "Página Pública", status: "Ativo" },
  { url: "/admin/login.html", titulo: "Autenticação Google do Burocrata", setor: "Administração", tipo: "Módulo Administrativo", status: "Restrito Burocrata" },
  { url: "/admin/ferramentasadministrativas.html", titulo: "Menu de 24 Ferramentas Administrativas", setor: "Administração", tipo: "Módulo Administrativo", status: "Restrito Burocrata" },
  { url: "/api/articles", titulo: "API Catálogo Global de Artigos", setor: "API", tipo: "API REST", status: "Ativo" },
  { url: "/api/news", titulo: "API Notícias do Diário Oficial", setor: "API", tipo: "API REST", status: "Ativo" },
  { url: "/api/tickets", titulo: "API Tickets e Ouvidoria LGPD", setor: "Ouvidoria", tipo: "API REST", status: "Ativo" },
  { url: "/api/sanctions", titulo: "API Tabela de Cidades Sancionadas", setor: "Forense", tipo: "API REST", status: "Ativo" },
  { url: "/api/health", titulo: "API Diagnóstico de Conexão Firestore", setor: "Infraestrutura", tipo: "API REST", status: "Ativo" },
  { url: "/colecoes/wikiworldweb", titulo: "Coleção WikiWorldWeb", setor: "Acervo", tipo: "Página Pública", status: "Ativo" },
  { url: "/colecoes/materiadeensaio", titulo: "Coleção Matéria de Ensaio", setor: "Acervo", tipo: "Página Pública", status: "Ativo" },
  { url: "/colecoes/academico", titulo: "Coleção Acadêmico", setor: "Acervo", tipo: "Página Pública", status: "Ativo" },
  { url: "/colecoes/materia", titulo: "Coleção Matérias Didáticas", setor: "Acervo", tipo: "Página Pública", status: "Ativo" },
  { url: "/colecoes/uwgbooks", titulo: "Coleção UWG Books", setor: "Acervo", tipo: "Página Pública", status: "Ativo" }
];
