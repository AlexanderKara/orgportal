const express = require('express');
const router = express.Router();
const notificationChatController = require('../controllers/notificationChatController');
const { authMiddleware } = require('../middleware/auth');

// Применяем аутентификацию ко всем маршрутам
router.use(authMiddleware);

// Получить все чаты/группы
router.get('/', notificationChatController.getNotificationChats);

// Получить активные чаты/группы
router.get('/active', notificationChatController.getActiveNotificationChats);

// Получить чат/группу по ID
router.get('/:id', notificationChatController.getNotificationChat);

// Получить чат/группу по chatId
router.get('/chat/:chatId', notificationChatController.getNotificationChatByChatId);

// Создать новый чат/группу
router.post('/', notificationChatController.createNotificationChat);

// Обновить чат/группу
router.put('/:id', notificationChatController.updateNotificationChat);

// Удалить чат/группу
router.delete('/:id', notificationChatController.deleteNotificationChat);

// Обновить активность чата/группы
router.put('/:id/activity', notificationChatController.updateChatActivity);

module.exports = router; 