import express from 'express';
import Blog from '../models/Blog.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all public blogs
router.get('/public', async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublic: true })
      .populate('author', 'username email')
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's blogs
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .populate('author', 'username email')
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single blog
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'username email');

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Check access
    if (!blog.isPublic && req.user?._id?.toString() !== blog.author._id.toString()) {
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

    const blog = new Blog({
      title,
      content,
      tags: tags || [],
      author: req.user._id,
      isPublic: isPublic || false,
    });

    await blog.save();
    await blog.populate('author', 'username email');

    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update blog
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Only author can update
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { title, content, tags, isPublic } = req.body;

    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (tags !== undefined) blog.tags = tags;
    if (isPublic !== undefined) blog.isPublic = isPublic;

    await blog.save();
    await blog.populate('author', 'username email');

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete blog
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Only author can delete
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like/Unlike blog
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const userId = req.user._id.toString();
    const likeIndex = blog.likes.findIndex(
      (id) => id.toString() === userId
    );

    if (likeIndex > -1) {
      blog.likes.splice(likeIndex, 1);
    } else {
      blog.likes.push(req.user._id);
    }

    await blog.save();
    res.json({ likes: blog.likes.length, liked: likeIndex === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
