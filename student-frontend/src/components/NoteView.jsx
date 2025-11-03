import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import DiagramEditor from './DiagramEditor';
import TableEditor from './TableEditor';

const NoteView = ({ note, onNoteUpdated, onNoteDeleted }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags?.join(', ') || '');
  const [isPublic, setIsPublic] = useState(note.isPublic);
  const [saving, setSaving] = useState(false);
  const [socket, setSocket] = useState(null);
  const [showDiagram, setShowDiagram] = useState(false);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags?.join(', ') || '');
    setIsPublic(note.isPublic);

    // Initialize Socket.IO connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.emit('join-note', note._id);

    newSocket.on('note-updated', (data) => {
      if (data.noteId === note._id) {
        setContent(data.content);
        setTitle(data.title);
      }
    });

    return () => {
      newSocket.emit('leave-note', note._id);
      newSocket.disconnect();
    };
  }, [note._id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const response = await api.put(`/notes/${note._id}`, {
        title,
        content,
        tags: tagsArray,
        isPublic,
      });

      // Emit Socket.IO event
      if (socket) {
        socket.emit('note-update', {
          noteId: note._id,
          title,
          content,
          tags: tagsArray,
        });
      }

      onNoteUpdated(response.data);
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await api.delete(`/notes/${note._id}`);
        onNoteDeleted(note._id);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1"
          placeholder="Note title..."
        />
      </div>

      <div className="mb-4 flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">Public</span>
        </label>
        <button
          onClick={() => setShowDiagram(!showDiagram)}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          {showDiagram ? 'Hide Diagram' : 'Add Diagram'}
        </button>
        <button
          onClick={() => setShowTable(!showTable)}
          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          {showTable ? 'Hide Table' : 'Add Table'}
        </button>
      </div>

      {showDiagram && (
        <div className="mb-4">
          <DiagramEditor noteId={note._id} />
        </div>
      )}

      {showTable && (
        <div className="mb-4">
          <TableEditor noteId={note._id} />
        </div>
      )}

      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Write your note content here (supports markdown)..."
        />
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Collaborators: {note.collaborators?.length || 0}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteView;
