const models = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

// Функция для получения случайного изображения из папки
const getRandomImageFromFolder = async (folderName) => {
  try {
    const folderPath = path.join(__dirname, '../uploads/tokens', folderName);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`Папка не найдена: ${folderPath}`);
      return null;
    }
    
    const files = fs.readdirSync(folderPath);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    });
    
    if (imageFiles.length === 0) {
      console.log(`Нет изображений в папке ${folderName}`);
      return null;
    }
    
    const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    return `/uploads/tokens/${folderName}/${randomImage}`;
  } catch (error) {
    console.error('Ошибка получения случайного изображения:', error);
    return null;
  }
};

// Получить все типы токенов
const getTokenTypes = async (req, res) => {
  try {
    const tokenTypes = await models.TokenType.findAll({
      order: [['value', 'ASC']]
    });
    res.json(tokenTypes);
  } catch (error) {
    console.error('Error getting token types:', error);
    res.status(500).json({ message: 'Ошибка получения типов токенов' });
  }
};

// Получить токены сотрудника
const getEmployeeTokens = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Проверим, что сотрудник существует
    const employee = await models.Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    // Получаем токены с типами токенов
    const tokens = await models.Token.findAll({
      where: { employeeId },
      include: [
        {
          model: models.TokenType,
          as: 'tokenType',
          attributes: ['id', 'name', 'value', 'color', 'description']
        }
      ],
      attributes: ['id', 'publicId', 'employeeId', 'tokenTypeId', 'senderId', 'image', 'description', 'status', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    // Группируем токены по типу для совместимости с frontend
    const available = [];
    const received = [];

    tokens.forEach(token => {
      const tokenData = {
        id: token.id,
        publicId: token.publicId,
        employeeId: token.employeeId,
        tokenTypeId: token.tokenTypeId,
        senderId: token.senderId,
        image: token.image,
        description: token.description,
        status: token.status,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt,
        tokenType: token.tokenType
      };

      if (token.status === 'received') {
        received.push(tokenData);
      } else {
        available.push(tokenData);
      }
    });

    res.json({
      available,
      received,
      // Для обратной совместимости
      tokens: available,
      individualTokens: available
    });
  } catch (error) {
    console.error('Error getting employee tokens:', error);
    res.status(500).json({ 
      message: 'Ошибка получения токенов сотрудника',
      error: error.message 
    });
  }
};

// Отправить токен
const sendToken = async (req, res) => {
  try {
    const { fromEmployeeId, toEmployeeId, tokenTypeId, count = 1, message, description } = req.body;

    // Проверяем лимиты отправителя
    const sender = await models.Employee.findByPk(fromEmployeeId);
    const tokenType = await models.TokenType.findByPk(tokenTypeId);
    
    if (!sender || !tokenType) {
      return res.status(404).json({ message: 'Сотрудник или тип токена не найден' });
    }

    // Проверяем права на отправку
    const canSend = checkTokenSendingRights(sender, tokenType);
    if (!canSend) {
      return res.status(403).json({ message: 'Нет прав на отправку этого типа токена' });
    }

    // Проверяем лимиты
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const sentThisMonth = await models.TokenTransaction.sum('count', {
      where: {
        fromEmployeeId,
        tokenTypeId,
        createdAt: {
          [Op.gte]: new Date(currentYear, currentMonth - 1, 1),
          [Op.lt]: new Date(currentYear, currentMonth, 1)
        }
      }
    });

    const limit = getTokenLimit(sender, tokenType);
    if ((sentThisMonth || 0) + count > limit) {
      return res.status(400).json({ message: 'Превышен лимит токенов на месяц' });
    }

    // Создаем транзакцию
    const transaction = await models.TokenTransaction.create({
      fromEmployeeId,
      toEmployeeId,
      tokenTypeId,
      count,
      message
    });

    // Определяем папку для изображений по imageFolder
    let folderName = 'grey';
    if (tokenType.imageFolder) {
      folderName = tokenType.imageFolder;
    } else {
      // Fallback - определяем по имени
      const tokenTypeName = tokenType.name.toLowerCase();
      if (tokenTypeName.includes('белый') || tokenTypeName.includes('white') || tokenTypeName.includes('platinum')) {
        folderName = 'white';
      } else if (tokenTypeName.includes('желтый') || tokenTypeName.includes('yellow')) {
        folderName = 'yellow';
      } else if (tokenTypeName.includes('красный') || tokenTypeName.includes('red')) {
        folderName = 'red';
      } else if (tokenTypeName.includes('серый') || tokenTypeName.includes('gray') || tokenTypeName.includes('grey')) {
        folderName = 'grey';
      }
    }

    // Создаем индивидуальные токены
    const tokens = [];
    for (let i = 0; i < count; i++) {
      // Получаем случайное изображение
      const image = await getRandomImageFromFolder(folderName);
      
      // Используем описание из запроса или дефолтное из шаблона
      const tokenDescription = description || tokenType.description || '';
      
      const token = await models.Token.create({
        employeeId: toEmployeeId,
        tokenTypeId,
        senderId: fromEmployeeId,
        image,
        description: tokenDescription,
        comment: message,
        receivedAt: new Date(),
        status: 'active'
      });
      
      tokens.push(token);
    }

    // Обновляем токены получателя (для обратной совместимости)
    await updateEmployeeTokens(toEmployeeId, tokenTypeId, count, currentYear, currentMonth);

    // Проверяем достижения
    await checkAndAwardAchievements(toEmployeeId, currentYear);

    res.json({ 
      message: 'Токен успешно отправлен', 
      transaction,
      tokens: tokens.map(t => ({
        id: t.id,
        image: t.image,
        description: t.description,
        comment: t.comment
      }))
    });
  } catch (error) {
    console.error('Error sending token:', error);
    res.status(500).json({ message: 'Ошибка отправки токена' });
  }
};

// Получить топ рейтинга
const getTopRating = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    // Получаем всех сотрудников с их полученными токенами
    const allEmployees = await models.Employee.findAll({
      include: [
        {
          model: models.Department,
          as: 'department'
        }
      ]
    });

    // Получаем все полученные токены за указанный год
    const receivedTokens = await models.TokenTransaction.findAll({
      where: {
        toEmployeeId: { [Op.ne]: null },
        createdAt: {
          [Op.gte]: new Date(year, 0, 1),
          [Op.lt]: new Date(year + 1, 0, 1)
        }
      },
      include: [
        {
          model: models.TokenType,
          as: 'tokenType'
        }
      ]
    });

    // Получаем все достижения за указанный год
    const achievements = await models.EmployeeAchievement.findAll({
      where: {
        year: parseInt(year)
      },
      include: [
        {
          model: models.Achievement,
          as: 'achievement'
        }
      ]
    });

    // Вычисляем рейтинг для каждого сотрудника
    const employeesWithRating = allEmployees.map(employee => {
      // Подсчитываем полученные токены сотрудника
      const employeeTokens = receivedTokens.filter(token => 
        token.toEmployeeId === employee.id
      );
      
      const totalPoints = employeeTokens.reduce((sum, token) => {
        return sum + (token.tokenType.value || 1);
      }, 0);

      // Подсчитываем достижения сотрудника
      const employeeAchievements = achievements.filter(achievement => 
        achievement.employeeId === employee.id
      );

      return {
        ...employee.toJSON(),
        totalPoints,
        achievements: employeeAchievements.length
      };
    });

    // Сортируем по общему рейтингу
    employeesWithRating.sort((a, b) => b.totalPoints - a.totalPoints);

    res.json(employeesWithRating);
  } catch (error) {
    console.error('Error getting top rating:', error);
    res.status(500).json({ message: 'Ошибка получения топ рейтинга' });
  }
};

