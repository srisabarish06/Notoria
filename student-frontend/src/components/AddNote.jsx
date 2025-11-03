import { useState } from 'react';
import api from '../services/api';

const AddNote = ({ onNoteCreated }) => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/notes', { title });
      onNoteCreated(response.data);
      setTitle('');
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">New Note</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-2"
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Note'}
        </button>
      </form>
    </div>
  );
};

export default AddNote;
