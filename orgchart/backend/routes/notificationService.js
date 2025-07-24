const express = require('express');
const router = express.Router();
const notificationServiceController = require('../controllers/notificationServiceController');
const { authMiddleware } = require('../middleware/auth');

// Применяем аутентификацию ко всем маршрутам
router.use(authMiddleware);

// Запустить сервис уведомлений
router.post('/start', notificationServiceController.startNotificationService);

// Остановить сервис уведомлений
router.post('/stop', notificationServiceController.stopNotificationService);

// Получить статус сервиса уведомлений
router.get('/status', notificationServiceController.getNotificationServiceStatus);

// Отправить уведомление вручную
router.post('/send/:notificationId', notificationServiceController.sendNotificationManually);

// Обработать уведомления сейчас
router.post('/process', notificationServiceController.processNotificationsNow);

module.exports = router; 