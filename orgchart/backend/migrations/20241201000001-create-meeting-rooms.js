'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('meeting_rooms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Название переговорной комнаты'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Описание переговорной комнаты'
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Вместимость комнаты'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Расположение комнаты'
      },
      equipment: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Оборудование в комнате (JSON)'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Активна ли комната'
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '#3B82F6',
        comment: 'Цвет комнаты для отображения'
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('meeting_rooms');
  }
}; 