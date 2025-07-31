const express = require('express');
const router = express.Router();
const meetingRoomController = require('../controllers/meetingRoomController');
const bookingController = require('../controllers/bookingController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Тестовый маршрут без аутентификации
router.get('/test', (req, res) => {
  res.json({ message: 'Meeting rooms API is working' });
});

// Маршруты для переговорных комнат (административные)
router.get('/rooms', (req, res, next) => {
  next();
}, meetingRoomController.getAllMeetingRooms); // Временно убрал authMiddleware
router.get('/rooms/admin', authMiddleware, adminMiddleware, meetingRoomController.getAllMeetingRoomsAdmin);
router.get('/rooms/:id', authMiddleware, meetingRoomController.getMeetingRoomById);
router.post('/rooms', authMiddleware, adminMiddleware, meetingRoomController.createMeetingRoom);
router.put('/rooms/:id', authMiddleware, adminMiddleware, meetingRoomController.updateMeetingRoom);
router.delete('/rooms/:id', authMiddleware, adminMiddleware, meetingRoomController.deleteMeetingRoom);

// Маршруты для расписания и слотов
router.get('/rooms/:id/schedule', authMiddleware, meetingRoomController.getRoomSchedule);
router.get('/rooms/:id/slots', authMiddleware, meetingRoomController.getAvailableSlots);

// Маршруты для бронирований (пользовательские)
router.post('/bookings', authMiddleware, bookingController.createBooking);
router.get('/bookings', authMiddleware, bookingController.getUserBookings);
router.get('/bookings/:id', authMiddleware, bookingController.getBookingById);
router.put('/bookings/:id', authMiddleware, bookingController.updateBooking);
router.delete('/bookings/:id', authMiddleware, bookingController.cancelBooking);

// Маршруты для запросов на изменение
router.post('/bookings/:id/request-change', authMiddleware, bookingController.requestBookingChange);
router.get('/booking-requests', authMiddleware, bookingController.getBookingRequests);

module.exports = router; 