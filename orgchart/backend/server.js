const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database models
const { sequelize, testConnection, syncDatabase } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const skillRoutes = require('./routes/skills');
const skillGroupRoutes = require('./routes/skillGroups');
const productRoutes = require('./routes/products');
const productCategoryRoutes = require('./routes/productCategories');
const vacationRoutes = require('./routes/vacations');
const roleRoutes = require('./routes/roles');
const userRoleRoutes = require('./routes/userRoles');
const notificationRoutes = require('./routes/notifications');
const templateRoutes = require('./routes/templates');
const notificationChatRoutes = require('./routes/notificationChats');
const notificationServiceRoutes = require('./routes/notificationService');
const telegramRoutes = require('./routes/telegram');
const tokenRoutes = require('./routes/tokens');
const adminTokenRoutes = require('./routes/adminTokens');
const ratingRoutes = require('./routes/ratings');
const distributionSettingsRoutes = require('./routes/distributionSettings');
const logsRoutes = require('./routes/logs');
const achievementRoutes = require('./routes/achievements');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');
const { performanceMiddleware, dbPerformanceMiddleware } = require('./middleware/performance');

// Import services
const notificationService = require('./services/notificationService');
const { getTelegramBot } = require('./services/telegramBotInstance');
const tokenDistributionService = require('./services/tokenDistributionService');

const app = express();

// Trust proxy for rate limiting behind Nginx
app.set('trust proxy', true);

// Database connection
let dbConnected = false;

const initializeDatabase = async () => {
  try {
    dbConnected = await testConnection();
    if (dbConnected) {
      await syncDatabase();
    }
  } catch (error) {
    // Только критическая ошибка
    // Можно добавить логирование в файл/мониторинг
  }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(performanceMiddleware);
app.use(dbPerformanceMiddleware);

// Логирование всех входящих запросов
app.use((req, res, next) => {
  console.log('INCOMING:', req.method, req.url);
  next();
});
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "http:", "https:"]
    }
  }
}));
app.use(compression());

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'https://a-team.moscow', 'https://www.a-team.moscow'];

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (мобильные приложения, Postman, etc.)
    if (!origin) {
      console.log('CORS: Allowing request without origin (mobile app, etc.)');
      return callback(null, true);
    }
    
    // Разрешаем localhost в development
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      console.log('CORS: Allowing localhost in development:', origin);
      return callback(null, true);
    }
    
    // Проверяем разрешенные origins
    if (corsOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Allowing origin:', origin);
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Cross-Origin-Resource-Policy'],
  maxAge: 86400 // 24 часа
}));

// Rate limiting - более мягкие настройки для auth endpoints
// const authLimiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 минута
//   max: 60, // Увеличиваем до 60 запросов в минуту для auth
//   message: 'Too many authentication requests, please try again later.'
// });

// const generalLimiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Увеличиваем лимит
//   message: 'Too many requests from this IP, please try again later.'
// });

// const bulkImportLimiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 минута
//   max: 1000, // Очень высокий лимит для bulk операций
//   message: 'Too many bulk operations, please try again later.'
// });

// Применяем разные лимиты для разных endpoints
// Временно отключаем rate limiting для тестирования
// app.use('/api/auth', authLimiter);
// app.use('/api/employees', bulkImportLimiter); // Специальный лимит для employees

// В режиме разработки отключаем лимиты для API
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode: rate limiting disabled for API endpoints');
} else {
  // app.use('/api/', generalLimiter);
  console.log('Production mode: rate limiting temporarily disabled for testing');
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Настройка статических файлов с CORS заголовками и правильной обработкой URL
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Декодируем URL для правильной обработки имен файлов с пробелами и скобками
  if (req.url) {
    req.url = decodeURIComponent(req.url);
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: dbConnected ? 'MySQL connected' : 'Mock data (no connection)'
  });
});

