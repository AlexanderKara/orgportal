const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^\+[\d]{10,}$/
    }
  },
  telegram: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      is: /^@[a-zA-Z0-9_]{5,}$/
    }
  },
  telegram_chat_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID чата Telegram бота с сотрудником'
  },
  birth_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Дата рождения сотрудника'
  },
  wishlist_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'Ссылка на вишлист сотрудника'
  },
  position: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  hire_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  avatar: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'terminated'),
    allowNull: false,
    defaultValue: 'active'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark'),
    allowNull: false,
    defaultValue: 'light'
  },
  department_role: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON массив ID навыков, которые сотрудник хочет изучить'
  },
  products: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON массив ID продуктов, в которых сотрудник хочет участвовать'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Заметки сотрудника о карьерных целях и пожеланиях'
  },
  competencies: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Компетенции сотрудника (каждая с новой строки)'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  // Поля для системы токенов
  canSendYellowTokens: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Может ли сотрудник отправлять желтые токены'
  },
  canSendRedTokens: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Может ли сотрудник отправлять красные токены'
  },
  canSendPlatinumTokens: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Может ли сотрудник отправлять платиновые токены'
  },
  grayTokensLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 15,
    comment: 'Лимит серых токенов в месяц'
  },
  yellowTokensLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Лимит желтых токенов в месяц'
  },
  redTokensLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Лимит красных токенов в месяц'
  },
  platinumTokensLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Лимит платиновых токенов в месяц'
  }
}, {
  sequelize,
  modelName: 'Employee',
  tableName: 'employees',
  timestamps: true,
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['department_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['first_name', 'last_name']
    }
  ]
});

// Ассоциации
Employee.associate = (models) => {
  // Association with Department
  Employee.belongsTo(models.Department, {
    as: 'department',
    foreignKey: 'department_id'
  });
  
  // Association with Roles (many-to-many)
  Employee.belongsToMany(models.Role, {
    through: 'employee_admin_roles',
    as: 'adminRoles',
    foreignKey: 'employee_id',
    otherKey: 'role_id'
  });
  
  // Association with EmployeeSkills
  Employee.hasMany(models.EmployeeSkill, {
    as: 'employeeSkills',
    foreignKey: 'employee_id'
  });
  
  // Association with Vacation
  Employee.hasMany(models.Vacation, {
    as: 'vacations',
    foreignKey: 'employee_id'
  });
  
  // Association with EmployeeToken
  Employee.hasMany(models.EmployeeToken, {
    as: 'employeeTokens',
    foreignKey: 'employeeId'
  });
  
  // Association with EmployeeAchievement
  Employee.hasMany(models.EmployeeAchievement, {
    as: 'employeeAchievements',
    foreignKey: 'employeeId'
  });
  
  // Association with TokenTransaction (as sender)
  Employee.hasMany(models.TokenTransaction, {
    as: 'sentTokens',
    foreignKey: 'fromEmployeeId'
  });
  
  // Association with TokenTransaction (as receiver)
  Employee.hasMany(models.TokenTransaction, {
    as: 'receivedTokens',
    foreignKey: 'toEmployeeId'
  });
};

// Instance methods
Employee.prototype.getPublicProfile = function() {
  const employeeData = this.toJSON();
  return employeeData;
};

Employee.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

// Метод для проверки прав доступа
Employee.prototype.hasPermission = function(module, action) {
  // Проверяем все роли пользователя
  if (!this.adminRoles || this.adminRoles.length === 0) {
    return false;
  }
  
  // Проверяем права для каждой роли
  return this.adminRoles.some(role => {
    // Здесь можно добавить логику проверки прав на основе роли
    // Пока что возвращаем true для всех ролей
    return true;
  });
};

// Статический метод для поиска сотрудников с фильтрацией
Employee.findWithFilters = async function(filters = {}) {
  const where = {};
  
  if (filters.department_id) {
    where.department_id = filters.department_id;
  }
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.search) {
    where[sequelize.Op.or] = [
      { first_name: { [sequelize.Op.like]: `%${filters.search}%` } },
      { last_name: { [sequelize.Op.like]: `%${filters.search}%` } },
      { email: { [sequelize.Op.like]: `%${filters.search}%` } },
      { position: { [sequelize.Op.like]: `%${filters.search}%` } }
    ];
  }
  
  return await Employee.findAll({
    where,
    include: [
      {
        model: sequelize.models.Department,
        as: 'department',
        attributes: ['id', 'name', 'color']
      },
      {
        model: sequelize.models.Role,
        as: 'adminRoles',
        attributes: ['id', 'name', 'color', 'icon'],
        through: { attributes: [] }
      }
    ],
    order: [['first_name', 'ASC'], ['last_name', 'ASC']]
  });
};

module.exports = Employee; 