import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: MazeRecaptchaControlExtension (Update 3.05 - Requisito 3.05.3.u)
 * Categoria: security
 * Funcionalidade: Permite ao Burocrata habilitar ou desabilitar o reCAPTCHA de
 * labirinto no login, além de personalizar ou remover completamente a regra
 * de tempo mínimo de resolução (padrão de 15 segundos).
 */
export default class MazeRecaptchaControlExtension implements WikiExtension {
  getName(): string {
    return 'MazeRecaptchaControlExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Controla o desafio anti-robô (reCAPTCHA do Labirinto) na tela de autenticação. Permite habilitar/desabilitar o teste e personalizar ou desativar o tempo mínimo obrigatório de resolução.';
  }

  getAuthor(): string {
    return 'WikiZero Security & Anti-Abuse Sentinel';
  }

  getCategory(): ExtensionCategory {
    return 'security';
  }

  isCore(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://wazzimagiygg.com/';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'recaptchaEnabled',
        label: 'reCAPTCHA de Labirinto Habilitado no Login',
        type: 'boolean',
        defaultValue: true,
        description: 'Se desativado, o login com a Conta Google é liberado diretamente sem a exigência de resolver o labirinto.',
      },
      {
        key: 'minTimeRequired',
        label: 'Exigir Tempo Mínimo de Resolução',
        type: 'boolean',
        defaultValue: true,
        description: 'Se desmarcado pelo burocrata, remove a regra de bloqueio por tempo mínimo, permitindo validação imediata ao atingir o objetivo.',
      },
      {
        key: 'minRequiredSeconds',
        label: 'Tempo Mínimo em Segundos',
        type: 'number',
        defaultValue: 15,
        description: 'Duração mínima necessária em segundos para autorizar a conclusão do labirinto (padrão: 15 segundos; configure 0 para desativar).',
      },
      {
        key: 'customAntiBotMessage',
        label: 'Mensagem Personalizada de Tempo Insuficiente',
        type: 'string',
        defaultValue: '',
        description: 'Mensagem exibida caso o usuário chegue ao final antes do tempo mínimo estipulado. Deixe vazio para usar a mensagem padrão.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};

    // 1. Filtro: Se o reCAPTCHA de labirinto está ativado
    hooks.addFilter<boolean>(
      'login:recaptcha_enabled',
      () => settings.recaptchaEnabled !== false,
      10,
      this.getName()
    );

    // 2. Filtro: Se o tempo mínimo está ativado
    hooks.addFilter<boolean>(
      'login:maze_min_time_enabled',
      () => {
        if (settings.minTimeRequired === false) return false;
        const seconds = Number(settings.minRequiredSeconds ?? 15);
        return seconds > 0;
      },
      10,
      this.getName()
    );

    // 3. Filtro: Duração mínima em segundos
    hooks.addFilter<number>(
      'login:maze_min_seconds',
      () => {
        if (settings.minTimeRequired === false) return 0;
        const seconds = Number(settings.minRequiredSeconds ?? 15);
        return Math.max(0, isNaN(seconds) ? 15 : seconds);
      },
      10,
      this.getName()
    );

    // 4. Filtro: Mensagem customizada
    hooks.addFilter<string>(
      'login:maze_custom_message',
      (defaultMsg) => {
        if (settings.customAntiBotMessage && typeof settings.customAntiBotMessage === 'string' && settings.customAntiBotMessage.trim()) {
          return settings.customAntiBotMessage.trim();
        }
        return defaultMsg;
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeFiltersForExtension(this.getName());
  }
}
