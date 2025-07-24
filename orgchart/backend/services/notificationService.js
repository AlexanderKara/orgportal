const { Notification, Template, NotificationChat, Employee, Vacation } = require('../models');
const { Op, fn, col } = require('sequelize');
const { getTelegramBot } = require('./telegramBotInstance');

class NotificationService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  // Запуск сервиса уведомлений
  start() {
    if (this.isRunning) {
      console.log('Notification service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting notification service...');

    // Проверяем уведомления каждую минуту
    this.interval = setInterval(() => {
      this.processNotifications();
    }, 60000); // 1 минута

    // НЕ вызываем processNotifications() сразу при запуске
    // Это может вызвать двойную инициализацию Telegram бота
    // Первая проверка произойдет через 1 минуту
  }

  // Остановка сервиса
  stop() {
    if (!this.isRunning) {
      console.log('Notification service is not running');
      return;
    }

    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('Notification service stopped');
  }

  // Основная логика обработки уведомлений
  async processNotifications() {
    try {
      const now = new Date();
      console.log(`Processing notifications at ${now.toLocaleString('ru-RU')}`);

      // Получаем активные уведомления
      const notifications = await Notification.findAll({
        where: {
          isActive: true,
          status: 'active'
        },
        include: [
          {
            model: Template,
            as: 'template',
            attributes: ['id', 'name', 'content']
          }
        ]
      });

      for (const notification of notifications) {
        await this.processNotification(notification, now);
      }
    } catch (error) {
      console.error('Error processing notifications:', error);
    }
  }

  // Обработка конкретного уведомления
  async processNotification(notification, now, force = false) {
    try {
      // Проверяем, нужно ли отправлять уведомление (только если не force)
      if (!force && !this.shouldSendNotification(notification, now)) {
        return;
      }

      // Получаем активные чаты/группы
      let chats;
      if (Array.isArray(notification.recipients) && notification.recipients.length > 0) {
        // Преобразуем все id к числам (Sequelize строго сравнивает типы)
        const recipientIds = notification.recipients.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
        chats = await NotificationChat.findAll({
          where: {
            id: recipientIds,
            isActive: true,
            status: 'active'
          }
        });
      } else {
        chats = await NotificationChat.findAll({
          where: {
            isActive: true,
            status: 'active'
          }
        });
      }

      // Подготавливаем сообщение
      const message = await this.prepareNotificationMessage(notification);

      // Отправляем в каждый чат
      for (const chat of chats) {
        try {
          await this.sendNotificationToChat(notification, message, chat);
        } catch (error) {
          console.error(`Error sending notification to chat ${chat.id}:`, error);
        }
      }

      // Обновляем время последней отправки
      await notification.update({
        lastSent: now
      });

      // Если это одноразовое уведомление, деактивируем его
      if (notification.recurrence === 'once') {
        await notification.update({
          isActive: false,
          status: 'completed'
        });
      }

    } catch (error) {
      console.error(`Error processing notification ${notification.id}:`, error);
    }
  }

  // Проверка, нужно ли отправлять уведомление
  shouldSendNotification(notification, now) {
    // Если уведомление уже отправлено сегодня, не отправляем повторно (для повторяющихся)
    // Для once — логика ниже
    // Проверяем дату завершения
    if (notification.endDate) {
      const end = new Date(notification.endDate);
      const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (endDateOnly < nowDateOnly) {
        return false;
      }
    }

    // Проверяем тип повторяемости
    switch (notification.recurrence) {
      case 'once': {
        // Если задано время — отправлять только после наступления времени
        if (notification.sendTime) {
          const [hours, minutes] = notification.sendTime.split(':').map(Number);
          const sendTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          if (now < sendTime) {
            return false;
          }
        }
        // Если endDate задана и прошла — не отправлять (уже проверено выше)
        // В течение суток после наступления времени — отправлять, пока не выполнено
        return true;
      }
      case 'daily':
        return this.shouldSendDaily(notification, now);
      
      case 'weekly':
        return this.shouldSendWeekly(notification, now);
      
      case 'monthly':
        return this.shouldSendMonthly(notification, now);
      
      case 'yearly':
        return this.shouldSendYearly(notification, now);
      
      case 'weekdays':
        return this.shouldSendWeekdays(notification, now);
      
      case 'monthday':
        return this.shouldSendMonthday(notification, now);
      
      default:
        return false;
    }
  }

  // Проверка для ежедневных уведомлений
  shouldSendDaily(notification, now) {
    if (!notification.lastSent) return true;
    
    const lastSent = new Date(notification.lastSent);
    const daysDiff = Math.floor((now - lastSent) / (1000 * 60 * 60 * 24));
    
    return daysDiff >= notification.interval;
  }

  // Проверка для еженедельных уведомлений
  shouldSendWeekly(notification, now) {
    if (!notification.lastSent) return true;
    
    const lastSent = new Date(notification.lastSent);
    const weeksDiff = Math.floor((now - lastSent) / (1000 * 60 * 60 * 24 * 7));
    
    return weeksDiff >= notification.interval;
  }

  // Проверка для ежемесячных уведомлений
  shouldSendMonthly(notification, now) {
    if (!notification.lastSent) return true;
    
    const lastSent = new Date(notification.lastSent);
    const monthsDiff = (now.getFullYear() - lastSent.getFullYear()) * 12 + 
                      (now.getMonth() - lastSent.getMonth());
    
    return monthsDiff >= notification.interval;
  }

  // Проверка для ежегодных уведомлений
  shouldSendYearly(notification, now) {
    if (!notification.lastSent) return true;
    
    const lastSent = new Date(notification.lastSent);
    const yearsDiff = now.getFullYear() - lastSent.getFullYear();
    
    return yearsDiff >= notification.interval;
  }

  // Проверка для уведомлений по дням недели
  shouldSendWeekdays(notification, now) {
    const currentDay = now.getDay(); // 0 = воскресенье, 1 = понедельник, ...
    return notification.weekDays.includes(currentDay);
  }

  // Проверка для уведомлений по дню месяца
  shouldSendMonthday(notification, now) {
    return now.getDate() === notification.monthDay;
  }

  // Подготовка текста уведомления с заменой тегов
  async prepareNotificationMessage(notification) {
    let message = notification.template.content;

    // Заменяем теги автовставки
    message = await this.replaceTags(message);

    return message;
  }

  // Замена тегов автовставки
  async replaceTags(message) {
    // Именинники текущего месяца
    if (message.includes('%именинники_месяца%')) {
      const birthdays = await this.getBirthdaysThisMonth();
      message = message.replace('%именинники_месяца%', birthdays);
    }

    // Именинники следующего месяца
    if (message.includes('%именинники_след_месяца%')) {
      const birthdays = await this.getBirthdaysNextMonth();
      message = message.replace('%именинники_след_месяца%', birthdays);
    }

    // Следующий именинник
    if (message.includes('%следующий именинник%')) {
      const nextBirthday = await this.getNextBirthday();
      message = message.replace('%следующий именинник%', nextBirthday);
    }

    // Отпускники текущего месяца
    if (message.includes('%отпускники_месяца%')) {
      const vacations = await this.getVacationsThisMonth();
      message = message.replace('%отпускники_месяца%', vacations);
    }

    // Отпускники следующего месяца
    if (message.includes('%отпускники_след_месяца%')) {
      const vacations = await this.getVacationsNextMonth();
      message = message.replace('%отпускники_след_месяца%', vacations);
    }

    return message;
  }

  // Получение именинников текущего месяца
  async getBirthdaysThisMonth() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const employees = await Employee.findAll({
      where: {
        birth_date: {
          [Op.and]: [
            fn('MONTH', col('birth_date')), currentMonth
          ]
        },
        status: 'active'
      },
      attributes: ['first_name', 'last_name', 'birth_date']
    });

    if (employees.length === 0) {
      return 'в этом месяце нет именинников';
    }

    return employees.map(emp => {
      const birthDate = new Date(emp.birth_date);
      const day = birthDate.getDate();
      return `${emp.first_name} ${emp.last_name} (${day} числа)`;
    }).join(', ');
  }

  // Получение именинников следующего месяца
  async getBirthdaysNextMonth() {
    const now = new Date();
    const nextMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear();

    const employees = await Employee.findAll({
      where: {
        birth_date: {
          [Op.and]: [
            fn('MONTH', col('birth_date')), nextMonth
          ]
        },
        status: 'active'
      },
      attributes: ['first_name', 'last_name', 'birth_date']
    });

    if (employees.length === 0) {
      return 'в следующем месяце нет именинников';
    }

    return employees.map(emp => {
      const birthDate = new Date(emp.birth_date);
      const day = birthDate.getDate();
      return `${emp.first_name} ${emp.last_name} (${day} числа)`;
    }).join(', ');
  }

  // Получение следующего именинника
  async getNextBirthday() {
    const now = new Date();
    const currentYear = now.getFullYear();

    const employees = await Employee.findAll({
      where: {
        status: 'active',
        birth_date: {
          [Op.not]: null
        }
      },
      attributes: ['first_name', 'last_name', 'birth_date'],
      order: [
        [fn('DATE_FORMAT', col('birth_date'), '%m-%d'), 'ASC']
      ]
    });

    if (employees.length === 0) {
      return 'нет данных об именинниках';
    }

    // Находим следующего именинника
    for (const emp of employees) {
      const birthDate = new Date(emp.birth_date);
      const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
      
      if (nextBirthday < now) {
        nextBirthday.setFullYear(currentYear + 1);
      }
      
      if (nextBirthday >= now) {
        const day = birthDate.getDate();
        const month = birthDate.getMonth() + 1;
        return `${emp.first_name} ${emp.last_name} (${day}.${month})`;
      }
    }

    // Если не нашли в этом году, берем первого в следующем
    const firstEmployee = employees[0];
    const birthDate = new Date(firstEmployee.birth_date);
    const day = birthDate.getDate();
    const month = birthDate.getMonth() + 1;
    return `${firstEmployee.first_name} ${firstEmployee.last_name} (${day}.${month})`;
  }

  // Получение отпускников текущего месяца
  async getVacationsThisMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const vacations = await Vacation.findAll({
      where: {
        start_date: {
          [Op.lte]: endOfMonth
        },
        end_date: {
          [Op.gte]: startOfMonth
        },
        status: 'approved'
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['first_name', 'last_name'],
          where: { status: 'active' }
        }
      ]
    });

    if (vacations.length === 0) {
      return 'в этом месяце нет отпусков';
    }

    return vacations.map(vacation => {
      const startDate = new Date(vacation.start_date);
      const endDate = new Date(vacation.end_date);
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      return `${vacation.employee.first_name} ${vacation.employee.last_name} (${startDay}-${endDay})`;
    }).join(', ');
  }

  // Получение отпускников следующего месяца
  async getVacationsNextMonth() {
    const now = new Date();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const vacations = await Vacation.findAll({
      where: {
        start_date: {
          [Op.lte]: endOfNextMonth
        },
        end_date: {
          [Op.gte]: startOfNextMonth
        },
        status: 'approved'
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['first_name', 'last_name'],
          where: { status: 'active' }
        }
      ]
    });

    if (vacations.length === 0) {
      return 'в следующем месяце нет отпусков';
    }

    return vacations.map(vacation => {
      const startDate = new Date(vacation.start_date);
      const endDate = new Date(vacation.end_date);
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      return `${vacation.employee.first_name} ${vacation.employee.last_name} (${startDay}-${endDay})`;
    }).join(', ');
  }

  // Отправка уведомления в конкретный чат
  async sendNotificationToChat(notification, message, chat) {
    try {
      // Проверяем, разрешены ли уведомления в этом чате
      if (!chat.commands.notifications) {
        console.log(`Notifications disabled for chat ${chat.name}`);
        return;
      }

      // Отправляем сообщение через Telegram бота
      await this.sendTelegramMessage(chat.chatId, message);

      // Обновляем время последней активности чата
      await chat.update({
        lastActivity: new Date()
      });

      console.log(`Notification sent to chat: ${chat.name}`);
    } catch (error) {
      console.error(`Error sending notification to chat ${chat.name}:`, error);
    }
  }

  // Отправка персонального уведомления с изображением
  async sendPersonalNotification(chatId, message, imageData = null) {
    try {
      const bot = getTelegramBot();
      
      if (!bot) {
        console.log('Bot not available for sending personal notification');
        return false;
      }

      if (imageData && imageData.type === 'image' && imageData.url) {
        // Отправляем изображение с подписью
        const result = await bot.sendPhoto(chatId, imageData.url, {
          caption: message,
          parse_mode: 'HTML',
          filename: 'token-notification.png'
        });
        console.log('Telegram photo notification sent successfully:', result.message_id);
      } else {
        // Отправляем только текст
        const result = await bot.sendMessage(chatId, message, {
          parse_mode: 'HTML'
        });
        console.log('Telegram text notification sent successfully:', result.message_id);
      }

      return true;
    } catch (error) {
      console.error('Error sending personal notification:', error);
      throw error;
    }
  }

  // Отправка сообщения через Telegram (использует существующий бот)
  async sendTelegramMessage(chatId, message) {
    try {
      const bot = getTelegramBot();
      
      if (!bot) {
        console.log('Bot not available for sending message');
        return false;
      }

      const result = await bot.sendMessage(chatId, message, {
        parse_mode: 'HTML'
      });

      console.log('Telegram notification sent successfully:', result.message_id);
      return true;
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
      throw error;
    }
  }

  // Расчет времени следующей отправки
  calculateNextSendTime(notification, now) {
    switch (notification.recurrence) {
      case 'once':
        return null;
      
      case 'daily':
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + notification.interval);
        return nextDay;
      
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + (notification.interval * 7));
        return nextWeek;
      
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + notification.interval);
        return nextMonth;
      
      case 'yearly':
        const nextYear = new Date(now);
        nextYear.setFullYear(nextYear.getFullYear() + notification.interval);
        return nextYear;
      
      case 'weekdays':
        // Для уведомлений по дням недели следующая отправка - завтра
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      
      case 'monthday':
        // Для уведомлений по дню месяца - следующий месяц
        const nextMonthDay = new Date(now);
        nextMonthDay.setMonth(nextMonthDay.getMonth() + 1);
        return nextMonthDay;
      
      default:
        return null;
    }
  }

  // Ручная отправка уведомления
  async sendNotificationManually(notificationId) {
    try {
      const notification = await Notification.findByPk(notificationId, {
        include: [
          {
            model: Template,
            as: 'template',
            attributes: ['id', 'name', 'content']
          }
        ]
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await this.processNotification(notification, new Date(), true);
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      console.error('Error sending notification manually:', error);
      throw error;
    }
  }

  // Получение статистики уведомлений
  async getNotificationStats() {
    try {
      const totalNotifications = await Notification.count();
      const activeNotifications = await Notification.count({
        where: { isActive: true, status: 'active' }
      });
      const totalTemplates = await Template.count();
      const activeChats = await NotificationChat.count({
        where: { isActive: true, status: 'active' }
      });

      return {
        totalNotifications,
        activeNotifications,
        totalTemplates,
        activeChats,
        serviceStatus: this.isRunning ? 'running' : 'stopped'
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 