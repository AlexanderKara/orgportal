const express = require('express');
const router = express.Router();
const meetingRoomServiceController = require('../controllers/meetingRoomServiceController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Получить статус сервиса переговорок
router.get('/status', authMiddleware, meetingRoomServiceController.getMeetingRoomServiceStatus);

// Запустить сервис переговорок (только для админов)
router.post('/start', authMiddleware, adminMiddleware, meetingRoomServiceController.startMeetingRoomService);

// Остановить сервис переговорок (только для админов)
router.post('/stop', authMiddleware, adminMiddleware, meetingRoomServiceController.stopMeetingRoomService);

// Обработать задачи переговорок сейчас (только для админов)
router.post('/process-now', authMiddleware, adminMiddleware, meetingRoomServiceController.processMeetingRoomTasksNow);

module.exports = router;