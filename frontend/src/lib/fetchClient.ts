class FetchClient {
  async get(uri: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/${uri}`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        return { statusCode: response.status };
      }
      
      return {};
    } catch {
      return { errorMessage: 'Something went wrong' };
    }
  }

  async post(
    uri: string,
    paramObj: Record<string, string | number>,
    fn?: (...params: any[]) => void,
    dataFieldForFn?: string
  ) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/${uri}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paramObj,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return { errorMessage: data.message, statusCode: response.status };
      }

      if (fn) {
        fn(data[dataFieldForFn!]);
      }
      
      return {};
    } catch {
      return { errorMessage: "Something went wrong" };
    }
  }
}

export default new FetchClient();
