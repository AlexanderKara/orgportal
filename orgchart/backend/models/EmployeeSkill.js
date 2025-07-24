const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const EmployeeSkill = sequelize.define('EmployeeSkill', {
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
  skill_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'skills',
      key: 'id'
    }
  },
  skill_level_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'skill_levels',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'EmployeeSkill',
  tableName: 'employee_skills',
  timestamps: true,
  indexes: [
    {
      fields: ['employee_id']
    },
    {
      fields: ['skill_id']
    },
    {
      fields: ['skill_level_id']
    }
  ]
});

// Ассоциации
EmployeeSkill.associate = (models) => {
  EmployeeSkill.belongsTo(models.Employee, {
    as: 'employee',
    foreignKey: 'employee_id'
  });
  
  EmployeeSkill.belongsTo(models.Skill, {
    as: 'skill',
    foreignKey: 'skill_id'
  });
  
  EmployeeSkill.belongsTo(models.SkillLevel, {
    as: 'skillLevel',
    foreignKey: 'skill_level_id'
  });
};

module.exports = EmployeeSkill; 