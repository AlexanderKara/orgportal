const express = require('express');
const router = express.Router();
const { DistributionSettings } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// Получение настроек распределения
router.get('/', authMiddleware, async (req, res) => {
  try {
    let settings = await DistributionSettings.findOne();
    
    if (!settings) {
      // Создаем настройки по умолчанию если их нет
      settings = await DistributionSettings.create({});
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error getting distribution settings:', error);
    res.status(500).json({ error: 'Ошибка получения настроек распределения' });
  }
});

// Обновление настроек распределения
router.put('/', authMiddleware, async (req, res) => {
  try {
    const {
      serviceEnabled,
      executionTime,
      timezone,
      workingDaysOnly,
      workingDays,
      holidays,
      retryAttempts,
      retryDelay,
      notificationOnError,
      notificationEmail,
      maxConcurrentDistributions,
      distributionBatchSize
    } = req.body;

    // Валидация данных
    if (retryAttempts < 1 || retryAttempts > 10) {
      return res.status(400).json({ error: 'Количество попыток должно быть от 1 до 10' });
    }

    if (retryDelay < 1 || retryDelay > 1440) {
      return res.status(400).json({ error: 'Задержка должна быть от 1 до 1440 минут' });
    }

    if (maxConcurrentDistributions < 1 || maxConcurrentDistributions > 10) {
      return res.status(400).json({ error: 'Количество одновременных распределений должно быть от 1 до 10' });
    }

    if (distributionBatchSize < 1 || distributionBatchSize > 1000) {
      return res.status(400).json({ error: 'Размер батча должен быть от 1 до 1000' });
    }

    if (workingDaysOnly && (!workingDays || workingDays.length === 0)) {
      return res.status(400).json({ error: 'Должен быть выбран хотя бы один рабочий день' });
    }

    if (notificationOnError && (!notificationEmail || notificationEmail.trim() === '')) {
      return res.status(400).json({ error: 'Email для уведомлений обязателен при включенных уведомлениях' });
    }

    let settings = await DistributionSettings.findOne();
    
    if (settings) {
      await settings.update({
        serviceEnabled,
        executionTime,
        timezone,
        workingDaysOnly,
        workingDays,
        holidays,
        retryAttempts,
        retryDelay,
        notificationOnError,
        notificationEmail,
        maxConcurrentDistributions,
        distributionBatchSize
      });
    } else {
      settings = await DistributionSettings.create({
        serviceEnabled,
        executionTime,
        timezone,
        workingDaysOnly,
        workingDays,
        holidays,
        retryAttempts,
        retryDelay,
        notificationOnError,
        notificationEmail,
        maxConcurrentDistributions,
        distributionBatchSize
      });
    }

    res.json({ message: 'Настройки обновлены успешно', settings });
  } catch (error) {
    console.error('Error updating distribution settings:', error);
    res.status(500).json({ error: 'Ошибка обновления настроек распределения' });
  }
});

// Получить статус сервиса распределения
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const { DistributionSettings } = require('../models');
    const settings = await DistributionSettings.findOne();
    
    if (!settings) {
      // Создаем настройки по умолчанию если их нет
      const defaultSettings = await DistributionSettings.create({
        serviceEnabled: true,
        executionTime: '09:00:00',
        timezone: 'Europe/Moscow',
        workingDaysOnly: true
      });
      return res.json(defaultSettings);
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error getting distribution settings status:', error);
    res.status(500).json({ error: 'Ошибка получения статуса сервиса' });
  }
});

module.exports = router; 