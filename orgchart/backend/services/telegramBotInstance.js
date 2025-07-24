const TelegramBot = require('node-telegram-bot-api');
const { Employee, NotificationChat, Template } = require('../models');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

let botInstance = null;
let isInitialized = false;

// Кеш для аватаров пользователей Telegram
const telegramAvatarCache = new Map();

// Функция для получения аватара пользователя или группы Telegram
async function getTelegramUserAvatar(chatId, userId) {
  try {
    const cacheKey = `${chatId}_${userId}`;
    
    // Проверяем кеш
    if (telegramAvatarCache.has(cacheKey)) {
      const cached = telegramAvatarCache.get(cacheKey);
      // Проверяем, не устарел ли кеш (24 часа)
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        return cached.avatarUrl;
      }
    }

    const bot = getTelegramBot();
    if (!bot) {
      return null;
    }

    // Проверяем, является ли это группой (отрицательный chatId)
    const isGroup = chatId < 0;
    
    if (isGroup) {
      // Для групп получаем информацию о группе
      try {
        const chat = await bot.getChat(chatId);
        
        if (chat.photo) {
          const file = await bot.getFile(chat.photo.big_file_id);
          const avatarUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
          
          // Кешируем результат
          telegramAvatarCache.set(cacheKey, {
            avatarUrl,
            timestamp: Date.now()
          });
          
          return avatarUrl;
        } else {
          return null;
        }
      } catch (error) {
        console.log(`Error getting group chat info for ${chatId}:`, error.message);
      }
    } else {
      // Для личных чатов получаем информацию о пользователе через getChat
      try {
        const chat = await bot.getChat(chatId);
        
        if (chat.photo) {
          const file = await bot.getFile(chat.photo.big_file_id);
          const avatarUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
          
          // Кешируем результат
          telegramAvatarCache.set(cacheKey, {
            avatarUrl,
            timestamp: Date.now()
          });
          
          return avatarUrl;
        } else {
          // Fallback - пробуем getUserProfilePhotos
          try {
            const userProfilePhotos = await bot.getUserProfilePhotos(userId, { limit: 1 });
            
            if (userProfilePhotos.total_count > 0) {
              const photo = userProfilePhotos.photos[0][0];
              const file = await bot.getFile(photo.file_id);
              const avatarUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
              
              // Кешируем результат
              telegramAvatarCache.set(cacheKey, {
                avatarUrl,
                timestamp: Date.now()
              });
              
              return avatarUrl;
            }
          } catch (fallbackError) {
            console.log(`Error in getUserProfilePhotos fallback:`, fallbackError.message);
          }
        }
      } catch (error) {
        console.log(`Error getting private chat info for ${chatId}:`, error.message);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in getTelegramUserAvatar:', error);
    return null;
  }
}

// Очистка кеша аватаров каждые 24 часа
const cleanupAvatarCache = () => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  for (const [key, value] of telegramAvatarCache.entries()) {
    if (now - value.timestamp > oneDay) {
      telegramAvatarCache.delete(key);
    }
  }
};

// Запускаем очистку кеша каждые 6 часов
setInterval(cleanupAvatarCache, 6 * 60 * 60 * 1000);

// Функция создания корпоративного изображения
const createCorporateImage = async (title) => {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  try {
    // Загружаем белый логотип
    const logoPath = path.join(__dirname, '../A_logo_w.png');
    const logo = await loadImage(logoPath);
    
    // Фон - градиент в корпоративных цветах
    const gradient = ctx.createLinearGradient(0, 0, 800, 400);
    gradient.addColorStop(0, '#E42E0F'); // Основной красный цвет
    gradient.addColorStop(1, '#C41E3A'); // Темно-красный
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);

    // Добавляем белый логотип по центру
    const logoSize = 80;
    const logoX = (800 - logoSize) / 2; // центр по горизонтали
    const logoY = 60;
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

    // Основной текст
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 400, 200);

    // Подзаголовок
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Team-A Portal', 400, 280);

  } catch (error) {
    console.error('Error loading logo:', error);
    
    // Fallback без логотипа
    const gradient = ctx.createLinearGradient(0, 0, 800, 400);
    gradient.addColorStop(0, '#E42E0F');
    gradient.addColorStop(1, '#C41E3A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);

    // Текст
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 400, 200);

    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Team-A Portal', 400, 280);
  }

  return canvas.toBuffer();
};

