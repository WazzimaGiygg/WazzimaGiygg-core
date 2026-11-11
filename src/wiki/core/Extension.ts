/**
 * @file Extension.ts
 * @description Sistema central de tipos e barramento de ganchos (Hooks & Filters)
 * para o ecossistema de extensões/plugins do WikiWorldWeb.
 */

import {
  ExtensionCategory,
  EditorButtonDefinition,
  ArticleActionDefinition,
  ArticleWidgetDefinition,
  ExtensionSettingSchema,
} from '../types';

/**
 * Tipo para funções de callback de Filtros (Filters).
 * Filtros recebem um valor de entrada, transformam-no e retornam o valor modificado.
 */
export type FilterCallback<T = any> = (value: T, ...args: any[]) => T | Promise<T>;

/**
 * Tipo para funções de callback de Ações (Actions).
 * Ações executam efeitos colaterais em momentos específicos do ciclo de vida sem alterar valores diretamente.
 */
export type ActionCallback = (...args: any[]) => void | Promise<void>;

/**
 * Registro de prioridade e função de um Hook.
 */
export interface RegisteredHook<T = Function> {
  callback: T;
  priority: number;
  extensionName?: string;
}

/**
 * HookRegistry
 * 
 * Gerenciador central de pontos de extensão (Hooks).
 * Permite que o núcleo do WikiWorldWeb e plugins adicionem Ações e Filtros,
 * seguindo a arquitetura clássica de extensibilidade inspirada no MediaWiki/WordPress.
 */
export class HookRegistry {
  private filters: Map<string, RegisteredHook<FilterCallback>[]> = new Map();
  private actions: Map<string, RegisteredHook<ActionCallback>[]> = new Map();

