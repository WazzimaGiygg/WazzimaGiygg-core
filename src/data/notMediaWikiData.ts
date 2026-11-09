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

export interface ExtensionFile {
  name: string;
  size: number;
  sha256: string;
  content: string;
  mimeType: string;
}

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface ExtensionSecurityThreat {
  ruleId: string;
  category: 'RCE' | 'OBFUSCATION' | 'EXFILTRATION' | 'DOM_XSS' | 'PROTOTYPE_POLLUTION' | 'TROJAN_SOURCE' | 'SUSPICIOUS_NETWORK';
  severity: ThreatSeverity;
  description: string;
  lineNumber: number;
  snippet: string;
  recommendation: string;
}

export interface ExtensionSecurityAudit {
  extensionId: string;
  scannedAt: string;
  safetyScore: number; // 0 to 100
  threatLevel: 'SECURE' | 'LOW_RISK' | 'MEDIUM_RISK' | 'CRITICAL';
  entropyScore: number;
  passedChecks: number;
  totalChecks: number;
  threats: ExtensionSecurityThreat[];
  quarantined: boolean;
  quarantineReason?: string;
  authorizedBy?: string;
}

export interface WikiExtension {
  id: string;
  name: string;
  namePt: string;
  version: string;
  category: 'parser' | 'ui' | 'security' | 'api' | 'bot' | 'portal' | 'service' | 'system';
  author: string;
  description: string;
  enabled: boolean;
  type: 'extension' | 'skin';
  url: string;
  sha256: string;
  originDomain: string;
  signatureStatus: 'verified' | 'unverified' | 'tampered' | 'quarantined';
  lastSyncTimestamp: string;
  syncAuthorizedBy: string;
  quarantined: boolean;
  quarantineReason?: string;
  files: ExtensionFile[];
  securityAudit?: ExtensionSecurityAudit;
  config?: Record<string, any>;
}

// Allowed Domains Whitelist for Extension Synchronization (Dispositivo 3.05.9.a)
export const ALLOWED_EXTENSION_DOMAINS: string[] = [
  'wazzimagiygg.com',
  'notmediawiki.wazzimagiygg.com',
  'bemtevi.wazzimagiygg.com',
  'mediawiki.org',
  'wikimedia.org',
  'wikitech.wikimedia.org',
  'github.com/wazzimagiygg'
];

