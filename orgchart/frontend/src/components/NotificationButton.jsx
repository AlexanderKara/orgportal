import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react';
import api from '../services/api';

export default function NotificationButton() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (showDropdown) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showDropdown]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.getUserNotifications();
      // Проверяем структуру ответа и устанавливаем значения по умолчанию
      const notificationsData = response?.notifications || response || [];
      const unreadCountData = response?.unread_count || 0;
      
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setUnreadCount(typeof unreadCountData === 'number' ? unreadCountData : 0);
    } catch (error) {
      console.error('Ошибка при загрузке уведомлений:', error);
      // Устанавливаем значения по умолчанию при ошибке
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Ошибка при отметке уведомления как прочитанного:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений как прочитанных:', error);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
      return `${diffInMinutes} мин назад`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ч назад`;
    } else {
      return notificationDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'meeting':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'system':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking':
        return 'border-l-blue-500 bg-blue-50';
      case 'meeting':
        return 'border-l-green-500 bg-green-50';
      case 'system':
        return 'border-l-orange-500 bg-orange-50';
      case 'reminder':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const dropdownWidth = 320; // w-80 = 20rem = 320px
      
      // Вычисляем позицию справа
      let right = windowWidth - rect.right;
      
      // Если dropdown выходит за правый край экрана, позиционируем слева от кнопки
      if (right < 20) {
        right = windowWidth - rect.left + 20;
      }
      
      setDropdownPosition({
        top: rect.bottom + 8, // 8px отступ от кнопки
        right: right
      });
    }
  };

  const handleToggleDropdown = () => {
    if (!showDropdown) {
      calculateDropdownPosition();
    }
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="relative">
      {/* Кнопка уведомлений */}
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg transition-colors"
        aria-label="Уведомления"
        ref={buttonRef}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown меню через портал */}
      {showDropdown && createPortal(
        <>
          {/* Overlay для закрытия при клике вне */}
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown меню */}
          <div 
            className="fixed w-80 bg-white rounded-[15px] shadow-xl border border-gray/50 z-[99999] max-h-[500px] flex flex-col"
            style={{
              top: dropdownPosition.top,
              right: dropdownPosition.right
            }}
          >
            {/* Заголовок */}
            <div className="p-3 border-b border-gray/200 bg-gray/50 rounded-t-[15px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-dark">Уведомления</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Отметить все
                  </button>
                )}
              </div>
            </div>

            {/* Список уведомлений */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-gray-600">Загрузка...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-dark mb-1">Нет уведомлений</h3>
                  <p className="text-xs text-gray-600">У вас пока нет уведомлений</p>
                </div>
              ) : (
                <div className="divide-y divide-gray/200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray/50 transition-colors cursor-pointer border-l-4 ${
                        !notification.is_read ? 'bg-blue-50 border-l-blue-500' : getNotificationColor(notification.type)
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-dark leading-tight">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Футер */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray/200 bg-gray/50 rounded-b-[15px]">
                <button
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-center text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Закрыть
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
} 