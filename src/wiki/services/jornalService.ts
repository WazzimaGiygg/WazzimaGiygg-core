import { JornalArticle } from '../types/news';
import fallbackArticlesData from '../data/fallbackJornalArticles.json';

const JORNAL_FIRESTORE_REST_URL =
  'https://firestore.googleapis.com/v1/projects/wzzm-ce3fc/databases/(default)/documents/articlesdoc?pageSize=100';

class JornalService {
  private cache: JornalArticle[] | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

  /**
   * Fetches published news articles strictly in READ-ONLY mode from Jornal WazzimaGiygg.
   * Does NOT alter, create or mutate any documents on the source repository/database.
   */
  async getArticles(forceRefresh = false): Promise<JornalArticle[]> {
    const now = Date.now();
    if (!forceRefresh && this.cache && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cache;
    }

    try {
      const response = await fetch(JORNAL_FIRESTORE_REST_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Falha na requisição ao Jornal: status ${response.status}`);
      }

      const json = await response.json();
      const rawDocs = json.documents || [];

      const parsedArticles: JornalArticle[] = [];

      for (const doc of rawDocs) {
        const fields = doc.fields || {};
        const id = doc.name ? doc.name.split('/').pop() : Math.random().toString(36).substring(2);
        const titulo = fields.titulo?.stringValue;

        // Skip invalid/blank drafts
        if (!titulo || titulo.trim() === '' || titulo.toLowerCase() === 'undefined') {
          continue;
        }

        const subtitulo = fields.subtitulo?.stringValue || '';
        const categoria = (fields.categoria?.stringValue || 'geral').toLowerCase().trim();
        const autorNome = fields.autorNome?.stringValue || 'WazzimaGiygg';
        const autorEmail = fields.autorEmail?.stringValue || '';
        const autorId = fields.autorId?.stringValue || '';
        const resumo = fields.resumo?.stringValue || '';
        const conteudo = fields.conteudo?.stringValue || fields.resumo?.stringValue || '';
        const imagemUrl = fields.imagemUrl?.stringValue || '';
        const dataPublicacao =
          fields.dataPublicacao?.timestampValue ||
          doc.createTime ||
          new Date().toISOString();
        const visualizacoes = parseInt(fields.visualizacoes?.integerValue || '0', 10);
        const destaque = fields.destaque?.booleanValue || false;

        parsedArticles.push({
          id,
          titulo,
          subtitulo,
          categoria,
          autorNome,
          autorEmail,
          autorId,
          resumo,
          conteudo,
          imagemUrl,
          dataPublicacao,
          visualizacoes,
          destaque,
        });
      }

      // Sort by publication date descending
      parsedArticles.sort((a, b) => {
        const timeA = new Date(a.dataPublicacao).getTime() || 0;
        const timeB = new Date(b.dataPublicacao).getTime() || 0;
        return timeB - timeA;
      });

      if (parsedArticles.length > 0) {
        this.cache = parsedArticles;
        this.lastFetchTime = now;
        return parsedArticles;
      }
    } catch (err) {
      console.warn('⚠️ Não foi possível obter notícias do Jornal WazzimaGiygg online, utilizando acervo espelhado:', err);
    }

    // Fallback to bundled mirror articles
    const fallbackList = (fallbackArticlesData as JornalArticle[]).sort((a, b) => {
      const timeA = new Date(a.dataPublicacao).getTime() || 0;
      const timeB = new Date(b.dataPublicacao).getTime() || 0;
      return timeB - timeA;
    });

    this.cache = fallbackList;
    this.lastFetchTime = now;
    return fallbackList;
  }

  /**
   * Retrieves a single article by ID strictly in read-only mode.
   */
  async getArticleById(id: string): Promise<JornalArticle | null> {
    const articles = await this.getArticles();
    return articles.find((a) => a.id === id) || null;
  }

  /**
   * Filters articles by query and category.
   */
  filterArticles(
    articles: JornalArticle[],
    categoria = 'todos',
    busca = '',
    ordenacao: 'recentes' | 'antigos' | 'populares' = 'recentes'
  ): JornalArticle[] {
    let result = [...articles];

    if (categoria && categoria !== 'todos') {
      result = result.filter(
        (a) => a.categoria.toLowerCase() === categoria.toLowerCase()
      );
    }

    if (busca.trim()) {
      const q = busca.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.titulo.toLowerCase().includes(q) ||
          a.subtitulo?.toLowerCase().includes(q) ||
          a.resumo.toLowerCase().includes(q) ||
          a.categoria.toLowerCase().includes(q) ||
          a.autorNome.toLowerCase().includes(q)
      );
    }

    if (ordenacao === 'recentes') {
      result.sort((a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime());
    } else if (ordenacao === 'antigos') {
      result.sort((a, b) => new Date(a.dataPublicacao).getTime() - new Date(b.dataPublicacao).getTime());
    } else if (ordenacao === 'populares') {
      result.sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0));
    }

    return result;
  }
}

export const jornalService = new JornalService();
