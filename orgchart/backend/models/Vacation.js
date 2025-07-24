const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Vacation = sequelize.define('Vacation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  days_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  vacation_type: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  }
}, {
  sequelize,
  modelName: 'Vacation',
  tableName: 'vacations',
  timestamps: true,
  indexes: [
    {
      fields: ['employee_id']
    }
  ],
  hooks: {
    beforeCreate: (vacation) => {
      // Calculate days count
      if (vacation.start_date && vacation.end_date) {
        const startDate = new Date(vacation.start_date);
        const endDate = new Date(vacation.end_date);
        
        // Устанавливаем время в 00:00:00 для корректного расчета
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        vacation.days_count = diffDays + 1; // Включаем обе даты
      }
      
      // Validate dates
      if (vacation.end_date && vacation.start_date && vacation.end_date < vacation.start_date) {
        throw new Error('End date cannot be before start date');
      }
    },
    beforeSave: (vacation) => {
      // Calculate days count
      if (vacation.start_date && vacation.end_date) {
        const startDate = new Date(vacation.start_date);
        const endDate = new Date(vacation.end_date);
        
        // Устанавливаем время в 00:00:00 для корректного расчета
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        vacation.days_count = diffDays + 1; // Включаем обе даты
      }
      
      // Validate dates
      if (vacation.end_date && vacation.start_date && vacation.end_date < vacation.start_date) {
        throw new Error('End date cannot be before start date');
      }
    }
  }
});

// Ассоциации
Vacation.associate = (models) => {
  Vacation.belongsTo(models.Employee, {
    as: 'employee',
    foreignKey: 'employee_id'
  });
};

// Instance methods
Vacation.prototype.getDuration = function() {
  if (!this.start_date || !this.end_date) return 0;
  
  const startDate = new Date(this.start_date);
  const endDate = new Date(this.end_date);
  
  // Устанавливаем время в 00:00:00 для корректного расчета
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Включаем обе даты
};

Vacation.prototype.isActive = function() {
  const now = new Date();
  return this.start_date <= now && this.end_date >= now;
};

Vacation.prototype.isUpcoming = function() {
  const now = new Date();
  return this.start_date > now;
};

// Static methods
Vacation.getByEmployee = async function(employeeId, options = {}) {
  const { Employee } = require('./index');
  
  const where = { employee_id: employeeId };
  
  if (options.year) {
    const startOfYear = new Date(options.year, 0, 1);
    const endOfYear = new Date(options.year, 11, 31);
    where.start_date = {
      [sequelize.Op.gte]: startOfYear,
      [sequelize.Op.lte]: endOfYear
    };
  }
  
  return await Vacation.findAll({
    where,
    include: [
      {
        model: Employee,
        as: 'employee',
        attributes: ['first_name', 'last_name', 'email']
      }
    ],
    order: [['start_date', 'DESC']]
  });
};

Vacation.getByDateRange = async function(startDate, endDate, options = {}) {
  const { Employee } = require('./index');
  
  const where = {
    [sequelize.Op.or]: [
      {
        start_date: {
          [sequelize.Op.gte]: startDate,
          [sequelize.Op.lte]: endDate
        }
      },
      {
        end_date: {
          [sequelize.Op.gte]: startDate,
          [sequelize.Op.lte]: endDate
        }
      },
      {
        start_date: { [sequelize.Op.lte]: startDate },
        end_date: { [sequelize.Op.gte]: endDate }
      }
    ]
  };
  
  return await Vacation.findAll({
    where,
    include: [
      {
        model: Employee,
        as: 'employee',
        attributes: ['first_name', 'last_name', 'email']
      }
    ],
    order: [['start_date', 'ASC']]
  });
};

module.exports = Vacation; 