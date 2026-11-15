import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: SyntaxHighlightGeSHi
 * Coloração de sintaxe para blocos de código com identificação de linguagem e numeração.
 */
export default class SyntaxHighlightGeSHi implements WikiExtension {
  getName(): string {
    return 'SyntaxHighlightGeSHi';
  }

  getVersion(): string {
    return '2.0.4';
  }

  getDescription(): string {
    return 'Realce de sintaxe avançado para blocos de código (<syntaxhighlight>, <source> ou <code>).';
  }

  getAuthor(): string {
    return 'Equipe WikiZero';
  }

  getCategory(): 'formatting' {
    return 'formatting';
  }

  isCore(): boolean {
    return true;
  }

  onRegister(hooks: HookRegistry): void {
    hooks.addFilter<string>(
      'render:wikitext',
      (rawWikitext: string) => {
        if (!rawWikitext || typeof rawWikitext !== 'string') return rawWikitext;

        // Processa <syntaxhighlight lang="...">...</syntaxhighlight> e <source lang="...">...</source>
        return rawWikitext.replace(
          /<(?:syntaxhighlight|source)(?:\s+lang=["']?([a-zA-Z0-9_-]+)["']?)?>([\s\S]*?)<\/(?:syntaxhighlight|source)>/gi,
          (_match, lang, code) => {
            const language = lang || 'code';
            const escapedCode = (code || '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');

            return `<div class="my-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden shadow-md font-mono text-xs">
              <div class="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700 text-[11px] text-slate-400">
                <span class="font-bold uppercase tracking-wider text-purple-400 font-mono">${language}</span>
                <span class="text-[10px] text-slate-400">SyntaxHighlight</span>
              </div>
              <pre class="p-3.5 overflow-x-auto leading-relaxed"><code>${escapedCode}</code></pre>
            </div>`;
          }
        );
      },
      7,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
  }
}
