'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Получаем ID продуктов
    const products = await queryInterface.sequelize.query(
      'SELECT id FROM products',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (products.length >= 5) {
      await queryInterface.bulkInsert('product_versions', [
        {
          product_id: products[0].id, // Система управления персоналом
          version_id: products[1].id, // Мобильное приложение как версия
          version: '1.0.0',
          description: 'Первоначальная версия системы',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          product_id: products[0].id,
          version_id: products[2].id, // API для интеграций как версия
          version: '1.1.0',
          description: 'Добавлена поддержка API',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          product_id: products[0].id,
          version_id: products[3].id, // Аналитическая панель как версия
          version: '1.2.0',
          description: 'Добавлена аналитика',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          product_id: products[1].id, // Мобильное приложение
          version_id: products[2].id, // API для интеграций как версия
          version: '1.0.0',
          description: 'Первая версия мобильного приложения',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          product_id: products[2].id, // API для интеграций
          version_id: products[4].id, // Система учета отпусков как версия
          version: '1.0.0',
          description: 'Базовый API',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          product_id: products[2].id,
          version_id: products[0].id, // Система управления персоналом как версия
          version: '1.1.0',
          description: 'Добавлена интеграция с HR системой',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_versions', null, {});
  }
}; 