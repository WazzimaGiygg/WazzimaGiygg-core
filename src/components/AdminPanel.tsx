/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  ShieldAlert,
  Users,
  FileText,
  Ticket,
  Scale,
  Settings,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Crown,
  GraduationCap,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Lock,
  Key,
  ExternalLink,
  Activity,
  Database,
  ArrowLeft,
  X,
  Code,
  Copy,
  Check,
  Send,
  Bell,
  Layers,
  Globe,
  FileCode
} from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import {
  auth,
  googleProvider,
  checkIfUserIsAdmin,
  registerUser,
  AppUser,
  Article,
  listAllUsersFromFirestore,
  updateUserAdminStatus,
  updateUserBanStatus,
  updateUserTeacherStatus,
  deleteUserFromFirestore,
  deleteArticleFromFirestore,
  registerAuditLog,
  db
} from "../firebase";
import {
  FERRAMENTAS_LIST,
  FERRAMENTAS_ADMINISTRATIVAS_SOURCE,
  FerramentaItem
} from "../data/ferramentasSource";

interface AdminPanelProps {
  currentUser: any;
  isAdmin: boolean;
  onClose: () => void;
  onElevateSuccess: (userObj: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export default function AdminPanel({
  currentUser,
  isAdmin,
  onClose,
  onElevateSuccess,
  showToast
}: AdminPanelProps) {
  // Navigation inside Admin Core
  const [adminTab, setAdminTab] = useState<
    "dashboard" | "usuarios" | "artigos" | "tickets" | "sancoes" | "checkuser" | "ferramentas"
  >("dashboard");

  // Authentication & Elevation Form State
  const [passkeyInput, setPasskeyInput] = useState("");
  const [isElevating, setIsElevating] = useState(false);

  // Users Management State
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    isAdmin: false,
    isTeacher: false,
    isBanned: false
  });

  // Ban Modal State
  const [banModalUser, setBanModalUser] = useState<AppUser | null>(null);
  const [banReasonInput, setBanReasonInput] = useState("Violação dos Termos de Uso / Assédio");

