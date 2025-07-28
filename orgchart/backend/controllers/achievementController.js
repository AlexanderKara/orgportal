const { validationResult } = require('express-validator');
const { Achievement, EmployeeAchievement, Employee, TokenTransaction } = require('../models');
const fs = require('fs').promises;
const path = require('path');

// Получить все типы бейджей
const getAllAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      achievements: achievements
    });
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения бейджей'
    });
  }
};

// Получить бейдж по ID
const getAchievementById = async (req, res) => {
  try {
    const { id } = req.params;
    const achievement = await Achievement.findByPk(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Бейдж не найден'
      });
    }

    res.json({
      success: true,
      achievement
    });
  } catch (error) {
    console.error('Error getting achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения бейджа'
    });
  }
};

// Создать новый бейдж
const createAchievement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const achievementData = req.body;
    const achievement = await Achievement.create(achievementData);

    res.status(201).json({
      success: true,
      achievement
    });
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания бейджа'
    });
  }
};

// Обновить бейдж
const updateAchievement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const achievement = await Achievement.findByPk(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Бейдж не найден'
      });
    }

    await achievement.update(req.body);

    res.json({
      success: true,
      achievement
    });
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления бейджа'
    });
  }
};

// Удалить бейдж
const deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const achievement = await Achievement.findByPk(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Бейдж не найден'
      });
    }

    // Проверяем, есть ли у кого-то этот бейдж
    const employeeAchievements = await EmployeeAchievement.findAll({
      where: { achievementId: id }
    });

    if (employeeAchievements.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить бейдж, который уже присвоен сотрудникам'
      });
    }

    await achievement.destroy();

    res.json({
      success: true,
      message: 'Бейдж удален'
    });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления бейджа'
    });
  }
};

// Получить бейджи сотрудника
const getEmployeeAchievements = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employeeAchievements = await EmployeeAchievement.findAll({
      where: { employeeId },
      include: [
        {
          model: Achievement,
          as: 'achievement',
          attributes: ['id', 'name', 'description', 'icon', 'color', 'type', 'image', 'is_random', 'is_unique']
        }
      ],
      order: [['earnedAt', 'DESC']]
    });

    res.json(employeeAchievements);
  } catch (error) {
    console.error('Error getting employee achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения бейджей сотрудника'
    });
  }
};

// Назначить бейдж сотруднику
const assignAchievementToEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { employeeId, achievementId, image } = req.body;

    // Проверяем, есть ли уже такой бейдж у сотрудника
    const existingAchievement = await EmployeeAchievement.findOne({
      where: { employeeId, achievementId }
    });

    if (existingAchievement) {
      return res.status(400).json({
        success: false,
        message: 'У сотрудника уже есть этот бейдж'
      });
    }

    // Получаем информацию о бейдже
    const achievement = await Achievement.findByPk(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Бейдж не найден'
      });
    }

    // Определяем изображение для бейджа
    let badgeImage = image;
    if (!badgeImage && achievement.is_random) {
      // Получаем случайное изображение из папки
      const imageFolder = path.join(__dirname, '../uploads/badges', achievement.type);
      try {
        const files = await fs.readdir(imageFolder);
        const imageFiles = files.filter(file => 
          /\.(jpg|jpeg|png|gif|svg)$/i.test(file)
        );
        if (imageFiles.length > 0) {
          const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
          badgeImage = `/uploads/badges/${achievement.type}/${randomImage}`;
        }
      } catch (error) {
        console.error('Error reading badge images:', error);
      }
    } else if (!badgeImage && achievement.image) {
      badgeImage = achievement.image;
    }

    const employeeAchievement = await EmployeeAchievement.create({
      employeeId,
      achievementId,
      earnedAt: new Date(),
      year: new Date().getFullYear(),
      image: badgeImage
    });

    res.status(201).json({
      success: true,
      employeeAchievement
    });
  } catch (error) {
    console.error('Error assigning achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка назначения бейджа'
    });
  }
};

// Удалить бейдж у сотрудника
const removeAchievementFromEmployee = async (req, res) => {
  try {
    const { employeeId, achievementId } = req.params;

    const employeeAchievement = await EmployeeAchievement.findOne({
      where: { employeeId, achievementId }
    });

    if (!employeeAchievement) {
      return res.status(404).json({
        success: false,
        message: 'Бейдж не найден у сотрудника'
      });
    }

    await employeeAchievement.destroy();

    res.json({
      success: true,
      message: 'Бейдж удален у сотрудника'
    });
  } catch (error) {
    console.error('Error removing achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления бейджа'
    });
  }
};

