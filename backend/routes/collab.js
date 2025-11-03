import express from 'express';
import Note from '../models/NoteSequelize.js';
import Collab from '../models/CollabSequelize.js';
import User from '../models/UserSequelize.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all collaboration invites for user
router.get('/invites', authenticateToken, async (req, res) => {
  try {
    const invites = await Collab.findAll({
      where: {
        userId: req.user.id,
        status: 'pending',
      },
      include: [
        {
          model: Note,
          as: 'note',
          attributes: ['title'],
        },
        {
          model: User,
          as: 'invitedBy',
          attributes: ['username', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept collaboration invite
router.post('/invites/:id/accept', authenticateToken, async (req, res) => {
  try {
    const collab = await Collab.findByPk(req.params.id);

    if (!collab) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (collab.userId !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    collab.status = 'accepted';
    await collab.save();

    res.json({ message: 'Invite accepted', collab });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decline collaboration invite
router.post('/invites/:id/decline', authenticateToken, async (req, res) => {
  try {
    const collab = await Collab.findByPk(req.params.id);

    if (!collab) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (collab.userId !== req.user.id) {
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
    const note = await Note.findByPk(noteId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check ownership
    if (note.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can share note' });
    }

    // Find user to invite
    const userToInvite = await User.findOne({
      where: { email: userEmail },
    });

    if (!userToInvite) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already collaborator
    const existingCollab = await Collab.findOne({
      where: {
        noteId: note.id,
        userId: userToInvite.id,
      },
    });

    if (existingCollab) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    // Create collaboration invite
    const collab = await Collab.create({
      noteId: note.id,
      userId: userToInvite.id,
      role: role || 'editor',
      invitedById: req.user.id,
      status: 'pending',
    });

    // Emit Socket.IO event for notification
    const io = req.app.get('io');
    if (io) {
      io.emit('collab-invite', {
        userId: userToInvite.id,
        noteId: note.id,
        noteTitle: note.title,
        invitedBy: req.user.username,
      });
    }

    const collabWithUser = await Collab.findByPk(collab.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username', 'email'],
        },
      ],
    });

    res.status(201).json({
      message: 'Invitation sent',
      collab: collabWithUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collaborators for a note
router.get('/note/:noteId', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.noteId, {
      include: [
        {
          model: Collab,
          as: 'collaborators',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['username', 'email'],
            },
          ],
        },
      ],
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check access
    const hasAccess =
      note.ownerId === req.user.id ||
      note.collaborators.some((c) => c.userId === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(note.collaborators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
