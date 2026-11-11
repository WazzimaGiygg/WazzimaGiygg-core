/**
 * @file PermissionService.ts
 * @description Serviço centralizado de controle de acesso baseado em grupos/funções (RBAC) para o WikiZero.
 * Define permissões estáticas por grupo e avalia dinamicamente ações sobre recursos do sistema.
 */

import { UserGroup, PermissionMap, PermissionAction } from '../types/Permissions';
import { UserProfile, Page } from '../types';
import { isAuthorizedPublisher } from '../../firebase';

export interface BaseUserObject {
  uid?: string;
  role?: string;
  group?: string | UserGroup;
  isGuest?: boolean;
  isBanned?: boolean;
  email?: string | null;
}

export class PermissionService {
  /**
   * Configuração estática de permissões por ação do sistema
   */
  private static permissions: PermissionMap = {
    view: true, // Permitido para todos, inclusive anônimos
    view_history: true, // Permitido para todos
    edit: [UserGroup.REGISTERED, UserGroup.EDITOR, UserGroup.ADMIN],
    create_page: [UserGroup.REGISTERED, UserGroup.EDITOR, UserGroup.ADMIN],
    move: [UserGroup.EDITOR, UserGroup.ADMIN],
    rollback: [UserGroup.EDITOR, UserGroup.ADMIN],
    manage_templates: [UserGroup.EDITOR, UserGroup.ADMIN],
    delete: [UserGroup.ADMIN],
    protect: [UserGroup.ADMIN],
    manage_users: [UserGroup.ADMIN],
    audit_logs: [UserGroup.ADMIN],
  };

  /**
   * Obtém o grupo de acesso (UserGroup) associado ao usuário.
   * Se for nulo, anônimo ou convidado não autenticado, retorna UserGroup.ANONYMOUS.
   *
   * @param user Usuário autenticado ou perfil do WikiZero
   * @returns UserGroup
   */
  public static getUserGroup(user: (UserProfile | BaseUserObject | null | undefined)): UserGroup {
    if (!user || user.isGuest || !user.uid) {
      return UserGroup.ANONYMOUS;
    }

    // Se o usuário já tiver o campo explícito 'group'
    const groupVal = (user.group || '').toString().toLowerCase();
    if (groupVal === UserGroup.ADMIN || groupVal === 'admin' || groupVal === 'administrador') {
      return UserGroup.ADMIN;
    }
    if (groupVal === UserGroup.EDITOR || groupVal === 'editor' || groupVal === 'moderador' || groupVal === 'moderator') {
      return UserGroup.EDITOR;
    }
    if (groupVal === UserGroup.REGISTERED || groupVal === 'registered' || groupVal === 'registrado' || groupVal === 'leitor') {
      return UserGroup.REGISTERED;
    }

    // Avalia pelo campo 'role' legado
    const roleVal = (user.role || '').toString().toLowerCase();
    if (roleVal === 'admin' || roleVal === 'administrador' || user.email === 'pedrohenriquecardonaperes@gmail.com') {
      return UserGroup.ADMIN;
    }
    if (roleVal === 'moderador' || roleVal === 'moderator' || roleVal === 'editor') {
      return UserGroup.EDITOR;
    }
    if (roleVal === 'leitor' || roleVal === 'registered' || roleVal === 'registrado') {
      return UserGroup.REGISTERED;
    }

    // Usuário logado com conta registrada padrão
    return UserGroup.REGISTERED;
  }

  /**
   * Verifica se o usuário possui autorização para executar determinada ação.
   *
   * @param user Usuário (UserProfile, objeto de autenticação ou null)
   * @param action Ação a ser verificada (ex: 'view', 'edit', 'delete', 'move', 'create_page')
   * @param resource Recurso opcional (Page, artigo, etc.) para validação de contexto adicional
   * @returns boolean indicando se a ação é permitida
   */
  public static can(
    user: (UserProfile | BaseUserObject | null | undefined),
    action: PermissionAction | string,
    resource?: Page | null
  ): boolean {
    const cleanAction = action.toLowerCase().trim();

    // Regra universal: usuários banidos não podem realizar nenhuma ação além de visualização passiva
    if (user?.isBanned && cleanAction !== 'view' && cleanAction !== 'view_history') {
      return false;
    }

    // Regra estrita: qualquer criação de página/artigo só é permitida pelos e-mails autorizados
    if (cleanAction === 'create_page' || cleanAction === 'create_article' || cleanAction === 'publish') {
      if (!isAuthorizedPublisher(user?.email)) {
        return false;
      }
    }

    const userGroup = this.getUserGroup(user);
    const rule = this.permissions[cleanAction];

    // Se não há regra configurada para a ação, por segurança apenas ADMIN tem permissão
    if (rule === undefined) {
      return userGroup === UserGroup.ADMIN;
    }

    // Regra global booleana (ex: view: true)
    if (typeof rule === 'boolean') {
      return rule;
    }

    // Verifica se o grupo do usuário está na lista de grupos permitidos
    const isGroupAllowed = rule.includes(userGroup);
    if (!isGroupAllowed) {
      return false;
    }

    // Validação contextual por recurso (se aplicável)
    if (resource) {
      // Páginas do namespace 'special' são do sistema e não podem ser editadas livremente
      if (resource.namespace === 'special' && (cleanAction === 'edit' || cleanAction === 'delete')) {
        return userGroup === UserGroup.ADMIN;
      }

      // Páginas do namespace 'mediawiki' (mensagens de sistema) só podem ser editadas por administradores
      if (resource.namespace === 'mediawiki' && cleanAction === 'edit') {
        return userGroup === UserGroup.ADMIN;
      }
    }

    return true;
  }

  /**
   * Retorna todas as permissões configuradas atualmente no sistema.
   */
  public static getAllPermissions(): PermissionMap {
    return { ...this.permissions };
  }

  /**
   * Verifica se o usuário é isento da cota diária de 5 edições.
   * Moderadores e Administradores possuem isenção e podem editar sem restrição diária.
   */
  public static isExemptFromDailyLimit(user: (UserProfile | BaseUserObject | null | undefined)): boolean {
    if (!user) return false;
    const roleVal = (user.role || '').toString().toLowerCase().trim();
    const groupVal = (user.group || '').toString().toLowerCase().trim();
    const emailVal = (user.email || '').toString().toLowerCase().trim();

    if (roleVal === 'admin' || roleVal === 'administrador') return true;
    if (roleVal === 'moderador' || roleVal === 'moderator') return true;
    if (groupVal === 'admin' || groupVal === 'administrador') return true;
    if (groupVal === 'moderador' || groupVal === 'moderator') return true;
    if (emailVal === 'pedrohenriquecardonaperes@gmail.com') return true;

    return false;
  }

  /**
   * Permite customizar ou estender o mapa de permissões em tempo de execução.
   */
  public static setPermission(action: string, groupsOrBool: boolean | UserGroup[]): void {
    this.permissions[action.toLowerCase().trim()] = groupsOrBool;
  }
}