  /**
   * Registra um Filtro para modificar dados em tempo de execução.
   *
   * @param name Nome do filtro (ex: 'render:wikitext', 'article:save', 'ui:sidebar_items')
   * @param callback Função que recebe o valor e argumentos adicionais, retornando o valor transformado
   * @param priority Ordem de execução (menor número = maior prioridade; padrão: 10)
   * @param extensionName Nome opcional da extensão proprietária
   */
  public addFilter<T = any>(
    name: string,
    callback: (value: T, ...args: any[]) => T,
    priority: number = 10,
    extensionName?: string
  ): void {
    if (!this.filters.has(name)) {
      this.filters.set(name, []);
    }

    const hooks = this.filters.get(name)!;
    hooks.push({ callback: callback as FilterCallback, priority, extensionName });
    hooks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Registra uma Ação para executar código em momentos chave da aplicação.
   *
   * @param name Nome da ação (ex: 'app:ready', 'article:viewed', 'user:login')
   * @param callback Função executada quando a ação for disparada
   * @param priority Ordem de execução (menor número = maior prioridade; padrão: 10)
   * @param extensionName Nome opcional da extensão proprietária
   */
  public addAction(
    name: string,
    callback: (...args: any[]) => void,
    priority: number = 10,
    extensionName?: string
  ): void {
    if (!this.actions.has(name)) {
      this.actions.set(name, []);
    }

    const hooks = this.actions.get(name)!;
    hooks.push({ callback, priority, extensionName });
    hooks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Aplica sincronicamente todos os filtros registrados sob o nome fornecido.
   *
   * @param name Nome do filtro
   * @param value Valor inicial a ser transformado
   * @param args Parâmetros adicionais passados para os callbacks
   * @returns O valor final transformado por todos os filtros registrados
   */
  public applyFilters<T = any>(name: string, value: T, ...args: any[]): T {
    const hooks = this.filters.get(name);
    if (!hooks || hooks.length === 0) {
      return value;
    }

    let currentValue = value;
    for (const hook of hooks) {
      try {
        const result = hook.callback(currentValue, ...args);
        // Garantir tratamento síncrono seguro
        if (!(result instanceof Promise)) {
          currentValue = result;
        }
      } catch (error) {
        console.error(`[WikiWorldWeb Hooks] Erro ao executar filtro '${name}' (Extensão: ${hook.extensionName || 'anônima'}):`, error);
      }
    }

    return currentValue;
  }

  /**
   * Aplica assincronamente todos os filtros registrados sob o nome fornecido.
   *
   * @param name Nome do filtro
   * @param value Valor inicial a ser transformado
   * @param args Parâmetros adicionais passados para os callbacks
   * @returns Promise com o valor final transformado
   */
  public async applyFiltersAsync<T = any>(name: string, value: T, ...args: any[]): Promise<T> {
    const hooks = this.filters.get(name);
    if (!hooks || hooks.length === 0) {
      return value;
    }

    let currentValue = value;
    for (const hook of hooks) {
      try {
        currentValue = await hook.callback(currentValue, ...args);
      } catch (error) {
        console.error(`[WikiWorldWeb Hooks] Erro ao executar filtro assíncrono '${name}' (Extensão: ${hook.extensionName || 'anônima'}):`, error);
      }
    }

    return currentValue;
  }

  /**
   * Dispara sincronicamente uma ação, executando todos os ouvintes registrados.
   *
   * @param name Nome da ação
   * @param args Argumentos passados para os ouvintes
   */
  public doAction(name: string, ...args: any[]): void {
    const hooks = this.actions.get(name);
    if (!hooks || hooks.length === 0) {
      return;
    }

    for (const hook of hooks) {
      try {
        hook.callback(...args);
      } catch (error) {
        console.error(`[WikiWorldWeb Hooks] Erro ao executar ação '${name}' (Extensão: ${hook.extensionName || 'anônima'}):`, error);
      }
    }
  }

  /**
   * Dispara assincronamente uma ação, aguardando a conclusão de todos os ouvintes.
   *
   * @param name Nome da ação
   * @param args Argumentos passados para os ouvintes
   */
  public async doActionAsync(name: string, ...args: any[]): Promise<void> {
    const hooks = this.actions.get(name);
    if (!hooks || hooks.length === 0) {
      return;
    }

    for (const hook of hooks) {
      try {
        await hook.callback(...args);
      } catch (error) {
        console.error(`[WikiWorldWeb Hooks] Erro ao executar ação assíncrona '${name}' (Extensão: ${hook.extensionName || 'anônima'}):`, error);
      }
    }
  }

  /**
   * Remove todos os filtros registrados por uma extensão específica ou por nome.
   */
  public removeFilter(name: string, callback?: FilterCallback): void {
    if (!this.filters.has(name)) return;
    if (!callback) {
      this.filters.delete(name);
      return;
    }

    const filtered = this.filters.get(name)!.filter((h) => h.callback !== callback);
    this.filters.set(name, filtered);
  }

  /**
   * Remove todas as ações registradas por nome ou callback.
   */
  public removeAction(name: string, callback?: ActionCallback): void {
    if (!this.actions.has(name)) return;
    if (!callback) {
      this.actions.delete(name);
      return;
    }

    const filtered = this.actions.get(name)!.filter((h) => h.callback !== callback);
    this.actions.set(name, filtered);
  }

  /**
   * Verifica se há filtros registrados para um gancho.
   */
  public hasFilter(name: string): boolean {
    return this.filters.has(name) && this.filters.get(name)!.length > 0;
  }

  /**
   * Verifica se há ações registradas para um gancho.
   */
  public hasAction(name: string): boolean {
    return this.actions.has(name) && this.actions.get(name)!.length > 0;
  }

  /**
   * Retorna um resumo de todos os hooks ativos para auditoria/diagnóstico.
   */
  public getRegisteredHooks(): { filters: string[]; actions: string[] } {
    return {
      filters: Array.from(this.filters.keys()),
      actions: Array.from(this.actions.keys()),
    };
  }

  /**
   * Remove todos os filtros e ações associados a uma extensão específica.
   */
  public removeAllHooksForExtension(extensionName: string): void {
    if (!extensionName) return;

    for (const [name, hooks] of this.filters.entries()) {
      const remaining = hooks.filter((h) => h.extensionName !== extensionName);
      if (remaining.length === 0) {
        this.filters.delete(name);
      } else {
        this.filters.set(name, remaining);
      }
    }

    for (const [name, hooks] of this.actions.entries()) {
      const remaining = hooks.filter((h) => h.extensionName !== extensionName);
      if (remaining.length === 0) {
        this.actions.delete(name);
      } else {
        this.actions.set(name, remaining);
      }
    }
  }

  /**
   * Retorna os hooks registrados por uma determinada extensão.
   */
  public getHooksForExtension(extensionName: string): { filters: string[]; actions: string[] } {
    const filters: string[] = [];
    const actions: string[] = [];

    for (const [name, hooks] of this.filters.entries()) {
      if (hooks.some((h) => h.extensionName === extensionName)) {
        filters.push(name);
      }
    }

    for (const [name, hooks] of this.actions.entries()) {
      if (hooks.some((h) => h.extensionName === extensionName)) {
        actions.push(name);
      }
    }

    return { filters, actions };
  }

  /**
   * Retorna relatório detalhado de todos os ganchos ativos para inspeção técnica e diagnóstica.
   */
  public getAllHooksDetailed(): {
    type: 'filter' | 'action';
    hookName: string;
    extensionName: string;
    priority: number;
  }[] {
    const list: {
      type: 'filter' | 'action';
      hookName: string;
      extensionName: string;
      priority: number;
    }[] = [];

    for (const [name, hooks] of this.filters.entries()) {
      for (const hook of hooks) {
        list.push({
          type: 'filter',
          hookName: name,
          extensionName: hook.extensionName || 'Núcleo / Anônima',
          priority: hook.priority,
        });
      }
    }

    for (const [name, hooks] of this.actions.entries()) {
      for (const hook of hooks) {
        list.push({
          type: 'action',
          hookName: name,
          extensionName: hook.extensionName || 'Núcleo / Anônima',
          priority: hook.priority,
        });
      }
    }

    return list;
  }

  /**
   * Limpa todos os hooks registrados.
   */
  public clear(): void {
    this.filters.clear();
    this.actions.clear();
  }
}

/**
 * Interface principal que toda extensão/plugin do WikiWorldWeb deve implementar.
 */
export interface WikiExtension {
  /**
   * Retorna o identificador ou nome único da extensão.
   * Exemplo: "HelloWorldExtension" ou "wikizero-math-katex"
   */
  getName(): string;

  /**
   * Retorna a versão semântica da extensão (SemVer).
   * Exemplo: "1.0.0"
   */
  getVersion(): string;

  /**
   * Método de ciclo de vida chamado no momento em que a extensão é carregada pelo ExtensionManager.
   * Permite à extensão registrar suas ações, filtros e manipuladores no HookRegistry.
   *
   * @param hooks Instância central do registro de hooks do WikiWorldWeb
   */
  onRegister(hooks: HookRegistry): void;

  /**
   * Descrição opcional da funcionalidade da extensão.
   */
  getDescription?(): string | undefined;

  /**
   * Autor ou mantenedor da extensão.
   */
  getAuthor?(): string | undefined;

  /**
   * Categoria temática da extensão.
   */
  getCategory?(): ExtensionCategory;

  /**
   * Componente React interativo principal fornecido pela extensão (para Ferramentas ou views especiais).
   */
  getComponent?(): any;

  /**
   * Botões customizados que a extensão injeta na barra de ferramentas do WikitextEditor.
   */
  getEditorButtons?(): EditorButtonDefinition[];

  /**
   * Botões de ação rápida que a extensão injeta na barra superior do ArticleViewer.
   */
  getArticleActions?(): ArticleActionDefinition[];

  /**
   * Widgets informativos ou interativos que a extensão exibe no rodapé ou na lateral do artigo.
   */
  getWidgets?(): ArticleWidgetDefinition[];

  /**
   * Esquema descritivo de opções customizáveis pelo Burocrata ou usuário.
   */
  getSettingsSchema?(): ExtensionSettingSchema[] | undefined;

  /**
   * Obtém valores de configuração atuais.
   */
  getSettings?(): Record<string, any>;

  /**
   * Disparado quando as configurações da extensão são alteradas.
   */
  onConfigChange?(newSettings: Record<string, any>): void;

  /**
   * Indica se é uma extensão nativa / essencial da Wiki.
   */
  isCore?(): boolean;

  /**
   * Link da documentação oficial da extensão.
   */
  getWebsite?(): string | undefined;

  /**
   * Método opcional executado quando a extensão for descarregada/desativada.
   */
  onUnregister?(hooks: HookRegistry): void;
}
