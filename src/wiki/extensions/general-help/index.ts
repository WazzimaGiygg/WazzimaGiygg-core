import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * EXTENSÃO NATIVA: GeneralHelpExtension (Requisito 3.05.3.ad & 3.05.8.a)
 * 
 * Funcionalidade:
 * - Habilita ou desabilita a Ajuda Geral do Wiki-Site ao pressionar o botão F1.
 * - Sincroniza a permissão de acesso à ajuda com o Firebase Firestore pelo Burocrata.
 * - Gerencia a estrutura de documentação e atalhos contida nos arquivos locais da extensão.
 * - Integração com modo tela cheia (3.05.8.b) e bloqueio de teclas especiais (3.05.7.a).
 */
export default class GeneralHelpExtension implements WikiExtension {
  getName(): string {
    return 'GeneralHelpExtension';
  }

  getVersion(): string {
    return '3.05.8';
  }

  getDescription(): string {
    return 'Controla a Central de Ajuda Geral da Wiki (F1) e a sua estrutura editável por Burocratas. Permite habilitar ou desabilitar o acesso à ajuda pelo atalho F1 e pela interface com sincronização no Firebase.';
  }

  getAuthor(): string {
    return 'WikiZero Bureaucrat Operations & Documentation Guild';
  }

  getCategory(): ExtensionCategory {
    return 'interface';
  }

  isCore(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://wikiworldweb.org/extensions/general-help';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'allowF1Shortcut',
        label: 'Habilitar atalho de teclado F1 para abrir a Ajuda Geral',
        type: 'boolean',
        defaultValue: true,
        description: 'Permite que qualquer usuário acesse a Central de Ajuda pressionando a tecla F1 em qualquer página do Wiki-Site.',
      },
      {
        key: 'showHelpInHeader',
        label: 'Exibir botão de Ajuda Geral (F1) no cabeçalho',
        type: 'boolean',
        defaultValue: true,
        description: 'Mostra o ícone de ajuda com acesso rápido na barra superior ao lado dos controles de tema e tela cheia.',
      },
      {
        key: 'showHelpInSidebar',
        label: 'Exibir atalho da Ajuda Geral no menu lateral',
        type: 'boolean',
        defaultValue: true,
        description: 'Inclui o item "Ajuda Geral (F1)" na seção de suporte e navegação da barra lateral.',
      },
      {
        key: 'allowBureaucratEditing',
        label: 'Permitir edição de tópicos de ajuda pelo Burocrata',
        type: 'boolean',
        defaultValue: true,
        description: 'Permite que membros do Conselho de Burocratas editem a estrutura e os tópicos de ajuda diretamente pela interface e exportem para arquivos locais.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    // Quando ATIVADA pelo burocrata:
    hooks.addFilter<boolean>(
      'help:general_help_enabled',
      () => true,
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'help:f1_shortcut_enabled',
      (prev) => {
        if (context?.settings?.allowF1Shortcut !== undefined) {
          return Boolean(context.settings.allowF1Shortcut);
        }
        return true;
      },
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'help:show_in_header',
      (prev) => {
        if (context?.settings?.showHelpInHeader !== undefined) {
          return Boolean(context.settings.showHelpInHeader);
        }
        return true;
      },
      10,
      this.getName()
    );

    console.info('[GeneralHelpExtension] Extensão registrada: Ajuda Geral (F1) pronta e sincronizada.');
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    console.info('[GeneralHelpExtension] Extensão desregistrada: Ajuda Geral desativada.');
  }
}
