'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeAchievement extends Model {
    static associate(models) {
      EmployeeAchievement.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });
      EmployeeAchievement.belongsTo(models.Achievement, {
        foreignKey: 'achievementId',
        as: 'achievement'
      });
    }
  }

  EmployeeAchievement.init({
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Employees',
        key: 'id'
      }
    },
    achievementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'achievements',
        key: 'id'
      }
    },
    earnedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Путь к изображению бейджа для конкретного сотрудника'
    }
  }, {
    sequelize,
    modelName: 'EmployeeAchievement',
    tableName: 'employee_achievements'
  });

  return EmployeeAchievement;
}; 