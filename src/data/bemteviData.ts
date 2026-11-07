/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Bem te vi - Rede Social Livre e Colaborativa
 * Repositório: https://github.com/WazzimaGiygg/bemtevi
 * Domínio oficial: https://bemtevi.wazzimagiygg.com/
 */

export interface BemteviPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  authorBadge?: string;
  authorKarma?: number;
  content: string; // Max 127 chars as defined in the repo
  link?: string;
  category: BemteviCategory;
  communityId?: string;
  communityName?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  likedBy: string[];
  savedBy: string[];
  createdAt: string;
}

export interface BemteviComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  content: string; // Max 280 chars
  likesCount: number;
  likedBy: string[];
  createdAt: string;
}

export type BemteviCategory =
  | 'Geral'
  | 'Tecnologia'
  | 'Ciência'
  | 'Arte'
  | 'Música'
  | 'Esportes'
  | 'Games'
  | 'Educação'
  | 'Política'
  | 'Entretenimento';

export const BEMTEVI_CATEGORIES: BemteviCategory[] = [
  'Geral',
  'Tecnologia',
  'Ciência',
  'Arte',
  'Música',
  'Esportes',
  'Games',
  'Educação',
  'Política',
  'Entretenimento'
];

export interface BemteviCommunity {
  id: string;
  name: string;
  description: string;
  category: BemteviCategory;
  membersCount: number;
  postsCount: number;
  icon: string;
  banner?: string;
  createdBy: string;
  members: string[];
  createdAt: string;
}

export interface BemteviUser {
  uid: string;
  name: string;
  handle: string;
  avatar?: string;
  coverImage?: string;
  bio: string;
  karma: number;
  level: string;
  followers: string[];
  following: string[];
  badges: string[];
  role?: string;
  joinedAt: string;
}

export interface BemteviTrendingTopic {
  tag: string;
  category: string;
  postsCount: number;
}

export interface BemteviNotification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'level';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface BemteviDirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

// Karma level calculation as per repository logic
export function getKarmaLevel(karma: number): string {
  if (karma >= 5001) return 'Lendário';
  if (karma >= 1501) return 'Veterano';
  if (karma >= 501) return 'Membro Ativo';
  if (karma >= 201) return 'Entusiasta';
  if (karma >= 51) return 'Iniciante';
  return 'Novato';
}

