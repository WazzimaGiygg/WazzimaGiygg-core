/**
 * CONFIGURAÇÃO DIRETA DA EXTENSÃO NATIVA: SqlDatabaseBackupExtension
 * Arquivo: src/extensions/sql-database-backup/config.ts
 *
 * REQUISITO 3.05.3.aa:
 * - Extensão NATIVA e NÃO SINCRONIZÁVEL com a nuvem.
 * - A configuração é feita DIRETAMENTE EM ARQUIVO onde fica a extensão.
 * - Permite exclusivamente ao burocrata habilitar e desabilitar o backup geral
 *   para um banco de dados SQL (PostgreSQL, MySQL, SQLite, Cloud SQL).
 */

import { UserProfile } from '../../types';
import { StorageService } from '../../services/storageService';
import { isUserBureaucrat } from '../../core/ExtensionManager';

export interface SqlDatabaseBackupConfig {
  /** Identificador do perfil de backup local */
  id: string;
  /** Nome amigável */
  profileName: string;
  /** Se o backup geral para o banco SQL está ativado pelo burocrata */
  isGeneralBackupEnabled: boolean;
  /** Dialeto SQL do banco de dados */
  sqlDialect: 'PostgreSQL' | 'MySQL' | 'SQLite' | 'CloudSQL_PostgreSQL';
  /** Configurações de destino do banco SQL */
  databaseTarget: {
    engine: string;
    host: string;
    port: number;
    databaseName: string;
    schema: string;
    ssl: boolean;
    poolSize: number;
    timeoutSeconds: number;
  };
  /** Frequência agendada de execução do backup */
  backupFrequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  /** Tabelas e entidades da Wiki incluídas no backup geral */
  includedEntities: {
    articles: boolean;
    pages: boolean;
    users: boolean;
    talkThreads: boolean;
    revisions: boolean;
    categories: boolean;
    siteSettings: boolean;
    auditLogs: boolean;
  };
  /** Dias de retenção histórica */
  retentionDays: number;
  /** Modo de transação SQL (atomicidade total) */
  useTransactions: boolean;
  /** Compressão do dump */
  compression: 'none' | 'gzip';
  /** Metadados de autorização burocrática */
  bureaucratAuthorization: {
    enabledBy: string;
    enabledAt: string;
    authorizationNote: string;
    ipAddress?: string;
  };
  /** Metadados do arquivo */
  fileMetadata: {
    filePath: string;
    isNative: boolean;
    isCloudSyncable: boolean;
    version: string;
    lastFileSavedAt: string;
  };
  /** Estatísticas da última execução */
  lastExecution?: {
    timestamp: string;
    status: 'success' | 'failed' | 'idle';
    totalRowsExported: number;
    tablesExported: number;
    dumpSizeKb: number;
    durationMs: number;
    executedBy: string;
    message: string;
  };
}

/**
 * CONFIGURAÇÃO DIRETA PADRÃO DEFINIDA NO PRÓPRIO ARQUIVO DA EXTENSÃO.
 * Esta extensão reside no arquivo local e NUNCA é sincronizada com o Firebase Cloud.
 */
