import {
  WikiArticle,
  WikiPage,
  NotificationItem,
  UserProfile,
  UserTalkMessage,
  UserAuditLog,
  SystemUpdateEntry,
  SockpuppetCase,
  CheckUserLogEntry,
  CheckUserAccountDetails,
  UnblockRequest,
  PromotionRequest,
  AdminContactTicket,
  ArbitrationCase,
  ArbitrationCommitteeMember,
} from '../types';

/**
 * ============================================================================
 * WIKIZERO - DADOS BASE LIMPOS (SEM DADOS MOCK / APENAS BANCO DE DADOS FIREBASE)
 * ============================================================================
 * Todas as informações pré-definidas de exemplo criadas pelo AI Studio foram
 * removidas para garantir que 100% dos dados exibidos e consultados venham
 * exclusivamente do banco de dados Firebase Firestore em tempo real.
 */

export const INITIAL_COMMUNITY_USERS: UserProfile[] = [];
export const INITIAL_USER_TALK_MESSAGES: UserTalkMessage[] = [];
export const INITIAL_USER_AUDIT_LOGS: UserAuditLog[] = [];
export const INITIAL_CHECKUSER_LOGS: CheckUserLogEntry[] = [];
export const INITIAL_SOCKPUPPET_CASES: SockpuppetCase[] = [];
export const MOCK_CHECKUSER_ACCOUNTS: Record<string, CheckUserAccountDetails> = {};
export const INITIAL_PAGES: WikiPage[] = [];
export const INITIAL_ARTICLES: WikiArticle[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_SYSTEM_UPDATES: SystemUpdateEntry[] = [];
export const INITIAL_UNBLOCK_REQUESTS: UnblockRequest[] = [];
export const INITIAL_PROMOTION_REQUESTS: PromotionRequest[] = [];
export const INITIAL_ADMIN_TICKETS: AdminContactTicket[] = [];
export const INITIAL_ARBITRATION_MEMBERS: ArbitrationCommitteeMember[] = [];
export const INITIAL_ARBITRATION_CASES: ArbitrationCase[] = [];
