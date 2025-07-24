'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('departments', [
      {
        name: 'Общее сопровождение',
        slogan: '«Внутрикомандная» отчетность',
        description: 'Составление и планирование рабочего графика руководителей, организация деловых встреч и поездок, контроль работы других специалистов',
        icon: 'users',
        color: '#3B82F6',
        status: 'active',
        employee_count: 0,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Продвижение',
        slogan: 'Чудеса экстраполяции и статистики',
        description: 'Cоздание, внедрение и распространение всего и везде с любыми заказчиками/ партнерами и пользователями',
        icon: 'trending-up',
        color: '#10B981',
        status: 'active',
        employee_count: 0,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Бизнес-анализ',
        slogan: 'Поиск и формулирование смысла в цифрах и графиках',
        description: 'Формирование потребностей заказчиков и последовательности их реализации, контроль качества при внедрении решений',
        icon: 'bar-chart-3',
        color: '#F59E0B',
        status: 'active',
        employee_count: 0,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Системный анализ',
        slogan: 'От модели данных к интеграционным схемам',
        description: 'Разработка и сопровождение требований и процессов к ПО и сервисам, детализированная проработка схем реализации совместно с разработкой',
        icon: 'network',
        color: '#8B5CF6',
        status: 'active',
        employee_count: 0,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Анализ данных',
        slogan: 'От сырых данных к интерпретируемым графикам и алгоритмам',
        description: 'Исследование, анализ, преобразование и моделирование данных с целью извлечения полезной информации. Обучение ИИ действиям, приближенным к человеческим',
        icon: 'database',
        color: '#EF4444',
        status: 'active',
        employee_count: 0,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Интеграция и внедрение',
        slogan: 'Поиск возможности включения в существующие потоки данных новых сущностей и типов информации',
        description: 'Руководство проектами по внедрению и адаптация готовых сервисов и ИТ-систем с контролем их дальнейшей доработки под проекты команды. С щепоткой волшебства и чудесами!',
        icon: 'link',
        color: '#06B6D4',
        status: 'active',
        employee_count: 0,
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Прототипирование',
        slogan: 'Автоматизация работы с данными',
        description: 'Превращение абстракции в конкретный образ ПО, контроль реализации на всех этапах. Грамотная мотивация ежей к полету',
        icon: 'zap',
        color: '#84CC16',
        status: 'active',
        employee_count: 0,
        order: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Дизайн',
        slogan: 'Проработка формы предоставления информации на данных',
        description: 'Разработка интерфейсов, общей визуальной концепции ИСиР, создание презентаций и иных графических материалов с постановкой и без',
        icon: 'palette',
        color: '#EC4899',
        status: 'active',
        employee_count: 0,
        order: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Бэк',
        slogan: 'Обеспечение сбора и хранения данных, инфобеза и сервисов предоставления данных',
        description: 'Создание фундамента ИС и организация межсистемной интеграции. Бойцы невидимого фронта',
        icon: 'server',
        color: '#6366F1',
        status: 'active',
        employee_count: 0,
        order: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Фронт',
        slogan: 'Вывод графиков и информации на фронт',
        description: 'Визуализация и создание программных интерфейсов. Сила красоты и функциональности в бой!',
        icon: 'monitor',
        color: '#F97316',
        status: 'active',
        employee_count: 0,
        order: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'QA',
        slogan: 'Работа с логами (пользовательское поведение/ системные ошибки)',
        description: 'Проверка соответствия продукта предъявленным к нему требованиям, функциональное тестирование',
        icon: 'check-circle',
        color: '#14B8A6',
        status: 'active',
        employee_count: 0,
        order: 11,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Девопс/админы',
        slogan: 'Системы логирования и мониторинга',
        description: 'Обеспечение работоспособности проектов команды, виртуальные машины, внедрение и сопровождение. Тестирование разработанного функционала. Админы, железо, ЛВС, соль земли',
        icon: 'settings',
        color: '#6B7280',
        status: 'active',
        employee_count: 0,
        order: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('departments', null, {});
  }
}; 