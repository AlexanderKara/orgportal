'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('skill_groups', [
      // Хард скиллы
      {
        name: 'Программирование',
        description: 'Языки программирования и технологии разработки',
        skill_type: 'hard',
        icon: 'code',
        color: '#3B82F6',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Базы данных',
        description: 'Работа с базами данных и SQL',
        skill_type: 'hard',
        icon: 'database',
        color: '#10B981',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'DevOps',
        description: 'Инфраструктура и развертывание',
        skill_type: 'hard',
        icon: 'server',
        color: '#F59E0B',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Дизайн',
        description: 'UI/UX и графический дизайн',
        skill_type: 'hard',
        icon: 'palette',
        color: '#8B5CF6',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Аналитика',
        description: 'Анализ данных и бизнес-анализ',
        skill_type: 'hard',
        icon: 'chart-bar',
        color: '#EF4444',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Софт скиллы
      {
        name: 'Лидерство',
        description: 'Управление командой и проектами',
        skill_type: 'soft',
        icon: 'users',
        color: '#06B6D4',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Коммуникация',
        description: 'Навыки общения и презентации',
        skill_type: 'soft',
        icon: 'chat-bubble-left-right',
        color: '#84CC16',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Планирование',
        description: 'Организация и планирование работы',
        skill_type: 'soft',
        icon: 'calendar',
        color: '#F97316',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Хобби
      {
        name: 'Спорт',
        description: 'Спортивные увлечения',
        skill_type: 'hobby',
        icon: 'trophy',
        color: '#EC4899',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Творчество',
        description: 'Художественные и творческие увлечения',
        skill_type: 'hobby',
        icon: 'paint-brush',
        color: '#A855F7',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Путешествия',
        description: 'Путешествия и туризм',
        skill_type: 'hobby',
        icon: 'map',
        color: '#14B8A6',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('skill_groups', null, {});
  }
}; 