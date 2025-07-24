'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Получаем ID сотрудника
    const employee = await queryInterface.sequelize.query(
      'SELECT id FROM employees WHERE email = "karabchuk@gmail.com"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (employee.length > 0) {
      await queryInterface.bulkInsert('vacations', [
        {
          employee_id: employee[0].id,
          start_date: new Date('2024-07-15'),
          end_date: new Date('2024-07-29'),
          days_count: 15,
          vacation_type: 'annual',
          description: 'Летний отпуск',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          employee_id: employee[0].id,
          start_date: new Date('2024-12-23'),
          end_date: new Date('2024-12-31'),
          days_count: 9,
          vacation_type: 'annual',
          description: 'Новогодние праздники',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          employee_id: employee[0].id,
          start_date: new Date('2025-03-10'),
          end_date: new Date('2025-03-14'),
          days_count: 5,
          vacation_type: 'sick',
          description: 'Больничный',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('vacations', null, {});
  }
}; 