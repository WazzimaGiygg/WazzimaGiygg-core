/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dados estruturados da Investigação Jurídico-Regulatória:
 * LGPD (Lei nº 13.709/2018) e Marco Civil da Internet (Lei nº 12.965/2014)
 * aplicados à Wikimedia Foundation (WMF) e à Wikipédia Lusófona.
 *
 * Fonte documental integral (41 páginas):
 * https://wazzimagiygg.com/Investiga%C3%A7%C3%A3o%20LGPD%20e%20Marco%20Civ%C3%ADl%20WMF%20e%20Wikip%C3%A9dia.pdf
 */

export const WMF_LGPD_PDF_URL =
  'https://wazzimagiygg.com/Investiga%C3%A7%C3%A3o%20LGPD%20e%20Marco%20Civ%C3%ADl%20WMF%20e%20Wikip%C3%A9dia.pdf';

export const WMF_LGPD_INVESTIGATION_META = {
  titulo: 'Investigação LGPD e Marco Civil — Wikimedia Foundation (WMF) e Wikipédia',
  subtitulo:
    'Auditoria de Conformidade Regulatória, Passivo Histórico de IPs, Retenção de Logs, Moderação Anônima e Evasão de Jurisdição no Brasil',
  paginas: 41,
  pdfUrl: WMF_LGPD_PDF_URL,
  normasPrincipais: [
    'LGPD (Lei nº 13.709/2018 — Arts. 3º, 4º II, 6º, 14, 18, 20, 33, 41 e 46)',
    'Marco Civil da Internet (Lei nº 12.965/2014 — Arts. 10, 11, 15 e 19) & Decreto nº 8.771/2016',
    'Constituição Federal (Art. 5º, X) & CPC (Art. 75)',
    'ECA (Lei nº 8.069/1990) & Resoluções CD/ANPD nº 18/2024 e nº 19/2024',
  ],
  conclusaoCentral:
    'Embora a Wikimedia Foundation (WMF) opere sem fins lucrativos e sem monetização publicitária comercial, a auditoria documenta um estado de não-conformidade material e regulatória continuada frente à legislação brasileira, criando uma "zona de anomia regulatória" em contraste direto com a arquitetura de privacidade nativa do Wiki-Site WazzimaGiygg / NotMediaWiki.',
} as const;

export type AuditRiskLevel = 'CRÍTICO' | 'ALTO' | 'MÉDIO a ALTO';

export interface WmfAuditFinding {
  id: string;
  codigoMatriz: string;
  risco: AuditRiskLevel;
  titulo: string;
  baseLegal: string[];
  fatoIrregularidade: string;
  detalhesTecnicos: string[];
  riscoRegulatorio: string;
  respostaWikiSite: string;
}

