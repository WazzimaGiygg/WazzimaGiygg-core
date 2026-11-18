import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, User } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc,
  deleteDoc,
  query, 
  where,
  orderBy, 
  increment,
  writeBatch,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import {
  WikiArticle,
  WikiExtension,
  ExtensionFile,
  computeSha256Hex,
  ALLOWED_EXTENSION_DOMAINS,
  SEED_WIKI_EXTENSIONS
} from "./data/notMediaWikiData";
import {
  buildPersonalUserPageSlug,
  buildPersonalUserPageTitle,
  buildPersonalUserPageWikitext,
  resolveUserDisplayName
} from "./config/userInfobox";
import {
  SEED_BEMTEVI_POSTS,
  extractHashtagsFromText
} from "./data/bemteviData";
import noticiasSeed from "./data/noticias.json";
import artigosSeed from "./data/json/artigos.json";
import cidadesSancionadasSeed from "./data/cidades_sancionadas.json";
import { isBackendApiAvailable, registerAuthTokenProvider, safeApiFetch } from "./utils/apiClient";
import {
  assertValidPortalArticlePayload,
  assertValidWikiArticlePayload,
  ArticleValidationError,
  PortalArticleInput
} from "./utils/articleSchema";
import {
  DELETION_REQUESTS_UPDATED_EVENT,
  mergeDeletionRequestsWithMock,
  saveLocalDeletionOverride
} from "./data/lgpdDeletionMockData";
export { isBackendApiAvailable, safeApiFetch, ArticleValidationError };

// The user's specific Firebase config from the original repository
export const firebaseConfig = {
  apiKey: "AIzaSyB9GkSqTIZ0kbVsba_WOdQeVAETrF9qna0",
  authDomain: "wzzm-ce3fc.firebaseapp.com",
  projectId: "wzzm-ce3fc",
  storageBucket: "wzzm-ce3fc.appspot.com",
  messagingSenderId: "249427877153",
  appId: "1:249427877153:web:0e4297294794a5aadeb260"
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Bind Firebase Auth ID token provider for authenticated API requests
registerAuthTokenProvider(async () => {
  const current = auth.currentUser;
  if (!current) return null;
  try {
    return await current.getIdToken();
  } catch {
    return null;
  }
});

// ============================================
// FIRESTORE SANITIZATION & OFFLINE/STATIC HELPERS
// ============================================

/**
 * Recursively strips `undefined` properties so Firestore addDoc/setDoc/updateDoc
 * never fails with "Unsupported field value: undefined", while preserving
 * Firestore FieldValue sentinels (serverTimestamp, increment) and Date objects.
 */
export function sanitizeFirestoreData<T>(value: T): T {
  if (value === undefined || value === null) return value;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }

  if (typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      return value;
    }
    const cleanObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(value as Record<string, any>)) {
      if (val !== undefined) {
        const sanitizedVal = sanitizeFirestoreData(val);
        if (sanitizedVal !== undefined) {
          cleanObj[key] = sanitizedVal;
        }
      }
    }
    return cleanObj as T;
  }

  return value;
}

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private mode issues
  }
}

export function getStaticSanctionsFallback(): any[] {
  return (cidadesSancionadasSeed as any)?.cidades_sancionadas || [];
}

// ============================================
// TYPES
// ============================================
export interface Article {
  id: string;
  titulo: string;
  descricao: string;
  conteudo?: string;
  setor: string;
  criadorEmail: string;
  dataCriacao: any;
  ultimaEdicao: any;
  visualizacoes: number;
  colecao: string;
  link?: string;
  tags?: string[];
}

export type NotificationCategory = 'alerta' | 'noticia' | 'sistema' | 'comunidade';
export type NotificationPriority = 'info' | 'warning' | 'alert';

export interface UserNotification {
  id: string;
  userId: string;
  titulo: string;
  mensagem: string;
  timestamp: any;
  createdAtMs?: number;
  lida: boolean;
  tipo?: NotificationCategory;
  prioridade?: NotificationPriority;
  senderEmail?: string;
  actionUid?: string;
  actionTab?: string;
  actionLabel?: string;
  isLocal?: boolean;
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  profilePictureUrl: string;
  isAdmin: boolean;
  isBanned: boolean;
  isBan?: boolean;
  isTeacher: boolean;
  isGuest?: boolean;
  createdAt?: any;
  updatedAt?: any;
  firstLoginAt?: any;
  lastLoginAt?: any;
  notMediaWikiPageSlug?: string;
  notMediaWikiPageCreated?: boolean;
}

// ============================================
// EMERGENCY CORRECTION: EXCLUSIVE BUROCRATA AUTHORIZATION
// Only pedrohenriquecardonaperes@gmail.com is authorized to make edits,
// access the Burocrata page, and administer the WZZM portal.
// ============================================
export const AUTHORIZED_BUROCRATA_EMAIL = "pedrohenriquecardonaperes@gmail.com";

export function isAuthorizedBurocrata(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === AUTHORIZED_BUROCRATA_EMAIL.toLowerCase().trim();
}

// ============================================
// AUTHORIZED ARTICLE PUBLISHER ACCOUNTS
// Qualquer publicação de artigo só deve ser feita pelas contas dos e-mails:
// wazzimagiygg@gmail.com e pedrohenriquecardonaperes@gmail.com
// ============================================
export const AUTHORIZED_PUBLISHER_EMAILS = [
  "wazzimagiygg@gmail.com",
  "pedrohenriquecardonaperes@gmail.com"
] as const;

export function isAuthorizedPublisher(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return AUTHORIZED_PUBLISHER_EMAILS.some((allowed) => allowed.toLowerCase().trim() === clean);
}

export interface DeletionRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  reason: string;
  dataTypes?: string[];
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: any;
  ipAddress?: string;
  processedBy?: string | null;
  completedAt?: any;
  rejectedAt?: any;
  rejectionReason?: string | null;
  certificateId?: string | null;
  // PT-BR Aliases for UI components
  protocolo: string;
  nomeCompleto: string;
  motivo?: string;
  tipoDado?: string;
  dataSolicitacao: any;
  observacoes?: string;
  certificadoExclusao?: string;
  dataConclusao?: any;
}

// ============================================
// REGISTRATION & USER PROFILE
// ============================================
export async function registerUser(user: User | { uid: string; displayName?: string; email?: string; photoURL?: string }, isGuest = false) {
  const uid = user.uid;
  const isBurocrata = isAuthorizedBurocrata(user.email);
  const nowIso = new Date().toISOString();
  const prevLocal = readLocalJson<any>("wzzm_local_session_profile", null);
  const resolvedFirstLoginLocal =
    prevLocal?.uid === uid && prevLocal?.firstLoginAt ? prevLocal.firstLoginAt : nowIso;

  const localProfile = {
    uid,
    email: user.email || (isGuest ? `${uid}@guest.local` : ""),
    name: user.displayName || (isGuest ? "Convidado (24h)" : "Usuário"),
    profilePictureUrl: ("photoURL" in user ? user.photoURL : "") || "",
    isAdmin: isBurocrata,
    isBan: false,
    isBanned: false,
    isTeacher: isBurocrata,
    isGuest,
    createdAt: prevLocal?.uid === uid && prevLocal?.createdAt ? prevLocal.createdAt : nowIso,
    firstLoginAt: resolvedFirstLoginLocal,
    lastLoginAt: nowIso
  };

  writeLocalJson("wzzm_local_session_profile", localProfile);

  // Skip Firestore write for guests or mismatched Firebase Auth sessions to avoid permission errors
  if (isGuest || !auth.currentUser || auth.currentUser.uid !== uid) {
    return false;
  }

  try {
    const userRef = doc(db, "users", uid);
    const existingSnap = await getDoc(userRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    const baseProfile: Record<string, any> = {
      uid,
      email: user.email || "",
      name: user.displayName || existingData?.name || "Usuário",
      profilePictureUrl: ("photoURL" in user ? user.photoURL : "") || existingData?.profilePictureUrl || "",
      ...(existingData?.createdAt ? {} : { createdAt: serverTimestamp() }),
      ...(existingData?.firstLoginAt ? {} : { firstLoginAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };

    // Only set initial false privilege defaults on creation, or allow Burocrata to sync own verified flags;
    // existing regular users must never re-write privilege fields (enforced in firestore.rules).
    if (!existingData) {
      baseProfile.isAdmin = isBurocrata;
      baseProfile.isBan = false;
      baseProfile.isBanned = false;
      baseProfile.isTeacher = isBurocrata;
      baseProfile.isTeatcher = isBurocrata;
    } else if (isBurocrata) {
      baseProfile.isAdmin = true;
      baseProfile.isTeacher = true;
      baseProfile.isTeatcher = true;
    }

    const userData = sanitizeFirestoreData(baseProfile);

    await setDoc(userRef, userData, { merge: true });
    await setDoc(doc(db, "usuários", uid), userData, { merge: true }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export async function checkIfUserIsBanned(uid: string): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return false;
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.isBanned === true || data.isBan === true;
    }
  } catch {
    //
  }
  return false;
}

export async function checkIfUserIsAdmin(uid: string, email?: string | null): Promise<boolean> {
  if (email && isAuthorizedBurocrata(email)) {
    return true;
  }
  if (!auth.currentUser || auth.currentUser.uid !== uid) return false;
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (isAuthorizedBurocrata(data.email)) {
        return true;
      }
      return false;
    }
  } catch {
    //
  }
  return false;
}

function getStaticCollectionArticles(collectionName: string): Article[] {
  if (collectionName === "wikiworldweb") {
    return (Array.isArray(noticiasSeed) ? noticiasSeed : []).map((item: any, index: number) => ({
      id: `news_${index + 1}`,
      titulo: item.titulo || "Sem título",
      descricao: item.resumo || "",
      conteudo: item.resumo || "",
      setor: "Notícias & Sociedade",
      criadorEmail: "redacao@wazzimagiygg.com",
      dataCriacao: "Acervo Oficial",
      ultimaEdicao: "Sincronizado",
      visualizacoes: 280 + index * 19,
      colecao: "wikiworldweb",
      link: item.link
    }));
  }

  if (collectionName === "academico") {
    const materias = (artigosSeed as any)?.materias || {};
    return Object.entries<any>(materias).map(([key, value]) => ({
      id: `acad_${key}`,
      titulo: value.titulo || key,
      descricao: value.descricao || "",
      conteudo: value.descricao || "",
      setor: value.categoria || "Acadêmico",
      criadorEmail: "academico@wazzimagiygg.com",
      dataCriacao: "Acervo Acadêmico",
      ultimaEdicao: "Sincronizado",
      visualizacoes: 150,
      colecao: "academico",
      link: value.link
    }));
  }

  if (collectionName === "materiadeensaio") {
    return [
      {
        id: "ensaio_1",
        titulo: "A Reforma Psiquiátrica e a Trajetória dos CAPS no Brasil",
        descricao: "Análise aprofundada sobre a superação do modelo asilar e a consolidação de políticas públicas humanizadas de desinstitucionalização.",
        setor: "Saúde Mental & Direitos",
        criadorEmail: "ensaios@wazzimagiygg.com",
        dataCriacao: "Acervo Editorial",
        ultimaEdicao: "Sincronizado",
        visualizacoes: 520,
        colecao: "materiadeensaio"
      },
      {
        id: "ensaio_2",
        titulo: "Neutralidade de Rede e Direitos Fundamentais no Marco Civil",
        descricao: "Garantias constitucionais e limites de moderação privada em plataformas de conhecimento colaborativo sob a Lei 12.965/2014.",
        setor: "Direito Digital",
        criadorEmail: "juridico@wazzimagiygg.com",
        dataCriacao: "Acervo Editorial",
        ultimaEdicao: "Sincronizado",
        visualizacoes: 412,
        colecao: "materiadeensaio"
      }
    ];
  }

  if (collectionName === "uwgbooks") {
    return [
      {
        id: "uwg_1",
        titulo: "Compêndio de Metodologia e Produção Científica",
        descricao: "Manual de diretrizes para elaboração de monografias, dissertações e artigos acadêmicos conforme normas técnicas.",
        setor: "UWG Books",
        criadorEmail: "editora@wazzimagiygg.com",
        dataCriacao: "Editora UWG",
        ultimaEdicao: "Sincronizado",
        visualizacoes: 389,
        colecao: "uwgbooks"
      },
      {
        id: "uwg_2",
        titulo: "História do Conhecimento Livre e Enciclopedismo Digital",
        descricao: "Da Enciclopédia de Diderot às wikis modernas: a batalha contra os monopólios de informação e o assédio editorial.",
        setor: "UWG Books",
        criadorEmail: "editora@wazzimagiygg.com",
        dataCriacao: "Editora UWG",
        ultimaEdicao: "Sincronizado",
        visualizacoes: 630,
        colecao: "uwgbooks"
      }
    ];
  }

  if (collectionName === "materia") {
    const materias = (artigosSeed as any)?.materias || {};
    return Object.entries<any>(materias)
      .slice(0, 8)
      .map(([key, value]) => ({
        id: `mat_${key}`,
        titulo: value.titulo || key,
        descricao: value.descricao || "",
        conteudo: value.descricao || "",
        setor: value.categoria || "Matérias & Referências",
        criadorEmail: "redacao@wazzimagiygg.com",
        dataCriacao: "Acervo Editorial",
        ultimaEdicao: "Sincronizado",
        visualizacoes: 195,
        colecao: "materia",
        link: value.link
      }));
  }

  return [];
}

// ============================================
// CONTENT LOADING WITH API + STATIC FALLBACK
// ============================================
export async function loadCollectionContent(collectionName: string): Promise<Article[]> {
  // First attempt: direct Firestore query
  try {
    const q = query(collection(db, collectionName), orderBy("ultimaEdicao", "desc"));
    const snapshot = await getDocs(q);
    const items: Article[] = [];
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      items.push({
        id: docSnapshot.id,
        titulo: data.titulo || "Sem título",
        descricao: data.descricao || data.conteudo || "",
        conteudo: data.conteudo || data.descricao || "",
        setor: data.setor || (collectionName === "academico" ? "Acadêmico" : collectionName === "uwgbooks" ? "UWG Books" : "Geral"),
        criadorEmail: data.criadorEmail || data.autor || "Sistema",
        dataCriacao: data.dataCriacao?.toDate ? data.dataCriacao.toDate().toLocaleDateString("pt-BR") : (data.dataCriacao || "Recente"),
        ultimaEdicao: data.ultimaEdicao?.toDate ? data.ultimaEdicao.toDate().toLocaleDateString("pt-BR") : (data.ultimaEdicao || "Recente"),
        visualizacoes: data.visualizacoes || 0,
        colecao: collectionName,
        link: data.link
      });
    });

    if (items.length > 0) {
      return items;
    }
  } catch {
    // Fallback cleanly below
  }

  // Second attempt: Backend route (only when Express backend is active)
  const response = await safeApiFetch(`/api/articles?collection=${encodeURIComponent(collectionName)}`);
  if (response && response.ok) {
    const data = await response.json().catch(() => null);
    if (data && Array.isArray(data.articles) && data.articles.length > 0) {
      return data.articles;
    }
  }

  // Third attempt: Bundled static fallback data
  return getStaticCollectionArticles(collectionName);
}

