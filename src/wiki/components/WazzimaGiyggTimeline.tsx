import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Gavel,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Check,
  Copy,
  Download,
  BookOpen,
  Radio,
  EyeOff,
  UserX,
  Presentation,
  CheckCircle2,
  Lock,
  ArrowRight,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { formatExternalUrl } from '../utils/linkUtils';
import { DossierDocType } from './IrregularidadesDossierModal';

export interface TimelineEvent {
  id: string;
  stepNumber: number;
  phase: string;
  period: string;
  title: string;
  subtitle: string;
  category: 'origem' | 'abuso' | 'crime' | 'violacao' | 'dossie' | 'vitoria';
  categoryLabel: string;
  categoryColor: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    glow: string;
  };
  iconName: 'book' | 'alert' | 'ban' | 'scale' | 'eye-off' | 'shield' | 'file' | 'sparkles' | 'gavel';
  facts: string[];
  keyQuote?: string;
  legalArticles: string[];
  evidenceSummary: string[];
  dossierDocument: DossierDocType;
  dossierPageOrSlide?: string;
  impactLevel: 'Alto' | 'Gravíssimo' | 'Institucional' | 'Inovador' | 'Histórico';
}

export const DOSSIER_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'fase-1-origem-editorial',
    stepNumber: 1,
    phase: 'Fase 1 • Origem do Conflito',
    period: 'Início das Contribuições',
    title: 'Contribuições Científicas e Divergência Editorial Legítima',
    subtitle: 'Rigor acadêmico confronta o controle feudal de artigos na Wikipédia',
    category: 'origem',
    categoryLabel: 'Origem Editorial',
    categoryColor: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200',
      glow: 'shadow-blue-500/20',
    },
    iconName: 'book',
    facts: [
      'Pedro Henrique Cardona Peres (WazzimaGiygg) inseriu correções bibliográficas e factuais devidamente respaldadas por literatura acadêmica e fontes primárias idôneas.',
      'As edições respeitavam rigorosamente os pilares formais da enciclopédia (WP:FF — Fontes Fiáveis, WP:V — Verificabilidade e WP:NPOV — Ponto de Vista Neutro).',
      'O administrador Chronus, habituado a exercer tutela autocrática sobre verbetes de sua preferência pessoal, desqualificou sumariamente as fontes sem qualquer contraposição técnica ou dialógica.',
    ],
    keyQuote:
      '«A discordância editorial legítima, amparada no método científico, foi tratada pela moderação não como colaboração, mas como uma afronta à autoridade monocrática do burocrata.»',
    legalArticles: ['WP:FF (Fontes Fiáveis)', 'WP:NPOV (Imparcialidade)', 'Art. 5º, IX da CF/88 (Liberdade Científica)'],
    evidenceSummary: [
      'Diffs originais com fontes acadêmicas e teses rejeitadas sem leitura.',
      'Sumários de edição depreciativos inseridos pelo administrador Chronus.',
    ],
    dossierDocument: 'apresentacao',
    dossierPageOrSlide: 'Slide 4 & Relatório A Verdade § 1',
    impactLevel: 'Alto',
  },
  {
    id: 'fase-2-hostilidade-reversao',
    stepNumber: 2,
    phase: 'Fase 2 • Hostilização e Abuso',
    period: 'Escalada da Intimidação',
    title: 'Ataques Pessoais e Reversões em Massa Automatizadas (Rollback)',
    subtitle: 'Destruição indiscriminada de conteúdo com 1 clique e deboche público',
    category: 'abuso',
    categoryLabel: 'Abuso Moderativo',
    categoryColor: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200',
      glow: 'shadow-amber-500/20',
    },
    iconName: 'alert',
    facts: [
      'Chronus iniciou uso desmedido da ferramenta de "Rollback" (reversão rápida de vandalismo evidente), aplicando-a indevidamente contra edições dissertativas legítimas.',
      'Em questão de segundos, dezenas de parágrafos fundamentados foram eliminados sem análise prévia de conteúdo.',
      'Prática contumaz de sarcasmo e rotulação depreciativa em espaços de discussão comunitária, violando frontalmente WP:CIV (Conduta Civil) e WP:NPA (Não Faça Ataques Pessoais).',
    ],
    keyQuote:
      '«O privilégio técnico do botão de reversão rápida foi subvertido em arma de guerra contra qualquer editor que recusasse a subserviência.»',
    legalArticles: ['WP:NPA (Proibição de Ataques Pessoais)', 'WP:CIV (Civilidade)', 'UCoC Seção 3.1 (Respeito Mútuo)'],
    evidenceSummary: [
      'Histórico de reversões em cascata efetuadas em intervalos de menos de 15 segundos.',
      'Exposição de posturas irônicas e desqualificadoras em páginas de discussão.',
    ],
    dossierDocument: 'chronus',
    dossierPageOrSlide: 'Páginas 8-14 (Dossiê 47 Páginas)',
    impactLevel: 'Alto',
  },
  {
    id: 'fase-3-calunia-checkuser',
    stepNumber: 3,
    phase: 'Fase 3 • Imputação Criminosa',
    period: 'Fabricação do Pedido de Verificação',
    title: 'Fraude de CheckUser e Falsa Acusação de "Contas Fantoches"',
    subtitle: 'Abertura do caso difamatório "Wikipédia:Pedidos a verificadores/Caso/Wazzimagiygg"',
    category: 'crime',
    categoryLabel: 'Crimes Contra a Honra',
    categoryColor: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200',
      glow: 'shadow-rose-500/20',
    },
    iconName: 'ban',
    facts: [
      'Chronus e burocratas aliados criaram uma falsa narrativa de fraude sistemática, abrindo processo público acusando WazzimaGiygg de controlar múltiplas contas (sockpuppetry).',
      'Inexistência de qualquer laudo pericial: atribuíram ao pesquisador IPs dinâmicos e redes compartilhadas pertencentes aos principais provedores de internet do Brasil (Vivo, TIM, Claro).',
      'A imputação pública de falsidade ideológica e conduta ilícita consumou os crimes de Calúnia (Art. 138 CP), Difamação (Art. 139 CP) e Injúria (Art. 140 CP), com o agravante do Art. 141, III (meio que facilita ampla divulgação digital).',
    ],
    keyQuote:
      '«Sem um único log criptográfico ou laudo técnico idôneo, atribuiu-se a um pesquisador independente a titularidade de conexões aleatórias de milhões de clientes de telecomunicações brasileiras.»',
    legalArticles: [
      'Art. 138 do Código Penal (Calúnia)',
      'Art. 139 do Código Penal (Difamação)',
      'Art. 140 c/c 141, III do CP (Injúria Agravada na Web)',
    ],
    evidenceSummary: [
      'Cópia forense da página pública "Pedidos a verificadores/Caso/Wazzimagiygg".',
      'Ausência deliberada de relatório técnico e correlação probabilística de portas lógicas.',
    ],
    dossierDocument: 'chronus',
    dossierPageOrSlide: 'Páginas 15-28 (Dossiê Técnico-Jurídico V2)',
    impactLevel: 'Gravíssimo',
  },
  {
    id: 'fase-4-bloqueio-supressao-defesa',
    stepNumber: 4,
    phase: 'Fase 4 • Supressão do Devido Processo',
    period: 'Julgamento Sumário & Repressão',
    title: 'Bloqueio Perpétuo e Trancamento Imediato da Página de Discussão',
    subtitle: 'Negação absoluta do contraditório e aplicação de Rangeblocks abusivos',
    category: 'violacao',
    categoryLabel: 'Violação ao Devido Processo',
    categoryColor: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200',
      glow: 'shadow-red-500/20',
    },
    iconName: 'gavel',
    facts: [
      'Em menos de 10 minutos após o requerimento unilateral, o moderador Chronus aplicou bloqueio infinito contra a conta de WazzimaGiygg sem notificação prévia.',
      'Para aniquilar qualquer capacidade de defesa, a própria página de discussão pessoal do usuário (Talk Page) foi trancada e o envio de e-mails bloqueado.',
      'Rangeblocks arbitrários de máscara /16 foram decretados em ASNs comerciais de internet residencial, impedindo o acesso de milhares de internautas terceiros que nada tinham com a questão.',
      'Violação ostensiva às garantias pétreas da Constituição Federal (Art. 5º, LIV e LV — Devido Processo Legal, Contraditório e Ampla Defesa).',
    ],
    keyQuote:
      '«Na Wikipédia de Chronus, o acusador atuou como promotor, juiz e carrasco. O réu teve a boca amordaçada antes mesmo de ler a sentença do tribunal de exceção.»',
    legalArticles: [
      'Art. 5º, LIV da CF/88 (Devido Processo Legal)',
      'Art. 5º, LV da CF/88 (Contraditório e Ampla Defesa)',
      'Art. 17 do Digital Services Act (EU DSA — Dever de Motivação)',
    ],
    evidenceSummary: [
      'Registro do log de bloqueio com tempo de resposta sumário de minutos.',
      'Página de discussão protegida contra edição pelo próprio punido.',
      'Relatório de faixas de IP de provedores residenciais bloqueadas em cascata.',
    ],
    dossierDocument: 'apresentacao',
    dossierPageOrSlide: 'Slide 7 (Supressão do Devido Processo Legal)',
    impactLevel: 'Gravíssimo',
  },
  {
    id: 'fase-5-cyberstalking-lgpd',
    stepNumber: 5,
    phase: 'Fase 5 • Stalking e Quebra de Privacidade',
    period: 'Vigilância Contínua & Doxxing',
    title: 'Cyberstalking (Art. 147-A CP) e Exposição Ilegal de IPs sob a LGPD',
    subtitle: 'Quebra de sigilo telemático e perseguição contra o pesquisador',
    category: 'violacao',
    categoryLabel: 'Violação LGPD & Marco Civil',
    categoryColor: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200',
      glow: 'shadow-purple-500/20',
    },
    iconName: 'eye-off',
    facts: [
      'Chronus empreendeu conduta obsessiva e reiterada de monitoramento das atividades de Pedro Henrique Cardona Peres na web, tipificada como Cyberstalking no Art. 147-A do Código Penal.',
      'Endereços IP e identificadores telemáticos foram afixados em páginas abertas e indexadas no Google, sujeitando o pesquisador a ameaças digitais e doxxing.',
      'Infração explícita aos Artigos 10 e 15 do Marco Civil da Internet (que estabelecem reserva de jurisdição e sigilo aos registros de conexão) e aos Artigos 11, 14 e 18 da LGPD.',
      'Uso seletivo de RevisionDelete (RevDelete) para apagar os rastros e palavras ofensivas disparadas pelo próprio administrador.',
    ],
    keyQuote:
      '«A exposição pública de metadados de conexão viola o direito constitucional à intimidade e desrespeita a legislação de proteção de dados pessoais.»',
    legalArticles: [
      'Art. 147-A do Código Penal (Stalking / Perseguição)',
      'Arts. 10 e 15 da Lei 12.965/2014 (Marco Civil da Internet)',
      'Arts. 11, 14, 18, 42 e 44 da Lei 13.709/2018 (LGPD)',
    ],
    evidenceSummary: [
      'Páginas de arquivo com IPs registrados em texto limpo visíveis na busca web.',
      'Sumários de exclusão seletiva de histórico (RevDelete) operados por moderadores.',
    ],
    dossierDocument: 'irregularidades',
    dossierPageOrSlide: 'Seções 2 e 3 (Irregularidades da Wikipédia)',
    impactLevel: 'Gravíssimo',
  },
  {
    id: 'fase-6-denuncia-wmf-vazamento',
    stepNumber: 6,
    phase: 'Fase 6 • Quebra de Whistleblower',
    period: 'Canal Oficial da Fundação Wikimedia',
    title: 'Denúncia à Trust & Safety da WMF e Vazamento Ilegal de Sigilo',
    subtitle: 'Comunicações confidenciais repassadas aos próprios burocratas denunciados',
    category: 'violacao',
    categoryLabel: 'Blindagem Feudal & Vazamento',
    categoryColor: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200',
      glow: 'shadow-indigo-500/20',
    },
    iconName: 'shield',
    facts: [
      'WazzimaGiygg submeteu dossiê confidencial de denúncia contra os abusos de poder e quebra de regras comunitárias diretamente à equipe de Trust & Safety da Wikimedia Foundation em San Francisco.',
      'Em flagrante infração ao dever de sigilo de denunciantes (Whistleblower Protection), comunicações confidenciais foram repassadas internamente à panela administrativa local brasileira.',
      'Chronus e moderadores afins usaram essas informações para intensificar represálias e blindar a estrutura de privilégios, evidenciando a cumplicidade institucional da fundação mantenedora.',
    ],
    keyQuote:
      '«A estrutura global da Wikimedia Foundation operou como um sistema de proteção corporativa, desamparando a vítima e armando os moderadores com os detalhes da denúncia sigilosa.»',
    legalArticles: [
      'UCoC Seção 4 (Proteção a Denunciantes)',
      'Art. 44 da LGPD (Segurança e Sigilo de Comunicações)',
      'Art. 32 do GDPR (Segurança do Tratamento de Dados)',
    ],
    evidenceSummary: [
      'Protocolos de denúncia formal enviados à Trust & Safety.',
      'E-mails e capturas comprovando que burocratas locais tiveram acesso ao teor confidencial da representação.',
    ],
    dossierDocument: 'apresentacao',
    dossierPageOrSlide: 'Slide 10 (Vazamento de Comunicações Confidenciais)',
    impactLevel: 'Institucional',
  },
  {
    id: 'fase-7-publicacao-dossies-averdade',
    stepNumber: 7,
    phase: 'Fase 7 • A Reação Documentada',
    period: 'O Efeito Streisand em Marcha',
    title: 'Publicação do Dossiê "A Verdade" e Auditoria Jurídica de 47 Páginas',
    subtitle: 'A catalogação pública e indelével de provas que a Wikipédia tentou apagar',
    category: 'dossie',
    categoryLabel: 'Dossiê A Verdade',
    categoryColor: {
      bg: 'bg-amber-500/10 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-700',
      badge: 'bg-amber-500 text-slate-950 font-bold',
      glow: 'shadow-amber-500/30',
    },
    iconName: 'file',
    facts: [
      'Pedro Henrique Cardona Peres não se curvou à intimidação e converteu a opressão em documentação técnica e científica de alto rigor.',
      'Lançou o portal oficial wazzimagiygg.com/averdade/, expondo a cronologia factual dos eventos com dezenas de capturas de tela, diffs e contraprovas irrefutáveis.',
      'Produziu a representação técnico-jurídica "Calúnia por parte de Chronus V2" (47 páginas), fundamentando cada crime no Código Penal, no Marco Civil e na LGPD.',
      'Elaborou a apresentação executiva "Wikimedia Institutional Accountability Dossier" (15 slides), detalhando a responsabilidade civil objetiva da Wikimedia Foundation Inc. no Brasil e na União Europeia.',
    ],
    keyQuote:
      '«Ao tentarem soterrar a voz de um editor independente, deflagraram o clássico Efeito Streisand: transformaram um abuso local em uma das maiores auditorias públicas sobre a falência moral da Wikipédia lusófona.»',
    legalArticles: [
      'Art. 5º, IV e IX da CF/88 (Liberdade de Manifestação e Expressão)',
      'Art. 19 da DUDH e PIDCP (Livre Circulação de Informações)',
      'Art. 13 do Pacto de San José (Vedação à Censura Prévia)',
    ],
    evidenceSummary: [
      'Portal web público wazzimagiygg.com/averdade/.',
      'Dossiê técnico em formato PDF com 47 laudas e indexação probatória.',
      'Apresentação institucional em 15 slides executivos.',
    ],
    dossierDocument: 'chronus',
    dossierPageOrSlide: 'Dossiê Completo (47 Páginas) & Apresentação (15 Slides)',
    impactLevel: 'Histórico',
  },
  {
    id: 'fase-8-criacao-wikiworldweb',
    stepNumber: 8,
    phase: 'Fase 8 • Inovação e Legado',
    period: 'Nascimento da Nova Enciclopédia',
    title: 'Fundação da WikiWorldWeb (Wiki-alternative) e Código Aberto',
    subtitle: 'A resposta técnica definitiva: Conhecimento Livre, SPA, LGPD e 17 Temas',
    category: 'vitoria',
    categoryLabel: 'WikiWorldWeb & Futuro',
    categoryColor: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
      glow: 'shadow-emerald-500/20',
    },
    iconName: 'sparkles',
    facts: [
      'Em vez de se limitar à queixa estéril, WazzimaGiygg construiu uma alternativa real: a WikiWorldWeb, concebida como SPA de alto desempenho em React e TypeScript, carregando artigos em menos de 200ms.',
      'Implementou privacidade por padrão (Privacy by Design): anonimização estrita de IPs, canal oficial de DPO, Painel "Meus Dados" e separação real de poderes (ArbCom independente e auditoria pública).',
      'Criou um motor estético revolucionário de 17 temas de sistemas operacionais (Windows 10, 7 Aero, XP Luna, 95, 3.1, Terminal, Material) e modo 10-foot UI para Smart TVs (LG, Samsung, Android TV).',
      'Disponibilizou todo o código-fonte livre sob a licença GNU General Public License v3.0 (GPLv3) no GitHub (WazzimaGiygg/Wiki-alternative).',
    ],
    keyQuote:
      '«A melhor forma de derrotar a burocracia opaca é construindo um sistema superior onde a censura seja tecnicamente impossível e o usuário seja soberano.»',
    legalArticles: [
      'GNU General Public License v3.0 (GPLv3)',
      'Art. 25 do GDPR (Privacy by Design e by Default)',
      'Art. 18 da LGPD (Direitos Efetivos do Titular de Dados)',
    ],
    evidenceSummary: [
      'Repositório público no GitHub com arquitetura aberta.',
      'Plataforma interativa com suporte offline total (PWA) e áudio em tempo real.',
    ],
    dossierDocument: 'irregularidades',
    dossierPageOrSlide: 'Seção 5 & 6 (Superação pela WikiWorldWeb)',
    impactLevel: 'Inovador',
  },
  {
    id: 'fase-9-soberania-conclusao',
    stepNumber: 9,
    phase: 'Fase 9 • Preservação Perpétua',
    period: '2026 e em Diante',
    title: 'Consolidação Institucional e o Lema Histórico',
    subtitle: '«Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»',
    category: 'vitoria',
    categoryLabel: 'Memória e Soberania',
    categoryColor: {
      bg: 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30',
      text: 'text-indigo-800 dark:text-indigo-300',
      border: 'border-indigo-300 dark:border-indigo-700',
      badge: 'bg-indigo-600 text-white font-bold',
      glow: 'shadow-indigo-500/25',
    },
    iconName: 'scale',
    facts: [
      'O Caso Chronus e o Dossiê "A Verdade" tornaram-se estudo de caso obrigatório em auditoria de governança digital, responsabilidade de intermediários de internet e ética comunitária.',
      'Representações perante a Autoridade Nacional de Proteção de Dados (ANPD) e cortes jurisdicionais prosseguem para responsabilizar a Wikimedia Foundation Inc. no Brasil pelos danos morais gerados.',
      'No topo de todas as plataformas de WazzimaGiygg reluz o lema imutável em grego helênico:',
      '«Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!» — "Não, o Tempo (Chronus) não é o senhor do conhecimento!"',
    ],
    keyQuote:
      '«Nem a passagem do tempo nem o poder arbitrário de burocratas passageiros poderão apagar a verdade documentada. O conhecimento pertence à humanidade livre.»',
    legalArticles: [
      'Art. 186 e 927 do Código Civil (Reparação de Dano Moral)',
      'Art. 11 do Marco Civil (Submissão à Lei Brasileira)',
      'Digital Services Act (Reg. UE 2022/2065)',
    ],
    evidenceSummary: [
      'Preservação criptográfica perpétua dos dados.',
      'Ecossistema wazzimagiygg.com integrado e auditável por qualquer internauta.',
    ],
    dossierDocument: 'apresentacao',
    dossierPageOrSlide: 'Slide 15 (Conclusão, Reivindicações & Encaminhamentos)',
    impactLevel: 'Histórico',
  },
];

