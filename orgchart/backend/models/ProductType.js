const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProductType = sequelize.define('ProductType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'ProductType',
  tableName: 'product_types'
});

ProductType.associate = (models) => {
  ProductType.hasMany(models.Product, {
    as: 'products',
    foreignKey: 'product_type_id'
  });
};

module.exports = ProductType; 