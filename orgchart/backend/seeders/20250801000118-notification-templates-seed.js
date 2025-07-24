module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ... existing code ...
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('templates', null, {});
  }
}; 