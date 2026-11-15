import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: QrCodeQuickShare
 * Utilitário de compartilhamento móvel e integração de links QR Code nos artigos.
 */
export default class QrCodeQuickShare implements WikiExtension {
  getName(): string {
    return 'QrCodeQuickShare';
  }

  getVersion(): string {
    return '1.0.8';
  }

  getDescription(): string {
    return 'Integra atalhos para geração e escaneamento de QR Code facilitando a transferência de leitura entre desktop e celulares.';
  }

  getAuthor(): string {
    return 'Mobile Lab WikiZero';
  }

  getCategory(): 'interface' {
    return 'interface';
  }

  isCore(): boolean {
    return false;
  }

  onRegister(hooks: HookRegistry): void {
    hooks.addAction(
      'article:viewed',
      (article: { id: string; titulo: string }) => {
        // Disparado quando artigo é renderizado
      },
      15,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
  }
}
