/**
 * Utilitário de Segurança: Detecção e Bloqueio de IP da Wikimedia Foundation (AS14907)
 *
 * Bloqueia tentativas de autenticação/login originadas de faixas de IP pertencentes
 * à Wikimedia Foundation para isolamento editorial e prevenção de conflitos.
 */

import { getClientIp } from './ipUtils';

export interface WikimediaIpCheckResult {
  isWikimedia: boolean;
  ip: string;
  matchedRange?: string;
  asn?: string;
  org?: string;
  reason?: string;
  isSimulated?: boolean;
}

// Chave para simulação em desenvolvimento/testes
export const WIKIMEDIA_SIMULATION_KEY = 'wikizero_simulate_wikimedia_ip';

/**
 * Faixas CIDR IPv4 oficiais da Wikimedia Foundation (AS14907)
 * Fonte: Wikimedia Netbox / RIPE / ARIN / APNIC
 */
export const WIKIMEDIA_IPV4_CIDRS = [
  '185.15.56.0/22',   // RIPE (185.15.56.0 - 185.15.59.255, includes Cloud VPS & cache)
  '91.198.174.0/24',  // RIPE (91.198.174.0 - 91.198.174.255)
  '195.200.68.0/24',  // RIPE (195.200.68.0 - 195.200.68.255)
  '193.46.90.0/24',   // RIPE (193.46.90.0 - 193.46.90.255)
  '198.35.26.0/23',   // ARIN (198.35.26.0 - 198.35.27.255)
  '208.80.152.0/22',  // ARIN (208.80.152.0 - 208.80.155.255, core eqiad/codfw datacenters)
  '103.102.166.0/24', // APNIC (103.102.166.0 - 103.102.166.255)
  '185.71.138.0/24',  // RIPE (185.71.138.0 - 185.71.138.255)
];

/**
 * Faixas CIDR IPv6 oficiais da Wikimedia Foundation (AS14907)
 */
export const WIKIMEDIA_IPV6_CIDRS = [
  '2a02:ec80::/29',
  '2620:0:860::/46',
  '2001:df2:e500::/48',
];

/**
 * Converte um endereço IPv4 em um inteiro sem sinal de 32 bits
 */
function ipv4ToNumber(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;

  let num = 0;
  for (let i = 0; i < 4; i++) {
    const octet = parseInt(parts[i], 10);
    if (isNaN(octet) || octet < 0 || octet > 255) return null;
    num = (num << 8) + octet;
  }
  return num >>> 0;
}

/**
 * Verifica se um endereço IPv4 pertence a uma faixa CIDR (ex: '208.80.152.0/22')
 */
