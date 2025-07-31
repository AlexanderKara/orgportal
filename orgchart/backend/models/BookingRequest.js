const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const BookingRequest = sequelize.define('BookingRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'meeting_room_bookings',
      key: 'id'
    },
    comment: 'ID бронирования'
  },
  requester_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    },
    comment: 'ID сотрудника, который запросил изменение'
  },
  request_type: {
    type: DataTypes.ENUM('cancel', 'reschedule'),
    allowNull: false,
    comment: 'Тип запроса: отмена или перенос'
  },
  new_start_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Новое время начала (для переноса)'
  },
  new_end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Новое время окончания (для переноса)'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Причина запроса'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Статус запроса'
  },
  response_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ответ на запрос'
  }
}, {
  tableName: 'booking_requests',
  timestamps: true,
  underscored: true
});

// Ассоциации
BookingRequest.associate = function(models) {
  BookingRequest.belongsTo(models.MeetingRoomBooking, {
    foreignKey: 'booking_id',
    as: 'booking'
  });
  
  BookingRequest.belongsTo(models.Employee, {
    foreignKey: 'requester_id',
    as: 'requester'
  });
};

module.exports = BookingRequest; 