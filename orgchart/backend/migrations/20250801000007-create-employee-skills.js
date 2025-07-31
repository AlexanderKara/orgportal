'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица
    const tableExists = await queryInterface.showAllTables();
    if (tableExists.includes('employee_skills')) {
      console.log('Таблица employee_skills уже существует, пропускаем создание');
      return;
    }

    await queryInterface.createTable('employee_skills', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      employee_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      skill_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'skills', key: 'id' } },
      skill_level_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'skill_levels', key: 'id' } },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    
    // Добавляем индексы только если они не существуют
    try {
      await queryInterface.addIndex('employee_skills', ['employee_id']);
    } catch (e) {
              console.log('Индекс по employee_id уже существует');
    }
    
    try {
      await queryInterface.addIndex('employee_skills', ['skill_id']);
    } catch (e) {
              console.log('Индекс по skill_id уже существует');
    }
    
    try {
      await queryInterface.addIndex('employee_skills', ['skill_level_id']);
    } catch (e) {
              console.log('Индекс по skill_level_id уже существует');
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee_skills');
  }
}; 