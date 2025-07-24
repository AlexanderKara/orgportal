'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('product_relation_types', [
      {
        name: 'Одноуровневая связь',
        description: 'Продукты находятся на одном уровне иерархии',
        icon: 'link',
        color: '#3B82F6',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Родитель-дочерний',
        description: 'Один продукт является родительским для другого',
        icon: 'hierarchy',
        color: '#10B981',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Интеграция',
        description: 'Продукты интегрированы друг с другом',
        icon: 'integration',
        color: '#F59E0B',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Зависимость',
        description: 'Один продукт зависит от другого',
        icon: 'dependency',
        color: '#EF4444',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Дополнение',
        description: 'Продукт дополняет функциональность другого',
        icon: 'complement',
        color: '#8B5CF6',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_relation_types', null, {});
  }
}; 