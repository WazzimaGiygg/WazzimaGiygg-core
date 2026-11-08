/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NotMediaWiki Integration Data & Engine for WazzimaGiygg
 * Replicating https://github.com/WazzimaGiygg/NotMediaWiki-Beta-
 * and https://notmediawiki.wazzimagiygg.com/
 */

export interface WikiArticle {
  id: string;
  slug: string;
  title: string;
  namespace: number; // 0: Main, 1: Talk, 4: Project, 10: Template, 14: Category
  wikitext: string;
  summary: string;
  latestRevisionId: string;
  createdAt: string;
  updatedAt: string;
  categories: string[];
  views: number;
  isProtected?: boolean;
}

export interface WikiRevision {
  id: string;
  articleSlug: string;
  parentRevisionId: string | null;
  wikitext: string;
  comment: string;
  author: {
    id: string;
    name: string;
    isBot: boolean;
    ip?: string;
  };
  timestamp: string;
  sha256: string;
  byteSize: number;
  isMinor: boolean;
}

export interface WikiUserSession {
  id: string;
  username: string;
  role: 'sysop' | 'bureaucrat' | 'moderator' | 'editor' | 'reader' | 'bot';
  editCount: number;
  avatar: string;
  email?: string;
  isGoogleUser?: boolean;
  isBanned?: boolean;
}

export interface WikiEvent {
  id: string;
  meta: {
    uri: string;
    request_id: string;
    id: string;
    dt: string;
    domain: string;
    stream: string;
  };
  database: string;
  page_title: string;
  page_namespace: number;
  rev_id: string;
  rev_timestamp: string;
  rev_sha1: string;
  rev_minor_edit: boolean;
  rev_len: number;
  user_text: string;
  comment: string;
  type: 'edit' | 'new' | 'rollback' | 'categorize' | 'protect';
  timestamp?: string;
}

export interface WikiExtension {
  id: string;
  name: string;
  namePt: string;
  version: string;
  category: 'parser' | 'ui' | 'security' | 'api' | 'bot' | 'portal';
  author: string;
  description: string;
  enabled: boolean;
  type: 'extension' | 'skin';
  url: string;
}

export interface TocItem {
  id: string;
  level: number;
  text: string;
  number: string;
}

export interface ParseResult {
  html: string;
  toc: TocItem[];
  categories: string[];
  internalLinks: string[];
  externalLinks: string[];
  references: string[];
  parseTimeMs: number;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumberOld?: number;
  lineNumberNew?: number;
}

export interface DiffResult {
  fromRevId: string;
  toRevId: string;
  lines: DiffLine[];
  stats: {
    added: number;
    removed: number;
    unchanged: number;
    byteDelta: number;
  };
}

// ============================================================================
// INITIAL SEED ARTICLES FROM NotMediaWiki-Beta-
// ============================================================================
export const SEED_WIKI_ARTICLES: WikiArticle[] = [];

export const SEED_WIKI_REVISIONS: WikiRevision[] = [];

export const SEED_WIKI_EVENTS: WikiEvent[] = [];

export const SEED_WIKI_EXTENSIONS: WikiExtension[] = [
  {
    id: 'ext-cite',
    name: 'Cite',
    namePt: 'Cite (Citações & Notas de Rodapé)',
    version: '2.4.0',
    category: 'parser',
    author: 'Aeneas Rekkas, Brion Vibber, NotMediaWiki Core',
    description: 'Adiciona tags <ref> e <references>, gerando notas de rodapé numeradas com backlinks dinâmicos e navegação suave.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:Cite'
  },
  {
    id: 'ext-parsoid',
    name: 'Parsoid AST Service',
    namePt: 'Compilador Parsoid AST',
    version: '1.0.0-beta',
    category: 'parser',
    author: 'Wikimedia Architecture Team & WazzimaGiygg',
    description: 'Compilador bidirecional de Wikitexto para HTML5 semântico com análise sintática e geração de AST.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Parsoid'
  },
  {
    id: 'ext-eventstreams',
    name: 'EventStreams',
    namePt: 'EventStreams em Tempo Real',
    version: '1.3.0',
    category: 'api',
    author: 'Wikimedia Foundation Engineering',
    description: 'Transmissão em tempo real de mudanças recentes no acervo via Server-Sent Events (SSE).',
    enabled: true,
    type: 'extension',
    url: 'https://wikitech.wikimedia.org/wiki/Event_Platform/EventStreams'
  },
  {
    id: 'ext-centralauth',
    name: 'CentralAuth',
    namePt: 'Autenticação Global CentralAuth',
    version: '3.1.0',
    category: 'security',
    author: 'Brion Vibber, Tim Starling',
    description: 'Gerenciamento unificado de sessões e papéis (Burocrata, Sysop, Editor) com Firebase Auth e Zero-Trust.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:CentralAuth'
  },
  {
    id: 'ext-checkuser',
    name: 'CheckUser Universal',
    namePt: 'CheckUser Forense & Governança',
    version: '2.8.0',
    category: 'security',
    author: 'Tim Starling, Aaron Schulz',
    description: 'Ferramenta de auditoria de conexões, IPs, user-agents e investigação contra abusos e evasão de bloqueio.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:CheckUser'
  },
  {
    id: 'ext-wazzimagiygg-portals',
    name: 'WazzimaGiygg Portals',
    namePt: 'Portais Integrados WazzimaGiygg',
    version: '2.0.0',
    category: 'portal',
    author: 'WazzimaGiygg Digital Group',
    description: 'Conecta o NotMediaWiki diretamente ao jornal WazzimaGiygg, WikiWorldWeb, Acadêmico e Ouvidoria.',
    enabled: true,
    type: 'extension',
    url: 'https://wazzimagiygg.com'
  }
];

