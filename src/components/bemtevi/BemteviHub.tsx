/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Bem te vi - Rede Social Livre e Colaborativa
 * Repositório Oficial: https://github.com/WazzimaGiygg/bemtevi
 * Domínio: https://bemtevi.wazzimagiygg.com/
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
  Send,
  Search,
  Users,
  Flame,
  Award,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Shield,
  CheckCircle,
  AlertCircle,
  X,
  MessageSquare,
  CornerDownRight,
  TrendingUp,
  Filter,
  UserCheck,
  UserPlus,
  ChevronRight,
  Link as LinkIcon,
  Smile,
  Hash,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Edit3,
  Check
} from 'lucide-react';
import {
  BemteviPost,
  BemteviComment,
  BemteviCommunity,
  BemteviUser,
  BemteviTrendingTopic,
  BemteviNotification,
  BemteviDirectMessage,
  BemteviCategory,
  BemteviSharedArticle,
  BEMTEVI_CATEGORIES,
  BEMTEVI_TRANSLATIONS,
  getKarmaLevel,
  getKarmaBadgeColor,
  computeTrendingTopicsFromDbPosts,
  extractHashtagsFromText,
  normalizeBemteviLink
} from '../../data/bemteviData';
import {
  listBemteviPostsFromDb,
  createBemteviPostInDb,
  updateBemteviPostInDb,
  toggleBemteviPostLikeInDb,
  incrementBemteviPostShareInDb,
  toggleBemteviPostSaveInDb,
  deleteBemteviPostInDb,
  listBemteviCommunitiesFromDb,
  createBemteviCommunityInDb,
  toggleBemteviCommunityMemberInDb,
  listBemteviCommentsFromDb,
  createBemteviCommentInDb,
  listBemteviMessagesFromDb,
  createBemteviMessageInDb,
  listAllUsersFromFirestore
} from '../../firebase';

interface BemteviHubProps {
  currentUser?: any;
  showToast: (msg: string, isError?: boolean) => void;
  onOpenArticleByUrl?: (url: string) => void;
  onOpenArticle?: (article: any) => void;
  initialSharedArticle?: BemteviSharedArticle | null;
  onClearInitialSharedArticle?: () => void;
  availableArticles?: any[];
  activeUid?: string | null;
  onNavigateUid?: (uid: string) => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onOpenLgpdModal?: () => void;
}

