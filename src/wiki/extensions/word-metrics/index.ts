import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: EditorialMetricsCollector
 * Coleta contagem de palavras, caracteres e estimativas estatísticas do corpo de texto.
 */
export default class EditorialMetricsCollector implements WikiExtension {
  getName(): string {
    return 'EditorialMetricsCollector';
  }

  getVersion(): string {
    return '1.3.0';
  }

  getDescription(): string {
    return 'Analisa e sintetiza métricas quantitativas de verbetes: densidade lexical, contagem de palavras e vocabulário único.';
  }

  getAuthor(): string {
    return 'Laboratório de Métricas WikiZero';
  }

  getCategory(): 'utility' {
    return 'utility';
  }

  isCore(): boolean {
    return false;
  }

  onRegister(hooks: HookRegistry): void {
    hooks.addFilter<Record<string, any>>(
      'article:metrics',
      (metrics: Record<string, any> = {}, text?: string) => {
        if (!text || typeof text !== 'string') return metrics;

        const words = text.trim().split(/\s+/).filter(Boolean);
        const uniqueWords = new Set(words.map((w) => w.toLowerCase()));

        return {
          ...metrics,
          wordCount: words.length,
          characterCount: text.length,
          uniqueWordCount: uniqueWords.size,
          lexicalDiversityRatio: words.length > 0 ? (uniqueWords.size / words.length).toFixed(2) : '1.00',
        };
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
  }
}
