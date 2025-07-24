'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Индексы для ускорения поиска по email и telegram
    await queryInterface.addIndex('employees', ['email'], {
      name: 'idx_employees_email'
    });
    
    await queryInterface.addIndex('employees', ['telegram'], {
      name: 'idx_employees_telegram'
    });
    
    // Индекс для статуса сотрудников
    await queryInterface.addIndex('employees', ['status'], {
      name: 'idx_employees_status'
    });
    
    // Индекс для поиска по имени и фамилии
    await queryInterface.addIndex('employees', ['first_name', 'last_name'], {
      name: 'idx_employees_name_search'
    });
    
    // Индексы для токенов
    await queryInterface.addIndex('tokens', ['employee_id'], {
      name: 'idx_tokens_employee_id'
    });
    
    await queryInterface.addIndex('tokens', ['status'], {
      name: 'idx_tokens_status'
    });
    
    // Индексы для уведомлений
    await queryInterface.addIndex('notifications', ['status'], {
      name: 'idx_notifications_status'
    });
    
    await queryInterface.addIndex('notifications', ['send_time'], {
      name: 'idx_notifications_send_time'
    });
    
    // Индексы для отпусков
    await queryInterface.addIndex('vacations', ['employee_id'], {
      name: 'idx_vacations_employee_id'
    });
    
    await queryInterface.addIndex('vacations', ['start_date', 'end_date'], {
      name: 'idx_vacations_date_range'
    });
    
    // Индексы для продуктов
    await queryInterface.addIndex('products', ['status'], {
      name: 'idx_products_status'
    });
    
    // Индексы для навыков сотрудников
    await queryInterface.addIndex('employee_skills', ['employee_id'], {
      name: 'idx_employee_skills_employee_id'
    });
    
    await queryInterface.addIndex('employee_skills', ['skill_id'], {
      name: 'idx_employee_skills_skill_id'
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаляем все добавленные индексы
    await queryInterface.removeIndex('employees', 'idx_employees_email');
    await queryInterface.removeIndex('employees', 'idx_employees_telegram');
    await queryInterface.removeIndex('employees', 'idx_employees_status');
    await queryInterface.removeIndex('employees', 'idx_employees_name_search');
    await queryInterface.removeIndex('tokens', 'idx_tokens_employee_id');
    await queryInterface.removeIndex('tokens', 'idx_tokens_status');
    await queryInterface.removeIndex('notifications', 'idx_notifications_status');
    await queryInterface.removeIndex('notifications', 'idx_notifications_send_time');
    await queryInterface.removeIndex('vacations', 'idx_vacations_employee_id');
    await queryInterface.removeIndex('vacations', 'idx_vacations_date_range');
    await queryInterface.removeIndex('products', 'idx_products_status');
    await queryInterface.removeIndex('employee_skills', 'idx_employee_skills_employee_id');
    await queryInterface.removeIndex('employee_skills', 'idx_employee_skills_skill_id');
  }
}; 