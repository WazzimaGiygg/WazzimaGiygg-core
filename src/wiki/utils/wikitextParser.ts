import { ExtensionManager } from '../core/ExtensionManager';
import { formatExternalUrl } from './linkUtils';
import { FileStorageService } from '../services/fileStorageService';

export interface TocItem {
  id: string;
  text: string;
  level: number;
  number: string;
}

export interface ParseResult {
  html: string;
  toc: TocItem[];
  references: string[];
  categories: string[];
}

export function parseWikitext(
  rawWikitext: string,
  _onWikiLinkClick?: (target: string) => void,
  articleTitle?: string
): ParseResult {
  // Aplica filtros registrados por extensões antes de iniciar o parsing do Wikitext
  const wikitext = ExtensionManager.getInstance()
    .getHooks()
    .applyFilters<string>('render:wikitext', rawWikitext || '', articleTitle);

  if (!wikitext || !wikitext.trim()) {
    return {
      html: '<p class="text-slate-400 dark:text-slate-500 italic py-4">Sem conteúdo disponível.</p>',
      toc: [],
      references: [],
      categories: [],
    };
  }

  const toc: TocItem[] = [];
  const references: string[] = [];
  const referenceTooltips: string[] = [];
  const categories: string[] = [];
  const namedRefsMap = new Map<string, number>();

  const blockPlaceholders = new Map<string, string>();
  const inlinePlaceholders = new Map<string, string>();
  let placeholderCount = 0;

  const addBlockPlaceholder = (html: string): string => {
    const id = `___WIKI_BLOCK_${++placeholderCount}___`;
    blockPlaceholders.set(id, html);
    return `\n\n${id}\n\n`;
  };

  const addInlinePlaceholder = (html: string): string => {
    const id = `___WIKI_INLINE_${++placeholderCount}___`;
    inlinePlaceholders.set(id, html);
    return id;
  };

  let text = wikitext;

  // 1. Extract Categories: [[Categoria:Nome]] or [[Category:Name]]
  text = text.replace(/\[\[(?:Categoria|Category):(.*?)\]\]/gi, (_m, cat) => {
    const cleanCat = cat.trim();
    if (cleanCat && !categories.includes(cleanCat)) {
      categories.push(cleanCat);
    }
    return '';
  });

  // 2. Extract Code Blocks: ```lang ... ``` or <pre>...</pre>
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const langLabel = lang ? `<div class="text-[10px] font-mono text-slate-400 border-b border-slate-700/60 pb-1 mb-2 uppercase">${escapeHtml(lang)}</div>` : '';
    const html = `
      <div class="wiki-code-block my-4 rounded-lg bg-slate-900 border border-slate-800 p-3.5 text-slate-100 font-mono text-xs overflow-x-auto shadow-xs not-prose">
        ${langLabel}
        <pre class="leading-relaxed"><code>${escapeHtml(code.trim())}</code></pre>
      </div>
    `;
    return addBlockPlaceholder(html);
  });

  text = text.replace(/<pre(?:\s+lang="([^"]*)")?>([\s\S]*?)<\/pre>/gi, (_m, lang, code) => {
    const langLabel = lang ? `<div class="text-[10px] font-mono text-slate-400 border-b border-slate-700/60 pb-1 mb-2 uppercase">${escapeHtml(lang)}</div>` : '';
    const html = `
      <div class="wiki-code-block my-4 rounded-lg bg-slate-900 border border-slate-800 p-3.5 text-slate-100 font-mono text-xs overflow-x-auto shadow-xs not-prose">
        ${langLabel}
        <pre class="leading-relaxed"><code>${escapeHtml(code.trim())}</code></pre>
      </div>
    `;
    return addBlockPlaceholder(html);
  });

  // 3. Extract MediaWiki Tables: {| ... |} (supports whitespace/newlines like {\n|)
  text = text.replace(/\{\s*\|([\s\S]*?)\|\}/g, (_m, tableContent) => {
    const tableHtml = renderMediaWikiTable(tableContent, inlinePlaceholders, addInlinePlaceholder);
    return addBlockPlaceholder(tableHtml);
  });

  // 4. Extract Footnotes / References: <ref name="name">Citation</ref> or <ref name="name" /> or <ref>Citation</ref>
  const hasRefSectionInSource = /(?:==\s*Refer[êe]ncias\s*==|==\s*Referencias\s*==|==\s*References\s*==|<references\s*\/?>|\{\{reflist\}\}|\{\{Reflist\}\})/i.test(wikitext);

  // Handle standard <ref> tags first to populate namedRefsMap
  text = text.replace(/<ref(?:\s+name=["']([^"']+)["'])?>([\s\S]*?)<\/ref>/gi, (_m, name, refContent) => {
    const cleanContent = refContent.trim();
    const cleanTooltip = cleanContent
      .replace(/<[^>]*>/g, '')
      .replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (_m: string, p1: string, p2?: string) => p2 || p1)
      .replace(/"/g, '&quot;');

    let refIndex: number;
    if (name && namedRefsMap.has(name.trim())) {
      refIndex = namedRefsMap.get(name.trim())!;
    } else {
      references.push(cleanContent);
      referenceTooltips.push(cleanTooltip);
      refIndex = references.length;
      if (name) {
        namedRefsMap.set(name.trim(), refIndex);
      }
    }

    const isValid = hasRefSectionInSource && cleanContent.length > 0;
    const indicatorClass = isValid ? 'wiki-citation-valid' : 'wiki-citation-broken';
    const statusDot = isValid
      ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-0.5"></span>'
      : '<span class="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block mr-0.5 animate-pulse"></span>';
    const labelSuffix = isValid ? '' : ' ⚠';

    const footnoteHtml = `<sup class="wiki-footnote inline-block ml-0.5 cursor-pointer" data-ref-index="${refIndex}" data-ref-name="${name ? escapeHtml(name.trim()) : ''}" data-ref-tooltip="${cleanTooltip}"><a href="#cite_note-${refIndex}" id="cite_ref-${refIndex}" data-ref-index="${refIndex}" data-ref-name="${name ? escapeHtml(name.trim()) : ''}" data-ref-tooltip="${cleanTooltip}" class="${indicatorClass} font-mono text-[11px] font-bold hover:underline" title="${cleanTooltip}">${statusDot}[${refIndex}${labelSuffix}]</a></sup>`;
    return addInlinePlaceholder(footnoteHtml);
  });

  // Handle self-closing reused named refs: <ref name="xyz" />
  text = text.replace(/<ref\s+name=["']([^"']+)["']\s*\/>/gi, (_m, name) => {
    const trimmedName = name.trim();
    const existingIndex = namedRefsMap.get(trimmedName);
    if (existingIndex !== undefined) {
      const tooltip = referenceTooltips[existingIndex - 1] || `Ver referência [${existingIndex}]`;
      const isValid = hasRefSectionInSource;
      const indicatorClass = isValid ? 'wiki-citation-valid' : 'wiki-citation-broken';
      const statusDot = isValid
        ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-0.5"></span>'
        : '<span class="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block mr-0.5 animate-pulse"></span>';
      const labelSuffix = isValid ? '' : ' ⚠';

      const footnoteHtml = `<sup class="wiki-footnote inline-block ml-0.5 cursor-pointer" data-ref-index="${existingIndex}" data-ref-name="${escapeHtml(trimmedName)}" data-ref-tooltip="${tooltip}"><a href="#cite_note-${existingIndex}" id="cite_ref-${existingIndex}" data-ref-index="${existingIndex}" data-ref-name="${escapeHtml(trimmedName)}" data-ref-tooltip="${tooltip}" class="${indicatorClass} font-mono text-[11px] font-bold hover:underline" title="${tooltip}">${statusDot}[${existingIndex}${labelSuffix}]</a></sup>`;
      return addInlinePlaceholder(footnoteHtml);
    }
    // Highlight undefined citation inconsistency in rendered article in RED
    const errorTooltip = `Esta referência ("${escapeHtml(trimmedName)}") foi invocada no texto mas não possui uma entrada correspondente definida na seção de referências. Use o botão 'Fix Citations' para gerar a entrada correspondente.`;
    const errorHtml = `<sup class="wiki-footnote inline-block ml-0.5 not-prose cursor-pointer" data-ref-error="true" data-ref-name="${escapeHtml(trimmedName)}" data-ref-tooltip="${errorTooltip}"><span data-ref-error="true" data-ref-name="${escapeHtml(trimmedName)}" data-ref-tooltip="${errorTooltip}" class="wiki-citation-broken font-mono text-[10px] font-bold" title="Erro de Citação: O marcador <ref name=&quot;${trimmedName}&quot; /> não possui uma definição no artigo."><span class="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block mr-0.5 animate-ping"></span>[Erro: ref ${escapeHtml(trimmedName)} ⚠]</span></sup>`;
    return addInlinePlaceholder(errorHtml);
  });

  // 5. Extract Galleries: <gallery> ... </gallery> or {{Galeria|...}}
  text = text.replace(/<gallery(?:\s+caption="([^"]*)")?>([\s\S]*?)<\/gallery>/gi, (_m, caption, galleryContent) => {
    const galleryHtml = renderGallery(galleryContent, caption, inlinePlaceholders);
    return addBlockPlaceholder(galleryHtml);
  });

  // 6. Extract Collapsible blocks: [[collapsible ...]] ... [[/collapsible]]
  text = text.replace(/\[\[collapsible(?:\s+show="([^"]*)")?(?:\s+hide="([^"]*)")?\]\]([\s\S]*?)\[\[\/collapsible\]\]/gi, (_m, showText, _hideText, content) => {
    const title = showText || 'Exibir conteúdo recolhido';
    const html = `
      <details class="wiki-collapsible my-3 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden not-prose group bg-white dark:bg-slate-900 shadow-xs">
        <summary class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 cursor-pointer font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between transition select-none">
          <span>${escapeHtml(title)}</span>
          <span class="text-[10px] text-slate-400 font-mono group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-3.5 text-xs border-t border-slate-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
          ${formatInline(content.trim(), inlinePlaceholders)}
        </div>
      </details>
    `;
    return addBlockPlaceholder(html);
  });

  // 7. Extract MediaWiki Images: [[Ficheiro:...]], [[Arquivo:...]], [[Imagem:...]], [[File:...]], [[Image:...]]
  text = text.replace(/\[\[(?:Ficheiro|Arquivo|Imagem|File|Image):([\s\S]*?)\]\]/gi, (_m, content) => {
    const imageHtml = renderMediaWikiImage(content, inlinePlaceholders);
    return addBlockPlaceholder(imageHtml);
  });

  // Also Markdown images: ![alt](url)
  text = text.replace(/!\[(.*?)\]\((.*?)\)/g, (_m, alt, url) => {
    const cleanUrl = url.trim();
    const cleanAlt = alt.trim() || 'Imagem do artigo';
    const html = `
      <figure class="wiki-image-thumb my-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg max-w-lg mx-auto not-prose shadow-xs text-center">
        <img src="${escapeHtml(cleanUrl)}" alt="${escapeHtml(cleanAlt)}" class="max-h-72 w-auto mx-auto rounded object-cover" loading="lazy" />
        ${cleanAlt ? `<figcaption class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-snug italic font-sans">${escapeHtml(cleanAlt)}</figcaption>` : ''}
      </figure>
    `;
    return addBlockPlaceholder(html);
  });

  // 8. Balanced Templates Parser (handles nested templates {{...}} safely)
  text = parseTemplatesWithBalancedBraces(text, {
    onInfobox: (content, tName) => addBlockPlaceholder(renderInfobox(content, inlinePlaceholders, tName)),
    onAviso: (content) => addBlockPlaceholder(renderWarningNotice(content, inlinePlaceholders)),
    onNota: (content) => addBlockPlaceholder(renderInfoNotice(content, inlinePlaceholders)),
    onDestaque: (content) => addBlockPlaceholder(renderHighlightNotice(content, inlinePlaceholders)),
    onEsboco: (topic) => addBlockPlaceholder(renderStubNotice(topic)),
    onCitacao: (content) => addBlockPlaceholder(renderQuote(content, inlinePlaceholders)),
    onUserbox: (content) => addBlockPlaceholder(renderUserbox(content, inlinePlaceholders)),
    onMainArticle: (target) => addBlockPlaceholder(renderMainArticle(target)),
    onSeeAlso: (targets) => addBlockPlaceholder(renderSeeAlso(targets)),
    onCitationNeeded: () => addInlinePlaceholder(renderCitationNeeded()),
    onDisambig: (content) => addBlockPlaceholder(renderDisambig(content)),
    onCitationTemplate: (content) => addInlinePlaceholder(renderCitationTemplate(content)),
    onCollapsible: (content) => addBlockPlaceholder(renderCollapsibleTemplate(content, inlinePlaceholders)),
    onReflist: () => addBlockPlaceholder('___WIKI_REFLIST_PLACEHOLDER___'),
    onGenericTemplate: (name, params) => addInlinePlaceholder(renderGenericBadge(name, params)),
  });

  // 9. Line-by-Line Section & Block Parsing
  const rawLines = text.split('\n');
  const processedLines: string[] = [];

  let inUl = false;
  let inOl = false;
  let inBlockquote = false;
  let blockquoteBuffer: string[] = [];

  // TOC numbering counters (Section 1, 1.1, 1.2, 2, etc.)
  const sectionCounters = [0, 0, 0, 0, 0, 0];
  let headerGlobalIndex = 0;

  const flushBlockquote = () => {
    if (inBlockquote) {
      processedLines.push(`
        <blockquote class="my-3 border-l-4 border-blue-500 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-r-lg text-xs italic text-slate-700 dark:text-slate-300 shadow-xs not-prose leading-relaxed">
          ${blockquoteBuffer.map((l) => formatInline(l, inlinePlaceholders)).join('<br />')}
        </blockquote>
      `);
      inBlockquote = false;
      blockquoteBuffer = [];
    }
  };

  const flushLists = () => {
    if (inUl) {
      processedLines.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      processedLines.push('</ol>');
      inOl = false;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Check if line is a block placeholder (e.g. ___WIKI_BLOCK_1___)
    if (/^___WIKI_BLOCK_\d+___$/.test(trimmed)) {
      flushLists();
      flushBlockquote();
      processedLines.push(trimmed);
      continue;
    }

    // Check if line is reflist placeholder
    if (
      trimmed === '___WIKI_REFLIST_PLACEHOLDER___' ||
      trimmed === '<references />' ||
      trimmed === '<references/>' ||
      trimmed === '{{reflist}}' ||
      trimmed === '{{Reflist}}'
    ) {
      flushLists();
      flushBlockquote();
      processedLines.push(renderReferencesSection(references, inlinePlaceholders));
      continue;
    }

    // Blockquotes (> text)
    if (trimmed.startsWith('>')) {
      flushLists();
      inBlockquote = true;
      blockquoteBuffer.push(trimmed.replace(/^>\s*/, ''));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Horizontal Rules
    if (trimmed === '---' || trimmed === '***' || trimmed === '----' || trimmed === '_____') {
      flushLists();
      processedLines.push('<hr class="my-5 border-slate-200 dark:border-slate-800" />');
      continue;
    }

    // Headers (= H1 =, == H2 ==, === H3 ===, ==== H4 ====, etc., Markdown #, ##, ###, and HTML <h2>...</h2>)
    const wikiHeaderMatch = line.match(/^(={1,6})\s*(.*?)\s*\1$/);
    const mdHeaderMatch = !wikiHeaderMatch ? line.match(/^(#{2,6})\s+(.*)$/) : null;
    const htmlHeaderMatch = !wikiHeaderMatch && !mdHeaderMatch ? line.match(/^<h([1-6])(?:\s+[^>]*)?>(.*?)<\/h\1>$/i) : null;
    const headerMatch = wikiHeaderMatch || mdHeaderMatch || htmlHeaderMatch;

    if (headerMatch) {
      flushLists();
      const level = wikiHeaderMatch
        ? wikiHeaderMatch[1].length
        : mdHeaderMatch
        ? mdHeaderMatch[1].length
        : parseInt(htmlHeaderMatch![1], 10);
      const rawText = wikiHeaderMatch
        ? wikiHeaderMatch[2]
        : mdHeaderMatch
        ? mdHeaderMatch[2]
        : htmlHeaderMatch![2].replace(/<[^>]+>/g, '');
      const headerText = rawText.trim();

      // Compute hierarchical numbering
      sectionCounters[level - 1]++;
      for (let l = level; l < sectionCounters.length; l++) {
        sectionCounters[l] = 0;
      }
      const numberStr = sectionCounters.slice(0, level).join('.');

      headerGlobalIndex++;
      const id = `section-${headerGlobalIndex}-${slugify(headerText)}`;

      // Include H1, H2, H3 and subheaders in Table of Contents
      if (level >= 1) {
        toc.push({
          id,
          text: headerText,
          level,
          number: numberStr,
        });
      }

      const formattedTitle = formatInline(headerText, inlinePlaceholders);

      if (level === 1) {
        processedLines.push(`
          <h1 id="${id}" data-header-title="${escapeHtml(headerText)}" class="text-2xl sm:text-3xl font-serif-heading font-bold text-slate-900 dark:text-white mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            ${formattedTitle}
          </h1>
        `);
      } else if (level === 2) {
        processedLines.push(`
          <h2 id="${id}" data-header-title="${escapeHtml(headerText)}" class="text-xl sm:text-2xl font-serif-heading font-semibold text-slate-900 dark:text-white mt-7 mb-3 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between group">
            <span class="flex items-center gap-2">
              <span class="text-slate-400 dark:text-slate-500 font-mono text-sm font-normal">${numberStr}</span>
              <span>${formattedTitle}</span>
            </span>
            <a href="#${id}" class="text-slate-300 dark:text-slate-600 hover:text-blue-500 text-sm opacity-0 group-hover:opacity-100 transition font-mono" title="Link para esta seção">#</a>
          </h2>
        `);
      } else if (level === 3) {
        processedLines.push(`
          <h3 id="${id}" data-header-title="${escapeHtml(headerText)}" class="text-base sm:text-lg font-serif-heading font-bold text-slate-800 dark:text-slate-200 mt-5 mb-2 flex items-center gap-2">
            <span class="text-slate-400 dark:text-slate-500 font-mono text-xs font-normal">${numberStr}</span>
            <span>${formattedTitle}</span>
          </h3>
        `);
      } else {
        processedLines.push(`
          <h4 id="${id}" data-header-title="${escapeHtml(headerText)}" class="text-sm font-bold text-slate-700 dark:text-slate-300 mt-4 mb-1.5 flex items-center gap-1.5">
            <span class="text-slate-400 dark:text-slate-500 font-mono text-[11px] font-normal">${numberStr}</span>
            <span>${formattedTitle}</span>
          </h4>
        `);
      }
      continue;
    }

    // Unordered Lists (* item, ** sub-item)
    const ulMatch = line.match(/^(\*{1,3})\s*(.*)$/);
    if (ulMatch) {
      if (inOl) {
        processedLines.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        processedLines.push('<ul class="wiki-list list-disc list-outside ml-5 space-y-1 my-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">');
        inUl = true;
      }
      const listLevel = ulMatch[1].length;
      const itemContent = ulMatch[2];
      const indentClass = listLevel > 1 ? `ml-${(listLevel - 1) * 4}` : '';
      processedLines.push(`<li class="${indentClass}">${formatInline(itemContent, inlinePlaceholders)}</li>`);
      continue;
    }

    // Ordered Lists (# item, ## sub-item)
    const olMatch = line.match(/^(#{1,3}|\d+\.)\s*(.*)$/);
    if (olMatch) {
      if (inUl) {
        processedLines.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        processedLines.push('<ol class="wiki-list list-decimal list-outside ml-5 space-y-1 my-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">');
        inOl = true;
      }
      const listLevel = olMatch[1].startsWith('#') ? olMatch[1].length : 1;
      const itemContent = olMatch[2];
      const indentClass = listLevel > 1 ? `ml-${(listLevel - 1) * 4}` : '';
      processedLines.push(`<li class="${indentClass}">${formatInline(itemContent, inlinePlaceholders)}</li>`);
      continue;
    }

    // Close open lists if regular line
    flushLists();

    // Definition Lists (; Term : Definition)
    if (trimmed.startsWith(';')) {
      const defParts = trimmed.substring(1).split(':');
      const term = defParts[0].trim();
      const def = defParts.slice(1).join(':').trim();
      processedLines.push(`
        <dl class="my-2 text-xs sm:text-sm">
          <dt class="font-bold text-slate-900 dark:text-slate-100">${formatInline(term, inlinePlaceholders)}</dt>
          ${def ? `<dd class="ml-4 text-slate-600 dark:text-slate-400 mt-0.5">${formatInline(def, inlinePlaceholders)}</dd>` : ''}
        </dl>
      `);
      continue;
    }

    // MediaWiki Indentation (: indented text)
    if (trimmed.startsWith(':')) {
      const indentCount = (line.match(/^:+/) || [''])[0].length;
      const textAfter = line.replace(/^:+/, '').trim();
      processedLines.push(`
        <div style="margin-left: ${indentCount * 1.5}rem" class="my-1.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-2">
          ${formatInline(textAfter, inlinePlaceholders)}
        </div>
      `);
      continue;
    }

    // Empty Lines
    if (trimmed === '') {
      processedLines.push('<div class="h-2"></div>');
      continue;
    }

    // Regular Paragraphs
    processedLines.push(`
      <p class="my-2.5 leading-relaxed text-slate-800 dark:text-slate-200 font-wiki-body text-xs sm:text-sm">
        ${formatInline(line, inlinePlaceholders)}
      </p>
    `);
  }

  flushLists();
  flushBlockquote();

  // Auto-append references section if citations exist and no reflist was placed in text
  const hasReflistInText =
    text.includes('<references />') ||
    text.includes('<references/>') ||
    text.includes('{{reflist}}') ||
    text.includes('{{Reflist}}') ||
    text.includes('___WIKI_REFLIST_PLACEHOLDER___');

  if (references.length > 0 && !hasReflistInText) {
    processedLines.push(renderReferencesSection(references, inlinePlaceholders));
  }

  let finalHtml = processedLines.join('\n');

  // Substitute all block placeholders back
  blockPlaceholders.forEach((blockHtml, placeholder) => {
    finalHtml = finalHtml.split(placeholder).join(blockHtml);
  });

  // Substitute all inline placeholders back
  inlinePlaceholders.forEach((inlineHtml, placeholder) => {
    finalHtml = finalHtml.split(placeholder).join(inlineHtml);
  });

  // Aplica filtros de pós-processamento HTML registrados por extensões
  const filteredHtml = ExtensionManager.getInstance()
    .getHooks()
    .applyFilters<string>('render:html', finalHtml, { toc, references, categories, articleTitle });

  return {
    html: filteredHtml,
    toc,
    references,
    categories,
  };
}

/**
 * Parses balanced braces {{ ... }} correctly without getting cut off by nested tags
 */
function parseTemplatesWithBalancedBraces(
  text: string,
  handlers: {
    onInfobox: (content: string, templateName?: string) => string;
    onAviso: (content: string) => string;
    onNota: (content: string) => string;
    onDestaque: (content: string) => string;
    onEsboco: (topic?: string) => string;
    onCitacao: (content: string) => string;
    onUserbox: (content: string) => string;
    onMainArticle: (target: string) => string;
    onSeeAlso: (targets: string[]) => string;
    onCitationNeeded: () => string;
    onDisambig: (content?: string) => string;
    onCitationTemplate: (content: string) => string;
    onCollapsible: (content: string) => string;
    onReflist: () => string;
    onGenericTemplate: (name: string, params: string[]) => string;
  }
): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    if (text[i] === '{' && text[i + 1] === '{') {
      // Find matching }} with depth counting
      let depth = 1;
      let j = i + 2;
      while (j < text.length && depth > 0) {
        if (text[j] === '{' && text[j + 1] === '{') {
          depth++;
          j += 2;
        } else if (text[j] === '}' && text[j + 1] === '}') {
          depth--;
          j += 2;
        } else {
          j++;
        }
      }

      if (depth === 0) {
        // We extracted a full template from i to j
        const fullTemplate = text.substring(i + 2, j - 2).trim();
        // Normalize any <br> or &nbsp; inside template declaration
        const normalizedTemplate = fullTemplate.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ');
        const firstPipe = normalizedTemplate.indexOf('|');
        const templateName = (firstPipe === -1 ? normalizedTemplate : normalizedTemplate.substring(0, firstPipe)).trim();
        const templateBody = firstPipe === -1 ? '' : normalizedTemplate.substring(firstPipe + 1);

        const lowerName = templateName.toLowerCase().replace(/<[^>]*>/g, '').trim();

        let replacement = '';

        if (lowerName === 'infobox' || lowerName.startsWith('info/') || lowerName.startsWith('ficha')) {
          replacement = handlers.onInfobox(templateBody || normalizedTemplate, templateName);
        } else if (lowerName === 'aviso' || lowerName === 'alerta' || lowerName === 'warning') {
          replacement = handlers.onAviso(templateBody);
        } else if (lowerName === 'nota' || lowerName === 'info') {
          replacement = handlers.onNota(templateBody);
        } else if (lowerName === 'destaque' || lowerName === 'highlight') {
          replacement = handlers.onDestaque(templateBody);
        } else if (lowerName === 'esboço' || lowerName === 'esboco' || lowerName === 'stub') {
          replacement = handlers.onEsboco(templateBody);
        } else if (lowerName === 'citação' || lowerName === 'citacao' || lowerName === 'quote' || lowerName === 'cita') {
          replacement = handlers.onCitacao(templateBody);
        } else if (lowerName === 'userbox') {
          replacement = handlers.onUserbox(templateBody);
        } else if (lowerName === 'artigo principal' || lowerName === 'main') {
          replacement = handlers.onMainArticle(templateBody);
        } else if (lowerName === 'ver também' || lowerName === 'ver tambem' || lowerName === 'see also') {
          const targets = templateBody.split('|').map((s) => s.trim()).filter(Boolean);
          replacement = handlers.onSeeAlso(targets);
        } else if (
          lowerName === 'carece de fontes' ||
          lowerName === 'sem-fontes' ||
          lowerName === 'citacao necessaria' ||
          lowerName === 'cn'
        ) {
          replacement = handlers.onCitationNeeded();
        } else if (lowerName === 'desambiguação' || lowerName === 'desambiguacao' || lowerName === 'desambig') {
          replacement = handlers.onDisambig(templateBody);
        } else if (
          lowerName === 'citar web' ||
          lowerName === 'cite web' ||
          lowerName === 'citar livro' ||
          lowerName === 'cite book' ||
          lowerName === 'citar jornal' ||
          lowerName === 'cite journal'
        ) {
          replacement = handlers.onCitationTemplate(fullTemplate);
        } else if (lowerName === 'collapsible') {
          replacement = handlers.onCollapsible(templateBody);
        } else if (lowerName === 'reflist' || lowerName === 'referências' || lowerName === 'referencias') {
          replacement = handlers.onReflist();
        } else {
          const params = templateBody ? templateBody.split('|').map((p) => p.trim()) : [];
          replacement = handlers.onGenericTemplate(templateName, params);
        }

        result += replacement;
        i = j;
        continue;
      }
    }

    result += text[i];
    i++;
  }

  return result;
}

/**
 * Format inline text (Bold, Italics, Links, Tooltips, Code, Math)
 */
export function formatInline(text: string, inlineMap?: Map<string, string>): string {
  if (!text) return '';

  // 1. Temporarily extract safe HTML tags commonly found in wikitext (like <br>, <small>, <sub>, <sup>, <span>, etc.)
  const safeTags: string[] = [];
  const safeTagRegex = /<\/?(br|hr|small|big|sub|sup|b|strong|i|em|u|s|del|ins|mark|code|kbd|abbr|span|div|center|blockquote|q|font)(?:\s+[^>]*)?\/?>/gi;

  const protectedText = text.replace(safeTagRegex, (match) => {
    // Prevent malicious script injection while keeping presentation tags
    if (/on\w+\s*=|javascript:/i.test(match)) return '';
    safeTags.push(match);
    return `___SAFE_HTML_TAG_${safeTags.length - 1}___`;
  });

  let res = escapeHtml(protectedText);

  // Bold & Italic: '''''text'''''
  res = res.replace(/'''''([\s\S]*?)'''''/g, '<strong><em>$1</em></strong>');

  // Bold: '''text''' or **text**
  res = res.replace(/'''([\s\S]*?)'''/g, '<strong>$1</strong>');
  res = res.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');

  // Italic: ''text'' or *text* or _text_
  res = res.replace(/''([\s\S]*?)''/g, '<em>$1</em>');
  res = res.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Strikethrough: ~~text~~ or <s>text</s>
  res = res.replace(/~~(.*?)~~/g, '<del class="text-slate-400 dark:text-slate-500">$1</del>');

  // Inline code: `code`
  res = res.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-xs border border-slate-200 dark:border-slate-700 font-semibold">$1</code>'
  );

  // Internal Wiki Links: [[Destino|Texto]] or [[Destino]]
  res = res.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (_m, target, title) => {
    const cleanTarget = target.trim();
    if (cleanTarget.toLowerCase().startsWith('categoria:') || cleanTarget.toLowerCase().startsWith('category:')) {
      return '';
    }
    const label = title ? title.trim() : cleanTarget;
    return `<a href="#wiki:${encodeURIComponent(cleanTarget)}" data-wiki-target="${escapeHtml(cleanTarget)}" class="wiki-link text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium underline underline-offset-2 decoration-blue-300 dark:decoration-blue-700 transition cursor-pointer">${escapeHtml(label)}</a>`;
  });

  // External Links: [https://url.com Texto do Link] or [https://url.com]
  res = res.replace(/\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]+))?\]/g, (_m, url, title) => {
    const label = title ? title.trim() : url;
    const redirectUrl = formatExternalUrl(url);
    return `<a href="${redirectUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5">${escapeHtml(label)} <span class="text-[10px] text-slate-400">↗</span></a>`;
  });

  // Plain URLs (e.g. https://domain.com) not already inside href
  res = res.replace(
    /(?<!href=")(https?:\/\/[^\s<>"']+)/gi,
    (_m, url) => {
      const redirectUrl = formatExternalUrl(url);
      return `<a href="${redirectUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5">${url} <span class="text-[10px] text-slate-400">↗</span></a>`;
    }
  );

  // Restore safe HTML tags
  if (safeTags.length > 0) {
    safeTags.forEach((tag, idx) => {
      res = res.split(`___SAFE_HTML_TAG_${idx}___`).join(tag);
    });
  }

  // Restore inline placeholders if map provided
  if (inlineMap) {
    inlineMap.forEach((val, key) => {
      res = res.split(key).join(val);
    });
  }

  return res;
}

// === RENDERERS FOR WIKIPEDIA TEMPLATES & BLOCKS ===

function renderInfobox(content: string, inlineMap?: Map<string, string>, templateName: string = 'Infobox'): string {
  const normalizedContent = content.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ');
  const lines = normalizedContent.split('\n');
  let infoboxTitle = 'Informações';
  let infoboxSubtitle = '';
  let infoboxImage = '';
  let infoboxImageCaption = '';
  const rows: { label: string; value: string; isHeader?: boolean }[] = [];

  const paramPairs: string[] = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const clean = trimmed.startsWith('|') ? trimmed.substring(1).trim() : trimmed;
    if (clean.includes('=')) {
      paramPairs.push(clean);
    }
  });

  paramPairs.forEach((pair) => {
    const eqIdx = pair.indexOf('=');
    if (eqIdx !== -1) {
      const rawKey = pair.substring(0, eqIdx).trim();
      const key = rawKey.toLowerCase();
      const rawVal = pair.substring(eqIdx + 1).trim();
      const formattedVal = formatInline(rawVal, inlineMap);

      if (key === 'nome' || key === 'titulo' || key === 'title' || key === 'name') {
        infoboxTitle = rawVal;
      } else if (key === 'subtitulo' || key === 'subtitle' || key === 'tipo') {
        infoboxSubtitle = rawVal;
      } else if (key === 'imagem' || key === 'image' || key === 'foto') {
        infoboxImage = rawVal;
      } else if (key === 'legenda' || key === 'caption') {
        infoboxImageCaption = rawVal;
      } else if (key.startsWith('secao') || key.startsWith('header') || key.startsWith('subsecao')) {
        rows.push({ label: rawVal, value: '', isHeader: true });
      } else {
        const cleanLabel = rawKey.replace(/_/g, ' ');
        rows.push({ label: cleanLabel, value: formattedVal });
      }
    }
  });

  const imageHtml = infoboxImage ? `
    <div class="p-2.5 text-center bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700/80">
      <img src="${escapeHtml(infoboxImage)}" alt="${escapeHtml(infoboxTitle)}" class="max-h-48 mx-auto rounded object-cover shadow-xs border border-slate-200 dark:border-slate-700" loading="lazy" />
      ${infoboxImageCaption ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic font-sans">${escapeHtml(infoboxImageCaption)}</p>` : ''}
    </div>
  ` : '';

  const rowsHtml = rows
    .map((r) => {
      if (r.isHeader) {
        return `
          <tr class="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <th colspan="2" class="py-1.5 px-2.5 text-center font-bold text-slate-800 dark:text-slate-200 text-xs font-mono uppercase tracking-wider">
              ${escapeHtml(r.label)}
            </th>
          </tr>
        `;
      }
      return `
        <tr class="border-b border-slate-200/80 dark:border-slate-700/60 text-xs">
          <th class="text-left font-semibold text-slate-700 dark:text-slate-300 py-1.5 px-2.5 bg-slate-50/80 dark:bg-slate-800/60 w-2/5 align-top">
            ${escapeHtml(r.label)}
          </th>
          <td class="text-slate-800 dark:text-slate-200 py-1.5 px-2.5 align-top leading-snug">
            ${r.value}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="wiki-infobox not-prose mb-4 float-none sm:float-right sm:ml-6 sm:w-80 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs overflow-hidden" data-wikitext="{{${escapeHtml(templateName)}\n${escapeHtml(normalizedContent.trim())}\n}}">
      <div class="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white font-bold text-center py-2.5 px-3 text-xs sm:text-sm tracking-wide shadow-xs">
        <span class="block font-serif-heading">${escapeHtml(infoboxTitle)}</span>
        ${infoboxSubtitle ? `<span class="block text-[10px] font-mono opacity-80 uppercase tracking-widest mt-0.5">${escapeHtml(infoboxSubtitle)}</span>` : ''}
      </div>
      ${imageHtml}
      <table class="w-full border-collapse">
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

function renderMediaWikiImage(content: string, inlineMap?: Map<string, string>): string {
  const parts = content.split('|').map((p) => p.trim());
  const rawTarget = parts[0];
  let caption = '';
  let align = 'right'; // default float right in Wikipedia
  let widthClass = 'max-w-xs';
  let isThumb = false;
  let customWidthPx: number | null = null;
  let altText = '';

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    const pLower = p.toLowerCase();
    if (pLower === 'thumb' || pLower === 'miniatura' || pLower === 'frame') {
      isThumb = true;
    } else if (pLower === 'left' || pLower === 'esquerda') {
      align = 'left';
    } else if (pLower === 'right' || pLower === 'direita') {
      align = 'right';
    } else if (pLower === 'center' || pLower === 'centro') {
      align = 'center';
    } else if (pLower === 'none') {
      align = 'none';
    } else if (/^\d+px$/.test(pLower)) {
      const num = parseInt(pLower, 10);
      customWidthPx = num;
      if (num < 200) widthClass = 'max-w-[180px]';
      else if (num < 350) widthClass = 'max-w-xs';
      else if (num < 600) widthClass = 'max-w-md';
      else widthClass = 'max-w-xl';
    } else if (pLower.startsWith('alt=')) {
      altText = p.substring(4).trim();
    } else {
      caption = p;
    }
  }

  // Tenta resolver o ficheiro no catálogo local da WikiZero
  const cleanFileName = rawTarget
    .replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '')
    .trim();

  const registeredFile = FileStorageService.getFileByNameSync(cleanFileName);

  let imageUrl = rawTarget;
  let isRegistered = false;
  let fileDisplayName = cleanFileName;

  if (registeredFile) {
    isRegistered = true;
    fileDisplayName = registeredFile.name;
    // Seleciona a miniatura mais apropriada
    if (customWidthPx && customWidthPx <= 200) {
      imageUrl = registeredFile.thumbnails?.sm || registeredFile.url;
    } else if (customWidthPx && customWidthPx <= 450) {
      imageUrl = registeredFile.thumbnails?.md || registeredFile.url;
    } else if (customWidthPx && customWidthPx <= 850) {
      imageUrl = registeredFile.thumbnails?.lg || registeredFile.url;
    } else {
      imageUrl = registeredFile.thumbnails?.md || registeredFile.url;
    }
  } else if (!rawTarget.startsWith('http://') && !rawTarget.startsWith('https://') && !rawTarget.startsWith('data:image/')) {
    // Arquivo referenciado por nome mas que ainda não foi enviado
    return `
      <div class="wiki-image-missing not-prose my-3 p-3 rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700/70 bg-amber-50/60 dark:bg-amber-950/20 text-xs flex items-center justify-between gap-3 shadow-xs">
        <div class="flex items-center gap-2">
          <span class="text-base">🖼️</span>
          <div>
            <span class="font-semibold text-amber-900 dark:text-amber-300">Ficheiro não encontrado:</span>
            <span class="font-mono text-amber-700 dark:text-amber-400 ml-1">[[Arquivo:${escapeHtml(cleanFileName)}]]</span>
          </div>
        </div>
        <a href="#upload:${encodeURIComponent(cleanFileName)}" data-wiki-target="Especial:Upload" class="px-2.5 py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded shadow-xs transition inline-flex items-center gap-1">
          <span>Carregar agora</span>
          <span>↗</span>
        </a>
      </div>
    `;
  }

  const floatClass =
    align === 'center'
      ? 'mx-auto my-4 text-center'
      : align === 'left'
      ? 'float-none sm:float-left sm:mr-5 mb-4 my-2'
      : align === 'none'
      ? 'my-3 inline-block'
      : 'float-none sm:float-right sm:ml-5 mb-4 my-2';

  const fileTarget = `Arquivo:${fileDisplayName}`;
  const effectiveAlt = altText || caption || fileDisplayName;

  const imageElement = `
    <img
      src="${escapeHtml(imageUrl)}"
      alt="${escapeHtml(effectiveAlt)}"
      class="w-full h-auto rounded object-cover border border-slate-200 dark:border-slate-700/60 transition group-hover:opacity-95"
      loading="lazy"
    />
  `;

  const wrappedImage = `
    <a
      href="#file:${encodeURIComponent(fileDisplayName)}"
      data-wiki-target="${escapeHtml(fileTarget)}"
      class="wiki-file-link block group relative cursor-pointer"
      title="Ver detalhes do ficheiro ${escapeHtml(fileTarget)}"
    >
      ${imageElement}
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded pointer-events-none"></div>
    </a>
  `;

  const magnifyIcon = isRegistered
    ? `
      <a
        href="#file:${encodeURIComponent(fileDisplayName)}"
        data-wiki-target="${escapeHtml(fileTarget)}"
        class="inline-flex items-center justify-center w-4 h-4 ml-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        title="Ampliar / Ver detalhes do ficheiro"
      >
        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
      </a>
    `
    : '';

  return `
    <figure class="wiki-image-thumb not-prose ${floatClass} ${widthClass} border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900 p-2 rounded-lg shadow-xs">
      ${wrappedImage}
      ${
        caption || isThumb
          ? `
        <figcaption class="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-snug font-sans flex items-start justify-between gap-1">
          <div class="flex-1">${caption ? formatInline(caption, inlineMap) : `<span class="italic text-slate-400">${escapeHtml(fileDisplayName)}</span>`}</div>
          ${magnifyIcon}
        </figcaption>
      `
          : ''
      }
    </figure>
  `;
}

function renderMediaWikiTable(
  content: string,
  _inlineMap?: Map<string, string>,
  _addInline?: (html: string) => string
): string {
  const normalizedContent = content.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ');
  const lines = normalizedContent.split('\n');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let tableCaption = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('|+')) {
      tableCaption = trimmed.substring(2).trim();
      continue;
    }

    if (trimmed.startsWith('|-')) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
      }
      continue;
    }

    if (trimmed.startsWith('!')) {
      const headers = trimmed.substring(1).split('!!').map((h) => h.trim());
      headers.forEach((h) => {
        // MediaWiki: cell attributes can precede pipe, e.g. style="..." | Title
        let headerText = h;
        if (h.includes('|')) {
          const pipeIdx = h.indexOf('|');
          headerText = h.substring(pipeIdx + 1).trim();
        }
        currentRow.push(
          `<th class="bg-slate-100 dark:bg-slate-800 py-2 px-3 font-semibold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-serif-heading">${formatInline(
            headerText
          )}</th>`
        );
      });
      continue;
    }

    if (trimmed.startsWith('|')) {
      const cells = trimmed.substring(1).split('||').map((c) => c.trim());
      cells.forEach((c) => {
        // MediaWiki: cell attributes can precede pipe, e.g. style="..." | Text
        let cellText = c;
        if (c.includes('|')) {
          const pipeIdx = c.indexOf('|');
          cellText = c.substring(pipeIdx + 1).trim();
        }
        currentRow.push(
          `<td class="py-2 px-3 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed">${formatInline(
            cellText
          )}</td>`
        );
      });
      continue;
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  const tableBody = rows.map((r) => `<tr>${r.join('')}</tr>`).join('');

  return `
    <div class="wiki-table-container overflow-x-auto my-4 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs not-prose bg-white dark:bg-slate-900" data-wikitext="{|\n${escapeHtml(normalizedContent.trim())}\n|}">
      ${tableCaption ? `<div class="p-2 font-bold text-xs text-center border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40">${escapeHtml(tableCaption)}</div>` : ''}
      <table class="wikitable w-full text-xs border-collapse">
        <tbody>${tableBody}</tbody>
      </table>
    </div>
  `;
}

