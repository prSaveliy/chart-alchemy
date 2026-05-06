import type { HttpClient } from './http-client.interface';

export interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
}

const BASE = 'https://api.github.com';
const GH_HEADERS = { Accept: 'application/vnd.github.v3+json' };

export class GitHubService {
  constructor(private readonly client: HttpClient) {}

  async getUser(username: string): Promise<GitHubUser> {
    const res = await this.client.request<GitHubUser>({
      url: `${BASE}/users/${username}`,
      headers: GH_HEADERS,
    });
    return res.data;
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    const res = await this.client.request<GitHubRepo>({
      url: `${BASE}/repos/${owner}/${repo}`,
      headers: GH_HEADERS,
    });
    return res.data;
  }

  async listUserRepos(username: string): Promise<GitHubRepo[]> {
    const res = await this.client.request<GitHubRepo[]>({
      url: `${BASE}/users/${username}/repos?sort=stars&per_page=10`,
      headers: GH_HEADERS,
    });
    return res.data;
  }
}
