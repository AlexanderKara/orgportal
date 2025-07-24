'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('templates', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('active', 'archived', 'deleted'), allowNull: false, defaultValue: 'active' },
      usageCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      lastUsed: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
    await queryInterface.addIndex('templates', ['name']);
    await queryInterface.addIndex('templates', ['status']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('templates');
  }
}; 