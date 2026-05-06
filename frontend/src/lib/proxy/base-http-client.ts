import type { HttpClient, HttpRequest, HttpResponse } from './http-client.interface';

export class BaseHttpClient implements HttpClient {
  async request<T>(req: HttpRequest): Promise<HttpResponse<T>> {
    const response = await fetch(req.url, {
      method: req.method ?? 'GET',
      headers: req.headers,
      body: req.body != null ? JSON.stringify(req.body) : undefined,
      credentials: req.credentials,
    });

    const data = (await response.json().catch(() => null)) as T;
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return { data, status: response.status, headers };
  }
}
