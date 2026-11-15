import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: MainPageCustomizerExtension (Update 3.05 - Requisito 3.05.3.y)
 * Categoria: interface
 * Funcionalidade: Permite ao Burocrata personalizar e remover seções específicas
 * da Página Principal (WikiHub):
 * - Artigos em Destaque
 * - Painel de Estatística & Crescimento
 * - Coleções Temáticas & Artigos
 * - Faixa da Alternativa Aberta e Rápida (Comparativo)
 * - Apoie a WikiWorldWeb via Google Reader
 * - Botão flutuante do Assistente Gemini no canto direito inferior
 */
export default class MainPageCustomizerExtension implements WikiExtension {
  getName(): string {
    return 'MainPageCustomizerExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Permite personalizar a Página Principal (WikiHub), com opções para ocultar os Artigos em Destaque, Painel de Estatística, Coleções & Artigos, a Faixa da Alternativa Aberta e Rápida, o Apoie via Google Reader e o botão flutuante do Assistente Gemini no canto inferior.';
  }

  getAuthor(): string {
    return 'WikiZero Bureaucrat Operations & UI Architecture';
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
        key: 'hideFeaturedArticle',
        label: 'Ocultar "Artigos em Destaque"',
        type: 'boolean',
        defaultValue: false,
        description: 'Remove a seção de Artigo em Destaque do dia na página principal.',
      },
      {
        key: 'hideStatisticsPanel',
        label: 'Ocultar "Painel de Estatística & Crescimento"',
        type: 'boolean',
        defaultValue: false,
        description: 'Remove o painel interativo com gráficos Recharts e métricas de crescimento da enciclopédia.',
      },
      {
        key: 'hideCollections',
        label: 'Ocultar "Coleções Temáticas & Artigos"',
        type: 'boolean',
        defaultValue: false,
        description: 'Remove a grade com coleções temáticas e listagens de artigos na página principal.',
      },
      {
        key: 'hideCompetitorComparison',
        label: 'Ocultar a faixa da "Alternativa Aberta e Rápida"',
        type: 'boolean',
        defaultValue: false,
        description: 'Remove o banner de comparativo direto da WikiWorldWeb contra Wikipédia, Fandom e MediaWiki.',
      },
      {
        key: 'hideGoogleReaderDonation',
        label: 'Ocultar seção "Apoie a WikiWorldWeb via Google Reader"',
        type: 'boolean',
        defaultValue: false,
        description: 'Remove o bloco de doação e apoio financeiro via Google Reader Revenue Manager da página principal.',
      },
      {
        key: 'hideGeminiFloatingButton',
        label: 'Ocultar botão do "Assistente Gemini" (canto inferior direito)',
        type: 'boolean',
        defaultValue: false,
        description: 'Remove o botão flutuante do Assistente Gemini (Google AI Studio) fixado no canto inferior direito da tela.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};

    // 1. Artigos em destaque
    hooks.addFilter<boolean>(
      'mainpage:show_featured_article',
      (currentVal) => {
        if (settings.hideFeaturedArticle === true) return false;
        return currentVal ?? true;
      },
      10,
      this.getName()
    );

    // 2. Painel de Estatística & Crescimento
    hooks.addFilter<boolean>(
      'mainpage:show_statistics_panel',
      (currentVal) => {
        if (settings.hideStatisticsPanel === true) return false;
        return currentVal ?? true;
      },
      10,
      this.getName()
    );

    // 3. Coleções temáticas & Artigos
    hooks.addFilter<boolean>(
      'mainpage:show_collections',
      (currentVal) => {
        if (settings.hideCollections === true) return false;
        return currentVal ?? true;
      },
      10,
      this.getName()
    );

    // 4. Faixa da alternativa aberta e rápida
    hooks.addFilter<boolean>(
      'mainpage:show_competitor_comparison',
      (currentVal) => {
        if (settings.hideCompetitorComparison === true) return false;
        return currentVal ?? true;
      },
      10,
      this.getName()
    );

    // 5. Apoie a WikiWorldWeb via Google Reader
    hooks.addFilter<boolean>(
      'mainpage:show_google_reader_donation',
      (currentVal) => {
        if (settings.hideGoogleReaderDonation === true) return false;
        return currentVal ?? true;
      },
      10,
      this.getName()
    );

    // 6. Botão do Assistente Gemini no canto inferior direito
    hooks.addFilter<boolean>(
      'mainpage:show_gemini_floating_button',
      (currentVal) => {
        if (settings.hideGeminiFloatingButton === true) return false;
        return currentVal ?? true;
      },
      10,
      this.getName()
    );

    // Hook complementar para o botão Gemini global
    hooks.addFilter<boolean>(
      'gemini:show_floating_button',
      (currentVal) => {
        if (settings.hideGeminiFloatingButton === true) return false;
        return currentVal ?? true;
      },
      10,
      this.getName()
    );
  }
}
