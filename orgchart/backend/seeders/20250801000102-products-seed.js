'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Получаем id типов продуктов
    const types = await queryInterface.sequelize.query(
      'SELECT id, code FROM product_types',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const getTypeId = code => types.find(t => t.code === code)?.id;
    await queryInterface.bulkInsert('products', [
      {
        name: 'Система управления персоналом',
        short_description: 'Веб-приложение для управления сотрудниками и организационной структурой',
        long_description: 'Комплексная система для HR-процессов, включающая управление сотрудниками, отделами, навыками и отпусками. Система предоставляет аналитику и отчетность.',
        logo: 'https://example.com/hr-system-logo.png',
        product_type_id: getTypeId('service'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Мобильное приложение для сотрудников',
        short_description: 'iOS и Android приложение для сотрудников компании',
        long_description: 'Мобильное приложение позволяет сотрудникам просматривать свою информацию, коллег, отделы и получать уведомления о важных событиях.',
        logo: 'https://example.com/mobile-app-logo.png',
        product_type_id: getTypeId('service'),
        status: 'development',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'API для интеграций',
        short_description: 'REST API для интеграции с внешними системами',
        long_description: 'Набор API endpoints для интеграции с CRM, ERP и другими корпоративными системами. Поддерживает OAuth 2.0 и JWT токены.',
        logo: 'https://example.com/api-logo.png',
        product_type_id: getTypeId('service'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Аналитическая панель',
        short_description: 'Дашборд с аналитикой и отчетами',
        long_description: 'Интерактивная панель с графиками, диаграммами и отчетами по персоналу, производительности и организационной структуре.',
        logo: 'https://example.com/analytics-logo.png',
        product_type_id: getTypeId('algorithm'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Система учета отпусков',
        short_description: 'Модуль для планирования и учета отпусков',
        long_description: 'Специализированный модуль для управления отпусками сотрудников, включая планирование, согласование и учет рабочего времени.',
        logo: 'https://example.com/vacation-logo.png',
        product_type_id: getTypeId('service'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  }
}; 