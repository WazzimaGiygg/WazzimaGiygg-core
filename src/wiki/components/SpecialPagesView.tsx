import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  FileText,
  Star,
  BarChart2,
  Folder,
  Search,
  ArrowRight,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Calendar,
  History,
  Trash2,
  Hash,
  Download,
  BookOpen,
  MessageSquare,
  Vote,
  Scale,
  Crown,
  Shield,
  UserX,
  Users,
  Upload,
  Image as ImageIcon,
  Gavel,
  Link2,
  Copy,
  Check,
  FileDown,
  AlertOctagon,
  ShieldAlert,
  Palette,
  FileQuestion,
  Calculator,
  Laptop,
  GraduationCap,
  Newspaper,
  Lock,
  Globe,
  Puzzle,
} from 'lucide-react';
import { WikiArticle, WikiPage, WatchlistItem, UserProfile } from '../types';
import { StorageService } from '../services/storageService';
import { buildUidPermalink } from '../utils/urlRouter';
import { PdfExportModal } from './PdfExportModal';

interface SpecialPagesViewProps {
  articles: WikiArticle[];
  pages: WikiPage[];
  user: UserProfile | null;
  onNavigateToArticle: (articleId: string) => void;
  onNavigateToPage: (pageUid: string) => void;
  onNavigateToUser?: (username: string) => void;
  onNavigateToContactAdmin?: () => void;
  onNavigateToEmergencyContact?: () => void;
  onNavigateToPromotionRequests?: () => void;
  onNavigateToUnblockRequests?: () => void;
  onNavigateToDataRemovalRequests?: () => void;
  onNavigateToCheckUser?: (username?: string) => void;
  onNavigateToAdminDashboard?: () => void;
  onNavigateToUsersList?: () => void;
  onNavigateToAdminCouncil?: () => void;
  onNavigateToExtensions?: () => void;
  onNavigateToUpload?: () => void;
  onNavigateToFilesList?: () => void;
  onNavigateToArbitration?: () => void;
  onNavigateToUcoc?: () => void;
  onNavigateToEditingEthics?: (tab?: any) => void;
  onNavigateToAppearance?: () => void;
  onNavigateToAdminFirebase?: () => void;
  onNavigateToNotFound?: () => void;
  onNavigateToTools?: () => void;
  onNavigateToLibrary?: () => void;
  onNavigateToAcademic?: () => void;
  onNavigateToNews?: () => void;
  initialTab?: 'all' | 'orphans' | 'watchlist' | 'stats' | 'stubs' | 'categories';
}

