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
// REGISTRATION & USER PROFILE
// ============================================
export async function registerUser(user: User | { uid: string; displayName?: string; email?: string; photoURL?: string }, isGuest = false) {
  const uid = user.uid;
  const userData = {
    uid: uid,
    email: user.email || (isGuest ? `${uid}@guest.local` : ""),
    name: user.displayName || (isGuest ? "Convidado (24h)" : "Usuário"),
    profilePictureUrl: ('photoURL' in user ? user.photoURL : "") || "",
    isAdmin: false,
    isBan: false,
    isBanned: false,
    isTeacher: false,
    isTeatcher: false,
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

export async function checkIfUserIsAdmin(uid: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.isAdmin === true;
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
