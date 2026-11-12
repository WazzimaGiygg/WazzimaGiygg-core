import { WikiArticle, WikiPage, ViewMode } from '../types';

export type ResolvedNavigationTarget =
  | { type: 'article'; articleId: string; article?: WikiArticle }
  | { type: 'article-title'; title: string }
  | { type: 'page'; pageUid: string }
  | { type: 'view'; view: ViewMode; initialTab?: string; initialProtocol?: string }
  | { type: 'user'; username: string; initialTab?: 'profile' | 'talk' | 'contributions' | 'admin' }
  | { type: 'file'; fileName: string }
  | { type: 'arbitration-case'; caseId: string }
  | { type: 'checkuser'; target: string }
  | { type: 'upload'; targetName?: string }
  | { type: 'create-page' }
  | { type: 'editor'; articleId?: string; pageUid?: string; title?: string }
  | { type: 'not-found'; query: string };

/**
 * Normalizes text for lenient matching (removes accents, lowercase, replaces underscores with spaces)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, ' ')
    .trim();
}

/**
 * Extract `uid` or fallback parameters from the current URL
 */
export function getUidFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    // 1. Primary check: ?uid= parameter
    const uid = searchParams.get('uid');
    if (uid && uid.trim()) {
      return uid.trim();
    }

    // Also support ?id= or ?p= as fallback query parameters
    const fallbackId = searchParams.get('id') || searchParams.get('p') || searchParams.get('page');
    if (fallbackId && fallbackId.trim()) {
      return fallbackId.trim();
    }

    // 2. Hash fallback (#wiki:..., #uid=..., #file:...)
    const hash = window.location.hash;
    if (hash) {
      if (hash.startsWith('#uid=')) {
        return decodeURIComponent(hash.substring(5)).trim();
      }
      if (hash.startsWith('#wiki:')) {
        return decodeURIComponent(hash.substring(6)).trim();
      }
      if (hash.startsWith('#file:') || hash.startsWith('#arquivo:') || hash.startsWith('#ficheiro:')) {
        const parts = hash.split(':');
        return `File:${decodeURIComponent(parts.slice(1).join(':'))}`.trim();
      }
      if (hash.startsWith('#upload:')) {
        return `Upload:${decodeURIComponent(hash.substring(8))}`.trim();
      }
      if (hash.startsWith('#user:')) {
        return `User:${decodeURIComponent(hash.substring(6))}`.trim();
      }
      if (hash.startsWith('#/')) {
        return decodeURIComponent(hash.substring(2)).trim();
      }
    }
  } catch (err) {
    console.warn('Error parsing URL for UID:', err);
  }

  return null;
}

/**
 * Updates the browser's address bar with `?uid=<uid>` using pushState / replaceState without page reloads.
 */
export function setBrowserUid(uid: string | null, mode: 'push' | 'replace' = 'replace'): void {
  if (typeof window === 'undefined') return;

  try {
    const url = new URL(window.location.href);

    if (!uid || uid === 'hub' || uid === 'home') {
      url.searchParams.delete('uid');
      url.searchParams.delete('id');
      url.searchParams.delete('p');
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('uid', uid);
    }

    const newRelativePathQuery = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
    const currentRelative = window.location.pathname + window.location.search + window.location.hash;

    if (newRelativePathQuery !== currentRelative) {
      if (mode === 'push') {
        window.history.pushState({ uid }, '', newRelativePathQuery);
      } else {
        window.history.replaceState({ uid }, '', newRelativePathQuery);
      }
    }
  } catch (err) {
    console.warn('Error setting browser UID in URL:', err);
  }
}

/**
 * Builds a shareable full permalink URL for a given UID
 */
export function buildUidPermalink(uid: string): string {
  if (typeof window === 'undefined') return `?uid=${encodeURIComponent(uid)}`;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('uid', uid);
    return url.toString();
  } catch {
    return `${window.location.origin}/?uid=${encodeURIComponent(uid)}`;
  }
}

/**
 * Returns the canonical UID string representing the current view/content in the app
 */
