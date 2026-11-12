/**
 * @file WatchlistService.ts
 * @description Serviço para gerenciar a Lista de Vigilância (Watchlist) de usuários no Firestore.
 * Coleção: /watchlist/{docId} onde docId é determinístico `${userId}_${pageId}` ou aleatório.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb, handleFirestoreError, OperationType } from './firebase';
import { PageService } from './PageService';
import { VersionService } from './VersionService';
import { WatchlistItem, WatchedPageDetail, Page } from '../types';

const WATCHLIST_COLLECTION = 'watchlist';
const LOCAL_STORAGE_WATCHLIST_KEY = 'wikizero_watchlist_v1';

export class WatchlistService {
  private static generateWatchlistDocId(userId: string, pageId: string): string {
    const cleanUser = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanPage = pageId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${cleanUser}__${cleanPage}`;
  }

  /**
   * Adiciona uma página à lista de vigilância do usuário.
   */
  public static async addToWatchlist(userId: string, pageId: string): Promise<WatchlistItem> {
    if (!userId || !pageId) {
      throw new Error('UserId e PageId são obrigatórios para adicionar à lista de vigilância.');
    }

    const cleanUserId = userId.trim();
    const cleanPageId = pageId.trim();
    const docId = this.generateWatchlistDocId(cleanUserId, cleanPageId);
    const now = new Date().toISOString();

    const item: WatchlistItem = {
      id: docId,
      userId: cleanUserId,
      pageId: cleanPageId,
      createdAt: now,
    };

    // Atualiza cache local
    this.saveToLocalCache(item);

    try {
      const db = getDb();
      const docRef = doc(db, WATCHLIST_COLLECTION, docId);
      await setDoc(docRef, {
        ...item,
        _serverTimestamp: serverTimestamp(),
      });
      return item;
    } catch (error) {
      console.warn('[WatchlistService] Erro ao salvar vigilância no Firestore:', error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.CREATE, `${WATCHLIST_COLLECTION}/${docId}`);
      }
      return item;
    }
  }

  /**
   * Remove uma página da lista de vigilância do usuário.
   */
  public static async removeFromWatchlist(userId: string, pageId: string): Promise<void> {
    if (!userId || !pageId) return;

    const cleanUserId = userId.trim();
    const cleanPageId = pageId.trim();
    const docId = this.generateWatchlistDocId(cleanUserId, cleanPageId);

    // Remove do cache local
    this.removeFromLocalCache(cleanUserId, cleanPageId);

    try {
      const db = getDb();
      const docRef = doc(db, WATCHLIST_COLLECTION, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('[WatchlistService] Erro ao remover vigilância do Firestore:', error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.DELETE, `${WATCHLIST_COLLECTION}/${docId}`);
      }
    }
  }

  /**
   * Verifica se o usuário está vigiando a página especificada.
   */
  public static async isWatching(userId: string | null | undefined, pageId: string): Promise<boolean> {
    if (!userId || !pageId) return false;

    const cleanUserId = userId.trim();
    const cleanPageId = pageId.trim();
    const docId = this.generateWatchlistDocId(cleanUserId, cleanPageId);

    // 1. Tenta verificar no cache local primeiro
    const localItems = this.getLocalCache(cleanUserId);
    if (localItems.some((item) => item.pageId === cleanPageId)) {
      return true;
    }

    // 2. Consulta Firestore
    try {
      const db = getDb();
      const docRef = doc(db, WATCHLIST_COLLECTION, docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        this.saveToLocalCache(snap.data() as WatchlistItem);
        return true;
      }
    } catch (err) {
      console.warn('[WatchlistService] Erro ao verificar isWatching no Firestore:', err);
    }

    return false;
  }

  /**
   * Lista todas as páginas vigiadas por um usuário, enriquecidas com os dados da página e histórico recente.
   */
  public static async listWatchedPages(userId: string): Promise<WatchedPageDetail[]> {
    if (!userId || !userId.trim()) return [];

    const cleanUserId = userId.trim();
    let items: WatchlistItem[] = [];

    try {
      const db = getDb();
      const q = query(
        collection(db, WATCHLIST_COLLECTION),
        where('userId', '==', cleanUserId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        items = snap.docs.map((d) => d.data() as WatchlistItem);
        items.forEach((item) => this.saveToLocalCache(item));
      } else {
        items = this.getLocalCache(cleanUserId);
      }
    } catch (err) {
      console.warn('[WatchlistService] Erro ao listar do Firestore, fallback local:', err);
      items = this.getLocalCache(cleanUserId);
    }

    // Enriquecer com dados de páginas e últimas alterações (versões)
    const detailedPromises = items.map(async (entry) => {
      const pid = entry.pageId || entry.articleId || '';
      let page: Page | null = null;
      try {
        const parts = pid.split(':');
        if (parts.length >= 2) {
          page = await PageService.getPage(parts[0], parts.slice(1).join(':'));
        }
      } catch {}

      // Busca versões recentes para mostrar últimas alterações na página vigiada
      let recentVersions: any[] = [];
      let latestVersion: any = null;
      try {
        if (pid) {
          recentVersions = await VersionService.getVersions(pid);
          latestVersion = recentVersions.length > 0 ? recentVersions[0] : null;
        }
      } catch {}

      return {
        pageId: pid,
        page,
        watchlistEntry: entry,
        latestVersion,
        recentVersions: recentVersions.slice(0, 5),
      };
    });

    return await Promise.all(detailedPromises);
  }

  // ==========================================
  // CACHE LOCAL
  // ==========================================

  private static getLocalCache(userId: string): WatchlistItem[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_WATCHLIST_KEY);
      if (!raw) return [];
      const all: Record<string, WatchlistItem[]> = JSON.parse(raw);
      return all[userId] || [];
    } catch {
      return [];
    }
  }

  private static saveToLocalCache(item: WatchlistItem): void {
    try {
      const uid = item.userId || 'anon';
      const pid = item.pageId || item.articleId || '';
      const raw = localStorage.getItem(LOCAL_STORAGE_WATCHLIST_KEY);
      const all: Record<string, WatchlistItem[]> = raw ? JSON.parse(raw) : {};
      const list = all[uid] || [];
      const idx = list.findIndex((x: WatchlistItem) => (x.pageId || x.articleId) === pid);
      if (idx >= 0) {
        list[idx] = item;
      } else {
        list.push(item);
      }
      all[uid] = list;
      localStorage.setItem(LOCAL_STORAGE_WATCHLIST_KEY, JSON.stringify(all));
    } catch {}
  }

  private static removeFromLocalCache(userId: string, pageId: string): void {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_WATCHLIST_KEY);
      if (!raw) return;
      const all: Record<string, WatchlistItem[]> = JSON.parse(raw);
      const list = (all[userId] || []).filter((x) => x.pageId !== pageId);
      all[userId] = list;
      localStorage.setItem(LOCAL_STORAGE_WATCHLIST_KEY, JSON.stringify(all));
    } catch {}
  }
}