interface WazzimaGiyggTimelineProps {
  onOpenDossier?: (document?: DossierDocType, tab?: 'text' | 'pdf' | 'table') => void;
  compact?: boolean;
}

export const WazzimaGiyggTimeline: React.FC<WazzimaGiyggTimelineProps> = ({
  onOpenDossier,
  compact = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'timeline' | 'stepper' | 'grid'>('timeline');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({
    'fase-3-calunia-checkuser': true,
    'fase-7-publicacao-dossies-averdade': true,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyCitation = (event: TimelineEvent) => {
    const text = `[Fato Cronológico] ${event.phase} - ${event.title}: ${event.subtitle}. Documentado no Dossiê A Verdade (${event.dossierPageOrSlide}). Artigos Legais: ${event.legalArticles.join(', ')}.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const categories = [
    { id: 'all', label: 'Todos os Fatos (9)', icon: SlidersHorizontal },
    { id: 'origem', label: 'Origem Editorial', icon: BookOpen },
    { id: 'abuso', label: 'Abusos & Rollback', icon: AlertTriangle },
    { id: 'crime', label: 'Crimes Contra a Honra', icon: Ban },
    { id: 'violacao', label: 'LGPD & Devido Processo', icon: Scale },
    { id: 'dossie', label: 'Dossiê "A Verdade"', icon: FileText },
    { id: 'vitoria', label: 'WikiWorldWeb & Futuro', icon: Sparkles },
  ];

  const filteredEvents = useMemo(() => {
    return DOSSIER_TIMELINE_EVENTS.filter((ev) => {
      const matchCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'violacao' && (ev.category === 'violacao' || ev.category === 'crime')) ||
        ev.category === selectedCategory;

      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.subtitle.toLowerCase().includes(q) ||
        ev.phase.toLowerCase().includes(q) ||
        ev.period.toLowerCase().includes(q) ||
        ev.facts.some((f) => f.toLowerCase().includes(q)) ||
        ev.legalArticles.some((la) => la.toLowerCase().includes(q)) ||
        ev.evidenceSummary.some((es) => es.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const activeStepperEvent = DOSSIER_TIMELINE_EVENTS[currentStepIndex] || DOSSIER_TIMELINE_EVENTS[0];

  const renderIcon = (name: TimelineEvent['iconName']) => {
    switch (name) {
      case 'book':
        return <BookOpen size={18} />;
      case 'alert':
        return <AlertTriangle size={18} />;
      case 'ban':
        return <Ban size={18} />;
      case 'gavel':
        return <Gavel size={18} />;
      case 'eye-off':
        return <EyeOff size={18} />;
      case 'shield':
        return <ShieldAlert size={18} />;
      case 'file':
        return <FileText size={18} />;
      case 'sparkles':
        return <Sparkles size={18} />;
      case 'scale':
      default:
        return <Scale size={18} />;
    }
  };

  return (
    <section className="rounded-3xl bg-white dark:bg-[#0b1329] border border-amber-300/80 dark:border-amber-700/60 shadow-xl overflow-hidden transition-all duration-300">
      {/* Top Banner / Masthead */}
      <div className="relative bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-900 text-white p-6 sm:p-8 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} />
                <span>Cronologia Oficial Documentada</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-semibold">
                Dossiê "A Verdade"
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif-heading">
              Linha do Tempo: Fatos, Perseguições e a Vitória da Verdade
            </h2>

            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
              Reconstituição cronológica e pericial dos acontecimentos do <em>Caso Wazzimagiygg</em>: da perseguição do administrador <strong>Chronus</strong> às falsas acusações criminais, culminando nos <strong>Três Dossiês Oficiais</strong> e no desenvolvimento da <strong>WikiWorldWeb</strong>.
            </p>
          </div>

          {/* Quick Dossier Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenDossier && (
              <button
                type="button"
                onClick={() => onOpenDossier('chronus', 'text')}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Scale size={16} />
                <span>Dossiê 47 Páginas</span>
              </button>
            )}

            {onOpenDossier && (
              <button
                type="button"
                onClick={() => onOpenDossier('apresentacao', 'text')}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 backdrop-blur-xs transition cursor-pointer"
              >
                <Presentation size={15} />
                <span>15 Slides</span>
              </button>
            )}

            <a
              href={formatExternalUrl('https://wazzimagiygg.com/averdade/')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-black/30 hover:bg-black/40 text-amber-200 font-bold text-xs flex items-center gap-1.5 border border-amber-300/30 transition"
              title="Acessar dossiê público no portal oficial"
            >
              <span>Portal wazzimagiygg.com/averdade</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Famous Greek Motto Banner */}
        <div className="mt-5 pt-4 border-t border-amber-400/20 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="font-serif italic text-amber-200/90 flex items-center gap-2">
            <span className="text-base font-bold text-amber-300">«Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»</span>
            <span className="hidden sm:inline text-amber-300/70">— "Não, o Tempo (Chronus) não é o senhor do conhecimento!"</span>
          </div>
          <span className="text-[11px] font-mono text-amber-200/70">
            Auditoria Forense & Garantias Constitucionais (CF/88, LGPD, UCoC, DSA)
          </span>
        </div>
      </div>

      {/* Filter & View Mode Controls Bar */}
      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por 'Chronus', 'CheckUser', '47', 'LGPD', 'Streisand'..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar size={13} />
              <span>Linha do Tempo</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('stepper')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'stepper'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ChevronRight size={14} />
              <span>Passo a Passo</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Maximize2 size={13} />
              <span>Matriz de Fatos</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-8">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <AlertTriangle size={36} className="mx-auto text-amber-500 opacity-60" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
              Nenhum evento corresponde ao filtro "{searchQuery}"
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tente buscar por outro termo ou selecione "Todos os Fatos" para visualizar a cronologia completa.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
            >
              Resetar Filtros
            </button>
          </div>
        ) : viewMode === 'stepper' ? (
          /* STEPPER / GUIDED INTERACTIVE VIEW */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Stepper Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  Marco {currentStepIndex + 1} de {DOSSIER_TIMELINE_EVENTS.length}
                </span>
                <span className="text-slate-500">
                  {Math.round(((currentStepIndex + 1) / DOSSIER_TIMELINE_EVENTS.length) * 100)}% Concluído
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentStepIndex + 1) / DOSSIER_TIMELINE_EVENTS.length) * 100}%`,
                  }}
                />
              </div>

              {/* Step indicator thumbnails */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2">
                {DOSSIER_TIMELINE_EVENTS.map((ev, idx) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`h-8 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      currentStepIndex === idx
                        ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{ev.stepNumber}.</span>
                    <span className="truncate max-w-[120px]">{ev.phase.split('•')[1] || ev.phase}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Stepper Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                      activeStepperEvent.categoryColor.bg.includes('emerald')
                        ? 'bg-emerald-600'
                        : activeStepperEvent.categoryColor.bg.includes('rose')
                        ? 'bg-rose-600'
                        : activeStepperEvent.categoryColor.bg.includes('purple')
                        ? 'bg-purple-600'
                        : 'bg-amber-600'
                    }`}
                  >
                    {renderIcon(activeStepperEvent.iconName)}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {activeStepperEvent.phase} • {activeStepperEvent.period}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold font-serif-heading text-slate-900 dark:text-white">
                      {activeStepperEvent.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono border ${activeStepperEvent.categoryColor.badge}`}
                  >
                    {activeStepperEvent.categoryLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Impacto: {activeStepperEvent.impactLevel}
                  </span>
                </div>
              </div>

              <p className="text-base text-slate-700 dark:text-slate-200 font-medium">
                {activeStepperEvent.subtitle}
              </p>

              {/* Facts List */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
                  Detalhamento Factual dos Acontecimentos:
                </h4>
                <div className="space-y-2.5">
                  {activeStepperEvent.facts.map((fact, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-3"
                    >
                      <CheckCircle2
                        size={16}
                        className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5"
                      />
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Quote */}
              {activeStepperEvent.keyQuote && (
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border-l-4 border-amber-500 text-xs sm:text-sm italic text-amber-900 dark:text-amber-200">
                  {activeStepperEvent.keyQuote}
                </div>
              )}

              {/* Legal & Evidence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-mono uppercase">
                    <Scale size={14} />
                    <span>Dispositivos Normativos & Infrações:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeStepperEvent.legalArticles.map((art, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-mono font-medium"
                      >
                        {art}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-mono uppercase">
                    <FileText size={14} />
                    <span>Evidências Catalogadas no Dossiê:</span>
                  </span>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                    {activeStepperEvent.evidenceSummary.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                  <div className="pt-1 text-[11px] font-mono text-slate-500">
                    Localização:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {activeStepperEvent.dossierPageOrSlide}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Stepper Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentStepIndex === 0}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Marco Anterior</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCitation(activeStepperEvent)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                    title="Copiar citação factual deste evento"
                  >
                    {copiedId === activeStepperEvent.id ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>{copiedId === activeStepperEvent.id ? 'Copiado!' : 'Citação'}</span>
                  </button>

                  {onOpenDossier && (
                    <button
                      type="button"
                      onClick={() => onOpenDossier(activeStepperEvent.dossierDocument, 'text')}
                      className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <BookOpen size={14} />
                      <span>Abrir Documento</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentStepIndex((prev) =>
                      Math.min(DOSSIER_TIMELINE_EVENTS.length - 1, prev + 1)
                    )
                  }
                  disabled={currentStepIndex === DOSSIER_TIMELINE_EVENTS.length - 1}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-md cursor-pointer"
                >
                  <span>Próximo Marco</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs font-mono">
                      #{ev.stepNumber}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {ev.period}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ev.subtitle}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    {ev.facts.slice(0, 2).map((fact, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5"
                      >
                        <span className="text-amber-500 font-bold">•</span>
                        <span className="line-clamp-2">{fact}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]">
                    {ev.dossierPageOrSlide}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStepIndex(ev.stepNumber - 1);
                      setViewMode('stepper');
                    }}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver Detalhes</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* VERTICAL FLOW TIMELINE */
          <div className="relative max-w-4xl mx-auto">
            {/* Center / Left connecting vertical line */}
            <div className="absolute left-6 sm:left-8 top-3 bottom-8 w-1 bg-gradient-to-b from-amber-500 via-rose-500 to-indigo-600 rounded-full opacity-30 dark:opacity-40" />

            <div className="space-y-8">
              {filteredEvents.map((ev, index) => {
                const isExpanded = !!expandedEvents[ev.id];
                return (
                  <div
                    key={ev.id}
                    className="relative pl-14 sm:pl-20 group transition-all duration-300"
                  >
                    {/* Step Icon Node */}
                    <div
                      className={`absolute left-2 sm:left-4 top-2 -translate-x-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ring-4 ring-white dark:ring-slate-900 ${
                        ev.category === 'vitoria'
                          ? 'bg-emerald-600'
                          : ev.category === 'crime' || ev.category === 'violacao'
                          ? 'bg-rose-600'
                          : ev.category === 'dossie'
                          ? 'bg-amber-600'
                          : 'bg-blue-600'
                      }`}
                    >
                      <span className="text-xs font-mono">{ev.stepNumber}</span>
                    </div>

                    {/* Timeline Card */}
                    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-md hover:shadow-xl transition-all duration-300 space-y-4">
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${ev.categoryColor.badge}`}
                          >
                            {ev.categoryLabel}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                            {ev.period}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {ev.phase}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyCitation(ev)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Copiar citação factual"
                          >
                            {copiedId === ev.id ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpand(ev.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition cursor-pointer"
                          >
                            <span>{isExpanded ? 'Recolher' : 'Expandir Provas'}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
                          {ev.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {ev.subtitle}
                        </p>
                      </div>

                      {/* Facts Bullets */}
                      <div className="space-y-2 pt-1">
                        {ev.facts.map((fact, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed flex items-start gap-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{fact}</span>
                          </div>
                        ))}
                      </div>

                      {/* Key Quote */}
                      {ev.keyQuote && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border-l-4 border-amber-500 text-xs italic text-amber-900 dark:text-amber-200">
                          {ev.keyQuote}
                        </div>
                      )}

                      {/* Expanded Section: Legal Articles & Forensics */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 font-mono uppercase text-[11px]">
                                <Scale size={13} />
                                <span>Infrações Jurídicas & Normativas:</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {ev.legalArticles.map((art, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-800 dark:text-slate-200"
                                  >
                                    {art}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 font-mono uppercase text-[11px]">
                                <FileText size={13} />
                                <span>Evidências do Dossiê:</span>
                              </span>
                              <ul className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300 list-disc list-inside">
                                {ev.evidenceSummary.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 font-mono">
                            <div>
                              Referência documental:{' '}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {ev.dossierPageOrSlide}
                              </strong>
                            </div>

                            <div className="flex items-center gap-2">
                              {onOpenDossier && (
                                <button
                                  type="button"
                                  onClick={() => onOpenDossier(ev.dossierDocument, 'text')}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-400/40 font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <BookOpen size={12} />
                                  <span>Consultar Documento Integral</span>
                                </button>
                              )}

                              <a
                                href={formatExternalUrl('https://wazzimagiygg.com/averdade/')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition flex items-center gap-1"
                              >
                                <span>Ver no Portal</span>
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="p-6 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>Documentação Permanente e Preservação Perpétua</span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Todos os fatos catalogados estão respaldados por capturas criptográficas, diffs públicos e auditoria forense.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenDossier && (
            <button
              type="button"
              onClick={() => onOpenDossier('chronus', 'pdf')}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span>Baixar PDF 47 Págs</span>
            </button>
          )}

          {onOpenDossier && (
            <button
              type="button"
              onClick={() => onOpenDossier('apresentacao', 'pdf')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Presentation size={13} />
              <span>Baixar Slides PDF</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
