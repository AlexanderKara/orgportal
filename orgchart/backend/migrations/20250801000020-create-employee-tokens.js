'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_tokens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      employeeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      tokenTypeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'token_types', key: 'id' } },
      count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('employee_tokens', ['employeeId']);
    await queryInterface.addIndex('employee_tokens', ['tokenTypeId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee_tokens');
  }
}; 