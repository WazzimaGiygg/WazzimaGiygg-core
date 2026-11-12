export interface RecentlyReadItem {
  id: string;
  title: string;
  visitedAt: number;
  category?: string;
}

const RECENTLY_READ_STORAGE_KEY = 'wikizero_recently_read';
const MAX_RECENTLY_READ = 5;

export const RecentlyReadService = {
  /**
   * Retrieves the last 5 visited articles from localStorage.
   */
  getRecentlyRead(): RecentlyReadItem[] {
    try {
      const raw = localStorage.getItem(RECENTLY_READ_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is RecentlyReadItem => Boolean(item && item.id && item.title))
          .slice(0, MAX_RECENTLY_READ);
      }
      return [];
    } catch (err) {
      console.warn('Error reading recently read articles from localStorage:', err);
      return [];
    }
  },

  /**
   * Adds an article to recently read history in localStorage (max 5 items, latest first).
   */
  addArticle(article: { id: string; title: string; category?: string }): RecentlyReadItem[] {
    if (!article.id || !article.title) return this.getRecentlyRead();
    try {
      const current = this.getRecentlyRead();
      // Remove any existing entry for this article to deduplicate and move to top
      const filtered = current.filter(
        (item) => item.id.toLowerCase() !== article.id.toLowerCase()
      );

      const newItem: RecentlyReadItem = {
        id: article.id,
        title: article.title.trim(),
        category: article.category,
        visitedAt: Date.now(),
      };

      const updated = [newItem, ...filtered].slice(0, MAX_RECENTLY_READ);
      localStorage.setItem(RECENTLY_READ_STORAGE_KEY, JSON.stringify(updated));

      // Notify other components (like Sidebar) across the application
      window.dispatchEvent(
        new CustomEvent('wikizero_recently_read_updated', { detail: updated })
      );

      return updated;
    } catch (err) {
      console.warn('Error writing recently read article to localStorage:', err);
      return this.getRecentlyRead();
    }
  },

  /**
   * Clears the recently read history in localStorage.
   */
  clear(): void {
    try {
      localStorage.removeItem(RECENTLY_READ_STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent('wikizero_recently_read_updated', { detail: [] })
      );
    } catch (err) {
      console.warn('Error clearing recently read history in localStorage:', err);
    }
  },
};
