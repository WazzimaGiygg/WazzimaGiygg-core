import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { WikiArticle } from '../types';
import { parseWikitext } from './wikitextParser';
import { buildUidPermalink } from './urlRouter';

export interface PdfExportOptions {
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeMetadata?: boolean;
  includeToc?: boolean;
  includeReferences?: boolean;
  includeFooter?: boolean;
  includeLicense?: boolean;
  exportMode?: 'structured' | 'snapshot'; // structured text or pixel-perfect html capture
  fontSize?: 'compact' | 'normal' | 'large';
  customWatermark?: string;
}

/**
 * Strips wikitext syntax to produce clean text for PDF printing
 */
function cleanWikitextForPdf(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\[\[(?:Categoria|Category):.*?\]\]/gi, '')
    .replace(/\[\[(?:Arquivo|File|Imagem|Image):.*?\]\]/gi, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1') // [[target|text]] -> text
    .replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2 ($1)') // [url text] -> text (url)
    .replace(/\[(https?:\/\/[^\s\]]+)\]/g, '$1')
    .replace(/'''([^']+)'''/g, '$1') // Bold
    .replace(/''([^']+)''/g, '$1') // Italic
    .replace(/<ref[^>]*>([\s\S]*?)<\/ref>/gi, '') // Remove refs in main text body
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
    .replace(/\{\|[\s\S]*?\|\}/g, '') // Strip mediawiki tables for raw text flow
    .replace(/\{\{[^}]+\}\}/g, ''); // Strip template tags
}

/**
 * Generates a clean, structured vector-based PDF for an article using jsPDF
 */
export async function exportArticleToStructuredPdf(
  article: WikiArticle,
  pageName: string = 'WikiZero Enciclopédia',
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    pageSize = 'a4',
    orientation = 'portrait',
    includeHeader = true,
    includeMetadata = true,
    includeToc = true,
    includeReferences = true,
    includeFooter = true,
    includeLicense = true,
    fontSize = 'normal',
    customWatermark = '',
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  const scaleFont = (size: number) => {
    if (fontSize === 'compact') return size * 0.9;
    if (fontSize === 'large') return size * 1.15;
    return size;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      currentY = margin;
      drawHeader();
    }
  };

  const drawHeader = () => {
    if (!includeHeader) return;
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(scaleFont(8.5));
    doc.setTextColor(30, 64, 175); // Royal Blue
    doc.text('WIKIZERO', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(scaleFont(7.5));
    doc.setTextColor(100, 116, 139);
    doc.text('A Enciclopédia Livre e Aberta', margin + 22, 12);

    // Right-aligned permalink/UID
    const uidText = `?uid=${article.id}`;
    doc.setFont('courier', 'bold');
    doc.setFontSize(scaleFont(7.5));
    doc.setTextColor(71, 85, 105);
    doc.text(uidText, pageWidth - margin, 12, { align: 'right' });

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
    doc.restoreGraphicsState();
  };

  // 1. First Page Header
  if (includeHeader) {
    drawHeader();
    currentY = 22;
  } else {
    currentY = margin;
  }

  // 2. Article Title (Heading 1)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(scaleFont(22));
  doc.setTextColor(15, 23, 42); // slate-900

  const titleLines = doc.splitTextToSize(article.titulo, contentWidth);
  doc.text(titleLines, margin, currentY);
  currentY += titleLines.length * scaleFont(8.5) + 2;

  // Title underline divider
  doc.setDrawColor(37, 99, 235); // Blue-600
  doc.setLineWidth(0.8);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  currentY += 5;

  // 3. Metadata Infobox / Bar
  if (includeMetadata) {
    checkPageBreak(25);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, currentY, contentWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(scaleFont(8));
    doc.setTextColor(51, 65, 85);

    // Row 1
    doc.text(`Categoria:`, margin + 3, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${article.categoria || 'Geral'}`, margin + 20, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(`Idioma:`, margin + 70, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${article.idioma || 'Português'}`, margin + 83, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(`Coleção:`, margin + 120, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${pageName}`, margin + 135, currentY + 5);

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.text(`UID:`, margin + 3, currentY + 11);
    doc.setFont('courier', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(`?uid=${article.id}`, margin + 12, currentY + 11);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`Atualizado em:`, margin + 70, currentY + 11);
    doc.setFont('helvetica', 'normal');
    const modDate = article.dataEdicao || article.dataCriacao;
    const formattedDate = modDate ? new Date(modDate).toLocaleDateString('pt-BR') : 'Recente';
    doc.text(formattedDate, margin + 92, currentY + 11);

    currentY += 22;
  }

  // Parse Wikitext to extract TOC, references, etc.
  const parseResult = parseWikitext(article.descricao, undefined, article.titulo);

  // 4. Table of Contents
  if (includeToc && parseResult.toc && parseResult.toc.length > 0) {
    checkPageBreak(15 + parseResult.toc.length * 5);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(226, 232, 240);
    const tocBoxHeight = 10 + parseResult.toc.length * 4.8;
    doc.roundedRect(margin, currentY, contentWidth * 0.75, tocBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(scaleFont(9));
    doc.setTextColor(30, 41, 59);
    doc.text('Sumário (Índice de Conteúdo)', margin + 4, currentY + 6);

    let tocY = currentY + 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(scaleFont(8));
    doc.setTextColor(71, 85, 105);

    parseResult.toc.forEach((item) => {
      const indent = (item.level - 1) * 4;
      const numLabel = item.number ? `${item.number} ` : '';
      const text = `${numLabel}${item.text}`;
      doc.text(text, margin + 4 + indent, tocY);
      tocY += 4.5;
    });

    currentY += tocBoxHeight + 6;
  }

  // 5. Article Body Text Processing
  const rawLines = article.descricao.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const line = rawLine.trim();

    // Code block check
    if (line.startsWith('```') || line.startsWith('<pre')) {
      if (inCodeBlock) {
        // flush code block
        inCodeBlock = false;
        const codeText = codeBuffer.join('\n');
        doc.setFont('courier', 'normal');
        doc.setFontSize(scaleFont(7.5));
        doc.setFillColor(241, 245, 249);
        const splitCode = doc.splitTextToSize(codeText, contentWidth - 8);
        const boxH = splitCode.length * scaleFont(3.8) + 6;
        checkPageBreak(boxH);
        doc.roundedRect(margin, currentY, contentWidth, boxH, 1, 1, 'FD');
        doc.setTextColor(15, 23, 42);
        doc.text(splitCode, margin + 4, currentY + 4);
        currentY += boxH + 4;
        codeBuffer = [];
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!line) {
      currentY += scaleFont(2.5);
      continue;
    }

    // Heading 1 (== Title == or = Title =)
    if (/^={1,2}[^=]+={1,2}$/.test(line)) {
      const hTitle = line.replace(/=/g, '').trim();
      checkPageBreak(18);
      currentY += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(scaleFont(14));
      doc.setTextColor(30, 58, 138); // Blue-900
      doc.text(hTitle, margin, currentY);
      currentY += scaleFont(5);
      doc.setDrawColor(191, 219, 254);
      doc.setLineWidth(0.4);
      doc.line(margin, currentY, margin + contentWidth, currentY);
      currentY += 4;
      continue;
    }

    // Heading 2 (=== Subtitle ===)
    if (/^={3}[^=]+={3}$/.test(line)) {
      const hTitle = line.replace(/=/g, '').trim();
      checkPageBreak(14);
      currentY += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(scaleFont(11.5));
      doc.setTextColor(51, 65, 85);
      doc.text(hTitle, margin, currentY);
      currentY += scaleFont(4.5);
      continue;
    }

    // Heading 3 (==== Subsubtitle ====)
    if (/^={4,6}[^=]+={4,6}$/.test(line)) {
      const hTitle = line.replace(/=/g, '').trim();
      checkPageBreak(12);
      currentY += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(scaleFont(10));
      doc.setTextColor(71, 85, 105);
      doc.text(hTitle, margin, currentY);
      currentY += scaleFont(4);
      continue;
    }

    // Bullet list (* item or # item)
    if (line.startsWith('*') || line.startsWith('#')) {
      const isOrdered = line.startsWith('#');
      const itemText = cleanWikitextForPdf(line.replace(/^[*#]+\s*/, ''));
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(9.5));
      doc.setTextColor(30, 41, 59);

      const bulletSymbol = isOrdered ? '•' : '▪';
      const splitItem = doc.splitTextToSize(itemText, contentWidth - 8);
      checkPageBreak(splitItem.length * scaleFont(4.2) + 2);

      doc.setTextColor(37, 99, 235);
      doc.text(bulletSymbol, margin + 2, currentY);
      doc.setTextColor(30, 41, 59);
      doc.text(splitItem, margin + 7, currentY);
      currentY += splitItem.length * scaleFont(4.2) + 2;
      continue;
    }

    // Blockquote (: text or <blockquote>)
    if (line.startsWith(':') || line.startsWith('>')) {
      const quoteText = cleanWikitextForPdf(line.replace(/^[:>]\s*/, ''));
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(scaleFont(9));
      doc.setTextColor(71, 85, 105);
      const splitQuote = doc.splitTextToSize(quoteText, contentWidth - 12);
      const quoteH = splitQuote.length * scaleFont(4) + 4;
      checkPageBreak(quoteH);

      doc.setFillColor(248, 250, 252);
      doc.rect(margin + 4, currentY - 3, contentWidth - 8, quoteH, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.line(margin + 4, currentY - 3, margin + 4, currentY - 3 + quoteH);

      doc.text(splitQuote, margin + 8, currentY);
      currentY += quoteH + 2;
      continue;
    }

    // Standard Paragraph
    const cleanParagraph = cleanWikitextForPdf(line);
    if (cleanParagraph) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(9.5));
      doc.setTextColor(30, 41, 59);
      const splitText = doc.splitTextToSize(cleanParagraph, contentWidth);
      checkPageBreak(splitText.length * scaleFont(4.3) + 3);
      doc.text(splitText, margin, currentY);
      currentY += splitText.length * scaleFont(4.3) + 3;
    }
  }

  // 6. References & Footnotes
  if (includeReferences && parseResult.references && parseResult.references.length > 0) {
    checkPageBreak(25);
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(scaleFont(12));
    doc.setTextColor(30, 58, 138);
    doc.text('Referências e Notas de Rodapé', margin, currentY);
    currentY += scaleFont(4);
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, margin + contentWidth, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(scaleFont(8));
    doc.setTextColor(71, 85, 105);

    parseResult.references.forEach((ref, idx) => {
      const cleanRef = cleanWikitextForPdf(ref);
      const refText = `[${idx + 1}] ${cleanRef}`;
      const splitRef = doc.splitTextToSize(refText, contentWidth - 4);
      checkPageBreak(splitRef.length * scaleFont(3.8) + 2);
      doc.text(splitRef, margin, currentY);
      currentY += splitRef.length * scaleFont(3.8) + 2;
    });
  }

  // 7. License and Copyright Note
  if (includeLicense) {
    checkPageBreak(18);
    currentY += 6;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(scaleFont(7.5));
    doc.setTextColor(71, 85, 105);
    doc.text('Licença Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0)', margin + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(scaleFont(7));
    doc.setTextColor(100, 116, 139);
    doc.text(
      `O texto está disponível sob a licença CC BY-SA 4.0; termos adicionais podem ser aplicados. Consulte os Termos de Uso da WikiZero.`,
      margin + 3,
      currentY + 8.5
    );
    currentY += 16;
  }

  // 8. Add Footers and Page Numbers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    if (customWatermark) {
      doc.saveGraphicsState();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(55);
      doc.setTextColor(241, 245, 249);
      doc.text(customWatermark, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
      doc.restoreGraphicsState();
    }

    if (includeFooter) {
      doc.saveGraphicsState();
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(7));
      doc.setTextColor(148, 163, 184);

      // Left: URL / Permalink
      const permalink = buildUidPermalink(article.id);
      doc.text(`Link permanente: ${permalink}`, margin, pageHeight - 7);

      // Center: Export Timestamp
      const nowStr = new Date().toLocaleString('pt-BR');
      doc.text(`Exportado da WikiZero em ${nowStr}`, pageWidth / 2, pageHeight - 7, { align: 'center' });

      // Right: Page numbers
      doc.setFont('helvetica', 'bold');
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      doc.restoreGraphicsState();
    }
  }

  // Download PDF
  const filename = `${article.titulo.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_')}_WikiZero.pdf`;
  doc.save(filename);
}

/**
 * Generates a pixel-perfect rendered visual PDF using html2canvas + jsPDF
 */
export async function exportArticleSnapshotToPdf(
  element: HTMLElement,
  article: WikiArticle,
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    pageSize = 'a4',
    orientation = 'portrait',
    includeFooter = true,
  } = options;

  // Capture element using html2canvas with high scale for crisp print quality
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const printableWidth = pdfWidth - margin * 2;
  const printableHeight = pdfHeight - margin * 2 - (includeFooter ? 10 : 0);

  const imgWidth = printableWidth;
  const imgHeight = (canvas.height * printableWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;
  let page = 1;

  pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
  heightLeft -= printableHeight;

  while (heightLeft > 0) {
    position = margin - printableHeight * page;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= printableHeight;
    page++;
  }

  // Add footer to all pages if requested
  if (includeFooter) {
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, pdfHeight - 8, pdfWidth - margin, pdfHeight - 8);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`WikiZero Enciclopédia — ${article.titulo} (?uid=${article.id})`, margin, pdfHeight - 5);
      pdf.text(`Página ${p} de ${totalPages}`, pdfWidth - margin, pdfHeight - 5, { align: 'right' });
    }
  }

  const filename = `${article.titulo.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_')}_Visual_WikiZero.pdf`;
  pdf.save(filename);
}
