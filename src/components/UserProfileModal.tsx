/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 3.05.6.d - Inserir o uso do retornar e avançar para navegar pelo UID presente no URL do site
 * Modal Universal de Perfil de Usuário com botões de histórico Retornar e Avançar.
 */

import React, { useEffect, useState } from 'react';
import {
  User,
  Shield,
  Award,
  Crown,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  X,
  ExternalLink,
  Flame,
  MessageCircle,
  FileText
} from 'lucide-react';
import { getUserByUidFromFirestore, AppUser } from '../firebase';
import { UidNavigationState } from '../hooks/useUidNavigation';

interface UserProfileModalProps {
  uid: string;
  nav: UidNavigationState;
  onClose: () => void;
  onOpenInBemtevi?: (uid: string) => void;
  showToast?: (msg: string, isError?: boolean) => void;
}

export default function UserProfileModal({
  uid,
  nav,
  onClose,
  onOpenInBemtevi,
  showToast
}: UserProfileModalProps) {
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getUserByUidFromFirestore(uid).then((res) => {
      if (isMounted) {
        setUserData(res);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [uid]);

  const handleCopyLink = () => {
    const ok = nav.copyShareableUrl();
    if (ok) {
      setCopied(true);
      if (showToast) showToast('Link do perfil copiado com ?uid=' + uid);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-[#16161B] text-[#F8F7F4] border-2 border-stone-600 rounded-none max-w-lg w-full overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
        
        {/* Top Header with 3.05.6.d Navigation Bar: Retornar e Avançar */}
        <div className="bg-[#0E0E12] border-b border-stone-700 px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Back & Forward Controls */}
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

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1 text-stone-400 hover:text-white transition-colors"
              title="Copiar URL com este UID"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-red-400 transition-colors"
              title="Fechar perfil"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Banner */}
        <div className="h-24 bg-gradient-to-r from-amber-900/60 via-stone-800 to-indigo-950 p-4 flex items-end">
          <span className="text-[10px] font-mono bg-black/60 text-amber-400 px-2 py-0.5 uppercase tracking-widest border border-amber-500/30">
            3.05.6.d • Perfil do UID
          </span>
        </div>

        {/* Profile Details Body */}
        <div className="p-5 relative">
          {/* Avatar */}
          <div className="-mt-14 mb-4 flex items-end justify-between">
            <div className="w-20 h-20 bg-stone-800 border-2 border-stone-600 flex items-center justify-center font-bold text-2xl text-amber-400 shadow-lg overflow-hidden">
              {userData?.profilePictureUrl ? (
                <img
                  src={userData.profilePictureUrl}
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-stone-400" />
              )}
            </div>

            {/* Role Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
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
              {isLoading
                ? 'Carregando usuário...'
                : userData?.name || 'Usuário Registrado'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-amber-400 bg-black/40 px-2 py-0.5 border border-stone-700">
                UID: {uid}
              </span>
              <span className="text-xs font-mono text-stone-500">
                ?uid={uid}
              </span>
            </div>
          </div>

          {/* User Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-5">
            <div className="bg-[#101014] p-3 border border-stone-800">
              <span className="text-stone-500 block text-[10px] uppercase">E-mail</span>
              <span className="text-stone-300 font-bold block truncate">
                {userData?.email || 'Privado (LGPD)'}
              </span>
            </div>
            <div className="bg-[#101014] p-3 border border-stone-800">
              <span className="text-stone-500 block text-[10px] uppercase">Desde</span>
              <span className="text-stone-300 font-bold block truncate">
                {userData?.createdAt
                  ? new Date(userData.createdAt).toLocaleDateString('pt-BR')
                  : 'Registrado'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
            {onOpenInBemtevi && (
              <button
                type="button"
                onClick={() => onOpenInBemtevi(uid)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-3 text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Ver na Rede Bem-Te-Vi</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 py-2 px-3 text-xs font-mono uppercase flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copiado!' : 'Copiar URL'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
