const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AppSettings = sequelize.define('AppSettings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string'
    }
  }, {
    tableName: 'app_settings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['key']
      }
    ]
  });

  return AppSettings;
};