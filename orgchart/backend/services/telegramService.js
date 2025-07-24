const { getTelegramBot } = require('./telegramBotInstance');
const { Employee, NotificationChat } = require('../models');

// Send authentication code via Telegram
const sendAuthCode = async (telegram, code) => {
  try {
    const bot = getTelegramBot();
    
    if (!bot) {
      console.log('Mock: Sending code via Telegram (bot not configured)');
      return true; // Return true for mock mode
    }

    // Clean telegram username (remove @ if present)
    const cleanTelegram = telegram.startsWith('@') ? telegram.substring(1) : telegram;
    
    const message = `Портал Team-A

🔐 Ваш код авторизации: <code>${code}</code>

⏰ Код действителен в течение 1 минуты!

⚠️ Не передавайте этот код третьим лицам`;

    // Try to send to stored chat ID from database first
    const employee = await Employee.findOne({ where: { telegram: telegram } });
    if (employee && employee.telegram_chat_id) {
      try {
        const result = await bot.sendMessage(employee.telegram_chat_id, message, {
          parse_mode: 'HTML'
        });
        
        // Delete auth code message after 2 minutes
        setTimeout(() => {
          bot.deleteMessage(employee.telegram_chat_id, result.message_id).catch(err => 
            console.log('Could not delete auth code message:', err.message)
          );
        }, 2 * 60 * 1000);
        
        return true;
      } catch (chatError) {
        // If stored chat ID fails, try username method
      }
    }

    // Try username method only if no stored chat ID
    if (!employee || !employee.telegram_chat_id) {
      try {
        const result = await bot.sendMessage(`@${cleanTelegram}`, message, {
          parse_mode: 'HTML'
        });

        // Delete auth code message after 2 minutes
        setTimeout(() => {
          bot.deleteMessage(result.chat.id, result.message_id).catch(err => 
            console.log('Could not delete auth code message:', err.message)
          );
        }, 2 * 60 * 1000);
        
        // Save chat ID to database for future use
        if (result.chat && result.chat.id) {
          await saveChatIdToDatabase(telegram, result.chat.id);
        }
        
        return true;
      } catch (usernameError) {
        // Try to send a helpful message to the user
        try {
          const helpMessage = `🤖 Настройка бота авторизации

Привет! Я бот для авторизации в системе Team-A.

❌ Проблема: Не удалось отправить код авторизации

🔧 Решение:
1. Перейдите к @atmsrvs_bot
2. Запустите бота командой /start
3. Выполните команду /link для связывания аккаунта
4. Попробуйте авторизацию снова

📞 Если проблема остается: Обратитесь к администратору`;
          
          const result = await bot.sendMessage(`@${cleanTelegram}`, helpMessage);
          
          // Delete help message after 2 minutes
          setTimeout(() => {
            bot.deleteMessage(result.chat.id, result.message_id).catch(err => 
              console.log('Could not delete help message:', err.message)
            );
          }, 2 * 60 * 1000);
        } catch (helpError) {
          console.error('Error sending help message:', helpError);
        }
        
        return { success: false, error: 'BOT_NOT_ADDED' };
      }
    }
    
    // If we have stored chat ID but it failed, return error
    return { success: false, error: 'BOT_NOT_ADDED' };
    
  } catch (error) {
    console.error('Telegram sending error:', error);
    
    // Check if user is not found in the application
    if (error.message && error.message.includes('User not found')) {
      const hrResponses = [
        'Рад видеть всех! Но чтобы работать, нужно сначала познакомиться с нашим отделом кадров 😄',
        'Я бот полезный, но прежде чем со мной беседовать, надо пройти собеседование! 📋',
        'Привет! Я бы с удовольствием помог, но сначала нужно оформить трудовую книжку 📚',
        'Добро пожаловать! Но для работы с кодами нужно сначала зарегистрироваться в HR системе 👔',
        'Приветствую! Я готов помочь, но сначала нужно пройти onboarding в отделе кадров 🏢',
        'Рад знакомству! Но для доступа к кодам нужно сначала подписать трудовой договор 📝',
        'Привет! Я бы с удовольствием, но сначала нужно пройти медосмотр и получить пропуск 🏥',
        'Добро пожаловать в команду! Но сначала нужно заполнить анкету в отделе кадров 📋',
        'Привет! Я готов к работе, но сначала нужно пройти инструктаж по технике безопасности ⚡',
        'Рад видеть! Но для работы с системой нужно сначала получить доступ от HR отдела 🔐'
      ];
      
      const randomResponse = hrResponses[Math.floor(Math.random() * hrResponses.length)];
      
      try {
        const bot = getTelegramBot();
        if (bot) {
          const hrMessage = `${randomResponse}\n\nОбратитесь к администратору для регистрации в системе.`;
          
          const result = await bot.sendMessage(telegram.startsWith('@') ? telegram : `@${telegram}`, hrMessage);
        
        // Delete HR response message after 2 minutes
        setTimeout(() => {
          bot.deleteMessage(result.chat.id, result.message_id).catch(err => 
            console.log('Could not delete HR response message:', err.message)
          );
        }, 2 * 60 * 1000);
        }
      } catch (sendError) {
        console.error('Error sending HR response:', sendError);
      }
      
      return false;
    }
    
    return false;
  }
};

// Store chat IDs for users
const userChatIds = new Map();

// Helper function to silently delete messages
const silentDeleteMessage = (bot, chatId, messageId) => {
  setTimeout(() => {
    bot.deleteMessage(chatId, messageId).catch(err => {
      console.log('Could not delete message:', err.message);
    });
  }, 2 * 60 * 1000); // 2 minutes
};

// Function to save chat ID to database and create notification chat record
const saveChatIdToDatabase = async (telegram, chatId) => {
  try {
    const employee = await Employee.findOne({ where: { telegram: telegram } });
    if (employee) {
      // Update employee's telegram_chat_id
      await employee.update({ telegram_chat_id: chatId });
      
      // Check if notification chat record already exists
      const existingChat = await NotificationChat.findOne({ where: { chatId: chatId.toString() } });
      
      if (!existingChat) {
        // Create new notification chat record
        const chatName = `${employee.first_name} ${employee.last_name} (${telegram})`;
        await NotificationChat.create({
          name: chatName,
          type: 'chat',
          chatId: chatId.toString(),
          isActive: true,
          status: 'active',
          commands: {
            notifications: true,
            birthdays: true,
            vacations: true,
            help: true,
            auth: true
          },
          allowedUsers: [],
          settings: {},
          lastActivity: new Date()
        });
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving chat ID to database:', error);
    return false;
  }
};

// Get all stored chat IDs from database
const getAllStoredChatIds = async () => {
  try {
    const employees = await Employee.findAll({
      where: {
        telegram_chat_id: {
          [require('sequelize').Op.not]: null
        }
      },
      attributes: ['telegram', 'telegram_chat_id']
    });

    const chatIdsMap = new Map();
    employees.forEach(emp => {
      chatIdsMap.set(emp.telegram, emp.telegram_chat_id);
    });

    return chatIdsMap;
  } catch (error) {
    console.error('Error getting stored chat IDs:', error);
    return new Map();
  }
};

// Get stored chat IDs (for debugging)
const getStoredChatIds = async () => {
  try {
    const chatIdsMap = await getAllStoredChatIds();
    return Object.fromEntries(chatIdsMap);
  } catch (error) {
    console.error('Error getting stored chat IDs:', error);
    return {};
  }
};

module.exports = {
  sendAuthCode,
  getStoredChatIds,
  getAllStoredChatIds,
  saveChatIdToDatabase
};