export const SQL_DATABASE_BACKUP_FILE_CONFIG: SqlDatabaseBackupConfig = {
  id: 'native-sql-backup-config-v1',
  profileName: 'Backup Geral WikiZero -> Banco de Dados Relacional SQL',
  // Burocrata habilita ou desabilita esta flag:
  isGeneralBackupEnabled: false,
  sqlDialect: 'PostgreSQL',
  databaseTarget: {
    engine: 'PostgreSQL 16 / Cloud SQL Developer Edition',
    host: 'postgresql-primary.wikiworldweb.internal',
    port: 5432,
    databaseName: 'wikizero_db',
    schema: 'public',
    ssl: true,
    poolSize: 10,
    timeoutSeconds: 30,
  },
  backupFrequency: 'daily',
  includedEntities: {
    articles: true,
    pages: true,
    users: true,
    talkThreads: true,
    revisions: true,
    categories: true,
    siteSettings: true,
    auditLogs: true,
  },
  retentionDays: 30,
  useTransactions: true,
  compression: 'none',
  bureaucratAuthorization: {
    enabledBy: 'Burocrata Primário (Configuração Inicial de Arquivo)',
    enabledAt: '2026-10-12T00:00:00.000Z',
    authorizationNote: 'Configuração nativa em arquivo local de extensão. Não sincronizável com a nuvem.',
  },
  fileMetadata: {
    filePath: 'src/extensions/sql-database-backup/config.ts',
    isNative: true,
    isCloudSyncable: false, // ESTRITAMENTE NÃO SINCRONIZÁVEL COM A NUVEM
    version: '3.05.3',
    lastFileSavedAt: new Date().toISOString(),
  },
  lastExecution: {
    timestamp: '2026-10-12T00:00:00.000Z',
    status: 'idle',
    totalRowsExported: 0,
    tablesExported: 0,
    dumpSizeKb: 0,
    durationMs: 0,
    executedBy: 'Sistema',
    message: 'Aguardando inicialização do burocrata para execução do backup geral.',
  },
};

const STORAGE_KEY_FILE_OVERRIDE = 'wikiworldweb_native_sql_backup_file_config';

/**
 * Carrega a configuração atual diretamente do arquivo da extensão
 * (com persistência local de sessão caso o burocrata altere via interface de administração).
 */
export function getSqlDatabaseBackupConfig(): SqlDatabaseBackupConfig {
  if (typeof window === 'undefined') {
    return { ...SQL_DATABASE_BACKUP_FILE_CONFIG };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_FILE_OVERRIDE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...SQL_DATABASE_BACKUP_FILE_CONFIG,
        ...parsed,
        fileMetadata: {
          ...SQL_DATABASE_BACKUP_FILE_CONFIG.fileMetadata,
          isCloudSyncable: false,
          isNative: true,
        },
      };
    }
  } catch (err) {
    console.warn('[SqlDatabaseBackup] Erro ao ler configuração local de arquivo:', err);
  }

  return { ...SQL_DATABASE_BACKUP_FILE_CONFIG };
}

/**
 * Salva e aplica a configuração no arquivo da extensão, garantindo que
 * SOMENTE O BUROCRATA tem permissão para habilitar/desabilitar o backup geral.
 */
