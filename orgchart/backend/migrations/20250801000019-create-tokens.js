'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица
    const tables = await queryInterface.showAllTables();
    if (tables.includes('tokens')) {
      console.log('Table tokens already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('tokens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      publicId: { type: Sequelize.STRING(36), allowNull: false, unique: true },
      employeeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      tokenTypeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'token_types', key: 'id' } },
      senderId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' } },
      image: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      comment: { type: Sequelize.TEXT, allowNull: true },
      receivedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      status: { type: Sequelize.ENUM('available', 'received'), allowNull: false, defaultValue: 'available' },
      isDirectSent: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      sentAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Добавляем индексы с обработкой ошибок
    try {
      await queryInterface.addIndex('tokens', ['employeeId']);
    } catch (error) {
      console.log('Index tokens_employeeId already exists');
    }

    try {
      await queryInterface.addIndex('tokens', ['tokenTypeId']);
    } catch (error) {
      console.log('Index tokens_tokenTypeId already exists');
    }

    try {
      await queryInterface.addIndex('tokens', ['senderId']);
    } catch (error) {
      console.log('Index tokens_senderId already exists');
    }

    try {
      await queryInterface.addIndex('tokens', ['status']);
    } catch (error) {
      console.log('Index tokens_status already exists');
    }

    try {
      await queryInterface.addIndex('tokens', ['receivedAt']);
    } catch (error) {
      console.log('Index tokens_receivedAt already exists');
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tokens');
  }
}; 