/**
 * @file siteAutoUpdateService.ts
 * @description Serviço avançado de auto-atualização do site/PWA baseado no uso ativo do usuário
 * e coordenação de verificação contínua em tempo real com o Firebase (Requisito 3.05.11).
 *
 * Funcionalidades:
 * - Configuração persistente de auto-atualização do site com modos:
 *   - 'prompt': Notifica com banner/toast interativo para o usuário decidir quando atualizar.
 *   - 'silent_on_idle': Aplica a atualização de forma silenciosa e suave quando o usuário estiver inativo.
 *   - 'immediate': Recarrega imediatamente ao detectar nova versão disponível.
 * - Gatilhos inteligentes baseados no uso da enciclopédia:
 *   - Checagem ao navegar entre páginas/artigos (checkOnNavigation).
 *   - Checagem ao alternar/retornar foco à aba da WikiZero (checkOnTabFocus).
 *   - Checagem ao reconectar à internet (checkOnOnline).
 *   - Intervalo configurável durante uso ativo contínuo (5, 10, 15, 30, 60 minutos).
 *   - Limiar configurável de ociosidade (30s, 60s, 120s, 300s).
 * - Verificação automática contínua de extensões no Firebase Firestore:
 *   - Escuta em tempo real ativada/desativada (realtimeExtensionsSyncEnabled).
 *   - Re-verificação de extensões ao navegar (verifyExtensionsOnNavigation).
 *   - Re-verificação de extensões ao focar aba (verifyExtensionsOnTabFocus).
 *   - Notificações/toasts em tempo real para mudanças nas extensões (showExtensionChangeToasts).
 *   - Recarga automática opcional para extensões críticas (autoReloadOnCriticalExtensionChange).
 */

import { FirebaseExtensionSyncService, ExtensionVerificationResult, ExtensionRealtimeChangeEvent } from './firebaseExtensionSyncService';

export type SiteUpdateMode = 'prompt' | 'silent_on_idle' | 'immediate';

export type SiteUpdateCheckStatus = 'idle' | 'checking' | 'update_available' | 'up_to_date' | 'error';

export interface SiteAutoUpdateConfig {
  /** Se o sistema de auto-atualização do site está ativado */
  enabled: boolean;
  /** Modo de aplicação da atualização */
  mode: SiteUpdateMode;
  /** Checar atualizações do site ao navegar entre artigos/páginas */
  checkOnNavigation: boolean;
  /** Checar atualizações do site ao focar ou alternar para a aba */
  checkOnTabFocus: boolean;
  /** Checar ao restabelecer a conexão com a internet */
  checkOnOnline: boolean;
  /** Intervalo de checagem periódica durante o uso ativo (em minutos) */
  checkIntervalMinutes: number;
  /** Segundos de inatividade do usuário antes de aplicar atualização em modo silent_on_idle */
  idleThresholdSeconds: number;
  /** Exibir notificação visual/toast quando houver nova versão pronta */
  notifyOnUpdateAvailable: boolean;
  /** Exibir indicador discreto quando uma verificação for executada */
  notifyOnCheckActivity: boolean;

  // --- Verificação em tempo real de extensões no Firebase ---
  /** Escuta em tempo real do Firestore para extensões e estados globais */
  realtimeExtensionsSyncEnabled: boolean;
  /** Disparar verificação de extensões no Firebase ao navegar pelo site */
  verifyExtensionsOnNavigation: boolean;
  /** Disparar verificação de extensões no Firebase ao focar na aba */
  verifyExtensionsOnTabFocus: boolean;
  /** Exibir toasts informativos quando extensões forem alteradas remotamente no Firebase */
  showExtensionChangeToasts: boolean;
  /** Recarregar automaticamente se extensão crítica/tema mudar na nuvem */
  autoReloadOnCriticalExtensionChange: boolean;
}

export const DEFAULT_SITE_AUTO_UPDATE_CONFIG: SiteAutoUpdateConfig = {
  enabled: true,
  mode: 'prompt',
  checkOnNavigation: true,
  checkOnTabFocus: true,
  checkOnOnline: true,
  checkIntervalMinutes: 15,
  idleThresholdSeconds: 60,
  notifyOnUpdateAvailable: true,
  notifyOnCheckActivity: false,
  realtimeExtensionsSyncEnabled: true,
  verifyExtensionsOnNavigation: true,
  verifyExtensionsOnTabFocus: true,
  showExtensionChangeToasts: true,
  autoReloadOnCriticalExtensionChange: false,
};