function renderGallery(galleryContent: string, caption?: string, inlineMap?: Map<string, string>): string {
  const lines = galleryContent.split('\n').map((l) => l.trim()).filter(Boolean);
  const itemsHtml = lines
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      const img = parts[0];
      const cap = parts[1] || '';
      return `
        <div class="flex flex-col items-center bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(cap)}" class="max-h-36 w-auto object-cover rounded shadow-xs" loading="lazy" />
          ${cap ? `<span class="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 text-center leading-snug font-sans">${formatInline(cap, inlineMap)}</span>` : ''}
        </div>
      `;
    })
    .join('');

  return `
    <div class="wiki-gallery my-4 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 not-prose shadow-xs">
      ${caption ? `<h4 class="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">${escapeHtml(caption)}</h4>` : ''}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        ${itemsHtml}
      </div>
    </div>
  `;
}

function renderWarningNotice(content: string, inlineMap?: Map<string, string>): string {
  return `
    <div class="my-3.5 p-3.5 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-xs not-prose">
      <span class="text-amber-600 dark:text-amber-400 text-base font-bold flex-shrink-0">⚠️</span>
      <div class="flex-1 leading-relaxed"><strong>Aviso Editorial:</strong> ${formatInline(content.trim(), inlineMap)}</div>
    </div>
  `;
}

