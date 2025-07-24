'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tokens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      publicId: { type: Sequelize.STRING(36), allowNull: false, unique: true },
      employeeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      tokenTypeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'token_types', key: 'id' } },
      senderId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' } },
      image: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      comment: { type: Sequelize.TEXT, allowNull: true },
      receivedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      status: { type: Sequelize.ENUM('available', 'received'), allowNull: false, defaultValue: 'available' },
      isDirectSent: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      sentAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('tokens', ['employeeId']);
    await queryInterface.addIndex('tokens', ['tokenTypeId']);
    await queryInterface.addIndex('tokens', ['senderId']);
    await queryInterface.addIndex('tokens', ['status']);
    await queryInterface.addIndex('tokens', ['receivedAt']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tokens');
  }
}; 