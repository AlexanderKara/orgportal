import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Activity, Clock, Users, Bell, Settings } from 'lucide-react';
import Button from '../../components/ui/Button';
import { ErrorBlock } from '../../components/ui';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';

export default function NotificationService() {
  const [serviceStatus, setServiceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadServiceStatus();
  }, []);

  const loadServiceStatus = async () => {
    try {
      setLoading(true);
      const response = await api.getNotificationServiceStatus();
      setServiceStatus(response?.data || response);
    } catch (error) {
      console.error('Error loading service status:', error);
      setServiceStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = async () => {
    try {
      setProcessing(true);
      
      if (serviceStatus?.serviceStatus === 'running') {
        await api.stopNotificationService();
        // Показываем нативное уведомление
        showNotification('Сервис уведомлений остановлен', 'success');
      } else {
        await api.startNotificationService();
        // Показываем нативное уведомление
        showNotification('Сервис уведомлений запущен', 'success');
      }
      
      await loadServiceStatus();
    } catch (error) {
      console.error('Error toggling service:', error);
      showNotification('Ошибка при изменении статуса сервиса', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessNow = async () => {
    try {
      setProcessing(true);
      await api.processNotificationsNow();
      showNotification('Уведомления обработаны', 'success');
    } catch (error) {
      console.error('Error processing notifications:', error);
      showNotification('Ошибка при обработке уведомлений', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <ErrorBlock
        title="Загрузка сервиса уведомлений"
        message="Пожалуйста, подождите, пока мы загружаем статус сервиса."
      />
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold font-accent text-primary">Сервис уведомлений</h1>
            <p className="text-gray-600 mt-2">Управление автоматической отправкой уведомлений</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={serviceStatus?.serviceStatus === 'running' ? 'danger' : 'success'}
              icon={serviceStatus?.serviceStatus === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              onClick={handleToggleService}
              disabled={processing}
              className={serviceStatus?.serviceStatus === 'running' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
            >
              {serviceStatus?.serviceStatus === 'running' ? 'Остановить сервис' : 'Запустить сервис'}
            </Button>
            <Button
              variant="primary"
              icon={<RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />}
              onClick={handleProcessNow}
              disabled={processing}
            >
              Обработать сейчас
            </Button>
          </div>
        </div>
      </div>

      {/* Статус сервиса */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-[8px] ${
              serviceStatus?.serviceStatus === 'running' 
                ? 'bg-green-500/10 text-green-600' 
                : 'bg-red-500/10 text-red-600'
            }`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Статус сервиса</h3>
              <p className="text-sm text-gray-600">
                {serviceStatus?.serviceStatus === 'running' ? 'Работает' : 'Остановлен'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-[8px] bg-blue-500/10 text-blue-600">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Активные уведомления</h3>
              <p className="text-2xl font-bold text-blue-600">{serviceStatus?.activeNotifications || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-[8px] bg-purple-500/10 text-purple-600">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Шаблоны</h3>
              <p className="text-2xl font-bold text-purple-600">{serviceStatus?.totalTemplates || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-[8px] bg-orange-500/10 text-orange-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Активные чаты</h3>
              <p className="text-2xl font-bold text-orange-600">{serviceStatus?.activeChats || 0}</p>
            </div>
          </div>
        </div>
      </div>



      {/* Информация о работе сервиса */}
      <div className="bg-white rounded-[15px] border border-gray/50 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Информация о работе</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Частота проверки</h3>
              <p className="text-sm text-gray-600">Сервис проверяет уведомления каждую минуту</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Bell className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Автоматическая отправка</h3>
              <p className="text-sm text-gray-600">
                Уведомления отправляются автоматически согласно настройкам повторяемости
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Отправка в чаты</h3>
              <p className="text-sm text-gray-600">
                Уведомления отправляются во все активные чаты и группы
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Settings className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Замена тегов</h3>
              <p className="text-sm text-gray-600">
                Автоматическая замена тегов на актуальные данные (именинники, отпуска)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 