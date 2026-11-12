import { ResearchEthicsCommitteeInfo, EthicsApprovalStatus } from './types/ethics';

export type { ResearchEthicsCommitteeInfo, EthicsApprovalStatus };

export interface WikiArticle {
  id: string;
  pageUid: string;
  titulo: string;
  descricao: string; // Wikitext / Markdown content
  resumo?: string;
  categoria?: string;
  idioma?: string;
  autor?: string;
  autorEmail?: string;
  autorUid?: string;
  dataCriacao: string;
  dataEdicao?: string;
  visualizacoes?: number;
  versao?: number;
  tags?: string[];
  historico?: ArticleHistoryItem[];
  // Moderação e Proteção contra edição de usuários comuns
  isLocked?: boolean;
  lockedBy?: string;
  lockedByUid?: string;
  lockedAt?: string;
  lockReason?: string;
  protectionLevel?: 'moderators_only' | 'all';
  // Comitê de Ética em Pesquisa com Seres Humanos (CEP / CONEP)
  comiteEtica?: ResearchEthicsCommitteeInfo;
}

export interface ArticleHistoryItem {
  id: string;
  data: string;
  autor: string;
  autorUid?: string;
  autorEmail?: string;
  resumo: string;
  tamanho: number;
  deltaBytes?: number;
  versao?: number;
  isMinor?: boolean;
  conteudo?: string;
}

export interface WikiPage {
  uid: string;
  titulo: string;
  descricao: string;
  categoria: string;
  autor?: string;
  criadoEm: string;
  atualizadoEm?: string;
  articleCount?: number;
  icon?: string;
  tags?: string[];
  status?: 'ativo' | 'rascunho' | 'arquivado';
  // Moderação e Proteção da Coleção contra novos artigos/edições de usuários comuns
  isLocked?: boolean;
  lockedBy?: string;
  lockedByUid?: string;
  lockedAt?: string;
  lockReason?: string;
}

export type UserRole = 'admin' | 'moderador' | 'editor' | 'leitor' | 'convidado';

export interface UserPermissions {
  canEdit: boolean;
  canCreate: boolean;
  canTalk: boolean;
  canDelete: boolean;
  canGrantBarnstars: boolean;
}

export interface UserBarnstar {
  id: string;
  title: string;
  description: string;
  icon: string;
  awardedBy: string;
  awardedByUid?: string;
  awardedAt: string;
}

export interface UserboxItem {
  id: string;
  title: string;
  text: string;
  icon: string;
  bgClass?: string;
  borderClass?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  avatarRemovedByAdmin?: boolean;
  avatarRemovedAt?: string;
  avatarRemovedReason?: string;
  avatarRemovedBy?: string;
  isGuest: boolean;
  isBanned: boolean;
  banReason?: string;
  banExpiresAt?: string;
  banType?: 'permanente' | 'temporario' | 'advertencia';
  role: UserRole;
  group?: string;
  bio?: string; // Wikitext supported!
  location?: string;
  website?: string;
  permissions?: UserPermissions;
  barnstars?: UserBarnstar[];
  userboxes?: UserboxItem[];
  reputationScore?: number;
  dataConsentimento?: string;
  ipConsentimento?: string;
  birthdate?: string;
  createdAt: string;
  lastActive?: string;
  isOnline?: boolean;
  warningCount?: number;
  editsCount?: number;
  isGeminiPremium?: boolean;
  geminiPlan?: 'free' | 'premium';
  geminiUsage?: UserGeminiUsage;
  recentActivity?: UserActivityLogEntry[];
  // LGPD Art. 18, VI - Exclusão Definitiva de Conta e Anonimização
  accountDeletedLGPD?: boolean;
  deletedAtLGPD?: string;
  genericPseudonymLGPD?: string;
  deletionProcessedBy?: string;
  deletionLegalJustification?: string;
  previousAccountDeletedLGPD?: boolean;
  previousDeletedAtLGPD?: string;
}

export interface UserGeminiUsage {
  chatsUsed: number;
  imageUploadsUsed: number;
  notebookRunsUsed: number;
  dateKey: string;
}

export interface GeminiQuotaInfo {
  isPremium: boolean;
  chatsLimit: number;
  chatsUsed: number;
  chatsRemaining: number;
  imagesLimit: number;
  imagesUsed: number;
  imagesRemaining: number;
  notebookLimit: number;
  notebookUsed: number;
  notebookRemaining: number;
  canChat: boolean;
  canUploadImage: boolean;
  canUseNotebook: boolean;
}

export interface UserActivityLogEntry {
  id: string;
  type: 'create' | 'edit' | 'revert' | 'admin';
  articleId?: string;
  articleTitle: string;
  pageUid?: string;
  date: string;
  summary: string;
  deltaBytes?: number;
  isMinor?: boolean;
}

export interface DailyEditLimitStatus {
  isExempt: boolean; // Moderadores e Administradores têm edições ilimitadas
  limit: number; // 5 para editores normais, Infinity para isentos
  count: number; // Edições realizadas no dia atual
  remaining: number; // Edições restantes no dia
  allowed: boolean; // Se o usuário pode realizar nova edição agora
  dateKey: string; // Formato YYYY-MM-DD da data corrente
  resetTimeMessage: string; // Mensagem informativa sobre a renovação à meia-noite
}

export interface UserTalkMessage {
  id: string;
  targetUserUid: string;
  targetUsername: string;
  senderUid?: string;
  senderName: string;
  senderEmail?: string;
  senderRole?: UserRole;
  titulo: string;
  conteudo: string;
  tipo: 'geral' | 'aviso_admin' | 'barnstar' | 'duvida' | 'boas_vindas';
  data: string;
  status: 'aberto' | 'em_discussao' | 'resolvido' | 'arquivado';
  respostas: TalkReply[];
}

