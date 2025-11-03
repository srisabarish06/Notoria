import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';
import User from './UserSequelize.js';
import Note from './NoteSequelize.js';

const Collab = sequelize.define('Collab', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  noteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Note,
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  role: {
    type: DataTypes.ENUM('viewer', 'editor'),
    defaultValue: 'editor',
  },
  invitedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['noteId'],
    },
    {
      fields: ['userId'],
    },
    {
      unique: true,
      fields: ['noteId', 'userId'],
    },
  ],
});

// Define associations
Collab.belongsTo(Note, { foreignKey: 'noteId', as: 'note' });
Collab.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Collab.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });

Note.hasMany(Collab, { foreignKey: 'noteId', as: 'collaborators' });
User.hasMany(Collab, { foreignKey: 'userId', as: 'collaborations' });

export default Collab;
