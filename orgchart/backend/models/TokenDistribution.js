'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TokenDistribution extends Model {
    static associate(models) {
      TokenDistribution.belongsTo(models.TokenType, {
        foreignKey: 'tokenTypeId',
        as: 'tokenType'
      });
    }
  }

  TokenDistribution.init({
    tokenTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'token_types',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    executedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    distributionPeriod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    distributionAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    targetEmployeesCount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    processedEmployeesCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    successCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    errorCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    totalTokensDistributed: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    executionLog: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Europe/Moscow'
    },
    workingDaysOnly: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    nextScheduledDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TokenDistribution',
    tableName: 'token_distributions'
  });

  TokenDistribution.associate = (models) => {
    // Связь с типом токена
    TokenDistribution.belongsTo(models.TokenType, {
      foreignKey: 'tokenTypeId',
      as: 'tokenType'
    });
  };

  return TokenDistribution;
}; 