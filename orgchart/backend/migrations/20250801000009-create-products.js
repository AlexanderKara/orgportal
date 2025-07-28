'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица
    const tableExists = await queryInterface.showAllTables();
    if (tableExists.includes('products')) {
      console.log('Table products already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      short_description: { type: Sequelize.TEXT, allowNull: true },
      long_description: { type: Sequelize.TEXT, allowNull: true },
      logo: { type: Sequelize.STRING(500), allowNull: true },
      product_type_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'product_types', key: 'id' } },
      status: { type: Sequelize.STRING(50), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    
    // Добавляем индексы только если они не существуют
    try {
      await queryInterface.addIndex('products', ['name']);
    } catch (e) {
      console.log('Index on name already exists');
    }
    
    try {
      await queryInterface.addIndex('products', ['status']);
    } catch (e) {
      console.log('Index on status already exists');
    }
    
    try {
      await queryInterface.addIndex('products', ['product_type_id']);
    } catch (e) {
      console.log('Index on product_type_id already exists');
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('products');
  }
}; 