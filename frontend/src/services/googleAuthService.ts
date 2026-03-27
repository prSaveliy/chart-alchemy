import fetchClient from "@/lib/fetchClient";

class GoogleAuthService {
  async login(code: string, state: string) {
    return await fetchClient.post(
      'oauth/google/handle-code',
      { code, state },
      (accessToken: string, picture: string) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('picture', picture);
      },
      ['accessToken', 'picture'],
    );
  }
}

export default new GoogleAuthService();