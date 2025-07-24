'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_skills', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      employee_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      skill_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'skills', key: 'id' } },
      skill_level_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'skill_levels', key: 'id' } },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('employee_skills', ['employee_id']);
    await queryInterface.addIndex('employee_skills', ['skill_id']);
    await queryInterface.addIndex('employee_skills', ['skill_level_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee_skills');
  }
}; 