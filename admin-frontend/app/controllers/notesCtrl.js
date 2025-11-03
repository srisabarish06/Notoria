import apiService from '../services/apiService.js';

export const fetchNotes = async () => {
  try {
    const notes = await apiService.getNotes();
    return { success: true, data: notes };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