function renderInfoNotice(content: string, inlineMap?: Map<string, string>): string {
  return `
    <div class="my-3.5 p-3.5 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5 shadow-xs not-prose">
      <span class="text-blue-600 dark:text-blue-400 text-base font-bold flex-shrink-0">ℹ️</span>
      <div class="flex-1 leading-relaxed"><strong>Nota Informativa:</strong> ${formatInline(content.trim(), inlineMap)}</div>
    </div>
  `;
}

function renderHighlightNotice(content: string, inlineMap?: Map<string, string>): string {
  return `
    <div class="my-3.5 p-3.5 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5 shadow-xs not-prose">
      <span class="text-emerald-600 dark:text-emerald-400 text-base font-bold flex-shrink-0">✨</span>
      <div class="flex-1 leading-relaxed"><strong>Destaque Enciclopédico:</strong> ${formatInline(content.trim(), inlineMap)}</div>
    </div>
  `;
}

function renderStubNotice(topic?: string): string {
  const topicText = topic ? ` sobre <em>${escapeHtml(topic.trim())}</em>` : '';
  return `
    <div class="my-3.5 p-3 rounded-lg border border-dashed border-cyan-400 dark:border-cyan-700 bg-cyan-50/70 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200 text-xs flex items-center gap-2.5 shadow-xs not-prose">
      <span class="text-cyan-600 dark:text-cyan-400 text-lg flex-shrink-0">🧩</span>
      <div class="flex-1 leading-relaxed">
        <strong>Artigo em Esboço:</strong> Este artigo${topicText} é considerado um esboço. Você pode colaborar expandindo-o com informações verificáveis.
      </div>
    </div>
  `;
}

