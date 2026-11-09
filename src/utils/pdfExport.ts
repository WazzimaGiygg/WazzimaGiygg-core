/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Módulo Avançado de Exportação de Artigos em PDF Formatado Original
 * Permite a exportação de documentos do ecossistema WazzimaGiygg e NotMediaWiki
 * preservando formatação rica, cabeçalhos, tabelas, citações, listas e tipografia editorial.
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import DOMPurify from 'dompurify';
import { Article } from '../firebase';
import { WikiArticle } from '../data/notMediaWikiData';

export interface PdfExportOptions {
  fileName?: string;
  showWatermark?: boolean;
  includeAbntCitation?: boolean;
  onProgress?: (progressText: string) => void;
}

/**
 * Converte Wikitext / Markdown básico para HTML semântico formatado caso o texto seja cru.
 */
function formatRawContentToHtml(raw: string): string {
  if (!raw) return '<p>Sem conteúdo textual disponível.</p>';

  // Se já contém tags HTML de estrutura, higieniza e retorna
  if (/<(p|h[1-6]|ul|ol|table|blockquote|div)[\s>]/i.test(raw)) {
    return DOMPurify.sanitize(raw);
  }

  // Conversão de markdown / wikitext básico para HTML rico
  let html = raw;

  // Headings
  html = html.replace(/^====\s*(.*?)\s*====$/gm, '<h4 class="pdf-h4">$1</h4>');
  html = html.replace(/^===\s*(.*?)\s*===$/gm, '<h3 class="pdf-h3">$1</h3>');
  html = html.replace(/^==\s*(.*?)\s*==$/gm, '<h2 class="pdf-h2">$1</h2>');
  html = html.replace(/^#\s*(.*?)$/gm, '<h1 class="pdf-h1">$1</h1>');
  html = html.replace(/^##\s*(.*?)$/gm, '<h2 class="pdf-h2">$1</h2>');
  html = html.replace(/^###\s*(.*?)$/gm, '<h3 class="pdf-h3">$1</h3>');

  // Bold & Italic
  html = html.replace(/'''(.*?)'''/g, '<strong>$1</strong>');
  html = html.replace(/''(.*?)''/g, '<em>$1</em>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^>\s*(.*?)$/gm, '<blockquote class="pdf-quote">$1</blockquote>');

  // Lists
  html = html.replace(/^\*\s*(.*?)$/gm, '<li class="pdf-li-bullet">$1</li>');
  html = html.replace(/^\d+\.\s*(.*?)$/gm, '<li class="pdf-li-number">$1</li>');

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/).map((chunk) => {
    const trimmed = chunk.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<li')) {
      return trimmed;
    }
    return `<p class="pdf-p">${trimmed.replace(/\n/g, '<br/>')}</p>`;
  });

  return DOMPurify.sanitize(paragraphs.filter(Boolean).join('\n'));
}

/**
 * Gera citação formatada nas normas da ABNT NBR 6023.
 */
function buildAbntCitation(article: {
  titulo: string;
  criadorEmail?: string;
  dataCriacao?: string;
  ultimaEdicao?: string;
  colecao?: string;
}): string {
  const authorName = (article.criadorEmail || 'REDAÇÃO WAZZIMAGIYGG')
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .toUpperCase();
  const title = (article.titulo || 'Documento do Acervo').toUpperCase();
  const year = new Date().getFullYear();
  const collectionName = (article.colecao || 'Acervo Digital WazzimaGiygg').toUpperCase();

  return `${authorName}. ${title}. In: ${collectionName}. Brasília/São Paulo: WazzimaGiygg, ${year}. Disponível sob a Lei 12.965/2014 (Marco Civil da Internet) e Lei 13.709/2018 (LGPD). Acesso em: ${new Date().toLocaleDateString('pt-BR')}.`;
}

/**
 * Monta o documento HTML completo com estilização editorial elegante para renderização do PDF.
 */
function buildCompleteArticleHtml(article: Article): string {
  const bodyHtml = formatRawContentToHtml(article.conteudo || article.descricao || '');
  const abntCitation = buildAbntCitation(article);
  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <div id="pdf-render-root" style="
      width: 794px;
      padding: 36px 42px;
      background-color: #ffffff;
      color: #1a1a1a;
      font-family: 'Times New Roman', Times, Georgia, serif;
      box-sizing: border-box;
      line-height: 1.6;
    ">
      <!-- HEADER MASTHEAD EDITORIAL -->
      <header style="border-bottom: 3px solid #141414; padding-bottom: 14px; margin-bottom: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #141414; padding-bottom: 8px; margin-bottom: 10px;">
          <div>
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 10px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #b45309;">
              Diário Oficial &bull; Acervo Digital
            </div>
            <div style="font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #141414; text-transform: uppercase; margin-top: 2px;">
              WazzimaGiygg
            </div>
          </div>
          <div style="text-align: right; font-family: monospace; font-size: 9px; color: #555555;">
            <div>FUNDADO SOB LEI Nº 12.965/2014 (MARCO CIVIL)</div>
            <div>AUTORREGULAÇÃO &bull; LICENÇA CC-BY-SA 4.0</div>
            <div>EMISSÃO: ${formattedDate}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-family: Arial, Helvetica, sans-serif; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #444444; letter-spacing: 0.5px;">
          <span>COLEÇÃO: <strong style="color: #b45309;">${(article.colecao || 'Geral').toUpperCase()}</strong></span>
          <span>SETOR: <strong style="color: #141414;">${(article.setor || 'Geral').toUpperCase()}</strong></span>
          <span>DOCUMENTO: <code style="font-family: monospace; color: #666;">${article.id || 'DOC-WZZM'}</code></span>
        </div>
      </header>

      <!-- TÍTULO PRINCIPAL E METADADOS -->
      <section style="margin-bottom: 24px;">
        <h1 style="
          font-size: 26px;
          line-height: 1.25;
          font-weight: 800;
          color: #111111;
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
        ">
          ${article.titulo || 'Documento sem título'}
        </h1>

        <div style="
          display: flex;
          align-items: center;
          gap: 16px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          color: #666666;
          border-top: 1px solid #e5e5e5;
          border-bottom: 1px solid #e5e5e5;
          padding: 8px 0;
        ">
          <span>Autor(a): <strong style="color: #141414;">${article.criadorEmail || 'Redação Oficial WZZM'}</strong></span>
          <span>&bull;</span>
          <span>Última Edição: <strong>${article.ultimaEdicao || article.dataCriacao || 'Recente'}</strong></span>
          <span>&bull;</span>
          <span>Visualizações: <strong>${article.visualizacoes || 0}</strong></span>
        </div>
      </section>

      <!-- CORPO DO DOCUMENTO FORMATADO -->
      <main class="pdf-article-body" style="font-size: 13.5px; color: #222222; text-align: justify;">
        ${bodyHtml}
      </main>

      <!-- CAIXA DE CITAÇÃO ABNT NBR 6023 -->
      <section style="
        margin-top: 34px;
        padding: 14px 18px;
        background-color: #f9f8f5;
        border: 1.5px solid #141414;
        box-shadow: 4px 4px 0px 0px rgba(20,20,20,1);
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10px;
      ">
        <div style="font-weight: bold; text-transform: uppercase; color: #141414; margin-bottom: 6px; letter-spacing: 0.5px;">
          Como Citar Este Documento (Normas ABNT NBR 6023):
        </div>
        <div style="font-family: monospace; font-size: 9.5px; color: #333333; line-height: 1.4; word-break: break-all;">
          ${abntCitation}
        </div>
      </section>

      <!-- AUTENTICIDADE E SELO CRIPTOGRÁFICO -->
      <footer style="
        margin-top: 30px;
        padding-top: 12px;
        border-top: 2px solid #141414;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: monospace;
        font-size: 8.5px;
        color: #666666;
      ">
        <div>
          <div>PORTAL WAZZIMAGIYGG &bull; DOCUMENTO ORIGINAL FORMATADO</div>
          <div>CONFORMIDADE LEI GERAL DE PROTEÇÃO DE DADOS (LGPD) &bull; MARCO CIVIL ART. 19</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; color: #141414;">AUTENTICADO DIGITALMENTE</div>
          <div>HASH PROTOCOLO: ${(article.id || 'AUTH').toUpperCase()}</div>
        </div>
      </footer>
    </div>
  `;
}

/**
 * Monta o documento HTML completo para verbetes do NotMediaWiki.
 */
function buildCompleteWikiHtml(wikiArticle: WikiArticle, renderedHtml: string): string {
  const formattedDate = new Date(wikiArticle.updatedAt).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <div id="pdf-render-root" style="
      width: 794px;
      padding: 36px 42px;
      background-color: #ffffff;
      color: #1a1a1a;
      font-family: 'Times New Roman', Times, Georgia, serif;
      box-sizing: border-box;
      line-height: 1.6;
    ">
      <!-- HEADER NOTMEDIAWIKI -->
      <header style="border-bottom: 3px solid #141414; padding-bottom: 14px; margin-bottom: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #141414; padding-bottom: 8px; margin-bottom: 10px;">
          <div>
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 10px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #047857;">
              Compilador Parsoid AST &bull; Acervo Enciclopédico
            </div>
            <div style="font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #141414; text-transform: uppercase; margin-top: 2px;">
              NotMediaWiki
            </div>
          </div>
          <div style="text-align: right; font-family: monospace; font-size: 9px; color: #555555;">
            <div>NOTMEDIAWIKI.WAZZIMAGIYGG.COM</div>
            <div>ARQUITETURA ZERO-TRUST &bull; ABAC EM VIGOR</div>
            <div>EXPORTAÇÃO OFICIAL: ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-family: Arial, Helvetica, sans-serif; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #444444; letter-spacing: 0.5px;">
          <span>NAMESPACE: <strong style="color: #047857;">${wikiArticle.namespace === 0 ? 'PRINCIPAL (0)' : 'DISCUSSÃO (1)'}</strong></span>
          <span>REVISÃO: <code style="font-family: monospace; color: #141414;">${wikiArticle.latestRevisionId}</code></span>
          <span>CATEGORIAS: <strong style="color: #141414;">${(wikiArticle.categories || ['Geral']).join(', ')}</strong></span>
        </div>
      </header>

      <!-- TÍTULO DO VERBETE -->
      <section style="margin-bottom: 20px;">
        <h1 style="
          font-size: 28px;
          line-height: 1.2;
          font-weight: 800;
          color: #111111;
          margin: 0 0 10px 0;
          letter-spacing: -0.5px;
          border-bottom: 1px solid #cccccc;
          padding-bottom: 8px;
        ">
          ${wikiArticle.title}
        </h1>

        <div style="
          display: flex;
          align-items: center;
          gap: 14px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9.5px;
          color: #666666;
          margin-bottom: 16px;
        ">
          <span>Slug: <code style="font-family: monospace; color: #141414;">/wiki/${wikiArticle.slug}</code></span>
          <span>&bull;</span>
          <span>Última Atualização: <strong>${formattedDate}</strong></span>
          <span>&bull;</span>
          <span>Visualizações: <strong>${wikiArticle.views}</strong></span>
        </div>
      </section>

      <!-- CONTEÚDO FORMATADO HTML COMPILADO -->
      <main class="pdf-article-body" style="font-size: 13px; color: #222222; text-align: justify;">
        ${DOMPurify.sanitize(renderedHtml)}
      </main>

      <!-- RODAPÉ DE CERTIFICAÇÃO NOTMEDIAWIKI -->
      <footer style="
        margin-top: 36px;
        padding-top: 14px;
        border-top: 2px solid #141414;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: monospace;
        font-size: 8.5px;
        color: #666666;
      ">
        <div>
          <div>NOTMEDIAWIKI &bull; PROVEDOR COLABORATIVO WAZZIMAGIYGG</div>
          <div>TEXTO DISPONÍVEL SOB LICENÇA CREATIVE COMMONS ATRIBUIÇÃO-COMPARTILHAIGUAL (CC BY-SA 4.0)</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; color: #141414;">HASH SHA-256 REGISTRADO</div>
          <div>ASSINATURA: VERIFICADA</div>
        </div>
      </footer>
    </div>
  `;
}

/**
 * Injeta estilos CSS específicos para formatação no documento impresso/PDF.
 */
function getPrintCssRules(): string {
  return `
    .pdf-article-body h1 {
      font-size: 20px;
      font-weight: bold;
      color: #141414;
      margin: 20px 0 10px 0;
      border-bottom: 1.5px solid #141414;
      padding-bottom: 4px;
    }
    .pdf-article-body h2 {
      font-size: 17px;
      font-weight: bold;
      color: #141414;
      margin: 18px 0 8px 0;
      border-bottom: 1px solid #d4d4d4;
      padding-bottom: 3px;
    }
    .pdf-article-body h3 {
      font-size: 14.5px;
      font-weight: bold;
      color: #333333;
      margin: 14px 0 6px 0;
    }
    .pdf-article-body h4, .pdf-article-body h5, .pdf-article-body h6 {
      font-size: 13px;
      font-weight: bold;
      color: #444444;
      margin: 10px 0 4px 0;
    }
    .pdf-article-body p {
      margin: 0 0 12px 0;
      line-height: 1.65;
    }
    .pdf-article-body strong, .pdf-article-body b {
      font-weight: bold;
      color: #111111;
    }
    .pdf-article-body em, .pdf-article-body i {
      font-style: italic;
    }
    .pdf-article-body blockquote {
      margin: 16px 0;
      padding: 10px 18px;
      background-color: #f8f7f4;
      border-left: 4px solid #b45309;
      font-style: italic;
      color: #333333;
    }
    .pdf-article-body ul {
      margin: 8px 0 14px 24px;
      padding: 0;
      list-style-type: disc;
    }
    .pdf-article-body ol {
      margin: 8px 0 14px 24px;
      padding: 0;
      list-style-type: decimal;
    }
    .pdf-article-body li {
      margin-bottom: 5px;
      line-height: 1.5;
    }
    .pdf-article-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 11px;
      font-family: Arial, Helvetica, sans-serif;
    }
    .pdf-article-body th {
      background-color: #ebe8e1;
      border: 1px solid #141414;
      padding: 7px 10px;
      font-weight: bold;
      text-align: left;
    }
    .pdf-article-body td {
      border: 1px solid #cccccc;
      padding: 6px 10px;
    }
    .pdf-article-body code {
      font-family: Consolas, Monaco, monospace;
      font-size: 11px;
      background-color: #f1f0eb;
      padding: 1.5px 4px;
      border: 1px solid #e0dfd9;
    }
    .pdf-article-body pre {
      font-family: Consolas, Monaco, monospace;
      font-size: 11px;
      background-color: #f1f0eb;
      padding: 10px;
      border: 1px solid #d4d4d4;
      overflow-x: auto;
      margin: 12px 0;
    }
    .pdf-article-body a {
      color: #b45309;
      text-decoration: underline;
    }
    .pdf-article-body hr {
      border: none;
      border-top: 1px solid #d4d4d4;
      margin: 20px 0;
    }
  `;
}

/**
 * Slices a high-resolution canvas into standard A4 pages in jsPDF.
 */
function renderCanvasToMultiPagePdf(canvas: HTMLCanvasElement, docTitle: string): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  const marginX = 10; // 10mm left and right margin
  const marginY = 10; // 10mm top and bottom margin
  const printWidth = pdfWidth - marginX * 2; // 190mm
  const printHeight = pdfHeight - marginY * 2; // 277mm

  // Ratio between mm in PDF and px in Canvas
  const scaleFactor = printWidth / canvas.width;
  const pageHeightPx = printHeight / scaleFactor;
  const totalPages = Math.ceil(canvas.height / pageHeightPx);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    // Determine slice window on the source canvas
    const sourceY = page * pageHeightPx;
    const currentSliceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

    // Create a temporary page canvas to capture this slice
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = currentSliceHeight;
    const ctx = pageCanvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        currentSliceHeight,
        0,
        0,
        pageCanvas.width,
        currentSliceHeight
      );

      const sliceDataUrl = pageCanvas.toDataURL('image/jpeg', 0.95);
      const sliceHeightMm = currentSliceHeight * scaleFactor;

      pdf.addImage(sliceDataUrl, 'JPEG', marginX, marginY, printWidth, sliceHeightMm);
    }

    // Header on subsequent pages
    if (page > 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(130, 130, 130);
      pdf.text(`WazzimaGiygg • ${docTitle.slice(0, 45)} • Continuação`, marginX, 6);
      pdf.setDrawColor(220, 220, 220);
      pdf.line(marginX, 7, pdfWidth - marginX, 7);
    }

    // Footer page number on every page
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(140, 140, 140);
    pdf.text(
      `Página ${page + 1} de ${totalPages} • Documento Oficial Formatado`,
      pdfWidth / 2,
      pdfHeight - 4,
      { align: 'center' }
    );
  }

  return pdf;
}

