import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * Extension: WikiBrandingExtension (Update 3.05 - Requisito 3.05.3.o)
 * Categoria: feature
 * Funcionalidade: Permite alterar o nome do Wiki (Padrão é WikiWorldWeb) para o nome
 * que o burocrata quiser, e o nome do motor (Padrão é WikiZero) para o nome que o
 * burocrata desejar.
 */
export default class WikiBrandingExtension implements WikiExtension {
  getName(): string {
    return 'WikiBrandingExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Permite a personalização da marca e nomes do sistema. O burocrata pode alterar o nome da Wiki (padrão: WikiWorldWeb) e o nome do motor de software (padrão: WikiZero) para os nomes que desejar.';
  }

  getAuthor(): string {
    return 'WikiWorldWeb Branding Core';
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
        key: 'wikiName',
        label: 'Nome da Enciclopédia (Wiki)',
        type: 'string',
        defaultValue: 'WikiWorldWeb',
        description: 'Nome principal da enciclopédia exibido nos cabeçalhos, títulos e rodapés (Padrão: WikiWorldWeb).',
      },
      {
        key: 'systemName',
        label: 'Nome do Motor/Software (WikiZero)',
        type: 'string',
        defaultValue: 'WikiZero',
        description: 'Nome da plataforma e motor técnico exibido nas badges e versões (Padrão: WikiZero).',
      },
      {
        key: 'tagline',
        label: 'Slogan / Descrição Curta',
        type: 'string',
        defaultValue: 'A Enciclopédia Livre e Aberta',
        description: 'Frase de efeito exibida abaixo do logotipo principal.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const wikiName = (settings.wikiName || '').trim() || 'WikiWorldWeb';
    const systemName = (settings.systemName || '').trim() || 'WikiZero';
    const tagline = (settings.tagline || '').trim() || 'A Enciclopédia Livre e Aberta';

    hooks.addFilter<string>(
      'branding:wiki_name',
      () => wikiName,
      10,
      this.getName()
    );

    hooks.addFilter<string>(
      'branding:system_name',
      () => systemName,
      10,
      this.getName()
    );

    hooks.addFilter<string>(
      'branding:tagline',
      () => tagline,
      10,
      this.getName()
    );

    // Atualiza o <title> do documento se estiver no navegador
    if (typeof document !== 'undefined') {
      try {
        if (!document.title.includes(wikiName)) {
          document.title = document.title.replace(/WikiWorldWeb/g, wikiName);
        }
      } catch (e) {
        console.warn('[WikiBrandingExtension] Erro ao sincronizar document.title:', e);
      }
    }
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    // Volta para os nomes padrão
    hooks.addFilter<string>(
      'branding:wiki_name',
      () => 'WikiWorldWeb',
      10,
      this.getName()
    );
    hooks.addFilter<string>(
      'branding:system_name',
      () => 'WikiZero',
      10,
      this.getName()
    );
    hooks.addFilter<string>(
      'branding:tagline',
      () => 'A Enciclopédia Livre e Aberta',
      10,
      this.getName()
    );
  }
}
