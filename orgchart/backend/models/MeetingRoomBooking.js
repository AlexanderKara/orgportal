const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const MeetingRoomBooking = sequelize.define('MeetingRoomBooking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  meeting_room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'meeting_rooms',
      key: 'id'
    },
    comment: 'ID переговорной комнаты'
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    },
    comment: 'ID сотрудника, который забронировал'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Название встречи'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Описание встречи'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Время начала бронирования'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Время окончания бронирования'
  },
  participants: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Участники встречи (JSON массив ID сотрудников)'
  },
  documents: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Документы и ссылки (JSON)'
  },
  video_link: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Ссылка на видеовстречу'
  },
  location_address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Адрес места проведения'
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id'
    },
    comment: 'Связь с продуктом (устаревшее поле)'
  },
  product_ids: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Связанные продукты (JSON массив ID продуктов)'
  },
  status: {
    type: DataTypes.ENUM('confirmed', 'pending', 'cancelled'),
    allowNull: false,
    defaultValue: 'confirmed',
    comment: 'Статус бронирования'
  },
  notifications: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Настройки уведомлений (JSON)'
  }
}, {
  tableName: 'meeting_room_bookings',
  timestamps: true,
  underscored: true
});

// Ассоциации
MeetingRoomBooking.associate = function(models) {
  MeetingRoomBooking.belongsTo(models.MeetingRoom, {
    foreignKey: 'meeting_room_id',
    as: 'meetingRoom'
  });
  
  MeetingRoomBooking.belongsTo(models.Employee, {
    foreignKey: 'employee_id',
    as: 'employee'
  });
  
  MeetingRoomBooking.hasMany(models.BookingRequest, {
    foreignKey: 'booking_id',
    as: 'requests'
  });
};

module.exports = MeetingRoomBooking; 