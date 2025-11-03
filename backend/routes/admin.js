import express from 'express';
import User from '../models/User.js';
import Note from '../models/Note.js';
import Blog from '../models/Blog.js';
import Task from '../models/Task.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all notes
router.get('/notes', authenticateAdmin, async (req, res) => {
  try {
    const notes = await Note.find()
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all blogs
router.get('/blogs', authenticateAdmin, async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'username email')
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalNotes = await Note.countDocuments();
    const totalBlogs = await Blog.countDocuments();
    const totalTasks = await Task.countDocuments();
    const publicBlogs = await Blog.countDocuments({ isPublic: true });
    const publicNotes = await Note.countDocuments({ isPublic: true });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const recentNotes = await Note.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const recentBlogs = await Blog.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      overview: {
        totalUsers,
        totalNotes,
        totalBlogs,
        totalTasks,
        publicBlogs,
        publicNotes,
      },
      recentActivity: {
        recentUsers,
        recentNotes,
        recentBlogs,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