// Diagnostic endpoint (no auth required)
app.get('/api/debug/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const { Employee, Token, TokenType } = require('./models');
    
    // Проверяем сотрудника
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }
    
    // Проверяем количество токенов
    const tokenCount = await Token.count();
    const employeeTokenCount = await Token.count({ where: { employeeId } });
    
    res.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.full_name
      },
      tokenCount,
      employeeTokenCount,
      message: 'Диагностика завершена'
    });
  } catch (error) {
    console.error('Диагностика ошибка:', error);
    res.status(500).json({ 
      message: 'Ошибка диагностики',
      error: error.message
    });
  }
});

// Test tokens endpoint (no auth required)
app.get('/api/test/tokens/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const { Employee, Token, TokenType } = require('./models');
    
    // Проверяем сотрудника
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }
    
    // Получаем токены
    const tokens = await Token.findAll({
      where: { employeeId },
      include: [
        {
          model: TokenType,
          as: 'tokenType',
          attributes: ['id', 'name', 'value', 'backgroundColor']
        }
      ],
      order: [['receivedAt', 'DESC']]
    });
    
    res.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.full_name
      },
      tokens: tokens.map(token => ({
        id: token.id,
        tokenTypeId: token.tokenTypeId,
        tokenType: token.tokenType,
        description: token.description,
        comment: token.comment,
        receivedAt: token.receivedAt,
        status: token.status,
        image: token.image
      })),
      count: tokens.length
    });
  } catch (error) {
    console.error('Тест токенов ошибка:', error);
    res.status(500).json({ 
      message: 'Ошибка теста токенов',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);

// Public routes (no authentication required)
app.use('/api/public/employees', employeeRoutes);
app.use('/api/public/departments', departmentRoutes);
app.use('/api/public/products', productRoutes);

// Protected routes (authentication required)
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', authMiddleware, departmentRoutes);
app.use('/api/skills', authMiddleware, skillRoutes);
app.use('/api/skill-groups', authMiddleware, skillGroupRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/product-categories', authMiddleware, productCategoryRoutes);
app.use('/api/vacations', authMiddleware, vacationRoutes);
app.use('/api/roles', authMiddleware, roleRoutes);
app.use('/api/user-roles', authMiddleware, userRoleRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/notification-chats', authMiddleware, notificationChatRoutes);
app.use('/api/notification-service', authMiddleware, notificationServiceRoutes);
app.use('/api/telegram', authMiddleware, telegramRoutes);
app.use('/api/achievements', achievementRoutes);
// Public token image routes (no authentication required)
app.get('/api/tokens/images/folders', (req, res) => {
  try {
    const tokensPath = path.join(__dirname, 'uploads/tokens');
    
    if (fs.existsSync(tokensPath)) {
      try {
        const folders = fs.readdirSync(tokensPath);
        
        const availableFolders = folders
          .filter(folder => {
            const folderPath = path.join(tokensPath, folder);
            const exists = fs.existsSync(folderPath);
            const isDir = exists ? fs.statSync(folderPath).isDirectory() : false;
            return exists && isDir;
          })
          .map(folder => {
            try {
              const folderPath = path.join(tokensPath, folder);
              const files = fs.readdirSync(folderPath);
              const imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
              });
              return { folder, imageCount: imageFiles.length };
            } catch (folderError) {
              console.error(`Ошибка чтения папки ${folder}:`, folderError);
              return { folder, imageCount: 0, error: folderError.message };
            }
          });
        
        const result = availableFolders.map(f => f.folder);
        res.json(result);
      } catch (readError) {
        console.error('Ошибка чтения папки tokens:', readError);
        res.json([]);
      }
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Ошибка при получении списка папок:', error);
    res.status(500).json({ error: 'Ошибка при получении списка папок', details: error.message });
  }
});

app.get('/api/tokens/images/:folder', (req, res) => {
  try {
    const { folder } = req.params;
    const folderPath = path.join(__dirname, 'uploads/tokens', folder);
    
    // Проверяем существование папки
    if (!fs.existsSync(folderPath)) {
      return res.json([]);
    }
    
    // Читаем файлы из папки
    const files = fs.readdirSync(folderPath);
    
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    });
    
    // Формируем пути к изображениям через специальный endpoint
    const imagePaths = imageFiles.map(file => {
      // Используем специальный endpoint для изображений
      const encodedFile = encodeURIComponent(file);
      return `/api/tokens/image/${folder}/${encodedFile}`;
    });
    
    res.json(imagePaths);
  } catch (error) {
    console.error('Ошибка при получении списка изображений:', error);
    res.status(500).json({ error: 'Ошибка при получении списка изображений' });
  }
});

// Специальный endpoint для получения изображений токенов
app.get('/api/tokens/image/:folder/:filename', (req, res) => {
  try {
    const { folder, filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);
    const imagePath = path.join(__dirname, 'uploads/tokens', folder, decodedFilename);
    
    // Проверяем существование файла
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Определяем MIME тип
    const ext = path.extname(decodedFilename).toLowerCase();
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    // Устанавливаем заголовки для CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Отправляем изображение
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Кэшируем на год
    res.sendFile(imagePath);
    
  } catch (error) {
    console.error('Ошибка при получении изображения:', error);
    res.status(500).json({ error: 'Ошибка при получении изображения' });
  }
});

app.get('/api/tokens/images/:folder/random', (req, res) => {
  try {
    const { folder } = req.params;
    const folderPath = path.join(__dirname, 'uploads/tokens', folder);
    
    // Проверяем существование папки
    if (!fs.existsSync(folderPath)) {
      return res.json({ image: null });
    }
    
    // Читаем файлы из папки
    const files = fs.readdirSync(folderPath);
    
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    });
    
    if (imageFiles.length === 0) {
      return res.json({ image: null });
    }
    
    // Выбираем случайное изображение
    const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    const imagePath = `/uploads/tokens/${folder}/${randomImage}`;
    
    res.json({ image: imagePath });
  } catch (error) {
    console.error('Ошибка при получении случайного изображения:', error);
    res.status(500).json({ error: 'Ошибка при получении случайного изображения' });
  }
});

