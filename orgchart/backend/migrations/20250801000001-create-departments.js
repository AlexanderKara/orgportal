'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('departments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      slogan: { type: Sequelize.STRING(255), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      competencies: { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
      icon: { type: Sequelize.STRING(100), allowNull: true },
      color: { type: Sequelize.STRING(7), allowNull: false, defaultValue: '#3B82F6' },
      status: { type: Sequelize.ENUM('active', 'inactive', 'archived'), allowNull: false, defaultValue: 'active' },
      employee_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, comment: 'Порядок отображения отдела в списке' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('departments', ['name']);
    await queryInterface.addIndex('departments', ['status']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('departments');
  }
}; 