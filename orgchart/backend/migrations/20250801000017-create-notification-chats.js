'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notification_chats', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.ENUM('chat', 'group'), allowNull: false, defaultValue: 'chat' },
      chatId: { type: Sequelize.STRING, allowNull: false, unique: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      status: { type: Sequelize.ENUM('active', 'archived', 'deleted'), allowNull: false, defaultValue: 'active' },
      commands: { type: Sequelize.JSON, allowNull: false, defaultValue: { notifications: true, birthdays: true, vacations: true, help: true, auth: true } },
      allowedUsers: { type: Sequelize.JSON, allowNull: true, defaultValue: [] },
      settings: { type: Sequelize.JSON, allowNull: true, defaultValue: {} },
      employeeId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' } },
      personalNotificationsDisabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      lastActivity: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
    await queryInterface.addIndex('notification_chats', ['name']);
    await queryInterface.addIndex('notification_chats', ['status']);
    await queryInterface.addIndex('notification_chats', ['employeeId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notification_chats');
  }
}; 