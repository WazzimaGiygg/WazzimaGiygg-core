import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import {
  AcademicPublication,
  AcademicPeerReview,
  ResearcherProfile,
  AcademicPublicationType,
} from '../types/academic';

const COLLECTION_PUBLICATIONS = 'academic_publications';
const COLLECTION_PEER_REVIEWS = 'academic_peer_reviews';

const STORAGE_KEY_PUBLICATIONS = 'wiki_academic_publications_cache_v1';
const STORAGE_KEY_PEER_REVIEWS = 'wiki_academic_peer_reviews_cache_v1';
const PURGE_SPECULATIVE_FLAG = 'wiki_academic_purged_speculative_v1';

export const INITIAL_ACADEMIC_PUBLICATIONS: AcademicPublication[] = [
  {
    id: 'acad-cep-tese-001',
    tipo: 'tese_doutorado',
    titulo: 'Avaliação de Intervenções Digitais no Desenvolvimento Cognitivo e Psicossocial de Crianças em Idade Escolar',
    subtitulo: 'Ensaio Clínico Randomizado Controlado Multicêntrico no Estado de São Paulo',
    tituloIngles: 'Evaluation of Digital Interventions on Cognitive and Psychosocial Development of School-Age Children: A Multicenter Randomized Controlled Trial',
    autores: [
      {
        nome: 'Dra. Mariana Vasconcelos Ribeiro',
        nomeCitacao: 'RIBEIRO, M. V.',
        filiacao: 'Universidade de São Paulo (USP)',
        departamento: 'Faculdade de Medicina - Departamento de Pediatria e Saúde Coletiva',
        orcid: '0000-0002-8419-7231',
        email: 'mariana.vasconcelos@usp.br',
      },
    ],
    orientadores: [
      {
        nome: 'Prof. Dr. Carlos Eduardo Nogueira',
        filiacao: 'Universidade de São Paulo (USP)',
      },
    ],
    bancaExaminadora: [
      'Prof. Dr. Roberto Guimarães (UNICAMP)',
      'Profa. Dra. Helena Siqueira (UNIFESP)',
      'Prof. Dr. André Bastos (Fiocruz)',
    ],
    universidadeOuInstituicao: 'Universidade de São Paulo (USP)',
    programaPosGraduacao: 'Programa de Pós-Graduação em Saúde Coletiva e Pediatria',
    anoPublicacao: 2024,
    dataPublicacao: '2024-05-20',
    doi: '10.11606/T.5.2024.t-182901',
    resumo: 'Investigação clínica controlada analisando os impactos de interfaces pedagógicas adaptativas e estímulos digitais no rendimento neurocognitivo de 450 crianças em escolas públicas. Estudo rigorosamente submetido e aprovado pelo Comitê de Ética em Pesquisa com Seres Humanos do Hospital das Clínicas da FMUSP, cumprindo integralmente as exigências do Conselho Nacional de Saúde.',
    resumoIngles: 'A multicenter randomized controlled clinical trial evaluating the effects of adaptive pedagogical digital interfaces on the cognitive and psychosocial performance of 450 school children.',
    palavrasChave: ['Desenvolvimento Infantil', 'Tecnologias Assistivas', 'Ensaio Clínico', 'Bioética', 'Comitê de Ética'],
    areaConhecimentoCnpq: 'Ciências da Saúde',
    agenciaFomento: 'FAPESP',
    processoFomento: 'Processo 2021/14980-2',
    statusAcesso: 'open_access',
    licenca: 'Creative Commons CC-BY 4.0',
    totalCitacoes: 14,
    visualizacoes: 320,
    downloads: 185,
    statusRevisao: 'peer_reviewed',
    comiteEtica: {
      envolveSeresHumanos: true,
      statusEtica: 'aprovado',
      nomeComite: 'Comitê de Ética em Pesquisa do Hospital das Clínicas da FMUSP (CEP/HCFMUSP)',
      numeroCaae: '58491022.3.0000.0068',
      numeroParecer: 'Parecer Consubstanciado nº 5.842.119',
      instituicaoProponente: 'Faculdade de Medicina da Universidade de São Paulo',
      dataAprovacao: '2023-04-18',
      temTcle: true,
      resolucaoRegulamentadora: 'Resolução CNS nº 466/2012 (Pesquisas em Saúde e Biomédicas)',
      justificativaOuObservacoes: 'Consentimento formal colhido mediante Termo de Consentimento Livre e Esclarecido (TCLE) dos pais e Termo de Assentimento Livre e Esclarecido (TALE) das crianças. Dados integralmente anonimizados.',
      linkPlataformaBrasilOuComprovante: 'https://plataformabrasil.saude.gov.br/',
    },
    dataCriacao: '2024-05-20T10:00:00Z',
  },
  {
    id: 'acad-cep-livro-002',
    tipo: 'livro_academico',
    titulo: 'Bioética, Dignidade Humana e Pesquisa com Participantes Vulneráveis no Brasil',
    subtitulo: 'Teoria, Procedimentos na Plataforma Brasil e Prática Regulatória do Sistema CEP/CONEP',
    tituloIngles: 'Bioethics, Human Dignity and Research with Vulnerable Participants in Brazil',
    autores: [
      {
        nome: 'Prof. Dr. Alexandre Fontoura Dias',
        nomeCitacao: 'DIAS, A. F.',
        filiacao: 'Fundação Oswaldo Cruz (Fiocruz)',
        departamento: 'Escola Nacional de Saúde Pública Sergio Arouca (ENSP)',
        orcid: '0000-0003-1102-4590',
      },
      {
        nome: 'Dra. Beatriz Albuquerque Leite',
        nomeCitacao: 'LEITE, B. A.',
        filiacao: 'Universidade Estadual de Campinas (UNICAMP)',
        departamento: 'Faculdade de Ciências Médicas',
        orcid: '0000-0001-9032-1188',
      },
    ],
    universidadeOuInstituicao: 'Editora Fiocruz / UNICAMP',
    anoPublicacao: 2023,
    isbn: '978-85-7541-689-1',
    doi: '10.7476/9788575416891',
    resumo: 'Livro acadêmico de referência abordando a trajetória dos Comitês de Ética em Pesquisa (CEP) e da Comissão Nacional de Ética em Pesquisa (CONEP) no Brasil. Analisa a aplicação das Resoluções CNS 466/2012 e 510/2016, a proteção das populações vulneráveis, povos indígenas e participantes de ensaios clínicos.',
    palavrasChave: ['Bioética', 'Comitê de Ética em Pesquisa', 'CONEP', 'Plataforma Brasil', 'Direitos Humanos'],
    areaConhecimentoCnpq: 'Ciências Humanas',
    statusAcesso: 'open_access',
    licenca: 'Creative Commons CC-BY-NC 4.0',
    totalCitacoes: 38,
    visualizacoes: 740,
    downloads: 410,
    statusRevisao: 'peer_reviewed',
    comiteEtica: {
      envolveSeresHumanos: true,
      statusEtica: 'aprovado',
      nomeComite: 'Comitê de Ética em Pesquisa da Fundação Oswaldo Cruz (CEP/Fiocruz)',
      numeroCaae: '41209320.1.0000.5248',
      numeroParecer: 'Parecer Consubstanciado nº 4.901.882',
      instituicaoProponente: 'Fundação Oswaldo Cruz',
      dataAprovacao: '2022-10-15',
      temTcle: true,
      resolucaoRegulamentadora: 'Resolução CNS nº 510/2016 (Ciências Humanas e Sociais - CHS)',
      justificativaOuObservacoes: 'Pesquisa social qualitativa com membros de comitês de ética e voluntários de estudos clínicos, conduzida com TCLE assinado e sigilo absoluto de dados.',
    },
    dataCriacao: '2023-11-10T14:30:00Z',
  },
  {
    id: 'acad-cep-artigo-003',
    tipo: 'artigo_periodico',
    titulo: 'Dinâmica de Moderação Comunitária e Conflito Epistêmico em Plataformas Wiki Abertas',
    subtitulo: 'Análise de Redes Sociais e Métricas de Engajamento de Editores Voluntários',
    tituloIngles: 'Community Moderation Dynamics and Epistemic Conflict in Open Wiki Platforms',
    autores: [
      {
        nome: 'Prof. Dr. Ricardo Mendonça Sampaio',
        nomeCitacao: 'SAMPAIO, R. M.',
        filiacao: 'Universidade Federal de Minas Gerais (UFMG)',
        departamento: 'Departamento de Ciência da Computação e Comunicação Social',
        orcid: '0000-0002-3904-8119',
      },
    ],
    universidadeOuInstituicao: 'Universidade Federal de Minas Gerais (UFMG)',
    periodicoOuEvento: 'Revista Brasileira de Informática na Educação e Mídias Digitais',
    volume: '32',
    fasciculo: '2',
    paginas: '45-68',
    anoPublicacao: 2024,
    doi: '10.5753/rbie.2024.3202',
    resumo: 'Estudo analítico sobre colaboração coletiva, mediação de disputas e integridade editorial em enciclopédias digitais. Por utilizar apenas dados secundários agregados e públicos sem identificação pessoal, o trabalho foi enquadrado em dispensa formal de apreciação ética conforme a Resolução CNS 510/2016.',
    palavrasChave: ['Enciclopédia Wiki', 'Moderação', 'Comunicação Digital', 'Ética em Pesquisa'],
    areaConhecimentoCnpq: 'Ciências Sociais Aplicadas',
    statusAcesso: 'open_access',
    totalCitacoes: 8,
    visualizacoes: 195,
    downloads: 92,
    statusRevisao: 'peer_reviewed',
    comiteEtica: {
      envolveSeresHumanos: true,
      statusEtica: 'dispensado',
      nomeComite: 'Comitê de Ética em Pesquisa da UFMG (COEP/UFMG)',
      numeroParecer: 'Dispensa Regulamentar nos termos do Art. 1º, Parágrafo Único da Res. CNS 510/2016',
      instituicaoProponente: 'Universidade Federal de Minas Gerais',
      resolucaoRegulamentadora: 'Resolução CNS nº 510/2016 (Ciências Humanas e Sociais - CHS)',
      justificativaOuObservacoes: 'Pesquisa documental com dados agregados de livre acesso público na web, sem manipulação de sujeitos ou identificação de dados sensíveis individuais.',
    },
    dataCriacao: '2024-03-15T09:00:00Z',
  },
];