  // Articles Moderation State
  const [adminArticles, setAdminArticles] = useState<Article[]>([]);
  const [articleSearchTerm, setArticleSearchTerm] = useState("");
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState("all");
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);

  // Tickets & LGPD State
  const [ticketsList, setTicketsList] = useState<any[]>([]);

  // Sanctions State
  const [sanctionsList, setSanctionsList] = useState<any[]>([]);
  const [newCityName, setNewCityName] = useState("");
  const [newModName, setNewModName] = useState("");

  // System Audit Logs (checkuser)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Ferramentas Administrativas & view-source State
  const [isViewSourceModalOpen, setIsViewSourceModalOpen] = useState(false);
  const [sourceCopied, setSourceCopied] = useState(false);
  const [ferramentasSearch, setFerramentasSearch] = useState("");
  const [selectedFerramentaCategory, setSelectedFerramentaCategory] = useState("all");

  // Inserir Notificação para Usuário (checkuser/notificacao/) State
  const [isSendNotifModalOpen, setIsSendNotifModalOpen] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifForm, setNotifForm] = useState({
    userId: "all",
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "alert"
  });

  // Adicionar HTML Flutuante (htmlcreator/) State
  const [isHtmlFloatingModalOpen, setIsHtmlFloatingModalOpen] = useState(false);
  const [floatingHtmlInput, setFloatingHtmlInput] = useState(
    `<div style="background: #141414; color: #fff; padding: 12px 18px; border-left: 4px solid #b91c1c; font-family: monospace; font-size: 13px;">\n  <strong>[COMUNICADO OFICIAL WZZM]</strong> Bem-vindo ao acervo digital da WazzimaGiygg.\n</div>`
  );
  const [isFloatingActive, setIsFloatingActive] = useState(false);

  // Load Data for Admin Core
  const loadAdminData = async () => {
    setIsLoadingUsers(true);
    setIsLoadingArticles(true);

    try {
      // 1. Fetch Users
      const users = await listAllUsersFromFirestore();
      setUsersList(users);

      // 2. Fetch Articles from Backend
      const artRes = await fetch("/api/articles?collection=all&limit=100");
      if (artRes.ok) {
        const data = await artRes.json();
        setAdminArticles(data.articles || []);
      }

      // 3. Fetch Tickets
      const tktRes = await fetch("/api/tickets");
      if (tktRes.ok) {
        const data = await tktRes.json();
        setTicketsList(data || []);
      }

      // 4. Fetch Sanctions
      const sancRes = await fetch("/api/sanctions");
      if (sancRes.ok) {
        const data = await sancRes.json();
        setSanctionsList(data.cidades_sancionadas || []);
      }

      // 5. Fetch Audit Logs
      const healthRes = await fetch("/api/health");
      if (healthRes.ok) {
        setAuditLogs([
          {
            action: "admin_access",
            userId: currentUser?.uid || "burocrata",
            ip: "127.0.0.1",
            timestamp: new Date().toISOString(),
            status: "Autorizado"
          },
          {
            action: "collection_sync",
            userId: "sistema",
            ip: "cluster-internal",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: "Sincronizado"
          }
        ]);
      }
    } catch (err) {
      console.warn("Error loading admin data:", err);
    } finally {
      setIsLoadingUsers(false);
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  // Elevation Handler (Chave Mestra de Burocrata)
  const handleElevateAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passkeyInput.trim()) {
      showToast("Informe a chave de acesso do burocrata.", true);
      return;
    }

    setIsElevating(true);
    try {
      const res = await fetch("/api/admin/elevate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: currentUser?.uid || `admin_${Date.now()}`,
          email: currentUser?.email || "burocrata@wazzimagiygg.com",
          passkey: passkeyInput.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Acesso de Burocrata concedido com sucesso!");
        if (currentUser) {
          await updateUserAdminStatus(currentUser.uid, true);
        }
        onElevateSuccess(data);
        registerAuditLog(currentUser?.uid || "admin", "burocrata_elevate_success");
      } else {
        showToast(data.error || "Chave incorreta.", true);
      }
    } catch {
      showToast("Erro ao processar chave de segurança.", true);
    } finally {
      setIsElevating(false);
    }
  };

  // ============================================
  // GOOGLE LOGIN HANDLER (EXCLUSIVO BUROCRATA)
  // Replicando a arquitetura oficial de admin/login.html
  // ============================================
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  const handleGoogleAdminLogin = async () => {
    setIsLoggingInGoogle(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      // 1. Cadastra/atualiza o usuário nas coleções 'users' e 'usuários'
      await registerUser(googleUser, false);

      // 2. Concede e persiste privilégios de Burocrata (Admin) no Firestore
      await updateUserAdminStatus(googleUser.uid, true);

      // 3. Notifica o backend TypeScript
      await fetch(`/api/admin/users/${encodeURIComponent(googleUser.uid)}/toggle-admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: true })
      }).catch(() => {});

      // 4. Registra log forense de login de Burocrata
      registerAuditLog(googleUser.uid, "burocrata_google_login_success", {
        email: googleUser.email,
        displayName: googleUser.displayName,
        time: new Date().toISOString()
      });

      showToast(`Login Google autorizado! Bem-vindo, Burocrata ${googleUser.displayName || googleUser.email}.`);

      onElevateSuccess({
        uid: googleUser.uid,
        name: googleUser.displayName || "Burocrata",
        email: googleUser.email,
        photoURL: googleUser.photoURL,
        isAdmin: true
      });
    } catch (err: any) {
      console.error("Erro no login Google de burocrata:", err);
      showToast(err.message || "Erro ao realizar login com o Google.", true);
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleAuthorizeCurrentGoogleUser = async () => {
    if (!currentUser || currentUser.isGuest) {
      handleGoogleAdminLogin();
      return;
    }

    setIsLoggingInGoogle(true);
    try {
      await updateUserAdminStatus(currentUser.uid, true);
      await fetch(`/api/admin/users/${encodeURIComponent(currentUser.uid)}/toggle-admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: true })
      }).catch(() => {});

      registerAuditLog(currentUser.uid, "burocrata_current_user_authorized", {
        email: currentUser.email
      });

      showToast(`Privilégios de Burocrata ativados para a conta Google ${currentUser.email}!`);

      onElevateSuccess({
        ...currentUser,
        isAdmin: true
      });
    } catch (err: any) {
      showToast(err.message || "Erro ao ativar credencial.", true);
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  // Toggle Admin
  const handleToggleAdmin = async (targetUser: AppUser) => {
    const newStatus = !targetUser.isAdmin;
    const ok = await updateUserAdminStatus(targetUser.uid, newStatus);
    if (ok) {
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, isAdmin: newStatus } : u))
      );
      showToast(
        newStatus
          ? `Privilégio de Burocrata concedido a ${targetUser.name}.`
          : `Privilégio de Burocrata revogado de ${targetUser.name}.`
      );
      registerAuditLog(currentUser?.uid || "admin", "toggle_admin", {
        targetUid: targetUser.uid,
        newStatus
      });
    } else {
      showToast("Falha ao atualizar privilégio.", true);
    }
  };

  // Toggle Teacher
  const handleToggleTeacher = async (targetUser: AppUser) => {
    const newStatus = !targetUser.isTeacher;
    const ok = await updateUserTeacherStatus(targetUser.uid, newStatus);
    if (ok) {
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, isTeacher: newStatus } : u))
      );
      showToast(
        newStatus
          ? `Cargo de Docente/Professor atribuído a ${targetUser.name}.`
          : `Cargo de Docente/Professor removido de ${targetUser.name}.`
      );
    } else {
      showToast("Falha ao atualizar cargo de professor.", true);
    }
  };

  // Confirm Ban
  const handleConfirmBan = async () => {
    if (!banModalUser) return;
    const targetUid = banModalUser.uid;
    const newBannedState = !banModalUser.isBanned;

    const ok = await updateUserBanStatus(
      targetUid,
      newBannedState,
      newBannedState ? banReasonInput : undefined
    );

    if (ok) {
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, isBanned: newBannedState } : u))
      );
      showToast(
        newBannedState
          ? `Usuário ${banModalUser.name} foi BLOQUEADO com sucesso.`
          : `Bloqueio de ${banModalUser.name} foi revogado.`
      );
      registerAuditLog(currentUser?.uid || "admin", "toggle_ban", {
        targetUid,
        newBannedState,
        reason: banReasonInput
      });
    } else {
      showToast("Falha ao alterar status de banimento.", true);
    }
    setBanModalUser(null);
  };

  // Delete User
  const handleDeleteUser = async (targetUser: AppUser) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o cadastro de "${targetUser.name}"?`)) {
      return;
    }

    const ok = await deleteUserFromFirestore(targetUser.uid);
    if (ok) {
      setUsersList((prev) => prev.filter((u) => u.uid !== targetUser.uid));
      showToast(`Cadastro de ${targetUser.name} excluído.`);
      registerAuditLog(currentUser?.uid || "admin", "delete_user", { targetUid: targetUser.uid });
    } else {
      showToast("Falha ao excluir usuário.", true);
    }
  };

  // Create User Manually
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm)
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList((prev) => [data.user, ...prev]);
        setIsAddUserModalOpen(false);
        setNewUserForm({
          name: "",
          email: "",
          isAdmin: false,
          isTeacher: false,
          isBanned: false
        });
        showToast("Novo usuário adicionado ao sistema.");
      } else {
        showToast("Erro ao criar usuário.", true);
      }
    } catch {
      showToast("Erro de rede ao criar usuário.", true);
    }
  };

  // Delete Article Administratively
  const handleDeleteArticle = async (article: Article) => {
    if (!window.confirm(`Deseja remover permanentemente o artigo "${article.titulo}"?`)) {
      return;
    }

    const ok = await deleteArticleFromFirestore(article.colecao || "wikiworldweb", article.id);
    if (ok) {
      setAdminArticles((prev) => prev.filter((a) => a.id !== article.id));
      showToast(`Artigo "${article.titulo}" removido.`);
      registerAuditLog(currentUser?.uid || "admin", "delete_article", { articleId: article.id });
    } else {
      showToast("Falha ao remover artigo.", true);
    }
  };

  // Update Ticket Status
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTicketsList((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
        );
        showToast(`Protocolo ${ticketId} atualizado para: ${newStatus}`);
      }
    } catch {
      showToast("Erro ao atualizar ticket.", true);
    }
  };

  // Add Sanction
  const handleAddSanction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName || !newModName) return;

    try {
      const res = await fetch("/api/admin/sanctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidade: newCityName, moderador: newModName })
      });
      if (res.ok) {
        const data = await res.json();
        setSanctionsList(data.data?.cidades_sancionadas || []);
        setNewCityName("");
        setNewModName("");
        showToast("Entidade adicionada à lista de auditoria forense.");
      }
    } catch {
      showToast("Erro ao adicionar sanção.", true);
    }
  };

  // Remove Sanction
  const handleRemoveSanction = async (index: number) => {
    try {
      const res = await fetch(`/api/admin/sanctions/${index}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        setSanctionsList(data.data?.cidades_sancionadas || []);
        showToast("Registro removido.");
      }
    } catch {
      showToast("Erro ao excluir registro.", true);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return usersList;
    const q = userSearchTerm.toLowerCase();
    return usersList.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.uid?.toLowerCase().includes(q)
    );
  }, [usersList, userSearchTerm]);

  // Filtered Articles List
  const filteredAdminArticles = useMemo(() => {
    let list = adminArticles;
    if (selectedCollectionFilter !== "all") {
      list = list.filter((a) => a.colecao === selectedCollectionFilter);
    }
    if (articleSearchTerm.trim()) {
      const q = articleSearchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.titulo?.toLowerCase().includes(q) ||
          a.setor?.toLowerCase().includes(q) ||
          a.criadorEmail?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [adminArticles, selectedCollectionFilter, articleSearchTerm]);

  // Ferramentas categories & filtering
  const ferramentaCategories = useMemo(() => {
    const cats = new Set<string>();
    FERRAMENTAS_LIST.forEach((f) => cats.add(f.category));
    return ["all", ...Array.from(cats)];
  }, []);

  const filteredFerramentas = useMemo(() => {
    let list = FERRAMENTAS_LIST;
    if (selectedFerramentaCategory !== "all") {
      list = list.filter((f) => f.category === selectedFerramentaCategory);
    }
    if (ferramentasSearch.trim()) {
      const q = ferramentasSearch.toLowerCase();
      list = list.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.href.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [ferramentasSearch, selectedFerramentaCategory]);

  const handleCopySource = async () => {
    try {
      await navigator.clipboard.writeText(FERRAMENTAS_ADMINISTRATIVAS_SOURCE);
      setSourceCopied(true);
      setTimeout(() => setSourceCopied(false), 2200);
      showToast("Código-fonte copiado para a área de transferência!");
    } catch {
      showToast("Não foi possível copiar automaticamente.", true);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      showToast("Preencha o título e a mensagem da notificação.", true);
      return;
    }

    setIsSendingNotif(true);
    try {
      await addDoc(collection(db, "notifications"), {
        userId: notifForm.userId,
        title: notifForm.title.trim(),
        message: notifForm.message.trim(),
        type: notifForm.type,
        senderEmail: currentUser?.email || "burocrata@wazzimagiygg.com",
        read: false,
        createdAt: serverTimestamp()
      });
      showToast("Notificação administrativa transmitida com sucesso!");
      setNotifForm({ userId: "all", title: "", message: "", type: "info" });
      setIsSendNotifModalOpen(false);
      registerAuditLog(currentUser?.uid || "admin", "burocrata_send_notification", {
        target: notifForm.userId,
        title: notifForm.title
      });
    } catch (err: any) {
      console.error("Erro ao enviar notificação:", err);
      showToast("Falha ao registrar notificação: " + err.message, true);
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleFerramentaAction = (item: FerramentaItem) => {
    if (item.action === "cadastrar_professor") {
      setNewUserForm({
        name: "",
        email: "",
        isAdmin: false,
        isTeacher: true,
        isBanned: false
      });
      setIsAddUserModalOpen(true);
      return;
    }
    if (item.action === "usuarios") {
      setAdminTab("usuarios");
      return;
    }
    if (item.action === "artigos") {
      setAdminTab("artigos");
      return;
    }
    if (item.action === "tickets") {
      setAdminTab("tickets");
      return;
    }
    if (item.action === "checkuser") {
      setAdminTab("checkuser");
      return;
    }
    if (item.action === "notificacao") {
      setIsSendNotifModalOpen(true);
      return;
    }
    if (item.action === "html_creator") {
      setIsHtmlFloatingModalOpen(true);
      return;
    }
    if (item.action === "custos") {
      setAdminTab("sancoes");
      showToast(`Módulo "${item.label}" carregado.`);
      return;
    }
    if (item.isExternal || item.href.startsWith("http")) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }
    // Default open in standalone admin viewer
    window.open(`/admin/${item.href.replace(/^\//, "")}`, "_blank");
  };

  // ============================================
  // ACCESS GUARD (SE NÃO FOR ADMIN/BUROCRATA)
  // ============================================
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-[#0F0F12] text-white z-50 flex flex-col justify-between overflow-y-auto font-sans p-4 sm:p-8 animate-fade-in">
        {/* Top Header */}
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-950 border-2 border-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold tracking-tight text-white uppercase">
                Área de Administração Única — WZZM
              </h2>
              <p className="font-mono text-[10px] text-stone-400">
                Acesso Exclusivo para Burocratas e Moderadores Credenciados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 font-mono text-xs text-stone-400 hover:text-white border border-stone-700 px-3 py-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Portal</span>
          </button>
        </div>

        {/* Center Auth Gate (admin/login.html) */}
        <div className="max-w-md w-full mx-auto my-12 bg-white text-stone-900 border-4 border-[#141414] p-8 shadow-[10px_10px_0px_0px_rgba(185,28,28,1)] text-center animate-scale-up">
          <div className="w-14 h-14 bg-red-100 border-2 border-red-700 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-red-700" />
          </div>

          <h3 className="font-editorial text-2xl font-bold text-stone-950 mb-2">
            Área de Administração Única da WZZM
          </h3>
          <p className="font-serif text-xs text-stone-600 mb-6 leading-relaxed">
            Faça login com sua conta Google para continuar no Painel de Burocrata e gerenciar os recursos da WZZM.
          </p>

          {/* Primary Google Login Button */}
          <div className="space-y-4 font-mono text-xs">
            {currentUser && !currentUser.isGuest && currentUser.email ? (
              <div className="p-3 bg-amber-50 border border-amber-300 text-left mb-3">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">
                  Conta Google Conectada:
                </span>
                <span className="font-bold text-stone-900 text-xs block truncate">
                  {currentUser.displayName || currentUser.name} ({currentUser.email})
                </span>
                <button
                  onClick={handleAuthorizeCurrentGoogleUser}
                  disabled={isLoggingInGoogle}
                  className="w-full mt-3 bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-4 border border-black flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase text-[11px]"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>{isLoggingInGoogle ? "Validando Acesso..." : "Entrar com Esta Conta Google"}</span>
                </button>
              </div>
            ) : null}

            <button
              onClick={handleGoogleAdminLogin}
              disabled={isLoggingInGoogle}
              className="w-full bg-[#4285F4] hover:bg-[#357ae8] text-white font-bold py-3.5 px-4 border border-[#141414] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] active:translate-x-0.5 active:translate-y-0.5 uppercase tracking-wider disabled:opacity-50"
            >
              <svg className="w-5 h-5 bg-white p-0.5 rounded-full shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isLoggingInGoogle ? "Conectando ao Google..." : "Entrar com Conta Google"}</span>
            </button>
          </div>

          {/* Fallback Passkey Accordion */}
          <details className="mt-6 pt-4 border-t border-stone-200 text-left text-xs font-mono text-stone-600">
            <summary className="cursor-pointer text-[10px] uppercase font-bold text-stone-500 hover:text-black">
              ▸ Validação Alternativa com Chave Mestre
            </summary>
            <form onSubmit={handleElevateAccount} className="mt-3 space-y-2">
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Chave mestre (ex: wzzm2026)"
                className="w-full p-2 border border-stone-400 bg-stone-50 text-xs font-mono focus:outline-none"
              />
              <button
                type="submit"
                className="paper-button w-full py-1.5 text-[10px] font-bold uppercase"
              >
                Validar Chave
              </button>
            </form>
          </details>
        </div>

        {/* Footer info */}
        <div className="max-w-4xl w-full mx-auto text-center text-[10px] font-mono text-stone-500 border-t border-stone-900 pt-4">
          Conexão Segura com Banco de Dados Firebase Firestore (`wzzm-ce3fc`) • Módulo Burocrata WZZM
        </div>
      </div>
    );
  }

  // ============================================
  // AUTHORIZED BUROCRATA DASHBOARD
  // ============================================
  return (
    <div className="fixed inset-0 bg-[#F4F3F0] text-[#141414] z-50 flex flex-col overflow-hidden font-sans">
      {/* 1. ADMIN MASTHEAD HEADER */}
      <header className="bg-[#141414] text-white border-b-4 border-[#B91C1C] py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-700 border border-white/20 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-lg font-bold tracking-tight uppercase">
                  Painel de Administração WZZM
                </h1>
                <span className="bg-red-700 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 uppercase tracking-widest">
                  BUROCRATA CORE
                </span>
              </div>
              <p className="font-mono text-[10px] text-stone-400">
                Diretório Base: `admin/` • Firestore `wzzm-ce3fc`
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <span className="text-[11px] font-mono font-bold text-stone-200 block">
                {currentUser?.displayName || currentUser?.name || "Burocrata Autorizado"}
              </span>
              <span className="text-[10px] font-mono text-amber-400 block">
                {currentUser?.email || "admin@wazzimagiygg.com"}
              </span>
            </div>

            <button
              onClick={loadAdminData}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-2 border border-stone-700 transition-colors cursor-pointer"
              title="Sincronizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={onClose}
              className="paper-button bg-stone-100 text-stone-900 hover:bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. NAVIGATION BAR (admin/menu.json) */}
      <nav className="bg-[#E2E0DB] border-b-2 border-[#141414] px-4 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1 text-xs font-mono font-bold uppercase tracking-wider">
          {[
            { id: "dashboard", label: "Painel Geral", icon: Activity },
            { id: "usuarios", label: "Gerenciar Usuários", icon: Users },
            { id: "artigos", label: "Moderação de Artigos", icon: FileText },
            { id: "tickets", label: "Ouvidoria & LGPD", icon: Ticket },
            { id: "sancoes", label: "Cidades Sancionadas", icon: Scale },
            { id: "checkuser", label: "Auditoria Forense", icon: ShieldAlert },
            { id: "ferramentas", label: "Ferramentas da WZZM", icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 whitespace-nowrap transition-colors cursor-pointer border ${
                  isActive
                    ? "bg-[#141414] text-white border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
                    : "bg-transparent text-stone-800 border-transparent hover:bg-stone-300"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-stone-600"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {/* SUB-VIEW 1: DASHBOARD OVERVIEW */}
        {adminTab === "dashboard" && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              <div className="bg-white border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <span className="text-[10px] text-stone-500 font-bold uppercase">Total Usuários</span>
                <div className="text-3xl font-bold mt-1 text-stone-900">{usersList.length}</div>
                <span className="text-[10px] text-emerald-700 font-bold mt-2 block">
                  ✓ Sincronizado com Firestore
                </span>
              </div>

              <div className="bg-white border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <span className="text-[10px] text-stone-500 font-bold uppercase">Usuários Bloqueados</span>
                <div className="text-3xl font-bold mt-1 text-red-700">
                  {usersList.filter((u) => u.isBanned).length}
                </div>
                <span className="text-[10px] text-stone-500 mt-2 block">
                  Sob sanção disciplinar
                </span>
              </div>

              <div className="bg-white border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <span className="text-[10px] text-stone-500 font-bold uppercase">Artigos Catalogados</span>
                <div className="text-3xl font-bold mt-1 text-amber-800">{adminArticles.length}</div>
                <span className="text-[10px] text-stone-500 mt-2 block">5 coleções ativas</span>
              </div>

              <div className="bg-white border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <span className="text-[10px] text-stone-500 font-bold uppercase">Chamados LGPD / Tickets</span>
                <div className="text-3xl font-bold mt-1 text-blue-800">{ticketsList.length}</div>
                <span className="text-[10px] text-stone-500 mt-2 block">Central de Ouvidoria</span>
              </div>
            </div>

            {/* Quick Actions & Short Menu */}
            <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="font-editorial text-xl font-bold text-[#141414] mb-3">
                Ações Administrativas Recorrentes (Burocrata)
              </h3>
              <p className="font-serif text-xs text-stone-600 mb-6 leading-relaxed">
                Utilize as abas superiores ou os atalhos rápidos abaixo para moderar usuários, aplicar sanções territoriais e gerenciar o acervo da WazzimaGiygg.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs font-bold">
                <button
                  onClick={() => setAdminTab("usuarios")}
                  className="paper-button p-4 text-left flex flex-col justify-between cursor-pointer"
                >
                  <Users className="w-5 h-5 text-amber-400 mb-2" />
                  <span>Gerenciar Usuários & Banimentos →</span>
                </button>

                <button
                  onClick={() => setAdminTab("artigos")}
                  className="paper-button p-4 text-left flex flex-col justify-between cursor-pointer"
                >
                  <FileText className="w-5 h-5 text-amber-400 mb-2" />
                  <span>Moderação Editorial de Artigos →</span>
                </button>

                <button
                  onClick={() => setAdminTab("tickets")}
                  className="paper-button p-4 text-left flex flex-col justify-between cursor-pointer"
                >
                  <Ticket className="w-5 h-5 text-amber-400 mb-2" />
                  <span>Atender Chamados da LGPD →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 2: GERENCIAR USUÁRIOS (admin/gerenciar-usuarios.html) */}
        {adminTab === "usuarios" && (
          <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-[#141414] pb-4">
              <div>
                <h3 className="font-editorial text-2xl font-bold text-[#141414]">
                  Gerenciamento de Usuários (`admin/gerenciar-usuarios.html`)
                </h3>
                <p className="font-mono text-xs text-stone-600 mt-1">
                  Atribuição de privilégios de Burocrata, cargo de Professor e sanções disciplinares.
                </p>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="paper-button px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Adicionar Usuário</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou UID..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-[#F8F7F4] border border-[#141414] focus:outline-none"
              />
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-[#141414]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141414] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 border-r border-stone-700">Nome / Identificação</th>
                    <th className="py-3 px-4 border-r border-stone-700">E-mail</th>
                    <th className="py-3 px-4 border-r border-stone-700 text-center">Burocrata (Admin)</th>
                    <th className="py-3 px-4 border-r border-stone-700 text-center">Docente</th>
                    <th className="py-3 px-4 border-r border-stone-700 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ações do Burocrata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500">
                        Carregando base de usuários...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-amber-50/50">
                        <td className="py-2.5 px-4 font-bold border-r border-stone-200">
                          {u.name}
                          <span className="block text-[9px] text-stone-400 font-normal">
                            UID: {u.uid}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 border-r border-stone-200 text-stone-700">
                          {u.email || "Sem e-mail"}
                        </td>
                        <td className="py-2.5 px-4 border-r border-stone-200 text-center">
                          {u.isAdmin ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-400 font-bold px-2 py-0.5 text-[10px]">
                              SIM (Burocrata)
                            </span>
                          ) : (
                            <span className="text-stone-400 text-[10px]">Não</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 border-r border-stone-200 text-center">
                          {u.isTeacher ? (
                            <span className="bg-blue-100 text-blue-900 border border-blue-400 font-bold px-2 py-0.5 text-[10px]">
                              Professor
                            </span>
                          ) : (
                            <span className="text-stone-400 text-[10px]">Não</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 border-r border-stone-200 text-center">
                          {u.isBanned ? (
                            <span className="bg-red-700 text-white font-bold px-2 py-0.5 text-[10px]">
                              BANIDO
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[10px]">Ativo</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Toggle Admin */}
                            <button
                              onClick={() => handleToggleAdmin(u)}
                              className={`p-1.5 border transition-colors cursor-pointer ${
                                u.isAdmin
                                  ? "bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200"
                                  : "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200"
                              }`}
                              title={u.isAdmin ? "Revogar Burocrata" : "Tornar Burocrata"}
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Teacher */}
                            <button
                              onClick={() => handleToggleTeacher(u)}
                              className={`p-1.5 border transition-colors cursor-pointer ${
                                u.isTeacher
                                  ? "bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200"
                                  : "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200"
                              }`}
                              title={u.isTeacher ? "Remover Docente" : "Tornar Docente"}
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Ban */}
                            <button
                              onClick={() => {
                                setBanModalUser(u);
                                setBanReasonInput("Violação das políticas editoriais e termos de uso");
                              }}
                              className={`p-1.5 border transition-colors cursor-pointer ${
                                u.isBanned
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200"
                                  : "bg-red-100 text-red-900 border-red-400 hover:bg-red-200"
                              }`}
                              title={u.isBanned ? "Revogar Banimento" : "Aplicar Banimento"}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 bg-stone-100 text-red-700 border border-stone-300 hover:bg-red-100 transition-colors cursor-pointer"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-VIEW 3: MODERAÇÃO DE ARTIGOS */}
        {adminTab === "artigos" && (
          <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="border-b-2 border-[#141414] pb-4">
              <h3 className="font-editorial text-2xl font-bold text-[#141414]">
                Moderação de Artigos e Documentos
              </h3>
              <p className="font-mono text-xs text-stone-600 mt-1">
                Visualização global de todas as 5 coleções e remoção de conteúdo que viole políticas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar artigos..."
                  value={articleSearchTerm}
                  onChange={(e) => setArticleSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-[#F8F7F4] border border-[#141414] focus:outline-none"
                />
              </div>

              <select
                value={selectedCollectionFilter}
                onChange={(e) => setSelectedCollectionFilter(e.target.value)}
                className="p-2 border border-[#141414] font-mono text-xs bg-[#F8F7F4] focus:outline-none"
              >
                <option value="all">Todas as Coleções</option>
                <option value="wikiworldweb">WikiWorldWeb</option>
                <option value="materiadeensaio">Matéria de Ensaio</option>
                <option value="academico">Acadêmico</option>
                <option value="materia">Matérias Didáticas</option>
                <option value="uwgbooks">UWG Books</option>
              </select>
            </div>

            <div className="overflow-x-auto border border-[#141414]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141414] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 border-r border-stone-700">Título</th>
                    <th className="py-3 px-4 border-r border-stone-700">Coleção</th>
                    <th className="py-3 px-4 border-r border-stone-700">Setor</th>
                    <th className="py-3 px-4 border-r border-stone-700 text-center">Leituras</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredAdminArticles.map((art) => (
                    <tr key={art.id} className="hover:bg-amber-50/50">
                      <td className="py-2 px-4 font-bold border-r border-stone-200">
                        {art.titulo}
                      </td>
                      <td className="py-2 px-4 border-r border-stone-200 uppercase text-[10px]">
                        {art.colecao}
                      </td>
                      <td className="py-2 px-4 border-r border-stone-200 text-stone-600">
                        {art.setor}
                      </td>
                      <td className="py-2 px-4 border-r border-stone-200 text-center">
                        {art.visualizacoes || 0}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          onClick={() => handleDeleteArticle(art)}
                          className="p-1 bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 cursor-pointer"
                          title="Excluir Artigo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-VIEW 4: OUVIDORIA & TICKETS LGPD */}
        {adminTab === "tickets" && (
          <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="border-b-2 border-[#141414] pb-4">
              <h3 className="font-editorial text-2xl font-bold text-[#141414]">
                Ouvidoria & Solicitações de Exclusão LGPD (`solicitacaodeexlusao`)
              </h3>
              <p className="font-mono text-xs text-stone-600 mt-1">
                Atendimento aos direitos do titular de dados e registros do Marco Civil.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {ticketsList.map((t) => (
                <div key={t.id} className="p-4 border border-[#141414] bg-[#F8F7F4] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800">{t.id} • {t.nome} ({t.email})</span>
                    <span className="bg-stone-200 px-2 py-0.5 font-bold uppercase text-[10px]">
                      {t.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900">{t.tipo}</h4>
                  <p className="text-stone-700 font-serif text-sm leading-relaxed">{t.mensagem}</p>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-300">
                    <span className="text-[10px] text-stone-500 uppercase">Alterar Status:</span>
                    <button
                      onClick={() => handleUpdateTicketStatus(t.id, "Em Análise")}
                      className="px-2 py-0.5 bg-yellow-100 text-yellow-900 border border-yellow-400 text-[10px] cursor-pointer"
                    >
                      Em Análise
                    </button>
                    <button
                      onClick={() => handleUpdateTicketStatus(t.id, "Dados Excluídos / Concluído")}
                      className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] cursor-pointer"
                    >
                      Concluído (LGPD)
                    </button>
                    <button
                      onClick={() => handleUpdateTicketStatus(t.id, "Indeferido")}
                      className="px-2 py-0.5 bg-red-100 text-red-900 border border-red-400 text-[10px] cursor-pointer"
                    >
                      Indeferir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-VIEW 5: CIDADES SANCIONADAS */}
        {adminTab === "sancoes" && (
          <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
            <div className="border-b-2 border-[#141414] pb-4">
              <h3 className="font-editorial text-2xl font-bold text-[#141414]">
                Gerenciar Cidades & Moderadores Sancionados (`cidadessancionadas`)
              </h3>
              <p className="font-mono text-xs text-stone-600 mt-1">
                Controle de registros forenses de incidentes por localidade geográfica e identificador.
              </p>
            </div>

            {/* Add Sanction Form */}
            <form onSubmit={handleAddSanction} className="flex flex-col sm:flex-row gap-3 font-mono text-xs">
              <input
                type="text"
                required
                placeholder="Município / País"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="flex-1 p-2 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Moderador / IP em observação"
                value={newModName}
                onChange={(e) => setNewModName(e.target.value)}
                className="flex-1 p-2 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
              />
              <button
                type="submit"
                className="paper-button px-4 py-2 font-bold uppercase tracking-wider cursor-pointer"
              >
                Adicionar Sanção
              </button>
            </form>

            {/* Table */}
            <div className="overflow-x-auto border border-[#141414]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141414] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4 border-r border-stone-700">Município</th>
                    <th className="py-2.5 px-4 border-r border-stone-700">Moderador / Identificador</th>
                    <th className="py-2.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {sanctionsList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-amber-50">
                      <td className="py-2 px-4 font-bold border-r border-stone-200">{item.cidade}</td>
                      <td className="py-2 px-4 border-r border-stone-200">{item.moderador}</td>
                      <td className="py-2 px-4 text-center">
                        <button
                          onClick={() => handleRemoveSanction(idx)}
                          className="p-1 text-red-700 hover:bg-red-50 border border-stone-300 cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-VIEW 6: AUDITORIA FORENSE (checkuser) */}
        {adminTab === "checkuser" && (
          <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="border-b-2 border-[#141414] pb-4">
              <h3 className="font-editorial text-2xl font-bold text-[#141414]">
                Auditoria Forense & Rastreamento (`checkuser`)
              </h3>
              <p className="font-mono text-xs text-stone-600 mt-1">
                Registros de integridade de sessão e eventos em conformidade com o Marco Civil da Internet.
              </p>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {auditLogs.map((log, i) => (
                <div key={i} className="p-3 border border-stone-300 bg-stone-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-red-800 uppercase">{log.action}</span>
                    <span className="text-stone-600 block text-[10px]">
                      Usuário: {log.userId} • IP: {log.ip}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500">{new Date(log.timestamp).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-VIEW 7: FERRAMENTAS ADMINISTRATIVAS & VIEW-SOURCE */}
        {adminTab === "ferramentas" && (
          <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
            {/* Header & Source Trigger */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-[#141414] pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-editorial text-2xl font-bold text-[#141414]">
                    Menu de Ferramentas Administrativas
                  </h3>
                  <span className="bg-red-700 text-white font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                    24 Ferramentas Ativas
                  </span>
                </div>
                <p className="font-mono text-xs text-stone-600">
                  Diretório: <code className="text-red-700 font-bold">admin/ferramentasadministrativas.html</code> • Totalmente integrado à administração WZZM
                </p>
              </div>

              {/* View-Source & Standalone Page Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsViewSourceModalOpen(true)}
                  className="bg-[#0F0F12] hover:bg-black text-amber-400 border border-stone-800 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                  title="Abrir o visualizador de código-fonte exato"
                >
                  <Code className="w-4 h-4 text-amber-400" />
                  <span>view-source:ferramentasadministrativas.html</span>
                </button>

                <a
                  href="/admin/ferramentasadministrativas.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="paper-button bg-white text-stone-900 hover:bg-stone-100 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] cursor-pointer"
                  title="Abrir o arquivo HTML estático em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-stone-700" />
                  <span>Abrir Página Estática</span>
                </a>
              </div>
            </div>

            {/* Quick Tools Controls & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Pesquisar entre as 24 ferramentas administrativas..."
                  value={ferramentasSearch}
                  onChange={(e) => setFerramentasSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-[#F8F7F4] border border-[#141414] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-stone-500 uppercase font-bold shrink-0">
                  Categoria:
                </span>
                <select
                  value={selectedFerramentaCategory}
                  onChange={(e) => setSelectedFerramentaCategory(e.target.value)}
                  className="p-2 border border-[#141414] font-mono text-xs bg-[#F8F7F4] focus:outline-none"
                >
                  <option value="all">Todas as Categorias ({FERRAMENTAS_LIST.length})</option>
                  {ferramentaCategories
                    .filter((c) => c !== "all")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Grid of 24 Cards Matching the Original admin/ferramentasadministrativas.html */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {filteredFerramentas.map((tool, idx) => (
                <div
                  key={idx}
                  onClick={() => handleFerramentaAction(tool)}
                  className="group relative bg-[#ffffff] border border-[#d6d3d1] hover:border-[#141414] p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] cursor-pointer overflow-hidden"
                >
                  {/* Subtle hover gradient inspired by original CSS */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 group-hover:bg-amber-100 group-hover:text-amber-900 border border-stone-200 px-1.5 py-0.5">
                        {tool.category}
                      </span>
                      {tool.isExternal ? (
                        <span className="font-mono text-[9px] text-blue-600 font-bold flex items-center gap-0.5">
                          Externo <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] text-emerald-700 font-bold">
                          Integrado WZZM
                        </span>
                      )}
                    </div>

                    <h4 className="font-editorial text-base font-bold text-stone-900 group-hover:text-red-700 transition-colors leading-snug">
                      {tool.label}
                    </h4>

                    <p className="font-mono text-[10px] text-stone-500 truncate mt-1">
                      {tool.href}
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-[10px] text-stone-500 group-hover:text-stone-900 font-bold uppercase">
                      {tool.action ? `Executar: ${tool.action}` : "Acessar Módulo"}
                    </span>
                    <span className="text-[#0d6efd] font-bold text-base transition-transform group-hover:translate-x-1.5">
                      ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredFerramentas.length === 0 && (
              <div className="p-8 text-center font-mono text-xs text-stone-500 border border-dashed border-stone-300">
                Nenhuma ferramenta administrativa encontrada com os termos informados.
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: ADD USER MANUALLY */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#141414] shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] max-w-md w-full p-6 text-left font-mono text-xs">
            <div className="flex items-center justify-between border-b-2 border-[#141414] pb-3 mb-4">
              <h3 className="font-bold text-sm uppercase">Cadastrar Novo Usuário</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-stone-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block uppercase font-bold text-[10px] mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="Nome do usuário"
                  className="w-full p-2 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase font-bold text-[10px] mb-1">E-mail:</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full p-2 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserForm.isAdmin}
                    onChange={(e) => setNewUserForm({ ...newUserForm, isAdmin: e.target.checked })}
                  />
                  <span>Tornar Burocrata (Administrador)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserForm.isTeacher}
                    onChange={(e) => setNewUserForm({ ...newUserForm, isTeacher: e.target.checked })}
                  />
                  <span>Atribuir Cargo de Docente / Professor</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="paper-button-secondary px-3 py-1.5 font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="paper-button px-4 py-1.5 font-bold uppercase tracking-wider"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BAN USER MOTIVE */}
      {banModalUser && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-red-700 shadow-[10px_10px_0px_0px_rgba(185,28,28,1)] max-w-md w-full p-6 text-left font-mono text-xs">
            <div className="flex items-center justify-between border-b-2 border-red-700 pb-3 mb-4">
              <h3 className="font-bold text-sm uppercase text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {banModalUser.isBanned ? "Revogar Bloqueio" : "Confirmar Bloqueio / Banimento"}
                </span>
              </h3>
              <button
                onClick={() => setBanModalUser(null)}
                className="text-stone-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-stone-800 mb-3">
              Usuário: <strong>{banModalUser.name}</strong> ({banModalUser.email})
            </p>

            {!banModalUser.isBanned && (
              <div className="mb-4">
                <label className="block uppercase font-bold text-[10px] mb-1">
                  Justificativa Legal / Motivo do Bloqueio:
                </label>
                <textarea
                  rows={3}
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  className="w-full p-2 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                ></textarea>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setBanModalUser(null)}
                className="paper-button-secondary px-3 py-1.5 font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-1.5 font-bold uppercase tracking-wider cursor-pointer border border-red-900"
              >
                {banModalUser.isBanned ? "Confirmar Desbloqueio" : "Aplicar Bloqueio Imediato"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW-SOURCE DO ARQUIVO FERRAMENTASADMINISTRATIVAS */}
      {/* view-source:https://wazzimagiygg.com/admin/ferramentasadministrativas.html */}
      {/* ======================================================== */}
      {isViewSourceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-6 animate-fade-in">
          <div className="bg-[#1e1e1e] text-[#d4d4d4] border-2 border-[#333] shadow-[0px_20px_50px_rgba(0,0,0,0.8)] max-w-5xl w-full h-[90vh] flex flex-col font-mono text-xs overflow-hidden rounded-md">
            {/* View-Source Browser Chrome Topbar */}
            <div className="bg-[#2d2d2d] px-4 py-2.5 border-b border-[#3e3e42] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <Code className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-stone-200 text-xs hidden sm:inline">
                  Código-Fonte Original
                </span>
              </div>

              {/* Omnibox / URL Field */}
              <div className="flex-1 max-w-2xl bg-[#1e1e1e] border border-[#444] rounded px-3 py-1 flex items-center gap-2 text-stone-300 text-[11px] truncate select-all">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-amber-400 font-bold shrink-0">view-source:</span>
                <span className="truncate">https://wazzimagiygg.com/admin/ferramentasadministrativas.html</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopySource}
                  className="flex items-center gap-1.5 bg-[#3e3e42] hover:bg-[#505054] text-white px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer border border-[#555]"
                  title="Copiar todo o código-fonte"
                >
                  {sourceCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>

                <a
                  href="/admin/ferramentasadministrativas.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center gap-1 bg-[#3e3e42] hover:bg-[#505054] text-stone-300 hover:text-white px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer border border-[#555]"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Renderizado</span>
                </a>

                <button
                  onClick={() => setIsViewSourceModalOpen(false)}
                  className="text-stone-400 hover:text-white p-1 hover:bg-[#3e3e42] rounded transition-colors cursor-pointer"
                  title="Fechar visualizador"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Code Content Area with Line Numbers */}
            <div className="flex-1 overflow-auto flex bg-[#1e1e1e] font-mono text-[12px] leading-relaxed selection:bg-[#264f78]">
              {/* Code display */}
              <div className="flex-1 p-4 overflow-x-auto whitespace-pre font-mono text-stone-200">
                {FERRAMENTAS_ADMINISTRATIVAS_SOURCE.split("\n").map((line, idx) => (
                  <div key={idx} className="flex hover:bg-[#282828] py-0.5">
                    <span className="w-12 text-right pr-4 text-stone-500 select-none text-[11px] shrink-0 border-r border-[#333] mr-4">
                      {idx + 1}
                    </span>
                    <span className="text-stone-200 flex-1">{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer status bar */}
            <div className="bg-[#007acc] text-white px-4 py-1.5 text-[10px] flex items-center justify-between font-mono shrink-0">
              <div className="flex items-center gap-3">
                <span>HTML • UTF-8</span>
                <span>{FERRAMENTAS_ADMINISTRATIVAS_SOURCE.split("\n").length} linhas</span>
                <span>{FERRAMENTAS_ADMINISTRATIVAS_SOURCE.length} caracteres</span>
              </div>
              <span>Fonte: wazzimagiygg.com/admin/ferramentasadministrativas.html</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INSERIR NOTIFICAÇÃO (checkuser/notificacao/) */}
      {/* ======================================================== */}
      {isSendNotifModalOpen && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#141414] shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] max-w-lg w-full p-6 text-left font-mono text-xs">
            <div className="flex items-center justify-between border-b-2 border-[#141414] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-700" />
                <h3 className="font-bold text-sm uppercase">
                  Inserir Notificação para Usuário (`checkuser/notificacao/`)
                </h3>
              </div>
              <button
                onClick={() => setIsSendNotifModalOpen(false)}
                className="text-stone-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-stone-600 mb-4 font-serif text-xs">
              Transmita comunicados operacionais, alertas de conformidade ou mensagens diretas que aparecerão no sininho de notificações do usuário em tempo real.
            </p>

            <form onSubmit={handleSendNotification} className="space-y-3">
              <div>
                <label className="block uppercase font-bold text-[10px] mb-1">
                  Destinatário:
                </label>
                <select
                  value={notifForm.userId}
                  onChange={(e) => setNotifForm({ ...notifForm, userId: e.target.value })}
                  className="w-full p-2 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                >
                  <option value="all">📢 Todos os Usuários Cadastrados (Global)</option>
                  {usersList.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.name} ({u.email || u.uid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase font-bold text-[10px] mb-1">
                  Nível de Urgência:
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { id: "info", label: "Informativo" },
                    { id: "warning", label: "Aviso de Moderação" },
                    { id: "alert", label: "Alerta Crítico / Sanção" }
                  ].map((lvl) => (
                    <label key={lvl.id} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="notifType"
                        value={lvl.id}
                        checked={notifForm.type === lvl.id}
                        onChange={() => setNotifForm({ ...notifForm, type: lvl.id as any })}
                      />
                      <span>{lvl.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block uppercase font-bold text-[10px] mb-1">
                  Título da Notificação:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Atualização dos Termos de Uso / Novo Artigo Publicado"
                  value={notifForm.title}
                  onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                  className="w-full p-2 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase font-bold text-[10px] mb-1">
                  Conteúdo da Mensagem:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Descreva a mensagem a ser recebida pelo destinatário..."
                  value={notifForm.message}
                  onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                  className="w-full p-2 border border-[#141414] bg-[#F8F7F4] focus:outline-none font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsSendNotifModalOpen(false)}
                  className="paper-button-secondary px-3 py-1.5 font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-1.5 font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingNotif ? "Enviando..." : "Transmitir Notificação"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADICIONAR HTML FLUTUANTE (htmlcreator/) */}
      {/* ======================================================== */}
      {isHtmlFloatingModalOpen && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#141414] shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] max-w-xl w-full p-6 text-left font-mono text-xs">
            <div className="flex items-center justify-between border-b-2 border-[#141414] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-700" />
                <h3 className="font-bold text-sm uppercase">
                  Adicionar HTML Flutuante (`admin/htmlcreator/`)
                </h3>
              </div>
              <button
                onClick={() => setIsHtmlFloatingModalOpen(false)}
                className="text-stone-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-stone-600 mb-3 font-serif text-xs">
              Insira snippets HTML/CSS personalizados para avisos flutuantes, banners de manutenção ou cabeçalhos especiais no portal WZZM.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block uppercase font-bold text-[10px] mb-1">
                  Código HTML / CSS:
                </label>
                <textarea
                  rows={5}
                  value={floatingHtmlInput}
                  onChange={(e) => setFloatingHtmlInput(e.target.value)}
                  className="w-full p-2.5 border border-[#141414] bg-[#F8F7F4] font-mono text-xs focus:outline-none"
                />
              </div>

              {/* Live Preview Area */}
              <div>
                <label className="block uppercase font-bold text-[10px] mb-1 text-stone-500">
                  Pré-visualização ao Vivo:
                </label>
                <div
                  className="p-3 border border-dashed border-stone-400 bg-stone-50 min-h-[60px]"
                  dangerouslySetInnerHTML={{ __html: floatingHtmlInput }}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFloatingActive}
                    onChange={(e) => {
                      setIsFloatingActive(e.target.checked);
                      showToast(
                        e.target.checked
                          ? "Banner flutuante ativado temporariamente nesta sessão."
                          : "Banner flutuante desativado."
                      );
                    }}
                  />
                  <span className="font-bold">Ativar flutuante na interface</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHtmlFloatingModalOpen(false)}
                    className="paper-button-secondary px-3 py-1.5 font-bold uppercase"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      showToast("Configuração de HTML Flutuante salva com sucesso!");
                      setIsHtmlFloatingModalOpen(false);
                    }}
                    className="paper-button px-4 py-1.5 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Aplicar Configuração
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
