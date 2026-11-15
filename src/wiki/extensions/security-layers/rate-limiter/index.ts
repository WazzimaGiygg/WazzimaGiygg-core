import { HookRegistry, WikiExtension } from '../../../core/Extension';

/**
 * Extension: WikiRateLimiterSecurityLayer (Versão 3.304 - Camada de Segurança 304.6)
 * Categoria: security (Segurança)
 * Funcionalidade: Limita taxa de requisições de salvamento e proteção contra abusos automatizados.
 */
export default class WikiRateLimiterSecurityLayer implements WikiExtension {
  getName(): string {
    return 'WikiRateLimiterSecurityLayer';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Camada de Segurança de Nuvem (304.6): Limitador de Taxa e Proteção Anti-Abuso. Controla frequência de requisições para salvamento de artigos e previne ataques de negação de serviço e sobrecarga de requisições.';
  }

  getAuthor(): string {
    return 'Conselho de Segurança WikiZero / Sysop Pedro Henrique';
  }

  getCategory(): 'security' {
    return 'security';
  }

  isCore(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://wikiworldweb.org/security/rate-limiter';
  }

  onRegister(hooks: HookRegistry): void {
    hooks.addFilter<Record<string, any>>(
      'security:layers_active',
      (layers = {}) => ({
        ...layers,
        rateLimiter: {
          name: this.getName(),
          version: this.getVersion(),
          active: true,
          type: 'RATE_LIMITER',
          maxActionsPerMinute: 30,
        },
      }),
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
  }
}