export function getCanonicalUid(
  view: ViewMode,
  options: {
    selectedArticle?: WikiArticle | null;
    selectedPageUid?: string | null;
    targetUserIdentifier?: string;
    selectedFileName?: string;
    uploadInitialTargetName?: string;
    notFoundQuery?: string;
  }
): string {
  switch (view) {
    case 'not-found':
      return options.notFoundQuery
        ? `Special:NotFound/${encodeURIComponent(options.notFoundQuery)}`
        : 'Special:NotFound';
    case 'article':
      if (options.selectedArticle) {
        // Return article.id (e.g. art-1) or clean title slug
        return options.selectedArticle.id || options.selectedArticle.titulo.replace(/\s+/g, '_');
      }
      return 'Special:Articles';

    case 'file-page':
      return options.selectedFileName ? `File:${options.selectedFileName}` : 'Special:ListFiles';

    case 'files-list':
      return 'Special:ListFiles';

    case 'upload':
      return options.uploadInitialTargetName ? `Upload:${options.uploadInitialTargetName}` : 'Special:Upload';

    case 'user-page':
      return options.targetUserIdentifier ? `User:${options.targetUserIdentifier}` : 'Special:ListUsers';

    case 'admin-dashboard':
      return 'Special:AdminDashboard';

    case 'admin-users':
      return 'Special:ListUsers';

    case 'admin-council':
      return 'Special:Bureaucrats';

    case 'admin-extensions':
      return 'Special:Extensions';

    case 'checkuser':
      return options.targetUserIdentifier ? `CheckUser:${options.targetUserIdentifier}` : 'Special:CheckUser';

    case 'arbitration':
      return 'Special:Arbitration';

    case 'recent-changes':
      return 'Special:RecentChanges';

    case 'special-pages':
      return 'Special:SpecialPages';

    case 'watchlist':
      return 'Special:Watchlist';

    case 'site-updates':
      return 'Special:SiteUpdates';

    case 'unblock-requests':
      return 'Special:UnblockRequests';

    case 'admin-data-removal':
      return 'Special:DataRemovalRequests';

    case 'promotion-requests':
      return 'Special:PromotionRequests';

    case 'contact-admin':
      return 'Special:ContactAdmin';

    case 'emergency-contact':
      return 'Special:EmergencyContact';

    case 'ucoc':
      return 'Special:UCoC';

    case 'admin-firebase':
      return 'Special:AdminFirebase';

    case 'vpn-checker':
      return 'Special:VpnChecker';

    case 'tools':
      return 'Special:Tools';

    case 'library':
      return 'Special:Library';

    case 'privacy':
      return 'Special:Privacy';

    case 'terms':
      return 'Special:Terms';

    case 'editing-ethics':
      return 'Special:EditingEthics';

    case 'security':
      return 'Special:Security';

    case 'donation':
      return 'Special:Donation';

    case 'mydata':
      return 'Special:MyData';

    case 'beta':
      return 'Special:Beta';

    case 'offline':
      return 'Special:Offline';

    case 'appearance':
      return 'Special:Appearance';

    case 'comparison':
      return 'Special:Comparison';

    case 'wazzimagiygg':
      return 'Special:WazzimaGiygg';

    case 'academic':
      return 'Special:Academic';

    case 'news':
      return 'Special:News';

    case 'create-page':
      return 'Special:CreatePage';

    case 'create-article':
    case 'editor':
      if (options.selectedArticle) {
        return `Edit:${options.selectedArticle.id}`;
      }
      return options.selectedPageUid ? `NewArticle:${options.selectedPageUid}` : 'Special:Editor';

    case 'hub':
    default:
      if (options.selectedPageUid && options.selectedPageUid !== 'hub') {
        return `Page:${options.selectedPageUid}`;
      }
      return 'hub';
  }
}

/**
 * Resolves a UID string into an actionable navigation target
 */
