const { Notification, Template } = require('../models');

// Получить все уведомления
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { status: { [require('sequelize').Op.ne]: 'deleted' } },
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить уведомление по ID
const getNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id, {
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name', 'content']
        }
      ]
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error getting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создать новое уведомление
const createNotification = async (req, res) => {
  try {
    const notificationData = req.body;
    
    // Проверяем существование шаблона
    const template = await Template.findByPk(notificationData.templateId);
    if (!template) {
      return res.status(400).json({ error: 'Template not found' });
    }

    const notification = await Notification.create(notificationData);
    
    // Возвращаем созданное уведомление с шаблоном
    const createdNotification = await Notification.findByPk(notification.id, {
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json(createdNotification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить уведомление
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Если обновляется templateId, проверяем существование шаблона
    if (updateData.templateId) {
      const template = await Template.findByPk(updateData.templateId);
      if (!template) {
        return res.status(400).json({ error: 'Template not found' });
      }
    }

    await notification.update(updateData);
    
    // Возвращаем обновленное уведомление с шаблоном
    const updatedNotification = await Notification.findByPk(id, {
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удалить уведомление
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.destroy();
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить активные уведомления для отправки
const getActiveNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        isActive: true,
        status: 'active'
      },
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name', 'content']
        }
      ]
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error getting active notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  getActiveNotifications
}; 