// Получить достижения сотрудника
const getEmployeeAchievements = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const achievements = await models.EmployeeAchievement.findAll({
      where: {
        employeeId,
        year: parseInt(year)
      },
      include: [{
        model: models.Achievement,
        as: 'achievement'
      }],
      order: [['earnedAt', 'DESC']]
    });

    res.json(achievements);
  } catch (error) {
    console.error('Error getting employee achievements:', error);
    res.status(500).json({ message: 'Ошибка получения достижений' });
  }
};

// Получить статистику токенов
const getTokenStats = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const stats = await models.TokenTransaction.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(year, month - 1, 1),
          [Op.lt]: new Date(year, month, 1)
        }
      },
      include: [
        {
          model: models.TokenType,
          as: 'tokenType'
        },
        {
          model: models.Employee,
          as: 'fromEmployee',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: models.Employee,
          as: 'toEmployee',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(stats);
  } catch (error) {
    console.error('Error getting token stats:', error);
    res.status(500).json({ message: 'Ошибка получения статистики' });
  }
};

// Конвертировать токены
const convertTokens = async (req, res) => {
  try {
    const { fromType, toType, count } = req.body;
    const employeeId = req.user.id;

    if (!fromType || !toType || !count) {
      return res.status(400).json({ message: 'Необходимо указать fromType, toType и count' });
    }

    const result = await convertTokensInternal(employeeId, fromType, toType, count);
    res.json(result);
  } catch (error) {
    console.error('Error converting tokens:', error);
    res.status(400).json({ message: error.message });
  }
};

