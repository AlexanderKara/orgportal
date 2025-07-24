'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TokenTransaction extends Model {
    static associate(models) {
      TokenTransaction.belongsTo(models.Employee, {
        foreignKey: 'fromEmployeeId',
        as: 'fromEmployee'
      });
      TokenTransaction.belongsTo(models.Employee, {
        foreignKey: 'toEmployeeId',
        as: 'toEmployee'
      });
      TokenTransaction.belongsTo(models.TokenType, {
        foreignKey: 'tokenTypeId',
        as: 'tokenType'
      });
    }
  }

  TokenTransaction.init({
    fromEmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Может быть null для админских начислений
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    toEmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    tokenTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'token_types',
        key: 'id'
      }
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TokenTransaction',
    tableName: 'token_transactions'
  });

  return TokenTransaction;
}; 