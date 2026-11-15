import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: DefaultLanguageExtension (Update 3.05 - Requisito 3.05.3.x)
 * Categoria: utility
 * Funcionalidade: Determina qual idioma é o idioma padrão oficial do Wiki-Site,
 * conforme o que o Burocrata definir nas configurações.
 */
export default class DefaultLanguageExtension implements WikiExtension {
  getName(): string {
    return 'DefaultLanguageExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Permite ao Burocrata determinar o idioma padrão oficial da Wiki (Português, Inglês, Espanhol, Francês, Alemão, Japonês, Chinês, Russo, Árabe ou Italiano) para novos visitantes e navegação do site.';
  }

  getAuthor(): string {
    return 'WikiZero Multilingual Localization Guild';
  }

  getCategory(): ExtensionCategory {
    return 'utility';
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
        key: 'defaultLanguage',
        label: 'Idioma Padrão Oficial do Wiki-Site',
        type: 'select',
        defaultValue: 'pt',
        options: ['pt', 'en', 'es', 'fr', 'de', 'ja', 'zh', 'ru', 'ar', 'it'],
        description: 'Selecione o idioma padrão com o qual os visitantes carregarão a enciclopédia.',
      },
      {
        key: 'forceDefaultLanguage',
        label: 'Priorizar Idioma Padrão sobre o Idioma do Navegador',
        type: 'boolean',
        defaultValue: true,
        description: 'Quando ativado, novos visitantes verão a Wiki no idioma padrão escolhido, ignorando a linguagem do navegador.',
      },
      {
        key: 'allowUserOverride',
        label: 'Permitir que Usuários Escolham Outro Idioma',
        type: 'boolean',
        defaultValue: true,
        description: 'Mantém o seletor de idiomas disponível para que os usuários possam navegar em sua língua preferida.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const configuredLang = (settings.defaultLanguage as string) || 'pt';

    // 1. Filtro: Idioma padrão oficial do site
    hooks.addFilter<string>(
      'i18n:default_language',
      () => configuredLang,
      10,
      this.getName()
    );

    // 2. Filtro: Se deve forçar o padrão sobre o navegador
    hooks.addFilter<boolean>(
      'i18n:force_default',
      () => settings.forceDefaultLanguage !== false,
      10,
      this.getName()
    );

    // 3. Filtro: Se usuários podem alterar
    hooks.addFilter<boolean>(
      'i18n:allow_user_override',
      () => settings.allowUserOverride !== false,
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeFiltersForExtension(this.getName());
  }
}
