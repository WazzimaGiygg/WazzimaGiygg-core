import { stripHtmlToPlainText } from './text';

export const ALLOWED_ARTICLE_COLLECTIONS = [
  'wikiworldweb',
  'materiadeensaio',
  'academico',
  'materia',
  'uwgbooks',
] as const;

export type ArticleCollection = (typeof ALLOWED_ARTICLE_COLLECTIONS)[number];

export interface PortalArticleInput {
  titulo: unknown;
  descricao: unknown;
  colecao: unknown;
  setor?: unknown;
  criadorEmail: unknown;
  link?: unknown;
  visualizacoes?: unknown;
}

export interface ValidatedPortalArticle {
  titulo: string;
  descricao: string;
  colecao: ArticleCollection;
  setor: string;
  criadorEmail: string;
  visualizacoes: number;
  link?: string;
}

export interface ArticleValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: string[];
  fieldErrors: Record<string, string>;
  message: string;
}

export class ArticleValidationError extends Error {
  public readonly fieldErrors: Record<string, string>;
  public readonly errors: string[];

  constructor(message: string, fieldErrors: Record<string, string>, errors: string[]) {
    super(message);
    this.name = 'ArticleValidationError';
    this.fieldErrors = fieldErrors;
    this.errors = errors;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidOptionalUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return false;
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Strict schema validation for portal articles prior to Firestore submission.
 * Guarantees 'titulo', 'descricao', 'colecao', and required metadata are never
 * null, undefined, or out of contract.
 */
export function validatePortalArticlePayload(
  rawInput: unknown
): ArticleValidationResult<ValidatedPortalArticle> {
  const fieldErrors: Record<string, string> = {};
  const errors: string[] = [];

  if (!rawInput || typeof rawInput !== 'object' || Array.isArray(rawInput)) {
    const msg = 'Payload do artigo inválido: esperado objeto estruturado.';
    return { valid: false, errors: [msg], fieldErrors: { _form: msg }, message: msg };
  }

  const input = rawInput as PortalArticleInput;

  // 1. Validate 'titulo' (required, string, non-null/undefined, 3..300 chars)
  let cleanTitulo = '';
  if (input.titulo === null || input.titulo === undefined) {
    fieldErrors.titulo = "O campo 'titulo' é obrigatório e não pode ser nulo ou indefinido.";
  } else if (typeof input.titulo !== 'string') {
    fieldErrors.titulo = "O campo 'titulo' deve ser uma string.";
  } else {
    cleanTitulo = input.titulo.trim();
    if (cleanTitulo.length < 3) {
      fieldErrors.titulo = "O campo 'titulo' deve ter pelo menos 3 caracteres.";
    } else if (cleanTitulo.length > 300) {
      fieldErrors.titulo = "O campo 'titulo' deve ter no máximo 300 caracteres.";
    }
  }

  // 2. Validate 'descricao' (required, string, non-null/undefined, meaningful text >= 10 chars)
  let cleanDescricao = '';
  if (input.descricao === null || input.descricao === undefined) {
    fieldErrors.descricao = "O campo 'descricao' é obrigatório e não pode ser nulo ou indefinido.";
  } else if (typeof input.descricao !== 'string') {
    fieldErrors.descricao = "O campo 'descricao' deve ser uma string.";
  } else {
    cleanDescricao = input.descricao.trim();
    const plainText = stripHtmlToPlainText(cleanDescricao);
    if (!cleanDescricao || plainText.length < 10) {
      fieldErrors.descricao = "O campo 'descricao' deve conter pelo menos 10 caracteres de texto útil.";
    } else if (cleanDescricao.length > 500000) {
      fieldErrors.descricao = "O campo 'descricao' excede o limite de 500.000 caracteres.";
    }
  }

  // 3. Validate 'colecao' (required, non-null/undefined, strict enum)
  let cleanColecao: ArticleCollection = 'wikiworldweb';
  if (input.colecao === null || input.colecao === undefined) {
    fieldErrors.colecao = "O campo 'colecao' é obrigatório e não pode ser nulo ou indefinido.";
  } else if (typeof input.colecao !== 'string') {
    fieldErrors.colecao = "O campo 'colecao' deve ser uma string.";
  } else {
    const trimmedCol = input.colecao.trim();
    if (!trimmedCol) {
      fieldErrors.colecao = "O campo 'colecao' não pode estar vazio.";
    } else if (!(ALLOWED_ARTICLE_COLLECTIONS as readonly string[]).includes(trimmedCol)) {
      fieldErrors.colecao = `Coleção inválida ('${trimmedCol}'). Permitidas: ${ALLOWED_ARTICLE_COLLECTIONS.join(', ')}.`;
    } else {
      cleanColecao = trimmedCol as ArticleCollection;
    }
  }

  // 4. Validate 'criadorEmail' (required valid email string)
  let cleanEmail = '';
  if (input.criadorEmail === null || input.criadorEmail === undefined) {
    fieldErrors.criadorEmail = "O campo 'criadorEmail' é obrigatório.";
  } else if (typeof input.criadorEmail !== 'string') {
    fieldErrors.criadorEmail = "O campo 'criadorEmail' deve ser uma string.";
  } else {
    cleanEmail = input.criadorEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      fieldErrors.criadorEmail = "O campo 'criadorEmail' deve conter um endereço de e-mail válido.";
    }
  }

  // 5. Validate 'setor' (must not be null if supplied; defaults to 'Geral')
  let cleanSetor = 'Geral';
  if (input.setor === null) {
    fieldErrors.setor = "O campo 'setor' não pode ser nulo.";
  } else if (input.setor !== undefined) {
    if (typeof input.setor !== 'string') {
      fieldErrors.setor = "O campo 'setor' deve ser uma string.";
    } else {
      const trimmedSetor = input.setor.trim();
      if (trimmedSetor.length > 100) {
        fieldErrors.setor = "O campo 'setor' deve ter no máximo 100 caracteres.";
      } else if (trimmedSetor.length > 0) {
        cleanSetor = trimmedSetor;
      }
    }
  }

  // 6. Validate optional 'link'
  let cleanLink: string | undefined;
  if (input.link === null) {
    fieldErrors.link = "O campo 'link' não pode ser nulo (omita quando não utilizado).";
  } else if (input.link !== undefined) {
    if (typeof input.link !== 'string') {
      fieldErrors.link = "O campo 'link' deve ser uma string.";
    } else if (input.link.trim().length > 0) {
      if (!isValidOptionalUrl(input.link)) {
        fieldErrors.link = "O campo 'link' deve ser uma URL http(s):// ou rota interna válida.";
      } else {
        cleanLink = input.link.trim();
      }
    }
  }

  // 7. Validate optional 'visualizacoes'
  let cleanViews = 1;
  if (input.visualizacoes === null) {
    fieldErrors.visualizacoes = "O campo 'visualizacoes' não pode ser nulo.";
  } else if (input.visualizacoes !== undefined) {
    if (
      typeof input.visualizacoes !== 'number' ||
      !Number.isFinite(input.visualizacoes) ||
      input.visualizacoes < 0
    ) {
      fieldErrors.visualizacoes = "O campo 'visualizacoes' deve ser um número inteiro não negativo.";
    } else {
      cleanViews = Math.floor(input.visualizacoes);
    }
  }

  Object.values(fieldErrors).forEach((msg) => errors.push(msg));

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      fieldErrors,
      message: errors[0],
    };
  }

  const data: ValidatedPortalArticle = {
    titulo: cleanTitulo,
    descricao: cleanDescricao,
    colecao: cleanColecao,
    setor: cleanSetor,
    criadorEmail: cleanEmail,
    visualizacoes: cleanViews,
    ...(cleanLink ? { link: cleanLink } : {}),
  };

  return {
    valid: true,
    data,
    errors: [],
    fieldErrors: {},
    message: 'Esquema do artigo validado com sucesso.',
  };
}

