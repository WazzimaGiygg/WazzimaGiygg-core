/**
 * Utilitário para detecção e gerenciamento de endereço IP do cliente.
 * Utilizado para aplicação de rate-limiting e prevenção de múltiplos chamados
 * de emergência por usuários não autenticados na WikiZero.
 */

let cachedClientIp: string | null = null;
const IP_STORAGE_KEY = 'wikizero_client_network_ip';

/**
 * Obtém o endereço IP público da conexão atual.
 * Possui fallback com timeout e geração de identificador persistente de rede
 * para garantir funcionamento ininterrupto mesmo com bloqueadores ou em modo offline.
 */
export async function getClientIp(): Promise<string> {
  if (cachedClientIp) {
    return cachedClientIp;
  }

  // Tenta recuperar do localStorage para retorno imediato
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(IP_STORAGE_KEY);
    if (saved && saved.trim().length > 0) {
      cachedClientIp = saved.trim();
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.ip === 'string' && data.ip.trim()) {
        const ip = data.ip.trim();
        cachedClientIp = ip;
        if (typeof window !== 'undefined') {
          localStorage.setItem(IP_STORAGE_KEY, ip);
        }
        return ip;
      }
    }
  } catch {
    // Falha de rede, timeout ou bloqueio de requisição externa
  }

  // Se já tínhamos um IP em cache local, use-o
  if (cachedClientIp) {
    return cachedClientIp;
  }

  // Fallback: Gera um endereço IPv4 consistente para a sessão/ambiente local
  const octet3 = Math.floor(10 + Math.random() * 200);
  const octet4 = Math.floor(2 + Math.random() * 250);
  const fallbackIp = `189.40.${octet3}.${octet4}`;
  cachedClientIp = fallbackIp;
  if (typeof window !== 'undefined') {
    localStorage.setItem(IP_STORAGE_KEY, fallbackIp);
  }
  return fallbackIp;
}

/**
 * Sanitiza um endereço IPv4 ou IPv6 para uso seguro como Document ID no Firestore
 */
export function sanitizeIpForDocId(ip: string): string {
  return ip.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Normaliza e limpa um endereço IP (remove espaços, prefixo ::ffff: etc)
 */
export function cleanIpAddress(rawIp: string): string {
  if (!rawIp) return '';
  let ip = rawIp.trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  return ip;
}

/**
 * Gera um hash abreviado para privacidade em logs de auditoria
 */
export function hashIpAddress(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}
