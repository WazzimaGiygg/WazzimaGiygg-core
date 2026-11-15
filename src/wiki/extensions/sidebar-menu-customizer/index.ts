import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

export type SidebarSectionKey =
  | 'navigation'
  | 'recently_read'
  | 'media'
  | 'community'
  | 'admin_governance'
  | 'extensions'
  | 'footer_stats';

export const DEFAULT_SIDEBAR_SECTIONS_ORDER: SidebarSectionKey[] = [
  'navigation',
  'recently_read',
  'media',
  'community',
  'admin_governance',
  'extensions',
  'footer_stats',
];

/**
 * Extension: SidebarMenuCustomizerExtension (Update 3.05 - Requisito 3.05.3.r)
 * Categoria: interface
 * Funcionalidade: Permite alterar a ordem dos menus da lateral ou ocultá-los,
 * conforme o que o burocrata determinar no painel de configurações.
 */
export default class SidebarMenuCustomizerExtension implements WikiExtension {
  getName(): string {
    return 'SidebarMenuCustomizerExtension';
  }

  getVersion(): string {
    return '3.05.0';
  }

  getDescription(): string {
    return 'Permite ao Burocrata alterar a ordem de exibição das seções do menu lateral (Sidebar) e ocultar seções específicas (Navegação, Ficheiros, Comunidade, Governança, Lidos Recentemente, etc.).';
  }

  getAuthor(): string {
    return 'WikiZero Bureaucrat Operations & UI Architecture';
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
        key: 'menuOrder',
        label: 'Ordem das Seções da Lateral (separadas por vírgula)',
        type: 'string',
        defaultValue: 'navigation,recently_read,media,community,admin_governance,extensions,footer_stats',
        description: 'Chaves válidas: navigation, recently_read, media, community, admin_governance, extensions, footer_stats. Altere a ordem conforme desejado pelo Burocrata.',
      },
      {
        key: 'hideNavigation',
        label: 'Ocultar Seção "Navegação Principal"',
        type: 'boolean',
        defaultValue: false,
        description: 'Oculta o bloco de navegação principal da lateral.',
      },
      {
        key: 'hideRecentlyRead',
        label: 'Ocultar Seção "Lidos Recentemente"',
        type: 'boolean',
        defaultValue: false,
        description: 'Oculta a lista de artigos lidos recentemente.',
      },
      {
        key: 'hideMedia',
        label: 'Ocultar Seção "Ficheiros & Mídias"',
        type: 'boolean',
        defaultValue: false,
        description: 'Oculta o menu de carregamento e galeria de ficheiros.',
      },
      {
        key: 'hideCommunity',
        label: 'Ocultar Seção "Comunidade & Usuários"',
        type: 'boolean',
        defaultValue: false,
        description: 'Oculta links de páginas de usuários e comunidade.',
      },
      {
        key: 'hideAdminGovernance',
        label: 'Ocultar Seção "Governança & Administração"',
        type: 'boolean',
        defaultValue: false,
        description: 'Oculta atalhos de governança e auditoria da lateral para visitantes comuns.',
      },
      {
        key: 'hideExtensions',
        label: 'Ocultar Seção "Extensões & Ferramentas"',
        type: 'boolean',
        defaultValue: false,
        description: 'Oculta a listagem rápida de extensões instaladas no menu lateral.',
      },
      {
        key: 'hideFooterStats',
        label: 'Ocultar Seção "Estatísticas & Idiomas"',
        type: 'boolean',
        defaultValue: false,
        description: 'Oculta o rodapé da barra lateral com contadores e seleção de idiomas.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};

    // 1. Filtro da ordem das seções do menu lateral
    hooks.addFilter<SidebarSectionKey[]>(
      'sidebar:sections_order',
      (currentOrder) => {
        const customOrderStr = settings.menuOrder;
        if (typeof customOrderStr === 'string' && customOrderStr.trim()) {
          const parsed = customOrderStr
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter((s): s is SidebarSectionKey =>
              [
                'navigation',
                'recently_read',
                'media',
                'community',
                'admin_governance',
                'extensions',
                'footer_stats',
              ].includes(s)
            );
          if (parsed.length > 0) {
            // Garante que qualquer seção omitida seja adicionada ao final para não perder conteúdo
            const missing = DEFAULT_SIDEBAR_SECTIONS_ORDER.filter((sec) => !parsed.includes(sec));
            return [...parsed, ...missing];
          }
        }
        return currentOrder;
      },
      10,
      this.getName()
    );

    // 2. Filtro de visibilidade de cada seção do menu lateral
    hooks.addFilter<boolean>(
      'sidebar:section_visible',
      (isVisible, sectionKey: SidebarSectionKey) => {
        if (!isVisible) return false;

        switch (sectionKey) {
          case 'navigation':
            return settings.hideNavigation !== true;
          case 'recently_read':
            return settings.hideRecentlyRead !== true;
          case 'media':
            return settings.hideMedia !== true;
          case 'community':
            return settings.hideCommunity !== true;
          case 'admin_governance':
            return settings.hideAdminGovernance !== true;
          case 'extensions':
            return settings.hideExtensions !== true;
          case 'footer_stats':
            return settings.hideFooterStats !== true;
          default:
            return true;
        }
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeFiltersForExtension(this.getName());
  }
}
