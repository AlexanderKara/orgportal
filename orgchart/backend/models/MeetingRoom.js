const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const MeetingRoom = sequelize.define('MeetingRoom', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Название переговорной комнаты'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Описание переговорной комнаты'
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Вместимость комнаты'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Расположение комнаты'
  },
  equipment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Оборудование в комнате (JSON)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Активна ли комната'
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#3B82F6',
    comment: 'Цвет комнаты для отображения'
  }
}, {
  tableName: 'meeting_rooms',
  timestamps: true,
  underscored: true
});

// Ассоциации
MeetingRoom.associate = function(models) {
  MeetingRoom.hasMany(models.MeetingRoomBooking, {
    foreignKey: 'meeting_room_id',
    as: 'bookings'
  });
};

module.exports = MeetingRoom; 