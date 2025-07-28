'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Achievement extends Model {
    static associate(models) {
      Achievement.hasMany(models.EmployeeAchievement, {
        foreignKey: 'achievementId',
        as: 'employeeAchievements'
      });
    }
  }

  Achievement.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('social', 'activity', 'generosity', 'team', 'special', 'seasonal', 'unique'),
      allowNull: false
    },
    criteria: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('criteria');
        if (!rawValue) return {};
        try {
          return JSON.parse(rawValue);
        } catch (error) {
          console.error('Error parsing criteria JSON:', error);
          return {};
        }
      },
      set(value) {
        this.setDataValue('criteria', JSON.stringify(value));
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Путь к изображению бейджа',
      get() {
        const rawValue = this.getDataValue('image');
        return rawValue || null;
      },
      set(value) {
        this.setDataValue('image', value || null);
      }
    },
    is_random: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Использовать случайное изображение из папки'
    },
    is_unique: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Уникальный бейдж (назначается вручную)'
    }
  }, {
    sequelize,
    modelName: 'Achievement',
    tableName: 'achievements'
  });

  return Achievement;
}; 