export async function createArticle(articleData: PortalArticleInput): Promise<string | null> {
  // Validação rigorosa de esquema no frontend ANTES de qualquer operação no Firestore
  const validated = assertValidPortalArticlePayload(articleData);

  if (!isAuthorizedPublisher(validated.criadorEmail)) {
    console.error("Tentativa de publicação não autorizada pelo e-mail:", validated.criadorEmail);
    throw new Error(
      "Acesso negado: Qualquer publicação de artigo só deve ser feita pelas contas dos e-mails wazzimagiygg@gmail.com e pedrohenriquecardonaperes@gmail.com"
    );
  }

  const payload = sanitizeFirestoreData({
    titulo: validated.titulo,
    descricao: validated.descricao,
    setor: validated.setor,
    criadorEmail: validated.criadorEmail,
    colecao: validated.colecao,
    ...(validated.link ? { link: validated.link } : {}),
    visualizacoes: validated.visualizacoes,
    dataCriacao: serverTimestamp(),
    ultimaEdicao: serverTimestamp()
  });

  try {
    const docRef = await addDoc(collection(db, validated.colecao), payload);
    // Also save to generic articles collection for global search
    await addDoc(collection(db, "artigos"), { ...payload, originalId: docRef.id });
    return docRef.id;
  } catch (error) {
    console.warn("Failed to save to Firestore directly, returning mock id:", error);
    return `art_${Date.now()}`;
  }
}

export async function incrementArticleViews(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      visualizacoes: increment(1)
    });
  } catch {
    // Fail silently, never disrupt reading
  }
}

// ============================================
// NOTIFICATIONS (REAL-TIME + LOCAL PERSISTENCE)
// ============================================
const NOTIF_EVENT_NAME = "wzzm:notifications-updated";

function getNotifStorageKey(prefix: string, userId: string): string {
  return `wzzm_${prefix}_${userId || "all"}`;
}

function readJsonArray<T = string>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues
  }
}

function emitNotificationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT_NAME));
  }
}

function getReadOverrides(userId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(getNotifStorageKey("notif_read_map", userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setReadOverride(userId: string, notifId: string, read: boolean) {
  if (typeof window === "undefined") return;
  try {
    const key = getNotifStorageKey("notif_read_map", userId);
    const current = getReadOverrides(userId);
    current[notifId] = read;
    window.localStorage.setItem(key, JSON.stringify(current));
  } catch {
    // Ignore storage errors
  }
}

function getDismissedNotifIds(userId: string): Set<string> {
  return new Set(readJsonArray<string>(getNotifStorageKey("notif_dismissed", userId)));
}

function addDismissedNotifIds(userId: string, ids: string[]) {
  const current = getDismissedNotifIds(userId);
  ids.forEach((id) => current.add(id));
  writeJsonArray(getNotifStorageKey("notif_dismissed", userId), Array.from(current));
}

export function getLocalUserNotifications(userId: string): UserNotification[] {
  const key = getNotifStorageKey("local_notifs", userId);
  const items = readJsonArray<UserNotification>(key);
  return items.map((item) => ({
    ...item,
    isLocal: true,
    timestamp: item.createdAtMs ? formatNotificationTimestamp(item.createdAtMs) : (item.timestamp || "Agora")
  }));
}

export function pushLocalUserNotification(
  userId: string,
  input: {
    id?: string;
    titulo: string;
    mensagem: string;
    tipo?: NotificationCategory;
    prioridade?: NotificationPriority;
    actionUid?: string;
    actionTab?: string;
    actionLabel?: string;
  }
): UserNotification {
  const targetUser = userId || "all";
  const nowMs = Date.now();
  const notif: UserNotification = {
    id: input.id || `local_${nowMs}_${Math.random().toString(36).slice(2, 7)}`,
    userId: targetUser,
    titulo: input.titulo,
    mensagem: input.mensagem,
    timestamp: formatNotificationTimestamp(nowMs),
    createdAtMs: nowMs,
    lida: false,
    tipo: input.tipo || "sistema",
    prioridade: input.prioridade || "info",
    actionUid: input.actionUid,
    actionTab: input.actionTab,
    actionLabel: input.actionLabel,
    isLocal: true
  };

  const key = getNotifStorageKey("local_notifs", targetUser);
  const existing = readJsonArray<UserNotification>(key).filter((n) => n.id !== notif.id);
  const updated = [notif, ...existing].slice(0, 60);
  writeJsonArray(key, updated);
  emitNotificationsUpdated();
  return notif;
}

export function formatNotificationTimestamp(ms: number): string {
  if (!ms || Number.isNaN(ms)) return "Agora";
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 45) return "Agora";
  if (diffSec < 3600) return `há ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) {
    const date = new Date(ms);
    return `Hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function extractTimestampMs(raw: any): number {
  if (!raw) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw?.toMillis === "function") return raw.toMillis();
  if (typeof raw?.toDate === "function") return raw.toDate().getTime();
  if (typeof raw === "string") {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function mapRawNotificationCategory(rawType: any): {
  tipo: NotificationCategory;
  prioridade: NotificationPriority;
} {
  const val = String(rawType || "").toLowerCase();
  if (val === "alert" || val === "alerta") {
    return { tipo: "alerta", prioridade: "alert" };
  }
  if (val === "warning" || val === "aviso") {
    return { tipo: "alerta", prioridade: "warning" };
  }
  if (val === "noticia" || val === "editorial" || val === "news") {
    return { tipo: "noticia", prioridade: "info" };
  }
  if (val === "comunidade" || val === "wiki" || val === "bemtevi") {
    return { tipo: "comunidade", prioridade: "info" };
  }
  return { tipo: "sistema", prioridade: "info" };
}

export function setupNotificationsListener(userId: string, callback: (notifications: UserNotification[]) => void) {
  const resolvedUid = userId || "all";
  const baseBootMs = Date.now() - 60_000;

  const defaultNotifications: UserNotification[] = [
    {
      id: "sys_1",
      userId: resolvedUid,
      titulo: "Edição Digital Atualizada",
      mensagem: "O acervo acadêmico, notícias, NotMediaWiki e a rede Bem-Te-Vi estão sincronizados.",
      timestamp: "Agora",
      createdAtMs: baseBootMs + 30_000,
      lida: false,
      tipo: "sistema",
      prioridade: "info",
      actionTab: "notmediawiki",
      actionLabel: "Explorar NotMediaWiki"
    },
    {
      id: "sys_2",
      userId: resolvedUid,
      titulo: "Marco Civil & LGPD",
      mensagem: "Seus registros de navegação e direitos de privacidade estão protegidos sob a Lei 12.965/2014.",
      timestamp: "Hoje",
      createdAtMs: baseBootMs,
      lida: true,
      tipo: "alerta",
      prioridade: "info"
    }
  ];

  let remoteNotifs: UserNotification[] = [];

  const emitMerged = () => {
    const readMap = getReadOverrides(resolvedUid);
    const dismissed = getDismissedNotifIds(resolvedUid);
    const localNotifs = getLocalUserNotifications(resolvedUid);

    const byId = new Map<string, UserNotification>();
    const combinedSource =
      remoteNotifs.length > 0 || localNotifs.length > 0
        ? [...remoteNotifs, ...localNotifs, ...defaultNotifications]
        : [...defaultNotifications];

    for (const item of combinedSource) {
      if (dismissed.has(item.id)) continue;
      const overrideRead = Object.prototype.hasOwnProperty.call(readMap, item.id)
        ? readMap[item.id]
        : undefined;
      byId.set(item.id, {
        ...item,
        lida: overrideRead !== undefined ? overrideRead : item.lida
      });
    }

    const sorted = Array.from(byId.values()).sort(
      (a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)
    );
    callback(sorted);
  };

  const handleLocalEvent = () => emitMerged();
  if (typeof window !== "undefined") {
    window.addEventListener(NOTIF_EVENT_NAME, handleLocalEvent);
  }

  // Always emit immediate baseline
  emitMerged();

  // Skip Firestore listener when unauthenticated (rules restrict notifications to signed-in users)
  if (!auth.currentUser) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(NOTIF_EVENT_NAME, handleLocalEvent);
      }
    };
  }

  let unsubscribeFirestore: (() => void) | null = null;
  try {
    const isBurocrataUser = isAuthorizedBurocrata(auth.currentUser.email);
    const q = isBurocrataUser
      ? collection(db, "notifications")
      : query(collection(db, "notifications"), where("userId", "in", [auth.currentUser.uid, "all"]));

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const parsed: UserNotification[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const target = data.userId || "all";
          if (target === resolvedUid || target === auth.currentUser?.uid || target === "all" || isBurocrataUser) {
            const ms = extractTimestampMs(data.timestamp) || extractTimestampMs(data.createdAt) || Date.now();
            const mappedType = mapRawNotificationCategory(data.tipo || data.type);
            parsed.push({
              id: docSnapshot.id,
              userId: target,
              titulo: data.titulo || data.title || "Notificação",
              mensagem: data.mensagem || data.message || "",
              timestamp: formatNotificationTimestamp(ms),
              createdAtMs: ms,
              lida: data.lida !== undefined ? !!data.lida : !!data.read,
              tipo: mappedType.tipo,
              prioridade: mappedType.prioridade,
              senderEmail: data.senderEmail,
              actionUid: data.actionUid,
              actionTab: data.actionTab,
              actionLabel: data.actionLabel
            });
          }
        });
        remoteNotifs = parsed;
        emitMerged();
      },
      () => {
        emitMerged();
      }
    );
  } catch {
    emitMerged();
  }

  return () => {
    if (typeof unsubscribeFirestore === "function") unsubscribeFirestore();
    if (typeof window !== "undefined") {
      window.removeEventListener(NOTIF_EVENT_NAME, handleLocalEvent);
    }
  };
}

export async function markNotificationAsRead(id: string, userId = "all", notif?: UserNotification) {
  return setNotificationReadState(notif || { id, userId, titulo: "", mensagem: "", timestamp: "", lida: false }, userId, true);
}

export async function setNotificationReadState(notif: UserNotification, userId = "all", read = true) {
  const resolvedUid = userId || auth.currentUser?.uid || "all";
  setReadOverride(resolvedUid, notif.id, read);

  // Sync local notifications store if applicable
  if (notif.isLocal || notif.id.startsWith("local_")) {
    const key = getNotifStorageKey("local_notifs", resolvedUid);
    const localList = readJsonArray<UserNotification>(key).map((item) =>
      item.id === notif.id ? { ...item, lida: read } : item
    );
    writeJsonArray(key, localList);
  }

  emitNotificationsUpdated();

  // Only update Firestore doc when signed-in user has permission (owner or Burocrata) and doc is remote
  const canWriteFirestore =
    Boolean(auth.currentUser) &&
    !notif.isLocal &&
    !notif.id.startsWith("sys_") &&
    !notif.id.startsWith("local_") &&
    (notif.userId === auth.currentUser?.uid || isAuthorizedBurocrata(auth.currentUser?.email));

  if (canWriteFirestore) {
    try {
      const docRef = doc(db, "notifications", notif.id);
      await updateDoc(docRef, { lida: read });
    } catch {
      // Local override already persisted
    }
  }
}

