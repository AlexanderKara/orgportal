const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Уведомление #'
  },
  recurrence: {
    type: DataTypes.ENUM('once', 'daily', 'weekly', 'monthly', 'yearly', 'weekdays', 'monthday'),
    allowNull: false,
    defaultValue: 'once'
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Templates',
      key: 'id'
    }
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  interval: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  intervalType: {
    type: DataTypes.ENUM('days', 'weeks', 'months', 'years'),
    allowNull: false,
    defaultValue: 'days'
  },
  weekDays: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  monthDay: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
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
  lastSent: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextSend: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sendTime: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Время отправки уведомления (HH:MM)'
  },
  recipients: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  paranoid: true
});

// Ассоциации
Notification.associate = (models) => {
  Notification.belongsTo(models.Template, {
    foreignKey: 'templateId',
    as: 'template'
  });
};

module.exports = Notification; 