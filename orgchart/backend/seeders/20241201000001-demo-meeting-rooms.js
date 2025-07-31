'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('meeting_rooms', [
      {
        name: 'Конференц-зал А',
        description: 'Большой конференц-зал для совещаний и презентаций',
        capacity: 20,
        location: '1 этаж, кабинет 101',
        equipment: JSON.stringify({
          projector: true,
          whiteboard: true,
          video_conference: true,
          sound_system: true
        }),
        is_active: true,
        color: '#3B82F6',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Переговорная Б',
        description: 'Средняя переговорная комната для встреч команд',
        capacity: 8,
        location: '2 этаж, кабинет 205',
        equipment: JSON.stringify({
          projector: true,
          whiteboard: true,
          video_conference: false
        }),
        is_active: true,
        color: '#10B981',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Переговорная В',
        description: 'Малая переговорная для индивидуальных встреч',
        capacity: 4,
        location: '2 этаж, кабинет 208',
        equipment: JSON.stringify({
          projector: false,
          whiteboard: true,
          video_conference: false
        }),
        is_active: true,
        color: '#F59E0B',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Креативная зона',
        description: 'Пространство для мозговых штурмов и творческих встреч',
        capacity: 12,
        location: '3 этаж, кабинет 301',
        equipment: JSON.stringify({
          projector: true,
          whiteboard: true,
          video_conference: true,
          flipchart: true,
          creative_tools: true
        }),
        is_active: true,
        color: '#8B5CF6',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'VIP-переговорная',
        description: 'Премиальная переговорная для важных встреч',
        capacity: 6,
        location: '1 этаж, кабинет 105',
        equipment: JSON.stringify({
          projector: true,
          whiteboard: true,
          video_conference: true,
          coffee_machine: true,
          premium_furniture: true
        }),
        is_active: true,
        color: '#EF4444',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('meeting_rooms', null, {});
  }
}; 