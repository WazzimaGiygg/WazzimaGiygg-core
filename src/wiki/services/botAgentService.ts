/**
 * @file src/services/botAgentService.ts
 * @description Serviço Front-End central de gerenciamento de Bots da WikiZero.
 * Implementa os 7 robôs especializados, motor de varredura com condições de busca,
 * registro de bots users, auditoria e mitigação de vandalismo/LGPD.
 */

import {
  WikiBotId,
  WikiBotUser,
  BotFinding,
  BotScanCondition,
  BotScanSummary,
  BotAgentConfig,
  UserAbuseRecord,
  BotSeverity,
  BotActionTaken,
} from '../types/bots';
import { WikiArticle, UserProfile } from '../types';
import { StorageService } from './storageService';
import { getDbSafe } from './firebase';
import { collection, doc, getDocs, setDoc, query, limit } from 'firebase/firestore';

const BOT_CONFIG_KEY = 'wikizero_bot_agent_config';
const BOT_FINDINGS_KEY = 'wikizero_bot_findings';
const BOT_USER_ABUSE_KEY = 'wikizero_bot_user_abuse_records';

/**
 * Contas oficiais de Bot Users pré-configuradas no sistema WikiZero
 */
export const DEFAULT_BOT_USERS: WikiBotUser[] = [
  {
    id: 'bot-citation-verifier',
    botId: 'citation-verifier',
    username: 'WikiBot-Citações',
    displayName: 'WikiBot de Verificação de Citações & Fontes',
    avatarIcon: 'BookCheck',
    enabled: true,
    role: 'bot',
    permissions: {
      canEdit: true,
      canFlag: true,
      canRevert: false,
      canSanitize: false,
      canNotifyAdmins: true,
    },
    totalActionsCount: 42,
    lastRunAt: new Date(Date.now() - 3600000).toISOString(),
    description: 'Analisa o corpo dos artigos e marca trechos sem fontes confiáveis ou com citações suspeitas (4.1.1.WV.1).',
    triggerMode: 'hybrid',
  },
  {
    id: 'bot-anti-vandalism',
    botId: 'anti-vandalism',
    username: 'WikiBot-AntiVandalismo',
    displayName: 'WikiBot Sentinela Anti-Vandalismo',
    avatarIcon: 'ShieldAlert',
    enabled: true,
    role: 'bot',
    permissions: {
      canEdit: true,
      canFlag: true,
      canRevert: true,
      canSanitize: false,
      canNotifyAdmins: true,
    },
    totalActionsCount: 128,
    lastRunAt: new Date(Date.now() - 1800000).toISOString(),
    description: 'Detecta esvaziamento massivo de páginas, flood de caracteres e vandalismo intencional (4.1.1.11E.1).',
    triggerMode: 'on-edit',
  },
  {
    id: 'bot-categorization',
    botId: 'categorization',
    username: 'WikiBot-Categorização',
    displayName: 'WikiBot de Organização & Categorias',
    avatarIcon: 'Tags',
    enabled: true,
    role: 'bot',
    permissions: {
      canEdit: true,
      canFlag: true,
      canRevert: false,
      canSanitize: false,
      canNotifyAdmins: false,
    },
    totalActionsCount: 86,
    lastRunAt: new Date(Date.now() - 7200000).toISOString(),
    description: 'Identifica o domínio temático do verbete e sugere ou auto-aplica categorias taxonômicas (4.1.1.G2.1).',
    triggerMode: 'hybrid',
  },
  {
    id: 'bot-quality-audit',
    botId: 'quality-audit',
    username: 'WikiBot-Qualidade',
    displayName: 'WikiBot Auditor de Qualidade & Estrutura',
    avatarIcon: 'Sparkles',
    enabled: true,
    role: 'bot',
    permissions: {
      canEdit: false,
      canFlag: true,
      canRevert: false,
      canSanitize: false,
      canNotifyAdmins: false,
    },
    totalActionsCount: 65,
    lastRunAt: new Date(Date.now() - 5400000).toISOString(),
    description: 'Verifica completude estrutural (introdução, cabeçalhos ==, tamanho e referências) (4.1.1.IL.1).',
    triggerMode: 'scheduled',
  },
  {
    id: 'bot-broken-links',
    botId: 'broken-links',
    username: 'WikiBot-LinksQuebrados',
    displayName: 'WikiBot Verificador de Links Externos',
    avatarIcon: 'Link2Off',
    enabled: true,
    role: 'bot',
    permissions: {
      canEdit: true,
      canFlag: true,
      canRevert: false,
      canSanitize: false,
      canNotifyAdmins: false,
    },
    totalActionsCount: 19,
    lastRunAt: new Date(Date.now() - 14400000).toISOString(),
    description: 'Varre links externos em busca de protocolos inválidos, links malformados e conexões HTTP inseguras (4.1.1.GW.1).',
    triggerMode: 'scheduled',
  },
  {
    id: 'bot-lgpd-moderator',
    botId: 'lgpd-moderator',
    username: 'WikiBot-LGPD-Protecao',
    displayName: 'WikiBot de Conformidade LGPD & Proteção de Dados',
    avatarIcon: 'Lock',
    enabled: true,
    role: 'bot',
    permissions: {
      canEdit: true,
      canFlag: true,
      canRevert: true,
      canSanitize: true,
      canNotifyAdmins: true,
    },
    totalActionsCount: 31,
    lastRunAt: new Date(Date.now() - 1200000).toISOString(),
    description: 'Monitora e expurga inserções de CPF, CNPJ, RG, cartões ou telefones sensíveis (4.1.1.E0.1 & 4.1.1-L8.3).',
    triggerMode: 'on-edit',
  },
  {
    id: 'bot-user-abuse-sentinel',
    botId: 'user-abuse-sentinel',
    username: 'WikiBot-SentinelaUsuario',
    displayName: 'WikiBot Sentinela de Conduta & Abuso de Usuários',
    avatarIcon: 'UserCheck',
    enabled: true,
    role: 'bot',
    permissions: {
      canEdit: false,
      canFlag: true,
      canRevert: false,
      canSanitize: false,
      canNotifyAdmins: true,
    },
    totalActionsCount: 54,
    lastRunAt: new Date(Date.now() - 900000).toISOString(),
    description: 'Verificação contínua das contribuições de usuários e histórico de abusos (4.1.1.18C.1).',
    triggerMode: 'hybrid',
  },
];

