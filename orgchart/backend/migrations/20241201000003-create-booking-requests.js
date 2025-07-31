'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('booking_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'meeting_room_bookings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID бронирования'
      },
      requester_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID сотрудника, который запросил изменение'
      },
      request_type: {
        type: Sequelize.ENUM('cancel', 'reschedule'),
        allowNull: false,
        comment: 'Тип запроса: отмена или перенос'
      },
      new_start_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Новое время начала (для переноса)'
      },
      new_end_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Новое время окончания (для переноса)'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Причина запроса'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Статус запроса'
      },
      response_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ответ на запрос'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Добавляем индексы для оптимизации запросов
    await queryInterface.addIndex('booking_requests', ['booking_id']);
    await queryInterface.addIndex('booking_requests', ['requester_id']);
    await queryInterface.addIndex('booking_requests', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('booking_requests');
  }
}; 