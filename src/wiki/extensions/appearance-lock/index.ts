import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: AppearanceLockExtension (Update 3.05 - Requisito 3.05.3.l)
 * Categoria: appearance
 * Funcionalidade: Controla a permissão de mudança de aparência.
 * Quando esta extensão estiver DESABILITADA pelo burocrata, a mudança de aparência é bloqueada,
 * forçando a aparência padrão do Wiki (tema padrão claro com contraste adaptado) ao entrar no Wiki-site.
 */
export default class AppearanceLockExtension implements WikiExtension {
  getName(): string {
    return 'AppearanceLockExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Controla a flexibilidade de temas do Wiki-site. Quando DESATIVADA pelo burocrata, desabilita a mudança de aparência para todos os usuários, forçando a aparência padrão clássica do Wiki ao entrar no site.';
  }

  getAuthor(): string {
    return 'WikiWorldWeb Design & Appearance Guild';
  }

  getCategory(): ExtensionCategory {
    return 'theme';
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
        key: 'defaultForcedTheme',
        label: 'Aparência Padrão Forçada',
        type: 'select',
        defaultValue: 'light',
        options: ['light', 'dark'],
        description: 'Tema que será aplicado compulsoriamente se o controle de temas estiver bloqueado (light = claro com alto contraste adaptado).',
      },
      {
        key: 'showLockedNotice',
        label: 'Exibir aviso discreto na página de aparência',
        type: 'boolean',
        defaultValue: true,
        description: 'Informa aos usuários que a personalização de aparência foi fixada pelo burocrata.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    // Quando ATIVADA: permite personalização livre de temas e aparências
    hooks.addFilter<boolean>(
      'appearance:customization_allowed',
      () => true,
      10,
      this.getName()
    );

    hooks.addFilter<string>(
      'appearance:default_fallback_theme',
      (prev) => prev || 'light',
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    // Quando DESATIVADA: desabilita a mudança de aparência, forçando a aparência padrão do Wiki
    hooks.addFilter<boolean>(
      'appearance:customization_allowed',
      () => false,
      10,
      this.getName()
    );

    hooks.addFilter<string>(
      'appearance:default_fallback_theme',
      () => 'light',
      10,
      this.getName()
    );
  }
}
