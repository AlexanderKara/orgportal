const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProductRelation = sequelize.define('ProductRelation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  source_product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  target_product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  relation_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'product_relation_types',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'ProductRelation',
  tableName: 'product_relations'
});

// Ассоциации
ProductRelation.associate = (models) => {
  ProductRelation.belongsTo(models.Product, {
    as: 'sourceProduct',
    foreignKey: 'source_product_id'
  });
  
  ProductRelation.belongsTo(models.Product, {
    as: 'targetProduct',
    foreignKey: 'target_product_id'
  });
  
  ProductRelation.belongsTo(models.ProductRelationType, {
    as: 'relationType',
    foreignKey: 'relation_type_id'
  });
};

module.exports = ProductRelation; 