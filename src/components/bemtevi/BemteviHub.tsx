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
  ArrowLeft
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
  BEMTEVI_CATEGORIES,
  BEMTEVI_TRANSLATIONS,
  SEED_BEMTEVI_POSTS,
  SEED_BEMTEVI_COMMUNITIES,
  SEED_BEMTEVI_USERS,
  SEED_BEMTEVI_COMMENTS,
  SEED_BEMTEVI_TRENDING,
  SEED_BEMTEVI_NOTIFICATIONS,
  SEED_BEMTEVI_MESSAGES,
  getKarmaLevel,
  getKarmaBadgeColor
} from '../../data/bemteviData';

interface BemteviHubProps {
  currentUser?: any;
  showToast: (msg: string, isError?: boolean) => void;
  onOpenArticleByUrl?: (url: string) => void;
}

export default function BemteviHub({ currentUser, showToast }: BemteviHubProps) {
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
  const [activeCommunityView, setActiveCommunityView] = useState<BemteviCommunity | null>(null);

  // In-Memory Data Stores (synced to /api/bemtevi/*)
  const [posts, setPosts] = useState<BemteviPost[]>(SEED_BEMTEVI_POSTS);
  const [comments, setComments] = useState<BemteviComment[]>(SEED_BEMTEVI_COMMENTS);
  const [communities, setCommunities] = useState<BemteviCommunity[]>(SEED_BEMTEVI_COMMUNITIES);
  const [usersList, setUsersList] = useState<BemteviUser[]>(SEED_BEMTEVI_USERS);
  const [trending, setTrending] = useState<BemteviTrendingTopic[]>(SEED_BEMTEVI_TRENDING);
  const [messages, setMessages] = useState<BemteviDirectMessage[]>(SEED_BEMTEVI_MESSAGES);
  const [savedPostIds, setSavedPostIds] = useState<string[]>(['post-1', 'post-3']);

  // Post Composer State (strictly max 127 chars as in repo)
  const [composerText, setComposerText] = useState('');
  const [composerLink, setComposerLink] = useState('');
  const [composerCategory, setComposerCategory] = useState<BemteviCategory>('Geral');
  const [composerCommunityId, setComposerCommunityId] = useState<string>('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Active Modals
  const [selectedPostForComments, setSelectedPostForComments] = useState<BemteviPost | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newCommunityCat, setNewCommunityCat] = useState<BemteviCategory>('Geral');

  const [selectedProfileUser, setSelectedProfileUser] = useState<BemteviUser | null>(null);

  // Direct Message Active Chat
  const [activeDmUser, setActiveDmUser] = useState<BemteviUser | null>(null);
  const [dmInputText, setDmInputText] = useState('');

  // Explore Search
  const [exploreQuery, setExploreQuery] = useState('');
  const [exploreFilter, setExploreFilter] = useState<'all' | 'posts' | 'users' | 'communities'>('all');

  // Load from backend API if available
  useEffect(() => {
    const fetchSocialData = async () => {
      try {
        const [postsRes, commsRes, trendRes] = await Promise.allSettled([
          fetch('/api/bemtevi/posts'),
          fetch('/api/bemtevi/communities'),
          fetch('/api/bemtevi/trending')
        ]);

        if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
          const data = await postsRes.value.json();
          if (Array.isArray(data.posts) && data.posts.length > 0) {
            setPosts(data.posts);
          }
        }
        if (commsRes.status === 'fulfilled' && commsRes.value.ok) {
          const data = await commsRes.value.json();
          if (Array.isArray(data.communities) && data.communities.length > 0) {
            setCommunities(data.communities);
          }
        }
        if (trendRes.status === 'fulfilled' && trendRes.value.ok) {
          const data = await trendRes.value.json();
          if (Array.isArray(data.trending) && data.trending.length > 0) {
            setTrending(data.trending);
          }
        }
      } catch (err) {
        console.warn('Backend Bemtevi fallback to local memory state:', err);
      }
    };

    fetchSocialData();
  }, []);

  // Current session user details in Bemtevi format
  const myUser: BemteviUser = useMemo(() => {
    const uid = currentUser?.uid || 'usr-guest';
    const existing = usersList.find((u) => u.uid === uid || u.handle === `@${currentUser?.email?.split('@')[0]}`);
    if (existing) return existing;

    const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Leitor WZZM';
    const handle = `@${(currentUser?.email?.split('@')[0] || 'leitor_anon').toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
    return {
      uid,
      name,
      handle,
      avatar: currentUser?.photoURL || undefined,
      bio: 'Membro ativo da rede livre Bemtevi no portal WazzimaGiygg.',
      karma: 120,
      level: 'Iniciante',
      followers: [],
      following: ['usr-pedro'],
      badges: ['Membro'],
      joinedAt: new Date().toISOString()
    };
  }, [currentUser, usersList]);

  // Handle Post Creation (max 127 characters)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim()) {
      showToast(t.placeholderPost, true);
      return;
    }

    if (composerText.length > 127) {
      showToast('O texto excede o limite máximo de 127 caracteres do Bemtevi!', true);
      return;
    }

    setIsSubmittingPost(true);
    const targetComm = communities.find((c) => c.id === composerCommunityId);

    const newPost: BemteviPost = {
      id: `post-${Date.now()}`,
      authorId: myUser.uid,
      authorName: myUser.name,
      authorHandle: myUser.handle,
      authorAvatar: myUser.avatar,
      authorBadge: myUser.level,
      authorKarma: myUser.karma + 10,
      content: composerText.trim(),
      link: composerLink.trim() || undefined,
      category: composerCategory,
      communityId: composerCommunityId || undefined,
      communityName: targetComm?.name,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      likedBy: [],
      savedBy: [],
      createdAt: new Date().toISOString()
    };

    // Update state locally
    setPosts([newPost, ...posts]);
    setComposerText('');
    setComposerLink('');
    setComposerCommunityId('');

    // Award user karma (+10)
    setUsersList((prev) =>
      prev.map((u) => (u.uid === myUser.uid ? { ...u, karma: u.karma + 10, level: getKarmaLevel(u.karma + 10) } : u))
    );

    showToast('Post publicado com sucesso no Bemtevi! (+10 Karma)', false);

    // Sync to backend
    try {
      await fetch('/api/bemtevi/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });
    } catch {
      // Handled silently
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Toggle Like on Post
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

    // Sync to backend
    fetch(`/api/bemtevi/posts/${post.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: myUser.uid })
    }).catch(() => {});
  };

  // Toggle Save on Post
  const handleToggleSave = (post: BemteviPost) => {
    const isSaved = savedPostIds.includes(post.id);
    if (isSaved) {
      setSavedPostIds(savedPostIds.filter((id) => id !== post.id));
      showToast('Post removido dos seus salvos.');
    } else {
      setSavedPostIds([...savedPostIds, post.id]);
      showToast('Post salvo com sucesso em Seus Salvos! 🔖');
    }
  };

  // Delete Post
  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast('Post removido do feed.');
    fetch(`/api/bemtevi/posts/${postId}`, { method: 'DELETE' }).catch(() => {});
  };

  // Share / Copy Link
  const handleSharePost = (post: BemteviPost) => {
    const shareUrl = `${window.location.origin}/#bemtevi/post/${post.id}`;
    navigator.clipboard?.writeText(shareUrl);
    showToast('Link do post copiado para a área de transferência! 🔗');

    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, sharesCount: p.sharesCount + 1 } : p))
    );
  };

  // Follow / Unfollow User
  const handleToggleFollow = (targetUser: BemteviUser) => {
    const isFollowing = myUser.following.includes(targetUser.uid);
    const updatedFollowing = isFollowing
      ? myUser.following.filter((id) => id !== targetUser.uid)
      : [...myUser.following, targetUser.uid];

    setUsersList((prev) =>
      prev.map((u) => {
        if (u.uid === myUser.uid) {
          return { ...u, following: updatedFollowing };
        }
        if (u.uid === targetUser.uid) {
          const updatedFollowers = isFollowing
            ? u.followers.filter((id) => id !== myUser.uid)
            : [...u.followers, myUser.uid];
          return { ...u, followers: updatedFollowers };
        }
        return u;
      })
    );

    showToast(isFollowing ? `Deixou de seguir ${targetUser.name}` : `Você agora segue ${targetUser.name}!`);
  };

  // Join / Leave Community
  const handleToggleJoinCommunity = (comm: BemteviCommunity) => {
    const isMember = comm.members.includes(myUser.uid);
    const updatedMembers = isMember
      ? comm.members.filter((id) => id !== myUser.uid)
      : [...comm.members, myUser.uid];

    setCommunities((prev) =>
      prev.map((c) =>
        c.id === comm.id
          ? {
              ...c,
              members: updatedMembers,
              membersCount: isMember ? Math.max(0, c.membersCount - 1) : c.membersCount + 1
            }
          : c
      )
    );

    showToast(
      isMember ? `Você saiu da comunidade ${comm.name}` : `Bem-vindo à comunidade ${comm.name}! 🎉`
    );
  };

  // Create Community
  const handleCreateCommunitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName.trim() || newCommunityName.length < 3) {
      showToast('O nome da comunidade deve ter pelo menos 3 caracteres!', true);
      return;
    }

    const newComm: BemteviCommunity = {
      id: `comm-${Date.now()}`,
      name: newCommunityName.trim(),
      description: newCommunityDesc.trim() || 'Comunidade colaborativa do Bemtevi.',
      category: newCommunityCat,
      membersCount: 1,
      postsCount: 0,
      icon: '🏛️',
      createdBy: myUser.uid,
      members: [myUser.uid],
      createdAt: new Date().toISOString()
    };

    setCommunities([newComm, ...communities]);
    setIsCreateCommunityModalOpen(false);
    setNewCommunityName('');
    setNewCommunityDesc('');
    showToast(`Comunidade "${newComm.name}" criada com sucesso! 🚀`);
  };

  // Submit Comment
  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostForComments || !newCommentText.trim()) return;

    if (newCommentText.length > 280) {
      showToast('Comentário excede o limite máximo de 280 caracteres!', true);
      return;
    }

    setIsSubmittingComment(true);
    const commentItem: BemteviComment = {
      id: `comm-${Date.now()}`,
      postId: selectedPostForComments.id,
      authorId: myUser.uid,
      authorName: myUser.name,
      authorHandle: myUser.handle,
      authorAvatar: myUser.avatar,
      content: newCommentText.trim(),
      likesCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString()
    };

    setComments([...comments, commentItem]);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === selectedPostForComments.id
          ? { ...p, commentsCount: p.commentsCount + 1 }
          : p
      )
    );

    setNewCommentText('');
    setIsSubmittingComment(false);
    showToast('Comentário publicado! (+5 Karma)');
  };

  // Direct Message Send
  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDmUser || !dmInputText.trim()) return;

    const convId = [myUser.uid, activeDmUser.uid].sort().join('_');
    const newMsg: BemteviDirectMessage = {
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderId: myUser.uid,
      senderName: myUser.name,
      senderAvatar: myUser.avatar,
      receiverId: activeDmUser.uid,
      text: dmInputText.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages([...messages, newMsg]);
    setDmInputText('');
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    let list = [...posts];

    // Filter by active community
    if (activeCommunityView) {
      return list.filter((p) => p.communityId === activeCommunityView.id);
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Filter by Tab
    if (feedFilter === 'myPosts') {
      list = list.filter((p) => p.authorId === myUser.uid);
    } else if (feedFilter === 'latest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // forYou: algorithmic (likes + recency)
      list.sort((a, b) => {
        const scoreA = a.likesCount * 2 + a.commentsCount * 3 + new Date(a.createdAt).getTime() / 1e11;
        const scoreB = b.likesCount * 2 + b.commentsCount * 3 + new Date(b.createdAt).getTime() / 1e11;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [posts, feedFilter, selectedCategory, activeCommunityView, myUser.uid]);

  // Saved Posts List
  const savedPosts = useMemo(() => {
    return posts.filter((p) => savedPostIds.includes(p.id));
  }, [posts, savedPostIds]);

  // Relative Time helper
  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return t.motto ? 'agora' : 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
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

                      {/* Optional Link Input */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-800/60">
                        <LinkIcon className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <input
                          type="url"
                          placeholder={t.linkPlaceholder}
                          value={composerLink}
                          onChange={(e) => setComposerLink(e.target.value)}
                          className="w-full bg-transparent text-xs text-stone-300 placeholder-stone-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Composer Footer: Category, Community, Character Counter, Submit */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800">
                    <div className="flex items-center gap-2 text-xs">
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
                        <span>{t.postButton}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* FEED TABS (Para Você / Últimas / Minhas) & CATEGORY PILLS */}
              <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-3 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
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
                  </div>

                  <span className="text-[11px] font-mono text-stone-500">
                    {filteredPosts.length} posts
                  </span>
                </div>

                {/* Category Horizontal Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-0.5 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
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
                      className={`px-2.5 py-0.5 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
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
                {filteredPosts.length === 0 ? (
                  <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-10 text-center text-stone-500 font-mono text-xs">
                    <p>Nenhuma postagem encontrada para os filtros selecionados.</p>
                    <p className="mt-1 text-stone-600">Seja o primeiro a publicar algo interessante no Bemtevi!</p>
                  </div>
                ) : (
                  filteredPosts.map((post) => {
                    const isLiked = post.likedBy.includes(myUser.uid);
                    const isSaved = savedPostIds.includes(post.id);
                    const isOwner = post.authorId === myUser.uid;

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
                              if (authorUser) setSelectedProfileUser(authorUser);
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
                              <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                                <span>{formatTimeAgo(post.createdAt)}</span>
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

                          {/* Delete if Owner */}
                          {isOwner && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-stone-500 hover:text-red-400 p-1 cursor-pointer"
                              title="Excluir postagem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Content text */}
                        <p className="text-stone-200 text-sm sm:text-base leading-relaxed break-words font-serif">
                          {post.content}
                        </p>

                        {/* Link preview card if attached */}
                        {post.link && (
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
                            onClick={() => setSelectedPostForComments(post)}
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

              {/* Trending Topics Grid in Explore */}
              <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="font-editorial text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  <span>Assuntos em Alta no Brasil & Rede WZZM</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {trending.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setComposerText(`${item.tag} `);
                        setActiveTab('feed');
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
              </div>
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
                {communities.map((comm) => {
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
                })}
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
                  {usersList
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
                    })}
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
                      {messages.map((m) => {
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
              {trending.slice(0, 5).map((trend, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setComposerText(`${trend.tag} `);
                    setActiveTab('feed');
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
              ))}
            </div>
          </div>

          {/* WHO TO FOLLOW (SUGESTÕES) */}
          <div className="bg-[#16161B] border border-stone-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="font-editorial text-base font-bold text-white flex items-center gap-2 border-b border-stone-800 pb-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{t.suggestionsTitle}</span>
            </h3>

            <div className="space-y-3">
              {usersList
                .filter((u) => u.uid !== myUser.uid)
                .slice(0, 3)
                .map((u) => {
                  const isFollowing = myUser.following.includes(u.uid);
                  return (
                    <div key={u.uid} className="flex items-center justify-between gap-2">
                      <div
                        onClick={() => setSelectedProfileUser(u)}
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
                })}
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
              <a href="https://wazzimagiygg.com/LGPD" target="_blank" rel="noreferrer" className="hover:text-stone-300">🔒 LGPD</a>
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
            <div className="h-28 bg-gradient-to-r from-[#667eea] to-[#764ba2] relative">
              <button
                onClick={() => setSelectedProfileUser(null)}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 hover:bg-black"
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
    </div>
  );
}
