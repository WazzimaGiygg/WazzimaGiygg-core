import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: ExternalLinkRedirectorExtension (Update 3.05 - Requisito 3.05.3.c)
 * Categoria: security
 * Funcionalidade: Intercepta e formata links externos da enciclopédia através de um
 * redirecionador com UID (padrão: https://wazzimagiygg.com/rv/?uid=), permitindo
 * desativar o redirecionador ou alterar o prefixo do UID nas próprias configurações.
 */
export default class ExternalLinkRedirectorExtension implements WikiExtension {
  public static readonly DEFAULT_REDIRECT_PREFIX = 'https://wazzimagiygg.com/rv/?uid=';

  getName(): string {
    return 'ExternalLinkRedirectorExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Transforma o redirecionamento de links externos em extensão: permite desativar o redirecionador por completo ou alterar a URL base do UID (padrão: https://wazzimagiygg.com/rv/?uid=).';
  }

  getAuthor(): string {
    return 'WazzimaGiygg Security Architecture';
  }

  getCategory(): ExtensionCategory {
    return 'security';
  }

  isCore(): boolean {
    return false;
  }

  getWebsite(): string {
    return 'https://wazzimagiygg.com/rv/';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'enableRedirector',
        label: 'Ativar Redirecionador de Links Externos',
        type: 'boolean',
        defaultValue: true,
        description: 'Se desativado, os links externos serão abertos diretamente sem passar pelo intermediário de segurança com UID.',
      },
      {
        key: 'redirectorBaseUrl',
        label: 'URL Base do Redirecionador com UID',
        type: 'string',
        defaultValue: ExternalLinkRedirectorExtension.DEFAULT_REDIRECT_PREFIX,
        description: 'Prefixo inserido antes de qualquer link externo. Padrão: https://wazzimagiygg.com/rv/?uid=',
      },
      {
        key: 'protectAgainstXSS',
        label: 'Filtrar URLs Maliciosas (javascript: / data:)',
        type: 'boolean',
        defaultValue: true,
        description: 'Bloqueia protocolos perigosos em links externos antes de aplicar o redirecionamento.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const isEnabled = settings.enableRedirector !== false;
    const prefix = settings.redirectorBaseUrl || ExternalLinkRedirectorExtension.DEFAULT_REDIRECT_PREFIX;

    hooks.addFilter<string>(
      'link:external_redirect_prefix',
      () => (isEnabled ? prefix : ''),
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'link:redirector_enabled',
      () => isEnabled,
      10,
      this.getName()
    );

    hooks.addAction(
      'link:external_navigated',
      (payload?: { targetUrl?: string; fullUrl?: string }) => {
        console.info('[ExternalLinkRedirectorExtension] Link externo acessado:', payload);
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    hooks.addFilter<string>(
      'link:external_redirect_prefix',
      () => '',
      10,
      this.getName()
    );
    hooks.addFilter<boolean>(
      'link:redirector_enabled',
      () => false,
      10,
      this.getName()
    );
  }
}
