/**
 * EXTENSÃO NATIVA: HideOnlineUsersExtension
 * Arquivo: src/extensions/hide-online-users/index.ts
 *
 * REQUISITO 3.05.3.ab:
 * - Adicionar extensão que oculte o ícone dos usuários online na Wiki.
 */

import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

export default class HideOnlineUsersExtension implements WikiExtension {
  getName(): string {
    return 'HideOnlineUsersExtension';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Oculta o ícone de usuários online na barra de navegação da Wiki, o contador numérico em tempo real e o painel flutuante de presença de editores ativos.';
  }

  getAuthor(): string {
    return 'WikiZero Privacy & Interface Guild';
  }

  getCategory(): ExtensionCategory {
    return 'interface';
  }

  /**
   * Extensão nativa integrada ao sistema
   */
  isCore(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://wikiworldweb.org/extensions/hide-online-users';
  }

  /**
   * CSS injetado diretamente no DOM para ocultar o botão/ícone e qualquer indicador visual de usuários online
   */
  getCustomCss(): string {
    return `
      #btn-header-online-users,
      [data-online-users-trigger="true"],
      .wiki-online-users-indicator,
      [data-testid="online-users-badge"],
      .wiki-online-users-pulse {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'hideInAllViews',
        label: 'Ocultar em todas as visualizações (Desktop e Mobile)',
        type: 'boolean',
        defaultValue: true,
        description: 'Remove o ícone de usuários online em todas as resoluções de tela e cabeçalhos.',
      },
      {
        key: 'preservePresenceAnalytics',
        label: 'Manter métricas internas sem exibição visual',
        type: 'boolean',
        defaultValue: true,
        description: 'Continua mantendo o registro de sessão de forma discreta para auditoria sem exibir o ícone aos visitantes.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    // 1. Gancho de filtro para instruir o Header a omitir o botão de usuários online
    hooks.addFilter<boolean>(
      'header:show_online_users',
      () => false,
      10,
      this.getName()
    );

    // 2. Gancho de filtro geral de presença de usuários na UI
    hooks.addFilter<boolean>(
      'ui:show_online_indicators',
      () => false,
      10,
      this.getName()
    );

    // 3. Notificação informativa no console do sistema
    console.info('[HideOnlineUsersExtension] Extensão registrada: ícone de usuários online ocultado da Wiki.');
  }

  onUnregister(hooks: HookRegistry): void {
    console.info('[HideOnlineUsersExtension] Extensão descarregada: ícone de usuários online restaurado.');
  }
}
