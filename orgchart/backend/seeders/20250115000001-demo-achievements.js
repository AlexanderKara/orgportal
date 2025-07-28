'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const achievements = [
      {
        name: 'Первый шаг',
        description: 'Получен за первый месяц работы в компании',
        icon: 'star',
        color: '#3B82F6',
        type: 'activity',
        criteria: JSON.stringify({
          tokenCount: 1
        }),
        image: '',
        is_random: true,
        is_unique: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Командный игрок',
        description: 'Получен за активное участие в командных проектах',
        icon: 'users',
        color: '#10B981',
        type: 'team',
        criteria: JSON.stringify({
          uniqueSenders: 3
        }),
        image: '',
        is_random: true,
        is_unique: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Щедрый дух',
        description: 'Получен за активную отправку токенов коллегам',
        icon: 'heart',
        color: '#EF4444',
        type: 'generosity',
        criteria: JSON.stringify({
          tokenCount: 5
        }),
        image: '',
        is_random: true,
        is_unique: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Социальная бабочка',
        description: 'Получен за активное общение с коллегами',
        icon: 'message-circle',
        color: '#8B5CF6',
        type: 'social',
        criteria: JSON.stringify({
          uniqueSenders: 5
        }),
        image: '',
        is_random: true,
        is_unique: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Особый случай',
        description: 'Уникальный бейдж за особые заслуги',
        icon: 'crown',
        color: '#F59E0B',
        type: 'unique',
        criteria: JSON.stringify({}),
        image: '',
        is_random: false,
        is_unique: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Новогодний дух',
        description: 'Получен в праздничный сезон',
        icon: 'gift',
        color: '#EC4899',
        type: 'seasonal',
        criteria: JSON.stringify({
          timePeriod: {
            period: 'month',
            count: 3
          }
        }),
        image: '',
        is_random: true,
        is_unique: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('achievements', achievements, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('achievements', null, {});
  }
}; 