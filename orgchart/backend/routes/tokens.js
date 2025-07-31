const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Импортируем модели для использования в роутах
const { Token, TokenType, Employee, TokenTransaction } = require('../models');

// Получить типы токенов
router.get('/types', authMiddleware, tokenController.getTokenTypes);

// Сервис распределения токенов
router.get('/distribution-service/status', authMiddleware, tokenController.getTokenDistributionServiceStatus);
router.post('/distribution-service/start', authMiddleware, adminMiddleware, tokenController.startTokenDistributionService);
router.post('/distribution-service/stop', authMiddleware, adminMiddleware, tokenController.stopTokenDistributionService);

// Диагностический эндпоинт (без авторизации для отладки)
router.get('/debug/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const { Employee, Token, TokenType } = require('../models');
    
    // Проверяем сотрудника
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }
    
    // Проверяем количество токенов
    const tokenCount = await Token.count();
    const employeeTokenCount = await Token.count({ where: { employeeId } });
    
    res.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.full_name
      },
      tokenCount,
      employeeTokenCount,
      message: 'Диагностика завершена'
    });
  } catch (error) {
    console.error('Диагностика ошибка:', error);
    res.status(500).json({ 
      message: 'Ошибка диагностики',
      error: error.message
    });
  }
});



// Получить токены сотрудника (временно без авторизации для отладки)
router.get('/employee/:employeeId', tokenController.getEmployeeTokens);

// Специальный эндпоинт для Telegram мини-приложения (только доступные токены)
router.get('/telegram-miniapp/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Проверим, что сотрудник существует
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    // Получаем только доступные токены (не отправленные)
    const tokens = await Token.findAll({
      where: { 
        employeeId,
        isDirectSent: false,
        status: 'available'
      },
      include: [
        {
          model: TokenType,
          as: 'tokenType',
          attributes: ['id', 'name', 'value', 'backgroundColor', 'textColor']
        }
      ],
      attributes: ['id', 'publicId', 'employeeId', 'tokenTypeId', 'senderId', 'image', 'description', 'status', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      tokens: tokens.map(token => ({
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
        tokenType: token.tokenType,
        isDirectSent: token.isDirectSent
      }))
    });
  } catch (error) {
    console.error('Error getting employee tokens for Telegram mini-app:', error);
    res.status(500).json({ 
      success: false,
      message: 'Ошибка получения токенов сотрудника',
      error: error.message 
    });
  }
});

// Отправить токен
router.post('/send', authMiddleware, tokenController.sendToken);

// Получить топ рейтинга
router.get('/top', authMiddleware, tokenController.getTopRating);

// Получить достижения сотрудника
router.get('/achievements/:employeeId', authMiddleware, tokenController.getEmployeeAchievements);

// Получить статистику токенов
router.get('/stats', authMiddleware, tokenController.getTokenStats);

// Конвертировать токены
router.post('/convert', authMiddleware, tokenController.convertTokens);

// Получить все врученные токены (для админа)
router.get('/sent', authMiddleware, tokenController.getSentTokens);

// Массовое начисление токенов сотрудникам (для админа)
router.post('/distribute', authMiddleware, tokenController.distributeTokens);

// Ручная проверка автоматического распределения токенов (для админа)
router.post('/check-auto-distribution', authMiddleware, tokenController.checkAutoDistribution);

// Получить информацию о токене по хешу (для QR-кода)
router.get('/:tokenHash', tokenController.getTokenByHash);

// Принять токен (для QR-кода)
router.post('/:tokenHash/receive', authMiddleware, tokenController.receiveTokenByHash);

