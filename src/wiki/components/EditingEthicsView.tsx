import React, { useState, useMemo } from 'react';
import {
  Scale,
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Lock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Eye,
  EyeOff,
  UserX,
  ExternalLink,
  Copy,
  Check,
  Search,
  ArrowRight,
  Gavel,
  LifeBuoy,
  HeartHandshake,
  AlertOctagon,
  Sparkles,
  Award,
  ChevronRight,
  FileWarning,
  Flame,
  Download,
  Presentation,
  Globe,
  Building2,
  Cpu,
  Layers,
} from 'lucide-react';
import { UserProfile } from '../types';
import { formatExternalUrl } from '../utils/linkUtils';
import { IrregularidadesDossierModal, DossierDocType } from './IrregularidadesDossierModal';

interface EditingEthicsViewProps {
  user: UserProfile | null;
  onNavigate: (view: any) => void;
  onOpenEditor: () => void;
  initialTab?: TabKey;
}

type TabKey = 'principles' | 'lgpd' | 'gdpr' | 'free_expression' | 'bpv' | 'enforcement' | 'checklist';

export const EditingEthicsView: React.FC<EditingEthicsViewProps> = ({
  user,
  onNavigate,
  onOpenEditor,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab || 'principles');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [dossierDoc, setDossierDoc] = useState<DossierDocType>('irregularidades');

  // Sync activeTab when initialTab changes from parent
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Interactive Checklist State
  const [checklistAnswers, setChecklistAnswers] = useState<{ [key: string]: boolean | null }>({
    q1_source: null,
    q2_neutrality: null,
    q3_living_person: null,
    q4_private_data: null,
    q5_minors: null,
    q6_copyright: null,
  });

  const handleCopyShareUrl = () => {
    const url = `${window.location.origin}/?uid=Special:EditingEthics`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    });
  };

  const resetChecklist = () => {
    setChecklistAnswers({
      q1_source: null,
      q2_neutrality: null,
      q3_living_person: null,
      q4_private_data: null,
      q5_minors: null,
      q6_copyright: null,
    });
  };

  // Checklist score calculation
  const isChecklistComplete = Object.values(checklistAnswers).every((v) => v !== null);
  const isChecklistApproved =
    checklistAnswers.q1_source === true &&
    checklistAnswers.q2_neutrality === true &&
    checklistAnswers.q3_living_person === true &&
    checklistAnswers.q4_private_data === false && // Must NOT contain private data
    checklistAnswers.q5_minors === false && // Must NOT expose minors
    checklistAnswers.q6_copyright === true;

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in select-none pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded-xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-center shadow-md shrink-0 ring-4 ring-blue-50 dark:ring-blue-950/40">
              <Scale size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Special:EditingEthics
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  LGPD & GDPR Compliant
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  Marco Civil da Internet
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif-heading text-slate-900 dark:text-white">
                Regras de Ética de Edição, Adição e Contribuição
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Diretrizes normativas fundamentadas na <strong>LGPD (Lei nº 13.709/2018 - Brasil)</strong>, no{' '}
                <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong> e no{' '}
                <strong>Regulamento Geral sobre a Proteção de Dados da União Europeia (GDPR - Regulamento UE 2016/679)</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleCopyShareUrl}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/70 transition flex items-center gap-1.5 cursor-pointer"
              title="Copiar link permanente desta política"
            >
              {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedUrl ? 'Link Copiado!' : 'Compartilhar'}</span>
            </button>

            <button
              onClick={onOpenEditor}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Criar / Editar Artigo</span>
            </button>
          </div>
        </div>

        {/* Search Bar in Policies */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar em regras, artigos da lei ou condutas..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Válido para todos os colaboradores (anônimos, registrados e administradores).</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('principles')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'principles'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen size={14} />
          <span>1. Princípios de Contribuição</span>
        </button>

        <button
          onClick={() => setActiveTab('lgpd')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'lgpd'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck size={14} />
          <span>2. Conformidade LGPD (Brasil)</span>
        </button>

        <button
          onClick={() => setActiveTab('gdpr')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'gdpr'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock size={14} />
          <span>3. Leis Européias de Dados (GDPR, DSA, DMA, AI Act)</span>
        </button>

        <button
          onClick={() => setActiveTab('free_expression')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'free_expression'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe size={14} />
          <span>4. Liberdade de Expressão Internacional (DUDH & PIDCP)</span>
        </button>

        <button
          onClick={() => setActiveTab('bpv')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'bpv'
              ? 'bg-purple-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck size={14} />
          <span>5. Biografias de Pessoas Vivas</span>
        </button>

        <button
          onClick={() => setActiveTab('enforcement')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'enforcement'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Gavel size={14} />
          <span>6. Sanções & Moderação</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-amber-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award size={14} />
          <span>7. Checklist do Editor</span>
        </button>
      </div>

      {/* TAB 1: PRINCÍPIOS FUNDAMENTAIS DE CONTRIBUIÇÃO */}
      {activeTab === 'principles' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                1. Pilares Éticos da Contribuição Enciclopédica
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              A <strong>WikiWorldWeb (WazzimaGiygg)</strong> é uma enciclopédia pública colaborativa regida pelo princípio da busca desinteressada pelo conhecimento verdadeiro. Todos os usuários que submetem edições, criam novos verbetes ou participam de páginas de discussão assumem o compromisso ético de obedecer aos pilares descritos a seguir:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <CheckCircle2 size={16} />
                  <span>Princípio da Boa-Fé Editorial</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Presume-se que os colaboradores agem com o intuito de aprimorar a enciclopédia. Discordâncias de conteúdo devem ser resolvidas com civilidade, argumentos racionais fundamentados em fontes e sem ataques ad hominem ou sarcasmo.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <Scale size={16} />
                  <span>Ponto de Vista Neutro (NPOV)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Os artigos devem representar todas as visões significativas publicadas por fontes confiáveis, de forma proporcional e sem tomar partido. É estritamente vedada a utilização da enciclopédia como palanque ideológico ou ferramenta de propaganda.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <FileText size={16} />
                  <span>Verificabilidade e Fontes Confiáveis</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Qualquer afirmação controversa, biográfica ou técnica deve ser respaldada por fontes secundárias reputadas e independentes (livros acadêmicos, periódicos científicos e veículos de imprensa com conselho editorial reconhecido). É proibida a <em>pesquisa inédita</em>.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                  <AlertTriangle size={16} />
                  <span>Conflito de Interesses & Edição Paga</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Editar páginas sobre si mesmo, sua empresa, clientes ou adversários comerciais/políticos exige declaração formal de conflito de interesse. Edições promocionais veladas ou pagas não declaradas resultam em bloqueio sumário.
                </p>
              </div>
            </div>

            {/* Copyright & Open Licensing */}
            <div className="p-4 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2 mt-2">
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 font-serif-heading">
                <HeartHandshake size={15} /> Licenciamento Livre e Direitos Autorais
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Ao publicar na WikiWorldWeb, você concorda irrevogavelmente em licenciar o seu trabalho sob a licença{' '}
                <strong>Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0)</strong> e{' '}
                <strong>GNU General Public License v3.0 (GPLv3)</strong>. É estritamente proibido copiar textos protegidos por direitos autorais sem permissão explícita ou fora dos limites do direito de citação legal (Lei de Direitos Autorais nº 9.610/1998, Art. 46).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONFORMIDADE COM A LGPD (BRASIL) */}
      {activeTab === 'lgpd' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                2. Diretrizes Mandatórias sob a LGPD (Lei nº 13.709/2018)
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              A Lei Geral de Proteção de Dados Pessoais (LGPD) protege os direitos fundamentais de liberdade, privacidade e o livre desenvolvimento da personalidade da pessoa natural. Todo colaborador que adiciona informações sobre cidadãos ou figuras públicas na enciclopédia está sujeito às seguintes obrigações intransponíveis:
            </p>

            {/* Dossiê Oficial em PDF de Violações */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 via-slate-50 to-amber-50 dark:from-rose-950/40 dark:via-slate-900 dark:to-amber-950/40 border border-rose-300 dark:border-rose-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1.5 py-0.2 rounded">
                        Documento Oficial
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.2 rounded">
                        LGPD • GDPR • Marco Civil
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-serif-heading mt-0.5">
                      Dossiê: Irregularidades da Wikipédia e Wikimedia Foundation
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setDossierDoc('irregularidades');
                      setIsDossierModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <BookOpen size={12} />
                    <span>Ler Dossiê</span>
                  </button>

                  <a
                    href="/Irregularidades%20da%20Wikip%C3%A9dia%20e%20Wikimedia%20Foundation.pdf"
                    download="Irregularidades da Wikipédia e Wikimedia Foundation.pdf"
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <Download size={12} />
                    <span>Baixar PDF (23 KB)</span>
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Relatório técnico detalhado com as irregularidades materiais cometidas pela Wikimedia Foundation: desrespeito ao sigilo de conexão do Marco Civil (Arts. 10 e 15), descumprimento do Art. 18 da LGPD (votações vexatórias e Efeito Streisand) e recusa de atendimento a ordens judiciais brasileiras.
              </p>
            </div>

            {/* Dossiê Especial: Calúnia por parte de Chronus V2 */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 dark:from-red-950/40 dark:via-rose-950/30 dark:to-orange-950/40 border border-red-300 dark:border-red-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-rose-700 to-red-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Scale size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 px-1.5 py-0.2 rounded">
                        Dossiê 47 Páginas (V2)
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                        Código Penal & UCOC
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-serif-heading mt-0.5">
                      Dossiê Especial: Calúnia por parte de Chronus (Crimes contra a Honra & Stalking na Wikipédia)
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setDossierDoc('chronus');
                      setIsDossierModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <BookOpen size={12} />
                    <span>Ler Dossiê V2</span>
                  </button>

                  <a
                    href="/Cal%C3%BAnia%20por%20parte%20de%20Chronus%20V2.pdf"
                    download="Calúnia por parte de Chronus V2.pdf"
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <Download size={12} />
                    <span>Baixar PDF (V2)</span>
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Estudo de caso e representação jurídica documental de 47 páginas que demonstra calúnia consumada (Art. 138 CP), difamação, stalking/perseguição cibernética (Art. 147-A CP), quebra de sigilo telemático e violação cabal do Código Universal de Conduta da Wikimedia Foundation (UCOC) pelo administrador Chronus.
              </p>
            </div>

            {/* Dossiê Especial 3: Apresentação Institucional (Accountability) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-pink-950/40 border border-purple-300 dark:border-purple-800 space-y-2 mt-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Presentation size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase bg-purple-100 dark:bg-purple-900/70 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded">
                        Dossiê de Apresentação
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                        15 Slides Executivos
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded">
                        Responsabilidade WMF
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-serif-heading mt-0.5">
                      Wikimedia Institutional Accountability Dossier: O Caso Chronus (15 Slides)
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setDossierDoc('apresentacao');
                      setIsDossierModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <BookOpen size={12} />
                    <span>Ler Apresentação</span>
                  </button>

                  <a
                    href="/Wikimedia_Institutional_Accountability_Dossier.pdf"
                    download="Wikimedia_Institutional_Accountability_Dossier.pdf"
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <Download size={12} />
                    <span>Baixar PDF (15 Slides)</span>
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Apresentação oficial de prestação de contas institucional abordando o caso do moderador Chronus, instrumentalização técnica, vazamento de correspondências confidenciais com a WMF e obrigações mandatórias do Digital Services Act europeu (DSA) e da LGPD brasileira.
              </p>
            </div>

            <div className="space-y-3">
              {/* Art. 5: Proibição de Doxxing */}
              <div className="p-4 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                    <UserX size={16} />
                    <span>TOLERÂNCIA ZERO PARA DOXXING (Exposição de Dados Privados)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                    INFRAÇÃO GRAVÍSSIMA
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  É terminantemente proibido publicar dados pessoais identificáveis de qualquer indivíduo que não possuam relação direta e imprescindível com a sua notoriedade enciclopédica, incluindo:
                </p>
                <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-0.5 font-mono">
                  <li>Números de documentos (CPF, RG, CNH, Passaporte, Título de Eleitor);</li>
                  <li>Endereços residenciais, condomínios ou rotas de deslocamento diário;</li>
                  <li>Telefones pessoais, números de WhatsApp ou e-mails privados;</li>
                  <li>Dados bancários, faturas, certidões de nascimento ou processos judiciais em segredo de justiça;</li>
                  <li>Placas de veículos, fotos de familiares sem notoriedade pública ou imagens íntimas.</li>
                </ul>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold pt-1">
                  A inserção de doxxing acarreta reversão imediata com expurgo de histórico (Oversight), bloqueio permanente da conta e encaminhamento de logs ao DPO e autoridades policiais conforme o Marco Civil da Internet (Art. 15).
                </p>
              </div>

              {/* Art. 11: Dados Pessoais Sensíveis */}
              <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <AlertTriangle size={16} />
                    <span>Art. 11 da LGPD: Tratamento de Dados Pessoais Sensíveis</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                    RIGOR MÁXIMO
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Informações sobre <strong>origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, dado referente à saúde ou à vida sexual, dado genético ou biométrico</strong> só podem constar na WikiWorldWeb se cumprirem cumulativamente:
                </p>
                <ol className="list-decimal pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <li>Serem objeto de <strong>declaração pública manifesta feita pelo próprio titular</strong> ou amplamente divulgadas em fontes oficiais primárias de interesse histórico comprovado;</li>
                  <li>Possuírem relevância direta para a biografia pública da personalidade retratada;</li>
                  <li>Não terem o propósito de discriminar, ultrajar ou expor desnecessariamente a intimidade pessoal do biografado.</li>
                </ol>
              </div>

              {/* Art. 14: Menores */}
              <div className="p-4 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                  <ShieldAlert size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Art. 14 da LGPD: Proteção Integral a Crianças e Adolescentes</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  O tratamento de dados de menores de 18 anos deve ser realizado com a máxima cautela e sempre no seu melhor interesse (Art. 14 da LGPD e Estatuto da Criança e do Adolescente - ECA). Filhos e parentes menores de figuras públicas não devem ser nominados ou ter suas fotos publicadas na WikiWorldWeb, a não ser que a criança ou adolescente possua notoriedade enciclopédica independente estabelecida por mérito próprio.
                </p>
              </div>

              {/* Art. 18: Direitos do Titular & Supressão de Histórico */}
              <div className="p-4 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Art. 18 da LGPD: Exercício dos Direitos do Titular e Supressão Editorial</span>
                  </div>
                  <button
                    onClick={() => onNavigate('mydata')}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Abrir Painel do Titular</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Qualquer indivíduo retratado na enciclopédia tem o direito de requerer correção de dados incompletos ou inexatos, anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a LGPD.
                </p>
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded border border-emerald-200 dark:border-emerald-800/80">
                  <strong>Canal Direto do Encarregado pelo Tratamento de Dados (DPO):</strong>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <code>pedrohenriquecardonaperes@gmail.com</code>
                    <span>•</span>
                    <a
                      href={formatExternalUrl("https://support.wazzimagiygg.com/")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Central de Tickets WazzimaGiygg</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEIS EUROPÉIAS DE DADOS E SUA IMPORTÂNCIA GLOBAL */}
      {activeTab === 'gdpr' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Lock size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                3. O Marco Regulatório Europeu de Dados e Sua Importância Global
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              A União Europeia estabeleceu-se como a principal vanguarda regulatória do ambiente digital contemporâneo. Através do arcabouço formado pelo <strong>GDPR (Regulamento UE 2016/679)</strong>, <strong>Digital Services Act (DSA - Reg. UE 2022/2065)</strong>, <strong>Digital Markets Act (DMA - Reg. UE 2022/1925)</strong> e o histórico <strong>Regulamento de Inteligência Artificial (EU AI Act - Reg. UE 2024/1689)</strong>, a Europa concebeu um modelo centrado na dignidade da pessoa humana, na soberania dos dados e na contenção dos abusos do capitalismo de vigilância.
            </p>

            {/* O EFEITO BRUXELAS */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs uppercase tracking-wider font-mono">
                <Globe size={15} className="text-blue-600 dark:text-blue-400" />
                <span>O "Efeito Bruxelas" (The Brussels Effect) e a Importância Mundial das Leis da UE</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Formulado pela jurista Anu Bradford (Columbia Law School), o <em>Efeito Bruxelas</em> demonstra como a União Europeia é capaz de unilateralmente regular os mercados globais sem recorrer a coerção militar ou tratados coercitivos. Devido ao poder de compra unificado de 450 milhões de cidadãos de alto poder aquisitivo e à exigência de que qualquer serviço oferecido a residentes europeus cumpra a legislação do bloco, as maiores empresas de tecnologia do mundo (Google, Apple, Microsoft, Meta, Amazon) adaptam sua arquitetura técnica de forma global para operar sob o padrão europeu, evitando custos operacionais decorrentes da fragmentação de produtos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900">
                  <strong className="block text-blue-800 dark:text-blue-300 font-mono">Padrão Ouro Mundial</strong>
                  <span className="text-slate-600 dark:text-slate-400">Inspirou a LGPD no Brasil, a CCPA na Califórnia, a POPIA na África do Sul e a APPI no Japão.</span>
                </div>
                <div className="p-2.5 rounded bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900">
                  <strong className="block text-indigo-800 dark:text-indigo-300 font-mono">Proteção à Autonomia</strong>
                  <span className="text-slate-600 dark:text-slate-400">Transfere o controle dos dados dos conglomerados privados de volta para as pessoas.</span>
                </div>
                <div className="p-2.5 rounded bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900">
                  <strong className="block text-purple-800 dark:text-purple-300 font-mono">Segurança Jurídica</strong>
                  <span className="text-slate-600 dark:text-slate-400">Garante ambiente de confiança e proíbe a arbitrariedade na moderação algorítmica.</span>
                </div>
              </div>
            </div>

            {/* QUADRO DE LEIS EUROPEIAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* 1. GDPR */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                    <Shield size={16} />
                    <span>GDPR (Regulamento UE 2016/679)</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 font-bold">
                    DADOS PESSOAIS
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O pilar fundamental da privacidade que elevou a proteção de dados a direito fundamental irrenunciável (Art. 8º da Carta de Direitos Fundamentais da UE):
                </p>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <li><strong>Princípios Nucleares (Art. 5º):</strong> Licitude, finalidade, minimização, exatidão, limitação da conservação, integridade/confidencialidade e prestação de contas (<em>accountability</em>).</li>
                  <li><strong>Direitos Invioláveis dos Titulares (Arts. 15-22):</strong> Acesso, retificação, apagamento (<em>direito ao esquecimento</em>), portabilidade e oposição a decisões automatizadas (<em>profiling</em>).</li>
                  <li><strong>Transferência Internacional (Capítulo V):</strong> Veda o envio de dados a países terceiros que não garantam nível adequado de proteção equivalente.</li>
                </ul>
              </div>

              {/* 2. DIGITAL SERVICES ACT (DSA) */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
                    <Building2 size={16} />
                    <span>Digital Services Act (DSA - Reg. UE 2022/2065)</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200 font-bold">
                    PLATAFORMAS & RISCO
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Regula os intermediários de internet e impõe obrigações severas às Plataformas Online Muito Grandes (VLOPs, com &gt; 45 milhões de usuários na UE):
                </p>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <li><strong>Proibição de "Dark Patterns":</strong> Veda interfaces enganosas que manipulam ou coagem o usuário a fornecer consentimento indesejado.</li>
                  <li><strong>Proteção a Crianças e Categorias Sensíveis:</strong> Banimento total de anúncios direcionados com base em dados sensíveis (religião, sexualidade, saúde) ou direcionados a menores de 18 anos.</li>
                  <li><strong>Transparência Algorítmica e Due Process:</strong> Exige que plataformas expliquem os parâmetros de recomendação de feeds e concedam direito de apelação e fundamentação formal ao moderar publicações.</li>
                </ul>
              </div>

              {/* 3. DIGITAL MARKETS ACT (DMA) */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    <Scale size={16} />
                    <span>Digital Markets Act (DMA - Reg. UE 2022/1925)</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 font-bold">
                    ANTITRUSTE & GATEKEEPERS
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Combate monopólios e práticas anticoncorrenciais dos grandes guardiões de acesso digital (<em>Gatekeepers</em>):
                </p>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <li><strong>Veto ao Cruzamento Ilícito de Dados:</strong> Big Techs estão proibidas de fundir ou cruzar dados de usuários entre diferentes serviços (ex: WhatsApp, Instagram e Facebook) sem autorização autônoma e explícita.</li>
                  <li><strong>Fim do Autofavorecimento (Self-Preferencing):</strong> Plataformas não podem favorecer seus próprios aplicativos e serviços nos resultados de busca ou sistemas operacionais.</li>
                  <li><strong>Interoperabilidade Obrigatória:</strong> Assegura que serviços de mensageria concorrentes possam se comunicar entre si e garante portabilidade de dados em tempo real.</li>
                </ul>
              </div>

              {/* 4. EU AI ACT */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                    <Cpu size={16} />
                    <span>EU AI Act (Regulamento UE 2024/1689)</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/70 text-purple-800 dark:text-purple-200 font-bold">
                    INTELIGÊNCIA ARTIFICIAL
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O primeiro regulamento abrangente de IA do mundo, estruturado sobre quatro níveis proporcionais de risco:
                </p>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <li><strong>Risco Inaceitável (Banido):</strong> Pontuação social (social scoring), manipulação cognitiva de comportamento e reconhecimento biométrico remoto indiscriminado em tempo real.</li>
                  <li><strong>Alto Risco:</strong> IAs usadas em infraestruturas críticas, saúde, seleção de emprego e educação requerem auditorias severas, dados de treino sem viés e supervisão humana obrigatória.</li>
                  <li><strong>Transparência Obrigatória:</strong> Modelos generativos devem rotular <em>deepfakes</em>, incluir marcas d'água digitais e publicar resumos de obras protegidas por direitos autorais usadas no treino.</li>
                </ul>
              </div>
            </div>

            {/* Directive ePrivacy & Data Act */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 font-mono text-[11px]">
                  <Lock size={13} /> Diretiva ePrivacy (2002/58/CE & Atualizações)
                </div>
                <p className="text-[11px] leading-relaxed">
                  Regula o sigilo estrito de comunicações eletrônicas, metadados de conexão e o consentimento prévio para cookies e rastreadores. A WikiWorldWeb adota o princípio de rastreamento zero, sem cookies de vigilância publicitária.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 font-mono text-[11px]">
                  <Layers size={13} /> Data Act (Regulamento UE 2023/2854)
                </div>
                <p className="text-[11px] leading-relaxed">
                  Estabelece o compartilhamento justo de dados gerados por dispositivos conectados (IoT), proíbe cláusulas abusivas e facilita a troca entre provedores de nuvem para evitar o aprisionamento tecnológico (<em>vendor lock-in</em>).
                </p>
              </div>
            </div>

            {/* Dossiê de Violações ao GDPR pela Wikipédia */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-indigo-300 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <FileText size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Estudo de Caso & Dossiê: Violações da Wikipédia ao GDPR e Marco Civil
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Consulte o relatório oficial sobre a recusa do direito ao esquecimento e a transferência internacional ilícita de dados praticada pela Wikimedia Foundation.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsDossierModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <BookOpen size={12} />
                  <span>Ver Dossiê</span>
                </button>
                <a
                  href="/Irregularidades%20da%20Wikip%C3%A9dia%20e%20Wikimedia%20Foundation.pdf"
                  download="Irregularidades da Wikipédia e Wikimedia Foundation.pdf"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition flex items-center gap-1 shadow-xs"
                >
                  <Download size={12} />
                  <span>Baixar PDF</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIBERDADE DE EXPRESSÃO NO DIREITO INTERNACIONAL */}
      {activeTab === 'free_expression' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Globe size={18} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                4. Tratados Internacionais e a Salvaguarda da Liberdade de Expressão
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              A liberdade de expressão e de informação é o alicerce fundamental de toda sociedade aberta, democrática e plural. Consagrada no Direito Internacional dos Direitos Humanos, ela protege tanto o direito individual de emitir ideias e críticas quanto o direito coletivo da sociedade de receber informações verdadeiras sem censura de governos ou monopólios privados.
            </p>

            {/* ARTIGO 19 DUDH - O PRINCÍPIO MATRIZ */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 dark:from-blue-950/40 dark:via-sky-950/30 dark:to-indigo-950/40 border border-blue-300 dark:border-blue-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs uppercase tracking-wider font-mono">
                <BookOpen size={15} className="text-blue-600 dark:text-blue-400" />
                <span>Declaração Universal dos Direitos Humanos (DUDH / ONU 1948) — Artigo 19</span>
              </div>
              <blockquote className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/90 border-l-4 border-blue-600 text-xs text-slate-800 dark:text-slate-200 font-serif italic leading-relaxed">
                "Todo ser humano tem direito à liberdade de opinião e expressão; este direito inclui a liberdade de, sem interferência, ter opiniões e de procurar, receber e transmitir informações e ideias por quaisquer meios e independentemente de fronteiras."
              </blockquote>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                <div>
                  <strong className="text-slate-900 dark:text-white block font-mono">1. Sem Interferência</strong>
                  O foro íntimo, moral e intelectual do ser humano é intangível. Ninguém pode sofrer discriminação por suas convicções.
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-mono">2. Tríplice Alcance</strong>
                  Compreende procurar (pesquisar), receber (aprender) e transmitir (publicar) informações de qualquer natureza.
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-mono">3. Além de Fronteiras</strong>
                  O conhecimento humano é patrimônio universal da humanidade, superando barreiras geográficas ou bloqueios telemáticos.
                </div>
              </div>
            </div>

            {/* PIDCP E O TESTE TRIPARTITE */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <Scale size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Pacto Internacional sobre os Direitos Civis e Políticos (PIDCP / ONU 1966) — Art. 19</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold">
                  TRATADO VINCULANTE
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Ratificado pelo Brasil e por mais de 170 países, o Artigo 19 do PIDCP estabelece que a livre expressão acarreta deveres especiais. Para impedir que governos ou entidades privadas restrinjam arbitrariamente o debate público, o <strong>Parágrafo 3</strong> do Artigo 19 instituiu o mandatório <strong>Teste Tripartite de Restrições Legítimas</strong>:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 font-mono">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center text-[10px]">1</span>
                    Legalidade Estrita
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    A restrição deve estar prevista de forma expressa, prévia e inequívoca em <strong>lei formal</strong>, clara e acessível, sendo vedadas regras vagas ou censura por interpretação subjetiva de moderadores.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 flex items-center justify-center text-[10px]">2</span>
                    Finalidade Legítima
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    A medida só pode ter por objetivo exclusivo proteger: (a) o respeito aos direitos ou à reputação de outras pessoas; ou (b) a salvaguarda da segurança nacional, da ordem pública, da saúde ou moral públicas.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-[10px]">3</span>
                    Necessidade & Proporcionalidade
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    A limitação deve ser estritamente indispensável em uma sociedade democrática e constituir o meio <strong>menos gravoso possível</strong>, não podendo inviabilizar o próprio núcleo do direito de livre manifestação.
                  </p>
                </div>
              </div>

              {/* Comentário Geral 34 e Art 20 */}
              <div className="p-3 rounded bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-slate-700 dark:text-slate-300 space-y-1 mt-2">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 font-mono">
                  <AlertTriangle size={13} />
                  <span>Comentário Geral nº 34 do Comitê de Direitos Humanos da ONU (CCPR/C/GC/34) & Artigo 20:</span>
                </div>
                <p>
                  O Comitê da ONU declarou expressamente que o Artigo 19 se aplica à internet e proíbe bloqueios genéricos a provedores ou plataformas de enciclopédia. Paralelamente, o <strong>Artigo 20 do PIDCP</strong> impõe a proibição categórica de apologia à guerra e de qualquer manifestação de ódio nacional, racial ou religioso que configure <strong>incitação à discriminação, à hostilidade ou à violência</strong>.
                </p>
              </div>
            </div>

            {/* SISTEMA INTERAMERICANO & EUROPEU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Pacto de San José */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  <ShieldCheck size={16} />
                  <span>Convenção Americana (Pacto de San José da Costa Rica) — Art. 13</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O tratado regional mais rigoroso do mundo quanto à proibição da censura:
                </p>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <li><strong>Vedação Absoluta à Censura Prévia (Art. 13.2):</strong> O pensamento não pode ser submetido a filtros prévios de censura governamental ou privada. Eventuais excessos respondem apenas por responsabilidade civil ou penal ulterior fixada em lei.</li>
                  <li><strong>Proibição de Meios Indiretos (Art. 13.3):</strong> É nulo qualquer estratagema que limite a difusão de ideias pelo abuso de controles estatais ou corporativos sobre equipamentos, frequências ou plataformas de rede.</li>
                  <li><strong>Dimensão Social:</strong> A jurisprudência da Corte IDH reconhece que a sociedade inteira tem o direito de receber informações verídicas e plurais para formar sua consciência democrática.</li>
                </ul>
              </div>

              {/* Convenção Europeia */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  <Globe size={16} />
                  <span>Convenção Europeia dos Direitos Humanos (CEDH) — Art. 10</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  A salvaguarda da liberdade de expressão na jurisprudência do Tribunal Europeu dos Direitos Humanos (TEDH):
                </p>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <li><strong>Proteção a Ideias Provocativas (Caso Handyside):</strong> A livre expressão não protege apenas informações inofensivas, mas abrange expressamente aquelas que <em>"inquietam, chocam ou perturbam"</em> o Estado ou qualquer parcela da sociedade, pois tais são as exigências do pluralismo e da tolerância.</li>
                  <li><strong>Proteção Reforçada ao Jornalismo e Pesquisa:</strong> Discursos de interesse público e investigações históricas desfrutam da mais alta proteção jurídica contra ordens de silenciamento.</li>
                </ul>
              </div>
            </div>

            {/* HARMONIA ENTRE PRIVACIDADE E LIBERDADE DE EXPRESSÃO */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs uppercase tracking-wider font-mono">
                <Scale size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>A Harmonia Indispensável: A Privacidade como Alicerce da Liberdade de Expressão</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Ao contrário de uma falsa oposição frequentemente propagada, a <strong>privacidade (proteção de dados)</strong> e a <strong>liberdade de expressão</strong> não são direitos inimigos, mas pilares indissociáveis e complementares:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
                <div className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-900 space-y-1">
                  <strong className="block text-emerald-800 dark:text-emerald-300 font-mono">A Privacidade Protege a Livre Expressão</strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    Sem a proteção da intimidade, o sigilo de metadados e o anonimato de conexão contra a vigilância em massa ou perseguições (<em>doxxing</em>), editores, jornalistas, dissidentes e informantes (<em>whistleblowers</em>) sucumbem à autocensura. Garantir a privacidade técnica é a única forma de viabilizar a expressão corajosa e autêntica.
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-900 space-y-1">
                  <strong className="block text-teal-800 dark:text-teal-300 font-mono">O Limite contra a Difamação e o Arbítrio</strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    A liberdade de expressão não confere salvo-conduto para divulgar calúnias, falsas acusações de crimes ou dados pessoais sensíveis fora de contexto legítimo. O escrutínio de figuras públicas é salutar e indispensável, mas deve preservar a dignidade humana fundamental e o devido processo legal.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BIOGRAFIAS DE PESSOAS VIVAS (BPV) */}
      {activeTab === 'bpv' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <UserCheck size={18} className="text-purple-600 dark:text-purple-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                4. Política de Biografias de Pessoas Vivas (BPV)
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Artigos sobre indivíduos vivos exigem um grau reforçado de responsabilidade moral e jurídica. Informações negativas, controversas ou danosas à honra pessoal podem causar danos irreversíveis à vida real das pessoas e responsabilização civil aos infratores.
            </p>

            <div className="p-4 rounded-lg bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-3">
              <h3 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider font-mono">
                Mandamentos Invioláveis para Biografias de Pessoas Vivas:
              </h3>

              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0 mt-0.5 font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    <strong>Ônus da Prova e Remoção Imediata:</strong> O ônus da comprovação recai inteiramente sobre quem adiciona o conteúdo. Qualquer material controverso sem fonte confiável ou com fontes fracas sobre pessoas vivas deve ser <em>removido imediatamente</em> sem aguardar discussão.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0 mt-0.5 font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <strong>Presunção de Inocência e Denúncias em Andamento:</strong> Não relate suspeitas ou investigações policiais como se fossem condenações consumadas. Noticiar processos em andamento exige citar expressamente a posição da defesa e o estado processual verificado em fontes primárias ou grande imprensa.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0 mt-0.5 font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    <strong>Pessoas de Notoriedade Acidental ou Temporária:</strong> Cidadãos comuns que se tornaram conhecidos exclusivamente por estarem envolvidos em um acidente, crime ou meme passageiro não devem ter verbetes biográficos individuais completos, devendo o fato ser descrito no contexto do evento.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0 mt-0.5 font-bold text-[10px]">
                    4
                  </div>
                  <div>
                    <strong>Críticas com Proporcionalidade:</strong> O espaço dedicado a polêmicas não pode desfigurar o verbete de modo a transformá-lo em peça acusatória. A crítica deve ser contextualizada e proporcional às realizações do biografado.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SANÇÕES, MODERAÇÃO & OVERSIGHT */}
      {activeTab === 'enforcement' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Gavel size={18} className="text-rose-600 dark:text-rose-400" />
              <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                5. Tipificação de Infrações, Consequências e Oversight
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              A WikiWorldWeb adota mecanismos de resposta graduada e rigorosa moderação para proteger a enciclopédia e resguardar os direitos dos cidadãos:
            </p>

            <div className="space-y-3">
              {/* Níveis de infração */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Infração Leve</span>
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      NÍVEL 1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Erros de formatação, falta não intencional de fontes ou edições opinativas pontuais.
                  </p>
                  <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 pt-1">
                    Consequência: Reversão com aviso pedagógico na página de discussão.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Infração Grave</span>
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      NÍVEL 2
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Guerra de edições persistente, vandalismo recorrente, violação de direitos autorais ou assédio editorial.
                  </p>
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 pt-1">
                    Consequência: Bloqueio temporário (24h a 30 dias) e proteção de página.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200">Infração Gravíssima</span>
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-rose-600 text-white">
                      NÍVEL 3
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Doxxing, exposição de dados de menores, difamação criminosa, ameaças de morte ou exploração ilícita de dados.
                  </p>
                  <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 pt-1">
                    Consequência: Bloqueio perpétuo, Supressão (Oversight) e denúncia criminal.
                  </p>
                </div>
              </div>

              {/* Oversight explanation */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <EyeOff size={16} className="text-rose-600" />
                  <span>Protocolo de Supressão e Expurgamento (Oversight)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ao contrário da reversão comum, a ferramenta de <strong>Supressão (Oversight)</strong> remove a versão permanentemente da visualização pública e dos registros de histórico comuns, impedindo que dados violadores de privacidade continuem acessíveis a leitores. O Oversight é acionado compulsoriamente em casos de vazamento de dados pessoais ou infrações à LGPD/GDPR.
                </p>
              </div>

              {/* Navigation links to Dispute / Emergency */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => onNavigate('emergency-contact')}
                  className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertOctagon size={13} className="text-red-600 animate-pulse" />
                  <span>Plantão de Emergência (Doxxing / Risco Iminente)</span>
                </button>

                <button
                  onClick={() => onNavigate('ucoc')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert size={13} className="text-indigo-600" />
                  <span>Canal de Denúncias Formais (UCoC)</span>
                </button>

                <button
                  onClick={() => onNavigate('arbitration')}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Gavel size={13} className="text-purple-600" />
                  <span>Conselho de Arbitragem (ArbCom)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CHECKLIST INTERATIVO DO EDITOR ÉTICO */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-600 dark:text-amber-400" />
                <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                  6. Checklist Interativo de Conformidade Editorial
                </h2>
              </div>
              <button
                onClick={resetChecklist}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Reiniciar Checklist
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Antes de gravar ou publicar qualquer artigo, responda às 6 perguntas rápidas abaixo para verificar se a sua contribuição cumpre os padrões da LGPD, GDPR e integridade enciclopédica:
            </p>

            <div className="space-y-3">
              {/* Q1 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    1. Esta edição está embasada em fontes confiáveis e verificáveis (livros, jornais ou periódicos acadêmicos)?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q1_source: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q1_source === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q1_source: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q1_source === false
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q1_source === false && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ Artigos sem fontes verificáveis violam a política de Verificabilidade e serão removidos.
                  </p>
                )}
              </div>

              {/* Q2 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    2. O texto foi escrito em tom estritamente neutro, sem juízos de valor nem linguagem promocional?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q2_neutrality: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q2_neutrality === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q2_neutrality: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q2_neutrality === false
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q2_neutrality === false && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ Textos com viés parcial, promocional ou agressivo violam o Princípio da Neutralidade (NPOV).
                  </p>
                )}
              </div>

              {/* Q3 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    3. Se o texto menciona uma pessoa viva, as afirmações polêmicas possuem citações diretas a fontes de alto padrão?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q3_living_person: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q3_living_person === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim / Não se aplica
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q3_living_person: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q3_living_person === false
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q3_living_person === false && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ Biografias de pessoas vivas (BPV) exigem rigor absoluto para evitar calúnia e difamação.
                  </p>
                )}
              </div>

              {/* Q4 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    4. O texto contém dados pessoais privados (CPF, endereço residencial, telefone pessoal ou processos sob segredo)?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q4_private_data: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q4_private_data === true
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q4_private_data: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q4_private_data === false
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q4_private_data === true && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                    🛑 ATENÇÃO: A publicação de dados privados é ilegal conforme a LGPD e resultará em bloqueio imediato e supressão de versão.
                  </p>
                )}
              </div>

              {/* Q5 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    5. O artigo expõe nomes ou imagens de crianças e adolescentes (menores de 18 anos) sem notoriedade própria?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q5_minors: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q5_minors === true
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q5_minors: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q5_minors === false
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q5_minors === true && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                    🛑 ATENÇÃO: É proibido expor menores conforme o Art. 14 da LGPD e o ECA. Remova a identificação do menor antes de salvar.
                  </p>
                )}
              </div>

              {/* Q6 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    6. O texto é de sua própria autoria ou foi reescrito com suas próprias palavras sem cópia não autorizada?
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q6_copyright: true }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q6_copyright === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setChecklistAnswers((prev) => ({ ...prev, q6_copyright: false }))}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        checklistAnswers.q6_copyright === false
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {checklistAnswers.q6_copyright === false && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ Textos copiados violam direitos autorais e licenças livres e serão apagados sumariamente.
                  </p>
                )}
              </div>
            </div>

            {/* Checklist Evaluation Verdict */}
            {isChecklistComplete && (
              <div
                className={`p-4 rounded-xl border transition animate-in fade-in ${
                  isChecklistApproved
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  {isChecklistApproved ? (
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-rose-600 shrink-0" />
                  )}
                  <h3 className="font-bold text-sm">
                    {isChecklistApproved
                      ? 'Parabéns! Sua edição atende aos padrões de ética e privacidade.'
                      : 'Atenção: A sua contribuição viola uma ou mais regras de privacidade ou integridade.'}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed">
                  {isChecklistApproved
                    ? 'Você está pronto para publicar com segurança na WikiWorldWeb em perfeita conformidade com a LGPD e o GDPR.'
                    : 'Por favor, revise o seu rascunho, remova dados sensíveis ou privados e certifique-se de que todas as alegações possuem fontes idôneas antes de submeter.'}
                </p>
                {isChecklistApproved && (
                  <div className="mt-3">
                    <button
                      onClick={onOpenEditor}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>Ir para o Editor de Artigos</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Callout for Support and DPO */}
      <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <LifeBuoy size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="text-slate-700 dark:text-slate-300">
            Dúvidas sobre conformidade ou solicitações de titulares de dados? Entre em contato com o DPO:{' '}
            <code className="text-slate-900 dark:text-white font-bold">pedrohenriquecardonaperes@gmail.com</code>
          </div>
        </div>
        <a
          href={formatExternalUrl("https://support.wazzimagiygg.com/")}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shrink-0 flex items-center gap-1 shadow-xs whitespace-nowrap cursor-pointer"
        >
          <span>Central de Tickets & Suporte</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Modal de Leitura Integral do Dossiê e Visualização do PDF */}
      <IrregularidadesDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        initialDocument={dossierDoc}
      />
    </div>
  );
};
