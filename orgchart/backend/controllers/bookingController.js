const { MeetingRoomBooking, MeetingRoom, Employee, Product, BookingRequest } = require('../models');
const { Op } = require('sequelize');

// Создать новое бронирование
const createBooking = async (req, res) => {
  try {
    const {
      meeting_room_id,
      title,
      description,
      start_time,
      end_time,
      participants,
      documents,
      video_link,
      location_address,
      product_ids,
      notifications
    } = req.body;
    
    const employee_id = req.employee.id;
    
    // Валидация
    if (!meeting_room_id || !title || !start_time || !end_time) {
      return res.status(400).json({ 
        error: 'Необходимо указать комнату, название, время начала и окончания' 
      });
    }
    
    // Проверяем, что комната существует и активна
    const room = await MeetingRoom.findByPk(meeting_room_id);
    if (!room || !room.is_active) {
      return res.status(404).json({ error: 'Переговорная комната не найдена' });
    }
    
    // Проверяем, что время корректное
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const now = new Date();
    
    // Разрешаем бронирование на сегодня, но на время которое еще не наступило
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateToday = new Date(startDate);
    startDateToday.setHours(0, 0, 0, 0);
    
    if (startDateToday.getTime() === today.getTime()) {
      // Если бронирование на сегодня, проверяем что время еще не наступило
      const currentTime = new Date();
      if (startDate <= currentTime) {
        return res.status(400).json({ error: 'Нельзя бронировать время в прошлом' });
      }
    } else if (startDate < now) {
      // Если бронирование на прошлую дату
      return res.status(400).json({ error: 'Нельзя бронировать время в прошлом' });
    }
    
    if (endDate <= startDate) {
      return res.status(400).json({ error: 'Время окончания должно быть позже времени начала' });
    }
    
    // Проверяем, что слот свободен
    const conflictingBooking = await MeetingRoomBooking.findOne({
      where: {
        meeting_room_id,
        status: 'confirmed',
        [Op.or]: [
          {
            start_time: {
              [Op.lt]: endDate
            },
            end_time: {
              [Op.gt]: startDate
            }
          }
        ]
      }
    });
    
    if (conflictingBooking) {
      return res.status(409).json({ 
        error: 'Выбранное время уже забронировано' 
      });
    }
    
    // Создаем бронирование
    const booking = await MeetingRoomBooking.create({
      meeting_room_id,
      employee_id,
      title,
      description,
      start_time: startDate,
      end_time: endDate,
      participants: participants ? JSON.stringify(participants) : null,
      documents: documents ? JSON.stringify(documents) : null,
      video_link,
      location_address,
      product_ids: product_ids ? JSON.stringify(product_ids) : null,
      notifications: notifications ? JSON.stringify(notifications) : null,
      status: 'confirmed'
    });
    
    // Получаем полные данные бронирования
    const fullBooking = await MeetingRoomBooking.findByPk(booking.id, {
      attributes: [
        'id', 'meeting_room_id', 'employee_id', 'title', 'description',
        'start_time', 'end_time', 'participants', 'documents', 'video_link',
        'location_address', 'status', 'notifications', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: MeetingRoom,
          as: 'meetingRoom',
          attributes: ['id', 'name', 'location', 'capacity']
        },
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'middle_name', 'avatar']
        }
      ]
    });
    
    res.status(201).json(fullBooking);
  } catch (error) {
    console.error('Ошибка при создании бронирования:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить бронирования пользователя
const getUserBookings = async (req, res) => {
  try {
    const employee_id = req.employee.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const where = { employee_id };
    if (status) {
      where.status = status;
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: bookings } = await MeetingRoomBooking.findAndCountAll({
      where,
      attributes: [
        'id', 'meeting_room_id', 'employee_id', 'title', 'description',
        'start_time', 'end_time', 'participants', 'documents', 'video_link',
        'location_address', 'status', 'notifications', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: MeetingRoom,
          as: 'meetingRoom',
          attributes: ['id', 'name', 'location', 'capacity', 'color']
        }
      ],
      order: [['start_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      bookings,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении бронирований пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить бронирование по ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee_id = req.employee.id;
    
    const booking = await MeetingRoomBooking.findOne({
      where: { id, employee_id },
      attributes: [
        'id', 'meeting_room_id', 'employee_id', 'title', 'description',
        'start_time', 'end_time', 'participants', 'documents', 'video_link',
        'location_address', 'status', 'notifications', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: MeetingRoom,
          as: 'meetingRoom',
          attributes: ['id', 'name', 'location', 'capacity', 'color']
        },
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'middle_name', 'avatar']
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Ошибка при получении бронирования:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Обновить бронирование
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const employee_id = req.employee.id;
    const {
      title,
      description,
      start_time,
      end_time,
      participants,
      documents,
      video_link,
      location_address,
      product_ids,
      notifications
    } = req.body;
    
    const booking = await MeetingRoomBooking.findOne({
      where: { id, employee_id }
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    
    // Проверяем, что бронирование еще не началось
    if (new Date(booking.start_time) <= new Date()) {
      return res.status(400).json({ 
        error: 'Нельзя изменить уже начавшееся бронирование' 
      });
    }
    
    // Если изменяется время, проверяем конфликты
    if (start_time || end_time) {
      const newStartTime = start_time ? new Date(start_time) : new Date(booking.start_time);
      const newEndTime = end_time ? new Date(end_time) : new Date(booking.end_time);
      
      if (newEndTime <= newStartTime) {
        return res.status(400).json({ 
          error: 'Время окончания должно быть позже времени начала' 
        });
      }
      
      // Проверяем конфликты с другими бронированиями
      const conflictingBooking = await MeetingRoomBooking.findOne({
        where: {
          id: { [Op.ne]: id },
          meeting_room_id: booking.meeting_room_id,
          status: 'confirmed',
          [Op.or]: [
            {
              start_time: {
                [Op.lt]: newEndTime
              },
              end_time: {
                [Op.gt]: newStartTime
              }
            }
          ]
        }
      });
      
      if (conflictingBooking) {
        return res.status(409).json({ 
          error: 'Выбранное время уже забронировано' 
        });
      }
    }
    
    // Обновляем бронирование
    await booking.update({
      title: title || booking.title,
      description: description !== undefined ? description : booking.description,
      start_time: start_time ? new Date(start_time) : booking.start_time,
      end_time: end_time ? new Date(end_time) : booking.end_time,
      participants: participants ? JSON.stringify(participants) : booking.participants,
      documents: documents ? JSON.stringify(documents) : booking.documents,
      video_link: video_link !== undefined ? video_link : booking.video_link,
      location_address: location_address !== undefined ? location_address : booking.location_address,
      product_ids: product_ids ? JSON.stringify(product_ids) : booking.product_ids,
      notifications: notifications ? JSON.stringify(notifications) : booking.notifications
    });
    
    // Получаем обновленные данные
    const updatedBooking = await MeetingRoomBooking.findByPk(id, {
      attributes: [
        'id', 'meeting_room_id', 'employee_id', 'title', 'description',
        'start_time', 'end_time', 'participants', 'documents', 'video_link',
        'location_address', 'status', 'notifications', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: MeetingRoom,
          as: 'meetingRoom',
          attributes: ['id', 'name', 'location', 'capacity', 'color']
        },
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'middle_name', 'avatar']
        }
      ]
    });
    
    res.json(updatedBooking);
  } catch (error) {
    console.error('Ошибка при обновлении бронирования:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Отменить бронирование
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const employee_id = req.employee.id;
    
    const booking = await MeetingRoomBooking.findOne({
      where: { id, employee_id }
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    
    // Проверяем, что бронирование еще не началось
    if (new Date(booking.start_time) <= new Date()) {
      return res.status(400).json({ 
        error: 'Нельзя отменить уже начавшееся бронирование' 
      });
    }
    
    await booking.update({ status: 'cancelled' });
    
    res.json({ message: 'Бронирование успешно отменено' });
  } catch (error) {
    console.error('Ошибка при отмене бронирования:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Запросить изменение бронирования
const requestBookingChange = async (req, res) => {
  try {
    const { id } = req.params;
    const employee_id = req.employee.id;
    const { request_type, new_start_time, new_end_time, reason } = req.body;
    
    const booking = await MeetingRoomBooking.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'middle_name']
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    
    // Проверяем, что запрос не от владельца бронирования
    if (booking.employee_id === employee_id) {
      return res.status(400).json({ 
        error: 'Нельзя запросить изменение собственного бронирования' 
      });
    }
    
    // Создаем запрос на изменение
    const request = await BookingRequest.create({
      booking_id: id,
      requester_id: employee_id,
      request_type,
      new_start_time: new_start_time ? new Date(new_start_time) : null,
      new_end_time: new_end_time ? new Date(new_end_time) : null,
      reason,
      status: 'pending'
    });
    
    res.status(201).json(request);
  } catch (error) {
    console.error('Ошибка при создании запроса на изменение:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить запросы на изменение для пользователя
const getBookingRequests = async (req, res) => {
  try {
    const employee_id = req.employee.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const where = { requester_id: employee_id };
    if (status) {
      where.status = status;
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: requests } = await BookingRequest.findAndCountAll({
      where,
      include: [
        {
          model: MeetingRoomBooking,
          as: 'booking',
          include: [
            {
              model: MeetingRoom,
              as: 'meetingRoom',
              attributes: ['id', 'name']
            },
            {
              model: Employee,
              as: 'employee',
              attributes: ['id', 'first_name', 'last_name', 'middle_name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      requests,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении запросов на изменение:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  requestBookingChange,
  getBookingRequests
}; 