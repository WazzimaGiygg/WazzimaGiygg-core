import { ResearchEthicsCommitteeInfo, EthicsApprovalStatus } from './ethics';

export type { ResearchEthicsCommitteeInfo, EthicsApprovalStatus };

export type AcademicPublicationType =
  | 'artigo_periodico'       // Artigo em Periódico Científico / Journal Article
  | 'livro_academico'        // Livro Científico / Livro de Pesquisa / Obra Autoral Acadêmica
  | 'preprint'               // Pré-publicação / Preprint (arXiv, bioRxiv, SciELO)
  | 'conferencia'            // Anais de Congresso / Conference Paper / Proceeding
  | 'tese_doutorado'         // Tese de Doutorado / Ph.D. Dissertation
  | 'dissertacao_mestrado'   // Dissertação de Mestrado / Master's Thesis
  | 'tcc_monografia'         // Trabalho de Conclusão de Curso (TCC) / Monografia
  | 'capitulo_livro'         // Capítulo de Livro Acadêmico
  | 'relatorio_tecnico'      // Relatório Técnico / Whitepaper
  | 'dataset_pesquisa'       // Conjunto de Dados de Pesquisa / Dataset
  | 'patente';               // Patente Científica/Tecnológica

export type AcademicAccessStatus =
  | 'open_access'            // Acesso Aberto (Gold / Diamond Open Access)
  | 'green_open_access'      // Autoarquivamento / Repositório Institucional (Green OA)
  | 'restricted'             // Acesso Restrito / Assinatura
  | 'embargoed';             // Sob Embargo Temporário

export type AcademicReviewStatus =
  | 'peer_reviewed'          // Revisado por Pares (Peer-Reviewed)
  | 'preprint_open'          // Preprint Aberto para Discussão
  | 'under_review'           // Em Processo de Arbitragem
  | 'editor_reviewed';       // Revisão Editorial Aprovada

export interface AcademicAuthor {
  nome: string;
  nomeCitacao?: string;      // Ex: PERES, P. H. C.
  filiacao?: string;         // Ex: Universidade de São Paulo (USP)
  departamento?: string;     // Ex: Escola Politécnica - Eng. de Computação
  orcid?: string;            // Ex: 0000-0002-1825-0097
  email?: string;
  lattesUrl?: string;
  googleScholarUrl?: string;
}

export interface AcademicCitationEntry {
  titulo: string;
  ano: number;
  veiculo: string;
  autores?: string;
  doi?: string;
}

export interface AcademicPublication {
  id: string;
  tipo: AcademicPublicationType;
  titulo: string;
  subtitulo?: string;
  tituloIngles?: string;
  autores: AcademicAuthor[];
  orientadores?: AcademicAuthor[];
  bancaExaminadora?: string[];

  // Instituição, Programa e Veículo
  universidadeOuInstituicao?: string; // Ex: Universidade de São Paulo (USP), UNICAMP, Harvard
  programaPosGraduacao?: string;      // Ex: Pós-Graduação em Ciência da Computação
  periodicoOuEvento?: string;         // Ex: Nature, IEEE TKDE, Anais do SBBD
  volume?: string;
  fasciculo?: string;
  paginas?: string;                   // Ex: 45-62 ou e-2026019
  anoPublicacao: number;
  dataPublicacao?: string;

  // Identificadores Científicos
  doi?: string;                       // Ex: 10.1145/3411764.3445523
  arxivId?: string;                   // Ex: 2403.12345
  pubmedId?: string;                  // PMID
  handleUri?: string;                 // URI de repositório DSpace / OAI-PMH
  issn?: string;
  isbn?: string;

  // Conteúdo e Indexação
  resumo: string;                     // Abstract
  resumoIngles?: string;              // Abstract em Inglês
  palavrasChave: string[];
  palavrasChaveIngles?: string[];
  areaConhecimentoCnpq?: string;      // Ex: Ciências Exatas e da Terra -> Ciência da Computação
  classificacaoJelAcm?: string;

  // Fomento & Financiamento
  agenciaFomento?: string;            // Ex: CNPq, FAPESP, CAPES
  processoFomento?: string;           // Ex: Processo 2024/09876-5

  // Acesso, Repositório e Licença
  statusAcesso: AcademicAccessStatus;
  licenca?: string;                   // Ex: CC-BY 4.0
  pdfUrl?: string;                    // Link direto para PDF ou preprint
  repositorioUrl?: string;            // Link externo oficial
  codigoOuDadosUrl?: string;          // Link para GitHub, Zenodo, etc.

  // Métricas de Impacto (Estilo Google Acadêmico)
  totalCitacoes: number;
  citacoesLista?: AcademicCitationEntry[];
  visualizacoes?: number;
  downloads?: number;

  // Arbitragem e Wiki
  statusRevisao: AcademicReviewStatus;
  artigoWikiVinculadoTitulo?: string;

  // Comitê de Ética em Pesquisa com Seres Humanos (CEP / CONEP / Plataforma Brasil)
  comiteEtica?: ResearchEthicsCommitteeInfo;

  // Auditoria
  submittedByUid?: string;
  submittedByName?: string;
  dataCriacao: string;
  dataAtualizacao?: string;
}

export interface AcademicPeerReview {
  id: string;
  publicationId: string;
  reviewerUid: string;
  reviewerName: string;
  reviewerFiliacao?: string;
  tituloParecer: string;
  parecerTexto: string;
  parecerDecisao: 'aceito_sem_restricoes' | 'aceito_com_revisoes_menores' | 'necessita_revisao_maior' | 'rejeitado' | 'recomendado';
  notaRigorMetodologico: number; // 1 a 5
  notaOriginalidade: number;      // 1 a 5
  notaClareza: number;            // 1 a 5
  notaRelevancia: number;         // 1 a 5
  createdAt: string;
}

export interface ResearcherProfile {
  nome: string;
  filiacao: string;
  orcid?: string;
  totalPublicacoes: number;
  totalCitacoes: number;
  indiceH: number;
  indiceI10: number;
  citacoesPorAno: Record<number, number>;
  areasInteresse: string[];
  publicacoes: AcademicPublication[];
}
