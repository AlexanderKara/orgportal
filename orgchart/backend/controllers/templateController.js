const { Template } = require('../models');

// Получить все шаблоны
const getTemplates = async (req, res) => {
  try {
    const templates = await Template.findAll({
      where: { status: { [require('sequelize').Op.ne]: 'deleted' } },
      order: [['createdAt', 'DESC']]
    });

    res.json(templates);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить шаблон по ID
const getTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.findByPk(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создать новый шаблон
const createTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    const template = await Template.create(templateData);
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить шаблон
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const template = await Template.findByPk(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await template.update(updateData);
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удалить шаблон
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.findByPk(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await template.destroy();
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить активные шаблоны
const getActiveTemplates = async (req, res) => {
  try {
    const templates = await Template.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });

    res.json(templates);
  } catch (error) {
    console.error('Error getting active templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить счетчик использования шаблона
const updateTemplateUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.findByPk(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await template.update({
      usageCount: template.usageCount + 1,
      lastUsed: new Date()
    });

    res.json(template);
  } catch (error) {
    console.error('Error updating template usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getActiveTemplates,
  updateTemplateUsage
}; 