// Прямая отправка токена получателю (без подтверждений)
router.post('/send-direct', async (req, res) => {
  try {
    const { tokenId, recipientId, description, comment } = req.body;

    if (!tokenId || !recipientId || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Не указаны обязательные поля: tokenId, recipientId, description' 
      });
    }

    // Находим токен для отправки
    const token = await Token.findByPk(tokenId, {
      include: [{
        model: TokenType,
        as: 'tokenType'
      }]
    });

    if (!token) {
      return res.status(404).json({ 
        success: false, 
        message: 'Токен не найден' 
      });
    }

    // Получаем получателя
    const recipient = await Employee.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Получатель не найден' 
      });
    }

    // Получаем отправителя для транзакции
    const originalOwnerId = token.employeeId;

    // Передаем токен получателю
    await token.update({
      employeeId: recipientId,
      senderId: originalOwnerId, // Добавляем ссылку на отправителя
      description: description,
      comment: comment || null,
      isDirectSent: true,
      sentAt: new Date(),
      status: 'received'
      // image остается без изменений - сохраняем оригинальное изображение
    });

    // Создаем запись о транзакции
    await TokenTransaction.create({
      tokenId: token.id,
      tokenTypeId: token.tokenTypeId,
      fromEmployeeId: originalOwnerId, // Исходный владелец (отправитель)
      toEmployeeId: recipientId,
      count: 1,
      transactionType: 'direct_send',
      description: description,
      comment: comment || null
    });

    res.json({
      success: true, 
      message: `Токен "${token.tokenType.name}" отправлен пользователю ${recipient.first_name} ${recipient.last_name}`, 
      token: token
    });
  } catch (error) {
    console.error('Error in direct token send:', error);
    res.status(500).json({ success: false, message: 'Ошибка отправки токена' });
  }
});

// Получение статистики распределений
router.get('/distributions/statistics', authMiddleware, async (req, res) => {
  try {
    const tokenDistributionService = require('../services/tokenDistributionService');
    const statistics = await tokenDistributionService.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Error getting distribution statistics:', error);
    res.status(500).json({ error: 'Ошибка получения статистики распределений' });
  }
});

// Ручной запуск распределения
router.post('/distributions/manual/:tokenTypeId', authMiddleware, async (req, res) => {
  try {
    const { tokenTypeId } = req.params;
    const tokenDistributionService = require('../services/tokenDistributionService');
    const result = await tokenDistributionService.manualDistribution(parseInt(tokenTypeId));
    res.json(result);
  } catch (error) {
    console.error('Error starting manual distribution:', error);
    res.status(500).json({ error: error.message || 'Ошибка ручного запуска распределения' });
  }
});

// Получение деталей распределения
router.get('/distributions/:distributionId', authMiddleware, async (req, res) => {
  try {
    const { distributionId } = req.params;
    const { TokenDistribution, TokenType } = require('../models');
    
    const distribution = await TokenDistribution.findByPk(distributionId, {
      include: [{
        model: TokenType,
        as: 'tokenType',
        attributes: ['name', 'backgroundColor', 'value']
      }]
    });
    
    if (!distribution) {
      return res.status(404).json({ error: 'Распределение не найдено' });
    }

    // Парсим лог выполнения если есть
    let executionLog = null;
    if (distribution.executionLog) {
      try {
        executionLog = JSON.parse(distribution.executionLog);
      } catch (e) {
        // Если не удается распарсить, оставляем как есть
        executionLog = distribution.executionLog;
      }
    }

    res.json({
      ...distribution.toJSON(),
      executionLog
    });
  } catch (error) {
    console.error('Error getting distribution details:', error);
    res.status(500).json({ error: 'Ошибка получения деталей распределения' });
  }
});

// Удаление запланированного распределения
router.delete('/distributions/:distributionId', authMiddleware, async (req, res) => {
  try {
    const { distributionId } = req.params;
    const { TokenDistribution } = require('../models');
    
    const distribution = await TokenDistribution.findByPk(distributionId);
    if (!distribution) {
      return res.status(404).json({ error: 'Распределение не найдено' });
    }

    // Можно удалять только запланированные распределения
    if (distribution.status !== 'scheduled') {
      return res.status(400).json({ error: 'Можно удалять только запланированные распределения' });
    }

    await distribution.destroy();
    res.json({ success: true, message: 'Распределение успешно удалено' });
  } catch (error) {
    console.error('Error deleting distribution:', error);
    res.status(500).json({ error: 'Ошибка удаления распределения' });
  }
});

