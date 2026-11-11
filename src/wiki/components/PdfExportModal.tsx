import React, { useState } from 'react';
import {
  FileText,
  Download,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  Sparkles,
  BookOpen,
  Link2,
  Printer,
} from 'lucide-react';
import { WikiArticle } from '../types';
import {
  exportArticleToStructuredPdf,
  exportArticleSnapshotToPdf,
  PdfExportOptions,
} from '../utils/pdfExport';

interface PdfExportModalProps {
  article: WikiArticle;
  pageName?: string;
  articleContentRef?: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  article,
  pageName = 'WikiWorldWeb Enciclopédia',
  articleContentRef,
  isOpen,
  onClose,
}) => {
  const [exportMode, setExportMode] = useState<'structured' | 'snapshot'>('structured');
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fontSize, setFontSize] = useState<'compact' | 'normal' | 'large'>('normal');

  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [includeReferences, setIncludeReferences] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [includeLicense, setIncludeLicense] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const options: PdfExportOptions = {
      pageSize,
      orientation,
      includeHeader,
      includeMetadata,
      includeToc,
      includeReferences,
      includeFooter,
      includeLicense,
      fontSize,
      exportMode,
    };

    try {
      if (exportMode === 'snapshot' && articleContentRef?.current) {
        await exportArticleSnapshotToPdf(articleContentRef.current, article, options);
      } else {
        await exportArticleToStructuredPdf(article, pageName, options);
      }

      setSuccessMessage('Arquivo PDF gerado e baixado com sucesso!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setErrorMessage(
        'Ocorreu um erro ao processar o documento PDF. Tente usar o modo de documento estruturado.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0f172a] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-850">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Exportar Artigo para PDF</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                {article.titulo} (?uid={article.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Engine Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
              <Layers size={13} className="text-blue-500" />
              <span>Modo de Renderização</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setExportMode('structured')}
                className={`p-3 rounded-lg border text-left transition relative flex flex-col justify-between ${
                  exportMode === 'structured'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Sparkles size={13} className="text-blue-600" />
                    Documento Vetorial
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Texto selecionável e ultranítido, páginas compactas e sumário editorial estruturado.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportMode('snapshot')}
                className={`p-3 rounded-lg border text-left transition relative flex flex-col justify-between ${
                  exportMode === 'snapshot'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <BookOpen size={13} className="text-slate-600 dark:text-slate-300" />
                    Captura Visual Web
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Preserva tabelas ricas, infoboxes complexas e estilização web idêntica à tela.
                </p>
              </button>
            </div>
          </div>

          {/* Document Format & Layout Options */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <Settings2 size={13} className="text-blue-500" />
              <span>Configuração da Página</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Formato de Papel
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter')}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value="a4">A4 (210 × 297 mm)</option>
                  <option value="letter">Carta / Letter (8.5 × 11 in)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Orientação
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value="portrait">Retrato (Vertical)</option>
                  <option value="landscape">Paisagem (Horizontal)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Escala de Texto
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as 'compact' | 'normal' | 'large')}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value="compact">Compacto (Mais denso)</option>
                  <option value="normal">Padrão Editorial</option>
                  <option value="large">Grande (Leitura facilitada)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content Inclusions Checklist */}
          {exportMode === 'structured' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block uppercase tracking-wide">
                Elementos do Documento
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Cabeçalho Oficial WikiWorldWeb</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Metadados & UID (?uid=...)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeToc}
                    onChange={(e) => setIncludeToc(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Sumário / Índice de Seções</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeReferences}
                    onChange={(e) => setIncludeReferences(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Referências e Citações</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFooter}
                    onChange={(e) => setIncludeFooter(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Numeração & Data de Exportação</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLicense}
                    onChange={(e) => setIncludeLicense(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Nota de Licença CC BY-SA 4.0</span>
                </label>
              </div>
            </div>
          )}

          {/* Feedback states */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <Link2 size={12} className="text-blue-500" />
            <span>?uid={article.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(() => window.print(), 250);
              }}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="Abre a impressão do navegador com a folha de estilos limpa dedicada (sem barras de navegação ou imagens de fundo)"
            >
              <Printer size={13} className="text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">Imprimir /</span> Salvar PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Baixar Documento PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
