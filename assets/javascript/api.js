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
      const resData = await response.json();

      if (!response.ok || resData.status === 'error') {
        throw new Error(resData.message || 'API Server Error');
      }

      return resData;
    } catch (err) {
      console.error(`[API Error] Service: ${service}, Action: ${action}`, err);
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
