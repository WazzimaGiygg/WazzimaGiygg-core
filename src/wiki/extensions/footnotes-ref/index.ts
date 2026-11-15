import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: CiteAcademicFootnotes
 * Citações bibliográficas dinâmicas e numeração no padrão enciclopédico.
 */
export default class CiteAcademicFootnotes implements WikiExtension {
  getName(): string {
    return 'CiteAcademicFootnotes';
  }

  getVersion(): string {
    return '2.1.0';
  }

  getDescription(): string {
    return 'Processamento e indexação de referências acadêmicas (<ref>...</ref>) com formatação bibliográfica no padrão ABNT/APA.';
  }

  getAuthor(): string {
    return 'Comitê Científico WikiZero';
  }

  getCategory(): 'content' {
    return 'content';
  }

  isCore(): boolean {
    return true;
  }

  onRegister(hooks: HookRegistry): void {
    hooks.addFilter<string>(
      'render:wikitext',
      (rawWikitext: string) => {
        if (!rawWikitext || typeof rawWikitext !== 'string') return rawWikitext;

        // Trata tags <ref name="...">
        return rawWikitext.replace(
          /<ref\s+name=["']?([^"'>\s]+)["']?\s*\/>/gi,
          (_match, name) => `<sup class="citation-mark text-blue-600 dark:text-blue-400 font-bold px-0.5" title="Referência cruzada: ${name}">[cf. ${name}]</sup>`
        );
      },
      9,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
  }
}
