/**
 * @file src/types/bots.ts
 * @description Definições de tipos para o Agente de Bots, Usuários Bots,
 * Varreduras Automatizadas e Verificadores Especializados da WikiZero.
 */

export type WikiBotId =
  | 'citation-verifier'    // 4.1.1.WV.1: Bot de verificação de citações (Gemini)
  | 'anti-vandalism'       // 4.1.1.11E.1: Bot anti-vandalismo (remoções massivas, spam, reversão)
  | 'categorization'       // 4.1.1.G2.1: Bot de categorização (sugere ou aplica categorias)
  | 'quality-audit'        // 4.1.1.IL.1: Bot de qualidade estrutural (intro, seções, mídia)
  | 'broken-links'         // 4.1.1.GW.1: Bot de links quebrados (links externos e formatação)
  | 'lgpd-moderator'       // 4.1.1.E0.1 & 4.1.1-L8.3: Bot LGPD (CPF, CNPJ, RG, telefones, dados sensíveis)
  | 'user-abuse-sentinel'; // 4.1.1.18C.1: Sentinela de verificação de usuários e abusos de contribuição

export type BotSeverity = 'info' | 'warning' | 'critical';

export type BotActionTaken =
  | 'flagged'     // Apenas sinalizado no relatório
  | 'notified'    // Notificação enviada para admins/usuário
  | 'reverted'    // Edição revertida automaticamente
  | 'categorized' // Categoria auto-atribuída
  | 'sanitized'   // Dado sensível expurgado/mascarado
  | 'warned'      // Usuário advertido
  | 'quarantined';// Artigo colocado em quarentena

export interface WikiBotUser {
  id: string; // Ex: 'bot-citation-verifier'
  botId: WikiBotId;
  username: string; // Ex: 'WikiBot-Citações'
  displayName: string;
  avatarIcon: string;
  enabled: boolean;
  role: 'bot';
  permissions: {
    canEdit: boolean;
    canFlag: boolean;
    canRevert: boolean;
    canSanitize: boolean;
    canNotifyAdmins: boolean;
  };
  totalActionsCount: number;
  lastRunAt?: string;
  description: string;
  triggerMode: 'on-edit' | 'scheduled' | 'manual' | 'hybrid';
}

export interface BotFinding {
  id: string;
  botId: WikiBotId;
  articleId: string;
  articleTitle: string;
  pageUid?: string;
  severity: BotSeverity;
  issueType: string;
  summary: string;
  details?: string;
  detectedDataSnippet?: string; // Trecho relevante (ex: CPF mascarado ***.456.789-**)
  suggestedAction?: string;
  actionTaken?: BotActionTaken;
  timestamp: string;
  reviewedByAdmin?: boolean;
}

export interface BotScanCondition {
  query?: string;
  categoryFilter?: string;
  pageUidFilter?: string;
  selectedBots: WikiBotId[];
  minSeverity?: BotSeverity;
  limitArticles?: number;
  autoApplyFixes?: boolean;
}

export interface BotScanSummary {
  scanId: string;
  startedAt: string;
  finishedAt: string;
  articlesScanned: number;
  findingsCount: number;
  criticalIssuesCount: number;
  warningsCount: number;
  actionsTakenCount: number;
  findings: BotFinding[];
}

export interface BotAgentConfig {
  globalEnabled: boolean;
  bots: Record<
    WikiBotId,
    {
      enabled: boolean;
      autoFix: boolean;
      notifyAdmins: boolean;
      thresholdMassiveDeletionPercent: number; // Ex: 40% de remoção é vandalismo
      geminiVerificationEnabled: boolean;
      intervalMinutes?: number;
    }
  >;
  abuseThresholds: {
    maxEditsPerHour: number;
    maxWarningsBeforeBlock: number;
    revertOnCriticalLgpd: boolean;
  };
  updatedAt: string;
  updatedBy: string;
}

export interface UserAbuseRecord {
  userUid: string;
  username: string;
  displayName: string;
  reputationScore: number;
  totalEdits: number;
  vandalismIncidents: number;
  lgpdViolationsCount: number;
  revertedEditsCount: number;
  status: 'regular' | 'sob_observacao' | 'advertido' | 'bloqueado';
  lastIncidentAt?: string;
  incidentHistory: Array<{
    date: string;
    botId: WikiBotId;
    articleTitle: string;
    reason: string;
    severity: BotSeverity;
  }>;
}
