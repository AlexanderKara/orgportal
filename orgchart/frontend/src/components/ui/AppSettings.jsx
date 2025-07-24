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
  RefreshCw
} from 'lucide-react';
import Button from './Button';

const AppSettings = ({ 
  settings = {}, 
  onSettingsChange,
  className = '' 
}) => {
  const [localSettings, setLocalSettings] = useState({
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
    timeFormat: '24h',
    
    ...settings
  });

  useEffect(() => {
    // Загружаем настройки из localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setLocalSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    
    // Сохраняем в localStorage
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    
    // Уведомляем родительский компонент
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const settingsGroups = [
    {
      title: 'Отображение',
      icon: <Eye className="w-5 h-5" />,
      description: 'Настройки интерфейса и отображения данных',
      settings: [
        {
          key: 'showAnalytics',
          label: 'Показывать аналитику',
          description: 'Отображать блоки аналитики на всех страницах',
          type: 'toggle'
        },
        {
          key: 'showHelmetOverlay',
          label: 'Показывать оверлей лидов',
          description: 'Отображать иконку шлема на аватарах лидов',
          type: 'toggle'
        },
        {
          key: 'showEmployeeDetails',
          label: 'Детальная информация сотрудников',
          description: 'Показывать расширенную информацию в карточках',
          type: 'toggle'
        },
        {
          key: 'showDepartmentInfo',
          label: 'Информация об отделах',
          description: 'Отображать структуру и статистику отделов',
          type: 'toggle'
        },
        {
          key: 'showSkillLevels',
          label: 'Уровни навыков',
          description: 'Показывать прогресс-бары уровней навыков',
          type: 'toggle'
        },
        {
          key: 'showVacationStatus',
          label: 'Статус отпусков',
          description: 'Отображать статус отпусков в профилях',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Тема и внешний вид',
      icon: <Palette className="w-5 h-5" />,
      description: 'Настройки цветовой схемы и размера элементов',
      settings: [
        {
          key: 'darkMode',
          label: 'Темная тема',
          description: 'Использовать темную цветовую схему',
          type: 'toggle'
        },
        {
          key: 'compactMode',
          label: 'Компактный режим',
          description: 'Уменьшить отступы и размеры элементов',
          type: 'toggle'
        },
        {
          key: 'highContrast',
          label: 'Высокий контраст',
          description: 'Улучшить читаемость для слабовидящих',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Уведомления',
      icon: <Bell className="w-5 h-5" />,
      description: 'Настройки уведомлений и напоминаний',
      settings: [
        {
          key: 'notifications',
          label: 'Включить уведомления',
          description: 'Получать уведомления о событиях в браузере',
          type: 'toggle'
        },
        {
          key: 'emailNotifications',
          label: 'Email уведомления',
          description: 'Получать уведомления на email',
          type: 'toggle'
        },
        {
          key: 'telegramNotifications',
          label: 'Telegram уведомления',
          description: 'Получать уведомления в Telegram',
          type: 'toggle'
        },
        {
          key: 'vacationReminders',
          label: 'Напоминания об отпусках',
          description: 'Уведомления о предстоящих отпусках',
          type: 'toggle'
        },
        {
          key: 'birthdayReminders',
          label: 'Напоминания о днях рождения',
          description: 'Уведомления о днях рождения коллег',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Производительность',
      icon: <Zap className="w-5 h-5" />,
      description: 'Настройки для оптимизации работы приложения',
      settings: [
        {
          key: 'autoRefresh',
          label: 'Автообновление данных',
          description: 'Автоматически обновлять данные в фоне',
          type: 'toggle'
        },
        {
          key: 'refreshInterval',
          label: 'Интервал обновления',
          description: 'Частота автообновления данных (в минутах)',
          type: 'select',
          options: [
            { value: 5, label: '5 минут' },
            { value: 15, label: '15 минут' },
            { value: 30, label: '30 минут' },
            { value: 60, label: '1 час' }
          ],
          dependsOn: 'autoRefresh'
        },
        {
          key: 'cacheData',
          label: 'Кэширование данных',
          description: 'Сохранять данные в кэше для быстрой загрузки',
          type: 'toggle'
        },
        {
          key: 'lazyLoading',
          label: 'Ленивая загрузка',
          description: 'Загружать изображения по мере прокрутки',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Безопасность',
      icon: <Shield className="w-5 h-5" />,
      description: 'Настройки безопасности и приватности',
      settings: [
        {
          key: 'sessionTimeout',
          label: 'Таймаут сессии',
          description: 'Время неактивности до автоматического выхода (в минутах)',
          type: 'select',
          options: [
            { value: 15, label: '15 минут' },
            { value: 30, label: '30 минут' },
            { value: 60, label: '1 час' },
            { value: 120, label: '2 часа' }
          ]
        },
        {
          key: 'requireReauth',
          label: 'Повторная авторизация',
          description: 'Требовать повторную авторизацию для критических операций',
          type: 'toggle'
        },
        {
          key: 'logActivity',
          label: 'Логирование активности',
          description: 'Записывать действия пользователя в лог',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Язык и формат',
      icon: <Globe className="w-5 h-5" />,
      description: 'Настройки локализации и форматов',
      settings: [
        {
          key: 'language',
          label: 'Язык интерфейса',
          description: 'Выберите предпочитаемый язык',
          type: 'select',
          options: [
            { value: 'ru', label: 'Русский' },
            { value: 'en', label: 'English' }
          ]
        },
        {
          key: 'dateFormat',
          label: 'Формат даты',
          description: 'Способ отображения дат',
          type: 'select',
          options: [
            { value: 'DD.MM.YYYY', label: 'ДД.ММ.ГГГГ' },
            { value: 'MM/DD/YYYY', label: 'ММ/ДД/ГГГГ' },
            { value: 'YYYY-MM-DD', label: 'ГГГГ-ММ-ДД' }
          ]
        },
        {
          key: 'timeFormat',
          label: 'Формат времени',
          description: '12-часовой или 24-часовой формат',
          type: 'select',
          options: [
            { value: '12h', label: '12-часовой' },
            { value: '24h', label: '24-часовой' }
          ]
        }
      ]
    }
  ];

  const renderSetting = (setting) => {
    // Проверяем зависимости
    if (setting.dependsOn && !localSettings[setting.dependsOn]) {
      return null;
    }

    switch (setting.type) {
      case 'toggle':
        return (
          <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray/10 last:border-b-0">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">{setting.label}</h4>
              <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
            </div>
            <button
              onClick={() => handleSettingChange(setting.key, !localSettings[setting.key])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                localSettings[setting.key] ? 'bg-primary' : 'bg-transparent hover:bg-gray-100'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                  localSettings[setting.key] ? 'bg-white translate-x-6' : 'bg-gray-400 translate-x-1'
                }`}
              />
            </button>
          </div>
        );
      
      case 'select':
        return (
          <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray/10 last:border-b-0">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">{setting.label}</h4>
              <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
            </div>
            <select
              value={localSettings[setting.key]}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
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

  const handleResetSettings = () => {
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
    
    setLocalSettings(defaultSettings);
    localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
    if (onSettingsChange) {
      onSettingsChange(defaultSettings);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок с кнопками */}
      <div className="bg-white rounded-[15px] border border-gray/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Настройки приложения</h2>
            <p className="text-gray-600 mt-1">Персонализируйте интерфейс и поведение системы</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={handleResetSettings}
            >
              Сбросить
            </Button>
          </div>
        </div>

        {/* Группы настроек */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-gray/5 rounded-lg p-5 border border-gray/20">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary/10 rounded-lg mr-3">
                  <div className="text-primary">
                    {group.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{group.title}</h3>
                  <p className="text-sm text-gray-500">{group.description}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                {group.settings.map(renderSetting)}
              </div>
            </div>
          ))}
        </div>

        {/* Информация о системе */}
        <div className="mt-8 pt-6 border-t border-gray/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Версия: 1.0.0</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Последнее обновление: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Пользователь: {localStorage.getItem('userName') || 'Гость'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSettings; 