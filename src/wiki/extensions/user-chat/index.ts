import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

/**
 * EXTENSÃO NATIVA: UserChatExtension (Requisito 3.09.a)
 * 
 * Funcionalidade:
 * - Chat em tempo real com outros usuários registrados da Wiki.
 * - Busca de usuários por nome, @username e cargo para conversas diretas.
 * - Sincronização em tempo real das mensagens e conversas via Firebase Firestore.
 * - Habilitação e desabilitação centralizada e sincronizada pelo Burocrata no Firebase.
 */
export default class UserChatExtension implements WikiExtension {
  getName(): string {
    return 'UserChatExtension';
  }

  getVersion(): string {
    return '3.09.0';
  }

  getDescription(): string {
    return 'Habilita o chat em tempo real entre usuários registrados da Wiki e a busca por outros membros para conversa. O Conselho de Burocratas pode habilitar ou desabilitar esta função com sincronização imediata no Firebase.';
  }

  getAuthor(): string {
    return 'WikiWorldWeb Community & Messaging Guild';
  }

  getCategory(): ExtensionCategory {
    return 'communication';
  }

  isCore(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://wikiworldweb.org/extensions/user-chat';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'allowDirectMessaging',
        label: 'Permitir conversas diretas 1-a-1 entre usuários',
        type: 'boolean',
        defaultValue: true,
        description: 'Permite que qualquer usuário registrado procure outro membro e envie mensagens privadas em tempo real.',
      },
      {
        key: 'showFloatingChatButton',
        label: 'Exibir botão flutuante de chat no canto da tela',
        type: 'boolean',
        defaultValue: true,
        description: 'Exibe o botão de atalho rápido com badge de mensagens não lidas no canto inferior direito.',
      },
      {
        key: 'allowEmojiReactions',
        label: 'Permitir reações rápidas com emojis nas mensagens',
        type: 'boolean',
        defaultValue: true,
        description: 'Permite que os usuários reajam com emojis às mensagens enviadas no chat.',
      },
      {
        key: 'maxMessageLength',
        label: 'Limite máximo de caracteres por mensagem',
        type: 'number',
        defaultValue: 2000,
        description: 'Tamanho máximo permitido em cada mensagem de texto enviada.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    // Quando ATIVADA pelo burocrata:
    hooks.addFilter<boolean>(
      'chat:user_chat_enabled',
      () => true,
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'chat:show_floating_button',
      (prev) => {
        if (context?.settings?.showFloatingChatButton !== undefined) {
          return Boolean(context.settings.showFloatingChatButton);
        }
        return true;
      },
      10,
      this.getName()
    );

    console.info('[UserChatExtension] Extensão registrada: Chat entre usuários registrado e sincronizado.');
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());

    // Quando DESATIVADA pelo burocrata:
    hooks.addFilter<boolean>(
      'chat:user_chat_enabled',
      () => false,
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'chat:show_floating_button',
      () => false,
      10,
      this.getName()
    );

    console.info('[UserChatExtension] Extensão descarregada: Chat entre usuários suspenso pelo burocrata.');
  }
}