export function purgeSpeculativeAcademicData(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(PURGE_SPECULATIVE_FLAG)) {
    try {
      localStorage.removeItem(STORAGE_KEY_PUBLICATIONS);
      localStorage.removeItem(STORAGE_KEY_PEER_REVIEWS);
    } catch {
      // ignora
    }
    localStorage.setItem(PURGE_SPECULATIVE_FLAG, 'true');
  }
}

function normalizePublication(id: string, data: any): AcademicPublication {
  return {
    id: data.id || id,
    tipo: data.tipo || 'artigo_periodico',
    titulo: data.titulo || 'Sem título acadêmico',
    subtitulo: data.subtitulo || undefined,
    tituloIngles: data.tituloIngles || undefined,
    autores: Array.isArray(data.autores) && data.autores.length > 0
      ? data.autores
      : [{ nome: 'Autor Não Identificado' }],
    orientadores: Array.isArray(data.orientadores) ? data.orientadores : undefined,
    bancaExaminadora: Array.isArray(data.bancaExaminadora) ? data.bancaExaminadora : undefined,
    universidadeOuInstituicao: data.universidadeOuInstituicao || 'Instituição Acadêmica',
    programaPosGraduacao: data.programaPosGraduacao || undefined,
    periodicoOuEvento: data.periodicoOuEvento || undefined,
    volume: data.volume || undefined,
    fasciculo: data.fasciculo || undefined,
    paginas: data.paginas || undefined,
    anoPublicacao: Number(data.anoPublicacao) || new Date().getFullYear(),
    dataPublicacao: data.dataPublicacao || undefined,
    doi: data.doi || undefined,
    arxivId: data.arxivId || undefined,
    pubmedId: data.pubmedId || undefined,
    handleUri: data.handleUri || undefined,
    issn: data.issn || undefined,
    isbn: data.isbn || undefined,
    resumo: data.resumo || '',
    resumoIngles: data.resumoIngles || undefined,
    palavrasChave: Array.isArray(data.palavrasChave) ? data.palavrasChave : [],
    palavrasChaveIngles: Array.isArray(data.palavrasChaveIngles) ? data.palavrasChaveIngles : undefined,
    areaConhecimentoCnpq: data.areaConhecimentoCnpq || 'Multidisciplinar',
    classificacaoJelAcm: data.classificacaoJelAcm || undefined,
    agenciaFomento: data.agenciaFomento || undefined,
    processoFomento: data.processoFomento || undefined,
    statusAcesso: data.statusAcesso || 'open_access',
    licenca: data.licenca || 'Creative Commons CC-BY 4.0',
    pdfUrl: data.pdfUrl || undefined,
    repositorioUrl: data.repositorioUrl || undefined,
    codigoOuDadosUrl: data.codigoOuDadosUrl || undefined,
    totalCitacoes: Number(data.totalCitacoes) || 0,
    citacoesLista: Array.isArray(data.citacoesLista) ? data.citacoesLista : [],
    visualizacoes: Number(data.visualizacoes) || 0,
    downloads: Number(data.downloads) || 0,
    statusRevisao: data.statusRevisao || 'peer_reviewed',
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
    submittedByUid: data.submittedByUid || undefined,
    submittedByName: data.submittedByName || undefined,
    dataCriacao: data.dataCriacao || new Date().toISOString(),
    dataAtualizacao: data.dataAtualizacao || undefined,
  };
}

