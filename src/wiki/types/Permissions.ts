/**
 * @file Permissions.ts
 * @description Definições de tipos e enums para o sistema de controle de acesso baseado em funções (RBAC) do WikiZero.
 */

export enum UserGroup {
  ANONYMOUS = 'anonymous',
  REGISTERED = 'registered',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

export type PermissionAction =
  | 'view'
  | 'edit'
  | 'move'
  | 'delete'
  | 'create_page'
  | 'rollback'
  | 'protect'
  | 'manage_users'
  | 'view_history'
  | 'manage_templates'
  | 'audit_logs'
  | (string & {});

/**
 * Mapeamento de ações para boolean direto ou lista de grupos de usuários autorizados
 */
export type PermissionMap = Record<string, boolean | UserGroup[]>;
