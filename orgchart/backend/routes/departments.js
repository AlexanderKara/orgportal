const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { Department } = require('../models');

const router = express.Router();

// Простое кэширование для справочников
const cache = {
  departments: {
    data: null,
    timestamp: null,
    ttl: 5 * 60 * 1000 // 5 минут
  }
};

// Функция для проверки актуальности кэша
const isCacheValid = (cacheKey) => {
  const cacheData = cache[cacheKey];
  return cacheData && cacheData.data && 
         (Date.now() - cacheData.timestamp) < cacheData.ttl;
};

// Функция для инвалидации кэша
const invalidateCache = (cacheKey) => {
  if (cache[cacheKey]) {
    cache[cacheKey].data = null;
    cache[cacheKey].timestamp = null;
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const { Employee } = require('../models');
    
    // Проверяем кэш
    if (isCacheValid('departments')) {
      return res.json({
        success: true,
        departments: cache.departments.data,
        fromCache: true
      });
    }
    
    const departments = await Department.findAll({
      include: [
        {
          model: Employee,
          as: 'employees',
          attributes: ['id', 'first_name', 'last_name', 'position', 'status'],
          where: { status: 'active' }, // Только активные сотрудники
          required: false // LEFT JOIN чтобы показать отделы даже без сотрудников
        }
      ],
      attributes: ['id', 'name', 'slogan', 'description', 'competencies', 'icon', 'color', 'status', 'employee_count', 'order'],
      order: [['order', 'ASC'], ['name', 'ASC']] // Сначала по порядку, затем по имени
    });

    // Обрабатываем компетенции для каждого отдела
    const processedDepartments = departments.map(dept => {
      const deptData = dept.toJSON();
      
      // Обрабатываем компетенции
      deptData.competencies = (() => {
        if (!deptData.competencies || deptData.competencies.trim() === '') return [];
        try {
          if (Array.isArray(deptData.competencies)) return deptData.competencies;
          if (typeof deptData.competencies === 'string') {
            // Если это JSON массив
            if (deptData.competencies.trim().startsWith('[')) {
              return JSON.parse(deptData.competencies);
            }
            // Если это строка с переносами строк
            if (deptData.competencies.includes('\n')) {
              return deptData.competencies.split('\n').map(c => c.trim()).filter(c => c.length > 0);
            }
            // Если это строка с запятыми
            if (deptData.competencies.includes(',')) {
              return deptData.competencies.split(',').map(c => c.trim()).filter(c => c.length > 0);
            }
            // Если это одна строка
            return [deptData.competencies.trim()];
          }
          return [];
        } catch (e) {
          return [deptData.competencies];
        }
      })();
      
      return deptData;
    });

    // Обновляем кэш
    cache.departments.data = processedDepartments;
    cache.departments.timestamp = Date.now();

    res.json({
      success: true,
      departments: processedDepartments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
const getDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private
const createDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const department = await Department.create(req.body);

    // Инвалидируем кэш
    invalidateCache('departments');

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Create department error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private
const updateDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await department.update(req.body);

    // Инвалидируем кэш
    invalidateCache('departments');

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await department.destroy();

    // Инвалидируем кэш
    invalidateCache('departments');

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Routes
router.get('/', authMiddleware, adminMiddleware, getDepartments);
router.get('/:id', authMiddleware, adminMiddleware, getDepartment);
router.post('/', authMiddleware, adminMiddleware, [
  body('name').notEmpty().withMessage('Name is required'),
  body('competencies').optional().custom((value) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        return true; // Массив разрешен
      }
      if (typeof value === 'string') {
        return true; // Строка разрешена
      }
      throw new Error('Competencies must be a string or array');
    }
    return true;
  }).withMessage('Competencies must be a string or array')
], createDepartment);
router.put('/:id', authMiddleware, adminMiddleware, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('competencies').optional().custom((value) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        return true; // Массив разрешен
      }
      if (typeof value === 'string') {
        return true; // Строка разрешена
      }
      throw new Error('Competencies must be a string or array');
    }
    return true;
  }).withMessage('Competencies must be a string or array')
], updateDepartment);
router.delete('/:id', authMiddleware, adminMiddleware, deleteDepartment);

module.exports = router; 