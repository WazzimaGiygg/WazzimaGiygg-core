import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { WikiHub } from './components/WikiHub';
import { RecentChanges } from './components/RecentChanges';
import { ArticleViewer } from './components/ArticleViewer';
import { WikitextEditor } from './components/WikitextEditor';
import { SpecialPagesView } from './components/SpecialPagesView';
import { UserPageView } from './components/UserPageView';
import { UnifiedAdminDashboard } from './components/UnifiedAdminDashboard';
import { AdminUsersManagementView } from './components/AdminUsersManagementView';
import { AdminCouncilView } from './components/AdminCouncilView';
import { AdminDataRemovalRequestsView } from './components/AdminDataRemovalRequestsView';
import { CheckUserView } from './components/CheckUserView';
import { UnblockRequestsView } from './components/UnblockRequestsView';
import { PromotionRequestsView } from './components/PromotionRequestsView';
import { ContactAdminView } from './components/ContactAdminView';
import { EmergencyContactView } from './components/EmergencyContactView';
import { FirebaseAdminDashboard } from './components/FirebaseAdminDashboard';
import { VpnSecurityChecker } from './components/VpnSecurityChecker';
import { CreatePageModal } from './components/CreatePageModal';
import { GeminiChatbotDrawer } from './components/GeminiChatbotDrawer';
import { GeminiPremiumModal } from './components/GeminiPremiumModal';
import { GeminiNotebook } from './components/GeminiNotebook';
import { CookieBanner } from './components/CookieBanner';
import { BannedOverlay } from './components/BannedOverlay';
import { LgpdConsentModal } from './components/LgpdConsentModal';
import { MyDataModal } from './components/MyDataModal';
import { LanguageModal } from './components/LanguageModal';
import {
  SecurityView,
  DonationView,
  PrivacyPolicyView,
  TermsOfUseView,
  BetaModeView,
  OfflineModeView,
} from './components/InformativeViews';
import { EditingEthicsView } from './components/EditingEthicsView';
import { SiteUpdatesView } from './components/SiteUpdatesView';
import { FileUploadView } from './components/FileUploadView';
import { FilePageView } from './components/FilePageView';
import { FilesGalleryView } from './components/FilesGalleryView';
import { ArbitrationCommitteeView } from './components/ArbitrationCommitteeView';
import { UcocView } from './components/UcocView';
import { LoginModal } from './components/LoginModal';
import { UnsavedChangesModal } from './components/UnsavedChangesModal';
import { ChromeRecommendationModal } from './components/ChromeRecommendationModal';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileSearchModal } from './components/MobileSearchModal';
import { MobileDrawerMenu } from './components/MobileDrawerMenu';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SmartTVView } from './components/SmartTVView';
import { SmartTVInstallModal } from './components/SmartTVInstallModal';
import { AppearanceSettingsView } from './components/AppearanceSettingsView';
import { WindowsXPBootScreen } from './components/WindowsXPBootScreen';
import { Windows7BootScreen } from './components/Windows7BootScreen';
import { Windows10BootScreen } from './components/Windows10BootScreen';
import { Windows95BootScreen } from './components/Windows95BootScreen';
import { Windows31BootScreen } from './components/Windows31BootScreen';
import { Windows95Bot } from './components/Windows95Bot';
import { AdvancedSearchView } from './components/AdvancedSearchView';
import { WikiCompetitorComparisonView } from './components/WikiCompetitorComparisonView';
import { WazzimaGiyggProfileView } from './components/WazzimaGiyggProfileView';
import { NotFoundView } from './components/NotFoundView';
import { ToolsView } from './components/ToolsView';
import { LibraryCatalogView } from './components/LibraryCatalogView';
import { AcademicCatalogView } from './components/AcademicCatalogView';
import { JornalNewsView } from './components/JornalNewsView';
import { CustomContextMenu } from './components/CustomContextMenu';
import { CURATED_FEATURED_ARTICLES } from './components/WikiFeaturedArticle';
import { updateSEO } from './utils/seoManager';
import { RecentlyReadService } from './utils/recentlyReadService';
import { StorageService } from './services/storageService';
import {
  WikiPage,
  WikiArticle,
  UserProfile,
  NotificationItem,
  CookieConsent,
  ViewMode,
  ArticleHistoryItem,
  DeviceMode,
  AppTheme,
} from './types';
import {
  getUidFromUrl,
  setBrowserUid,
  getCanonicalUid,
  resolveNavigationUid,
} from './utils/urlRouter';

