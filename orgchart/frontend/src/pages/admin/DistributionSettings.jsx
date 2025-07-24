import React, { useState, useEffect } from 'react';
import { Settings, Clock, Globe, Calendar, Mail, Zap, Save, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';

const DistributionSettings = () => {
  const [settings, setSettings] = useState({
    serviceEnabled: true,
    executionTime: '09:00',
    timezone: 'Europe/Moscow',
    workingDaysOnly: true,
    workingDays: [1, 2, 3, 4, 5],
    holidays: [],
    retryAttempts: 3,
    retryDelay: 60,
    notificationOnError: true,
    notificationEmail: '',
    maxConcurrentDistributions: 1,
    distributionBatchSize: 100
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newHoliday, setNewHoliday] = useState('');

  const timezones = [
    'Europe/Moscow',
    'Europe/Kaliningrad', 
    'Asia/Yekaterinburg',
    'Asia/Omsk',
    'Asia/Krasnoyarsk',
    'Asia/Irkutsk',
    'Asia/Yakutsk',
    'Asia/Vladivostok',
    'Asia/Magadan',
    'Asia/Kamchatka'
  ];

  const weekDays = [
    { value: 1, label: 'Пн' },
    { value: 2, label: 'Вт' },
    { value: 3, label: 'Ср' },
    { value: 4, label: 'Чт' },
    { value: 5, label: 'Пт' },
    { value: 6, label: 'Сб' },
    { value: 7, label: 'Вс' }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/distribution-settings');
      if (response.data) {
        setSettings({
          ...settings,
          ...response.data,
          executionTime: response.data.executionTime?.substring(0, 5) || '09:00'
        });
      }
    } catch (error) {
      console.error('Error loading distribution settings:', error);
      showNotification('Ошибка загрузки настроек', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/api/distribution-settings', {
        ...settings,
        executionTime: settings.executionTime + ':00'
      });
      
      showNotification('Настройки сохранены успешно', 'success');
      
    } catch (error) {
      console.error('Error saving distribution settings:', error);
      showNotification('Ошибка при сохранении настроек', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkingDay = (day) => {
    const newWorkingDays = settings.workingDays.includes(day)
      ? settings.workingDays.filter(d => d !== day)
      : [...settings.workingDays, day].sort();
    
    setSettings({ ...settings, workingDays: newWorkingDays });
  };

  const addHoliday = () => {
    if (newHoliday && !settings.holidays.includes(newHoliday)) {
      setSettings({
        ...settings,
        holidays: [...settings.holidays, newHoliday].sort()
      });
      setNewHoliday('');
    }
  };

  const removeHoliday = (holiday) => {
    setSettings({
      ...settings,
      holidays: settings.holidays.filter(h => h !== holiday)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Заголовок */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[24px] lg:text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Настройки рассылки токенов</h1>
          <p className="text-gray-600 hidden lg:block">
            Управление автоматическим распределением токенов между сотрудниками
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadSettings}
            disabled={saving}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden lg:inline">Сбросить</span>
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden lg:inline">{saving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>

      {/* Статистика / Статус сервиса */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${settings.serviceEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">Статус сервиса</span>
          </div>
          <div className="text-lg font-bold text-dark">
            {settings.serviceEnabled ? 'Включен' : 'Отключен'}
          </div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Время выполнения</span>
          </div>
          <div className="text-lg font-bold text-dark">{settings.executionTime}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Часовой пояс</span>
          </div>
          <div className="text-lg font-bold text-dark">{settings.timezone.split('/')[1]}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Размер батча</span>
          </div>
          <div className="text-lg font-bold text-dark">{settings.distributionBatchSize}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Основные настройки */}
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-[8px] bg-primary/10 text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-dark">Основные настройки</h3>
          </div>

          <div className="space-y-6">
            {/* Включение сервиса */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.serviceEnabled}
                    onChange={(e) => setSettings({ ...settings, serviceEnabled: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    settings.serviceEnabled ? 'bg-primary' : 'bg-gray-300'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      settings.serviceEnabled ? 'translate-x-6 mt-1 ml-0.5' : 'translate-x-1 mt-1'
                    }`}></div>
                  </div>
                </div>
                <span className="text-base font-medium text-dark">
                  Включить автоматическое распределение
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-14">
                Глобальное включение/отключение сервиса
              </p>
            </div>

            {/* Время выполнения */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Время выполнения
              </label>
              <input
                type="time"
                value={settings.executionTime}
                onChange={(e) => setSettings({ ...settings, executionTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Часовой пояс */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Часовой пояс
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            {/* Размер батча */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Размер батча
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={settings.distributionBatchSize}
                onChange={(e) => setSettings({ ...settings, distributionBatchSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-sm text-gray-500 mt-1">
                Количество сотрудников в одном батче (1-1000)
              </p>
            </div>
          </div>
        </div>

        {/* Рабочие дни и праздники */}
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-[8px] bg-blue-500/10 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-dark">Рабочие дни</h3>
          </div>

          <div className="space-y-6">
            {/* Только рабочие дни */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.workingDaysOnly}
                    onChange={(e) => setSettings({ ...settings, workingDaysOnly: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    settings.workingDaysOnly ? 'bg-primary' : 'bg-gray-300'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      settings.workingDaysOnly ? 'translate-x-6 mt-1 ml-0.5' : 'translate-x-1 mt-1'
                    }`}></div>
                  </div>
                </div>
                <span className="text-base font-medium text-dark">
                  Выполнять только в рабочие дни
                </span>
              </label>
            </div>

            {/* Дни недели */}
            {settings.workingDaysOnly && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Рабочие дни недели:</p>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day.value}
                      onClick={() => toggleWorkingDay(day.value)}
                      className={`px-3 py-2 text-sm font-medium rounded-[8px] transition-colors ${
                        settings.workingDays.includes(day.value)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Праздники */}
            {settings.workingDaysOnly && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Праздничные дни</p>
                
                <div className="flex gap-2 mb-3">
                  <input
                    type="date"
                    value={newHoliday}
                    onChange={(e) => setNewHoliday(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={addHoliday}
                    disabled={!newHoliday}
                    className="px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Добавить
                  </button>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {settings.holidays.map(holiday => (
                    <div key={holiday} className="flex items-center justify-between bg-gray/10 px-3 py-2 rounded-[8px]">
                      <span className="text-sm text-gray-700">{holiday}</span>
                      <button
                        onClick={() => removeHoliday(holiday)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {settings.holidays.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Праздничные дни не добавлены
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Настройки ошибок */}
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-[8px] bg-red-500/10 text-red-600">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-dark">Обработка ошибок</h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Количество попыток
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.retryAttempts}
                  onChange={(e) => setSettings({ ...settings, retryAttempts: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Задержка (мин)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.retryDelay}
                  onChange={(e) => setSettings({ ...settings, retryDelay: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer mb-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.notificationOnError}
                    onChange={(e) => setSettings({ ...settings, notificationOnError: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    settings.notificationOnError ? 'bg-primary' : 'bg-gray-300'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      settings.notificationOnError ? 'translate-x-6 mt-1 ml-0.5' : 'translate-x-1 mt-1'
                    }`}></div>
                  </div>
                </div>
                <span className="text-base font-medium text-dark">
                  Отправлять уведомления при ошибках
                </span>
              </label>

              {settings.notificationOnError && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email для уведомлений
                  </label>
                  <input
                    type="email"
                    value={settings.notificationEmail}
                    onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                    placeholder="admin@company.com"
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Производительность */}
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-[8px] bg-purple-500/10 text-purple-600">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-dark">Производительность</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Максимум одновременных распределений
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxConcurrentDistributions}
                onChange={(e) => setSettings({ ...settings, maxConcurrentDistributions: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-sm text-gray-500 mt-1">
                Рекомендуется: 1-3 для большинства систем
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionSettings; 