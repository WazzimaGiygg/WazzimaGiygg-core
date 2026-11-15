import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

export const DEFAULT_FAVICON_URL = '/vite.svg';
export const DEFAULT_LOGO_URL = '';

/**
 * Extension: CustomFaviconLogoExtension (Update 3.05 - Requisito 3.05.3.p)
 * Categoria: appearance
 * Funcionalidade: Permite alterar o favicon e o logotipo da Wiki com URLs personalizadas.
 * Caso a URL do favicon ou do logo seja inválida ou inacessível, retorna automaticamente ao padrão.
 */
export default class CustomFaviconLogoExtension implements WikiExtension {
  private originalFaviconHref: string = '/vite.svg';
  private validationTimeout: any = null;

  getName(): string {
    return 'CustomFaviconLogoExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Permite personalizar o favicon da aba do navegador e a imagem do logotipo da Wiki através de URLs customizadas. Possui mecanismo de validação automática: caso a URL seja inválida ou inacessível, o favicon e o logo retornam imediatamente aos padrões seguros.';
  }

  getAuthor(): string {
    return 'WikiWorldWeb Visual Identity Studio';
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
        key: 'customFaviconUrl',
        label: 'URL do Favicon Personalizado (.ico, .png, .svg)',
        type: 'string',
        defaultValue: '',
        description: 'Endereço web direto da imagem do ícone da aba. Se inválido ou inacessível, o padrão é mantido.',
      },
      {
        key: 'customLogoUrl',
        label: 'URL do Logotipo do Cabeçalho (.svg, .png, .webp)',
        type: 'string',
        defaultValue: '',
        description: 'Endereço web direto da imagem do logotipo principal exibido na barra superior.',
      },
      {
        key: 'logoAltText',
        label: 'Texto Alternativo do Logo (Acessibilidade)',
        type: 'string',
        defaultValue: 'Logotipo Oficial da Wiki',
        description: 'Descrição de acessibilidade da imagem.',
      },
    ];
  }

  private applyFavicon(url: string): void {
    if (typeof document === 'undefined') return;

    try {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = url;
    } catch (e) {
      console.warn('[CustomFaviconLogoExtension] Erro ao alterar elemento link favicon:', e);
    }
  }

  private validateAndSetFavicon(url: string): void {
    if (!url || !url.trim()) {
      this.applyFavicon(this.originalFaviconHref);
      return;
    }

    const testImg = new Image();
    testImg.onload = () => {
      this.applyFavicon(url);
    };
    testImg.onerror = () => {
      console.warn(`[CustomFaviconLogoExtension] URL de Favicon inválida ou inacessível: '${url}'. Revertendo para o padrão.`);
      this.applyFavicon(this.originalFaviconHref);
    };
    testImg.src = url;
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const faviconUrl = (settings.customFaviconUrl || '').trim();
    const logoUrl = (settings.customLogoUrl || '').trim();

    // Salva o favicon original presente no documento
    if (typeof document !== 'undefined') {
      const existing = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (existing && existing.href) {
        this.originalFaviconHref = existing.href;
      }
    }

    // Valida e aplica favicon
    if (faviconUrl) {
      this.validateAndSetFavicon(faviconUrl);
    }

    hooks.addFilter<string>(
      'branding:custom_logo_url',
      () => logoUrl,
      10,
      this.getName()
    );

    hooks.addFilter<string>(
      'branding:custom_favicon_url',
      () => faviconUrl,
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    // Retorna ao favicon padrão
    this.applyFavicon(this.originalFaviconHref);
  }
}
