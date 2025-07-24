const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 200]
    }
  },
  is_lead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  visibility: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  // Новые поля для управления видимостью
  visible_sections: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Список видимых разделов приложения'
  },
  visible_views: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Список видимых представлений для каждого раздела'
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#3B82F6',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Role',
  tableName: 'roles',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_system']
    }
  ],
  hooks: {
    beforeUpdate: (role) => {
      if (role.changed('is_system') && role.is_system === false && role._previousDataValues?.is_system) {
        throw new Error('Cannot modify system roles');
      }
    },
    beforeDestroy: (role) => {
      if (role.is_system) {
        throw new Error('Cannot delete system roles');
      }
    }
  }
});

// Ассоциации
Role.associate = (models) => {
  // Association with Employees (many-to-many)
  Role.belongsToMany(models.Employee, {
    through: 'employee_admin_roles',
    as: 'employees',
    foreignKey: 'role_id',
    otherKey: 'employee_id'
  });
};

// Instance methods
Role.prototype.hasPermission = function(module, action) {
  const permission = this.permissions.find(p => p.module === module);
  if (!permission) return false;
  return permission.actions.includes(action);
};

Role.prototype.addPermission = function(module, actions) {
  const existingPermission = this.permissions.find(p => p.module === module);
  
  if (existingPermission) {
    // Merge actions
    const uniqueActions = [...new Set([...existingPermission.actions, ...actions])];
    existingPermission.actions = uniqueActions;
  } else {
    this.permissions.push({ module, actions });
  }
  
  return this.save();
};

Role.prototype.removePermission = function(module, actions) {
  const permission = this.permissions.find(p => p.module === module);
  
  if (permission) {
    if (actions) {
      // Remove specific actions
      permission.actions = permission.actions.filter(action => !actions.includes(action));
      // Remove permission if no actions left
      if (permission.actions.length === 0) {
        this.permissions = this.permissions.filter(p => p.module !== module);
      }
    } else {
      // Remove entire permission
      this.permissions = this.permissions.filter(p => p.module !== module);
    }
  }
  
  return this.save();
};

Role.prototype.getStatistics = async function() {
  const { Employee } = require('./index');
  
  const employeeCount = await Employee.count({
    include: [{
      model: Role,
      as: 'adminRoles',
      where: { id: this.id }
    }],
    where: {
      status: 'active'
    }
  });
  
  return {
    employeeCount,
    permissionCount: this.permissions.reduce((total, perm) => total + perm.actions.length, 0),
    moduleCount: this.permissions.length
  };
};

// Static methods
Role.getAllPermissions = function() {
  return [
    {
      module: 'employees',
      actions: ['create', 'read', 'update', 'delete', 'manage'],
      label: 'Пользователи'
    },
    {
      module: 'departments',
      actions: ['create', 'read', 'update', 'delete', 'manage'],
      label: 'Отделы'
    },
    {
      module: 'skills',
      actions: ['create', 'read', 'update', 'delete', 'manage'],
      label: 'Навыки'
    },
    {
      module: 'skillGroups',
      actions: ['create', 'read', 'update', 'delete', 'manage'],
      label: 'Группы навыков'
    },
    {
      module: 'products',
      actions: ['create', 'read', 'update', 'delete', 'manage'],
      label: 'Продукты'
    },
    {
      module: 'vacations',
      actions: ['create', 'read', 'update', 'delete', 'manage'],
      label: 'Отпуска'
    },
    {
      module: 'roles',
      actions: ['create', 'read', 'update', 'delete', 'manage'],
      label: 'Роли'
    },
    {
      module: 'system',
      actions: ['read', 'update', 'manage'],
      label: 'Система'
    }
  ];
};

module.exports = Role; 