/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gerador e formatador acadêmico ABNT (NBR 10520:2023 & NBR 6023:2018).
 */

export type AbntCitationStyle = 'direta_curta' | 'direta_longa' | 'indireta' | 'apud';
export type AbntCallPosition = 'fim' | 'texto';
export type AbntParenthesisCase = 'uppercase' | 'titlecase';

export interface AbntCitationConfig {
  style: AbntCitationStyle;
  callPosition: AbntCallPosition;
  parenthesisCase: AbntParenthesisCase;
  authorRaw: string;
  isCorporateAuthor: boolean;
  title: string;
  subtitle?: string;
  portalName: string;
  location?: string;
  year: string;
  pageOrSection?: string;
  accessDate: string;
  url: string;
  excerptText: string;
  apudOriginalAuthor?: string;
  apudOriginalYear?: string;
  includeReferenceInExport: boolean;
}

const ABNT_MONTHS = [
  'jan.',
  'fev.',
  'mar.',
  'abr.',
  'maio',
  'jun.',
  'jul.',
  'ago.',
  'set.',
  'out.',
  'nov.',
  'dez.',
];

/**
 * Formata uma data no padrão ABNT NBR 6023 (ex: "16 nov. 2026").
 */
export function formatAbntDate(date: Date = new Date()): string {
  const day = date.getDate();
  const month = ABNT_MONTHS[date.getMonth()] || 'jan.';
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Normaliza nome de autor para entrada bibliográfica NBR 6023
 * e chamada no texto NBR 10520.
 */
export function parseAbntAuthor(
  rawName: string,
  isCorporate: boolean
): {
  referenceEntry: string;
  surnameUpper: string;
  surnameTitle: string;
} {
  const cleaned = (rawName || 'WAZZIMAGIYGG').trim();
  if (!cleaned) {
    return {
      referenceEntry: 'WAZZIMAGIYGG',
      surnameUpper: 'WAZZIMAGIYGG',
      surnameTitle: 'WazzimaGiygg',
    };
  }

  // Caso seja entidade coletiva / institucional ou já contenha vírgula "SOBRENOME, Nome"
  if (isCorporate) {
    return {
      referenceEntry: cleaned.toUpperCase(),
      surnameUpper: cleaned.toUpperCase(),
      surnameTitle: cleaned,
    };
  }

  if (cleaned.includes(',')) {
    const [lastPart, ...rest] = cleaned.split(',');
    const lastClean = lastPart.trim();
    const restClean = rest.join(',').trim();
    return {
      referenceEntry: restClean ? `${lastClean.toUpperCase()}, ${restClean}` : lastClean.toUpperCase(),
      surnameUpper: lastClean.toUpperCase(),
      surnameTitle: capitalizeWord(lastClean),
    };
  }

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    const single = tokens[0];
    return {
      referenceEntry: single.toUpperCase(),
      surnameUpper: single.toUpperCase(),
      surnameTitle: capitalizeWord(single),
    };
  }

  const suffixes = new Set(['filho', 'filha', 'júnior', 'junior', 'neto', 'neta', 'sobrinho', 'sobrinha', 'segundo', 'terceiro']);
  let lastName = tokens[tokens.length - 1];
  let givenTokens = tokens.slice(0, -1);

  if (tokens.length >= 3 && suffixes.has(lastName.toLowerCase())) {
    lastName = `${tokens[tokens.length - 2]} ${lastName}`;
    givenTokens = tokens.slice(0, -2);
  }

  const givenNames = givenTokens.join(' ');
  return {
    referenceEntry: `${lastName.toUpperCase()}, ${givenNames}`,
    surnameUpper: lastName.toUpperCase(),
    surnameTitle: lastName
      .split(/\s+/)
      .map((w) => capitalizeWord(w))
      .join(' '),
  };
}

function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export interface GeneratedAbntOutput {
  inTextCitation: string;
  parentheticalCall: string;
  referencePlain: string;
  referenceParts: {
    authorPrefix: string;
    titleBold: string;
    subtitleSuffix: string;
    restSuffix: string;
    url: string;
    accessSuffix: string;
  };
  fullFormattedText: string;
  rtfContent: string;
  charCount: number;
  estimatedLines: number;
}

/**
 * Gera todos os formatos de citação ABNT (NBR 10520 + NBR 6023) a partir da configuração do usuário.
 */
