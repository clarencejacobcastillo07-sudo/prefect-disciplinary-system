/**
 * Auth & Session Management Module
 * System: Prefect Disciplinary Action System
 * Client: St. Agnes Academy of Caloocan Inc.
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
    return ApiClient.post('auth', 'logout').catch(() => {}).finally(() => {
      localStorage.removeItem('saac_auth_token');
      localStorage.removeItem('saac_user');
      window.location.href = 'login.php';
    });
  }

  static hasRole(roleName) {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.role_name === roleName;
  }

  static checkPermission(allowedRoles = []) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role_name === 'Administrator') return true;
    return allowedRoles.includes(user.role_name);
  }

  static canAccessModule(moduleKey) {
    const permissions = {
      'dashboard':        ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal'],
      'students':         ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal'],
      'infractions':      ['Administrator', 'Prefect Officer'],
      'behavior':         ['Administrator', 'Prefect Officer', 'Guidance Counselor'],
      'violations':       ['Administrator', 'Prefect Officer'],
      'sanctions':        ['Administrator', 'Prefect Officer', 'Principal'],
      'notifications':    ['Administrator', 'Prefect Officer', 'Guidance Counselor'],
      'hearings':         ['Administrator', 'Prefect Officer', 'Principal', 'Guidance Counselor'],
      'points':           ['Administrator', 'Prefect Officer', 'Guidance Counselor'],
      'clearance':        ['Administrator', 'Prefect Officer', 'Principal'],
      'reformation':      ['Administrator', 'Prefect Officer', 'Guidance Counselor'],
      'incident-reports': ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal'],
      'analytics':        ['Administrator', 'Prefect Officer', 'Guidance Counselor', 'Principal'],
      'users':            ['Administrator'],
      'audit':            ['Administrator'],
      'settings':         ['Administrator']
    };

    const allowed = permissions[moduleKey] || ['Administrator'];
    return this.checkPermission(allowed);
  }
}

window.AuthManager = AuthManager;

