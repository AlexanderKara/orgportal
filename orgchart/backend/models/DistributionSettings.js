'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DistributionSettings extends Model {
    static associate(models) {
      // define association here
    }
  }

  DistributionSettings.init({
    serviceEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    executionTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '09:00:00'
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Europe/Moscow'
    },
    workingDaysOnly: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    workingDays: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [1, 2, 3, 4, 5] // Понедельник-Пятница
    },
    holidays: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    retryAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    retryDelay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5000 // 5 секунд
    },
    notificationOnError: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notificationEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    maxConcurrentDistributions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    distributionBatchSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    }
  }, {
    sequelize,
    modelName: 'DistributionSettings',
    tableName: 'distribution_settings'
  });

  return DistributionSettings;
}; 