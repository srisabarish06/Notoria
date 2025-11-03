import express from 'express';
import Blog from '../models/BlogSequelize.js';
import User from '../models/UserSequelize.js';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all public blogs
router.get('/public', async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      where: { isPublic: true },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['username', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's blogs
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      where: { authorId: req.user.id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['username', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single blog
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['username', 'email'],
        },
      ],
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Check access
    if (!blog.isPublic && req.user?.id !== blog.authorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment views for public blogs
    if (blog.isPublic) {
      blog.views += 1;
      await blog.save();
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create blog
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags, isPublic } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const blog = await Blog.create({
      title,
      content,
      tags: JSON.stringify(tags || []),
      authorId: req.user.id,
      isPublic: isPublic || false,
    });

    const blogWithAuthor = await Blog.findByPk(blog.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['username', 'email'],
        },
      ],
    });

    res.status(201).json(blogWithAuthor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update blog
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Only author can update
    if (blog.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { title, content, tags, isPublic } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    await blog.update(updateData);

    const updatedBlog = await Blog.findByPk(blog.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['username', 'email'],
        },
      ],
    });

    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete blog
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Only author can delete
    if (blog.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await blog.destroy();
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like/Unlike blog
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const likes = JSON.parse(blog.likes || '[]');
    const userId = req.user.id;
    const likeIndex = likes.indexOf(userId);

    if (likeIndex > -1) {
      likes.splice(likeIndex, 1);
    } else {
      likes.push(userId);
    }

    blog.likes = JSON.stringify(likes);
    await blog.save();

    res.json({ likes: likes.length, liked: likeIndex === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
