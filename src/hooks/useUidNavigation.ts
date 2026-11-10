/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 3.05.6.d - Inserir o uso do retornar e avançar para navegar pelo UID presente no URL do site
 * Gerenciador de navegação sincronizado com o parâmetro `?uid=<id>` no URL do site e botões nativos do navegador.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const PORTAL_TAB_METADATA = [
  { id: 'wikiworldweb', label: 'WikiWorldWeb', description: 'Edição Geral: Notícias & Sociedade' },
  { id: 'materiadeensaio', label: 'Matéria de Ensaio', description: 'Matérias de Ensaio & Opinião' },
  { id: 'academico', label: 'Acadêmico', description: 'Metodologia e Pesquisa Acadêmica' },
  { id: 'materia', label: 'Matérias Didáticas', description: 'Ensino Fundamental e Médio' },
  { id: 'uwgbooks', label: 'UWG Books', description: 'Acervo Digital de Livros e Obras' },
  { id: 'wnpx', label: 'WNPX / WikiNotPedia', description: 'Enciclopédia Livre e Aberta WNPX' },
  { id: 'dossie', label: 'Dossiê & Abusos', description: 'Dossiê de Abusos da Wikipédia' },
  { id: 'tickets', label: 'Ouvidoria & Tickets', description: 'Central de Atendimento e LGPD' },
  { id: 'chat', label: 'Chat & Mensagens', description: 'Comunicação em Tempo Real' },
  { id: 'notmediawiki', label: 'NotMediaWiki (Beta)', description: 'Motor Wiki Descentralizado' },
  { id: 'bemtevi', label: 'Bemtevi (Rede Social)', description: 'Rede Social e Microblogging' },
  { id: 'lgpd', label: 'Regras LGPD', description: 'Conformidade Lei 13.709/2018' }
] as const;

export type PortalTabId = typeof PORTAL_TAB_METADATA[number]['id'];

export const ALL_PORTAL_TAB_IDS = PORTAL_TAB_METADATA.map((t) => t.id);

export function parseTabFromUid(uid: string | null | undefined): PortalTabId | null {
  if (!uid) return null;
  const clean = uid.trim().toLowerCase();
  const stripped = clean.startsWith('tab_') ? clean.substring(4) : clean;
  const match = PORTAL_TAB_METADATA.find((t) => t.id === stripped);
  if (match) return match.id;
  if (stripped === 'inicio' || stripped === 'home') return 'wikiworldweb';
  return null;
}

export function isTabUid(uid: string | null | undefined): boolean {
  return parseTabFromUid(uid) !== null;
}

export interface UidNavigationState {
  currentUid: string | null;
  uidHistory: string[];
  historyIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  navigateToUid: (uid: string) => void;
  replaceUid: (uid: string) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  jumpToIndex: (index: number) => void;
  clearUid: () => void;
  copyShareableUrl: () => boolean;
}

