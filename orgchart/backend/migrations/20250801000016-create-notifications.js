'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false, defaultValue: 'Уведомление #' },
      recurrence: { type: Sequelize.ENUM('once', 'daily', 'weekly', 'monthly', 'yearly', 'weekdays', 'monthday'), allowNull: false, defaultValue: 'once' },
      templateId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'templates', key: 'id' } },
      endDate: { type: Sequelize.DATE, allowNull: true },
      interval: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      intervalType: { type: Sequelize.ENUM('days', 'weeks', 'months', 'years'), allowNull: false, defaultValue: 'days' },
      weekDays: { type: Sequelize.JSON, allowNull: true, defaultValue: [] },
      monthDay: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 1 },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      status: { type: Sequelize.ENUM('active', 'archived', 'deleted'), allowNull: false, defaultValue: 'active' },
      lastSent: { type: Sequelize.DATE, allowNull: true },
      nextSend: { type: Sequelize.DATE, allowNull: true },
      sendTime: { type: Sequelize.TIME, allowNull: true },
      recipients: { type: Sequelize.JSON, allowNull: true, defaultValue: [] },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
    await queryInterface.addIndex('notifications', ['name']);
    await queryInterface.addIndex('notifications', ['status']);
    await queryInterface.addIndex('notifications', ['templateId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
}; 