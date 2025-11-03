import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';
import User from './UserSequelize.js';

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['ownerId'],
    },
    {
      fields: ['isPublic'],
    },
  ],
});

// Define associations
Note.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Note, { foreignKey: 'ownerId', as: 'notes' });

export default Note;
