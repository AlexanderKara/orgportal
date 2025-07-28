'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('employees', 'telegram_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      comment: 'ID пользователя в Telegram для авторизации'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('employees', 'telegram_id');
  }
};
