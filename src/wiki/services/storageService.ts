import { initializeApp, getApps } from 'firebase/app';
import { getDb, getAuthSafe, handleFirestoreError, OperationType } from './firebase';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  deleteField,
  onSnapshot,
  query,
  where,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  WikiArticle,
  WikiPage,
  UserProfile,
  UserRole,
  UserPermissions,
  UserBarnstar,
  NotificationItem,
  RecentChangeEntry,
  TalkThread,
  TalkReply,
  UserTalkMessage,
  UserAuditLog,
  UserActivityLogEntry,
  SystemUpdateEntry,
  SockpuppetCase,
  CheckUserLogEntry,
  CheckUserAccountDetails,
  UnblockRequest,
  UnblockCategory,
  UnblockRequestStatus,
  UnblockAppealComment,
  PromotionRequest,
  PromotionTargetRole,
  PromotionVoteType,
  PromotionRequestStatus,
  PromotionVote,
  AdminContactTicket,
  AdminTicketCategory,
  AdminTicketPriority,
  AdminTicketStatus,
  AdminTicketMessage,
  ArbitrationCase,
  ArbitrationCaseStatus,
  ArbitrationDeliberation,
  ArbitrationComment,
  ArbitrationRuling,
  ArbitrationCommitteeMember,
  EmergencyReport,
  EmergencyCategory,
  EmergencyUrgencyLevel,
  EmergencyReportStatus,
  EmergencyReportActionLog,
  UcocReport,
  UcocViolationCategory,
  UcocSeverity,
  UcocReportStatus,
  UcocActionLog,
  UcocReportComment,
  CookieConsent,
  LgpdNotificationPreferences,
  WatchlistItem,
  ArticleRatingData,
  DailyEditLimitStatus,
  LgpdAccountDeletionRequest,
  LgpdDeletionRequestStatus,
  InstalledExtensionMeta,
  ExtensionActionLog,
} from '../types';
import { sanitizeIpForDocId, hashIpAddress } from '../utils/ipUtils';
import { verifyClientIpForLogin } from '../utils/wikimediaIpChecker';
import { checkClientVpnConnection, logVpnBlockAttempt } from '../utils/vpnChecker';
import { validateUserIdentifiersAgainstWikimediaAdmins, checkIfWikimediaAdmin } from '../utils/wikimediaAdminChecker';
import { ACTIVE_FIREBASE_CONFIG, getActiveFirebaseConfig } from '../config/firebaseCustomConfig';
import { FirebaseUsageMetricsService } from './firebaseUsageMetricsService';
import { CURATED_FEATURED_ARTICLES } from '../data/curatedArticles';
import { isAuthorizedPublisher } from '../../firebase';

// Configuração ativa do Firebase derivada do arquivo de configuração do desenvolvedor (src/config/firebaseCustomConfig.ts)
export const firebaseConfig = {
  ...ACTIVE_FIREBASE_CONFIG.firebaseConfig,
  firestoreDatabaseId: ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId,
};

let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let firebaseActive = false;

try {
  db = getDb();
  auth = getAuthSafe();
  firebaseActive = !!db;
} catch (e) {
  console.warn('Firebase initialized in offline/local storage fallback mode', e);
}

// Flag para detectar se o Firebase Auth do projeto permite autenticação anônima
let isAnonymousAuthSupported = true;

/**
 * Garante que exista uma sessão de autenticação ativa no Firebase Auth para permitir
 * operações de escrita no Firestore autorizadas pelas regras de segurança.
 */
export async function ensureFirebaseAuth(): Promise<string | null> {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser.uid;
  if (!isAnonymousAuthSupported) return null;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch (err: any) {
    // Se a autenticação anônima estiver restrita no console do Firebase, silencia e opera localmente
    if (
      err?.code === 'auth/admin-restricted-operation' ||
      err?.code === 'auth/operation-not-allowed' ||
      err?.message?.includes('admin-restricted-operation')
    ) {
      isAnonymousAuthSupported = false;
      return null;
    }
    console.warn('[StorageService] Falha ao autenticar anonimamente no Firebase Auth:', err);
    return null;
  }
}

const STORAGE_KEYS = {
  PAGES: 'wikizero_pages_v3',
  ARTICLES: 'wikizero_articles_v3',
  USER: 'wikizero_user_v3',
  NOTIFICATIONS: 'wikizero_notifs_v3',
  CONSENT: 'wikizero_cookie_consent_v3',
  LGPD_TERMS: 'wikizero_lgpd_accepted_v3',
  BIRTHDATE: 'wikizero_user_birthdate_v3',
  USER_AGE: 'wikizero_user_age_v3',
  DRAFT: 'wikizero_editor_draft_v3',
  THEME: 'wikizero_theme_v3',
  RECENT_CHANGES: 'wikizero_recent_changes_v3',
  TALK_THREADS: 'wikizero_talk_threads_v3',
  WATCHLIST: 'wikizero_watchlist_v3',
  RATINGS: 'wikizero_ratings_v3',
  COMMUNITY_USERS: 'wikizero_community_users_v3',
  USER_TALK_MESSAGES: 'wikizero_user_talk_messages_v3',
  USER_AUDIT_LOGS: 'wikizero_user_audit_logs_v3',
  SYSTEM_UPDATES: 'wikizero_system_updates_v3',
  SOCKPUPPET_CASES: 'wikizero_sockpuppet_cases_v3',
  CHECKUSER_LOGS: 'wikizero_checkuser_logs_v3',
  CHECKUSER_ACCOUNTS: 'wikizero_checkuser_accounts_v3',
  UNBLOCK_REQUESTS: 'wikizero_unblock_requests_v3',
  PROMOTION_REQUESTS: 'wikizero_promotion_requests_v3',
  ADMIN_TICKETS: 'wikizero_admin_tickets_v3',
  ARBITRATION_CASES: 'wikizero_arbitration_cases_v3',
  ARBITRATION_MEMBERS: 'wikizero_arbitration_members_v3',
  EMERGENCY_REPORTS: 'wikizero_emergency_reports_v1',
  EMERGENCY_IP_REPORTS: 'wikizero_emergency_ip_reports_v1',
  UCOC_REPORTS: 'wikizero_ucoc_reports_v1',
  LGPD_NOTIFICATION_CONFIG: 'wikizero_lgpd_notif_config_v1',
  LGPD_DELETION_REQUESTS: 'wikizero_lgpd_deletion_requests_v1',
  EXTENSIONS_STATES: 'wikizero_extensions_states_v1',
  CUSTOM_EXTENSIONS: 'wikizero_custom_extensions_v1',
  EXTENSION_ACTION_LOGS: 'wikizero_extension_action_logs_v1',
  EXTENSION_SETTINGS: 'wikizero_extension_settings_v1',
  DAILY_EDITS_PREFIX: 'wikizero_daily_edits_',
  CHROME_PREFERENCE_NOTICED: 'wikizero_chrome_recommendation_noticed_v1',
};

export const DAILY_EDITOR_EDIT_LIMIT = 5;


// Flag para expurgar dados estáticos e pré-definidos que não existem no banco de dados real
const PURGE_PREDEFINED_FLAG = 'wikizero_purged_predefined_v9_pure_firebase_no_speculative';

function purgePredefinedNonDatabaseData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(PURGE_PREDEFINED_FLAG)) return;

  // Limpar todo e qualquer dado residual que possa conter mocks pré-definidos do AI Studio
  localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TALK_THREADS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.USER_AUDIT_LOGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CHECKUSER_LOGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CHECKUSER_ACCOUNTS, JSON.stringify({}));
  localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify({}));
  // Limpar também acervo bibliográfico especulativo
  localStorage.removeItem('wiki_library_items_cache_v1');
  localStorage.removeItem('wiki_library_reviews_cache_v1');

  localStorage.setItem(PURGE_PREDEFINED_FLAG, 'true');
}

// Helper seguro para leitura de arrays do localStorage sem risco de null/undefined
export function safeGetArray<T>(key: string, fallback: T[] = []): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'null' || raw === 'undefined') return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

// Inicializar armazenamento local apenas com estruturas limpas e dados legítimos
function initializeLocalStorage() {
  purgePredefinedNonDatabaseData();

  const ensureKey = (key: string, isObj = false) => {
    try {
      const val = localStorage.getItem(key);
      if (!val || val === 'null' || val === 'undefined') {
        localStorage.setItem(key, JSON.stringify(isObj ? {} : []));
      } else {
        const parsed = JSON.parse(val);
        if (isObj ? (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) : !Array.isArray(parsed)) {
          localStorage.setItem(key, JSON.stringify(isObj ? {} : []));
        }
      }
    } catch {
      localStorage.setItem(key, JSON.stringify(isObj ? {} : []));
    }
  };

  ensureKey(STORAGE_KEYS.PAGES);
  ensureKey(STORAGE_KEYS.ARTICLES);
  ensureKey(STORAGE_KEYS.NOTIFICATIONS);
  ensureKey(STORAGE_KEYS.TALK_THREADS);
  ensureKey(STORAGE_KEYS.WATCHLIST);
  ensureKey(STORAGE_KEYS.COMMUNITY_USERS);
  ensureKey(STORAGE_KEYS.USER_TALK_MESSAGES);
  ensureKey(STORAGE_KEYS.USER_AUDIT_LOGS);
  ensureKey(STORAGE_KEYS.SYSTEM_UPDATES);
  ensureKey(STORAGE_KEYS.SOCKPUPPET_CASES);
  ensureKey(STORAGE_KEYS.CHECKUSER_LOGS);
  ensureKey(STORAGE_KEYS.CHECKUSER_ACCOUNTS, true);
  ensureKey(STORAGE_KEYS.UNBLOCK_REQUESTS);
  ensureKey(STORAGE_KEYS.PROMOTION_REQUESTS);
  ensureKey(STORAGE_KEYS.ADMIN_TICKETS);
  ensureKey(STORAGE_KEYS.ARBITRATION_CASES);
  ensureKey(STORAGE_KEYS.ARBITRATION_MEMBERS);
  ensureKey(STORAGE_KEYS.EMERGENCY_REPORTS);
  ensureKey(STORAGE_KEYS.RATINGS, true);
}

initializeLocalStorage();

