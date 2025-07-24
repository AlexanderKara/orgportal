'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TokenType extends Model {
    static associate(models) {
      TokenType.hasMany(models.EmployeeToken, {
        foreignKey: 'tokenTypeId',
        as: 'employeeTokens'
      });
      TokenType.hasMany(models.TokenTransaction, {
        foreignKey: 'tokenTypeId',
        as: 'transactions'
      });
      TokenType.hasMany(models.Token, {
        foreignKey: 'tokenTypeId',
        as: 'tokens'
      });
    }
  }

  TokenType.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    conversionAmount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    conversionTargetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'token_types',
        key: 'id'
      }
    },
    backgroundColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'from-gray-400 to-gray-600'
    },
    textColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'text-white'
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    imageFolder: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    autoDistribution: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    autoDistributionPeriod: {
      type: DataTypes.ENUM('week', 'month', 'quarter', 'half_year', 'year'),
      allowNull: true
    },
    autoDistributionAmount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    autoDistributionActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'TokenType',
    tableName: 'token_types'
  });

  return TokenType;
}; 