const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op, fn, col } = require('sequelize');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { Employee, Department, EmployeeSkill, Skill, SkillLevel, Role, sequelize } = require('../models');

const router = express.Router();

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, // Увеличиваем лимит по умолчанию
      department_id, 
      status, 
      search, 
      sortBy = 'last_name', // Изменяем сортировку по умолчанию
      sortOrder = 'ASC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Определяем порядок сортировки
    const order = [[sortBy, sortOrder.toUpperCase()]];

    let where = {};
    if (department_id) where.department_id = department_id;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { position: { [Op.like]: `%${search}%` } }
      ];
    }

    // Для публичных запросов показываем только активных сотрудников
    if (!req.employee) {
      where.status = 'active';
    }

    const { count, rows: employees } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'color'], // Ограничиваем поля отдела
          where: { status: 'active' }, // Только активные отделы
          required: false
        },
        {
          model: Role,
          as: 'adminRoles',
          attributes: ['id', 'name', 'color', 'icon'], // Ограничиваем поля ролей
          through: { attributes: [] }
        },
        {
          model: EmployeeSkill,
          as: 'employeeSkills',
          attributes: ['id', 'skill_level_id'], // Ограничиваем поля навыков сотрудника
          include: [
            {
              model: Skill,
              as: 'skill',
              attributes: ['id', 'name', 'skill_type', 'color'] // Ограничиваем поля навыка
            },
            {
              model: SkillLevel,
              as: 'skillLevel',
              attributes: ['id', 'name', 'value']
            }
          ]
        }
      ],
      attributes: { 
        exclude: ['password'] // Исключаем пароль из выборки
      },
      order,
      offset,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'color']
        },
        {
          model: Role,
          as: 'adminRoles',
          attributes: ['id', 'name', 'color', 'icon'],
          through: { attributes: [] }
        },
        {
          model: EmployeeSkill,
          as: 'employeeSkills',
          include: [
            {
              model: Skill,
              as: 'skill',
              attributes: ['id', 'name', 'skill_type', 'color']
            },
            {
              model: SkillLevel,
              as: 'skillLevel',
              attributes: ['id', 'name', 'value']
            }
          ]
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Transform skills data like in getMe
    const employeeData = employee.toJSON();
    const skills = {
      hardSkills: [],
      softSkills: [],
      hobbies: []
    };

    if (employeeData.employeeSkills) {
      employeeData.employeeSkills.forEach(employeeSkill => {
        const skillData = {
          id: employeeSkill.skill.id,
          label: employeeSkill.skill.name,
          level: employeeSkill.skillLevel ? employeeSkill.skillLevel.value : null,
          color: employeeSkill.skill.color
        };

        switch (employeeSkill.skill.skill_type) {
          case 'hard':
            skills.hardSkills.push(skillData);
            break;
          case 'soft':
            skills.softSkills.push(skillData);
            break;
          case 'hobby':
            skills.hobbies.push(skillData);
            break;
        }
      });
    }

    // Format birth_date to YYYY-MM-DD if it exists
    if (employeeData.birth_date) {
      const date = new Date(employeeData.birth_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      employeeData.birth_date = `${year}-${month}-${day}`;
    }

    // Format hire_date to YYYY-MM-DD if it exists
    if (employeeData.hire_date) {
      const date = new Date(employeeData.hire_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      employeeData.hire_date = `${year}-${month}-${day}`;
    }

    // Add skills to response
    employeeData.hardSkills = skills.hardSkills;
    employeeData.softSkills = skills.softSkills;
    employeeData.hobbies = skills.hobbies;

    res.json({
      success: true,
      employee: employeeData
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private
const createEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Подготавливаем данные для создания сотрудника
    const employeeData = { ...req.body };
    
    // Если пароль не указан, устанавливаем дефолтный
    if (!employeeData.password) {
      employeeData.password = 'defaultPassword123';
    }
    
    // Очищаем некорректные даты
    if (employeeData.birth_date === 'Invalid date' || 
        employeeData.birth_date === '' || 
        employeeData.birth_date === 'null' ||
        employeeData.birth_date === 'undefined' ||
        (typeof employeeData.birth_date === 'string' && employeeData.birth_date.toLowerCase().includes('invalid'))) {
      employeeData.birth_date = null;
    }
    
    // Проверяем существование департамента
    if (employeeData.department_id) {
      const department = await Department.findByPk(employeeData.department_id);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: `Department with ID ${employeeData.department_id} does not exist`
        });
      }
    }
    
    // Создаем сотрудника без связей сначала
    const employee = await Employee.create(employeeData);

    // Возвращаем созданного сотрудника с нужными связями
    const createdEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'color']
        },
        {
          model: Role,
          as: 'adminRoles',
          attributes: ['id', 'name', 'color', 'icon'],
          through: { attributes: [] }
        },
        {
          model: EmployeeSkill,
          as: 'employeeSkills',
          include: [
            {
              model: Skill,
              as: 'skill',
              attributes: ['id', 'name', 'skill_type', 'color']
            },
            {
              model: SkillLevel,
              as: 'skillLevel',
              attributes: ['id', 'name', 'value']
            }
          ]
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      success: true,
      data: createdEmployee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
const updateEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.update(req.body);

    // Возвращаем обновленного сотрудника с нужными связями
    const updatedEmployee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: Role,
          as: 'adminRoles',
          attributes: ['id', 'name', 'color', 'icon'],
          through: { attributes: [] }
        },
        {
          model: EmployeeSkill,
          as: 'employeeSkills',
          include: [
            {
              model: Skill,
              as: 'skill',
              attributes: ['id', 'name', 'skill_type']
            },
            {
              model: SkillLevel,
              as: 'skillLevel',
              attributes: ['id', 'name', 'value']
            }
          ]
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: Role,
          as: 'adminRoles',
          where: { name: 'Главный администратор' },
          required: false
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Проверяем, является ли сотрудник главным администратором
    const isMainAdmin = employee.adminRoles && employee.adminRoles.length > 0;
    
    if (isMainAdmin) {
      // Проверяем, сколько всего главных администраторов в системе
      const mainAdminCount = await Employee.count({
        include: [
          {
            model: Role,
            as: 'adminRoles',
            where: { name: 'Главный администратор' },
            required: true
          }
        ]
      });

      if (mainAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Невозможно удалить последнего главного администратора'
        });
      }
    }

    await employee.destroy();

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get employee statistics
// @route   GET /api/employees/stats
// @access  Private
const getEmployeeStats = async (req, res) => {
  try {
    const stats = await Employee.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    });

    const departmentStats = await Employee.findAll({
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['name']
        }
      ],
      attributes: [
        'department_id',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['department_id']
    });

    res.json({
      success: true,
      data: {
        status: stats,
        departments: departmentStats
      }
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add skill to employee
// @route   POST /api/employees/:id/skills
// @access  Private
const addEmployeeSkill = async (req, res) => {
  try {
    const { skill_id, skill_level } = req.body;
    const employee_id = req.params.id;

    // Проверяем, что сотрудник существует
    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Проверяем, что навык существует
    const skill = await Skill.findByPk(skill_id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // Создаем или обновляем навык сотрудника
    const [employeeSkill, created] = await EmployeeSkill.findOrCreate({
      where: { employee_id, skill_id },
      defaults: { skill_level: skill_level || 1 }
    });

    if (!created) {
      // Если навык уже существует, обновляем уровень
      await employeeSkill.update({ skill_level: skill_level || employeeSkill.skill_level });
    }

    // Возвращаем обновленного сотрудника с навыками
    const updatedEmployee = await Employee.findByPk(employee_id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: Role,
          as: 'adminRoles',
          attributes: ['id', 'name', 'color', 'icon'],
          through: { attributes: [] }
        },
        {
          model: EmployeeSkill,
          as: 'employeeSkills',
          include: [
            {
              model: Skill,
              as: 'skill',
              attributes: ['id', 'name', 'skill_type'] // исправлено с 'type' на 'skill_type'
            },
            {
              model: SkillLevel,
              as: 'skillLevel',
              attributes: ['id', 'name', 'value']
            }
          ]
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Add employee skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove skill from employee
// @route   DELETE /api/employees/:id/skills/:skill_id
// @access  Private
const removeEmployeeSkill = async (req, res) => {
  try {
    const { id: employee_id, skill_id } = req.params;

    // Проверяем, что сотрудник существует
    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Удаляем навык сотрудника
    await EmployeeSkill.destroy({
      where: { employee_id, skill_id }
    });

    // Возвращаем обновленного сотрудника с навыками
    const updatedEmployee = await Employee.findByPk(employee_id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: Role,
          as: 'adminRoles',
          attributes: ['id', 'name', 'color', 'icon'],
          through: { attributes: [] }
        },
        {
          model: EmployeeSkill,
          as: 'employeeSkills',
          include: [
            {
              model: Skill,
              as: 'skill',
              attributes: ['id', 'name', 'skill_type'] // исправлено с 'type' на 'skill_type'
            },
            {
              model: SkillLevel,
              as: 'skillLevel',
              attributes: ['id', 'name', 'value']
            }
          ]
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Remove employee skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Assign roles to employee
// @route   PUT /api/employees/:id/roles
// @access  Private
const assignEmployeeRoles = async (req, res) => {
  try {
    const { roleIds } = req.body;
    const employeeId = req.params.id;

    // Проверяем, что сотрудник существует
    const employee = await Employee.findByPk(employeeId, {
      include: [
        {
          model: Role,
          as: 'adminRoles',
          where: { name: 'Главный администратор' },
          required: false
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Проверяем, является ли сотрудник главным администратором
    const isMainAdmin = employee.adminRoles && employee.adminRoles.length > 0;
    
    if (isMainAdmin) {
      // Проверяем, пытается ли пользователь снять роль главного администратора
      const mainAdminRole = await Role.findOne({ where: { name: 'Главный администратор' } });
      
      if (mainAdminRole && !roleIds.includes(mainAdminRole.id)) {
        // Проверяем, сколько всего главных администраторов в системе
        const mainAdminCount = await Employee.count({
          include: [
            {
              model: Role,
              as: 'adminRoles',
              where: { name: 'Главный администратор' },
              required: true
            }
          ]
        });

        if (mainAdminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Невозможно снять роль главного администратора у последнего администратора'
          });
        }
      }
    }

    // Получаем текущие роли сотрудника
    const currentRoles = await employee.getAdminRoles();
    const currentRoleIds = currentRoles.map(role => role.id);

    // Удаляем все текущие роли
    await employee.removeAdminRoles(currentRoleIds);

    // Добавляем новые роли
    if (roleIds && roleIds.length > 0) {
      await employee.addAdminRoles(roleIds);
    }

    // Возвращаем обновленного сотрудника
    const updatedEmployee = await Employee.findByPk(employeeId, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: Role,
          as: 'adminRoles',
          attributes: ['id', 'name', 'color', 'icon'],
          through: { attributes: [] }
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Employee roles updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Assign employee roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Bulk assign roles to employees
// @route   PUT /api/employees/bulk-roles
// @access  Private
const assignBulkRoles = async (req, res) => {
  try {
    const { employeeIds, roleIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Employee IDs are required'
      });
    }

    if (!roleIds || !Array.isArray(roleIds)) {
      return res.status(400).json({
        success: false,
        message: 'Role IDs are required'
      });
    }

    // Проверяем, есть ли среди сотрудников главные администраторы
    const employees = await Employee.findAll({
      where: { id: employeeIds },
      include: [
        {
          model: Role,
          as: 'adminRoles',
          where: { name: 'Главный администратор' },
          required: false
        }
      ]
    });

    // Проверяем, пытается ли кто-то снять роль главного администратора
    const mainAdminRole = await Role.findOne({ where: { name: 'Главный администратор' } });
    
    if (mainAdminRole && !roleIds.includes(mainAdminRole.id)) {
      // Проверяем, сколько всего главных администраторов в системе
      const totalMainAdmins = await Employee.count({
        include: [
          {
            model: Role,
            as: 'adminRoles',
            where: { name: 'Главный администратор' },
            required: true
          }
        ]
      });

      // Подсчитываем, сколько главных администраторов среди выбранных сотрудников
      const selectedMainAdmins = employees.filter(emp => 
        emp.adminRoles && emp.adminRoles.length > 0
      ).length;

      // Если пытаемся снять роль у всех главных администраторов
      if (selectedMainAdmins >= totalMainAdmins) {
        return res.status(400).json({
          success: false,
          message: 'Невозможно снять роль главного администратора у всех администраторов'
        });
      }
    }

    // Обновляем роли для каждого сотрудника
    const results = [];
    for (const employeeId of employeeIds) {
      const employee = await Employee.findByPk(employeeId);
      if (employee) {
        // Получаем текущие роли сотрудника
        const currentRoles = await employee.getAdminRoles();
        const currentRoleIds = currentRoles.map(role => role.id);

        // Удаляем все текущие роли
        await employee.removeAdminRoles(currentRoleIds);

        // Добавляем новые роли
        if (roleIds.length > 0) {
          await employee.addAdminRoles(roleIds);
        }

        results.push({
          employeeId,
          success: true
        });
      } else {
        results.push({
          employeeId,
          success: false,
          error: 'Employee not found'
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk role assignment completed',
      data: results
    });
  } catch (error) {
    console.error('Bulk assign roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Routes
router.get('/', authMiddleware, adminMiddleware, getEmployees);
router.get('/stats', authMiddleware, adminMiddleware, getEmployeeStats);
router.get('/:id', authMiddleware, adminMiddleware, getEmployee);
router.post('/', authMiddleware, adminMiddleware, [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('department_id').isInt().withMessage('Valid department ID is required'),
  body('hire_date').isISO8601().withMessage('Valid hire date is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], createEmployee);
router.put('/:id', authMiddleware, adminMiddleware, [
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('position').optional().notEmpty().withMessage('Position cannot be empty'),
  body('department_id').optional().isInt().withMessage('Valid department ID is required'),
  body('hire_date').optional().isISO8601().withMessage('Valid hire date is required')
], updateEmployee);
router.delete('/:id', authMiddleware, adminMiddleware, deleteEmployee);
router.post('/:id/skills', authMiddleware, adminMiddleware, [
  body('skill_id').isInt().withMessage('Valid skill ID is required'),
  body('skill_level').optional().isInt({ min: 1, max: 5 }).withMessage('Level must be between 1 and 5')
], addEmployeeSkill);
router.delete('/:id/skills/:skill_id', authMiddleware, adminMiddleware, removeEmployeeSkill);
router.put('/bulk-roles', authMiddleware, adminMiddleware, [
  body('employeeIds').isArray().withMessage('Employee IDs must be an array'),
  body('roleIds').isArray().withMessage('Role IDs must be an array')
], assignBulkRoles);
router.put('/:id/roles', authMiddleware, adminMiddleware, [
  body('roleIds').isArray().withMessage('Role IDs must be an array')
], assignEmployeeRoles);

module.exports = router; 