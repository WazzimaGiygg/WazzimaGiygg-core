/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Bem te vi - Rede Social Livre e Colaborativa
 * Repositório: https://github.com/WazzimaGiygg/bemtevi
 * Domínio oficial: https://bemtevi.wazzimagiygg.com/
 */

export interface BemteviSharedArticle {
  id: string; // Article UID
  titulo: string;
  descricao?: string;
  setor?: string;
  colecao?: string;
  criadorEmail?: string;
  link?: string;
  url?: string;
}

export interface BemteviPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  authorBadge?: string;
  authorKarma?: number;
  authorLevel?: string;
  content: string; // Max 127 chars as defined in the repo
  link?: string;
  media?: string;
  tags?: string[];
  category: BemteviCategory;
  communityId?: string;
  communityName?: string;
  sharedArticle?: BemteviSharedArticle;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  likedBy: string[];
  savedBy: string[];
  isEdited?: boolean;
  isLocalOnly?: boolean;
  createdAt: string;
  updatedAt?: string;
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
  receiverId?: string;
  recipientId?: string;
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

// Sincronização exclusiva com banco de dados - nenhum dado sugerido fictício
export const SEED_BEMTEVI_USERS: BemteviUser[] = [];
export const SEED_BEMTEVI_COMMUNITIES: BemteviCommunity[] = [];
export const SEED_BEMTEVI_POSTS: BemteviPost[] = [
  {
    id: 'post-init-1',
    authorId: 'usr_pedro_cardona_official',
    authorName: 'Pedro Cardona',
    authorHandle: '@pedro_cardona',
    authorBadge: 'Burocrata',
    authorKarma: 5000,
    authorLevel: 'Lendário',
    content: 'Recomendo a leitura deste documento do nosso acervo sobre a reforma psiquiátrica! #SaudeMental #WZZM',
    category: 'Educação',
    sharedArticle: {
      id: 'news_4',
      titulo: 'Franco Basaglia e a Transformação da Psiquiatria: Da Desinstitucionalização à Liberdade Terapêutica',
      descricao: 'Análise histórica sobre a desinstitucionalização, a Lei 10.216/2001 e a criação dos CAPS no Brasil.',
      setor: 'Notícias & Sociedade',
      colecao: 'wikiworldweb',
      criadorEmail: 'redacao@wazzimagiygg.com'
    },
    likesCount: 14,
    commentsCount: 3,
    sharesCount: 5,
    savesCount: 8,
    likedBy: [],
    savedBy: [],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];
export const SEED_BEMTEVI_COMMENTS: BemteviComment[] = [];
export const SEED_BEMTEVI_TRENDING: BemteviTrendingTopic[] = [];
export const SEED_BEMTEVI_NOTIFICATIONS: BemteviNotification[] = [];
export const SEED_BEMTEVI_MESSAGES: BemteviDirectMessage[] = [];

/**
 * Calcula tópicos em alta EXCLUSIVAMENTE a partir das postagens reais salvas no banco de dados.
 * Se não houver postagens ou hashtags no banco de dados, nenhum trending fictício é exibido.
 */
export function extractHashtagsFromText(content: string): string[] {
  if (!content || typeof content !== 'string') return [];
  const matches = content.match(/#[a-zA-Z0-9_À-ÿ]+/g) || [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const clean = m.trim();
    const key = clean.toLowerCase();
    if (clean.length > 1 && !seen.has(key)) {
      seen.add(key);
      result.push(clean);
    }
  }
  return result;
}

export function normalizeBemteviLink(rawLink: string): { valid: boolean; normalized?: string; error?: string } {
  const trimmed = (rawLink || '').trim();
  if (!trimmed) return { valid: true, normalized: undefined };

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return { valid: false, error: 'Protocolo de link não permitido por segurança.' };
  }

  // Internal portal UID link like ?uid=news_1 or /?uid=news_1
  if (trimmed.startsWith('?uid=') || trimmed.startsWith('/?uid=')) {
    return { valid: true, normalized: trimmed.startsWith('/') ? trimmed : `/${trimmed}` };
  }

  // Relative path starting with /
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return { valid: true, normalized: trimmed };
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { valid: false, error: 'Informe um link válido (ex: https://wazzimagiygg.com ou ?uid=artigo).' };
    }
    return { valid: true, normalized: parsed.toString() };
  } catch {
    return { valid: false, error: 'Formato de link inválido. Use https://... ou ?uid=...' };
  }
}

export function computeTrendingTopicsFromDbPosts(posts: BemteviPost[]): BemteviTrendingTopic[] {
  const counts = new Map<string, { tag: string; category: string; count: number }>();
  for (const post of posts) {
    const fromContent = extractHashtagsFromText(post.content || '');
    const fromField = Array.isArray(post.tags) ? post.tags : [];
    const combined = Array.from(new Set([...fromContent, ...fromField]));
    for (const rawTag of combined) {
      const tag = rawTag.startsWith('#') ? rawTag.trim() : `#${rawTag.trim()}`;
      const key = tag.toLowerCase();
      if (!counts.has(key)) {
        counts.set(key, { tag, category: post.category || 'Geral', count: 0 });
      }
      counts.get(key)!.count += 1;
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .map((item) => ({
      tag: item.tag,
      category: item.category,
      postsCount: item.count
    }));
}
