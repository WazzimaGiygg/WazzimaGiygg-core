import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: DisambiguationNotice
 * Injeção de avisos editoriais e links para tópicos correlatos homônimos.
 */
export default class DisambiguationNotice implements WikiExtension {
  getName(): string {
    return 'DisambiguationNotice';
  }

  getVersion(): string {
    return '1.1.2';
  }

  getDescription(): string {
    return 'Detecta termos com múltiplos significados e injeta barras informativas de desambiguação no topo dos verbetes.';
  }

  getAuthor(): string {
    return 'Conselho Editorial WikiZero';
  }

  getCategory(): 'content' {
    return 'content';
  }

  isCore(): boolean {
    return false;
  }

  onRegister(hooks: HookRegistry): void {
    hooks.addFilter<string>(
      'render:wikitext',
      (rawWikitext: string) => {
        if (!rawWikitext || typeof rawWikitext !== 'string') return rawWikitext;

        // Processa {{desambiguação}} ou {{desambig}}
        return rawWikitext.replace(
          /\{\{(?:desambiguação|desambig|disambig)(?:\|([^}]+))?\}\}/gi,
          (_match, note) => {
            const extra = note ? `: ${note}` : '';
            return `<div class="p-3 my-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <span class="font-bold">⚠️ Nota de Desambiguação${extra}:</span>
              <span>Se procura outro significado para este verbete, consulte os artigos correlatos.</span>
            </div>`;
          }
        );
      },
      6,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
  }
}
