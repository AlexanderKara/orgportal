const meetingRoomService = require('../services/meetingRoomService');

// Получить статус сервиса переговорок
const getMeetingRoomServiceStatus = async (req, res) => {
  try {
    const stats = await meetingRoomService.getServiceStats();
    res.json(stats);
  } catch (error) {
    console.error('Ошибка при получении статуса сервиса переговорок:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Запустить сервис переговорок
const startMeetingRoomService = async (req, res) => {
  try {
    console.log('Запуск сервиса переговорок...');
    await meetingRoomService.startService();
    const stats = await meetingRoomService.getServiceStats();
    res.json({ 
      message: 'Сервис переговорок запущен',
      stats 
    });
  } catch (error) {
    console.error('Ошибка при запуске сервиса переговорок:', error);
    res.status(500).json({ 
      error: 'Ошибка при запуске сервиса',
      details: error.message 
    });
  }
};

// Остановить сервис переговорок
const stopMeetingRoomService = async (req, res) => {
  try {
    console.log('Остановка сервиса переговорок...');
    await meetingRoomService.stopService();
    const stats = await meetingRoomService.getServiceStats();
    res.json({ 
      message: 'Сервис переговорок остановлен',
      stats 
    });
  } catch (error) {
    console.error('Ошибка при остановке сервиса переговорок:', error);
    res.status(500).json({ 
      error: 'Ошибка при остановке сервиса',
      details: error.message 
    });
  }
};

// Обработать задачи переговорок сейчас
const processMeetingRoomTasksNow = async (req, res) => {
  try {
    console.log('Принудительная обработка задач переговорок...');
    await meetingRoomService.processMeetingRoomTasks();
    res.json({ message: 'Задачи переговорок обработаны' });
  } catch (error) {
    console.error('Ошибка при обработке задач переговорок:', error);
    res.status(500).json({ 
      error: 'Ошибка при обработке задач',
      details: error.message 
    });
  }
};

module.exports = {
  getMeetingRoomServiceStatus,
  startMeetingRoomService,
  stopMeetingRoomService,
  processMeetingRoomTasksNow
};