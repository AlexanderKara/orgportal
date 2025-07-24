const express = require('express');
const router = express.Router();
const adminTokenController = require('../controllers/adminTokenController');
const { authMiddleware } = require('../middleware/auth');

// Управление токенами
router.get('/', authMiddleware, adminTokenController.getTokens);
router.post('/', authMiddleware, adminTokenController.createToken);
router.put('/:id', authMiddleware, adminTokenController.updateToken);
router.delete('/:id', authMiddleware, adminTokenController.deleteToken);
router.post('/upload-image', authMiddleware, adminTokenController.uploadTokenImage);

// Управление типами токенов
router.get('/token-types', authMiddleware, adminTokenController.getTokenTypes);
router.put('/token-types/:id', authMiddleware, adminTokenController.updateTokenType);

// Управление достижениями
router.get('/achievements', authMiddleware, adminTokenController.getAchievements);
router.post('/achievements', authMiddleware, adminTokenController.createAchievement);
router.put('/achievements/:id', authMiddleware, adminTokenController.updateAchievement);
router.delete('/achievements/:id', authMiddleware, adminTokenController.deleteAchievement);

// Управление настройками сотрудников
router.get('/employee-settings/:employeeId', authMiddleware, adminTokenController.getEmployeeTokenSettings);
router.put('/employee-settings/:employeeId', authMiddleware, adminTokenController.updateEmployeeTokenSettings);

// Сброс рейтинга
router.post('/reset-rating', authMiddleware, adminTokenController.resetRating);

// Назначение токена сотруднику
router.post('/assign', authMiddleware, adminTokenController.assignTokenToEmployee);

// Статистика
router.get('/stats', authMiddleware, adminTokenController.getRatingStats);

module.exports = router; 