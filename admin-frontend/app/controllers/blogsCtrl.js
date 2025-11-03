import apiService from '../services/apiService.js';

export const fetchBlogs = async () => {
  try {
    const blogs = await apiService.getBlogs();
    return { success: true, data: blogs };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
