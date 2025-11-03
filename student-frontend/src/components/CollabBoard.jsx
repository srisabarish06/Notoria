import { useState, useEffect } from 'react';
import api from '../services/api';

const CollabBoard = ({ user }) => {
  const [invites, setInvites] = useState([]);
  const [shareEmail, setShareEmail] = useState('');
  const [shareNoteId, setShareNoteId] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvites();
    fetchNotes();
  }, []);

  const fetchInvites = async () => {
    try {
      const response = await api.get('/collab/invites');
      setInvites(response.data);
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

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

  const handleAcceptInvite = async (inviteId) => {
    try {
      await api.post(`/collab/invites/${inviteId}/accept`);
      fetchInvites();
      fetchNotes();
    } catch (error) {
      console.error('Error accepting invite:', error);
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      await api.post(`/collab/invites/${inviteId}/decline`);
      fetchInvites();
    } catch (error) {
      console.error('Error declining invite:', error);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    try {
      await api.post('/collab/share', {
        noteId: shareNoteId,
        userEmail: shareEmail,
      });
      setShareEmail('');
      setShareNoteId('');
      alert('Invitation sent!');
    } catch (error) {
      alert(error.response?.data?.error || 'Error sharing note');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Collaboration</h2>

      {/* Share Note Section */}
      <div className="mb-8 bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Share a Note</h3>
        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Note
            </label>
            <select
              value={shareNoteId}
              onChange={(e) => setShareNoteId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose a note...</option>
              {notes
                .filter((note) => {
                  const ownerId = note.owner?._id?.toString() || note.owner?.toString();
                  const userId = user?.id?.toString() || user?._id?.toString();
                  return ownerId === userId;
                })
                .map((note) => (
                  <option key={note._id} value={note._id}>
                    {note.title}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Email
            </label>
            <input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              required
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Send Invite
          </button>
        </form>
      </div>

      {/* Pending Invites */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Pending Invitations</h3>
        {invites.length === 0 ? (
          <p className="text-gray-500">No pending invitations</p>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <div
                key={invite._id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      Invited to collaborate on: {invite.noteId?.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      Invited by: {invite.invitedBy?.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptInvite(invite._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(invite._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollabBoard;
