import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, MapPin, FileText, Video, Package, Bell } from 'lucide-react';
import api from '../../services/api';

export default function RoomDetailsModal({ room, selectedDate, onDateChange, onClose, onBook, availableSlots }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoomSchedule();
  }, [room, selectedDate]);

  const loadRoomSchedule = async () => {
    try {
      const response = await api.get(`/meeting-rooms/rooms/${room.id}/schedule`, {
        params: { date: selectedDate.toISOString().split('T')[0] }
      });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Ошибка при загрузке расписания:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Подтверждено';
      case 'pending': return 'Ожидает';
      case 'cancelled': return 'Отменено';
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">{room.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Информация о комнате */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о комнате</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  {room.location || 'Расположение не указано'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Вместимость: {room.capacity} чел.</span>
              </div>
              {room.description && (
                <div className="md:col-span-2">
                  <p className="text-gray-700">{room.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Выбор даты */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите дату
            </label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => onDateChange(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Свободные слоты */}
          {availableSlots.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Свободные слоты на {selectedDate.toLocaleDateString('ru-RU')}
              </h3>
              <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                {availableSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`p-2 text-xs rounded border text-center ${
                      slot.available
                        ? 'border-green-300 bg-green-50 text-green-800'
                        : 'border-red-300 bg-red-50 text-red-800'
                    }`}
                  >
                    {formatTime(slot.start)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Расписание на выбранную дату */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Расписание на {selectedDate.toLocaleDateString('ru-RU')}
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">На эту дату нет бронирований</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {booking.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                            {getBookingStatusText(booking.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {booking.employee?.last_name} {booking.employee?.first_name}
                          </div>
                        </div>

                        {booking.description && (
                          <p className="text-gray-500 mt-2">{booking.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-3">
                          {booking.video_link && (
                            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              <Video className="w-3 h-3" />
                              Видеовстреча
                            </span>
                          )}
                          {booking.documents && JSON.parse(booking.documents).length > 0 && (
                            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              <FileText className="w-3 h-3" />
                              Документы
                            </span>
                          )}
                          {booking.product && (
                            <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              <Package className="w-3 h-3" />
                              {booking.product.name}
                            </span>
                          )}
                          {booking.notifications && JSON.parse(booking.notifications).length > 0 && (
                            <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              <Bell className="w-3 h-3" />
                              Уведомления
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Закрыть
            </button>
            <button
              onClick={onBook}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              Забронировать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 