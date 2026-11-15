/**
 * @file src/extensions/first-visit-news-popup/index.ts
 * @description Extensão que permite alterar ou desabilitar o popup de notícia exibido
 * quando o usuário entra pela primeira vez no Wiki-site, permitindo ao burocrata
 * adicionar código HTML personalizado.
 *
 * Atende ao requisito: 4.1.1.Y5.4
 */

import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';
import { DEFAULT_FIRST_VISIT_HTML } from './defaultHtml';
export { DEFAULT_FIRST_VISIT_HTML };
export default class FirstVisitNewsPopupExtension implements WikiExtension {
  getName(): string {
    return 'FirstVisitNewsPopupExtension';
  }

  getVersion(): string {
    return '4.1.1';
  }

  getDescription(): string {
    return 'Controla o popup de notícia e boas-vindas exibido quando o usuário entra pela primeira vez no Wiki-site. Permite ao Burocrata desabilitar o popup ou inserir código HTML personalizado para anúncios e atualizações (4.1.1.Y5.4).';
  }

  getAuthor(): string {
    return 'Conselho de Burocratas & Comunicação da WikiZero';
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
        key: 'popupEnabled',
        label: 'Ativar Popup de Notícia de Primeiro Acesso',
        type: 'boolean',
        defaultValue: true,
        description: 'Se desmarcado, nenhum popup automático será aberto para os novos visitantes ao entrarem no Wiki-site.',
      },
      {
        key: 'popupTitle',
        label: 'Título do Popup de Notícia',
        type: 'string',
        defaultValue: 'Comunicado Oficial & Atualizações da WikiZero',
        description: 'Título principal exibido no cabeçalho do popup modal.',
      },
      {
        key: 'badgeLabel',
        label: 'Etiqueta / Badge Superior',
        type: 'string',
        defaultValue: 'INFORMATIVO OFICIAL',
        description: 'Texto exibido no topo do modal como indicador de anúncio (ex: NOTÍCIA, ATUALIZAÇÃO 4.1.1).',
      },
      {
        key: 'customHtmlCode',
        label: 'Código HTML Personalizado (Burocratas)',
        type: 'string',
        defaultValue: DEFAULT_FIRST_VISIT_HTML,
        description: 'Código HTML personalizado que será renderizado no corpo do popup notícia. Burocratas podem estilizar com classes Tailwind CSS, títulos, parágrafos, listas e imagens.',
      },
      {
        key: 'showOnlyOnFirstVisit',
        label: 'Exibir apenas na primeira visita do usuário',
        type: 'boolean',
        defaultValue: true,
        description: 'Se marcado, o popup só será exibido uma vez por visitante (ou até o burocrata alterar o ID de versão abaixo). Se desmarcado, exibe em todas as sessões.',
      },
      {
        key: 'popupVersion',
        label: 'Identificador / Versão do Comunicado',
        type: 'string',
        defaultValue: 'v4.1.1-news',
        description: 'Ao alterar este identificador (ex: v4.1.2), o popup reaparecerá mesmo para quem já havia clicado em dispensar a versão anterior.',
      },
      {
        key: 'buttonLabel',
        label: 'Texto do Botão de Fechamento',
        type: 'string',
        defaultValue: 'Entendido e Continuar Navegando',
        description: 'Texto exibido no botão principal de confirmação e fechamento do popup.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};

    // 1. Hook para verificar se o popup de primeiro acesso está ativo
    hooks.addFilter<boolean>(
      'first_visit_popup:is_enabled',
      (current) => {
        if (settings.popupEnabled !== undefined) {
          return settings.popupEnabled === true;
        }
        return current;
      },
      10,
      this.getName()
    );

    // 2. Hook para obter o HTML customizado
    hooks.addFilter<string>(
      'first_visit_popup:html_content',
      (defaultHtml) => {
        if (settings.customHtmlCode && typeof settings.customHtmlCode === 'string' && settings.customHtmlCode.trim()) {
          return settings.customHtmlCode;
        }
        return defaultHtml || DEFAULT_FIRST_VISIT_HTML;
      },
      10,
      this.getName()
    );

    // 3. Hook para obter o título
    hooks.addFilter<string>(
      'first_visit_popup:title',
      (defaultTitle) => {
        if (settings.popupTitle && typeof settings.popupTitle === 'string' && settings.popupTitle.trim()) {
          return settings.popupTitle;
        }
        return defaultTitle || 'Comunicado Oficial & Atualizações da WikiZero';
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeFiltersForExtension(this.getName());
  }
}
