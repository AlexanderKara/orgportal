const express = require('express');
const router = express.Router();
const { AppSettings } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Получить настройки приложения
router.get('/', async (req, res) => {
  try {
    const settings = await AppSettings.findAll();
    const settingsObject = {};
    
    settings.forEach(setting => {
      let value = setting.value;
      
      // Преобразуем значение в зависимости от типа
      switch (setting.type) {
        case 'boolean':
          value = value === 'true' || value === '1';
          break;
        case 'number':
          value = parseInt(value, 10);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = null;
          }
          break;
      }
      
      settingsObject[setting.key] = value;
    });
    
    res.json(settingsObject);
  } catch (error) {
    console.error('Error getting app settings:', error);
    res.status(500).json({ error: 'Failed to get app settings' });
  }
});

// Обновить настройку приложения (только для админов)
router.put('/:key', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type = 'string', description } = req.body;
    
    let [setting, created] = await AppSettings.findOrCreate({
      where: { key },
      defaults: {
        value: String(value),
        type,
        description
      }
    });
    
    if (!created) {
      await setting.update({
        value: String(value),
        type,
        description
      });
    }
    
    res.json({ success: true, setting });
  } catch (error) {
    console.error('Error updating app setting:', error);
    res.status(500).json({ error: 'Failed to update app setting' });
  }
});

// Получить конкретную настройку
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await AppSettings.findOne({ where: { key } });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    let value = setting.value;
    
    // Преобразуем значение в зависимости от типа
    switch (setting.type) {
      case 'boolean':
        value = value === 'true' || value === '1';
        break;
      case 'number':
        value = parseInt(value, 10);
        break;
      case 'json':
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = null;
        }
        break;
    }
    
    res.json({ key: setting.key, value, type: setting.type });
  } catch (error) {
    console.error('Error getting app setting:', error);
    res.status(500).json({ error: 'Failed to get app setting' });
  }
});

module.exports = router;