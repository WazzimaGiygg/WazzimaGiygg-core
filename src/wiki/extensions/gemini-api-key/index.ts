import { HookRegistry, WikiExtension } from '../../core/Extension';
import { CustomToolConfig, ExtensionCategory, ExtensionSettingField } from '../../types';
import {
  DEFAULT_GEMINI_API_KEY_SETTINGS,
  GeminiApiKeySettings,
  fetchGeminiKeyStatus,
  testGeminiKeyPing,
  RECOMMENDED_GEMINI_MODELS,
} from './config';

/**
 * Extension: GeminiApiKeyExtension
 * Categoria: tool (Ferramenta / Inteligência Artificial)
 *
 * REQUISITO 3.05.3.ag:
 * "Adicionar extensão que permite a variável GEMINI_API_KEY para uso do Gemini no Wiki-Site"
 *
 * Funcionalidade:
 * - Habilita e gerencia o uso da variável de ambiente GEMINI_API_KEY no servidor Node.js/Express
 *   para alimentar todas as funcionalidades de Inteligência Artificial do Google Gemini no Wiki-Site.
 * - Fornece ganchos de filtro e ação para verificar a saúde da chave, o modelo padrão e as cotas.
 * - Fornece interface e painel de diagnóstico na área de Ferramentas e de Gerenciamento de Extensões.
 */
export default class GeminiApiKeyExtension implements WikiExtension {
  private settings: GeminiApiKeySettings = { ...DEFAULT_GEMINI_API_KEY_SETTINGS };

  getName(): string {
    return 'GeminiApiKeyExtension';
  }

  getVersion(): string {
    return '3.05.3.ag';
  }

  getDescription(): string {
    return 'Habilita e gerencia o uso da variável de ambiente GEMINI_API_KEY para integração com os modelos de IA do Google Gemini e Google AI Studio no Wiki-Site (assistente inteligente, notebook, gerador de artigos wikitext, visão computacional e auditoria factual).';
  }

  getAuthor(): string {
    return 'Google AI Studio & Equipe WikiZero';
  }

  getCategory(): ExtensionCategory {
    return 'tool';
  }

  isCore(): boolean {
    return true;
  }

