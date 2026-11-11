/**
 * githubDiffService.ts
 * Serviço especializado para integração direta com a API pública do GitHub
 * Repositório Oficial: https://github.com/WazzimaGiygg/Wiki-alternative
 * Permite visualizar o histórico de commits, os diffs unificados e os detalhes de código
 */

export interface GitHubCommitFile {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed' | string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  blob_url?: string;
  raw_url?: string;
  previous_filename?: string;
}

export interface GitHubCommitSummary {
  sha: string;
  shortSha: string;
  message: string;
  headline: string;
  body?: string;
  authorName: string;
  authorLogin?: string;
  authorAvatar?: string;
  date: string;
  htmlUrl: string;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
  filesCount?: number;
  files?: GitHubCommitFile[];
  loadedDetailedDiff?: boolean;
}

export interface ParsedDiffLine {
  type: 'header' | 'add' | 'delete' | 'context';
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface GitHubCompareResult {
  baseSha: string;
  headSha: string;
  status: string;
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  commits: GitHubCommitSummary[];
  files: GitHubCommitFile[];
  htmlUrl: string;
}

export const GITHUB_REPO_CONFIG = {
  owner: 'WazzimaGiygg',
  repo: 'Wiki-alternative',
  branch: 'main',
  repoUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative',
  apiBase: 'https://api.github.com/repos/WazzimaGiygg/Wiki-alternative',
};

// Seed de commits recentes para renderização instantânea (zero delay & offline fallback)
const INITIAL_SEEDED_COMMITS: GitHubCommitSummary[] = [
  {
    sha: 'e3e28bc5bc20086a4ff66db25eed67035ab16532',
    shortSha: 'e3e28bc',
    message: 'feat: implement emergency contact system\n\nAdd EmergencyContactView and supporting Firestore rules to handle critical reports such as doxxing or threats. Includes real-time updates for Arbitration Committee and admin tickets.',
    headline: 'feat: implement emergency contact system',
    body: 'Add EmergencyContactView and supporting Firestore rules to handle critical reports such as doxxing or threats. Includes real-time updates for Arbitration Committee and admin tickets.',
    authorName: 'WazzimaGiygg',
    authorLogin: 'WazzimaGiygg',
    authorAvatar: 'https://avatars.githubusercontent.com/u/40279038?v=4',
    date: '2026-09-06T14:32:57Z',
    htmlUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative/commit/e3e28bc5bc20086a4ff66db25eed67035ab16532',
    stats: { total: 3267, additions: 3262, deletions: 5 },
    filesCount: 14,
  },
  {
    sha: '087d5f389ebdb94f37c164a11e80268db4fa2611',
    shortSha: '087d5f3',
    message: 'feat(system): implement Firebase sync for system updates\n\nAdd SystemUpdateEntry schema and Firestore rules to support persistent, admin-managed version updates. Update storage service with atomic batch sync capabilities and role-based access control for system updates.',
    headline: 'feat(system): implement Firebase sync for system updates',
    body: 'Add SystemUpdateEntry schema and Firestore rules to support persistent, admin-managed version updates. Update storage service with atomic batch sync capabilities and role-based access control for system updates.',
    authorName: 'WazzimaGiygg',
    authorLogin: 'WazzimaGiygg',
    authorAvatar: 'https://avatars.githubusercontent.com/u/40279038?v=4',
    date: '2026-09-06T01:37:14Z',
    htmlUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative/commit/087d5f389ebdb94f37c164a11e80268db4fa2611',
    stats: { total: 350, additions: 340, deletions: 10 },
    filesCount: 6,
  },
  {
    sha: '327e04b2c39554275ab043b70be9849f52f09712',
    shortSha: '327e04b',
    message: 'feat: add daily edit limit functionality\n\nImplement a daily limit of 5 edits for standard users, including exemption logic for administrators and moderators, and UI feedback for tracking edit availability.',
    headline: 'feat: add daily edit limit functionality',
    body: 'Implement a daily limit of 5 edits for standard users, including exemption logic for administrators and moderators, and UI feedback for tracking edit availability.',
    authorName: 'WazzimaGiygg',
    authorLogin: 'WazzimaGiygg',
    authorAvatar: 'https://avatars.githubusercontent.com/u/40279038?v=4',
    date: '2026-09-06T01:27:54Z',
    htmlUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative/commit/327e04b2c39554275ab043b70be9849f52f09712',
    stats: { total: 180, additions: 172, deletions: 8 },
    filesCount: 4,
  },
  {
    sha: '5d4ae3fb88fe17c3cffeaabf6e97367d4f129842',
    shortSha: '5d4ae3f',
    message: 'feat: add JSON importer for system updates\n\n- Implement JSON file import capability in site updates view.\n- Update Firebase initialization to use experimental long polling.\n- Refactor connection health check to use read-only queries.\n- Add navigation bridge between admin dashboard and updates.',
    headline: 'feat: add JSON importer for system updates',
    body: '- Implement JSON file import capability in site updates view.\n- Update Firebase initialization to use experimental long polling.\n- Refactor connection health check to use read-only queries.\n- Add navigation bridge between admin dashboard and updates.',
    authorName: 'WazzimaGiygg',
    authorLogin: 'WazzimaGiygg',
    authorAvatar: 'https://avatars.githubusercontent.com/u/40279038?v=4',
    date: '2026-09-06T01:15:26Z',
    htmlUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative/commit/5d4ae3fb88fe17c3cffeaabf6e97367d4f129842',
    stats: { total: 420, additions: 395, deletions: 25 },
    filesCount: 5,
  },
  {
    sha: '78919f7ea054bc7f1905d3194e5576bace879f7e',
    shortSha: '78919f7',
    message: 'feat: add real-time collaboration features\n\n- Add schemas for RecentChanges, TalkThreads, and UserTalkMessages\n- Implement real-time subscriptions for recent changes and talk threads\n- Update Firestore rules for enhanced role-based access control\n- Add online users tracking support to Header component',
    headline: 'feat: add real-time collaboration features',
    body: '- Add schemas for RecentChanges, TalkThreads, and UserTalkMessages\n- Implement real-time subscriptions for recent changes and talk threads\n- Update Firestore rules for enhanced role-based access control\n- Add online users tracking support to Header component',
    authorName: 'WazzimaGiygg',
    authorLogin: 'WazzimaGiygg',
    authorAvatar: 'https://avatars.githubusercontent.com/u/40279038?v=4',
    date: '2026-09-04T15:58:54Z',
    htmlUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative/commit/78919f7ea054bc7f1905d3194e5576bace879f7e',
    stats: { total: 850, additions: 790, deletions: 60 },
    filesCount: 8,
  },
  {
    sha: '954bac7596d9f862c151e068ffc4aa7a520dfebb',
    shortSha: '954bac7',
    message: 'refactor: prioritize UID for user identification\n\nStandardized user identification to use uid as the primary key across the application, improving reliability in routing and profile management. Updated the UI to display the UID and enforced unique user page creation logic.',
    headline: 'refactor: prioritize UID for user identification',
    body: 'Standardized user identification to use uid as the primary key across the application, improving reliability in routing and profile management. Updated the UI to display the UID and enforced unique user page creation logic.',
    authorName: 'WazzimaGiygg',
    authorLogin: 'WazzimaGiygg',
    authorAvatar: 'https://avatars.githubusercontent.com/u/40279038?v=4',
    date: '2026-09-04T15:28:58Z',
    htmlUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative/commit/954bac7596d9f862c151e068ffc4aa7a520dfebb',
    stats: { total: 290, additions: 180, deletions: 110 },
    filesCount: 6,
  },
  {
    sha: 'c3eff2b0f4aa838390e6004abfdb6663611a493b',
    shortSha: 'c3eff2b',
    message: 'feat: implement real-time sync and update rules\n\n- Add real-time Firestore subscriptions in App.tsx\n- Update Firestore security rules for community modules\n- Add empty state handling to WikiHub\n- Cleanup initial seed data to optimize project load',
    headline: 'feat: implement real-time sync and update rules',
    body: '- Add real-time Firestore subscriptions in App.tsx\n- Update Firestore security rules for community modules\n- Add empty state handling to WikiHub\n- Cleanup initial seed data to optimize project load',
    authorName: 'WazzimaGiygg',
    authorLogin: 'WazzimaGiygg',
    authorAvatar: 'https://avatars.githubusercontent.com/u/40279038?v=4',
    date: '2026-09-03T18:17:16Z',
    htmlUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative/commit/c3eff2b0f4aa838390e6004abfdb6663611a493b',
    stats: { total: 540, additions: 480, deletions: 60 },
    filesCount: 7,
  },
  {
    sha: 'fa15e2361f7ebd2662a7963ed9b16862cae7276a',
    shortSha: 'fa15e23',
    message: 'feat: implement user ban system and global articles\n\n- Enforce ban checks on authentication and app initialization\n- Add persistent /articles collection in Firestore\n- Refactor auth flow to support asynchronous guest user creation\n- Update security rules to validate user status against bans',
    headline: 'feat: implement user ban system and global articles',
    body: '- Enforce ban checks on authentication and app initialization\n- Add persistent /articles collection in Firestore\n- Refactor auth flow to support asynchronous guest user creation\n- Update security rules to validate user status against bans',
    authorName: 'WazzimaGiygg',
    authorLogin: 'WazzimaGiygg',
    authorAvatar: 'https://avatars.githubusercontent.com/u/40279038?v=4',
    date: '2026-09-03T01:16:55Z',
    htmlUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative/commit/fa15e2361f7ebd2662a7963ed9b16862cae7276a',
    stats: { total: 610, additions: 550, deletions: 60 },
    filesCount: 6,
  },
  {
    sha: '8999e37a26bcdfb1832e080ee525d617a89b7355',
    shortSha: '8999e37',
    message: 'refactor(firestore): simplify security rules\n\nRemove legacy collections and standardize public read access for pages and versions to improve maintainability.',
    headline: 'refactor(firestore): simplify security rules',
    body: 'Remove legacy collections and standardize public read access for pages and versions to improve maintainability.',
    authorName: 'WazzimaGiygg',
    authorLogin: 'WazzimaGiygg',
    authorAvatar: 'https://avatars.githubusercontent.com/u/40279038?v=4',
    date: '2026-09-02T22:32:55Z',
    htmlUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative/commit/8999e37a26bcdfb1832e080ee525d617a89b7355',
    stats: { total: 110, additions: 40, deletions: 70 },
    filesCount: 1,
  },
  {
    sha: '79e97803cb971da6cd7b37f2ccafce525a8a6a62',
    shortSha: '79e9780',
    message: 'fix(security): restrict access for banned users\n\nUpdated Firestore rules to verify ban status in authentication helper functions, preventing banned users from performing CRUD operations.',
    headline: 'fix(security): restrict access for banned users',
    body: 'Updated Firestore rules to verify ban status in authentication helper functions, preventing banned users from performing CRUD operations.',
    authorName: 'WazzimaGiygg',
    authorLogin: 'WazzimaGiygg',
    authorAvatar: 'https://avatars.githubusercontent.com/u/40279038?v=4',
    date: '2026-09-02T22:27:06Z',
    htmlUrl: 'https://github.com/WazzimaGiygg/Wiki-alternative/commit/79e97803cb971da6cd7b37f2ccafce525a8a6a62',
    stats: { total: 45, additions: 40, deletions: 5 },
    filesCount: 1,
  },
];

const STORAGE_KEY_COMMITS = 'wikizero_github_commits_cache';
const STORAGE_KEY_COMMIT_DETAILS_PREFIX = 'wikizero_github_commit_diff_';

export class GitHubDiffService {
  /**
   * Obtém a lista dos commits recentes diretamente da API do GitHub
   * com fallback transparente para cache local e sementes do repositório
   */
  static async getRecentCommits(
    perPage = 30,
    forceRefresh = false
  ): Promise<{
    commits: GitHubCommitSummary[];
    source: 'github_api' | 'local_cache' | 'seed';
    rateLimitRemaining?: number;
    error?: string;
  }> {
    if (!forceRefresh) {
      const cached = this._getLocalCommitsCache();
      if (cached && cached.length > 0) {
        // Tenta revalidar em segundo plano sem bloquear a interface
        this._revalidateCommitsInBackground(perPage);
        return { commits: cached, source: 'local_cache' };
      }
    }

    try {
      const response = await fetch(
        `${GITHUB_REPO_CONFIG.apiBase}/commits?per_page=${perPage}&sha=${GITHUB_REPO_CONFIG.branch}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
        ? parseInt(response.headers.get('x-ratelimit-remaining')!, 10)
        : undefined;

      if (!response.ok) {
        throw new Error(`GitHub API HTTP ${response.status}: ${response.statusText}`);
      }

      const rawCommits = await response.json();
      if (!Array.isArray(rawCommits)) {
        throw new Error('Resposta inesperada da API do GitHub');
      }

      const parsedCommits: GitHubCommitSummary[] = rawCommits.map((item: any) => {
        const fullMessage: string = item.commit?.message || '';
        const lines = fullMessage.split('\n');
        const headline = lines[0] || 'Atualização de código';
        const body = lines.slice(1).join('\n').trim();

        return {
          sha: item.sha,
          shortSha: item.sha.substring(0, 7),
          message: fullMessage,
          headline,
          body: body || undefined,
          authorName: item.commit?.author?.name || item.author?.login || 'Desenvolvedor',
          authorLogin: item.author?.login,
          authorAvatar: item.author?.avatar_url || 'https://github.com/ghost.png',
          date: item.commit?.author?.date || new Date().toISOString(),
          htmlUrl: item.html_url || `${GITHUB_REPO_CONFIG.repoUrl}/commit/${item.sha}`,
        };
      });

      // Salva no cache local
      this._saveLocalCommitsCache(parsedCommits);

      return {
        commits: parsedCommits,
        source: 'github_api',
        rateLimitRemaining,
      };
    } catch (err: any) {
      console.warn('Falha ao consultar API do GitHub:', err);
      const cached = this._getLocalCommitsCache();
      if (cached && cached.length > 0) {
        return { commits: cached, source: 'local_cache', error: err?.message };
      }
      return { commits: INITIAL_SEEDED_COMMITS, source: 'seed', error: err?.message };
    }
  }

  /**
   * Obtém os detalhes completos de um commit específico, incluindo todos os arquivos modificados e seus DIFFS (patches)
   */
  static async getCommitDetails(sha: string): Promise<GitHubCommitSummary> {
    const cacheKey = `${STORAGE_KEY_COMMIT_DETAILS_PREFIX}${sha}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Ignora erro de JSON e busca na API
      }
    }

    try {
      const response = await fetch(`${GITHUB_REPO_CONFIG.apiBase}/commits/${sha}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const fullMessage: string = data.commit?.message || '';
      const lines = fullMessage.split('\n');
      const headline = lines[0] || 'Atualização';
      const body = lines.slice(1).join('\n').trim();

      const files: GitHubCommitFile[] = (data.files || []).map((f: any) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
        patch: f.patch,
        blob_url: f.blob_url,
        raw_url: f.raw_url,
        previous_filename: f.previous_filename,
      }));

      const summary: GitHubCommitSummary = {
        sha: data.sha,
        shortSha: data.sha.substring(0, 7),
        message: fullMessage,
        headline,
        body: body || undefined,
        authorName: data.commit?.author?.name || data.author?.login || 'Desenvolvedor',
        authorLogin: data.author?.login,
        authorAvatar: data.author?.avatar_url || 'https://github.com/ghost.png',
        date: data.commit?.author?.date || new Date().toISOString(),
        htmlUrl: data.html_url || `${GITHUB_REPO_CONFIG.repoUrl}/commit/${data.sha}`,
        stats: data.stats || {
          total: files.reduce((acc, curr) => acc + curr.changes, 0),
          additions: files.reduce((acc, curr) => acc + curr.additions, 0),
          deletions: files.reduce((acc, curr) => acc + curr.deletions, 0),
        },
        filesCount: files.length,
        files,
        loadedDetailedDiff: true,
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify(summary));
      } catch (e) {
        // Cota de localStorage excedida
      }

      return summary;
    } catch (err) {
      console.error(`Erro ao carregar detalhes do commit ${sha}:`, err);
      // Fallback: tenta recuperar informações básicas do commit nas sementes ou no cache
      const recent = (await this.getRecentCommits(30)).commits;
      const found = recent.find((c) => c.sha === sha || c.shortSha === sha);
      if (found) {
        return found;
      }
      throw err;
    }
  }

  /**
   * Compara dois commits (ou branches) e retorna os diffs agregados
   */
  static async compareCommits(base: string, head: string): Promise<GitHubCompareResult> {
    const response = await fetch(`${GITHUB_REPO_CONFIG.apiBase}/compare/${base}...${head}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao comparar commits no GitHub (${response.status})`);
    }

    const data = await response.json();
    return {
      baseSha: base,
      headSha: head,
      status: data.status,
      ahead_by: data.ahead_by,
      behind_by: data.behind_by,
      total_commits: data.total_commits,
      commits: (data.commits || []).map((c: any) => ({
        sha: c.sha,
        shortSha: c.sha.substring(0, 7),
        message: c.commit?.message || '',
        headline: (c.commit?.message || '').split('\n')[0],
        authorName: c.commit?.author?.name || 'Desenvolvedor',
        authorAvatar: c.author?.avatar_url,
        date: c.commit?.author?.date,
        htmlUrl: c.html_url,
      })),
      files: (data.files || []).map((f: any) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
        patch: f.patch,
        blob_url: f.blob_url,
      })),
      htmlUrl: data.html_url || `${GITHUB_REPO_CONFIG.repoUrl}/compare/${base}...${head}`,
    };
  }

  /**
   * Analisador de patch do Git: Transforma o texto unificado do patch em linhas estruturadas
   * com números de linha precisos (old / new), identificando adições, deleções e cabeçalhos.
   */
  static parseGitPatch(patchText: string): ParsedDiffLine[] {
    if (!patchText) return [];

    const lines = patchText.split('\n');
    let oldLine = 0;
    let newLine = 0;
    const result: ParsedDiffLine[] = [];

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // Exemplo: @@ -166,7 +166,7 @@
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          oldLine = parseInt(match[1], 10);
          newLine = parseInt(match[2], 10);
        }
        result.push({
          type: 'header',
          text: line,
        });
      } else if (line.startsWith('+')) {
        result.push({
          type: 'add',
          text: line.slice(1),
          newLineNumber: newLine++,
        });
      } else if (line.startsWith('-')) {
        result.push({
          type: 'delete',
          text: line.slice(1),
          oldLineNumber: oldLine++,
        });
      } else {
        const text = line.startsWith(' ') ? line.slice(1) : line;
        result.push({
          type: 'context',
          text,
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
        });
      }
    }

    return result;
  }

  // --- Helpers de Cache ---
  private static _getLocalCommitsCache(): GitHubCommitSummary[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMMITS);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private static _saveLocalCommitsCache(commits: GitHubCommitSummary[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_COMMITS, JSON.stringify(commits));
    } catch {
      // Ignora erro de cota
    }
  }

  private static async _revalidateCommitsInBackground(perPage: number): Promise<void> {
    try {
      const response = await fetch(
        `${GITHUB_REPO_CONFIG.apiBase}/commits?per_page=${perPage}&sha=${GITHUB_REPO_CONFIG.branch}`
      );
      if (!response.ok) return;
      const rawCommits = await response.json();
      if (Array.isArray(rawCommits)) {
        const parsed = rawCommits.map((item: any) => {
          const fullMessage: string = item.commit?.message || '';
          return {
            sha: item.sha,
            shortSha: item.sha.substring(0, 7),
            message: fullMessage,
            headline: fullMessage.split('\n')[0],
            body: fullMessage.split('\n').slice(1).join('\n').trim() || undefined,
            authorName: item.commit?.author?.name || item.author?.login || 'Desenvolvedor',
            authorLogin: item.author?.login,
            authorAvatar: item.author?.avatar_url || 'https://github.com/ghost.png',
            date: item.commit?.author?.date || new Date().toISOString(),
            htmlUrl: item.html_url,
          };
        });
        this._saveLocalCommitsCache(parsed);
      }
    } catch {
      // Silencioso em revalidação de fundo
    }
  }
}