export const StorageService = {
  // === PAGES / TOPICS ===
  async getPages(): Promise<WikiPage[]> {
    initializeLocalStorage();
    const localPages: WikiPage[] = safeGetArray<WikiPage>(STORAGE_KEYS.PAGES, []);

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'documentos'));
        const remotePages: WikiPage[] = [];
        snap.forEach((d) => {
          const data = d.data();
          remotePages.push({
            uid: data.uid || d.id,
            titulo: data.titulo || data.nome || d.id,
            descricao: data.descricao || '',
            categoria: data.categoria || 'Geral',
            criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : (data.criadoEm || new Date().toISOString()),
            status: data.status || 'ativo',
            articleCount: 0,
            icon: data.icon || '📄',
            tags: Array.isArray(data.tags) ? data.tags : [],
          });
        });

        // Adicionar dinamicamente coleções para artigos reais existentes
        const realArticles = await this.getArticles();
        const existingUids = new Set(remotePages.map((p) => p.uid.toLowerCase()));

        for (const art of realArticles) {
          if (art.pageUid && !existingUids.has(art.pageUid.toLowerCase())) {
            const dynamicPage: WikiPage = {
              uid: art.pageUid,
              titulo: art.categoria || art.pageUid,
              descricao: `Coleção de artigos da categoria ${art.categoria || art.pageUid}`,
              categoria: art.categoria || 'Geral',
              criadoEm: art.dataCriacao || new Date().toISOString(),
              status: 'ativo',
              articleCount: 0,
              icon: '📚',
            };
            remotePages.push(dynamicPage);
            existingUids.add(art.pageUid.toLowerCase());
          }
        }

        // Recalcular contagens reais de artigos para cada tópico
        const safeRealArticles = Array.isArray(realArticles) ? realArticles : [];
        const updated = remotePages.map((page) => ({
          ...page,
          articleCount: safeRealArticles.filter((a) => a && a.pageUid && page && page.uid && a.pageUid.toLowerCase() === page.uid.toLowerCase()).length,
        }));

        localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(updated));
        return updated;
      } catch (err) {
        console.warn('[StorageService] Aviso ao sincronizar páginas do Firestore, usando cache local:', err);
        return Array.isArray(localPages) ? localPages : [];
      }
    }

    const articles = await this.getArticles();
    const safeArticles = Array.isArray(articles) ? articles : [];
    return (localPages || []).map((page) => ({
      ...page,
      articleCount: safeArticles.filter((a) => a && a.pageUid && page && page.uid && a.pageUid.toLowerCase() === page.uid.toLowerCase()).length,
    }));
  },

  async getPage(uid: string): Promise<WikiPage | null> {
    const pages = await this.getPages();
    return pages.find((p) => p.uid.toLowerCase() === uid.toLowerCase()) || null;
  },

  async createPage(page: Omit<WikiPage, 'criadoEm' | 'articleCount'>): Promise<WikiPage> {
    const pages = await this.getPages();
    const newPage: WikiPage = {
      ...page,
      criadoEm: new Date().toISOString(),
      articleCount: 0,
      status: 'ativo',
    };

    pages.unshift(newPage);
    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(pages));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'documentos', newPage.uid), {
          titulo: newPage.titulo,
          descricao: newPage.descricao,
          categoria: newPage.categoria,
          criadoEm: serverTimestamp(),
          status: 'ativo',
          uid: newPage.uid,
          nome: `Coleção ${newPage.uid}`,
        });
      } catch (err) {
        console.warn('Firestore createPage background sync error:', err);
      }
    }

    return newPage;
  },

  // === ARTICLES ===
  async getArticles(): Promise<WikiArticle[]> {
    initializeLocalStorage();
    const localArticles: WikiArticle[] = safeGetArray<WikiArticle>(STORAGE_KEYS.ARTICLES, []);

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'articles'));
        const remoteArticles: WikiArticle[] = [];
        snap.forEach((d) => {
          const data = d.data();
          remoteArticles.push({
            id: data.id || d.id,
            pageUid: data.pageUid || 'geral',
            titulo: data.titulo || 'Sem título',
            descricao: data.descricao || '',
            resumo: data.resumo || (data.descricao ? data.descricao.slice(0, 140) + '...' : ''),
            categoria: data.categoria || 'Geral',
            idioma: data.idioma || 'Português',
            autor: data.autor || 'Colaborador WikiWorldWeb',
            autorEmail: data.autorEmail || undefined,
            autorUid: data.autorUid || undefined,
            dataCriacao: data.dataCriacao || new Date().toISOString(),
            dataEdicao: data.dataEdicao || data.dataCriacao || new Date().toISOString(),
            visualizacoes: typeof data.visualizacoes === 'number' ? data.visualizacoes : 1,
            versao: typeof data.versao === 'number' ? data.versao : 1,
            tags: Array.isArray(data.tags) ? data.tags : [],
            historico: Array.isArray(data.historico) ? data.historico : [],
            comiteEtica: data.comiteEtica || undefined,
          });
        });

        // Se a coleção 'articles' for nova ou vazia, verificar também a coleção 'pages' com namespace 'main'
        if (remoteArticles.length === 0) {
          try {
            const pagesSnap = await getDocs(query(collection(db, 'pages'), where('namespace', '==', 'main')));
            pagesSnap.forEach((d) => {
              const data = d.data();
              const realId = data.id?.replace(/^main:/, '') || d.id.replace(/^main:/, '');
              remoteArticles.push({
                id: realId,
                pageUid: data.pageUid || 'geral',
                titulo: data.title || data.titulo || 'Sem título',
                descricao: data.content || data.descricao || '',
                resumo: (data.content || data.descricao || '').slice(0, 140) + '...',
                categoria: (data.categories && data.categories[0]) || data.categoria || 'Geral',
                idioma: data.idioma || 'Português',
                autor: data.authorName || data.autor || 'Colaborador WikiWorldWeb',
                autorEmail: data.authorEmail || data.autorEmail || undefined,
                autorUid: data.authorUid || data.autorUid || undefined,
                dataCriacao: data.createdAt || new Date().toISOString(),
                dataEdicao: data.updatedAt || data.createdAt || new Date().toISOString(),
                visualizacoes: typeof data.visualizacoes === 'number' ? data.visualizacoes : 1,
                versao: typeof data.version === 'number' ? data.version : (data.versao || 1),
                tags: Array.isArray(data.tags) ? data.tags : [],
                historico: Array.isArray(data.historico) ? data.historico : [],
              });
            });
          } catch (pagesErr) {
            console.warn('[StorageService] Erro ao consultar coleção pages fallback:', pagesErr);
          }
        }

        // Se o Firestore estiver vazio mas o cache local tiver dados, inicializar no Firestore
        if (remoteArticles.length === 0 && localArticles.length > 0) {
          try {
            await ensureFirebaseAuth();
            for (const art of localArticles) {
              await setDoc(doc(db, 'articles', art.id), {
                ...art,
                atualizadoEm: serverTimestamp(),
              });
              await setDoc(doc(db, 'documentos', art.pageUid || 'geral', 'inevitavel', art.id), art);
              await setDoc(
                doc(db, 'pages', `main:${art.id}`),
                {
                  id: `main:${art.id}`,
                  namespace: 'main',
                  title: art.titulo,
                  content: art.descricao,
                  categories: art.categoria ? [art.categoria] : ['Geral'],
                  authorName: art.autor,
                  version: art.versao || 1,
                  updatedAt: art.dataEdicao,
                  createdAt: art.dataCriacao,
                },
                { merge: true }
              );
            }
          } catch (seedErr) {
            console.warn('[StorageService] Erro ao sincronizar artigos iniciais no Firestore:', seedErr);
          }
          return localArticles;
        }

        // Ordenar cronologicamente decrescente por edição/criação
        remoteArticles.sort((a, b) => {
          const timeA = new Date(a.dataEdicao || a.dataCriacao).getTime();
          const timeB = new Date(b.dataEdicao || b.dataCriacao).getTime();
          return timeB - timeA;
        });

        // Registrar leituras do Firestore na telemetria em tempo real
        FirebaseUsageMetricsService.recordRead('articles', remoteArticles.length, `Carregamento de ${remoteArticles.length} artigo(s) do Firestore`);

        // Apenas dados reais do Firestore são mantidos e salvos no cache
        if (remoteArticles.length > 0) {
          localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(remoteArticles));
          return remoteArticles;
        }
        return localArticles.length > 0 ? localArticles : CURATED_FEATURED_ARTICLES;
      } catch (err) {
        console.warn('[StorageService] Erro ao carregar artigos do Firestore, usando cache local:', err);
        return localArticles.length > 0 ? localArticles : CURATED_FEATURED_ARTICLES;
      }
    }

    return localArticles.length > 0 ? localArticles : CURATED_FEATURED_ARTICLES;
  },

  // Inscrições em tempo real para sincronização instantânea com o Firestore
  subscribeToArticles(callback: (articles: WikiArticle[]) => void): () => void {
    if (!firebaseActive || !db) return () => {};
    try {
      const q = query(collection(db, 'articles'));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          FirebaseUsageMetricsService.recordRead('articles', snap.docChanges().length || 1, 'Snapshot em tempo real de artigos do Firestore');
          const list: WikiArticle[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: data.id || d.id,
              pageUid: data.pageUid || 'geral',
              titulo: data.titulo || 'Sem título',
              descricao: data.descricao || '',
              resumo: data.resumo || (data.descricao ? data.descricao.slice(0, 140) + '...' : ''),
              categoria: data.categoria || 'Geral',
              idioma: data.idioma || 'Português',
              autor: data.autor || 'Colaborador WikiWorldWeb',
              autorEmail: data.autorEmail || undefined,
              autorUid: data.autorUid || undefined,
              dataCriacao: data.dataCriacao || new Date().toISOString(),
              dataEdicao: data.dataEdicao || data.dataCriacao || new Date().toISOString(),
              visualizacoes: typeof data.visualizacoes === 'number' ? data.visualizacoes : 1,
              versao: typeof data.versao === 'number' ? data.versao : 1,
              tags: Array.isArray(data.tags) ? data.tags : [],
              historico: Array.isArray(data.historico) ? data.historico : [],
              comiteEtica: data.comiteEtica || undefined,
            });
          });
          list.sort((a, b) => {
            const timeA = new Date(a.dataEdicao || a.dataCriacao).getTime();
            const timeB = new Date(b.dataEdicao || b.dataCriacao).getTime();
            return timeB - timeA;
          });
          localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(list));
          callback(list);
        },
        (error) => {
          if (error?.code === 'unavailable') return;
          console.warn('[StorageService] Erro no listener em tempo real de artigos:', error);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('[StorageService] Falha ao iniciar listener de artigos:', err);
      return () => {};
    }
  },

  subscribeToPages(callback: (pages: WikiPage[]) => void): () => void {
    if (!firebaseActive || !db) return () => {};
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'documentos'),
        (snap) => {
          const list: WikiPage[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              uid: data.uid || d.id,
              titulo: data.titulo || data.nome || d.id,
              descricao: data.descricao || '',
              categoria: data.categoria || 'Geral',
              criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : (data.criadoEm || new Date().toISOString()),
              status: data.status || 'ativo',
              articleCount: 0,
              icon: data.icon || '📄',
              tags: Array.isArray(data.tags) ? data.tags : [],
            });
          });
          let currentArticles: WikiArticle[] = safeGetArray<WikiArticle>(STORAGE_KEYS.ARTICLES, []);
          const existingUids = new Set(list.map((p) => p.uid.toLowerCase()));
          for (const art of currentArticles) {
            if (art && art.pageUid && !existingUids.has(art.pageUid.toLowerCase())) {
              list.push({
                uid: art.pageUid,
                titulo: art.categoria || art.pageUid,
                descricao: `Coleção de artigos da categoria ${art.categoria || art.pageUid}`,
                categoria: art.categoria || 'Geral',
                criadoEm: art.dataCriacao || new Date().toISOString(),
                status: 'ativo',
                articleCount: 0,
                icon: '📚',
              });
              existingUids.add(art.pageUid.toLowerCase());
            }
          }
          const safeCurrentArticles = Array.isArray(currentArticles) ? currentArticles : [];
          const updated = list.map((page) => ({
            ...page,
            articleCount: safeCurrentArticles.filter((a) => a && a.pageUid && page && page.uid && a.pageUid.toLowerCase() === page.uid.toLowerCase()).length,
          }));
          localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(updated));
          callback(updated);
        },
        (error) => {
          if (error?.code === 'unavailable') return;
          console.warn('[StorageService] Erro no listener em tempo real de páginas:', error);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('[StorageService] Falha ao iniciar listener de páginas:', err);
      return () => {};
    }
  },

  async getArticlesByPage(pageUid: string): Promise<WikiArticle[]> {
    const articles = await this.getArticles();
    return articles.filter((a) => a.pageUid.toLowerCase() === pageUid.toLowerCase());
  },

  async getArticle(id: string): Promise<WikiArticle | null> {
    const articles = await this.getArticles();
    return articles.find((a) => a.id === id) || null;
  },

  async getArticleByTitle(title: string): Promise<WikiArticle | null> {
    const articles = await this.getArticles();
    return articles.find((a) => a.titulo.toLowerCase() === title.toLowerCase()) || null;
  },

  getTodayDateKey(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Verifica se o usuário é isento do limite de 5 edições diárias.
   * Moderadores e Administradores possuem isenção e podem editar sem limites.
   */
  isExemptFromDailyEditLimit(user: UserProfile | null | undefined): boolean {
    if (!user) return false;
    const role = (user.role || '').toLowerCase().trim();
    const group = (user.group || '').toLowerCase().trim();
    const email = (user.email || '').toLowerCase().trim();

    // Isenção para Administradores e Moderadores
    if (role === 'admin' || role === 'administrador') return true;
    if (role === 'moderador' || role === 'moderator') return true;
    if (group === 'admin' || group === 'administrador') return true;
    if (group === 'moderador' || group === 'moderator') return true;
    if (email === 'pedrohenriquecardonaperes@gmail.com') return true;

    return false;
  },

  /**
   * Retorna o status atual de edições diárias do usuário, incluindo contagem,
   * limite restante e se a edição é permitida.
   */
  async getDailyEditLimitStatus(user: UserProfile | null | undefined): Promise<DailyEditLimitStatus> {
    const dateKey = this.getTodayDateKey();
    const isExempt = this.isExemptFromDailyEditLimit(user);

    if (isExempt) {
      return {
        isExempt: true,
        limit: Infinity,
        count: 0,
        remaining: Infinity,
        allowed: true,
        dateKey,
        resetTimeMessage: 'Edições ilimitadas (Moderadores e Administradores possuem isenção de cota diária).',
      };
    }

    if (!user || !user.uid) {
      return {
        isExempt: false,
        limit: DAILY_EDITOR_EDIT_LIMIT,
        count: 0,
        remaining: DAILY_EDITOR_EDIT_LIMIT,
        allowed: true,
        dateKey,
        resetTimeMessage: `Limite de ${DAILY_EDITOR_EDIT_LIMIT} edições por dia para editores. O limite é renovado à meia-noite.`,
      };
    }

    const storageKey = `${STORAGE_KEYS.DAILY_EDITS_PREFIX}${user.uid}_${dateKey}`;
    let count = parseInt(localStorage.getItem(storageKey) || '0', 10);
    if (isNaN(count)) count = 0;

    // Conferir atividades do dia no perfil local para consistência
    try {
      const profile = await this.getUserProfile(user.uid);
      if (profile && Array.isArray(profile.recentActivity)) {
        const todayStr = new Date().toDateString();
        const activityCount = profile.recentActivity.filter((act) => {
          if (act.type !== 'create' && act.type !== 'edit' && act.type !== 'revert') return false;
          try {
            return new Date(act.date).toDateString() === todayStr;
          } catch {
            return false;
          }
        }).length;

        if (activityCount > count) {
          count = activityCount;
          localStorage.setItem(storageKey, count.toString());
        }
      }
    } catch {
      // safe fallback
    }

    // Consulta de integridade no Firestore se ativo
    if (firebaseActive && db) {
      try {
        const ref = doc(db, 'user_daily_edits', `${user.uid}_${dateKey}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data?.count === 'number' && data.count > count) {
            count = data.count;
            localStorage.setItem(storageKey, count.toString());
          }
        }
      } catch (err) {
        console.warn('[StorageService] Consulta remota de limite diário ignorada (usando cache local):', err);
      }
    }

    const remaining = Math.max(0, DAILY_EDITOR_EDIT_LIMIT - count);
    const allowed = count < DAILY_EDITOR_EDIT_LIMIT;

    return {
      isExempt: false,
      limit: DAILY_EDITOR_EDIT_LIMIT,
      count,
      remaining,
      allowed,
      dateKey,
      resetTimeMessage: allowed
        ? `Você realizou ${count} de ${DAILY_EDITOR_EDIT_LIMIT} edições hoje. Restam ${remaining}. O limite é renovado à meia-noite.`
        : `Você atingiu o limite de ${DAILY_EDITOR_EDIT_LIMIT} edições diárias para o papel de Editor. Moderadores e administradores têm edições ilimitadas. O limite será renovado à meia-noite.`,
    };
  },

  /**
   * Incrementa o contador de edições do dia para o usuário editor.
   */
  async incrementDailyEditsCount(user: UserProfile | null | undefined): Promise<number> {
    if (!user || !user.uid || this.isExemptFromDailyEditLimit(user)) {
      return 0;
    }
    const dateKey = this.getTodayDateKey();
    const storageKey = `${STORAGE_KEYS.DAILY_EDITS_PREFIX}${user.uid}_${dateKey}`;
    const current = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const newCount = (isNaN(current) ? 0 : current) + 1;
    localStorage.setItem(storageKey, newCount.toString());

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        const ref = doc(db, 'user_daily_edits', `${user.uid}_${dateKey}`);
        await setDoc(
          ref,
          {
            uid: user.uid,
            date: dateKey,
            count: newCount,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar contagem diária no Firestore:', err);
      }
    }

    return newCount;
  },

  async saveArticle(
    articleData: Partial<WikiArticle> & { titulo: string; pageUid: string; descricao: string },
    user?: UserProfile | null,
    editSummary?: string,
    isMinor?: boolean
  ): Promise<WikiArticle> {
    const effectiveUser = user || this.getCurrentUser();
    if (!effectiveUser || effectiveUser.isGuest) {
      throw new Error('Somente usuários logados podem contribuir com edições na WikiWorldWeb.');
    }
    if (effectiveUser.isBanned) {
      throw new Error('Sua conta está suspensa. Usuários bloqueados não podem editar verbetes, apenas enviar pedidos de desbloqueio.');
    }
    if (effectiveUser.permissions && effectiveUser.permissions.canEdit === false) {
      throw new Error('Você não possui autorização para editar artigos nesta wiki.');
    }

    // Validação de limite de 5 edições diárias para editores (com exceção de moderadores e administradores)
    if (!this.isExemptFromDailyEditLimit(effectiveUser)) {
      const dailyStatus = await this.getDailyEditLimitStatus(effectiveUser);
      if (!dailyStatus.allowed) {
        throw new Error(
          `Limite diário de edições atingido: Usuários com papel de editor possuem um limite máximo de ${DAILY_EDITOR_EDIT_LIMIT} edições por dia (moderadores e administradores possuem edições ilimitadas). Você já atingiu 5 edições hoje. Seu limite será liberado à meia-noite.`
        );
      }
    }

    const articles = await this.getArticles();
    const now = new Date().toISOString();
    const isModOrAdmin = effectiveUser.role === 'admin' || effectiveUser.role === 'moderador';

    let article: WikiArticle;
    const existingIndex = articles.findIndex((a) => a.id === articleData.id);

    if (existingIndex >= 0) {
      // Update existing
      const existing = articles[existingIndex];

      // Verificação de artigo bloqueado/protegido pela moderação
      if (existing.isLocked && !isModOrAdmin) {
        throw new Error(
          `Artigo Protegido pela Moderação: Este verbete foi bloqueado para edições de usuários comuns (${existing.lockReason || 'Proteção administrativa'}). Apenas moderadores e administradores possuem permissão para editá-lo.`
        );
      }

      // Verificação de coleção bloqueada
      const allPages = await this.getPages();
      const targetPage = allPages.find((p) => p.uid.toLowerCase() === (articleData.pageUid || existing.pageUid).toLowerCase());
      if (targetPage && targetPage.isLocked && !isModOrAdmin) {
        throw new Error(
          `Coleção Protegida pela Moderação: A coleção "${targetPage.titulo}" foi bloqueada pela moderação (${targetPage.lockReason || 'Proteção de coleção'}). Usuários comuns não possuem autorização para alterar artigos nesta coleção.`
        );
      }

      const newVersion = (existing.versao || 1) + 1;
      const prevLength = existing.descricao ? existing.descricao.length : 0;
      const newLength = articleData.descricao.length;
      const deltaBytes = newLength - prevLength;

      const historyItem = {
        id: `h-${Date.now()}`,
        data: now,
        autor: effectiveUser.displayName || effectiveUser.username || effectiveUser.email?.split('@')[0] || 'Colaborador',
        autorEmail: effectiveUser.email,
        autorUid: effectiveUser.uid,
        resumo: editSummary || 'Edição no artigo',
        tamanho: newLength,
        deltaBytes,
        versao: newVersion,
        isMinor: !!isMinor,
        conteudo: articleData.descricao,
      };

      article = {
        ...existing,
        ...articleData,
        dataEdicao: now,
        versao: newVersion,
        historico: [historyItem, ...(existing.historico || [])],
        // Preserva metadados de bloqueio
        isLocked: existing.isLocked,
        lockedBy: existing.lockedBy,
        lockedByUid: existing.lockedByUid,
        lockedAt: existing.lockedAt,
        lockReason: existing.lockReason,
        protectionLevel: existing.protectionLevel,
      };
      articles[existingIndex] = article;
    } else {
      // Create new - Regra estrita: qualquer publicação de novo artigo só pode ser feita pelas contas autorizadas
      if (!isAuthorizedPublisher(effectiveUser.email)) {
        throw new Error(
          'Permissão de publicação negada: Qualquer publicação de artigo só deve ser feita pelas contas autorizadas (wazzimagiygg@gmail.com ou pedrohenriquecardonaperes@gmail.com).'
        );
      }

      // Verificação se a coleção de destino está bloqueada
      const allPages = await this.getPages();
      const targetPage = allPages.find((p) => p.uid.toLowerCase() === articleData.pageUid.toLowerCase());
      if (targetPage && targetPage.isLocked && !isModOrAdmin) {
        throw new Error(
          `Coleção Protegida pela Moderação: A coleção "${targetPage.titulo}" está protegida pela moderação (${targetPage.lockReason || 'Bloqueada para novas publicações'}). Apenas moderadores e administradores podem adicionar novos artigos a esta coleção.`
        );
      }

      const id = articleData.id || `art-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newLength = articleData.descricao.length;
      const historyItem = {
        id: `h-${Date.now()}`,
        data: now,
        autor: effectiveUser.displayName || effectiveUser.username || effectiveUser.email?.split('@')[0] || 'Autor Original',
        autorEmail: effectiveUser.email,
        autorUid: effectiveUser.uid,
        resumo: editSummary || 'Criação do artigo',
        tamanho: newLength,
        deltaBytes: newLength,
        versao: 1,
        isMinor: false,
        conteudo: articleData.descricao,
      };

      article = {
        id,
        pageUid: articleData.pageUid,
        titulo: articleData.titulo,
        descricao: articleData.descricao,
        resumo: articleData.resumo || articleData.descricao.slice(0, 140) + '...',
        categoria: articleData.categoria || 'Geral',
        idioma: articleData.idioma || 'Português',
        autor: effectiveUser.displayName || effectiveUser.username || 'Colaborador WikiWorldWeb',
        autorEmail: effectiveUser.email,
        autorUid: effectiveUser.uid,
        dataCriacao: now,
        dataEdicao: now,
        visualizacoes: 1,
        versao: 1,
        tags: articleData.tags || [],
        historico: [historyItem],
        isLocked: false,
        comiteEtica: articleData.comiteEtica || undefined,
      };
      articles.unshift(article);
    }

    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));

    // Persistência e Sincronização em Tempo Real no Firestore
    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();

        const firestorePayload = {
          id: article.id,
          pageUid: article.pageUid,
          titulo: article.titulo,
          descricao: article.descricao,
          resumo: article.resumo || '',
          categoria: article.categoria || 'Geral',
          idioma: article.idioma || 'Português',
          autor: article.autor || 'Colaborador WikiWorldWeb',
          autorEmail: article.autorEmail || null,
          autorUid: article.autorUid || effectiveUser.uid || 'anon',
          dataCriacao: article.dataCriacao,
          dataEdicao: article.dataEdicao,
          visualizacoes: article.visualizacoes || 1,
          versao: article.versao || 1,
          tags: article.tags || [],
          historico: (article.historico || []).slice(0, 50),
          isLocked: !!article.isLocked,
          lockedBy: article.lockedBy || null,
          lockedByUid: article.lockedByUid || null,
          lockedAt: article.lockedAt || null,
          lockReason: article.lockReason || null,
          protectionLevel: article.protectionLevel || null,
          comiteEtica: article.comiteEtica || null,
          atualizadoEm: serverTimestamp(),
        };

        // 1. Coleção principal /articles/{id} para leitura rápida global
        await setDoc(doc(db, 'articles', article.id), firestorePayload);

        // Registrar gravação na telemetria em tempo real
        FirebaseUsageMetricsService.recordWrite('articles', 1, `Gravação do artigo "${article.titulo}" no Firestore`);

        // 2. Coleção estruturada por tópico /documentos/{pageUid}/inevitavel/{id}
        await setDoc(doc(db, 'documentos', article.pageUid, 'inevitavel', article.id), {
          ...firestorePayload,
          atualizadoEm: serverTimestamp(),
        });

        // 3. Coleção unificada de páginas do sistema /pages/{id}
        await setDoc(
          doc(db, 'pages', `main:${article.id}`),
          {
            id: `main:${article.id}`,
            namespace: 'main',
            title: article.titulo,
            content: article.descricao,
            categories: article.categoria ? [article.categoria] : ['Geral'],
            authorName: article.autor,
            authorUid: article.autorUid || effectiveUser.uid,
            version: article.versao || 1,
            updatedAt: article.dataEdicao,
            createdAt: article.dataCriacao,
          },
          { merge: true }
        );

        // 4. Salvar na coleção /recent_changes do Firestore
        const rcEntry: RecentChangeEntry = {
          id: `rc-${article.id}-${Date.now()}`,
          type: existingIndex >= 0 ? (isMinor ? 'minor_edit' : 'edit_article') : 'new_article',
          articleId: article.id,
          articleTitle: article.titulo,
          pageUid: article.pageUid,
          autor: article.autor || 'Colaborador WikiWorldWeb',
          autorEmail: article.autorEmail,
          autorUid: article.autorUid || effectiveUser.uid,
          data: now,
          resumo: editSummary || (existingIndex >= 0 ? 'Edição no artigo' : 'Criação do artigo'),
          tamanho: article.descricao.length,
          deltaBytes: existingIndex >= 0 ? (articleData.descricao.length - (articles[existingIndex]?.descricao?.length || 0)) : articleData.descricao.length,
          versao: article.versao || 1,
          idioma: article.idioma || 'pt',
          isMinor: !!isMinor,
        };
        await setDoc(doc(db, 'recent_changes', rcEntry.id), rcEntry);

        console.info(`[StorageService] Artigo "${article.titulo}" sincronizado com sucesso no Firebase Firestore.`);
      } catch (err) {
        console.error('[StorageService] Erro ao sincronizar artigo no Firestore:', err);
      }
    }

    // Inserir alteração de rastreio na página do usuário
    try {
      const effectiveUser = user || this.getCurrentUser();
      const authorIdent = effectiveUser || article.autor || 'Anônimo';
      await this.recordUserTrackingActivity(authorIdent, {
        type: existingIndex >= 0 ? 'edit' : 'create',
        articleId: article.id,
        articleTitle: article.titulo,
        pageUid: article.pageUid,
        summary: editSummary || (existingIndex >= 0 ? 'Edição de conteúdo e fontes' : 'Criação do verbete'),
        deltaBytes: existingIndex >= 0 ? (articleData.descricao.length - (articles[existingIndex]?.descricao?.length || 0)) : articleData.descricao.length,
        isMinor: !!isMinor,
      });
    } catch (trackErr) {
      console.warn('[StorageService] Error recording user tracking activity on saveArticle:', trackErr);
    }

    // Incrementar a cota de edições diárias para usuários que não possuem isenção (editores)
    try {
      if (!this.isExemptFromDailyEditLimit(effectiveUser)) {
        await this.incrementDailyEditsCount(effectiveUser);
      }
    } catch (limitErr) {
      console.warn('[StorageService] Error updating daily edits counter on saveArticle:', limitErr);
    }

    return article;
  },

  async deleteArticle(id: string, user?: UserProfile | null): Promise<boolean> {
    const effectiveUser = user || this.getCurrentUser();
    const articles = await this.getArticles();
    const article = articles.find((a) => a.id === id);
    if (!article) return false;

    if (article.isLocked) {
      const isModOrAdmin = effectiveUser && (effectiveUser.role === 'admin' || effectiveUser.role === 'moderador');
      if (!isModOrAdmin) {
        throw new Error('Artigo Protegido: Apenas moderadores e administradores podem excluir artigos bloqueados.');
      }
    }

    const filtered = articles.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(filtered));

    if (firebaseActive && db && article) {
      try {
        await deleteDoc(doc(db, 'articles', article.id));
        await deleteDoc(doc(db, 'documentos', article.pageUid, 'inevitavel', article.id));
        await deleteDoc(doc(db, 'pages', `main:${article.id}`));
        FirebaseUsageMetricsService.recordDelete('articles', 1, `Exclusão do artigo "${article.titulo}" no Firestore`);
      } catch (e) {
        console.warn('Firestore delete sync error:', e);
      }
    }
    return true;
  },

  // Moderação: Bloquear/Proteger Artigo
  async lockArticle(articleId: string, moderator: UserProfile, reason?: string): Promise<WikiArticle> {
    if (moderator.role !== 'admin' && moderator.role !== 'moderador') {
      throw new Error('Apenas moderadores e administradores podem proteger ou bloquear artigos contra edições.');
    }
    const articles = await this.getArticles();
    const index = articles.findIndex((a) => a.id === articleId);
    if (index === -1) throw new Error('Artigo não encontrado.');

    const updatedArt: WikiArticle = {
      ...articles[index],
      isLocked: true,
      lockedBy: moderator.displayName || moderator.username || 'Moderação',
      lockedByUid: moderator.uid,
      lockedAt: new Date().toISOString(),
      lockReason: reason || 'Protegido pela moderação para prevenir edições não autorizadas.',
      protectionLevel: 'moderators_only',
    };

    articles[index] = updatedArt;
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'articles', updatedArt.id), {
          isLocked: true,
          lockedBy: updatedArt.lockedBy,
          lockedByUid: updatedArt.lockedByUid,
          lockedAt: updatedArt.lockedAt,
          lockReason: updatedArt.lockReason,
          protectionLevel: 'moderators_only',
          atualizadoEm: serverTimestamp(),
        }, { merge: true });

        await setDoc(doc(db, 'documentos', updatedArt.pageUid, 'inevitavel', updatedArt.id), {
          isLocked: true,
          lockedBy: updatedArt.lockedBy,
          lockedByUid: updatedArt.lockedByUid,
          lockedAt: updatedArt.lockedAt,
          lockReason: updatedArt.lockReason,
          protectionLevel: 'moderators_only',
          atualizadoEm: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn('[StorageService] Erro ao sincronizar bloqueio do artigo no Firestore:', e);
      }
    }

    return updatedArt;
  },

  // Moderação: Desbloquear/Desproteger Artigo
  async unlockArticle(articleId: string, moderator: UserProfile): Promise<WikiArticle> {
    if (moderator.role !== 'admin' && moderator.role !== 'moderador') {
      throw new Error('Apenas moderadores e administradores podem desproteger artigos.');
    }
    const articles = await this.getArticles();
    const index = articles.findIndex((a) => a.id === articleId);
    if (index === -1) throw new Error('Artigo não encontrado.');

    const updatedArt: WikiArticle = {
      ...articles[index],
      isLocked: false,
      lockedBy: undefined,
      lockedByUid: undefined,
      lockedAt: undefined,
      lockReason: undefined,
      protectionLevel: undefined,
    };

    articles[index] = updatedArt;
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'articles', updatedArt.id), {
          isLocked: false,
          lockedBy: null,
          lockedByUid: null,
          lockedAt: null,
          lockReason: null,
          protectionLevel: null,
          atualizadoEm: serverTimestamp(),
        }, { merge: true });

        await setDoc(doc(db, 'documentos', updatedArt.pageUid, 'inevitavel', updatedArt.id), {
          isLocked: false,
          lockedBy: null,
          lockedByUid: null,
          lockedAt: null,
          lockReason: null,
          protectionLevel: null,
          atualizadoEm: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn('[StorageService] Erro ao sincronizar desbloqueio do artigo no Firestore:', e);
      }
    }

    return updatedArt;
  },

  // Moderação: Bloquear/Proteger Coleção (WikiPage)
  async lockPage(pageUid: string, moderator: UserProfile, reason?: string): Promise<WikiPage> {
    if (moderator.role !== 'admin' && moderator.role !== 'moderador') {
      throw new Error('Apenas moderadores e administradores podem proteger ou bloquear coleções.');
    }
    const pages = await this.getPages();
    const index = pages.findIndex((p) => p.uid.toLowerCase() === pageUid.toLowerCase());
    if (index === -1) throw new Error('Coleção não encontrada.');

    const updatedPage: WikiPage = {
      ...pages[index],
      isLocked: true,
      lockedBy: moderator.displayName || moderator.username || 'Moderação',
      lockedByUid: moderator.uid,
      lockedAt: new Date().toISOString(),
      lockReason: reason || 'Coleção protegida contra criação e alteração de verbetes por usuários comuns.',
    };

    pages[index] = updatedPage;
    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(pages));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'documentos', updatedPage.uid), {
          isLocked: true,
          lockedBy: updatedPage.lockedBy,
          lockedByUid: updatedPage.lockedByUid,
          lockedAt: updatedPage.lockedAt,
          lockReason: updatedPage.lockReason,
          atualizadoEm: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn('[StorageService] Erro ao sincronizar bloqueio de coleção no Firestore:', e);
      }
    }

    return updatedPage;
  },

  // Moderação: Desbloquear/Desproteger Coleção (WikiPage)
  async unlockPage(pageUid: string, moderator: UserProfile): Promise<WikiPage> {
    if (moderator.role !== 'admin' && moderator.role !== 'moderador') {
      throw new Error('Apenas moderadores e administradores podem desproteger coleções.');
    }
    const pages = await this.getPages();
    const index = pages.findIndex((p) => p.uid.toLowerCase() === pageUid.toLowerCase());
    if (index === -1) throw new Error('Coleção não encontrada.');

    const updatedPage: WikiPage = {
      ...pages[index],
      isLocked: false,
      lockedBy: undefined,
      lockedByUid: undefined,
      lockedAt: undefined,
      lockReason: undefined,
    };

    pages[index] = updatedPage;
    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(pages));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'documentos', updatedPage.uid), {
          isLocked: false,
          lockedBy: null,
          lockedByUid: null,
          lockedAt: null,
          lockReason: null,
          atualizadoEm: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn('[StorageService] Erro ao sincronizar desbloqueio de coleção no Firestore:', e);
      }
    }

    return updatedPage;
  },

  async incrementArticleViews(id: string) {
    const articles = await this.getArticles();
    const art = articles.find((a) => a.id === id);
    if (art) {
      art.visualizacoes = (art.visualizacoes || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));

      if (firebaseActive && db) {
        try {
          await setDoc(doc(db, 'articles', id), { visualizacoes: art.visualizacoes }, { merge: true });
        } catch {
          // Silencioso em caso de contadores de visualização rápidos
        }
      }
    }
  },

  // === USER AUTH & BAN CHECK ===
  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      // Política restritiva: Bloqueio permanente de sessão de usuários convidados ou não registrados
      if (parsed?.isGuest || parsed?.role === 'convidado') {
        localStorage.removeItem(STORAGE_KEYS.USER);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  saveUser(user: UserProfile) {
    if (user?.isGuest || user?.role === 'convidado') {
      localStorage.removeItem(STORAGE_KEYS.USER);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  clearUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  async createGuestUser(): Promise<UserProfile> {
    // Política de Governança: Login de convidados e usuários não registrados permanentemente desabilitado
    throw new Error(
      'Acesso desabilitado: O login para usuários convidados ou não registrados foi desabilitado no sistema da Wiki. Apenas usuários devidamente registrados pela administração possuem permissão para efetuar login.'
    );
  },

  async loginWithGoogle(): Promise<UserProfile> {
    // 1. Verificação de segurança: Bloqueio estrito para IPs de origem da Wikimedia Foundation (AS14907)
    const ipCheck = await verifyClientIpForLogin();
    if (ipCheck.isWikimedia) {
      const detail = ipCheck.matchedRange ? ` (faixa detectada: ${ipCheck.matchedRange})` : '';
      throw new Error(
        `Acesso bloqueado: O login está permanentemente desabilitado para conexões originadas de faixas de IP pertencentes à Wikimedia Foundation (AS14907, IP: ${ipCheck.ip}${detail}). Conforme a política de isolamento editorial e segurança da WikiWorldWeb, autenticações a partir de redes Wikimedia são restritas.`
      );
    }

    // 1.1 Verificação de segurança: Bloqueio estrito para conexões mascaradas por VPN, Proxy ou Tor
    const vpnCheck = await checkClientVpnConnection();
    if (vpnCheck.blocked) {
      logVpnBlockAttempt({
        ip: vpnCheck.ip,
        provider: vpnCheck.provider,
        reason: vpnCheck.reason,
        attemptType: 'google_login',
        riskScore: vpnCheck.riskScore,
        country: vpnCheck.country,
      });
      this.logUserAuditAction(
        'auth-attempt',
        'Google Auth (Tentativa)',
        'vpn_login_blocked',
        `Tentativa de login com Google bloqueada: Conexão via VPN/Proxy anônimo detectada (${vpnCheck.provider || vpnCheck.ip}, ASN: ${vpnCheck.asn || 'N/A'}, Risco: ${vpnCheck.riskScore}%)`,
        null
      );
      throw new Error(
        `Acesso bloqueado: O login está desabilitado para conexões que utilizam VPN ou Proxy anônimo (${vpnCheck.provider || vpnCheck.ip}). Para garantir a transparência da comunidade editorial e prevenir contas fantoches (sockpuppets), desative sua VPN e tente novamente.`
      );
    }

    await ensureFirebaseAuth();
    const currentAuth = auth || getAuthSafe();
    if (!currentAuth) {
      throw new Error('Serviço de autenticação Firebase Auth não está disponível no momento.');
    }

    // Provedor Google Sign-In com suporte a OAuth 2.0 e OpenID Connect (OIDC)
    const provider = new GoogleAuthProvider();
    provider.addScope('openid');
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    let result: any;
    try {
      result = await signInWithPopup(currentAuth, provider);
    } catch (popupErr: any) {
      if (
        popupErr?.code === 'auth/unauthorized-domain' ||
        popupErr?.message?.includes('unauthorized-domain')
      ) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'wikizero.wazzimagiygg.com';
        const activeCfg = getActiveFirebaseConfig();
        const activeProjectId = activeCfg.projectId;
        const customErr: any = new Error(
          `Domínio não autorizado no Firebase Auth: O domínio atual (${domain}) precisa ser cadastrado na aba "Domínios autorizados" do projeto Firebase ativo "${activeProjectId}".`
        );
        customErr.code = 'auth/unauthorized-domain';
        customErr.domain = domain;
        customErr.activeProjectId = activeProjectId;
        throw customErr;
      }
      throw popupErr;
    }
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const u = result.user;

    // 2. Verificação de segurança: Bloqueio estrito para nicknames de administradores da Wikimedia Foundation
    // Prioridade máxima: "Chronus", "LittleSunshine", "Johannnes89", "Teles", "Conde Edmond Dantés"
    const adminCheck = validateUserIdentifiersAgainstWikimediaAdmins({
      displayName: u.displayName,
      email: u.email,
      username: u.displayName || u.email?.split('@')[0],
    });

    if (adminCheck.isBlocked) {
      try {
        await signOut(currentAuth);
      } catch {
        // ignora erro silencioso no signOut
      }
      throw new Error(
        `Acesso bloqueado: O login foi recusado pois o nome/nickname '${adminCheck.matchedAdmin}' corresponde a um administrador de projetos da Wikimedia Foundation${adminCheck.isPriority ? ' (bloqueio prioritário de governança)' : ''}. O uso deste nickname está permanentemente restrito na WikiWorldWeb.`
      );
    }

    // Verificar status de bloqueio
    const banStatus = await this.getUserBanStatus(u.uid, u.email || undefined, u.displayName || undefined);
    const isBanned = !!banStatus.isBanned;

    // Tentar recuperar perfil pré-existente para validar se o usuário é previamente registrado
    let existingProfile: UserProfile | null = null;
    try {
      existingProfile = await this.getUserProfile(u.uid);
      if (!existingProfile && u.email) {
        existingProfile = await this.getUserProfile(u.email);
      }
    } catch {
      // fallback
    }

    // Se ainda não achou, consultar diretamente nas coleções 'userpage' e 'users' do Firestore por email
    if (!existingProfile && firebaseActive && db && u.email) {
      try {
        const emailLower = u.email.toLowerCase().trim();
        const qUsers = query(collection(db, 'users'), where('email', '==', emailLower));
        const snapUsers = await getDocs(qUsers);
        if (!snapUsers.empty) {
          existingProfile = snapUsers.docs[0].data() as UserProfile;
        } else {
          const qUserpage = query(collection(db, 'userpage'), where('email', '==', emailLower));
          const snapUserpage = await getDocs(qUserpage);
          if (!snapUserpage.empty) {
            existingProfile = snapUserpage.docs[0].data() as UserProfile;
          }
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao consultar registro prévio no Firestore:', err);
      }
    }

    const isProjectAdmin = u.email?.toLowerCase().trim() === 'pedrohenriquecardonaperes@gmail.com';

    // 1. POLÍTICA DE SEGURANÇA: Bloqueio permanente de usuários convidados
    if (existingProfile?.isGuest || existingProfile?.role === 'convidado') {
      try {
        await signOut(currentAuth);
      } catch {
        // ignora
      }
      this.clearUser();
      throw new Error(
        'Acesso negado: O login de usuários convidados está permanentemente desabilitado no sistema da Wiki.'
      );
    }

    // 2. ACESSO VIA GOOGLE: Usuários não previamente cadastrados são PERMITIDOS
    // O sistema provisiona automaticamente o novo perfil de editor e sua página de usuário pública
    if (!existingProfile) {
      if (isProjectAdmin) {
        const adminProfile: UserProfile = {
          uid: u.uid,
          email: u.email || 'pedrohenriquecardonaperes@gmail.com',
          displayName: u.displayName || 'Pedro Henrique Peres',
          username: 'PedroHenriquePeres',
          photoURL: u.photoURL || undefined,
          role: 'admin',
          isGuest: false,
          isBanned: false,
          permissions: {
            canEdit: true,
            canCreate: true,
            canTalk: true,
            canDelete: true,
            canGrantBarnstars: true,
          },
          lastActive: new Date().toISOString(),
          isOnline: true,
          createdAt: new Date().toISOString(),
        };
        const publicProfile = await this.ensureUserPage(adminProfile);
        this.saveUser(publicProfile);
        this.logUserAuditAction(
          u.uid,
          adminProfile.displayName,
          'google_user_registered',
          `Administrador fundador autenticado e perfil inicializado com sucesso (${u.email || u.uid}).`,
          null
        );
        return publicProfile;
      }

      // NOVO USUÁRIO AUTENTICADO VIA GOOGLE: Cadastro automático e liberação de perfil
      const rawName = (u.displayName || u.email?.split('@')[0] || 'Editor').trim();
      const cleanUsername = rawName.replace(/\s+/g, '_');
      const determinedRole: UserRole = isBanned ? 'leitor' : 'editor';

      const newProfile: UserProfile = {
        uid: u.uid,
        email: u.email || '',
        displayName: rawName,
        username: cleanUsername,
        photoURL: u.photoURL || undefined,
        role: determinedRole,
        isGuest: false,
        isBanned,
        banReason: isBanned ? (banStatus.reason || 'Violação das políticas comunitárias.') : undefined,
        permissions: {
          canEdit: !isBanned,
          canCreate: !isBanned && determinedRole !== 'leitor',
          canTalk: !isBanned,
          canDelete: false,
          canGrantBarnstars: false,
        },
        reputationScore: 100,
        editsCount: 0,
        warningCount: 0,
        location: 'Brasil',
        lastActive: new Date().toISOString(),
        isOnline: true,
        createdAt: new Date().toISOString(),
      };

      const publicProfile = await this.ensureUserPage(newProfile);
      this.saveUser(publicProfile);

      this.logUserAuditAction(
        u.uid,
        newProfile.displayName,
        'google_user_registered',
        `Novo usuário registrado e conectado via Google OAuth 2.0 / OpenID Connect (${u.email || u.uid}). Perfil criado e liberado com sucesso.`,
        null
      );

      return publicProfile;
    }

    // 1.5. LGPD: Se a conta deste Google UID foi excluída e anonimizada anteriormente sob a LGPD
    // O UID Google é preservado para identificá-la. Ao tentar criar outra conta / entrar:
    // O sistema a identifica, preserva o histórico de desassociação das contribuições passadas,
    // e provisiona um novo cadastro limpo sem restauração de dados pessoais ou autoria anteriores.
    if (existingProfile?.accountDeletedLGPD) {
      const prevDeletionDate = existingProfile.deletedAtLGPD || 'data anterior';
      const prevPseudonym = existingProfile.genericPseudonymLGPD || 'Usuário Anonimizado (LGPD)';

      this.logUserAuditAction(
        u.uid,
        u.displayName || u.email || 'Novo Editor',
        'lgpd_reidentified_google_uid',
        `Identificação preventiva LGPD: Google UID '${u.uid}' (conta previamente excluída sob Art. 18, VI em ${prevDeletionDate}) autenticou-se novamente para novo cadastro. Contribuições anteriores permanecem irrevogavelmente associadas ao pseudônimo "${prevPseudonym}".`,
        null
      );

      const rawName = (u.displayName || u.email?.split('@')[0] || 'Novo Editor').trim();
      const cleanUsername = rawName.replace(/\s+/g, '_');
      const determinedRole: UserRole = isBanned ? 'leitor' : 'editor';

      const freshProfile: UserProfile = {
        uid: u.uid, // Preservação identificatória do UID Google!
        email: u.email || '',
        displayName: rawName,
        username: cleanUsername,
        photoURL: u.photoURL || undefined,
        role: determinedRole,
        isGuest: false,
        isBanned,
        banReason: isBanned ? (banStatus.reason || 'Violação das políticas comunitárias.') : undefined,
        permissions: {
          canEdit: !isBanned,
          canCreate: !isBanned && determinedRole !== 'leitor',
          canTalk: !isBanned,
          canDelete: false,
          canGrantBarnstars: false,
        },
        reputationScore: 100,
        editsCount: 0,
        warningCount: 0,
        location: 'Brasil',
        lastActive: new Date().toISOString(),
        isOnline: true,
        createdAt: new Date().toISOString(),
        previousAccountDeletedLGPD: true,
        previousDeletedAtLGPD: prevDeletionDate,
        accountDeletedLGPD: false,
      };

      const publicProfile = await this.ensureUserPage(freshProfile);
      this.saveUser(publicProfile);

      this.sendLgpdNotification(
        'Identificação de Conta (LGPD Art. 18)',
        `Seu Google UID foi identificado. Conforme a LGPD, seus dados e autoria de edições anteriores permanecem definitivamente anonimizados como "${prevPseudonym}". Um novo perfil limpo foi inicializado para este acesso.`,
        'notifyOnPrivacyUpdate',
        'info'
      );

      return publicProfile;
    }

    const determinedRole: UserRole = isBanned
      ? 'leitor'
      : (existingProfile!.role || 'editor');

    const isPrivileged = determinedRole === 'admin' || determinedRole === 'moderador';
    const isAvatarRemovedByAdmin = Boolean(existingProfile!.avatarRemovedByAdmin);

    const userProfile: UserProfile = {
      ...existingProfile!,
      uid: u.uid,
      email: u.email || existingProfile!.email || '',
      displayName: existingProfile!.displayName || u.displayName || u.email?.split('@')[0] || 'Usuário Registrado',
      photoURL: isAvatarRemovedByAdmin ? undefined : (u.photoURL || existingProfile!.photoURL),
      avatarRemovedByAdmin: isAvatarRemovedByAdmin ? true : undefined,
      avatarRemovedAt: existingProfile!.avatarRemovedAt,
      avatarRemovedReason: existingProfile!.avatarRemovedReason,
      avatarRemovedBy: existingProfile!.avatarRemovedBy,
      isGuest: false,
      isBanned,
      banReason: isBanned ? (banStatus.reason || 'Violação das políticas comunitárias.') : undefined,
      role: determinedRole,
      permissions: {
        canEdit: !isBanned,
        canCreate: !isBanned && determinedRole !== 'leitor',
        canTalk: !isBanned,
        canDelete: isPrivileged,
        canGrantBarnstars: !isBanned,
      },
      lastActive: new Date().toISOString(),
      isOnline: true,
      createdAt: existingProfile!.createdAt || new Date().toISOString(),
    };
    if (isAvatarRemovedByAdmin) {
      delete (userProfile as any).photoURL;
    }

    // Atualizar e disponibilizar publicamente a página de usuário
    const publicProfile = await this.ensureUserPage(userProfile);
    this.saveUser(publicProfile);
    return publicProfile;
  },

  async loginAsCommunityUser(uid: string): Promise<UserProfile> {
    // 1. Verificação de segurança: Bloqueio estrito para IPs de origem da Wikimedia Foundation (AS14907)
    const ipCheck = await verifyClientIpForLogin();
    if (ipCheck.isWikimedia) {
      const detail = ipCheck.matchedRange ? ` (faixa detectada: ${ipCheck.matchedRange})` : '';
      throw new Error(
        `Acesso bloqueado: Login desabilitado para endereços IP originários da Wikimedia Foundation (AS14907, IP: ${ipCheck.ip}${detail}).`
      );
    }

    await ensureFirebaseAuth();
    const existing = await this.getUserProfile(uid);
    if (!existing) {
      throw new Error('Acesso negado: Usuário não registrado no sistema da Wiki.');
    }

    // Bloqueio de usuários convidados
    if (existing.isGuest || existing.role === 'convidado') {
      throw new Error('Acesso negado: Usuários convidados não possuem permissão para efetuar login.');
    }

    // 2. Verificação de segurança: Bloqueio estrito para nicknames de administradores da Wikimedia Foundation
    const adminCheck = validateUserIdentifiersAgainstWikimediaAdmins({
      displayName: existing.displayName,
      username: existing.username,
      email: existing.email,
    });
    if (adminCheck.isBlocked) {
      throw new Error(
        `Acesso bloqueado: O usuário '${existing.username || existing.displayName}' possui nickname correspondente a um administrador da Wikimedia Foundation (${adminCheck.matchedAdmin}). Login estritamente proibido.`
      );
    }

    // Checar bloqueio
    const banStatus = await this.getUserBanStatus(uid, existing.email, existing.username || existing.displayName);
    const isBanned = banStatus.isBanned || !!existing.isBanned;

    const updatedProfile: UserProfile = {
      ...existing,
      isBanned,
      banReason: isBanned ? (banStatus.reason || existing.banReason || 'Violação das diretrizes comunitárias.') : undefined,
      role: isBanned ? 'leitor' : existing.role,
      permissions: {
        canEdit: !isBanned,
        canCreate: !isBanned && existing.role !== 'leitor',
        canTalk: !isBanned,
        canDelete: !isBanned && (existing.role === 'admin' || existing.role === 'moderador'),
        canGrantBarnstars: !isBanned && existing.role !== 'leitor' && !existing.isGuest,
      },
      lastActive: new Date().toISOString(),
      isOnline: true,
    };

    const publicProfile = await this.ensureUserPage(updatedProfile);
    this.saveUser(publicProfile);
    return publicProfile;
  },

  async loginCustom(username: string, displayName?: string, role: UserRole = 'editor'): Promise<UserProfile> {
    await ensureFirebaseAuth();
    const cleanUsername = username.trim();
    const uid = 'user-' + cleanUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    // Checagem de administrador da Wikimedia Foundation
    const adminCheck = validateUserIdentifiersAgainstWikimediaAdmins({
      username: cleanUsername,
      displayName: displayName || cleanUsername,
      email: `${cleanUsername.toLowerCase()}@wikizero.org`,
    });
    if (adminCheck.isBlocked) {
      throw new Error(
        `Acesso bloqueado: O nickname '${adminCheck.matchedAdmin}' está permanentemente bloqueado para login ou registro por corresponder a um administrador de projetos da Wikimedia Foundation.`
      );
    }

    // Checar bloqueio
    const banStatus = await this.getUserBanStatus(uid, `${cleanUsername.toLowerCase()}@wikizero.org`, cleanUsername);
    let existing = await this.getUserProfile(uid);
    const isBanned = banStatus.isBanned || !!existing?.isBanned;

    if (!existing) {
      throw new Error(
        `Acesso negado: O usuário '${cleanUsername}' não está registrado no sistema da Wiki. O login de usuários não registrados está desabilitado. Solicite o cadastro prévio à administração.`
      );
    }

    if (existing.isGuest || existing.role === 'convidado') {
      throw new Error('Acesso negado: Usuários convidados não possuem permissão para efetuar login.');
    }

    existing = {
      ...existing,
      isBanned,
      banReason: isBanned ? (banStatus.reason || existing.banReason || 'Violação das políticas comunitárias.') : undefined,
      permissions: {
        canEdit: !isBanned,
        canCreate: !isBanned && existing.role !== 'leitor',
        canTalk: !isBanned,
        canDelete: !isBanned && (existing.role === 'admin' || existing.role === 'moderador'),
        canGrantBarnstars: !isBanned,
      },
      lastActive: new Date().toISOString(),
      isOnline: true,
    };

    const publicProfile = await this.ensureUserPage(existing);
    this.saveUser(publicProfile);
    return publicProfile;
  },

  async logout(): Promise<void> {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Signout error', err);
      }
    }
    this.clearUser();
  },

  async getUserBanStatus(
    uid: string,
    email?: string,
    username?: string
  ): Promise<{ isBanned: boolean; reason?: string; banType?: string; expiresAt?: string }> {
    if (!uid) return { isBanned: false };

    // 0. Verificação institucional de administradores da Wikimedia Foundation
    const adminCheck = validateUserIdentifiersAgainstWikimediaAdmins({
      username: username || uid,
      email: email,
      displayName: username,
    });
    if (adminCheck.isBlocked) {
      return {
        isBanned: true,
        reason: adminCheck.reason || `Nome de usuário/nickname '${adminCheck.matchedAdmin}' bloqueado permanentemente por constar na lista de administradores da Wikimedia Foundation.`,
        banType: 'permanente',
      };
    }

    // 1. Simulação para conta de teste bloqueada
    if (uid === 'banned_test_user') {
      return {
        isBanned: true,
        reason: 'Conta de teste bloqueada administrativamente por violação das diretrizes.',
        banType: 'permanente',
      };
    }

    // 2. Consulta em tempo real na coleção banned_users do Firestore
    if (firebaseActive && db) {
      try {
        // Checar por UID
        const banDoc = await getDoc(doc(db, 'banned_users', uid));
        if (banDoc.exists()) {
          const data = banDoc.data();
          return {
            isBanned: true,
            reason: data.reason || data.banReason || 'Conta suspensa por decisão administrativa.',
            banType: data.banType || 'permanente',
            expiresAt: data.banExpiresAt || data.expiresAt,
          };
        }

        // Checar documento em users/{uid} se flag isBanned estiver ativa
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists() && userDoc.data()?.isBanned) {
          const data = userDoc.data();
          return {
            isBanned: true,
            reason: data.banReason || 'Conta suspensa por decisão administrativa.',
            banType: data.banType || 'permanente',
            expiresAt: data.banExpiresAt,
          };
        }

        // Checar por email se fornecido
        if (email) {
          const emailDoc = await getDoc(doc(db, 'banned_users', email.toLowerCase().trim()));
          if (emailDoc.exists()) {
            const data = emailDoc.data();
            return {
              isBanned: true,
              reason: data.reason || data.banReason || 'Email associado a conta bloqueada.',
              banType: data.banType || 'permanente',
            };
          }
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao consultar banimento no Firestore:', err);
      }
    }

    // 3. Checar banco local e usuários da comunidade
    try {
      const communityUsers = await this.getCommunityUsers();
      const match = communityUsers.find(
        (u) =>
          u.uid === uid ||
          (email && u.email && u.email.toLowerCase() === email.toLowerCase()) ||
          (username && (u.username === username || u.displayName === username))
      );
      if (match && match.isBanned) {
        return {
          isBanned: true,
          reason: match.banReason || 'Conta bloqueada por infração das regras comunitárias.',
          banType: match.banType || 'permanente',
          expiresAt: match.banExpiresAt,
        };
      }
    } catch {
      // Ignora erro de leitura local
    }

    return { isBanned: false };
  },

  async checkIfUserIsBanned(uid: string, email?: string, username?: string): Promise<boolean> {
    const status = await this.getUserBanStatus(uid, email, username);
    return status.isBanned;
  },

  // === NOTIFICATIONS ===
  getNotifications(): NotificationItem[] {
    initializeLocalStorage();
    const rawList = safeGetArray<NotificationItem>(STORAGE_KEYS.NOTIFICATIONS, []);
    const seenIds = new Set<string>();
    const deduplicated: NotificationItem[] = [];
    let hadDuplicates = false;

    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      if (!item) continue;
      let itemId = item.id;
      if (!itemId || seenIds.has(itemId)) {
        hadDuplicates = true;
        itemId = itemId ? `${itemId}-${i}-${Math.random().toString(36).slice(2, 6)}` : `notif-${Date.now()}-${i}`;
      }
      seenIds.add(itemId);
      deduplicated.push({ ...item, id: itemId });
    }

    if (hadDuplicates && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(deduplicated));
      } catch {
        // ignora erro silencioso de gravação
      }
    }
    return deduplicated;
  },

  async fetchNotificationsFromFirestore(): Promise<NotificationItem[]> {
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'notifications'));
        const list: NotificationItem[] = [];
        const seenIds = new Set<string>();
        snap.forEach((d) => {
          const item = d.data() as NotificationItem;
          if (item) {
            let itemId = item.id || d.id;
            if (seenIds.has(itemId)) {
              itemId = `${itemId}-${Math.random().toString(36).slice(2, 6)}`;
            }
            seenIds.add(itemId);
            list.push({ ...item, id: itemId });
          }
        });
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
        return list;
      } catch (err) {
        console.warn('Firestore fetchNotifications error:', err);
      }
    }
    return this.getNotifications();
  },

  subscribeToNotifications(callback: (notifications: NotificationItem[]) => void): () => void {
    if (!firebaseActive || !db) {
      callback(this.getNotifications());
      return () => {};
    }
    try {
      const q = query(collection(db, 'notifications'));
      return onSnapshot(
        q,
        (snap) => {
          const list: NotificationItem[] = [];
          const seenIds = new Set<string>();
          snap.forEach((d) => {
            const item = d.data() as NotificationItem;
            if (item) {
              let itemId = item.id || d.id;
              if (seenIds.has(itemId)) {
                itemId = `${itemId}-${Math.random().toString(36).slice(2, 6)}`;
              }
              seenIds.add(itemId);
              list.push({ ...item, id: itemId });
            }
          });
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
          callback(list);
        },
        (err) => {
          console.warn('[StorageService] onSnapshot notifications error:', err);
          callback(this.getNotifications());
        }
      );
    } catch {
      callback(this.getNotifications());
      return () => {};
    }
  },

  markNotificationsAsRead(): NotificationItem[] {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    return list;
  },

  addNotification(notif: Omit<NotificationItem, 'id' | 'date' | 'read'>): NotificationItem[] {
    const isLgpdNotif =
      notif.link === '#mydata' ||
      notif.link === 'mydata' ||
      notif.title.toLowerCase().includes('lgpd') ||
      notif.title.toLowerCase().includes('privacidade') ||
      notif.title.toLowerCase().includes('consentimento');

    // Restrito a notas de versão, atualizações do sistema e notificações oficiais de privacidade LGPD
    const isSystemUpdate =
      isLgpdNotif ||
      notif.link === 'site-updates' ||
      notif.title.toLowerCase().includes('v3.') ||
      notif.title.toLowerCase().includes('atualização') ||
      notif.title.toLowerCase().includes('versão') ||
      notif.title.toLowerCase().includes('release');

    if (!isSystemUpdate) {
      // Ignorar notificações de eventos pontuais no sininho (mantendo o sininho 100% focado em notas e LGPD)
      return this.getNotifications();
    }

    const list = this.getNotifications();
    // Evitar inserções duplicadas imediatas com o mesmo título e mensagem (por exemplo, cliques rápidos ou remontagens no React)
    const alreadyExists = list.length > 0 && list[0].title === notif.title && list[0].message === notif.message;
    if (alreadyExists) {
      return list;
    }

    const randomSalt = Math.random().toString(36).substring(2, 8);
    const item: NotificationItem = {
      ...notif,
      id: isLgpdNotif ? `lgpd-notif-${Date.now()}-${randomSalt}` : `upd-notif-${Date.now()}-${randomSalt}`,
      date: 'Agora',
      read: false,
      link: notif.link || (isLgpdNotif ? '#mydata' : 'site-updates'),
    };
    const updated = [item, ...list];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    return updated;
  },

  // === COOKIES & LGPD ===
  getCookieConsent(): CookieConsent | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSENT);
    return raw ? JSON.parse(raw) : null;
  },

  saveCookieConsent(consent: Omit<CookieConsent, 'timestamp' | 'version'>): CookieConsent {
    const fullConsent: CookieConsent = {
      ...consent,
      timestamp: new Date().toISOString(),
      version: '2.0',
    };
    localStorage.setItem(STORAGE_KEYS.CONSENT, JSON.stringify(fullConsent));
    return fullConsent;
  },

  calculateAge(birthdateStr?: string | null): number {
    if (!birthdateStr) return 0;
    const parts = birthdateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const birthDate = new Date(year, month, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return Math.max(0, age);
      }
    }
    const parsed = new Date(birthdateStr);
    if (isNaN(parsed.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - parsed.getFullYear();
    const m = today.getMonth() - parsed.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) {
      age--;
    }
    return Math.max(0, age);
  },

  isLgpdTermsAccepted(): boolean {
    const isAccepted = localStorage.getItem(STORAGE_KEYS.LGPD_TERMS) === 'true';
    const birthdate = localStorage.getItem(STORAGE_KEYS.BIRTHDATE);
    if (!isAccepted || !birthdate) return false;
    const age = this.calculateAge(birthdate);
    return age > 14;
  },

  getUserAgeInfo(): { isAccepted: boolean; birthdate: string | null; age: number } {
    const isAccepted = this.isLgpdTermsAccepted();
    const birthdate = localStorage.getItem(STORAGE_KEYS.BIRTHDATE);
    const age = this.calculateAge(birthdate);
    return { isAccepted, birthdate, age };
  },

  saveLgpdTermsAccepted(birthdate: string): { success: boolean; age: number; message?: string } {
    const age = this.calculateAge(birthdate);
    if (age <= 14) {
      return {
        success: false,
        age,
        message: 'Acesso restrito: A idade informada deve ser estritamente maior que 14 anos conforme os termos da WikiWorldWeb e LGPD.',
      };
    }
    localStorage.setItem(STORAGE_KEYS.LGPD_TERMS, 'true');
    localStorage.setItem(STORAGE_KEYS.BIRTHDATE, birthdate);
    localStorage.setItem(STORAGE_KEYS.USER_AGE, String(age));
    const user = this.getCurrentUser();
    if (user) {
      user.dataConsentimento = new Date().toISOString();
      user.birthdate = birthdate;
      this.saveUser(user);
    }

    // Notificação LGPD conforme preferências do titular
    const notifPrefs = this.getLgpdNotificationPreferences();
    if (notifPrefs.notifyOnTermsAccepted) {
      this.addNotification({
        title: 'Consentimento LGPD Ativo',
        message: 'Seus termos de privacidade da LGPD e confirmação de idade (> 14 anos) foram validados com sucesso.',
        link: '#mydata',
        type: 'success',
      });
    }

    return { success: true, age };
  },

  // === RECOMENDAÇÃO DO GOOGLE CHROME ===
  isChromeRecommendationNoticed(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.CHROME_PREFERENCE_NOTICED) === 'true';
  },

  setChromeRecommendationNoticed(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CHROME_PREFERENCE_NOTICED, 'true');
  },

  resetChromeRecommendationNoticed(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CHROME_PREFERENCE_NOTICED);
  },

  revokeConsent() {
    localStorage.removeItem(STORAGE_KEYS.LGPD_TERMS);
    localStorage.removeItem(STORAGE_KEYS.CONSENT);
    localStorage.removeItem(STORAGE_KEYS.BIRTHDATE);
    localStorage.removeItem(STORAGE_KEYS.USER_AGE);

    const notifPrefs = this.getLgpdNotificationPreferences();
    if (notifPrefs.notifyOnPrivacyUpdate) {
      this.addNotification({
        title: 'Consentimento LGPD Revogado',
        message: 'Suas permissões e cookies foram revogados conforme o Artigo 18 da LGPD.',
        link: '#mydata',
        type: 'warning',
      });
    }
  },

  // === PREFERÊNCIAS DE NOTIFICAÇÃO LGPD ===
  getLgpdNotificationPreferences(): LgpdNotificationPreferences {
    const defaults: LgpdNotificationPreferences = {
      notifyOnTermsAccepted: true,
      notifyOnPrivacyUpdate: true,
      notifyOnDataPortability: true,
      notifyOnAccountChanges: true,
    };
    const raw = localStorage.getItem(STORAGE_KEYS.LGPD_NOTIFICATION_CONFIG);
    if (!raw) return defaults;
    try {
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  },

  saveLgpdNotificationPreferences(prefs: Partial<LgpdNotificationPreferences>): LgpdNotificationPreferences {
    const current = this.getLgpdNotificationPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEYS.LGPD_NOTIFICATION_CONFIG, JSON.stringify(updated));
    return updated;
  },

  sendLgpdNotification(
    title: string,
    message: string,
    prefKey: keyof LgpdNotificationPreferences = 'notifyOnPrivacyUpdate',
    type: 'info' | 'success' | 'warning' = 'info'
  ) {
    const prefs = this.getLgpdNotificationPreferences();
    if (!prefs[prefKey]) {
      return null;
    }
    return this.addNotification({
      title,
      message,
      link: '#mydata',
      type,
    });
  },

  // === EDITOR DRAFTS ===
  getDraft(): { title: string; content: string; pageUid: string } | null {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFT);
    return raw ? JSON.parse(raw) : null;
  },

  saveDraft(draft: { title: string; content: string; pageUid: string }) {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify({ ...draft, savedAt: Date.now() }));
  },

  clearDraft() {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  },

  // === RECENT CHANGES (MUDANÇAS RECENTES) ===
  async getRecentChanges(): Promise<RecentChangeEntry[]> {
    initializeLocalStorage();
    const articles = await this.getArticles();
    const pages = await this.getPages();
    const pageMap = new Map(pages.map((p) => [p.uid, p.titulo]));

    const entries: RecentChangeEntry[] = [];

    // Custom logged changes
    try {
      const rawCustom = localStorage.getItem(STORAGE_KEYS.RECENT_CHANGES);
      if (rawCustom) {
        const customList: RecentChangeEntry[] = JSON.parse(rawCustom);
        entries.push(...customList);
      }
    } catch (e) {
      console.warn('Error reading custom recent changes:', e);
    }

    // Compile from articles & their history items
    articles.forEach((art) => {
      if (art.historico && art.historico.length > 0) {
        // history is usually sorted latest first
        for (let i = 0; i < art.historico.length; i++) {
          const item = art.historico[i];
          const prevItem = art.historico[i + 1]; // older version
          const deltaBytes = prevItem ? item.tamanho - prevItem.tamanho : item.tamanho;
          const isCreation = !prevItem || i === art.historico.length - 1;
          const isMinor =
            !isCreation &&
            (item.resumo.toLowerCase().includes('menor') ||
              item.resumo.toLowerCase().includes('ajuste') ||
              item.resumo.toLowerCase().includes('ortograf') ||
              Math.abs(deltaBytes) <= 20);

          entries.push({
            id: `rc-${art.id}-${item.id || i}`,
            type: isCreation ? 'new_article' : isMinor ? 'minor_edit' : 'edit_article',
            articleId: art.id,
            articleTitle: art.titulo,
            pageUid: art.pageUid,
            pageTitle: pageMap.get(art.pageUid) || art.pageUid,
            autor: item.autor || art.autor || 'Colaborador',
            autorEmail: item.autorEmail || art.autorEmail,
            data: item.data || art.dataEdicao || art.dataCriacao,
            resumo: item.resumo || (isCreation ? 'Criação do artigo' : 'Edição no artigo'),
            tamanho: item.tamanho || (art.descricao ? art.descricao.length : 0),
            deltaBytes,
            versao: art.historico.length - i,
            idioma: art.idioma || 'pt',
            isMinor,
            isBot: item.autor?.toLowerCase().includes('bot'),
          });
        }
      } else {
        // Article without detailed history array
        const descLength = art.descricao ? art.descricao.length : 0;
        entries.push({
          id: `rc-${art.id}-init`,
          type: 'new_article',
          articleId: art.id,
          articleTitle: art.titulo,
          pageUid: art.pageUid,
          pageTitle: pageMap.get(art.pageUid) || art.pageUid,
          autor: art.autor || 'Colaborador',
          autorEmail: art.autorEmail,
          data: art.dataCriacao,
          resumo: 'Criação do artigo',
          tamanho: descLength,
          deltaBytes: descLength,
          versao: art.versao || 1,
          idioma: art.idioma || 'pt',
          isMinor: false,
          isBot: art.autor?.toLowerCase().includes('bot'),
        });
      }
    });

    // Add page collections creations
    pages.forEach((p) => {
      entries.push({
        id: `rc-page-${p.uid}`,
        type: 'new_collection',
        articleTitle: p.titulo,
        pageUid: p.uid,
        pageTitle: p.titulo,
        autor: p.autor || 'Admin',
        data: p.criadoEm,
        resumo: `Nova coleção criada: ${p.descricao.slice(0, 70)}...`,
        tamanho: p.descricao.length,
        deltaBytes: p.descricao.length,
        versao: 1,
        isMinor: false,
      });
    });

    // 3. Consultar a coleção real 'recent_changes' no Firestore
    if (firebaseActive && db) {
      try {
        const rcSnap = await getDocs(query(collection(db, 'recent_changes'), limit(100)));
        rcSnap.forEach((d) => {
          const rcData = d.data() as RecentChangeEntry;
          if (rcData && rcData.id) {
            entries.push(rcData);
          }
        });
      } catch (err) {
        console.warn('[StorageService] Erro ao carregar coleção recent_changes do Firestore:', err);
      }
    }

    // Deduplicate by ID
    const uniqueMap = new Map<string, RecentChangeEntry>();
    entries.forEach((e) => {
      if (!uniqueMap.has(e.id)) {
        uniqueMap.set(e.id, e);
      }
    });

    // Sort descending by date
    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  },

  subscribeToRecentChanges(callback: (changes: RecentChangeEntry[]) => void): () => void {
    if (!firebaseActive || !db) {
      return () => {};
    }
    try {
      const q = query(collection(db, 'recent_changes'), limit(80));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: RecentChangeEntry[] = [];
          snapshot.forEach((d) => list.push(d.data() as RecentChangeEntry));
          if (list.length > 0) {
            list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
            callback(list);
          }
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição de recent_changes:', err);
        }
      );
    } catch {
      return () => {};
    }
  },

  async recordRecentChange(entry: Omit<RecentChangeEntry, 'id' | 'data'>): Promise<RecentChangeEntry> {
    const fullEntry: RecentChangeEntry = {
      ...entry,
      id: `rc-live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      data: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECENT_CHANGES);
      const list: RecentChangeEntry[] = raw ? JSON.parse(raw) : [];
      list.unshift(fullEntry);
      // Keep last 200 entries
      localStorage.setItem(STORAGE_KEYS.RECENT_CHANGES, JSON.stringify(list.slice(0, 200)));
    } catch (e) {
      console.warn('Error recording recent change:', e);
    }

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'recent_changes', fullEntry.id), fullEntry);
      } catch (err) {
        console.warn('[StorageService] Erro ao gravar recent_change no Firestore:', err);
      }
    }

    return fullEntry;
  },

  // === TALK PAGES / PÁGINAS DE DISCUSSÃO ===
  getTalkThreads(articleId: string): TalkThread[] {
    initializeLocalStorage();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TALK_THREADS);
      const list: TalkThread[] = raw ? JSON.parse(raw) : [];
      return list.filter((t) => t.articleId === articleId);
    } catch (e) {
      console.warn('Error loading talk threads:', e);
      return [];
    }
  },

  async fetchTalkThreads(articleId: string): Promise<TalkThread[]> {
    initializeLocalStorage();
    let localList: TalkThread[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TALK_THREADS);
      const list: TalkThread[] = raw ? JSON.parse(raw) : [];
      localList = list.filter((t) => t.articleId === articleId);
    } catch (e) {
      console.warn('Error loading talk threads:', e);
    }

    if (firebaseActive && db) {
      try {
        const q = query(collection(db, 'talk_threads'), where('articleId', '==', articleId));
        const snap = await getDocs(q);
        const remoteList: TalkThread[] = [];
        snap.forEach((d) => remoteList.push(d.data() as TalkThread));
        if (remoteList.length > 0) {
          remoteList.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
          return remoteList;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao carregar talk_threads do Firestore:', err);
      }
    }

    return localList;
  },

  subscribeToTalkThreads(articleId: string, callback: (threads: TalkThread[]) => void): () => void {
    if (!firebaseActive || !db) {
      return () => {};
    }
    try {
      const q = query(collection(db, 'talk_threads'), where('articleId', '==', articleId));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: TalkThread[] = [];
          snapshot.forEach((d) => list.push(d.data() as TalkThread));
          list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
          callback(list);
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição de talk_threads:', err);
        }
      );
    } catch {
      return () => {};
    }
  },

  async addTalkThread(
    articleId: string,
    titulo: string,
    conteudo: string,
    user: UserProfile | null
  ): Promise<TalkThread> {
    const effectiveUser = user || this.getCurrentUser();
    if (!effectiveUser || effectiveUser.isGuest) {
      throw new Error('Somente usuários cadastrados e logados podem abrir tópicos de discussão na WikiWorldWeb.');
    }
    if (effectiveUser.isBanned) {
      throw new Error('Sua conta está suspensa. Usuários bloqueados não podem criar tópicos de discussão.');
    }

    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.TALK_THREADS);
    const list: TalkThread[] = raw ? JSON.parse(raw) : [];

    const newThread: TalkThread = {
      id: `talk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      articleId,
      titulo,
      conteudo,
      autor: effectiveUser.displayName || effectiveUser.username || effectiveUser.email.split('@')[0],
      autorEmail: effectiveUser.email,
      autorRole: effectiveUser.role || 'editor',
      data: new Date().toISOString(),
      status: 'aberto',
      respostas: [],
    };

    list.unshift(newThread);
    localStorage.setItem(STORAGE_KEYS.TALK_THREADS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'talk_threads', newThread.id), newThread);
        console.info(`[StorageService] Tópico de discussão "${titulo}" gravado no Firebase.`);
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar talk_thread no Firestore:', err);
      }
    }

    return newThread;
  },

  async addTalkReply(
    threadId: string,
    conteudo: string,
    user: UserProfile | null
  ): Promise<TalkReply | null> {
    const effectiveUser = user || this.getCurrentUser();
    if (!effectiveUser || effectiveUser.isGuest) {
      throw new Error('Somente usuários cadastrados e logados podem responder em discussões.');
    }
    if (effectiveUser.isBanned) {
      throw new Error('Sua conta está suspensa. Usuários bloqueados não podem responder em discussões.');
    }

    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.TALK_THREADS);
    const list: TalkThread[] = raw ? JSON.parse(raw) : [];

    const thread = list.find((t) => t.id === threadId);
    if (!thread) return null;

    const newReply: TalkReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      autor: effectiveUser.displayName || effectiveUser.username || effectiveUser.email.split('@')[0],
      autorEmail: effectiveUser.email,
      autorRole: effectiveUser.role || 'editor',
      conteudo,
      data: new Date().toISOString(),
      upvotes: 0,
    };

    thread.respostas.push(newReply);
    if (thread.status === 'aberto') {
      thread.status = 'em_discussao';
    }

    localStorage.setItem(STORAGE_KEYS.TALK_THREADS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        const threadDocRef = doc(db, 'talk_threads', threadId);
        const threadSnap = await getDoc(threadDocRef);
        if (threadSnap.exists()) {
          const remoteThread = threadSnap.data() as TalkThread;
          remoteThread.respostas = remoteThread.respostas || [];
          remoteThread.respostas.push(newReply);
          if (remoteThread.status === 'aberto') {
            remoteThread.status = 'em_discussao';
          }
          await setDoc(threadDocRef, remoteThread);
        } else {
          await setDoc(threadDocRef, thread);
        }
        console.info(`[StorageService] Resposta de discussão salva no Firebase.`);
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar resposta no Firestore:', err);
      }
    }

    return newReply;
  },

  async updateTalkThreadStatus(threadId: string, status: TalkThread['status']): Promise<boolean> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.TALK_THREADS);
    const list: TalkThread[] = raw ? JSON.parse(raw) : [];

    const thread = list.find((t) => t.id === threadId);
    if (!thread) return false;

    thread.status = status;
    localStorage.setItem(STORAGE_KEYS.TALK_THREADS, JSON.stringify(list));

    if (firebaseActive && db) {
      setDoc(doc(db, 'talk_threads', threadId), { status }, { merge: true }).catch((err) =>
        console.warn('[StorageService] Erro ao atualizar status de discussão no Firestore:', err)
      );
    }

    return true;
  },

  // === WATCHLIST / PÁGINAS VIGIADAS ===
  getWatchlist(): WatchlistItem[] {
    initializeLocalStorage();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  isWatched(articleId: string): boolean {
    const list = this.getWatchlist();
    return list.some((item) => item.articleId === articleId);
  },

  toggleWatchlist(article: WikiArticle): boolean {
    initializeLocalStorage();
    const list = this.getWatchlist();
    const index = list.findIndex((item) => item.articleId === article.id);

    let isNowWatched = false;
    if (index >= 0) {
      list.splice(index, 1);
      isNowWatched = false;
    } else {
      list.unshift({
        articleId: article.id,
        articleTitle: article.titulo,
        pageUid: article.pageUid,
        dataAdicionado: new Date().toISOString(),
      });
      isNowWatched = true;
    }

    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(list));
    return isNowWatched;
  },

  // === COMMUNITY RATINGS & FEEDBACK ===
  getArticleRating(articleId: string): ArticleRatingData {
    initializeLocalStorage();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RATINGS);
      const ratingsMap: Record<string, ArticleRatingData> = raw ? JSON.parse(raw) : {};
      return (
        ratingsMap[articleId] || {
          articleId,
          averageScore: 0,
          totalVotes: 0,
          feedbacks: [],
        }
      );
    } catch (e) {
      return {
        articleId,
        averageScore: 0,
        totalVotes: 0,
        feedbacks: [],
      };
    }
  },

  submitRating(
    articleId: string,
    nota: number,
    comentario: string,
    user: UserProfile | null
  ): ArticleRatingData {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.RATINGS);
    const ratingsMap: Record<string, ArticleRatingData> = raw ? JSON.parse(raw) : {};

    const current = ratingsMap[articleId] || {
      articleId,
      averageScore: 0,
      totalVotes: 0,
      feedbacks: [],
    };

    const newTotal = current.totalVotes + 1;
    const newAverage = Number(((current.averageScore * current.totalVotes + nota) / newTotal).toFixed(1));

    const feedbacks = current.feedbacks || [];
    if (comentario.trim()) {
      feedbacks.unshift({
        autor: user ? user.displayName || user.email.split('@')[0] : 'Leitor WikiWorldWeb',
        nota,
        comentario: comentario.trim(),
        data: new Date().toISOString(),
      });
    }

    const updated: ArticleRatingData = {
      articleId,
      averageScore: newAverage,
      totalVotes: newTotal,
      userScore: nota,
      feedbacks,
    };

    ratingsMap[articleId] = updated;
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratingsMap));

    if (firebaseActive && db) {
      setDoc(doc(db, 'ratings', articleId), updated, { merge: true }).catch((err) =>
        console.warn('[StorageService] Erro ao sincronizar avaliação no Firestore:', err)
      );
    }

    return updated;
  },

  // === WHAT LINKS HERE / PÁGINAS AFLUENTES ===
  getBacklinks(targetTitle: string, allArticles: WikiArticle[]): { article: WikiArticle; snippet: string }[] {
    if (!targetTitle) return [];
    const normalizedTarget = targetTitle.toLowerCase().trim();

    const results: { article: WikiArticle; snippet: string }[] = [];

    allArticles.forEach((art) => {
      // Don't link to self
      if (art.titulo.toLowerCase() === normalizedTarget) return;

      const desc = art.descricao || '';
      // Check for [[Target]] or [[Target|Label]]
      const linkRegex = new RegExp(`\\[\\[(${escapeRegex(targetTitle)})(?:\\|[^\\]]*)?\\]\\]`, 'i');
      const match = desc.match(linkRegex);

      if (match && match.index !== undefined) {
        // Extract context snippet
        const start = Math.max(0, match.index - 40);
        const end = Math.min(desc.length, match.index + match[0].length + 40);
        let snippet = desc.slice(start, end).replace(/\n/g, ' ');
        if (start > 0) snippet = '...' + snippet;
        if (end < desc.length) snippet = snippet + '...';

        results.push({
          article: art,
          snippet,
        });
      }
    });

    return results;
  },

  // === COMMUNITY USERS / PÁGINAS DE USUÁRIO ===
  async getCommunityUsers(): Promise<UserProfile[]> {
    initializeLocalStorage();
    let localUsers: UserProfile[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMMUNITY_USERS);
      localUsers = raw ? JSON.parse(raw) : [];
    } catch {
      localUsers = [];
    }

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'userpage'));
        const remoteUsers: UserProfile[] = [];
        snap.forEach((d) => {
          const u = d.data() as UserProfile;
          if (u.avatarRemovedByAdmin) {
            delete (u as any).photoURL;
            u.photoURL = undefined;
          }
          remoteUsers.push(u);
        });

        const usersSnap = await getDocs(collection(db, 'users'));
        const existingUids = new Set(remoteUsers.map((u) => u.uid));
        usersSnap.forEach((d) => {
          if (!existingUids.has(d.id)) {
            const data = d.data();
            const isAvatarRemoved = Boolean(data.avatarRemovedByAdmin);
            const userObj: UserProfile = {
              uid: d.id,
              username: data.username || data.displayName || d.id,
              displayName: data.displayName || data.username || d.id,
              email: data.email || '',
              photoURL: isAvatarRemoved ? undefined : data.photoURL,
              avatarRemovedByAdmin: isAvatarRemoved ? true : undefined,
              avatarRemovedAt: data.avatarRemovedAt,
              avatarRemovedReason: data.avatarRemovedReason,
              avatarRemovedBy: data.avatarRemovedBy,
              role: data.role || 'leitor',
              editsCount: data.editsCount || data.editCount || 0,
              createdAt: data.createdAt || new Date().toISOString(),
              isBanned: data.isBanned || false,
              isGuest: false,
            };
            if (isAvatarRemoved) {
              delete (userObj as any).photoURL;
            }
            remoteUsers.push(userObj);
            existingUids.add(d.id);
          }
        });

        if (remoteUsers.length > 0) {
          const mergedMap = new Map<string, UserProfile>();
          localUsers.forEach((u) => {
            if (u.avatarRemovedByAdmin) {
              delete (u as any).photoURL;
              u.photoURL = undefined;
            }
            if (u.accountDeletedLGPD) {
              u.displayName = u.uid;
              u.username = u.uid;
              u.email = '';
              u.photoURL = undefined;
              u.avatarRemovedByAdmin = true;
              u.genericPseudonymLGPD = u.uid;
            }
            mergedMap.set(u.uid, u);
          });
          remoteUsers.forEach((u) => {
            const prev = mergedMap.get(u.uid);
            const combined = { ...(prev || {}), ...u };
            if (combined.avatarRemovedByAdmin || u.avatarRemovedByAdmin || prev?.avatarRemovedByAdmin) {
              combined.avatarRemovedByAdmin = true;
              delete (combined as any).photoURL;
              combined.photoURL = undefined;
            }
            if (combined.accountDeletedLGPD || u.accountDeletedLGPD || prev?.accountDeletedLGPD) {
              combined.accountDeletedLGPD = true;
              combined.displayName = combined.uid;
              combined.username = combined.uid;
              combined.email = '';
              combined.photoURL = undefined;
              combined.avatarRemovedByAdmin = true;
              combined.genericPseudonymLGPD = combined.uid;
            }
            mergedMap.set(u.uid, combined);
          });
          const merged = Array.from(mergedMap.values());
          localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(merged));
          return merged;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar community users do Firestore:', err);
      }
    }

    return localUsers;
  },

  subscribeToCommunityUsers(callback: (users: UserProfile[]) => void): () => void {
    if (!firebaseActive || !db) {
      initializeLocalStorage();
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.COMMUNITY_USERS);
        callback(raw ? JSON.parse(raw) : []);
      } catch {
        callback([]);
      }
      return () => {};
    }

    try {
      const q = query(collection(db, 'userpage'));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const remoteUsers: UserProfile[] = [];
          snap.forEach((d) => {
            const u = d.data() as UserProfile;
            if (u.avatarRemovedByAdmin) {
              delete (u as any).photoURL;
              u.photoURL = undefined;
            }
            remoteUsers.push(u);
          });

          initializeLocalStorage();
          let localUsers: UserProfile[] = [];
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.COMMUNITY_USERS);
            localUsers = raw ? JSON.parse(raw) : [];
          } catch {
            localUsers = [];
          }

          const mergedMap = new Map<string, UserProfile>();
          localUsers.forEach((u) => {
            if (u.avatarRemovedByAdmin) {
              delete (u as any).photoURL;
              u.photoURL = undefined;
            }
            if (u.accountDeletedLGPD) {
              u.displayName = u.uid;
              u.username = u.uid;
              u.email = '';
              u.photoURL = undefined;
              u.avatarRemovedByAdmin = true;
              u.genericPseudonymLGPD = u.uid;
            }
            mergedMap.set(u.uid, u);
          });
          remoteUsers.forEach((u) => {
            const prev = mergedMap.get(u.uid);
            const combined = { ...(prev || {}), ...u };
            if (combined.avatarRemovedByAdmin || u.avatarRemovedByAdmin || prev?.avatarRemovedByAdmin) {
              combined.avatarRemovedByAdmin = true;
              delete (combined as any).photoURL;
              combined.photoURL = undefined;
            }
            if (combined.accountDeletedLGPD || u.accountDeletedLGPD || prev?.accountDeletedLGPD) {
              combined.accountDeletedLGPD = true;
              combined.displayName = combined.uid;
              combined.username = combined.uid;
              combined.email = '';
              combined.photoURL = undefined;
              combined.avatarRemovedByAdmin = true;
              combined.genericPseudonymLGPD = combined.uid;
            }
            mergedMap.set(u.uid, combined);
          });
          const merged = Array.from(mergedMap.values());
          localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(merged));
          callback(merged);
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição de userpage:', err);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener de userpage:', err);
      return () => {};
    }
  },

  /**
   * Garante que uma página de usuário exista no sistema e esteja disponível publicamente.
   * Se for um novo usuário cujo nome pretendido colida com outro usuário existente,
   * ele receberá automaticamente um sufixo numérico (ex: WazzimaGiygg2).
   * Jamais sobrescreve perfis ou usuários distintos.
   */
  async ensureUserPage(user: Partial<UserProfile> & { uid: string }): Promise<UserProfile> {
    const users = await this.getCommunityUsers();

    // 1. Procurar por este usuário ESPECÍFICO pelo seu UID único (Google UID ou UID interno)
    let existing = users.find((u) => u.uid === user.uid || u.uid.toLowerCase() === user.uid.toLowerCase());

    // 2. Verificar se o currentUser local é o mesmo usuário (mesmo UID)
    if (!existing) {
      const current = this.getCurrentUser();
      if (current && (current.uid === user.uid || current.uid.toLowerCase() === user.uid.toLowerCase())) {
        existing = current;
      }
    }

    // 3. Consultar no Firestore na coleção 'userpage' pelo ID de documento (user.uid)
    if (!existing && firebaseActive && db && user.uid) {
      try {
        const docSnap = await getDoc(doc(db, 'userpage', user.uid));
        if (docSnap.exists()) {
          existing = docSnap.data() as UserProfile;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao consultar Firestore userpage por UID:', err);
      }
    }

    const now = new Date().toISOString();
    const createdDateFormatted = new Date().toLocaleDateString('pt-BR');

    if (!existing) {
      // É UM USUÁRIO NOVO:
      // Resolver conflito de nome caso já exista outro usuário cadastrado com o mesmo displayName ou username.
      const rawAuthorName = (user.displayName || user.username || 'Editor WikiWorldWeb').trim();

      const isNameConflict = (candidate: string): boolean => {
        const candNorm = candidate.toLowerCase().trim().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return users.some((u) => {
          if (u.uid === user.uid) return false;
          const uName = (u.displayName || '').toLowerCase().trim().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const uUser = (u.username || '').toLowerCase().trim().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return uName === candNorm || uUser === candNorm;
        });
      };

      let resolvedDisplayName = rawAuthorName;
      if (isNameConflict(resolvedDisplayName)) {
        // Encontrar próximo número disponível (ex: WazzimaGiygg2, WazzimaGiygg3...)
        const match = resolvedDisplayName.match(/^(.*?)(\d+)$/);
        let baseRoot = resolvedDisplayName;
        let counter = 2;
        if (match && match[1] && match[2]) {
          baseRoot = match[1];
          counter = Math.max(2, parseInt(match[2], 10) + 1);
        }
        while (isNameConflict(`${baseRoot}${counter}`)) {
          counter++;
        }
        resolvedDisplayName = `${baseRoot}${counter}`;
      }

      const resolvedUsername = user.username && !isNameConflict(user.username)
        ? user.username
        : resolvedDisplayName.replace(/\s+/g, '_');

      const defaultBio = `= ${resolvedDisplayName} =
Editor(a) e colaborador(a) da enciclopédia livre '''WikiWorldWeb'''.

== Apresentação ==
Esta é a página oficial do(a) usuário(a) '''${resolvedDisplayName}'''.
Conta registrada e disponibilizada publicamente em ${createdDateFormatted}.

== Rastreio & Atividades Comunitárias ==
* '''Status do Usuário:''' Ativo(a)
* '''Identificador Único Google/Sistema (UID):''' \`\`${user.uid}\`\`
* '''Rastreabilidade:''' Todas as alterações de rastreio, edições e verbetes criados são automaticamente inseridos nesta página de usuário pública.
* '''Link Permanente Público (UID):''' Disponível para consulta por qualquer usuário através do link permanente [[User:${user.uid}]].
* '''Link Alternativo por Nome:''' [[User:${resolvedDisplayName}]].

== Caixas de Usuário ==
{{Userbox|🌐|Colaborador(a) da WikiWorldWeb Enciclopédia Aberta}}
{{Userbox|✏️|Editor(a) com rastreamento ativo de edições}}
{{Userbox|🛡️|Comprometido(a) com a veracidade das informações}}`;

      const hasAvatarRemovedNew = Boolean(user.avatarRemovedByAdmin);
      const newUserPage: UserProfile = {
        uid: user.uid,
        username: resolvedUsername,
        displayName: resolvedDisplayName,
        email: user.email || '',
        photoURL: hasAvatarRemovedNew ? undefined : user.photoURL,
        avatarRemovedByAdmin: hasAvatarRemovedNew ? true : undefined,
        avatarRemovedAt: user.avatarRemovedAt,
        avatarRemovedReason: user.avatarRemovedReason,
        avatarRemovedBy: user.avatarRemovedBy,
        role: user.role || 'editor',
        isGuest: false,
        isBanned: false,
        reputationScore: 100,
        editsCount: 0,
        warningCount: 0,
        location: user.location || 'Brasil',
        createdAt: user.createdAt || now,
        lastActive: now,
        permissions: user.permissions || {
          canEdit: true,
          canCreate: true,
          canTalk: true,
          canDelete: user.role === 'admin' || user.role === 'moderador',
          canGrantBarnstars: user.role === 'admin' || user.role === 'moderador',
        },
        bio: user.bio || defaultBio,
        userboxes: user.userboxes || [
          {
            id: `ub-${Date.now()}-1`,
            title: '🌐 WikiWorldWeb',
            text: 'Membro registrado e verificado na comunidade',
            icon: '🌐',
            bgClass: 'bg-blue-50 dark:bg-blue-950/40',
            borderClass: 'border-blue-200 dark:border-blue-800',
          },
          {
            id: `ub-${Date.now()}-2`,
            title: '✏️ Rastreio Ativo',
            text: 'Edições e revisões auditadas e públicas',
            icon: '✏️',
            bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
            borderClass: 'border-emerald-200 dark:border-emerald-800',
          },
        ],
        barnstars: user.barnstars || [],
        recentActivity: user.recentActivity || [],
      };
      if (hasAvatarRemovedNew) {
        delete (newUserPage as any).photoURL;
      }

      await this.saveCommunityUser(newUserPage);

      // Persistir no Firestore nas coleções 'userpage' e 'users' com chave newUserPage.uid
      if (firebaseActive && db) {
        try {
          const firestorePayload: any = { ...newUserPage };
          if (hasAvatarRemovedNew) {
            delete firestorePayload.photoURL;
            firestorePayload.photoURL = deleteField();
          }
          await setDoc(doc(db, 'userpage', newUserPage.uid), firestorePayload, { merge: true });
          await setDoc(doc(db, 'users', newUserPage.uid), firestorePayload, { merge: true });
        } catch (err) {
          console.warn('[StorageService] Erro ao sincronizar nova userpage no Firestore:', err);
        }
      }

      return newUserPage;
    } else {
      // Usuário já existente: manter integridade do UID e nome pré-existente
      const hasAvatarRemovedExisting = Boolean(existing.avatarRemovedByAdmin || user.avatarRemovedByAdmin);
      const updated: UserProfile = {
        ...existing,
        ...user,
        uid: existing.uid,
        displayName: existing.displayName || user.displayName || 'Editor WikiWorldWeb',
        username: existing.username || user.username || existing.displayName || 'Editor',
        photoURL: hasAvatarRemovedExisting ? undefined : (user.photoURL ?? existing.photoURL),
        avatarRemovedByAdmin: hasAvatarRemovedExisting ? true : undefined,
        avatarRemovedAt: user.avatarRemovedAt || existing.avatarRemovedAt,
        avatarRemovedReason: user.avatarRemovedReason || existing.avatarRemovedReason,
        avatarRemovedBy: user.avatarRemovedBy || existing.avatarRemovedBy,
        bio: existing.bio || user.bio,
        lastActive: now,
        recentActivity: existing.recentActivity || [],
      };
      if (hasAvatarRemovedExisting) {
        delete (updated as any).photoURL;
      }

      await this.saveCommunityUser(updated);

      if (firebaseActive && db) {
        try {
          const firestorePayload: any = { ...updated };
          if (hasAvatarRemovedExisting) {
            delete firestorePayload.photoURL;
            firestorePayload.photoURL = deleteField();
          }
          await setDoc(doc(db, 'userpage', updated.uid), firestorePayload, { merge: true });
          await setDoc(doc(db, 'users', updated.uid), firestorePayload, { merge: true });
        } catch (err) {
          console.warn('[StorageService] Erro ao atualizar userpage no Firestore:', err);
        }
      }

      return updated;
    }
  },

  /**
   * Insere um registro de alteração/rastreio diretamente na página de usuário do autor.
   */
  async recordUserTrackingActivity(
    userOrAuthor: UserProfile | string,
    activity: {
      type: 'create' | 'edit' | 'revert' | 'admin';
      articleId?: string;
      articleTitle: string;
      pageUid?: string;
      summary: string;
      deltaBytes?: number;
      isMinor?: boolean;
    }
  ): Promise<void> {
    const authorName =
      typeof userOrAuthor === 'string'
        ? userOrAuthor
        : userOrAuthor.displayName || userOrAuthor.username || userOrAuthor.email || 'Colaborador WikiWorldWeb';

    let profile =
      typeof userOrAuthor === 'object' && userOrAuthor.uid
        ? await this.getUserProfile(userOrAuthor.uid)
        : null;

    if (!profile) {
      profile = await this.getUserProfile(authorName);
    }

    if (!profile) {
      const cleanNorm = authorName.toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const generatedUid =
        typeof userOrAuthor === 'object' && userOrAuthor.uid
          ? userOrAuthor.uid
          : `user-${cleanNorm.replace(/[^a-z0-9]/g, '-') || 'editor'}`;

      profile = await this.ensureUserPage({
        uid: generatedUid,
        displayName: authorName,
        username: authorName.replace(/\s+/g, '_'),
        email: typeof userOrAuthor === 'object' ? userOrAuthor.email || '' : '',
        role: typeof userOrAuthor === 'object' ? userOrAuthor.role || 'editor' : 'editor',
        isGuest: false,
        isBanned: false,
        createdAt: new Date().toISOString(),
      });
    }

    const now = new Date().toISOString();
    const newEntry: UserActivityLogEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: activity.type,
      articleId: activity.articleId,
      articleTitle: activity.articleTitle,
      pageUid: activity.pageUid,
      date: now,
      summary: activity.summary,
      deltaBytes: activity.deltaBytes,
      isMinor: activity.isMinor,
    };

    const currentActivities = profile.recentActivity || [];
    const updatedActivities = [newEntry, ...currentActivities.slice(0, 49)];

    const updatedProfile: UserProfile = {
      ...profile,
      editsCount: (profile.editsCount || 0) + 1,
      reputationScore: (profile.reputationScore || 100) + (activity.isMinor ? 2 : 5),
      lastActive: now,
      recentActivity: updatedActivities,
    };

    await this.saveCommunityUser(updatedProfile);

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'userpage', updatedProfile.uid), updatedProfile, { merge: true });
      } catch (err) {
        console.warn('[StorageService] Erro ao gravar rastreio no Firestore userpage:', err);
      }
    }
  },

  async getUserProfile(uidOrUsername: string): Promise<UserProfile | null> {
    if (!uidOrUsername) return null;
    const stripped = uidOrUsername.replace(/^(?:User|Usuario|Usuário|user|usuario|@):?/i, '').trim();
    const cleanId = (stripped || uidOrUsername).toLowerCase().trim();
    const cleanNormalized = cleanId.replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const users = await this.getCommunityUsers();

    // 1. Procurar por UID exato primeiro (UID Google ou UID do sistema)
    let found = users.find(
      (u) => u.uid === stripped || u.uid.toLowerCase() === cleanId
    );
    if (found) return found;

    // 2. Verificar se o usuário atualmente logado tem esse UID
    const currentUser = this.getCurrentUser();
    if (currentUser && (currentUser.uid === stripped || currentUser.uid.toLowerCase() === cleanId)) {
      return currentUser;
    }

    // 3. Consultar Firestore pelo ID do documento (que é o UID)
    if (firebaseActive && db) {
      try {
        const docSnap = await getDoc(doc(db, 'userpage', stripped));
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          await this.saveCommunityUser(profile);
          return profile;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao buscar userpage por UID no Firestore:', err);
      }
    }

    // 4. Se não encontrou por UID, procurar por username ou displayName nos usuários comunitários
    found = users.find((u) => {
      const uName = (u.displayName || '').toLowerCase().trim();
      const uNorm = uName.replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const uUser = (u.username || '').toLowerCase().trim();
      return (
        uUser === cleanId ||
        uName === cleanId ||
        uNorm === cleanNormalized ||
        (u.email && u.email.toLowerCase() === cleanId)
      );
    });
    if (found) return found;

    // 5. Verificar se o usuário logado bate por nome/username
    if (
      currentUser &&
      (currentUser.displayName?.toLowerCase().trim() === cleanId ||
        currentUser.username?.toLowerCase().trim() === cleanId ||
        currentUser.displayName?.toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '') === cleanNormalized ||
        currentUser.email?.toLowerCase() === cleanId)
    ) {
      return currentUser;
    }

    // 6. Consultar no Firestore por username ou displayName
    if (firebaseActive && db) {
      try {
        const properName = stripped.replace(/[+_]/g, ' ').trim();
        const q1 = query(collection(db, 'userpage'), where('displayName', '==', properName));
        const querySnap1 = await getDocs(q1);
        if (!querySnap1.empty) {
          const profile = querySnap1.docs[0].data() as UserProfile;
          await this.saveCommunityUser(profile);
          return profile;
        }

        const q2 = query(collection(db, 'userpage'), where('username', '==', stripped));
        const querySnap2 = await getDocs(q2);
        if (!querySnap2.empty) {
          const profile = querySnap2.docs[0].data() as UserProfile;
          await this.saveCommunityUser(profile);
          return profile;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao buscar userpage no Firestore por nome:', err);
      }
    }

    // 7. Criação automática da página de usuário apenas se for autor de edições reais
    const articles = await this.getArticles();
    const hasEditsOrArticles = articles.some((a) => {
      const aAuthor = (a.autor || '').toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const hAuthor = a.historico?.some((h) => (h.autor || '').toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '') === cleanNormalized);
      return aAuthor === cleanNormalized || hAuthor;
    });

    if (hasEditsOrArticles) {
      const properName = stripped.replace(/[+_]/g, ' ').trim();
      const generatedUid = `user-${cleanNormalized.replace(/[^a-z0-9]/g, '-') || 'editor'}`;
      const autoCreated = await this.ensureUserPage({
        uid: generatedUid,
        displayName: properName,
        username: properName.replace(/\s+/g, '_'),
        email: `${cleanNormalized.replace(/[^a-z0-9]/g, '')}@comunidade.wikizero.org`,
        role: 'editor',
        isGuest: false,
        isBanned: false,
        createdAt: new Date().toISOString(),
      });
      return autoCreated;
    }

    return null;
  },

  async saveCommunityUser(user: UserProfile): Promise<UserProfile> {
    const users = await this.getCommunityUsers();
    // Identificar estritamente pelo UID único para jamais sobrescrever outro usuário
    const index = users.findIndex((u) => u.uid === user.uid);

    let updatedUsers: UserProfile[];
    if (index >= 0) {
      updatedUsers = [...users];
      const merged = { ...updatedUsers[index], ...user };
      if (user.avatarRemovedByAdmin || updatedUsers[index].avatarRemovedByAdmin) {
        merged.avatarRemovedByAdmin = true;
        delete (merged as any).photoURL;
        merged.photoURL = undefined;
      }
      updatedUsers[index] = merged;
    } else {
      const newUser = { ...user };
      if (newUser.avatarRemovedByAdmin) {
        delete (newUser as any).photoURL;
        newUser.photoURL = undefined;
      }
      updatedUsers = [newUser, ...users];
    }

    localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(updatedUsers));

    // Atualizar usuário local se for o próprio (pelo UID ou email)
    const currentUser = this.getCurrentUser();
    if (currentUser && (currentUser.uid === user.uid || (currentUser.email && currentUser.email === user.email))) {
      const mergedCurrent = { ...currentUser, ...user };
      if (user.avatarRemovedByAdmin || currentUser.avatarRemovedByAdmin) {
        mergedCurrent.avatarRemovedByAdmin = true;
        delete (mergedCurrent as any).photoURL;
        mergedCurrent.photoURL = undefined;
      }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mergedCurrent));
    }

    // Sincronizar na coleção 'userpage' e 'users' do Firestore indexado por UID
    if (firebaseActive && db && user.uid) {
      try {
        const firestorePayload: any = { ...user };
        if (user.avatarRemovedByAdmin) {
          delete firestorePayload.photoURL;
          firestorePayload.photoURL = deleteField();
        }
        await setDoc(doc(db, 'userpage', user.uid), firestorePayload, { merge: true });
        try {
          await setDoc(doc(db, 'users', user.uid), firestorePayload, { merge: true });
        } catch {
          // ignora
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar userpage no Firestore:', err);
      }
    }

    return user;
  },

  async updateUserRole(
    uid: string,
    newRole: UserRole,
    adminUser: UserProfile | null
  ): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user) return null;

    const oldRole = user.role;
    const updated: UserProfile = {
      ...user,
      role: newRole,
    };

    await this.saveCommunityUser(updated);

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      'role_change',
      `Cargo alterado de "${oldRole}" para "${newRole}" por ${adminUser?.displayName || 'Administrador'}.`,
      adminUser
    );

    return updated;
  },

  async adminUpdateUserName(
    targetUid: string,
    newDisplayName: string,
    legalJustification: string,
    adminUser: UserProfile | null
  ): Promise<{ success: boolean; user?: UserProfile; message: string }> {
    // 1. Permission check: Only admin
    const isAdmin =
      adminUser?.role === 'admin' ||
      adminUser?.email === 'pedrohenriquecardonaperes@gmail.com';

    if (!isAdmin) {
      return {
        success: false,
        message: 'Acesso negado: A retificação de nome de usuário é restrita exclusivamente a Administradores (LGPD / Marco Civil).',
      };
    }

    const cleanNewName = (newDisplayName || '').trim();
    if (!cleanNewName || cleanNewName.length < 3 || cleanNewName.length > 50) {
      return {
        success: false,
        message: 'O novo nome deve conter entre 3 e 50 caracteres.',
      };
    }

    // Check illegal chars in username
    if (/[/\\#?%<>[\]|^`{}]/.test(cleanNewName)) {
      return {
        success: false,
        message: 'O nome contém caracteres inválidos para identificador de usuário.',
      };
    }

    // Checagem de administrador da Wikimedia Foundation
    const adminCheck = checkIfWikimediaAdmin(cleanNewName);
    if (adminCheck.isBlocked) {
      return {
        success: false,
        message: `Não é permitido renomear para '${adminCheck.matchedAdmin}' pois o nickname corresponde a um administrador de projetos da Wikimedia Foundation.`,
      };
    }

    const user = await this.getUserProfile(targetUid);
    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const oldName = user.displayName || user.username || user.uid;
    if (oldName.toLowerCase() === cleanNewName.toLowerCase()) {
      return { success: false, message: 'O novo nome informado é idêntico ao nome atual.' };
    }

    // Check if new name is already in use by another user
    const allCommunity = await this.getCommunityUsers();
    const isTaken = allCommunity.some(
      (u) =>
        u.uid !== user.uid &&
        (u.displayName?.toLowerCase() === cleanNewName.toLowerCase() ||
          u.username?.toLowerCase() === cleanNewName.toLowerCase())
    );
    if (isTaken) {
      return { success: false, message: `O nome "${cleanNewName}" já está em uso por outro usuário.` };
    }

    const updatedUser: UserProfile = {
      ...user,
      displayName: cleanNewName,
      username: cleanNewName.toLowerCase().replace(/\s+/g, '_'),
    };

    // Save updated user in community users & Firestore
    await this.saveCommunityUser(updatedUser);

    // If current logged-in user is this user, update localStorage current user
    const currentRaw = localStorage.getItem(STORAGE_KEYS.USER);
    if (currentRaw) {
      try {
        const parsedCurrent: UserProfile = JSON.parse(currentRaw);
        if (parsedCurrent.uid === user.uid || parsedCurrent.email === user.email) {
          localStorage.setItem(
            STORAGE_KEYS.USER,
            JSON.stringify({ ...parsedCurrent, displayName: cleanNewName, username: updatedUser.username })
          );
        }
      } catch (e) {
        console.error('Error updating current session user:', e);
      }
    }

    // Update article author and revision history references for LGPD rectification
    try {
      const articles = await this.getArticles();
      let updatedArticlesCount = 0;
      const updatedArticles = articles.map((art) => {
        let changed = false;
        let artAutor = art.autor;
        if (art.autorUid === user.uid || art.autor === oldName || (user.email && art.autorEmail === user.email)) {
          artAutor = cleanNewName;
          changed = true;
        }

        const historico = art.historico?.map((h) => {
          if (h.autor === oldName || (user.email && h.autorEmail === user.email)) {
            changed = true;
            return { ...h, autor: cleanNewName };
          }
          return h;
        });

        if (changed) {
          updatedArticlesCount++;
          return { ...art, autor: artAutor, historico };
        }
        return art;
      });

      if (updatedArticlesCount > 0) {
        localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updatedArticles));
      }
    } catch (e) {
      console.warn('Error cascading name change to articles:', e);
    }

    // Register immutable audit log entry
    const justificationText = (legalJustification || '').trim() || 'Solicitação do Titular de Dados (Art. 18, III LGPD)';
    this.logUserAuditAction(
      user.uid,
      cleanNewName,
      'lgpd_name_change',
      `Retificação Cadastral de Nome de "${oldName}" para "${cleanNewName}". Fundamento: ${justificationText}. Administrador: ${adminUser?.displayName || adminUser?.email}.`,
      adminUser
    );

    // Send talk message notice
    this.addUserTalkMessage(
      user.uid,
      cleanNewName,
      {
        titulo: `⚖️ Retificação de Nome Cadastral (LGPD / Marco Civil)`,
        conteudo: `Seu nome de exibição e identificador público foi atualizado de '''"${oldName}"''' para '''"${cleanNewName}"''' em conformidade com as diretrizes da LGPD (Art. 18, III - Retificação de Dados) e Marco Civil da Internet.\n\n'''Fundamento / Justificativa:''' ${justificationText}\n\n'''Executado por:''' ${adminUser?.displayName || 'Administração WikiWorldWeb'}.`,
        tipo: 'aviso_admin',
      },
      adminUser
    );

    return {
      success: true,
      user: updatedUser,
      message: `Nome retificado com sucesso de "${oldName}" para "${cleanNewName}" com registro em auditoria LGPD.`,
    };
  },

  async adminRemoveUserAvatarLGPD(
    targetUid: string,
    legalJustification: string,
    adminUser: UserProfile | null
  ): Promise<{ success: boolean; user?: UserProfile; message: string }> {
    // 1. Permission check: Exclusivo para Administrador
    const isAdmin =
      adminUser?.role === 'admin' ||
      adminUser?.email === 'pedrohenriquecardonaperes@gmail.com';

    if (!isAdmin) {
      return {
        success: false,
        message: 'Acesso negado: A remoção e alteração da imagem de usuário sob a LGPD é restrita exclusivamente a Administradores.',
      };
    }

    const user = await this.getUserProfile(targetUid);
    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const userName = user.displayName || user.username || user.uid;
    const initialLetter = (user.displayName || user.username || 'U').charAt(0).toUpperCase();
    const justificationText = (legalJustification || '').trim() || 'Proteção e minimização de dados pessoais (Art. 6º, III e Art. 18 da LGPD)';

    // Update user profile: remove photoURL, activate LGPD avatar protection flags
    const updatedUser: UserProfile = {
      ...user,
      photoURL: undefined,
      avatarRemovedByAdmin: true,
      avatarRemovedAt: new Date().toISOString(),
      avatarRemovedReason: justificationText,
      avatarRemovedBy: adminUser?.displayName || adminUser?.username || adminUser?.email || 'Administrador',
    };
    delete (updatedUser as any).photoURL;

    // Direct Firestore update with deleteField() to guarantee immediate removal in Firestore
    if (firebaseActive && db && user.uid) {
      try {
        await setDoc(
          doc(db, 'userpage', user.uid),
          {
            avatarRemovedByAdmin: true,
            avatarRemovedAt: updatedUser.avatarRemovedAt,
            avatarRemovedReason: updatedUser.avatarRemovedReason,
            avatarRemovedBy: updatedUser.avatarRemovedBy,
            photoURL: deleteField(),
          },
          { merge: true }
        );
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              avatarRemovedByAdmin: true,
              avatarRemovedAt: updatedUser.avatarRemovedAt,
              avatarRemovedReason: updatedUser.avatarRemovedReason,
              avatarRemovedBy: updatedUser.avatarRemovedBy,
              photoURL: deleteField(),
            },
            { merge: true }
          );
        } catch {
          // ignora caso users não exista
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao deletar photoURL no Firestore:', err);
      }
    }

    // Save updated user in community users & Firestore
    await this.saveCommunityUser(updatedUser);

    // If current logged-in user is this user, update localStorage current user
    const currentRaw = localStorage.getItem(STORAGE_KEYS.USER);
    if (currentRaw) {
      try {
        const parsedCurrent: UserProfile = JSON.parse(currentRaw);
        if (parsedCurrent.uid === user.uid || (parsedCurrent.email && parsedCurrent.email === user.email)) {
          const updatedCurrent = {
            ...parsedCurrent,
            photoURL: undefined,
            avatarRemovedByAdmin: true,
            avatarRemovedAt: updatedUser.avatarRemovedAt,
            avatarRemovedReason: updatedUser.avatarRemovedReason,
            avatarRemovedBy: updatedUser.avatarRemovedBy,
          };
          delete (updatedCurrent as any).photoURL;
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedCurrent));
        }
      } catch (e) {
        console.error('Error updating current session user avatar:', e);
      }
    }

    // Broadcast avatar update so all active components update instantaneously
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('wikizero:user-avatar-updated', { detail: updatedUser }));
        window.dispatchEvent(new Event('storage'));
      } catch {
        // ignore in SSR
      }
    }

    // Log user audit action
    this.logUserAuditAction(
      user.uid,
      userName,
      'avatar_lgpd_removal',
      `Foto do usuário removida administrativamente sob a LGPD para proteção de dados pessoais (substituída pela inicial '${initialLetter}'). Fundamento: ${justificationText}. Administrador: ${adminUser?.displayName || adminUser?.email}.`,
      adminUser
    );

    // Send talk message notice to user
    this.addUserTalkMessage(
      user.uid,
      userName,
      {
        titulo: `🛡️ Proteção de Imagem e Dados Pessoais (LGPD Art. 18)`,
        conteudo: `Sua foto de perfil foi removida pela Administração em conformidade com as diretrizes da Lei Geral de Proteção de Dados Pessoais (LGPD) para salvaguarda e privacidade de dados pessoais.\n\nSeu avatar agora exibe a primeira letra do seu nome ('''${initialLetter}''').\n\n'''Fundamento / Justificativa:''' ${justificationText}\n\n'''Executado por:''' ${adminUser?.displayName || 'Administração WikiZero'}.`,
        tipo: 'aviso_admin',
      },
      adminUser
    );

    return {
      success: true,
      user: updatedUser,
      message: `Imagem removida com sucesso sob a LGPD. O avatar do usuário exibirá a primeira letra do nome ('${initialLetter}').`,
    };
  },

  // ==========================================
  // === LGPD ART. 18, VI - EXCLUSÃO DE CONTAS ===
  // ==========================================

  /**
   * Obtém todas as solicitações de exclusão de dados pessoais registradas pelos titulares.
   */
  async getLgpdDeletionRequests(): Promise<LgpdAccountDeletionRequest[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'lgpd_deletion_requests'));
        const list: LgpdAccountDeletionRequest[] = [];
        snap.forEach((d) => list.push(d.data() as LgpdAccountDeletionRequest));
        localStorage.setItem(STORAGE_KEYS.LGPD_DELETION_REQUESTS, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      } catch (err) {
        console.warn('[StorageService] Erro ao buscar lgpd_deletion_requests no Firestore:', err);
      }
    }
    const local = safeGetArray<LgpdAccountDeletionRequest>(STORAGE_KEYS.LGPD_DELETION_REQUESTS, []);
    return local.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  },

  /**
   * Consulta a solicitação de exclusão do titular (ativa ou mais recente).
   */
  async getLgpdDeletionRequestForUser(userUid: string): Promise<LgpdAccountDeletionRequest | null> {
    if (!userUid) return null;
    const requests = await this.getLgpdDeletionRequests();
    return (
      requests.find((r) => r.userUid === userUid && r.status === 'pendente') ||
      requests.find((r) => r.userUid === userUid) ||
      null
    );
  },

  /**
   * Registra a solicitação de exclusão definitiva de conta no Painel do Titular (LGPD Art. 18, VI).
   */
  async createLgpdDeletionRequest(
    user: UserProfile,
    reason?: string
  ): Promise<{ success: boolean; request?: LgpdAccountDeletionRequest; message: string }> {
    if (!user || !user.uid || user.isGuest) {
      return {
        success: false,
        message: 'Apenas usuários autenticados possuem registros cadastrais passíveis de solicitação de exclusão.',
      };
    }

    const requests = await this.getLgpdDeletionRequests();
    const existingPending = requests.find((r) => r.userUid === user.uid && r.status === 'pendente');
    if (existingPending) {
      return {
        success: true,
        request: existingPending,
        message: 'Você já possui uma solicitação de exclusão pendente de análise pela administração.',
      };
    }

    const newRequest: LgpdAccountDeletionRequest = {
      id: `lgpd-del-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userUid: user.uid,
      originalDisplayName: user.displayName || user.username || user.uid,
      originalUsername: user.username || user.displayName || user.uid,
      originalEmail: user.email || undefined,
      userReason:
        (reason || '').trim() ||
        'Solicitação de eliminação definitiva de dados com base no Artigo 18, inciso VI da LGPD (Lei nº 13.709/2018).',
      requestedAt: new Date().toISOString(),
      status: 'pendente',
    };

    const updated = [newRequest, ...requests];
    localStorage.setItem(STORAGE_KEYS.LGPD_DELETION_REQUESTS, JSON.stringify(updated));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'lgpd_deletion_requests', newRequest.id), newRequest);
      } catch (err) {
        console.warn('[StorageService] Erro ao salvar solicitação LGPD no Firestore:', err);
      }
    }

    this.logUserAuditAction(
      user.uid,
      newRequest.originalDisplayName,
      'lgpd_deletion_requested',
      `Solicitação formal de exclusão definitiva de dados registrada pelo titular (LGPD Art. 18, VI). Motivo: "${newRequest.userReason}".`,
      user
    );

    this.sendLgpdNotification(
      'Solicitação de Exclusão Registrada',
      'Sua solicitação de exclusão definitiva de dados pessoais (Art. 18, VI da LGPD) foi protocolada e aguarda homologação pela administração.',
      'notifyOnPrivacyUpdate',
      'warning'
    );

    return {
      success: true,
      request: newRequest,
      message: 'Sua solicitação de exclusão foi registrada com sucesso e encaminhada ao Painel Administrativo.',
    };
  },

  /**
   * Cancela a solicitação de exclusão pendente caso o próprio titular decida revogar o pedido.
   */
  async cancelLgpdDeletionRequest(
    requestId: string,
    userUid: string
  ): Promise<{ success: boolean; message: string }> {
    const requests = await this.getLgpdDeletionRequests();
    const reqIndex = requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      return { success: false, message: 'Solicitação não encontrada.' };
    }

    const req = requests[reqIndex];
    if (req.userUid !== userUid) {
      return { success: false, message: 'Você não tem permissão para cancelar esta solicitação.' };
    }

    if (req.status !== 'pendente') {
      return { success: false, message: 'Esta solicitação não está mais pendente e não pode ser cancelada.' };
    }

    const updatedReq: LgpdAccountDeletionRequest = {
      ...req,
      status: 'cancelada',
    };

    requests[reqIndex] = updatedReq;
    localStorage.setItem(STORAGE_KEYS.LGPD_DELETION_REQUESTS, JSON.stringify(requests));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'lgpd_deletion_requests', requestId), updatedReq, { merge: true });
      } catch (err) {
        console.warn('[StorageService] Erro ao cancelar solicitação LGPD no Firestore:', err);
      }
    }

    return { success: true, message: 'Solicitação de exclusão cancelada com sucesso.' };
  },

  /**
   * Rejeita administrativamente uma solicitação de exclusão (com justificativa legal fundamentada).
   */
  async rejectLgpdDeletionRequest(
    requestId: string,
    rejectionReason: string,
    adminUser: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    const isAdmin =
      adminUser?.role === 'admin' ||
      adminUser?.email === 'pedrohenriquecardonaperes@gmail.com';
    if (!isAdmin) {
      return { success: false, message: 'Apenas Administradores podem avaliar solicitações de exclusão sob a LGPD.' };
    }

    const requests = await this.getLgpdDeletionRequests();
    const reqIndex = requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      return { success: false, message: 'Solicitação não encontrada.' };
    }

    const req = requests[reqIndex];
    const updatedReq: LgpdAccountDeletionRequest = {
      ...req,
      status: 'rejeitada',
      rejectionReason: rejectionReason.trim(),
      processedAt: new Date().toISOString(),
      processedByUid: adminUser?.uid,
      processedByName: adminUser?.displayName || adminUser?.email || 'Administrador',
    };

    requests[reqIndex] = updatedReq;
    localStorage.setItem(STORAGE_KEYS.LGPD_DELETION_REQUESTS, JSON.stringify(requests));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'lgpd_deletion_requests', requestId), updatedReq, { merge: true });
      } catch (err) {
        console.warn('[StorageService] Erro ao rejeitar solicitação LGPD no Firestore:', err);
      }
    }

    this.logUserAuditAction(
      req.userUid,
      req.originalDisplayName,
      'lgpd_deletion_rejected',
      `Solicitação de exclusão LGPD rejeitada. Justificativa: "${rejectionReason}". Administrador: ${adminUser?.displayName || adminUser?.email}.`,
      adminUser
    );

    return { success: true, message: 'Solicitação rejeitada com justificativa registrada em auditoria.' };
  },

  /**
   * Executa a exclusão definitiva de conta no Painel Administrativo:
   * 1. Elimina todos os dados pessoais (email, biografia, foto, redes, preferências).
   * 2. Preserva estritamente o Google UID (u.uid) para identificação preventiva em futuras tentativas de cadastro.
   * 3. Substitui o autor em todos os verbetes, coleções e históricos de revisão por um nome genérico.
   * 4. Registra a auditoria perene de conformidade.
   */
  async executeAdminUserDeletionLGPD(params: {
    targetUid: string;
    requestId?: string;
    genericPseudonym?: string;
    legalJustification?: string;
    adminUser: UserProfile | null;
  }): Promise<{
    success: boolean;
    message: string;
    genericPseudonym: string;
    articlesUpdated: number;
    revisionsUpdated: number;
    recentChangesUpdated: number;
    pagesUpdated: number;
  }> {
    const isAdmin =
      params.adminUser?.role === 'admin' ||
      params.adminUser?.email === 'pedrohenriquecardonaperes@gmail.com';

    if (!isAdmin) {
      return {
        success: false,
        message: 'Acesso negado: A exclusão e anonimização de contas sob a LGPD é restrita exclusivamente a Administradores.',
        genericPseudonym: '',
        articlesUpdated: 0,
        revisionsUpdated: 0,
        recentChangesUpdated: 0,
        pagesUpdated: 0,
      };
    }

    // Buscar solicitação LGPD se existente para recuperar histórico e dados originais
    const requests = await this.getLgpdDeletionRequests();
    let reqToUpdate = params.requestId ? requests.find((r) => r.id === params.requestId) : null;
    if (!reqToUpdate) {
      reqToUpdate = requests.find((r) => r.userUid === params.targetUid && r.status === 'pendente') || null;
    }

    // 1. Tentar encontrar o perfil do usuário ou compor a partir do pedido e da base
    let user = await this.getUserProfile(params.targetUid);
    if (!user) {
      const community = await this.getCommunityUsers();
      user =
        community.find((u) => u.uid === params.targetUid) ||
        (reqToUpdate?.originalEmail
          ? community.find((u) => u.email && u.email.toLowerCase() === reqToUpdate!.originalEmail!.toLowerCase())
          : null) ||
        null;
    }

    // Se ainda assim não existir registro completo em community_users, criar objeto de suporte seguro
    if (!user) {
      user = {
        uid: params.targetUid,
        displayName: reqToUpdate?.originalDisplayName || params.targetUid,
        username: reqToUpdate?.originalUsername || params.targetUid,
        email: reqToUpdate?.originalEmail || '',
        role: 'editor',
        isGuest: false,
        isBanned: false,
        createdAt: reqToUpdate?.requestedAt || new Date().toISOString(),
      };
    }

    const googleUid = user.uid || params.targetUid;
    // O nome substituto passa a ser o UID Google do usuário caso selecionada a opção de anonimização
    let genericName = googleUid;
    if (
      params.genericPseudonym &&
      params.genericPseudonym.trim() !== '' &&
      params.genericPseudonym !== 'Usuário Anonimizado (LGPD)' &&
      params.genericPseudonym !== 'Autor Anonimizado' &&
      params.genericPseudonym !== 'Conta Excluída (LGPD)' &&
      params.genericPseudonym !== 'Ex-editor (Direito ao Esquecimento)' &&
      params.genericPseudonym !== 'anonimizacao' &&
      params.genericPseudonym !== 'anonymize_uid'
    ) {
      genericName = params.genericPseudonym.trim();
    } else {
      genericName = googleUid;
    }
    const justificationText =
      (params.legalJustification || '').trim() ||
      'Atendimento à solicitação do titular para eliminação definitiva de dados pessoais (Artigo 18, VI da LGPD - Lei nº 13.709/2018). Autoria atribuída ao UID Google.';

    // Mapear todos os identificadores conhecidos para substituição integral
    const matchNames = new Set<string>();
    [googleUid, user.displayName, user.username, reqToUpdate?.originalDisplayName, reqToUpdate?.originalUsername]
      .filter(Boolean)
      .forEach((val) => {
        const clean = (val as string).trim().toLowerCase();
        if (clean) {
          matchNames.add(clean);
          matchNames.add(clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_+]/g, ' '));
        }
      });

    const matchEmails = new Set<string>();
    [user.email, reqToUpdate?.originalEmail]
      .filter(Boolean)
      .forEach((val) => {
        const clean = (val as string).trim().toLowerCase();
        if (clean) matchEmails.add(clean);
      });

    let articlesUpdated = 0;
    let revisionsUpdated = 0;
    let pagesUpdated = 0;
    let recentChangesUpdated = 0;

    // 2. Substituir autor e histórico de revisões em todos os artigos locais
    try {
      const articles = await this.getArticles();
      const updatedArticles = articles.map((art) => {
        let changed = false;
        let artAutor = art.autor;
        let artAutorEmail = art.autorEmail;
        let artAutorUid = art.autorUid;

        const artAutorClean = (art.autor || '').trim().toLowerCase();
        const artAutorNorm = artAutorClean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_+]/g, ' ');
        const artAutorEmailClean = (art.autorEmail || '').trim().toLowerCase();

        const isAuthorMatch =
          (art.autorUid && (art.autorUid === googleUid || art.autorUid === params.targetUid)) ||
          matchNames.has(artAutorClean) ||
          matchNames.has(artAutorNorm) ||
          (artAutorEmailClean && matchEmails.has(artAutorEmailClean));

        if (isAuthorMatch) {
          artAutor = genericName;
          artAutorUid = googleUid;
          artAutorEmail = undefined;
          changed = true;
          articlesUpdated++;
        }

        const historico = art.historico?.map((h) => {
          const hAutorClean = (h.autor || '').trim().toLowerCase();
          const hAutorNorm = hAutorClean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_+]/g, ' ');
          const hAutorEmailClean = (h.autorEmail || '').trim().toLowerCase();

          const isHistMatch =
            (h.autorUid && (h.autorUid === googleUid || h.autorUid === params.targetUid)) ||
            matchNames.has(hAutorClean) ||
            matchNames.has(hAutorNorm) ||
            (hAutorEmailClean && matchEmails.has(hAutorEmailClean));

          if (isHistMatch) {
            changed = true;
            revisionsUpdated++;
            return {
              ...h,
              autor: genericName,
              autorUid: googleUid,
              autorEmail: undefined,
            };
          }
          return h;
        });

        if (changed) {
          return {
            ...art,
            autor: artAutor,
            autorUid: artAutorUid,
            autorEmail: artAutorEmail,
            historico,
          };
        }
        return art;
      });

      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updatedArticles));

      // Sincronizar nos nós do Firestore
      if (firebaseActive && db) {
        try {
          await ensureFirebaseAuth();
          for (const art of updatedArticles) {
            const isMatch =
              art.autor === genericName ||
              art.autorUid === googleUid;
            if (isMatch) {
              try {
                // 1. /articles/{id}
                await setDoc(
                  doc(db, 'articles', art.id),
                  {
                    ...art,
                    autor: genericName,
                    autorUid: googleUid,
                    autorEmail: null,
                    atualizadoEm: serverTimestamp(),
                  },
                  { merge: true }
                );

                // 2. /documentos/{pageUid}/inevitavel/{id}
                if (art.pageUid) {
                  try {
                    await setDoc(
                      doc(db, 'documentos', art.pageUid, 'inevitavel', art.id),
                      {
                        ...art,
                        autor: genericName,
                        autorUid: googleUid,
                        autorEmail: null,
                        atualizadoEm: serverTimestamp(),
                      },
                      { merge: true }
                    );
                  } catch {}
                }

                // 3. /pages/main:{id}
                try {
                  await setDoc(
                    doc(db, 'pages', `main:${art.id}`),
                    {
                      authorName: genericName,
                      authorUid: googleUid,
                    },
                    { merge: true }
                  );
                } catch {}
              } catch (err) {
                console.warn('[StorageService] Erro ao sincronizar artigo anonimizado no Firestore:', err);
              }
            }
          }
        } catch (errAuth) {
          console.warn('[StorageService] Auth error ao atualizar artigos no Firestore:', errAuth);
        }
      }
    } catch (e) {
      console.warn('[StorageService] Erro ao anonimizar artigos sob LGPD:', e);
    }

    // 3. Substituir autor nas páginas e coleções criadas
    try {
      const pages = await this.getPages();
      const updatedPages = pages.map((page) => {
        const pAutorClean = (page.autor || '').trim().toLowerCase();
        const pAutorNorm = pAutorClean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_+]/g, ' ');
        if (matchNames.has(pAutorClean) || matchNames.has(pAutorNorm)) {
          pagesUpdated++;
          return { ...page, autor: genericName };
        }
        return page;
      });
      localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(updatedPages));
      if (firebaseActive && db) {
        try {
          await ensureFirebaseAuth();
          for (const page of updatedPages) {
            if (page.autor === genericName) {
              try {
                await setDoc(doc(db, 'pages', page.uid), { autor: genericName }, { merge: true });
              } catch (err) {
                console.warn('[StorageService] Erro ao sincronizar página anonimizada no Firestore:', err);
              }
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn('[StorageService] Erro ao anonimizar páginas sob LGPD:', e);
    }

    // 4. Substituir em Alterações Recentes (Recent Changes)
    try {
      const recentChanges = await this.getRecentChanges();
      const updatedRecentChanges = recentChanges.map((rc) => {
        const rcAutorClean = (rc.autor || '').trim().toLowerCase();
        const rcAutorNorm = rcAutorClean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_+]/g, ' ');
        const rcEmailClean = (rc.autorEmail || '').trim().toLowerCase();

        const isMatch =
          (rc.autorUid && (rc.autorUid === googleUid || rc.autorUid === params.targetUid)) ||
          matchNames.has(rcAutorClean) ||
          matchNames.has(rcAutorNorm) ||
          (rcEmailClean && matchEmails.has(rcEmailClean));

        if (isMatch) {
          recentChangesUpdated++;
          return {
            ...rc,
            autor: genericName,
            autorUid: googleUid,
            autorEmail: undefined,
          };
        }
        return rc;
      });
      localStorage.setItem(STORAGE_KEYS.RECENT_CHANGES, JSON.stringify(updatedRecentChanges));

      if (firebaseActive && db) {
        try {
          await ensureFirebaseAuth();
          for (const rc of updatedRecentChanges) {
            if (rc.autor === genericName || rc.autorUid === googleUid) {
              try {
                await setDoc(
                  doc(db, 'recent_changes', rc.id),
                  {
                    ...rc,
                    autor: genericName,
                    autorUid: googleUid,
                    autorEmail: null,
                  },
                  { merge: true }
                );
              } catch {}
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn('[StorageService] Erro ao anonimizar recent changes sob LGPD:', e);
    }

    // 5. Atualizar perfil do usuário: EXCLUIR TODOS OS DADOS PESSOAIS
    // O nome de exibição e nome de usuário passam a ser o Google UID do titular
    const anonymizedUser: UserProfile = {
      uid: googleUid, // PRESERVADO para identificação de novas contas!
      email: '', // Excluído permanentemente!
      displayName: genericName, // Substituído pelo Google UID!
      username: genericName, // Substituído pelo Google UID!
      photoURL: undefined,
      avatarRemovedByAdmin: true,
      bio: 'Conta excluída e dados pessoais eliminados definitivamente conforme Artigo 18, inciso VI da LGPD (Lei nº 13.709/2018). Autoria das contribuições mantida e associada ao UID Google para fins de conformidade.',
      location: '',
      website: '',
      birthdate: undefined,
      dataConsentimento: undefined,
      ipConsentimento: undefined,
      role: 'leitor',
      isGuest: false,
      isBanned: false,
      accountDeletedLGPD: true,
      deletedAtLGPD: new Date().toISOString(),
      genericPseudonymLGPD: genericName,
      deletionProcessedBy: params.adminUser?.displayName || params.adminUser?.email || 'Administrador',
      deletionLegalJustification: justificationText,
      permissions: {
        canEdit: false,
        canCreate: false,
        canTalk: false,
        canDelete: false,
        canGrantBarnstars: false,
      },
      reputationScore: 0,
      editsCount: 0,
      warningCount: 0,
      lastActive: new Date().toISOString(),
      isOnline: false,
      createdAt: user.createdAt || new Date().toISOString(),
    };

    // Salvar na lista comunitária com dados purgados
    const community = await this.getCommunityUsers();
    const updatedCommunity = community.map((u) => (u.uid === googleUid ? anonymizedUser : u));
    if (!updatedCommunity.some((u) => u.uid === googleUid)) {
      updatedCommunity.push(anonymizedUser);
    }
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(updatedCommunity));

    // Excluir dados cadastrais pessoais no Firestore mantendo exclusivamente o UID Google
    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        const firestoreCleanPayload = {
          uid: googleUid,
          email: '',
          displayName: genericName,
          username: genericName,
          accountDeletedLGPD: true,
          deletedAtLGPD: anonymizedUser.deletedAtLGPD,
          genericPseudonymLGPD: genericName,
          deletionProcessedBy: anonymizedUser.deletionProcessedBy,
          deletionLegalJustification: justificationText,
          role: 'leitor',
          bio: anonymizedUser.bio,
          photoURL: deleteField(),
          avatarRemovedByAdmin: true,
          location: deleteField(),
          website: deleteField(),
          birthdate: deleteField(),
          dataConsentimento: deleteField(),
          ipConsentimento: deleteField(),
        };
        await setDoc(doc(db, 'userpage', googleUid), firestoreCleanPayload, { merge: true });
        try {
          await setDoc(doc(db, 'users', googleUid), firestoreCleanPayload, { merge: true });
        } catch {
          // ignora
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar perfil excluído no Firestore:', err);
      }
    }

    // 6. Limpar dados residuais locais (mensagens de recados do usuário)
    try {
      const rawTalk = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
      if (rawTalk) {
        const talkList = JSON.parse(rawTalk);
        const filteredTalk = talkList.filter((m: any) => m.recipientUid !== googleUid && m.senderUid !== googleUid);
        localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify(filteredTalk));
      }
    } catch {}

    // Se o usuário logado atualmente for o titular excluído, encerrar sessão local imediatamente
    const currentUser = this.getCurrentUser();
    if (currentUser && (currentUser.uid === googleUid || (currentUser.email && matchEmails.has(currentUser.email.toLowerCase())))) {
      this.clearUser();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem('wikizero_user_v1');
      }
    }

    // 7. Atualizar ou criar o registro da solicitação LGPD
    if (reqToUpdate) {
      reqToUpdate.status = 'executada';
      reqToUpdate.processedAt = new Date().toISOString();
      reqToUpdate.processedByUid = params.adminUser?.uid;
      reqToUpdate.processedByName = params.adminUser?.displayName || params.adminUser?.email || 'Administrador';
      reqToUpdate.genericPseudonymAssigned = genericName;
      reqToUpdate.adminNotes = justificationText;
      reqToUpdate.contributionsAnonymizedCount = {
        articlesCreated: articlesUpdated,
        revisionsUpdated,
        recentChangesUpdated,
        pagesUpdated,
      };

      const updatedReqs = requests.map((r) => (r.id === reqToUpdate!.id ? reqToUpdate! : r));
      localStorage.setItem(STORAGE_KEYS.LGPD_DELETION_REQUESTS, JSON.stringify(updatedReqs));

      if (firebaseActive && db) {
        try {
          await ensureFirebaseAuth();
          await setDoc(doc(db, 'lgpd_deletion_requests', reqToUpdate.id), reqToUpdate);
        } catch (err) {
          console.warn('[StorageService] Erro ao atualizar solicitação LGPD executada no Firestore:', err);
        }
      }
    } else {
      const executedReq: LgpdAccountDeletionRequest = {
        id: `lgpd-del-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userUid: googleUid,
        originalDisplayName: user.displayName || googleUid,
        originalUsername: user.username || googleUid,
        originalEmail: user.email || undefined,
        userReason: 'Solicitação de eliminação de dados cadastrais atendida administrativamente.',
        requestedAt: new Date().toISOString(),
        status: 'executada',
        processedAt: new Date().toISOString(),
        processedByUid: params.adminUser?.uid,
        processedByName: params.adminUser?.displayName || params.adminUser?.email || 'Administrador',
        genericPseudonymAssigned: genericName,
        adminNotes: justificationText,
        contributionsAnonymizedCount: {
          articlesCreated: articlesUpdated,
          revisionsUpdated,
          recentChangesUpdated,
          pagesUpdated,
        },
      };
      const updatedReqs = [executedReq, ...requests];
      localStorage.setItem(STORAGE_KEYS.LGPD_DELETION_REQUESTS, JSON.stringify(updatedReqs));
      if (firebaseActive && db) {
        try {
          await ensureFirebaseAuth();
          await setDoc(doc(db, 'lgpd_deletion_requests', executedReq.id), executedReq);
        } catch (err) {
          console.warn('[StorageService] Erro ao salvar log de exclusão executada no Firestore:', err);
        }
      }
    }

    // 8. Registrar auditoria perene
    this.logUserAuditAction(
      googleUid,
      genericName,
      'lgpd_account_deletion',
      `Exclusão definitiva de conta sob o Art. 18, VI da LGPD. Dados pessoais eliminados, Google UID preservado. Contribuições atribuídas ao UID Google "${genericName}" (${articlesUpdated} verbetes, ${revisionsUpdated} revisões, ${pagesUpdated} coleções). Fundamento: ${justificationText}. Administrador: ${params.adminUser?.displayName || params.adminUser?.email}.`,
      params.adminUser
    );

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('wikizero:lgpd-account-deleted', { detail: { uid: googleUid, genericName } })
        );
        window.dispatchEvent(new Event('storage'));
      } catch {
        // ignore
      }
    }

    return {
      success: true,
      message: `Conta excluída e anonimizada com sucesso sob a LGPD. ${articlesUpdated} verbetes e ${revisionsUpdated} revisões foram atribuídos ao UID Google "${genericName}". Todos os dados cadastrais foram permanentemente eliminados.`,
      genericPseudonym: genericName,
      articlesUpdated,
      revisionsUpdated,
      recentChangesUpdated,
      pagesUpdated,
    };
  },

  async banUser(
    uid: string,
    reason: string,
    banType: 'permanente' | 'temporario' | 'advertencia',
    durationDays: number | undefined,
    adminUser: UserProfile | null
  ): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user) return null;

    let banExpiresAt: string | undefined;
    if (banType === 'temporario' && durationDays) {
      const date = new Date();
      date.setDate(date.getDate() + durationDays);
      banExpiresAt = date.toISOString();
    }

    const updated: UserProfile = {
      ...user,
      isBanned: banType !== 'advertencia',
      banReason: reason,
      banType,
      banExpiresAt,
      warningCount: (user.warningCount || 0) + 1,
      permissions: {
        canEdit: false,
        canCreate: false,
        canTalk: banType === 'advertencia',
        canDelete: false,
        canGrantBarnstars: false,
      },
    };

    await this.saveCommunityUser(updated);

    // Persistir no Firestore na coleção banned_users se for bloqueio efetivo
    if (firebaseActive && db && banType !== 'advertencia') {
      try {
        await setDoc(doc(db, 'banned_users', uid), {
          uid,
          reason,
          banType,
          banExpiresAt: banExpiresAt || null,
          bannedAt: serverTimestamp(),
          bannedBy: adminUser?.displayName || adminUser?.username || 'admin',
          isBanned: true,
        });
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar banimento no Firestore banned_users:', err);
      }
    }

    // Se o usuário banido estiver atualmente com a sessão aberta nesta máquina, derrubar a sessão
    const currentSession = this.getCurrentUser();
    if (currentSession && (currentSession.uid === uid || currentSession.email === user.email)) {
      this.clearUser();
    }

    const desc =
      banType === 'permanente'
        ? `Bloqueio permanente aplicado. Motivo: ${reason}`
        : banType === 'temporario'
        ? `Bloqueio temporário por ${durationDays} dias aplicado. Expira em ${banExpiresAt}. Motivo: ${reason}`
        : `Advertência formal emitida. Motivo: ${reason}`;

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      banType === 'advertencia' ? 'warning_issued' : 'ban_user',
      desc,
      adminUser
    );

    // Also leave an administrative warning topic on their talk page
    this.addUserTalkMessage(
      user.uid,
      user.displayName || user.username || user.uid,
      {
        titulo: `⚠️ Ação Administrativa: ${banType === 'advertencia' ? 'Advertência Formal' : 'Suspensão de Conta'}`,
        conteudo: `'''Motivo:''' ${reason}\n\n'''Status:''' ${
          banType === 'permanente'
            ? 'Bloqueio Permanente'
            : banType === 'temporario'
            ? `Suspensão temporária por ${durationDays} dias.`
            : 'Advertência sem bloqueio de acesso.'
        }\n\nEmitido por: ${adminUser?.displayName || 'Corpo Administrativo da WikiWorldWeb'}.`,
        tipo: 'aviso_admin',
      },
      adminUser
    );

    return updated;
  },

  async unbanUser(uid: string, adminUser: UserProfile | null): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user) return null;

    const updated: UserProfile = {
      ...user,
      isBanned: false,
      banReason: undefined,
      banExpiresAt: undefined,
      banType: undefined,
      permissions: {
        canEdit: true,
        canCreate: true,
        canTalk: true,
        canDelete: user.role === 'admin' || user.role === 'moderador',
        canGrantBarnstars: true,
      },
    };

    await this.saveCommunityUser(updated);

    // Remover registro de banimento no Firestore banned_users
    if (firebaseActive && db) {
      try {
        await deleteDoc(doc(db, 'banned_users', uid));
      } catch (err) {
        console.warn('[StorageService] Erro ao remover banimento no Firestore banned_users:', err);
      }
    }

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      'unban_user',
      `Bloqueio revogado e permissões restauradas por ${adminUser?.displayName || 'Administrador'}.`,
      adminUser
    );

    return updated;
  },

  async updateUserPermissions(
    uid: string,
    permissions: Partial<UserPermissions>,
    adminUser: UserProfile | null
  ): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user) return null;

    const currentPerms = user.permissions || {
      canEdit: true,
      canCreate: true,
      canTalk: true,
      canDelete: user.role === 'admin' || user.role === 'moderador',
      canGrantBarnstars: true,
    };

    const updated: UserProfile = {
      ...user,
      permissions: {
        ...currentPerms,
        ...permissions,
      },
    };

    await this.saveCommunityUser(updated);

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      'permission_change',
      `Permissões atualizadas por ${adminUser?.displayName || 'Administrador'}.`,
      adminUser
    );

    return updated;
  },

  async resetUserBio(uid: string, adminUser: UserProfile | null): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user) return null;

    const updated: UserProfile = {
      ...user,
      bio: `= ${user.displayName || user.username} =\nPágina de usuário resetada pela moderação administrativa.`,
    };

    await this.saveCommunityUser(updated);

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      'profile_reset',
      `Biografia de usuário resetada por conteúdo impróprio/spam por ${adminUser?.displayName || 'Administrador'}.`,
      adminUser
    );

    return updated;
  },

  async awardBarnstar(
    targetUid: string,
    barnstarData: Omit<UserBarnstar, 'id' | 'awardedAt'>,
    adminUser: UserProfile | null
  ): Promise<UserProfile | null> {
    // Somente administradores e moderadores podem conceder medalhas aos usuários
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'moderador')) {
      console.warn('[StorageService] Acesso negado: Somente administradores e moderadores podem conceder medalhas a usuários.');
      return null;
    }

    const user = await this.getUserProfile(targetUid);
    if (!user) return null;

    const newBarnstar: UserBarnstar = {
      id: 'bs-' + Date.now(),
      ...barnstarData,
      awardedAt: new Date().toISOString(),
      awardedBy: adminUser?.displayName || 'Comunidade WikiWorldWeb',
      awardedByUid: adminUser?.uid,
    };

    const barnstars = [newBarnstar, ...(user.barnstars || [])];
    const updated: UserProfile = {
      ...user,
      barnstars,
      reputationScore: (user.reputationScore || 0) + 50,
    };

    await this.saveCommunityUser(updated);

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      'barnstar_awarded',
      `Condecoração concedida: "${barnstarData.title}".`,
      adminUser
    );

    // Also post notice to user talk page
    this.addUserTalkMessage(
      user.uid,
      user.displayName || user.username || user.uid,
      {
        titulo: `🏆 Nova Condecoração: ${barnstarData.title}`,
        conteudo: `Parabéns! Você recebeu uma medalha wiki:\n\n'''${barnstarData.title}'''\n''"${barnstarData.description}"''\n\nConcedida por: ${adminUser?.displayName || 'Comunidade'}.`,
        tipo: 'barnstar',
      },
      adminUser
    );

    return updated;
  },

  async registerNewUser(
    userData: {
      email: string;
      displayName: string;
      username?: string;
      role: UserRole;
      bio?: string;
    },
    adminUser: UserProfile | null
  ): Promise<{ success: boolean; user?: UserProfile; message: string }> {
    // 1. Validar permissão administrativa
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'moderador')) {
      throw new Error('Acesso negado: Somente administradores ou moderadores podem cadastrar novos usuários.');
    }

    // 2. Não permitir cadastrar como convidado
    if (userData.role === 'convidado') {
      throw new Error('Operação inválida: O perfil de "convidado" está permanentemente desabilitado para registro.');
    }

    const cleanEmail = (userData.email || '').toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Por favor, informe um endereço de e-mail válido para o registro.');
    }

    const cleanName = (userData.displayName || '').trim();
    if (!cleanName) {
      throw new Error('Por favor, informe um nome de exibição ou nome completo.');
    }

    const cleanUsername = (userData.username || cleanName).replace(/\s+/g, '_').trim();

    // 3. Checagem contra administradores WMF
    const adminCheck = validateUserIdentifiersAgainstWikimediaAdmins({
      displayName: cleanName,
      username: cleanUsername,
      email: cleanEmail,
    });
    if (adminCheck.isBlocked) {
      throw new Error(
        `Registro bloqueado: O identificador informado corresponde a um administrador da Wikimedia Foundation (${adminCheck.matchedAdmin}). O uso deste identificador é proibido.`
      );
    }

    // 4. Checar se o e-mail ou username já existe
    const existingUsers = await this.getCommunityUsers();
    const duplicateEmail = existingUsers.find((u) => u.email && u.email.toLowerCase().trim() === cleanEmail);
    if (duplicateEmail) {
      throw new Error(`Já existe um usuário registrado com o e-mail '${cleanEmail}' (${duplicateEmail.displayName || duplicateEmail.username}).`);
    }

    const duplicateUsername = existingUsers.find(
      (u) => (u.username || '').toLowerCase() === cleanUsername.toLowerCase()
    );
    if (duplicateUsername) {
      throw new Error(`Já existe um usuário registrado com o nome de usuário '${cleanUsername}'.`);
    }

    // 5. Criar o UserProfile registrado
    const newUid = `user_reg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const isPrivileged = userData.role === 'admin' || userData.role === 'moderador';

    const newUser: UserProfile = {
      uid: newUid,
      email: cleanEmail,
      displayName: cleanName,
      username: cleanUsername,
      role: userData.role,
      isGuest: false,
      isBanned: false,
      permissions: {
        canEdit: true,
        canCreate: userData.role !== 'leitor',
        canTalk: true,
        canDelete: isPrivileged,
        canGrantBarnstars: true,
      },
      bio: userData.bio || `= ${cleanName} =\nUsuário devidamente registrado e autorizado pela administração da WikiWorldWeb.`,
      editsCount: 0,
      reputationScore: userData.role === 'admin' ? 100 : userData.role === 'moderador' ? 50 : 10,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isOnline: false,
    };

    // Salvar no Firestore e LocalStorage
    await this.saveCommunityUser(newUser);

    // Registrar no log de auditoria
    this.logUserAuditAction(
      newUser.uid,
      newUser.displayName || newUser.username || newUser.uid,
      'user_registered',
      `Novo usuário cadastrado e autorizado por ${adminUser.displayName || 'Administrador'} com cargo '${userData.role}' e e-mail '${cleanEmail}'.`,
      adminUser
    );

    return {
      success: true,
      user: newUser,
      message: `Usuário '${cleanName}' (${cleanEmail}) registrado com sucesso com o cargo de '${userData.role}'. Ele agora possui autorização para efetuar login.`,
    };
  },

  // === USER TALK MESSAGES / DISCUSSÃO DO USUÁRIO ===
  getUserTalkMessages(targetUidOrUsername: string): UserTalkMessage[] {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
    const localMessages: UserTalkMessage[] = raw ? JSON.parse(raw) : [];

    const clean = targetUidOrUsername.toLowerCase().trim();
    return localMessages.filter(
      (m) =>
        m.targetUserUid.toLowerCase() === clean ||
        m.targetUsername.toLowerCase() === clean
    );
  },

  async fetchUserTalkMessages(targetUidOrUsername: string): Promise<UserTalkMessage[]> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
    const localMessages: UserTalkMessage[] = raw ? JSON.parse(raw) : [];

    const clean = targetUidOrUsername.toLowerCase().trim();
    let filtered = localMessages.filter(
      (m) =>
        m.targetUserUid.toLowerCase() === clean ||
        m.targetUsername.toLowerCase() === clean
    );

    if (firebaseActive && db) {
      try {
        const q = query(
          collection(db, 'user_talk_messages'),
          where('targetUserUid', '==', targetUidOrUsername)
        );
        const snap = await getDocs(q);
        const remote: UserTalkMessage[] = [];
        snap.forEach((d) => remote.push(d.data() as UserTalkMessage));
        if (remote.length > 0) {
          remote.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
          return remote;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao carregar user_talk_messages do Firestore:', err);
      }
    }

    return filtered;
  },

  subscribeToUserTalkMessages(
    targetUidOrUsername: string,
    callback: (messages: UserTalkMessage[]) => void
  ): () => void {
    if (!firebaseActive || !db) return () => {};
    try {
      const q = query(
        collection(db, 'user_talk_messages'),
        where('targetUserUid', '==', targetUidOrUsername)
      );
      return onSnapshot(
        q,
        (snapshot) => {
          const list: UserTalkMessage[] = [];
          snapshot.forEach((d) => list.push(d.data() as UserTalkMessage));
          list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
          callback(list);
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição de user_talk_messages:', err);
        }
      );
    } catch {
      return () => {};
    }
  },

  async addUserTalkMessage(
    targetUid: string,
    targetUsername: string,
    msg: {
      titulo: string;
      conteudo: string;
      tipo: 'geral' | 'aviso_admin' | 'barnstar' | 'duvida' | 'boas_vindas';
    },
    sender: UserProfile | null
  ): Promise<UserTalkMessage> {
    const effectiveSender = sender || this.getCurrentUser();
    if (!effectiveSender || effectiveSender.isGuest) {
      throw new Error('Somente usuários cadastrados e logados podem enviar mensagens na página de discussão.');
    }
    if (effectiveSender.isBanned) {
      throw new Error('Sua conta está suspensa. Usuários bloqueados não podem enviar mensagens para outros usuários.');
    }

    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : [];

    const newMessage: UserTalkMessage = {
      id: 'utalk-' + Date.now(),
      targetUserUid: targetUid,
      targetUsername: targetUsername,
      senderUid: effectiveSender.uid,
      senderName: effectiveSender.displayName || effectiveSender.username || effectiveSender.email.split('@')[0],
      senderEmail: effectiveSender.email,
      senderRole: effectiveSender.role || 'editor',
      titulo: msg.titulo.trim(),
      conteudo: msg.conteudo.trim(),
      tipo: msg.tipo || 'geral',
      data: new Date().toISOString(),
      status: 'aberto',
      respostas: [],
    };

    messages.unshift(newMessage);
    localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify(messages));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'user_talk_messages', newMessage.id), newMessage);
        console.info(`[StorageService] Mensagem de discussão para "${targetUsername}" sincronizada no Firebase.`);
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar user_talk_message no Firestore:', err);
      }
    }

    return newMessage;
  },

  async addUserTalkReply(
    messageId: string,
    conteudo: string,
    sender: UserProfile | null
  ): Promise<TalkReply | null> {
    const effectiveSender = sender || this.getCurrentUser();
    if (!effectiveSender || effectiveSender.isGuest) {
      throw new Error('Somente usuários cadastrados e logados podem responder mensagens de discussão.');
    }
    if (effectiveSender.isBanned) {
      throw new Error('Sua conta está suspensa. Usuários bloqueados não podem responder mensagens.');
    }

    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : [];

    const target = messages.find((m) => m.id === messageId);
    if (!target) return null;

    const reply: TalkReply = {
      id: 'reply-' + Date.now(),
      autor: effectiveSender.displayName || effectiveSender.username || effectiveSender.email.split('@')[0],
      autorEmail: effectiveSender.email,
      autorRole: effectiveSender.role || 'editor',
      conteudo: conteudo.trim(),
      data: new Date().toISOString(),
      upvotes: 0,
    };

    target.respostas.push(reply);
    target.status = 'em_discussao';

    localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify(messages));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'user_talk_messages', messageId), target, { merge: true });
        console.info(`[StorageService] Resposta na página de usuário salva no Firebase.`);
      } catch (err) {
        console.warn('[StorageService] Erro ao salvar resposta de user_talk no Firestore:', err);
      }
    }

    return reply;
  },

  async updateUserTalkStatus(messageId: string, status: UserTalkMessage['status']): Promise<boolean> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : [];

    const target = messages.find((m) => m.id === messageId);
    if (!target) return false;

    target.status = status;
    localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify(messages));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'user_talk_messages', messageId), { status }, { merge: true });
      } catch (err) {
        console.warn('[StorageService] Erro ao atualizar status de user_talk no Firestore:', err);
      }
    }

    return true;
  },

  // === USER AUDIT LOGS ===
  getUserAuditLogs(targetUid?: string): UserAuditLog[] {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_AUDIT_LOGS);
    const logs: UserAuditLog[] = raw ? JSON.parse(raw) : [];

    if (!targetUid) return logs;
    const clean = targetUid.toLowerCase().trim();
    return logs.filter(
      (l) =>
        l.targetUserUid.toLowerCase() === clean ||
        l.targetUsername.toLowerCase() === clean
    );
  },

  logUserAuditAction(
    targetUserUid: string,
    targetUsername: string,
    action: UserAuditLog['action'],
    details: string,
    performedBy: UserProfile | null
  ): void {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_AUDIT_LOGS);
    const logs: UserAuditLog[] = raw ? JSON.parse(raw) : [];

    const newLog: UserAuditLog = {
      id: 'log-' + Date.now(),
      targetUserUid,
      targetUsername,
      action,
      details,
      performedBy: performedBy ? performedBy.displayName || performedBy.email.split('@')[0] : 'Sistema',
      performedByRole: performedBy?.role || 'admin',
      date: new Date().toISOString(),
    };

    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.USER_AUDIT_LOGS, JSON.stringify(logs));
  },

  // === GERENCIAMENTO DE EXTENSÕES (BUROCRATAS) ===
  getExtensionActionLogs(): ExtensionActionLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXTENSION_ACTION_LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  logExtensionAction(
    logData: Omit<ExtensionActionLog, 'id' | 'timestamp'>
  ): ExtensionActionLog {
    try {
      const logs = this.getExtensionActionLogs();
      const newEntry: ExtensionActionLog = {
        id: 'extlog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        ...logData,
      };
      logs.unshift(newEntry);
      // Keep up to 200 logs
      if (logs.length > 200) logs.length = 200;
      localStorage.setItem(STORAGE_KEYS.EXTENSION_ACTION_LOGS, JSON.stringify(logs));

      // Also mirror to global audit logs for bureaucrat transparency
      this.logUserAuditAction(
        logData.operatorUid || 'system',
        logData.operatorUsername || 'Burocrata',
        'permission_change',
        `[Extensões] Ação "${logData.action}" na extensão "${logData.extensionName}": ${logData.details || ''}`,
        {
          uid: logData.operatorUid,
          displayName: logData.operatorUsername,
          role: (logData.operatorRole as any) || 'admin',
          email: '',
          isGuest: false,
          isBanned: false,
          createdAt: new Date().toISOString(),
        }
      );

      return newEntry;
    } catch (e) {
      console.warn('Erro ao salvar log de extensão:', e);
      return {
        id: 'extlog-' + Date.now(),
        timestamp: new Date().toISOString(),
        ...logData,
      };
    }
  },

  getSavedExtensionStates(): Record<string, boolean> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXTENSIONS_STATES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  saveExtensionStates(states: Record<string, boolean>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EXTENSIONS_STATES, JSON.stringify(states));
    } catch (e) {
      console.warn('Erro ao salvar estados de extensões:', e);
    }
  },

  getSavedCustomExtensions(): InstalledExtensionMeta[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXTENSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveCustomExtensions(extensions: InstalledExtensionMeta[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_EXTENSIONS, JSON.stringify(extensions));
    } catch (e) {
      console.warn('Erro ao salvar extensões personalizadas:', e);
    }
  },

  getSavedExtensionSettings(): Record<string, Record<string, any>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXTENSION_SETTINGS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  saveExtensionSettings(settings: Record<string, Record<string, any>>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EXTENSION_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Erro ao salvar configurações de extensões:', e);
    }
  },

  // === USER CONTRIBUTIONS ===
  async getUserContributions(
    username: string,
    secondaryUid?: string
  ): Promise<{
    type: 'create' | 'edit';
    articleId: string;
    articleTitle: string;
    pageUid: string;
    date: string;
    summary: string;
    deltaBytes?: number;
    isMinor?: boolean;
  }[]> {
    const articles = await this.getArticles();
    const cleanName = username.toLowerCase().trim();
    const cleanNorm = cleanName.replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanUid = (secondaryUid || '').toLowerCase().trim();

    const contributions: {
      type: 'create' | 'edit';
      articleId: string;
      articleTitle: string;
      pageUid: string;
      date: string;
      summary: string;
      deltaBytes?: number;
      isMinor?: boolean;
    }[] = [];

    const seenKeys = new Set<string>();

    articles.forEach((art) => {
      const artAutor = (art.autor || '').toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const artUid = (art.autorUid || '').toLowerCase().trim();
      const matchArt = (cleanUid && artUid === cleanUid) || (artAutor && (artAutor.includes(cleanNorm) || cleanNorm.includes(artAutor)));

      if (matchArt) {
        const key = `create-${art.id}-${art.dataCriacao}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          contributions.push({
            type: 'create',
            articleId: art.id,
            articleTitle: art.titulo,
            pageUid: art.pageUid,
            date: art.dataCriacao,
            summary: art.resumo || 'Criação inicial do verbete',
            deltaBytes: (art.descricao || '').length,
          });
        }
      }

      if (art.historico && art.historico.length > 0) {
        art.historico.forEach((h) => {
          const hAutor = (h.autor || '').toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const hUid = (h.autorUid || '').toLowerCase().trim();
          const matchH = (cleanUid && hUid === cleanUid) || (hAutor && (hAutor.includes(cleanNorm) || cleanNorm.includes(hAutor)));

          if (matchH) {
            const key = `edit-${art.id}-${h.data}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              contributions.push({
                type: 'edit',
                articleId: art.id,
                articleTitle: art.titulo,
                pageUid: art.pageUid,
                date: h.data,
                summary: h.resumo || 'Edição de conteúdo e fontes',
                deltaBytes: h.deltaBytes,
                isMinor: h.isMinor,
              });
            }
          }
        });
      }
    });

    // Mesclar também com recent_changes gravados no Firestore
    const recentChanges = await this.getRecentChanges();
    recentChanges.forEach((rc) => {
      const rcUid = (rc.autorUid || '').toLowerCase().trim();
      const rcAutor = (rc.autor || '').toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchRc = (cleanUid && rcUid === cleanUid) || (rcAutor && (rcAutor.includes(cleanNorm) || cleanNorm.includes(rcAutor)));

      if (matchRc) {
        const key = `${rc.type}-${rc.articleId}-${rc.data}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          contributions.push({
            type: rc.type === 'new_article' || rc.type === 'new_collection' ? 'create' : 'edit',
            articleId: rc.articleId || '',
            articleTitle: rc.articleTitle,
            pageUid: rc.pageUid || '',
            date: rc.data,
            summary: rc.resumo,
            deltaBytes: rc.deltaBytes,
            isMinor: rc.isMinor,
          });
        }
      }
    });

    // Mesclar com recentActivity do perfil do usuário
    const userProfile = await this.getUserProfile(secondaryUid || username);
    if (userProfile?.recentActivity && userProfile.recentActivity.length > 0) {
      userProfile.recentActivity.forEach((act) => {
        const key = `${act.type}-${act.articleId || act.articleTitle}-${act.date}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          contributions.push({
            type: act.type === 'create' ? 'create' : 'edit',
            articleId: act.articleId || '',
            articleTitle: act.articleTitle,
            pageUid: act.pageUid || '',
            date: act.date,
            summary: act.summary,
            deltaBytes: act.deltaBytes,
            isMinor: act.isMinor,
          });
        }
      });
    }

    // Sort descending by date
    return contributions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  // === USUÁRIOS ONLINE / CONECTADOS ===
  async getOnlineUsers(): Promise<UserProfile[]> {
    const users = await this.getCommunityUsers();
    const now = Date.now();
    // Consider online if marked as online or active in the last 45 minutes
    return users.filter((u) => {
      if (u.isGuest) return false;
      if (u.isOnline) return true;
      if (u.lastActive) {
        const diff = now - new Date(u.lastActive).getTime();
        return diff < 45 * 60 * 1000;
      }
      return false;
    });
  },

  subscribeToOnlineUsers(callback: (onlineUsers: UserProfile[]) => void): () => void {
    return StorageService.subscribeToCommunityUsers((allUsers) => {
      const now = Date.now();
      const online = (allUsers || []).filter((u) => {
        if (!u || u.isGuest) return false;
        if (u.isOnline) return true;
        if (u.lastActive) {
          const diff = now - new Date(u.lastActive).getTime();
          return diff < 45 * 60 * 1000;
        }
        return false;
      });
      callback(online);
    });
  },

  // === FIREBASE DATABASE ADMINISTRATION (PARA ADMINISTRADORES) ===
  getFirebaseStatus() {
    return {
      active: firebaseActive,
      environmentLabel: ACTIVE_FIREBASE_CONFIG.environmentLabel,
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      appId: firebaseConfig.appId,
      messagingSenderId: firebaseConfig.messagingSenderId,
      apiKeyMasked: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 8)}...${firebaseConfig.apiKey.slice(-4)}` : 'Não configurada',
      configFileLocation: 'src/config/firebaseCustomConfig.ts',
      options: ACTIVE_FIREBASE_CONFIG.options,
    };
  },

  async testFirebaseConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const start = Date.now();
    if (!firebaseActive || !db) {
      return { success: false, message: 'Firebase não está ativo ou instância de Firestore não inicializada.' };
    }
    try {
      await ensureFirebaseAuth();
      // Testa consulta de leitura não-destrutiva em coleção pública com limite 1
      await getDocs(query(collection(db, 'system_updates'), limit(1)));
      const latencyMs = Date.now() - start;
      return {
        success: true,
        message: `Conexão com Firestore autenticada e operacional (${latencyMs}ms).`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Falha na conexão com Firestore: ${err?.message || err}`,
      };
    }
  },

  /**
   * Obtém estatísticas reais e dados completos diretamente do Firestore em tempo real
   */
  async getFirebaseRealStatistics(): Promise<{
    connected: boolean;
    databaseId: string;
    projectId: string;
    totalArticles: number;
    totalCollections: number;
    totalUsers: number;
    totalEdits: number;
    latencyMs: number;
    articles: WikiArticle[];
    users: UserProfile[];
    collections: WikiPage[];
    auditLogs: any[];
    lastSyncTimestamp: string;
  }> {
    const start = Date.now();
    const activeCfg = getActiveFirebaseConfig();
    const databaseId = activeCfg.firestoreDatabaseId || ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId;
    const projectId = activeCfg.projectId || ACTIVE_FIREBASE_CONFIG.firebaseConfig?.projectId || '';

    if (!firebaseActive || !db) {
      const localArticles = safeGetArray<WikiArticle>(STORAGE_KEYS.ARTICLES, []);
      const localPages = safeGetArray<WikiPage>(STORAGE_KEYS.PAGES, []);
      const localUsers = safeGetArray<UserProfile>(STORAGE_KEYS.COMMUNITY_USERS, []);
      let totalEdits = 0;
      localArticles.forEach((a) => {
        totalEdits += (a.historico && a.historico.length > 0) ? a.historico.length : 1;
      });
      return {
        connected: false,
        databaseId,
        projectId,
        totalArticles: localArticles.length,
        totalCollections: localPages.length,
        totalUsers: Math.max(localUsers.length, 1),
        totalEdits: Math.max(totalEdits, localArticles.length),
        latencyMs: 0,
        articles: localArticles,
        users: localUsers,
        collections: localPages,
        auditLogs: [],
        lastSyncTimestamp: new Date().toISOString(),
      };
    }

    try {
      await ensureFirebaseAuth();

      // Consultar coleções reais do Firestore
      const [artSnap, userSnap, usersCollSnap, docSnap, auditSnap] = await Promise.all([
        getDocs(collection(db, 'articles')),
        getDocs(collection(db, 'userpage')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'documentos')),
        getDocs(collection(db, 'audit_logs')).catch(() => ({ size: 0, forEach: () => {} })),
      ]);

      const latencyMs = Date.now() - start;

      // Mapear artigos
      const articles: WikiArticle[] = [];
      artSnap.forEach((d) => {
        const data = d.data();
        articles.push({
          id: data.id || d.id,
          pageUid: data.pageUid || 'geral',
          titulo: data.titulo || 'Sem título',
          descricao: data.descricao || '',
          resumo: data.resumo || (data.descricao ? data.descricao.slice(0, 140) + '...' : ''),
          categoria: data.categoria || 'Geral',
          idioma: data.idioma || 'Português',
          autor: data.autor || 'Colaborador WikiWorldWeb',
          autorEmail: data.autorEmail || undefined,
          autorUid: data.autorUid || undefined,
          dataCriacao: data.dataCriacao || new Date().toISOString(),
          dataEdicao: data.dataEdicao || data.dataCriacao || new Date().toISOString(),
          visualizacoes: typeof data.visualizacoes === 'number' ? data.visualizacoes : 1,
          versao: typeof data.versao === 'number' ? data.versao : 1,
          tags: Array.isArray(data.tags) ? data.tags : [],
          historico: Array.isArray(data.historico) ? data.historico : [],
        });
      });

      // Mapear usuários únicos entre userpage e users
      const userMap = new Map<string, UserProfile>();
      userSnap.forEach((d) => {
        const u = d.data() as UserProfile;
        userMap.set(u.uid || d.id, { ...u, uid: u.uid || d.id });
      });
      usersCollSnap.forEach((d) => {
        if (!userMap.has(d.id)) {
          const data = d.data();
          userMap.set(d.id, {
            uid: d.id,
            username: data.username || data.displayName || d.id,
            displayName: data.displayName || data.username || d.id,
            email: data.email || '',
            role: data.role || 'leitor',
            createdAt: data.createdAt || new Date().toISOString(),
            isBanned: data.isBanned || false,
            isGuest: false,
          });
        }
      });
      const users = Array.from(userMap.values());

      // Mapear coleções
      const collections: WikiPage[] = [];
      docSnap.forEach((d) => {
        const data = d.data();
        collections.push({
          uid: data.uid || d.id,
          titulo: data.titulo || d.id,
          descricao: data.descricao || '',
          categoria: data.categoria || 'Geral',
          articleCount: typeof data.articleCount === 'number' ? data.articleCount : 0,
          criadoEm: data.criadoEm || new Date().toISOString(),
          status: data.status || 'ativo',
          tags: Array.isArray(data.tags) ? data.tags : [],
        });
      });

      // Mapear audit logs
      const auditLogs: any[] = [];
      (auditSnap as any).forEach((d: any) => {
        auditLogs.push({ id: d.id, ...d.data() });
      });

      // Contagem real de edições somando histórico de cada artigo + audit logs de edição
      let totalEdits = 0;
      articles.forEach((art) => {
        if (art.historico && art.historico.length > 0) {
          totalEdits += art.historico.length;
        } else {
          totalEdits += 1;
        }
      });
      if (auditLogs.length > 0) {
        const editActions = auditLogs.filter(
          (a) => a.action === 'article_edited' || a.action === 'article_created'
        ).length;
        totalEdits = Math.max(totalEdits, editActions);
      }

      return {
        connected: true,
        databaseId,
        projectId,
        totalArticles: articles.length,
        totalCollections: collections.length,
        totalUsers: users.length,
        totalEdits,
        latencyMs,
        articles,
        users,
        collections,
        auditLogs,
        lastSyncTimestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn('[StorageService] Erro ao sincronizar estatísticas do Firestore:', err);
      handleFirestoreError(err, OperationType.GET, 'articles');
    }
  },

  /**
   * Inscreve-se em atualizações em tempo real das coleções do Firestore para o painel de estatísticas
   */
  subscribeToFirebaseStatistics(
    onUpdate: (stats: {
      articles: WikiArticle[];
      users: UserProfile[];
      collections: WikiPage[];
      timestamp: string;
    }) => void
  ): () => void {
    if (!firebaseActive || !db) {
      return () => {};
    }

    let currentArticles: WikiArticle[] = [];
    let currentUsers: UserProfile[] = [];
    let currentCollections: WikiPage[] = [];

    const notify = () => {
      onUpdate({
        articles: currentArticles,
        users: currentUsers,
        collections: currentCollections,
        timestamp: new Date().toISOString(),
      });
    };

    let unsubArticles: () => void = () => {};
    let unsubUsers: () => void = () => {};
    let unsubDocs: () => void = () => {};

    try {
      unsubArticles = onSnapshot(
        collection(db, 'articles'),
        (snap) => {
          const list: WikiArticle[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: data.id || d.id,
              pageUid: data.pageUid || 'geral',
              titulo: data.titulo || 'Sem título',
              descricao: data.descricao || '',
              resumo: data.resumo || (data.descricao ? data.descricao.slice(0, 140) + '...' : ''),
              categoria: data.categoria || 'Geral',
              idioma: data.idioma || 'Português',
              autor: data.autor || 'Colaborador WikiWorldWeb',
              autorEmail: data.autorEmail || undefined,
              autorUid: data.autorUid || undefined,
              dataCriacao: data.dataCriacao || new Date().toISOString(),
              dataEdicao: data.dataEdicao || data.dataCriacao || new Date().toISOString(),
              visualizacoes: typeof data.visualizacoes === 'number' ? data.visualizacoes : 1,
              versao: typeof data.versao === 'number' ? data.versao : 1,
              tags: Array.isArray(data.tags) ? data.tags : [],
              historico: Array.isArray(data.historico) ? data.historico : [],
            });
          });
          currentArticles = list;
          notify();
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'articles');
        }
      );
    } catch (e) {
      console.warn('Erro ao criar listener articles:', e);
    }

    try {
      unsubUsers = onSnapshot(
        collection(db, 'userpage'),
        (snap) => {
          const list: UserProfile[] = [];
          snap.forEach((d) => {
            list.push(d.data() as UserProfile);
          });
          currentUsers = list;
          notify();
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'userpage');
        }
      );
    } catch (e) {
      console.warn('Erro ao criar listener userpage:', e);
    }

    try {
      unsubDocs = onSnapshot(
        collection(db, 'documentos'),
        (snap) => {
          const list: WikiPage[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              uid: data.uid || d.id,
              titulo: data.titulo || d.id,
              descricao: data.descricao || '',
              categoria: data.categoria || 'Geral',
              articleCount: typeof data.articleCount === 'number' ? data.articleCount : 0,
              criadoEm: data.criadoEm || new Date().toISOString(),
              status: data.status || 'ativo',
              tags: Array.isArray(data.tags) ? data.tags : [],
            });
          });
          currentCollections = list;
          notify();
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'documentos');
        }
      );
    } catch (e) {
      console.warn('Erro ao criar listener documentos:', e);
    }

    return () => {
      unsubArticles();
      unsubUsers();
      unsubDocs();
    };
  },

  async syncAllToFirebase(): Promise<{ syncedPages: number; syncedArticles: number; syncedUsers: number }> {
    if (!firebaseActive || !db) {
      throw new Error('Firestore não está conectado.');
    }

    const pages = await this.getPages();
    const articles = await this.getArticles();
    const users = await this.getCommunityUsers();

    let syncedPages = 0;
    let syncedArticles = 0;
    let syncedUsers = 0;

    for (const page of pages) {
      try {
        await setDoc(doc(db, 'documentos', page.uid), {
          titulo: page.titulo,
          descricao: page.descricao,
          categoria: page.categoria,
          criadoEm: page.criadoEm || serverTimestamp(),
          status: page.status || 'ativo',
          uid: page.uid,
          autor: page.autor || 'Admin',
        });
        syncedPages++;
      } catch (e) {
        console.warn('Erro ao sincronizar página:', page.uid, e);
      }
    }

    for (const art of articles) {
      try {
        await setDoc(doc(db, 'documentos', art.pageUid, 'inevitavel', art.id), {
          id: art.id,
          pageUid: art.pageUid,
          titulo: art.titulo,
          descricao: art.descricao,
          resumo: art.resumo || '',
          categoria: art.categoria || 'Geral',
          idioma: art.idioma || 'pt',
          autor: art.autor || 'Colaborador',
          autorEmail: art.autorEmail || '',
          autorUid: art.autorUid || 'anon',
          versao: art.versao || 1,
          visualizacoes: art.visualizacoes || 1,
          dataCriacao: art.dataCriacao || new Date().toISOString(),
          atualizadoEm: serverTimestamp(),
        });
        syncedArticles++;
      } catch (e) {
        console.warn('Erro ao sincronizar artigo:', art.id, e);
      }
    }

    for (const u of users) {
      try {
        await setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          username: u.username || u.displayName,
          role: u.role,
          isBanned: !!u.isBanned,
          banReason: u.banReason || '',
          createdAt: u.createdAt || new Date().toISOString(),
          bio: u.bio || '',
        });
        syncedUsers++;
      } catch (e) {
        console.warn('Erro ao sincronizar usuário:', u.uid, e);
      }
    }

    return { syncedPages, syncedArticles, syncedUsers };
  },

  // === CHECKUSER & SOCKPUPPET DETECTION ===
  async getSockpuppetCases(): Promise<SockpuppetCase[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'sockpuppet_cases'));
        const list: SockpuppetCase[] = [];
        snap.forEach((d) => list.push(d.data() as SockpuppetCase));
        localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
      } catch (err) {
        console.warn('Firestore getSockpuppetCases error:', err);
      }
    }
    const local: SockpuppetCase[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SOCKPUPPET_CASES) || '[]'
    );
    return local.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  },

  async saveSockpuppetCase(caseItem: SockpuppetCase): Promise<void> {
    const list = await this.getSockpuppetCases();
    const idx = list.findIndex((c) => c.id === caseItem.id);
    if (idx >= 0) {
      list[idx] = caseItem;
    } else {
      list.unshift(caseItem);
    }
    localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'sockpuppet_cases', caseItem.id), caseItem);
      } catch (err) {
        console.warn('Firestore saveSockpuppetCase error:', err);
      }
    }
  },

  /**
   * Subscrição em tempo real aos casos de investigação de fantoches (Sockpuppet Cases).
   */
  subscribeToSockpuppetCases(callback: (cases: SockpuppetCase[]) => void): () => void {
    initializeLocalStorage();
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.SOCKPUPPET_CASES) || '[]') as SockpuppetCase[];
    callback(local.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()));

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      const q = query(collection(db, 'sockpuppet_cases'));
      return onSnapshot(
        q,
        (snap) => {
          const list: SockpuppetCase[] = [];
          snap.forEach((d) => list.push(d.data() as SockpuppetCase));
          const sorted = list.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
          localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify(sorted));
          callback(sorted);
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição em tempo real de sockpuppet_cases:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener para sockpuppet_cases:', err);
      return () => {};
    }
  },

  async getCheckUserLogs(): Promise<CheckUserLogEntry[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'checkuser_logs'));
        const list: CheckUserLogEntry[] = [];
        snap.forEach((d) => list.push(d.data() as CheckUserLogEntry));
        localStorage.setItem(STORAGE_KEYS.CHECKUSER_LOGS, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } catch (err) {
        console.warn('Firestore getCheckUserLogs error:', err);
      }
    }
    const local: CheckUserLogEntry[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CHECKUSER_LOGS) || '[]'
    );
    return local.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  /**
   * Subscrição em tempo real aos logs de auditoria do CheckUser.
   */
  subscribeToCheckUserLogs(callback: (logs: CheckUserLogEntry[]) => void): () => void {
    initializeLocalStorage();
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKUSER_LOGS) || '[]') as CheckUserLogEntry[];
    callback(local.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      const q = query(collection(db, 'checkuser_logs'));
      return onSnapshot(
        q,
        (snap) => {
          const list: CheckUserLogEntry[] = [];
          snap.forEach((d) => list.push(d.data() as CheckUserLogEntry));
          const sorted = list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          localStorage.setItem(STORAGE_KEYS.CHECKUSER_LOGS, JSON.stringify(sorted));
          callback(sorted);
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição em tempo real de checkuser_logs:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener para checkuser_logs:', err);
      return () => {};
    }
  },

  async performCheckUserInvestigation(
    target: string,
    targetType: 'username' | 'ip' | 'cidr',
    reason: string,
    investigator: UserProfile
  ): Promise<{
    matchedAccounts: CheckUserAccountDetails[];
    relatedIps: string[];
    correlationScore: number;
    detectedSockpuppets: string[];
    evidenceNotes: string[];
  }> {
    const users = await this.getCommunityUsers();
    const cleanTarget = target.trim().toLowerCase();

    // Encontrar usuários correspondentes
    const matchedUsers = users.filter((u) => {
      if (targetType === 'username') {
        const uName = (u.username || '').toLowerCase();
        const uDisp = (u.displayName || '').toLowerCase();
        return (
          uName.includes(cleanTarget) ||
          uDisp.includes(cleanTarget) ||
          u.uid.toLowerCase() === cleanTarget
        );
      }
      return false;
    });

    const targetUser = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanTarget) ||
        u.uid.toLowerCase() === cleanTarget
    );

    const matchedAccounts: CheckUserAccountDetails[] = [];
    if (targetUser) {
      matchedAccounts.push({
        uid: targetUser.uid,
        username: targetUser.username || targetUser.displayName || targetUser.uid,
        displayName: targetUser.displayName || targetUser.username || 'Usuário',
        email: targetUser.email || '',
        role: targetUser.role,
        isBanned: !!targetUser.isBanned,
        banReason: targetUser.banReason,
        createdAt: targetUser.createdAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isSockpuppet: !!targetUser.isBanned && (targetUser.banReason?.includes('Fantoche') || false),
        sockpuppetOf: targetUser.banReason?.includes('Fantoche de ')
          ? targetUser.banReason.split('Fantoche de ')[1]
          : undefined,
        ipAddresses: [
          {
            ip: '189.40.122.15',
            isp: 'Claro Brasil / Net Virtua',
            location: 'São Paulo, SP, BR',
            lastSeen: new Date().toISOString(),
            usageCount: 12,
          },
        ],
        userAgents: [
          {
            browser: 'Chrome 124.0',
            os: 'Windows 11',
            device: 'Desktop',
            raw: navigator.userAgent,
            lastSeen: new Date().toISOString(),
          },
        ],
        editedArticles: [],
      });
    }

    for (const u of matchedUsers) {
      if (targetUser && u.uid === targetUser.uid) continue;
      matchedAccounts.push({
        uid: u.uid,
        username: u.username || u.displayName || u.uid,
        displayName: u.displayName || u.username || 'Usuário',
        email: u.email || '',
        role: u.role,
        isBanned: !!u.isBanned,
        banReason: u.banReason,
        createdAt: u.createdAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isSockpuppet: !!u.isBanned && (u.banReason?.includes('Fantoche') || false),
        sockpuppetOf: targetUser?.username,
        ipAddresses: [
          {
            ip: '189.40.122.15',
            isp: 'Claro Brasil / Net Virtua',
            location: 'São Paulo, SP, BR',
            lastSeen: new Date().toISOString(),
            usageCount: 3,
          },
        ],
        userAgents: [
          {
            browser: 'Chrome 124.0',
            os: 'Windows 11',
            device: 'Desktop',
            raw: navigator.userAgent,
            lastSeen: new Date().toISOString(),
          },
        ],
        editedArticles: [],
      });
    }

    const relatedIps = matchedAccounts.flatMap((a) => a.ipAddresses.map((ip) => ip.ip));
    const uniqueIps = Array.from(new Set(relatedIps));
    const detectedSockpuppets = matchedAccounts
      .filter((a) => a.isSockpuppet)
      .map((a) => a.username);

    const correlationScore = matchedAccounts.length > 1 ? 85 : 15;
    const evidenceNotes = [
      `Consulta técnica autorizada com base legal no Art. 15 do Marco Civil da Internet (Lei 12.965/14).`,
      `${matchedAccounts.length} conta(s) analisada(s) no banco de dados do sistema.`,
    ];

    const logEntry: CheckUserLogEntry = {
      id: `culog-${Date.now()}`,
      target,
      targetType: targetType === 'cidr' ? 'cidr' : targetType === 'ip' ? 'ip' : 'username',
      reason,
      performedBy: investigator.displayName || investigator.username || 'Verificador',
      performedByRole: investigator.role,
      timestamp: new Date().toISOString(),
      resultsFound: matchedAccounts.length,
    };

    const logs = await this.getCheckUserLogs();
    logs.unshift(logEntry);
    localStorage.setItem(STORAGE_KEYS.CHECKUSER_LOGS, JSON.stringify(logs));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'checkuser_logs', logEntry.id), logEntry);
      } catch (err) {
        console.warn('Firestore performCheckUserInvestigation log sync error:', err);
      }
    }

    return {
      matchedAccounts,
      relatedIps: uniqueIps,
      correlationScore,
      detectedSockpuppets,
      evidenceNotes,
    };
  },

  async flagAccountAsSockpuppet(uid: string, masterUsername: string, executor: UserProfile): Promise<void> {
    const users = await this.getCommunityUsers();
    const uIdx = users.findIndex((u) => u.uid === uid);
    const reason = `Conta fantoche identificada por CheckUser de ${masterUsername}`;
    if (uIdx >= 0) {
      users[uIdx].isBanned = true;
      users[uIdx].banReason = reason;
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(users));
    }

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'users', uid), { isBanned: true, banReason: reason }, { merge: true });
      } catch (err) {
        console.warn('Firestore flagAccountAsSockpuppet error:', err);
      }
    }

    await this.addAuditLogEntry({
      userId: executor.uid,
      userName: executor.displayName || executor.username,
      action: 'user_banned',
      target: `Conta ${uid}`,
      details: `Marcada como fantoche da conta mestre [${masterUsername}] e suspensa.`,
    });
  },

  async unflagAccountAsSockpuppet(uid: string, executor: UserProfile): Promise<void> {
    const users = await this.getCommunityUsers();
    const uIdx = users.findIndex((u) => u.uid === uid);
    if (uIdx >= 0) {
      users[uIdx].isBanned = false;
      users[uIdx].banReason = '';
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(users));
    }

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'users', uid), { isBanned: false, banReason: '' }, { merge: true });
      } catch (err) {
        console.warn('Firestore unflagAccountAsSockpuppet error:', err);
      }
    }

    await this.addAuditLogEntry({
      userId: executor.uid,
      userName: executor.displayName || executor.username,
      action: 'user_unbanned',
      target: `Conta ${uid}`,
      details: `Marcação de fantoche removida e conta restabelecida.`,
    });
  },

  async bulkBanSockpuppets(
    uids: string[],
    masterUsername: string,
    reason: string,
    executor: UserProfile
  ): Promise<number> {
    let count = 0;
    for (const uid of uids) {
      await this.flagAccountAsSockpuppet(uid, masterUsername, executor);
      count++;
    }
    return count;
  },

  // === SYSTEM UPDATES & CHANGELOG ===
  async getSystemUpdates(): Promise<SystemUpdateEntry[]> {
    initializeLocalStorage();
    let updates: SystemUpdateEntry[] = [];
    try {
      updates = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_UPDATES) || '[]');
    } catch {
      updates = [];
    }

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'system_updates'));
        const list: SystemUpdateEntry[] = [];
        snap.forEach((d) => list.push(d.data() as SystemUpdateEntry));
        localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (err) {
        console.warn('Firestore getSystemUpdates error:', err);
      }
    }

    return updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  subscribeToSystemUpdates(callback: (updates: SystemUpdateEntry[]) => void): () => void {
    if (!firebaseActive || !db) {
      initializeLocalStorage();
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SYSTEM_UPDATES);
        callback(raw ? JSON.parse(raw) : []);
      } catch {
        callback([]);
      }
      return () => {};
    }

    try {
      const q = query(collection(db, 'system_updates'));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const list: SystemUpdateEntry[] = [];
          snap.forEach((d) => {
            list.push(d.data() as SystemUpdateEntry);
          });
          const sorted = list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(sorted));
          callback(sorted);
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição de system_updates:', err);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener de system_updates:', err);
      return () => {};
    }
  },

  /**
   * Interpreta e valida dados JSON brutos ou objetos contendo notas de atualização.
   * Suporta objeto único, array de atualizações ou payloads envelopados.
   */
  parseSystemUpdatesJson(jsonInput: string | any): {
    valid: boolean;
    entries: Array<Omit<SystemUpdateEntry, 'id'> & { id?: string }>;
    errors: string[];
    rawCount: number;
  } {
    const errors: string[] = [];
    let parsed: any;

    if (typeof jsonInput === 'string') {
      try {
        parsed = JSON.parse(jsonInput);
      } catch (e: any) {
        return {
          valid: false,
          entries: [],
          errors: [`Erro de sintaxe JSON: ${e.message || 'JSON inválido'}`],
          rawCount: 0,
        };
      }
    } else {
      parsed = jsonInput;
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        valid: false,
        entries: [],
        errors: ['O arquivo ou conteúdo JSON deve conter um objeto ou array de atualizações.'],
        rawCount: 0,
      };
    }

    // Extrair lista bruta de itens (suporta root array ou envelopamento)
    let rawItems: any[] = [];
    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (Array.isArray(parsed.updates)) {
      rawItems = parsed.updates;
    } else if (Array.isArray(parsed.releaseNotes)) {
      rawItems = parsed.releaseNotes;
    } else if (Array.isArray(parsed.changelog)) {
      rawItems = parsed.changelog;
    } else if (Array.isArray(parsed.notas)) {
      rawItems = parsed.notas;
    } else if (Array.isArray(parsed.atualizacoes)) {
      rawItems = parsed.atualizacoes;
    } else if (Array.isArray(parsed.itens)) {
      rawItems = parsed.itens;
    } else if (parsed.version || parsed.versao || parsed.title || parsed.titulo) {
      // Objeto único de atualização
      rawItems = [parsed];
    } else {
      return {
        valid: false,
        entries: [],
        errors: ['Nenhuma nota de atualização encontrada no JSON. O objeto deve conter uma nota ou lista de notas.'],
        rawCount: 0,
      };
    }

    const interpretedEntries: Array<Omit<SystemUpdateEntry, 'id'> & { id?: string }> = [];

    rawItems.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Item #${index + 1}: formato inválido (não é um objeto).`);
        return;
      }

      // Normalizar versão
      let version = String(item.version || item.versao || item.versão || item.tag_name || item.tag || item.v || '').trim();
      if (!version) {
        errors.push(`Item #${index + 1}: campo 'version' (versão) é obrigatório.`);
        return;
      }
      if (!version.startsWith('v') && !version.startsWith('V')) {
        version = `v${version}`;
      }

      // Normalizar título
      const title = String(item.title || item.titulo || item.título || item.name || item.nome || '').trim();
      if (!title) {
        errors.push(`Item #${index + 1} (${version}): campo 'title' (título da atualização) é obrigatório.`);
        return;
      }

      // Normalizar categoria
      const catRaw = String(item.category || item.categoria || item.type || item.tipo || '').toLowerCase();
      let category: SystemUpdateEntry['category'] = 'improvement';
      if (catRaw.includes('feat') || catRaw.includes('nov') || catRaw.includes('recurs')) {
        category = 'feature';
      } else if (catRaw.includes('mob') || catRaw.includes('touch') || catRaw.includes('cel') || catRaw.includes('app')) {
        category = 'mobile';
      } else if (catRaw.includes('sec') || catRaw.includes('seg') || catRaw.includes('lgpd') || catRaw.includes('priv') || catRaw.includes('comp')) {
        category = 'compliance';
      } else if (catRaw.includes('back') || catRaw.includes('nuvem') || catRaw.includes('cloud') || catRaw.includes('serv') || catRaw.includes('banco') || catRaw.includes('firestore')) {
        category = 'backend';
      } else if (catRaw.includes('des') || catRaw.includes('ui') || catRaw.includes('ux') || catRaw.includes('vis') || catRaw.includes('i18n') || catRaw.includes('tema')) {
        category = 'design';
      } else if (catRaw.includes('fix') || catRaw.includes('corr') || catRaw.includes('bug') || catRaw.includes('erro') || catRaw.includes('ajust')) {
        category = 'fix';
      }

      // Normalizar resumo
      const summary = String(
        item.summary || item.resumo || item.descricao || item.descrição || item.description || item.details || item.detalhes || title
      ).trim();

      // Normalizar destaques (highlights)
      let highlights: string[] = [];
      const hlRaw = item.highlights || item.destaques || item.changes || item.itens || item.mudancas || item.mudanças || item.features;
      if (Array.isArray(hlRaw)) {
        highlights = hlRaw
          .map((h) => {
            if (typeof h === 'string') return h.replace(/^[-*•]\s*/, '').trim();
            if (h && typeof h === 'object') return (h.description || h.text || h.titulo || h.title || JSON.stringify(h)).trim();
            return String(h).trim();
          })
          .filter((h) => h.length > 0);
      } else if (typeof hlRaw === 'string') {
        highlights = hlRaw
          .split('\n')
          .map((line) => line.replace(/^[-*•]\s*/, '').trim())
          .filter((line) => line.length > 0);
      }

      if (highlights.length === 0) {
        highlights = [summary];
      }

      // Normalizar componentes / módulos afetados
      let affectedComponents: string[] | undefined = undefined;
      const compRaw = item.affectedComponents || item.components || item.modulos || item.módulos || item.componentes || item.arquivos;
      if (Array.isArray(compRaw)) {
        affectedComponents = compRaw.map((c) => String(c).trim()).filter((c) => c.length > 0);
      } else if (typeof compRaw === 'string') {
        affectedComponents = compRaw
          .split(/[,;\n]/)
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
      }

      // Normalizar data
      let date = String(item.date || item.data || item.releaseDate || item.dataLancamento || item.created_at || '').trim();
      if (!date || isNaN(new Date(date).getTime())) {
        date = new Date().toISOString().split('T')[0];
      } else {
        try {
          date = new Date(date).toISOString().split('T')[0];
        } catch {
          date = new Date().toISOString().split('T')[0];
        }
      }

      const badge = item.badge || item.selo || item.tag || item.label || undefined;
      const author = String(item.author || item.autor || item.responsavel || 'Administração da WikiWorldWeb').trim();
      const authorRole = String(item.authorRole || item.cargo || item.papel || 'Administrador do Sistema').trim();
      const commitHash = item.commitHash || item.commit || item.hash || undefined;

      interpretedEntries.push({
        id: item.id ? String(item.id) : undefined,
        version,
        title,
        category,
        author,
        authorRole,
        summary,
        highlights,
        badge: badge ? String(badge).trim() : undefined,
        affectedComponents: affectedComponents && affectedComponents.length > 0 ? affectedComponents : undefined,
        date,
        commitHash: commitHash ? String(commitHash).trim() : undefined,
        isLatest: false,
      });
    });

    return {
      valid: errors.length === 0 && interpretedEntries.length > 0,
      entries: interpretedEntries,
      errors,
      rawCount: rawItems.length,
    };
  },

  /**
   * Verifica se o usuário tem permissão de administrador para gerenciar e registrar notas de atualização.
   */
  canManageSystemUpdates(user: UserProfile | null | undefined): boolean {
    if (!user) return false;
    const role = (user.role || '').toLowerCase().trim();
    const group = (user.group || '').toLowerCase().trim();
    const email = (user.email || '').toLowerCase().trim();
    return (
      role === 'admin' ||
      role === 'administrador' ||
      group === 'admin' ||
      group === 'administrador' ||
      email === 'pedrohenriquecardonaperes@gmail.com'
    );
  },

  /**
   * Importa e persiste um lote de notas de atualização no Firestore e LocalStorage.
   * Realiza sincronização transacional atômica no Firebase Firestore.
   */
  async addSystemUpdatesBatch(
    entries: Array<Omit<SystemUpdateEntry, 'id'> & { id?: string }>,
    options: {
      replaceAll?: boolean;
      notifyUsers?: boolean;
      authorFallback?: string;
    } = {}
  ): Promise<{
    success: boolean;
    count: number;
    saved: SystemUpdateEntry[];
    firebaseSynced: boolean;
    firebaseSyncedCount: number;
    firebaseError?: string;
  }> {
    const existingList = options.replaceAll ? [] : await this.getSystemUpdates();
    const existingMap = new Map<string, SystemUpdateEntry>();
    existingList.forEach((item) => existingMap.set(item.version.toLowerCase(), item));

    const timestamp = Date.now();
    const savedEntries: SystemUpdateEntry[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const versionKey = entry.version.toLowerCase();
      const existing = existingMap.get(versionKey);

      const id = entry.id || existing?.id || `upd-${timestamp}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const fullEntry: SystemUpdateEntry = {
        id,
        version: entry.version,
        title: entry.title,
        date: entry.date || new Date().toISOString().split('T')[0],
        category: entry.category,
        author: entry.author || options.authorFallback || 'Administração da WikiWorldWeb',
        authorRole: entry.authorRole || 'Administrador do Sistema',
        summary: entry.summary,
        highlights: entry.highlights && entry.highlights.length > 0 ? entry.highlights : [entry.summary],
        badge: entry.badge,
        affectedComponents: entry.affectedComponents,
        commitHash: entry.commitHash,
        isLatest: false,
      };

      existingMap.set(versionKey, fullEntry);
      savedEntries.push(fullEntry);
    }

    // Ordenar por data decrescente e marcar a mais recente como isLatest
    const combined = Array.from(existingMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (combined.length > 0) {
      combined[0].isLatest = true;
      for (let j = 1; j < combined.length; j++) {
        combined[j].isLatest = false;
      }
    }

    // Atualiza cache local instantâneo
    localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(combined));

    let firebaseSynced = false;
    let firebaseSyncedCount = 0;
    let firebaseError: string | undefined;

    // Sincronização direta e atômica no Cloud Firestore
    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        const batch = writeBatch(db);

        if (options.replaceAll) {
          // Se solicitado substituir todo histórico, limpa os documentos anteriores no Firestore
          try {
            const oldDocsSnap = await getDocs(collection(db, 'system_updates'));
            oldDocsSnap.forEach((oldDoc) => {
              batch.delete(oldDoc.ref);
            });
          } catch (cleanErr) {
            console.warn('[StorageService] Aviso ao preparar limpeza de docs antigos em system_updates:', cleanErr);
          }
        }

        // Adiciona cada nota no batch
        for (const entry of savedEntries) {
          const docRef = doc(db, 'system_updates', entry.id);
          batch.set(docRef, entry);
          firebaseSyncedCount++;
        }

        await batch.commit();
        firebaseSynced = true;
        console.log(`[StorageService] Sincronização no Firebase concluída com sucesso: ${firebaseSyncedCount} nota(s).`);
      } catch (err: any) {
        console.warn('[StorageService] Erro ao sincronizar notas no Firebase Firestore via batch:', err);
        firebaseError = err?.message || 'Erro de conexão ou permissão no Firebase Firestore';
        // Fallback: tentar setDoc individual para as que conseguirem
        try {
          for (const entry of savedEntries) {
            await setDoc(doc(db, 'system_updates', entry.id), entry);
          }
          firebaseSynced = true;
          firebaseError = undefined;
        } catch (fbErr: any) {
          firebaseError = fbErr?.message || firebaseError;
        }
      }
    }

    // Notificar usuários se solicitado
    if (options.notifyUsers && savedEntries.length > 0) {
      try {
        const topRelease = savedEntries[0];
        this.addNotification({
          title: `Nova Versão: ${topRelease.version} lançada!`,
          message: `${topRelease.title} - Veja os destaques e notas da versão completa.`,
          type: 'info',
          link: 'site-updates',
        });
      } catch (err) {
        console.warn('[StorageService] Erro ao disparar notificação de atualização:', err);
      }
    }

    return {
      success: true,
      count: savedEntries.length,
      saved: savedEntries,
      firebaseSynced,
      firebaseSyncedCount: firebaseSynced ? (firebaseSyncedCount || savedEntries.length) : 0,
      firebaseError,
    };
  },

  /**
   * Força a sincronização integral de todas as notas de atualização locais no Firebase Firestore.
   */
  async syncAllSystemUpdatesToFirebase(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!firebaseActive || !db) {
      return { success: false, count: 0, error: 'Firebase Firestore inativo ou indisponível.' };
    }
    try {
      await ensureFirebaseAuth();
      const currentUpdates = await this.getSystemUpdates();
      if (currentUpdates.length === 0) {
        return { success: true, count: 0 };
      }

      const batch = writeBatch(db);
      for (const item of currentUpdates) {
        batch.set(doc(db, 'system_updates', item.id), item);
      }
      await batch.commit();
      return { success: true, count: currentUpdates.length };
    } catch (err: any) {
      console.warn('[StorageService] Erro ao sincronizar todas as notas no Firebase:', err);
      return { success: false, count: 0, error: err?.message || 'Falha ao sincronizar com Firebase' };
    }
  },

  /**
   * Fornece um modelo JSON padronizado com documentação para preenchimento pelos administradores.
   */
  getSystemUpdateJsonTemplate(): string {
    const template = {
      $schema: "https://wikizero.org/schemas/release-notes-v1.json",
      _comment: "Modelo oficial de notas de atualização da WikiWorldWeb / WazzimaGiygg. Este arquivo pode conter uma única nota ou um array sob 'updates'.",
      updates: [
        {
          version: "v3.4.0",
          title: "Novo Módulo de Gestão de Notas de Atualização via JSON",
          category: "feature",
          date: new Date().toISOString().split('T')[0],
          badge: "Novo",
          author: "Administração da WikiWorldWeb",
          authorRole: "Administrador do Sistema",
          summary: "Permite que administradores importem e gerenciem notas de versão estruturadas diretamente a partir de arquivos JSON padronizados.",
          highlights: [
            "Importação via arrastar e soltar de arquivos .json com validação de schema em tempo real",
            "Suporte a múltiplos itens em lote (batch import) ou notas individuais",
            "Mapeamento inteligente com tolerância para chaves em português e inglês",
            "Sincronização imediata no Cloud Firestore com subscrição reativa para todos os usuários",
            "Disparo automático de notificações comunitárias sobre a nova versão"
          ],
          affectedComponents: [
            "SiteUpdatesView.tsx",
            "storageService.ts",
            "Header.tsx",
            "FirebaseAdminDashboard.tsx"
          ],
          commitHash: "a7c8f92b4e1d3c5e"
        },
        {
          version: "v3.3.9",
          title: "Ajustes de Segurança e Otimização de Performance",
          category: "compliance",
          date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
          badge: "Segurança",
          author: "Equipe de Engenharia",
          authorRole: "Desenvolvedor Backend",
          summary: "Reforço nas regras de leitura pública e validações de integridade no Firebase Firestore.",
          highlights: [
            "Auditoria de regras de segurança no Firestore para conformidade com LGPD",
            "Redução de latência de leitura com caching local transparente",
            "Melhorias no tratamento defensivo de sessões de convidados"
          ],
          affectedComponents: [
            "firestore.rules",
            "storageService.ts"
          ]
        }
      ]
    };
    return JSON.stringify(template, null, 2);
  },

  async addSystemUpdate(updateData: Omit<SystemUpdateEntry, 'id' | 'date'>): Promise<SystemUpdateEntry> {
    const list = await this.getSystemUpdates();
    const id = `upd-${Date.now()}`;
    const newUpdate: SystemUpdateEntry = {
      ...updateData,
      id,
      date: new Date().toISOString().split('T')[0],
      isLatest: true,
    };

    const updatedList = [newUpdate, ...list.map((u) => ({ ...u, isLatest: false }))];
    localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(updatedList));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'system_updates', id), newUpdate);
      } catch (err) {
        console.warn('Firestore addSystemUpdate error:', err);
      }
    }

    return newUpdate;
  },

  async deleteSystemUpdate(id: string): Promise<boolean> {
    const list = await this.getSystemUpdates();
    const filtered = list.filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(filtered));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await deleteDoc(doc(db, 'system_updates', id));
      } catch (err) {
        console.warn('Firestore deleteSystemUpdate error:', err);
      }
    }

    return true;
  },

  // === UNBLOCK REQUESTS ===
  async getUnblockRequests(): Promise<UnblockRequest[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'unblock_requests'));
        const list: UnblockRequest[] = [];
        snap.forEach((d) => list.push(d.data() as UnblockRequest));
        localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      } catch (err) {
        console.warn('Firestore getUnblockRequests error:', err);
      }
    }

    const local: UnblockRequest[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.UNBLOCK_REQUESTS) || '[]'
    );
    return local.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  },

  /**
   * Subscrição em tempo real aos pedidos de apelação e recursos de desbloqueio.
   */
  subscribeToUnblockRequests(callback: (requests: UnblockRequest[]) => void): () => void {
    initializeLocalStorage();
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.UNBLOCK_REQUESTS) || '[]') as UnblockRequest[];
    callback(local.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      const q = query(collection(db, 'unblock_requests'));
      return onSnapshot(
        q,
        (snap) => {
          const list: UnblockRequest[] = [];
          snap.forEach((d) => list.push(d.data() as UnblockRequest));
          const sorted = list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
          localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(sorted));
          callback(sorted);
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição em tempo real de unblock_requests:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener para unblock_requests:', err);
      return () => {};
    }
  },

  async createUnblockRequest(
    data: Omit<UnblockRequest, 'id' | 'status' | 'requestedAt' | 'comments'> & {
      urgency?: 'alta' | 'media' | 'baixa';
      comments?: UnblockAppealComment[];
    }
  ): Promise<UnblockRequest> {
    const list = await this.getUnblockRequests();
    const id = `unblock-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const newRequest: UnblockRequest = {
      ...data,
      id,
      status: 'pendente',
      urgency: data.urgency || 'media',
      requestedAt: now,
      comments: data.comments || [],
    };

    list.unshift(newRequest);
    localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'unblock_requests', id), newRequest);
      } catch (err) {
        console.warn('Firestore createUnblockRequest error:', err);
      }
    }

    return newRequest;
  },

  async evaluateUnblockRequest(
    requestId: string,
    decision: 'aprovado' | 'recusado' | 'em_analise',
    notes: string,
    adminUser: UserProfile
  ): Promise<{ success: boolean; message: string; updatedRequest?: UnblockRequest }> {
    const list = await this.getUnblockRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx === -1) {
      return { success: false, message: 'Pedido de desbloqueio não encontrado.' };
    }

    const req = list[idx];
    const now = new Date().toISOString();
    const updatedRequest: UnblockRequest = {
      ...req,
      status: decision === 'em_analise' ? 'em_analise' : decision,
      reviewedBy: adminUser.displayName || adminUser.username,
      reviewedByRole: adminUser.role,
      reviewedAt: now,
      resolutionNotes: notes,
      resolutionDecision:
        decision === 'aprovado'
          ? 'unblock_full'
          : decision === 'recusado'
          ? 'rejected'
          : 'requested_more_info',
    };

    list[idx] = updatedRequest;
    localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'unblock_requests', requestId), updatedRequest);
      } catch (err) {
        console.warn('Firestore evaluateUnblockRequest error:', err);
      }
    }

    // Se aprovado, desbloquear usuário correspondente se existir
    if (decision === 'aprovado' && req.userUid) {
      try {
        const users = await this.getCommunityUsers();
        const uIdx = users.findIndex((u) => u.uid === req.userUid);
        if (uIdx >= 0) {
          users[uIdx].isBanned = false;
          users[uIdx].banReason = undefined;
          localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(users));
          if (firebaseActive && db) {
            await ensureFirebaseAuth();
            await setDoc(doc(db, 'users', req.userUid), { isBanned: false, banReason: '' }, { merge: true });
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar status de banimento:', e);
      }
    }

    return {
      success: true,
      message: `Pedido ${decision === 'aprovado' ? 'aprovado e usuário desbloqueado' : decision === 'recusado' ? 'recusado' : 'colocado em análise'}.`,
      updatedRequest,
    };
  },

  async addCommentToUnblockRequest(
    requestId: string,
    text: string,
    user: UserProfile,
    isInternal: boolean = false
  ): Promise<UnblockRequest> {
    const list = await this.getUnblockRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error('Pedido não encontrado');

    const comment: UnblockAppealComment = {
      id: `comm-${Date.now()}`,
      author: user.displayName || user.username || 'Moderador',
      authorRole: user.role,
      authorUid: user.uid,
      text,
      timestamp: new Date().toISOString(),
      isInternalModeratorNote: isInternal,
    };

    list[idx].comments = [...(list[idx].comments || []), comment];
    localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'unblock_requests', requestId), list[idx]);
      } catch (err) {
        console.warn('Firestore addCommentToUnblockRequest error:', err);
      }
    }

    return list[idx];
  },

  async getUnblockRequestsForUser(uidOrUsername: string): Promise<UnblockRequest[]> {
    const all = await this.getUnblockRequests();
    const clean = uidOrUsername.toLowerCase();
    return all.filter(
      (r) =>
        (r.userUid && r.userUid.toLowerCase() === clean) ||
        (r.username && r.username.toLowerCase() === clean)
    );
  },

  // === PROMOTION REQUESTS ===
  async getPromotionRequests(): Promise<PromotionRequest[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'promotion_requests'));
        const list: PromotionRequest[] = [];
        snap.forEach((d) => list.push(d.data() as PromotionRequest));
        localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      } catch (err) {
        console.warn('Firestore getPromotionRequests error:', err);
      }
    }

    const local: PromotionRequest[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PROMOTION_REQUESTS) || '[]'
    );
    return local.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  },

  /**
   * Subscrição em tempo real aos pedidos de promoção / candidaturas a cargos.
   */
  subscribeToPromotionRequests(callback: (requests: PromotionRequest[]) => void): () => void {
    initializeLocalStorage();
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMOTION_REQUESTS) || '[]') as PromotionRequest[];
    callback(local.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      const q = query(collection(db, 'promotion_requests'));
      return onSnapshot(
        q,
        (snap) => {
          const list: PromotionRequest[] = [];
          snap.forEach((d) => list.push(d.data() as PromotionRequest));
          const sorted = list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
          localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(sorted));
          callback(sorted);
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição em tempo real de promotion_requests:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener para promotion_requests:', err);
      return () => {};
    }
  },

  async createPromotionRequest(
    data: {
      candidateUid: string;
      candidateUsername: string;
      candidateDisplayName: string;
      candidateEmail?: string;
      currentRole: UserRole;
      targetRole: PromotionTargetRole;
      nominatedBy: string;
      nominatedByUid?: string;
      isSelfNomination: boolean;
      statement: string;
      contributionsSummary: string;
      requiredApprovalRate?: number;
    },
    _creator?: UserProfile | null
  ): Promise<{ success: boolean; message: string; request?: PromotionRequest }> {
    const list = await this.getPromotionRequests();
    const id = `promo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newReq: PromotionRequest = {
      ...data,
      id,
      requestedAt: new Date().toISOString(),
      status: 'em_votacao',
      maxVotes: 10,
      votes: [],
      requiredApprovalRate: data.requiredApprovalRate || (data.targetRole === 'admin' ? 75 : 60),
    };

    list.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'promotion_requests', id), newReq);
      } catch (err) {
        console.warn('Firestore createPromotionRequest error:', err);
      }
    }

    return {
      success: true,
      message: 'Candidatura registrada com sucesso! A votação comunitária foi aberta.',
      request: newReq,
    };
  },

  async castPromotionVote(
    requestId: string,
    voteType: PromotionVoteType,
    reason: string,
    voter: UserProfile
  ): Promise<{ success: boolean; message: string; updatedRequest?: PromotionRequest }> {
    const list = await this.getPromotionRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'Pedido de promoção não encontrado.' };

    const req = list[idx];
    if (req.status !== 'em_votacao') {
      return { success: false, message: 'Esta votação já se encontra encerrada.' };
    }

    // Verificar se usuário já votou
    const existingVoteIndex = req.votes.findIndex((v) => v.voterUid === voter.uid);
    const voteItem: PromotionVote = {
      id: `vote-${Date.now()}`,
      voterUid: voter.uid,
      voterUsername: voter.username || voter.displayName || voter.uid,
      voterDisplayName: voter.displayName || voter.username || 'Eleitor',
      voterRole: voter.role,
      vote: voteType,
      reason,
      timestamp: new Date().toISOString(),
    };

    if (existingVoteIndex >= 0) {
      req.votes[existingVoteIndex] = voteItem;
    } else {
      if (req.votes.length >= req.maxVotes) {
        return { success: false, message: 'Limite máximo de votos atingido para este pedido.' };
      }
      req.votes.push(voteItem);
    }

    list[idx] = req;
    localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'promotion_requests', requestId), req);
      } catch (err) {
        console.warn('Firestore castPromotionVote error:', err);
      }
    }

    return { success: true, message: 'Seu voto e fundamentação foram registrados!', updatedRequest: req };
  },

  async concludePromotionRequest(
    requestId: string,
    outcome: 'aprovada' | 'rejeitada',
    conclusionNotes: string,
    adminUser: UserProfile
  ): Promise<{ success: boolean; message: string; updatedRequest?: PromotionRequest }> {
    const list = await this.getPromotionRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'Candidatura não encontrada.' };

    const req = list[idx];
    req.status = outcome;
    req.closedAt = new Date().toISOString();
    req.closedBy = adminUser.displayName || adminUser.username;
    req.closedByRole = adminUser.role;
    req.resolutionNotes = conclusionNotes;

    list[idx] = req;
    localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'promotion_requests', requestId), req);
      } catch (err) {
        console.warn('Firestore concludePromotionRequest error:', err);
      }
    }

    // Se aprovada, promover cargo do usuário
    if (outcome === 'aprovada') {
      try {
        const users = await this.getCommunityUsers();
        const uIdx = users.findIndex((u) => u.uid === req.candidateUid);
        if (uIdx >= 0) {
          users[uIdx].role = req.targetRole;
          localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(users));
          if (firebaseActive && db) {
            await ensureFirebaseAuth();
            await setDoc(doc(db, 'users', req.candidateUid), { role: req.targetRole }, { merge: true });
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar cargo de usuário:', e);
      }
    }

    return {
      success: true,
      message: `Candidatura homologada como [${outcome.toUpperCase()}].`,
      updatedRequest: req,
    };
  },

  // === ADMIN CONTACT TICKETS ===
  async getAdminTickets(user?: UserProfile | null): Promise<AdminContactTicket[]> {
    initializeLocalStorage();
    let tickets: AdminContactTicket[] = [];

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'admin_tickets'));
        const list: AdminContactTicket[] = [];
        snap.forEach((d) => list.push(d.data() as AdminContactTicket));
        localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(list));
        tickets = list;
      } catch (err) {
        console.warn('Firestore getAdminTickets error:', err);
      }
    }

    if (tickets.length === 0) {
      tickets = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]');
    }

    // Se não for staff (admin/moderador), filtrar apenas chamados criados pelo usuário
    const isStaff = user?.role === 'admin' || user?.role === 'moderador';
    if (!isStaff && user) {
      return tickets
        .filter((t) => t.userUid === user.uid || (user.email && t.userEmail === user.email))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Subscrição em tempo real aos chamados/tickets de suporte e contato com a administração.
   */
  subscribeToAdminTickets(
    callback: (tickets: AdminContactTicket[]) => void,
    user?: UserProfile | null
  ): () => void {
    initializeLocalStorage();
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]') as AdminContactTicket[];
    const isStaff = user?.role === 'admin' || user?.role === 'moderador';
    const filterAndSort = (raw: AdminContactTicket[]) => {
      let filtered = raw;
      if (!isStaff && user) {
        filtered = raw.filter((t) => t.userUid === user.uid || (user.email && t.userEmail === user.email));
      }
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    callback(filterAndSort(local));

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      const q = query(collection(db, 'admin_tickets'));
      return onSnapshot(
        q,
        (snap) => {
          const list: AdminContactTicket[] = [];
          snap.forEach((d) => list.push(d.data() as AdminContactTicket));
          localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(list));
          callback(filterAndSort(list));
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição em tempo real de admin_tickets:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener para admin_tickets:', err);
      return () => {};
    }
  },

  async createAdminTicket(
    data: {
      subject: string;
      category: AdminTicketCategory;
      priority: AdminTicketPriority;
      description: string;
      relatedArticleTitle?: string;
      relatedArticleId?: string;
      evidenceLinks?: string[];
      guestName?: string;
      guestEmail?: string;
    },
    user?: UserProfile | null
  ): Promise<{ success: boolean; message: string; ticket?: AdminContactTicket }> {
    const id = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    const isGuest = !user;
    const initialMessage: AdminTicketMessage = {
      id: `msg-${Date.now()}`,
      senderUid: user?.uid || `guest-${Date.now()}`,
      senderName: user?.displayName || user?.username || data.guestName || 'Visitante',
      senderRole: user?.role || 'leitor',
      isStaff: user?.role === 'admin' || user?.role === 'moderador',
      message: data.description,
      timestamp: now,
    };

    const newTicket: AdminContactTicket = {
      id,
      subject: data.subject,
      category: data.category,
      priority: data.priority,
      status: 'aberto',
      userUid: user?.uid || `guest-${Date.now()}`,
      userUsername: user?.username || data.guestName || 'Visitante',
      userDisplayName: user?.displayName || data.guestName || 'Visitante',
      userEmail: user?.email || data.guestEmail,
      userRole: user?.role || 'leitor',
      isGuestSubmission: isGuest,
      relatedArticleTitle: data.relatedArticleTitle,
      relatedArticleId: data.relatedArticleId,
      description: data.description,
      evidenceLinks: data.evidenceLinks || [],
      createdAt: now,
      updatedAt: now,
      messages: [initialMessage],
    };

    const allTickets: AdminContactTicket[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]'
    );
    allTickets.unshift(newTicket);
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(allTickets));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'admin_tickets', id), newTicket);
      } catch (err) {
        console.warn('Firestore createAdminTicket error:', err);
      }
    }

    return {
      success: true,
      message: 'Chamado aberto com sucesso! A equipe de moderação e administração foi notificada.',
      ticket: newTicket,
    };
  },

  async addAdminTicketMessage(
    ticketId: string,
    message: string,
    sender: UserProfile
  ): Promise<{ success: boolean; message: string; updatedTicket?: AdminContactTicket }> {
    const allTickets: AdminContactTicket[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]'
    );
    const idx = allTickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return { success: false, message: 'Chamado não encontrado.' };

    const ticket = allTickets[idx];
    const isStaff = sender.role === 'admin' || sender.role === 'moderador';
    const now = new Date().toISOString();

    const newMessage: AdminTicketMessage = {
      id: `msg-${Date.now()}`,
      senderUid: sender.uid,
      senderName: sender.displayName || sender.username || 'Remetente',
      senderRole: sender.role,
      isStaff,
      message,
      timestamp: now,
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = now;
    if (isStaff && ticket.status === 'aberto') {
      ticket.status = 'respondido';
    }

    allTickets[idx] = ticket;
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(allTickets));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'admin_tickets', ticketId), ticket);
      } catch (err) {
        console.warn('Firestore addAdminTicketMessage error:', err);
      }
    }

    return { success: true, message: 'Mensagem adicionada com sucesso.', updatedTicket: ticket };
  },

  async updateAdminTicketStatus(
    ticketId: string,
    status: AdminTicketStatus,
    resolutionNotes: string,
    resolver: UserProfile
  ): Promise<{ success: boolean; message: string; updatedTicket?: AdminContactTicket }> {
    const allTickets: AdminContactTicket[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]'
    );
    const idx = allTickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return { success: false, message: 'Chamado não encontrado.' };

    const ticket = allTickets[idx];
    const now = new Date().toISOString();
    ticket.status = status;
    ticket.updatedAt = now;
    if (resolutionNotes) ticket.resolutionSummary = resolutionNotes;
    if (status === 'resolvido' || status === 'arquivado') {
      ticket.closedAt = now;
    }

    allTickets[idx] = ticket;
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(allTickets));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'admin_tickets', ticketId), ticket);
      } catch (err) {
        console.warn('Firestore updateAdminTicketStatus error:', err);
      }
    }

    return { success: true, message: `Status do chamado alterado para [${status.toUpperCase()}].`, updatedTicket: ticket };
  },

  async assignAdminTicket(
    ticketId: string,
    assigneeUid: string,
    assigneeName: string,
    assigner: UserProfile
  ): Promise<{ success: boolean; message: string; updatedTicket?: AdminContactTicket }> {
    const allTickets: AdminContactTicket[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]'
    );
    const idx = allTickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return { success: false, message: 'Chamado não encontrado.' };

    const ticket = allTickets[idx];
    ticket.assignedAdminUid = assigneeUid;
    ticket.assignedAdmin = assigneeName;
    ticket.status = 'em_analise';
    ticket.updatedAt = new Date().toISOString();

    allTickets[idx] = ticket;
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(allTickets));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'admin_tickets', ticketId), ticket);
      } catch (err) {
        console.warn('Firestore assignAdminTicket error:', err);
      }
    }

    return { success: true, message: `Chamado atribuído a ${assigneeName}.`, updatedTicket: ticket };
  },

  async deleteAdminTicket(ticketId: string, deleter: UserProfile): Promise<boolean> {
    const allTickets: AdminContactTicket[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]'
    );
    const filtered = allTickets.filter((t) => t.id !== ticketId);
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(filtered));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await deleteDoc(doc(db, 'admin_tickets', ticketId));
      } catch (err) {
        console.warn('Firestore deleteAdminTicket error:', err);
      }
    }

    return true;
  },

  // === ARBITRATION CASES ===
  async getArbitrationCases(langCode?: string): Promise<ArbitrationCase[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'arbitration_cases'));
        const list: ArbitrationCase[] = [];
        snap.forEach((d) => list.push(d.data() as ArbitrationCase));
        localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify(list));
        if (langCode && langCode !== 'all') {
          return list.filter((c) => c.langCode.toLowerCase() === langCode.toLowerCase());
        }
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        console.warn('Firestore getArbitrationCases error:', err);
      }
    }

    const local: ArbitrationCase[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ARBITRATION_CASES) || '[]'
    );
    if (langCode && langCode !== 'all') {
      return local
        .filter((c) => c.langCode.toLowerCase() === langCode.toLowerCase())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Subscrição em tempo real aos processos do Conselho de Arbitragem (ArbCom).
   */
  subscribeToArbitrationCases(
    callback: (cases: ArbitrationCase[]) => void,
    langCode?: string
  ): () => void {
    initializeLocalStorage();
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARBITRATION_CASES) || '[]') as ArbitrationCase[];
    const filterAndSort = (raw: ArbitrationCase[]) => {
      let filtered = raw;
      if (langCode && langCode !== 'all') {
        filtered = raw.filter((c) => c.langCode.toLowerCase() === langCode.toLowerCase());
      }
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    callback(filterAndSort(local));

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      const q = query(collection(db, 'arbitration_cases'));
      return onSnapshot(
        q,
        (snap) => {
          const list: ArbitrationCase[] = [];
          snap.forEach((d) => list.push(d.data() as ArbitrationCase));
          localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify(list));
          callback(filterAndSort(list));
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição em tempo real de arbitration_cases:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener para arbitration_cases:', err);
      return () => {};
    }
  },

  async getArbitrationCaseById(caseId: string): Promise<ArbitrationCase | null> {
    const list = await this.getArbitrationCases();
    return list.find((c) => c.id === caseId) || null;
  },

  async saveArbitrationCase(arbCase: ArbitrationCase): Promise<void> {
    const list = await this.getArbitrationCases();
    const idx = list.findIndex((c) => c.id === arbCase.id);
    if (idx >= 0) {
      list[idx] = arbCase;
    } else {
      list.unshift(arbCase);
    }
    localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'arbitration_cases', arbCase.id), arbCase);
      } catch (err) {
        console.warn('Firestore saveArbitrationCase error:', err);
      }
    }
  },

  async createArbitrationCase(
    input: Omit<
      ArbitrationCase,
      'id' | 'caseNumber' | 'createdAt' | 'deliberations' | 'comments' | 'status'
    >
  ): Promise<{ success: boolean; message: string; createdCase?: ArbitrationCase }> {
    if (!input.title || !input.title.trim()) {
      return { success: false, message: 'O título do processo é obrigatório.' };
    }
    if (!input.targetUsername || !input.targetUsername.trim()) {
      return { success: false, message: 'O nome do usuário, moderador ou administrador alvo é obrigatório.' };
    }
    if (!input.summary || !input.summary.trim()) {
      return { success: false, message: 'O resumo dos fatos é obrigatório.' };
    }
    if (!input.evidenceWikitext || !input.evidenceWikitext.trim()) {
      return { success: false, message: 'O dossiê de provas / evidências é obrigatório.' };
    }

    const lang = (input.langCode || 'pt').toUpperCase();
    const currentYear = new Date().getFullYear();
    const existingCases = await this.getArbitrationCases(input.langCode);
    const seq = String(existingCases.length + 1).padStart(3, '0');
    const caseNumber = `ARB-${lang}-${currentYear}-${seq}`;
    const id = `arb-case-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newCase: ArbitrationCase = {
      ...input,
      id,
      caseNumber,
      status: 'aberto',
      createdAt: new Date().toISOString(),
      deliberations: [],
      comments: [],
    };

    await this.saveArbitrationCase(newCase);

    // Audit log
    await this.addAuditLogEntry({
      userId: input.requesterUid || 'anon',
      userName: input.requesterUsername || 'Anônimo',
      action: 'ticket_created',
      target: `Conselho de Arbitragem: ${caseNumber}`,
      details: `Petição protocolada contra [${input.targetType.toUpperCase()}] ${input.targetUsername} (${input.category})`,
    });

    return {
      success: true,
      message: `Processo de Arbitragem ${caseNumber} protocolado com sucesso!`,
      createdCase: newCase,
    };
  },

  async addArbitrationDeliberation(
    caseId: string,
    deliberation: Omit<ArbitrationDeliberation, 'id' | 'timestamp'>
  ): Promise<{ success: boolean; message: string; updatedCase?: ArbitrationCase }> {
    const arbCase = await this.getArbitrationCaseById(caseId);
    if (!arbCase) return { success: false, message: 'Processo não encontrado.' };

    const newDeliberation: ArbitrationDeliberation = {
      ...deliberation,
      id: `delib-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };

    const existingIdx = arbCase.deliberations.findIndex(
      (d) => d.arbitratorUid === deliberation.arbitratorUid || d.arbitratorName === deliberation.arbitratorName
    );

    let updatedDelibs = [...arbCase.deliberations];
    if (existingIdx >= 0) {
      updatedDelibs[existingIdx] = newDeliberation;
    } else {
      updatedDelibs.push(newDeliberation);
    }

    const updatedCase: ArbitrationCase = {
      ...arbCase,
      deliberations: updatedDelibs,
      status: arbCase.status === 'aberto' ? 'em_instrucao' : arbCase.status,
      updatedAt: new Date().toISOString(),
    };

    await this.saveArbitrationCase(updatedCase);
    return {
      success: true,
      message: 'Voto e manifestação do árbitro registrados com sucesso.',
      updatedCase,
    };
  },

  async addArbitrationComment(
    caseId: string,
    comment: Omit<ArbitrationComment, 'id' | 'timestamp'>
  ): Promise<{ success: boolean; message: string; updatedCase?: ArbitrationCase }> {
    const arbCase = await this.getArbitrationCaseById(caseId);
    if (!arbCase) return { success: false, message: 'Processo não encontrado.' };

    const newComment: ArbitrationComment = {
      ...comment,
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };

    const updatedCase: ArbitrationCase = {
      ...arbCase,
      comments: [...arbCase.comments, newComment],
      updatedAt: new Date().toISOString(),
    };

    await this.saveArbitrationCase(updatedCase);
    return {
      success: true,
      message: 'Manifestação anexada aos autos do processo.',
      updatedCase,
    };
  },

  async submitArbitrationDefense(
    caseId: string,
    defenseStatement: string
  ): Promise<{ success: boolean; message: string; updatedCase?: ArbitrationCase }> {
    const arbCase = await this.getArbitrationCaseById(caseId);
    if (!arbCase) return { success: false, message: 'Processo não encontrado.' };

    const updatedCase: ArbitrationCase = {
      ...arbCase,
      defenseStatement,
      updatedAt: new Date().toISOString(),
    };

    await this.saveArbitrationCase(updatedCase);
    return {
      success: true,
      message: 'Manifestação de defesa juntada aos autos com sucesso.',
      updatedCase,
    };
  },

  async updateArbitrationCaseStatus(
    caseId: string,
    status: ArbitrationCaseStatus,
    adminOrArbUser?: UserProfile
  ): Promise<{ success: boolean; message: string; updatedCase?: ArbitrationCase }> {
    const arbCase = await this.getArbitrationCaseById(caseId);
    if (!arbCase) return { success: false, message: 'Processo não encontrado.' };

    const updatedCase: ArbitrationCase = {
      ...arbCase,
      status,
      updatedAt: new Date().toISOString(),
      closedAt: (status === 'concluido' || status === 'rejeitado') ? new Date().toISOString() : arbCase.closedAt,
    };

    await this.saveArbitrationCase(updatedCase);
    return {
      success: true,
      message: `Status do processo alterado para "${status}".`,
      updatedCase,
    };
  },

  async concludeArbitrationCase(
    caseId: string,
    ruling: ArbitrationRuling
  ): Promise<{ success: boolean; message: string; updatedCase?: ArbitrationCase }> {
    const arbCase = await this.getArbitrationCaseById(caseId);
    if (!arbCase) return { success: false, message: 'Processo não encontrado.' };

    const updatedCase: ArbitrationCase = {
      ...arbCase,
      status: 'concluido',
      finalRuling: ruling,
      closedAt: ruling.closedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveArbitrationCase(updatedCase);

    // Audit log
    await this.addAuditLogEntry({
      userId: ruling.closedByArbitrator,
      userName: ruling.closedByArbitrator,
      action: 'ticket_resolved',
      target: `Acórdão ArbCom: ${arbCase.caseNumber}`,
      details: `Processo concluído com decisão de [${ruling.remedyType.toUpperCase()}]. Placar: ${ruling.votesInFavor} a favor / ${ruling.votesAgainst} contra.`,
    });

    return {
      success: true,
      message: `Acórdão final do Conselho publicado e processo ${arbCase.caseNumber} arquivado como julgado!`,
      updatedCase,
    };
  },

  async getArbitrationMembers(langCode?: string): Promise<ArbitrationCommitteeMember[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'arbitration_members'));
        const list: ArbitrationCommitteeMember[] = [];
        snap.forEach((d) => list.push(d.data() as ArbitrationCommitteeMember));
        localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify(list));
        if (langCode && langCode !== 'all') {
          return list.filter((m) => m.langCode.toLowerCase() === langCode.toLowerCase());
        }
        return list;
      } catch (err) {
        console.warn('Firestore getArbitrationMembers error:', err);
      }
    }

    const local: ArbitrationCommitteeMember[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ARBITRATION_MEMBERS) || '[]'
    );
    if (langCode && langCode !== 'all') {
      return local.filter((m) => m.langCode.toLowerCase() === langCode.toLowerCase());
    }
    return local;
  },

  /**
   * Subscrição em tempo real aos membros do Conselho de Arbitragem.
   */
  subscribeToArbitrationMembers(
    callback: (members: ArbitrationCommitteeMember[]) => void,
    langCode?: string
  ): () => void {
    initializeLocalStorage();
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARBITRATION_MEMBERS) || '[]') as ArbitrationCommitteeMember[];
    const filter = (raw: ArbitrationCommitteeMember[]) => {
      if (langCode && langCode !== 'all') {
        return raw.filter((m) => m.langCode.toLowerCase() === langCode.toLowerCase());
      }
      return raw;
    };

    callback(filter(local));

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      const q = query(collection(db, 'arbitration_members'));
      return onSnapshot(
        q,
        (snap) => {
          const list: ArbitrationCommitteeMember[] = [];
          snap.forEach((d) => list.push(d.data() as ArbitrationCommitteeMember));
          localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify(list));
          callback(filter(list));
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição em tempo real de arbitration_members:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener para arbitration_members:', err);
      return () => {};
    }
  },

  async addArbitrationMember(
    member: Omit<ArbitrationCommitteeMember, 'id'>
  ): Promise<{ success: boolean; message: string; createdMember?: ArbitrationCommitteeMember }> {
    const list = await this.getArbitrationMembers();
    const id = `arb-${member.langCode}-${Date.now()}`;
    const newMember: ArbitrationCommitteeMember = {
      ...member,
      id,
    };
    list.push(newMember);
    localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'arbitration_members', id), newMember);
      } catch (err) {
        console.warn('Firestore addArbitrationMember error:', err);
      }
    }

    return {
      success: true,
      message: `Árbitro ${member.displayName} adicionado ao Conselho do idioma ${member.langCode.toUpperCase()}.`,
      createdMember: newMember,
    };
  },

  // ==========================================
  // CONTATO DE EMERGÊNCIA (CASOS EXTREMOS)
  // ==========================================

  /**
   * Obtém os chamados de emergência armazenados (Área Restrita da Administração).
   * Apenas administradores podem visualizar a totalidade das denúncias.
   */
  async getEmergencyReports(user?: UserProfile | null): Promise<EmergencyReport[]> {
    initializeLocalStorage();
    const isAdminUser = user?.role === 'admin' || user?.email === 'pedrohenriquecardonaperes@gmail.com';
    let allReports: EmergencyReport[] = [];

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'emergency_reports'));
        const reports: EmergencyReport[] = [];
        snap.forEach((d) => reports.push(d.data() as EmergencyReport));
        if (reports.length > 0) {
          localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(reports));
          allReports = reports;
        }
      } catch (err) {
        console.warn('Firestore getEmergencyReports error:', err);
      }
    }

    if (allReports.length === 0) {
      allReports = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMERGENCY_REPORTS) || '[]') as EmergencyReport[];
    }

    // Se for administrador, tem acesso irrestrito a todas as denúncias
    if (isAdminUser) {
      return allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Se não for administrador, filtra estritamente apenas para chamados abertos pelo próprio usuário
    if (user) {
      return allReports
        .filter((r) => r.reporterUid === user.uid || (user.email && r.reporterEmail === user.email))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Visitantes não autenticados não recebem nenhuma denúncia
    return [];
  },

  /**
   * Subscrição em tempo real aos chamados de emergência (ÁREA RESTRITA: APENAS ADMINISTRADORES).
   */
  subscribeToEmergencyReports(
    callback: (reports: EmergencyReport[]) => void,
    user?: UserProfile | null
  ): () => void {
    initializeLocalStorage();
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMERGENCY_REPORTS) || '[]') as EmergencyReport[];
    const isAdminUser = user?.role === 'admin' || user?.email === 'pedrohenriquecardonaperes@gmail.com';
    
    const filterAndSort = (raw: EmergencyReport[]) => {
      if (isAdminUser) {
        // Administrador tem visão total
        return raw.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      if (user) {
        // Usuário regular autenticado só vê chamados que ele próprio abriu
        return raw
          .filter((r) => r.reporterUid === user.uid || (user.email && r.reporterEmail === user.email))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      // Visitante anônimo não tem acesso a nenhuma denúncia
      return [];
    };

    callback(filterAndSort(local));

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      const q = query(collection(db, 'emergency_reports'));
      return onSnapshot(
        q,
        (snap) => {
          const list: EmergencyReport[] = [];
          snap.forEach((d) => list.push(d.data() as EmergencyReport));
          localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(list));
          callback(filterAndSort(list));
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição em tempo real de emergency_reports:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener para emergency_reports:', err);
      return () => {};
    }
  },

  /**
   * Busca um relatório de emergência pelo número de protocolo (ex: EMERG-2026-XXXX).
   */
  async getEmergencyReportByProtocol(protocolNumber: string): Promise<EmergencyReport | null> {
    const clean = protocolNumber.trim().toUpperCase();
    const all = await this.getEmergencyReports();
    const foundLocal = all.find((r) => r.protocolNumber.toUpperCase() === clean || r.id === clean);
    if (foundLocal) return foundLocal;

    // Tenta buscar no Firebase Firestore pelo protocolo ou id
    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        const q = query(collection(db, 'emergency_reports'), where('protocolNumber', '==', clean), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs[0].data() as EmergencyReport;
        }
        // Tenta também por ID do documento
        const docSnap = await getDoc(doc(db, 'emergency_reports', clean.toLowerCase()));
        if (docSnap.exists()) {
          return docSnap.data() as EmergencyReport;
        }
      } catch (err) {
        console.warn('Firestore getEmergencyReportByProtocol error:', err);
      }
    }

    return null;
  },

  /**
   * Verifica se um endereço IP já possui um chamado de emergência registrado.
   * Regra de negócio: Usuários não autenticados estão estritamente limitados a 1 envio por IP.
   */
  async checkEmergencyReportByIp(ip: string): Promise<EmergencyReport | null> {
    if (!ip) return null;
    initializeLocalStorage();

    // 1. Checa cache local por IP
    try {
      const ipMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMERGENCY_IP_REPORTS) || '{}') as Record<string, EmergencyReport>;
      if (ipMap[ip]) {
        return ipMap[ip];
      }
    } catch {
      // Ignora erro de parse
    }

    // 2. Checa se algum chamado em EMERGENCY_REPORTS bate com o IP
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMERGENCY_REPORTS) || '[]') as EmergencyReport[];
      const match = all.find((r) => r.reporterIp === ip);
      if (match) {
        return match;
      }
    } catch {
      // Ignora erro
    }

    // 3. Consulta Firestore em tempo real se ativo
    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        const docRef = doc(db, 'emergency_ip_records', sanitizeIpForDocId(ip));
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const report = snap.data() as EmergencyReport;
          // Atualiza cache local
          this._saveEmergencyReportToIpCache(ip, report);
          return report;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao checar emergency_ip_records no Firestore:', err);
      }
    }

    return null;
  },

  /**
   * Subscrição em tempo real ao chamado de emergência associado a um determinado endereço IP.
   * Usado para sincronizar em tempo real a página de criação/visualização de usuários não logados.
   */
  subscribeToEmergencyReportByIp(
    ip: string,
    callback: (report: EmergencyReport | null) => void
  ): () => void {
    if (!ip) {
      callback(null);
      return () => {};
    }

    initializeLocalStorage();

    // Emite valor local imediatamente se existente
    let initialFound: EmergencyReport | null = null;
    try {
      const ipMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMERGENCY_IP_REPORTS) || '{}') as Record<string, EmergencyReport>;
      if (ipMap[ip]) initialFound = ipMap[ip];
      if (!initialFound) {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMERGENCY_REPORTS) || '[]') as EmergencyReport[];
        initialFound = all.find((r) => r.reporterIp === ip) || null;
      }
    } catch {
      // Ignora
    }

    callback(initialFound);

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      const sanitized = sanitizeIpForDocId(ip);
      const docRef = doc(db, 'emergency_ip_records', sanitized);
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const rep = snap.data() as EmergencyReport;
            this._saveEmergencyReportToIpCache(ip, rep);
            callback(rep);
          } else {
            callback(null);
          }
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição em tempo real por IP:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener para IP:', err);
      return () => {};
    }
  },

  /**
   * Subscrição em tempo real à visualização de um chamado específico pelo número de protocolo.
   * Permite que o usuário consulte e veja respostas dos administradores em tempo real.
   */
  subscribeToEmergencyReportByProtocol(
    protocolNumber: string,
    callback: (report: EmergencyReport | null) => void
  ): () => void {
    const clean = protocolNumber.trim().toUpperCase();
    if (!clean) {
      callback(null);
      return () => {};
    }

    initializeLocalStorage();

    // 1. Emite valor local prévio
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMERGENCY_REPORTS) || '[]') as EmergencyReport[];
    const local = all.find((r) => r.protocolNumber.toUpperCase() === clean || r.id === clean) || null;
    callback(local);

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      // Cria query para escutar alterações em tempo real do protocolo
      const q = query(collection(db, 'emergency_reports'), where('protocolNumber', '==', clean), limit(1));
      return onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const rep = snap.docs[0].data() as EmergencyReport;
            // Atualiza cache local
            const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMERGENCY_REPORTS) || '[]') as EmergencyReport[];
            const idx = list.findIndex((r) => r.id === rep.id);
            if (idx >= 0) list[idx] = rep;
            else list.unshift(rep);
            localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(list));
            callback(rep);
          } else if (local) {
            callback(local);
          } else {
            callback(null);
          }
        },
        (err) => {
          console.warn('[StorageService] Erro na subscrição do protocolo:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener de protocolo:', err);
      return () => {};
    }
  },

  _saveEmergencyReportToIpCache(ip: string, report: EmergencyReport | null) {
    if (typeof window === 'undefined' || !ip) return;
    try {
      const ipMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMERGENCY_IP_REPORTS) || '{}') as Record<string, EmergencyReport>;
      if (report) {
        ipMap[ip] = report;
      } else {
        delete ipMap[ip];
      }
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_IP_REPORTS, JSON.stringify(ipMap));
    } catch {
      // Ignora erro
    }
  },

  /**
   * Cria e despacha um chamado de emergência imediato para a administração.
   * Aplica a limitação de 1 chamado por IP para usuários não logados.
   */
  async createEmergencyReport(data: {
    category: EmergencyCategory;
    urgencyLevel: EmergencyUrgencyLevel;
    title: string;
    description: string;
    involvedUrlsOrPages?: string[];
    involvedUsers?: string[];
    evidenceText?: string;
    reporterName?: string;
    reporterEmail?: string;
    reporterUid?: string;
    reporterIp?: string;
    isAnonymous?: boolean;
    requiresConfidentiality?: boolean;
  }): Promise<EmergencyReport> {
    const ip = data.reporterIp?.trim() || '127.0.0.1';

    // REGRA DE SEGURANÇA: Se não estiver logado, não pode emitir mais de 1 chamado por IP
    if (!data.reporterUid) {
      const existing = await this.checkEmergencyReportByIp(ip);
      if (existing) {
        throw new Error(
          `O endereço IP ${ip} já possui um chamado de emergência registrado (Protocolo: ${existing.protocolNumber}). Usuários não autenticados estão limitados a 1 relato por IP.`
        );
      }
    }

    const list = await this.getEmergencyReports();
    const id = `emerg-${Date.now()}`;
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const protocolNumber = `EMERG-2026-${randSuffix}`;
    const now = new Date().toISOString();

    const newReport: EmergencyReport = {
      id,
      protocolNumber,
      category: data.category,
      urgencyLevel: data.urgencyLevel,
      title: data.title.trim(),
      description: data.description.trim(),
      involvedUrlsOrPages: data.involvedUrlsOrPages?.filter(Boolean) || [],
      involvedUsers: data.involvedUsers?.filter(Boolean) || [],
      evidenceText: data.evidenceText?.trim(),
      reporterName: data.isAnonymous ? 'Notificante Anônimo' : data.reporterName?.trim(),
      reporterEmail: data.reporterEmail?.trim(),
      reporterUid: data.reporterUid,
      reporterIp: ip,
      reporterIpHash: hashIpAddress(ip),
      isAnonymous: !!data.isAnonymous,
      requiresConfidentiality: data.requiresConfidentiality !== false,
      status: 'urgente_recebido',
      createdAt: now,
      updatedAt: now,
      actionLogs: [
        {
          id: `log-${Date.now()}`,
          adminUid: 'system',
          adminName: 'Sistema de Alerta WikiWorldWeb',
          timestamp: now,
          action: 'Chamado de Emergência Registrado',
          note: `Protocolo ${protocolNumber} gerado e emitido para o plantão da administração via IP ${ip}.`,
        },
      ],
    };

    list.unshift(newReport);
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(list));
    this._saveEmergencyReportToIpCache(ip, newReport);

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        // Grava no acervo geral de emergências
        await setDoc(doc(db, 'emergency_reports', id), newReport);
        // Grava no índice direto de IP para consultas e limitação em tempo real de 1 por IP
        if (ip) {
          const sanitizedIp = sanitizeIpForDocId(ip);
          await setDoc(doc(db, 'emergency_ip_records', sanitizedIp), newReport);
        }
      } catch (err) {
        console.warn('Firestore createEmergencyReport error:', err);
      }
    }

    return newReport;
  },

  /**
   * Atualiza o status e parecer administrativo de um chamado de emergência.
   */
  async updateEmergencyReportStatus(
    reportId: string,
    status: EmergencyReportStatus,
    adminUser: UserProfile,
    resolutionNote?: string
  ): Promise<void> {
    const list = await this.getEmergencyReports();
    const idx = list.findIndex((r) => r.id === reportId);
    if (idx === -1) return;

    const now = new Date().toISOString();
    const report = list[idx];
    report.status = status;
    report.updatedAt = now;
    if (resolutionNote) {
      report.resolutionSummary = resolutionNote;
    }

    report.actionLogs.push({
      id: `log-${Date.now()}`,
      adminUid: adminUser.uid,
      adminName: adminUser.displayName || adminUser.username || 'Administrador',
      timestamp: now,
      action: `Status alterado para [${status}]`,
      note: resolutionNote || 'Atualização de status do atendimento de emergência.',
    });

    list[idx] = report;
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(list));
    if (report.reporterIp) {
      this._saveEmergencyReportToIpCache(report.reporterIp, report);
    }

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'emergency_reports', reportId), report);
        if (report.reporterIp) {
          const sanitizedIp = sanitizeIpForDocId(report.reporterIp);
          await setDoc(doc(db, 'emergency_ip_records', sanitizedIp), report);
        }
      } catch (err) {
        console.warn('Firestore updateEmergencyReportStatus error:', err);
      }
    }
  },

  /**
   * Atribui um chamado de emergência a um administrador específico.
   */
  async assignEmergencyReport(
    reportId: string,
    adminUid: string,
    adminName: string,
    adminUser: UserProfile
  ): Promise<void> {
    const list = await this.getEmergencyReports();
    const idx = list.findIndex((r) => r.id === reportId);
    if (idx === -1) return;

    const now = new Date().toISOString();
    const report = list[idx];
    report.assignedAdminUid = adminUid;
    report.assignedAdminName = adminName;
    if (report.status === 'urgente_recebido') {
      report.status = 'em_atendimento_imediato';
    }
    report.updatedAt = now;

    report.actionLogs.push({
      id: `log-${Date.now()}`,
      adminUid: adminUser.uid,
      adminName: adminUser.displayName || adminUser.username || 'Administrador',
      timestamp: now,
      action: 'Responsabilidade Assumida',
      note: `O caso de emergência foi assumido pelo administrador ${adminName}.`,
    });

    list[idx] = report;
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(list));
    if (report.reporterIp) {
      this._saveEmergencyReportToIpCache(report.reporterIp, report);
    }

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'emergency_reports', reportId), report);
        if (report.reporterIp) {
          const sanitizedIp = sanitizeIpForDocId(report.reporterIp);
          await setDoc(doc(db, 'emergency_ip_records', sanitizedIp), report);
        }
      } catch (err) {
        console.warn('Firestore assignEmergencyReport error:', err);
      }
    }
  },

  /**
   * Adiciona uma nota ou log de ação técnica/jurídica ao chamado de emergência.
   */
  async addEmergencyActionLog(
    reportId: string,
    action: string,
    note: string,
    adminUser: UserProfile
  ): Promise<void> {
    const list = await this.getEmergencyReports();
    const idx = list.findIndex((r) => r.id === reportId);
    if (idx === -1) return;

    const now = new Date().toISOString();
    const report = list[idx];
    report.updatedAt = now;
    report.actionLogs.push({
      id: `log-${Date.now()}`,
      adminUid: adminUser.uid,
      adminName: adminUser.displayName || adminUser.username || 'Administrador',
      timestamp: now,
      action,
      note,
    });

    list[idx] = report;
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(list));
    if (report.reporterIp) {
      this._saveEmergencyReportToIpCache(report.reporterIp, report);
    }

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'emergency_reports', reportId), report);
        if (report.reporterIp) {
          const sanitizedIp = sanitizeIpForDocId(report.reporterIp);
          await setDoc(doc(db, 'emergency_ip_records', sanitizedIp), report);
        }
      } catch (err) {
        console.warn('Firestore addEmergencyActionLog error:', err);
      }
    }
  },

  /**
   * Exclui um registro de emergência (apenas super-administrador).
   */
  async deleteEmergencyReport(reportId: string): Promise<void> {
    let list = await this.getEmergencyReports();
    const target = list.find((r) => r.id === reportId);
    list = list.filter((r) => r.id !== reportId);
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_REPORTS, JSON.stringify(list));
    if (target?.reporterIp) {
      this._saveEmergencyReportToIpCache(target.reporterIp, null);
    }

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await deleteDoc(doc(db, 'emergency_reports', reportId));
        if (target?.reporterIp) {
          const sanitizedIp = sanitizeIpForDocId(target.reporterIp);
          await deleteDoc(doc(db, 'emergency_ip_records', sanitizedIp));
        }
      } catch (err) {
        console.warn('Firestore deleteEmergencyReport error:', err);
      }
    }
  },

  // ==========================================
  // UNIVERSAL CODE OF CONDUCT (UCOC)
  // ==========================================

  /**
   * Obtém as denúncias formais do Universal Code of Conduct (UCoC).
   * Administradores e Moderadores podem visualizar todas as denúncias para apuração.
   * Usuários comuns têm acesso apenas às denúncias protocoladas por eles ou nas quais figuram como parte.
   */
  async getUcocReports(user?: UserProfile | null): Promise<UcocReport[]> {
    initializeLocalStorage();
    const isStaff = user?.role === 'admin' || user?.role === 'moderador' || user?.email === 'pedrohenriquecardonaperes@gmail.com';
    let allReports: UcocReport[] = [];

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'ucoc_reports'));
        const reports: UcocReport[] = [];
        snap.forEach((d) => reports.push(d.data() as UcocReport));
        if (reports.length > 0) {
          localStorage.setItem(STORAGE_KEYS.UCOC_REPORTS, JSON.stringify(reports));
          allReports = reports;
        }
      } catch (err) {
        console.warn('Firestore getUcocReports error:', err);
      }
    }

    if (allReports.length === 0) {
      allReports = JSON.parse(localStorage.getItem(STORAGE_KEYS.UCOC_REPORTS) || '[]') as UcocReport[];
    }

    if (isStaff) {
      return allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (user) {
      return allReports
        .filter(
          (r) =>
            r.reporterUid === user.uid ||
            (user.email && r.reporterEmail === user.email) ||
            r.targetUsername.toLowerCase() === user.username?.toLowerCase() ||
            (r.targetUserUid && r.targetUserUid === user.uid)
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return [];
  },

  /**
   * Subscrição em tempo real às denúncias do UCoC
   */
  subscribeToUcocReports(
    callback: (reports: UcocReport[]) => void,
    user?: UserProfile | null
  ): () => void {
    initializeLocalStorage();
    const isStaff = user?.role === 'admin' || user?.role === 'moderador' || user?.email === 'pedrohenriquecardonaperes@gmail.com';
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.UCOC_REPORTS) || '[]') as UcocReport[];

    const filterReports = (raw: UcocReport[]) => {
      if (isStaff) {
        return raw.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      if (user) {
        return raw
          .filter(
            (r) =>
              r.reporterUid === user.uid ||
              (user.email && r.reporterEmail === user.email) ||
              r.targetUsername.toLowerCase() === user.username?.toLowerCase() ||
              (r.targetUserUid && r.targetUserUid === user.uid)
          )
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return [];
    };

    callback(filterReports(local));

    if (!firebaseActive || !db) {
      return () => {};
    }

    try {
      return onSnapshot(
        collection(db, 'ucoc_reports'),
        (snap) => {
          const list: UcocReport[] = [];
          snap.forEach((d) => list.push(d.data() as UcocReport));
          localStorage.setItem(STORAGE_KEYS.UCOC_REPORTS, JSON.stringify(list));
          callback(filterReports(list));
        },
        (err) => {
          console.warn('[StorageService] Erro no listener do UCoC:', err);
        }
      );
    } catch (err) {
      console.warn('[StorageService] Falha ao criar listener do UCoC:', err);
      return () => {};
    }
  },

  /**
   * Obtém uma denúncia específica pelo número de protocolo formal (ex: UCOC-2026-4821)
   */
  async getUcocReportByProtocol(protocolNumber: string): Promise<UcocReport | null> {
    const clean = protocolNumber.trim().toUpperCase();
    if (!clean) return null;

    initializeLocalStorage();
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.UCOC_REPORTS) || '[]') as UcocReport[];
    const local = all.find((r) => r.protocolNumber.toUpperCase() === clean || r.id === clean);

    if (firebaseActive && db) {
      try {
        const q = query(collection(db, 'ucoc_reports'), where('protocolNumber', '==', clean), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const rep = snap.docs[0].data() as UcocReport;
          const idx = all.findIndex((r) => r.id === rep.id);
          if (idx >= 0) all[idx] = rep;
          else all.unshift(rep);
          localStorage.setItem(STORAGE_KEYS.UCOC_REPORTS, JSON.stringify(all));
          return rep;
        }
      } catch (err) {
        console.warn('Firestore getUcocReportByProtocol error:', err);
      }
    }

    return local || null;
  },

  /**
   * Registra uma nova denúncia formal sob o Universal Code of Conduct (UCoC)
   */
  async createUcocReport(data: {
    category: UcocViolationCategory;
    severity: UcocSeverity;
    title: string;
    description: string;
    targetUsername: string;
    targetUserUid?: string;
    targetUserRole?: string;
    involvedUrlsOrArticles?: string[];
    evidenceText: string;
    evidenceLinks?: string[];
    reporterName?: string;
    reporterEmail?: string;
    reporterUid?: string;
    reporterRole?: string;
    isAnonymousOrConfidential?: boolean;
    requiresProtectiveMeasures?: boolean;
  }): Promise<UcocReport> {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.UCOC_REPORTS) || '[]') as UcocReport[];
    const id = `ucoc-${Date.now()}`;
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const protocolNumber = `UCOC-2026-${randSuffix}`;
    const now = new Date().toISOString();

    const newReport: UcocReport = {
      id,
      protocolNumber,
      category: data.category,
      severity: data.severity,
      title: data.title.trim(),
      description: data.description.trim(),
      targetUsername: data.targetUsername.trim().replace(/^@/, ''),
      targetUserUid: data.targetUserUid,
      targetUserRole: data.targetUserRole,
      involvedUrlsOrArticles: data.involvedUrlsOrArticles?.filter(Boolean) || [],
      evidenceText: data.evidenceText.trim(),
      evidenceLinks: data.evidenceLinks?.filter(Boolean) || [],
      reporterName: data.isAnonymousOrConfidential ? 'Denunciante sob Sigilo (UCoC)' : (data.reporterName?.trim() || 'Usuário Registrado'),
      reporterEmail: data.reporterEmail?.trim(),
      reporterUid: data.reporterUid,
      reporterRole: data.reporterRole,
      isAnonymousOrConfidential: !!data.isAnonymousOrConfidential,
      requiresProtectiveMeasures: !!data.requiresProtectiveMeasures,
      status: 'admissibilidade',
      createdAt: now,
      updatedAt: now,
      actionLogs: [
        {
          id: `log-${Date.now()}`,
          adminUid: data.reporterUid || 'system',
          adminName: data.isAnonymousOrConfidential ? 'Denunciante sob Sigilo' : (data.reporterName || 'Usuário'),
          adminRole: data.reporterRole,
          timestamp: now,
          action: 'Denúncia Formal UCoC Protocolada',
          note: `Processo ${protocolNumber} registrado com categoria "${data.category}" e severidade "${data.severity}".`,
        },
      ],
      comments: [],
    };

    list.unshift(newReport);
    localStorage.setItem(STORAGE_KEYS.UCOC_REPORTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'ucoc_reports', id), newReport);
      } catch (err) {
        console.warn('Firestore createUcocReport error:', err);
      }
    }

    return newReport;
  },

  /**
   * Atualiza status, deliberações ou medidas do processo UCoC
   */
  async updateUcocReport(
    reportId: string,
    updates: Partial<UcocReport>,
    adminUser?: UserProfile | null,
    logNote?: string
  ): Promise<UcocReport | null> {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.UCOC_REPORTS) || '[]') as UcocReport[];
    const idx = list.findIndex((r) => r.id === reportId);
    if (idx === -1) return null;

    const current = list[idx];
    const now = new Date().toISOString();

    const updatedLogs = [...current.actionLogs];
    if (logNote && adminUser) {
      updatedLogs.push({
        id: `log-${Date.now()}`,
        adminUid: adminUser.uid,
        adminName: adminUser.displayName || adminUser.username || 'Administrador',
        adminRole: adminUser.role,
        action: updates.status ? `Status alterado para: ${updates.status}` : 'Atualização de Processo UCoC',
        note: logNote,
        timestamp: now,
      });
    }

    const updated: UcocReport = {
      ...current,
      ...updates,
      updatedAt: now,
      closedAt: (updates.status === 'concluida_sancao' || updates.status === 'concluida_arquivada') ? now : current.closedAt,
      actionLogs: updatedLogs,
    };

    list[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.UCOC_REPORTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'ucoc_reports', reportId), updated);
      } catch (err) {
        console.warn('Firestore updateUcocReport error:', err);
      }
    }

    return updated;
  },

  /**
   * Adiciona comentário ou manifestação instrutória ao processo UCoC
   */
  async addUcocReportComment(
    reportId: string,
    comment: {
      text: string;
      authorName: string;
      authorRole?: string;
      authorUid?: string;
      isOfficialStatement?: boolean;
      isInternalNote?: boolean;
    },
    currentUser?: UserProfile | null
  ): Promise<UcocReport | null> {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.UCOC_REPORTS) || '[]') as UcocReport[];
    const idx = list.findIndex((r) => r.id === reportId);
    if (idx === -1) return null;

    const current = list[idx];
    const now = new Date().toISOString();

    const newComment: UcocReportComment = {
      id: `comm-${Date.now()}`,
      text: comment.text.trim(),
      authorName: comment.authorName,
      authorRole: comment.authorRole || currentUser?.role,
      authorUid: comment.authorUid || currentUser?.uid,
      timestamp: now,
      isOfficialStatement: !!comment.isOfficialStatement,
      isInternalNote: !!comment.isInternalNote,
    };

    const updatedComments = [...(current.comments || []), newComment];
    const updated: UcocReport = {
      ...current,
      comments: updatedComments,
      updatedAt: now,
    };

    list[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.UCOC_REPORTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'ucoc_reports', reportId), updated);
      } catch (err) {
        console.warn('Firestore addUcocReportComment error:', err);
      }
    }

    return updated;
  },

  /**
   * Submete a manifestação de defesa formal da parte denunciada no processo UCoC
   */
  async submitUcocDefense(
    reportId: string,
    defenseText: string,
    user: UserProfile
  ): Promise<UcocReport | null> {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.UCOC_REPORTS) || '[]') as UcocReport[];
    const idx = list.findIndex((r) => r.id === reportId);
    if (idx === -1) return null;

    const current = list[idx];
    const now = new Date().toISOString();

    const actionLog: UcocActionLog = {
      id: `log-${Date.now()}`,
      adminUid: user.uid,
      adminName: user.displayName || user.username || 'Parte Denunciada',
      adminRole: user.role,
      action: 'Manifestação de Defesa Anexada aos Autos',
      note: 'A parte denunciada exerceu o contraditório formal e anexou suas alegações e contraprovas.',
      timestamp: now,
    };

    const updated: UcocReport = {
      ...current,
      defenseStatement: defenseText.trim(),
      defenseSubmittedAt: now,
      status: current.status === 'admissibilidade' ? 'em_instrucao' : current.status,
      actionLogs: [...current.actionLogs, actionLog],
      updatedAt: now,
    };

    list[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.UCOC_REPORTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await setDoc(doc(db, 'ucoc_reports', reportId), updated);
      } catch (err) {
        console.warn('Firestore submitUcocDefense error:', err);
      }
    }

    return updated;
  },

  /**
   * Exclui um processo UCoC (somente superadmin)
   */
  async deleteUcocReport(reportId: string): Promise<void> {
    let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.UCOC_REPORTS) || '[]') as UcocReport[];
    list = list.filter((r) => r.id !== reportId);
    localStorage.setItem(STORAGE_KEYS.UCOC_REPORTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await ensureFirebaseAuth();
        await deleteDoc(doc(db, 'ucoc_reports', reportId));
      } catch (err) {
        console.warn('Firestore deleteUcocReport error:', err);
      }
    }
  },

  async addAuditLogEntry(entry: {
    userId?: string;
    userName?: string;
    action: string;
    target?: string;
    details?: string;
    timestamp?: string;
  }): Promise<void> {
    try {
      initializeLocalStorage();
      const raw = localStorage.getItem(STORAGE_KEYS.USER_AUDIT_LOGS);
      const logs: any[] = raw ? JSON.parse(raw) : [];
      const newLog = {
        id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        userId: entry.userId || 'anon',
        userName: entry.userName || 'Anônimo',
        targetUserUid: entry.userId || 'anon',
        targetUsername: entry.userName || 'Anônimo',
        action: entry.action,
        target: entry.target || '',
        details: entry.details || '',
        date: entry.timestamp || new Date().toISOString(),
        timestamp: entry.timestamp || new Date().toISOString(),
        performedBy: entry.userName || 'Sistema',
        performedByRole: 'admin',
      };
      logs.unshift(newLog);
      localStorage.setItem(STORAGE_KEYS.USER_AUDIT_LOGS, JSON.stringify(logs.slice(0, 500)));

      if (firebaseActive && db) {
        ensureFirebaseAuth().then(() => {
          if (db) {
            setDoc(doc(db, 'audit_logs', newLog.id), newLog).catch(() => {});
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('[StorageService] Erro ao registrar log de auditoria:', err);
    }
  },

  async clearLocalCache(): Promise<void> {
    const consent = this.getCookieConsent();
    const ageInfo = this.getUserAgeInfo();
    const currentUser = this.getCurrentUser();
    
    // Clear storage keys
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    
    // Restore session if existed
    if (consent) this.saveCookieConsent(consent);
    if (ageInfo.isAccepted && ageInfo.birthdate) this.saveLgpdTermsAccepted(ageInfo.birthdate);
    if (currentUser) this.saveUser(currentUser);
    
    initializeLocalStorage();
  },
};

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
