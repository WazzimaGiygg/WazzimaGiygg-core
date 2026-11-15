import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: SupportTicketsExtension (Update 3.05 - Requisito 3.05.3.b)
 * Categoria: utility
 * Funcionalidade: Gerencia a integração com a Central de Suporte e Abertura de Tickets,
 * permitindo alterar a URL do suporte nas próprias configurações (padrão: https://support.wazzimagiygg.com/)
 * e ativar/desativar a opção na interface.
 */
export default class SupportTicketsExtension implements WikiExtension {
  public static readonly DEFAULT_SUPPORT_URL = 'https://support.wazzimagiygg.com/';

  getName(): string {
    return 'SupportTicketsExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Gerencia o canal oficial de Suporte e Tickets da Wiki, permitindo alterar a URL nas configurações da extensão (padrão: https://support.wazzimagiygg.com/) e controlar sua exibição.';
  }

  getAuthor(): string {
    return 'WazzimaGiygg Security & Support Team';
  }

  getCategory(): ExtensionCategory {
    return 'utility';
  }

  isCore(): boolean {
    return false;
  }

  getWebsite(): string {
    return 'https://support.wazzimagiygg.com/';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'supportUrl',
        label: 'URL da Central de Suporte & Tickets',
        type: 'string',
        defaultValue: SupportTicketsExtension.DEFAULT_SUPPORT_URL,
        description: 'Endereço oficial para envio de tickets e contato com a equipe de suporte.',
      },
      {
        key: 'buttonLabel',
        label: 'Texto do Botão de Suporte',
        type: 'string',
        defaultValue: 'Suporte & Tickets',
        description: 'Texto exibido no botão do menu lateral e cabeçalho.',
      },
      {
        key: 'showInSidebar',
        label: 'Exibir no Menu Lateral',
        type: 'boolean',
        defaultValue: true,
        description: 'Ativa ou desativa o botão de Suporte & Tickets na barra lateral esquerda.',
      },
      {
        key: 'showInFooter',
        label: 'Exibir no Rodapé Geral',
        type: 'boolean',
        defaultValue: true,
        description: 'Exibe o link oficial de suporte no rodapé da enciclopédia.',
      },
      {
        key: 'showInMobileMenu',
        label: 'Exibir no Menu Móvel',
        type: 'boolean',
        defaultValue: true,
        description: 'Exibe o atalho de suporte na gaveta de navegação móvel.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const supportUrl = settings.supportUrl || SupportTicketsExtension.DEFAULT_SUPPORT_URL;
    const buttonLabel = settings.buttonLabel || 'Suporte & Tickets';

    hooks.addFilter<string>(
      'support:url',
      () => supportUrl,
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'support:enabled',
      () => true,
      10,
      this.getName()
    );

    hooks.addFilter<string>(
      'support:button_label',
      () => buttonLabel,
      10,
      this.getName()
    );

    hooks.addAction(
      'support:ticket_clicked',
      (payload?: { url?: string; source?: string }) => {
        console.info('[SupportTicketsExtension] Redirecionamento para suporte acionado:', payload);
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    hooks.addFilter<boolean>(
      'support:enabled',
      () => false,
      10,
      this.getName()
    );
  }
}
