'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(50), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_lead: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_admin: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      visibility: { type: Sequelize.STRING(255), allowNull: true },
      permissions: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      visible_sections: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      visible_views: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      is_system: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      status: { type: Sequelize.ENUM('active', 'inactive', 'archived'), allowNull: false, defaultValue: 'active' },
      employee_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      color: { type: Sequelize.STRING(7), allowNull: false, defaultValue: '#3B82F6' },
      icon: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('roles', ['name']);
    await queryInterface.addIndex('roles', ['status']);
    await queryInterface.addIndex('roles', ['is_system']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('roles');
  }
}; 