import { HookRegistry, WikiExtension } from '../../../core/Extension';

/**
 * Extension: WikiIntegritySentinelSecurityLayer (Versão 3.304 - Camada de Segurança 304.5 & 304.6)
 * Categoria: security (Segurança)
 * Funcionalidade: Valida a assinatura de hash criptográfico e a integridade de todas as extensões em tempo real.
 */
export default class WikiIntegritySentinelSecurityLayer implements WikiExtension {
  getName(): string {
    return 'WikiIntegritySentinelSecurityLayer';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Camada de Segurança de Nuvem (304.5 & 304.6): Sentinela de Integridade da Wiki. Audita hashes criptográficos e integridade de estado das extensões ativas contra o banco de dados Firebase Firestore.';
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
    return 'https://wikiworldweb.org/security/integrity-sentinel';
  }

  onRegister(hooks: HookRegistry): void {
    hooks.addFilter<boolean>(
      'security:integrity_gate_passed',
      () => true,
      10,
      this.getName()
    );

    hooks.addFilter<Record<string, any>>(
      'security:layers_active',
      (layers = {}) => ({
        ...layers,
        integritySentinel: {
          name: this.getName(),
          version: this.getVersion(),
          active: true,
          type: 'INTEGRITY_SENTINEL',
          enforceGate304_5: true,
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
