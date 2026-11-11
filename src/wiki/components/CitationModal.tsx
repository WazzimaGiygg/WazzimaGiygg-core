import React, { useState, useMemo } from 'react';
import {
  Quote,
  Globe,
  Book,
  FileText,
  X,
  Plus,
  Calendar,
  Link as LinkIcon,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Layers,
  HelpCircle,
} from 'lucide-react';

export type CitationType = 'web' | 'book' | 'journal' | 'basic' | 'reuse';

export interface ExistingNamedRef {
  name: string;
  preview: string;
}

export interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (citationWikitext: string, autoGenerateSection: boolean) => void;
  hasReferencesSection: boolean;
  existingNamedRefs?: ExistingNamedRef[];
  initialSelectedText?: string;
}

export const CitationModal: React.FC<CitationModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  hasReferencesSection,
  existingNamedRefs = [],
  initialSelectedText = '',
}) => {
  const [citationType, setCitationType] = useState<CitationType>('web');

  // Web Fields
  const [webUrl, setWebUrl] = useState('');
  const [webTitle, setWebTitle] = useState(initialSelectedText || '');
  const [webAuthor, setWebAuthor] = useState('');
  const [webSite, setWebSite] = useState('');
  const [webDate, setWebDate] = useState('');
  const [webAccessDate, setWebAccessDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('pt-BR');
  });

  // Book Fields
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookPublisher, setBookPublisher] = useState('');
  const [bookYear, setBookYear] = useState('');
  const [bookPages, setBookPages] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');

  // Journal Fields
  const [journalTitle, setJournalTitle] = useState('');
  const [journalAuthor, setJournalAuthor] = useState('');
  const [journalName, setJournalName] = useState('');
  const [journalVolume, setJournalVolume] = useState('');
  const [journalDate, setJournalDate] = useState('');
  const [journalUrl, setJournalUrl] = useState('');

  // Basic Reference Field
  const [basicText, setBasicText] = useState(initialSelectedText || '');

  // Re-use named ref
  const [selectedReuseName, setSelectedReuseName] = useState(
    existingNamedRefs[0]?.name || ''
  );

  // Common ref name identifier (e.g. <ref name="xyz">)
  const [refName, setRefName] = useState('');

  // Auto-generate References section checkbox
  const [autoGenerateSection, setAutoGenerateSection] = useState(!hasReferencesSection);

  // Helper to set today's access date
  const setTodayAccessDate = () => {
    const today = new Date();
    setWebAccessDate(today.toLocaleDateString('pt-BR'));
  };

  // Build the Wikitext snippet based on current form values
  const generatedWikitext = useMemo(() => {
    const cleanRefName = refName.trim().replace(/["'<>]/g, '');
    const nameAttr = cleanRefName ? ` name="${cleanRefName}"` : '';

    if (citationType === 'reuse') {
      if (!selectedReuseName) return '';
      return `<ref name="${selectedReuseName}" />`;
    }

    if (citationType === 'web') {
      const parts = ['Citar web'];
      if (webUrl.trim()) parts.push(`url=${webUrl.trim()}`);
      if (webTitle.trim()) parts.push(`titulo=${webTitle.trim()}`);
      if (webAuthor.trim()) parts.push(`autor=${webAuthor.trim()}`);
      if (webSite.trim()) parts.push(`site=${webSite.trim()}`);
      if (webDate.trim()) parts.push(`data=${webDate.trim()}`);
      if (webAccessDate.trim()) parts.push(`acessodata=${webAccessDate.trim()}`);

      const inner = `{{${parts.join('|')}}}`;
      return `<ref${nameAttr}>${inner}</ref>`;
    }

    if (citationType === 'book') {
      const parts = ['Citar livro'];
      if (bookTitle.trim()) parts.push(`titulo=${bookTitle.trim()}`);
      if (bookAuthor.trim()) parts.push(`autor=${bookAuthor.trim()}`);
      if (bookPublisher.trim()) parts.push(`editora=${bookPublisher.trim()}`);
      if (bookYear.trim()) parts.push(`ano=${bookYear.trim()}`);
      if (bookPages.trim()) parts.push(`paginas=${bookPages.trim()}`);
      if (bookIsbn.trim()) parts.push(`isbn=${bookIsbn.trim()}`);

      const inner = `{{${parts.join('|')}}}`;
      return `<ref${nameAttr}>${inner}</ref>`;
    }

    if (citationType === 'journal') {
      const parts = ['Citar jornal'];
      if (journalTitle.trim()) parts.push(`titulo=${journalTitle.trim()}`);
      if (journalAuthor.trim()) parts.push(`autor=${journalAuthor.trim()}`);
      if (journalName.trim()) parts.push(`jornal=${journalName.trim()}`);
      if (journalVolume.trim()) parts.push(`volume=${journalVolume.trim()}`);
      if (journalDate.trim()) parts.push(`data=${journalDate.trim()}`);
      if (journalUrl.trim()) parts.push(`url=${journalUrl.trim()}`);

      const inner = `{{${parts.join('|')}}}`;
      return `<ref${nameAttr}>${inner}</ref>`;
    }

    // Basic free-text citation
    const content = basicText.trim() || 'Texto da referência';
    return `<ref${nameAttr}>${content}</ref>`;
  }, [
    citationType,
    refName,
    selectedReuseName,
    webUrl,
    webTitle,
    webAuthor,
    webSite,
    webDate,
    webAccessDate,
    bookTitle,
    bookAuthor,
    bookPublisher,
    bookYear,
    bookPages,
    bookIsbn,
    journalTitle,
    journalAuthor,
    journalName,
    journalVolume,
    journalDate,
    journalUrl,
    basicText,
  ]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!generatedWikitext.trim()) return;
    onInsert(generatedWikitext, autoGenerateSection);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Quote size={16} />
            </span>
            <div>
              <h2
                id="citation-modal-title"
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif-heading"
              >
                Ferramenta de Citação & Referências
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Insira fontes confiáveis com formatação padrão MediaWiki e crie notas de rodapé verificáveis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Citation Type Selector Tabs */}
        <div className="p-2.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto shrink-0 select-none">
          <button
            type="button"
            onClick={() => setCitationType('web')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              citationType === 'web'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Globe size={13} />
            <span>Site / Web</span>
          </button>

          <button
            type="button"
            onClick={() => setCitationType('book')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              citationType === 'book'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Book size={13} />
            <span>Livro</span>
          </button>

          <button
            type="button"
            onClick={() => setCitationType('journal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              citationType === 'journal'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileText size={13} />
            <span>Periódico / Jornal</span>
          </button>

          <button
            type="button"
            onClick={() => setCitationType('basic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              citationType === 'basic'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Quote size={13} />
            <span>Texto Livre</span>
          </button>

          {existingNamedRefs.length > 0 && (
            <button
              type="button"
              onClick={() => setCitationType('reuse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                citationType === 'reuse'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <RotateCcw size={13} />
              <span>Reutilizar ({existingNamedRefs.length})</span>
            </button>
          )}
        </div>

        {/* Modal Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {/* Form Fields: Web Citation */}
          {citationType === 'web' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  URL da Fonte / Notícia *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    placeholder="https://g1.globo.com/sp/sao-paulo/noticia/..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {webUrl && (
                    <a
                      href={webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700 p-1"
                      title="Testar link em nova aba"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Título da Página / Notícia *
                </label>
                <input
                  type="text"
                  value={webTitle}
                  onChange={(e) => setWebTitle(e.target.value)}
                  placeholder="Ex: Metrô inicia testes com novos trens automáticos"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Autor / Jornalista
                  </label>
                  <input
                    type="text"
                    value={webAuthor}
                    onChange={(e) => setWebAuthor(e.target.value)}
                    placeholder="Ex: Silva, João ou G1 SP"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Nome do Site / Veículo
                  </label>
                  <input
                    type="text"
                    value={webSite}
                    onChange={(e) => setWebSite(e.target.value)}
                    placeholder="Ex: G1, Folha de S.Paulo, BBC"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Data de Publicação
                  </label>
                  <input
                    type="text"
                    value={webDate}
                    onChange={(e) => setWebDate(e.target.value)}
                    placeholder="Ex: 15 de maio de 2026 ou 2026-05-15"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono">
                      Data de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={setTodayAccessDate}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-mono hover:underline cursor-pointer"
                    >
                      Preencher hoje
                    </button>
                  </div>
                  <input
                    type="text"
                    value={webAccessDate}
                    onChange={(e) => setWebAccessDate(e.target.value)}
                    placeholder="Ex: 30 de setembro de 2026"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: Book Citation */}
          {citationType === 'book' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Título do Livro / Obra *
                </label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Ex: História do Transporte Ferroviário no Brasil"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Autor(es)
                  </label>
                  <input
                    type="text"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    placeholder="Ex: Oliveira, Carlos & Mendes, Ana"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Editora
                  </label>
                  <input
                    type="text"
                    value={bookPublisher}
                    onChange={(e) => setBookPublisher(e.target.value)}
                    placeholder="Ex: Companhia das Letras"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Ano
                  </label>
                  <input
                    type="text"
                    value={bookYear}
                    onChange={(e) => setBookYear(e.target.value)}
                    placeholder="Ex: 2023"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Páginas Citadas
                  </label>
                  <input
                    type="text"
                    value={bookPages}
                    onChange={(e) => setBookPages(e.target.value)}
                    placeholder="Ex: 45-48"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    ISBN (opcional)
                  </label>
                  <input
                    type="text"
                    value={bookIsbn}
                    onChange={(e) => setBookIsbn(e.target.value)}
                    placeholder="Ex: 978-85-359-0277-8"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: Journal Citation */}
          {citationType === 'journal' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Título do Artigo / Ensaio *
                </label>
                <input
                  type="text"
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  placeholder="Ex: Impactos da Mobilidade Sobre Trilhos na Economia Urbana"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Autor(es)
                  </label>
                  <input
                    type="text"
                    value={journalAuthor}
                    onChange={(e) => setJournalAuthor(e.target.value)}
                    placeholder="Ex: Santos, Roberto & Lima, Fabiana"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Nome do Periódico / Revista
                  </label>
                  <input
                    type="text"
                    value={journalName}
                    onChange={(e) => setJournalName(e.target.value)}
                    placeholder="Ex: Revista Brasileira de Estudos Urbanos"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Volume / Número
                  </label>
                  <input
                    type="text"
                    value={journalVolume}
                    onChange={(e) => setJournalVolume(e.target.value)}
                    placeholder="Ex: v. 14, n. 2"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    Data / Ano
                  </label>
                  <input
                    type="text"
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    placeholder="Ex: 2025"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                    URL (opcional)
                  </label>
                  <input
                    type="url"
                    value={journalUrl}
                    onChange={(e) => setJournalUrl(e.target.value)}
                    placeholder="https://scielo.org/..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: Basic Free-Text Citation */}
          {citationType === 'basic' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Texto da Citação / Referência *
                </label>
                <textarea
                  rows={4}
                  value={basicText}
                  onChange={(e) => setBasicText(e.target.value)}
                  placeholder="Ex: Documento oficial da Companhia do Metrô, Relatório Integrado de Administração 2024, página 12."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Você pode usar links Markdown [https://link.com Texto] ou referenciar documentos físicos.
                </span>
              </div>
            </div>
          )}

          {/* Form Fields: Reuse Existing Named Reference */}
          {citationType === 'reuse' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                  Selecione uma referência já existente no artigo:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {existingNamedRefs.map((ref) => (
                    <label
                      key={ref.name}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border transition cursor-pointer ${
                        selectedReuseName === ref.name
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-200'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reuseRefRadio"
                        value={ref.name}
                        checked={selectedReuseName === ref.name}
                        onChange={() => setSelectedReuseName(ref.name)}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-mono font-bold text-xs block text-purple-700 dark:text-purple-300">
                          name="{ref.name}"
                        </span>
                        <p className="text-[11px] opacity-80 truncate">{ref.preview}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Optional Identifier Name for New Reference */}
          {citationType !== 'reuse' && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono mb-1">
                Nome de identificação da referência (opcional)
              </label>
              <input
                type="text"
                value={refName}
                onChange={(e) => setRefName(e.target.value)}
                placeholder="Ex: g1_noticia ou folha2026 (permite reutilizar a citação em outros trechos)"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Se preenchido, gera &lt;ref name="{refName || 'exemplo'}"&gt;...&lt;/ref&gt;.
              </span>
            </div>
          )}

          {/* Automatic References Section Checkbox */}
          <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoGenerateSection}
                onChange={(e) => setAutoGenerateSection(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="text-[11px] text-slate-700 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white block font-medium">
                  {hasReferencesSection
                    ? 'A seção "== Referências ==" já existe no artigo'
                    : 'Gerar automaticamente a seção "== Referências ==" no final do artigo'}
                </strong>
                <span className="text-[10px] opacity-75">
                  {hasReferencesSection
                    ? 'As citações inseridas serão listadas automaticamente na seção existente.'
                    : 'Insere automaticamente a seção "== Referências ==" com o marcador {{reflist}} ao final do artigo.'}
                </span>
              </div>
            </label>
          </div>

          {/* Real-time Code Preview */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">
              Prévia do Código Wikitexto:
            </span>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto select-all leading-relaxed">
              <code>{generatedWikitext}</code>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>Inserir Referência no Artigo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
