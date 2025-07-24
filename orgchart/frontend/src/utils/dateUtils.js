// Функция для правильного склонения слов
export const getDeclension = (number, one, few, many) => {
  const mod10 = number % 10;
  const mod100 = number % 100;
  
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

// Функция для расчета времени в команде
export const calculateTimeInTeam = (joinDate) => {
  if (!joinDate) return 'Нет данных';
  
  try {
    const joined = new Date(joinDate);
    if (isNaN(joined.getTime())) return 'Нет данных';
    
    const now = new Date();
    
    // Более точный расчет лет и месяцев
    let years = now.getFullYear() - joined.getFullYear();
    let months = now.getMonth() - joined.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Если день месяца еще не наступил, уменьшаем на месяц
    if (now.getDate() < joined.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }
    
    let result = '';
    
    if (years > 0) {
      const yearWord = getDeclension(years, 'год', 'года', 'лет');
      result += `${years} ${yearWord}`;
    }
    
    if (months > 0) {
      const monthWord = getDeclension(months, 'месяц', 'месяца', 'месяцев');
      if (result) result += ' ';
      result += `${months} ${monthWord}`;
    }
    
    // Если меньше месяца, показываем дни
    if (years === 0 && months === 0) {
      const diffTime = Math.abs(now - joined);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dayWord = getDeclension(diffDays, 'день', 'дня', 'дней');
      result = `${diffDays} ${dayWord}`;
    }
    
    return result || 'Меньше дня';
  } catch (error) {
    return 'Нет данных';
  }
};

// Функция для форматирования даты
export const formatDate = (dateString) => {
  if (!dateString) return 'Нет данных';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Нет данных';
    return date.toLocaleDateString('ru-RU');
  } catch (error) {
    return 'Нет данных';
  }
}; 

// Функция для правильного склонения слова "очко"
export const getPointsText = (points) => {
  const lastDigit = points % 10;
  const lastTwoDigits = points % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${points} очков`;
  }
  
  switch (lastDigit) {
    case 1:
      return `${points} очко`;
    case 2:
    case 3:
    case 4:
      return `${points} очка`;
    default:
      return `${points} очков`;
  }
}; 