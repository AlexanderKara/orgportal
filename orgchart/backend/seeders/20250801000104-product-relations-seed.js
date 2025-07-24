'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Получаем ID продуктов
    const products = await queryInterface.sequelize.query(
      'SELECT id FROM products',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Получаем ID типов связей
    const relationTypes = await queryInterface.sequelize.query(
      'SELECT id, name FROM product_relation_types',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const getRelationTypeId = name => relationTypes.find(t => t.name === name)?.id;

    if (products.length >= 3 && relationTypes.length > 0) {
      await queryInterface.bulkInsert('product_relations', [
        {
          source_product_id: products[0].id, // Система управления персоналом
          target_product_id: products[1].id, // Мобильное приложение
          relation_type_id: getRelationTypeId('Интеграция'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          source_product_id: products[0].id, // Система управления персоналом
          target_product_id: products[2].id, // API для интеграций
          relation_type_id: getRelationTypeId('Родитель-дочерний'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          source_product_id: products[1].id, // Мобильное приложение
          target_product_id: products[2].id, // API для интеграций
          relation_type_id: getRelationTypeId('Зависимость'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          source_product_id: products[3].id, // Аналитическая панель
          target_product_id: products[0].id, // Система управления персоналом
          relation_type_id: getRelationTypeId('Дополнение'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          source_product_id: products[4].id, // Система учета отпусков
          target_product_id: products[0].id, // Система управления персоналом
          relation_type_id: getRelationTypeId('Одноуровневая связь'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_relations', null, {});
  }
}; 