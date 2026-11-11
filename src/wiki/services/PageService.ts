/**
 * @file PageService.ts
 * @description Serviço principal de gerenciamento de Páginas, Namespaces e Categorias
 * no Firestore para o WikiZero, inspirado no modelo de dados do MediaWiki.
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
import { Page, PageNamespace, CreatePageInput, UpdatePageInput } from '../types';
import { TemplateService } from './TemplateService';

const COLLECTION_NAME = 'pages';
const LOCAL_STORAGE_KEY = 'wikizero_pages_v3_namespaces';

// Lista de namespaces canônicos suportados pelo WikiZero
export const VALID_NAMESPACES: PageNamespace[] = [
  'main',
  'talk',
  'user',
  'user_talk',
  'project',
  'project_talk',
  'file',
  'file_talk',
  'mediawiki',
  'mediawiki_talk',
  'template',
  'template_talk',
  'help',
  'help_talk',
  'category',
  'category_talk',
  'portal',
  'draft',
  'special',
];

// Mapa de prefixos populares em português para namespaces
export const NAMESPACE_PREFIX_MAP: Record<string, PageNamespace> = {
  '': 'main',
  'principal': 'main',
  'discussão': 'talk',
  'discussao': 'talk',
  'talk': 'talk',
  'usuário': 'user',
  'usuario': 'user',
  'user': 'user',
  'usuário_discussão': 'user_talk',
  'user_talk': 'user_talk',
  'wikizero': 'project',
  'projeto': 'project',
  'project': 'project',
  'ficheiro': 'file',
  'arquivo': 'file',
  'file': 'file',
  'mediawiki': 'mediawiki',
  'predefinição': 'template',
  'predefinicao': 'template',
  'template': 'template',
  'ajuda': 'help',
  'help': 'help',
  'categoria': 'category',
  'category': 'category',
  'portal': 'portal',
  'rascunho': 'draft',
  'draft': 'draft',
  'especial': 'special',
  'special': 'special',
};

// Páginas iniciais para inicialização local e fallback
const SEED_PAGES: Page[] = [
  {
    id: 'main:pagina_principal',
    namespace: 'main',
    title: 'Página Principal',
    content: `== Bem-vindo ao WikiZero ==\n''«Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»''\n\nA enciclopédia livre, comunitária e multilíngue com suporte a Namespaces, Categorias e Predefinições.\n\n[[Categoria:Enciclopédia]] [[Categoria:Wiki]]`,
    categories: ['Enciclopédia', 'Wiki', 'Destaque'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    authorName: 'Comunidade WikiZero',
  },
  {
    id: 'help:como_editar',
    namespace: 'help',
    title: 'Como Editar',
    content: `== Guia Básico de Edição ==\nPara formatar textos no WikiZero utilize marcação Wikitext ou selecione uma Predefinição (Template).\n\n* '''Negrito''': <code>\'\'\'texto\'\'\'</code>\n* ''Itálico'': <code>\'\'texto\'\'</code>\n* Links: <code>[[Nome do Artigo]]</code>\n\n[[Categoria:Ajuda]]`,
    categories: ['Ajuda', 'Tutoriais'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    authorName: 'Equipe de Documentação',
  },
  {
    id: 'project:politicas',
    namespace: 'project',
    title: 'Políticas e Diretrizes',
    content: `== Princípios Fundamentais ==\n1. Ponto de vista neutro (NPOV)\n2. Verificabilidade das fontes\n3. Respeito mútuo e civilidade\n\n[[Categoria:Políticas]]`,
    categories: ['Políticas', 'Diretrizes'],
    templateName: 'Aviso',
    templateParams: {
      titulo: 'Diretriz Oficial',
      texto: 'Esta página documenta as normas comunitárias em vigor no WikiZero.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    authorName: 'Conselho Editorial',
  },
];

export class PageService {
  /**
   * Converte título e namespace em um identificador determinístico e seguro para Firestore.
   * Ex: namespace='main', title='História do Brasil' -> 'main:historia_do_brasil'
   */
  public static generatePageId(namespace: PageNamespace, title: string): string {
    const cleanNamespace = (namespace || 'main').toLowerCase().trim();
    const cleanTitle = title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w\u00C0-\u017F-]/g, '');
    return `${cleanNamespace}:${cleanTitle || 'sem_titulo'}`;
  }

  /**
   * Faz o parse de um título completo com prefixo de namespace.
   * Ex: "Ajuda:Guia de Edição" -> { namespace: 'help', title: 'Guia de Edição' }
   * Ex: "História Geral" -> { namespace: 'main', title: 'História Geral' }
   */
  public static parseFullTitle(fullTitle: string): { namespace: PageNamespace; title: string } {
    if (!fullTitle) {
      return { namespace: 'main', title: '' };
    }

    const colonIndex = fullTitle.indexOf(':');
    if (colonIndex > 0) {
      const prefix = fullTitle.substring(0, colonIndex).trim().toLowerCase();
      const rest = fullTitle.substring(colonIndex + 1).trim();

      if (NAMESPACE_PREFIX_MAP[prefix]) {
        return {
          namespace: NAMESPACE_PREFIX_MAP[prefix],
          title: rest,
        };
      }
    }

    return {
      namespace: 'main',
      title: fullTitle.trim(),
    };
  }

  /**
   * Extrai categorias declaradas no wikitext (ex: [[Categoria:História]] ou [[Category:History]]).
   */
  public static extractCategoriesFromContent(content: string): string[] {
    const categoryRegex = /\[\[(?:Categoria|Category):([^\]|]+)(?:\|[^\]]*)?\]\]/gi;
    const categories = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = categoryRegex.exec(content)) !== null) {
      const cat = match[1].trim();
      if (cat) {
        categories.add(cat);
      }
    }

    return Array.from(categories);
  }

  /**
   * Valida se o namespace e o título são consistentes e seguros.
   */
  public static validatePageData(namespace: string, title: string): { isValid: boolean; error?: string } {
    if (!title || !title.trim()) {
      return { isValid: false, error: 'O título da página é obrigatório.' };
    }

    if (title.length > 255) {
      return { isValid: false, error: 'O título não pode exceder 255 caracteres.' };
    }

    if (!namespace || !namespace.trim()) {
      return { isValid: false, error: 'O namespace é obrigatório.' };
    }

    return { isValid: true };
  }

  /**
   * Cria uma nova página no Firestore e persiste em cache.
   *
   * @param data Dados de entrada para criação da página
   * @returns A entidade Page criada
   */
  public static async createPage(data: CreatePageInput): Promise<Page> {
    const validation = this.validatePageData(data.namespace, data.title);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const namespace = (data.namespace || 'main').toLowerCase().trim() as PageNamespace;
    const title = data.title.trim();
    const pageId = this.generatePageId(namespace, title);
    const now = new Date().toISOString();

    // Extrai categorias presentes no corpo do texto e une com as categorias passadas explicitamente
    const contentCategories = this.extractCategoriesFromContent(data.content || '');
    const combinedCategories = Array.from(
      new Set([...(data.categories || []), ...contentCategories])
    );

    const auth = getAuthSafe();
    const currentUser = auth?.currentUser;

    const newPage: Page = {
      id: pageId,
      namespace,
      title,
      content: data.content || '',
      categories: combinedCategories,
      templateName: data.templateName || undefined,
      templateParams: data.templateParams || undefined,
      authorUid: data.authorUid || currentUser?.uid || 'anonymous',
      authorName: data.authorName || currentUser?.displayName || 'Editor WikiZero',
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    // Atualiza cache local imediatamente
    this.saveToLocalCache(newPage);

    // Grava no Firestore
    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, pageId);
      await setDoc(docRef, {
        ...newPage,
        _serverTimestamp: serverTimestamp(),
      });

      // Se a página foi criada no namespace 'main', cria automaticamente a página correspondente em 'talk' se ainda não existir
      if (namespace === 'main') {
        this.ensureTalkPageExists(title, data.authorUid || currentUser?.uid, (data.authorName || currentUser?.displayName) ?? undefined).catch(
          (talkErr) => console.warn('[PageService] Aviso ao criar página de discussão correspondente:', talkErr)
        );
      }

      return newPage;
    } catch (error) {
      console.warn('[PageService] Erro ao gravar página no Firestore, fallback para cache local:', error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${pageId}`);
      }

      // Tenta criar página de discussão no cache local também
      if (namespace === 'main') {
        this.ensureTalkPageExists(title, data.authorUid || currentUser?.uid, (data.authorName || currentUser?.displayName) ?? undefined).catch(() => {});
      }

      return newPage;
    }
  }

  /**
   * Garante que uma página de discussão 'talk:{title}' exista ao criar um artigo no namespace 'main'.
   */
  public static async ensureTalkPageExists(
    mainTitle: string,
    authorUid?: string,
    authorName?: string
  ): Promise<Page | null> {
    const talkPageId = this.generatePageId('talk', mainTitle);
    const existing = await this.getPage('talk', mainTitle);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const initialTalkContent = `== Discussão sobre ${mainTitle} ==\nEsta é a página de discussão para debater melhorias, fontes e edições no artigo [[${mainTitle}]].\n\n* Por favor, mantenha o diálogo cordial e assine suas mensagens.\n* Utilize tópicos claros para propor alterações.\n`;

    const talkPage: Page = {
      id: talkPageId,
      namespace: 'talk',
      title: mainTitle,
      content: initialTalkContent,
      categories: ['Páginas de discussão'],
      authorUid: authorUid || 'system',
      authorName: authorName || 'Sistema WikiZero',
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this.saveToLocalCache(talkPage);

    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, talkPageId);
      await setDoc(docRef, {
        ...talkPage,
        _serverTimestamp: serverTimestamp(),
      });
      return talkPage;
    } catch (err) {
      console.warn('[PageService] Não foi possível persistir talk page no Firestore:', err);
      return talkPage;
    }
  }

  /**
   * Obtém uma página com base em seu namespace e título.
   *
   * @param namespace Namespace da página (ex: 'main', 'talk', 'help')
   * @param title Título da página
   * @returns Page encontrada ou null
   */
  public static async getPage(namespace: string, title: string): Promise<Page | null> {
    if (!title || !title.trim()) return null;

    const cleanNamespace = (namespace || 'main').toLowerCase().trim() as PageNamespace;
    const cleanTitle = title.trim();
    const pageId = this.generatePageId(cleanNamespace, cleanTitle);

    // 1. Tenta buscar no Firestore pelo ID determinístico
    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, pageId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const page = snap.data() as Page;
        this.saveToLocalCache(page);
        return page;
      }

      // 2. Tenta buscar por consulta de campos caso o ID tenha pequenas variações
      const q = query(
        collection(db, COLLECTION_NAME),
        where('namespace', '==', cleanNamespace),
        where('title', '==', cleanTitle)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const page = querySnap.docs[0].data() as Page;
        this.saveToLocalCache(page);
        return page;
      }
    } catch (error) {
      console.warn('[PageService] Erro ao consultar Firestore em getPage, consultando cache local:', error);
    }

    // 3. Fallback para cache local
    const localPages = this.getFromLocalCache();
    const found = localPages.find(
      (p) =>
        p.id === pageId ||
        (p.namespace === cleanNamespace && p.title.toLowerCase() === cleanTitle.toLowerCase())
    );

    return found || null;
  }

  /**
   * Lista todas as páginas pertencentes a um namespace específico.
   *
   * @param namespace Namespace a ser listado (ex: 'main', 'help', 'project')
   */
  public static async listPagesByNamespace(namespace: string): Promise<Page[]> {
    const cleanNamespace = (namespace || 'main').toLowerCase().trim();

    try {
      const db = getDb();
      const q = query(
        collection(db, COLLECTION_NAME),
        where('namespace', '==', cleanNamespace),
        orderBy('title', 'asc')
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        const pages = snap.docs.map((d) => d.data() as Page);
        pages.forEach((p) => this.saveToLocalCache(p));
        return pages;
      }
    } catch (error) {
      console.warn('[PageService] Erro ao listar páginas por namespace no Firestore, usando cache:', error);
    }

    const localPages = this.getFromLocalCache();
    return (localPages || [])
      .filter((p) => p && p.namespace === cleanNamespace)
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  /**
   * Retorna todas as páginas associadas a uma categoria específica.
   *
   * @param category Nome da categoria (ex: 'História', 'Ciência')
   */
  public static async getPagesByCategory(category: string): Promise<Page[]> {
    if (!category || !category.trim()) return [];
    const cleanCategory = category.trim();

    try {
      const db = getDb();
      const q = query(
        collection(db, COLLECTION_NAME),
        where('categories', 'array-contains', cleanCategory)
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        const pages = snap.docs.map((d) => d.data() as Page);
        pages.forEach((p) => this.saveToLocalCache(p));
        return pages;
      }
    } catch (error) {
      console.warn('[PageService] Erro ao buscar páginas por categoria no Firestore, usando cache:', error);
    }

    const localPages = this.getFromLocalCache();
    return (localPages || []).filter((p) =>
      p && p.categories?.some((c) => c && c.toLowerCase() === cleanCategory.toLowerCase())
    );
  }

  /**
   * Retorna todas as páginas registradas na enciclopédia.
   */
  public static async getAllPages(): Promise<Page[]> {
    try {
      const db = getDb();
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        const pages = snap.docs.map((d) => d.data() as Page);
        pages.forEach((p) => this.saveToLocalCache(p));
        return pages;
      }
    } catch (error) {
      console.warn('[PageService] Erro ao buscar todas as páginas no Firestore, usando cache:', error);
    }

    const cached = this.getFromLocalCache();
    return Array.isArray(cached) ? cached : (SEED_PAGES || []);
  }

  /**
   * Renderiza o conteúdo final da página:
   * - Se a página tiver um `templateName`, busca a predefinição correspondente e
   *   substitui as tags `{{{param}}}` pelos valores definidos em `templateParams` e `content`.
   * - Caso contrário, retorna o `content` original diretamente.
   *
   * @param page A página a ser renderizada
   * @returns O texto/HTML final pronto para exibição
   */
  public static async renderPage(page: Page): Promise<string> {
    if (!page) return '';

    // Se a página não utiliza nenhum template, retorna o conteúdo puro
    if (!page.templateName || !page.templateName.trim()) {
      return page.content || '';
    }

    try {
      // Busca o template no serviço de templates
      const template = await TemplateService.getTemplate(page.templateName);

      if (template && template.content) {
        // Renderiza o template mesclando os parâmetros com o corpo da página
        const rendered = TemplateService.render(
          template.content,
          page.templateParams || {},
          page.content || ''
        );
        return rendered;
      } else {
        console.warn(
          `[PageService] Template "${page.templateName}" não encontrado para a página "${page.title}". Exibindo conteúdo padrão.`
        );
        return page.content || '';
      }
    } catch (error) {
      console.error('[PageService] Erro ao renderizar template da página:', error);
      return page.content || '';
    }
  }

  /**
   * Atualiza uma página existente, incrementando sua versão e recalculando categorias.
   */
  public static async updatePage(id: string, data: UpdatePageInput): Promise<Page> {
    const localPages = this.getFromLocalCache();
    const existing = localPages.find((p) => p.id === id);

    if (!existing) {
      throw new Error(`Página com ID "${id}" não encontrada.`);
    }

    const newContent = data.content !== undefined ? data.content : existing.content;
    const contentCategories = this.extractCategoriesFromContent(newContent);
    const newCategories = data.categories !== undefined
      ? Array.from(new Set([...data.categories, ...contentCategories]))
      : Array.from(new Set([...existing.categories, ...contentCategories]));

    const updatedPage: Page = {
      ...existing,
      content: newContent,
      categories: newCategories,
      templateName: data.templateName !== undefined ? (data.templateName || undefined) : existing.templateName,
      templateParams: data.templateParams !== undefined ? data.templateParams : existing.templateParams,
      updatedAt: new Date().toISOString(),
      version: (existing.version || 1) + 1,
    };

    this.saveToLocalCache(updatedPage);

    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        content: updatedPage.content,
        categories: updatedPage.categories,
        templateName: updatedPage.templateName || null,
        templateParams: updatedPage.templateParams || null,
        updatedAt: updatedPage.updatedAt,
        version: updatedPage.version,
        _serverTimestamp: serverTimestamp(),
      });
      return updatedPage;
    } catch (error) {
      console.warn('[PageService] Erro ao atualizar página no Firestore:', error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
      }
      return updatedPage;
    }
  }

  /**
   * Exclui uma página pelo ID.
   */
  public static async deletePage(id: string): Promise<boolean> {
    this.deleteFromLocalCache(id);

    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.warn('[PageService] Erro ao deletar página no Firestore:', error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
      }
      return true;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS DE CACHE LOCAL
  // ==========================================

  private static getFromLocalCache(): Page[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignora erro de JSON
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_PAGES));
    } catch {
      // localStorage quota or private browsing
    }
    return SEED_PAGES || [];
  }

  private static saveToLocalCache(page: Page): void {
    const list = [...this.getFromLocalCache()];
    const idx = list.findIndex((p) => p && p.id === page.id);
    if (idx >= 0) {
      list[idx] = page;
    } else {
      list.push(page);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  }

  private static deleteFromLocalCache(id: string): void {
    const list = (this.getFromLocalCache() || []).filter((p) => p && p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  }
}
