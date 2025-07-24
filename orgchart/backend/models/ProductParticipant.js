const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProductParticipant = sequelize.define('ProductParticipant', {
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
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'roles',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'ProductParticipant',
  tableName: 'product_participants',
  timestamps: true,
  indexes: [
    {
      fields: ['product_id']
    },
    {
      fields: ['employee_id']
    },
    {
      fields: ['role_id']
    }
  ]
});

// Ассоциации
ProductParticipant.associate = (models) => {
  ProductParticipant.belongsTo(models.Product, {
    as: 'product',
    foreignKey: 'product_id'
  });
  
  ProductParticipant.belongsTo(models.Employee, {
    as: 'employee',
    foreignKey: 'employee_id'
  });
  
  ProductParticipant.belongsTo(models.Role, {
    as: 'role',
    foreignKey: 'role_id'
  });
};

module.exports = ProductParticipant; 