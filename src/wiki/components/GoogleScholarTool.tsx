import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Calendar,
  BookOpen,
  FileText,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  History,
  Trash2,
  Share2,
  Compass,
  ArrowRight,
  Layers,
  Award,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { AppTheme } from '../types';

interface GoogleScholarToolProps {
  theme?: AppTheme;
  initialQuery?: string;
  onOpenEditor?: (title?: string) => void;
}

// Exemplos curados de tópicos científicos e acadêmicos
const SCHOLAR_CATEGORIES = [
  {
    category: 'Medicina & Saúde',
    icon: '🧬',
    queries: [
      { label: 'Vacinas de mRNA e Imunologia', query: 'mRNA vaccines immunology' },
      { label: 'CRISPR-Cas9 em Terapias Genéticas', query: 'CRISPR-Cas9 gene therapy clinical trials' },
      { label: 'Neuroplasticidade e Aprendizado', query: 'neuroplasticity synaptic plasticity learning' },
      { label: 'Saúde Mental e Telemedicina no Brasil', query: 'telemedicina saude mental brasil scielo' },
    ],
  },
  {
    category: 'Computação & IA',
    icon: '🤖',
    queries: [
      { label: 'Large Language Models & Transformers', query: 'large language models transformer attention mechanism' },
      { label: 'Computação Quântica e Algoritmos', query: 'quantum computing fault-tolerant algorithms' },
      { label: 'Aprendizado por Reforço Profundo (RL)', query: 'deep reinforcement learning algorithms' },
      { label: 'Ética e Alinhamento de Inteligência Artificial', query: 'artificial intelligence alignment ethics safety' },
    ],
  },
  {
    category: 'Física & Astronomia',
    icon: '🌌',
    queries: [
      { label: 'Observações do Telescópio James Webb (JWST)', query: 'James Webb Space Telescope early galaxies cosmology' },
      { label: 'Fusão Nuclear e Confinamento Magnético', query: 'tokamak nuclear fusion magnetic confinement' },
      { label: 'Matéria Escura e Energia Escura', query: 'dark matter candidate particles astrophysics' },
      { label: 'Ondas Gravitacionais (LIGO/Virgo)', query: 'gravitational waves binary black hole merger' },
    ],
  },
  {
    category: 'Meio Ambiente & Clima',
    icon: '🌿',
    queries: [
      { label: 'Transição Energética e Baterias de Estado Sólido', query: 'solid-state batteries energy transition renewable' },
      { label: 'Desmatamento e Biodiversidade Amazônica', query: 'amazonia desmatamento biodiversidade scielo' },
      { label: 'Captura e Armazenamento de Carbono (CCS)', query: 'carbon capture utilization and storage materials' },
      { label: 'Aquecimento Global e Acidificação dos Oceanos', query: 'ocean acidification marine ecosystems climate change' },
    ],
  },
  {
    category: 'Direito, Sociedade & Economia',
    icon: '⚖️',
    queries: [
      { label: 'Regulação de IA e Proteção de Dados (LGPD)', query: 'regulamentacao inteligencia artificial lgpd direito digital brasil' },
      { label: 'Desigualdade Econômica e Renda Básica', query: 'universal basic income economic inequality empirical' },
      { label: 'Democracia Digital e Desinformação', query: 'disinformation social media democracy polarization' },
      { label: 'Historiografia e Identidade Cultural no Brasil', query: 'historiografia brasileira cultura identidade scielo' },
    ],
  },
];

interface AcademicHistoryItem {
  id: string;
  query: string;
  url: string;
  timestamp: string;
  yearFilter?: string;
  language?: string;
}

