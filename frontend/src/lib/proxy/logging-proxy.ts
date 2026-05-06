import type { HttpClient, HttpRequest, HttpResponse } from './http-client.interface';

export class LoggingProxy implements HttpClient {
  constructor(private readonly client: HttpClient) {}

  async request<T>(req: HttpRequest): Promise<HttpResponse<T>> {
    const method = req.method ?? 'GET';
    console.log(`[HTTP] --> ${method} ${req.url}`);
    const start = Date.now();

    const response = await this.client.request<T>(req);

    console.log(`[HTTP] <-- ${response.status} (${Date.now() - start}ms)`);
    return response;
  }
}
