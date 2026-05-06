import type {
  HttpClient,
  HttpRequest,
  HttpResponse,
} from "../http-client.interface";

export class JwtAuthProxy implements HttpClient {
  constructor(
    private readonly client: HttpClient,
    private readonly getToken: () => string | null,
    private readonly refreshToken?: () => Promise<string | null>,
  ) {}

  async request<T>(req: HttpRequest): Promise<HttpResponse<T>> {
    const token = this.getToken();
    const authedReq = this.injectToken(req, token);

    const response = await this.client.request<T>(authedReq);

    if (response.status === 401 && this.refreshToken) {
      const newToken = await this.refreshToken();
      if (newToken) {
        const refreshedReq = this.injectToken(req, newToken);
        return this.client.request<T>(refreshedReq);
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
}
