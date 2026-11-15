import { HookRegistry, WikiExtension } from '../../../core/Extension';

/**
 * Extension: WikiXssSanitizerSecurityLayer (Versão 3.304 - Camada de Segurança 304.6)
 * Categoria: security (Segurança)
 * Funcionalidade: Filtra e sanitiza injeções XSS, tags HTML proibidas e manipuladores de eventos maliciosos em tempo real.
 */
export default class WikiXssSanitizerSecurityLayer implements WikiExtension {
  private sanitizedCount = 0;

  getName(): string {
    return 'WikiXssSanitizerSecurityLayer';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Camada de Segurança de Nuvem (304.6): Sanitizador Estrito contra XSS e injeção de scripts maliciosos. Inspeciona e neutraliza tags <script>, handlers on* e URIs javascript: antes da renderização de wikitexto na enciclopédia.';
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
    return 'https://wikiworldweb.org/security/xss-sanitizer';
  }

  onRegister(hooks: HookRegistry): void {
    // Intercepta a renderização de wikitexto com alta prioridade para neutralizar códigos maliciosos
    hooks.addFilter<string>(
      'render:wikitext',
      (content: string) => {
        if (!content || typeof content !== 'string') return content;

        let sanitized = content;
        const dangerousPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /\bon\w+\s*=\s*["'][^"']*["']/gi,
          /\bon\w+\s*=\s*[^>\s]+/gi,
          /javascript:\s*/gi,
          /data:\s*text\/html/gi,
          /<iframe\b[^>]*>/gi,
          /<\/iframe>/gi,
          /<embed\b[^>]*>/gi,
          /<object\b[^>]*>/gi,
        ];

        let matched = false;
        for (const pattern of dangerousPatterns) {
          if (pattern.test(sanitized)) {
            matched = true;
            sanitized = sanitized.replace(pattern, (match) => {
              return `<!-- [XSS Neutralizado pela Camada de Segurança 304.6]: ${match.replace(/[<>]/g, '_')} -->`;
            });
          }
        }

        if (matched) {
          this.sanitizedCount++;
        }

        return sanitized;
      },
      1, // Prioridade 1 (executa antes de qualquer renderizador de formatação)
      this.getName()
    );

    hooks.addFilter<Record<string, any>>(
      'security:layers_active',
      (layers = {}) => ({
        ...layers,
        xssSanitizer: {
          name: this.getName(),
          version: this.getVersion(),
          active: true,
          type: 'XSS_FILTER',
          sanitizedTotal: this.sanitizedCount,
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
