import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField, DeviceMode } from '../../types';

/**
 * Extension: MobileVersionControlExtension (Update 3.05 - Requisito 3.05.3.s)
 * Categoria: interface
 * Funcionalidade: Permite ao burocrata habilitar ou desabilitar a versão mobile
 * do Wiki-site. Quando desabilitada, impede a ativação do modo mobile e força
 * a interface para computador (desktop).
 */
export default class MobileVersionControlExtension implements WikiExtension {
  getName(): string {
    return 'MobileVersionControlExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Permite ao Burocrata habilitar ou desabilitar a versão mobile da enciclopédia. Quando desativada, força o layout de computador e remove os seletores de versão móvel.';
  }

  getAuthor(): string {
    return 'WikiZero Responsive Framework Team';
  }

  getCategory(): ExtensionCategory {
    return 'interface';
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
        key: 'mobileEnabled',
        label: 'Versão Mobile Habilitada',
        type: 'boolean',
        defaultValue: true,
        description: 'Se desmarcado pelo burocrata, desativa a versão móvel para todos os usuários do site.',
      },
      {
        key: 'forceDesktopOnly',
        label: 'Forçar Layout para Computador (Desktop Only)',
        type: 'boolean',
        defaultValue: false,
        description: 'Força a renderização do layout para computador mesmo em dispositivos móveis.',
      },
      {
        key: 'showToggleInFooter',
        label: 'Exibir botão de alternância no rodapé',
        type: 'boolean',
        defaultValue: true,
        description: 'Exibe ou oculta o botão "Versão móvel" no rodapé da página.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const mobileAllowed = settings.mobileEnabled !== false;

    // 1. Filtro: Permissão do modo mobile
    hooks.addFilter<boolean>(
      'mobile:is_enabled',
      () => mobileAllowed,
      10,
      this.getName()
    );

    // 2. Filtro: Modo forçado quando mobile está desabilitado
    hooks.addFilter<DeviceMode>(
      'mobile:forced_device_mode',
      (currentMode) => {
        if (!mobileAllowed || settings.forceDesktopOnly === true) {
          return 'desktop';
        }
        return currentMode;
      },
      10,
      this.getName()
    );

    // 3. Filtro: Exibição do botão de alternância no rodapé
    hooks.addFilter<boolean>(
      'mobile:show_footer_toggle',
      () => mobileAllowed && settings.showToggleInFooter !== false,
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeFiltersForExtension(this.getName());
  }
}
