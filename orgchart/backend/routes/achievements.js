const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const {
  getAllAchievements,
  getAchievementById,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  getEmployeeAchievements,
  assignAchievementToEmployee,
  removeAchievementFromEmployee,
  getBadgeImages,
  checkAndAssignAchievements
} = require('../controllers/achievementController');

const router = express.Router();

// Применяем middleware аутентификации ко всем маршрутам
router.use(authMiddleware);

// Получить все типы бейджей
router.get('/', getAllAchievements);

// Получить бейдж по ID
router.get('/:id', getAchievementById);

// Создать новый бейдж
router.post('/', [
  body('name').notEmpty().withMessage('Название обязательно'),
  body('description').optional(),
  body('icon').notEmpty().withMessage('Иконка обязательна'),
  body('color').notEmpty().withMessage('Цвет обязателен'),
  body('type').isIn(['social', 'activity', 'generosity', 'team', 'special', 'seasonal', 'unique']).withMessage('Неверный тип'),
  body('criteria').optional(),
  body('image').optional(),
  body('is_random').isBoolean().withMessage('is_random должно быть булевым значением'),
  body('is_unique').isBoolean().withMessage('is_unique должно быть булевым значением')
], createAchievement);

// Обновить бейдж
router.put('/:id', [
  body('name').optional(),
  body('description').optional(),
  body('icon').optional(),
  body('color').optional(),
  body('type').optional().isIn(['social', 'activity', 'generosity', 'team', 'special', 'seasonal', 'unique']),
  body('criteria').optional(),
  body('image').optional(),
  body('is_random').optional().isBoolean(),
  body('is_unique').optional().isBoolean()
], updateAchievement);

// Удалить бейдж
router.delete('/:id', deleteAchievement);

// Получить бейджи сотрудника
router.get('/employee/:employeeId', getEmployeeAchievements);

// Назначить бейдж сотруднику
router.post('/assign', [
  body('employeeId').isInt().withMessage('ID сотрудника обязателен'),
  body('achievementId').isInt().withMessage('ID бейджа обязателен'),
  body('image').optional()
], assignAchievementToEmployee);

// Удалить бейдж у сотрудника
router.delete('/employee/:employeeId/achievement/:achievementId', removeAchievementFromEmployee);

// Получить список изображений бейджей
router.get('/images/list', getBadgeImages);

// Проверить и назначить бейджи автоматически
router.post('/check-assignments', checkAndAssignAchievements);

module.exports = router; 