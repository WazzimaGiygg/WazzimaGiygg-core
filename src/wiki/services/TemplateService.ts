/**
 * @file TemplateService.ts
 * @description Serviço para gerenciamento de Templates (predefinições) do WikiZero no Firestore.
 * Suporta substituição dinâmica de parâmetros estilizados no padrão MediaWiki ({{{param}}} e {{{param|padrão}}}).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb, getAuthSafe, handleFirestoreError, OperationType } from './firebase';
import { WikiTemplate, CreateTemplateInput, UpdateTemplateInput } from '../types';

const COLLECTION_NAME = 'templates';
const LOCAL_STORAGE_KEY = 'wikizero_templates_cache_v1';

// Templates iniciais de demonstração (seed para quando o banco estiver vazio ou offline)
const SEED_TEMPLATES: WikiTemplate[] = [
  {
    id: 'tpl-aviso',
    name: 'Aviso',
    description: 'Caixa de alerta informativa personalizável para artigos enciclopédicos.',
    content: `<div class="my-4 p-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
  <div class="flex items-center gap-2 font-bold text-sm">
    <span>⚠️</span>
    <span>{{{titulo|Aviso Importante}}}</span>
  </div>
  <div class="mt-1 text-xs text-amber-800 dark:text-amber-300">
    {{{texto|{{{content|Este artigo está passando por revisões comunitárias.}}}}}}
  </div>
</div>`,
    parameters: ['titulo', 'texto', 'content'],
    category: 'Avisos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-infobox',
    name: 'Infobox',
    description: 'Tabela de resumo lateral padronizada para entidades, pessoas ou lugares.',
    content: `<aside class="my-4 md:float-right md:ml-6 md:mb-4 w-full md:w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-4 shadow-sm font-sans not-prose">
  <h4 class="text-center font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800 text-sm">
    {{{nome|{{{title|Entidade}}} }}}
  </h4>
  <div class="mt-3 space-y-2 text-xs">
    <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
      <span class="font-semibold text-slate-500 dark:text-slate-400">Tipo:</span>
      <span class="text-slate-800 dark:text-slate-200 text-right">{{{tipo|Não informado}}}</span>
    </div>
    <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
      <span class="font-semibold text-slate-500 dark:text-slate-400">Origem:</span>
      <span class="text-slate-800 dark:text-slate-200 text-right">{{{origem|Brasil}}}</span>
    </div>
    <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
      <span class="font-semibold text-slate-500 dark:text-slate-400">Ano:</span>
      <span class="text-slate-800 dark:text-slate-200 text-right">{{{ano|2026}}}</span>
    </div>
  </div>
  <div class="mt-3 text-xs text-slate-600 dark:text-slate-400 italic">
    {{{descricao|{{{content|Informações gerais}}}}}}
  </div>
</aside>`,
    parameters: ['nome', 'title', 'tipo', 'origem', 'ano', 'descricao', 'content'],
    category: 'Infoboxes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-citacao',
    name: 'Citacao',
    description: 'Bloco estilizado para citações célebres e referências históricas.',
    content: `<blockquote class="my-4 p-4 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 rounded-r-lg italic text-slate-700 dark:text-slate-300">
  <p class="text-sm font-serif">“{{{citacao|{{{texto|{{{content|Sem citação}}}}}}}}}”</p>
  <footer class="mt-2 text-xs font-sans text-blue-700 dark:text-blue-400 font-semibold not-italic text-right">
    — {{{autor|Desconhecido}}}{{{fonte|, <cite>{{{fonte}}}</cite>|}}}
  </footer>
</blockquote>`,
    parameters: ['citacao', 'texto', 'content', 'autor', 'fonte'],
    category: 'Formatação',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class TemplateService {
  /**
   * Helper para normalizar identificadores de template (case-insensitive e sem prefixo Template:).
   */
  public static normalizeTemplateName(name: string): string {
    return name
      .replace(/^Template:/i, '')
      .replace(/^Predefinição:/i, '')
      .trim();
  }

  /**
   * Extrai a lista de nomes de parâmetros presentes em um conteúdo de template.
   * Ex: "{{{nome|padrão}}}" -> "nome"
   */
  public static extractParameters(templateContent: string): string[] {
    const regex = /\{\{\{([a-zA-Z0-9_-]+)(?:\|[^}]*)?\}\}\}/g;
    const params = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(templateContent)) !== null) {
      params.add(match[1]);
    }
    return Array.from(params);
  }

  /**
   * Substitui os parâmetros {{{param}}} ou {{{param|default}}} no conteúdo do template.
   *
   * @param templateContent O corpo wikitext/HTML do template
   * @param params Dicionário chave-valor com os parâmetros fornecidos
   * @param fallbackContent Conteúdo textual principal da página (utilizado para {{{content}}} se omitido)
   */
  public static render(
    templateContent: string,
    params: Record<string, string> = {},
    fallbackContent: string = ''
  ): string {
    const combinedParams: Record<string, string | undefined> = {
      content: fallbackContent,
      ...params,
    };

    // Expressão regular para casar {{{nomeParametro}}} ou {{{nomeParametro|valorPadrao}}}
    return templateContent.replace(
      /\{\{\{([a-zA-Z0-9_-]+)(?:\|([^}]*))?\}\}\}/g,
      (match, paramName, defaultValue = '') => {
        if (combinedParams[paramName] !== undefined && combinedParams[paramName] !== '') {
          return combinedParams[paramName];
        }
        return defaultValue;
      }
    );
  }

  /**
   * Cria um novo template na coleção do Firestore.
   */
  public static async createTemplate(input: CreateTemplateInput): Promise<WikiTemplate> {
    const cleanName = this.normalizeTemplateName(input.name);
    if (!cleanName) {
      throw new Error('O nome do template não pode ser vazio.');
    }
    if (!input.content || !input.content.trim()) {
      throw new Error('O conteúdo do template é obrigatório.');
    }

    const templateId = `tpl-${cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const parameters = this.extractParameters(input.content);

    const auth = getAuthSafe();
    const currentUser = auth?.currentUser;

    const newTemplate: WikiTemplate = {
      id: templateId,
      name: cleanName,
      content: input.content,
      description: input.description || '',
      parameters,
      category: input.category || 'Geral',
      authorUid: input.authorUid || currentUser?.uid || 'anonymous',
      authorName: input.authorName || currentUser?.displayName || 'Editor WikiZero',
      createdAt: now,
      updatedAt: now,
    };

    // Persistência local (cache/fallback)
    this.saveToLocalCache(newTemplate);

    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, templateId);
      await setDoc(docRef, {
        ...newTemplate,
        _serverTimestamp: serverTimestamp(),
      });
      return newTemplate;
    } catch (error) {
      console.warn('[TemplateService] Erro ao salvar template no Firestore, usando fallback local:', error);
      // Se for erro de permissão ou rede, lança através do handleFirestoreError se aplicável
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${templateId}`);
      }
      return newTemplate;
    }
  }

  /**
   * Obtém um template pelo ID ou pelo Nome (busca exata ou case-insensitive).
   */
  public static async getTemplate(nameOrId: string): Promise<WikiTemplate | null> {
    if (!nameOrId || !nameOrId.trim()) return null;

    const normalized = this.normalizeTemplateName(nameOrId).toLowerCase();

    // 1. Tenta buscar no Firestore por ID direto
    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, nameOrId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as WikiTemplate;
        this.saveToLocalCache(data);
        return data;
      }

      // 2. Tenta buscar por nome no Firestore
      const q = query(collection(db, COLLECTION_NAME), where('name', '==', nameOrId));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const data = querySnap.docs[0].data() as WikiTemplate;
        this.saveToLocalCache(data);
        return data;
      }
    } catch (error) {
      console.warn('[TemplateService] Erro ao buscar template no Firestore, consultando cache:', error);
    }

    // 3. Fallback para cache local e predefinições globais
    const cachedList = this.getFromLocalCache();
    const found = cachedList.find(
      (t) =>
        t.id === nameOrId ||
        t.name.toLowerCase() === normalized ||
        this.normalizeTemplateName(t.name).toLowerCase() === normalized
    );

    return found || null;
  }

  /**
   * Atualiza um template existente no Firestore.
   */
  public static async updateTemplate(id: string, input: UpdateTemplateInput): Promise<WikiTemplate> {
    const existing = await this.getTemplate(id);
    if (!existing) {
      throw new Error(`Template com ID "${id}" não foi encontrado.`);
    }

    const updatedName = input.name ? this.normalizeTemplateName(input.name) : existing.name;
    const updatedContent = input.content !== undefined ? input.content : existing.content;
    const parameters = this.extractParameters(updatedContent);

    const updatedTemplate: WikiTemplate = {
      ...existing,
      name: updatedName,
      content: updatedContent,
      description: input.description !== undefined ? input.description : existing.description,
      category: input.category !== undefined ? input.category : existing.category,
      parameters,
      updatedAt: new Date().toISOString(),
    };

    this.saveToLocalCache(updatedTemplate);

    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        name: updatedTemplate.name,
        content: updatedTemplate.content,
        description: updatedTemplate.description,
        category: updatedTemplate.category,
        parameters: updatedTemplate.parameters,
        updatedAt: updatedTemplate.updatedAt,
        _serverTimestamp: serverTimestamp(),
      });
      return updatedTemplate;
    } catch (error) {
      console.warn('[TemplateService] Erro ao atualizar template no Firestore:', error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
      }
      return updatedTemplate;
    }
  }

  /**
   * Exclui um template pelo ID.
   */
  public static async deleteTemplate(id: string): Promise<boolean> {
    this.deleteFromLocalCache(id);

    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.warn('[TemplateService] Erro ao excluir template no Firestore:', error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
      }
      return true;
    }
  }

  /**
   * Lista todos os templates registrados, opcionalmente filtrando por categoria.
   */
  public static async listTemplates(category?: string): Promise<WikiTemplate[]> {
    try {
      const db = getDb();
      let q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
      if (category) {
        q = query(collection(db, COLLECTION_NAME), where('category', '==', category), orderBy('name', 'asc'));
      }

      const snap = await getDocs(q);
      if (!snap.empty) {
        const templates = snap.docs.map((d) => d.data() as WikiTemplate);
        // Atualiza cache local
        templates.forEach((t) => this.saveToLocalCache(t));
        return templates;
      }
    } catch (error) {
      console.warn('[TemplateService] Erro ao listar templates do Firestore, usando cache:', error);
    }

    const local = this.getFromLocalCache();
    if (category) {
      return (local || []).filter((t) => t && t.category?.toLowerCase() === category.toLowerCase());
    }
    return Array.isArray(local) ? local : (SEED_TEMPLATES || []);
  }

  // ==========================================
  // MÉTODOS PRIVADOS DE CACHE LOCAL
  // ==========================================

  private static getFromLocalCache(): WikiTemplate[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignora erro de JSON
    }
    // Inicializa com templates seed
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_TEMPLATES));
    } catch {
      // ignore
    }
    return SEED_TEMPLATES || [];
  }

  private static saveToLocalCache(template: WikiTemplate): void {
    const list = [...this.getFromLocalCache()];
    const idx = list.findIndex((t) => t && (t.id === template.id || t.name.toLowerCase() === template.name.toLowerCase()));
    if (idx >= 0) {
      list[idx] = template;
    } else {
      list.push(template);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  }

  private static deleteFromLocalCache(id: string): void {
    const list = (this.getFromLocalCache() || []).filter((t) => t && t.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  }
}
