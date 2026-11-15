import { UserProfile } from '../types';

/**
 * Função utilitária central para validar se um usuário possui o status de Burocrata.
 * Isolada em módulo folha para evitar dependências circulares com o ExtensionManager.
 */
export function isUserBureaucrat(user: UserProfile | null): boolean {
  if (!user) return false;
  // Sysop fundador e e-mail institucional mestre
  if (user.email === 'pedrohenriquecardonaperes@gmail.com') return true;
  // Usuário associado explicitamente ao grupo 'burocrata'
  if (user.group && user.group.toLowerCase().includes('burocrata')) return true;
  // Administradores plenos da Wiki
  if (user.role === 'admin') return true;
  return false;
}