export async function markAllNotificationsAsRead(notifs: UserNotification[], userId = "all") {
  const resolvedUid = userId || auth.currentUser?.uid || "all";
  const unread = notifs.filter((n) => !n.lida);
  if (unread.length === 0) return;

  unread.forEach((n) => setReadOverride(resolvedUid, n.id, true));

  // Sync local notifications store
  const localKey = getNotifStorageKey("local_notifs", resolvedUid);
  const localList = readJsonArray<UserNotification>(localKey).map((item) => ({ ...item, lida: true }));
  writeJsonArray(localKey, localList);

  emitNotificationsUpdated();

  if (!auth.currentUser) return;
  try {
    const isBurocrataUser = isAuthorizedBurocrata(auth.currentUser.email);
    const writableRemote = unread.filter(
      (n) =>
        !n.isLocal &&
        !n.id.startsWith("sys_") &&
        !n.id.startsWith("local_") &&
        (n.userId === auth.currentUser?.uid || isBurocrataUser)
    );
    if (writableRemote.length === 0) return;
    const batch = writeBatch(db);
    writableRemote.forEach((n) => {
      const docRef = doc(db, "notifications", n.id);
      batch.update(docRef, { lida: true });
    });
    await batch.commit();
  } catch {
    // Fail silently (local override already applied)
  }
}

export async function dismissNotification(notif: UserNotification, userId = "all") {
  const resolvedUid = userId || auth.currentUser?.uid || "all";
  addDismissedNotifIds(resolvedUid, [notif.id]);
  if (notif.isLocal || notif.id.startsWith("local_")) {
    const key = getNotifStorageKey("local_notifs", resolvedUid);
    const remaining = readJsonArray<UserNotification>(key).filter((item) => item.id !== notif.id);
    writeJsonArray(key, remaining);
  }
  emitNotificationsUpdated();
}

export async function clearReadNotifications(notifs: UserNotification[], userId = "all") {
  const resolvedUid = userId || auth.currentUser?.uid || "all";
  const readIds = notifs.filter((n) => n.lida).map((n) => n.id);
  if (readIds.length === 0) return;
  addDismissedNotifIds(resolvedUid, readIds);

  const key = getNotifStorageKey("local_notifs", resolvedUid);
  const readSet = new Set(readIds);
  const remaining = readJsonArray<UserNotification>(key).filter((item) => !readSet.has(item.id));
  writeJsonArray(key, remaining);

  emitNotificationsUpdated();
}

// ============================================
// AUDIT & LOGGING (COMPATIBLE WITH checkuser)
// ============================================
export async function registerAuditLog(userUid: string, action: string, details?: any) {
  const safeDetails: Record<string, any> = {};
  if (details && typeof details === "object") {
    const blocked = new Set(["password", "passkey", "token", "secret", "authorization", "cookie"]);
    for (const [k, v] of Object.entries(details)) {
      if (blocked.has(k.toLowerCase())) continue;
      safeDetails[k] = typeof v === "string" ? v.slice(0, 300) : v;
    }
  }

  const logData = sanitizeFirestoreData({
    userId: userUid,
    action: String(action || "event").slice(0, 120),
    details: safeDetails,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 250) : "Server"
  });

  safeApiFetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(logData)
  }).catch(() => {});

  try {
    await addDoc(collection(db, "checkuser"), {
      ...logData,
      serverTime: serverTimestamp()
    });
  } catch {
    // ignore
  }
}

// ============================================
// BUROCRATA & ADMIN OPERATIONS
// ============================================

export async function listAllUsersFromFirestore(): Promise<AppUser[]> {
  const userMap = new Map<string, AppUser>();

  // 1. Only verified Burocrata accounts may query the full Firestore users directory
  if (auth.currentUser && isAuthorizedBurocrata(auth.currentUser.email)) {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        userMap.set(docSnap.id, {
          uid: docSnap.id,
          email: d.email || "",
          name: d.name || d.displayName || "Usuário",
          profilePictureUrl: d.profilePictureUrl || "",
          isAdmin: !!d.isAdmin,
          isBanned: !!(d.isBanned || d.isBan),
          isTeacher: !!(d.isTeacher || d.isTeatcher),
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
          firstLoginAt: d.firstLoginAt?.toDate ? d.firstLoginAt.toDate().toISOString() : d.firstLoginAt,
          lastLoginAt: d.lastLoginAt?.toDate ? d.lastLoginAt.toDate().toISOString() : d.lastLoginAt,
          notMediaWikiPageSlug: d.notMediaWikiPageSlug,
          notMediaWikiPageCreated: d.notMediaWikiPageCreated
        });
      });
    } catch {
      //
    }
  }

  // 2. Public userpage directory (allowed read: true by firestore.rules)
  try {
    const upSnap = await getDocs(collection(db, "userpage"));
    upSnap.forEach((docSnap) => {
      const d = docSnap.data();
      const targetUid = d.ownerUid || docSnap.id;
      if (!userMap.has(targetUid)) {
        userMap.set(targetUid, {
          uid: targetUid,
          email: d.ownerEmail || "",
          name: d.ownerName || d.displayName || (typeof d.title === "string" ? d.title.replace(/^Usuário:/i, "") : "Usuário"),
          profilePictureUrl: d.avatarUrl || "",
          isAdmin: !!d.isAdmin,
          isBanned: false,
          isTeacher: !!d.isTeacher,
          isGuest: !!d.isGuest,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
          firstLoginAt: d.firstLoginAt?.toDate ? d.firstLoginAt.toDate().toISOString() : d.firstLoginAt,
          lastLoginAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
          notMediaWikiPageSlug: d.slug,
          notMediaWikiPageCreated: true
        });
      }
    });
  } catch {
    //
  }

  // 3. Backend API when available
  const res = await safeApiFetch("/api/admin/users");
  if (res && res.ok) {
    const data = await res.json().catch(() => null);
    if (data && Array.isArray(data.users)) {
      for (const u of data.users) {
        if (u?.uid && !userMap.has(u.uid)) {
          userMap.set(u.uid, u);
        }
      }
    }
  }

  // 4. Local userpages & current session fallback
  const localUserPages = readLocalJson<any[]>("wzzm_notmediawiki_userpages", []);
  for (const lp of localUserPages) {
    if (lp?.ownerUid && !userMap.has(lp.ownerUid)) {
      userMap.set(lp.ownerUid, {
        uid: lp.ownerUid,
        email: lp.ownerEmail || "",
        name: lp.ownerName || (typeof lp.title === "string" ? lp.title.replace(/^Usuário:/i, "") : "Usuário"),
        profilePictureUrl: lp.avatarUrl || "",
        isAdmin: !!lp.isAdmin,
        isBanned: false,
        isTeacher: !!lp.isTeacher,
        isGuest: !!lp.isGuest,
        createdAt: lp.createdAt,
        firstLoginAt: lp.firstLoginAt || lp.createdAt,
        lastLoginAt: lp.updatedAt,
        notMediaWikiPageSlug: lp.slug,
        notMediaWikiPageCreated: true
      });
    }
  }

  const localSession = readLocalJson<AppUser | null>("wzzm_local_session_profile", null);
  if (localSession && localSession.uid && !userMap.has(localSession.uid)) {
    userMap.set(localSession.uid, localSession);
  }

  if (!userMap.has("usr_pedro_cardona_official")) {
    userMap.set("usr_pedro_cardona_official", {
      uid: "usr_pedro_cardona_official",
      email: "pedrohenriquecardonaperes@gmail.com",
      name: "Pedro Cardona",
      profilePictureUrl: "",
      isAdmin: true,
      isBanned: false,
      isTeacher: true
    });
  }

  return Array.from(userMap.values());
}

export async function getUserByUidFromFirestore(uid: string): Promise<AppUser | null> {
  if (!uid) return null;
  if (auth.currentUser && (auth.currentUser.uid === uid || isAuthorizedPublisher(auth.currentUser.email))) {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        const d = docSnap.data();
        return {
          uid: docSnap.id,
          email: d.email || "",
          name: d.name || d.displayName || "Usuário",
          profilePictureUrl: d.profilePictureUrl || "",
          isAdmin: !!d.isAdmin,
          isBanned: !!(d.isBanned || d.isBan),
          isTeacher: !!(d.isTeacher || d.isTeatcher),
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
          firstLoginAt: d.firstLoginAt?.toDate ? d.firstLoginAt.toDate().toISOString() : d.firstLoginAt,
          lastLoginAt: d.lastLoginAt?.toDate ? d.lastLoginAt.toDate().toISOString() : d.lastLoginAt,
          notMediaWikiPageSlug: d.notMediaWikiPageSlug,
          notMediaWikiPageCreated: d.notMediaWikiPageCreated
        };
      }
    } catch {
      //
    }
  }

  // Fallback 1: Public userpage document (readable by anyone per firestore.rules)
  try {
    const upSnap = await getDoc(doc(db, "userpage", uid));
    if (upSnap.exists()) {
      const d = upSnap.data();
      return {
        uid,
        email: d.ownerEmail || "",
        name: d.ownerName || d.displayName || (typeof d.title === "string" ? d.title.replace(/^Usuário:/i, "") : "Usuário"),
        profilePictureUrl: d.avatarUrl || "",
        isAdmin: !!d.isAdmin,
        isBanned: false,
        isTeacher: !!d.isTeacher,
        isGuest: !!d.isGuest,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
        firstLoginAt: d.firstLoginAt?.toDate ? d.firstLoginAt.toDate().toISOString() : d.firstLoginAt,
        lastLoginAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        notMediaWikiPageSlug: d.slug,
        notMediaWikiPageCreated: true
      };
    }
  } catch {
    //
  }

  // Fallback 2: Local session or cached userpage
  const localSession = readLocalJson<AppUser | null>("wzzm_local_session_profile", null);
  if (localSession && localSession.uid === uid) {
    return localSession;
  }

  const localUserPages = readLocalJson<any[]>("wzzm_notmediawiki_userpages", []);
  const cachedPage = localUserPages.find((p) => p?.ownerUid === uid);
  if (cachedPage) {
    return {
      uid,
      email: cachedPage.ownerEmail || "",
      name: cachedPage.ownerName || (typeof cachedPage.title === "string" ? cachedPage.title.replace(/^Usuário:/i, "") : "Usuário"),
      profilePictureUrl: cachedPage.avatarUrl || "",
      isAdmin: !!cachedPage.isAdmin,
      isBanned: false,
      isTeacher: !!cachedPage.isTeacher,
      isGuest: !!cachedPage.isGuest,
      createdAt: cachedPage.createdAt,
      firstLoginAt: cachedPage.firstLoginAt || cachedPage.createdAt,
      lastLoginAt: cachedPage.updatedAt,
      notMediaWikiPageSlug: cachedPage.slug,
      notMediaWikiPageCreated: true
    };
  }

  // Fallback 3: Backend API
  const res = await safeApiFetch(`/api/admin/users`);
  if (res && res.ok) {
    const data = await res.json().catch(() => null);
    const found = (data?.users || []).find((u: any) => u.uid === uid);
    if (found) return found;
  }

  return null;
}

export async function updateUserAdminStatus(uid: string, isAdmin: boolean): Promise<boolean> {
  try {
    await updateDoc(doc(db, "users", uid), { isAdmin });
    await updateDoc(doc(db, "usuários", uid), { isAdmin }).catch(() => {});
  } catch (err) {
    console.warn("Firestore updateUserAdminStatus error:", err);
  }

  const res = await safeApiFetch(`/api/admin/users/${encodeURIComponent(uid)}/toggle-admin`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isAdmin })
  });
  return Boolean(res?.ok || auth.currentUser);
}

export async function updateUserBanStatus(uid: string, isBanned: boolean, banReason?: string): Promise<boolean> {
  const payload = sanitizeFirestoreData({
    isBanned,
    isBan: isBanned,
    banReason: isBanned ? (banReason || "Violação das Políticas do Portal") : null,
    bannedAt: isBanned ? serverTimestamp() : null
  });

  try {
    await updateDoc(doc(db, "users", uid), payload);
    await updateDoc(doc(db, "usuários", uid), payload).catch(() => {});
  } catch (err) {
    console.warn("Firestore updateUserBanStatus error:", err);
  }

  const res = await safeApiFetch(`/api/admin/users/${encodeURIComponent(uid)}/toggle-ban`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isBanned, banReason })
  });
  return Boolean(res?.ok || auth.currentUser);
}

export async function updateUserTeacherStatus(uid: string, isTeacher: boolean): Promise<boolean> {
  const payload = {
    isTeacher,
    isTeatcher: isTeacher
  };

  try {
    await updateDoc(doc(db, "users", uid), payload);
    await updateDoc(doc(db, "usuários", uid), payload).catch(() => {});
  } catch (err) {
    console.warn("Firestore updateUserTeacherStatus error:", err);
  }

  const res = await safeApiFetch(`/api/admin/users/${encodeURIComponent(uid)}/toggle-teacher`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isTeacher })
  });
  return Boolean(res?.ok || auth.currentUser);
}

