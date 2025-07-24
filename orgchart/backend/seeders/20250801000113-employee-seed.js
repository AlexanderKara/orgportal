'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Получаем ID отдела "Дизайн"
    const designDept = await queryInterface.sequelize.query(
      'SELECT id FROM departments WHERE name = "Дизайн"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    // Получаем ID роли "Главный администратор"
    const adminRole = await queryInterface.sequelize.query(
      'SELECT id FROM roles WHERE name = "Главный администратор"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (designDept.length > 0 && adminRole.length > 0) {
      await queryInterface.bulkInsert('employees', [
        {
          first_name: 'Александр',
          last_name: 'Карабчук',
          full_name: 'Александр Карабчук',
          email: 'karabchuk@gmail.com',
          phone: '+79991234567',
          telegram: '@AlexanderKa',
          telegram_chat_id: null,
          birth_date: new Date('1981-07-01'),
          wishlist_url: 'https://example.com/wishlist',
          position: 'Дизайнер',
          department_id: designDept[0].id,
          hire_date: new Date('2008-01-15'),
          avatar: null,
          status: 'active',
          last_login: null,
          theme: 'light',
          department_role: 'lead',
          skills: JSON.stringify([]),
          products: JSON.stringify([]),
          notes: 'Заметки сотрудника: пример заполнения поля notes.',
          competencies: 'UI/UX дизайн\nВеб-дизайн\nБрендинг\nПрезентации',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});

      // Получаем id только что вставленного сотрудника
      const [employee] = await queryInterface.sequelize.query(
        'SELECT id FROM employees WHERE email = "karabchuk@gmail.com"',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      // Связываем сотрудника с ролью
      await queryInterface.bulkInsert('employee_admin_roles', [
        {
          employee_id: employee.id,
          role_id: adminRole[0].id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('employee_admin_roles', null, {});
    await queryInterface.bulkDelete('employees', null, {});
  }
}; 