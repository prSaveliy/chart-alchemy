import type { ChartSummary } from '@/commons/interfaces/chartInterfaces';
import type { FetchResult } from '@/commons/interfaces/fetchInterfaces';
import { type HttpClient } from '@/lib/proxy/http-client.interface';

type ChartListResponse = {
  charts: ChartSummary[];
  errorMessage?: string;
  message?: string;
};

export class ProxyChartService {
  constructor(private readonly client: HttpClient) {}

  async list(): Promise<FetchResult> {
    try {
      const response = await this.client.request<ChartListResponse>({
        url: `${import.meta.env.VITE_SERVER_URL}/chart`,
        credentials: 'include',
      });

      if (response.status >= 400) {
        return {
          errorMessage: response.data?.errorMessage || response.data?.message || 'Error',
          statusCode: response.status,
        };
      }

      return { data: response.data };
    } catch {
      return { errorMessage: 'Something went wrong' };
    }
  }
}
