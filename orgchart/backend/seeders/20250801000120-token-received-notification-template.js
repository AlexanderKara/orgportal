module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ... existing code ...
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('templates', { name: 'Уведомление о получении токена' }, {});
    await queryInterface.bulkDelete('templates', { name: 'Уведомления отключены' }, {});
    await queryInterface.bulkDelete('templates', { name: 'Отправка токена' }, {});
    await queryInterface.bulkDelete('templates', { name: 'Чат не найден' }, {});
    await queryInterface.bulkDelete('templates', { name: 'Ошибка команды' }, {});
  }
}; 