export const WMF_LGPD_AUDIT_FINDINGS: WmfAuditFinding[] = [
  {
    id: 'passivo-ips-scraping',
    codigoMatriz: 'AUD-01 / Q01 / Q10',
    risco: 'CRÍTICO',
    titulo: 'Exposição de Endereços IP, Passivo Histórico e Mineração de Dados (Data Scraping)',
    baseLegal: [
      'LGPD, Art. 6º, III e VII (Minimização e Segurança)',
      'LGPD, Art. 46 (Dever de Segurança e Prevenção)',
      'LGPD, Art. 14 & ECA (Proteção Integral de Menores)',
      'Marco Civil da Internet (IP como Dado Pessoal)',
    ],
    fatoIrregularidade:
      'Por mais de duas décadas, o MediaWiki registrou e exibiu publicamente o endereço IP completo (IPv4 e IPv6) de qualquer pessoa que editasse sem login em action=history e Especial:Registo_de_abusos. A iniciativa recente de IP Masking (Contas Temporárias / Temporary Accounts) reduz o risco operacional futuro para MÉDIO, mas atua apenas de forma prospectiva.',
    detalhesTecnicos: [
      'O passivo histórico acumulado por décadas permanece 100% público, indexado em buscadores e acessível a robôs de varredura (scrapers) sem barreira técnica.',
      'Terceiros podem cruzar IPs históricos com bancos de vazamentos externos, logs de provedores e ferramentas de geolocalização para desmascarar a identidade civil e localização física de cidadãos.',
      'Por ausência histórica de verificação etária, menores de idade que editaram deslogados tiveram seus IPs gravados permanentemente no histórico aberto.',
    ],
    riscoRegulatorio:
      'Vulnerabilidade mais grave da camada de dados da plataforma: infração continuada aos deveres de minimização e segurança (Arts. 6º e 46 da LGPD) e exposição agravada de crianças e adolescentes (Art. 14 da LGPD e ECA), sujeita a sanções administrativas da ANPD.',
    respostaWikiSite:
      'No Wiki-Site NotMediaWiki (WazzimaGiygg), endereços IP jamais são expostos publicamente em históricos de revisão ou páginas de discussão; edições e contas operam sob sigilo telemático estrito e Zero-Trust ABAC.',
  },
  {
    id: 'retencao-logs-90-dias',
    codigoMatriz: 'Art. 15 MCI',
    risco: 'ALTO',
    titulo: 'Divergência na Retenção de Logs de Acesso: Expurgo em 90 Dias vs. Lei Brasileira (180 Dias)',
    baseLegal: [
      'Marco Civil da Internet (Lei nº 12.965/2014), Art. 15',
      'Decreto nº 8.771/2016 (Regulamentação do MCI)',
    ],
    fatoIrregularidade:
      'O Artigo 15 do Marco Civil da Internet obriga provedores organizados profissionalmente a manterem registros de acesso a aplicações de internet sob sigilo pelo prazo mínimo de 6 meses (180 dias). A WMF aplica política global corporativa que destrói logs internos técnicos e de IP após apenas 90 dias (3 meses).',
    detalhesTecnicos: [
      'Tanto registros internos de IP em edições quanto logs de Contas Temporárias são descartados na metade do prazo legal brasileiro.',
      'A destruição precoce em 90 dias impede a reconstrução probatória em incidentes que dependam de investigação civil ou criminal dentro do prazo ordinário previsto no Brasil.',
    ],
    riscoRegulatorio:
      'Descumprimento objetivo de norma imperativa de guarda de registros e frustração de ordens judiciais brasileiras de quebra de sigilo telemático.',
    respostaWikiSite:
      'O Wiki-Site WazzimaGiygg adota expressamente a guarda sigilosa de 180 dias (6 meses) conforme o Artigo 15 do Marco Civil da Internet, protegida sob reserva de jurisdição (Art. 22).',
  },
  {
    id: 'ausencia-dpo-brasil',
    codigoMatriz: 'AUD-02 / Q02',
    risco: 'ALTO',
    titulo: 'Inexistência de Encarregado pelo Tratamento de Dados (DPO) no Brasil',
    baseLegal: [
      'LGPD, Art. 41 (Indicação Obrigatória de Encarregado / DPO)',
      'Resolução CD/ANPD nº 18/2024',
    ],
    fatoIrregularidade:
      'A WMF centraliza sua operação jurídica de privacidade em São Francisco (Califórnia, EUA) com o e-mail genérico privacy@wikimedia.org. Embora tenha nomeado representante formal para o Espaço Econômico Europeu (EEE) e Reino Unido (escritório Bird & Bird), não designou DPO residente nem canal dedicado em língua portuguesa sob jurisdição da ANPD.',
    detalhesTecnicos: [
      'Não há divulgação clara e objetiva no portal em português de DPO formalmente constituído no Brasil.',
      'Falta transparência sobre prazo legal de resposta (15 dias) e omissão sobre o direito do titular de peticionar diretamente à ANPD em caso de recusa.',
    ],
    riscoRegulatorio:
      'Infração formal mais evidente e de simples constatação pela ANPD, sujeita a advertências e multas administrativas por desatendimento estrutural ao Art. 41 da LGPD e à Resolução CD/ANPD nº 18/2024.',
    respostaWikiSite:
      'O Wiki-Site WazzimaGiygg possui Encarregado de Dados (DPO) formalmente identificado em língua portuguesa (Pedro Henrique Cardona Peres — pedrohenriquecardonaperes@gmail.com), Ouvidoria integrada e prazo máximo de 15 dias corridos (Art. 19, II LGPD).',
  },
  {
    id: 'ilusao-vanishing-art18',
    codigoMatriz: 'AUD-04 / Q04',
    risco: 'ALTO',
    titulo: 'Ilusão do "Vanishing", Subordinação do Art. 18 à Licença CC BY-SA e Exceção Indevida',
    baseLegal: [
      'LGPD, Art. 18, III, IV e VI (Eliminação, Anonimização e Bloqueio)',
      'LGPD, Art. 4º, II (Limites da Exceção Jornalística e Acadêmica)',
      'Hierarquia das Normas (Ordem Pública vs. Licença Privada)',
    ],
    fatoIrregularidade:
      'O procedimento comunitário "Wikipedia:Vanishing" apenas renomeia a conta para um identificador numérico genérico, preservando intactos todo o histórico de contribuições, timestamps e assinaturas/menções em páginas de discussão onde frequentemente subsiste o nome civil do usuário.',
    detalhesTecnicos: [
      'A remoção efetiva (Oversight / Suppression) é tratada como exceção subordinada a filtros comunitários internos e à doutrina do "Right to Remember".',
      'Invoca-se a licença livre Creative Commons (CC BY-SA 4.0) e a imutabilidade enciclopédica para tentar afastar um direito potestativo previsto em lei federal de ordem pública.',
      'A exceção do Art. 4º, II da LGPD (fins jornalísticos/acadêmicos) não constitui salvo-conduto para metadados de editores, logs de IP, registros de bloqueio e discussões comunitárias.',
    ],
    riscoRegulatorio:
      'Obstáculo direto e sistemático ao exercício dos direitos fundamentais dos titulares previstos no Art. 18 da LGPD.',
    respostaWikiSite:
      'O NotMediaWiki implementa o Painel de Exclusão LGPD Art. 18 real (em Governança & Ouvidoria), garantindo anonimização efetiva e expurgo real de nome civil e metadados pessoais — nunca uma simples renomeação cosmética.',
  },
  {
    id: 'evasao-jurisdicao-brasil',
    codigoMatriz: 'AUD-03 / Q05',
    risco: 'ALTO',
    titulo: 'Ausência de Representação Legal no Brasil e Dependência de Cartas Rogatórias',
    baseLegal: [
      'Marco Civil da Internet, Art. 11 (Jurisdição Brasileira)',
      'Código de Processo Civil (CPC), Art. 75',
    ],
    fatoIrregularidade:
      'A Wikimedia Foundation não possui CNPJ, filial ou representante legal constituído no Brasil. O capítulo local Wiki Movimento Brasil (WMB) atua como associação autônoma e declara expressamente não possuir poderes de representação legal ou judicial pela fundação norte-americana.',
    detalhesTecnicos: [
      'Para citar formalmente a WMF em ações cíveis ou criminais no Brasil, cidadãos e juízos precisam recorrer a Cartas Rogatórias internacionais via Ministério da Justiça nos EUA.',
      'A morosidade das Cartas Rogatórias torna inócuo o cumprimento ágil de tutelas de urgência e liminares de remoção de dados ou reparação de honra.',
    ],
    riscoRegulatorio:
      'Assimetria processual severa contra cidadãos brasileiros e esvaziamento prático da efetividade jurisdicional prevista no Art. 11 do Marco Civil.',
    respostaWikiSite:
      'O Wiki-Site WazzimaGiygg opera em total submissão à jurisdição brasileira, ao Código de Processo Civil nacional, aos tribunais pátrios e às determinações da ANPD, sem barreiras extraterritoriais.',
  },
  {
    id: 'transferencia-internacional-menores',
    codigoMatriz: 'LGPD Arts. 14 & 33',
    risco: 'MÉDIO a ALTO',
    titulo: 'Transferência Internacional de Dados sem Cláusulas ANPD e Exposição de Menores',
    baseLegal: [
      'LGPD, Art. 33 & Resolução CD/ANPD nº 19/2024',
      'LGPD, Art. 14 & ECA (Lei nº 8.069/1990)',
    ],
    fatoIrregularidade:
      'Os dados pessoais dos usuários brasileiros são transferidos e processados em servidores nos Estados Unidos sem a publicação transparente das cláusulas-padrão ou instrumentos contratuais exigidos pela Resolução CD/ANPD nº 19/2024, somando-se à ausência histórica de verificação etária.',
    detalhesTecnicos: [
      'A Política de Privacidade menciona genericamente o processamento nos EUA sem exibir os mecanismos de adequação ou garantias específicas exigidas pela autoridade brasileira.',
      'Menores de idade puderam editar sem login e sem consentimento específico em destaque dos pais ou responsáveis, mantendo IPs gravados no acervo público.',
    ],
    riscoRegulatorio:
      'Irregularidade na transferência internacional de dados pessoais e vulneração da proteção prioritária garantida a crianças e adolescentes.',
    respostaWikiSite:
      'Transparência documental integral no painel de Regras LGPD e vedação absoluta à exposição pública de IPs ou metadados de rede de menores e leitores.',
  },
  {
    id: 'moderacao-anonima-anomia',
    codigoMatriz: 'AUD-05 / Q07',
    risco: 'MÉDIO a ALTO',
    titulo: 'Moderação por Pseudônimos, Ausência de Supervisão Jurídica e "Zona de Anomia Regulatória"',
    baseLegal: [
      'Constituição Federal, Art. 5º, X (Honra, Imagem e Privacidade)',
      'LGPD, Art. 20 & Art. 4º, II',
      'Marco Civil da Internet, Art. 19 & Temas 533 / 987 STF',
    ],
    fatoIrregularidade:
      'A WMF declara fornecer apenas infraestrutura técnica sem supervisionar decisões editoriais, delegando poder decisório sobre biografias de pessoas vivas, exclusão de artigos, bloqueios e acesso CheckUser a voluntários pseudônimos ou anônimos sem vínculo contratual.',
    detalhesTecnicos: [
      'Pedidos extrajudiciais de cidadãos são escudados no Art. 19 do MCI e redirecionados a filas voluntárias (VRT/OTRS) ou discussões abertas operadas por leigos sem formação jurídica.',
      'Solicitações de remoção ou desindexação são indeferidas com base em conceitos subjetivos ("notoriedade enciclopédica", "Right to Remember") acima dos direitos da personalidade.',
      'Voluntários não têm personalidade jurídica para responder pela infraestrutura, enquanto a WMF recusa representação no Brasil — configurando verdadeira "zona de anomia regulatória".',
    ],
    riscoRegulatorio:
      'Assimetria extrema de custos para o cidadão lesado, que é obrigado a litigar internacionalmente ou aceitar a violação permanente de sua privacidade e reputação.',
    respostaWikiSite:
      'No Wiki-Site WazzimaGiygg há autoria humana identificável, Conselho de Arbitragem transparente, logs imutáveis e Ouvidoria formal com protocolo público e resposta administrativa célere.',
  },
];

