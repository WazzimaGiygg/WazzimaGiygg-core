/**
 * @file linkUtils.ts
 * @description Sistema de manipulação e redirecionamento de links externos do WikiZero.
 */

export const EXTERNAL_REDIRECT_PREFIX = 'https://wazzimagiygg.com/rv/?uid=';

/**
 * Aplica o sistema de redirecionamento inserindo o prefixo especificado antes de qualquer link externo.
 * - Mantém intactas âncoras internas (#), rotas relativas (/), links de wiki e protocolos como mailto/tel.
 * - Evita duplicação caso a URL já contenha o prefixo de redirecionamento.
 *
 * @param url URL original a ser avaliada e formatada
 * @returns URL formatada com o prefixo de redirecionamento
 */
export function formatExternalUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Links internos, relativos ou âncoras
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('javascript:')
  ) {
    return trimmed;
  }

  // Se já possui o prefixo de redirecionamento, não duplica
  if (trimmed.startsWith(EXTERNAL_REDIRECT_PREFIX)) {
    return trimmed;
  }

  // Se for uma URL com protocolo HTTP / HTTPS
  if (/^https?:\/\//i.test(trimmed)) {
    return `${EXTERNAL_REDIRECT_PREFIX}${trimmed}`;
  }

  // Se for um endereço de domínio sem protocolo (ex: www.google.com ou wikipedia.org/wiki/...)
  if (/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/.*)?$/i.test(trimmed)) {
    return `${EXTERNAL_REDIRECT_PREFIX}https://${trimmed}`;
  }

  return trimmed;
}
