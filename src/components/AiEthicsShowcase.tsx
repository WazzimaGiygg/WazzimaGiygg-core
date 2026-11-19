/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Código de Ética Digital, Transparência no Uso de IA, Ética dos Serviços Firebase
 * e Justificativa de Independência da Wikimedia Foundation (incluindo Caso Chronus).
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Scale,
  Download,
  Copy,
  Check,
  X,
  ChevronRight,
  BookOpen,
  UserCheck,
  AlertTriangle,
  Lock,
  Database,
  Globe,
  ExternalLink
} from 'lucide-react';
import { registerAuditLog } from '../firebase';
import { WMF_LGPD_PDF_URL } from '../data/wmfLgpdInvestigationData';

export interface AiEthicsShowcaseProps {
  onClose?: () => void;
  onOpenTicketForm?: (tipo?: string) => void;
  onOpenDossie?: () => void;
  currentUser?: any;
  showToast?: (msg: string, isError?: boolean) => void;
  isModal?: boolean;
}

export const AI_ETHICS_PRINCIPLES = [
  {
    num: '01',
    titulo: 'Autoria Humana e Responsabilidade Editorial',
    eixo: 'Responsabilidade',
    diretriz:
      'Todo artigo, ensaio, verbete no NotMediaWiki ou obra no UWG Books publicado neste portal deve possuir um autor ou editor humano identificável que assume integral responsabilidade pelo conteúdo.',
    aplicacaoPortal:
      'Sistemas automatizados ou modelos generativos nunca figuram como autores jurídicos ou editoriais. A publicação no acervo permanece restrita a contas autorizadas e sujeita à curadoria humana.'
  },
  {
    num: '02',
    titulo: 'Transparência e Declaração Explícita de Auxílio',
    eixo: 'Transparência',
    diretriz:
      'Qualquer utilização de ferramentas de IA para revisão ortográfica, tradução assistida ou estruturação preliminar de rascunhos deve ser declarada de forma clara e acessível ao leitor.',
    aplicacaoPortal:
      'O leitor tem o direito de saber quando um material contou com suporte técnico automatizado, diferenciando trabalho autoral humano de apoio instrumental.'
  },
  {
    num: '03',
    titulo: 'Veracidade Factual e Proibição de Alucinações',
    eixo: 'Integridade Científica',
    diretriz:
      'É estritamente vedado publicar afirmações factuais, estatísticas, datas, jurisprudências ou referências bibliográficas geradas por IA sem conferência direta na fonte primária.',
    aplicacaoPortal:
      'Todas as citações ABNT, links por UID e referências históricas ou acadêmicas devem apontar para documentos reais e verificáveis por editores humanos.'
  },
  {
    num: '04',
    titulo: 'Privacidade, Sigilo e Conformidade com a LGPD',
    eixo: 'Proteção de Dados',
    diretriz:
      'Dados pessoais de leitores, e-mails de contato, registros de ouvidoria/tickets e conversas privadas nunca devem ser enviados para treinamento de modelos externos de terceiros.',
    aplicacaoPortal:
      'Em alinhamento com a Lei nº 13.709/2018 (LGPD) e o Marco Civil (Lei nº 12.965/2014), informações sensíveis e protocolos administrativos permanecem isolados de pipelines externos de IA.'
  },
  {
    num: '05',
    titulo: 'Não Discriminação, Pluralidade e Revisão Humana',
    eixo: 'Equidade',
    diretriz:
      'Decisões editoriais, moderação comunitária no Bem-Te-Vi, aplicação de sanções ou avaliação de denúncias jamais podem ser delegadas exclusivamente a algoritmos opacos.',
    aplicacaoPortal:
      'Toda medida disciplinar ou editorial exige análise humana fundamentada, garantindo direito de resposta, contraditório e proteção contra vieses automatizados.'
  },
  {
    num: '06',
    titulo: 'Uso Proporcional e Combate à Poluição Sintética',
    eixo: 'Sustentabilidade Informacional',
    diretriz:
      'Rejeitamos a geração em massa de textos sintéticos automatizados (spam enciclopédico, SEO artificial ou bots sociais) que degradem a qualidade e confiabilidade do conhecimento livre.',
    aplicacaoPortal:
      'Ferramentas computacionais só são admitidas quando agregam clareza, acessibilidade ou preservação documental sem substituir o pensamento crítico.'
  }
] as const;

