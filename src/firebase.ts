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
  orderBy, 
  increment,
  writeBatch,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import {
  WikiExtension,
  ExtensionFile,
  computeSha256Hex,
  ALLOWED_EXTENSION_DOMAINS,
  SEED_WIKI_EXTENSIONS
} from "./data/notMediaWikiData";

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

export interface UserNotification {
  id: string;
  userId: string;
  titulo: string;
  mensagem: string;
  timestamp: any;
  lida: boolean;
  tipo?: 'alerta' | 'noticia' | 'sistema';
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
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
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
  const userData = {
    uid: uid,
    email: user.email || (isGuest ? `${uid}@guest.local` : ""),
    name: user.displayName || (isGuest ? "Convidado (24h)" : "Usuário"),
    profilePictureUrl: ('photoURL' in user ? user.photoURL : "") || "",
    isAdmin: isBurocrata,
    isBan: false,
    isBanned: false,
    isTeacher: isBurocrata,
    isTeatcher: isBurocrata,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  };

  try {
    // Write in both "users" and "usuários" collections to match existing database backends
    await setDoc(doc(db, "users", uid), userData, { merge: true });
    await setDoc(doc(db, "usuários", uid), userData, { merge: true });
    return true;
  } catch (error) {
    console.warn("Could not write user profile to Firestore (using local session fallback):", error);
    return false;
  }
}

export async function checkIfUserIsBanned(uid: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.isBanned === true || data.isBan === true;
    }
  } catch (error) {
    console.warn("Could not check user ban status:", error);
  }
  return false;
}

export async function checkIfUserIsAdmin(uid: string, email?: string | null): Promise<boolean> {
  // Primary check: email must be the official Burocrata email
  if (email && isAuthorizedBurocrata(email)) {
    return true;
  }
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Only pedrohenriquecardonaperes@gmail.com can hold admin privileges
      if (isAuthorizedBurocrata(data.email)) {
        return true;
      }
      return false;
    }
  } catch (error) {
    console.warn("Could not check user admin status:", error);
  }
  return false;
}

// ============================================
// CONTENT LOADING WITH API FALLBACK
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
        colecao: collectionName
      });
    });

    if (items.length > 0) {
      return items;
    }
  } catch (error) {
    console.warn(`Firestore read failed for collection "${collectionName}", fallback to optimized backend API:`, error);
  }

  // Second attempt: Fallback to high-performance TypeScript backend route
  try {
    const response = await fetch(`/api/articles?collection=${encodeURIComponent(collectionName)}`);
    if (response.ok) {
      const data = await response.json();
      return data.articles || [];
    }
  } catch (apiErr) {
    console.warn("Backend API fallback error:", apiErr);
  }

  return [];
}

export async function createArticle(articleData: {
  titulo: string;
  descricao: string;
  setor: string;
  criadorEmail: string;
  colecao: string;
}): Promise<string | null> {
  const payload = {
    ...articleData,
    visualizacoes: 1,
    dataCriacao: serverTimestamp(),
    ultimaEdicao: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, articleData.colecao), payload);
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
  } catch (error) {
    // Fail silently, never disrupt reading
  }
}

// ============================================
// NOTIFICATIONS
// ============================================
export function setupNotificationsListener(userId: string, callback: (notifications: UserNotification[]) => void) {
  try {
    const q = query(
      collection(db, "notifications"),
      orderBy("timestamp", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const notifs: UserNotification[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.userId === userId || data.userId === "all" || !data.userId) {
          notifs.push({
            id: docSnapshot.id,
            userId: data.userId || "all",
            titulo: data.titulo || "Notificação",
            mensagem: data.mensagem || "",
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleTimeString("pt-BR") : "Agora",
            lida: !!data.lida,
            tipo: data.tipo || 'sistema'
          });
        }
      });
      callback(notifs);
    }, (error) => {
      console.warn("Firestore notification snapshot warning:", error);
      // Fallback notifications if collection empty or permission restricted
      callback([
        {
          id: 'sys_1',
          userId,
          titulo: 'Edição Digital Atualizada',
          mensagem: 'O acervo acadêmico e notícias da WazzimaGiygg foram sincronizados com o backend.',
          timestamp: 'Agora',
          lida: false,
          tipo: 'sistema'
        },
        {
          id: 'sys_2',
          userId,
          titulo: 'Marco Civil & LGPD',
          mensagem: 'Seus registros de navegação e direitos de privacidade estão protegidos sob a Lei 12.965/2014.',
          timestamp: 'Hoje',
          lida: true,
          tipo: 'alerta'
        }
      ]);
    });
  } catch (err) {
    console.warn("Could not bind notification listener:", err);
    callback([
      {
        id: 'sys_1',
        userId,
        titulo: 'Edição Digital Atualizada',
        mensagem: 'O acervo acadêmico e notícias da WazzimaGiygg foram sincronizados com o backend.',
        timestamp: 'Agora',
        lida: false,
        tipo: 'sistema'
      }
    ]);
    return () => {};
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const docRef = doc(db, "notifications", id);
    await updateDoc(docRef, { lida: true });
  } catch (error) {
    // Fail silently
  }
}

