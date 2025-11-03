import mongoose from 'mongoose';
import sequelize from './config/mysql.js';
import dotenv from 'dotenv';

// Import old Mongoose models
import User from './models/User.js';
import Note from './models/Note.js';
import Blog from './models/Blog.js';
import Task from './models/Task.js';
import Collab from './models/Collab.js';

// Import new Sequelize models
import UserSequelize from './models/UserSequelize.js';
import NoteSequelize from './models/NoteSequelize.js';
import BlogSequelize from './models/BlogSequelize.js';
import TaskSequelize from './models/TaskSequelize.js';
import CollabSequelize from './models/CollabSequelize.js';

dotenv.config();

const migrateData = async () => {
  try {
    console.log('Starting data migration from MongoDB to MySQL...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/notoria', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Connect to MySQL
    await sequelize.authenticate();
    console.log('Connected to MySQL');

    // Sync Sequelize models
    await sequelize.sync({ force: false }); // Don't drop tables, just ensure they exist
    console.log('MySQL tables synchronized');

    // Migrate Users
    console.log('Migrating users...');
    const users = await User.find({});
    for (const user of users) {
      await UserSequelize.findOrCreate({
        where: { email: user.email },
        defaults: {
          username: user.username,
          email: user.email,
          password: user.password, // Already hashed
          isAdmin: user.isAdmin || false,
          refreshToken: user.refreshToken || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    }
    console.log(`Migrated ${users.length} users`);

    // Get user ID mapping
    const userMapping = {};
    const sequelizeUsers = await UserSequelize.findAll();
    sequelizeUsers.forEach(user => {
      userMapping[user.email] = user.id;
    });

    // Migrate Blogs
    console.log('Migrating blogs...');
    const blogs = await Blog.find({});
    for (const blog of blogs) {
      const authorId = userMapping[blog.author.toString()];
      if (authorId) {
        await BlogSequelize.create({
          title: blog.title,
          content: blog.content,
          authorId: authorId,
          isPublic: blog.isPublic,
          tags: JSON.stringify(blog.tags || []),
          views: blog.views || 0,
          likes: JSON.stringify(blog.likes.map(id => id.toString()) || []),
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        });
      }
    }
    console.log(`Migrated ${blogs.length} blogs`);

    // Migrate Tasks
    console.log('Migrating tasks...');
    const tasks = await Task.find({});
    for (const task of tasks) {
      const ownerId = userMapping[task.owner.toString()];
      if (ownerId) {
        await TaskSequelize.create({
          title: task.title,
          description: task.description,
          status: task.status,
          dueDate: task.dueDate,
          ownerId: ownerId,
          priority: task.priority,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        });
      }
    }
    console.log(`Migrated ${tasks.length} tasks`);

    // Migrate Notes
    console.log('Migrating notes...');
    const notes = await Note.find({});
    for (const note of notes) {
      const ownerId = userMapping[note.owner.toString()];
      if (ownerId) {
        const sequelizeNote = await NoteSequelize.create({
          title: note.title,
          content: note.content,
          tags: JSON.stringify(note.tags || []),
          ownerId: ownerId,
          isPublic: note.isPublic,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        });

        // Migrate collaborators for this note
        if (note.collaborators && note.collaborators.length > 0) {
          for (const collab of note.collaborators) {
            const userId = userMapping[collab.user.toString()];
            if (userId) {
              await CollabSequelize.create({
                noteId: sequelizeNote.id,
                userId: userId,
                role: collab.role,
                status: 'accepted', // Assume existing collaborators are accepted
                invitedById: ownerId,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
              });
            }
          }
        }
      }
    }
    console.log(`Migrated ${notes.length} notes`);

    // Migrate pending collaborations
    console.log('Migrating pending collaborations...');
    const collabs = await Collab.find({});
    for (const collab of collabs) {
      const noteId = collab.noteId.toString();
      const userId = userMapping[collab.userId.toString()];
      const invitedById = userMapping[collab.invitedBy.toString()];

      // Find the corresponding note in MySQL
      const mongoNote = await Note.findById(noteId);
      if (mongoNote && userId && invitedById) {
        const ownerId = userMapping[mongoNote.owner.toString()];
        const sequelizeNote = await NoteSequelize.findOne({
          where: { title: mongoNote.title, ownerId: ownerId }
        });

        if (sequelizeNote) {
          await CollabSequelize.findOrCreate({
            where: {
              noteId: sequelizeNote.id,
              userId: userId,
            },
            defaults: {
              role: collab.role,
              invitedById: invitedById,
              status: collab.status,
              createdAt: collab.createdAt,
              updatedAt: collab.updatedAt,
            },
          });
        }
      }
    }
    console.log(`Migrated ${collabs.length} collaborations`);

    console.log('Data migration completed successfully!');
    console.log('Please verify the data in MySQL before removing MongoDB models.');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await mongoose.connection.close();
    await sequelize.close();
    process.exit(0);
  }
};

// Run migration
migrateData();
