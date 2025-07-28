'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица
    const tableExists = await queryInterface.showAllTables();
    if (tableExists.includes('skill_levels')) {
      console.log('Table skill_levels already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('skill_levels', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      value: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    
    // Добавляем индексы только если они не существуют
    try {
      await queryInterface.addIndex('skill_levels', ['name'], { unique: true });
    } catch (e) {
      console.log('Index on name already exists');
    }
    
    try {
      await queryInterface.addIndex('skill_levels', ['value'], { unique: true });
    } catch (e) {
      console.log('Index on value already exists');
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('skill_levels');
  }
}; 