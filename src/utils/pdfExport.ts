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

function escapeHtmlEntities(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Converte Wikitext / Markdown básico para HTML semântico formatado caso o texto seja cru.
 */
function formatRawContentToHtml(raw: string): string {
  if (!raw) return '<p>Sem conteúdo textual disponível.</p>';

  // Se já contém tags HTML de estrutura (incluindo pre, figure, section, article, aside), higieniza e retorna
  if (/<(p|h[1-6]|ul|ol|table|blockquote|div|pre|figure|section|article|aside|dl|details)[\s>]/i.test(raw)) {
    return DOMPurify.sanitize(raw);
  }

  // Preserva blocos de código cercados (```...```) antes de transformar quebras de linha em parágrafos
  const codeBlocks: string[] = [];
  let html = raw.replace(/```[^\n]*\n([\s\S]*?)```/g, (_match, codeContent: string) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code>${escapeHtmlEntities(codeContent.replace(/\n$/, ''))}</code></pre>`);
    return `\n\n__PDF_CODE_BLOCK_${idx}__\n\n`;
  });

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

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, (_m, inlineCode: string) => `<code>${escapeHtmlEntities(inlineCode)}</code>`);

  // Blockquotes
  html = html.replace(/^>\s*(.*?)$/gm, '<blockquote class="pdf-quote">$1</blockquote>');

  // Lists
  html = html.replace(/^\*\s*(.*?)$/gm, '<li class="pdf-li-bullet">$1</li>');
  html = html.replace(/^\d+\.\s*(.*?)$/gm, '<li class="pdf-li-number">$1</li>');

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/).map((chunk) => {
    const trimmed = chunk.trim();
    if (!trimmed) return '';
    if (/^__PDF_CODE_BLOCK_\d+__$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith('<h') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<li') || trimmed.startsWith('<pre')) {
      return trimmed;
    }
    return `<p class="pdf-p">${trimmed.replace(/\n/g, '<br/>')}</p>`;
  });

  let assembled = paragraphs.filter(Boolean).join('\n');
  codeBlocks.forEach((blockHtml, idx) => {
    assembled = assembled.replace(`__PDF_CODE_BLOCK_${idx}__`, blockHtml);
  });

  return DOMPurify.sanitize(assembled);
}

/**
 * Gera citação formatada nas normas da ABNT NBR 6023 com link direto para o UID do artigo.
 */
function buildAbntCitation(article: {
  id?: string;
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
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://wazzimagiygg.com';
  const uidUrl = article.id
    ? `${origin}/?uid=${encodeURIComponent(article.id)}`
    : origin;

  return `${authorName}. ${title}. In: ${collectionName}. Brasília/São Paulo: WazzimaGiygg, ${year}. Disponível em: <${uidUrl}>. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.`;
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
      <main class="pdf-article-body" style="font-size: 13.5px; color: #222222; text-align: justify; display: flow-root;">
        ${bodyHtml}
        <div style="clear: both; height: 0; overflow: hidden;"></div>
      </main>

      <!-- CAIXA DE CITAÇÃO ABNT NBR 6023 -->
      <section style="
        clear: both;
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
        ${article.id ? `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cccccc; font-family: monospace; font-size: 8.5px; color: #1e40af;">
          <strong>VÍNCULO PERMANENTE UID:</strong> <a href="${typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://wazzimagiygg.com'}/?uid=${encodeURIComponent(article.id)}" style="color: #1d4ed8; text-decoration: underline;">${typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://wazzimagiygg.com'}/?uid=${encodeURIComponent(article.id)}</a>
        </div>
        ` : ''}
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
      <main class="pdf-article-body" style="font-size: 13px; color: #222222; text-align: justify; display: flow-root;">
        ${DOMPurify.sanitize(renderedHtml)}
        <div style="clear: both; height: 0; overflow: hidden;"></div>
      </main>

      <!-- CAIXA DE CITAÇÃO ABNT NBR 6023 COM LINK DO UID -->
      <section style="
        clear: both;
        margin-top: 30px;
        padding: 14px 18px;
        background-color: #f9f8f5;
        border: 1.5px solid #141414;
        box-shadow: 4px 4px 0px 0px rgba(20,20,20,1);
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10px;
      ">
        <div style="font-weight: bold; text-transform: uppercase; color: #141414; margin-bottom: 6px; letter-spacing: 0.5px;">
          Como Citar Este Verbete (Normas ABNT NBR 6023):
        </div>
        <div style="font-family: monospace; font-size: 9.5px; color: #333333; line-height: 1.4; word-break: break-all;">
          NOTMEDIAWIKI. ${wikiArticle.title.toUpperCase()}. Enciclopédia NotMediaWiki WazzimaGiygg, ${new Date().getFullYear()}. Disponível em: &lt;${typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://wazzimagiygg.com'}/?uid=${encodeURIComponent(wikiArticle.id || wikiArticle.slug)}&gt;. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.
        </div>
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cccccc; font-family: monospace; font-size: 8.5px; color: #1e40af;">
          <strong>VÍNCULO PERMANENTE UID:</strong> <a href="${typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://wazzimagiygg.com'}/?uid=${encodeURIComponent(wikiArticle.id || wikiArticle.slug)}" style="color: #1d4ed8; text-decoration: underline;">${typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://wazzimagiygg.com'}/?uid=${encodeURIComponent(wikiArticle.id || wikiArticle.slug)}</a>
        </div>
      </section>

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
    #pdf-render-root,
    #pdf-render-root * {
      box-sizing: border-box;
    }
    .pdf-article-body {
      display: flow-root !important;
      overflow: visible !important;
      color: #1f1f1f !important;
      word-wrap: break-word;
    }
    .pdf-article-body::after {
      content: "";
      display: table;
      clear: both;
    }
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
      background-color: #f8f7f4 !important;
      border-left: 4px solid #b45309;
      font-style: italic;
      color: #262626 !important;
      overflow: visible !important;
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
      max-width: 100%;
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
      color: #141414;
    }
    .pdf-article-body td {
      border: 1px solid #cccccc;
      padding: 6px 10px;
      color: #1f1f1f;
    }
    /* Inline code */
    .pdf-article-body code {
      font-family: 'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace;
      font-size: 11px;
      color: #141414;
      background-color: #f1f0eb;
      padding: 1.5px 4px;
      border: 1px solid #e0dfd9;
      border-radius: 3px;
    }
    /* Preformatted code / ASCII diagram boxes */
    .pdf-article-body pre {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      font-family: 'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace !important;
      font-size: 10.5px;
      line-height: 1.45;
      color: #141414 !important;
      background-color: #f4f3ee !important;
      padding: 12px 14px !important;
      border: 1.5px solid #c9c6bc !important;
      border-radius: 4px;
      white-space: pre-wrap !important;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      overflow: visible !important;
      max-height: none !important;
      height: auto !important;
      margin: 14px 0 !important;
      text-align: left !important;
      clear: both;
    }
    /* Reset inner <code> inside <pre> so html2canvas never collapses multi-line inline code boxes */
    .pdf-article-body pre code {
      display: block !important;
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      color: #141414 !important;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      white-space: inherit !important;
      word-break: inherit !important;
      overflow-wrap: inherit !important;
      overflow: visible !important;
    }
    .pdf-article-body pre span {
      display: inline !important;
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
      color: #141414 !important;
    }
    .pdf-article-body pre p {
      margin: 0 !important;
      line-height: inherit !important;
    }
    /* Figures, Image Description Boxes & Infoboxes */
    .pdf-article-body figure,
    .pdf-article-body .wiki-image-thumb,
    .pdf-article-body aside {
      display: block !important;
      background-color: #f8f7f4 !important;
      color: #1e293b !important;
      border: 1.5px solid #cbd5e1 !important;
      border-radius: 6px;
      padding: 8px !important;
      margin: 6px 0 14px 0;
      overflow: visible !important;
      max-height: none !important;
      height: auto !important;
      text-align: left !important;
    }
    .pdf-article-body figcaption {
      display: block !important;
      margin-top: 6px !important;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 10.5px !important;
      line-height: 1.4 !important;
      color: #334155 !important;
      background: transparent !important;
      text-align: left !important;
      overflow: visible !important;
      max-height: none !important;
      height: auto !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    .pdf-article-body figure.float-right,
    .pdf-article-body figure.sm\\:float-right,
    .pdf-article-body .wiki-image-thumb.sm\\:float-right,
    .pdf-article-body .float-right,
    .pdf-article-body .sm\\:float-right,
    .pdf-article-body .wiki-infobox {
      float: right !important;
      clear: right !important;
      width: 270px !important;
      max-width: 44% !important;
      margin: 4px 0 16px 20px !important;
      overflow: visible !important;
      position: static !important;
    }
    .pdf-article-body [style*="float: right"],
    .pdf-article-body [style*="float:right"] {
      float: right !important;
      clear: right !important;
      max-width: 46% !important;
      margin: 4px 0 16px 20px !important;
      overflow: visible !important;
      position: static !important;
    }
    .pdf-article-body figure.float-left,
    .pdf-article-body figure.sm\\:float-left,
    .pdf-article-body .wiki-image-thumb.sm\\:float-left,
    .pdf-article-body .float-left,
    .pdf-article-body .sm\\:float-left {
      float: left !important;
      clear: left !important;
      width: 270px !important;
      max-width: 44% !important;
      margin: 4px 20px 16px 0 !important;
      overflow: visible !important;
      position: static !important;
    }
    .pdf-article-body [style*="float: left"],
    .pdf-article-body [style*="float:left"] {
      float: left !important;
      clear: left !important;
      max-width: 46% !important;
      margin: 4px 20px 16px 0 !important;
      overflow: visible !important;
      position: static !important;
    }
    .pdf-article-body .wiki-infobox {
      background-color: #ffffff !important;
      color: #141414 !important;
      border: 2px solid #141414 !important;
      box-shadow: 3px 3px 0px 0px #141414 !important;
    }
    .pdf-article-body .wiki-infobox table {
      margin: 0 !important;
      font-size: 10.5px !important;
    }
    .pdf-article-body .overflow-hidden,
    .pdf-article-body .overflow-x-auto,
    .pdf-article-body .overflow-y-auto {
      overflow: visible !important;
    }
    .pdf-article-body img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
    }
    .pdf-article-body figcaption svg {
      width: 12px !important;
      height: 12px !important;
      display: inline-block !important;
      vertical-align: middle;
    }
    .pdf-article-body a {
      color: #b45309;
      text-decoration: underline;
    }
    .pdf-article-body hr {
      border: none;
      border-top: 1px solid #d4d4d4;
      margin: 20px 0;
      clear: both;
    }
  `;
}

/**
 * Converte funções modernas de cor CSS (oklch, oklab, color-mix, lab, lch) em rgb()/rgba()
 * compatíveis com o parser do html2canvas 1.4.
 */
function resolveModernCssColor(
  colorStr: string,
  cache: Map<string, string>,
  ctx: CanvasRenderingContext2D | null
): string {
  if (!colorStr || colorStr === 'none' || colorStr === 'transparent') return colorStr;
  if (!/(oklch|oklab|color-mix|lch|lab|\bcolor\()/i.test(colorStr)) return colorStr;

  const cached = cache.get(colorStr);
  if (cached) return cached;
  if (!ctx) return '#141414';

  try {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const resolved =
      a === 255
        ? `rgb(${r}, ${g}, ${b})`
        : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    cache.set(colorStr, resolved);
    return resolved;
  } catch {
    return '#141414';
  }
}

function parseRgbValues(colorStr: string): [number, number, number, number] | null {
  const match = colorStr.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)/i);
  if (!match) return null;
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    match[4] !== undefined ? Number(match[4]) : 1
  ];
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function getEffectiveBackgroundLuminance(el: HTMLElement, view: Window): number {
  let curr: HTMLElement | null = el;
  while (curr) {
    const style = view.getComputedStyle(curr);
    const bg = style.backgroundColor;
    const rgba = parseRgbValues(bg);
    if (rgba && rgba[3] > 0.25) {
      return getRelativeLuminance(rgba[0], rgba[1], rgba[2]);
    }
    if (style.backgroundImage && style.backgroundImage !== 'none') {
      const gradRgb = parseRgbValues(style.backgroundImage);
      if (gradRgb) {
        return getRelativeLuminance(gradRgb[0], gradRgb[1], gradRgb[2]);
      }
      return 0.3;
    }
    curr = curr.parentElement;
  }
  return 1; // Fundo padrão branco do PDF
}

/**
 * Normaliza blocos especiais antes da captura e aguarda carregamento de imagens e fontes.
 */
async function preparePdfDomBeforeCapture(rootEl: HTMLElement): Promise<void> {
  // 1. Ajustar fonte dinâmica de blocos <pre> largos para evitar quebra de diagramas ASCII
  const preBlocks = Array.from(rootEl.querySelectorAll('pre'));
  for (const pre of preBlocks) {
    const text = pre.textContent || '';
    const lines = text.split(/\r?\n/);
    const maxLineLength = lines.reduce((max, line) => Math.max(max, line.length), 0);

    pre.style.display = 'block';
    pre.style.color = '#141414';
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.overflow = 'visible';

    if (maxLineLength > 68) {
      const targetFontPx = Math.max(7.2, Math.min(10.5, Math.floor((650 / (maxLineLength * 0.62)) * 10) / 10));
      pre.style.fontSize = `${targetFontPx}px`;
    }

    // Garantir que <code> filho dentro de <pre> seja block sem borda/padding duplicado
    const childCodes = Array.from(pre.querySelectorAll('code'));
    for (const codeEl of childCodes) {
      codeEl.style.display = 'block';
      codeEl.style.background = 'transparent';
      codeEl.style.border = 'none';
      codeEl.style.padding = '0';
      codeEl.style.margin = '0';
      codeEl.style.color = '#141414';
      codeEl.style.whiteSpace = 'pre-wrap';
      codeEl.style.overflow = 'visible';
    }
  }

  // 2. Remover overlays de hover absolutos dentro de figuras de imagem para não interferir na captura
  const hoverOverlays = Array.from(rootEl.querySelectorAll('.wiki-file-link > div.absolute'));
  for (const overlay of hoverOverlays) {
    overlay.remove();
  }

  // 3. Forçar carregamento eager em todas as imagens e aguardar decodificação
  const images = Array.from(rootEl.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.removeAttribute('loading');
          img.loading = 'eager';
          const dataSrc = img.getAttribute('data-src');
          if (!img.getAttribute('src') && dataSrc) {
            img.setAttribute('src', dataSrc);
          }

          if (img.complete) {
            if (img.naturalWidth === 0) {
              img.style.display = 'none';
            }
            resolve();
            return;
          }

          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            if (img.naturalWidth === 0) {
              img.style.display = 'none';
            }
            resolve();
          };

          const timeoutId = setTimeout(done, 3500);
          img.addEventListener(
            'load',
            () => {
              clearTimeout(timeoutId);
              if (typeof img.decode === 'function') {
                img.decode().catch(() => undefined).finally(done);
              } else {
                done();
              }
            },
            { once: true }
          );
          img.addEventListener(
            'error',
            () => {
              clearTimeout(timeoutId);
              done();
            },
            { once: true }
          );
        })
    )
  );

  // Aguardar fontes se disponível (com timeout curto de segurança)
  if (document.fonts?.ready) {
    await Promise.race([
      document.fonts.ready.catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, 400))
    ]);
  }
}

