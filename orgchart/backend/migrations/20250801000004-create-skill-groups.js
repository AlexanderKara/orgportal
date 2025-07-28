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
    
    // Функция для безопасного добавления индекса
    const addIndexIfNotExists = async (tableName, columns, options) => {
      try {
        await queryInterface.addIndex(tableName, columns, options);
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log(`Index already exists, skipping...`);
        } else {
          throw error;
        }
      }
    };
    
    await addIndexIfNotExists('skill_groups', ['name']);
    await addIndexIfNotExists('skill_groups', ['skill_type']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('skill_groups');
  }
};