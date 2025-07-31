const { MeetingRoom, MeetingRoomBooking, Employee, AppSettings } = require('../models');
const { Op } = require('sequelize');

class MeetingRoomService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.checkInterval = 60000; // 1 минута
  }

  // Загрузить статус сервиса из настроек
  async loadServiceStatus() {
    try {
      const setting = await AppSettings.findOne({
        where: { key: 'meeting_room_service_enabled' }
      });
      return setting ? setting.value === 'true' : true; // По умолчанию включен
    } catch (error) {
      console.error('Ошибка при загрузке статуса сервиса переговорок:', error);
      return true;
    }
  }

  // Сохранить статус сервиса в настройки
  async saveServiceStatus(enabled) {
    try {
      await AppSettings.upsert({
        key: 'meeting_room_service_enabled',
        value: String(enabled),
        type: 'boolean',
        description: 'Статус сервиса управления переговорными комнатами'
      });
    } catch (error) {
      console.error('Ошибка при сохранении статуса сервиса переговорок:', error);
    }
  }

  // Инициализация сервиса
  async initializeService() {
    try {
      const shouldStart = await this.loadServiceStatus();
      if (shouldStart) {
        await this.startService();
      } else {
        console.log('Сервис переговорных отключен в настройках');
      }
    } catch (error) {
      console.error('Ошибка при инициализации сервиса переговорок:', error);
    }
  }

  // Запустить сервис
  async startService() {
    if (this.isRunning) {
      console.log('Сервис переговорных уже запущен');
      return;
    }

    try {
      this.isRunning = true;
      await this.saveServiceStatus(true);
      
      // Запускаем периодическую проверку
      this.interval = setInterval(() => {
        this.processMeetingRoomTasks();
      }, this.checkInterval);

      console.log('Сервис переговорных запущен');
    } catch (error) {
      console.error('Ошибка при запуске сервиса переговорок:', error);
      this.isRunning = false;
    }
  }

  // Остановить сервис
  async stopService() {
    if (!this.isRunning) {
      console.log('Сервис переговорных уже остановлен');
      return;
    }

    try {
      this.isRunning = false;
      await this.saveServiceStatus(false);
      
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }

      console.log('Сервис переговорных остановлен');
    } catch (error) {
      console.error('Ошибка при остановке сервиса переговорок:', error);
    }
  }

  // Обработка задач переговорок
  async processMeetingRoomTasks() {
    if (!this.isRunning) return;

    try {
      console.log('Обработка задач переговорных...');
      
      // Проверяем активные бронирования
      await this.checkActiveBookings();
      
      // Проверяем конфликты в расписании
      await this.checkScheduleConflicts();
      
      // Очищаем устаревшие данные
      await this.cleanupOldData();
      
    } catch (error) {
      console.error('Ошибка при обработке задач переговорок:', error);
    }
  }

  // Проверка активных бронирований
  async checkActiveBookings() {
    try {
      const now = new Date();
      const activeBookings = await MeetingRoomBooking.findAll({
        where: {
          start_time: {
            [Op.lte]: now
          },
          end_time: {
            [Op.gte]: now
          },
          status: 'confirmed'
        },
        include: [
          {
            model: MeetingRoom,
            as: 'meetingRoom',
            attributes: ['id', 'name', 'location']
          },
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ]
      });

      console.log(`Найдено ${activeBookings.length} активных бронирований переговорных`);
      
      // Здесь можно добавить логику для уведомлений о начале встреч
      for (const booking of activeBookings) {
        console.log(`Активная встреча: ${booking.title} в переговорной ${booking.meetingRoom.name}`);
      }
    } catch (error) {
      console.error('Ошибка при проверке активных бронирований:', error);
    }
  }

  // Проверка конфликтов в расписании
  async checkScheduleConflicts() {
    try {
      const conflicts = await MeetingRoomBooking.findAll({
        where: {
          status: {
            [Op.in]: ['confirmed', 'pending']
          }
        },
        include: [
          {
            model: MeetingRoom,
            as: 'meetingRoom',
            attributes: ['id', 'name']
          }
        ],
        order: [['meeting_room_id', 'ASC'], ['start_time', 'ASC']]
      });

      // Группируем бронирования по комнатам
      const bookingsByRoom = {};
      conflicts.forEach(booking => {
        const roomId = booking.meeting_room_id;
        if (!bookingsByRoom[roomId]) {
          bookingsByRoom[roomId] = [];
        }
        bookingsByRoom[roomId].push(booking);
      });

      // Проверяем конфликты для каждой комнаты
      for (const [roomId, bookings] of Object.entries(bookingsByRoom)) {
        for (let i = 0; i < bookings.length - 1; i++) {
          const current = bookings[i];
          const next = bookings[i + 1];
          
          if (new Date(current.end_time) > new Date(next.start_time)) {
            console.warn(`Конфликт в комнате ${current.meetingRoom.name}: ${current.title} пересекается с ${next.title}`);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке конфликтов в расписании:', error);
    }
  }

  // Очистка устаревших данных
  async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Удаляем старые отмененные бронирования
      const deletedCount = await MeetingRoomBooking.destroy({
        where: {
          status: 'cancelled',
          updated_at: {
            [Op.lt]: thirtyDaysAgo
          }
        }
      });

      if (deletedCount > 0) {
        console.log(`Удалено ${deletedCount} старых отменённых бронирований переговорных`);
      }
    } catch (error) {
      console.error('Ошибка при очистке устаревших данных:', error);
    }
  }

  // Получить статистику сервиса
  async getServiceStats() {
    try {
      const totalRooms = await MeetingRoom.count();
      const activeRooms = await MeetingRoom.count({ where: { is_active: true } });
      const totalBookings = await MeetingRoomBooking.count();
      const todayBookings = await MeetingRoomBooking.count({
        where: {
          start_time: {
            [Op.between]: [
              new Date(new Date().setHours(0, 0, 0, 0)),
              new Date(new Date().setHours(23, 59, 59, 999))
            ]
          }
        }
      });

      return {
        serviceStatus: this.isRunning ? 'running' : 'stopped',
        totalRooms,
        activeRooms,
        totalBookings,
        todayBookings
      };
    } catch (error) {
      console.error('Ошибка при получении статистики сервиса:', error);
      return {
        serviceStatus: this.isRunning ? 'running' : 'stopped',
        totalRooms: 0,
        activeRooms: 0,
        totalBookings: 0,
        todayBookings: 0
      };
    }
  }
}

module.exports = new MeetingRoomService();