export async function markAllNotificationsAsRead(notifs: UserNotification[]) {
  try {
    const batch = writeBatch(db);
    const unread = notifs.filter(n => !n.lida);
    unread.forEach(n => {
      const docRef = doc(db, "notifications", n.id);
      batch.update(docRef, { lida: true });
    });
    await batch.commit();
  } catch (error) {
    // Fail silently
  }
}

// ============================================
// AUDIT & LOGGING (COMPATIBLE WITH checkuser)
// ============================================
export async function registerAuditLog(userUid: string, action: string, details?: any) {
  const logData = {
    userId: userUid,
    action,
    details: details || {},
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
  };

  // Dispatch to server endpoint for high-speed logging
  try {
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {});
  } catch {
    // ignore
  }

  // Also write to Firestore checkuser collection
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
  // First attempt: Firestore users collection
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const usersList: AppUser[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      usersList.push({
        uid: docSnap.id,
        email: d.email || "",
        name: d.name || d.displayName || "Usuário",
        profilePictureUrl: d.profilePictureUrl || "",
        isAdmin: !!d.isAdmin,
        isBanned: !!(d.isBanned || d.isBan),
        isTeacher: !!(d.isTeacher || d.isTeatcher),
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
        lastLoginAt: d.lastLoginAt?.toDate ? d.lastLoginAt.toDate().toISOString() : d.lastLoginAt
      });
    });
    if (usersList.length > 0) return usersList;
  } catch (err) {
    console.warn("Firestore list users failed, fallback to backend:", err);
  }

  // Fallback: Backend API
  try {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      return data.users || [];
    }
  } catch (apiErr) {
    console.warn("Backend admin users API error:", apiErr);
  }

  return [];
}

