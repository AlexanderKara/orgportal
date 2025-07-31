import React, { useState, useEffect } from 'react';
import { X, Users, MapPin, Palette } from 'lucide-react';

export default function RoomFormModal({ isOpen, room, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 1,
    location: '',
    equipment: '',
    color: '#3B82F6',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        capacity: room.capacity || 1,
        location: room.location || '',
        equipment: room.equipment || '',
        color: room.color || '#3B82F6',
        is_active: room.is_active !== undefined ? room.is_active : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        capacity: 1,
        location: '',
        equipment: '',
        color: '#3B82F6',
        is_active: true
      });
    }
  }, [room]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        equipment: formData.equipment ? JSON.parse(formData.equipment) : null
      };

      if (room) {
        await onSubmit(room.id, submitData);
      } else {
        await onSubmit(submitData);
      }
    } catch (error) {
      console.error('Ошибка при сохранении комнаты:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {room ? 'Редактировать комнату' : 'Добавить комнату'}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form id="room-form" className="space-y-4" onSubmit={handleSubmit}>
            {/* Основная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название комнаты *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Введите название комнаты"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Вместимость *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                    max="50"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Описание комнаты"
                rows={3}
              />
            </div>

            {/* Расположение */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Расположение
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Адрес или описание расположения"
                />
              </div>
            </div>

            {/* Оборудование */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Оборудование (JSON)
              </label>
              <textarea
                value={formData.equipment}
                onChange={(e) => handleInputChange('equipment', e.target.value)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder='["Проектор", "Доска", "WiFi"]'
                rows={2}
              />
            </div>

            {/* Цвет и статус */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цвет комнаты
                </label>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-400" />
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-12 h-8 border border-gray/20 rounded-[4px] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Статус
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="w-4 h-4 text-primary border-gray/20 rounded focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Комната активна
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="room-form"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : (room ? 'Сохранить' : 'Добавить')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 