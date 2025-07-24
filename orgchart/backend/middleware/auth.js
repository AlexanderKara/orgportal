const jwt = require('jsonwebtoken');
const { Employee } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const employee = await Employee.findByPk(decoded.id, {
      include: [{
        model: require('../models').Role,
        as: 'adminRoles',
        through: { attributes: [] },
        attributes: ['id', 'name', 'color', 'icon', 'permissions', 'visible_sections']
      }]
    });
    
    if (!employee) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    if (employee.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active.' });
    }
    
    // Remove password from employee object
    const { password, ...employeeWithoutPassword } = employee.toJSON();
    req.employee = employeeWithoutPassword;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.employee) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // Проверяем, есть ли уже роли в req.employee (из authMiddleware)
    if (req.employee.adminRoles && req.employee.adminRoles.length > 0) {
      // Роли уже загружены в authMiddleware, проверяем их
      const hasAdminRole = req.employee.adminRoles.some(role => 
        role.name === 'Главный администратор' || 
        role.name === 'Администратор' ||
        role.name === 'Менеджер'
      );
      
      if (!hasAdminRole) {
        return res.status(403).json({ message: 'Admin access required.' });
      }
      
      next();
    } else {
      // Если роли не загружены (например, если authMiddleware не включал их), загружаем отдельно
      const { Employee, Role } = require('../models');
      const employeeWithRoles = await Employee.findByPk(req.employee.id, {
        include: [{
          model: Role,
          as: 'adminRoles',
          through: { attributes: [] }
        }]
      });
      
      if (!employeeWithRoles || !employeeWithRoles.adminRoles || employeeWithRoles.adminRoles.length === 0) {
        return res.status(403).json({ message: 'Admin access required.' });
      }
      
      const hasAdminRole = employeeWithRoles.adminRoles.some(role => 
        role.name === 'Главный администратор' || 
        role.name === 'Администратор' ||
        role.name === 'Менеджер'
      );
      
      if (!hasAdminRole) {
        return res.status(403).json({ message: 'Admin access required.' });
      }
      
      // Обновляем req.employee с ролями
      req.employee = employeeWithRoles.toJSON();
      delete req.employee.password;
      
      next();
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const managerMiddleware = async (req, res, next) => {
  try {
    if (!req.employee) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // Загружаем роли сотрудника из базы данных
    const { Employee, Role } = require('../models');
    const employeeWithRoles = await Employee.findByPk(req.employee.id, {
      include: [{
        model: Role,
        as: 'adminRoles',
        through: { attributes: [] }
      }]
    });
    
    if (!employeeWithRoles || !employeeWithRoles.adminRoles || employeeWithRoles.adminRoles.length === 0) {
      return res.status(403).json({ message: 'Manager or admin access required.' });
    }
    
    // Проверяем, есть ли у сотрудника роль менеджера или администратора
    const hasManagerRole = employeeWithRoles.adminRoles.some(role => 
      role.name === 'Главный администратор' || 
      role.name === 'Администратор' ||
      role.name === 'Менеджер'
    );
    
    if (!hasManagerRole) {
      return res.status(403).json({ message: 'Manager or admin access required.' });
    }
    
    // Обновляем req.employee с ролями
    req.employee = employeeWithRoles.toJSON();
    delete req.employee.password;
    
    next();
  } catch (error) {
    console.error('Manager middleware error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { authMiddleware, adminMiddleware }; 