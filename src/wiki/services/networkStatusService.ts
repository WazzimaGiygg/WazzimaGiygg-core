/**
 * @file src/services/networkStatusService.ts
 * @description Serviço de Verificação em Tempo Real da Conectividade do Computador (4.1.1.D6.6)
 * Combina eventos nativos do navegador (navigator.onLine), probes ativos de latência (RTT)
 * via /api/ping e /api/health, NetworkInformation API e histórico de telemetria.
 */

export type ConnectionQuality =
  | 'excellent' // Latência < 120ms
  | 'good'      // Latência 120-280ms
  | 'fair'      // Latência 280-500ms
  | 'poor'      // Latência > 500ms
  | 'offline'   // Sem conexão à rede
  | 'checking'; // Verificação em andamento

export interface PingRecord {
  id: string;
  timestamp: number;
  latencyMs: number;
  status: 'online' | 'offline';
  endpoint: string;
  quality: ConnectionQuality;
}

export interface NetworkInformationData {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g' | string;
  downlink?: number; // Mbps
  rtt?: number; // ms estimado pelo navegador
  saveData?: boolean;
  type?: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'other' | 'none' | 'unknown' | string;
}

export interface GitHubConnectionStatus {
  isReachable: boolean;
  latencyMs: number | null;
  target: string;
  checkedAt: number | null;
  statusCode?: number;
  error?: string;
}

export interface NetworkStatus {
  isOnline: boolean;              // Computador online e com rota ativa para o servidor/internet
  isNavigatorOnline: boolean;     // navigator.onLine nativo do sistema operacional
  isReachable: boolean;           // Servidor respondeu ao probe ativo
  quality: ConnectionQuality;     // Qualidade da conexão
  latencyMs: number | null;       // Latência real medida em ms (RTT)
  lastChecked: number | null;     // Timestamp da última verificação
  lastChanged: number | null;     // Timestamp da última alteração de estado
  offlineSince: number | null;    // Timestamp desde quando está offline (se aplicável)
  reconnectCount: number;         // Número de reconexões nesta sessão
  networkInfo: NetworkInformationData;
  history: PingRecord[];          // Histórico das últimas verificações
  isChecking: boolean;            // Probe em execução
  isEnabled: boolean;             // Extensão ativada/desativada (4.1.1.1GZ.8)
  github: GitHubConnectionStatus; // Sincronização em tempo real com o GitHub (4.1.1.1GZ.8)
}

export type NetworkStatusListener = (status: NetworkStatus) => void;

class NetworkStatusServiceClass {
  private static instance: NetworkStatusServiceClass | null = null;

  private isEnabled: boolean = true;
  private isOnline: boolean =
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  private isNavigatorOnline: boolean =
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  private isReachable: boolean = true;
  private quality: ConnectionQuality = 'checking';
  private latencyMs: number | null = null;
  private lastChecked: number | null = null;
  private lastChanged: number | null = Date.now();
  private offlineSince: number | null = null;
  private reconnectCount: number = 0;
  private isChecking: boolean = false;
  private history: PingRecord[] = [];
  private githubStatus: GitHubConnectionStatus = {
    isReachable: true,
    latencyMs: null,
    target: 'https://github.com/WazzimaGiygg/Wiki-alternative',
    checkedAt: null,
  };

