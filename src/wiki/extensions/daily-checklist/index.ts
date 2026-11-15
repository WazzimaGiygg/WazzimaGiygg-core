import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * EXTENSÃO NATIVA: DailyChecklistExtension (Requisitos 3.05.3.af, 3.05.8.b, 3.05.3.c)
 * 
 * Funcionalidade:
 * - Checklist diário com pontuação acumulada mensalmente por usuário.
 * - Pontos:
 *   - Login diário (1 ponto)
 *   - Contribuição/edição (0.20 pontos)
 *   - Avaliação de artigo (1 ponto)
 *   - Doação ao Wiki-Site comprovada (10 pontos - concedido manualmente pelo Burocrata)
 * - Funcionalidade ao Burocrata de conceder pontos manualmente com justificativa.
 * - Integração com Alertas Push do navegador.
 * - Habilitação e desabilitação centralizada e sincronizada com Firebase Firestore.
 */
export default class DailyChecklistExtension implements WikiExtension {
  getName(): string {
    return 'DailyChecklistExtension';
  }

  getVersion(): string {
    return '3.05.8';
  }

  getDescription(): string {
    return 'Gerencia o Checklist Diário de pontos acumuláveis mensalmente por usuário (Login: 1 pt, Edição: 0.20 pt, Avaliação: 1 pt, Doação/Burocrata: 10 pts). Permite acompanhamento de metas, ranking comunitário e alertas push.';
  }

  getAuthor(): string {
    return 'WikiZero Community & Engagement Guild';
  }

  getCategory(): ExtensionCategory {
    return 'community';
  }

  isCore(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://wikiworldweb.org/extensions/daily-checklist';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'enableDailyChecklist',
        label: 'Ativar sistema de Checklist Diário e Pontuação Mensal',
        type: 'boolean',
        defaultValue: true,
        description: 'Permite que usuários realizem tarefas diárias e acumulem pontos no ranking mensal.',
      },
      {
        key: 'pointsLogin',
        label: 'Pontos por Login diário',
        type: 'number',
        defaultValue: 1.0,
        description: 'Quantidade de pontos diários concedidos automaticamente no primeiro acesso do dia.',
      },
      {
        key: 'pointsContribution',
        label: 'Pontos por Contribuição (Edição/Criação)',
        type: 'number',
        defaultValue: 0.20,
        description: 'Quantidade de pontos concedidos a cada edição válida ou publicação de verbete.',
      },
      {
        key: 'pointsRating',
        label: 'Pontos por Avaliação de Artigo',
        type: 'number',
        defaultValue: 1.0,
        description: 'Quantidade de pontos concedidos na avaliação de verbetes com estrelas e feedback.',
      },
      {
        key: 'pointsDonation',
        label: 'Pontos por Doação Comprovada',
        type: 'number',
        defaultValue: 10.0,
        description: 'Quantidade de pontos concedidos pelo Burocrata mediante comprovação de doação ao Wiki-Site.',
      },
      {
        key: 'enablePushReminders',
        label: 'Disparar alertas push do checklist diário',
        type: 'boolean',
        defaultValue: true,
        description: 'Envia lembretes nativos pelo Service Worker aos usuários sobre metas do checklist pendentes.',
      },
      {
        key: 'allowBureaucratManualAward',
        label: 'Permitir concessão manual de pontos por Burocratas',
        type: 'boolean',
        defaultValue: true,
        description: 'Autoriza membros do Conselho de Burocratas a creditar pontos manuais a usuários com justificativa.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    // Hook que informa se o checklist diário está ativo
    hooks.addFilter<boolean>(
      'checklist:is_enabled',
      () => {
        if (context?.settings?.enableDailyChecklist !== undefined) {
          return Boolean(context.settings.enableDailyChecklist);
        }
        return true;
      },
      10,
      this.getName()
    );

    // Hook que exporta a configuração de pontuação ativa
    hooks.addFilter<Record<string, number>>(
      'checklist:points_config',
      () => ({
        login: context?.settings?.pointsLogin ?? 1.0,
        contribution: context?.settings?.pointsContribution ?? 0.20,
        rating: context?.settings?.pointsRating ?? 1.0,
        donation: context?.settings?.pointsDonation ?? 10.0,
      }),
      10,
      this.getName()
    );

    console.info('[DailyChecklistExtension] Extensão registrada: Checklist diário e pontuação mensal ativos.');
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    console.info('[DailyChecklistExtension] Extensão desregistrada.');
  }
}
