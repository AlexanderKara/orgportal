'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Получаем ID групп навыков
    const skillGroups = await queryInterface.sequelize.query(
      'SELECT id, name FROM skill_groups',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const getGroupId = (name) => {
      const group = skillGroups.find(g => g.name === name);
      return group ? group.id : null;
    };

    await queryInterface.bulkInsert('skills', [
      // Хард скиллы - Программирование
      {
        name: 'JavaScript',
        skill_type: 'hard',
        color: '#F7DF1E',
        icon: 'code-bracket',
        group_id: getGroupId('Программирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'TypeScript',
        skill_type: 'hard',
        color: '#3178C6',
        icon: 'code-bracket',
        group_id: getGroupId('Программирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Python',
        skill_type: 'hard',
        color: '#3776AB',
        icon: 'code-bracket',
        group_id: getGroupId('Программирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Java',
        skill_type: 'hard',
        color: '#ED8B00',
        icon: 'code-bracket',
        group_id: getGroupId('Программирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'C#',
        skill_type: 'hard',
        color: '#239120',
        icon: 'code-bracket',
        group_id: getGroupId('Программирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'React',
        skill_type: 'hard',
        color: '#61DAFB',
        icon: 'code-bracket',
        group_id: getGroupId('Программирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Vue.js',
        skill_type: 'hard',
        color: '#4FC08D',
        icon: 'code-bracket',
        group_id: getGroupId('Программирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Node.js',
        skill_type: 'hard',
        color: '#339933',
        icon: 'code-bracket',
        group_id: getGroupId('Программирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Хард скиллы - Базы данных
      {
        name: 'MySQL',
        skill_type: 'hard',
        color: '#4479A1',
        icon: 'database',
        group_id: getGroupId('Базы данных'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'PostgreSQL',
        skill_type: 'hard',
        color: '#336791',
        icon: 'database',
        group_id: getGroupId('Базы данных'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'MongoDB',
        skill_type: 'hard',
        color: '#47A248',
        icon: 'database',
        group_id: getGroupId('Базы данных'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Хард скиллы - DevOps
      {
        name: 'Docker',
        skill_type: 'hard',
        color: '#2496ED',
        icon: 'server',
        group_id: getGroupId('DevOps'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Kubernetes',
        skill_type: 'hard',
        color: '#326CE5',
        icon: 'server',
        group_id: getGroupId('DevOps'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'AWS',
        skill_type: 'hard',
        color: '#FF9900',
        icon: 'server',
        group_id: getGroupId('DevOps'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Хард скиллы - Дизайн
      {
        name: 'Figma',
        skill_type: 'hard',
        color: '#F24E1E',
        icon: 'palette',
        group_id: getGroupId('Дизайн'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Adobe Photoshop',
        skill_type: 'hard',
        color: '#31A8FF',
        icon: 'palette',
        group_id: getGroupId('Дизайн'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Adobe Illustrator',
        skill_type: 'hard',
        color: '#FF9A00',
        icon: 'palette',
        group_id: getGroupId('Дизайн'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Хард скиллы - Аналитика
      {
        name: 'Excel',
        skill_type: 'hard',
        color: '#217346',
        icon: 'chart-bar',
        group_id: getGroupId('Аналитика'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Power BI',
        skill_type: 'hard',
        color: '#F2C811',
        icon: 'chart-bar',
        group_id: getGroupId('Аналитика'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Tableau',
        skill_type: 'hard',
        color: '#E97627',
        icon: 'chart-bar',
        group_id: getGroupId('Аналитика'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Софт скиллы - Лидерство
      {
        name: 'Управление командой',
        skill_type: 'soft',
        color: '#DC2626',
        icon: 'users',
        group_id: getGroupId('Лидерство'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Управление проектами',
        skill_type: 'soft',
        color: '#EA580C',
        icon: 'users',
        group_id: getGroupId('Лидерство'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Принятие решений',
        skill_type: 'soft',
        color: '#D97706',
        icon: 'users',
        group_id: getGroupId('Лидерство'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Софт скиллы - Коммуникация
      {
        name: 'Публичные выступления',
        skill_type: 'soft',
        color: '#059669',
        icon: 'chat-bubble-left-right',
        group_id: getGroupId('Коммуникация'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Переговоры',
        skill_type: 'soft',
        color: '#0D9488',
        icon: 'chat-bubble-left-right',
        group_id: getGroupId('Коммуникация'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Письменная коммуникация',
        skill_type: 'soft',
        color: '#0891B2',
        icon: 'chat-bubble-left-right',
        group_id: getGroupId('Коммуникация'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Софт скиллы - Планирование
      {
        name: 'Тайм-менеджмент',
        skill_type: 'soft',
        color: '#7C3AED',
        icon: 'calendar',
        group_id: getGroupId('Планирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Стратегическое планирование',
        skill_type: 'soft',
        color: '#BE185D',
        icon: 'calendar',
        group_id: getGroupId('Планирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Управление рисками',
        skill_type: 'soft',
        color: '#DC2626',
        icon: 'calendar',
        group_id: getGroupId('Планирование'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Хобби - Спорт
      {
        name: 'Футбол',
        skill_type: 'hobby',
        color: '#059669',
        icon: 'trophy',
        group_id: getGroupId('Спорт'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Баскетбол',
        skill_type: 'hobby',
        color: '#DC2626',
        icon: 'trophy',
        group_id: getGroupId('Спорт'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Плавание',
        skill_type: 'hobby',
        color: '#0891B2',
        icon: 'trophy',
        group_id: getGroupId('Спорт'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Хобби - Творчество
      {
        name: 'Рисование',
        skill_type: 'hobby',
        color: '#8B5CF6',
        icon: 'paint-brush',
        group_id: getGroupId('Творчество'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Фотография',
        skill_type: 'hobby',
        color: '#7C3AED',
        icon: 'paint-brush',
        group_id: getGroupId('Творчество'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Музыка',
        skill_type: 'hobby',
        color: '#EC4899',
        icon: 'paint-brush',
        group_id: getGroupId('Творчество'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Хобби - Путешествия
      {
        name: 'Горный туризм',
        skill_type: 'hobby',
        color: '#059669',
        icon: 'map',
        group_id: getGroupId('Путешествия'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Культурный туризм',
        skill_type: 'hobby',
        color: '#D97706',
        icon: 'map',
        group_id: getGroupId('Путешествия'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Экстремальный туризм',
        skill_type: 'hobby',
        color: '#DC2626',
        icon: 'map',
        group_id: getGroupId('Путешествия'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('skills', null, {});
  }
}; 