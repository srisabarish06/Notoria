import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';
import User from './UserSequelize.js';

const Task = sequelize.define('Task', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('todo', 'in-progress', 'completed'),
    defaultValue: 'todo',
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['ownerId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['dueDate'],
    },
  ],
});

// Define associations
Task.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Task, { foreignKey: 'ownerId', as: 'tasks' });

export default Task;