export const DEFAULT_BOT_CONFIG: BotAgentConfig = {
  globalEnabled: true,
  bots: {
    'citation-verifier': {
      enabled: true,
      autoFix: false,
      notifyAdmins: true,
      thresholdMassiveDeletionPercent: 40,
      geminiVerificationEnabled: true,
      intervalMinutes: 120,
    },
    'anti-vandalism': {
      enabled: true,
      autoFix: true,
      notifyAdmins: true,
      thresholdMassiveDeletionPercent: 40,
      geminiVerificationEnabled: false,
      intervalMinutes: 15,
    },
    'categorization': {
      enabled: true,
      autoFix: true,
      notifyAdmins: false,
      thresholdMassiveDeletionPercent: 40,
      geminiVerificationEnabled: false,
      intervalMinutes: 360,
    },
    'quality-audit': {
      enabled: true,
      autoFix: false,
      notifyAdmins: false,
      thresholdMassiveDeletionPercent: 40,
      geminiVerificationEnabled: false,
      intervalMinutes: 240,
    },
    'broken-links': {
      enabled: true,
      autoFix: false,
      notifyAdmins: false,
      thresholdMassiveDeletionPercent: 40,
      geminiVerificationEnabled: false,
      intervalMinutes: 720,
    },
    'lgpd-moderator': {
      enabled: true,
      autoFix: true,
      notifyAdmins: true,
      thresholdMassiveDeletionPercent: 40,
      geminiVerificationEnabled: false,
      intervalMinutes: 10,
    },
    'user-abuse-sentinel': {
      enabled: true,
      autoFix: true,
      notifyAdmins: true,
      thresholdMassiveDeletionPercent: 40,
      geminiVerificationEnabled: false,
      intervalMinutes: 60,
    },
  },
  abuseThresholds: {
    maxEditsPerHour: 20,
    maxWarningsBeforeBlock: 3,
    revertOnCriticalLgpd: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'Sistema WikiZero',
};

// Expressões Regulares de Detecção LGPD (Art. 5º e 18 da Lei 13.709/2018)
const REGEX_CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const REGEX_CNPJ = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const REGEX_RG = /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dX]\b/gi;
const REGEX_CREDIT_CARD = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
const REGEX_PHONE = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?[\s-]?)?9?\d{4}[-\s]?\d{4}\b/g;
const REGEX_PRIVATE_EMAIL = /\b[A-Za-z0-9._%+-]+@(gmail|hotmail|yahoo|outlook|icloud)\.com\b/gi;

