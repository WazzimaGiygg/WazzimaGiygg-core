/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gerador Isomórfico de Infobox de Usuário, Página Pessoal NotMediaWiki
 * e Templates para o Tutorial Oficial de Infobox.
 */

import type { WikiArticle, WikiEvent, WikiRevision } from '../data/notMediaWikiData';

export interface UserInfoboxSubject {
  uid: string;
  name?: string | null;
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
  photoURL?: string | null;
  isAdmin?: boolean;
  isTeacher?: boolean;
  isGuest?: boolean;
  isBanned?: boolean;
  createdAt?: string | null;
  firstLoginAt?: string | null;
  lastLoginAt?: string | null;
}

export interface UserContributionEntry {
  id: string;
  articleSlug: string;
  articleTitle: string;
  namespace: number;
  type: 'new' | 'edit' | 'minor';
  comment: string;
  timestamp: string;
  byteSize: number;
  sha256: string;
  revisionId: string;
}

export function resolveUserDisplayName(user: Partial<UserInfoboxSubject> | null | undefined): string {
  if (!user) return 'Usuário Registrado';
  const candidate =
    (user.displayName || '').trim() ||
    (user.name || '').trim() ||
    (user.username || '').trim() ||
    (user.email ? user.email.split('@')[0].trim() : '');
  return candidate || `Usuário_${(user.uid || 'wzzm').slice(0, 6)}`;
}

