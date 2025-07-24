const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { SkillGroup, Skill } = require('../models');

const router = express.Router();

// @desc    Get all skill groups
// @route   GET /api/skill-groups
// @access  Private
const getSkillGroups = async (req, res) => {
  try {
    const skillGroups = await SkillGroup.findAll({
      include: [
        {
          model: Skill,
          as: 'skills',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    // Add skills count to each group
    const groupsWithCounts = skillGroups.map(group => {
      const groupData = group.toJSON();
      groupData.skillsCount = groupData.skills ? groupData.skills.length : 0;
      return groupData;
    });

    res.json({
      success: true,
      skillGroups: groupsWithCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single skill group
// @route   GET /api/skill-groups/:id
// @access  Private
const getSkillGroup = async (req, res) => {
  try {
    const skillGroup = await SkillGroup.findByPk(req.params.id, {
      include: [
        {
          model: Skill,
          as: 'skills',
          attributes: ['id', 'name', 'skill_type']
        }
      ]
    });

    if (!skillGroup) {
      return res.status(404).json({
        success: false,
        message: 'Skill group not found'
      });
    }

    res.json({
      success: true,
      data: skillGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create skill group
// @route   POST /api/skill-groups
// @access  Private
const createSkillGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, description, skill_type, color, icon } = req.body;

    // Check if skill group with same name already exists
    const existingGroup = await SkillGroup.findOne({ where: { name } });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'Skill group with this name already exists'
      });
    }

    const skillGroup = await SkillGroup.create({
      name,
      description,
      skill_type,
      color: color || '#3B82F6',
      icon
    });

    // Fetch the created skill group with skills
    const createdGroup = await SkillGroup.findByPk(skillGroup.id, {
      include: [
        {
          model: Skill,
          as: 'skills',
          attributes: ['id']
        }
      ]
    });

    const groupData = createdGroup.toJSON();
    groupData.skillsCount = groupData.skills ? groupData.skills.length : 0;

    res.status(201).json({
      success: true,
      data: groupData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update skill group
// @route   PUT /api/skill-groups/:id
// @access  Private
const updateSkillGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const skillGroup = await SkillGroup.findByPk(req.params.id);
    if (!skillGroup) {
      return res.status(404).json({
        success: false,
        message: 'Skill group not found'
      });
    }

    const { name, description, skill_type, color, icon } = req.body;

    // Check if skill group with same name already exists (excluding current group)
    if (name && name !== skillGroup.name) {
      const existingGroup = await SkillGroup.findOne({ where: { name } });
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: 'Skill group with this name already exists'
        });
      }
    }

    await skillGroup.update({
      name: name || skillGroup.name,
      description: description !== undefined ? description : skillGroup.description,
      skill_type: skill_type || skillGroup.skill_type,
      color: color || skillGroup.color,
      icon: icon !== undefined ? icon : skillGroup.icon
    });

    // Fetch the updated skill group with skills
    const updatedGroup = await SkillGroup.findByPk(skillGroup.id, {
      include: [
        {
          model: Skill,
          as: 'skills',
          attributes: ['id']
        }
      ]
    });

    const groupData = updatedGroup.toJSON();
    groupData.skillsCount = groupData.skills ? groupData.skills.length : 0;

    res.json({
      success: true,
      data: groupData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete skill group
// @route   DELETE /api/skill-groups/:id
// @access  Private
const deleteSkillGroup = async (req, res) => {
  try {
    const skillGroup = await SkillGroup.findByPk(req.params.id);
    if (!skillGroup) {
      return res.status(404).json({
        success: false,
        message: 'Skill group not found'
      });
    }

    // Check if there are skills in this group
    const skillsInGroup = await Skill.count({
      where: { group_id: req.params.id }
    });

    if (skillsInGroup > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete group that contains skills'
      });
    }

    await skillGroup.destroy();

    res.json({
      success: true,
      message: 'Skill group deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Validation middleware
const validateSkillGroup = [
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
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color')
];

// Routes
router.get('/', authMiddleware, getSkillGroups);
router.get('/:id', authMiddleware, getSkillGroup);
router.post('/', authMiddleware, validateSkillGroup, createSkillGroup);
router.put('/:id', authMiddleware, validateSkillGroup, updateSkillGroup);
router.delete('/:id', authMiddleware, deleteSkillGroup);

module.exports = router; 