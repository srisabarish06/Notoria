import express from 'express';
import Task from '../models/TaskSequelize.js';
import User from '../models/UserSequelize.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { ownerId: req.user.id },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['username', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['username', 'email'],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check ownership
    if (task.ownerId !== req.user.id) {
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

    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'todo',
      dueDate: dueDate || null,
      priority: priority || 'medium',
      ownerId: req.user.id,
    });

    const taskWithOwner = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['username', 'email'],
        },
      ],
    });

    res.status(201).json(taskWithOwner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check ownership
    if (task.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { title, description, status, dueDate, priority } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (priority !== undefined) updateData.priority = priority;

    await task.update(updateData);

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['username', 'email'],
        },
      ],
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check ownership
    if (task.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
