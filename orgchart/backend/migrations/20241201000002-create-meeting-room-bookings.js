'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('meeting_room_bookings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      meeting_room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'meeting_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID переговорной комнаты'
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID сотрудника, который забронировал'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Название встречи'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Описание встречи'
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Время начала бронирования'
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Время окончания бронирования'
      },
      participants: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Участники встречи (JSON массив ID сотрудников)'
      },
      documents: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Документы и ссылки (JSON)'
      },
      video_link: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Ссылка на видеовстречу'
      },
      location_address: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Адрес места проведения'
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Связь с продуктом'
      },
      status: {
        type: Sequelize.ENUM('confirmed', 'pending', 'cancelled'),
        allowNull: false,
        defaultValue: 'confirmed',
        comment: 'Статус бронирования'
      },
      notifications: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Настройки уведомлений (JSON)'
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
    await queryInterface.addIndex('meeting_room_bookings', ['meeting_room_id']);
    await queryInterface.addIndex('meeting_room_bookings', ['employee_id']);
    await queryInterface.addIndex('meeting_room_bookings', ['start_time']);
    await queryInterface.addIndex('meeting_room_bookings', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('meeting_room_bookings');
  }
}; 