function renderQuote(content: string, inlineMap?: Map<string, string>): string {
  const parts = content.split('|').map((p) => p.trim());
  const quote = parts[0];
  const author = parts[1] || '';
  const source = parts[2] || '';

  const citeText = [author, source].filter(Boolean).join(', ');

  return `
    <blockquote class="my-4 border-l-4 border-blue-500 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-r-lg text-xs italic text-slate-800 dark:text-slate-200 shadow-xs not-prose leading-relaxed">
      <p class="mb-1">“${formatInline(quote, inlineMap)}”</p>
      ${citeText ? `<cite class="block text-right mt-1.5 font-semibold not-italic text-slate-500 dark:text-slate-400 text-[11px] font-sans">— ${escapeHtml(citeText)}</cite>` : ''}
    </blockquote>
  `;
}

function renderUserbox(content: string, inlineMap?: Map<string, string>): string {
  const parts = content.split('|').map((p) => p.trim());
  const icon = parts[0] || '👤';
  const text = parts[1] || '';

  return `
    <div class="wiki-userbox inline-flex items-center border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 shadow-xs overflow-hidden text-xs my-1 mr-2 not-prose max-w-sm">
      <div class="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 font-bold text-sm flex-shrink-0">
        ${escapeHtml(icon)}
      </div>
      <div class="px-2.5 py-1 text-slate-800 dark:text-slate-200 text-[11px] leading-snug font-sans">
        ${formatInline(text, inlineMap)}
      </div>
    </div>
  `;
}

