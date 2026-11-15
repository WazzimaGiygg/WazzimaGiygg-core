/**
 * @file src/core/extensions/OnlineStatusExtension.ts
 * @description Módulo de Extensão 'OnlineStatusExtension'
 * Implementa verificação periódica de conectividade utilizando 'fetch' diretamente no site do GitHub.
 * Permite ao usuário/administrador ativar ou desativar o recurso e configurar parâmetros
 * nas configurações administrativas de extensões da Wiki.
 */

import { HookRegistry, WikiExtension } from '../Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';

export interface GitHubPingResult {
  timestamp: number;
  latencyMs: number;
  status: 'online' | 'offline';
  statusCode?: number;
  error?: string;
  target: string;
}

export interface OnlineStatusExtensionState {
  isOnline: boolean;
  latencyMs: number | null;
  lastCheckedAt: number | null;
  statusCode: number | null;
  error: string | null;
  targetUrl: string;
  history: GitHubPingResult[];
}

export class OnlineStatusExtension implements WikiExtension {
  public static readonly EXTENSION_NAME = 'OnlineStatusExtension';
  public static readonly EXTENSION_VERSION = '4.1.1';
  private static instance: OnlineStatusExtension | null = null;

  public readonly id = 'online-status-extension';
  public readonly name = OnlineStatusExtension.EXTENSION_NAME;
  public readonly version = OnlineStatusExtension.EXTENSION_VERSION;

  private timerId: any = null;
  private hooksRegistry: HookRegistry | null = null;
  private listeners: Set<(state: OnlineStatusExtensionState) => void> = new Set();

  private currentSettings: Record<string, any> = {
    enabled: true,
    intervalSeconds: 20,
    targetUrl: 'https://api.github.com/repos/WazzimaGiygg/Wiki-alternative',
    timeoutMs: 4000,
    notifyOffline: true,
  };

  private state: OnlineStatusExtensionState = {
    isOnline: true,
    latencyMs: null,
    lastCheckedAt: null,
    statusCode: null,
    error: null,
    targetUrl: 'https://api.github.com/repos/WazzimaGiygg/Wiki-alternative',
    history: [],
  };

  public constructor() {
    OnlineStatusExtension.instance = this;
  }

  public static getInstance(): OnlineStatusExtension {
    if (!OnlineStatusExtension.instance) {
      OnlineStatusExtension.instance = new OnlineStatusExtension();
    }
    return OnlineStatusExtension.instance;
  }

  /**
   * Flag de status online em tempo real.
   */
  public get isOnline(): boolean {
    return this.state.isOnline;
  }

  /**
   * Flag indicando se a conexão com o GitHub está estável (online e com boa latência).
   */
  public get isStable(): boolean {
    return this.state.isOnline && (this.state.latencyMs === null || this.state.latencyMs <= 450);
  }

  /**
   * Avalia a qualidade da conexão com o GitHub.
   */
  public getConnectionQuality(): 'stable' | 'slow' | 'offline' {
    if (!this.state.isOnline) return 'offline';
    if (this.state.latencyMs !== null && this.state.latencyMs > 450) return 'slow';
    return 'stable';
  }

