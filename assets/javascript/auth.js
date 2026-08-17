/**
 * Auth & Session Management Module
 */

class AuthManager {
  static getCurrentUser() {
    const raw = localStorage.getItem('saac_user');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return null;
  }

  static login(email, password) {
    return ApiClient.post('auth', 'login', { email, password }).then(res => {
      if (res.data && res.data.token) {
        localStorage.setItem('saac_auth_token', res.data.token);
        localStorage.setItem('saac_user', JSON.stringify(res.data.user));
      }
      return res.data;
    });
  }

  static logout() {
    return ApiClient.post('auth', 'logout').finally(() => {
      localStorage.removeItem('saac_auth_token');
      localStorage.removeItem('saac_user');
      window.location.href = 'login.php';
    });
  }

  static checkPermission(allowedRoles = []) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role_name === 'Administrator') return true;
    return allowedRoles.includes(user.role_name);
  }
}

window.AuthManager = AuthManager;