function renderMainArticle(target: string): string {
  const cleanTarget = target.trim();
  return `
    <div class="my-2 py-1 px-2.5 rounded bg-slate-50 dark:bg-slate-800/50 border-l-2 border-blue-600 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 not-prose font-sans">
      <span class="text-blue-600 font-bold">📄</span>
      <span>Artigo principal: <a href="#wiki:${encodeURIComponent(cleanTarget)}" data-wiki-target="${escapeHtml(cleanTarget)}" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">${escapeHtml(cleanTarget)}</a></span>
    </div>
  `;
}

function renderSeeAlso(targets: string[]): string {
  const links = targets
    .map(
      (t) =>
        `<a href="#wiki:${encodeURIComponent(t)}" data-wiki-target="${escapeHtml(t)}" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">${escapeHtml(t)}</a>`
    )
    .join(', ');

  return `
    <div class="my-2 py-1 px-2.5 rounded bg-slate-50 dark:bg-slate-800/50 border-l-2 border-indigo-600 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 not-prose font-sans">
      <span class="text-indigo-600 font-bold">👉</span>
      <span>Ver também: ${links}</span>
    </div>
  `;
}

function renderCitationNeeded(): string {
  return `<sup class="inline-block ml-0.5 not-prose"><span title="Esta afirmação carece de fontes confiáveis" class="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.2 rounded border border-amber-300 dark:border-amber-700/80 font-serif italic text-[10px] cursor-help font-bold">[carece de fontes]</span></sup>`;
}