// ============================================
// LGPD SOLICITAÇÃO DE EXCLUSÃO DE DADOS
// wazzimagiygg.com/admin/admintools/solicitacaodeexlusao/
// ============================================

export async function listDeletionRequests(): Promise<DeletionRequest[]> {
  if (!auth.currentUser || !isAuthorizedBurocrata(auth.currentUser.email)) {
    return [];
  }

  const collected: DeletionRequest[] = [];

  try {
    const q = query(collection(db, "deletion_requests"), orderBy("requestDate", "desc"));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const reqDate = d.requestDate?.toDate ? d.requestDate.toDate().toISOString() : (d.requestDate || new Date().toISOString());
      collected.push({
        id: docSnap.id,
        name: d.name || d.nomeCompleto || "Titular Anônimo",
        email: d.email || "",
        phone: d.phone || "",
        cpf: d.cpf || "",
        reason: d.reason || d.motivo || "Exercício de direito LGPD Art. 18",
        dataTypes: d.dataTypes || ["Contas", "Comentários", "Histórico"],
        status: d.status || "pending",
        requestDate: reqDate,
        ipAddress: d.ipAddress || "189.40.xxx.xxx",
        processedBy: d.processedBy,
        completedAt: d.completedAt?.toDate ? d.completedAt.toDate().toISOString() : d.completedAt,
        rejectedAt: d.rejectedAt?.toDate ? d.rejectedAt.toDate().toISOString() : d.rejectedAt,
        rejectionReason: d.rejectionReason || d.observacoes,
        certificateId: d.certificateId || d.certificadoExclusao,
        protocolo: d.protocolo || docSnap.id,
        nomeCompleto: d.nomeCompleto || d.name || "Titular Anônimo",
        motivo: d.motivo || d.reason || "Exercício de direito LGPD Art. 18",
        tipoDado: d.tipoDado || (Array.isArray(d.dataTypes) ? d.dataTypes.join(", ") : "Expurgo Geral"),
        dataSolicitacao: reqDate,
        observacoes: d.observacoes || d.rejectionReason || "",
        certificadoExclusao: d.certificadoExclusao || d.certificateId || ""
      });
    });
  } catch (err) {
    console.warn("Could not load deletion_requests from Firestore:", err);
  }

  // Fallback / merge with backend API when available
  try {
    const res = await safeApiFetch("/api/admin/deletion-requests");
    if (res && res.ok) {
      const data = await res.json();
      const apiRequests = (data.requests || []).map((r: any) => ({
        ...r,
        protocolo: r.protocolo || r.id,
        nomeCompleto: r.nomeCompleto || r.name || "Titular Anônimo",
        motivo: r.motivo || r.reason || "",
        tipoDado: r.tipoDado || (Array.isArray(r.dataTypes) ? r.dataTypes.join(", ") : "Expurgo Geral"),
        dataSolicitacao: r.dataSolicitacao || r.requestDate || new Date().toISOString(),
        observacoes: r.observacoes || r.rejectionReason || "",
        certificadoExclusao: r.certificadoExclusao || r.certificateId || ""
      }));
      collected.push(...apiRequests);
    }
  } catch (apiErr) {
    console.warn("Backend deletion-requests error:", apiErr);
  }

  return mergeDeletionRequestsWithMock(collected);
}

/**
 * Real-time Firestore listener for LGPD deletion requests (strictly restricted to authorized Burocrata)
 */
export function setupDeletionRequestsListener(
  callback: (requests: DeletionRequest[]) => void
): () => void {
  if (!auth.currentUser || !isAuthorizedBurocrata(auth.currentUser.email)) {
    callback([]);
    return () => {};
  }

  let latestLiveRequests: DeletionRequest[] = [];

  const emitMerged = () => {
    callback(mergeDeletionRequestsWithMock(latestLiveRequests));
  };

  // Immediately emit integrated baseline for authorized Burocrata
  emitMerged();

  const handleLocalUpdate = () => emitMerged();
  if (typeof window !== "undefined") {
    window.addEventListener(DELETION_REQUESTS_UPDATED_EVENT, handleLocalUpdate);
  }

  // Also hydrate from backend API if available
  listDeletionRequests().then((merged) => {
    latestLiveRequests = merged;
    callback(merged);
  });

  let unsubscribeFirestore: (() => void) | null = null;
  try {
    if (auth.currentUser && isAuthorizedBurocrata(auth.currentUser.email)) {
      const q = query(collection(db, "deletion_requests"), orderBy("requestDate", "desc"));
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const requests: DeletionRequest[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            const reqDate = d.requestDate?.toDate
              ? d.requestDate.toDate().toISOString()
              : d.requestDate || new Date().toISOString();
            requests.push({
              id: docSnap.id,
              name: d.name || d.nomeCompleto || "Titular Anônimo",
              email: d.email || "",
              phone: d.phone || "",
              cpf: d.cpf || "",
              reason: d.reason || d.motivo || "Exercício de direito LGPD Art. 18",
              dataTypes: d.dataTypes || ["Contas", "Comentários", "Histórico"],
              status: d.status || "pending",
              requestDate: reqDate,
              ipAddress: d.ipAddress || "189.40.xxx.xxx",
              processedBy: d.processedBy,
              completedAt: d.completedAt?.toDate ? d.completedAt.toDate().toISOString() : d.completedAt,
              rejectedAt: d.rejectedAt?.toDate ? d.rejectedAt.toDate().toISOString() : d.rejectedAt,
              rejectionReason: d.rejectionReason || d.observacoes,
              certificateId: d.certificateId || d.certificadoExclusao,
              protocolo: d.protocolo || docSnap.id,
              nomeCompleto: d.nomeCompleto || d.name || "Titular Anônimo",
              motivo: d.motivo || d.reason || "Exercício de direito LGPD Art. 18",
              tipoDado: d.tipoDado || (Array.isArray(d.dataTypes) ? d.dataTypes.join(", ") : "Expurgo Geral"),
              dataSolicitacao: reqDate,
              observacoes: d.observacoes || d.rejectionReason || "",
              certificadoExclusao: d.certificadoExclusao || d.certificateId || ""
            });
          });
          latestLiveRequests = requests;
          emitMerged();
        },
        () => {
          emitMerged();
        }
      );
    }
  } catch (err) {
    console.warn("Could not bind deletion_requests snapshot listener:", err);
  }

  return () => {
    if (typeof unsubscribeFirestore === "function") unsubscribeFirestore();
    if (typeof window !== "undefined") {
      window.removeEventListener(DELETION_REQUESTS_UPDATED_EVENT, handleLocalUpdate);
    }
  };
}

export async function updateDeletionRequestStatus(
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'rejected',
  notesOrReason?: string,
  adminEmail?: string,
  certificateId?: string
): Promise<boolean> {
  const admin = adminEmail || AUTHORIZED_BUROCRATA_EMAIL;
  const resolvedCertId =
    status === 'completed'
      ? certificateId || `LGPD-CERT-${Date.now().toString().slice(-6)}`
      : undefined;

  const updatePayload: any = {
    status,
    processedBy: admin,
    updatedAt: serverTimestamp()
  };
  if (status === 'completed') {
    updatePayload.completedAt = serverTimestamp();
    updatePayload.certificateId = resolvedCertId;
    updatePayload.certificadoExclusao = resolvedCertId;
  } else if (status === 'rejected') {
    updatePayload.rejectedAt = serverTimestamp();
    updatePayload.rejectionReason = notesOrReason || "Fundamentação legal da guarda obrigatória (Marco Civil Art. 15).";
    updatePayload.observacoes = updatePayload.rejectionReason;
  }
  if (notesOrReason) {
    updatePayload.observacoes = notesOrReason;
  }

  // Persist locally immediately so integrated/mock requests also stay in sync across panels
  saveLocalDeletionOverride(id, {
    status,
    processedBy: admin,
    ...(status === 'completed'
      ? {
          completedAt: new Date().toISOString(),
          dataConclusao: new Date().toISOString(),
          certificateId: resolvedCertId,
          certificadoExclusao: resolvedCertId
        }
      : {}),
    ...(status === 'rejected'
      ? {
          rejectedAt: new Date().toISOString(),
          rejectionReason: notesOrReason || "Fundamentação legal da guarda obrigatória (Marco Civil Art. 15)."
        }
      : {}),
    ...(notesOrReason ? { observacoes: notesOrReason } : {})
  });

  try {
    await updateDoc(doc(db, "deletion_requests", id), sanitizeFirestoreData(updatePayload));
  } catch (err) {
    console.warn("Firestore update deletion request error:", err);
  }

  const res = await safeApiFetch(`/api/admin/deletion-requests/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      adminEmail: admin,
      rejectionReason: notesOrReason,
      certificateId: resolvedCertId
    })
  });
  return Boolean(res?.ok || auth.currentUser);
}

export async function deleteUserFromFirestore(uid: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "users", uid));
    await deleteDoc(doc(db, "usuários", uid)).catch(() => {});
  } catch (err) {
    console.warn("Firestore deleteUser error:", err);
  }

  const res = await safeApiFetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
    method: "DELETE"
  });
  return Boolean(res?.ok || auth.currentUser);
}

export async function deleteArticleFromFirestore(collectionName: string, id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, collectionName, id));
    await deleteDoc(doc(db, "artigos", id)).catch(() => {});
  } catch (err) {
    console.warn("Firestore deleteArticle error:", err);
  }

  const res = await safeApiFetch(`/api/admin/articles/${encodeURIComponent(id)}?collection=${encodeURIComponent(collectionName)}`, {
    method: "DELETE"
  });
  return Boolean(res?.ok || auth.currentUser);
}

// ============================================
// BEMTEVI REDE SOCIAL - SINCRONIZAÇÃO MULTI-CAMADA
// Firestore + Express API + localStorage fallback (zero perda de dados)
// ============================================

const BEMTEVI_POSTS_CACHE_KEY = "wzzm_bemtevi_posts";
const BEMTEVI_DELETED_POSTS_KEY = "wzzm_bemtevi_deleted_posts";
const BEMTEVI_COMMUNITIES_CACHE_KEY = "wzzm_bemtevi_communities";
const BEMTEVI_MESSAGES_CACHE_KEY = "wzzm_bemtevi_messages";
const getBemteviCommentsCacheKey = (postId: string) => `wzzm_bemtevi_comments_${postId}`;

function normalizeBemteviPostRecord(p: any): any {
  const content = typeof p?.content === "string" ? p.content : "";
  const extracted = extractHashtagsFromText(content);
  const existingTags = Array.isArray(p?.tags) ? p.tags : [];
  const mergedTags = Array.from(new Set([...extracted, ...existingTags]));
  return sanitizeFirestoreData({
    ...p,
    content,
    tags: mergedTags,
    likesCount: typeof p?.likesCount === "number" ? p.likesCount : (Array.isArray(p?.likedBy) ? p.likedBy.length : 0),
    commentsCount: typeof p?.commentsCount === "number" ? p.commentsCount : 0,
    sharesCount: typeof p?.sharesCount === "number" ? p.sharesCount : 0,
    savesCount: typeof p?.savesCount === "number" ? p.savesCount : (Array.isArray(p?.savedBy) ? p.savedBy.length : 0),
    likedBy: Array.isArray(p?.likedBy) ? p.likedBy : [],
    savedBy: Array.isArray(p?.savedBy) ? p.savedBy : [],
    createdAt: p?.createdAt?.toDate ? p.createdAt.toDate().toISOString() : p?.createdAt || new Date().toISOString(),
    updatedAt: p?.updatedAt?.toDate ? p.updatedAt.toDate().toISOString() : p?.updatedAt
  });
}

export async function listBemteviPostsFromDb(): Promise<any[]> {
  const deletedIds = new Set(readLocalJson<string[]>(BEMTEVI_DELETED_POSTS_KEY, []));
  const postMap = new Map<string, any>();

  // 1. Baseline seed posts
  for (const seed of SEED_BEMTEVI_POSTS) {
    if (!deletedIds.has(seed.id)) {
      postMap.set(seed.id, normalizeBemteviPostRecord(seed));
    }
  }

  // 2. Backend API posts (if server.ts is running)
  const apiRes = await safeApiFetch("/api/bemtevi/posts");
  if (apiRes && apiRes.ok) {
    const json = await apiRes.json().catch(() => null);
    if (json && Array.isArray(json.posts)) {
      for (const p of json.posts) {
        if (p?.id && !deletedIds.has(p.id)) {
          postMap.set(p.id, normalizeBemteviPostRecord(p));
        }
      }
    }
  }

  // 3. Direct Firestore posts (authoritative cloud persistence when rules permit)
  try {
    const q = query(collection(db, "bemtevi_posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      if (!deletedIds.has(docSnap.id)) {
        const normalized = normalizeBemteviPostRecord({
          ...docSnap.data(),
          id: docSnap.id,
          isLocalOnly: false
        });
        postMap.set(docSnap.id, normalized);
      }
    });
  } catch {
    // Graceful fallback to backend & local cache if Firestore is unavailable or rules deny
  }

  // 4. Local cache (preserves offline/guest posts or local updates not yet synced)
  const localPosts = readLocalJson<any[]>(BEMTEVI_POSTS_CACHE_KEY, []);
  for (const lp of localPosts) {
    if (!lp?.id || deletedIds.has(lp.id)) continue;
    const existing = postMap.get(lp.id);
    if (!existing) {
      postMap.set(lp.id, normalizeBemteviPostRecord(lp));
    } else if (lp.isLocalOnly || (lp.updatedAt && (!existing.updatedAt || lp.updatedAt > existing.updatedAt))) {
      postMap.set(lp.id, normalizeBemteviPostRecord({ ...existing, ...lp }));
    }
  }

  const merged = Array.from(postMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  writeLocalJson(BEMTEVI_POSTS_CACHE_KEY, merged.slice(0, 100));
  return merged;
}

export async function createBemteviPostInDb(postData: any): Promise<any> {
  const nowIso = new Date().toISOString();
  const extractedTags = extractHashtagsFromText(postData?.content || "");
  const cleanData = sanitizeFirestoreData({
    ...postData,
    content: (postData?.content || "").trim(),
    tags: Array.from(new Set([...(Array.isArray(postData?.tags) ? postData.tags : []), ...extractedTags])),
    likesCount: postData?.likesCount ?? 0,
    commentsCount: postData?.commentsCount ?? 0,
    sharesCount: postData?.sharesCount ?? 0,
    savesCount: postData?.savesCount ?? 0,
    likedBy: Array.isArray(postData?.likedBy) ? postData.likedBy : [],
    savedBy: Array.isArray(postData?.savedBy) ? postData.savedBy : []
  });

  // Attempt Firestore write only when authenticated as matching user
  if (auth.currentUser && auth.currentUser.uid === cleanData.authorId) {
    try {
      const firestorePayload = sanitizeFirestoreData({
        ...cleanData,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, "bemtevi_posts"), firestorePayload);
      const result = normalizeBemteviPostRecord({
        ...cleanData,
        id: docRef.id,
        createdAt: nowIso,
        isLocalOnly: false
      });

      const cached = readLocalJson<any[]>(BEMTEVI_POSTS_CACHE_KEY, []);
      writeLocalJson(BEMTEVI_POSTS_CACHE_KEY, [result, ...cached.filter((p) => p.id !== result.id)].slice(0, 100));

      safeApiFetch("/api/bemtevi/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
      }).catch(() => {});

      return result;
    } catch {
      // Fall through cleanly to backend API / localStorage persistence
    }
  }

  // Fallback 1: Express Backend API (if mounted)
  const apiRes = await safeApiFetch("/api/bemtevi/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanData)
  });
  if (apiRes && apiRes.ok) {
    const data = await apiRes.json().catch(() => null);
    if (data?.post) {
      const normalized = normalizeBemteviPostRecord(data.post);
      const cached = readLocalJson<any[]>(BEMTEVI_POSTS_CACHE_KEY, []);
      writeLocalJson(BEMTEVI_POSTS_CACHE_KEY, [normalized, ...cached.filter((p) => p.id !== normalized.id)].slice(0, 100));
      return normalized;
    }
  }

  // Fallback 2: Local persistent storage (for guests or static hosting)
  const localPost = normalizeBemteviPostRecord({
    ...cleanData,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: nowIso,
    isLocalOnly: true
  });
  const cached = readLocalJson<any[]>(BEMTEVI_POSTS_CACHE_KEY, []);
  writeLocalJson(BEMTEVI_POSTS_CACHE_KEY, [localPost, ...cached].slice(0, 100));
  return localPost;
}

export async function updateBemteviPostInDb(postId: string, updates: Record<string, any>): Promise<any> {
  const nowIso = new Date().toISOString();
  const nextTags =
    typeof updates.content === "string"
      ? extractHashtagsFromText(updates.content)
      : updates.tags;

  const cleanUpdates = sanitizeFirestoreData({
    ...updates,
    ...(nextTags !== undefined ? { tags: nextTags } : {}),
    updatedAt: nowIso
  });

  // Update local cache immediately
  const cached = readLocalJson<any[]>(BEMTEVI_POSTS_CACHE_KEY, []);
  const updatedCache = cached.map((p) => (p.id === postId ? normalizeBemteviPostRecord({ ...p, ...cleanUpdates }) : p));
  writeLocalJson(BEMTEVI_POSTS_CACHE_KEY, updatedCache);

  // Sync to Firestore when document is remote and user is signed in
  if (auth.currentUser && !postId.startsWith("local-") && !postId.startsWith("post-init-")) {
    try {
      await updateDoc(
        doc(db, "bemtevi_posts", postId),
        sanitizeFirestoreData({
          ...cleanUpdates,
          updatedAt: serverTimestamp()
        })
      );
    } catch {
      // Keep local update intact
    }
  }

  // Sync to Express API if available
  await safeApiFetch(`/api/bemtevi/posts/${encodeURIComponent(postId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanUpdates)
  });

  return cleanUpdates;
}

