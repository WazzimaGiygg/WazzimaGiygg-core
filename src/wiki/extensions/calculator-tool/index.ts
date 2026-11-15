import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: CalculatorToolExtension
 * Categoria: tool (Ferramenta)
 * Funcionalidade: Disponibiliza a Calculadora Multiuso com modo padrão, científico e histórico persistente.
 */
export default class CalculatorToolExtension implements WikiExtension {
  getName(): string {
    return 'CalculatorToolExtension';
  }

  getVersion(): string {
    return '1.2.0';
  }

  getDescription(): string {
    return 'Calculadora interativa multiúso com modo padrão, funções científicas avançadas (trigonometria, logaritmos, potências e raízes), constantes matemáticas e histórico persistente de cálculos para consultas na enciclopédia.';
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
    return 'https://wikiworldweb.org/tools/calculator';
  }

  onRegister(hooks: HookRegistry): void {
    // Informa que a calculadora está ativa no sistema
    hooks.addFilter<boolean>(
      'tool:calculator_available',
      () => true,
      10,
      this.getName()
    );

    // Registra na lista dinâmica de ferramentas ativas da enciclopédia
    hooks.addFilter<string[]>(
      'tools:registered_tools',
      (tools: string[] = []) => {
        if (!tools.includes('calculator')) {
          return [...tools, 'calculator'];
        }
        return tools;
      },
      10,
      this.getName()
    );

    hooks.addAction(
      'tool:calculator:opened',
      () => {
        console.info('[CalculatorToolExtension] Calculadora iniciada pelo usuário.');
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    console.info('[CalculatorToolExtension] Extensão da Calculadora desativada pelo burocrata.');
  }
}