export function updateSqlDatabaseBackupConfig(
  updates: Partial<SqlDatabaseBackupConfig>,
  user: UserProfile | null
): { success: boolean; message: string; config: SqlDatabaseBackupConfig } {
  // Se está alterando o status de habilitação do backup geral, exige estritamente burocrata
  if (updates.isGeneralBackupEnabled !== undefined) {
    if (!isUserBureaucrat(user)) {
      return {
        success: false,
        message: 'Somente o burocrata tem autorização para habilitar ou desabilitar o backup geral para o banco de dados SQL.',
        config: getSqlDatabaseBackupConfig(),
      };
    }
  }

  const current = getSqlDatabaseBackupConfig();
  const operatorName = user?.displayName || user?.username || user?.email || 'Burocrata do Sistema';

  const updatedConfig: SqlDatabaseBackupConfig = {
    ...current,
    ...updates,
    bureaucratAuthorization: {
      enabledBy: operatorName,
      enabledAt: new Date().toISOString(),
      authorizationNote: updates.isGeneralBackupEnabled !== undefined
        ? `Backup geral ${updates.isGeneralBackupEnabled ? 'HABILITADO' : 'DESABILITADO'} por ${operatorName} diretamente no arquivo de configuração da extensão.`
        : current.bureaucratAuthorization.authorizationNote,
    },
    fileMetadata: {
      ...current.fileMetadata,
      isCloudSyncable: false,
      isNative: true,
      lastFileSavedAt: new Date().toISOString(),
    },
  };

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_FILE_OVERRIDE, JSON.stringify(updatedConfig));
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao gravar configuração no arquivo local: ${err?.message || err}`,
      config: current,
    };
  }

  const actionMsg = updatedConfig.isGeneralBackupEnabled
    ? 'Backup geral para banco de dados SQL HABILITADO com sucesso pelo burocrata!'
    : 'Backup geral para banco de dados SQL DESABILITADO pelo burocrata.';

  return {
    success: true,
    message: actionMsg,
    config: updatedConfig,
  };
}

/**
 * Escapa strings SQL para evitar injeção e formatação inválida no dump SQL
 */
function escapeSqlString(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Gera o script completo de Backup Geral em formato SQL compatível
 * com PostgreSQL, MySQL ou SQLite.
 */
export async function generateSqlDumpScript(
  config: SqlDatabaseBackupConfig = getSqlDatabaseBackupConfig()
): Promise<{
  sqlScript: string;
  tablesCount: number;
  rowsCount: number;
  sizeKb: number;
  generatedAt: string;
}> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const dialect = config.sqlDialect;

  // Carrega todos os dados reais do StorageService
  const articles = await StorageService.getArticles();
  const users = await StorageService.getCommunityUsers();
  const pages = await StorageService.getPages();
  const rawCategories = Array.from(new Set(articles.map((a) => a.categoria || 'Geral')));
  const categories = rawCategories.map((cat, idx) => ({
    id: `cat-${idx + 1}`,
    nome: cat,
    descricao: `Categoria de verbetes: ${cat}`,
    artigosCount: articles.filter((a) => (a.categoria || 'Geral') === cat).length,
  }));
  const siteConfig = {
    appName: 'WikiZero',
    version: '3.05.3',
    sqlDialect: dialect,
    databaseTarget: config.databaseTarget,
    exportedAt: timestamp,
    settings: StorageService.getSavedExtensionSettings(),
  };

  let totalRows = 0;
  let tablesCount = 0;

  const lines: string[] = [];

  // Cabeçalho institucional do arquivo SQL
  lines.push(`-- =========================================================================`);
  lines.push(`-- WIKIZERO ENCYCLOPEDIA - BACKUP GERAL DE BANCO DE DADOS SQL`);
  lines.push(`-- Extensão Nativa Local: SqlDatabaseBackupExtension (Requisito 3.05.3.aa)`);
  lines.push(`-- Dialeto Alvo: ${dialect}`);
  lines.push(`-- Gerado em: ${timestamp}`);
  lines.push(`-- Destino Configurado: ${config.databaseTarget.host}:${config.databaseTarget.port}/${config.databaseTarget.databaseName}`);
  lines.push(`-- Estado: ${config.isGeneralBackupEnabled ? 'HABILITADO PELO BUROCRATA' : 'MODO DESABILITADO (TESTE/DUMP SOB DEMANDA)'}`);
  lines.push(`-- Autorizado por: ${config.bureaucratAuthorization.enabledBy}`);
  lines.push(`-- Não sincronizável com a nuvem (configurado em arquivo local)`);
  lines.push(`-- =========================================================================\n`);

  if (dialect === 'PostgreSQL' || dialect === 'CloudSQL_PostgreSQL') {
    lines.push(`SET client_encoding = 'UTF8';`);
    lines.push(`SET standard_conforming_strings = on;`);
    lines.push(`BEGIN;\n`);
  } else if (dialect === 'MySQL') {
    lines.push(`SET NAMES utf8mb4;`);
    lines.push(`SET FOREIGN_KEY_CHECKS = 0;`);
    lines.push(`START TRANSACTION;\n`);
  } else {
    lines.push(`PRAGMA foreign_keys = OFF;`);
    lines.push(`BEGIN TRANSACTION;\n`);
  }

  // 1. Tabela: wiki_articles
  if (config.includedEntities.articles && articles.length > 0) {
    tablesCount++;
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- Tabela: wiki_articles (${articles.length} registros)`);
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS wiki_articles (`);
    lines.push(`  id VARCHAR(255) PRIMARY KEY,`);
    lines.push(`  page_uid VARCHAR(255),`);
    lines.push(`  titulo VARCHAR(500) NOT NULL,`);
    lines.push(`  conteudo TEXT,`);
    lines.push(`  categoria VARCHAR(255),`);
    lines.push(`  autor VARCHAR(255),`);
    lines.push(`  autor_id VARCHAR(255),`);
    lines.push(`  data_criacao TIMESTAMP WITH TIME ZONE,`);
    lines.push(`  data_edicao TIMESTAMP WITH TIME ZONE,`);
    lines.push(`  visualizacoes INTEGER DEFAULT 0,`);
    lines.push(`  bloqueado BOOLEAN DEFAULT FALSE,`);
    lines.push(`  metadata JSONB`);
    lines.push(`);\n`);

    for (const art of articles) {
      totalRows++;
      const vals = [
        escapeSqlString(art.id),
        escapeSqlString(art.pageUid || ''),
        escapeSqlString(art.titulo),
        escapeSqlString(art.descricao || ''),
        escapeSqlString(art.categoria || 'Geral'),
        escapeSqlString(art.autor || 'Sistema'),
        escapeSqlString(art.autorUid || ''),
        escapeSqlString(art.dataCriacao || timestamp),
        escapeSqlString(art.dataEdicao || timestamp),
        art.visualizacoes || 0,
        art.isLocked ? 'TRUE' : 'FALSE',
        escapeSqlString({ tags: art.tags || [], versao: art.versao || 1 }),
      ].join(', ');

      lines.push(`INSERT INTO wiki_articles (id, page_uid, titulo, conteudo, categoria, autor, autor_id, data_criacao, data_edicao, visualizacoes, bloqueado, metadata)`);
      lines.push(`VALUES (${vals}) ON CONFLICT (id) DO UPDATE SET conteudo = EXCLUDED.conteudo, data_edicao = EXCLUDED.data_edicao;`);
    }
    lines.push('');
  }

  // 2. Tabela: wiki_users
  if (config.includedEntities.users && users.length > 0) {
    tablesCount++;
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- Tabela: wiki_users (${users.length} registros)`);
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS wiki_users (`);
    lines.push(`  id VARCHAR(255) PRIMARY KEY,`);
    lines.push(`  username VARCHAR(255) NOT NULL,`);
    lines.push(`  display_name VARCHAR(255),`);
    lines.push(`  email VARCHAR(255),`);
    lines.push(`  role VARCHAR(100),`);
    lines.push(`  pontos INTEGER DEFAULT 0,`);
    lines.push(`  edicoes_count INTEGER DEFAULT 0,`);
    lines.push(`  is_banned BOOLEAN DEFAULT FALSE,`);
    lines.push(`  data_cadastro TIMESTAMP WITH TIME ZONE`);
    lines.push(`);\n`);

    for (const u of users) {
      totalRows++;
      const vals = [
        escapeSqlString(u.uid),
        escapeSqlString(u.username || u.displayName),
        escapeSqlString(u.displayName || u.username || 'Usuário'),
        escapeSqlString(u.email || ''),
        escapeSqlString(u.role || 'leitor'),
        u.reputationScore || 0,
        0,
        u.isBanned ? 'TRUE' : 'FALSE',
        escapeSqlString(u.dataConsentimento || timestamp),
      ].join(', ');

      lines.push(`INSERT INTO wiki_users (id, username, display_name, email, role, pontos, edicoes_count, is_banned, data_cadastro)`);
      lines.push(`VALUES (${vals}) ON CONFLICT (id) DO UPDATE SET pontos = EXCLUDED.pontos, edicoes_count = EXCLUDED.edicoes_count;`);
    }
    lines.push('');
  }

  // 3. Tabela: wiki_pages
  if (config.includedEntities.pages && pages.length > 0) {
    tablesCount++;
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- Tabela: wiki_pages (${pages.length} registros)`);
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS wiki_pages (`);
    lines.push(`  uid VARCHAR(255) PRIMARY KEY,`);
    lines.push(`  title VARCHAR(500) NOT NULL,`);
    lines.push(`  icon VARCHAR(50),`);
    lines.push(`  description TEXT,`);
    lines.push(`  order_index INTEGER DEFAULT 0`);
    lines.push(`);\n`);

    for (const p of pages) {
      totalRows++;
      const vals = [
        escapeSqlString(p.uid),
        escapeSqlString(p.titulo),
        escapeSqlString(p.icon || 'FileText'),
        escapeSqlString(p.descricao || ''),
        p.articleCount || 0,
      ].join(', ');

      lines.push(`INSERT INTO wiki_pages (uid, title, icon, description, order_index)`);
      lines.push(`VALUES (${vals}) ON CONFLICT (uid) DO NOTHING;`);
    }
    lines.push('');
  }

  // 4. Tabela: wiki_categories
  if (config.includedEntities.categories && categories.length > 0) {
    tablesCount++;
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- Tabela: wiki_categories (${categories.length} registros)`);
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS wiki_categories (`);
    lines.push(`  id VARCHAR(255) PRIMARY KEY,`);
    lines.push(`  nome VARCHAR(255) NOT NULL,`);
    lines.push(`  descricao TEXT,`);
    lines.push(`  artigos_count INTEGER DEFAULT 0`);
    lines.push(`);\n`);

    for (const c of categories) {
      totalRows++;
      const vals = [
        escapeSqlString(c.id),
        escapeSqlString(c.nome),
        escapeSqlString(c.descricao || ''),
        c.artigosCount || 0,
      ].join(', ');

      lines.push(`INSERT INTO wiki_categories (id, nome, descricao, artigos_count)`);
      lines.push(`VALUES (${vals}) ON CONFLICT (id) DO UPDATE SET artigos_count = EXCLUDED.artigos_count;`);
    }
    lines.push('');
  }

  // 5. Tabela: wiki_site_settings
  if (config.includedEntities.siteSettings && siteConfig) {
    tablesCount++;
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- Tabela: wiki_site_settings (Configuração Global da Enciclopédia)`);
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS wiki_site_settings (`);
    lines.push(`  config_key VARCHAR(255) PRIMARY KEY,`);
    lines.push(`  config_value JSONB,`);
    lines.push(`  updated_at TIMESTAMP WITH TIME ZONE`);
    lines.push(`);\n`);

    totalRows++;
    lines.push(`INSERT INTO wiki_site_settings (config_key, config_value, updated_at)`);
    lines.push(`VALUES ('global_configuration', ${escapeSqlString(siteConfig)}, ${escapeSqlString(timestamp)})`);
    lines.push(`ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = EXCLUDED.updated_at;\n`);
  }

  // Finalização da transação
  if (dialect === 'PostgreSQL' || dialect === 'CloudSQL_PostgreSQL' || dialect === 'SQLite') {
    lines.push(`COMMIT;`);
  } else {
    lines.push(`SET FOREIGN_KEY_CHECKS = 1;`);
    lines.push(`COMMIT;`);
  }

  lines.push(`\n-- Fim do backup geral SQL. Linhas geradas: ${totalRows}. Sucesso.`);

  const sqlScript = lines.join('\n');
  const sizeKb = Math.round((new Blob([sqlScript]).size / 1024) * 100) / 100;
  const durationMs = Date.now() - startTime;

  // Atualiza histórico de execução
  const currentCfg = getSqlDatabaseBackupConfig();
  currentCfg.lastExecution = {
    timestamp,
    status: 'success',
    totalRowsExported: totalRows,
    tablesExported: tablesCount,
    dumpSizeKb: sizeKb,
    durationMs,
    executedBy: config.bureaucratAuthorization.enabledBy,
    message: `Backup geral SQL gerado com sucesso: ${tablesCount} tabelas e ${totalRows} linhas exportadas (${sizeKb} KB).`,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_FILE_OVERRIDE, JSON.stringify(currentCfg));
    } catch (_) {}
  }

  return {
    sqlScript,
    tablesCount,
    rowsCount: totalRows,
    sizeKb,
    generatedAt: timestamp,
  };
}

/**
 * Dispara o download imediato do arquivo SQL gerado no navegador do burocrata
 */
export async function downloadSqlBackupFile(): Promise<{ success: boolean; filename: string; sizeKb: number }> {
  const result = await generateSqlDumpScript();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `wikizero_sql_backup_general_${dateStr}.sql`;

  if (typeof window !== 'undefined') {
    const blob = new Blob([result.sqlScript], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    success: true,
    filename,
    sizeKb: result.sizeKb,
  };
}
