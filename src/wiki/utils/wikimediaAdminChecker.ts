/**
 * Utilitário de Segurança: Detecção e Bloqueio de Nicknames de Administradores
 * de Todos os Sites e Projetos da Wikimedia Foundation (Wikipédia, Commons, Meta, etc.)
 *
 * Prioridade explícita solicitada:
 * - "Chronus"
 * - "LittleSunshine"
 * - "Johannnes89"
 * - "Teles"
 * - "Conde Edmond Dantés"
 */

export interface BlockedWikimediaAdminResult {
  isBlocked: boolean;
  matchedAdmin?: string;
  isPriority?: boolean;
  project?: string;
  reason?: string;
}

/**
 * Administradores prioritários definidos pelo usuário
 */
export const PRIORITY_WIKIMEDIA_ADMINS: Array<{ name: string; project: string; role: string }> = [
  { name: 'Chronus', project: 'Wikipédia em português / Wikimedia Commons', role: 'Administrador / Burocrata histórico' },
  { name: 'LittleSunshine', project: 'Wikipédia em português / Wikimedia Foundation', role: 'Administrador / Revisor' },
  { name: 'Johannnes89', project: 'Wikimedia Commons / Meta-Wiki / Wikipedia', role: 'Administrador / Steward / Sysop' },
  { name: 'Teles', project: 'Wikipédia em português / Wikimedia Foundation', role: 'Administrador / Steward / CheckUser' },
  { name: 'Conde Edmond Dantés', project: 'Wikipédia em português / Wikimedia Foundation', role: 'Administrador / Revisor / Eliminador' },
];

/**
 * Base de dados exaustiva de administradores, burocratas, stewards e operadores
 * de projetos da Wikimedia Foundation (Wikipédia pt/en, Commons, Meta, Wikidata)
 */