export interface CounterPropagandaRow {
  criterio: string;
  baseLegal: string;
  wikipediaWmf: string;
  wikiSiteWzzm: string;
  statusWmf: 'CRÍTICO' | 'IRREGULAR' | 'OMISSO';
}

export const WIKIPEDIA_VS_WIKISITE_COUNTER_MATRIX: CounterPropagandaRow[] = [
  {
    criterio: 'Endereços IP em Históricos Públicos & Data Scraping',
    baseLegal: 'LGPD Arts. 6º, III e 46',
    wikipediaWmf:
      'Décadas de IPs públicos indexados em action=history e logs de abuso; IP Masking só vale para o futuro e deixa o passivo exposto à mineração de dados.',
    wikiSiteWzzm:
      'Nenhum IP público é exposto no histórico de revisões ou discussões; acesso protegido por autenticação e Zero-Trust.',
    statusWmf: 'CRÍTICO',
  },
  {
    criterio: 'Prazo de Guarda de Logs de Acesso',
    baseLegal: 'Marco Civil, Art. 15',
    wikipediaWmf:
      'Expurgo corporativo em 90 dias (3 meses), metade do prazo obrigatório brasileiro, frustrando investigações e ordens judiciais.',
    wikiSiteWzzm:
      'Retenção sigilosa alinhada ao prazo legal brasileiro de 180 dias (6 meses) sob reserva judicial.',
    statusWmf: 'IRREGULAR',
  },
  {
    criterio: 'Encarregado de Dados (DPO) no Brasil',
    baseLegal: 'LGPD Art. 41 & Res. ANPD 18/2024',
    wikipediaWmf:
      'Centralizado na Califórnia (privacy@wikimedia.org); tem representante na UE/Reino Unido (Bird & Bird), mas omite DPO no Brasil.',
    wikiSiteWzzm:
      'DPO brasileiro formalmente identificado no portal (Pedro Henrique Cardona Peres), canal em português e SLA de 15 dias.',
    statusWmf: 'IRREGULAR',
  },
  {
    criterio: 'Direito à Eliminação (Art. 18) vs. "Vanishing"',
    baseLegal: 'LGPD Art. 18, III/IV/VI & Art. 4º, II',
    wikipediaWmf:
      'Política de Vanishing apenas renomeia a conta para código numérico, preservando discussões com nome civil e usando CC BY-SA contra lei federal.',
    wikiSiteWzzm:
      'Painel real de Solicitação de Remoção LGPD Art. 18 no NotMediaWiki e Ouvidoria com exclusão e anonimização efetivas.',
    statusWmf: 'IRREGULAR',
  },
  {
    criterio: 'Representação Legal & Jurisdição Brasileira',
    baseLegal: 'Marco Civil Art. 11 & CPC Art. 75',
    wikipediaWmf:
      'Sem CNPJ, filial ou representante legal no país (WMB não representa a WMF); exige Cartas Rogatórias nos EUA.',
    wikiSiteWzzm:
      'Submissão plena às leis brasileiras, aos tribunais nacionais e às determinações regulatórias da ANPD.',
    statusWmf: 'OMISSO',
  },
  {
    criterio: 'Proteção de Menores & Verificação Etária',
    baseLegal: 'LGPD Art. 14 & ECA',
    wikipediaWmf:
      'Ausência histórica de verificação etária deixou IPs de editores menores de idade gravados permanentemente no histórico público.',
    wikiSiteWzzm:
      'Sem coleta ou publicação de IPs de leitores/menores em histórico aberto; minimização estrita de dados.',
    statusWmf: 'CRÍTICO',
  },
  {
    criterio: 'Moderação, CheckUser & Pedidos Extrajudiciais',
    baseLegal: 'CF Art. 5º X, LGPD Art. 20 & MCI Art. 19',
    wikipediaWmf:
      '"Zona de anomia regulatória": voluntários pseudônimos sem supervisão jurídica e fila VRT/OTRS que rejeita pedidos sob "notoriedade".',
    wikiSiteWzzm:
      'Responsabilidade editorial identificável, protocolo formal de Ouvidoria, direito de resposta e auditoria transparente.',
    statusWmf: 'OMISSO',
  },
];

