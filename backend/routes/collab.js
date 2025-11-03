import express from 'express';
import Note from '../models/Note.js';
import Collab from '../models/Collab.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all collaboration invites for user
router.get('/invites', authenticateToken, async (req, res) => {
  try {
    const invites = await Collab.find({
      userId: req.user._id,
      status: 'pending',
    })
      .populate('noteId', 'title')
      .populate('invitedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept collaboration invite
router.post('/invites/:id/accept', authenticateToken, async (req, res) => {
  try {
    const collab = await Collab.findById(req.params.id);

    if (!collab) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (collab.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    collab.status = 'accepted';
    await collab.save();

    // Add to note collaborators
    const note = await Note.findById(collab.noteId);
    if (note) {
      note.collaborators.push({
        user: req.user._id,
        role: collab.role,
      });
      await note.save();
    }

    res.json({ message: 'Invite accepted', collab });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decline collaboration invite
router.post('/invites/:id/decline', authenticateToken, async (req, res) => {
  try {
    const collab = await Collab.findById(req.params.id);

    if (!collab) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (collab.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    collab.status = 'declined';
    await collab.save();

    res.json({ message: 'Invite declined' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Share note with user (send invite)
router.post('/share', authenticateToken, async (req, res) => {
  try {
    const { noteId, userEmail, role } = req.body;

    if (!noteId || !userEmail) {
      return res.status(400).json({ error: 'Note ID and user email are required' });
    }

    // Find note
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check ownership
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only owner can share note' });
    }

    // Find user to invite
    const userToInvite = await User.findOne({ email: userEmail });

    if (!userToInvite) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already collaborator
    const existingCollab = note.collaborators.find(
      (c) => c.user.toString() === userToInvite._id.toString()
    );

    if (existingCollab) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    // Create collaboration invite
    const collab = new Collab({
      noteId,
      userId: userToInvite._id,
      role: role || 'editor',
      invitedBy: req.user._id,
      status: 'pending',
    });

    await collab.save();

    // Emit Socket.IO event for notification
    const io = req.app.get('io');
    if (io) {
      io.emit('collab-invite', {
        userId: userToInvite._id.toString(),
        noteId,
        noteTitle: note.title,
        invitedBy: req.user.username,
      });
    }

    res.status(201).json({
      message: 'Invitation sent',
      collab: await collab.populate('userId', 'username email'),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collaborators for a note
router.get('/note/:noteId', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId)
      .populate('collaborators.user', 'username email');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check access
    const hasAccess =
      note.owner.toString() === req.user._id.toString() ||
      note.collaborators.some(
        (c) => c.user._id.toString() === req.user._id.toString()
      );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(note.collaborators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
