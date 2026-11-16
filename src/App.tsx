/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import DOMPurify from "dompurify";
import {
  Newspaper,
  BookOpen,
  Book,
  GraduationCap,
  Globe,
  User,
  Calendar,
  Eye,
  LogOut,
  LogIn,
  Search,
  Bell,
  Scale,
  FileText,
  Monitor,
  AlertCircle,
  CheckCircle,
  X,
  Share2,
  Printer,
  Copy,
  PlusCircle,
  MessageSquare,
  Ticket,
  Send,
  Database,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Info,
  Crown,
  Shield,
  FileDown,
  MessageCircle,
  Flame,
  Award,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles,
  Tag
} from "lucide-react";
import jsPDF from "jspdf";

import {
  auth,
  googleProvider,
  registerUser,
  checkIfUserIsBanned,
  checkIfUserIsAdmin,
  loadCollectionContent,
  createArticle,
  incrementArticleViews,
  setupNotificationsListener,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  registerAuditLog,
  Article,
  UserNotification,
  AUTHORIZED_BUROCRATA_EMAIL,
  isAuthorizedBurocrata,
  AUTHORIZED_PUBLISHER_EMAILS,
  isAuthorizedPublisher,
  listAllUsersFromFirestore,
  AppUser,
  safeApiFetch,
  isBackendApiAvailable,
  getStaticSanctionsFallback,
  db,
  sanitizeFirestoreData
} from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { stripHtmlToPlainText } from "./utils/text";
import AdminPanel from "./components/AdminPanel";
import NotMediaWikiPortal from "./components/notmediawiki/NotMediaWikiPortal";
import BemteviHub from "./components/bemtevi/BemteviHub";
import { useUidNavigation, PortalTabId, parseTabFromUid } from "./hooks/useUidNavigation";
import UidNavigationBar from "./components/UidNavigationBar";
import UserProfileModal from "./components/UserProfileModal";
import LgpdRulesShowcase, { LgpdShowcaseTab } from "./components/LgpdRulesShowcase";
import LgpdFloatingComplianceBadge from "./components/LgpdFloatingComplianceBadge";
import DossieAbusosView from "./components/DossieAbusosView";
import MaintenanceScreen from "./components/MaintenanceScreen";
import ExternalRedirectModal from "./components/ExternalRedirectModal";
import ExtensionConfigModal from "./components/ExtensionConfigModal";
import { WikiExtension, SEED_WIKI_EXTENSIONS } from "./data/notMediaWikiData";
import { exportArticleFormattedPdf } from "./utils/pdfExport";
import HighlightedText from "./components/HighlightedText";
import {
  ALLOWED_ARTICLE_COLLECTIONS,
  validatePortalArticlePayload,
  ArticleValidationError
} from "./utils/articleSchema";
import { useTheme } from "./hooks/useTheme";
import AiEthicsShowcase from "./components/AiEthicsShowcase";
import { FooterBadges } from "./wiki/components/FooterBadges";
import LgpdCookieBanner from "./components/LgpdCookieBanner";
import {
  LgpdCookieConsent,
  ConsentDecisionMethod,
  getStoredCookieConsent,
  saveLgpdCookieConsent,
  revokeAllNonEssentialCookies,
  enforceCookiePreferences,
  subscribeCookieConsent,
} from "./utils/cookieConsent";
import {
  PrivacyComplianceSettings,
  MARCO_CIVIL_LOG_RETENTION_DAYS,
  getPrivacySettings,
  subscribePrivacySettings,
  isBrowserDoNotTrackActive,
  formatPublicAuthorIdentifier,
  purgeOptionalLocalSessionData,
} from "./utils/privacySettings";
import { updatePortalSEO } from "./wiki/utils/seoManager";
import AbntCitationGenerator from "./components/AbntCitationGenerator";
import WikiSiteVersionModal from "./components/WikiSiteVersionModal";
import { WIKI_SITE_VERSION, WIKI_SITE_DISPLAY_ID } from "./config/wikiVersion";

