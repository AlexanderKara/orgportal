const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'deleted'),
    allowNull: false,
    defaultValue: 'active'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Template',
  tableName: 'templates'
});

// Ассоциации
Template.associate = (models) => {
  Template.hasMany(models.Notification, {
    foreignKey: 'templateId',
    as: 'notifications'
  });
};

module.exports = Template; 