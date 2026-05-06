import type {
  HttpClient,
  HttpRequest,
  HttpResponse,
} from "../http-client.interface";

export interface OAuthConfig {
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokenRefreshed: (accessToken: string) => void;
}

export class OAuthProxy implements HttpClient {
  private refreshInProgress: Promise<string | null> | null = null;

  constructor(
    private readonly client: HttpClient,
    private readonly config: OAuthConfig,
  ) {}

  async request<T>(req: HttpRequest): Promise<HttpResponse<T>> {
    const accessToken = this.config.getAccessToken();
    const authedReq = this.injectToken(req, accessToken);

    const response = await this.client.request<T>(authedReq);

    if (response.status === 401) {
      const newToken = await this.ensureRefresh();
      if (newToken) {
        return this.client.request<T>(this.injectToken(req, newToken));
      }
    }

    return response;
  }

  private injectToken(req: HttpRequest, token: string | null): HttpRequest {
    if (!token) return req;
    return {
      ...req,
      headers: { ...req.headers, Authorization: `Bearer ${token}` },
    };
  }

  private ensureRefresh(): Promise<string | null> {
    if (!this.refreshInProgress) {
      this.refreshInProgress = this.performRefresh().finally(() => {
        this.refreshInProgress = null;
      });
    }
    return this.refreshInProgress;
  }

  private async performRefresh(): Promise<string | null> {
    const refreshToken = this.config.getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(this.config.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }).toString(),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { access_token: string };
    this.config.onTokenRefreshed(data.access_token);
    return data.access_token;
  }
}
