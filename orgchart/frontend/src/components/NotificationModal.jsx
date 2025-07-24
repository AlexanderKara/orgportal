import React from 'react';
import { X } from 'lucide-react';

export default function NotificationModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingNotification,
  templates,
  chats,
  recurrenceOptions,
  weekDays,
  getDateForInput,
  RecipientsSelector
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col relative">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {editingNotification ? 'Редактировать уведомление' : 'Создать уведомление'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="notification-form" className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Уведомление #"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Повторяемость</label>
              <select
                value={formData.recurrence}
                onChange={(e) => setFormData({...formData, recurrence: e.target.value})}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {recurrenceOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {(formData.recurrence === 'daily' || formData.recurrence === 'weekly' || formData.recurrence === 'monthly' || formData.recurrence === 'yearly') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Интервал</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.interval}
                    onChange={(e) => setFormData({...formData, interval: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                  <select
                    value={formData.intervalType}
                    onChange={(e) => setFormData({...formData, intervalType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="days">дней</option>
                    <option value="weeks">недель</option>
                    <option value="months">месяцев</option>
                    <option value="years">лет</option>
                  </select>
                </div>
              </div>
            )}
            {formData.recurrence === 'weekdays' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дни недели</label>
                <div className="space-y-2">
                  {weekDays.map(day => (
                    <label key={day.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.weekDays.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, weekDays: [...formData.weekDays, day.value]});
                          } else {
                            setFormData({...formData, weekDays: formData.weekDays.filter(d => d !== day.value)});
                          }
                        }}
                        className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {formData.recurrence === 'monthday' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">День месяца</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.monthDay}
                  onChange={(e) => setFormData({...formData, monthDay: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Время отправки</label>
              <input
                type="time"
                value={formData.sendTime}
                onChange={(e) => setFormData({...formData, sendTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* Для одноразовых уведомлений поле даты всегда видно */}
            {(formData.recurrence === 'once' || formData.recurrence !== 'once') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата отправки {formData.recurrence !== 'once' && '(опционально)'}</label>
                <input
                  type="date"
                  value={getDateForInput(formData.endDate)}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Шаблон *</label>
              <select
                value={formData.templateId}
                onChange={(e) => setFormData({...formData, templateId: e.target.value})}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Выберите шаблон</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Адресаты</label>
              <RecipientsSelector
                value={formData.recipients}
                onChange={(recipients) => setFormData({...formData, recipients})}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Активно</label>
            </div>
          </form>
        </div>
        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="notification-form"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              {editingNotification ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 