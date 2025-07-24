'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('skill_groups', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      skill_type: { type: Sequelize.ENUM('hard', 'soft', 'hobby'), allowNull: false },
      icon: { type: Sequelize.STRING(100), allowNull: true },
      color: { type: Sequelize.STRING(7), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('skill_groups', ['name']);
    await queryInterface.addIndex('skill_groups', ['skill_type']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('skill_groups');
  }
};