export function generateAbntCitationBundle(config: AbntCitationConfig): GeneratedAbntOutput {
  const author = parseAbntAuthor(config.authorRaw, config.isCorporateAuthor);
  const year = (config.year || String(new Date().getFullYear())).trim();
  const pageRaw = (config.pageOrSection || '').trim();
  const pageToken = pageRaw
    ? pageRaw.toLowerCase().startsWith('p.') || pageRaw.toLowerCase().startsWith('se') || pageRaw.toLowerCase().startsWith('cap')
      ? pageRaw
      : `p. ${pageRaw}`
    : '';

  const callAuthor =
    config.parenthesisCase === 'titlecase' ? author.surnameTitle : author.surnameUpper;

  // Chamada entre parênteses
  let parentheticalCall = '';
  if (config.style === 'apud') {
    const orig = parseAbntAuthor(config.apudOriginalAuthor || 'AUTOR ORIGINAL', false);
    const origCall = config.parenthesisCase === 'titlecase' ? orig.surnameTitle : orig.surnameUpper;
    const origYear = (config.apudOriginalYear || year).trim();
    parentheticalCall = `(${origCall}, ${origYear} apud ${callAuthor}, ${year}${pageToken ? `, ${pageToken}` : ''})`;
  } else {
    parentheticalCall = `(${callAuthor}, ${year}${pageToken ? `, ${pageToken}` : ''})`;
  }

  // Limpa texto do excerto / paráfrase
  const rawBody = (config.excerptText || '').replace(/\s+/g, ' ').trim();
  const fallbackBody =
    config.style === 'indireta'
      ? `Conforme abordado no documento "${config.title}", os argumentos centrais evidenciam a relevância histórica e documental do tema analisado.`
      : `Trecho literal selecionado do documento "${config.title}" para fundamentação acadêmica.`;
  const body = rawBody || fallbackBody;
  const cleanBodyNoQuotes = body.replace(/^["“]+|["”]+$/g, '').trim();

  // Monta a citação no corpo do texto segundo o estilo ABNT NBR 10520
  let inTextCitation = '';
  if (config.style === 'direta_curta') {
    if (config.callPosition === 'texto') {
      const innerYearPage = `(${year}${pageToken ? `, ${pageToken}` : ''})`;
      inTextCitation = `Segundo ${author.surnameTitle} ${innerYearPage}, "${cleanBodyNoQuotes}"`;
    } else {
      const terminated = /[.!?]$/.test(cleanBodyNoQuotes) ? cleanBodyNoQuotes : `${cleanBodyNoQuotes}.`;
      inTextCitation = `"${terminated}" ${parentheticalCall}.`;
    }
  } else if (config.style === 'direta_longa') {
    const terminated = /[.!?]$/.test(cleanBodyNoQuotes) ? cleanBodyNoQuotes : `${cleanBodyNoQuotes}.`;
    if (config.callPosition === 'texto') {
      const innerYearPage = `(${year}${pageToken ? `, ${pageToken}` : ''})`;
      inTextCitation = `Conforme destaca ${author.surnameTitle} ${innerYearPage}:\n\n    ${terminated}`;
    } else {
      inTextCitation = `    ${terminated} ${parentheticalCall}.`;
    }
  } else if (config.style === 'indireta') {
    const terminated = /[.!?]$/.test(cleanBodyNoQuotes) ? cleanBodyNoQuotes : `${cleanBodyNoQuotes}`;
    if (config.callPosition === 'texto') {
      const innerYear = `(${year}${pageToken ? `, ${pageToken}` : ''})`;
      inTextCitation = `De acordo com ${author.surnameTitle} ${innerYear}, ${lowerFirstIfNeeded(terminated)}${/[.!?]$/.test(terminated) ? '' : '.'}`;
    } else {
      const cleanSentence = /[.!?]$/.test(cleanBodyNoQuotes) ? cleanBodyNoQuotes.slice(0, -1) : cleanBodyNoQuotes;
      inTextCitation = `${cleanSentence} ${parentheticalCall}.`;
    }
  } else {
    // apud
    const orig = parseAbntAuthor(config.apudOriginalAuthor || 'AUTOR ORIGINAL', false);
    const origYear = (config.apudOriginalYear || year).trim();
    if (config.callPosition === 'texto') {
      inTextCitation = `Segundo ${orig.surnameTitle} (${origYear} apud ${author.surnameTitle}, ${year}${pageToken ? `, ${pageToken}` : ''}), "${cleanBodyNoQuotes}"`;
    } else {
      const terminated = /[.!?]$/.test(cleanBodyNoQuotes) ? cleanBodyNoQuotes : `${cleanBodyNoQuotes}.`;
      inTextCitation = `"${terminated}" ${parentheticalCall}.`;
    }
  }

  // Referência bibliográfica completa (ABNT NBR 6023:2018)
  const cleanTitle = (config.title || 'Documento sem título').trim();
  const subtitleSuffix = config.subtitle?.trim() ? `: ${config.subtitle.trim()}` : '';
  const portalName = (config.portalName || 'WazzimaGiygg Core — WikiWorldWeb').trim();
  const locationToken = config.location?.trim() ? `${config.location.trim()}: ` : '';
  const accessDate = (config.accessDate || formatAbntDate()).trim();
  const cleanUrl = (config.url || 'https://core.wazzimagiygg.com/').trim();

  const authorPrefix = `${author.referenceEntry}. `;
  const restSuffix = `. ${locationToken}${portalName}, ${year}. Disponível em: <`;
  const accessSuffix = `>. Acesso em: ${accessDate}.`;

  const referencePlain = `${authorPrefix}${cleanTitle}${subtitleSuffix}${restSuffix}${cleanUrl}${accessSuffix}`;

  // Texto formatado completo para exportação acadêmica (.txt / clipboard)
  const styleLabelMap: Record<AbntCitationStyle, string> = {
    direta_curta: 'CITAÇÃO DIRETA CURTA (até 3 linhas — ABNT NBR 10520:2023)',
    direta_longa: 'CITAÇÃO DIRETA LONGA (mais de 3 linhas, recuo 4 cm — ABNT NBR 10520:2023)',
    indireta: 'CITAÇÃO INDIRETA / PARÁFRASE (ABNT NBR 10520:2023)',
    apud: 'CITAÇÃO DE CITAÇÃO (apud — ABNT NBR 10520:2023)',
  };

  const fullLines: string[] = [
    `[${styleLabelMap[config.style]}]`,
    '',
    inTextCitation,
  ];

  if (config.includeReferenceInExport) {
    fullLines.push('', 'REFERÊNCIA BIBLIOGRÁFICA (ABNT NBR 6023:2018):', referencePlain);
  }

  const fullFormattedText = fullLines.join('\n');

  // RTF formatado com Times New Roman 12pt / 10pt e recuo de 4 cm (2268 twips) para citação longa
  const rtfInText = buildRtfBody(config, inTextCitation, cleanBodyNoQuotes, parentheticalCall, author.surnameTitle, year, pageToken);
  const rtfRefSection = config.includeReferenceInExport
    ? `\\par\\pard\\sa120\\sl240\\slmult1\\qj{\\b REFER\\u202?NCIAS (ABNT NBR 6023:2018)}\\par` +
      `\\pard\\sa160\\sl240\\slmult1\\ql` +
      `${escapeRtf(authorPrefix)}{\\b ${escapeRtf(cleanTitle)}}${escapeRtf(subtitleSuffix)}${escapeRtf(restSuffix)}${escapeRtf(cleanUrl)}${escapeRtf(accessSuffix)}\\par`
    : '';

  const rtfContent =
    `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}` +
    `\\f0\\fs24` +
    `${rtfInText}` +
    `${rtfRefSection}` +
    `}`;

  const charCount = cleanBodyNoQuotes.length;
  const estimatedLines = Math.max(1, Math.ceil(charCount / 75));

  return {
    inTextCitation,
    parentheticalCall,
    referencePlain,
    referenceParts: {
      authorPrefix,
      titleBold: cleanTitle,
      subtitleSuffix,
      restSuffix,
      url: cleanUrl,
      accessSuffix,
    },
    fullFormattedText,
    rtfContent,
    charCount,
    estimatedLines,
  };
}

