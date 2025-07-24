const { Employee, TokenType, Achievement, EmployeeAchievement, EmployeeToken } = require('../models');
const multer = require('multer');
const path = require('path');

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/tokens/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'token-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Управление токенами
const getTokens = async (req, res) => {
  try {
    const tokens = await TokenType.findAll({
      order: [['value', 'ASC']]
    });

    res.json(tokens);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ message: 'Ошибка получения токенов' });
  }
};

const createToken = async (req, res) => {
  try {
    const { 
      name, 
      image, 
      description, 
      value, 
      color,
      points,
      conversionAmount,
      conversionTargetId,
      backgroundColor,
      textColor,
      imageFolder,
      autoDistribution,
      autoDistributionPeriod,
      autoDistributionAmount
    } = req.body;

    const token = await TokenType.create({
      name,
      image,
      description,
      value: value || points || 1,
      color: color || 'gray',
      points,
      conversionAmount,
      conversionTargetId,
      backgroundColor,
      textColor,
      imageFolder,
      autoDistribution,
      autoDistributionPeriod,
      autoDistributionAmount
    });

    res.status(201).json(token);
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({ message: 'Ошибка создания токена' });
  }
};

const updateToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      image, 
      description, 
      value, 
      color,
      points,
      conversionAmount,
      conversionTargetId,
      backgroundColor,
      textColor,
      imageFolder,
      autoDistribution,
      autoDistributionPeriod,
      autoDistributionAmount
    } = req.body;
    
    const token = await TokenType.findByPk(id);
    if (!token) {
      return res.status(404).json({ message: 'Токен не найден' });
    }

    await token.update({
      name,
      image,
      description,
      value: value || points || token.value || 1,
      points,
      conversionAmount,
      conversionTargetId,
      backgroundColor,
      textColor,
      imageFolder,
      autoDistribution,
      autoDistributionPeriod,
      autoDistributionAmount
    });
    res.json(token);
  } catch (error) {
    console.error('Error updating token:', error);
    res.status(500).json({ message: 'Ошибка обновления токена' });
  }
};

const deleteToken = async (req, res) => {
  try {
    const { id } = req.params;

    const token = await TokenType.findByPk(id);
    if (!token) {
      return res.status(404).json({ message: 'Токен не найден' });
    }

    await token.destroy();
    res.json({ message: 'Токен удален' });
  } catch (error) {
    console.error('Error deleting token:', error);
    res.status(500).json({ message: 'Ошибка удаления токена' });
  }
};

const uploadTokenImage = async (req, res) => {
  try {
    
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: `Файл слишком большой. Максимальный размер: 10MB. Текущий размер: ${Math.round(req.headers['content-length'] / 1024 / 1024 * 100) / 100}MB` 
          });
        }
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ message: 'Файл не загружен' });
      }

      const imageUrl = `/uploads/tokens/${req.file.filename}`;
      
      res.json({ imageUrl });
    });
  } catch (error) {
    console.error('Error uploading token image:', error);
    res.status(500).json({ message: 'Ошибка загрузки изображения' });
  }
};

// Управление типами токенов
const getTokenTypes = async (req, res) => {
  try {
    const tokenTypes = await TokenType.findAll({
      order: [['value', 'ASC']]
    });
    res.json(tokenTypes);
  } catch (error) {
    console.error('Error getting token types:', error);
    res.status(500).json({ message: 'Ошибка получения типов токенов' });
  }
};

const updateTokenType = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      value, 
      image, 
      description,
      points,
      conversionAmount,
      conversionTargetId,
      backgroundColor,
      textColor,
      imageFolder,
      autoDistribution,
      autoDistributionPeriod,
      autoDistributionAmount
    } = req.body;

    const tokenType = await TokenType.findByPk(id);
    if (!tokenType) {
      return res.status(404).json({ message: 'Тип токена не найден' });
    }

    await tokenType.update({
      name,
      value,
      image,
      description,
      points,
      conversionAmount,
      conversionTargetId,
      backgroundColor,
      textColor,
      imageFolder,
      autoDistribution,
      autoDistributionPeriod,
      autoDistributionAmount
    });

    res.json(tokenType);
  } catch (error) {
    console.error('Error updating token type:', error);
    res.status(500).json({ message: 'Ошибка обновления типа токена' });
  }
};

// Управление достижениями
const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.findAll({
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
    res.json(achievements);
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({ message: 'Ошибка получения достижений' });
  }
};

const createAchievement = async (req, res) => {
  try {
    const { name, description, icon, color, type, criteria } = req.body;

    const achievement = await Achievement.create({
      name,
      description,
      icon,
      color,
      type,
      criteria
    });

    res.status(201).json(achievement);
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ message: 'Ошибка создания достижения' });
  }
};

const updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, type, criteria, isActive } = req.body;

    const achievement = await Achievement.findByPk(id);
    if (!achievement) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }

    await achievement.update({
      name,
      description,
      icon,
      color,
      type,
      criteria,
      isActive
    });

    res.json(achievement);
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ message: 'Ошибка обновления достижения' });
  }
};

const deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;

    const achievement = await Achievement.findByPk(id);
    if (!achievement) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }

    await achievement.destroy();
    res.json({ message: 'Достижение удалено' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ message: 'Ошибка удаления достижения' });
  }
};

// Управление настройками сотрудников
const getEmployeeTokenSettings = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findByPk(employeeId, {
      attributes: [
        'id', 'first_name', 'last_name', 'position',
        'canSendYellowTokens', 'canSendRedTokens', 'canSendPlatinumTokens',
        'grayTokensLimit', 'yellowTokensLimit', 'redTokensLimit', 'platinumTokensLimit'
      ]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Error getting employee token settings:', error);
    res.status(500).json({ message: 'Ошибка получения настроек токенов' });
  }
};

const updateEmployeeTokenSettings = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const {
      canSendYellowTokens,
      canSendRedTokens,
      canSendPlatinumTokens,
      grayTokensLimit,
      yellowTokensLimit,
      redTokensLimit,
      platinumTokensLimit
    } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    await employee.update({
      canSendYellowTokens,
      canSendRedTokens,
      canSendPlatinumTokens,
      grayTokensLimit,
      yellowTokensLimit,
      redTokensLimit,
      platinumTokensLimit
    });

    res.json(employee);
  } catch (error) {
    console.error('Error updating employee token settings:', error);
    res.status(500).json({ message: 'Ошибка обновления настроек токенов' });
  }
};

// Сброс рейтинга
const resetRating = async (req, res) => {
  try {
    const { year } = req.body;

    // Удаляем все токены за указанный год
    await EmployeeToken.destroy({
      where: { year }
    });

    // Удаляем все достижения за указанный год
    await EmployeeAchievement.destroy({
      where: { year }
    });

    res.json({ message: `Рейтинг за ${year} год сброшен` });
  } catch (error) {
    console.error('Error resetting rating:', error);
    res.status(500).json({ message: 'Ошибка сброса рейтинга' });
  }
};

// Статистика системы рейтинга
const getRatingStats = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const stats = {
      totalTokens: await EmployeeToken.sum('count', { where: { year } }),
      totalTransactions: await require('../models').TokenTransaction.count({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: new Date(year, 0, 1),
            [require('sequelize').Op.lt]: new Date(year + 1, 0, 1)
          }
        }
      }),
      totalAchievements: await EmployeeAchievement.count({ where: { year } }),
      activeEmployees: await Employee.count({ where: { status: 'active' } })
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting rating stats:', error);
    res.status(500).json({ message: 'Ошибка получения статистики рейтинга' });
  }
};

// Назначение токена сотруднику
const assignTokenToEmployee = async (req, res) => {
  try {
    const { tokenId, employeeId } = req.body;

    if (!tokenId || !employeeId) {
      return res.status(400).json({ message: 'Необходимо указать tokenId и employeeId' });
    }

    // Проверяем существование токена
    const token = await TokenType.findByPk(tokenId);
    if (!token) {
      return res.status(404).json({ message: 'Токен не найден' });
    }

    // Проверяем существование сотрудника
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    const currentYear = new Date().getFullYear();

    // Проверяем, есть ли уже запись для этого сотрудника и года
    let employeeToken = await EmployeeToken.findOne({
      where: {
        employeeId,
        tokenTypeId: tokenId,
        year: currentYear
      }
    });

    if (employeeToken) {
      // Обновляем существующую запись
      await employeeToken.update({
        count: employeeToken.count + 1
      });
    } else {
      // Создаем новую запись
      employeeToken = await EmployeeToken.create({
        employeeId,
        tokenTypeId: tokenId,
        count: 1,
        year: currentYear
      });
    }

    // Создаем запись о транзакции
    await require('../models').TokenTransaction.create({
      employeeId,
      tokenTypeId: tokenId,
      type: 'received',
      count: 1,
      year: currentYear
    });

    res.json({
      message: 'Токен успешно назначен сотруднику',
      employeeToken
    });
  } catch (error) {
    console.error('Error assigning token to employee:', error);
    res.status(500).json({ message: 'Ошибка назначения токена сотруднику' });
  }
};

module.exports = {
  getTokens,
  createToken,
  updateToken,
  deleteToken,
  uploadTokenImage,
  getTokenTypes,
  updateTokenType,
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  getEmployeeTokenSettings,
  updateEmployeeTokenSettings,
  resetRating,
  getRatingStats,
  assignTokenToEmployee
}; 