class AuthService {
  async register(email: string, password: string) {
    try {
      const response = await fetch('http://localhost:3000/auth/registration', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password: password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return { errorMessage: data.message };
      }
      
      return {};
    } catch {
      return { errorMessage: 'Something went wrong' };
    }
  }
  
  async activate(token: string) {
    try {
      const response = await fetch(`http://localhost:3000/auth/activate/${token}`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        return { statusCode: response.status };
      }
      
      return {};
    } catch {
      return { errorMessage: 'Network error' };
    }
  }
  
  async login(email: string, password: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { errorMessage: data.message };
      }
      
      localStorage.setItem('accessToken', data.accessToken);
      return {};
    } catch {
      return { errorMessage: 'Something went wrong' };
    }
  }
}

export default new AuthService();


