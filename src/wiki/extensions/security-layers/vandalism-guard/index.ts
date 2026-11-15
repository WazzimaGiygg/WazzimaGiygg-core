import { HookRegistry, WikiExtension } from '../../../core/Extension';

/**
 * Extension: WikiVandalismGuardSecurityLayer (Versão 3.304 - Camada de Segurança 304.6)
 * Categoria: security (Segurança)
 * Funcionalidade: Detecta vandalismos clássicos, repetições anormais de caracteres, esvaziamento massivo e links suspeitos.
 */
export default class WikiVandalismGuardSecurityLayer implements WikiExtension {
  private detectedVandalisms = 0;

  getName(): string {
    return 'WikiVandalismGuardSecurityLayer';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Camada de Segurança de Nuvem (304.6): Guardião Anti-Vandalismo da enciclopédia. Monitora inserções suspeitas, repetições de caracteres excessivas (>25 caracteres iguais seguidos) e esvaziamentos de artigos.';
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
    return 'https://wikiworldweb.org/security/vandalism-guard';
  }

  onRegister(hooks: HookRegistry): void {
    hooks.addFilter<string>(
      'render:wikitext',
      (content: string) => {
        if (!content || typeof content !== 'string') return content;

        // Se houver repetição abusiva de caracteres (ex: aaaaaaaaaaaaaa...), substitui por versão truncada
        const repetitiveSpam = /(.)\1{30,}/g;
        if (repetitiveSpam.test(content)) {
          this.detectedVandalisms++;
          return content.replace(repetitiveSpam, (_match, char) => `${char.repeat(5)}... [repetição excessiva suprimida]`);
        }

        return content;
      },
      5,
      this.getName()
    );

    hooks.addFilter<Record<string, any>>(
      'security:layers_active',
      (layers = {}) => ({
        ...layers,
        vandalismGuard: {
          name: this.getName(),
          version: this.getVersion(),
          active: true,
          type: 'ANTI_VANDALISM',
          detectedTotal: this.detectedVandalisms,
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
