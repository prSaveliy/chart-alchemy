export const unauthorizedInterceptor = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        } else {
          return { statusCode: 401 };
        }
      } else {
        return { statusCode: response.status };
      }
    } else {
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      return {};
    }
  } catch {
    return { networkError: true };
  }
}