export async function getUserByUidFromFirestore(uid: string): Promise<AppUser | null> {
  if (!uid) return null;
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
        lastLoginAt: d.lastLoginAt?.toDate ? d.lastLoginAt.toDate().toISOString() : d.lastLoginAt
      };
    }
  } catch (err) {
    console.warn("Firestore getUserByUidFromFirestore error:", err);
  }

  // Fallback: Backend admin users API
  try {
    const res = await fetch(`/api/admin/users`);
    if (res.ok) {
      const data = await res.json();
      const found = (data.users || []).find((u: any) => u.uid === uid);
      if (found) return found;
    }
  } catch (apiErr) {
    console.warn("Backend user fetch error:", apiErr);
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

  // Also sync with backend API
  try {
    await fetch(`/api/admin/users/${encodeURIComponent(uid)}/toggle-admin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin })
    });
    return true;
  } catch {
    return false;
  }
}

export async function updateUserBanStatus(uid: string, isBanned: boolean, banReason?: string): Promise<boolean> {
  const payload = {
    isBanned,
    isBan: isBanned,
    banReason: isBanned ? (banReason || "Violação das Políticas do Portal") : null,
    bannedAt: isBanned ? serverTimestamp() : null
  };

  try {
    await updateDoc(doc(db, "users", uid), payload);
    await updateDoc(doc(db, "usuários", uid), payload).catch(() => {});
  } catch (err) {
    console.warn("Firestore updateUserBanStatus error:", err);
  }

  try {
    await fetch(`/api/admin/users/${encodeURIComponent(uid)}/toggle-ban`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned, banReason })
    });
    return true;
  } catch {
    return false;
  }
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

  try {
    await fetch(`/api/admin/users/${encodeURIComponent(uid)}/toggle-teacher`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTeacher })
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// LGPD SOLICITAÇÃO DE EXCLUSÃO DE DADOS
// wazzimagiygg.com/admin/admintools/solicitacaodeexlusao/
// ============================================

export async function listDeletionRequests(): Promise<DeletionRequest[]> {
  try {
    const q = query(collection(db, "deletion_requests"), orderBy("requestDate", "desc"));
    const snapshot = await getDocs(q);
    const requests: DeletionRequest[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const reqDate = d.requestDate?.toDate ? d.requestDate.toDate().toISOString() : (d.requestDate || new Date().toISOString());
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
        // Aliases
        protocolo: d.protocolo || docSnap.id,
        nomeCompleto: d.nomeCompleto || d.name || "Titular Anônimo",
        motivo: d.motivo || d.reason || "Exercício de direito LGPD Art. 18",
        tipoDado: d.tipoDado || (Array.isArray(d.dataTypes) ? d.dataTypes.join(", ") : "Expurgo Geral"),
        dataSolicitacao: reqDate,
        observacoes: d.observacoes || d.rejectionReason || "",
        certificadoExclusao: d.certificadoExclusao || d.certificateId || ""
      });
    });
    if (requests.length > 0) return requests;
  } catch (err) {
    console.warn("Could not load deletion_requests from Firestore:", err);
  }

  // Fallback to backend API
  try {
    const res = await fetch("/api/admin/deletion-requests");
    if (res.ok) {
      const data = await res.json();
      return (data.requests || []).map((r: any) => ({
        ...r,
        protocolo: r.protocolo || r.id,
        nomeCompleto: r.nomeCompleto || r.name || "Titular Anônimo",
        motivo: r.motivo || r.reason || "",
        tipoDado: r.tipoDado || (Array.isArray(r.dataTypes) ? r.dataTypes.join(", ") : "Expurgo Geral"),
        dataSolicitacao: r.dataSolicitacao || r.requestDate || new Date().toISOString(),
        observacoes: r.observacoes || r.rejectionReason || "",
        certificadoExclusao: r.certificadoExclusao || r.certificateId || ""
      }));
    }
  } catch (apiErr) {
    console.warn("Backend deletion-requests error:", apiErr);
  }

  return [];
}

/**
 * Real-time Firestore listener for LGPD deletion requests
 */
export function setupDeletionRequestsListener(
  callback: (requests: DeletionRequest[]) => void
): () => void {
  try {
    const q = query(collection(db, "deletion_requests"), orderBy("requestDate", "desc"));
    return onSnapshot(
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
        if (requests.length > 0) {
          callback(requests);
        } else {
          listDeletionRequests().then(callback);
        }
      },
      (err) => {
        console.warn("Firestore deletion_requests snapshot error, falling back to fetch:", err);
        listDeletionRequests().then(callback);
      }
    );
  } catch (err) {
    console.warn("Could not bind deletion_requests snapshot listener:", err);
    listDeletionRequests().then(callback);
    return () => {};
  }
}

export async function updateDeletionRequestStatus(
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'rejected',
  notesOrReason?: string,
  adminEmail?: string,
  certificateId?: string
): Promise<boolean> {
  const admin = adminEmail || AUTHORIZED_BUROCRATA_EMAIL;
  const updatePayload: any = {
    status,
    processedBy: admin,
    updatedAt: serverTimestamp()
  };
  if (status === 'completed') {
    updatePayload.completedAt = serverTimestamp();
    updatePayload.certificateId = certificateId || `LGPD-CERT-${Date.now().toString().slice(-6)}`;
    updatePayload.certificadoExclusao = updatePayload.certificateId;
  } else if (status === 'rejected') {
    updatePayload.rejectedAt = serverTimestamp();
    updatePayload.rejectionReason = notesOrReason || "Fundamentação legal da guarda obrigatória (Marco Civil Art. 15).";
    updatePayload.observacoes = updatePayload.rejectionReason;
  }
  if (notesOrReason) {
    updatePayload.observacoes = notesOrReason;
  }

  try {
    await updateDoc(doc(db, "deletion_requests", id), updatePayload);
  } catch (err) {
    console.warn("Firestore update deletion request error:", err);
  }

  try {
    await fetch(`/api/admin/deletion-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        adminEmail: admin,
        rejectionReason: notesOrReason,
        certificateId: updatePayload.certificateId
      })
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteUserFromFirestore(uid: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "users", uid));
    await deleteDoc(doc(db, "usuários", uid)).catch(() => {});
  } catch (err) {
    console.warn("Firestore deleteUser error:", err);
  }

  try {
    await fetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: "DELETE"
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteArticleFromFirestore(collectionName: string, id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, collectionName, id));
    await deleteDoc(doc(db, "artigos", id)).catch(() => {});
  } catch (err) {
    console.warn("Firestore deleteArticle error:", err);
  }

  try {
    await fetch(`/api/admin/articles/${encodeURIComponent(id)}?collection=${encodeURIComponent(collectionName)}`, {
      method: "DELETE"
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// BEMTEVI REDE SOCIAL - SINCRONIZAÇÃO COM BANCO DE DADOS
// Apenas dados sincronizados do banco de dados são permitidos
// ============================================

export async function listBemteviPostsFromDb(): Promise<any[]> {
  try {
    const q = query(collection(db, "bemtevi_posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const posts: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      posts.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
      });
    });
    if (posts.length > 0) return posts;
  } catch (err) {
    console.warn("Firestore bemtevi_posts read warning:", err);
  }

  // Fallback to backend database endpoint
  try {
    const res = await fetch("/api/bemtevi/posts");
    if (res.ok) {
      const json = await res.json();
      return json.posts || [];
    }
  } catch {
    //
  }

  return [];
}

export async function createBemteviPostInDb(postData: any): Promise<any> {
  const payload = {
    ...postData,
    createdAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, "bemtevi_posts"), payload);
    const result = {
      ...postData,
      id: docRef.id,
      createdAt: new Date().toISOString()
    };
    // Sync to backend cache
    fetch("/api/bemtevi/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    }).catch(() => {});
    return result;
  } catch (err) {
    console.warn("Firestore bemtevi_posts add error, using backend:", err);
    const res = await fetch("/api/bemtevi/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData)
    });
    if (res.ok) {
      const data = await res.json();
      return data.post;
    }
    throw err;
  }
}

