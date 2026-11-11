import { UserProfile, GeminiQuotaInfo, UserGeminiUsage } from '../types';
import { StorageService } from './storageService';
import { getDbSafe } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const GEMINI_LIMITS = {
  GUEST: {
    CHATS: 5,
    IMAGES: 1,
    NOTEBOOK: 1,
  },
  FREE_USER: {
    CHATS: 20,
    IMAGES: 3,
    NOTEBOOK: 5,
  },
};

const getTodayKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export class GeminiQuotaService {
  /**
   * Retorna a chave de armazenamento local de uso do usuário ou convidado
   */
  private static getStorageKey(userId?: string): string {
    const today = getTodayKey();
    const id = userId || 'guest';
    return `wikizero_gemini_usage_${id}_${today}`;
  }

  /**
   * Obtém os contadores de uso do dia
   */
  static getUsage(user: UserProfile | null): UserGeminiUsage {
    const today = getTodayKey();
    const key = this.getStorageKey(user?.uid);
    const raw = localStorage.getItem(key);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.dateKey === today) {
          return parsed;
        }
      } catch {
        // ignore
      }
    }

    // Se o usuário tiver dados em seu perfil
    if (user?.geminiUsage && user.geminiUsage.dateKey === today) {
      return user.geminiUsage;
    }

    const defaultUsage: UserGeminiUsage = {
      chatsUsed: 0,
      imageUploadsUsed: 0,
      notebookRunsUsed: 0,
      dateKey: today,
    };
    localStorage.setItem(key, JSON.stringify(defaultUsage));
    return defaultUsage;
  }

  /**
   * Salva os contadores de uso
   */
  static async saveUsage(usage: UserGeminiUsage, user: UserProfile | null): Promise<void> {
    const key = this.getStorageKey(user?.uid);
    localStorage.setItem(key, JSON.stringify(usage));

    // Se usuário estiver logado, sincroniza no perfil do usuário
    if (user && !user.isGuest) {
      const updatedUser: UserProfile = {
        ...user,
        geminiUsage: usage,
      };
      StorageService.saveUser(updatedUser);

      // Sincroniza no Firestore de forma não bloqueante
      try {
        const db = getDbSafe();
        if (db && user.uid) {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { geminiUsage: usage }, { merge: true });
        }
      } catch (err) {
        console.warn('[GeminiQuotaService] Erro ao sincronizar uso no Firestore:', err);
      }
    }
  }

  /**
   * Retorna as informações completas de cotas e limites disponíveis
   */
  static getQuotaInfo(user: UserProfile | null): GeminiQuotaInfo {
    const isPremium = !!(user?.isGeminiPremium || user?.geminiPlan === 'premium');
    const usage = this.getUsage(user);

    if (isPremium) {
      return {
        isPremium: true,
        chatsLimit: Infinity,
        chatsUsed: usage.chatsUsed,
        chatsRemaining: Infinity,
        imagesLimit: Infinity,
        imagesUsed: usage.imageUploadsUsed,
        imagesRemaining: Infinity,
        notebookLimit: Infinity,
        notebookUsed: usage.notebookRunsUsed,
        notebookRemaining: Infinity,
        canChat: true,
        canUploadImage: true,
        canUseNotebook: true,
      };
    }

    const isGuest = !user || user.isGuest;
    const chatsLimit = isGuest ? GEMINI_LIMITS.GUEST.CHATS : GEMINI_LIMITS.FREE_USER.CHATS;
    const imagesLimit = isGuest ? GEMINI_LIMITS.GUEST.IMAGES : GEMINI_LIMITS.FREE_USER.IMAGES;
    const notebookLimit = isGuest ? GEMINI_LIMITS.GUEST.NOTEBOOK : GEMINI_LIMITS.FREE_USER.NOTEBOOK;

    const chatsRemaining = Math.max(0, chatsLimit - usage.chatsUsed);
    const imagesRemaining = Math.max(0, imagesLimit - usage.imageUploadsUsed);
    const notebookRemaining = Math.max(0, notebookLimit - usage.notebookRunsUsed);

    return {
      isPremium: false,
      chatsLimit,
      chatsUsed: usage.chatsUsed,
      chatsRemaining,
      imagesLimit,
      imagesUsed: usage.imageUploadsUsed,
      imagesRemaining,
      notebookLimit,
      notebookUsed: usage.notebookRunsUsed,
      notebookRemaining,
      canChat: chatsRemaining > 0,
      canUploadImage: imagesRemaining > 0,
      canUseNotebook: notebookRemaining > 0,
    };
  }

  /**
   * Consome uma cota e verifica se o usuário pode prosseguir.
   */
  static async consumeQuota(
    type: 'chats' | 'images' | 'notebook',
    user: UserProfile | null
  ): Promise<{ allowed: boolean; quotaInfo: GeminiQuotaInfo; quotaExceeded: boolean }> {
    const info = this.getQuotaInfo(user);

    if (info.isPremium) {
      // Usuário Premium: incrementa métrica de uso sem restrição
      const usage = this.getUsage(user);
      if (type === 'chats') usage.chatsUsed += 1;
      else if (type === 'images') usage.imageUploadsUsed += 1;
      else if (type === 'notebook') usage.notebookRunsUsed += 1;
      await this.saveUsage(usage, user);
      return { allowed: true, quotaInfo: this.getQuotaInfo(user), quotaExceeded: false };
    }

    // Verifica disponibilidade
    let allowed = false;
    if (type === 'chats') allowed = info.canChat;
    else if (type === 'images') allowed = info.canUploadImage;
    else if (type === 'notebook') allowed = info.canUseNotebook;

    if (!allowed) {
      return { allowed: false, quotaInfo: info, quotaExceeded: true };
    }

    // Incrementa o uso
    const usage = this.getUsage(user);
    if (type === 'chats') usage.chatsUsed += 1;
    else if (type === 'images') usage.imageUploadsUsed += 1;
    else if (type === 'notebook') usage.notebookRunsUsed += 1;

    await this.saveUsage(usage, user);
    return { allowed: true, quotaInfo: this.getQuotaInfo(user), quotaExceeded: false };
  }

  /**
   * Ativa o Plano Gemini Premium para o usuário
   */
  static async activatePremium(user: UserProfile | null): Promise<UserProfile> {
    const targetUser: UserProfile = user || {
      uid: 'user_' + Math.random().toString(36).substring(2, 9),
      email: 'usuario@wikizero.com',
      displayName: 'Assinante Gemini Premium',
      isGuest: false,
      isBanned: false,
      role: 'editor',
      createdAt: new Date().toISOString(),
    };

    const updatedUser: UserProfile = {
      ...targetUser,
      isGeminiPremium: true,
      geminiPlan: 'premium',
    };

    StorageService.saveUser(updatedUser);

    // Persiste no Firestore
    try {
      const db = getDbSafe();
      if (db && updatedUser.uid) {
        await setDoc(
          doc(db, 'users', updatedUser.uid),
          {
            isGeminiPremium: true,
            geminiPlan: 'premium',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('[GeminiQuotaService] Erro ao sincronizar status Premium no Firestore:', err);
    }

    return updatedUser;
  }

  /**
   * Cancela o Plano Gemini Premium
   */
  static async cancelPremium(user: UserProfile | null): Promise<UserProfile | null> {
    if (!user) return null;
    const updatedUser: UserProfile = {
      ...user,
      isGeminiPremium: false,
      geminiPlan: 'free',
    };

    StorageService.saveUser(updatedUser);

    try {
      const db = getDbSafe();
      if (db && user.uid) {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            isGeminiPremium: false,
            geminiPlan: 'free',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('[GeminiQuotaService] Erro ao desativar Premium no Firestore:', err);
    }

    return updatedUser;
  }
}
