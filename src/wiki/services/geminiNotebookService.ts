import { GeminiNotebookItem, GeminiNotebookSource, GeminiNotebookNote, UserProfile } from '../types';
import { getDbSafe } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { GeminiQuotaService } from './geminiQuotaService';

const LOCAL_STORAGE_KEY = 'wikizero_gemini_notebooks_v1';

export class GeminiNotebookService {
  /**
   * Obtém a lista de cadernos do usuário ou locais
   */
  static async getNotebooks(user: UserProfile | null): Promise<GeminiNotebookItem[]> {
    const userId = user?.uid;
    const local = this.getLocalNotebooks(userId);

    try {
      const db = getDbSafe();
      if (db && userId && !user.isGuest) {
        const colRef = collection(db, 'gemini_notebooks');
        const q = query(colRef, where('userId', '==', userId));
        const snap = await getDocs(q);
        const remoteList: GeminiNotebookItem[] = [];
        snap.forEach((d) => {
          remoteList.push(d.data() as GeminiNotebookItem);
        });

        if (remoteList.length > 0) {
          // Mescla e atualiza cache local
          const merged = [...remoteList];
          for (const loc of local) {
            if (!merged.some((m) => m.id === loc.id)) {
              merged.push(loc);
            }
          }
          localStorage.setItem(this.getStorageKey(userId), JSON.stringify(merged));
          return merged;
        }
      }
    } catch (err) {
      console.warn('[GeminiNotebookService] Falha ao consultar Firestore, usando cache local:', err);
    }

    return local;
  }

  private static getStorageKey(userId?: string): string {
    return `${LOCAL_STORAGE_KEY}_${userId || 'guest'}`;
  }

  private static getLocalNotebooks(userId?: string): GeminiNotebookItem[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[GeminiNotebookService] Erro ao ler localStorage:', err);
    }
    return [];
  }

  /**
   * Salva ou atualiza um caderno de pesquisa
   */
  static async saveNotebook(item: GeminiNotebookItem, user: UserProfile | null): Promise<void> {
    const userId = user?.uid;
    const list = this.getLocalNotebooks(userId);
    const index = list.findIndex((n) => n.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }

    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(list));

    // Sincroniza no Firestore
    try {
      const db = getDbSafe();
      if (db && userId && !user?.isGuest) {
        const docRef = doc(db, 'gemini_notebooks', item.id);
        await setDoc(docRef, item, { merge: true });
      }
    } catch (err) {
      console.warn('[GeminiNotebookService] Falha ao sincronizar caderno no Firestore:', err);
    }
  }

  /**
   * Remove um caderno
   */
  static async deleteNotebook(notebookId: string, user: UserProfile | null): Promise<void> {
    const userId = user?.uid;
    const list = this.getLocalNotebooks(userId).filter((n) => n.id !== notebookId);
    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(list));

    try {
      const db = getDbSafe();
      if (db && userId && !user?.isGuest) {
        const docRef = doc(db, 'gemini_notebooks', notebookId);
        await deleteDoc(docRef);
      }
    } catch (err) {
      console.warn('[GeminiNotebookService] Erro ao deletar caderno no Firestore:', err);
    }
  }

  /**
   * Executa a síntese do Gemini Notebook baseada nas fontes fornecidas.
   * Valida cota e oferece o plano pago se ultrapassar o limite gratuito.
   */
  static async synthesize(params: {
    sources: GeminiNotebookSource[];
    action: 'full_article' | 'section' | 'infobox' | 'timeline' | 'fact_check' | 'custom';
    customPrompt?: string;
    targetArticleTitle?: string;
    user: UserProfile | null;
  }): Promise<{
    wikitext: string;
    summary: string;
    suggestedTitle: string;
    suggestedCategory: string;
    quotaExceeded?: boolean;
    offerPremium?: boolean;
  }> {
    // 1. Verifica cota de uso do Notebook
    const quotaCheck = await GeminiQuotaService.consumeQuota('notebook', params.user);
    if (!quotaCheck.allowed) {
      return {
        wikitext: '',
        summary:
          'Você atingiu o limite de execuções gratuitas do Gemini Notebook. Como assistente oficial do Google AI Studio na WikiZero, estou autorizado a lhe oferecer o Plano Gemini Premium!',
        suggestedTitle: params.targetArticleTitle || 'Artigo do Notebook',
        suggestedCategory: 'Geral',
        quotaExceeded: true,
        offerPremium: true,
      };
    }

    const payload = {
      sources: params.sources.map((s) => ({
        title: s.title,
        type: s.type,
        content: s.content.slice(0, 8000), // Protege contra payloads excessivos
        imageUrl: s.imageUrl,
      })),
      action: params.action,
      customPrompt: params.customPrompt || '',
      targetArticleTitle: params.targetArticleTitle || '',
      userId: params.user?.uid || null,
      userEmail: params.user?.email || null,
      userDisplayName: params.user?.displayName || params.user?.username || null,
      isGuest: !params.user || params.user.isGuest,
      isPremium: !!(params.user?.isGeminiPremium || params.user?.geminiPlan === 'premium'),
    };

    const res = await fetch('/api/gemini/notebook-synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 429 || err.quotaExceeded) {
        return {
          wikitext: '',
          summary: err.error || 'Limite de uso atingido.',
          suggestedTitle: params.targetArticleTitle || 'Artigo',
          suggestedCategory: 'Geral',
          quotaExceeded: true,
          offerPremium: true,
        };
      }
      throw new Error(err.error || 'Erro ao sintetizar conteúdo com o Gemini Notebook.');
    }

    return await res.json();
  }
}