export function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [rangeIp, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

  const ipNum = ipv4ToNumber(ip);
  const rangeNum = ipv4ToNumber(rangeIp);
  if (ipNum === null || rangeNum === null) return false;

  if (prefix === 0) return true;
  const mask = (~0 << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Normaliza e expande um endereço IPv6 para BigInt
 */
function ipv6ToBigInt(ip: string): bigint | null {
  try {
    let cleanIp = ip.trim().toLowerCase();
    // Tratar mapeamento IPv4 em IPv6 (ex: ::ffff:192.0.2.1)
    if (cleanIp.includes('.')) {
      const lastColon = cleanIp.lastIndexOf(':');
      if (lastColon !== -1) {
        const v4Part = cleanIp.slice(lastColon + 1);
        const v4Num = ipv4ToNumber(v4Part);
        if (v4Num === null) return null;
        const hexV4 = v4Num.toString(16).padStart(8, '0');
        cleanIp = `${cleanIp.slice(0, lastColon)}:${hexV4.slice(0, 4)}:${hexV4.slice(4)}`;
      }
    }

    const halves = cleanIp.split('::');
    let groups: string[] = [];

    if (halves.length === 2) {
      const left = halves[0] ? halves[0].split(':') : [];
      const right = halves[1] ? halves[1].split(':') : [];
      const missing = 8 - (left.length + right.length);
      if (missing < 0) return null;
      const middle = new Array(missing).fill('0');
      groups = [...left, ...middle, ...right];
    } else if (halves.length === 1) {
      groups = cleanIp.split(':');
      if (groups.length !== 8) return null;
    } else {
      return null;
    }

    let result = 0n;
    for (const g of groups) {
      const val = BigInt(parseInt(g || '0', 16));
      result = (result << 16n) + val;
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Verifica se um endereço IPv6 pertence a uma faixa CIDR (ex: '2620:0:860::/46')
 */
export function isIpv6InCidr(ip: string, cidr: string): boolean {
  try {
    const [rangeIp, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 128) return false;

    const ipBig = ipv6ToBigInt(ip);
    const rangeBig = ipv6ToBigInt(rangeIp);
    if (ipBig === null || rangeBig === null) return false;

    if (prefix === 0) return true;
    const totalBits = 128n;
    const prefixBig = BigInt(prefix);
    const shift = totalBits - prefixBig;
    return (ipBig >> shift) === (rangeBig >> shift);
  } catch {
    return false;
  }
}

/**
 * Limpa o IP de portas ou notações adicionais
 */
export function cleanIpAddress(rawIp: string): string {
  let ip = rawIp.trim();
  // Se for IPv6 entre colchetes [2620:0:860::]:8080
  if (ip.startsWith('[') && ip.includes(']')) {
    ip = ip.slice(1, ip.indexOf(']'));
  } else if (ip.includes(':') && ip.indexOf(':') === ip.lastIndexOf(':') && ip.includes('.')) {
    // IPv4 com porta: 198.35.26.96:8080
    ip = ip.split(':')[0];
  }
  // Mapeado ::ffff:198.35.26.96
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  return ip;
}

/**
 * Avalia se um endereço IP pertence comprovadamente à Wikimedia Foundation (AS14907)
 */
export function checkIfWikimediaIp(rawIp: string): WikimediaIpCheckResult {
  const ip = cleanIpAddress(rawIp);

  // 1. Checa faixas IPv4 da Wikimedia
  for (const cidr of WIKIMEDIA_IPV4_CIDRS) {
    if (isIpv4InCidr(ip, cidr)) {
      return {
        isWikimedia: true,
        ip,
        matchedRange: cidr,
        asn: 'AS14907',
        org: 'Wikimedia Foundation, Inc.',
        reason: `Endereço IP pertencente à faixa oficial da Wikimedia Foundation (${cidr}). O login está desabilitado por política de segurança comunitária.`,
      };
    }
  }

  // 2. Checa faixas IPv6 da Wikimedia
  for (const cidr of WIKIMEDIA_IPV6_CIDRS) {
    if (isIpv6InCidr(ip, cidr)) {
      return {
        isWikimedia: true,
        ip,
        matchedRange: cidr,
        asn: 'AS14907',
        org: 'Wikimedia Foundation, Inc.',
        reason: `Endereço IPv6 pertencente à faixa oficial da Wikimedia Foundation (${cidr}). O login está desabilitado por política de segurança comunitária.`,
      };
    }
  }

  return {
    isWikimedia: false,
    ip,
  };
}

/**
 * Retorna se o modo de simulação de IP da Wikimedia está ativado
 */
export function isWikimediaSimulationActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(WIKIMEDIA_SIMULATION_KEY);
    return val === 'true' || val === '208.80.154.224' || val === '91.198.174.192';
  } catch {
    return false;
  }
}

/**
 * Define ou remove o modo de simulação de IP da Wikimedia
 */
export function setWikimediaSimulation(active: boolean, testIp = '208.80.154.224') {
  if (typeof window === 'undefined') return;
  try {
    if (active) {
      localStorage.setItem(WIKIMEDIA_SIMULATION_KEY, testIp);
    } else {
      localStorage.removeItem(WIKIMEDIA_SIMULATION_KEY);
    }
  } catch {}
}

/**
 * Obtém e valida o IP atual do cliente para verificação de bloqueio no Login
 */
export async function verifyClientIpForLogin(): Promise<WikimediaIpCheckResult> {
  // 1. Verifica se há simulação ativa para testes/auditoria
  if (isWikimediaSimulationActive()) {
    const simIp =
      (typeof window !== 'undefined' && localStorage.getItem(WIKIMEDIA_SIMULATION_KEY)) ||
      '208.80.154.224';
    const effectiveSimIp = simIp === 'true' ? '208.80.154.224' : simIp;
    const result = checkIfWikimediaIp(effectiveSimIp);
    return {
      ...result,
      isSimulated: true,
      reason: `[MODO TESTE/SIMULAÇÃO] ${result.reason || 'Simulação de IP da Wikimedia Foundation ativa.'}`,
    };
  }

  // 2. Consulta API backend se disponível
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch('/api/auth/check-wikimedia-ip', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && typeof data.isWikimedia === 'boolean') {
        return {
          isWikimedia: data.isWikimedia,
          ip: data.ip || '0.0.0.0',
          matchedRange: data.matchedRange,
          asn: data.asn,
          org: data.org,
          reason: data.reason,
        };
      }
    }
  } catch {
    // API backend opcional, fallback para verificação client-side imediata
  }

  // 3. Fallback: obtém IP público do cliente e valida contra as faixas
  const clientIp = await getClientIp();
  return checkIfWikimediaIp(clientIp);
}
