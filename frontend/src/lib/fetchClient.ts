class FetchClient {
  async get(uri: string) {
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

      if (!response.ok) {
        return { errorMessage: data?.message || "Error", statusCode: response.status };
      }
      
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
  ) {
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

      if (!response.ok) {
        return { errorMessage: data.message, statusCode: response.status };
      }

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
  async delete(uri: string) {
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

      if (!response.ok) {
        return { errorMessage: data?.message || "Error", statusCode: response.status };
      }

      return { data };
    } catch {
      return { errorMessage: "Something went wrong" };
    }
  }

  async patch(uri: string, paramObj: Record<string, unknown> = {}) {
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

      if (!response.ok) {
        return { errorMessage: data?.message || "Error", statusCode: response.status };
      }

      return { data };
    } catch {
      return { errorMessage: "Something went wrong" };
    }
  }
}

export default new FetchClient();
