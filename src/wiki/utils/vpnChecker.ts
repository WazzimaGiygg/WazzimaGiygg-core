/**
 * Utilitário de Segurança: Verificador e Bloqueador de Conexões VPN, Proxies e Tor
 *
 * Implementa detecção e bloqueio em tempo real de conexões originadas de
 * redes privadas virtuais (VPN), servidores proxy anônimos, nós de saída Tor
 * e datacenters/hosting para prevenir sockpuppets, vandalismo anônimo e evasão de sanções.
 */

import { getClientIp, cleanIpAddress } from './ipUtils';
import { isIpv4InCidr } from './wikimediaIpChecker';

export interface VpnCheckResult {
  ip: string;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isHosting: boolean;
  blocked: boolean;
  confidence: 'high' | 'medium' | 'low';
  riskScore: number; // 0 - 100
  provider?: string;
  asn?: string;
  org?: string;
  country?: string;
  city?: string;
  reverseDns?: string;
  reason?: string;
  isSimulated?: boolean;
  simulatedPreset?: string;
  checkedAt: string;
}

export interface VpnAuditEntry {
  id: string;
  timestamp: string;
  ip: string;
  provider?: string;
  reason: string;
  attemptType: 'google_login' | 'guest_login' | 'manual_check';
  riskScore: number;
  country?: string;
}

// Chaves de armazenamento local
export const VPN_SIMULATION_KEY = 'wikizero_simulate_vpn_mode';
export const VPN_SIMULATION_PRESET_KEY = 'wikizero_simulate_vpn_preset';
export const VPN_SIMULATION_CUSTOM_IP_KEY = 'wikizero_simulate_vpn_custom_ip';
export const VPN_AUDIT_STORAGE_KEY = 'wikizero_vpn_blocked_audit_logs';

/**
 * Predefinições de teste para simulação e diagnóstico rápido
 */
export interface VpnPreset {
  id: string;
  name: string;
  provider: string;
  ip: string;
  asn: string;
  type: 'vpn' | 'tor' | 'proxy' | 'hosting' | 'residential';
  country: string;
  description: string;
}

export const PRESET_VPNS: VpnPreset[] = [
  {
    id: 'nordvpn',
    name: 'NordVPN (Servidor Brasil/EUA)',
    provider: 'NordVPN / Tefincom',
    ip: '185.156.172.4',
    asn: 'AS202425',
    type: 'vpn',
    country: 'Brasil / EUA',
    description: 'Nó de saída comercial da rede NordVPN / IP Volume Inc.',
  },
  {
    id: 'mullvad',
    name: 'Mullvad VPN',
    provider: 'Mullvad VPN AB',
    ip: '193.138.218.71',
    asn: 'AS42303',
    type: 'vpn',
    country: 'Suécia',
    description: 'Nó de saída anônimo da rede Mullvad.',
  },
  {
    id: 'protonvpn',
    name: 'ProtonVPN',
    provider: 'Proton AG',
    ip: '185.159.157.10',
    asn: 'AS62371',
    type: 'vpn',
    country: 'Suíça',
    description: 'Servidor VPN de alta privacidade da Proton AG.',
  },
  {
    id: 'expressvpn',
    name: 'ExpressVPN',
    provider: 'ExpressVPN / Kape',
    ip: '185.220.101.5',
    asn: 'AS200052',
    type: 'vpn',
    country: 'Reino Unido / Ilhas Virgens',
    description: 'Servidor comercial ExpressVPN / Kape Technologies.',
  },
  {
    id: 'tor',
    name: 'Nó de Saída Tor (Tor Exit Relay)',
    provider: 'Tor Project Exit Node',
    ip: '185.220.101.1',
    asn: 'AS208294',
    type: 'tor',
    country: 'Alemanha',
    description: 'Relay público de saída da rede cebola Tor.',
  },
  {
    id: 'datacamp',
    name: 'Datacamp Ltd (Backbone VPN Global)',
    provider: 'Datacamp Limited',
    ip: '195.181.160.10',
    asn: 'AS60068',
    type: 'vpn',
    country: 'Reino Unido',
    description: 'Provedor de infraestrutura de datacenter utilizado por dezenas de VPNs.',
  },
  {
    id: 'm247',
    name: 'M247 Ltd (Backbone VPN Global)',
    provider: 'M247 Ltd',
    ip: '185.156.174.15',
    asn: 'AS9009',
    type: 'vpn',
    country: 'Romênia / Internacional',
    description: 'Maior operadora de servidores de saída para VPNs comerciais no mundo.',
  },
  {
    id: 'aws_datacenter',
    name: 'AWS Cloud (Amazon EC2 / Datacenter)',
    provider: 'Amazon Web Services',
    ip: '54.239.28.85',
    asn: 'AS16509',
    type: 'hosting',
    country: 'Estados Unidos',
    description: 'Endereço de datacenter corporativo em nuvem, não residencial.',
  },
  {
    id: 'residential_vivo',
    name: 'Conexão Residencial Vivo Fibra (Legítima)',
    provider: 'Telefônica Brasil S.A.',
    ip: '177.18.92.12',
    asn: 'AS27699',
    type: 'residential',
    country: 'Brasil (São Paulo)',
    description: 'Endereço IP residencial de banda larga fibra comum (Acesso Liberado).',
  },
  {
    id: 'residential_claro',
    name: 'Conexão Residencial Claro NET (Legítima)',
    provider: 'Claro S.A.',
    ip: '189.40.72.105',
    asn: 'AS28573',
    type: 'residential',
    country: 'Brasil (Rio de Janeiro)',
    description: 'Endereço IP residencial de banda larga a cabo comum (Acesso Liberado).',
  },
];