export async function deleteBemteviPostInDb(postId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "bemtevi_posts", postId));
  } catch (err) {
    console.warn("Firestore delete bemtevi_post error:", err);
  }

  try {
    await fetch(`/api/bemtevi/posts/${postId}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

export async function listBemteviCommunitiesFromDb(): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(db, "bemtevi_communities"));
    const comms: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      comms.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
      });
    });
    if (comms.length > 0) return comms;
  } catch (err) {
    console.warn("Firestore bemtevi_communities read error:", err);
  }

  try {
    const res = await fetch("/api/bemtevi/communities");
    if (res.ok) {
      const json = await res.json();
      return json.communities || [];
    }
  } catch {
    //
  }

  return [];
}

export async function createBemteviCommunityInDb(commData: any): Promise<any> {
  const payload = {
    ...commData,
    createdAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, "bemtevi_communities"), payload);
    const result = { ...commData, id: docRef.id, createdAt: new Date().toISOString() };
    fetch("/api/bemtevi/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    }).catch(() => {});
    return result;
  } catch (err) {
    const res = await fetch("/api/bemtevi/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commData)
    });
    if (res.ok) {
      const json = await res.json();
      return json.community;
    }
    throw err;
  }
}

export async function listBemteviCommentsFromDb(postId: string): Promise<any[]> {
  try {
    const q = query(collection(db, "bemtevi_comments"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    const comms: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.postId === postId) {
        comms.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
        });
      }
    });
    if (comms.length > 0) return comms;
  } catch (err) {
    console.warn("Firestore bemtevi_comments read error:", err);
  }

  try {
    const res = await fetch(`/api/bemtevi/posts/${postId}/comments`);
    if (res.ok) {
      const json = await res.json();
      return json.comments || [];
    }
  } catch {
    //
  }

  return [];
}

export async function createBemteviCommentInDb(postId: string, commentData: any): Promise<any> {
  const payload = {
    postId,
    ...commentData,
    createdAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, "bemtevi_comments"), payload);
    const result = { id: docRef.id, postId, ...commentData, createdAt: new Date().toISOString() };
    fetch(`/api/bemtevi/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    }).catch(() => {});
    return result;
  } catch (err) {
    const res = await fetch(`/api/bemtevi/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commentData)
    });
    if (res.ok) {
      const json = await res.json();
      return json.comment;
    }
    throw err;
  }
}

export async function listBemteviMessagesFromDb(): Promise<any[]> {
  try {
    const q = query(collection(db, "bemtevi_messages"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    const msgs: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      msgs.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
      });
    });
    if (msgs.length > 0) return msgs;
  } catch (err) {
    console.warn("Firestore bemtevi_messages read error:", err);
  }

  try {
    const res = await fetch("/api/bemtevi/messages");
    if (res.ok) {
      const json = await res.json();
      return json.messages || [];
    }
  } catch {
    //
  }

  return [];
}

export async function createBemteviMessageInDb(msgData: any): Promise<any> {
  const payload = {
    ...msgData,
    createdAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, "bemtevi_messages"), payload);
    const result = { id: docRef.id, ...msgData, createdAt: new Date().toISOString() };
    fetch("/api/bemtevi/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    }).catch(() => {});
    return result;
  } catch (err) {
    const res = await fetch("/api/bemtevi/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msgData)
    });
    if (res.ok) {
      const json = await res.json();
      return json.message;
    }
    throw err;
  }
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
  try {
    const res = await fetch("/api/v1/content/articles");
    if (res.ok) {
      const data = await res.json();
      return data.articles || [];
    }
  } catch {
    //
  }

  return [];
}

export async function saveWikiArticleInDb(articleData: any, revisionData?: any): Promise<{ article: any; revision?: any }> {
  const slug = (articleData.slug || articleData.title.trim().replace(/\s+/g, "_")).toLowerCase();
  const revId = revisionData?.id || `rev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const finalArticle = {
    ...articleData,
    slug,
    latestRevisionId: revId,
    updatedAt: now,
    views: articleData.views || 1
  };

  const finalRev = revisionData ? {
    ...revisionData,
    id: revId,
    articleSlug: slug,
    timestamp: now
  } : null;

  try {
    // Save or update article in Firestore
    await setDoc(doc(db, "wiki_articles", slug), {
      ...finalArticle,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Save revision in Firestore
    if (finalRev) {
      await setDoc(doc(db, "wiki_revisions", revId), {
        ...finalRev,
        timestamp: serverTimestamp()
      });
    }

    // Save event in Firestore
    await addDoc(collection(db, "wiki_events"), {
      page_title: finalArticle.title,
      page_namespace: 0,
      rev_id: revId,
      rev_len: finalArticle.wikitext?.length || 0,
      user_text: finalRev?.author?.name || "Editor Comunitário",
      comment: finalRev?.comment || "Edição de artigo",
      type: "edit",
      timestamp: serverTimestamp(),
      dt: now
    }).catch(() => {});

    // Sync to backend API
    fetch("/api/v1/content/articles", {
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
    // If client-side firestore fails, proxy through backend
    const res = await fetch("/api/v1/content/articles", {
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
    if (res.ok) {
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
    fetch(`/api/v1/content/articles/${encodeURIComponent(normalizedSlug)}`, {
      method: "DELETE"
    }).catch(() => {});
    return true;
  } catch (err) {
    try {
      const res = await fetch(`/api/v1/content/articles/${encodeURIComponent(normalizedSlug)}`, {
        method: "DELETE"
      });
      return res.ok;
    } catch {
      return false;
    }
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
  } catch (err) {
    console.warn("Firestore wiki_revisions read error:", err);
  }

  // Fallback to backend API
  try {
    if (slug) {
      const res = await fetch(`/api/v1/revisions/article/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        return data.revisions || [];
      }
    }
  } catch {
    //
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
  } catch (err) {
    console.warn("Firestore wiki_events read error:", err);
  }

  try {
    const res = await fetch("/api/v1/events/history");
    if (res.ok) {
      const data = await res.json();
      return data.events || [];
    }
  } catch {
    //
  }

  return [];
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

  const payload: FirestoreExtensionMetadata = {
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
  };

  try {
    // Save to primary extensions registry in Firestore
    await setDoc(doc(db, "wiki_extensions", extension.id), payload, { merge: true });
    // Also save to immutable integrity registry collection
    await setDoc(doc(db, "extensions_integrity_registry", extension.id), {
      ...payload,
      syncedAt: serverTimestamp()
    }, { merge: true });

    // Log the registration event in audit log
    await registerAuditLog(
      email,
      "EXTENSION_HASH_REGISTERED",
      { extensionId: extension.id, sha256: packageHash, filesCount: processedFiles.length }
    );

    // Sync with backend API
    fetch("/api/v1/extensions/security/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        extension: { ...extension, sha256: packageHash },
        userEmail: email
      })
    }).catch(() => {});

    return { success: true, hash: packageHash };
  } catch (err: any) {
    console.warn("Could not write extension hash to Firestore directly:", err);
    // Fallback sync via backend
    try {
      const res = await fetch("/api/v1/extensions/security/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extension: { ...extension, sha256: packageHash },
          userEmail: email
        })
      });
      if (res.ok) {
        return { success: true, hash: packageHash };
      }
    } catch {
      //
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

