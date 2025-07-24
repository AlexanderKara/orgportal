'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.bulkInsert('product_types', [
    //   {
    //     code: 'algorithm',
    //     name: 'Алгоритм',
    //     description: 'Программный алгоритм или вычислительная логика',
    //     icon: 'function-square',
    //     color: '#3B82F6',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   },
    //   {
    //     code: 'service',
    //     name: 'Сервис',
    //     description: 'Веб-сервис или программная платформа',
    //     icon: 'server',
    //     color: '#10B981',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   },
    //   {
    //     code: 'device',
    //     name: 'Устройство',
    //     description: 'Физическое устройство или аппаратный модуль',
    //     icon: 'cpu',
    //     color: '#F59E0B',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   },
    //   {
    //     code: 'mission',
    //     name: 'Миссия',
    //     description: 'Стратегическая задача или проект',
    //     icon: 'flag',
    //     color: '#8B5CF6',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   }
    // ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_types', null, {});
  }
}; 