import React, { useState } from 'react';
import { X, Calendar, Clock, MessageCircle } from 'lucide-react';

export default function RequestChangeModal({ booking, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    request_type: 'cancel',
    new_start_time: '',
    new_end_time: '',
    reason: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(booking.id, formData);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">Запрос на изменение бронирования</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Информация о бронировании */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{booking.title}</h3>
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
                <span className="text-gray-700">Комната: {booking.meetingRoom?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">
                  Забронировал: {booking.employee?.last_name} {booking.employee?.first_name}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Тип запроса */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип запроса *
              </label>
              <select
                value={formData.request_type}
                onChange={(e) => handleInputChange('request_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="cancel">Отмена бронирования</option>
                <option value="reschedule">Перенос времени</option>
              </select>
            </div>

            {/* Новое время (только для переноса) */}
            {formData.request_type === 'reschedule' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Новое время начала *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.new_start_time}
                    onChange={(e) => handleInputChange('new_start_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required={formData.request_type === 'reschedule'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Новое время окончания *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.new_end_time}
                    onChange={(e) => handleInputChange('new_end_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required={formData.request_type === 'reschedule'}
                  />
                </div>
              </div>
            )}

            {/* Причина */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Причина запроса *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
                placeholder="Опишите причину запроса на изменение..."
                required
              />
            </div>

            {/* Кнопки */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                <MessageCircle className="w-4 h-4" />
                Отправить запрос
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 