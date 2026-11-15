/**
 * @file src/extensions/online-status-verifier/index.ts
 * @description Extensão para Verificação em Tempo Real se o Computador está Online (4.1.1.D6.6)
 */

import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory, ExtensionSettingField } from '../../types';
import { NetworkStatusService } from '../../services/networkStatusService';

export default class OnlineStatusVerifierExtension implements WikiExtension {
  public readonly id = 'online-status-verifier';
  public readonly name = 'OnlineStatusVerifierExtension';
  public readonly version = '4.1.1';
  public readonly category: ExtensionCategory = 'utility';

  getName(): string {
    return 'OnlineStatusVerifierExtension';
  }

  getVersion(): string {
    return '4.1.1';
  }

  getDescription(): string {
    return 'Verificação se o computador está online em tempo real (4.1.1.D6.6). Monitora conectividade contínua, mede latência (RTT em ms), detecta quedas/reconexões e fornece diagnóstico visual no cabeçalho.';
  }

  getAuthor(): string {
    return 'Infraestrutura & Redes da WikiZero';
  }

  getCategory(): ExtensionCategory {
    return 'utility';
  }

  isCore(): boolean {
    return true; // Ativado por padrão no ecossistema WikiWorldWeb V4.1
  }

  getWebsite(): string {
    return 'https://wazzimagiygg.com/';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    return [
      {
        key: 'enabled',
        label: 'Ativar Verificação Online em Tempo Real',
        type: 'boolean',
        defaultValue: true,
        description: 'Habilita a checagem contínua de conectividade e o indicador de latência no cabeçalho.',
      },
      {
        key: 'heartbeatIntervalSeconds',
        label: 'Intervalo de Verificação (Heartbeat em segundos)',
        type: 'number',
        defaultValue: 20,
        description: 'Frequência do probe ativo enviado ao servidor para medir latência e garantir que o computador tem rota de internet.',
      },
      {
        key: 'showLatencyBadge',
        label: 'Exibir Indicador de Latência no Topo',
        type: 'boolean',
        defaultValue: true,
        description: 'Mostra o badge com sinal verde/amarelo/vermelho e tempo de resposta (ex: 28ms) no cabeçalho.',
      },
      {
        key: 'showOfflineToast',
        label: 'Notificar Mudança de Conectividade',
        type: 'boolean',
        defaultValue: true,
        description: 'Emite alerta sonoro/visual quando o computador perder ou restabelecer a conexão com a rede.',
      },
    ];
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    const settings = context?.settings || {};

    if (settings.enabled !== false) {
      NetworkStatusService.setEnabled(true);
      const intervalSec = typeof settings.heartbeatIntervalSeconds === 'number'
        ? settings.heartbeatIntervalSeconds
        : 20;
      NetworkStatusService.startHeartbeat(Math.max(5, intervalSec) * 1000);
    } else {
      NetworkStatusService.setEnabled(false);
    }

    hooks.addFilter<boolean>(
      'network:is_verifier_enabled',
      (current) => {
        if (settings.enabled !== undefined) {
          return settings.enabled === true;
        }
        return current;
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    NetworkStatusService.setEnabled(false);
    hooks.removeFiltersForExtension(this.getName());
  }
}
