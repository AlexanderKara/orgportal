import React from 'react';
import { X, Calendar, Clock, Users, MapPin, FileText, Video, Package, Bell, Edit, MessageCircle } from 'lucide-react';

export default function BookingDetailsModal({ booking, onClose, onUpdate, onRequestChange }) {
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">Детали бронирования</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{booking.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                {getBookingStatusText(booking.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{formatDate(booking.start_time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{booking.meetingRoom?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  {booking.employee?.last_name} {booking.employee?.first_name}
                </span>
              </div>
            </div>

            {booking.description && (
              <p className="text-gray-700 mt-4">{booking.description}</p>
            )}
          </div>

          {/* Дополнительная информация */}
          <div className="space-y-4">
            {booking.video_link && (
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600" />
                <a 
                  href={booking.video_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Ссылка на видеовстречу
                </a>
              </div>
            )}

            {booking.location_address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{booking.location_address}</span>
              </div>
            )}

            {booking.product && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                <span className="text-gray-700">Продукт: {booking.product.name}</span>
              </div>
            )}

            {booking.documents && JSON.parse(booking.documents).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Документы:</h4>
                <div className="space-y-2">
                  {JSON.parse(booking.documents).map((doc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 underline"
                      >
                        {doc.name}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {booking.notifications && JSON.parse(booking.notifications).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Уведомления:</h4>
                <div className="space-y-2">
                  {JSON.parse(booking.notifications).map((notif, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-yellow-600" />
                      <span className="text-gray-700">
                        {notif.type === 'app' ? 'В приложении' : 
                         notif.type === 'email' ? 'Email' : 
                         notif.type === 'telegram' ? 'Telegram' : notif.type} 
                        за {notif.time} минут
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={onRequestChange}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <MessageCircle className="w-4 h-4" />
              Запросить изменение
            </button>
            <button
              onClick={onUpdate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 