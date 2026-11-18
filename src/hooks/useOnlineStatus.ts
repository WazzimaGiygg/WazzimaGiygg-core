/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { Article } from '../firebase';

const OFFLINE_CACHE_KEY = 'wzzm_offline_articles_cache_v1';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function saveOfflineArticlesSnapshot(articlesByCollection: Record<string, Article[]>): void {
  if (typeof window === 'undefined') return;
  try {
    const totalCount = Object.values(articlesByCollection).reduce(
      (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
      0
    );
    if (totalCount === 0) return;
    window.localStorage.setItem(
      OFFLINE_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        articles: articlesByCollection,
      })
    );
  } catch {
    // Ignore quota errors
  }
}

export function loadOfflineArticlesSnapshot(): Record<string, Article[]> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.articles === 'object' && parsed.articles !== null) {
      return parsed.articles as Record<string, Article[]>;
    }
    return null;
  } catch {
    return null;
  }
}
