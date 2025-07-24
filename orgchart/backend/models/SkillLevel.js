const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const SkillLevel = sequelize.define('SkillLevel', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 200]
    }
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  }
}, {
  sequelize,
  modelName: 'SkillLevel',
  tableName: 'skill_levels',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['value']
    }
  ]
});

// Ассоциации
SkillLevel.associate = (models) => {
  // Убираем ассоциацию с EmployeeSkill, так как поля employee_skill_id нет
};

module.exports = SkillLevel; 