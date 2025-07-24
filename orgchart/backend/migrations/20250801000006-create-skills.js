'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('skills', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      skill_type: { type: Sequelize.ENUM('hard', 'soft', 'hobby'), allowNull: false, defaultValue: 'hard' },
      group_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'skill_groups', key: 'id' } },
      color: { type: Sequelize.STRING(7), allowNull: true },
      icon: { type: Sequelize.STRING(100), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('skills', ['name']);
    await queryInterface.addIndex('skills', ['skill_type']);
    await queryInterface.addIndex('skills', ['group_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('skills');
  }
}; 