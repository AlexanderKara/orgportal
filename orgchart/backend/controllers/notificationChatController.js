const { NotificationChat } = require('../models');

// Получить все чаты/группы
const getNotificationChats = async (req, res) => {
  try {
    
    const chats = await NotificationChat.findAll({
      where: { status: { [require('sequelize').Op.ne]: 'deleted' } },
      order: [['name', 'ASC']]
    });

    res.json(chats);
  } catch (error) {
    console.error('Error getting notification chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить чат/группу по ID
const getNotificationChat = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await NotificationChat.findByPk(id);

    if (!chat) {
      return res.status(404).json({ error: 'Notification chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error getting notification chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создать новый чат/группу
const createNotificationChat = async (req, res) => {
  try {
    const chatData = req.body;
    
    // Проверяем уникальность chatId
    const existingChat = await NotificationChat.findOne({
      where: { chatId: chatData.chatId }
    });
    
    if (existingChat) {
      return res.status(400).json({ error: 'Chat with this ID already exists' });
    }

    const chat = await NotificationChat.create(chatData);
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating notification chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить чат/группу
const updateNotificationChat = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const chat = await NotificationChat.findByPk(id);
    if (!chat) {
      return res.status(404).json({ error: 'Notification chat not found' });
    }

    // Если обновляется chatId, проверяем уникальность
    if (updateData.chatId && updateData.chatId !== chat.chatId) {
      const existingChat = await NotificationChat.findOne({
        where: { chatId: updateData.chatId }
      });
      
      if (existingChat) {
        return res.status(400).json({ error: 'Chat with this ID already exists' });
      }
    }

    await chat.update(updateData);
    res.json(chat);
  } catch (error) {
    console.error('Error updating notification chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удалить чат/группу
const deleteNotificationChat = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await NotificationChat.findByPk(id);

    if (!chat) {
      return res.status(404).json({ error: 'Notification chat not found' });
    }

    await chat.destroy();
    res.json({ message: 'Notification chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить активные чаты/группы
const getActiveNotificationChats = async (req, res) => {
  try {
    const chats = await NotificationChat.findAll({
      where: {
        isActive: true,
        status: 'active'
      },
      order: [['name', 'ASC']]
    });

    res.json(chats);
  } catch (error) {
    console.error('Error getting active notification chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить активность чата/группы
const updateChatActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await NotificationChat.findByPk(id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Notification chat not found' });
    }

    await chat.update({
      lastActivity: new Date()
    });

    res.json(chat);
  } catch (error) {
    console.error('Error updating chat activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить чат/группу по chatId
const getNotificationChatByChatId = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await NotificationChat.findOne({
      where: { chatId }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Notification chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error getting notification chat by chatId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getNotificationChats,
  getNotificationChat,
  createNotificationChat,
  updateNotificationChat,
  deleteNotificationChat,
  getActiveNotificationChats,
  updateChatActivity,
  getNotificationChatByChatId
}; 