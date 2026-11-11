/**
 * @file Watchlist.ts
 * @description Tipos para a funcionalidade de Lista de Vigilância (Watchlist) do WikiZero.
 */

import type { Page, PageVersion } from '../types';

export interface WatchlistItem {
  id?: string;
  userId?: string;
  pageId?: string;
  articleId?: string;
  articleTitle?: string;
  pageUid?: string;
  dataAdicionado?: string;
  createdAt?: string;
}

export interface WatchedPageDetail {
  pageId: string;
  page?: Page | null;
  watchlistEntry: WatchlistItem;
  latestVersion?: PageVersion | null;
  recentVersions?: PageVersion[];
}
