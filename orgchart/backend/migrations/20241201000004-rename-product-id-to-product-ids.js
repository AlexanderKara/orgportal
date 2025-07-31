'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Переименовываем поле product_id в product_ids
    await queryInterface.renameColumn('meeting_room_bookings', 'product_id', 'product_ids');
    
    // Изменяем тип поля на TEXT для хранения JSON массива
    await queryInterface.changeColumn('meeting_room_bookings', 'product_ids', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Связанные продукты (JSON массив ID продуктов)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Возвращаем поле обратно к product_id
    await queryInterface.renameColumn('meeting_room_bookings', 'product_ids', 'product_id');
    
    // Возвращаем тип поля обратно к INTEGER
    await queryInterface.changeColumn('meeting_room_bookings', 'product_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Связь с продуктом'
    });
  }
};