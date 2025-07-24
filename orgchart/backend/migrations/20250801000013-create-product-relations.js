'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_relations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      source_product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
      target_product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
      relation_type_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'product_relation_types', key: 'id' } },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('product_relations', ['source_product_id']);
    await queryInterface.addIndex('product_relations', ['target_product_id']);
    await queryInterface.addIndex('product_relations', ['relation_type_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_relations');
  }
}; 