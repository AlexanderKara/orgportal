const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProductRelationType = sequelize.define('ProductRelationType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true
  }
}, {
  tableName: 'product_relation_types',
  timestamps: true
});

module.exports = ProductRelationType; 