export default function BemteviHub({
  currentUser,
  showToast,
  onOpenArticle,
  initialSharedArticle,
  onClearInitialSharedArticle,
  availableArticles = [],
  activeUid,
  onNavigateUid,
  canGoBack = false,
  canGoForward = false,
  onNavigateBack,
  onNavigateForward,
  onOpenLgpdModal
}: BemteviHubProps) {
  // Locale State (pt-BR, en-US, es-ES)
  const [locale, setLocale] = useState<'pt-BR' | 'en-US' | 'es-ES'>('pt-BR');
  const t = BEMTEVI_TRANSLATIONS[locale];

  // Navigation Sub-tab in Bem te vi
  const [activeTab, setActiveTab] = useState<
    'feed' | 'explore' | 'communities' | 'messages' | 'saved' | 'profile'
  >('feed');

  // Feed filter tabs
  const [feedFilter, setFeedFilter] = useState<'forYou' | 'latest' | 'myPosts'>('forYou');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [onlyWithArticles, setOnlyWithArticles] = useState<boolean>(false);
  const [activeCommunityView, setActiveCommunityView] = useState<BemteviCommunity | null>(null);

  // Database-Synchronized Stores
  const [posts, setPosts] = useState<BemteviPost[]>([]);
  const [comments, setComments] = useState<BemteviComment[]>([]);
  const [communities, setCommunities] = useState<BemteviCommunity[]>([]);
  const [usersList, setUsersList] = useState<BemteviUser[]>([]);
  const [trending, setTrending] = useState<BemteviTrendingTopic[]>([]);
  const [messages, setMessages] = useState<BemteviDirectMessage[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bemtevi_saved_posts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [followingIds, setFollowingIds] = useState<string[]>(() => {
    try {
      const uidKey = `wzzm_bemtevi_following_${currentUser?.uid || 'usr-guest'}`;
      const saved = localStorage.getItem(uidKey);
      return saved ? JSON.parse(saved) : ['usr_pedro_cardona_official'];
    } catch {
      return ['usr_pedro_cardona_official'];
    }
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Post Composer State (strictly max 127 chars)
  const [composerText, setComposerText] = useState('');
  const [composerLink, setComposerLink] = useState('');
  const [composerLinkError, setComposerLinkError] = useState<string | null>(null);
  const [composerCategory, setComposerCategory] = useState<BemteviCategory>('Geral');
  const [composerCommunityId, setComposerCommunityId] = useState<string>('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Inline Post Editing State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [editingPostLink, setEditingPostLink] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Shared Article Attachment State (Integração de artigos do site ao Bemtevi)
  const [attachedArticle, setAttachedArticle] = useState<BemteviSharedArticle | null>(() => initialSharedArticle || null);
  const [isArticlePickerOpen, setIsArticlePickerOpen] = useState(false);
  const [articlePickerSearch, setArticlePickerSearch] = useState('');

  // Sincronizar artigo inicial quando compartilhado a partir do leitor ou cards do acervo
  useEffect(() => {
    if (initialSharedArticle) {
      setAttachedArticle(initialSharedArticle);
      setActiveTab('feed');
      const hashTag = (initialSharedArticle.setor || 'Geral').replace(/[^a-zA-Z0-9À-ÿ]/g, '');
      const prefix = `Confiram este artigo: #${hashTag} #WZZM`;
      setComposerText(prefix.slice(0, 127));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [initialSharedArticle]);

  // Active Modals
  const [selectedPostForComments, setSelectedPostForComments] = useState<BemteviPost | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newCommunityCat, setNewCommunityCat] = useState<BemteviCategory>('Geral');

  const [selectedProfileUser, setSelectedProfileUser] = useState<BemteviUser | null>(null);

  const handleSelectUser = (u: BemteviUser) => {
    setSelectedProfileUser(u);
    if (onNavigateUid) {
      onNavigateUid(u.uid);
    }
  };

  // Synchronize activeUid from URL with selectedProfileUser (3.05.6.d)
  useEffect(() => {
    if (activeUid) {
      const found = usersList.find((u) => u.uid === activeUid);
      if (found) {
        setSelectedProfileUser(found);
      } else if (!isLoadingData) {
        setSelectedProfileUser({
          uid: activeUid,
          name: `Usuário (${activeUid.substring(0, 10)})`,
          handle: `@${activeUid.toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
          bio: 'Membro registrado na rede WZZM / Bem-Te-Vi',
          karma: 50,
          level: 'Iniciante',
          followers: [],
          following: [],
          badges: ['Registrado'],
          joinedAt: new Date().toISOString()
        });
      }
    } else {
      setSelectedProfileUser(null);
    }
  }, [activeUid, usersList, isLoadingData]);

  // Direct Message Active Chat
  const [activeDmUser, setActiveDmUser] = useState<BemteviUser | null>(null);
  const [dmInputText, setDmInputText] = useState('');

  // Explore Search
  const [exploreQuery, setExploreQuery] = useState('');
  const [exploreFilter, setExploreFilter] = useState<'all' | 'posts' | 'users' | 'communities'>('all');

  // Load ONLY real data synchronized from the database
  const loadDatabaseData = async () => {
    setIsLoadingData(true);
    try {
      const [dbPosts, dbComms, dbMsgs, dbUsers] = await Promise.all([
        listBemteviPostsFromDb(),
        listBemteviCommunitiesFromDb(),
        listBemteviMessagesFromDb(),
        listAllUsersFromFirestore()
      ]);

      const validPosts: BemteviPost[] = (dbPosts || []).map((p: any) => {
        const content = typeof p.content === 'string' ? p.content : '';
        const tags = Array.from(
          new Set([...(Array.isArray(p.tags) ? p.tags : []), ...extractHashtagsFromText(content)])
        );
        return {
          id: p.id || `post-${Date.now()}`,
          authorId: p.authorId || 'anon',
          authorName: p.authorName || 'Usuário WZZM',
          authorHandle: p.authorHandle || `@${(p.authorName || 'usuario').toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
          ...(p.authorAvatar ? { authorAvatar: p.authorAvatar } : {}),
          authorBadge: p.authorBadge || 'Membro',
          authorKarma: typeof p.authorKarma === 'number' ? p.authorKarma : 10,
          content,
          ...(p.link ? { link: p.link } : {}),
          tags,
          category: p.category || 'Geral',
          ...(p.communityId ? { communityId: p.communityId } : {}),
          ...(p.communityName ? { communityName: p.communityName } : {}),
          ...(p.sharedArticle ? { sharedArticle: p.sharedArticle } : {}),
          likesCount: typeof p.likesCount === 'number' ? p.likesCount : (Array.isArray(p.likedBy) ? p.likedBy.length : 0),
          commentsCount: typeof p.commentsCount === 'number' ? p.commentsCount : 0,
          sharesCount: typeof p.sharesCount === 'number' ? p.sharesCount : 0,
          savesCount: typeof p.savesCount === 'number' ? p.savesCount : (Array.isArray(p.savedBy) ? p.savedBy.length : 0),
          likedBy: Array.isArray(p.likedBy) ? p.likedBy : [],
          savedBy: Array.isArray(p.savedBy) ? p.savedBy : [],
          isEdited: Boolean(p.isEdited),
          isLocalOnly: Boolean(p.isLocalOnly),
          createdAt: p.createdAt || new Date().toISOString(),
          ...(p.updatedAt ? { updatedAt: p.updatedAt } : {})
        };
      });
      setPosts(validPosts);

      // Compute trending topics EXCLUSIVELY from real database posts
      setTrending(computeTrendingTopicsFromDbPosts(validPosts));

      const validComms: BemteviCommunity[] = (dbComms || []).map((c: any) => ({
        id: c.id || `comm-${Date.now()}`,
        name: c.name || 'Comunidade WZZM',
        description: c.description || '',
        category: c.category || 'Geral',
        membersCount: c.membersCount || (Array.isArray(c.members) ? c.members.length : 1),
        postsCount: c.postsCount || 0,
        icon: c.icon || '🏛️',
        createdBy: c.createdBy || 'sistema',
        members: Array.isArray(c.members) ? c.members : [],
        createdAt: c.createdAt || new Date().toISOString()
      }));
      setCommunities(validComms);

      setMessages(dbMsgs || []);

      // Real users from database + unique post authors so feed authors always resolve cleanly
      const mappedUsersMap = new Map<string, BemteviUser>();
      (dbUsers || []).forEach((u: any) => {
        const uid = u.uid || u.id;
        if (!uid) return;
        mappedUsersMap.set(uid, {
          uid,
          name: u.name || u.nome || u.email?.split('@')[0] || 'Usuário WZZM',
          handle: `@${(u.email?.split('@')[0] || u.name || 'usuario').toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
          ...(u.profilePictureUrl || u.avatar ? { avatar: u.profilePictureUrl || u.avatar } : {}),
          bio: u.bio || (u.isAdmin ? 'Burocrata administrador oficial' : (u.isTeacher ? 'Professor verificado' : 'Membro cadastrado no banco de dados')),
          karma: u.karma || (u.isAdmin ? 5000 : 100),
          level: u.level || (u.isAdmin ? 'Lendário' : (u.isTeacher ? 'Veterano' : 'Iniciante')),
          followers: Array.isArray(u.followers) ? u.followers : [],
          following: Array.isArray(u.following) ? u.following : [],
          badges: Array.isArray(u.badges) ? u.badges : (u.isAdmin ? ['Burocrata Oficial'] : ['Registrado']),
          joinedAt: u.createdAt || new Date().toISOString()
        });
      });

      validPosts.forEach((p) => {
        if (p.authorId && !mappedUsersMap.has(p.authorId)) {
          mappedUsersMap.set(p.authorId, {
            uid: p.authorId,
            name: p.authorName,
            handle: p.authorHandle,
            ...(p.authorAvatar ? { avatar: p.authorAvatar } : {}),
            bio: 'Autor participante na rede livre Bem-Te-Vi.',
            karma: p.authorKarma || 100,
            level: p.authorBadge || getKarmaLevel(p.authorKarma || 100),
            followers: [],
            following: [],
            badges: [p.authorBadge || 'Membro'],
            joinedAt: p.createdAt
          });
        }
      });

      setUsersList(Array.from(mappedUsersMap.values()));
    } catch (err) {
      console.warn('Erro ao carregar dados exclusivos do banco de dados:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, [currentUser?.uid]);

  useEffect(() => {
    try {
      const uidKey = `wzzm_bemtevi_following_${currentUser?.uid || 'usr-guest'}`;
      const saved = localStorage.getItem(uidKey);
      if (saved) setFollowingIds(JSON.parse(saved));
    } catch {
      //
    }
  }, [currentUser?.uid]);

  // Current session user details in Bemtevi format
  const myUser: BemteviUser = useMemo(() => {
    const uid = currentUser?.uid || 'usr-guest';
    const existing = usersList.find((u) => u.uid === uid || (currentUser?.email && u.handle === `@${currentUser.email.split('@')[0]}`));
    if (existing) {
      return {
        ...existing,
        following: Array.from(new Set([...existing.following, ...followingIds]))
      };
    }

    const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Leitor WZZM';
    const handle = `@${(currentUser?.email?.split('@')[0] || 'leitor_anon').toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
    return {
      uid,
      name,
      handle,
      ...(currentUser?.photoURL ? { avatar: currentUser.photoURL } : {}),
      bio: 'Membro ativo da rede livre Bemtevi no portal WazzimaGiygg.',
      karma: 120,
      level: 'Iniciante',
      followers: [],
      following: followingIds,
      badges: ['Membro'],
      joinedAt: new Date().toISOString()
    };
  }, [currentUser, usersList, followingIds]);

  // Handle Post Creation (max 127 characters, precise sanitization & validation)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPost) return;

    const trimmedText = composerText.trim();
    if (!trimmedText) {
      showToast(t.placeholderPost, true);
      return;
    }

    if (trimmedText.length > 127) {
      showToast('O texto excede o limite máximo de 127 caracteres do Bemtevi!', true);
      return;
    }

    const linkCheck = normalizeBemteviLink(composerLink);
    if (!linkCheck.valid) {
      setComposerLinkError(linkCheck.error || 'Link inválido.');
      showToast(linkCheck.error || 'Link inválido.', true);
      return;
    }
    setComposerLinkError(null);

    setIsSubmittingPost(true);
    const targetComm = communities.find((c) => c.id === composerCommunityId);
    const extractedTags = extractHashtagsFromText(trimmedText);

    const sanitizedArticle: BemteviSharedArticle | undefined = attachedArticle
      ? {
          id: attachedArticle.id,
          titulo: attachedArticle.titulo,
          ...(attachedArticle.descricao ? { descricao: attachedArticle.descricao } : {}),
          ...(attachedArticle.setor ? { setor: attachedArticle.setor } : {}),
          ...(attachedArticle.colecao ? { colecao: attachedArticle.colecao } : {}),
          ...(attachedArticle.criadorEmail ? { criadorEmail: attachedArticle.criadorEmail } : {}),
          ...(attachedArticle.link ? { link: attachedArticle.link } : {}),
          ...(attachedArticle.url ? { url: attachedArticle.url } : {})
        }
      : undefined;

    const postPayload: Record<string, any> = {
      authorId: myUser.uid,
      authorName: myUser.name,
      authorHandle: myUser.handle,
      authorBadge: myUser.level,
      authorKarma: myUser.karma + 10,
      content: trimmedText,
      tags: extractedTags,
      category: composerCategory,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      likedBy: [],
      savedBy: []
    };

    if (myUser.avatar) postPayload.authorAvatar = myUser.avatar;
    if (linkCheck.normalized) postPayload.link = linkCheck.normalized;
    if (composerCommunityId) {
      postPayload.communityId = composerCommunityId;
      if (targetComm?.name) postPayload.communityName = targetComm.name;
    }
    if (sanitizedArticle) postPayload.sharedArticle = sanitizedArticle;

    try {
      const savedPost = await createBemteviPostInDb(postPayload);
      const updatedList = [savedPost, ...posts];
      setPosts(updatedList);
      setTrending(computeTrendingTopicsFromDbPosts(updatedList));
      if (composerCommunityId) {
        setCommunities((prev) =>
          prev.map((c) => (c.id === composerCommunityId ? { ...c, postsCount: (c.postsCount || 0) + 1 } : c))
        );
      }
      setComposerText('');
      setComposerLink('');
      setComposerLinkError(null);
      setComposerCommunityId('');
      const hadArticle = Boolean(attachedArticle);
      setAttachedArticle(null);
      if (onClearInitialSharedArticle) onClearInitialSharedArticle();
      showToast(
        hadArticle
          ? 'Artigo compartilhado no Bemtevi com sucesso! 🐦📰'
          : savedPost.isLocalOnly
          ? 'Post publicado no modo local (+10 Karma). Entre com sua conta Google para sincronizar na nuvem.'
          : 'Post publicado e sincronizado com sucesso! (+10 Karma)',
        false
      );
    } catch (err) {
      console.warn('Erro ao salvar post no banco de dados:', err);
      showToast('Erro ao salvar publicação.', true);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Start / Save Inline Post Editing
  const handleStartEditPost = (post: BemteviPost) => {
    setEditingPostId(post.id);
    setEditingPostText(post.content);
    setEditingPostLink(post.link || '');
  };

  const handleSaveEditPost = async (post: BemteviPost) => {
    const trimmed = editingPostText.trim();
    if (!trimmed) {
      showToast('O texto da postagem não pode ficar vazio.', true);
      return;
    }
    if (trimmed.length > 127) {
      showToast('O texto excede o limite de 127 caracteres!', true);
      return;
    }

    const linkCheck = normalizeBemteviLink(editingPostLink);
    if (!linkCheck.valid) {
      showToast(linkCheck.error || 'Link inválido.', true);
      return;
    }

    setIsSavingEdit(true);
    try {
      const nextTags = extractHashtagsFromText(trimmed);
      const nowIso = new Date().toISOString();
      await updateBemteviPostInDb(post.id, {
        content: trimmed,
        link: linkCheck.normalized || null,
        tags: nextTags,
        isEdited: true
      });

      const updatedPosts = posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              content: trimmed,
              tags: nextTags,
              link: linkCheck.normalized,
              isEdited: true,
              updatedAt: nowIso
            }
          : p
      );
      setPosts(updatedPosts);
      setTrending(computeTrendingTopicsFromDbPosts(updatedPosts));
      setEditingPostId(null);
      setEditingPostText('');
      setEditingPostLink('');
      showToast('Postagem atualizada com sucesso! ✓');
    } catch {
      showToast('Não foi possível salvar a edição.', true);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Toggle Like on Post (persisted)
  const handleToggleLike = async (post: BemteviPost) => {
    const isLiked = post.likedBy.includes(myUser.uid);
    const updatedLikedBy = isLiked
      ? post.likedBy.filter((id) => id !== myUser.uid)
      : [...post.likedBy, myUser.uid];

    const updatedLikesCount = isLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, likedBy: updatedLikedBy, likesCount: updatedLikesCount } : p
      )
    );

    await toggleBemteviPostLikeInDb(post.id, myUser.uid, updatedLikedBy, updatedLikesCount);
  };

  // Toggle Save on Post (persisted in localStorage + Firestore/API)
  const handleToggleSave = async (post: BemteviPost) => {
    const isSaved = savedPostIds.includes(post.id);
    const updatedSavedIds = isSaved
      ? savedPostIds.filter((id) => id !== post.id)
      : [...savedPostIds, post.id];

    const nextSavedBy = isSaved
      ? (post.savedBy || []).filter((id) => id !== myUser.uid)
      : Array.from(new Set([...(post.savedBy || []), myUser.uid]));
    const nextSavesCount = isSaved ? Math.max(0, (post.savesCount || 1) - 1) : (post.savesCount || 0) + 1;

    setSavedPostIds(updatedSavedIds);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, savedBy: nextSavedBy, savesCount: nextSavesCount } : p
      )
    );
    try {
      localStorage.setItem('bemtevi_saved_posts', JSON.stringify(updatedSavedIds));
    } catch {
      //
    }

    await toggleBemteviPostSaveInDb(post.id, nextSavedBy, nextSavesCount);
    showToast(isSaved ? 'Post removido dos seus salvos.' : 'Post salvo em Seus Salvos! 🔖');
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    try {
      await deleteBemteviPostInDb(postId);
      const updatedList = posts.filter((p) => p.id !== postId);
      setPosts(updatedList);
      setTrending(computeTrendingTopicsFromDbPosts(updatedList));
      showToast('Post excluído.');
    } catch {
      showToast('Erro ao excluir post.', true);
    }
  };

  // Share / Repost inside Bemtevi (persists sharesCount cleanly)
  const handleSharePost = async (post: BemteviPost) => {
    const nextSharesCount = (post.sharesCount || 0) + 1;

    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, sharesCount: nextSharesCount } : p))
    );
    await incrementBemteviPostShareInDb(post.id, nextSharesCount);

    if (post.sharedArticle) {
      setAttachedArticle(post.sharedArticle);
      const hash = (post.sharedArticle.setor || 'Geral').replace(/[^a-zA-Z0-9À-ÿ]/g, '');
      const draft = `Recomendo: #${hash} #WZZM`.slice(0, 127);
      setComposerText(draft);
      setActiveTab('feed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Artigo "${post.sharedArticle.titulo}" anexado para recompartilhar no Bemtevi! 🐦`);
    } else {
      const shareUrl = `${window.location.origin}/?uid=bemtevi&post=${encodeURIComponent(post.id)}`;
      navigator.clipboard?.writeText(shareUrl).catch(() => {});
      showToast('Link do post copiado e compartilhamento contabilizado! 🔗');
    }
  };

  // Follow / Unfollow User (persisted locally)
  const handleToggleFollow = (targetUser: BemteviUser) => {
    const isFollowing = myUser.following.includes(targetUser.uid);
    const updatedFollowing = isFollowing
      ? myUser.following.filter((id) => id !== targetUser.uid)
      : Array.from(new Set([...myUser.following, targetUser.uid]));

    setFollowingIds(updatedFollowing);
    try {
      const uidKey = `wzzm_bemtevi_following_${myUser.uid}`;
      localStorage.setItem(uidKey, JSON.stringify(updatedFollowing));
    } catch {
      //
    }

    setUsersList((prev) =>
      prev.map((u) => {
        if (u.uid === myUser.uid) {
          return { ...u, following: updatedFollowing };
        }
        if (u.uid === targetUser.uid) {
          const updatedFollowers = isFollowing
            ? u.followers.filter((id) => id !== myUser.uid)
            : Array.from(new Set([...u.followers, myUser.uid]));
          return { ...u, followers: updatedFollowers };
        }
        return u;
      })
    );

    showToast(isFollowing ? `Deixou de seguir ${targetUser.name}` : `Você agora segue ${targetUser.name}!`);
  };

  // Join / Leave Community (persisted)
  const handleToggleJoinCommunity = async (comm: BemteviCommunity) => {
    const isMember = comm.members.includes(myUser.uid);
    const updatedMembers = isMember
      ? comm.members.filter((id) => id !== myUser.uid)
      : Array.from(new Set([...comm.members, myUser.uid]));
    const updatedCount = isMember ? Math.max(0, comm.membersCount - 1) : comm.membersCount + 1;

    setCommunities((prev) =>
      prev.map((c) =>
        c.id === comm.id
          ? {
              ...c,
              members: updatedMembers,
              membersCount: updatedCount
            }
          : c
      )
    );
    if (activeCommunityView?.id === comm.id) {
      setActiveCommunityView((prev) =>
        prev ? { ...prev, members: updatedMembers, membersCount: updatedCount } : prev
      );
    }

    await toggleBemteviCommunityMemberInDb(comm.id, updatedMembers, updatedCount);
    showToast(
      isMember ? `Você saiu da comunidade ${comm.name}` : `Bem-vindo à comunidade ${comm.name}! 🎉`
    );
  };

  // Create Community
  const handleCreateCommunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName.trim() || newCommunityName.trim().length < 3) {
      showToast('O nome da comunidade deve ter pelo menos 3 caracteres!', true);
      return;
    }

    const newCommData = {
      name: newCommunityName.trim(),
      description: newCommunityDesc.trim() || 'Comunidade colaborativa do Bemtevi.',
      category: newCommunityCat,
      membersCount: 1,
      postsCount: 0,
      icon: '🏛️',
      createdBy: myUser.uid,
      members: [myUser.uid]
    };

    try {
      const savedComm = await createBemteviCommunityInDb(newCommData);
      setCommunities([savedComm, ...communities]);
      setIsCreateCommunityModalOpen(false);
      setNewCommunityName('');
      setNewCommunityDesc('');
      showToast(`Comunidade "${savedComm.name}" criada com sucesso! 🚀`);
    } catch {
      showToast('Erro ao criar comunidade.', true);
    }
  };

  // Open Comments Modal & load comments from database
  const handleOpenCommentsModal = async (post: BemteviPost) => {
    setSelectedPostForComments(post);
    try {
      const dbComments = await listBemteviCommentsFromDb(post.id);
      setComments(dbComments);
    } catch {
      //
    }
  };

  // Submit Comment
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostForComments || !newCommentText.trim() || isSubmittingComment) return;

    const trimmedComment = newCommentText.trim();
    if (trimmedComment.length > 280) {
      showToast('Comentário excede o limite máximo de 280 caracteres!', true);
      return;
    }

    setIsSubmittingComment(true);
    const commentData: Record<string, any> = {
      postId: selectedPostForComments.id,
      authorId: myUser.uid,
      authorName: myUser.name,
      authorHandle: myUser.handle,
      content: trimmedComment,
      likesCount: 0,
      likedBy: []
    };
    if (myUser.avatar) commentData.authorAvatar = myUser.avatar;

    try {
      const savedComment = await createBemteviCommentInDb(selectedPostForComments.id, commentData);
      setComments((prev) => [...prev, savedComment]);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPostForComments.id
            ? { ...p, commentsCount: p.commentsCount + 1 }
            : p
        )
      );
      setSelectedPostForComments((prev) =>
        prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev
      );
      setNewCommentText('');
      showToast('Comentário publicado! (+5 Karma)');
    } catch {
      showToast('Erro ao publicar comentário.', true);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Direct Message Send
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDmUser || !dmInputText.trim()) return;

    const convId = [myUser.uid, activeDmUser.uid].sort().join('_');
    const msgData: Record<string, any> = {
      conversationId: convId,
      senderId: myUser.uid,
      senderName: myUser.name,
      receiverId: activeDmUser.uid,
      text: dmInputText.trim()
    };
    if (myUser.avatar) msgData.senderAvatar = myUser.avatar;

    try {
      const savedMsg = await createBemteviMessageInDb(msgData);
      setMessages((prev) => [...prev, savedMsg]);
      setDmInputText('');
    } catch {
      showToast('Erro ao enviar mensagem privada.', true);
    }
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    let list = [...posts];

    if (activeCommunityView) {
      list = list.filter((p) => p.communityId === activeCommunityView.id);
    }

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (onlyWithArticles) {
      list = list.filter((p) => Boolean(p.sharedArticle));
    }

    if (selectedTagFilter) {
      const targetTag = selectedTagFilter.toLowerCase();
      list = list.filter(
        (p) =>
          p.content.toLowerCase().includes(targetTag) ||
          (Array.isArray(p.tags) && p.tags.some((tg) => tg.toLowerCase() === targetTag))
      );
    }

    if (feedFilter === 'myPosts') {
      list = list.filter((p) => p.authorId === myUser.uid);
    } else if (feedFilter === 'latest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // forYou: algorithmic (likes + comments + shares + recency)
      list.sort((a, b) => {
        const tsA = new Date(a.createdAt).getTime() || 0;
        const tsB = new Date(b.createdAt).getTime() || 0;
        const scoreA = a.likesCount * 2 + a.commentsCount * 3 + (a.sharesCount || 0) * 2 + tsA / 1e11;
        const scoreB = b.likesCount * 2 + b.commentsCount * 3 + (b.sharesCount || 0) * 2 + tsB / 1e11;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [posts, feedFilter, selectedCategory, selectedTagFilter, onlyWithArticles, activeCommunityView, myUser.uid]);

  // Saved Posts List
  const savedPosts = useMemo(() => {
    return posts.filter((p) => savedPostIds.includes(p.id));
  }, [posts, savedPostIds]);

  // Safe Relative Time & Full Date Helpers
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'agora';
    const ts = new Date(dateStr).getTime();
    if (Number.isNaN(ts)) return 'recente';
    const diff = Math.max(0, (Date.now() - ts) / 1000);
    if (diff < 60) return locale === 'pt-BR' ? 'agora' : locale === 'es-ES' ? 'ahora' : 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(ts).toLocaleDateString(locale);
  };

  const formatFullTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    const ts = new Date(dateStr).getTime();
    if (Number.isNaN(ts)) return '';
    return new Date(ts).toLocaleString(locale);
  };

  const renderPostContentWithHashtags = (content: string) => {
    const parts = content.split(/(#[a-zA-Z0-9_À-ÿ]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#') && part.length > 1) {
        const cleanTag = part.trim();
        return (
          <button
            key={`${cleanTag}-${idx}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTagFilter(cleanTag);
              setActiveTab('feed');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-[#818cf8] hover:text-amber-400 font-semibold hover:underline cursor-pointer"
            title={`Filtrar postagens com ${cleanTag}`}
          >
            {cleanTag}
          </button>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  // Render Shared Article Card inside Bemtevi Post (Integração de Artigos à Rede Social)
  const renderSharedArticleCard = (article: BemteviSharedArticle) => {
    return (
      <div className="mt-3 bg-[#111115] hover:bg-[#141419] border-2 border-stone-700/80 hover:border-amber-500/70 rounded-xl p-3.5 transition-all shadow-md space-y-2 text-left">
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-[#D97706] text-black font-bold px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
              {article.setor || "Artigo do Acervo"}
            </span>
            <span className="text-stone-400 font-medium">Coleção: {article.colecao || "Geral"}</span>
          </div>
          <span className="bg-stone-800 text-stone-300 px-1.5 py-0.5 border border-stone-700 font-mono text-[9px]">
            UID: {article.id}
          </span>
        </div>

        <h4
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenArticle) {
              onOpenArticle(article);
            } else if (onNavigateUid) {
              onNavigateUid(article.id);
            }
          }}
          className="font-editorial text-sm sm:text-base font-bold text-stone-100 hover:text-amber-400 cursor-pointer leading-snug transition-colors"
          title="Clique para ler este artigo completo no leitor oficial"
        >
          {article.titulo}
        </h4>

        {article.descricao && (
          <p className="text-xs text-stone-300 font-serif leading-relaxed line-clamp-2">
            {article.descricao.replace(/<[^>]*>/g, '')}
          </p>
        )}

        <div className="pt-2 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenArticle) {
                onOpenArticle(article);
              } else if (onNavigateUid) {
                onNavigateUid(article.id);
              }
            }}
            className="paper-button bg-[#667eea] hover:bg-[#5a6fd6] text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-none"
          >
            <BookOpen className="w-3 h-3" />
            <span>Ler Artigo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const uidUrl = `${window.location.origin}/?uid=${encodeURIComponent(article.id)}`;
                navigator.clipboard.writeText(uidUrl);
                showToast(`Link do UID copiado: ?uid=${article.id}`);
              }}
              className="text-stone-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
              title="Copiar link com ?uid="
            >
              <span>Copiar Link (?uid=)</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAttachedArticle(article);
                const hash = (article.setor || 'Geral').replace(/[^a-zA-Z0-9À-ÿ]/g, '');
                setComposerText(`Recomendo a leitura: #${hash} `);
                setActiveTab('feed');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                showToast(`Artigo "${article.titulo}" anexado ao seu post no Bemtevi! 🐦`);
              }}
              className="text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
              title="Compartilhar este artigo dentro do Bemtevi"
            >
              <Share2 className="w-2.5 h-2.5" />
              <span>Repostar no Bemtevi</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0F0F12] text-stone-100 font-sans pb-16 animate-fade-in">
      {/* ======================================================== */}
      {/* 1. BEMTEVI TOP SUB-BAR & MULTI-LANGUAGE SELECTOR         */}
      {/* ======================================================== */}
      <div className="bg-[#18181D] border-b border-stone-800 px-4 py-2 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-[#667eea] text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              {t.subtitle} 🚧 BETA
            </span>
            <span className="text-stone-400 hidden sm:inline text-[11px]">
              {t.appSlogan} • {t.motto}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector as in translate/i18n.js */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-stone-700 rounded-full px-2.5 py-1">
              <Globe className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={locale}
                onChange={(e) => {
                  setLocale(e.target.value as any);
                  showToast(`Idioma alterado para: ${e.target.options[e.target.selectedIndex].text}`);
                }}
                className="bg-transparent text-stone-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="pt-BR" className="bg-[#1a1a2e] text-white">🇧🇷 Português</option>
                <option value="en-US" className="bg-[#1a1a2e] text-white">🇺🇸 English</option>
                <option value="es-ES" className="bg-[#1a1a2e] text-white">🇪🇸 Español</option>
              </select>
            </div>

            {/* User Karma Level Chip */}
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{myUser.karma} Karma ({myUser.level})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN 3-COLUMN SOCIAL NETWORK LAYOUT                   */}
      {/* ======================================================== */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ==================================================== */}
        {/* LEFT COLUMN: SOCIAL NAVIGATION & ACTIONS (Col 3)     */}
        {/* ==================================================== */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-4 shadow-lg sticky top-14 space-y-2">
            <div className="flex items-center gap-3 px-2 py-3 border-b border-stone-800 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-bold text-lg shadow-md">
                🐦
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-white tracking-wide">
                  Bemtevi
                </h3>
                <p className="text-[10px] font-mono text-stone-400">
                  Rede Social WazzimaGiygg
                </p>
              </div>
            </div>

            {/* Navigation buttons */}
            {[
              { id: 'feed', label: t.forYou, icon: Flame },
              { id: 'explore', label: t.explore, icon: Search },
              { id: 'communities', label: t.communities, icon: Users },
              { id: 'messages', label: t.messages, icon: MessageCircle },
              { id: 'saved', label: t.saved, icon: Bookmark },
              { id: 'profile', label: t.myProfile, icon: Sparkles }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !activeCommunityView;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setActiveCommunityView(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#667eea] text-white shadow-md font-semibold'
                      : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Quick Action: New Community */}
            <div className="pt-3 border-t border-stone-800">
              <button
                onClick={() => setIsCreateCommunityModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>{t.createCommunity}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ==================================================== */}
        {/* CENTER COLUMN: ACTIVE SOCIAL FEED / CONTENT (Col 6)  */}
        {/* ==================================================== */}
        <main className="lg:col-span-6 space-y-5">
          
          {/* COMMUNITY BANNER HEADER IF VIEWING COMMUNITY */}
          {activeCommunityView && (
            <div className="bg-[#181820] border-2 border-[#667eea]/40 rounded-2xl p-5 shadow-xl animate-fade-in relative overflow-hidden">
              <button
                onClick={() => setActiveCommunityView(null)}
                className="mb-3 text-xs font-mono text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Feed Geral</span>
              </button>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-2xl">
                    {activeCommunityView.icon}
                  </div>
                  <div>
                    <h2 className="font-editorial text-2xl font-bold text-white">
                      {activeCommunityView.name}
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {activeCommunityView.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 mt-2">
                      <span>👥 {activeCommunityView.membersCount} membros</span>
                      <span>•</span>
                      <span>📝 {activeCommunityView.postsCount} posts</span>
                      <span>•</span>
                      <span className="text-amber-400">{activeCommunityView.category}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleJoinCommunity(activeCommunityView)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
                    activeCommunityView.members.includes(myUser.uid)
                      ? 'bg-stone-800 text-stone-300 hover:bg-red-900/60 hover:text-red-200 border border-stone-700'
                      : 'bg-[#667eea] hover:bg-[#5a6fd6] text-white shadow-md'
                  }`}
                >
                  {activeCommunityView.members.includes(myUser.uid) ? 'Participando' : 'Participar'}
                </button>
              </div>
            </div>
          )}

          {/* VIEW 1: FEED & COMPOSER */}
          {activeTab === 'feed' && (
            <>
              {/* MICROBLOGGING COMPOSER (Strict 127 Chars) */}
              <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-4 shadow-xl">
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                      {myUser.avatar ? (
                        <img src={myUser.avatar} alt={myUser.name} className="w-full h-full object-cover" />
                      ) : (
                        myUser.name.charAt(0)
                      )}
                    </div>

                    <div className="flex-1">
                      <textarea
                        rows={2}
                        maxLength={127}
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        placeholder={t.placeholderPost}
                        className="w-full bg-transparent text-stone-100 placeholder-stone-500 text-sm focus:outline-none resize-none"
                      />

                      {/* Attached Article Preview */}
                      {attachedArticle && (
                        <div className="bg-[#121217] border border-amber-500/60 rounded-xl p-2.5 my-2 text-xs relative flex items-start justify-between gap-3 shadow-md">
                          <div className="space-y-0.5 overflow-hidden text-left">
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-400 text-black font-mono font-bold px-1.5 py-0.2 text-[9px] uppercase tracking-wider">
                                Artigo Vinculado
                              </span>
                              <span className="text-stone-400 font-mono text-[9px]">
                                UID: {attachedArticle.id}
                              </span>
                            </div>
                            <h5 className="font-editorial font-bold text-stone-100 text-xs truncate">
                              {attachedArticle.titulo}
                            </h5>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachedArticle(null);
                              if (onClearInitialSharedArticle) onClearInitialSharedArticle();
                            }}
                            className="text-stone-400 hover:text-red-400 p-1 cursor-pointer shrink-0"
                            title="Remover anexo do artigo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Optional Link Input (accepts domains, https://, or ?uid=...) */}
                      <div className="mt-2 pt-2 border-t border-stone-800/60">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          <input
                            type="text"
                            placeholder={t.linkPlaceholder}
                            value={composerLink}
                            onChange={(e) => {
                              setComposerLink(e.target.value);
                              if (composerLinkError) setComposerLinkError(null);
                            }}
                            className="w-full bg-transparent text-xs text-stone-300 placeholder-stone-600 focus:outline-none"
                          />
                        </div>
                        {composerLinkError && (
                          <p className="text-[11px] font-mono text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{composerLinkError}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Composer Footer: Category, Community, Article Picker, Character Counter, Submit */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      {/* Anexar Artigo Button */}
                      <button
                        type="button"
                        onClick={() => setIsArticlePickerOpen(true)}
                        className={`flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                          attachedArticle
                            ? 'bg-amber-400/20 text-amber-300 border-amber-500/50 font-bold'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700 hover:text-amber-300'
                        }`}
                        title="Anexar um artigo do site para compartilhar no Bemtevi"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>{attachedArticle ? 'Trocar Artigo' : 'Anexar Artigo'}</span>
                      </button>

                      {/* Category select */}
                      <select
                        value={composerCategory}
                        onChange={(e) => setComposerCategory(e.target.value as BemteviCategory)}
                        className="bg-stone-800 border border-stone-700 text-stone-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
                      >
                        {BEMTEVI_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      {/* Community selector */}
                      <select
                        value={composerCommunityId}
                        onChange={(e) => setComposerCommunityId(e.target.value)}
                        className="bg-stone-800 border border-stone-700 text-stone-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none max-w-[130px] truncate"
                      >
                        <option value="">Feed Geral</option>
                        {communities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Character Counter (Max 127) */}
                      <span
                        className={`text-xs font-mono font-bold ${
                          composerText.length >= 120
                            ? 'text-red-400 animate-pulse'
                            : composerText.length >= 100
                            ? 'text-amber-400'
                            : 'text-stone-500'
                        }`}
                      >
                        {composerText.length}/127
                      </span>

                      <button
                        type="submit"
                        disabled={isSubmittingPost || !composerText.trim() || composerText.length > 127}
                        className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 disabled:opacity-50 text-white px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{isSubmittingPost ? 'Publicando...' : t.postButton}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* FEED TABS (Para Você / Últimas / Minhas) & CATEGORY / ARTICLE / HASHTAG FILTERS */}
              <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-3 shadow-md space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'forYou', label: t.forYou },
                      { id: 'latest', label: t.latest },
                      { id: 'myPosts', label: t.myPosts }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFeedFilter(tab.id as any)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          feedFilter === tab.id
                            ? 'bg-stone-800 text-amber-400 border border-stone-700'
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setOnlyWithArticles((v) => !v)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                        onlyWithArticles
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-stone-400 hover:text-white border border-transparent'
                      }`}
                      title="Mostrar apenas postagens que compartilham artigos do portal"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Com Artigos</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-stone-500">
                    {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
                  </span>
                </div>

                {/* Active Hashtag Filter Badge */}
                {selectedTagFilter && (
                  <div className="flex items-center justify-between bg-[#667eea]/15 border border-[#667eea]/40 rounded-xl px-3 py-1.5 text-xs font-mono">
                    <span className="text-indigo-200 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#818cf8]" />
                      <span>Filtrando por: <strong className="text-white">{selectedTagFilter}</strong></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTagFilter(null)}
                      className="text-stone-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  </div>
                )}

                {/* Category Horizontal Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-0.5 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-[#667eea] text-white'
                        : 'bg-stone-800/80 text-stone-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  {BEMTEVI_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-0.5 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#667eea] text-white'
                          : 'bg-stone-800/80 text-stone-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* POSTS LIST */}
              <div className="space-y-4">
                {isLoadingData ? (
                  <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-10 text-center text-stone-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-stone-600 border-t-[#667eea] rounded-full animate-spin" />
                    <p>Sincronizando dados em tempo real com o banco de dados...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-10 text-center text-stone-500 font-mono text-xs space-y-2">
                    <p>Nenhuma postagem encontrada para os filtros selecionados.</p>
                    {(selectedTagFilter || selectedCategory !== 'all' || onlyWithArticles) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTagFilter(null);
                          setSelectedCategory('all');
                          setOnlyWithArticles(false);
                        }}
                        className="text-[#818cf8] hover:underline cursor-pointer"
                      >
                        Limpar filtros e ver todas as postagens
                      </button>
                    ) : (
                      <p className="text-stone-600">Seja o primeiro a publicar algo interessante no Bemtevi!</p>
                    )}
                  </div>
                ) : (
                  filteredPosts.map((post) => {
                    const isLiked = post.likedBy.includes(myUser.uid);
                    const isSaved = savedPostIds.includes(post.id);
                    const isOwner = post.authorId === myUser.uid;
                    const isEditingThis = editingPostId === post.id;

                    return (
                      <article
                        key={post.id}
                        className="bg-[#16161B] hover:bg-[#181820] border border-stone-800 hover:border-stone-700 rounded-2xl p-4 sm:p-5 transition-all shadow-md space-y-3"
                      >
                        {/* Header: Author, Badge, Time, Options */}
                        <div className="flex items-start justify-between gap-3">
                          <div
                            onClick={() => {
                              const authorUser = usersList.find((u) => u.uid === post.authorId);
                              if (authorUser) handleSelectUser(authorUser);
                            }}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <div className="w-10 h-10 rounded-full bg-stone-700 overflow-hidden flex items-center justify-center text-white font-bold">
                              {post.authorAvatar ? (
                                <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                              ) : (
                                post.authorName.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-sm text-white group-hover:text-[#667eea] transition-colors">
                                  {post.authorName}
                                </span>
                                <span className="text-xs text-stone-500">
                                  {post.authorHandle}
                                </span>
                                {post.authorBadge && (
                                  <span className="text-[10px] font-mono bg-stone-800 text-amber-300 border border-stone-700 px-1.5 py-0.2 rounded">
                                    {post.authorBadge}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5 flex-wrap">
                                <span title={formatFullTimestamp(post.createdAt)}>
                                  {formatTimeAgo(post.createdAt)}
                                </span>
                                {post.isEdited && (
                                  <span className="text-[10px] italic text-stone-400" title={formatFullTimestamp(post.updatedAt)}>
                                    (editado)
                                  </span>
                                )}
                                {post.isLocalOnly && (
                                  <span className="text-[9px] font-mono bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded border border-stone-700">
                                    Local
                                  </span>
                                )}
                                {post.communityName && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#667eea] hover:underline font-medium">
                                      {post.communityName}
                                    </span>
                                  </>
                                )}
                                <span>•</span>
                                <span className="text-stone-400">{post.category}</span>
                              </div>
                            </div>
                          </div>

                          {/* Edit & Delete if Owner */}
                          {isOwner && !isEditingThis && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditPost(post)}
                                className="text-stone-500 hover:text-amber-400 p-1 cursor-pointer"
                                title="Editar postagem"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post.id)}
                                className="text-stone-500 hover:text-red-400 p-1 cursor-pointer"
                                title="Excluir postagem"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inline Edit Mode vs Content Text */}
                        {isEditingThis ? (
                          <div className="bg-stone-900/70 border border-stone-700 rounded-xl p-3 space-y-2">
                            <textarea
                              rows={2}
                              maxLength={127}
                              value={editingPostText}
                              onChange={(e) => setEditingPostText(e.target.value)}
                              className="w-full bg-transparent text-sm text-white focus:outline-none resize-none"
                            />
                            <input
                              type="text"
                              value={editingPostLink}
                              onChange={(e) => setEditingPostLink(e.target.value)}
                              placeholder="Link opcional (https://... ou ?uid=...)"
                              className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-2.5 py-1 text-xs text-stone-300 focus:outline-none"
                            />
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] font-mono text-stone-400">
                                {editingPostText.length}/127
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingPostId(null)}
                                  className="text-xs font-mono text-stone-400 hover:text-white px-2.5 py-1 rounded-lg bg-stone-800 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingEdit || !editingPostText.trim() || editingPostText.length > 127}
                                  onClick={() => handleSaveEditPost(post)}
                                  className="text-xs font-mono font-bold text-white px-3 py-1 rounded-lg bg-[#667eea] hover:bg-[#5a6fd6] disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isSavingEdit ? 'Salvando...' : 'Salvar'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-stone-200 text-sm sm:text-base leading-relaxed break-words font-serif">
                            {renderPostContentWithHashtags(post.content)}
                          </p>
                        )}

                        {/* Shared Article Embed Card (Integração de Artigos no Bemtevi) */}
                        {post.sharedArticle && renderSharedArticleCard(post.sharedArticle)}

                        {/* Link preview card if attached (supports internal ?uid= navigation cleanly) */}
                        {post.link && (
                          post.link.startsWith('/?uid=') || post.link.startsWith('?uid=') ? (
                            <button
                              type="button"
                              onClick={() => {
                                const uidParam = post.link!.split('uid=')[1]?.split('&')[0];
                                if (uidParam && onNavigateUid) {
                                  onNavigateUid(decodeURIComponent(uidParam));
                                }
                              }}
                              className="w-full text-left block bg-stone-900/80 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/60 p-3 rounded-xl transition-colors text-xs font-mono group cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-2 text-stone-300 group-hover:text-amber-400">
                                <span className="truncate">Abrir referência interna: {post.link}</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              </div>
                            </button>
                          ) : (
                            <a
                              href={post.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-stone-900/80 hover:bg-stone-900 border border-stone-800 hover:border-stone-700 p-3 rounded-xl transition-colors text-xs font-mono group"
                            >
                              <div className="flex items-center justify-between gap-2 text-stone-400 group-hover:text-amber-400">
                                <span className="truncate">{post.link}</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              </div>
                            </a>
                          )
                        )}

                        {/* Interaction Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-xs text-stone-400 font-mono">
                          {/* Likes */}
                          <button
                            onClick={() => handleToggleLike(post)}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                              isLiked ? 'text-red-500 font-bold bg-red-500/10' : 'hover:text-red-400 hover:bg-stone-800'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                            <span>{post.likesCount}</span>
                          </button>

                          {/* Comments */}
                          <button
                            onClick={() => handleOpenCommentsModal(post)}
                            className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:text-blue-400 hover:bg-stone-800 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.commentsCount}</span>
                          </button>

                          {/* Share / Repost */}
                          <button
                            onClick={() => handleSharePost(post)}
                            className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:text-emerald-400 hover:bg-stone-800 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>{post.sharesCount}</span>
                          </button>

                          {/* Bookmark / Save */}
                          <button
                            onClick={() => handleToggleSave(post)}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                              isSaved ? 'text-amber-400 font-bold bg-amber-400/10' : 'hover:text-amber-300 hover:bg-stone-800'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                            <span className="hidden sm:inline">{isSaved ? 'Salvo' : 'Salvar'}</span>
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* VIEW 2: EXPLORAR (SEARCH, TRENDS & TOPICS) */}
          {activeTab === 'explore' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-4 shadow-xl space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={exploreQuery}
                    onChange={(e) => setExploreQuery(e.target.value)}
                    placeholder="Pesquisar posts, tags, pessoas e comunidades..."
                    className="w-full bg-[#1F1F26] border border-stone-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#667eea]"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  {(['all', 'posts', 'users', 'communities'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setExploreFilter(filter)}
                      className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                        exploreFilter === filter
                          ? 'bg-[#667eea] text-white font-bold'
                          : 'bg-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      {filter === 'all'
                        ? 'Todos'
                        : filter === 'posts'
                        ? 'Postagens'
                        : filter === 'users'
                        ? 'Usuários'
                        : 'Comunidades'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Se houver termo de busca, exibe resultados da pesquisa sincronizados */}
              {exploreQuery.trim() ? (
                <div className="space-y-4">
                  {(exploreFilter === 'all' || exploreFilter === 'posts') && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
                        Postagens Encontradas ({posts.filter(p => p.content.toLowerCase().includes(exploreQuery.toLowerCase().trim()) || (p.tags ? p.tags.some((t: string) => t.toLowerCase().includes(exploreQuery.toLowerCase().trim())) : false)).length})
                      </h4>
                      {posts.filter(p => p.content.toLowerCase().includes(exploreQuery.toLowerCase().trim()) || (p.tags ? p.tags.some((t: string) => t.toLowerCase().includes(exploreQuery.toLowerCase().trim())) : false)).length === 0 ? (
                        <p className="text-xs font-mono text-stone-500 bg-[#16161B] p-4 rounded-xl border border-stone-800">
                          Nenhuma postagem no banco de dados com este termo.
                        </p>
                      ) : (
                        posts.filter(p => p.content.toLowerCase().includes(exploreQuery.toLowerCase().trim()) || (p.tags ? p.tags.some((t: string) => t.toLowerCase().includes(exploreQuery.toLowerCase().trim())) : false)).map(post => (
                          <div key={post.id} className="bg-[#16161B] border border-stone-800 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                              <span className="font-bold text-white">{post.authorName}</span>
                              <span>{formatTimeAgo(post.createdAt)}</span>
                            </div>
                            <p className="text-stone-200 text-sm font-serif">{post.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {(exploreFilter === 'all' || exploreFilter === 'users') && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
                        Usuários Cadastrados ({usersList.filter(u => u.name.toLowerCase().includes(exploreQuery.toLowerCase().trim()) || u.handle.toLowerCase().includes(exploreQuery.toLowerCase().trim())).length})
                      </h4>
                      {usersList.filter(u => u.name.toLowerCase().includes(exploreQuery.toLowerCase().trim()) || u.handle.toLowerCase().includes(exploreQuery.toLowerCase().trim())).length === 0 ? (
                        <p className="text-xs font-mono text-stone-500 bg-[#16161B] p-4 rounded-xl border border-stone-800">
                          Nenhum usuário encontrado no banco de dados com este nome.
                        </p>
                      ) : (
                        usersList.filter(u => u.name.toLowerCase().includes(exploreQuery.toLowerCase().trim()) || u.handle.toLowerCase().includes(exploreQuery.toLowerCase().trim())).map(u => (
                          <div key={u.uid} onClick={() => handleSelectUser(u)} className="bg-[#16161B] border border-stone-800 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-stone-700">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-stone-700 flex items-center justify-center font-bold text-xs overflow-hidden">
                                {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                              </div>
                              <div>
                                <h5 className="font-bold text-xs text-stone-200">{u.name}</h5>
                                <span className="text-[10px] text-stone-500 font-mono">{u.handle}</span>
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleToggleFollow(u); }} className="text-[10px] font-mono px-3 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300">
                              {myUser.following.includes(u.uid) ? 'Seguindo' : 'Seguir'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {(exploreFilter === 'all' || exploreFilter === 'communities') && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
                        Comunidades ({communities.filter(c => c.name.toLowerCase().includes(exploreQuery.toLowerCase().trim()) || c.description.toLowerCase().includes(exploreQuery.toLowerCase().trim())).length})
                      </h4>
                      {communities.filter(c => c.name.toLowerCase().includes(exploreQuery.toLowerCase().trim()) || c.description.toLowerCase().includes(exploreQuery.toLowerCase().trim())).length === 0 ? (
                        <p className="text-xs font-mono text-stone-500 bg-[#16161B] p-4 rounded-xl border border-stone-800">
                          Nenhuma comunidade encontrada no banco de dados com este termo.
                        </p>
                      ) : (
                        communities.filter(c => c.name.toLowerCase().includes(exploreQuery.toLowerCase().trim()) || c.description.toLowerCase().includes(exploreQuery.toLowerCase().trim())).map(c => (
                          <div key={c.id} className="bg-[#16161B] border border-stone-800 rounded-xl p-4 flex items-center justify-between">
                            <div>
                              <h5 className="font-bold text-sm text-stone-200">{c.name}</h5>
                              <p className="text-xs text-stone-400 mt-0.5">{c.description}</p>
                            </div>
                            <button onClick={() => { setActiveCommunityView(c); setActiveTab('feed'); }} className="text-xs font-mono text-[#667eea] hover:underline font-bold">
                              Ver Feed →
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Trending Topics Grid in Explore (se sem busca ativa) */
                <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h3 className="font-editorial text-lg font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500" />
                    <span>Assuntos em Alta no Brasil & Rede WZZM</span>
                  </h3>

                  {trending.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 font-mono text-xs">
                      <p>Nenhum tópico em alta no banco de dados.</p>
                      <p className="mt-1 text-stone-600">Publique no feed utilizando #hashtags para gerar tendências reais.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {trending.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedTagFilter(item.tag);
                            setActiveTab('feed');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-3 bg-stone-900/60 hover:bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                            <span className="uppercase font-mono">{item.category}</span>
                            <span>#{idx + 1}</span>
                          </div>
                          <h4 className="font-bold text-sm text-stone-200 group-hover:text-[#667eea] transition-colors">
                            {item.tag}
                          </h4>
                          <p className="text-[11px] font-mono text-stone-400 mt-1">
                            {item.postsCount} postagens
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: COMUNIDADES */}
          {activeTab === 'communities' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-editorial text-2xl font-bold text-white">
                    Comunidades Bemtevi
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Grupos temáticos, coletivos de pesquisa e fóruns de colaboração.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateCommunityModalOpen(true)}
                  className="bg-[#667eea] hover:bg-[#5a6fd6] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Comunidade</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {communities.length === 0 ? (
                  <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-10 text-center text-stone-500 font-mono text-xs col-span-1 sm:col-span-2">
                    <p>Nenhuma comunidade cadastrada no banco de dados.</p>
                    <p className="mt-1 text-stone-600">Clique em &ldquo;Criar Comunidade&rdquo; para fundar a primeira comunidade no Bemtevi!</p>
                  </div>
                ) : (
                  communities.map((comm) => {
                  const isMember = comm.members.includes(myUser.uid);
                  return (
                    <div
                      key={comm.id}
                      className="bg-[#16161B] border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-stone-700 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-2xl">
                            {comm.icon}
                          </div>
                          <span className="text-[10px] font-mono bg-stone-800 text-amber-300 border border-stone-700 px-2 py-0.5 rounded uppercase">
                            {comm.category}
                          </span>
                        </div>

                        <h3 className="font-editorial text-lg font-bold text-white mt-3">
                          {comm.name}
                        </h3>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                          {comm.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-stone-500">
                          {comm.membersCount} membros • {comm.postsCount} posts
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveCommunityView(comm);
                              setActiveTab('feed');
                            }}
                            className="text-[#667eea] hover:underline font-bold text-[11px]"
                          >
                            Ver Feed →
                          </button>
                          <button
                            onClick={() => handleToggleJoinCommunity(comm)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all cursor-pointer ${
                              isMember
                                ? 'bg-stone-800 text-stone-400 border border-stone-700 hover:text-white'
                                : 'bg-[#667eea] text-white hover:bg-[#5a6fd6]'
                            }`}
                          >
                            {isMember ? 'Sair' : 'Entrar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>
          )}

          {/* VIEW 4: MENSAGENS DIRETAS (CHATS) */}
          {activeTab === 'messages' && (
            <div className="bg-[#16161B] border border-stone-800 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 sm:grid-cols-12 min-h-[500px]">
              {/* Left Chats List */}
              <div className="sm:col-span-5 border-r border-stone-800 p-4 space-y-3">
                <h3 className="font-editorial text-lg font-bold text-white border-b border-stone-800 pb-2">
                  Conversas Diretas
                </h3>
                <div className="space-y-2">
                  {usersList.filter((u) => u.uid !== myUser.uid).length === 0 ? (
                    <p className="text-xs font-mono text-stone-500 p-4 text-center">
                      Nenhum outro usuário cadastrado no banco de dados para conversar.
                    </p>
                  ) : (
                    usersList
                      .filter((u) => u.uid !== myUser.uid)
                      .map((user) => {
                        const isSelected = activeDmUser?.uid === user.uid;
                        return (
                          <div
                            key={user.uid}
                            onClick={() => setActiveDmUser(user)}
                            className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#667eea] text-white'
                                : 'bg-stone-900/60 hover:bg-stone-800 text-stone-200'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full bg-stone-700 flex items-center justify-center font-bold overflow-hidden text-xs">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                user.name.charAt(0)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs truncate">{user.name}</h4>
                              <p className="text-[10px] opacity-70 truncate font-mono">{user.handle}</p>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Right Conversation Window */}
              <div className="sm:col-span-7 flex flex-col justify-between p-4 bg-[#121216]">
                {activeDmUser ? (
                  <>
                    <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{activeDmUser.name}</span>
                        <span className="text-[10px] font-mono text-stone-500">{activeDmUser.handle}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-300 border border-emerald-600 px-2 py-0.5 rounded-full">
                        Online
                      </span>
                    </div>

                    {/* Messages history */}
                    <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[360px]">
                      {messages
                        .filter(
                          (m) =>
                            (m.senderId === activeDmUser.uid && (m.recipientId === myUser.uid || m.receiverId === myUser.uid)) ||
                            (m.senderId === myUser.uid && (m.recipientId === activeDmUser.uid || m.receiverId === activeDmUser.uid))
                        )
                        .map((m) => {
                          const isMe = m.senderId === myUser.uid;
                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              <span className="text-[9px] font-mono text-stone-500 mb-0.5">
                                {m.senderName} • {formatTimeAgo(m.createdAt)}
                              </span>
                              <div
                                className={`max-w-[80%] p-3 rounded-2xl text-xs font-mono ${
                                  isMe
                                    ? 'bg-[#667eea] text-white rounded-br-none'
                                    : 'bg-stone-800 text-stone-200 rounded-bl-none'
                                }`}
                              >
                                {m.text}
                              </div>
                            </div>
                          );
                        })}
                      {messages.filter(
                        (m) =>
                          (m.senderId === activeDmUser.uid && (m.recipientId === myUser.uid || m.receiverId === myUser.uid)) ||
                          (m.senderId === myUser.uid && (m.recipientId === activeDmUser.uid || m.receiverId === activeDmUser.uid))
                      ).length === 0 && (
                        <p className="text-center text-xs font-mono text-stone-500 py-10">
                          Nenhuma mensagem direta ainda com @{activeDmUser.handle}. Envie a primeira mensagem abaixo!
                        </p>
                      )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendDirectMessage} className="pt-3 border-t border-stone-800 flex gap-2">
                      <input
                        type="text"
                        placeholder="Digite uma mensagem privada..."
                        value={dmInputText}
                        onChange={(e) => setDmInputText(e.target.value)}
                        className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!dmInputText.trim()}
                        className="bg-[#667eea] hover:bg-[#5a6fd6] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500 font-mono text-xs p-8">
                    <MessageCircle className="w-10 h-10 mb-2 opacity-40 text-[#667eea]" />
                    <p>Selecione um usuário na coluna lateral para iniciar uma conversa direta.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 5: SALVOS (BOOKMARKS) */}
          {activeTab === 'saved' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h2 className="font-editorial text-2xl font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-6 h-6 text-amber-400" />
                  <span>Suas Postagens Salvas ({savedPosts.length})</span>
                </h2>
              </div>

              {savedPosts.length === 0 ? (
                <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-10 text-center text-stone-500 font-mono text-xs">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Você ainda não salvou nenhuma postagem.</p>
                  <p className="mt-1 text-stone-600">Clique no ícone de marcador nos posts para guardá-los aqui.</p>
                </div>
              ) : (
                savedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-[#16161B] border border-stone-800 rounded-2xl p-4 shadow-md space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                      <span className="font-bold text-white">{post.authorName}</span>
                      <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                    <p className="text-stone-200 text-sm font-serif">{post.content}</p>
                    {post.sharedArticle && renderSharedArticleCard(post.sharedArticle)}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                      <span className="text-amber-400 font-mono text-[11px]">{post.category}</span>
                      <button
                        onClick={() => handleToggleSave(post)}
                        className="text-red-400 hover:underline font-mono text-[11px]"
                      >
                        Remover dos salvos
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VIEW 6: MEU PERFIL (PROFILE) */}
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-[#16161B] border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Cover Banner */}
                <div className="h-36 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-amber-600"></div>

                {/* Profile info header */}
                <div className="px-6 pb-6 pt-0 relative">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 mb-4 gap-4">
                    <div className="w-24 h-24 rounded-2xl border-4 border-[#16161B] bg-stone-800 overflow-hidden shadow-2xl flex items-center justify-center font-bold text-3xl text-white">
                      {myUser.avatar ? (
                        <img src={myUser.avatar} alt={myUser.name} className="w-full h-full object-cover" />
                      ) : (
                        myUser.name.charAt(0)
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${getKarmaBadgeColor(myUser.level).bg} ${getKarmaBadgeColor(myUser.level).text} ${getKarmaBadgeColor(myUser.level).border}`}>
                        ⭐ Nível {myUser.level}
                      </span>
                    </div>
                  </div>

                  <h2 className="font-editorial text-2xl font-bold text-white">
                    {myUser.name}
                  </h2>
                  <p className="text-xs font-mono text-stone-400 mt-0.5">
                    {myUser.handle}
                  </p>

                  <p className="text-sm text-stone-300 mt-3 leading-relaxed max-w-xl">
                    {myUser.bio}
                  </p>

                  {/* Followers & Karma stats */}
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-stone-800 text-xs font-mono">
                    <div>
                      <strong className="text-white text-base">{myUser.following.length}</strong>{' '}
                      <span className="text-stone-400">Seguindo</span>
                    </div>
                    <div>
                      <strong className="text-white text-base">{myUser.followers.length}</strong>{' '}
                      <span className="text-stone-400">Seguidores</span>
                    </div>
                    <div>
                      <strong className="text-amber-400 text-base">{myUser.karma}</strong>{' '}
                      <span className="text-stone-400">Pontos de Karma</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Posts on Profile */}
              <div className="space-y-3">
                <h3 className="font-editorial text-lg font-bold text-white">
                  Suas Publicações ({posts.filter((p) => p.authorId === myUser.uid).length})
                </h3>
                {posts
                  .filter((p) => p.authorId === myUser.uid)
                  .map((post) => (
                    <div
                      key={post.id}
                      className="bg-[#16161B] border border-stone-800 rounded-2xl p-4 shadow-md space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                        <span className="font-bold text-white">{post.authorName}</span>
                        <span>{formatTimeAgo(post.createdAt)}</span>
                      </div>
                      <p className="text-stone-200 text-sm font-serif">{post.content}</p>
                      {post.sharedArticle && renderSharedArticleCard(post.sharedArticle)}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs font-mono text-stone-400">
                        <span>❤️ {post.likesCount} • 💬 {post.commentsCount}</span>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-400 hover:underline"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: TRENDING & WHO TO FOLLOW (Col 3)       */}
        {/* ==================================================== */}
        <aside className="lg:col-span-3 space-y-5">
          {/* TRENDING TOPICS */}
          <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="font-editorial text-base font-bold text-white flex items-center gap-2 border-b border-stone-800 pb-2">
              <TrendingUp className="w-4 h-4 text-[#667eea]" />
              <span>{t.trendingTitle}</span>
            </h3>

            <div className="space-y-2.5">
              {trending.length === 0 ? (
                <div className="p-3 bg-stone-900/40 border border-stone-800 rounded-xl text-center">
                  <p className="text-[11px] font-mono text-stone-500">
                    Nenhum tópico em alta no banco de dados. Crie posts com #hashtags para gerar tendências reais.
                  </p>
                </div>
              ) : (
                trending.slice(0, 5).map((trend, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedTagFilter(trend.tag);
                      setActiveTab('feed');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-between text-xs group cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-stone-500 uppercase">
                        {trend.category}
                      </span>
                      <h5 className="font-bold text-stone-300 group-hover:text-amber-400 transition-colors">
                        {trend.tag}
                      </h5>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500">
                      {trend.postsCount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* WHO TO FOLLOW (SUGESTÕES) */}
          <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="font-editorial text-base font-bold text-white flex items-center gap-2 border-b border-stone-800 pb-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{t.suggestionsTitle}</span>
            </h3>

            <div className="space-y-3">
              {usersList.filter((u) => u.uid !== myUser.uid).length === 0 ? (
                <div className="p-3 bg-stone-900/40 border border-stone-800 rounded-xl text-center">
                  <p className="text-[11px] font-mono text-stone-500">
                    Nenhum outro usuário cadastrado no banco de dados.
                  </p>
                </div>
              ) : (
                usersList
                  .filter((u) => u.uid !== myUser.uid)
                  .slice(0, 4)
                  .map((u) => {
                    const isFollowing = myUser.following.includes(u.uid);
                    return (
                      <div key={u.uid} className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => handleSelectUser(u)}
                          className="flex items-center gap-2 cursor-pointer group min-w-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              u.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-stone-200 group-hover:text-[#667eea] truncate">
                              {u.name}
                            </h5>
                            <span className="text-[10px] text-stone-500 font-mono truncate block">
                              {u.handle}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleFollow(u)}
                          className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full transition-colors shrink-0 cursor-pointer ${
                            isFollowing
                              ? 'bg-stone-800 text-stone-400 border border-stone-700 hover:text-white'
                              : 'bg-[#667eea] hover:bg-[#5a6fd6] text-white'
                          }`}
                        >
                          {isFollowing ? 'Seguindo' : 'Seguir'}
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* KARMA RULES CARD */}
          <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-4 shadow-xl space-y-2 text-xs font-mono">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>{t.karmaTitle}</span>
            </h4>
            <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
              O Bemtevi valoriza o conhecimento e o diálogo construtivo. Ganhe pontos ao publicar (+10), comentar (+5) e receber curtidas (+2).
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px]">
              <div className="bg-stone-900 p-1.5 rounded border border-stone-800">
                <span className="text-stone-400">Novato:</span> <strong className="text-white">0-50</strong>
              </div>
              <div className="bg-stone-900 p-1.5 rounded border border-stone-800">
                <span className="text-stone-400">Iniciante:</span> <strong className="text-white">51-200</strong>
              </div>
              <div className="bg-stone-900 p-1.5 rounded border border-stone-800">
                <span className="text-stone-400">Entusiasta:</span> <strong className="text-white">201-500</strong>
              </div>
              <div className="bg-stone-900 p-1.5 rounded border border-stone-800">
                <span className="text-stone-400">Membro Ativo:</span> <strong className="text-white">501-1500</strong>
              </div>
              <div className="bg-stone-900 p-1.5 rounded border border-stone-800">
                <span className="text-stone-400">Veterano:</span> <strong className="text-white">1501-5000</strong>
              </div>
              <div className="bg-stone-900 p-1.5 rounded border border-stone-800">
                <span className="text-amber-400">Lendário:</span> <strong className="text-amber-300">5001+</strong>
              </div>
            </div>
          </div>

          {/* OFFICIAL FOOTER LINKS FROM REPO */}
          <div className="p-2 text-[10px] font-mono text-stone-500 space-y-2 leading-relaxed">
            <div className="flex flex-wrap gap-2">
              <a href="https://wazzimagiygg.com/donate/" target="_blank" rel="noreferrer" className="hover:text-amber-400">💝 Doação</a>
              <span>•</span>
              {onOpenLgpdModal ? (
                <button
                  type="button"
                  onClick={onOpenLgpdModal}
                  className="hover:text-emerald-400 font-bold text-emerald-400 flex items-center gap-1 cursor-pointer"
                  title="Regras da LGPD à mostra para ciência absoluta de cumprimento"
                >
                  🛡️ Regras LGPD à Amostra
                </button>
              ) : (
                <a href="https://wazzimagiygg.com/LGPD" target="_blank" rel="noreferrer" className="hover:text-stone-300">🔒 LGPD</a>
              )}
              <span>•</span>
              <a href="https://wazzimagiygg.com/MarcoCivil" target="_blank" rel="noreferrer" className="hover:text-stone-300">📜 Marco Civil</a>
              <span>•</span>
              <a href="https://bemtevi.wazzimagiygg.com/" target="_blank" rel="noreferrer" className="text-[#667eea] hover:underline">Domínio Oficial</a>
            </div>
            <p>© 2026 Bemtevi • WazzimaGiygg</p>
          </div>
        </aside>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL DE COMENTÁRIOS                                   */}
      {/* ======================================================== */}
      {selectedPostForComments && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#16161B] border border-stone-700 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-editorial text-lg font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#667eea]" />
                <span>{t.commentsTitle}</span>
              </h3>
              <button
                onClick={() => setSelectedPostForComments(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Post Quote */}
            <div className="p-4 bg-stone-900/60 border-b border-stone-800 text-xs">
              <div className="flex items-center gap-2 font-mono mb-1">
                <span className="font-bold text-white">{selectedPostForComments.authorName}</span>
                <span className="text-stone-500">{selectedPostForComments.authorHandle}</span>
              </div>
              <p className="text-stone-300 font-serif text-sm line-clamp-3">
                {selectedPostForComments.content}
              </p>
            </div>

            {/* Comments List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {comments
                .filter((c) => c.postId === selectedPostForComments.id)
                .map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 bg-stone-900/50 border border-stone-800 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-stone-500">
                      <span className="font-bold text-stone-300">{comm.authorName}</span>
                      <span>{formatTimeAgo(comm.createdAt)}</span>
                    </div>
                    <p className="text-stone-200 font-sans">{comm.content}</p>
                  </div>
                ))}
              {comments.filter((c) => c.postId === selectedPostForComments.id).length === 0 && (
                <p className="text-center text-xs font-mono text-stone-500 py-6">
                  Nenhum comentário ainda. Seja o primeiro a responder!
                </p>
              )}
            </div>

            {/* Comment Form (Max 280 chars) */}
            <form onSubmit={handleSendComment} className="p-4 border-t border-stone-800 bg-[#121216] space-y-2">
              <textarea
                rows={2}
                maxLength={280}
                required
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Escreva um comentário público... (máx. 280 caracteres)"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-white placeholder-stone-500 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-stone-500">
                  {newCommentText.length}/280
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newCommentText.trim()}
                  className="bg-[#667eea] hover:bg-[#5a6fd6] disabled:opacity-50 text-white font-bold text-xs px-4 py-1.5 rounded-full cursor-pointer uppercase tracking-wider"
                >
                  Enviar Comentário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL DE CRIAR COMUNIDADE                             */}
      {/* ======================================================== */}
      {isCreateCommunityModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#16161B] border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-editorial text-lg font-bold text-white flex items-center gap-2">
                <span>🏛️</span>
                <span>{t.createCommunity}</span>
              </h3>
              <button
                onClick={() => setIsCreateCommunityModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommunitySubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-stone-300 font-bold uppercase mb-1">
                  Nome da Comunidade *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="Ex: Filosofia & Ciência Livre"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold uppercase mb-1">
                  Categoria
                </label>
                <select
                  value={newCommunityCat}
                  onChange={(e) => setNewCommunityCat(e.target.value as BemteviCategory)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  {BEMTEVI_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-bold uppercase mb-1">
                  Descrição do Propósito
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  placeholder="Descreva as diretrizes e tópicos debatidos neste espaço..."
                  value={newCommunityDesc}
                  onChange={(e) => setNewCommunityDesc(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-white focus:outline-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-bold py-2.5 rounded-xl uppercase tracking-wider text-xs cursor-pointer shadow-lg"
              >
                🚀 Criar Comunidade
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL DE PERFIL DE USUÁRIO (PROFILE MODAL)            */}
      {/* ======================================================== */}
      {selectedProfileUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#16161B] border border-stone-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative">
            <div className="h-28 bg-gradient-to-r from-[#667eea] to-[#764ba2] relative p-3 flex items-start justify-between">
              {/* 3.05.6.d Controles de Retornar e Avançar no Modal */}
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-xl border border-white/10">
                {onNavigateBack && (
                  <button
                    type="button"
                    onClick={onNavigateBack}
                    disabled={!canGoBack}
                    className={`flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded cursor-pointer transition-all ${
                      canGoBack
                        ? 'bg-white/20 text-white hover:bg-white/30 active:scale-95'
                        : 'text-stone-500 cursor-not-allowed opacity-50'
                    }`}
                    title="Retornar ao UID anterior no histórico do URL (3.05.6.d)"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Retornar</span>
                  </button>
                )}
                <div className="w-[1px] h-3 bg-white/20" />
                {onNavigateForward && (
                  <button
                    type="button"
                    onClick={onNavigateForward}
                    disabled={!canGoForward}
                    className={`flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded cursor-pointer transition-all ${
                      canGoForward
                        ? 'bg-white/20 text-white hover:bg-white/30 active:scale-95'
                        : 'text-stone-500 cursor-not-allowed opacity-50'
                    }`}
                    title="Avançar ao próximo UID no histórico do URL (3.05.6.d)"
                  >
                    <span>Avançar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <span className="text-[9px] font-mono text-amber-300 ml-1">
                  ?uid={selectedProfileUser.uid.length > 14 ? selectedProfileUser.uid.substring(0, 14) + '…' : selectedProfileUser.uid}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProfileUser(null)}
                className="bg-black/50 text-white rounded-full p-1.5 hover:bg-black transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 pt-0 relative">
              <div className="w-16 h-16 rounded-xl border-4 border-[#16161B] bg-stone-800 -mt-8 mb-3 overflow-hidden flex items-center justify-center font-bold text-xl text-white">
                {selectedProfileUser.avatar ? (
                  <img src={selectedProfileUser.avatar} alt={selectedProfileUser.name} className="w-full h-full object-cover" />
                ) : (
                  selectedProfileUser.name.charAt(0)
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-editorial text-lg font-bold text-white">
                    {selectedProfileUser.name}
                  </h3>
                  <p className="text-xs font-mono text-stone-400">
                    {selectedProfileUser.handle}
                  </p>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getKarmaBadgeColor(selectedProfileUser.level).bg} ${getKarmaBadgeColor(selectedProfileUser.level).text} ${getKarmaBadgeColor(selectedProfileUser.level).border}`}>
                  {selectedProfileUser.level}
                </span>
              </div>

              <p className="text-xs text-stone-300 mt-3 leading-relaxed">
                {selectedProfileUser.bio}
              </p>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-800 text-xs font-mono">
                <div>
                  <strong className="text-white">{selectedProfileUser.followers.length}</strong>{' '}
                  <span className="text-stone-400">Seguidores</span>
                </div>
                <div>
                  <strong className="text-white">{selectedProfileUser.following.length}</strong>{' '}
                  <span className="text-stone-400">Seguindo</span>
                </div>
                <div>
                  <strong className="text-amber-400">{selectedProfileUser.karma}</strong>{' '}
                  <span className="text-stone-400">Karma</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-800 flex gap-2">
                <button
                  onClick={() => handleToggleFollow(selectedProfileUser)}
                  className="flex-1 bg-[#667eea] hover:bg-[#5a6fd6] text-white text-xs font-bold py-2 rounded-xl cursor-pointer"
                >
                  {myUser.following.includes(selectedProfileUser.uid) ? 'Deixar de Seguir' : 'Seguir'}
                </button>
                <button
                  onClick={() => {
                    setActiveDmUser(selectedProfileUser);
                    setActiveTab('messages');
                    setSelectedProfileUser(null);
                  }}
                  className="px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold py-2 rounded-xl cursor-pointer"
                >
                  Enviar Mensagem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 6. MODAL SELETOR DE ARTIGOS DO ACERVO PARA COMPARTILHAR NO BEMTEVI */}
      {isArticlePickerOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#16161B] border-2 border-stone-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-editorial text-lg font-bold text-white">
                  Anexar Artigo do Acervo ao Bemtevi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsArticlePickerOpen(false)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={articlePickerSearch}
                onChange={(e) => setArticlePickerSearch(e.target.value)}
                placeholder="Buscar artigo por título, setor ou UID..."
                className="w-full bg-[#121217] border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#667eea]"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar font-mono text-xs">
              {availableArticles.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs">
                  Nenhum artigo disponível no momento para compartilhamento.
                </div>
              ) : (
                availableArticles
                  .filter((art) => {
                    if (!articlePickerSearch.trim()) return true;
                    const q = articlePickerSearch.toLowerCase();
                    return (
                      (art.titulo || '').toLowerCase().includes(q) ||
                      (art.id || '').toLowerCase().includes(q) ||
                      (art.setor || '').toLowerCase().includes(q)
                    );
                  })
                  .map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        setAttachedArticle({
                          id: art.id,
                          titulo: art.titulo,
                          descricao: art.descricao || '',
                          setor: art.setor || 'Geral',
                          colecao: art.colecao || 'Acervo',
                          criadorEmail: art.criadorEmail
                        });
                        setIsArticlePickerOpen(false);
                        setArticlePickerSearch('');
                        if (!composerText.trim()) {
                          const hashTag = (art.setor || 'Geral').replace(/[^a-zA-Z0-9À-ÿ]/g, '');
                          setComposerText(`Confiram este artigo: #${hashTag} #WZZM`);
                        }
                        showToast(`Artigo "${art.titulo}" anexado ao seu post no Bemtevi! 🐦`);
                      }}
                      className="p-3 bg-[#121217] hover:bg-stone-900 border border-stone-800 hover:border-amber-400/60 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors text-left"
                    >
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-[#D97706] text-black font-bold px-1.5 py-0.2 text-[9px] uppercase">
                            {art.setor || 'Geral'}
                          </span>
                          <span className="text-[9px] text-stone-400">UID: {art.id}</span>
                        </div>
                        <h5 className="font-editorial text-sm font-bold text-stone-200 truncate">
                          {art.titulo}
                        </h5>
                        {art.descricao && (
                          <p className="text-[11px] text-stone-400 line-clamp-1 font-serif">
                            {art.descricao.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="shrink-0 bg-stone-800 hover:bg-[#667eea] text-stone-200 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors"
                      >
                        Anexar
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