  /**
   * Assina atualizações em tempo real do estado de conectividade.
   */
  public subscribe(listener: (state: OnlineStatusExtensionState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(currentState);
      } catch (e) {
        console.warn('[OnlineStatusExtension] Erro em listener:', e);
      }
    });
  }

  public getName(): string {
    return OnlineStatusExtension.EXTENSION_NAME;
  }

  public getVersion(): string {
    return OnlineStatusExtension.EXTENSION_VERSION;
  }

  public getDescription(): string {
    return 'Verificação periódica de conectividade utilizando fetch no site do GitHub. Monitora a latência e a integridade da conexão à internet em tempo real, permitindo ativação, desativação e ajuste de frequência nas configurações administrativas.';
  }

  public getAuthor(): string {
    return 'WikiZero Core Team & Infraestrutura';
  }

  public getCategory(): ExtensionCategory {
    return 'utility';
  }

  public isCore(): boolean {
    return true;
  }

  public isSyncableWithCloud(): boolean {
    return true;
  }

  public getWebsite(): string {
    return 'https://github.com/WazzimaGiygg/Wiki-alternative';
  }

  /**
   * Esquema de campos configuráveis no painel administrativo de extensões.
   */
  public getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'enabled',
        label: 'Ativar Verificação de Conectividade com o GitHub',
        type: 'boolean',
        defaultValue: true,
        description: 'Habilita ou desabilita a rotina periódica de testes de conectividade via fetch no GitHub.',
      },
      {
        key: 'intervalSeconds',
        label: 'Intervalo de Sondagem (segundos)',
        type: 'number',
        defaultValue: 20,
        description: 'Frequência em segundos entre cada requisição fetch ao GitHub (mínimo: 5s).',
      },
      {
        key: 'targetUrl',
        label: 'URL Alvo no GitHub',
        type: 'string',
        defaultValue: 'https://api.github.com/repos/WazzimaGiygg/Wiki-alternative',
        description: 'URL consultada via fetch para verificar integridade da rota e medir tempo de resposta (RTT).',
      },
      {
        key: 'timeoutMs',
        label: 'Tempo Limite de Timeout (ms)',
        type: 'number',
        defaultValue: 4000,
        description: 'Tempo máximo de espera antes de considerar a requisição expirada.',
      },
      {
        key: 'notifyOffline',
        label: 'Notificar Mudança de Estado de Rede',
        type: 'boolean',
        defaultValue: true,
        description: 'Emite avisos no barramento de eventos quando houver desconexão ou restabelecimento.',
      },
    ];
  }

  /**
   * Ciclo de vida: Inicializa a extensão, aplica configurações e dispara o probe periódico se ativado.
   */
  public onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any>; manager?: any }): void {
    this.hooksRegistry = hooks;
    const settings = context?.settings || {};

    this.currentSettings = {
      ...this.currentSettings,
      ...settings,
    };

    if (this.currentSettings.targetUrl) {
      this.state.targetUrl = this.currentSettings.targetUrl;
    }

    // Registra filtros no barramento do WikiWorldWeb
    hooks.addFilter<boolean>(
      'network:is_online',
      (currentOnline) => {
        if (this.currentSettings.enabled === false) return currentOnline;
        return this.state.isOnline;
      },
      10,
      this.getName()
    );

    hooks.addFilter<OnlineStatusExtensionState>(
      'network:github_telemetry',
      () => this.getState(),
      10,
      this.getName()
    );

    hooks.addFilter<number | null>(
      'network:github_latency',
      (currentLatency) => {
        if (this.currentSettings.enabled === false) return currentLatency;
        return this.state.latencyMs;
      },
      10,
      this.getName()
    );

    hooks.addFilter<boolean>(
      'network:is_verifier_enabled',
      (current) => {
        if (this.currentSettings.enabled !== undefined) {
          return this.currentSettings.enabled === true;
        }
        return current;
      },
      10,
      this.getName()
    );

    // Se estiver ativada nas configurações administrativas, inicia verificação periódica
    if (this.currentSettings.enabled !== false) {
      const intervalSec = typeof this.currentSettings.intervalSeconds === 'number'
        ? Math.max(5, this.currentSettings.intervalSeconds)
        : 20;
      this.startPeriodicCheck(intervalSec);
    } else {
      this.stopPeriodicCheck();
    }
  }

  /**
   * Ciclo de vida: Descarrega a extensão, encerra timers e remove filtros associados.
   */
  public onUnregister(hooks: HookRegistry): void {
    this.stopPeriodicCheck();
    hooks.removeAllHooksForExtension(this.getName());
    this.hooksRegistry = null;
  }

  /**
   * Executa a sondagem de conectividade com o GitHub utilizando fetch nativo e AbortController.
   */
  public async checkConnectivity(): Promise<GitHubPingResult> {
    const target = this.currentSettings.targetUrl || 'https://api.github.com/repos/WazzimaGiygg/Wiki-alternative';
    const timeoutMs = typeof this.currentSettings.timeoutMs === 'number' ? this.currentSettings.timeoutMs : 4000;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const wasOnline = this.state.isOnline;
    let result: GitHubPingResult;

    try {
      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

      // Probe utilizando fetch direto no site/API do GitHub
      const response = await fetch(target, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3+json, text/plain, */*',
          'User-Agent': 'WikiWorldWeb-OnlineStatusExtension/4.1.1',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutTimer);

      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const latency = Math.max(1, Math.round(endTime - startTime));

      // Considera online se o servidor do GitHub respondeu (mesmo com HTTP 403 Rate Limit ou 301/302 redirect)
      const isOnline = response.status < 500;

      result = {
        timestamp: Date.now(),
        latencyMs: latency,
        status: isOnline ? 'online' : 'offline',
        statusCode: response.status,
        target,
      };

      this.state.isOnline = isOnline;
      this.state.latencyMs = latency;
      this.state.lastCheckedAt = Date.now();
      this.state.statusCode = response.status;
      this.state.error = null;
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      const errorMsg = isTimeout ? 'Timeout na conexão com o GitHub' : (err?.message || 'Falha de rede ao contatar GitHub');

      result = {
        timestamp: Date.now(),
        latencyMs: 0,
        status: 'offline',
        error: errorMsg,
        target,
      };

      this.state.isOnline = false;
      this.state.latencyMs = null;
      this.state.lastCheckedAt = Date.now();
      this.state.statusCode = null;
      this.state.error = errorMsg;
    }

    // Registra no histórico (mantém até 20 registros)
    this.state.history.unshift(result);
    if (this.state.history.length > 20) {
      this.state.history = this.state.history.slice(0, 20);
    }

    this.notifyListeners();

    // Dispara ação caso o estado tenha mudado
    if (wasOnline !== this.state.isOnline && this.hooksRegistry) {
      this.hooksRegistry.doAction('network:status_changed', {
        isOnline: this.state.isOnline,
        latencyMs: this.state.latencyMs,
        target,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  /**
   * Inicia o timer periódico para verificação de conectividade.
   */
  public startPeriodicCheck(intervalSeconds: number = 20): void {
    this.stopPeriodicCheck();
    const safeIntervalMs = Math.max(5000, intervalSeconds * 1000);

    // Executa uma verificação imediata
    this.checkConnectivity().catch((e) => {
      console.warn('[OnlineStatusExtension] Erro na verificação inicial:', e);
    });

    this.timerId = setInterval(() => {
      if (this.currentSettings.enabled !== false) {
        this.checkConnectivity().catch((e) => {
          console.warn('[OnlineStatusExtension] Erro na verificação periódica:', e);
        });
      }
    }, safeIntervalMs);
  }

  /**
   * Encerra o timer periódico.
   */
  public stopPeriodicCheck(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Atualiza as configurações ativas da extensão.
   */
  public updateSettings(newSettings: Record<string, any>): void {
    this.currentSettings = {
      ...this.currentSettings,
      ...newSettings,
    };

    if (this.currentSettings.enabled === false) {
      this.stopPeriodicCheck();
    } else {
      const intervalSec = typeof this.currentSettings.intervalSeconds === 'number'
        ? Math.max(5, this.currentSettings.intervalSeconds)
        : 20;
      this.startPeriodicCheck(intervalSec);
    }
  }

  /**
   * Retorna uma cópia do estado atual de telemetria.
   */
  public getState(): OnlineStatusExtensionState {
    return {
      ...this.state,
      history: [...this.state.history],
    };
  }

  /**
   * Retorna as configurações ativas.
   */
  public getSettings(): Record<string, any> {
    return { ...this.currentSettings };
  }
}

export default OnlineStatusExtension;
