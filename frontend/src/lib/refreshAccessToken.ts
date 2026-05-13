export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { accessToken: string };
    localStorage.setItem("accessToken", data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
};
