/**
 * @file src/extensions/plagiarism-checker/index.ts
 * @description Extensão do Verificador de Plágio & Análise de Similaridade de TCC
 * baseado em sintaxe externa (4.1.1.RW.5 - Em estágio de implementação).
 */

import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

export default class PlagiarismCheckerExtension implements WikiExtension {
  getName(): string {
    return 'PlagiarismCheckerExtension';
  }

  getVersion(): string {
    return '4.1.1';
  }

  getDescription(): string {
    return 'Recurso de verificador de plágio acadêmico e análise de Trabalhos de Conclusão de Curso (TCC) baseado em sintaxe externa, auditoria de normas ABNT NBR 10520 e NBR 6023 e alertas ao orientador (4.1.1.RW.5 - Em estágio de implementação).';
  }

  getAuthor(): string {
    return 'Comitê Acadêmico & Governança de Integridade da WikiZero';
  }

  getCategory(): ExtensionCategory {
    return 'utility';
  }

  isCore(): boolean {
    return true; // Anexado por padrão no update 4.1.1
  }

  getWebsite(): string {
    return 'https://wazzimagiygg.com/';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'enabled',
        label: 'Ativar Verificador Antiplágio & Analisador de TCC',
        type: 'boolean',
        defaultValue: true,
        description: 'Habilita o módulo de verificação antiplágio em ferramentas acadêmicas e na interface do Wiki-site.',
      },
      {
        key: 'stageNotice',
        label: 'Fase de Desenvolvimento / Status',
        type: 'string',
        defaultValue: 'Em estágio de implementação - Atualização 4.1.1',
        description: 'Nota informativa de lançamento do módulo em produção.',
      },
      {
        key: 'externalSyntaxCheck',
        label: 'Verificação Baseada em Sintaxe Externa',
        type: 'boolean',
        defaultValue: true,
        description: 'Examina estruturas sintáticas externas, marcadores acadêmicos, atribuições autorais e padrões de texto enciclopédico.',
      },
      {
        key: 'abntStrictMode',
        label: 'Auditoria Estrita de Normas ABNT (NBR 10520 & 6023)',
        type: 'boolean',
        defaultValue: true,
        description: 'Exige regras estritas de citação autor-data, paginação em citações diretas e recuo de 4cm para citações com mais de 3 linhas.',
      },
      {
        key: 'similarityAlertThreshold',
        label: 'Limite de Alerta de Similaridade (%)',
        type: 'number',
        defaultValue: 15,
        description: 'Porcentagem de similaridade a partir da qual o relatório gera alerta vermelho de atenção do orientador.',
      },
      {
        key: 'geminiDeepSemantic',
        label: 'Análise Semântica Profunda via Gemini IA',
        type: 'boolean',
        defaultValue: true,
        description: 'Utiliza os modelos Google Gemini para detecção de paráfrases sutis e formulação de correções personalizadas segundo as normas da ABNT.',
      },
      {
        key: 'advisorAttentionRules',
        label: 'Destacar Parágrafos para Atenção do Orientador',
        type: 'boolean',
        defaultValue: true,
        description: 'Gera apontamentos detalhados no relatório indicando quais seções merecem intervenção pedagógica do orientador.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};

    // 1. Sinaliza se o verificador antiplágio está ativo
    hooks.addFilter<boolean>(
      'plagiarism:is_enabled',
      (current) => {
        if (settings.enabled !== undefined) {
          return settings.enabled === true;
        }
        return current;
      },
      10,
      this.getName()
    );

    // 2. Registra o ID da ferramenta nas ferramentas ativas
    hooks.addFilter<string[]>(
      'tools:registered_tools',
      (tools: string[] = []) => {
        if (!tools.includes('anti-plagio')) {
          return [...tools, 'anti-plagio'];
        }
        return tools;
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeFiltersForExtension(this.getName());
  }
}
