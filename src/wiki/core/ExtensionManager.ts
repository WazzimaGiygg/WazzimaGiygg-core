/**
 * @file ExtensionManager.ts
 * @description Gerenciador central (Singleton) responsável por carregar, inicializar e 
 * manter o ciclo de vida de todas as extensões do WikiWorldWeb / WikiZero.
 * 
 * Regra de Segurança do Sistema:
 * Apenas usuários com prerrogativas de Burocrata (Bureaucrat) podem ativar,
 * desativar, adicionar ou remover extensões do sistema.
 */

import { HookRegistry, WikiExtension } from './Extension';
import {
  UserProfile,
  InstalledExtensionMeta,
  ExtensionCategory,
  CustomWikitextTagRule,
  CustomToolConfig,
  CustomThemeConfig,
  CustomEditorPluginConfig,
  CustomArticleBannerConfig,
  CustomContentFilterRule,
  ExtensionSettingField,
  ExtensionConflict,
  EditorButtonDefinition,
  ArticleActionDefinition,
  ArticleWidgetDefinition,
  RegisteredToolMeta,
  ExtensionSettingSchema,
} from '../types';
import { StorageService } from '../services/storageService';
import {
  FirebaseExtensionSyncService,
  SyncStateStatus,
} from '../services/firebaseExtensionSyncService';
import { extensionSyncSecurityDevice } from '../services/extensionSyncSecurityDevice';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { extensionMalwareScannerDevice } from '../services/extensionMalwareScannerDevice';

// Extensões nativas instaladas no núcleo
import ReadingTimeEnhancer from '../extensions/reading-time';
import MathKatex from '../extensions/math-katex';
import SyntaxHighlightGeSHi from '../extensions/code-highlight';
import CiteAcademicFootnotes from '../extensions/footnotes-ref';
import InfoboxResponsiveStyler from '../extensions/infobox-styler';
import DisambiguationNotice from '../extensions/disambiguation';
import EditorialMetricsCollector from '../extensions/word-metrics';
import QrCodeQuickShare from '../extensions/qr-code-share';
import Android23GingerbreadTheme from '../extensions/android-23-theme';
import CalculatorToolExtension from '../extensions/calculator-tool';
import WorldClockToolExtension from '../extensions/world-clock-tool';
import WeatherForecastToolExtension from '../extensions/weather-tool';
import GeminiAssistantToolExtension from '../extensions/gemini-assistant-tool';
import NotepadToolExtension from '../extensions/notepad';
import WikiXssSanitizerSecurityLayer from '../extensions/security-layers/xss-sanitizer';
import WikiVandalismGuardSecurityLayer from '../extensions/security-layers/vandalism-guard';
import WikiRateLimiterSecurityLayer from '../extensions/security-layers/rate-limiter';
import WikiIntegritySentinelSecurityLayer from '../extensions/security-layers/integrity-sentinel';
import SupportTicketsExtension from '../extensions/support-tickets';
import ExternalLinkRedirectorExtension from '../extensions/external-redirector';
import WikiMaintenanceModeExtension from '../extensions/maintenance-mode';
import WikiBooksExtension from '../extensions/wiki-books';
import WikiUniversityExtension from '../extensions/wiki-university';
import WazzimaGiyggNewsExtension from '../extensions/wazzimagiygg-news';
import AppearanceLockExtension from '../extensions/appearance-lock';
import OtherRulesExtension from '../extensions/other-rules';
import WikiBrandingExtension from '../extensions/wiki-branding';
import CustomFaviconLogoExtension from '../extensions/custom-favicon-logo';
import CustomCssExtension from '../extensions/custom-css';
import SidebarMenuCustomizerExtension from '../extensions/sidebar-menu-customizer';
import MobileVersionControlExtension from '../extensions/mobile-version-control';
import MazeRecaptchaControlExtension from '../extensions/maze-recaptcha-control';
import WmfNoticeControlExtension from '../extensions/wmf-notice-control';
import WelcomeMessageCustomizerExtension from '../extensions/welcome-message-customizer';
import DefaultLanguageExtension from '../extensions/default-language';
import MainPageCustomizerExtension from '../extensions/mainpage-customizer';
import SmartTvConfigExtension from '../extensions/smartv-config';
import {
  Win95ThemeExtension,
  Win31ThemeExtension,
  WinXpThemeExtension,
  Win7ThemeExtension,
  Win10ThemeExtension,
  Win1ThemeExtension,
  GoogleThemeExtension,
  WikidiotaThemeExtension,
  GenshinThemeExtension,
  Android15ThemeExtension,
  StardewValleyThemeExtension,
  RepoTerminalThemeExtension,
  MinecraftThemeExtension,
  RobloxThemeExtension,
  Nokia3310ThemeExtension,
  HalfLifeThemeExtension,
} from '../extensions/themes/allThemes';
import SqlDatabaseBackupExtension from '../extensions/sql-database-backup';
import HideOnlineUsersExtension from '../extensions/hide-online-users';
import ExtensionsSecurityAuditorExtension from '../extensions/extensions-security-auditor';
import FirebaseAppletConfigImporterExtension from '../extensions/firebase-applet-config-importer';
import UserChatExtension from '../extensions/user-chat';
import GeneralHelpExtension from '../extensions/general-help';
import DailyChecklistExtension from '../extensions/daily-checklist';
import GeminiApiKeyExtension from '../extensions/gemini-api-key';
import BotAgentExtension from '../extensions/bot-agent';
import FirstVisitNewsPopupExtension from '../extensions/first-visit-news-popup';
import PlagiarismCheckerExtension from '../extensions/plagiarism-checker';
import OnlineStatusVerifierExtension from '../extensions/online-status-verifier';
import OnlineStatusExtension from './extensions/OnlineStatusExtension';
import { NetworkStatusService } from '../services/networkStatusService';
import { isUserBureaucrat } from '../utils/bureaucratAuth';

export { isUserBureaucrat };

export class ExtensionManager {
  private static instance: ExtensionManager;
  private readonly hookRegistry: HookRegistry;

  /** Todas as extensões compiladas/descobertas (ativas ou inativas) */
  private registeredExtensions: Map<string, WikiExtension> = new Map();

  /** Extensões atualmente ativas com ganchos registrados */
  private loadedExtensions: Map<string, WikiExtension> = new Map();

  /** Estados de ativação persistidos ({ [extensionName]: boolean }) */
  private extensionStates: Record<string, boolean> = {};

  /** Configurações de extensões persistidas ({ [extensionName]: Record<string, any> }) */
  private extensionSettings: Record<string, Record<string, any>> = {};

  /** Extensões personalizadas adicionadas em tempo de execução pelos burocratas */
  private customExtensions: InstalledExtensionMeta[] = [];

  /** Extensões sincronizadas da nuvem Firebase */
  private cloudExtensions: InstalledExtensionMeta[] = [];

  /** Status de conexão e sincronia com o Firebase Firestore */
  private syncStatus: SyncStateStatus = 'connecting';

  /** Timestamp da última sincronização com o Firebase */
  private lastCloudSyncAt: string | null = null;

  /** Ouvintes reativos para atualizar a UI do React em tempo real */
  private listeners: Set<() => void> = new Set();

  private isInitialized: boolean = false;

  /**
   * Construtor privado para garantir o padrão Singleton.
   */
  private constructor() {
    ExtensionManager.instance = this;
    this.hookRegistry = new HookRegistry();
    this.loadPersistedData();
    this.registerBuiltinExtensions();
    this.initCloudSync();
  }

  /**
   * Registra síncronamente as extensões nativas do WikiZero.
   */
  private registerBuiltinExtensions(): void {
    const builtins: (new () => WikiExtension)[] = [
      ReadingTimeEnhancer,
      MathKatex,
      SyntaxHighlightGeSHi,
      CiteAcademicFootnotes,
      InfoboxResponsiveStyler,
      DisambiguationNotice,
      EditorialMetricsCollector,
      QrCodeQuickShare,
      Android23GingerbreadTheme,
      CalculatorToolExtension,
      WorldClockToolExtension,
      WeatherForecastToolExtension,
      GeminiAssistantToolExtension,
      NotepadToolExtension,
      WikiXssSanitizerSecurityLayer,
      WikiVandalismGuardSecurityLayer,
      WikiRateLimiterSecurityLayer,
      WikiIntegritySentinelSecurityLayer,
      SupportTicketsExtension,
      ExternalLinkRedirectorExtension,
      WikiMaintenanceModeExtension,
      WikiBooksExtension,
      WikiUniversityExtension,
      WazzimaGiyggNewsExtension,
      AppearanceLockExtension,
      OtherRulesExtension,
      WikiBrandingExtension,
      CustomFaviconLogoExtension,
      CustomCssExtension,
      SidebarMenuCustomizerExtension,
      MobileVersionControlExtension,
      MazeRecaptchaControlExtension,
      WmfNoticeControlExtension,
      WelcomeMessageCustomizerExtension,
      DefaultLanguageExtension,
      MainPageCustomizerExtension,
      SmartTvConfigExtension,
      Win95ThemeExtension,
      Win31ThemeExtension,
      WinXpThemeExtension,
      Win7ThemeExtension,
      Win10ThemeExtension,
      Win1ThemeExtension,
      GoogleThemeExtension,
      WikidiotaThemeExtension,
      GenshinThemeExtension,
      Android15ThemeExtension,
      StardewValleyThemeExtension,
      RepoTerminalThemeExtension,
      MinecraftThemeExtension,
      RobloxThemeExtension,
      Nokia3310ThemeExtension,
      HalfLifeThemeExtension,
      SqlDatabaseBackupExtension,
      HideOnlineUsersExtension,
      ExtensionsSecurityAuditorExtension,
      FirebaseAppletConfigImporterExtension,
      UserChatExtension,
      GeneralHelpExtension,
      DailyChecklistExtension,
      GeminiApiKeyExtension,
      BotAgentExtension,
      FirstVisitNewsPopupExtension,
      PlagiarismCheckerExtension,
      OnlineStatusVerifierExtension,
      OnlineStatusExtension,
    ];

    for (const ExtensionClass of builtins) {
      try {
        const instance = new ExtensionClass();
        this.registerExtension(instance, true);
      } catch (err) {
        console.error('[ExtensionManager] Erro ao registrar extensão embutida:', err);
      }
    }
  }

