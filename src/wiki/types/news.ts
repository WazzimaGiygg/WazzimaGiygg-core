export interface JornalArticle {
  id: string;
  titulo: string;
  subtitulo?: string;
  categoria: string;
  autorNome: string;
  autorEmail?: string;
  autorId?: string;
  resumo: string;
  conteudo: string;
  imagemUrl?: string;
  dataPublicacao: string;
  visualizacoes?: number;
  destaque?: boolean;
}

export type JornalCategory =
  | 'todos'
  | 'politica'
  | 'economia'
  | 'internacional'
  | 'tecnologia'
  | 'justica'
  | 'esporte'
  | 'opiniao'
  | 'cultura'
  | 'educacao'
  | 'redes-sociais'
  | 'investigacao'
  | 'geral';

export interface JornalFilterState {
  categoria: string;
  busca: string;
  ordenacao: 'recentes' | 'antigos' | 'populares';
}
