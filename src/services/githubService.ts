import type { GitHubUser, Repository, LanguageStats, ContributionStats } from '../types/github';
import type { RepositoryWithLanguages } from './analyzer';

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubEvent {
  type: string;
  repo: { name: string };
  payload: {
    action?: string;
    pull_request?: {
      title: string;
      state: string;
      merged: boolean;
      html_url: string;
      created_at: string;
    };
    issue?: {
      title: string;
      state: string;
      html_url: string;
    };
  };
  created_at: string;
}

export class GitHubService {
  private static readonly REQUEST_DEBOUNCE_MS = 100; // Reduced from 800ms
  private static readonly ANON_WINDOW_MS = 60_000;
  private static readonly ANON_LIMIT = 25; // Increased limit
  private static readonly MAX_CONCURRENT = 6; // Parallel request limit
  private static lastRequestTime = 0;
  private static anonWindowStart = 0;
  private static anonRequestCount = 0;
  private static inflightRequests = new Map<string, Promise<unknown>>();
  private static activeRequests = 0;

  private async fetchAPI<T>(url: string): Promise<T> {
    if (GitHubService.inflightRequests.has(url)) {
      return GitHubService.inflightRequests.get(url)! as Promise<T>;
    }

    const request = GitHubService.performFetch<T>(url);
    GitHubService.inflightRequests.set(url, request);

    try {
      return await request;
    } finally {
      GitHubService.inflightRequests.delete(url);
    }
  }

  private static async performFetch<T>(url: string): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };

    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    GitHubService.enforceAnonymousLimit(token);
    await GitHubService.waitForTurn(!!token);

    GitHubService.activeRequests++;
    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 403) {
          const resetTime = response.headers.get('X-RateLimit-Reset');
          const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000).toLocaleTimeString() : 'soon';
          throw new Error(
            `GitHub API rate limit exceeded. Resets at ${resetDate}. ` +
            `To increase your limit, add a GitHub token to .env file (see SETUP.md)`
          );
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } finally {
      GitHubService.activeRequests--;
    }
  }

  private static async waitForTurn(hasToken: boolean): Promise<void> {
    // Wait for concurrent slot
    while (GitHubService.activeRequests >= GitHubService.MAX_CONCURRENT) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Minimal debounce only for anonymous requests
    if (!hasToken) {
      const now = Date.now();
      const timeSinceLast = now - GitHubService.lastRequestTime;
      if (timeSinceLast < GitHubService.REQUEST_DEBOUNCE_MS) {
        await new Promise((resolve) => setTimeout(resolve, GitHubService.REQUEST_DEBOUNCE_MS - timeSinceLast));
      }
      GitHubService.lastRequestTime = Date.now();
    }
  }

  private static enforceAnonymousLimit(token?: string): void {
    if (token) {
      return;
    }

    const now = Date.now();

    if (now - GitHubService.anonWindowStart > GitHubService.ANON_WINDOW_MS) {
      GitHubService.anonWindowStart = now;
      GitHubService.anonRequestCount = 0;
    }

    GitHubService.anonRequestCount += 1;

    if (GitHubService.anonRequestCount > GitHubService.ANON_LIMIT) {
      throw new Error(
        'Too many GitHub requests without a personal token. Set VITE_GITHUB_TOKEN in your .env to continue.'
      );
    }
  }

  async getUserData(username: string): Promise<GitHubUser> {
    return this.fetchAPI<GitHubUser>(`${GITHUB_API_BASE}/users/${username}`);
  }

  async getUserRepositories(username: string): Promise<Repository[]> {
    // Fetch first page, usually enough for most users
    return this.fetchAPI<Repository[]>(
      `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=updated`
    );
  }

  async getRepositoryLanguages(languagesUrl: string): Promise<LanguageStats> {
    return this.fetchAPI<LanguageStats>(languagesUrl);
  }

  async getUserEvents(username: string): Promise<GitHubEvent[]> {
    try {
      // Just fetch first page - 30 events is usually enough
      return this.fetchAPI<GitHubEvent[]>(
        `${GITHUB_API_BASE}/users/${username}/events?per_page=30`
      );
    } catch {
      return [];
    }
  }

  parseContributionStats(events: GitHubEvent[]): ContributionStats {
    const prEvents = events.filter((e) => e.type === 'PullRequestEvent');
    const issueEvents = events.filter((e) => e.type === 'IssuesEvent');

    let totalPRs = 0;
    let mergedPRs = 0;
    let openPRs = 0;
    const recentPRs: ContributionStats['recentPRs'] = [];

    for (const event of prEvents) {
      if (event.payload.action === 'opened') {
        totalPRs++;
      }
      if (event.payload.pull_request) {
        const pr = event.payload.pull_request;
        if (pr.merged) {
          mergedPRs++;
        } else if (pr.state === 'open') {
          openPRs++;
        }

        if (recentPRs.length < 5 && event.payload.action === 'opened') {
          recentPRs.push({
            repo: event.repo.name.split('/')[1] || event.repo.name,
            title: pr.title,
            state: pr.merged ? 'merged' : pr.state === 'open' ? 'open' : 'closed',
            url: pr.html_url,
            createdAt: pr.created_at,
          });
        }
      }
    }

    let totalIssues = 0;
    let closedIssues = 0;

    for (const event of issueEvents) {
      if (event.payload.action === 'opened') {
        totalIssues++;
      }
      if (event.payload.action === 'closed') {
        closedIssues++;
      }
    }

    return {
      totalPRs,
      mergedPRs,
      openPRs,
      totalIssues,
      closedIssues,
      recentPRs,
    };
  }

  async analyzeUser(username: string) {
    // Fetch user, repos, and events in parallel
    const [user, repos, events] = await Promise.all([
      this.getUserData(username),
      this.getUserRepositories(username),
      this.getUserEvents(username),
    ]);

    const contributions = this.parseContributionStats(events);

    // Only fetch languages for top 15 repos (sorted by stars/recency already)
    const topRepos = repos.slice(0, 15);
    const otherRepos = repos.slice(15);

    // Fetch languages in parallel for top repos
    const topReposWithLanguages = await Promise.all(
      topRepos.map(async (repo) => {
        try {
          const languages = await this.getRepositoryLanguages(repo.languages_url);
          return { 
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            updated_at: repo.updated_at,
            created_at: repo.created_at,
            html_url: repo.html_url,
            topics: repo.topics || [],
            languageStats: languages 
          };
        } catch {
          return { 
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            updated_at: repo.updated_at,
            created_at: repo.created_at,
            html_url: repo.html_url,
            topics: repo.topics || [],
            languageStats: {} 
          };
        }
      })
    );

    // For remaining repos, just use basic language info (no detailed stats)
    const otherReposBasic: RepositoryWithLanguages[] = otherRepos.map((repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      updated_at: repo.updated_at,
      created_at: repo.created_at,
      html_url: repo.html_url,
      topics: repo.topics || [],
      languageStats: repo.language ? { [repo.language]: 1 } : {},
    }));

    return { 
      user, 
      repos: [...topReposWithLanguages, ...otherReposBasic], 
      contributions 
    };
  }
}