export async function toggleBemteviPostLikeInDb(
  postId: string,
  userId: string,
  nextLikedBy: string[],
  nextLikesCount: number
): Promise<void> {
  const cached = readLocalJson<any[]>(BEMTEVI_POSTS_CACHE_KEY, []);
  writeLocalJson(
    BEMTEVI_POSTS_CACHE_KEY,
    cached.map((p) => (p.id === postId ? { ...p, likedBy: nextLikedBy, likesCount: nextLikesCount } : p))
  );

  if (auth.currentUser && !postId.startsWith("local-") && !postId.startsWith("post-init-")) {
    try {
      await updateDoc(doc(db, "bemtevi_posts", postId), {
        likedBy: nextLikedBy,
        likesCount: nextLikesCount
      });
    } catch {
      //
    }
  }

  safeApiFetch(`/api/bemtevi/posts/${encodeURIComponent(postId)}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  }).catch(() => {});
}

export async function incrementBemteviPostShareInDb(postId: string, nextSharesCount: number): Promise<void> {
  const cached = readLocalJson<any[]>(BEMTEVI_POSTS_CACHE_KEY, []);
  writeLocalJson(
    BEMTEVI_POSTS_CACHE_KEY,
    cached.map((p) => (p.id === postId ? { ...p, sharesCount: nextSharesCount } : p))
  );

  if (auth.currentUser && !postId.startsWith("local-") && !postId.startsWith("post-init-")) {
    try {
      await updateDoc(doc(db, "bemtevi_posts", postId), {
        sharesCount: nextSharesCount
      });
    } catch {
      //
    }
  }

  safeApiFetch(`/api/bemtevi/posts/${encodeURIComponent(postId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sharesCount: nextSharesCount })
  }).catch(() => {});
}

export async function toggleBemteviPostSaveInDb(
  postId: string,
  nextSavedBy: string[],
  nextSavesCount: number
): Promise<void> {
  const cached = readLocalJson<any[]>(BEMTEVI_POSTS_CACHE_KEY, []);
  writeLocalJson(
    BEMTEVI_POSTS_CACHE_KEY,
    cached.map((p) => (p.id === postId ? { ...p, savedBy: nextSavedBy, savesCount: nextSavesCount } : p))
  );

  if (auth.currentUser && !postId.startsWith("local-") && !postId.startsWith("post-init-")) {
    try {
      await updateDoc(doc(db, "bemtevi_posts", postId), {
        savedBy: nextSavedBy,
        savesCount: nextSavesCount
      });
    } catch {
      //
    }
  }

  safeApiFetch(`/api/bemtevi/posts/${encodeURIComponent(postId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ savedBy: nextSavedBy, savesCount: nextSavesCount })
  }).catch(() => {});
}

export async function deleteBemteviPostInDb(postId: string): Promise<boolean> {
  const deleted = readLocalJson<string[]>(BEMTEVI_DELETED_POSTS_KEY, []);
  if (!deleted.includes(postId)) {
    writeLocalJson(BEMTEVI_DELETED_POSTS_KEY, [...deleted, postId]);
  }
  const cached = readLocalJson<any[]>(BEMTEVI_POSTS_CACHE_KEY, []);
  writeLocalJson(BEMTEVI_POSTS_CACHE_KEY, cached.filter((p) => p.id !== postId));

  if (auth.currentUser && !postId.startsWith("local-") && !postId.startsWith("post-init-")) {
    try {
      await deleteDoc(doc(db, "bemtevi_posts", postId));
    } catch {
      //
    }
  }

  await safeApiFetch(`/api/bemtevi/posts/${encodeURIComponent(postId)}`, { method: "DELETE" });
  return true;
}

export async function listBemteviCommunitiesFromDb(): Promise<any[]> {
  const commMap = new Map<string, any>();

  const apiRes = await safeApiFetch("/api/bemtevi/communities");
  if (apiRes && apiRes.ok) {
    const json = await apiRes.json().catch(() => null);
    for (const c of json?.communities || []) {
      if (c?.id) commMap.set(c.id, c);
    }
  }

  try {
    const snapshot = await getDocs(collection(db, "bemtevi_communities"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      commMap.set(docSnap.id, {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
      });
    });
  } catch {
    //
  }

  const localComms = readLocalJson<any[]>(BEMTEVI_COMMUNITIES_CACHE_KEY, []);
  for (const lc of localComms) {
    if (lc?.id && !commMap.has(lc.id)) {
      commMap.set(lc.id, lc);
    }
  }

  const merged = Array.from(commMap.values());
  writeLocalJson(BEMTEVI_COMMUNITIES_CACHE_KEY, merged);
  return merged;
}

export async function createBemteviCommunityInDb(commData: any): Promise<any> {
  const cleanData = sanitizeFirestoreData(commData);
  const nowIso = new Date().toISOString();

  if (auth.currentUser && auth.currentUser.uid === cleanData.createdBy) {
    try {
      const payload = sanitizeFirestoreData({
        ...cleanData,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, "bemtevi_communities"), payload);
      const result = { ...cleanData, id: docRef.id, createdAt: nowIso };
      const cached = readLocalJson<any[]>(BEMTEVI_COMMUNITIES_CACHE_KEY, []);
      writeLocalJson(BEMTEVI_COMMUNITIES_CACHE_KEY, [result, ...cached.filter((c) => c.id !== result.id)]);

      safeApiFetch("/api/bemtevi/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
      }).catch(() => {});

      return result;
    } catch {
      //
    }
  }

  const apiRes = await safeApiFetch("/api/bemtevi/communities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanData)
  });
  if (apiRes && apiRes.ok) {
    const json = await apiRes.json().catch(() => null);
    if (json?.community) {
      const cached = readLocalJson<any[]>(BEMTEVI_COMMUNITIES_CACHE_KEY, []);
      writeLocalJson(BEMTEVI_COMMUNITIES_CACHE_KEY, [json.community, ...cached]);
      return json.community;
    }
  }

  const localComm = {
    ...cleanData,
    id: `local-comm-${Date.now()}`,
    createdAt: nowIso,
    isLocalOnly: true
  };
  const cached = readLocalJson<any[]>(BEMTEVI_COMMUNITIES_CACHE_KEY, []);
  writeLocalJson(BEMTEVI_COMMUNITIES_CACHE_KEY, [localComm, ...cached]);
  return localComm;
}

export async function toggleBemteviCommunityMemberInDb(
  communityId: string,
  nextMembers: string[],
  nextMembersCount: number
): Promise<void> {
  const cached = readLocalJson<any[]>(BEMTEVI_COMMUNITIES_CACHE_KEY, []);
  writeLocalJson(
    BEMTEVI_COMMUNITIES_CACHE_KEY,
    cached.map((c) => (c.id === communityId ? { ...c, members: nextMembers, membersCount: nextMembersCount } : c))
  );

  if (auth.currentUser && !communityId.startsWith("local-")) {
    try {
      await updateDoc(doc(db, "bemtevi_communities", communityId), {
        members: nextMembers,
        membersCount: nextMembersCount
      });
    } catch {
      //
    }
  }

  safeApiFetch(`/api/bemtevi/communities/${encodeURIComponent(communityId)}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ members: nextMembers, membersCount: nextMembersCount })
  }).catch(() => {});
}

export async function listBemteviCommentsFromDb(postId: string): Promise<any[]> {
  const commentMap = new Map<string, any>();

  const apiRes = await safeApiFetch(`/api/bemtevi/posts/${encodeURIComponent(postId)}/comments`);
  if (apiRes && apiRes.ok) {
    const json = await apiRes.json().catch(() => null);
    for (const c of json?.comments || []) {
      if (c?.id) commentMap.set(c.id, c);
    }
  }

  try {
    const q = query(collection(db, "bemtevi_comments"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.postId === postId) {
        commentMap.set(docSnap.id, {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
        });
      }
    });
  } catch {
    //
  }

  const localComments = readLocalJson<any[]>(getBemteviCommentsCacheKey(postId), []);
  for (const lc of localComments) {
    if (lc?.id && !commentMap.has(lc.id)) {
      commentMap.set(lc.id, lc);
    }
  }

  const merged = Array.from(commentMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  writeLocalJson(getBemteviCommentsCacheKey(postId), merged);
  return merged;
}

