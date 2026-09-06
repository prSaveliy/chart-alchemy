import type { FetchResult } from '@/commons/interfaces/fetchInterfaces';

interface ServerErrorResponse {
  errorMessage?: string;
  message?: string;
  statusCode?: number;
  isStreamingError?: boolean;
}

class FetchClient {
  private getError(response: Response, data: unknown): FetchResult<never> | null {
    const errorPayload =
      typeof data === 'object' && data !== null
        ? (data as ServerErrorResponse)
        : null;

    if (!response.ok || errorPayload?.isStreamingError) {
      return {
        errorMessage: errorPayload?.errorMessage || errorPayload?.message || "Error",
        statusCode: errorPayload?.statusCode || response.status,
      };
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async get<T = any>(
    uri: string,
    options?: { signal?: AbortSignal },
  ): Promise<FetchResult<T>> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/${uri}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        credentials: "include",
        signal: options?.signal,
      });
      
      const data = await response.json().catch(() => null);

      const error = this.getError(response, data);
      if (error) return error;
      
      return { data };
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') {
        return { isAborted: true };
      }
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

  async postFormData(uri: string, formData: FormData): Promise<FetchResult> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/${uri}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        body: formData,
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
