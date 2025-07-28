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
  confirmCode,
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

router.post('/confirm-code', [
  body('code').isLength({ min: 4, max: 4 }).withMessage('Code must be 4 digits')
], confirmCode);

// Telegram Login Widget callback
router.get('/telegram-callback', async (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.query;
    
    // Проверяем, что все необходимые параметры присутствуют
    if (!id || !first_name || !auth_date || !hash) {
      return res.status(400).json({
        success: false,
        message: 'Недостаточно данных для авторизации'
      });
    }

    // Проверяем подпись данных
    const crypto = require('crypto');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not found in environment');
      return res.status(500).json({
        success: false,
        message: 'Ошибка конфигурации бота'
      });
    }

    // Создаем data-check-string
    const dataCheckString = Object.keys(req.query)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('\n');

    // Вычисляем HMAC-SHA256
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash !== hash) {
      console.error('Invalid Telegram signature');
      return res.status(400).json({ 
        success: false, 
        message: 'Неверная подпись Telegram' 
      });
    }

    // Проверяем время авторизации (не старше 1 часа)
    const authTime = parseInt(auth_date);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authTime > 3600) {
      return res.status(400).json({
        success: false,
        message: 'Время авторизации истекло'
      });
    }

    // Ищем сотрудника по Telegram ID
    const { Employee, Department, Role } = require('../models');
    const employee = await Employee.findOne({
      where: { 
        telegram_id: id,
        isActive: true
      },
      include: [
        { model: Department, as: 'department' },
        { model: Role, as: 'adminRoles' }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Сотрудник не найден. Обратитесь к администратору для привязки Telegram аккаунта.'
      });
    }

    // Обновляем последний вход
    await employee.update({ last_login: new Date() });

    // Генерируем JWT токен
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: employee.id }, 
      process.env.JWT_SECRET || 'fallback-secret', 
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Сохраняем токен в localStorage через JavaScript
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Авторизация через Telegram</title>
        <meta charset="UTF-8">
      </head>
      <body>
        <script>
          // Сохраняем токен
          localStorage.setItem('token', '${token}');
          
          // Перенаправляем на главную страницу
          window.location.href = '/home';
        </script>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h2>Авторизация успешна!</h2>
          <p>Перенаправление...</p>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlResponse);

  } catch (error) {
    console.error('Telegram callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обработки авторизации'
    });
  }
});

// Telegram Login Widget POST callback
router.post('/telegram-login', async (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;
    
    // Проверяем, что все необходимые параметры присутствуют
    if (!id || !first_name || !auth_date || !hash) {
      return res.status(400).json({
        success: false,
        message: 'Недостаточно данных для авторизации'
      });
    }

    // Проверяем подпись данных
    const crypto = require('crypto');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not found in environment');
      return res.status(500).json({
        success: false,
        message: 'Ошибка конфигурации бота'
      });
    }

    // Создаем data-check-string из body параметров
    const dataCheckString = Object.keys(req.body)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => `${key}=${req.body[key]}`)
      .join('\n');

    // Вычисляем HMAC-SHA256
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash !== hash) {
      console.error('Invalid Telegram signature');
      return res.status(400).json({ 
        success: false, 
        message: 'Неверная подпись Telegram' 
      });
    }

    // Проверяем время авторизации (не старше 1 часа)
    const authTime = parseInt(auth_date);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authTime > 3600) {
      return res.status(400).json({
        success: false,
        message: 'Время авторизации истекло'
      });
    }

    // Ищем сотрудника по Telegram ID
    const { Employee, Department, Role } = require('../models');
    const employee = await Employee.findOne({
      where: { 
        telegram_id: id,
        status: 'active'
      },
      include: [
        { model: Department, as: 'department' },
        { model: Role, as: 'adminRoles' }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Сотрудник не найден. Обратитесь к администратору для привязки Telegram аккаунта.'
      });
    }

    // Обновляем последний вход
    await employee.update({ last_login: new Date() });

    // Генерируем JWT токен
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: employee.id }, 
      process.env.JWT_SECRET || 'fallback-secret', 
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      token,
      employee: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        position: employee.position,
        department: employee.department ? {
          id: employee.department.id,
          name: employee.department.name
        } : null
      }
    });

  } catch (error) {
    console.error('Telegram login error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обработки авторизации'
    });
  }
});

// Эндпоинт для привязки Telegram ID к сотруднику
router.post('/bind-telegram', async (req, res) => {
  try {
    const { email, telegram_id } = req.body;
    
    if (!email || !telegram_id) {
      return res.status(400).json({
        success: false,
        message: 'Email и Telegram ID обязательны'
      });
    }

    const { Employee } = require('../models');
    
    // Ищем сотрудника по email
    const employee = await Employee.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Сотрудник с таким email не найден'
      });
    }

    // Проверяем, не привязан ли уже этот telegram_id к другому сотруднику
    const existingEmployee = await Employee.findOne({
      where: { telegram_id: telegram_id }
    });

    if (existingEmployee && existingEmployee.id !== employee.id) {
      return res.status(400).json({
        success: false,
        message: 'Этот Telegram ID уже привязан к другому сотруднику'
      });
    }

    // Обновляем telegram_id и telegram_chat_id (они равны в личных чатах)
    await employee.update({ 
      telegram_id: telegram_id,
      telegram_chat_id: telegram_id // В личных чатах chat_id = user_id
    });

    res.json({
      success: true,
      message: 'Telegram ID успешно привязан',
      employee: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        telegram_id: telegram_id
      }
    });

  } catch (error) {
    console.error('Error binding telegram_id:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка привязки Telegram ID'
    });
  }
});

// Эндпоинт для получения списка сотрудников без telegram_id
router.get('/employees-without-telegram', async (req, res) => {
  try {
    const { Employee } = require('../models');
    
    const employees = await Employee.findAll({
      where: { 
        telegram_id: null,
        status: 'active'
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'position'],
      order: [['first_name', 'ASC']]
    });

    res.json({
      success: true,
      employees: employees
    });

  } catch (error) {
    console.error('Error getting employees without telegram:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения списка сотрудников'
    });
  }
});

// Эндпоинт для получения информации о привязке Telegram
router.get('/telegram-binding-info', async (req, res) => {
  try {
    const { Employee } = require('../models');
    
    // Получаем статистику по привязкам
    const totalEmployees = await Employee.count({ where: { status: 'active' } });
    const withTelegramId = await Employee.count({ 
      where: { 
        telegram_id: { [require('sequelize').Op.ne]: null },
        status: 'active'
      } 
    });
    const withoutTelegramId = totalEmployees - withTelegramId;
    
    // Получаем последние привязки
    const recentBindings = await Employee.findAll({
      where: { 
        telegram_id: { [require('sequelize').Op.ne]: null },
        status: 'active'
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'telegram_id', 'telegram_chat_id', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      stats: {
        total: totalEmployees,
        withTelegramId,
        withoutTelegramId,
        percentage: totalEmployees > 0 ? Math.round((withTelegramId / totalEmployees) * 100) : 0
      },
      recentBindings
    });

  } catch (error) {
    console.error('Error getting telegram binding info:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения информации о привязках'
    });
  }
});

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