import { useState } from 'react';
import api from '../services/api';

const NoteList = ({ notes, selectedNote, onSelectNote, onNoteDeleted, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (e, noteId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await api.delete(`/notes/${noteId}`);
        onNoteDeleted(noteId);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Notes</h3>
      <input
        type="text"
        placeholder="Search notes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-4"
      />
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No notes found</div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note._id}
              onClick={() => onSelectNote(note)}
              className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                selectedNote?._id === note._id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{note.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(e, note._id)}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoteList;
