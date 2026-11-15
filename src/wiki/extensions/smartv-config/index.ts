import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

export interface SmartTvConfigData {
  defaultTvTheme: 'cinema' | 'midnight' | 'oled';
  defaultFontSize: 'normal' | 'grande' | 'extra';
  defaultAutoScrollSpeed: 'lento' | 'medio' | 'rapido';
  enableSoundEffects: boolean;
  enableVoiceNarration: boolean;
  overscanMargin: 'none' | 'small' | 'standard';
  enableScreensaver: boolean;
  screensaverTimeout: number; // segundos
  showRemoteLegend: boolean;
  ambientBacklight: boolean;
}

/**
 * Extension: SmartTvConfigExtension (Update 3.05 - Requisito 3.05.4.d)
 * Categoria: interface
 * Funcionalidade: Permite ao Burocrata e Administrador configurar a experiência
 * da versão SMARTV (10-Foot UI), incluindo tema padrão de tela, tamanho de fonte para
 * leitura distante na TV, velocidade de auto-scroll / teleprompter, efeitos sonoros do controle,
 * margens de overscan anti-corte, protetor de tela anti burn-in e narração por voz (TTS).
 */
export default class SmartTvConfigExtension implements WikiExtension {
  getName(): string {
    return 'SmartTvConfigExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Extensão oficial para configuração e otimização da versão SMARTV (10-Foot UI). Permite definir temas cinema/OLED, fontes de longa distância, margem de overscan, protetor de tela OLED, auto-scroll e efeitos sonoros.';
  }

  getAuthor(): string {
    return 'WikiZero Bureaucrat Operations & Smart TV Team';
  }

  getCategory(): ExtensionCategory {
    return 'interface';
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
        key: 'defaultTvTheme',
        label: 'Tema Visual Padrão da TV',
        type: 'select',
        defaultValue: 'cinema',
        options: ['cinema', 'midnight', 'oled'],
        description: 'Tema visual aplicado por padrão na Smart TV (cinema, midnight, oled).',
      },
      {
        key: 'defaultFontSize',
        label: 'Tamanho da Fonte para TV (10-Foot UI)',
        type: 'select',
        defaultValue: 'grande',
        options: ['normal', 'grande', 'extra'],
        description: 'Tamanho das letras nos artigos e menus para legibilidade confortável no sofá.',
      },
      {
        key: 'defaultAutoScrollSpeed',
        label: 'Velocidade Padrão do Auto-Scroll (Teleprompter)',
        type: 'select',
        defaultValue: 'lento',
        options: ['lento', 'medio', 'rapido'],
        description: 'Velocidade de rolagem automática contínua de artigos na TV.',
      },
      {
        key: 'overscanMargin',
        label: 'Margem de Segurança Anti-Overscan',
        type: 'select',
        defaultValue: 'small',
        options: ['none', 'small', 'standard'],
        description: 'Recuo nas bordas para evitar cortes em telas de TV (none, small, standard).',
      },
      {
        key: 'enableSoundEffects',
        label: 'Efeitos Sonoros do Controle Remoto (Web Audio)',
        type: 'boolean',
        defaultValue: true,
        description: 'Emite bips sonoros ao mover o foco e selecionar itens com o controle.',
      },
      {
        key: 'enableVoiceNarration',
        label: 'Ativar Narração por Voz de Artigos (TTS)',
        type: 'boolean',
        defaultValue: true,
        description: 'Permite acionar a leitura de artigos em voz alta na TV.',
      },
      {
        key: 'enableScreensaver',
        label: 'Protetor de Tela Anti Burn-in (OLED)',
        type: 'boolean',
        defaultValue: true,
        description: 'Ativa descanso ambiente com citações do saber após inatividade.',
      },
      {
        key: 'screensaverTimeout',
        label: 'Tempo para Protetor de Tela (em segundos)',
        type: 'number',
        defaultValue: 180,
        description: 'Segundos sem interação no controle antes do descanso (padrão: 180s = 3 min).',
      },
      {
        key: 'showRemoteLegend',
        label: 'Exibir Barra de Legenda do Controle Remoto',
        type: 'boolean',
        defaultValue: true,
        description: 'Mostra no rodapé da TV as dicas de botões do controle remoto.',
      },
      {
        key: 'ambientBacklight',
        label: 'Efeito Ambient Backlight (Luz Suave)',
        type: 'boolean',
        defaultValue: true,
        description: 'Exibe iluminação ambiente sutil ao redor dos cartões em foco.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};

    // Hook para obter a configuração consolidada de Smart TV
    hooks.addFilter<SmartTvConfigData>(
      'smartv:config',
      (currentConfig) => {
        const config: SmartTvConfigData = {
          defaultTvTheme: (settings.defaultTvTheme as 'cinema' | 'midnight' | 'oled') || currentConfig?.defaultTvTheme || 'cinema',
          defaultFontSize: (settings.defaultFontSize as 'normal' | 'grande' | 'extra') || currentConfig?.defaultFontSize || 'grande',
          defaultAutoScrollSpeed: (settings.defaultAutoScrollSpeed as 'lento' | 'medio' | 'rapido') || currentConfig?.defaultAutoScrollSpeed || 'lento',
          enableSoundEffects: settings.enableSoundEffects !== undefined ? Boolean(settings.enableSoundEffects) : (currentConfig?.enableSoundEffects ?? true),
          enableVoiceNarration: settings.enableVoiceNarration !== undefined ? Boolean(settings.enableVoiceNarration) : (currentConfig?.enableVoiceNarration ?? true),
          overscanMargin: (settings.overscanMargin as 'none' | 'small' | 'standard') || currentConfig?.overscanMargin || 'small',
          enableScreensaver: settings.enableScreensaver !== undefined ? Boolean(settings.enableScreensaver) : (currentConfig?.enableScreensaver ?? true),
          screensaverTimeout: typeof settings.screensaverTimeout === 'number' ? Number(settings.screensaverTimeout) : (currentConfig?.screensaverTimeout || 180),
          showRemoteLegend: settings.showRemoteLegend !== undefined ? Boolean(settings.showRemoteLegend) : (currentConfig?.showRemoteLegend ?? true),
          ambientBacklight: settings.ambientBacklight !== undefined ? Boolean(settings.ambientBacklight) : (currentConfig?.ambientBacklight ?? true),
        };
        return config;
      },
      10,
      this.getName()
    );

    // Hooks individuais
    hooks.addFilter<string>(
      'smartv:theme',
      (theme) => {
        if (settings.defaultTvTheme) return settings.defaultTvTheme;
        return theme || 'cinema';
      },
      10,
      this.getName()
    );

    hooks.addFilter<string>(
      'smartv:font_size',
      (fontSize) => {
        if (settings.defaultFontSize) return settings.defaultFontSize;
        return fontSize || 'grande';
      },
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'smartv:audio_enabled',
      (enabled) => {
        if (settings.enableSoundEffects !== undefined) return Boolean(settings.enableSoundEffects);
        return enabled ?? true;
      },
      10,
      this.getName()
    );
  }
}