export const WIKIMEDIA_ADMIN_NICKNAMES: Array<{ name: string; project: string; role?: string }> = [
  // Prioritários
  ...PRIORITY_WIKIMEDIA_ADMINS,

  // Administradores, Burocratas, Eliminadores e Stewards lusófonos e globais (Wikipédia, Commons, Meta)
  { name: 'Érico', project: 'Wikipédia / Meta-Wiki / Wikimedia Foundation', role: 'Steward / Administrador' },
  { name: 'Erico', project: 'Wikipédia / Meta-Wiki / Wikimedia Foundation', role: 'Steward / Administrador' },
  { name: 'Alberto leoncio', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Albertoleoncio', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Athena in Wonderland', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Beria Lima', project: 'Wikimedia Foundation / Meta', role: 'Steward / Sysop' },
  { name: 'Beria', project: 'Wikimedia Foundation / Meta', role: 'Steward / Sysop' },
  { name: 'RadiX', project: 'Wikipédia em português', role: 'Administrador / Burocrata' },
  { name: 'Fabiano', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Gogan', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'GoEThe', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Leonprimer', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Stuckkey', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'DarwIn', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'He7d3r', project: 'Wikipédia em português / Wikimedia Toolforge', role: 'Administrador de Interface' },
  { name: 'HV', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Vitor Mazuco', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Chicocvenancio', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Mwalcoff', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'JMagalhães', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'JMagalhaes', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'João Xavier', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Joao Xavier', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'HCa', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'GFontenelle', project: 'Wikimedia Foundation / User Group Brasil', role: 'Administrador / Operador WMF' },
  { name: 'Escaravelho', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Luizdl', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'EVitor', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'DARIO SEVERI', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Alchimista', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Rei-artur', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'TXiKi', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Geno-V', project: 'Wikipédia em português', role: 'Administrador' },
  { name: 'Nemo bis', project: 'Wikimedia Foundation / Meta', role: 'Sysop' },
  { name: 'Taketa', project: 'Meta-Wiki / Wikimedia Commons', role: 'Steward' },
  { name: 'Trijnstel', project: 'Meta-Wiki / Wikimedia Commons', role: 'Steward' },
  { name: 'DerHexer', project: 'Meta-Wiki / Wikipedia', role: 'Steward' },
  { name: 'Vituzzu', project: 'Meta-Wiki / Wikipedia', role: 'Steward' },
  { name: 'Callanecc', project: 'Meta-Wiki / Wikimedia Foundation', role: 'Steward' },
  { name: 'Stryn', project: 'Meta-Wiki / Wikimedia Commons', role: 'Steward' },
  { name: 'Billinghurst', project: 'Meta-Wiki / Wikisource', role: 'Steward' },
  { name: 'Mardetanha', project: 'Meta-Wiki', role: 'Steward' },
  { name: 'Hasley', project: 'Meta-Wiki / Commons', role: 'Steward' },
  { name: 'MF-Warburg', project: 'Meta-Wiki', role: 'Steward' },
  { name: 'Superzerocool', project: 'Wikimedia Commons', role: 'Administrador' },
  { name: 'DanCharly', project: 'Wikipédia', role: 'Administrador' },
  { name: 'Jimbo Wales', project: 'Wikimedia Foundation', role: 'Fundador / Trustee WMF' },
  { name: 'Jimmy Wales', project: 'Wikimedia Foundation', role: 'Fundador / Trustee WMF' },
  { name: 'Drmies', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'Fram', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'Bishonen', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'Barkeep49', project: 'English Wikipedia', role: 'ArbCom / Administrador' },
  { name: 'Moneytrees', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'Yamla', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'Kudpung', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'Primefac', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'Taivo', project: 'Wikimedia Commons', role: 'Administrador' },
  { name: 'Cyberpower678', project: 'English Wikipedia / Toolforge', role: 'Administrador' },
  { name: 'Materialscientist', project: 'English Wikipedia / Commons', role: 'Administrador' },
  { name: 'Widr', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'Gilliam', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'Favonian', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'Ymblanter', project: 'English Wikipedia / Commons', role: 'Administrador' },
  { name: 'Ladsgroup', project: 'Wikimedia Foundation Staff / MediaWiki', role: 'Administrador' },
  { name: 'Kaldari', project: 'Wikimedia Foundation', role: 'Administrador / Engenheiro WMF' },
  { name: 'DannyS712', project: 'English Wikipedia', role: 'Administrador' },
  { name: 'WikiSysop', project: 'MediaWiki / Wikimedia', role: 'Conta de Sistema' },
  { name: 'WMFOffice', project: 'Wikimedia Foundation', role: 'Conta Oficial WMF' },
  { name: 'Wikimedia Foundation', project: 'Wikimedia Foundation', role: 'Instituição WMF' },
  { name: 'WikimediaFoundation', project: 'Wikimedia Foundation', role: 'Instituição WMF' },
];

/**
 * Normaliza strings para comparação robusta:
 * - Remove acentos/diacríticos (Dantés -> Dantes)
 * - Converte para minúsculas
 * - Remove espaços duplicados, underscores, hífens e pontos
 */
export function normalizeAdminString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Mantém apenas alfanuméricos minúsculos
    .trim();
}

/**
 * Normaliza preservando espaços simples (para checagens de tokens)
 */
export function normalizeAdminWords(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se um determinado identificador (nome de exibição, username, apelido ou email)
 * corresponde a um administrador de sites da Wikimedia Foundation.
 */
export function checkIfWikimediaAdmin(rawIdentifier: string): BlockedWikimediaAdminResult {
  if (!rawIdentifier || typeof rawIdentifier !== 'string') {
    return { isBlocked: false };
  }

  const cleanRaw = rawIdentifier.trim();
  const normalizedCandidate = normalizeAdminString(cleanRaw);
  const wordsCandidate = normalizeAdminWords(cleanRaw);

  // Extrair parte do email se for um endereço de email (ex: teles@gmail.com -> teles)
  let emailPrefixNormalized = '';
  if (cleanRaw.includes('@')) {
    const prefix = cleanRaw.split('@')[0];
    emailPrefixNormalized = normalizeAdminString(prefix);
  }

  // 1. Checagem prioritária imediata (Chronus, LittleSunshine, Johannnes89, Teles, Conde Edmond Dantés)
  for (const prio of PRIORITY_WIKIMEDIA_ADMINS) {
    const prioNorm = normalizeAdminString(prio.name);
    const prioWords = normalizeAdminWords(prio.name);

    if (
      normalizedCandidate === prioNorm ||
      wordsCandidate === prioWords ||
      (emailPrefixNormalized && emailPrefixNormalized === prioNorm) ||
      wordsCandidate.startsWith(prioWords + ' ') ||
      wordsCandidate.endsWith(' ' + prioWords)
    ) {
      return {
        isBlocked: true,
        matchedAdmin: prio.name,
        isPriority: true,
        project: prio.project,
        reason: `O nickname '${prio.name}' possui bloqueio prioritário por corresponder a um administrador da Wikimedia Foundation (${prio.project} - ${prio.role}). O acesso e login com esta identidade estão permanentemente vedados na WikiZero.`,
      };
    }
  }

  // 2. Checagem ampla em toda a base de administradores da Wikimedia Foundation
  for (const admin of WIKIMEDIA_ADMIN_NICKNAMES) {
    const adminNorm = normalizeAdminString(admin.name);
    const adminWords = normalizeAdminWords(admin.name);

    // Evitar falsos positivos com nomes curtos com menos de 3 caracteres a menos que exatos
    if (adminNorm.length <= 3) {
      if (normalizedCandidate === adminNorm || (emailPrefixNormalized && emailPrefixNormalized === adminNorm)) {
        return {
          isBlocked: true,
          matchedAdmin: admin.name,
          isPriority: false,
          project: admin.project,
          reason: `O nickname '${admin.name}' está bloqueado por corresponder a administrador de projetos da Wikimedia Foundation (${admin.project}).`,
        };
      }
      continue;
    }

    if (
      normalizedCandidate === adminNorm ||
      wordsCandidate === adminWords ||
      (emailPrefixNormalized && emailPrefixNormalized === adminNorm)
    ) {
      return {
        isBlocked: true,
        matchedAdmin: admin.name,
        isPriority: false,
        project: admin.project,
        reason: `O nickname '${admin.name}' está bloqueado por corresponder a administrador de projetos da Wikimedia Foundation (${admin.project}).`,
      };
    }
  }

  return { isBlocked: false };
}

/**
 * Valida múltiplos identificadores de um usuário no momento do login
 */
export function validateUserIdentifiersAgainstWikimediaAdmins(params: {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
}): BlockedWikimediaAdminResult {
  const { displayName, username, email } = params;

  if (displayName) {
    const res = checkIfWikimediaAdmin(displayName);
    if (res.isBlocked) return res;
  }

  if (username) {
    const res = checkIfWikimediaAdmin(username);
    if (res.isBlocked) return res;
  }

  if (email) {
    const res = checkIfWikimediaAdmin(email);
    if (res.isBlocked) return res;
  }

  return { isBlocked: false };
}
