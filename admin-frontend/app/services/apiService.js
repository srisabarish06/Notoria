const API_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('adminToken') || null;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('adminToken', token);
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.token = null;
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async login(email, password) {
    const response = await this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.accessToken) {
      this.setToken(response.accessToken);
    }

    return response;
  }

  async getUsers() {
    return this.request('/admin/users');
  }

  async getNotes() {
    return this.request('/admin/notes');
  }

  async getBlogs() {
    return this.request('/admin/blogs');
  }

  async getAnalytics() {
    return this.request('/admin/analytics');
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
