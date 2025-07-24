const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');
const Employee = require('../models/Employee');
const NotificationChat = require('../models/NotificationChat');

// Применяем аутентификацию ко всем маршрутам
router.use(authMiddleware);

// Получить все уведомления
router.get('/', notificationController.getNotifications);

// Получить активные уведомления
router.get('/active', notificationController.getActiveNotifications);

// Получить уведомление по ID
router.get('/:id', notificationController.getNotification);

// Создать новое уведомление
router.post('/', notificationController.createNotification);

// Обновить уведомление
router.put('/:id', notificationController.updateNotification);

// Удалить уведомление
router.delete('/:id', notificationController.deleteNotification);

// Отправка уведомления о получении токена
router.post('/token-received', async (req, res) => {
  try {
    const { recipientId, tokenData } = req.body;

    if (!recipientId || !tokenData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Не указаны обязательные поля: recipientId, tokenData' 
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

    // Проверяем есть ли получатель в списке чатов (подключен ли бот)
    const notificationChat = await NotificationChat.findOne({
      where: { employeeId: recipientId, isActive: true }
    });

    if (!notificationChat) {
      return res.json({
        success: true,
        message: 'Получатель не подключил бота, уведомление не отправлено'
      });
    }

    // Проверяем не отключил ли получатель личные уведомления
    if (notificationChat.personalNotificationsDisabled) {
      return res.json({
        success: true,
        message: 'Получатель отключил личные уведомления'
      });
    }

    // Формируем текст уведомления
    let message = `🎯 Вы получили новый токен!\n\n`;
    message += `🏷️ Тип: ${tokenData.type}\n`;
    message += `💎 Баллы: ${tokenData.points}\n`;
    message += `📝 Описание: ${tokenData.description}\n`;
    
    if (tokenData.comment) {
      message += `💬 Комментарий: ${tokenData.comment}\n`;
    }
    
    if (tokenData.senderName) {
      message += `👤 От: ${tokenData.senderName}\n`;
    }

    // Отправляем уведомление через Telegram
    const notificationService = require('../services/notificationService');
    await notificationService.sendPersonalNotification(
      notificationChat.chatId,
      message,
      tokenData.image ? {
        type: 'image',
        url: tokenData.image.startsWith('http') ? tokenData.image : `${process.env.BACKEND_URL || 'http://localhost:5000'}${tokenData.image}`
      } : null
    );

    res.json({
      success: true,
      message: 'Уведомление о получении токена отправлено'
    });

  } catch (error) {
    console.error('Error sending token received notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка отправки уведомления' 
    });
  }
});

module.exports = router; 