export const AI_PRACTICE_RULES = {
  permitidas: [
    'Revisão ortográfica, gramatical e de padronização tipográfica revisada linha a linha pelo autor.',
    'Tradução assistida de termos técnicos ou resumos bibliográficos com validação terminológica humana em fontes originais.',
    'Organização estrutural de dados públicos já verificados para acessibilidade e leitura clara no acervo.',
    'Verificação automatizada determinística de integridade de esquemas, acessibilidade e segurança de código.'
  ],
  proibidas: [
    'Publicar textos gerados integralmente por IA como se fossem pesquisa original, ensaio autoral ou reportagem verificada.',
    'Fabricar ou "completar" citações ABNT, URLs, nomes de pesquisadores, acórdãos ou dados numéricos sem verificação documental.',
    'Submeter dados pessoais de usuários, denúncias da Ouvidoria ou rascunhos sigilosos a serviços externos sem base legal.',
    'Operar contas automatizadas (bots), respostas sintéticas em massa ou campanhas de assédio na rede social Bem-Te-Vi.'
  ]
} as const;

export const FIREBASE_ETHICS_PRINCIPLES = [
  {
    num: '01',
    titulo: 'Minimização de Dados no Firebase Auth & Firestore',
    eixo: 'Coleta Mínima (LGPD Art. 6º)',
    diretriz:
      'Os serviços do Firebase (Authentication e Cloud Firestore) são empregados estritamente para autenticação de sessão e persistência do acervo editorial, comentários comunitários e protocolos de atendimento.',
    garantiaTecnica:
      'Não coletamos CPF, número de telefone, endereço residencial, dados biométricos ou rastreadores de publicidade comportamental. O usuário pode navegar pelo acervo público sem criar conta.'
  },
  {
    num: '02',
    titulo: 'Validação Rigorosa de Esquema e Controle de Publicação',
    eixo: 'Integridade Documental',
    diretriz:
      'Nenhuma gravação na coleção de artigos ocorre sem validação explícita de esquema no frontend e verificação de autorização editorial para impedir registros corrompidos ou anônimos sem autoria.',
    garantiaTecnica:
      'Campos obrigatórios como titulo, descricao e colecao passam por checagem determinística antes da submissão ao Firestore, e a publicação oficial permanece restrita a editores autorizados.'
  },
  {
    num: '03',
    titulo: 'Proibição de Monetização, Venda ou Perfilamento de Dados',
    eixo: 'Soberania do Usuário',
    diretriz:
      'Os documentos armazenados no Firestore — incluindo mensagens do Bem-Te-Vi, tickets da Ouvidoria e perfis básicos — jamais são comercializados, cedidos a corretores de dados ou usados para anúncios segmentados.',
    garantiaTecnica:
      'Não instalamos SDKs de rastreamento publicitário de terceiros nem compartilhamos coleções privadas com parceiros comerciais externos.'
  },
  {
    num: '04',
    titulo: 'Auditoria Transparente, Regras de Segurança e Portabilidade',
    eixo: 'Direitos do Titular (LGPD Art. 18)',
    diretriz:
      'Operações administrativas e registros de ciência ficam documentados via trilhas de auditoria, enquanto o leitor mantém pleno direito de retificação, exportação e eliminação de seus dados via Ouvidoria.',
    garantiaTecnica:
      'Em situações de restrição de leitura ou escrita no Firestore, o aplicativo ativa fallbacks locais seguros sem expor chaves administrativas nem quebrar o acesso à informação pública.'
  }
] as const;

