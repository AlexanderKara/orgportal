'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица
    const tables = await queryInterface.showAllTables();
    if (tables.includes('vacations')) {
      console.log('Table vacations already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('vacations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      employee_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      start_date: { type: Sequelize.DATE, allowNull: false },
      end_date: { type: Sequelize.DATE, allowNull: false },
      vacation_type: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      days_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Добавляем индексы с обработкой ошибок
    try {
      await queryInterface.addIndex('vacations', ['employee_id']);
    } catch (error) {
      console.log('Index vacations_employee_id already exists');
    }

    try {
      await queryInterface.addIndex('vacations', ['start_date']);
    } catch (error) {
      console.log('Index vacations_start_date already exists');
    }

    try {
      await queryInterface.addIndex('vacations', ['end_date']);
    } catch (error) {
      console.log('Index vacations_end_date already exists');
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vacations');
  }
}; 