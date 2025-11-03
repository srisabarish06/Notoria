import express from 'express';
import Task from '../models/Task.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check ownership
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, status, dueDate, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = new Task({
      title,
      description: description || '',
      status: status || 'todo',
      dueDate: dueDate || null,
      priority: priority || 'medium',
      owner: req.user._id,
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check ownership
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { title, description, status, dueDate, priority } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check ownership
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
