const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { Skill, SkillGroup } = require('../models');

const router = express.Router();

// @desc    Get all skills
// @route   GET /api/skills
// @access  Private
const getSkills = async (req, res) => {
  try {
    const skills = await Skill.findAll({
      include: [
        {
          model: SkillGroup,
          as: 'skillGroup',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      skills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single skill
// @route   GET /api/skills/:id
// @access  Private
const getSkill = async (req, res) => {
  try {
    const skill = await Skill.findByPk(req.params.id, {
      include: [
        {
          model: SkillGroup,
          as: 'skillGroup',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    res.json({
      success: true,
      data: skill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create skill
// @route   POST /api/skills
// @access  Private
const createSkill = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, description, skill_type, group_id, icon, color } = req.body;

    // Check if skill with same name already exists
    const existingSkill = await Skill.findOne({ where: { name } });
    if (existingSkill) {
      return res.status(400).json({
        success: false,
        message: 'Skill with this name already exists'
      });
    }

    // If group_id is provided, verify it exists
    if (group_id) {
      const skillGroup = await SkillGroup.findByPk(group_id);
      if (!skillGroup) {
        return res.status(400).json({
          success: false,
          message: 'Skill group not found'
        });
      }
    }

    const skill = await Skill.create({
      name,
      description,
      skill_type,
      group_id,
      icon,
      color
    });

    // Fetch the created skill with skill group
    const createdSkill = await Skill.findByPk(skill.id, {
      include: [
        {
          model: SkillGroup,
          as: 'skillGroup',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdSkill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update skill
// @route   PUT /api/skills/:id
// @access  Private
const updateSkill = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const skill = await Skill.findByPk(req.params.id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    const { name, description, skill_type, group_id, icon, color } = req.body;

    // Check if skill with same name already exists (excluding current skill)
    if (name && name !== skill.name) {
      const existingSkill = await Skill.findOne({ where: { name } });
      if (existingSkill) {
        return res.status(400).json({
          success: false,
          message: 'Skill with this name already exists'
        });
      }
    }

    // If group_id is provided, verify it exists
    if (group_id) {
      const skillGroup = await SkillGroup.findByPk(group_id);
      if (!skillGroup) {
        return res.status(400).json({
          success: false,
          message: 'Skill group not found'
        });
      }
    }

    await skill.update({
      name: name || skill.name,
      description: description !== undefined ? description : skill.description,
      skill_type: skill_type || skill.skill_type,
      group_id: group_id !== undefined ? group_id : skill.group_id,
      icon: icon !== undefined ? icon : skill.icon,
      color: color || skill.color
    });

    // Fetch the updated skill with skill group
    const updatedSkill = await Skill.findByPk(skill.id, {
      include: [
        {
          model: SkillGroup,
          as: 'skillGroup',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedSkill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete skill
// @route   DELETE /api/skills/:id
// @access  Private
const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findByPk(req.params.id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    await skill.destroy();

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Validation middleware
const validateSkill = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('skill_type')
    .optional()
    .isIn(['hard', 'soft', 'hobby'])
    .withMessage('Skill type must be hard, soft, or hobby'),
  body('group_id')
    .optional()
    .isInt()
    .withMessage('Skill group ID must be an integer'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color')
];

// Routes
router.get('/', authMiddleware, adminMiddleware, getSkills);
router.get('/:id', authMiddleware, adminMiddleware, getSkill);
router.post('/', authMiddleware, adminMiddleware, validateSkill, createSkill);
router.put('/:id', authMiddleware, adminMiddleware, validateSkill, updateSkill);
router.delete('/:id', authMiddleware, adminMiddleware, deleteSkill);

module.exports = router; 