import type { ChartSummary } from '@/commons/interfaces/chartInterfaces';
import type { FetchResult } from '@/commons/interfaces/fetchInterfaces';
import { createJwtBackendClient } from '@/lib/proxy';

type ChartListResponse = {
  charts: ChartSummary[];
  errorMessage?: string;
  message?: string;
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { accessToken: string };
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
};

class ProxyChartService {
  private readonly client = createJwtBackendClient(
    () => localStorage.getItem('accessToken'),
    refreshAccessToken
  );

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

export default new ProxyChartService();