function renderDisambig(content?: string): string {
  const desc = content ? `: ${content.trim()}` : '';
  return `
    <div class="my-3 p-3 rounded-lg border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 text-xs flex items-center gap-2 shadow-xs not-prose font-sans">
      <span class="text-purple-600 dark:text-purple-400 text-base font-bold flex-shrink-0">🔀</span>
      <div class="flex-1"><strong>Página de Desambiguação${escapeHtml(desc)}:</strong> Esta página lista verbetes e artigos associados a títulos idênticos ou semelhantes.</div>
    </div>
  `;
}

function renderCitationTemplate(content: string): string {
  // Parses {{Citar web|...}}, {{Citar livro|...}}, {{Citar jornal|...}}
  const params: Record<string, string> = {};
  const parts = content.split('|');

  for (let i = 1; i < parts.length; i++) {
    const pair = parts[i].split('=');
    if (pair.length >= 2) {
      params[pair[0].trim().toLowerCase()] = pair.slice(1).join('=').trim();
    }
  }

  const autor = params.autor || params.author || '';
  const titulo = params.titulo || params.title || 'Referência';
  const url = params.url || '';
  const data = params.data || params.date || '';
  const ano = params.ano || params.year || '';
  const acessodata = params.acessodata || params.access_date || '';
  const editora = params.editora || params.publisher || '';
  const site = params.site || params.website || params.obra || params.work || '';
  const jornal = params.jornal || params.journal || params.revista || '';
  const paginas = params.paginas || params.pages || params.pagina || params.page || '';
  const isbn = params.isbn || '';

  const authorPart = autor ? `<strong>${escapeHtml(autor)}</strong>. ` : '';
  const titlePart = url
    ? `<a href="${formatExternalUrl(url)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">“${escapeHtml(titulo)}”</a>. `
    : `“${escapeHtml(titulo)}”. `;
  const venue = jornal || site || editora;
  const venuePart = venue ? `<em>${escapeHtml(venue)}</em>. ` : '';
  const pagesPart = paginas ? `p. ${escapeHtml(paginas)}. ` : '';
  const dateVal = data || ano;
  const datePart = dateVal ? `Publicado em ${escapeHtml(dateVal)}. ` : '';
  const isbnPart = isbn ? `<span class="text-slate-500 font-mono text-[10px]">ISBN ${escapeHtml(isbn)}. </span>` : '';
  const accessPart = acessodata ? `<span class="text-slate-400 text-[10px]">Acesso em ${escapeHtml(acessodata)}.</span>` : '';

  return `<span class="wiki-citation font-sans text-xs">${authorPart}${titlePart}${venuePart}${pagesPart}${datePart}${isbnPart}${accessPart}</span>`;
}

