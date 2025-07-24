import React from 'react';
import { X } from 'lucide-react';

export default function TemplateModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingTemplate,
  availableTags,
  insertTag
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col relative">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон'}
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
          <form id="template-form" className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название шаблона *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Название шаблона"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание (опционально)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Краткое описание шаблона"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Содержание шаблона *
              </label>
              
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Доступные теги для автовставки:</p>
                <div className="mb-1 text-xs font-semibold text-gray-500">Для уведомлений:</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {availableTags.filter(tag => [
                    '%именинники_месяца%', '%именинники_след_месяца%', '%следующий именинник%', '%отпускники_месяца%', '%отпускники_след_месяца%']
                    .includes(tag.tag)).map(tag => (
                    <button
                      key={tag.tag}
                      type="button"
                      onClick={() => insertTag(tag.tag)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                      title={tag.description}
                    >
                      {tag.tag}
                    </button>
                  ))}
                </div>
                <div className="mb-1 mt-2 text-xs font-semibold text-gray-500">Для сообщений бота:</div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.filter(tag => [
                    '%auth_code%', '%username%', '%chat_id%', '%group_name%', '%hr_response%']
                    .includes(tag.tag)).map(tag => (
                    <button
                      key={tag.tag}
                      type="button"
                      onClick={() => insertTag(tag.tag)}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      title={tag.description}
                    >
                      {tag.tag}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Введите текст шаблона. Используйте теги для автовставки данных."
                rows="8"
                required
              />
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
              form="template-form"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              {editingTemplate ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 