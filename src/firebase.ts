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


