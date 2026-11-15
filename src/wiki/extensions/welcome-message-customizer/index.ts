import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: WelcomeMessageCustomizerExtension (Update 3.05 - Requisito 3.05.3.w)
 * Categoria: content
 * Funcionalidade: Permite alterar a mensagem de "Boas-vindas" na página principal
 * para uma mensagem customizada pelo Burocrata ou deixar a padrão por arquivo do repositório.
 */
export default class WelcomeMessageCustomizerExtension implements WikiExtension {
  getName(): string {
    return 'WelcomeMessageCustomizerExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Permite ao Burocrata personalizar o título, badge, lema e mensagem de boas-vindas na página principal da Wiki ou restaurar a mensagem padrão do repositório de traduções.';
  }

  getAuthor(): string {
    return 'WikiZero Editorial Board & Community Outreach';
  }

  getCategory(): ExtensionCategory {
    return 'content';
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
        key: 'useCustomMessage',
        label: 'Ativar Mensagem Customizada pelo Burocrata',
        type: 'boolean',
        defaultValue: false,
        description: 'Se desmarcado, utiliza a mensagem padrão por arquivo do repositório (i18n). Se marcado, utiliza os textos configurados abaixo.',
      },
      {
        key: 'customTitle',
        label: 'Título de Boas-Vindas Customizado',
        type: 'string',
        defaultValue: '',
        description: 'Exemplo: "Boas-vindas à WikiZero, a enciclopédia aberta e livre." Deixe vazio para manter o padrão.',
      },
      {
        key: 'customBadge',
        label: 'Etiqueta / Badge Superior',
        type: 'string',
        defaultValue: '',
        description: 'Exemplo: "PORTAL OFICIAL", "BOAS-VINDAS". Deixe vazio para manter o padrão.',
      },
      {
        key: 'customDescription',
        label: 'Descrição / Texto Explicativo de Boas-Vindas',
        type: 'string',
        defaultValue: '',
        description: 'Texto de introdução exibido abaixo do título principal. Deixe vazio para manter o padrão.',
      },
      {
        key: 'customMotto',
        label: 'Lema / Frase Principal da Wiki Customizada',
        type: 'string',
        defaultValue: '',
        description: 'Substitui a citação clássica da página principal. Deixe vazio para manter a padrão.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const isCustomActive = settings.useCustomMessage === true;

    // 1. Filtro: Título de Boas-Vindas
    hooks.addFilter<string>(
      'mainpage:welcome_title',
      (defaultTitle) => {
        if (isCustomActive && settings.customTitle && typeof settings.customTitle === 'string' && settings.customTitle.trim()) {
          return settings.customTitle.trim();
        }
        return defaultTitle;
      },
      10,
      this.getName()
    );

    // 2. Filtro: Badge superior
    hooks.addFilter<string>(
      'mainpage:welcome_badge',
      (defaultBadge) => {
        if (isCustomActive && settings.customBadge && typeof settings.customBadge === 'string' && settings.customBadge.trim()) {
          return settings.customBadge.trim();
        }
        return defaultBadge;
      },
      10,
      this.getName()
    );

    // 3. Filtro: Descrição de Boas-Vindas
    hooks.addFilter<string>(
      'mainpage:welcome_desc',
      (defaultDesc) => {
        if (isCustomActive && settings.customDescription && typeof settings.customDescription === 'string' && settings.customDescription.trim()) {
          return settings.customDescription.trim();
        }
        return defaultDesc;
      },
      10,
      this.getName()
    );

    // 4. Filtro: Lema / Frase Principal
    hooks.addFilter<string>(
      'mainpage:welcome_motto',
      (defaultMotto) => {
        if (isCustomActive && settings.customMotto && typeof settings.customMotto === 'string' && settings.customMotto.trim()) {
          return settings.customMotto.trim();
        }
        return defaultMotto;
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeFiltersForExtension(this.getName());
  }
}
