import React, { useEffect, useState } from 'react';
import {
  Check,
  X,
  ShieldCheck,
  Zap,
  EyeOff,
  Sparkles,
  ArrowRight,
  BookOpen,
  Edit3,
  Globe2,
  Tv,
  HelpCircle,
  Award,
  Layers,
  HeartHandshake,
  Bot,
  BookMarked,
  Cpu,
  FileText,
  UserCheck,
  GraduationCap,
  Library,
  Smartphone,
  Monitor,
  Lock,
  Download,
  Scale,
  Presentation,
} from 'lucide-react';
import { ViewMode } from '../types';
import { updateSEO } from '../utils/seoManager';
import { IrregularidadesDossierModal, DossierDocType } from './IrregularidadesDossierModal';

interface WikiCompetitorComparisonViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenEditor: () => void;
  onOpenGeminiChatbot?: () => void;
  onOpenGeminiNotebook?: () => void;
}

interface FeatureComparison {
  name: string;
  category: string;
  wikizero: boolean | string;
  wikipedia: boolean | string;
  fandom: boolean | string;
  mediawiki: boolean | string;
  wikidot: boolean | string;
  highlight?: boolean;
}

const COMPARISON_FEATURES: FeatureComparison[] = [
  {
    name: 'Gemini Notebook: Síntese Multifontes para Criação de Artigos',
    category: 'Inteligência Artificial & Pesquisa',
    wikizero: 'Nativo (Multifontes & Síntese)',
    wikipedia: 'Não (Processo Manual Rígido)',
    fandom: false,
    mediawiki: 'Não (Inexistente)',
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Assistente Gemini IA (Google AI Studio) Integrado',
    category: 'Inteligência Artificial & Redação',
    wikizero: 'Nativo (Chat, Wikitexto & Fatos)',
    wikipedia: 'Bloqueado por Burocracia',
    fandom: false,
    mediawiki: 'Inexistente',
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Direito LGPD: Solicitação & Controle de Nome Civil e Foto de Perfil',
    category: 'Privacidade & Proteção de Dados (LGPD)',
    wikizero: 'Nativo (Conforme LGPD)',
    wikipedia: 'Burocrático / Rígido',
    fandom: 'Sem Controle LGPD',
    mediawiki: 'Inexistente',
    wikidot: 'Não',
    highlight: true,
  },
  {
    name: 'Portal Unificado de Artigos Universitários (Estilo SciELO & Google Acadêmico)',
    category: 'Pesquisa Acadêmica & Universitária',
    wikizero: 'Nativo e Centralizado',
    wikipedia: 'Deletado por Notoriedade',
    fandom: false,
    mediawiki: 'Requer Servidor Próprio',
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Wiki de Livros Integrada (Fichas Catalográficas, ISBN e Resenhas)',
    category: 'Literatura & Biblioteca de Obras',
    wikizero: 'Integrada na Mesma Wiki',
    wikipedia: 'Exige Outro Site (Wikibooks)',
    fandom: 'Não',
    mediawiki: 'Não',
    wikidot: 'Não',
    highlight: true,
  },
  {
    name: 'App Universal Multiplataforma (Computador, Celular e Smart TV 10-Foot)',
    category: 'Multiplataforma & Acessibilidade',
    wikizero: 'PC, Celular e Smart TV',
    wikipedia: 'Apenas Mobile Limitado',
    fandom: 'Apenas Web Poluída',
    mediawiki: 'Apenas Web Legada',
    wikidot: 'Não',
    highlight: true,
  },
  {
    name: 'Ecossistema Centralizado em Uma Só Plataforma (Sem Dispersão em Sites Separados)',
    category: 'Arquitetura de Conhecimento',
    wikizero: 'Tudo no Mesmo Site',
    wikipedia: 'Fragmentado em 12+ Projetos',
    fandom: 'Ilhas Isoladas',
    mediawiki: 'Silos Independentes',
    wikidot: 'Isolado',
    highlight: true,
  },
  {
    name: 'Zero Anúncios Invasivos e Sem Vídeos Autoplay',
    category: 'Experiência de Leitura',
    wikizero: true,
    wikipedia: true,
    fandom: false,
    mediawiki: true,
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Carregamento Ultrarrápido (SPA Moderna & PWA)',
    category: 'Performance',
    wikizero: true,
    wikipedia: false,
    fandom: false,
    mediawiki: false,
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Temas Visuais Customizados (Minecraft, Roblox, REPO, Win95, etc.)',
    category: 'Personalização & Acessibilidade',
    wikizero: '11 Temas Nativos',
    wikipedia: 'Apenas Claro/Escuro',
    fandom: 'Tema Fixo Fandom',
    mediawiki: 'Skins Complexas PHP',
    wikidot: 'CSS Legado Rígido',
    highlight: true,
  },
  {
    name: 'Editor Wikitexto com Pré-visualização Instantânea',
    category: 'Edição & Colaboração',
    wikizero: true,
    wikipedia: 'Lento / Recarrega',
    fandom: 'Cheio de Banners',
    mediawiki: 'Requer Servidor LAMP',
    wikidot: 'Sintaxe Proprietária',
  },
  {
    name: 'Transparência Editorial e ArbCom Público Imparcial',
    category: 'Governança & Liberdade',
    wikizero: true,
    wikipedia: 'Panelas Históricas',
    fandom: 'Corporativo Centralizado',
    mediawiki: 'Depende do Admin Local',
    wikidot: 'Abandonado',
    highlight: true,
  },
  {
    name: 'Modo Offline Nativo com Leitura Sem Conexão',
    category: 'Acessibilidade & Mobilidade',
    wikizero: true,
    wikipedia: 'Apenas App Dedicado',
    fandom: false,
    mediawiki: false,
    wikidot: false,
  },
  {
    name: 'Suporte Nativo a Smart TVs (Interface 10-Foot)',
    category: 'Compatibilidade de Dispositivos',
    wikizero: true,
    wikipedia: false,
    fandom: false,
    mediawiki: false,
    wikidot: false,
    highlight: true,
  },
  {
    name: 'Conformidade Rigorosa com LGPD e Privacidade',
    category: 'Segurança & Dados',
    wikizero: true,
    wikipedia: 'Parcial',
    fandom: 'Rastreamento Pesado',
    mediawiki: 'Variável',
    wikidot: 'Desatualizado',
  },
  {
    name: 'Busca Sem Rastreamento de Perfil Comercial',
    category: 'Privacidade',
    wikizero: true,
    wikipedia: true,
    fandom: false,
    mediawiki: true,
    wikidot: false,
  },
  {
    name: 'Sincronização em Nuvem em Tempo Real (Firestore)',
    category: 'Infraestrutura Tecnológica',
    wikizero: true,
    wikipedia: false,
    fandom: false,
    mediawiki: false,
    wikidot: false,
  },
];

