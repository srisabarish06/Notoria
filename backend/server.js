import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/mysql.js';

// Import routes
import userRoutes from './routes/users.js';
import noteRoutes from './routes/notes.js';
import blogRoutes from './routes/blogs.js';
import taskRoutes from './routes/tasks.js';
import collabRoutes from './routes/collab.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MySQL and sync database
connectDB().then(async () => {
  try {
    // Import models to ensure they are registered
    await import('./models/UserSequelize.js');
    await import('./models/NoteSequelize.js');
    await import('./models/BlogSequelize.js');
    await import('./models/TaskSequelize.js');
    await import('./models/CollabSequelize.js');

    // Sync all models with database
    const sequelize = (await import('./config/mysql.js')).default;
    await sequelize.sync({ alter: true }); // Use alter: true for development to update schema
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Database sync failed:', error);
    process.exit(1);
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-note', (noteId) => {
    socket.join(`note-${noteId}`);
    console.log(`Socket ${socket.id} joined note ${noteId}`);
  });

  socket.on('leave-note', (noteId) => {
    socket.leave(`note-${noteId}`);
    console.log(`Socket ${socket.id} left note ${noteId}`);
  });

  socket.on('note-update', (data) => {
    socket.to(`note-${data.noteId}`).emit('note-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/collab', collabRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Notoria API is running' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
