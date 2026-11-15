import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: WikiMaintenanceModeExtension (Update 3.05 - Requisito 3.05.3.e)
 * Categoria: security
 * Funcionalidade: Define quando o WikiWorldWeb está em manutenção. Quando ativo,
 * bloqueia o acesso geral à enciclopédia e permite que exclusivamente os Burocratas
 * acessem as configurações da Wiki autenticando-se com sua conta Google.
 */
export default class WikiMaintenanceModeExtension implements WikiExtension {
  getName(): string {
    return 'WikiMaintenanceModeExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Define o estado de manutenção do WikiWorldWeb. Quando ativado, visitantes e usuários comuns são bloqueados com tela informativa, e apenas o Burocrata pode acessar as configurações da Wiki usando seu login por Google.';
  }

  getAuthor(): string {
    return 'WikiWorldWeb Sysop Security';
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
        key: 'maintenanceActive',
        label: 'Ativar Modo de Manutenção Imediato',
        type: 'boolean',
        defaultValue: false,
        description: 'Se ativado, bloqueia a Wiki para todos os usuários exceto Burocratas autenticados via Google.',
      },
      {
        key: 'maintenanceNoticeTitle',
        label: 'Título do Aviso de Manutenção',
        type: 'string',
        defaultValue: 'WikiWorldWeb em Manutenção Programada',
        description: 'Título exibido na tela de bloqueio aos visitantes.',
      },
      {
        key: 'maintenanceNoticeMessage',
        label: 'Mensagem Explicativa aos Visitantes',
        type: 'string',
        defaultValue: 'Estamos realizando atualizações técnicas e aprimoramentos de segurança nos servidores. Apenas burocratas autorizados podem acessar as configurações durante a manutenção.',
        description: 'Texto detalhado exibido para o público geral.',
      },
      {
        key: 'allowBureaucratsOnly',
        label: 'Exigir Login do Google de Burocrata',
        type: 'boolean',
        defaultValue: true,
        description: 'Garante que apenas contas do Google com privilégio de Burocrata possam desbloquear o painel.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const isActive = !!settings.maintenanceActive;

    hooks.addFilter<boolean>(
      'system:maintenance_active',
      () => isActive,
      10,
      this.getName()
    );

    hooks.addFilter<Record<string, any>>(
      'system:maintenance_config',
      () => ({
        active: isActive,
        title: settings.maintenanceNoticeTitle || 'WikiWorldWeb em Manutenção',
        message:
          settings.maintenanceNoticeMessage ||
          'Estamos realizando atualizações técnicas no sistema. Apenas burocratas autorizados podem acessar as configurações durante a manutenção.',
      }),
      10,
      this.getName()
    );

    hooks.addAction(
      'system:maintenance_toggled',
      (payload?: { active?: boolean; by?: string }) => {
        console.warn('[WikiMaintenanceModeExtension] Estado de manutenção alterado:', payload);
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    hooks.addFilter<boolean>(
      'system:maintenance_active',
      () => false,
      10,
      this.getName()
    );
  }
}