export interface UserAuditLog {
  id: string;
  targetUserUid: string;
  targetUsername: string;
  action:
    | 'role_change'
    | 'ban_user'
    | 'unban_user'
    | 'warning_issued'
    | 'permission_change'
    | 'profile_reset'
    | 'barnstar_awarded'
    | 'name_change'
    | 'lgpd_name_change'
    | 'checkuser_query'
    | 'sockpuppet_flagged'
    | 'sockpuppet_unflagged'
    | 'unblock_request_evaluated'
    | 'unblock_request_submitted'
    | 'promotion_created'
    | 'promotion_voted'
    | 'promotion_concluded'
    | 'vpn_login_blocked'
    | 'lgpd_deletion_requested'
    | 'lgpd_account_deletion'
    | 'lgpd_deletion_rejected'
    | 'lgpd_reidentified_google_uid'
    | 'bureaucrat_flag_change'
    | 'bureaucrat_decree'
    | 'moderator_patrol_action'
    | 'google_user_registered'
    | 'user_registered'
    | 'avatar_lgpd_removal';
  performedBy: string;
  performedByRole: string;
  details: string;
  date: string;
}

export type LgpdDeletionRequestStatus = 'pendente' | 'executada' | 'rejeitada' | 'cancelada';

export interface LgpdAccountDeletionRequest {
  id: string;
  userUid: string;
  originalDisplayName: string;
  originalUsername: string;
  originalEmail?: string;
  userReason?: string;
  requestedAt: string;
  status: LgpdDeletionRequestStatus;

  // Detalhes da Execução Administrativa
  processedAt?: string;
  processedByUid?: string;
  processedByName?: string;
  genericPseudonymAssigned?: string;
  adminNotes?: string;
  rejectionReason?: string;
  contributionsAnonymizedCount?: {
    articlesCreated: number;
    revisionsUpdated: number;
    recentChangesUpdated?: number;
    pagesUpdated?: number;
  };
}

export interface CheckUserLogEntry {
  id: string;
  target: string;
  targetType: 'username' | 'ip' | 'cidr';
  reason: string;
  performedBy: string;
  performedByRole: string;
  timestamp: string;
  resultsFound: number;
}

export interface SockpuppetCase {
  id: string;
  caseNumber: string;
  title: string;
  masterAccount: string;
  masterAccountUid?: string;
  suspectedAccounts: string[];
  status: 'aberto' | 'em_analise' | 'confirmado' | 'arquivado_inocente';
  evidenceSummary: string;
  openedBy: string;
  openedAt: string;
  closedAt?: string;
  conclusions?: string;
  similarityScore: number;
  technicalMatches: {
    ipMatch: boolean;
    userAgentMatch: boolean;
    temporalMatch: boolean;
    stylisticMatch: boolean;
  };
  sharedIps?: string[];
  sharedArticles?: string[];
}

export interface CheckUserAccountDetails {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
  banReason?: string;
  isSockpuppet?: boolean;
  sockpuppetOf?: string;
  createdAt: string;
  lastActive: string;
  reputationScore?: number;
  ipAddresses: {
    ip: string;
    isp: string;
    location: string;
    lastSeen: string;
    usageCount: number;
  }[];
  userAgents: {
    browser: string;
    os: string;
    device: string;
    raw: string;
    lastSeen: string;
  }[];
  editedArticles: {
    articleId: string;
    articleTitle: string;
    timestamp: string;
    summary: string;
  }[];
  coincidingEditsWithTarget?: {
    articleTitle: string;
    targetEditTime: string;
    suspectEditTime: string;
    diffMinutes: number;
  }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
  type: 'info' | 'success' | 'warning' | 'edit';
}

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
  timestamp: string;
  version: string;
}

export interface LgpdNotificationPreferences {
  notifyOnTermsAccepted: boolean;
  notifyOnPrivacyUpdate: boolean;
  notifyOnDataPortability: boolean;
  notifyOnAccountChanges: boolean;
}

export interface TalkReply {
  id: string;
  autor: string;
  autorEmail?: string;
  autorRole?: string;
  conteudo: string;
  data: string;
  upvotes?: number;
}

export interface TalkThread {
  id: string;
  articleId: string;
  titulo: string;
  autor: string;
  autorEmail?: string;
  autorRole?: string;
  data: string;
  conteudo: string;
  status: 'aberto' | 'em_discussao' | 'resolvido' | 'consenso';
  respostas: TalkReply[];
}

export interface ArticleRatingData {
  articleId: string;
  averageScore: number;
  totalVotes: number;
  userScore?: number;
  feedbacks?: { autor: string; comentario: string; nota: number; data: string }[];
}

export interface WatchlistItem {
  id?: string;
  userId?: string;
  pageId?: string;
  createdAt?: string;
  // Propriedades legadas de retrocompatibilidade
  articleId?: string;
  articleTitle?: string;
  pageUid?: string;
  dataAdicionado?: string;
}

export interface RecentChangeEntry {
  id: string;
  type: 'new_article' | 'edit_article' | 'new_collection' | 'minor_edit';
  articleId?: string;
  articleTitle: string;
  pageUid: string;
  pageTitle?: string;
  autor: string;
  autorEmail?: string;
  autorUid?: string;
  autorRole?: string;
  data: string;
  resumo: string;
  tamanho: number;
  deltaBytes: number;
  versao?: number;
  idioma?: string;
  isMinor?: boolean;
  isBot?: boolean;
}

export interface SystemUpdateEntry {
  id: string;
  version: string;
  title: string;
  date: string;
  category: 'feature' | 'improvement' | 'security' | 'mobile' | 'backend' | 'design' | 'compliance' | 'fix';
  author: string;
  authorRole?: string;
  summary: string;
  highlights: string[];
  badge?: string;
  commitHash?: string;
  affectedComponents?: string[];
  isLatest?: boolean;
}

export type DeviceMode = 'auto' | 'mobile' | 'desktop' | 'tv';

