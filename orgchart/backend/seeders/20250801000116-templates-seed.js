module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ... перенесите сюда реальный код сидирования шаблонов, если требуется ...
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('templates', null, {});
  }
}; 