export const WIKIMEDIA_INDEPENDENCE_REASONS = [
  {
    num: '01',
    titulo: 'Autonomia contra Oligarquias Editoriais e Censura Prévia',
    eixo: 'Independência Institucional',
    motivo:
      'Este portal não utiliza dumps, APIs, feeds ou curadoria da Wikimedia Foundation (Wikipédia). A infraestrutura do WazzimaGiygg e do NotMediaWiki foi construída de forma autônoma porque a governança praticada na Wikipédia Lusófona consolidou grupos fechados que revertem contribuições acadêmicas válidas sem debate técnico.'
  },
  {
    num: '02',
    titulo: 'Bloqueio Global Arbitrário de Domínios (Blacklisting)',
    eixo: 'Ruptura de Confiança Técnica',
    motivo:
      'Domínios do projeto (como wazzimagiygg.com e wazzimagiygg.wikidot.com) foram incluídos na lista negra global da Wikimedia por stewards sem direito efetivo ao contraditório ou ampla defesa, tornando inviável qualquer integração ou dependência de suas bases de dados.'
  },
  {
    num: '03',
    titulo: 'Incompatibilidade com a LGPD e o Marco Civil da Internet',
    eixo: 'Proteção de Sigilo Telemático',
    motivo:
      'Relatórios do portal documentam o uso abusivo da ferramenta CheckUser para rastrear faixas de IP e localização geográfica de editores críticos fora de ordem judicial, violando o Art. 10 do Marco Civil (Lei nº 12.965/2014) e os princípios da LGPD (Lei nº 13.709/2018).'
  },
  {
    num: '04',
    titulo: 'Acervo Próprio Verificável e Padrão Científico ABNT',
    eixo: 'Soberania do Conhecimento Livre',
    motivo:
      'Ao não espelhar verbetes da Wikimedia Foundation, preservamos a rastreabilidade direta das fontes primárias, a autoria identificável e o respeito à legislação civil brasileira sobre direito de resposta e honra.'
  }
] as const;

export const CHRONUS_ABUSE_CITATION = {
  id: 'caso-chronus',
  moderador: 'Chronus',
  cargo: 'Administrador na Wikipédia Lusófona',
  localidade: "Santa Bárbara D'Oeste (SP)",
  gravidade: 'Crítica',
  referencia: 'wazzimagiygg.com/averdade/capitulo-1',
  resumo:
    'Exemplo emblemático que fundamenta a recusa de dados e governança da Wikimedia Foundation: o administrador Chronus protagonizou episódios documentados de autocracia editorial, perseguição sistemática a editores divergentes, reversões em massa sem justificativa plausível e imposição forçada de pontos de vista pessoais em artigos biográficos e históricos.',
  evidencias: [
    'Eliminação sumária de contribuições acadêmicas válidas acompanhada de rotulação pejorativa contra pesquisadores e colaboradores.',
    'Uso intimidatório de avisos e ameaças de bloqueio contra novos editores e autores independentes para silenciar dissidências.',
    'Conluio explícito com outros administradores para aprovar regras restritivas e sanções em votações de quórum reduzido.'
  ]
} as const;

interface EthicsCommitmentRecord {
  protocolo: string;
  dataIso: string;
  dataLegivel: string;
  signatario: string;
}

type EthicsSubTab = 'principios' | 'praticas' | 'firebase' | 'wikimedia' | 'compromisso';

const COMMITMENT_STORAGE_KEY = 'wzzm_ai_ethics_commitment';

