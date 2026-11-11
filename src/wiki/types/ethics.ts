/**
 * Tipos e Definições para o Comitê de Ética em Pesquisa com Seres Humanos
 * (CEP / CONEP / Plataforma Brasil - Sistema CEP/CONEP do Conselho Nacional de Saúde)
 * Em conformidade com as Resoluções CNS nº 466/2012, 510/2016 e diretrizes internacionais (Declaração de Helsinque, CIOMS).
 */

export type EthicsApprovalStatus =
  | 'aprovado'          // Parecer Consubstanciado Favorável (Aprovado pelo CEP ou CONEP)
  | 'dispensado'        // Isento ou Dispensado de Avaliação Ética (ex: Resolução CNS nº 510/2016 - dados secundários/domínio público)
  | 'em_tramitacao'     // Protocolado / Em Análise Ética na Plataforma Brasil
  | 'nao_se_aplica';    // Não se Aplica (estudo puramente teórico, bibliográfico, documental ou sem voluntários humanos)

export interface ResearchEthicsCommitteeInfo {
  envolveSeresHumanos: boolean;               // Indica se o estudo, livro ou artigo envolve pesquisa com participantes humanos
  statusEtica: EthicsApprovalStatus;          // Situação ética regulatória perante o CEP/CONEP
  nomeComite?: string;                        // Nome do Comitê de Ética Institucional (ex: "CEP/FMUSP", "CEP/UNICAMP", "CONEP")
  numeroParecer?: string;                     // Número do Parecer Consubstanciado (ex: "Parecer nº 5.842.119")
  numeroCaae?: string;                        // CAAE (Certificado de Apresentação de Apreciação Ética - Plataforma Brasil)
  instituicaoProponente?: string;             // Instituição acadêmica/científica proponente (ex: "Universidade de São Paulo")
  dataAprovacao?: string;                     // Data de emissão e aprovação do parecer (formato YYYY-MM-DD ou DD/MM/AAAA)
  temTcle?: boolean;                          // Termo de Consentimento Livre e Esclarecido (TCLE) ou TALE obtido dos participantes
  resolucaoRegulamentadora?: string;          // Resolução do CNS aplicável (ex: "Resolução CNS nº 466/2012" ou "Resolução CNS nº 510/2016")
  justificativaOuObservacoes?: string;        // Medidas éticas adotadas (sigilo, anonimização, minimização de riscos aos voluntários)
  linkPlataformaBrasilOuComprovante?: string; // Link para verificação ou comprovante
}

export const CNS_RESOLUTIONS = [
  {
    id: 'cns_466_2012',
    label: 'Resolução CNS nº 466/2012 (Pesquisas em Saúde e Biomédicas)',
    description: 'Diretrizes e normas regulamentadoras de pesquisas envolvendo seres humanos na área da saúde e biológica.',
  },
  {
    id: 'cns_510_2016',
    label: 'Resolução CNS nº 510/2016 (Ciências Humanas e Sociais - CHS)',
    description: 'Normas aplicáveis a pesquisas em Ciências Humanas e Sociais cujas metodologias demandem tratamento ético específico.',
  },
  {
    id: 'cns_dispensa',
    label: 'Dispensa Regulamentar (Art. 1º, Parágrafo Único da Res. 510/2016)',
    description: 'Pesquisas de opinião com dados anônimos, revisão bibliográfica ou censitárias sem identificação dos sujeitos.',
  },
];