export default function App() {
  // === STATE MANAGEMENT ===
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [articles, setArticles] = useState<WikiArticle[]>([]);

  // Acervo enciclopédico consolidado (combina artigos persistidos e artigos editoriais de referência)
  const allEncyclopediaArticles = useMemo(() => {
    const list: WikiArticle[] = [...articles];
    for (const c of CURATED_FEATURED_ARTICLES) {
      if (!list.some((a) => a.id.toLowerCase() === c.id.toLowerCase())) {
        list.push(c);
      }
    }
    return list;
  }, [articles]);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [cookieConsent, setCookieConsent] = useState<CookieConsent | null>(null);
  const [showLgpdModal, setShowLgpdModal] = useState<boolean>(false);
  const [showCreatePageModal, setShowCreatePageModal] = useState<boolean>(false);
  const [showMyDataModal, setShowMyDataModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSmartTVModal, setShowSmartTVModal] = useState<boolean>(false);
  const [showGeminiChatbot, setShowGeminiChatbot] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [premiumQuotaType, setPremiumQuotaType] = useState<'chats' | 'images' | 'notebook' | undefined>();
  const [showNotebookModal, setShowNotebookModal] = useState<boolean>(false);

  const [currentView, setCurrentView] = useState<ViewMode>('hub');
  const [isVectorTabTransitioning, setIsVectorTabTransitioning] = useState<boolean>(false);

  useEffect(() => {
    setIsVectorTabTransitioning(true);
    const timer = setTimeout(() => setIsVectorTabTransitioning(false), 350);
    return () => clearTimeout(timer);
  }, [currentView]);
  const [selectedPageUid, setSelectedPageUid] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<WikiArticle | null>(null);
  const [editorHasUnsavedChanges, setEditorHasUnsavedChanges] = useState<boolean>(false);
  const [editorIsNewArticle, setEditorIsNewArticle] = useState<boolean>(false);
  const [showExitEditorConfirmModal, setShowExitEditorConfirmModal] = useState<boolean>(false);
  const [showChromeRecommendationModal, setShowChromeRecommendationModal] = useState<boolean>(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);
  const [targetUserIdentifier, setTargetUserIdentifier] = useState<string>('WazzimaGiygg');
  const [userPageInitialTab, setUserPageInitialTab] = useState<'profile' | 'talk' | 'contributions' | 'admin'>('profile');
  const [selectedFileName, setSelectedFileName] = useState<string>('Logo_WikiZero.svg');
  const [uploadInitialTargetName, setUploadInitialTargetName] = useState<string>('');
  const [ucocInitialTab, setUcocInitialTab] = useState<'principles' | 'new-report' | 'track' | 'cases'>('principles');
  const [ucocInitialProtocol, setUcocInitialProtocol] = useState<string>('');
  const [toolsInitialTab, setToolsInitialTab] = useState<'weather' | 'scholar' | 'calculator' | 'world-clock' | 'keyboard-checker' | 'chrome-app'>('weather');
  const [editingEthicsInitialTab, setEditingEthicsInitialTab] = useState<'principles' | 'lgpd' | 'gdpr' | 'free_expression' | 'bpv' | 'enforcement' | 'checklist'>('principles');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notFoundQuery, setNotFoundQuery] = useState<string>('');
  const [notFoundType, setNotFoundType] = useState<'article' | 'page' | 'file' | 'user' | 'special' | 'generic'>('generic');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    const saved = localStorage.getItem('wikizero_device_mode');
    if (saved === 'mobile' || saved === 'desktop' || saved === 'auto' || saved === 'tv') {
      return saved as DeviceMode;
    }
    return 'auto';
  });

  const handleToggleDeviceMode = (mode: DeviceMode) => {
    setDeviceMode(mode);
    localStorage.setItem('wikizero_device_mode', mode);
    if (mode === 'tv') {
      setCurrentView('smart-tv');
    }
  };

  // Custom right-click context menu (Bloqueio do menu nativo e menu alternativo por símbolos)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({
    x: 0,
    y: 0,
    isOpen: false,
  });

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Bloqueio do botão direito no Wiki
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        isOpen: true,
      });
    };

    // Use capture: true para garantir que o bloqueio intercepte qualquer clique com botão direito
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, []);

  // Multi-theme state supporting light, dark, google, google-dark, win95, winxp, win7, win10, win31, genshin, android15, android23, stardew, repo, minecraft, roblox, nokia3310, win1, halflife
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('wikizero_theme_v3') as AppTheme | null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'google' || saved === 'google-dark' || saved === 'win95' || saved === 'winxp' || saved === 'win7' || saved === 'win10' || saved === 'win31' || saved === 'wikidiota' || saved === 'genshin' || saved === 'android15' || saved === 'android23' || saved === 'stardew' || saved === 'repo' || saved === 'minecraft' || saved === 'roblox' || saved === 'nokia3310' || saved === 'win1' || saved === 'halflife')) {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Controls classic Windows 3.1 boot startup animation
  const [showWin31Boot, setShowWin31Boot] = useState<boolean>(() => {
    const saved = localStorage.getItem('wikizero_theme_v3');
    return saved === 'win31';
  });

  // Controls classic Windows 95 boot startup animation
  const [showWin95Boot, setShowWin95Boot] = useState<boolean>(() => {
    const saved = localStorage.getItem('wikizero_theme_v3');
    return saved === 'win95';
  });

  // Controls classic Windows XP boot startup animation
  const [showWinXPBoot, setShowWinXPBoot] = useState<boolean>(() => {
    const saved = localStorage.getItem('wikizero_theme_v3');
    return saved === 'winxp';
  });

  // Controls Windows 7 boot startup animation (convergence of 4 colored light orbs & chime)
  const [showWin7Boot, setShowWin7Boot] = useState<boolean>(() => {
    const saved = localStorage.getItem('wikizero_theme_v3');
    return saved === 'win7';
  });

  // Controls Windows 10 boot startup animation (angled logo & circular dots spinner)
  const [showWin10Boot, setShowWin10Boot] = useState<boolean>(() => {
    const saved = localStorage.getItem('wikizero_theme_v3');
    return saved === 'win10';
  });

  const isDark = theme === 'dark' || theme === 'google-dark' || theme === 'win10' || theme === 'genshin' || theme === 'android15' || theme === 'android23' || theme === 'repo' || theme === 'minecraft' || theme === 'roblox' || theme === 'halflife';

  // Apply appropriate theme classes to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-google', 'theme-google-dark', 'theme-win95', 'theme-winxp', 'theme-win7', 'theme-win10', 'theme-win31', 'theme-wikidiota', 'theme-genshin', 'theme-android15', 'theme-android23', 'theme-stardew', 'theme-repo', 'theme-minecraft', 'theme-roblox', 'theme-nokia3310', 'theme-win1', 'theme-halflife');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'google') {
      root.classList.add('theme-google');
    } else if (theme === 'google-dark') {
      root.classList.add('dark', 'theme-google', 'theme-google-dark');
    } else if (theme === 'win95') {
      root.classList.add('theme-win95');
    } else if (theme === 'winxp') {
      root.classList.add('theme-winxp');
    } else if (theme === 'win7') {
      root.classList.add('theme-win7');
    } else if (theme === 'win10') {
      root.classList.add('dark', 'theme-win10');
    } else if (theme === 'win31') {
      root.classList.add('theme-win31');
    } else if (theme === 'wikidiota') {
      root.classList.add('theme-wikidiota');
    } else if (theme === 'genshin') {
      root.classList.add('dark', 'theme-genshin');
    } else if (theme === 'android15') {
      root.classList.add('dark', 'theme-android15');
    } else if (theme === 'android23') {
      root.classList.add('dark', 'theme-android23');
    } else if (theme === 'stardew') {
      root.classList.add('theme-stardew');
    } else if (theme === 'repo') {
      root.classList.add('dark', 'theme-repo');
    } else if (theme === 'minecraft') {
      root.classList.add('dark', 'theme-minecraft');
    } else if (theme === 'roblox') {
      root.classList.add('dark', 'theme-roblox');
    } else if (theme === 'nokia3310') {
      root.classList.add('theme-nokia3310');
    } else if (theme === 'win1') {
      root.classList.add('theme-win1');
    } else if (theme === 'halflife') {
      root.classList.add('dark', 'theme-halflife');
    }

    localStorage.setItem('wikizero_theme_v3', theme);
  }, [theme]);

  const handleShowNotFound = (
    query: string,
    type: 'article' | 'page' | 'file' | 'user' | 'special' | 'generic' = 'generic'
  ) => {
    setNotFoundQuery(query);
    setNotFoundType(type);
    setCurrentView('not-found');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to any page/article/view/user/file by UID
  const handleNavigateByUid = (rawUid: string, mode: 'push' | 'replace' = 'push') => {
    if (!rawUid || !rawUid.trim()) {
      handleNavigate('hub');
      return;
    }

    const target = resolveNavigationUid(rawUid, articles, pages);

    switch (target.type) {
      case 'not-found':
        handleShowNotFound(target.query, 'generic');
        break;
      case 'article':
        setSelectedArticleId(target.articleId);
        StorageService.incrementArticleViews(target.articleId);
        setCurrentView('article');
        break;

      case 'article-title':
        handleNavigateToArticleByTitle(target.title);
        break;

      case 'page':
        handleSelectPage(target.pageUid);
        break;

      case 'view':
        if (target.view === 'ucoc') {
          if (target.initialProtocol) {
            setUcocInitialProtocol(target.initialProtocol);
            setUcocInitialTab('track');
          } else if (target.initialTab) {
            setUcocInitialTab(target.initialTab as any);
          }
        }
        if (target.view === 'tools' && target.initialTab) {
          setToolsInitialTab(target.initialTab as any);
        }
        if (target.view === 'editing-ethics' && target.initialTab) {
          setEditingEthicsInitialTab(target.initialTab as any);
        }
        handleNavigate(target.view);
        break;

      case 'user':
        handleNavigateToUser(target.username, target.initialTab || 'profile');
        break;

      case 'file':
        handleNavigateToFile(target.fileName);
        break;

      case 'upload':
        handleNavigateToUpload(target.targetName);
        break;

      case 'checkuser':
        handleNavigateToCheckUser(target.target);
        break;

      case 'arbitration-case':
        setCurrentView('arbitration');
        break;

      case 'create-page':
        setShowCreatePageModal(true);
        break;

      case 'editor':
        if (target.articleId) {
          const art = articles.find((a) => a.id === target.articleId);
          if (art) {
            handleOpenEditorForEdit(art);
          } else {
            handleOpenNewEditor();
          }
        } else {
          handleOpenNewEditor(target.pageUid);
        }
        break;

      default:
        setCurrentView('hub');
        break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load initial data and resolve URL query ?uid=
  useEffect(() => {
    const loadData = async () => {
      const p = await StorageService.getPages();
      const a = await StorageService.getArticles();
      const u = StorageService.getCurrentUser();
      const n = StorageService.getNotifications();
      const c = StorageService.getCookieConsent();
      const lgpdAccepted = StorageService.isLgpdTermsAccepted();

      setPages(Array.isArray(p) ? p : []);
      setArticles(Array.isArray(a) ? a : []);
      setNotifications(Array.isArray(n) ? n : []);
      setCookieConsent(c);

      // Verificar banimento e restrição de convidados em cache ao carregar
      if (u) {
        if (u.isGuest || u.role === 'convidado') {
          StorageService.clearUser();
          setUser(null);
          console.warn('[App] Sessão revogada: login de convidados não é permitido.');
        } else {
          const banCheck = await StorageService.getUserBanStatus(u.uid, u.email, u.username || u.displayName);
          if (banCheck.isBanned || u.isBanned) {
            await StorageService.logout();
            setUser(null);
            console.warn('[App] Sessão revogada: usuário bloqueado por decisão administrativa.');
          } else {
            setUser(u);
            // Garantir que a página pública do usuário logado exista e esteja sincronizada
            StorageService.ensureUserPage(u).then((verified) => {
              setUser(verified);
            }).catch((e) => console.warn('[App] ensureUserPage error on boot:', e));
          }
        }
      } else {
        setUser(null);
      }

      // Trigger LGPD term modal if not yet accepted
      if (!lgpdAccepted) {
        setShowLgpdModal(true);
      } else {
        // Se LGPD já foi aceito e o usuário está entrando pela primeira vez, dar aviso de recomendação do Chrome
        if (!StorageService.isChromeRecommendationNoticed()) {
          setShowChromeRecommendationModal(true);
        }
      }

      // Check URL for ?uid= on first boot
      const initialUid = getUidFromUrl();
      if (initialUid) {
        const target = resolveNavigationUid(initialUid, a, p);
        switch (target.type) {
          case 'not-found':
            handleShowNotFound(target.query, 'generic');
            break;
          case 'article':
            setSelectedArticleId(target.articleId);
            StorageService.incrementArticleViews(target.articleId);
            setCurrentView('article');
            break;
          case 'article-title':
            const matchArt = await StorageService.getArticleByTitle(target.title);
            if (matchArt) {
              setSelectedArticleId(matchArt.id);
              StorageService.incrementArticleViews(matchArt.id);
              setCurrentView('article');
            } else {
              handleShowNotFound(target.title, 'article');
            }
            break;
          case 'page':
            setSelectedPageUid(target.pageUid);
            const pageArticles = (a || []).filter((item) => item && item.pageUid === target.pageUid);
            if (pageArticles.length > 0) {
              setSelectedArticleId(pageArticles[0].id);
              setCurrentView('article');
            } else {
              setCurrentView('editor');
            }
            break;
          case 'view':
            if (target.view === 'ucoc') {
              if (target.initialProtocol) {
                setUcocInitialProtocol(target.initialProtocol);
                setUcocInitialTab('track');
              } else if (target.initialTab) {
                setUcocInitialTab(target.initialTab as any);
              }
            }
            if (target.view === 'tools' && target.initialTab) {
              setToolsInitialTab(target.initialTab as any);
            }
            if (target.view === 'editing-ethics' && target.initialTab) {
              setEditingEthicsInitialTab(target.initialTab as any);
            }
            setCurrentView(target.view);
            break;
          case 'user':
            setTargetUserIdentifier(target.username);
            setUserPageInitialTab(target.initialTab || 'profile');
            setCurrentView('user-page');
            break;
          case 'file':
            setSelectedFileName(target.fileName);
            setCurrentView('file-page');
            break;
          case 'upload':
            setUploadInitialTargetName(target.targetName || '');
            setCurrentView('upload');
            break;
          case 'checkuser':
            setTargetUserIdentifier(target.target);
            setCurrentView('checkuser');
            break;
          case 'arbitration-case':
            setCurrentView('arbitration');
            break;
          case 'create-page':
            setShowCreatePageModal(true);
            break;
          case 'editor':
            setCurrentView('editor');
            break;
          default:
            break;
        }
      }
    };
    loadData();

    // Inscrição em tempo real com o Firestore para sincronização entre múltiplos navegadores e sessões anônimas
    const unsubArticles = StorageService.subscribeToArticles((updatedArticles) => {
      if (Array.isArray(updatedArticles)) {
        setArticles(updatedArticles);
      }
    });
    const unsubPages = StorageService.subscribeToPages((updatedPages) => {
      if (Array.isArray(updatedPages)) {
        setPages(updatedPages);
      }
    });

    return () => {
      unsubArticles();
      unsubPages();
    };
  }, []);

  // Sincronização em tempo real de avatar removido sob LGPD
  useEffect(() => {
    const handleAvatarUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<UserProfile>;
      const updatedProfile = customEvt.detail;
      if (updatedProfile) {
        setUser((prev) => {
          if (!prev) return null;
          if (prev.uid === updatedProfile.uid || (prev.email && prev.email === updatedProfile.email)) {
            const copy = {
              ...prev,
              ...updatedProfile,
              photoURL: undefined,
              avatarRemovedByAdmin: true,
            };
            delete (copy as any).photoURL;
            return copy;
          }
          return prev;
        });
      }
    };

    window.addEventListener('wikizero:user-avatar-updated', handleAvatarUpdated);
    return () => {
      window.removeEventListener('wikizero:user-avatar-updated', handleAvatarUpdated);
    };
  }, []);

  // Listen to browser Back/Forward (popstate) and hash changes for deep linking
  useEffect(() => {
    const handleUrlChange = () => {
      const uid = getUidFromUrl();
      if (uid) {
        handleNavigateByUid(uid, 'replace');
      } else {
        setCurrentView('hub');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [articles, pages]);

  // Keep browser URL query string ?uid= synchronized with current application view and state
  useEffect(() => {
    if (pages.length === 0 && allEncyclopediaArticles.length === 0) return;
    const currentActiveArticle = currentView === 'article'
      ? (allEncyclopediaArticles.find((a) => a.id === selectedArticleId) || allEncyclopediaArticles[0])
      : null;

    const canonicalUid = getCanonicalUid(currentView, {
      selectedArticle: currentActiveArticle,
      selectedPageUid,
      targetUserIdentifier,
      selectedFileName,
      uploadInitialTargetName,
      notFoundQuery,
    });

    setBrowserUid(canonicalUid, 'replace');
  }, [
    currentView,
    selectedArticleId,
    selectedPageUid,
    targetUserIdentifier,
    selectedFileName,
    uploadInitialTargetName,
    notFoundQuery,
    allEncyclopediaArticles,
    pages,
  ]);

  // Keep SEO, document title, meta tags, OpenGraph and Schema.org JSON-LD dynamically in sync
  useEffect(() => {
    const currentActiveArticle =
      currentView === 'article'
        ? allEncyclopediaArticles.find((a) => a.id === selectedArticleId) || null
        : null;

    const currentActivePage = selectedPageUid
      ? pages.find((p) => p.uid === selectedPageUid) || null
      : null;

    updateSEO({
      view: currentView,
      article: currentActiveArticle,
      page: currentActivePage,
      breadcrumbs: currentActiveArticle
        ? [
            { name: 'Início', url: '/?uid=hub' },
            { name: currentActivePage?.titulo || 'Coleção', url: `/?uid=${currentActiveArticle.pageUid}` },
            { name: currentActiveArticle.titulo, url: `/?uid=${currentActiveArticle.id}` },
          ]
        : undefined,
    });
  }, [currentView, selectedArticleId, selectedPageUid, allEncyclopediaArticles, pages]);

  // === HANDLERS ===
  const handleSetTheme = (newTheme: AppTheme) => {
    if (newTheme === 'win31') {
      setShowWin31Boot(true);
    } else if (newTheme === 'win95') {
      setShowWin95Boot(true);
    } else if (newTheme === 'winxp') {
      setShowWinXPBoot(true);
    } else if (newTheme === 'win7') {
      setShowWin7Boot(true);
    } else if (newTheme === 'win10') {
      setShowWin10Boot(true);
    }
    setTheme(newTheme);
  };

  const handleToggleTheme = () => {
    if (theme === 'google') {
      setTheme('google-dark');
    } else if (theme === 'google-dark') {
      setTheme('google');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  // Guardião para navegação quando há alterações não salvas no editor
  const confirmNavigationIfDirty = (action: () => void) => {
    if (currentView === 'editor' && editorHasUnsavedChanges) {
      setPendingNavigationAction(() => action);
      setShowExitEditorConfirmModal(true);
      return false;
    }
    action();
    return true;
  };

  const handleConfirmDiscardFromApp = () => {
    setShowExitEditorConfirmModal(false);
    setEditorHasUnsavedChanges(false);
    StorageService.clearDraft();
    handleNotify('Alterações descartadas: Você saiu da edição sem salvar o artigo.', 'warning');
    if (pendingNavigationAction) {
      pendingNavigationAction();
      setPendingNavigationAction(null);
    }
  };

  const handleStayInEditorFromApp = () => {
    setShowExitEditorConfirmModal(false);
    setPendingNavigationAction(null);
  };

  // Intercepta botão Voltar do navegador para não perder edições acidentalmente
  useEffect(() => {
    const handlePopState = () => {
      if (currentView === 'editor' && editorHasUnsavedChanges) {
        window.history.pushState(null, '', window.location.href);
        setShowExitEditorConfirmModal(true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, editorHasUnsavedChanges]);

  const handleNavigate = (view: ViewMode) => {
    confirmNavigationIfDirty(() => {
      if (view === 'user-page' && user) {
        setTargetUserIdentifier(user.uid || user.displayName || user.username || '');
        setUserPageInitialTab('profile');
      }
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleNavigateToFile = (fileName: string) => {
    confirmNavigationIfDirty(() => {
      const sanitized = fileName.replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '').replace(/\s+/g, '_');
      setSelectedFileName(sanitized);
      setCurrentView('file-page');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleNavigateToUpload = (targetName?: string) => {
    confirmNavigationIfDirty(() => {
      if (targetName) {
        const sanitized = targetName.replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '').replace(/\s+/g, '_');
        setUploadInitialTargetName(sanitized);
      } else {
        setUploadInitialTargetName('');
      }
      setCurrentView('upload');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleNotify = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    StorageService.addNotification({
      title: type === 'success' ? '✅ Sucesso' : type === 'warning' ? '⚠️ Atenção' : 'ℹ️ Informação',
      message,
      type,
    });
    setNotifications(StorageService.getNotifications());
  };

  const handleNavigateToUser = (identifier: string, initialTab: 'profile' | 'talk' | 'contributions' | 'admin' = 'profile') => {
    confirmNavigationIfDirty(() => {
      setTargetUserIdentifier(identifier);
      setUserPageInitialTab(initialTab);
      setCurrentView('user-page');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleNavigateToCheckUser = (identifier?: string) => {
    confirmNavigationIfDirty(() => {
      if (identifier) setTargetUserIdentifier(identifier);
      setCurrentView('checkuser');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Handlers para o menu alternativo do botão direito (por símbolos)
  const handleContextMenuRefresh = async () => {
    try {
      const [a, p, n] = await Promise.all([
        StorageService.getArticles(),
        StorageService.getPages(),
        Promise.resolve(StorageService.getNotifications()),
      ]);
      setArticles(Array.isArray(a) ? a : []);
      setPages(Array.isArray(p) ? p : []);
      setNotifications(Array.isArray(n) ? n : []);
      handleNotify('Wiki atualizado e sincronizado com sucesso.', 'info');
    } catch (err) {
      console.warn('Erro na atualização via context menu:', err);
      window.location.reload();
    }
  };

  const handleContextMenuHome = () => {
    setSelectedArticleId(null);
    setSelectedPageUid(null);
    handleNavigate('hub');
  };

  const handleContextMenuTools = () => {
    handleNavigate('tools');
  };

  const handleSelectPage = (pageUid: string) => {
    confirmNavigationIfDirty(() => {
      const existingPage = pages.find((p) => p.uid.toLowerCase() === pageUid.toLowerCase());
      if (!existingPage) {
        handleShowNotFound(pageUid, 'page');
        return;
      }
      setSelectedPageUid(existingPage.uid);
      const pageArticles = (articles || []).filter((a) => a && a.pageUid === existingPage.uid);
      if (pageArticles.length > 0) {
        setSelectedArticleId(pageArticles[0].id);
        StorageService.incrementArticleViews(pageArticles[0].id);
        setCurrentView('article');
      } else {
        // Prompt to create an article in this collection
        setEditingArticle({
          id: '',
          pageUid: existingPage.uid,
          titulo: `Novo artigo em ${existingPage.titulo}`,
          descricao: `= Artigo em ${existingPage.titulo} =\nInicie a escrita deste verbete para a coleção.`,
          categoria: 'Geral',
          idioma: 'Português',
          dataCriacao: new Date().toISOString(),
        });
        setCurrentView('editor');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleSelectArticle = (articleId: string) => {
    confirmNavigationIfDirty(() => {
      let art = articles.find((a) => a.id.toLowerCase() === articleId.toLowerCase());
      if (!art) {
        const curated = CURATED_FEATURED_ARTICLES.find(
          (c) => c.id.toLowerCase() === articleId.toLowerCase()
        );
        if (curated) {
          art = curated;
          StorageService.saveArticle(curated);
          setArticles((prev) => [curated, ...prev.filter((p) => p.id !== curated.id)]);
        }
      }
      if (!art) {
        handleShowNotFound(articleId, 'article');
        return;
      }
      setSelectedArticleId(art.id);
      StorageService.incrementArticleViews(art.id);
      setCurrentView('article');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleNavigateToArticleByTitle = async (title: string) => {
    confirmNavigationIfDirty(async () => {
      let art = await StorageService.getArticleByTitle(title);
      if (!art) {
        const cleanTitle = title.trim().toLowerCase();
        const curated = CURATED_FEATURED_ARTICLES.find(
          (c) => c.titulo.toLowerCase() === cleanTitle || c.id.toLowerCase() === cleanTitle
        );
        if (curated) {
          art = curated;
          StorageService.saveArticle(curated);
          setArticles((prev) => [curated, ...prev.filter((p) => p.id !== curated.id)]);
        }
      }
      if (art) {
        setSelectedArticleId(art.id);
        StorageService.incrementArticleViews(art.id);
        setCurrentView('article');
      } else {
        // Se o artigo não existe, direciona para a página 404 personalizada!
        handleShowNotFound(title, 'article');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleRandomPage = () => {
    if (articles.length > 0) {
      const randomIndex = Math.floor(Math.random() * articles.length);
      const randomArticle = articles[randomIndex];
      handleSelectArticle(randomArticle.id);
    }
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) {
      setCurrentView('search');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const query = searchQuery.trim();

    // Check if query is a UID parameter, prefix, or special route
    if (
      query.startsWith('?') ||
      /^uid=/i.test(query) ||
      /^(?:Special|User|File|Arquivo|Case|Page|CheckUser):/i.test(query) ||
      query.startsWith('@')
    ) {
      handleNavigateByUid(query);
      return;
    }

    // Direct match on article ID (e.g. art-1, art-wiki-001, curated-wazzimagiygg-biography)
    const matchById = allEncyclopediaArticles.find((a) => a.id.toLowerCase() === query.toLowerCase());
    if (matchById) {
      handleSelectArticle(matchById.id);
      return;
    }

    // Direct match on page collection UID (e.g. ferrovias)
    const matchPage = pages.find(
      (p) => p.uid.toLowerCase() === query.toLowerCase() || p.titulo.toLowerCase() === query.toLowerCase()
    );
    if (matchPage) {
      handleSelectPage(matchPage.uid);
      return;
    }

    // Direct match on exact article title (case-insensitive)
    const matchExactTitle = allEncyclopediaArticles.find(
      (a) => a.titulo.toLowerCase() === query.toLowerCase()
    );
    if (matchExactTitle) {
      handleSelectArticle(matchExactTitle.id);
      return;
    }

    // Check if query has special lookup prefixes: "artigo:", "pagina:", "page:"
    const prefixLookupMatch = query.match(/^(?:artigo|pagina|page|p):(.*)$/i);
    if (prefixLookupMatch) {
      const targetTitle = prefixLookupMatch[1].trim();
      handleNavigateToArticleByTitle(targetTitle);
      return;
    }

    // Check if any articles or pages match the query in title or description
    const cleanQ = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hasArticleMatches = allEncyclopediaArticles.some((a) => {
      const t = (a.titulo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const d = (a.descricao || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const c = (a.categoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return t.includes(cleanQ) || d.includes(cleanQ) || c.includes(cleanQ);
    });
    const hasPageMatches = pages.some((p) => {
      const pt = (p.titulo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const pd = (p.descricao || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return pt.includes(cleanQ) || pd.includes(cleanQ);
    });

    if (!hasArticleMatches && !hasPageMatches) {
      // Quando o usuário tenta buscar uma página/artigo que não existe, direciona para a página 404!
      handleShowNotFound(query, 'generic');
      return;
    }

    // Navigate to Advanced Search View with results, filters, and highlighters
    setCurrentView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Handlers
  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = async (loggedUser: UserProfile) => {
    if (loggedUser.isGuest || loggedUser.role === 'convidado') {
      await StorageService.logout();
      setUser(null);
      alert('Acesso negado: O login de contas de convidados sem autenticação está desabilitado.');
      return;
    }
    const banCheck = await StorageService.getUserBanStatus(
      loggedUser.uid,
      loggedUser.email,
      loggedUser.username || loggedUser.displayName
    );
    if (banCheck.isBanned || loggedUser.isBanned) {
      await StorageService.logout();
      setUser(null);
      alert(
        `Acesso Recusado: Usuários bloqueados não podem realizar login na WikiZero.\n\nMotivo: ${
          banCheck.reason || loggedUser.banReason || 'Decisão administrativa.'
        }`
      );
      return;
    }
    const verified = await StorageService.ensureUserPage(loggedUser);
    setUser(verified);
    setTargetUserIdentifier(verified.uid);
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setUser(null);
  };

  // Notifications
  const handleMarkNotificationsAsRead = () => {
    const updated = StorageService.markNotificationsAsRead();
    setNotifications(updated);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (notif.link) {
      if (notif.link === '#mydata' || notif.link === 'mydata') {
        setShowMyDataModal(true);
        return;
      }
      if (notif.link === '#privacy' || notif.link === 'privacy') {
        setCurrentView('privacy');
        return;
      }
      handleNavigateToArticleByTitle(notif.link);
    }
  };

  // Cookie & LGPD Handlers
  const handleAcceptAllCookies = () => {
    const saved = StorageService.saveCookieConsent({
      essential: true,
      analytics: true,
      advertising: true,
    });
    setCookieConsent(saved);
  };

  const handleRejectCookies = () => {
    const saved = StorageService.saveCookieConsent({
      essential: true,
      analytics: false,
      advertising: false,
    });
    setCookieConsent(saved);
  };

  const handleSaveCustomCookies = (consentData: Omit<CookieConsent, 'timestamp' | 'version'>) => {
    const saved = StorageService.saveCookieConsent(consentData);
    setCookieConsent(saved);
  };

  const handleAcceptLgpd = (birthdate: string) => {
    const res = StorageService.saveLgpdTermsAccepted(birthdate);
    if (res.success) {
      setShowLgpdModal(false);
      const u = StorageService.getCurrentUser();
      setUser(u);
      setNotifications(StorageService.getNotifications());

      // Na primeira entrada, logo após o aceite de termos, exibir aviso de preferência e recomendação pelo Google Chrome
      if (!StorageService.isChromeRecommendationNoticed()) {
        setShowChromeRecommendationModal(true);
      }
    }
  };

  const handleDeclineLgpd = () => {
    // Keep modal in blocking barrier state
  };

  const handleRevokeConsent = () => {
    StorageService.revokeConsent();
    setCookieConsent(null);
    setShowLgpdModal(true);
    setShowMyDataModal(false);
    setNotifications(StorageService.getNotifications());
  };

  const handleRequestDeletion = () => {
    if (confirm('Tem certeza que deseja solicitar a anonimização e exclusão total dos seus dados conforme o Art. 18 da LGPD?')) {
      StorageService.clearUser();
      setUser(null);
      setShowMyDataModal(false);
      alert('Sua solicitação foi registrada. Seus dados pessoais vinculados foram desassociados e serão anonimizados em até 30 dias.');
    }
  };

  // Content Handlers
  const handleCreatePage = async (pageData: Omit<WikiPage, 'criadoEm' | 'articleCount'>) => {
    const newPage = await StorageService.createPage(pageData);
    const updatedPages = await StorageService.getPages();
    setPages(updatedPages);
    setSelectedPageUid(newPage.uid);
    setEditingArticle(null);
    setCurrentView('editor');
  };

  const handleSaveArticle = async (
    articleData: Partial<WikiArticle> & { titulo: string; pageUid: string; descricao: string },
    editSummary: string,
    isMinor?: boolean
  ) => {
    const saved = await StorageService.saveArticle(articleData, user, editSummary, isMinor);
    const updatedArticles = await StorageService.getArticles();
    const updatedPages = await StorageService.getPages();

    setArticles(updatedArticles);
    setPages(updatedPages);
    setSelectedArticleId(saved.id);
    setSelectedPageUid(saved.pageUid);
    setEditingArticle(null);
    setEditorHasUnsavedChanges(false);
    setCurrentView('article');
  };

  const handleRestoreRevision = async (historyItem: ArticleHistoryItem) => {
    if (!activeArticle) return;
    const restoredText = historyItem.conteudo || activeArticle.descricao;
    const confirmRestore = confirm(
      `Deseja realmente reverter o artigo "${activeArticle.titulo}" para a revisão de ${new Date(historyItem.data).toLocaleString('pt-BR')} feita por ${historyItem.autor}?`
    );
    if (!confirmRestore) return;

    await handleSaveArticle(
      {
        id: activeArticle.id,
        titulo: activeArticle.titulo,
        pageUid: activeArticle.pageUid,
        categoria: activeArticle.categoria,
        idioma: activeArticle.idioma,
        descricao: restoredText,
      },
      `Reversão para a revisão de ${new Date(historyItem.data).toLocaleDateString('pt-BR')} (${historyItem.autor})`,
      false
    );
  };

  const handleDeleteArticle = async (articleId: string) => {
    await StorageService.deleteArticle(articleId);
    const updatedArticles = await StorageService.getArticles();
    const updatedPages = await StorageService.getPages();
    setArticles(updatedArticles);
    setPages(updatedPages);
    setCurrentView('hub');
  };

  const handleOpenEditorForEdit = (article: WikiArticle) => {
    confirmNavigationIfDirty(() => {
      const isModOrAdmin = !!(user && (user.role === 'admin' || user.role === 'moderador'));
      if (article.isLocked && !isModOrAdmin) {
        handleNotify(
          `O artigo "${article.titulo}" está protegido pela moderação (${article.lockReason || 'bloqueio administrativo'}). Apenas moderadores e administradores podem editar.`,
          'warning'
        );
        return;
      }
      setEditingArticle(article);
      setEditorHasUnsavedChanges(false);
      setCurrentView('editor');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleOpenNewEditor = (defaultUid?: string) => {
    confirmNavigationIfDirty(() => {
      const isModOrAdmin = !!(user && (user.role === 'admin' || user.role === 'moderador'));
      if (defaultUid && !isModOrAdmin) {
        const targetPage = pages.find((p) => p.uid.toLowerCase() === defaultUid.toLowerCase());
        if (targetPage && targetPage.isLocked) {
          handleNotify(
            `A coleção "${targetPage.titulo}" está protegida pela moderação. Não é permitido criar novos artigos nela.`,
            'warning'
          );
          return;
        }
      }
      setEditingArticle(null);
      setEditorHasUnsavedChanges(false);
      if (defaultUid) setSelectedPageUid(defaultUid);
      setCurrentView('editor');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Gemini Premium & Notebook Handlers
  const handleOpenPremiumModal = (quotaType?: 'chats' | 'images' | 'notebook') => {
    setPremiumQuotaType(quotaType);
    setShowPremiumModal(true);
  };

  const handleOpenNotebookModal = () => {
    setShowNotebookModal(true);
  };

  const handleInsertFromNotebook = (articleData: {
    titulo: string;
    categoria: string;
    pageUid: string;
    descricao: string;
    resumo: string;
  }) => {
    setSelectedArticleId(null);
    setEditingArticle({
      id: '',
      titulo: articleData.titulo,
      categoria: articleData.categoria,
      pageUid: articleData.pageUid,
      idioma: 'Português',
      descricao: articleData.descricao,
      resumo: articleData.resumo,
      autor: user?.displayName || user?.username || 'Editor Gemini Notebook',
      dataCriacao: new Date().toISOString(),
      dataModificacao: new Date().toISOString(),
      versao: 1,
    } as WikiArticle);
    setSelectedPageUid(articleData.pageUid);
    setCurrentView('editor');
    setShowNotebookModal(false);
    handleNotify(`Artigo "${articleData.titulo}" gerado pelo Gemini Notebook e inserido no editor!`, 'success');
  };

  // Find active article and page
  const activeArticle =
    allEncyclopediaArticles.find((a) => a.id === selectedArticleId) ||
    allEncyclopediaArticles[0] ||
    articles[0];
  const activePage = pages.find((p) => p.uid === (activeArticle?.pageUid || selectedPageUid)) || pages[0];

  // Automatically track last visited articles in RecentlyReadService (localStorage)
  useEffect(() => {
    if (currentView === 'article' && activeArticle && activeArticle.id) {
      RecentlyReadService.addArticle({
        id: activeArticle.id,
        title: activeArticle.titulo,
        category: activeArticle.categoria,
      });
    }
  }, [currentView, activeArticle?.id, activeArticle?.titulo]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-clip">
      {/* 1. Top Header */}
      <Header
        user={user}
        notifications={notifications}
        currentView={currentView}
        searchQuery={searchQuery}
        isDark={isDark}
        theme={theme}
        deviceMode={deviceMode}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onRandomPage={handleRandomPage}
        onNavigate={handleNavigate}
        onNavigateToUser={handleNavigateToUser}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
        onToggleTheme={handleToggleTheme}
        onSetTheme={handleSetTheme}
        onToggleDeviceMode={handleToggleDeviceMode}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenMobileSearch={() => setIsMobileSearchOpen(true)}
        onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
        onNotificationClick={handleNotificationClick}
        onOpenLanguagesModal={() => setShowLanguageModal(true)}
        onOpenSmartTVModal={() => setShowSmartTVModal(true)}
        onRebootWin7={() => setShowWin7Boot(true)}
        onRebootWin10={() => setShowWin10Boot(true)}
        onRebootWinXP={() => setShowWinXPBoot(true)}
        onRebootWin95={() => setShowWin95Boot(true)}
        onRebootWin31={() => setShowWin31Boot(true)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 gap-3 lg:gap-6 min-w-0">
        {/* Collapsible Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          isCollapsed={isSidebarCollapsed}
          theme={theme}
          isDark={isDark}
          deviceMode={deviceMode}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onNavigate={handleNavigate}
          onRandomPage={handleRandomPage}
          onCreatePageClick={() => setShowCreatePageModal(true)}
          totalPages={pages.length}
          totalArticles={articles.length}
          onSetTheme={handleSetTheme}
          onOpenLanguagesModal={() => setShowLanguageModal(true)}
          onOpenSmartTVModal={() => setShowSmartTVModal(true)}
          onOpenGeminiChatbot={() => setShowGeminiChatbot(true)}
          onOpenGeminiNotebook={handleOpenNotebookModal}
          onOpenGeminiPremium={() => handleOpenPremiumModal()}
          onSelectArticle={handleSelectArticle}
        />

        {/* Content Body Container */}
        <main className="flex-1 min-w-0 w-full max-w-full overflow-x-clip">
          {/* Wikidiota Native Wikipedia Vector Tabs & Wikiomite Foundation Notice */}
          {theme === 'wikidiota' && (
            <div className="wikidiota-vector-header mb-4 select-none">
              {/* Vector Tabs Navigation Bar */}
              <div className="flex items-end justify-between border-b border-[#a7d7f9] text-xs font-sans overflow-x-auto scrollbar-none max-w-full">
                {/* Left Tabs (Namespaces) */}
                <div className="flex items-center gap-1 -mb-px">
                  <button
                    onClick={() => {
                      if (currentView !== 'article' && currentView !== 'hub') {
                        handleNavigate('hub');
                      }
                    }}
                    className={`px-3 py-1.5 border border-b-0 rounded-t-xs font-medium text-[13px] transition ${
                      currentView === 'article' || currentView === 'hub'
                        ? 'bg-white border-[#a7d7f9] text-[#202122] font-semibold shadow-2xs'
                        : 'bg-[#f6f6f6] border-transparent text-[#0645ad] hover:text-[#0b0080]'
                    }`}
                  >
                    Artigo
                  </button>
                  <button
                    onClick={() => {
                      handleNotify('Discussão arquivada pela Wikiomite Foundation. Nenhum consenso sensato alcançado.', 'info');
                      alert('Discussão da Wikidiota: Nenhum consenso alcançado ainda pela Wikiomite Foundation!');
                    }}
                    className="px-3 py-1.5 border border-transparent border-b-0 text-[#0645ad] hover:text-[#0b0080] hover:bg-[#f0f0f0] rounded-t-xs transition text-[13px]"
                  >
                    Discussão
                  </button>
                </div>

                {/* Right Tabs (Views & Actions) */}
                <div className="flex items-center gap-1 -mb-px">
                  <button
                    onClick={() => {
                      if (currentView === 'editor') {
                        if (activeArticle) setCurrentView('article');
                        else setCurrentView('hub');
                      }
                    }}
                    className={`px-3 py-1.5 border border-b-0 rounded-t-xs text-[13px] transition ${
                      currentView !== 'editor'
                        ? 'bg-white border-[#a7d7f9] text-[#202122] font-semibold shadow-2xs'
                        : 'bg-[#f6f6f6] border-transparent text-[#0645ad] hover:text-[#0b0080]'
                    }`}
                  >
                    Ler
                  </button>
                  <button
                    onClick={() => {
                      if (activeArticle) {
                        handleOpenEditorForEdit(activeArticle);
                      } else {
                        handleOpenNewEditor();
                      }
                    }}
                    className={`px-3 py-1.5 border border-b-0 rounded-t-xs text-[13px] transition ${
                      currentView === 'editor'
                        ? 'bg-white border-[#a7d7f9] text-[#202122] font-semibold shadow-2xs'
                        : 'bg-[#f6f6f6] border-transparent text-[#0645ad] hover:text-[#0b0080]'
                    }`}
                  >
                    Editar código-fonte
                  </button>
                  <button
                    onClick={() => handleNavigate('recent-changes')}
                    className="px-2.5 py-1.5 border border-transparent border-b-0 text-[#0645ad] hover:text-[#0b0080] rounded-t-xs transition text-[13px] hidden sm:inline"
                  >
                    Ver histórico
                  </button>
                  <span
                    className="px-2 py-1.5 text-[#f59e0b] cursor-pointer hover:scale-110 transition text-sm"
                    title="Vigiar esta página (Wikiomite Foundation)"
                  >
                    ★
                  </span>
                </div>
              </div>

              {/* Subtle loading bar animation below the tabs when switching view modes */}
              <div className="h-[2px] w-full bg-[#f0f8ff] overflow-hidden">
                {isVectorTabTransitioning ? (
                  <div className="h-full bg-[#3366cc] animate-pulse w-full transition-all duration-300" />
                ) : (
                  <div className="h-full bg-transparent w-full" />
                )}
              </div>

              {/* Humorous Wikipedia / Wikiomite Foundation Notice Box */}
              <div className="wikidiota-notice-box flex items-center justify-between gap-3 mt-2 rounded-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚠️</span>
                  <div className="text-xs text-[#202122]">
                    <strong className="text-[#ba0000]">Wikidiota: Verificabilidade duvidosa.</strong>{' '}
                    <span>
                      Esta página é mantida pela <strong>Wikiomite Foundation</strong>. Qualquer idiota pode editar e melhorar o conteúdo sem necessidade de bom senso acadêmico.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-[#72777d] font-mono shrink-0 hidden md:inline">
                  [carece de fontes confiáveis]
                </span>
              </div>
            </div>
          )}

          {currentView === 'hub' && (
            <WikiHub
              pages={pages}
              articles={allEncyclopediaArticles}
              user={user}
              searchQuery={searchQuery}
              onSelectPage={handleSelectPage}
              onSelectArticle={handleSelectArticle}
              onCreatePageClick={() => setShowCreatePageModal(true)}
              onCreateArticleClick={(uid) => handleOpenNewEditor(uid)}
              onOpenEditor={() => handleOpenNewEditor()}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'recent-changes' && (
            <RecentChanges
              articles={articles}
              pages={pages}
              currentUser={user}
              onSelectArticle={handleSelectArticle}
              onSelectPage={handleSelectPage}
              onOpenEditorForEdit={handleOpenEditorForEdit}
              onOpenNewEditor={(uid) => handleOpenNewEditor(uid)}
              onCreatePageClick={() => setShowCreatePageModal(true)}
              onNavigateToUser={handleNavigateToUser}
            />
          )}

          {currentView === 'article' && (
            activeArticle ? (
              <ArticleViewer
                article={activeArticle}
                page={activePage}
                user={user}
                allArticles={allEncyclopediaArticles}
                allPages={pages}
                onEdit={handleOpenEditorForEdit}
                onDelete={handleDeleteArticle}
                onNavigateToPage={handleSelectPage}
                onNavigateToArticleByTitle={handleNavigateToArticleByTitle}
                onNavigateToArticleById={handleSelectArticle}
                onNavigateToUser={handleNavigateToUser}
                onBack={() => handleNavigate('hub')}
                onRestoreRevision={handleRestoreRevision}
                onArticleUpdated={(updated) =>
                  setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
                }
              />
            ) : (
              <NotFoundView
                query={selectedArticleId || 'Artigo'}
                notFoundType="article"
                articles={articles}
                pages={pages}
                theme={theme}
                onSearch={(newQuery) => {
                  setSearchQuery(newQuery);
                  const norm = newQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                  const found = articles.some((a) => {
                    const t = (a.titulo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    const d = (a.descricao || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    return t.includes(norm) || d.includes(norm);
                  });
                  if (found) {
                    setCurrentView('search');
                  } else {
                    handleShowNotFound(newQuery, 'generic');
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenEditor={(title) => {
                  setEditingArticle({
                    id: '',
                    pageUid: pages[0]?.uid || 'wikizero_info',
                    titulo: title || 'Novo Artigo',
                    descricao: `= ${title || 'Novo Artigo'} =\nEste artigo ainda não foi escrito na enciclopédia livre WikiWorldWeb. Seja o primeiro a contribuir com seu conhecimento!`,
                    categoria: 'Geral',
                    idioma: 'Português',
                    dataCriacao: new Date().toISOString(),
                  });
                  setCurrentView('editor');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateHome={() => handleNavigate('hub')}
                onRandomPage={handleRandomPage}
                onSelectArticle={handleSelectArticle}
                onSelectPage={handleSelectPage}
                onNavigateSpecialPages={() => handleNavigate('special-pages')}
              />
            )
          )}

          {currentView === 'special-pages' && (
            <SpecialPagesView
              articles={articles}
              pages={pages}
              user={user}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToPage={handleSelectPage}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onNavigateToEmergencyContact={() => handleNavigate('emergency-contact')}
              onNavigateToUcoc={() => handleNavigate('ucoc')}
              onNavigateToEditingEthics={(tab) => {
                if (tab) setEditingEthicsInitialTab(tab);
                handleNavigate('editing-ethics');
              }}
              onNavigateToPromotionRequests={() => handleNavigate('promotion-requests')}
              onNavigateToUnblockRequests={() => handleNavigate('unblock-requests')}
              onNavigateToDataRemovalRequests={() => handleNavigate('admin-data-removal')}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onNavigateToAdminDashboard={() => handleNavigate('admin-dashboard')}
              onNavigateToUsersList={() => handleNavigate('admin-users')}
              onNavigateToAdminCouncil={() => handleNavigate('admin-council')}
              onNavigateToExtensions={() => handleNavigate('admin-extensions')}
              onNavigateToUpload={() => handleNavigateToUpload()}
              onNavigateToFilesList={() => handleNavigate('files-list')}
              onNavigateToArbitration={() => handleNavigate('arbitration')}
              onNavigateToAppearance={() => handleNavigate('appearance')}
              onNavigateToAdminFirebase={() => handleNavigate('admin-firebase')}
              onNavigateToNotFound={() => handleShowNotFound('Special:NotFound', 'generic')}
              onNavigateToTools={() => handleNavigate('tools')}
              onNavigateToLibrary={() => handleNavigate('library')}
              onNavigateToAcademic={() => handleNavigate('academic')}
              onNavigateToNews={() => handleNavigate('news')}
              initialTab="all"
            />
          )}

          {currentView === 'watchlist' && (
            <SpecialPagesView
              articles={articles}
              pages={pages}
              user={user}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToPage={handleSelectPage}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onNavigateToEmergencyContact={() => handleNavigate('emergency-contact')}
              onNavigateToUcoc={() => handleNavigate('ucoc')}
              onNavigateToEditingEthics={(tab) => {
                if (tab) setEditingEthicsInitialTab(tab);
                handleNavigate('editing-ethics');
              }}
              onNavigateToPromotionRequests={() => handleNavigate('promotion-requests')}
              onNavigateToUnblockRequests={() => handleNavigate('unblock-requests')}
              onNavigateToDataRemovalRequests={() => handleNavigate('admin-data-removal')}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onNavigateToAdminDashboard={() => handleNavigate('admin-dashboard')}
              onNavigateToUsersList={() => handleNavigate('admin-users')}
              onNavigateToAdminCouncil={() => handleNavigate('admin-council')}
              onNavigateToExtensions={() => handleNavigate('admin-extensions')}
              onNavigateToUpload={() => handleNavigateToUpload()}
              onNavigateToFilesList={() => handleNavigate('files-list')}
              onNavigateToArbitration={() => handleNavigate('arbitration')}
              onNavigateToAppearance={() => handleNavigate('appearance')}
              onNavigateToAdminFirebase={() => handleNavigate('admin-firebase')}
              onNavigateToNotFound={() => handleShowNotFound('Special:NotFound', 'generic')}
              onNavigateToTools={() => handleNavigate('tools')}
              onNavigateToLibrary={() => handleNavigate('library')}
              onNavigateToAcademic={() => handleNavigate('academic')}
              onNavigateToNews={() => handleNavigate('news')}
              initialTab="watchlist"
            />
          )}

          {currentView === 'upload' && (
            <FileUploadView
              user={user}
              initialTargetName={uploadInitialTargetName}
              onNavigateToFile={handleNavigateToFile}
              onNavigateToGallery={() => handleNavigate('files-list')}
              onNotify={handleNotify}
            />
          )}

          {currentView === 'file-page' && (
            <FilePageView
              fileName={selectedFileName || 'Logo_WikiZero.svg'}
              articles={articles}
              user={user}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToUpload={handleNavigateToUpload}
              onNavigateToGallery={() => handleNavigate('files-list')}
              onNotify={handleNotify}
            />
          )}

          {currentView === 'files-list' && (
            <FilesGalleryView
              user={user}
              onNavigateToFile={handleNavigateToFile}
              onNavigateToUpload={() => handleNavigateToUpload()}
            />
          )}

          {currentView === 'user-page' && (
            <UserPageView
              targetUserIdentifier={targetUserIdentifier || user?.uid || user?.displayName || user?.username || 'WazzimaGiygg'}
              currentUser={user}
              allArticles={articles}
              allPages={pages}
              initialTab={userPageInitialTab}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToPage={handleSelectPage}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onNavigateToPromotionRequests={() => handleNavigate('promotion-requests')}
              onNavigateToUnblockRequests={() => handleNavigate('unblock-requests')}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {(currentView === 'admin-dashboard' ||
            currentView === 'admin-users' ||
            currentView === 'admin-council' ||
            currentView === 'admin-data-removal' ||
            currentView === 'unblock-requests' ||
            currentView === 'admin-extensions') && (
            <UnifiedAdminDashboard
              currentUser={user}
              initialTab={
                currentView === 'admin-council'
                  ? 'council'
                  : currentView === 'admin-data-removal'
                  ? 'data-removal'
                  : currentView === 'unblock-requests'
                  ? 'unblock-requests'
                  : currentView === 'admin-extensions'
                  ? 'extensions'
                  : 'users'
              }
              onNavigateToUser={handleNavigateToUser}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onNavigateToPromotionRequests={() => handleNavigate('promotion-requests')}
              onNavigateToArbitration={() => handleNavigate('arbitration')}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onNavigateToUCoC={() => handleNavigate('ucoc')}
              onNavigateToFirebaseAdmin={() => handleNavigate('admin-firebase')}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'checkuser' && (
            <CheckUserView
              currentUser={user}
              initialTarget={targetUserIdentifier || 'Usuario_Suspeito'}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToArticle={handleSelectArticle}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'promotion-requests' && (
            <PromotionRequestsView
              currentUser={user}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToAdminCouncil={() => handleNavigate('admin-council')}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'contact-admin' && (
            <ContactAdminView
              currentUser={user}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToEmergencyContact={() => handleNavigate('emergency-contact')}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'emergency-contact' && (
            <EmergencyContactView
              currentUser={user}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onLoginClick={handleLoginClick}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onNavigateToArbCom={() => handleNavigate('arbitration')}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'ucoc' && (
            <UcocView
              currentUser={user}
              articles={articles}
              initialTab={ucocInitialTab}
              initialProtocol={ucocInitialProtocol}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onNavigateToEmergencyContact={() => handleNavigate('emergency-contact')}
              onNavigateToArbitration={() => handleNavigate('arbitration')}
              onLoginClick={handleLoginClick}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'arbitration' && (
            <ArbitrationCommitteeView
              user={user}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToArticle={handleSelectArticle}
              onLoginClick={() => setShowLgpdModal(true)}
            />
          )}

          {currentView === 'admin-firebase' && (
            <FirebaseAdminDashboard
              currentUser={user}
              pages={pages}
              articles={articles}
              onNavigateToPage={handleSelectPage}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToUpdates={() => handleNavigate('site-updates')}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'vpn-checker' && (
            <VpnSecurityChecker
              currentUser={user}
              onBack={() => handleNavigate('hub')}
              onOpenLoginModal={() => setShowLoginModal(true)}
            />
          )}

          {currentView === 'editor' && (
            <WikitextEditor
              initialArticle={editingArticle}
              defaultPageUid={selectedPageUid || undefined}
              pages={pages}
              user={user}
              onSave={handleSaveArticle}
              onCancel={() => {
                setEditorHasUnsavedChanges(false);
                handleNavigate(selectedArticleId ? 'article' : 'hub');
              }}
              onOpenLoginModal={handleLoginClick}
              onOpenPremiumModal={handleOpenPremiumModal}
              onOpenNotebookModal={handleOpenNotebookModal}
              onDirtyChange={(isDirty, isNew) => {
                setEditorHasUnsavedChanges(isDirty);
                setEditorIsNewArticle(isNew);
              }}
            />
          )}

          {currentView === 'security' && (
            <SecurityView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'donation' && (
            <DonationView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'privacy' && (
            <PrivacyPolicyView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'terms' && (
            <TermsOfUseView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'editing-ethics' && (
            <EditingEthicsView
              user={user}
              onNavigate={handleNavigate}
              onOpenEditor={() => handleOpenNewEditor()}
              initialTab={editingEthicsInitialTab}
            />
          )}

          {currentView === 'beta' && (
            <BetaModeView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'offline' && (
            <OfflineModeView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
              onOpenSmartTVModal={() => setShowSmartTVModal(true)}
            />
          )}

          {currentView === 'site-updates' && (
            <SiteUpdatesView
              currentUser={user}
              onNavigateHome={() => handleNavigate('hub')}
              onSelectSpecialPage={(p) => handleNavigate(p as any)}
            />
          )}

          {currentView === 'appearance' && (
            <AppearanceSettingsView
              currentTheme={theme}
              onSetTheme={handleSetTheme}
              deviceMode={deviceMode}
              onToggleDeviceMode={handleToggleDeviceMode}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'search' && (
            <AdvancedSearchView
              articles={allEncyclopediaArticles}
              pages={pages}
              user={user}
              initialQuery={searchQuery}
              theme={theme}
              onSearchQueryChange={(q) => setSearchQuery(q)}
              onSelectArticle={handleSelectArticle}
              onSelectPage={handleSelectPage}
              onOpenNewEditor={() => handleOpenNewEditor()}
              onNavigateHome={() => handleNavigate('hub')}
              onNavigateTo404={(q) => handleShowNotFound(q, 'generic')}
            />
          )}

          {currentView === 'not-found' && (
            <NotFoundView
              query={notFoundQuery}
              notFoundType={notFoundType}
              articles={allEncyclopediaArticles}
              pages={pages}
              theme={theme}
              onSearch={(newQuery) => {
                setSearchQuery(newQuery);
                const norm = newQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                const found = allEncyclopediaArticles.some((a) => {
                  const t = (a.titulo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  const d = (a.descricao || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  return t.includes(norm) || d.includes(norm);
                });
                if (found) {
                  setCurrentView('search');
                } else {
                  handleShowNotFound(newQuery, 'generic');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenEditor={(title) => {
                setEditingArticle({
                  id: '',
                  pageUid: pages[0]?.uid || 'wikizero_info',
                  titulo: title || 'Novo Artigo',
                  descricao: `= ${title || 'Novo Artigo'} =\nEste artigo ainda não foi escrito na enciclopédia livre WikiWorldWeb. Seja o primeiro a contribuir com seu conhecimento!`,
                  categoria: 'Geral',
                  idioma: 'Português',
                  dataCriacao: new Date().toISOString(),
                });
                setCurrentView('editor');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateHome={() => handleNavigate('hub')}
              onRandomPage={handleRandomPage}
              onSelectArticle={handleSelectArticle}
              onSelectPage={handleSelectPage}
              onNavigateSpecialPages={() => handleNavigate('special-pages')}
            />
          )}

          {currentView === 'comparison' && (
            <WikiCompetitorComparisonView
              onNavigate={handleNavigate}
              onOpenEditor={() => handleOpenNewEditor()}
              onOpenGeminiChatbot={() => setShowGeminiChatbot(true)}
              onOpenGeminiNotebook={handleOpenNotebookModal}
            />
          )}

          {currentView === 'wazzimagiygg' && (
            <WazzimaGiyggProfileView
              onNavigate={handleNavigate}
              onOpenEditor={() => handleOpenNewEditor()}
              onSelectArticle={handleSelectArticle}
            />
          )}

          {currentView === 'tools' && (
            <ToolsView
              theme={theme}
              initialTab={toolsInitialTab}
              onNavigateHome={() => handleNavigate('hub')}
              onNavigateToExtensions={() => handleNavigate('admin-extensions')}
              onOpenEditor={(title) => {
                if (title) {
                  setEditingArticle({
                    id: '',
                    pageUid: pages[0]?.uid || 'wikizero_info',
                    titulo: title,
                    descricao: `= ${title} =\nArtigo criado através do painel de ferramentas da WikiWorldWeb.`,
                    categoria: 'Geral',
                    idioma: 'Português',
                    dataCriacao: new Date().toISOString(),
                  });
                  setCurrentView('editor');
                } else {
                  handleOpenNewEditor();
                }
              }}
            />
          )}

          {currentView === 'library' && (
            <LibraryCatalogView
              currentUser={user}
              onNavigateToArticle={(title) => {
                const found = articles.find(
                  (a) => a.titulo.toLowerCase().trim() === title.toLowerCase().trim()
                );
                if (found) {
                  handleSelectArticle(found.id);
                } else {
                  setEditingArticle({
                    id: '',
                    pageUid: pages[0]?.uid || 'wikizero_info',
                    titulo: title,
                    descricao: `= ${title} =\nArtigo associado ao acervo bibliográfico da WikiWorldWeb.`,
                    categoria: 'Livros e Periódicos',
                    idioma: 'Português',
                    dataCriacao: new Date().toISOString(),
                  });
                  setCurrentView('editor');
                }
              }}
              onNavigateBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'academic' && (
            <AcademicCatalogView
              currentUser={user}
              onNavigateToArticle={(title) => {
                const found = articles.find(
                  (a) => a.titulo.toLowerCase().trim() === title.toLowerCase().trim()
                );
                if (found) {
                  handleSelectArticle(found.id);
                } else {
                  setEditingArticle({
                    id: '',
                    pageUid: pages[0]?.uid || 'wikizero_info',
                    titulo: title,
                    descricao: `= ${title} =\nArtigo associado à produção científica do Wiki Universitário.`,
                    categoria: 'Wiki Universitário',
                    idioma: 'Português',
                    dataCriacao: new Date().toISOString(),
                  });
                  setCurrentView('editor');
                }
              }}
              onNavigateBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'news' && (
            <JornalNewsView
              onNavigateBack={() => handleNavigate('hub')}
              onNavigateToArticle={(title) => {
                const found = articles.find(
                  (a) => a.titulo.toLowerCase().trim() === title.toLowerCase().trim()
                );
                if (found) {
                  handleSelectArticle(found.id);
                } else {
                  setEditingArticle({
                    id: '',
                    pageUid: pages[0]?.uid || 'wikizero_info',
                    titulo: title,
                    descricao: `= ${title} =\nArtigo relacionado à cobertura noticiosa do Jornal WazzimaGiygg.\n\n== Referências ==\n* [https://jornal.wazzimagiygg.com/ Jornal WazzimaGiygg - Portal Oficial]`,
                    categoria: 'Notícias & Jornalismo',
                    idioma: 'Português',
                    dataCriacao: new Date().toISOString(),
                  });
                  setCurrentView('editor');
                }
              }}
            />
          )}

          {currentView === 'mydata' && (
            <div className="max-w-xl mx-auto">
              <button
                onClick={() => setShowMyDataModal(true)}
                className="w-full py-4 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
              >
                Abrir Painel do Titular de Dados
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 3. Global Footer */}
      <Footer
        onNavigate={handleNavigate}
        theme={theme}
        deviceMode={deviceMode}
        onToggleDeviceMode={handleToggleDeviceMode}
        onSetTheme={handleSetTheme}
        onRebootWin7={() => setShowWin7Boot(true)}
        onRebootWin10={() => setShowWin10Boot(true)}
        onRebootWinXP={() => setShowWinXPBoot(true)}
        onRebootWin95={() => setShowWin95Boot(true)}
        onOpenLanguagesModal={() => setShowLanguageModal(true)}
        onOpenChromeRecommendation={() => setShowChromeRecommendationModal(true)}
      />

      {/* 4. Mobile Bottom Navigation Bar (Fixed at bottom for smartphones) */}
      <MobileBottomNav
        currentView={currentView}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        unreadCount={notifications.filter((n) => !n.read).length}
        onNavigate={handleNavigate}
        onRandomPage={handleRandomPage}
        onOpenNewArticle={() => handleOpenNewEditor()}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenMenuDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenSearch={() => setIsMobileSearchOpen(true)}
      />

      {/* 5. Mobile Search Fullscreen Modal */}
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        articles={articles}
        pages={pages}
        onSelectArticle={(id) => handleSelectArticle(id)}
        onSelectPage={(uid) => handleSelectPage(uid)}
        onSearchQuerySubmit={(q) => {
          setSearchQuery(q);
          setCurrentView('search');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdvancedSearch={(q) => {
          if (q) setSearchQuery(q);
          setCurrentView('search');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 6. Mobile Side Drawer Navigation Menu */}
      <MobileDrawerMenu
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentView={currentView}
        user={user}
        isDark={isDark}
        theme={theme}
        deviceMode={deviceMode}
        totalPages={pages.length}
        totalArticles={articles.length}
        onNavigate={handleNavigate}
        onToggleTheme={handleToggleTheme}
        onSetTheme={handleSetTheme}
        onToggleDeviceMode={handleToggleDeviceMode}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
        onCreatePageClick={() => {
          setIsMobileDrawerOpen(false);
          setShowCreatePageModal(true);
        }}
        onOpenLanguagesModal={() => {
          setIsMobileDrawerOpen(false);
          setShowLanguageModal(true);
        }}
        onOpenSmartTVModal={() => {
          setIsMobileDrawerOpen(false);
          setShowSmartTVModal(true);
        }}
      />

      {/* 7. Modals & Overlays */}
      {/* Banned User Alert Overlay */}
      {user?.isBanned && (
        <BannedOverlay
          reason={user.banReason}
          currentUser={user}
          onLogout={handleLogout}
        />
      )}

      {/* First-visit LGPD Term Modal & Age Verification Gate */}
      <LgpdConsentModal
        isOpen={showLgpdModal}
        isAlreadyAccepted={StorageService.isLgpdTermsAccepted()}
        onClose={() => {
          if (StorageService.isLgpdTermsAccepted()) {
            setShowLgpdModal(false);
          }
        }}
        onAccept={handleAcceptLgpd}
        onDecline={handleDeclineLgpd}
      />

      {/* Language Selection Modal */}
      <LanguageModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      {/* Create Topic Collection Modal */}
      <CreatePageModal
        isOpen={showCreatePageModal}
        user={user}
        onClose={() => setShowCreatePageModal(false)}
        onCreate={handleCreatePage}
      />

      {/* Login Modal with reCAPTCHA verification */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onOpenVpnChecker={() => {
          setShowLoginModal(false);
          handleNavigate('vpn-checker');
        }}
      />

      {/* Modal Global de Alterações Não Salvas no Editor */}
      <UnsavedChangesModal
        isOpen={showExitEditorConfirmModal}
        isNewArticle={editorIsNewArticle}
        articleTitle={editingArticle?.titulo}
        onStay={handleStayInEditorFromApp}
        onDiscardAndLeave={handleConfirmDiscardFromApp}
      />

      {/* Aviso de recomendação e preferência pelo Google Chrome na primeira entrada */}
      <ChromeRecommendationModal
        isOpen={showChromeRecommendationModal}
        onClose={() => setShowChromeRecommendationModal(false)}
        onOpenChromeAppGuide={() => {
          setShowChromeRecommendationModal(false);
          handleNavigate('tools');
        }}
      />

      {/* My Data Portability Modal */}
      <MyDataModal
        isOpen={showMyDataModal || currentView === 'mydata'}
        user={user}
        consent={cookieConsent}
        onClose={() => {
          setShowMyDataModal(false);
          if (currentView === 'mydata') setCurrentView('hub');
        }}
        onRevokeConsent={handleRevokeConsent}
        onRequestDeletion={handleRequestDeletion}
        onRefreshNotifications={() => setNotifications(StorageService.getNotifications())}
      />

      {/* Cookie Consent Banner */}
      {!cookieConsent && (
        <CookieBanner
          onAcceptAll={handleAcceptAllCookies}
          onRejectAll={handleRejectCookies}
          onSaveCustom={handleSaveCustomCookies}
        />
      )}

      {/* Smart TV Modal & Guide */}
      <SmartTVInstallModal
        isOpen={showSmartTVModal}
        onClose={() => setShowSmartTVModal(false)}
        onLaunchTVMode={() => {
          handleToggleDeviceMode('tv');
          handleNavigate('smart-tv');
        }}
      />

      {/* Smart TV 10-Foot Standalone Screen */}
      {currentView === 'smart-tv' && (
        <SmartTVView
          articles={articles}
          pages={pages}
          currentUser={user}
          onExitTVMode={() => {
            handleToggleDeviceMode('auto');
            handleNavigate('hub');
          }}
          onSelectArticleInDesktop={(artId) => {
            handleToggleDeviceMode('desktop');
            handleSelectArticle(artId);
          }}
        />
      )}

      {/* Network & PWA Offline Indicator */}
      <OfflineIndicator />

      {/* Floating Assistant Launcher: Windows 95 Clippy Bot vs Standard Gemini Trigger */}
      {currentView !== 'smart-tv' && (
        theme === 'win95' ? (
          <Windows95Bot
            onRandomArticle={handleRandomPage}
            onOpenSearch={() => {
              setCurrentView('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenGeminiFull={() => setShowGeminiChatbot(true)}
            currentArticleTitle={articles.find((a) => a.id === selectedArticleId)?.titulo}
          />
        ) : (
          <button
            id="wikizero-gemini-floating-trigger"
            type="button"
            onClick={() => setShowGeminiChatbot(true)}
            className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold border border-white/20 select-none cursor-pointer"
            title="Abrir Chatbot Gemini (Google AI Studio) - Auxílio em Artigos e Coleções"
          >
            <Sparkles size={16} className="text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">Assistente Gemini</span>
          </button>
        )
      )}

      {/* Global Gemini Chatbot Drawer */}
      <GeminiChatbotDrawer
        isOpen={showGeminiChatbot}
        onClose={() => setShowGeminiChatbot(false)}
        contextMode="general"
        currentUser={user}
        onOpenLoginModal={handleLoginClick}
        onOpenPremiumModal={handleOpenPremiumModal}
        onOpenNotebook={handleOpenNotebookModal}
        onApplyToCollection={(col) => {
          setShowGeminiChatbot(false);
          setShowCreatePageModal(true);
        }}
        onApplyToArticle={(wikitext, mode) => {
          setShowGeminiChatbot(false);
          StorageService.saveDraft({
            title: 'Novo Artigo Gemini',
            content: wikitext,
            pageUid: 'geral',
          });
          handleOpenNewEditor('geral');
          handleNotify('Conteúdo do Gemini carregado no editor!', 'success');
        }}
      />

      {/* Gemini Premium Upsell Modal */}
      <GeminiPremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        user={user}
        quotaTypeTriggered={premiumQuotaType}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
          handleNotify('Plano Gemini Premium ativado com sucesso! Aproveite recursos ilimitados.', 'success');
        }}
      />

      {/* Gemini Notebook Modal & Article Synthesis Generator */}
      {showNotebookModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
            <GeminiNotebook
              user={user}
              currentUser={user}
              pages={pages}
              articles={articles}
              existingArticles={articles}
              onOpenArticle={handleSelectArticle}
              onInsertArticle={handleInsertFromNotebook}
              onOpenPremiumModal={handleOpenPremiumModal}
              onClose={() => setShowNotebookModal(false)}
            />
          </div>
        </div>
      )}

      {/* 8. Menu Alternativo do Botão Direito (por símbolos) */}
      <CustomContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        onRefresh={handleContextMenuRefresh}
        onHome={handleContextMenuHome}
        onTools={handleContextMenuTools}
      />

      {/* 9. Animação de Inicialização Clássica Windows 3.1, Windows 95 e Windows XP (Boot Loader) */}
      {showWin31Boot && (
        <Windows31BootScreen
          onComplete={() => setShowWin31Boot(false)}
        />
      )}

      {showWin95Boot && (
        <Windows95BootScreen
          onComplete={() => setShowWin95Boot(false)}
        />
      )}

      {showWinXPBoot && (
        <WindowsXPBootScreen
          onComplete={() => setShowWinXPBoot(false)}
        />
      )}

      {/* Windows 7 Aero Boot Screen */}
      {showWin7Boot && (
        <Windows7BootScreen
          onComplete={() => setShowWin7Boot(false)}
        />
      )}

      {/* Windows 10 Fluent Boot Screen */}
      {showWin10Boot && (
        <Windows10BootScreen
          onComplete={() => setShowWin10Boot(false)}
        />
      )}
    </div>
  );
};