export function assertValidPortalArticlePayload(rawInput: unknown): ValidatedPortalArticle {
  const result = validatePortalArticlePayload(rawInput);
  if (!result.valid || !result.data) {
    throw new ArticleValidationError(result.message, result.fieldErrors, result.errors);
  }
  return result.data;
}

export interface ValidatedWikiArticle {
  id: string;
  slug: string;
  title: string;
  namespace: number;
  wikitext: string;
  summary: string;
  categories: string[];
  views: number;
}

/**
 * Strict schema validation for NotMediaWiki articles prior to Firestore submission.
 */
export function validateWikiArticlePayload(
  rawInput: unknown
): ArticleValidationResult<ValidatedWikiArticle> {
  const fieldErrors: Record<string, string> = {};
  const errors: string[] = [];

  if (!rawInput || typeof rawInput !== 'object' || Array.isArray(rawInput)) {
    const msg = 'Payload do verbete Wiki inválido.';
    return { valid: false, errors: [msg], fieldErrors: { _form: msg }, message: msg };
  }

  const input = rawInput as Record<string, unknown>;

  let cleanTitle = '';
  if (input.title === null || input.title === undefined || typeof input.title !== 'string') {
    fieldErrors.title = "O campo 'title' é obrigatório e deve ser uma string.";
  } else {
    cleanTitle = input.title.trim();
    if (cleanTitle.length < 2 || cleanTitle.length > 300) {
      fieldErrors.title = "O campo 'title' deve ter entre 2 e 300 caracteres.";
    }
  }

  let cleanWikitext = '';
  if (input.wikitext === null || input.wikitext === undefined || typeof input.wikitext !== 'string') {
    fieldErrors.wikitext = "O campo 'wikitext' é obrigatório e deve ser uma string.";
  } else {
    cleanWikitext = input.wikitext.trim();
    if (cleanWikitext.length < 1) {
      fieldErrors.wikitext = "O conteúdo 'wikitext' não pode ficar vazio.";
    }
  }

  let cleanSlug = '';
  if (input.slug === null) {
    fieldErrors.slug = "O campo 'slug' não pode ser nulo.";
  } else {
    const rawSlug = typeof input.slug === 'string' && input.slug.trim() ? input.slug.trim() : cleanTitle;
    if (!rawSlug) {
      fieldErrors.slug = "O campo 'slug' é obrigatório e não pode ser nulo ou vazio.";
    } else {
      cleanSlug = rawSlug.replace(/\s+/g, '_').toLowerCase();
      if (cleanSlug.length > 200) {
        fieldErrors.slug = "O campo 'slug' excede 200 caracteres.";
      }
    }
  }

  let cleanSummary = '';
  if (input.summary === null) {
    fieldErrors.summary = "O campo 'summary' não pode ser nulo.";
  } else if (typeof input.summary === 'string' && input.summary.trim().length > 0) {
    cleanSummary = input.summary.trim();
  } else if (cleanWikitext) {
    cleanSummary = cleanWikitext.substring(0, 160).replace(/[=[\]{}|]/g, '').trim() || cleanTitle;
  }

  let cleanCategories: string[] = ['Geral'];
  if (input.categories === null) {
    fieldErrors.categories = "O campo 'categories' não pode ser nulo.";
  } else if (Array.isArray(input.categories)) {
    cleanCategories = input.categories
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      .map((c) => c.trim());
  }

  let cleanViews = 1;
  if (input.views === null) {
    fieldErrors.views = "O campo 'views' não pode ser nulo.";
  } else if (
    typeof input.views === 'number' &&
    Number.isFinite(input.views) &&
    input.views >= 0
  ) {
    cleanViews = Math.floor(input.views);
  }

  let cleanId = `art-${Date.now()}`;
  if (input.id === null) {
    fieldErrors.id = "O campo 'id' não pode ser nulo.";
  } else if (typeof input.id === 'string' && input.id.trim().length > 0) {
    cleanId = input.id.trim();
  }

  let cleanNamespace = 0;
  if (input.namespace === null) {
    fieldErrors.namespace = "O campo 'namespace' não pode ser nulo.";
  } else if (typeof input.namespace === 'number' && Number.isFinite(input.namespace)) {
    cleanNamespace = input.namespace;
  }

  Object.values(fieldErrors).forEach((msg) => errors.push(msg));
  if (errors.length > 0) {
    return { valid: false, errors, fieldErrors, message: errors[0] };
  }

  return {
    valid: true,
    data: {
      id: cleanId,
      slug: cleanSlug,
      title: cleanTitle,
      namespace: cleanNamespace,
      wikitext: cleanWikitext,
      summary: cleanSummary || cleanTitle,
      categories: cleanCategories.length > 0 ? cleanCategories : ['Geral'],
      views: cleanViews,
    },
    errors: [],
    fieldErrors: {},
    message: 'Esquema do verbete Wiki validado.',
  };
}

export function assertValidWikiArticlePayload(rawInput: unknown): ValidatedWikiArticle {
  const result = validateWikiArticlePayload(rawInput);
  if (!result.valid || !result.data) {
    throw new ArticleValidationError(result.message, result.fieldErrors, result.errors);
  }
  return result.data;
}
