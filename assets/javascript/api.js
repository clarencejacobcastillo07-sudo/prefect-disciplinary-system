/**
 * Centralized RESTful API Fetch Client
 * Client: St. Agnes Academy of Caloocan Inc.
 */

const API_BASE_URL = window.location.origin + window.location.pathname.replace(/\/frontend\/.*$/, '') + '/api.php';

class ApiClient {
  static getToken() {
    return localStorage.getItem('saac_auth_token') || '';
  }

  static async request(service, action = '', method = 'GET', data = null, id = null, params = null) {
    let url = `${API_BASE_URL}?service=${encodeURIComponent(service)}`;
    if (action) url += `&action=${encodeURIComponent(action)}`;
    if (id) url += `&id=${encodeURIComponent(id)}`;
    if (params && typeof params === 'object') {
      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== '') {
          url += `&${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
        }
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: method.toUpperCase(),
      headers: headers
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      let resData = null;
      try {
        resData = await response.json();
      } catch (jsonErr) {
        // Non-JSON response
        const err = new Error(`Server returned invalid response (HTTP ${response.status})`);
        err.status = response.status;
        err.code = response.status;
        throw err;
      }

      if (response.status === 401) {
        // Clear invalid or expired session state
        localStorage.removeItem('saac_auth_token');
        localStorage.removeItem('saac_user');
        if (!window.location.pathname.endsWith('login.php') && !window.location.pathname.endsWith('login.html')) {
          window.location.href = 'login.php?session_expired=1';
        }
        const authErr = new Error(resData.message || 'Session expired or unauthorized. Please log in again.');
        authErr.status = 401;
        authErr.code = 401;
        throw authErr;
      }

      if (!response.ok || resData.status === 'error') {
        const errorMsg = resData.message || `API Error (${response.status})`;
        const err = new Error(errorMsg);
        err.status = response.status;
        err.code = resData.code || response.status;
        err.detail = resData.data || resData.errors;
        throw err;
      }

      return resData;
    } catch (err) {
      console.error(`[API Error] Service: ${service}, Action: ${action} [${err.status || 500}]`, err);
      throw err;
    }
  }

  static get(service, action = '', id = null, params = null) {
    return this.request(service, action, 'GET', null, id, params);
  }

  static post(service, action = '', data = {}) {
    return this.request(service, action, 'POST', data);
  }

  static put(service, action = '', id = null, data = {}) {
    return this.request(service, action, 'PUT', data, id);
  }

  static delete(service, action = '', id = null) {
    return this.request(service, action, 'DELETE', null, id);
  }
}

window.ApiClient = ApiClient;