/**
 * ASNs conhecidos de provedores comerciais de VPN e nós de trânsito anônimo
 */
export const KNOWN_VPN_ASNS = [
  'AS9009',   // M247 Ltd (Largest VPN transit provider)
  'AS60068',  // Datacamp Limited (Major VPN backbone)
  'AS202425', // IP Volume inc / NordVPN
  'AS136787', // TEFINCOM S.A. / NordVPN
  'AS42303',  // Mullvad VPN
  'AS39351',  // 31173 Services AB / Mullvad
  'AS62371',  // Proton AG
  'AS209854', // Proton AG
  'AS35908',  // Private Internet Access
  'AS61317',  // Private Internet Access
  'AS205461', // CyberGhost / Kape Technologies
  'AS200052', // ExpressVPN
  'AS394711', // ExpressVPN
  'AS208323', // ExpressVPN
  'AS206092', // Windscribe
  'AS11878',  // Tzulo Inc (VPN / Proxy hosting)
  'AS20473',  // Choopa / Vultr / Constant.com
  'AS14061',  // DigitalOcean (VPS / Proxy nodes)
  'AS63949',  // Linode / Akamai Connected Cloud
  'AS16276',  // OVH SAS
  'AS35540',  // OVH
  'AS24940',  // Hetzner Online GmbH
  'AS16265',  // Leaseweb
  'AS28753',  // Leaseweb
  'AS59711',  // Leaseweb
  'AS46562',  // Performive / Total Server Solutions
  'AS208294', // Tor Project Exit
  'AS13335',  // Cloudflare WARP / Datacenter
  'AS15169',  // Google Cloud (Proxy/Scraper)
  'AS16509',  // Amazon AWS (Proxy/Scraper)
  'AS8075',   // Microsoft Azure
  'AS31898',  // Oracle Cloud
];

/**
 * Faixas CIDR de nós de saída VPN / Tor conhecidos
 */
