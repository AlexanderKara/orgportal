// Функция для показа уведомлений
export const showNotification = (message, type = 'info', duration = 5000) => {
  // Создаем элемент уведомления
  const notification = document.createElement('div');
  // Корпоративный стиль: белый фон, тень, скругления, цветная полоса слева, gap, жирный заголовок, кнопка закрытия
  notification.className = '';
  notification.style.zIndex = 99999;
  notification.style.position = 'fixed';
  notification.style.top = '2rem';
  notification.style.right = '2rem';
  notification.style.minWidth = '320px';
  notification.style.maxWidth = '400px';
  notification.style.background = '#fff';
  notification.style.borderRadius = '16px';
  notification.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.18)';
  notification.style.display = 'flex';
  notification.style.alignItems = 'flex-start';
  notification.style.gap = '20px';
  notification.style.padding = '20px 24px 20px 16px';
  notification.style.borderLeft = '6px solid #3b82f6'; // default blue
  notification.style.transition = 'transform 0.3s, opacity 0.3s';
  notification.style.transform = 'translateX(120%)';
  notification.style.opacity = '0';
  notification.style.fontFamily = 'Montserrat, Arial, sans-serif';

  // Определяем стили в зависимости от типа
  let color, iconSVG, title;
  switch (type) {
    case 'success':
      color = '#009688'; // корпоративный зелёный
      iconSVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="14" fill="${color}"/><path d="M8 15.5L12.5 20L20 10" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      title = 'Успешно';
      break;
    case 'error':
      color = '#e53935'; // корпоративный красный
      iconSVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="14" fill="${color}"/><path d="M9.5 9.5L18.5 18.5M18.5 9.5L9.5 18.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/></svg>`;
      title = 'Ошибка';
      break;
    case 'warning':
      color = '#ffb300'; // корпоративный жёлтый
      iconSVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="14" fill="${color}"/><path d="M14 8V15" stroke="white" stroke-width="2.2" stroke-linecap="round"/><circle cx="14" cy="19" r="1.5" fill="white"/></svg>`;
      title = 'Внимание';
      break;
    default:
      color = '#1976d2'; // корпоративный синий
      iconSVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="14" fill="${color}"/><rect x="13" y="11" width="2" height="8" rx="1" fill="white"/><rect x="13" y="8" width="2" height="2" rx="1" fill="white"/></svg>`;
      title = 'Информация';
  }
  notification.style.borderLeft = `6px solid ${color}`;

  // Контейнер для иконки
  const iconDiv = document.createElement('div');
  iconDiv.style.width = '32px';
  iconDiv.style.height = '32px';
  iconDiv.style.marginTop = '1px';
  iconDiv.style.display = 'flex';
  iconDiv.style.alignItems = 'center';
  iconDiv.style.justifyContent = 'center';
  iconDiv.innerHTML = iconSVG;

  // Контейнер для текста
  const textDiv = document.createElement('div');
  textDiv.style.flex = '1';
  textDiv.style.display = 'flex';
  textDiv.style.flexDirection = 'column';
  textDiv.style.gap = '6px';

  // Заголовок
  const titleDiv = document.createElement('div');
  titleDiv.textContent = title;
  titleDiv.style.fontWeight = '700';
  titleDiv.style.fontSize = '1.08rem';
  titleDiv.style.letterSpacing = '0.01em';
  titleDiv.style.color = color;
  titleDiv.style.fontFamily = 'Montserrat, Arial, sans-serif';
  textDiv.appendChild(titleDiv);

  // Текст
  const msgDiv = document.createElement('div');
  msgDiv.textContent = message;
  msgDiv.style.fontSize = '1rem';
  msgDiv.style.color = '#222';
  msgDiv.style.fontFamily = 'Montserrat, Arial, sans-serif';
  textDiv.appendChild(msgDiv);

  // Кнопка закрытия
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '1.3rem';
  closeBtn.style.color = '#222';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.marginLeft = '8px';
  closeBtn.style.marginTop = '2px';
  closeBtn.style.alignSelf = 'flex-start';
  closeBtn.setAttribute('aria-label', 'Закрыть уведомление');
  closeBtn.onmouseenter = () => { closeBtn.style.color = color; };
  closeBtn.onmouseleave = () => { closeBtn.style.color = '#222'; };
  closeBtn.onclick = () => {
    notification.style.transform = 'translateX(120%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  };

  notification.appendChild(iconDiv);
  notification.appendChild(textDiv);
  notification.appendChild(closeBtn);

  // Добавляем в DOM
  document.body.appendChild(notification);

  // Анимация появления
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }, 100);

  // Автоматическое удаление
  setTimeout(() => {
    notification.style.transform = 'translateX(120%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
};

// Функция для показа уведомления о получении токена
export const showTokenReceivedNotification = (token) => {
  const message = `🎉 Получен токен "${token.tokenType?.name || 'Неизвестный'}" на ${token.points || token.tokenType?.value || 1} очков!`;
  showNotification(message, 'success', 8000);
};

// Функция для показа уведомления об ошибке получения токена
export const showTokenErrorNotification = (error) => {
  const message = `❌ Ошибка получения токена: ${error}`;
  showNotification(message, 'error', 5000);
}; 