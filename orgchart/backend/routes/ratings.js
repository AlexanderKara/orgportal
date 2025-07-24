const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const adminTokenController = require('../controllers/adminTokenController');
const { authMiddleware } = require('../middleware/auth');

// Public rating routes (for authenticated users)
router.get('/top', tokenController.getTopRating);
router.get('/employee/:employeeId', tokenController.getEmployeeTokens);
router.get('/achievements/:employeeId', tokenController.getEmployeeAchievements);

// Admin rating routes
router.get('/admin/token-types', adminTokenController.getTokenTypes);
router.get('/admin/achievements', adminTokenController.getAchievements);
router.get('/admin/stats', adminTokenController.getRatingStats);
router.put('/admin/token-types/:id', adminTokenController.updateTokenType);
router.put('/admin/achievements/:id', adminTokenController.updateAchievement);

module.exports = router; 