import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb, getAuthSafe } from './firebase';
import {
  LibraryItem,
  LibraryReview,
  LibraryItemType,
  PhysicalCirculationStatus,
  PhysicalConservationState,
  LibraryFilterOptions,
} from '../types';

const STORAGE_KEY_LIBRARY_ITEMS = 'wiki_library_items_cache_v1';
const STORAGE_KEY_LIBRARY_REVIEWS = 'wiki_library_reviews_cache_v1';
const COLLECTION_ITEMS = 'library_items';
const COLLECTION_REVIEWS = 'library_reviews';

export const DEWEY_CLASSES: { code: string; label: string; icon: string }[] = [
  { code: '000', label: '000 - Ciência da Computação, Informação e Obras Gerais', icon: '💻' },
  { code: '100', label: '100 - Filosofia e Psicologia', icon: '🧠' },
  { code: '200', label: '200 - Religião e Teologia', icon: '🕊️' },
  { code: '300', label: '300 - Ciências Sociais, Direito e Educação', icon: '⚖️' },
  { code: '400', label: '400 - Línguas, Linguística e Dicionários', icon: '🗣️' },
  { code: '500', label: '500 - Ciências Puras (Matemática, Física, Biologia)', icon: '🔬' },
  { code: '600', label: '600 - Tecnologia e Ciências Aplicadas (Engenharia, Saúde)', icon: '⚙️' },
  { code: '700', label: '700 - Artes, Arquitetura, Música e Esportes', icon: '🎨' },
  { code: '800', label: '800 - Literatura, Poesia e Retórica', icon: '📖' },
  { code: '900', label: '900 - História, Geografia, Viagens e Biografias', icon: '🌍' },
];

// Dados especulativos desativados: apenas dados estritamente presentes no Cloud Firestore são carregados
export const INITIAL_LIBRARY_ITEMS: LibraryItem[] = [];
export const INITIAL_REVIEWS: LibraryReview[] = [];

// Constantes e flags para expurgar dados especulativos antigos do cache local
const PURGE_SPECULATIVE_LIBRARY_FLAG = 'wiki_library_purged_speculative_v3_pure_firebase';
const SPECULATIVE_ITEM_IDS = new Set(['lib-item-001', 'lib-item-002', 'lib-item-003', 'lib-item-004']);
const SPECULATIVE_REVIEW_IDS = new Set(['rev-001', 'rev-002']);

export function purgeSpeculativeLibraryData(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(PURGE_SPECULATIVE_LIBRARY_FLAG)) {
    try {
      const rawItems = localStorage.getItem(STORAGE_KEY_LIBRARY_ITEMS);
      if (rawItems) {
        const parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((it: any) => it && !SPECULATIVE_ITEM_IDS.has(it.id));
          localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(cleaned));
        }
      }
      const rawReviews = localStorage.getItem(STORAGE_KEY_LIBRARY_REVIEWS);
      if (rawReviews) {
        const parsedRev = JSON.parse(rawReviews);
        if (Array.isArray(parsedRev)) {
          const cleanedRev = parsedRev.filter((r: any) => r && !SPECULATIVE_REVIEW_IDS.has(r.id));
          localStorage.setItem(STORAGE_KEY_LIBRARY_REVIEWS, JSON.stringify(cleanedRev));
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY_LIBRARY_ITEMS);
      localStorage.removeItem(STORAGE_KEY_LIBRARY_REVIEWS);
    }
    localStorage.setItem(PURGE_SPECULATIVE_LIBRARY_FLAG, 'true');
  }
}

