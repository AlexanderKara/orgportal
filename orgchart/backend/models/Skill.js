const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const { fn, col } = require('sequelize');

const Skill = sequelize.define('Skill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  skill_type: {
    type: DataTypes.ENUM('hard', 'soft', 'hobby'),
    allowNull: false,
    defaultValue: 'hard'
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'skill_groups',
      key: 'id'
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
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Skill',
  tableName: 'skills'
});

// Ассоциации
Skill.associate = (models) => {
  Skill.belongsTo(models.SkillGroup, {
    as: 'skillGroup',
    foreignKey: 'group_id'
  });
  
  Skill.hasMany(models.EmployeeSkill, {
    as: 'employeeSkills',
    foreignKey: 'skill_id'
  });
};

// Instance methods
Skill.prototype.getStatistics = async function() {
  const { EmployeeSkill } = require('./index');
  
  const stats = await EmployeeSkill.findAll({
    where: {
      skill_id: this.id
    },
    attributes: [
      'skill_level',
      [fn('COUNT', col('id')), 'count']
    ],
    group: ['skill_level'],
    include: [{
      model: require('./Employee'),
      as: 'employee',
      attributes: []
    }]
  });
  
  return stats;
};

Skill.prototype.getEmployees = async function() {
  const { EmployeeSkill, Employee } = require('./index');
  
  return await EmployeeSkill.findAll({
    where: {
      skill_id: this.id
    },
    include: [{
      model: Employee,
      as: 'employee',
      include: [{
        model: require('./Department'),
        as: 'department',
        attributes: ['name']
      }]
    }]
  });
};

module.exports = Skill; 