  /**
   * Obtém a instância única do ExtensionManager (Singleton).
   */
  public static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager();
    }
    return ExtensionManager.instance;
  }

  /**
   * Retorna o registro de ganchos (HookRegistry) para consumo no núcleo da aplicação.
   */
  public getHooks(): HookRegistry {
    return this.hookRegistry;
  }

  public get hooks(): HookRegistry {
    return this.hookRegistry;
  }

  /**
   * Inscreve um componente para receber notificações de mudanças de estado nas extensões.
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[ExtensionManager] Erro no ouvinte de extensão:', err);
      }
    });
  }

  /**
   * Injeta CSS específico de uma extensão no <head> do documento de forma segura e isolada.
   */
  public injectExtensionCss(extensionName: string, css: string): void {
    if (typeof document === 'undefined' || !css || !css.trim()) return;
    try {
      const styleId = `wiki-ext-style-${extensionName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.setAttribute('data-extension', extensionName);
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = css;
    } catch (e) {
      console.warn(`[ExtensionManager] Erro ao injetar CSS para '${extensionName}':`, e);
    }
  }

  /**
   * Remove o CSS injetado de uma extensão ao desativá-la ou desinstalá-la.
   */
  public removeExtensionCss(extensionName: string): void {
    if (typeof document === 'undefined') return;
    try {
      const styleId = `wiki-ext-style-${extensionName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const styleEl = document.getElementById(styleId);
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    } catch (e) {
      console.warn(`[ExtensionManager] Erro ao remover CSS de '${extensionName}':`, e);
    }
  }

  /**
   * Carrega os estados salvos de ativação, extensões customizadas e configurações do armazenamento local.
   */
  private loadPersistedData(): void {
    this.extensionStates = StorageService.getSavedExtensionStates();
    this.extensionSettings = StorageService.getSavedExtensionSettings();
    this.customExtensions = StorageService.getSavedCustomExtensions();
  }

  /**
   * Salva os estados atuais de ativação.
   */
  private persistStates(): void {
    StorageService.saveExtensionStates(this.extensionStates);
  }

  /**
   * Salva as configurações de todas as extensões.
   */
  private persistSettings(): void {
    StorageService.saveExtensionSettings(this.extensionSettings);
  }

  /**
   * Salva a lista de extensões customizadas.
   */
  private persistCustomExtensions(): void {
    StorageService.saveCustomExtensions(this.customExtensions);
  }

  /**
   * 304.2 & 304.5: Inicializa a sincronização em tempo real com o Firebase Firestore.
   * Conecta ouvintes para refletir imediatamente estados ativados/desativados mesmo para visitantes não autenticados.
   */
  public initCloudSync(): void {
    const syncService = FirebaseExtensionSyncService.getInstance();
    syncService.subscribeStatus((status) => {
      this.syncStatus = status;
      this.lastCloudSyncAt = syncService.getLastSyncedAt();
      this.notifyListeners();
    });

    syncService.startRealtimeSync(
      (cloudStates, cloudSettings) => {
        this.applyCloudStates(cloudStates, cloudSettings);
      },
      (cloudExts) => {
        this.applyCloudExtensions(cloudExts);
      }
    );
  }

  public getSyncStatus(): SyncStateStatus {
    return this.syncStatus;
  }

  public getLastCloudSyncAt(): string | null {
    return this.lastCloudSyncAt;
  }

  /**
   * Aplica os estados globais recebidos do Firebase Firestore.
   */
  private applyCloudStates(
    cloudStates: Record<string, boolean>,
    cloudSettings?: Record<string, Record<string, any>>
  ): void {
    let hasChanged = false;

    // Sincroniza configurações recebidas da nuvem
    if (cloudSettings && typeof cloudSettings === 'object') {
      for (const [extName, s] of Object.entries(cloudSettings)) {
        if (s && typeof s === 'object') {
          this.extensionSettings[extName] = {
            ...(this.extensionSettings[extName] || {}),
            ...s,
          };
          hasChanged = true;
        }
      }
      this.persistSettings();
    }

    for (const [name, isEnabled] of Object.entries(cloudStates)) {
      const isCurrentlyLoaded = this.loadedExtensions.has(name);
      const isStateDifferent = this.extensionStates[name] !== isEnabled;
      const isLoadedDifferent = isCurrentlyLoaded !== isEnabled;

      if (isStateDifferent || isLoadedDifferent) {
        this.extensionStates[name] = isEnabled;
        hasChanged = true;

        const ext = this.findExtension(name);
        if (ext) {
          if (isEnabled && !isCurrentlyLoaded) {
            try {
              const settings = this.extensionSettings[name] || {};
              ext.onRegister(this.hookRegistry, { settings, manager: this });
              this.loadedExtensions.set(name, ext);
              if (typeof ext.getCustomCss === 'function') {
                const css = ext.getCustomCss();
                if (css) this.injectExtensionCss(name, css);
              }
            } catch (err) {
              console.error(`[ExtensionManager] Erro ao carregar '${name}' via nuvem:`, err);
            }
          } else if (!isEnabled && isCurrentlyLoaded) {
            try {
              this.removeExtensionCss(name);
              this.hookRegistry.removeAllHooksForExtension(name);
              if (typeof ext.onUnregister === 'function') {
                ext.onUnregister(this.hookRegistry);
              }
              this.loadedExtensions.delete(name);
            } catch (err) {
              console.error(`[ExtensionManager] Erro ao descarregar '${name}' via nuvem:`, err);
            }
          }
        }
      }
    }

    if (hasChanged) {
      this.persistStates();
      this.notifyListeners();
    }
  }

  /**
   * Sincroniza a lista de extensões recebidas do Firebase Firestore.
   */
  private applyCloudExtensions(cloudExts: InstalledExtensionMeta[]): void {
    this.cloudExtensions = cloudExts;
    let hasNewCustom = false;

    for (const cExt of cloudExts) {
      // Se não for uma extensão local compilada
      if (!this.registeredExtensions.has(cExt.name)) {
        const existingIdx = this.customExtensions.findIndex((c) => c.name === cExt.name || c.id === cExt.id);
        if (existingIdx === -1) {
          this.customExtensions.push({
            ...cExt,
            syncStatus: 'synced',
          });
          hasNewCustom = true;
        } else {
          this.customExtensions[existingIdx] = {
            ...this.customExtensions[existingIdx],
            ...cExt,
            syncStatus: 'synced',
          };
        }
      }
    }

    if (hasNewCustom) {
      this.persistCustomExtensions();
      this.mountCustomExtensions();
    }
    this.notifyListeners();
  }

  /**
   * Registra uma extensão no catálogo. Se estiver marcada como ativa, executa seu onRegister.
   */
  public registerExtension(extension: WikiExtension, defaultEnabled: boolean = true): void {
    if (!extension || typeof extension.getName !== 'function') {
      console.error('[ExtensionManager] Tentativa de registrar extensão inválida:', extension);
      return;
    }

    const name = extension.getName();
    this.registeredExtensions.set(name, extension);

    // Determina se deve estar ativada: respeita estado salvo, senão usa padrão
    const isEnabled = this.extensionStates[name] !== undefined
      ? this.extensionStates[name]
      : defaultEnabled;

    this.extensionStates[name] = isEnabled;

    if (isEnabled && !this.loadedExtensions.has(name)) {
      try {
        const settings = this.extensionSettings[name] || {};
        extension.onRegister(this.hookRegistry, { settings, manager: this });
        this.loadedExtensions.set(name, extension);

        // Injeta CSS se a extensão disponibilizar
        if (typeof extension.getCustomCss === 'function') {
          const css = extension.getCustomCss();
          if (css) this.injectExtensionCss(name, css);
        }

        console.info(`[ExtensionManager] 🧩 Extensão '${name}' (v${extension.getVersion()}) inicializada.`);
      } catch (error) {
        console.error(`[ExtensionManager] Falha ao inicializar extensão '${name}':`, error);
      }
    }
  }

  /**
   * Carrega dinamicamente todas as extensões disponíveis no diretório /src/extensions
   * usando o carregamento de módulos nativo do Vite (import.meta.glob).
   */
  public async loadExtensionsFromGlob(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.loadPersistedData();
    console.info('[ExtensionManager] Varrendo catálogo de extensões dinâmicas...');

    const srcExtensionModules: Record<string, () => Promise<any>> =
      (import.meta as any).glob('/src/wiki/extensions/**/index.ts') || {};
    const legacySrcExtensionModules: Record<string, () => Promise<any>> =
      (import.meta as any).glob('/src/extensions/**/index.ts') || {};

    const rootExtensionModules: Record<string, () => Promise<any>> =
      (import.meta as any).glob('/extensions/**/index.ts') || {};

    const allModulePaths: Record<string, () => Promise<any>> = {
      ...rootExtensionModules,
      ...legacySrcExtensionModules,
      ...srcExtensionModules,
    };

    const loadPromises: Promise<void>[] = [];

    for (const [path, importModule] of Object.entries(allModulePaths)) {
      loadPromises.push(
        (async () => {
          try {
            const moduleExports = await importModule();
            let extensionInstance: WikiExtension | null = null;

            if (moduleExports.default) {
              if (typeof moduleExports.default === 'function') {
                extensionInstance = new (moduleExports.default as new () => WikiExtension)();
              } else if (typeof moduleExports.default.getName === 'function') {
                extensionInstance = moduleExports.default as WikiExtension;
              }
            }

            if (!extensionInstance && moduleExports.extension) {
              if (typeof moduleExports.extension === 'function') {
                extensionInstance = new (moduleExports.extension as new () => WikiExtension)();
              } else if (typeof moduleExports.extension.getName === 'function') {
                extensionInstance = moduleExports.extension as WikiExtension;
              }
            }

            if (!extensionInstance) {
              for (const key of Object.keys(moduleExports)) {
                const exp = moduleExports[key];
                if (exp && typeof exp.getName === 'function') {
                  extensionInstance = exp as WikiExtension;
                  break;
                }
              }
            }

            if (extensionInstance && !this.registeredExtensions.has(extensionInstance.getName())) {
              this.registerExtension(extensionInstance, true);
            }
          } catch (err) {
            console.error(`[ExtensionManager] Erro ao carregar extensão em '${path}':`, err);
          }
        })()
      );
    }

    await Promise.all(loadPromises);

    // Carrega extensões customizadas cadastradas por burocratas
    this.mountCustomExtensions();

    this.persistStates();
    this.isInitialized = true;

    console.info(
      `[ExtensionManager] Carregamento concluído: ${this.loadedExtensions.size} ativas de ${this.registeredExtensions.size} instaladas.`
    );

    this.hookRegistry.doAction('extensions:all_loaded', Array.from(this.loadedExtensions.values()));
    this.notifyListeners();
  }

  /**
   * Instancia e registra extensões customizadas adicionadas dinamicamente por burocratas.
   * Suporta scripts, CSS isolado, tags customizadas de Wikitext e ferramentas interativas.
   */
  private mountCustomExtensions(): void {
    for (const customMeta of this.customExtensions) {
      if (this.registeredExtensions.has(customMeta.name)) continue;

      const dynamicExt: WikiExtension = {
        getName: () => customMeta.name,
        getVersion: () => customMeta.version,
        getDescription: () => customMeta.description,
        getAuthor: () => customMeta.author,
        getCategory: () => customMeta.category,
        isCore: () => false,
        getWebsite: () => customMeta.website,
        getCustomCss: () => customMeta.customCss,
        getSettingsSchema: () => customMeta.settingsSchema,
        getPermissions: () => customMeta.permissions,
        getToolConfig: () => customMeta.toolConfig,
        getThemeConfig: () => customMeta.themeConfig,
        getEditorPluginConfig: () => customMeta.editorPluginConfig,
        getBannerConfig: () => customMeta.bannerConfig,
        getDependencies: () => customMeta.dependencies,
        onRegister: (hooks: HookRegistry, ctx?: { settings?: Record<string, any> }) => {
          const activeSettings = { ...(customMeta.settings || {}), ...(ctx?.settings || {}) };

          // 1. Injeção de CSS customizado se definido
          if (customMeta.customCss && customMeta.customCss.trim()) {
            this.injectExtensionCss(customMeta.name, customMeta.customCss);
          }

          // 2. Registro dinâmico de tags customizadas de Wikitext (ex: <spoiler>, <badge>, <blur>)
          if (customMeta.customTags && customMeta.customTags.length > 0) {
            hooks.addFilter<string>(
              'render:wikitext',
              (text: string) => {
                if (!text) return text;
                let processed = text;

                for (const tagRule of customMeta.customTags!) {
                  if (!tagRule.tag) continue;
                  const tagName = tagRule.tag.trim().toLowerCase();

                  if (tagRule.hasClosingTag !== false) {
                    // Substituição de tag com fechamento <tag>conteudo</tag>
                    const regex = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
                    processed = processed.replace(regex, (_match, attrs, content) => {
                      let template = tagRule.template || `<div class="wiki-custom-tag-${tagName}">{{content}}</div>`;
                      return template
                        .replace(/\{\{content\}\}/g, content)
                        .replace(/\{\{attrs\}\}/g, attrs || '');
                    });
                  } else {
                    // Tag auto-fechada <tag attr="val" />
                    const regexSelf = new RegExp(`<${tagName}\\b([^>]*)\\/?>`, 'gi');
                    processed = processed.replace(regexSelf, (_match, attrs) => {
                      let template = tagRule.template || `<span class="wiki-custom-tag-${tagName}"></span>`;
                      return template.replace(/\{\{attrs\}\}/g, attrs || '');
                    });
                  }
                }

                return processed;
              },
              12,
              customMeta.name
            );
          }

          // 3. Registro de ferramenta personalizada se configurada
          if (customMeta.toolConfig && customMeta.toolConfig.toolId) {
            const toolId = customMeta.toolConfig.toolId;
            hooks.addFilter<string[]>(
              'tools:registered_tools',
              (tools: string[] = []) => {
                if (!tools.includes(toolId)) {
                  return [...tools, toolId];
                }
                return tools;
              },
              10,
              customMeta.name
            );
            hooks.addFilter<boolean>(
              `tool:${toolId}_available`,
              () => true,
              10,
              customMeta.name
            );
          }

          // 4. Registro de tema visual se configurado
          if (customMeta.themeConfig && customMeta.themeConfig.themeId) {
            const tc = customMeta.themeConfig;
            hooks.addFilter<any[]>(
              'theme:registered_themes',
              (themes: any[] = []) => {
                if (!themes.some((t) => t.themeId === tc.themeId)) {
                  return [...themes, tc];
                }
                return themes;
              },
              10,
              customMeta.name
            );
            hooks.addFilter<boolean>(
              `theme:${tc.themeId}_available`,
              () => true,
              10,
              customMeta.name
            );

            // Injeta variáveis de CSS do tema dinamicamente
            const themeCss = `
:root[data-theme="${tc.themeId}"] {
  --color-primary: ${tc.accentColor || '#3b82f6'};
  --color-accent: ${tc.accentColor || '#3b82f6'};
  --bg-theme: ${tc.backgroundColor || '#ffffff'};
  --text-theme: ${tc.textColor || '#0f172a'};
  ${tc.fontFamily ? `--font-family-theme: ${tc.fontFamily};` : ''}
}
${tc.customCss || ''}
`;
            this.injectExtensionCss(`theme-${tc.themeId}`, themeCss);
          }

          // 5. Registro de botão do editor wikitext
          if (customMeta.editorPluginConfig && customMeta.editorPluginConfig.buttonId) {
            const ep = customMeta.editorPluginConfig;
            hooks.addFilter<any[]>(
              'editor:toolbar_buttons',
              (btns: any[] = []) => {
                if (!btns.some((b) => b.buttonId === ep.buttonId)) {
                  return [...btns, ep];
                }
                return btns;
              },
              10,
              customMeta.name
            );
          }

          // 6. Registro de banner / aviso para artigos
          if (customMeta.bannerConfig && customMeta.bannerConfig.title) {
            const bc = customMeta.bannerConfig;
            const bannerClasses =
              bc.type === 'alert'
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : bc.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : bc.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200';

            const icon =
              bc.type === 'alert' ? '⛔' : bc.type === 'warning' ? '⚠️' : bc.type === 'success' ? '✅' : '📢';

            const bannerHtml = sanitizeHtml(`
<div class="wiki-custom-banner my-3 p-3.5 rounded-2xl border ${bannerClasses} flex items-center gap-3 text-xs shadow-xs font-sans">
  <span class="text-base select-none">${icon}</span>
  <div class="min-w-0">
    <div class="font-bold">${bc.title}</div>
    <div class="opacity-90">${bc.message}</div>
  </div>
</div>`);

            hooks.addFilter<string>(
              'render:html',
              (html: string) => {
                if (!html) return html;
                return bc.position === 'bottom' ? html + bannerHtml : bannerHtml + html;
              },
              8,
              customMeta.name
            );
          }

          // 7. Filtros de vocabulário e regras de conteúdo
          if (customMeta.filterRules && customMeta.filterRules.length > 0) {
            hooks.addFilter<string>(
              'render:wikitext',
              (text: string) => {
                if (!text) return text;
                let out = text;
                for (const rule of customMeta.filterRules!) {
                  if (!rule.pattern) continue;
                  if (rule.isRegex) {
                    try {
                      const rx = new RegExp(rule.pattern, 'gi');
                      out = out.replace(rx, rule.replacement || '');
                    } catch (e) {
                      console.warn(`[ExtensionManager] Regex inválido na regra de '${customMeta.name}':`, e);
                    }
                  } else {
                    out = out.split(rule.pattern).join(rule.replacement || '');
                  }
                }
                return out;
              },
              13,
              customMeta.name
            );
          }

          // 8. Execução de script dinâmico avançado fornecido pelo burocrata
          if (customMeta.customScript && customMeta.customScript.trim()) {
            try {
              const utils = {
                injectCss: (css: string) => this.injectExtensionCss(customMeta.name, css),
                removeCss: () => this.removeExtensionCss(customMeta.name),
                log: (msg: string) => console.info(`[${customMeta.name}] ${msg}`),
                warn: (msg: string) => console.warn(`[${customMeta.name}] ${msg}`),
                getSetting: (key: string, defaultVal: any) =>
                  activeSettings[key] !== undefined ? activeSettings[key] : defaultVal,
                addTag: (
                  tagName: string,
                  formatter: (content: string, attrs?: string) => string,
                  hasClosing: boolean = true
                ) => {
                  hooks.addFilter<string>(
                    'render:wikitext',
                    (txt: string) => {
                      if (!txt) return txt;
                      if (hasClosing) {
                        const rx = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
                        return txt.replace(rx, (_m, attrs, body) => formatter(body, attrs));
                      } else {
                        const rx = new RegExp(`<${tagName}\\b([^>]*)\\/?>`, 'gi');
                        return txt.replace(rx, (_m, attrs) => formatter('', attrs));
                      }
                    },
                    12,
                    customMeta.name
                  );
                },
                addTool: (tool: CustomToolConfig) => {
                  if (!tool || !tool.toolId) return;
                  hooks.addFilter<string[]>(
                    'tools:registered_tools',
                    (tools: string[] = []) => (!tools.includes(tool.toolId) ? [...tools, tool.toolId] : tools),
                    10,
                    customMeta.name
                  );
                  hooks.addFilter<boolean>(`tool:${tool.toolId}_available`, () => true, 10, customMeta.name);
                },
                addTheme: (theme: CustomThemeConfig) => {
                  if (!theme || !theme.themeId) return;
                  hooks.addFilter<any[]>(
                    'theme:registered_themes',
                    (thms: any[] = []) => (!thms.some((t) => t.themeId === theme.themeId) ? [...thms, theme] : thms),
                    10,
                    customMeta.name
                  );
                  hooks.addFilter<boolean>(`theme:${theme.themeId}_available`, () => true, 10, customMeta.name);
                },
                addEditorButton: (btn: CustomEditorPluginConfig) => {
                  if (!btn || !btn.buttonId) return;
                  hooks.addFilter<any[]>(
                    'editor:toolbar_buttons',
                    (btns: any[] = []) => (!btns.some((b) => b.buttonId === btn.buttonId) ? [...btns, btn] : btns),
                    10,
                    customMeta.name
                  );
                },
                addArticleBanner: (banner: CustomArticleBannerConfig) => {
                  if (!banner || !banner.title) return;
                  hooks.addFilter<string>(
                    'render:html',
                    (html: string) => {
                      const bannerHtml = sanitizeHtml(`<div class="wiki-custom-banner my-3 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-xs flex items-center gap-2"><span>📢</span><div><strong>${banner.title}:</strong> ${banner.message}</div></div>`);
                      return banner.position === 'bottom' ? html + bannerHtml : bannerHtml + html;
                    },
                    8,
                    customMeta.name
                  );
                },
                addContentFilter: (pattern: string, replacement: string, isRegex?: boolean) => {
                  hooks.addFilter<string>(
                    'render:wikitext',
                    (txt: string) => {
                      if (!txt) return txt;
                      if (isRegex) {
                        return txt.replace(new RegExp(pattern, 'gi'), replacement);
                      }
                      return txt.split(pattern).join(replacement);
                    },
                    13,
                    customMeta.name
                  );
                },
              };

              const runner = new Function('hooks', 'extensionName', 'settings', 'utils', customMeta.customScript);
              runner(hooks, customMeta.name, activeSettings, utils);
            } catch (e) {
              console.error(`[ExtensionManager] Erro no script da extensão customizada '${customMeta.name}':`, e);
            }
          } else if (
            !customMeta.customTags &&
            !customMeta.customCss &&
            !customMeta.toolConfig &&
            !customMeta.themeConfig &&
            !customMeta.editorPluginConfig &&
            !customMeta.bannerConfig &&
            !customMeta.filterRules
          ) {
            // Gancho padrão para diagnóstico
            hooks.addAction('article:viewed', () => {}, 20, customMeta.name);
          }
        },
        onUnregister: (hooks: HookRegistry) => {
          this.removeExtensionCss(customMeta.name);
          if (customMeta.themeConfig?.themeId) {
            this.removeExtensionCss(`theme-${customMeta.themeConfig.themeId}`);
          }
          hooks.removeAllHooksForExtension(customMeta.name);
        },
      };

      const isEnabled = this.extensionStates[customMeta.name] ?? customMeta.enabled;
      this.registerExtension(dynamicExt, isEnabled);
    }
  }

  /**
   * Retorna a lista completa com os metadados de todas as extensões instaladas no sistema.
   */
  public getAllInstalledExtensions(): InstalledExtensionMeta[] {
    const list: InstalledExtensionMeta[] = [];

    for (const [name, ext] of this.registeredExtensions.entries()) {
      const isEnabled = this.loadedExtensions.has(name);
      const isCore = typeof ext.isCore === 'function' ? ext.isCore() : true;
      const category: ExtensionCategory =
        typeof ext.getCategory === 'function' ? ext.getCategory()! : 'utility';
      const website = typeof ext.getWebsite === 'function' ? ext.getWebsite() : undefined;
      const desc =
        typeof ext.getDescription === 'function'
          ? ext.getDescription()!
          : 'Extensão integrada ao ecossistema da enciclopédia.';
      const author = typeof ext.getAuthor === 'function' ? ext.getAuthor()! : 'WikiZero Core Team';
      const version = typeof ext.getVersion === 'function' ? ext.getVersion() : '1.0.0';

      const hooksInfo = this.hookRegistry.getHooksForExtension(name);
      const allHooks = [...hooksInfo.filters, ...hooksInfo.actions];

      // Busca dados adicionais se for uma extensão customizada existente
      const customMatch = this.customExtensions.find((c) => c.name === name);

      const settingsSchema: ExtensionSettingField[] | undefined =
        typeof ext.getSettingsSchema === 'function'
          ? ext.getSettingsSchema()
          : customMatch?.settingsSchema;

      const activeSettings = this.extensionSettings[name] || customMatch?.settings || {};

      const permissions =
        typeof ext.getPermissions === 'function'
          ? ext.getPermissions()
          : customMatch?.permissions || ['render_hook'];

      const toolConfig =
        typeof ext.getToolConfig === 'function' ? ext.getToolConfig() : customMatch?.toolConfig;

      const themeConfig =
        typeof ext.getThemeConfig === 'function' ? ext.getThemeConfig() : customMatch?.themeConfig;

      const editorPluginConfig =
        typeof ext.getEditorPluginConfig === 'function'
          ? ext.getEditorPluginConfig()
          : customMatch?.editorPluginConfig;

      const bannerConfig =
        typeof ext.getBannerConfig === 'function'
          ? ext.getBannerConfig()
          : customMatch?.bannerConfig;

      const dependencies =
        typeof ext.getDependencies === 'function'
          ? ext.getDependencies()
          : customMatch?.dependencies;

      const isCloudSyncable =
        typeof (ext as any).isSyncableWithCloud === 'function'
          ? (ext as any).isSyncableWithCloud()
          : name !== 'SqlDatabaseBackupExtension' && name !== 'FirebaseAppletConfigImporterExtension';

      list.push({
        id: customMatch?.id || `ext-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name,
        version,
        description: desc,
        author,
        category,
        enabled: isEnabled,
        isCore: customMatch ? false : isCore,
        installedAt: customMatch?.installedAt || '2026-01-01T00:00:00.000Z',
        installedBy: customMatch?.installedBy || 'Sistema (Nativo)',
        lastModifiedAt: customMatch?.lastModifiedAt,
        lastModifiedBy: customMatch?.lastModifiedBy,
        website,
        hooks: allHooks.length > 0 ? allHooks : customMatch?.hooks || ['render:wikitext'],
        customScript: customMatch?.customScript,
        customCss:
          customMatch?.customCss ||
          (typeof ext.getCustomCss === 'function' ? ext.getCustomCss() : undefined),
        customTags: customMatch?.customTags,
        toolConfig,
        themeConfig,
        editorPluginConfig,
        bannerConfig,
        filterRules: customMatch?.filterRules,
        dependencies,
        settingsSchema,
        settings: activeSettings,
        permissions,
        tags: customMatch?.tags,
        noCloudSync: !isCloudSyncable,
        syncStatus: !isCloudSyncable ? 'local_only' : undefined,
        originFile:
          name === 'SqlDatabaseBackupExtension'
            ? 'src/extensions/sql-database-backup/config.ts'
            : name === 'FirebaseAppletConfigImporterExtension'
            ? 'src/extensions/firebase-applet-config-importer/config.ts'
            : customMatch?.originFile,
      });
    }

    return list;
  }

  /**
   * ATIVAÇÃO DE EXTENSÃO (Update 3.05 - Requisitos 3.05.3.q.2 & 3.05.3.q.3)
   * Regra: Apenas burocratas podem ativar extensões.
   * Assíncrono com garantia de persistência no Firestore antes de concluir.
   */
  public async activateExtension(
    nameOrId: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Acesso negado: Apenas burocratas do Conselho possuem permissão para ativar extensões da Wiki.',
      };
    }

    const ext = this.findExtension(nameOrId);
    if (!ext) {
      return { success: false, message: `Extensão '${nameOrId}' não encontrada no catálogo de instaladas.` };
    }

    const name = ext.getName();
    if (this.loadedExtensions.has(name)) {
      return { success: true, message: `A extensão '${name}' já se encontra ativa.` };
    }

    try {
      const settings = this.extensionSettings[name] || {};
      ext.onRegister(this.hookRegistry, { settings, manager: this });
      this.loadedExtensions.set(name, ext);
      this.extensionStates[name] = true;
      this.persistStates();

      // Injeta CSS se disponível
      if (typeof ext.getCustomCss === 'function') {
        const css = ext.getCustomCss();
        if (css) this.injectExtensionCss(name, css);
      }

      // Atualiza lista de custom extensions se for customizada
      const customIdx = this.customExtensions.findIndex((c) => c.name === name || c.id === nameOrId);
      if (customIdx >= 0) {
        this.customExtensions[customIdx].enabled = true;
        this.customExtensions[customIdx].lastModifiedAt = new Date().toISOString();
        this.customExtensions[customIdx].lastModifiedBy = currentUser?.displayName || currentUser?.username || 'Burocrata';
        this.persistCustomExtensions();
      }

      // Registra log formal de auditoria
      StorageService.logExtensionAction({
        extensionId: nameOrId,
        extensionName: name,
        action: 'activated',
        operatorUid: currentUser?.uid || '',
        operatorUsername: currentUser?.displayName || currentUser?.username || currentUser?.email || 'Burocrata',
        operatorRole: currentUser?.role || 'admin',
        details: `Extensão ativada com sucesso pelo burocrata.`,
      });

      // 3.05.3.q.2 & 3.05.3.q.3: Aguarda confirmação no Firestore para sincronização multi-computador
      try {
        const syncRes = await FirebaseExtensionSyncService.getInstance().syncStatesToCloud(
          this.extensionStates,
          currentUser,
          this.extensionSettings
        );
        if (!syncRes.success) {
          console.warn('[ExtensionManager] Aviso na sincronização do Firestore:', syncRes.message);
        }
        if (customIdx >= 0) {
          await FirebaseExtensionSyncService.getInstance().saveExtensionToCloud(this.customExtensions[customIdx], currentUser);
        }
      } catch (cloudErr) {
        console.warn('[ExtensionManager] Alerta na sincronização de nuvem (dados salvos localmente):', cloudErr);
      }

      this.hookRegistry.doAction('extension:activated', ext);
      this.notifyListeners();

      return {
        success: true,
        message: `Extensão '${name}' ativada e sincronizada no Firebase com sucesso!`,
      };
    } catch (err: any) {
      console.error(`[ExtensionManager] Erro ao ativar extensão '${name}':`, err);
      return {
        success: false,
        message: `Falha ao ativar '${name}': ${err?.message || 'Erro de execução desconhecido.'}`,
      };
    }
  }

  /**
   * DESATIVAÇÃO DE EXTENSÃO (Update 3.05 - Requisitos 3.05.3.q.2 & 3.05.3.q.3)
   * Regra: Apenas burocratas podem desativar extensões.
   * Assíncrono com garantia de persistência no Firestore antes de concluir.
   */
  public async deactivateExtension(
    nameOrId: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Acesso negado: Apenas burocratas do Conselho possuem permissão para desativar extensões da Wiki.',
      };
    }

    const ext = this.findExtension(nameOrId);
    if (!ext) {
      return { success: false, message: `Extensão '${nameOrId}' não encontrada no catálogo de instaladas.` };
    }

    const name = ext.getName();
    if (!this.loadedExtensions.has(name)) {
      return { success: true, message: `A extensão '${name}' já se encontra desativada.` };
    }

    try {
      this.removeExtensionCss(name);
      this.hookRegistry.removeAllHooksForExtension(name);
      if (typeof ext.onUnregister === 'function') {
        ext.onUnregister(this.hookRegistry);
      }
      this.loadedExtensions.delete(name);
      this.extensionStates[name] = false;
      this.persistStates();

      const customIdx = this.customExtensions.findIndex((c) => c.name === name || c.id === nameOrId);
      if (customIdx >= 0) {
        this.customExtensions[customIdx].enabled = false;
        this.customExtensions[customIdx].lastModifiedAt = new Date().toISOString();
        this.customExtensions[customIdx].lastModifiedBy = currentUser?.displayName || currentUser?.username || 'Burocrata';
        this.persistCustomExtensions();
      }

      // Registra log formal de auditoria
      StorageService.logExtensionAction({
        extensionId: nameOrId,
        extensionName: name,
        action: 'deactivated',
        operatorUid: currentUser?.uid || '',
        operatorUsername: currentUser?.displayName || currentUser?.username || currentUser?.email || 'Burocrata',
        operatorRole: currentUser?.role || 'admin',
        details: `Extensão desativada pelo burocrata. Todos os ganchos e estilos foram suspensos.`,
      });

      // 3.05.3.q.2 & 3.05.3.q.3: Aguarda confirmação no Firestore para sincronização multi-computador
      try {
        const syncRes = await FirebaseExtensionSyncService.getInstance().syncStatesToCloud(
          this.extensionStates,
          currentUser,
          this.extensionSettings
        );
        if (!syncRes.success) {
          console.warn('[ExtensionManager] Aviso na sincronização do Firestore:', syncRes.message);
        }
        if (customIdx >= 0) {
          await FirebaseExtensionSyncService.getInstance().saveExtensionToCloud(this.customExtensions[customIdx], currentUser);
        }
      } catch (cloudErr) {
        console.warn('[ExtensionManager] Alerta na sincronização de nuvem (dados salvos localmente):', cloudErr);
      }

      this.hookRegistry.doAction('extension:deactivated', name);
      this.notifyListeners();

      return {
        success: true,
        message: `Extensão '${name}' desativada e sincronizada no Firebase com sucesso!`,
      };
    } catch (err: any) {
      console.error(`[ExtensionManager] Erro ao desativar extensão '${name}':`, err);
      return {
        success: false,
        message: `Falha ao desativar '${name}': ${err?.message || 'Erro desconhecido.'}`,
      };
    }
  }

  /**
   * ATUALIZAÇÃO DE CONFIGURAÇÕES DE EXTENSÃO
   * Permite aos burocratas calibrar parâmetros em tempo real.
   */
  public updateExtensionSettings(
    nameOrId: string,
    newSettings: Record<string, any>,
    currentUser: UserProfile | null
  ): { success: boolean; message: string } {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Apenas burocratas possuem autorização para alterar parâmetros de extensões.',
      };
    }

    const ext = this.findExtension(nameOrId);
    if (!ext) {
      return { success: false, message: `Extensão '${nameOrId}' não encontrada.` };
    }

    const name = ext.getName();
    this.extensionSettings[name] = { ...(this.extensionSettings[name] || {}), ...newSettings };
    this.persistSettings();

    // Se for extensão personalizada, atualiza também seu registro
    const customIdx = this.customExtensions.findIndex((c) => c.name === name || c.id === nameOrId);
    if (customIdx >= 0) {
      this.customExtensions[customIdx].settings = this.extensionSettings[name];
      this.customExtensions[customIdx].lastModifiedAt = new Date().toISOString();
      this.customExtensions[customIdx].lastModifiedBy = currentUser?.displayName || currentUser?.username || 'Burocrata';
      this.persistCustomExtensions();
    }

    // Se estiver ativa, reinicializa para aplicar as novas configurações imediatamente
    if (this.loadedExtensions.has(name)) {
      try {
        if (typeof ext.onUnregister === 'function') {
          ext.onUnregister(this.hookRegistry);
        }
        this.hookRegistry.removeAllHooksForExtension(name);
        ext.onRegister(this.hookRegistry, { settings: this.extensionSettings[name], manager: this });
      } catch (err) {
        console.warn(`[ExtensionManager] Erro ao recarregar extensão '${name}' com novas configurações:`, err);
      }
    }

    StorageService.logExtensionAction({
      extensionId: nameOrId,
      extensionName: name,
      action: 'configured',
      operatorUid: currentUser?.uid || '',
      operatorUsername: currentUser?.displayName || currentUser?.username || 'Burocrata',
      operatorRole: currentUser?.role || 'admin',
      details: `Configurações atualizadas pelo burocrata: ${Object.keys(newSettings).join(', ')}.`,
    });

    this.notifyListeners();
    return {
      success: true,
      message: `Configurações da extensão '${name}' atualizadas com sucesso!`,
    };
  }

  /**
   * ADIÇÃO / INSTALAÇÃO DE NOVA EXTENSÃO
   * Regra: Apenas burocratas podem adicionar extensões.
   */
  public addExtension(
    data: Partial<InstalledExtensionMeta>,
    currentUser: UserProfile | null
  ): { success: boolean; message: string; extension?: InstalledExtensionMeta } {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Acesso negado: Apenas burocratas do Conselho possuem permissão para adicionar novas extensões à Wiki.',
      };
    }

    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'O nome da extensão é obrigatório.' };
    }

    const cleanName = data.name.trim().replace(/\s+/g, '');
    if (this.registeredExtensions.has(cleanName)) {
      return { success: false, message: `Já existe uma extensão instalada com o nome '${cleanName}'.` };
    }

    const now = new Date().toISOString();
    const id = data.id || `custom-ext-${Date.now()}`;
    const operatorName = currentUser?.displayName || currentUser?.username || currentUser?.email || 'Burocrata';

    const newMeta: InstalledExtensionMeta = {
      id,
      name: cleanName,
      version: data.version?.trim() || '1.0.0',
      description: data.description?.trim() || 'Extensão instalada por deliberação do burocrata.',
      author: data.author?.trim() || operatorName,
      category: data.category || 'utility',
      enabled: data.enabled !== false,
      isCore: false,
      installedAt: now,
      installedBy: operatorName,
      website: data.website?.trim() || undefined,
      hooks: data.hooks && data.hooks.length > 0 ? data.hooks : ['render:wikitext'],
      customScript: data.customScript,
      customCss: data.customCss,
      customTags: data.customTags,
      toolConfig: data.toolConfig,
      themeConfig: data.themeConfig,
      editorPluginConfig: data.editorPluginConfig,
      bannerConfig: data.bannerConfig,
      filterRules: data.filterRules,
      dependencies: data.dependencies,
      settingsSchema: data.settingsSchema,
      settings: data.settings || {},
      permissions: data.permissions || ['render_hook'],
      tags: data.tags,
    };

    if (newMeta.settings && Object.keys(newMeta.settings).length > 0) {
      this.extensionSettings[cleanName] = newMeta.settings;
      this.persistSettings();
    }

    this.customExtensions.push(newMeta);
    this.persistCustomExtensions();

    // Monta dinamicamente a extensão recém cadastrada
    this.mountCustomExtensions();

    StorageService.logExtensionAction({
      extensionId: id,
      extensionName: cleanName,
      action: 'added',
      operatorUid: currentUser?.uid || '',
      operatorUsername: operatorName,
      operatorRole: currentUser?.role || 'admin',
      details: `Nova extensão "${cleanName}" v${newMeta.version} (${newMeta.category}) adicionada e instalada pelo burocrata.`,
    });

    // 304.4: Sincroniza imediatamente a nova extensão com o Firebase Firestore
    FirebaseExtensionSyncService.getInstance()
      .saveExtensionToCloud(newMeta, currentUser)
      .catch((err) => console.warn('[ExtensionManager] Falha ao salvar nova extensão no Firebase:', err));
    FirebaseExtensionSyncService.getInstance()
      .syncStatesToCloud(this.extensionStates, currentUser)
      .catch((err) => console.warn('[ExtensionManager] Falha ao sincronizar estados após adicionar:', err));

    this.notifyListeners();

    return {
      success: true,
      message: `Extensão '${cleanName}' instalada com sucesso na Wiki!`,
      extension: newMeta,
    };
  }

  /**
   * REMOÇÃO DE EXTENSÃO
   * Regra: Apenas burocratas podem remover extensões.
   */
  public removeExtension(
    nameOrId: string,
    currentUser: UserProfile | null
  ): { success: boolean; message: string } {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Acesso negado: Apenas burocratas do Conselho possuem permissão para remover extensões.',
      };
    }

    const ext = this.findExtension(nameOrId);
    if (!ext) {
      return { success: false, message: `Extensão '${nameOrId}' não localizada.` };
    }

    const name = ext.getName();
    const isCore = typeof ext.isCore === 'function' ? ext.isCore() : false;

    if (isCore) {
      return {
        success: false,
        message: `A extensão '${name}' é um componente nativo essencial (Core) da Wiki e não pode ser desinstalada. Para neutralizá-la, utilize a opção "Desativar".`,
      };
    }

    try {
      this.removeExtensionCss(name);
      if (typeof ext.onUnregister === 'function') {
        ext.onUnregister(this.hookRegistry);
      }
      this.hookRegistry.removeAllHooksForExtension(name);
      this.loadedExtensions.delete(name);
      delete this.extensionStates[name];
      delete this.extensionSettings[name];
      this.registeredExtensions.delete(name);
      this.persistStates();
      this.persistSettings();

      // Remove do armazenamento de customizadas
      this.customExtensions = this.customExtensions.filter(
        (c) => c.name !== name && c.id !== nameOrId
      );
      this.persistCustomExtensions();

      // Log de auditoria
      const operatorName = currentUser?.displayName || currentUser?.username || currentUser?.email || 'Burocrata';
      StorageService.logExtensionAction({
        extensionId: nameOrId,
        extensionName: name,
        action: 'removed',
        operatorUid: currentUser?.uid || '',
        operatorUsername: operatorName,
        operatorRole: currentUser?.role || 'admin',
        details: `Extensão "${name}" desinstalada e removida permanentemente do sistema pelo burocrata.`,
      });

      // 304.3.1: Remove da nuvem Firebase se o burocrata desinstalou a extensão
      FirebaseExtensionSyncService.getInstance()
        .deleteExtensionFromCloud(name, currentUser)
        .catch((err) => console.warn('[ExtensionManager] Falha ao remover extensão no Firebase:', err));
      FirebaseExtensionSyncService.getInstance()
        .syncStatesToCloud(this.extensionStates, currentUser)
        .catch((err) => console.warn('[ExtensionManager] Falha ao sincronizar estados após remover:', err));

      this.notifyListeners();

      return {
        success: true,
        message: `Extensão '${name}' removida com sucesso pelo burocrata.`,
      };
    } catch (err: any) {
      console.error(`[ExtensionManager] Erro ao remover extensão '${name}':`, err);
      return {
        success: false,
        message: `Falha ao remover extensão: ${err?.message || 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Exporta um pacote JSON completo de backup contendo todas as extensões e suas configurações.
   */
  public exportAllExtensionsPackage(): string {
    const installed = this.getAllInstalledExtensions();
    const packagePayload = {
      wikiZeroPackageVersion: '2.0.0',
      exportedAt: new Date().toISOString(),
      system: 'WikiWorldWeb / WikiZero Ecosystem',
      extensionsCount: installed.length,
      extensions: installed,
      states: this.extensionStates,
      settings: this.extensionSettings,
    };
    return JSON.stringify(packagePayload, null, 2);
  }

  /**
   * Importa e restaura um pacote ou lista de extensões JSON com validação de segurança de burocrata.
   */
  public importExtensionsPackage(
    jsonString: string,
    currentUser: UserProfile | null
  ): { success: boolean; message: string; importedCount?: number } {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Acesso negado: Apenas burocratas podem importar pacotes de extensões.',
      };
    }

    try {
      const parsed = JSON.parse(jsonString);
      const listToImport: Partial<InstalledExtensionMeta>[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.extensions)
        ? parsed.extensions
        : parsed.name
        ? [parsed]
        : [];

      if (listToImport.length === 0) {
        return { success: false, message: 'O arquivo JSON não contém nenhuma extensão válida para importação.' };
      }

      let count = 0;
      for (const item of listToImport) {
        if (!item.name) continue;
        const clean = item.name.trim().replace(/\s+/g, '');
        // Se já existe, atualiza metadados e scripts
        const existingIdx = this.customExtensions.findIndex((c) => c.name === clean);
        if (existingIdx >= 0) {
          this.customExtensions[existingIdx] = {
            ...this.customExtensions[existingIdx],
            ...item,
            name: clean,
            lastModifiedAt: new Date().toISOString(),
            lastModifiedBy: currentUser?.displayName || currentUser?.username || 'Burocrata',
          };
          count++;
        } else if (!this.registeredExtensions.has(clean)) {
          this.addExtension(item, currentUser);
          count++;
        }
      }

      this.persistCustomExtensions();
      this.mountCustomExtensions();
      this.notifyListeners();

      return {
        success: true,
        message: `${count} extensão(ões) importada(s) ou atualizada(s) com sucesso pelo burocrata.`,
        importedCount: count,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Falha ao importar pacote: ${e?.message || 'JSON inválido'}`,
      };
    }
  }

  /**
   * Retorna todas as ferramentas interativas registradas por extensões ativas.
   */
  public getActiveTools(): CustomToolConfig[] {
    const tools: CustomToolConfig[] = [];
    for (const [name, ext] of this.loadedExtensions.entries()) {
      if (typeof ext.getToolConfig === 'function') {
        const tc = ext.getToolConfig();
        if (tc && tc.toolId && !tools.some((t) => t.toolId === tc.toolId)) {
          tools.push(tc);
        }
      }
    }
    for (const c of this.customExtensions) {
      if (this.loadedExtensions.has(c.name) && c.toolConfig && c.toolConfig.toolId) {
        if (!tools.some((t) => t.toolId === c.toolConfig!.toolId)) {
          tools.push(c.toolConfig);
        }
      }
    }
    return tools;
  }

  /**
   * Retorna todos os temas visuais registrados por extensões ativas.
   */
  public getActiveThemes(): CustomThemeConfig[] {
    const themes: CustomThemeConfig[] = [];
    for (const [name, ext] of this.loadedExtensions.entries()) {
      if (typeof ext.getThemeConfig === 'function') {
        const tc = ext.getThemeConfig();
        if (tc && tc.themeId && !themes.some((t) => t.themeId === tc.themeId)) {
          themes.push(tc);
        }
      }
    }
    for (const c of this.customExtensions) {
      if (this.loadedExtensions.has(c.name) && c.themeConfig && c.themeConfig.themeId) {
        if (!themes.some((t) => t.themeId === c.themeConfig!.themeId)) {
          themes.push(c.themeConfig);
        }
      }
    }
    return themes;
  }

  /**
   * Retorna plugins de botões da barra de ferramentas do editor wikitext ativos.
   */
  public getActiveEditorPlugins(): CustomEditorPluginConfig[] {
    const plugins: CustomEditorPluginConfig[] = [];
    for (const [name, ext] of this.loadedExtensions.entries()) {
      if (typeof ext.getEditorPluginConfig === 'function') {
        const ep = ext.getEditorPluginConfig();
        if (ep && ep.buttonId && !plugins.some((p) => p.buttonId === ep.buttonId)) {
          plugins.push(ep);
        }
      }
    }
    for (const c of this.customExtensions) {
      if (this.loadedExtensions.has(c.name) && c.editorPluginConfig && c.editorPluginConfig.buttonId) {
        if (!plugins.some((p) => p.buttonId === c.editorPluginConfig!.buttonId)) {
          plugins.push(c.editorPluginConfig);
        }
      }
    }
    return plugins;
  }

  /**
   * Retorna avisos ou banners ativos configurados por extensões.
   */
  public getActiveBanners(): CustomArticleBannerConfig[] {
    const banners: CustomArticleBannerConfig[] = [];
    for (const [name, ext] of this.loadedExtensions.entries()) {
      if (typeof ext.getBannerConfig === 'function') {
        const bn = ext.getBannerConfig();
        if (bn && bn.title && !banners.some((b) => b.bannerId === bn.bannerId)) {
          banners.push(bn);
        }
      }
    }
    for (const c of this.customExtensions) {
      if (this.loadedExtensions.has(c.name) && c.bannerConfig && c.bannerConfig.title) {
        if (!banners.some((b) => b.bannerId === c.bannerConfig!.bannerId)) {
          banners.push(c.bannerConfig);
        }
      }
    }
    return banners;
  }

  /**
   * Valida dependências de uma extensão instalada.
   */
  public checkDependencies(nameOrId: string): { satisfied: boolean; missing: string[] } {
    const meta = this.getAllInstalledExtensions().find(
      (e) => e.name.toLowerCase() === nameOrId.toLowerCase() || e.id === nameOrId
    );
    if (!meta || !meta.dependencies || meta.dependencies.length === 0) {
      return { satisfied: true, missing: [] };
    }
    const missing: string[] = [];
    for (const dep of meta.dependencies) {
      if (!this.loadedExtensions.has(dep)) {
        missing.push(dep);
      }
    }
    return { satisfied: missing.length === 0, missing };
  }

  /**
   * Valida um manifesto de extensão contra o esquema oficial.
   */
  public validateExtensionManifest(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Manifesto inválido: JSON deve ser um objeto.'] };
    }
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Campo obrigatório ausente: "name" (deve ser string não vazia).');
    }
    if (data.version && typeof data.version !== 'string') {
      errors.push('Formato inválido: "version" deve ser uma string semver (ex: "1.0.0").');
    }
    if (data.category && typeof data.category !== 'string') {
      errors.push('Formato inválido: "category" deve ser uma string de categoria válida.');
    }
    if (data.customTags && !Array.isArray(data.customTags)) {
      errors.push('Formato inválido: "customTags" deve ser uma lista (array).');
    }
    if (data.dependencies && !Array.isArray(data.dependencies)) {
      errors.push('Formato inválido: "dependencies" deve ser uma lista (array).');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Executa um teste em sandbox de um script de extensão com entrada de exemplo.
   * Suporta validação de transformações de wikitexto, ferramentas e temas.
   */
  public executeSandboxTest(
    script: string,
    sampleInput: string = '= Exemplo de Artigo =\nTexto de teste enciclopédico com [[links]] e citações.'
  ): {
    success: boolean;
    output: string;
    logs: string[];
    registeredHooks: { type: string; name: string }[];
    error?: string;
  } {
    try {
      const testHooks = new HookRegistry();
      const logs: string[] = [];
      const registered: { type: string; name: string }[] = [];

      const mockUtils = {
        injectCss: (css: string) => logs.push(`[CSS Injetado]: ${css.slice(0, 50)}...`),
        removeCss: () => logs.push('[CSS Removido]'),
        log: (msg: string) => logs.push(`[Log]: ${msg}`),
        warn: (msg: string) => logs.push(`[Aviso]: ${msg}`),
        getSetting: (_key: string, defVal: any) => defVal,
        addTag: (tagName: string, formatter: (c: string, attrs?: string) => string, hasClosing: boolean = true) => {
          registered.push({ type: 'tag', name: `<${tagName}>` });
          testHooks.addFilter<string>('render:wikitext', (t: string) => {
            if (hasClosing) {
              const rx = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
              return t.replace(rx, (_m, attrs, body) => formatter(body, attrs));
            } else {
              const rx = new RegExp(`<${tagName}\\b([^>]*)\\/?>`, 'gi');
              return t.replace(rx, (_m, attrs) => formatter('', attrs));
            }
          });
        },
        addTool: (tool: CustomToolConfig) => {
          registered.push({ type: 'tool', name: tool.title || tool.toolId });
          logs.push(`[Ferramenta]: ${tool.title || tool.toolId} registrada.`);
        },
        addTheme: (theme: CustomThemeConfig) => {
          registered.push({ type: 'theme', name: theme.displayName || theme.themeId });
          logs.push(`[Tema]: ${theme.displayName || theme.themeId} registrado.`);
        },
        addEditorButton: (btn: CustomEditorPluginConfig) => {
          registered.push({ type: 'editor_button', name: btn.label || btn.buttonId });
          logs.push(`[Botão do Editor]: ${btn.label} registrado.`);
        },
        addArticleBanner: (banner: CustomArticleBannerConfig) => {
          registered.push({ type: 'banner', name: banner.title });
          logs.push(`[Aviso de Artigo]: ${banner.title} registrado.`);
        },
        addContentFilter: (pattern: string, replacement: string, isRegex?: boolean) => {
          registered.push({ type: 'filter', name: pattern });
          testHooks.addFilter<string>('render:wikitext', (txt: string) => {
            if (!txt) return txt;
            return isRegex
              ? txt.replace(new RegExp(pattern, 'gi'), replacement)
              : txt.split(pattern).join(replacement);
          });
        },
      };

      const runner = new Function('hooks', 'extensionName', 'settings', 'utils', script);
      runner(testHooks, 'SandboxExtension', {}, mockUtils);

      // Audita hooks registrados
      const detailed = testHooks.getAllHooksDetailed();
      for (const h of detailed) {
        registered.push({ type: h.type, name: h.hookName });
      }

      // Testa aplicação do filtro
      let result = sampleInput;
      if (testHooks.hasFilter('render:wikitext')) {
        result = testHooks.applyFilters<string>('render:wikitext', sampleInput);
      }
      if (testHooks.hasFilter('render:html')) {
        result = testHooks.applyFilters<string>('render:html', result);
      }

      return {
        success: true,
        output: result,
        logs,
        registeredHooks: registered,
      };
    } catch (err: any) {
      return {
        success: false,
        output: '',
        logs: [],
        registeredHooks: [],
        error: err?.message || 'Erro de execução do script.',
      };
    }
  }

  /**
   * Localiza uma extensão pelo nome ou ID.
   */
  private findExtension(nameOrId: string): WikiExtension | undefined {
    if (this.registeredExtensions.has(nameOrId)) {
      return this.registeredExtensions.get(nameOrId);
    }

    for (const [name, ext] of this.registeredExtensions.entries()) {
      if (name.toLowerCase() === nameOrId.toLowerCase()) {
        return ext;
      }
    }

    const customMatch = this.customExtensions.find(
      (c) => c.id === nameOrId || c.name.toLowerCase() === nameOrId.toLowerCase()
    );
    if (customMatch && this.registeredExtensions.has(customMatch.name)) {
      return this.registeredExtensions.get(customMatch.name);
    }

    return undefined;
  }

  /**
   * 304.4 (segundo item): Sincroniza em lote TODAS as extensões locais e customizadas para o Firebase Firestore.
   */
  public async syncAllToCloud(
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; totalSynced: number; message: string }> {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        totalSynced: 0,
        message: 'Apenas burocratas possuem autorização para sincronizar todas as extensões na nuvem.',
      };
    }
    const all = this.getAllInstalledExtensions();
    const res = await FirebaseExtensionSyncService.getInstance().syncAllExtensionsToCloud(
      all,
      this.extensionStates,
      currentUser
    );
    if (res.success) {
      this.lastCloudSyncAt = new Date().toISOString();
      this.notifyListeners();
    }
    return res;
  }

  /**
   * 304.3.1: Identifica colisões e divergências entre extensões do código local e o banco de dados Firebase.
   */
  public getCloudConflicts(): ExtensionConflict[] {
    return FirebaseExtensionSyncService.getInstance().detectConflicts(
      this.getAllInstalledExtensions(),
      this.cloudExtensions
    );
  }

  /**
   * 304.3.1: Permite exclusivamente ao burocrata resolver colisões ou confirmar em manter entre sincronia e nuvem das extensões.
   */
  public async resolveConflict(
    conflict: ExtensionConflict,
    resolution: 'keep_cloud' | 'overwrite_cloud_with_local' | 'delete_from_cloud' | 'sync_new_local',
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    if (!isUserBureaucrat(currentUser)) {
      return { success: false, message: 'Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões.' };
    }

    try {
      if (resolution === 'delete_from_cloud') {
        const res = await FirebaseExtensionSyncService.getInstance().deleteExtensionFromCloud(
          conflict.cloudMeta?.name || conflict.extensionName,
          currentUser
        );
        this.cloudExtensions = this.cloudExtensions.filter((c) => c.name !== conflict.extensionName);
        this.notifyListeners();
        return res;
      }

      if (resolution === 'overwrite_cloud_with_local' || resolution === 'sync_new_local') {
        const localExt = this.getAllInstalledExtensions().find((e) => e.name === conflict.extensionName);
        if (localExt) {
          const res = await FirebaseExtensionSyncService.getInstance().saveExtensionToCloud(
            localExt,
            currentUser
          );
          await FirebaseExtensionSyncService.getInstance().syncStatesToCloud(this.extensionStates, currentUser);
          this.notifyListeners();
          return res;
        }
      }

      if (resolution === 'keep_cloud') {
        if (conflict.cloudMeta) {
          const idx = this.customExtensions.findIndex((c) => c.name === conflict.cloudMeta!.name);
          if (idx >= 0) {
            this.customExtensions[idx] = conflict.cloudMeta;
          } else {
            this.customExtensions.push(conflict.cloudMeta);
          }
          this.persistCustomExtensions();
          this.mountCustomExtensions();
          this.notifyListeners();
          return {
            success: true,
            message: `Versão da nuvem de '${conflict.extensionName}' mantida e sincronizada localmente com sucesso pelo burocrata.`,
          };
        }
      }

      return { success: false, message: 'Resolução não executada.' };
    } catch (err: any) {
      return { success: false, message: `Erro ao resolver conflito: ${err?.message || 'Falha desconhecida'}` };
    }
  }

  /**
   * Confirma explicitamente a manutenção da sincronização entre o estado local e a nuvem Firebase das extensões.
   * Regra estrita de Governança: Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões.
   */
  public async confirmKeepSyncBetweenLocalAndCloud(
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; message: string; activeCount?: number; totalCount?: number }> {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Somente o burocrata pode confirmar em manter entre sincronia e nuvem das extensões.',
      };
    }

    try {
      const syncService = FirebaseExtensionSyncService.getInstance();
      const res = await syncService.syncStatesToCloud(this.extensionStates, currentUser);
      this.lastCloudSyncAt = new Date().toISOString();
      this.notifyListeners();
      return {
        success: res.success,
        message: res.success
          ? 'Sincronia e nuvem de extensões confirmadas e mantidas com sucesso pelo burocrata!'
          : res.message,
        activeCount: Object.values(this.extensionStates).filter(Boolean).length,
        totalCount: Object.keys(this.extensionStates).length,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Falha ao manter sincronia e nuvem: ${err?.message || 'Erro inesperado'}`,
      };
    }
  }

  /**
   * 304.4: Processa o upload de um arquivo de extensão válido (index.js, index.ts ou .json)
   * e adiciona à nuvem Firebase e ao catálogo do sistema.
   */
  public async uploadExtensionFile(
    fileContent: string,
    fileName: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; message: string; meta?: InstalledExtensionMeta }> {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Acesso negado: Apenas burocratas do Conselho podem fazer upload de novas extensões.',
      };
    }

    // Requisito 3.05.9.b: Dispositivo para verificação de informações maliciosas dentro dos arquivos das extensões
    const scanReport = await extensionMalwareScannerDevice.scanFileContent(fileContent, fileName);
    if (!scanReport.isSafe && (scanReport.severity === 'critical' || scanReport.severity === 'high')) {
      const topThreat = scanReport.threatsFound[0];
      const extName = fileName.replace(/\.[^/.]+$/, '');

      // Requisito 3.05.9.a: Isola no dispositivo de segurança de sincronia
      await extensionSyncSecurityDevice.quarantineExtension(
        extName,
        `Dispositivo contra Malware (3.05.9.b): ${scanReport.threatsFound.length} ameaça(s) identificada(s) no arquivo '${fileName}'. [${topThreat.severity.toUpperCase()}]: ${topThreat.title} (linha ${topThreat.lineNumber || '?'}).`,
        scanReport.severity === 'critical' ? 'critical' : 'high',
        'file_upload',
        fileContent,
        currentUser
      );

      return {
        success: false,
        message: `Upload bloqueado pelo Dispositivo de Verificação de Malware (3.05.9.b): Foram identificadas ${scanReport.threatsFound.length} ameaça(s) no arquivo '${fileName}'. A extensão foi isolada em quarentena preventiva.`,
      };
    }

    const parseRes = FirebaseExtensionSyncService.getInstance().parseUploadedExtensionFile(
      fileContent,
      fileName
    );

    if (!parseRes.success || !parseRes.meta) {
      return {
        success: false,
        message: parseRes.error || 'O arquivo enviado não contém uma extensão válida.',
      };
    }

    const addRes = this.addExtension(parseRes.meta as any, currentUser);
    return {
      success: addRes.success,
      message: addRes.message,
      meta: addRes.extension,
    };
  }

  /**
   * Retorna os ganchos ativos para auditoria.
   */
  public getHooksAudit(): {
    type: 'filter' | 'action';
    hookName: string;
    extensionName: string;
    priority: number;
  }[] {
    return this.hookRegistry.getAllHooksDetailed();
  }

  /**
   * Retorna se a extensão está ativa.
   */
  public isExtensionLoaded(name: string): boolean {
    return this.loadedExtensions.has(name);
  }

  /**
   * 3.05: Retorna se a extensão está ativa (pelo nome, classe ou ID).
   */
  public isExtensionEnabled(nameOrId: string): boolean {
    const ext = this.findExtension(nameOrId);
    const name = ext ? ext.getName() : nameOrId;
    return this.loadedExtensions.has(name);
  }

  /**
   * 3.05: Retorna as configurações ativas de uma extensão.
   */
  public getExtensionSettings(nameOrId: string): Record<string, any> {
    const ext = this.findExtension(nameOrId);
    const name = ext ? ext.getName() : nameOrId;
    return this.extensionSettings[name] || {};
  }

  public getLoadedExtensions(): WikiExtension[] {
    return Array.from(this.loadedExtensions.values());
  }

  public getExtension(name: string): WikiExtension | undefined {
    return this.findExtension(name);
  }

  /**
   * 304.6: Retorna todas as camadas de segurança (ativas ou inativas)
   */
  public getSecurityLayers(): { meta: InstalledExtensionMeta; isLoaded: boolean }[] {
    const all = this.getAllInstalledExtensions();
    return all
      .filter((e) => e.category === 'security')
      .map((meta) => ({
        meta,
        isLoaded: this.loadedExtensions.has(meta.name),
      }));
  }

  /**
   * 304.5: Retorna o status de integridade da Porta de Entrada de Segurança da Wiki
   */
  public getSecurityGateStatus(): {
    isUnlocked: boolean;
    syncStatus: SyncStateStatus;
    lastSyncedAt: string | null;
    securityHash: string;
    activeCount: number;
    totalCount: number;
  } {
    const activeCount = Object.values(this.extensionStates).filter(Boolean).length;
    const totalCount = Object.keys(this.extensionStates).length;

    const keys = Object.keys(this.extensionStates).sort();
    let str = '';
    for (const k of keys) {
      str += `${k}:${this.extensionStates[k]};`;
    }
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const securityHash = `sec304-${Math.abs(hash).toString(16)}`;

    const isUnlocked = this.syncStatus === 'connected';

    return {
      isUnlocked,
      syncStatus: this.syncStatus,
      lastSyncedAt: this.lastCloudSyncAt,
      securityHash,
      activeCount,
      totalCount,
    };
  }

  /**
   * 304.5: Força a reinicialização e teste de sincronia com o Firebase
   */
  public async forceRecheckSync(): Promise<{ success: boolean; status: SyncStateStatus }> {
    this.syncStatus = 'connecting';
    this.notifyListeners();
    this.initCloudSync();

    await new Promise((resolve) => setTimeout(resolve, 800));
    const current = this.syncStatus as SyncStateStatus;
    return {
      success: current === 'connected',
      status: current,
    };
  }

  /**
   * 3.05.3.o & 3.05.3.p: Retorna dados de marca personalizados (nomes, slogans, logo e favicon).
   */
  public getBranding(): {
    wikiName: string;
    systemName: string;
    tagline: string;
    customLogoUrl: string;
    customFaviconUrl: string;
  } {
    const wikiName = this.hookRegistry.applyFilters<string>('branding:wiki_name', 'WikiWorldWeb');
    const systemName = this.hookRegistry.applyFilters<string>('branding:system_name', 'WikiZero');
    const tagline = this.hookRegistry.applyFilters<string>('branding:tagline', 'A Enciclopédia Livre e Aberta');
    const customLogoUrl = this.hookRegistry.applyFilters<string>('branding:custom_logo_url', '');
    const customFaviconUrl = this.hookRegistry.applyFilters<string>('branding:custom_favicon_url', '');
    return { wikiName, systemName, tagline, customLogoUrl, customFaviconUrl };
  }

  /**
   * 3.05.3.l: Verifica se a personalização de aparência é permitida.
   * Se a extensão AppearanceLockExtension estiver desativada pelo burocrata,
   * força a aparência padrão do Wiki e bloqueia trocas de tema.
   */
  public isAppearanceCustomizationAllowed(): boolean {
    if (!this.isExtensionEnabled('AppearanceLockExtension')) {
      return false;
    }
    return this.hookRegistry.applyFilters<boolean>('appearance:customization_allowed', true);
  }

  /**
   * 3.09.a: Verifica se o chat em tempo real entre usuários está habilitado.
   * Se a extensão UserChatExtension estiver desativada pelo burocrata, retorna false.
   */
  public isUserChatEnabled(): boolean {
    if (!this.isExtensionEnabled('UserChatExtension')) {
      return false;
    }
    return this.hookRegistry.applyFilters<boolean>('chat:user_chat_enabled', true);
  }

  /**
   * 3.05.3.ad: Verifica se a Ajuda Geral da Wiki (F1) está habilitada na extensão.
   * Se a extensão GeneralHelpExtension estiver desativada pelo burocrata, retorna false.
   */
  public isGeneralHelpEnabled(): boolean {
    if (!this.isExtensionEnabled('GeneralHelpExtension')) {
      return false;
    }
    return this.hookRegistry.applyFilters<boolean>('help:general_help_enabled', true);
  }

  /**
   * 3.05.3.ad: Verifica se o acionamento pelo atalho de teclado F1 está autorizado.
   */
  public isF1ShortcutEnabled(): boolean {
    if (!this.isGeneralHelpEnabled()) {
      return false;
    }
    return this.hookRegistry.applyFilters<boolean>('help:f1_shortcut_enabled', true);
  }

  /**
   * Verifica se o botão de ajuda deve ser exibido no cabeçalho.
   */
  public isHelpShownInHeader(): boolean {
    if (!this.isGeneralHelpEnabled()) {
      return false;
    }
    return this.hookRegistry.applyFilters<boolean>('help:show_in_header', true);
  }

  /**
   * 3.05.3.af & 3.05.8.b: Verifica se o sistema de Checklist Diário e Pontuação Mensal está ativo.
   */
  public isDailyChecklistEnabled(): boolean {
    if (!this.isExtensionEnabled('DailyChecklistExtension')) {
      return false;
    }
    return this.hookRegistry.applyFilters<boolean>('checklist:is_enabled', true);
  }

  /**
   * Retorna os pontos configurados para cada tarefa do checklist diário.
   */
  public getDailyChecklistPoints(): { login: number; contribution: number; rating: number; donation: number } {
    return this.hookRegistry.applyFilters<{ login: number; contribution: number; rating: number; donation: number }>(
      'checklist:points_config',
      { login: 1.0, contribution: 0.20, rating: 1.0, donation: 10.0 }
    );
  }

  /**
   * 3.05.3.l.I: Verifica se um tema específico está ativo/habilitado como extensão.
   */
  public isThemeAvailable(themeId: string): boolean {
    if (!this.isAppearanceCustomizationAllowed()) {
      return themeId === 'light';
    }
    const themeExtMap: Record<string, string> = {
      win95: 'Win95ThemeExtension',
      win31: 'Win31ThemeExtension',
      winxp: 'WinXpThemeExtension',
      win7: 'Win7ThemeExtension',
      win10: 'Win10ThemeExtension',
      win1: 'Win1ThemeExtension',
      google: 'GoogleThemeExtension',
      'google-dark': 'GoogleThemeExtension',
      wikidiota: 'WikidiotaThemeExtension',
      genshin: 'GenshinThemeExtension',
      android15: 'Android15ThemeExtension',
      android23: 'Android23GingerbreadTheme',
      stardew: 'StardewValleyThemeExtension',
      repo: 'RepoTerminalThemeExtension',
      minecraft: 'MinecraftThemeExtension',
      roblox: 'RobloxThemeExtension',
      nokia3310: 'Nokia3310ThemeExtension',
      halflife: 'HalfLifeThemeExtension',
    };
    const extName = themeExtMap[themeId];
    if (extName) {
      return this.isExtensionEnabled(extName);
    }
    return this.hookRegistry.applyFilters<boolean>(`theme:${themeId}_available`, true);
  }

  /**
   * 3.05.3.m: Retorna as informações da página institucional "Outras regras".
   */
  public getOtherRulesData(): {
    enabled: boolean;
    title: string;
    subtitle: string;
    rules: any[];
    showInSidebar: boolean;
    allowExportPdf: boolean;
  } {
    const isEnabled = this.isExtensionEnabled('OtherRulesExtension');
    if (!isEnabled) {
      return {
        enabled: false,
        title: 'Outras Regras',
        subtitle: '',
        rules: [],
        showInSidebar: false,
        allowExportPdf: false,
      };
    }
    return this.hookRegistry.applyFilters('rules:get_rules_data', {
      enabled: true,
      title: 'Outras Regras e Diretrizes Institucionais',
      subtitle: 'Regulamento oficial estabelecido pelo Burocrata para a Wiki.',
      rules: [],
      showInSidebar: true,
      allowExportPdf: true,
    });
  }

  /**
   * 3.05.3.q: Salva configurações de uma extensão e atualiza ganchos e Firebase.
   */
  public async saveExtensionSettingsAsync(
    nameOrId: string,
    settings: Record<string, any>,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    const ext = this.findExtension(nameOrId);
    if (!ext) {
      return { success: false, message: `Extensão '${nameOrId}' não encontrada.` };
    }

    const name = ext.getName();
    this.extensionSettings[name] = {
      ...(this.extensionSettings[name] || {}),
      ...settings,
    };
    this.persistSettings();

    // Se for extensão personalizada, atualiza também seu registro
    const customIdx = this.customExtensions.findIndex((c) => c.name === name || c.id === nameOrId);
    if (customIdx >= 0) {
      this.customExtensions[customIdx].settings = this.extensionSettings[name];
      this.customExtensions[customIdx].lastModifiedAt = new Date().toISOString();
      this.customExtensions[customIdx].lastModifiedBy = currentUser?.displayName || currentUser?.username || 'Burocrata';
      this.persistCustomExtensions();
    }

    // Se a extensão estiver ativa, re-registra com as novas configurações
    if (this.loadedExtensions.has(name)) {
      try {
        this.hookRegistry.removeAllHooksForExtension(name);
        ext.onRegister(this.hookRegistry, { settings: this.extensionSettings[name], manager: this });
        if (typeof ext.getCustomCss === 'function') {
          const css = ext.getCustomCss();
          if (css) this.injectExtensionCss(name, css);
        }
      } catch (err) {
        console.warn(`[ExtensionManager] Erro ao recarregar '${name}' com novas configurações:`, err);
      }
    }

    this.notifyListeners();

    // Sincroniza com Firestore
    try {
      await FirebaseExtensionSyncService.getInstance().syncStatesToCloud(
        this.extensionStates,
        currentUser,
        this.extensionSettings
      );
      if (customIdx >= 0) {
        await FirebaseExtensionSyncService.getInstance().saveExtensionToCloud(this.customExtensions[customIdx], currentUser);
      }
    } catch (e) {
      console.warn('[ExtensionManager] Alerta na sincronização de configurações:', e);
    }

    return { success: true, message: `Configurações da extensão '${name}' salvas e sincronizadas com sucesso!` };
  }

  /**
   * 3.05.3.ag: Retorna se a extensão da variável GEMINI_API_KEY está ativa.
   */
  public isGeminiApiKeyEnabled(): boolean {
    return this.isExtensionEnabled('GeminiApiKeyExtension');
  }

  /**
   * 3.05.3.ag: Retorna as configurações ativas da extensão da variável GEMINI_API_KEY.
   */
  public getGeminiApiKeySettings(): Record<string, any> {
    return this.extensionSettings['GeminiApiKeyExtension'] || {};
  }

  /**
   * 4.1.1.8T.1 / 4.1.1.PN.1: Retorna se a extensão de Agente de Bots está ativa.
   */
  public isBotAgentEnabled(): boolean {
    return this.isExtensionEnabled('BotAgentExtension');
  }

  /**
   * 4.1.1.Y5.4: Retorna se a extensão do popup de notícia de primeiro acesso está ativa.
   */
  public isFirstVisitPopupEnabled(): boolean {
    return this.isExtensionEnabled('FirstVisitNewsPopupExtension');
  }

  /**
   * 4.1.1.Y5.4: Retorna as configurações do popup de notícia de primeiro acesso.
   */
  public getFirstVisitPopupSettings(): Record<string, any> {
    return this.extensionSettings['FirstVisitNewsPopupExtension'] || {};
  }

  /**
   * 4.1.1.RW.5: Retorna se a extensão do verificador de plágio está ativa.
   */
  public isPlagiarismCheckerEnabled(): boolean {
    return this.isExtensionEnabled('PlagiarismCheckerExtension');
  }

  /**
   * 4.1.1.RW.5: Retorna as configurações do verificador de plágio.
   */
  public getPlagiarismCheckerSettings(): Record<string, any> {
    return this.extensionSettings['PlagiarismCheckerExtension'] || {};
  }

  public static isPlagiarismCheckerEnabled(): boolean {
    return ExtensionManager.getInstance().isPlagiarismCheckerEnabled();
  }

  public static getPlagiarismCheckerSettings(): Record<string, any> {
    return ExtensionManager.getInstance().getPlagiarismCheckerSettings();
  }

  public static isFirstVisitPopupEnabled(): boolean {
    return ExtensionManager.getInstance().isFirstVisitPopupEnabled();
  }

  public static getFirstVisitPopupSettings(): Record<string, any> {
    return ExtensionManager.getInstance().getFirstVisitPopupSettings();
  }

  public static isBotAgentEnabled(): boolean {
    return ExtensionManager.getInstance().isBotAgentEnabled();
  }

  public static isGeminiApiKeyEnabled(): boolean {
    return ExtensionManager.getInstance().isGeminiApiKeyEnabled();
  }

  /**
   * 4.1.1.D6.6: Retorna se a extensão de verificação de status online está ativa.
   */
  public isOnlineStatusVerifierEnabled(): boolean {
    return this.isExtensionEnabled('OnlineStatusVerifierExtension');
  }

  /**
   * 4.1.1.D6.6: Retorna as configurações do verificador de status online.
   */
  public getOnlineStatusVerifierSettings(): Record<string, any> {
    return this.extensionSettings['OnlineStatusVerifierExtension'] || {};
  }

  /**
   * 4.1.1.1GZ.8: Ativa ou desativa a extensão de verificação de status online e sincroniza o NetworkStatusService.
   */
  public setOnlineStatusVerifierEnabled(enabled: boolean): boolean {
    const ext = this.findExtension('OnlineStatusVerifierExtension');
    this.extensionStates['OnlineStatusVerifierExtension'] = enabled;

    if (enabled) {
      if (ext && !this.loadedExtensions.has('OnlineStatusVerifierExtension')) {
        try {
          const settings = this.extensionSettings['OnlineStatusVerifierExtension'] || {};
          ext.onRegister(this.hookRegistry, { settings, manager: this });
          this.loadedExtensions.set('OnlineStatusVerifierExtension', ext);
        } catch (err) {
          console.error('[ExtensionManager] Erro ao ativar OnlineStatusVerifierExtension:', err);
        }
      }
      NetworkStatusService.setEnabled(true);
    } else {
      if (ext && this.loadedExtensions.has('OnlineStatusVerifierExtension')) {
        try {
          this.hookRegistry.removeAllHooksForExtension('OnlineStatusVerifierExtension');
          if (typeof ext.onUnregister === 'function') {
            ext.onUnregister(this.hookRegistry);
          }
          this.loadedExtensions.delete('OnlineStatusVerifierExtension');
        } catch (err) {
          console.error('[ExtensionManager] Erro ao desativar OnlineStatusVerifierExtension:', err);
        }
      }
      NetworkStatusService.setEnabled(false);
    }

    this.persistStates();
    this.notifyListeners();
    return enabled;
  }

  public static isOnlineStatusVerifierEnabled(): boolean {
    return ExtensionManager.getInstance().isOnlineStatusVerifierEnabled();
  }

  public static setOnlineStatusVerifierEnabled(enabled: boolean): boolean {
    return ExtensionManager.getInstance().setOnlineStatusVerifierEnabled(enabled);
  }

  public static getOnlineStatusVerifierSettings(): Record<string, any> {
    return ExtensionManager.getInstance().getOnlineStatusVerifierSettings();
  }

  /**
   * Retorna se a extensão OnlineStatusExtension está ativa.
   */
  public isOnlineStatusExtensionEnabled(): boolean {
    return this.isExtensionEnabled('OnlineStatusExtension');
  }

  /**
   * Retorna a instância carregada de OnlineStatusExtension se ativa.
   */
  public getOnlineStatusExtension(): OnlineStatusExtension | undefined {
    return this.loadedExtensions.get('OnlineStatusExtension') as OnlineStatusExtension | undefined;
  }

  /**
   * Retorna as configurações da extensão OnlineStatusExtension.
   */
  public getOnlineStatusExtensionSettings(): Record<string, any> {
    return this.extensionSettings['OnlineStatusExtension'] || {};
  }

  /**
   * Ativa ou desativa a extensão OnlineStatusExtension e sincroniza o seu ciclo de vida.
   */
  public setOnlineStatusExtensionEnabled(enabled: boolean): boolean {
    const ext = this.findExtension('OnlineStatusExtension');
    this.extensionStates['OnlineStatusExtension'] = enabled;

    if (enabled) {
      if (ext && !this.loadedExtensions.has('OnlineStatusExtension')) {
        try {
          const settings = this.extensionSettings['OnlineStatusExtension'] || {};
          ext.onRegister(this.hookRegistry, { settings, manager: this });
          this.loadedExtensions.set('OnlineStatusExtension', ext);
        } catch (err) {
          console.error('[ExtensionManager] Erro ao ativar OnlineStatusExtension:', err);
        }
      }
    } else {
      if (ext && this.loadedExtensions.has('OnlineStatusExtension')) {
        try {
          this.hookRegistry.removeAllHooksForExtension('OnlineStatusExtension');
          if (typeof ext.onUnregister === 'function') {
            ext.onUnregister(this.hookRegistry);
          }
          this.loadedExtensions.delete('OnlineStatusExtension');
        } catch (err) {
          console.error('[ExtensionManager] Erro ao desativar OnlineStatusExtension:', err);
        }
      }
    }

    this.persistStates();
    this.notifyListeners();
    return enabled;
  }

  public static isOnlineStatusExtensionEnabled(): boolean {
    return ExtensionManager.getInstance().isOnlineStatusExtensionEnabled();
  }

  public static getOnlineStatusExtension(): OnlineStatusExtension | undefined {
    return ExtensionManager.getInstance().getOnlineStatusExtension();
  }

  public static setOnlineStatusExtensionEnabled(enabled: boolean): boolean {
    return ExtensionManager.getInstance().setOnlineStatusExtensionEnabled(enabled);
  }

  public static getOnlineStatusExtensionSettings(): Record<string, any> {
    return ExtensionManager.getInstance().getOnlineStatusExtensionSettings();
  }

  // === COMPATIBILITY LAYER (Existing src/wiki/components callers) ===

  public getActiveCustomTools(): CustomToolConfig[] {
    return this.getActiveTools();
  }

  public saveExtensionSettings(
    extensionName: string,
    settings: Record<string, any>,
    currentUser?: UserProfile | null
  ): { success: boolean; message: string } {
    const res = this.updateExtensionSettings(extensionName, settings, currentUser || null);
    if (res.success) {
      FirebaseExtensionSyncService.getInstance()
        .syncStatesToCloud(this.extensionStates, currentUser || null, this.extensionSettings)
        .catch(() => {});
    }
    return res;
  }

  public exportAllExtensionsManifest(): string {
    return this.exportAllExtensionsPackage();
  }

  public importExtensionsManifest(
    jsonStr: string,
    currentUser: UserProfile | null
  ): { success: boolean; message: string; count?: number } {
    const res = this.importExtensionsPackage(jsonStr, currentUser);
    return {
      success: res.success,
      message: res.message,
      count: res.importedCount,
    };
  }

  public getRegisteredEditorButtons(): EditorButtonDefinition[] {
    const list: EditorButtonDefinition[] = [];
    const seen = new Set<string>();
    for (const [name, ext] of this.loadedExtensions.entries()) {
      if (typeof ext.getEditorButtons === "function") {
        try {
          for (const btn of ext.getEditorButtons() || []) {
            if (!seen.has(btn.id)) {
              seen.add(btn.id);
              list.push(btn);
            }
          }
        } catch (e) {
          console.error(`[ExtensionManager] Erro ao obter botões do editor de '${name}':`, e);
        }
      }
    }
    return this.hookRegistry.applyFilters<EditorButtonDefinition[]>("editor:toolbar_buttons", list);
  }

  public getRegisteredArticleActions(article?: any): ArticleActionDefinition[] {
    const list: ArticleActionDefinition[] = [];
    const seen = new Set<string>();
    for (const [name, ext] of this.loadedExtensions.entries()) {
      if (typeof ext.getArticleActions === "function") {
        try {
          for (const act of ext.getArticleActions() || []) {
            if (!seen.has(act.id)) {
              seen.add(act.id);
              list.push(act);
            }
          }
        } catch (e) {
          console.error(`[ExtensionManager] Erro ao obter ações de artigo de '${name}':`, e);
        }
      }
    }
    return this.hookRegistry.applyFilters<ArticleActionDefinition[]>("article:actions", list, article);
  }

  public getRegisteredArticleWidgets(article?: any): ArticleWidgetDefinition[] {
    const list: ArticleWidgetDefinition[] = [];
    const seen = new Set<string>();
    for (const [name, ext] of this.loadedExtensions.entries()) {
      if (typeof ext.getWidgets === "function") {
        try {
          for (const w of ext.getWidgets() || []) {
            if (!seen.has(w.id)) {
              seen.add(w.id);
              list.push(w);
            }
          }
        } catch (e) {
          console.error(`[ExtensionManager] Erro ao obter widgets de '${name}':`, e);
        }
      }
    }
    return this.hookRegistry.applyFilters<ArticleWidgetDefinition[]>("article:widgets", list, article);
  }

  public getRegisteredTools(): RegisteredToolMeta[] {
    const list: RegisteredToolMeta[] = [];
    const seen = new Set<string>();
    for (const [name, ext] of this.loadedExtensions.entries()) {
      const cat = ext.getCategory?.();
      const isTool = cat === "ferramenta" || cat === "tool";
      if (isTool && typeof ext.getComponent === "function") {
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
        if (!seen.has(id)) {
          seen.add(id);
          list.push({
            id,
            name,
            title: ext.getName(),
            subtitle: ext.getDescription?.() || "",
            category: "ferramenta",
            description: ext.getDescription?.() || "",
            component: ext.getComponent(),
          });
        }
      }
    }
    return this.hookRegistry.applyFilters<RegisteredToolMeta[]>("tools:registered", list);
  }

  public executeBeforeSave(articleData: {
    titulo: string;
    descricao: string;
    categoria?: string;
  }): { allow: boolean; reason?: string; modifiedData?: any } {
    const initial = { allow: true, reason: "", data: articleData };
    const result = this.hookRegistry.applyFilters("editor:before_save", initial, articleData);
    return {
      allow: result?.allow !== false,
      reason: result?.reason,
      modifiedData: result?.data || articleData,
    };
  }

  public testCustomScript(
    script: string,
    _extName: string = "TestExtension"
  ): {
    success: boolean;
    message: string;
    hooksRegistered?: { filters: string[]; actions: string[] };
  } {
    const res = this.executeSandboxTest(script, "");
    const filters = res.registeredHooks.filter((h) => h.type === "filter").map((h) => h.name);
    const actions = res.registeredHooks.filter((h) => h.type === "action").map((h) => h.name);
    return {
      success: res.success,
      message: res.success
        ? (res.logs.join("; ") || "Script validado com sucesso.")
        : (res.error || "Erro ao validar script."),
      hooksRegistered: { filters, actions },
    };
  }
}

export const extensionManager = ExtensionManager.getInstance();