export const SpecialPagesView: React.FC<SpecialPagesViewProps> = ({
  articles,
  pages,
  user,
  onNavigateToArticle,
  onNavigateToPage,
  onNavigateToUser,
  onNavigateToContactAdmin,
  onNavigateToEmergencyContact,
  onNavigateToUcoc,
  onNavigateToEditingEthics,
  onNavigateToPromotionRequests,
  onNavigateToUnblockRequests,
  onNavigateToDataRemovalRequests,
  onNavigateToCheckUser,
  onNavigateToAdminDashboard,
  onNavigateToUsersList,
  onNavigateToAdminCouncil,
  onNavigateToExtensions,
  onNavigateToUpload,
  onNavigateToFilesList,
  onNavigateToArbitration,
  onNavigateToAppearance,
  onNavigateToAdminFirebase,
  onNavigateToNotFound,
  onNavigateToTools,
  onNavigateToLibrary,
  onNavigateToAcademic,
  onNavigateToNews,
  initialTab = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'orphans' | 'watchlist' | 'stats' | 'stubs' | 'categories'>(
    initialTab
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => StorageService.getWatchlist());
  const [copiedShortcut, setCopiedShortcut] = useState<string | null>(null);
  const [selectedArticleForPdf, setSelectedArticleForPdf] = useState<WikiArticle | null>(null);

  const handleCopyShortcut = (uid: string) => {
    const permalink = buildUidPermalink(uid);
    navigator.clipboard.writeText(permalink);
    setCopiedShortcut(uid);
    setTimeout(() => setCopiedShortcut(null), 2000);
  };

  const safeArticles = articles || [];
  const safePages = pages || [];

  // Calculate Orphan pages (articles with 0 incoming links)
  const orphanArticles = useMemo(() => {
    return safeArticles.filter((art) => {
      if (!art) return false;
      const backlinks = StorageService.getBacklinks(art.titulo, safeArticles);
      return backlinks.length === 0;
    });
  }, [safeArticles]);

  // Calculate Stubs (short articles < 800 bytes or tagged with Esboço)
  const stubArticles = useMemo(() => {
    return safeArticles.filter(
      (art) =>
        art &&
        ((art.descricao?.length || 0) < 800 ||
        (art.descricao && art.descricao.includes('{{Esboço')) ||
        (art.descricao && art.descricao.includes('{{Stub')))
    );
  }, [safeArticles]);

  // Categories aggregation
  const categoryMap = useMemo(() => {
    const map = new Map<string, WikiArticle[]>();
    safeArticles.forEach((art) => {
      if (!art) return;
      const cat = art.categoria || 'Geral';
      const list = map.get(cat) || [];
      list.push(art);
      map.set(cat, list);
    });
    return map;
  }, [safeArticles]);

  // General Wiki Statistics
  const stats = useMemo(() => {
    const totalBytes = safeArticles.reduce((acc, a) => acc + (a?.descricao?.length || 0), 0);
    const totalViews = safeArticles.reduce((acc, a) => acc + (a?.visualizacoes || 0), 0);
    const totalRevisions = safeArticles.reduce((acc, a) => acc + (a?.historico?.length || 1), 0);
    const totalWords = safeArticles.reduce(
      (acc, a) => acc + (a?.descricao ? a.descricao.trim().split(/\s+/).length : 0),
      0
    );

    const authorMap: Record<string, number> = {};
    safeArticles.forEach((a) => {
      if (!a) return;
      const author = a.autor || 'Anônimo';
      authorMap[author] = (authorMap[author] || 0) + 1;
    });

    const topAuthors = Object.entries(authorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalArticles: safeArticles.length,
      totalPages: safePages.length,
      totalBytes,
      totalViews,
      totalRevisions,
      totalWords,
      avgBytes: Math.round(totalBytes / (safeArticles.length || 1)),
      topAuthors,
    };
  }, [safeArticles, safePages]);

  // Filtered A-Z articles
  const sortedArticles = useMemo(() => {
    return [...safeArticles]
      .filter(Boolean)
      .sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''))
      .filter((a) => (a.titulo || '').toLowerCase().includes((searchQuery || '').toLowerCase()));
  }, [safeArticles, searchQuery]);

  const handleToggleWatch = (art: WikiArticle) => {
    StorageService.toggleWatchlist(art);
    setWatchlist(StorageService.getWatchlist());
  };

  const handleExportFullDump = () => {
    const dump = {
      project: 'WikiWorldWeb Enciclopédia Aberta',
      version: '3.0',
      timestamp: new Date().toISOString(),
      articles,
      pages,
      stats,
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WikiWorldWeb_Full_Database_Dump_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in select-none">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white font-serif-heading text-lg">
            <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
            <span>Páginas Especiais (Special:SpecialPages)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Painel central de relatórios de conteúdo, ontologia, páginas órfãs, lista de vigilância e estatísticas.
          </p>
        </div>

        <button
          onClick={handleExportFullDump}
          className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs flex-shrink-0"
        >
          <Download size={13} /> Exportar Dump JSON
        </button>
      </div>

      {/* Admin & Community Special Portals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {onNavigateToAppearance && (
          <button
            onClick={onNavigateToAppearance}
            className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-amber-500 text-white shrink-0 shadow-2xs">
              <Palette size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate group-hover:underline">
                Special:Appearance
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Aparência & 6 Temas
              </div>
            </div>
          </button>
        )}

        {onNavigateToUpload && (
          <button
            onClick={onNavigateToUpload}
            className="p-3 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-blue-600 text-white shrink-0">
              <Upload size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate group-hover:underline">
                Special:Upload
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Carregar Ficheiro/Imagem
              </div>
            </div>
          </button>
        )}

        {onNavigateToFilesList && (
          <button
            onClick={onNavigateToFilesList}
            className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-indigo-600 text-white shrink-0">
              <ImageIcon size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate group-hover:underline">
                Special:Files
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Galeria de Ficheiros
              </div>
            </div>
          </button>
        )}

        {onNavigateToAdminDashboard && (
          <button
            onClick={onNavigateToAdminDashboard}
            className="p-3 rounded-lg border border-purple-300 dark:border-purple-700 bg-gradient-to-r from-purple-100/90 to-indigo-100/90 dark:from-purple-950/60 dark:to-indigo-950/60 hover:from-purple-200/90 dark:hover:from-purple-900/70 text-left transition flex items-center gap-2.5 group ring-1 ring-purple-400/40 shadow-xs"
          >
            <div className="p-2 rounded-md bg-gradient-to-tr from-purple-700 to-indigo-700 text-white shrink-0 shadow-sm">
              <Shield size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-950 dark:text-purple-100 truncate group-hover:underline flex items-center gap-1.5">
                Special:AdminDashboard
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-600 text-white font-mono font-bold">HUB</span>
              </div>
              <div className="text-[10px] text-purple-800 dark:text-purple-300 truncate font-medium">
                Painel Unificado de Administração
              </div>
            </div>
          </button>
        )}

        {onNavigateToUsersList && (
          <button
            onClick={onNavigateToUsersList}
            className="p-3 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-purple-600 text-white shrink-0">
              <Users size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate group-hover:underline">
                Special:ListUsers
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Lista de Usuários
              </div>
            </div>
          </button>
        )}

        {onNavigateToAdminCouncil && (
          <button
            onClick={onNavigateToAdminCouncil}
            className="p-3 rounded-lg border border-purple-300 dark:border-purple-800 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/40 dark:to-indigo-950/40 hover:from-purple-100 dark:hover:from-purple-900/50 text-left transition flex items-center gap-2.5 group ring-1 ring-purple-400/30"
          >
            <div className="p-2 rounded-md bg-gradient-to-tr from-purple-700 to-indigo-600 text-white shrink-0 shadow-sm">
              <Crown size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate group-hover:underline flex items-center gap-1.5">
                Special:Bureaucrats
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-mono">Conselho</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Gestão da Administração, Burocratas & Moderadores
              </div>
            </div>
          </button>
        )}

        {onNavigateToExtensions && (
          <button
            onClick={onNavigateToExtensions}
            className="p-3 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-purple-600 text-white shrink-0">
              <Puzzle size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate group-hover:underline flex items-center gap-1.5">
                Special:Extensions
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-mono">Burocratas</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Gerenciamento de Extensões, Ganchos & Módulos
              </div>
            </div>
          </button>
        )}

        {onNavigateToContactAdmin && (
          <button
            onClick={onNavigateToContactAdmin}
            className="p-3 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-blue-600 text-white shrink-0">
              <MessageSquare size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate group-hover:underline">
                Special:ContactAdmin
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Fale com a Administração
              </div>
            </div>
          </button>
        )}

        {onNavigateToEmergencyContact && (
          <button
            onClick={onNavigateToEmergencyContact}
            className="p-3 rounded-lg border border-red-300 dark:border-red-800/80 bg-red-50/70 dark:bg-red-950/40 hover:bg-red-100/80 dark:hover:bg-red-900/50 text-left transition flex items-center gap-2.5 group ring-1 ring-red-400/30"
          >
            <div className="p-2 rounded-md bg-red-600 text-white shrink-0 animate-pulse">
              <AlertOctagon size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-red-900 dark:text-red-200 truncate group-hover:underline">
                  Special:EmergencyContact
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-red-600 text-white">
                  URGENTE
                </span>
              </div>
              <div className="text-[10px] text-red-700 dark:text-red-300 truncate">
                Contato de Emergência (Casos Extremos)
              </div>
            </div>
          </button>
        )}

        {onNavigateToUcoc && (
          <button
            id="btn-specialpages-ucoc"
            onClick={onNavigateToUcoc}
            className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-indigo-600 text-white shrink-0">
              <ShieldAlert size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate group-hover:underline">
                  Special:UCoC
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-indigo-600 text-white">
                  CÓDIGO
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Código de Conduta Universal (Denúncias Formais)
              </div>
            </div>
          </button>
        )}

        {onNavigateToEditingEthics && (
          <button
            id="btn-specialpages-editing-ethics"
            onClick={() => onNavigateToEditingEthics?.('principles')}
            className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-emerald-600 text-white shrink-0">
              <Scale size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate group-hover:underline">
                  Special:EditingEthics
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-emerald-600 text-white">
                  ÉTICA/LGPD
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Regras de Ética de Edição, Adição e Privacidade
              </div>
            </div>
          </button>
        )}

        {onNavigateToEditingEthics && (
          <button
            id="btn-specialpages-european-laws"
            onClick={() => onNavigateToEditingEthics('gdpr')}
            className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-indigo-600 text-white shrink-0">
              <Lock size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate group-hover:underline">
                  Special:EuropeanDataLaws
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-indigo-600 text-white">
                  GDPR/DSA/DMA
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Leis Europeias de Dados (GDPR, DSA, DMA, AI Act & Efeito Bruxelas)
              </div>
            </div>
          </button>
        )}

        {onNavigateToEditingEthics && (
          <button
            id="btn-specialpages-free-expression"
            onClick={() => onNavigateToEditingEthics('free_expression')}
            className="p-3 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-blue-600 text-white shrink-0">
              <Globe size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate group-hover:underline">
                  Special:FreeExpression
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-blue-600 text-white">
                  DUDH/PIDCP
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Direito Internacional de Liberdade de Expressão (Art. 19 DUDH/PIDCP & San José)
              </div>
            </div>
          </button>
        )}

        <a
          href="/Irregularidades%20da%20Wikip%C3%A9dia%20e%20Wikimedia%20Foundation.pdf"
          download="Irregularidades da Wikipédia e Wikimedia Foundation.pdf"
          className="p-3 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          title="Dossiê Oficial em PDF sobre as violações da LGPD, GDPR e Marco Civil da Internet pela Wikipédia"
        >
          <div className="p-2 rounded-md bg-rose-600 text-white shrink-0">
            <FileText size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate group-hover:underline">
                Special:DossieIrregularidades
              </span>
              <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-rose-600 text-white">
                PDF
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Dossiê: Violações da Wikipédia (LGPD & Marco Civil)
            </div>
          </div>
        </a>

        <a
          href="/Cal%C3%BAnia%20por%20parte%20de%20Chronus%20V2.pdf"
          download="Calúnia por parte de Chronus V2.pdf"
          className="p-3 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100/70 dark:hover:bg-red-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          title="Dossiê Jurídico em PDF: Calúnia por parte de Chronus V2 (Crimes contra a Honra, Stalking e Violações do UCOC)"
        >
          <div className="p-2 rounded-md bg-gradient-to-tr from-rose-700 to-red-600 text-white shrink-0 shadow-xs">
            <Scale size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-red-900 dark:text-red-200 truncate group-hover:underline">
                Special:DossieCaluniaChronus
              </span>
              <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-red-700 text-white">
                V2 PDF
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Dossiê: Calúnia por parte de Chronus (Arts. 138-140 CP)
            </div>
          </div>
        </a>

        {onNavigateToPromotionRequests && (
          <button
            onClick={onNavigateToPromotionRequests}
            className="p-3 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-purple-600 text-white shrink-0">
              <Vote size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate group-hover:underline">
                Special:PromotionRequests
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Pedidos de Promoção (RFA)
              </div>
            </div>
          </button>
        )}

        {onNavigateToUnblockRequests && (
          <button
            onClick={onNavigateToUnblockRequests}
            className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-amber-600 text-white shrink-0">
              <Scale size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate group-hover:underline">
                Special:UnblockRequests
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Recursos de Desbloqueio
              </div>
            </div>
          </button>
        )}

        {onNavigateToDataRemovalRequests && (
          <button
            id="btn-specialpages-dataremoval"
            onClick={onNavigateToDataRemovalRequests}
            className="p-3 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100/70 dark:hover:bg-red-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-red-600 text-white shrink-0">
              <ShieldAlert size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-red-900 dark:text-red-200 truncate group-hover:underline">
                  Special:DataRemovalRequests
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-red-600 text-white">
                  LGPD
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Pedidos de Remoção de Dados (Art. 18, VI)
              </div>
            </div>
          </button>
        )}

        {onNavigateToArbitration && (
          <button
            onClick={onNavigateToArbitration}
            className="p-3 rounded-lg border border-purple-300 dark:border-purple-800/80 bg-purple-100/60 dark:bg-purple-950/40 hover:bg-purple-200/60 dark:hover:bg-purple-900/50 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-purple-700 text-white shrink-0">
              <Gavel size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-950 dark:text-purple-200 truncate group-hover:underline">
                Special:Arbitration
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                Conselho de Arbitragem (ArbCom)
              </div>
            </div>
          </button>
        )}

        {onNavigateToCheckUser && (
          <button
            onClick={() => onNavigateToCheckUser()}
            className="p-3 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-rose-600 text-white shrink-0">
              <UserX size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate group-hover:underline">
                Special:CheckUser
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Verificador de Contas
              </div>
            </div>
          </button>
        )}

        {onNavigateToAdminFirebase && (
          <button
            id="btn-specialpages-adminfirebase"
            onClick={onNavigateToAdminFirebase}
            className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-amber-600 text-white shrink-0">
              <Database size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate group-hover:underline">
                  Special:AdminFirebase
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-amber-600 text-white">
                  BLAZE
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Backups Automáticos & Console Firebase
              </div>
            </div>
          </button>
        )}

        {onNavigateToNotFound && (
          <button
            id="btn-specialpages-notfound"
            onClick={onNavigateToNotFound}
            className="p-3 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-rose-600 text-white shrink-0">
              <FileQuestion size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate group-hover:underline">
                  Special:NotFound
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-rose-600 text-white">
                  404
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Página 404 & Recuperação de Verbetes
              </div>
            </div>
          </button>
        )}

        {onNavigateToTools && (
          <button
            id="btn-specialpages-tools"
            onClick={onNavigateToTools}
            className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-indigo-600 text-white shrink-0">
              <Calculator size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate group-hover:underline">
                  Special:Tools
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-indigo-600 text-white">
                  Útil
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Extensões de Ferramentas: Previsão do Tempo, Calculadora e Horário Mundial
              </div>
            </div>
          </button>
        )}

        {onNavigateToLibrary && (
          <button
            id="btn-specialpages-library"
            onClick={onNavigateToLibrary}
            className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-emerald-600 text-white shrink-0 shadow-2xs">
              <BookOpen size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate group-hover:underline">
                  Special:Library
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-emerald-600 text-white">
                  Acervo
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Wiki dos Livros & Periódicos (Biblioteca)
              </div>
            </div>
          </button>
        )}

        {onNavigateToAcademic && (
          <button
            id="btn-specialpages-academic"
            onClick={onNavigateToAcademic}
            className="p-3 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-blue-700 text-white shrink-0 shadow-2xs">
              <GraduationCap size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate group-hover:underline">
                  Special:Academic
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-blue-700 text-white">
                  Universitário
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Wiki Universitário (Google Acadêmico & Teses)
              </div>
            </div>
          </button>
        )}

        {onNavigateToNews && (
          <button
            id="btn-specialpages-news"
            onClick={onNavigateToNews}
            className="p-3 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-rose-700 text-white shrink-0 shadow-2xs">
              <Newspaper size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate group-hover:underline">
                  Special:News
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-rose-700 text-white">
                  Jornal
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Jornal WazzimaGiygg (Notícias em Tempo Real)
              </div>
            </div>
          </button>
        )}

        {onNavigateToTools && (
          <button
            id="btn-specialpages-chromeapp"
            onClick={onNavigateToTools}
            className="p-3 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-2 rounded-md bg-blue-600 text-white shrink-0 shadow-2xs">
              <Laptop size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate group-hover:underline">
                  Special:ChromeApp
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-blue-600 text-white">
                  Chrome
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Instalar App Desktop & Pacote Web Store
              </div>
            </div>
          </button>
        )}
      </div>

      {/* UID Quick Navigation Cheatsheet & Guide */}
      <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
            <Link2 size={14} className="text-blue-600" />
            <span>Navegação Direta por ?uid= na Barra de Endereços</span>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Deep Linking Ativo</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          Você pode navegar para qualquer lugar da WikiWorldWeb adicionando o parâmetro <code>?uid=</code> diretamente na URL do navegador ou pesquisando no campo de busca. Clique em um atalho para copiar seu link permanente:
        </p>
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {[
            { label: 'Páginas Especiais', uid: 'Special:SpecialPages' },
            { label: 'Ética de Edição (LGPD)', uid: 'Special:EditingEthics' },
            { label: 'Leis Europeias de Dados', uid: 'Special:EuropeanDataLaws' },
            { label: 'Liberdade de Expressão', uid: 'Special:FreeExpression' },
            { label: 'App Chrome / PC', uid: 'Special:ChromeApp' },
            { label: 'Previsão do Tempo', uid: 'Special:Weather' },
            { label: 'Google Acadêmico', uid: 'Special:Scholar' },
            { label: 'Ferramentas de Uso', uid: 'Special:Tools' },
            { label: 'Mudanças Recentes', uid: 'Special:RecentChanges' },
            { label: 'Conselho ArbCom', uid: 'Special:Arbitration' },
            { label: 'Carregar Arquivo', uid: 'Special:Upload' },
            { label: 'Galeria de Ficheiros', uid: 'Special:Files' },
            { label: 'Verificador CheckUser', uid: 'Special:CheckUser' },
          ].map((item) => (
            <button
              key={item.uid}
              onClick={() => handleCopyShortcut(item.uid)}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 text-slate-700 dark:text-slate-300 flex items-center gap-1 font-mono transition text-[10px]"
              title={`Copiar ?uid=${item.uid}`}
            >
              <span>{item.label}:</span>
              <code className="text-blue-600 dark:text-blue-400 font-bold">?uid={item.uid}</code>
              {copiedShortcut === item.uid ? (
                <Check size={11} className="text-emerald-500 ml-1" />
              ) : (
                <Copy size={11} className="text-slate-400 ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={13} /> Todas as Páginas ({articles.length})
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'watchlist'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Star size={13} className="text-amber-500" /> Páginas Vigiadas ({watchlist.length})
        </button>

        <button
          onClick={() => setActiveTab('orphans')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'orphans'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle size={13} className="text-amber-500" /> Páginas Órfãs ({orphanArticles.length})
        </button>

        <button
          onClick={() => setActiveTab('stubs')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'stubs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles size={13} className="text-cyan-500" /> Esboços & Curtos ({stubArticles.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Folder size={13} /> Categorias ({categoryMap.size})
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'stats'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart2 size={13} /> Estatísticas do Sistema
        </button>
      </div>

      {/* Tab 1: All Pages A-Z */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por título de artigo..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Exibindo {sortedArticles.length} de {articles.length} páginas
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {sortedArticles.map((art) => (
              <div
                key={art.id}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <button
                    onClick={() => onNavigateToArticle(art.id)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 text-left"
                  >
                    <FileText size={13} />
                    <span>{art.titulo}</span>
                  </button>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>{art.categoria || 'Geral'}</span>
                    <span>•</span>
                    <span>{art.descricao?.length || 0} bytes</span>
                    <span>•</span>
                    <span>v{art.versao || 1}</span>
                    <span>•</span>
                    <span>{art.visualizacoes || 0} visualizações</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedArticleForPdf(art)}
                    title="Exportar este artigo para PDF"
                    className="p-1.5 rounded border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                  >
                    <FileDown size={14} />
                  </button>

                  <button
                    onClick={() => handleToggleWatch(art)}
                    title={StorageService.isWatched(art.id) ? 'Remover da Lista de Páginas Vigiadas' : 'Vigiar este artigo'}
                    className={`p-1.5 rounded transition ${
                      StorageService.isWatched(art.id)
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Star size={14} fill={StorageService.isWatched(art.id) ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    onClick={() => onNavigateToArticle(art.id)}
                    className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 font-semibold"
                  >
                    Ler <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-slate-700 dark:text-slate-300">
            <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              <Star size={14} className="text-amber-500" fill="currentColor" />
              Sua Lista de Páginas Vigiadas
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Você pode clicar na estrela ⭐ no topo de qualquer artigo para acompanhá-lo aqui e ser notificado quando novas revisões ou discussões ocorrerem.
            </p>
          </div>

          {watchlist.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
              <Star size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nenhum artigo vigiado no momento
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Para vigiar uma página, abra qualquer artigo e clique no ícone de estrela na barra superior.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {watchlist.map((item, idx) => {
                const targetId = item.articleId || item.pageId || '';
                const targetTitle = item.articleTitle || item.pageId || 'Artigo';
                const dateStr = item.dataAdicionado || item.createdAt || '';
                return (
                <div
                  key={targetId || idx}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
                >
                  <div>
                    <button
                      onClick={() => targetId && onNavigateToArticle(targetId)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 text-left"
                    >
                      <Star size={13} className="text-amber-500" fill="currentColor" />
                      <span>{targetTitle}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      Vigiado desde {dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : 'data desconhecida'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const art = articles.find((a) => a.id === targetId);
                        if (art) handleToggleWatch(art);
                      }}
                      title="Desvigiar página"
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded transition"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => targetId && onNavigateToArticle(targetId)}
                      className="px-2.5 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1"
                    >
                      Abrir Artigo <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Orphan Pages */}
      {activeTab === 'orphans' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-slate-700 dark:text-slate-300">
            <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-500" />
              Páginas Órfãs (Sem Afluentes)
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Páginas órfãs são artigos enciclopédicos que não possuem links internos vindos de outros artigos. Ajudar a conectar esses artigos com referências cruzadas melhora a navegabilidade de toda a comunidade WikiWorldWeb.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {orphanArticles.map((art) => (
              <div
                key={art.id}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
              >
                <div>
                  <button
                    onClick={() => onNavigateToArticle(art.id)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                  >
                    <FileText size={13} />
                    <span>{art.titulo}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {art.resumo || art.descricao.slice(0, 100)}...
                  </p>
                </div>

                <button
                  onClick={() => onNavigateToArticle(art.id)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 flex-shrink-0"
                >
                  Conectar / Editar <ArrowRight size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Stubs & Short Articles */}
      {activeTab === 'stubs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/60 text-xs text-slate-700 dark:text-slate-300">
            <h4 className="font-bold text-cyan-900 dark:text-cyan-300 mb-1 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-500" />
              Artigos em Esboço e Páginas Curtas
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Estes artigos contêm informações introdutórias fundamentais, mas necessitam de ampliação com mais seções, tabelas, caixas de informação ou referências.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {stubArticles.map((art) => (
              <div
                key={art.id}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
              >
                <div>
                  <button
                    onClick={() => onNavigateToArticle(art.id)}
                    className="text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1.5"
                  >
                    <span>🧩 {art.titulo}</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    Tamanho: {art.descricao.length} bytes • Categoria: {art.categoria || 'Geral'}
                  </span>
                </div>

                <button
                  onClick={() => onNavigateToArticle(art.id)}
                  className="px-2.5 py-1 text-xs rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition flex items-center gap-1 flex-shrink-0 shadow-xs"
                >
                  Expandir Artigo <ArrowRight size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from(categoryMap.entries()).map(([cat, arts]) => (
              <div
                key={cat}
                className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <Folder size={14} className="text-amber-500" />
                    <span>{cat}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono font-bold">
                    {arts.length} {arts.length === 1 ? 'artigo' : 'artigos'}
                  </span>
                </div>

                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {arts.slice(0, 4).map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => onNavigateToArticle(a.id)}
                        className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate block text-left w-full text-[11px]"
                      >
                        • {a.titulo}
                      </button>
                    </li>
                  ))}
                  {arts.length > 4 && (
                    <li className="text-[10px] text-slate-400 italic">
                      + {arts.length - 4} outros artigos
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Statistics */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {stats.totalArticles}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono font-bold">
                Artigos Totais
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {stats.totalRevisions}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono font-bold">
                Revisões Salvas
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {stats.totalWords.toLocaleString('pt-BR')}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono font-bold">
                Palavras Totais
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {(stats.totalBytes / 1024).toFixed(1)} KB
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono font-bold">
                Volume de Texto
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
              <BarChart2 size={14} className="text-blue-600" />
              Principais Contribuidores da Enciclopédia
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {stats.topAuthors.map(([author, count], idx) => (
                <div key={author} className="py-2 flex items-center justify-between">
                  {onNavigateToUser ? (
                    <button
                      onClick={() => onNavigateToUser(author)}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                    >
                      <span>{idx + 1}.</span>
                      <span>User:{author}</span>
                    </button>
                  ) : (
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {idx + 1}. {author}
                    </span>
                  )}
                  <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                    {count} {count === 1 ? 'artigo' : 'artigos'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      {selectedArticleForPdf && (
        <PdfExportModal
          article={selectedArticleForPdf}
          pageName={pages.find((p) => p.uid === selectedArticleForPdf.pageUid)?.titulo || 'WikiWorldWeb'}
          isOpen={!!selectedArticleForPdf}
          onClose={() => setSelectedArticleForPdf(null)}
        />
      )}
    </div>
  );
};