const STORAGE_KEY = 'wikizero_auto_update_config_v3_05_11';

export class SiteAutoUpdateService {
  private static instance: SiteAutoUpdateService;
  private config: SiteAutoUpdateConfig;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private applyUpdateCallback: (() => void) | null = null;

  // Estados dinâmicos em tempo de execução
  private lastCheckedAt: string | null = null;
  private checkStatus: SiteUpdateCheckStatus = 'idle';
  private updatePending: boolean = false;
  private checksCount: number = 0;
  private lastActivityTimestamp: number = Date.now();
  private isUserCurrentlyIdle: boolean = false;

  // Timers
  private intervalTimerId: any = null;
  private idleCheckTimerId: any = null;
  private lastCheckCallTime: number = 0;

  // Ouvintes reativos
  private configListeners: Set<(config: SiteAutoUpdateConfig) => void> = new Set();
  private statusListeners: Set<(status: {
    checkStatus: SiteUpdateCheckStatus;
    lastCheckedAt: string | null;
    updatePending: boolean;
    checksCount: number;
    isIdle: boolean;
  }) => void> = new Set();

  private constructor() {
    this.config = this.loadConfig();
    this.setupUserActivityListeners();
    this.setupPeriodicInterval();
    this.setupLifecycleTriggers();
    this.setupIdleDetectionTimer();
  }

  public static getInstance(): SiteAutoUpdateService {
    if (!SiteAutoUpdateService.instance) {
      SiteAutoUpdateService.instance = new SiteAutoUpdateService();
    }
    return SiteAutoUpdateService.instance;
  }

