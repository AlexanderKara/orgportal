'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employees', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      full_name: { type: Sequelize.STRING(255), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      telegram: { type: Sequelize.STRING(100), allowNull: true },
      telegram_chat_id: { type: Sequelize.BIGINT, allowNull: true, comment: 'ID чата Telegram бота с сотрудником' },
      birth_date: { type: Sequelize.DATE, allowNull: true },
      wishlist_url: { type: Sequelize.STRING(500), allowNull: true },
      position: { type: Sequelize.STRING(100), allowNull: false },
      department_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'departments', key: 'id' } },
      hire_date: { type: Sequelize.DATE, allowNull: false },
      avatar: { type: Sequelize.TEXT('long'), allowNull: true },
      status: { type: Sequelize.ENUM('active', 'inactive', 'terminated'), allowNull: false, defaultValue: 'active' },
      last_login: { type: Sequelize.DATE, allowNull: true },
      theme: { type: Sequelize.ENUM('light', 'dark'), allowNull: false, defaultValue: 'light' },
      department_role: { type: Sequelize.STRING(50), allowNull: true },
      skills: { type: Sequelize.JSON, allowNull: true },
      products: { type: Sequelize.JSON, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      competencies: { type: Sequelize.TEXT, allowNull: true },
      password: { type: Sequelize.STRING(255), allowNull: false },
      canSendYellowTokens: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      canSendRedTokens: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      canSendPlatinumTokens: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      grayTokensLimit: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 15 },
      yellowTokensLimit: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      redTokensLimit: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      platinumTokensLimit: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('employees', ['email']);
    await queryInterface.addIndex('employees', ['department_id']);
    await queryInterface.addIndex('employees', ['status']);
    await queryInterface.addIndex('employees', ['first_name', 'last_name']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employees');
  }
}; 