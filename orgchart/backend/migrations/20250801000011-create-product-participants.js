'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_participants', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
      employee_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      role_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'roles', key: 'id' } },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('product_participants', ['product_id']);
    await queryInterface.addIndex('product_participants', ['employee_id']);
    await queryInterface.addIndex('product_participants', ['role_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_participants');
  }
}; 