  isSyncableWithCloud(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://aistudio.google.com';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'enableGemini',
        label: 'Habilitar Recursos Gemini com GEMINI_API_KEY',
        type: 'boolean',
        defaultValue: this.settings.enableGemini,
        description: 'Ativa ou suspende globalmente os módulos de Inteligência Artificial alimentados pelo Gemini no Wiki-Site.',
      },
      {
        key: 'envVariableName',
        label: 'Nome da Variável de Ambiente (Requisito 3.05.3.ag)',
        type: 'string',
        defaultValue: 'GEMINI_API_KEY',
        description: 'Variável de ambiente injetada pelo Google AI Studio no servidor para autenticação com o SDK @google/genai.',
      },
      {
        key: 'defaultModel',
        label: 'Modelo Padrão da IA',
        type: 'select',
        defaultValue: this.settings.defaultModel,
        description: 'Modelo canônico utilizado para chat, elaboração de verbetes e consultas.',
        options: RECOMMENDED_GEMINI_MODELS.map((m) => m.id),
      },
      {
        key: 'temperature',
        label: 'Temperatura do Modelo (Precisão vs Criatividade)',
        type: 'number',
        defaultValue: this.settings.temperature,
        description: 'Valor entre 0.0 (máxima fidelidade enciclopédica) e 1.0 (maior variação criativa).',
      },
      {
        key: 'enableChatbotAssistant',
        label: 'Ativar Chatbot Assistente Enciclopédico',
        type: 'boolean',
        defaultValue: this.settings.enableChatbotAssistant,
        description: 'Permite aos leitores e editores utilizarem o chatbot flutuante da Wiki.',
      },
      {
        key: 'enableGeminiNotebook',
        label: 'Ativar Gemini Notebook (Pesquisa & Síntese)',
        type: 'boolean',
        defaultValue: this.settings.enableGeminiNotebook,
        description: 'Permite compilar fontes de pesquisa e sintetizar artigos inteiros com 1 clique.',
      },
      {
        key: 'enableArticleGenerator',
        label: 'Ativar Gerador de Verbetes Wikitext no Editor',
        type: 'boolean',
        defaultValue: this.settings.enableArticleGenerator,
        description: 'Disponibiliza botões de geração de parágrafos, seções e artigos estruturados.',
      },
      {
        key: 'enableVisionAnalysis',
        label: 'Ativar Visão Computacional de Documentos & Imagens',
        type: 'boolean',
        defaultValue: this.settings.enableVisionAnalysis,
        description: 'Permite o upload de mapas, documentos e fotos para transcrição e análise visual pelo Gemini.',
      },
      {
        key: 'quotaExemptionAdmins',
        label: 'Isenção de Cota para Administradores e Burocratas',
        type: 'boolean',
        defaultValue: this.settings.quotaExemptionAdmins,
        description: 'Remove limites diários de requisições para operadores com privilégios administrativos.',
      },
    ];
  }

  getToolConfig(): CustomToolConfig {
    return {
      toolId: 'gemini-api-key',
      title: 'Configuração da Variável GEMINI_API_KEY (Google AI Studio)',
      description:
        'Painel de gerenciamento, diagnóstico e teste da variável GEMINI_API_KEY para habilitação e uso dos modelos do Google Gemini no Wiki-Site.',
      icon: 'Sparkles',
      badge: '3.05.3.ag',
      category: 'Inteligência Artificial & Gemini',
      inputs: [
        {
          id: 'testPrompt',
          label: 'Pergunta de Teste de Diagnóstico',
          type: 'text',
          defaultValue: 'Confirme em uma frase que a variável GEMINI_API_KEY está ativa na Wiki.',
          placeholder: 'Digite uma mensagem para testar a conectividade...',
          helpText: 'Executa um ping seguro no servidor Node.js/Express utilizando GEMINI_API_KEY.',
        },
      ],
      calculationFormula: 'gemini_test_ping(testPrompt)',
      resultLabel: 'Diagnóstico da API Gemini',
    };
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    if (context?.settings) {
      this.settings = { ...this.settings, ...context.settings };
    }

    // 1. Sinaliza se a variável GEMINI_API_KEY e os recursos de IA estão habilitados
    hooks.addFilter<boolean>(
      'gemini:is_key_enabled',
      () => this.settings.enableGemini,
      10,
      this.getName()
    );

    // 2. Fornece o nome canônico da variável de ambiente no servidor
    hooks.addFilter<string>(
      'gemini:get_env_var_name',
      () => this.settings.envVariableName || 'GEMINI_API_KEY',
      10,
      this.getName()
    );

    // 3. Fornece o modelo padrão selecionado
    hooks.addFilter<string>(
      'gemini:get_default_model',
      () => this.settings.defaultModel || 'gemini-3.8-flash',
      10,
      this.getName()
    );

    // 4. Registra a ferramenta no catálogo oficial de ferramentas ativas
    hooks.addFilter<string[]>(
      'tools:registered_tools',
      (tools: string[] = []) => {
        if (!tools.includes('gemini-api-key')) {
          return [...tools, 'gemini-api-key'];
        }
        return tools;
      },
      10,
      this.getName()
    );

    // 5. Gancho de auditoria na ativação da extensão
    hooks.addAction(
      'admin:gemini_key_extension_loaded',
      () => {
        console.info(
          `[GeminiApiKeyExtension] Extensão ativa. Variável: ${this.settings.envVariableName}, Modelo: ${this.settings.defaultModel}.`
        );
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    console.info('[GeminiApiKeyExtension] Extensão da variável GEMINI_API_KEY desativada pelo burocrata.');
  }

  /** Métodos auxiliares públicos */
  public getSettings(): GeminiApiKeySettings {
    return { ...this.settings };
  }

  public async fetchStatus() {
    return fetchGeminiKeyStatus();
  }

  public async runPingTest(prompt?: string) {
    return testGeminiKeyPing(prompt);
  }
}