export const WMF_INVESTIGATION_SOURCES = [
  {
    grupo: 'Legislação Brasileira e Regulamentação ANPD',
    itens: [
      'Lei Geral de Proteção de Dados Pessoais — LGPD (Lei nº 13.709/2018)',
      'Marco Civil da Internet (Lei nº 12.965/2014) e Decreto nº 8.771/2016',
      'Código de Processo Civil — CPC (Lei nº 13.105/2015, Art. 75) e Código Penal',
      'Estatuto da Criança e do Adolescente — ECA (Lei nº 8.069/1990)',
      'Resoluções CD/ANPD nº 18/2024 (DPO) e nº 19/2024 (Transferência Internacional)',
      'STF — Temas 533 e 987 de Repercussão Geral sobre o Marco Civil',
    ],
  },
  {
    grupo: 'Documentos da Wikimedia Foundation e Wikipédia Lusófona Auditados',
    itens: [
      'Wikimedia Foundation Privacy Policy (PT) e Terms of Use',
      'Wikimedia Data Retention Guidelines (política global de expurgo em 90 dias)',
      'MediaWiki Temporary Accounts / Projeto IP Masking (caráter estritamente prospectivo)',
      'Wikimedia Access to Nonpublic Personal Data Policy & Transparency Report',
      'Políticas da pt.wikipedia: WP:Vanishing, WP:Oversight, WP:CheckUser, WP:BLP e WP:VRT (OTRS)',
      'Wiki Movimento Brasil (WMB) — Declaração de ausência de representação legal da WMF',
    ],
  },
];
