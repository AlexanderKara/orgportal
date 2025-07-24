'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_achievements', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      employeeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      achievementId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'achievements', key: 'id' } },
      receivedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('employee_achievements', ['employeeId']);
    await queryInterface.addIndex('employee_achievements', ['achievementId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee_achievements');
  }
}; 