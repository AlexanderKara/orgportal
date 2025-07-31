'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Функция для безопасного добавления индекса
    const createIndexIfNotExists = async (queryInterface, tableName, options) => {
      try {
        // Проверяем, существует ли таблица
        const tables = await queryInterface.showAllTables();
        if (!tables.includes(tableName)) {
          return;
        }

        // Проверяем, существует ли индекс
        const indexes = await queryInterface.showIndex(tableName);
        const indexExists = indexes.some(index => index.name === options.name);
        if (indexExists) {
          return;
        }

        // Проверяем, существует ли колонка
        const columns = await queryInterface.describeTable(tableName);
        if (!columns[options.fields[0]]) {
          return;
        }

        await queryInterface.addIndex(tableName, options.fields, options);
      } catch (error) {
        // Игнорируем ошибки создания индексов
      }
    };

    // Индексы для ускорения поиска по email и telegram
    await createIndexIfNotExists(queryInterface, 'employees', {
      name: 'idx_employees_email',
      fields: ['email']
    });
    
    await createIndexIfNotExists(queryInterface, 'employees', {
      name: 'idx_employees_telegram',
      fields: ['telegram']
    });
    
    // Индекс для статуса сотрудников
    await createIndexIfNotExists(queryInterface, 'employees', {
      name: 'idx_employees_status',
      fields: ['status']
    });
    
    // Индекс для поиска по имени и фамилии
    await createIndexIfNotExists(queryInterface, 'employees', {
      name: 'idx_employees_name_search',
      fields: ['first_name', 'last_name']
    });
    
    // Индексы для токенов (пропускаем, если таблица не существует)
    await createIndexIfNotExists(queryInterface, 'tokens', {
      name: 'idx_tokens_employee_id',
      fields: ['employee_id']
    });
    
    await createIndexIfNotExists(queryInterface, 'tokens', {
      name: 'idx_tokens_status',
      fields: ['status']
    });
    
    // Индексы для уведомлений (пропускаем, если таблица не существует)
    await createIndexIfNotExists(queryInterface, 'notifications', {
      name: 'idx_notifications_status',
      fields: ['status']
    });
    
    await createIndexIfNotExists(queryInterface, 'notifications', {
      name: 'idx_notifications_send_time',
      fields: ['send_time']
    });
    
    // Индексы для отпусков (пропускаем, если таблица не существует)
    await createIndexIfNotExists(queryInterface, 'vacations', {
      name: 'idx_vacations_employee_id',
      fields: ['employee_id']
    });
    
    await createIndexIfNotExists(queryInterface, 'vacations', {
      name: 'idx_vacations_date_range',
      fields: ['start_date', 'end_date']
    });
    
    // Индексы для продуктов (пропускаем, если таблица не существует)
    await createIndexIfNotExists(queryInterface, 'products', {
      name: 'idx_products_status',
      fields: ['status']
    });
    
    // Индексы для навыков сотрудников (пропускаем, если таблица не существует)
    await createIndexIfNotExists(queryInterface, 'employee_skills', {
      name: 'idx_employee_skills_employee_id',
      fields: ['employee_id']
    });
    
    await createIndexIfNotExists(queryInterface, 'employee_skills', {
      name: 'idx_employee_skills_skill_id',
      fields: ['skill_id']
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