// Получить список изображений бейджей
const getBadgeImages = async (req, res) => {
  try {
    const badgesPath = path.join(__dirname, '../uploads/badges');
    const images = {};

    try {
      const typeFolders = await fs.readdir(badgesPath);
      
      for (const typeFolder of typeFolders) {
        const typePath = path.join(badgesPath, typeFolder);
        const stats = await fs.stat(typePath);
        
        if (stats.isDirectory()) {
          const files = await fs.readdir(typePath);
          const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png|gif|svg)$/i.test(file)
          );
          
          images[typeFolder] = imageFiles.map(file => ({
            name: file,
            path: `/uploads/badges/${typeFolder}/${file}`
          }));
        }
      }
    } catch (error) {
      console.error('Error reading badge images:', error);
      // Если папка не существует, создаем моковые данные
      const mockFolders = ['social', 'activity', 'generosity', 'team', 'special', 'seasonal', 'unique'];
      mockFolders.forEach(folder => {
        images[folder] = [
          { name: 'badge1.png', path: `/uploads/badges/${folder}/badge1.png` },
          { name: 'badge2.png', path: `/uploads/badges/${folder}/badge2.png` },
          { name: 'badge3.png', path: `/uploads/badges/${folder}/badge3.png` },
        ];
      });
    }

    res.json({
      success: true,
      images
    });
  } catch (error) {
    console.error('Error getting badge images:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения изображений бейджей'
    });
  }
};

// Проверить и назначить бейджи автоматически
const checkAndAssignAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.findAll({
      where: { isActive: true }
    });

    const employees = await Employee.findAll({
      where: { status: 'active' }
    });

    let assignedCount = 0;

    for (const employee of employees) {
      for (const achievement of achievements) {
        if (!achievement.criteria || Object.keys(achievement.criteria).length === 0) {
          continue; // Пропускаем бейджи без критериев
        }

        // Проверяем, есть ли уже такой бейдж у сотрудника
        const existingAchievement = await EmployeeAchievement.findOne({
          where: { employeeId: employee.id, achievementId: achievement.id }
        });

        if (existingAchievement) {
          continue; // Бейдж уже есть
        }

        // Проверяем критерии
        const shouldAssign = await checkAchievementCriteria(employee.id, achievement.criteria);
        
        if (shouldAssign) {
          // Определяем изображение для бейджа
          let badgeImage = null;
          if (achievement.is_random) {
            const imageFolder = path.join(__dirname, '../uploads/badges', achievement.type);
            try {
              const files = await fs.readdir(imageFolder);
              const imageFiles = files.filter(file => 
                /\.(jpg|jpeg|png|gif|svg)$/i.test(file)
              );
              if (imageFiles.length > 0) {
                const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
                badgeImage = `/uploads/badges/${achievement.type}/${randomImage}`;
              }
            } catch (error) {
              console.error('Error reading badge images:', error);
            }
          } else if (achievement.image) {
            badgeImage = achievement.image;
          }

          await EmployeeAchievement.create({
            employeeId: employee.id,
            achievementId: achievement.id,
            earnedAt: new Date(),
            year: new Date().getFullYear(),
            image: badgeImage
          });

          assignedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Назначено ${assignedCount} новых бейджей`,
      assignedCount
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка проверки бейджей'
    });
  }
};

// Функция проверки критериев бейджа
const checkAchievementCriteria = async (employeeId, criteria) => {
  try {
    // Получаем транзакции токенов для сотрудника
    const transactions = await TokenTransaction.findAll({
      where: { toEmployeeId: employeeId }
    });

    // Проверяем различные типы критериев
    if (criteria.tokenCount) {
      const tokenCount = transactions.length;
      if (tokenCount >= criteria.tokenCount) {
        return true;
      }
    }

    if (criteria.tokenTypeCount) {
      const tokenTypeCounts = {};
      transactions.forEach(transaction => {
        const tokenType = transaction.tokenType;
        tokenTypeCounts[tokenType] = (tokenTypeCounts[tokenType] || 0) + 1;
      });

      for (const [tokenType, requiredCount] of Object.entries(criteria.tokenTypeCount)) {
        if ((tokenTypeCounts[tokenType] || 0) < requiredCount) {
          return false;
        }
      }
      return true;
    }

    if (criteria.uniqueSenders) {
      const uniqueSenders = new Set(transactions.map(t => t.fromEmployeeId)).size;
      if (uniqueSenders >= criteria.uniqueSenders) {
        return true;
      }
    }

    if (criteria.timePeriod) {
      const { period, count } = criteria.timePeriod;
      const now = new Date();
      let startDate;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          return false;
      }

      const periodTransactions = transactions.filter(t => 
        new Date(t.createdAt) >= startDate
      );

      if (periodTransactions.length >= count) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking achievement criteria:', error);
    return false;
  }
};

module.exports = {
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
}; 