  private listeners: Set<NetworkStatusListener> = new Set();
  private heartbeatIntervalTimer: any = null;
  private heartbeatIntervalMs: number = 20000; // 20 segundos
  private maxHistorySize: number = 20;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initEventListeners();
      // Executa verificação inicial logo após carregar
      setTimeout(() => {
        this.checkNow();
      }, 500);
      this.startHeartbeat();
    }
  }

  public static getInstance(): NetworkStatusServiceClass {
    if (!NetworkStatusServiceClass.instance) {
      NetworkStatusServiceClass.instance = new NetworkStatusServiceClass();
    }
    return NetworkStatusServiceClass.instance;
  }

  /**
   * Inicializa ouvintes nativos do navegador e eventos de foco/visibilidade.
   */
  private initEventListeners(): void {
    // Evento nativo de computador reconectado
    window.addEventListener('online', () => {
      this.isNavigatorOnline = true;
      this.checkNow({ reason: 'window_online_event' });
    });

    // Evento nativo de computador desconectado da rede
    window.addEventListener('offline', () => {
      this.isNavigatorOnline = false;
      this.setOfflineState('window_offline_event');
    });

    // Ao focar a janela, executa checagem imediata para atualizar o status
    window.addEventListener('focus', () => {
      this.checkNow({ reason: 'window_focus' });
    });

    // Mudança de visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkNow({ reason: 'visibility_visible' });
      }
    });

    // Ouvinte para a Network Information API do navegador
    const navConn = this.getNavigatorConnection();
    if (navConn && typeof navConn.addEventListener === 'function') {
      navConn.addEventListener('change', () => {
        this.notifyListeners();
      });
    }
  }

  /**
   * Obtém os dados da Network Information API caso o navegador suporte.
   */
  public getNetworkInfo(): NetworkInformationData {
    const conn = this.getNavigatorConnection();
    if (!conn) return {};
    return {
      effectiveType: conn.effectiveType,
      downlink: conn.downlink,
      rtt: conn.rtt,
      saveData: conn.saveData,
      type: conn.type,
    };
  }

  private getNavigatorConnection(): any {
    if (typeof navigator === 'undefined') return null;
    return (
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection ||
      null
    );
  }

  /**
   * Avalia a qualidade da conexão baseada na latência medida.
   */
  public static calculateQuality(latencyMs: number | null, isOnline: boolean): ConnectionQuality {
    if (!isOnline) return 'offline';
    if (latencyMs === null) return 'checking';
    if (latencyMs < 120) return 'excellent';
    if (latencyMs <= 280) return 'good';
    if (latencyMs <= 500) return 'fair';
    return 'poor';
  }

  /**
   * Define o estado offline e notifica ouvintes.
   */
  private setOfflineState(reason?: string): void {
    const wasOnline = this.isOnline;
    this.isOnline = false;
    this.isReachable = false;
    this.quality = 'offline';
    this.latencyMs = null;
    this.lastChecked = Date.now();
    if (wasOnline) {
      this.lastChanged = Date.now();
      this.offlineSince = Date.now();
    }

    const record: PingRecord = {
      id: `ping-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      latencyMs: 0,
      status: 'offline',
      endpoint: '/api/ping',
      quality: 'offline',
    };
    this.addHistoryRecord(record);
    this.notifyListeners();
  }

  /**
   * Executa uma verificação ativa de conectividade e latência em tempo real.
   */
  public async checkNow(options?: { reason?: string }): Promise<NetworkStatus> {
    if (!this.isEnabled) {
      return this.getStatus();
    }

    if (this.isChecking) {
      return this.getStatus();
    }

    this.isChecking = true;
    this.notifyListeners();

    // Se o próprio SO diz que está offline, confirma imediatamente
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.isNavigatorOnline = false;
      this.setOfflineState(options?.reason || 'navigator_offline');
      this.isChecking = false;
      return this.getStatus();
    }

    this.isNavigatorOnline = true;
    const startTime = performance.now();
    const probeEndpoints = [
      `/api/ping?_t=${Date.now()}&github=true`,
      `/api/health?_t=${Date.now()}`,
    ];

    let success = false;
    let measuredLatency = 0;
    let successfulEndpoint = '/api/ping';

    for (const ep of probeEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const response = await fetch(ep, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const endTime = performance.now();
          measuredLatency = Math.max(1, Math.round(endTime - startTime));
          success = true;
          successfulEndpoint = ep.split('?')[0];

          // Extrai telemetria de conexão em tempo real com o GitHub (4.1.1.1GZ.8)
          try {
            const data = await response.json();
            if (data && data.github) {
              this.githubStatus = {
                isReachable: Boolean(data.github.isReachable),
                latencyMs: typeof data.github.latencyMs === 'number' ? data.github.latencyMs : null,
                target: data.github.target || 'https://github.com/WazzimaGiygg/Wiki-alternative',
                checkedAt: data.github.checkedAt || Date.now(),
                statusCode: data.github.statusCode,
                error: data.github.error,
              };
            }
          } catch {
            // Continua se JSON não for retornado (ex: health endpoint de texto)
          }
          break;
        }
      } catch (probeErr) {
        // Tenta o próximo endpoint
      }
    }

    // Se falhar no servidor local mas o computador tiver conexão, tenta GitHub diretamente
    if (!success && typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      try {
        const ghStart = performance.now();
        const ghController = new AbortController();
        const ghTimeout = setTimeout(() => ghController.abort(), 3500);

        const ghRes = await fetch('https://api.github.com/repos/WazzimaGiygg/Wiki-alternative', {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
          signal: ghController.signal,
        });
        clearTimeout(ghTimeout);

        const ghLat = Math.max(1, Math.round(performance.now() - ghStart));
        if (ghRes.status < 500) {
          success = true;
          measuredLatency = ghLat;
          successfulEndpoint = 'https://api.github.com';
          this.githubStatus = {
            isReachable: true,
            latencyMs: ghLat,
            target: 'https://github.com/WazzimaGiygg/Wiki-alternative',
            checkedAt: Date.now(),
            statusCode: ghRes.status,
          };
        }
      } catch (ghErr: any) {
        this.githubStatus = {
          isReachable: false,
          latencyMs: null,
          target: 'https://github.com/WazzimaGiygg/Wiki-alternative',
          checkedAt: Date.now(),
          error: ghErr?.message || 'Falha de conexão com GitHub',
        };
      }
    }

    const now = Date.now();
    const previousOnline = this.isOnline;

    if (success) {
      this.isOnline = true;
      this.isReachable = true;
      this.latencyMs = measuredLatency;
      this.quality = NetworkStatusServiceClass.calculateQuality(measuredLatency, true);
      this.lastChecked = now;

      if (!previousOnline) {
        this.lastChanged = now;
        this.offlineSince = null;
        this.reconnectCount += 1;
      }

      this.addHistoryRecord({
        id: `ping-${now}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        latencyMs: measuredLatency,
        status: 'online',
        endpoint: successfulEndpoint,
        quality: this.quality,
      });
    } else {
      // Falha ao alcançar o servidor e GitHub mesmo com navigator.onLine true
      this.isOnline = false;
      this.isReachable = false;
      this.latencyMs = null;
      this.quality = 'offline';
      this.lastChecked = now;

      if (previousOnline) {
        this.lastChanged = now;
        this.offlineSince = now;
      }

      this.addHistoryRecord({
        id: `ping-${now}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        latencyMs: 0,
        status: 'offline',
        endpoint: '/api/ping',
        quality: 'offline',
      });
    }

    this.isChecking = false;
    this.notifyListeners();
    return this.getStatus();
  }

  private addHistoryRecord(record: PingRecord): void {
    this.history.unshift(record);
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }

  public getStatus(): NetworkStatus {
    return {
      isOnline: this.isOnline,
      isNavigatorOnline: this.isNavigatorOnline,
      isReachable: this.isReachable,
      quality: this.quality,
      latencyMs: this.latencyMs,
      lastChecked: this.lastChecked,
      lastChanged: this.lastChanged,
      offlineSince: this.offlineSince,
      reconnectCount: this.reconnectCount,
      networkInfo: this.getNetworkInfo(),
      history: [...this.history],
      isChecking: this.isChecking,
      isEnabled: this.isEnabled,
      github: { ...this.githubStatus },
    };
  }

  public isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean): void {
    if (this.isEnabled === enabled) return;
    this.isEnabled = enabled;
    if (enabled) {
      this.startHeartbeat();
      this.checkNow({ reason: 'extension_enabled' });
    } else {
      this.stopHeartbeat();
      this.notifyListeners();
    }
  }

  public getGitHubStatus(): GitHubConnectionStatus {
    return { ...this.githubStatus };
  }

  public getHistory(): PingRecord[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
    this.notifyListeners();
  }

  /**
   * Assina atualizações em tempo real do estado de conectividade.
   */
  public subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    // Notifica imediatamente com o estado atual
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((fn) => {
      try {
        fn(status);
      } catch (err) {
        console.warn('[NetworkStatusService] Erro em listener:', err);
      }
    });
  }

  /**
   * Heartbeat periódico em segundo plano.
   */
  public startHeartbeat(intervalMs?: number): void {
    if (intervalMs) {
      this.heartbeatIntervalMs = intervalMs;
    }
    this.stopHeartbeat();
    this.heartbeatIntervalTimer = setInterval(() => {
      this.checkNow({ reason: 'heartbeat' });
    }, this.heartbeatIntervalMs);
  }

  public stopHeartbeat(): void {
    if (this.heartbeatIntervalTimer) {
      clearInterval(this.heartbeatIntervalTimer);
      this.heartbeatIntervalTimer = null;
    }
  }

  public setHeartbeatInterval(intervalMs: number): void {
    this.heartbeatIntervalMs = Math.max(5000, intervalMs);
    if (this.heartbeatIntervalTimer) {
      this.startHeartbeat();
    }
  }

  public calculateQuality(latencyMs: number | null, isOnline: boolean): ConnectionQuality {
    return NetworkStatusServiceClass.calculateQuality(latencyMs, isOnline);
  }
}

const serviceInstance = NetworkStatusServiceClass.getInstance();
export const NetworkStatusService = Object.assign(serviceInstance, {
  calculateQuality: NetworkStatusServiceClass.calculateQuality,
});

