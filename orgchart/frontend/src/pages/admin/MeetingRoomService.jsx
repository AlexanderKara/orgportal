import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Activity, Clock, Users, Building2, Calendar, Settings } from 'lucide-react';
import Button from '../../components/ui/Button';
import { ErrorBlock } from '../../components/ui';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';

export default function MeetingRoomService() {
  const [serviceStatus, setServiceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadServiceStatus();
  }, []);

  const loadServiceStatus = async () => {
    try {
      setLoading(true);
      const response = await api.getMeetingRoomServiceStatus();
      setServiceStatus(response?.data || response);
    } catch (error) {
      console.error('Error loading meeting room service status:', error);
      setServiceStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = async () => {
    try {
      setProcessing(true);
      
      if (serviceStatus?.serviceStatus === 'running') {
        await api.stopMeetingRoomService();
        showNotification('Сервис переговорок остановлен', 'success');
      } else {
        await api.startMeetingRoomService();
        showNotification('Сервис переговорок запущен', 'success');
      }
      
      await loadServiceStatus();
    } catch (error) {
      console.error('Error toggling meeting room service:', error);
      showNotification('Ошибка при изменении статуса сервиса', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessNow = async () => {
    try {
      setProcessing(true);
      await api.processMeetingRoomTasksNow();
      showNotification('Задачи переговорок обработаны', 'success');
    } catch (error) {
      console.error('Error processing meeting room tasks:', error);
      showNotification('Ошибка при обработке задач', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <ErrorBlock
        title="Загрузка сервиса переговорок"
        message="Пожалуйста, подождите, пока мы загружаем статус сервиса."
      />
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold font-accent text-primary">Сервис переговорок</h1>
            <p className="text-gray-600 mt-2">Управление автоматической обработкой задач переговорных комнат</p>
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
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Всего комнат</h3>
              <p className="text-2xl font-bold text-blue-600">{serviceStatus?.totalRooms || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-[8px] bg-green-500/10 text-green-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Активные комнаты</h3>
              <p className="text-2xl font-bold text-green-600">{serviceStatus?.activeRooms || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-[8px] bg-purple-500/10 text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Бронирования сегодня</h3>
              <p className="text-2xl font-bold text-purple-600">{serviceStatus?.todayBookings || 0}</p>
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
              <p className="text-sm text-gray-600">Сервис проверяет задачи переговорок каждую минуту</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Активные бронирования</h3>
              <p className="text-sm text-gray-600">
                Отслеживание текущих встреч и их статуса
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Building2 className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Конфликты расписания</h3>
              <p className="text-sm text-gray-600">
                Автоматическое выявление пересечений в расписании комнат
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Settings className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Очистка данных</h3>
              <p className="text-sm text-gray-600">
                Автоматическое удаление старых отмененных бронирований (старше 30 дней)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Дополнительная статистика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Общая статистика</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Всего бронирований:</span>
              <span className="font-semibold">{serviceStatus?.totalBookings || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Активные комнаты:</span>
              <span className="font-semibold text-green-600">{serviceStatus?.activeRooms || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Бронирования сегодня:</span>
              <span className="font-semibold text-blue-600">{serviceStatus?.todayBookings || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Функции сервиса</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Мониторинг активных встреч</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Проверка конфликтов расписания</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Очистка устаревших данных</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Сбор статистики использования</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}