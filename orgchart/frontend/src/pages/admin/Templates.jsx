import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit, Archive, Trash2, Copy, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { ErrorBlock } from '../../components/ui';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';
import TemplateModal from '../../components/TemplateModal';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    description: ''
  });

  const availableTags = [
    // Теги для уведомлений
    { tag: '%именинники_месяца%', description: 'Список именинников текущего месяца' },
    { tag: '%именинники_след_месяца%', description: 'Список именинников следующего месяца' },
    { tag: '%следующий именинник%', description: 'Следующий именинник' },
    { tag: '%отпускники_месяца%', description: 'Список сотрудников в отпуске в текущем месяце' },
    { tag: '%отпускники_след_месяца%', description: 'Список сотрудников в отпуске в следующем месяце' },
    // Теги для шаблонов сообщений бота
    { tag: '%auth_code%', description: 'Код авторизации (для сообщений с кодом)' },
    { tag: '%username%', description: 'Telegram username пользователя' },
    { tag: '%chat_id%', description: 'ID чата Telegram' },
    { tag: '%group_name%', description: 'Название группы Telegram' },
    { tag: '%hr_response%', description: 'HR-ответ для незарегистрированных пользователей' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getTemplates();
      setTemplates(response?.data || response || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.updateTemplate(editingTemplate.id, formData);
        showNotification('Шаблон обновлен', 'success');
      } else {
        await api.createTemplate(formData);
        showNotification('Шаблон создан', 'success');
      }
      setIsModalOpen(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      showNotification('Ошибка при сохранении шаблона', 'error');
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      description: template.description || ''
    });
    setIsModalOpen(true);
  };

  const handleArchive = async (templateId) => {
    try {
      await api.updateTemplate(templateId, { status: 'archived' });
      showNotification('Шаблон архивирован', 'success');
      loadTemplates();
    } catch (error) {
      console.error('Error archiving template:', error);
      showNotification('Ошибка при архивировании шаблона', 'error');
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      try {
        await api.deleteTemplate(templateId);
        showNotification('Шаблон удален', 'success');
        loadTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        showNotification('Ошибка при удалении шаблона', 'error');
      }
    }
  };

  const handleCopy = (template) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} (копия)`,
      content: template.content,
      description: template.description || ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      description: ''
    });
  };

  const insertTag = (tag) => {
    setFormData({...formData, content: formData.content + tag});
  };

  const getStatusBadge = (template) => {
    if (template.status === 'archived') {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Архив</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">Активен</span>;
  };

  if (loading) {
    return (
      <ErrorBlock
        title="Загрузка шаблонов..."
        message="Пожалуйста, подождите, пока загружаются шаблоны уведомлений."
      />
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Шаблоны уведомлений</h1>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingTemplate(null);
              resetForm();
              setIsModalOpen(true);
            }}
          >
            Создать шаблон
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-[15px] border border-gray/50 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                )}
                {getStatusBadge(template)}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(template)}
                  className="p-1 text-gray-500 hover:text-blue-600"
                  title="Копировать"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-1 text-gray-500 hover:text-blue-600"
                  title="Редактировать"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleArchive(template.id)}
                  className="p-1 text-gray-500 hover:text-yellow-600"
                  title="Архивировать"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1 text-gray-500 hover:text-red-600"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700 line-clamp-3">
                {template.content}
              </p>
            </div>

            <div className="flex flex-wrap gap-1">
              {availableTags.filter(tag => template.content.includes(tag.tag)).map(tag => (
                <span key={tag.tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                  {tag.tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <TemplateModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTemplate(null);
            resetForm();
          }}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          editingTemplate={editingTemplate}
          availableTags={availableTags}
          insertTag={insertTag}
        />
      )}
    </div>
  );
} 