// Функция для получения шаблона сообщения
const getTemplateMessage = async (templateName, variables = {}) => {
  try {
    const template = await Template.findOne({ 
      where: { name: templateName, status: 'active' } 
    });
    
    if (!template) {
      return null;
    }
    
    let message = template.content;
    
    // Replace variables
    Object.keys(variables).forEach(key => {
      const placeholder = `%${key}%`;
      message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    
    return message;
  } catch (error) {
    console.error('Error getting template message:', error);
    return null;
  }
};

// Функция для сохранения chat ID в базу данных
const saveChatIdToDatabase = async (telegram, chatId) => {
  try {
    const employee = await Employee.findOne({ where: { telegram: telegram } });
    if (employee) {
      // Update employee's telegram_chat_id
      await employee.update({ telegram_chat_id: chatId });
      
      // Check if notification chat record already exists
      const existingChat = await NotificationChat.findOne({ 
        where: { chatId: chatId.toString() } 
      });
      
      if (!existingChat) {
        // Create new notification chat record
        await NotificationChat.create({
          chatId: chatId.toString(),
          chat_name: `${employee.first_name} ${employee.last_name}`,
          chat_type: 'private',
          employee_id: employee.id,
          status: 'active'
        });
      } else {
        console.log(`Notification chat record already exists for chat ${chatId}`);
      }
      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error saving chat ID to database:', error);
    return false;
  }
};

// Функция для создания записи группового чата
const createGroupNotificationChat = async (chatId, chatName, chatType) => {
  try {
    console.log(`Creating group notification chat: ${chatId}, ${chatName}, ${chatType}`);
    
    // Check if notification chat record already exists
    const existingChat = await NotificationChat.findOne({ 
      where: { chatId: chatId.toString() } 
    });
    
    if (!existingChat) {
      // Create new group notification chat record
      await NotificationChat.create({
        chatId: chatId.toString(),
        chat_name: chatName,
        chat_type: chatType,
        status: 'active'
      });
      console.log(`Created new group notification chat record for chat ${chatId}`);
      return true;
    } else {
      console.log(`Group notification chat record already exists for chat ${chatId}`);
      return true;
    }
  } catch (error) {
    console.error('Error creating group notification chat:', error);
    return false;
  }
};

// Настройка команд бота
const setupBotCommands = (bot) => {
  bot.setMyCommands([
    { command: '/start', description: 'Начать работу с ботом' },
    { command: '/help', description: 'Показать справку' },
    { command: '/status', description: 'Проверить статус подключения' },
    { command: '/link', description: 'Связать чат с аккаунтом' },
    { command: '/chatid', description: 'Показать ID чата' }
  ]);
};

// Обработчики команд бота
const setupBotHandlers = (bot) => {
  // Обработчик команды /start
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;
    const chatName = msg.chat.title || `${msg.chat.first_name} ${msg.chat.last_name || ''}`.trim();
    
    const welcomeMessage = `🤖 Добро пожаловать в Team-A Portal!

Я бот для авторизации и уведомлений системы Team-A.

📋 Доступные команды:
/start - Показать это сообщение
/help - Справка по использованию
/status - Проверить статус подключения
/link - Связать чат с аккаунтом
/chatid - Показать ID вашего чата

🔗 Для авторизации в системе используйте ваш Telegram username в поле "Telegram" на странице входа.`;
    
    try {
      // Создаем корпоративное изображение
      const imageBuffer = await createCorporateImage('Привет!');
      
      // Отправляем изображение с подписью
      await bot.sendPhoto(chatId, imageBuffer, {
        caption: welcomeMessage,
        parse_mode: 'HTML',
        filename: 'welcome.png'
      });
      
      // Сохраняем информацию о чате в базу данных
      if (chatType === 'private') {
        // Для личных чатов пытаемся найти сотрудника по username
        const username = msg.from.username;
        if (username) {
          await saveChatIdToDatabase(`@${username}`, chatId);
        }
      } else {
        // Для групповых чатов создаем запись
        await createGroupNotificationChat(chatId, chatName, chatType);
        
        // Отправляем дополнительное изображение для групп
        try {
          const groupImageBuffer = await createCorporateImage('Бот в группе!');
          await bot.sendPhoto(chatId, groupImageBuffer, {
            caption: `✅ Бот успешно подключен к группе "${chatName}"\n\nТеперь группа будет получать уведомления от системы Team-A.`,
            parse_mode: 'HTML',
            filename: 'group-connected.png'
          });
        } catch (groupImageError) {
          console.error('Error sending group image:', groupImageError);
        }
      }
    } catch (error) {
      console.error('Error handling /start command:', error);
      // Fallback - отправляем только текст
      try {
        await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
      } catch (fallbackError) {
        console.error('Error sending fallback message:', fallbackError);
      }
    }
  });

  // Обработчик команды /help
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `📚 Справка по использованию бота

🔐 Авторизация:
1. Перейдите на портал Team-A
2. В поле "Telegram" введите ваш username (без @)
3. Получите код авторизации в этом чате

🔗 Связывание аккаунта:
1. Выполните команду /link
2. Используйте полученный username в портале

📱 Уведомления:
Бот автоматически отправляет уведомления о:
- Получении токенов
- Новых сообщениях
- Важных событиях

❓ Если возникли проблемы:
- Проверьте статус: /status
- Убедитесь, что чат связан: /link
- Обратитесь к администратору`;
    
    try {
      await bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('Error handling /help command:', error);
    }
  });

  // Обработчик команды /status
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;
    
    let statusMessage = `📊 Статус подключения

✅ Бот активен и работает
📱 Тип чата: ${chatType}
🆔 ID чата: ${chatId}
⏰ Время: ${new Date().toLocaleString('ru-RU')}`;
    
    // Проверяем связь с базой данных
    try {
      const chatRecord = await NotificationChat.findOne({ 
        where: { chatId: chatId.toString() } 
      });
      
      if (chatRecord) {
        statusMessage += `\n✅ Чат связан с системой`;
        if (chatRecord.employee_id) {
          const employee = await Employee.findByPk(chatRecord.employee_id);
          if (employee) {
            statusMessage += `\n👤 Сотрудник: ${employee.first_name} ${employee.last_name}`;
          }
        }
      } else {
        statusMessage += `\n⚠️ Чат не связан с системой`;
        if (chatType === 'private') {
          statusMessage += `\n💡 Выполните /link для связывания`;
        }
      }
    } catch (error) {
      console.error('Error checking chat status:', error);
      statusMessage += `\n❌ Ошибка проверки статуса`;
    }
    
    try {
      await bot.sendMessage(chatId, statusMessage, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('Error handling /status command:', error);
    }
  });

  // Обработчик команды /link
  bot.onText(/\/link/, async (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;
    const username = msg.from.username;
    
    if (chatType !== 'private') {
      const errorMessage = `❌ Команда /link доступна только в личных чатах

Для связывания аккаунта:
1. Напишите боту в личные сообщения
2. Выполните команду /link
3. Используйте полученный username в портале`;
      
      try {
        await bot.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' });
      } catch (error) {
        console.error('Error handling /link command in group:', error);
      }
      return;
    }
    
    if (!username) {
      const errorMessage = `❌ Не удалось получить username

Убедитесь, что у вас установлен username в настройках Telegram:
1. Откройте настройки Telegram
2. Перейдите в "Изменить профиль"
3. Установите username
4. Попробуйте команду /link снова`;
      
      try {
        await bot.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' });
      } catch (error) {
        console.error('Error handling /link command without username:', error);
      }
      return;
    }
    
    try {
      // Сохраняем связь чата с пользователем
      const success = await saveChatIdToDatabase(`@${username}`, chatId);
      
      if (success) {
        const successMessage = `✅ Чат успешно связан!

👤 Username: @${username}
🆔 ID чата: ${chatId}

Теперь вы можете использовать @${username} для авторизации в портале Team-A.

🔐 Для входа:
1. Перейдите на портал Team-A
2. В поле "Telegram" введите: ${username}
3. Получите код авторизации в этом чате`;
        
        // Создаем корпоративное изображение
        const imageBuffer = await createCorporateImage('Бот подключен!');
        
        // Отправляем изображение с подписью
        await bot.sendPhoto(chatId, imageBuffer, {
          caption: successMessage,
          parse_mode: 'HTML',
          filename: 'bot-connected.png'
        });
      } else {
        const errorMessage = `❌ Не удалось связать чат

Возможные причины:
1. Пользователь @${username} не найден в базе данных
2. Ошибка подключения к базе данных

💡 Обратитесь к администратору для добавления вашего аккаунта в систему.`;
        
        await bot.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' });
      }
    } catch (error) {
      console.error('Error handling /link command:', error);
      
      const errorMessage = `❌ Ошибка при связывании чата

Попробуйте позже или обратитесь к администратору.`;
      
      try {
        await bot.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' });
      } catch (sendError) {
        console.error('Error sending error message:', sendError);
      }
    }
  });

  // Обработчик команды /chatid
  bot.onText(/\/chatid/, async (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;
    const chatName = msg.chat.title || `${msg.chat.first_name} ${msg.chat.last_name || ''}`.trim();
    
    const chatInfoMessage = `📱 Информация о чате

🆔 ID чата: ${chatId}
📋 Тип: ${chatType}
📝 Название: ${chatName}
👤 Пользователь: ${msg.from.username ? `@${msg.from.username}` : 'Не указан'}`;
    
    try {
      await bot.sendMessage(chatId, chatInfoMessage, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('Error handling /chatid command:', error);
    }
  });

  // Обработчик ошибок
  bot.on('polling_error', (error) => {
    console.error('Telegram bot polling error:', error);
  });

  bot.on('error', (error) => {
    console.error('Telegram bot error:', error);
  });
};

function getTelegramBot() {
  // Если уже есть экземпляр, возвращаем его
  if (botInstance) {
    return botInstance;
  }
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('Telegram bot token not found, bot will not be initialized');
    return null;
  }
  
  try {
    botInstance = new TelegramBot(token, { polling: true });
    
    // Настраиваем команды и обработчики только один раз
    if (!isInitialized) {
      setupBotCommands(botInstance);
      setupBotHandlers(botInstance);
      isInitialized = true;
      console.log('Telegram bot initialized and handlers registered');
    }
    
    return botInstance;
  } catch (error) {
    console.error('Error initializing Telegram bot:', error);
    botInstance = null;
    isInitialized = false;
    return null;
  }
}

function stopTelegramBot() {
  if (botInstance) {
    console.log('Stopping Telegram bot...');
    try {
      botInstance.stopPolling();
      botInstance = null;
      isInitialized = false;
      console.log('Telegram bot stopped');
    } catch (error) {
      console.error('Error stopping Telegram bot:', error);
    }
  }
}

module.exports = { getTelegramBot, getTelegramUserAvatar, stopTelegramBot, createCorporateImage }; 