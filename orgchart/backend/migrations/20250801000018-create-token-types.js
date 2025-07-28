'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица
    const tables = await queryInterface.showAllTables();
    if (tables.includes('token_types')) {
      console.log('Table token_types already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('token_types', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      color: { type: Sequelize.STRING, allowNull: false },
      value: { type: Sequelize.INTEGER, allowNull: false },
      image: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      auto_distribution_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Добавляем индексы с обработкой ошибок
    try {
      await queryInterface.addIndex('token_types', ['name']);
    } catch (error) {
      console.log('Index token_types_name already exists');
    }

    try {
      await queryInterface.addIndex('token_types', ['color']);
    } catch (error) {
      console.log('Index token_types_color already exists');
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('token_types');
  }
}; 