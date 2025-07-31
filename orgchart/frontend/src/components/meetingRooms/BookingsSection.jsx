import React from 'react';
import { Calendar, Clock, MapPin, Video, FileText, Package, Bell, Eye, Edit, Trash2, ArrowRight } from 'lucide-react';

const BookingsSection = ({ 
  bookings, 
  loading, 
  onViewDetails, 
  onEdit, 
  onCancel,
  onMove,
  className = '' 
}) => {
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
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Подтверждено';
      case 'pending':
        return 'Ожидает';
      case 'cancelled':
        return 'Отменено';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className={`bg-white rounded-[15px] border border-gray/50 ${className}`}>
      <div className="px-6 py-4 border-b border-gray/20">
        <h2 className="text-lg font-semibold text-dark">Мои бронирования</h2>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">Загрузка бронирований...</span>
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark mb-2">Бронирования не найдены</h3>
            <p className="text-gray-600">У вас пока нет активных бронирований</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray/20 rounded-[8px] p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-dark">
                        {booking.title}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBookingStatusColor(booking.status)}`}>
                        {getBookingStatusText(booking.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(booking.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{booking.meetingRoom?.name}</span>
                      </div>
                      {booking.meetingRoom?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{booking.meetingRoom.location}</span>
                        </div>
                      )}
                    </div>

                    {booking.description && (
                      <p className="text-gray-500 mt-3 text-sm leading-relaxed">{booking.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      {booking.video_link && (
                        <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          <Video className="w-3 h-3" />
                          Видеовстреча
                        </span>
                      )}
                      {booking.documents && JSON.parse(booking.documents).length > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                          <FileText className="w-3 h-3" />
                          Документы
                        </span>
                      )}
                      {booking.product && (
                        <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                          <Package className="w-3 h-3" />
                          {booking.product.name}
                        </span>
                      )}
                      {booking.notifications && JSON.parse(booking.notifications).length > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                          <Bell className="w-3 h-3" />
                          Уведомления
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onViewDetails(booking)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Подробности"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {booking.status === 'confirmed' && new Date(booking.start_time) > new Date() && (
                      <>
                        <button
                          onClick={() => onMove(booking)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Перенести"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(booking)}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onCancel(booking.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Отменить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsSection; 