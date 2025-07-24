const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProductVersion = sequelize.define('ProductVersion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  version_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'ProductVersion',
  tableName: 'product_versions',
  timestamps: true,
  indexes: [
    {
      fields: ['product_id']
    },
    {
      fields: ['version_id']
    }
  ]
});

// Ассоциации
ProductVersion.associate = (models) => {
  ProductVersion.belongsTo(models.Product, {
    as: 'product',
    foreignKey: 'product_id'
  });
};

module.exports = ProductVersion; 