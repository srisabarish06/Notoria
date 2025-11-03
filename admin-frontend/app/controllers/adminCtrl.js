import apiService from '../services/apiService.js';

export const login = async (email, password) => {
  try {
    const response = await apiService.login(email, password);
    if (response.user && response.user.isAdmin) {
      return { success: true, user: response.user };
    } else {
      return { success: false, error: 'Admin access required' };
    }
  } catch (error) {
    return { success: false, error: error.message || 'Login failed' };
  }
};

export const logout = () => {
  localStorage.removeItem('adminToken');
  window.location.reload();
};