// Получить статусы автоматического распределения для всех токенов
router.get('/distributions/statuses', authMiddleware, async (req, res) => {
  try {
    const { TokenType } = require('../models');
    
    // Получаем все типы токенов с автоматическим распределением
    const tokenTypes = await TokenType.findAll({
      where: {
        autoDistribution: true
      },
      attributes: ['id', 'name', 'autoDistributionActive']
    });
    
    const statuses = {};
    tokenTypes.forEach(tokenType => {
      statuses[tokenType.id] = tokenType.autoDistributionActive || false;
    });
    
    res.json(statuses);
  } catch (error) {
    console.error('Error getting distribution statuses:', error);
    res.status(500).json({ error: 'Ошибка получения статусов распределения' });
  }
});

// Запустить автоматическое распределение для типа токена
router.post('/distributions/start/:tokenTypeId', authMiddleware, async (req, res) => {
  try {
    const { tokenTypeId } = req.params;
    const { TokenType } = require('../models');
    const tokenDistributionService = require('../services/tokenDistributionService');
    
    // Находим тип токена
    const tokenType = await TokenType.findByPk(tokenTypeId);
    if (!tokenType) {
      return res.status(404).json({ error: 'Тип токена не найден' });
    }
    
    // Проверяем, что у токена включено автоматическое распределение
    if (!tokenType.autoDistribution) {
      return res.status(400).json({ 
        error: 'У данного типа токена не включено автоматическое распределение' 
      });
    }
    
    // Обновляем статус активности автоматического распределения
    await tokenType.update({ autoDistributionActive: true });
    
    // Уведомляем сервис распределения о новом активном токене
    try {
      await tokenDistributionService.addActiveTokenType(tokenTypeId);
    } catch (serviceError) {
      console.warn('Warning: Token distribution service notification failed:', serviceError);
      // Продолжаем выполнение, так как статус в БД уже обновлен
    }
    
    res.json({ 
      success: true, 
      message: `Автоматическое распределение для "${tokenType.name}" запущено` 
    });
  } catch (error) {
    console.error('Error starting auto distribution:', error);
    res.status(500).json({ error: 'Ошибка запуска автоматического распределения' });
  }
});

// Остановить автоматическое распределение для типа токена
router.post('/distributions/stop/:tokenTypeId', authMiddleware, async (req, res) => {
  try {
    const { tokenTypeId } = req.params;
    const { TokenType } = require('../models');
    const tokenDistributionService = require('../services/tokenDistributionService');
    
    // Находим тип токена
    const tokenType = await TokenType.findByPk(tokenTypeId);
    if (!tokenType) {
      return res.status(404).json({ error: 'Тип токена не найден' });
    }
    
    // Обновляем статус активности автоматического распределения
    await tokenType.update({ autoDistributionActive: false });
    
    // Уведомляем сервис распределения об отключении токена
    try {
      await tokenDistributionService.removeActiveTokenType(tokenTypeId);
    } catch (serviceError) {
      console.warn('Warning: Token distribution service notification failed:', serviceError);
      // Продолжаем выполнение, так как статус в БД уже обновлен
    }
    
    res.json({ 
      success: true, 
      message: `Автоматическое распределение для "${tokenType.name}" остановлено` 
    });
  } catch (error) {
    console.error('Error stopping auto distribution:', error);
    res.status(500).json({ error: 'Ошибка остановки автоматического распределения' });
  }
});

// Маршруты для изображений теперь обрабатываются в server.js
// для обеспечения доступа без авторизации

module.exports = router; 