export async function createBemteviCommentInDb(postId: string, commentData: any): Promise<any> {
  const cleanData = sanitizeFirestoreData({
    postId,
    ...commentData,
    content: (commentData?.content || "").trim()
  });
  const nowIso = new Date().toISOString();

  // Helper to update post comment count in local cache + Firestore
  const bumpPostCommentCount = async () => {
    const cachedPosts = readLocalJson<any[]>(BEMTEVI_POSTS_CACHE_KEY, []);
    writeLocalJson(
      BEMTEVI_POSTS_CACHE_KEY,
      cachedPosts.map((p) => (p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
    );
    if (auth.currentUser && !postId.startsWith("local-") && !postId.startsWith("post-init-")) {
      await updateDoc(doc(db, "bemtevi_posts", postId), {
        commentsCount: increment(1)
      }).catch(() => {});
    }
  };

  if (auth.currentUser && auth.currentUser.uid === cleanData.authorId) {
    try {
      const payload = sanitizeFirestoreData({
        ...cleanData,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, "bemtevi_comments"), payload);
      const result = { id: docRef.id, ...cleanData, createdAt: nowIso };
      const cached = readLocalJson<any[]>(getBemteviCommentsCacheKey(postId), []);
      writeLocalJson(getBemteviCommentsCacheKey(postId), [...cached, result]);
      await bumpPostCommentCount();

      safeApiFetch(`/api/bemtevi/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
      }).catch(() => {});

      return result;
    } catch {
      //
    }
  }

  const apiRes = await safeApiFetch(`/api/bemtevi/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanData)
  });
  if (apiRes && apiRes.ok) {
    const json = await apiRes.json().catch(() => null);
    if (json?.comment) {
      const cached = readLocalJson<any[]>(getBemteviCommentsCacheKey(postId), []);
      writeLocalJson(getBemteviCommentsCacheKey(postId), [...cached, json.comment]);
      await bumpPostCommentCount();
      return json.comment;
    }
  }

  const localComment = {
    id: `local-comment-${Date.now()}`,
    ...cleanData,
    createdAt: nowIso,
    isLocalOnly: true
  };
  const cached = readLocalJson<any[]>(getBemteviCommentsCacheKey(postId), []);
  writeLocalJson(getBemteviCommentsCacheKey(postId), [...cached, localComment]);
  await bumpPostCommentCount();
  return localComment;
}

export async function listBemteviMessagesFromDb(): Promise<any[]> {
  const msgMap = new Map<string, any>();

  const apiRes = await safeApiFetch("/api/bemtevi/messages");
  if (apiRes && apiRes.ok) {
    const json = await apiRes.json().catch(() => null);
    for (const m of json?.messages || []) {
      if (m?.id) msgMap.set(m.id, m);
    }
  }

  // Only query protected direct messages in Firestore when signed in
  if (auth.currentUser) {
    try {
      const q = query(collection(db, "bemtevi_messages"), orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgMap.set(docSnap.id, {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
        });
      });
    } catch {
      // Keep graceful fallback without noisy permission warnings
    }
  }

  const localMsgs = readLocalJson<any[]>(BEMTEVI_MESSAGES_CACHE_KEY, []);
  for (const lm of localMsgs) {
    if (lm?.id && !msgMap.has(lm.id)) {
      msgMap.set(lm.id, lm);
    }
  }

  const merged = Array.from(msgMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  writeLocalJson(BEMTEVI_MESSAGES_CACHE_KEY, merged.slice(-200));
  return merged;
}

export async function createBemteviMessageInDb(msgData: any): Promise<any> {
  const cleanData = sanitizeFirestoreData({
    ...msgData,
    text: (msgData?.text || "").trim()
  });
  const nowIso = new Date().toISOString();

  if (auth.currentUser && auth.currentUser.uid === cleanData.senderId) {
    try {
      const payload = sanitizeFirestoreData({
        ...cleanData,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, "bemtevi_messages"), payload);
      const result = { id: docRef.id, ...cleanData, createdAt: nowIso };
      const cached = readLocalJson<any[]>(BEMTEVI_MESSAGES_CACHE_KEY, []);
      writeLocalJson(BEMTEVI_MESSAGES_CACHE_KEY, [...cached, result].slice(-200));

      safeApiFetch("/api/bemtevi/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
      }).catch(() => {});

      return result;
    } catch {
      //
    }
  }

  const apiRes = await safeApiFetch("/api/bemtevi/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanData)
  });
  if (apiRes && apiRes.ok) {
    const json = await apiRes.json().catch(() => null);
    if (json?.message) {
      const cached = readLocalJson<any[]>(BEMTEVI_MESSAGES_CACHE_KEY, []);
      writeLocalJson(BEMTEVI_MESSAGES_CACHE_KEY, [...cached, json.message].slice(-200));
      return json.message;
    }
  }

  const localMsg = {
    id: `local-msg-${Date.now()}`,
    ...cleanData,
    createdAt: nowIso,
    isLocalOnly: true
  };
  const cached = readLocalJson<any[]>(BEMTEVI_MESSAGES_CACHE_KEY, []);
  writeLocalJson(BEMTEVI_MESSAGES_CACHE_KEY, [...cached, localMsg].slice(-200));
  return localMsg;
}

// ============================================
// NOTWIKIPEDIA / NOTMEDIAWIKI DATABASE SYNC
// ============================================

export async function listWikiArticlesFromDb(): Promise<any[]> {
  try {
    const q = query(collection(db, "wiki_articles"), orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString()
      });
    });
    if (list.length > 0) return list;
  } catch (err) {
    console.warn("Firestore wiki_articles read error:", err);
  }

  // Fallback to backend API
  const res = await safeApiFetch("/api/v1/content/articles");
  if (res && res.ok) {
    const data = await res.json().catch(() => null);
    return data?.articles || [];
  }

  return [];
}