export type UnblockRequestStatus = 'pendente' | 'em_analise' | 'aprovado' | 'recusado' | 'arquivado';

export type UnblockCategory =
  | 'guerra_edicao'
  | 'vandalismo_acidental'
  | 'bloqueio_ip_compartilhado'
  | 'fantoche_falso_positivo'
  | 'revisao_lgpd_marco_civil'
  | 'comportamento_inadequado'
  | 'outro';

export interface UnblockAppealComment {
  id: string;
  author: string;
  authorRole: UserRole | string;
  authorUid?: string;
  text: string;
  timestamp: string;
  isInternalModeratorNote?: boolean;
}

export interface UnblockRequest {
  id: string;
  userUid: string;
  username: string;
  displayName: string;
  email?: string;
  userRoleAtBan: UserRole;
  blockReason: string;
  blockedBy: string;
  blockedAt: string;
  requestedAt: string;
  category: UnblockCategory;
  appealJustification: string;
  commitmentToGuidelines: string;
  ipAddress?: string;
  status: UnblockRequestStatus;
  urgency: 'alta' | 'media' | 'baixa';
  reviewedBy?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  resolutionDecision?: 'unblock_full' | 'unblock_probationary' | 'rejected' | 'requested_more_info';
  resolutionNotes?: string;
  comments: UnblockAppealComment[];
  linkedSockpuppetCaseId?: string;
  checkUserSummary?: {
    riskScore: number;
    matchedAccountsCount: number;
    sameIpAsAccounts: string[];
  };
}

export type PromotionTargetRole = 'moderador' | 'admin';

export type PromotionVoteType = 'a_favor' | 'contra' | 'neutro';

export type PromotionRequestStatus = 'em_votacao' | 'aprovada' | 'rejeitada' | 'cancelada';

export interface PromotionVote {
  id: string;
  voterUid: string;
  voterUsername: string;
  voterDisplayName: string;
  voterRole: UserRole;
  vote: PromotionVoteType;
  reason: string; // Motivo obrigatório da posição a favor ou contra
  timestamp: string;
}

export interface PromotionRequest {
  id: string;
  candidateUid: string;
  candidateUsername: string;
  candidateDisplayName: string;
  candidateEmail?: string;
  currentRole: UserRole;
  targetRole: PromotionTargetRole;
  nominatedBy: string;
  nominatedByUid?: string;
  isSelfNomination: boolean;
  statement: string; // Motivação e justificativa do candidato
  contributionsSummary: string; // Resumo de contribuições e atividades na WikiZero
  requestedAt: string;
  closedAt?: string;
  closedBy?: string;
  closedByRole?: string;
  status: PromotionRequestStatus;
  maxVotes: number; // Limite máximo de 10 votos
  votes: PromotionVote[];
  resolutionNotes?: string;
  requiredApprovalRate: number; // % mínima necessária (ex: 60% para mod, 75% para admin)
}

export type AdminTicketCategory =
  | 'vandalismo'
  | 'protecao_pagina'
  | 'conflito_editorial'
  | 'duvida_politicas'
  | 'erro_tecnico'
  | 'lgpd_privacidade'
  | 'outros';

export type AdminTicketPriority = 'baixa' | 'normal' | 'alta' | 'urgente';

export type AdminTicketStatus = 'aberto' | 'em_analise' | 'respondido' | 'resolvido' | 'arquivado';

export interface AdminTicketMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderRole: UserRole;
  isStaff: boolean;
  message: string;
  timestamp: string;
  attachments?: string[];
}

export interface AdminContactTicket {
  id: string;
  subject: string;
  category: AdminTicketCategory;
  priority: AdminTicketPriority;
  status: AdminTicketStatus;
  userUid: string;
  userUsername: string;
  userDisplayName: string;
  userEmail?: string;
  userRole: UserRole;
  isGuestSubmission?: boolean;
  relatedArticleTitle?: string;
  relatedArticleId?: string;
  description: string;
  evidenceLinks?: string[];
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  assignedAdmin?: string;
  assignedAdminUid?: string;
  resolutionSummary?: string;
  messages: AdminTicketMessage[];
}

export type ViewMode =
  | 'hub'
  | 'article'
  | 'search'
  | 'editor'
  | 'create-page'
  | 'create-article'
  | 'recent-changes'
  | 'special-pages'
  | 'watchlist'
  | 'user-page'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-council'
  | 'admin-data-removal'
  | 'admin-extensions'
  | 'admin-firebase'
  | 'checkuser'
  | 'unblock-requests'
  | 'promotion-requests'
  | 'contact-admin'
  | 'emergency-contact'
  | 'arbitration'
  | 'security'
  | 'donation'
  | 'privacy'
  | 'terms'
  | 'editing-ethics'
  | 'mydata'
  | 'site-updates'
  | 'beta'
  | 'offline'
  | 'upload'
  | 'file-page'
  | 'files-list'
  | 'smart-tv'
  | 'appearance'
  | 'comparison'
  | 'wazzimagiygg'
  | 'gemini-notebook'
  | 'ucoc'
  | 'vpn-checker'
  | 'not-found'
  | 'tools'
  | 'library'
  | 'academic'
  | 'news';

// ==========================================
// SISTEMA DE CONSELHO DE ARBITRAGEM (ARBCOM)
// ==========================================

export type ArbitrationCaseTargetType = 'usuario' | 'moderador' | 'administrador';

export type ArbitrationCaseCategory =
  | 'abuso_admin'
  | 'abuso_moderador'
  | 'conflito_comunitario'
  | 'guerra_edicao_cronica'
  | 'assedio_conduta'
  | 'revisao_bloqueio_indevido'
  | 'quebra_de_sigilo_lgpd'
  | 'outro';

export type ArbitrationCaseStatus =
  | 'aberto'
  | 'em_instrucao'
  | 'deliberacao'
  | 'concluido'
  | 'rejeitado';

