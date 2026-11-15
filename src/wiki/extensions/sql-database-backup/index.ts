/**
 * EXTENSÃO NATIVA: SqlDatabaseBackupExtension
 * Arquivo: src/extensions/sql-database-backup/index.ts
 *
 * REQUISITO 3.05.3.aa:
 * - Adicionar extensão, nativa e não sincronizável com a nuvem;
 * - A configuração é feita diretamente em arquivo onde fica a extensão (src/extensions/sql-database-backup/config.ts);
 * - Permite exclusivamente ao burocrata habilitar e desabilitar o backup geral para um banco de dados SQL.
 */

import { HookRegistry, WikiExtension } from '../../core/Extension';
import { CustomToolConfig, ExtensionCategory, ExtensionSettingField } from '../../types';
import {
  getSqlDatabaseBackupConfig,
  updateSqlDatabaseBackupConfig,
  generateSqlDumpScript,
  downloadSqlBackupFile,
  SqlDatabaseBackupConfig,
} from './config';

export default class SqlDatabaseBackupExtension implements WikiExtension {
  getName(): string {
    return 'SqlDatabaseBackupExtension';
  }

  getVersion(): string {
    return '3.05.3';
  }

  getDescription(): string {
    return 'Extensão nativa e não sincronizável com a nuvem, configurada diretamente em seu próprio arquivo de código (src/extensions/sql-database-backup/config.ts), permitindo exclusivamente ao burocrata habilitar e desabilitar o backup geral para um banco de dados relacional SQL (PostgreSQL, MySQL, SQLite ou Cloud SQL).';
  }

  getAuthor(): string {
    return 'WikiZero Governance / Conselho de Burocratas';
  }

  getCategory(): ExtensionCategory {
    return 'security';
  }

  /**
   * Extensão NATIVA
   */
  isCore(): boolean {
    return true;
  }

  /**
   * ESTRITAMENTE NÃO SINCRONIZÁVEL COM A NUVEM (Requisito 3.05.3.aa)
   * Nenhuma configuração ou estado é enviado ao Firebase Firestore.
   */
  isSyncableWithCloud(): boolean {
    return false;
  }

  getWebsite(): string {
    return 'https://wikiworldweb.org/extensions/sql-database-backup';
  }

  getSettingsSchema(): ExtensionSettingField[] {
    const current = getSqlDatabaseBackupConfig();
    return [
      {
        key: 'isGeneralBackupEnabled',
        label: 'Habilitar Backup Geral para Banco de Dados SQL (Somente Burocrata)',
        type: 'boolean',
        defaultValue: current.isGeneralBackupEnabled,
        description:
          'Ativa ou desativa a rotina de backup geral para o banco relacional SQL. Ação exclusiva de Burocratas.',
      },
      {
        key: 'sqlDialect',
        label: 'Dialeto do Banco de Dados SQL',
        type: 'select',
        defaultValue: current.sqlDialect,
        options: [
          'PostgreSQL',
          'MySQL',
          'SQLite',
          'CloudSQL_PostgreSQL',
        ],
        description: 'Define a sintaxe e formatação das tabelas e comandos SQL gerados no dump geral.',
      },
      {
        key: 'databaseHost',
        label: 'Host do Servidor SQL',
        type: 'string',
        defaultValue: current.databaseTarget.host,
        description: 'Endereço de rede do banco de dados relacional (definido no arquivo config.ts).',
      },
      {
        key: 'databaseName',
        label: 'Nome do Banco de Dados',
        type: 'string',
        defaultValue: current.databaseTarget.databaseName,
        description: 'Nome da base de dados SQL receptora dos dados da Wiki.',
      },
    ];
  }

  getToolConfig(): CustomToolConfig {
    return {
      toolId: 'sql-database-backup-tool',
      title: 'Gerenciador de Backup Geral SQL (Nativo & Local)',
      icon: 'Database',
      description:
        'Ferramenta nativa em arquivo para o Burocrata gerenciar, habilitar/desabilitar e descarregar backups gerais para banco de dados SQL (PostgreSQL/Cloud SQL). Não sincroniza com a nuvem.',
      badge: 'Nativo • Não-Sincronizável • Burocrata',
      category: 'security',
    };
  }

  onRegister(hooks: HookRegistry, context?: { settings?: Record<string, any>; manager?: any }): void {
    const config = getSqlDatabaseBackupConfig();

    // 1. Gancho para verificar se o backup geral SQL está habilitado
    hooks.addFilter<boolean>(
      'backup:sql_is_enabled',
      () => {
        return getSqlDatabaseBackupConfig().isGeneralBackupEnabled;
      },
      10,
      this.getName()
    );

    // 2. Gancho para obter a configuração lida diretamente do arquivo
    hooks.addFilter<SqlDatabaseBackupConfig>(
      'backup:sql_get_config',
      () => {
        return getSqlDatabaseBackupConfig();
      },
      10,
      this.getName()
    );

    // 3. Gancho para marcar como não sincronizável
    hooks.addFilter<boolean>(
      `extension:${this.getName()}:can_sync_cloud`,
      () => false,
      10,
      this.getName()
    );

    // 4. Ação para registrar evento de auditoria ao alterar status de backup
    hooks.addAction(
      'backup:sql_status_changed',
      (payload: { enabled: boolean; operator: string }) => {
        console.info(
          `[SqlDatabaseBackupExtension] Backup SQL ${payload.enabled ? 'HABILITADO' : 'DESABILITADO'} por ${payload.operator}`
        );
      },
      10,
      this.getName()
    );
  }

  /**
   * Métodos utilitários acessíveis diretamente pelo código do núcleo
   */
  public getConfig(): SqlDatabaseBackupConfig {
    return getSqlDatabaseBackupConfig();
  }

  public toggleGeneralBackup(enabled: boolean, user: any): { success: boolean; message: string; config: SqlDatabaseBackupConfig } {
    return updateSqlDatabaseBackupConfig({ isGeneralBackupEnabled: enabled }, user);
  }

  public async runDump(): Promise<any> {
    return generateSqlDumpScript();
  }

  public async downloadDump(): Promise<any> {
    return downloadSqlBackupFile();
  }
}
export { getSqlDatabaseBackupConfig, updateSqlDatabaseBackupConfig, generateSqlDumpScript, downloadSqlBackupFile };
