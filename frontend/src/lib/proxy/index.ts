import { BaseHttpClient } from './base-http-client';
import { JwtAuthProxy } from './auth/jwt-auth-proxy';
import { ApiKeyProxy } from './auth/api-key-proxy';
import { OAuthProxy, type OAuthConfig } from './auth/oauth-proxy';
import { LoggingProxy } from './logging-proxy';
import { GitHubService } from './github-service';
import type { HttpClient } from './http-client.interface';

export function createJwtGitHubService(
  getToken: () => string | null,
  refreshFn?: () => Promise<string | null>
): GitHubService {
  return new GitHubService(
    new JwtAuthProxy(
      new LoggingProxy(new BaseHttpClient()),
      getToken,
      refreshFn
    )
  );
}

export function createJwtBackendClient(
  getToken: () => string | null,
  refreshFn?: () => Promise<string | null>
): HttpClient {
  return new JwtAuthProxy(
    new LoggingProxy(new BaseHttpClient()),
    getToken,
    refreshFn
  );
}

export function createApiKeyGitHubService(apiKey: string): GitHubService {
  return new GitHubService(
    new ApiKeyProxy(
      new LoggingProxy(new BaseHttpClient()),
      { apiKey: `Bearer ${apiKey}`, headerName: 'Authorization' }
    )
  );
}

export function createOAuthGitHubService(config: OAuthConfig): GitHubService {
  return new GitHubService(
    new OAuthProxy(
      new LoggingProxy(new BaseHttpClient()),
      config
    )
  );
}

export { BaseHttpClient } from './base-http-client';
export { JwtAuthProxy } from './auth/jwt-auth-proxy';
export { ApiKeyProxy, type ApiKeyConfig } from './auth/api-key-proxy';
export { OAuthProxy, type OAuthConfig } from './auth/oauth-proxy';
export { LoggingProxy } from './logging-proxy';
export { GitHubService } from './github-service';
export type { HttpClient, HttpRequest, HttpResponse } from './http-client.interface';