export default function AiEthicsShowcase({
  onClose,
  onOpenTicketForm,
  onOpenDossie,
  currentUser,
  showToast,
  isModal = false
}: AiEthicsShowcaseProps) {
  const [activeSubTab, setActiveSubTab] = useState<EthicsSubTab>('principios');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [commitment, setCommitment] = useState<EthicsCommitmentRecord | null>(() => {
    try {
      const saved = window.localStorage.getItem(COMMITMENT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleCopyPolicy = () => {
    const text = [
      'CÓDIGO DE ÉTICA DIGITAL — IA, FIREBASE E INDEPENDÊNCIA DA WIKIMEDIA FOUNDATION (WAZZIMAGIYGG)',
      '--- 1. ÉTICA DE USO DA INTELIGÊNCIA ARTIFICIAL ---',
      ...AI_ETHICS_PRINCIPLES.map((p) => `${p.num}. ${p.titulo}: ${p.diretriz}`),
      '--- 2. ÉTICA DE USO DOS SERVIÇOS DO FIREBASE ---',
      ...FIREBASE_ETHICS_PRINCIPLES.map((f) => `${f.num}. ${f.titulo}: ${f.diretriz} ${f.garantiaTecnica}`),
      '--- 3. POR QUE NÃO USAMOS DADOS DA WIKIMEDIA FOUNDATION ---',
      ...WIKIMEDIA_INDEPENDENCE_REASONS.map((w) => `${w.num}. ${w.titulo}: ${w.motivo}`),
      `--- 4. CITAÇÃO DOCUMENTADA: ABUSOS DO ADMINISTRADOR ${CHRONUS_ABUSE_CITATION.moderador.toUpperCase()} ---`,
      `${CHRONUS_ABUSE_CITATION.moderador} (${CHRONUS_ABUSE_CITATION.localidade} · Ref.: ${CHRONUS_ABUSE_CITATION.referencia}): ${CHRONUS_ABUSE_CITATION.resumo}`,
      ...CHRONUS_ABUSE_CITATION.evidencias.map((ev, idx) => `- Evidência ${idx + 1}: ${ev}`),
      'Canal de contestação e retificação: Ouvidoria WazzimaGiygg (Lei 13.709/2018 e Lei 12.965/2014).'
    ].join('\n\n');

    try {
      navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      if (showToast) showToast('Código completo de Ética (IA, Firebase e Wikimedia/Chronus) copiado.');
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      if (showToast) showToast('Não foi possível copiar automaticamente.', true);
    }
  };

  const handleDownloadPolicyPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let y = 18;

      const ensureSpace = (needed: number) => {
        if (y + needed > 275) {
          doc.addPage();
          y = 18;
        }
      };

      const writeSectionTitle = (title: string) => {
        ensureSpace(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(title, 14, y);
        y += 7;
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('WAZZIMAGIYGG — ETICA DE IA, FIREBASE E INDEPENDENCIA WIKIMEDIA', 14, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        `Documento Oficial de Governanca Digital · Emitido em ${new Date().toLocaleDateString('pt-BR')}`,
        14,
        y
      );
      y += 10;

      writeSectionTitle('1. ETICA DE USO DA INTELIGENCIA ARTIFICIAL');
      AI_ETHICS_PRINCIPLES.forEach((p) => {
        const lines = doc.splitTextToSize(`${p.diretriz} ${p.aplicacaoPortal}`, 180);
        ensureSpace(lines.length * 4.5 + 10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${p.num}. ${p.titulo} (${p.eixo})`, 14, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(lines, 14, y);
        y += lines.length * 4.5 + 4;
      });

      y += 3;
      writeSectionTitle('2. ETICA DE USO DOS SERVICOS DO FIREBASE');
      FIREBASE_ETHICS_PRINCIPLES.forEach((f) => {
        const lines = doc.splitTextToSize(`${f.diretriz} ${f.garantiaTecnica}`, 180);
        ensureSpace(lines.length * 4.5 + 10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${f.num}. ${f.titulo} (${f.eixo})`, 14, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(lines, 14, y);
        y += lines.length * 4.5 + 4;
      });

      y += 3;
      writeSectionTitle('3. POR QUE NAO UTILIZAMOS DADOS DA WIKIMEDIA FOUNDATION');
      WIKIMEDIA_INDEPENDENCE_REASONS.forEach((w) => {
        const lines = doc.splitTextToSize(w.motivo, 180);
        ensureSpace(lines.length * 4.5 + 10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${w.num}. ${w.titulo} (${w.eixo})`, 14, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(lines, 14, y);
        y += lines.length * 4.5 + 4;
      });

      y += 3;
      writeSectionTitle('4. REGISTRO DOCUMENTADO: ABUSOS DO ADMINISTRADOR CHRONUS');
      const chronusSummaryLines = doc.splitTextToSize(
        `Moderador: ${CHRONUS_ABUSE_CITATION.moderador} (${CHRONUS_ABUSE_CITATION.localidade}) · Gravidade: ${CHRONUS_ABUSE_CITATION.gravidade} · Referencia: ${CHRONUS_ABUSE_CITATION.referencia}. ${CHRONUS_ABUSE_CITATION.resumo}`,
        180
      );
      ensureSpace(chronusSummaryLines.length * 4.5 + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(chronusSummaryLines, 14, y);
      y += chronusSummaryLines.length * 4.5 + 4;

      CHRONUS_ABUSE_CITATION.evidencias.forEach((ev, idx) => {
        const evLines = doc.splitTextToSize(`Evidencia ${idx + 1}: ${ev}`, 176);
        ensureSpace(evLines.length * 4.5 + 3);
        doc.text(evLines, 18, y);
        y += evLines.length * 4.5 + 2;
      });

      doc.save('wazzimagiygg-etica-ia-firebase-wikimedia.pdf');
      if (showToast) showToast('Documento de Ética (IA, Firebase e Wikimedia) exportado em PDF.');
    } catch {
      if (showToast) showToast('Erro ao gerar o arquivo PDF.', true);
    }
  };

  const handleRegisterCommitment = async () => {
    const now = new Date();
    const record: EthicsCommitmentRecord = {
      protocolo: `WZZM-ETICA-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      dataIso: now.toISOString(),
      dataLegivel: now.toLocaleString('pt-BR'),
      signatario: currentUser?.email || currentUser?.displayName || 'Leitor / Colaborador em Sessão'
    };

    try {
      window.localStorage.setItem(COMMITMENT_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Ignore storage failure
    }
    setCommitment(record);

    try {
      await registerAuditLog('COMPROMISSO_ETICA_DIGITAL_REGISTRADO', record.signatario, {
        protocolo: record.protocolo,
        data: record.dataIso
      });
    } catch {
      // Non-blocking audit log
    }

    if (showToast) {
      showToast('Compromisso com as Diretrizes Éticas de IA e Firebase registrado nesta sessão.');
    }
  };

  const containerClasses = isModal
    ? 'fixed inset-0 bg-stone-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto'
    : 'w-full';

  const cardClasses = isModal
    ? 'bg-[#FAF9F5] dark:bg-[#181816] border border-[#141414] dark:border-[#3E3D38] shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-left my-auto rounded-lg'
    : 'bg-[#FAF9F5] dark:bg-[#181816] border border-[#141414] dark:border-[#3E3D38] shadow-sm w-full flex flex-col overflow-hidden text-left rounded-lg';

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        {/* Editorial Header */}
        <header className="bg-[#141414] text-stone-100 p-5 sm:p-7 border-b border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-amber-300">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Ética de IA &amp; Firebase</span>
                <span aria-hidden="true">·</span>
                <span>Independência da Wikimedia</span>
                <span aria-hidden="true">·</span>
                <span>Lei nº 13.709/2018 (LGPD)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-white leading-tight text-balance">
                Ética Digital: Uso de IA, Firebase e Autonomia Editorial
              </h2>
              <p className="text-xs sm:text-sm font-serif text-stone-300 leading-relaxed">
                Diretrizes de transparência em inteligência artificial, regras éticas de privacidade e minimização de dados no Firebase, e as razões jurídicas e editoriais pelas quais este portal não utiliza dados da Wikimedia Foundation — com registro explícito dos abusos do administrador Chronus.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyPolicy}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-600 rounded text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? 'Copiado' : 'Copiar Diretrizes'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPolicyPdf}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PDF</span>
              </button>
              {isModal && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar diretrizes de ética digital"
                  className="p-2 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-stone-800 font-mono text-xs overflow-x-auto">
            {[
              { id: 'principios', label: '01. Ética de IA' },
              { id: 'praticas', label: '02. Permitido vs. Proibido' },
              { id: 'firebase', label: '03. Ética do Firebase' },
              { id: 'wikimedia', label: '04. Sem Wikimedia & Chronus' },
              { id: 'compromisso', label: '05. Contestação e Termo' }
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id as EthicsSubTab)}
                  className={`px-3.5 py-2 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white text-stone-950'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Body Content */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-8">
          {activeSubTab === 'principios' && (
            <section className="space-y-6">
              <div className="border-b border-stone-200 dark:border-[#2E2D28] pb-3">
                <h3 className="text-xl font-editorial font-bold text-[#141414] dark:text-stone-100">
                  Seis Pilares de Conduta Editorial no Uso da Inteligência Artificial
                </h3>
                <p className="text-xs font-serif text-stone-600 dark:text-stone-400 mt-1">
                  Aplicável a todos os artigos do portal, verbetes do NotMediaWiki, livros digitais e interações na rede Bem-Te-Vi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {AI_ETHICS_PRINCIPLES.map((item) => (
                  <article
                    key={item.num}
                    className="bg-white dark:bg-[#1E1E1B] border border-stone-200 dark:border-[#34332F] rounded-lg p-5 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                      <span className="font-bold text-[#B91C1C] dark:text-red-400">{item.num}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.eixo}</span>
                    </div>

                    <h4 className="text-lg font-editorial font-bold text-[#141414] dark:text-stone-100 leading-snug">
                      {item.titulo}
                    </h4>

                    <p className="text-sm font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
                      {item.diretriz}
                    </p>

                    <div className="pt-3 border-t border-stone-100 dark:border-[#2E2D28] text-xs font-serif text-stone-600 dark:text-stone-400 leading-relaxed">
                      <strong className="font-mono text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-300 block mb-1">
                        Aplicação no portal
                      </strong>
                      {item.aplicacaoPortal}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeSubTab === 'praticas' && (
            <section className="space-y-6">
              <div className="border-b border-stone-200 dark:border-[#2E2D28] pb-3">
                <h3 className="text-xl font-editorial font-bold text-[#141414] dark:text-stone-100">
                  Critérios Objetivos de Uso Aceitável e Condutas Vedadas em IA
                </h3>
                <p className="text-xs font-serif text-stone-600 dark:text-stone-400 mt-1">
                  Guia prático para editores, pesquisadores, revisores e membros da comunidade.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1E1E1B] border border-stone-200 dark:border-[#34332F] rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Práticas Permitidas (com Revisão Humana)</span>
                  </div>
                  <ul className="space-y-3 text-sm font-serif text-stone-800 dark:text-stone-200">
                    {AI_PRACTICE_RULES.permitidas.map((rule, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 pb-3 border-b border-stone-100 dark:border-[#2E2D28] last:border-b-0 last:pb-0"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-[#1E1E1B] border border-stone-200 dark:border-[#34332F] rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Práticas Estritamente Proibidas</span>
                  </div>
                  <ul className="space-y-3 text-sm font-serif text-stone-800 dark:text-stone-200">
                    {AI_PRACTICE_RULES.proibidas.map((rule, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 pb-3 border-b border-stone-100 dark:border-[#2E2D28] last:border-b-0 last:pb-0"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-stone-100 dark:bg-[#242320] border border-stone-200 dark:border-[#34332F] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-stone-900 dark:text-stone-100">
                    <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                    <span>Proteção de Autoria e Verificação de Esquema</span>
                  </div>
                  <p className="text-xs font-serif text-stone-700 dark:text-stone-300 leading-relaxed">
                    Antes de gravar qualquer publicação no banco de dados, o portal exige autoria autenticada e validação rigorosa de campos obrigatórios e referências.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('firebase')}
                  className="paper-button px-4 py-2 text-xs font-mono font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Ver Ética do Firebase</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          )}

          {activeSubTab === 'firebase' && (
            <section className="space-y-6">
              <div className="border-b border-stone-200 dark:border-[#2E2D28] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h3 className="text-xl font-editorial font-bold text-[#141414] dark:text-stone-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
                    <span>Ética de Uso dos Serviços do Firebase (Auth &amp; Cloud Firestore)</span>
                  </h3>
                  <p className="text-xs font-serif text-stone-600 dark:text-stone-400 mt-1">
                    Compromisso técnico e jurídico sobre como armazenamos sessões, artigos, mensagens e protocolos com estrito respeito à LGPD.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {FIREBASE_ETHICS_PRINCIPLES.map((item) => (
                  <article
                    key={item.num}
                    className="bg-white dark:bg-[#1E1E1B] border border-stone-200 dark:border-[#34332F] rounded-lg p-5 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                      <span className="font-bold text-amber-800 dark:text-amber-400">{item.num}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.eixo}</span>
                    </div>

                    <h4 className="text-lg font-editorial font-bold text-[#141414] dark:text-stone-100 leading-snug">
                      {item.titulo}
                    </h4>

                    <p className="text-sm font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
                      {item.diretriz}
                    </p>

                    <div className="pt-3 border-t border-stone-100 dark:border-[#2E2D28] text-xs font-serif text-stone-600 dark:text-stone-400 leading-relaxed">
                      <strong className="font-mono text-[10px] uppercase tracking-wider text-stone-800 dark:text-stone-300 block mb-1">
                        Garantia técnica implementada
                      </strong>
                      {item.garantiaTecnica}
                    </div>
                  </article>
                ))}
              </div>

              <div className="bg-stone-100 dark:bg-[#242320] border border-stone-200 dark:border-[#34332F] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-mono text-xs font-bold uppercase text-stone-900 dark:text-stone-100">
                    Controle do Titular sobre Registros no Firestore
                  </div>
                  <p className="text-xs font-serif text-stone-700 dark:text-stone-300 leading-relaxed">
                    Qualquer leitor ou colaborador pode solicitar exclusão, revisão de perfil ou relatório de logs armazenados nos serviços do Firebase através da Ouvidoria.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenTicketForm) {
                      onOpenTicketForm('Solicitação LGPD / Dados Firebase');
                      if (isModal && onClose) onClose();
                    } else {
                      setActiveSubTab('compromisso');
                    }
                  }}
                  className="paper-button px-4 py-2 text-xs font-mono font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Exercer Direito LGPD</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          )}

          {activeSubTab === 'wikimedia' && (
            <section className="space-y-6">
              <div className="border-b border-stone-200 dark:border-[#2E2D28] pb-3">
                <h3 className="text-xl font-editorial font-bold text-[#141414] dark:text-stone-100 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#B91C1C] dark:text-red-400 shrink-0" aria-hidden="true" />
                  <span>Por que NÃO usamos dados da Wikimedia Foundation &amp; Caso Chronus</span>
                </h3>
                <p className="text-xs font-serif text-stone-600 dark:text-stone-400 mt-1">
                  Fundamentos editoriais, técnicos e jurídicos da ruptura completa do ecossistema WazzimaGiygg / NotMediaWiki com a base de dados e moderação da Wikipédia Lusófona.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {WIKIMEDIA_INDEPENDENCE_REASONS.map((item) => (
                  <article
                    key={item.num}
                    className="bg-white dark:bg-[#1E1E1B] border border-stone-200 dark:border-[#34332F] rounded-lg p-5 space-y-2.5"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                      <span className="font-bold text-[#B91C1C] dark:text-red-400">{item.num}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.eixo}</span>
                    </div>
                    <h4 className="text-base font-editorial font-bold text-[#141414] dark:text-stone-100 leading-snug">
                      {item.titulo}
                    </h4>
                    <p className="text-sm font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
                      {item.motivo}
                    </p>
                  </article>
                ))}
              </div>

              {/* Explicit Citation: Chronus Abuses */}
              <article className="bg-red-50/70 dark:bg-red-950/25 border border-red-300 dark:border-red-800 rounded-lg p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200 dark:border-red-900/60 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#B91C1C] dark:text-red-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Citação Formal de Abuso Documentado</span>
                      <span aria-hidden="true">·</span>
                      <span>Gravidade: {CHRONUS_ABUSE_CITATION.gravidade}</span>
                    </div>
                    <h4 className="text-xl font-editorial font-bold text-[#141414] dark:text-stone-100">
                      Abusos do Administrador {CHRONUS_ABUSE_CITATION.moderador} ({CHRONUS_ABUSE_CITATION.localidade})
                    </h4>
                  </div>

                  <span className="text-xs font-mono text-stone-700 dark:text-stone-300">
                    Ref.: {CHRONUS_ABUSE_CITATION.referencia}
                  </span>
                </div>

                <p className="text-sm font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
                  {CHRONUS_ABUSE_CITATION.resumo}
                </p>

                <div className="space-y-2">
                  <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
                    Condutas Abusivas Registradas no Dossiê
                  </h5>
                  <ul className="space-y-2 text-sm font-serif text-stone-800 dark:text-stone-200">
                    {CHRONUS_ABUSE_CITATION.evidencias.map((evidencia, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#B91C1C] dark:text-red-400 mt-0.5">
                          0{idx + 1}.
                        </span>
                        <span>{evidencia}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-red-200 dark:border-red-900/60 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-serif text-stone-700 dark:text-stone-300">
                    Consulte o registro integral, demais operadores envolvidos (Edmond Dantès, Johannnes89) e a auditoria LGPD &amp; Marco Civil (41p) no Dossiê oficial.
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={WMF_LGPD_PDF_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-[#B91C1C] hover:bg-red-800 text-white rounded text-xs font-mono font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Investigação LGPD &amp; Marco Civil (.pdf)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {onOpenDossie && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenDossie();
                          if (isModal && onClose) onClose();
                        }}
                        className="px-4 py-2 bg-[#141414] hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded text-xs font-mono font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>Abrir Dossiê &amp; Abusos Wikipédia</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </section>
          )}

          {activeSubTab === 'compromisso' && (
            <section className="space-y-6">
              <div className="border-b border-stone-200 dark:border-[#2E2D28] pb-3">
                <h3 className="text-xl font-editorial font-bold text-[#141414] dark:text-stone-100">
                  Contestação Editorial, Direito de Resposta e Termo de Compromisso
                </h3>
                <p className="text-xs font-serif text-stone-600 dark:text-stone-400 mt-1">
                  Mecanismos formais para denunciar conteúdos sintéticos não declarados, solicitar revisão de dados no Firebase ou encaminhar novos documentos ao Dossiê.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1E1E1B] border border-stone-200 dark:border-[#34332F] rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-mono text-xs font-bold uppercase tracking-wider">
                    <Scale className="w-4 h-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                    <span>Solicitar Revisão, Retificação ou Remoção LGPD</span>
                  </div>
                  <p className="text-sm font-serif text-stone-700 dark:text-stone-300 leading-relaxed">
                    Se você identificar qualquer artigo com indícios de fabricação automatizada, uso indevido de registros do Firebase ou desejar solicitar revisão ou remoção LGPD, protocole um ticket na Ouvidoria, contate o DPO ou registre diretamente no Portal de Suporte.
                  </p>
                  <div className="p-3 rounded border border-stone-200 dark:border-[#34332F] bg-[#F8F7F4] dark:bg-[#141413] font-mono text-[11px] space-y-1 text-stone-700 dark:text-stone-300">
                    <div>
                      <strong>DPO:</strong> Pedro Henrique Cardona Peres
                    </div>
                    <div>
                      <strong>E-mail:</strong>{' '}
                      <a
                        href="mailto:pedrohenriquecardonaperes@gmail.com?subject=Solicita%C3%A7%C3%A3o%20de%20Remo%C3%A7%C3%A3o%20LGPD"
                        className="underline font-bold text-amber-800 dark:text-amber-400"
                      >
                        pedrohenriquecardonaperes@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenTicketForm) {
                          onOpenTicketForm('Retificação de Conteúdo / Ética Digital');
                          if (isModal && onClose) onClose();
                        }
                      }}
                      className="paper-button px-4 py-2.5 text-xs font-mono font-semibold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Abrir Ticket na Ouvidoria</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href="https://support.wazzimagiygg.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 text-xs font-mono font-semibold inline-flex items-center gap-2 border border-stone-800 dark:border-stone-500 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#2A2925]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Suporte (support.wazzimagiygg.com)</span>
                    </a>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E1E1B] border border-stone-200 dark:border-[#34332F] rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-mono text-xs font-bold uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    <span>Ciência do Código de Ética (IA, Firebase &amp; Autonomia)</span>
                  </div>

                  {commitment ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-md p-4 space-y-2 text-xs font-mono">
                      <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Compromisso Ético Registrado</span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300">
                        Protocolo: <strong>{commitment.protocolo}</strong>
                      </p>
                      <p className="text-stone-600 dark:text-stone-400">
                        Signatário: {commitment.signatario} · {commitment.dataLegivel}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-serif text-stone-700 dark:text-stone-300 leading-relaxed">
                        Registre sua ciência das diretrizes de transparência em IA, ética do Firebase e independência editorial em relação à Wikimedia Foundation.
                      </p>
                      <button
                        type="button"
                        onClick={handleRegisterCommitment}
                        className="paper-button px-4 py-2.5 text-xs font-mono font-semibold inline-flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Registrar Ciência das Diretrizes Éticas</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer Bar */}
        <footer className="bg-[#EBE8E1] dark:bg-[#22211E] border-t border-stone-300 dark:border-[#3E3D38] px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-stone-700 dark:text-stone-300">
          <span>
            Ética de IA &amp; Firebase · Independência da Wikimedia · Caso Chronus · Lei nº 13.709/2018 (LGPD)
          </span>
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="font-bold underline hover:text-black dark:hover:text-white cursor-pointer"
            >
              Fechar
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
