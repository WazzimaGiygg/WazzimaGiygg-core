import DOMPurify from 'dompurify';

/**
 * Utilitário central de sanitização de HTML contra vulnerabilidades XSS.
 * Utiliza DOMPurify com configurações estritas e seguras para renderização enciclopédica.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // Se estivermos em ambiente de navegador (window definido)
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'em', 'b', 'i', 'u', 's',
        'sub', 'sup', 'small', 'mark', 'code', 'pre', 'blockquote', 'hr', 'br',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
        'a', 'img', 'div', 'section', 'article', 'aside', 'details', 'summary',
        'figure', 'figcaption', 'abbr', 'time', 'kbd', 'var', 'samp', 'del', 'ins'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'title', 'src', 'alt', 'width', 'height',
        'class', 'id', 'name', 'align', 'colspan', 'rowspan', 'border', 'cellpadding', 'cellspacing',
        'loading', 'decoding', 'data-*', 'aria-*', 'role', 'tabindex'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ADD_ATTR: ['target', 'rel'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style']
    });
  }

  // Fallback seguro em ambientes sem DOM (ex: testes de SSR ou Node puro sem jsdom)
  // Remove tags perigosas conhecidas
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}
