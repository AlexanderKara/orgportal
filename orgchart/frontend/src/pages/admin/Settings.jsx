import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Eye, 
  Palette, 
  Globe, 
  Shield, 
  User, 
  Monitor,
  Smartphone,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  Zap,
  Database,
  RefreshCw,
  Save,
  X
} from 'lucide-react';
import { showNotification } from '../../utils/notifications';
import api from '../../services/api';
import Checkbox from '../../components/ui/Checkbox';

export default function AppSettings() {
  const [settings, setSettings] = useState({
    // Отображение
    showAnalytics: true,
    showHelmetOverlay: true,
    showEmployeeDetails: true,
    showDepartmentInfo: true,
    showSkillLevels: true,
    showVacationStatus: true,
    
    // Тема
    darkMode: false,
    compactMode: false,
    highContrast: false,
    
    // Уведомления
    notifications: true,
    emailNotifications: true,
    telegramNotifications: true,
    vacationReminders: true,
    birthdayReminders: true,
    
    // Производительность
    autoRefresh: false,
    refreshInterval: 30,
    cacheData: true,
    lazyLoading: true,
    
    // Безопасность
    sessionTimeout: 30,
    requireReauth: false,
    logActivity: true,
    
    // Язык и регион
    language: 'ru',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Здесь можно загрузить настройки с сервера
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotification('Ошибка загрузки настроек', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Сохраняем в localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // Здесь можно отправить настройки на сервер
      // await api.request('/api/settings', {
      //   method: 'PUT',
      //   body: JSON.stringify(settings)
      // });
      
      showNotification('Настройки сохранены', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Ошибка сохранения настроек', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все настройки?')) {
      const defaultSettings = {
        showAnalytics: true,
        showHelmetOverlay: true,
        showEmployeeDetails: true,
        showDepartmentInfo: true,
        showSkillLevels: true,
        showVacationStatus: true,
        darkMode: false,
        compactMode: false,
        highContrast: false,
        notifications: true,
        emailNotifications: true,
        telegramNotifications: true,
        vacationReminders: true,
        birthdayReminders: true,
        autoRefresh: false,
        refreshInterval: 30,
        cacheData: true,
        lazyLoading: true,
        sessionTimeout: 30,
        requireReauth: false,
        logActivity: true,
        language: 'ru',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h'
      };
      setSettings(defaultSettings);
      localStorage.removeItem('appSettings');
      showNotification('Настройки сброшены', 'success');
    }
  };

  const settingsGroups = [
    {
      title: 'Отображение',
      icon: <Eye className="w-5 h-5" />,
      settings: [
        { key: 'showAnalytics', label: 'Показывать аналитику', type: 'checkbox' },
        { key: 'showHelmetOverlay', label: 'Показывать оверлей шлема', type: 'checkbox' },
        { key: 'showEmployeeDetails', label: 'Показывать детали сотрудников', type: 'checkbox' },
        { key: 'showDepartmentInfo', label: 'Показывать информацию об отделах', type: 'checkbox' },
        { key: 'showSkillLevels', label: 'Показывать уровни навыков', type: 'checkbox' },
        { key: 'showVacationStatus', label: 'Показывать статус отпусков', type: 'checkbox' }
      ]
    },
    {
      title: 'Тема',
      icon: <Palette className="w-5 h-5" />,
      settings: [
        { key: 'darkMode', label: 'Темная тема', type: 'checkbox' },
        { key: 'compactMode', label: 'Компактный режим', type: 'checkbox' },
        { key: 'highContrast', label: 'Высокий контраст', type: 'checkbox' }
      ]
    },
    {
      title: 'Уведомления',
      icon: <Bell className="w-5 h-5" />,
      settings: [
        { key: 'notifications', label: 'Включить уведомления', type: 'checkbox' },
        { key: 'emailNotifications', label: 'Email уведомления', type: 'checkbox' },
        { key: 'telegramNotifications', label: 'Telegram уведомления', type: 'checkbox' },
        { key: 'vacationReminders', label: 'Напоминания об отпусках', type: 'checkbox' },
        { key: 'birthdayReminders', label: 'Напоминания о днях рождения', type: 'checkbox' }
      ]
    },
    {
      title: 'Производительность',
      icon: <Zap className="w-5 h-5" />,
      settings: [
        { key: 'autoRefresh', label: 'Автообновление', type: 'checkbox' },
        { key: 'refreshInterval', label: 'Интервал обновления (сек)', type: 'number', min: 10, max: 300 },
        { key: 'cacheData', label: 'Кэширование данных', type: 'checkbox' },
        { key: 'lazyLoading', label: 'Ленивая загрузка', type: 'checkbox' }
      ]
    },
    {
      title: 'Безопасность',
      icon: <Shield className="w-5 h-5" />,
      settings: [
        { key: 'sessionTimeout', label: 'Таймаут сессии (мин)', type: 'number', min: 5, max: 480 },
        { key: 'requireReauth', label: 'Требовать повторную авторизацию', type: 'checkbox' },
        { key: 'logActivity', label: 'Логировать активность', type: 'checkbox' }
      ]
    },
    {
      title: 'Язык и регион',
      icon: <Globe className="w-5 h-5" />,
      settings: [
        { 
          key: 'language', 
          label: 'Язык', 
          type: 'select', 
          options: [
            { value: 'ru', label: 'Русский' },
            { value: 'en', label: 'English' }
          ]
        },
        { 
          key: 'dateFormat', 
          label: 'Формат даты', 
          type: 'select', 
          options: [
            { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
          ]
        },
        { 
          key: 'timeFormat', 
          label: 'Формат времени', 
          type: 'select', 
          options: [
            { value: '24h', label: '24 часа' },
            { value: '12h', label: '12 часов' }
          ]
        }
      ]
    }
  ];

  const renderSetting = (setting) => {
    const value = settings[setting.key];
    
    switch (setting.type) {
      case 'checkbox':
        return (
          <div key={setting.key} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray/20 hover:bg-gray/5 transition-colors">
            <label htmlFor={setting.key} className="text-sm font-medium text-gray-900 cursor-pointer flex-1">
              {setting.label}
            </label>
            <Checkbox
              id={setting.key}
              checked={value}
              onChange={(checked) => handleSettingChange(setting.key, checked)}
            />
          </div>
        );
      
      case 'number':
        return (
          <div key={setting.key} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray/20 hover:bg-gray/5 transition-colors">
            <label htmlFor={setting.key} className="text-sm font-medium text-gray-900">
              {setting.label}
            </label>
            <input
              type="number"
              id={setting.key}
              value={value}
              min={setting.min}
              max={setting.max}
              onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value))}
              className="w-20 px-3 py-1 text-sm border border-gray/20 rounded focus:ring-primary focus:border-primary bg-white"
            />
          </div>
        );
      
      case 'select':
        return (
          <div key={setting.key} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray/20 hover:bg-gray/5 transition-colors">
            <label htmlFor={setting.key} className="text-sm font-medium text-gray-900">
              {setting.label}
            </label>
            <select
              id={setting.key}
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="px-3 py-1 text-sm border border-gray/20 rounded focus:ring-primary focus:border-primary bg-white"
            >
              {setting.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-none mx-auto pt-[70px]">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка настроек...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold font-accent text-primary">Настройки</h1>
          <p className="text-gray-600 mt-2">Управление настройками приложения</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 border border-gray/20 rounded-[8px] text-sm font-medium transition hover:bg-gray/10"
          >
            Сбросить
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-[8px] text-sm font-medium transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Сохранить
              </>
            )}
          </button>
        </div>
      </div>

      {/* Настройки в сетке */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {settingsGroups.map((group) => (
          <div key={group.title} className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
            <div className="flex items-center gap-3 p-6 border-b border-gray/20 bg-gray/5">
              <div className="text-primary">
                {group.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{group.title}</h2>
            </div>
            <div className="p-6 space-y-3">
              {group.settings.map(renderSetting)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 