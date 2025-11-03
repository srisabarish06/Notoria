import express from 'express';
import Note from '../models/Note.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all notes for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id },
        { isPublic: true },
      ],
    })
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email')
      .sort({ updatedAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single note
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check access
    const hasAccess =
      note.owner._id.toString() === req.user._id.toString() ||
      note.collaborators.some(
        (c) => c.user._id.toString() === req.user._id.toString()
      ) ||
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

    const note = new Note({
      title: title || 'Untitled Note',
      content: content || '',
      tags: tags || [],
      owner: req.user._id,
      isPublic: isPublic || false,
    });

    await note.save();
    await note.populate('owner', 'username email');

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update note
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check permissions
    const isOwner = note.owner.toString() === req.user._id.toString();
    const isEditor = note.collaborators.some(
      (c) =>
        c.user.toString() === req.user._id.toString() && c.role === 'editor'
    );

    if (!isOwner && !isEditor) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { title, content, tags, isPublic } = req.body;

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (isPublic !== undefined && isOwner) note.isPublic = isPublic;

    await note.save();

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`note-${note._id}`).emit('note-updated', {
        noteId: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        updatedBy: req.user._id,
      });
    }

    await note.populate('owner', 'username email');
    await note.populate('collaborators.user', 'username email');

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete note
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only owner can delete
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only owner can delete note' });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add collaborator
router.post('/:id/collaborators', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only owner can add collaborators
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only owner can add collaborators' });
    }

    const { userId, role } = req.body;

    // Check if already a collaborator
    const existingCollab = note.collaborators.find(
      (c) => c.user.toString() === userId
    );

    if (existingCollab) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    note.collaborators.push({ user: userId, role: role || 'editor' });
    await note.save();

    await note.populate('owner', 'username email');
    await note.populate('collaborators.user', 'username email');

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
