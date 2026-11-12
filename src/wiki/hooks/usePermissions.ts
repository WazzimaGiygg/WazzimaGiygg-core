/**
 * @file usePermissions.ts
 * @description Hook React para integração do sistema RBAC com componentes de interface do WikiWorldWeb.
 * Permite habilitar/desabilitar botões, proteger rotas e exibir elementos contextuais com base no grupo do usuário.
 */

import { useMemo, useCallback } from 'react';
import { PermissionService, BaseUserObject } from '../services/PermissionService';
import { UserGroup, PermissionAction } from '../types/Permissions';
import { UserProfile, Page } from '../types';

export interface UsePermissionsReturn {
  userGroup: UserGroup;
  can: (action: PermissionAction | string, resource?: Page | null) => boolean;
  canView: (resource?: Page | null) => boolean;
  canEdit: (resource?: Page | null) => boolean;
  canDelete: (resource?: Page | null) => boolean;
  canMove: (resource?: Page | null) => boolean;
  canCreatePage: () => boolean;
  canRollback: () => boolean;
  canProtect: () => boolean;
  canManageUsers: () => boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isRegistered: boolean;
  isAnonymous: boolean;
  isBanned: boolean;
}

/**
 * Hook para verificação de permissões do usuário atual.
 *
 * @param user Perfil do usuário atual logado (ou null/undefined para anônimo)
 * @returns Objeto com métodos e flags de verificação de permissão
 */
export function usePermissions(
  user?: (UserProfile | BaseUserObject | null)
): UsePermissionsReturn {
  const userGroup = useMemo(() => {
    return PermissionService.getUserGroup(user);
  }, [user]);

  const isBanned = Boolean(user?.isBanned);
  const isAdmin = userGroup === UserGroup.ADMIN;
  const isEditor = userGroup === UserGroup.EDITOR || userGroup === UserGroup.ADMIN;
  const isRegistered = userGroup !== UserGroup.ANONYMOUS;
  const isAnonymous = userGroup === UserGroup.ANONYMOUS;

  const can = useCallback(
    (action: PermissionAction | string, resource?: Page | null): boolean => {
      return PermissionService.can(user, action, resource);
    },
    [user]
  );

  const canView = useCallback(
    (resource?: Page | null): boolean => {
      return PermissionService.can(user, 'view', resource);
    },
    [user]
  );

  const canEdit = useCallback(
    (resource?: Page | null): boolean => {
      return PermissionService.can(user, 'edit', resource);
    },
    [user]
  );

  const canDelete = useCallback(
    (resource?: Page | null): boolean => {
      return PermissionService.can(user, 'delete', resource);
    },
    [user]
  );

  const canMove = useCallback(
    (resource?: Page | null): boolean => {
      return PermissionService.can(user, 'move', resource);
    },
    [user]
  );

  const canCreatePage = useCallback((): boolean => {
    return PermissionService.can(user, 'create_page');
  }, [user]);

  const canRollback = useCallback((): boolean => {
    return PermissionService.can(user, 'rollback');
  }, [user]);

  const canProtect = useCallback((): boolean => {
    return PermissionService.can(user, 'protect');
  }, [user]);

  const canManageUsers = useCallback((): boolean => {
    return PermissionService.can(user, 'manage_users');
  }, [user]);

  return {
    userGroup,
    can,
    canView,
    canEdit,
    canDelete,
    canMove,
    canCreatePage,
    canRollback,
    canProtect,
    canManageUsers,
    isAdmin,
    isEditor,
    isRegistered,
    isAnonymous,
    isBanned,
  };
}
