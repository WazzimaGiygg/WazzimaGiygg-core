import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Book,
  FileText,
  Search,
  Plus,
  Star,
  Copy,
  Check,
  MapPin,
  Barcode,
  Tag,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ThumbsUp,
  Calendar,
  Hash,
  Globe,
  Trash2,
  Edit3,
  Eye,
  BookMarked,
  Library,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw,
  Database,
  Cloud,
} from 'lucide-react';
import {
  LibraryItem,
  LibraryReview,
  LibraryItemType,
  PhysicalCirculationStatus,
  PhysicalConservationState,
  UserProfile,
} from '../types';
import {
  LibraryService,
  DEWEY_CLASSES,
} from '../services/libraryService';
import { ResearchEthicsBadge } from './ResearchEthicsBadge';
import { ResearchEthicsFormSection } from './ResearchEthicsFormSection';
import { ResearchEthicsCommitteeInfo } from '../types/ethics';

interface LibraryCatalogViewProps {
  currentUser: UserProfile | null;
  onNavigateToArticle?: (articleTitle: string) => void;
  onNavigateBack?: () => void;
}

export const LibraryCatalogView: React.FC<LibraryCatalogViewProps> = ({
  currentUser,
  onNavigateToArticle,
  onNavigateBack,
}) => {
  // Estado dos itens e carregamento
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'acervo' | 'cadastro' | 'cdd' | 'minhas_avaliacoes'>('acervo');

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<LibraryItemType | 'todos'>('todos');
  const [selectedStatus, setSelectedStatus] = useState<PhysicalCirculationStatus | 'todos'>('todos');
  const [selectedCdd, setSelectedCdd] = useState<string>('todos');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<'recentes' | 'titulo' | 'autor' | 'ano_desc' | 'avaliacoes'>('recentes');

  // Modal / Detalhes de Item Selecionado
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [selectedItemReviews, setSelectedItemReviews] = useState<LibraryReview[]>([]);
  const [copiedCitationType, setCopiedCitationType] = useState<string | null>(null);

  // Formulário de Cadastro / Edição
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    id?: string;
    tipo: LibraryItemType;
    titulo: string;
    subtitulo: string;
    autoresStr: string;
    organizadoresStr: string;
    tradutoresStr: string;
    editora: string;
    localPublicacao: string;
    anoPublicacao: number;
    edicao: string;
    volume: string;
    fasciculoNumero: string;
    mesAnoPeriodico: string;
    isbn: string;
    issn: string;
    doi: string;
    codigoBarras: string;
    cdd: string;
    cdu: string;
    cutter: string;
    assuntosStr: string;
    paginas: string;
    dimensoesCm: string;
    ilustrado: boolean;
    capaUrl: string;
    idioma: string;
    idiomaOriginal: string;
    sinopse: string;
    sumarioOuNotas: string;
    predio: string;
    andar: string;
    secao: string;
    estante: string;
    prateleira: string;
    codigoChamada: string;
    tomboPatrimonial: string;
    exemplaresTotais: number;
    exemplaresDisponiveis: number;
    estadoConservacao: PhysicalConservationState;
    statusCirculacao: PhysicalCirculationStatus;
    artigoWikiVinculadoTitulo: string;
    comiteEtica?: ResearchEthicsCommitteeInfo;
  }>({
    tipo: 'livro',
    titulo: '',
    subtitulo: '',
    autoresStr: '',
    organizadoresStr: '',
    tradutoresStr: '',
    editora: '',
    localPublicacao: 'Brasil',
    anoPublicacao: new Date().getFullYear(),
    edicao: '',
    volume: '',
    fasciculoNumero: '',
    mesAnoPeriodico: '',
    isbn: '',
    issn: '',
    doi: '',
    codigoBarras: '',
    cdd: '800',
    cdu: '',
    cutter: '',
    assuntosStr: '',
    paginas: '',
    dimensoesCm: '21 cm',
    ilustrado: false,
    capaUrl: '',
    idioma: 'Português',
    idiomaOriginal: '',
    sinopse: '',
    sumarioOuNotas: '',
    predio: 'Biblioteca Central WikiWorldWeb',
    andar: '1º Andar',
    secao: 'Acervo Geral',
    estante: 'Estante A-1',
    prateleira: 'Prateleira 1',
    codigoChamada: '',
    tomboPatrimonial: '',
    exemplaresTotais: 1,
    exemplaresDisponiveis: 1,
    estadoConservacao: 'bom',
    statusCirculacao: 'disponivel',
    artigoWikiVinculadoTitulo: '',
  });

  // Formulário de Nova Avaliação
  const [newRating, setNewRating] = useState(5);
  const [newClarityRating, setNewClarityRating] = useState(5);
  const [newRigorRating, setNewRigorRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newRecommends, setNewRecommends] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Lista de Desejos / Marcadores salvos localmente
  const [savedWishlist, setSavedWishlist] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('wiki_library_wishlist_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Estado de Sincronização Estrita com o Firebase
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const handleSyncWithFirebase = async () => {
    setIsSyncingFirebase(true);
    try {
      const res = await LibraryService.importFromFirebase();
      setItems(res.items);
      setLastSyncTime(new Date().toLocaleTimeString());
      setFormSuccessMessage(`Sincronização com Cloud Firestore concluída! ${res.count} obra(s) catalogada(s) carregada(s).`);
      setTimeout(() => setFormSuccessMessage(null), 4500);
    } catch (err: any) {
      console.error('Erro na sincronização Firebase:', err);
      setFormSuccessMessage(`Erro na sincronização Firebase: ${err?.message || 'Falha de conexão com Firestore'}`);
      setTimeout(() => setFormSuccessMessage(null), 5000);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Carregar dados iniciais e subscrição em tempo real
  useEffect(() => {
    setLoading(true);
    const unsubscribe = LibraryService.subscribeToLibraryItems((loadedItems) => {
      setItems(loadedItems);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscrição em tempo real de avaliações do item selecionado
  useEffect(() => {
    if (!selectedItem) {
      setSelectedItemReviews([]);
      return;
    }
    const unsubReviews = LibraryService.subscribeToLibraryReviews(selectedItem.id, (reviews) => {
      setSelectedItemReviews(reviews);
    });
    return () => unsubReviews();
  }, [selectedItem?.id]);

  // Alternar lista de desejos
  const toggleWishlist = (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedWishlist((prev) => {
      const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      try {
        localStorage.setItem('wiki_library_wishlist_ids', JSON.stringify(next));
      } catch {
        // quota
      }
      return next;
    });
  };

  // Filtragem e Ordenação
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Busca textual ampla (título, subtítulo, autor, ISBN, ISSN, assunto, editora, chamada)
      if (searchTerm.trim()) {
        const queryClean = searchTerm.toLowerCase().trim();
        const inTitulo = item.titulo.toLowerCase().includes(queryClean);
        const inSubtitulo = item.subtitulo?.toLowerCase().includes(queryClean) || false;
        const inAutores = item.autores.some((a) => a.toLowerCase().includes(queryClean));
        const inIsbn = item.isbn?.replace(/[^0-9X]/gi, '').includes(queryClean.replace(/[^0-9X]/gi, '')) || false;
        const inIssn = item.issn?.replace(/[^0-9X]/gi, '').includes(queryClean.replace(/[^0-9X]/gi, '')) || false;
        const inAssuntos = item.assuntos.some((as) => as.toLowerCase().includes(queryClean));
        const inEditora = item.editora.toLowerCase().includes(queryClean);
        const inChamada = item.localizacao.codigoChamada.toLowerCase().includes(queryClean);
        const inTombo = item.localizacao.tomboPatrimonial?.toLowerCase().includes(queryClean) || false;

        if (!inTitulo && !inSubtitulo && !inAutores && !inIsbn && !inIssn && !inAssuntos && !inEditora && !inChamada && !inTombo) {
          return false;
        }
      }

      // Tipo de item
      if (selectedType !== 'todos' && item.tipo !== selectedType) {
        return false;
      }

      // Status de circulação
      if (selectedStatus !== 'todos' && item.statusCirculacao !== selectedStatus) {
        return false;
      }

      // Filtro CDD
      if (selectedCdd !== 'todos') {
        const cddPrefix = selectedCdd[0];
        if (!item.cdd || !item.cdd.startsWith(cddPrefix)) {
          return false;
        }
      }

      // Apenas exemplares disponíveis
      if (onlyAvailable && item.exemplaresDisponiveis <= 0) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'titulo') return a.titulo.localeCompare(b.titulo);
      if (sortBy === 'autor') return (a.autores[0] || '').localeCompare(b.autores[0] || '');
      if (sortBy === 'ano_desc') return b.anoPublicacao - a.anoPublicacao;
      if (sortBy === 'avaliacoes') return (b.mediaAvaliacoes || 0) - (a.mediaAvaliacoes || 0);
      // 'recentes'
      return new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime();
    });
  }, [items, searchTerm, selectedType, selectedStatus, selectedCdd, onlyAvailable, sortBy]);

  // Estatísticas do Acervo
  const stats = useMemo(() => {
    const totalTitulos = items.length;
    const totalExemplares = items.reduce((acc, i) => acc + (i.exemplaresTotais || 1), 0);
    const totalDisponiveis = items.reduce((acc, i) => acc + (i.exemplaresDisponiveis || 0), 0);
    const totalPeriodicos = items.filter((i) => i.tipo === 'periodico').length;
    const totalLivros = items.filter((i) => i.tipo === 'livro').length;
    const totalAutores = new Set(items.flatMap((i) => i.autores)).size;

    return {
      totalTitulos,
      totalExemplares,
      totalDisponiveis,
      totalPeriodicos,
      totalLivros,
      totalAutores,
    };
  }, [items]);

  // Copiar citações
  const copyCitation = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitationType(type);
    setTimeout(() => setCopiedCitationType(null), 2500);
  };

  // Submeter Avaliação
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newReviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      await LibraryService.addLibraryReview({
        itemId: selectedItem.id,
        userId: currentUser?.uid || 'anonimo',
        userName: currentUser?.displayName || currentUser?.username || 'Leitor WikiWorldWeb',
        userEmail: currentUser?.email || undefined,
        rating: newRating,
        clarityRating: newClarityRating,
        rigorRating: newRigorRating,
        reviewTitle: newReviewTitle.trim() || 'Avaliação da obra',
        reviewText: newReviewText.trim(),
        recommends: newRecommends,
      });

      setNewReviewTitle('');
      setNewReviewText('');
      setFormSuccessMessage('Avaliação registrada com sucesso no acervo!');
      setTimeout(() => setFormSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao registrar avaliação:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Iniciar Cadastro do Zero
  const startNewItemForm = () => {
    setIsEditing(false);
    setFormData({
      tipo: 'livro',
      titulo: '',
      subtitulo: '',
      autoresStr: '',
      organizadoresStr: '',
      tradutoresStr: '',
      editora: '',
      localPublicacao: 'São Paulo, SP - Brasil',
      anoPublicacao: new Date().getFullYear(),
      edicao: '',
      volume: '',
      fasciculoNumero: '',
      mesAnoPeriodico: '',
      isbn: '',
      issn: '',
      doi: '',
      codigoBarras: '',
      cdd: '800',
      cdu: '',
      cutter: '',
      assuntosStr: '',
      paginas: '',
      dimensoesCm: '21 cm',
      ilustrado: false,
      capaUrl: '',
      idioma: 'Português',
      idiomaOriginal: '',
      sinopse: '',
      sumarioOuNotas: '',
      predio: 'Biblioteca Central WikiWorldWeb',
      andar: '1º Pavimento',
      secao: 'Acervo Geral',
      estante: 'Estante A-1',
      prateleira: 'Prateleira 1',
      codigoChamada: '',
      tomboPatrimonial: `TOMBO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      exemplaresTotais: 1,
      exemplaresDisponiveis: 1,
      estadoConservacao: 'bom',
      statusCirculacao: 'disponivel',
      artigoWikiVinculadoTitulo: '',
      comiteEtica: undefined,
    });
    setActiveTab('cadastro');
  };

  // Iniciar Edição de Item Existente
  const startEditItem = (item: LibraryItem) => {
    setIsEditing(true);
    setFormData({
      id: item.id,
      tipo: item.tipo,
      titulo: item.titulo,
      subtitulo: item.subtitulo || '',
      autoresStr: item.autores.join('; '),
      organizadoresStr: item.organizadores?.join('; ') || '',
      tradutoresStr: item.tradutores?.join('; ') || '',
      editora: item.editora,
      localPublicacao: item.localPublicacao,
      anoPublicacao: item.anoPublicacao,
      edicao: item.edicao || '',
      volume: item.volume || '',
      fasciculoNumero: item.fasciculoNumero || '',
      mesAnoPeriodico: item.mesAnoPeriodico || '',
      isbn: item.isbn || '',
      issn: item.issn || '',
      doi: item.doi || '',
      codigoBarras: item.codigoBarras || '',
      cdd: item.cdd || '',
      cdu: item.cdu || '',
      cutter: item.cutter || '',
      assuntosStr: item.assuntos.join('; '),
      paginas: item.paginas ? String(item.paginas) : '',
      dimensoesCm: item.dimensoesCm || '',
      ilustrado: !!item.ilustrado,
      capaUrl: item.capaUrl || '',
      idioma: item.idioma,
      idiomaOriginal: item.idiomaOriginal || '',
      sinopse: item.sinopse,
      sumarioOuNotas: item.sumarioOuNotas || '',
      predio: item.localizacao.predio || 'Biblioteca Central WikiWorldWeb',
      andar: item.localizacao.andar || '1º Pavimento',
      secao: item.localizacao.secao,
      estante: item.localizacao.estante,
      prateleira: item.localizacao.prateleira,
      codigoChamada: item.localizacao.codigoChamada,
      tomboPatrimonial: item.localizacao.tomboPatrimonial || '',
      exemplaresTotais: item.exemplaresTotais,
      exemplaresDisponiveis: item.exemplaresDisponiveis,
      estadoConservacao: item.estadoConservacao,
      statusCirculacao: item.statusCirculacao,
      artigoWikiVinculadoTitulo: item.artigoWikiVinculadoTitulo || '',
      comiteEtica: item.comiteEtica,
    });
    setActiveTab('cadastro');
  };

  // Salvar Item do Catálogo
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      alert('Por favor, informe o título da obra.');
      return;
    }

    const autores = formData.autoresStr
      .split(';')
      .map((a) => a.trim())
      .filter(Boolean);

    if (autores.length === 0) {
      autores.push('Autor Não Informado');
    }

    const organizadores = formData.organizadoresStr
      .split(';')
      .map((a) => a.trim())
      .filter(Boolean);

    const tradutores = formData.tradutoresStr
      .split(';')
      .map((a) => a.trim())
      .filter(Boolean);

    const assuntos = formData.assuntosStr
      .split(';')
      .map((a) => a.trim())
      .filter(Boolean);

    // Auto-gerar Cutter se ausente
    const cutterCode = formData.cutter.trim() || LibraryService.generateCutterCode(autores[0], formData.titulo);

    // Notação de chamada formatada
    const callNumber = formData.codigoChamada.trim() || `${formData.cdd || '000'} ${cutterCode} ${formData.anoPublicacao}`.trim();

    try {
      const saved = await LibraryService.saveLibraryItem({
        id: formData.id,
        tipo: formData.tipo,
        titulo: formData.titulo.trim(),
        subtitulo: formData.subtitulo.trim() || undefined,
        autores,
        organizadores: organizadores.length > 0 ? organizadores : undefined,
        tradutores: tradutores.length > 0 ? tradutores : undefined,
        editora: formData.editora.trim() || 'Editora Independente',
        localPublicacao: formData.localPublicacao.trim() || 'Brasil',
        anoPublicacao: Number(formData.anoPublicacao) || new Date().getFullYear(),
        edicao: formData.edicao.trim() || undefined,
        volume: formData.volume.trim() || undefined,
        fasciculoNumero: formData.fasciculoNumero.trim() || undefined,
        mesAnoPeriodico: formData.mesAnoPeriodico.trim() || undefined,
        isbn: formData.isbn.trim() || undefined,
        issn: formData.issn.trim() || undefined,
        doi: formData.doi.trim() || undefined,
        codigoBarras: formData.codigoBarras.trim() || undefined,
        cdd: formData.cdd.trim() || undefined,
        cdu: formData.cdu.trim() || undefined,
        cutter: cutterCode,
        assuntos,
        paginas: formData.paginas ? Number(formData.paginas) : undefined,
        dimensoesCm: formData.dimensoesCm.trim() || undefined,
        ilustrado: formData.ilustrado,
        capaUrl: formData.capaUrl.trim() || undefined,
        idioma: formData.idioma.trim() || 'Português',
        idiomaOriginal: formData.idiomaOriginal.trim() || undefined,
        sinopse: formData.sinopse.trim(),
        sumarioOuNotas: formData.sumarioOuNotas.trim() || undefined,
        localizacao: {
          predio: formData.predio.trim() || 'Biblioteca Central WikiWorldWeb',
          andar: formData.andar.trim() || '1º Pavimento',
          secao: formData.secao.trim() || 'Acervo Geral',
          estante: formData.estante.trim() || 'Estante 1',
          prateleira: formData.prateleira.trim() || 'Prateleira 1',
          codigoChamada: callNumber,
          tomboPatrimonial: formData.tomboPatrimonial.trim() || undefined,
        },
        exemplaresTotais: Number(formData.exemplaresTotais) || 1,
        exemplaresDisponiveis: Number(formData.exemplaresDisponiveis) || 1,
        estadoConservacao: formData.estadoConservacao,
        statusCirculacao: formData.statusCirculacao,
        artigoWikiVinculadoTitulo: formData.artigoWikiVinculadoTitulo.trim() || undefined,
        comiteEtica: formData.comiteEtica,
      });

      setSelectedItem(saved);
      setActiveTab('acervo');
      setFormSuccessMessage(
        isEditing
          ? 'Item bibliográfico atualizado e gravado com sucesso no Firebase!'
          : 'Novo item catalogado e gravado diretamente no Cloud Firestore!'
      );
      setTimeout(() => setFormSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao salvar item:', err);
      alert('Houve uma falha ao cadastrar o item bibliográfico no Firebase.');
    }
  };

  // Excluir Item
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Deseja realmente remover esta obra do acervo da biblioteca e do Firebase?')) return;
    try {
      await LibraryService.deleteLibraryItem(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      setFormSuccessMessage('Item removido do acervo e excluído do Firebase.');
      setTimeout(() => setFormSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  return (
    <div id="wiki-library-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-slate-800 dark:text-slate-100">
      {/* Top Banner / Navegação de retorno */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <Library className="w-4 h-4" />
            <span>Biblioteca Física & Acervo Digital Wiki</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mt-1">
            Wiki dos Livros & Periódicos
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
            Sistema bibliográfico integrado com catalogação AACR2/MARC21, classificação decimal CDD/CDU,
            gestão de estantes físicas, tombo patrimonial, citações ABNT/APA/BibTeX e resenhas críticas da comunidade.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Voltar ao Wiki
            </button>
          )}
          <button
            onClick={handleSyncWithFirebase}
            disabled={isSyncingFirebase}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-sm disabled:opacity-50"
            title="Importar e sincronizar catálogo diretamente do Cloud Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFirebase ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncingFirebase ? 'Sincronizando...' : 'Sincronizar com Firebase'}</span>
          </button>
          <button
            onClick={startNewItemForm}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Livro ou Periódico</span>
          </button>
        </div>
      </div>

      {/* Painel de Status de Sincronia Estrita com o Firebase */}
      <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-medium text-[11px]">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Firebase Cloud Firestore</span>
          </div>
          <span className="text-slate-600 dark:text-slate-400">
            Sincronia ativa: <strong>Apenas dados presentes no Firebase são carregados</strong>. Dados especulativos desativados.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          {lastSyncTime && (
            <span>Última sincronização: <strong>{lastSyncTime}</strong></span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            {items.length} obras oficiais no Firestore
          </span>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {formSuccessMessage && (
        <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{formSuccessMessage}</span>
        </div>
      )}

      {/* Cartões com Métricas do Acervo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 my-6">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">Títulos Catalogados</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalTitulos}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">Exemplares Físicos</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalExemplares}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase">Disponíveis Estante</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{stats.totalDisponiveis}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">Livros (Monografias)</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalLivros}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">Periódicos & Revistas</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalPeriodicos}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">Autores Registrados</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalAutores}</div>
        </div>
      </div>

      {/* Barra de Abas do Catálogo */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('acervo')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'acervo'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Consultar Acervo ({filteredItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cdd')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'cdd'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Classificação Dewey (CDD)</span>
        </button>

        <button
          onClick={startNewItemForm}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'cadastro'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isEditing ? 'Editar Ficha Catalográfica' : 'Novo Cadastro Bibliográfico'}</span>
        </button>

        <button
          onClick={() => setActiveTab('minhas_avaliacoes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'minhas_avaliacoes'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Minha Lista de Leituras ({savedWishlist.length})</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: ACERVO & BUSCA */}
      {activeTab === 'acervo' && (
        <div>
          {/* Caixa de Busca e Filtros Facetados */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por título, autor, ISBN, ISSN, assunto, editora ou código de chamada CDD..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="titulo">Título (A-Z)</option>
                  <option value="autor">Autor (A-Z)</option>
                  <option value="ano_desc">Ano de publicação</option>
                  <option value="avaliacoes">Melhor avaliados</option>
                </select>
              </div>
            </div>

            {/* Filtros em linha */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Tipo:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'todos', label: 'Todos' },
                  { value: 'livro', label: 'Livros' },
                  { value: 'periodico', label: 'Periódicos / Revistas' },
                  { value: 'tese', label: 'Teses Acadêmicas' },
                  { value: 'artigo_cientifico', label: 'Artigos' },
                  { value: 'obra_rara', label: 'Obras Raras' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedType(opt.value as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      selectedType === opt.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span>Circulação:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'todos', label: 'Todos' },
                  { value: 'disponivel', label: 'Disponível na Estante' },
                  { value: 'consulta_local', label: 'Consulta Local' },
                  { value: 'emprestado', label: 'Emprestado' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedStatus(opt.value as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      selectedStatus === opt.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer ml-auto text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Apenas com exemplares na estante</span>
              </label>
            </div>
          </div>

          {/* Listagem de Itens */}
          {loading ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs">Consultando catálogo oficial no Cloud Firestore...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 p-8">
              <Database className="w-12 h-12 text-emerald-600/70 mx-auto mb-3" />
              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
                Nenhuma obra cadastrada no Cloud Firestore ainda
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
                O sistema está operando em <strong>sincronização estrita com o Firebase</strong>. Dados pré-definidos ou especulativos foram expurgados. Cadastre a primeira obra abaixo para gravá-la diretamente no banco de dados.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={startNewItemForm}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeiro Livro / Periódico</span>
                </button>
                <button
                  onClick={handleSyncWithFirebase}
                  disabled={isSyncingFirebase}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFirebase ? 'animate-spin' : ''}`} />
                  <span>Sincronizar com Firebase</span>
                </button>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-serif font-bold text-slate-800 dark:text-slate-200">
                Nenhuma obra encontrada para estes critérios
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Tente ajustar os termos de pesquisa ou remover alguns filtros selecionados.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('todos');
                  setSelectedStatus('todos');
                  setSelectedCdd('todos');
                  setOnlyAvailable(false);
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const isSaved = savedWishlist.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="flex flex-col p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    {/* Topo do Card: Tipo & Localização na estante */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                        {item.tipo === 'periodico' ? (
                          <FileText className="w-3.5 h-3.5" />
                        ) : (
                          <Book className="w-3.5 h-3.5" />
                        )}
                        <span className="capitalize">{item.tipo.replace('_', ' ')}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status de circulação */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.statusCirculacao === 'disponivel'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : item.statusCirculacao === 'consulta_local'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.statusCirculacao === 'disponivel'
                            ? `Disponível (${item.exemplaresDisponiveis})`
                            : item.statusCirculacao === 'consulta_local'
                            ? 'Consulta Local'
                            : 'Emprestado'}
                        </span>

                        {/* Botão de salvar na lista */}
                        <button
                          onClick={(e) => toggleWishlist(item.id, e)}
                          title={isSaved ? 'Remover da minha lista' : 'Salvar na minha lista de leitura'}
                          className={`p-1 rounded-md transition-colors ${
                            isSaved
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                        >
                          <BookMarked className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Informações Centrais da Obra */}
                    <div className="py-3 flex-1">
                      <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {item.titulo}
                      </h3>
                      {item.subtitulo && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {item.subtitulo}
                        </p>
                      )}

                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-2">
                        {item.autores.join('; ')}
                      </p>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {item.editora} • {item.anoPublicacao}
                        {item.edicao ? ` • ${item.edicao}` : ''}
                      </p>

                      {item.comiteEtica && item.comiteEtica.statusEtica !== 'nao_se_aplica' && (
                        <div className="mt-2">
                          <ResearchEthicsBadge info={item.comiteEtica} variant="badge" />
                        </div>
                      )}

                      {/* Notação de Chamada na estante */}
                      <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300 font-bold">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.localizacao.codigoChamada}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px]">
                          <MapPin className="w-3 h-3" />
                          <span>{item.localizacao.estante}</span>
                        </div>
                      </div>

                      {/* Assuntos / Tags */}
                      {item.assuntos && item.assuntos.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {item.assuntos.slice(0, 3).map((assunto, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            >
                              {assunto}
                            </span>
                          ))}
                          {item.assuntos.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{item.assuntos.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rodapé do Card com Avaliações & Identificadores */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{item.mediaAvaliacoes ? item.mediaAvaliacoes.toFixed(1) : '—'}</span>
                        <span className="text-slate-400 font-normal">({item.totalAvaliacoes || 0})</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                        {item.isbn && <span>ISBN {item.isbn.slice(0, 10)}...</span>}
                        {item.issn && <span>ISSN {item.issn}</span>}
                        <button className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 hover:underline">
                          <span>Ficha</span>
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: CLASSIFICAÇÃO DEWEY (CDD) */}
      {activeTab === 'cdd' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
              Classificação Decimal de Dewey (CDD)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              A CDD divide todo o conhecimento humano em dez classes principais (000 a 900), permitindo organizar
              os livros fisicamente nas estantes em ordem lógica e encontrar qualquer periódico ou tese de modo veloz.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {DEWEY_CLASSES.map((cdd) => {
              const count = items.filter((i) => i.cdd?.startsWith(cdd.code[0])).length;
              const isSelected = selectedCdd === cdd.code;
              return (
                <div
                  key={cdd.code}
                  onClick={() => {
                    setSelectedCdd(isSelected ? 'todos' : cdd.code);
                    setActiveTab('acervo');
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <div>
                    <div className="text-2xl mb-2">{cdd.icon}</div>
                    <div className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Classe {cdd.code}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white mt-1 line-clamp-2">
                      {cdd.label.replace(/^\d{3}\s*-\s*/, '')}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">{count} obra(s)</span>
                    <span className="text-emerald-600 font-semibold">Explorar →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: MINHA LISTA DE LEITURA */}
      {activeTab === 'minhas_avaliacoes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                Minha Lista de Leitura & Marcadores
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Obras marcadas para leitura, consulta ou pesquisa no acervo da biblioteca.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {savedWishlist.length} item(ns)
            </span>
          </div>

          {savedWishlist.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
              <BookMarked className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-serif font-bold text-slate-800 dark:text-slate-200">
                Sua lista de leitura ainda está vazia
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ao consultar o acervo, clique no ícone de marcador para salvar livros e periódicos aqui.
              </p>
              <button
                onClick={() => setActiveTab('acervo')}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
              >
                Ir para o Acervo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items
                .filter((item) => savedWishlist.includes(item.id))
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white">
                          {item.titulo}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{item.autores.join('; ')}</p>
                      </div>
                      <button
                        onClick={(e) => toggleWishlist(item.id, e)}
                        className="text-amber-500 p-1"
                        title="Remover da lista"
                      >
                        <BookMarked className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono">
                      <span>{item.localizacao.codigoChamada}</span>
                      <span className="text-emerald-600 font-sans font-semibold">Ver detalhes →</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 4: CADASTRO / EDIÇÃO */}
      {activeTab === 'cadastro' && (
        <form onSubmit={handleItemSubmit} className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edição de Ficha Catalográfica' : 'Cadastro de Obra ou Periódico no Acervo'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Preencha os metadados catalográficos padrão AACR2 / MARC21 para inclusão no acervo e estantes físicas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('acervo')}
                className="px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isEditing ? 'Atualizar Ficha' : 'Concluir Cadastro'}
              </button>
            </div>
          </div>

          {/* 1. DADOS DE IDENTIFICAÇÃO BÁSICA */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Book className="w-4 h-4" />
              <span>1. Identificação Principal da Obra</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Documento *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as LibraryItemType })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="livro">Livro (Monografia)</option>
                  <option value="periodico">Periódico / Revista Científica</option>
                  <option value="tese">Tese / Dissertação Acadêmica</option>
                  <option value="artigo_cientifico">Artigo de Periódico / Anais</option>
                  <option value="obra_rara">Obra Rara / Manuscrito Histórico</option>
                  <option value="partitura">Partitura Musical</option>
                  <option value="mapa">Mapa / Cartografia</option>
                  <option value="audiovisual">Mídia Audiovisual</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título Principal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dom Casmurro, Revista Brasileira de História da Ciência..."
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subtítulo (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Memórias de Bento Santiago..."
                  value={formData.subtitulo}
                  onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Autores Principais (separar por ponto e vírgula) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Assis, Machado de; Peres, Pedro Henrique..."
                  value={formData.autoresStr}
                  onChange={(e) => setFormData({ ...formData, autoresStr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organizadores / Editores (para coletâneas)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alfonso-Goldfarb, Ana Maria..."
                  value={formData.organizadoresStr}
                  onChange={(e) => setFormData({ ...formData, organizadoresStr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tradutores (se houver)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Magalhães, Carlos de..."
                  value={formData.tradutoresStr}
                  onChange={(e) => setFormData({ ...formData, tradutoresStr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 2. PUBLICAÇÃO & IDENTIFICADORES UNIVERSAIS */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Globe className="w-4 h-4" />
              <span>2. Publicação & Identificadores Padrão (ISBN / ISSN / DOI)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Editora ou Instituição *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Companhia das Letras, Garnier, SBHC, USP..."
                  value={formData.editora}
                  onChange={(e) => setFormData({ ...formData, editora: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Local de Publicação (Cidade / País) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rio de Janeiro, RJ - Brasil"
                  value={formData.localPublicacao}
                  onChange={(e) => setFormData({ ...formData, localPublicacao: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ano de Publicação *
                </label>
                <input
                  type="number"
                  required
                  value={formData.anoPublicacao}
                  onChange={(e) => setFormData({ ...formData, anoPublicacao: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Edição (para livros)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2ª ed. rev. e ampl."
                  value={formData.edicao}
                  onChange={(e) => setFormData({ ...formData, edicao: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Volume
                </label>
                <input
                  type="text"
                  placeholder="Ex: v. 1"
                  value={formData.volume}
                  onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fascículo / Número (Periódicos)
                </label>
                <input
                  type="text"
                  placeholder="Ex: n. 2 (Semestral)"
                  value={formData.fasciculoNumero}
                  onChange={(e) => setFormData({ ...formData, fasciculoNumero: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mês / Período (Periódicos)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Julho/Setembro 2024"
                  value={formData.mesAnoPeriodico}
                  onChange={(e) => setFormData({ ...formData, mesAnoPeriodico: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ISBN (para livros)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 978-85-359-1066-8"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ISSN (para periódicos)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2176-3275"
                  value={formData.issn}
                  onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  DOI (Identificador Digital de Artigo/Tese)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 10.53727/rbhc.v17i1"
                  value={formData.doi}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 3. CLASSIFICAÇÃO BIBLIOTECONÔMICA (CDD, CDU, CUTTER & ASSUNTOS) */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Tag className="w-4 h-4" />
              <span>3. Classificação Temática & Notação Bibliográfica (CDD / CDU / Cutter)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classificação Decimal de Dewey (CDD) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 869.3, 004, 509, 981..."
                  value={formData.cdd}
                  onChange={(e) => setFormData({ ...formData, cdd: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código de Cutter-Sanborn (Notação de Autor)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: A848d, C972s..."
                    value={formData.cutter}
                    onChange={(e) => setFormData({ ...formData, cutter: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const firstAuthor = formData.autoresStr.split(';')[0] || '';
                      const generated = LibraryService.generateCutterCode(firstAuthor, formData.titulo);
                      setFormData({ ...formData, cutter: generated });
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    Gerar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classificação Decimal Universal (CDU)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 821.134.3(81)-3..."
                  value={formData.cdu}
                  onChange={(e) => setFormData({ ...formData, cdu: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assuntos / Palavras-chave / Tesauro (separar por ponto e vírgula) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Literatura Brasileira; Romance Psicológico; Realismo; Canudos..."
                value={formData.assuntosStr}
                onChange={(e) => setFormData({ ...formData, assuntosStr: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 4. GESTÃO FÍSICA NA BIBLIOTECA (ESTANTE, PRATELEIRA, EXEMPLARES) */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <MapPin className="w-4 h-4" />
              <span>4. Gestão de Acervo Físico, Estante & Circulação</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seção da Biblioteca *
                </label>
                <input
                  type="text"
                  required
                  value={formData.secao}
                  onChange={(e) => setFormData({ ...formData, secao: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estante Física *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Estante L-04"
                  value={formData.estante}
                  onChange={(e) => setFormData({ ...formData, estante: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prateleira *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prateleira 2"
                  value={formData.prateleira}
                  onChange={(e) => setFormData({ ...formData, prateleira: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código de Chamada na Estante *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 869.3 A848d 1899"
                  value={formData.codigoChamada}
                  onChange={(e) => setFormData({ ...formData, codigoChamada: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tombo Patrimonial / Registro
                </label>
                <input
                  type="text"
                  value={formData.tomboPatrimonial}
                  onChange={(e) => setFormData({ ...formData, tomboPatrimonial: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total de Exemplares Físicos
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.exemplaresTotais}
                  onChange={(e) => setFormData({ ...formData, exemplaresTotais: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exemplares Disponíveis
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.exemplaresDisponiveis}
                  onChange={(e) => setFormData({ ...formData, exemplaresDisponiveis: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status de Circulação
                </label>
                <select
                  value={formData.statusCirculacao}
                  onChange={(e) => setFormData({ ...formData, statusCirculacao: e.target.value as PhysicalCirculationStatus })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="disponivel">Disponível para Empréstimo</option>
                  <option value="consulta_local">Consulta Local Apenas (Não Circula)</option>
                  <option value="emprestado">Emprestado</option>
                  <option value="reservado">Reservado</option>
                  <option value="em_quarentena">Processamento Técnico</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. RESUMO, SINOPSE & VÍNCULO COM A WIKI */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <FileText className="w-4 h-4" />
              <span>5. Sinopse, Sumário & Integração Enciclopédica</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sinopse / Resumo Crítico da Obra *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Insira o resumo da obra, enredo, proposta científica ou contexto histórico..."
                value={formData.sinopse}
                onChange={(e) => setFormData({ ...formData, sinopse: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas de Conteúdo / Sumário
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Contém bibliografia, prefácio crítico, índice onomástico..."
                  value={formData.sumarioOuNotas}
                  onChange={(e) => setFormData({ ...formData, sumarioOuNotas: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vincular a Artigo Existente na WikiWorldWeb (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dom Casmurro, História do Brasil..."
                  value={formData.artigoWikiVinculadoTitulo}
                  onChange={(e) => setFormData({ ...formData, artigoWikiVinculadoTitulo: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Permite que os leitores naveguem diretamente do livro para o artigo enciclopédico correspondente.
                </p>
              </div>
            </div>
          </div>

          {/* 6. COMITÊ DE ÉTICA EM PESQUISA COM SERES HUMANOS (CEP / CONEP) */}
          <div className="pt-1">
            <ResearchEthicsFormSection
              value={formData.comiteEtica}
              onChange={(val) => setFormData({ ...formData, comiteEtica: val })}
              contextTitle="Livro / Obra Científica"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('acervo')}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isEditing ? 'Salvar Modificações' : 'Cadastrar no Acervo Bibliográfico'}
            </button>
          </div>
        </form>
      )}

      {/* MODAL EXPANDIDO: FICHA CATALOGRÁFICA & AVALIAÇÕES DO ITEM */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Topo do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <BookOpen className="w-4 h-4" />
                <span className="uppercase tracking-wider">Ficha Catalográfica & Detalhes da Obra</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEditItem(selectedItem)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                  title="Excluir obra"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Título & Autoria */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 capitalize">
                    {selectedItem.tipo.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Ano {selectedItem.anoPublicacao}
                  </span>
                  {selectedItem.cdd && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      CDD {selectedItem.cdd}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
                  {selectedItem.titulo}
                </h2>
                {selectedItem.subtitulo && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-serif">
                    {selectedItem.subtitulo}
                  </p>
                )}

                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mt-3">
                  <span className="text-slate-500 font-normal">Autoria:</span> {selectedItem.autores.join('; ')}
                </p>
                {selectedItem.organizadores && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    <span className="text-slate-500">Organização:</span> {selectedItem.organizadores.join('; ')}
                  </p>
                )}
              </div>

              {/* CARTÃO ESTILO FICHA CATALOGRÁFICA CLÁSSICA (MARC21 / CIP) */}
              <div className="p-5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-amber-50/40 dark:bg-slate-800/40 font-serif text-xs leading-relaxed space-y-3 shadow-inner">
                <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                  Dados Internacionais de Catalogação na Publicação (CIP) / Biblioteca Central WikiWorldWeb
                </div>

                <div className="pl-6 border-l-2 border-slate-300 dark:border-slate-600 space-y-2">
                  <p className="font-sans font-semibold text-slate-900 dark:text-white">
                    {selectedItem.autores[0]}
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {selectedItem.titulo}
                    {selectedItem.subtitulo ? `: ${selectedItem.subtitulo}` : ''} / {selectedItem.autores.join(', ')}.
                    {selectedItem.edicao ? ` – ${selectedItem.edicao}.` : ''} – {selectedItem.localPublicacao}: {selectedItem.editora}, {selectedItem.anoPublicacao}.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedItem.paginas ? `${selectedItem.paginas} p.` : ''}
                    {selectedItem.dimensoesCm ? ` ; ${selectedItem.dimensoesCm}` : ''}
                    {selectedItem.ilustrado ? ' : il.' : ''}
                  </p>
                  {selectedItem.isbn && (
                    <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      ISBN: {selectedItem.isbn}
                    </p>
                  )}
                  {selectedItem.issn && (
                    <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      ISSN: {selectedItem.issn}
                    </p>
                  )}
                  {selectedItem.assuntos.length > 0 && (
                    <p className="text-slate-600 dark:text-slate-400 pt-1 text-[11px]">
                      {selectedItem.assuntos.map((as, idx) => `${idx + 1}. ${as}`).join('. ')}. I. Título.
                    </p>
                  )}
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>CDD: {selectedItem.cdd || '000'}</span>
                    <span>Cutter: {selectedItem.cutter || '---'}</span>
                    <span>CDU: {selectedItem.cdu || '---'}</span>
                  </div>
                </div>
              </div>

              {/* Comitê de Ética em Pesquisa com Seres Humanos (Livros & Obras Científicas) */}
              {selectedItem.comiteEtica && selectedItem.comiteEtica.statusEtica !== 'nao_se_aplica' && (
                <div className="my-1">
                  <ResearchEthicsBadge info={selectedItem.comiteEtica} variant="card" />
                </div>
              )}

              {/* LOCALIZAÇÃO FÍSICA NA ESTANTE & CIRCULAÇÃO */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Localização na Estante Física da Biblioteca</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Seção / Pavimento</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedItem.localizacao.secao}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Estante & Prateleira</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedItem.localizacao.estante}, {selectedItem.localizacao.prateleira}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Código de Chamada</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {selectedItem.localizacao.codigoChamada}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Disponibilidade</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedItem.exemplaresDisponiveis} de {selectedItem.exemplaresTotais} disponível(is)
                    </span>
                  </div>
                </div>
              </div>

              {/* SINOPSE */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Sinopse & Resumo
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedItem.sinopse}
                </p>
                {selectedItem.sumarioOuNotas && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Notas: </span>
                    {selectedItem.sumarioOuNotas}
                  </div>
                )}
              </div>

              {/* VÍNCULO COM A WIKI */}
              {selectedItem.artigoWikiVinculadoTitulo && onNavigateToArticle && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Artigo Enciclopédico na WikiWorldWeb
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300">
                        Explore o verbete completo de &quot;{selectedItem.artigoWikiVinculadoTitulo}&quot;
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onNavigateToArticle(selectedItem.artigoWikiVinculadoTitulo!);
                      setSelectedItem(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <span>Abrir Verbete</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* EXPORTADOR DE CITAÇÃO BIBLIOGRÁFICA */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Copy className="w-4 h-4 text-emerald-600" />
                    <span>Citações Bibliográficas Prontas (ABNT / APA / BibTeX)</span>
                  </div>
                  {copiedCitationType && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      Citação copiada para a área de transferência!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => copyCitation(LibraryService.formatAbntCitation(selectedItem), 'abnt')}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:border-emerald-500 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar ABNT (NBR 6023)</span>
                  </button>

                  <button
                    onClick={() => copyCitation(LibraryService.formatApaCitation(selectedItem), 'apa')}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:border-emerald-500 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar APA (7ª ed.)</span>
                  </button>

                  <button
                    onClick={() => copyCitation(LibraryService.formatBibtexCitation(selectedItem), 'bibtex')}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:border-emerald-500 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar BibTeX</span>
                  </button>
                </div>
              </div>

              {/* SEÇÃO DE AVALIAÇÕES & RESENHAS CRÍTICAS */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                      Resenhas & Avaliações da Comunidade ({selectedItemReviews.length})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Média geral: {selectedItem.mediaAvaliacoes ? selectedItem.mediaAvaliacoes.toFixed(1) : 'Sem avaliações'} de 5 estrelas
                    </p>
                  </div>
                </div>

                {/* Formulário de Nova Avaliação */}
                <form onSubmit={handleReviewSubmit} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Escrever Resenha ou Avaliar esta Obra
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Nota Geral:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            className={`p-1 ${
                              star <= newRating ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'
                            }`}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Clareza:</span>
                      <select
                        value={newClarityRating}
                        onChange={(e) => setNewClarityRating(Number(e.target.value))}
                        className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value={5}>5 - Excepcional</option>
                        <option value={4}>4 - Muito Boa</option>
                        <option value={3}>3 - Regular</option>
                        <option value={2}>2 - Difícil</option>
                        <option value={1}>1 - Confusa</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Rigor / Profundidade:</span>
                      <select
                        value={newRigorRating}
                        onChange={(e) => setNewRigorRating(Number(e.target.value))}
                        className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value={5}>5 - Impecável</option>
                        <option value={4}>4 - Alto</option>
                        <option value={3}>3 - Mediano</option>
                        <option value={2}>2 - Superficial</option>
                        <option value={1}>1 - Fraco</option>
                      </select>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Título da resenha (ex: Análise profunda do enredo, rigor metodológico...)"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />

                  <textarea
                    rows={3}
                    required
                    placeholder="Compartilhe sua impressão de leitura, pontos fortes da edição e recomendações para outros leitores da Wiki..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRecommends}
                        onChange={(e) => setNewRecommends(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      <span>Recomendo esta obra para leitura</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmittingReview || !newReviewText.trim()}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Gravando...' : 'Publicar Resenha'}
                    </button>
                  </div>
                </form>

                {/* Lista de Resenhas */}
                {selectedItemReviews.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Ainda não há resenhas registradas para esta obra. Seja o primeiro a avaliar!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedItemReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                              {rev.userName[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {rev.userName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">{rev.reviewTitle}</h5>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{rev.reviewText}</p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{new Date(rev.createdAt).toLocaleDateString('pt-BR')}</span>
                          {rev.recommends && (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> Recomenda esta obra
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
