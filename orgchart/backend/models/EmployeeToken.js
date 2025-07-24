'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeToken extends Model {
    static associate(models) {
      EmployeeToken.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });
      EmployeeToken.belongsTo(models.TokenType, {
        foreignKey: 'tokenTypeId',
        as: 'tokenType'
      });
    }
  }

  EmployeeToken.init({
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Employees',
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
      defaultValue: 0
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'EmployeeToken',
    tableName: 'employee_tokens'
  });

  return EmployeeToken;
}; 