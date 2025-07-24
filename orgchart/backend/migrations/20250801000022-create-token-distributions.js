'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token_distributions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tokenTypeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'token_types', key: 'id' } },
      status: { type: Sequelize.ENUM('scheduled', 'in_progress', 'completed', 'failed'), allowNull: false, defaultValue: 'scheduled' },
      scheduledDate: { type: Sequelize.DATE, allowNull: false },
      executedDate: { type: Sequelize.DATE, allowNull: true },
      distributionPeriod: { type: Sequelize.STRING, allowNull: true },
      distributionAmount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      targetEmployeesCount: { type: Sequelize.INTEGER, allowNull: true },
      processedEmployeesCount: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      successCount: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      errorCount: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      totalTokensDistributed: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      errorMessage: { type: Sequelize.TEXT, allowNull: true },
      executionLog: { type: Sequelize.TEXT, allowNull: true },
      timezone: { type: Sequelize.STRING, allowNull: true, defaultValue: 'Europe/Moscow' },
      workingDaysOnly: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      nextScheduledDate: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('token_distributions', ['tokenTypeId']);
    await queryInterface.addIndex('token_distributions', ['status']);
    await queryInterface.addIndex('token_distributions', ['scheduledDate']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('token_distributions');
  }
}; 