export type ArbitrationRulingRemedy =
  | 'absolvicao'
  | 'advertencia_formal'
  | 'bloqueio_temporario'
  | 'bloqueio_indefinido'
  | 'perda_direitos_moderador'
  | 'perda_direitos_admin'
  | 'ajustamento_conduta'
  | 'desconsiderado';

export interface ArbitrationDeliberation {
  id: string;
  arbitratorName: string;
  arbitratorUid: string;
  vote: 'acolher' | 'rejeitar' | 'sancionar' | 'absolver' | 'abster';
  statement: string; // Justificativa fundamentada do voto do árbitro
  recommendedRemedy?: ArbitrationRulingRemedy;
  timestamp: string;
}

export interface ArbitrationComment {
  id: string;
  author: string;
  authorRole: UserRole | string;
  authorUid?: string;
  content: string;
  timestamp: string;
  isTestimony?: boolean; // Depoimento ou testemunho formal
}

export interface ArbitrationRuling {
  remedyType: ArbitrationRulingRemedy;
  rulingSummary: string;
  sanctionDurationDays?: number;
  votesInFavor: number;
  votesAgainst: number;
  votesAbstain?: number;
  closedByArbitrator: string;
  closedAt: string;
  formalFindings: string[]; // Conclusões de fato e direito
}

export interface ArbitrationCase {
  id: string;
  caseNumber: string; // Ex: ARB-PT-2026-001
  langCode: string; // Ex: 'pt', 'en', 'es', 'fr', etc.
  title: string;
  targetType: ArbitrationCaseTargetType;
  targetUsername: string;
  targetUserDisplayName?: string;
  targetUserUid?: string;
  targetUserRole?: UserRole;
  requesterUsername: string;
  requesterDisplayName: string;
  requesterUid: string;
  requesterRole: UserRole;
  category: ArbitrationCaseCategory;
  summary: string;
  evidenceWikitext: string;
  requestedRemedy: string;
  defenseStatement?: string;
  status: ArbitrationCaseStatus;
  urgency: 'alta' | 'media' | 'baixa';
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  deliberations: ArbitrationDeliberation[];
  comments: ArbitrationComment[];
  finalRuling?: ArbitrationRuling;
  relatedArticleTitles?: string[];
}

export interface ArbitrationCommitteeMember {
  id: string;
  langCode: string;
  username: string;
  displayName: string;
  role: 'Presidente do Conselho' | 'Árbitro Titular' | 'Árbitro Suplente';
  mandateStart: string;
  mandateEnd: string;
  status: 'ativo' | 'licenca' | 'renunciou';
  casesJudged: number;
  bio?: string;
  avatarUrl?: string;
}

// ==========================================
// SISTEMA DE FICHEIROS, IMAGENS E MÍDIAS
// ==========================================

export type WikiFileLicense =
  | 'cc-by-sa-4.0'
  | 'cc-by-4.0'
  | 'cc0-public-domain'
  | 'gfdl'
  | 'fair-use'
  | 'own-work'
  | 'copyrighted-permission';

export interface WikiFileVersion {
  id: string;
  versionNumber: number;
  url: string;
  thumbnails: {
    sm: string;
    md: string;
    lg: string;
  };
  sizeBytes: number;
  width: number;
  height: number;
  uploadedBy: string;
  uploadedByUid?: string;
  uploadedAt: string;
  comment: string;
}

export interface WikiFile {
  id: string;
  name: string; // Ex: Bandeira_do_Brasil.png
  title: string; // Ex: Arquivo:Bandeira_do_Brasil.png
  description: string; // Descrição em wikitext
  license: WikiFileLicense;
  licenseDetails?: string;
  fairUseJustification?: string;
  author: string;
  source: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  url: string;
  thumbnails: {
    sm: string; // ~150px
    md: string; // ~320px
    lg: string; // ~800px
  };
  uploadedBy: string;
  uploadedByUid?: string;
  uploadedAt: string;
  updatedAt?: string;
  storageProvider: 'firebase_storage' | 'local_fallback';
  firebasePlan?: 'spark' | 'blaze';
  history: WikiFileVersion[];
  categories: string[];
}

export interface UploadFileInput {
  file: File;
  targetName: string;
  description: string;
  license: WikiFileLicense;
  licenseDetails?: string;
  fairUseJustification?: string;
  author: string;
  source: string;
  categories?: string[];
  comment?: string;
}

// ==========================================
// SISTEMA DE NAMESPACES, PÁGINAS E TEMPLATES
// ==========================================

export type PageNamespace =
  | 'main'
  | 'talk'
  | 'user'
  | 'user_talk'
  | 'project'
  | 'project_talk'
  | 'file'
  | 'file_talk'
  | 'mediawiki'
  | 'mediawiki_talk'
  | 'template'
  | 'template_talk'
  | 'help'
  | 'help_talk'
  | 'category'
  | 'category_talk'
  | 'portal'
  | 'draft'
  | 'special'
  | (string & {});