function renderCollapsibleTemplate(content: string, inlineMap?: Map<string, string>): string {
  return `
    <details class="wiki-collapsible my-3 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden not-prose group bg-white dark:bg-slate-900 shadow-xs">
      <summary class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 cursor-pointer font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between transition select-none">
        <span>Detalhes Adicionais</span>
        <span class="text-[10px] text-slate-400 font-mono group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div class="p-3.5 text-xs border-t border-slate-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
        ${formatInline(content.trim(), inlineMap)}
      </div>
    </details>
  `;
}

function renderGenericBadge(name: string, params: string[]): string {
  const label = params.length > 0 ? `${name}: ${params.join(', ')}` : name;
  return `<span class="inline-block px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono border border-slate-200 dark:border-slate-700 uppercase">${escapeHtml(label)}</span>`;
}

function renderReferencesSection(refs: string[], inlineMap?: Map<string, string>): string {
  if (refs.length === 0) return '';

  const items = refs
    .map(
      (ref, idx) => `
      <li id="cite_note-${idx + 1}" class="text-xs text-slate-600 dark:text-slate-400 leading-normal flex items-start gap-2 py-0.5">
        <a href="#cite_ref-${idx + 1}" class="text-blue-600 dark:text-blue-400 font-mono hover:underline flex-shrink-0 font-bold" title="Voltar ao texto">^</a>
        <span class="font-mono text-slate-400 text-[10px]">[${idx + 1}]</span>
        <div class="flex-1 font-sans">${formatInline(ref, inlineMap)}</div>
      </li>
    `
    )
    .join('');

  return `
    <div class="references-section not-prose mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-2 flex items-center gap-1.5">
        <span>📚 Fontes e Referências</span>
        <span class="text-[10px] text-slate-400 font-normal">(${refs.length})</span>
      </h3>
      <ol class="space-y-1 list-none pl-0">
        ${items}
      </ol>
    </div>
  `;
}

export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function getCleanExcerpt(wikitext: string, maxLength: number = 120): string {
  if (!wikitext) return '';
  let clean = wikitext
    .replace(/<ref[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[\s\S]*?\/>/gi, '')
    .replace(/\{\{[\s\S]*?\}\}/g, '')
    .replace(/\[\[(?:Ficheiro|Arquivo|Imagem|File|Image):[\s\S]*?\]\]/gi, '')
    .replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (_m, p1, p2) => p2 || p1)
    .replace(/\[https?:\/\/[^\s\]]+\s*([^\]]*)\]/g, '$1')
    .replace(/^[=\#\*>\-\|\+\!\;:]+/gm, '')
    .replace(/['`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + '...';
}

