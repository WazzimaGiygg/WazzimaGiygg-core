/**
 * Utilitários para formatação e manipulação de texto no ecossistema WazzimaGiygg.
 */

/**
 * Remove quaisquer tags HTML e decodifica entidades, gerando texto puro
 * ideal para miniaturas, resumos de cards e buscas.
 */
export function stripHtmlToPlainText(html?: string): string {
  if (!html) return "";

  // Se executando no navegador com DOMParser disponível
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const text = doc.body.textContent || doc.body.innerText || "";
      return text.replace(/\s+/g, " ").trim();
    } catch {
      // Fallback em caso de erro no parser
    }
  }

  // Fallback robusto por Expressões Regulares
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&atilde;/gi, "ã")
    .replace(/&otilde;/gi, "õ")
    .replace(/&eacute;/gi, "é")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/\s+/g, " ")
    .trim();
}
