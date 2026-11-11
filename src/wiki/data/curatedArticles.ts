import { WikiArticle } from '../types';

export interface CuratedArticleWithHighlights extends WikiArticle {
  highlights: string[];
}

export const CURATED_FEATURED_ARTICLES: CuratedArticleWithHighlights[] = [
  {
    id: 'curated-wikiworldweb-philosophy',
    pageUid: 'geral',
    titulo: 'WikiWorldWeb: A Nova Fronteira da Enciclopédia Livre e Descentralizada',
    categoria: 'Tecnologia & Conhecimento',
    idioma: 'pt',
    autor: 'Conselho Editorial WikiWorldWeb',
    dataCriacao: '2026-01-15T10:00:00Z',
    dataEdicao: '2026-09-20T14:30:00Z',
    visualizacoes: 4892,
    versao: 8,
    tags: ['Software Livre', 'Conhecimento Aberto', 'Transparência', 'SPA'],
    resumo:
      'Uma análise aprofundada sobre a evolução das enciclopédias colaborativas, a superação de oligopólios de moderação burocrática e a implementação de arquiteturas modernas com sincronização em tempo real e privacidade por padrão.',
    descricao: `== Introdução ==
A WikiWorldWeb nasceu como uma resposta direta às contradições acumuladas ao longo de duas décadas de enciclopédias na web. Enquanto os projetos pioneiros democratizaram o acesso à informação, gradualmente se tornaram reféns de burocracias hierarquizadas, assimetrias de poder administrativo e interfaces legadas pesadas.

== Arquitetura Moderna e Desempenho ==
Ao contrário das estruturas clássicas de páginas estáticas recarregadas a cada clique, a WikiWorldWeb foi construída sobre uma Single-Page Application (SPA) ultrarrápida, orientada a micro-estados e persistência no Firebase Firestore. Isso viabiliza:
* Navegação instantânea sem perda de contexto de leitura.
* Suporte nativo a múltiplos temas visuais (incluindo retrô e alto contraste).
* Editor wikitexto com validação em tempo real e visualização lado a lado.
* Proteção robusta contra perseguição de editores e assédio moral.

== Governança Transparente e Sem Censura Arbitrária ==
A transparência não é apenas uma diretriz teórica, mas um compromisso de código. Todos os registros de auditoria, históricos de verificação e deliberações são acessíveis publicamente, garantindo que o conhecimento humano permaneça livre de manipulações seletivas.`,
    highlights: [
      'Arquitetura SPA com tempos de carregamento inferiores a 200ms.',
      'Auditoria de moderação aberta com garantia de due process para todo editor.',
      'Preservação do conhecimento humano livre de anúncios invasivos e rastreadores.',
    ],
  },
  {
    id: 'curated-alexandria-preservation',
    pageUid: 'historia',
    titulo: 'A Biblioteca de Alexandria e a História da Preservação do Saber',
    categoria: 'História & Filosofia',
    idioma: 'pt',
    autor: 'Arquivo Histórico de Alexandria',
    dataCriacao: '2026-02-10T08:00:00Z',
    dataEdicao: '2026-08-14T11:20:00Z',
    visualizacoes: 3740,
    versao: 5,
    tags: ['História', 'Antiguidade', 'Filosofia', 'Preservação Digital'],
    resumo:
      'Da dinastia ptolomaica aos arquivos digitais descentralizados: o épico percurso da humanidade para catalogar a totalidade do saber e as lições contra a perda catastrófica da memória histórica.',
    descricao: `== O Sonho da Biblioteca Universal ==
Fundada no início do século III a.C. sob o reinado de Ptolomeu I Sóter no Egito helenístico, a Biblioteca de Alexandria não era apenas um repositório de rolos de papiro; era o coração pulsante do Mouseion, uma comunidade ativa de filósofos, matemáticos e astrônomos.

== A Fragilidade dos Registros Físicos ==
Os múltiplos episódios de destruição da biblioteca — desde o incêndio acidental na campanha de Júlio César em 48 a.C. até as turbulências posteriores — evidenciaram o perigo fatal da centralização do saber em um único ponto físico.

== Da Pedra ao Byte: A Lição Contemporânea ==
Na era digital, a redundância, o código aberto e o armazenamento distribuído representam a única salvaguarda definitiva contra a perda de patrimônio imaterial. Cada enciclopédia livre é herdeira legítima desse ideal milenar.`,
    highlights: [
      'Mais de 400.000 rolos de papiro catalogados pelo pioneiro Calímaco nos Pinakes.',
      'Sede de descobertas monumentais como a medição da circunferência terrestre por Eratóstenes.',
      'Inspiração fundamental para redes digitais distribuídas e bibliotecas globais de acesso aberto.',
    ],
  },
  {
    id: 'curated-ethics-algorithms',
    pageUid: 'etica-digital',
    titulo: 'Ética Editorial, LGPD e Prevenção de Abusos em Sistemas Colaborativos',
    categoria: 'Direito & Sociedade',
    idioma: 'pt',
    autor: 'Comissão de Conformidade e Direitos Digitais',
    dataCriacao: '2026-03-05T09:15:00Z',
    dataEdicao: '2026-09-12T16:45:00Z',
    visualizacoes: 2980,
    versao: 6,
    tags: ['LGPD', 'Privacidade', 'Ética Editorial', 'Direitos Digitais'],
    resumo:
      'Uma investigação criteriosa sobre os limites legais e éticos das ferramentas de auditoria e CheckUser, o direito fundamental ao esquecimento e as salvaguardas constitucionais de dados pessoais.',
    descricao: `== O Paradoxo da Vigilância nas Plataformas ==
A manutenção da integridade em plataformas colaborativas exige ferramentas contra vandalismo. No entanto, quando privilégios técnicos como o acesso a endereços de IP e dados de rede são operados sem controle externo independente, transformam-se em armas de intimidação.

== Conformidade com a Lei Geral de Proteção de Dados (LGPD) ==
A coleta e o tratamento de identificadores digitais exigem base legal explícita, necessidade estrita, retenção proporcional e respeito inalienável aos direitos do titular. Nenhuma entidade privada ou grupo informal de voluntários está acima do ordenamento jurídico constitucional.

== Princípios de Governança Responsável ==
* Transparência ativa sobre que dados são recolhidos.
* Registro inviolável de qualquer acesso a logs de auditoria.
* Canais formais de apelação e devido processo legal para contas contestadas.`,
    highlights: [
      'Proibição categórica de perseguições orientadas e doxxing em ambientes comunitários.',
      'Auditoria criptográfica com dupla verificação para evitar espionagem de colaboradores.',
      'Garantia do devido processo legal e direito de defesa prévia a qualquer sanção.',
    ],
  },
  {
    id: 'curated-ai-future-knowledge',
    pageUid: 'inteligencia-artificial',
    titulo: 'Inteligência Artificial e a Síntese Epistemológica na Era Pós-Digital',
    categoria: 'Ciência & Tecnologia',
    idioma: 'pt',
    autor: 'Laboratório de Epistemologia Computacional',
    dataCriacao: '2026-04-12T13:00:00Z',
    dataEdicao: '2026-09-18T18:10:00Z',
    visualizacoes: 4120,
    versao: 7,
    tags: ['Inteligência Artificial', 'LLM', 'Epistemologia', 'Ciência'],
    resumo:
      'Como redes neurais e grandes modelos de linguagem estão transformando a pesquisa enciclopédica, os riscos da alucinação de fontes e a insubstituível centralidade do discernimento crítico humano.',
    descricao: `== A Nova Revolução na Curadoria da Informação ==
A convergência entre aprendizado profundo e bases de conhecimento estruturadas permite sumarizar debates seculares em segundos. No entanto, velocidade de processamento não equivale à verificação de veracidade factual.

== O Desafio da Alucinação Sintética ==
Modelos generativos produzem textos de alta fluência sintática que podem conter falsificações sutis de citações acadêmicas e eventos históricos. Por isso, a arquitetura moderna de enciclopédias exige anotação rigorosa de fontes primárias e verificação humana constante.

== Simbiose Humano-Máquina no Conhecimento ==
O futuro da enciclopédia livre reside na cooperação: a máquina como amplificadora de catalogação e indexação, e a comunidade de leitores e editores humanos como garantidora da ética, do rigor e da sensibilidade contextual.`,
    highlights: [
      'Modelos de linguagem como copilotos de pesquisa, nunca como árbitros finais da verdade.',
      'Exigência de rastreabilidade integral para referências bibliográficas.',
      'Defesa intransigente do pensamento crítico e da pluralidade de perspectivas.',
    ],
  },
  {
    id: 'curated-european-data-laws',
    pageUid: 'direito-europeu',
    titulo: 'Leis Europeias de Dados: Do GDPR ao AI Act e o Impacto do Efeito Bruxelas',
    categoria: 'Direito & Governança Digital',
    idioma: 'pt',
    autor: 'Cátedra de Direito Digital e Regulação Europeia',
    dataCriacao: '2026-05-18T10:00:00Z',
    dataEdicao: '2026-09-22T17:40:00Z',
    visualizacoes: 5240,
    versao: 9,
    tags: ['GDPR', 'DSA', 'DMA', 'AI Act', 'União Europeia', 'Privacidade', 'Efeito Bruxelas'],
    resumo:
      'Uma análise sistemática sobre a vanguarda regulatória da União Europeia: os princípios do GDPR, a transparência algorítmica do DSA, a contenção de monopólios pelo DMA e o pioneiro Regulamento de Inteligência Artificial (EU AI Act).',
    descricao: `== O Paradigma Regulatório da União Europeia e o Efeito Bruxelas ==
A União Europeia consolidou-se como a principal potência regulatória do ecossistema digital global. Através do fenômeno conhecido na ciência jurídica e nas relações internacionais como o '''Efeito Bruxelas''' (''Brussels Effect''), formulado pela jurista Anu Bradford, as normas concebidas pela Comissão Europeia e pelo Parlamento Europeu transbordam as fronteiras do bloco e tornam-se, na prática, o padrão ouro mandatório mundial. Empresas multinacionais e desenvolvedores preferem unificar suas arquiteturas de software no nível mais elevado de proteção e conformidade a criar sistemas fragmentados para cada jurisdição.

== 1. O Regulamento Geral de Proteção de Dados (GDPR - Reg. UE 2016/679) ==
Em vigor desde maio de 2018, o GDPR substituiu a antiga Diretiva 95/46/CE e erigiu a proteção de dados pessoais à condição de direito fundamental subjetivo (Artigo 8º da Carta dos Direitos Fundamentais da UE).
* '''Princípios Basilares (Art. 5º):''' Licitude, lealdade e transparência; limitação das finalidades; minimização de dados; exatidão; limitação da conservação; integridade e confidencialidade; e responsabilidade demonstrada (''accountability'').
* '''Catálogo de Direitos dos Titulares:''' Acesso (Art. 15), retificação (Art. 16), apagamento ou "direito ao esquecimento" (Art. 17), limitação do tratamento (Art. 18), portabilidade de dados (Art. 20) e garantia de não submissão a decisões exclusivamente automatizadas ou profiling (Art. 22).
* '''Transferência Internacional e Sanções:''' Exigência de cláusulas contratuais-padrão (SCCs) e salvaguardas robustas para saídas de dados do bloco, sob pena de multas de até 20 milhões de euros ou 4% do faturamento global da corporação infratora. Inspirou diretamente a LGPD brasileira (Lei nº 13.709/2018).

== 2. O Digital Services Act (DSA - Regulamento UE 2022/2065) ==
O Regulamento dos Serviços Digitais modernizou a governança de intermediários e plataformas de internet, focando na integridade informacional e na proteção do usuário contra abusos corporativos.
* '''Due Process e Fim dos "Dark Patterns":''' Proibição terminante de interfaces manipulativas (dark patterns) projetadas para enganar o usuário ou viciar seu consentimento.
* '''Responsabilidade das VLOPs:''' Plataformas online muito grandes (VLOPs, com mais de 45 milhões de usuários na UE) devem submeter seus algoritmos a auditorias independentes anuais e avaliar riscos sistêmicos à saúde mental, processos eleitorais e segurança de crianças.
* '''Proteção a Crianças e Categorias Sensíveis:''' Banimento total de publicidade direcionada com base em dados sensíveis (crença religiosa, saúde, orientação sexual) e proibição absoluta de perfis publicitários rastreados direcionados a menores de idade.
* '''Notice and Action Equilibrado:''' Notificação formal com dever de resposta fundamentada e direito irrestrito de apelação quando conteúdos de usuários sofrem moderação ou bloqueio.

== 3. O Digital Markets Act (DMA - Regulamento UE 2022/1925) ==
Focado na dimensão econômica e concorrencial, o Regulamento dos Mercados Digitais coíbe condutas predatórias dos chamados '''"Gatekeepers"''' (guardiões de acesso econômico).
* Proibição de autofavorecimento (''self-preferencing'') de produtos e serviços próprios das Big Techs em seus sistemas operacionais e motores de busca.
* Veto ao cruzamento ou combinação de dados pessoais entre serviços distintos pertencentes ao mesmo ecossistema sem consentimento expresso e autônomo do usuário.
* Interoperabilidade obrigatória para mensageria instantânea e portabilidade contínua de dados em tempo real.

== 4. O EU AI Act (Regulamento de Inteligência Artificial - Reg. UE 2024/1689) ==
A primeira legislação abrangente para Inteligência Artificial no planeta, adotando uma abordagem baseada em pirâmide de risco:
# '''Risco Inaceitável (Proibido):''' Pontuação social governamental (social scoring), manipulação cognitiva de populações vulneráveis e vigilância biométrica em massa em tempo real em espaços públicos.
# '''Alto Risco:''' Sistemas de IA aplicados a infraestruturas críticas, recrutamento e RH, educação e avaliação de crédito. Exigem governança estrita de datasets de treino, mitigação de viés discriminatório, rastreabilidade técnica e supervisão humana obrigatória.
# '''Risco Específico de Transparência:''' Modelos generativos (LLMs, geradores de imagem/áudio) devem aplicar marcas d'água digitais indeléveis contra deepfakes e publicar resumos pormenorizados de obras protegidas por direitos autorais utilizadas no treinamento.
# '''Risco Mínimo:''' Aplicações corriqueiras como filtros de spam, sem restrições regulatórias pesadas.

== 5. A Importância Civilizatória das Leis Europeias ==
Em um mundo dominado pela extração desregulada de dados pessoais ("capitalismo de vigilância"), a legislação europeia redefine a tecnologia como instrumento a serviço da dignidade humana, da autodeterminação informacional e do Estado Democrático de Direito.`,
    highlights: [
      'O "Efeito Bruxelas" estabelece o padrão regulatório que orienta legislações pelo mundo inteiro.',
      'O GDPR tutela a privacidade como direito humano fundamental e não mera mercadoria transacional.',
      'O DSA e o EU AI Act impõem transparência algorítmica, due process e salvaguardas a crianças.',
    ],
  },
  {
    id: 'curated-international-free-expression',
    pageUid: 'direitos-humanos',
    titulo: 'Direito Internacional e a Salvaguarda da Liberdade de Expressão',
    categoria: 'Direito Internacional & Direitos Humanos',
    idioma: 'pt',
    autor: 'Núcleo Internacional de Direitos Humanos e Liberdades Fundamentais',
    dataCriacao: '2026-06-01T09:00:00Z',
    dataEdicao: '2026-09-24T12:00:00Z',
    visualizacoes: 4780,
    versao: 7,
    tags: ['Liberdade de Expressão', 'DUDH', 'PIDCP', 'Pacto de San José', 'Artigo 19', 'Direitos Humanos', 'Censura'],
    resumo:
      'Uma exploração profunda dos marcos jurídicos universais que consagram a livre manifestação do pensamento: a Declaração Universal dos Direitos Humanos, o Pacto Internacional sobre os Direitos Civis e Políticos e a Convenção Americana, além da harmonia essencial com a proteção de dados.',
    descricao: `== A Liberdade de Expressão como Pilar da Dignidade Humana ==
A liberdade de pensamento, consciência e expressão não é uma concessão do Estado, mas um direito inato e inalienável de toda a humanidade. No pós-Segunda Guerra Mundial, a comunidade internacional erigiu tratados multilaterais para assegurar que nenhum poder político pudesse suprimir o direito das pessoas de pensar, debater, criar e receber informações de forma livre e plural.

== 1. A Declaração Universal dos Direitos Humanos (DUDH - 1948): Artigo 19 ==
Adotada pela Assembleia Geral da ONU em Paris, a DUDH consagrou no Artigo 19 o princípio norteador das liberdades civis modernas:
<blockquote>"Todo ser humano tem direito à liberdade de opinião e expressão; este direito inclui a liberdade de, sem interferência, ter opiniões e de procurar, receber e transmitir informações e ideias por quaisquer meios e independentemente de fronteiras."</blockquote>
* '''Sem interferência:''' O foro íntimo da convicção pessoal é inviolável. Ninguém pode ser punido por suas opiniões íntimas.
* '''Independentemente de fronteiras:''' A circulação de informações e do saber científico transcende barreiras geográficas, sendo o fundamento moral de toda rede hipertextual livre.

== 2. O Pacto Internacional sobre os Direitos Civis e Políticos (PIDCP / ONU 1966) ==
Tratado vinculante de direito internacional ratificado por mais de 170 nações, o PIDCP detalhou em seu Artigo 19 os contornos operativos da liberdade comunicacional:
* '''Parágrafo 1:''' Direito inegociável de sustentar opiniões sem discriminação.
* '''Parágrafo 2:''' Liberdade abrangente de procurar, receber e difundir informações e ideias de qualquer espécie, seja por palavra falada, escrita, impressa, sob forma artística ou por qualquer outro processo de sua escolha.
* '''Parágrafo 3 - O Teste Tripartite de Restrições Legítimas:''' Qualquer limitação imposta por um Estado deve cumprir rigorosa e cumulativamente:
#* '''Legalidade Estrita:''' Prevista expressamente em lei formal prévia, clara, precisa e acessível a todos os cidadãos (vedadas ordens discricionárias obscuras).
#* '''Finalidade Legítima:''' Vocacionada exclusivamente a salvaguardar o respeito aos direitos e à reputação de outrem, ou à defesa da segurança nacional, da ordem pública, da saúde ou moral públicas.
#* '''Necessidade e Proporcionalidade:''' Demonstrar ser estritamente indispensável em uma sociedade democrática e consistir no instrumento menos gravoso possível.

== 3. Comentário Geral nº 34 do Comitê de Direitos Humanos da ONU ==
O documento autoritativo CCPR/C/GC/34 estabeleceu a aplicação plena do Artigo 19 ao ambiente digital:
* Veda o bloqueio genérico de websites, redes sociais ou enciclopédias digitais.
* Protege jornalistas investigativos, ativistas, whistleblowers e cidadãos editores contra perseguições judiciais abusivas (SLAPPs).
* Reforça que a discussão de figuras públicas e governantes deve ser mais tolerante ao escrutínio e à crítica contundente.

== 4. O Pacto de San José da Costa Rica (CADH - 1969): Artigo 13 ==
No âmbito do Sistema Interamericano de Direitos Humanos, a Convenção Americana é reconhecida por sua proteção inflexível:
* '''Vedação Absoluta à Censura Prévia (Art. 13.2):''' Nenhuma autoridade pública ou órgão de moderação pode instituir filtros prévios autoritários. A manifestação é livre; eventuais abusos comprovados respondem exclusivamente por responsabilidades ulteriores delimitadas pela lei penal e civil.
* '''Proibição de Meios Indiretos de Cerceamento (Art. 13.3):''' Veda o abuso de monopólios estatais ou corporativos para restringir a comunicação.
* '''Dimensão Dupla:''' A Corte Interamericana (Corte IDH) firmou que a liberdade de expressão possui dimensão individual (expressar-se) e social (o direito de toda a sociedade de ser informada por fontes diversas).

== 5. A Convivência Harmoniosa entre Liberdade de Expressão e Proteção de Dados ==
Existe uma relação de profunda simbiose entre privacidade e liberdade de expressão:
* A privacidade, a criptografia e o sigilo de metadados são o '''escudo indispensável''' da própria liberdade de expressão. Sem a certeza de que não está sendo monitorado ou vigiado em massa, o cidadão pratica a autocensura.
* Por outro lado, a proteção de dados não pode ser instrumentalizada por fraudadores ou figuras corruptas como artifício para censurar reportagens históricas e verbetes enciclopédicos verídicos de manifesto interesse coletivo.
* Essa ponderação equilibrada é o compromisso ético central da WikiWorldWeb.`,
    highlights: [
      'O Artigo 19 da DUDH e do PIDCP garante o direito universal de buscar e difundir conhecimento.',
      'O Teste Tripartite da ONU proíbe que governos e monopólios imponham censuras discricionárias.',
      'A privacidade é o escudo que viabiliza a livre expressão sem temor à perseguição política.',
    ],
  },
  {
    id: 'curated-wazzimagiygg-biography',
    pageUid: 'biografias',
    titulo: 'WazzimaGiygg',
    categoria: 'Biografias & Tecnologia',
    idioma: 'pt',
    autor: 'Conselho Editorial e Histórico WikiWorldWeb',
    dataCriacao: '2026-01-20T10:00:00Z',
    dataEdicao: '2026-09-27T18:00:00Z',
    visualizacoes: 7850,
    versao: 12,
    tags: [
      'WazzimaGiygg',
      'Pedro Henrique Cardona Peres',
      'WikiWorldWeb',
      'Software Livre',
      'Caso Chronus',
      'LGPD',
      'Marco Civil',
      'UCoC',
      'Dossiê A Verdade',
      'Linha do Tempo',
      'Fatos Cronológicos',
    ],
    resumo:
      'Biografia e legado de Pedro Henrique Cardona Peres (WazzimaGiygg), desenvolvedor de software, pesquisador e idealizador da WikiWorldWeb. Suas contribuições tecnológicas para a internet aberta, a documentação factual das perseguições e calúnias praticadas pelo administrador Chronus na Wikipédia e a linha do tempo cronológica do dossiê A Verdade.',
    descricao: `'''WazzimaGiygg''' (nome civil: '''Pedro Henrique Cardona Peres''') é um desenvolvedor de software brasileiro, pesquisador independente, ativista dos direitos digitais e idealizador da '''WikiWorldWeb''' (projeto ''Wiki-alternative''). Ficou amplamente reconhecido no ecossistema lusófono pela defesa intransigente da descentralização do conhecimento enciclopédico, pelo desenvolvimento de interfaces modernas de código aberto e pela denúncia documentada das falhas estruturais, perseguições e crimes contra a honra praticados por administradores da Wikipédia em língua portuguesa, em especial o moderador conhecido pela alcunha '''Chronus'''.

É também o autor do histórico dossiê documental ''"A Verdade"'' (<nowiki>wazzimagiygg.com/averdade/</nowiki>), da representação técnico-jurídica de 47 páginas ''"Calúnia por parte de Chronus V2"'' e da apresentação executiva institucional ''"Wikimedia Institutional Accountability Dossier"''.

== 1. O que Fez de Melhor na Internet: Conquistas e Realizações Tecnológicas ==
Ao longo de sua trajetória na web, WazzimaGiygg notabilizou-se por transformar inconformismo contra burocracias opacas em soluções tecnológicas produtivas e abertas:

=== A. Arquitetura e Fundação da WikiWorldWeb (Wiki-alternative) ===
Diante da obsolescência das plataformas enciclopédicas tradicionais — lentas, pesadas, saturadas de anúncios publicitários e controladas por oligarquias informais de moderadores —, concebeu a '''WikiWorldWeb''':
* '''Desempenho Instantâneo (SPA):''' Construída como Single-Page Application (SPA) ultrarrápida em React e TypeScript, garantindo carregamentos de artigos em menos de 200 milissegundos e eliminando os travamentos típicos do MediaWiki legado.
* '''Motor de Temas Históricos e Modernos:''' Desenvolveu um sistema de personalização estética sem paralelos na web, com 17 temas completos emulando fielmente sistemas operacionais clássicos (Windows 10 com ProgressRing fluido, Windows 7 Aero Glass com sons autênticos sintetizados via Web Audio API, Windows XP Luna, Windows 95, Windows 3.1, Retro Terminal, Google Material e temas de alto contraste).
* '''Acesso Universal Offline e Modo Smart TV (10-Foot UI):''' Implementou suporte nativo a Progressive Web App (PWA) para funcionamento offline total em celulares Android e computadores, além de uma interface exclusiva otimizada para televisores inteligentes (compatível com Samsung Tizen, LG webOS, Android TV e Fire TV) com navegação completa por controle remoto e síntese de voz.
* '''Editor Wikitexto com Validação em Tempo Real:''' Ambiente de edição lado a lado com preview imediato, sanitização estrita contra scripts maliciosos (XSS) e cálculo de score de qualidade de conteúdo.

=== B. Ecossistema Digital Integrado (wazzimagiygg.com) ===
Estruturou um ecossistema independente e ético:
* '''Portal Central (wazzimagiygg.com):''' Ponto focal de projetos, transparência institucional e manifestos de software livre.
* '''Central de Atendimento e Suporte (support.wazzimagiygg.com):''' Plataforma profissional de abertura de tickets de ajuda técnica, recursos e canal oficial de Encarregado pelo Tratamento de Dados (DPO) sob a LGPD e GDPR, viabilizando o exercício seguro dos direitos do titular sem exposição vexatória.
* '''Jornal WazzimaGiygg (jornal.wazzimagiygg.com):''' Portal de notícias e investigações jornalísticas independentes cobrindo tecnologia, política, geopolítica e direitos fundamentais, com integração nativa de leitura hipertextual.
* '''Código Aberto no GitHub (WazzimaGiygg/Wiki-alternative):''' Todo o código-fonte disponibilizado sob a licença pública '''GNU General Public License v3.0 (GPLv3)''', garantindo liberdade de estudo, modificação e redistribuição para a humanidade.

=== C. A Frase Principal e o Ideal Epistemológico ===
No cabeçalho de suas plataformas figura a célebre divisa em grego helênico:
<blockquote>«Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»<br />
''("Não, o Tempo não é o senhor do conhecimento!")''</blockquote>
A frase simboliza a recusa filosófica em aceitar que a tirania de burocratas efêmeros possa suprimir a verdade factual e a perenidade do saber humano.

== 2. O Caso Wikipédia e as Calúnias Praticadas por Chronus ==
A trajetória de WazzimaGiygg é igualmente marcada pela corajosa exposição das patologias de poder na Wikipédia Lusófona. O episódio conhecido como "Caso Wazzimagiygg" e "Caso Chronus" tornou-se um dos estudos de caso mais emblemáticos sobre assédio moral corporativo, instrumentalização técnica de privilégios e violações jurídicas em plataformas digitais.

=== A. Origem: Divergência Editorial e Rejeição a Fontes Acadêmicas ===
A perseguição teve início em divergências editoriais legítimas. WazzimaGiygg inseriu correções factuais respaldadas por bibliografia acadêmica idônea e fontes primárias confiáveis. Em resposta, o moderador Chronus — habituado a exercer controle autocrático sobre verbetes de seu interesse particular — desqualificou sumariamente as fontes sem qualquer contra-argumentação científica, adotando postura hostil e zombeteira.

=== B. Falsa Imputação de Crimes e Fraude de CheckUser (Calúnia e Difamação) ===
Para justificar o silenciamento definitivo do editor, Chronus e operadores aliados engendraram a acusação infundada de uso de "contas fantoches" (''sockpuppetry''):
* '''Imputação sem Provas Técnicas:''' Sem qualquer laudo pericial ou correlação idônea de logs, atribuíram a WazzimaGiygg múltiplos acessos anônimos e faixas inteiras de endereços de IP pertencentes a Provedores de Acesso comercial (ASNs da Vivo, Claro e TIM).
* '''Enquadramento Penal Brasileiro:''' A falsa imputação pública de conduta fraudulenta tipifica os crimes de '''Calúnia''' (Art. 138 do Código Penal), '''Difamação''' (Art. 139 CP) e '''Injúria''' (Art. 140 CP), agravados pela majorante do Art. 141, III do CP (utilização da internet para amplificação do alcance do ultraje à honra e à imagem profissional).

=== C. Prática Continuada de Cyberstalking (Art. 147-A do Código Penal) ===
O administrador Chronus passou a monitorar obsessivamente a atividade do pesquisador, promovendo o cancelamento e a destruição indiscriminada de suas contribuições úteis:
* Reversões em lote (''rollback'') automatizadas de dezenas de edições legítimas e referenciadas em questão de segundos, sem sequer ler o teor das modificações.
* Bloqueio infinito decretado de forma sumária, sem prévio aviso, seguido pelo trancamento da própria página de discussão do usuário (''Talk Page''), impedindo qualquer petição de desbloqueio ou recurso ao contraditório.
* Aplicação de bloqueios de faixa (''rangeblocks'') /16 arbitrários, que atingiram centenas de milhares de internautas inocentes que utilizavam os mesmos provedores de internet no Brasil.

=== D. Quebra de Sigilo Telemático e Violação da LGPD e Marco Civil ===
Ao conduzir os procedimentos de perseguição, a Wikipédia expôs publicamente metadados técnicos de conexão do pesquisador:
* O endereço IP de conexão e dados telemáticos de navegação foram gravados em páginas públicas permanentes e indexadas em motores de busca globais, sujeitando o titular a perseguições e tentativas de ''doxxing''.
* Essa prática constitui infração direta aos '''Artigos 10 e 15 do Marco Civil da Internet (Lei nº 12.965/2014)''' (que impõem sigilo absoluto aos registros de conexão, fornecíveis exclusivamente sob ordem judicial específica) e aos '''Artigos 11, 14 e 18 da LGPD (Lei nº 13.709/2018)'''.

=== E. Violações Graves ao Código Universal de Conduta da Wikimedia (UCoC) ===
A conduta do administrador Chronus violou expressamente as diretrizes éticas obrigatórias da Wikimedia Foundation:
* '''Seção 3.1 (Respeito Mútuo) e Seção 3.2 (Assédio/Harassment):''' Prática contumaz de intimidação, sarcasmo e perseguição contra editores dissidentes.
* '''Seção 3.3 (Abuso de Privilégios Administrativos):''' Utilização do botão de bloqueio e do estatuto de burocrata como escudo de imunidade pessoal e arma de intimidação.
* '''Quebra de Sigilo de Whistleblower:''' Denúncias formais e confidenciais remetidas por WazzimaGiygg à equipe de ''Trust & Safety'' da WMF em São Francisco foram vazadas e repassadas aos próprios moderadores locais investigados, gerando retaliações imediatas contra o denunciante.
* '''Violação do Digital Services Act (DSA - Regulamento UE 2022/2065):''' Desrespeito ao dever de motivação formal (Art. 17) e inexistência de canais internos eficazes de contestação (Art. 20).

== 3. O Efeito Streisand e os Três Dossiês Oficiais ==
Em vez de sucumbir à intimidação, Pedro Henrique Cardona Peres aplicou o rigor investigativo para catalogar e eternizar as provas dos abusos cometidos pela Wikipédia Lusófona:
# '''Dossiê "A Verdade" (wazzimagiygg.com/averdade/):''' Relato cronológico e factual com reprodução de telas, transcrições de debates e desmonte ponto a ponto das falsas alegações comunitárias.
# '''Dossiê Técnico-Jurídico: Calúnia por parte de Chronus V2 (47 Páginas):''' Peça técnico-jurídica pormenorizada com a tipificação dos ilícitos civis e criminais perante a legislação brasileira (Código Penal, Marco Civil e LGPD).
# '''Wikimedia Institutional Accountability Dossier (15 Slides):''' Apresentação institucional executiva demonstrando as falhas sistêmicas de governança da Wikimedia Foundation Inc. e a cumplicidade corporativa na manutenção de moderadores abusivos.

=== Cronologia dos Fatos do Dossiê "A Verdade" ===
A reconstituição dos 9 marcos factuais — desde a divergência acadêmica inicial ao nascimento da WikiWorldWeb e ao lema em grego clássico — pode ser explorada interativamente no componente de '''Linha do Tempo Visual''' integrado diretamente a esta biografia enciclopédica, com filtragem por temas e acesso imediato aos autos dos dossiês.

A tentativa de Chronus e da panela administrativa de censurar WazzimaGiygg culminou no clássico '''Efeito Streisand''': amplificou exponencialmente a visibilidade das infrações da Wikipédia e acelerou o desenvolvimento da WikiWorldWeb como projeto alternativo internacional.

== 4. Legado e Significado para a Cultura Livre ==
WazzimaGiygg provou que o modelo da Wikipédia tradicional — fundado na concentração autoritária de poderes, no desprezo à legislação civil e criminal e no dogmatismo burocrático — pode ser superado por alternativas de código aberto pautadas pela transparência, pelo devido processo legal (*due process*) e pela soberania informacional. Sua obra permanece como marco de resistência intelectual e inovação técnica em favor da democratização real do conhecimento na internet.`,
    highlights: [
      'Criador e arquiteto da WikiWorldWeb, com tecnologia SPA ultrarrápida, 17 temas e modo offline.',
      'Fundador do ecossistema wazzimagiygg.com, com suporte técnico profissional e canal de DPO sob a LGPD.',
      'Autor dos dossiês de auditoria que desmascararam as calúnias e abusos praticados por Chronus na Wikipédia.',
      'Disponibilização da Linha do Tempo Visual interativa com os 9 marcos cronológicos do dossiê A Verdade.',
    ],
  },
];
