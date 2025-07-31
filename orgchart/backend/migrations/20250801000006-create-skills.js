'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица
    const tableExists = await queryInterface.showAllTables();
    if (tableExists.includes('skills')) {
      console.log('Таблица skills уже существует, пропускаем создание');
      return;
    }

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
    
    // Добавляем индексы только если они не существуют
    try {
      await queryInterface.addIndex('skills', ['name']);
    } catch (e) {
              console.log('Индекс по name уже существует');
    }
    
    try {
      await queryInterface.addIndex('skills', ['skill_type']);
    } catch (e) {
              console.log('Индекс по skill_type уже существует');
    }
    
    try {
      await queryInterface.addIndex('skills', ['group_id']);
    } catch (e) {
              console.log('Индекс по group_id уже существует');
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('skills');
  }
}; 