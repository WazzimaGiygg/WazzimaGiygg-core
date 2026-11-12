import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Copy,
  ExternalLink,
  Edit3,
  Image as ImageIcon,
  Check,
  ChevronRight,
  AlertCircle,
  Zap,
  Crown,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  UserProfile,
  WikiArticle,
  GeminiNotebookItem,
  GeminiNotebookSource,
  GeminiNotebookNote,
  GeminiQuotaInfo,
} from '../types';
import { GeminiNotebookService } from '../services/geminiNotebookService';
import { GeminiQuotaService } from '../services/geminiQuotaService';
import { StorageService } from '../services/storageService';

interface GeminiNotebookProps {
  user?: UserProfile | null;
  currentUser?: UserProfile | null;
  articles?: WikiArticle[];
  existingArticles?: WikiArticle[];
  pages?: any[];
  onOpenArticle?: (articleId: string) => void;
  onOpenEditorWithContent?: (title: string, content: string, category: string) => void;
  onInsertArticle?: (articleData: {
    titulo: string;
    categoria: string;
    pageUid: string;
    descricao: string;
    resumo: string;
  }) => void;
  onOpenLoginModal?: () => void;
  onOpenPremiumModal?: (quotaType?: 'chats' | 'images' | 'notebook') => void;
  onClose?: () => void;
}

