const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authMiddleware } = require('../middleware/auth');

// Применяем аутентификацию ко всем маршрутам
router.use(authMiddleware);

// Получить все шаблоны
router.get('/', templateController.getTemplates);

// Получить активные шаблоны
router.get('/active', templateController.getActiveTemplates);

// Получить шаблон по ID
router.get('/:id', templateController.getTemplate);

// Создать новый шаблон
router.post('/', templateController.createTemplate);

// Обновить шаблон
router.put('/:id', templateController.updateTemplate);

// Удалить шаблон
router.delete('/:id', templateController.deleteTemplate);

// Обновить счетчик использования шаблона
router.put('/:id/usage', templateController.updateTemplateUsage);

module.exports = router; 