export function resolveNavigationUid(
  rawUid: string,
  articles: WikiArticle[] = [],
  pages: WikiPage[] = []
): ResolvedNavigationTarget {
  let uid = rawUid.trim();

  // Strip leading '?' if passed
  if (uid.startsWith('?')) {
    const params = new URLSearchParams(uid);
    uid = params.get('uid') || uid.substring(1);
  }

  // Strip 'uid=' prefix if user entered it in search
  if (/^uid=/i.test(uid)) {
    uid = uid.replace(/^uid=/i, '');
  }

  uid = uid.trim();
  if (!uid) return { type: 'view', view: 'hub' };

  // Decode URI components if encoded
  try {
    uid = decodeURIComponent(uid);
  } catch {
    // Keep as is
  }

  const normalized = normalizeString(uid);

  // 1. Hub / Home
  if (['hub', 'home', 'inicio', 'principal', 'special:mainpage', 'special:home'].includes(normalized)) {
    return { type: 'view', view: 'hub' };
  }

  // 2. Special Pages & Views Map
  const specialViewsMap: Record<string, { view: ViewMode; initialTab?: string }> = {
    'special:arbitration': { view: 'arbitration' },
    'arbitration': { view: 'arbitration' },
    'arbcom': { view: 'arbitration' },
    'conselho-arbitragem': { view: 'arbitration' },
    'conselho': { view: 'arbitration' },

    'special:recentchanges': { view: 'recent-changes' },
    'recent-changes': { view: 'recent-changes' },
    'recent_changes': { view: 'recent-changes' },
    'mudancas-recentes': { view: 'recent-changes' },
    'mudancas_recentes': { view: 'recent-changes' },

    'special:specialpages': { view: 'special-pages', initialTab: 'all' },
    'special-pages': { view: 'special-pages', initialTab: 'all' },
    'special': { view: 'special-pages', initialTab: 'all' },
    'paginas-especiais': { view: 'special-pages', initialTab: 'all' },

    'special:watchlist': { view: 'watchlist', initialTab: 'watchlist' },
    'watchlist': { view: 'watchlist', initialTab: 'watchlist' },
    'vigiadas': { view: 'watchlist', initialTab: 'watchlist' },
    'paginas-vigiadas': { view: 'watchlist', initialTab: 'watchlist' },

    'special:siteupdates': { view: 'site-updates' },
    'site-updates': { view: 'site-updates' },
    'updates': { view: 'site-updates' },
    'changelog': { view: 'site-updates' },
    'atualizacoes': { view: 'site-updates' },

    'special:listfiles': { view: 'files-list' },
    'files-list': { view: 'files-list' },
    'files': { view: 'files-list' },
    'galeria': { view: 'files-list' },
    'galeria-arquivos': { view: 'files-list' },

    'special:upload': { view: 'upload' },
    'upload': { view: 'upload' },
    'carregar-arquivo': { view: 'upload' },

    'special:admindashboard': { view: 'admin-dashboard' },
    'special:admin': { view: 'admin-dashboard' },
    'special:dashboard': { view: 'admin-dashboard' },
    'admin-dashboard': { view: 'admin-dashboard' },
    'painel-admin': { view: 'admin-dashboard' },
    'dashboard-admin': { view: 'admin-dashboard' },

    'special:listusers': { view: 'admin-users' },
    'admin-users': { view: 'admin-users' },
    'users': { view: 'admin-users' },
    'usuarios': { view: 'admin-users' },

    'special:bureaucrats': { view: 'admin-council' },
    'special:burocratas': { view: 'admin-council' },
    'special:administracao': { view: 'admin-council' },
    'special:administration': { view: 'admin-council' },
    'special:moderadores': { view: 'admin-council' },
    'special:moderators': { view: 'admin-council' },
    'special:governance': { view: 'admin-council' },
    'admin-council': { view: 'admin-council' },
    'burocratas': { view: 'admin-council' },
    'governanca': { view: 'admin-council' },

    'special:extensions': { view: 'admin-extensions' },
    'special:extensoes': { view: 'admin-extensions' },
    'special:plugins': { view: 'admin-extensions' },
    'admin-extensions': { view: 'admin-extensions' },
    'extensions': { view: 'admin-extensions' },
    'extensoes': { view: 'admin-extensions' },

    'special:checkuser': { view: 'checkuser' },
    'checkuser': { view: 'checkuser' },
    'spi': { view: 'checkuser' },

    'special:unblockrequests': { view: 'unblock-requests' },
    'unblock-requests': { view: 'unblock-requests' },
    'unblock': { view: 'unblock-requests' },
    'desbloqueio': { view: 'unblock-requests' },

    'special:dataremovalrequests': { view: 'admin-data-removal' },
    'special:dataremoval': { view: 'admin-data-removal' },
    'special:lgpdrequests': { view: 'admin-data-removal' },
    'special:pedidosremocaodados': { view: 'admin-data-removal' },
    'admin-data-removal': { view: 'admin-data-removal' },
    'pedidos-remocao-dados': { view: 'admin-data-removal' },
    'remocao-dados': { view: 'admin-data-removal' },

    'special:promotionrequests': { view: 'promotion-requests' },
    'promotion-requests': { view: 'promotion-requests' },
    'rfa': { view: 'promotion-requests' },
    'promocoes': { view: 'promotion-requests' },

    'special:contactadmin': { view: 'contact-admin' },
    'contact-admin': { view: 'contact-admin' },
    'contato-admin': { view: 'contact-admin' },
    'suporte': { view: 'contact-admin' },

    'special:emergencycontact': { view: 'emergency-contact' },
    'special:emergency': { view: 'emergency-contact' },
    'special:contatoemergencia': { view: 'emergency-contact' },
    'special:emergencia': { view: 'emergency-contact' },
    'emergency-contact': { view: 'emergency-contact' },
    'emergency': { view: 'emergency-contact' },
    'emergencia': { view: 'emergency-contact' },
    'contato-emergencia': { view: 'emergency-contact' },

    'special:ucoc': { view: 'ucoc' },
    'special:universalcodeofconduct': { view: 'ucoc' },
    'special:codigodeconduta': { view: 'ucoc' },
    'ucoc': { view: 'ucoc' },
    'universal-code-of-conduct': { view: 'ucoc' },
    'codigo-de-conduta': { view: 'ucoc' },
    'denuncias-formais': { view: 'ucoc' },
    'denuncia-formal': { view: 'ucoc' },

    'special:adminfirebase': { view: 'admin-firebase' },
    'special:firebase': { view: 'admin-firebase' },
    'special:firebaseconsole': { view: 'admin-firebase' },
    'special:firebasebackup': { view: 'admin-firebase' },
    'special:backup': { view: 'admin-firebase' },
    'special:backups': { view: 'admin-firebase' },
    'admin-firebase': { view: 'admin-firebase' },
    'firebase': { view: 'admin-firebase' },
    'firebase-backup': { view: 'admin-firebase' },
    'firebase-console': { view: 'admin-firebase' },
    'backup-firebase': { view: 'admin-firebase' },
    'backup-blaze': { view: 'admin-firebase' },

    'special:vpnchecker': { view: 'vpn-checker' },
    'special:vpn': { view: 'vpn-checker' },
    'special:vpncheck': { view: 'vpn-checker' },
    'special:proxycheck': { view: 'vpn-checker' },
    'special:proxy': { view: 'vpn-checker' },
    'vpn-checker': { view: 'vpn-checker' },
    'vpn': { view: 'vpn-checker' },
    'verificador-vpn': { view: 'vpn-checker' },
    'bloqueio-vpn': { view: 'vpn-checker' },

    'special:privacy': { view: 'privacy' },
    'special:dossieirregularidades': { view: 'privacy' },
    'special:dossie': { view: 'privacy' },
    'special:irregularidades': { view: 'privacy' },
    'dossie-irregularidades': { view: 'privacy' },
    'dossie-wikipedia': { view: 'privacy' },
    'irregularidades-wikipedia': { view: 'privacy' },
    'irregularidades': { view: 'privacy' },
    'dossie': { view: 'privacy' },
    'privacy': { view: 'privacy' },
    'privacidade': { view: 'privacy' },
    'lgpd': { view: 'privacy' },

    'special:terms': { view: 'terms' },
    'terms': { view: 'terms' },
    'termos': { view: 'terms' },

    'special:editingethics': { view: 'editing-ethics' },
    'special:ethics': { view: 'editing-ethics' },
    'special:eticadeedicao': { view: 'editing-ethics' },
    'special:regrasdeedicao': { view: 'editing-ethics' },
    'special:regras': { view: 'editing-ethics' },
    'editing-ethics': { view: 'editing-ethics' },
    'editorial-ethics': { view: 'editing-ethics' },
    'regras-de-edicao': { view: 'editing-ethics' },
    'etica-de-edicao': { view: 'editing-ethics' },
    'etica': { view: 'editing-ethics' },
    'regras': { view: 'editing-ethics' },
    'privacidade-e-etica': { view: 'editing-ethics' },
    'etica-editorial': { view: 'editing-ethics' },

    'special:europeandatalaws': { view: 'editing-ethics', initialTab: 'gdpr' },
    'special:europeanlaws': { view: 'editing-ethics', initialTab: 'gdpr' },
    'special:leiseuropeias': { view: 'editing-ethics', initialTab: 'gdpr' },
    'special:leiseuropeiasdados': { view: 'editing-ethics', initialTab: 'gdpr' },
    'special:gdpr': { view: 'editing-ethics', initialTab: 'gdpr' },
    'special:dsa': { view: 'editing-ethics', initialTab: 'gdpr' },
    'special:dma': { view: 'editing-ethics', initialTab: 'gdpr' },
    'special:aiact': { view: 'editing-ethics', initialTab: 'gdpr' },
    'special:euaiact': { view: 'editing-ethics', initialTab: 'gdpr' },
    'european-data-laws': { view: 'editing-ethics', initialTab: 'gdpr' },
    'leis-europeias': { view: 'editing-ethics', initialTab: 'gdpr' },
    'gdpr': { view: 'editing-ethics', initialTab: 'gdpr' },
    'dsa': { view: 'editing-ethics', initialTab: 'gdpr' },
    'dma': { view: 'editing-ethics', initialTab: 'gdpr' },

    'special:freeexpression': { view: 'editing-ethics', initialTab: 'free_expression' },
    'special:liberdadedeexpressao': { view: 'editing-ethics', initialTab: 'free_expression' },
    'special:liberdadeexpressao': { view: 'editing-ethics', initialTab: 'free_expression' },
    'special:artigo19': { view: 'editing-ethics', initialTab: 'free_expression' },
    'special:dudh': { view: 'editing-ethics', initialTab: 'free_expression' },
    'special:pidcp': { view: 'editing-ethics', initialTab: 'free_expression' },
    'special:iccpr': { view: 'editing-ethics', initialTab: 'free_expression' },
    'special:sanjose': { view: 'editing-ethics', initialTab: 'free_expression' },
    'special:pactodesanjose': { view: 'editing-ethics', initialTab: 'free_expression' },
    'free-expression': { view: 'editing-ethics', initialTab: 'free_expression' },
    'liberdade-de-expressao': { view: 'editing-ethics', initialTab: 'free_expression' },
    'artigo-19': { view: 'editing-ethics', initialTab: 'free_expression' },

    'special:security': { view: 'security' },
    'security': { view: 'security' },
    'seguranca': { view: 'security' },

    'special:donation': { view: 'donation' },
    'donation': { view: 'donation' },
    'doacao': { view: 'donation' },

    'special:mydata': { view: 'mydata' },
    'mydata': { view: 'mydata' },
    'meus-dados': { view: 'mydata' },

    'special:beta': { view: 'beta' },
    'beta': { view: 'beta' },

    'special:offline': { view: 'offline' },
    'offline': { view: 'offline' },

    'special:appearance': { view: 'appearance' },
    'special:aparencia': { view: 'appearance' },
    'special:theme': { view: 'appearance' },
    'special:themes': { view: 'appearance' },
    'special:temas': { view: 'appearance' },
    'special:skin': { view: 'appearance' },
    'special:preferences': { view: 'appearance' },
    'appearance': { view: 'appearance' },
    'aparencia': { view: 'appearance' },
    'themes': { view: 'appearance' },
    'temas': { view: 'appearance' },

    'special:comparison': { view: 'comparison' },
    'special:comparativo': { view: 'comparison' },
    'special:compare': { view: 'comparison' },
    'comparison': { view: 'comparison' },
    'comparativo': { view: 'comparison' },
    'compare': { view: 'comparison' },
    'wikipedia': { view: 'comparison' },
    'fandom': { view: 'comparison' },
    'mediawiki': { view: 'comparison' },
    'wikidot': { view: 'comparison' },
    'wikizero-vs-wikipedia': { view: 'comparison' },

    'special:wazzimagiygg': { view: 'wazzimagiygg' },
    'wazzimagiygg': { view: 'wazzimagiygg' },
    'wazzima': { view: 'wazzimagiygg' },
    'caso-wazzimagiygg': { view: 'wazzimagiygg' },
    'casowazzimagiygg': { view: 'wazzimagiygg' },
    'projetos-wazzimagiygg': { view: 'wazzimagiygg' },
    'wazzimagiygg-projetos': { view: 'wazzimagiygg' },
    'averdade': { view: 'wazzimagiygg' },
    'a-verdade': { view: 'wazzimagiygg' },
    'special:averdade': { view: 'wazzimagiygg' },

    'special:createpage': { view: 'create-page' },
    'create-page': { view: 'create-page' },

    'special:editor': { view: 'editor' },
    'editor': { view: 'editor' },

    'special:notfound': { view: 'not-found' },
    'special:not-found': { view: 'not-found' },
    'special:404': { view: 'not-found' },
    'special:erro404': { view: 'not-found' },
    'notfound': { view: 'not-found' },
    'not-found': { view: 'not-found' },
    '404': { view: 'not-found' },
    'erro-404': { view: 'not-found' },
    'pagina-nao-encontrada': { view: 'not-found' },

    'special:tools': { view: 'tools' },
    'special:ferramentas': { view: 'tools' },
    'special:calculadora': { view: 'tools', initialTab: 'calculator' },
    'special:horariocerto': { view: 'tools', initialTab: 'world-clock' },
    'special:fusoshorarios': { view: 'tools', initialTab: 'world-clock' },
    'special:teclado': { view: 'tools', initialTab: 'keyboard-checker' },
    'special:tempo': { view: 'tools', initialTab: 'weather' },
    'special:clima': { view: 'tools', initialTab: 'weather' },
    'special:previsaodotempo': { view: 'tools', initialTab: 'weather' },
    'special:previsao': { view: 'tools', initialTab: 'weather' },
    'special:weather': { view: 'tools', initialTab: 'weather' },
    'special:chromeapp': { view: 'tools', initialTab: 'chrome-app' },
    'special:chrome': { view: 'tools', initialTab: 'chrome-app' },
    'special:chromewebstore': { view: 'tools', initialTab: 'chrome-app' },
    'special:webstore': { view: 'tools', initialTab: 'chrome-app' },
    'special:pwa': { view: 'tools', initialTab: 'chrome-app' },
    'special:app': { view: 'tools', initialTab: 'chrome-app' },
    'special:desktop': { view: 'tools', initialTab: 'chrome-app' },
    'tools': { view: 'tools' },
    'ferramentas': { view: 'tools' },
    'chrome-app': { view: 'tools', initialTab: 'chrome-app' },
    'chrome': { view: 'tools', initialTab: 'chrome-app' },
    'chrome-web-store': { view: 'tools', initialTab: 'chrome-app' },
    'chromewebstore': { view: 'tools', initialTab: 'chrome-app' },
    'webstore': { view: 'tools', initialTab: 'chrome-app' },
    'pwa': { view: 'tools', initialTab: 'chrome-app' },
    'app-desktop': { view: 'tools', initialTab: 'chrome-app' },
    'desktop-app': { view: 'tools', initialTab: 'chrome-app' },
    'calculadora': { view: 'tools', initialTab: 'calculator' },
    'calculator': { view: 'tools', initialTab: 'calculator' },
    'fuso-horario': { view: 'tools', initialTab: 'world-clock' },
    'fusos-horarios': { view: 'tools', initialTab: 'world-clock' },
    'horario-certo': { view: 'tools', initialTab: 'world-clock' },
    'relogio-mundial': { view: 'tools', initialTab: 'world-clock' },
    'teclado': { view: 'tools', initialTab: 'keyboard-checker' },
    'verificador-teclado': { view: 'tools', initialTab: 'keyboard-checker' },
    'tempo': { view: 'tools', initialTab: 'weather' },
    'clima': { view: 'tools', initialTab: 'weather' },
    'previsao-do-tempo': { view: 'tools', initialTab: 'weather' },
    'previsaodotempo': { view: 'tools', initialTab: 'weather' },
    'previsao': { view: 'tools', initialTab: 'weather' },
    'weather': { view: 'tools', initialTab: 'weather' },

    // Wiki dos Livros & Periódicos / Acervo Bibliográfico
    'special:library': { view: 'library' },
    'special:biblioteca': { view: 'library' },
    'special:livros': { view: 'library' },
    'special:books': { view: 'library' },
    'special:periodicos': { view: 'library' },
    'special:catalogo': { view: 'library' },
    'special:acervo': { view: 'library' },
    'special:wiki-dos-livros': { view: 'library' },
    'special:wikidoslivros': { view: 'library' },
    'library': { view: 'library' },
    'biblioteca': { view: 'library' },
    'livros': { view: 'library' },
    'books': { view: 'library' },
    'periodicos': { view: 'library' },
    'catalogo': { view: 'library' },
    'acervo': { view: 'library' },
    'wiki-dos-livros': { view: 'library' },
    'wikidoslivros': { view: 'library' },

    // Wiki Universitário / Repositório Acadêmico
    'special:academic': { view: 'academic' },
    'special:academico': { view: 'academic' },
    'special:scholar': { view: 'academic' },
    'special:google-scholar': { view: 'academic' },
    'special:googleacademico': { view: 'academic' },
    'special:universitario': { view: 'academic' },
    'special:wikiuniversitario': { view: 'academic' },
    'special:wiki-universitario': { view: 'academic' },
    'academic': { view: 'academic' },
    'academico': { view: 'academic' },
    'scholar': { view: 'academic' },
    'google-scholar': { view: 'academic' },
    'google-academico': { view: 'academic' },
    'googleacademico': { view: 'academic' },
    'wiki-universitario': { view: 'academic' },
    'wikiuniversitario': { view: 'academic' },
    'universitario': { view: 'academic' },

    // Jornal WazzimaGiygg / Notícias
    'special:news': { view: 'news' },
    'special:noticias': { view: 'news' },
    'special:jornal': { view: 'news' },
    'special:jornal-wazzimagiygg': { view: 'news' },
    'special:jornalwazzimagiygg': { view: 'news' },
    'news': { view: 'news' },
    'noticias': { view: 'news' },
    'jornal': { view: 'news' },
    'jornal-wazzimagiygg': { view: 'news' },
    'jornalwazzimagiygg': { view: 'news' },
  };

  // 2b. Special:NotFound/<query> or Special:404/<query>
  const notFoundParamMatch = uid.match(/^(?:Special:)?(?:NotFound|404|Erro404|NaoEncontrada)(?:\/(.*))?$/i);
  if (notFoundParamMatch) {
    const queryParam = notFoundParamMatch[1] ? decodeURIComponent(notFoundParamMatch[1].trim()) : '';
    return { type: 'not-found', query: queryParam };
  }

  if (specialViewsMap[normalized]) {
    const item = specialViewsMap[normalized];
    if (item.view === 'create-page') return { type: 'create-page' };
    if (item.view === 'editor') return { type: 'editor' };
    return { type: 'view', view: item.view, initialTab: item.initialTab };
  }

  // 3. User namespace prefix: User:name, @name, Usuario:name, user:name, user-uid
  const userMatch = uid.match(/^(?:User|Usuario|Usuário|user|usuario|@):?(.*)$/i);
  if (userMatch && userMatch[1]) {
    const rawTarget = userMatch[1].trim();
    // Check if subtab specified (e.g. User:Celso/talk)
    const [targetUser, subTab] = rawTarget.split('/');
    const tab = (subTab === 'talk' || subTab === 'contributions' || subTab === 'admin')
      ? subTab
      : 'profile';
    const cleanUsername = targetUser.replace(/[+_]/g, ' ').trim();
    return { type: 'user', username: cleanUsername, initialTab: tab };
  }

  if (/^user-[a-z0-9_-]+$/i.test(uid)) {
    return { type: 'user', username: uid.trim(), initialTab: 'profile' };
  }

  // 4. File namespace prefix or file extensions: File:..., Arquivo:..., Ficheiro:...
  const fileMatch = uid.match(/^(?:File|Arquivo|Ficheiro|Imagem|Image):?(.*)$/i);
  if (fileMatch && fileMatch[1]) {
    const fname = fileMatch[1].trim().replace(/\s+/g, '_');
    return { type: 'file', fileName: fname };
  }
  if (/\.(?:png|svg|jpg|jpeg|gif|webp|pdf|mp4|webm)$/i.test(uid)) {
    return { type: 'file', fileName: uid.trim().replace(/\s+/g, '_') };
  }

  // 5. Upload target prefix: Upload:name
  const uploadMatch = uid.match(/^(?:Upload|Carregar):?(.*)$/i);
  if (uploadMatch) {
    return { type: 'upload', targetName: uploadMatch[1]?.trim() };
  }

  // 6. CheckUser target prefix: CheckUser:name, SPI:name
  const checkUserMatch = uid.match(/^(?:CheckUser|SPI):?(.*)$/i);
  if (checkUserMatch && checkUserMatch[1]) {
    return { type: 'checkuser', target: checkUserMatch[1].trim() };
  }

  // 7. Arbitration Case: Case:ARB-..., ARB-..., case:...
  const arbCaseMatch = uid.match(/^(?:Case|Caso|Processo):?(.*)$/i);
  if (arbCaseMatch && arbCaseMatch[1]) {
    return { type: 'arbitration-case', caseId: arbCaseMatch[1].trim() };
  }
  if (/^ARB-[A-Z]{2}-\d{4}-\d{3}$/i.test(uid)) {
    return { type: 'arbitration-case', caseId: uid.toUpperCase() };
  }

  // 7b. UCoC Protocol: UCOC-..., UCoC:...
  const ucocMatch = uid.match(/^(?:UCoC|Ucoc):?(.*)$/i);
  if (ucocMatch && ucocMatch[1]) {
    return { type: 'view', view: 'ucoc', initialProtocol: ucocMatch[1].trim() };
  }
  if (/^UCOC-\d{4}-\d{4}$/i.test(uid)) {
    return { type: 'view', view: 'ucoc', initialProtocol: uid.toUpperCase() };
  }

  // 8. Page Collection prefix: Page:uid, Pagina:uid
  const pageMatch = uid.match(/^(?:Page|Pagina|Página):?(.*)$/i);
  if (pageMatch && pageMatch[1]) {
    const pageUid = pageMatch[1].trim();
    const p = pages.find((page) => page.uid.toLowerCase() === pageUid.toLowerCase());
    if (p) return { type: 'page', pageUid: p.uid };
    return { type: 'not-found', query: `Page:${pageUid}` };
  }

  // 8b. Unrecognized Special namespace
  if (/^(?:Special|Especial):/i.test(uid)) {
    return { type: 'not-found', query: uid };
  }

  // 9. Exact Match on Article ID (e.g. art-1, art-wiki-001, etc.)
  const exactArtById = articles.find((a) => a.id.toLowerCase() === uid.toLowerCase());
  if (exactArtById) {
    return { type: 'article', articleId: exactArtById.id, article: exactArtById };
  }

  // 10. Exact Match on Page Collection UID (e.g. ferrovias, historia_brasil, etc.)
  const exactPage = pages.find((p) => p.uid.toLowerCase() === uid.toLowerCase());
  if (exactPage) {
    return { type: 'page', pageUid: exactPage.uid };
  }

  // 11. Match on Article Title / Slug
  // Replace underscores with spaces for title comparison
  const cleanTitle = uid.replace(/_/g, ' ');
  const exactArtByTitle = articles.find(
    (a) => a.titulo.toLowerCase() === cleanTitle.toLowerCase() || a.titulo.toLowerCase() === uid.toLowerCase()
  );
  if (exactArtByTitle) {
    return { type: 'article', articleId: exactArtByTitle.id, article: exactArtByTitle };
  }

  // Normalized title comparison (ignoring accents, hyphens, and whitespace)
  const normTitle = normalizeString(uid);
  const normalizedArtMatch = articles.find(
    (a) => normalizeString(a.titulo) === normTitle || normalizeString(a.pageUid) === normTitle
  );
  if (normalizedArtMatch) {
    return { type: 'article', articleId: normalizedArtMatch.id, article: normalizedArtMatch };
  }

  // Partial match fallback if query is specific
  const partialArtMatch = articles.find(
    (a) => normalizeString(a.titulo).includes(normTitle) || normTitle.includes(normalizeString(a.titulo))
  );
  if (partialArtMatch && normTitle.length >= 4) {
    return { type: 'article', articleId: partialArtMatch.id, article: partialArtMatch };
  }

  // 12. If looks like a wiki article title (e.g. "História de São Paulo"), open article or editor
  return { type: 'article-title', title: cleanTitle };
}