function normalizeLibraryItem(id: string, data: any): LibraryItem {
  return {
    id: data.id || id,
    tipo: data.tipo || 'livro',
    titulo: data.titulo || 'Sem título',
    subtitulo: data.subtitulo || undefined,
    autores: Array.isArray(data.autores) && data.autores.length > 0 ? data.autores : ['Autor Desconhecido'],
    organizadores: Array.isArray(data.organizadores) ? data.organizadores : undefined,
    tradutores: Array.isArray(data.tradutores) ? data.tradutores : undefined,
    editora: data.editora || 'Editora Independente',
    localPublicacao: data.localPublicacao || 'Brasil',
    anoPublicacao: Number(data.anoPublicacao) || new Date().getFullYear(),
    edicao: data.edicao || undefined,
    volume: data.volume || undefined,
    fasciculoNumero: data.fasciculoNumero || undefined,
    mesAnoPeriodico: data.mesAnoPeriodico || undefined,
    isbn: data.isbn || undefined,
    issn: data.issn || undefined,
    doi: data.doi || undefined,
    codigoBarras: data.codigoBarras || undefined,
    cdd: data.cdd || undefined,
    cdu: data.cdu || undefined,
    cutter: data.cutter || undefined,
    assuntos: Array.isArray(data.assuntos) ? data.assuntos : [],
    paginas: data.paginas ? Number(data.paginas) : undefined,
    dimensoesCm: data.dimensoesCm || undefined,
    ilustrado: !!data.ilustrado,
    capaUrl: data.capaUrl || undefined,
    idioma: data.idioma || 'Português',
    idiomaOriginal: data.idiomaOriginal || undefined,
    sinopse: data.sinopse || '',
    sumarioOuNotas: data.sumarioOuNotas || undefined,
    localizacao: data.localizacao || {
      predio: 'Biblioteca Central WikiWorldWeb',
      andar: '1º Pavimento',
      secao: 'Acervo Geral',
      estante: 'Estante Geral',
      prateleira: 'Prateleira 1',
      codigoChamada: '000',
    },
    exemplaresTotais: Number(data.exemplaresTotais) || 1,
    exemplaresDisponiveis: Number(data.exemplaresDisponiveis) || 1,
    estadoConservacao: data.estadoConservacao || 'bom',
    statusCirculacao: data.statusCirculacao || 'disponivel',
    artigoWikiVinculadoId: data.artigoWikiVinculadoId || undefined,
    artigoWikiVinculadoTitulo: data.artigoWikiVinculadoTitulo || undefined,
    comiteEtica: data.comiteEtica
      ? {
          envolveSeresHumanos: !!data.comiteEtica.envolveSeresHumanos,
          statusEtica: data.comiteEtica.statusEtica || 'nao_se_aplica',
          nomeComite: data.comiteEtica.nomeComite || undefined,
          numeroParecer: data.comiteEtica.numeroParecer || undefined,
          numeroCaae: data.comiteEtica.numeroCaae || undefined,
          instituicaoProponente: data.comiteEtica.instituicaoProponente || undefined,
          dataAprovacao: data.comiteEtica.dataAprovacao || undefined,
          temTcle: data.comiteEtica.temTcle !== undefined ? !!data.comiteEtica.temTcle : undefined,
          resolucaoRegulamentadora: data.comiteEtica.resolucaoRegulamentadora || undefined,
          justificativaOuObservacoes: data.comiteEtica.justificativaOuObservacoes || undefined,
          linkPlataformaBrasilOuComprovante: data.comiteEtica.linkPlataformaBrasilOuComprovante || undefined,
        }
      : undefined,
    cadastradoPorUid: data.cadastradoPorUid || undefined,
    cadastradoPorNome: data.cadastradoPorNome || undefined,
    dataCadastro: data.dataCadastro || new Date().toISOString(),
    ultimaModificacao: data.ultimaModificacao || undefined,
    visualizacoes: Number(data.visualizacoes) || 0,
    mediaAvaliacoes: Number(data.mediaAvaliacoes) || 0,
    totalAvaliacoes: Number(data.totalAvaliacoes) || 0,
  };
}

function normalizeLibraryReview(id: string, data: any): LibraryReview {
  return {
    id: data.id || id,
    itemId: data.itemId,
    userId: data.userId || 'anonimo',
    userName: data.userName || 'Usuário',
    rating: Number(data.rating) || 5,
    reviewTitle: data.reviewTitle || '',
    reviewText: data.reviewText || '',
    clarityRating: data.clarityRating ? Number(data.clarityRating) : undefined,
    rigorRating: data.rigorRating ? Number(data.rigorRating) : undefined,
    createdAt: data.createdAt || new Date().toISOString(),
    recommends: data.recommends !== false,
    likesCount: Number(data.likesCount) || 0,
  };
}

