/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 3.05.6.d - Inserir o uso do retornar e avançar para navegar pelo UID presente no URL do site
 * Modal Universal de Perfil de Usuário com Infobox de Identificação e Acesso à Página NotMediaWiki.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  User,
  Award,
  Crown,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  X,
  MessageCircle,
  BookOpen,
  Code,
  Sparkles,
  History
} from 'lucide-react';
import {
  getUserByUidFromFirestore,
  getNotMediaWikiUserPageByUid,
  listWikiArticlesFromDb,
  listWikiRevisionsFromDb,
  listWikiEventsFromDb,
  listLocalUserWikiRevisions,
  AppUser
} from '../firebase';
import { UidNavigationState } from '../hooks/useUidNavigation';
import {
  buildPersonalUserPageSlug,
  buildUserInfoboxWikitext,
  extractUserNotMediaWikiContributions,
  resolveUserDisplayName,
  resolveUserRoleLabel,
  UserContributionEntry
} from '../config/userInfobox';

interface UserProfileModalProps {
  uid: string;
  nav: UidNavigationState;
  currentUser?: any;
  onClose: () => void;
  onOpenInBemtevi?: (uid: string) => void;
  onOpenInNotMediaWiki?: (uid: string, slug: string) => void;
  onOpenInfoboxTutorial?: () => void;
  showToast?: (msg: string, isError?: boolean) => void;
}