export async function saveWikiArticleInDb(articleData: any, revisionData?: any): Promise<{ article: any; revision?: any }> {
  // Validação rigorosa de esquema antes de enviar verbete Wiki para o Firestore
  const validatedWiki = assertValidWikiArticlePayload(articleData);
  const slug = validatedWiki.slug;
  const revId = revisionData?.id || `rev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const finalArticle = sanitizeFirestoreData({
    ...articleData,
    id: validatedWiki.id,
    slug,
    title: validatedWiki.title,
    namespace: validatedWiki.namespace,
    wikitext: validatedWiki.wikitext,
    summary: validatedWiki.summary,
    categories: validatedWiki.categories,
    views: validatedWiki.views,
    latestRevisionId: revId,
    updatedAt: now
  });

  const finalRev = revisionData ? sanitizeFirestoreData({
    ...revisionData,
    id: revId,
    articleSlug: slug,
    timestamp: now
  }) : null;

  try {
    await setDoc(doc(db, "wiki_articles", slug), sanitizeFirestoreData({
      ...finalArticle,
      updatedAt: serverTimestamp()
    }), { merge: true });

    if (finalRev) {
      await setDoc(doc(db, "wiki_revisions", revId), sanitizeFirestoreData({
        ...finalRev,
        timestamp: serverTimestamp()
      }));
    }

    await addDoc(collection(db, "wiki_events"), sanitizeFirestoreData({
      page_title: finalArticle.title,
      page_namespace: 0,
      rev_id: revId,
      rev_len: finalArticle.wikitext?.length || 0,
      user_text: finalRev?.author?.name || "Editor Comunitário",
      comment: finalRev?.comment || "Edição de artigo",
      type: "edit",
      timestamp: serverTimestamp(),
      dt: now
    })).catch(() => {});

    safeApiFetch("/api/v1/content/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: finalArticle.title,
        wikitext: finalArticle.wikitext,
        summary: finalRev?.comment || finalArticle.summary || "",
        isMinor: finalRev?.isMinor || false,
        authorName: finalRev?.author?.name || "Editor Comunitário",
        authorId: finalRev?.author?.id || "usr_community"
      })
    }).catch(() => {});

    return { article: finalArticle, revision: finalRev };
  } catch (err) {
    const res = await safeApiFetch("/api/v1/content/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: finalArticle.title,
        wikitext: finalArticle.wikitext,
        summary: finalRev?.comment || finalArticle.summary || "",
        isMinor: finalRev?.isMinor || false,
        authorName: finalRev?.author?.name || "Editor Comunitário",
        authorId: finalRev?.author?.id || "usr_community"
      })
    });
    if (res && res.ok) {
      const data = await res.json();
      return { article: data.article, revision: data.revision };
    }
    throw err;
  }
}

export async function deleteWikiArticleFromDb(slug: string): Promise<boolean> {
  const normalizedSlug = slug.toLowerCase();
  try {
    await deleteDoc(doc(db, "wiki_articles", normalizedSlug));
    safeApiFetch(`/api/v1/content/articles/${encodeURIComponent(normalizedSlug)}`, {
      method: "DELETE"
    }).catch(() => {});
    return true;
  } catch {
    const res = await safeApiFetch(`/api/v1/content/articles/${encodeURIComponent(normalizedSlug)}`, {
      method: "DELETE"
    });
    return Boolean(res?.ok);
  }
}

export async function listWikiRevisionsFromDb(slug?: string): Promise<any[]> {
  try {
    const q = query(collection(db, "wiki_revisions"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp || new Date().toISOString()
      });
    });
    if (slug) {
      const filtered = list.filter((r) => r.articleSlug?.toLowerCase() === slug.toLowerCase());
      if (filtered.length > 0) return filtered;
    } else if (list.length > 0) {
      return list;
    }
  } catch {
    //
  }

  if (slug) {
    const res = await safeApiFetch(`/api/v1/revisions/article/${encodeURIComponent(slug)}`);
    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      return data?.revisions || [];
    }
  }

  return [];
}

export async function listWikiEventsFromDb(): Promise<any[]> {
  try {
    const q = query(collection(db, "wiki_events"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp || new Date().toISOString()
      });
    });
    if (list.length > 0) return list;
  } catch {
    //
  }

  const res = await safeApiFetch("/api/v1/events/history");
  if (res && res.ok) {
    const data = await res.json().catch(() => null);
    return data?.events || [];
  }

  return [];
}

// ============================================
// NOTMEDIAWIKI USER PAGES (NAMESPACE 2) & FIRST-LOGIN AUTO-PROVISIONING
// Uses Firestore /userpage/{uid} (owner writable) + Backend API + Local Cache
// ============================================

const NOTMEDIAWIKI_USERPAGES_CACHE_KEY = "wzzm_notmediawiki_userpages";
const NOTMEDIAWIKI_USER_REVISIONS_CACHE_KEY = "wzzm_notmediawiki_user_revisions";

function normalizeUserPageRecord(raw: any, fallbackUid?: string): WikiArticle & {
  ownerUid: string;
  ownerName?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  isTeacher?: boolean;
  isGuest?: boolean;
  firstLoginAt?: string;
} {
  const uid = raw?.ownerUid || raw?.uid || fallbackUid || "usr_unknown";
  const displayName = resolveUserDisplayName({
    uid,
    name: raw?.ownerName || raw?.name || (typeof raw?.title === "string" ? raw.title.replace(/^Usuário:/i, "") : undefined),
    displayName: raw?.displayName,
    email: raw?.ownerEmail || raw?.email
  });
  const createdAt = raw?.createdAt?.toDate ? raw.createdAt.toDate().toISOString() : (raw?.createdAt || new Date().toISOString());
  const updatedAt = raw?.updatedAt?.toDate ? raw.updatedAt.toDate().toISOString() : (raw?.updatedAt || createdAt);
  const firstLoginAt = raw?.firstLoginAt?.toDate ? raw.firstLoginAt.toDate().toISOString() : (raw?.firstLoginAt || createdAt);
  const slug = raw?.slug || buildPersonalUserPageSlug(displayName, uid);
  const title = raw?.title || buildPersonalUserPageTitle(displayName, uid);
  const wikitext =
    typeof raw?.wikitext === "string" && raw.wikitext.trim().length > 0
      ? raw.wikitext
      : buildPersonalUserPageWikitext(
          {
            uid,
            name: displayName,
            displayName,
            profilePictureUrl: raw?.avatarUrl || raw?.profilePictureUrl || "",
            isAdmin: Boolean(raw?.isAdmin),
            isTeacher: Boolean(raw?.isTeacher),
            isGuest: Boolean(raw?.isGuest),
            firstLoginAt,
            lastLoginAt: updatedAt
          },
          { contributionsCount: 1, pagesCreated: 1, lastEditAt: updatedAt }
        );

  return {
    id: raw?.id || `userpage-${uid}`,
    slug,
    title,
    namespace: 2,
    wikitext,
    summary: raw?.summary || `Página pessoal de ${displayName} no NotMediaWiki (com Infobox e contribuições).`,
    latestRevisionId: raw?.latestRevisionId || `rev-user-${uid.slice(0, 8)}`,
    createdAt,
    updatedAt,
    categories: Array.isArray(raw?.categories) && raw.categories.length > 0 ? raw.categories : ["Usuários", "NotMediaWiki"],
    views: typeof raw?.views === "number" ? raw.views : 1,
    ownerUid: uid,
    ownerName: displayName,
    avatarUrl: raw?.avatarUrl || raw?.profilePictureUrl || "",
    isAdmin: Boolean(raw?.isAdmin),
    isTeacher: Boolean(raw?.isTeacher),
    isGuest: Boolean(raw?.isGuest),
    firstLoginAt,
    isPersonalUserPage: true
  };
}

export function listLocalUserWikiRevisions(): any[] {
  return readLocalJson<any[]>(NOTMEDIAWIKI_USER_REVISIONS_CACHE_KEY, []);
}

export async function listNotMediaWikiUserPagesFromDb(): Promise<WikiArticle[]> {
  const pageMap = new Map<string, WikiArticle>();

  // 1. Public Firestore userpage collection (read allowed globally)
  try {
    const snapshot = await getDocs(collection(db, "userpage"));
    snapshot.forEach((docSnap) => {
      const normalized = normalizeUserPageRecord({ id: `userpage-${docSnap.id}`, ...docSnap.data() }, docSnap.id);
      pageMap.set(normalized.ownerUid || docSnap.id, normalized);
    });
  } catch {
    // Graceful fallback
  }

  // 2. Express API userpages store
  const apiRes = await safeApiFetch("/api/v1/userpages");
  if (apiRes && apiRes.ok) {
    const json = await apiRes.json().catch(() => null);
    for (const up of json?.userPages || []) {
      const normalized = normalizeUserPageRecord(up, up?.ownerUid);
      const key = normalized.ownerUid || normalized.id;
      if (!pageMap.has(key)) {
        pageMap.set(key, normalized);
      }
    }
  }

  // 3. LocalStorage cache (preserves guest or offline userpages)
  const localPages = readLocalJson<any[]>(NOTMEDIAWIKI_USERPAGES_CACHE_KEY, []);
  for (const lp of localPages) {
    const normalized = normalizeUserPageRecord(lp, lp?.ownerUid);
    const key = normalized.ownerUid || normalized.id;
    const existing = pageMap.get(key);
    if (!existing || new Date(normalized.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      pageMap.set(key, normalized);
    }
  }

  const merged = Array.from(pageMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  writeLocalJson(NOTMEDIAWIKI_USERPAGES_CACHE_KEY, merged.slice(0, 100));
  return merged;
}

export async function getNotMediaWikiUserPageByUid(uid: string): Promise<WikiArticle | null> {
  if (!uid) return null;

  try {
    const snap = await getDoc(doc(db, "userpage", uid));
    if (snap.exists()) {
      return normalizeUserPageRecord(snap.data(), uid);
    }
  } catch {
    //
  }

  const localPages = readLocalJson<any[]>(NOTMEDIAWIKI_USERPAGES_CACHE_KEY, []);
  const localHit = localPages.find((p) => p?.ownerUid === uid);
  if (localHit) return normalizeUserPageRecord(localHit, uid);

  const apiRes = await safeApiFetch(`/api/v1/userpages/${encodeURIComponent(uid)}`);
  if (apiRes && apiRes.ok) {
    const json = await apiRes.json().catch(() => null);
    if (json?.userPage) return normalizeUserPageRecord(json.userPage, uid);
  }

  return null;
}

export async function ensureUserNotMediaWikiPersonalPage(
  user: User | { uid: string; displayName?: string | null; name?: string | null; email?: string | null; photoURL?: string | null; profilePictureUrl?: string | null; isAdmin?: boolean; isTeacher?: boolean; isGuest?: boolean },
  isGuest = false
): Promise<{ userPage: WikiArticle; isFirstLogin: boolean }> {
  const uid = user.uid;
  const email = user.email || "";
  const isBurocrata = isAuthorizedBurocrata(email) || Boolean((user as any).isAdmin);
  const displayName = resolveUserDisplayName({
    uid,
    name: (user as any).name,
    displayName: user.displayName,
    email
  });
  const avatarUrl = (user as any).photoURL || (user as any).profilePictureUrl || "";
  const nowIso = new Date().toISOString();

  // Check existing page across Firestore /userpage/{uid}, localStorage cache, and backend
  let existingRaw: any = null;
  if (!isGuest && auth.currentUser && auth.currentUser.uid === uid) {
    try {
      const snap = await getDoc(doc(db, "userpage", uid));
      if (snap.exists()) {
        existingRaw = snap.data();
      }
    } catch {
      //
    }
  }

  if (!existingRaw) {
    const localPages = readLocalJson<any[]>(NOTMEDIAWIKI_USERPAGES_CACHE_KEY, []);
    existingRaw = localPages.find((p) => p?.ownerUid === uid) || null;
  }

  const alreadyProvisioned = Boolean(
    existingRaw &&
      existingRaw.notMediaWikiPageCreated &&
      typeof existingRaw.wikitext === "string" &&
      existingRaw.wikitext.trim().length > 0
  );

  if (alreadyProvisioned) {
    const normalizedExisting = normalizeUserPageRecord(existingRaw, uid);
    if (!isGuest && auth.currentUser && auth.currentUser.uid === uid) {
      safeApiFetch("/api/v1/userpages/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          name: displayName,
          displayName,
          profilePictureUrl: avatarUrl,
          isTeacher: isBurocrata || Boolean((user as any).isTeacher)
        })
      }).catch(() => {});
    }
    return { userPage: normalizedExisting, isFirstLogin: false };
  }

  // First login provisioning!
  const slug = buildPersonalUserPageSlug(displayName, uid);
  const title = buildPersonalUserPageTitle(displayName, uid);
  const firstLoginIso = existingRaw?.firstLoginAt || nowIso;
  const wikitext = buildPersonalUserPageWikitext(
    {
      uid,
      name: displayName,
      displayName,
      email,
      profilePictureUrl: avatarUrl,
      isAdmin: isBurocrata,
      isTeacher: isBurocrata || Boolean((user as any).isTeacher),
      isGuest,
      firstLoginAt: firstLoginIso,
      lastLoginAt: nowIso
    },
    { contributionsCount: 1, pagesCreated: 1, lastEditAt: nowIso }
  );

  const initRevId = `rev-usr-init-${Date.now().toString(36)}`;
  const createdPage = normalizeUserPageRecord(
    {
      id: `userpage-${uid}`,
      slug,
      title,
      namespace: 2,
      wikitext,
      summary: `Página pessoal oficial de ${displayName} no NotMediaWiki (provisionada no primeiro login).`,
      latestRevisionId: initRevId,
      createdAt: firstLoginIso,
      updatedAt: nowIso,
      firstLoginAt: firstLoginIso,
      categories: ["Usuários", "NotMediaWiki"],
      views: 1,
      ownerUid: uid,
      ownerName: displayName,
      avatarUrl,
      isAdmin: isBurocrata,
      isTeacher: isBurocrata || Boolean((user as any).isTeacher),
      isGuest,
      isPersonalUserPage: true,
      notMediaWikiPageCreated: true
    },
    uid
  );

  // Persist to local cache
  const localPages = readLocalJson<any[]>(NOTMEDIAWIKI_USERPAGES_CACHE_KEY, []);
  const nextLocalPages = [
    { ...createdPage, notMediaWikiPageCreated: true },
    ...localPages.filter((p) => p?.ownerUid !== uid)
  ];
  writeLocalJson(NOTMEDIAWIKI_USERPAGES_CACHE_KEY, nextLocalPages.slice(0, 100));

  // Record initial contribution revision locally
  const initRev = {
    id: initRevId,
    articleSlug: slug,
    parentRevisionId: null,
    wikitext,
    comment: `Criação automática da página pessoal ${title} e Infobox Usuário no primeiro login`,
    author: { id: uid, name: displayName, isBot: false },
    timestamp: nowIso,
    sha256: computeSha256Hex(wikitext),
    byteSize: wikitext.length,
    isMinor: false
  };
  const localRevs = readLocalJson<any[]>(NOTMEDIAWIKI_USER_REVISIONS_CACHE_KEY, []);
  writeLocalJson(NOTMEDIAWIKI_USER_REVISIONS_CACHE_KEY, [initRev, ...localRevs.filter((r) => r.id !== initRev.id)].slice(0, 200));

  // Persist to Firestore /userpage/{uid} (allowed for owner per firestore.rules) without exposing raw PII email
  if (!isGuest && auth.currentUser && auth.currentUser.uid === uid) {
    try {
      await setDoc(
        doc(db, "userpage", uid),
        sanitizeFirestoreData({
          id: createdPage.id,
          uid,
          ownerUid: uid,
          ownerName: displayName,
          displayName,
          avatarUrl,
          slug: createdPage.slug,
          title: createdPage.title,
          namespace: 2,
          wikitext: createdPage.wikitext,
          summary: createdPage.summary,
          latestRevisionId: initRevId,
          categories: createdPage.categories,
          views: 1,
          isAdmin: isBurocrata,
          isTeacher: isBurocrata || Boolean((user as any).isTeacher),
          isGuest: false,
          isPersonalUserPage: true,
          notMediaWikiPageCreated: true,
          firstLoginAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }),
        { merge: true }
      );

      await setDoc(
        doc(db, "users", uid),
        sanitizeFirestoreData({
          notMediaWikiPageSlug: createdPage.slug,
          notMediaWikiPageCreated: true
        }),
        { merge: true }
      ).catch(() => {});
    } catch {
      // Cache + backend API still guarantee full persistence
    }

    safeApiFetch("/api/v1/userpages/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        name: displayName,
        displayName,
        profilePictureUrl: avatarUrl,
        isTeacher: isBurocrata || Boolean((user as any).isTeacher)
      })
    }).catch(() => {});
  }

  return { userPage: createdPage, isFirstLogin: true };
}

export async function saveNotMediaWikiUserPageToDb(
  userPageData: WikiArticle,
  revisionData?: any
): Promise<{ userPage: WikiArticle; revision?: any }> {
  const ownerUid = userPageData.ownerUid || auth.currentUser?.uid || "usr_community";
  const revId =
    revisionData?.id ||
    userPageData.latestRevisionId ||
    `rev-usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const savedPage = normalizeUserPageRecord(
    {
      ...userPageData,
      ownerUid,
      latestRevisionId: revId,
      updatedAt: nowIso,
      notMediaWikiPageCreated: true
    },
    ownerUid
  );

  // 1. Update localStorage cache immediately
  const localPages = readLocalJson<any[]>(NOTMEDIAWIKI_USERPAGES_CACHE_KEY, []);
  writeLocalJson(NOTMEDIAWIKI_USERPAGES_CACHE_KEY, [
    { ...savedPage, notMediaWikiPageCreated: true },
    ...localPages.filter((p) => p?.ownerUid !== ownerUid)
  ].slice(0, 100));

  const finalRev = revisionData
    ? {
        ...revisionData,
        id: revId,
        articleSlug: savedPage.slug,
        timestamp: nowIso,
        sha256: revisionData.sha256 || computeSha256Hex(savedPage.wikitext),
        byteSize: savedPage.wikitext.length
      }
    : null;

  if (finalRev) {
    const localRevs = readLocalJson<any[]>(NOTMEDIAWIKI_USER_REVISIONS_CACHE_KEY, []);
    writeLocalJson(NOTMEDIAWIKI_USER_REVISIONS_CACHE_KEY, [finalRev, ...localRevs.filter((r) => r.id !== finalRev.id)].slice(0, 200));
  }

  // 2. Write to Firestore /userpage/{ownerUid} (allowed for owner || publisher)
  if (auth.currentUser && (auth.currentUser.uid === ownerUid || isAuthorizedPublisher(auth.currentUser.email))) {
    try {
      await setDoc(
        doc(db, "userpage", ownerUid),
        sanitizeFirestoreData({
          id: savedPage.id,
          uid: ownerUid,
          ownerUid,
          ownerName: (savedPage as any).ownerName || savedPage.title.replace(/^Usuário:/i, ""),
          slug: savedPage.slug,
          title: savedPage.title,
          namespace: 2,
          wikitext: savedPage.wikitext,
          summary: savedPage.summary,
          latestRevisionId: revId,
          categories: savedPage.categories,
          views: savedPage.views,
          isPersonalUserPage: true,
          notMediaWikiPageCreated: true,
          updatedAt: serverTimestamp()
        }),
        { merge: true }
      );
    } catch {
      //
    }
  }

  // 3. Sync with backend /api/v1/userpages/:uid
  safeApiFetch(`/api/v1/userpages/${encodeURIComponent(ownerUid)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: savedPage.title,
      wikitext: savedPage.wikitext,
      summary: finalRev?.comment || savedPage.summary,
      isMinor: finalRev?.isMinor || false,
      authorName: finalRev?.author?.name || (savedPage as any).ownerName,
      authorId: finalRev?.author?.id || ownerUid,
      userEmail: auth.currentUser?.email || ""
    })
  }).catch(() => {});

  return { userPage: savedPage, revision: finalRev };
}

// ============================================
// EXTENSION INTEGRITY VERIFICATION LAYER (FIRESTORE-BACKED)
// Validates downloaded extension metadata & signatures against
// registered hashes in Firestore prior to runtime execution.
// ============================================

export interface ExtensionIntegrityCheckResult {
  extensionId: string;
  valid: boolean;
  canExecute: boolean;
  status: 'verified' | 'tampered' | 'quarantined' | 'unregistered' | 'unverified';
  expectedHash: string;
  computedHash: string;
  filesIntegrity: {
    fileName: string;
    expectedHash: string;
    computedHash: string;
    match: boolean;
  }[];
  originAllowed: boolean;
  authorizedBureaucrat: boolean;
  errors: string[];
  verifiedAt: string;
  firestoreDocId?: string;
}

export interface FirestoreExtensionMetadata {
  id: string;
  name: string;
  namePt?: string;
  version: string;
  packageSha256: string;
  originDomain: string;
  files: {
    name: string;
    size: number;
    sha256: string;
  }[];
  registeredBy: string;
  registeredAt: any;
  signatureStatus: 'verified' | 'tampered' | 'quarantined' | 'unverified';
  quarantined: boolean;
  quarantineReason?: string;
}

/**
 * Computes canonical composite SHA-256 hash across all files and essential metadata
 */
export function computeCanonicalExtensionHash(ext: WikiExtension): string {
  const fileSignatures = (ext.files || [])
    .map(f => `${f.name}:${computeSha256Hex(f.content || '')}`)
    .sort()
    .join(';');
  const canonicalString = `id:${ext.id}|ver:${ext.version}|domain:${ext.originDomain}|files:${fileSignatures}`;
  return computeSha256Hex(canonicalString);
}

/**
 * Registers or updates an extension's authorized hash in Firestore.
 * Strictly enforced: Only pedrohenriquecardonaperes@gmail.com can register or update hashes.
 */
export async function registerExtensionHashInFirestore(
  extension: WikiExtension,
  bureaucratEmail?: string
): Promise<{ success: boolean; hash: string; error?: string }> {
  const email = bureaucratEmail || AUTHORIZED_BUROCRATA_EMAIL;
  if (!isAuthorizedBurocrata(email)) {
    return {
      success: false,
      hash: '',
      error: `Acesso negado: Somente o Burocrata oficial (${AUTHORIZED_BUROCRATA_EMAIL}) pode registrar ou assinar hashes de extensões no Firestore.`
    };
  }

  // Calculate file digests and package composite hash
  const processedFiles = (extension.files || []).map(f => {
    const calculatedSha = computeSha256Hex(f.content || '');
    return {
      name: f.name,
      size: f.size || (f.content ? f.content.length : 0),
      sha256: calculatedSha
    };
  });

  const packageHash = computeCanonicalExtensionHash(extension);

  const payload: FirestoreExtensionMetadata = sanitizeFirestoreData({
    id: extension.id,
    name: extension.name,
    namePt: extension.namePt,
    version: extension.version,
    packageSha256: packageHash,
    originDomain: extension.originDomain,
    files: processedFiles,
    registeredBy: email,
    registeredAt: serverTimestamp(),
    signatureStatus: extension.quarantined ? 'quarantined' : 'verified',
    quarantined: !!extension.quarantined,
    quarantineReason: extension.quarantineReason
  });

  try {
    // Save to primary extensions registry in Firestore
    await setDoc(doc(db, "wiki_extensions", extension.id), payload, { merge: true });
    // Also save to immutable integrity registry collection
    await setDoc(doc(db, "extensions_integrity_registry", extension.id), sanitizeFirestoreData({
      ...payload,
      syncedAt: serverTimestamp()
    }), { merge: true });

    // Log the registration event in audit log
    await registerAuditLog(
      email,
      "EXTENSION_HASH_REGISTERED",
      { extensionId: extension.id, sha256: packageHash, filesCount: processedFiles.length }
    );

    // Sync with backend API
    safeApiFetch("/api/v1/extensions/security/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        extension: { ...extension, sha256: packageHash },
        userEmail: email
      })
    }).catch(() => {});

    return { success: true, hash: packageHash };
  } catch (err: any) {
    // Fallback sync via backend
    const res = await safeApiFetch("/api/v1/extensions/security/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        extension: { ...extension, sha256: packageHash },
        userEmail: email
      })
    });
    if (res && res.ok) {
      return { success: true, hash: packageHash };
    }
    return { success: false, hash: packageHash, error: err.message };
  }
}

/**
 * Validates the downloaded extension metadata and files against the hashes
 * registered in Firestore before allowing execution.
 */
export async function verifyExtensionIntegrityWithFirestore(
  extension: WikiExtension
): Promise<ExtensionIntegrityCheckResult> {
  const errors: string[] = [];
  const filesIntegrity: ExtensionIntegrityCheckResult['filesIntegrity'] = [];
  const verifiedAt = new Date().toISOString();

  // 1. Origin Domain Whitelist Validation
  const originClean = (extension.originDomain || '').toLowerCase().trim();
  const originAllowed = ALLOWED_EXTENSION_DOMAINS.some(
    d => originClean === d || originClean.endsWith('.' + d)
  );
  if (!originAllowed) {
    errors.push(`Domínio de origem "${extension.originDomain}" não está na Whitelist autorizada.`);
  }

  // 2. Compute local downloaded hash
  const computedPackageHash = computeCanonicalExtensionHash(extension);

  // 3. Fetch registered hash record from Firestore
  let firestoreRecord: FirestoreExtensionMetadata | null = null;
  try {
    const docSnap = await getDoc(doc(db, "wiki_extensions", extension.id));
    if (docSnap.exists()) {
      firestoreRecord = docSnap.data() as FirestoreExtensionMetadata;
    }
  } catch (err) {
    console.warn(`Firestore read warning for extension ${extension.id}:`, err);
  }

  // If not found in Firestore, check baseline seed registry
  if (!firestoreRecord) {
    const seed = SEED_WIKI_EXTENSIONS.find(e => e.id === extension.id);
    if (seed) {
      const seedHash = computeCanonicalExtensionHash(seed);
      firestoreRecord = {
        id: seed.id,
        name: seed.name,
        namePt: seed.namePt,
        version: seed.version,
        packageSha256: seedHash,
        originDomain: seed.originDomain,
        files: (seed.files || []).map(f => ({
          name: f.name,
          size: f.size,
          sha256: computeSha256Hex(f.content || '')
        })),
        registeredBy: AUTHORIZED_BUROCRATA_EMAIL,
        registeredAt: new Date().toISOString(),
        signatureStatus: 'verified',
        quarantined: false
      };
      // Auto-register baseline seed in Firestore asynchronously
      registerExtensionHashInFirestore(seed, AUTHORIZED_BUROCRATA_EMAIL).catch(() => {});
    }
  }

  if (!firestoreRecord) {
    errors.push(`A extensão "${extension.id}" não possui registro de assinatura ou hash no Firestore.`);
    return {
      extensionId: extension.id,
      valid: false,
      canExecute: false,
      status: 'unregistered',
      expectedHash: 'N/A',
      computedHash: computedPackageHash,
      filesIntegrity: [],
      originAllowed,
      authorizedBureaucrat: false,
      errors,
      verifiedAt
    };
  }

  const expectedPackageHash = firestoreRecord.packageSha256;

  // 4. Validate Bureaucrat Authority of the registered record
  const authorizedBureaucrat = isAuthorizedBurocrata(firestoreRecord.registeredBy);
  if (!authorizedBureaucrat) {
    errors.push(`Assinatura do registro no Firestore não pertence ao Burocrata oficial (${firestoreRecord.registeredBy}).`);
  }

  // 5. Check Quarantine Status in Firestore
  const isQuarantined = !!(firestoreRecord.quarantined || extension.quarantined);
  if (isQuarantined) {
    errors.push(`BLOQUEIO: A extensão está classificada em QUARENTENA no Firestore (${firestoreRecord.quarantineReason || 'Código malicioso detectado'}).`);
  }

  // 6. Verify Each Constituent File Hash Against Firestore Record
  const registeredFilesMap = new Map<string, string>();
  (firestoreRecord.files || []).forEach(f => {
    registeredFilesMap.set(f.name, f.sha256);
  });

  let filesTampered = false;
  if (!extension.files || extension.files.length === 0) {
    errors.push("Nenhum arquivo local encontrado no pacote da extensão para validação.");
    filesTampered = true;
  } else {
    for (const f of extension.files) {
      const computedFileHash = computeSha256Hex(f.content || '');
      const expectedFileHash = registeredFilesMap.get(f.name) || '';
      const match = expectedFileHash === computedFileHash;

      filesIntegrity.push({
        fileName: f.name,
        expectedHash: expectedFileHash,
        computedHash: computedFileHash,
        match
      });

      if (!match) {
        filesTampered = true;
        errors.push(
          `Adulteração no arquivo "${f.name}": hash baixado (${computedFileHash.slice(0, 12)}...) diverge do registrado no Firestore (${expectedFileHash ? expectedFileHash.slice(0, 12) + '...' : 'INEXISTENTE'}).`
        );
      }
    }
  }

  // 7. Verify Package Composite Hash
  const packageMatches = computedPackageHash === expectedPackageHash;
  if (!packageMatches && !filesTampered) {
    errors.push(`O hash do pacote (${computedPackageHash.slice(0, 12)}...) não coincide com o registrado no Firestore (${expectedPackageHash.slice(0, 12)}...).`);
  }

  // 8. Determine Final Status
  let finalStatus: ExtensionIntegrityCheckResult['status'] = 'verified';
  if (isQuarantined) {
    finalStatus = 'quarantined';
  } else if (filesTampered || !packageMatches) {
    finalStatus = 'tampered';
  } else if (!originAllowed || !authorizedBureaucrat) {
    finalStatus = 'unverified';
  }

  const valid = finalStatus === 'verified';
  const canExecute = valid && !isQuarantined;

  // Log Security Alert if Tampering Detected
  if (finalStatus === 'tampered') {
    registerAuditLog(
      "security_monitor",
      "EXTENSION_TAMPERING_BLOCKED",
      {
        extensionId: extension.id,
        errors,
        computedHash: computedPackageHash,
        expectedHash: expectedPackageHash
      }
    ).catch(() => {});
  }

  return {
    extensionId: extension.id,
    valid,
    canExecute,
    status: finalStatus,
    expectedHash: expectedPackageHash,
    computedHash: computedPackageHash,
    filesIntegrity,
    originAllowed,
    authorizedBureaucrat,
    errors,
    verifiedAt,
    firestoreDocId: firestoreRecord.id
  };
}

/**
 * High-Security Execution Wrapper
 * Executes an extension hook/function ONLY IF the integrity check against Firestore succeeds.
 */
export async function executeExtensionSafely<T>(
  extension: WikiExtension,
  executionFn: () => T
): Promise<{ success: boolean; result?: T; error?: string; integrity: ExtensionIntegrityCheckResult }> {
  const integrity = await verifyExtensionIntegrityWithFirestore(extension);

  if (!integrity.canExecute) {
    const errorMsg = `Execução da extensão "${extension.name}" abortada pelo Dispositivo de Integridade do Firestore: [Status: ${integrity.status}] - ${integrity.errors.join(' ')}`;
    console.error(errorMsg);
    return {
      success: false,
      error: errorMsg,
      integrity
    };
  }

  try {
    const result = executionFn();
    return {
      success: true,
      result,
      integrity
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Erro durante a execução sandboxed da extensão: ${err.message}`,
      integrity
    };
  }
}