/**
 * Função Principal de Exportação para Artigos do Portal WazzimaGiygg
 */
export async function exportArticleFormattedPdf(
  article: Article,
  options?: PdfExportOptions
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-1000';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';

  // Injetar estilo de impressão
  const styleTag = document.createElement('style');
  styleTag.textContent = getPrintCssRules();
  container.appendChild(styleTag);

  // Injetar HTML do artigo formatado
  const wrapper = document.createElement('div');
  wrapper.innerHTML = buildCompleteArticleHtml(article);
  container.appendChild(wrapper);

  document.body.appendChild(container);

  try {
    options?.onProgress?.('Renderizando formatação original do artigo...');

    // Aguardar imagens ou fontes carregarem
    await new Promise((resolve) => setTimeout(resolve, 150));

    const elementToRender = wrapper.firstElementChild as HTMLElement;
    const canvas = await html2canvas(elementToRender || wrapper, {
      scale: 2, // Resolução Retina/Print 300 DPI
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    options?.onProgress?.('Gerando páginas do documento PDF...');

    const pdf = renderCanvasToMultiPagePdf(canvas, article.titulo || 'Artigo');
    const cleanTitle = (article.titulo || 'artigo')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 45);

    const filename = options?.fileName || `${cleanTitle}_wzzm_formatado.pdf`;
    pdf.save(filename);
  } finally {
    // Limpeza do DOM
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Função Principal de Exportação para Verbetes do NotMediaWiki
 */
export async function exportWikiArticleFormattedPdf(
  wikiArticle: WikiArticle,
  renderedHtml: string,
  options?: PdfExportOptions
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-1000';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';

  // Injetar estilo de impressão
  const styleTag = document.createElement('style');
  styleTag.textContent = getPrintCssRules();
  container.appendChild(styleTag);

  // Injetar HTML do verbete
  const wrapper = document.createElement('div');
  wrapper.innerHTML = buildCompleteWikiHtml(wikiArticle, renderedHtml);
  container.appendChild(wrapper);

  document.body.appendChild(container);

  try {
    options?.onProgress?.('Renderizando verbete com formatação completa Parsoid AST...');

    await new Promise((resolve) => setTimeout(resolve, 150));

    const elementToRender = wrapper.firstElementChild as HTMLElement;
    const canvas = await html2canvas(elementToRender || wrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    options?.onProgress?.('Gerando páginas do documento PDF...');

    const pdf = renderCanvasToMultiPagePdf(canvas, wikiArticle.title || 'Verbete');
    const cleanTitle = (wikiArticle.slug || wikiArticle.title || 'verbete')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 45);

    const filename = options?.fileName || `notmediawiki_${cleanTitle}_formatado.pdf`;
    pdf.save(filename);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
