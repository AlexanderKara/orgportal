'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица
    const tables = await queryInterface.showAllTables();
    if (tables.includes('product_participants')) {
      console.log('Table product_participants already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('product_participants', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
      employee_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      role_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'roles', key: 'id' } },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Добавляем индексы с обработкой ошибок
    try {
      await queryInterface.addIndex('product_participants', ['product_id']);
    } catch (error) {
      console.log('Index product_participants_product_id already exists');
    }

    try {
      await queryInterface.addIndex('product_participants', ['employee_id']);
    } catch (error) {
      console.log('Index product_participants_employee_id already exists');
    }

    try {
      await queryInterface.addIndex('product_participants', ['role_id']);
    } catch (error) {
      console.log('Index product_participants_role_id already exists');
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_participants');
  }
}; 