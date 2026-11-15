import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: WazzimaGiyggNewsExtension (Update 3.05 - Requisito 3.05.3.g)
 * Categoria: interface
 * Funcionalidade: Transforma a seção "Jornal WazzimaGiygg" (Notícias, Investigações
 * e Edição Digital) em uma extensão modular que pode ser ativada ou desativada
 * pelo administrador.
 */
export default class WazzimaGiyggNewsExtension implements WikiExtension {
  getName(): string {
    return 'WazzimaGiyggNewsExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Módulo oficial do Jornal WazzimaGiygg: portal de notícias independentes, reportagens investigativas e edição digital em tempo real. Pode ser desativado pelo administrador.';
  }

  getAuthor(): string {
    return 'Jornal WazzimaGiygg Editorial Board';
  }

  getCategory(): ExtensionCategory {
    return 'interface';
  }

  isCore(): boolean {
    return false;
  }

  getWebsite(): string {
    return 'https://jornal.wazzimagiygg.com/';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'showInSidebar',
        label: 'Exibir no Menu Lateral',
        type: 'boolean',
        defaultValue: true,
        description: 'Exibe o atalho do Jornal WazzimaGiygg na barra de navegação principal.',
      },
      {
        key: 'customTitle',
        label: 'Nome Personalizado do Jornal',
        type: 'string',
        defaultValue: 'Jornal WazzimaGiygg',
        description: 'Texto exibido no menu e nos cabeçalhos da seção de notícias.',
      },
      {
        key: 'feedRefreshMinutes',
        label: 'Intervalo de Atualização do Feed (minutos)',
        type: 'number',
        defaultValue: 15,
        description: 'Frequência de rechecagem do feed RSS/API de notícias.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const title = settings.customTitle || 'Jornal WazzimaGiygg';

    hooks.addFilter<boolean>(
      'module:news_available',
      () => true,
      10,
      this.getName()
    );

    hooks.addFilter<string>(
      'module:news_title',
      () => title,
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'module:news_show_sidebar',
      () => settings.showInSidebar !== false,
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    hooks.addFilter<boolean>(
      'module:news_available',
      () => false,
      10,
      this.getName()
    );
  }
}