export const GeminiNotebook: React.FC<GeminiNotebookProps> = (props) => {
  const user = props.user ?? props.currentUser ?? null;
  const rawArticles = props.articles ?? props.existingArticles ?? [];
  const articles: WikiArticle[] = Array.isArray(rawArticles) ? rawArticles : [];
  const onClose = props.onClose;
  const onOpenArticle = props.onOpenArticle || ((id: string) => {});
  const onOpenEditorWithContent =
    props.onOpenEditorWithContent ||
    ((title: string, content: string, category: string) => {
      if (props.onInsertArticle) {
        props.onInsertArticle({
          titulo: title,
          categoria: category,
          pageUid: props.pages?.[0]?.uid || 'wiki-geral',
          descricao: content,
          resumo: 'Criado com Gemini Notebook',
        });
        if (onClose) onClose();
      }
    });
  const onOpenLoginModal = props.onOpenLoginModal || (() => {});
  const onOpenPremiumModal = props.onOpenPremiumModal || (() => {});
  const [notebooks, setNotebooks] = useState<GeminiNotebookItem[]>([]);
  const [currentNotebook, setCurrentNotebook] = useState<GeminiNotebookItem | null>(null);
  const [sources, setSources] = useState<GeminiNotebookSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

  // Estado de síntese
  const [action, setAction] = useState<'full_article' | 'section' | 'infobox' | 'timeline' | 'fact_check' | 'custom'>('full_article');
  const [customPrompt, setCustomPrompt] = useState('');
  const [targetArticleId, setTargetArticleId] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedWikitext, setSynthesizedWikitext] = useState('');
  const [synthesizedSummary, setSynthesizedSummary] = useState('');
  const [previewTab, setPreviewTab] = useState<'preview' | 'raw'>('preview');

  // Modais de fonte
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [addSourceType, setAddSourceType] = useState<'wiki_article' | 'text' | 'image'>('wiki_article');
  const [selectedWikiArticleId, setSelectedWikiArticleId] = useState<string>('');
  const [sourceSearchTerm, setSourceSearchTerm] = useState('');
  const [freeTextTitle, setFreeTextTitle] = useState('');
  const [freeTextContent, setFreeTextContent] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Inserção no Wiki
  const [insertionMode, setInsertionMode] = useState<'append' | 'prepend' | 'replace'>('append');
  const [insertionStatus, setInsertionStatus] = useState<string | null>(null);
  const [insertedArticleId, setInsertedArticleId] = useState<string | null>(null);

  // Informações de Cota
  const quotaInfo = GeminiQuotaService.getQuotaInfo(user);

  // Inicializa cadernos
  useEffect(() => {
    loadNotebooks();
  }, [user]);

  const loadNotebooks = async () => {
    const list = await GeminiNotebookService.getNotebooks(user);
    setNotebooks(list);

    if (list.length > 0 && !currentNotebook) {
      setCurrentNotebook(list[0]);
      setSources(list[0].sources || []);
      setSelectedSourceIds(list[0].sources?.map((s) => s.id) || []);
    } else if (list.length === 0) {
      // Cria caderno padrão
      const defaultNb: GeminiNotebookItem = {
        id: 'nb_' + Date.now(),
        title: 'Pesquisa Enciclopédica WikiWorldWeb',
        description: 'Caderno de cruzamento de fontes e redação de artigos',
        userId: user?.uid,
        userEmail: user?.email,
        sources: [],
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await GeminiNotebookService.saveNotebook(defaultNb, user);
      setNotebooks([defaultNb]);
      setCurrentNotebook(defaultNb);
      setSources([]);
      setSelectedSourceIds([]);
    }
  };

  const handleAddSource = async () => {
    if (!currentNotebook) return;

    let newSource: GeminiNotebookSource | null = null;

    if (addSourceType === 'wiki_article') {
      const art = articles.find((a) => a.id === selectedWikiArticleId);
      if (!art) {
        alert('Por favor, selecione um artigo da WikiWorldWeb.');
        return;
      }
      newSource = {
        id: 'src_' + Date.now(),
        title: art.titulo,
        type: 'wiki_article',
        content: art.descricao || '',
        articleId: art.id,
        addedAt: new Date().toISOString(),
      };
    } else if (addSourceType === 'text') {
      if (!freeTextTitle.trim() || !freeTextContent.trim()) {
        alert('Preencha o título e o conteúdo da fonte.');
        return;
      }
      newSource = {
        id: 'src_' + Date.now(),
        title: freeTextTitle.trim(),
        type: 'text',
        content: freeTextContent.trim(),
        addedAt: new Date().toISOString(),
      };
    } else if (addSourceType === 'image') {
      if (!imageTitle.trim() || !imageBase64) {
        alert('Selecione uma imagem e digite um título descritivo.');
        return;
      }
      newSource = {
        id: 'src_' + Date.now(),
        title: imageTitle.trim(),
        type: 'image',
        content: `[DOCUMENTO/IMAGEM CARREGADA]: ${imageTitle.trim()}`,
        imageUrl: imageBase64,
        addedAt: new Date().toISOString(),
      };
    }

    if (!newSource) return;

    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    setSelectedSourceIds([...selectedSourceIds, newSource.id]);

    const updatedNb: GeminiNotebookItem = {
      ...currentNotebook,
      sources: updatedSources,
      updatedAt: new Date().toISOString(),
    };
    await GeminiNotebookService.saveNotebook(updatedNb, user);
    setCurrentNotebook(updatedNb);

    // Limpa campos do modal
    setIsAddSourceModalOpen(false);
    setFreeTextTitle('');
    setFreeTextContent('');
    setImageTitle('');
    setImageBase64(null);
    setSelectedWikiArticleId('');
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!currentNotebook) return;
    const updated = (sources || []).filter((s) => s.id !== sourceId);
    setSources(updated);
    setSelectedSourceIds((prev) => (prev || []).filter((id) => id !== sourceId));

    const updatedNb = {
      ...currentNotebook,
      sources: updated,
      updatedAt: new Date().toISOString(),
    };
    await GeminiNotebookService.saveNotebook(updatedNb, user);
    setCurrentNotebook(updatedNb);
  };

  const toggleSourceSelection = (sourceId: string) => {
    if ((selectedSourceIds || []).includes(sourceId)) {
      setSelectedSourceIds((prev) => (prev || []).filter((id) => id !== sourceId));
    } else {
      setSelectedSourceIds([...(selectedSourceIds || []), sourceId]);
    }
  };

  const handleSynthesize = async () => {
    const activeSources = (sources || []).filter((s) => (selectedSourceIds || []).includes(s.id));
    if (activeSources.length === 0) {
      alert('Selecione ao menos 1 fonte marcada para realizar a síntese.');
      return;
    }

    const targetArticle = articles.find((a) => a.id === targetArticleId);

    setIsSynthesizing(true);
    setInsertionStatus(null);
    try {
      const res = await GeminiNotebookService.synthesize({
        sources: activeSources,
        action,
        customPrompt,
        targetArticleTitle: targetArticle ? targetArticle.titulo : '',
        user,
      });

      if (res.quotaExceeded || res.offerPremium) {
        onOpenPremiumModal('notebook');
      }

      setSynthesizedWikitext(res.wikitext);
      setSynthesizedSummary(res.summary);
    } catch (err: any) {
      alert('Erro na síntese do Gemini Notebook: ' + (err.message || err));
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Inserção no WikiWorldWeb
  const handleInsertIntoArticle = async () => {
    if (!synthesizedWikitext.trim()) {
      alert('Não há conteúdo sintetizado para inserir.');
      return;
    }

    if (!targetArticleId) {
      alert('Por favor, selecione qual artigo da WikiWorldWeb deve receber este conteúdo.');
      return;
    }

    const targetArticle = articles.find((a) => a.id === targetArticleId);
    if (!targetArticle) {
      alert('Artigo não encontrado.');
      return;
    }

    let finalContent = targetArticle.descricao || '';
    if (insertionMode === 'append') {
      finalContent = `${finalContent.trim()}\n\n== Contribuição via Gemini Notebook ==\n${synthesizedWikitext}`;
    } else if (insertionMode === 'prepend') {
      finalContent = `${synthesizedWikitext}\n\n${finalContent.trim()}`;
    } else {
      finalContent = synthesizedWikitext;
    }

    const updatedArticle: WikiArticle = {
      ...targetArticle,
      descricao: finalContent,
      resumo: finalContent.slice(0, 140) + '...',
      dataEdicao: new Date().toISOString(),
      versao: (targetArticle.versao || 1) + 1,
    };

    try {
      await StorageService.saveArticle(updatedArticle, user || undefined);
      setInsertionStatus(`Artigo "${targetArticle.titulo}" atualizado com sucesso!`);
      setInsertedArticleId(targetArticle.id);
    } catch (err: any) {
      alert('Erro ao salvar artigo no WikiWorldWeb: ' + (err.message || err));
    }
  };

  const handleCreateNewArticle = async () => {
    if (!synthesizedWikitext.trim()) {
      alert('Não há conteúdo sintetizado para criar um novo artigo.');
      return;
    }

    const newTitle = prompt('Digite o título para o novo artigo:', 'Novo Artigo do Gemini Notebook');
    if (!newTitle) return;

    const newArt: WikiArticle = {
      id: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      pageUid: 'geral',
      titulo: newTitle,
      descricao: synthesizedWikitext,
      resumo: synthesizedWikitext.slice(0, 140) + '...',
      categoria: 'Geral',
      idioma: 'Português',
      autor: user?.displayName || 'Pesquisador Gemini Notebook',
      autorEmail: user?.email,
      autorUid: user?.uid,
      dataCriacao: new Date().toISOString(),
      dataEdicao: new Date().toISOString(),
      visualizacoes: 1,
      versao: 1,
      tags: ['gemini-notebook', 'pesquisa'],
    };

    try {
      await StorageService.saveArticle(newArt, user || undefined);
      setInsertionStatus(`Novo artigo "${newTitle}" criado com sucesso no WikiWorldWeb!`);
      setInsertedArticleId(newArt.id);
    } catch (err: any) {
      alert('Erro ao criar novo artigo: ' + (err.message || err));
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      if (!imageTitle) {
        setImageTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const safeArticlesList = Array.isArray(articles) ? articles : [];
  const filteredArticles = safeArticlesList.filter(
    (a) =>
      a &&
      (((a.titulo || '').toLowerCase().includes((sourceSearchTerm || '').toLowerCase())) ||
        ((a.categoria || '').toLowerCase().includes((sourceSearchTerm || '').toLowerCase())))
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl backdrop-blur-md">
              <BookOpen className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-400/20 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-300/30">
                  Google AI Studio Grounding
                </span>
                {quotaInfo.isPremium ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300/30 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-300" /> Gemini Premium
                  </span>
                ) : (
                  <span className="text-[10px] font-medium bg-slate-700/60 text-slate-300 px-2.5 py-0.5 rounded-full">
                    Plano Gratuito
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Gemini Notebook WikiWorldWeb
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl mt-0.5">
                Compile fontes da enciclopédia, documentos e citações. Use o Gemini para sintetizar seções ricas e
                inserir diretamente nos artigos da WikiWorldWeb.
              </p>
            </div>
          </div>

          {/* User Session & Quotas */}
          <div className="flex flex-wrap items-center gap-3">
            {user && !user.isGuest ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-xs">
                <div className="text-slate-300">Conectado como:</div>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>{user.displayName}</span>
                  <span className="text-[10px] text-indigo-300 font-mono">(ID: {user.uid.slice(0, 6)}...)</span>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Fazer Login para Salvar Histórico
              </button>
            )}

            {!quotaInfo.isPremium ? (
              <button
                onClick={() => onOpenPremiumModal('notebook')}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-1.5 transition-all"
              >
                <Crown className="w-4 h-4 text-amber-100" />
                <span>Upgrade Premium</span>
                <span className="bg-black/20 text-[10px] px-1.5 py-0.5 rounded ml-1">
                  {quotaInfo.notebookRemaining}/{quotaInfo.notebookLimit}
                </span>
              </button>
            ) : (
              <div className="px-3 py-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sínteses Ilimitadas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Principal: 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna 1: Fontes de Pesquisa (4 colunas) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Fontes do Caderno</h2>
              </div>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                {sources.length} fontes
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione as fontes que o Gemini deve analisar e cruzar para gerar o conteúdo:
            </p>

            {/* Botão Adicionar Fonte */}
            <div>
              <button
                onClick={() => setIsAddSourceModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Fonte</span>
              </button>
            </div>

            {/* Lista de Fontes */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {sources.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhuma fonte adicionada ainda. Clique acima para adicionar um artigo da WikiWorldWeb ou colar notas.
                </div>
              ) : (
                sources.map((src) => {
                  const isSelected = selectedSourceIds.includes(src.id);
                  return (
                    <div
                      key={src.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSourceSelection(src.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {src.type === 'wiki_article' && 'Artigo Wiki'}
                                {src.type === 'text' && 'Nota Livre'}
                                {src.type === 'image' && 'Imagem/Doc'}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                                {src.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {src.content.slice(0, 120)}...
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteSource(src.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                          title="Remover fonte"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Coluna 2: Estúdio de Síntese e Inserção (8 colunas) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Painel de Controle de Síntese */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Operações do Gemini Notebook
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Defina como o Gemini deve transformar suas {selectedSourceIds.length} fontes selecionadas:
                </p>
              </div>

              {/* Seletor de Artigo de Destino */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Artigo Alvo:</span>
                <select
                  value={targetArticleId}
                  onChange={(e) => setTargetArticleId(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px]"
                >
                  <option value="">(Nenhum / Novo Artigo)</option>
                  {articles.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.titulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Presets de Ação */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setAction('full_article')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                  action === 'full_article'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                📄 Artigo Completo
              </button>
              <button
                type="button"
                onClick={() => setAction('section')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                  action === 'section'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                📑 Seção Específica
              </button>
              <button
                type="button"
                onClick={() => setAction('infobox')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                  action === 'infobox'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                📊 Infobox / Tabela
              </button>
              <button
                type="button"
                onClick={() => setAction('timeline')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                  action === 'timeline'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                ⏳ Linha do Tempo
              </button>
              <button
                type="button"
                onClick={() => setAction('fact_check')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                  action === 'fact_check'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                🔍 Auditoria Factual
              </button>
            </div>

            {/* Prompt Customizado */}
            <div>
              <input
                type="text"
                placeholder="Instrução adicional opcional (ex: Destaque os fatos mais recentes e dados estatísticos...)"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Botão de Síntese */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-500">
                {!quotaInfo.isPremium ? (
                  <span>
                    Execuções restantes hoje: <strong>{quotaInfo.notebookRemaining}</strong> de{' '}
                    {quotaInfo.notebookLimit}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Gemini Premium: Sínteses ilimitadas
                  </span>
                )}
              </div>

              <button
                onClick={handleSynthesize}
                disabled={isSynthesizing || selectedSourceIds.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sintetizando com Gemini...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Sintetizar Fontes ({selectedSourceIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Área de Resultado Sintetizado */}
          {synthesizedWikitext ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 animate-fadeIn">
              {/* Resumo da Síntese */}
              {synthesizedSummary && (
                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  <strong>Resumo do Gemini:</strong> {synthesizedSummary}
                </div>
              )}

              {/* Tabs Preview / Raw Wikitext */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTab('preview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      previewTab === 'preview'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Visualização Formatada
                  </button>
                  <button
                    onClick={() => setPreviewTab('raw')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      previewTab === 'raw'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Wikitext Bruto
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(synthesizedWikitext);
                      alert('Wikitext copiado para a área de transferência!');
                    }}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Copiar Wikitext"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Caixa de Texto do Conteúdo */}
              <div className="max-h-[380px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {synthesizedWikitext}
              </div>

              {/* Status de Inserção */}
              {insertionStatus && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                  <span className="font-semibold">{insertionStatus}</span>
                  {insertedArticleId && (
                    <button
                      onClick={() => onOpenArticle(insertedArticleId)}
                      className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <span>Ver Artigo</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* AÇÕES DE INSERÇÃO DIRETA NO WIKIZERO */}
              <div className="p-4 bg-gradient-to-r from-slate-100 to-indigo-50/50 dark:from-slate-800/70 dark:to-indigo-950/30 rounded-xl border border-indigo-200/50 dark:border-indigo-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Inserir Conteúdo na WikiWorldWeb
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="text-slate-500">Modo:</label>
                    <select
                      value={insertionMode}
                      onChange={(e: any) => setInsertionMode(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                    >
                      <option value="append">Anexar ao final</option>
                      <option value="prepend">Inserir no início</option>
                      <option value="replace">Substituir tudo</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleInsertIntoArticle}
                    disabled={!targetArticleId}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Inserir no Artigo Selecionado
                  </button>

                  <button
                    onClick={handleCreateNewArticle}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Novo Artigo com Este Texto
                  </button>

                  <button
                    onClick={() =>
                      onOpenEditorWithContent(
                        targetArticleId
                          ? articles.find((a) => a.id === targetArticleId)?.titulo || 'Novo Artigo'
                          : 'Novo Artigo do Gemini Notebook',
                        synthesizedWikitext,
                        'Geral'
                      )
                    }
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 ml-auto"
                  >
                    <Edit3 className="w-4 h-4 text-indigo-500" />
                    Abrir no Editor Wikitexto
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/60 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Nenhuma síntese gerada ainda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Adicione e selecione fontes na coluna esquerda, escolha a operação desejada acima e clique em{' '}
                <strong>Sintetizar Fontes</strong>. O wikitext gerado aparecerá aqui para inserção imediata nos
                artigos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Adicionar Fonte */}
      {isAddSourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Adicionar Fonte de Pesquisa
              </h3>
              <button
                onClick={() => setIsAddSourceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Seletor de Tipo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setAddSourceType('wiki_article')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center ${
                    addSourceType === 'wiki_article'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Artigo Wiki
                </button>
                <button
                  type="button"
                  onClick={() => setAddSourceType('text')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center ${
                    addSourceType === 'text'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Texto / Citação
                </button>
                <button
                  type="button"
                  onClick={() => setAddSourceType('image')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center ${
                    addSourceType === 'image'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Imagem / Doc
                </button>
              </div>

              {/* Conteúdo específico por tipo */}
              {addSourceType === 'wiki_article' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Pesquisar artigos da WikiWorldWeb..."
                      value={sourceSearchTerm}
                      onChange={(e) => setSourceSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2">
                    {filteredArticles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => setSelectedWikiArticleId(art.id)}
                        className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition-colors ${
                          selectedWikiArticleId === art.id
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{art.titulo}</span>
                        <span className="text-[10px] text-slate-400">{art.categoria}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {addSourceType === 'text' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Título da Fonte (ex: Citação livro de História, Artigo acadêmico...)"
                    value={freeTextTitle}
                    onChange={(e) => setFreeTextTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <textarea
                    rows={6}
                    placeholder="Cole aqui o texto, extrato, citação ou dados de pesquisa que o Gemini deve analisar..."
                    value={freeTextContent}
                    onChange={(e) => setFreeTextContent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>
              )}

              {addSourceType === 'image' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Descrição da Imagem (ex: Mapa histórico de 1920, Tabela de dados...)"
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                  />
                  {imageBase64 && (
                    <div className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
                      <img
                        src={imageBase64}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" /> Imagem pronta para análise
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsAddSourceModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
              >
                Cancelar
              </button>
              {(addSourceType as string) !== 'google_doc' && (
                <button
                  onClick={handleAddSource}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Adicionar ao Caderno
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
