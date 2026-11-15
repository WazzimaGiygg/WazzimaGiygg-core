import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: InfoboxResponsiveStyler
 * Formatação e styling de tabelas de parâmetros e infocaixas enciclopédicas.
 */
export default class InfoboxResponsiveStyler implements WikiExtension {
  getName(): string {
    return 'InfoboxResponsiveStyler';
  }

  getVersion(): string {
    return '1.5.0';
  }

  getDescription(): string {
    return 'Padronização visual e semântica de fichas técnicas e infocaixas enciclopédicas em layouts responsivos modernos.';
  }

  getAuthor(): string {
    return 'Design Core WikiZero';
  }

  getCategory(): 'formatting' {
    return 'formatting';
  }

  isCore(): boolean {
    return false;
  }

  onRegister(hooks: HookRegistry): void {
    hooks.addFilter<string>(
      'render:wikitext',
      (rawWikitext: string) => {
        if (!rawWikitext || typeof rawWikitext !== 'string') return rawWikitext;

        // Se encontrar tabela infobox padrão, assegura estilização aprimorada
        return rawWikitext.replace(
          /class="([^"]*infobox[^"]*)"/gi,
          'class="$1 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-3.5"'
        );
      },
      12,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
  }
}
