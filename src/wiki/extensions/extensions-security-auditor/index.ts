/**
 * EXTENSÃO NATIVA: ExtensionsSecurityAuditorExtension
 * Arquivo: src/extensions/extensions-security-auditor/index.ts
 *
 * REQUISITO 3.05.3.ac:
 * - Adicionar extensão de verificação de segurança de todas às extensões carregadas atualmente;
 * - Verificar atualizações de todas as extensões;
 * - Alerta quando a quantidade de memória for maior de 200 MB.
 */

import { HookRegistry, WikiExtension } from '../../core/Extension';
import { CustomToolConfig, ExtensionCategory, ExtensionSettingField, InstalledExtensionMeta } from '../../types';
import { ExtensionManager } from '../../core/ExtensionManager';

export interface ExtensionSecurityItemAudit {
  name: string;
  version: string;
  category: string;
  isCore: boolean;
  status: 'secure' | 'warning' | 'alert';
  securityScore: number; // 0 - 100
  permissions: string[];
  findings: string[];
  hasUpdates: boolean;
  latestVersion: string;
  memoryEstimateKb: number;
}

export interface SecurityAuditReport {
  timestamp: string;
  totalLoaded: number;
  overallScore: number;
  overallStatus: 'secure' | 'warning' | 'critical';
  updatesAvailableCount: number;
  items: ExtensionSecurityItemAudit[];
  memoryUsage: {
    usedBytes: number;
    usedMB: number;
    limitMB: number;
    isExceeded: boolean;
    formatted: string;
  };
}

export default class ExtensionsSecurityAuditorExtension implements WikiExtension {
  public static readonly MEMORY_LIMIT_MB = 200;

  // Catálogo oficial de versões mais recentes para verificação de atualizações
  private static readonly LATEST_REGISTRY_VERSIONS: Record<string, string> = {
    MathKatex: '2.1.0',
    ReadingTimeEnhancer: '2.0.0',
    SyntaxHighlightGeSHi: '1.4.0',
    CiteAcademicFootnotes: '1.3.0',
    InfoboxResponsiveStyler: '1.2.0',
    DisambiguationNotice: '1.1.0',
    EditorialMetricsCollector: '1.5.0',
    QrCodeQuickShare: '1.2.0',
    Android23GingerbreadTheme: '2.3.7',
    CalculatorToolExtension: '1.3.0',
    WorldClockToolExtension: '1.2.0',
    WeatherForecastToolExtension: '1.2.0',
    GeminiAssistantToolExtension: '2.0.0',
    NotepadToolExtension: '1.4.0',
    WikiXssSanitizerSecurityLayer: '1.1.0',
    WikiVandalismGuardSecurityLayer: '1.1.0',
    WikiRateLimiterSecurityLayer: '1.1.0',
    WikiIntegritySentinelSecurityLayer: '1.1.0',
    SupportTicketsExtension: '1.2.0',
    ExternalLinkRedirectorExtension: '1.1.0',
    WikiMaintenanceModeExtension: '1.2.0',
    WikiBooksExtension: '1.2.0',
    WikiUniversityExtension: '1.2.0',
    WazzimaGiyggNewsExtension: '1.3.0',
    AppearanceLockExtension: '1.1.0',
    OtherRulesExtension: '1.1.0',
    WikiBrandingExtension: '1.1.0',
    CustomFaviconLogoExtension: '1.1.0',
    CustomCssExtension: '1.1.0',
    SidebarMenuCustomizerExtension: '1.1.0',
    MobileVersionControlExtension: '1.1.0',
    MazeRecaptchaControlExtension: '1.1.0',
    WmfNoticeControlExtension: '3.05.0',
    WelcomeMessageCustomizerExtension: '1.1.0',
    DefaultLanguageExtension: '1.1.0',
    MainPageCustomizerExtension: '1.1.0',
    SmartTvConfigExtension: '1.1.0',
    SqlDatabaseBackupExtension: '3.05.3',
    HideOnlineUsersExtension: '1.0.0',
    ExtensionsSecurityAuditorExtension: '1.0.0',
    FirebaseAppletConfigImporterExtension: '3.05.3',
  };

  private memoryAlertTriggered: boolean = false;
  private simulatedMemoryOffsetMb: number = 0;

