'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем поля в таблицу achievements
    await queryInterface.addColumn('achievements', 'image', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Путь к изображению бейджа'
    });

    await queryInterface.addColumn('achievements', 'is_random', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Использовать случайное изображение из папки'
    });

    await queryInterface.addColumn('achievements', 'is_unique', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Уникальный бейдж (назначается вручную)'
    });

    // Добавляем поле в таблицу employee_achievements
    await queryInterface.addColumn('employee_achievements', 'image', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Путь к изображению бейджа для конкретного сотрудника'
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаляем поля из таблицы achievements
    await queryInterface.removeColumn('achievements', 'image');
    await queryInterface.removeColumn('achievements', 'is_random');
    await queryInterface.removeColumn('achievements', 'is_unique');

    // Удаляем поле из таблицы employee_achievements
    await queryInterface.removeColumn('employee_achievements', 'image');
  }
}; 