export const GoogleScholarTool: React.FC<GoogleScholarToolProps> = ({
  theme,
  initialQuery = '',
  onOpenEditor,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>(initialQuery);
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [intitleFilter, setIntitleFilter] = useState<string>('');
  const [yearOption, setYearOption] = useState<string>('all'); // all, 2026, 2025, 2022, custom
  const [customYearStart, setCustomYearStart] = useState<string>('2020');
  const [customYearEnd, setCustomYearEnd] = useState<string>('2026');
  const [languageOption, setLanguageOption] = useState<string>('pt'); // pt, any, en, es
  const [sortByDate, setSortByDate] = useState<boolean>(false);
  const [includePatents, setIncludePatents] = useState<boolean>(true);
  const [includeCitations, setIncludeCitations] = useState<boolean>(true);
  const [onlyPdf, setOnlyPdf] = useState<boolean>(false);
  const [siteFilter, setSiteFilter] = useState<string>('any'); // any, scielo, edu, gov
  const [showAdvancedBuilder, setShowAdvancedBuilder] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Histórico de pesquisas no Google Acadêmico
  const [history, setHistory] = useState<AcademicHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('wikizero_scholar_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wikizero_scholar_history', JSON.stringify(history.slice(0, 25)));
    } catch {}
  }, [history]);

  // Constrói a consulta composta com operadores acadêmicos
  const fullSearchQuery = useMemo(() => {
    const parts: string[] = [];

    if (searchTerm.trim()) {
      parts.push(searchTerm.trim());
    }

    if (authorFilter.trim()) {
      parts.push(`author:"${authorFilter.trim()}"`);
    }

    if (sourceFilter.trim()) {
      parts.push(`source:"${sourceFilter.trim()}"`);
    }

    if (intitleFilter.trim()) {
      parts.push(`intitle:"${intitleFilter.trim()}"`);
    }

    if (onlyPdf) {
      parts.push('filetype:pdf');
    }

    if (siteFilter === 'scielo') {
      parts.push('site:scielo.org OR site:scielo.br');
    } else if (siteFilter === 'edu') {
      parts.push('site:.edu OR site:.edu.br');
    } else if (siteFilter === 'gov') {
      parts.push('site:.gov OR site:.gov.br');
    }

    return parts.join(' ').trim();
  }, [searchTerm, authorFilter, sourceFilter, intitleFilter, onlyPdf, siteFilter]);

  // Gera a URL completa oficial do Google Acadêmico
  const scholarUrl = useMemo(() => {
    const baseUrl = 'https://scholar.google.com/scholar';
    const params = new URLSearchParams();

    params.set('q', fullSearchQuery || 'artigos científicos');
    params.set('hl', 'pt-BR');

    // Filtros de ano
    if (yearOption === '2026') {
      params.set('as_ylo', '2026');
    } else if (yearOption === '2025') {
      params.set('as_ylo', '2025');
    } else if (yearOption === '2022') {
      params.set('as_ylo', '2022');
    } else if (yearOption === 'custom') {
      if (customYearStart.trim()) params.set('as_ylo', customYearStart.trim());
      if (customYearEnd.trim()) params.set('as_yhi', customYearEnd.trim());
    }

    // Idioma
    if (languageOption === 'pt') {
      params.set('lr', 'lang_pt');
    } else if (languageOption === 'en') {
      params.set('lr', 'lang_en');
    } else if (languageOption === 'es') {
      params.set('lr', 'lang_es');
    }

    // Ordenação por data
    if (sortByDate) {
      params.set('scisbd', '1');
    }

    // Patentes
    if (includePatents) {
      params.set('as_sdt', '0,5');
    } else {
      params.set('as_sdt', '0');
    }

    // Citações (1 = excluir citações, 0 = incluir)
    if (!includeCitations) {
      params.set('as_vis', '1');
    }

    return `${baseUrl}?${params.toString()}`;
  }, [
    fullSearchQuery,
    yearOption,
    customYearStart,
    customYearEnd,
    languageOption,
    sortByDate,
    includePatents,
    includeCitations,
  ]);

  // Links para outros repositórios científicos parceiros
  const alternativeDatabases = useMemo(() => {
    const rawQuery = searchTerm.trim() || 'ciência';
    const enc = encodeURIComponent(rawQuery);
    return [
      {
        name: 'SciELO Brasil',
        url: `https://search.scielo.org/?q=${enc}&lang=pt`,
        desc: 'Coleção científica aberta da América Latina e Caribe',
        badge: 'Open Access',
      },
      {
        name: 'Portal de Periódicos CAPES',
        url: `https://www.periodicos.capes.gov.br/?option=com_psearch&task=processSearch&search_type=1&q=${enc}`,
        desc: 'Base brasileira de pesquisas e teses de pós-graduação',
        badge: 'Brasil',
      },
      {
        name: 'PubMed / NCBI',
        url: `https://pubmed.ncbi.nlm.nih.gov/?term=${enc}`,
        desc: 'Mais de 36 milhões de citações em biomedicina e ciências da vida',
        badge: 'Medicina',
      },
      {
        name: 'arXiv.org',
        url: `https://arxiv.org/search/?query=${enc}&searchtype=all`,
        desc: 'Repositório de preprints de Física, Matemática e Inteligência Artificial',
        badge: 'Preprints',
      },
      {
        name: 'DOAJ (Open Access)',
        url: `https://doaj.org/search/articles?ref=homepage&source=%7B%22query%22%3A%7B%22query_string%22%3A%7B%22query%22%3A%22${enc}%22%7D%7D%7D`,
        desc: 'Diretório internacional de periódicos científicos revisados por pares',
        badge: 'Global',
      },
    ];
  }, [searchTerm]);

  // Executa busca no Google Acadêmico
  const handleExecuteSearch = () => {
    if (!fullSearchQuery.trim()) {
      alert('Digite um termo ou conceito para pesquisar no Google Acadêmico.');
      return;
    }

    // Salva no histórico
    const item: AcademicHistoryItem = {
      id: `hist_${Date.now()}`,
      query: fullSearchQuery,
      url: scholarUrl,
      timestamp: new Date().toISOString(),
      yearFilter: yearOption,
      language: languageOption,
    };
    setHistory((prev) => [item, ...prev.filter((h) => h.query !== fullSearchQuery)].slice(0, 20));

    // Abre em nova aba segura
    window.open(scholarUrl, '_blank', 'noopener,noreferrer');
  };

  // Copia link da busca
  const handleCopyLink = () => {
    navigator.clipboard.writeText(scholarUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Limpa histórico
  const handleClearHistory = () => {
    if (confirm('Deseja limpar o histórico de buscas acadêmicas?')) {
      setHistory([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Painel Principal de Busca Acadêmica */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 text-white shadow-md">
              <GraduationCap size={28} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Google Acadêmico</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Google Scholar
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pesquise literatura revisada por pares, teses, dissertações, livros, resumos e artigos de tribunais e editoras acadêmicas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedBuilder(!showAdvancedBuilder)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                showAdvancedBuilder
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>{showAdvancedBuilder ? 'Ocultar Operadores' : 'Operadores Avançados'}</span>
            </button>
          </div>
        </div>

        {/* Campo de Entrada Principal */}
        <div className="mt-6 space-y-4">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteSearch();
              }}
              placeholder="Digite o tema de pesquisa, título de artigo, autor ou conceito científico..."
              className="w-full pl-12 pr-36 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={handleExecuteSearch}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Pesquisar</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>

          {/* Filtros Rápidos (Ano e Idioma) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Filtro de Período / Ano */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                Período de Publicação
              </label>
              <select
                value={yearOption}
                onChange={(e) => setYearOption(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Qualquer data (Histórico completo)</option>
                <option value="2026">Desde 2026 (Recentes deste ano)</option>
                <option value="2025">Desde 2025 (Último ano)</option>
                <option value="2022">Desde 2022 (Últimos 4 anos)</option>
                <option value="custom">Intervalo personalizado...</option>
              </select>
            </div>

            {/* Idioma da Pesquisa */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                Idioma das Publicações
              </label>
              <select
                value={languageOption}
                onChange={(e) => setLanguageOption(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pt">Páginas em Português</option>
                <option value="any">Qualquer idioma (Global)</option>
                <option value="en">Páginas em Inglês</option>
                <option value="es">Páginas em Espanhol</option>
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                Classificar Resultados
              </label>
              <select
                value={sortByDate ? 'date' : 'relevance'}
                onChange={(e) => setSortByDate(e.target.value === 'date')}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="relevance">Por Relevância Acadêmica</option>
                <option value="date">Por Data de Publicação</option>
              </select>
            </div>

            {/* Repositório Específico */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                Repositório Institucional
              </label>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="any">Todas as fontes e editoras</option>
                <option value="scielo">SciELO (Artigos Brasileiros)</option>
                <option value="edu">Domínios Universitários (.edu / .edu.br)</option>
                <option value="gov">Governamentais (.gov / .gov.br)</option>
              </select>
            </div>
          </div>

          {/* Intervalo Personalizado de Anos se selecionado */}
          {yearOption === 'custom' && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex items-center gap-3 text-xs">
              <span className="font-bold text-indigo-900 dark:text-indigo-200">Ano inicial:</span>
              <input
                type="number"
                value={customYearStart}
                onChange={(e) => setCustomYearStart(e.target.value)}
                className="w-24 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold"
                placeholder="Ex: 2018"
              />
              <span className="font-bold text-indigo-900 dark:text-indigo-200">até Ano final:</span>
              <input
                type="number"
                value={customYearEnd}
                onChange={(e) => setCustomYearEnd(e.target.value)}
                className="w-24 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold"
                placeholder="Ex: 2026"
              />
            </div>
          )}

          {/* Opções de Inclusão de Patentes, Citações e PDF */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600 dark:text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includePatents}
                onChange={(e) => setIncludePatents(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Incluir patentes</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCitations}
                onChange={(e) => setIncludeCitations(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Incluir citações</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyPdf}
                onChange={(e) => setOnlyPdf(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Apenas arquivos PDF (Papers de Acesso Livre)</span>
            </label>
          </div>

          {/* Construtor de Operadores Avançados (Painel Colapsável) */}
          {showAdvancedBuilder && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-indigo-500" />
                <span>Construtor de Filtros Estritos (Google Scholar Syntax)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Autor específico:
                  </label>
                  <input
                    type="text"
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                    placeholder="Ex: Stephen Hawking"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Periódico / Revista:
                  </label>
                  <input
                    type="text"
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    placeholder="Ex: Nature ou Science"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Obrigatório no Título:
                  </label>
                  <input
                    type="text"
                    value={intitleFilter}
                    onChange={(e) => setIntitleFilter(e.target.value)}
                    placeholder="Ex: CRISPR"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Prévia da URL Gerada com Botão de Copiar */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 shrink-0">
                Consulta Montada:
              </span>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate">
                {fullSearchQuery || '—'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                onClick={handleExecuteSearch}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 cursor-pointer"
              >
                <span>Abrir no Google Acadêmico</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pesquisa Cruzada em Outras Bases Científicas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Globe size={16} className="text-blue-500" />
          <span>Pesquisa Cruzada em Outros Repositórios Acadêmicos Conectados</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Com um clique, busque exatamente o termo{' '}
          <strong className="text-slate-700 dark:text-slate-200">"{searchTerm || 'ciência'}"</strong> nas principais bibliotecas científicas abertas:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {alternativeDatabases.map((repo) => (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5">
                    {repo.name}
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {repo.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {repo.desc}
                </p>
              </div>

              <div className="mt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>Buscar neste acervo</span>
                <ArrowRight size={11} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Tópicos e Linhas de Pesquisa Acadêmica Sugeridas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          <span>Tópicos Científicos e Linhas de Pesquisa Recomendadas</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Clique em qualquer tema para carregar a consulta estruturada diretamente no painel de busca:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCHOLAR_CATEGORIES.map((cat) => (
            <div
              key={cat.category}
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.category}</span>
                </div>

                <div className="space-y-1.5">
                  {cat.queries.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => {
                        setSearchTerm(q.query);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full text-left p-2 rounded-xl text-xs hover:bg-white dark:hover:bg-slate-800 transition flex items-center justify-between text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 group cursor-pointer"
                    >
                      <span className="truncate">{q.label}</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico Local de Buscas Acadêmicas */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History size={16} className="text-slate-500" />
              <span>Histórico de Consultas Acadêmicas</span>
            </h3>
            <button
              onClick={handleClearHistory}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Limpar histórico</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((item) => (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => {
                      setSearchTerm(item.query);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-left truncate block max-w-lg cursor-pointer"
                  >
                    {item.query}
                  </button>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Reabrir busca no Google Acadêmico"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guia de Operadores e Citações Científicas */}
      <div className="p-6 rounded-3xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <HelpCircle size={14} className="text-indigo-500" />
          <span>Dicas para Pesquisas Acadêmicas de Alto Impacto</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-[11px] leading-relaxed">
          <p>
            • <strong>Uso de Aspas Exatas</strong>: Utilize <code>"termo composto"</code> para encontrar artigos onde as palavras aparecem exatamente na mesma ordem no resumo ou texto (ex: <code>"aprendizado profundo"</code>).
          </p>
          <p>
            • <strong>Filtro de Arquivo Aberto</strong>: Digite <code>filetype:pdf</code> ao final da sua pesquisa para filtrar teses, dissertações e papers acadêmicos que possuem o PDF integral disponível para download sem paywall.
          </p>
          <p>
            • <strong>Citações Reversas</strong>: No Google Acadêmico, ao abrir um artigo, clique no link <em>"Citado por X"</em> para visualizar todas as pesquisas posteriores que utilizaram aquele paper como referência.
          </p>
          <p>
            • <strong>Integração com WikiWorldWeb</strong>: Use as pesquisas do Google Acadêmico para embasar referências bibliográficas confiáveis e citações científicas nos seus artigos enciclopédicos.
          </p>
        </div>
      </div>
    </div>
  );
};
