'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('distribution_settings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      serviceEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      executionTime: { type: Sequelize.TIME, allowNull: false, defaultValue: '09:00:00' },
      timezone: { type: Sequelize.STRING, allowNull: false, defaultValue: 'Europe/Moscow' },
      workingDaysOnly: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      workingDays: { type: Sequelize.JSON, allowNull: false, defaultValue: [1,2,3,4,5] },
      holidays: { type: Sequelize.JSON, allowNull: true, defaultValue: [] },
      retryAttempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      retryDelay: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5000 },
      notificationOnError: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      notificationEmail: { type: Sequelize.STRING, allowNull: true },
      maxConcurrentDistributions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      distributionBatchSize: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 100 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('distribution_settings');
  }
}; 