export const LibraryService = {
  // === RECUPERAÇÃO DE ITENS DO ACERVO (ESTRITO AO FIREBASE) ===
  async getLibraryItems(): Promise<LibraryItem[]> {
    purgeSpeculativeLibraryData();
    const db = getDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_ITEMS));
        const remoteList: LibraryItem[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (SPECULATIVE_ITEM_IDS.has(d.id) || SPECULATIVE_ITEM_IDS.has(data.id)) return;
          remoteList.push(normalizeLibraryItem(d.id, data));
        });

        // Ordena por data de cadastro mais recente
        remoteList.sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime());

        // Grava no cache estritamente os dados presentes no Firebase
        try {
          localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(remoteList));
        } catch {
          // ignora erro de quota
        }
        return remoteList;
      } catch (err) {
        console.warn('[LibraryService] Erro ao consultar Firestore, verificando cache local:', err);
      }
    }

    // Fallback: se offline, apenas dados reais já gravados no cache (sem itens especulativos)
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIBRARY_ITEMS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((it: LibraryItem) => it && !SPECULATIVE_ITEM_IDS.has(it.id));
        }
      }
    } catch {
      // ignora erro
    }
    return [];
  },

  // === SINCRONIZAÇÃO / IMPORTAÇÃO DIRETA DO FIREBASE ===
  async importFromFirebase(): Promise<{ items: LibraryItem[]; reviews: LibraryReview[]; count: number; timestamp: string }> {
    purgeSpeculativeLibraryData();
    const db = getDb();
    if (!db) {
      throw new Error('Cloud Firestore não está conectado.');
    }

    // 1. Importar todos os livros e periódicos do Firebase
    const snapItems = await getDocs(collection(db, COLLECTION_ITEMS));
    const importedItems: LibraryItem[] = [];
    snapItems.forEach((d) => {
      const data = d.data();
      if (!SPECULATIVE_ITEM_IDS.has(d.id) && !SPECULATIVE_ITEM_IDS.has(data.id)) {
        importedItems.push(normalizeLibraryItem(d.id, data));
      }
    });
    importedItems.sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime());

    // 2. Importar todas as resenhas do Firebase
    const snapReviews = await getDocs(collection(db, COLLECTION_REVIEWS));
    const importedReviews: LibraryReview[] = [];
    snapReviews.forEach((d) => {
      const data = d.data();
      if (!SPECULATIVE_REVIEW_IDS.has(d.id) && !SPECULATIVE_REVIEW_IDS.has(data.id)) {
        importedReviews.push(normalizeLibraryReview(d.id, data));
      }
    });

    // 3. Atualizar cache local com dados puros do Firebase
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(importedItems));
      localStorage.setItem(STORAGE_KEY_LIBRARY_REVIEWS, JSON.stringify(importedReviews));
    } catch {
      // ignora quota
    }

    return {
      items: importedItems,
      reviews: importedReviews,
      count: importedItems.length,
      timestamp: new Date().toISOString(),
    };
  },

  // Subscrição em tempo real aos itens do Firestore
  subscribeToLibraryItems(callback: (items: LibraryItem[]) => void): () => void {
    purgeSpeculativeLibraryData();
    const db = getDb();
    if (!db) {
      this.getLibraryItems().then(callback);
      return () => {};
    }

    try {
      const q = collection(db, COLLECTION_ITEMS);
      return onSnapshot(
        q,
        (snap) => {
          const list: LibraryItem[] = [];
          snap.forEach((d) => {
            const data = d.data();
            if (!SPECULATIVE_ITEM_IDS.has(d.id) && !SPECULATIVE_ITEM_IDS.has(data.id)) {
              list.push(normalizeLibraryItem(d.id, data));
            }
          });
          list.sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime());
          try {
            localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(list));
          } catch {
            // quota
          }
          callback(list);
        },
        (error) => {
          if (error?.code === 'unavailable') return;
          console.warn('[LibraryService] Aviso no listener de library_items:', error);
          this.getLibraryItems().then(callback);
        }
      );
    } catch {
      this.getLibraryItems().then(callback);
      return () => {};
    }
  },

  // Gravação de item no Firebase
  async saveLibraryItem(itemData: Partial<LibraryItem> & { titulo: string; tipo: LibraryItemType }): Promise<LibraryItem> {
    purgeSpeculativeLibraryData();
    const currentList = await this.getLibraryItems();
    const id = itemData.id || `lib-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const existingIndex = currentList.findIndex((i) => i.id === id);
    const existing = existingIndex >= 0 ? currentList[existingIndex] : null;

    const auth = getAuthSafe();
    const user = auth?.currentUser;

    const fullItem: LibraryItem = {
      id,
      tipo: itemData.tipo,
      titulo: itemData.titulo.trim(),
      subtitulo: itemData.subtitulo?.trim() || undefined,
      autores: Array.isArray(itemData.autores) && itemData.autores.length > 0 ? itemData.autores : ['Autor Desconhecido'],
      organizadores: itemData.organizadores || undefined,
      tradutores: itemData.tradutores || undefined,
      editora: itemData.editora?.trim() || 'Editora Independente',
      localPublicacao: itemData.localPublicacao?.trim() || 'Brasil',
      anoPublicacao: Number(itemData.anoPublicacao) || new Date().getFullYear(),
      edicao: itemData.edicao?.trim() || undefined,
      volume: itemData.volume?.trim() || undefined,
      fasciculoNumero: itemData.fasciculoNumero?.trim() || undefined,
      mesAnoPeriodico: itemData.mesAnoPeriodico?.trim() || undefined,
      isbn: itemData.isbn?.trim() || undefined,
      issn: itemData.issn?.trim() || undefined,
      doi: itemData.doi?.trim() || undefined,
      codigoBarras: itemData.codigoBarras?.trim() || undefined,
      cdd: itemData.cdd?.trim() || undefined,
      cdu: itemData.cdu?.trim() || undefined,
      cutter: itemData.cutter?.trim() || undefined,
      assuntos: Array.isArray(itemData.assuntos) ? itemData.assuntos : [],
      paginas: itemData.paginas ? Number(itemData.paginas) : undefined,
      dimensoesCm: itemData.dimensoesCm?.trim() || undefined,
      ilustrado: !!itemData.ilustrado,
      capaUrl: itemData.capaUrl?.trim() || undefined,
      idioma: itemData.idioma?.trim() || 'Português',
      idiomaOriginal: itemData.idiomaOriginal?.trim() || undefined,
      sinopse: itemData.sinopse?.trim() || '',
      sumarioOuNotas: itemData.sumarioOuNotas?.trim() || undefined,
      localizacao: itemData.localizacao || {
        predio: 'Biblioteca Central WikiWorldWeb',
        andar: '1º Pavimento',
        secao: 'Acervo Geral',
        estante: 'Estante 1',
        prateleira: 'Prateleira 1',
        codigoChamada: itemData.cdd ? `${itemData.cdd} ${itemData.cutter || ''}`.trim() : '000',
      },
      exemplaresTotais: Number(itemData.exemplaresTotais) || 1,
      exemplaresDisponiveis: Number(itemData.exemplaresDisponiveis) || 1,
      estadoConservacao: itemData.estadoConservacao || 'bom',
      statusCirculacao: itemData.statusCirculacao || 'disponivel',
      artigoWikiVinculadoId: itemData.artigoWikiVinculadoId || undefined,
      artigoWikiVinculadoTitulo: itemData.artigoWikiVinculadoTitulo || undefined,
      comiteEtica: itemData.comiteEtica ?? existing?.comiteEtica,
      cadastradoPorUid: existing?.cadastradoPorUid || user?.uid || 'anonimo',
      cadastradoPorNome: existing?.cadastradoPorNome || user?.displayName || 'Colaborador WikiWorldWeb',
      dataCadastro: existing?.dataCadastro || now,
      ultimaModificacao: now,
      visualizacoes: existing?.visualizacoes || 0,
      mediaAvaliacoes: existing?.mediaAvaliacoes || 0,
      totalAvaliacoes: existing?.totalAvaliacoes || 0,
    };

    // 1. Grava no Cloud Firestore
    const db = getDb();
    if (db) {
      try {
        await setDoc(doc(db, COLLECTION_ITEMS, id), {
          ...fullItem,
          _updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[LibraryService] Aviso ao persistir item no Firestore:', err);
      }
    }

    // 2. Atualiza cache local
    if (existingIndex >= 0) {
      currentList[existingIndex] = fullItem;
    } else {
      currentList.unshift(fullItem);
    }

    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(currentList));
    } catch {
      // quota
    }

    return fullItem;
  },

  // Remoção de item no Firebase
  async deleteLibraryItem(id: string): Promise<boolean> {
    const currentList = await this.getLibraryItems();
    const filtered = currentList.filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY_ITEMS, JSON.stringify(filtered));
    } catch {
      // quota
    }

    const db = getDb();
    if (db) {
      try {
        await deleteDoc(doc(db, COLLECTION_ITEMS, id));
      } catch (err) {
        console.warn('[LibraryService] Aviso ao deletar item no Firestore:', err);
      }
    }
    return true;
  },

  // === AVALIAÇÕES & RESENHAS CRÍTICAS (ESTRITAS AO FIREBASE) ===
  async getLibraryReviews(itemId?: string): Promise<LibraryReview[]> {
    purgeSpeculativeLibraryData();
    const db = getDb();
    if (db) {
      try {
        const q = itemId
          ? query(collection(db, COLLECTION_REVIEWS), where('itemId', '==', itemId))
          : collection(db, COLLECTION_REVIEWS);
        const snap = await getDocs(q);
        const list: LibraryReview[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (SPECULATIVE_REVIEW_IDS.has(d.id) || SPECULATIVE_REVIEW_IDS.has(data.id)) return;
          list.push(normalizeLibraryReview(d.id, data));
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      } catch (err) {
        console.warn('[LibraryService] Fallback de reviews para cache local:', err);
      }
    }

    // Fallback de cache local seguro (sem reviews especulativas)
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIBRARY_REVIEWS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((r: LibraryReview) => r && !SPECULATIVE_REVIEW_IDS.has(r.id));
          if (itemId) {
            return filtered.filter((r) => r.itemId === itemId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }
    } catch {
      // ignora
    }
    return [];
  },

  subscribeToLibraryReviews(itemId: string, callback: (reviews: LibraryReview[]) => void): () => void {
    purgeSpeculativeLibraryData();
    const db = getDb();
    if (!db) {
      this.getLibraryReviews(itemId).then(callback);
      return () => {};
    }

    try {
      const q = query(collection(db, COLLECTION_REVIEWS), where('itemId', '==', itemId));
      return onSnapshot(
        q,
        (snap) => {
          const list: LibraryReview[] = [];
          snap.forEach((d) => {
            const data = d.data();
            if (!SPECULATIVE_REVIEW_IDS.has(d.id) && !SPECULATIVE_REVIEW_IDS.has(data.id)) {
              list.push(normalizeLibraryReview(d.id, data));
            }
          });
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(list);
        },
        (err) => {
          if (err?.code === 'unavailable') return;
          console.warn('[LibraryService] Aviso no listener de reviews:', err);
          this.getLibraryReviews(itemId).then(callback);
        }
      );
    } catch {
      this.getLibraryReviews(itemId).then(callback);
      return () => {};
    }
  },

  // Gravar avaliação no Firebase
  async addLibraryReview(reviewData: Omit<LibraryReview, 'id' | 'createdAt'>): Promise<LibraryReview> {
    purgeSpeculativeLibraryData();
    const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newReview: LibraryReview = {
      ...reviewData,
      id,
      createdAt: new Date().toISOString(),
      likesCount: 0,
    };

    // 1. Grava no Cloud Firestore
    const db = getDb();
    if (db) {
      try {
        await setDoc(doc(db, COLLECTION_REVIEWS, id), {
          ...newReview,
          _createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[LibraryService] Aviso ao gravar review no Firestore:', err);
      }
    }

    // 2. Atualiza cache local de avaliações
    let localReviews: LibraryReview[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIBRARY_REVIEWS);
      localReviews = raw ? JSON.parse(raw) : [];
    } catch {
      localReviews = [];
    }
    localReviews = localReviews.filter((r) => r && !SPECULATIVE_REVIEW_IDS.has(r.id));
    localReviews.unshift(newReview);
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY_REVIEWS, JSON.stringify(localReviews));
    } catch {
      // quota
    }

    // 3. Recalcula média de avaliações do item no Firebase
    const itemReviews = localReviews.filter((r) => r.itemId === reviewData.itemId);
    const total = itemReviews.length;
    const avg = total > 0 ? Number((itemReviews.reduce((acc, cur) => acc + cur.rating, 0) / total).toFixed(1)) : 0;

    const items = await this.getLibraryItems();
    const targetItem = items.find((i) => i.id === reviewData.itemId);
    if (targetItem) {
      targetItem.mediaAvaliacoes = avg;
      targetItem.totalAvaliacoes = total;
      await this.saveLibraryItem(targetItem);
    }

    return newReview;
  },

  // === GERADORES DE CITAÇÃO BIBLIOGRÁFICA ===
  /**
   * Citação no padrão ABNT NBR 6023
   * Ex: ASSIS, Machado de. Dom Casmurro: Memórias de Bento Santiago. Edição Crítica. Rio de Janeiro: Garnier, 1899. 256 p.
   */
  formatAbntCitation(item: LibraryItem): string {
    const primaryAuthor = item.autores[0] || 'AUTOR NÃO IDENTIFICADO';
    const otherAuthors = item.autores.slice(1);
    
    let authorsStr = primaryAuthor.toUpperCase();
    if (otherAuthors.length === 1) {
      authorsStr += `; ${otherAuthors[0].toUpperCase()}`;
    } else if (otherAuthors.length > 1) {
      authorsStr += ' et al.';
    }

    let citation = `${authorsStr}. ${item.titulo}`;
    if (item.subtitulo) {
      citation += `: ${item.subtitulo}`;
    }
    citation += '.';

    if (item.edicao) {
      citation += ` ${item.edicao}.`;
    }

    citation += ` ${item.localPublicacao}: ${item.editora}, ${item.anoPublicacao}.`;

    if (item.tipo === 'periodico') {
      if (item.volume) citation += ` ${item.volume},`;
      if (item.fasciculoNumero) citation += ` ${item.fasciculoNumero},`;
      if (item.mesAnoPeriodico) citation += ` ${item.mesAnoPeriodico}.`;
      if (item.issn) citation += ` ISSN ${item.issn}.`;
    } else {
      if (item.paginas) citation += ` ${item.paginas} p.`;
      if (item.isbn) citation += ` ISBN ${item.isbn}.`;
    }

    if (item.cdd) {
      citation += ` CDD: ${item.cdd}.`;
    }

    return citation;
  },

  /**
   * Citação no padrão APA 7th Edition
   * Ex: Assis, M. d. (1899). Dom Casmurro: Memórias de Bento Santiago. Garnier.
   */
  formatApaCitation(item: LibraryItem): string {
    const authorsStr = item.autores.join(', ');
    let citation = `${authorsStr} (${item.anoPublicacao}). ${item.titulo}`;
    if (item.subtitulo) {
      citation += `: ${item.subtitulo}`;
    }
    citation += `. ${item.editora}.`;
    if (item.doi) {
      citation += ` https://doi.org/${item.doi}`;
    } else if (item.isbn) {
      citation += ` ISBN: ${item.isbn}`;
    }
    return citation;
  },

  /**
   * Entrada BibTeX pronta para LaTeX e softwares de gerenciamento bibliográfico
   */
  formatBibtexCitation(item: LibraryItem): string {
    const bibKey = `${(item.autores[0] || 'autor').split(',')[0].toLowerCase().replace(/\s+/g, '')}${item.anoPublicacao}`;
    const bibType = item.tipo === 'periodico' ? 'article' : item.tipo === 'tese' ? 'phdthesis' : 'book';

    return `@${bibType}{${bibKey},
  title = {${item.titulo}${item.subtitulo ? ': ' + item.subtitulo : ''}},
  author = {${item.autores.join(' and ')}},
  publisher = {${item.editora}},
  address = {${item.localPublicacao}},
  year = {${item.anoPublicacao}},
  ${item.isbn ? `isbn = {${item.isbn}},` : ''}
  ${item.issn ? `issn = {${item.issn}},` : ''}
  ${item.cdd ? `note = {CDD: ${item.cdd}, Chamada: ${item.localizacao.codigoChamada}},` : ''}
}`;
  },

  /**
   * Gera código Cutter aproximado para notação de autor
   */
  generateCutterCode(author: string, title: string): string {
    if (!author) return 'A100a';
    const cleanAuthor = author.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const firstLetter = cleanAuthor[0] || 'A';
    
    // Hash determinístico simples de 3 dígitos
    let hash = 0;
    for (let i = 0; i < cleanAuthor.length; i++) {
      hash = (hash * 31 + cleanAuthor.charCodeAt(i)) % 900;
    }
    const cutterNumber = 100 + hash;
    const titleLetter = (title || 'a').trim()[0]?.toLowerCase() || 'a';

    return `${firstLetter}${cutterNumber}${titleLetter}`;
  },

  /**
   * Validação de formato de ISBN (10 ou 13 dígitos com hifens opcionais)
   */
  validateIsbn(isbn: string): boolean {
    const clean = isbn.replace(/[^0-9X]/gi, '');
    return clean.length === 10 || clean.length === 13;
  },

  /**
   * Validação de formato de ISSN (8 dígitos, com ou sem hífen)
   */
  validateIssn(issn: string): boolean {
    const clean = issn.replace(/[^0-9X]/gi, '');
    return clean.length === 8;
  },
};