export function getKarmaBadgeColor(level: string): { bg: string; text: string; border: string } {
  switch (level) {
    case 'Lendário':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' };
    case 'Veterano':
      return { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' };
    case 'Membro Ativo':
      return { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' };
    case 'Entusiasta':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' };
    case 'Iniciante':
      return { bg: 'bg-stone-500/20', text: 'text-stone-300', border: 'border-stone-500/40' };
    default:
      return { bg: 'bg-stone-700/30', text: 'text-stone-400', border: 'border-stone-600' };
  }
}

// Translations dictionary matching translate/bemtevi/locales/*.json
export const BEMTEVI_TRANSLATIONS = {
  'pt-BR': {
    appName: 'Bemtevi',
    appSlogan: 'Uma rede social livre e colaborativa',
    brandHeader: 'WazzimaGiygg',
    subtitle: 'Bemtevi',
    motto: 'Όχι, ο Χρόνος não é ο άρχοντας da γνώσης! - WazzimaGiygg',
    forYou: 'Para Você',
    latest: 'Últimas',
    myPosts: 'Minhas Postagens',
    explore: 'Explorar',
    communities: 'Comunidades',
    messages: 'Mensagens',
    saved: 'Salvos',
    myProfile: 'Meu Perfil',
    createCommunity: 'Criar Comunidade',
    placeholderPost: 'O que está acontecendo? (Máx. 127 caracteres)',
    postButton: 'Postar 🚀',
    linkPlaceholder: '🔗 Link (opcional)',
    loginRequired: 'Faça login para interagir e postar!',
    maxCharLimitNotice: 'Postagens de até 127 caracteres • Microblogging ágil',
    trendingTitle: '🔥 Assuntos do Momento',
    suggestionsTitle: '👥 Sugestões de Conexão',
    karmaTitle: '⭐ Sistema de Karma WZZM',
    commentsTitle: '💬 Comentários',
    sharePost: 'Compartilhar',
    savePost: 'Salvar',
    likePost: 'Curtir',
    deletePost: 'Excluir',
    followers: 'Seguidores',
    following: 'Seguindo',
    karmaPoints: 'Pontos de Karma'
  },
  'en-US': {
    appName: 'Bemtevi',
    appSlogan: 'A free and collaborative social network',
    brandHeader: 'WazzimaGiygg',
    subtitle: 'Bemtevi',
    motto: 'Όχι, ο Χρόνος não é ο άρχοντας da γνώσης! - WazzimaGiygg',
    forYou: 'For You',
    latest: 'Latest',
    myPosts: 'My Posts',
    explore: 'Explore',
    communities: 'Communities',
    messages: 'Messages',
    saved: 'Saved',
    myProfile: 'My Profile',
    createCommunity: 'Create Community',
    placeholderPost: "What's happening? (Max 127 characters)",
    postButton: 'Post 🚀',
    linkPlaceholder: '🔗 Link (optional)',
    loginRequired: 'Sign in to post and interact!',
    maxCharLimitNotice: 'Posts up to 127 characters • Agile microblogging',
    trendingTitle: '🔥 Trending Topics',
    suggestionsTitle: '👥 Who to follow',
    karmaTitle: '⭐ WZZM Karma System',
    commentsTitle: '💬 Comments',
    sharePost: 'Share',
    savePost: 'Save',
    likePost: 'Like',
    deletePost: 'Delete',
    followers: 'Followers',
    following: 'Following',
    karmaPoints: 'Karma Points'
  },
  'es-ES': {
    appName: 'Bemtevi',
    appSlogan: 'Una red social libre y colaborativa',
    brandHeader: 'WazzimaGiygg',
    subtitle: 'Bemtevi',
    motto: 'Όχι, ο Χρόνος não é ο άρχοντας da γνώσης! - WazzimaGiygg',
    forYou: 'Para Ti',
    latest: 'Últimas',
    myPosts: 'Mis Publicaciones',
    explore: 'Explorar',
    communities: 'Comunidades',
    messages: 'Mensajes',
    saved: 'Guardados',
    myProfile: 'Mi Perfil',
    createCommunity: 'Crear Comunidad',
    placeholderPost: '¿Qué está pasando? (Máx. 127 caracteres)',
    postButton: 'Publicar 🚀',
    linkPlaceholder: '🔗 Enlace (opcional)',
    loginRequired: '¡Inicia sesión para publicar e interactuar!',
    maxCharLimitNotice: 'Publicaciones de hasta 127 caracteres • Microblogging ágil',
    trendingTitle: '🔥 Tendencias',
    suggestionsTitle: '👥 A quién seguir',
    karmaTitle: '⭐ Sistema de Karma WZZM',
    commentsTitle: '💬 Comentarios',
    sharePost: 'Compartir',
    savePost: 'Guardar',
    likePost: 'Me gusta',
    deletePost: 'Eliminar',
    followers: 'Seguidores',
    following: 'Siguiendo',
    karmaPoints: 'Puntos de Karma'
  }
};

// Seed Data for Bem te vi
export const SEED_BEMTEVI_USERS: BemteviUser[] = [
  {
    uid: 'usr-pedro',
    name: 'Pedro Peres (Burocrata)',
    handle: '@pedroperes',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Burocrata e administrador oficial do portal WazzimaGiygg & Bemtevi. Conhecimento livre, tecnologia e governança sob o Marco Civil.',
    karma: 5420,
    level: 'Lendário',
    followers: ['usr-sofia', 'usr-carlos', 'usr-mariana', 'usr-ana', 'usr-lucas'],
    following: ['usr-sofia', 'usr-carlos', 'usr-mariana'],
    badges: ['Burocrata Oficial', 'Fundador', 'Marco Civil'],
    role: 'Burocrata',
    joinedAt: '2024-01-01T00:00:00Z'
  },
  {
    uid: 'usr-sofia',
    name: 'Dra. Sofia Alencar',
    handle: '@sofia_alencar',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Pesquisadora em Sistemas Distribuídos e Direito Digital. Membro da comunidade WazzimaGiygg.',
    karma: 1840,
    level: 'Veterano',
    followers: ['usr-pedro', 'usr-lucas', 'usr-ana'],
    following: ['usr-pedro', 'usr-carlos'],
    badges: ['Docente Verificada', 'Pesquisa'],
    role: 'Professor',
    joinedAt: '2024-06-15T00:00:00Z'
  },
  {
    uid: 'usr-carlos',
    name: 'Carlos Tech',
    handle: '@carlos_dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Desenvolvedor Node.js, Parsoid wikitext hacker e entusiasta de software livre.',
    karma: 760,
    level: 'Membro Ativo',
    followers: ['usr-pedro', 'usr-mariana'],
    following: ['usr-pedro', 'usr-sofia'],
    badges: ['Open Source', 'Node.js'],
    joinedAt: '2025-02-10T00:00:00Z'
  },
  {
    uid: 'usr-mariana',
    name: 'Mariana Silva',
    handle: '@mariana_juridico',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Advogada especialista em LGPD, privacidade de dados e Marco Civil da Internet (Lei 12.965/14).',
    karma: 340,
    level: 'Entusiasta',
    followers: ['usr-pedro', 'usr-sofia'],
    following: ['usr-pedro'],
    badges: ['LGPD Compliance'],
    joinedAt: '2025-05-20T00:00:00Z'
  }
];

export const SEED_BEMTEVI_COMMUNITIES: BemteviCommunity[] = [
  {
    id: 'comm-wazzimagiygg',
    name: 'WazzimaGiygg Central',
    description: 'Comunidade geral de discussão, atualizações e projetos do portal WazzimaGiygg.',
    category: 'Geral',
    membersCount: 4120,
    postsCount: 840,
    icon: '🏛️',
    createdBy: 'usr-pedro',
    members: ['usr-pedro', 'usr-sofia', 'usr-carlos', 'usr-mariana'],
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'comm-tecnologia',
    name: 'Tecnologia & Dev Aberto',
    description: 'Discussões sobre microserviços, TypeScript, Node.js, Parsoid e ferramentas descentralizadas.',
    category: 'Tecnologia',
    membersCount: 2890,
    postsCount: 654,
    icon: '💻',
    createdBy: 'usr-carlos',
    members: ['usr-pedro', 'usr-carlos', 'usr-sofia'],
    createdAt: '2024-02-15T00:00:00Z'
  },
  {
    id: 'comm-ciencia',
    name: 'Ciência & Conhecimento',
    description: 'Debates acadêmicos, ensaios científicos e artigos do acervo WZZM.',
    category: 'Ciência',
    membersCount: 1950,
    postsCount: 430,
    icon: '🔬',
    createdBy: 'usr-sofia',
    members: ['usr-pedro', 'usr-sofia'],
    createdAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 'comm-lgpd',
    name: 'Direito Digital & LGPD',
    description: 'Proteção de dados, liberdade de expressão, direitos do usuário e Marco Civil.',
    category: 'Política',
    membersCount: 1420,
    postsCount: 312,
    icon: '⚖️',
    createdBy: 'usr-mariana',
    members: ['usr-pedro', 'usr-mariana'],
    createdAt: '2024-04-10T00:00:00Z'
  },
  {
    id: 'comm-softwarelivre',
    name: 'Wiki & Software Livre',
    description: 'Enciclopédias colaborativas, NotMediaWiki, EventStreams e liberdade informacional.',
    category: 'Educação',
    membersCount: 2100,
    postsCount: 520,
    icon: '📖',
    createdBy: 'usr-pedro',
    members: ['usr-pedro', 'usr-carlos'],
    createdAt: '2024-05-01T00:00:00Z'
  }
];

export const SEED_BEMTEVI_POSTS: BemteviPost[] = [
  {
    id: 'post-1',
    authorId: 'usr-pedro',
    authorName: 'Pedro Peres (Burocrata)',
    authorHandle: '@pedroperes',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authorBadge: 'Burocrata',
    authorKarma: 5420,
    content: 'Bem-vindos ao Bemtevi no WazzimaGiygg! Uma rede social livre, colaborativa e integrada ao acervo. #WazzimaGiygg',
    link: 'https://bemtevi.wazzimagiygg.com/',
    category: 'Geral',
    communityId: 'comm-wazzimagiygg',
    communityName: 'WazzimaGiygg Central',
    likesCount: 42,
    commentsCount: 6,
    sharesCount: 18,
    savesCount: 12,
    likedBy: ['usr-sofia', 'usr-carlos', 'usr-mariana'],
    savedBy: ['usr-sofia'],
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 'post-2',
    authorId: 'usr-carlos',
    authorName: 'Carlos Tech',
    authorHandle: '@carlos_dev',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    authorBadge: 'Dev',
    authorKarma: 760,
    content: 'O motor Parsoid no NotMediaWiki com TypeScript ficou extremamente rápido! Adeus gargalos legados. #NotMediaWiki',
    link: 'https://notmediawiki.wazzimagiygg.com/',
    category: 'Tecnologia',
    communityId: 'comm-tecnologia',
    communityName: 'Tecnologia & Dev Aberto',
    likesCount: 28,
    commentsCount: 3,
    sharesCount: 9,
    savesCount: 7,
    likedBy: ['usr-pedro', 'usr-sofia'],
    savedBy: ['usr-pedro'],
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString()
  },
  {
    id: 'post-3',
    authorId: 'usr-sofia',
    authorName: 'Dra. Sofia Alencar',
    authorHandle: '@sofia_alencar',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    authorBadge: 'Docente',
    authorKarma: 1840,
    content: 'Novo ensaio sobre descentralização e preservação de memória digital disponível no acervo acadêmico! #Ciência',
    link: 'https://wazzimagiygg.com/academico/',
    category: 'Ciência',
    communityId: 'comm-ciencia',
    communityName: 'Ciência & Conhecimento',
    likesCount: 35,
    commentsCount: 4,
    sharesCount: 14,
    savesCount: 19,
    likedBy: ['usr-pedro', 'usr-mariana'],
    savedBy: ['usr-mariana'],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  },
  {
    id: 'post-4',
    authorId: 'usr-mariana',
    authorName: 'Mariana Silva',
    authorHandle: '@mariana_juridico',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    authorBadge: 'LGPD',
    authorKarma: 340,
    content: 'Transparência total no atendimento de solicitações de exclusão de dados e direitos do Marco Civil. #DireitoDigital',
    link: 'https://wazzimagiygg.com/LGPD',
    category: 'Política',
    communityId: 'comm-lgpd',
    communityName: 'Direito Digital & LGPD',
    likesCount: 19,
    commentsCount: 2,
    sharesCount: 6,
    savesCount: 8,
    likedBy: ['usr-pedro'],
    savedBy: [],
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  }
];

export const SEED_BEMTEVI_COMMENTS: BemteviComment[] = [
  {
    id: 'comm-101',
    postId: 'post-1',
    authorId: 'usr-sofia',
    authorName: 'Dra. Sofia Alencar',
    authorHandle: '@sofia_alencar',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    content: 'Excelente integração! O formato de 127 caracteres estimula postagens diretas ao ponto.',
    likesCount: 8,
    likedBy: ['usr-pedro'],
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'comm-102',
    postId: 'post-1',
    authorId: 'usr-carlos',
    authorName: 'Carlos Tech',
    authorHandle: '@carlos_dev',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'O sistema de karma gamifica as contribuições técnicas de forma muito positiva!',
    likesCount: 5,
    likedBy: ['usr-pedro'],
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  }
];

export const SEED_BEMTEVI_TRENDING: BemteviTrendingTopic[] = [
  { tag: '#WazzimaGiygg', category: 'Comunidade', postsCount: 348 },
  { tag: '#NotMediaWiki', category: 'Tecnologia', postsCount: 215 },
  { tag: '#MarcoCivil', category: 'Legislação', postsCount: 182 },
  { tag: '#SoftwareLivre', category: 'Open Source', postsCount: 164 },
  { tag: '#DireitoDigital', category: 'Direito', postsCount: 98 },
  { tag: '#Parsoid', category: 'Tecnologia', postsCount: 76 }
];

export const SEED_BEMTEVI_NOTIFICATIONS: BemteviNotification[] = [
  {
    id: 'notif-1',
    userId: 'usr-pedro',
    type: 'level',
    title: 'Novo Nível!',
    message: 'Parabéns! Você alcançou o nível Lendário no Bemtevi.',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'notif-2',
    userId: 'usr-pedro',
    type: 'like',
    title: 'Nova curtida',
    message: 'Dra. Sofia Alencar curtiu sua postagem no feed.',
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }
];

export const SEED_BEMTEVI_MESSAGES: BemteviDirectMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-pedro-sofia',
    senderId: 'usr-sofia',
    senderName: 'Dra. Sofia Alencar',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    receiverId: 'usr-pedro',
    text: 'Olá Pedro, a sincronização do acervo com a rede social Bemtevi ficou impecável!',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-2',
    conversationId: 'conv-pedro-sofia',
    senderId: 'usr-pedro',
    senderName: 'Pedro Peres (Burocrata)',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    receiverId: 'usr-sofia',
    text: 'Muito obrigado Sofia! O objetivo é unificar jornal, acervo e debate social aberto.',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString()
  }
];
