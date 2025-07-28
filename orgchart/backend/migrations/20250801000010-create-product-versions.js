'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица
    const tableExists = await queryInterface.showAllTables();
    if (tableExists.includes('product_versions')) {
      console.log('Table product_versions already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('product_versions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
      version_id: { type: Sequelize.INTEGER, allowNull: false },
      version: { type: Sequelize.STRING(50), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    
    // Добавляем индексы только если они не существуют
    try {
      await queryInterface.addIndex('product_versions', ['product_id']);
    } catch (e) {
      console.log('Index on product_id already exists');
    }
    
    try {
      await queryInterface.addIndex('product_versions', ['version_id']);
    } catch (e) {
      console.log('Index on version_id already exists');
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_versions');
  }
}; 