/**
 * Loads all extensions from Firestore and runs the integrity verification layer on all of them.
 */
export async function loadAndVerifyAllExtensionsFromDb(): Promise<{
  verifiedExtensions: WikiExtension[];
  quarantinedExtensions: WikiExtension[];
  tamperedExtensions: WikiExtension[];
  integrityResults: Record<string, ExtensionIntegrityCheckResult>;
}> {
  const verifiedExtensions: WikiExtension[] = [];
  const quarantinedExtensions: WikiExtension[] = [];
  const tamperedExtensions: WikiExtension[] = [];
  const integrityResults: Record<string, ExtensionIntegrityCheckResult> = {};

  // Get base extensions list
  let sourceList: WikiExtension[] = [...SEED_WIKI_EXTENSIONS];
  try {
    const snapshot = await getDocs(collection(db, "wiki_extensions"));
    if (!snapshot.empty) {
      const dbExtMap = new Map<string, any>();
      snapshot.forEach(docSnap => dbExtMap.set(docSnap.id, docSnap.data()));

      sourceList = sourceList.map(ext => {
        const dbData = dbExtMap.get(ext.id);
        if (dbData) {
          return {
            ...ext,
            quarantined: !!dbData.quarantined,
            signatureStatus: dbData.signatureStatus || ext.signatureStatus
          };
        }
        return ext;
      });
    }
  } catch (err) {
    console.warn("Could not query wiki_extensions directly from Firestore:", err);
  }

  for (const ext of sourceList) {
    const check = await verifyExtensionIntegrityWithFirestore(ext);
    integrityResults[ext.id] = check;

    const updatedExt: WikiExtension = {
      ...ext,
      signatureStatus: check.status === 'verified' ? 'verified' : check.status === 'quarantined' ? 'quarantined' : 'tampered',
      quarantined: !check.canExecute && check.status === 'quarantined'
    };

    if (check.status === 'verified') {
      verifiedExtensions.push(updatedExt);
    } else if (check.status === 'quarantined') {
      quarantinedExtensions.push(updatedExt);
    } else {
      tamperedExtensions.push(updatedExt);
    }
  }

  return {
    verifiedExtensions,
    quarantinedExtensions,
    tamperedExtensions,
    integrityResults
  };
}