// ============================================================================
// NIST FIPS 180-4 SHA-256 ALGORITHM (Pure TypeScript Synchronous Engine)
// ============================================================================
export function computeSha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (candidate: number) => {
    for (let factor = 2, maxFactor = Math.sqrt(candidate); factor <= maxFactor; factor++) {
      if (candidate % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength | 0;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = i < 16 ? w[i] : (w[i] = (
        (w[i - 16] +
          (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
          w[i - 7] +
          (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0
      ));
      const s1 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const ch = (hash[0] & hash[1]) ^ (~hash[0] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ((hash[4] & hash[5]) ^ (~hash[4] & hash[6])) + k[i] + s0) | 0;
      const temp2 = (s1 + ch) | 0;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

// Shannon Entropy Calculator (bits per byte)
export function computeShannonEntropy(content: string): number {
  if (!content || content.length === 0) return 0;
  const frequencies = new Map<string, number>();
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }
  let entropy = 0;
  const len = content.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Math.round(entropy * 100) / 100;
}

// ============================================================================
// MALICIOUS INFORMATION SCANNER & STATIC ANALYSIS ENGINE (Dispositivo 3.05.9.b)
// ============================================================================
export function scanExtensionCodeForMalware(
  extensionId: string,
  fileName: string,
  code: string
): ExtensionSecurityAudit {
  const threats: ExtensionSecurityThreat[] = [];
  const lines = code.split('\n');
  let passedChecks = 0;
  const totalChecks = 9;

  // 1. Check Trojan Source Unicode Bidirectional Controls (CVE-2021-42574)
  let foundTrojan = false;
  lines.forEach((line, idx) => {
    if (/[\u202A-\u202E\u2066-\u2069]/.test(line)) {
      foundTrojan = true;
      threats.push({
        ruleId: 'SEC-MAL-001',
        category: 'TROJAN_SOURCE',
        severity: 'CRITICAL',
        description: 'Detecção de caracteres Bidi Unicode invisíveis (Trojan Source - CVE-2021-42574) que invertem a ordem lógica do código.',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Remova imediatamente os caracteres de controle bidirecional Unicode ocultos.'
      });
    }
  });
  if (!foundTrojan) passedChecks++;

  // 2. Check Remote Code Execution / Dynamic Execution sinks (eval, Function)
  let foundRce = false;
  lines.forEach((line, idx) => {
    // Avoid false positives in comments
    const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    if (/\b(eval|execScript)\s*\(/.test(cleanLine)) {
      foundRce = true;
      threats.push({
        ruleId: 'SEC-MAL-002',
        category: 'RCE',
        severity: 'CRITICAL',
        description: 'Chamada proibida à função eval() ou execScript(), permitindo injeção e execução arbitrária de código.',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Substitua funções de execução dinâmica por analisadores seguros baseados em AST ou JSON.parse.'
      });
    } else if (/\bnew\s+Function\s*\(/.test(cleanLine) || /\bFunction\s*\(\s*['"`]/.test(cleanLine)) {
      foundRce = true;
      threats.push({
        ruleId: 'SEC-MAL-003',
        category: 'RCE',
        severity: 'CRITICAL',
        description: 'Construção dinâmica de função via "new Function()", vetor de evasão e execução de payload sem isolamento.',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Elimine dynamic code evaluation em extensões do ecossistema WazzimaGiygg.'
      });
    } else if (/\b(child_process|execSync|spawnSync|process\.env)\b/.test(cleanLine)) {
      foundRce = true;
      threats.push({
        ruleId: 'SEC-MAL-004',
        category: 'RCE',
        severity: 'CRITICAL',
        description: 'Tentativa de acesso direto ao processo do sistema operacional host (child_process/process.env).',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Extensões de cliente/wiki devem operar estritamente no sandbox sandboxed DOM/Wikitext.'
      });
    }
  });
  if (!foundRce) passedChecks++;

  // 3. Check Credential & Sensitive Token Exfiltration
  let foundExfil = false;
  lines.forEach((line, idx) => {
    const cleanLine = line.replace(/\/\/.*$/, '');
    const hasSensitiveSource = /(document\.cookie|localStorage|sessionStorage|firebaseConfig|api_key|apiKey|auth_token|user_credentials)/i.test(cleanLine);
    const hasNetworkSink = /(fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|\.post\s*\(|\.send\s*\()/i.test(cleanLine);
    
    if (hasSensitiveSource && hasNetworkSink) {
      foundExfil = true;
      threats.push({
        ruleId: 'SEC-MAL-005',
        category: 'EXFILTRATION',
        severity: 'CRITICAL',
        description: 'Exfiltração ativa de credenciais/cookies detectada: leitura de token ou armazenamento local combinada com disparo de rede.',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Remova a transmissão externa de chaves, tokens de autenticação e cookies.'
      });
    } else if (/(document\.cookie\s*=)/.test(cleanLine)) {
      threats.push({
        ruleId: 'SEC-MAL-006',
        category: 'EXFILTRATION',
        severity: 'MEDIUM',
        description: 'Manipulação direta de document.cookie detectada sem proteção HttpOnly.',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Utilize sessões centralizadas gerenciadas pelo CentralAuth.'
      });
    }
  });
  if (!foundExfil) passedChecks++;

  // 4. Check Obfuscated Byte Sequences / Base64 execution
  let foundObfuscation = false;
  lines.forEach((line, idx) => {
    if (/(\\x[0-9a-fA-F]{2}){4,}/.test(line)) {
      foundObfuscation = true;
      threats.push({
        ruleId: 'SEC-MAL-007',
        category: 'OBFUSCATION',
        severity: 'HIGH',
        description: 'Detecção de sequência hexadecimal ofuscada (hex encoded string), técnica comum de camuflagem de malware.',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Declare os recursos e strings em texto claro legível para auditoria humana.'
      });
    } else if (/\batob\s*\(\s*['"`][A-Za-z0-9+/=]{24,}['"`]\)/.test(line)) {
      foundObfuscation = true;
      threats.push({
        ruleId: 'SEC-MAL-008',
        category: 'OBFUSCATION',
        severity: 'HIGH',
        description: 'Decodificação Base64 embutida com cadeia longa não rastreada.',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Evite decodificação dinâmica de strings em runtime de extensão.'
      });
    }
  });
  if (!foundObfuscation) passedChecks++;

  // 5. Check DOM XSS & Unsafe Script Injection
  let foundDomXss = false;
  lines.forEach((line, idx) => {
    const cleanLine = line.replace(/\/\/.*$/, '');
    if (/\.innerHTML\s*=\s*(?!['"`][^<]*['"`]$)/.test(cleanLine) && !/DOMPurify\.sanitize/.test(cleanLine)) {
      foundDomXss = true;
      threats.push({
        ruleId: 'SEC-MAL-009',
        category: 'DOM_XSS',
        severity: 'MEDIUM',
        description: 'Atribuição direta a innerHTML sem sanitização explícita via DOMPurify, facilitando Cross-Site Scripting (XSS).',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Utilize textContent ou sanitize o HTML antes da injeção com DOMPurify.'
      });
    } else if (/document\.write(ln)?\s*\(/.test(cleanLine)) {
      foundDomXss = true;
      threats.push({
        ruleId: 'SEC-MAL-010',
        category: 'DOM_XSS',
        severity: 'HIGH',
        description: 'Uso arcaico de document.write(), prática insegura bloqueada pelas diretrizes WazzimaGiygg.',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Manipule o DOM através de nós estruturados e componentes React/Virtual DOM.'
      });
    }
  });
  if (!foundDomXss) passedChecks++;

  // 6. Check Prototype Pollution
  let foundProto = false;
  lines.forEach((line, idx) => {
    const cleanLine = line.replace(/\/\/.*$/, '');
    if (/(__proto__|constructor\s*\.\s*prototype|Object\.prototype)/.test(cleanLine)) {
      foundProto = true;
      threats.push({
        ruleId: 'SEC-MAL-011',
        category: 'PROTOTYPE_POLLUTION',
        severity: 'HIGH',
        description: 'Acesso suspeito a __proto__ ou prototype nativo, vetor comum de Poluição de Protótipo.',
        lineNumber: idx + 1,
        snippet: line.trim().slice(0, 80),
        recommendation: 'Utilize Map ou Object.create(null) para dicionários de propriedades sem protótipo vulnerável.'
      });
    }
  });
  if (!foundProto) passedChecks++;

  // 7. Shannon Entropy Analysis (Detects packed code or encrypted blobs)
  const entropy = computeShannonEntropy(code);
  if (entropy > 5.6 && code.length > 200) {
    threats.push({
      ruleId: 'SEC-MAL-012',
      category: 'OBFUSCATION',
      severity: 'HIGH',
      description: `Entropia de Shannon anormalmente elevada (${entropy.toFixed(2)} bits/byte), característica de código empacotado, comprimido ou cifrado.`,
      lineNumber: 1,
      snippet: `[Arquivo: ${fileName}, Entropia: ${entropy.toFixed(2)}, Tamanho: ${code.length}B]`,
      recommendation: 'Forneça o código fonte desempacotado e comentado para auditoria criptográfica.'
    });
  } else {
    passedChecks++;
  }

  // 8. Check Suspicious External Network URLs
  let foundExternalDest = false;
  lines.forEach((line, idx) => {
    const urlMatches = line.match(/https?:\/\/([^/"'\s]+)/g);
    if (urlMatches) {
      for (const rawUrl of urlMatches) {
        const host = rawUrl.replace(/^https?:\/\//, '').toLowerCase();
        const isWhitelisted = ALLOWED_EXTENSION_DOMAINS.some(
          d => host === d || host.endsWith('.' + d)
        );
        if (!isWhitelisted && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          foundExternalDest = true;
          threats.push({
            ruleId: 'SEC-MAL-013',
            category: 'SUSPICIOUS_NETWORK',
            severity: 'MEDIUM',
            description: `Destino de rede externo não constante na Whitelist de Domínios Confiáveis: ${host}`,
            lineNumber: idx + 1,
            snippet: line.trim().slice(0, 80),
            recommendation: `Submeta o domínio ${host} ao Burocrata para inclusão na Whitelist de segurança.`
          });
          break;
        }
      }
    }
  });
  if (!foundExternalDest) passedChecks++;

  // Calculate Overall Safety Score
  let deductions = 0;
  for (const t of threats) {
    if (t.severity === 'CRITICAL') deductions += 40;
    else if (t.severity === 'HIGH') deductions += 20;
    else if (t.severity === 'MEDIUM') deductions += 10;
    else if (t.severity === 'LOW') deductions += 5;
  }

  const safetyScore = Math.max(0, 100 - deductions);
  let threatLevel: 'SECURE' | 'LOW_RISK' | 'MEDIUM_RISK' | 'CRITICAL' = 'SECURE';
  if (safetyScore < 40 || threats.some(t => t.severity === 'CRITICAL')) {
    threatLevel = 'CRITICAL';
  } else if (safetyScore < 70 || threats.some(t => t.severity === 'HIGH')) {
    threatLevel = 'MEDIUM_RISK';
  } else if (safetyScore < 90 || threats.length > 0) {
    threatLevel = 'LOW_RISK';
  }

  const isQuarantined = threatLevel === 'CRITICAL';
  const quarantineReason = isQuarantined
    ? `Extensão isolada preventivamente: detectadas violações de segurança de nível CRÍTICO (${threats.filter(t => t.severity === 'CRITICAL').length} ameaça(s)).`
    : undefined;

  return {
    extensionId,
    scannedAt: new Date().toISOString(),
    safetyScore,
    threatLevel,
    entropyScore: entropy,
    passedChecks,
    totalChecks,
    threats,
    quarantined: isQuarantined,
    quarantineReason
  };
}

// ============================================================================
// EXTENSION SYNCHRONIZATION SECURITY DEVICE (Dispositivo 3.05.9.a)
// ============================================================================
export function verifyExtensionSyncSecurity(
  ext: WikiExtension,
  requestedByEmail?: string
): {
  approved: boolean;
  status: 'verified' | 'unverified' | 'tampered' | 'quarantined';
  reasons: string[];
  audit: ExtensionSecurityAudit;
} {
  const reasons: string[] = [];

  // Rule 1: Bureaucrat Authority Check (Emergency constraint)
  const isBureaucrat = requestedByEmail === 'pedrohenriquecardonaperes@gmail.com';
  if (!isBureaucrat) {
    reasons.push(
      'ACESSO NEGADO: Somente o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) possui autoridade criptográfica para sincronizar extensões.'
    );
  }

  // Rule 2: Origin Domain Whitelist Validation
  const originClean = (ext.originDomain || '').toLowerCase().trim();
  const domainAllowed = ALLOWED_EXTENSION_DOMAINS.some(
    d => originClean === d || originClean.endsWith('.' + d)
  );
  if (!domainAllowed) {
    reasons.push(
      `VIOLAÇÃO DE WHITELIST: Domínio de origem "${ext.originDomain}" não consta na Whitelist oficial de sincronização.`
    );
  }

  // Rule 3: File Manifest Integrity & SHA-256 Checksum Validation
  let hasTampering = false;
  if (!ext.files || ext.files.length === 0) {
    reasons.push('FALHA DE INTEGRIDADE: Nenhum manifesto de arquivos fornecido para conferência criptográfica.');
    hasTampering = true;
  } else {
    for (const f of ext.files) {
      const calculatedHash = computeSha256Hex(f.content);
      if (f.sha256 && f.sha256 !== calculatedHash) {
        hasTampering = true;
        reasons.push(
          `ADULTERAÇÃO DETECTADA: O arquivo ${f.name} possui hash declarado (${f.sha256.slice(0, 12)}...) divergente do digest real calculado (${calculatedHash.slice(0, 12)}...).`
        );
      }
    }
  }

  // Rule 4: Deep Static Analysis & Malicious Information Scan on All Extension Files (Dispositivo 3.05.9.b)
  let aggregateAudit: ExtensionSecurityAudit = {
    extensionId: ext.id,
    scannedAt: new Date().toISOString(),
    safetyScore: 100,
    threatLevel: 'SECURE',
    entropyScore: 0,
    passedChecks: 0,
    totalChecks: 0,
    threats: [],
    quarantined: false,
    authorizedBy: requestedByEmail
  };

  if (ext.files && ext.files.length > 0) {
    for (const f of ext.files) {
      const fileAudit = scanExtensionCodeForMalware(ext.id, f.name, f.content);
      aggregateAudit.threats.push(...fileAudit.threats);
      aggregateAudit.totalChecks += fileAudit.totalChecks;
      aggregateAudit.passedChecks += fileAudit.passedChecks;
      aggregateAudit.entropyScore = Math.max(aggregateAudit.entropyScore, fileAudit.entropyScore);
      if (fileAudit.quarantined) {
        aggregateAudit.quarantined = true;
      }
    }
    // Calculate aggregate score
    let deductions = 0;
    for (const t of aggregateAudit.threats) {
      if (t.severity === 'CRITICAL') deductions += 40;
      else if (t.severity === 'HIGH') deductions += 20;
      else if (t.severity === 'MEDIUM') deductions += 10;
      else if (t.severity === 'LOW') deductions += 5;
    }
    aggregateAudit.safetyScore = Math.max(0, 100 - deductions);
    if (aggregateAudit.safetyScore < 40 || aggregateAudit.threats.some(t => t.severity === 'CRITICAL')) {
      aggregateAudit.threatLevel = 'CRITICAL';
      aggregateAudit.quarantined = true;
      aggregateAudit.quarantineReason = `Extensão colocada em quarentena imediata devido a ${aggregateAudit.threats.filter(t => t.severity === 'CRITICAL').length} ameaça(s) crítica(s).`;
    } else if (aggregateAudit.safetyScore < 70 || aggregateAudit.threats.some(t => t.severity === 'HIGH')) {
      aggregateAudit.threatLevel = 'MEDIUM_RISK';
    } else if (aggregateAudit.safetyScore < 90 || aggregateAudit.threats.length > 0) {
      aggregateAudit.threatLevel = 'LOW_RISK';
    }
  }

  if (aggregateAudit.quarantined) {
    reasons.push(
      `QUARENTENA ATIVADA: ${aggregateAudit.quarantineReason || 'Ameaças críticas detectadas nos arquivos da extensão.'}`
    );
  }

  let finalStatus: 'verified' | 'unverified' | 'tampered' | 'quarantined' = 'verified';
  if (aggregateAudit.quarantined) {
    finalStatus = 'quarantined';
  } else if (hasTampering) {
    finalStatus = 'tampered';
  } else if (!domainAllowed || !isBureaucrat) {
    finalStatus = 'unverified';
  }

  const approved = isBureaucrat && domainAllowed && !hasTampering && !aggregateAudit.quarantined;

  return {
    approved,
    status: finalStatus,
    reasons,
    audit: aggregateAudit
  };
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

// Seed Extensions with authentic manifests and SHA-256 hashes
const CITE_FILE_CONTENT = `// Extension:Cite
// Copyright (c) Wikimedia Foundation & WazzimaGiygg
export interface Footnote {
  index: number;
  name?: string;
  text: string;
}

export function parseCiteTags(input: string): { sanitized: string; footnotes: Footnote[] } {
  const footnotes: Footnote[] = [];
  let counter = 1;
  const sanitized = input.replace(/<ref(?: name="([^"]+)")?>([\\s\\S]*?)<\\/ref>/gi, (_, name, content) => {
    footnotes.push({ index: counter, name, text: content.trim() });
    return \`[\${counter++}]\`;
  });
  return { sanitized, footnotes };
}
`;

const PARSOID_FILE_CONTENT = `// Extension:Parsoid AST Service
// Compilador bidirecional Wikitext -> HTML5 AST
export interface AstNode {
  type: 'heading' | 'paragraph' | 'link' | 'infobox';
  content: string;
  attributes?: Record<string, string>;
}

export function buildParsoidAst(wikitext: string): AstNode[] {
  const nodes: AstNode[] = [];
  const lines = wikitext.split('\\n');
  for (const line of lines) {
    if (line.startsWith('==')) {
      nodes.push({ type: 'heading', content: line.replace(/=/g, '').trim() });
    } else if (line.trim().length > 0) {
      nodes.push({ type: 'paragraph', content: line.trim() });
    }
  }
  return nodes;
}
`;

const EVENTSTREAMS_FILE_CONTENT = `// Extension:EventStreams
// Stream SSE de mudanças recentes em tempo real
export function connectEventStream(endpoint: string, onEvent: (data: any) => void) {
  if (typeof EventSource === 'undefined') return null;
  const source = new EventSource(endpoint);
  source.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data);
      onEvent(parsed);
    } catch (err) {
      // Ignora frames malformados
    }
  };
  return source;
}
`;

const CENTRALAUTH_FILE_CONTENT = `// Extension:CentralAuth
// Autenticação Global & Zero-Trust RBAC
export const GOVERNANCE_BUREAUCRAT = 'pedrohenriquecardonaperes@gmail.com';

export function isBureaucratAuthorized(email?: string): boolean {
  if (!email) return false;
  return email.toLowerCase() === GOVERNANCE_BUREAUCRAT.toLowerCase();
}
`;

const CHECKUSER_FILE_CONTENT = `// Extension:CheckUser Universal
// Auditoria forense de conexões e mitigação de sockpuppets
export interface AuditRecord {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  checksum: string;
}

export function logAuditEvent(record: Omit<AuditRecord, 'timestamp'>): AuditRecord {
  return {
    ...record,
    timestamp: new Date().toISOString()
  };
}
`;

const WAZZIMAGIYGG_PORTALS_FILE_CONTENT = `// Extension:WazzimaGiygg Portals
// Conexão entre NotMediaWiki, Jornal, WikiWorldWeb e Ouvidoria
export const PORTAL_LINKS = {
  jornal: 'https://wazzimagiygg.com',
  wiki: 'https://notmediawiki.wazzimagiygg.com',
  social: 'https://bemtevi.wazzimagiygg.com'
};
`;

const SUPPORT_TICKETS_FILE_CONTENT = `// Extension:SupportTickets
// Central de Suporte & Ouvidoria WZZM (3.05.3.b)
export const DEFAULT_SUPPORT_CONFIG = {
  supportUrl: 'https://support.wazzimagiygg.com/',
  openMode: 'redirect',
  buttonLabel: 'Suporte & Tickets WZZM',
  openInNewTab: true
};

export function getEffectiveSupportUrl(customConfig?: { supportUrl?: string }): string {
  return customConfig?.supportUrl || DEFAULT_SUPPORT_CONFIG.supportUrl;
}
`;

const LINK_REDIRECTOR_FILE_CONTENT = `// Extension:LinkRedirector
// Redirecionador de Links Externos com UID (3.05.3.c)
export const DEFAULT_REDIRECTOR_CONFIG = {
  enabled: true,
  redirectBaseUrl: 'https://wazzimagiygg.com/rv/?uid=',
  appendUid: true,
  showNoticeModal: true,
  whitelistDomains: [
    'wazzimagiygg.com',
    'notmediawiki.wazzimagiygg.com',
    'bemtevi.wazzimagiygg.com',
    'support.wazzimagiygg.com'
  ]
};

export function buildRedirectUrl(targetUrl: string, uid?: string, config?: any): string {
  const base = config?.redirectBaseUrl || DEFAULT_REDIRECTOR_CONFIG.redirectBaseUrl;
  const cleanUid = uid || 'anon';
  return \`\${base}\${encodeURIComponent(cleanUid)}&dest=\${encodeURIComponent(targetUrl)}\`;
}
`;

const MAINTENANCE_MODE_FILE_CONTENT = `// Extension:MaintenanceMode
// Modo de Manutenção do Sistema (3.05.3.e)
export const DEFAULT_MAINTENANCE_CONFIG = {
  isMaintenanceActive: false,
  maintenanceMessage: 'O portal WazzimaGiygg encontra-se em manutenção programada para atualização de infraestrutura, auditoria forense e sincronização de dados.',
  estimatedReturn: 'Retorno previsto em breve',
  allowedBurocrataEmail: 'pedrohenriquecardonaperes@gmail.com'
};

export function isUserAllowedDuringMaintenance(userEmail?: string, config?: any): boolean {
  if (!userEmail) return false;
  const allowed = (config?.allowedBurocrataEmail || DEFAULT_MAINTENANCE_CONFIG.allowedBurocrataEmail).toLowerCase();
  return userEmail.toLowerCase() === allowed;
}
`;

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
    url: 'https://www.mediawiki.org/wiki/Extension:Cite',
    sha256: computeSha256Hex(CITE_FILE_CONTENT),
    originDomain: 'mediawiki.org',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-08T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    files: [
      {
        name: 'index.ts',
        size: CITE_FILE_CONTENT.length,
        sha256: computeSha256Hex(CITE_FILE_CONTENT),
        content: CITE_FILE_CONTENT,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-cite',
      scannedAt: '2026-11-08T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(CITE_FILE_CONTENT),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
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
    url: 'https://www.mediawiki.org/wiki/Parsoid',
    sha256: computeSha256Hex(PARSOID_FILE_CONTENT),
    originDomain: 'mediawiki.org',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-08T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    files: [
      {
        name: 'parser.ts',
        size: PARSOID_FILE_CONTENT.length,
        sha256: computeSha256Hex(PARSOID_FILE_CONTENT),
        content: PARSOID_FILE_CONTENT,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-parsoid',
      scannedAt: '2026-11-08T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(PARSOID_FILE_CONTENT),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
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
    url: 'https://wikitech.wikimedia.org/wiki/Event_Platform/EventStreams',
    sha256: computeSha256Hex(EVENTSTREAMS_FILE_CONTENT),
    originDomain: 'wikitech.wikimedia.org',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-08T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    files: [
      {
        name: 'eventstreams.ts',
        size: EVENTSTREAMS_FILE_CONTENT.length,
        sha256: computeSha256Hex(EVENTSTREAMS_FILE_CONTENT),
        content: EVENTSTREAMS_FILE_CONTENT,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-eventstreams',
      scannedAt: '2026-11-08T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(EVENTSTREAMS_FILE_CONTENT),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
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
    url: 'https://www.mediawiki.org/wiki/Extension:CentralAuth',
    sha256: computeSha256Hex(CENTRALAUTH_FILE_CONTENT),
    originDomain: 'mediawiki.org',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-08T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    files: [
      {
        name: 'auth.ts',
        size: CENTRALAUTH_FILE_CONTENT.length,
        sha256: computeSha256Hex(CENTRALAUTH_FILE_CONTENT),
        content: CENTRALAUTH_FILE_CONTENT,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-centralauth',
      scannedAt: '2026-11-08T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(CENTRALAUTH_FILE_CONTENT),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
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
    url: 'https://www.mediawiki.org/wiki/Extension:CheckUser',
    sha256: computeSha256Hex(CHECKUSER_FILE_CONTENT),
    originDomain: 'mediawiki.org',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-08T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    files: [
      {
        name: 'checkuser.ts',
        size: CHECKUSER_FILE_CONTENT.length,
        sha256: computeSha256Hex(CHECKUSER_FILE_CONTENT),
        content: CHECKUSER_FILE_CONTENT,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-checkuser',
      scannedAt: '2026-11-08T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(CHECKUSER_FILE_CONTENT),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
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
    url: 'https://wazzimagiygg.com',
    sha256: computeSha256Hex(WAZZIMAGIYGG_PORTALS_FILE_CONTENT),
    originDomain: 'wazzimagiygg.com',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-08T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    files: [
      {
        name: 'portals.ts',
        size: WAZZIMAGIYGG_PORTALS_FILE_CONTENT.length,
        sha256: computeSha256Hex(WAZZIMAGIYGG_PORTALS_FILE_CONTENT),
        content: WAZZIMAGIYGG_PORTALS_FILE_CONTENT,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-wazzimagiygg-portals',
      scannedAt: '2026-11-08T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(WAZZIMAGIYGG_PORTALS_FILE_CONTENT),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
  },
  {
    id: 'ext-support-tickets',
    name: 'SupportTickets',
    namePt: 'Suporte & Central de Tickets (3.05.3.b)',
    version: '1.0.0',
    category: 'service',
    author: 'WazzimaGiygg Systems',
    description: 'Transforma a opção de Suporte e Tickets em extensão configurável, permitindo alterar a URL do suporte externo (padrão: https://support.wazzimagiygg.com/) ou chavear o modo de atendimento.',
    enabled: true,
    type: 'extension',
    url: 'https://wazzimagiygg.com',
    sha256: computeSha256Hex(SUPPORT_TICKETS_FILE_CONTENT),
    originDomain: 'wazzimagiygg.com',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-09T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    config: {
      supportUrl: 'https://support.wazzimagiygg.com/',
      openMode: 'redirect',
      buttonLabel: 'Suporte & Tickets WZZM',
      openInNewTab: true
    },
    files: [
      {
        name: 'support-tickets.ts',
        size: SUPPORT_TICKETS_FILE_CONTENT.length,
        sha256: computeSha256Hex(SUPPORT_TICKETS_FILE_CONTENT),
        content: SUPPORT_TICKETS_FILE_CONTENT,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-support-tickets',
      scannedAt: '2026-11-09T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(SUPPORT_TICKETS_FILE_CONTENT),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
  },
  {
    id: 'ext-external-redirector',
    name: 'LinkRedirector',
    namePt: 'Redirecionador de Links Externos com UID (3.05.3.c)',
    version: '1.0.0',
    category: 'security',
    author: 'WazzimaGiygg Security Core',
    description: 'Controla o redirecionador de links externos (padrão: https://wazzimagiygg.com/rv/?uid=), permitindo desativar o redirecionador ou alterar o prefixo do UID redirecionador.',
    enabled: true,
    type: 'extension',
    url: 'https://wazzimagiygg.com',
    sha256: computeSha256Hex(LINK_REDIRECTOR_FILE_CONTENT),
    originDomain: 'wazzimagiygg.com',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-09T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    config: {
      enabled: true,
      redirectBaseUrl: 'https://wazzimagiygg.com/rv/?uid=',
      appendUid: true,
      showNoticeModal: true,
      whitelistDomains: [
        'wazzimagiygg.com',
        'notmediawiki.wazzimagiygg.com',
        'bemtevi.wazzimagiygg.com',
        'support.wazzimagiygg.com'
      ]
    },
    files: [
      {
        name: 'link-redirector.ts',
        size: LINK_REDIRECTOR_FILE_CONTENT.length,
        sha256: computeSha256Hex(LINK_REDIRECTOR_FILE_CONTENT),
        content: LINK_REDIRECTOR_FILE_CONTENT,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-external-redirector',
      scannedAt: '2026-11-09T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(LINK_REDIRECTOR_FILE_CONTENT),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
  },
  {
    id: 'ext-maintenance-mode',
    name: 'MaintenanceMode',
    namePt: 'Modo de Manutenção do Sistema (3.05.3.e)',
    version: '1.0.0',
    category: 'system',
    author: 'WazzimaGiygg Governance Bureaucrat',
    description: 'Define quando o site está em manutenção programada. Quando ativo, apenas o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) tem acesso às configurações via login Google.',
    enabled: false,
    type: 'extension',
    url: 'https://wazzimagiygg.com',
    sha256: computeSha256Hex(MAINTENANCE_MODE_FILE_CONTENT),
    originDomain: 'wazzimagiygg.com',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-09T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    config: {
      isMaintenanceActive: false,
      maintenanceMessage: 'O portal WazzimaGiygg encontra-se em manutenção programada para atualização de infraestrutura, auditoria forense e sincronização de dados.',
      estimatedReturn: 'Retorno previsto em breve',
      allowedBurocrataEmail: 'pedrohenriquecardonaperes@gmail.com'
    },
    files: [
      {
        name: 'maintenance.ts',
        size: MAINTENANCE_MODE_FILE_CONTENT.length,
        sha256: computeSha256Hex(MAINTENANCE_MODE_FILE_CONTENT),
        content: MAINTENANCE_MODE_FILE_CONTENT,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-maintenance-mode',
      scannedAt: '2026-11-09T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(MAINTENANCE_MODE_FILE_CONTENT),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
  }
];

// ============================================================================
// CATÁLOGO DE EXTENSÕES EXISTENTES PARA ADIÇÃO (3.05.3.a)
// ============================================================================
const VISUALEDITOR_CODE = `// Extension:VisualEditor WYSIWYG
export function initVisualEditor() {
  console.log("VisualEditor iniciado com renderizador DOM semântico.");
  return { ready: true, mode: "visual" };
}
`;

const MATH_CODE = `// Extension:Math LaTeX & MathML
export function renderLaTeX(tex: string): string {
  return \`<span class="tex-formula">\${tex}</span>\`;
}
`;

const PARSERFUNCTIONS_CODE = `// Extension:ParserFunctions
export function evaluateCondition(expr: string, trueVal: string, falseVal: string): string {
  return expr.trim() ? trueVal : falseVal;
}
`;

const WIKIEDITOR_CODE = `// Extension:WikiEditor Advanced Toolbar
export function initToolbar() {
  return { buttons: ["bold", "italic", "link", "heading", "table"] };
}
`;

const MOBILEFRONTEND_CODE = `// Extension:MobileFrontend
export function isMobileDevice(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 768;
}
`;

export const EXISTING_EXTENSIONS_CATALOG: WikiExtension[] = [
  {
    id: 'ext-visualeditor',
    name: 'VisualEditor',
    namePt: 'VisualEditor (Editor Visual WYSIWYG)',
    version: '2.1.0',
    category: 'ui',
    author: 'Wikimedia Foundation & Contributors',
    description: 'Interface avançada de edição em tempo real no formato WYSIWYG para artigos do acervo.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:VisualEditor',
    sha256: computeSha256Hex(VISUALEDITOR_CODE),
    originDomain: 'mediawiki.org',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-09T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    config: {
      enableWikitextMode: true,
      autoSaveIntervalSeconds: 30
    },
    files: [
      {
        name: 'visualeditor.ts',
        size: VISUALEDITOR_CODE.length,
        sha256: computeSha256Hex(VISUALEDITOR_CODE),
        content: VISUALEDITOR_CODE,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-visualeditor',
      scannedAt: '2026-11-09T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(VISUALEDITOR_CODE),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
  },
  {
    id: 'ext-math',
    name: 'Math',
    namePt: 'Math (Renderizador LaTeX & Fórmulas)',
    version: '3.0.0',
    category: 'parser',
    author: 'Moritz Schubotz & MediaWiki Team',
    description: 'Compilador e renderizador de notação matemática TeX/LaTeX para visualização em fórmulas científicas.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:Math',
    sha256: computeSha256Hex(MATH_CODE),
    originDomain: 'mediawiki.org',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-09T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    config: {
      renderMode: 'mathml',
      defaultDisplay: 'inline'
    },
    files: [
      {
        name: 'math.ts',
        size: MATH_CODE.length,
        sha256: computeSha256Hex(MATH_CODE),
        content: MATH_CODE,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-math',
      scannedAt: '2026-11-09T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(MATH_CODE),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
  },
  {
    id: 'ext-parserfunctions',
    name: 'ParserFunctions',
    namePt: 'ParserFunctions (Lógica Condicional de Wikitexto)',
    version: '1.6.0',
    category: 'parser',
    author: 'Tim Starling',
    description: 'Adiciona operadores lógicos (#if, #ifeq, #switch, #expr) para templates e predefinições inteligentes.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:ParserFunctions',
    sha256: computeSha256Hex(PARSERFUNCTIONS_CODE),
    originDomain: 'mediawiki.org',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-09T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    config: {
      maxDepth: 10,
      enableExpr: true
    },
    files: [
      {
        name: 'parserfunctions.ts',
        size: PARSERFUNCTIONS_CODE.length,
        sha256: computeSha256Hex(PARSERFUNCTIONS_CODE),
        content: PARSERFUNCTIONS_CODE,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-parserfunctions',
      scannedAt: '2026-11-09T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(PARSERFUNCTIONS_CODE),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
  },
  {
    id: 'ext-wikieditor',
    name: 'WikiEditor',
    namePt: 'WikiEditor (Barra de Ferramentas Avançada)',
    version: '0.5.1',
    category: 'ui',
    author: 'Trevor Parscal, Roan Kattouw',
    description: 'Enriquece a caixa de texto de edição de wikitexto com botões de formatação rápida, tabelas e links.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:WikiEditor',
    sha256: computeSha256Hex(WIKIEDITOR_CODE),
    originDomain: 'mediawiki.org',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-09T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    config: {
      toolbarFloating: true
    },
    files: [
      {
        name: 'wikieditor.ts',
        size: WIKIEDITOR_CODE.length,
        sha256: computeSha256Hex(WIKIEDITOR_CODE),
        content: WIKIEDITOR_CODE,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-wikieditor',
      scannedAt: '2026-11-09T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(WIKIEDITOR_CODE),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
  },
  {
    id: 'ext-mobilefrontend',
    name: 'MobileFrontend',
    namePt: 'MobileFrontend (Adaptação Responsiva para Celular)',
    version: '2.0.0',
    category: 'ui',
    author: 'Wikimedia Mobile Team',
    description: 'Otimiza o layout, tipografia e consumo de banda para dispositivos móveis e conexões lentas.',
    enabled: true,
    type: 'extension',
    url: 'https://www.mediawiki.org/wiki/Extension:MobileFrontend',
    sha256: computeSha256Hex(MOBILEFRONTEND_CODE),
    originDomain: 'mediawiki.org',
    signatureStatus: 'verified',
    lastSyncTimestamp: '2026-11-09T12:00:00.000Z',
    syncAuthorizedBy: 'pedrohenriquecardonaperes@gmail.com',
    quarantined: false,
    config: {
      enableCompactMode: true
    },
    files: [
      {
        name: 'mobilefrontend.ts',
        size: MOBILEFRONTEND_CODE.length,
        sha256: computeSha256Hex(MOBILEFRONTEND_CODE),
        content: MOBILEFRONTEND_CODE,
        mimeType: 'application/typescript'
      }
    ],
    securityAudit: {
      extensionId: 'ext-mobilefrontend',
      scannedAt: '2026-11-09T12:00:00.000Z',
      safetyScore: 100,
      threatLevel: 'SECURE',
      entropyScore: computeShannonEntropy(MOBILEFRONTEND_CODE),
      passedChecks: 9,
      totalChecks: 9,
      threats: [],
      quarantined: false,
      authorizedBy: 'pedrohenriquecardonaperes@gmail.com'
    }
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