  /**
   * Carrega a configuração persistida ou valores padrão seguros.
   */
  private loadConfig(): SiteAutoUpdateConfig {
    if (typeof localStorage === 'undefined') return DEFAULT_SITE_AUTO_UPDATE_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SITE_AUTO_UPDATE_CONFIG;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SITE_AUTO_UPDATE_CONFIG,
        ...parsed,
      };
    } catch (e) {
      console.warn('[SiteAutoUpdateService] Erro ao carregar configuração de auto-atualização:', e);
      return DEFAULT_SITE_AUTO_UPDATE_CONFIG;
    }
  }

  /**
   * Salva a configuração no armazenamento local e notifica inscritos.
   */
  public updateConfig(patch: Partial<SiteAutoUpdateConfig>): SiteAutoUpdateConfig {
    this.config = {
      ...this.config,
      ...patch,
    };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch (e) {
      console.warn('[SiteAutoUpdateService] Erro ao salvar configuração:', e);
    }

    // Reconfigura o temporizador periódico caso o intervalo tenha mudado
    if (patch.checkIntervalMinutes !== undefined || patch.enabled !== undefined) {
      this.setupPeriodicInterval();
    }

    // Atualiza o estado da sincronia em tempo real das extensões se modificado
    if (patch.realtimeExtensionsSyncEnabled !== undefined) {
      const extSync = FirebaseExtensionSyncService.getInstance();
      if (this.config.realtimeExtensionsSyncEnabled) {
        extSync.ensureRealtimeActive();
      } else {
        extSync.stopRealtimeSync();
      }
    }

    this.notifyConfigListeners();
    return this.config;
  }

  public getConfig(): SiteAutoUpdateConfig {
    return { ...this.config };
  }

  public getStatus() {
    return {
      checkStatus: this.checkStatus,
      lastCheckedAt: this.lastCheckedAt,
      updatePending: this.updatePending,
      checksCount: this.checksCount,
      isIdle: this.isUserCurrentlyIdle,
    };
  }

  public subscribeConfig(listener: (config: SiteAutoUpdateConfig) => void): () => void {
    this.configListeners.add(listener);
    listener(this.getConfig());
    return () => this.configListeners.delete(listener);
  }

  public subscribeStatus(listener: (status: any) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => this.statusListeners.delete(listener);
  }

  private notifyConfigListeners(): void {
    const current = this.getConfig();
    this.configListeners.forEach((l) => {
      try {
        l(current);
      } catch (err) {
        console.warn('[SiteAutoUpdateService] Erro no listener de config:', err);
      }
    });
  }

  private notifyStatusListeners(): void {
    const current = this.getStatus();
    this.statusListeners.forEach((l) => {
      try {
        l(current);
      } catch (err) {
        console.warn('[SiteAutoUpdateService] Erro no listener de status:', err);
      }
    });
  }

  /**
   * Vincula o Service Worker Registration e a função de aplicação de atualização do PWA.
   */
  public setServiceWorkerRegistration(
    registration: ServiceWorkerRegistration | null,
    applyUpdate?: () => void
  ): void {
    this.swRegistration = registration;
    if (applyUpdate) {
      this.applyUpdateCallback = applyUpdate;
    }
  }

  /**
   * Marca que uma atualização está disponível e baixada.
   */
  public setUpdateAvailable(applyUpdate: () => void): void {
    this.updatePending = true;
    this.applyUpdateCallback = applyUpdate;
    this.checkStatus = 'update_available';
    this.notifyStatusListeners();

    // Se o modo for imediato, aplica na hora
    if (this.config.enabled && this.config.mode === 'immediate') {
      console.info('[SiteAutoUpdateService] Modo imediato ativo: aplicando atualização agora...');
      this.applyPendingUpdate();
      return;
    }

    // Se for no modo silencioso durante inatividade e o usuário já estiver ocioso
    if (this.config.enabled && this.config.mode === 'silent_on_idle' && this.isUserCurrentlyIdle) {
      console.info('[SiteAutoUpdateService] Usuário já está ocioso: aplicando atualização silenciosa...');
      this.applyPendingUpdate();
      return;
    }
  }

  /**
   * Aplica a atualização pendente reiniciando o Service Worker ou recarregando a página.
   */
  public applyPendingUpdate(): void {
    if (this.applyUpdateCallback) {
      try {
        this.applyUpdateCallback();
      } catch (err) {
        console.warn('[SiteAutoUpdateService] Erro ao chamar applyUpdateCallback, recarregando página:', err);
        if (typeof window !== 'undefined') window.location.reload();
      }
    } else if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      if (typeof window !== 'undefined') window.location.reload();
    } else {
      if (typeof window !== 'undefined') window.location.reload();
    }
  }

  /**
   * Rastreamento passivo de atividade do usuário para estimar uso ativo e ociosidade.
   */
  private setupUserActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const onUserAction = () => {
      this.lastActivityTimestamp = Date.now();
      if (this.isUserCurrentlyIdle) {
        this.isUserCurrentlyIdle = false;
        this.notifyStatusListeners();
      }
    };

    window.addEventListener('click', onUserAction, { passive: true });
    window.addEventListener('keydown', onUserAction, { passive: true });
    window.addEventListener('scroll', onUserAction, { passive: true });
    window.addEventListener('touchstart', onUserAction, { passive: true });
    window.addEventListener('mousemove', onUserAction, { passive: true });
  }

  /**
   * Monitora inatividade a cada 5 segundos para aplicação automática no modo 'silent_on_idle'.
   */
  private setupIdleDetectionTimer(): void {
    if (typeof window === 'undefined') return;
    if (this.idleCheckTimerId) clearInterval(this.idleCheckTimerId);

    this.idleCheckTimerId = setInterval(() => {
      const idleSeconds = Math.floor((Date.now() - this.lastActivityTimestamp) / 1000);
      const isIdleNow = idleSeconds >= this.config.idleThresholdSeconds;

      if (isIdleNow !== this.isUserCurrentlyIdle) {
        this.isUserCurrentlyIdle = isIdleNow;
        this.notifyStatusListeners();
      }

      // Se houver atualização pendente e o modo for silent_on_idle e o usuário acabou de atingir a ociosidade
      if (
        this.config.enabled &&
        this.config.mode === 'silent_on_idle' &&
        this.updatePending &&
        isIdleNow
      ) {
        console.info(
          `[SiteAutoUpdateService] Usuário inativo por ${idleSeconds}s (limiar ${this.config.idleThresholdSeconds}s). Aplicando atualização silenciosamente...`
        );
        this.applyPendingUpdate();
      }
    }, 5000);
  }

  /**
   * Configura o intervalo periódico baseado em `config.checkIntervalMinutes`.
   */
  private setupPeriodicInterval(): void {
    if (typeof window === 'undefined') return;
    if (this.intervalTimerId) {
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = null;
    }

    if (!this.config.enabled || this.config.checkIntervalMinutes <= 0) {
      return;
    }

    const intervalMs = Math.max(1, this.config.checkIntervalMinutes) * 60 * 1000;
    this.intervalTimerId = setInterval(() => {
      // Checa apenas se o usuário tiver tido atividade recente (últimos 30 min)
      const secondsSinceActive = Math.floor((Date.now() - this.lastActivityTimestamp) / 1000);
      if (secondsSinceActive < 1800) {
        this.checkForUpdates('interval');
      }
    }, intervalMs);
  }

  /**
   * Configura gatilhos do ciclo de vida: online e visibilitychange / foco da aba.
   */
  private setupLifecycleTriggers(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      if (this.config.enabled && this.config.checkOnOnline) {
        this.checkForUpdates('online');
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.recordTabFocus();
      }
    });

    window.addEventListener('focus', () => {
      this.recordTabFocus();
    });
  }

  /**
   * Chamado quando o usuário foca na aba ou ela se torna visível.
   */
  public recordTabFocus(): void {
    this.lastActivityTimestamp = Date.now();
    if (this.config.enabled && this.config.checkOnTabFocus) {
      this.checkForUpdates('focus');
    }
    if (this.config.verifyExtensionsOnTabFocus) {
      this.verifyExtensionsOnFirebase('tab_focus');
    }
  }

  /**
   * Chamado em mudanças de rota ou navegação entre páginas/artigos na enciclopédia.
   */
  public recordNavigation(routeOrArticle?: string): void {
    this.lastActivityTimestamp = Date.now();
    if (this.config.enabled && this.config.checkOnNavigation) {
      this.checkForUpdates('navigation');
    }
    if (this.config.verifyExtensionsOnNavigation) {
      this.verifyExtensionsOnFirebase(`navigation_${routeOrArticle || 'page'}`);
    }
  }

  /**
   * Executa a verificação de atualizações do site/PWA.
   */
  public async checkForUpdates(
    trigger: 'navigation' | 'focus' | 'interval' | 'manual' | 'online' = 'manual'
  ): Promise<{ status: SiteUpdateCheckStatus; message: string }> {
    const now = Date.now();
    // Proteção de debounce para chamadas automáticas: no mínimo 10s entre checagens automáticas
    if (trigger !== 'manual' && now - this.lastCheckCallTime < 10000) {
      return {
        status: this.checkStatus,
        message: 'Checagem recente já em andamento ou executada recentemente.',
      };
    }
    this.lastCheckCallTime = now;

    this.checkStatus = 'checking';
    this.notifyStatusListeners();

    try {
      this.checksCount++;
      this.lastCheckedAt = new Date().toISOString();

      if (this.swRegistration) {
        await this.swRegistration.update();
      }

      // Se houver worker em espera após a checagem
      if (this.swRegistration?.waiting) {
        this.setUpdateAvailable(() => {
          if (this.swRegistration?.waiting) {
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          if (typeof window !== 'undefined') window.location.reload();
        });
        return {
          status: 'update_available',
          message: 'Nova versão disponível e aguardando ativação.',
        };
      }

      // Se não houver atualização pendente
      if (!this.updatePending) {
        this.checkStatus = 'up_to_date';
      } else {
        this.checkStatus = 'update_available';
      }

      this.notifyStatusListeners();
      return {
        status: this.checkStatus,
        message:
          this.checkStatus === 'update_available'
            ? 'Nova versão do WikiZero encontrada!'
            : 'WikiZero está na versão mais recente.',
      };
    } catch (err: any) {
      console.warn('[SiteAutoUpdateService] Erro ao checar atualização do site:', err);
      this.checkStatus = 'error';
      this.notifyStatusListeners();
      return {
        status: 'error',
        message: `Falha ao checar atualização: ${err?.message || 'Erro de rede'}`,
      };
    }
  }

  /**
   * Dispara a verificação direta e em tempo real das extensões no Firebase Firestore.
   */
  public async verifyExtensionsOnFirebase(reason: string = 'manual'): Promise<ExtensionVerificationResult> {
    const syncService = FirebaseExtensionSyncService.getInstance();
    return await syncService.verifyExtensionsRealtime(reason);
  }

  /**
   * Simula para fins de demonstração e teste a chegada de uma nova atualização do site.
   */
  public simulateUpdateFound(): void {
    console.info('[SiteAutoUpdateService] Simulando nova atualização pronta...');
    this.setUpdateAvailable(() => {
      console.info('[SiteAutoUpdateService] Atualização simulada aplicada com sucesso!');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wikizero:sw-update-available', {
          detail: { applyUpdate: () => this.applyPendingUpdate() },
        })
      );
    }
  }
}

export const siteAutoUpdateService = SiteAutoUpdateService.getInstance();

// Expõe globalmente para diagnósticos e integração simplificada
if (typeof window !== 'undefined') {
  (window as any).wikizeroAutoUpdateService = siteAutoUpdateService;
}
