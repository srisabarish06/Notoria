import apiService from '../services/apiService.js';

export const fetchAnalytics = async () => {
  try {
    const analytics = await apiService.getAnalytics();
    return { success: true, data: analytics };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
