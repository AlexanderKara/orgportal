const { MeetingRoom, MeetingRoomBooking, Employee, Department } = require('../models');
const { Op } = require('sequelize');

// Получить все переговорные комнаты (для пользователей)
const getAllMeetingRooms = async (req, res) => {
  try {
    const rooms = await MeetingRoom.findAll({
      where: { is_active: true },
      order: [['id', 'ASC']]
    });

    res.json(rooms);
  } catch (error) {
    console.error('Ошибка при получении переговорных комнат:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить все переговорные комнаты (для админов)
const getAllMeetingRoomsAdmin = async (req, res) => {
  try {
    const rooms = await MeetingRoom.findAll({
      order: [['id', 'ASC']]
    });

    res.json(rooms);
  } catch (error) {
    console.error('Ошибка при получении переговорных комнат:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить переговорную комнату по ID
const getMeetingRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await MeetingRoom.findByPk(id);
    
    if (!room) {
      return res.status(404).json({ error: 'Переговорная комната не найдена' });
    }
    
    res.json(room);
  } catch (error) {
    console.error('Ошибка при получении переговорной комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Создать новую переговорную комнату
const createMeetingRoom = async (req, res) => {
  try {
    const { name, description, capacity, location, equipment, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Название комнаты обязательно' });
    }
    
    const room = await MeetingRoom.create({
      name,
      description,
      capacity: capacity || 1,
      location,
      equipment: equipment ? JSON.stringify(equipment) : null,
      color: color || '#3B82F6'
    });
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Ошибка при создании переговорной комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Обновить переговорную комнату
const updateMeetingRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, capacity, location, equipment, color, is_active } = req.body;
    
    const room = await MeetingRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({ error: 'Переговорная комната не найдена' });
    }
    
    await room.update({
      name: name || room.name,
      description: description !== undefined ? description : room.description,
      capacity: capacity || room.capacity,
      location: location !== undefined ? location : room.location,
      equipment: equipment ? JSON.stringify(equipment) : room.equipment,
      color: color || room.color,
      is_active: is_active !== undefined ? is_active : room.is_active
    });
    
    res.json(room);
  } catch (error) {
    console.error('Ошибка при обновлении переговорной комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Удалить переговорную комнату
const deleteMeetingRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    const room = await MeetingRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({ error: 'Переговорная комната не найдена' });
    }
    
    // Проверяем, есть ли активные бронирования
    const activeBookings = await MeetingRoomBooking.count({
      where: {
        meeting_room_id: id,
        start_time: {
          [Op.gte]: new Date()
        },
        status: {
          [Op.in]: ['confirmed', 'pending']
        }
      }
    });
    
    if (activeBookings > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить комнату с активными бронированиями' 
      });
    }
    
    await room.destroy();
    res.json({ message: 'Переговорная комната успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении переговорной комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить расписание комнаты
const getRoomSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    const room = await MeetingRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({ error: 'Переговорная комната не найдена' });
    }
    
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const bookings = await MeetingRoomBooking.findAll({
      where: {
        meeting_room_id: id,
        start_time: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      attributes: [
        'id', 'meeting_room_id', 'employee_id', 'title', 'description',
        'start_time', 'end_time', 'participants', 'documents', 'video_link',
        'location_address', 'status', 'notifications', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['start_time', 'ASC']]
    });
    
    res.json({
      room,
      bookings,
      date: targetDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Ошибка при получении расписания комнаты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить доступные слоты для комнаты
const getAvailableSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    const room = await MeetingRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({ error: 'Переговорная комната не найдена' });
    }
    
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Получаем существующие бронирования
    const existingBookings = await MeetingRoomBooking.findAll({
      where: {
        meeting_room_id: id,
        start_time: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: {
          [Op.in]: ['confirmed', 'pending']
        }
      },
      attributes: [
        'id', 'meeting_room_id', 'employee_id', 'title', 'description',
        'start_time', 'end_time', 'participants', 'documents', 'video_link',
        'location_address', 'status', 'notifications', 'created_at', 'updated_at'
      ],
      order: [['start_time', 'ASC']]
    });
    
    // Генерируем слоты по 30 минут
    const slots = [];
    const slotDuration = 30; // минуты
    
    for (let hour = 9; hour < 18; hour++) { // 9:00 - 18:00
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
        
        // Проверяем, не пересекается ли слот с существующими бронированиями
        const isAvailable = !existingBookings.some(booking => {
          const bookingStart = new Date(booking.start_time);
          const bookingEnd = new Date(booking.end_time);
          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
        });
        
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: isAvailable
        });
      }
    }
    
    res.json(slots);
  } catch (error) {
    console.error('Ошибка при получении доступных слотов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  getAllMeetingRooms,
  getAllMeetingRoomsAdmin,
  getMeetingRoomById,
  createMeetingRoom,
  updateMeetingRoom,
  deleteMeetingRoom,
  getRoomSchedule,
  getAvailableSlots
}; 