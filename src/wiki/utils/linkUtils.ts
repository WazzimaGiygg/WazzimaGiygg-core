/**
 * @file linkUtils.ts
 * @description Sistema de manipulação e redirecionamento de links externos do WikiZero (Update 3.05).
 */

import { ExtensionManager } from '../core/ExtensionManager';

export const DEFAULT_EXTERNAL_REDIRECT_PREFIX = 'https://wazzimagiygg.com/rv/?uid=';
export const EXTERNAL_REDIRECT_PREFIX = DEFAULT_EXTERNAL_REDIRECT_PREFIX;
export const DEFAULT_SUPPORT_TICKETS_URL = 'https://support.wazzimagiygg.com/';

/**
 * Retorna o prefixo ativo de redirecionamento de links externos baseado na extensão ExternalLinkRedirectorExtension (3.05.3.c).
 * Retorna string vazia caso a extensão esteja desativada ou configurada para bypass.
 */
export function getActiveExternalRedirectPrefix(): string {
  try {
    const extManager = ExtensionManager.getInstance();
    if (!extManager.isExtensionEnabled('ExternalLinkRedirectorExtension')) {
      return '';
    }
    const settings = extManager.getExtensionSettings('ExternalLinkRedirectorExtension');
    if (settings.enableRedirector === false) {
      return '';
    }
    return settings.redirectorBaseUrl || DEFAULT_EXTERNAL_REDIRECT_PREFIX;
  } catch {
    return DEFAULT_EXTERNAL_REDIRECT_PREFIX;
  }
}

/**
 * Retorna a URL oficial de suporte e tickets baseada na extensão SupportTicketsExtension (3.05.3.b).
 */
export function getSupportTicketsUrl(): string {
  try {
    const extManager = ExtensionManager.getInstance();
    if (!extManager.isExtensionEnabled('SupportTicketsExtension')) {
      return '';
    }
    const settings = extManager.getExtensionSettings('SupportTicketsExtension');
    return settings.supportUrl || DEFAULT_SUPPORT_TICKETS_URL;
  } catch {
    return DEFAULT_SUPPORT_TICKETS_URL;
  }
}

/**
 * Retorna se a opção de Suporte & Tickets está ativada.
 */
export function isSupportTicketsEnabled(): boolean {
  try {
    const extManager = ExtensionManager.getInstance();
    return extManager.isExtensionEnabled('SupportTicketsExtension');
  } catch {
    return true;
  }
}

/**
 * Retorna o texto do botão de suporte configurado.
 */
export function getSupportTicketsButtonLabel(): string {
  try {
    const extManager = ExtensionManager.getInstance();
    const settings = extManager.getExtensionSettings('SupportTicketsExtension');
    return settings.buttonLabel || 'Suporte & Tickets';
  } catch {
    return 'Suporte & Tickets';
  }
}

/**
 * Aplica o sistema de redirecionamento inserindo o prefixo especificado antes de qualquer link externo.
 * - Mantém intactas âncoras internas (#), rotas relativas (/), links de wiki e protocolos como mailto/tel.
 * - Se a extensão ExternalLinkRedirectorExtension estiver desativada, retorna o link limpo sem prefixo.
 * - Evita duplicação caso a URL já contenha o prefixo de redirecionamento configurado.
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

  const prefix = getActiveExternalRedirectPrefix();

  // Caso o redirecionador esteja desativado (Regra 3.05.3.c: desativar o redirecionador)
  if (!prefix) {
    if (trimmed.startsWith(DEFAULT_EXTERNAL_REDIRECT_PREFIX)) {
      return trimmed.slice(DEFAULT_EXTERNAL_REDIRECT_PREFIX.length);
    }
    return trimmed;
  }

  // Se já possui o prefixo ativo atual, não duplica
  if (trimmed.startsWith(prefix)) {
    return trimmed;
  }

  // Se possuía o prefixo padrão legado mas o prefixo customizado foi alterado
  if (trimmed.startsWith(DEFAULT_EXTERNAL_REDIRECT_PREFIX)) {
    const target = trimmed.slice(DEFAULT_EXTERNAL_REDIRECT_PREFIX.length);
    return `${prefix}${target}`;
  }

  // Se for uma URL com protocolo HTTP / HTTPS
  if (/^https?:\/\//i.test(trimmed)) {
    return `${prefix}${trimmed}`;
  }

  // Se for um endereço de domínio sem protocolo (ex: www.google.com ou wikipedia.org/wiki/...)
  if (/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/.*)?$/i.test(trimmed)) {
    return `${prefix}https://${trimmed}`;
  }

  return trimmed;
}
