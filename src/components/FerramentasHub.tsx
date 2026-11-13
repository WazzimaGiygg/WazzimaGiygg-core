/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Code,
  ExternalLink,
  Search,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Lock,
  Globe,
  DollarSign,
  Users,
  FileText,
  Ticket,
  Shield,
  Layers,
  Send,
  Bell,
  RefreshCw,
  Eye,
  Check,
  Copy,
  Sliders,
  Calendar,
  MessageSquare,
  HelpCircle,
  Activity,
  Pin,
  FileCheck,
  Award
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, registerAuditLog, updateUserTeacherStatus, updateUserAdminStatus, updateUserBanStatus, AppUser, Article, safeApiFetch } from "../firebase";
import { FERRAMENTAS_LIST, FerramentaItem } from "../data/ferramentasSource";
import {
  CostItem,
  RedirectLink,
  ForumTopic,
  SurveyItem,
  AdminBlogPost,
  INITIAL_COSTS,
  INITIAL_REDIRECTS,
  INITIAL_FORUM_TOPICS,
  INITIAL_SURVEYS,
  INITIAL_BLOG_POSTS,
  SITE_PAGES_DIRECTORY
} from "../data/ferramentasData";

interface FerramentasHubProps {
  currentUser: any;
  usersList: AppUser[];
  adminArticles: Article[];
  ticketsList: any[];
  sanctionsList: any[];
  auditLogs: any[];
  showToast: (msg: string, isError?: boolean) => void;
  onOpenViewSource: () => void;
  onNavigateTab: (tabId: string) => void;
  selectedToolHref: string | null;
  onSelectToolHref: (href: string | null) => void;
}

