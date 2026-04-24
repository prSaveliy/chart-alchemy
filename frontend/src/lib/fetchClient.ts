import type { FetchResult } from '@/commons/interfaces/fetchInterfaces';

class FetchClient {
  private getError(response: Response, data: any): FetchResult | null {
    if (!response.ok || data?.isStreamingError) {
      return {
        errorMessage: data?.errorMessage || data?.message || "Error",
        statusCode: data?.statusCode || response.status,
      };
    }
    return null;
  }

  async get(uri: string): Promise<FetchResult> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/${uri}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        credentials: "include",
      });
      
      const data = await response.json().catch(() => null);

      const error = this.getError(response, data);
      if (error) return error;
      
      return { data };
    } catch {
      return { errorMessage: 'Something went wrong' };
    }
  }

  async post(
    uri: string,
    paramObj: Record<string, unknown> = {},
    fn?: (...params: any[]) => void,
    dataFieldsForFn?: string[]
  ): Promise<FetchResult> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/${uri}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...paramObj,
        }),
      });

      const data = await response.json().catch(() => null);

      const error = this.getError(response, data);
      if (error) return error;

      if (fn) {
        if (dataFieldsForFn) {
          const params = dataFieldsForFn.map(field => data[field]);
          fn(...params);
        } else {
          fn();
        }
      }
      
      return { data };
    } catch {
      return { errorMessage: "Something went wrong" };
    }
  }
  async delete(uri: string): Promise<FetchResult> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/${uri}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      const data = await response.json().catch(() => null);

      const error = this.getError(response, data);
      if (error) return error;

      return { data };
    } catch {
      return { errorMessage: "Something went wrong" };
    }
  }

  async patch(uri: string, paramObj: Record<string, unknown> = {}): Promise<FetchResult> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/${uri}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(paramObj),
      });

      const data = await response.json().catch(() => null);

      const error = this.getError(response, data);
      if (error) return error;

      return { data };
    } catch {
      return { errorMessage: "Something went wrong" };
    }
  }
}

export default new FetchClient();
