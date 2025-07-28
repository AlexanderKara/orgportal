import React, { useState, useEffect } from 'react';
import { Settings, Clock, Globe, Calendar, Mail, Zap, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';
import Checkbox from '../../components/ui/Checkbox';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const DistributionSettings = () => {
  const handleError = useErrorHandler();
  
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
      
      // Обрабатываем разные форматы ответа
      const settingsData = response.data || response;
      
      if (settingsData) {
        const updatedSettings = {
          ...settings,
          ...settingsData,
          executionTime: settingsData.executionTime?.substring(0, 5) || '09:00'
        };
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error loading distribution settings:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Валидация на фронтенде
      if (settings.notificationOnError && (!settings.notificationEmail || settings.notificationEmail.trim() === '')) {
        showNotification('Email для уведомлений обязателен при включенных уведомлениях', 'error');
        return;
      }
      
      // Автоматически отключаем уведомления, если email пустой
      const settingsToSave = {
        ...settings,
        executionTime: settings.executionTime + ':00',
        notificationOnError: settings.notificationOnError && settings.notificationEmail && settings.notificationEmail.trim() !== ''
      };
      
      await api.put('/api/distribution-settings', settingsToSave);
      
      showNotification('Настройки сохранены успешно', 'success');
      
      // Перезагружаем настройки с сервера для синхронизации
      await loadSettings();
      
    } catch (error) {
      console.error('Error saving distribution settings:', error);
      handleError(error);
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
      <div className="w-full max-w-none mx-auto pt-[70px]">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка настроек...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Заголовок страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">
            Настройки распределения токенов
          </h1>
          <p className="text-sm text-gray-600">
            Управление автоматическим распределением токенов между сотрудниками
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Сбросить</span>
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[8px] font-medium transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${settings.serviceEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">Статус сервиса</span>
          </div>
          <div className="text-2xl font-bold text-dark">
            {settings.serviceEnabled ? 'Включен' : 'Отключен'}
          </div>
        </div>
        
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Время выполнения</span>
          </div>
          <div className="text-2xl font-bold text-dark">{settings.executionTime}</div>
        </div>
        
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Часовой пояс</span>
          </div>
          <div className="text-2xl font-bold text-dark">{settings.timezone.split('/')[1]}</div>
        </div>
        
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Размер батча</span>
          </div>
          <div className="text-2xl font-bold text-dark">{settings.distributionBatchSize}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Основные настройки */}
        <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray/20 bg-gray/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-dark">Основные настройки</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Включение сервиса */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-[12px] p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 mt-1">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <Checkbox
                    checked={settings.serviceEnabled}
                    onChange={(e) => setSettings({ ...settings, serviceEnabled: e.target.checked })}
                    label="Включить автоматическое распределение"
                    className="text-base font-semibold"
                  />
                  <p className="text-sm text-gray-600 mt-1 ml-6">
                Глобальное включение/отключение сервиса распределения токенов
              </p>
                </div>
              </div>
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
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <p className="text-sm text-gray-500 mt-1">
                Количество сотрудников в одном батче (1-1000)
              </p>
            </div>
          </div>
        </div>

        {/* Рабочие дни и праздники */}
        <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray/20 bg-gray/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-dark">Рабочие дни</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Только рабочие дни */}
            <div>
              <Checkbox
                checked={settings.workingDaysOnly}
                onChange={(e) => setSettings({ ...settings, workingDaysOnly: e.target.checked })}
                label="Выполнять только в рабочие дни"
              />
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
                          : 'bg-gray/10 text-gray-700 hover:bg-gray/20'
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
                    className="flex-1 px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    onClick={addHoliday}
                    disabled={!newHoliday}
                    className="px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 disabled:bg-gray/20 disabled:cursor-not-allowed transition-colors"
                  >
                    Добавить
                  </button>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {settings.holidays.map(holiday => (
                    <div key={holiday} className="flex items-center justify-between bg-gray/5 px-3 py-2 rounded-[8px]">
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
        <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray/20 bg-gray/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-dark">Обработка ошибок</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
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
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <Checkbox
                checked={settings.notificationOnError}
                onChange={(e) => setSettings({ ...settings, notificationOnError: e.target.checked })}
                label="Отправлять уведомления при ошибках"
              />

              {settings.notificationOnError && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email для уведомлений
                  </label>
                  <input
                    type="email"
                    value={settings.notificationEmail}
                    onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                    placeholder="admin@company.com"
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Производительность */}
        <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray/20 bg-gray/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-dark">Производительность</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
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
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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