// Вспомогательные функции
const checkTokenSendingRights = (employee, tokenType) => {
  const tokenTypeName = tokenType.name.toLowerCase();
  if (tokenTypeName.includes('желтый') || tokenTypeName.includes('yellow')) {
    return employee.canSendYellowTokens;
  } else if (tokenTypeName.includes('красный') || tokenTypeName.includes('red')) {
    return employee.canSendRedTokens;
  } else if (tokenTypeName.includes('серый') || tokenTypeName.includes('gray') || tokenTypeName.includes('grey')) {
    return employee.canSendGrayTokens;
  } else if (tokenTypeName.includes('белый') || tokenTypeName.includes('white') || tokenTypeName.includes('platinum')) {
    return employee.canSendPlatinumTokens;
  }
  return false;
};

const getTokenLimit = (employee, tokenType) => {
  const tokenTypeName = tokenType.name.toLowerCase();
  if (tokenTypeName.includes('белый') || tokenTypeName.includes('white') || tokenTypeName.includes('platinum')) {
    return employee.platinumTokensLimit;
  } else if (tokenTypeName.includes('красный') || tokenTypeName.includes('red')) {
    return employee.redTokensLimit;
  } else if (tokenTypeName.includes('желтый') || tokenTypeName.includes('yellow')) {
    return employee.yellowTokensLimit;
  } else if (tokenTypeName.includes('серый') || tokenTypeName.includes('gray') || tokenTypeName.includes('grey')) {
    return employee.grayTokensLimit;
  }
  return 0;
};

// Новая функция конвертации токенов
const convertTokensInternal = async (employeeId, fromType, toType, count) => {
  try {
    // Получаем типы токенов по имени
    const fromTokenType = await models.TokenType.findOne({ where: { name: fromType } });
    const toTokenType = await models.TokenType.findOne({ where: { name: toType } });
    
    if (!fromTokenType || !toTokenType) {
      throw new Error('Тип токена не найден');
    }

    // Проверяем правила конвертации
    let conversionRate = 0;
    let requiredCount = 0;
    
    const fromTypeName = fromTokenType.name.toLowerCase();
    const toTypeName = toTokenType.name.toLowerCase();
    
    if ((fromTypeName.includes('белый') || fromTypeName.includes('white') || fromTypeName.includes('platinum')) && 
        (toTypeName.includes('желтый') || toTypeName.includes('yellow'))) {
      conversionRate = 5; // 5 белых = 1 желтый
      requiredCount = count * conversionRate;
    } else if ((fromTypeName.includes('желтый') || fromTypeName.includes('yellow')) && 
               (toTypeName.includes('красный') || toTypeName.includes('red'))) {
      conversionRate = 2; // 2 желтых = 1 красный
      requiredCount = count * conversionRate;
    } else if (toTypeName.includes('серый') || toTypeName.includes('gray') || toTypeName.includes('grey')) {
      throw new Error('Серые токены нельзя конвертировать, только получить от лидов и топов');
    } else {
      throw new Error('Неподдерживаемая конвертация');
    }

    // Получаем текущие токены сотрудника
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const fromTokens = await models.EmployeeToken.findOne({
      where: {
        employeeId,
        tokenTypeId: fromTokenType.id,
        year: currentYear,
        month: currentMonth
      }
    });

    if (!fromTokens || fromTokens.count < requiredCount) {
      throw new Error(`Недостаточно ${fromTokenType.name} токенов для конвертации`);
    }

    // Выполняем конвертацию
    fromTokens.count -= requiredCount;
    await fromTokens.save();

    // Добавляем новые токены
    await updateEmployeeTokens(employeeId, toTokenType.id, count, currentYear, currentMonth);

    return { success: true, converted: count };
  } catch (error) {
    console.error('Error converting tokens:', error);
    throw error;
  }
};

const updateEmployeeTokens = async (employeeId, tokenTypeId, count, year, month) => {
  const [employeeToken, created] = await models.EmployeeToken.findOrCreate({
    where: {
      employeeId,
      tokenTypeId,
      year,
      month
    },
    defaults: {
      count: 0
    }
  });

  employeeToken.count += count;
  await employeeToken.save();
};

