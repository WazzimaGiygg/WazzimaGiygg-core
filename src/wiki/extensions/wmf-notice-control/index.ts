import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: WmfNoticeControlExtension (Update 3.05 - Requisito 3.05.3.v)
 * Categoria: security
 * Funcionalidade: Permite ao Burocrata remover a mensagem de "Bloqueio de Nicknames
 * WMF Ativo" no login ou substituí-la por outra mensagem de aviso personalizada.
 */
export default class WmfNoticeControlExtension implements WikiExtension {
  getName(): string {
    return 'WmfNoticeControlExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Controla a exibição do aviso de "Bloqueio de Nicknames WMF Ativo" na tela de login. Permite remover completamente o painel informativo ou substituir o texto por uma mensagem customizada pelo Burocrata.';
  }

  getAuthor(): string {
    return 'WikiZero Identity Governance Guild';
  }

  getCategory(): ExtensionCategory {
    return 'security';
  }

  isCore(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://wazzimagiygg.com/';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'showNotice',
        label: 'Exibir Painel de Aviso de Nicknames WMF no Login',
        type: 'boolean',
        defaultValue: true,
        description: 'Se desmarcado, remove inteiramente o painel informativo de "Bloqueio de Nicknames WMF Ativo" da tela de login.',
      },
      {
        key: 'customTitle',
        label: 'Título Personalizado do Aviso',
        type: 'string',
        defaultValue: '',
        description: 'Substitui o título padrão "Bloqueio de Nicknames WMF Ativo". Deixe vazio para manter o título original.',
      },
      {
        key: 'customMessage',
        label: 'Mensagem Personalizada do Aviso',
        type: 'string',
        defaultValue: '',
        description: 'Substitui a explicação institucional padrão sobre neutralidade e bloqueio de operadores da Wikimedia Foundation. Deixe vazio para manter a mensagem padrão.',
      },
      {
        key: 'hideAdminTestingChips',
        label: 'Ocultar Botões de Teste e Lista de Nomes',
        type: 'boolean',
        defaultValue: false,
        description: 'Oculta a lista de nomes prioritários e chips interativos de teste de bloqueio.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};

    // 1. Filtro: Se o painel deve ser exibido
    hooks.addFilter<boolean>(
      'login:show_wmf_notice',
      () => settings.showNotice !== false,
      10,
      this.getName()
    );

    // 2. Filtro: Título personalizado
    hooks.addFilter<string>(
      'login:wmf_custom_title',
      (defaultTitle) => {
        if (settings.customTitle && typeof settings.customTitle === 'string' && settings.customTitle.trim()) {
          return settings.customTitle.trim();
        }
        return defaultTitle;
      },
      10,
      this.getName()
    );

    // 3. Filtro: Mensagem explicativa personalizada
    hooks.addFilter<string>(
      'login:wmf_custom_message',
      (defaultMsg) => {
        if (settings.customMessage && typeof settings.customMessage === 'string' && settings.customMessage.trim()) {
          return settings.customMessage.trim();
        }
        return defaultMsg;
      },
      10,
      this.getName()
    );

    // 4. Filtro: Se oculta botões de teste
    hooks.addFilter<boolean>(
      'login:wmf_hide_admin_testing',
      () => settings.hideAdminTestingChips === true,
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeFiltersForExtension(this.getName());
  }
}
