import React, { useState, useEffect } from 'react';
import { Cog, Edit, Pause, Play, Archive, Trash2, Users, MessageCircle, RefreshCw, Plus, User } from 'lucide-react';
import NotificationChatModal from '../../components/NotificationChatModal';
import Button from '../../components/ui/Button';
import Table, { TableBody, TableRow, ActionsCell } from '../../components/ui/Table';
import { ErrorBlock } from '../../components/ui';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';

export default function NotificationSettings() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChat, setEditingChat] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [telegramAvatars, setTelegramAvatars] = useState(new Map());
  const [loadingAvatars, setLoadingAvatars] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'chat',
    isActive: true,
    commands: {
      notifications: true,
      birthdays: true,
      vacations: true,
      help: true,
      auth: true
    },
    allowedUsers: []
  });

  const chatTypes = [
    { value: 'chat', label: 'Чат', icon: <MessageCircle className="w-4 h-4" /> },
    { value: 'group', label: 'Группа', icon: <Users className="w-4 h-4" /> }
  ];

  const availableCommands = [
    { key: 'notifications', label: 'Уведомления', description: 'Отправка уведомлений' },
    { key: 'birthdays', label: 'Дни рождения', description: 'Информация о днях рождения' },
    { key: 'vacations', label: 'Отпуска', description: 'Информация об отпусках' },
    { key: 'help', label: 'Помощь', description: 'Справка по командам' },
    { key: 'auth', label: 'Авторизация', description: 'Вход по коду через Telegram' },
  ];

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      
      const response = await api.getNotificationChats();
      
      const chatsData = response?.data || response || [];
      
      setChats(chatsData);
      
      // Загружаем аватары для личных чатов
      await loadTelegramAvatars(chatsData);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTelegramAvatars = async (chatsData) => {
    if (chatsData.length === 0) return;
    
    setLoadingAvatars(true);
    const avatarPromises = [];
    const newAvatars = new Map();
    
    for (const chat of chatsData) {
      if (chat.chatId) {
        // Для личных чатов userId = chatId, для групп используем chatId как userId
        const userId = chat.type === 'user' ? chat.chatId : null;
        
        try {
          const result = await api.getTelegramAvatar(chat.chatId, userId);
          
          if (result.avatarUrl) {
            newAvatars.set(chat.chatId, result.avatarUrl);
          }
        } catch (error) {
          console.warn(`Failed to load avatar for ${chat.name}:`, error);
        }
      }
    }
    
    setTelegramAvatars(newAvatars);
    setLoadingAvatars(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingChat) {
        await api.updateNotificationChat(editingChat.id, formData);
        showNotification('Данные получателя обновлены', 'success');
      } else {
        await api.createNotificationChat(formData);
        showNotification('Получатель добавлен', 'success');
      }
      setIsModalOpen(false);
      setEditingChat(null);
      resetForm();
      loadChats();
    } catch (error) {
      console.error('Error saving chat:', error);
      showNotification('Ошибка при сохранении получателя', 'error');
    }
  };

  const handleEdit = (chat) => {
    setEditingChat(chat);
    setFormData({
      name: chat.name,
      type: chat.type,
      isActive: chat.isActive,
      commands: chat.commands || {
        notifications: true,
        birthdays: true,
        vacations: true,
        help: true,
        auth: true
      },
      allowedUsers: chat.allowedUsers || []
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (chatId) => {
    try {
      const chat = chats.find(c => c.id === chatId);
      const newStatus = !chat.isActive;
      await api.updateNotificationChat(chatId, { isActive: newStatus });
      showNotification(`Получатель ${newStatus ? 'активирован' : 'приостановлен'}`, 'success');
      loadChats();
    } catch (error) {
      console.error('Error toggling chat status:', error);
      showNotification('Ошибка при изменении статуса получателя', 'error');
    }
  };

  const handleArchive = async (chatId) => {
    try {
      await api.updateNotificationChat(chatId, { status: 'archived' });
      showNotification('Получатель архивирован', 'success');
      loadChats();
    } catch (error) {
      console.error('Error archiving chat:', error);
      showNotification('Ошибка при архивировании получателя', 'error');
    }
  };

  const handleDelete = async (chatId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот чат?')) {
      try {
        await api.deleteNotificationChat(chatId);
        showNotification('Получатель удалён', 'success');
        loadChats();
      } catch (error) {
        console.error('Error deleting chat:', error);
        showNotification('Ошибка при удалении получателя', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'chat',
      isActive: true,
      commands: {
        notifications: true,
        birthdays: true,
        vacations: true,
        help: true,
        auth: true
      },
      allowedUsers: []
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedChats = [...chats].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <ErrorBlock
        title="Загрузка..."
        message="Пожалуйста, подождите, пока загружается список получателей."
      />
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold font-accent text-primary">Управление получателями</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={loadChats}
              title="Обновить список"
            >
              Обновить
            </Button>
            <Button
              variant="secondary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => loadTelegramAvatars(chats)}
              title="Обновить аватары"
              disabled={loadingAvatars}
            >
              {loadingAvatars ? 'Загрузка...' : 'Аватары'}
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingChat(null);
                resetForm();
                setIsModalOpen(true);
              }}
            >
              Добавить чат
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider cursor-pointer hover:text-gray-200"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Название</span>
                    {sortField === 'name' && (
                      <span className="text-gray-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Chat ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Команды
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray/20">
              {sortedChats.map((chat, index) => (
                <tr key={chat.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      {loadingAvatars ? (
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          chat.type === 'chat' 
                            ? 'bg-blue-100' 
                            : 'bg-green-100'
                        }`}>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        </div>
                      ) : telegramAvatars.has(chat.id) ? (
                        <img 
                          src={telegramAvatars.get(chat.id)} 
                          alt={`Telegram ${chat.type === 'chat' ? 'User' : 'Group'}`}
                          className="h-8 w-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : (
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          chat.type === 'chat' 
                            ? 'bg-blue-100' 
                            : 'bg-green-100'
                        }`}>
                          {chat.type === 'chat' ? (
                            <User className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Users className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      )}
                      {/* Fallback icon (hidden by default) */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        chat.type === 'chat' 
                          ? 'bg-blue-100' 
                          : 'bg-green-100'
                      }`} style={{ display: 'none' }}>
                        {chat.type === 'chat' ? (
                          <User className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Users className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{chat.name}</div>
                      <div className="text-sm text-gray-500">
                        {chat.type === 'chat' ? 'Личный чат' : 'Группа'}
                      </div>
                    </div>
                  </div>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">{chat.chatId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(chat.commands || {}).map(([key, enabled]) => (
                        enabled && (
                          <span 
                            key={key}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {availableCommands.find(cmd => cmd.key === key)?.label || key}
                          </span>
                        )
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      chat.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {chat.isActive ? 'Активен' : 'Пауза'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(chat)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(chat.id)}
                        className={`p-1 rounded ${
                          chat.isActive 
                            ? 'text-yellow-600 hover:text-yellow-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={chat.isActive ? 'Поставить на паузу' : 'Возобновить'}
                      >
                        {chat.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleArchive(chat.id)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded"
                        title="Архивировать"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(chat.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
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

      {/* Modal для редактирования настроек чата */}
      {isModalOpen && (
        <NotificationChatModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingChat(null);
            resetForm();
          }}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          editingChat={editingChat}
          chatTypes={chatTypes}
          availableCommands={availableCommands}
        />
      )}
    </div>
  );
} 