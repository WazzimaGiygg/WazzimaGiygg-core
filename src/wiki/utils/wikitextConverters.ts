/**
 * Bidirectional conversion between HTML (WYSIWYG/Formatted page) and Wikitext
 */

export function htmlToWikitext(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild;
  if (!container) return '';

  function nodeToWikitext(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // 1. If element preserves raw wikitext (infoboxes, galleries, complex blocks)
    if (el.hasAttribute('data-wikitext')) {
      const rawWikitext = el.getAttribute('data-wikitext');
      if (rawWikitext) return `\n${rawWikitext}\n\n`;
    }

    // 1b. Fallback for infobox without data-wikitext
    if (el.classList.contains('wiki-infobox')) {
      const heading = el.querySelector('.font-serif-heading')?.textContent?.trim() || 'Informações';
      const rows = Array.from(el.querySelectorAll('table tr'));
      let infoboxWikitext = `{{Infobox\n| Nome = ${heading}\n`;
      for (const r of rows) {
        const th = r.querySelector('th')?.textContent?.trim();
        const td = r.querySelector('td')?.textContent?.trim();
        if (th && td) {
          infoboxWikitext += `| ${th} = ${td}\n`;
        }
      }
      infoboxWikitext += '}}\n\n';
      return `\n${infoboxWikitext}\n`;
    }

    // 2. Headings with clean data-header-title attribute (avoids capturing auto-numbers and anchor links)
    if (el.hasAttribute('data-header-title')) {
      const headerTitle = el.getAttribute('data-header-title')!.trim();
      if (tagName === 'h1') return `\n= ${headerTitle} =\n\n`;
      if (tagName === 'h2') return `\n== ${headerTitle} ==\n\n`;
      if (tagName === 'h3') return `\n=== ${headerTitle} ===\n\n`;
      if (tagName === 'h4') return `\n==== ${headerTitle} ====\n\n`;
      if (tagName === 'h5') return `\n===== ${headerTitle} =====\n\n`;
      if (tagName === 'h6') return `\n====== ${headerTitle} ======\n\n`;
    }

    // Skip section anchor links (#)
    if (tagName === 'a' && el.getAttribute('title')?.includes('seção')) {
      return '';
    }

    // 3. Tables
    if (tagName === 'table') {
      const rows = Array.from(el.querySelectorAll('tr'));
      let mwTable = '{| class="wikitable"\n';
      const caption = el.querySelector('caption');
      if (caption) {
        mwTable += `|+ ${caption.textContent?.trim()}\n`;
      }
      for (const row of rows) {
        mwTable += '|-\n';
        const cells = Array.from(row.querySelectorAll('th, td'));
        for (const cell of cells) {
          const isHeader = cell.tagName.toLowerCase() === 'th';
          const prefix = isHeader ? '! ' : '| ';
          const cellContent = Array.from(cell.childNodes).map(nodeToWikitext).join('').trim();
          mwTable += `${prefix}${cellContent}\n`;
        }
      }
      mwTable += '|}\n\n';
      return mwTable;
    }

    const childText = Array.from(el.childNodes)
      .map((child) => nodeToWikitext(child))
      .join('');

    switch (tagName) {
      case 'h1':
        return `\n= ${childText.trim()} =\n\n`;
      case 'h2':
        return `\n== ${childText.trim()} ==\n\n`;
      case 'h3':
        return `\n=== ${childText.trim()} ===\n\n`;
      case 'h4':
        return `\n==== ${childText.trim()} ====\n\n`;
      case 'h5':
        return `\n===== ${childText.trim()} =====\n\n`;
      case 'h6':
        return `\n====== ${childText.trim()} ======\n\n`;
      case 'b':
      case 'strong':
        return `'''${childText}'''`;
      case 'i':
      case 'em':
        return `''${childText}''`;
      case 's':
      case 'strike':
      case 'del':
        return `~~${childText}~~`;
      case 'u':
        return `<u>${childText}</u>`;
      case 'small':
        return `<small>${childText}</small>`;
      case 'sub':
        return `<sub>${childText}</sub>`;
      case 'sup':
        return `<sup>${childText}</sup>`;
      case 'hr':
        return '\n----\n\n';
      case 'code':
        return `\`${childText}\``;
      case 'pre':
        return `\n\`\`\`\n${childText}\n\`\`\`\n`;
      case 'blockquote':
        return `\n> ${childText.trim()}\n\n`;
      case 'ul': {
        const items = Array.from(el.querySelectorAll(':scope > li'))
          .map((li) => `* ${Array.from(li.childNodes).map(nodeToWikitext).join('').trim()}`)
          .join('\n');
        return `\n${items}\n\n`;
      }
      case 'ol': {
        const items = Array.from(el.querySelectorAll(':scope > li'))
          .map((li) => `# ${Array.from(li.childNodes).map(nodeToWikitext).join('').trim()}`)
          .join('\n');
        return `\n${items}\n\n`;
      }
      case 'li':
        return `* ${childText}\n`;
      case 'p':
        return `\n${childText.trim()}\n\n`;
      case 'br':
        return '\n';
      case 'a': {
        const href = el.getAttribute('href') || '';
        const title = el.getAttribute('data-wiki-target') || href;
        if (title && !href.startsWith('http')) {
          return childText === title ? `[[${title}]]` : `[[${title}|${childText}]]`;
        }
        return `[${href} ${childText}]`;
      }
      case 'div':
        return `${childText}\n`;
      default:
        return childText;
    }
  }

  let result = nodeToWikitext(container);
  // Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n').trim();
  return result;
}
