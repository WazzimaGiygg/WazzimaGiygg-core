import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Award,
  BookOpen,
  Code2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Headphones,
  ArrowRight,
  Globe2,
  Scale,
  Users,
  Terminal,
  Newspaper,
  Download,
  Presentation,
} from 'lucide-react';
import { ViewMode } from '../types';
import { updateSEO } from '../utils/seoManager';
import { formatExternalUrl } from '../utils/linkUtils';
import { IrregularidadesDossierModal, DossierDocType } from './IrregularidadesDossierModal';
import { WazzimaGiyggTimeline } from './WazzimaGiyggTimeline';

interface WazzimaGiyggProfileViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenEditor?: () => void;
  onSelectArticle?: (articleId: string) => void;
}

export const WazzimaGiyggProfileView: React.FC<WazzimaGiyggProfileViewProps> = ({
  onNavigate,
  onOpenEditor,
  onSelectArticle,
}) => {
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [dossierDoc, setDossierDoc] = useState<DossierDocType>('irregularidades');
  const [dossierTab, setDossierTab] = useState<'text' | 'pdf' | 'table'>('text');

  const handleOpenDossier = (doc?: DossierDocType, tab?: 'text' | 'pdf' | 'table') => {
    if (doc) setDossierDoc(doc);
    if (tab) setDossierTab(tab);
    setIsDossierModalOpen(true);
  };

  useEffect(() => {
    updateSEO({
      view: 'wazzimagiygg',
      title: 'WazzimaGiygg - Portal Oficial, Projetos e A Verdade sobre o Caso Wikipédia',
      description:
        'Conheça os projetos oficiais de WazzimaGiygg (WikiWorldWeb, Wiki-alternative, Dossiê A Verdade, Central de Suporte) e o esclarecimento factual sobre o Caso Wazzimagiygg na Wikipédia.',
      breadcrumbs: [
        { name: 'Início', url: '/?uid=hub' },
        { name: 'WazzimaGiygg (Projetos & Dossiê Oficial)', url: '/?uid=wazzimagiygg' },
      ],
    });
  }, []);

  return (
    <article className="max-w-5xl mx-auto px-4 py-8 space-y-10 font-sans text-slate-800 dark:text-slate-200">
      {/* Hero Header */}
      <header className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-800/60 shadow-xl overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-semibold">
            <Award size={14} className="text-amber-400" />
            <span>Perfil Oficial do Desenvolvedor & Criador da WikiWorldWeb</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            WazzimaGiygg
          </h1>

          {/* Frase Principal da Wiki */}
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-inner">
            <p className="font-serif italic font-bold text-sm sm:text-base text-cyan-200 tracking-wide">
              «Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»
            </p>
            <p className="text-xs text-blue-200/80 mt-0.5 font-sans">
              <strong className="text-white font-medium">Frase Principal da Wiki</strong> • "Não, o Tempo não é o senhor do conhecimento!"
            </p>
          </div>

          <p className="text-base sm:text-lg text-blue-100/90 leading-relaxed">
            Desenvolvedor independente de software livre, idealizador da <strong>WikiWorldWeb</strong> e autor do dossiê 
            <strong> "A Verdade"</strong>. Defensor da descentralização do conhecimento, da transparência editorial contra
            burocracias corporativas e da privacidade digital conforme a LGPD.
          </p>

          {/* Quick External Links Row */}
          <div className="pt-3 flex flex-wrap gap-2.5">
            <a
              href={formatExternalUrl('https://wazzimagiygg.com/')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Globe2 size={14} />
              <span>wazzimagiygg.com</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>

            <a
              href={formatExternalUrl('https://wazzimagiygg.com/averdade/')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <AlertTriangle size={14} />
              <span>Dossiê A Verdade</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>

            <a
              href={formatExternalUrl('https://support.wazzimagiygg.com/')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Headphones size={14} />
              <span>Central de Suporte</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>

            <a
              href={formatExternalUrl('https://github.com/WazzimaGiygg/Wiki-alternative')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Code2 size={14} />
              <span>GitHub (Wiki-alternative)</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>

            {onSelectArticle && (
              <button
                onClick={() => onSelectArticle('curated-wazzimagiygg-biography')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
              >
                <BookOpen size={14} />
                <span>Ler Artigo Enciclopédico Completo sobre WazzimaGiygg</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Clarification & Wikipedia Case Dossier */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-amber-700/60 shadow-sm space-y-6">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400">
                <Scale size={18} />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Esclarecimento Factual & Resposta Pública
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              A Verdade sobre o "Caso Wazzimagiygg" da Wikipédia
            </h2>
          </div>

          <a
            href={formatExternalUrl('https://wazzimagiygg.com/averdade/')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
          >
            <FileText size={14} />
            <span>Ver Dossiê Completo com Provas</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Fact Sheet vs Wikipedia Page */}
        <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>Sobre o link difamatório na Wikipédia em língua portuguesa:</span>
            </div>
            <p className="text-xs">
              A página da Wikipédia intitulada <em>"Wikipédia:Pedidos a verificadores/Caso/Wazzimagiygg"</em> decorreu
              de um processo arbitrário e unilateral conduzido por administradores locais da Wikipédia lusófona, que usaram
              ferramentas de verificação de IP (CheckUser) de maneira política e desprovida de fundamentação técnica válida,
              sem concessão de contraditório ou ampla defesa ao editor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-2">
              <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle size={15} />
                <span>O que ocorreu na Wikipédia (Abusos Administrativos)</span>
              </h3>
              <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-300">
                <li>
                  <strong>Ausência de Ampla Defesa:</strong> Pedidos de verificação e bloqueios impostos sumariamente sem oportunidade de manifestação formal.
                </li>
                <li>
                  <strong>Suposições sem Evidência Técnica:</strong> Atribuição de IPs públicos e redes compartilhadas a um único usuário sem laudos transparentes.
                </li>
                <li>
                  <strong>Reversões em Massa de Edições Válidas:</strong> Eliminação de correções factuais e referências legítimas por mera perseguição de nome de usuário.
                </li>
                <li>
                  <strong>Falta de Auditoria Externa:</strong> Decisões tomadas em grupos fechados sem recurso efetivo a um tribunal neutro.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-2">
              <h3 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>A Resposta Construtiva e a Criação da WikiWorldWeb</span>
              </h3>
              <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-300">
                <li>
                  <strong>Dossiê Aberto e Documentado:</strong> Publicação cronológica de capturas de tela e evidências em <a href={formatExternalUrl('https://wazzimagiygg.com/averdade/')} target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600 dark:text-blue-400">wazzimagiygg.com/averdade/</a>.
                </li>
                <li>
                  <strong>Nascimento da WikiWorldWeb:</strong> Em vez de disputas infindáveis, criação de uma enciclopédia livre 100% aberta, sem anúncios invasivos e sem monopólio de panelas burocráticas.
                </li>
                <li>
                  <strong>Conselho de Arbitragem (ArbCom) Transparente:</strong> Sistema com registros públicos e garantias constitucionais de defesa e LGPD.
                </li>
                <li>
                  <strong>Tecnologia Moderna:</strong> Código aberto em React/TypeScript disponível para toda a comunidade no GitHub.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Timeline Component for Dossier A Verdade */}
      <WazzimaGiyggTimeline onOpenDossier={handleOpenDossier} />

      {/* Official Projects Showcase */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Ecossistema de Projetos Oficiais de WazzimaGiygg
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Projetos concebidos, mantidos e disponibilizados abertamente para democratizar o acesso à informação e garantir privacidade digital.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Project 1: WikiWorldWeb */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <BookOpen size={18} />
                </span>
                <span className="text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  Principal
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                WikiWorldWeb - A Enciclopédia Livre
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                A plataforma enciclopédica colaborativa, ultrarrápida, sem anúncios invasivos, com 11 temas visuais,
                modo offline e suporte a Smart TV. Alternativa direta à Wikipédia e ao Fandom.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => onNavigate('hub')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Explorar WikiWorldWeb</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Project 2: Dossiê A Verdade */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <AlertTriangle size={18} />
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  Dossiê Oficial
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Dossiê "A Verdade" (wazzimagiygg.com/averdade/)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Investigação pormenorizada e documento público que expõe as perseguições burocráticas,
                falhas do sistema de verificadores da Wikipédia e os bastidores dos abusos de poder.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={formatExternalUrl('https://wazzimagiygg.com/averdade/')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                <span>Acessar Documento</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Project 3: Central de Suporte */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Headphones size={18} />
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Atendimento
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Central de Suporte (support.wazzimagiygg.com)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Central de abertura de tickets, atendimento à comunidade, suporte técnico
                e requisições de privacidade de dados em estrita conformidade com a LGPD.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={formatExternalUrl('https://support.wazzimagiygg.com/')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                <span>Abrir Ticket / Suporte</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Project 4: Wiki-alternative (GitHub) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Code2 size={18} />
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                  Open Source
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                GitHub: WazzimaGiygg/Wiki-alternative
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Repositório oficial de código aberto contendo o código-fonte, arquitetura modular e
                ferramentas de wikitexto desenvolvidas pela comunidade.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={formatExternalUrl('https://github.com/WazzimaGiygg/Wiki-alternative')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                <span>Ver Código no GitHub</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Project 5: Jornal WazzimaGiygg */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <Newspaper size={18} />
                </span>
                <span className="text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                  Jornalismo
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Jornal WazzimaGiygg (jornal.wazzimagiygg.com)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Portal de notícias independentes, apurações em tempo real e investigações sobre política,
                economia e geopolítica. Integrado à enciclopédia em modo de visualização.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigate('news')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
              >
                <Newspaper size={12} />
                <span>Ler Notícias no Wiki</span>
              </button>
              <a
                href={formatExternalUrl('https://jornal.wazzimagiygg.com/')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                <span>Site Oficial</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Project 6: Dossiê Irregularidades da Wikipédia (PDF) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-800 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <FileText size={18} />
                </span>
                <span className="text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                  PDF Oficial (LGPD & Marco Civil)
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Dossiê: Irregularidades da Wikipédia e Wikimedia Foundation
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Documento técnico-jurídico que analisa as violações da LGPD (Lei 13.709/2018), Marco Civil da Internet (Lei 12.965/2014) e GDPR europeu cometidas pela Wikipédia e Wikimedia Foundation.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setDossierDoc('irregularidades');
                  setIsDossierModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
              >
                <BookOpen size={12} />
                <span>Ler Dossiê</span>
              </button>
              <a
                href="/Irregularidades%20da%20Wikip%C3%A9dia%20e%20Wikimedia%20Foundation.pdf"
                download="Irregularidades da Wikipédia e Wikimedia Foundation.pdf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                <Download size={12} />
                <span>Baixar PDF (23 KB)</span>
              </a>
            </div>
          </div>

          {/* Project 7: Dossiê Especial - Calúnia por parte de Chronus V2 (PDF) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-300 dark:border-red-800 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                  <Scale size={18} />
                </span>
                <span className="text-[10px] font-mono font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                  Dossiê 47 Págs (V2)
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Dossiê: Calúnia por parte de Chronus (Violações na Wikipédia)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dossiê jurídico detalhado de 47 páginas que comprova crimes contra a honra (Arts. 138-140 CP), perseguição/stalking (Art. 147-A CP), quebra de sigilo de IP e violações graves ao Código Universal de Conduta da Wikimedia (UCOC) cometidas pelo moderador Chronus.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setDossierDoc('chronus');
                  setIsDossierModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition cursor-pointer"
              >
                <BookOpen size={12} />
                <span>Ler Dossiê V2</span>
              </button>
              <a
                href="/Cal%C3%BAnia%20por%20parte%20de%20Chronus%20V2.pdf"
                download="Calúnia por parte de Chronus V2.pdf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                <Download size={12} />
                <span>Baixar PDF (V2)</span>
              </a>
            </div>
          </div>

          {/* Project 8: Dossiê de Apresentação Oficial (15 Slides) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Presentation size={18} />
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                  Apresentação 15 Slides
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Dossiê de Apresentação: Wikimedia Institutional Accountability
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Apresentação executiva em 15 lâminas analisando a responsabilidade institucional da Wikimedia Foundation perante o Caso Chronus, demonstrando instrumentalização de ferramentas, quebra de sigilo de denúncias e infrações ao Marco Civil e DSA europeu.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setDossierDoc('apresentacao');
                  setIsDossierModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer"
              >
                <BookOpen size={12} />
                <span>Ler Apresentação</span>
              </button>
              <a
                href="/Wikimedia_Institutional_Accountability_Dossier.pdf"
                download="Wikimedia_Institutional_Accountability_Dossier.pdf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                <Download size={12} />
                <span>Baixar PDF (15 Slides)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SEO FAQ Section targeting Google Search Snippets for "WazzimaGiygg" */}
      <section className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Perguntas Frequentes sobre WazzimaGiygg e a WikiWorldWeb
          </h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Quem é WazzimaGiygg?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              WazzimaGiygg é o desenvolvedor e idealizador da <strong>WikiWorldWeb</strong>, uma enciclopédia livre,
              gratuita e sem anúncios comerciais invasivos. É também o autor do dossiê <em>"A Verdade"</em> e gestor
              do portal <a href={formatExternalUrl('https://wazzimagiygg.com/')} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-bold underline">wazzimagiygg.com</a>.
            </p>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              O que significa o resultado "Wikipédia:Pedidos a verificadores/Caso/Wazzimagiygg"?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Trata-se de uma página interna gerada por burocratas da Wikipédia em língua portuguesa como represália
              a contestações editoriais legítimas. O caso é amplamente refutado por documentos, históricos e capturas
              de tela públicas no dossiê <a href={formatExternalUrl('https://wazzimagiygg.com/averdade/')} target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 font-bold underline">wazzimagiygg.com/averdade/</a>,
              que motivou a fundação da WikiWorldWeb como alternativa imune à censura e a panelas burocráticas.
            </p>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Quais os canais oficiais para falar com WazzimaGiygg ou sua equipe?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              O canal oficial de suporte e contato direto é a <a href={formatExternalUrl('https://support.wazzimagiygg.com/')} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold underline">Central de Atendimento WazzimaGiygg (support.wazzimagiygg.com)</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 text-center space-y-3 shadow-md">
        <h2 className="text-lg sm:text-xl font-extrabold">
          Conheça a Enciclopédia Livre Criada por WazzimaGiygg
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto">
          Explore o conhecimento livre, crie novos artigos e colabore sem censura na WikiWorldWeb.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('hub')}
            className="px-5 py-2.5 rounded-xl bg-white text-blue-800 font-bold text-xs sm:text-sm hover:bg-blue-50 transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <BookOpen size={15} />
            <span>Página Principal da WikiWorldWeb</span>
          </button>
          {onSelectArticle && (
            <button
              onClick={() => onSelectArticle('curated-wazzimagiygg-biography')}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs sm:text-sm transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <BookOpen size={15} />
              <span>Ler Artigo Completo na Enciclopédia</span>
            </button>
          )}
          {onOpenEditor && (
            <button
              onClick={() => onOpenEditor()}
              className="px-5 py-2.5 rounded-xl bg-blue-500/40 hover:bg-blue-500/60 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <FileText size={15} />
              <span>Contribuir no Editor</span>
            </button>
          )}
        </div>
      </footer>

      {/* Modal de Leitura Integral do Dossiê e Visualização do PDF */}
      <IrregularidadesDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        initialDocument={dossierDoc}
        initialTab={dossierTab}
      />
    </article>
  );
};
