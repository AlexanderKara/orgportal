const notificationService = require('../services/notificationService');

// Запустить сервис уведомлений
const startNotificationService = async (req, res) => {
  try {
    notificationService.start();
    res.json({ 
      success: true, 
      message: 'Notification service started successfully' 
    });
  } catch (error) {
    console.error('Error starting notification service:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start notification service' 
    });
  }
};

// Остановить сервис уведомлений
const stopNotificationService = async (req, res) => {
  try {
    notificationService.stop();
    res.json({ 
      success: true, 
      message: 'Notification service stopped successfully' 
    });
  } catch (error) {
    console.error('Error stopping notification service:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to stop notification service' 
    });
  }
};

// Получить статус сервиса уведомлений
const getNotificationServiceStatus = async (req, res) => {
  try {
    const stats = await notificationService.getNotificationStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting notification service status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get notification service status' 
    });
  }
};

// Отправить уведомление вручную
const sendNotificationManually = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await notificationService.sendNotificationManually(notificationId);
    res.json(result);
  } catch (error) {
    console.error('Error sending notification manually:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send notification' 
    });
  }
};

// Обработать уведомления сейчас
const processNotificationsNow = async (req, res) => {
  try {
    await notificationService.processNotifications();
    res.json({ 
      success: true, 
      message: 'Notifications processed successfully' 
    });
  } catch (error) {
    console.error('Error processing notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process notifications' 
    });
  }
};

module.exports = {
  startNotificationService,
  stopNotificationService,
  getNotificationServiceStatus,
  sendNotificationManually,
  processNotificationsNow
}; 