function lowerFirstIfNeeded(text: string): string {
  if (!text) return '';
  // Preserva siglas em caixa alta como "LGPD" ou "ABNT"
  if (text.length >= 2 && text[0] === text[0].toUpperCase() && text[1] === text[1].toUpperCase()) {
    return text;
  }
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function escapeRtf(str: string): string {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = str.charCodeAt(i);
    if (ch === '\\') out += '\\\\';
    else if (ch === '{') out += '\\{';
    else if (ch === '}') out += '\\}';
    else if (ch === '\n') out += '\\par ';
    else if (code > 127) out += `\\u${code}?`;
    else out += ch;
  }
  return out;
}

function buildRtfBody(
  config: AbntCitationConfig,
  inTextCitation: string,
  cleanBodyNoQuotes: string,
  parentheticalCall: string,
  surnameTitle: string,
  year: string,
  pageToken: string
): string {
  if (config.style === 'direta_longa') {
    const terminated = /[.!?]$/.test(cleanBodyNoQuotes) ? cleanBodyNoQuotes : `${cleanBodyNoQuotes}.`;
    const intro =
      config.callPosition === 'texto'
        ? `\\pard\\sa160\\sl360\\slmult1\\qj ${escapeRtf(`Conforme destaca ${surnameTitle} (${year}${pageToken ? `, ${pageToken}` : ''}):`)}\\par`
        : '';
    const blockQuote =
      config.callPosition === 'texto'
        ? `\\pard\\li2268\\sa200\\sl240\\slmult1\\qj\\fs20 ${escapeRtf(terminated)}\\fs24\\par`
        : `\\pard\\li2268\\sa200\\sl240\\slmult1\\qj\\fs20 ${escapeRtf(`${terminated} ${parentheticalCall}.`)}\\fs24\\par`;
    return `${intro}${blockQuote}`;
  }

  return `\\pard\\fi708\\sa200\\sl360\\slmult1\\qj ${escapeRtf(inTextCitation)}\\par`;
}