// ============================================================================
// PARSOID WIKITEXT PARSER (Pure TypeScript Engine)
// ============================================================================
export function parseWikitextToHtml(wikitext: string, pageTitle: string = 'Artigo'): ParseResult {
  const startTime = performance.now();
  const categories: string[] = [];
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  const references: string[] = [];
  const toc: TocItem[] = [];

  let text = wikitext;

  // 1. Extract Categories: [[Category:Foo]]
  text = text.replace(/\[\[Category:([^\]]+)\]\]/gi, (_, cat) => {
    const cleanCat = cat.trim();
    if (!categories.includes(cleanCat)) {
      categories.push(cleanCat);
    }
    return '';
  });

  // 2. Extract Infobox: {{Infobox ... }}
  text = text.replace(/\{\{Infobox\s+([^\n|]+)([\s\S]*?)\}\}/gi, (_, type, body) => {
    const lines = body.split('\n');
    let rowsHtml = '';
    let title = type.trim();

    for (const line of lines) {
      const match = line.match(/^\s*\|\s*([^=]+?)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        if (key.toLowerCase() === 'name') {
          title = val;
        } else if (val) {
          const formattedVal = val.replace(
            /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
            (_: string, target: string, label?: string) => label || target
          );
          rowsHtml += `
            <tr class="border-b border-stone-200">
              <th class="py-1 px-2.5 text-left text-xs font-bold text-stone-700 bg-stone-100 uppercase tracking-wider">${key.replace(/_/g, ' ')}</th>
              <td class="py-1 px-2.5 text-xs text-stone-900">${formattedVal}</td>
            </tr>
          `;
        }
      }
    }

    return `
      <div class="wiki-infobox float-right sm:w-80 ml-6 mb-6 bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-stone-900 overflow-hidden font-sans">
        <div class="bg-[#141414] text-white p-2.5 text-center font-bold font-editorial text-sm tracking-wide">
          ${title}
        </div>
        <table class="w-full text-xs border-collapse">
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  });

  // 3. Extract <ref> tags
  let refCount = 1;
  const namedRefs = new Map<string, number>();

  text = text.replace(/<ref(?:\s+name="([^"]+)")?>([\s\S]*?)<\/ref>/gi, (_, name, content) => {
    let index: number;
    if (name && namedRefs.has(name)) {
      index = namedRefs.get(name)!;
    } else {
      index = refCount++;
      if (name) namedRefs.set(name, index);
      references.push(content.trim());
    }
    return `<sup class="wiki-ref cursor-pointer font-bold text-blue-700 hover:text-red-700" title="Citação ${index}"><a href="#cite_note-${index}">[${index}]</a></sup>`;
  });

  // 4. Headings & Table of Contents (TOC)
  // === Heading 3 ===
  text = text.replace(/===([^=]+)===/g, (_, h) => {
    const title = h.trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    toc.push({ id, level: 3, text: title, number: `${toc.length + 1}` });
    return `<h3 id="${id}" class="text-lg font-bold font-editorial text-stone-950 mt-6 mb-2 border-b border-stone-200 pb-1 scroll-mt-20">${title}</h3>`;
  });

  // == Heading 2 ==
  text = text.replace(/==([^=]+)==/g, (_, h) => {
    const title = h.trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    toc.push({ id, level: 2, text: title, number: `${toc.length + 1}` });
    return `<h2 id="${id}" class="text-xl sm:text-2xl font-bold font-editorial text-stone-950 mt-8 mb-3 border-b-2 border-[#141414] pb-1.5 scroll-mt-20">${title}</h2>`;
  });

  // = Heading 1 =
  text = text.replace(/^=([^=]+)=$/gm, (_, h) => {
    const title = h.trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    toc.push({ id, level: 1, text: title, number: `${toc.length + 1}` });
    return `<h1 id="${id}" class="text-2xl sm:text-3xl font-bold font-editorial text-stone-950 mt-8 mb-4 border-b-2 border-red-700 pb-2 scroll-mt-20">${title}</h1>`;
  });

  // 5. Bold & Italics
  text = text.replace(/'''''([^']+)'''''/g, '<strong><em>$1</em></strong>');
  text = text.replace(/'''([^']+)'''/g, '<strong>$1</strong>');
  text = text.replace(/''([^']+)''/g, '<em>$1</em>');

  // 6. Internal Wiki Links [[Article]] or [[Article|Label]]
  text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
    const linkTarget = target.trim();
    const linkLabel = (label || target).trim();
    internalLinks.push(linkTarget);
    return `<a href="#wiki/${linkTarget.replace(/\s+/g, '_')}" data-wikilink="${linkTarget}" class="wiki-internal-link text-blue-800 hover:text-red-700 underline font-semibold transition-colors">${linkLabel}</a>`;
  });

  // 7. External Links [http://url Label]
  text = text.replace(/\[(https?:\/\/[^\s]+)\s+([^\]]+)\]/g, (_, url, label) => {
    externalLinks.push(url);
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="wiki-external-link text-blue-700 hover:text-red-700 underline">${label} ↗</a>`;
  });

  // 8. Tables {| class="wikitable" ... |}
  text = text.replace(/\{\| class="wikitable"([\s\S]*?)\|\}/gi, (_, tableContent) => {
    const rows = tableContent.split('|-');
    let htmlTable = '<div class="overflow-x-auto my-6"><table class="w-full text-xs font-mono border-collapse border-2 border-[#141414] bg-white">';
    
    rows.forEach((row: string, rIdx: number) => {
      const cleanRow = row.trim();
      if (!cleanRow) return;

      // Header row
      if (cleanRow.includes('!')) {
        const headers = cleanRow.split('!!').map((h: string) => h.replace(/^[!|\s]+/, '').trim());
        htmlTable += '<tr class="bg-[#141414] text-white">';
        headers.forEach((h: string) => {
          if (h) htmlTable += `<th class="p-2.5 text-left border border-stone-700 font-bold uppercase tracking-wider">${h}</th>`;
        });
        htmlTable += '</tr>';
      } else {
        // Data row
        const cells = cleanRow.split('||').map((c: string) => c.replace(/^[|\s]+/, '').trim());
        htmlTable += `<tr class="${rIdx % 2 === 0 ? 'bg-stone-50' : 'bg-white'} hover:bg-amber-50">`;
        cells.forEach((c: string) => {
          if (c) htmlTable += `<td class="p-2.5 border border-stone-300 text-stone-800">${c}</td>`;
        });
        htmlTable += '</tr>';
      }
    });

    htmlTable += '</table></div>';
    return htmlTable;
  });

  // 9. Lists (* bullet, # numbered, : indent)
  text = text.replace(/^\* (.*)$/gm, '<li class="ml-5 list-disc text-stone-800">$1</li>');
  text = text.replace(/^# (.*)$/gm, '<li class="ml-5 list-decimal text-stone-800">$1</li>');
  text = text.replace(/^: (.*)$/gm, '<div class="ml-6 pl-3 border-l-2 border-stone-300 text-stone-700 my-1 font-serif italic">$1</div>');
  text = text.replace(/:: (.*)$/gm, '<div class="ml-12 pl-3 border-l-2 border-stone-400 text-stone-700 my-1 font-serif italic">$1</div>');

  // Wrap lists
  text = text.replace(/(<li class="ml-5 list-disc[^>]*>.*<\/li>)+/g, '<ul class="my-3 space-y-1">$&</ul>');
  text = text.replace(/(<li class="ml-5 list-decimal[^>]*>.*<\/li>)+/g, '<ol class="my-3 space-y-1">$&</ol>');

  // 10. Footnotes / References List (<references />)
  let refListHtml = '';
  if (references.length > 0) {
    refListHtml = `
      <div class="wiki-references mt-8 pt-4 border-t-2 border-stone-300 font-mono text-xs">
        <h4 class="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-3">Notas de Rodapé & Citações:</h4>
        <ol class="space-y-1.5 list-decimal list-inside text-stone-700">
          ${references
            .map(
              (ref, i) => `
            <li id="cite_note-${i + 1}" class="hover:bg-amber-50 p-1">
              <a href="#cite_ref-${i + 1}" class="text-blue-700 font-bold mr-1">↑</a>
              <span>${ref.replace(/\[(https?:\/\/[^\s]+)\s+([^\]]+)\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-blue-700">$2 ↗</a>')}</span>
            </li>
          `
            )
            .join('')}
        </ol>
      </div>
    `;
  }

  text = text.replace(/<references\s*\/?>/gi, refListHtml);

  // 11. Wrap plain paragraphs
  const paragraphs = text.split(/\n\s*\n/).map((para) => {
    const trimmed = para.trim();
    if (
      !trimmed ||
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<div') ||
      trimmed.startsWith('<table') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol')
    ) {
      return trimmed;
    }
    return `<p class="leading-relaxed font-serif text-stone-900 text-base mb-4">${trimmed}</p>`;
  });

  const parseTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

  return {
    html: paragraphs.join('\n'),
    toc,
    categories,
    internalLinks,
    externalLinks,
    references,
    parseTimeMs
  };
}

// ============================================================================
// MYERS DIFF ALGORITHM (Line-by-line Revision Difference)
// ============================================================================
export function computeWikitextDiff(oldText: string, newText: string, fromRevId: string, toRevId: string): DiffResult {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const diffLines: DiffLine[] = [];

  let oIdx = 0;
  let nIdx = 0;
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  while (oIdx < oldLines.length && nIdx < newLines.length) {
    if (oldLines[oIdx] === newLines[nIdx]) {
      diffLines.push({
        type: 'unchanged',
        content: oldLines[oIdx],
        lineNumberOld: oIdx + 1,
        lineNumberNew: nIdx + 1
      });
      unchangedCount++;
      oIdx++;
      nIdx++;
    } else {
      let matchInNew = -1;
      let matchInOld = -1;

      for (let i = nIdx + 1; i < Math.min(nIdx + 15, newLines.length); i++) {
        if (newLines[i] === oldLines[oIdx]) {
          matchInNew = i;
          break;
        }
      }

      for (let j = oIdx + 1; j < Math.min(oIdx + 15, oldLines.length); j++) {
        if (oldLines[j] === newLines[nIdx]) {
          matchInOld = j;
          break;
        }
      }

      if (matchInNew !== -1 && (matchInOld === -1 || matchInNew - nIdx <= matchInOld - oIdx)) {
        while (nIdx < matchInNew) {
          diffLines.push({
            type: 'added',
            content: newLines[nIdx],
            lineNumberNew: nIdx + 1
          });
          addedCount++;
          nIdx++;
        }
      } else if (matchInOld !== -1) {
        while (oIdx < matchInOld) {
          diffLines.push({
            type: 'removed',
            content: oldLines[oIdx],
            lineNumberOld: oIdx + 1
          });
          removedCount++;
          oIdx++;
        }
      } else {
        diffLines.push({
          type: 'removed',
          content: oldLines[oIdx],
          lineNumberOld: oIdx + 1
        });
        diffLines.push({
          type: 'added',
          content: newLines[nIdx],
          lineNumberNew: nIdx + 1
        });
        removedCount++;
        addedCount++;
        oIdx++;
        nIdx++;
      }
    }
  }

  while (oIdx < oldLines.length) {
    diffLines.push({
      type: 'removed',
      content: oldLines[oIdx],
      lineNumberOld: oIdx + 1
    });
    removedCount++;
    oIdx++;
  }

  while (nIdx < newLines.length) {
    diffLines.push({
      type: 'added',
      content: newLines[nIdx],
      lineNumberNew: nIdx + 1
    });
    addedCount++;
    nIdx++;
  }

  return {
    fromRevId,
    toRevId,
    lines: diffLines,
    stats: {
      added: addedCount,
      removed: removedCount,
      unchanged: unchangedCount,
      byteDelta: newText.length - oldText.length
    }
  };
}
