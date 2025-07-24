const { Role, Employee, Department } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Функция для проверки необходимости конвертации прав
function needsPermissionConversion(permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }
  
  // Проверяем, является ли это старым форматом (массив строк)
  return typeof permissions[0] === 'string';
}

// Функция для преобразования старых прав в новые
function convertOldPermissionsToNew(oldPermissions) {
  if (!Array.isArray(oldPermissions)) {
    return [];
  }

  if (oldPermissions.includes('all')) {
    // Для роли с полными правами создаем все права
    const permissionModules = [
      'employees', 'departments', 'skills', 'skillGroups', 
      'products', 'vacations', 'roles', 'system', 'analytics', 'reports'
    ];
    const permissionActions = [
      'create', 'read', 'update', 'delete', 'manage', 'export', 
      'import', 'approve', 'assign', 'configure', 'backup', 'restore'
    ];
    
    return permissionModules.map(module => ({
      module: module,
      actions: permissionActions
    }));
  }

  // Сопоставление старых названий с новыми
  const oldToNewMapping = {
    'users': 'employees',
    'settings': 'system'
  };
  
  const permissions = [];
  const actions = [];
  
  // Сначала разделяем модули и действия
  oldPermissions.forEach(oldPerm => {
    const newModule = oldToNewMapping[oldPerm];
    if (newModule) {
      // Это модуль
      permissions.push({
        module: newModule,
        actions: ['read', 'update'] // Базовые права для старых ролей
      });
    } else if (['read', 'update', 'create', 'delete', 'manage'].includes(oldPerm)) {
      // Это действие
      actions.push(oldPerm);
    } else if (oldPerm === 'edit') {
      // Специальная обработка для 'edit'
      actions.push('update');
    } else {
      // Если это не модуль и не действие, добавляем как действие
      actions.push(oldPerm);
    }
  });
  
  // Если есть только действия без модулей, применяем их ко всем модулям
  if (actions.length > 0 && permissions.length === 0) {
    const allModules = [
      'employees', 'departments', 'skills', 'skillGroups', 
      'products', 'vacations', 'roles', 'system', 'analytics', 'reports'
    ];
    
    allModules.forEach(module => {
      permissions.push({
        module: module,
        actions: [...actions]
      });
    });
  } else if (actions.length > 0) {
    // Если есть и модули, и действия, добавляем действия ко всем модулям
    permissions.forEach(perm => {
      actions.forEach(action => {
        if (!perm.actions.includes(action)) {
          perm.actions.push(action);
        }
      });
    });
  }
  
  return permissions;
}

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private
const getRoles = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const where = {};
    
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    
    if (status) {
      where.status = status;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: roles } = await Role.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit: parseInt(limit),
      include: [
        {
          model: Employee,
          as: 'employees',
          attributes: ['id'],
          where: { status: 'active' }
        }
      ]
    });

    // Конвертируем старые права в новые формат для каждой роли только при необходимости
    const processedRoles = roles.map(role => {
      const roleData = role.toJSON();
      
      // Конвертируем права только если они в старом формате
      if (roleData.permissions && needsPermissionConversion(roleData.permissions)) {
        roleData.permissions = convertOldPermissionsToNew(roleData.permissions);
      }
      
      // Добавляем количество сотрудников
      roleData.employee_count = roleData.employees ? roleData.employees.length : 0;
      
      // Удаляем массив сотрудников, оставляем только количество
      delete roleData.employees;
      
      return roleData;
    });

    res.json({
      success: true,
      data: processedRoles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private
const getRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employees',
          attributes: ['id', 'first_name', 'last_name', 'email', 'status'],
          include: [
            { 
              model: Department, 
              as: 'department', 
              attributes: ['name'] 
            }
          ]
        }
      ]
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Конвертируем старые права в новые формат только при необходимости
    const roleData = role.toJSON();
    
    // Конвертируем права только если они в старом формате
    if (roleData.permissions && needsPermissionConversion(roleData.permissions)) {
      roleData.permissions = convertOldPermissionsToNew(roleData.permissions);
    }
    
    // Добавляем количество сотрудников
    roleData.employee_count = roleData.employees ? roleData.employees.length : 0;

    res.json({
      success: true,
      data: roleData
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create role
// @route   POST /api/roles
// @access  Private
const createRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Валидация и обработка прав
    if (req.body.permissions) {
      // Проверяем структуру прав
      if (!Array.isArray(req.body.permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions must be an array'
        });
      }
      
      // Валидируем каждое право
      for (const permission of req.body.permissions) {
        if (!permission.module || !Array.isArray(permission.actions)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid permission structure'
          });
        }
        
        // Проверяем допустимые модули
        const validModules = ['employees', 'departments', 'skills', 'skillGroups', 'products', 'vacations', 'roles', 'system', 'analytics', 'reports'];
        if (!validModules.includes(permission.module)) {
          return res.status(400).json({
            success: false,
            message: `Invalid module: ${permission.module}`
          });
        }
        
        // Проверяем допустимые действия
        const validActions = ['create', 'read', 'update', 'delete', 'manage', 'export', 'import', 'approve', 'assign', 'configure', 'backup', 'restore'];
        for (const action of permission.actions) {
          if (!validActions.includes(action)) {
            return res.status(400).json({
              success: false,
              message: `Invalid action: ${action}`
            });
          }
        }
      }
    }

    const role = await Role.create(req.body);

    // Получаем созданную роль с количеством сотрудников
    const createdRole = await Role.findByPk(role.id, {
      include: [
        {
          model: Employee,
          as: 'employees',
          attributes: ['id'],
          where: { status: 'active' }
        }
      ]
    });

    const roleData = createdRole.toJSON();
    
    // Конвертируем права только если они в старом формате
    if (roleData.permissions && needsPermissionConversion(roleData.permissions)) {
      roleData.permissions = convertOldPermissionsToNew(roleData.permissions);
    }
    
    // Добавляем количество сотрудников
    roleData.employee_count = roleData.employees ? roleData.employees.length : 0;
    
    // Удаляем массив сотрудников, оставляем только количество
    delete roleData.employees;

    res.status(201).json({
      success: true,
      data: roleData
    });
  } catch (error) {
    console.error('Create role error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private
const updateRole = async (req, res) => {
  try {


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Валидация и обработка прав
    if (req.body.permissions) {
      // Проверяем структуру прав
      if (!Array.isArray(req.body.permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions must be an array'
        });
      }
      
      // Валидируем каждое право
      for (const permission of req.body.permissions) {
        if (!permission.module || !Array.isArray(permission.actions)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid permission structure'
          });
        }
        
        // Проверяем допустимые модули
        const validModules = ['employees', 'departments', 'skills', 'skillGroups', 'products', 'vacations', 'roles', 'system', 'analytics', 'reports'];
        if (!validModules.includes(permission.module)) {
          return res.status(400).json({
            success: false,
            message: `Invalid module: ${permission.module}`
          });
        }
        
        // Проверяем допустимые действия
        const validActions = ['create', 'read', 'update', 'delete', 'manage', 'export', 'import', 'approve', 'assign', 'configure', 'backup', 'restore'];
        for (const action of permission.actions) {
          if (!validActions.includes(action)) {
            return res.status(400).json({
              success: false,
              message: `Invalid action: ${action}`
            });
          }
        }
      }
    }

    // Проверяем, является ли роль главным администратором
    if (role.name === 'Главный администратор') {
      return res.status(400).json({
        success: false,
        message: 'Нельзя изменять роль главного администратора'
      });
    }

    // Проверяем, является ли текущий пользователь главным администратором
    const currentUser = req.employee;
    
    const isMainAdmin = currentUser && currentUser.adminRoles && 
      currentUser.adminRoles.some(role => role.name === 'Главный администратор');

    // Для системных ролей
    if (role.is_system) {
      // Только главный администратор может редактировать системные роли
      if (!isMainAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Только главный администратор может изменять системные роли'
        });
      }

      // Для системных ролей разрешаем изменять только определенные поля
      const allowedFields = ['name', 'description', 'color', 'icon', 'visible_sections', 'visible_views', 'permissions', 'changedFields'];
      const updateData = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      // Не разрешаем изменять статус для системных ролей
      const forbiddenFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
      if (forbiddenFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Для системных ролей можно изменять только название, описание, цвет, иконку, настройки видимости и права'
        });
      }

      await role.update(updateData);
    } else {
      // Для несистемных ролей разрешаем все изменения
      await role.update(req.body);
    }

    // Получаем обновленную роль с количеством сотрудников
    const updatedRole = await Role.findByPk(role.id, {
      include: [
        {
          model: Employee,
          as: 'employees',
          attributes: ['id'],
          where: { status: 'active' }
        }
      ]
    });

    const roleData = updatedRole.toJSON();
    
    // Конвертируем права только если они в старом формате
    if (roleData.permissions && needsPermissionConversion(roleData.permissions)) {
      roleData.permissions = convertOldPermissionsToNew(roleData.permissions);
    }
    
    // Добавляем количество сотрудников
    roleData.employee_count = roleData.employees ? roleData.employees.length : 0;
    
    // Удаляем массив сотрудников, оставляем только количество
    delete roleData.employees;

    res.json({
      success: true,
      data: roleData
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Проверяем, является ли роль главным администратором
    if (role.name === 'Главный администратор') {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить роль главного администратора'
      });
    }

    // Проверяем, является ли текущий пользователь главным администратором
    const currentUser = req.employee;
    const isMainAdmin = currentUser && currentUser.adminRoles && 
      currentUser.adminRoles.some(role => role.name === 'Главный администратор');

    // Для системных ролей
    if (role.is_system) {
      // Только главный администратор может удалять системные роли
      if (!isMainAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Только главный администратор может удалять системные роли'
        });
      }
    }

    // Проверяем, есть ли сотрудники с этой ролью
    const employeeCount = await Employee.count({
      include: [
        {
          model: Role,
          as: 'adminRoles',
          where: { id: role.id },
          required: true
        }
      ]
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${employeeCount} employee(s) have this role.`
      });
    }

    await role.destroy();

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get role permissions
// @route   GET /api/roles/:id/permissions
// @access  Private
const getRolePermissions = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: {
        roleId: role.id,
        permissions: role.permissions
      }
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update role permissions
// @route   PUT /api/roles/:id/permissions
// @access  Private
const updateRolePermissions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Проверяем, является ли роль главным администратором
    if (role.name === 'Главный администратор') {
      return res.status(400).json({
        success: false,
        message: 'Нельзя изменять права роли главного администратора'
      });
    }

    // Разрешаем главному администратору редактировать системные роли, кроме своей
    // Проверяем, является ли текущий пользователь главным администратором
    const currentUser = req.employee;
    if (role.is_system && (!currentUser || !currentUser.is_main_admin)) {
      return res.status(400).json({
        success: false,
        message: 'Только главный администратор может изменять права системных ролей'
      });
    }

    const { permissions } = req.body;

    await role.update({ permissions });

    res.json({
      success: true,
      message: 'Role permissions updated successfully',
      data: {
        roleId: role.id,
        permissions: role.permissions
      }
    });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get role statistics
// @route   GET /api/roles/stats
// @access  Private
const getRoleStats = async (req, res) => {
  try {
    const { fn, col, literal } = require('sequelize');
    
    // Получаем статистику одним запросом с агрегацией
    const stats = await Role.findAll({
      attributes: [
        'id',
        'name',
        'status',
        'is_system',
        'employee_count',
        'created_at',
        [fn('COUNT', col('employees.id')), 'actual_employee_count']
      ],
      include: [
        {
          model: Employee,
          as: 'employees',
          attributes: [],
          required: false
        }
      ],
      group: ['Role.id', 'Role.name', 'Role.status', 'Role.is_system', 'Role.employee_count', 'Role.created_at'],
      order: [['employee_count', 'DESC']]
    });

    // Вычисляем общую статистику
    const totalRoles = stats.length;
    const activeRoles = stats.filter(role => role.status === 'active').length;
    const systemRoles = stats.filter(role => role.is_system).length;
    const totalEmployees = stats.reduce((sum, role) => sum + parseInt(role.employee_count || 0), 0);

    res.json({
      success: true,
      data: {
        totalRoles,
        activeRoles,
        systemRoles,
        totalEmployees,
        roles: stats.map(role => role.toJSON())
      }
    });
  } catch (error) {
    console.error('Get role stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get role visibility settings
// @route   GET /api/roles/:id/visibility
// @access  Private
const getRoleVisibility = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: {
        roleId: role.id,
        visibleSections: role.visible_sections || [],
        visibleViews: role.visible_views || []
      }
    });
  } catch (error) {
    console.error('Get role visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update role visibility settings
// @route   PUT /api/roles/:id/visibility
// @access  Private
const updateRoleVisibility = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Проверяем, является ли роль главным администратором
    if (role.name === 'Главный администратор') {
      return res.status(400).json({
        success: false,
        message: 'Нельзя изменять настройки видимости роли главного администратора'
      });
    }

    // Разрешаем главному администратору редактировать видимость системных ролей, кроме своей
    // Проверяем, является ли текущий пользователь главным администратором
    const currentUser = req.employee;
    if (role.is_system && (!currentUser || !currentUser.is_main_admin)) {
      return res.status(400).json({
        success: false,
        message: 'Только главный администратор может изменять настройки видимости системных ролей'
      });
    }

    const { visibleSections, visibleViews } = req.body;

    await role.update({ 
      visible_sections: visibleSections || [],
      visible_views: visibleViews || []
    });

    res.json({
      success: true,
      message: 'Role visibility updated successfully',
      data: {
        roleId: role.id,
        visibleSections: role.visible_sections,
        visibleViews: role.visible_views
      }
    });
  } catch (error) {
    console.error('Update role visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get available sections and views
// @route   GET /api/roles/visibility/options
// @access  Private
const getVisibilityOptions = async (req, res) => {
  try {
    const sections = [
      { id: 'dashboard', label: 'Главная', icon: 'home' },
      { id: 'structure', label: 'Орг. схема', icon: 'users' },
      { id: 'products', label: 'Продукты', icon: 'package' },
      { id: 'competencies', label: 'Компетенции', icon: 'award' },
      { id: 'vacations', label: 'Отпуска', icon: 'calendar' },
      { id: 'profile', label: 'Профиль', icon: 'user' },
      { id: 'admin', label: 'Администрирование', icon: 'settings' }
    ];

    const views = {
      dashboard: [
        { id: 'dashboard', label: 'Привет!', icon: 'home' },
        { id: 'about', label: 'О нас', icon: 'users' },
        { id: 'timeline', label: 'Что происходит?', icon: 'clock' }
      ],
      products: [
        { id: 'cards', label: 'Карточки', icon: 'layout-grid' },
        { id: 'landscape', label: 'Ландшафт', icon: 'map' },
        { id: 'atlas', label: 'Атлас', icon: 'building-2' }
      ],
      structure: [
        { id: 'tree', label: 'Дерево', icon: 'git-branch' },
        { id: 'grid', label: 'Сетка', icon: 'grid' },
        { id: 'list', label: 'Список', icon: 'list' }
      ],
      competencies: [
        { id: 'skills', label: 'Навыки', icon: 'file-text' },
        { id: 'matrix', label: 'Матрица', icon: 'bar-chart-3' },
        { id: 'radar', label: 'Радар', icon: 'activity' }
      ],
      admin: [
        { id: 'employees', label: 'Сотрудники', icon: 'users' },
        { id: 'departments', label: 'Отделы', icon: 'building' },
        { id: 'skills', label: 'Навыки', icon: 'award' },
        { id: 'skillGroups', label: 'Группы навыков', icon: 'bar-chart-3' },
        { id: 'products', label: 'Продукты', icon: 'package' },
        { id: 'vacations', label: 'Отпуска', icon: 'calendar' },
        { id: 'roles', label: 'Роли и права', icon: 'shield' },
        { id: 'userRoles', label: 'Назначение ролей', icon: 'user-check' }
      ]
    };

    res.json({
      success: true,
      data: {
        sections,
        views
      }
    });
  } catch (error) {
    console.error('Get visibility options error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  getRoleStats,
  getRoleVisibility,
  updateRoleVisibility,
  getVisibilityOptions
}; 