'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token_transactions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      fromEmployeeId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' } },
      toEmployeeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      tokenTypeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'token_types', key: 'id' } },
      count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      message: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('token_transactions', ['fromEmployeeId']);
    await queryInterface.addIndex('token_transactions', ['toEmployeeId']);
    await queryInterface.addIndex('token_transactions', ['tokenTypeId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('token_transactions');
  }
}; 