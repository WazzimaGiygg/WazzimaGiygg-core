/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Componente interativo e customizável de Citação ABNT (NBR 10520:2023 & NBR 6023:2018)
 * para o Modal de Leitura e Verbetes do Portal WazzimaGiygg Core.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Quote,
  RotateCcw,
  Share2,
  Sliders,
} from 'lucide-react';
import {
  AbntCallPosition,
  AbntCitationConfig,
  AbntCitationStyle,
  AbntParenthesisCase,
  formatAbntDate,
  generateAbntCitationBundle,
} from '../utils/abntCitation';
import { stripHtmlToPlainText } from '../utils/text';

export interface AbntCitationGeneratorProps {
  articleId: string;
  articleTitle: string;
  articleRawContent?: string;
  defaultAuthor: string;
  defaultPortalName?: string;
  defaultYear?: string;
  articleUrl: string;
  canonicalCoreUrl?: string;
  showToast: (msg: string, isError?: boolean) => void;
  onShareBemtevi?: () => void;
}

export default function AbntCitationGenerator({
  articleId,
  articleTitle,
  articleRawContent = '',
  defaultAuthor,
  defaultPortalName = 'WazzimaGiygg Core (core.wazzimagiygg.com)',
  defaultYear = String(new Date().getFullYear()),
  articleUrl,
  canonicalCoreUrl,
  showToast,
  onShareBemtevi,
}: AbntCitationGeneratorProps) {
  const plainBody = useMemo(() => stripHtmlToPlainText(articleRawContent), [articleRawContent]);

  // Sugestões rápidas de excertos extraídas do artigo
  const paragraphSnippets = useMemo(() => {
    if (!plainBody) return [];
    const sentences = plainBody
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 25);
    const chunks: string[] = [];
    if (sentences.length > 0) {
      chunks.push(sentences.slice(0, 2).join(' ').slice(0, 240));
    }
    if (sentences.length > 2) {
      chunks.push(sentences.slice(0, 5).join(' ').slice(0, 420));
    }
    return chunks;
  }, [plainBody]);

  const initialSnippet = useMemo(() => {
    if (paragraphSnippets[0]) return paragraphSnippets[0];
    return plainBody ? plainBody.slice(0, 210) : '';
  }, [paragraphSnippets, plainBody]);

  const [style, setStyle] = useState<AbntCitationStyle>('direta_curta');
  const [callPosition, setCallPosition] = useState<AbntCallPosition>('fim');
  const [parenthesisCase, setParenthesisCase] = useState<AbntParenthesisCase>('uppercase');
  const [authorRaw, setAuthorRaw] = useState<string>(defaultAuthor || 'WAZZIMAGIYGG');
  const [isCorporateAuthor, setIsCorporateAuthor] = useState<boolean>(
    !defaultAuthor ||
      defaultAuthor.toUpperCase().includes('WAZZIMAGIYGG') ||
      defaultAuthor.toUpperCase().includes('REDAÇÃO') ||
      defaultAuthor.toUpperCase().includes('NOTMEDIAWIKI')
  );
  const [customTitle, setCustomTitle] = useState<string>(articleTitle);
  const [subtitle, setSubtitle] = useState<string>('');
  const [portalName, setPortalName] = useState<string>(defaultPortalName);
  const [location, setLocation] = useState<string>('');
  const [year, setYear] = useState<string>(defaultYear);
  const [pageOrSection, setPageOrSection] = useState<string>('online');
  const [accessDate, setAccessDate] = useState<string>(() => formatAbntDate());
  const [useCanonicalCoreUrl, setUseCanonicalCoreUrl] = useState<boolean>(Boolean(canonicalCoreUrl));
  const [excerptText, setExcerptText] = useState<string>(initialSnippet);
  const [apudOriginalAuthor, setApudOriginalAuthor] = useState<string>('');
  const [apudOriginalYear, setApudOriginalYear] = useState<string>('');
  const [includeReferenceInExport, setIncludeReferenceInExport] = useState<boolean>(true);
  const [showAdvancedFields, setShowAdvancedFields] = useState<boolean>(false);

  const [copiedMode, setCopiedMode] = useState<'none' | 'full' | 'intext' | 'ref' | 'uid'>('none');

  // Sincroniza estados quando o usuário abre outro artigo no modal
  useEffect(() => {
    setCustomTitle(articleTitle);
    setAuthorRaw(defaultAuthor || 'WAZZIMAGIYGG');
    setIsCorporateAuthor(
      !defaultAuthor ||
        defaultAuthor.toUpperCase().includes('WAZZIMAGIYGG') ||
        defaultAuthor.toUpperCase().includes('REDAÇÃO') ||
        defaultAuthor.toUpperCase().includes('NOTMEDIAWIKI')
    );
    setPortalName(defaultPortalName);
    setYear(defaultYear);
    setExcerptText(initialSnippet);
    setCopiedMode('none');
  }, [articleId, articleTitle, defaultAuthor, defaultPortalName, defaultYear, initialSnippet]);

  const activeUrl = useCanonicalCoreUrl && canonicalCoreUrl ? canonicalCoreUrl : articleUrl;

  const citationConfig: AbntCitationConfig = {
    style,
    callPosition,
    parenthesisCase,
    authorRaw,
    isCorporateAuthor,
    title: customTitle,
    subtitle,
    portalName,
    location,
    year,
    pageOrSection,
    accessDate,
    url: activeUrl,
    excerptText,
    apudOriginalAuthor,
    apudOriginalYear,
    includeReferenceInExport,
  };

  const generated = useMemo(() => generateAbntCitationBundle(citationConfig), [
    style,
    callPosition,
    parenthesisCase,
    authorRaw,
    isCorporateAuthor,
    customTitle,
    subtitle,
    portalName,
    location,
    year,
    pageOrSection,
    accessDate,
    activeUrl,
    excerptText,
    apudOriginalAuthor,
    apudOriginalYear,
    includeReferenceInExport,
  ]);

  const triggerCopyFeedback = (mode: 'full' | 'intext' | 'ref' | 'uid') => {
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode('none'), 2600);
  };

  const handleCopyFull = () => {
    navigator.clipboard.writeText(generated.fullFormattedText);
    triggerCopyFeedback('full');
    showToast('Citação ABNT formatada e referência copiadas!');
  };

  const handleCopyInTextOnly = () => {
    navigator.clipboard.writeText(generated.inTextCitation);
    triggerCopyFeedback('intext');
    showToast('Citação no texto (ABNT NBR 10520) copiada!');
  };

  const handleCopyReferenceOnly = () => {
    navigator.clipboard.writeText(generated.referencePlain);
    triggerCopyFeedback('ref');
    showToast('Referência bibliográfica (ABNT NBR 6023) copiada!');
  };

  const handleDownloadTxt = () => {
    const header = [
      '====================================================================',
      'GERADOR DE CITAÇÃO ACADÊMICA — PADRÃO ABNT (NBR 10520 & NBR 6023)',
      `Documento: ${customTitle}`,
      `Identificador Permanente (UID): ${articleId}`,
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      '====================================================================',
      '',
    ].join('\n');
    const blob = new Blob([header + generated.fullFormattedText + '\n'], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeSlug = (articleId || 'citacao').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.href = url;
    a.download = `citacao-abnt-${safeSlug}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Arquivo .txt formatado em ABNT baixado com sucesso!');
  };

  const handleDownloadRtf = () => {
    const blob = new Blob([generated.rtfContent], {
      type: 'application/rtf;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeSlug = (articleId || 'citacao').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.href = url;
    a.download = `citacao-abnt-${safeSlug}.rtf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Documento .rtf (Word / LibreOffice) com recuo ABNT exportado!');
  };

  const handleReset = () => {
    setStyle('direta_curta');
    setCallPosition('fim');
    setParenthesisCase('uppercase');
    setAuthorRaw(defaultAuthor || 'WAZZIMAGIYGG');
    setCustomTitle(articleTitle);
    setSubtitle('');
    setPortalName(defaultPortalName);
    setLocation('');
    setYear(defaultYear);
    setPageOrSection('online');
    setAccessDate(formatAbntDate());
    setExcerptText(initialSnippet);
    setApudOriginalAuthor('');
    setApudOriginalYear('');
    setIncludeReferenceInExport(true);
    showToast('Campos do gerador ABNT restaurados.');
  };

  const styleOptions: Array<{
    id: AbntCitationStyle;
    label: string;
    hint: string;
  }> = [
    {
      id: 'direta_curta',
      label: 'Direta Curta',
      hint: 'Até 3 linhas, entre aspas duplas ("...")',
    },
    {
      id: 'direta_longa',
      label: 'Direta Longa (+3 linhas)',
      hint: 'Bloco independente, recuo de 4 cm, sem aspas',
    },
    {
      id: 'indireta',
      label: 'Indireta (Paráfrase)',
      hint: 'Redação própria fiel à fonte, sem aspas',
    },
    {
      id: 'apud',
      label: 'Citação de Citação (apud)',
      hint: 'Autor citado dentro deste documento',
    },
  ];

  return (
    <section
      aria-label="Gerador de Citação ABNT Customizável"
      className="mt-10 p-4 sm:p-5 bg-white dark:bg-[#1E1E1B] border-2 border-[#141414] dark:border-[#3E3D38] font-mono text-xs shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
    >
      {/* Cabeçalho do Gerador ABNT */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-300 dark:border-[#34332F]">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>Gerador de Citação Acadêmica ABNT</span>
              <span className="bg-stone-900 dark:bg-amber-900/60 text-amber-300 px-1.5 py-0.5 text-[9px] font-bold">
                NBR 10520 &amp; 6023
              </span>
            </h3>
            <p className="text-[10px] text-stone-600 dark:text-stone-400">
              Escolha o estilo (direta ou indireta), personalize os metadados e exporte formatado.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowAdvancedFields((prev) => !prev)}
            className="paper-button-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            title="Abrir/ocultar campos avançados da referência NBR 6023"
          >
            <Sliders className="w-3 h-3" />
            <span>{showAdvancedFields ? 'Menos Campos' : 'Personalizar'}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="paper-button-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            title="Restaurar valores originais do documento"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Restaurar</span>
          </button>
          {onShareBemtevi && (
            <button
              type="button"
              onClick={onShareBemtevi}
              className="paper-button bg-[#667eea] hover:bg-[#5a6fd6] text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-none"
              title="Debater este documento na rede social Bemtevi"
            >
              <Share2 className="w-3 h-3 text-white" />
              <span>Bemtevi</span>
            </button>
          )}
        </div>
      </div>

      {/* Seletor de Estilo de Citação ABNT */}
      <div className="mt-3">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
          1. Estilo de Citação (ABNT NBR 10520):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {styleOptions.map((opt) => {
            const isSelected = style === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStyle(opt.id)}
                className={`text-left p-2.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#141414] dark:bg-stone-100 text-white dark:text-stone-950 border-[#141414] dark:border-stone-100 shadow-[2px_2px_0px_0px_rgba(217,119,6,0.9)]'
                    : 'bg-stone-50 dark:bg-[#141413] text-stone-800 dark:text-stone-200 border-stone-300 dark:border-[#34332F] hover:border-stone-600'
                }`}
              >
                <div className="font-bold text-[11px] uppercase flex items-center justify-between gap-1">
                  <span>{opt.label}</span>
                  {isSelected && <Quote className="w-3 h-3 text-amber-400 dark:text-amber-700 shrink-0" />}
                </div>
                <div
                  className={`text-[9px] mt-0.5 leading-snug ${
                    isSelected ? 'text-stone-300 dark:text-stone-700' : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {opt.hint}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controles rápidos de posição, caixa e autor */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">
            Posição da Chamada
          </label>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setCallPosition('fim')}
              className={`px-2 py-1.5 text-[10px] font-bold border cursor-pointer ${
                callPosition === 'fim'
                  ? 'bg-amber-600 text-white border-[#141414]'
                  : 'bg-stone-50 dark:bg-[#141413] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-[#34332F]'
              }`}
            >
              Fim (AUTOR, ano)
            </button>
            <button
              type="button"
              onClick={() => setCallPosition('texto')}
              className={`px-2 py-1.5 text-[10px] font-bold border cursor-pointer ${
                callPosition === 'texto'
                  ? 'bg-amber-600 text-white border-[#141414]'
                  : 'bg-stone-50 dark:bg-[#141413] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-[#34332F]'
              }`}
            >
              No Texto: Autor (ano)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">
            Padrão nos Parênteses
          </label>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setParenthesisCase('uppercase')}
              className={`px-2 py-1.5 text-[10px] font-bold border cursor-pointer ${
                parenthesisCase === 'uppercase'
                  ? 'bg-[#141414] dark:bg-stone-200 text-white dark:text-stone-950 border-[#141414]'
                  : 'bg-stone-50 dark:bg-[#141413] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-[#34332F]'
              }`}
              title="Padrão clássico exigido por diversas bancas universitárias"
            >
              CAIXA ALTA
            </button>
            <button
              type="button"
              onClick={() => setParenthesisCase('titlecase')}
              className={`px-2 py-1.5 text-[10px] font-bold border cursor-pointer ${
                parenthesisCase === 'titlecase'
                  ? 'bg-[#141414] dark:bg-stone-200 text-white dark:text-stone-950 border-[#141414]'
                  : 'bg-stone-50 dark:bg-[#141413] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-[#34332F]'
              }`}
              title="Atualização oficial da NBR 10520:2023"
            >
              NBR 2023 (Misto)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">
            Autor / Entidade
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={authorRaw}
              onChange={(e) => setAuthorRaw(e.target.value)}
              placeholder="Ex: Pedro Henrique Cardona Peres"
              className="flex-1 min-w-0 px-2 py-1.5 text-[11px] bg-stone-50 dark:bg-[#141413] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-[#34332F] focus:outline-none focus:border-[#141414]"
            />
            <button
              type="button"
              onClick={() => setIsCorporateAuthor((prev) => !prev)}
              className={`px-2 py-1 text-[9px] font-bold border cursor-pointer shrink-0 ${
                isCorporateAuthor
                  ? 'bg-sky-800 text-white border-sky-900'
                  : 'bg-stone-100 dark:bg-[#242320] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-[#34332F]'
              }`}
              title="Alternar entre Pessoa Física (SOBRENOME, Nome) e Entidade Coletiva"
            >
              {isCorporateAuthor ? 'Entidade' : 'Pessoa'}
            </button>
          </div>
        </div>
      </div>

      {/* Campo de texto da citação / paráfrase */}
      <div className="mt-3">
        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
          <label className="text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300">
            {style === 'indireta'
              ? '2. Texto da Paráfrase (escreva com suas palavras ou adapte abaixo):'
              : '2. Trecho Literal do Documento para Citar:'}
          </label>
          <div className="flex items-center gap-1.5 text-[9px] text-stone-500 dark:text-stone-400">
            <span>
              {generated.charCount} chars (~{generated.estimatedLines}{' '}
              {generated.estimatedLines === 1 ? 'linha' : 'linhas'})
            </span>
            {style === 'direta_curta' && generated.estimatedLines > 3 && (
              <button
                type="button"
                onClick={() => setStyle('direta_longa')}
                className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-400 font-bold cursor-pointer"
              >
                +3 linhas: mudar para Direta Longa
              </button>
            )}
            {paragraphSnippets.length > 0 && (
              <button
                type="button"
                onClick={() => setExcerptText(paragraphSnippets[paragraphSnippets.length > 1 && style === 'direta_longa' ? 1 : 0])}
                className="underline hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
              >
                Extrair trecho do artigo
              </button>
            )}
          </div>
        </div>
        <textarea
          rows={style === 'direta_longa' ? 3 : 2}
          value={excerptText}
          onChange={(e) => setExcerptText(e.target.value)}
          placeholder={
            style === 'indireta'
              ? 'Escreva aqui a paráfrase com suas palavras baseada no artigo...'
              : 'Cole ou edite o trecho exato do documento que deseja citar...'
          }
          className="w-full p-2.5 text-[11px] font-serif bg-stone-50 dark:bg-[#141413] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-[#34332F] focus:outline-none focus:border-[#141414] leading-relaxed"
        />
      </div>

      {/* Campos para apud */}
      {style === 'apud' && (
        <div className="mt-2.5 p-2.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase text-amber-950 dark:text-amber-200 mb-1">
              Autor Original Citado no Texto
            </label>
            <input
              type="text"
              value={apudOriginalAuthor}
              onChange={(e) => setApudOriginalAuthor(e.target.value)}
              placeholder="Ex: Paulo Freire"
              className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#141413] text-stone-900 dark:text-stone-100 border border-amber-400 dark:border-amber-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-amber-950 dark:text-amber-200 mb-1">
              Ano da Obra Original
            </label>
            <input
              type="text"
              value={apudOriginalYear}
              onChange={(e) => setApudOriginalYear(e.target.value)}
              placeholder="Ex: 1996"
              className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#141413] text-stone-900 dark:text-stone-100 border border-amber-400 dark:border-amber-700"
            />
          </div>
        </div>
      )}

      {/* Campos Avançados / Metadados NBR 6023 */}
      {showAdvancedFields && (
        <div className="mt-3 p-3 bg-stone-100/80 dark:bg-[#151513] border border-stone-300 dark:border-[#34332F] space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">
                Título do Documento
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#1A1A18] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-[#34332F]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">
                Subtítulo (Opcional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: análise documental"
                className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#1A1A18] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-[#34332F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">
                Portal / Veículo
              </label>
              <input
                type="text"
                value={portalName}
                onChange={(e) => setPortalName(e.target.value)}
                className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#1A1A18] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-[#34332F]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">
                Ano
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#1A1A18] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-[#34332F]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">
                Página / Seção
              </label>
              <input
                type="text"
                value={pageOrSection}
                onChange={(e) => setPageOrSection(e.target.value)}
                placeholder="Ex: 12 ou online"
                className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#1A1A18] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-[#34332F]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">
                Local (Opcional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#1A1A18] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-[#34332F]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300">
                Acesso em:
              </label>
              <input
                type="text"
                value={accessDate}
                onChange={(e) => setAccessDate(e.target.value)}
                className="w-32 px-2 py-0.5 text-[11px] bg-white dark:bg-[#1A1A18] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-[#34332F]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[10px]">
              <label className="flex items-center gap-1.5 cursor-pointer text-stone-800 dark:text-stone-200">
                <input
                  type="checkbox"
                  checked={includeReferenceInExport}
                  onChange={(e) => setIncludeReferenceInExport(e.target.checked)}
                />
                <span>Incluir Referência NBR 6023 na exportação</span>
              </label>
              {canonicalCoreUrl && (
                <label className="flex items-center gap-1.5 cursor-pointer text-stone-800 dark:text-stone-200">
                  <input
                    type="checkbox"
                    checked={useCanonicalCoreUrl}
                    onChange={(e) => setUseCanonicalCoreUrl(e.target.checked)}
                  />
                  <span>Usar URL canônica (core.wazzimagiygg.com)</span>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prévia Formatada em Tempo Real */}
      <div className="mt-3 p-3.5 bg-stone-50 dark:bg-[#141413] border border-stone-300 dark:border-[#34332F] space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>Prévia da Citação no Texto (ABNT NBR 10520)</span>
            </span>
            <button
              type="button"
              onClick={handleCopyInTextOnly}
              className="text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white underline cursor-pointer flex items-center gap-1"
            >
              {copiedMode === 'intext' ? (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span>Copiada</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar Citação</span>
                </>
              )}
            </button>
          </div>

          {style === 'direta_longa' ? (
            <div className="font-serif text-stone-900 dark:text-stone-100 bg-white dark:bg-[#1A1A18] p-3 border border-stone-200 dark:border-[#2E2D28] space-y-1.5">
              {callPosition === 'texto' && (
                <p className="text-xs leading-relaxed">
                  {generated.inTextCitation.split('\n\n')[0]}
                </p>
              )}
              <blockquote className="pl-10 sm:pl-16 text-[11px] leading-snug text-stone-800 dark:text-stone-200 border-l-2 border-amber-500">
                {callPosition === 'texto'
                  ? generated.inTextCitation.split('\n\n').slice(1).join(' ').trim()
                  : generated.inTextCitation.trim()}
              </blockquote>
            </div>
          ) : (
            <p className="font-serif text-xs leading-relaxed text-stone-900 dark:text-stone-100 bg-white dark:bg-[#1A1A18] p-2.5 border border-stone-200 dark:border-[#2E2D28] select-all">
              {generated.inTextCitation}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-stone-200 dark:border-[#2E2D28]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>Referência Bibliográfica (ABNT NBR 6023)</span>
            </span>
            <button
              type="button"
              onClick={handleCopyReferenceOnly}
              className="text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white underline cursor-pointer flex items-center gap-1"
            >
              {copiedMode === 'ref' ? (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span>Copiada</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar Referência</span>
                </>
              )}
            </button>
          </div>
          <div className="text-[11px] leading-relaxed text-stone-700 dark:text-stone-300 break-all bg-white dark:bg-[#1A1A18] p-2.5 border border-stone-200 dark:border-[#2E2D28] select-all">
            <span>{generated.referenceParts.authorPrefix}</span>
            <strong className="text-stone-950 dark:text-stone-50">
              {generated.referenceParts.titleBold}
            </strong>
            <span>{generated.referenceParts.subtitleSuffix}</span>
            <span>{generated.referenceParts.restSuffix}</span>
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 dark:text-sky-400 hover:text-red-700 dark:hover:text-red-400 underline font-bold"
              title={`Abrir artigo "${articleTitle}" (?uid=${articleId})`}
            >
              {generated.referenceParts.url}
            </a>
            <span>{generated.referenceParts.accessSuffix}</span>
          </div>
        </div>
      </div>

      {/* Botões de Exportação Acadêmica */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyFull}
            className="paper-button px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            title="Copiar citação no texto + referência ABNT formatadas"
          >
            {copiedMode === 'full' ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
            )}
            <span>{copiedMode === 'full' ? 'Texto Formatado Copiado!' : 'Copiar Texto Formatado'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="paper-button-secondary px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            title="Baixar citação e referência como arquivo de texto formatado (.txt)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Exportar .TXT</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadRtf}
            className="paper-button-secondary px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            title="Baixar documento formatado (.rtf) compatível com Microsoft Word, LibreOffice e Google Docs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-700 dark:text-sky-400" />
            <span>Exportar .RTF (Word)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(activeUrl);
              triggerCopyFeedback('uid');
              showToast(`Link do UID copiado: ?uid=${articleId}`);
            }}
            className="paper-button-secondary px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            title="Copiar apenas o link permanente do UID"
          >
            <Share2 className="w-3 h-3" />
            <span>{copiedMode === 'uid' ? 'Link Copiado!' : 'Copiar Link UID'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-stone-600 dark:text-stone-400">
          <span className="font-bold uppercase">UID:</span>
          <code className="bg-amber-100 dark:bg-amber-950/60 text-stone-900 dark:text-amber-200 font-bold px-1.5 py-0.5 border border-amber-300 dark:border-amber-700">
            {articleId}
          </code>
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 dark:text-sky-400 hover:underline flex items-center gap-0.5 font-semibold"
            title={`Abrir artigo "${articleTitle}" pelo UID`}
          >
            <span>Abrir</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
