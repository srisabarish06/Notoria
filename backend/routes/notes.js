import express from 'express';
import Note from '../models/NoteSequelize.js';
import User from '../models/UserSequelize.js';
import Collab from '../models/CollabSequelize.js';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all notes for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: {
        [Op.or]: [
          { ownerId: req.user.id },
          { isPublic: true },
        ],
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['username', 'email'],
        },
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
      order: [['updatedAt', 'DESC']],
    });

    // Also get notes where user is a collaborator
    const collabNotes = await Note.findAll({
      include: [
        {
          model: Collab,
          as: 'collaborators',
          where: { userId: req.user.id },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['username', 'email'],
            },
          ],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['username', 'email'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    // Combine and deduplicate notes
    const allNotes = [...notes, ...collabNotes];
    const uniqueNotes = allNotes.filter((note, index, self) =>
      index === self.findIndex(n => n.id === note.id)
    );

    res.json(uniqueNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single note
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['username', 'email'],
        },
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
      note.collaborators.some(c => c.userId === req.user.id) ||
      note.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create note
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags, isPublic } = req.body;

    const note = await Note.create({
      title: title || 'Untitled Note',
      content: content || '',
      tags: JSON.stringify(tags || []),
      ownerId: req.user.id,
      isPublic: isPublic || false,
    });

    const noteWithOwner = await Note.findByPk(note.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['username', 'email'],
        },
      ],
    });

    res.status(201).json(noteWithOwner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update note
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id, {
      include: [
        {
          model: Collab,
          as: 'collaborators',
        },
      ],
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check permissions
    const isOwner = note.ownerId === req.user.id;
    const isEditor = note.collaborators.some(
      (c) => c.userId === req.user.id && c.role === 'editor'
    );

    if (!isOwner && !isEditor) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { title, content, tags, isPublic } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (isPublic !== undefined && isOwner) updateData.isPublic = isPublic;

    await note.update(updateData);

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`note-${note.id}`).emit('note-updated', {
        noteId: note.id,
        title: note.title,
        content: note.content,
        tags: JSON.parse(note.tags || '[]'),
        updatedBy: req.user.id,
      });
    }

    const updatedNote = await Note.findByPk(note.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['username', 'email'],
        },
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

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete note
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only owner can delete
    if (note.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can delete note' });
    }

    await note.destroy();
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add collaborator
router.post('/:id/collaborators', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only owner can add collaborators
    if (note.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only owner can add collaborators' });
    }

    const { userId, role } = req.body;

    // Check if already a collaborator
    const existingCollab = await Collab.findOne({
      where: {
        noteId: note.id,
        userId: userId,
      },
    });

    if (existingCollab) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    await Collab.create({
      noteId: note.id,
      userId: userId,
      role: role || 'editor',
      invitedById: req.user.id,
    });

    const updatedNote = await Note.findByPk(note.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['username', 'email'],
        },
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

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
