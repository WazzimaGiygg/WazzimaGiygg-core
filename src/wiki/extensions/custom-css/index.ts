import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

export const CUSTOM_CSS_STYLE_ELEMENT_ID = 'wiki-custom-bureaucrat-css';

/**
 * Extension: CustomCssExtension (Update 3.05 - Requisito 3.05.3.q)
 * Categoria: tool
 * Funcionalidade: Permite ao burocrata injetar CSS personalizado dentro da configuração padrão
 * do WikiWorldWeb. Possui validador sintático: se o CSS for inválido ou malformado, o CSS padrão se retorna.
 */
export default class CustomCssExtension implements WikiExtension {
  private currentAppliedCss: string = '';

  getName(): string {
    return 'CustomCssExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Permite ao burocrata adicionar código CSS personalizado com regras visuais customizadas para o WikiWorldWeb. Caso o CSS fornecido contenha erros de sintaxe ou seja inválido, o sistema descarta com segurança as regras corrompidas e mantém o CSS padrão do site intacto.';
  }

  getAuthor(): string {
    return 'WikiWorldWeb Styler Subsystem';
  }

  getCategory(): ExtensionCategory {
    return 'tool';
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
        key: 'customCss',
        label: 'Código CSS Personalizado',
        type: 'string',
        defaultValue: '/* Insira suas regras CSS personalizadas aqui */\n/* Exemplo:\n.wiki-rendered-content p {\n  letter-spacing: 0.01em;\n}\n*/',
        description: 'Regras CSS completas inseridas pelo burocrata. Se o CSS for inválido, o padrão será preservado.',
      },
      {
        key: 'activeFlag',
        label: 'Ativar injeção deste CSS',
        type: 'boolean',
        defaultValue: true,
        description: 'Habilita ou suspende temporariamente o efeito das regras CSS sem perder o código.',
      },
    ];
  }

  /**
   * Valida sintaticamente o CSS testando sua análise pelo navegador.
   * Se houver seletores ou blocos grosseiramente quebrados, retorna false.
   */
  public isCssValid(cssText: string): boolean {
    if (!cssText || !cssText.trim()) return true;

    // Checagem de balanceamento básico de chaves
    let openBraces = 0;
    for (let i = 0; i < cssText.length; i++) {
      if (cssText[i] === '{') openBraces++;
      else if (cssText[i] === '}') openBraces--;
      if (openBraces < 0) return false;
    }
    if (openBraces !== 0) return false;

    // Teste no motor DOM do navegador usando um style elemento temporário
    if (typeof document !== 'undefined') {
      try {
        const testStyle = document.createElement('style');
        testStyle.textContent = cssText;
        document.head.appendChild(testStyle);
        const sheet = testStyle.sheet as CSSStyleSheet | null;
        const valid = !!sheet;
        document.head.removeChild(testStyle);
        return valid;
      } catch {
        return false;
      }
    }

    return true;
  }

  private applyCssToHead(cssText: string): void {
    if (typeof document === 'undefined') return;

    try {
      let styleEl = document.getElementById(CUSTOM_CSS_STYLE_ELEMENT_ID) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = CUSTOM_CSS_STYLE_ELEMENT_ID;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = cssText;
      this.currentAppliedCss = cssText;
    } catch (e) {
      console.warn('[CustomCssExtension] Falha ao injetar CSS:', e);
    }
  }

  private removeCssFromHead(): void {
    if (typeof document === 'undefined') return;

    try {
      const styleEl = document.getElementById(CUSTOM_CSS_STYLE_ELEMENT_ID);
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
      this.currentAppliedCss = '';
    } catch (e) {
      console.warn('[CustomCssExtension] Falha ao remover CSS:', e);
    }
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};
    const rawCss = settings.customCss || '';
    const isActive = settings.activeFlag !== false;

    if (isActive && rawCss.trim()) {
      if (this.isCssValid(rawCss)) {
        this.applyCssToHead(rawCss);
      } else {
        console.warn('[CustomCssExtension] CSS personalizado fornecido é inválido. O CSS padrão do site foi preservado.');
        this.removeCssFromHead();
      }
    } else {
      this.removeCssFromHead();
    }

    hooks.addFilter<string>(
      'css:get_custom_css',
      () => this.currentAppliedCss,
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    this.removeCssFromHead();
  }
}
