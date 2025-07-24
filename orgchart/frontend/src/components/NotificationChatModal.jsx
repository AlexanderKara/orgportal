import React from 'react';
import { X } from 'lucide-react';
import Button from './ui/Button';

export default function NotificationChatModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingChat,
  chatTypes,
  availableCommands
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col relative">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            Настройки {editingChat?.type === 'chat' ? 'чата' : 'группы'}
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
          <form id="chat-form" className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Название чата или группы"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип
              </label>
              <div className="flex gap-4">
                {chatTypes.map(type => (
                  <label key={type.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      disabled={editingChat} // Read-only для существующих чатов
                    />
                    <div className="flex items-center gap-1">
                      {type.icon}
                      {type.label}
                    </div>
                  </label>
                ))}
              </div>
              {editingChat && (
                <p className="text-xs text-gray-500 mt-1">
                  Тип чата нельзя изменить после создания
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Доступные команды
              </label>
              <div className="space-y-2">
                {availableCommands.map(command => (
                  <label key={command.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.commands[command.key]}
                      onChange={(e) => setFormData({
                        ...formData, 
                        commands: {
                          ...formData.commands,
                          [command.key]: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="font-medium">{command.label}</div>
                      <div className="text-xs text-gray-500">{command.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Активен
              </label>
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
              form="chat-form"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 