export const KNOWN_VPN_CIDRS = [
  '185.156.172.0/22',
  '185.220.100.0/22', // Tor Exit nodes
  '185.220.101.0/24', // Tor Exit nodes
  '185.220.102.0/24', // Tor Exit nodes
  '176.10.99.0/24',   // Tor Exit nodes
  '193.138.218.0/24', // Mullvad
  '194.242.110.0/24', // Mullvad
  '185.213.154.0/24', // Mullvad
  '185.159.157.0/24', // Proton
  '185.159.158.0/24', // Proton
  '149.102.242.0/24', // Proton
  '185.107.56.0/24',  // Proton
  '195.181.160.0/22', // Datacamp
  '185.156.174.0/23', // M247
];

/**
 * Verifica se a simulação de VPN está ativada no navegador
 */
export function isVpnSimulationActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(VPN_SIMULATION_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Retorna o preset ou IP customizado de simulação de VPN
 */
export function getVpnSimulationConfig(): { active: boolean; presetId: string; customIp?: string } {
  if (typeof window === 'undefined') {
    return { active: false, presetId: 'nordvpn' };
  }
  try {
    const active = localStorage.getItem(VPN_SIMULATION_KEY) === 'true';
    const presetId = localStorage.getItem(VPN_SIMULATION_PRESET_KEY) || 'nordvpn';
    const customIp = localStorage.getItem(VPN_SIMULATION_CUSTOM_IP_KEY) || undefined;
    return { active, presetId, customIp };
  } catch {
    return { active: false, presetId: 'nordvpn' };
  }
}

/**
 * Ativa ou desativa a simulação de VPN para testes em tempo real
 */
export function setVpnSimulation(active: boolean, presetId = 'nordvpn', customIp?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (active) {
      localStorage.setItem(VPN_SIMULATION_KEY, 'true');
      localStorage.setItem(VPN_SIMULATION_PRESET_KEY, presetId);
      if (customIp) {
        localStorage.setItem(VPN_SIMULATION_CUSTOM_IP_KEY, customIp);
      } else {
        localStorage.removeItem(VPN_SIMULATION_CUSTOM_IP_KEY);
      }
    } else {
      localStorage.removeItem(VPN_SIMULATION_KEY);
      localStorage.removeItem(VPN_SIMULATION_PRESET_KEY);
      localStorage.removeItem(VPN_SIMULATION_CUSTOM_IP_KEY);
    }
  } catch {}
}

/**
 * Avalia um endereço IP com base nas tabelas estáticas locais de CIDR, ASN e Heurísticas
 */
