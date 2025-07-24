'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Token extends Model {
    static associate(models) {
      // Связь с сотрудником (получатель)
      Token.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });
      // Связь с типом токена
      Token.belongsTo(models.TokenType, {
        foreignKey: 'tokenTypeId',
        as: 'tokenType'
      });
      // Связь с сотрудником (отправитель)
      Token.belongsTo(models.Employee, {
        foreignKey: 'senderId',
        as: 'sender'
      });
    }
  }

  Token.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    publicId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      unique: true,
      comment: 'Публичный идентификатор для QR-кодов'
    },
    employeeId: {
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
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Путь к изображению токена'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание токена (может быть изменено сотрудником)'
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Комментарий при отправке'
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('available', 'received'),
      allowNull: false,
      defaultValue: 'available'
    },
    isDirectSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Token',
    tableName: 'tokens',
    timestamps: true,
    indexes: [
      { fields: ['employeeId'] },
      { fields: ['tokenTypeId'] },
      { fields: ['senderId'] },
      { fields: ['status'] },
      { fields: ['receivedAt'] }
    ]
  });

  return Token;
}; 