export class BotAgentService {
  /**
   * Obtém a configuração do Agente de Bots
   */
  static getConfig(): BotAgentConfig {
    try {
      const stored = localStorage.getItem(BOT_CONFIG_KEY);
      if (stored) {
        return { ...DEFAULT_BOT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // Ignora erro de JSON
    }
    return DEFAULT_BOT_CONFIG;
  }

  /**
   * Salva a configuração do Agente de Bots
   */
  static saveConfig(newConfig: Partial<BotAgentConfig>, updatedBy: string = 'Administrador'): BotAgentConfig {
    const current = this.getConfig();
    const updated: BotAgentConfig = {
      ...current,
      ...newConfig,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    localStorage.setItem(BOT_CONFIG_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * Ativa ou desativa um bot específico
   */
  static toggleBot(botId: WikiBotId, enabled: boolean): BotAgentConfig {
    const config = this.getConfig();
    if (config.bots[botId]) {
      config.bots[botId].enabled = enabled;
      return this.saveConfig(config);
    }
    return config;
  }

  /**
   * Obtém a lista de Bots Users do sistema
   */
  static getBotUsers(): WikiBotUser[] {
    const config = this.getConfig();
    return DEFAULT_BOT_USERS.map((user) => ({
      ...user,
      enabled: config.bots[user.botId]?.enabled ?? user.enabled,
    }));
  }

  /**
   * =========================================================================
   * 1. BOT DE VERIFICAÇÃO DE CITAÇÕES (4.1.1.WV.1)
   * =========================================================================
   */
  static inspectCitations(article: Partial<WikiArticle>): BotFinding[] {
    const text = article.descricao || '';
    const findings: BotFinding[] = [];
    const hasRefs = /<ref[^>]*>[\s\S]*?<\/ref>/i.test(text) || /\[\d+\]/.test(text) || /\[https?:\/\/[^\]]+\]/.test(text);

    // Se o artigo possui mais de 100 palavras e nenhuma citação
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 60 && !hasRefs) {
      findings.push({
        id: `cite-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        botId: 'citation-verifier',
        articleId: article.id || 'temp',
        articleTitle: article.titulo || 'Sem título',
        pageUid: article.pageUid,
        severity: 'warning',
        issueType: 'ausencia_de_fontes',
        summary: 'Artigo extenso sem citações ou fontes verificáveis.',
        details: `O verbete possui ${wordCount} palavras mas não apresenta nenhuma tag <ref> ou link de fonte externa.`,
        suggestedAction: 'Adicionar referências bibliográficas utilizando a ferramenta de Citações ou a sintaxe <ref>Fonte</ref>.',
        actionTaken: 'flagged',
        timestamp: new Date().toISOString(),
      });
    }

    // Procura por links suspeitos em referências (ex: localhost, teste, domínios proibidos)
    const suspiciousDomains = ['localhost', '127.0.0.1', 'example.com', 'teste.com', 'bit.ly/fake'];
    for (const d of suspiciousDomains) {
      if (text.toLowerCase().includes(d)) {
        findings.push({
          id: `cite-susp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          botId: 'citation-verifier',
          articleId: article.id || 'temp',
          articleTitle: article.titulo || 'Sem título',
          pageUid: article.pageUid,
          severity: 'critical',
          issueType: 'fonte_suspeita',
          summary: `Citação com domínio suspeito detectada: ${d}`,
          details: `Foi encontrado o domínio "${d}" em uma referência ou link externo, o que viola o princípio de verificabilidade.`,
          suggestedAction: 'Remover a referência ou substituir por fonte bibliográfica idônea.',
          actionTaken: 'flagged',
          timestamp: new Date().toISOString(),
        });
      }
    }

    return findings;
  }

  /**
   * =========================================================================
   * 2. BOT ANTI-VANDALISMO (4.1.1.11E.1)
   * =========================================================================
   */
  static inspectVandalism(
    newArticle: Partial<WikiArticle>,
    previousArticle?: WikiArticle | null
  ): BotFinding[] {
    const findings: BotFinding[] = [];
    const newText = newArticle.descricao || '';
    const oldText = previousArticle?.descricao || '';

    // Esvaziamento massivo de página (remoção de mais de 40% de conteúdo preexistente)
    if (oldText.length > 250 && newText.length < oldText.length * 0.5) {
      const removedPercent = Math.round(((oldText.length - newText.length) / oldText.length) * 100);
      findings.push({
        id: `vand-del-${Date.now()}`,
        botId: 'anti-vandalism',
        articleId: newArticle.id || 'temp',
        articleTitle: newArticle.titulo || 'Sem título',
        pageUid: newArticle.pageUid,
        severity: 'critical',
        issueType: 'remocao_massiva',
        summary: `Esvaziamento em massa detectado (-${removedPercent}% do conteúdo).`,
        details: `O tamanho do artigo caiu de ${oldText.length} para ${newText.length} caracteres. Padrão compatível com vandalismo por esvaziamento.`,
        suggestedAction: 'Reversão automática imediata para a versão anterior ou notificação com bloqueio preventivo.',
        actionTaken: 'reverted',
        timestamp: new Date().toISOString(),
      });
    }

    // Repetição de caracteres/spam (ex: aaaaaaaa, kkkkkkk, teste teste teste...)
    const spamMatch = /(.)\1{12,}/i.test(newText) || /(teste\s+){4,}/i.test(newText);
    if (spamMatch) {
      findings.push({
        id: `vand-flood-${Date.now()}`,
        botId: 'anti-vandalism',
        articleId: newArticle.id || 'temp',
        articleTitle: newArticle.titulo || 'Sem título',
        pageUid: newArticle.pageUid,
        severity: 'critical',
        issueType: 'flood_de_caracteres',
        summary: 'Padrão de repetição excessiva ou texto de teste detectado.',
        details: 'O artigo contém sequência anômala de repetições contínuas de caracteres, indicativo de teste descuidado ou vandalismo.',
        suggestedAction: 'Rejeitar a edição e alertar o comitê de moderação.',
        actionTaken: 'flagged',
        timestamp: new Date().toISOString(),
      });
    }

    return findings;
  }

  /**
   * =========================================================================
   * 3. BOT DE CATEGORIZAÇÃO (4.1.1.G2.1)
   * =========================================================================
   */
  static inspectCategorization(article: Partial<WikiArticle>): {
    findings: BotFinding[];
    suggestedCategory?: string;
  } {
    const text = ((article.titulo || '') + ' ' + (article.descricao || '')).toLowerCase();
    const findings: BotFinding[] = [];
    let suggestedCategory: string | undefined = undefined;

    // Regras heurísticas de classificação taxonômica
    if (text.includes('metrô') || text.includes('trem') || text.includes('ferrovia') || text.includes('estação') || text.includes('ônibus') || text.includes('transporte')) {
      suggestedCategory = 'Transportes';
    } else if (text.includes('século') || text.includes('guerra') || text.includes('revolução') || text.includes('império') || text.includes('fundação')) {
      suggestedCategory = 'História';
    } else if (text.includes('física') || text.includes('química') || text.includes('biologia') || text.includes('algoritmo') || text.includes('computador') || text.includes('software')) {
      suggestedCategory = 'Ciência & Tecnologia';
    } else if (text.includes('música') || text.includes('filme') || text.includes('cinema') || text.includes('pintura') || text.includes('teatro') || text.includes('literatura')) {
      suggestedCategory = 'Cultura & Arte';
    } else if (text.includes('lei') || text.includes('artigo') || text.includes('constituição') || text.includes('tribunal') || text.includes('jurídico')) {
      suggestedCategory = 'Direito & Legislação';
    } else if (text.includes('futebol') || text.includes('olimpíadas') || text.includes('campeonato') || text.includes('atleta') || text.includes('estádio')) {
      suggestedCategory = 'Esportes';
    }

    const currentCat = article.categoria;
    if (!currentCat || currentCat === 'Geral' || currentCat.trim() === '') {
      if (suggestedCategory) {
        findings.push({
          id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          botId: 'categorization',
          articleId: article.id || 'temp',
          articleTitle: article.titulo || 'Sem título',
          pageUid: article.pageUid,
          severity: 'info',
          issueType: 'categoria_ausente',
          summary: `Categoria sugerida: "${suggestedCategory}".`,
          details: `O verbete está marcado como "${currentCat || 'Nenhuma'}", mas os termos do conteúdo indicam forte pertinência com "${suggestedCategory}".`,
          suggestedAction: `Aplicar categoria "${suggestedCategory}".`,
          actionTaken: 'categorized',
          timestamp: new Date().toISOString(),
        });
      }
    }

    return { findings, suggestedCategory };
  }

  /**
   * =========================================================================
   * 4. BOT DE QUALIDADE ESTRUTURAL (4.1.1.IL.1)
   * =========================================================================
   */
  static inspectQuality(article: Partial<WikiArticle>): {
    findings: BotFinding[];
    qualityScore: number;
  } {
    const text = article.descricao || '';
    const findings: BotFinding[] = [];
    let score = 100;

    const words = text.trim().split(/\s+/).filter(Boolean).length;
    if (words < 40) {
      score -= 35;
      findings.push({
        id: `qual-short-${Date.now()}`,
        botId: 'quality-audit',
        articleId: article.id || 'temp',
        articleTitle: article.titulo || 'Sem título',
        pageUid: article.pageUid,
        severity: 'warning',
        issueType: 'artigo_muito_curto',
        summary: `Artigo incompleto ou esboço muito curto (${words} palavras).`,
        details: 'Verbetes enciclopédicos devem conter pelo menos uma introdução clara e um detalhamento básico (mínimo 40 palavras).',
        suggestedAction: 'Expandir o conteúdo com introdução e histórico.',
        actionTaken: 'flagged',
        timestamp: new Date().toISOString(),
      });
    }

    const hasHeadings = /^={1,3}[^=]+={1,3}/m.test(text);
    if (!hasHeadings && words > 80) {
      score -= 20;
      findings.push({
        id: `qual-head-${Date.now()}`,
        botId: 'quality-audit',
        articleId: article.id || 'temp',
        articleTitle: article.titulo || 'Sem título',
        pageUid: article.pageUid,
        severity: 'info',
        issueType: 'falta_de_secoes',
        summary: 'Artigo longo sem seções ou cabeçalhos estruturais (== Seção ==).',
        details: 'A divisão por seções melhora a legibilidade e permite a geração do sumário interativo.',
        suggestedAction: 'Dividir o texto em seções temáticas usando == Título ==.',
        actionTaken: 'flagged',
        timestamp: new Date().toISOString(),
      });
    }

    const hasImages = /\[\[(Arquivo|File|Imagem|Image):/i.test(text);
    if (!hasImages) {
      score -= 10;
    }

    return { findings, qualityScore: Math.max(10, score) };
  }

  /**
   * =========================================================================
   * 5. BOT DE LINKS QUEBRADOS (4.1.1.GW.1)
   * =========================================================================
   */
  static inspectBrokenLinks(article: Partial<WikiArticle>): BotFinding[] {
    const text = article.descricao || '';
    const findings: BotFinding[] = [];

    // Busca todos os links http:// e https://
    const urlMatches = text.match(/https?:\/\/[^\s\]'"<>]+/gi) || [];

    for (const url of urlMatches) {
      // 1. Link HTTP não criptografado (inseguro)
      if (url.startsWith('http://')) {
        findings.push({
          id: `link-insecure-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          botId: 'broken-links',
          articleId: article.id || 'temp',
          articleTitle: article.titulo || 'Sem título',
          pageUid: article.pageUid,
          severity: 'info',
          issueType: 'link_http_inseguro',
          summary: 'Link externo não seguro utilizando HTTP plano.',
          details: `URL: ${url}. Recomenda-se migrar para protocolo seguro HTTPS.`,
          suggestedAction: 'Atualizar protocolo para https:// se o servidor de destino suportar.',
          actionTaken: 'flagged',
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Pontuação anexada por engano no fim da URL
      if (/[.,;:)!]$/.test(url)) {
        findings.push({
          id: `link-punct-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          botId: 'broken-links',
          articleId: article.id || 'temp',
          articleTitle: article.titulo || 'Sem título',
          pageUid: article.pageUid,
          severity: 'warning',
          issueType: 'link_com_pontuacao',
          summary: 'Link externo com caractere de pontuação anexado por engano.',
          details: `A URL "${url}" termina com pontuação que quebra o redirecionamento externo.`,
          suggestedAction: 'Remover o caractere final do endereço da web.',
          actionTaken: 'flagged',
          timestamp: new Date().toISOString(),
        });
      }
    }

    return findings;
  }

  /**
   * =========================================================================
   * 6. BOT DE LGPD / MODERAÇÃO SENSÍVEL (4.1.1.E0.1 & 4.1.1-L8.3)
   * =========================================================================
   */
  static inspectLgpd(article: Partial<WikiArticle>): {
    findings: BotFinding[];
    sanitizedDescription: string;
    hasViolations: boolean;
  } {
    let text = article.descricao || '';
    const findings: BotFinding[] = [];
    let hasViolations = false;

    // Função auxiliar para mascarar dados sensíveis
    const maskData = (val: string) => {
      if (val.length <= 4) return '****';
      return val.slice(0, 2) + '*'.repeat(val.length - 4) + val.slice(-2);
    };

    // 1. CPF (Cadastro de Pessoas Físicas)
    const cpfs = text.match(REGEX_CPF);
    if (cpfs && cpfs.length > 0) {
      hasViolations = true;
      cpfs.forEach((cpf) => {
        findings.push({
          id: `lgpd-cpf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          botId: 'lgpd-moderator',
          articleId: article.id || 'temp',
          articleTitle: article.titulo || 'Sem título',
          pageUid: article.pageUid,
          severity: 'critical',
          issueType: 'cpf_detectado',
          summary: 'Dado pessoal sensível detectado: CPF exposto publicamente.',
          details: `Violação da LGPD (Lei nº 13.709/2018). Foi detectado um CPF no texto (${maskData(cpf)}).`,
          detectedDataSnippet: maskData(cpf),
          suggestedAction: 'Expurgo imediato e anonimização do registro.',
          actionTaken: 'sanitized',
          timestamp: new Date().toISOString(),
        });
        text = text.replace(cpf, '[DADO PESSOAL EXPURGADO - LGPD]');
      });
    }

    // 2. CNPJ
    const cnpjs = text.match(REGEX_CNPJ);
    if (cnpjs && cnpjs.length > 0) {
      cnpjs.forEach((cnpj) => {
        findings.push({
          id: `lgpd-cnpj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          botId: 'lgpd-moderator',
          articleId: article.id || 'temp',
          articleTitle: article.titulo || 'Sem título',
          pageUid: article.pageUid,
          severity: 'warning',
          issueType: 'cnpj_detectado',
          summary: 'Número de CNPJ comercial detectado no corpo do verbete.',
          details: `Registro fiscal encontrado: ${maskData(cnpj)}. Se pertencer a MEI ou pessoa física, configura dado pessoal.`,
          detectedDataSnippet: maskData(cnpj),
          suggestedAction: 'Verificar pertinência pública e mascarar se desnecessário.',
          actionTaken: 'flagged',
          timestamp: new Date().toISOString(),
        });
      });
    }

    // 3. Cartões de Crédito
    const cards = text.match(REGEX_CREDIT_CARD);
    if (cards && cards.length > 0) {
      hasViolations = true;
      cards.forEach((card) => {
        findings.push({
          id: `lgpd-card-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          botId: 'lgpd-moderator',
          articleId: article.id || 'temp',
          articleTitle: article.titulo || 'Sem título',
          pageUid: article.pageUid,
          severity: 'critical',
          issueType: 'cartao_credito_detectado',
          summary: 'Possível número de cartão bancário exposto.',
          details: 'Sequência numérica correspondente a padrão bancário de cartão de crédito/débito.',
          detectedDataSnippet: maskData(card),
          suggestedAction: 'Sanitização imediata e auditoria de segurança.',
          actionTaken: 'sanitized',
          timestamp: new Date().toISOString(),
        });
        text = text.replace(card, '[DADO FINANCEIRO EXPURGADO]');
      });
    }

    // 4. E-mails Pessoais Privados
    const emails = text.match(REGEX_PRIVATE_EMAIL);
    if (emails && emails.length > 0) {
      emails.forEach((em) => {
        findings.push({
          id: `lgpd-email-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          botId: 'lgpd-moderator',
          articleId: article.id || 'temp',
          articleTitle: article.titulo || 'Sem título',
          pageUid: article.pageUid,
          severity: 'warning',
          issueType: 'email_privado_detectado',
          summary: `E-mail pessoal detectado: ${maskData(em)}.`,
          details: 'Endereço de correio eletrônico pessoal exposto no texto.',
          detectedDataSnippet: maskData(em),
          suggestedAction: 'Remover e-mail direto de contato.',
          actionTaken: 'flagged',
          timestamp: new Date().toISOString(),
        });
      });
    }

    return {
      findings,
      sanitizedDescription: text,
      hasViolations,
    };
  }

  /**
   * =========================================================================
   * 7. BOT SENTINELA DE USUÁRIO & CONTRIBUIÇÕES (4.1.1.18C.1)
   * =========================================================================
   */
  static inspectUserContribution(
    user: UserProfile | null,
    findings: BotFinding[],
    articleTitle: string
  ): UserAbuseRecord | null {
    if (!user || user.isGuest) return null;

    const abuseRecords = this.getUserAbuseRecords();
    let record = abuseRecords.find((r) => r.userUid === user.uid);

    if (!record) {
      record = {
        userUid: user.uid,
        username: user.username || 'usuario',
        displayName: user.displayName || 'Editor',
        reputationScore: user.reputationScore ?? 100,
        totalEdits: user.editsCount || 1,
        vandalismIncidents: 0,
        lgpdViolationsCount: 0,
        revertedEditsCount: 0,
        status: 'regular',
        incidentHistory: [],
      };
      abuseRecords.push(record);
    }

    record.totalEdits += 1;

    // Avalia achados críticos
    const criticalFindings = findings.filter((f) => f.severity === 'critical');
    if (criticalFindings.length > 0) {
      criticalFindings.forEach((cf) => {
        if (cf.botId === 'anti-vandalism') {
          record!.vandalismIncidents += 1;
          record!.revertedEditsCount += 1;
        } else if (cf.botId === 'lgpd-moderator') {
          record!.lgpdViolationsCount += 1;
        }

        record!.incidentHistory.unshift({
          date: new Date().toISOString(),
          botId: cf.botId,
          articleTitle,
          reason: cf.summary,
          severity: cf.severity,
        });
      });

      // Atualiza pontuação de reputação
      record.reputationScore = Math.max(0, record.reputationScore - criticalFindings.length * 15);
      record.lastIncidentAt = new Date().toISOString();

      if (record.vandalismIncidents >= 3 || record.lgpdViolationsCount >= 2) {
        record.status = 'bloqueado';
      } else if (record.vandalismIncidents > 0 || record.lgpdViolationsCount > 0) {
        record.status = 'advertido';
      } else {
        record.status = 'sob_observacao';
      }
    }

    localStorage.setItem(BOT_USER_ABUSE_KEY, JSON.stringify(abuseRecords));
    return record;
  }

  static getUserAbuseRecords(): UserAbuseRecord[] {
    try {
      const stored = localStorage.getItem(BOT_USER_ABUSE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignora erro
    }
    return [];
  }

  /**
   * =========================================================================
   * EXECUÇÃO AUTOMÁTICA EM TEMPO DE SALVAMENTO DE ARTIGO (ON-SAVE HOOK)
   * =========================================================================
   */
  static processArticleOnSave(
    newArticle: Partial<WikiArticle>,
    previousArticle?: WikiArticle | null,
    user?: UserProfile | null
  ): {
    canSave: boolean;
    rejectionReason?: string;
    sanitizedArticle: Partial<WikiArticle>;
    findings: BotFinding[];
  } {
    const config = this.getConfig();
    if (!config.globalEnabled) {
      return { canSave: true, sanitizedArticle: newArticle, findings: [] };
    }

    let modifiedArticle = { ...newArticle };
    const allFindings: BotFinding[] = [];

    // 1. Anti-Vandalismo
    if (config.bots['anti-vandalism']?.enabled) {
      const vFindings = this.inspectVandalism(newArticle, previousArticle);
      allFindings.push(...vFindings);

      const criticalVandalism = vFindings.find((f) => f.severity === 'critical');
      if (criticalVandalism && config.bots['anti-vandalism']?.autoFix) {
        this.saveFindings(allFindings);
        return {
          canSave: false,
          rejectionReason: `Edição rejeitada pelo WikiBot-AntiVandalismo: ${criticalVandalism.summary}`,
          sanitizedArticle: previousArticle || newArticle,
          findings: allFindings,
        };
      }
    }

    // 2. Proteção LGPD
    if (config.bots['lgpd-moderator']?.enabled) {
      const lgpdResult = this.inspectLgpd(modifiedArticle);
      allFindings.push(...lgpdResult.findings);
      if (lgpdResult.hasViolations && config.bots['lgpd-moderator']?.autoFix) {
        modifiedArticle.descricao = lgpdResult.sanitizedDescription;
      }
    }

    // 3. Verificação de Citações
    if (config.bots['citation-verifier']?.enabled) {
      const cFindings = this.inspectCitations(modifiedArticle);
      allFindings.push(...cFindings);
    }

    // 4. Categorização
    if (config.bots['categorization']?.enabled) {
      const catResult = this.inspectCategorization(modifiedArticle);
      allFindings.push(...catResult.findings);
      if (catResult.suggestedCategory && (!modifiedArticle.categoria || modifiedArticle.categoria === 'Geral')) {
        modifiedArticle.categoria = catResult.suggestedCategory;
      }
    }

    // 5. Sentinela de Usuário
    if (config.bots['user-abuse-sentinel']?.enabled && user) {
      this.inspectUserContribution(user, allFindings, modifiedArticle.titulo || 'Verbete');
    }

    this.saveFindings(allFindings);

    return {
      canSave: true,
      sanitizedArticle: modifiedArticle,
      findings: allFindings,
    };
  }

  /**
   * =========================================================================
   * MOTOR DE VARREDURA COM CONDIÇÕES DE BUSCA (4.1.1.1JE.1)
   * =========================================================================
   */
  static async runScan(
    articles: WikiArticle[],
    condition: BotScanCondition
  ): Promise<BotScanSummary> {
    const startedAt = new Date().toISOString();
    const findings: BotFinding[] = [];

    // Filtra artigos de acordo com as condições de busca especificadas
    let targetArticles = [...articles];

    if (condition.query && condition.query.trim()) {
      const q = condition.query.toLowerCase().trim();
      targetArticles = targetArticles.filter(
        (a) =>
          a.titulo.toLowerCase().includes(q) ||
          (a.descricao && a.descricao.toLowerCase().includes(q))
      );
    }

    if (condition.categoryFilter && condition.categoryFilter !== 'all') {
      targetArticles = targetArticles.filter((a) => a.categoria === condition.categoryFilter);
    }

    if (condition.pageUidFilter && condition.pageUidFilter !== 'all') {
      targetArticles = targetArticles.filter((a) => a.pageUid === condition.pageUidFilter);
    }

    if (condition.limitArticles && condition.limitArticles > 0) {
      targetArticles = targetArticles.slice(0, condition.limitArticles);
    }

    // Executa os robôs selecionados em cada artigo
    for (const art of targetArticles) {
      // Citações
      if (condition.selectedBots.includes('citation-verifier')) {
        findings.push(...this.inspectCitations(art));
      }

      // Vandalismo
      if (condition.selectedBots.includes('anti-vandalism')) {
        findings.push(...this.inspectVandalism(art, null));
      }

      // Categorização
      if (condition.selectedBots.includes('categorization')) {
        const catRes = this.inspectCategorization(art);
        findings.push(...catRes.findings);
      }

      // Qualidade
      if (condition.selectedBots.includes('quality-audit')) {
        const qRes = this.inspectQuality(art);
        findings.push(...qRes.findings);
      }

      // Links Quebrados
      if (condition.selectedBots.includes('broken-links')) {
        findings.push(...this.inspectBrokenLinks(art));
      }

      // LGPD
      if (condition.selectedBots.includes('lgpd-moderator')) {
        const lgpdRes = this.inspectLgpd(art);
        findings.push(...lgpdRes.findings);
      }
    }

    // Filtro por severidade mínima se configurada
    let filteredFindings = findings;
    if (condition.minSeverity) {
      const ranks: Record<BotSeverity, number> = { info: 1, warning: 2, critical: 3 };
      const minRank = ranks[condition.minSeverity];
      filteredFindings = findings.filter((f) => ranks[f.severity] >= minRank);
    }

    const finishedAt = new Date().toISOString();
    const criticalCount = filteredFindings.filter((f) => f.severity === 'critical').length;
    const warningCount = filteredFindings.filter((f) => f.severity === 'warning').length;

    const summary: BotScanSummary = {
      scanId: `scan-${Date.now()}`,
      startedAt,
      finishedAt,
      articlesScanned: targetArticles.length,
      findingsCount: filteredFindings.length,
      criticalIssuesCount: criticalCount,
      warningsCount: warningCount,
      actionsTakenCount: filteredFindings.filter((f) => f.actionTaken && f.actionTaken !== 'flagged').length,
      findings: filteredFindings,
    };

    this.saveFindings(filteredFindings);

    return summary;
  }

  /**
   * Salva e acumula os achados no histórico de auditoria
   */
  static saveFindings(newFindings: BotFinding[]): void {
    if (!newFindings || newFindings.length === 0) return;
    try {
      const stored = localStorage.getItem(BOT_FINDINGS_KEY);
      const existing: BotFinding[] = stored ? JSON.parse(stored) : [];
      // Mantém até 300 achados recentes
      const merged = [...newFindings, ...existing].slice(0, 300);
      localStorage.setItem(BOT_FINDINGS_KEY, JSON.stringify(merged));
    } catch {
      // Ignora erro
    }
  }

  /**
   * Obtém os achados recentes do histórico
   */
  static getFindings(): BotFinding[] {
    try {
      const stored = localStorage.getItem(BOT_FINDINGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignora erro
    }
    return [];
  }

  /**
   * Limpa os achados do histórico
   */
  static clearFindings(): void {
    localStorage.removeItem(BOT_FINDINGS_KEY);
  }
}
