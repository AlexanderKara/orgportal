const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  short_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  long_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  product_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'product_types',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Product',
  tableName: 'products'
});

// Ассоциации
Product.associate = (models) => {
  Product.belongsTo(models.ProductType, {
    as: 'productType',
    foreignKey: 'product_type_id'
  });

  Product.hasMany(models.ProductParticipant, {
    as: 'participants',
    foreignKey: 'product_id'
  });
  
  Product.hasMany(models.ProductVersion, {
    as: 'versions',
    foreignKey: 'product_id'
  });
  
  Product.hasMany(models.ProductRelation, {
    as: 'sourceRelations',
    foreignKey: 'source_product_id'
  });
  
  Product.hasMany(models.ProductRelation, {
    as: 'targetRelations',
    foreignKey: 'target_product_id'
  });
};

// Instance methods
Product.prototype.getActiveParticipants = function() {
  const now = new Date();
  return this.participants.filter(participant => {
    if (participant.end_date && participant.end_date < now) {
      return false;
    }
    return true;
  });
};

Product.prototype.addParticipant = async function(employeeId, role, options = {}) {
  const { ProductParticipant } = require('./index');
  
  return await ProductParticipant.create({
    product_id: this.id,
    employee_id: employeeId,
    role: role,
    start_date: options.start_date || new Date(),
    end_date: options.end_date,
    hours_allocated: options.hours_allocated
  });
};

Product.prototype.removeParticipant = async function(employeeId) {
  const { ProductParticipant } = require('./index');
  
  return await ProductParticipant.destroy({
    where: {
      product_id: this.id,
      employee_id: employeeId
    }
  });
};

Product.prototype.addVersion = async function(version, description, options = {}) {
  const { ProductVersion } = require('./index');
  
  return await ProductVersion.create({
    product_id: this.id,
    version: version,
    description: description,
    release_date: options.release_date,
    status: options.status || 'development'
  });
};

Product.prototype.getStatistics = async function() {
  const { ProductParticipant, Employee, Department } = require('./index');
  
  const participants = await ProductParticipant.findAll({
    where: {
      product_id: this.id
    },
    include: [{
      model: Employee,
      as: 'employee',
      include: [{
        model: Department,
        as: 'department',
        attributes: ['name']
      }]
    }]
  });
  
  const departmentStats = {};
  participants.forEach(participant => {
    const deptName = participant.employee.department?.name || 'Unknown';
    if (!departmentStats[deptName]) {
      departmentStats[deptName] = 0;
    }
    departmentStats[deptName]++;
  });
  
  return {
    totalParticipants: participants.length,
    departmentStats
  };
};

module.exports = Product; 