export function useUidNavigation(): UidNavigationState {
  // Extract ?uid= from current URL
  const getUidFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');
    return uid && uid.trim() !== '' ? uid.trim() : null;
  };

  const initialUid = getUidFromUrl();

  const [currentUid, setCurrentUid] = useState<string | null>(initialUid);
  const [uidHistory, setUidHistory] = useState<string[]>(() => (initialUid ? [initialUid] : []));
  const [historyIndex, setHistoryIndex] = useState<number>(() => (initialUid ? 0 : -1));

  // Ref to always have latest state inside popstate event listener
  const stateRef = useRef({ currentUid, uidHistory, historyIndex });
  useEffect(() => {
    stateRef.current = { currentUid, uidHistory, historyIndex };
  }, [currentUid, uidHistory, historyIndex]);

  // Sync initial state into history entry if not already set
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentFromUrl = getUidFromUrl();
    if (currentFromUrl && !window.history.state?.uid) {
      const url = new URL(window.location.href);
      window.history.replaceState(
        { uid: currentFromUrl, uidIndex: 0, timestamp: Date.now() },
        '',
        url.toString()
      );
    }
  }, []);

  // Handle URL popstate (triggered by native browser Back / Forward buttons and history.back/forward)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const urlUid = getUidFromUrl();
      const currentRef = stateRef.current;

      if (event.state && typeof event.state.uidIndex === 'number') {
        const targetIndex = event.state.uidIndex;
        const targetUid = event.state.uid !== undefined ? event.state.uid : urlUid;
        setHistoryIndex(targetIndex);
        setCurrentUid(targetUid);
      } else if (urlUid) {
        // Find if this UID is already in our history stack
        const existingIdx = currentRef.uidHistory.lastIndexOf(urlUid);
        if (existingIdx !== -1) {
          setHistoryIndex(existingIdx);
          setCurrentUid(urlUid);
        } else {
          // New UID encountered via direct navigation or external change
          setUidHistory((prev) => [...prev, urlUid]);
          setHistoryIndex(currentRef.uidHistory.length);
          setCurrentUid(urlUid);
        }
      } else {
        // URL has no UID parameter
        setCurrentUid(null);
        setHistoryIndex(-1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Update browser URL query parameter with pushState
  const setUrlUid = useCallback((uid: string | null, targetIndex: number) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (uid) {
      url.searchParams.set('uid', uid);
    } else {
      url.searchParams.delete('uid');
    }

    const nextState = { uid, uidIndex: targetIndex, timestamp: Date.now() };
    window.history.pushState(nextState, '', url.toString());
  }, []);

  // Navigate to a new UID (pushes to history stack)
  const navigateToUid = useCallback((uid: string) => {
    if (!uid) return;
    const cleanUid = uid.trim();
    if (!cleanUid) return;

    const { currentUid: cur, uidHistory: hist, historyIndex: idx } = stateRef.current;

    // If clicking on the currently active UID, do nothing to avoid duplicate history entries
    if (cur === cleanUid && idx >= 0) {
      return;
    }

    // Standard browser history behavior: discard forward stack beyond current index
    const baseHistory = idx >= 0 ? hist.slice(0, idx + 1) : [];
    const newHistory = [...baseHistory, cleanUid];
    const newIndex = newHistory.length - 1;

    setUidHistory(newHistory);
    setHistoryIndex(newIndex);
    setCurrentUid(cleanUid);

    setUrlUid(cleanUid, newIndex);
  }, [setUrlUid]);

  // Replace current UID in URL and history without creating a new history step
  const replaceUid = useCallback((uid: string) => {
    if (!uid || typeof window === 'undefined') return;
    const cleanUid = uid.trim();
    if (!cleanUid) return;

    const url = new URL(window.location.href);
    url.searchParams.set('uid', cleanUid);

    const nextState = { uid: cleanUid, uidIndex: 0, timestamp: Date.now() };
    window.history.replaceState(nextState, '', url.toString());

    setCurrentUid(cleanUid);
    setUidHistory([cleanUid]);
    setHistoryIndex(0);
  }, []);

  // Navigate Back (Retornar) - delegates to native window.history.back()
  const navigateBack = useCallback(() => {
    if (typeof window === 'undefined') return;
    const { historyIndex: idx } = stateRef.current;
    if (idx > 0) {
      try {
        window.history.back();
      } catch (e) {
        console.warn('history.back error:', e);
      }
    }
  }, []);

  // Navigate Forward (Avançar) - delegates to native window.history.forward()
  const navigateForward = useCallback(() => {
    if (typeof window === 'undefined') return;
    const { historyIndex: idx, uidHistory: hist } = stateRef.current;
    if (idx >= 0 && idx < hist.length - 1) {
      try {
        window.history.forward();
      } catch (e) {
        console.warn('history.forward error:', e);
      }
    }
  }, []);

  // Jump directly to an index in the stack
  const jumpToIndex = useCallback((targetIndex: number) => {
    if (typeof window === 'undefined') return;
    const { historyIndex: curIdx, uidHistory: hist } = stateRef.current;
    if (targetIndex >= 0 && targetIndex < hist.length && targetIndex !== curIdx) {
      const delta = targetIndex - curIdx;
      try {
        window.history.go(delta);
      } catch {
        // Fallback if history.go fails
        const targetUid = hist[targetIndex];
        setHistoryIndex(targetIndex);
        setCurrentUid(targetUid);
        setUrlUid(targetUid, targetIndex);
      }
    }
  }, [setUrlUid]);

  // Clear UID from URL
  const clearUid = useCallback(() => {
    setCurrentUid(null);
    setHistoryIndex(-1);
    setUrlUid(null, -1);
  }, [setUrlUid]);

  // Copy shareable link
  const copyShareableUrl = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      navigator.clipboard.writeText(window.location.href);
      return true;
    } catch {
      return false;
    }
  }, []);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex >= 0 && historyIndex < uidHistory.length - 1;

  return {
    currentUid,
    uidHistory,
    historyIndex,
    canGoBack,
    canGoForward,
    navigateToUid,
    replaceUid,
    navigateBack,
    navigateForward,
    jumpToIndex,
    clearUid,
    copyShareableUrl
  };
}