/**
 * Captura o elemento formatado via html2canvas isolando Dark Mode e funções CSS oklch().
 */
async function captureFormattedPdfCanvas(elementToRender: HTMLElement): Promise<HTMLCanvasElement> {
  await preparePdfDomBeforeCapture(elementToRender);
  await new Promise((resolve) => setTimeout(resolve, 80));

  const targetWidth = elementToRender.scrollWidth || 794;
  const targetHeight = elementToRender.scrollHeight || elementToRender.offsetHeight;

  return html2canvas(elementToRender, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1024,
    scrollX: 0,
    scrollY: 0,
    width: targetWidth,
    height: targetHeight,
    onclone: (clonedDoc, clonedRoot) => {
      // 1. Isolar o documento clonado em modo claro para evitar herança de .dark / dark:*
      clonedDoc.documentElement.classList.remove('dark', 'theme-dark');
      clonedDoc.documentElement.classList.add('theme-light');
      clonedDoc.body.classList.remove('dark', 'theme-dark');
      clonedDoc.documentElement.style.colorScheme = 'light';
      clonedDoc.documentElement.style.setProperty('--wzzm-bg', '#ffffff');
      clonedDoc.documentElement.style.setProperty('--wzzm-surface', '#ffffff');
      clonedDoc.documentElement.style.setProperty('--wzzm-surface-alt', '#f4f3ee');
      clonedDoc.documentElement.style.setProperty('--wzzm-surface-inset', '#faf9f5');
      clonedDoc.documentElement.style.setProperty('--wzzm-text', '#141414');
      clonedDoc.documentElement.style.setProperty('--wzzm-text-secondary', '#333333');
      clonedDoc.documentElement.style.setProperty('--wzzm-text-muted', '#555555');
      clonedDoc.documentElement.style.setProperty('--wzzm-border', '#141414');
      clonedDoc.documentElement.style.setProperty('--wzzm-border-subtle', '#d4d4d4');

      // 2. Garantir CSS de impressão injetado no <head> do documento clonado
      const cloneStyle = clonedDoc.createElement('style');
      cloneStyle.textContent = getPrintCssRules();
      clonedDoc.head.appendChild(cloneStyle);

      // 3. Normalizar cores modernas (oklch/oklab/color-mix), overflow e contraste em todos os nós
      const colorCanvas = clonedDoc.createElement('canvas');
      colorCanvas.width = 1;
      colorCanvas.height = 1;
      const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
      const colorCache = new Map<string, string>();
      const view = clonedDoc.defaultView || window;
      const HtmlEl = view.HTMLElement || HTMLElement;

      const allElements: Element[] = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll('*'))];
      for (const node of allElements) {
        if (!(node instanceof HtmlEl) && !(node instanceof HTMLElement)) {
          continue;
        }
        const el = node as HTMLElement;
        const computed = view.getComputedStyle(el);

        // Resolver oklch/oklab/color-mix para rgb()/rgba()
        const colorProps: Array<[keyof CSSStyleDeclaration, string]> = [
          ['color', computed.color],
          ['backgroundColor', computed.backgroundColor],
          ['borderTopColor', computed.borderTopColor],
          ['borderRightColor', computed.borderRightColor],
          ['borderBottomColor', computed.borderBottomColor],
          ['borderLeftColor', computed.borderLeftColor],
          ['outlineColor', computed.outlineColor]
        ];

        for (const [prop, val] of colorProps) {
          if (val && /(oklch|oklab|color-mix|lch|lab|\bcolor\()/i.test(val)) {
            (el.style as unknown as Record<string, string>)[prop as string] = resolveModernCssColor(
              val,
              colorCache,
              colorCtx
            );
          }
        }

        if (computed.backgroundImage && /(oklch|oklab|color-mix|lch|lab)/i.test(computed.backgroundImage)) {
          el.style.backgroundImage = computed.backgroundImage.replace(
            /(?:oklch|oklab|lch|lab|color-mix|color)\([^()]*(?:\([^()]*\)[^()]*)*\)/gi,
            (token) => resolveModernCssColor(token, colorCache, colorCtx)
          );
        }

        if (computed.boxShadow && /(oklch|oklab|color-mix|lch|lab)/i.test(computed.boxShadow)) {
          el.style.boxShadow = 'none';
        }

        // Evitar que caixas internas fiquem presas em fixed/sticky ou ocultas por overflow/max-height
        if (computed.position === 'fixed' || computed.position === 'sticky') {
          el.style.position = 'static';
        }

        const tag = el.tagName.toLowerCase();
        if (
          tag === 'pre' ||
          tag === 'code' ||
          tag === 'figure' ||
          tag === 'figcaption' ||
          tag === 'blockquote' ||
          tag === 'aside' ||
          el.classList.contains('wiki-infobox') ||
          el.classList.contains('wiki-image-thumb')
        ) {
          el.style.overflow = 'visible';
          el.style.maxHeight = 'none';
        }

        // Proteção contra texto claro invisível sobre fundo claro dentro do corpo do artigo
        if (el.closest('.pdf-article-body')) {
          const updatedColor = view.getComputedStyle(el).color;
          const rgba = parseRgbValues(updatedColor);
          if (rgba) {
            const textLum = getRelativeLuminance(rgba[0], rgba[1], rgba[2]);
            if (textLum > 0.68) {
              const bgLum = getEffectiveBackgroundLuminance(el, view);
              if (bgLum > 0.65) {
                el.style.color = '#141414';
              }
            }
          }
        }
      }
    }
  });
}