export function evaluateIpLocally(ip: string, reverseDns?: string, orgHint?: string): VpnCheckResult {
  const cleanIp = cleanIpAddress(ip);

  // 1. Checa se pertence a faixas conhecidas de VPN/Tor
  for (const cidr of KNOWN_VPN_CIDRS) {
    if (isIpv4InCidr(cleanIp, cidr)) {
      const isTorRange = cidr.startsWith('185.220.');
      return {
        ip: cleanIp,
        isVpn: !isTorRange,
        isProxy: true,
        isTor: isTorRange,
        isHosting: true,
        blocked: true,
        confidence: 'high',
        riskScore: isTorRange ? 98 : 92,
        provider: isTorRange ? 'Tor Project Exit Node' : 'Provedor de VPN Comercial',
        matchedCidr: cidr,
        reverseDns,
        reason: isTorRange
          ? `Endereço IP identificado como Nó de Saída da rede Tor (${cidr}). Conexões anônimas não são permitidas para login.`
          : `Endereço IP pertencente à faixa registrada de servidor VPN comercial (${cidr}). O login está restrito para conexões com VPN.`,
        checkedAt: new Date().toISOString(),
      } as any;
    }
  }

  // 2. Checa pistas em Reverse DNS (PTR)
  if (reverseDns) {
    const rdns = reverseDns.toLowerCase();
    const vpnKeywords = ['vpn', 'tor-exit', 'proxy', 'exit-node', 'm247', 'datacamp', 'mullvad', 'nordvpn', 'proton', 'expressvpn', 'tunnel'];
    const hostingKeywords = ['hosting', 'vps', 'linode', 'digitalocean', 'hetzner', 'ovh', 'leaseweb', 'amazon', 'googleusercontent'];

    for (const kw of vpnKeywords) {
      if (rdns.includes(kw)) {
        return {
          ip: cleanIp,
          isVpn: true,
          isProxy: true,
          isTor: rdns.includes('tor'),
          isHosting: true,
          blocked: true,
          confidence: 'high',
          riskScore: 90,
          provider: `VPN/Proxy Detectado (${kw})`,
          reverseDns,
          reason: `Hostname reverso (${reverseDns}) indica infraestrutura de VPN ou Proxy Anônimo.`,
          checkedAt: new Date().toISOString(),
        };
      }
    }

    for (const kw of hostingKeywords) {
      if (rdns.includes(kw)) {
        return {
          ip: cleanIp,
          isVpn: true,
          isProxy: false,
          isTor: false,
          isHosting: true,
          blocked: true,
          confidence: 'medium',
          riskScore: 82,
          provider: `Datacenter / VPS (${kw})`,
          reverseDns,
          reason: `Conexão originada de servidor em nuvem/datacenter (${reverseDns}), incompatível com acesso residencial.`,
          checkedAt: new Date().toISOString(),
        };
      }
    }
  }

  // 3. Checa Organization Hint
  if (orgHint) {
    const org = orgHint.toLowerCase();
    for (const asn of KNOWN_VPN_ASNS) {
      if (org.includes(asn.toLowerCase())) {
        return {
          ip: cleanIp,
          isVpn: true,
          isProxy: true,
          isTor: org.includes('tor'),
          isHosting: true,
          blocked: true,
          confidence: 'high',
          riskScore: 88,
          provider: orgHint,
          reason: `Organização de rede (${orgHint}) identificada como operadora de trânsito VPN/Datacenter.`,
          checkedAt: new Date().toISOString(),
        };
      }
    }
  }

  // Se não foi identificado como VPN
  return {
    ip: cleanIp,
    isVpn: false,
    isProxy: false,
    isTor: false,
    isHosting: false,
    blocked: false,
    confidence: 'medium',
    riskScore: 8,
    provider: orgHint || 'Provedor Residencial / Telecomum',
    reverseDns,
    reason: 'Conexão direta residencial/móvel sem indícios de mascaramento por VPN.',
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Cria resultado baseado em Preset de Teste
 */
function buildPresetResult(preset: VpnPreset): VpnCheckResult {
  const isBlocked = preset.type !== 'residential';
  return {
    ip: preset.ip,
    isVpn: preset.type === 'vpn',
    isProxy: preset.type === 'proxy' || preset.type === 'vpn' || preset.type === 'tor',
    isTor: preset.type === 'tor',
    isHosting: preset.type === 'hosting' || preset.type === 'vpn' || preset.type === 'tor',
    blocked: isBlocked,
    confidence: 'high',
    riskScore: preset.type === 'tor' ? 99 : preset.type === 'vpn' ? 94 : preset.type === 'hosting' ? 84 : 5,
    provider: preset.provider,
    asn: preset.asn,
    org: preset.provider,
    country: preset.country,
    reason: isBlocked
      ? `[MODO TESTE / AUDITORIA] Conexão simulada com ${preset.name}. O login com esta origem está bloqueado pelas políticas da WikiWorldWeb.`
      : `[MODO TESTE] Conexão residencial simulada (${preset.name}). Login permitido.`,
    isSimulated: true,
    simulatedPreset: preset.id,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Verifica a conexão VPN do cliente atual com fallback inteligente
 */
export async function checkClientVpnConnection(forceRefresh = false): Promise<VpnCheckResult> {
  // 1. Verifica se há simulação ativa de VPN
  const sim = getVpnSimulationConfig();
  if (sim.active) {
    if (sim.customIp) {
      const customRes = evaluateIpLocally(sim.customIp);
      return {
        ...customRes,
        isSimulated: true,
        reason: `[MODO TESTE: IP PERSONALIZADO] ${customRes.reason}`,
      };
    }
    const preset = PRESET_VPNS.find((p) => p.id === sim.presetId) || PRESET_VPNS[0];
    return buildPresetResult(preset);
  }

  // 2. Tenta consultar a API de segurança no backend do servidor
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3200);
    const resp = await fetch('/api/security/check-vpn', {
      signal: controller.signal,
      headers: {
        'Cache-Control': forceRefresh ? 'no-cache' : 'default',
      },
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && typeof data.ip === 'string') {
        return {
          ip: data.ip,
          isVpn: !!data.isVpn,
          isProxy: !!data.isProxy,
          isTor: !!data.isTor,
          isHosting: !!data.isHosting,
          blocked: !!data.blocked,
          confidence: data.confidence || 'medium',
          riskScore: typeof data.riskScore === 'number' ? data.riskScore : (data.blocked ? 90 : 10),
          provider: data.provider || data.org,
          asn: data.asn,
          org: data.org,
          country: data.country,
          city: data.city,
          reverseDns: data.reverseDns,
          reason: data.reason || (data.blocked ? 'Conexão VPN/Proxy detectada e bloqueada para login.' : 'Conexão residencial regular.'),
          checkedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    // API backend com timeout ou indisponível; fallback para análise client-side
  }

  // 3. Fallback Client-Side: obtém IP público e consulta feed de inteligência IP
  try {
    const clientIp = await getClientIp();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Consulta ip-api.com com campos de proxy e hosting
    const ipApiRes = await fetch(
      `https://ip-api.com/json/${clientIp}?fields=status,message,country,city,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (ipApiRes.ok) {
      const data = await ipApiRes.json();
      if (data.status === 'success') {
        const isProxy = !!data.proxy;
        const isHosting = !!data.hosting;
        const orgAs = `${data.as || ''} ${data.org || ''} ${data.isp || ''}`.toUpperCase();

        // Checar se o ASN está na lista conhecida
        let isKnownVpnAsn = false;
        for (const asn of KNOWN_VPN_ASNS) {
          if (orgAs.includes(asn)) {
            isKnownVpnAsn = true;
            break;
          }
        }

        const isVpnDetected = isProxy || isHosting || isKnownVpnAsn;
        const riskScore = isProxy ? 95 : isKnownVpnAsn ? 90 : isHosting ? 80 : 10;

        return {
          ip: data.query || clientIp,
          isVpn: isVpnDetected,
          isProxy: isProxy,
          isTor: orgAs.includes('TOR') || (data.reverse && data.reverse.includes('tor')),
          isHosting: isHosting,
          blocked: isVpnDetected,
          confidence: 'high',
          riskScore,
          provider: data.org || data.isp,
          asn: data.as,
          org: data.org,
          country: data.country,
          city: data.city,
          reverseDns: data.reverse,
          reason: isVpnDetected
            ? `Conexão identificada como ${isProxy ? 'Proxy/VPN' : isHosting ? 'Servidor de Datacenter' : 'Rede Anonimizadora'}. O login está temporariamente restrito para proteção contra contas duplicadas e vandalismos anônimos.`
            : 'Conexão residencial verificada. Autenticação permitida.',
          checkedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    // Fallback final: avalia localmente
  }

  // 4. Último fallback: avaliação heurística local sobre o IP
  const finalIp = await getClientIp();
  return evaluateIpLocally(finalIp);
}

/**
 * Analisa qualquer IP customizado (para a ferramenta de diagnóstico / Verificador)
 */
export async function checkCustomIpForVpn(targetIp: string): Promise<VpnCheckResult> {
  const clean = cleanIpAddress(targetIp);
  if (!clean) {
    return {
      ip: targetIp,
      isVpn: false,
      isProxy: false,
      isTor: false,
      isHosting: false,
      blocked: false,
      confidence: 'low',
      riskScore: 0,
      reason: 'Endereço IP inválido ou vazio.',
      checkedAt: new Date().toISOString(),
    };
  }

  // Verifica se coincide com algum preset
  const matchedPreset = PRESET_VPNS.find((p) => p.ip === clean);
  if (matchedPreset) {
    return buildPresetResult(matchedPreset);
  }

  // Consulta backend com query param
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(`/api/security/check-vpn?ip=${encodeURIComponent(clean)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && typeof data.ip === 'string') {
        return {
          ip: data.ip,
          isVpn: !!data.isVpn,
          isProxy: !!data.isProxy,
          isTor: !!data.isTor,
          isHosting: !!data.isHosting,
          blocked: !!data.blocked,
          confidence: data.confidence || 'high',
          riskScore: typeof data.riskScore === 'number' ? data.riskScore : (data.blocked ? 90 : 10),
          provider: data.provider || data.org,
          asn: data.asn,
          org: data.org,
          country: data.country,
          city: data.city,
          reverseDns: data.reverseDns,
          reason: data.reason,
          checkedAt: new Date().toISOString(),
        };
      }
    }
  } catch {}

  // Consulta API pública externa de inteligência
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://ip-api.com/json/${clean}?fields=status,message,country,city,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        const isProxy = !!data.proxy;
        const isHosting = !!data.hosting;
        const orgAs = `${data.as || ''} ${data.org || ''} ${data.isp || ''}`.toUpperCase();

        let isKnownVpnAsn = false;
        for (const asn of KNOWN_VPN_ASNS) {
          if (orgAs.includes(asn)) {
            isKnownVpnAsn = true;
            break;
          }
        }

        const isVpnDetected = isProxy || isHosting || isKnownVpnAsn;

        return {
          ip: clean,
          isVpn: isVpnDetected,
          isProxy: isProxy,
          isTor: orgAs.includes('TOR') || (data.reverse && data.reverse.includes('tor')),
          isHosting: isHosting,
          blocked: isVpnDetected,
          confidence: 'high',
          riskScore: isProxy ? 95 : isKnownVpnAsn ? 90 : isHosting ? 80 : 12,
          provider: data.org || data.isp,
          asn: data.as,
          org: data.org,
          country: data.country,
          city: data.city,
          reverseDns: data.reverse,
          reason: isVpnDetected
            ? `IP classificado como conexão de VPN, Proxy ou Datacenter (${data.org || data.isp}). O login com esta origem é bloqueado.`
            : `IP residencial comum (${data.org || data.isp}). Conexão liberada para login.`,
          checkedAt: new Date().toISOString(),
        };
      }
    }
  } catch {}

  return evaluateIpLocally(clean);
}

/**
 * Registra auditoria de tentativa de login interceptada por VPN
 */
export function logVpnBlockAttempt(details: {
  ip: string;
  provider?: string;
  reason?: string;
  attemptType?: 'google_login' | 'guest_login' | 'manual_check';
  riskScore?: number;
  country?: string;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(VPN_AUDIT_STORAGE_KEY);
    const list: VpnAuditEntry[] = raw ? JSON.parse(raw) : [];

    const newEntry: VpnAuditEntry = {
      id: 'vpn-block-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      ip: details.ip,
      provider: details.provider || 'VPN / Proxy Anônimo',
      reason: details.reason || 'Tentativa de login bloqueada devido à conexão mascarada por VPN/Proxy.',
      attemptType: details.attemptType || 'google_login',
      riskScore: details.riskScore || 90,
      country: details.country,
    };

    // Mantém as 100 tentativas mais recentes
    const updated = [newEntry, ...list].slice(0, 100);
    localStorage.setItem(VPN_AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Obtém o histórico de tentativas de login com VPN bloqueadas
 */
export function getVpnAuditLogs(): VpnAuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VPN_AUDIT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Limpa o histórico de auditoria de VPNs bloqueadas
 */
export function clearVpnAuditLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(VPN_AUDIT_STORAGE_KEY);
  } catch {}
}
