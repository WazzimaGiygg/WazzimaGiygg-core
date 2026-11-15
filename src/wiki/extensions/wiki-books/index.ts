import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: WikiBooksExtension (Update 3.05 - Requisito 3.05.3.g)
 * Categoria: interface
 * Funcionalidade: Transforma a seção "Wiki dos Livros e Periódicos" (Acervo Bibliográfico)
 * em uma extensão modular que pode ser ativada ou desativada pelo administrador.
 */
export default class WikiBooksExtension implements WikiExtension {
  getName(): string {
    return 'WikiBooksExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Módulo oficial do Wiki dos Livros & Periódicos: catálogo bibliográfico, edições históricas e obras clássicas integradas à enciclopédia. Pode ser desativado pelo administrador no painel de extensões.';
  }

  getAuthor(): string {
    return 'WikiWorldWeb Bibliographic Society';
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
        description: 'Exibe o atalho do Wiki dos Livros na navegação principal.',
      },
      {
        key: 'customTitle',
        label: 'Nome Personalizado da Seção',
        type: 'string',
        defaultValue: 'Wiki dos Livros',
        description: 'Texto exibido no menu e nos títulos de cabeçalho da biblioteca.',
      },
      {
        key: 'allowBookSubmissions',
        label: 'Permitir Cadastro de Novos Livros',
        type: 'boolean',
        defaultValue: true,
        description: 'Permite que usuários autenticados cadastrem novas obras bibliográficas no catálogo.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const title = settings.customTitle || 'Wiki dos Livros';

    hooks.addFilter<boolean>(
      'module:books_available',
      () => true,
      10,
      this.getName()
    );

    hooks.addFilter<string>(
      'module:books_title',
      () => title,
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'module:books_show_sidebar',
      () => settings.showInSidebar !== false,
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    hooks.addFilter<boolean>(
      'module:books_available',
      () => false,
      10,
      this.getName()
    );
  }
}