export interface Page {
  id: string;
  namespace: PageNamespace;
  title: string;
  content: string;
  categories: string[];
  templateName?: string;
  templateParams?: Record<string, string>;
  authorUid?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreatePageInput {
  namespace: PageNamespace;
  title: string;
  content: string;
  categories?: string[];
  templateName?: string;
  templateParams?: Record<string, string>;
  authorUid?: string;
  authorName?: string;
}

export interface UpdatePageInput {
  content?: string;
  categories?: string[];
  templateName?: string | null;
  templateParams?: Record<string, string>;
  authorUid?: string;
  authorName?: string;
}

export interface WikiTemplate {
  id: string;
  name: string;
  content: string; // Suporta marcação {{{param}}} e {{{param|default}}}
  description: string;
  authorUid?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
  parameters?: string[];
  category?: string;
}

export interface CreateTemplateInput {
  name: string;
  content: string;
  description: string;
  authorUid?: string;
  authorName?: string;
  category?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  content?: string;
  description?: string;
  authorUid?: string;
  authorName?: string;
  category?: string;
}

// ==========================================
// SISTEMA DE PERMISSÕES E RBAC
// ==========================================
export * from './types/Permissions';
export * from './types/Watchlist';


export interface PageVersion {
  id?: string;
  pageId?: string;
  versionNumber: number;
  content: string;
  userName: string;
  userId: string;
  timestamp: string; // ISO string ou Firestore timestamp formatado
  comment: string;   // Resumo da edição / motivo da alteração
  previousVersion: number | null;
}

// Alias para compatibilidade direta com a nomenclatura Version
export type Version = PageVersion;

export interface SaveVersionInput {
  pageId: string;
  content: string;
  userId: string;
  userName: string;
  comment: string;
  previousVersion?: number | null;
}

// ==========================================
// CONTATO DE EMERGÊNCIA (CASOS EXTREMOS)
// ==========================================

export type EmergencyCategory =
  | 'ameaca_vida_violencia'     // Ameaça crível de dano físico iminente, atentado ou autoextermínio
  | 'doxxing_dados_sensiveis'   // Vazamento criminoso de dados de alto risco (LGPD severa, endereço, CPF, fotos íntimas)
  | 'seguranca_menores_csam'    // Exploração ou assédio/ameaça grave a crianças/adolescentes (Zero Tolerância)
  | 'ataque_infraestrutura'     // Comprometimento crítico do sistema, invasão de conta root/admin, injeção de malware
  | 'ordem_judicial_urgente'    // Intimação de autoridade judicial/policial com prazo de plantão
  | 'outro_extremo';            // Outro perigo imediato extremo

export type EmergencyUrgencyLevel = 'critica_imediata' | 'alta_gravidade';

export type EmergencyReportStatus =
  | 'urgente_recebido'
  | 'em_atendimento_imediato'
  | 'resolvido_mitigado'
  | 'encaminhado_autoridades'
  | 'encerrado_invalido';

export interface EmergencyReportActionLog {
  id: string;
  adminUid: string;
  adminName: string;
  timestamp: string;
  action: string;
  note: string;
}

export interface EmergencyReport {
  id: string;
  protocolNumber: string; // Ex: EMERG-2026-XXXX
  category: EmergencyCategory;
  urgencyLevel: EmergencyUrgencyLevel;
  title: string;
  description: string;
  involvedUrlsOrPages?: string[];
  involvedUsers?: string[];
  evidenceText?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterUid?: string;
  reporterIp?: string;
  reporterIpHash?: string;
  isAnonymous: boolean;
  requiresConfidentiality: boolean;
  status: EmergencyReportStatus;
  createdAt: string;
  updatedAt: string;
  assignedAdminUid?: string;
  assignedAdminName?: string;
  adminNotes?: string;
  resolutionSummary?: string;
  actionLogs: EmergencyReportActionLog[];
}

export type AppTheme = 'light' | 'dark' | 'google' | 'google-dark' | 'win95' | 'winxp' | 'win7' | 'win10' | 'win31' | 'wikidiota' | 'genshin' | 'android15' | 'android23' | 'stardew' | 'repo' | 'minecraft' | 'roblox' | 'nokia3310' | 'win1' | 'halflife';

export interface GeminiChatbotConfig {
  chatbotId: string;
  enabled: boolean;
  displayName: string;
  model: string;
  systemInstruction?: string;
  allowArticleGeneration: boolean;
  allowCollectionGeneration: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface GeminiChatMessage {
  id: string;
  role?: 'user' | 'model' | 'system';
  content: string;
  sender?: 'user' | 'ai' | 'model' | 'system' | 'bot';
  text?: string;
  timestamp: string;
  imageUrl?: string;
  imageMimeType?: string;
  offerPremium?: boolean;
  quotaExceeded?: boolean;
  quotaType?: 'chats' | 'images' | 'notebook';
  feedback?: 'like' | 'dislike';
  metadata?: {
    actionType?: 'article' | 'collection' | 'wtext_snippet';
    suggestedData?: any;
    userId?: string;
    isGuest?: boolean;
  };
}

export type GeminiNotebookSourceType = 'wiki_article' | 'text' | 'url' | 'image';

export interface GeminiNotebookSource {
  id: string;
  title: string;
  type: GeminiNotebookSourceType;
  content: string;
  articleId?: string;
  imageUrl?: string;
  addedAt: string;
}

export interface GeminiNotebookNote {
  id: string;
  title: string;
  content: string;
  generatedByGemini?: boolean;
  actionUsed?: string;
  insertedIntoArticleTitle?: string;
  createdAt: string;
}

export interface GeminiNotebookItem {
  id: string;
  title: string;
  description?: string;
  userId?: string;
  userEmail?: string;
  sources: GeminiNotebookSource[];
  notes: GeminiNotebookNote[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// UNIVERSAL CODE OF CONDUCT (UCOC)
// ==========================================

export type UcocViolationCategory =
  | 'assedio_sistematico'         // Wikihounding, intimidação, perseguição continuada
  | 'abuso_poder_autoridade'      // Administrador/moderador abusando de ferramentas disciplinares ou censura
  | 'discurso_odio_discriminacao' // Discriminação por gênero, raça, religião, orientação, nacionalidade
  | 'difamacao_ataque_pessoal'    // Calúnia, desqualificação pessoal, ataques à honra fora do debate editorial
  | 'retaliacao_denuncia'         // Vingança ou perseguição contra quem reportou infrações de boa-fé
  | 'conflito_interesse_encoberto' // Edição paga sem transparência, manipulação ostensiva de consenso
  | 'coacao_ameaca_legal'         // Ameaça de processo judicial ou coação fora da plataforma
  | 'outro_ucoc';                 // Outras violações formais aos pilares do UCoC

export type UcocSeverity = 'baixa' | 'moderada' | 'grave' | 'critica';

export type UcocReportStatus =
  | 'admissibilidade'   // Protocolada, sob triagem de admissibilidade pelo Comitê UCoC
  | 'em_instrucao'      // Notificação da parte denunciada e coleta de manifestações/provas
  | 'em_deliberacao'    // Caso instruído, em votação pelos membros do Comitê UCoC / ArbCom
  | 'medida_cautelar'   // Medida cautelar aplicada (restrição provisória de edição)
  | 'concluida_sancao'  // Procedente com sanção deliberada e registrada
  | 'concluida_arquivada'; // Improcedente, infundada ou resolvida por mediação

export interface UcocActionLog {
  id: string;
  adminUid: string;
  adminName: string;
  adminRole?: string;
  action: string;
  note: string;
  timestamp: string;
}

export interface UcocReportComment {
  id: string;
  authorUid?: string;
  authorName: string;
  authorRole?: string;
  text: string;
  timestamp: string;
  isOfficialStatement?: boolean;
  isInternalNote?: boolean;
}

export interface UcocReport {
  id: string;
  protocolNumber: string; // Ex: UCOC-2026-XXXX
  category: UcocViolationCategory;
  severity: UcocSeverity;
  title: string;
  description: string;
  targetUsername: string;
  targetUserUid?: string;
  targetUserRole?: string;
  involvedUrlsOrArticles?: string[];
  evidenceText: string;
  evidenceLinks?: string[];
  reporterName: string;
  reporterEmail?: string;
  reporterUid?: string;
  reporterRole?: string;
  isAnonymousOrConfidential: boolean;
  requiresProtectiveMeasures: boolean;
  status: UcocReportStatus;
  defenseStatement?: string;
  defenseSubmittedAt?: string;
  committeeResolution?: string;
  appliedSanctions?: string;
  assignedInvestigatorUid?: string;
  assignedInvestigatorName?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  actionLogs: UcocActionLog[];
  comments: UcocReportComment[];
}

// ============================================================================
// SISTEMA DE ADMINISTRAÇÃO E CONFIGURAÇÃO DO FIREBASE CONSOLE & BACKUP (BLAZE)
// ============================================================================

export type FirebasePlanTier = 'spark' | 'blaze';

export type FirebaseBackupFrequency = 'every_6h' | 'every_12h' | 'daily' | 'weekly' | 'monthly';

export interface FirebaseBackupScheduleConfig {
  enabled: boolean;
  frequency: FirebaseBackupFrequency;
  timeOfDay: string; // ex: "03:00" (Horário de Brasília / UTC-3)
  gcsBucketUri: string; // ex: "gs://ai-studio-wikizeroenciclop-0a14dc90-3ab3-47bc-8306-ca5bc2953699-backups"
  retentionDays: number; // 7, 14, 30, 90, 365
  enablePitr: boolean; // Point-in-time recovery contínuo de até 7 dias
  pitrRetentionHours: number; // Padrão GCP: 168h (7 dias)
  collectionsToBackup: string[];
  enableCompression: boolean; // GZIP (.json.gz)
  enableKmsEncryption: boolean; // Criptografia GCP KMS / AES-256
  notificationEmail: string;
  notificationOnSuccess: boolean;
  notificationOnFailure: boolean;
  lastRunTimestamp?: string;
  nextRunTimestamp?: string;
  lastRunStatus?: 'success' | 'failed' | 'in_progress';
}

export interface FirebaseBackupRecord {
  id: string;
  timestamp: string;
  type: 'automatic_scheduled' | 'manual_snapshot' | 'pitr_export';
  plan: FirebasePlanTier;
  status: 'completed' | 'in_progress' | 'failed';
  sizeBytes: number;
  collectionCounts: Record<string, number>;
  gcsPath?: string;
  checksumSha256: string;
  triggeredBy: string;
  downloadUrl?: string;
  notes?: string;
}

export interface FirebaseConsoleConfig {
  plan: FirebasePlanTier;
  monthlyBudgetLimitUsd: number;
  billingAlertsEnabled: boolean;
  billingAlertEmails: string[];
  backupSchedule: FirebaseBackupScheduleConfig;
  firestoreSettings: {
    databaseId: string;
    region: string;
    mode: 'production' | 'audit';
    enableOfflineCache: boolean;
    cacheSizeBytes: number;
    defaultTtlDays?: number;
  };
  authSettings: {
    allowEmailPassword: boolean;
    allowGoogleAuth: boolean;
    allowAnonymous: boolean;
    authorizedDomains: string[];
    minPasswordLength: number;
    requireEmailVerification: boolean;
    emailEnumerationProtection: boolean;
    preventMultipleAccountsSameEmail: boolean;
    sessionDurationHours: number;
    maxFailedLoginAttempts: number;
  };
  storageSettings: {
    bucketUri: string;
    maxUploadSizeBytes: number;
    allowedMimeTypes: string[];
    corsAllowedOrigins: string[];
    cacheControlMaxAgeSeconds: number;
  };
  appCheckSettings: {
    enabled: boolean;
    provider: 'recaptcha_v3' | 'recaptcha_enterprise' | 'debug';
    enforcementMode: 'monitoring' | 'enforced';
    tokenTtlMinutes: number;
  };
  functionsSettings: {
    region: string;
    nodeVersion: string;
    defaultTimeoutSeconds: number;
    defaultMemoryMb: number;
  };
  loggingSettings: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retentionDays: number;
  };
}

export interface FirebaseUsageMetrics {
  timestamp: string;
  dailyDate: string;
  plan: FirebasePlanTier;
  reads: {
    today: number;
    dailyLimit: number;
    totalCumulative: number;
    percentUsed: number;
    status: 'healthy' | 'warning' | 'critical';
    byCollection: {
      articles: number;
      documentos: number;
      users: number;
      audit_logs: number;
      system_updates: number;
      other: number;
    };
    readsPerMinute: number;
    estimatedCostUsd: number;
  };
  writes: {
    today: number;
    dailyLimit: number;
    totalCumulative: number;
    percentUsed: number;
    status: 'healthy' | 'warning' | 'critical';
    byCollection: {
      articles: number;
      documentos: number;
      users: number;
      audit_logs: number;
      system_updates: number;
      other: number;
    };
    writesPerMinute: number;
    estimatedCostUsd: number;
  };
  memory: {
    totalBytes: number;
    totalFormatted: string;
    limitBytes: number;
    limitFormatted: string;
    percentUsed: number;
    status: 'healthy' | 'warning' | 'critical';
    totalDocuments: number;
    averageBytesPerDoc: number;
    breakdown: {
      articlesBytes: number;
      articlesFormatted: string;
      articlesCount: number;
      documentsBytes: number;
      documentsFormatted: string;
      documentsCount: number;
      usersBytes: number;
      usersFormatted: string;
      usersCount: number;
      auditLogsBytes: number;
      auditLogsFormatted: string;
      auditLogsCount: number;
      backupsBytes: number;
      backupsFormatted: string;
      backupsCount: number;
      indexedDbCacheBytes: number;
      indexedDbCacheFormatted: string;
    };
  };
  deletes: {
    today: number;
    dailyLimit: number;
    totalCumulative: number;
  };
  isRealTimeActive?: boolean;
  firestoreDatabaseId?: string;
  projectId?: string;
  lastLiveEvent?: {
    type: 'read' | 'write' | 'delete' | 'sync';
    collection: string;
    timestamp: string;
    description: string;
  };
}

// ============================================================================
// WIKI DOS LIVROS & PERIÓDICOS (ACERVO BIBLIOGRÁFICO DE BIBLIOTECA FÍSICA E DIGITAL)
// ============================================================================

export type LibraryItemType =
  | 'livro'              // Monografia / Livro impresso ou digital
  | 'periodico'          // Revista / Journal científico / Magazine / Periódico seriado
  | 'tese'               // Tese de Doutorado / Dissertação de Mestrado / Monografia Acadêmica
  | 'artigo_cientifico'  // Artigo em periódico ou anais de congresso
  | 'obra_rara'          // Obras raras, incunábulos, manuscritos históricos
  | 'partitura'          // Partitura musical
  | 'mapa'               // Mapa / Cartografia / Atlas
  | 'audiovisual';       // Registro sonoro / DVD / Mídia digital

export type PhysicalConservationState =
  | 'novo'
  | 'excelente'
  | 'bom'
  | 'regular'
  | 'danificado'
  | 'em_restauracao';

export type PhysicalCirculationStatus =
  | 'disponivel'       // Disponível para empréstimo domiciliar ou leitura imediata
  | 'consulta_local'   // Não circula (apenas para consulta no recinto da biblioteca)
  | 'emprestado'       // Emprestado a leitor
  | 'reservado'        // Reservado aguardando retirada
  | 'em_quarentena'    // Higienização / Catalogação / Processamento técnico
  | 'extraviado';      // Desaparecido ou em averiguação patrimonial

export interface LibraryItemPhysicalLocation {
  predio?: string;           // ex: "Biblioteca Central - Bloco B"
  andar?: string;            // ex: "1º Pavimento"
  secao: string;             // ex: "Acervo Geral", "Obras Raras", "Periódicos Científicos", "Referência"
  estante: string;           // ex: "Estante E-12"
  prateleira: string;        // ex: "Prateleira 4"
  codigoChamada: string;     // Notação completa de chamada (ex: "004.678 S586w 2.ed.")
  tomboPatrimonial?: string; // Número de Tombo / Registro de Patrimônio / Código de Barras
}

export interface LibraryReview {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number;            // 1 a 5 estrelas
  reviewTitle: string;
  reviewText: string;
  clarityRating?: number;    // 1 a 5 estrelas
  rigorRating?: number;      // 1 a 5 estrelas
  createdAt: string;
  updatedAt?: string;
  likesCount?: number;
  tags?: string[];
  recommends: boolean;
}

export interface LibraryItem {
  id: string;
  tipo: LibraryItemType;
  titulo: string;
  subtitulo?: string;
  autores: string[];         // ex: ["Silva, Maria Aparecida da", "Peres, Pedro Henrique"]
  organizadores?: string[];  // para coletâneas organizadas
  tradutores?: string[];
  editora: string;
  localPublicacao: string;   // Cidade/País, ex: "São Paulo, SP"
  anoPublicacao: number;
  edicao?: string;           // ex: "3ª ed. rev. e ampl."
  volume?: string;           // ex: "v. 1" ou "Vol. 4"
  fasciculoNumero?: string;  // Para periódicos: ex: "v. 18, n. 3"
  mesAnoPeriodico?: string;  // ex: "Julho/Setembro de 2024"
  
