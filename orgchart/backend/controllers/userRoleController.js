const { Employee, Role, Department } = require('../models');
const { validationResult } = require('express-validator');
const { Op, fn, col } = require('sequelize');

// @desc    Get all employees with their admin roles
// @route   GET /api/user-roles
// @access  Private
const getUserRoles = async (req, res) => {
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
      roleId,
      sortBy = 'last_name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      where.status = status;
    }

    // Build include options for role filtering
    const include = [
      { 
        model: Role, 
        as: 'adminRoles', 
        attributes: ['id', 'name', 'description', 'color', 'icon'],
        through: { attributes: [] }
      },
      { 
        model: Department, 
        as: 'department', 
        attributes: ['id', 'name'] 
      }
    ];

    // Apply role filtering
    if (roleId) {
      if (roleId === 'assigned') {
        include[0].required = true; // Only employees with roles
      } else if (roleId === 'unassigned') {
        include[0].required = false;
        include[0].where = null;
        // This will be handled by checking if adminRoles array is empty
      } else {
        include[0].where = { id: roleId };
        include[0].required = true;
      }
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: employees } = await Employee.findAndCountAll({
      where,
      include,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit: parseInt(limit),
      distinct: true
    });

    // Filter out employees without roles if roleId === 'unassigned'
    let filteredEmployees = employees;
    if (roleId === 'unassigned') {
      filteredEmployees = employees.filter(emp => !emp.adminRoles || emp.adminRoles.length === 0);
    }

    res.json({
      success: true,
      data: filteredEmployees,
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

// @desc    Get user role statistics
// @route   GET /api/user-roles/stats
// @access  Private
const getUserRoleStats = async (req, res) => {
  try {
    // Get overall stats
    const total = await Employee.count();
    
    // Count employees with roles using the many-to-many relationship
    const employeesWithRoles = await Employee.findAll({
      include: [
        { 
          model: Role, 
          as: 'adminRoles', 
          attributes: ['id', 'name', 'description', 'color', 'icon'],
          through: { attributes: [] }
        }
      ]
    });
    
    const withRoles = employeesWithRoles.filter(emp => emp.adminRoles && emp.adminRoles.length > 0).length;
    const withoutRoles = total - withRoles;

    // Get stats by role
    const roleStats = employeesWithRoles
      .filter(emp => emp.adminRoles && emp.adminRoles.length > 0)
      .map(emp => ({
        employeeId: emp.id,
        employeeName: `${emp.last_name} ${emp.first_name}`,
        roleName: emp.adminRoles[0]?.name || 'No role assigned',
        roleColor: emp.adminRoles[0]?.color || '#6B7280',
        roleCount: emp.adminRoles.length
      }));

    res.json({
      success: true,
      data: {
        overall: { total, withRoles, withoutRoles },
        byRole: roleStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Assign role to employee
// @route   PUT /api/user-roles/:employeeId
// @access  Private
const assignRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { employeeId } = req.params;
    const { roleId } = req.body;

    const employee = await Employee.findByPk(employeeId, {
      include: [
        { 
          model: Department, 
          as: 'department', 
          attributes: ['id', 'name', 'color'] 
        },
        { 
          model: Role, 
          as: 'adminRoles', 
          attributes: ['id', 'name', 'description', 'color', 'icon'],
          through: { attributes: [] }
        },
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      // Clear existing roles and assign new one
      await employee.setAdminRoles([roleId]);
    } else {
      // Remove all roles
      await employee.setAdminRoles([]);
    }

    const updatedEmployee = await Employee.findByPk(employeeId, {
      include: [
        { 
          model: Role, 
          as: 'adminRoles', 
          attributes: ['id', 'name', 'description', 'color', 'icon'],
          through: { attributes: [] }
        },
        { 
          model: Department, 
          as: 'department', 
          attributes: ['id', 'name'] 
        }
      ]
    });

    res.json({
      success: true,
      data: updatedEmployee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Bulk assign roles to employees
// @route   PUT /api/user-roles/bulk
// @access  Private
const bulkAssignRoles = async (req, res) => {
  try {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { assignments } = req.body;

    if (!Array.isArray(assignments)) {
      return res.status(400).json({
        success: false,
        message: 'Assignments must be an array'
      });
    }

    const results = [];
    const assignmentErrors = [];

    for (const assignment of assignments) {
      try {
        const { employeeId, roleIds } = assignment;

        const employee = await Employee.findByPk(employeeId);
        if (!employee) {
          assignmentErrors.push({ employeeId, error: 'Employee not found' });
          continue;
        }

          if (roleIds && roleIds.length > 0) {
            // Проверяем, что все роли существуют
            const roles = await Role.findAll({ where: { id: roleIds } });
            if (roles.length !== roleIds.length) {
              assignmentErrors.push({ employeeId, roleIds, error: 'Some roles not found' });
              continue;
            }
            await employee.setAdminRoles(roleIds);
          } else {
            await employee.setAdminRoles([]);
          }

          results.push({ employeeId, success: true });
        } catch (error) {
          assignmentErrors.push({ employeeId: assignment.employeeId, error: error.message });
        }
      }

    res.json({
      success: true,
      data: {
        results,
        errors: assignmentErrors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get available roles for assignment
// @route   GET /api/user-roles/available-roles
// @access  Private
const getAvailableRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'description', 'color', 'icon'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Export user roles data
// @route   GET /api/user-roles/export
// @access  Private
const exportUserRoles = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Role, as: 'adminRoles', attributes: ['id', 'name', 'description'] },
      ],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    const exportData = employees.map(employee => ({
      id: employee.id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      position: employee.position,
      department: employee.department?.name || 'N/A',
      role: employee.adminRoles?.map(role => role.name).join(', ') || 'No role assigned',
      status: employee.status
    }));

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getUserRoles,
  getUserRoleStats,
  assignRole,
  bulkAssignRoles,
  getAvailableRoles,
  exportUserRoles
}; 