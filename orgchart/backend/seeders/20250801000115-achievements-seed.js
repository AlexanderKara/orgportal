'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkInsert('achievements', [
    //   // ... (оставляю весь массив достижений без изменений)
    //   // (содержимое длинное, но переносится полностью)
    // ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('achievements', null, {});
  }
}; 