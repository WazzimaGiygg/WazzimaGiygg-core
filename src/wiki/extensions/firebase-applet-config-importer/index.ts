/**
 * EXTENSÃO NATIVA: FirebaseAppletConfigImporterExtension
 * Arquivo: src/extensions/firebase-applet-config-importer/index.ts
 *
 * REQUISITO 3.05.3.ad:
 * - Adicionar extensão com link para importar o JSON do firebase-applet-config em site cadastrado;
 * - A extensão NÃO É SINCRONIZÁVEL com a nuvem (isSyncableWithCloud = false);
 * - É nativa por link dentro do arquivo da extensão (config.ts);
 * - O link padrão é:
 *   https://gspotfverwazzimagiygg.wazzimagiygg.com/CHVX/MOC/?uid=NnihYOoIENGOqaHxj1jC
 * - O código de importação é feito pelo código de download de um HTML configurado
 *   em trazer um arquivo JSON de um site configurado em Firebase.
 */

import { HookRegistry, WikiExtension } from '../../core/Extension';
import { CustomToolConfig, ExtensionCategory, ExtensionSettingField } from '../../types';
import {
  getFirebaseAppletImporterConfig,
  updateFirebaseAppletImporterConfig,
  fetchFirebaseAppletConfigFromRegisteredSite,
  triggerDownloadAppletConfigFile,
  applyImportedFirebaseConfig,
  FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG,
  ImportFetchResult,
} from './config';

export default class FirebaseAppletConfigImporterExtension implements WikiExtension {
  getName(): string {
    return 'FirebaseAppletConfigImporterExtension';
  }

  getVersion(): string {
    return '3.05.3';
  }

  getDescription(): string {
    return 'Extensão nativa e não sincronizável com a nuvem, configurada diretamente em seu arquivo com o link padrão cadastrado (https://gspotfverwazzimagiygg.wazzimagiygg.com/CHVX/MOC/?uid=NnihYOoIENGOqaHxj1jC) para importação e download do JSON oficial firebase-applet-config.json diretamente do serviço Firebase da coleção wikizerikey.';
  }

  getAuthor(): string {
    return 'WikiZero Cloud Registry & Dev Core';
  }

  getCategory(): ExtensionCategory {
    return 'tool';
  }

  /**
   * Extensão NATIVA
   */
  isCore(): boolean {
    return true;
  }

  /**
   * ESTRITAMENTE NÃO SINCRONIZÁVEL COM A NUVEM (Requisito 3.05.3.ad)
   */
  isSyncableWithCloud(): boolean {
    return false;
  }

  getWebsite(): string {
    return FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG.registeredSiteUrl;
  }

  getSettingsSchema(): ExtensionSettingField[] {
    const current = getFirebaseAppletImporterConfig();
    return [
      {
        key: 'registeredSiteUrl',
        label: 'Link Padrão do Site Cadastrado (Requisito 3.05.3.ad)',
        type: 'string',
        defaultValue: current.registeredSiteUrl,
        description:
          'URL registrada para recuperação remota do firebase-applet-config.json. Configurada diretamente no arquivo config.ts.',
      },
      {
        key: 'uid',
        label: 'Identificador UID da Configuração',
        type: 'string',
        defaultValue: current.uid,
        description: 'Chave UID de 20 caracteres gerada e consultada na coleção wikizerikey do Firestore.',
      },
      {
        key: 'autoApplyToWiki',
        label: 'Aplicar Credenciais Automaticamente na Wiki após o Download',
        type: 'boolean',
        defaultValue: current.autoApplyToWiki,
        description:
          'Se ativado, ao baixar o arquivo a Wiki atualiza imediatamente as credenciais ativas do Firebase.',
      },
    ];
  }

  /**
   * Integração como ferramenta interativa em ToolsView
   */
  getToolConfig(): CustomToolConfig {
    return {
      toolId: 'firebase-applet-importer',
      title: 'Importador de firebase-applet-config.json (Site Cadastrado)',
      description:
        'Baixa e importa o arquivo oficial firebase-applet-config.json a partir do site cadastrado via Firebase Firestore (coleção wikizerikey).',
      icon: 'Database',
      badge: 'Nativo',
      category: 'Utilitários de Nuvem & Firebase',
      inputs: [
        {
          id: 'urlOrUid',
          label: 'URL Cadastrada ou UID',
          type: 'text',
          defaultValue: FIREBASE_APPLET_CONFIG_IMPORTER_FILE_CONFIG.registeredSiteUrl,
          placeholder: 'https://gspotfverwazzimagiygg.wazzimagiygg.com/CHVX/MOC/?uid=NnihYOoIENGOqaHxj1jC',
          helpText: 'Link do site cadastrado contendo o parâmetro ?uid=',
        },
      ],
      calculationFormula: 'firebase_applet_import(urlOrUid)',
      resultLabel: 'Configuração Firebase JSON',
    };
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any> }): void {
    hooks.addAction(
      'admin:firebase_tools',
      () => {
        console.info('[FirebaseAppletConfigImporter] Ferramenta de importação pronta.');
      },
      10,
      this.getName()
    );

    hooks.addFilter(
      'extension:is_syncable',
      (isSyncable: boolean, extName?: string) => {
        if (extName === this.getName()) {
          return false;
        }
        return isSyncable;
      },
      10,
      this.getName()
    );
  }

  /**
   * Métodos utilitários exportados na instância
   */
  public async fetchConfig(urlOrUid?: string): Promise<ImportFetchResult> {
    return fetchFirebaseAppletConfigFromRegisteredSite(urlOrUid);
  }

  public downloadConfig(content: string | object): void {
    triggerDownloadAppletConfigFile(content);
  }

  public applyConfig(content: any): { success: boolean; message: string } {
    return applyImportedFirebaseConfig(content);
  }
}
