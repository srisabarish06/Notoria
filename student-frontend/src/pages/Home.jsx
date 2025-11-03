import { useState, useEffect } from 'react';
import AddNote from '../components/AddNote';
import NoteList from '../components/NoteList';
import NoteView from '../components/NoteView';
import CollabBoard from '../components/CollabBoard';
import PomodoroWidget from '../components/PomodoroWidget';
import api from '../services/api';

const Home = ({ user }) => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCollab, setShowCollab] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await api.get('/notes');
      setNotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setLoading(false);
    }
  };

  const handleNoteCreated = (newNote) => {
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
  };

  const handleNoteUpdated = (updatedNote) => {
    setNotes(notes.map((n) => (n._id === updatedNote._id ? updatedNote : n)));
    setSelectedNote(updatedNote);
  };

  const handleNoteDeleted = (noteId) => {
    setNotes(notes.filter((n) => n._id !== noteId));
    if (selectedNote?._id === noteId) {
      setSelectedNote(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <AddNote onNoteCreated={handleNoteCreated} />
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <button
              onClick={() => setShowCollab(!showCollab)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 mb-2"
            >
              {showCollab ? 'Hide Collaboration' : 'Show Collaboration'}
            </button>
          </div>
          <PomodoroWidget />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {showCollab ? (
            <CollabBoard user={user} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Note List */}
              <div className="lg:col-span-1">
                <NoteList
                  notes={notes}
                  selectedNote={selectedNote}
                  onSelectNote={setSelectedNote}
                  onNoteDeleted={handleNoteDeleted}
                  loading={loading}
                />
              </div>

              {/* Note View */}
              <div className="lg:col-span-2">
                {selectedNote ? (
                  <NoteView
                    note={selectedNote}
                    onNoteUpdated={handleNoteUpdated}
                    onNoteDeleted={handleNoteDeleted}
                  />
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                    Select a note to view or create a new one
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
