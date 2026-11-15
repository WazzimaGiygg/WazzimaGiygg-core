import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

export interface CustomRuleItem {
  id: string;
  number: string;
  title: string;
  category: 'conduta' | 'edicao' | 'seguranca' | 'direitos' | 'geral';
  description: string;
  penalty?: string;
}

export const DEFAULT_OTHER_RULES: CustomRuleItem[] = [
  {
    id: 'regra-1',
    number: 'R-01',
    title: 'Neutralidade Rigorosa e Verificabilidade Autônoma',
    category: 'edicao',
    description: 'Todo conteúdo publicado deve conter fontes primárias ou secundárias verificáveis e redação imparcial, sem proselitismo político ou comercial.',
    penalty: 'Reversão de edições e aviso formal no perfil.',
  },
  {
    id: 'regra-2',
    number: 'R-02',
    title: 'Vedação ao Uso de Automação Hostil e Spam',
    category: 'seguranca',
    description: 'Robôs, scrapers não autorizados e injeções automáticas em massa de texto são terminantemente proibidos nas páginas da enciclopédia.',
    penalty: 'Bloqueio imediato de IP e revogação de conta.',
  },
  {
    id: 'regra-3',
    number: 'R-03',
    title: 'Urbanidade no Conselho e Discussões Comunitárias',
    category: 'conduta',
    description: 'Ataques pessoais, assédio, doxxing ou difamação a outros editores ou membros do Conselho acarretarão sanções imediatas sob o UCoC.',
    penalty: 'Suspensão de privilégios de edição por tempo determinado.',
  },
  {
    id: 'regra-4',
    number: 'R-04',
    title: 'Integridade de Dados e Soberania do Burocrata',
    category: 'geral',
    description: 'Decisões institucionais do Burocrata sobre extensões e diretrizes estruturais são soberanas para preservação do acervo da WikiWorldWeb.',
    penalty: 'Revisão mandatória pelo Conselho de Arbitragem.',
  },
];

/**
 * Extension: OtherRulesExtension (Update 3.05 - Requisito 3.05.3.m)
 * Categoria: content
 * Funcionalidade: Permite adicionar e gerenciar a página "Outras regras",
 * permitindo ao burocrata personalizar todas as regras, títulos e categorias.
 */
export default class OtherRulesExtension implements WikiExtension {
  getName(): string {
    return 'OtherRulesExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Adiciona e gerencia a página institucional de "Outras Regras" da Wiki. Permite ao burocrata inserir, editar e remover regras, diretrizes de conduta e penalidades personalizadas.';
  }

  getAuthor(): string {
    return 'Conselho Burocrático WikiWorldWeb';
  }

  getCategory(): ExtensionCategory {
    return 'content';
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
        key: 'pageTitle',
        label: 'Título da Página de Regras',
        type: 'string',
        defaultValue: 'Outras Regras e Diretrizes Institucionais',
        description: 'Nome principal exibido no cabeçalho da página de regras.',
      },
      {
        key: 'pageSubtitle',
        label: 'Subtítulo Explicativo',
        type: 'string',
        defaultValue: 'Regulamento oficial estabelecido pelo Burocrata para convivência, edição e segurança na Wiki.',
        description: 'Descrição secundária no topo da página de regras.',
      },
      {
        key: 'rulesRawJson',
        label: 'Lista de Regras Personalizadas (JSON)',
        type: 'string',
        defaultValue: JSON.stringify(DEFAULT_OTHER_RULES, null, 2),
        description: 'Estrutura JSON com as regras personalizadas pelo burocrata.',
      },
      {
        key: 'showInSidebar',
        label: 'Exibir no menu lateral (Sidebar)',
        type: 'boolean',
        defaultValue: true,
        description: 'Adiciona link direto para "Outras Regras" no menu de navegação.',
      },
      {
        key: 'allowExportPdf',
        label: 'Permitir exportação do regulamento em PDF',
        type: 'boolean',
        defaultValue: true,
        description: 'Habilita botão para download e impressão limpa das regras.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    let rules: CustomRuleItem[] = DEFAULT_OTHER_RULES;

    try {
      if (settings.rulesRawJson) {
        const parsed = JSON.parse(settings.rulesRawJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rules = parsed;
        }
      }
    } catch {
      rules = DEFAULT_OTHER_RULES;
    }

    hooks.addFilter<boolean>(
      'rules:other_rules_enabled',
      () => true,
      10,
      this.getName()
    );

    hooks.addFilter<Record<string, any>>(
      'rules:get_rules_data',
      () => ({
        enabled: true,
        title: settings.pageTitle || 'Outras Regras e Diretrizes Institucionais',
        subtitle: settings.pageSubtitle || 'Regulamento oficial estabelecido pelo Burocrata.',
        rules,
        showInSidebar: settings.showInSidebar !== false,
        allowExportPdf: settings.allowExportPdf !== false,
      }),
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    hooks.addFilter<boolean>(
      'rules:other_rules_enabled',
      () => false,
      10,
      this.getName()
    );
  }
}
