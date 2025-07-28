/**
 * Примеры критериев для автоматического назначения бейджей
 */

export const criteriaExamples = {
  // Бейдж "Активный пользователь" - за активность в течение месяца
  activeUser: {
    periodType: 'month',
    minTotalBadges: 10,
    tokenTypes: ['login', 'profile_update', 'task_complete']
  },

  // Бейдж "Командный игрок" - за помощь команде в течение квартала
  teamPlayer: {
    periodType: 'quarter',
    minTotalBadges: 5,
    tokenTypes: ['team_help', 'mentoring'],
    minEmployees: 3
  },

  // Бейдж "Лидер" - за лидерские качества в течение полугода
  leader: {
    periodType: 'half_year',
    minTotalBadges: 8,
    tokenTypes: ['leadership', 'mentoring'],
    minDepartments: 2
  },

  // Бейдж "Инноватор" - за инновационные идеи
  innovator: {
    periodType: 'month',
    minTotalBadges: 3,
    tokenTypes: ['innovation'],
    departments: ['IT', 'Development', 'Design']
  },

  // Бейдж "Новичок" - за активность в первые 3 месяца
  newcomer: {
    periodType: 'quarter',
    badgesSinceEmployment: 5,
    tokenTypes: ['login', 'profile_update', 'training']
  },

  // Бейдж "Сезонный" - за активность в определенные месяцы
  seasonal: {
    months: ['december', 'january', 'february'],
    minTotalBadges: 15,
    tokenTypes: ['event_participation', 'team_help']
  },

  // Бейдж "Межотдельный" - за взаимодействие с разными отделами
  crossDepartment: {
    periodType: 'month',
    minDepartments: 3,
    minEmployees: 5,
    tokenTypes: ['team_help', 'feedback_given']
  },

  // Бейдж "Обратная связь" - за активное участие в системе обратной связи
  feedbackMaster: {
    periodType: 'month',
    minTotalBadges: 10,
    tokenTypes: ['feedback_given', 'feedback_received'],
    maxBadgesPerPerson: 2
  },

  // Бейдж "Участник событий" - за участие в корпоративных событиях
  eventParticipant: {
    periodType: 'quarter',
    minTotalBadges: 5,
    tokenTypes: ['event_participation'],
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },

  // Бейдж "Ментор" - за наставничество
  mentor: {
    periodType: 'half_year',
    minTotalBadges: 8,
    tokenTypes: ['mentoring'],
    minEmployees: 3,
    departments: ['IT', 'HR', 'Development']
  }
};

/**
 * Функция для валидации критериев
 */
export const validateCriteria = (criteria) => {
  const errors = [];

  // Проверяем обязательные поля
  if (!criteria.periodType && !criteria.startDate) {
    errors.push('Необходимо указать период накопления или интервал дат');
  }

  // Проверяем логику дат
  if (criteria.startDate && criteria.endDate) {
    if (new Date(criteria.startDate) >= new Date(criteria.endDate)) {
      errors.push('Дата начала должна быть раньше даты окончания');
    }
  }

  // Проверяем числовые значения
  const numericFields = ['minDepartments', 'minEmployees', 'maxBadgesPerPerson', 'minTotalBadges', 'badgesSinceEmployment'];
  numericFields.forEach(field => {
    if (criteria[field] && criteria[field] < 0) {
      errors.push(`${field} не может быть отрицательным`);
    }
  });

  return errors;
};

/**
 * Функция для получения описания критериев
 */
export const getCriteriaDescription = (criteria) => {
  const parts = [];

  if (criteria.periodType) {
    const periodNames = {
      day: 'день',
      week: 'неделя',
      month: 'месяц',
      quarter: 'квартал',
      half_year: 'полгода',
      year: 'год'
    };
    parts.push(`период: ${periodNames[criteria.periodType]}`);
  }

  if (criteria.startDate && criteria.endDate) {
    parts.push(`интервал: ${criteria.startDate} - ${criteria.endDate}`);
  }

  if (criteria.months && criteria.months.length > 0) {
    parts.push(`месяцы: ${criteria.months.join(', ')}`);
  }

  if (criteria.tokenTypes && criteria.tokenTypes.length > 0) {
    parts.push(`типы токенов: ${criteria.tokenTypes.join(', ')}`);
  }

  if (criteria.minDepartments) {
    parts.push(`отделов: ${criteria.minDepartments}+`);
  }

  if (criteria.minEmployees) {
    parts.push(`сотрудников: ${criteria.minEmployees}+`);
  }

  if (criteria.minTotalBadges) {
    parts.push(`бейджей всего: ${criteria.minTotalBadges}+`);
  }

  return parts.join(', ');
}; 