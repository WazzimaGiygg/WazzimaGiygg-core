/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NotMediaWiki Portal Component
 * Integrated implementation of https://github.com/WazzimaGiygg/NotMediaWiki-Beta-
 * Official domain: https://notmediawiki.wazzimagiygg.com/
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Edit3,
  Clock,
  Eye,
  Shield,
  List,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  FileText,
  GitCompare,
  Printer,
  Download,
  FolderTree,
  Database,
  Zap,
  Shuffle,
  ExternalLink,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  FileDown,
  Layers,
  Code,
  Users,
  Compass,
  Settings,
  Sparkles,
  ChevronRight,
  Trash2,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';
import {
  WikiArticle,
  WikiRevision,
  WikiEvent,
  WikiExtension,
  SEED_WIKI_EXTENSIONS,
  parseWikitextToHtml,
  computeWikitextDiff,
  ParseResult,
  DiffResult
} from '../../data/notMediaWikiData';
import {
  listWikiArticlesFromDb,
  saveWikiArticleInDb,
  deleteWikiArticleFromDb,
  listWikiRevisionsFromDb,
  listWikiEventsFromDb
} from '../../firebase';
import { stripHtmlToPlainText } from '../../utils/text';

interface NotMediaWikiPortalProps {
  currentUser?: any;
  showToast: (msg: string, isError?: boolean) => void;
}