  // Identificadores universais
  isbn?: string;             // ISBN-10 ou ISBN-13
  issn?: string;             // Para periódicos (ex: 2317-6881)
  doi?: string;              // Digital Object Identifier
  codigoBarras?: string;     // Código de barras físico
  
  // Classificações biblioteconômicas (MARC21 / AACR2 / CDD / CDU)
  cdd?: string;              // Classificação Decimal de Dewey (ex: 004, 340, 981)
  cdu?: string;              // Classificação Decimal Universal
  cutter?: string;           // Notação de autor (ex: S586w)
  assuntos: string[];        // Tesauro / Assuntos / Cabeçalhos de assunto
  
  // Descrição física
  paginas?: number;
  dimensoesCm?: string;      // ex: "23 cm"
  ilustrado?: boolean;
  capaUrl?: string;          // Imagem de capa ou placeholder estético
  idioma: string;            // ex: "Português", "Inglês", "Espanhol"
  idiomaOriginal?: string;
  
  // Conteúdo & Resumo
  sinopse: string;
  sumarioOuNotas?: string;   // Notas sobre a obra, sumário estruturado ou bibliografia
  
  // Gestão física & Circulação
  localizacao: LibraryItemPhysicalLocation;
  exemplaresTotais: number;
  exemplaresDisponiveis: number;
  estadoConservacao: PhysicalConservationState;
  statusCirculacao: PhysicalCirculationStatus;
  
