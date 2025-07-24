const express = require('express');
const { body, query } = require('express-validator');
const {
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
} = require('../controllers/roleController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const roleValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'archived'])
    .withMessage('Status must be active, inactive, or archived'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{3,6}$/i)
    .withMessage('Color must be a valid hex color'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('visible_sections')
    .optional()
    .isArray()
    .withMessage('Visible sections must be an array'),
  body('visible_views')
    .optional()
    .isArray()
    .withMessage('Visible views must be an array'),
  body('icon')
    .optional()
    .isString()
    .withMessage('Icon must be a string'),
  body('changedFields')
    .optional()
    .isArray()
    .withMessage('Changed fields must be an array'),
  body('changedFields.*')
    .optional()
    .isString()
    .withMessage('Changed field must be a string')
];

const permissionValidation = [
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array'),
  body('permissions.*.module')
    .isIn(['employees', 'departments', 'skills', 'skillGroups', 'products', 'vacations', 'roles', 'system', 'analytics', 'reports'])
    .withMessage('Invalid module'),
  body('permissions.*.actions')
    .isArray()
    .withMessage('Actions must be an array'),
  body('permissions.*.actions.*')
    .isIn(['create', 'read', 'update', 'delete', 'manage', 'export', 'import', 'approve', 'assign', 'configure', 'backup', 'restore'])
    .withMessage('Invalid action')
];

const visibilityValidation = [
  body('visibleSections')
    .optional()
    .isArray()
    .withMessage('Visible sections must be an array'),
  body('visibleViews')
    .optional()
    .isArray()
    .withMessage('Visible views must be an array')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['name', 'status', 'employeeCount', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Routes
router.get('/', authMiddleware, adminMiddleware, getRoles);
router.get('/options/visibility', authMiddleware, adminMiddleware, getVisibilityOptions);
router.get('/stats', authMiddleware, getRoleStats);
router.get('/:id', authMiddleware, adminMiddleware, getRole);
router.get('/:id/permissions', authMiddleware, adminMiddleware, getRolePermissions);
router.post('/', authMiddleware, adminMiddleware, roleValidation, createRole);
router.put('/:id', authMiddleware, adminMiddleware, roleValidation, updateRole);
router.put('/:id/permissions', authMiddleware, adminMiddleware, permissionValidation, updateRolePermissions);
router.delete('/:id', authMiddleware, adminMiddleware, deleteRole);

// Visibility routes
router.get('/:id/visibility', authMiddleware, adminMiddleware, getRoleVisibility);
router.put('/:id/visibility', authMiddleware, adminMiddleware, visibilityValidation, updateRoleVisibility);

// Stats route
router.get('/:id/stats', authMiddleware, adminMiddleware, getRoleStats);

module.exports = router; 