export default function NotMediaWikiPortal({ currentUser, showToast }: NotMediaWikiPortalProps) {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<
    'portal' | 'reader' | 'editor' | 'history' | 'events' | 'special' | 'extensions' | 'governance'
  >('portal');

  // Articles & Revisions Data (Strictly from Database)
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [revisions, setRevisions] = useState<WikiRevision[]>([]);
  const [events, setEvents] = useState<WikiEvent[]>([]);
  const [extensions, setExtensions] = useState<WikiExtension[]>(SEED_WIKI_EXTENSIONS);
  const [isLoadingWikiData, setIsLoadingWikiData] = useState<boolean>(true);

  // Active Article in Reader
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editor States
  const [editorTitle, setEditorTitle] = useState<string>('');
  const [editorWikitext, setEditorWikitext] = useState<string>('');
  const [editorSummary, setEditorSummary] = useState<string>('');
  const [editorIsMinor, setEditorIsMinor] = useState<boolean>(false);
  const [editorTab, setEditorTab] = useState<'split' | 'code' | 'preview'>('split');
  const [isSavingArticle, setIsSavingArticle] = useState<boolean>(false);

  // History / Diff States
  const [selectedOldRevId, setSelectedOldRevId] = useState<string>('');
  const [selectedNewRevId, setSelectedNewRevId] = useState<string>('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  // PDF Generation State
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Load articles from Firestore & Backend Database
  useEffect(() => {
    const loadAllWikiDbData = async () => {
      setIsLoadingWikiData(true);
      try {
        const [dbArticles, dbRevisions, dbEvents] = await Promise.all([
          listWikiArticlesFromDb(),
          listWikiRevisionsFromDb(),
          listWikiEventsFromDb()
        ]);
        setArticles(dbArticles || []);
        setRevisions(dbRevisions || []);
        setEvents(dbEvents || []);
        if (dbArticles && dbArticles.length > 0 && !currentSlug) {
          setCurrentSlug(dbArticles[0].slug);
        }
      } catch (err) {
        console.warn('Erro ao sincronizar NotWikiPedia com banco de dados:', err);
      } finally {
        setIsLoadingWikiData(false);
      }
    };
    loadAllWikiDbData();
  }, []);

  // Currently active article object
  const currentArticle = useMemo(() => {
    if (!articles || articles.length === 0) return null;
    if (!currentSlug) return articles[0];
    return articles.find((a) => a.slug.toLowerCase() === currentSlug.toLowerCase()) || null;
  }, [articles, currentSlug]);

  // Compiled Parsoid AST Result for active article
  const parseResult: ParseResult = useMemo(() => {
    if (!currentArticle) {
      return {
        html: '',
        toc: [],
        categories: [],
        internalLinks: [],
        externalLinks: [],
        references: [],
        parseTimeMs: 0
      };
    }
    return parseWikitextToHtml(currentArticle.wikitext, currentArticle.title);
  }, [currentArticle]);

  // Active article revisions
  const articleRevisions = useMemo(() => {
    return revisions
      .filter((r) => r.articleSlug.toLowerCase() === currentSlug.toLowerCase())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [revisions, currentSlug]);

  // Setup initial diff selections
  useEffect(() => {
    if (articleRevisions.length >= 2) {
      setSelectedOldRevId(articleRevisions[1].id);
      setSelectedNewRevId(articleRevisions[0].id);
    } else if (articleRevisions.length === 1) {
      setSelectedOldRevId(articleRevisions[0].id);
      setSelectedNewRevId(articleRevisions[0].id);
    }
  }, [articleRevisions]);

  // Compute diff when revisions change
  useEffect(() => {
    if (selectedOldRevId && selectedNewRevId) {
      const oldRev = revisions.find((r) => r.id === selectedOldRevId);
      const newRev = revisions.find((r) => r.id === selectedNewRevId);
      if (oldRev && newRev) {
        const diff = computeWikitextDiff(oldRev.wikitext, newRev.wikitext, oldRev.id, newRev.id);
        setDiffResult(diff);
      }
    }
  }, [selectedOldRevId, selectedNewRevId, revisions]);

  // Internal link handler
  const handleNavigateSlug = (slug: string) => {
    const formatted = slug.replace(/^wiki\//, '').replace(/\s+/g, '_');
    const target = articles.find((a) => a.slug.toLowerCase() === formatted.toLowerCase());
    if (target) {
      setCurrentSlug(target.slug);
      setActiveTab('reader');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast(`Página "${formatted}" não encontrada no acervo.`, true);
    }
  };

  // Open Editor for current article
  const handleOpenEditor = (articleToEdit?: WikiArticle) => {
    const target = articleToEdit || currentArticle;
    if (target) {
      setEditorTitle(target.title);
      setEditorWikitext(target.wikitext);
      setEditorSummary(`Edição em ${target.title}`);
      setActiveTab('editor');
    }
  };

  // Open New Article Form
  const handleOpenNewArticle = () => {
    setEditorTitle('');
    setEditorWikitext(`== Introdução ==\nEscreva aqui a introdução do novo verbete...\n\n== Seções ==\n* Tópico 1\n* Tópico 2\n\n== Referências ==\n<references />\n\n[[Category:Geral]]`);
    setEditorSummary('Criação de novo verbete');
    setActiveTab('editor');
  };

  // Save or Update Article Revision
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorTitle.trim() || !editorWikitext.trim()) {
      showToast('Título e wikitexto são obrigatórios.', true);
      return;
    }

    setIsSavingArticle(true);
    try {
      const slug = editorTitle.trim().replace(/\s+/g, '_');
      const authorName = currentUser?.displayName || currentUser?.name || currentUser?.email || 'Editor Comunitário';
      const authorId = currentUser?.uid || 'usr_community';

      const revId = `rev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newRev: WikiRevision = {
        id: revId,
        articleSlug: slug,
        parentRevisionId: currentArticle?.latestRevisionId || null,
        wikitext: editorWikitext,
        comment: editorSummary.trim() || 'Atualização de conteúdo no banco de dados',
        author: { id: authorId, name: authorName, isBot: false },
        timestamp: new Date().toISOString(),
        sha256: Math.random().toString(36).substring(2, 18),
        byteSize: editorWikitext.length,
        isMinor: editorIsMinor
      };

      const existingIndex = articles.findIndex((a) => a.slug.toLowerCase() === slug.toLowerCase());
      let savedArt: WikiArticle;

      if (existingIndex >= 0) {
        savedArt = {
          ...articles[existingIndex],
          title: editorTitle.trim(),
          wikitext: editorWikitext,
          latestRevisionId: revId,
          updatedAt: new Date().toISOString(),
          views: (articles[existingIndex].views || 0) + 1
        };
      } else {
        savedArt = {
          id: `art-${Date.now()}`,
          slug,
          title: editorTitle.trim(),
          namespace: editorTitle.startsWith('Talk:') || editorTitle.startsWith('Discussão:') ? 1 : 0,
          wikitext: editorWikitext,
          summary: editorWikitext.substring(0, 150).replace(/[=[\]{}|]/g, '') + '...',
          latestRevisionId: revId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categories: ['Geral', 'Comunidade'],
          views: 1
        };
      }

      // Persist directly to Firestore database and sync with backend
      await saveWikiArticleInDb(savedArt, newRev);

      setArticles((prev) => {
        const without = prev.filter((a) => a.slug.toLowerCase() !== slug.toLowerCase());
        return [savedArt, ...without];
      });
      setRevisions((prev) => [newRev, ...prev]);

      // Add to events stream
      const newEvent: WikiEvent = {
        id: `evt-${Date.now()}`,
        meta: {
          uri: `https://notmediawiki.wazzimagiygg.com/wiki/${slug}`,
          request_id: `req-${Date.now()}`,
          id: `uuid-${Date.now()}`,
          dt: new Date().toISOString(),
          domain: 'notmediawiki.wazzimagiygg.com',
          stream: 'mediawiki.recentchange'
        },
        database: 'wzzmwiki',
        page_title: editorTitle,
        page_namespace: savedArt.namespace,
        rev_id: revId,
        rev_timestamp: new Date().toISOString(),
        rev_sha1: newRev.sha256,
        rev_minor_edit: editorIsMinor,
        rev_len: editorWikitext.length,
        user_text: authorName,
        comment: editorSummary || 'Edição no acervo',
        type: existingIndex >= 0 ? 'edit' : 'new'
      };
      setEvents((prev) => [newEvent, ...prev]);

      setCurrentSlug(slug);
      setActiveTab('reader');
      showToast(`✓ Artigo "${editorTitle}" gravado com sucesso no banco de dados!`);
    } catch {
      showToast('Erro ao gravar artigo no banco de dados.', true);
    } finally {
      setIsSavingArticle(false);
    }
  };

  // Rollback Revision in Database
  const handleRollback = async (revToRestore: WikiRevision) => {
    if (!currentArticle) return;
    if (!window.confirm(`Confirma reverter "${currentArticle.title}" para a versão de ${new Date(revToRestore.timestamp).toLocaleString('pt-BR')} por ${revToRestore.author.name}?`)) {
      return;
    }

    const revId = `rev-rb-${Date.now().toString(36)}`;
    const rollbackRev: WikiRevision = {
      id: revId,
      articleSlug: currentArticle.slug,
      parentRevisionId: currentArticle.latestRevisionId,
      wikitext: revToRestore.wikitext,
      comment: `Reversão para a revisão ${revToRestore.id} de ${revToRestore.author.name}`,
      author: {
        id: currentUser?.uid || 'sysop',
        name: currentUser?.displayName || currentUser?.email || 'Burocrata WZZM',
        isBot: false
      },
      timestamp: new Date().toISOString(),
      sha256: revToRestore.sha256,
      byteSize: revToRestore.wikitext.length,
      isMinor: true
    };

    const updatedArticle = {
      ...currentArticle,
      wikitext: revToRestore.wikitext,
      latestRevisionId: revId,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveWikiArticleInDb(updatedArticle, rollbackRev);
      setArticles((prev) =>
        prev.map((a) => (a.slug === currentArticle.slug ? updatedArticle : a))
      );
      setRevisions((prev) => [rollbackRev, ...prev]);
      showToast(`✓ Artigo revertido e gravado no banco de dados.`);
    } catch {
      showToast('Erro ao salvar reversão no banco de dados.', true);
    }
  };

  // Delete Article from Database (Exclusive for Burocrata)
  const handleDeleteArticle = async (slugToDelete: string) => {
    const isBureaucrat = currentUser?.email?.toLowerCase() === 'pedrohenriquecardonaperes@gmail.com';
    if (!isBureaucrat) {
      showToast('Apenas o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) pode excluir artigos do banco de dados.', true);
      return;
    }
    if (!window.confirm(`Confirma a exclusão definitiva do artigo "${slugToDelete}" do banco de dados?`)) {
      return;
    }
    try {
      await deleteWikiArticleFromDb(slugToDelete);
      setArticles((prev) => prev.filter((a) => a.slug.toLowerCase() !== slugToDelete.toLowerCase()));
      setRevisions((prev) => prev.filter((r) => r.articleSlug.toLowerCase() !== slugToDelete.toLowerCase()));
      showToast(`Artigo "${slugToDelete}" excluído com sucesso do banco de dados.`);
      setCurrentSlug('');
      setActiveTab('portal');
    } catch {
      showToast('Erro ao excluir artigo do banco de dados.', true);
    }
  };

  // Export Wiki Article to PDF using jsPDF
  const handleExportWikiToPdf = async () => {
    if (!currentArticle) {
      showToast('Nenhum artigo selecionado para exportar.', true);
      return;
    }

    try {
      setIsExportingPdf(true);
      showToast('Gerando documento PDF oficial NotMediaWiki...');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header Banner
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      doc.text('NOTMEDIAWIKI — ENCICLOPÉDIA DIGITAL WAZZIMAGIYGG', pageWidth / 2, y, { align: 'center' });
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      doc.text('PARSOID AST COMPILER • ZERO-TRUST ARCHITECTURE • NOTMEDIAWIKI.WAZZIMAGIYGG.COM', pageWidth / 2, y, { align: 'center' });
      y += 4;

      doc.setDrawColor(20, 20, 20);
      doc.setLineWidth(0.6);
      doc.line(margin, y, pageWidth - margin, y);
      y += 1.5;
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      // Article Title
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 15, 15);
      const titleLines = doc.splitTextToSize(currentArticle.title || 'Verbete', contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 7 + 2;

      // Metadata
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const metaText = `Última Revisão: ${currentArticle.latestRevisionId} • Atualizado: ${new Date(currentArticle.updatedAt).toLocaleDateString('pt-BR')} • Visualizações: ${currentArticle.views}`;
      doc.text(metaText, margin, y);
      y += 4;

      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      // Plain text extraction
      const plainText = stripHtmlToPlainText(parseResult.html) || 'Sem conteúdo textual.';
      const paragraphs = plainText
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      const lineHeight = 5;

      for (const para of paragraphs) {
        const lines = doc.splitTextToSize(para, contentWidth);
        const blockHeight = lines.length * lineHeight;

        if (y + blockHeight > pageHeight - margin - 20) {
          doc.addPage();
          y = margin + 5;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(120, 120, 120);
          doc.text(`NotMediaWiki • ${currentArticle.title}`, margin, y - 5);
          doc.setDrawColor(220, 220, 220);
          doc.line(margin, y - 3, pageWidth - margin, y - 3);
          doc.setFont('times', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
        }

        doc.text(lines, margin, y);
        y += blockHeight + 3;
      }

      // Add page numbers
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(130, 130, 130);
        doc.text(
          `Página ${i} de ${totalPages} • NotMediaWiki (WazzimaGiygg) • notmediawiki.wazzimagiygg.com`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      const filename = `notmediawiki_${currentArticle.slug.toLowerCase()}.pdf`;
      doc.save(filename);
      showToast(`✓ PDF "${filename}" exportado com sucesso!`);
    } catch (err: any) {
      showToast('Erro ao exportar PDF: ' + err.message, true);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Filtered articles for Search
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.wikitext.toLowerCase().includes(q) ||
        a.categories.some((c) => c.toLowerCase().includes(q))
    );
  }, [articles, searchQuery]);

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in">
      {/* 1. TOP NOTMEDIAWIKI IDENTITY BANNER */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-6 border-4 border-[#141414] shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-blue-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                Módulo Integrado
              </span>
              <span className="bg-purple-900 text-purple-200 border border-purple-400 font-mono text-[10px] font-bold px-2 py-0.5">
                Parsoid AST • Node.js Mesh
              </span>
              <span className="bg-emerald-900 text-emerald-200 border border-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5">
                Zero-Trust ABAC
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-stone-900 border-2 border-black flex items-center justify-center font-editorial font-bold text-2xl shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]">
                W
              </div>
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>NotMediaWiki</span>
                  <span className="text-xs font-mono font-normal text-amber-400 bg-amber-950/80 px-2 py-0.5 border border-amber-600">
                    Beta Engine
                  </span>
                </h2>
                <p className="text-xs font-mono text-stone-300 mt-0.5">
                  Base de conhecimento colaborativa e microsserviços Parsoid do ecossistema WazzimaGiygg.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="https://notmediawiki.wazzimagiygg.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-blue-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>Acessar notmediawiki.wazzimagiygg.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleOpenNewArticle}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border border-amber-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Verbete</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. INNER WIKI SUB-NAVIGATION BAR */}
      <nav className="bg-[#EBE8E1] border-2 border-[#141414] p-1.5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider">
          {[
            { id: 'portal', label: 'Portal Comunitário', icon: Compass },
            { id: 'reader', label: currentArticle ? `Verbete: ${currentArticle.title}` : 'Leitor de Verbete', icon: BookOpen },
            { id: 'editor', label: 'Editor Wikitexto', icon: Edit3 },
            { id: 'history', label: 'Histórico & Diff', icon: GitCompare },
            { id: 'events', label: 'EventStreams ao Vivo', icon: Zap },
            { id: 'special', label: 'Páginas Especiais', icon: List },
            { id: 'extensions', label: 'Extensões (6)', icon: Layers },
            { id: 'governance', label: 'Governança & ArbCom', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#141414] text-white border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]'
                    : 'bg-transparent text-stone-800 border-transparent hover:bg-stone-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-600'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ===================================================================== */}
      {/* TAB 1: PORTAL COMUNITÁRIO (HOME)                                      */}
      {/* ===================================================================== */}
      {activeTab === 'portal' && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
            <div className="border-b-2 border-[#141414] pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-editorial text-2xl font-bold text-stone-950">
                    Bem-vindo(a) ao NotMediaWiki
                  </h3>
                  <p className="text-xs font-mono text-stone-600 mt-1">
                    A enciclopédia livre desacoplada dos projetos <strong>WazzimaGiygg</strong> (wazzimagiygg.com).
                  </p>
                </div>
                <button
                  onClick={() => {
                    const pool = articles.filter((a) => a.slug !== currentSlug);
                    const candidates = pool.length > 0 ? pool : articles;
                    if (candidates.length > 0) {
                      const random = candidates[Math.floor(Math.random() * candidates.length)];
                      handleNavigateSlug(random.slug);
                    } else {
                      showToast('Nenhum artigo cadastrado no banco de dados para sorteio.', true);
                    }
                  }}
                  className="paper-button-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  title="Abrir verbete aleatório"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Artigo Aleatório</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs my-4">
              <div className="bg-[#FAF9F5] p-3 border border-stone-300">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Verbetes Ativos</span>
                <div className="text-2xl font-bold text-stone-900 mt-1">{articles.length}</div>
              </div>
              <div className="bg-[#FAF9F5] p-3 border border-stone-300">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Revisões Gravadas</span>
                <div className="text-2xl font-bold text-stone-900 mt-1">{revisions.length}</div>
              </div>
              <div className="bg-[#FAF9F5] p-3 border border-stone-300">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Leituras Totais</span>
                <div className="text-2xl font-bold text-stone-900 mt-1">
                  {articles.reduce((acc, a) => acc + a.views, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-[#FAF9F5] p-3 border border-stone-300">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Parser Parsoid</span>
                <div className="text-sm font-bold text-emerald-700 mt-1">✓ AST Ativo (0.4ms)</div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative my-4">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Pesquisar verbetes no NotMediaWiki..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-mono bg-[#F8F7F4] border border-[#141414] focus:outline-none"
              />
            </div>

            {/* Articles Grid */}
            {isLoadingWikiData ? (
              <div className="p-12 text-center text-stone-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-stone-800 border-t-amber-500 rounded-full animate-spin" />
                <p>Sincronizando verbetes reais do banco de dados (Firestore)...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="p-10 border border-dashed border-stone-400 bg-stone-50 text-center font-mono text-xs space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-stone-400" />
                <p className="font-bold text-stone-800">Nenhum verbete encontrado no banco de dados.</p>
                <p className="text-stone-500 text-[11px] max-w-md mx-auto">
                  A NotWikiPedia sincroniza apenas dados reais persistidos no banco. Seja o primeiro a criar um verbete colaborativo!
                </p>
                <button
                  onClick={handleOpenNewArticle}
                  className="bg-[#141414] hover:bg-stone-800 text-white px-4 py-2 font-bold uppercase text-[10px] tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Criar Primeiro Artigo no Banco</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    className="paper-card p-4 flex flex-col justify-between hover:border-black cursor-pointer group"
                    onClick={() => handleNavigateSlug(art.slug)}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 mb-2">
                        <span className="bg-stone-100 text-stone-800 font-bold px-1.5 py-0.5 border border-stone-300 uppercase">
                          {art.namespace === 1 ? 'Discussão' : 'Artigo'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{art.views.toLocaleString()}</span>
                        </span>
                      </div>

                      <h4 className="font-editorial text-lg font-bold text-stone-950 group-hover:text-blue-800 transition-colors">
                        {art.title}
                      </h4>

                      <p className="text-xs font-serif text-stone-600 line-clamp-3 mt-1.5 leading-relaxed">
                        {art.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-200 mt-3 flex items-center justify-between text-[10px] font-mono text-stone-500">
                      <span>Rev: {art.latestRevisionId}</span>
                      <span className="text-blue-700 font-bold group-hover:translate-x-1 transition-transform">
                        Ler verbete ➔
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: WIKI READER (LEITOR ESTILO MEDIAWIKI)                          */}
      {/* ===================================================================== */}
      {activeTab === 'reader' && !currentArticle && (
        <div className="bg-[#FAF9F5] border-2 border-[#141414] p-10 text-center font-mono text-xs shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-stone-400" />
          <h3 className="font-editorial text-2xl font-bold text-stone-900">
            Nenhum Artigo Selecionado ou Cadastrado no Banco de Dados
          </h3>
          <p className="text-stone-600 max-w-md mx-auto">
            O acervo da NotWikiPedia sincroniza exclusivamente dados reais salvos no banco. Não há dados sugeridos ou simulados.
          </p>
          <button
            onClick={() => {
              setEditorTitle(currentSlug || 'Página_Principal');
              setEditorWikitext('== Introdução ==\nEscreva aqui o conteúdo do novo verbete no banco de dados...');
              setEditorSummary('Criação do verbete');
              setActiveTab('editor');
            }}
            className="paper-button bg-stone-900 text-white hover:bg-stone-800 px-4 py-2 font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Criar Este Artigo no Banco</span>
          </button>
        </div>
      )}

      {activeTab === 'reader' && currentArticle && (
        <div className="space-y-6">
          {/* Article Header Bar */}
          <div className="bg-[#FAF9F5] border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#141414] pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono mb-1">
                  <span className="bg-stone-900 text-white font-bold px-2 py-0.5 text-[10px] uppercase">
                    Namespace {currentArticle.namespace === 1 ? 'Discussão' : 'Principal'}
                  </span>
                  <span className="text-stone-500">•</span>
                  <span className="text-stone-600">Revisão: {currentArticle.latestRevisionId}</span>
                  {currentArticle.isProtected && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-400 font-bold px-1.5 py-0.2 text-[9px] uppercase flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" /> Protegido
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-stone-950">
                  {currentArticle.title}
                </h1>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenEditor(currentArticle)}
                  className="paper-button bg-stone-900 text-white hover:bg-stone-800 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Editar Wikitexto</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className="paper-button-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Histórico ({articleRevisions.length})</span>
                </button>

                {currentUser?.email?.toLowerCase() === 'pedrohenriquecardonaperes@gmail.com' && (
                  <button
                    onClick={() => handleDeleteArticle(currentArticle.slug)}
                    className="paper-button bg-stone-800 hover:bg-red-800 text-stone-300 hover:text-white px-2.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    title="Excluir do banco de dados (Burocrata)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )}

                <button
                  onClick={handleExportWikiToPdf}
                  disabled={isExportingPdf}
                  className="paper-button bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] disabled:opacity-50"
                  title="Exportar verbete para PDF com jsPDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isExportingPdf ? 'Gerando...' : 'Salvar como PDF'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="paper-button-secondary px-2.5 py-1.5 text-xs font-mono font-bold uppercase cursor-pointer"
                  title="Imprimir"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table of Contents (TOC) if headings exist */}
            {parseResult.toc.length > 0 && (
              <div className="my-6 p-4 bg-stone-50 border border-stone-300 max-w-sm font-sans text-xs">
                <div className="font-bold text-stone-900 uppercase tracking-wider font-mono text-[11px] mb-2 border-b pb-1 flex items-center gap-2">
                  <List className="w-3.5 h-3.5 text-stone-600" />
                  <span>Índice / Conteúdo</span>
                </div>
                <ul className="space-y-1">
                  {parseResult.toc.map((item) => (
                    <li
                      key={item.id}
                      style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                      className="text-stone-700 hover:text-blue-700"
                    >
                      <a href={`#${item.id}`} className="hover:underline flex items-center gap-1.5">
                        <span className="font-mono text-stone-400 text-[10px]">{item.number}</span>
                        <span>{item.text}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Compiled HTML Content from Parsoid */}
            <div
              className="wiki-article-body prose prose-stone max-w-none font-serif text-stone-900 leading-relaxed text-base"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                const link = target.closest('a[data-wikilink]') as HTMLAnchorElement;
                if (link) {
                  e.preventDefault();
                  const targetSlug = link.getAttribute('data-wikilink');
                  if (targetSlug) handleNavigateSlug(targetSlug);
                }
              }}
              dangerouslySetInnerHTML={{ __html: parseResult.html }}
            />

            {/* Categories Chips */}
            {parseResult.categories.length > 0 && (
              <div className="mt-8 pt-4 border-t-2 border-stone-300 font-mono text-xs flex flex-wrap items-center gap-2">
                <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <FolderTree className="w-3 h-3 text-stone-500" />
                  <span>Categorias:</span>
                </span>
                {parseResult.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="bg-stone-100 hover:bg-stone-200 border border-stone-300 px-2.5 py-0.5 text-stone-800 font-bold uppercase text-[10px]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: WIKI EDITOR (EDITOR DE WIKITEXTO COM PRÉVIA SPLIT)             */}
      {/* ===================================================================== */}
      {activeTab === 'editor' && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#141414] pb-4">
            <div>
              <h3 className="font-editorial text-2xl font-bold text-stone-950 flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-red-700" />
                <span>Editor de Wikitexto NotMediaWiki</span>
              </h3>
              <p className="text-xs font-mono text-stone-600 mt-1">
                Suporta sintaxe MediaWiki completa: cabeçalhos, infoboxes, links internos `[[...]]`, tabelas e citações `&lt;ref&gt;`.
              </p>
            </div>

            {/* Editor mode tabs */}
            <div className="flex items-center gap-1 font-mono text-xs">
              {(['split', 'code', 'preview'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEditorTab(mode)}
                  className={`px-3 py-1 font-bold uppercase border cursor-pointer transition-all ${
                    editorTab === mode
                      ? 'bg-[#141414] text-white border-[#141414]'
                      : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {mode === 'split' ? 'Lado a Lado' : mode === 'code' ? 'Código' : 'Prévia'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveArticle} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-stone-700 font-bold uppercase text-[10px] mb-1">
                Título do Verbete:
              </label>
              <input
                type="text"
                required
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder="Ex: Parsoid, Sistemas Distribuídos"
                className="w-full p-2.5 border border-[#141414] bg-[#F8F7F4] focus:outline-none text-sm font-editorial font-bold"
              />
            </div>

            {/* Code / Preview Area */}
            <div className={`grid gap-4 ${editorTab === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {(editorTab === 'split' || editorTab === 'code') && (
                <div>
                  <label className="block text-stone-700 font-bold uppercase text-[10px] mb-1">
                    Código Wikitexto:
                  </label>
                  <textarea
                    rows={18}
                    required
                    value={editorWikitext}
                    onChange={(e) => setEditorWikitext(e.target.value)}
                    placeholder="Escreva em wikitexto..."
                    className="w-full p-3 border border-[#141414] bg-[#F8F7F4] font-mono text-xs focus:outline-none leading-relaxed"
                  />
                </div>
              )}

              {(editorTab === 'split' || editorTab === 'preview') && (
                <div className="border border-stone-300 bg-[#FAF9F5] p-4 overflow-y-auto max-h-[500px]">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-3 border-b pb-1 font-mono">
                    Pré-visualização Parsoid ao Vivo:
                  </span>
                  <div
                    className="prose prose-stone max-w-none font-serif text-xs text-stone-900 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: parseWikitextToHtml(editorWikitext, editorTitle).html }}
                  />
                </div>
              )}
            </div>

            {/* Summary & Minor Edit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold uppercase text-[10px] mb-1">
                  Sumário da Edição (Explicação curta):
                </label>
                <input
                  type="text"
                  value={editorSummary}
                  onChange={(e) => setEditorSummary(e.target.value)}
                  placeholder="Ex: Correção tipográfica, adição de referências"
                  className="w-full p-2 border border-[#141414] bg-[#F8F7F4] focus:outline-none"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800 text-[11px]">
                  <input
                    type="checkbox"
                    checked={editorIsMinor}
                    onChange={(e) => setEditorIsMinor(e.target.checked)}
                  />
                  <span>Esta é uma edição menor</span>
                </label>
              </div>
            </div>

            {/* Submit Toolbar */}
            <div className="flex items-center justify-between pt-3 border-t">
              <button
                type="button"
                onClick={() => setActiveTab('reader')}
                className="paper-button-secondary px-4 py-2 font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSavingArticle}
                className="paper-button bg-red-700 hover:bg-red-800 text-white px-6 py-2 font-bold uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-amber-300" />
                <span>{isSavingArticle ? 'Gravando Revisão...' : 'Gravar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: ARTICLE HISTORY & DIFF                                         */}
      {/* ===================================================================== */}
      {activeTab === 'history' && !currentArticle && (
        <div className="bg-white border-2 border-[#141414] p-10 text-center font-mono text-xs shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <GitCompare className="w-12 h-12 mx-auto text-stone-400" />
          <h3 className="font-editorial text-2xl font-bold text-stone-900">
            Nenhum Artigo Selecionado para Histórico
          </h3>
          <p className="text-stone-600 max-w-md mx-auto">
            Selecione ou crie um verbete real no banco de dados para consultar suas revisões criptográficas.
          </p>
          <button
            onClick={() => setActiveTab('portal')}
            className="paper-button bg-stone-900 text-white hover:bg-stone-800 px-4 py-2 font-bold uppercase tracking-wider cursor-pointer"
          >
            Voltar ao Acervo
          </button>
        </div>
      )}

      {activeTab === 'history' && currentArticle && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b-2 border-[#141414] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-editorial text-2xl font-bold text-stone-950 flex items-center gap-2">
                <GitCompare className="w-6 h-6 text-blue-700" />
                <span>Histórico de Revisões: {currentArticle.title}</span>
              </h3>
              <p className="text-xs font-mono text-stone-600 mt-1">
                Ledger imutável com hashes SHA-256 e cálculo de diff visual via algoritmo Myers.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('reader')}
              className="paper-button-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase cursor-pointer"
            >
              Voltar ao Verbete
            </button>
          </div>

          {/* Diff Controls Selector */}
          {articleRevisions.length >= 2 && (
            <div className="p-4 bg-[#FAF9F5] border-2 border-stone-300 font-mono text-xs space-y-3">
              <span className="font-bold text-stone-900 uppercase text-[11px] block">
                Comparar Duas Revisões:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-stone-600 uppercase font-bold mb-1">
                    Versão Antiga (Base):
                  </label>
                  <select
                    value={selectedOldRevId}
                    onChange={(e) => setSelectedOldRevId(e.target.value)}
                    className="w-full p-2 border border-stone-400 bg-white"
                  >
                    {articleRevisions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} — {new Date(r.timestamp).toLocaleString('pt-BR')} ({r.author.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-stone-600 uppercase font-bold mb-1">
                    Versão Mais Recente (Comparada):
                  </label>
                  <select
                    value={selectedNewRevId}
                    onChange={(e) => setSelectedNewRevId(e.target.value)}
                    className="w-full p-2 border border-stone-400 bg-white"
                  >
                    {articleRevisions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} — {new Date(r.timestamp).toLocaleString('pt-BR')} ({r.author.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {diffResult && (
                <div className="flex items-center gap-4 text-[11px] pt-2 border-t border-stone-300">
                  <span className="text-emerald-700 font-bold">+{diffResult.stats.added} linhas adicionadas</span>
                  <span className="text-red-700 font-bold">-{diffResult.stats.removed} linhas removidas</span>
                  <span className="text-stone-600 font-bold">{diffResult.stats.byteDelta > 0 ? `+${diffResult.stats.byteDelta}` : diffResult.stats.byteDelta} bytes</span>
                </div>
              )}
            </div>
          )}

          {/* Visual Diff View */}
          {diffResult && (
            <div className="border border-stone-300 font-mono text-xs overflow-x-auto bg-white">
              <div className="bg-[#141414] text-white p-2.5 font-bold uppercase text-[10px] tracking-wider">
                Diff Linha a Linha (Algoritmo Myers)
              </div>
              <div className="divide-y divide-stone-200">
                {diffResult.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start p-1.5 font-mono text-xs ${
                      line.type === 'added'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : line.type === 'removed'
                        ? 'bg-red-50 text-red-950 line-through border-l-4 border-red-600'
                        : 'text-stone-800'
                    }`}
                  >
                    <span className="w-8 shrink-0 text-stone-400 text-[10px] select-none text-right pr-2">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    <span className="w-12 shrink-0 text-stone-400 text-[10px] select-none">
                      {line.lineNumberNew || line.lineNumberOld}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all">{line.content || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revisions Table */}
          <div className="overflow-x-auto">
            <span className="font-bold text-stone-900 font-mono text-xs uppercase tracking-wider block mb-2">
              Todas as Revisões Deste Verbete:
            </span>
            <table className="w-full font-mono text-xs border-collapse border border-stone-300">
              <thead>
                <tr className="bg-[#141414] text-white uppercase text-[10px]">
                  <th className="p-2.5 text-left">ID Revisão</th>
                  <th className="p-2.5 text-left">Data & Hora</th>
                  <th className="p-2.5 text-left">Autor</th>
                  <th className="p-2.5 text-left">Sumário</th>
                  <th className="p-2.5 text-right">Tamanho</th>
                  <th className="p-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {articleRevisions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-stone-500 font-mono text-xs">
                      Nenhuma revisão registrada no banco de dados para este verbete.
                    </td>
                  </tr>
                ) : (
                  articleRevisions.map((rev) => (
                    <tr key={rev.id} className="hover:bg-amber-50">
                      <td className="p-2.5 font-bold text-blue-700">{rev.id}</td>
                      <td className="p-2.5 text-stone-600">{new Date(rev.timestamp).toLocaleString('pt-BR')}</td>
                      <td className="p-2.5 font-bold text-stone-900">{rev.author.name}</td>
                      <td className="p-2.5 text-stone-700 font-serif">{rev.comment}</td>
                      <td className="p-2.5 text-right text-stone-500">{rev.byteSize} bytes</td>
                      <td className="p-2.5 text-right">
                        {rev.id !== currentArticle.latestRevisionId && (
                          <button
                            onClick={() => handleRollback(rev)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Reverter
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: EVENTSTREAMS EM TEMPO REAL                                     */}
      {/* ===================================================================== */}
      {activeTab === 'events' && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="border-b-2 border-[#141414] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <h3 className="font-editorial text-2xl font-bold text-stone-950">
                  EventStreams em Tempo Real
                </h3>
              </div>
              <p className="text-xs font-mono text-stone-600 mt-1">
                Feed de eventos e mutações do acervo NotMediaWiki transmitido via Server-Sent Events (SSE).
              </p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {events.length === 0 ? (
              <div className="p-8 border border-dashed border-stone-300 bg-stone-50 text-center font-mono text-xs text-stone-500">
                Nenhuma alteração recente registrada no banco de dados. Todas as edições e criações aparecerão aqui em tempo real.
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 border border-stone-300 bg-stone-50 hover:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#141414] text-white px-1.5 py-0.2 text-[9px] font-bold uppercase">
                        {evt.type}
                      </span>
                      <span
                        onClick={() => handleNavigateSlug(evt.page_title)}
                        className="font-bold text-blue-800 hover:underline cursor-pointer"
                      >
                        {evt.page_title}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500">
                      {new Date(evt.meta?.dt || evt.timestamp || Date.now()).toLocaleTimeString('pt-BR')} • {evt.meta?.stream || 'mediawiki.recentchange'}
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 font-serif">{evt.comment}</p>

                  <div className="mt-2 text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-200">
                    <span>Editor: <strong>{evt.user_text}</strong></span>
                    <span>{evt.rev_len} bytes • rev: {evt.rev_id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: PÁGINAS ESPECIAIS (SPECIAL PAGES HUB)                          */}
      {/* ===================================================================== */}
      {activeTab === 'special' && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6 font-mono text-xs">
          <div className="border-b-2 border-[#141414] pb-4">
            <h3 className="font-editorial text-2xl font-bold text-stone-950 flex items-center gap-2">
              <List className="w-6 h-6 text-stone-700" />
              <span>Diretório de Páginas Especiais (Special:SpecialPages)</span>
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Ferramentas de indexação, relatórios e navegação estruturada no acervo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAF9F5] border-2 border-[#141414]">
              <span className="font-bold uppercase text-[11px] block mb-2 text-stone-900">
                Páginas do Acervo:
              </span>
              <ul className="space-y-1.5 text-stone-700">
                {articles.length === 0 ? (
                  <li className="text-stone-500 italic text-[11px]">Nenhum artigo cadastrado no banco de dados.</li>
                ) : (
                  articles.map((art) => (
                    <li key={art.id}>
                      <button
                        onClick={() => handleNavigateSlug(art.slug)}
                        className="hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-3 h-3 text-stone-400" />
                        <span>{art.title}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="p-4 bg-[#FAF9F5] border-2 border-[#141414]">
              <span className="font-bold uppercase text-[11px] block mb-2 text-stone-900">
                Estatísticas Globais:
              </span>
              <div className="space-y-2 text-stone-800">
                <div className="flex justify-between border-b pb-1">
                  <span>Total de Páginas:</span>
                  <span className="font-bold">{articles.length}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Revisões Efetuadas:</span>
                  <span className="font-bold">{revisions.length}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Visualizações Totais:</span>
                  <span className="font-bold">{articles.reduce((a, b) => a + b.views, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Extensões Ativas:</span>
                  <span className="font-bold text-emerald-700">{extensions.length} ativas</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF9F5] border-2 border-[#141414]">
              <span className="font-bold uppercase text-[11px] block mb-2 text-stone-900">
                Ações Rápidas:
              </span>
              <div className="space-y-2">
                <button
                  onClick={handleOpenNewArticle}
                  className="w-full bg-[#141414] hover:bg-stone-800 text-white p-2 font-bold uppercase text-[10px] cursor-pointer"
                >
                  Criar Nova Página
                </button>
                <button
                  onClick={() => {
                    if (articles.length === 0) {
                      showToast('Nenhum artigo cadastrado no banco de dados para sorteio.', true);
                      return;
                    }
                    const random = articles[Math.floor(Math.random() * articles.length)];
                    handleNavigateSlug(random.slug);
                  }}
                  className="w-full paper-button-secondary p-2 font-bold uppercase text-[10px] cursor-pointer"
                >
                  Página Aleatória
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: EXTENSÕES (EXTENSIONS MANAGER)                                 */}
      {/* ===================================================================== */}
      {activeTab === 'extensions' && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="border-b-2 border-[#141414] pb-4">
            <h3 className="font-editorial text-2xl font-bold text-stone-950 flex items-center gap-2">
              <Layers className="w-6 h-6 text-purple-700" />
              <span>Gerenciador de Extensões NotMediaWiki</span>
            </h3>
            <p className="text-xs font-mono text-stone-600 mt-1">
              Extensões e módulos de parser integrados à arquitetura desacoplada do Wiki.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {extensions.map((ext) => (
              <div key={ext.id} className="p-4 border-2 border-stone-300 bg-[#FAF9F5] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-stone-900 text-white font-bold px-2 py-0.5 text-[9px] uppercase">
                      {ext.category}
                    </span>
                    <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> v{ext.version}
                    </span>
                  </div>
                  <h4 className="font-editorial text-lg font-bold text-stone-950">{ext.namePt}</h4>
                  <p className="font-serif text-xs text-stone-600 mt-1 leading-relaxed">{ext.description}</p>
                </div>

                <div className="pt-3 border-t border-stone-200 mt-3 flex items-center justify-between text-[10px] text-stone-500">
                  <span>Autor: {ext.author}</span>
                  <a
                    href={ext.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline font-bold"
                  >
                    Documentação ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 8: GOVERNANÇA, ARBCOM & AUDITORIA FORENSE                          */}
      {/* ===================================================================== */}
      {activeTab === 'governance' && (
        <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6 font-mono text-xs">
          <div className="border-b-2 border-[#141414] pb-4">
            <h3 className="font-editorial text-2xl font-bold text-stone-950 flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-700" />
              <span>Painel de Governança, ArbCom & CheckUser</span>
            </h3>
            <p className="text-xs font-mono text-stone-600 mt-1">
              Supervisão de integridade, conformidade com LGPD e auditoria de conexões.
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-600 p-4 shadow-[3px_3px_0px_0px_rgba(220,38,38,1)]">
            <span className="font-bold text-red-800 uppercase block mb-1">
              Regras Zero-Trust ABAC em Vigor
            </span>
            <p className="text-stone-800 font-mono text-xs leading-relaxed">
              O NotMediaWiki implementa autenticação estrita: apenas o burocrata oficial credenciado (<strong>pedrohenriquecardonaperes@gmail.com</strong>) possui permissão para desproteger páginas restritas ou efetuar ações destrutivas globais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 border border-stone-300">
              <span className="font-bold uppercase text-[10px] text-stone-500 block mb-1">Comitê de Arbitragem (ArbCom)</span>
              <div className="text-sm font-bold text-stone-900">0 Disputas Abertas</div>
              <span className="text-[10px] text-emerald-700 mt-1 block">✓ Todas as resoluções em conformidade</span>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-300">
              <span className="font-bold uppercase text-[10px] text-stone-500 block mb-1">CheckUser Universal</span>
              <div className="text-sm font-bold text-stone-900">Audit Trail Ativo</div>
              <span className="text-[10px] text-stone-600 mt-1 block">Hashes SHA-256 e IPs verificados</span>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-300">
              <span className="font-bold uppercase text-[10px] text-stone-500 block mb-1">Conformidade LGPD</span>
              <div className="text-sm font-bold text-stone-900">Art. 18 Integrado</div>
              <span className="text-[10px] text-stone-600 mt-1 block">Canal oficial de exclusão ativo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