  // Vínculos com a Enciclopédia WikiWorldWeb
  artigoWikiVinculadoId?: string;
  artigoWikiVinculadoTitulo?: string;

  // Comitê de Ética em Pesquisa com Seres Humanos (CEP / CONEP)
  comiteEtica?: ResearchEthicsCommitteeInfo;

  // Metadados do cadastro e auditoria
  cadastradoPorUid?: string;
  cadastradoPorNome?: string;
  dataCadastro: string;
  ultimaModificacao?: string;
  
  // Métricas comunitárias
  visualizacoes?: number;
  mediaAvaliacoes?: number;  // 1.0 a 5.0
  totalAvaliacoes?: number;
}

export interface LibraryFilterOptions {
  searchTerm: string;
  tipo?: LibraryItemType | 'todos';
  statusCirculacao?: PhysicalCirculationStatus | 'todos';
  cddClasse?: string;        // '000', '100', '200', etc.
  idioma?: string;
  apenasComDisponibilidade?: boolean;
  ordenacao?: 'recentes' | 'titulo' | 'autor' | 'ano_desc' | 'ano_asc' | 'avaliacoes';
}

// ==========================================
// GERENCIAMENTO DE EXTENSÕES DA WIKI
// ==========================================

export type ExtensionCategory =
  | 'content'        // Conteúdo, Citações, Referências, Glossários
  | 'rendering'      // Renderização, LaTeX/KaTeX, Gráficos, Equações
  | 'formatting'     // Formatação, Tipografia, Impressão Limpa
  | 'utility'        // Utilitários, Métricas de Leitura, Contagem
  | 'interface'      // Interface, Temas, Acessibilidade, Mobile, Modo Leitura
  | 'security'       // Segurança, Anti-Spam, Moderação, Auditoria
  | 'ferramenta'     // Ferramentas Interativas (Calculadora, Previsão, Relógio)
  | 'tool'           // Alias para ferramenta
  | 'editor'         // Botões da barra de ferramentas, Snippets, Assistentes de Edição
  | 'multimedia'     // Áudio, Web Speech, Leitores Multimídia, Podcasts, Modelos
  | 'gamification'   // Quizzes, Flashcards, Conquistas, Barnstars, Medalhas
  | 'social'         // Compartilhamento, QR Code, Cartões de Redes Sociais
  | 'automation'     // Bots automáticos de manutenção, Corretores, Normalização
  | 'analytics';     // Análise de dados, Métricas de Engajamento, Visualizações

export interface ExtensionSettingSchema {
  key: string;
  label: string;
  description?: string;
  type: 'boolean' | 'string' | 'number' | 'select';
  options?: { label: string; value: any }[];
  defaultValue: any;
}

export interface EditorButtonDefinition {
  id: string;
  label: string;
  tooltip?: string;
  icon?: string;
  snippetPrefix?: string;
  snippetSuffix?: string;
  placeholder?: string;
  action?: (api: {
    insertText: (prefix: string, suffix?: string, placeholder?: string) => void;
    getValue: () => string;
    setValue: (text: string) => void;
    getSelectedText: () => string;
  }) => void;
}

export interface ArticleActionDefinition {
  id: string;
  label: string;
  tooltip?: string;
  icon?: string;
  badge?: string;
  color?: string;
  onClick: (context: {
    article: WikiArticle;
    user: UserProfile | null;
    triggerSpeech?: () => void;
    openReaderMode?: () => void;
    notify?: (message: string, type?: 'info' | 'success' | 'warning') => void;
  }) => void;
}

export interface ArticleWidgetDefinition {
  id: string;
  title: string;
  placement?: 'after_content' | 'sidebar' | 'header';
  component?: React.ComponentType<{ article: WikiArticle; user: UserProfile | null }>;
  render?: (article: WikiArticle, user: UserProfile | null) => React.ReactNode;
}

export interface RegisteredToolMeta {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  category: ExtensionCategory | string;
  description?: string;
  icon?: string;
  route?: string;
  component?: React.ComponentType<any>;
}

export interface CustomToolInput {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  placeholder?: string;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}

export interface CustomToolConfig {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  extensionName?: string;
  badge?: string;
  toolId?: string;
  resultLabel?: string;
  htmlWidget?: string;
  inputs?: CustomToolInput[];
  calculationFormula?: string;
  unitSuffix?: string;
}

export interface CustomEditorPluginConfig {
  buttonId: string;
  label: string;
  tooltip?: string;
  icon?: string;
  snippetTemplate: string;
  extensionName?: string;
}

export interface CustomThemeConfig {
  themeId: string;
  displayName: string;
  description?: string;
  accentColor?: string;
  baseTheme?: 'light' | 'dark' | 'cyberpunk' | string;
  cssVariables?: Record<string, string>;
  extensionName?: string;
}

export interface InstalledExtensionMeta {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: ExtensionCategory;
  enabled: boolean;
  isCore?: boolean;
  installedAt: string;
  installedBy?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
  website?: string;
  hooks: string[];
  customScript?: string;
  settings?: Record<string, any>;
  settingsSchema?: ExtensionSettingSchema[];
}

export interface ExtensionActionLog {
  id: string;
  extensionId: string;
  extensionName: string;
  action: 'activated' | 'deactivated' | 'added' | 'removed' | 'configured';
  operatorUid: string;
  operatorUsername: string;
  operatorRole: string;
  timestamp: string;
  details?: string;
}




