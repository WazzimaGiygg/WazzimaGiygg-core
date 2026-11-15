import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: WeatherForecastToolExtension
 * Categoria: tool (Ferramenta)
 * Funcionalidade: Estação meteorológica e previsão do tempo completa com busca global, geolocalização e previsão estendida.
 */
export default class WeatherForecastToolExtension implements WikiExtension {
  getName(): string {
    return 'WeatherForecastToolExtension';
  }

  getVersion(): string {
    return '1.4.0';
  }

  getDescription(): string {
    return 'Estação meteorológica e previsão do tempo em tempo real com busca global de cidades, geolocalização, índice UV, umidade, vento, nascer/pôr do sol e previsão estendida de 7 dias via Open-Meteo API.';
  }

  getAuthor(): string {
    return 'WikiZero Meteorologia / Open-Meteo';
  }

  getCategory(): 'tool' {
    return 'tool';
  }

  isCore(): boolean {
    return false;
  }

  getWebsite(): string {
    return 'https://open-meteo.com';
  }

  onRegister(hooks: HookRegistry): void {
    // Informa que a ferramenta de previsão do tempo está ativa
    hooks.addFilter<boolean>(
      'tool:weather_available',
      () => true,
      10,
      this.getName()
    );

    // Registra na lista dinâmica de ferramentas ativas da enciclopédia
    hooks.addFilter<string[]>(
      'tools:registered_tools',
      (tools: string[] = []) => {
        if (!tools.includes('weather')) {
          return [...tools, 'weather'];
        }
        return tools;
      },
      10,
      this.getName()
    );

    hooks.addAction(
      'tool:weather:opened',
      () => {
        console.info('[WeatherForecastToolExtension] Previsão do tempo consultada pelo usuário.');
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    console.info('[WeatherForecastToolExtension] Extensão de Previsão do Tempo desativada pelo burocrata.');
  }
}
