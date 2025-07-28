'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Функция для безопасного добавления индекса
    const addIndexIfNotExists = async (tableName, columns, options) => {
      try {
        // Проверяем существование таблицы
        const tables = await queryInterface.showAllTables();
        if (!tables.includes(tableName)) {
          console.log(`Table ${tableName} doesn't exist, skipping index creation...`);
          return;
        }
        
        await queryInterface.addIndex(tableName, columns, options);
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log(`Index ${options.name} already exists, skipping...`);
        } else if (error.message.includes("doesn't exist")) {
          console.log(`Column doesn't exist in table ${tableName}, skipping index creation...`);
        } else {
          console.log(`Error creating index ${options.name}:`, error.message);
        }
      }
    };

    // Индексы для ускорения поиска по email и telegram
    await addIndexIfNotExists('employees', ['email'], {
      name: 'idx_employees_email'
    });
    
    await addIndexIfNotExists('employees', ['telegram'], {
      name: 'idx_employees_telegram'
    });
    
    // Индекс для статуса сотрудников
    await addIndexIfNotExists('employees', ['status'], {
      name: 'idx_employees_status'
    });
    
    // Индекс для поиска по имени и фамилии
    await addIndexIfNotExists('employees', ['first_name', 'last_name'], {
      name: 'idx_employees_name_search'
    });
    
    // Индексы для токенов (пропускаем, если таблица не существует)
    await addIndexIfNotExists('tokens', ['employee_id'], {
      name: 'idx_tokens_employee_id'
    });
    
    await addIndexIfNotExists('tokens', ['status'], {
      name: 'idx_tokens_status'
    });
    
    // Индексы для уведомлений (пропускаем, если таблица не существует)
    await addIndexIfNotExists('notifications', ['status'], {
      name: 'idx_notifications_status'
    });
    
    await addIndexIfNotExists('notifications', ['send_time'], {
      name: 'idx_notifications_send_time'
    });
    
    // Индексы для отпусков (пропускаем, если таблица не существует)
    await addIndexIfNotExists('vacations', ['employee_id'], {
      name: 'idx_vacations_employee_id'
    });
    
    await addIndexIfNotExists('vacations', ['start_date', 'end_date'], {
      name: 'idx_vacations_date_range'
    });
    
    // Индексы для продуктов (пропускаем, если таблица не существует)
    await addIndexIfNotExists('products', ['status'], {
      name: 'idx_products_status'
    });
    
    // Индексы для навыков сотрудников (пропускаем, если таблица не существует)
    await addIndexIfNotExists('employee_skills', ['employee_id'], {
      name: 'idx_employee_skills_employee_id'
    });
    
    await addIndexIfNotExists('employee_skills', ['skill_id'], {
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