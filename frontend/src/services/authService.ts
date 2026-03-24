import fetchClient from "@/lib/fetchClient";

import defaultUserPicture from "@/assets/user.png";

class AuthService {
  async register(email: string, password: string) {
    return await fetchClient.post(
      'auth/registration',
      { email, password },
    );
  }
  
  async activate(token: string) {
    return await fetchClient.post(
      `auth/activate`,
      { token },
    );
  }
  
  async login(email: string, password: string) {
    return await fetchClient.post(
      'auth/login',
      { email, password },
      (accessToken: string, picture: string | null) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('picture', picture ? picture : defaultUserPicture);
      },
      ['accessToken', 'picture'],
    );
  }
  
  async forgotPassword(email: string) {
    return await fetchClient.post(
      'auth/forgot-password',
      { email },
    );
  }
  
  async verifyPasswordResetToken(token: string) {
    return await fetchClient.get(`auth/verify-reset-token/${token}`)
  }
  
  async resetPassword(token: string, password: string) {
    return await fetchClient.post(
      'auth/reset-password',
      { token, password },
    );
  }
}

export default new AuthService();