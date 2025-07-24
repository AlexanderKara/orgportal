const express = require('express');
const { getTelegramUserAvatar } = require('../services/telegramBotInstance');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// @desc    Get Telegram user avatar
// @route   GET /api/telegram/avatar/:chatId/:userId
// @access  Private
router.get('/avatar/:chatId/:userId', authMiddleware, async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    
    const avatarUrl = await getTelegramUserAvatar(chatId, userId);
    
    if (avatarUrl) {
      res.json({
        success: true,
        avatarUrl
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Avatar not found'
      });
    }
  } catch (error) {
    console.error('Error getting Telegram avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting avatar'
    });
  }
});

module.exports = router; 