app.get('/api/tokens/images-test', (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, 'uploads');
    const tokensPath = path.join(__dirname, 'uploads/tokens');
    
    if (fs.existsSync(tokensPath)) {
      try {
        const folders = fs.readdirSync(tokensPath);
        
        const folderInfo = folders
          .filter(folder => {
            const folderPath = path.join(tokensPath, folder);
            return fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();
          })
          .map(folder => {
            try {
              const folderPath = path.join(tokensPath, folder);
              const files = fs.readdirSync(folderPath);
              return { folder, files };
            } catch (folderError) {
              console.error(`Ошибка чтения папки ${folder}:`, folderError);
              return { folder, files: [], error: folderError.message };
            }
          });
        
        res.json({ 
          uploadsExists: fs.existsSync(uploadsPath),
          tokensExists: fs.existsSync(tokensPath),
          folders: folderInfo
        });
      } catch (readError) {
        console.error('Ошибка чтения папки tokens:', readError);
        res.json({ 
          uploadsExists: fs.existsSync(uploadsPath),
          tokensExists: true,
          folders: [],
          error: readError.message
        });
      }
    } else {
      res.json({ 
        uploadsExists: fs.existsSync(uploadsPath),
        tokensExists: false,
        folders: []
      });
    }
  } catch (error) {
    console.error('Ошибка при проверке структуры папок:', error);
    res.status(500).json({ error: 'Ошибка при проверке структуры папок', details: error.message });
  }
});

// Protected token routes (authentication required)
app.use('/api/tokens', tokenRoutes);
app.use('/api/admin/tokens', authMiddleware, adminTokenRoutes);
app.use('/api/ratings', authMiddleware, ratingRoutes);
app.use('/api/distribution-settings', authMiddleware, distributionSettingsRoutes);
app.use('/api/logs', logsRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Инициализируем Telegram бота ПЕРЕД запуском других сервисов
      const bot = getTelegramBot();
      if (bot) {
        console.log('Telegram bot service started');
      } else {
        console.log('Telegram bot not configured (no token)');
      }
      
      // Запускаем сервис уведомлений ПОСЛЕ инициализации бота
      notificationService.start();
      console.log('Notification service started');
      
      // Запускаем планировщик автоматического распределения токенов
      // tokenDistributionService.startScheduler();
      // console.log('Token distribution scheduler started');
    });
  } catch (error) {
    console.error('Critical error during server startup:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; 