function normalizePeerReview(id: string, data: any): AcademicPeerReview {
  return {
    id: data.id || id,
    publicationId: data.publicationId,
    reviewerUid: data.reviewerUid || 'anonimo',
    reviewerName: data.reviewerName || 'Revisor Acadêmico',
    reviewerFiliacao: data.reviewerFiliacao || undefined,
    tituloParecer: data.tituloParecer || 'Parecer de Avaliação',
    parecerTexto: data.parecerTexto || '',
    parecerDecisao: data.parecerDecisao || 'recomendado',
    notaRigorMetodologico: Number(data.notaRigorMetodologico) || 5,
    notaOriginalidade: Number(data.notaOriginalidade) || 5,
    notaClareza: Number(data.notaClareza) || 5,
    notaRelevancia: Number(data.notaRelevancia) || 5,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

export const AcademicService = {
  /**
   * Recupera todas as publicações cadastradas no Cloud Firestore
   */
  async getPublications(): Promise<AcademicPublication[]> {
    purgeSpeculativeAcademicData();
    const db = getDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_PUBLICATIONS));
        const list: AcademicPublication[] = [];
        snap.forEach((d) => {
          list.push(normalizePublication(d.id, d.data()));
        });

        // Ordena por ano decrescente e data de criação
        list.sort((a, b) => b.anoPublicacao - a.anoPublicacao || new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());

        if (list.length > 0) {
          try {
            localStorage.setItem(STORAGE_KEY_PUBLICATIONS, JSON.stringify(list));
          } catch {
            // ignora quota
          }
          return list;
        }
      } catch (err) {
        console.warn('[AcademicService] Erro ao consultar Firestore:', err);
      }
    }

    // Fallback local ou dados padrão
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PUBLICATIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignora
    }
    return INITIAL_ACADEMIC_PUBLICATIONS;
  },

  /**
   * Importação manual e sincronização imediata com Firestore
   */
  async importFromFirebase(): Promise<{ publications: AcademicPublication[]; reviews: AcademicPeerReview[]; count: number }> {
    purgeSpeculativeAcademicData();
    const db = getDb();
    if (!db) {
      throw new Error('Cloud Firestore não está acessível no momento.');
    }

    const snapPubs = await getDocs(collection(db, COLLECTION_PUBLICATIONS));
    const pubs: AcademicPublication[] = [];
    snapPubs.forEach((d) => {
      pubs.push(normalizePublication(d.id, d.data()));
    });
    pubs.sort((a, b) => b.anoPublicacao - a.anoPublicacao || new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());

    const snapReviews = await getDocs(collection(db, COLLECTION_PEER_REVIEWS));
    const reviews: AcademicPeerReview[] = [];
    snapReviews.forEach((d) => {
      reviews.push(normalizePeerReview(d.id, d.data()));
    });

    try {
      localStorage.setItem(STORAGE_KEY_PUBLICATIONS, JSON.stringify(pubs));
      localStorage.setItem(STORAGE_KEY_PEER_REVIEWS, JSON.stringify(reviews));
    } catch {
      // ignora quota
    }

    return { publications: pubs, reviews, count: pubs.length };
  },

  /**
   * Subscrição em tempo real aos documentos acadêmicos do Firestore
   */
  subscribeToPublications(callback: (pubs: AcademicPublication[]) => void): () => void {
    purgeSpeculativeAcademicData();
    const db = getDb();
    if (!db) {
      this.getPublications().then(callback);
      return () => {};
    }

    try {
      return onSnapshot(
        collection(db, COLLECTION_PUBLICATIONS),
        (snap) => {
          const list: AcademicPublication[] = [];
          snap.forEach((d) => list.push(normalizePublication(d.id, d.data())));
          list.sort((a, b) => b.anoPublicacao - a.anoPublicacao || new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
          const finalList = list.length > 0 ? list : INITIAL_ACADEMIC_PUBLICATIONS;
          try {
            localStorage.setItem(STORAGE_KEY_PUBLICATIONS, JSON.stringify(finalList));
          } catch {
            // ignora
          }
          callback(finalList);
        },
        (error) => {
          console.warn('[AcademicService] Snapshot error:', error);
          this.getPublications().then(callback);
        }
      );
    } catch {
      this.getPublications().then(callback);
      return () => {};
    }
  },

  /**
   * Salva ou atualiza uma publicação científica no Firestore
   */
  async savePublication(
    data: Partial<AcademicPublication> & { titulo: string; tipo: AcademicPublicationType; anoPublicacao: number; resumo: string }
  ): Promise<AcademicPublication> {
    purgeSpeculativeAcademicData();
    const currentList = await this.getPublications();
    const id = data.id || `acad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const existing = currentList.find((p) => p.id === id);
    const existingIndex = currentList.findIndex((p) => p.id === id);

    const fullPub: AcademicPublication = {
      id,
      tipo: data.tipo,
      titulo: data.titulo.trim(),
      subtitulo: data.subtitulo?.trim() || undefined,
      tituloIngles: data.tituloIngles?.trim() || undefined,
      autores: Array.isArray(data.autores) && data.autores.length > 0 ? data.autores : [{ nome: 'Autor Desconhecido' }],
      orientadores: data.orientadores || undefined,
      bancaExaminadora: data.bancaExaminadora || undefined,
      universidadeOuInstituicao: data.universidadeOuInstituicao?.trim() || 'Instituição Acadêmica',
      programaPosGraduacao: data.programaPosGraduacao?.trim() || undefined,
      periodicoOuEvento: data.periodicoOuEvento?.trim() || undefined,
      volume: data.volume?.trim() || undefined,
      fasciculo: data.fasciculo?.trim() || undefined,
      paginas: data.paginas?.trim() || undefined,
      anoPublicacao: Number(data.anoPublicacao) || new Date().getFullYear(),
      dataPublicacao: data.dataPublicacao || undefined,
      doi: data.doi?.trim().replace(/^https?:\/\/doi\.org\//, '') || undefined,
      arxivId: data.arxivId?.trim() || undefined,
      pubmedId: data.pubmedId?.trim() || undefined,
      handleUri: data.handleUri?.trim() || undefined,
      issn: data.issn?.trim() || undefined,
      isbn: data.isbn?.trim() || undefined,
      resumo: data.resumo.trim(),
      resumoIngles: data.resumoIngles?.trim() || undefined,
      palavrasChave: Array.isArray(data.palavrasChave) ? data.palavrasChave : [],
      palavrasChaveIngles: Array.isArray(data.palavrasChaveIngles) ? data.palavrasChaveIngles : undefined,
      areaConhecimentoCnpq: data.areaConhecimentoCnpq?.trim() || 'Ciência da Computação',
      classificacaoJelAcm: data.classificacaoJelAcm?.trim() || undefined,
      agenciaFomento: data.agenciaFomento?.trim() || undefined,
      processoFomento: data.processoFomento?.trim() || undefined,
      statusAcesso: data.statusAcesso || 'open_access',
      licenca: data.licenca?.trim() || 'Creative Commons CC-BY 4.0',
      pdfUrl: data.pdfUrl?.trim() || undefined,
      repositorioUrl: data.repositorioUrl?.trim() || undefined,
      codigoOuDadosUrl: data.codigoOuDadosUrl?.trim() || undefined,
      totalCitacoes: Number(data.totalCitacoes ?? existing?.totalCitacoes ?? 0),
      citacoesLista: data.citacoesLista || existing?.citacoesLista || [],
      visualizacoes: Number(data.visualizacoes ?? existing?.visualizacoes ?? 0),
      downloads: Number(data.downloads ?? existing?.downloads ?? 0),
      statusRevisao: data.statusRevisao || 'peer_reviewed',
      artigoWikiVinculadoTitulo: data.artigoWikiVinculadoTitulo?.trim() || undefined,
      comiteEtica: data.comiteEtica ?? existing?.comiteEtica,
      submittedByUid: data.submittedByUid || existing?.submittedByUid,
      submittedByName: data.submittedByName || existing?.submittedByName,
      dataCriacao: existing?.dataCriacao || now,
      dataAtualizacao: now,
    };

    // 1. Grava no Cloud Firestore
    const db = getDb();
    if (db) {
      try {
        await setDoc(doc(db, COLLECTION_PUBLICATIONS, id), {
          ...fullPub,
          _serverModified: serverTimestamp(),
        });
      } catch (err) {
        console.error('[AcademicService] Erro ao persistir no Firestore:', err);
      }
    }

    // 2. Atualiza cache local
    if (existingIndex >= 0) {
      currentList[existingIndex] = fullPub;
    } else {
      currentList.unshift(fullPub);
    }
    try {
      localStorage.setItem(STORAGE_KEY_PUBLICATIONS, JSON.stringify(currentList));
    } catch {
      // ignora quota
    }

    return fullPub;
  },

  /**
   * Deleta uma publicação do Firestore
   */
  async deletePublication(id: string): Promise<boolean> {
    const db = getDb();
    if (db) {
      try {
        await deleteDoc(doc(db, COLLECTION_PUBLICATIONS, id));
      } catch (err) {
        console.error('[AcademicService] Erro ao deletar no Firestore:', err);
      }
    }

    const currentList = await this.getPublications();
    const filtered = currentList.filter((p) => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_PUBLICATIONS, JSON.stringify(filtered));
    } catch {
      // ignora
    }
    return true;
  },

  /**
   * Registra uma citação a uma publicação
   */
  async addCitation(publicationId: string, citation: { titulo: string; ano: number; veiculo: string; autores?: string; doi?: string }): Promise<void> {
    const list = await this.getPublications();
    const pub = list.find((p) => p.id === publicationId);
    if (!pub) return;

    const citacoesLista = pub.citacoesLista ? [...pub.citacoesLista] : [];
    citacoesLista.push(citation);
    const totalCitacoes = (pub.totalCitacoes || 0) + 1;

    await this.savePublication({
      ...pub,
      totalCitacoes,
      citacoesLista,
    });
  },

  /**
   * Pareceres Acadêmicos e Revisão por Pares Aberta
   */
  async getPeerReviews(publicationId?: string): Promise<AcademicPeerReview[]> {
    purgeSpeculativeAcademicData();
    const db = getDb();
    if (db) {
      try {
        const q = publicationId
          ? query(collection(db, COLLECTION_PEER_REVIEWS), where('publicationId', '==', publicationId))
          : collection(db, COLLECTION_PEER_REVIEWS);
        const snap = await getDocs(q);
        const list: AcademicPeerReview[] = [];
        snap.forEach((d) => list.push(normalizePeerReview(d.id, d.data())));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      } catch (err) {
        console.warn('[AcademicService] Erro ao carregar pareceres do Firestore:', err);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_PEER_REVIEWS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          if (publicationId) return parsed.filter((r) => r.publicationId === publicationId);
          return parsed;
        }
      }
    } catch {
      // ignora
    }
    return [];
  },

  async addPeerReview(reviewData: Omit<AcademicPeerReview, 'id' | 'createdAt'>): Promise<AcademicPeerReview> {
    purgeSpeculativeAcademicData();
    const id = `rev-acad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newReview: AcademicPeerReview = {
      ...reviewData,
      id,
      createdAt: new Date().toISOString(),
    };

    const db = getDb();
    if (db) {
      try {
        await setDoc(doc(db, COLLECTION_PEER_REVIEWS, id), {
          ...newReview,
          _serverCreated: serverTimestamp(),
        });
      } catch (err) {
        console.error('[AcademicService] Erro ao salvar parecer no Firestore:', err);
      }
    }

    const reviews = await this.getPeerReviews();
    reviews.unshift(newReview);
    try {
      localStorage.setItem(STORAGE_KEY_PEER_REVIEWS, JSON.stringify(reviews));
    } catch {
      // ignora
    }

    return newReview;
  },

  /**
   * Computa perfis acadêmicos (estilo Google Acadêmico):
   * Calcula h-index, i10-index, total de citações e histórico anual por autor
   */
  computeResearcherProfiles(publications: AcademicPublication[]): ResearcherProfile[] {
    const authorMap = new Map<string, { filiacao: string; orcid?: string; pubs: AcademicPublication[]; areas: Set<string> }>();

    for (const pub of publications) {
      for (const author of pub.autores) {
        const name = author.nome.trim();
        if (!name) continue;

        if (!authorMap.has(name)) {
          authorMap.set(name, {
            filiacao: author.filiacao || pub.universidadeOuInstituicao || 'Universidade / Instituto',
            orcid: author.orcid,
            pubs: [],
            areas: new Set(),
          });
        }
        const entry = authorMap.get(name)!;
        entry.pubs.push(pub);
        if (author.orcid && !entry.orcid) entry.orcid = author.orcid;
        if (pub.areaConhecimentoCnpq) entry.areas.add(pub.areaConhecimentoCnpq);
      }
    }

    const profiles: ResearcherProfile[] = [];

    authorMap.forEach((entry, authorName) => {
      const pubs = entry.pubs;
      const totalCitations = pubs.reduce((sum, p) => sum + (p.totalCitacoes || 0), 0);

      // Cálculo do Índice h (h-index): h publicações com pelo menos h citações
      const sortedCitations = pubs.map((p) => p.totalCitacoes || 0).sort((a, b) => b - a);
      let hIndex = 0;
      for (let i = 0; i < sortedCitations.length; i++) {
        if (sortedCitations[i] >= i + 1) {
          hIndex = i + 1;
        } else {
          break;
        }
      }

      // Cálculo do Índice i10 (i10-index): publicações com pelo menos 10 citações
      const i10Index = sortedCitations.filter((c) => c >= 10).length;

      // Citações por ano de publicação
      const citacoesPorAno: Record<number, number> = {};
      for (const p of pubs) {
        const year = p.anoPublicacao;
        citacoesPorAno[year] = (citacoesPorAno[year] || 0) + (p.totalCitacoes || 0);
      }

      profiles.push({
        nome: authorName,
        filiacao: entry.filiacao,
        orcid: entry.orcid,
        totalPublicacoes: pubs.length,
        totalCitacoes: totalCitations,
        indiceH: hIndex,
        indiceI10: i10Index,
        citacoesPorAno,
        areasInteresse: Array.from(entry.areas),
        publicacoes: pubs.sort((a, b) => (b.totalCitacoes || 0) - (a.totalCitacoes || 0)),
      });
    });

    // Ordena os pesquisadores pelo maior número de citações
    return profiles.sort((a, b) => b.totalCitacoes - a.totalCitacoes || b.totalPublicacoes - a.totalPublicacoes);
  },
};
