import type {
  HttpClient,
  HttpRequest,
  HttpResponse,
} from "../http-client.interface";

export interface ApiKeyConfig {
  apiKey: string;
  headerName?: string;
}

export class ApiKeyProxy implements HttpClient {
  constructor(
    private readonly client: HttpClient,
    private readonly config: ApiKeyConfig,
  ) {}

  async request<T>(req: HttpRequest): Promise<HttpResponse<T>> {
    const headerName = this.config.headerName ?? "X-Api-Key";
    return this.client.request<T>({
      ...req,
      headers: { ...req.headers, [headerName]: this.config.apiKey },
    });
  }
}
