const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const NotificationChat = sequelize.define('NotificationChat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('chat', 'group'),
    allowNull: false,
    defaultValue: 'chat'
  },
  chatId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'deleted'),
    allowNull: false,
    defaultValue: 'active'
  },
  commands: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      notifications: true,
      birthdays: true,
      vacations: true,
      help: true,
      auth: true  // Добавляем поддержку авторизации
    }
  },
  allowedUsers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  personalNotificationsDisabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'NotificationChat',
  tableName: 'notification_chats'
});

module.exports = NotificationChat; 