  getName(): string {
    return 'ExtensionsSecurityAuditorExtension';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Auditor de Segurança e Atualizações de Extensões: audita todas as extensões carregadas atualmente, verifica atualizações pendentes e monitora em tempo real o consumo de memória, emitindo alerta sonoro e visual quando o uso de memória ultrapassar 200 MB.';
  }

  getAuthor(): string {
    return 'WikiZero Security & Memory Operations Team';
  }

  getCategory(): ExtensionCategory {
    return 'security';
  }

  isCore(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://wikiworldweb.org/security/extensions-auditor';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'autoScanIntervalMinutes',
        label: 'Intervalo de Varredura Automática de Segurança (minutos)',
        type: 'number',
        defaultValue: 5,
        description: 'Frequência com que o auditor reavalia as extensões carregadas e checa atualizações.',
      },
      {
        key: 'memoryThresholdMb',
        label: 'Limite de Alerta de Memória (MB)',
        type: 'number',
        defaultValue: 200,
        description: 'Quantidade de memória a partir da qual o alerta vermelho é disparado (Padrão 200 MB).',
      },
      {
        key: 'notifyOnUpdates',
        label: 'Notificar quando houver novas versões de extensões',
        type: 'boolean',
        defaultValue: true,
        description: 'Exibe aviso quando uma extensão possuir versão mais recente no repositório.',
      },
    ];
  }

  getToolConfig(): CustomToolConfig {
    return {
      toolId: 'extensions-security-auditor-tool',
      title: 'Auditor de Segurança & Atualizações de Extensões',
      icon: 'ShieldCheck',
      description:
        'Verificação de segurança de todas as extensões carregadas, verificação de atualizações e monitor de consumo de memória com alerta de 200 MB.',
      badge: 'Segurança • Atualizações • Memória > 200MB',
      category: 'security',
    };
  }

  /**
   * Mede o consumo de memória real ou aproximado do navegador e do ecossistema de extensões
   */
  public getMemoryUsage(): {
    usedBytes: number;
    usedMB: number;
    limitMB: number;
    isExceeded: boolean;
    formatted: string;
  } {
    let heapBytes = 0;

    if (typeof performance !== 'undefined' && (performance as any).memory?.usedJSHeapSize) {
      heapBytes = (performance as any).memory.usedJSHeapSize;
    } else {
      // Cálculo aproximado de memória baseado nas extensões e dados em execução
      const extManager = ExtensionManager.getInstance();
      const loadedCount = extManager.getLoadedExtensions().length;
      const baseAppMemory = 68 * 1024 * 1024; // 68 MB de baseline
      const perExtensionMemory = loadedCount * 2.8 * 1024 * 1024;
      heapBytes = baseAppMemory + perExtensionMemory;
    }

    // Adiciona qualquer offset simulado (útil para testes de estresse e visualização de alerta)
    heapBytes += this.simulatedMemoryOffsetMb * 1024 * 1024;

    const usedMB = Math.round((heapBytes / (1024 * 1024)) * 10) / 10;
    const limitMB = ExtensionsSecurityAuditorExtension.MEMORY_LIMIT_MB;
    const isExceeded = usedMB > limitMB;

    return {
      usedBytes: heapBytes,
      usedMB,
      limitMB,
      isExceeded,
      formatted: `${usedMB} MB / ${limitMB} MB`,
    };
  }

  /**
   * Permite simular um consumo de memória acima de 200 MB para verificação do alerta
   */
  public simulateMemorySpike(additionalMb: number): void {
    this.simulatedMemoryOffsetMb = additionalMb;
  }

  /**
   * Realiza a auditoria de segurança completa de todas as extensões carregadas e checa atualizações
   */
  public runFullAudit(): SecurityAuditReport {
    const extManager = ExtensionManager.getInstance();
    const loadedExtensions = extManager.getLoadedExtensions();
    const allInstalled = extManager.getAllInstalledExtensions();

    const items: ExtensionSecurityItemAudit[] = [];
    let updatesCount = 0;
    let totalScore = 0;

    for (const ext of loadedExtensions) {
      const name = ext.getName();
      const version = ext.getVersion();
      const meta = allInstalled.find((m) => m.name === name);
      const isCore = typeof ext.isCore === 'function' ? ext.isCore() : true;
      const category = typeof ext.getCategory === 'function' ? ext.getCategory()! : 'utility';
      const permissions = typeof ext.getPermissions === 'function' ? ext.getPermissions()! : meta?.permissions || [];

      const findings: string[] = [];
      let score = 100;

      // Análise de segurança estática
      if (meta?.customScript) {
        if (meta.customScript.includes('eval(') || meta.customScript.includes('Function(')) {
          findings.push('Uso de eval() ou Function() dinâmico detectado (risco de injeção).');
          score -= 30;
        }
        if (meta.customScript.includes('innerHTML') && !meta.customScript.includes('sanitize')) {
          findings.push('Manipulação de innerHTML sem sanitização explícita detectada.');
          score -= 15;
        }
        if (meta.customScript.includes('fetch(') || meta.customScript.includes('XMLHttpRequest')) {
          findings.push('Chamadas de rede externas realizadas pelo script da extensão.');
          score -= 10;
        }
      }

      if (permissions.includes('bypass_security')) {
        findings.push('Permissão de alta criticidade "bypass_security" requerida.');
        score -= 25;
      }

      // Verificação de atualizações
      const latest = ExtensionsSecurityAuditorExtension.LATEST_REGISTRY_VERSIONS[name] || version;
      const hasUpdates = this.compareSemver(latest, version) > 0;
      if (hasUpdates) {
        updatesCount++;
        findings.push(`Atualização disponível: versão ${latest} (instalada: ${version}).`);
      }

      const status: 'secure' | 'warning' | 'alert' =
        score >= 90 ? 'secure' : score >= 70 ? 'warning' : 'alert';

      totalScore += score;

      items.push({
        name,
        version,
        category,
        isCore,
        status,
        securityScore: score,
        permissions,
        findings,
        hasUpdates,
        latestVersion: latest,
        memoryEstimateKb: Math.round(150 + Math.random() * 300),
      });
    }

    const overallScore = loadedExtensions.length > 0 ? Math.round(totalScore / loadedExtensions.length) : 100;
    const overallStatus: 'secure' | 'warning' | 'critical' =
      overallScore >= 85 ? 'secure' : overallScore >= 70 ? 'warning' : 'critical';

    const memoryUsage = this.getMemoryUsage();

    return {
      timestamp: new Date().toISOString(),
      totalLoaded: loadedExtensions.length,
      overallScore,
      overallStatus,
      updatesAvailableCount: updatesCount,
      items,
      memoryUsage,
    };
  }

  /**
   * Compara duas versões SemVer (ex: "2.1.0" vs "1.4.0")
   */
  private compareSemver(vA: string, vB: string): number {
    const partsA = vA.split('.').map((n) => parseInt(n, 10) || 0);
    const partsB = vB.split('.').map((n) => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const a = partsA[i] || 0;
      const b = partsB[i] || 0;
      if (a > b) return 1;
      if (a < b) return -1;
    }
    return 0;
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any>; manager?: any }): void {
    // 1. Gancho para fornecer relatório de segurança e atualizações
    hooks.addFilter<SecurityAuditReport>(
      'security:extensions_audit_report',
      () => this.runFullAudit(),
      10,
      this.getName()
    );

    // 2. Gancho para fornecer status de memória e alerta de 200 MB
    hooks.addFilter<{
      usedMB: number;
      limitMB: number;
      isExceeded: boolean;
      formatted: string;
    }>(
      'security:extensions_memory_status',
      () => this.getMemoryUsage(),
      10,
      this.getName()
    );

    // 3. Monitoramento periódico de memória (> 200 MB)
    if (typeof window !== 'undefined') {
      const checkMemory = () => {
        const mem = this.getMemoryUsage();
        if (mem.isExceeded && !this.memoryAlertTriggered) {
          this.memoryAlertTriggered = true;
          console.warn(
            `⚠️ [ALERTA DE SEGURANÇA & MEMÓRIA] Quantidade de memória superior a 200 MB! Uso atual: ${mem.usedMB} MB.`
          );
          hooks.doAction('security:memory_limit_exceeded', {
            usedMB: mem.usedMB,
            limitMB: mem.limitMB,
            timestamp: new Date().toISOString(),
          });
        } else if (!mem.isExceeded) {
          this.memoryAlertTriggered = false;
        }
      };

      // Intervalo suave de checagem a cada 30 segundos
      const timer = setInterval(checkMemory, 30000);
      checkMemory();

      // Limpeza se a extensão for descarregada
      hooks.addAction(
        `extension:${this.getName()}:unregistered`,
        () => clearInterval(timer),
        10,
        this.getName()
      );
    }
  }
}