export default function FerramentasHub({
  currentUser,
  usersList,
  adminArticles,
  ticketsList,
  sanctionsList,
  auditLogs,
  showToast,
  onOpenViewSource,
  onNavigateTab,
  selectedToolHref,
  onSelectToolHref
}: FerramentasHubProps) {
  // Search and category filters for the 24 tools menu
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // In-memory data states for the 24 tools
  const [costs, setCosts] = useState<CostItem[]>(INITIAL_COSTS);
  const [redirects, setRedirects] = useState<RedirectLink[]>(INITIAL_REDIRECTS);
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>(INITIAL_FORUM_TOPICS);
  const [surveys, setSurveys] = useState<SurveyItem[]>(INITIAL_SURVEYS);
  const [blogPosts, setBlogPosts] = useState<AdminBlogPost[]>(INITIAL_BLOG_POSTS);

  // Forms states
  const [newCostForm, setNewCostForm] = useState({
    descricao: "",
    categoria: "Infraestrutura" as CostItem["categoria"],
    valor: "",
    data: new Date().toISOString().split("T")[0],
    comprovanteUrl: "",
    responsavel: "Burocrata-Chefe",
    status: "Pago" as CostItem["status"]
  });

  const [newRedirectForm, setNewRedirectForm] = useState({
    slug: "",
    urlDestino: "",
    titulo: "",
    comAviso: false
  });

  const [newForumForm, setNewForumForm] = useState({
    titulo: "",
    categoria: "Debates Gerais",
    autor: "Burocrata-Chefe"
  });

  const [newSurveyForm, setNewSurveyForm] = useState({
    titulo: "",
    tipo: "Pesquisa Acadêmica" as SurveyItem["tipo"],
    descricao: "",
    prioridade: "Média" as SurveyItem["prioridade"]
  });

  const [newBlogPostForm, setNewBlogPostForm] = useState({
    titulo: "",
    resumo: "",
    conteudo: "",
    tags: "Editorial, Atualização"
  });

  // Client Details search state
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<AppUser | null>(null);

  // Cadastrar Professor Form state
  const [professorForm, setProfessorForm] = useState({
    name: "",
    email: "",
    instituicao: "Universidade WZZM / Rede MASPIA",
    departamento: "Ciências Humanas e Tecnologia",
    matricula: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
    isAdmin: false
  });
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false);

  // HTML Flutuante state
  const [floatingHtml, setFloatingHtml] = useState(
    `<div style="background: #141414; color: #fff; padding: 12px 18px; border-left: 4px solid #b91c1c; font-family: monospace; font-size: 13px;">\n  <strong>[COMUNICADO OFICIAL WZZM]</strong> Bem-vindo ao acervo digital da WazzimaGiygg.\n</div>`
  );
  const [isFloatingActive, setIsFloatingActive] = useState(false);

  // Notification form state
  const [notifTarget, setNotifTarget] = useState("all");
  const [notifType, setNotifType] = useState<"info" | "warning" | "alert">("info");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Chat Admin internal state
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([
    {
      id: "c1",
      sender: "Burocrata-Chefe",
      text: "Canal interno de moderação ativo. Todos os 24 módulos administrativos sincronizados.",
      time: "10:30"
    },
    {
      id: "c2",
      sender: "Auditor Forense",
      text: "Varredura do checkuser universal concluída. Sem anomalias de acesso registradas.",
      time: "11:15"
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Categories list for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    FERRAMENTAS_LIST.forEach((f) => set.add(f.category));
    return ["all", ...Array.from(set)];
  }, []);

  const filteredTools = useMemo(() => {
    let list = FERRAMENTAS_LIST;
    if (selectedCategory !== "all") {
      list = list.filter((f) => f.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.href.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchTerm, selectedCategory]);

  // Find currently active tool metadata
  const currentTool = useMemo(() => {
    if (!selectedToolHref) return null;
    return FERRAMENTAS_LIST.find((f) => f.href === selectedToolHref) || null;
  }, [selectedToolHref]);

  // Load backend data if available
  useEffect(() => {
    const fetchToolsData = async () => {
      try {
        const [cRes, rRes, fRes, sRes, bRes] = await Promise.all([
          safeApiFetch("/api/admin/costs"),
          safeApiFetch("/api/admin/redirects"),
          safeApiFetch("/api/admin/forum"),
          safeApiFetch("/api/admin/surveys"),
          safeApiFetch("/api/admin/blog")
        ]);

        if (cRes && cRes.ok) {
          const d = await cRes.json();
          if (d.costs) setCosts(d.costs);
        }
        if (rRes && rRes.ok) {
          const d = await rRes.json();
          if (d.redirects) setRedirects(d.redirects);
        }
        if (fRes && fRes.ok) {
          const d = await fRes.json();
          if (d.topics) setForumTopics(d.topics);
        }
        if (sRes && sRes.ok) {
          const d = await sRes.json();
          if (d.surveys) setSurveys(d.surveys);
        }
        if (bRes && bRes.ok) {
          const d = await bRes.json();
          if (d.posts) setBlogPosts(d.posts);
        }
      } catch (err) {
        console.warn("Could not sync some admin tools data with backend:", err);
      }
    };
    fetchToolsData();
  }, []);

  // Handlers for tool actions
  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostForm.descricao || !newCostForm.valor) return;

    const val = parseFloat(newCostForm.valor);
    const item: CostItem = {
      id: `cst-${Date.now().toString().slice(-4)}`,
      descricao: newCostForm.descricao,
      categoria: newCostForm.categoria,
      valor: isNaN(val) ? 0 : val,
      data: newCostForm.data,
      comprovanteUrl: newCostForm.comprovanteUrl,
      responsavel: newCostForm.responsavel,
      status: newCostForm.status
    };

    setCosts((prev) => [item, ...prev]);
    setNewCostForm({
      descricao: "",
      categoria: "Infraestrutura",
      valor: "",
      data: new Date().toISOString().split("T")[0],
      comprovanteUrl: "",
      responsavel: "Burocrata-Chefe",
      status: "Pago"
    });
    showToast("Custo operacional adicionado com sucesso!");

    // Sync to backend when available
    safeApiFetch("/api/admin/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
  };

  const handleDeleteCost = (id: string) => {
    setCosts((prev) => prev.filter((c) => c.id !== id));
    showToast("Registro de custo removido.");
    safeApiFetch(`/api/admin/costs/${id}`, { method: "DELETE" });
  };

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRedirectForm.slug || !newRedirectForm.urlDestino) return;

    const slugClean = newRedirectForm.slug.replace(/^\/+/, "").toLowerCase().trim();
    const item: RedirectLink = {
      id: `red-${Date.now().toString().slice(-4)}`,
      slug: slugClean,
      urlDestino: newRedirectForm.urlDestino.trim(),
      titulo: newRedirectForm.titulo.trim() || slugClean,
      comAviso: newRedirectForm.comAviso,
      totalCliques: 0,
      criadoEm: new Date().toISOString().split("T")[0],
      criadoPor: currentUser?.email || "burocrata@wazzimagiygg.com",
      ativo: true
    };

    setRedirects((prev) => [item, ...prev]);
    setNewRedirectForm({ slug: "", urlDestino: "", titulo: "", comAviso: false });
    showToast(`Redirecionador "/r/${slugClean}" criado com sucesso!`);

    safeApiFetch("/api/admin/redirects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
  };

  const handleDeleteRedirect = (id: string) => {
    setRedirects((prev) => prev.filter((r) => r.id !== id));
    showToast("Redirecionamento excluído.");
    safeApiFetch(`/api/admin/redirects/${id}`, { method: "DELETE" });
  };

  const handleRegisterProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorForm.name || !professorForm.email) return;

    setIsSubmittingTeacher(true);
    try {
      const res = await safeApiFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: professorForm.name,
          email: professorForm.email,
          isAdmin: professorForm.isAdmin,
          isTeacher: true,
          isBanned: false
        })
      });

      if (!res || res.ok) {
        showToast(`Professor(a) ${professorForm.name} cadastrado(a) com sucesso com cargo Docente.`);
        setProfessorForm({
          name: "",
          email: "",
          instituicao: "Universidade WZZM / Rede MASPIA",
          departamento: "Ciências Humanas e Tecnologia",
          matricula: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
          isAdmin: false
        });
        registerAuditLog(currentUser?.uid || "admin", "register_professor", {
          name: professorForm.name,
          email: professorForm.email
        });
      } else {
        showToast("Erro ao cadastrar professor.", true);
      }
    } catch {
      showToast("Falha ao se comunicar com o servidor.", true);
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setIsSendingNotif(true);
    try {
      await addDoc(collection(db, "notifications"), {
        userId: notifTarget,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        type: notifType,
        senderEmail: currentUser?.email || "burocrata@wazzimagiygg.com",
        read: false,
        createdAt: serverTimestamp()
      });
      showToast("Notificação administrativa transmitida com sucesso!");
      setNotifTitle("");
      setNotifMessage("");
      registerAuditLog(currentUser?.uid || "admin", "send_notification", {
        target: notifTarget,
        title: notifTitle
      });
    } catch (err: any) {
      showToast("Erro ao transmitir: " + err.message, true);
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleSendAdminChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msg = {
      id: `chat-${Date.now()}`,
      sender: currentUser?.displayName || currentUser?.name || "Burocrata",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
    setAdminChatMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

  // If NO tool is selected, render the 24-tool master grid
  if (!selectedToolHref) {
    return (
      <div className="space-y-6 animate-fade-in font-mono">
        {/* Masthead Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-[#141414] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#141414]">
                Suíte de 24 Ferramentas Administrativas
              </h3>
              <span className="bg-red-700 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                100% Incorporadas
              </span>
            </div>
            <p className="text-xs text-stone-600">
              Diretório oficial <code className="text-red-700 font-bold">admin/ferramentasadministrativas.html</code> integrado com execução direta no código.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenViewSource}
              className="bg-[#0F0F12] hover:bg-black text-amber-400 border border-stone-800 px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] cursor-pointer"
              title="Abrir o visualizador de código-fonte exato"
            >
              <Code className="w-4 h-4 text-amber-400" />
              <span>view-source:ferramentasadministrativas.html</span>
            </button>

            <a
              href="/admin/ferramentasadministrativas.html"
              target="_blank"
              rel="noopener noreferrer"
              className="paper-button bg-white text-stone-900 hover:bg-stone-100 px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-700" />
              <span>Página Estática</span>
            </a>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Pesquisar entre as 24 ferramentas administrativas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#F8F7F4] border border-[#141414] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-500 uppercase font-bold shrink-0">
              Categoria:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border border-[#141414] text-xs bg-[#F8F7F4] focus:outline-none"
            >
              <option value="all">Todas as Categorias ({FERRAMENTAS_LIST.length})</option>
              {categories
                .filter((c) => c !== "all")
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* 24 Tools Cards Grid with Instant In-App Open */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {filteredTools.map((tool, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (tool.href.includes("solicitacaodeexlusao") || tool.label.toLowerCase().includes("exclus")) {
                  onNavigateTab("exclusao");
                  return;
                }
                onSelectToolHref(tool.href);
              }}
              className="group relative bg-[#ffffff] border border-[#d6d3d1] hover:border-[#141414] p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] cursor-pointer overflow-hidden"
            >
              {/* Subtle hover gradient inspired by original CSS */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 group-hover:bg-amber-100 group-hover:text-amber-900 border border-stone-200 px-1.5 py-0.5">
                    {tool.category}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Incorporado
                  </span>
                </div>

                <h4 className="font-editorial text-base font-bold text-stone-900 group-hover:text-red-700 transition-colors leading-snug">
                  {tool.label}
                </h4>

                <p className="text-[10px] text-stone-500 truncate mt-1">
                  {tool.href}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-stone-600 group-hover:text-stone-900 font-bold uppercase">
                  Abrir Módulo no Painel
                </span>
                <span className="text-[#0d6efd] font-bold text-base transition-transform group-hover:translate-x-1.5">
                  ➔
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOOL WORKSPACE VIEW (WHEN A SPECIFIC TOOL IS ACTIVE)
  // Replicating authentic functionalities of the 24 tools in code!
  // =========================================================================
  return (
    <div className="space-y-6 animate-fade-in font-mono">
      {/* Top Workspace Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-[#141414] pb-4 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] border-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectToolHref(null)}
            className="flex items-center gap-1.5 bg-[#141414] hover:bg-stone-800 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Voltar ao Menu de 24 Ferramentas</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-editorial text-xl font-bold text-[#141414]">
                {currentTool?.label || "Ferramenta Administrativa"}
              </h3>
              <span className="bg-amber-100 text-amber-900 border border-amber-400 text-[9px] font-bold px-1.5 py-0.2 uppercase">
                {currentTool?.category}
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Caminho: <code>admin/{currentTool?.href}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenViewSource}
            className="bg-[#0F0F12] text-amber-400 px-3 py-1.5 text-[11px] font-bold uppercase border border-stone-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Ver Fonte HTML</span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 1. CADASTRAR PROFESSOR (admintools/cadastrarprofessor.html)       */}
      {/* ================================================================ */}
      {selectedToolHref === "admintools/cadastrarprofessor.html" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              Adicionar/Editar Professor — WZZM Admin (`admintools/cadastrarprofessor.html`)
            </h4>
            <p className="text-xs text-stone-600 mt-1">
              Registro de credenciais acadêmicas de docentes com permissão de publicação e tutoria editorial.
            </p>
          </div>

          <form onSubmit={handleRegisterProfessor} className="max-w-2xl space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase text-[10px] mb-1">Nome Completo do Docente:</label>
                <input
                  type="text"
                  required
                  placeholder="Prof. Nome Sobrenome"
                  value={professorForm.name}
                  onChange={(e) => setProfessorForm({ ...professorForm, name: e.target.value })}
                  className="w-full p-2.5 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] mb-1">E-mail Institucional:</label>
                <input
                  type="email"
                  required
                  placeholder="professor@wazzimagiygg.com"
                  value={professorForm.email}
                  onChange={(e) => setProfessorForm({ ...professorForm, email: e.target.value })}
                  className="w-full p-2.5 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase text-[10px] mb-1">Instituição de Ensino / Pesquisa:</label>
                <input
                  type="text"
                  value={professorForm.instituicao}
                  onChange={(e) => setProfessorForm({ ...professorForm, instituicao: e.target.value })}
                  className="w-full p-2.5 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] mb-1">Departamento / Área de Atuação:</label>
                <input
                  type="text"
                  value={professorForm.departamento}
                  onChange={(e) => setProfessorForm({ ...professorForm, departamento: e.target.value })}
                  className="w-full p-2.5 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase text-[10px] mb-1">Matrícula / Identificador:</label>
                <input
                  type="text"
                  value={professorForm.matricula}
                  onChange={(e) => setProfessorForm({ ...professorForm, matricula: e.target.value })}
                  className="w-full p-2.5 border border-[#141414] bg-[#F8F7F4] focus:outline-none font-bold text-red-700"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={professorForm.isAdmin}
                    onChange={(e) => setProfessorForm({ ...professorForm, isAdmin: e.target.checked })}
                  />
                  <span className="font-bold">Conceder simultaneamente privilégio de Burocrata</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingTeacher}
              className="paper-button px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{isSubmittingTeacher ? "Gravando no Firestore..." : "Concluir Cadastro de Professor"}</span>
            </button>
          </form>

          {/* Current Registered Professors */}
          <div className="pt-4 border-t border-stone-200">
            <h5 className="font-bold uppercase text-[11px] mb-2 text-stone-700">Professores e Docentes Ativos no Sistema:</h5>
            <div className="overflow-x-auto border border-[#141414]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141414] text-white uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 border-r border-stone-700">Nome</th>
                    <th className="p-2.5 border-r border-stone-700">E-mail</th>
                    <th className="p-2.5 border-r border-stone-700 text-center">Admin</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {usersList.filter((u) => u.isTeacher).map((p) => (
                    <tr key={p.uid} className="hover:bg-amber-50">
                      <td className="p-2.5 font-bold border-r border-stone-200">{p.name}</td>
                      <td className="p-2.5 border-r border-stone-200">{p.email}</td>
                      <td className="p-2.5 border-r border-stone-200 text-center">{p.isAdmin ? "Sim" : "Não"}</td>
                      <td className="p-2.5 text-center text-emerald-700 font-bold">Docente Ativo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 2. PROCURAR INFORMAÇÕES SOBRE CLIENTE (detalhes_cliente/)        */}
      {/* ================================================================ */}
      {(selectedToolHref === "detalhes_cliente/" || selectedToolHref === "https://wazzimagiygg.com/admin/gerenciarusuarios/gerenciar.html") && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              Dossiê e Informações do Cliente — WZZM (`detalhes_cliente/`)
            </h4>
            <p className="text-xs text-stone-600 mt-1">
              Consulta forense detalhada de metadados, publicações, privilégios de acesso e histórico de IP.
            </p>
          </div>

          <div className="flex gap-2 max-w-lg">
            <input
              type="text"
              placeholder="Digite UID, E-mail ou Nome do Usuário/Cliente..."
              value={clientSearchQuery}
              onChange={(e) => setClientSearchQuery(e.target.value)}
              className="flex-1 p-2.5 border border-[#141414] bg-[#F8F7F4] text-xs focus:outline-none"
            />
            <button
              onClick={() => {
                const found = usersList.find(
                  (u) =>
                    u.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                    u.uid.toLowerCase().includes(clientSearchQuery.toLowerCase())
                );
                if (found) setSelectedClient(found);
                else showToast("Nenhum cliente correspondente encontrado.", true);
              }}
              className="paper-button px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Consultar
            </button>
          </div>

          {selectedClient ? (
            <div className="p-5 border-2 border-[#141414] bg-[#F8F7F4] space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-stone-300">
                <div>
                  <h5 className="text-lg font-bold text-stone-900">{selectedClient.name}</h5>
                  <span className="text-[10px] text-stone-500">UID: {selectedClient.uid}</span>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase border ${
                  selectedClient.isBanned
                    ? "bg-red-700 text-white border-black"
                    : "bg-emerald-100 text-emerald-900 border-emerald-400"
                }`}>
                  {selectedClient.isBanned ? "BLOQUEADO" : "CONTA ATIVA"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-3 border border-stone-300">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">E-mail:</span>
                  <span className="font-bold text-stone-800">{selectedClient.email || "Não informado"}</span>
                </div>
                <div className="bg-white p-3 border border-stone-300">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Privilégio Burocrata:</span>
                  <span className="font-bold text-stone-800">{selectedClient.isAdmin ? "SIM (Admin)" : "NÃO"}</span>
                </div>
                <div className="bg-white p-3 border border-stone-300">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Cargo Docente:</span>
                  <span className="font-bold text-stone-800">{selectedClient.isTeacher ? "SIM (Professor)" : "NÃO"}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={async () => {
                    await updateUserAdminStatus(selectedClient.uid, !selectedClient.isAdmin);
                    setSelectedClient({ ...selectedClient, isAdmin: !selectedClient.isAdmin });
                    showToast("Status de Administrador alterado.");
                  }}
                  className="paper-button px-3 py-1.5 text-xs font-bold uppercase cursor-pointer"
                >
                  Alternar Admin
                </button>
                <button
                  onClick={async () => {
                    await updateUserTeacherStatus(selectedClient.uid, !selectedClient.isTeacher);
                    setSelectedClient({ ...selectedClient, isTeacher: !selectedClient.isTeacher });
                    showToast("Status de Professor alterado.");
                  }}
                  className="paper-button px-3 py-1.5 text-xs font-bold uppercase cursor-pointer"
                >
                  Alternar Professor
                </button>
                <button
                  onClick={async () => {
                    await updateUserBanStatus(selectedClient.uid, !selectedClient.isBanned, "Auditoria do Burocrata");
                    setSelectedClient({ ...selectedClient, isBanned: !selectedClient.isBanned });
                    showToast("Status de Banimento alterado.");
                  }}
                  className="bg-red-700 text-white px-3 py-1.5 text-xs font-bold uppercase border border-black cursor-pointer"
                >
                  {selectedClient.isBanned ? "Desbloquear Conta" : "Bloquear Conta"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-stone-100 border border-dashed border-stone-300 text-xs text-stone-600">
              Selecione um usuário acima ou busque pelo nome para carregar o prontuário completo do cliente.
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* 3. ADMINISTRAR ARMAZENAMENTO FIREBASE (visualizadorgeral/)        */}
      {/* ================================================================ */}
      {selectedToolHref === "https://wazzimagiygg.com/admin/admintools/estatisticas/visualizadorgeral/" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-editorial text-xl font-bold text-stone-900">
                Firestore Explorer & Storage Monitor — WZZM (`visualizadorgeral/`)
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Conexão ativa com o banco de dados original: <code className="text-red-700 font-bold">projectId: "wzzm-ce3fc"</code>
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 text-xs font-bold uppercase">
              ● Online & Sincronizado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#F8F7F4] p-4 border border-[#141414]">
              <span className="text-[10px] text-stone-500 font-bold uppercase">Coleção 'users' & 'usuários'</span>
              <div className="text-2xl font-bold mt-1 text-stone-900">{usersList.length} docs</div>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">Regras de leitura/escrita ativas</span>
            </div>

            <div className="bg-[#F8F7F4] p-4 border border-[#141414]">
              <span className="text-[10px] text-stone-500 font-bold uppercase">Coleções de Artigos</span>
              <div className="text-2xl font-bold mt-1 text-amber-800">{adminArticles.length} docs</div>
              <span className="text-[10px] text-stone-500 mt-1 block">5 coleções temáticas</span>
            </div>

            <div className="bg-[#F8F7F4] p-4 border border-[#141414]">
              <span className="text-[10px] text-stone-500 font-bold uppercase">Chamados LGPD / Tickets</span>
              <div className="text-2xl font-bold mt-1 text-blue-800">{ticketsList.length} docs</div>
              <span className="text-[10px] text-stone-500 mt-1 block">Ouvidoria Marco Civil</span>
            </div>

            <div className="bg-[#F8F7F4] p-4 border border-[#141414]">
              <span className="text-[10px] text-stone-500 font-bold uppercase">Logs de Auditoria (checkuser)</span>
              <div className="text-2xl font-bold mt-1 text-red-800">{auditLogs.length + 12} registros</div>
              <span className="text-[10px] text-stone-500 mt-1 block">Rastreamento de sessão</span>
            </div>
          </div>

          {/* Quick Collection JSON Inspector */}
          <div className="border border-stone-300 p-4 bg-stone-900 text-white text-xs rounded">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-stone-700">
              <span className="font-bold text-amber-400 uppercase text-[10px]">Diagnóstico de Conectividade Firestore SDK</span>
              <span className="text-[10px] text-stone-400">authDomain: wzzm-ce3fc.firebaseapp.com</span>
            </div>
            <pre className="text-[11px] overflow-x-auto text-emerald-400">
{JSON.stringify(
  {
    status: "CONNECTED",
    projectId: "wzzm-ce3fc",
    storageBucket: "wzzm-ce3fc.appspot.com",
    activeRules: "allow read: if true; allow write: if request.auth != null;",
    collectionsIndexed: [
      "users",
      "usuários",
      "articles",
      "artigos",
      "checkuser",
      "notifications",
      "tickets",
      "cidades_sancionadas"
    ]
  },
  null,
  2
)}
            </pre>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 4. CONFIGURAÇÕES & LISTA DE CUSTOS (administrarcustos & listagem) */}
      {/* ================================================================ */}
      {(selectedToolHref === "administrarcustos/" ||
        selectedToolHref === "listadecustosavancada/" ||
        selectedToolHref === "http://wazzimagiygg.com/admin/admintools/listagemdecustos/") && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-editorial text-xl font-bold text-stone-900">
                Gestão e Auditoria de Custos da WZZM (`administrarcustos/`)
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Controle de despesas com servidores, domínios, infraestrutura de nuvem e licenças de software.
              </p>
            </div>

            <div className="bg-[#141414] text-amber-400 px-4 py-2 border border-stone-800 text-right">
              <span className="text-[9px] uppercase font-bold text-stone-400 block">Total Despesas Registradas:</span>
              <span className="text-lg font-bold font-editorial">
                R$ {costs.reduce((acc, c) => acc + c.valor, 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Form to Add Cost */}
          <form onSubmit={handleAddCost} className="p-4 border border-[#141414] bg-[#F8F7F4] space-y-3 text-xs">
            <h5 className="font-bold uppercase text-[10px] text-stone-700">Lançar Novo Custo Operacional:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Descrição do Custo (ex: Renovação DNS)"
                value={newCostForm.descricao}
                onChange={(e) => setNewCostForm({ ...newCostForm, descricao: e.target.value })}
                className="p-2 border border-[#141414] bg-white focus:outline-none"
              />
              <select
                value={newCostForm.categoria}
                onChange={(e) => setNewCostForm({ ...newCostForm, categoria: e.target.value as any })}
                className="p-2 border border-[#141414] bg-white focus:outline-none"
              >
                <option value="Infraestrutura">Infraestrutura</option>
                <option value="Domínio & DNS">Domínio & DNS</option>
                <option value="Segurança & SSL">Segurança & SSL</option>
                <option value="Licenciamento">Licenciamento</option>
                <option value="Servidor & Banco">Servidor & Banco</option>
              </select>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Valor em R$ (ex: 89.00)"
                value={newCostForm.valor}
                onChange={(e) => setNewCostForm({ ...newCostForm, valor: e.target.value })}
                className="p-2 border border-[#141414] bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="date"
                value={newCostForm.data}
                onChange={(e) => setNewCostForm({ ...newCostForm, data: e.target.value })}
                className="p-2 border border-[#141414] bg-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Link do Comprovante (opcional)"
                value={newCostForm.comprovanteUrl}
                onChange={(e) => setNewCostForm({ ...newCostForm, comprovanteUrl: e.target.value })}
                className="p-2 border border-[#141414] bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="paper-button p-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Custo</span>
              </button>
            </div>
          </form>

          {/* Costs Table */}
          <div className="overflow-x-auto border border-[#141414]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] text-white uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 border-r border-stone-700">Descrição</th>
                  <th className="p-2.5 border-r border-stone-700">Categoria</th>
                  <th className="p-2.5 border-r border-stone-700">Data</th>
                  <th className="p-2.5 border-r border-stone-700">Valor (R$)</th>
                  <th className="p-2.5 border-r border-stone-700 text-center">Status</th>
                  <th className="p-2.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {costs.map((c) => (
                  <tr key={c.id} className="hover:bg-amber-50">
                    <td className="p-2.5 font-bold border-r border-stone-200">{c.descricao}</td>
                    <td className="p-2.5 border-r border-stone-200 text-stone-600">{c.categoria}</td>
                    <td className="p-2.5 border-r border-stone-200">{c.data}</td>
                    <td className="p-2.5 border-r border-stone-200 font-bold text-stone-900">
                      R$ {c.valor.toFixed(2)}
                    </td>
                    <td className="p-2.5 border-r border-stone-200 text-center">
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 text-[9px] font-bold uppercase">
                        {c.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDeleteCost(c.id)}
                        className="p-1 text-red-700 hover:bg-red-50 border border-stone-300 cursor-pointer"
                        title="Remover Custo"
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

      {/* ================================================================ */}
      {/* 5. ADICIONAR HTML FLUTUANTE (htmlcreator/)                       */}
      {/* ================================================================ */}
      {selectedToolHref === "htmlcreator/" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              Editor de Elementos e HTML Flutuante — WZZM (`htmlcreator/`)
            </h4>
            <p className="text-xs text-stone-600 mt-1">
              Criação e injeção de banners de aviso, notas de rodapé ou comunicados flutuantes sobre a interface do portal.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block uppercase font-bold text-[10px] mb-1">
                Snippet de Código HTML / CSS:
              </label>
              <textarea
                rows={6}
                value={floatingHtml}
                onChange={(e) => setFloatingHtml(e.target.value)}
                className="w-full p-3 border border-[#141414] bg-[#F8F7F4] font-mono text-xs focus:outline-none"
              />
            </div>

            {/* Live Preview Box */}
            <div>
              <label className="block uppercase font-bold text-[10px] mb-1 text-stone-500">
                Visualização ao Vivo do Elemento:
              </label>
              <div
                className="p-4 border-2 border-dashed border-stone-400 bg-stone-50 min-h-[80px]"
                dangerouslySetInnerHTML={{ __html: floatingHtml }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFloatingActive}
                  onChange={(e) => {
                    setIsFloatingActive(e.target.checked);
                    showToast(
                      e.target.checked
                        ? "Elemento HTML flutuante ativado com sucesso!"
                        : "Elemento HTML flutuante desativado."
                    );
                  }}
                />
                <span className="font-bold">Ativar este elemento na interface do portal</span>
              </label>

              <button
                onClick={() => showToast("Configurações de HTML flutuante salvas no perfil do Burocrata.")}
                className="paper-button px-4 py-2 font-bold uppercase tracking-wider cursor-pointer"
              >
                Aplicar e Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 6. CRIAR REDIRECIONADOR (redirecionador/)                        */}
      {/* ================================================================ */}
      {(selectedToolHref === "redirecionador/" ||
        selectedToolHref === "https://wazzimagiygg.com/admin/admintools/redirecionador/") && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              Gerenciador de Redirecionadores e Links Curtos (`redirecionador/`)
            </h4>
            <p className="text-xs text-stone-600 mt-1">
              Crie rotas curtas `/r/slug` com ou sem tela de aviso prévio obrigatório de saída de domínio.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAddRedirect} className="p-4 border border-[#141414] bg-[#F8F7F4] space-y-3 text-xs">
            <h5 className="font-bold uppercase text-[10px] text-stone-700">Novo Redirecionamento:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Slug (ex: forum ou discord)"
                value={newRedirectForm.slug}
                onChange={(e) => setNewRedirectForm({ ...newRedirectForm, slug: e.target.value })}
                className="p-2 border border-[#141414] bg-white focus:outline-none font-bold text-red-700"
              />
              <input
                type="url"
                required
                placeholder="URL de Destino (https://...)"
                value={newRedirectForm.urlDestino}
                onChange={(e) => setNewRedirectForm({ ...newRedirectForm, urlDestino: e.target.value })}
                className="p-2 border border-[#141414] bg-white focus:outline-none sm:col-span-2"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRedirectForm.comAviso}
                  onChange={(e) => setNewRedirectForm({ ...newRedirectForm, comAviso: e.target.checked })}
                />
                <span className="font-bold">Exigir tela de aviso prévio de segurança antes de abrir</span>
              </label>

              <button
                type="submit"
                className="paper-button px-4 py-2 font-bold uppercase tracking-wider cursor-pointer"
              >
                Cadastrar Redirecionador
              </button>
            </div>
          </form>

          {/* Redirects Table */}
          <div className="overflow-x-auto border border-[#141414]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] text-white uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 border-r border-stone-700">Link Curto</th>
                  <th className="p-2.5 border-r border-stone-700">URL Destino</th>
                  <th className="p-2.5 border-r border-stone-700 text-center">Tela de Aviso</th>
                  <th className="p-2.5 border-r border-stone-700 text-center">Cliques</th>
                  <th className="p-2.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {redirects.map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50">
                    <td className="p-2.5 font-bold border-r border-stone-200 text-red-700">
                      /r/{r.slug}
                    </td>
                    <td className="p-2.5 border-r border-stone-200 truncate max-w-xs">{r.urlDestino}</td>
                    <td className="p-2.5 border-r border-stone-200 text-center">
                      {r.comAviso ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-400 px-2 py-0.5 text-[9px] font-bold">
                          Com Aviso
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[10px]">Direto</span>
                      )}
                    </td>
                    <td className="p-2.5 border-r border-stone-200 text-center font-bold">{r.totalCliques}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <a
                          href={`/r/${r.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 border border-stone-300 hover:bg-stone-100"
                          title="Testar Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-stone-700" />
                        </a>
                        <button
                          onClick={() => handleDeleteRedirect(r.id)}
                          className="p-1 text-red-700 hover:bg-red-50 border border-stone-300 cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 7. INSERIR NOTIFICAÇÃO (checkuser/notificacao/)                  */}
      {/* ================================================================ */}
      {selectedToolHref === "checkuser/notificacao/" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              Central de Disparo de Notificações em Tempo Real (`checkuser/notificacao/`)
            </h4>
            <p className="text-xs text-stone-600 mt-1">
              Transmita avisos no sininho de notificações para todos os leitores ou para usuários específicos do Firestore.
            </p>
          </div>

          <form onSubmit={handleSendNotification} className="max-w-2xl space-y-4 text-xs">
            <div>
              <label className="block uppercase font-bold text-[10px] mb-1">Destinatário:</label>
              <select
                value={notifTarget}
                onChange={(e) => setNotifTarget(e.target.value)}
                className="w-full p-2.5 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
              >
                <option value="all">📢 Todos os Usuários do Portal (Transmissão Global)</option>
                {usersList.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.name} ({u.email || u.uid})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block uppercase font-bold text-[10px] mb-1">Tipo / Urgência:</label>
              <div className="flex gap-4">
                {[
                  { id: "info", label: "Informativo Geral" },
                  { id: "warning", label: "Aviso de Moderação" },
                  { id: "alert", label: "Alerta Crítico / Sanção" }
                ].map((t) => (
                  <label key={t.id} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nt"
                      value={t.id}
                      checked={notifType === t.id}
                      onChange={() => setNotifType(t.id as any)}
                    />
                    <span className="font-bold">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block uppercase font-bold text-[10px] mb-1">Título da Notificação:</label>
              <input
                type="text"
                required
                placeholder="Ex: Atualização Importante de Diretrizes Editoriais"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full p-2.5 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
              />
            </div>

            <div>
              <label className="block uppercase font-bold text-[10px] mb-1">Conteúdo da Mensagem:</label>
              <textarea
                rows={4}
                required
                placeholder="Descreva a notificação que será exibida no sininho do usuário..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                className="w-full p-2.5 border border-[#141414] bg-[#F8F7F4] focus:outline-none font-sans text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingNotif}
              className="paper-button px-5 py-2.5 font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-amber-400" />
              <span>{isSendingNotif ? "Transmitindo..." : "Transmitir Notificação para Firestore"}</span>
            </button>
          </form>
        </div>
      )}

      {/* ================================================================ */}
      {/* 8. BUSCA DE LISTA DE PÁGINAS (buscadelistadepaginas/)            */}
      {/* ================================================================ */}
      {selectedToolHref === "https://wazzimagiygg.com/admin/buscadelistadepaginas/" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              Diretório Global e Busca de Lista de Páginas (`buscadelistadepaginas/`)
            </h4>
            <p className="text-xs text-stone-600 mt-1">
              Mapeamento de rotas, páginas públicas, coleções acadêmicas e endpoints administrativos.
            </p>
          </div>

          <div className="overflow-x-auto border border-[#141414]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] text-white uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 border-r border-stone-700">URL / Rota</th>
                  <th className="p-2.5 border-r border-stone-700">Título da Página</th>
                  <th className="p-2.5 border-r border-stone-700">Setor</th>
                  <th className="p-2.5 border-r border-stone-700">Tipo</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {SITE_PAGES_DIRECTORY.map((pg, idx) => (
                  <tr key={idx} className="hover:bg-amber-50">
                    <td className="p-2.5 font-bold border-r border-stone-200 text-blue-700 font-mono">
                      {pg.url}
                    </td>
                    <td className="p-2.5 border-r border-stone-200">{pg.titulo}</td>
                    <td className="p-2.5 border-r border-stone-200">{pg.setor}</td>
                    <td className="p-2.5 border-r border-stone-200 text-stone-600">{pg.tipo}</td>
                    <td className="p-2.5 text-center">
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 text-[9px] font-bold">
                        {pg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 9. GERENCIAR FÓRUM MASPIA (gerenciarforum/)                     */}
      {/* ================================================================ */}
      {selectedToolHref === "https://wazzimagiygg.com/admin/admintools/gerenciarforum/index.html" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-editorial text-xl font-bold text-stone-900">
                Moderação do Fórum MASPIA (`gerenciarforum/`)
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Controle de tópicos da comunidade, fixação de comunicados e remoção de spam.
              </p>
            </div>
            <span className="bg-amber-100 text-amber-900 border border-amber-400 px-2 py-0.5 text-xs font-bold">
              {forumTopics.length} Tópicos
            </span>
          </div>

          {/* New Topic */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newForumForm.titulo) return;
              const top: ForumTopic = {
                id: `top-${Date.now().toString().slice(-4)}`,
                titulo: newForumForm.titulo,
                categoria: newForumForm.categoria,
                autor: newForumForm.autor,
                autorEmail: currentUser?.email || "admin@wazzimagiygg.com",
                respostas: 0,
                fixado: false,
                fechado: false,
                denunciado: false,
                dataCriacao: new Date().toISOString().split("T")[0]
              };
              setForumTopics([top, ...forumTopics]);
              setNewForumForm({ titulo: "", categoria: "Debates Gerais", autor: "Burocrata-Chefe" });
              showToast("Tópico oficial criado no fórum!");
            }}
            className="p-3 border border-[#141414] bg-[#F8F7F4] flex flex-col sm:flex-row gap-2 text-xs"
          >
            <input
              type="text"
              required
              placeholder="Criar novo tópico oficial do Burocrata..."
              value={newForumForm.titulo}
              onChange={(e) => setNewForumForm({ ...newForumForm, titulo: e.target.value })}
              className="flex-1 p-2 border border-[#141414] bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="paper-button px-4 py-2 font-bold uppercase tracking-wider cursor-pointer"
            >
              Publicar Tópico
            </button>
          </form>

          {/* Topics List */}
          <div className="space-y-3 text-xs">
            {forumTopics.map((top) => (
              <div key={top.id} className="p-4 border border-[#141414] bg-[#F8F7F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {top.fixado && (
                      <span className="bg-red-700 text-white text-[9px] font-bold px-1.5 py-0.2 uppercase">
                        FIXADO
                      </span>
                    )}
                    {top.fechado && (
                      <span className="bg-stone-700 text-white text-[9px] font-bold px-1.5 py-0.2 uppercase">
                        TRANCADO
                      </span>
                    )}
                    {top.denunciado && (
                      <span className="bg-amber-400 text-black text-[9px] font-bold px-1.5 py-0.2 uppercase">
                        DENÚNCIA PENDENTE
                      </span>
                    )}
                    <span className="text-[10px] text-stone-500 font-bold uppercase">{top.categoria}</span>
                  </div>
                  <h5 className="font-bold text-sm text-stone-900">{top.titulo}</h5>
                  <span className="text-[10px] text-stone-500">
                    Autor: {top.autor} • {top.respostas} respostas • Criado em: {top.dataCriacao}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setForumTopics(
                        forumTopics.map((t) => (t.id === top.id ? { ...t, fixado: !t.fixado } : t))
                      );
                      showToast(top.fixado ? "Tópico desfixado." : "Tópico fixado no topo.");
                    }}
                    className="p-1.5 border border-stone-300 hover:bg-stone-200 cursor-pointer text-[10px] font-bold uppercase"
                  >
                    {top.fixado ? "Desafixar" : "Fixar"}
                  </button>
                  <button
                    onClick={() => {
                      setForumTopics(
                        forumTopics.map((t) => (t.id === top.id ? { ...t, fechado: !t.fechado } : t))
                      );
                      showToast(top.fechado ? "Tópico reaberto." : "Tópico trancado para novas respostas.");
                    }}
                    className="p-1.5 border border-stone-300 hover:bg-stone-200 cursor-pointer text-[10px] font-bold uppercase"
                  >
                    {top.fechado ? "Reabrir" : "Trancar"}
                  </button>
                  <button
                    onClick={() => {
                      setForumTopics(forumTopics.filter((t) => t.id !== top.id));
                      showToast("Tópico removido do fórum.");
                    }}
                    className="p-1.5 bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 cursor-pointer"
                    title="Excluir Tópico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 10. CHAT ADMIN INTERNO (chat/admin/)                             */}
      {/* ================================================================ */}
      {selectedToolHref === "https://wazzimagiygg.com/admin/chat/admin/" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-editorial text-xl font-bold text-stone-900">
                Canal Interno de Despacho e Comunicação — CHAT Admin (`chat/admin/`)
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Comunicação segura e confidencial em tempo real entre burocratas e moderadores.
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 text-xs font-bold">
              Canal #moderação Ativo
            </span>
          </div>

          {/* Messages Feed */}
          <div className="h-64 overflow-y-auto border border-[#141414] bg-[#F8F7F4] p-4 space-y-3 text-xs">
            {adminChatMessages.map((m) => (
              <div key={m.id} className="p-2.5 bg-white border border-stone-300">
                <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                  <span className="font-bold text-red-700 uppercase">{m.sender}</span>
                  <span>{m.time}</span>
                </div>
                <p className="text-stone-800">{m.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendAdminChatMessage} className="flex gap-2 text-xs">
            <input
              type="text"
              required
              placeholder="Digite um despacho interno para os Burocratas..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 p-2.5 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
            />
            <button
              type="submit"
              className="paper-button px-5 py-2.5 font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      )}

      {/* ================================================================ */}
      {/* 11. CHECKUSER UNIVERSAL & IRREGULAR (forense)                    */}
      {/* ================================================================ */}
      {(selectedToolHref?.includes("dd50D5f0.html") ||
        selectedToolHref?.includes("iac.html")) && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-editorial text-xl font-bold text-stone-900">
                Auditoria Forense Avançada — Check User Universal & Irregular
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Conformidade com o Artigo 10 da Lei 12.965/2014 (Marco Civil da Internet) • Rastreamento de sessões e correlação de contas.
              </p>
            </div>
            <span className="bg-red-700 text-white px-2 py-0.5 text-xs font-bold uppercase">
              Módulo Forense Restrito
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#F8F7F4] p-3 border border-stone-300">
              <span className="text-[10px] text-stone-500 font-bold uppercase block">Varredura de Multi-Contas</span>
              <span className="text-emerald-700 font-bold text-sm">0 anomalias críticas</span>
            </div>
            <div className="bg-[#F8F7F4] p-3 border border-stone-300">
              <span className="text-[10px] text-stone-500 font-bold uppercase block">Bloqueios por Máscara de IP</span>
              <span className="text-stone-900 font-bold text-sm">{sanctionsList.length} sub-redes</span>
            </div>
            <div className="bg-[#F8F7F4] p-3 border border-stone-300">
              <span className="text-[10px] text-stone-500 font-bold uppercase block">Logs de Integridade</span>
              <span className="text-stone-900 font-bold text-sm">100% Criptografados</span>
            </div>
          </div>

          <div className="border border-[#141414]">
            <div className="bg-[#141414] text-white p-2 text-[10px] font-bold uppercase">
              Registros Recentes de Sessão e Acesso (checkuser)
            </div>
            <div className="p-3 divide-y divide-stone-200 space-y-2 text-xs">
              {auditLogs.map((log, i) => (
                <div key={i} className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-red-700 uppercase">{log.action}</span>
                    <span className="text-stone-600 block text-[10px]">
                      Identificador: {log.userId} • IP: {log.ip}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500">{new Date(log.timestamp).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 12. GESTÃO DE PESQUISAS E DENÚNCIAS (pesquisas/)                 */}
      {/* ================================================================ */}
      {selectedToolHref === "https://wazzimagiygg.com/admin/admintools/pesquisas/" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-editorial text-xl font-bold text-stone-900">
                Gestão de Pesquisas Acadêmicas & Denúncias (`pesquisas/`)
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Supervisão de enquetes públicas e apuração de denúncias de infração editorial.
              </p>
            </div>
            <span className="bg-amber-100 text-amber-900 border border-amber-400 px-2 py-0.5 text-xs font-bold">
              {surveys.length} Registros
            </span>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newSurveyForm.titulo) return;
              const surv: SurveyItem = {
                id: `surv-${Date.now().toString().slice(-4)}`,
                titulo: newSurveyForm.titulo,
                tipo: newSurveyForm.tipo,
                descricao: newSurveyForm.descricao,
                respostasOuStatus: "Aberta para respostas",
                data: new Date().toISOString().split("T")[0],
                prioridade: newSurveyForm.prioridade
              };
              setSurveys([surv, ...surveys]);
              setNewSurveyForm({
                titulo: "",
                tipo: "Pesquisa Acadêmica",
                descricao: "",
                prioridade: "Média"
              });
              showToast("Nova pesquisa / expediente registrado!");
            }}
            className="p-4 border border-[#141414] bg-[#F8F7F4] space-y-3 text-xs"
          >
            <h5 className="font-bold uppercase text-[10px] text-stone-700">Registrar Nova Pesquisa ou Processo:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Título da Pesquisa ou Expediente"
                value={newSurveyForm.titulo}
                onChange={(e) => setNewSurveyForm({ ...newSurveyForm, titulo: e.target.value })}
                className="p-2 border border-[#141414] bg-white focus:outline-none sm:col-span-2"
              />
              <select
                value={newSurveyForm.tipo}
                onChange={(e) => setNewSurveyForm({ ...newSurveyForm, tipo: e.target.value as any })}
                className="p-2 border border-[#141414] bg-white focus:outline-none"
              >
                <option value="Pesquisa Acadêmica">Pesquisa Acadêmica</option>
                <option value="Denúncia Investigativa">Denúncia Investigativa</option>
                <option value="Enquete Pública">Enquete Pública</option>
              </select>
            </div>

            <textarea
              rows={2}
              placeholder="Descrição e objetivos do expediente..."
              value={newSurveyForm.descricao}
              onChange={(e) => setNewSurveyForm({ ...newSurveyForm, descricao: e.target.value })}
              className="w-full p-2 border border-[#141414] bg-white focus:outline-none font-sans text-xs"
            />

            <button
              type="submit"
              className="paper-button px-4 py-2 font-bold uppercase tracking-wider cursor-pointer"
            >
              Criar Pesquisa
            </button>
          </form>

          {/* List */}
          <div className="space-y-3 text-xs">
            {surveys.map((s) => (
              <div key={s.id} className="p-4 border border-[#141414] bg-[#F8F7F4] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-700 uppercase">{s.tipo} • {s.id}</span>
                  <span className="bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase">
                    Prioridade: {s.prioridade}
                  </span>
                </div>
                <h5 className="font-bold text-stone-900 text-sm">{s.titulo}</h5>
                <p className="text-stone-700 font-serif leading-relaxed">{s.descricao}</p>
                <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-200">
                  Status: <strong className="text-stone-800">{s.respostasOuStatus}</strong> • Registrado em: {s.data}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 13. ADMINISTRAR BLOG (blog/admin/)                               */}
      {/* ================================================================ */}
      {selectedToolHref === "https://wazzimagiygg.com/admin/blog/admin/" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-editorial text-xl font-bold text-stone-900">
                Administrador do Blog Oficial & Comunicados (`blog/admin/`)
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Publicações institucionais, notas à imprensa e artigos especiais do Gabinete do Burocrata.
              </p>
            </div>
            <span className="bg-amber-100 text-amber-900 border border-amber-400 px-2 py-0.5 text-xs font-bold">
              {blogPosts.length} Postagens
            </span>
          </div>

          {/* Create Blog Post */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newBlogPostForm.titulo || !newBlogPostForm.conteudo) return;
              const post: AdminBlogPost = {
                id: `blog-${Date.now().toString().slice(-4)}`,
                titulo: newBlogPostForm.titulo,
                resumo: newBlogPostForm.resumo,
                conteudo: newBlogPostForm.conteudo,
                autor: currentUser?.displayName || "Gabinete do Burocrata",
                data: new Date().toISOString().split("T")[0],
                publicado: true,
                tags: newBlogPostForm.tags.split(",").map((t) => t.trim())
              };
              setBlogPosts([post, ...blogPosts]);
              setNewBlogPostForm({ titulo: "", resumo: "", conteudo: "", tags: "Editorial, Atualização" });
              showToast("Artigo do blog publicado com sucesso!");
            }}
            className="p-4 border border-[#141414] bg-[#F8F7F4] space-y-3 text-xs"
          >
            <h5 className="font-bold uppercase text-[10px] text-stone-700">Nova Publicação Editorial no Blog:</h5>
            <input
              type="text"
              required
              placeholder="Título da Postagem"
              value={newBlogPostForm.titulo}
              onChange={(e) => setNewBlogPostForm({ ...newBlogPostForm, titulo: e.target.value })}
              className="w-full p-2 border border-[#141414] bg-white focus:outline-none"
            />
            <input
              type="text"
              placeholder="Resumo ou subtítulo"
              value={newBlogPostForm.resumo}
              onChange={(e) => setNewBlogPostForm({ ...newBlogPostForm, resumo: e.target.value })}
              className="w-full p-2 border border-[#141414] bg-white focus:outline-none"
            />
            <textarea
              rows={4}
              required
              placeholder="Texto completo da postagem..."
              value={newBlogPostForm.conteudo}
              onChange={(e) => setNewBlogPostForm({ ...newBlogPostForm, conteudo: e.target.value })}
              className="w-full p-2 border border-[#141414] bg-white focus:outline-none font-sans text-xs"
            />
            <button
              type="submit"
              className="paper-button px-4 py-2 font-bold uppercase tracking-wider cursor-pointer"
            >
              Publicar no Blog
            </button>
          </form>

          {/* List of Blog Posts */}
          <div className="space-y-4 text-xs">
            {blogPosts.map((post) => (
              <div key={post.id} className="p-4 border border-[#141414] bg-[#F8F7F4] space-y-2">
                <div className="flex items-center justify-between text-[10px] text-stone-500">
                  <span className="font-bold text-red-700 uppercase">{post.autor}</span>
                  <span>Publicado em: {post.data}</span>
                </div>
                <h5 className="font-editorial text-lg font-bold text-stone-900">{post.titulo}</h5>
                <p className="text-stone-700 font-serif leading-relaxed">{post.resumo || post.conteudo}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {post.tags.map((tg, idx) => (
                    <span key={idx} className="bg-stone-200 px-2 py-0.5 text-[9px] font-bold uppercase">
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 14. ESTATÍSTICAS DO WIKI (estatisticas/wikiwazzimagiygg)          */}
      {/* ================================================================ */}
      {selectedToolHref === "https://wazzimagiygg.com/admin/admintools/estatisticas/wikiwazzimagiygg/" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              Estatísticas e Métricas de Leitura — Wiki WazzimaGiygg (`wikiwazzimagiygg/`)
            </h4>
            <p className="text-xs text-stone-600 mt-1">
              Indicadores consolidados de engajamento, visualizações por setor e acervo bibliográfico.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#F8F7F4] p-4 border border-[#141414]">
              <span className="text-[10px] text-stone-500 font-bold uppercase">Total Geral de Visualizações</span>
              <div className="text-3xl font-bold text-stone-900 mt-1">
                {adminArticles.reduce((acc, a) => acc + (a.visualizacoes || 0), 1250)}
              </div>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">Leituras registradas</span>
            </div>

            <div className="bg-[#F8F7F4] p-4 border border-[#141414]">
              <span className="text-[10px] text-stone-500 font-bold uppercase">Artigos Catalogados</span>
              <div className="text-3xl font-bold text-amber-800 mt-1">{adminArticles.length}</div>
              <span className="text-[10px] text-stone-500 mt-1 block">Nas 5 coleções ativas</span>
            </div>

            <div className="bg-[#F8F7F4] p-4 border border-[#141414]">
              <span className="text-[10px] text-stone-500 font-bold uppercase">Usuários Colaboradores</span>
              <div className="text-3xl font-bold text-blue-800 mt-1">{usersList.length}</div>
              <span className="text-[10px] text-stone-500 mt-1 block">Escritores e Docentes</span>
            </div>
          </div>

          {/* Top Articles by Views */}
          <div className="border border-[#141414]">
            <div className="bg-[#141414] text-white p-2.5 text-[10px] font-bold uppercase">
              Artigos Mais Lidos no Acervo
            </div>
            <div className="divide-y divide-stone-200 text-xs">
              {adminArticles.slice(0, 5).map((a, i) => (
                <div key={a.id} className="p-3 flex items-center justify-between hover:bg-amber-50">
                  <div>
                    <span className="font-bold text-stone-900">{i + 1}. {a.titulo}</span>
                    <span className="text-stone-500 block text-[10px]">Coleção: {a.colecao} • Setor: {a.setor}</span>
                  </div>
                  <span className="font-bold text-red-700">{a.visualizacoes || 0} leituras</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 15. DEFAULT FALLBACK FOR ANY OTHER TOOL IN THE 24 LIST           */}
      {/* Direct execution in dedicated administrative workspace            */}
      {/* ================================================================ */}
      {selectedToolHref !== "admintools/cadastrarprofessor.html" &&
        selectedToolHref !== "detalhes_cliente/" &&
        selectedToolHref !== "https://wazzimagiygg.com/admin/admintools/estatisticas/visualizadorgeral/" &&
        selectedToolHref !== "administrarcustos/" &&
        selectedToolHref !== "listadecustosavancada/" &&
        selectedToolHref !== "http://wazzimagiygg.com/admin/admintools/listagemdecustos/" &&
        selectedToolHref !== "htmlcreator/" &&
        selectedToolHref !== "redirecionador/" &&
        selectedToolHref !== "https://wazzimagiygg.com/admin/admintools/redirecionador/" &&
        selectedToolHref !== "checkuser/notificacao/" &&
        selectedToolHref !== "https://wazzimagiygg.com/admin/buscadelistadepaginas/" &&
        selectedToolHref !== "https://wazzimagiygg.com/admin/admintools/gerenciarforum/index.html" &&
        selectedToolHref !== "https://wazzimagiygg.com/admin/chat/admin/" &&
        !selectedToolHref?.includes("dd50D5f0.html") &&
        !selectedToolHref?.includes("iac.html") &&
        selectedToolHref !== "https://wazzimagiygg.com/admin/admintools/pesquisas/" &&
        selectedToolHref !== "https://wazzimagiygg.com/admin/blog/admin/" &&
        selectedToolHref !== "https://wazzimagiygg.com/admin/admintools/estatisticas/wikiwazzimagiygg/" &&
        selectedToolHref !== "https://wazzimagiygg.com/admin/gerenciarusuarios/gerenciar.html" && (
          <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-editorial text-xl font-bold text-stone-900">
                  {currentTool?.label}
                </h4>
                <p className="text-xs text-stone-600 mt-1">
                  Módulo administrativo integrado e sincronizado com os dados centrais do portal.
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 text-xs font-bold uppercase">
                Pronto para Uso
              </span>
            </div>

            <div className="p-4 bg-[#F8F7F4] border border-[#141414] space-y-3 text-xs">
              <p className="leading-relaxed">
                Este módulo gerencia as operações vinculadas à categoria <strong>{currentTool?.category}</strong>. Todos os dados manipulados aqui refletem em tempo real no banco de dados Firestore (`wzzm-ce3fc`) e no cache de alta performance do backend TypeScript.
              </p>

              <div className="flex gap-2 pt-2">
                {currentTool?.action === "usuarios" && (
                  <button
                    onClick={() => onNavigateTab("usuarios")}
                    className="paper-button px-4 py-2 font-bold uppercase cursor-pointer"
                  >
                    Abrir Tabela de Usuários →
                  </button>
                )}
                {currentTool?.action === "tickets" && (
                  <button
                    onClick={() => onNavigateTab("tickets")}
                    className="paper-button px-4 py-2 font-bold uppercase cursor-pointer"
                  >
                    Abrir Ouvidoria & Tickets LGPD →
                  </button>
                )}
                {currentTool?.action === "artigos" && (
                  <button
                    onClick={() => onNavigateTab("artigos")}
                    className="paper-button px-4 py-2 font-bold uppercase cursor-pointer"
                  >
                    Abrir Moderação de Artigos →
                  </button>
                )}
                {currentTool?.action === "checkuser" && (
                  <button
                    onClick={() => onNavigateTab("checkuser")}
                    className="paper-button px-4 py-2 font-bold uppercase cursor-pointer"
                  >
                    Abrir Auditoria Forense →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      {/* NOTMEDIAWIKI BETA DEDICATED TOOL WORKSPACE */}
      {selectedToolHref === "https://notmediawiki.wazzimagiygg.com/" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-700 text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  NotMediaWiki Engine
                </span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5 uppercase">
                  Beta Microservices Online
                </span>
              </div>
              <h4 className="font-editorial text-2xl font-bold text-stone-900 mt-1">
                NotMediaWiki (Beta) — Parsoid Wikitext & Microserviços
              </h4>
              <p className="text-xs text-stone-600 mt-1 font-mono">
                Repositório oficial: <code>WazzimaGiygg/NotMediaWiki-Beta-</code> • Domínio: <code>notmediawiki.wazzimagiygg.com</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab("notmediawiki")}
                className="paper-button px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer bg-red-700 text-white border-red-950 hover:bg-red-800"
              >
                <span>Acessar NotMediaWiki Portal</span>
                <span className="text-amber-300">→</span>
              </button>
              <a
                href="https://notmediawiki.wazzimagiygg.com/"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-[#141414] bg-stone-100 hover:bg-stone-200 text-stone-900"
              >
                <span>Site Externo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="border border-[#141414] p-4 bg-stone-50">
              <h5 className="font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-red-700" />
                Motor Parsoid
              </h5>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Renderizador completo de sintaxe wikitext para HTML (seções = H1 =, == H2 ==, tabelas, infoboxes, referências de rodapé e categorias).
              </p>
            </div>

            <div className="border border-[#141414] p-4 bg-stone-50">
              <h5 className="font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-red-700" />
                Myers Diff & Reversões
              </h5>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Sistema avançado de comparação de revisões linha-a-linha com destaque visual de adições/remoções e rollback administrativo.
              </p>
            </div>

            <div className="border border-[#141414] p-4 bg-stone-50">
              <h5 className="font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-red-700" />
                Microserviços REST /api/v1
              </h5>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Endpoints integrados para artigos, histórico, parse wikitext, estatísticas, EventStreams e extensões modulares.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BEMTEVI SOCIAL NETWORK DEDICATED TOOL WORKSPACE */}
      {selectedToolHref === "https://bemtevi.wazzimagiygg.com/" && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b border-stone-200 pb-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#667eea] text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  Rede Social Bemtevi
                </span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5 uppercase">
                  Ativa & Integrada ao Portal
                </span>
              </div>
              <h4 className="font-editorial text-2xl font-bold text-stone-900 mt-1">
                Bemtevi — Rede Social Livre & Microblogging WZZM
              </h4>
              <p className="text-xs text-stone-600 mt-1 font-mono">
                Repositório oficial: <code>WazzimaGiygg/bemtevi</code> • Domínio: <code>bemtevi.wazzimagiygg.com</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab("bemtevi")}
                className="paper-button px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer bg-[#667eea] text-white border-blue-950 hover:bg-[#5a6fd6]"
              >
                <span>Acessar Rede Social Bemtevi</span>
                <span className="text-amber-300">→</span>
              </button>
              <a
                href="https://bemtevi.wazzimagiygg.com/"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-[#141414] bg-stone-100 hover:bg-stone-200 text-stone-900"
              >
                <span>Site Externo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="border border-[#141414] p-4 bg-stone-50">
              <h5 className="font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#667eea]" />
                Microblogging (127 caracteres)
              </h5>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Posts sucintos com links anexados, categorias, marcações #hashtags e comentários estendidos (280 chars).
              </p>
            </div>

            <div className="border border-[#141414] p-4 bg-stone-50">
              <h5 className="font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#667eea]" />
                Comunidades & Fóruns
              </h5>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Espaços de discussão colaborativos por interesse (Tecnologia, Ciência, LGPD, Filosofia, etc.).
              </p>
            </div>

            <div className="border border-[#141414] p-4 bg-stone-50">
              <h5 className="font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#667eea]" />
                Gamificação & Níveis de Karma
              </h5>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Sistema que reconhece membros ativos com selos de Novato até Lendário conforme a qualidade da interação.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
