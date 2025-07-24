import React, { useState, useEffect, useRef } from 'react';
import { Bell, Plus, Play, Pause, Archive, Trash2, Edit, Calendar, Clock, Send, X, Users, MessageCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Table, { TableBody, TableRow, ActionsCell } from '../../components/ui/Table';
import { ErrorBlock } from '../../components/ui';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';
import ViewSwitcher from '../../components/ui/ViewSwitcher';
import ReactDOM from 'react-dom';
import NotificationModal from '../../components/NotificationModal';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [chats, setChats] = useState([]); // Добавляем состояние для чатов
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const tabOptions = [
    { id: 'active', label: 'Активные', icon: <Play className="w-4 h-4" /> },
    { id: 'sent', label: 'Отправленные', icon: <Send className="w-4 h-4" /> },
  ];

  const [formData, setFormData] = useState({
    name: '',
    recurrence: 'once',
    templateId: '',
    endDate: '',
    sendTime: '',
    interval: 1,
    intervalType: 'days',
    weekDays: [],
    monthDay: 1,
    isActive: true,
    recipients: [] // Добавляем поле для адресатов
  });

  const recurrenceOptions = [
    { value: 'once', label: 'Однократно' },
    { value: 'daily', label: 'Каждый день' },
    { value: 'weekly', label: 'Каждую неделю' },
    { value: 'monthly', label: 'Каждый месяц' },
    { value: 'yearly', label: 'Каждый год' },
    { value: 'weekdays', label: 'По дням недели' },
    { value: 'monthday', label: 'По дню месяца' }
  ];

  const weekDays = [
    { value: 1, label: 'Понедельник' },
    { value: 2, label: 'Вторник' },
    { value: 3, label: 'Среда' },
    { value: 4, label: 'Четверг' },
    { value: 5, label: 'Пятница' },
    { value: 6, label: 'Суббота' },
    { value: 0, label: 'Воскресенье' }
  ];

  useEffect(() => {
    loadNotifications();
    loadTemplates();
    loadChats();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.getNotifications();
      setNotifications(response?.data || response || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.getTemplates();
      setTemplates(response?.data || response || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  const loadChats = async () => {
    try {
      const response = await api.getNotificationChats();
      setChats(response?.data || response || []);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Оставляем только допустимые поля
    const allowedFields = [
      'name', 'recurrence', 'templateId', 'endDate', 'sendTime', 'interval', 'intervalType',
      'weekDays', 'monthDay', 'isActive', 'status', 'lastSent', 'nextSend', 'recipients'
    ];
    let cleanData = Object.fromEntries(
      Object.entries(formData).filter(([key]) => allowedFields.includes(key))
    );
    // Приводим templateId к числу, если это строка
    if (cleanData.templateId && typeof cleanData.templateId === 'string') {
      cleanData.templateId = parseInt(cleanData.templateId, 10);
    }
    // Исправляем пустые строки для дат/времени
    if (cleanData.endDate === '') cleanData.endDate = null;
    if (cleanData.sendTime === '') cleanData.sendTime = null;
    // Обрезаем дату до YYYY-MM-DD, если вдруг пришла ISO-строка
    if (cleanData.endDate && typeof cleanData.endDate === 'string' && cleanData.endDate.length > 10) {
      cleanData.endDate = cleanData.endDate.slice(0, 10);
    }
    // Преобразуем recipients: если выбран 'all', отправляем пустой массив (рассылка во все чаты)
    console.log('Recipients before processing:', cleanData.recipients);
    if (Array.isArray(cleanData.recipients)) {
      if (cleanData.recipients.some(r => (typeof r === 'object' ? r.id === 'all' : r === 'all'))) {
        cleanData.recipients = [];
      } else if (cleanData.recipients.length > 0 && typeof cleanData.recipients[0] === 'object') {
        cleanData.recipients = cleanData.recipients.map(r => r.id);
      }
    }
    console.log('Recipients after processing:', cleanData.recipients);
    console.log('Saving notification (final payload):', cleanData);
    // Если редактируется однократное уведомление и дата/время изменились или оно снова активируется — сбрасываем lastSent
    if (
      editingNotification &&
      formData.recurrence === 'once' &&
      formData.isActive &&
      (
        formData.endDate !== editingNotification.endDate ||
        formData.sendTime !== editingNotification.sendTime ||
        !editingNotification.isActive
      )
    ) {
      cleanData.lastSent = null;
    }
    // Если уведомление активируется, всегда отправляем status: 'active'
    if (cleanData.isActive) {
      cleanData.status = 'active';
    }
    // Для отладки
    console.log('Saving notification:', cleanData);
    // Валидация: нельзя сохранять активное одноразовое уведомление с прошедшей датой
    if (
      formData.recurrence === 'once' &&
      formData.isActive &&
      formData.endDate
    ) {
      const now = new Date();
      const endDate = new Date(formData.endDate);
      // Если дата в прошлом или сегодня, но время уже прошло
      if (
        endDate < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ||
        (endDate.toDateString() === now.toDateString() && formData.sendTime && formData.sendTime <= now.toTimeString().slice(0,5))
      ) {
        showNotification('Нельзя сохранять активное одноразовое уведомление с прошедшей датой/временем', 'error');
        return;
      }
    }
    // Пример дополнительной валидации: обязательные поля
    if (!formData.name || !formData.templateId) {
      showNotification('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }
    const hasAll = Array.isArray(formData.recipients) && formData.recipients.some(r => (typeof r === 'object' ? r.id === 'all' : r === 'all'));
    if (!cleanData.recipients || (cleanData.recipients.length === 0 && !hasAll)) {
      showNotification('Пожалуйста, выберите хотя бы одного адресата', 'error');
      return;
    }
    try {
      if (editingNotification) {
        const resp = await api.updateNotification(editingNotification.id, cleanData);
        console.log('Update response:', resp);
        if (resp && resp.error) {
          showNotification('Ошибка: ' + (resp.error || 'Не удалось обновить уведомление'), 'error');
          return;
        }
        showNotification('Уведомление обновлено', 'success');
        setIsModalOpen(false);
        setEditingNotification(null);
        resetForm();
        await loadNotifications();
        if (cleanData.isActive) {
          setActiveTab('active');
        } else {
          setActiveTab('sent');
        }
      } else {
        const resp = await api.createNotification(cleanData);
        console.log('Create response:', resp);
        showNotification('Уведомление создано', 'success');
      setIsModalOpen(false);
      setEditingNotification(null);
      resetForm();
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      showNotification('Ошибка при сохранении уведомления', 'error');
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      name: notification.name,
      recurrence: notification.recurrence,
      templateId: notification.templateId,
      endDate: notification.endDate || '',
      sendTime: notification.sendTime || '',
      interval: notification.interval || 1,
      intervalType: notification.intervalType || 'days',
      weekDays: notification.weekDays || [],
      monthDay: notification.monthDay || 1,
      isActive: notification.isActive,
      recipients: Array.isArray(notification.recipients)
        ? notification.recipients.map(idOrObj =>
            typeof idOrObj === 'object'
              ? idOrObj
              : chats.find(chat => chat.id === idOrObj)
          ).filter(Boolean)
        : []
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (notificationId) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      const newStatus = !notification.isActive;
      await api.updateNotification(notificationId, { isActive: newStatus });
      showNotification(`Уведомление ${newStatus ? 'активировано' : 'приостановлено'}`, 'success');
      loadNotifications();
    } catch (error) {
      console.error('Error toggling notification status:', error);
      showNotification('Ошибка при изменении статуса уведомления', 'error');
    }
  };

  const handleArchive = async (notificationId) => {
    try {
      await api.updateNotification(notificationId, { status: 'archived' });
      showNotification('Уведомление архивировано', 'success');
      loadNotifications();
    } catch (error) {
      console.error('Error archiving notification:', error);
      showNotification('Ошибка при архивировании уведомления', 'error');
    }
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm('Вы уверены, что хотите удалить это уведомление?')) {
      try {
        await api.deleteNotification(notificationId);
        showNotification('Уведомление удалено', 'success');
        loadNotifications();
      } catch (error) {
        console.error('Error deleting notification:', error);
        showNotification('Ошибка при удалении уведомления', 'error');
      }
    }
  };

  const handleSendManually = async (notificationId) => {
    try {
      const resp = await api.sendNotificationManually(notificationId);
      if (resp && resp.success) {
      showNotification('Уведомление отправлено успешно', 'success');
      } else {
        showNotification(resp?.error || 'Ошибка при отправке уведомления', 'error');
      }
      await loadNotifications();
      // После отправки вручную, если уведомление стало неактивным, переключаемся на "Отправленные"
      const updated = notifications.find(n => n.id === notificationId);
      if (updated && (!updated.isActive || updated.status !== 'active')) {
        setActiveTab('sent');
      }
    } catch (error) {
      console.error('Error sending notification manually:', error);
      showNotification('Ошибка при отправке уведомления', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      recurrence: 'once',
      templateId: '',
      endDate: '',
      sendTime: '',
      interval: 1,
      intervalType: 'days',
      weekDays: [],
      monthDay: 1,
      isActive: true,
      recipients: []
    });
  };

  const getRecurrenceText = (notification) => {
    switch (notification.recurrence) {
      case 'once':
        return 'Однократно';
      case 'daily':
        return `Каждый ${notification.interval} день`;
      case 'weekly':
        return `Каждую ${notification.interval} неделю`;
      case 'monthly':
        return `Каждый ${notification.interval} месяц`;
      case 'yearly':
        return `Каждый ${notification.interval} год`;
      case 'weekdays':
        const days = notification.weekDays.map(day => 
          weekDays.find(wd => wd.value === day)?.label
        ).join(', ');
        return `По дням недели: ${days}`;
      case 'monthday':
        return `${notification.monthDay} число каждого месяца`;
      default:
        return 'Неизвестно';
    }
  };

  const getStatusBadge = (notification) => {
    if (notification.status === 'archived') {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Архив</span>;
    }
    return notification.isActive ? 
      <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">Активно</span> :
      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded">Пауза</span>;
  };

  // Компонент для выбора адресатов
  const RecipientsSelector = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    const allRecipientsOption = { id: 'all', name: 'Все адресаты', type: 'all' };
    const filteredChats = chats.filter(chat => 
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (chat) => {
      if (chat.id === 'all') {
        // Если выбрано "Все адресаты", очищаем остальные выборы
        onChange([allRecipientsOption]);
      } else {
        // Убираем "Все адресаты" если выбран конкретный чат
        const newValue = value.filter(v => v.id !== 'all');
        
        // Проверяем, не выбран ли уже этот чат
        const isAlreadySelected = newValue.some(v => v.id === chat.id);
        if (!isAlreadySelected) {
          onChange([...newValue, chat]);
        }
      }
      setIsOpen(false);
      setSearchTerm('');
    };

    const handleRemove = (chatId) => {
      onChange(value.filter(v => v.id !== chatId));
    };

    const getDisplayText = () => {
      if (value.length === 0) return 'Выберите адресатов';
      if (value.length === 1) return value[0].name;
      return `${value.length} адресатов`;
    };

    useEffect(() => {
      if (isOpen && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: 'absolute',
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          zIndex: 99999,
          maxWidth: '100vw',
        });
      }
    }, [isOpen]);

    return (
      <div className="relative">
        <div
          ref={inputRef}
          className="min-h-[40px] border border-gray/20 rounded-[8px] focus-within:ring-2 focus-within:ring-primary focus-within:border-primary p-2">
          <div className="flex flex-wrap gap-2 items-center">
            {value.map((chat) => (
              <span
                key={chat.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {chat.type === 'chat' ? (
                  <MessageCircle className="w-3 h-3" />
                ) : (
                  <Users className="w-3 h-3" />
                )}
                {chat.name}
                <button
                  type="button"
                  onClick={() => handleRemove(chat.id)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-left text-gray-500"
            >
              {getDisplayText()}
            </button>
          </div>
        </div>
        {/* Dropdown через портал */}
        {isOpen && ReactDOM.createPortal(
          <div style={dropdownStyle} className="bg-white border border-gray/20 rounded-[8px] shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2 border-b border-gray/20">
              <input
                type="text"
                placeholder="Поиск адресатов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {/* Опция "Все адресаты" */}
              <div
                className="px-3 py-2 hover:bg-gray/10 cursor-pointer text-sm border-b border-gray/10"
                onClick={() => handleSelect(allRecipientsOption)}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Все адресаты</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Отправить всем активным чатам и группам
                </div>
              </div>
              
              {/* Список чатов */}
              {filteredChats.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchTerm ? 'Адресаты не найдены' : 'Нет доступных адресатов'}
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="px-3 py-2 hover:bg-gray/10 cursor-pointer text-sm"
                    onClick={() => handleSelect(chat)}
                  >
                    <div className="flex items-center gap-2">
                      {chat.type === 'chat' ? (
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Users className="w-4 h-4 text-green-600" />
                      )}
                      <span>{chat.name}</span>
                      <span className="text-xs text-gray-500">
                        ({chat.type === 'chat' ? 'Чат' : 'Группа'})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  };

  // Для input type="date" всегда используем YYYY-MM-DD
  const getDateForInput = (date) => {
    if (!date) return '';
    if (typeof date === 'string' && date.length > 10) return date.slice(0, 10);
    return date;
  };

  if (loading) {
    return (
      <ErrorBlock
        title="Загрузка уведомлений..."
        message="Пожалуйста, подождите, пока загружаются уведомления."
      />
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      <div className="mb-8">
        <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <h1 className="text-[32px] font-bold font-accent text-primary mb-0">Уведомления</h1>
          <div className="flex flex-row items-center gap-2 w-auto">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingNotification(null);
              resetForm();
              setIsModalOpen(true);
            }}
          >
            Создать уведомление
          </Button>
            <ViewSwitcher
              views={tabOptions}
              activeView={activeTab}
              onViewChange={setActiveTab}
              size="md"
              className="w-auto"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-gray">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">Название</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">Повторяемость</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">Шаблон</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">Дата и время</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">Действия</th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray/20">
              {(activeTab === 'active'
                ? notifications.filter(n => n.isActive && n.status === 'active')
                : notifications.filter(n => !n.isActive || n.status !== 'active')
              ).map((notification, index) => (
                <tr key={notification.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{notification.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getRecurrenceText(notification)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {templates.find(t => t.id === notification.templateId)?.name || 'Не указан'}
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {notification.endDate ? new Date(notification.endDate).toLocaleDateString('ru-RU') : '—'}
                    {notification.sendTime ? (
                      <span className="ml-2">{notification.sendTime.slice(0,5)}</span>
                    ) : null}
                </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(notification)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendManually(notification.id)}
                        className="text-green-600 hover:text-green-900"
                      title="Отправить сейчас"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                      {/* Кнопка 'Запустить' только для повторяющихся уведомлений и только если неактивно */}
                      {notification.recurrence !== 'once' && !notification.isActive && (
                        <button
                          onClick={async () => {
                            await api.updateNotification(notification.id, { isActive: true, status: 'active' });
                            showNotification('Уведомление запущено', 'success');
                            await loadNotifications();
                            setActiveTab('active');
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Запустить"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {/* Кнопка 'Пауза' только для активных повторяющихся уведомлений */}
                      {notification.recurrence !== 'once' && notification.isActive && (
                    <button
                          onClick={async () => {
                            await api.updateNotification(notification.id, { isActive: false });
                            showNotification('Уведомление приостановлено', 'success');
                            await loadNotifications();
                            setActiveTab('sent');
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Поставить на паузу"
                        >
                          <Pause className="w-4 h-4" />
                    </button>
                      )}
                    <button
                      onClick={() => handleEdit(notification)}
                        className="text-blue-600 hover:text-blue-900"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(notification.id)}
                        className="text-orange-600 hover:text-orange-900"
                      title="Архивировать"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                        className="text-red-600 hover:text-red-900"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <NotificationModal
          isOpen={isModalOpen}
          onClose={() => {
                  setIsModalOpen(false);
                  setEditingNotification(null);
                  resetForm();
                }}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          editingNotification={editingNotification}
          templates={templates}
          chats={chats}
          recurrenceOptions={recurrenceOptions}
          weekDays={weekDays}
          getDateForInput={getDateForInput}
          RecipientsSelector={RecipientsSelector}
        />
      )}
    </div>
  );
} 