const checkAndAwardAchievements = async (employeeId, year) => {
  try {
    // Базовая реализация - можно расширить позже
    const employee = await models.Employee.findByPk(employeeId);
    if (!employee) return;

    // Получаем все токены сотрудника за год
    const employeeTokens = await models.EmployeeToken.findAll({
      where: {
        employeeId,
        year
      },
      include: [{
        model: models.TokenType,
        as: 'tokenType'
      }]
    });

    // Проверяем достижения (базовая логика)
    const totalTokens = employeeTokens.reduce((sum, token) => sum + token.count, 0);
    
    // Если получил больше 10 токенов - награждаем достижением "Активный участник"
    if (totalTokens >= 10) {
      const achievement = await models.Achievement.findOne({
        where: { name: 'Активный участник' }
      });
      
      if (achievement) {
        await models.EmployeeAchievement.findOrCreate({
          where: {
            employeeId,
            achievementId: achievement.id,
            year
          },
          defaults: {
            earnedAt: new Date()
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
};

// Получить все врученные токены (для админа)
const getSentTokens = async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await models.TokenTransaction.findAndCountAll({
      include: [
        {
          model: models.Employee,
          as: 'fromEmployee',
          attributes: ['id', 'first_name', 'last_name', 'position', 'avatar']
        },
        {
          model: models.Employee,
          as: 'toEmployee',
          attributes: ['id', 'first_name', 'last_name', 'position', 'avatar']
        },
        {
          model: models.TokenType,
          as: 'tokenType',
          attributes: ['id', 'name', 'image', 'value', 'backgroundColor']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

    // Форматируем данные для фронтенда
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      sender: {
        id: transaction.fromEmployee?.id,
        name: transaction.fromEmployee ? `${transaction.fromEmployee.first_name} ${transaction.fromEmployee.last_name}` : 'Неизвестно',
        position: transaction.fromEmployee?.position,
        avatar: transaction.fromEmployee?.avatar
      },
      recipient: {
        id: transaction.toEmployee?.id,
        name: transaction.toEmployee ? `${transaction.toEmployee.first_name} ${transaction.toEmployee.last_name}` : 'Неизвестно',
        position: transaction.toEmployee?.position,
        avatar: transaction.toEmployee?.avatar
      },
      tokenType: transaction.tokenType,
      count: transaction.count,
      message: transaction.message,
      createdAt: transaction.createdAt,
      created_at: transaction.createdAt // для совместимости
    }));

    res.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting sent tokens:', error);
    res.status(500).json({ message: 'Ошибка получения врученных токенов' });
  }
};

// Массовое начисление токенов сотрудникам (для админа)
const distributeTokens = async (req, res) => {
  try {
    const { tokenTypeId, employeeIds, count = 1, description, comment } = req.body;

    if (!tokenTypeId || !employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ message: 'Неверные параметры запроса' });
    }

    const tokenType = await models.TokenType.findByPk(tokenTypeId);
    if (!tokenType) {
      return res.status(404).json({ message: 'Тип токена не найден' });
    }

    // Определяем папку для изображений по imageFolder
    let folderName = 'grey';
    if (tokenType.imageFolder) {
      folderName = tokenType.imageFolder;
    } else {
      // Fallback - определяем по имени
      const tokenTypeName = tokenType.name.toLowerCase();
      if (tokenTypeName.includes('белый') || tokenTypeName.includes('white') || tokenTypeName.includes('platinum')) {
        folderName = 'white';
      } else if (tokenTypeName.includes('желтый') || tokenTypeName.includes('yellow')) {
        folderName = 'yellow';
      } else if (tokenTypeName.includes('красный') || tokenTypeName.includes('red')) {
        folderName = 'red';
      } else if (tokenTypeName.includes('серый') || tokenTypeName.includes('gray') || tokenTypeName.includes('grey')) {
        folderName = 'grey';
      }
    }

    const results = [];
    const errors = [];

    for (const employeeId of employeeIds) {
      try {
        const employee = await models.Employee.findByPk(employeeId);
        if (!employee) {
          errors.push(`Сотрудник ${employeeId} не найден`);
          continue;
        }

        // Создаем индивидуальные токены для каждого сотрудника
        const tokens = [];
        for (let i = 0; i < count; i++) {
          // Получаем случайное изображение
          const image = await getRandomImageFromFolder(folderName);
          
          // Используем описание из запроса или дефолтное из шаблона
          const tokenDescription = description || tokenType.description || '';
          
          const token = await models.Token.create({
            publicId: require('crypto').randomUUID(),
            employeeId,
            tokenTypeId,
            senderId: null, // Админское начисление
            image,
            description: tokenDescription,
            comment,
            receivedAt: new Date(),
            status: 'active'
          });
          
          tokens.push(token);
        }

        // Создаем запись о транзакции для отображения в списке отправленных
        if (tokens.length > 0) {
          try {
            await models.TokenTransaction.create({
              fromEmployeeId: null, // Админское начисление
              toEmployeeId: employeeId,
              tokenTypeId: tokenTypeId,
              count: tokens.length,
              message: comment || description || ''
            });
          } catch (transactionError) {
            console.error('Ошибка создания TokenTransaction:', transactionError);
            // Не прерываем выполнение, так как основные токены уже созданы
          }
        }

        // Обновляем токены сотрудника (для обратной совместимости)
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        await updateEmployeeTokens(employeeId, tokenTypeId, count, currentYear, currentMonth);

        results.push({
          employeeId,
          employeeName: employee.full_name,
          tokensCreated: tokens.length,
          tokens: tokens.map(t => ({
            id: t.id,
            image: t.image,
            description: t.description
          }))
        });

      } catch (error) {
        console.error(`Ошибка начисления токенов сотруднику ${employeeId}:`, error);
        errors.push(`Ошибка начисления токенов сотруднику ${employeeId}: ${error.message}`);
      }
    }

    res.json({
      message: `Токены успешно начислены ${results.length} сотрудникам`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error distributing tokens:', error);
    res.status(500).json({ message: 'Ошибка массового начисления токенов' });
  }
};

// Ручной запуск проверки автоматического распределения токенов (для админа)
const checkAutoDistribution = async (req, res) => {
  try {
    const tokenDistributionService = require('../services/tokenDistributionService');
    const results = await tokenDistributionService.checkAndDistribute();
    
    res.json({
      success: true,
      message: 'Проверка автоматического распределения завершена',
      results
    });
  } catch (error) {
    console.error('Error checking auto distribution:', error);
    res.status(500).json({ message: 'Ошибка проверки автоматического распределения' });
  }
};

// Получение статуса сервиса автоматического распределения токенов
const getTokenDistributionServiceStatus = async (req, res) => {
  try {
    const { DistributionSettings } = require('../models');
    
    // Получаем настройки сервиса
    let settings = await DistributionSettings.findOne();
    if (!settings) {
      // Создаем настройки по умолчанию если их нет
      settings = await DistributionSettings.create({
        serviceEnabled: true,
        executionTime: '09:00:00',
        timezone: 'Europe/Moscow',
        workingDaysOnly: true
      });
    }
    
    const isServiceEnabled = settings.serviceEnabled;
    
    res.json({
      success: true,
      data: {
        serviceStatus: isServiceEnabled ? 'running' : 'stopped',
        isRunning: isServiceEnabled,
        message: isServiceEnabled ? 'Сервис работает' : 'Сервис приостановлен'
      }
    });
  } catch (error) {
    console.error('Error getting token distribution service status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка получения статуса сервиса распределения токенов' 
    });
  }
};

// Функция для декодирования хеша токена
const decodeTokenHash = (tokenHash) => {
  try {
    // Декодируем base64
    const decoded = Buffer.from(tokenHash, 'base64').toString('utf-8');
    
    // Разбираем строку на части
    const parts = decoded.split('|');
    if (parts.length !== 2) {
      return null;
    }
    
    const tokenId = parseInt(parts[0]);
    const timestamp = parseInt(parts[1]);
    
    if (isNaN(tokenId)) {
      return null;
    }
    
    return {
      tokenId: tokenId,
      timestamp: timestamp
    };
  } catch (error) {
    return null;
  }
};

// Получить информацию о токене по хешу (для QR-кода)
const getTokenByHash = async (req, res) => {
  try {
    const { tokenHash } = req.params;

    // Декодируем хеш
    const decoded = decodeTokenHash(tokenHash);
    if (!decoded) {
      return res.status(404).json({ message: 'Неверная ссылка на токен' });
    }

    const token = await models.Token.findByPk(decoded.tokenId, {
      include: [
        {
          model: models.TokenType,
          as: 'tokenType'
        },
        {
          model: models.Employee,
          as: 'sender',
          attributes: ['id', 'full_name', 'position']
        }
      ]
    });

    if (!token) {
      return res.status(404).json({ message: 'Токен не найден' });
    }

    // Проверяем, что токен активен и не был принят
    if (token.status !== 'active') {
      return res.status(400).json({ message: 'Токен уже был принят или деактивирован' });
    }

    res.json({
      id: token.id,
      tokenType: token.tokenType,
      points: token.tokenType?.value || 1,
      description: token.description,
      comment: token.comment,
      receivedAt: token.receivedAt,
      sender: token.sender,
      status: token.status
    });

  } catch (error) {
    console.error('Error getting token by hash:', error);
    res.status(500).json({ message: 'Ошибка получения информации о токене' });
  }
};

// Принять токен по хешу (для QR-кода)
const receiveTokenByHash = async (req, res) => {
  try {
    const { tokenHash } = req.params;
    const { receiverId } = req.body;

    // Декодируем хеш
    const decoded = decodeTokenHash(tokenHash);
    if (!decoded) {
      return res.status(404).json({ message: 'Неверная ссылка на токен' });
    }

    // Проверяем, что токен существует
    const originalToken = await models.Token.findByPk(decoded.tokenId, {
      include: [
        {
          model: models.TokenType,
          as: 'tokenType'
        }
      ]
    });

    if (!originalToken) {
      return res.status(404).json({ message: 'Токен не найден' });
    }

    // Проверяем, что токен активен
    if (originalToken.status !== 'active') {
      return res.status(400).json({ message: 'Токен уже был принят или деактивирован' });
    }

    // Проверяем, что получатель существует
    const receiver = await models.Employee.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Получатель не найден' });
    }

    // Проверяем, что получатель не пытается получить свой же токен
    if (originalToken.employeeId === receiverId) {
      return res.status(400).json({ message: 'Нельзя получить свой же токен' });
    }

    // Создаем новый токен для получателя
    const newToken = await models.Token.create({
      publicId: require('crypto').randomUUID(),
      employeeId: receiverId,
      tokenTypeId: originalToken.tokenTypeId,
      senderId: originalToken.employeeId, // Отправитель - владелец оригинального токена
      image: originalToken.image,
      description: originalToken.description,
      comment: originalToken.comment,
      receivedAt: new Date(),
      status: 'received'
    });

    // Обновляем статус оригинального токена на 'transferred'
    await originalToken.update({
      status: 'transferred'
    });

    // Обновляем токены сотрудника (для обратной совместимости)
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    await updateEmployeeTokens(receiverId, originalToken.tokenTypeId, 1, currentYear, currentMonth);

    // Проверяем достижения
    await checkAndAwardAchievements(receiverId, currentYear);

    res.json({
      success: true,
      message: 'Токен успешно принят',
      token: {
        id: newToken.id,
        tokenType: originalToken.tokenType,
        points: originalToken.tokenType?.value || 1,
        description: newToken.description,
        comment: newToken.comment,
        receivedAt: newToken.receivedAt
      }
    });

  } catch (error) {
    console.error('Error receiving token by hash:', error);
    res.status(500).json({ message: 'Ошибка приема токена' });
  }
};

// Тестовый запрос для дебага include
(async () => {
  try {
    const testToken = await models.Token.findOne({
      include: [
        { model: models.TokenType, as: 'tokenType' }
      ]
    });
  } catch (e) {
    console.error('TEST TOKEN ERROR:', e);
  }
})();

// Запустить сервис распределения токенов
const startTokenDistributionService = async (req, res) => {
  try {
    const tokenDistributionService = require('../services/tokenDistributionService');
    await tokenDistributionService.startScheduler();
    res.json({ 
      success: true, 
      message: 'Token distribution service started successfully' 
    });
  } catch (error) {
    console.error('Error starting token distribution service:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start token distribution service' 
    });
  }
};

// Остановить сервис распределения токенов
const stopTokenDistributionService = async (req, res) => {
  try {
    const tokenDistributionService = require('../services/tokenDistributionService');
    await tokenDistributionService.stopScheduler();
    res.json({ 
      success: true, 
      message: 'Token distribution service stopped successfully' 
    });
  } catch (error) {
    console.error('Error stopping token distribution service:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to stop token distribution service' 
    });
  }
};

module.exports = {
  getTokenTypes,
  getEmployeeTokens,
  sendToken,
  getTopRating,
  getEmployeeAchievements,
  getTokenStats,
  convertTokens,
  getSentTokens,
  distributeTokens,
  checkAutoDistribution,
  getTokenByHash,
  receiveTokenByHash,
  getTokenDistributionServiceStatus,
  startTokenDistributionService,
  stopTokenDistributionService
}; 