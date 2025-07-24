const express = require('express');
const { body, query } = require('express-validator');
const {
  getUserRoles,
  getUserRoleStats,
  assignRole,
  bulkAssignRoles,
  getAvailableRoles,
  exportUserRoles
} = require('../controllers/userRoleController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation rules
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
    .isIn(['lastName', 'firstName', 'email', 'department', 'adminRoles'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const assignRoleValidation = [
  body('roleId')
    .optional()
    .isMongoId()
    .withMessage('Role ID must be a valid MongoDB ID')
];

const bulkAssignValidation = [
  body('assignments')
    .isArray()
    .withMessage('Assignments must be an array'),
  body('assignments.*.employeeId')
    .isInt()
    .withMessage('Employee ID must be a valid integer'),
  body('assignments.*.roleIds')
    .optional()
    .isArray()
    .withMessage('Role IDs must be an array')
];

// Routes
router.get('/', queryValidation, getUserRoles);
router.get('/stats', getUserRoleStats);
router.get('/available-roles', getAvailableRoles);
router.get('/export', exportUserRoles);
router.put('/bulk', authMiddleware, adminMiddleware, bulkAssignValidation, bulkAssignRoles);
router.put('/:employeeId', adminMiddleware, assignRoleValidation, assignRole);

module.exports = router; 