const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const SkillGroup = sequelize.define('SkillGroup', {
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
      len: [0, 500]
    }
  },
  skill_type: {
    type: DataTypes.ENUM('hard', 'soft', 'hobby'),
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  }
}, {
  sequelize,
  modelName: 'SkillGroup',
  tableName: 'skill_groups',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['skill_type']
    }
  ]
});

// Ассоциации
SkillGroup.associate = (models) => {
  // Association with skills
  SkillGroup.hasMany(models.Skill, {
    as: 'skills',
    foreignKey: 'group_id'
  });
};

module.exports = SkillGroup; 