export function sanitizeSlugSegment(raw: string): string {
  return raw
    .trim()
    .replace(/[<>[\]{}|#?/&\\]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildPersonalUserPageSlug(name?: string | null, uid?: string | null): string {
  const cleanName = sanitizeSlugSegment(name || '');
  if (cleanName.length >= 2) {
    return `Usuário:${cleanName}`;
  }
  const shortUid = sanitizeSlugSegment((uid || 'membro').slice(0, 10));
  return `Usuário:Membro_${shortUid}`;
}

export function buildPersonalUserPageTitle(name?: string | null, uid?: string | null): string {
  const cleanName = (name || '').trim();
  if (cleanName.length >= 2) {
    return `Usuário:${cleanName}`;
  }
  return `Usuário:Membro ${(uid || 'WZZM').slice(0, 8)}`;
}

export function resolveUserRoleLabel(user: Partial<UserInfoboxSubject> | null | undefined): string {
  if (!user) return 'Leitor / Editor';
  if (user.isBanned) return 'Conta sob Moderação';
  if (user.isAdmin || user.email?.toLowerCase().trim() === 'pedrohenriquecardonaperes@gmail.com') {
    return 'Burocrata / Administrador';
  }
  if (user.email?.toLowerCase().trim() === 'wazzimagiygg@gmail.com') {
    return 'Publicador Oficial WZZM';
  }
  if (user.isTeacher) return 'Docente / Pesquisador';
  if (user.isGuest) return 'Leitor Convidado (24h)';
  return 'Editor Comunitário Verificado';
}

function formatDatePtBr(raw?: any): string {
  if (!raw) return new Date().toLocaleDateString('pt-BR');
  try {
    if (typeof raw?.toDate === 'function') {
      return raw.toDate().toLocaleDateString('pt-BR');
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR');
    }
  } catch {
    // ignore
  }
  return new Date().toLocaleDateString('pt-BR');
}

export function buildUserInfoboxWikitext(
  user: UserInfoboxSubject,
  stats?: {
    contributionsCount?: number;
    pagesCreated?: number;
    lastEditAt?: string;
  }
): string {
  const displayName = resolveUserDisplayName(user);
  const pageSlug = buildPersonalUserPageSlug(displayName, user.uid);
  const roleLabel = resolveUserRoleLabel(user);
  const avatarUrl = (user.profilePictureUrl || user.photoURL || '').trim();
  const firstLogin = formatDatePtBr(user.firstLoginAt || user.createdAt);
  const lastActivity = formatDatePtBr(stats?.lastEditAt || user.lastLoginAt || new Date().toISOString());
  const contribs = stats?.contributionsCount ?? 0;
  const createdPages = stats?.pagesCreated ?? 1;
  const accountType = user.isGuest
    ? 'Sessão Temporária 24h'
    : user.email
    ? 'Conta Google / WZZM Verificada'
    : 'Conta Comunitária';

  const lines = [
    '{{Infobox Usuário',
    `| nome = ${displayName}`,
    `| subtítulo = ${roleLabel} • NotMediaWiki`,
    `| cor = ${user.isAdmin ? 'red' : 'amber'}`,
  ];

  if (avatarUrl && /^https?:\/\//i.test(avatarUrl)) {
    lines.push(`| imagem = ${avatarUrl}`);
    lines.push(`| legenda = Identificação visual de ${displayName}`);
  }

  lines.push(
    `| UID = ${user.uid}`,
    `| Cargo = ${roleLabel}`,
    `| Tipo de Conta = ${accountType}`,
    `| Primeiro Login = ${firstLogin}`,
    `| Última Atividade = ${lastActivity}`,
    `| Contribuições = ${contribs} edição(ões) no NotMediaWiki`,
    `| Páginas Criadas = ${createdPages}`,
    `| Página Pessoal = [[${pageSlug}|${displayName}]]`,
    `| Domínio Canônico = core.wazzimagiygg.com`,
    `| Status LGPD = Ativa (Lei 13.709/18 & Marco Civil)`,
    '}}'
  );

  return lines.join('\n');
}

export function buildPersonalUserPageWikitext(
  user: UserInfoboxSubject,
  stats?: {
    contributionsCount?: number;
    pagesCreated?: number;
    lastEditAt?: string;
  }
): string {
  const displayName = resolveUserDisplayName(user);
  const infobox = buildUserInfoboxWikitext(user, stats);
  const firstLogin = formatDatePtBr(user.firstLoginAt || user.createdAt);

  return `${infobox}

== Apresentação Pessoal ==
Bem-vindo(a) à página pessoal oficial de '''${displayName}''' no '''NotMediaWiki''' (ecossistema ''WazzimaGiygg Core'').

Esta página foi provisionada automaticamente no primeiro acesso em ${firstLogin}, garantindo um identificador público e um '''Infobox de Usuário''' padronizado para reconhecimento comunitário sem expor dados sensíveis (em conformidade com a '''LGPD''' e o '''Marco Civil da Internet''').

{{Userbox|🌐|Membro ativo da comunidade NotMediaWiki & WikiWorldWeb}}
{{Userbox|🪪|Identificação pública via Infobox Usuário (UID: ${user.uid})}}
{{Userbox|🛡️|Proteção de privacidade e auditoria aberta}}

== Como Personalizar este Infobox ==
Você pode editar esta página clicando em '''Editar Wikitexto''' para adicionar biografia, áreas de interesse, idiomas ou novos campos ao seu <code>{{Infobox Usuário}}</code>. Consulte o guia interativo na aba '''Tutorial Infobox''' ou use a sintaxe abaixo:

* Use <code>| campo = valor</code> dentro de <code>{{Infobox Usuário ... }}</code> para exibir novos atributos.
* Adicione links internos usando colchetes duplos: <code>[[Página_Principal|Ir para a Capa]]</code>.
* Todas as suas edições e revisões no NotMediaWiki são listadas automaticamente na seção de contribuições abaixo.

== Contribuições no NotMediaWiki ==
Todas as revisões, criações de páginas e edições realizadas por '''${displayName}''' no NotMediaWiki são rastreadas e exibidas em tempo real no painel de contribuições integrado logo abaixo deste artigo.

[[Category:Usuários]]
[[Category:NotMediaWiki]]`;
}

export function extractUserNotMediaWikiContributions(
  target: {
    uid?: string | null;
    name?: string | null;
    displayName?: string | null;
    email?: string | null;
    slug?: string | null;
  },
  articles: WikiArticle[],
  revisions: WikiRevision[],
  events: WikiEvent[] = []
): UserContributionEntry[] {
  const normalizedUid = (target.uid || '').trim().toLowerCase();
  const normalizedEmail = (target.email || '').trim().toLowerCase();
  const nameCandidates = new Set<string>(
    [target.name, target.displayName, target.email ? target.email.split('@')[0] : '']
      .map((s) => (s || '').trim().toLowerCase())
      .filter((s) => s.length > 0)
  );

  const matchesAuthor = (authorId?: string, authorName?: string): boolean => {
    const aId = (authorId || '').trim().toLowerCase();
    const aName = (authorName || '').trim().toLowerCase();
    if (normalizedUid && aId && aId === normalizedUid) return true;
    if (normalizedEmail && (aName === normalizedEmail || aId === normalizedEmail)) return true;
    if (aName && nameCandidates.has(aName)) return true;
    return false;
  };

  const articleMap = new Map<string, WikiArticle>();
  for (const art of articles) {
    articleMap.set(art.slug.toLowerCase(), art);
  }

  const seenRevIds = new Set<string>();
  const entries: UserContributionEntry[] = [];

  for (const rev of revisions) {
    if (!matchesAuthor(rev.author?.id, rev.author?.name)) continue;
    if (seenRevIds.has(rev.id)) continue;
    seenRevIds.add(rev.id);

    const art = articleMap.get((rev.articleSlug || '').toLowerCase());
    entries.push({
      id: `rev-${rev.id}`,
      revisionId: rev.id,
      articleSlug: rev.articleSlug,
      articleTitle: art?.title || rev.articleSlug.replace(/_/g, ' '),
      namespace: art?.namespace ?? (rev.articleSlug.startsWith('Usuário:') ? 2 : 0),
      type: rev.isMinor ? 'minor' : rev.parentRevisionId ? 'edit' : 'new',
      comment: rev.comment || 'Edição no NotMediaWiki',
      timestamp: rev.timestamp,
      byteSize: rev.byteSize || rev.wikitext?.length || 0,
      sha256: rev.sha256 || 'verified',
    });
  }

  // Fallback check on EventStreams events not yet in revisions array
  for (const evt of events) {
    if (!matchesAuthor(undefined, evt.user_text)) continue;
    if (evt.rev_id && seenRevIds.has(evt.rev_id)) continue;
    if (evt.rev_id) seenRevIds.add(evt.rev_id);

    const candidateSlug = (evt.page_title || '').trim().replace(/\s+/g, '_');
    const art = articleMap.get(candidateSlug.toLowerCase());
    entries.push({
      id: `evt-${evt.id}`,
      revisionId: evt.rev_id || evt.id,
      articleSlug: art?.slug || candidateSlug,
      articleTitle: evt.page_title || candidateSlug,
      namespace: evt.page_namespace ?? art?.namespace ?? 0,
      type: evt.type === 'new' ? 'new' : evt.rev_minor_edit ? 'minor' : 'edit',
      comment: evt.comment || 'Atividade registrada via EventStreams',
      timestamp: evt.rev_timestamp || evt.timestamp || evt.meta?.dt || new Date().toISOString(),
      byteSize: evt.rev_len || 0,
      sha256: evt.rev_sha1 || 'event-log',
    });
  }

  // Ensure the user's own personal page creation shows up if no revisions yet
  if (target.slug) {
    const personalArt = articleMap.get(target.slug.toLowerCase());
    if (personalArt && !entries.some((e) => e.articleSlug.toLowerCase() === personalArt.slug.toLowerCase())) {
      entries.push({
        id: `init-${personalArt.id}`,
        revisionId: personalArt.latestRevisionId || `rev-init-${personalArt.id}`,
        articleSlug: personalArt.slug,
        articleTitle: personalArt.title,
        namespace: personalArt.namespace,
        type: 'new',
        comment: 'Criação automática da página pessoal no primeiro login',
        timestamp: personalArt.createdAt || personalArt.updatedAt || new Date().toISOString(),
        byteSize: personalArt.wikitext?.length || 0,
        sha256: personalArt.latestRevisionId || 'userpage-init',
      });
    }
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export interface InfoboxTutorialTemplate {
  id: 'usuario' | 'artigo' | 'biografia' | 'software';
  label: string;
  badge: string;
  description: string;
  wikitext: string;
}

export const INFOBOX_TUTORIAL_TEMPLATES: InfoboxTutorialTemplate[] = [
  {
    id: 'usuario',
    label: 'Infobox de Usuário',
    badge: 'Namespace 2 (Usuário)',
    description: 'Cartão padrão de identificação para páginas pessoais no NotMediaWiki.',
    wikitext: `{{Infobox Usuário
| nome = Seu Nome Público
| subtítulo = Editor Comunitário • NotMediaWiki
| cor = amber
| UID = usr_identificador
| Cargo = Editor Comunitário
| Idiomas = Português (nativo), Inglês
| Áreas de Interesse = História, Ciência, Tecnologia
| Domínio Canônico = core.wazzimagiygg.com
| Status = Ativo (LGPD & Marco Civil)
}}`,
  },
  {
    id: 'artigo',
    label: 'Infobox de Artigo / Conceito',
    badge: 'Namespace 0 (Principal)',
    description: 'Ideal para verbetes enciclopédicos, instituições ou conceitos científicos.',
    wikitext: `{{Infobox Artigo
| nome = WikiWorldWeb
| subtítulo = Enciclopédia Livre Independente
| cor = blue
| Fundação = 2025
| Criador = [[Usuário:WazzimaGiygg|WazzimaGiygg]]
| Motor = NotMediaWiki Parsoid AST
| Licença = CC BY-SA 4.0 & GNU GPL v3.0
| Portal Oficial = [https://core.wazzimagiygg.com/ core.wazzimagiygg.com]
| Conformidade = LGPD & Marco Civil da Internet
}}`,
  },
  {
    id: 'biografia',
    label: 'Infobox de Biografia',
    badge: 'Pessoas & Pesquisadores',
    description: 'Modelo estruturado para biografias, acadêmicos, escritores e figuras históricas.',
    wikitext: `{{Infobox Biografia
| nome = Pesquisador Exemplo
| subtítulo = Cientista e Autor
| cor = emerald
| Nacionalidade = Brasileiro
| Formação = Ciência da Computação
| Atuação = Arquitetura Web e Privacidade Digital
| Obras Notáveis = Tratado de Redes Abertas
| Referência = [[Página_Principal|Acervo NotMediaWiki]]
}}`,
  },
  {
    id: 'software',
    label: 'Infobox de Software / Projeto',
    badge: 'Tecnologia',
    description: 'Ficha técnica para ferramentas, extensões modulares e motores de wiki.',
    wikitext: `{{Infobox Software
| nome = NotMediaWiki
| subtítulo = Motor Enciclopédico Modular
| cor = slate
| Versão = C1.16.C7.1
| Linguagem = TypeScript, React, Node.js
| Parser = Parsoid AST Pure TS
| Banco de Dados = Cloud Firestore
| Repositório = [https://github.com/WazzimaGiygg/Wiki-alternative GitHub Oficial]
}}`,
  },
];
