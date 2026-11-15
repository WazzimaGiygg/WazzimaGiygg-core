import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: WikiUniversityExtension (Update 3.05 - Requisito 3.05.3.g)
 * Categoria: interface
 * Funcionalidade: Transforma a seção "Wiki Universitário" (Repositório Acadêmico,
 * Teses, Dissertações e Citações com integração Google Acadêmico) em uma extensão
 * modular que pode ser ativada ou desativada pelo administrador.
 */
export default class WikiUniversityExtension implements WikiExtension {
  getName(): string {
    return 'WikiUniversityExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Módulo oficial do Wiki Universitário: repositório científico, teses, dissertações, artigos acadêmicos e cálculo automático de métricas (h-index e i10-index). Pode ser desativado pelo administrador.';
  }

  getAuthor(): string {
    return 'WikiWorldWeb Academic Council';
  }

  getCategory(): ExtensionCategory {
    return 'interface';
  }

  isCore(): boolean {
    return false;
  }

  getWebsite(): string {
    return 'https://wazzimagiygg.com/';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'showInSidebar',
        label: 'Exibir no Menu Lateral',
        type: 'boolean',
        defaultValue: true,
        description: 'Exibe o atalho do Wiki Universitário na navegação principal.',
      },
      {
        key: 'customTitle',
        label: 'Nome Personalizado da Seção',
        type: 'string',
        defaultValue: 'Wiki Universitário',
        description: 'Texto exibido no menu e nos títulos de cabeçalho do repositório acadêmico.',
      },
      {
        key: 'enablePeerReview',
        label: 'Habilitar Módulo de Pareceres e Revisão por Pares',
        type: 'boolean',
        defaultValue: true,
        description: 'Permite a submissão de pareceres científicos abertos.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const title = settings.customTitle || 'Wiki Universitário';

    hooks.addFilter<boolean>(
      'module:academic_available',
      () => true,
      10,
      this.getName()
    );

    hooks.addFilter<string>(
      'module:academic_title',
      () => title,
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'module:academic_show_sidebar',
      () => settings.showInSidebar !== false,
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    hooks.addFilter<boolean>(
      'module:academic_available',
      () => false,
      10,
      this.getName()
    );
  }
}
