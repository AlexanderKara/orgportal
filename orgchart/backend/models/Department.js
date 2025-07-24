const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Department = sequelize.define('Department', {
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
  slogan: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  competencies: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#3B82F6',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'archived'),
    allowNull: false,
    defaultValue: 'active'
  },
  employee_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Порядок отображения отдела в списке'
  }
}, {
  sequelize,
  modelName: 'Department',
  tableName: 'departments'
});

// Ассоциации
Department.associate = (models) => {
  // Association with employees in department
  Department.hasMany(models.Employee, {
    as: 'employees',
    foreignKey: 'department_id'
  });
};

// Instance methods
Department.prototype.getHierarchy = async function() {
  const hierarchy = [];
  let currentDept = this;
  
  // Кэшируем запросы для избежания N+1
  const deptCache = new Map();
  deptCache.set(currentDept.id, currentDept);
  
  while (currentDept) {
    hierarchy.unshift({
      id: currentDept.id,
      name: currentDept.name
    });
    
    // Since we removed parent_department_id, this method is simplified
    break;
  }
  
  return hierarchy;
};

Department.prototype.getAllSubDepartments = async function() {
  // Since we removed parent_department_id, return empty array
  return [];
};

// Статический метод для получения всей иерархии отделов одним запросом
Department.getFullHierarchy = async function() {
  const allDepartments = await Department.findAll({
    order: [['order', 'ASC'], ['name', 'ASC']]
  });
  
  // Since we removed parent_department_id, return flat list
  return allDepartments.map(dept => ({
    ...dept.toJSON(),
    children: []
  }));
};

module.exports = Department; 