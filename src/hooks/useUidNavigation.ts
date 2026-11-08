/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 3.05.6.d - Inserir o uso do retornar e avançar para navegar pelo UID presente no URL do site
 * Gerenciador de navegação sincronizado com o parâmetro `?uid=<user_id>` no URL do site.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UidNavigationState {
  currentUid: string | null;
  uidHistory: string[];
  historyIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  navigateToUid: (uid: string) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  jumpToIndex: (index: number) => void;
  clearUid: () => void;
  copyShareableUrl: () => boolean;
}

export function useUidNavigation(): UidNavigationState {
  // Extract initial ?uid= from current URL
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

  // Handle URL popstate (browser back/forward or history.back()/history.forward())
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const urlUid = getUidFromUrl();
      const currentRef = stateRef.current;

      if (event.state && typeof event.state.uidIndex === 'number') {
        const targetIndex = event.state.uidIndex;
        setHistoryIndex(targetIndex);
        setCurrentUid(event.state.uid || urlUid);
      } else if (urlUid) {
        // Find if this UID is already in our history stack
        const existingIdx = currentRef.uidHistory.lastIndexOf(urlUid);
        if (existingIdx !== -1) {
          setHistoryIndex(existingIdx);
          setCurrentUid(urlUid);
        } else {
          // New UID encountered via external navigation
          setUidHistory((prev) => [...prev, urlUid]);
          setHistoryIndex(currentRef.uidHistory.length);
          setCurrentUid(urlUid);
        }
      } else {
        // URL has no UID
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

    // If clicking on the currently active UID, do nothing to avoid duplicate history noise
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

  // Navigate Back (Retornar)
  const navigateBack = useCallback(() => {
    const { historyIndex: idx, uidHistory: hist } = stateRef.current;
    if (idx > 0) {
      const prevIndex = idx - 1;
      const prevUid = hist[prevIndex];
      setHistoryIndex(prevIndex);
      setCurrentUid(prevUid);
      setUrlUid(prevUid, prevIndex);
      // Also notify window history
      try {
        window.history.back();
      } catch {
        // Safe fallback
      }
    }
  }, [setUrlUid]);

  // Navigate Forward (Avançar)
  const navigateForward = useCallback(() => {
    const { historyIndex: idx, uidHistory: hist } = stateRef.current;
    if (idx >= 0 && idx < hist.length - 1) {
      const nextIndex = idx + 1;
      const nextUid = hist[nextIndex];
      setHistoryIndex(nextIndex);
      setCurrentUid(nextUid);
      setUrlUid(nextUid, nextIndex);
      // Also notify window history
      try {
        window.history.forward();
      } catch {
        // Safe fallback
      }
    }
  }, [setUrlUid]);

  // Jump directly to an index in the stack
  const jumpToIndex = useCallback((targetIndex: number) => {
    const { uidHistory: hist } = stateRef.current;
    if (targetIndex >= 0 && targetIndex < hist.length) {
      const targetUid = hist[targetIndex];
      setHistoryIndex(targetIndex);
      setCurrentUid(targetUid);
      setUrlUid(targetUid, targetIndex);
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
    navigateBack,
    navigateForward,
    jumpToIndex,
    clearUid,
    copyShareableUrl
  };
}
