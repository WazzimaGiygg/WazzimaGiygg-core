import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: WorldClockToolExtension
 * Categoria: tool (Ferramenta)
 * Funcionalidade: Disponibiliza o Horário Certo Mundial com todos os fusos horários do Brasil, continentes, UTC e simulador temporal.
 */
export default class WorldClockToolExtension implements WikiExtension {
  getName(): string {
    return 'WorldClockToolExtension';
  }

  getVersion(): string {
    return '1.3.0';
  }

  getDescription(): string {
    return 'Painel de Horário Certo Mundial com catalogação completa de fusos horários do Brasil (Brasília, Fernando de Noronha, Manaus e Acre), capitais globais, indicador dia/noite e simulador/conversor temporal ao vivo.';
  }

  getAuthor(): string {
    return 'WikiZero Tools / Equipe WikiWorldWeb';
  }

  getCategory(): 'tool' {
    return 'tool';
  }

  isCore(): boolean {
    return false;
  }

  getWebsite(): string {
    return 'https://wikiworldweb.org/tools/world-clock';
  }

  onRegister(hooks: HookRegistry): void {
    // Informa que a ferramenta de horário mundial está ativa
    hooks.addFilter<boolean>(
      'tool:world_clock_available',
      () => true,
      10,
      this.getName()
    );

    // Registra na lista dinâmica de ferramentas ativas da enciclopédia
    hooks.addFilter<string[]>(
      'tools:registered_tools',
      (tools: string[] = []) => {
        if (!tools.includes('world-clock')) {
          return [...tools, 'world-clock'];
        }
        return tools;
      },
      10,
      this.getName()
    );

    hooks.addAction(
      'tool:world_clock:opened',
      () => {
        console.info('[WorldClockToolExtension] Horário Certo Mundial aberto pelo usuário.');
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    console.info('[WorldClockToolExtension] Extensão de Horário Mundial desativada pelo burocrata.');
  }
}
