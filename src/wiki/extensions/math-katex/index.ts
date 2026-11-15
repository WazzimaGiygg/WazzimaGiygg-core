import { HookRegistry, WikiExtension } from '../../core/Extension';
import katex from 'katex';

/**
 * Extension: MathKatex
 * Converte marcações matemáticas <math>...</math> em fórmulas tipográficas com o motor real KaTeX.
 */
export default class MathKatex implements WikiExtension {
  getName(): string {
    return 'MathKatex';
  }

  getVersion(): string {
    return '2.0.0';
  }

  getDescription(): string {
    return 'Renderiza expressões e equações matemáticas com o motor real KaTeX em notação visual tipograficamente refinada.';
  }

  getAuthor(): string {
    return 'Conselho Científico & Wikimedia Foundation';
  }

  getCategory(): 'rendering' {
    return 'rendering';
  }

  isCore(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://katex.org';
  }

  onRegister(hooks: HookRegistry): void {
    // Transforma tags <math>formula</math> em HTML estilizado do KaTeX
    hooks.addFilter<string>(
      'render:wikitext',
      (rawWikitext: string) => {
        if (!rawWikitext || typeof rawWikitext !== 'string') return rawWikitext;

        return rawWikitext.replace(
          /<math(?:\s+display=["']?(inline|block)["']?)?>([\s\S]*?)<\/math>/gi,
          (_match, displayAttr, formula) => {
            const isBlock = displayAttr?.toLowerCase() === 'block' || (formula && formula.includes('\n'));
            try {
              const rendered = katex.renderToString((formula || '').trim(), {
                throwOnError: false,
                displayMode: isBlock,
                output: 'htmlAndMathml',
              });
              if (isBlock) {
                return `\n\n<div class="wiki-math-block my-4 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-center not-prose shadow-xs">${rendered}</div>\n\n`;
              }
              return `<span class="wiki-math-inline align-middle mx-1 inline-block">${rendered}</span>`;
            } catch {
              return `<code class="font-mono text-xs text-rose-500">${(formula || '').trim()}</code>`;
            }
          }
        );
      },
      8,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
  }
}