export const WikiCompetitorComparisonView: React.FC<WikiCompetitorComparisonViewProps> = ({
  onNavigate,
  onOpenEditor,
  onOpenGeminiChatbot,
  onOpenGeminiNotebook,
}) => {
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [dossierDoc, setDossierDoc] = useState<DossierDocType>('irregularidades');

  useEffect(() => {
    updateSEO({
      view: 'comparison',
      title: 'Comparativo: WikiWorldWeb vs Wikipédia, MediaWiki, Wikidot e Fandom',
      description:
        'Compare a WikiWorldWeb diretamente com a Wikipédia, MediaWiki, Wikidot e Fandom. Descubra as vantagens do Gemini Notebook para síntese de artigos, Assistente Gemini com IA, zero anúncios e editor moderno.',
      breadcrumbs: [
        { name: 'Início', url: '/?uid=hub' },
        { name: 'Comparativo de Plataformas Wiki', url: '/?uid=comparison' },
      ],
    });
  }, []);

  const renderBadge = (val: boolean | string) => {
    if (val === true) {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
          <Check size={13} className="text-emerald-600" /> Sim
        </span>
      );
    }
    if (val === false) {
      return (
        <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60">
          <X size={13} className="text-rose-500" /> Não
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
        {val}
      </span>
    );
  };

  return (
    <article className="max-w-6xl mx-auto px-4 py-8 space-y-10 font-sans">
      {/* Hero Header Section */}
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <Award size={14} />
          <span>Análise Competitiva de Plataformas de Conhecimento</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          WikiWorldWeb vs Wikipédia, MediaWiki, Wikidot e Fandom
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Descubra por que a <strong>WikiWorldWeb</strong> representa a evolução natural das enciclopédias colaborativas:
          uma plataforma moderna, sem poluição de anúncios invasivos, com liberdade editorial transparente e tecnologia de ponta.
        </p>
      </header>

      {/* Quick Value Pillars */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookMarked size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Gemini Notebook Nativo</h2>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              Exclusivo
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Reúna artigos, anotações e links externos. O Gemini cruza as fontes e gera verbetes enciclopédicos completos com sumário e referências.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Assistente Gemini IA</h2>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              Google AI
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Co-piloto inteligente integrado ao editor e à leitura. Ajuda a redigir infoboxes, ajustar o tom neutro (NPOV) e esclarecer dúvidas em tempo real.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <EyeOff size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Zero Anúncios Poluentes</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Diferente do Fandom e Wikidot, na WikiWorldWeb você não é bombardeado por anúncios em vídeo ou banners que consomem seus dados.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Zap size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Performance Instantânea</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Arquitetura moderna SPA em React que carrega páginas em milissegundos, superando o peso e lentidão do MediaWiki clássico em PHP.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">11 Temas Visuais Nativos</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Personalize sua experiência com temas exclusivos inspirados em Minecraft, Roblox, R.E.P.O., Stardew Valley, Genshin e Win95.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/60 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Governança Transparente</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Sem panelas burocráticas ou perseguições como na Wikipédia. Conselho de Arbitragem (ArbCom) com registros públicos e auditáveis.
          </p>
        </div>

        {/* 7. Proteção LGPD: Solicitação de Nome e Foto de Perfil */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-2 relative overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Privacidade & LGPD</h2>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              Lei 13.709
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Controle total do titular: solicitação transparente de nome civil, alteração ou exclusão de foto de perfil e portabilidade de dados.
          </p>
        </div>

        {/* 8. Artigos Universitários (SciELO & Google Acadêmico) */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/60 shadow-xs space-y-2 relative overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <GraduationCap size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Artigos Universitários</h2>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
              Científico
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Portal unificado para publicar e indexar teses, monografias e artigos acadêmicos com padrão SciELO e Google Acadêmico sem censura de notoriedade.
          </p>
        </div>

        {/* 9. Wiki de Livros Integrada */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-2 relative overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Library size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Wiki de Livros Integrada</h2>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              Biblioteca
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Cadastre sinopses, ISBN, fichas catalográficas e análises literárias na mesma enciclopédia, sem precisar de projetos irmãos externos como o Wikibooks.
          </p>
        </div>

        {/* 10. Multiplataforma: PC, Celular e Smart TV */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/60 shadow-xs space-y-2 relative overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Tv size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">PC, Celular & Smart TV</h2>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
              Universal
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Instalável no computador como PWA/Desktop, fluido no smartphone e com interface 10-foot dedicada para controle remoto de Smart TV.
          </p>
        </div>

        {/* 11. Conhecimento 100% Centralizado */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-2 relative overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Globe2 size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tudo em Uma Só Plataforma</h2>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              Centralizado
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Adeus à fragmentação da Wikimedia em 12+ sites separados: verbetes, artigos acadêmicos, livros, IA e governança numa única página integrada.
          </p>
        </div>
      </section>

      {/* Comprehensive Feature Comparison Matrix */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Matriz Comparativa de Recursos e Funcionalidades</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comparativo detalhado item por item entre as principais ferramentas enciclopédicas e plataformas de wiki do mercado.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/60">
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 w-2/5">
                  Recurso / Critério
                </th>
                <th className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 text-center">
                  WikiWorldWeb (Você Está Aqui)
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400 text-center">
                  Wikipédia
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400 text-center">
                  Fandom (Wikia)
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400 text-center">
                  MediaWiki
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400 text-center">
                  Wikidot
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {COMPARISON_FEATURES.map((item, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${
                    item.highlight ? 'bg-blue-50/20 dark:bg-blue-950/10 font-medium' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.category}</div>
                  </td>
                  <td className="py-3 px-3 text-center bg-blue-50/40 dark:bg-blue-950/20 border-x border-blue-100 dark:border-blue-900/40">
                    {renderBadge(item.wikizero)}
                  </td>
                  <td className="py-3 px-3 text-center">{renderBadge(item.wikipedia)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(item.fandom)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(item.mediawiki)}</td>
                  <td className="py-3 px-3 text-center">{renderBadge(item.wikidot)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deep-Dive Competitor Analysis Sections */}
      <section className="space-y-8">
        {/* 1. WikiWorldWeb vs Wikipédia */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              01
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              WikiWorldWeb vs Wikipédia: Fim da Censura e da Burocracia de Grupos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            A Wikipédia tradicional consolidou-se como referência histórica, porém sofre há mais de uma década com
            problemas crônicos de <strong>panelinhas de administradores</strong>, eliminação rápida abusiva de artigos legítimos
            e perseguição sistemática de novos contribuidores. A <strong>WikiWorldWeb</strong> foi estruturada para resolver essa falha:
            adotamos um <strong>Conselho de Arbitragem (ArbCom)</strong> com audiências públicas, auditoria imparcial de bloqueios
            (CheckUser transparente) e canais formais de recurso, garantindo que o conhecimento legítimo nunca seja apagado por caprichos pessoais.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Processo transparente
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Dossiê aberto de conformidade
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Inclusão de novas vozes
            </span>
          </div>
        </div>

        {/* 2. WikiWorldWeb vs Fandom (Wikia) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              02
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              WikiWorldWeb vs Fandom: Leitura Limpa sem Poluição de Anúncios e Rastreamento
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            O Fandom (anteriormente Wikia) tornou-se praticamente ilegível para milhões de usuários devido a
            vídeos com reprodução automática, banners expansivos que cobrem o texto, popups persistentes e dezenas de rastreadores
            comerciais que deixam a navegação lenta e drenam a bateria de smartphones. Na <strong>WikiWorldWeb</strong>,
            a experiência de leitura é <strong>100% livre de anúncios comerciais invasivos</strong>, carregando de forma instantânea
            e respeitando a privacidade e os dados do leitor.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Zero popups de vídeo
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Economia de dados de internet
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Sem rastreadores invasivos de terceiros
            </span>
          </div>
        </div>

        {/* 3. WikiWorldWeb vs MediaWiki */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              03
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              WikiWorldWeb vs MediaWiki: Engenharia Moderna em SPA vs Monolito PHP Legado
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            O motor de software MediaWiki foi concebido no início dos anos 2000 em PHP e requer pilhas de servidores pesadas (Apache/Nginx, MySQL, PHP-FPM)
            e recarregamentos inteiros de página a cada clique. A <strong>WikiWorldWeb</strong> foi projetada com arquitetura
            contemporânea de ponta em <strong>React + TypeScript + Tailwind CSS</strong> com banco de dados em nuvem em tempo real (Firestore).
            Oferece navegação reativa sem recarregamento de página, pré-visualização instantânea de wikitexto e suporte a PWA (Progressive Web App).
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ SPA sem recarregamentos
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Sincronização em nuvem
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Editor com atalhos modernos
            </span>
          </div>
        </div>

        {/* 4. WikiWorldWeb vs Wikidot */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
              04
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              WikiWorldWeb vs Wikidot: Design Responsivo e Plataforma Ativa
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            O Wikidot possui uma interface congelada no tempo, sintaxe proprietária que não é compatível com o padrão internacional
            MediaWiki wikitexto e suporte técnico estagnado. A <strong>WikiWorldWeb</strong> oferece design 100% responsivo para
            qualquer tamanho de tela, compatibilidade total com sintaxe wikitexto padrão, internacionalização em múltiplos idiomas
            e desenvolvimento ativo contínuo.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Sintaxe wikitexto padronizada
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Interface fluida para celular e TV
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              ✓ Comunidade acolhedora
            </span>
          </div>
        </div>

        {/* 5. WikiWorldWeb vs Outros: Vantagem do Gemini Notebook na Criação de Artigos */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-800/80 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/15 via-blue-400/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                05
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Diferencial Tecnológico Exclusivo
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Gemini Notebook: Síntese Multifontes e Criação Acelerada de Artigos
                </h2>
              </div>
            </div>
            {onOpenGeminiNotebook && (
              <button
                onClick={onOpenGeminiNotebook}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex items-center gap-1.5 cursor-pointer"
              >
                <BookMarked size={14} />
                <span>Abrir Gemini Notebook</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Nas plataformas concorrentes como <strong>Wikipédia, MediaWiki, Fandom e Wikidot</strong>, o processo de pesquisa e criação de um novo verbete é dolorosamente arcaico: o editor precisa abrir dezenas de guias no navegador, copiar anotações manuais em blocos de notas externos, formatar wikitexto do zero e enfrentar o clássico <em>bloqueio da página em branco</em>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <BookOpen size={14} />
                <span>1. Cruzamento de Múltiplas Fontes</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Adicione no mesmo caderno artigos existentes da WikiWorldWeb, anotações de pesquisa, links da internet e citações bibliográficas.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <Cpu size={14} />
                <span>2. Síntese Enciclopédica Neutra</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                O modelo Gemini analisa todo o material e sintetiza um verbete completo, com sumário temático, infobox formatada e seções equilibradas.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Edit3 size={14} />
                <span>3. Inserção Direta no Editor</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Com um único clique, o texto sintetizado é enviado para o editor com pré-visualização instantânea, mantendo o controle editorial nas mãos do autor.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Pesquisa e síntese multifontes unificadas
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Redução de 80% no tempo de redação inicial
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Estruturação automática em wikitexto padrão
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Inexistente na Wikipédia, Fandom e MediaWiki
            </span>
          </div>
        </div>

        {/* 6. WikiWorldWeb vs Outros: Assistente Gemini Integrado (Google AI Studio) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-300 dark:border-indigo-800/80 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/15 via-purple-400/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                06
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Co-Piloto Inteligente em Tempo Real
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Assistente Gemini (Google AI Studio): Redação, Revisão e Fatos
                </h2>
              </div>
            </div>
            {onOpenGeminiChatbot && (
              <button
                onClick={onOpenGeminiChatbot}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Bot size={14} />
                <span>Abrir Assistente Gemini</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Na Wikipédia e no ecossistema MediaWiki tradicional, o uso de inteligência artificial é frequentemente alvo de <strong>hostilidade burocrática</strong>, reversões automáticas em massa e ameaças de bloqueio por administradores, sem que os editores recebam ferramentas amigáveis de suporte. Na <strong>WikiWorldWeb</strong>, abraçamos o futuro da tecnologia: o <strong>Assistente Gemini</strong> funciona como um co-piloto transparente e solícito, projetado para elevar a qualidade do conhecimento livre.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">Geração de Infoboxes</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Cria tabelas de metadados padronizadas ({`{{Info/...}}`}) com parâmetros formatados em wikitexto automaticamente.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-purple-600 dark:text-purple-400">Auditoria de Neutralidade</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Identifica adjetivos parciais e reescreve trechos de acordo com o Princípio do Ponto de Vista Neutro (NPOV).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-blue-600 dark:text-blue-400">Revisão Gramatical</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Corrige concordâncias, pontuações e ortografia sem apagar o estilo do autor ou comprometer o sentido original.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Suporte ao Leitor</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Disponível na barra lateral para responder dúvidas de leitores sobre temas densos e resumir artigos extensos.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-900/40">
              ✓ Modelos Gemini 2.5 Flash de alta velocidade
            </span>
            <span className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-900/40">
              ✓ Auxílio na redação sem perda do controle humano
            </span>
            <span className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-900/40">
              ✓ Inserção de wikitexto com 1 clique no editor
            </span>
            <span className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-900/40">
              ✓ Zero perseguição burocrática a editores inovadores
            </span>
          </div>
        </div>

        {/* 7. WikiWorldWeb vs Outros: Proteção LGPD & Solicitação de Nome e Foto */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800/80 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/15 via-emerald-400/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                07
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Privacidade do Titular & LGPD (Lei 13.709/2018)
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Solicitação de Nome e Foto de Perfil: Respeito Pleno aos Direitos da LGPD
                </h2>
              </div>
            </div>
            <button
              onClick={() => onNavigate('mydata')}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck size={14} />
              <span>Painel Meus Dados & LGPD</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Na <strong>Wikipédia</strong>, nomes de usuários e dados civis acidentalmente inseridos ficam cravados nos históricos públicos de banco de dados, sendo quase impossível retificar ou expurgar sem processos burocráticos humilhantes e longas disputas com administradores. No <strong>Fandom</strong> e no <strong>Wikidot</strong>, o rastreamento comercial e a falta de conformidade com a legislação brasileira deixam os dados do usuário vulneráveis.
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Na <strong>WikiWorldWeb</strong>, a privacidade é um pilar fundacional: dispomos de ferramentas dedicadas onde o usuário pode solicitar a <strong>retificação ou exclusão de seu nome civil</strong>, atualizar ou <strong>remover sua foto de perfil/avatar</strong> e exercer todos os direitos previstos no <strong>Artigo 18 da LGPD</strong> (Acesso, Retificação, Anonimização, Portabilidade e Eliminação de dados pessoais), tudo auditado com transparência e sem burocracia opressiva.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Direito ao Nome Civil</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Altere ou solicite anonimização do nome de exibição a qualquer momento, sem registros públicos invasivos.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-teal-600 dark:text-teal-400">Controle de Foto e Avatar</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Liberdade para carregar, alterar ou apagar sua foto de perfil instantaneamente com respeito à imagem pessoal.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-blue-600 dark:text-blue-400">Sem Venda de Dados</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Seus dados de navegação nunca são compartilhados ou vendidos para corretoras de publicidade de terceiros.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">Portabilidade e Exclusão</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Exportação de dados em formato aberto (JSON) e direito integral ao esquecimento e exclusão de conta.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono border border-emerald-200 dark:border-emerald-900/40">
              ✓ Total conformidade com a LGPD (Lei 13.709/2018)
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono border border-emerald-200 dark:border-emerald-900/40">
              ✓ Solicitação e remoção facilitada de nome e foto de perfil
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono border border-emerald-200 dark:border-emerald-900/40">
              ✓ Painel dedicado do titular para portabilidade
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono border border-emerald-200 dark:border-emerald-900/40">
              ✓ Inexistente ou excessivamente rígido em outras wikis
            </span>
          </div>

          {/* Dossiê Oficial em PDF sobre as Violações */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 via-slate-50 to-amber-50 dark:from-rose-950/40 dark:via-slate-900 dark:to-amber-950/40 border border-rose-300 dark:border-rose-800 space-y-2 mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded">
                      Dossiê Documental
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                      PDF Oficial (23 KB)
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-serif-heading mt-0.5">
                    Irregularidades da Wikipédia e Wikimedia Foundation (LGPD, GDPR e Marco Civil)
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
                  <span>Baixar PDF</span>
                </a>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Consulte a auditoria que detalha como a Wikipédia expõe publicamente endereços IP de usuários (infringindo os Arts. 10 e 15 do Marco Civil), descumpre o Art. 18 da LGPD através de votações vexatórias (Efeito Streisand) e recusa o direito ao esquecimento e a conformidade com o GDPR europeu.
            </p>
          </div>

          {/* Dossiê Especial: Calúnia por parte de Chronus V2 */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 dark:from-red-950/40 dark:via-rose-950/30 dark:to-orange-950/40 border border-red-300 dark:border-red-800 space-y-2 mt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-700 to-red-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Scale size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase bg-red-100 dark:bg-red-900/70 text-red-700 dark:text-red-300 px-1.5 py-0.2 rounded">
                      Dossiê Especial 47 Págs
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                      Código Penal Arts. 138-140 & 147-A
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded">
                      UCOC Wikimedia
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-serif-heading mt-0.5">
                    Calúnia por parte de Chronus V2: Dossiê Jurídico de Violações e Moderação Abusiva na Wikipédia
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
              Dossiê completo de 47 páginas que fundamenta crimes contra a honra (calúnia, difamação e injúria qualificada), perseguição/stalking (Art. 147-A do Código Penal), quebra de sigilo telemático, manipulação de CheckUser e violação sistemática do Código Universal de Conduta (UCOC) da Wikimedia Foundation pelo moderador Chronus.
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
                      Dossiê de Apresentação Oficial
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                      15 Slides Executivos
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded">
                      Responsabilidade Institucional WMF
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
              Apresentação executiva em 15 lâminas com fundamentação técnico-jurídica sobre violações ao Código Universal de Conduta (UCoC), instrumentalização autoritária de ferramentas, quebra de sigilo e vazamento de correspondência confidencial (whistleblower), responsabilização civil e internacional da Wikimedia Foundation (DSA e Marco Civil).
            </p>
          </div>
        </div>

        {/* 8. WikiWorldWeb vs Outros: Portal Unificado de Artigos Universitários (SciELO e Google Acadêmico) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-300 dark:border-sky-800/80 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sky-500/15 via-sky-400/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                08
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Pesquisa Científica & Repositório Universitário
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Portal Unificado de Artigos Universitários: No Nível de SciELO e Google Acadêmico
                </h2>
              </div>
            </div>
            <button
              onClick={() => onNavigate('academic')}
              className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-semibold text-xs hover:bg-sky-100 dark:hover:bg-sky-900/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap size={14} />
              <span>Explorar Artigos Acadêmicos</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Na <strong>Wikipédia</strong>, a produção acadêmica legítima de estudantes, professores e pesquisadores é frequentemente alvo de <strong>eliminação rápida sumária</strong> sob o pretexto de "falta de notoriedade da grande mídia" ou alegações de "pesquisa inédita", forçando os acadêmicos a buscarem plataformas fragmentadas e repositórios dispersos. No Fandom e Wikidot, não há qualquer suporte nativo para citações ABNT, DOI, resumos científicos ou teses.
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            A <strong>WikiWorldWeb</strong> inova com uma <strong>página unificada de artigos universitários e científicos</strong>, equiparando-se a plataformas de referência como o <strong>Google Acadêmico, SciELO, CAPES e Latindex</strong>. Aqui, produções universitárias, monografias, dissertações de mestrado, teses e relatórios técnicos encontram um lar centralizado, com campos de metadados para autores, orientadores, instituição de ensino, resumo, palavras-chave, DOI e formato de citação padronizado.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                <FileText size={14} />
                <span>1. Inserção Unificada e Ágil</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Formulário próprio para submissão de artigos científicos, teses e TCCs com indexação instantânea na enciclopédia.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <BookOpen size={14} />
                <span>2. Metadados & Citação ABNT / DOI</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Geração automática de referências bibliográficas prontas para copiar no formato ABNT, APA e links DOI verificados.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Award size={14} />
                <span>3. Sem Censura de Notoriedade</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Seu esforço de pesquisa acadêmica não é descartado por moderadores arbitrários: a ciência aberta é valorizada e preservada.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono border border-sky-200 dark:border-sky-900/40">
              ✓ Portal acadêmico integrado no mesmo ecossistema
            </span>
            <span className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono border border-sky-200 dark:border-sky-900/40">
              ✓ Equiparado a SciELO, Google Acadêmico e repositórios CAPES
            </span>
            <span className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono border border-sky-200 dark:border-sky-900/40">
              ✓ Citações automáticas em ABNT e suporte a DOI
            </span>
            <span className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono border border-sky-200 dark:border-sky-900/40">
              ✓ Democratização real do conhecimento científico
            </span>
          </div>
        </div>

        {/* 9. WikiWorldWeb vs Outros: Wiki de Livros Integrada (Fichas Catalográficas e ISBN) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800/80 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/15 via-amber-400/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                09
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Biblioteca & Acervo Bibliográfico Centralizado
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Wiki de Livros Integrada: Obras, Sinopses e Fichas Catalográficas em um Só Lugar
                </h2>
              </div>
            </div>
            <button
              onClick={() => onNavigate('library')}
              className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Library size={14} />
              <span>Acessar Wiki de Livros</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            No universo Wikimedia, o conhecimento sobre livros foi artificialmente repartido entre múltiplos sites desconexos: para saber a sinopse você vai na Wikipédia; para ler capítulos você é redirecionado para o <em>Wikibooks</em>; para ver textos originais precisa ir ao <em>Wikisource</em>; e para frases famosas precisa do <em>Wikiquote</em>. São <strong>quatro domínios diferentes, interfaces divergentes e bancos de dados fragmentados</strong>.
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Na <strong>WikiWorldWeb</strong>, a <strong>"Wiki de Livros" (Biblioteca)</strong> é uma experiência centralizada e integrada: é possível catalogar informações completas sobre livros nacionais e internacionais, com registro de <strong>ISBN, ficha catalográfica, biografia do autor, editora, gênero literário, resenha crítica e notas de estudo</strong>, tudo perfeitamente cruzado com os artigos enciclopédicos da própria plataforma.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-amber-600 dark:text-amber-400">Ficha Catalográfica & ISBN</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Padrão bibliotecário formal com ano de publicação, edição, número de páginas e código de barras ISBN.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-orange-600 dark:text-orange-400">Sinopses e Resenhas</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Resumos aprofundados dos capítulos, guias de leitura, análises de personagens e contexto histórico.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Vinculação de Autores</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Navegação bidirecional: do livro para a biografia do autor e da biografia para a bibliografia completa.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-blue-600 dark:text-blue-400">Fim dos Saltos Externos</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Consulte literatura e dados enciclopédicos sem precisar trocar de abas ou abrir outros portais.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono border border-amber-200 dark:border-amber-900/40">
              ✓ Biblioteca de livros centralizada e integrada
            </span>
            <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono border border-amber-200 dark:border-amber-900/40">
              ✓ Fichas catalográficas completas com validação de ISBN
            </span>
            <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono border border-amber-200 dark:border-amber-900/40">
              ✓ Sem fragmentação de projetos secundários como Wikibooks
            </span>
            <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono border border-amber-200 dark:border-amber-900/40">
              ✓ Interligação direta com artigos temáticos da enciclopédia
            </span>
          </div>
        </div>

        {/* 10. WikiWorldWeb vs Outros: Aplicativo para Computador, Celular e Smart TV */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-violet-300 dark:border-violet-800/80 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/15 via-violet-400/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs">
                10
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Acessibilidade Universal & Multiplataforma
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Aplicativo Multiplataforma: Computador, Celular e Smart TV (Interface 10-Foot)
                </h2>
              </div>
            </div>
            <button
              onClick={() => onNavigate('smart-tv')}
              className="px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 font-semibold text-xs hover:bg-violet-100 dark:hover:bg-violet-900/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Tv size={14} />
              <span>Experimentar Modo Smart TV</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Plataformas legadas como Wikipédia e MediaWiki foram desenhadas para telas de desktop do início dos anos 2000. Seus aplicativos mobile são versões simplificadas e não existe <strong>nenhum suporte para televisores ou salas de aula conectadas</strong>. No Fandom, navegar em uma Smart TV é inviável devido a popups pesados que travam o navegador da TV.
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            A <strong>WikiWorldWeb</strong> foi concebida para qualquer dispositivo moderno através de uma experiência unificada:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
                <Monitor size={14} />
                <span>1. Computador (Desktop / PWA)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Pode ser instalado no Windows, Mac e Linux via Progressive Web App (PWA), funcionando como app nativo com atalhos de teclado ágeis e modo tela cheia.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <Smartphone size={14} />
                <span>2. Celular (Mobile Touch)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Layout reativo ultrafino adaptado para toque, gestos de swipe, modo escuro AMOLED e baixo consumo de pacote de dados móveis.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Tv size={14} />
                <span>3. Smart TV (Interface 10-Foot)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Modo exclusivo de 10 pés com tipografia de alta legibilidade, foco por setas do controle remoto (D-Pad), ideal para salas, auditórios e escolas.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-mono border border-violet-200 dark:border-violet-900/40">
              ✓ App PWA instalável no Computador
            </span>
            <span className="px-2.5 py-1 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-mono border border-violet-200 dark:border-violet-900/40">
              ✓ Navegação móvel fluida e ergonômica
            </span>
            <span className="px-2.5 py-1 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-mono border border-violet-200 dark:border-violet-900/40">
              ✓ Suporte pioneiro a Smart TVs com controle remoto
            </span>
            <span className="px-2.5 py-1 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-mono border border-violet-200 dark:border-violet-900/40">
              ✓ Sincronização e modo offline em todas as telas
            </span>
          </div>
        </div>

        {/* 11. WikiWorldWeb vs Outros: Ecossistema Centralizado vs Fragmentação de Projetos */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-800/80 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/15 via-indigo-400/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                11
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Arquitetura Unificada de Conhecimento
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  O Poder da Centralização: O Fim dos Ecossistemas Fragmentados
                </h2>
              </div>
            </div>
            <button
              onClick={() => onNavigate('hub')}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Globe2 size={14} />
              <span>Explorar Hub Centralizado</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Em outras plataformas colaborativas históricas, como o ecossistema Wikimedia, a arquitetura foi desenhada em <strong>silos isolados e fragmentados</strong>: o usuário precisa navegar entre a Wikipédia (artigos), Wikilivros (manuais), Wikisource (documentos históricos), Wikiversidade (educação), Wikinotícias (atualidades), Wikcionário (termos), Wikimedia Commons (arquivos) e Wikidata (dados estruturados). Cada um possui regras próprias, páginas de discussão separadas e layouts desiguais.
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Na <strong>WikiWorldWeb</strong>, todos esses benefícios estão <strong>centralizados no mesmo ambiente</strong>. O usuário pesquisa, redige e consulta artigos enciclopédicos, artigos universitários e científicos (estilo SciELO/Google Acadêmico), a biblioteca de livros (Wiki de Livros), o assistente Gemini e o caderno Gemini Notebook, tudo com a mesma conta, a mesma sessão segura e a mesma interface elegante, rápida e intuitiva.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Todos os recursos em uma única plataforma coesa
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Fim da dispersão em dezenas de sites e subdomínios diferentes
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Busca unificada que localiza artigos, livros e pesquisas acadêmicas
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-900/40">
              ✓ Gestão transparente e integrada com privacidade LGPD
            </span>
          </div>
        </div>
      </section>

      {/* SEO FAQ Section (Targeting Search Engine Rich Snippets) */}
      <section className="bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Perguntas Frequentes sobre a WikiWorldWeb e Alternativas
          </h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Como a WikiWorldWeb garante a privacidade do nome e foto de perfil perante a LGPD?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              A WikiWorldWeb segue estritamente a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Disponibilizamos um painel dedicado onde o usuário pode solicitar a retificação ou exclusão de seu nome civil, alterar ou expurgar sua foto de perfil, exportar todos os seus dados em formato interoperável e revogar consentimentos, sem que registros indesejados fiquem eternamente expostos em bancos de dados públicos.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Como funciona o portal de artigos universitários comparado a Google Acadêmico e SciELO?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Diferente da Wikipédia, onde artigos científicos e teses de estudantes são constantemente apagados sob o pretexto burocrático de "falta de notoriedade da grande mídia", a WikiWorldWeb oferece um portal acadêmico unificado. Nele, autores podem submeter monografias, dissertações, artigos e relatórios técnicos com campos estruturados para resumo, palavras-chave, autores, DOI e citações ABNT, equiparando-se a repositórios como SciELO e Google Acadêmico.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Qual a vantagem de inserir informações de livros na "Wiki de Livros" integrada?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Em vez de exigir a criação de contas em múltiplos sites separados como o Wikibooks ou Wikisource da Wikimedia, a WikiWorldWeb possui a "Wiki de Livros" (Biblioteca) totalmente integrada. Nela, é possível consultar e cadastrar fichas catalográficas, ISBN, sinopses por capítulo, análises críticas e biografias dos autores de forma centralizada e sem saltos entre domínios.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              A WikiWorldWeb funciona como aplicativo em computador, celular e Smart TV?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Sim! A plataforma é universal: no computador roda como PWA ou app Desktop instalável com alta performance; no celular conta com interface responsiva e modo touch ergonômico; e na Smart TV oferece uma interface pioneira de 10 pés (10-Foot UI) otimizada para navegação com o controle remoto (D-Pad), fontes ampliadas e leitura confortável na sala ou sala de aula.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Por que a experiência centralizada da WikiWorldWeb é superior à fragmentação de outras plataformas?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Na Wikimedia ou em redes de wikis isoladas, o usuário precisa de mais de 10 links e diferentes contas para acessar verbetes, livros, dados e pesquisas. A WikiWorldWeb reúne enciclopédia geral, pesquisas acadêmicas, acervo de livros, ferramentas inteligentes de IA e proteção de privacidade em um só portal, com busca universal integrada e sessão unificada.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Como o Gemini Notebook auxilia na criação de artigos na WikiWorldWeb?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              O Gemini Notebook permite agrupar múltiplos artigos existentes da WikiWorldWeb, anotações de estudo e fontes externas em um ambiente de pesquisa integrado. Em seguida, a inteligência artificial do Google sintetiza um rascunho enciclopédico estruturado em wikitexto com seções, infobox e sumário, pronto para ser refinado no editor com 1 clique.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Qual a vantagem do Assistente Gemini em relação a editar na Wikipédia ou MediaWiki?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Na Wikipédia e no MediaWiki, novos usuários enfrentam bloqueios rígidos e uma curva de aprendizado íngreme para sintaxe de tabelas e infoboxes. Na WikiWorldWeb, o Assistente Gemini auxilia a redigir parâmetros, sugerir ligações internas, auditar o tom neutro e tirar dúvidas dos leitores, democratizando a produção do saber livre.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              A WikiWorldWeb é gratuita para ler e editar?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Sim! A WikiWorldWeb é 100% gratuita para leitura, pesquisa, criação de novos verbetes e edição colaborativa, sob licença livre Creative Commons e GNU GPL.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Por que a WikiWorldWeb não possui anúncios como o Fandom?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Acreditamos que o conhecimento enciclopédico deve ser limpo, rápido e acessível sem mercantilização intrusiva. A WikiWorldWeb foi desenvolvida com foco no leitor e na velocidade de consulta.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Como funciona o Conselho de Arbitragem (ArbCom) da WikiWorldWeb?
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Diferente da Wikipédia, os casos de arbitragem na WikiWorldWeb contam com registros públicos transparentes, permitindo que usuários apresentem evidências e garantam julgamentos imparciais contra abusos de poder ou disputas de edição.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Box */}
      <footer className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-md">
        <h2 className="text-xl sm:text-2xl font-black">
          Junte-se à Revolução do Conhecimento Livre & Inteligente
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 max-w-2xl mx-auto">
          Crie artigos de alta qualidade com auxílio do Gemini Notebook, acesse pesquisas universitárias, explore a Wiki de Livros e aproveite a plataforma no computador, celular ou Smart TV.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenGeminiNotebook && (
            <button
              onClick={onOpenGeminiNotebook}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs sm:text-sm hover:bg-blue-50 transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <BookMarked size={15} />
              <span>Experimentar Gemini Notebook</span>
            </button>
          )}
          {onOpenGeminiChatbot && (
            <button
              onClick={onOpenGeminiChatbot}
              className="px-4 py-2.5 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Bot size={15} />
              <span>Abrir Assistente Gemini</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('academic')}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
          >
            <GraduationCap size={15} />
            <span>Portal Acadêmico</span>
          </button>
          <button
            onClick={() => onNavigate('library')}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Library size={15} />
            <span>Wiki de Livros</span>
          </button>
          <button
            onClick={() => onNavigate('smart-tv')}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Tv size={15} />
            <span>Modo Smart TV</span>
          </button>
          <button
            onClick={() => onNavigate('mydata')}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
          >
            <UserCheck size={15} />
            <span>Meus Dados (LGPD)</span>
          </button>
          <button
            onClick={() => onOpenEditor()}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Edit3 size={15} />
            <span>Criar Artigo no Editor</span>
          </button>
          <button
            onClick={() => onNavigate('hub')}
            className="px-4 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/20 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
          >
            <BookOpen size={15} />
            <span>Explorar Enciclopédia</span>
          </button>
        </div>
      </footer>

      {/* Modal de Leitura Integral do Dossiê e Visualização do PDF */}
      <IrregularidadesDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        initialDocument={dossierDoc}
      />
    </article>
  );
};
