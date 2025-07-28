'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица
    const tableExists = await queryInterface.showAllTables();
    if (tableExists.includes('product_types')) {
      console.log('Table product_types already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('product_types', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      icon: { type: Sequelize.STRING(100), allowNull: true },
      color: { type: Sequelize.STRING(7), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    
    // Добавляем индексы только если они не существуют
    try {
      await queryInterface.addIndex('product_types', ['code']);
    } catch (e) {
      console.log('Index on code already exists');
    }
    
    try {
      await queryInterface.addIndex('product_types', ['name']);
    } catch (e) {
      console.log('Index on name already exists');
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_types');
  }
}; 