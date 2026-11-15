import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: GeminiAssistantToolExtension
 * Categoria: tool (Ferramenta)
 * Funcionalidade: Disponibiliza o Assistente IA Gemini Studio diretamente na página de Ferramentas da Wiki.
 */
export default class GeminiAssistantToolExtension implements WikiExtension {
  getName(): string {
    return 'GeminiAssistantToolExtension';
  }

  getVersion(): string {
    return '1.5.0';
  }

  getDescription(): string {
    return 'Assistente inteligente oficial integrado do Google AI Studio para auxílio em pesquisa enciclopédica, geração e revisão de artigos em Wikitext, síntese de conhecimento, verificação factual e auxílio multimídia.';
  }

  getAuthor(): string {
    return 'Google AI Studio / Equipe WikiZero';
  }

  getCategory(): 'tool' {
    return 'tool';
  }

  isCore(): boolean {
    return false;
  }

  getWebsite(): string {
    return 'https://aistudio.google.com';
  }

  onRegister(hooks: HookRegistry): void {
    // 1. Sinaliza disponibilidade do assistente Gemini no sistema de ferramentas
    hooks.addFilter<boolean>(
      'tool:gemini-assistant_available',
      () => true,
      10,
      this.getName()
    );

    // 2. Registra o ID da ferramenta na lista dinâmica de ferramentas ativas da enciclopédia
    hooks.addFilter<string[]>(
      'tools:registered_tools',
      (tools: string[] = []) => {
        if (!tools.includes('gemini-assistant')) {
          return [...tools, 'gemini-assistant'];
        }
        return tools;
      },
      10,
      this.getName()
    );

    // 3. Gancho de auditoria para abertura da ferramenta de IA
    hooks.addAction(
      'tool:gemini-assistant:opened',
      () => {
        console.info('[GeminiAssistantToolExtension] Assistente IA Gemini Studio aberto na aba de Ferramentas.');
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    console.info('[GeminiAssistantToolExtension] Extensão do Assistente IA Gemini Studio desativada pelo burocrata.');
  }
}
