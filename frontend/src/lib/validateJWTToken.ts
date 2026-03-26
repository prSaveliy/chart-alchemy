import { jwtDecode } from 'jwt-decode';

export const validateJWT = (token: string | null): boolean => {
  try {
    if (!token) return false;

    const data = jwtDecode(token);
    if (!data || typeof data === "string") return false;

    const now = Math.floor(Date.now() / 1000);
    if (data.exp && data.exp <= now) return false;

    return true;
  } catch {
    return false;
  }
};
