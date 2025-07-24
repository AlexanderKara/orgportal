const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  sendCode,
  verifyCode,
  addEmployee
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('department').notEmpty().withMessage('Department is required')
], register);

// Add new employee (for development/testing)
router.post('/add-employee', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('telegram').optional().matches(/^@[\w\d_]{5,}$/).withMessage('Please enter a valid Telegram username'),
  body('phone').optional().matches(/^\+[\d]{10,}$/).withMessage('Please enter a valid phone number (format: +1234567890)')
], addEmployee);

router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], login);

// Code-based authentication routes
router.post('/send-code', [
  body('login').notEmpty().withMessage('Login is required')
], sendCode);

router.post('/verify-code', [
  body('login').notEmpty().withMessage('Login is required'),
  body('code').isLength({ min: 4, max: 4 }).withMessage('Code must be 4 digits')
], verifyCode);

// Protected routes
router.get('/me', authMiddleware, getMe);

router.put('/me', authMiddleware, [
  body('phone').optional().custom((value) => {
    if (value && value !== '') {
      if (!/^\+[\d]{10,}$/.test(value)) {
        throw new Error('Please enter a valid phone number (format: +1234567890)');
      }
    }
    return true;
  }),
  body('telegram').optional().custom((value) => {
    if (value && value !== '') {
      if (!/^@[a-zA-Z0-9_]{5,}$/.test(value)) {
        throw new Error('Please enter a valid Telegram username (format: @username)');
      }
    }
    return true;
  }),
  body('birth_date').optional().isISO8601().withMessage('Please enter a valid date'),
  body('wishlist_url').optional().isURL().withMessage('Please enter a valid URL'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('avatar').optional().isString().withMessage('Avatar must be a string'),
  body('hire_date').optional().isISO8601().withMessage('Please enter a valid date')
], updateProfile);

router.put('/change-password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], changePassword);

router.post('/logout', authMiddleware, logout);

module.exports = router; 