function formatBrDate(raw?: any): string {
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

export default function UserProfileModal({
  uid,
  nav,
  currentUser,
  onClose,
  onOpenInBemtevi,
  onOpenInNotMediaWiki,
  onOpenInfoboxTutorial,
  showToast
}: UserProfileModalProps) {
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [personalSlug, setPersonalSlug] = useState<string>('');
  const [contributions, setContributions] = useState<UserContributionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedInfobox, setCopiedInfobox] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      getUserByUidFromFirestore(uid),
      getNotMediaWikiUserPageByUid(uid),
      listWikiArticlesFromDb().catch(() => []),
      listWikiRevisionsFromDb().catch(() => []),
      listWikiEventsFromDb().catch(() => [])
    ]).then(([dbUser, userPage, dbArticles, dbRevs, dbEvents]) => {
      if (!isMounted) return;

      const resolvedUser: AppUser = dbUser || {
        uid,
        email: currentUser?.uid === uid ? currentUser?.email || '' : '',
        name:
          (currentUser?.uid === uid ? currentUser?.displayName || currentUser?.name : '') ||
          (userPage?.title ? userPage.title.replace(/^Usuário:/i, '') : '') ||
          `Usuário ${uid.slice(0, 8)}`,
        profilePictureUrl:
          (currentUser?.uid === uid ? currentUser?.photoURL || currentUser?.profilePictureUrl : '') ||
          (userPage as any)?.avatarUrl ||
          '',
        isAdmin: Boolean((userPage as any)?.isAdmin || (currentUser?.uid === uid && currentUser?.isAdmin)),
        isBanned: false,
        isTeacher: Boolean((userPage as any)?.isTeacher),
        isGuest: uid.startsWith('convid_') || Boolean((userPage as any)?.isGuest),
        createdAt: userPage?.createdAt || new Date().toISOString(),
        firstLoginAt: (userPage as any)?.firstLoginAt || userPage?.createdAt || new Date().toISOString(),
        lastLoginAt: userPage?.updatedAt || new Date().toISOString(),
        notMediaWikiPageSlug: userPage?.slug,
        notMediaWikiPageCreated: Boolean(userPage)
      };

      const displayName = resolveUserDisplayName(resolvedUser);
      const slug = userPage?.slug || resolvedUser.notMediaWikiPageSlug || buildPersonalUserPageSlug(displayName, uid);

      const allArticles = userPage
        ? [userPage, ...(dbArticles || []).filter((a: any) => a.slug?.toLowerCase() !== userPage.slug?.toLowerCase())]
        : dbArticles || [];
      const localUserRevs = listLocalUserWikiRevisions();
      const revMap = new Map<string, any>();
      for (const r of [...localUserRevs, ...(dbRevs || [])]) {
        if (r?.id && !revMap.has(r.id)) revMap.set(r.id, r);
      }

      const extracted = extractUserNotMediaWikiContributions(
        {
          uid,
          name: resolvedUser.name,
          displayName,
          email: resolvedUser.email,
          slug
        },
        allArticles,
        Array.from(revMap.values()),
        dbEvents || []
      );

      setUserData(resolvedUser);
      setPersonalSlug(slug);
      setContributions(extracted);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [uid, currentUser]);

  const resolvedDisplayName = useMemo(
    () => resolveUserDisplayName(userData || { uid }),
    [userData, uid]
  );

  const resolvedRoleLabel = useMemo(
    () => resolveUserRoleLabel(userData || { uid, isGuest: uid.startsWith('convid_') }),
    [userData, uid]
  );

  const infoboxWikitext = useMemo(
    () =>
      buildUserInfoboxWikitext(
        {
          uid,
          name: resolvedDisplayName,
          displayName: resolvedDisplayName,
          email: userData?.email,
          profilePictureUrl: userData?.profilePictureUrl,
          isAdmin: userData?.isAdmin,
          isTeacher: userData?.isTeacher,
          isGuest: userData?.isGuest || uid.startsWith('convid_'),
          isBanned: userData?.isBanned,
          createdAt: userData?.createdAt,
          firstLoginAt: userData?.firstLoginAt,
          lastLoginAt: userData?.lastLoginAt
        },
        {
          contributionsCount: contributions.length || 1,
          pagesCreated: Math.max(1, contributions.filter((c) => c.type === 'new').length),
          lastEditAt: contributions[0]?.timestamp || userData?.lastLoginAt
        }
      ),
    [uid, resolvedDisplayName, userData, contributions]
  );

  const handleCopyLink = () => {
    const ok = nav.copyShareableUrl();
    if (ok) {
      setCopied(true);
      if (showToast) showToast('Link do perfil copiado com ?uid=' + uid);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyInfobox = async () => {
    try {
      await navigator.clipboard.writeText(infoboxWikitext);
      setCopiedInfobox(true);
      if (showToast) showToast('Código {{Infobox Usuário}} copiado!');
      setTimeout(() => setCopiedInfobox(false), 2000);
    } catch {
      if (showToast) showToast('Não foi possível copiar o Infobox.', true);
    }
  };

  const effectivePersonalSlug = personalSlug || buildPersonalUserPageSlug(resolvedDisplayName, uid);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans overflow-y-auto">
      <div className="bg-[#16161B] text-[#F8F7F4] border-2 border-stone-600 rounded-none max-w-xl w-full overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative my-auto max-h-[92vh] flex flex-col">
        {/* Top Header with 3.05.6.d Navigation Bar: Retornar e Avançar */}
        <div className="bg-[#0E0E12] border-b border-stone-700 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={nav.navigateBack}
              disabled={!nav.canGoBack}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer ${
                nav.canGoBack
                  ? 'bg-stone-800 text-amber-300 hover:bg-stone-700 hover:text-white border border-stone-600'
                  : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
              }`}
              title="Retornar ao UID anterior no histórico do URL (3.05.6.d)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retornar</span>
            </button>

            <button
              type="button"
              onClick={nav.navigateForward}
              disabled={!nav.canGoForward}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer ${
                nav.canGoForward
                  ? 'bg-stone-800 text-amber-300 hover:bg-stone-700 hover:text-white border border-stone-600'
                  : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
              }`}
              title="Avançar ao próximo UID no histórico do URL (3.05.6.d)"
            >
              <span>Avançar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <span className="text-[10px] font-mono text-stone-400 ml-1 hidden sm:inline">
              Pilha: {nav.historyIndex + 1}/{nav.uidHistory.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Copiar URL com este UID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Fechar perfil"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          {/* Modal Banner */}
          <div className="h-24 bg-gradient-to-r from-amber-900/60 via-stone-800 to-indigo-950 p-4 flex items-end justify-between">
            <span className="text-[10px] font-mono bg-black/60 text-amber-400 px-2 py-0.5 uppercase tracking-widest border border-amber-500/30">
              3.05.6.d • Infobox &amp; Perfil do UID
            </span>
            <span className="text-[10px] font-mono bg-emerald-950/90 text-emerald-300 px-2 py-0.5 border border-emerald-700 uppercase">
              NotMediaWiki Identity
            </span>
          </div>

          {/* Profile Details Body */}
          <div className="p-5 relative">
            {/* Avatar & Badges */}
            <div className="-mt-14 mb-4 flex items-end justify-between gap-2">
              <div className="w-20 h-20 bg-stone-800 border-2 border-stone-600 flex items-center justify-center font-bold text-2xl text-amber-400 shadow-lg overflow-hidden shrink-0">
                {userData?.profilePictureUrl ? (
                  <img
                    src={userData.profilePictureUrl}
                    alt={resolvedDisplayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-stone-400" />
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {userData?.isAdmin && (
                  <span className="bg-red-950 text-red-300 border border-red-700 text-[10px] font-mono font-bold px-2 py-0.5 uppercase flex items-center gap-1">
                    <Crown className="w-3 h-3 text-red-400" />
                    Burocrata / Admin
                  </span>
                )}
                {userData?.isTeacher && (
                  <span className="bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-mono font-bold px-2 py-0.5 uppercase flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    Docente / Pesquisador
                  </span>
                )}
                {userData?.isBanned && (
                  <span className="bg-stone-800 text-stone-400 border border-stone-600 text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
                    Moderação Ativa
                  </span>
                )}
              </div>
            </div>

            {/* Name & UID Details */}
            <div className="mb-4">
              <h2 className="text-xl font-bold font-editorial text-white tracking-wide">
                {isLoading ? 'Carregando identificação...' : resolvedDisplayName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs font-mono text-amber-400 bg-black/40 px-2 py-0.5 border border-stone-700">
                  UID: {uid}
                </span>
                <span className="text-xs font-mono text-stone-400">
                  ?uid={uid}
                </span>
              </div>
            </div>

            {/* Standardized User Infobox Card (Required for all user accounts) */}
            <div className="border-2 border-amber-500/70 bg-[#101014] mb-4 overflow-hidden">
              <div className="bg-amber-700 text-white px-3 py-2 flex items-center justify-between border-b border-amber-500/70">
                <div>
                  <div className="font-editorial font-bold text-sm leading-tight">
                    Infobox Usuário: {resolvedDisplayName}
                  </div>
                  <div className="font-mono text-[10px] text-amber-100">
                    {resolvedRoleLabel} • NotMediaWiki
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyInfobox}
                  className="bg-black/35 hover:bg-black/60 text-white border border-amber-300/50 px-2 py-1 text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer"
                  title="Copiar código {{Infobox Usuário}} para usar no NotMediaWiki"
                >
                  {copiedInfobox ? <Check className="w-3 h-3 text-emerald-300" /> : <Code className="w-3 h-3" />}
                  <span>{copiedInfobox ? 'Copiado!' : 'Copiar {{Infobox}}'}</span>
                </button>
              </div>

              <table className="w-full text-xs font-mono border-collapse">
                <tbody className="divide-y divide-stone-800">
                  <tr>
                    <th className="py-1.5 px-3 text-left text-[10px] text-stone-400 uppercase bg-[#18181F] w-2/5">
                      Nome Público
                    </th>
                    <td className="py-1.5 px-3 text-stone-100 font-bold">{resolvedDisplayName}</td>
                  </tr>
                  <tr>
                    <th className="py-1.5 px-3 text-left text-[10px] text-stone-400 uppercase bg-[#18181F]">
                      UID Canônico
                    </th>
                    <td className="py-1.5 px-3 text-amber-300 break-all">{uid}</td>
                  </tr>
                  <tr>
                    <th className="py-1.5 px-3 text-left text-[10px] text-stone-400 uppercase bg-[#18181F]">
                      Tipo de Conta
                    </th>
                    <td className="py-1.5 px-3 text-stone-200">
                      {userData?.isGuest || uid.startsWith('convid_')
                        ? 'Sessão Convidado (24h)'
                        : 'Conta Google / WZZM Verificada'}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 px-3 text-left text-[10px] text-stone-400 uppercase bg-[#18181F]">
                      Primeiro Login
                    </th>
                    <td className="py-1.5 px-3 text-stone-200">
                      {formatBrDate(userData?.firstLoginAt || userData?.createdAt)}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 px-3 text-left text-[10px] text-stone-400 uppercase bg-[#18181F]">
                      Contribuições Wiki
                    </th>
                    <td className="py-1.5 px-3 text-emerald-300 font-bold">
                      {contributions.length} registro(s) no NotMediaWiki
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 px-3 text-left text-[10px] text-stone-400 uppercase bg-[#18181F]">
                      Página Pessoal
                    </th>
                    <td className="py-1.5 px-3">
                      {onOpenInNotMediaWiki ? (
                        <button
                          type="button"
                          onClick={() => onOpenInNotMediaWiki(uid, effectivePersonalSlug)}
                          className="text-sky-300 hover:text-amber-300 underline font-bold text-left cursor-pointer"
                        >
                          [[{effectivePersonalSlug}]]
                        </button>
                      ) : (
                        <span className="text-sky-300">[[{effectivePersonalSlug}]]</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 px-3 text-left text-[10px] text-stone-400 uppercase bg-[#18181F]">
                      Privacidade
                    </th>
                    <td className="py-1.5 px-3 text-stone-300">
                      {userData?.email && currentUser?.uid === uid
                        ? `${userData.email} (Visível ao titular)`
                        : 'Protegido (LGPD & Marco Civil BR)'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800">
              {onOpenInNotMediaWiki && (
                <button
                  type="button"
                  onClick={() => onOpenInNotMediaWiki(uid, effectivePersonalSlug)}
                  className="flex-1 min-w-[180px] bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Página NotMediaWiki &amp; Contribuições</span>
                </button>
              )}

              {onOpenInBemtevi && (
                <button
                  type="button"
                  onClick={() => onOpenInBemtevi(uid)}
                  className="flex-1 min-w-[160px] bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-3 text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Rede Bem-Te-Vi</span>
                </button>
              )}

              {onOpenInfoboxTutorial && (
                <button
                  type="button"
                  onClick={onOpenInfoboxTutorial}
                  className="bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-600 py-2 px-3 text-xs font-mono uppercase flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tutorial Infobox</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 py-2 px-3 text-xs font-mono uppercase flex items-center gap-1 cursor-pointer transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span>{copied ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

