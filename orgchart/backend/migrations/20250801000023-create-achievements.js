'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('achievements', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      icon: { type: Sequelize.STRING, allowNull: true },
      color: { type: Sequelize.STRING(7), allowNull: true },
      type: { type: Sequelize.STRING, allowNull: false },
      criteria: { type: Sequelize.JSON, allowNull: false },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('achievements', ['name']);
    await queryInterface.addIndex('achievements', ['type']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('achievements');
  }
}; 