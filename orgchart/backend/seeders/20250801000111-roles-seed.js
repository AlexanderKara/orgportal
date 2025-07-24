'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        name: 'Главный администратор',
        description: 'Полный доступ ко всем функциям системы',
        is_lead: false,
        is_admin: true,
        visibility: 'public',
        permissions: JSON.stringify(['all']),
        visible_sections: JSON.stringify(['all']),
        visible_views: JSON.stringify(['all']),
        is_system: true,
        status: 'active',
        employee_count: 0,
        color: '#DC2626',
        icon: 'shield',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Администратор',
        description: 'Управление пользователями и настройками',
        is_lead: false,
        is_admin: true,
        visibility: 'public',
        permissions: JSON.stringify(['users', 'settings']),
        visible_sections: JSON.stringify(['admin']),
        visible_views: JSON.stringify(['admin']),
        is_system: true,
        status: 'active',
        employee_count: 0,
        color: '#EA580C',
        icon: 'settings',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Модератор',
        description: 'Просмотр и редактирование данных',
        is_lead: false,
        is_admin: false,
        visibility: 'public',
        permissions: JSON.stringify(['read', 'edit']),
        visible_sections: JSON.stringify(['data']),
        visible_views: JSON.stringify(['data']),
        is_system: true,
        status: 'active',
        employee_count: 0,
        color: '#D97706',
        icon: 'eye',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
}; 