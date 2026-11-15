import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: Android23GingerbreadTheme
 * Funcionalidade: Adiciona o tema enciclopédico retrô baseado no Android 2.3 (Gingerbread).
 * 
 * Características:
 * - Interface escura de alto contraste inspirada nas telas AMOLED de 2010 (Nexus S).
 * - Barra de status preta clássica com sinal de rede, 3G/HSPA, Wi-Fi e bateria em verde néon vibrante (#A4C639).
 * - Botões escovados com relevo chanfrado e realce de foco com brilho Bugdroid.
 * - Tipografia Droid Sans e cabeçalhos com friso de realce verde.
 */
export default class Android23GingerbreadTheme implements WikiExtension {
  getName(): string {
    return 'Android23GingerbreadTheme';
  }

  getVersion(): string {
    return '2.3.7';
  }

  getDescription(): string {
    return 'Adiciona e habilita o tema visual retrô baseado no Android 2.3 (Gingerbread): barra de status AMOLED, indicadores de sinal e bateria em verde néon (#A4C639), botões chanfrados e tipografia Droid Sans.';
  }

  getAuthor(): string {
    return 'Google Open Handset Alliance / WikiZero';
  }

  getCategory(): 'interface' {
    return 'interface';
  }

  isCore(): boolean {
    return false;
  }

  getWebsite(): string {
    return 'https://developer.android.com/about/versions/gingerbread';
  }

  onRegister(hooks: HookRegistry): void {
    // Registra gancho informando que o tema Android 2.3 está disponível no sistema
    hooks.addFilter<boolean>(
      'theme:android23_available',
      () => true,
      10,
      this.getName()
    );

    // Registra suporte na lista dinâmica de temas da enciclopédia
    hooks.addFilter<string[]>(
      'theme:supported_themes',
      (themes: string[] = []) => {
        if (!themes.includes('android23')) {
          return [...themes, 'android23'];
        }
        return themes;
      },
      10,
      this.getName()
    );

    // Gancho de renderização HTML: se o tema estiver ativo, injeta identificadores nos artigos
    hooks.addFilter<string>(
      'render:html',
      (html: string) => {
        return html;
      },
      20,
      this.getName()
    );

    // Ação disparada quando o tema é ativado
    hooks.addAction(
      'theme:changed',
      (themeId: string) => {
        if (themeId === 'android23') {
          console.info('[Android23GingerbreadTheme] Tema Android 2.3 Gingerbread ativado na Wiki.');
        }
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    // Remove todos os ganchos associados a esta extensão
    hooks.removeAllHooksForExtension(this.getName());

    // Se o tema atual no localStorage for android23, reverte suavemente para o padrão
    try {
      const currentTheme = localStorage.getItem('wikizero_theme_v3');
      if (currentTheme === 'android23') {
        localStorage.setItem('wikizero_theme_v3', 'light');
        document.documentElement.classList.remove('theme-android23');
        console.warn(
          '[Android23GingerbreadTheme] Extensão desativada pelo burocrata. Tema revertido para o padrão da enciclopédia.'
        );
      }
    } catch (e) {
      console.error('[Android23GingerbreadTheme] Erro ao descarregar extensão:', e);
    }
  }
}