export default function App() {
  // Persistent Theme State (Light / Dark)
  const { theme, isDark, toggleTheme } = useTheme();

  // Authentication & Role States
  const [user, setUser] = useState<any | null>(null);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [banReason] = useState("Violação dos Termos ou Conta sob Moderação");
  const [isLgpdModalOpen, setIsLgpdModalOpen] = useState(false);
  const [lgpdModalInitialTab, setLgpdModalInitialTab] = useState<LgpdShowcaseTab>("principios");
  const [isAiEthicsModalOpen, setIsAiEthicsModalOpen] = useState(false);
  const [loginLgpdConsentAccepted, setLoginLgpdConsentAccepted] = useState(false);

  // Navigation & Content States (initialized from URL ?uid= if present)
  const [currentTab, setCurrentTab] = useState<PortalTabId>(() => {
    if (typeof window !== "undefined") {
      const urlUid = new URLSearchParams(window.location.search).get("uid");
      const parsed = parseTabFromUid(urlUid);
      if (parsed) return parsed;
    }
    return "wikiworldweb";
  });

  const [articles, setArticles] = useState<{ [key: string]: Article[] }>({
    wikiworldweb: [],
    materiadeensaio: [],
    academico: [],
    materia: [],
    uwgbooks: []
  });

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [sharedArticleForBemtevi, setSharedArticleForBemtevi] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("todos");

  // Google Search Grounding (gemini-4-hydrogen) State
  const [webGroundingResult, setWebGroundingResult] = useState<{
    query: string;
    answer: string;
    groundingChunks: Array<{ web?: { uri?: string; title?: string } }>;
    webSearchQueries: string[];
    model?: string;
  } | null>(null);
  const [isWebGroundingLoading, setIsWebGroundingLoading] = useState(false);
  const [webGroundingError, setWebGroundingError] = useState<string | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // Modals & Drawers
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [articleFormErrors, setArticleFormErrors] = useState<Record<string, string>>({});
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Chat / Messages State (Compatible with jsonbin-api.js)
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Support & Compliance Tickets State
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [ticketForm, setTicketForm] = useState({
    nome: "",
    email: "",
    tipo: "Direito de Esquecimento (LGPD)",
    mensagem: ""
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Sanctions List (cidades_sancionadas.json)
  const [sanctionsList, setSanctionsList] = useState<any[]>([]);

  // Cookie Consent & Privacy-by-Default State (LGPD / ANPD / Marco Civil)
  const [cookieConsent, setCookieConsent] = useState<LgpdCookieConsent | null>(() => getStoredCookieConsent());
  const [isCookiePreferencesOpen, setIsCookiePreferencesOpen] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacyComplianceSettings>(() => getPrivacySettings());

  useEffect(() => {
    const currentSettings = getPrivacySettings();
    const dntOn = currentSettings.respectBrowserDnt && isBrowserDoNotTrackActive();
    const storedConsent = getStoredCookieConsent();
    if (dntOn && storedConsent && (storedConsent.functional || storedConsent.analytics || storedConsent.thirdParty)) {
      const revoked = revokeAllNonEssentialCookies();
      setCookieConsent(revoked);
    } else {
      enforceCookiePreferences(storedConsent);
    }
    const unsubCookies = subscribeCookieConsent((updated) => {
      setCookieConsent(updated);
    });
    const unsubPrivacy = subscribePrivacySettings((updated) => {
      setPrivacySettings(updated);
    });
    return () => {
      unsubCookies();
      unsubPrivacy();
    };
  }, []);

  // Diagnostics Data
  const [apiHealth, setApiHealth] = useState<any>(null);

  // Extensions State & Behavioral Effects (3.05, 3.05.3.a, 3.05.3.b, 3.05.3.c, 3.05.3.e)
  const [extensionsList, setExtensionsList] = useState<WikiExtension[]>([]);
  const [externalRedirectTarget, setExternalRedirectTarget] = useState<string | null>(null);
  const [editingExtensionConfig, setEditingExtensionConfig] = useState<WikiExtension | null>(null);

  const fetchExtensions = async () => {
    try {
      const res = await safeApiFetch("/api/v1/extensions");
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data.extensions)) {
          setExtensionsList(data.extensions);
          return;
        }
      }
    } catch {
      //
    }

    // Fallback to bundled extension definitions + localStorage config overrides
    try {
      const overridesRaw = localStorage.getItem("wzzm_extensions_config_overrides");
      const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
      setExtensionsList(
        SEED_WIKI_EXTENSIONS.map((ext) =>
          overrides[ext.id]
            ? { ...ext, config: { ...(ext.config || {}), ...overrides[ext.id] } }
            : ext
        )
      );
    } catch {
      setExtensionsList(SEED_WIKI_EXTENSIONS);
    }
  };

  const supportExtension = useMemo(() => {
    return extensionsList.find((e) => e.id === "ext-support-tickets");
  }, [extensionsList]);

  const supportConfig = useMemo(() => {
    return supportExtension?.config || {
      supportUrl: "https://support.wazzimagiygg.com/",
      openMode: "redirect",
      buttonLabel: "Suporte & Tickets WZZM",
      openInNewTab: true
    };
  }, [supportExtension]);

  const redirectorExtension = useMemo(() => {
    return extensionsList.find((e) => e.id === "ext-external-redirector");
  }, [extensionsList]);

  const redirectorConfig = useMemo(() => {
    return redirectorExtension?.config || {
      enabled: true,
      redirectBaseUrl: "https://wazzimagiygg.com/rv/?uid=",
      appendUid: true,
      showNoticeModal: true,
      whitelistDomains: [
        "wazzimagiygg.com",
        "notmediawiki.wazzimagiygg.com",
        "bemtevi.wazzimagiygg.com",
        "support.wazzimagiygg.com"
      ]
    };
  }, [redirectorExtension]);

  const maintenanceExtension = useMemo(() => {
    return extensionsList.find((e) => e.id === "ext-maintenance-mode");
  }, [extensionsList]);

  const isMaintenanceActive = useMemo(() => {
    return Boolean(maintenanceExtension?.config?.isMaintenanceActive);
  }, [maintenanceExtension]);

  const isBurocrataUser = useMemo(() => {
    return user?.email?.toLowerCase() === "pedrohenriquecardonaperes@gmail.com";
  }, [user]);

  const isAuthorizedPublisherUser = useMemo(() => {
    return isAuthorizedPublisher(user?.email);
  }, [user]);

  // 3.05.6.d - Inserir o uso do retornar e avançar para navegar pelo UID presente no URL do site
  const uidNav = useUidNavigation();
  const [allUsersList, setAllUsersList] = useState<AppUser[]>([]);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);

  // Unified tab switcher that keeps currentTab, address bar ?uid= and history stack in sync
  const switchTab = useCallback((tabId: PortalTabId, bypassRedirect = false) => {
    if (tabId === "tickets" && !bypassRedirect) {
      const url = supportConfig.supportUrl || "https://support.wazzimagiygg.com/";
      if (supportConfig.openMode === "redirect") {
        window.open(url, supportConfig.openInNewTab !== false ? "_blank" : "_self");
        showToast(`Redirecionando para Central de Suporte & Tickets: ${url}`);
        return;
      }
    }

    setCurrentTab(tabId);
    setSelectedArticle(null);
    setSelectedSector("todos");
    setIsUserProfileModalOpen(false);

    // Push tab UID to URL and browser history
    uidNav.navigateToUid(tabId);
  }, [supportConfig, uidNav]);

  const handleTicketsTabClick = () => {
    const url = supportConfig.supportUrl || "https://support.wazzimagiygg.com/";
    if (supportConfig.openMode === "redirect") {
      window.open(url, supportConfig.openInNewTab !== false ? "_blank" : "_self");
      showToast(`Redirecionando para Central de Suporte & Tickets: ${url}`);
    } else {
      switchTab("tickets", true);
    }
  };

  const handleQuickToggleMaintenance = async (active: boolean) => {
    if (!isBurocrataUser) {
      showToast("Apenas o Burocrata oficial tem permissão.", true);
      return;
    }
    try {
      const res = await safeApiFetch("/api/v1/extensions/ext-maintenance-mode/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { isMaintenanceActive: active },
          userEmail: user?.email
        })
      });
      if (res) {
        const data = await res.json();
        if (!data.success) {
          showToast(data.error || "Erro ao alterar modo de manutenção.", true);
          return;
        }
      } else {
        const overridesRaw = localStorage.getItem("wzzm_extensions_config_overrides");
        const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
        overrides["ext-maintenance-mode"] = { ...(overrides["ext-maintenance-mode"] || {}), isMaintenanceActive: active };
        localStorage.setItem("wzzm_extensions_config_overrides", JSON.stringify(overrides));
      }
      setExtensionsList((prev) =>
        prev.map((e) =>
          e.id === "ext-maintenance-mode"
            ? { ...e, config: { ...(e.config || {}), isMaintenanceActive: active } }
            : e
        )
      );
      showToast(active ? "Modo de Manutenção ativado!" : "Modo de Manutenção desativado.");
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleExternalLinkClick = (url: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    const isWhitelisted = (redirectorConfig.whitelistDomains || []).some((dom: string) => url.includes(dom));
    if (isWhitelisted) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    if (privacySettings.confirmExternalLinks || (redirectorConfig.enabled && redirectorConfig.showNoticeModal !== false)) {
      setExternalRedirectTarget(url);
    } else if (!redirectorConfig.enabled) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      const base = redirectorConfig.redirectBaseUrl || "https://wazzimagiygg.com/rv/?uid=";
      const activeUid = uidNav.currentUid || user?.uid || "usr_pedro_cardona_official";
      const outbound = redirectorConfig.appendUid !== false
        ? `${base}${encodeURIComponent(activeUid)}&dest=${encodeURIComponent(url)}`
        : `${base}&dest=${encodeURIComponent(url)}`;
      window.open(outbound, "_blank", "noopener,noreferrer");
    }
  };

  // Synchronize initial URL with default tab UID on first mount if ?uid= is absent
  useEffect(() => {
    if (!uidNav.currentUid) {
      uidNav.replaceUid(currentTab || "wikiworldweb");
    }
  }, [uidNav, currentTab]);

  // Synchronize view state when currentUid in URL changes (triggered by native browser Back / Forward buttons and internal navigation)
  useEffect(() => {
    if (!uidNav.currentUid) {
      setCurrentTab("wikiworldweb");
      setSelectedArticle(null);
      setIsUserProfileModalOpen(false);
      return;
    }

    const rawUid = uidNav.currentUid;
    const tabMatch = parseTabFromUid(rawUid);

    if (tabMatch) {
      // It is a Tab page UID!
      setCurrentTab(tabMatch);
      setSelectedArticle(null);
      setIsUserProfileModalOpen(false);
      return;
    }

    // Check if it's an article ID
    let foundArticle: Article | null = null;
    for (const list of Object.values(articles)) {
      const art = list.find((a) => a.id === rawUid);
      if (art) {
        foundArticle = art;
        break;
      }
    }

    if (foundArticle) {
      setSelectedArticle(foundArticle);
      if (foundArticle.colecao && parseTabFromUid(foundArticle.colecao)) {
        setCurrentTab(foundArticle.colecao as PortalTabId);
      }
      setIsUserProfileModalOpen(false);
      return;
    }

    // Otherwise it is a user profile UID (e.g. usr_* or convid_*)
    if (currentTab !== "bemtevi") {
      setIsUserProfileModalOpen(true);
    }
  }, [uidNav.currentUid, articles, currentTab]);

  // Dynamic Canonical, Meta Tags, OpenGraph & Schema.org SEO Sync for core.wazzimagiygg.com
  useEffect(() => {
    updatePortalSEO({
      tab: currentTab,
      article: selectedArticle,
      searchQuery: searchTerm
    });
  }, [currentTab, selectedArticle, searchTerm]);

  const handleRunWebGrounding = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchTerm).trim();
    if (!q) {
      setWebGroundingError("Digite um termo para pesquisar na Web via Google Search.");
      return;
    }
    setIsWebGroundingLoading(true);
    setWebGroundingError(null);
    try {
      const res = await safeApiFetch("/api/gemini/search-grounding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, contextTab: currentTab })
      });
      if (!res) {
        setWebGroundingError("Pesquisa Web via servidor Express indisponível em modo offline/estático.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setWebGroundingError(data?.error || `Erro ao consultar Google Search Grounding (HTTP ${res.status}).`);
        return;
      }
      setWebGroundingResult({
        query: data.query || q,
        answer: data.answer || "",
        groundingChunks: Array.isArray(data.groundingChunks) ? data.groundingChunks : [],
        webSearchQueries: Array.isArray(data.webSearchQueries) ? data.webSearchQueries : [],
        model: data.model || "gemini-4-hydrogen"
      });
    } catch (err: any) {
      setWebGroundingError(err?.message || "Falha ao executar busca com Google Search.");
    } finally {
      setIsWebGroundingLoading(false);
    }
  };

  // Load all registered users from database for UID navigation switcher
  useEffect(() => {
    listAllUsersFromFirestore().then((users) => {
      if (users && users.length > 0) {
        setAllUsersList(users);
      }
    });
  }, []);

  // Keyboard navigation shortcuts for 3.05.6.d (Alt + ArrowLeft: Retornar, Alt + ArrowRight: Avançar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is typing inside an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.altKey && e.key === "ArrowLeft" && uidNav.canGoBack) {
        e.preventDefault();
        uidNav.navigateBack();
        showToast("Navegando: Retornar ao UID anterior no histórico");
      } else if (e.altKey && e.key === "ArrowRight" && uidNav.canGoForward) {
        e.preventDefault();
        uidNav.navigateForward();
        showToast("Navegando: Avançar ao próximo UID no histórico");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [uidNav.canGoBack, uidNav.canGoForward, uidNav.navigateBack, uidNav.navigateForward]);

  // Formatted Current Date for the Newspaper Header
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }, []);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ============================================
  // GUEST & USER AUTHENTICATION
  // ============================================
  const generateGuestUID = () => "convid_" + Math.random().toString(36).substring(2, 12);

  const handleCreateGuestUser = () => {
    if (!loginLgpdConsentAccepted) {
      showToast("Confirme o aceite da LGPD e do Marco Civil antes de iniciar sessão.", true);
      return;
    }
    const guestUID = generateGuestUID();
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    const guestData = {
      uid: guestUID,
      displayName: "Leitor Convidado (24h)",
      email: `${guestUID}@guest.local`,
      isGuest: true,
      lgpdConsentAt: new Date().toISOString(),
    };
    localStorage.setItem("wzzm_guest_user", JSON.stringify(guestData));
    localStorage.setItem("wzzm_guest_expiry", expiry.toString());
    setUser(guestData);
    setIsGuestUser(true);
    setIsLoginModalOpen(false);
    setLoginLgpdConsentAccepted(false);
    registerAuditLog(guestUID, "guest_login");
    showToast("Acesso concedido como leitor convidado (válido por 24 horas).");
  };

  const getStoredGuestUser = () => {
    const expiry = localStorage.getItem("wzzm_guest_expiry");
    if (expiry && Date.now() < parseInt(expiry, 10)) {
      const stored = localStorage.getItem("wzzm_guest_user");
      if (stored) return JSON.parse(stored);
    }
    return null;
  };

  const clearGuestUser = () => {
    localStorage.removeItem("wzzm_guest_user");
    localStorage.removeItem("wzzm_guest_expiry");
  };

  const handleGoogleLogin = async () => {
    if (isLoginModalOpen && !loginLgpdConsentAccepted) {
      showToast("Confirme o aceite da LGPD e do Marco Civil antes de autenticar.", true);
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      clearGuestUser();
      setIsGuestUser(false);
      setIsLoginModalOpen(false);
      setLoginLgpdConsentAccepted(false);
      showToast(`Bem-vindo(a), ${result.user.displayName || "Leitor"}!`);
      registerAuditLog(
        result.user.uid,
        "google_login",
        privacySettings.minimalDataCollectionMode
          ? { consentBasis: "LGPD Art. 7, I" }
          : { email: result.user.email, consentBasis: "LGPD Art. 7, I" }
      );
    } catch (error: any) {
      console.error("Login error:", error);
      showToast(error.message || "Erro na autenticação com Google.", true);
    }
  };

  const handleLogout = async () => {
    if (isGuestUser) {
      clearGuestUser();
      setUser(null);
      setIsGuestUser(false);
      setIsAdmin(false);
      if (privacySettings.autoPurgeLocalCacheOnLogout) {
        purgeOptionalLocalSessionData();
      }
      showToast("Sessão de convidado encerrada e caches locais limpos.");
    } else {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      if (privacySettings.autoPurgeLocalCacheOnLogout) {
        purgeOptionalLocalSessionData();
      }
      showToast(
        privacySettings.autoPurgeLocalCacheOnLogout
          ? "Desconectado com limpeza automática de caches locais (LGPD Art. 16)."
          : "Desconectado com sucesso."
      );
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsGuestUser(false);
        clearGuestUser();

        // Register profile into Firestore 'users' & 'usuários'
        await registerUser(currentUser, false);

        // Check ban & admin roles (strictly checks AUTHORIZED_BUROCRATA_EMAIL)
        const banned = await checkIfUserIsBanned(currentUser.uid);
        setIsBanned(banned);
        const admin = await checkIfUserIsAdmin(currentUser.uid, currentUser.email);
        setIsAdmin(admin);
      } else {
        const storedGuest = getStoredGuestUser();
        if (storedGuest) {
          setUser(storedGuest);
          setIsGuestUser(true);
        } else {
          setUser(null);
          setIsGuestUser(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Notifications Listener
  useEffect(() => {
    const currentUid = user?.uid || "all";
    const unsubscribeNotif = setupNotificationsListener(currentUid, (incomingNotifs) => {
      setNotifications(incomingNotifs);
    });

    return () => {
      if (typeof unsubscribeNotif === "function") unsubscribeNotif();
    };
  }, [user]);

  // Initial Data Fetching from Firestore & Optimized Backend API
  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      try {
        const [www, ensaio, acad, mat, books] = await Promise.all([
          loadCollectionContent("wikiworldweb"),
          loadCollectionContent("materiadeensaio"),
          loadCollectionContent("academico"),
          loadCollectionContent("materia"),
          loadCollectionContent("uwgbooks")
        ]);

        setArticles({
          wikiworldweb: www,
          materiadeensaio: ensaio,
          academico: acad,
          materia: mat,
          uwgbooks: books
        });

        // Single probe to check whether Express backend API is mounted
        const backendOk = await isBackendApiAvailable();

        if (backendOk) {
          // Load chat messages
          try {
            const res = await fetch("/api/jsonbin/messages");
            if (res.ok) {
              const data = await res.json();
              setChatMessages(data.record || []);
            }
          } catch {
            // ignore
          }

          // Load tickets
          try {
            const res = await fetch("/api/tickets");
            if (res.ok) {
              const data = await res.json();
              setTicketsList(data);
            }
          } catch {
            // ignore
          }

          // Load sanctions
          try {
            const res = await fetch("/api/sanctions");
            if (res.ok) {
              const data = await res.json();
              setSanctionsList(data.cidades_sancionadas || []);
            }
          } catch {
            setSanctionsList(getStaticSanctionsFallback());
          }

          // Health check
          try {
            const res = await fetch("/api/health");
            if (res.ok) {
              const data = await res.json();
              setApiHealth(data);
            }
          } catch {
            // ignore
          }
        } else {
          // Static / Firestore-only hosting fallbacks (zero 404 noise)
          try {
            const storedMsgs = localStorage.getItem("wzzm_chat_messages");
            setChatMessages(
              storedMsgs
                ? JSON.parse(storedMsgs)
                : [
                    {
                      id: "msg_welcome",
                      senderId: "sistema",
                      senderName: "WazzimaGiygg Central",
                      text: "Bem-vindo ao canal oficial de comunicação e suporte do ecossistema WazzimaGiygg.",
                      timestamp: new Date().toISOString()
                    }
                  ]
            );
          } catch {
            //
          }

          try {
            const storedTickets = localStorage.getItem("wzzm_tickets");
            setTicketsList(
              storedTickets
                ? JSON.parse(storedTickets)
                : [
                    {
                      id: "tkt-001",
                      nome: "Leitor Anônimo",
                      email: "contato@wazzimagiygg.com",
                      tipo: "Dúvida Geral",
                      mensagem: "Sistema de consulta bibliográfica e artigos acadêmicos operando via Firestore.",
                      status: "Resolvido",
                      criadoEm: new Date().toISOString()
                    }
                  ]
            );
          } catch {
            //
          }

          setSanctionsList(getStaticSanctionsFallback());
          setApiHealth({
            status: "ok",
            app: "WazzimaGiygg",
            version: "2.0.0-ts",
            mode: "firestore-static",
            database: {
              provider: "Firebase Firestore",
              projectId: "wzzm-ce3fc",
              status: "active"
            }
          });
        }

        // Load extensions for 3.05 governance
        await fetchExtensions();
      } catch (err) {
        console.error("Error loading initial catalog:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, []);

  // Filtered Articles based on tab, search, and sector
  const currentTabArticles = useMemo(() => {
    const tabKey = (currentTab in articles ? currentTab : "wikiworldweb") as keyof typeof articles;
    let list = articles[tabKey] || [];

    if (selectedSector !== "todos") {
      list = list.filter((a) => a.setor === selectedSector);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.titulo.toLowerCase().includes(q) ||
          stripHtmlToPlainText(a.descricao).toLowerCase().includes(q) ||
          a.setor.toLowerCase().includes(q)
      );
    }

    return list;
  }, [articles, currentTab, searchTerm, selectedSector]);

  // Unique sectors in the current view
  const availableSectors = useMemo(() => {
    const tabKey = (currentTab in articles ? currentTab : "wikiworldweb") as keyof typeof articles;
    const list = articles[tabKey] || [];
    const sectors = new Set<string>();
    list.forEach((item) => {
      if (item.setor) sectors.add(item.setor);
    });
    return Array.from(sectors);
  }, [articles, currentTab]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.lida).length;
  }, [notifications]);

  // Open Article Reader and increment view counter
  const handleOpenArticle = (article: Article) => {
    setSelectedArticle(article);
    incrementArticleViews(article.colecao || "wikiworldweb", article.id);

    // Update local counter
    setArticles((prev) => {
      const col = article.colecao || "wikiworldweb";
      const updatedList = (prev[col] || []).map((item) =>
        item.id === article.id ? { ...item, visualizacoes: (item.visualizacoes || 0) + 1 } : item
      );
      return { ...prev, [col]: updatedList };
    });

    // Synchronize article UID with URL history
    uidNav.navigateToUid(article.id);
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    uidNav.navigateToUid(currentTab);
  };

  // Helper to build canonical article UID URL (?uid=...)
  const getArticleUidUrl = (article: Article | { id: string }) => {
    const origin = typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://core.wazzimagiygg.com";
    return `${origin}/?uid=${encodeURIComponent(article.id)}`;
  };

  // Save Article as Formatted PDF (Preserving Original Document Styles & Structure)
  const handleSaveArticleAsPdf = async (article: Article) => {
    try {
      setIsGeneratingPdf(true);
      showToast("Renderizando documento original com formatação em PDF...");
      await exportArticleFormattedPdf(article, {
        onProgress: (statusMsg) => showToast(statusMsg)
      });
      showToast(`✓ Documento original formatado "${article.titulo}" exportado em PDF com sucesso!`);
    } catch (err: any) {
      console.error("Erro ao gerar PDF formatado:", err);
      showToast("Erro ao gerar o arquivo PDF formatado: " + (err.message || ""), true);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Send Chat Message (JSONBin + State)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: user?.uid || "guest",
      senderName: user?.displayName || (isGuestUser ? "Convidado" : "Anônimo"),
      text: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    setChatInput("");
    try {
      localStorage.setItem("wzzm_chat_messages", JSON.stringify(updated));
    } catch {
      //
    }

    try {
      await safeApiFetch("/api/jsonbin/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      showToast("Mensagem enviada.");
    } catch {
      showToast("Mensagem salva localmente.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Submit Support / Compliance Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.email || !ticketForm.mensagem) {
      showToast("Por favor preencha e-mail e mensagem.", true);
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const res = await safeApiFetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm)
      });
      if (res && res.ok) {
        const data = await res.json();
        setTicketsList((prev) => [data.ticket, ...prev]);
        setTicketForm({
          nome: "",
          email: "",
          tipo: "Direito de Esquecimento (LGPD)",
          mensagem: ""
        });
        showToast("Solicitação protocolada com sucesso!");
        return;
      }

      // Firestore + localStorage fallback when Express backend is unavailable
      const fallbackTicket = {
        id: `tkt-${Date.now().toString().slice(-6)}`,
        nome: ticketForm.nome || "Anônimo",
        email: ticketForm.email,
        tipo: ticketForm.tipo || "Geral",
        mensagem: ticketForm.mensagem,
        status: "Aberto",
        criadoEm: new Date().toISOString()
      };
      await addDoc(
        collection(db, "tickets"),
        sanitizeFirestoreData({
          ...fallbackTicket,
          createdAt: serverTimestamp()
        })
      ).catch(() => {});

      setTicketsList((prev) => {
        const next = [fallbackTicket, ...prev];
        try {
          localStorage.setItem("wzzm_tickets", JSON.stringify(next));
        } catch {
          //
        }
        return next;
      });
      setTicketForm({
        nome: "",
        email: "",
        tipo: "Direito de Esquecimento (LGPD)",
        mensagem: ""
      });
      showToast("Solicitação protocolada com sucesso!");
    } catch {
      showToast("Erro ao registrar chamado.", true);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Save & Revoke Cookie Consent (LGPD Art. 7º, I & Art. 8º, § 5º)
  const handleSaveCookiePreferences = (
    prefs: { functional: boolean; analytics: boolean; thirdParty: boolean },
    method: ConsentDecisionMethod
  ) => {
    const saved = saveLgpdCookieConsent(prefs, method);
    setCookieConsent(saved);
    if (user?.uid) {
      registerAuditLog(user.uid, "lgpd_cookie_consent_updated", {
        protocolId: saved.protocolId,
        decisionMethod: saved.decisionMethod,
        functional: saved.functional,
        analytics: saved.analytics,
        thirdParty: saved.thirdParty,
        version: saved.version,
      }).catch(() => {});
    }
    showToast(
      method === "reject_non_essential"
        ? "Cookies não essenciais recusados. Somente os essenciais permanecem ativos."
        : "Preferências de cookies (LGPD) registradas com sucesso."
    );
  };

  const handleRevokeCookiePreferences = () => {
    const revoked = revokeAllNonEssentialCookies();
    setCookieConsent(revoked);
    if (user?.uid) {
      registerAuditLog(user.uid, "lgpd_cookie_consent_revoked", {
        protocolId: revoked.protocolId,
        version: revoked.version,
      }).catch(() => {});
    }
    showToast("Consentimento de cookies não essenciais revogado conforme Art. 18, IX da LGPD.");
  };

  // 3.05.3.e: Modo de Manutenção (Bloqueio completo para visitantes e usuários comuns)
  if (isMaintenanceActive && !isBurocrataUser && !isLoading) {
    return (
      <MaintenanceScreen
        message={maintenanceExtension?.config?.maintenanceMessage}
        estimatedReturn={maintenanceExtension?.config?.estimatedReturn}
        onLoginWithGoogle={handleGoogleLogin}
        currentUser={user}
        onRefresh={fetchExtensions}
        supportUrl={supportConfig.supportUrl}
      />
    );
  }

  return (
    <div
      data-theme={theme}
      className={`${
        isDark ? "dark theme-dark" : "theme-light"
      } min-h-screen wzzm-theme-canvas bg-[#F8F7F4] dark:bg-[#111110] text-[#141414] dark:text-[#F5F4F0] flex flex-col font-sans selection:bg-[#141414] selection:text-white dark:selection:bg-amber-400 dark:selection:text-stone-950 transition-colors duration-150`}
    >
      {/* 3.05.3.e: Top Banner de Manutenção Exclusivo para o Burocrata */}
      {isMaintenanceActive && isBurocrataUser && (
        <div className="bg-rose-700 text-white px-4 py-2.5 text-xs font-mono font-bold flex flex-col sm:flex-row items-center justify-between gap-2 border-b-2 border-rose-950 shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
            <span>
              ⚠️ MODO DE MANUTENÇÃO ATIVO — Apenas o Burocrata ({user?.email}) possui acesso irrestrito às configurações do site.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleQuickToggleMaintenance(false)}
              className="px-2.5 py-1 bg-white text-rose-900 hover:bg-stone-100 font-mono font-bold text-[11px] uppercase border border-rose-950 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Desativar Manutenção
            </button>
            <button
              onClick={() => setEditingExtensionConfig(maintenanceExtension || null)}
              className="px-2.5 py-1 bg-rose-900 text-white hover:bg-rose-800 font-mono font-bold text-[11px] uppercase border border-white cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Configurar Extensão
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* 1. TOP TICKER & COMPLIANCE BAR */}
      {/* ============================================ */}
      <header className="bg-[#141414] text-[#E5E5E5] text-[11px] font-mono border-b border-[#262626] py-1.5 px-4 tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img src="/favicom.png" alt="Emblema WZZM" className="w-4 h-4 object-contain shrink-0" />
            <span className="bg-[#D97706] text-black font-bold px-1.5 py-0.5 text-[9px] uppercase tracking-widest">
              DIÁRIO OFICIAL
            </span>
            <span className="capitalize">{formattedDate}</span>
            <span className="hidden md:inline text-stone-500">•</span>
            <span className="hidden md:inline text-stone-400">
              Edição nº 2.418 • Brasília / São Paulo / Rede Global
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            {/* Persistent Theme Switcher (Claro / Escuro) */}
            <button
              type="button"
              onClick={() => {
                const nextLabel = isDark ? "Claro" : "Escuro";
                toggleTheme();
                showToast(`Tema ${nextLabel} ativado.`);
              }}
              aria-pressed={isDark}
              aria-label={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
              title={
                isDark
                  ? "Tema escuro ativo (salvo localmente). Clique para alternar para tema claro."
                  : "Tema claro ativo (salvo localmente). Clique para alternar para tema escuro."
              }
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap shrink-0 rounded border transition-colors cursor-pointer bg-stone-800 hover:bg-stone-700 text-amber-200 border-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-sky-300 shrink-0" aria-hidden="true" />
              )}
              <span>{isDark ? "Tema Claro" : "Tema Escuro"}</span>
            </button>

            <span className="text-stone-700 hidden sm:inline">|</span>

            {/* REGRAS LGPD & MARCO CIVIL À AMOSTRA */}
            <button
              onClick={() => {
                setLgpdModalInitialTab("principios");
                setIsLgpdModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500 px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap shrink-0"
              title="Este site segue as normas da LGPD (Lei 13.709/18) e do Marco Civil da Internet brasileiro (Lei 12.965/14)"
            >
              <Scale className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>LGPD &amp; MARCO CIVIL</span>
              <span className="bg-emerald-500 text-black text-[8px] font-black px-1 py-0.2 uppercase">
                À AMOSTRA
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            <span className="text-stone-700">|</span>

            <button
              onClick={() => setIsVersionModalOpen(true)}
              className="flex items-center gap-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/70 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title={`Identificação de versão do sistema: ${WIKI_SITE_DISPLAY_ID} (Special:Version)`}
            >
              <Tag className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{WIKI_SITE_DISPLAY_ID}</span>
            </button>

            <span className="text-stone-700">|</span>

            <button
              onClick={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
              className="flex items-center gap-1.5 hover:text-white text-stone-400 transition-colors cursor-pointer text-[10px] whitespace-nowrap shrink-0"
              title="Ver status da API e banco de dados"
            >
              <Database className="w-3 h-3 text-emerald-400" />
              <span>API TS: 2.0.0</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            <span className="text-stone-700">|</span>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="relative p-1 hover:text-white text-stone-300 transition-colors flex items-center cursor-pointer"
                title="Notificações"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-black">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1A1A18] text-[#141414] dark:text-[#F5F4F0] border-2 border-[#141414] dark:border-[#3E3D38] shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] z-50 p-4">
                  <div className="flex items-center justify-between border-b dark:border-[#2E2D28] pb-2 mb-3">
                    <span className="font-bold text-xs uppercase tracking-wider font-mono">
                      Notificações ({notifications.length})
                    </span>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsAsRead(notifications)}
                        className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline font-mono"
                      >
                        Marcar lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-stone-500 dark:text-stone-400 py-3 text-center">Nenhuma notificação.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-2.5 border text-xs cursor-pointer transition-colors ${
                            n.lida
                              ? "bg-stone-50 dark:bg-[#242320] border-stone-200 dark:border-[#34332F]"
                              : "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 font-medium"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 mb-1">
                            <span className="font-bold uppercase tracking-wider">{n.titulo}</span>
                            <span>{n.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-stone-800 dark:text-stone-200 leading-snug">{n.mensagem}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-stone-700">|</span>

            {/* Burocrata / Admin Access Button */}
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className={`flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                isAdmin
                  ? "bg-red-700 text-white border-red-500 hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-stone-800 text-amber-300 border-stone-700 hover:bg-stone-700"
              }`}
              title="Acesso exclusivo da administração (burocrata)"
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>{isAdmin ? "PAINEL BUROCRATA" : "ACESSO BUROCRATA"}</span>
            </button>

            <span className="text-stone-700">|</span>

            {/* Auth Indicator */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-stone-300 font-bold max-w-[130px] truncate text-[10px]">
                  {user.displayName || user.email || "Leitor"}
                </span>
                {isAdmin && (
                  <span className="bg-red-700 text-white text-[9px] px-1 py-0.2 font-bold uppercase">
                    ADMIN
                  </span>
                )}
                {isGuestUser && (
                  <span className="bg-stone-700 text-stone-200 text-[9px] px-1 py-0.2 uppercase">
                    24h
                  </span>
                )}
                <button
                  onClick={() => switchTab("bemtevi")}
                  className="bg-[#667eea]/20 text-indigo-300 border border-[#667eea]/40 hover:bg-[#667eea]/40 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1 cursor-pointer"
                  title="Abrir perfil social no Bemtevi"
                >
                  <Award className="w-2.5 h-2.5 text-amber-400" />
                  <span>Bemtevi</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="hover:text-red-400 text-stone-400 transition-colors cursor-pointer ml-1"
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#EBEAE8] hover:bg-white text-black font-bold px-2 py-0.5 text-[10px] transition-colors cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>ENTRAR</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* 1.1. UID URL NAVIGATION CONTROLS (3.05.6.d) */}
      {/* ============================================ */}
      <UidNavigationBar
        nav={uidNav}
        availableUsers={allUsersList}
        onOpenUserProfile={(uid) => {
          setIsUserProfileModalOpen(true);
        }}
        showToast={showToast}
      />

      {/* ============================================ */}
      {/* 2. MAIN NEWSPAPER MASTHEAD */}
      {/* ============================================ */}
      <section className="bg-[#F8F7F4] dark:bg-[#151513] border-b-4 border-[#141414] dark:border-[#3E3D38] pt-8 pb-5 px-4 transition-colors">
        <div className="max-w-7xl mx-auto text-center">
          {/* Top Vintage Ornaments */}
          <div className="flex items-center justify-center gap-4 text-xs font-mono uppercase tracking-widest text-stone-600 dark:text-stone-400 mb-2">
            <span>Volume VII</span>
            <span>•</span>
            <span>Liberdade de Expressão & Conhecimento Aberto</span>
            <span>•</span>
            <span>Edição Web & TypeScript</span>
          </div>

          <div className="border-t border-b border-[#141414] dark:border-[#3E3D38] py-1 my-2">
            <div className="border-t border-b border-[#141414] dark:border-[#3E3D38] py-3">
              <div className="flex items-center justify-center mb-2">
                <img
                  src="/favicom.png"
                  alt="WazzimaGiygg Emblem"
                  className="w-12 h-12 object-contain drop-shadow-sm"
                />
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-editorial tracking-tight uppercase leading-none text-[#141414] dark:text-[#F5F4F0]">
                WAZZIMA<span className="text-[#B91C1C] dark:text-red-400">GIYGG</span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm font-mono uppercase tracking-[0.25em] text-stone-800 dark:text-stone-300 font-bold">
                Jornal, Acervo Acadêmico & Enciclopédia Colaborativa WZZM
              </p>
            </div>
          </div>

          {/* Subheader bar with quick metrics */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-stone-700 dark:text-stone-300 pt-2 border-t border-stone-300 dark:border-[#2E2D28]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-[#141414] dark:text-amber-300">
                CANÔNICO OFICIAL: core.wazzimagiygg.com
              </span>
              <span className="hidden sm:inline">•</span>
              <button
                type="button"
                onClick={() => setIsVersionModalOpen(true)}
                className="font-bold text-[#B91C1C] dark:text-amber-400 hover:underline cursor-pointer uppercase"
                title="Abrir ficha de versão oficial (Special:Version)"
              >
                {WIKI_SITE_DISPLAY_ID}
              </button>
              <span className="hidden sm:inline">•</span>
              <span>LGPD (LEI Nº 13.709/18) &amp; MARCO CIVIL (LEI Nº 12.965/14)</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">BASE FIRESTORE ORIGINAL MANTIDA</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {Object.values(articles).reduce((acc, curr) => acc + curr.length, 0)} DOCUMENTOS NO ACERVO
              </span>
              <span>•</span>
              <button
                onClick={() => {
                  if (!user || !isAuthorizedPublisher(user.email)) {
                    showToast(
                      "🚨 Permissão negada: Qualquer publicação de artigo só deve ser feita pelas contas dos e-mails wazzimagiygg@gmail.com e pedrohenriquecardonaperes@gmail.com.",
                      true
                    );
                    return;
                  }
                  setArticleFormErrors({});
                  setIsCreateModalOpen(true);
                }}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                  isAuthorizedPublisherUser
                    ? "bg-[#141414] dark:bg-stone-100 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-white"
                    : "bg-stone-800/80 dark:bg-[#242320] text-amber-300 border border-amber-600/50 hover:bg-stone-800"
                }`}
                title="Publicar Artigo (Exclusivo para wazzimagiygg@gmail.com e pedrohenriquecardonaperes@gmail.com)"
              >
                <PlusCircle className="w-3 h-3 text-amber-400" />
                <span>Publicar Artigo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 3. NAVIGATION TAB BAR */}
      {/* ============================================ */}
      <nav className="bg-[#EBE8E1] dark:bg-[#1D1C19] border-b-2 border-[#141414] dark:border-[#3E3D38] sticky top-0 z-40 px-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { id: "wikiworldweb", label: "WikiWorldWeb", icon: Globe },
              { id: "materiadeensaio", label: "Matéria de Ensaio", icon: FileText },
              { id: "academico", label: "Acadêmico", icon: GraduationCap },
              { id: "materia", label: "Matérias Didáticas", icon: BookOpen },
              { id: "uwgbooks", label: "UWG Books", icon: Book },
              { id: "wnpx", label: "WNPX / WikiNotPedia", icon: Newspaper },
              { id: "dossie", label: "Dossiê & Abusos Wikipédia", icon: Scale },
              { id: "tickets", label: supportConfig.buttonLabel || "Ouvidoria & Tickets", icon: Ticket },
              { id: "chat", label: "Chat & Mensagens", icon: MessageSquare },
              { id: "notmediawiki", label: "NotMediaWiki (Beta)", icon: Database },
              { id: "bemtevi", label: "Bemtevi (Rede Social)", icon: MessageCircle },
              { id: "lgpd", label: "Regras LGPD (Lei 13.709)", icon: Scale },
              { id: "eticaia", label: "Ética (IA & Firebase)", icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "tickets") {
                      handleTicketsTabClick();
                    } else {
                      switchTab(tab.id as any);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "bg-[#141414] dark:bg-stone-100 text-white dark:text-stone-950 border-[#141414] dark:border-stone-100 shadow-[2px_2px_0px_0px_rgba(20,20,20,0.4)]"
                      : "bg-transparent text-stone-800 dark:text-stone-200 border-transparent hover:bg-stone-200 dark:hover:bg-stone-800 hover:border-stone-400 dark:hover:border-stone-600"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400 dark:text-amber-700" : "text-stone-600 dark:text-stone-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Direct Burocrata Admin Tab */}
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap bg-red-800 hover:bg-red-700 text-white border border-red-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              title="Acesso exclusivo da administração (burocrata)"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Burocrata (Admin)</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* 3.1. AVISO INSTITUCIONAL: LGPD & MARCO CIVIL DA INTERNET BRASILEIRO */}
      {/* ============================================ */}
      <aside
        role="note"
        aria-label="Aviso de conformidade com a LGPD e o Marco Civil da Internet brasileiro"
        className="bg-emerald-50/90 dark:bg-emerald-950/35 border-b border-emerald-700/40 dark:border-emerald-800/70 px-4 py-2 text-xs transition-colors"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2 text-emerald-950 dark:text-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="font-serif text-[12px] leading-snug">
              <strong className="font-mono text-[10px] uppercase tracking-wider bg-emerald-700 text-white px-1.5 py-0.5 mr-2">
                Aviso Legal (BR)
              </strong>
              Este site segue rigorosamente as normas da <strong>LGPD (Lei Geral de Proteção de Dados — Lei nº 13.709/2018)</strong> e do{' '}
              <strong>Marco Civil da Internet brasileiro (Lei nº 12.965/2014 e Decreto nº 8.771/2016)</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] shrink-0">
            <button
              type="button"
              onClick={() => {
                setLgpdModalInitialTab("principios");
                setIsLgpdModalOpen(true);
              }}
              className="px-2 py-1 bg-white dark:bg-[#1A1A18] hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 border border-emerald-700/50 font-bold uppercase cursor-pointer"
            >
              Regras LGPD
            </button>
            <button
              type="button"
              onClick={() => {
                setLgpdModalInitialTab("marcoCivil");
                setIsLgpdModalOpen(true);
              }}
              className="px-2 py-1 bg-white dark:bg-[#1A1A18] hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-900 dark:text-sky-200 border border-sky-700/50 font-bold uppercase cursor-pointer"
            >
              Marco Civil (BR)
            </button>
            <button
              type="button"
              onClick={() => setIsCookiePreferencesOpen(true)}
              className="px-2 py-1 bg-white dark:bg-[#1A1A18] hover:bg-amber-100 dark:hover:bg-amber-900/40 text-stone-900 dark:text-amber-200 border border-stone-400 dark:border-amber-700/60 font-bold uppercase cursor-pointer"
            >
              Cookies
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================ */}
      {/* 4. SEARCH & SECTOR FILTER BAR */}
      {/* ============================================ */}
      {["wikiworldweb", "materiadeensaio", "academico", "materia", "uwgbooks"].includes(currentTab) && (
        <div className="bg-white dark:bg-[#1A1A18] border-b border-stone-300 dark:border-[#2E2D28] py-3 px-4 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input + Google Search Grounding Action */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Pesquisar artigos, tópicos ou na Web..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchTerm.trim() && currentTabArticles.length === 0) {
                      handleRunWebGrounding();
                    }
                  }}
                  className="w-full pl-9 pr-7 py-2 text-xs font-mono bg-[#F8F7F4] dark:bg-[#121210] text-[#141414] dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 border border-[#141414] dark:border-[#3E3D38] focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-stone-300"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setWebGroundingResult(null);
                      setWebGroundingError(null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-black dark:hover:text-white cursor-pointer"
                    title="Limpar pesquisa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRunWebGrounding()}
                disabled={isWebGroundingLoading || !searchTerm.trim()}
                className="px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-800 hover:bg-emerald-900 disabled:opacity-45 text-white border border-[#141414] dark:border-emerald-700 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                title="Consultar Google Search em tempo real com fontes verificadas (Gemini 4 Hydrogen)"
              >
                {isWebGroundingLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>Buscar na Web</span>
              </button>
            </div>

            {/* Sector Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs font-mono">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold shrink-0">Filtrar:</span>
              <button
                onClick={() => setSelectedSector("todos")}
                className={`px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer ${
                  selectedSector === "todos"
                    ? "bg-[#141414] dark:bg-stone-100 text-white dark:text-stone-950 border-[#141414] dark:border-stone-100"
                    : "bg-[#F8F7F4] dark:bg-[#242320] text-stone-700 dark:text-stone-200 border-stone-300 dark:border-[#3E3D38] hover:border-black dark:hover:border-stone-300"
                }`}
              >
                Todos
              </button>
              {availableSectors.map((sector) => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={`px-2.5 py-1 text-[11px] font-bold border whitespace-nowrap transition-colors cursor-pointer ${
                    selectedSector === sector
                      ? "bg-[#141414] dark:bg-stone-100 text-white dark:text-stone-950 border-[#141414] dark:border-stone-100"
                      : "bg-[#F8F7F4] dark:bg-[#242320] text-stone-700 dark:text-stone-200 border-stone-300 dark:border-[#3E3D38] hover:border-black dark:hover:border-stone-300"
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* 5. MAIN CONTENT AREA */}
      {/* ============================================ */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Banned Alert Banner */}
        {isBanned && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-700 text-red-950 flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(185,28,28,1)]">
            <AlertCircle className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold font-mono text-sm uppercase">CONTA SUSPENSA / RESTRITA</h3>
              <p className="text-xs mt-1">
                Motivo: {banReason}. De acordo com as diretrizes do ecossistema WazzimaGiygg, certas ações de edição estão desabilitadas. Entre em contato pela Ouvidoria para contestação.
              </p>
            </div>
          </div>
        )}

        {/* VIEW 1: ARTICLES GRID (WikiWorldWeb, Ensaio, Academico, Matérias, UWG Books) */}
        {["wikiworldweb", "materiadeensaio", "academico", "materia", "uwgbooks"].includes(currentTab) && (
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between border-b-2 border-[#141414] dark:border-[#3E3D38] pb-2 mb-6">
              <div>
                <h2 className="text-2xl font-editorial font-bold text-[#141414] dark:text-stone-100 capitalize">
                  {currentTab === "wikiworldweb" && "Edição Geral: Notícias & Sociedade"}
                  {currentTab === "materiadeensaio" && "Matérias de Ensaio & Opinião"}
                  {currentTab === "academico" && "Acervo de Metodologia e Pesquisa Acadêmica"}
                  {currentTab === "materia" && "Matérias Escolares e Ensino Fundamental/Médio"}
                  {currentTab === "uwgbooks" && "UWG Books: Acervo Digital de Livros e Obras"}
                </h2>
                <p className="text-xs font-mono text-stone-600 dark:text-stone-400 mt-0.5">
                  Exibindo {currentTabArticles.length} publicações indexadas
                </p>
              </div>

              <button
                onClick={() => {
                  setIsLoading(true);
                  loadCollectionContent(currentTab).then((res) => {
                    setArticles((prev) => ({ ...prev, [currentTab]: res }));
                    setIsLoading(false);
                    showToast("Acervo atualizado.");
                  });
                }}
                className="flex items-center gap-1.5 text-xs font-mono font-bold bg-[#EBEAE8] dark:bg-[#242320] text-[#141414] dark:text-stone-100 hover:bg-stone-300 dark:hover:bg-[#32302B] px-3 py-1.5 border border-[#141414] dark:border-[#3E3D38] transition-colors cursor-pointer"
                title="Sincronizar com banco de dados"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {/* Google Search Grounding Result Panel (gemini-4-hydrogen) */}
            {(webGroundingResult || webGroundingError) && (
              <div className="mb-6 p-5 bg-emerald-50/90 dark:bg-emerald-950/30 border-2 border-emerald-800 dark:border-emerald-700 shadow-[4px_4px_0px_0px_rgba(6,78,59,0.9)]">
                <div className="flex items-start justify-between gap-3 border-b border-emerald-700/30 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                        Síntese Web Verificada • Google Search Grounding
                      </h3>
                      {webGroundingResult?.query && (
                        <p className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400">
                          Consulta: "{webGroundingResult.query}" • Domínio prioritário: core.wazzimagiygg.com
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWebGroundingResult(null);
                      setWebGroundingError(null);
                    }}
                    className="p-1 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/50 cursor-pointer"
                    title="Fechar painel de busca web"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {webGroundingError ? (
                  <p className="text-xs font-mono text-red-700 dark:text-red-300">{webGroundingError}</p>
                ) : webGroundingResult ? (
                  <div className="space-y-3">
                    <div className="text-xs sm:text-sm font-serif text-stone-900 dark:text-stone-100 whitespace-pre-line leading-relaxed">
                      {webGroundingResult.answer}
                    </div>

                    {webGroundingResult.groundingChunks.length > 0 && (
                      <div className="pt-2 border-t border-emerald-700/20">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 mb-2">
                          Fontes indexadas via Google Search:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(
                            new Map(
                              webGroundingResult.groundingChunks
                                .filter((c) => c?.web?.uri)
                                .map((c) => [c.web!.uri!, c.web!])
                            ).values()
                          )
                            .slice(0, 8)
                            .map((webItem, idx) => {
                              let hostname = webItem.uri || "";
                              try {
                                hostname = new URL(webItem.uri!).hostname;
                              } catch {
                                // ignore
                              }
                              return (
                                <a
                                  key={`portal-ground-${idx}`}
                                  href={webItem.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#1A1A18] border border-emerald-700/50 text-[11px] font-mono text-emerald-950 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                  title={webItem.title || webItem.uri}
                                >
                                  <span className="truncate max-w-[240px] font-bold">
                                    {webItem.title || hostname}
                                  </span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Articles List */}
            {isLoading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-stone-400 mb-3" />
                <p className="font-mono text-xs text-stone-600 dark:text-stone-400 uppercase tracking-widest">
                  Carregando acervo do banco de dados...
                </p>
              </div>
            ) : currentTabArticles.length === 0 ? (
              <div className="bg-white dark:bg-[#1A1A18] border-2 border-[#141414] dark:border-[#3E3D38] p-12 text-center shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <Newspaper className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                <h3 className="text-lg font-editorial font-bold dark:text-stone-100">Nenhum artigo encontrado nesta categoria</h3>
                <p className="text-xs font-mono text-stone-600 dark:text-stone-400 max-w-md mx-auto mt-2">
                  Seja o primeiro colaborador a publicar um novo documento nesta seção usando o botão "Publicar Artigo".
                </p>
                <button
                  onClick={() => {
                    if (!user || !isAuthorizedPublisher(user.email)) {
                      showToast(
                        "🚨 Permissão negada: Qualquer publicação de artigo só deve ser feita pelas contas dos e-mails wazzimagiygg@gmail.com e pedrohenriquecardonaperes@gmail.com.",
                        true
                      );
                      return;
                    }
                    setArticleFormErrors({});
                    setIsCreateModalOpen(true);
                  }}
                  className="mt-5 paper-button px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-2"
                  title="Publicar Documento (Restrito a wazzimagiygg@gmail.com e pedrohenriquecardonaperes@gmail.com)"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Publicar Agora</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentTabArticles.map((article, idx) => (
                  <article
                    key={article.id || idx}
                    className="paper-card flex flex-col justify-between p-5 text-left group"
                  >
                    <div>
                      {/* Top tag & views */}
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2 text-stone-600 dark:text-stone-400">
                        <span className="bg-[#EBEAE8] dark:bg-[#242320] text-[#141414] dark:text-stone-200 font-bold px-2 py-0.5 border border-stone-300 dark:border-[#3E3D38] uppercase tracking-wider">
                          <HighlightedText text={article.setor || "Geral"} query={searchTerm} />
                        </span>
                        <span className="flex items-center gap-1 font-mono text-stone-500 dark:text-stone-400">
                          <Eye className="w-3 h-3" />
                          <span>{article.visualizacoes || 0}</span>
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => handleOpenArticle(article)}
                        className="text-lg font-editorial font-bold text-stone-950 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors leading-snug cursor-pointer mb-2"
                      >
                        <HighlightedText text={article.titulo} query={searchTerm} />
                      </h3>

                      {/* Excerpt */}
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-serif line-clamp-4 mb-4">
                        <HighlightedText
                          text={stripHtmlToPlainText(article.descricao) || "Sem resumo disponível."}
                          query={searchTerm}
                        />
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-200 dark:border-[#2E2D28] mt-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 dark:text-stone-400 mb-3">
                        <span>
                          Autor:{" "}
                          {formatPublicAuthorIdentifier(
                            article.criadorEmail,
                            privacySettings.maskEmailInPublicViews,
                            "Redação"
                          )}
                        </span>
                        <span>{article.ultimaEdicao || "Recente"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenArticle(article)}
                          className="flex-1 bg-[#141414] dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-950 font-mono font-bold text-[11px] py-2 px-3 text-center transition-colors uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Ler Artigo</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSharedArticleForBemtevi(article);
                            switchTab("bemtevi");
                            showToast(`Compartilhando "${article.titulo}" na rede social Bemtevi! 🐦`);
                          }}
                          className="bg-[#667eea] hover:bg-[#5a6fd6] text-white border border-[#4d63d6] p-2 text-center transition-colors cursor-pointer shadow-none"
                          title="Compartilhar na rede social Bemtevi"
                          aria-label="Compartilhar na rede social Bemtevi"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveArticleAsPdf(article);
                          }}
                          disabled={isGeneratingPdf}
                          className="bg-stone-100 dark:bg-[#242320] hover:bg-stone-200 dark:hover:bg-[#32302B] text-stone-800 dark:text-stone-200 border border-stone-400 dark:border-[#3E3D38] p-2 text-center transition-colors cursor-pointer disabled:opacity-50"
                          title="Salvar como PDF (jsPDF)"
                          aria-label="Salvar artigo como PDF"
                        >
                          <FileDown className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: WNPX / WIKINOTPEDIA (Alternative Encyclopedia) */}
        {currentTab === "wnpx" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1A1A18] border-2 border-[#141414] dark:border-[#3E3D38] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#141414] dark:border-[#3E3D38] pb-4 mb-6">
                <div>
                  <span className="bg-[#B91C1C] text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest">
                    PROJETO ESPECIAL
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-editorial font-bold mt-1 text-[#141414] dark:text-stone-100">
                    WNPX — A Enciclopédia NotPedia
                  </h2>
                  <p className="text-xs font-mono text-stone-700 dark:text-stone-300 mt-1">
                    Iniciativa editorial independente para documentação irrestrita de artigos, verbetes e história digital.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://wazzimagiygg.com/wikinotpedia.html"
                    onClick={(e) => handleExternalLinkClick("https://wazzimagiygg.com/wikinotpedia.html", e)}
                    className="paper-button px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Abrir Portal WNPX</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-serif text-xs text-stone-800 dark:text-stone-300 leading-relaxed">
                <div className="p-4 bg-[#F8F7F4] dark:bg-[#141413] border border-stone-300 dark:border-[#34332F]">
                  <h4 className="font-editorial font-bold text-sm mb-2 text-[#141414] dark:text-stone-100 uppercase font-mono">
                    1. Imparcialidade Real
                  </h4>
                  <p>
                    Diferente de wikis controladas por pequenos oligopólios de moderadores com interesses corporativos ou conflitos de interesse, o WNPX assegura o direito de resposta e a preservação de dados históricos.
                  </p>
                </div>

                <div className="p-4 bg-[#F8F7F4] dark:bg-[#141413] border border-stone-300 dark:border-[#34332F]">
                  <h4 className="font-editorial font-bold text-sm mb-2 text-[#141414] dark:text-stone-100 uppercase font-mono">
                    2. Garantia do Marco Civil
                  </h4>
                  <p>
                    Preservação de registros conforme Lei 12.965/2014, transparência nas edições e proibição de perseguição editorial sistemática ou doxxing.
                  </p>
                </div>

                <div className="p-4 bg-[#F8F7F4] dark:bg-[#141413] border border-stone-300 dark:border-[#34332F]">
                  <h4 className="font-editorial font-bold text-sm mb-2 text-[#141414] dark:text-stone-100 uppercase font-mono">
                    3. Acervo Indexado
                  </h4>
                  <p>
                    Mais de 28 matérias acadêmicas, relatórios de mobilidade urbana (Metrô de São Paulo, Trens Intercidades) e artigos da reforma psiquiátrica brasileira.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick search inside WNPX articles */}
            <div className="bg-[#EBE8E1] dark:bg-[#1D1C19] border-2 border-[#141414] dark:border-[#3E3D38] p-6">
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider mb-3 dark:text-stone-100">
                Verbetes & Artigos Históricos Catalogados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                {[
                  "Ano de 2025 - Cronologia",
                  "Ano de 2024 - Cronologia",
                  "Ano de 2023 - Cronologia",
                  "Ano de 2022 - Cronologia",
                  "Ano de 2021 - Cronologia",
                  "Ano de 2020 - Cronologia",
                  "Metrô de São Paulo - Estação Sacomã",
                  "Linha 8-Diamante - Extensão Operacional",
                  "Trem Intercidades Sorocaba (R$ 11,9 Bi)",
                  "Reforma Psiquiátrica & CAPS no Brasil",
                  "Franco Basaglia & Desinstitucionalização",
                  "Neutralidade de Rede e Direitos Digitais"
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-[#1A1A18] text-[#141414] dark:text-stone-100 border border-[#141414] dark:border-[#3E3D38] hover:bg-amber-50 dark:hover:bg-[#242320] cursor-pointer flex items-center justify-between transition-colors"
                    onClick={() => {
                      showToast(`Carregando artigo: ${item}`);
                      switchTab("wikiworldweb");
                      setSearchTerm(item.split(" - ")[0]);
                    }}
                  >
                    <span className="font-bold">{item}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DOSSIÊ & TRANSPARÊNCIA (Abusos Wikipédia / Marco Civil / LGPD) */}
        {currentTab === "dossie" && (
          <DossieAbusosView
            sanctionsList={sanctionsList}
            showToast={showToast}
            onOpenTicketForm={(tipo) => {
              switchTab("tickets");
              if (tipo) {
                setTicketForm((prev) => ({ ...prev, tipo }));
              }
            }}
          />
        )}

        {/* VIEW 4: OUVIDORIA & TICKETS */}
        {currentTab === "tickets" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 3.05.3.b: Banner da Extensão de Suporte & Tickets */}
            <div className="lg:col-span-12 p-4 bg-sky-50 dark:bg-sky-950/40 border-2 border-sky-600 shadow-[4px_4px_0px_0px_rgba(2,132,199,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
              <div>
                <div className="flex items-center gap-2 text-sky-950 dark:text-sky-200 font-bold text-sm">
                  <Ticket className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <span>Extensão de Suporte & Central de Tickets WZZM (3.05.3.b)</span>
                </div>
                <p className="text-stone-700 dark:text-stone-300 font-serif text-xs mt-1 leading-relaxed">
                  Canal oficial parametrizado: <strong className="text-sky-900 dark:text-sky-300 break-all">{supportConfig.supportUrl}</strong> • Modo atual: <span className="font-bold">{supportConfig.openMode === 'redirect' ? 'Redirecionamento Externo' : 'Aba Interna'}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={supportConfig.supportUrl}
                  target={supportConfig.openInNewTab !== false ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-sky-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir Link de Suporte
                </a>
                {isAdmin && (
                  <button
                    onClick={() => setEditingExtensionConfig(supportExtension || null)}
                    className="px-3.5 py-2 bg-white dark:bg-[#242320] hover:bg-stone-100 dark:hover:bg-[#2E2D28] text-stone-900 dark:text-stone-100 font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-stone-800 dark:border-[#3E3D38] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Configurar Link
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white dark:bg-[#1A1A18] border-2 border-[#141414] dark:border-[#3E3D38] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 border-b-2 border-[#141414] dark:border-[#3E3D38] pb-3 mb-5">
                <Ticket className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-mono font-bold text-sm uppercase tracking-wider">
                  Central de Ouvidoria & Tickets de Privacidade
                </h3>
              </div>
              <p className="text-xs font-serif text-stone-700 dark:text-stone-300 mb-4 leading-relaxed">
                Abra uma solicitação formal referente a direitos da LGPD (exclusão de dados, retificação de nome), comunicação de erro editorial ou denúncia de abusos.
              </p>

              {/* Identificação do DPO e Portal de Suporte para Remoção de Dados */}
              <div className="mb-5 p-3.5 bg-[#F8F7F4] dark:bg-[#141413] border border-stone-400 dark:border-[#3E3D38] text-xs space-y-1.5">
                <div className="font-mono font-bold uppercase text-[11px] text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Encarregado pelo Tratamento de Dados (DPO) &amp; Portal de Suporte</span>
                </div>
                <div className="font-mono text-[11px] text-stone-700 dark:text-stone-300 space-y-1">
                  <div>
                    <strong>DPO do Site:</strong> Pedro Henrique Cardona Peres
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <a
                      href="mailto:pedrohenriquecardonaperes@gmail.com?subject=Solicita%C3%A7%C3%A3o%20de%20Remo%C3%A7%C3%A3o%20de%20Dados%20(LGPD)"
                      className="underline font-bold text-amber-900 dark:text-amber-400"
                    >
                      pedrohenriquecardonaperes@gmail.com
                    </a>
                    <span>•</span>
                    <a
                      href="https://support.wazzimagiygg.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline font-bold text-sky-800 dark:text-sky-400"
                    >
                      <span>Registrar solicitação no suporte (https://support.wazzimagiygg.com/)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 uppercase font-bold mb-1">Seu Nome / Razão Social:</label>
                  <input
                    type="text"
                    required
                    value={ticketForm.nome}
                    onChange={(e) => setTicketForm({ ...ticketForm, nome: e.target.value })}
                    placeholder="Nome completo ou pseudônimo"
                    className="w-full p-2.5 border border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#121210] dark:text-stone-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 uppercase font-bold mb-1">E-mail para Resposta:</label>
                  <input
                    type="email"
                    required
                    value={ticketForm.email}
                    onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                    placeholder="seu.email@exemplo.com"
                    className="w-full p-2.5 border border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#121210] dark:text-stone-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 uppercase font-bold mb-1">Tipo de Solicitação:</label>
                  <select
                    value={ticketForm.tipo}
                    onChange={(e) => setTicketForm({ ...ticketForm, tipo: e.target.value })}
                    className="w-full p-2.5 border border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#121210] dark:text-stone-100 focus:outline-none"
                  >
                    <option value="Direito de Esquecimento (LGPD)">Direito de Esquecimento / Eliminação (LGPD Art. 18, VI)</option>
                    <option value="Portabilidade / Acesso aos Dados (LGPD Art. 18, II e V)">Portabilidade ou Acesso aos Dados (LGPD Art. 18, II e V)</option>
                    <option value="Retificação ou Oposição (LGPD Art. 18, III)">Retificação de Dados Inexatos (LGPD Art. 18, III)</option>
                    <option value="Notificação de Remoção - Conteúdo Íntimo (Marco Civil Art. 21)">Notificação de Remoção — Violação de Intimidade (Marco Civil Art. 21)</option>
                    <option value="Cumprimento de Ordem Judicial / URL ?uid= (Marco Civil Art. 19)">Notificação Judicial com URL ?uid= Específica (Marco Civil Art. 19)</option>
                    <option value="Retificação de Conteúdo">Retificação Editorial / Direito de Resposta</option>
                    <option value="Denúncia de Assédio ou Moderação">Denúncia de Assédio ou Moderação Abusiva</option>
                    <option value="Dúvida Geral / Apoio Técnico">Dúvida Geral / Apoio Técnico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 uppercase font-bold mb-1">Mensagem Detalhada:</label>
                  <textarea
                    rows={4}
                    required
                    value={ticketForm.mensagem}
                    onChange={(e) => setTicketForm({ ...ticketForm, mensagem: e.target.value })}
                    placeholder="Descreva detalhadamente sua solicitação, páginas envolvidas ou justificativa legal..."
                    className="w-full p-2.5 border border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#121210] dark:text-stone-100 focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="paper-button w-full py-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                  <span>{isSubmittingTicket ? "Enviando Protocolo..." : "Registrar Chamado Oficial"}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-6 bg-[#EBE8E1] dark:bg-[#1D1C19] border-2 border-[#141414] dark:border-[#3E3D38] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
              <div>
                <h3 className="font-mono font-bold text-sm uppercase tracking-wider border-b-2 border-[#141414] dark:border-[#3E3D38] pb-3 mb-4 dark:text-stone-100">
                  Protocolos Registrados no Sistema
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ticketsList.map((ticket, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#1A1A18] border border-[#141414] dark:border-[#3E3D38] p-4 font-mono text-xs">
                      <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 mb-1">
                        <span className="font-bold text-amber-800 dark:text-amber-400">{ticket.id}</span>
                        <span className="bg-stone-100 dark:bg-[#242320] px-2 py-0.5 border border-stone-300 dark:border-[#3E3D38] font-bold uppercase dark:text-stone-200">
                          {ticket.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-1">{ticket.tipo}</h4>
                      <p className="text-[11px] text-stone-700 dark:text-stone-300 font-serif line-clamp-2">{ticket.mensagem}</p>
                      <div className="mt-2 text-[10px] text-stone-500 dark:text-stone-400">
                        Aberto em: {new Date(ticket.criadoEm).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-400 dark:border-[#3E3D38] text-[10px] font-mono text-stone-600 dark:text-stone-400 space-y-1">
                <div>
                  <strong>Prazos Legais:</strong> Atendimento LGPD em até <strong>15 dias corridos</strong> (Art. 19, II da Lei 13.709/2018); retirada prioritária sem ordem judicial para conteúdo íntimo não consentido (Art. 21 da Lei 12.965/2014).
                </div>
                <div>
                  <strong>Guarda Sigilosa:</strong> Registros técnicos protegidos por {MARCO_CIVIL_LOG_RETENTION_DAYS} dias (Art. 15 do Marco Civil) sob reserva de jurisdição (Art. 22).
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: CHAT & MENSAGENS (JSONBin + Firestore Compatibility) */}
        {currentTab === "chat" && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-[#1A1A18] border-2 border-[#141414] dark:border-[#3E3D38] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
            <div className="bg-[#141414] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider">
                    Canal Interno de Mensagens & Colaboração
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    Protocolo compatível com JSONBin API (ID: 684c71428960c979a5a95fd5) & Firestore
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-900 text-emerald-200 px-2 py-0.5 border border-emerald-500 uppercase">
                Online
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="p-4 h-96 overflow-y-auto space-y-3 bg-[#F8F7F4] dark:bg-[#141413] border-b-2 border-[#141414] dark:border-[#3E3D38]">
              {chatMessages.length === 0 ? (
                <p className="text-center text-xs font-mono text-stone-500 dark:text-stone-400 py-12">
                  Nenhuma mensagem registrada no canal. Inicie o diálogo abaixo.
                </p>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div
                      key={msg.id || i}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="text-[10px] font-mono text-stone-500 dark:text-stone-400 mb-0.5">
                        <span className="font-bold">{msg.senderName || "Anônimo"}</span> •{" "}
                        {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div
                        className={`max-w-md p-3 border border-[#141414] dark:border-[#3E3D38] text-xs font-mono shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] ${
                          isMe
                            ? "bg-amber-100 dark:bg-amber-950/70 text-stone-900 dark:text-amber-100"
                            : "bg-white dark:bg-[#242320] text-stone-900 dark:text-stone-100"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-[#1A1A18] flex items-center gap-2">
              <input
                type="text"
                placeholder={user ? "Digite sua mensagem..." : "Faça login ou envie como leitor convidado..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 p-2.5 border border-[#141414] dark:border-[#3E3D38] text-xs font-mono bg-[#F8F7F4] dark:bg-[#121210] dark:text-stone-100 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSendingMessage || !chatInput.trim()}
                className="paper-button px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        )}

        {/* VIEW 6: NOTMEDIAWIKI (BETA) - PARSOID & MICROSERVICES ENGINE */}
        {currentTab === "notmediawiki" && (
          <NotMediaWikiPortal currentUser={user} showToast={showToast} />
        )}

        {/* VIEW 7: BEMTEVI - REDE SOCIAL LIVRE & COLABORATIVA */}
        {currentTab === "bemtevi" && (
          <BemteviHub
            currentUser={user}
            showToast={showToast}
            activeUid={uidNav.currentUid}
            onNavigateUid={uidNav.navigateToUid}
            canGoBack={uidNav.canGoBack}
            canGoForward={uidNav.canGoForward}
            onNavigateBack={uidNav.navigateBack}
            onNavigateForward={uidNav.navigateForward}
            onOpenLgpdModal={() => setIsLgpdModalOpen(true)}
            onOpenArticle={(art) => {
              const all = Object.values(articles).flat();
              const found = all.find((a) => a.id === art.id);
              if (found) {
                handleOpenArticle(found);
              } else {
                handleOpenArticle({
                  id: art.id,
                  titulo: art.titulo,
                  descricao: art.descricao || "",
                  conteudo: art.descricao || "",
                  setor: art.setor || "Geral",
                  criadorEmail: art.criadorEmail || "Redação",
                  dataCriacao: "Recente",
                  ultimaEdicao: "Recente",
                  visualizacoes: 1,
                  colecao: art.colecao || "wikiworldweb"
                });
              }
            }}
            initialSharedArticle={sharedArticleForBemtevi}
            onClearInitialSharedArticle={() => setSharedArticleForBemtevi(null)}
            availableArticles={Object.values(articles).flat()}
          />
        )}

        {/* VIEW 8: REGRAS DA LGPD (LEI 13.709/2018) À AMOSTRA (CIÊNCIA ABSOLUTA) */}
        {currentTab === "lgpd" && (
          <LgpdRulesShowcase
            isModal={false}
            currentUser={user}
            showToast={showToast}
            onOpenCookiePreferences={() => setIsCookiePreferencesOpen(true)}
            onOpenTicketForm={(tipo) => {
              switchTab("tickets");
              if (tipo) {
                setTicketForm((prev) => ({ ...prev, tipo }));
              }
            }}
          />
        )}

        {/* VIEW 9: ÉTICA DE USO DE IA, FIREBASE & INDEPENDÊNCIA DA WIKIMEDIA */}
        {currentTab === "eticaia" && (
          <AiEthicsShowcase
            isModal={false}
            currentUser={user}
            showToast={showToast}
            onOpenDossie={() => switchTab("dossie")}
            onOpenTicketForm={(tipo) => {
              switchTab("tickets");
              if (tipo) {
                setTicketForm((prev) => ({ ...prev, tipo }));
              }
            }}
          />
        )}
      </main>

      {/* ============================================ */}
      {/* 6. ARTICLE READER MODAL */}
      {/* ============================================ */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] dark:bg-[#181816] border-4 border-[#141414] dark:border-[#3E3D38] shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left">
            {/* Modal Top Bar */}
            <div className="bg-[#141414] text-white p-4 flex items-center justify-between border-b-2 border-black">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="bg-[#D97706] text-black font-bold px-2 py-0.5 text-[10px] uppercase">
                  {selectedArticle.setor || "Geral"}
                </span>
                <span className="text-stone-300">Coleção: {selectedArticle.colecao}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = selectedArticle;
                    handleCloseArticle();
                    setSharedArticleForBemtevi(target);
                    switchTab("bemtevi");
                    showToast(`Abrindo Bemtevi para debater e compartilhar "${target.titulo}"! 🐦`);
                  }}
                  className="bg-[#667eea] hover:bg-[#5a6fd6] text-white px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-[#4d63d6] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  title="Compartilhar e debater na rede social Bemtevi"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">Compartilhar no Bemtevi</span>
                  <span className="sm:hidden">Bemtevi</span>
                </button>
                <button
                  onClick={() => handleSaveArticleAsPdf(selectedArticle)}
                  disabled={isGeneratingPdf}
                  className="bg-red-700 hover:bg-red-800 text-white px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  title="Baixar artigo em PDF via jsPDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isGeneratingPdf ? "Gerando..." : "Salvar como PDF"}</span>
                </button>
                <button
                  onClick={handleCloseArticle}
                  className="text-stone-400 hover:text-white p-1 cursor-pointer"
                  aria-label="Fechar artigo"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Article Content Area */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 font-serif text-stone-900 dark:text-stone-100">
              <div className="border-b-2 border-[#141414] dark:border-[#3E3D38] pb-4 mb-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-editorial font-bold text-stone-950 dark:text-stone-50 leading-tight">
                  {selectedArticle.titulo}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-600 dark:text-stone-400 mt-4 pt-3 border-t border-stone-300 dark:border-[#2E2D28]">
                  <span>
                    Autor:{" "}
                    <strong className="dark:text-stone-200">
                      {formatPublicAuthorIdentifier(
                        selectedArticle.criadorEmail,
                        privacySettings.maskEmailInPublicViews,
                        "Redação WZZM"
                      )}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Atualizado: {selectedArticle.ultimaEdicao || "Recente"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold text-stone-800 dark:text-stone-200">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{selectedArticle.visualizacoes || 0} leituras</span>
                  </span>
                </div>
              </div>

              {/* Sanitize and render HTML */}
              <div
                className="prose prose-stone dark:prose-invert max-w-none text-base leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    selectedArticle.conteudo || selectedArticle.descricao || "Nenhum conteúdo adicional disponível."
                  )
                }}
              />

              {/* Gerador de Citação ABNT Customizável (Direta Curta/Longa, Indireta, Apud & Exportação Acadêmica) */}
              <AbntCitationGenerator
                articleId={selectedArticle.id}
                articleTitle={selectedArticle.titulo}
                articleRawContent={selectedArticle.conteudo || selectedArticle.descricao || ""}
                defaultAuthor={formatPublicAuthorIdentifier(
                  selectedArticle.criadorEmail,
                  privacySettings.maskEmailInPublicViews,
                  "WazzimaGiygg"
                )}
                defaultPortalName="WazzimaGiygg Core (core.wazzimagiygg.com)"
                defaultYear={(() => {
                  const match = String(selectedArticle.ultimaEdicao || "").match(/\b(19|20)\d{2}\b/);
                  return match ? match[0] : String(new Date().getFullYear());
                })()}
                articleUrl={getArticleUidUrl(selectedArticle)}
                canonicalCoreUrl={`https://core.wazzimagiygg.com/?uid=${encodeURIComponent(selectedArticle.id)}`}
                showToast={showToast}
                onShareBemtevi={() => {
                  const target = selectedArticle;
                  handleCloseArticle();
                  setSharedArticleForBemtevi(target);
                  switchTab("bemtevi");
                  showToast(`Carregando "${target.titulo}" no Bemtevi para debate social! 🐦`);
                }}
              />
            </div>

            {/* Modal Bottom Controls */}
            <div className="bg-[#EBE8E1] dark:bg-[#22211E] border-t-2 border-[#141414] dark:border-[#3E3D38] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => handleSaveArticleAsPdf(selectedArticle)}
                  disabled={isGeneratingPdf}
                  className="paper-button bg-red-700 hover:bg-red-800 text-white px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] disabled:opacity-50"
                  title="Exportar este artigo para arquivo PDF formatado com jsPDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isGeneratingPdf ? "Gerando PDF..." : "Salvar como PDF"}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="paper-button-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast("Link copiado para a área de transferência!");
                  }}
                  className="paper-button-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar</span>
                </button>
                <button
                  onClick={() => {
                    const target = selectedArticle;
                    handleCloseArticle();
                    setSharedArticleForBemtevi(target);
                    switchTab("bemtevi");
                    showToast(`Abrindo Bemtevi para debater e compartilhar "${target.titulo}"! 🐦`);
                  }}
                  className="paper-button bg-[#667eea] hover:bg-[#5a6fd6] text-white px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
                  title="Compartilhar na rede social Bemtevi"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                  <span>Debater no Bemtevi</span>
                </button>
              </div>

              <button
                onClick={handleCloseArticle}
                className="paper-button px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Concluir Leitura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* 7. CREATE ARTICLE MODAL (Colaborativo) */}
      {/* ============================================ */}
      {isCreateModalOpen && (() => {
        const defaultCollectionForModal = (
          ALLOWED_ARTICLE_COLLECTIONS as readonly string[]
        ).includes(currentTab)
          ? currentTab
          : "wikiworldweb";
        const clearFieldError = (field: string) => {
          setArticleFormErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
          });
        };

        return (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A18] border-4 border-[#141414] dark:border-[#3E3D38] shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] max-w-xl w-full p-6 text-left max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#141414] dark:border-[#3E3D38] pb-3 mb-4">
              <h3 className="font-editorial text-2xl font-bold text-[#141414] dark:text-stone-100">
                Publicar Novo Documento / Artigo
              </h3>
              <button
                onClick={() => {
                  setArticleFormErrors({});
                  setIsCreateModalOpen(false);
                }}
                className="text-stone-500 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner de Restrição Rigorosa de Publicação */}
            <div className={`p-3 border-2 mb-4 font-mono text-xs ${
              isAuthorizedPublisherUser
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-950 dark:text-emerald-200"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-600 text-amber-950 dark:text-amber-200"
            }`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="uppercase tracking-wider">Regra de Publicação Oficial de Artigos:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Qualquer publicação de artigo só deve ser feita pelas contas dos e-mails autorizados:
                <br />
                <strong className="text-black dark:text-white font-mono">wazzimagiygg@gmail.com</strong> e <strong className="text-black dark:text-white font-mono">pedrohenriquecardonaperes@gmail.com</strong>
              </p>
              <div className="mt-2 text-[10px] pt-1.5 border-t border-current/20 flex items-center justify-between">
                <span>Conta ativa: <strong>{user?.email || "Nenhum usuário logado"}</strong></span>
                {isAuthorizedPublisherUser ? (
                  <span className="bg-emerald-600 text-white px-1.5 py-0.5 font-bold uppercase">Autorizado</span>
                ) : (
                  <span className="bg-red-600 text-white px-1.5 py-0.5 font-bold uppercase">Publicação Bloqueada</span>
                )}
              </div>
              <div className="mt-2 pt-1.5 border-t border-current/20 flex items-center justify-between gap-2 text-[10px]">
                <span>Publicações exigem autoria humana e fontes verificadas.</span>
                <button
                  type="button"
                  onClick={() => setIsAiEthicsModalOpen(true)}
                  className="underline font-bold hover:text-black dark:hover:text-white cursor-pointer shrink-0"
                >
                  Ler Ética de Uso da IA →
                </button>
              </div>
            </div>

            {(articleFormErrors._form || articleFormErrors.criadorEmail) && (
              <div role="alert" className="p-2.5 mb-3 border-2 border-red-700 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-200 font-mono text-[11px] font-bold">
                {articleFormErrors._form || articleFormErrors.criadorEmail}
              </div>
            )}

            <form
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user || !isAuthorizedPublisher(user.email)) {
                  showToast(
                    "🚨 Permissão negada: Qualquer publicação de artigo só deve ser feita pelas contas dos e-mails wazzimagiygg@gmail.com e pedrohenriquecardonaperes@gmail.com.",
                    true
                  );
                  return;
                }
                const formData = new FormData(e.currentTarget);
                const rawTitulo = formData.get("titulo");
                const rawColecao = formData.get("colecao");
                const rawSetor = formData.get("setor");
                const rawDescricao = formData.get("descricao");

                const validation = validatePortalArticlePayload({
                  titulo: typeof rawTitulo === "string" ? rawTitulo : null,
                  colecao: typeof rawColecao === "string" ? rawColecao : null,
                  setor: typeof rawSetor === "string" ? rawSetor : undefined,
                  descricao: typeof rawDescricao === "string" ? rawDescricao : null,
                  criadorEmail: user?.email ?? null
                });

                if (!validation.valid || !validation.data) {
                  setArticleFormErrors(validation.fieldErrors);
                  showToast(validation.message, true);
                  return;
                }

                setArticleFormErrors({});
                const validated = validation.data;

                const newArt: Article = {
                  id: `art_${Date.now()}`,
                  titulo: validated.titulo,
                  descricao: validated.descricao,
                  setor: validated.setor,
                  criadorEmail: validated.criadorEmail,
                  colecao: validated.colecao,
                  dataCriacao: new Date().toLocaleDateString("pt-BR"),
                  ultimaEdicao: new Date().toLocaleDateString("pt-BR"),
                  visualizacoes: validated.visualizacoes
                };

                try {
                  // Save to Firestore collections (schema asserted before write)
                  await createArticle(validated);

                  // Update local state
                  setArticles((prev) => ({
                    ...prev,
                    [validated.colecao]: [newArt, ...(prev[validated.colecao] || [])]
                  }));

                  setArticleFormErrors({});
                  setIsCreateModalOpen(false);
                  showToast("Artigo publicado com sucesso no acervo!");
                } catch (publishErr: any) {
                  if (publishErr instanceof ArticleValidationError) {
                    setArticleFormErrors(publishErr.fieldErrors);
                  }
                  showToast(publishErr?.message || "Erro ao publicar artigo.", true);
                }
              }}
              className="space-y-4 font-mono text-xs"
            >
              <div>
                <label className="block text-stone-700 dark:text-stone-300 uppercase font-bold mb-1">
                  Título da Publicação: <span className="text-red-700 dark:text-red-400">*</span>
                </label>
                <input
                  name="titulo"
                  type="text"
                  required
                  maxLength={300}
                  onChange={() => clearFieldError("titulo")}
                  placeholder="Ex: Metodologia e Impactos da Inteligência Artificial (mín. 3 caracteres)"
                  className={`w-full p-2.5 border bg-[#F8F7F4] dark:bg-[#121210] dark:text-stone-100 focus:outline-none ${
                    articleFormErrors.titulo ? "border-red-700 bg-red-50/40 dark:bg-red-950/30" : "border-[#141414] dark:border-[#3E3D38]"
                  }`}
                />
                {articleFormErrors.titulo && (
                  <p role="alert" className="mt-1 text-[11px] font-bold text-red-700 dark:text-red-400">
                    {articleFormErrors.titulo}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 uppercase font-bold mb-1">
                    Coleção / Seção: <span className="text-red-700 dark:text-red-400">*</span>
                  </label>
                  <select
                    key={`${isCreateModalOpen}-${defaultCollectionForModal}`}
                    name="colecao"
                    required
                    defaultValue={defaultCollectionForModal}
                    onChange={() => clearFieldError("colecao")}
                    className={`w-full p-2.5 border bg-[#F8F7F4] dark:bg-[#121210] dark:text-stone-100 focus:outline-none ${
                      articleFormErrors.colecao ? "border-red-700 bg-red-50/40 dark:bg-red-950/30" : "border-[#141414] dark:border-[#3E3D38]"
                    }`}
                  >
                    <option value="wikiworldweb">WikiWorldWeb (Notícias)</option>
                    <option value="materiadeensaio">Matéria de Ensaio</option>
                    <option value="academico">Acadêmico</option>
                    <option value="materia">Matérias Didáticas</option>
                    <option value="uwgbooks">UWG Books</option>
                  </select>
                  {articleFormErrors.colecao && (
                    <p role="alert" className="mt-1 text-[11px] font-bold text-red-700 dark:text-red-400">
                      {articleFormErrors.colecao}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 uppercase font-bold mb-1">Setor / Disciplina:</label>
                  <input
                    name="setor"
                    type="text"
                    maxLength={100}
                    onChange={() => clearFieldError("setor")}
                    placeholder="Ex: Epistemologia, Saúde Mental (padrão: Geral)"
                    className={`w-full p-2.5 border bg-[#F8F7F4] dark:bg-[#121210] dark:text-stone-100 focus:outline-none ${
                      articleFormErrors.setor ? "border-red-700 bg-red-50/40 dark:bg-red-950/30" : "border-[#141414] dark:border-[#3E3D38]"
                    }`}
                  />
                  {articleFormErrors.setor && (
                    <p role="alert" className="mt-1 text-[11px] font-bold text-red-700 dark:text-red-400">
                      {articleFormErrors.setor}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 uppercase font-bold mb-1">
                  Conteúdo do Artigo (Texto ou HTML): <span className="text-red-700 dark:text-red-400">*</span>
                </label>
                <textarea
                  name="descricao"
                  rows={6}
                  required
                  onChange={() => clearFieldError("descricao")}
                  placeholder="Redija o texto do artigo ou ensaio (mínimo de 10 caracteres úteis)..."
                  className={`w-full p-2.5 border bg-[#F8F7F4] dark:bg-[#121210] dark:text-stone-100 focus:outline-none font-serif text-sm ${
                    articleFormErrors.descricao ? "border-red-700 bg-red-50/40 dark:bg-red-950/30" : "border-[#141414] dark:border-[#3E3D38]"
                  }`}
                ></textarea>
                {articleFormErrors.descricao && (
                  <p role="alert" className="mt-1 text-[11px] font-bold text-red-700 dark:text-red-400">
                    {articleFormErrors.descricao}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-[#2E2D28]">
                <button
                  type="button"
                  onClick={() => {
                    setArticleFormErrors({});
                    setIsCreateModalOpen(false);
                  }}
                  className="paper-button-secondary px-4 py-2 font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isAuthorizedPublisherUser}
                  className="paper-button px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAuthorizedPublisherUser ? "Publicar Artigo" : "Publicação Bloqueada"}
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* ============================================ */}
      {/* 8. LOGIN MODAL (COM CONSENTIMENTO EXPLÍCITO LGPD & MARCO CIVIL) */}
      {/* ============================================ */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A18] border-4 border-[#141414] dark:border-[#3E3D38] shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] max-w-md w-full p-7 text-center relative">
            <button
              onClick={() => {
                setIsLoginModalOpen(false);
                setLoginLgpdConsentAccepted(false);
              }}
              className="absolute top-4 right-4 text-stone-500 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-[#EBEAE8] dark:bg-[#242320] border-2 border-[#141414] dark:border-[#3E3D38] flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-[#141414] dark:text-stone-100" />
            </div>

            <h3 className="font-editorial text-2xl font-bold uppercase mb-2 dark:text-stone-100">Identificação do Leitor</h3>
            <p className="text-xs font-serif text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
              Coletamos apenas o mínimo necessário (<strong>UID, nome público e e-mail</strong>) para autenticação e atribuição autoral CC-BY-SA, sem CPF, telefone ou comercialização de dados.
            </p>

            {/* Aviso & Opt-in LGPD / Marco Civil */}
            <div className="text-left bg-[#F8F7F4] dark:bg-[#121210] border-2 border-stone-300 dark:border-[#3E3D38] p-3 mb-4 space-y-2">
              <div className="text-[10px] font-mono text-stone-600 dark:text-stone-400 leading-relaxed">
                <strong>Bases legais:</strong> Consentimento expresso (LGPD Art. 7º, I) e guarda sigilosa de registro de acesso por {MARCO_CIVIL_LOG_RETENTION_DAYS} dias (Marco Civil Art. 15). Acesso de leitura aos artigos não exige login.
              </div>
              <label className="flex items-start gap-2 text-[11px] font-serif text-stone-800 dark:text-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={loginLgpdConsentAccepted}
                  onChange={(e) => setLoginLgpdConsentAccepted(e.target.checked)}
                  className="mt-0.5 accent-emerald-700 cursor-pointer shrink-0"
                />
                <span>
                  Li e autorizo o tratamento dos meus dados de identificação conforme a{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginModalOpen(false);
                      setLgpdModalInitialTab("privacidade");
                      setIsLgpdModalOpen(true);
                    }}
                    className="underline font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer"
                  >
                    Política LGPD &amp; Marco Civil
                  </button>.
                </span>
              </label>
            </div>

            <div className="space-y-3 font-mono text-xs font-bold">
              <button
                onClick={handleGoogleLogin}
                disabled={!loginLgpdConsentAccepted}
                className="w-full bg-[#4285F4] hover:bg-[#357ae8] disabled:opacity-45 disabled:cursor-not-allowed text-white py-3 px-4 border border-[#141414] flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]"
              >
                <span>ENTRAR COM GOOGLE</span>
              </button>

              <button
                onClick={handleCreateGuestUser}
                disabled={!loginLgpdConsentAccepted}
                className="paper-button w-full py-3 px-4 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]"
              >
                <Monitor className="w-4 h-4 text-stone-300 dark:text-stone-700" />
                <span>ACESSO CONVIDADO (24H)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* 9. API DIAGNOSTICS DRAWER */}
      {/* ============================================ */}
      {isDiagnosticsOpen && (
        <div className="fixed bottom-0 right-0 max-w-md w-full bg-[#141414] text-white border-t-4 border-l-4 border-amber-500 p-5 shadow-2xl z-50 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-stone-700 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="font-bold uppercase tracking-wider text-amber-400">
                Diagnóstico de Backend & Banco
              </span>
            </div>
            <button
              onClick={() => setIsDiagnosticsOpen(false)}
              className="text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-[11px] text-stone-300">
            <div className="flex justify-between py-1 border-b border-stone-800">
              <span className="text-stone-400">Versão Wiki-Site:</span>
              <span className="text-amber-400 font-bold">
                {apiHealth?.wikiSiteVersion || WIKI_SITE_VERSION}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-800">
              <span className="text-stone-400">Banco de Dados:</span>
              <span className="text-emerald-400 font-bold">Firestore (wzzm-ce3fc)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-800">
              <span className="text-stone-400">Backend TypeScript:</span>
              <span className="text-emerald-400 font-bold">Express TS (Ativo)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-800">
              <span className="text-stone-400">Rotas Compatíveis:</span>
              <span className="text-stone-200">/api/articles, /api/news, /api/version, /api/tickets</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-800">
              <span className="text-stone-400">Status Servidor:</span>
              <span className="text-stone-200">{apiHealth?.status || "OK"} (Uptime: {Math.floor(apiHealth?.uptime || 0)}s)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsDiagnosticsOpen(false);
              setIsVersionModalOpen(true);
            }}
            className="mt-3 w-full bg-amber-500 hover:bg-amber-400 text-[#141414] font-bold uppercase py-1.5 text-[10px] tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Ver Manifesto Completo ({WIKI_SITE_DISPLAY_ID})</span>
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* 10. LGPD & ANPD COOKIE CONSENT BANNER/MODAL  */}
      {/* ============================================ */}
      <LgpdCookieBanner
        currentConsent={cookieConsent}
        isPreferencesOpen={isCookiePreferencesOpen}
        onOpenPreferences={() => setIsCookiePreferencesOpen(true)}
        onClosePreferences={() => setIsCookiePreferencesOpen(false)}
        onSaveConsent={handleSaveCookiePreferences}
        onRevokeConsent={handleRevokeCookiePreferences}
        onOpenLgpdRules={() => {
          setIsCookiePreferencesOpen(false);
          setIsLgpdModalOpen(true);
        }}
        currentUserLabel={user?.email || user?.uid}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 border-2 border-[#141414] shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] text-xs font-mono font-bold uppercase tracking-wider z-50 ${
            toast.isError ? "bg-red-600 text-white" : "bg-[#141414] text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ============================================ */}
      {/* 11. EDITORIAL FOOTER */}
      {/* ============================================ */}
      <footer className="bg-[#141414] text-stone-400 border-t-4 border-[#141414] pt-12 pb-8 px-4 text-center mt-auto font-mono text-xs">
        <div className="max-w-7xl mx-auto">
          {/* Logo & Subtitle */}
          <div className="mb-6">
            <h2 className="text-2xl font-editorial font-bold text-white tracking-wide">
              WAZZIMA<span className="text-red-500">GIYGG</span>
            </h2>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">
              Plataforma Digital de Conhecimento Livre & Defesa de Direitos Civis
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8 text-[11px] font-bold uppercase text-stone-300">
            <button onClick={() => switchTab("wikiworldweb")} className="hover:text-amber-400">
              Notícias
            </button>
            <span className="text-stone-700">•</span>
            <button onClick={() => switchTab("academico")} className="hover:text-amber-400">
              Metodologia Científica
            </button>
            <span className="text-stone-700">•</span>
            <button onClick={() => switchTab("wnpx")} className="hover:text-amber-400">
              WNPX NotPedia
            </button>
            <span className="text-stone-700">•</span>
            <button onClick={() => switchTab("dossie")} className="hover:text-amber-400">
              Marco Civil & LGPD
            </button>
            <span className="text-stone-700">•</span>
            <button
              onClick={() => {
                setLgpdModalInitialTab("principios");
                setIsLgpdModalOpen(true);
              }}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Scale className="w-3 h-3 text-emerald-400" />
              <span>Regras da LGPD (Ciência Absoluta)</span>
            </button>
            <span className="text-stone-700">•</span>
            <button
              onClick={() => {
                setLgpdModalInitialTab("privacidade");
                setIsLgpdModalOpen(true);
              }}
              className="text-emerald-300 hover:text-emerald-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>Privacidade &amp; Meus Dados (Art. 18)</span>
            </button>
            <span className="text-stone-700">•</span>
            <button
              onClick={() => {
                setLgpdModalInitialTab("marcoCivil");
                setIsLgpdModalOpen(true);
              }}
              className="text-sky-300 hover:text-sky-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Globe className="w-3 h-3 text-sky-300" />
              <span>Marco Civil (12.965/14)</span>
            </button>
            <span className="text-stone-700">•</span>
            <button
              onClick={() => setIsCookiePreferencesOpen(true)}
              className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3 h-3 text-amber-300" />
              <span>Gerenciar Cookies (LGPD)</span>
            </button>
            <span className="text-stone-700">•</span>
            <button
              onClick={() => setIsAiEthicsModalOpen(true)}
              className="text-sky-300 hover:text-sky-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              <span>Ética (IA, Firebase &amp; Wikimedia)</span>
            </button>
            <span className="text-stone-700">•</span>
            <button onClick={handleTicketsTabClick} className="hover:text-amber-400 cursor-pointer">
              Ouvidoria & Tickets
            </button>
            <span className="text-stone-700">•</span>
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Área do Burocrata</span>
            </button>
            <span className="text-stone-700">•</span>
            <a
              href="https://wazzimagiygg.com/donate/"
              onClick={(e) => handleExternalLinkClick("https://wazzimagiygg.com/donate/", e)}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>💝 Doações</span>
            </a>
          </div>

          {/* Faixa de ícones do rodapé (estilo Wiki-alternative / FooterBadges) */}
          <div className="border-t border-stone-800 pt-5 pb-6 flex justify-center">
            <FooterBadges
              className="justify-center"
              supportUrl={supportConfig.externalUrl || "https://support.wazzimagiygg.com/"}
              onOpenVersion={() => setIsVersionModalOpen(true)}
              onNavigate={(view) => {
                if (view === "hub") {
                  switchTab("wikiwazzimagiygg");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else if (view === "privacy") {
                  switchTab("lgpd");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            />
          </div>

          <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-stone-500 gap-3">
            <span>
              © 2026 WazzimaGiygg Core (<strong>core.wazzimagiygg.com</strong>) •{" "}
              <button
                type="button"
                onClick={() => setIsVersionModalOpen(true)}
                className="text-amber-400 hover:underline font-bold cursor-pointer"
              >
                {WIKI_SITE_DISPLAY_ID}
              </button>{" "}
              • Licença CC-BY-SA 4.0 • LGPD (Lei 13.709/18) • Marco Civil (Lei 12.965/14).
            </span>
            <span>DPO: Pedro Henrique Cardona Peres (pedrohenriquecardonaperes@gmail.com) • Guarda de Logs Art. 15 MCI: 180 dias</span>
          </div>
        </div>
      </footer>

      {/* 12. BUROCRATA ADMIN FULL ACCESS PANEL */}
      {isAdminPanelOpen && (
        <AdminPanel
          currentUser={user}
          isAdmin={isAdmin}
          onClose={() => setIsAdminPanelOpen(false)}
          onElevateSuccess={(_res) => {
            setIsAdmin(true);
            setUser((prev: any) => ({
              ...(prev || { uid: `admin_${Date.now()}`, name: "Burocrata Autorizado" }),
              isAdmin: true
            }));
            showToast("Privilégios de Burocrata ativos com sucesso!");
          }}
          onNavigateToTab={(tab) => {
            setIsAdminPanelOpen(false);
            switchTab(tab as any);
          }}
          showToast={showToast}
          activeUid={uidNav.currentUid}
          onNavigateUid={uidNav.navigateToUid}
        />
      )}

      {/* 13. USER PROFILE MODAL (3.05.6.d UID INSPECTION) */}
      {isUserProfileModalOpen && uidNav.currentUid && (
        <UserProfileModal
          uid={uidNav.currentUid}
          nav={uidNav}
          onClose={() => {
            setIsUserProfileModalOpen(false);
            uidNav.navigateToUid(currentTab);
          }}
          onOpenInBemtevi={(_targetUid) => {
            setIsUserProfileModalOpen(false);
            switchTab("bemtevi");
          }}
          showToast={showToast}
        />
      )}

      {/* 14. FLOATING LGPD COMPLIANCE BADGE (REGRAS PERMANENTEMENTE À AMOSTRA) */}
      <LgpdFloatingComplianceBadge
        onOpen={() => setIsLgpdModalOpen(true)}
        hasCiencia={typeof window !== "undefined" && !!localStorage.getItem("wzzm_lgpd_ciencia_absoluta")}
      />

      {/* 15. MODAL DE REGRAS DA LGPD À AMOSTRA (CIÊNCIA ABSOLUTA) */}
      {isLgpdModalOpen && (
        <LgpdRulesShowcase
          isModal={true}
          initialSubTab={lgpdModalInitialTab}
          currentUser={user}
          showToast={showToast}
          onClose={() => setIsLgpdModalOpen(false)}
          onOpenCookiePreferences={() => {
            setIsLgpdModalOpen(false);
            setIsCookiePreferencesOpen(true);
          }}
          onOpenTicketForm={(tipo) => {
            switchTab("tickets");
            setIsLgpdModalOpen(false);
            if (tipo) {
              setTicketForm((prev) => ({ ...prev, tipo }));
            }
          }}
        />
      )}

      {/* 15.1 MODAL DE ÉTICA DE USO DA IA, FIREBASE E WIKIMEDIA */}
      {isAiEthicsModalOpen && (
        <AiEthicsShowcase
          isModal={true}
          currentUser={user}
          showToast={showToast}
          onClose={() => setIsAiEthicsModalOpen(false)}
          onOpenDossie={() => {
            switchTab("dossie");
            setIsAiEthicsModalOpen(false);
          }}
          onOpenTicketForm={(tipo) => {
            switchTab("tickets");
            setIsAiEthicsModalOpen(false);
            if (tipo) {
              setTicketForm((prev) => ({ ...prev, tipo }));
            }
          }}
        />
      )}

      {/* 16. MODAL DO REDIRECIONADOR DE LINKS EXTERNOS (3.05.3.c) */}
      <ExternalRedirectModal
        isOpen={!!externalRedirectTarget}
        targetUrl={externalRedirectTarget || ""}
        redirectorConfig={redirectorConfig}
        activeUid={uidNav.currentUid || user?.uid || "usr_pedro_cardona_official"}
        onClose={() => setExternalRedirectTarget(null)}
        onProceed={(finalUrl) => {
          setExternalRedirectTarget(null);
          window.open(finalUrl, "_blank");
        }}
      />

      {/* 17. MODAL DE CONFIGURAÇÃO DE EXTENSÕES (3.05.3.a, 3.05.3.b, 3.05.3.c, 3.05.3.e) */}
      <ExtensionConfigModal
        isOpen={!!editingExtensionConfig}
        extension={editingExtensionConfig}
        onClose={() => setEditingExtensionConfig(null)}
        onSaveConfig={async (extId, newConf, updatedMeta) => {
          try {
            const res = await safeApiFetch(`/api/v1/extensions/${extId}/config`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ config: newConf, userEmail: user?.email })
            });
            if (res) {
              const data = await res.json();
              if (!data.success) {
                showToast(data.error || "Erro ao salvar configuração.", true);
                return false;
              }
            } else {
              const overridesRaw = localStorage.getItem("wzzm_extensions_config_overrides");
              const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
              overrides[extId] = { ...(overrides[extId] || {}), ...newConf };
              localStorage.setItem("wzzm_extensions_config_overrides", JSON.stringify(overrides));
            }
            setExtensionsList((prev) =>
              prev.map((e) =>
                e.id === extId
                  ? { ...e, ...updatedMeta, config: { ...(e.config || {}), ...newConf } }
                  : e
              )
            );
            showToast("Configurações salvas com sucesso!");
            return true;
          } catch (err: any) {
            showToast(err.message, true);
            return false;
          }
        }}
        isBureaucrat={isBurocrataUser}
        currentUserEmail={user?.email}
      />

      {/* 18. MODAL OFICIAL DE IDENTIFICAÇÃO DE VERSÃO (Wiki-Site C1.16.C7.1 / Special:Version) */}
      <WikiSiteVersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        articlesCount={Object.values(articles).reduce((acc, curr) => acc + curr.length, 0)}
        extensionsCount={extensionsList.length}
        extensionNames={extensionsList.map((ext) => ext.name)}
        showToast={showToast}
      />
    </div>
  );
}