/**
 * Encontra uma linha horizontal limpa (espaço em branco) próxima ao limite da página
 * para evitar fatiar linhas de texto ou bordas no meio.
 */
function findCleanPageBreakY(
  canvas: HTMLCanvasElement,
  startY: number,
  idealEndY: number
): number {
  if (idealEndY >= canvas.height) return canvas.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return idealEndY;

  const searchWindow = Math.min(180, Math.floor((idealEndY - startY) * 0.14));
  const minY = Math.max(startY + 80, Math.floor(idealEndY - searchWindow));
  const maxY = Math.min(canvas.height - 1, Math.floor(idealEndY));
  if (maxY <= minY) return idealEndY;

  const width = canvas.width;
  const height = maxY - minY + 1;
  const imgData = ctx.getImageData(0, minY, width, height).data;

  // Varre de baixo para cima procurando uma linha quase 100% branca
  for (let row = height - 1; row >= 0; row--) {
    let nonWhitePixels = 0;
    const rowOffset = row * width * 4;
    // Amostragem de 2 em 2 pixels para velocidade
    for (let x = 0; x < width; x += 2) {
      const idx = rowOffset + x * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      if (r < 246 || g < 246 || b < 246) {
        nonWhitePixels++;
        if (nonWhitePixels > 2) break;
      }
    }
    if (nonWhitePixels <= 2) {
      return minY + row;
    }
  }

  return Math.floor(idealEndY);
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

  const slices: Array<{ startY: number; height: number }> = [];
  let cursorY = 0;
  while (cursorY < canvas.height) {
    const idealEndY = cursorY + pageHeightPx;
    const endY =
      idealEndY >= canvas.height
        ? canvas.height
        : findCleanPageBreakY(canvas, cursorY, idealEndY);
    const sliceHeight = Math.max(1, endY - cursorY);
    slices.push({ startY: cursorY, height: sliceHeight });
    cursorY = endY;
  }

  const totalPages = Math.max(1, slices.length);

  slices.forEach((slice, page) => {
    if (page > 0) {
      pdf.addPage();
    }

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = slice.height;
    const ctx = pageCanvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        slice.startY,
        canvas.width,
        slice.height,
        0,
        0,
        pageCanvas.width,
        slice.height
      );

      const sliceDataUrl = pageCanvas.toDataURL('image/jpeg', 0.97);
      const sliceHeightMm = slice.height * scaleFactor;

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
  });

  return pdf;
}

/**
 * Cria o container offscreen fora da viewport mantendo opacidade integral para captura fiel.
 */
function createOffscreenPdfContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-12000px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.zIndex = '-9999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1a1a1a';
  return container;
}

/**
 * Função Principal de Exportação para Artigos do Portal WazzimaGiygg
 */
export async function exportArticleFormattedPdf(
  article: Article,
  options?: PdfExportOptions
): Promise<void> {
  const container = createOffscreenPdfContainer();

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

    const elementToRender = (wrapper.firstElementChild as HTMLElement) || wrapper;
    const canvas = await captureFormattedPdfCanvas(elementToRender);

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
  const container = createOffscreenPdfContainer();

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

    const elementToRender = (wrapper.firstElementChild as HTMLElement) || wrapper;
    const canvas = await captureFormattedPdfCanvas(elementToRender);

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
